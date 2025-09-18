import { useEffect, useState } from "react";
import { 
  Zap, Trophy, Heart, Repeat, Gift, Bot, Sparkles, 
  TrendingUp, Users, Video, Mic, Image, BarChart3,
  Smartphone, Crown, Target, Share2, MessageCircle,
  ShoppingBag, Coins, Headphones, Camera, Link,
  PlayCircle, Upload, FileText, Star, Globe
} from "lucide-react";
import xpRewardsImage from "@/assets/xp-rewards.png";

const SolutionScene = () => {
  const [currentSolution, setCurrentSolution] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowFeatures(true), 500);
    const timer2 = setInterval(() => {
      setCurrentSolution(prev => (prev + 1) % 4);
    }, 4000);
    return () => {
      clearTimeout(timer1);
      clearInterval(timer2);
    };
  }, []);

  const coreSolutions = [
    {
      title: "AI-Native Creator Economy",
      description: "The world's first AI-powered fan engagement platform",
      icon: Bot,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary",
      features: [
        "AI campaign builder with GPT-4 integration",
        "Automated content generation (images, videos, text)",
        "Smart personalization for 250+ creators",
        "Voice-to-text and speech-to-video tools"
      ]
    },
    {
      title: "Multi-Revenue Ecosystem", 
      description: "Five distinct revenue streams for sustainable creator income",
      icon: TrendingUp,
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary", 
      features: [
        "XP purchases ($5-50 per transaction, 30% platform fee)",
        "Campaign fees ($100-1K per campaign)",
        "Marketplace transactions (15% commission)",
        "Premium subscriptions ($29/month per creator)",
        "User data revenue share (80% to users, opt-in)"
      ]
    },
    {
      title: "Cross-Platform Integration",
      description: "Unified experience across all major platforms",
      icon: Globe,
      color: "text-brand-accent",
      bgColor: "bg-brand-accent",
      features: [
        "Spotify, YouTube, social media sync",
        "Real-time streaming data tracking",
        "Automated cross-platform posting",
        "Smart link technology for unified access"
      ]
    },
    {
      title: "Gamified Fan Experience",
      description: "Transform passive consumption into active participation", 
      icon: Trophy,
      color: "text-success",
      bgColor: "bg-success",
      features: [
        "Personalized AI quests based on behavior",
        "Dynamic XP system with multipliers",
        "Exclusive marketplace with 500+ rewards",
        "Real-time leaderboards and competitions"
      ]
    }
  ];

  const platformCapabilities = [
    {
      category: "AI Content Creation",
      icon: Sparkles,
      tools: [
        { name: "Image Generation", icon: Image, desc: "AI-powered visual content" },
        { name: "Video Creation", icon: Video, desc: "Motion effects & speech-to-video" },
        { name: "Content Scripts", icon: FileText, desc: "Social media optimized text" },
        { name: "Voice Processing", icon: Mic, desc: "Speech-to-text transcription" }
      ]
    },
    {
      category: "Creator Analytics",
      icon: BarChart3,
      tools: [
        { name: "Fan Insights", icon: Users, desc: "Behavioral analysis & segmentation" },
        { name: "Revenue Tracking", icon: Coins, desc: "Multi-stream income monitoring" },
        { name: "Engagement Metrics", icon: TrendingUp, desc: "Real-time performance data" },
        { name: "Predictive Analytics", icon: Target, desc: "AI-powered forecasting" }
      ]
    },
    {
      category: "Fan Engagement",
      icon: Heart,
      tools: [
        { name: "Personal Quests", icon: Target, desc: "AI-customized challenges" },
        { name: "Voice Messages", icon: Mic, desc: "Direct creator communication" },
        { name: "Live Leaderboards", icon: Trophy, desc: "Real-time competitions" },
        { name: "Reward Marketplace", icon: ShoppingBag, desc: "Exclusive experiences" }
      ]
    },
    {
      category: "Platform Integration",
      icon: Link,
      tools: [
        { name: "Smart Links", icon: Link, desc: "Unified fan access points" },
        { name: "Social Automation", icon: Share2, desc: "Cross-platform posting" },
        { name: "Streaming Sync", icon: Headphones, desc: "Real-time music tracking" },
        { name: "Mobile PWA", icon: Smartphone, desc: "Native app experience" }
      ]
    }
  ];

  const realWorldResults = [
    {
      metric: "500+",
      label: "Creator Network Access",
      description: "Combined reach through team connections",
      icon: Users,
      color: "text-brand-primary"
    },
    {
      metric: "4 Revenue Streams",
      label: "Monetization Options", 
      description: "XP, campaigns, marketplace, subscriptions",
      icon: TrendingUp,
      color: "text-brand-secondary"
    },
    {
      metric: "AI-Powered",
      label: "Content Generation",
      description: "10x faster content creation workflow",
      icon: Bot,
      color: "text-brand-accent"
    },
    {
      metric: "6 Platforms",
      label: "Integrated Ecosystem",
      description: "Spotify, YouTube, Instagram, Twitter, TikTok, LinkedIn",
      icon: Globe,
      color: "text-success"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            The Complete <span className="text-brand-primary">AI-Powered</span> Creator Economy
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto">
            Streamcentives is the world's first comprehensive AI-native platform that transforms 
            passive fan consumption into active, rewarded engagement across sports, music, and content creation.
          </p>
        </div>

        {/* Core Solution Showcase */}
        <div className="grid lg:grid-cols-4 gap-8 mb-16">
          {coreSolutions.map((solution, index) => (
            <div 
              key={solution.title}
              className={`pitch-card p-6 transition-all duration-700 ${
                currentSolution === index ? 'scale-105 border-2 shadow-xl' : 'scale-100'
              } ${showFeatures ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ 
                borderColor: currentSolution === index ? `hsl(var(--brand-primary))` : undefined,
                animationDelay: `${index * 200}ms`
              }}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${solution.color.replace('text-', 'bg-')}/20`}>
                <solution.icon className={`w-6 h-6 ${solution.color}`} />
              </div>
              
              <h3 className="text-lg font-bold mb-2">{solution.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{solution.description}</p>
              
              <div className="space-y-2">
                {solution.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${solution.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Platform Capabilities Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {platformCapabilities.map((capability, index) => (
            <div 
              key={capability.category}
              className={`pitch-card p-8 transition-all duration-700 ${
                showFeatures ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ animationDelay: `${index * 300}ms` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
                  <capability.icon className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold">{capability.category}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {capability.tools.map((tool, idx) => (
                  <div key={tool.name} className="flex items-start gap-3 p-3 bg-surface-elevated rounded-lg">
                    <div className="w-8 h-8 bg-brand-secondary/20 rounded-lg flex items-center justify-center">
                      <tool.icon className="w-4 h-4 text-brand-secondary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Real-World Results */}
        <div className="pitch-card p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Built & Ready to Scale</h3>
          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {realWorldResults.map((result, index) => (
              <div key={result.label} className="text-center">
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${result.color.replace('text-', 'bg-')}/20`}>
                  <result.icon className={`w-8 h-8 ${result.color}`} />
                </div>
                <div className={`text-2xl font-black mb-2 ${result.color}`}>{result.metric}</div>
                <div className="font-semibold mb-1">{result.label}</div>
                <div className="text-sm text-muted-foreground">{result.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Demo Showcase with XP Image */}
        <div className="pitch-card p-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-brand-primary" />
                Live Platform in Action
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4 p-4 bg-brand-primary/10 rounded-xl">
                  <Bot className="w-6 h-6 text-brand-primary mt-1" />
                  <div>
                    <div className="font-semibold text-brand-primary">AI Campaign Builder</div>
                    <div className="text-sm text-muted-foreground">Generate complete campaigns from simple prompts in seconds</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-brand-secondary/10 rounded-xl">
                  <Target className="w-6 h-6 text-brand-secondary mt-1" />
                  <div>
                    <div className="font-semibold text-brand-secondary">Personalized Quests</div>
                    <div className="text-sm text-muted-foreground">AI creates unique challenges for each fan based on behavior</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-success/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-success mt-1" />
                  <div>
                    <div className="font-semibold text-success">Multi-Revenue Streams</div>
                    <div className="text-sm text-muted-foreground">XP purchases, campaigns, marketplace, subscriptions all live</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-surface-elevated rounded-xl">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-xs font-bold text-white">500+</div>
                  <div className="w-8 h-8 bg-brand-secondary rounded-full flex items-center justify-center text-xs font-bold text-white">4</div>
                  <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-xs font-bold text-white">AI</div>
                </div>
                <div>
                  <div className="font-semibold">Ready for Launch</div>
                  <div className="text-sm text-muted-foreground">Creators ready, revenue streams active, AI tools deployed</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={xpRewardsImage} 
                alt="Streamcentives XP rewards and comprehensive platform" 
                className="w-full rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/30 via-transparent to-transparent rounded-2xl"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-surface/90 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-sm font-semibold text-center">Complete AI-Powered Creator Economy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionScene;