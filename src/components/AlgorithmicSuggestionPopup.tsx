import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Gift, Zap, Clock, Star, Music, Target, ShoppingBag, Vote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface SuggestionData {
  id: string;
  type: 'campaign' | 'music' | 'rewards' | 'merchandise' | 'voting';
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  avatarUrl?: string;
  creatorName?: string;
  xpReward?: number;
  urgency?: string; // e.g., "12 hrs left", "Limited time"
  actionUrl: string;
  actionText: string;
  priority: 'high' | 'medium' | 'low';
}

interface AlgorithmicSuggestionPopupProps {
  suggestion: SuggestionData | null;
  isVisible: boolean;
  onDismiss: () => void;
  onAction: (suggestion: SuggestionData) => void;
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'campaign': return Target;
    case 'music': return Music;
    case 'rewards': return Gift;
    case 'merchandise': return ShoppingBag;
    case 'voting': return Vote;
    default: return Star;
  }
};

const getSuggestionColor = (type: string) => {
  switch (type) {
    case 'campaign': return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    case 'music': return 'from-green-500/20 to-green-600/20 border-green-500/30';
    case 'rewards': return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
    case 'merchandise': return 'from-orange-500/20 to-orange-600/20 border-orange-500/30';
    case 'voting': return 'from-red-500/20 to-red-600/20 border-red-500/30';
    default: return 'from-primary/20 to-primary/30 border-primary/30';
  }
};

export function AlgorithmicSuggestionPopup({ 
  suggestion, 
  isVisible, 
  onDismiss, 
  onAction 
}: AlgorithmicSuggestionPopupProps) {
  const navigate = useNavigate();

  if (!suggestion) return null;

  const Icon = getSuggestionIcon(suggestion.type);
  const colorClasses = getSuggestionColor(suggestion.type);

  const handleAction = () => {
    onAction(suggestion);
    navigate(suggestion.actionUrl);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onDismiss}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            <div className={`relative rounded-2xl border bg-gradient-to-br ${colorClasses} p-6 shadow-2xl backdrop-blur-md`}>
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-white/20"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Header with icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    {suggestion.title}
                  </h3>
                  {suggestion.subtitle && (
                    <p className="text-white/80 text-sm">{suggestion.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Image or Avatar */}
              {suggestion.imageUrl && (
                <div className="mb-4">
                  <img
                    src={suggestion.imageUrl}
                    alt={suggestion.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Creator info */}
              {suggestion.creatorName && suggestion.avatarUrl && (
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={suggestion.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {suggestion.creatorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white/90 text-sm font-medium">
                    {suggestion.creatorName}
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-white/90 text-sm mb-4 leading-relaxed">
                {suggestion.description}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestion.xpReward && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Zap className="h-3 w-3 mr-1" />
                    +{suggestion.xpReward} XP
                  </Badge>
                )}
                {suggestion.urgency && (
                  <Badge variant="secondary" className="bg-red-500/20 text-white border-red-400/30">
                    <Clock className="h-3 w-3 mr-1" />
                    {suggestion.urgency}
                  </Badge>
                )}
                {suggestion.priority === 'high' && (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-white border-yellow-400/30">
                    <Star className="h-3 w-3 mr-1" />
                    Hot
                  </Badge>
                )}
              </div>

              {/* Action button */}
              <Button
                onClick={handleAction}
                className="w-full bg-white text-black hover:bg-white/90 font-medium"
                size="lg"
              >
                {suggestion.actionText}
              </Button>

              {/* Sponsored disclaimer */}
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-white/60 text-xs text-center">
                  Personalized recommendation • What's this?
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}