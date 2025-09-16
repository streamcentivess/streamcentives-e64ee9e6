import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileDialog: React.FC<MobileDialogProps> = ({
  open,
  onOpenChange,
  title,
  children,
  className
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        isMobile && [
          'w-[95vw] max-w-[95vw]',
          'h-auto max-h-[90vh]',
          'overflow-y-auto',
          'rounded-lg',
          'm-4'
        ],
        className
      )}>
        <DialogHeader>
          <DialogTitle className={isMobile ? 'text-lg' : 'text-xl'}>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};