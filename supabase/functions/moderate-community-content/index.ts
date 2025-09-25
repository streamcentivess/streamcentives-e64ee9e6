import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { getErrorMessage } from '../_shared/error-utils.ts';

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
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different moderation triggers
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.type === 'INSERT') {
        // New content created - trigger moderation
        const record = body.record;
        await handleContentModeration(supabase, record, body.table);
      } else if (body.type === 'user_report') {
        // User reported content
        await handleUserReport(supabase, body);
      } else if (body.type === 'appeal') {
        // User appealing moderation decision
        await handleModerationAppeal(supabase, body);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in moderate-community-content function:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: getErrorMessage(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleContentModeration(supabase: any, record: any, table: string) {
  console.log(`Moderating new ${table} content:`, record.id);

  // Determine content type and extract content
  let contentType: string;
  let content: string;
  let mediaUrls: string[] = [];
  let userId: string;

  switch (table) {
    case 'community_posts':
      contentType = 'community_post';
      content = `${record.title || ''} ${record.content || ''}`.trim();
      mediaUrls = record.media_urls || [];
      userId = record.author_id;
      break;
    
    case 'community_messages':
      contentType = 'community_message';
      content = record.content || '';
      userId = record.user_id;
      break;
    
    case 'post_comments':
      contentType = 'post_comment';
      content = record.content || '';
      userId = record.user_id;
      break;
    
    default:
      console.log(`Unsupported table for moderation: ${table}`);
      return;
  }

  if (!content.trim() && mediaUrls.length === 0) {
    console.log('No content to moderate');
    return;
  }

  // Call comprehensive moderation function
  try {
    const moderationResponse = await fetch(`${supabaseUrl}/functions/v1/comprehensive-content-moderation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        contentId: record.id,
        contentType,
        userId,
        mediaUrls
      }),
    });

    if (!moderationResponse.ok) {
      throw new Error(`Moderation API error: ${moderationResponse.status}`);
    }

    const moderationResult = await moderationResponse.json();
    console.log('Moderation result:', moderationResult);

    // Apply content actions based on moderation result
    if (moderationResult.analysis?.action_taken === 'content_removed') {
      await removeContent(supabase, table, record.id);
    } else if (moderationResult.analysis?.action_taken === 'shadow_ban') {
      await shadowBanContent(supabase, table, record.id);
    }

  } catch (error) {
    console.error('Error calling moderation API:', error);
    // In case of moderation API failure, flag for manual review
    await flagForManualReview(supabase, record, table, contentType, userId);
  }
}

async function handleUserReport(supabase: any, reportData: any) {
  console.log('Processing user report:', reportData);

  const { 
    reporter_id, 
    reported_content_id, 
    reported_content_type, 
    reported_user_id,
    report_category,
    report_reason,
    additional_context 
  } = reportData;

  // Insert user report
  const { error: reportError } = await supabase
    .from('user_reports')
    .insert({
      reporter_id,
      reported_content_id,
      reported_content_type,
      reported_user_id,
      report_category,
      report_reason,
      additional_context,
      status: 'pending'
    });

  if (reportError) {
    console.error('Error creating user report:', reportError);
    return;
  }

  // Check if this content already has a moderation record
  const { data: existingModeration } = await supabase
    .from('content_moderation')
    .select('*')
    .eq('content_id', reported_content_id)
    .eq('content_type', reported_content_type)
    .single();

  if (existingModeration) {
    // Add to moderation queue for human review with higher priority
    await supabase
      .from('moderation_queue')
      .insert({
        moderation_id: existingModeration.id,
        priority: 9, // High priority for user reports
        queue_type: 'escalated',
        escalation_reason: `User report: ${report_category}`,
        status: 'pending'
      });
  } else {
    // Trigger fresh moderation on reported content
    await triggerContentModeration(supabase, reported_content_id, reported_content_type, reported_user_id);
  }
}

async function handleModerationAppeal(supabase: any, appealData: any) {
  console.log('Processing moderation appeal:', appealData);

  const {
    user_id,
    moderation_id,
    appeal_reason,
    appeal_evidence,
    user_statement
  } = appealData;

  // Create appeal record
  const { error: appealError } = await supabase
    .from('moderation_appeals')
    .insert({
      user_id,
      moderation_id,
      appeal_reason,
      appeal_evidence,
      user_statement,
      status: 'pending'
    });

  if (appealError) {
    console.error('Error creating appeal:', appealError);
    return;
  }

  // Add to moderation queue for human review
  await supabase
    .from('moderation_queue')
    .insert({
      moderation_id,
      priority: 7, // High priority for appeals
      queue_type: 'appeal',
      status: 'pending'
    });

  // Update user moderation history to reflect appeal submission
  await supabase
    .from('user_moderation_history')
    .update({
      appeal_submitted: true,
      appeal_status: 'pending'
    })
    .eq('moderation_id', moderation_id);
}

async function removeContent(supabase: any, table: string, contentId: string) {
  console.log(`Removing content from ${table}:`, contentId);

  // Mark content as deleted rather than actually deleting
  // This preserves data for appeals and auditing
  const updateField = table === 'community_posts' ? 'is_deleted' : 'deleted_at';
  const updateValue = table === 'community_posts' ? true : new Date().toISOString();

  await supabase
    .from(table)
    .update({ [updateField]: updateValue })
    .eq('id', contentId);
}

async function shadowBanContent(supabase: any, table: string, contentId: string) {
  console.log(`Shadow banning content from ${table}:`, contentId);

  // Mark content as shadow banned (visible to author but not others)
  await supabase
    .from(table)
    .update({ 
      is_shadow_banned: true,
      shadow_banned_at: new Date().toISOString()
    })
    .eq('id', contentId);
}

async function flagForManualReview(
  supabase: any, 
  record: any, 
  table: string, 
  contentType: string, 
  userId: string
) {
  console.log(`Flagging ${table} content for manual review:`, record.id);

  try {
    // Create basic moderation record
    const { data: moderationRecord } = await supabase
      .from('content_moderation')
      .insert({
        content_id: record.id,
        content_type: contentType,
        user_id: userId,
        is_appropriate: false, // Conservative assumption
        severity: 'medium',
        confidence: 0.1, // Low confidence due to error
        flags: ['Moderation API error - requires manual review'],
        action_taken: 'manual_review',
        auto_actioned: false,
        original_content: record.content || record.title || 'Content unavailable'
      })
      .select()
      .single();

    if (moderationRecord) {
      // Add to manual review queue
      await supabase
        .from('moderation_queue')
        .insert({
          moderation_id: moderationRecord.id,
          priority: 8, // High priority due to system error
          queue_type: 'escalated',
          escalation_reason: 'Moderation system error',
          status: 'pending'
        });
    }
  } catch (error) {
    console.error('Error flagging content for manual review:', error);
  }
}

async function triggerContentModeration(
  supabase: any, 
  contentId: string, 
  contentType: string, 
  userId: string
) {
  // Fetch the actual content based on type
  let content = '';
  let mediaUrls: string[] = [];

  try {
    let query;
    switch (contentType) {
      case 'community_post':
        query = supabase.from('community_posts').select('title, content, media_urls').eq('id', contentId).single();
        break;
      case 'community_message':
        query = supabase.from('community_messages').select('content').eq('id', contentId).single();
        break;
      case 'post_comment':
        query = supabase.from('post_comments').select('content').eq('id', contentId).single();
        break;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    const { data: contentData } = await query;
    if (contentData) {
      if (contentType === 'community_post') {
        content = `${contentData.title || ''} ${contentData.content || ''}`.trim();
        mediaUrls = contentData.media_urls || [];
      } else {
        content = contentData.content || '';
      }
    }

    // Call comprehensive moderation
    await fetch(`${supabaseUrl}/functions/v1/comprehensive-content-moderation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        contentId,
        contentType,
        userId,
        mediaUrls
      }),
    });

  } catch (error) {
    console.error('Error triggering content moderation:', error);
  }
}