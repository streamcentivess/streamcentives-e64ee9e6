import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy } from 'lucide-react';

interface XPRewardAnimationProps {
  xpAmount: number;
  show: boolean;
  onComplete: () => void;
}

export const XPRewardAnimation = ({ xpAmount, show, onComplete }: XPRewardAnimationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -50 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-8 rounded-full shadow-2xl">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              <div className="text-center">
                <div className="text-2xl font-bold">+{xpAmount} XP</div>
                <div className="text-sm opacity-90">Campaign Completed!</div>
              </div>
              <Star className="h-8 w-8" />
            </div>
          </div>
          
          {/* Confetti effect */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  x: '50%', 
                  y: '50%',
                  scale: 0 
                }}
                animate={{ 
                  opacity: 0, 
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  scale: 1
                }}
                transition={{ 
                  duration: 2,
                  delay: Math.random() * 0.5 
                }}
                className="absolute w-3 h-3 bg-yellow-400 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};