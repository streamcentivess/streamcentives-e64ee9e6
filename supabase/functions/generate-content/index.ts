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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
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

    // Call OpenAI for content generation
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.8,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const contentIdeas = JSON.parse(openAIData.choices[0].message.content);

    // Generate images for image concepts using DALL-E
    const generatedContent = [];

    for (const idea of contentIdeas) {
      let generatedItem = {
        ...idea,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      // Generate actual images for image concepts
      if (idea.type === 'image_concept') {
        try {
          const imagePrompt = `Create a high-quality, engaging social media image: ${idea.content}. Style should be modern, eye-catching, and optimized for social media platforms. Professional photography quality, vibrant colors, good composition.`;
          
          const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-image-1',
              prompt: imagePrompt,
              n: 1,
              size: '1024x1024',
              quality: 'standard'
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            
            // Convert base64 to blob and upload to Supabase storage
            if (imageData.data && imageData.data[0]) {
              const base64Data = imageData.data[0].b64_json;
              if (base64Data) {
                const supabaseUrl = Deno.env.get('SUPABASE_URL');
                const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
                
                if (supabaseUrl && supabaseKey) {
                  const supabase = createClient(supabaseUrl, supabaseKey);
                  
                  // Convert base64 to blob
                  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                  const blob = new Blob([binaryData], { type: 'image/png' });
                  
                  // Upload to storage
                  const fileName = `generated/${crypto.randomUUID()}.png`;
                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('posts')
                    .upload(fileName, blob);
                  
                  if (!uploadError) {
                    const { data: urlData } = supabase.storage
                      .from('posts')
                      .getPublicUrl(fileName);
                    
                    generatedItem.imageUrl = urlData.publicUrl;
                  }
                }
              }
            }
          }
        } catch (imageError) {
          console.error('Error generating image:', imageError);
          // Continue without image
        }
      }

      generatedContent.push(generatedItem);
    }

    // Add trending topics and personalized suggestions
    const trendingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'user', 
            content: `Generate current trending topics and hashtags relevant to: ${prompt}. Include viral challenges, seasonal trends, and platform-specific trends. Format as JSON with trending_topics array and recommended_hashtags array.` 
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    let trendingData = { trending_topics: [], recommended_hashtags: [] };
    if (trendingResponse.ok) {
      try {
        const trendingResult = await trendingResponse.json();
        trendingData = JSON.parse(trendingResult.choices[0].message.content);
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