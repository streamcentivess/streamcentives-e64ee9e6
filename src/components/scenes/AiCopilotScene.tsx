import { useEffect, useState } from "react";
import { Sparkles, Target, Bot, Wand2, MessageCircle } from "lucide-react";

const AiCopilotScene = () => {
  const [showArtistDemo, setShowArtistDemo] = useState(false);
  const [showFanDemo, setShowFanDemo] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowArtistDemo(true), 500);
    const timer2 = setTimeout(() => setShowFanDemo(true), 1500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            More Than Points — <span className="text-brand-primary">AI Co-Pilot</span>
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto">
            Streamcentives is powered by AI that creates campaigns instantly for creators 
            and delivers personalized quests that make engagement fun for fans.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Artist AI Dashboard */}
          <div className={`pitch-card p-8 transition-all duration-1000 ${showArtistDemo ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-2xl font-bold">AI Campaign Builder</h3>
            </div>

            {/* Demo Interface */}
            <div className="bg-surface-elevated rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-5 h-5 text-brand-secondary" />
                <span className="text-sm font-medium">Campaign Prompt</span>
              </div>
              
              <div className="bg-surface rounded-lg p-4 mb-4 border border-dashed border-brand-primary/30">
                <p className="text-sm text-muted-foreground italic">
                  "Create a campaign for my new single release with special rewards for early supporters"
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-brand-primary mb-4">
                <Bot className="w-4 h-4 animate-pulse" />
                <span>AI generating campaign...</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <span className="font-medium">Early Bird Reward</span>
                  <span className="text-brand-primary">50 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <span className="font-medium">Share Bonus</span>
                  <span className="text-brand-secondary">75 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <span className="font-medium">Exclusive Preview</span>
                  <span className="text-brand-accent">100 XP</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Campaign created in seconds, not hours</span>
            </div>
          </div>

          {/* Fan Personalized Quests */}
          <div className={`pitch-card p-8 transition-all duration-1000 delay-500 ${showFanDemo ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand-secondary/20 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-brand-secondary" />
              </div>
              <h3 className="text-2xl font-bold">Personalized Quests</h3>
            </div>

            {/* Quest Cards */}
            <div className="space-y-4 mb-6">
              <div className="leaderboard-item bg-gradient-to-r from-brand-primary/10 to-transparent border-l-4 border-brand-primary">
                <div className="flex-1">
                  <div className="font-semibold mb-1">🎵 Daily Streak Challenge</div>
                  <div className="text-sm text-muted-foreground">
                    Stream "Midnight Dreams" 3 times today
                  </div>
                </div>
                <div className="text-brand-primary font-bold">+50 XP</div>
              </div>

              <div className="leaderboard-item bg-gradient-to-r from-brand-secondary/10 to-transparent border-l-4 border-brand-secondary">
                <div className="flex-1">
                  <div className="font-semibold mb-1">📱 Social Amplifier</div>
                  <div className="text-sm text-muted-foreground">
                    Share new release on 2 platforms
                  </div>
                </div>
                <div className="text-brand-secondary font-bold">+100 XP</div>
              </div>

              <div className="leaderboard-item bg-gradient-to-r from-brand-accent/10 to-transparent border-l-4 border-brand-accent">
                <div className="flex-1">
                  <div className="font-semibold mb-1">🎁 Collector Quest</div>
                  <div className="text-sm text-muted-foreground">
                    Complete merch purchase this week
                  </div>
                </div>
                <div className="text-brand-accent font-bold">+200 XP</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Bot className="w-4 h-4" />
              <span>AI adapts quests to your listening habits</span>
            </div>
          </div>
        </div>

        {/* AI Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-brand-primary" />
            </div>
            <h4 className="font-bold mb-2">Instant Campaigns</h4>
            <p className="text-sm text-muted-foreground">
              Generate complete promotional campaigns from simple text prompts
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Target className="w-8 h-8 text-brand-secondary" />
            </div>
            <h4 className="font-bold mb-2">Smart Targeting</h4>
            <p className="text-sm text-muted-foreground">
              Personalized quests based on individual fan behavior and preferences
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Bot className="w-8 h-8 text-brand-accent" />
            </div>
            <h4 className="font-bold mb-2">Adaptive Learning</h4>
            <p className="text-sm text-muted-foreground">
              AI continuously optimizes engagement strategies for maximum impact
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiCopilotScene;