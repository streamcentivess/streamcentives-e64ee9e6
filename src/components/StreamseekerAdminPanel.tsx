import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  MessageSquare,
  Clock,
  Shield,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VerificationBadge } from '@/components/VerificationBadge';

interface PendingArtist {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  eligibility_status: string;
  profile_completion_score: number;
  created_at: string;
  pro_registration: boolean;
  profile_complete: boolean;
  social_media_linked: boolean;
  content_uploaded: boolean;
  checklist_score: number;
  follower_count: number;
}

const StreamseekerAdminPanel = () => {
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<PendingArtist | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'review'>('review');
  const { toast } = useToast();

  const fetchPendingArtists = async () => {
    setLoading(true);
    try {
      // First get streamseeker artists
      let artistQuery = supabase
        .from('streamseeker_artists')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        artistQuery = artistQuery.eq('eligibility_status', filter);
      }

      const { data: artistsData, error: artistsError } = await artistQuery;

      if (artistsError) {
        console.error('Error fetching artists:', artistsError);
        return;
      }

      if (!artistsData || artistsData.length === 0) {
        setPendingArtists([]);
        return;
      }

      // Get all user IDs
      const userIds = artistsData.map(artist => artist.user_id);

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get checklists for these users
      const { data: checklistsData, error: checklistsError } = await supabase
        .from('streamseeker_checklist')
        .select('*')
        .in('artist_id', userIds);

      if (checklistsError) {
        console.error('Error fetching checklists:', checklistsError);
        return;
      }

      // Get follower counts for these users
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select('following_id')
        .in('following_id', userIds);

      if (followersError) {
        console.error('Error fetching followers:', followersError);
        return;
      }

      // Calculate follower counts
      const followerCounts = userIds.reduce((acc, userId) => {
        acc[userId] = followersData?.filter(f => f.following_id === userId).length || 0;
        return acc;
      }, {} as Record<string, number>);

      // Combine the data
      const formattedData = artistsData.map(artist => {
        const profile = profilesData?.find(p => p.user_id === artist.user_id);
        const checklist = checklistsData?.find(c => c.artist_id === artist.user_id);

        return {
          user_id: artist.user_id,
          username: profile?.username || '',
          display_name: profile?.display_name || '',
          avatar_url: profile?.avatar_url || '',
          bio: profile?.bio || '',
          eligibility_status: artist.eligibility_status,
          profile_completion_score: artist.profile_completion_score,
          created_at: artist.created_at,
          pro_registration: checklist?.pro_registration || false,
          profile_complete: checklist?.profile_complete || false,
          social_media_linked: checklist?.social_media_linked || false,
          content_uploaded: checklist?.content_uploaded || false,
          checklist_score: checklist?.checklist_score || 0,
          follower_count: followerCounts[artist.user_id] || 0
        };
      });

      setPendingArtists(formattedData);
    } catch (error) {
      console.error('Error in fetchPendingArtists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (artist: PendingArtist, action: 'approve' | 'reject' | 'request_changes') => {
    setSelectedArtist(artist);
    setActionType(action);
    setReviewModalOpen(true);
    setAdminNotes('');
    setRejectionReason('');
  };

  const submitReview = async () => {
    if (!selectedArtist) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('admin_review_streamseeker_artist', {
        artist_user_id: selectedArtist.user_id,
        action_type_param: actionType,
        admin_notes_param: adminNotes || null,
        rejection_reason_param: rejectionReason || null
      });

      if (error) {
        console.error('Error reviewing artist:', error);
        toast({
          title: "Error",
          description: "Failed to submit review",
          variant: "destructive"
        });
        return;
      }

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Review Submitted",
          description: `Artist ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'sent back for changes'}`,
          variant: "default"
        });

        setReviewModalOpen(false);
        fetchPendingArtists(); // Refresh the list
      }
    } catch (error) {
      console.error('Error in submitReview:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'review':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'review':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    fetchPendingArtists();
  }, [filter]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Streamseeker Admin Panel
          </CardTitle>
          <p className="text-muted-foreground">
            Review and approve artists who have completed their eligibility checklist
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant={filter === 'review' ? 'default' : 'outline'}
              onClick={() => setFilter('review')}
            >
              Needs Review ({pendingArtists.filter(a => a.eligibility_status === 'review').length})
            </Button>
            <Button 
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingArtists.filter(a => a.eligibility_status === 'pending').length})
            </Button>
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All ({pendingArtists.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Artists List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : pendingArtists.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Artists to Review</h3>
            <p className="text-muted-foreground">
              {filter === 'review' 
                ? "No artists are currently awaiting review"
                : "No artists match the current filter"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingArtists.map((artist) => (
            <Card key={artist.user_id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={artist.avatar_url} />
                      <AvatarFallback>
                        {(artist.display_name || artist.username)?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {artist.display_name || artist.username}
                        </h3>
                        <div className="flex items-center gap-1">
                          <Badge variant={getStatusColor(artist.eligibility_status)}>
                            {getStatusIcon(artist.eligibility_status)}
                            {artist.eligibility_status}
                          </Badge>
                          <VerificationBadge 
                            isVerified={artist.eligibility_status === 'approved'}
                            followerCount={artist.follower_count}
                            size="sm"
                          />
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        @{artist.username} • {artist.follower_count.toLocaleString()} followers
                      </p>
                      
                      {artist.bio && (
                        <p className="text-sm mb-3">{artist.bio}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          {artist.pro_registration ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">PRO Registration</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {artist.profile_complete ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Profile Complete</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {artist.social_media_linked ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Social Links</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {artist.content_uploaded ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Content Uploaded</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Checklist Score: {artist.checklist_score}/100
                        </span>
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${artist.checklist_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {artist.eligibility_status !== 'approved' && (
                      <Button
                        onClick={() => handleReview(artist, 'approve')}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                    )}
                    
                    {artist.eligibility_status !== 'rejected' && (
                      <Button
                        onClick={() => handleReview(artist, 'reject')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleReview(artist, 'request_changes')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Request Changes
                    </Button>
                    
                    <Button
                      onClick={() => {/* Add view profile logic */}}
                      variant="ghost"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Artist' : 
               actionType === 'reject' ? 'Reject Artist' : 
               'Request Changes'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedArtist && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedArtist.avatar_url} />
                  <AvatarFallback>
                    {(selectedArtist.display_name || selectedArtist.username)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedArtist.display_name || selectedArtist.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{selectedArtist.username}
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="admin-notes">Admin Notes (Internal)</Label>
              <Textarea
                id="admin-notes"
                placeholder="Internal notes about this review decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
            
            {(actionType === 'reject' || actionType === 'request_changes') && (
              <div>
                <Label htmlFor="rejection-reason">
                  {actionType === 'reject' ? 'Rejection Reason' : 'Changes Needed'}
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="This message will be sent to the artist..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitReview}
              disabled={processing || ((actionType === 'reject' || actionType === 'request_changes') && !rejectionReason)}
            >
              {processing ? 'Processing...' : 
               actionType === 'approve' ? 'Approve' : 
               actionType === 'reject' ? 'Reject' : 
               'Send Back for Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StreamseekerAdminPanel;