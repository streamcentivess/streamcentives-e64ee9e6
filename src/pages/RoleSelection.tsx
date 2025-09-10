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
      description: 'Build deeper connections with your audience while earning from your content. Access powerful tools to engage fans and monetize your creativity.',
      bgClass: 'bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20'
    },
    {
      id: 'fan' as const,
      title: 'FAN', 
      description: 'Support your favorite creators and earn rewards for your engagement. Get exclusive access to content and experiences.',
      bgClass: 'bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="/lovable-uploads/streamcentivesloveable.PNG" 
            alt="StreamCentives Logo" 
            className="w-32 h-32 mx-auto rounded-full shadow-lg"
          />
        </div>
        <div className="inline-block p-1 bg-gradient-to-r from-primary to-accent rounded-full mb-6">
          <div className="bg-background rounded-full px-6 py-2">
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              STREAMCENTIVES
            </span>
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          Choose Your Path
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join the revolution in creator-fan engagement. Select your role to unlock personalized features.
        </p>
      </div>

      {/* Role Selection */}
      <div className="w-full max-w-4xl relative z-10">        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`
                group relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 transform
                ${selectedRole === role.id 
                  ? 'ring-2 ring-primary scale-105 shadow-2xl shadow-primary/25' 
                  : 'hover:scale-102 hover:shadow-xl'
                }
                ${role.id === 'creator' 
                  ? 'bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20' 
                  : 'bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20'
                }
              `}
              onClick={() => setSelectedRole(role.id)}
            >
              {/* Icon */}
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto
                ${role.id === 'creator' 
                  ? 'bg-gradient-to-br from-primary to-primary/80' 
                  : 'bg-gradient-to-br from-accent to-accent/80'
                }
              `}>
                {role.id === 'creator' ? (
                  <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L3.09 8.26L2 9L10 14L22 9L20.91 8.26L12 2ZM12 4.18L18.82 9L12 13.82L5.18 9L12 4.18ZM2 11L10 16L12 14.92L14 16L22 11L20 12.09L14 15.91L12 17L10 15.91L4 12.09L2 11Z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"/>
                  </svg>
                )}
              </div>

              <h3 className="text-3xl font-bold text-center mb-4 tracking-wide">
                {role.title}
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed mb-6">
                {role.description}
              </p>

              {/* Features list */}
              <div className="space-y-2">
                {role.id === 'creator' ? (
                  <>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Monetize your content & engagement
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Build stronger fan relationships
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Access creator analytics & tools
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                      Earn rewards for engagement
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                      Connect with favorite creators
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                      Exclusive fan experiences
                    </div>
                  </>
                )}
              </div>

              {/* Selection indicator */}
              {selectedRole === role.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
          
        {/* Sponsor Section */}
        <div className="text-center">
          <div 
            className={`
              inline-block p-6 rounded-xl cursor-pointer transition-all duration-300 group
              ${selectedRole === 'sponsor' 
                ? 'bg-gradient-to-r from-muted to-muted/50 ring-2 ring-primary scale-105' 
                : 'hover:bg-muted/50 hover:scale-105'
              }
            `}
            onClick={() => setSelectedRole('sponsor')}
          >
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-muted-foreground mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
              </svg>
              <h3 className="text-xl font-bold tracking-wide">
                Looking to Sponsor?
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Partner with creators and reach engaged audiences
            </p>
            {selectedRole === 'sponsor' && (
              <div className="absolute -top-2 -right-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      {selectedRole && (
        <div className="w-full max-w-md mt-12 relative z-10">
          <button
            onClick={() => handleRoleSelection(selectedRole)}
            className="w-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg"
          >
            Start as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            <svg className="w-5 h-5 ml-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center mt-8 relative z-10">
        <p className="text-sm text-muted-foreground max-w-md">
          Don't worry - you can switch between roles anytime in your profile settings
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;