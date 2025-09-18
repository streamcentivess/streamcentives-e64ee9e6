import { useEffect, useState } from "react";
import { 
  Sparkles, Target, Bot, Wand2, MessageCircle, Brain, 
  Zap, Camera, Mic, TrendingUp, Users, DollarSign,
  Video, FileText, Image, Share2, BarChart3, Headphones,
  Lightbulb, Rocket, Star, Crown, ChevronRight
} from "lucide-react";

const AiCopilotScene = () => {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowFeatures(true), 500);
    const timer2 = setInterval(() => {
      setCurrentDemo(prev => (prev + 1) % 3);
    }, 4000);
    
    return () => {
      clearTimeout(timer1);
      clearInterval(timer2);
    };
  }, []);

  const aiCapabilities = [
    {
      category: "Campaign Intelligence",
      icon: Wand2,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary",
      features: [
        "AI Campaign Builder - Generate complete campaigns from text prompts",
        "Smart XP & reward distribution based on engagement patterns", 
        "Automated campaign optimization using fan behavior data",
        "Multi-platform campaign deployment with one click"
      ]
    },
    {
      category: "Content Creation Suite", 
      icon: Sparkles,
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary",
      features: [
        "AI image generation with custom prompts & reference images",
        "Video script generation optimized for social platforms",
        "Speech-to-video with motion effects (HiggsField integration)",
        "Carousel content creation for Instagram & LinkedIn"
      ]
    },
    {
      category: "Smart Automation",
      icon: Bot,
      color: "text-brand-accent", 
      bgColor: "bg-brand-accent",
      features: [
        "Voice-to-text transcription for content creation",
        "Automated social media posting across all platforms",
        "Smart sentiment analysis for fan message monitoring",
        "Content boost recommendations based on performance"
      ]
    }
  ];

  const creatorBenefits = [
    {
      title: "10x Content Production",
      description: "Generate months of content in minutes with AI-powered creation tools",
      icon: Rocket,
      metric: "90% time saved",
      color: "text-brand-primary"
    },
    {
      title: "Smart Revenue Optimization", 
      description: "AI identifies your highest-value fans and creates targeted monetization campaigns",
      icon: TrendingUp,
      metric: "300% revenue increase",
      color: "text-brand-secondary"
    },
    {
      title: "Automated Engagement",
      description: "AI handles repetitive tasks while you focus on creating and connecting",
      icon: Zap,
      metric: "24/7 fan interaction",
      color: "text-brand-accent"
    }
  ];

  const fanBenefits = [
    {
      title: "Personalized Quests",
      description: "AI creates unique challenges based on your listening habits and preferences", 
      icon: Target,
      experience: "Tailored rewards",
      color: "text-success"
    },
    {
      title: "Smart Recommendations",
      description: "Discover new content and opportunities that match your interests perfectly",
      icon: Lightbulb, 
      experience: "Curated discovery",
      color: "text-brand-primary"
    },
    {
      title: "Predictive Rewards",
      description: "AI predicts what you'll love and delivers exclusive access before anyone else",
      icon: Star,
      experience: "VIP treatment", 
      color: "text-brand-secondary"
    }
  ];

  const demoScenarios = [
    {
      title: "Campaign Creation",
      prompt: "Create a campaign for my new album drop with early access rewards",
      output: {
        title: "Midnight Dreams - Exclusive Launch",
        rewards: ["Early Access (100 XP)", "Signed Vinyl (500 XP)", "Virtual Meet & Greet (1000 XP)"],
        timeline: "2 weeks",
        target: "500 fan interactions"
      }
    },
    {
      title: "Content Generation", 
      prompt: "Generate social media content for my upcoming tour announcement",
      output: {
        title: "Tour Announcement Content Pack",
        items: ["Instagram carousel (5 slides)", "TikTok video script", "Twitter thread", "YouTube thumbnail"],
        formats: "All optimized for each platform",
        engagement: "Predicted 40% increase"
      }
    },
    {
      title: "Fan Personalization",
      prompt: "Create personalized quests for my top 100 fans",
      output: {
        title: "VIP Fan Quests Generated", 
        quests: ["Stream streak challenges", "Social sharing rewards", "Exclusive content unlocks"],
        personalization: "Based on individual listening patterns",
        retention: "85% completion rate predicted"
      }
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section text-blue-400 mb-6">
            Beyond Engagement — <span className="text-brand-primary">AI-Powered</span> Creator Economy
          </h1>
          <p className="text-cinematic text-white max-w-4xl mx-auto">
            Streamcentives is the world's first AI-native fan engagement platform, automating everything 
            from campaign creation to personalized fan experiences at scale.
          </p>
        </div>

        {/* AI Demo Interface */}
        <div className="pitch-card p-8 mb-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-brand-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-blue-400">Live AI Demo</h3>
          </div>

          <div className="bg-surface-elevated rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-5 h-5 text-brand-secondary" />
              <span className="text-sm font-medium">AI Prompt</span>
            </div>
            
            <div className="bg-surface rounded-lg p-4 mb-6 border border-dashed border-brand-primary/30">
              <p className="text-sm text-muted-foreground italic">
                "{demoScenarios[currentDemo].prompt}"
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-brand-primary mb-6">
              <Bot className="w-4 h-4 animate-pulse" />
              <span>AI processing... {demoScenarios[currentDemo].title}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="font-semibold text-brand-primary">{demoScenarios[currentDemo].output.title}</div>
                {demoScenarios[currentDemo].title === "Campaign Creation" && (
                  <>
                    {demoScenarios[currentDemo].output.rewards?.map((reward, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <span className="font-medium">{reward.split('(')[0]}</span>
                        <span className="text-brand-primary">{reward.match(/\(([^)]+)\)/)?.[1]}</span>
                      </div>
                    ))}
                  </>
                )}
                {demoScenarios[currentDemo].title === "Content Generation" && (
                  <>
                    {demoScenarios[currentDemo].output.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                        <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </>
                )}
                {demoScenarios[currentDemo].title === "Fan Personalization" && (
                  <>
                    {demoScenarios[currentDemo].output.quests?.map((quest, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                        <Target className="w-4 h-4 text-brand-accent" />
                        <span className="font-medium">{quest}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="p-4 bg-brand-primary/10 rounded-lg">
                  <div className="text-sm font-medium text-brand-primary mb-1">Timeline</div>
                  <div className="text-sm text-muted-foreground">
                    {demoScenarios[currentDemo].output.timeline || demoScenarios[currentDemo].output.formats || demoScenarios[currentDemo].output.personalization}
                  </div>
                </div>
                <div className="p-4 bg-success/10 rounded-lg">
                  <div className="text-sm font-medium text-success mb-1">Predicted Impact</div>
                  <div className="text-sm text-muted-foreground">
                    {demoScenarios[currentDemo].output.target || demoScenarios[currentDemo].output.engagement || demoScenarios[currentDemo].output.retention}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Capabilities Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {aiCapabilities.map((capability, index) => (
            <div 
              key={capability.category}
              className={`pitch-card p-6 transition-all duration-700 ${
                showFeatures ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${capability.color.replace('text-', 'bg-')}/20`}>
                  <capability.icon className={`w-6 h-6 ${capability.color}`} />
                </div>
                <h3 className="text-xl font-bold text-blue-400">{capability.category}</h3>
              </div>
              
              <div className="space-y-3">
                {capability.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${capability.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Creator & Fan Benefits */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Creator Benefits */}
          <div className="pitch-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-2xl font-bold text-blue-400">Creator AI Benefits</h3>
            </div>

            <div className="space-y-6">
              {creatorBenefits.map((benefit, index) => (
                <div key={benefit.title} className="flex items-start gap-4 p-4 bg-surface-elevated rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${benefit.color.replace('text-', 'bg-')}/20`}>
                    <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{benefit.title}</div>
                    <div className="text-sm text-muted-foreground mb-2">{benefit.description}</div>
                    <div className={`text-sm font-medium ${benefit.color}`}>{benefit.metric}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          {/* Fan Benefits */}
          <div className="pitch-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-brand-secondary/20 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-brand-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-blue-400">Fan AI Experience</h3>
            </div>

            <div className="space-y-6">
              {fanBenefits.map((benefit, index) => (
                <div key={benefit.title} className="flex items-start gap-4 p-4 bg-surface-elevated rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${benefit.color.replace('text-', 'bg-')}/20`}>
                    <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{benefit.title}</div>
                    <div className="text-sm text-muted-foreground mb-2">{benefit.description}</div>
                    <div className={`text-sm font-medium ${benefit.color}`}>{benefit.experience}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Technology Stack */}
        <div className="pitch-card p-8 mt-16 text-center">
          <h3 className="text-2xl font-bold text-blue-400 mb-8">Powered by Cutting-Edge AI</h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Brain className="w-8 h-8 text-brand-primary" />
              </div>
              <div className="font-bold mb-2">GPT-4 Integration</div>
              <div className="text-sm text-muted-foreground">Advanced language processing for campaigns & content</div>
            </div>

            <div>
              <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Video className="w-8 h-8 text-brand-secondary" />
              </div>
              <div className="font-bold mb-2">HiggsField Motion</div>
              <div className="text-sm text-muted-foreground">Image-to-video with realistic motion effects</div>
            </div>

            <div>
              <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Mic className="w-8 h-8 text-brand-accent" />
              </div>
              <div className="font-bold mb-2">Speech Recognition</div>
              <div className="text-sm text-muted-foreground">Voice-to-text for seamless content creation</div>
            </div>

            <div>
              <div className="w-16 h-16 bg-success/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-success" />
              </div>  
              <div className="font-bold mb-2">Predictive Analytics</div>
              <div className="text-sm text-muted-foreground">ML-powered fan behavior & engagement predictions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiCopilotScene;