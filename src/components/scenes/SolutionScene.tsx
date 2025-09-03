import { useEffect, useState } from "react";
import { Zap, Trophy, Heart, Repeat, Gift } from "lucide-react";
import xpRewardsImage from "@/assets/xp-rewards.png";

const SolutionScene = () => {
  const [showFlow, setShowFlow] = useState(false);
  const [animateXP, setAnimateXP] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowFlow(true), 500);
    const timer2 = setTimeout(() => setAnimateXP(true), 1500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const fanActions = [
    { icon: Heart, label: "Stream", points: "+10 XP", color: "text-brand-primary" },
    { icon: Repeat, label: "Share", points: "+25 XP", color: "text-brand-secondary" },
    { icon: Gift, label: "Buy Merch", points: "+100 XP", color: "text-brand-accent" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            Transform Fan Actions into <span className="text-brand-primary">Experience Points</span>
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto">
            Streamcentives creates a gamified feedback loop that strengthens the bond between fan and creator. 
            Every action earns XP, XP fuels leaderboards and unlocks exclusive rewards.
          </p>
        </div>

        {/* XP Flow Animation */}
        <div className={`transition-all duration-1000 ${showFlow ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {fanActions.map((action, index) => (
              <div 
                key={action.label}
                className={`pitch-card p-6 text-center transition-all duration-500 ${animateXP ? 'scale-105' : 'scale-100'}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-elevated mb-4 ${action.color}`}>
                  <action.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{action.label}</h3>
                <div className={`text-2xl font-black ${action.color} mb-2`}>
                  {action.points}
                </div>
                <p className="text-sm text-muted-foreground">
                  Fan engagement tracked and rewarded
                </p>

                {/* Animated XP Orbs */}
                {animateXP && (
                  <div className="flex justify-center gap-2 mt-4">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i}
                        className="xp-orb w-4 h-4"
                        style={{ animationDelay: `${(index * 200) + (i * 100)}ms` }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Flow Arrow */}
        <div className="flex justify-center mb-16">
          <div className="flex items-center gap-4 text-brand-primary">
            <div className="w-16 h-0.5 bg-brand-primary"></div>
            <Zap className="w-8 h-8 animate-pulse" />
            <div className="w-16 h-0.5 bg-brand-primary"></div>
          </div>
        </div>

        {/* Rewards Showcase */}
        <div className={`pitch-card p-8 transition-all duration-1000 delay-1000 ${showFlow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-brand-primary" />
                Exclusive Rewards Marketplace
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="leaderboard-item">
                  <Trophy className="w-6 h-6 text-brand-primary mr-4" />
                  <div>
                    <div className="font-semibold">VIP Concert Access</div>
                    <div className="text-sm text-muted-foreground">500 XP</div>
                  </div>
                </div>
                
                <div className="leaderboard-item">
                  <Gift className="w-6 h-6 text-brand-accent mr-4" />
                  <div>
                    <div className="font-semibold">Exclusive Merchandise</div>
                    <div className="text-sm text-muted-foreground">250 XP</div>
                  </div>
                </div>
                
                <div className="leaderboard-item">
                  <Heart className="w-6 h-6 text-brand-secondary mr-4" />
                  <div>
                    <div className="font-semibold">Virtual Meet & Greet</div>
                    <div className="text-sm text-muted-foreground">750 XP</div>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground">
                Holographic reward cards that fans can claim, trade, and redeem for real experiences.
              </p>
            </div>
            
            <div className="relative">
              <img 
                src={xpRewardsImage} 
                alt="XP rewards and holographic cards" 
                className="w-full rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/20 via-transparent to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionScene;