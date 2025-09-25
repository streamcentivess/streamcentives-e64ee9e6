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
    
    // Detect audio type (WAV vs WebM)
    let audioMime = 'audio/webm';
    let fileName = 'audio.webm';
    try {
      const header = String.fromCharCode(...binaryAudio.slice(0, 4));
      if (header === 'RIFF') {
        audioMime = 'audio/wav';
        fileName = 'audio.wav';
      }
    } catch (_) {}

    const blob = new Blob([binaryAudio], { type: audioMime })

    // Use Hugging Face Whisper for STT (avoid OpenAI quota issues)
    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
    if (!hfToken) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN is not set')
    }

    const hfResponse = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': audioMime,
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
    let transcriptText = ''
    if (typeof hfJson?.text === 'string') {
      transcriptText = hfJson.text
    } else if (Array.isArray(hfJson)) {
      transcriptText = hfJson.map((c: any) => c?.text).filter(Boolean).join(' ')
    } else if (hfJson?.[0]?.text) {
      transcriptText = hfJson[0].text
    }
    console.log('Transcription successful via Hugging Face:', transcriptText)

    return new Response(
      JSON.stringify({ text: transcriptText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Voice-to-text error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})