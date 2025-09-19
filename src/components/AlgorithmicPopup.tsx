import { useState, useEffect } from 'react';
import { X, Trophy, ShoppingBag, Vote, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export interface PopupSuggestion {
  id: string;
  type: 'campaign' | 'reward' | 'voting' | 'merchandise' | 'creator_follow' | 'engagement_boost';
  title: string;
  description: string;
  xpReward: number;
  actionUrl: string;
  buttonText: string;
  icon: string;
  urgency?: 'low' | 'medium' | 'high';
  timeLimit?: string;
  data?: any;
}

interface AlgorithmicPopupProps {
  suggestion: PopupSuggestion;
  onClose: () => void;
  onAction: (suggestion: PopupSuggestion) => void;
}

export const AlgorithmicPopup = ({ suggestion, onClose, onAction }: AlgorithmicPopupProps) => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 15 seconds if not interacted with
    const timer = setTimeout(() => {
      handleDismiss();
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleAction = () => {
    onAction(suggestion);
    handleDismiss();
  };

  const getIcon = () => {
    switch (suggestion.type) {
      case 'campaign':
        return <Trophy className="w-6 h-6" />;
      case 'reward':
        return <ShoppingBag className="w-6 h-6" />;
      case 'voting':
        return <Vote className="w-6 h-6" />;
      case 'merchandise':
        return <Package className="w-6 h-6" />;
      case 'engagement_boost':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <Trophy className="w-6 h-6" />;
    }
  };

  const getUrgencyColor = () => {
    switch (suggestion.urgency) {
      case 'high':
        return 'bg-red-500/10 border-red-500/20 text-red-600';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
        >
          <Card className={`shadow-2xl border-2 ${getUrgencyColor()} backdrop-blur-sm bg-background/95`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src="/lovable-uploads/streamcentivesloveable.PNG" 
                      alt="StreamCentives"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                      {getIcon()}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold leading-tight">
                      {suggestion.title}
                    </CardTitle>
                    {suggestion.timeLimit && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        ⏰ {suggestion.timeLimit}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {suggestion.description}
              </p>
              
              <div className="flex items-center justify-between mb-3">
                <Badge variant="default" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 border-yellow-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  +{suggestion.xpReward} XP
                </Badge>
                {suggestion.urgency === 'high' && (
                  <Badge variant="destructive" className="text-xs">
                    🔥 Limited Time
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAction}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="sm"
                >
                  {suggestion.buttonText}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};