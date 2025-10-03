import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MessageSquare, Flag, Shield } from 'lucide-react';

interface ContentModerationWrapperProps {
  contentId: string;
  contentType: 'community_post' | 'community_message' | 'post_comment';
  userId?: string;
  children: React.ReactNode;
  showReportButton?: boolean;
}

interface ModerationStatus {
  is_moderated: boolean;
  is_appropriate: boolean;
  action_taken: string;
  severity?: string;
  can_appeal: boolean;
  user_strike_count?: number;
}

export const ContentModerationWrapper: React.FC<ContentModerationWrapperProps> = ({
  contentId,
  contentType,
  userId,
  children,
  showReportButton = true
}) => {
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportContext, setReportContext] = useState('');

  useEffect(() => {
    checkModerationStatus();
  }, [contentId, contentType]);

  const checkModerationStatus = async () => {
    try {
      // Check if user is restricted
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get content moderation status
      const { data: moderationData } = await supabase
        .from('content_moderation')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .single();

      // Get user strike count
      const { data: strikeData } = await supabase
        .rpc('get_user_strike_count', { target_user_id: userId || user.id });

      // Check if user is restricted
      const { data: restrictionData } = await supabase
        .rpc('is_user_restricted', { target_user_id: userId || user.id });

      const isAppropriate = moderationData?.moderation_status === 'approved';
      const actionTaken = moderationData?.moderation_status || 'approved';
      
      setModerationStatus({
        is_moderated: !!moderationData,
        is_appropriate: isAppropriate,
        action_taken: actionTaken,
        severity: undefined,
        can_appeal: moderationData && !isAppropriate && 
                   !restrictionData && (actionTaken !== 'approved'),
        user_strike_count: strikeData || 0
      });

    } catch (error) {
      console.error('Error checking moderation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Submit user report
      await supabase.functions.invoke('moderate-community-content', {
        body: {
          type: 'user_report',
          reporter_id: user.id,
          reported_content_id: contentId,
          reported_content_type: contentType,
          reported_user_id: userId,
          report_category: reportReason.split(':')[0],
          report_reason: reportReason,
          additional_context: reportContext
        }
      });

      setShowReportModal(false);
      setReportReason('');
      setReportContext('');
      
      // Show success message
      alert('Report submitted successfully. Our moderation team will review this content.');

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleAppeal = async () => {
    if (!moderationStatus?.can_appeal) return;

    const appealReason = prompt('Please explain why you believe this moderation decision was incorrect:');
    if (!appealReason?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get moderation record
      const { data: moderationData } = await supabase
        .from('content_moderation')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .single();

      if (!moderationData) return;

      // Submit appeal
      await supabase.functions.invoke('moderate-community-content', {
        body: {
          type: 'appeal',
          user_id: user.id,
          moderation_id: moderationData.id,
          appeal_reason: 'User disagrees with moderation decision',
          user_statement: appealReason
        }
      });

      alert('Appeal submitted successfully. Our team will review your case within 24-48 hours.');
      
      // Refresh moderation status
      checkModerationStatus();

    } catch (error) {
      console.error('Error submitting appeal:', error);
      alert('Failed to submit appeal. Please try again.');
    }
  };

  if (loading) {
    return <div className="animate-pulse">{children}</div>;
  }

  // Content was removed by moderation
  if (moderationStatus?.action_taken === 'content_removed') {
    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <Alert className="border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>This content has been removed for violating our community guidelines.</span>
            {moderationStatus.can_appeal && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAppeal}
                className="ml-2"
              >
                Appeal Decision
              </Button>
            )}
          </AlertDescription>
        </Alert>
        {moderationStatus.user_strike_count && moderationStatus.user_strike_count > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            Account strikes: {moderationStatus.user_strike_count}
          </div>
        )}
      </div>
    );
  }

  // Content is shadow banned (only show to content creator)
  if (moderationStatus?.action_taken === 'shadow_ban') {
    // Check if current user is the content creator (this will be handled by effect)
    const [currentUser, setCurrentUser] = React.useState(null);
    
    React.useEffect(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
      });
    }, []);

    const isContentCreator = currentUser?.id === userId;

    if (isContentCreator) {
      return (
        <div className="relative">
          <div className="opacity-75 border border-orange-200 rounded-lg p-2">
            {children}
          </div>
          <Alert className="mt-2 border-orange-200">
            <Shield className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">This content has limited visibility due to our community guidelines.</span>
              {moderationStatus.can_appeal && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAppeal}
                  className="ml-2"
                >
                  Appeal
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      );
    } else {
      // Shadow banned content is not visible to other users
      return null;
    }
  }

  // Content needs manual review
  if (moderationStatus?.action_taken === 'manual_review') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <Alert className="mt-2 border-yellow-200">
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            This content is under review by our moderation team.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Normal content with optional report button
  return (
    <div className="relative group">
      {children}
      
      {showReportButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowReportModal(true)}
        >
          <Flag className="h-3 w-3" />
          Report
        </Button>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Report Content</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reason for reporting:</label>
                <select 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a reason...</option>
                  <option value="hate_speech:Hate speech or discrimination">Hate speech or discrimination</option>
                  <option value="violence_incitement:Violence or threats">Violence or threats</option>
                  <option value="safety_harassment:Harassment or bullying">Harassment or bullying</option>
                  <option value="nudity_sexual:Inappropriate sexual content">Inappropriate sexual content</option>
                  <option value="authenticity_spam:Spam or fake content">Spam or fake content</option>
                  <option value="privacy_doxxing:Privacy violation">Privacy violation</option>
                  <option value="misinformation:False information">False information</option>
                  <option value="other:Other violation">Other violation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional context (optional):</label>
                <textarea
                  value={reportContext}
                  onChange={(e) => setReportContext(e.target.value)}
                  placeholder="Provide any additional details..."
                  className="w-full p-2 border rounded-md h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReport}
                  disabled={!reportReason.trim()}
                >
                  Submit Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};