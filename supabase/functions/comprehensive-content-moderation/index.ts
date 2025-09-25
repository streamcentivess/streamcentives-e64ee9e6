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

    const { content, contentId, contentType, userId, mediaUrls = [] } = await req.json();

    if (!content || !contentId || !contentType || !userId) {
      throw new Error('Content, contentId, contentType, and userId are required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting comprehensive moderation for ${contentType}:`, contentId);

    // Enhanced prompt for comprehensive moderation
    const moderationPrompt = `You are a content moderation AI with Meta-level standards. Analyze this content for comprehensive safety and policy violations.

Content to analyze: "${content}"
Content type: ${contentType}
Media URLs: ${mediaUrls.join(', ')}

Provide analysis in this exact JSON format:
{
  "is_appropriate": boolean,
  "categories": [],
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "flags": [],
  "detected_language": "language_code",
  "ai_analysis": {
    "reasoning": "explanation",
    "context_notes": "additional context",
    "cultural_considerations": "cultural context if relevant"
  },
  "recommended_action": "approved|warning|shadow_ban|content_removed|manual_review"
}

Categories to check (use exact strings):
- "violence_incitement": Threats, terrorism, organized violence, self-harm promotion
- "safety_harassment": Bullying, harassment, doxxing, stalking, intimidation
- "nudity_sexual": Explicit nudity, sexual content, non-consensual intimate imagery
- "hate_speech": Discrimination based on race, religion, gender, sexuality, etc.
- "authenticity_spam": Fake content, spam, coordinated inauthentic behavior
- "privacy_doxxing": Personal information sharing, location tracking without consent
- "intellectual_property": Copyright, trademark violations
- "regulated_goods": Illegal drugs, weapons, adult services promotion
- "community_standards": Misinformation, election interference, medical misinformation
- "misinformation": False information that could cause harm

Severity levels:
- "low": Minor violations, borderline content
- "medium": Clear violations that need attention
- "high": Serious violations requiring immediate action
- "critical": Illegal content, imminent harm, severe violations

Consider context, intent, and cultural nuances. Be accurate but err on the side of protecting users from harm.`;

    // Call Claude for comprehensive moderation analysis
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1-20250805', // Use the most capable model
        max_completion_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: moderationPrompt
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
      // Fallback analysis with conservative approach
      analysis = {
        is_appropriate: false,
        categories: ['community_standards'],
        severity: "medium",
        confidence: 0.5,
        flags: ['Unable to parse AI analysis - requires manual review'],
        detected_language: 'en',
        ai_analysis: {
          reasoning: 'AI analysis parsing failed, flagged for manual review',
          context_notes: 'Error in AI response parsing',
          cultural_considerations: 'N/A'
        },
        recommended_action: 'manual_review'
      };
    }

    // Ensure required fields exist with defaults
    analysis.is_appropriate = analysis.is_appropriate ?? false;
    analysis.categories = analysis.categories ?? [];
    analysis.severity = analysis.severity ?? 'medium';
    analysis.confidence = analysis.confidence ?? 0.5;
    analysis.flags = analysis.flags ?? [];
    analysis.detected_language = analysis.detected_language ?? 'en';
    analysis.recommended_action = analysis.recommended_action ?? 'manual_review';

    // Create content hash for deduplication
    const contentHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(content)
    );
    const hashArray = Array.from(new Uint8Array(contentHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store comprehensive moderation analysis
    const { data: moderationRecord, error: moderationError } = await supabase
      .from('content_moderation')
      .insert({
        content_id: contentId,
        content_type: contentType,
        user_id: userId,
        is_appropriate: analysis.is_appropriate,
        categories: analysis.categories,
        severity: analysis.severity,
        confidence: analysis.confidence,
        ai_analysis: analysis.ai_analysis,
        flags: analysis.flags,
        detected_language: analysis.detected_language,
        action_taken: analysis.recommended_action,
        auto_actioned: true,
        original_content: content,
        content_hash: hashHex,
        media_urls: mediaUrls
      })
      .select()
      .single();

    if (moderationError) {
      console.error('Error storing moderation analysis:', moderationError);
      throw moderationError;
    }

    // Get moderation settings for action thresholds
    const { data: settings } = await supabase
      .from('moderation_settings')
      .select('setting_name, setting_value')
      .in('setting_name', ['auto_remove_threshold', 'shadow_ban_threshold', 'manual_review_threshold']);

    const settingsMap = settings?.reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.setting_name] = setting.setting_value;
      return acc;
    }, {} as Record<string, any>) || {};

    // Apply automated actions based on thresholds and AI recommendation
    let finalAction = 'approved';
    let requiresManualReview = false;

    if (!analysis.is_appropriate) {
      const autoRemoveThreshold = settingsMap['auto_remove_threshold'] || { confidence: 0.9, severity: 'critical' };
      const shadowBanThreshold = settingsMap['shadow_ban_threshold'] || { confidence: 0.7, severity: 'high' };
      const manualReviewThreshold = settingsMap['manual_review_threshold'] || { confidence: 0.5, severity: 'medium' };

      if (analysis.confidence >= autoRemoveThreshold.confidence && 
          (analysis.severity === 'critical' || analysis.severity === 'high')) {
        finalAction = 'content_removed';
      } else if (analysis.confidence >= shadowBanThreshold.confidence && analysis.severity === 'high') {
        finalAction = 'shadow_ban';
      } else if (analysis.confidence >= manualReviewThreshold.confidence) {
        finalAction = 'manual_review';
        requiresManualReview = true;
      } else {
        finalAction = 'warning';
      }
    }

    // Update moderation record with final action
    await supabase
      .from('content_moderation')
      .update({ action_taken: finalAction })
      .eq('id', moderationRecord.id);

    // Handle user moderation history and strikes
    if (!analysis.is_appropriate && finalAction !== 'approved') {
      await handleUserModerationAction(supabase, userId, moderationRecord.id, analysis.severity, finalAction);
    }

    // Add to manual review queue if needed
    if (requiresManualReview) {
      await supabase
        .from('moderation_queue')
        .insert({
          moderation_id: moderationRecord.id,
          priority: analysis.severity === 'high' ? 8 : 5,
          queue_type: 'standard',
          status: 'pending'
        });
    }

    console.log('Comprehensive moderation completed for:', contentId, {
      appropriate: analysis.is_appropriate,
      action: finalAction,
      severity: analysis.severity,
      confidence: analysis.confidence
    });

    return new Response(JSON.stringify({
      success: true,
      contentId,
      analysis: {
        is_appropriate: analysis.is_appropriate,
        severity: analysis.severity,
        confidence: analysis.confidence,
        action_taken: finalAction,
        categories: analysis.categories,
        flags: analysis.flags
      },
      moderation_id: moderationRecord.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in comprehensive-content-moderation function:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to handle user moderation actions and strikes
async function handleUserModerationAction(
  supabase: any, 
  userId: string, 
  moderationId: string, 
  severity: string, 
  action: string
) {
  try {
    // Calculate strike count based on severity
    const strikeCount = severity === 'critical' ? 3 : severity === 'high' ? 2 : 1;
    
    // Calculate expiration (strikes expire after 30 days)
    const strikeExpiration = new Date();
    strikeExpiration.setDate(strikeExpiration.getDate() + 30);

    // Determine restrictions based on action
    let isShadowBanned = false;
    let shadowBanExpiration = null;
    let isRestricted = false;
    let restrictionExpiration = null;

    if (action === 'shadow_ban') {
      isShadowBanned = true;
      shadowBanExpiration = new Date();
      shadowBanExpiration.setHours(shadowBanExpiration.getHours() + 24); // 24 hour shadow ban
    } else if (action === 'content_removed' && severity === 'critical') {
      isRestricted = true;
      restrictionExpiration = new Date();
      restrictionExpiration.setDate(restrictionExpiration.getDate() + 7); // 7 day restriction
    }

    // Insert moderation history record
    await supabase
      .from('user_moderation_history')
      .insert({
        user_id: userId,
        moderation_id: moderationId,
        strike_count: strikeCount,
        strike_severity: severity,
        strike_expires_at: strikeExpiration.toISOString(),
        is_shadow_banned: isShadowBanned,
        shadow_ban_expires_at: shadowBanExpiration?.toISOString(),
        is_restricted: isRestricted,
        restriction_expires_at: restrictionExpiration?.toISOString()
      });

    console.log(`Applied moderation action to user ${userId}:`, {
      action,
      strikes: strikeCount,
      shadowBanned: isShadowBanned,
      restricted: isRestricted
    });

  } catch (error) {
    console.error('Error handling user moderation action:', error);
    // Don't throw here - we don't want to fail the entire moderation process
  }
}