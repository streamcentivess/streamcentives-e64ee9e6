import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Eye, Users, Repeat, Share, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface NotificationToastProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    created_at: string;
    priority: string;
  };
  onDismiss: () => void;
  onTap?: () => void;
}

export function MobileNotificationToast({ notification, onDismiss, onTap }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleTap = () => {
    if (onTap) {
      onTap();
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'social_interaction':
        switch (notification.data?.interaction_type) {
          case 'like': return <Heart className="h-4 w-4 text-red-500 fill-red-500" />;
          case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500" />;
          case 'repost': return <Repeat className="h-4 w-4 text-green-500" />;
          case 'share': return <Share className="h-4 w-4 text-purple-500" />;
          default: return <Heart className="h-4 w-4" />;
        }
      case 'profile_view': return <Eye className="h-4 w-4 text-indigo-500" />;
      case 'follow': return <Users className="h-4 w-4 text-blue-600" />;
      case 'tag': return <Tag className="h-4 w-4 text-orange-500" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high': return 'border-red-500 bg-red-50/95';
      case 'normal': return 'border-blue-500 bg-blue-50/95';
      case 'low': return 'border-gray-300 bg-white/95';
      default: return 'border-gray-300 bg-white/95';
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-4 right-4 z-[100] mx-auto max-w-sm",
        "transform transition-all duration-300 ease-out",
        isVisible && !isLeaving ? "translate-y-0 opacity-100 scale-100" : "-translate-y-full opacity-0 scale-95"
      )}
    >
      <div
        className={cn(
          "rounded-xl border shadow-lg backdrop-blur-md p-3",
          "cursor-pointer active:scale-95 transition-transform",
          getPriorityColor()
        )}
        onClick={handleTap}
      >
        <div className="flex items-start gap-3">
          {/* Avatar or Icon */}
          <div className="flex-shrink-0">
            {notification.data?.actor_avatar ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={notification.data.actor_avatar} />
                <AvatarFallback>
                  {notification.data?.actor_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                {getIcon()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {notification.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), 'HH:mm')}
                  </span>
                  {notification.type === 'social_interaction' && notification.data?.interaction_type && (
                    <Badge variant="outline" className="text-xs h-4 px-1">
                      {notification.data.interaction_type}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Dismiss button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-black/10 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Priority indicator */}
        {notification.priority === 'high' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-xl" />
        )}
      </div>
    </div>
  );
}