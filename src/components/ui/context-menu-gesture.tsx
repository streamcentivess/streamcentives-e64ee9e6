import React from 'react';
import { User, MessageCircle, UserMinus, Flag, Share } from 'lucide-react';
import { Card } from './card';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ContextMenuGestureProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onShare?: () => void;
  isFollowing?: boolean;
  className?: string;
}

export function ContextMenuGesture({ 
  isVisible, 
  position, 
  onClose, 
  onFollow,
  onMessage,
  onBlock,
  onReport,
  onShare,
  isFollowing,
  className 
}: ContextMenuGestureProps) {
  if (!isVisible) return null;

  const menuItems = [
    {
      icon: User,
      label: isFollowing ? 'Unfollow' : 'Follow',
      action: onFollow,
      variant: isFollowing ? 'destructive' : 'default' as const,
    },
    {
      icon: MessageCircle,
      label: 'Message',
      action: onMessage,
      variant: 'default' as const,
    },
    {
      icon: Share,
      label: 'Share Profile',
      action: onShare,
      variant: 'default' as const,
    },
    {
      icon: UserMinus,
      label: 'Block',
      action: onBlock,
      variant: 'destructive' as const,
    },
    {
      icon: Flag,
      label: 'Report',
      action: onReport,
      variant: 'destructive' as const,
    },
  ].filter(item => item.action); // Only show items with actions

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <Card 
        className={cn(
          "fixed z-50 p-2 shadow-lg border bg-card/95 backdrop-blur-sm",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
        style={{
          left: Math.min(position.x, window.innerWidth - 200),
          top: Math.min(position.y, window.innerHeight - (menuItems.length * 44 + 16)),
        }}
      >
        <div className="flex flex-col gap-1 min-w-[160px]">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant={item.variant === 'destructive' ? 'destructive' : 'ghost'}
              size="sm"
              className={cn(
                "justify-start gap-2 h-9 px-3",
                item.variant === 'destructive' && "text-destructive hover:text-destructive-foreground"
              )}
              onClick={() => {
                item.action?.();
                onClose();
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </Card>
    </>
  );
}