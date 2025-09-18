import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, MessageCircle, ShoppingCart, Trophy, Sparkles, Users, Target, Briefcase } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'fan' | 'creator' | 'sponsor';
}

export function WelcomeModal({ isOpen, onClose, role = 'fan' }: WelcomeModalProps) {
  const getRoleSpecificContent = () => {
    switch (role) {
      case 'sponsor':
        return {
          title: "Welcome to Streamcentives, Sponsor!",
          description: "Thank you for joining as a sponsor! We've gifted you 250 XP to explore our creator ecosystem.",
          xpDescription: "Your starting gift to discover and connect with amazing creators!",
          howToUse: "How to Use Your Platform:",
          cards: [
            {
              icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
              bgColor: "bg-blue-100 dark:bg-blue-900/30",
              title: "Discover Creators",
              description: "Browse and connect with talented artists and content creators looking for sponsorship opportunities."
            },
            {
              icon: <Target className="w-5 h-5 text-green-600 dark:text-green-400" />,
              bgColor: "bg-green-100 dark:bg-green-900/30",
              title: "Launch Campaigns",
              description: "Create targeted sponsorship campaigns and collaborate with creators that align with your brand."
            },
            {
              icon: <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
              bgColor: "bg-purple-100 dark:bg-purple-900/30",
              title: "Manage Partnerships",
              description: "Track campaign performance, manage creator relationships, and measure your ROI effectively."
            }
          ],
          proTip: "Connect with creators whose audience matches your target demographic for maximum impact!"
        };
        
      case 'creator':
        return {
          title: "Welcome to Streamcentives, Creator!",
          description: "Thank you for joining as a creator! We've gifted you 250 XP to start building your community.",
          xpDescription: "Your starting gift to begin monetizing your creativity!",
          howToUse: "How to Use Your XP:",
          cards: [
            {
              icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
              bgColor: "bg-blue-100 dark:bg-blue-900/30",
              title: "Engage with Fans",
              description: "Respond to fan messages and build stronger relationships with your community."
            },
            {
              icon: <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />,
              bgColor: "bg-green-100 dark:bg-green-900/30",
              title: "Create Rewards",
              description: "Set up exclusive merchandise, experiences, and digital content for your fans to purchase."
            },
            {
              icon: <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
              bgColor: "bg-purple-100 dark:bg-purple-900/30",
              title: "Launch Campaigns",
              description: "Create engaging campaigns to boost your content and attract sponsor partnerships."
            }
          ],
          proTip: "Consistent engagement and quality content will help you earn more XP and grow your fanbase!"
        };
        
      default: // fan
        return {
          title: "Welcome to Streamcentives!",
          description: "Thank you for joining our community! We've gifted you 250 XP to get you started.",
          xpDescription: "Your starting gift to explore everything Streamcentives has to offer!",
          howToUse: "How to Use Your XP:",
          cards: [
            {
              icon: <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
              bgColor: "bg-blue-100 dark:bg-blue-900/30",
              title: "Send Messages to Creators",
              description: "Connect directly with your favorite artists and creators. Message costs vary by creator."
            },
            {
              icon: <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />,
              bgColor: "bg-green-100 dark:bg-green-900/30",
              title: "Shop in the Marketplace",
              description: "Redeem exclusive rewards, merchandise, and experiences from creators."
            },
            {
              icon: <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
              bgColor: "bg-purple-100 dark:bg-purple-900/30",
              title: "Earn More XP",
              description: "Listen to music, share content, participate in campaigns, and engage with the community to earn more XP."
            }
          ],
          proTip: "Follow your favorite creators and share their content to earn even more XP!"
        };
    }
  };

  const content = getRoleSpecificContent();

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
            {content.title}
          </DialogTitle>
          <p className="text-muted-foreground">
            {content.description.split('250 XP')[0]}
            <span className="font-semibold text-primary">250 XP</span>
            {content.description.split('250 XP')[1]}
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
                  {content.xpDescription}
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{content.howToUse}</h3>
            
            <div className="grid gap-4">
              {content.cards.map((card, index) => (
                <Card key={index} className="p-4 border-muted/50">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center mt-1`}>
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{card.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Pro Tip:</strong> {content.proTip}
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