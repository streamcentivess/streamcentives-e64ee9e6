import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

interface Gift {
  id: string;
  gift_type: string;
  sender_name: string;
  animation_type: string;
  icon_name: string;
}

interface GiftAnimationsProps {
  streamId: string;
}

export function GiftAnimations({ streamId }: GiftAnimationsProps) {
  const [activeGifts, setActiveGifts] = useState<Gift[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`gift-animations-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_stream_gifts',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          const giftData = payload.new as any;

          // Fetch gift type info
          const { data: giftType } = await supabase
            .from('gift_types')
            .select('icon_name, animation_type')
            .eq('name', giftData.gift_type)
            .single();

          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', giftData.sender_id)
            .single();

          const gift: Gift = {
            id: giftData.id,
            gift_type: giftData.gift_type,
            sender_name: giftData.is_anonymous ? 'Anonymous' : sender?.display_name || 'Someone',
            animation_type: giftType?.animation_type || 'float',
            icon_name: giftType?.icon_name || 'Gift'
          };

          setActiveGifts(prev => [...prev, gift]);

          // Remove gift after animation completes
          setTimeout(() => {
            setActiveGifts(prev => prev.filter(g => g.id !== gift.id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const getAnimationVariants = (type: string) => {
    const easeType = 'easeOut' as const;
    switch (type) {
      case 'float':
        return {
          initial: { y: '100vh', x: Math.random() * 80 + 10 + '%', opacity: 0, scale: 0 },
          animate: {
            y: '-20vh',
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.8],
            rotate: [0, 10, -10, 0]
          },
          transition: { duration: 3, ease: easeType }
        };
      case 'sparkle':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: {
            scale: [0, 1.5, 1],
            opacity: [0, 1, 0],
            rotate: [0, 360]
          },
          transition: { duration: 2, ease: 'easeInOut' as const }
        };
      case 'spin':
        return {
          initial: { scale: 0, opacity: 0, x: '50vw' },
          animate: {
            scale: [0, 1.3, 0],
            opacity: [0, 1, 0],
            rotate: [0, 720],
            x: ['50vw', '50vw', '50vw']
          },
          transition: { duration: 2.5, ease: 'easeInOut' as const }
        };
      case 'pulse':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: {
            scale: [0, 1.5, 1.2, 1.5, 0],
            opacity: [0, 1, 1, 1, 0]
          },
          transition: { duration: 2, ease: 'easeInOut' as const }
        };
      case 'rainbow':
        return {
          initial: { y: '100vh', scale: 0, opacity: 0 },
          animate: {
            y: ['100vh', '20vh', '20vh', '-20vh'],
            scale: [0, 2, 2, 1.5],
            opacity: [0, 1, 1, 0],
            rotate: [0, 180, 360, 540]
          },
          transition: { duration: 4, ease: 'easeInOut' as const }
        };
      default:
        return {
          initial: { y: '100vh', opacity: 0 },
          animate: { y: '-20vh', opacity: [0, 1, 0] },
          transition: { duration: 3 }
        };
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Gift;
  };

  return (
    <AnimatePresence>
      {activeGifts.map((gift) => {
        const variants = getAnimationVariants(gift.animation_type);
        const IconComponent = getIcon(gift.icon_name);

        return (
          <motion.div
            key={gift.id}
            className="absolute"
            initial={variants.initial}
            animate={variants.animate}
            exit={{ opacity: 0 }}
            transition={variants.transition}
            style={{
              left: gift.animation_type === 'sparkle' || gift.animation_type === 'pulse'
                ? '50%'
                : undefined,
              top: gift.animation_type === 'sparkle' || gift.animation_type === 'pulse'
                ? '50%'
                : undefined,
              transform: gift.animation_type === 'sparkle' || gift.animation_type === 'pulse'
                ? 'translate(-50%, -50%)'
                : undefined
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className={`p-4 rounded-full bg-gradient-to-br ${
                  gift.animation_type === 'rainbow'
                    ? 'from-red-500 via-yellow-500 to-purple-500'
                    : 'from-primary to-primary/50'
                } shadow-2xl`}
              >
                <IconComponent className="h-12 w-12 text-white" />
              </div>
              <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-white font-bold text-sm whitespace-nowrap">
                  {gift.gift_type}
                </p>
                <p className="text-white/70 text-xs text-center">
                  from {gift.sender_name}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
