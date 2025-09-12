import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to detect requested file format from prompt
function detectRequestedFormat(prompt: string): string[] {
  const formats = [];
  const lowercasePrompt = prompt.toLowerCase();
  
  if (lowercasePrompt.includes('image') || lowercasePrompt.includes('picture') || lowercasePrompt.includes('photo') || lowercasePrompt.includes('graphic')) {
    formats.push('image');
  }
  if (lowercasePrompt.includes('video') || lowercasePrompt.includes('clip') || lowercasePrompt.includes('reel') || lowercasePrompt.includes('tiktok')) {
    formats.push('video');
  }
  if (lowercasePrompt.includes('document') || lowercasePrompt.includes('pdf') || lowercasePrompt.includes('doc') || lowercasePrompt.includes('text file')) {
    formats.push('document');
  }
  if (lowercasePrompt.includes('audio') || lowercasePrompt.includes('sound') || lowercasePrompt.includes('voice') || lowercasePrompt.includes('podcast')) {
    formats.push('audio');
  }
  if (lowercasePrompt.includes('carousel') || lowercasePrompt.includes('slides') || lowercasePrompt.includes('multiple images')) {
    formats.push('carousel');
  }
  
  // Default to mixed content if no specific format detected
  return formats.length > 0 ? formats : ['mixed'];
}

