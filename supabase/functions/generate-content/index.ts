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

    // Call Gemini for content generation
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser Request: ${userPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 3000,
        }
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const contentText = geminiData.candidates[0].content.parts[0].text;
    const contentIdeas = JSON.parse(contentText);

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
    if (trendingResponse.ok) {
      try {
        const trendingResult = await trendingResponse.json();
        const trendingText = trendingResult.candidates[0].content.parts[0].text;
        trendingData = JSON.parse(trendingText);
      } catch (error) {
        console.error('Error parsing trending data:', error);
      }
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