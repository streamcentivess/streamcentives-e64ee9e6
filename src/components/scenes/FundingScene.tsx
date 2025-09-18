import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users, Code, Target } from "lucide-react";

const FundingScene = () => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [animateFunding, setAnimateFunding] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowBreakdown(true), 500);
    const timer2 = setTimeout(() => setAnimateFunding(true), 1000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const fundingAllocation = [
    {
      category: "Artist Partnerships & Acquisition", 
      percentage: 40,
      amount: "$400K",
      icon: Users,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary",
      details: [
        "200+ artist rapid onboarding program",
        "Multi-genre network activation (sports, music, content)",
        "Creator success & relationship management",
        "Partnership program incentives & bonuses"
      ]
    },
    {
      category: "Marketing & Scale Operations",
      percentage: 35, 
      amount: "$350K",
      icon: TrendingUp,
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary",
      details: [
        "Performance marketing & paid acquisition",
        "Content creation & influencer campaigns", 
        "Brand partnerships & enterprise deals",
        "User growth & retention optimization"
      ]
    },
    {
      category: "Operations & Infrastructure",
      percentage: 25,
      amount: "$250K",
      icon: Code,
      color: "text-brand-accent", 
      bgColor: "bg-brand-accent",
      details: [
        "Platform scaling & performance optimization",
        "Customer success & support expansion",
        "Legal, compliance & security infrastructure",
        "Working capital & strategic reserves"
      ]
    }
  ];

  const milestones = [
    { milestone: "100 Artists Onboarded", timeline: "3 months", funding: "$300K" },
    { milestone: "25K+ Active Fans", timeline: "6 months", funding: "$600K" },
    { milestone: "250+ Artists, $100K MRR", timeline: "9 months", funding: "$800K" },
    { milestone: "Multi-Genre Partnerships", timeline: "12 months", funding: "$1M" },
    { milestone: "Q1 2026: $350K MRR", timeline: "15 months", funding: "$4.2M ARR" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <div className={`transition-all duration-1000 ${animateFunding ? 'scale-110' : 'scale-100'}`}>
            <div className="text-8xl font-black text-brand-primary mb-4">$1M</div>
            <h1 className="heading-section text-blue-400 mb-6">Seed Funding</h1>
          </div>
          <p className="text-cinematic text-white max-w-4xl mx-auto">
            Raising $1M to leverage our team's combined 500+ creator network across sports, music & content 
            to scale our proven MVP and achieve $350K MRR by Q1 2026.
          </p>
        </div>

        {/* Funding Allocation Pie Chart Visualization */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Visual Breakdown */}
          <div className="pitch-card p-8">
            <h3 className="text-2xl font-bold text-blue-400 text-center mb-8">Fund Allocation</h3>
            
            {/* Pie Chart Style Breakdown */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                {/* Segments */}
                <div className={`absolute inset-0 rounded-full ${fundingAllocation[0].bgColor} transition-all duration-1000 ${showBreakdown ? 'rotate-0' : 'rotate-180'}`}
                     style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
                <div className={`absolute inset-0 rounded-full ${fundingAllocation[1].bgColor} transition-all duration-1000 delay-300 ${showBreakdown ? 'rotate-0' : 'rotate-180'}`}
                     style={{ clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 70%)' }}></div>
                <div className={`absolute inset-0 rounded-full ${fundingAllocation[2].bgColor} transition-all duration-1000 delay-500 ${showBreakdown ? 'rotate-0' : 'rotate-180'}`}
                     style={{ clipPath: 'polygon(50% 50%, 0% 70%, 0% 100%, 50% 100%)' }}></div>
              </div>
              
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-brand-primary" />
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {fundingAllocation.map((item, index) => (
                <div key={item.category} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${item.bgColor}`}></div>
                  <span className="font-medium">{item.category}</span>
                  <span className="ml-auto text-sm text-muted-foreground">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-6">
            {fundingAllocation.map((item, index) => (
              <div 
                key={item.category}
                className={`pitch-card p-6 transition-all duration-700 ${
                  showBreakdown ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color.replace('text-', 'bg-')}/20`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <div className="font-bold">{item.category}</div>
                    <div className={`text-xl font-black ${item.color}`}>{item.amount}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {item.details.map((detail, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full mt-2 ${item.color.replace('text-', 'bg-')}`}></div>
                      <span className="text-muted-foreground">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Insights */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="pitch-card p-8">
            <h3 className="text-2xl font-bold mb-6">Platform Readiness Advantage</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-success rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-success">Full MVP Deployed</div>
                  <p className="text-sm text-muted-foreground">Complete XP system, campaigns, marketplace, AI tools, and mobile PWA</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-success rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-success">Multi-Revenue Streams Live</div>
                  <p className="text-sm text-muted-foreground">XP purchases, marketplace transactions, campaign fees, premium subscriptions</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-success rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-success">AI-Powered Automation</div>
                  <p className="text-sm text-muted-foreground">Smart campaign builder, content generation, and social media integration</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pitch-card p-8">
            <h3 className="text-2xl font-bold mb-6">Network Effect Multiplier</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-brand-primary/10 rounded-xl">
                <div className="text-2xl font-black text-brand-primary">Sports</div>
                <div className="text-sm text-muted-foreground">Derek's $160M+ athlete network</div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-brand-secondary/10 rounded-xl">
                <div className="text-2xl font-black text-brand-secondary">Music</div>
                <div className="text-sm text-muted-foreground">Markeith & Kofa's industry connections</div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-brand-accent/10 rounded-xl">
                <div className="text-2xl font-black text-brand-accent">Content</div>
                <div className="text-sm text-muted-foreground">Trev's creator & influencer network</div>
              </div>
              <div className="text-center mt-4 p-4 bg-surface rounded-xl border-2 border-brand-primary/20">
                <div className="text-3xl font-black text-brand-primary">500+</div>
                <div className="text-sm font-medium">Combined Creator Reach</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Model Insights */}
        <div className="pitch-card p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Multi-Stream Revenue Model</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-brand-primary" />
              </div>
              <div className="font-bold mb-2">XP Purchases</div>
              <div className="text-2xl font-black text-brand-primary mb-2">$5-50</div>
              <p className="text-xs text-muted-foreground">Per fan transaction, 30% platform fee</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-brand-secondary" />
              </div>
              <div className="font-bold mb-2">Campaign Fees</div>
              <div className="text-2xl font-black text-brand-secondary mb-2">$100-1K</div>
              <p className="text-xs text-muted-foreground">Per campaign setup, recurring monthly</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-brand-accent" />
              </div>
              <div className="font-bold mb-2">Marketplace</div>
              <div className="text-2xl font-black text-brand-accent mb-2">15%</div>
              <p className="text-xs text-muted-foreground">Commission on all reward transactions</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Target className="w-8 h-8 text-success" />
              </div>
              <div className="font-bold mb-2">Premium</div>
              <div className="text-2xl font-black text-success mb-2">$29</div>
              <p className="text-xs text-muted-foreground">Monthly creator subscriptions</p>
            </div>
          </div>
        </div>

        {/* Milestones & Timeline */}
        <div className="pitch-card p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Key Milestones</h3>
          
          <div className="grid md:grid-cols-5 gap-6">
            {milestones.map((milestone, index) => (
              <div key={milestone.milestone} className="text-center">
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                  index < 2 ? 'bg-success/20' : 
                  index < 4 ? 'bg-brand-primary/20' : 
                  'bg-brand-accent/20'
                }`}>
                  <Target className={`w-8 h-8 ${
                    index < 2 ? 'text-success' :
                    index < 4 ? 'text-brand-primary' :
                    'text-brand-accent'
                  }`} />
                </div>
                
                <div className="font-bold mb-2">{milestone.milestone}</div>
                <div className="text-sm text-muted-foreground mb-2">{milestone.timeline}</div>
                <div className="text-xs text-muted-foreground">{milestone.funding}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Highlights */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-brand-primary" />
            </div>
            <h4 className="font-bold mb-2">Ready-to-Scale MVP</h4>
            <div className="text-2xl font-black text-brand-primary mb-2">Built</div>
            <p className="text-sm text-muted-foreground">
              Full platform with XP system, campaigns, marketplace & AI features
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-brand-secondary" />
            </div>
            <h4 className="font-bold mb-2">Multi-Genre Network Access</h4>
            <div className="text-2xl font-black text-brand-secondary mb-2">500+</div>
            <p className="text-sm text-muted-foreground">
              Combined creator connections across sports, music & content creation
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-success/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-success" />
            </div>
            <h4 className="font-bold mb-2">Q1 2026 Target</h4>
            <div className="text-2xl font-black text-success mb-2">$350K</div>
            <p className="text-sm text-muted-foreground">
              Monthly recurring revenue with 250+ artists & 100K+ active fans
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundingScene;