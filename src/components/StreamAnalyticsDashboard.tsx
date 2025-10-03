import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Users, Gift, MessageSquare, TrendingUp } from 'lucide-react';

interface Analytics {
  total_views: number;
  unique_viewers: number;
  peak_viewers: number;
  average_watch_time_seconds: number;
  total_gifts_received: number;
  total_xp_earned: number;
  total_chat_messages: number;
  new_followers: number;
}

interface StreamAnalyticsDashboardProps {
  streamId: string;
}

export function StreamAnalyticsDashboard({ streamId }: StreamAnalyticsDashboardProps) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [streamId]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await supabase
        .from('stream_analytics')
        .select('*')
        .eq('stream_id', streamId)
        .eq('creator_id', user?.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (data) setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No analytics data available yet
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: 'Total Views',
      value: analytics.total_views,
      icon: Eye,
      color: 'text-blue-500'
    },
    {
      label: 'Unique Viewers',
      value: analytics.unique_viewers,
      icon: Users,
      color: 'text-green-500'
    },
    {
      label: 'Peak Viewers',
      value: analytics.peak_viewers,
      icon: TrendingUp,
      color: 'text-purple-500'
    },
    {
      label: 'Avg Watch Time',
      value: formatTime(analytics.average_watch_time_seconds),
      icon: Eye,
      color: 'text-orange-500'
    },
    {
      label: 'Gifts Received',
      value: analytics.total_gifts_received,
      icon: Gift,
      color: 'text-pink-500'
    },
    {
      label: 'XP Earned',
      value: analytics.total_xp_earned,
      icon: Gift,
      color: 'text-yellow-500'
    },
    {
      label: 'Chat Messages',
      value: analytics.total_chat_messages,
      icon: MessageSquare,
      color: 'text-cyan-500'
    },
    {
      label: 'New Followers',
      value: analytics.new_followers,
      icon: Users,
      color: 'text-red-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stream Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
