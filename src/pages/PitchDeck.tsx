import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import ProblemScene from "@/components/scenes/ProblemScene";
import SolutionScene from "@/components/scenes/SolutionScene";
import HowItWorksScene from "@/components/scenes/HowItWorksScene";
import AiCopilotScene from "@/components/scenes/AiCopilotScene";
import MarketOpportunityScene from "@/components/scenes/MarketOpportunityScene";
import BusinessModelScene from "@/components/scenes/BusinessModelScene";
import GoToMarketScene from "@/components/scenes/GoToMarketScene";
import CompetitionScene from "@/components/scenes/CompetitionScene";
import TeamScene from "@/components/scenes/TeamScene";
import CoreValuesScene from "@/components/scenes/CoreValuesScene";
import FundingScene from "@/components/scenes/FundingScene";
import ClosingScene from "@/components/scenes/ClosingScene";

const scenes = [
  { component: ProblemScene, title: "The Problem", duration: 20 },
  { component: SolutionScene, title: "The Solution", duration: 20 },
  { component: HowItWorksScene, title: "How It Works", duration: 20 },
  { component: AiCopilotScene, title: "AI Co-Pilot", duration: 20 },
  { component: MarketOpportunityScene, title: "Market Opportunity", duration: 20 },
  { component: BusinessModelScene, title: "Business Model", duration: 20 },
  { component: GoToMarketScene, title: "Go-to-Market", duration: 20 },
  { component: CompetitionScene, title: "Competition", duration: 20 },
  { component: TeamScene, title: "The Team", duration: 10 },
  { component: CoreValuesScene, title: "Core Values", duration: 20 },
  { component: FundingScene, title: "The Ask", duration: 15 },
  { component: ClosingScene, title: "Let's Build Together", duration: 15 },
];

const Index = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextScene = useCallback(() => {
    setCurrentScene((prev) => (prev + 1) % scenes.length);
    setProgress(0);
  }, []);

  const prevScene = useCallback(() => {
    setCurrentScene((prev) => (prev - 1 + scenes.length) % scenes.length);
    setProgress(0);
  }, []);

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    if (!isAutoPlaying) setProgress(0);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (scenes[currentScene].duration * 10));
        if (newProgress >= 100) {
          nextScene();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentScene, nextScene]);

  // Touch handling for swipe gestures
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentScene < scenes.length - 1) {
      nextScene();
    }
    if (isRightSwipe && currentScene > 0) {
      prevScene();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextScene();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevScene();
      } else if (e.key === "Escape") {
        setIsAutoPlaying(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [nextScene, prevScene, currentScene, touchStart, touchEnd]);

  const CurrentSceneComponent = scenes[currentScene].component;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Main Content */}
      <main className="relative z-10">
        <CurrentSceneComponent />
      </main>

      {/* Navigation Controls */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-surface/80 backdrop-blur-lg border border-border">
          {/* Hide arrow buttons on mobile, show on desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={prevScene}
            disabled={currentScene === 0}
            className="hidden sm:flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAutoPlay}
            className="flex items-center gap-2"
          >
            {isAutoPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              {currentScene + 1} / {scenes.length}
            </span>
          </div>

          {/* Hide arrow buttons on mobile, show on desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={nextScene}
            disabled={currentScene === scenes.length - 1}
            className="hidden sm:flex"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress 
          value={isAutoPlaying ? progress : ((currentScene / (scenes.length - 1)) * 100)} 
          className="h-1 rounded-none bg-surface/50"
        />
      </div>

      {/* Scene Navigation Dots */}
      <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2">
          {scenes.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentScene(index);
                setProgress(0);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentScene
                  ? "bg-brand-primary w-8"
                  : "bg-muted hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scene Title */}
      <div className="fixed top-8 left-8 z-50">
        <div className="px-4 py-2 rounded-xl bg-surface/80 backdrop-blur-lg border border-border">
          <h2 className="text-sm font-medium text-foreground">
            {scenes[currentScene].title}
          </h2>
        </div>
      </div>

      {/* Home Navigation */}
      <div className="fixed top-8 right-8 z-50">
        <Link to="/">
          <Button 
            variant="ghost" 
            size="sm"
            className="px-4 py-2 rounded-xl bg-surface/80 backdrop-blur-lg border border-border hover:bg-surface/90"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;