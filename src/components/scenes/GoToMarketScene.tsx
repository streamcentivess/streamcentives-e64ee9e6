import { useEffect, useState } from "react";
import { Users, Target, Rocket, TrendingUp } from "lucide-react";

const GoToMarketScene = () => {
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const phases = [
    {
      title: "Phase 1: Validation",
      subtitle: "De-Risk Launch",
      duration: "Q1-Q2 2026",
      icon: Target,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10",
      goals: [
        "20 independent artists onboarded",
        "5M+ combined fanbase",
        "Validate core engagement mechanics",
        "Refine XP-to-reward conversion"
      ]
    },
    {
      title: "Phase 2: Niche Scale",
      subtitle: "Targeted Growth",
      duration: "Q3-Q4 2026",
      icon: Users,
      color: "text-brand-secondary", 
      bgColor: "bg-brand-secondary/10",
      goals: [
        "100 artists across 3 music genres",
        "Launch AI campaign builder",
        "Brand partnership pilot program",
        "Mobile app launch"
      ]
    },
    {
      title: "Phase 3: Market Leadership",
      subtitle: "Global Expansion",
      duration: "2027+",
      icon: Rocket,
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10", 
      goals: [
        "1K+ artists, major label partnerships",
        "International market expansion",
        "API licensing to platforms",
        "Series A funding round"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            Strategic <span className="text-brand-primary">Go-to-Market</span>
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto">
            We de-risk launch through artist partnerships, validate with niche audiences, 
            then scale to global market leadership through proven engagement mechanics.
          </p>
        </div>

        {/* Phase Timeline */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {phases.map((phase, index) => (
            <div 
              key={phase.title}
              className={`pitch-card p-8 transition-all duration-500 ${
                currentPhase === index ? 'scale-105 border-2' : 'scale-100'
              }`}
              style={{ 
                borderColor: currentPhase === index ? `hsl(var(--brand-${index === 0 ? 'primary' : index === 1 ? 'secondary' : 'accent'}))` : undefined
              }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${phase.bgColor}`}>
                <phase.icon className={`w-8 h-8 ${phase.color}`} />
              </div>
              
              <div className="mb-6">
                <div className={`text-2xl font-black mb-2 ${phase.color}`}>
                  {phase.title}
                </div>
                <div className="text-lg font-semibold mb-3">
                  {phase.subtitle}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {phase.duration}
                </div>
              </div>

              <div className="space-y-3">
                {phase.goals.map((goal, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${phase.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-sm text-muted-foreground">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Key Partnerships Strategy */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="pitch-card p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-brand-primary" />
              Artist Partnership Program
            </h3>
            
            <div className="space-y-4">
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="font-semibold mb-2">Revenue Share Model</div>
                <div className="text-sm text-muted-foreground">
                  Artists keep 80% of direct fan revenue + performance bonuses
                </div>
              </div>
              
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="font-semibold mb-2">Co-Marketing Support</div>
                <div className="text-sm text-muted-foreground">
                  Joint promotion campaigns and social media amplification
                </div>
              </div>
              
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="font-semibold mb-2">Exclusive Features</div>
                <div className="text-sm text-muted-foreground">
                  Early access to AI tools and premium reward integrations
                </div>
              </div>
            </div>
          </div>

          <div className="pitch-card p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-brand-secondary" />
              Growth Metrics & KPIs
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                <span className="font-medium">Monthly Active Artists</span>
                <span className="text-brand-primary font-bold">+50% MoM</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                <span className="font-medium">Fan Engagement Rate</span>
                <span className="text-brand-secondary font-bold">65%+</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                <span className="font-medium">Revenue per Artist</span>
                <span className="text-brand-accent font-bold">$2.5K/mo</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                <span className="font-medium">XP-to-Revenue Conversion</span>
                <span className="text-success font-bold">15%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Competitive Advantages */}
        <div className="pitch-card p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Strategic Advantages</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Target className="w-8 h-8 text-brand-primary" />
              </div>
              <h4 className="font-bold mb-2">First Mover Advantage</h4>
              <p className="text-sm text-muted-foreground">
                First to combine multi-platform tracking with AI-powered gamification
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-brand-secondary" />
              </div>
              <h4 className="font-bold mb-2">Network Effects</h4>
              <p className="text-sm text-muted-foreground">
                Each artist brings their fanbase, creating viral growth loops
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-brand-accent" />
              </div>
              <h4 className="font-bold mb-2">Data Moat</h4>
              <p className="text-sm text-muted-foreground">
                Proprietary fan engagement data becomes increasingly valuable
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoToMarketScene;