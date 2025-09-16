import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Music, 
  TrendingUp, 
  Heart, 
  Play, 
  Star,
  Sparkles,
  Filter,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DiscoveryItem {
  id: string;
  type: 'artist' | 'track' | 'campaign' | 'smart_link';
  title: string;
  subtitle: string;
  imageUrl?: string;
  score: number;
  tags: string[];
  xpReward?: number;
  metadata: any;
}

interface AIRecommendation {
  items: DiscoveryItem[];
  reasoning: string;
  confidence: number;
}

export const CatalogDiscoveryAI: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<AIRecommendation | null>(null);
  const [trendingItems, setTrendingItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = [
    'Hip Hop', 'Pop', 'Rock', 'Electronic', 'R&B', 'Country', 'Jazz', 'Classical',
    'Indie', 'Alternative', 'Reggae', 'Latin', 'Folk', 'Blues', 'Punk', 'Metal'
  ];

  useEffect(() => {
    loadTrendingContent();
  }, []);

  const loadTrendingContent = async () => {
    try {
      // Load trending campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select(`
          *,
          profiles:creator_id(username, display_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('boost_score', { ascending: false })
        .limit(10);

      // Load popular smart links
      const { data: smartLinks } = await supabase
        .from('smart_links')
        .select(`
          *,
          profiles:creator_id(username, display_name, avatar_url)
        `)
        .eq('is_active', true)
        .order('total_clicks', { ascending: false })
        .limit(5);

      const trendingItems: DiscoveryItem[] = [];

      // Add campaigns
      if (campaigns) {
        trendingItems.push(...campaigns.map(campaign => ({
          id: campaign.id,
          type: 'campaign' as const,
          title: campaign.title,
          subtitle: `by ${campaign.profiles?.display_name || campaign.profiles?.username}`,
          imageUrl: campaign.image_url,
          score: campaign.boost_score || 0,
          tags: campaign.tags || [],
          xpReward: campaign.xp_reward,
          metadata: campaign
        })));
      }

      // Add smart links
      if (smartLinks) {
        trendingItems.push(...smartLinks.map(link => ({
          id: link.id,
          type: 'smart_link' as const,
          title: link.title,
          subtitle: `by ${link.profiles?.display_name || link.profiles?.username}`,
          score: link.total_clicks,
          tags: [],
          metadata: link
        })));
      }

      // Sort by score and take top items
      trendingItems.sort((a, b) => b.score - a.score);
      setTrendingItems(trendingItems.slice(0, 12));

    } catch (error) {
      console.error('Error loading trending content:', error);
    }
  };

  const generateAIRecommendations = async (query: string, tags: string[] = []) => {
    setLoading(true);
    try {
      // This would call an AI service to generate personalized recommendations
      // For now, we'll create a mock implementation that filters existing content
      
      const userPreferences = await getUserPreferences();
      const filteredItems = await getFilteredContent(query, tags, userPreferences);
      
      const aiRecommendations: AIRecommendation = {
        items: filteredItems,
        reasoning: generateReasoningText(query, tags, userPreferences),
        confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
      };

      setRecommendations(aiRecommendations);
      
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getUserPreferences = async () => {
    if (!user) return {};

    try {
      // Analyze user's past activity to understand preferences
      const { data: campaigns } = await supabase
        .from('campaign_participants')
        .select(`
          campaigns(title, tags, type),
          xp_earned
        `)
        .eq('user_id', user.id)
        .limit(50);

      const { data: listens } = await supabase
        .from('spotify_listens')
        .select('track_name, artist_name')
        .eq('fan_user_id', user.id)
        .limit(100);

      // Extract preferences from user activity
      const preferredGenres = new Set<string>();
      const preferredCampaignTypes = new Set<string>();

      if (campaigns) {
        campaigns.forEach(participation => {
          if (participation.campaigns?.tags) {
            participation.campaigns.tags.forEach((tag: string) => preferredGenres.add(tag));
          }
          if (participation.campaigns?.type) {
            preferredCampaignTypes.add(participation.campaigns.type);
          }
        });
      }

      return {
        preferredGenres: Array.from(preferredGenres),
        preferredCampaignTypes: Array.from(preferredCampaignTypes),
        totalXPEarned: campaigns?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0,
        listenCount: listens?.length || 0
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  };

  const getFilteredContent = async (query: string, tags: string[], preferences: any): Promise<DiscoveryItem[]> => {
    const items: DiscoveryItem[] = [];

    // Search campaigns
    let campaignQuery = supabase
      .from('campaigns')
      .select(`
        *,
        profiles:creator_id(username, display_name, avatar_url)
      `)
      .eq('status', 'active');

    if (query) {
      campaignQuery = campaignQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data: campaigns } = await campaignQuery.limit(10);

    if (campaigns) {
      items.push(...campaigns
        .filter(campaign => {
          if (tags.length === 0) return true;
          return campaign.tags?.some((tag: string) => tags.includes(tag));
        })
        .map(campaign => ({
          id: campaign.id,
          type: 'campaign' as const,
          title: campaign.title,
          subtitle: `by ${campaign.profiles?.display_name || campaign.profiles?.username}`,
          imageUrl: campaign.image_url,
          score: calculateRelevanceScore(campaign, preferences),
          tags: campaign.tags || [],
          xpReward: campaign.xp_reward,
          metadata: campaign
        })));
    }

    // Search smart links
    let linkQuery = supabase
      .from('smart_links')
      .select(`
        *,
        profiles:creator_id(username, display_name, avatar_url)
      `)
      .eq('is_active', true);

    if (query) {
      linkQuery = linkQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data: smartLinks } = await linkQuery.limit(8);

    if (smartLinks) {
      items.push(...smartLinks.map(link => ({
        id: link.id,
        type: 'smart_link' as const,
        title: link.title,
        subtitle: `by ${link.profiles?.display_name || link.profiles?.username}`,
        score: calculateRelevanceScore(link, preferences),
        tags: [],
        metadata: link
      })));
    }

    // Sort by relevance score
    return items.sort((a, b) => b.score - a.score);
  };

  const calculateRelevanceScore = (item: any, preferences: any): number => {
    let score = 0;

    // Base popularity score
    if (item.boost_score) score += item.boost_score * 0.3;
    if (item.total_clicks) score += item.total_clicks * 0.2;
    if (item.current_progress) score += item.current_progress * 0.1;

    // Preference matching
    if (item.tags && preferences.preferredGenres) {
      const matchingTags = item.tags.filter((tag: string) => 
        preferences.preferredGenres.includes(tag)
      ).length;
      score += matchingTags * 20;
    }

    if (item.type && preferences.preferredCampaignTypes?.includes(item.type)) {
      score += 15;
    }

    // Recency boost
    const itemAge = new Date().getTime() - new Date(item.created_at).getTime();
    const daysSinceCreated = itemAge / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) score += 10; // Boost recent items

    return score;
  };

  const generateReasoningText = (query: string, tags: string[], preferences: any): string => {
    const reasons = [];

    if (query) {
      reasons.push(`searched for "${query}"`);
    }

    if (tags.length > 0) {
      reasons.push(`interested in ${tags.join(', ')}`);
    }

    if (preferences.preferredGenres?.length > 0) {
      reasons.push(`previously engaged with ${preferences.preferredGenres.slice(0, 3).join(', ')}`);
    }

    if (preferences.totalXPEarned > 1000) {
      reasons.push(`active community member with ${preferences.totalXPEarned} XP`);
    }

    const baseReason = "Based on trending content and community activity";
    const personalReason = reasons.length > 0 ? `your ${reasons.join(' and ')}` : "global trends";

    return `${baseReason}, personalized for ${personalReason}.`;
  };

  const handleSearch = () => {
    if (searchQuery.trim() || selectedTags.length > 0) {
      generateAIRecommendations(searchQuery, selectedTags);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleItemClick = async (item: DiscoveryItem) => {
    // Track the interaction
    try {
      await supabase
        .from('content_recommendations')
        .insert([{
          user_id: user!.id,
          recommended_content_id: item.id,
          content_type: item.type,
          recommendation_score: item.score,
          clicked: true
        }]);
    } catch (error) {
      console.error('Error tracking recommendation click:', error);
    }

    // Navigate to the content
    switch (item.type) {
      case 'campaign':
        window.location.href = `/fan-campaigns?campaign=${item.id}`;
        break;
      case 'smart_link':
        window.location.href = `/link/${item.metadata.slug}`;
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for artists, campaigns, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Genre Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter by genre:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Recommendations
              <Badge variant="secondary">
                {Math.round(recommendations.confidence * 100)}% match
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {recommendations.reasoning}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.items.map(item => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleItemClick(item)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {item.xpReward && (
                            <Badge variant="secondary">+{item.xpReward} XP</Badge>
                          )}
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {Math.round(item.score)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingItems.map(item => (
              <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleItemClick(item)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {item.xpReward && (
                          <Badge variant="secondary">+{item.xpReward} XP</Badge>
                        )}
                        <Badge variant="outline">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          {Math.round(item.score)}
                        </Badge>
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};