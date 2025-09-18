import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, TrendingUp, Plus, MessageSquare } from "lucide-react";
import { SponsorProfile } from "@/components/SponsorProfile";
import { SponsorPosts } from "@/components/SponsorPosts";
import { SponsorOffers } from "@/components/SponsorOffers";

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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="offers">My Offers</TabsTrigger>
            <TabsTrigger value="posts">Social Feed</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Partnership Dashboard</h3>
                <p className="text-muted-foreground">
                  Your comprehensive sponsor dashboard is now ready! You can create offers, 
                  manage partnerships, and post content with creator tagging.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <SponsorOffers />
          </TabsContent>

          <TabsContent value="posts">
            <SponsorPosts />
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