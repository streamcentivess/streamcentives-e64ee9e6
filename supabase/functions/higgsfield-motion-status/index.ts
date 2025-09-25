import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobSetId } = await req.json();
    if (!jobSetId) {
      return new Response(
        JSON.stringify({ success: false, error: 'jobSetId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check storage for the generated video first
    const folder = 'higgsfield-motion';
    const fileName = `${jobSetId}.mp4`;

    const { data: files, error: listError } = await supabase.storage
      .from('generated-content')
      .list(folder, { search: fileName, limit: 1 });

    if (listError) {
      console.error('List error:', listError);
    }

    const found = files?.some((f: any) => f.name === fileName);

    if (found) {
      const { data: pub } = supabase.storage
        .from('generated-content')
        .getPublicUrl(`${folder}/${fileName}`);

      return new Response(
        JSON.stringify({ success: true, status: 'completed', videoUrl: pub.publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally, also check remote job status to surface failures
    const higgsFieldApiKey = Deno.env.get('HIGGSFIELD_API_KEY');
    const higgsFieldSecret = Deno.env.get('HIGGSFIELD_SECRET');

    if (higgsFieldApiKey && higgsFieldSecret) {
      const statusResponse = await fetch(`https://platform.higgsfield.ai/v1/job-sets/${jobSetId}`, {
        headers: { 'hf-api-key': higgsFieldApiKey, 'hf-secret': higgsFieldSecret },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const failed = statusData.jobs && statusData.jobs.some((j: any) => j.status === 'failed' || j.status === 'nsfw');
        if (failed) {
          return new Response(
            JSON.stringify({ success: true, status: 'failed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Not ready yet
    return new Response(
      JSON.stringify({ success: true, status: 'processing' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Motion status error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
