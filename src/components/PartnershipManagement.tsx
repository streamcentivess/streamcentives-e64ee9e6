import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, TrendingUp, CheckCircle } from "lucide-react";

export function PartnershipManagement() {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPartnerships();
    }
  }, [user]);

  const fetchPartnerships = async () => {
    try {
      // Fetch accepted offers that have become partnerships
      const { data, error } = await supabase
        .from('sponsor_offers')
        .select(`
          *,
          profiles!sponsor_offers_creator_id_fkey (
            username, 
            display_name, 
            avatar_url
          )
        `)
        .eq('sponsor_id', user?.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mock additional partnership data since we don't have a full partnerships table yet
      const partnershipsWithStats = data?.map(offer => ({
        ...offer,
        progress: Math.floor(Math.random() * 100),
        deliverables_completed: Math.floor(Math.random() * (Array.isArray(offer.deliverables) ? offer.deliverables.length : 1)),
        engagement_metrics: {
          views: Math.floor(Math.random() * 100000),
          likes: Math.floor(Math.random() * 10000),
          shares: Math.floor(Math.random() * 1000)
        }
      })) || [];

      setPartnerships(partnershipsWithStats);
    } catch (error) {
      console.error('Error fetching partnerships:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (progress: number) => {
    if (progress === 100) return 'default';
    if (progress >= 50) return 'secondary';
    return 'outline';
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Partnership Management</h2>
        <p className="text-muted-foreground">Track and manage your active partnerships</p>
      </div>

      {/* Partnerships List */}
      {partnerships.length > 0 ? (
        <div className="space-y-6">
          {partnerships.map(partnership => (
            <Card key={partnership.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={partnership.profiles?.avatar_url} />
                      <AvatarFallback>
                        {partnership.profiles?.display_name?.[0] || partnership.profiles?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{partnership.offer_title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        with @{partnership.profiles?.username}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(partnership.progress)}>
                      {partnership.progress === 100 ? 'Completed' : 'In Progress'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${(partnership.offer_amount_cents / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Campaign Progress</span>
                    <span>{partnership.progress}%</span>
                  </div>
                  <Progress value={partnership.progress} className="h-2" />
                </div>

                {/* Deliverables */}
                {partnership.deliverables && Array.isArray(partnership.deliverables) && partnership.deliverables.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Deliverables</h4>
                    <div className="space-y-1">
                      {(partnership.deliverables as string[]).map((deliverable, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle 
                            className={`h-4 w-4 ${
                              index < partnership.deliverables_completed 
                                ? 'text-green-500' 
                                : 'text-muted-foreground'
                            }`}
                          />
                          <span className={
                            index < partnership.deliverables_completed 
                              ? 'line-through text-muted-foreground' 
                              : ''
                          }>
                            {deliverable}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Views</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {partnership.engagement_metrics.views.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Likes</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {partnership.engagement_metrics.likes.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Shares</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {partnership.engagement_metrics.shares.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Campaign Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Started: {new Date(partnership.created_at).toLocaleDateString()}
                  </div>
                  {partnership.campaign_duration_days && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Duration: {partnership.campaign_duration_days} days
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Message Creator
                  </Button>
                  {partnership.progress === 100 && (
                    <Button size="sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Request Invoice
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No active partnerships</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by sending offers to creators to begin partnerships
            </p>
            <Button>Discover Creators</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}