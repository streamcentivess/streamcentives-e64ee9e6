import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, TrendingUp, Plus, MessageSquare, User } from "lucide-react";
import { SponsorProfile } from "@/components/SponsorProfile";
import { SponsorOffers } from "@/components/SponsorOffers";
import { CreatorDiscovery } from "@/components/CreatorDiscovery";
import { SponsorCampaignManager } from "@/components/SponsorCampaignManager";
import { SponsorInbox } from "@/components/SponsorInbox";
import { Link } from "react-router-dom";

export default function SponsorDashboard() {
  const { user } = useAuth();
  const [sponsorProfile, setSponsorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSponsorData();
    }
  }, [user]);

  const fetchSponsorData = async () => {
    try {
      const { data: profile } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSponsorProfile(profile);
    } catch (error) {
      console.error('Error fetching sponsor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sponsorProfile) {
    return <SponsorProfile onProfileCreated={fetchSponsorData} />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sponsor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {sponsorProfile.company_name}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/brand-profile">
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                View Brand Profile
              </Button>
            </Link>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="creators">Discover Creators</TabsTrigger>
            <TabsTrigger value="offers">My Offers</TabsTrigger>
            <TabsTrigger value="creator-tools">Creator Tools</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="profile">Edit Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Partnerships</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">+0% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Across all campaigns</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Campaign ROI</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">Average return</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Awaiting response</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Welcome to Your Sponsor Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by discovering creators that match your brand and campaign goals.
                </p>
                <Button 
                  onClick={() => {
                    // Switch to creators tab programmatically
                    const creatorsTab = document.querySelector('[value="creators"]') as HTMLButtonElement;
                    creatorsTab?.click();
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Discover Creators
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <SponsorCampaignManager />
          </TabsContent>

          <TabsContent value="creators">
            <CreatorDiscovery />
          </TabsContent>

          <TabsContent value="offers">
            <SponsorOffers />
          </TabsContent>

          <TabsContent value="creator-tools">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-primary"></div>
                  Creator Tools Hub
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Access premium creator tools with a subscription to enhance your brand content
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-gradient-primary text-white hover:shadow-glow transition-all" 
                >
                  🤖 AI Campaign Builder
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                >
                  ✨ Content Assistant
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                >
                  🎤 Shoutout Generator
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                >
                  📊 Sentiment Analysis
                </Button>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Subscribe to unlock all creator tools for your brand campaigns
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    🚀 Upgrade to Brand Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inbox">
            <SponsorInbox />
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Edit Sponsor Profile</h2>
                  <p className="text-muted-foreground">Update your company information and account settings</p>
                </div>
              </div>
              <SponsorProfile 
                existingProfile={sponsorProfile} 
                onProfileUpdated={fetchSponsorData} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}