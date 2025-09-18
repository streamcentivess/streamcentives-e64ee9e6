import { useEffect, useState } from "react";
import { CreditCard, ShoppingCart, Megaphone, Code, Repeat, Coins } from "lucide-react";

const BusinessModelScene = () => {
  const [showRevenue, setShowRevenue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRevenue(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const revenueStreams = [
    {
      icon: CreditCard,
      title: "SaaS Subscriptions",
      description: "Tiered monthly plans for artists and labels",
      revenue: "$9.99-500/month",
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10",
      details: ["Creator Basic: Free", "Creator Pro: $19.99/mo", "Label Enterprise: $500/mo"]
    },
    {
      icon: Coins,
      title: "XP Purchases",
      description: "Platform fee on fan XP purchases and creator revenue sharing",
      revenue: "$0.50+ per transaction",
      color: "text-warning",
      bgColor: "bg-warning/10",
      details: ["Platform fee: $0.50 per purchase", "Creator revenue sharing: 70-90%", "Platform & creator-specific XP"]
    },
    {
      icon: ShoppingCart,
      title: "Marketplace Fees",
      description: "Commission on XP-to-reward transactions",
      revenue: "5-15% per transaction",
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary/10",
      details: ["Digital rewards: 5%", "Physical merchandise: 10%", "Experiences: 15%"]
    },
    {
      icon: Megaphone,
      title: "Brand Campaigns",
      description: "Sponsored quests and branded reward integration",
      revenue: "$10K-100K per campaign",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10",
      details: ["Sponsored quests", "Brand reward placements", "Campaign analytics"]
    },
    {
      icon: Code,
      title: "API Licensing",
      description: "White-label gamification for music platforms",
      revenue: "$25K-250K annually",
      color: "text-success",
      bgColor: "bg-success/10",
      details: ["Platform integration", "Custom gamification", "Data analytics API"]
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            Multiple <span className="text-brand-primary">Revenue Streams</span>
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto">
            Diversified monetization strategy with recurring SaaS revenue, 
            transaction-based marketplace fees, premium brand partnerships, and B2B licensing.
          </p>
        </div>

        {/* Revenue Streams Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {revenueStreams.map((stream, index) => (
            <div 
              key={stream.title}
              className={`pitch-card p-8 transition-all duration-700 ${
                showRevenue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${stream.bgColor}`}>
                  <stream.icon className={`w-8 h-8 ${stream.color}`} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{stream.title}</h3>
                  <p className="text-muted-foreground mb-3">{stream.description}</p>
                  <div className={`text-lg font-black ${stream.color}`}>
                    {stream.revenue}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {stream.details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${stream.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-muted-foreground">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Projections */}
        <div className="pitch-card p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">5-Year Revenue Projection</h3>
          
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { year: "Year 1", revenue: "$250K", artists: "20 Artists", fans: "50K Fans" },
              { year: "Year 2", revenue: "$1.2M", artists: "100 Artists", fans: "500K Fans" },
              { year: "Year 3", revenue: "$5.8M", artists: "500 Artists", fans: "2M Fans" },
              { year: "Year 4", revenue: "$18M", artists: "1.5K Artists", fans: "8M Fans" },
              { year: "Year 5", revenue: "$45M", artists: "5K Artists", fans: "25M Fans" },
            ].map((projection, index) => (
              <div key={projection.year} className="text-center">
                <div className="bg-surface-elevated rounded-xl p-6 mb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {projection.year}
                  </div>
                  <div className="text-2xl font-black text-brand-primary mb-3">
                    {projection.revenue}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">{projection.artists}</div>
                    <div className="text-sm text-muted-foreground">{projection.fans}</div>
                  </div>
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(index + 1) * 20}%`,
                      animationDelay: `${index * 200}ms`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Economics */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-brand-primary" />
            </div>
            <h4 className="font-bold mb-2">Low CAC</h4>
            <div className="text-2xl font-black text-brand-primary mb-2">$25</div>
            <p className="text-sm text-muted-foreground">
              Customer Acquisition Cost via artist network effects
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Repeat className="w-8 h-8 text-brand-secondary" />
            </div>
            <h4 className="font-bold mb-2">High LTV</h4>
            <div className="text-2xl font-black text-brand-secondary mb-2">$1,200</div>
            <p className="text-sm text-muted-foreground">
              Lifetime Value from recurring subscriptions + transactions
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-success/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Megaphone className="w-8 h-8 text-success" />
            </div>
            <h4 className="font-bold mb-2">Strong Margins</h4>
            <div className="text-2xl font-black text-success mb-2">75%</div>
            <p className="text-sm text-muted-foreground">
              Gross margins on SaaS and marketplace transactions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessModelScene;