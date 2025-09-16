import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Send, Edit3, Gift, Star } from 'lucide-react';

interface ShoutoutPreviewProps {
  fan: { user_id: string; display_name: string; username: string; avatar_url: string } | null;
  shoutoutText: string;
  onShoutoutEdit: (newText: string) => void;
  selectedReward?: { id: string; title: string; image_url?: string; xp_cost?: number; cash_price?: number } | null;
  onSend: () => void;
  sending: boolean;
}

export function ShoutoutPreview({ 
  fan, 
  shoutoutText, 
  onShoutoutEdit, 
  selectedReward, 
  onSend, 
  sending 
}: ShoutoutPreviewProps) {
  if (!fan || !shoutoutText) {
    return (
      <Card className="card-modern">
        <CardContent className="p-8 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Generate a shoutout to see the preview
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <Card className="card-modern border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Shoutout Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fan Header */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-surface">
            <Avatar className="h-12 w-12">
              <AvatarImage src={fan.avatar_url} />
              <AvatarFallback>{fan.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{fan.display_name}</h3>
              <p className="text-sm text-muted-foreground">@{fan.username}</p>
            </div>
            <div className="ml-auto">
              <Badge className="bg-primary/10 text-primary">
                <Star className="h-3 w-3 mr-1" />
                Shoutout
              </Badge>
            </div>
          </div>

          {/* Shoutout Text - Editable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Shoutout Message</label>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Edit3 className="h-3 w-3" />
                Editable
              </div>
            </div>
            <Textarea
              value={shoutoutText}
              onChange={(e) => onShoutoutEdit(e.target.value)}
              className="min-h-[120px] resize-none"
              placeholder="Your personalized shoutout message..."
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Perfect for social media posts</span>
              <span>{shoutoutText.length} characters</span>
            </div>
          </div>

          {/* Attached Reward */}
          {selectedReward && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Reward Included</h4>
                  <p className="text-sm text-muted-foreground">{selectedReward.title}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {selectedReward.xp_cost ? `${selectedReward.xp_cost} XP` : `$${selectedReward.cash_price}`}
                </Badge>
              </div>
            </div>
          )}

          {/* How it appears to the fan */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">How this appears to {fan.display_name}</label>
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">You received a shoutout!</span>
                </div>
                <div className="bg-background/50 p-3 rounded-md">
                  <p className="text-sm">{shoutoutText}</p>
                </div>
                {selectedReward && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Gift className="h-3 w-3" />
                    <span>+ {selectedReward.title} reward attached</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  From your creator • Just now
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Button */}
      <Card className="card-modern">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ready to send?</h3>
              <p className="text-sm text-muted-foreground">
                This will deliver the shoutout directly to {fan.display_name}'s profile
              </p>
            </div>
            <Button 
              onClick={onSend} 
              disabled={sending || !shoutoutText.trim()}
              className="bg-gradient-primary hover:opacity-90"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Shoutout
                </>
              )}
            </Button>
          </div>
          
          {selectedReward && (
            <div className="mt-3 p-3 rounded-md bg-muted/30 text-xs text-muted-foreground">
              <strong>Note:</strong> The attached reward will be automatically delivered to {fan.display_name} when they view the shoutout.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}