import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, TrendingUp, Plus, MessageSquare, User } from "lucide-react";
import { SponsorProfile } from "@/components/SponsorProfile";
import { BrandDealsDashboard } from '@/components/BrandDealsDashboard';
import { SponsorOffers } from "@/components/SponsorOffers";
import { CreatorDiscovery } from "@/components/CreatorDiscovery";
import { SponsorCampaignManager } from "@/components/SponsorCampaignManager";
import { SponsorInbox } from "@/components/SponsorInbox";
import { CreatorToolsHub } from "@/components/CreatorToolsHub";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SponsorDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="absolute inset-0 bg-grid-subtle opacity-[0.02]" />
      <div className="relative max-w-7xl mx-auto space-y-4 md:space-y-6 p-3 md:p-6">
        <div className="glass-card p-4 md:p-6 border-primary/20">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Sponsor Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Welcome back, {sponsorProfile.company_name}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Link to="/brand-profile" className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="sm:size-default w-full sm:w-auto btn-glass">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">View Brand Profile</span>
                  <span className="sm:hidden">Brand</span>
                </Button>
              </Link>
              <Link to="/sponsor-profile" className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="sm:size-default w-full sm:w-auto btn-glass">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sponsor Profile</span>
                  <span className="sm:hidden">Profile</span>
                </Button>
              </Link>
              <Button size="sm" className="sm:size-default flex-1 sm:flex-none btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Campaign</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
          <TabsList className={`w-full ${isMobile ? 'flex overflow-x-auto gap-1' : 'grid grid-cols-7'}`}>
            <TabsTrigger value="overview" className={isMobile ? 'whitespace-nowrap flex-shrink-0 min-w-[80px]' : ''}>
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className={isMobile ? 'whitespace-nowrap flex-shrink-0 min-w-[90px]' : ''}>
              <span className="hidden sm:inline">Campaigns</span>
              <span className="sm:hidden">Camps</span>
            </TabsTrigger>
            <TabsTrigger value="creators" className={isMobile ? 'whitespace-nowrap flex-shrink-0 min-w-[90px]' : ''}>
              <span className="hidden sm:inline">Discover Creators</span>
              <span className="sm:hidden">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className={isMobile ? 'whitespace-nowrap flex-shrink-0 min-w-[80px]' : ''}>
              <span className="hidden sm:inline">My Offers</span>
              <span className="sm:hidden">Offers</span>
            </TabsTrigger>
            <TabsTrigger value="creator-tools" className={isMobile ? 'whitespace-nowrap flex-shrink-0 min-w-[80px]' : ''}>
              <span className="hidden sm:inline">Creator Tools</span>
              <span className="sm:hidden">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className={isMobile ? 'whitespace-nowrap flex-shrink-0 min-w-[70px]' : ''}>Inbox</TabsTrigger>
            <TabsTrigger value="profile" className={isMobile ? 'whitespace-nowrap flex-shrink-0 min-w-[80px]' : ''}>
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="card-glow border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gradient-primary">
                    <span className="hidden sm:inline">Active Partnerships</span>
                    <span className="sm:hidden">Partners</span>
                  </CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">+0% from last month</p>
                </CardContent>
              </Card>
              
              <Card className="card-glow border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gradient-primary">
                    <span className="hidden sm:inline">Total Reach</span>
                    <span className="sm:hidden">Reach</span>
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="hidden sm:inline">Across all campaigns</span>
                    <span className="sm:hidden">All campaigns</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="card-glow border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gradient-primary">
                    <span className="hidden sm:inline">Campaign ROI</span>
                    <span className="sm:hidden">ROI</span>
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="hidden sm:inline">Average return</span>
                    <span className="sm:hidden">Avg return</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="card-glow border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gradient-primary">
                    <span className="hidden sm:inline">Pending Offers</span>
                    <span className="sm:hidden">Offers</span>
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="hidden sm:inline">Awaiting response</span>
                    <span className="sm:hidden">Pending</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4 md:mt-6 glass-card border-primary/20">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-medium mb-3 md:mb-4 text-gradient-primary">Welcome to Your Sponsor Dashboard</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 md:mb-4">
                  Get started by discovering creators that match your brand and campaign goals.
                </p>
                <Button 
                  onClick={() => {
                    // Switch to creators tab programmatically
                    const creatorsTab = document.querySelector('[value="creators"]') as HTMLButtonElement;
                    creatorsTab?.click();
                  }}
                  size={isMobile ? "sm" : "default"}
                  className="w-full sm:w-auto btn-primary"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Discover Creators</span>
                  <span className="sm:hidden">Discover</span>
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

          <TabsContent value="brand-deals">
            <BrandDealsDashboard />
          </TabsContent>

          <TabsContent value="creator-tools">
            <CreatorToolsHub userRole="sponsor" profile={sponsorProfile} />
          </TabsContent>

          <TabsContent value="inbox">
            <SponsorInbox />
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Edit Sponsor Profile</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Update your company information and account settings</p>
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