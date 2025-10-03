import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserSearchInput } from '@/components/UserSearchInput';
import { UserPlus, CheckCircle, XCircle, Users } from 'lucide-react';

interface Guest {
  id: string;
  guest_id: string;
  status: string;
  joined_at: string | null;
  profile: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface StreamGuestManagerProps {
  streamId: string;
  isCreator: boolean;
}

export function StreamGuestManager({ streamId, isCreator }: StreamGuestManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchGuests();
    setupRealtimeUpdates();
  }, [streamId]);

  const fetchGuests = async () => {
    try {
      const { data } = await supabase
        .from('live_stream_guests')
        .select(`
          *,
          profile:profiles!guest_id(display_name, username, avatar_url)
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (data) setGuests(data as any);
    } catch (error) {
      console.error('Error fetching guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    const channel = supabase
      .channel(`stream-guests-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_stream_guests',
          filter: `stream_id=eq.${streamId}`
        },
        () => {
          fetchGuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const inviteGuest = async (guestId: string) => {
    setInviting(true);
    try {
      const { error } = await supabase
        .from('live_stream_guests')
        .insert({
          stream_id: streamId,
          guest_id: guestId,
          status: 'invited'
        });

      if (error) throw error;

      toast({
        title: 'Guest Invited',
        description: 'The guest has been invited to join your stream'
      });
    } catch (error: any) {
      console.error('Error inviting guest:', error);
      toast({
        title: 'Error',
        description: 'Failed to invite guest',
        variant: 'destructive'
      });
    } finally {
      setInviting(false);
    }
  };

  const updateGuestStatus = async (guestRecordId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('live_stream_guests')
        .update({ status })
        .eq('id', guestRecordId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Guest invitation ${status}`
      });
    } catch (error: any) {
      console.error('Error updating guest status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited':
        return <Badge variant="secondary">Invited</Badge>;
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-4">Loading guests...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Stream Guests ({guests.length})
          </span>
          {isCreator && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Guest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Guest to Stream</DialogTitle>
                </DialogHeader>
                <UserSearchInput
                  value={searchValue}
                  onChange={setSearchValue}
                  onUserSelect={(selectedUser) => {
                    inviteGuest(selectedUser.user_id);
                    setSearchValue('');
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {guests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No guests yet</p>
            {isCreator && <p className="text-sm">Invite others to join your stream</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {guests.map((guest) => (
              <div key={guest.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={guest.profile.avatar_url || undefined} />
                    <AvatarFallback>{guest.profile.display_name?.[0] || 'G'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{guest.profile.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{guest.profile.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(guest.status)}
                  
                  {!isCreator && guest.guest_id === user?.id && guest.status === 'invited' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateGuestStatus(guest.id, 'accepted')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateGuestStatus(guest.id, 'declined')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
