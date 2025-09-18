import { useEffect, useState } from "react";
import { Zap, Shield, Bot, Database, CheckCircle, XCircle, DollarSign, Smartphone, Link, Calendar } from "lucide-react";

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
      icon: DollarSign,
      title: "XP Purchase Revenue Model",
      description: "Platform & creator-specific XP with revenue sharing (70-90% to creators)",
      competitive: "No platform offers dual XP economy with creator revenue sharing"
    },
    {
      icon: Link,
      title: "Smart Link Technology",
      description: "Dynamic links with embedded actions and XP rewards",
      competitive: "Traditional link-in-bio tools lack interactive engagement"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Experience",
      description: "PWA with haptic feedback and native mobile features",
      competitive: "Most creator tools are desktop-focused web applications"
    },
    {
      icon: Calendar,
      title: "Content Automation Suite",
      description: "AI-powered content scheduling and cross-platform posting",
      competitive: "Creators manage multiple platforms manually"
    },
    {
      icon: Shield,
      title: "Data Moat",
      description: "Proprietary engagement patterns and fan behavior insights",
      competitive: "Competitors lack deep fan engagement analytics"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-8 py-8 sm:py-16">
      <div className="max-w-7xl mx-auto w-full">
        {/* Main Title */}
        <div className="text-center mb-8 sm:mb-16 scene-fade-in">
          <h1 className="heading-section text-blue-400 mb-4 sm:mb-6 text-2xl sm:text-3xl lg:text-4xl px-2">
            No One Else Combines <span className="text-brand-primary">Our Technology</span>
          </h1>
          <p className="text-cinematic text-white max-w-4xl mx-auto text-sm sm:text-base px-2">
            While others focus on single aspects of creator-fan relationships, 
            Streamcentives uniquely combines multi-platform tracking, AI automation, 
            and gamified engagement in one integrated platform.
          </p>
        </div>

        {/* Competitive Landscape */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-16 transition-all duration-1000 ${showComparison ? 'opacity-100' : 'opacity-0'}`}>
          {competitors.map((competitor, index) => (
            <div key={competitor.name} className="pitch-card p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-2">{competitor.name}</h3>
              <p className="text-muted-foreground mb-4 text-sm">{competitor.description}</p>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-destructive mb-2">Limitations:</div>
                {competitor.limitations.map((limitation, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Streamcentives Advantages */}
        <div className="pitch-card p-4 sm:p-8 mb-8 sm:mb-16">
          <h3 className="text-xl sm:text-2xl font-bold text-blue-400 text-center mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <CheckCircle className="w-6 sm:w-8 h-6 sm:h-8 text-success" />
            <span className="text-center">Streamcentives Competitive Moat</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {differentiators.map((diff, index) => (
              <div key={diff.title} className="flex gap-3 sm:gap-4">
                <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  index % 4 === 0 ? 'bg-brand-primary/20' :
                  index % 4 === 1 ? 'bg-brand-secondary/20' :
                  index % 4 === 2 ? 'bg-brand-accent/20' :
                  'bg-success/20'
                }`}>
                  <diff.icon className={`w-5 sm:w-6 h-5 sm:h-6 ${
                    index % 4 === 0 ? 'text-brand-primary' :
                    index % 4 === 1 ? 'text-brand-secondary' :
                    index % 4 === 2 ? 'text-brand-accent' :
                    'text-success'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold mb-2 text-sm sm:text-base">{diff.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">{diff.description}</p>
                  <div className="text-xs text-success font-medium">
                    ✓ {diff.competitive}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="pitch-card p-4 sm:p-8 mb-8 sm:mb-16">
          <h3 className="text-xl sm:text-2xl font-bold text-blue-400 text-center mb-6 sm:mb-8">Feature Comparison</h3>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Feature</th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-xs sm:text-sm">Discord</th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-xs sm:text-sm">Patreon</th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-xs sm:text-sm">Bandcamp</th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-xs sm:text-sm text-brand-primary">Streamcentives</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Multi-platform Tracking", values: [false, false, false, true] },
                  { feature: "Gamified XP System", values: [false, false, false, true] },
                  { feature: "AI Campaign Builder", values: [false, false, false, true] },
                  { feature: "XP Purchase Revenue Model", values: [false, false, false, true] },
                  { feature: "Creator Revenue Sharing", values: [false, true, false, true] },
                  { feature: "Reward Marketplace", values: [false, true, false, true] },
                  { feature: "Fan Analytics Dashboard", values: [false, false, false, true] },
                  { feature: "Smart Link Technology", values: [false, false, false, true] },
                  { feature: "Content Automation", values: [false, false, false, true] },
                  { feature: "Voice/Video Messages", values: [true, false, false, true] },
                  { feature: "Brand Partnership Tools", values: [false, false, false, true] },
                  { feature: "API Licensing Model", values: [false, false, false, true] },
                  { feature: "Mobile PWA Experience", values: [true, false, false, true] },
                  { feature: "Real-time Notifications", values: [true, false, false, true] },
                ].map((row, index) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="p-2 sm:p-4 font-medium text-xs sm:text-sm">{row.feature}</td>
                    {row.values.map((hasFeature, i) => (
                      <td key={i} className="p-2 sm:p-4 text-center">
                        {hasFeature ? (
                          <CheckCircle className={`w-4 sm:w-5 h-4 sm:h-5 mx-auto ${i === 3 ? 'text-success' : 'text-success'}`} />
                        ) : (
                          <XCircle className="w-4 sm:w-5 h-4 sm:h-5 mx-auto text-muted-foreground" />
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
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-4 sm:px-8 py-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 max-w-full">
            <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-brand-primary flex-shrink-0" />
            <div className="text-center sm:text-left">
              <div className="font-bold text-sm sm:text-lg">Technology + Data = Defensible Moat</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
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