import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user.user) {
      throw new Error('Unauthorized');
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'create':
        const { data: newContent, error: createError } = await supabase
          .from('scheduled_content')
          .insert({
            creator_id: user.user.id,
            title: payload.title,
            content: payload.content,
            content_type: payload.content_type,
            platforms: payload.platforms,
            media_urls: payload.media_urls || [],
            hashtags: payload.hashtags || [],
            scheduled_time: payload.scheduled_time,
            status: payload.status || 'draft',
            metadata: payload.metadata || {}
          })
          .select()
          .single();

        if (createError) throw createError;
        return new Response(JSON.stringify(newContent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'list':
        const { data: contentList, error: listError } = await supabase
          .from('scheduled_content')
          .select('*')
          .eq('creator_id', user.user.id)
          .order('scheduled_time', { ascending: true });

        if (listError) throw listError;
        return new Response(JSON.stringify(contentList), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'update':
        const { data: updatedContent, error: updateError } = await supabase
          .from('scheduled_content')
          .update({
            title: payload.title,
            content: payload.content,
            content_type: payload.content_type,
            platforms: payload.platforms,
            media_urls: payload.media_urls,
            hashtags: payload.hashtags,
            scheduled_time: payload.scheduled_time,
            status: payload.status,
            metadata: payload.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', payload.id)
          .eq('creator_id', user.user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedContent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'delete':
        const { error: deleteError } = await supabase
          .from('scheduled_content')
          .delete()
          .eq('id', payload.id)
          .eq('creator_id', user.user.id);

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in content-scheduler function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});