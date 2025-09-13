import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get('X-Webhook-Secret-Key');
    const expectedSecret = Deno.env.get('HIGGSFIELD_WEBHOOK_SECRET');
    
    if (!signature || !expectedSecret || signature !== expectedSecret) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = await req.json();
    console.log('HiggsField webhook received:', payload);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process the webhook payload
    const { id: jobSetId, status, jobs } = payload;

    if (status === 'completed') {
      // Find successful job with video results
      const successfulJob = jobs?.find(job => 
        job.status === 'completed' && job.results && job.results.raw
      );

      if (successfulJob) {
        console.log('Processing completed video generation...');
        
        try {
          // Download video from HiggsField
          console.log('Downloading video from:', successfulJob.results.raw.url);
          const videoResponse = await fetch(successfulJob.results.raw.url);
          
          if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.status}`);
          }

          const videoBlob = await videoResponse.blob();
          const videoArrayBuffer = await videoBlob.arrayBuffer();
          
          // Upload to Supabase Storage
          const fileName = `higgsfield-speech-${jobSetId}-${Date.now()}.mp4`;
          const { error: uploadError } = await supabase.storage
            .from('generated-content')
            .upload(fileName, videoArrayBuffer, {
              contentType: 'video/mp4',
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Failed to upload video to storage');
          }

          const { data: { publicUrl } } = supabase.storage
            .from('generated-content')
            .getPublicUrl(fileName);

          console.log('Video uploaded successfully:', publicUrl);

          // You can add database updates here to store the result
          // For example, update a jobs table with the final video URL
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Webhook processed successfully',
              videoUrl: publicUrl,
              jobSetId: jobSetId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Error processing webhook:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message,
              jobSetId: jobSetId
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else {
        console.error('No successful job found in webhook payload');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No successful video generation found',
            jobSetId: jobSetId
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else if (status === 'failed') {
      console.log('Video generation failed for job set:', jobSetId);
      
      // You can add database updates here to mark the job as failed
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Failure webhook processed',
          status: 'failed',
          jobSetId: jobSetId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Webhook received for status:', status);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook received',
          status: status,
          jobSetId: jobSetId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});