// Helper function to generate actual image files using Hugging Face with warmup handling
async function generateImageFile(prompt: string, supabase: any): Promise<string | null> {
  try {
    const huggingFaceToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!huggingFaceToken) {
      console.error('HUGGING_FACE_ACCESS_TOKEN not configured');
      return null;
    }

    const endpoint = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';

    // Retry loop to handle model warmup (503)
    let attempts = 0;
    let response: Response | null = null;
    while (attempts < 6) { // ~ up to ~45s depending on estimated_time
      attempts++;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${huggingFaceToken}`,
          'Accept': 'image/png'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 896, // slightly smaller for faster generation
            height: 896,
            num_inference_steps: 4
          }
        })
      });

      if (response.ok) break;

      // If model is loading, wait for the estimated time then retry
      if (response.status === 503) {
        try {
          const info = await response.json();
          const wait = Math.min(8000, Math.ceil((info?.estimated_time || 5) * 1000));
          console.log(`Model warming up. Waiting ${wait}ms (attempt ${attempts})`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        } catch (_) {
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }
      }

      const errText = await response.text();
      console.error('Hugging Face API error:', response.status, errText);
      return null;
    }

    if (!response || !response.ok) {
      console.error('Failed to get image from Hugging Face after retries');
      return null;
    }

    const imageBlob = await response.blob();
    const fileName = `generated-images/${crypto.randomUUID()}.png`;

    const { error } = await supabase.storage
      .from('posts')
      .upload(fileName, imageBlob, { contentType: 'image/png', upsert: false });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

// Helper function to create document files
async function generateDocumentFile(content: string, title: string, supabase: any): Promise<string | null> {
  try {
    const fileName = `generated-documents/${crypto.randomUUID()}.txt`;
    const fileContent = `${title}\n\n${content}`;
    
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, new Blob([fileContent], { type: 'text/plain' }), {
        contentType: 'text/plain'
      });
    
    if (error) return null;
    
    const { data: urlData } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error generating document:', error);
    return null;
  }
}

// Helper function to generate video files using Runway ML
async function generateVideoFile(prompt: string, supabase: any): Promise<string | null> {
  try {
    const runwayApiKey = Deno.env.get('RUNWAY_API_KEY');
    if (!runwayApiKey) {
      console.error('RUNWAY_API_KEY not configured');
      return null;
    }

    console.log('Starting Runway ML video generation with prompt:', prompt);
    
    // Start video generation task
    const response = await fetch('https://api.dev.runwayml.com/v1/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${runwayApiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        taskType: 'gen3a_turbo.text_to_video',
        internal: false,
        options: {
          prompt_text: prompt,
          duration: 10,
          ratio: '16:9',
          seed: Math.floor(Math.random() * 1000000)
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Runway ML API error:', response.status, errorText);
      return null;
    }

    const taskResult = await response.json();
    console.log('Runway ML task created:', taskResult);
    
    if (!taskResult.id) {
      console.error('No task ID returned from Runway ML');
      return null;
    }

    // Poll for completion (max 5 minutes)
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskResult.id}`, {
        headers: {
          'Authorization': `Bearer ${runwayApiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!statusResponse.ok) {
        console.error('Failed to check task status:', statusResponse.status);
        continue;
      }

      const statusResult = await statusResponse.json();
      console.log(`Video generation status (attempt ${attempts}):`, statusResult.status);

      if (statusResult.status === 'SUCCEEDED' && statusResult.output) {
        // Download the video file
        const videoResponse = await fetch(statusResult.output[0]);
        if (!videoResponse.ok) {
          console.error('Failed to download generated video');
          return null;
        }

        const videoBlob = await videoResponse.blob();
        const contentTypeHeader = videoResponse.headers.get('content-type') || '';
        let ext = 'mp4';
        let uploadContentType = 'video/mp4';

        // Infer extension from header or output URL
        if (contentTypeHeader.includes('quicktime') || /\.mov(?:[?#]|$)/i.test(statusResult.output[0])) {
          ext = 'mov';
          uploadContentType = 'video/quicktime';
        } else if (contentTypeHeader.includes('webm') || /\.webm(?:[?#]|$)/i.test(statusResult.output[0])) {
          ext = 'webm';
          uploadContentType = 'video/webm';
        }

        const fileName = `generated-videos/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from('posts')
          .upload(fileName, videoBlob, { contentType: uploadContentType, upsert: false });

        if (error) {
          console.error('Storage upload error:', error);
          return null;
        }

        const { data: urlData } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        console.log('Video generated successfully:', urlData.publicUrl);
        return urlData.publicUrl;
      } else if (statusResult.status === 'FAILED') {
        console.error('Video generation failed:', statusResult.failure_reason);
        return null;
      }
    }

    console.error('Video generation timed out after 5 minutes');
    return null;
  } catch (error) {
    console.error('Error generating video:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      targetAudience, 
      contentGoal, 
      profileData, 
      referenceImages = [], 
      generationType = 'mixed' 
    } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Detect requested file formats from prompt
    const requestedFormats = detectRequestedFormat(prompt);
    console.log('Detected formats:', requestedFormats);

    // Generate content ideas based on profile and prompt
    const systemPrompt = `You are an AI content assistant specializing in creating viral social media content and generating actual files in requested formats. Generate engaging, platform-optimized content based on user profiles and goals.

Profile Context:
- Username: ${profileData.username || 'creator'}
- Bio: ${profileData.bio || 'Content creator'}
- Location: ${profileData.location || 'Global'}
- Interests: ${profileData.interests || 'Various'}

Target Audience: ${targetAudience || 'General'}
Content Goal: ${contentGoal || 'Engagement'}
Requested Formats: ${requestedFormats.join(', ')}

Generate content that matches the requested formats:
${requestedFormats.includes('image') ? '- Create detailed image prompts for AI generation' : ''}
${requestedFormats.includes('video') ? '- Provide complete video scripts and storyboards' : ''}
${requestedFormats.includes('document') ? '- Generate structured document content' : ''}
${requestedFormats.includes('audio') ? '- Create detailed audio scripts and concepts' : ''}
${requestedFormats.includes('carousel') ? '- Design multi-slide carousel content' : ''}

Format response as JSON array with objects containing:
- type: "image", "video_script", "document", "audio_script", "carousel", "text_post"
- title: Brief title
- content: Detailed content/description/script
- fileFormat: Specific format (jpg, mp4, pdf, mp3, etc.)
- hashtags: Relevant hashtags array
- engagement_tip: Strategy for maximizing engagement
- viral_potential: 1-10 score with reasoning
- actualFile: Whether this should generate an actual file (true/false)`;

    const userPrompt = `Create content in the requested formats for: "${prompt}"
    
    Requested formats: ${requestedFormats.join(', ')}
    
    Consider these factors:
    - Generate actual file content, not just descriptions
    - Current trends and viral formats
    - Platform-specific optimization (Instagram, TikTok, Twitter)
    - Audience engagement patterns
    - Visual appeal and shareability
    - Call-to-action integration
    
    ${referenceImages.length > 0 ? `Reference images provided: ${referenceImages.length} images to analyze for style/theme inspiration.` : ''}
    
    Generate 4-6 content pieces that can be turned into actual files, optimized for maximum virality and engagement.`;

    // Call Gemini for content generation with fallback & retries
    const requestText = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

    let geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: requestText }] }],
        generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 3000 }
      }),
    });

    // Handle rate limits by falling back to Flash after a short backoff
    if (!geminiResponse.ok && (geminiResponse.status === 429 || geminiResponse.status === 503)) {
      await new Promise((r) => setTimeout(r, 700));
      geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: requestText }] }],
          generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 3000 }
        }),
      });
    }

    let contentText = '';
    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      const parts = geminiData?.candidates?.[0]?.content?.parts || [];
      contentText = parts.map((p: any) => p?.text || '').join('\n');
    } else {
      // Leave contentText empty to trigger local fallback below
    }

    // Try to parse JSON robustly with fallbacks
    let contentIdeas: any[] = [];
    try {
      contentIdeas = JSON.parse(contentText);
    } catch {
      // Try to extract JSON from code fences or braces
      const fenceMatch = contentText.match(/```json\s*([\s\S]*?)```/i);
      const braceMatch = contentText.match(/\{[\s\S]*\}/);
      const jsonCandidate = fenceMatch?.[1] || braceMatch?.[0] || '';
      if (jsonCandidate) {
        try {
          const parsed = JSON.parse(jsonCandidate);
          contentIdeas = Array.isArray(parsed) ? parsed : [parsed];
        } catch { /* ignore */ }
      }
    }

    // Last-resort local fallback to ensure UI doesn't break
    if (!Array.isArray(contentIdeas) || contentIdeas.length === 0) {
      const baseHashtags = ['#viral', '#trend', '#content', '#engage'];
      contentIdeas = requestedFormats.flatMap(format => {
        switch(format) {
          case 'image':
            return [{
              type: 'image',
              title: `AI Generated Image: ${prompt?.slice(0, 30) || 'Content'}`,
              content: `Create a high-quality, engaging social media image about "${prompt}". Professional photography style, vibrant colors, eye-catching composition.`,
              fileFormat: 'jpg',
              hashtags: baseHashtags,
              engagement_tip: 'Post during peak hours and ask for opinions in comments.',
              viral_potential: 8,
              actualFile: true
            }];
          case 'video':
            return [{
              type: 'video_script',
              title: `Video Script: ${prompt?.slice(0, 30) || 'Content'}`,
              content: `HOOK (0-3s): Start with an attention-grabbing statement about "${prompt}"\nMAIN CONTENT (3-25s): Detailed explanation or demonstration\nCALL TO ACTION (25-30s): Ask viewers to engage`,
              fileFormat: 'txt',
              hashtags: [...baseHashtags, '#video', '#reel'],
              engagement_tip: 'Use trending audio and add captions.',
              viral_potential: 9,
              actualFile: true
            }];
          case 'document':
            return [{
              type: 'document',
              title: `Content Guide: ${prompt?.slice(0, 30) || 'Content'}`,
              content: `# ${prompt}\n\nThis comprehensive guide covers everything about ${prompt}.\n\n## Key Points\n- Detailed information\n- Actionable tips\n- Best practices\n\n## Conclusion\nImplement these strategies to achieve your goals.`,
              fileFormat: 'txt',
              hashtags: baseHashtags,
              engagement_tip: 'Share snippets as carousel posts.',
              viral_potential: 7,
              actualFile: true
            }];
          default:
            return [{
              type: 'text_post',
              title: `Social Post: ${prompt?.slice(0, 30) || 'Content'}`,
              content: `Create engaging content about "${prompt}" tailored to ${targetAudience || 'your audience'} with the goal to ${contentGoal || 'increase engagement'}. Include a clear CTA.`,
              fileFormat: 'txt',
              hashtags: baseHashtags,
              engagement_tip: 'Ask a question and respond to comments within 30 minutes.',
              viral_potential: 7,
              actualFile: false
            }];
        }
      });
    }

    // Generate actual files for content that requires them
    const generatedContent = [];
    let videoGenerated = false; // Track if a video has been generated

    for (const idea of contentIdeas) {
      let generatedItem = {
        ...idea,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      // Generate actual files based on type; always attempt for images/documents
      const shouldGenerate = idea.type === 'image' || idea.type === 'document' || idea.type === 'video_script' || idea.type === 'audio_script' || idea.actualFile === true;
      if (shouldGenerate) {
        switch (idea.type) {
          case 'image': {
            const imageUrl = await generateImageFile(idea.content, supabase);
            if (imageUrl) {
              generatedItem.imageUrl = imageUrl;
              generatedItem.downloadUrl = imageUrl;
              generatedItem.actualFile = true;
            } else {
              // Fallback to image prompt for manual generation
              generatedItem.imagePrompt = `Create a high-quality image: ${idea.content}`;
              generatedItem.actualFile = false;
            }
            break;
          }
          case 'video_script':
          case 'document':
          case 'audio_script': {
            if (idea.type === 'video_script' && !videoGenerated) {
              // Generate only one video at a time
              const videoUrl = await generateVideoFile(idea.content, supabase);
              if (videoUrl) {
                generatedItem.videoUrl = videoUrl;
                generatedItem.downloadUrl = videoUrl;
                const m = typeof videoUrl === 'string' ? videoUrl.match(/\.([a-z0-9]+)(?:[?#]|$)/i) : null;
                generatedItem.fileFormat = (m ? m[1] : 'mp4').toLowerCase();
                generatedItem.actualFile = true;
                videoGenerated = true; // Mark video as generated
              } else {
                // Fallback to script file
                const documentUrl = await generateDocumentFile(idea.content, idea.title, supabase);
                if (documentUrl) {
                  generatedItem.downloadUrl = documentUrl;
                  generatedItem.fileUrl = documentUrl;
                  generatedItem.actualFile = true;
                }
              }
            } else if (idea.type === 'video_script' && videoGenerated) {
              // If video already generated, create script file instead
              const documentUrl = await generateDocumentFile(idea.content, idea.title, supabase);
              if (documentUrl) {
                generatedItem.downloadUrl = documentUrl;
                generatedItem.fileUrl = documentUrl;
                generatedItem.actualFile = true;
              }
            } else {
              // Generate document file for other types
              const documentUrl = await generateDocumentFile(idea.content, idea.title, supabase);
              if (documentUrl) {
                generatedItem.downloadUrl = documentUrl;
                generatedItem.fileUrl = documentUrl;
                generatedItem.actualFile = true;
              }
            }
            break;
          }
          case 'carousel': {
            // For carousel, generate multiple image prompts
            const slides = idea.content.split('\n\n').filter(slide => slide.trim());
            generatedItem.carouselSlides = slides.map((slide, index) => ({
              id: crypto.randomUUID(),
              title: `Slide ${index + 1}`,
              content: slide,
              imagePrompt: `Create slide ${index + 1} for carousel: ${slide}`
            }));
            break;
          }
        }
      }


      // For image concepts without actual file generation, provide detailed prompts
      if (idea.type === 'image' && !idea.actualFile) {
        generatedItem.imagePrompt = `Create a high-quality, engaging social media image: ${idea.content}. Style should be modern, eye-catching, and optimized for social media platforms. Professional photography quality, vibrant colors, good composition.`;
        generatedItem.imageDescription = idea.content;
      }

      generatedContent.push(generatedItem);
    }

    // Add trending topics and personalized suggestions using Gemini
    const trendingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate current trending topics and hashtags relevant to: ${prompt}. Include viral challenges, seasonal trends, and platform-specific trends. Format as JSON with trending_topics array and recommended_hashtags array.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      }),
    });

    let trendingData = { trending_topics: [], recommended_hashtags: [] };

    // Retry on rate limits once
    let trendingOk = trendingResponse.ok;
    let parseTarget: any = trendingResponse;
    if (!trendingOk && (trendingResponse.status === 429 || trendingResponse.status === 503)) {
      await new Promise((r) => setTimeout(r, 600));
      const retry = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate current trending topics and hashtags relevant to: ${prompt}. Include viral challenges, seasonal trends, and platform-specific trends. Format as JSON with trending_topics array and recommended_hashtags array.` }] }],
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 500 }
        }),
      });
      if (retry.ok) {
        trendingOk = true;
        // Parse below using the same logic
        parseTarget = retry as any;
      }
    }

    if (trendingOk) {
      try {
        const trendingResult = await parseTarget.json();
        const partsT = trendingResult?.candidates?.[0]?.content?.parts || [];
        const trendingText = partsT.map((p: any) => p?.text || '').join('\n');

        // Robust JSON parse
        try {
          trendingData = JSON.parse(trendingText);
        } catch {
          const fenceMatch = trendingText.match(/```json\s*([\s\S]*?)```/i);
          const braceMatch = trendingText.match(/\{[\s\S]*\}/);
          const jsonCandidate = fenceMatch?.[1] || braceMatch?.[0] || '';
          if (jsonCandidate) {
            try { trendingData = JSON.parse(jsonCandidate); } catch { /* ignore */ }
          }
        }
      } catch (error) {
        console.error('Error parsing trending data:', error);
      }
    } else {
      // Default lightweight trending fallback
      const kw = (prompt || '').split(/\s+/).filter(Boolean).slice(0, 4).map(w => w.replace(/[^a-z0-9]/gi, ''));
      trendingData = {
        trending_topics: [
          'Behind-the-scenes drops',
          'Fan Q&A prompts',
          'Snippet teasers',
          'Duet/challenge remix ideas'
        ],
        recommended_hashtags: [
          ...kw.map(k => `#${k.toLowerCase()}`),
          '#NowPlaying', '#NewMusic', '#Creator', '#FYP'
        ].slice(0, 10)
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        generatedContent,
        trending: trendingData,
        suggestions: {
          optimal_posting_times: ['9-10 AM', '1-3 PM', '7-9 PM'],
          engagement_boosters: [
            'Ask questions in captions',
            'Use interactive stickers in stories',
            'Create shareable carousel posts',
            'Respond to comments quickly'
          ],
          content_pillars: [
            'Behind the scenes',
            'Educational content',
            'Entertainment/humor',
            'User-generated content',
            'Trending topics'
          ]
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-content function:', error);
    
    // Return a graceful error response instead of 500 to prevent internal error
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Content generation temporarily unavailable',
        generatedContent: [],
        trending: { topics: [], hashtags: [] }
      }),
      { 
        status: 200, // Return 200 to prevent internal error in frontend
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});