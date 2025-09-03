import { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Globe } from "lucide-react";

const MarketOpportunityScene = () => {
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateStats(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const marketStats = [
    { value: "$100B+", label: "Creator Economy", icon: TrendingUp, color: "text-brand-primary" },
    { value: "50M+", label: "Independent Artists", icon: Users, color: "text-brand-secondary" },
    { value: "$28B", label: "Direct-to-Fan Market", icon: DollarSign, color: "text-brand-accent" },
    { value: "4.4B", label: "Global Music Fans", icon: Globe, color: "text-success" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            A <span className="text-brand-primary">$100B+</span> Market Ready for Disruption
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto">
            We're unlocking a massive direct-to-fan market where millions of creators 
            can finally monetize their most loyal supporters through meaningful engagement.
          </p>
        </div>

        {/* Market Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {marketStats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`pitch-card p-6 text-center transition-all duration-700 ${
                animateStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${stat.color.replace('text-', 'bg-')}/20`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              
              <div className={`stat-number text-3xl mb-2 ${stat.color}`}>
                {stat.value}
              </div>
              
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Market Breakdown */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Current Market Problems */}
          <div className="pitch-card p-8 scene-slide-in">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-destructive" />
              Current Market Gaps
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-surface-elevated rounded-lg">
                <div className="w-2 h-2 rounded-full bg-destructive mt-3"></div>
                <div>
                  <div className="font-semibold mb-1">Broken Revenue Streams</div>
                  <div className="text-sm text-muted-foreground">
                    Artists earn $0.003-0.005 per stream while platforms keep 70%
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-surface-elevated rounded-lg">
                <div className="w-2 h-2 rounded-full bg-warning mt-3"></div>
                <div>
                  <div className="font-semibold mb-1">Anonymous Audiences</div>
                  <div className="text-sm text-muted-foreground">
                    No direct connection between creators and their most loyal fans
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-surface-elevated rounded-lg">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-3"></div>
                <div>
                  <div className="font-semibold mb-1">Passive Experiences</div>
                  <div className="text-sm text-muted-foreground">
                    Fan loyalty generates zero rewards or meaningful interaction
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Streamcentives Opportunity */}
          <div className="pitch-card p-8 scene-slide-in">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-brand-primary" />
              Streamcentives Opportunity
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-brand-primary/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand-primary mt-3"></div>
                <div>
                  <div className="font-semibold mb-1">Direct Monetization</div>
                  <div className="text-sm text-muted-foreground">
                    Artists earn from engaged fans through XP-based rewards marketplace
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-brand-secondary/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand-secondary mt-3"></div>
                <div>
                  <div className="font-semibold mb-1">Data-Rich Relationships</div>
                  <div className="text-sm text-muted-foreground">
                    Deep insights into fan behavior and preferences for targeted campaigns
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-brand-accent/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand-accent mt-3"></div>
                <div>
                  <div className="font-semibold mb-1">Gamified Engagement</div>
                  <div className="text-sm text-muted-foreground">
                    Transform passive consumption into active, rewarded participation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Timing */}
        <div className="pitch-card p-8 text-center">
          <h3 className="text-2xl font-bold mb-6">Perfect Market Timing</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-black text-brand-primary mb-3">2024</div>
              <div className="font-semibold mb-2">Creator Economy Boom</div>
              <div className="text-sm text-muted-foreground">
                Independent artists seeking direct fan monetization
              </div>
            </div>

            <div>
              <div className="text-4xl font-black text-brand-secondary mb-3">AI</div>
              <div className="font-semibold mb-2">AI Revolution</div>
              <div className="text-sm text-muted-foreground">
                Personalization and automation enabling scalable engagement
              </div>
            </div>

            <div>
              <div className="text-4xl font-black text-brand-accent mb-3">Web3</div>
              <div className="font-semibold mb-2">Digital Ownership</div>
              <div className="text-sm text-muted-foreground">
                Fans ready to own and trade digital music collectibles
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOpportunityScene;