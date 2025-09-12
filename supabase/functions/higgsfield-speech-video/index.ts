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
    const { text, voice = 'en-US-female', style = 'conversational' } = await req.json();
    
    const higgsFieldApiKey = Deno.env.get('HIGGSFIELD_API_KEY');
    if (!higgsFieldApiKey) {
      throw new Error('HiggsField API key not configured');
    }

    if (!text) {
      throw new Error('Text is required for speech-to-video generation');
    }

    console.log('Starting speech-to-video generation with HiggsField...');

    // Create speech-to-video generation request
    const createResponse = await fetch('https://api.higgsfield.ai/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${higgsFieldApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'speech_to_video',
        text: text,
        voice: voice,
        style: style,
        duration: Math.min(Math.max(text.length / 10, 3), 30), // Dynamic duration based on text length
        aspect_ratio: "16:9"
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('HiggsField creation error:', errorText);
      throw new Error(`HiggsField API error: ${createResponse.status} ${errorText}`);
    }

    const createData = await createResponse.json();
    const taskId = createData.id;
    
    console.log('HiggsField speech-to-video task created:', taskId);

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes timeout for speech generation
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.higgsfield.ai/v1/generations/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${higgsFieldApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Status check failed:', statusResponse.status);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log('Status check:', statusData.status);
      
      if (statusData.status === 'completed') {
        completed = true;
        
        // Initialize Supabase client
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Download and upload video to Supabase Storage
        const videoResponse = await fetch(statusData.output.video_url);
        const videoBlob = await videoResponse.blob();
        const videoArrayBuffer = await videoBlob.arrayBuffer();
        
        const fileName = `higgsfield-speech-${Date.now()}.mp4`;
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
            taskId: taskId,
            text: text,
            voice: voice
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (statusData.status === 'failed') {
        throw new Error('Speech-to-video generation failed');
      }
      
      attempts++;
    }

    if (!completed) {
      throw new Error('Speech-to-video generation timeout');
    }

  } catch (error) {
    console.error('HiggsField speech-to-video error:', error);
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