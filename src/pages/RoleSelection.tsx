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
      bgClass: 'bg-muted/40'
    },
    {
      id: 'fan' as const,
      title: 'FAN', 
      description: 'Explanation of Fan - TBD consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
      bgClass: 'bg-background border-2 border-foreground'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          WELCOME TO<br />
          STREAMCENTIVES!
        </h1>
      </div>

      {/* Role Selection */}
      <div className="w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-12 tracking-wide">
          ARE YOU A
        </h2>
        
        <div className="space-y-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`
                ${role.bgClass} 
                ${selectedRole === role.id ? 'ring-2 ring-primary' : ''}
                rounded-lg p-8 cursor-pointer transition-all duration-200 hover:scale-[1.02]
              `}
              onClick={() => setSelectedRole(role.id)}
            >
              <h3 className="text-3xl font-bold text-center mb-4 tracking-wide">
                {role.title}
              </h3>
              <p className="text-sm text-center leading-relaxed px-4">
                {role.description}
              </p>
            </div>
          ))}
          
          {/* Sponsor Section */}
          <div className="text-center pt-8">
            <div 
              className={`
                cursor-pointer transition-all duration-200 hover:scale-[1.02]
                ${selectedRole === 'sponsor' ? 'text-primary' : ''}
              `}
              onClick={() => setSelectedRole('sponsor')}
            >
              <h3 className="text-3xl font-bold tracking-wide">
                SPONSOR?
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      {selectedRole && (
        <div className="w-full max-w-lg mt-12">
          <button
            onClick={() => handleRoleSelection(selectedRole)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 hover:scale-[1.02]"
          >
            Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
          </button>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground max-w-md">
          Don't worry - you can always switch between roles later in your profile settings
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;