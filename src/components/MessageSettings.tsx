import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Coins } from 'lucide-react';

interface MessageCostSettings {
  xp_cost: number;
  is_accepting_messages: boolean;
}

const MessageSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MessageCostSettings>({
    xp_cost: 100,
    is_accepting_messages: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSettings, setHasSettings] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('message_costs')
      .select('xp_cost, is_accepting_messages')
      .eq('creator_id', user.id)
      .single();

    if (data) {
      setSettings(data);
      setHasSettings(true);
    }
  };

  const handleSaveSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoading(true);

    try {
      if (hasSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('message_costs')
          .update({
            xp_cost: settings.xp_cost,
            is_accepting_messages: settings.is_accepting_messages,
            updated_at: new Date().toISOString()
          })
          .eq('creator_id', user.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('message_costs')
          .insert({
            creator_id: user.id,
            xp_cost: settings.xp_cost,
            is_accepting_messages: settings.is_accepting_messages
          });

        if (error) throw error;
        setHasSettings(true);
      }

      toast({
        title: "Settings saved",
        description: "Your message settings have been updated.",
      });

    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Message Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="xp-cost">XP Cost per Message</Label>
          <Input
            id="xp-cost"
            type="number"
            min="1"
            max="1000"
            value={settings.xp_cost}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              xp_cost: parseInt(e.target.value) || 100
            }))}
            placeholder="100"
          />
          <p className="text-sm text-muted-foreground">
            How much XP fans need to spend to send you a message.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="accepting-messages"
            checked={settings.is_accepting_messages}
            onCheckedChange={(checked) => setSettings(prev => ({
              ...prev,
              is_accepting_messages: checked
            }))}
          />
          <Label htmlFor="accepting-messages">Accept new messages</Label>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="w-full flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MessageSettings;