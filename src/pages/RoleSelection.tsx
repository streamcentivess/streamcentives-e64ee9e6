import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Music, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'fan' | 'creator' | 'sponsor' | null>(null);

  const handleRoleSelection = (role: 'fan' | 'creator' | 'sponsor') => {
    setSelectedRole(role);
    // Store selected role in sessionStorage to pass to profile setup
    sessionStorage.setItem('selectedRole', role);
    navigate('/profile-setup');
  };

  const roles = [
    {
      id: 'creator' as const,
      title: 'CREATOR',
      description: 'Explanation of Creator - TBD consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
      icon: Music,
      selected: selectedRole === 'creator'
    },
    {
      id: 'fan' as const,
      title: 'FAN', 
      description: 'Explanation of Fan - TBD consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
      icon: Users,
      selected: selectedRole === 'fan'
    },
    {
      id: 'sponsor' as const,
      title: 'SPONSOR',
      description: 'Explanation of Sponsor - TBD consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
      icon: Building2,
      selected: selectedRole === 'sponsor'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-8">
            WELCOME TO<br />STREAMCENTIVES!
          </h1>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-8">ARE YOU A</h2>
          
          <div className="space-y-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = role.id === selectedRole;
              
              return (
                <Card 
                  key={role.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : role.id === 'creator'
                        ? 'bg-muted/50 border-2 border-foreground' 
                        : 'bg-background border-2 border-foreground'
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold">
                      {role.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {role.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {selectedRole && (
          <div className="text-center">
            <Button 
              onClick={() => handleRoleSelection(selectedRole)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3"
              size="lg"
            >
              Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Button>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Don't worry - you can always switch between roles later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;