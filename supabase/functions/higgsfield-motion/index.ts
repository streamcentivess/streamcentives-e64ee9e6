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
            type: 'url',
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

    // Poll for completion using job-sets endpoint
    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes timeout
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
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
      
      // Check if all jobs are completed
      const allJobsCompleted = statusData.jobs && statusData.jobs.every(job => 
        job.status === 'completed' || job.status === 'failed'
      );
      
      if (allJobsCompleted) {
        completed = true;
        
        // Find the first successful job with results
        const successfulJob = statusData.jobs.find(job => 
          job.status === 'completed' && job.results && job.results.raw
        );
        
        if (!successfulJob) {
          throw new Error('No successful video generation found');
        }
        
        // Initialize Supabase client
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Download and upload video to Supabase Storage
        const videoResponse = await fetch(successfulJob.results.raw.url);
        const videoBlob = await videoResponse.blob();
        const videoArrayBuffer = await videoBlob.arrayBuffer();
        
        const fileName = `higgsfield-motion-${Date.now()}.mp4`;
        const { data: uploadData, error: uploadError } = await supabase.storage
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

        return new Response(
          JSON.stringify({
            success: true,
            videoUrl: publicUrl,
            jobSetId: jobSetId,
            motionId: motionId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (statusData.jobs && statusData.jobs.some(job => job.status === 'failed')) {
        throw new Error('Image-to-video generation failed');
      }
      
      attempts++;
    }

    if (!completed) {
      throw new Error('Image-to-video generation timeout');
    }

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