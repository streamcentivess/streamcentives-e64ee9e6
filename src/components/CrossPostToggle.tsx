import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Sparkles } from 'lucide-react';

interface CrossPostToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  showDescription?: boolean;
}

const CrossPostToggle: React.FC<CrossPostToggleProps> = ({ 
  enabled, 
  onChange, 
  disabled = false,
  showDescription = true 
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Switch
            id="cross-post"
            checked={enabled}
            onCheckedChange={onChange}
            disabled={disabled}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-purple-500"
          />
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="cross-post" 
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Share with Community Feed
            </Label>
            {enabled && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Discovery Mode
              </Badge>
            )}
          </div>
        </div>
      </div>

      {showDescription && (
        <div className="text-xs text-muted-foreground ml-8 space-y-1">
          {enabled ? (
            <div className="text-primary">
              ✨ Your post will appear on both your profile and the community feed for maximum visibility!
            </div>
          ) : (
            <div>
              Your post will only appear on your personal profile
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CrossPostToggle;