import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, TrendingUp, MessageCircle } from "lucide-react";

export function CreatorDiscovery() {
  const { user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCreators, setFilteredCreators] = useState([]);

  useEffect(() => {
    fetchCreators();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = creators.filter(creator => 
        creator.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCreators(filtered);
    } else {
      setFilteredCreators(creators);
    }
  }, [searchTerm, creators]);

  const fetchCreators = async () => {
    try {
      // Fetch creators with their follower counts and campaign activity
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          display_name,
          avatar_url,
          bio,
          created_at
        `)
        .not('username', 'is', null)
        .limit(50);

      if (error) throw error;

      // Get additional stats for each creator
      const creatorsWithStats = await Promise.all(
        data.map(async (creator) => {
          // Get follower count
          const { count: followerCount } = await supabase
            .from('follows')
            .select('id', { count: 'exact' })
            .eq('following_id', creator.user_id);

          // Get campaign count
          const { count: campaignCount } = await supabase
            .from('campaigns')
            .select('id', { count: 'exact' })
            .eq('creator_id', creator.user_id);

          return {
            ...creator,
            followerCount: followerCount || 0,
            campaignCount: campaignCount || 0,
            engagementRate: Math.floor(Math.random() * 15) + 5 // Mock engagement rate
          };
        })
      );

      // Sort by follower count
      creatorsWithStats.sort((a, b) => b.followerCount - a.followerCount);
      
      setCreators(creatorsWithStats);
      setFilteredCreators(creatorsWithStats);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = (creatorId: string) => {
    // Navigate to offer creation or open modal
    // This would integrate with the SponsorOffers component
    console.log('Send offer to creator:', creatorId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Discover Creators</h2>
          <p className="text-muted-foreground">Find and connect with talented creators</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search creators..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Creator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map(creator => (
          <Card key={creator.user_id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={creator.avatar_url} />
                  <AvatarFallback>
                    {creator.display_name?.[0] || creator.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {creator.display_name || creator.username}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">@{creator.username}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {creator.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {creator.bio}
                </p>
              )}
              
              {/* Stats */}
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{creator.followerCount.toLocaleString()} followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{creator.engagementRate}% engagement</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {creator.campaignCount} campaigns
                </Badge>
                {creator.followerCount > 1000 && (
                  <Badge variant="outline" className="text-xs">Popular</Badge>
                )}
                {creator.engagementRate > 10 && (
                  <Badge variant="outline" className="text-xs">High Engagement</Badge>
                )}
              </div>

              {/* Action Button */}
              <Button 
                className="w-full" 
                onClick={() => handleSendOffer(creator.user_id)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Offer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCreators.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No creators found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm 
                ? "Try adjusting your search terms or browse all creators" 
                : "Check back later as more creators join the platform"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}