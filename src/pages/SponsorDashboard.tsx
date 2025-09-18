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
            <Button asChild variant="outline">
              <Link to="/sponsor-profile">
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Link>
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="creators">Discover Creators</TabsTrigger>
            <TabsTrigger value="offers">My Offers</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
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

          <TabsContent value="creators">
            <CreatorDiscovery />
          </TabsContent>

          <TabsContent value="offers">
            <SponsorOffers />
          </TabsContent>

          <TabsContent value="profile">
            <SponsorProfile 
              existingProfile={sponsorProfile} 
              onProfileUpdated={fetchSponsorData} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}