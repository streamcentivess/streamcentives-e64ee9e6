import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    const { message, messageId } = await req.json();

    if (!message || !messageId) {
      throw new Error('Message content and messageId are required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update message status to analyzing
    await supabase
      .from('messages')
      .update({ analysis_status: 'analyzing' })
      .eq('id', messageId);

    console.log('Starting sentiment analysis for message:', messageId);

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

    // Store analysis results in the database
    const { error: analysisError } = await supabase
      .from('message_analysis')
      .insert({
        message_id: messageId,
        is_appropriate: analysis.is_appropriate,
        severity: !analysis.is_appropriate ? analysis.severity : null,
        flags: analysis.flags,
        confidence: analysis.confidence
      });

    if (analysisError) {
      console.error('Error storing analysis:', analysisError);
    }

    // Update message status to completed
    const { error: statusError } = await supabase
      .from('messages')
      .update({ 
        analysis_status: 'completed',
        flagged_content: !analysis.is_appropriate,
        flagged_reason: !analysis.is_appropriate ? analysis.flags.join(', ') : null
      })
      .eq('id', messageId);

    if (statusError) {
      console.error('Error updating message status:', statusError);
    }

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
    
    // Try to update message status to failed if we have the messageId
    try {
      const { messageId } = await req.json();
      if (messageId && supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('messages')
          .update({ analysis_status: 'failed' })
          .eq('id', messageId);
      }
    } catch (updateError) {
      console.error('Failed to update message status to failed:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});