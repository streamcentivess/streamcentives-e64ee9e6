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
    const {
      prompt,
      text,
      input_audio_url,
      input_image_url,
      audioBase64,
      duration = 5,
      quality = 'high',
      enhance_prompt = true,
      seed,
      voice,
      style
    } = await req.json();
    
    const higgsFieldApiKey = Deno.env.get('HIGGSFIELD_API_KEY');
    const higgsFieldSecret = Deno.env.get('HIGGSFIELD_SECRET');
    
    if (!higgsFieldApiKey || !higgsFieldSecret) {
      throw new Error('HiggsField API credentials not configured');
    }

    const finalPrompt = prompt ?? text;
    if (!finalPrompt) {
      throw new Error('Prompt/text is required for speech-to-video generation');
    }

    console.log('Starting speech video generation with HiggsField...');
    console.log('Prompt:', finalPrompt);
    console.log('Input image URL:', input_image_url);
    console.log('Input audio URL (initial):', input_audio_url ? 'provided' : 'none');

    // Initialize Supabase client for uploading input audio (if base64) and output video
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Ensure we have an audio URL
    let audioUrl = input_audio_url as string | undefined;

    // If audioBase64 is provided, upload it
    if (!audioUrl && audioBase64) {
      console.log('Uploading base64 audio to Supabase storage...');
      const binaryString = atob(audioBase64);
      const audioBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) audioBytes[i] = binaryString.charCodeAt(i);
      const audioFileName = `higgsfield-input-audio-${Date.now()}.webm`;
      const { error: audioUploadError } = await supabase.storage
        .from('generated-content')
        .upload(audioFileName, audioBytes, { contentType: 'audio/webm' });
      if (audioUploadError) {
        console.error('Audio upload error:', audioUploadError);
        throw new Error('Failed to upload input audio to storage');
      }
      const { data: { publicUrl: uploadedAudioUrl } } = supabase.storage
        .from('generated-content')
        .getPublicUrl(audioFileName);
      audioUrl = uploadedAudioUrl;
      console.log('Audio uploaded. URL:', audioUrl);
    }

    // If still no audio but we have text, synthesize TTS (prefer ElevenLabs, fallback to Hugging Face)
    if (!audioUrl && finalPrompt) {
      // 1) Try ElevenLabs first if API key is configured
      try {
        const xiApiKey = Deno.env.get('ELEVENLABS_API_KEY');
        if (xiApiKey) {
          console.log('Generating TTS audio from text using ElevenLabs...');
          const voiceMap: Record<string, string> = {
            'en-US-female': '9BWtsMINqrJLrRacOk9x', // Aria
            'en-US-male': 'cjVigY5qzO86Huf0OWal',   // Eric
            'en-UK-female': 'XB0fDUnXU5powFXDhCwa', // Charlotte
            'en-UK-male': 'onwK4e9ZLuTAKqWW03F9',   // Daniel
          };
          const selected = (voice && typeof voice === 'string') ? voice : 'en-US-female';
          const voiceId = voiceMap[selected] || voiceMap['en-US-female'];

          const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'xi-api-key': xiApiKey,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({
              text: finalPrompt,
              model_id: 'eleven_turbo_v2_5',
            }),
          });

          if (elevenRes.ok) {
            const mp3ArrayBuffer = await elevenRes.arrayBuffer();
            const mp3FileName = `higgsfield-tts-${Date.now()}.mp3`;
            const { error: ttsUploadError } = await supabase.storage
              .from('generated-content')
              .upload(mp3FileName, mp3ArrayBuffer, { contentType: 'audio/mpeg' });
            if (ttsUploadError) {
              console.error('TTS upload error (ElevenLabs):', ttsUploadError);
              throw new Error('Failed to upload synthesized audio to storage');
            }
            const { data: { publicUrl: ttsPublicUrl } } = supabase.storage
              .from('generated-content')
              .getPublicUrl(mp3FileName);
            audioUrl = ttsPublicUrl;
            console.log('TTS audio (ElevenLabs) generated and uploaded. URL:', audioUrl);
          } else {
            const errText = await elevenRes.text();
            console.error('ElevenLabs TTS generation failed:', errText);
          }
        } else {
          console.warn('ELEVENLABS_API_KEY not configured; will try Hugging Face.');
        }
      } catch (e) {
        console.error('ElevenLabs TTS generation error:', e);
      }

      // 2) Fallback to Hugging Face if ElevenLabs not available or failed
      if (!audioUrl) {
        try {
          const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
          if (!hfToken) {
            console.warn('HUGGING_FACE_ACCESS_TOKEN not configured; cannot synthesize audio from text.');
          } else {
            console.log('Generating TTS audio from text using Hugging Face...');
            const ttsResponse = await fetch('https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_vits', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
                'Accept': 'audio/wav'
              },
              body: JSON.stringify({ inputs: finalPrompt })
            });

            if (ttsResponse.ok) {
              const ttsArrayBuffer = await ttsResponse.arrayBuffer();
              const ttsFileName = `higgsfield-tts-${Date.now()}.wav`;
              const { error: ttsUploadError } = await supabase.storage
                .from('generated-content')
                .upload(ttsFileName, ttsArrayBuffer, { contentType: 'audio/wav' });
              if (ttsUploadError) {
                console.error('TTS upload error (HF):', ttsUploadError);
                throw new Error('Failed to upload synthesized audio to storage');
              }
              const { data: { publicUrl: ttsPublicUrl } } = supabase.storage
                .from('generated-content')
                .getPublicUrl(ttsFileName);
              audioUrl = ttsPublicUrl;
              console.log('TTS audio (HF) generated and uploaded. URL:', audioUrl);
            } else {
              const errText = await ttsResponse.text();
              console.error('Hugging Face TTS generation failed:', errText);
            }
          }
        } catch (e) {
          console.error('Hugging Face TTS generation error:', e);
        }
      }
    }

    // Validate required params for Speak v2
    if (!input_image_url) {
      console.error('Missing required input_image_url');
      return new Response(
        JSON.stringify({ success: false, error: 'input_image_url is required for speech-to-video generation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    if (!audioUrl) {
      console.error('Missing required input_audio (no audio provided or synthesized)');
      return new Response(
        JSON.stringify({ success: false, error: 'input_audio is required. Provide input_audio_url or audioBase64, or send text to synthesize TTS.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Compose request body per Speak v2 spec
    const params: Record<string, unknown> = {
      prompt: finalPrompt,
      quality,
      enhance_prompt,
      seed: typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000),
      duration
    };
    if (input_image_url) {
      // Optional image input
      (params as any).input_image = { type: 'image_url', image_url: input_image_url };
    }
    if (audioUrl) {
      // Optional audio input
      (params as any).input_audio = { type: 'audio_url', audio_url: audioUrl };
    }

    // Use the speak/higgsfield endpoint for speech-to-video generation
    const createResponse = await fetch('https://platform.higgsfield.ai/v1/speak/higgsfield', {
      method: 'POST',
      headers: {
        'hf-api-key': higgsFieldApiKey,
        'hf-secret': higgsFieldSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params }),
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
    const maxAttempts = 120; // 10 minutes timeout for speech generation
    
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
        
        // Supabase client already initialized above

        // Download and upload video to Supabase Storage
        const videoResponse = await fetch(successfulJob.results.raw.url);
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
            jobSetId: jobSetId,
            prompt: finalPrompt,
            audioUrlUsed: audioUrl ?? null,
            input_image_url: input_image_url ?? null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (statusData.jobs && statusData.jobs.some(job => job.status === 'failed')) {
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