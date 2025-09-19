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
        const { data: newTemplate, error: createError } = await supabase
          .from('content_templates')
          .insert({
            creator_id: user.user.id,
            name: payload.name,
            type: payload.type,
            content: payload.content,
            variables: payload.variables || {},
            is_public: payload.is_public || false
          })
          .select()
          .single();

        if (createError) throw createError;
        return new Response(JSON.stringify(newTemplate), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'list':
        const { data: templates, error: listError } = await supabase
          .from('content_templates')
          .select('*')
          .or(`creator_id.eq.${user.user.id},is_public.eq.true`)
          .order('created_at', { ascending: false });

        if (listError) throw listError;
        return new Response(JSON.stringify(templates), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'use':
        // Increment usage count
        await supabase.rpc('increment_template_usage', { 
          template_id: payload.template_id 
        });

        const { data: template, error: templateError } = await supabase
          .from('content_templates')
          .select('*')
          .eq('id', payload.template_id)
          .single();

        if (templateError) throw templateError;
        return new Response(JSON.stringify(template), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'update':
        const { data: updatedTemplate, error: updateError } = await supabase
          .from('content_templates')
          .update({
            name: payload.name,
            type: payload.type,
            content: payload.content,
            variables: payload.variables,
            is_public: payload.is_public,
            updated_at: new Date().toISOString()
          })
          .eq('id', payload.id)
          .eq('creator_id', user.user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedTemplate), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'delete':
        const { error: deleteError } = await supabase
          .from('content_templates')
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
    console.error('Error in templates-manager function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});