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
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const { message, messageId } = await req.json();

    if (!message || !messageId) {
      throw new Error('Message content and messageId are required');
    }

    // Call Claude for sentiment analysis and moderation
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Analyze this message for content moderation. Return a JSON response with:
- "is_appropriate": boolean (true if content is safe, false if inappropriate)
- "severity": string ("low", "medium", "high" - only if inappropriate)
- "flags": array of strings (reasons why content was flagged, empty array if appropriate)
- "confidence": number (0-1, how confident you are in your assessment)

Flag content that contains:
- Harassment, threats, or intimidation
- Sexual content or solicitation
- Hate speech or discrimination
- Spam or promotional content
- Personal information sharing
- Violence or self-harm
- Illegal activities

Message to analyze: "${message}"

Respond only with valid JSON.`
          }
        ]
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text());
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      // Fallback analysis if AI response is not valid JSON
      analysis = {
        is_appropriate: true,
        severity: "low",
        flags: [],
        confidence: 0.5
      };
    }

    // Ensure required fields exist
    analysis.is_appropriate = analysis.is_appropriate ?? true;
    analysis.severity = analysis.severity ?? "low";
    analysis.flags = analysis.flags ?? [];
    analysis.confidence = analysis.confidence ?? 0.5;

    console.log('Sentiment analysis completed for message:', messageId, analysis);

    return new Response(JSON.stringify({
      success: true,
      messageId,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-message-sentiment function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});