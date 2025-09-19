import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CampaignCard } from '@/components/CampaignCard';
import { Plus, Calendar, Users, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  type: string;
  xp_reward: number;
  cash_reward: number | null;
  target_metric: string | null;
  target_value: number | null;
  current_progress: number;
  start_date: string;
  end_date: string | null;
  status: string;
  max_participants: number | null;
  image_url: string | null;
  tags: string[] | null;
  created_at: string;
  creator_id: string;
  participant_count?: number;
  completed_count?: number;
  collaboration_enabled?: boolean;
  collaborator_count?: number;
  user_role?: string;
  is_creator?: boolean;
  is_collaborator?: boolean;
  creator_profile?: {
    display_name: string | null;
    username: string | null;
  };
}

export const SponsorCampaignManager: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchSponsorCampaigns = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get campaigns where user is a collaborator or creator
      const { data: userCampaigns, error: userError } = await supabase.rpc('get_user_campaigns', {
        target_user_id: user.id
      });

      if (userError) throw userError;

      if (!userCampaigns?.length) {
        setCampaigns([]);
        return;
      }

      const campaignIds = userCampaigns.map(uc => uc.campaign_id);

      // Fetch full campaign data 
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .in('id', campaignIds)
        .order('created_at', { ascending: false });

      if (campaignError) throw campaignError;

      // Fetch stats for each campaign
      const campaignsWithStats = await Promise.all(
        (campaignData || []).map(async (campaign) => {
          const { data: stats } = await supabase.rpc('get_campaign_stats', {
            campaign_id_param: campaign.id
          });

          // Get creator profile info
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', campaign.creator_id)
            .single();

          const userRole = userCampaigns.find(uc => uc.campaign_id === campaign.id);
          
          return { 
            ...campaign, 
            ...stats?.[0],
            creator_profile: creatorProfile,
            user_role: userRole?.role,
            is_creator: userRole?.is_creator,
            is_collaborator: userRole?.is_collaborator
          };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error('Error fetching sponsor campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSponsorCampaigns();
  }, [fetchSponsorCampaigns]);

  const filteredCampaigns = campaigns.filter(campaign => {
    switch (activeTab) {
      case 'created':
        return campaign.is_creator;
      case 'collaborative':
        return campaign.is_collaborator && !campaign.is_creator;
      case 'active':
        return campaign.status === 'active';
      case 'completed':
        return campaign.status === 'completed';
      default:
        return true;
    }
  });

  const stats = {
    total: campaigns.length,
    created: campaigns.filter(c => c.is_creator).length,
    collaborative: campaigns.filter(c => c.is_collaborator && !c.is_creator).length,
    active: campaigns.filter(c => c.status === 'active').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Campaign Management</h2>
          <p className="text-muted-foreground">
            Manage your sponsored and collaborative campaigns
          </p>
        </div>
        <Button onClick={() => window.location.href = '/campaigns?create=true'}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All campaigns you're involved in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.created}</div>
            <p className="text-xs text-muted-foreground">Campaigns you created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborating</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collaborative}</div>
            <p className="text-xs text-muted-foreground">Collaborative campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
          <TabsTrigger value="collaborative">Collaborative</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredCampaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="relative">
                  <CampaignCard 
                    campaign={campaign}
                    onEdit={(campaign) => {
                      // Navigate to campaign edit - for future implementation
                      console.log('Edit campaign:', campaign.id);
                    }}
                    onDelete={async (campaignId) => {
                      // Delete campaign - for future implementation
                      console.log('Delete campaign:', campaignId);
                    }}
                    onToggleStatus={async (campaignId, currentStatus) => {
                      // Toggle campaign status - for future implementation
                      console.log('Toggle status:', campaignId, currentStatus);
                    }}
                    onViewDetails={(campaign) => {
                      // Navigate to campaign details - for future implementation
                      console.log('View details:', campaign.id);
                    }}
                  />
                  {/* Role Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={campaign.is_creator ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {campaign.is_creator ? 'Creator' : 'Collaborator'}
                    </Badge>
                  </div>
                  {/* Creator Info for Collaborative Campaigns */}
                  {!campaign.is_creator && campaign.creator_profile && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="outline" className="text-xs">
                        by @{campaign.creator_profile.username || campaign.creator_profile.display_name}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                  <p>
                    {activeTab === 'all' 
                      ? "You haven't created or collaborated on any campaigns yet."
                      : `No ${activeTab} campaigns found.`}
                  </p>
                </div>
                {activeTab === 'all' && (
                  <Button onClick={() => window.location.href = '/campaigns?create=true'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};