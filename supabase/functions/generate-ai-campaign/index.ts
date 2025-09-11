import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

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
    const { prompt, targetAudience, kpiGoal, targetMetric, timeframe, images = [], userId } = await req.json();

    console.log('Generating AI campaign for user:', userId);
    console.log('Prompt:', prompt);
    console.log('Target audience:', targetAudience);
    console.log('KPI Goal:', kpiGoal);
    console.log('Target Metric:', targetMetric);
    console.log('Timeframe:', timeframe);
    console.log('Images provided:', images.length);

    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const systemPrompt = `You are an expert KPI-driven music campaign strategist and growth hacker. Create data-driven fan engagement campaigns that deliver measurable results.

CRITICAL: You must analyze the provided KPI goal and create a campaign specifically designed to achieve it with concrete, trackable metrics.

Generate a JSON response with this exact structure:
{
  "title": "Results-focused campaign title (max 60 chars)",
  "description": "Strategic campaign description explaining the growth mechanism (2-3 sentences)",
  "type": "streaming|sharing|merchandise|voting|upload",
  "xpReward": number (50-500, scaled to incentivize the KPI goal),
  "cashReward": number (0-100, optional bonus for top performers),
  "targetValue": number (realistic but ambitious goal based on provided target metric),
  "targetMetric": "streams|shares|purchases|votes|uploads|followers|engagement",
  "requirements": "Clear step-by-step participation instructions that drive the KPI",
  "endDate": "ISO date string (based on provided timeframe)",
  "strategy": "Growth strategy explaining how this campaign drives the specific KPI",
  "kpiBreakdown": {
    "dailyTarget": "number per day to reach goal",
    "participantImpact": "expected contribution per participant",
    "scalingFactors": "key elements that multiply results"
  }
}

Focus on:
- ROI-driven reward structures
- Viral mechanisms and network effects
- Clear conversion funnels
- Measurable engagement tactics
- Scalable growth strategies`;

    // Build contextual prompt with all provided information
    let userPrompt = `
KPI GOAL: ${kpiGoal}
TARGET METRIC: ${targetMetric || 'Not specified - suggest appropriate metrics'}
TIMEFRAME: ${timeframe}
CAMPAIGN STRATEGY: ${prompt}
TARGET AUDIENCE: ${targetAudience}

${images.length > 0 ? `REFERENCE IMAGES PROVIDED: ${images.length} images uploaded for context and visual inspiration.` : ''}

Create a KPI-driven campaign that specifically targets "${kpiGoal}" with measurable outcomes. The campaign must include:

1. Clear conversion mechanics that drive the target KPI
2. Scalable engagement strategies
3. Data-driven reward structures
4. Viral growth components
5. Specific tactics that convert participation into KPI achievement

Make it results-focused, measurable, and designed for maximum ROI on creator investment.`;

    // Prepare messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // If images are provided, add them to the conversation for context
    if (images.length > 0) {
      messages.push({
        role: 'user',
        content: `I've provided ${images.length} reference image(s) to give you visual context for the campaign. Use these to inform the campaign strategy, visual elements, and audience targeting.`
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1200,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userPrompt}`
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.content[0].text;

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