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
    const { imageUrl, prompt, motionId, type } = await req.json();
    
    const higgsFieldApiKey = Deno.env.get('HIGGSFIELD_API_KEY');
    const higgsFieldSecret = Deno.env.get('HIGGSFIELD_SECRET');
    
    if (!higgsFieldApiKey || !higgsFieldSecret) {
      throw new Error('HiggsField API credentials not configured');
    }

    console.log('Using motion template:', motionId);
    console.log('Motion ID:', motionId);

    if (!imageUrl) {
      throw new Error('Image URL is required for motion generation');
    }

    console.log('Starting image2video generation with HiggsField...');

    // Create image-to-video generation request using new API
    const createResponse = await fetch('https://platform.higgsfield.ai/v1/image2video', {
      method: 'POST',
      headers: {
        'hf-api-key': higgsFieldApiKey,
        'hf-secret': higgsFieldSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        params: {
          model: 'dop-lite',
          prompt: prompt || 'Add subtle movement to the image',
          seed: Math.floor(Math.random() * 1000000) + 1,
          motions: [{
            id: motionId || 'object-drift',
            strength: 0.5
          }],
          input_images: [{
            type: 'image_url',
            image_url: imageUrl
          }],
          enhance_prompt: true,
          check_nsfw: true
        }
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('HiggsField creation error:', errorText);
      throw new Error(`HiggsField API error: ${createResponse.status} ${errorText}`);
    }

    const createData = await createResponse.json();
    const jobSetId = createData.id;
    
    console.log('HiggsField job set created:', jobSetId);

    // Kick off background polling + upload, and return immediately
    EdgeRuntime.waitUntil((async () => {
      try {
        let attempts = 0;
        const maxAttempts = 120; // up to ~10 minutes
        const pollDelayMs = 5000;

        // Initialize Supabase client once
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollDelayMs));

          const statusResponse = await fetch(`https://platform.higgsfield.ai/v1/job-sets/${jobSetId}`, {
            headers: {
              'hf-api-key': higgsFieldApiKey,
              'hf-secret': higgsFieldSecret,
            },
          });

          if (!statusResponse.ok) {
            console.error('Status check failed:', statusResponse.status);
            attempts++;
            continue;
          }

          const statusData = await statusResponse.json();
          console.log('Status check:', statusData);

          // If any job failed or flagged as nsfw, stop
          const failed = statusData.jobs && statusData.jobs.some((job: any) => job.status === 'failed' || job.status === 'nsfw');
          if (failed) {
            console.error('HiggsField job failed:', jobSetId);
            break;
          }

          // Find the first successful job with results
          const successfulJob = statusData.jobs?.find((job: any) => job.status === 'completed' && job.results?.raw?.url);
          if (successfulJob) {
            const videoResponse = await fetch(successfulJob.results.raw.url);
            const videoBlob = await videoResponse.blob();
            const videoArrayBuffer = await videoBlob.arrayBuffer();

            const filePath = `higgsfield-motion/${jobSetId}.mp4`;
            const { error: uploadError } = await supabase.storage
              .from('generated-content')
              .upload(filePath, videoArrayBuffer, {
                contentType: 'video/mp4',
                upsert: true,
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
            } else {
              console.log('Uploaded generated video to storage at', filePath);
            }
            break;
          }

          attempts++;
        }
      } catch (bgErr) {
        console.error('Background processing error:', bgErr);
      }
    })());

    // Return immediately with jobSetId so client can poll status
    return new Response(
      JSON.stringify({ success: true, jobSetId, motionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('HiggsField motion error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});