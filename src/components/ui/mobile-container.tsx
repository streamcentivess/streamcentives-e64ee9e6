import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  withBottomPadding?: boolean;
  withSidePadding?: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ 
  children, 
  className,
  withBottomPadding = true,
  withSidePadding = true
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      isMobile && [
        withSidePadding && 'px-2',
        withBottomPadding && 'pb-20',
        'space-y-4'
      ],
      !isMobile && [
        withSidePadding && 'px-4',
        'space-y-6'
      ],
      className
    )}>
      {children}
    </div>
  );
};

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  title, 
  subtitle, 
  className 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(className)}>
      <h1 className={cn(
        'font-bold mb-2',
        isMobile ? 'text-xl' : 'text-2xl'
      )}>
        {title}
      </h1>
      {subtitle && (
        <p className={cn(
          'text-muted-foreground',
          isMobile ? 'text-sm' : ''
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileCard: React.FC<MobileCardProps> = ({ children, className }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      'bg-card rounded-lg border',
      isMobile ? 'p-3' : 'p-4',
      className
    )}>
      {children}
    </div>
  );
};

interface MobileGridProps {
  children: React.ReactNode;
  cols?: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: {
    mobile: number;
    desktop: number;
  };
  className?: string;
}

export const MobileGrid: React.FC<MobileGridProps> = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 3, desktop: 4 },
  className 
}) => {
  const isMobile = useIsMobile();
  
  const gridClasses = cn(
    'grid',
    isMobile ? `grid-cols-${cols.mobile} gap-${gap.mobile}` : `grid-cols-1 md:grid-cols-${cols.tablet || 2} lg:grid-cols-${cols.desktop || 3} gap-${gap.desktop}`,
    className
  );
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};