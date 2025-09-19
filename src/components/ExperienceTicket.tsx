import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QrCode, Clock, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ExperienceTicketProps {
  experienceId: string;
  className?: string;
}

interface Experience {
  id: string;
  experience_type: string;
  scheduled_at: string | null;
  location: string | null;
  verification_code: string;
  qr_code_url: string | null;
  instructions: string | null;
  status: string;
  metadata: any;
  created_at: string;
  reward_redemptions: any;
}

export function ExperienceTicket({ experienceId, className }: ExperienceTicketProps) {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExperience();
  }, [experienceId]);

  const fetchExperience = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          reward_redemptions!inner(
            reward:rewards(
              title,
              description
            )
          )
        `)
        .eq('id', experienceId)
        .single();

      if (error) {
        console.error('Error fetching experience:', error);
        toast({
          title: 'Error',
          description: 'Failed to load experience ticket',
          variant: 'destructive'
        });
        return;
      }

      setExperience(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load experience ticket',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'active':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'completed':
        return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const shareTicket = async () => {
    if (navigator.share && experience) {
      try {
        await navigator.share({
          title: `Experience Ticket: ${experience.reward_redemptions[0]?.reward?.title}`,
          text: `Check out my experience ticket for ${experience.reward_redemptions[0]?.reward?.title}`,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to copying URL
        copyTicketUrl();
      }
    } else {
      copyTicketUrl();
    }
  };

  const copyTicketUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Copied',
      description: 'Ticket URL copied to clipboard'
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!experience) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Experience ticket not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-2 shadow-lg`}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">
              {experience.reward_redemptions[0]?.reward?.title}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {experience.reward_redemptions[0]?.reward?.description}
            </p>
          </div>
          <Badge className={getStatusColor(experience.status)}>
            {getStatusIcon(experience.status)}
            <span className="ml-1 capitalize">{experience.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Experience Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Experience Type</span>
            </div>
            <p className="font-medium capitalize">
              {experience.experience_type.replace('_', ' ')}
            </p>
          </div>

          {experience.scheduled_at && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Scheduled</span>
              </div>
              <p className="font-medium">
                {format(new Date(experience.scheduled_at), 'PPp')}
              </p>
            </div>
          )}

          {experience.location && (
            <div className="space-y-2 col-span-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </div>
              <p className="font-medium">{experience.location}</p>
            </div>
          )}
        </div>

        {/* Verification Code */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-sm">Verification Details</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <QrCode className="w-4 h-4" />
              <span>Verification Code</span>
            </div>
            <p className="font-mono text-lg font-bold tracking-wider bg-background p-2 rounded border">
              {experience.verification_code}
            </p>
          </div>
          
          {experience.qr_code_url && (
            <div className="flex justify-center">
              <img
                src={experience.qr_code_url}
                alt="QR Code for verification"
                className="w-32 h-32 border rounded"
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        {experience.instructions && (
          <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-200">
              Instructions
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {experience.instructions}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={shareTicket} className="flex-1">
            Share Ticket
          </Button>
          {experience.status === 'scheduled' && (
            <Button variant="default" className="flex-1">
              Set Reminder
            </Button>
          )}
        </div>

        {/* Ticket Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Ticket ID: {experience.id.slice(0, 8)}...
          <br />
          Issued: {format(new Date(experience.created_at), 'PP')}
        </div>
      </CardContent>
    </Card>
  );
}