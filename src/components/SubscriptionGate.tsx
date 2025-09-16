import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Sparkles, Check, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGateProps {
  children: React.ReactNode;
  isSubscribed: boolean;
  title: string;
  description: string;
  features?: string[];
  onSubscribe?: () => void;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  isSubscribed,
  title,
  description,
  features = [],
  onSubscribe
}) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    } else {
      navigate('/billing-payments');
    }
  };

  if (isSubscribed) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred/disabled content */}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="max-w-md mx-auto border-2 border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-gradient-primary text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                PRO Feature
              </Badge>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {description}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {features.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Unlock with Creator Pro:
                </h4>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleSubscribe}
                className="w-full bg-gradient-primary hover:opacity-90 text-white"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Creator Pro
              </Button>
              
              <div className="text-center text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3" />
                  Instant access • Cancel anytime
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};