import { useEffect, useState } from "react";
import logoImage from "@/assets/streamcentives-logo.png";

const HeroScene = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hero-section">
      <div className="hero-glow" />
      
      <div className="relative z-10 text-center max-w-6xl mx-auto px-8">
        {/* Logo Animation */}
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="flex justify-center mb-12">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-transparent border-2 border-brand-primary/20">
              <img 
                src={logoImage} 
                alt="Streamcentives Logo" 
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
          
          <h1 className="heading-hero mb-8">
            Stream<span className="text-brand-accent">centives</span>
          </h1>
          
          <p className="text-cinematic max-w-3xl mx-auto mb-12">
            The future of fan engagement, powered by AI.
          </p>
          
          {/* Subtitle with typewriter effect */}
          <div className="flex justify-center items-center gap-4 text-lg text-muted-foreground">
            <div className="w-12 h-0.5 bg-brand-primary"></div>
            <span className="font-light tracking-wide">
              Transform Fandom Into Rewards
            </span>
            <div className="w-12 h-0.5 bg-brand-primary"></div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="xp-orb absolute top-1/4 left-1/4 animate-pulse"></div>
          <div className="xp-orb absolute top-3/4 right-1/4 animation-delay-1000"></div>
          <div className="xp-orb absolute bottom-1/4 left-3/4 animation-delay-2000"></div>
        </div>

      </div>
    </div>
  );
};

export default HeroScene;