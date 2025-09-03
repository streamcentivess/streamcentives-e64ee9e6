import { useEffect, useState } from "react";
import { Zap, Shield, Bot, Database, CheckCircle, XCircle } from "lucide-react";

const CompetitionScene = () => {
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowComparison(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const competitors = [
    {
      name: "Discord",
      description: "Community chat platforms",
      limitations: [
        "No gamification or XP systems",
        "Limited creator monetization",
        "No multi-platform tracking",
        "Manual community management"
      ]
    },
    {
      name: "Patreon", 
      description: "Subscription-based creator support",
      limitations: [
        "Subscription fatigue for fans",
        "No engagement tracking",
        "Limited reward customization", 
        "No AI-powered features"
      ]
    },
    {
      name: "Bandcamp",
      description: "Direct music sales platform", 
      limitations: [
        "Pure transactional model",
        "No fan relationship building",
        "No gamification elements",
        "Limited data insights"
      ]
    }
  ];

  const differentiators = [
    {
      icon: Database,
      title: "Multi-Platform Tracking",
      description: "Unified view across Spotify, Apple Music, social platforms",
      competitive: "None offer comprehensive cross-platform analytics"
    },
    {
      icon: Zap,
      title: "Gamified XP System", 
      description: "Transform passive streaming into active engagement",
      competitive: "No competitors have built-in gamification mechanics"
    },
    {
      icon: Bot,
      title: "AI Automation",
      description: "Campaign creation and personalized fan quests",
      competitive: "Manual processes require constant creator attention"
    },
    {
      icon: Shield,
      title: "Data Moat",
      description: "Proprietary engagement patterns and fan behavior insights",
      competitive: "Competitors lack deep fan engagement analytics"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            No One Else Combines <span className="text-brand-primary">Our Technology</span>
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto">
            While others focus on single aspects of creator-fan relationships, 
            Streamcentives uniquely combines multi-platform tracking, AI automation, 
            and gamified engagement in one integrated platform.
          </p>
        </div>

        {/* Competitive Landscape */}
        <div className={`grid lg:grid-cols-3 gap-8 mb-16 transition-all duration-1000 ${showComparison ? 'opacity-100' : 'opacity-0'}`}>
          {competitors.map((competitor, index) => (
            <div key={competitor.name} className="pitch-card p-6">
              <h3 className="text-xl font-bold mb-2">{competitor.name}</h3>
              <p className="text-muted-foreground mb-4">{competitor.description}</p>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-destructive mb-2">Limitations:</div>
                {competitor.limitations.map((limitation, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Streamcentives Advantages */}
        <div className="pitch-card p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-3">
            <CheckCircle className="w-8 h-8 text-success" />
            Streamcentives Competitive Moat
          </h3>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {differentiators.map((diff, index) => (
              <div key={diff.title} className="flex gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  index === 0 ? 'bg-brand-primary/20' :
                  index === 1 ? 'bg-brand-secondary/20' :
                  index === 2 ? 'bg-brand-accent/20' :
                  'bg-success/20'
                }`}>
                  <diff.icon className={`w-6 h-6 ${
                    index === 0 ? 'text-brand-primary' :
                    index === 1 ? 'text-brand-secondary' :
                    index === 2 ? 'text-brand-accent' :
                    'text-success'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold mb-2">{diff.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{diff.description}</p>
                  <div className="text-xs text-success font-medium">
                    ✓ {diff.competitive}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="pitch-card p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Feature Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Discord</th>
                  <th className="text-center p-4 font-semibold">Patreon</th>
                  <th className="text-center p-4 font-semibold">Bandcamp</th>
                  <th className="text-center p-4 font-semibold text-brand-primary">Streamcentives</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Multi-platform Tracking", values: [false, false, false, true] },
                  { feature: "Gamified XP System", values: [false, false, false, true] },
                  { feature: "AI Campaign Builder", values: [false, false, false, true] },
                  { feature: "Reward Marketplace", values: [false, true, false, true] },
                  { feature: "Fan Analytics", values: [false, false, false, true] },
                  { feature: "Automated Engagement", values: [false, false, false, true] },
                ].map((row, index) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="p-4 font-medium">{row.feature}</td>
                    {row.values.map((hasFeature, i) => (
                      <td key={i} className="p-4 text-center">
                        {hasFeature ? (
                          <CheckCircle className={`w-5 h-5 mx-auto ${i === 3 ? 'text-success' : 'text-success'}`} />
                        ) : (
                          <XCircle className="w-5 h-5 mx-auto text-muted-foreground" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Position */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
            <Shield className="w-8 h-8 text-brand-primary" />
            <div>
              <div className="font-bold text-lg">Technology + Data = Defensible Moat</div>
              <div className="text-sm text-muted-foreground">
                Our competitive advantage strengthens with every artist and fan interaction
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionScene;