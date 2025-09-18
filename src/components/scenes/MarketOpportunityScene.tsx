import { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Globe } from "lucide-react";

const MarketOpportunityScene = () => {
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateStats(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const marketStats = [
    { value: "$480B", label: "Creator Economy (2025)", icon: TrendingUp, color: "text-brand-primary" },
    { value: "207M", label: "Global Content Creators", icon: Users, color: "text-brand-secondary" },
    { value: "$5.9B", label: "Fan Engagement Platforms", icon: DollarSign, color: "text-brand-accent" },
    { value: "162M", label: "US Creators (45M Pro)", icon: Globe, color: "text-success" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section text-blue-400 mb-6">
            A <span className="text-brand-primary">$480B</span> Creator Economy Ready for Transformation
          </h1>
          <p className="text-cinematic text-white max-w-4xl mx-auto">
            With 207M global creators and rapid growth in fan engagement platforms, 
            Streamcentives is positioned to capture the shift from passive consumption to active, rewarded participation.
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
              
              <div className="text-white font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Market Breakdown */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Current Market Problems */}
          <div className="pitch-card p-8 scene-slide-in">
            <h3 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-destructive" />
              Current Market Gaps
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-surface-elevated rounded-lg">
                <div className="w-2 h-2 rounded-full bg-destructive mt-3"></div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">6.5 Month Revenue Gap</div>
                  <div className="text-sm text-white">
                    Average creator takes 6.5 months to earn their first dollar
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-surface-elevated rounded-lg">
                <div className="w-2 h-2 rounded-full bg-warning mt-3"></div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Platform Dependency</div>
                  <div className="text-sm text-white">
                    Creators lose 70% of revenue to intermediary platforms with no fan data
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-surface-elevated rounded-lg">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-3"></div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Fragmented Monetization</div>
                  <div className="text-sm text-white">
                    No unified system for fan engagement, rewards, and direct-to-fan sales
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Streamcentives Opportunity */}
          <div className="pitch-card p-8 scene-slide-in">
            <h3 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-brand-primary" />
              Streamcentives Opportunity
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-brand-primary/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand-primary mt-3"></div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Multi-Revenue XP System</div>
                  <div className="text-sm text-white">
                    XP purchases, marketplace transactions, campaign fees, premium subscriptions
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-brand-secondary/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand-secondary mt-3"></div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Multi-Genre Network</div>
                  <div className="text-sm text-white">
                    Sports (Derek's $160M network), Music (Markeith & Kofa), Content (Trev)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-brand-accent/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand-accent mt-3"></div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">AI-Powered Campaigns</div>
                  <div className="text-sm text-white">
                    Smart campaign builder, content generation, and automated social posting
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Timing */}
        <div className="pitch-card p-8 text-center mb-16">
          <h3 className="text-2xl font-bold text-blue-400 mb-6">Perfect Market Timing</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-black text-brand-primary mb-3">2025</div>
              <div className="font-semibold text-blue-400 mb-2">Fan Engagement Boom</div>
              <div className="text-sm text-white">
                $5.9B market growing rapidly as creators seek direct fan monetization
              </div>
            </div>

            <div>
              <div className="text-4xl font-black text-brand-secondary mb-3">AI</div>
              <div className="font-semibold text-blue-400 mb-2">Automation Revolution</div>
              <div className="text-sm text-white">
                Smart campaign builders and content generation scaling creator productivity
              </div>
            </div>

            <div>
              <div className="text-4xl font-black text-brand-accent mb-3">46.7%</div>
              <div className="font-semibold text-blue-400 mb-2">Full-Time Creators</div>
              <div className="text-sm text-white">
                Nearly half of creators are full-time, needing reliable revenue streams
              </div>
            </div>
          </div>
        </div>

        {/* Competitive Landscape Insight */}
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="pitch-card p-8">
            <h3 className="text-2xl font-bold text-blue-400 mb-6">Emerging Competition</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                <div>
                  <div className="font-semibold text-blue-400">FANtium</div>
                  <div className="text-sm text-white">Sports-focused investment platform</div>
                </div>
                <div className="text-xs text-brand-primary">Sports Only</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                <div>
                  <div className="font-semibold text-blue-400">TopFan</div>
                  <div className="text-sm text-white">Direct-to-consumer fan clubs</div>
                </div>
                <div className="text-xs text-brand-secondary">No XP System</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                <div>
                  <div className="font-semibold text-blue-400">FanHero</div>
                  <div className="text-sm text-white">Subscription-based content platform</div>
                </div>
                <div className="text-xs text-brand-accent">Content Only</div>
              </div>
            </div>
          </div>

          <div className="pitch-card p-8">
            <h3 className="text-2xl font-bold text-blue-400 mb-6">Streamcentives Advantage</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-success/10 rounded-lg">
                <div className="w-3 h-3 bg-success rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-blue-400">Multi-Genre Platform</div>
                  <div className="text-sm text-white">Sports, music, content creators all unified</div>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-success/10 rounded-lg">
                <div className="w-3 h-3 bg-success rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-blue-400">XP-Based Economy</div>
                  <div className="text-sm text-white">Gamified engagement driving revenue</div>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-success/10 rounded-lg">
                <div className="w-3 h-3 bg-success rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-blue-400">Built MVP</div>
                  <div className="text-sm text-white">Ready to scale with team network access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOpportunityScene;