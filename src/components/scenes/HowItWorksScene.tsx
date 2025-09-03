import { useEffect, useState } from "react";
import { Smartphone, Zap, ShoppingBag, ArrowRight } from "lucide-react";

const HowItWorksScene = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      icon: Smartphone,
      title: "CONNECT",
      subtitle: "One-Click Integration",
      description: "Fans link their Spotify account with a single click",
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10"
    },
    {
      icon: Zap,
      title: "ENGAGE",
      subtitle: "Real-Time XP Tracking",
      description: "Streams, reposts, and purchases automatically earn XP",
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary/10"
    },
    {
      icon: ShoppingBag,
      title: "REDEEM",
      subtitle: "Vibrant Marketplace",
      description: "Trade and claim holographic reward cards for experiences",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-20 scene-fade-in">
          <h1 className="heading-section mb-6">
            How It <span className="text-brand-primary">Works</span>
          </h1>
          <p className="text-cinematic max-w-3xl mx-auto">
            A seamless three-step process that transforms passive streaming into active engagement
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div 
              key={step.title}
              className={`pitch-card p-8 text-center transition-all duration-500 ${
                currentStep === index ? 'scale-105 border-2' : 'scale-100'
              }`}
              style={{ 
                borderColor: currentStep === index ? `hsl(var(--brand-${index === 0 ? 'primary' : index === 1 ? 'secondary' : 'accent'}))` : undefined
              }}
            >
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 ${step.bgColor}`}>
                <step.icon className={`w-10 h-10 ${step.color}`} />
              </div>
              
              <div className={`text-3xl font-black mb-2 ${step.color}`}>
                {step.title}
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                {step.subtitle}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Step Number */}
              <div className={`mt-6 w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${step.bgColor} ${step.color}`}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Flow Arrows */}
        <div className="flex justify-center items-center gap-8 mb-16">
          <ArrowRight className="w-8 h-8 text-brand-primary animate-pulse" />
          <ArrowRight className="w-8 h-8 text-brand-secondary animate-pulse" style={{animationDelay: '0.5s'}} />
        </div>

        {/* Demo UI Mockup */}
        <div className="pitch-card p-8 scene-fade-in">
          <h3 className="text-2xl font-bold text-center mb-8">Live Demo Interface</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Spotify Connection */}
            <div className="bg-surface-elevated p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Spotify Connected</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Real-time streaming data flowing...
              </div>
            </div>

            {/* XP Counter */}
            <div className="bg-surface-elevated p-6 rounded-xl">
              <div className="text-center">
                <div className="stat-number text-2xl mb-2">1,247</div>
                <div className="text-muted-foreground">Total XP Earned</div>
                <div className="flex justify-center gap-2 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="xp-orb w-3 h-3" />
                  ))}
                </div>
              </div>
            </div>

            {/* Rewards Available */}
            <div className="bg-surface-elevated p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Rewards Available</span>
                <div className="w-6 h-6 bg-brand-accent rounded-full flex items-center justify-center text-xs font-bold text-white">
                  3
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                VIP passes, merch, meet & greet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksScene;