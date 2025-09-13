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
      style,
      webhook_url,
      webhook_secret
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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle audio input
    let audioUrl = input_audio_url as string | undefined;

    // Upload base64 audio if provided
    if (!audioUrl && audioBase64) {
      console.log('Uploading base64 audio to storage...');
      try {
        const binaryString = atob(audioBase64);
        const audioBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) audioBytes[i] = binaryString.charCodeAt(i);
        
        const audioFileName = `higgsfield-input-audio-${Date.now()}.wav`;
        const { error: audioUploadError } = await supabase.storage
          .from('generated-content')
          .upload(audioFileName, audioBytes, { contentType: 'audio/wav' });
          
        if (audioUploadError) {
          console.error('Audio upload error:', audioUploadError);
          throw new Error('Failed to upload input audio to storage');
        }
        
        const { data: { publicUrl: uploadedAudioUrl } } = supabase.storage
          .from('generated-content')
          .getPublicUrl(audioFileName);
        audioUrl = uploadedAudioUrl;
        console.log('Input audio uploaded. URL:', audioUrl);
      } catch (e) {
        console.error('Base64 audio processing error:', e);
        throw new Error('Invalid base64 audio data');
      }
    }

    // Generate TTS if no audio provided
    if (!audioUrl && finalPrompt) {
      console.log('Generating TTS audio from text...');
      
      // Try ElevenLabs first
      const xiApiKey = Deno.env.get('ELEVENLABS_API_KEY');
      if (xiApiKey) {
        try {
          console.log('Using ElevenLabs TTS...');
          const voiceId = '9BWtsMINqrJLrRacOk9x'; // Default Aria voice
          
          const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'xi-api-key': xiApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: finalPrompt,
              model_id: 'eleven_turbo_v2_5',
              output_format: 'wav'
            }),
          });

          if (elevenRes.ok) {
            const audioArrayBuffer = await elevenRes.arrayBuffer();
            const audioFileName = `higgsfield-tts-${Date.now()}.wav`;
            
            const { error: ttsUploadError } = await supabase.storage
              .from('generated-content')
              .upload(audioFileName, audioArrayBuffer, { contentType: 'audio/wav' });
              
            if (!ttsUploadError) {
              const { data: { publicUrl: ttsPublicUrl } } = supabase.storage
                .from('generated-content')
                .getPublicUrl(audioFileName);
              audioUrl = ttsPublicUrl;
              console.log('ElevenLabs TTS audio generated and uploaded:', audioUrl);
            }
          }
        } catch (e) {
          console.error('ElevenLabs TTS error:', e);
        }
      }

      // Fallback to Hugging Face if ElevenLabs failed
      if (!audioUrl) {
        const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
        if (hfToken) {
          try {
            console.log('Using Hugging Face TTS fallback...');
            const ttsResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/speecht5_tts', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ inputs: finalPrompt })
            });
            
            console.log('HF TTS Response status:', ttsResponse.status);
            console.log('HF TTS Response headers:', Object.fromEntries(ttsResponse.headers.entries()));
            
            if (ttsResponse.ok) {
              const contentType = ttsResponse.headers.get('content-type') || '';
              console.log('HF TTS Content-Type:', contentType);
              
              if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
                const ttsArrayBuffer = await ttsResponse.arrayBuffer();
                console.log('HF TTS Audio buffer size:', ttsArrayBuffer.byteLength);
                
                if (ttsArrayBuffer.byteLength > 0) {
                  const ttsFileName = `higgsfield-tts-hf-${Date.now()}.wav`;
                  
                  const { error: ttsUploadError } = await supabase.storage
                    .from('generated-content')
                    .upload(ttsFileName, ttsArrayBuffer, { contentType: 'audio/wav' });
                    
                  if (!ttsUploadError) {
                    const { data: { publicUrl: ttsPublicUrl } } = supabase.storage
                      .from('generated-content')
                      .getPublicUrl(ttsFileName);
                    audioUrl = ttsPublicUrl;
                    console.log('Hugging Face TTS audio generated and uploaded:', audioUrl);
                  } else {
                    console.error('HF TTS upload error:', ttsUploadError);
                  }
                } else {
                  console.warn('HF TTS returned empty audio buffer');
                }
              } else {
                const responseText = await ttsResponse.text();
                console.error('HF TTS returned non-audio response:', responseText);
              }
            } else {
              const errorText = await ttsResponse.text();
              console.error('HF TTS request failed with status:', ttsResponse.status, 'Response:', errorText);
            }
          } catch (e) {
            console.error('Hugging Face TTS error:', e);
          }
        } else {
          console.warn('HUGGING_FACE_ACCESS_TOKEN not configured; skipping HF TTS fallback.');
        }
      }
    }
    // Final fallback: OpenAI TTS if still no audio
    if (!audioUrl) {
      const oaiKey = Deno.env.get('OPENAI_API_KEY');
      if (oaiKey) {
        try {
          console.log('Generating TTS audio from text using OpenAI...');
          const voiceStr = (voice && typeof voice === 'string') ? String(voice).toLowerCase() : '';
          const openaiVoice = voiceStr.includes('female') ? 'nova' : 'alloy';
          
          console.log('OpenAI TTS request:', {
            model: 'tts-1',
            input: finalPrompt,
            voice: openaiVoice,
            response_format: 'wav'
          });
          
          const oaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${oaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'tts-1',
              input: finalPrompt,
              voice: openaiVoice,
              response_format: 'wav'
            })
          });

          console.log('OpenAI TTS Response status:', oaiRes.status);
          console.log('OpenAI TTS Response headers:', Object.fromEntries(oaiRes.headers.entries()));

          if (oaiRes.ok) {
            const ttsArrayBuffer = await oaiRes.arrayBuffer();
            console.log('OpenAI TTS Audio buffer size:', ttsArrayBuffer.byteLength);
            
            if (ttsArrayBuffer.byteLength > 0) {
              const ttsFileName = `higgsfield-tts-openai-${Date.now()}.wav`;
              const { error: ttsUploadError } = await supabase.storage
                .from('generated-content')
                .upload(ttsFileName, ttsArrayBuffer, { contentType: 'audio/wav' });
              if (ttsUploadError) {
                console.error('TTS upload error (OpenAI):', ttsUploadError);
              } else {
                const { data: { publicUrl: ttsPublicUrl } } = supabase.storage
                  .from('generated-content')
                  .getPublicUrl(ttsFileName);
                audioUrl = ttsPublicUrl;
                console.log('OpenAI TTS audio generated and uploaded. URL:', audioUrl);
              }
            } else {
              console.warn('OpenAI TTS returned empty audio buffer');
            }
          } else {
            const errorText = await oaiRes.text();
            console.error('OpenAI TTS request failed:', oaiRes.status, errorText);
          }
        } catch (e) {
          console.error('OpenAI TTS error:', e);
        }
      } else {
        console.warn('OPENAI_API_KEY not configured; skipping OpenAI TTS fallback.');
      }
    }
    }

    // Validate required inputs
    if (!input_image_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'input_image_url is required for speech-to-video generation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!audioUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Audio input required. Please provide audio_url, base64 audio, or text for TTS synthesis.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Prepare HiggsField API request with webhook support
    const requestBody: any = {
      params: {
        prompt: finalPrompt,
        quality,
        enhance_prompt,
        seed: typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000),
        duration,
        input_image: { type: 'image_url', image_url: input_image_url },
        input_audio: { type: 'audio_url', audio_url: audioUrl }
      }
    };

    // Add webhook configuration if provided
    if (webhook_url && webhook_secret) {
      requestBody.webhook = {
        url: webhook_url,
        secret: webhook_secret
      };
      console.log('Webhook configured for async processing');
    }

    console.log('Calling HiggsField v1/speak/higgsfield endpoint...');
    const createResponse = await fetch('https://platform.higgsfield.ai/v1/speak/higgsfield', {
      method: 'POST',
      headers: {
        'hf-api-key': higgsFieldApiKey,
        'hf-secret': higgsFieldSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('HiggsField creation error:', errorText);
      throw new Error(`HiggsField API error: ${createResponse.status} ${errorText}`);
    }

    const createData = await createResponse.json();
    const jobSetId = createData.id;
    
    console.log('HiggsField job created:', jobSetId);

    // If webhook is configured, return immediately with job ID
    if (webhook_url && webhook_secret) {
      return new Response(
        JSON.stringify({
          success: true,
          jobSetId: jobSetId,
          status: 'processing',
          message: 'Generation started. You will receive a webhook notification when complete.',
          prompt: finalPrompt,
          audioUrlUsed: audioUrl,
          input_image_url: input_image_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise, poll for completion (legacy behavior)
    console.log('Polling for completion...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      try {
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
        console.log(`Status check (attempt ${attempts + 1}):`, statusData.jobs?.length ? `${statusData.jobs.length} jobs` : 'No jobs');
        
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
          
          console.log('Downloading and uploading video...');
          const videoResponse = await fetch(successfulJob.results.raw.url);
          const videoBlob = await videoResponse.blob();
          const videoArrayBuffer = await videoBlob.arrayBuffer();
          
          const fileName = `higgsfield-speech-${Date.now()}.mp4`;
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

          return new Response(
            JSON.stringify({
              success: true,
              videoUrl: publicUrl,
              jobSetId: jobSetId,
              prompt: finalPrompt,
              audioUrlUsed: audioUrl,
              input_image_url: input_image_url
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (statusData.jobs && statusData.jobs.some(job => job.status === 'failed')) {
          throw new Error('Speech-to-video generation failed');
        }
      } catch (pollError) {
        console.error('Polling error:', pollError);
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