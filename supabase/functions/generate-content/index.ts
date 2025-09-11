import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      targetAudience, 
      contentGoal, 
      profileData, 
      referenceImages = [], 
      generationType = 'mixed' 
    } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Generate content ideas based on profile and prompt
    const systemPrompt = `You are an AI content assistant specializing in creating viral social media content. Generate engaging, platform-optimized content based on user profiles and goals.

Profile Context:
- Username: ${profileData.username || 'creator'}
- Bio: ${profileData.bio || 'Content creator'}
- Location: ${profileData.location || 'Global'}
- Interests: ${profileData.interests || 'Various'}

Target Audience: ${targetAudience || 'General'}
Content Goal: ${contentGoal || 'Engagement'}

Generate diverse content including:
1. Social media post ideas with captions
2. Image concepts for AI generation
3. Video content ideas 
4. Trending hashtag suggestions
5. Engagement strategies

Format response as JSON array with objects containing:
- type: "text_post", "image_concept", "video_idea", "story_idea"
- title: Brief title
- content: Detailed content/description
- hashtags: Relevant hashtags array
- engagement_tip: Strategy for maximizing engagement
- viral_potential: 1-10 score with reasoning`;

    const userPrompt = `Create viral content for: "${prompt}"
    
    Consider these factors:
    - Current trends and viral formats
    - Platform-specific optimization (Instagram, TikTok, Twitter)
    - Audience engagement patterns
    - Visual appeal and shareability
    - Call-to-action integration
    
    ${referenceImages.length > 0 ? `Reference images provided: ${referenceImages.length} images to analyze for style/theme inspiration.` : ''}
    
    Generate 6-8 diverse content pieces optimized for maximum virality and engagement.`;

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
      contentIdeas = Array.from({ length: 6 }).map((_, i) => ({
        type: i % 3 === 0 ? 'text_post' : i % 3 === 1 ? 'image_concept' : 'video_idea',
        title: `Idea ${i + 1}: ${prompt?.slice(0, 30) || 'Content'}`,
        content: `Create a post about "${prompt}" tailored to ${targetAudience || 'your audience'} with the goal to ${contentGoal || 'increase engagement'}. Include a clear CTA.`,
        hashtags: baseHashtags,
        engagement_tip: 'Ask a question and respond to comments within 30 minutes.',
        viral_potential: 7
      }));
    }

    // Generate images for image concepts using DALL-E
    const generatedContent = [];

    for (const idea of contentIdeas) {
      let generatedItem = {
        ...idea,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      // For image concepts, provide detailed description for manual creation or external tools
      if (idea.type === 'image_concept') {
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
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});