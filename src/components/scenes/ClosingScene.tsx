import { useEffect, useState } from "react";
import { Heart, Zap, Users, Rocket, Mail, Globe } from "lucide-react";

const ClosingScene = () => {
  const [showElements, setShowElements] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowElements(true), 500);
    const timer2 = setTimeout(() => setShowCTA(true), 1500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const visionPoints = [
    {
      icon: Heart,
      title: "Happy Fans",
      description: "Loyal supporters finally recognized and rewarded",
      color: "text-brand-primary"
    },
    {
      icon: Zap,
      title: "Engaged Communities",
      description: "Active participation replacing passive consumption",
      color: "text-brand-secondary"
    },
    {
      icon: Users,
      title: "Thriving Artists",
      description: "Creators building sustainable, direct-to-fan businesses",
      color: "text-brand-accent"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-glow"></div>
        {/* Floating XP Orbs */}
        <div className="xp-orb absolute top-1/4 left-1/6 w-6 h-6"></div>
        <div className="xp-orb absolute top-3/4 right-1/4 w-4 h-4 animation-delay-1000"></div>
        <div className="xp-orb absolute bottom-1/3 left-3/4 w-5 h-5 animation-delay-2000"></div>
        <div className="xp-orb absolute top-1/2 right-1/6 w-3 h-3 animation-delay-3000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Logo Return */}
        <div className={`text-center mb-16 transition-all duration-1000 ${showElements ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="flex justify-center mb-8">
            <div className="logo-s w-20 h-20">
              <img 
                src="/lovable-uploads/streamcentives-logo-optimized.webp" 
                alt="Your Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          <h1 className="heading-section mb-6">
            Let's Build the Future of <span className="text-brand-primary">Fan Engagement</span>
          </h1>
          
          <p className="text-cinematic max-w-4xl mx-auto mb-8">
            Join us in creating a world where every stream, every share, every moment of fandom 
            becomes a meaningful connection between artists and their most passionate supporters.
          </p>

          <div className="flex justify-center items-center gap-4 text-lg font-medium">
            <div className="w-16 h-0.5 bg-brand-primary"></div>
            <span className="logo-text">Turn Fandom Into Rewards</span>
            <div className="w-16 h-0.5 bg-brand-primary"></div>
          </div>
        </div>

        {/* Vision Montage */}
        <div className={`grid md:grid-cols-3 gap-8 mb-16 transition-all duration-1000 delay-500 ${showElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {visionPoints.map((point, index) => (
            <div key={point.title} className="pitch-card p-8 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${point.color.replace('text-', 'bg-')}/20`}>
                <point.icon className={`w-8 h-8 ${point.color}`} />
              </div>
              
              <h3 className="text-xl font-bold mb-3">{point.title}</h3>
              <p className="text-muted-foreground">{point.description}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className={`text-center transition-all duration-1000 delay-1000 ${showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="pitch-card p-12 max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-3xl flex items-center justify-center">
                <Rocket className="w-10 h-10 text-brand-primary" />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-6">Ready to Transform Music Together?</h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're looking for visionary investors who understand the power of 
              combining AI, gamification, and music to create the next generation 
              of creator-fan relationships.
            </p>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="flex items-center justify-center gap-3 p-4 bg-surface-elevated rounded-xl">
                <Mail className="w-6 h-6 text-brand-secondary" />
                <div>
                  <div className="font-semibold">Email</div>
                  <div className="text-sm text-muted-foreground">kofa@streamcentives.com</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 p-4 bg-surface-elevated rounded-xl">
                <Globe className="w-6 h-6 text-brand-accent" />
                <div>
                  <div className="font-semibold">Website</div>
                  <div className="text-sm text-muted-foreground">streamcentives.io</div>
                </div>
              </div>
            </div>

            {/* Final Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <div className="text-center">
                <div className="stat-number text-2xl">$1.5M</div>
                <div className="text-sm text-muted-foreground">Pre-Seed Round</div>
              </div>
              
              <div className="text-center">
                <div className="stat-number text-2xl">18mo</div>
                <div className="text-sm text-muted-foreground">To Profitability</div>
              </div>
              
              <div className="text-center">
                <div className="stat-number text-2xl">100B+</div>
                <div className="text-sm text-muted-foreground">Market Size</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Animation Elements */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping"></div>
            <span>The future of music is gamified...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosingScene;