import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, MessageCircle, ShoppingCart, Trophy, Sparkles } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome to Streamcentives!
          </DialogTitle>
          <p className="text-muted-foreground">
            Thank you for joining our community! We've gifted you <span className="font-semibold text-primary">250 XP</span> to get you started.
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your XP Balance: 250 XP</h3>
                <p className="text-muted-foreground text-sm">
                  Your starting gift to explore everything Streamcentives has to offer!
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">How to Use Your XP:</h3>
            
            <div className="grid gap-4">
              <Card className="p-4 border-muted/50">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mt-1">
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Send Messages to Creators</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect directly with your favorite artists and creators. Message costs vary by creator.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-muted/50">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mt-1">
                    <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Shop in the Marketplace</h4>
                    <p className="text-sm text-muted-foreground">
                      Redeem exclusive rewards, merchandise, and experiences from creators.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-muted/50">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mt-1">
                    <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Earn More XP</h4>
                    <p className="text-sm text-muted-foreground">
                      Listen to music, share content, participate in campaigns, and engage with the community to earn more XP.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Pro Tip:</strong> Follow your favorite creators and share their content to earn even more XP!
            </p>
          </div>

          <Button onClick={onClose} className="w-full" size="lg">
            Start Exploring Streamcentives
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}