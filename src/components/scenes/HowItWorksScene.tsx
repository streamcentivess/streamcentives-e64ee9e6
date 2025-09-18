import { useEffect, useState } from "react";
import { 
  Smartphone, Zap, ShoppingBag, ArrowRight, Users, Crown, 
  Bot, Target, Share2, Video, Mic, Image, TrendingUp,
  MessageCircle, Gift, Star, Coins, PlayCircle, Upload,
  BarChart3, Heart, Sparkles, Link, Headphones, Camera
} from "lucide-react";

const HowItWorksScene = () => {
  const [currentFlow, setCurrentFlow] = useState<'creator' | 'fan'>('fan');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % (currentFlow === 'fan' ? 4 : 5));
    }, 3000);
    return () => clearInterval(timer);
  }, [currentFlow]);

  const fanFlow = [
    {
      icon: Smartphone,
      title: "CONNECT",
      subtitle: "One-Click Integration",
      description: "Link Spotify, YouTube, social accounts with single sign-on",
      details: ["OAuth integration", "Real-time data sync", "Cross-platform tracking"],
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10"
    },
    {
      icon: Target,
      title: "DISCOVER",
      subtitle: "AI-Powered Quests",
      description: "Get personalized challenges based on your listening habits",
      details: ["Smart recommendations", "Behavioral analysis", "Dynamic difficulty"],
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary/10"
    },
    {
      icon: Zap,
      title: "ENGAGE",
      subtitle: "Earn XP & Rewards",
      description: "Stream music, share content, complete campaigns for XP",
      details: ["Real-time XP tracking", "Multiplier bonuses", "Streak rewards"],
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      icon: ShoppingBag,
      title: "REDEEM",
      subtitle: "Exclusive Marketplace",
      description: "Trade XP for VIP experiences, merch, and exclusive content",
      details: ["Dynamic pricing", "Limited editions", "Creator rewards"],
      color: "text-success",
      bgColor: "bg-success/10"
    }
  ];

  const creatorFlow = [
    {
      icon: Crown,
      title: "SETUP",
      subtitle: "Creator Profile",
      description: "Build your presence with AI-generated content and smart links",
      details: ["Profile optimization", "Content templates", "Brand consistency"],
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10"
    },
    {
      icon: Bot,
      title: "CREATE",
      subtitle: "AI Campaign Builder",
      description: "Generate campaigns with text prompts, auto-create rewards",
      details: ["GPT-4 integration", "Smart XP distribution", "Content generation"],
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary/10"
    },
    {
      icon: Share2,
      title: "DISTRIBUTE",
      subtitle: "Multi-Platform Launch",
      description: "Auto-post to all social platforms with optimized content",
      details: ["Cross-platform posting", "Format optimization", "Timing analysis"],
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      icon: BarChart3,
      title: "ANALYZE",
      subtitle: "Real-Time Analytics",
      description: "Track engagement, fan behavior, and revenue optimization",
      details: ["Fan insights", "Revenue tracking", "Engagement metrics"],
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      icon: TrendingUp,
      title: "MONETIZE",
      subtitle: "Revenue Streams",
      description: "Earn from XP purchases, campaigns, marketplace, subscriptions",
      details: ["Multiple revenue streams", "Creator payouts", "Performance bonuses"],
      color: "text-success",
      bgColor: "bg-success/10"
    }
  ];

  const currentSteps = currentFlow === 'fan' ? fanFlow : creatorFlow;

  const platformFeatures = [
    {
      title: "AI Content Suite",
      icon: Sparkles,
      features: ["Image generation", "Video creation", "Speech-to-video", "Content optimization"],
      color: "text-brand-primary"
    },
    {
      title: "Voice Integration", 
      icon: Mic,
      features: ["Voice recording", "Speech-to-text", "Audio messages", "Voice campaigns"],
      color: "text-brand-secondary"
    },
    {
      title: "Smart Analytics",
      icon: BarChart3,
      features: ["Fan behavior analysis", "Engagement predictions", "Revenue optimization", "A/B testing"],
      color: "text-brand-accent"
    },
    {
      title: "Social Automation",
      icon: Share2, 
      features: ["Auto-posting", "Cross-platform sync", "Optimal timing", "Format adaptation"],
      color: "text-success"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            How Streamcentives <span className="text-brand-primary">Works</span>
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto mb-8">
            The complete AI-powered creator economy ecosystem that transforms passive consumption 
            into active, rewarded engagement across sports, music, and content creation.
          </p>
          
          {/* Flow Toggle */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setCurrentFlow('fan')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                currentFlow === 'fan' 
                  ? 'bg-brand-primary text-white' 
                  : 'bg-surface text-muted-foreground hover:bg-surface-elevated'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Fan Journey
            </button>
            <button
              onClick={() => setCurrentFlow('creator')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                currentFlow === 'creator' 
                  ? 'bg-brand-primary text-white' 
                  : 'bg-surface text-muted-foreground hover:bg-surface-elevated'
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              Creator Journey
            </button>
          </div>
        </div>

        {/* Flow Steps */}
        <div className={`grid gap-8 mb-16 ${currentFlow === 'fan' ? 'md:grid-cols-4' : 'lg:grid-cols-5'}`}>
          {currentSteps.map((step, index) => (
            <div 
              key={step.title}
              className={`pitch-card p-6 text-center transition-all duration-700 ${
                currentStep === index ? 'scale-105 border-2 shadow-lg' : 'scale-100'
              }`}
              style={{ 
                borderColor: currentStep === index ? `hsl(var(--brand-primary))` : undefined,
                animationDelay: `${index * 150}ms`
              }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${step.bgColor}`}>
                <step.icon className={`w-8 h-8 ${step.color}`} />
              </div>
              
              <div className={`text-2xl font-black mb-2 ${step.color}`}>
                {step.title}
              </div>
              
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                {step.subtitle}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {step.description}
              </p>

              {/* Step Details */}
              <div className="space-y-2">
                {step.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${step.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-muted-foreground">{detail}</span>
                  </div>
                ))}
              </div>

              {/* Step Number */}
              <div className={`mt-4 w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${step.bgColor} ${step.color}`}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Platform Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {platformFeatures.map((feature, index) => (
            <div key={feature.title} className="pitch-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.color.replace('text-', 'bg-')}/20`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h4 className="font-bold">{feature.title}</h4>
              </div>
              <div className="space-y-2">
                {feature.features.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full ${feature.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Live Demo Interface */}
        <div className="pitch-card p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Live Platform Demo</h3>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Creator Dashboard */}
            <div className="bg-surface-elevated p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand-primary" />
                </div>
                <span className="font-semibold">AI Campaign Builder</span>
              </div>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground bg-surface p-2 rounded">
                  "Create campaign for my new track drop"
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Early Access Reward</span>
                  <span className="text-brand-primary font-medium">100 XP</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Share Bonus</span>
                  <span className="text-brand-secondary font-medium">150 XP</span>
                </div>
              </div>
            </div>

            {/* Fan Experience */}
            <div className="bg-surface-elevated p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-brand-secondary/20 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-brand-secondary" />
                </div>
                <span className="font-semibold">Personalized Quests</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-brand-primary" />
                  <span className="text-sm">Stream 3x today</span>
                  <span className="text-xs text-brand-primary">+50 XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-brand-secondary" />
                  <span className="text-sm">Share new release</span>
                  <span className="text-xs text-brand-secondary">+100 XP</span>
                </div>
                <div className="text-center">
                  <div className="stat-number text-xl text-brand-primary">2,847</div>
                  <div className="text-xs text-muted-foreground">Total XP Balance</div>
                </div>
              </div>
            </div>

            {/* Marketplace */}
            <div className="bg-surface-elevated p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-success" />
                </div>
                <span className="font-semibold">Rewards Marketplace</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>VIP Meet & Greet</span>
                  <span className="text-success font-medium">1,000 XP</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Signed Merchandise</span>
                  <span className="text-warning font-medium">500 XP</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Exclusive Content</span>
                  <span className="text-brand-accent font-medium">250 XP</span>
                </div>
                <div className="text-center pt-2">
                  <div className="text-xs text-success">Available: 47 rewards</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Ecosystem */}
        <div className="pitch-card p-8 text-center">
          <h3 className="text-2xl font-bold mb-8">Complete Integration Ecosystem</h3>
          
          <div className="grid md:grid-cols-6 gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Headphones className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-sm font-medium">Spotify</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-sm font-medium">YouTube</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Share2 className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-sm font-medium">Twitter</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-sm font-medium">Instagram</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-sm font-medium">TikTok</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                <Link className="w-6 h-6 text-brand-primary" />
              </div>
              <span className="text-sm font-medium">Smart Links</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksScene;