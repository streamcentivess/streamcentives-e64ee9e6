import { useEffect, useState } from "react";
import { Users, TrendingDown, Zap, Eye } from "lucide-react";
import artistImage from "@/assets/artist-dashboard.png";
import fanImage from "@/assets/disconnected-fan.png";

const ProblemScene = () => {
  const [showSplit, setShowSplit] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowSplit(true), 500);
    const timer2 = setTimeout(() => setShowStats(true), 1500);
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
            The Fan–Creator Connection is <span className="text-destructive">Broken</span>
          </h1>
          <p className="text-cinematic max-w-3xl mx-auto">
            Artists face an anonymous audience, low streaming royalties, and endless marketing grind. 
            Fans remain unseen — their loyalty invisible, their experience passive.
          </p>
        </div>

        {/* Split Screen */}
        <div className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 ${showSplit ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Artist Side */}
          <div className="pitch-card p-8">
            <div className="relative mb-6 rounded-xl overflow-hidden">
              <img 
                src={artistImage} 
                alt="Artist looking at anonymous analytics" 
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <TrendingDown className="w-6 h-6 text-destructive" />
                Artists Struggle
              </h3>
              
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Eye className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <span>Millions of streams, but fans are faceless numbers</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 mt-0.5 text-destructive" />
                  <span>Low streaming royalties (fractions of pennies per play)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 mt-0.5 text-warning" />
                  <span>Endless marketing grind with no direct fan connection</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Fan Side */}
          <div className="pitch-card p-8">
            <div className="relative mb-6 rounded-xl overflow-hidden">
              <img 
                src={fanImage} 
                alt="Fan feeling disconnected while streaming" 
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-6 h-6 text-muted-foreground" />
                Fans Feel Invisible
              </h3>
              
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Eye className="w-5 h-5 mt-0.5 text-muted-foreground opacity-50" />
                  <span>Support goes unnoticed and unrewarded</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 mt-0.5 text-muted-foreground opacity-50" />
                  <span>Passive streaming experience with no interaction</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 mt-0.5 text-muted-foreground opacity-50" />
                  <span>Loyalty never translates to meaningful rewards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-500 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center">
            <div className="stat-number mb-2">$0.003</div>
            <div className="text-muted-foreground">Average per stream</div>
          </div>
          
          <div className="text-center">
            <div className="stat-number mb-2">89%</div>
            <div className="text-muted-foreground">Fans want direct connection</div>
          </div>
          
          <div className="text-center">
            <div className="stat-number mb-2">0%</div>
            <div className="text-muted-foreground">Fans rewarded for loyalty</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemScene;