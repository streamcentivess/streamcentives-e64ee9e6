import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('Received audio data for transcription')
    
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio)
    console.log('Processed audio chunks, size:', binaryAudio.length)
    
    // Prepare form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')

    console.log('Sending to OpenAI Whisper API...')
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    let transcriptText: string | null = null

    // Try OpenAI Whisper first
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          transcriptText = result.text
          console.log('Transcription successful via OpenAI:', transcriptText)
        } else {
          const errorText = await response.text()
          console.error('OpenAI API error:', errorText)
        }
      } catch (e) {
        console.error('OpenAI Whisper request failed:', e)
      }
    } else {
      console.warn('OPENAI_API_KEY is not configured. Will try Hugging Face fallback...')
    }

    // Fallback to Hugging Face Inference if OpenAI failed or is unavailable
    if (!transcriptText) {
      console.log('Attempting Hugging Face ASR fallback (openai/whisper-large-v3)...')
      const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
      if (!hfToken) {
        throw new Error('No transcription provider available: OPENAI failed/unavailable and HUGGING_FACE_ACCESS_TOKEN is not set')
      }

      const hfResponse = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'audio/webm',
          'Accept': 'application/json'
        },
        body: blob
      })

      if (!hfResponse.ok) {
        const err = await hfResponse.text()
        console.error('Hugging Face API error:', err)
        throw new Error(`Hugging Face API error: ${err}`)
      }

      const hfJson = await hfResponse.json()
      let hfText = ''
      if (typeof hfJson?.text === 'string') {
        hfText = hfJson.text
      } else if (Array.isArray(hfJson)) {
        hfText = hfJson.map((c: any) => c?.text).filter(Boolean).join(' ')
      } else if (hfJson?.[0]?.text) {
        hfText = hfJson[0].text
      }
      transcriptText = hfText
      console.log('Transcription successful via Hugging Face:', transcriptText)
    }

    return new Response(
      JSON.stringify({ text: transcriptText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Voice-to-text error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})