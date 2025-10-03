import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Radio, StopCircle, Users, Eye, Gift } from 'lucide-react';

interface StreamControlsProps {
  streamId: string;
  status: string;
  viewerCount: number;
  totalGifts: number;
  totalXP: number;
  onStatusChange?: () => void;
}

export function StreamControls({
  streamId,
  status,
  viewerCount,
  totalGifts,
  totalXP,
  onStatusChange
}: StreamControlsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const endStream = async () => {
    if (!confirm('Are you sure you want to end this stream?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (error) throw error;

      toast({
        title: 'Stream Ended',
        description: 'Your live stream has ended successfully'
      });

      onStatusChange?.();
    } catch (error: any) {
      console.error('Error ending stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to end stream',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Stream Controls</span>
          <Badge variant={status === 'live' ? 'destructive' : 'secondary'}>
            {status === 'live' && <Radio className="h-3 w-3 mr-1 animate-pulse" />}
            {status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{viewerCount}</p>
            <p className="text-xs text-muted-foreground">Viewers</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{totalGifts}</p>
            <p className="text-xs text-muted-foreground">Gifts</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <span className="text-sm">✨</span>
            </div>
            <p className="text-2xl font-bold">{totalXP}</p>
            <p className="text-xs text-muted-foreground">XP Earned</p>
          </div>
        </div>

        {/* Controls */}
        {status === 'live' && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={endStream}
            disabled={loading}
          >
            <StopCircle className="h-4 w-4 mr-2" />
            End Stream
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
