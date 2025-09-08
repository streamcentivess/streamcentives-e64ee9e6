import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Music, Target, BarChart3, Gift, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleSelectionProps {
  onRoleSelect: (role: 'fan' | 'creator') => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  const navigate = useNavigate();

  const handleRoleSelection = (role: 'fan' | 'creator') => {
    onRoleSelect(role);
    if (role === 'fan') {
      navigate('/fan-dashboard');
    } else {
      navigate('/creator-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Welcome to Streamcentives!
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose your path to get started with the perfect experience for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Fan Path */}
          <Card 
            className="card-modern cursor-pointer hover:scale-105 transition-all duration-300 group"
            onClick={() => handleRoleSelection('fan')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-300">
                <Users className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">I'm a Fan</CardTitle>
              <p className="text-muted-foreground">
                Support your favorite creators and earn rewards
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Earn XP for streams, shares, and engagement</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Unlock exclusive rewards and experiences</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Compete on leaderboards</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Join campaigns and challenges</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button className="w-full bg-gradient-primary hover:opacity-90 group-hover:scale-105 transition-all duration-300">
                  <Users className="h-4 w-4 mr-2" />
                  Start as a Fan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Creator Path */}
          <Card 
            className="card-modern cursor-pointer hover:scale-105 transition-all duration-300 group"
            onClick={() => handleRoleSelection('creator')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 group-hover:from-secondary/30 group-hover:to-accent/30 transition-all duration-300">
                <Music className="h-16 w-16 text-secondary" />
              </div>
              <CardTitle className="text-2xl font-bold">I'm a Creator</CardTitle>
              <p className="text-muted-foreground">
                Engage your audience with campaigns and rewards
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-sm">Create AI-powered campaigns</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-sm">Reward and engage your fans</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-sm">Access detailed analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-sm">Generate new revenue streams</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button className="w-full bg-gradient-accent hover:opacity-90 group-hover:scale-105 transition-all duration-300">
                  <Music className="h-4 w-4 mr-2" />
                  Start as a Creator
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don't worry - you can always switch between roles later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;