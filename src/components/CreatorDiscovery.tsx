import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, TrendingUp, MessageCircle, Filter, X } from "lucide-react";
import { SponsorOfferModal } from "@/components/SponsorOfferModal";
import { UserProfileModal } from "@/components/UserProfileModal";

export function CreatorDiscovery() {
  const { user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    creatorType: [],
    engagementRange: "",
    followerRange: "",
    country: "",
    ageRange: ""
  });

  useEffect(() => {
    fetchCreators();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, creators, filters]);

  const applyFilters = () => {
    let filtered = [...creators];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(creator => 
        creator.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply creator type filter
    if (filters.creatorType.length > 0) {
      filtered = filtered.filter(creator => {
        const creatorTypes = getCreatorTypes(creator);
        return filters.creatorType.some(type => creatorTypes.includes(type));
      });
    }

    // Apply engagement range filter
    if (filters.engagementRange) {
      filtered = filtered.filter(creator => {
        const engagement = creator.engagementRate;
        switch (filters.engagementRange) {
          case "0-5": return engagement >= 0 && engagement <= 5;
          case "5-10": return engagement > 5 && engagement <= 10;
          case "10-15": return engagement > 10 && engagement <= 15;
          case "15+": return engagement > 15;
          default: return true;
        }
      });
    }

    // Apply follower range filter
    if (filters.followerRange) {
      filtered = filtered.filter(creator => {
        const followers = creator.followerCount;
        switch (filters.followerRange) {
          case "0-1k": return followers < 1000;
          case "1k-10k": return followers >= 1000 && followers < 10000;
          case "10k-100k": return followers >= 10000 && followers < 100000;
          case "100k+": return followers >= 100000;
          default: return true;
        }
      });
    }

    // Apply country filter
    if (filters.country) {
      filtered = filtered.filter(creator => 
        creator.country_name?.toLowerCase() === filters.country.toLowerCase()
      );
    }

    // Apply age range filter
    if (filters.ageRange) {
      filtered = filtered.filter(creator => {
        if (!creator.age) return false;
        const age = parseInt(creator.age);
        if (isNaN(age)) return false;
        
        switch (filters.ageRange) {
          case "18-24": return age >= 18 && age <= 24;
          case "25-34": return age >= 25 && age <= 34;
          case "35-44": return age >= 35 && age <= 44;
          case "45+": return age >= 45;
          default: return true;
        }
      });
    }

    setFilteredCreators(filtered);
  };

  const getCreatorTypes = (creator) => {
    const types = [];
    
    // Use the actual creator_type field if available
    if (creator.creator_type) {
      types.push(creator.creator_type);
    }
    
    // Add additional contextual tags based on stats
    if (creator.followerCount > 100000) types.push("Large Following");
    if (creator.campaignCount > 5) types.push("Active Creator");
    if (creator.engagementRate > 12) types.push("High Engagement");
    if (creator.followerCount < 10000) types.push("Micro Creator");
    
    return types.length > 0 ? types : ["Creator"];
  };

  const clearFilters = () => {
    setFilters({
      creatorType: [],
      engagementRange: "",
      followerRange: "",
      country: "",
      ageRange: ""
    });
  };

  const hasActiveFilters = () => {
    return filters.creatorType.length > 0 || 
           filters.engagementRange || 
           filters.followerRange || 
           filters.country || 
           filters.ageRange;
  };

  const fetchCreators = async () => {
    try {
      // Fetch creators with enhanced profile data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          display_name,
          avatar_url,
          bio,
          country_name,
          age,
          creator_type,
          offer_receiving_rate_cents,
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
            engagementRate: Math.floor(Math.random() * 20) + 3 // Mock engagement rate
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

  const handleSendOffer = (creator) => {
    setSelectedCreator(creator);
    setShowOfferModal(true);
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v).length}
              </Badge>
            )}
          </Button>
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search creators..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filter Creators</h3>
            {hasActiveFilters() && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Creator Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Creator Type</label>
              <div className="space-y-2">
                {["musician", "podcaster", "streamer", "youtuber", "tiktoker", "instagrammer", "photographer", "artist", "comedian", "fitness_trainer", "chef", "fashion_designer", "dancer", "gamer", "educator", "other"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={filters.creatorType.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilters(prev => ({
                            ...prev,
                            creatorType: [...prev.creatorType, type]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            creatorType: prev.creatorType.filter(t => t !== type)
                          }));
                        }
                      }}
                    />
                    <label htmlFor={type} className="text-sm cursor-pointer">
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Engagement Rate</label>
              <Select
                value={filters.engagementRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, engagementRange: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="0-5">0-5%</SelectItem>
                  <SelectItem value="5-10">5-10%</SelectItem>
                  <SelectItem value="10-15">10-15%</SelectItem>
                  <SelectItem value="15+">15%+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Follower Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Followers</label>
              <Select
                value={filters.followerRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, followerRange: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="0-1k">0-1K</SelectItem>
                  <SelectItem value="1k-10k">1K-10K</SelectItem>
                  <SelectItem value="10k-100k">10K-100K</SelectItem>
                  <SelectItem value="100k+">100K+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Select
                value={filters.country}
                onValueChange={(value) => setFilters(prev => ({ ...prev, country: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Spain">Spain</SelectItem>
                  <SelectItem value="Italy">Italy</SelectItem>
                  <SelectItem value="Netherlands">Netherlands</SelectItem>
                  <SelectItem value="Sweden">Sweden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Age Range</label>
              <Select
                value={filters.ageRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="18-24">18-24</SelectItem>
                  <SelectItem value="25-34">25-34</SelectItem>
                  <SelectItem value="35-44">35-44</SelectItem>
                  <SelectItem value="45+">45+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCreators.length} of {creators.length} creators
            </p>
          </div>
        </Card>
      )}

      {/* Creator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map(creator => (
          <Card key={creator.user_id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <Avatar 
                  className="w-16 h-16 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => handleViewProfile(creator.user_id)}
                >
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
                onClick={() => handleSendOffer(creator)}
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
      
      {/* Sponsor Offer Modal */}
      <SponsorOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        creator={selectedCreator}
      />
      
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={selectedUserId}
      />
    </div>
  );
}