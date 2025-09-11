import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, targetAudience, userId } = await req.json();

    console.log('Generating AI campaign for user:', userId);
    console.log('Prompt:', prompt);
    console.log('Target audience:', targetAudience);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert music campaign strategist. Create engaging fan engagement campaigns for music creators.

Generate a JSON response with this exact structure:
{
  "title": "Creative campaign title (max 60 chars)",
  "description": "Detailed campaign description (2-3 sentences)",
  "type": "streaming|sharing|merchandise|voting|upload",
  "xpReward": number (50-500),
  "cashReward": number (0-100, optional),
  "targetValue": number (realistic goal),
  "targetMetric": "streams|shares|purchases|votes|uploads",
  "requirements": "Clear participation instructions",
  "endDate": "ISO date string (1-4 weeks from now)"
}

Make campaigns exciting, achievable, and tailored to the target audience. Focus on community building and fan engagement.`;

    const userPrompt = `Campaign idea: ${prompt}\nTarget audience: ${targetAudience}\n\nGenerate an exciting campaign that this audience would love to participate in.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Generated campaign text:', generatedText);

    // Parse the JSON response
    let campaign;
    try {
      campaign = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', generatedText);
      
      // Fallback campaign if parsing fails
      campaign = {
        title: "Share & Win Challenge",
        description: "Share your favorite track and earn rewards while building our community together!",
        type: "sharing",
        xpReward: 100,
        cashReward: 0,
        targetValue: 50,
        targetMetric: "shares",
        requirements: "Share the campaign post on your social media with #MusicChallenge",
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    // Validate and sanitize the campaign data
    const validTypes = ['streaming', 'sharing', 'merchandise', 'voting', 'upload'];
    if (!validTypes.includes(campaign.type)) {
      campaign.type = 'sharing';
    }

    // Ensure reasonable limits
    campaign.xpReward = Math.min(Math.max(campaign.xpReward || 100, 50), 500);
    campaign.cashReward = Math.min(Math.max(campaign.cashReward || 0, 0), 100);
    campaign.targetValue = Math.min(Math.max(campaign.targetValue || 50, 10), 1000);

    console.log('Final campaign:', campaign);

    return new Response(JSON.stringify({ 
      success: true, 
      campaign 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-campaign function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});