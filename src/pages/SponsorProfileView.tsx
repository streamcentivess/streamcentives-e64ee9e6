import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Globe, DollarSign, Users, Briefcase, Calendar, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

interface SponsorProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  website_url?: string;
  company_logo_url?: string;
  company_description?: string;
  budget_range_min?: number;
  budget_range_max?: number;
  created_at: string;
  updated_at: string;
}

interface SponsorOffer {
  id: string;
  offer_title: string;
  offer_description: string;
  offer_amount_cents: number;
  status: string;
  created_at: string;
}

export default function SponsorProfileView() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<SponsorProfile | null>(null);
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_offers: 0,
    active_partnerships: 0,
    completed_campaigns: 0
  });

  // Check if viewing own profile or another sponsor's profile
  const viewingSponsorId = searchParams.get('sponsorId');
  const isOwnProfile = !viewingSponsorId || (profile && profile.user_id === user?.id);

  useEffect(() => {
    fetchSponsorProfile();
  }, [user, viewingSponsorId]);

  useEffect(() => {
    if (profile) {
      fetchSponsorOffers();
      fetchSponsorStats();
    }
  }, [profile]);

  const fetchSponsorProfile = async () => {
    try {
      let profileQuery;
      
      if (viewingSponsorId) {
        profileQuery = supabase
          .from('sponsor_profiles')
          .select('*')
          .eq('id', viewingSponsorId)
          .maybeSingle();
      } else if (user) {
        profileQuery = supabase
          .from('sponsor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
      } else {
        return;
      }

      const { data, error } = await profileQuery;

      if (error) {
        console.error('Error fetching sponsor profile:', error);
        toast({
          title: "Error",
          description: "Failed to load sponsor profile",
          variant: "destructive"
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSponsorOffers = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('sponsor_offers')
        .select('id, offer_title, offer_description, offer_amount_cents, status, created_at')
        .eq('sponsor_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching sponsor offers:', error);
      } else {
        setOffers(data || []);
      }
    } catch (error) {
      console.error('Error fetching sponsor offers:', error);
    }
  };

  const fetchSponsorStats = async () => {
    if (!profile) return;

    try {
      // Get total offers count
      const { count: totalOffers } = await supabase
        .from('sponsor_offers')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.user_id);

      // Get active partnerships count
      const { count: activePartnerships } = await supabase
        .from('sponsor_offers')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.user_id)
        .eq('status', 'accepted');

      // Get accepted partnership IDs first
      const { data: acceptedOffers } = await supabase
        .from('sponsor_offers')
        .select('id')
        .eq('sponsor_id', profile.user_id)
        .eq('status', 'accepted');

      const acceptedOfferIds = acceptedOffers?.map(offer => offer.id) || [];

      // Get completed campaigns count
      const { count: completedCampaigns } = acceptedOfferIds.length > 0 
        ? await supabase
            .from('sponsorship_campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
            .in('partnership_id', acceptedOfferIds)
        : { count: 0 };

      setStats({
        total_offers: totalOffers || 0,
        active_partnerships: activePartnerships || 0,
        completed_campaigns: completedCampaigns || 0
      });
    } catch (error) {
      console.error('Error fetching sponsor stats:', error);
    }
  };

  const formatBudgetRange = (min?: number, max?: number) => {
    if (!min && !max) return 'Budget not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}/month`;
    if (min) return `$${min.toLocaleString()}+/month`;
    return `Up to $${max?.toLocaleString()}/month`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sponsor Profile Not Found</h2>
            <p className="text-muted-foreground">
              {viewingSponsorId 
                ? "This sponsor profile doesn't exist or is no longer available."
                : "You haven't created a sponsor profile yet."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage 
                src={profile.company_logo_url} 
                alt={profile.company_name}
              />
              <AvatarFallback>
                <Building2 className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile.company_name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    {profile.industry && (
                      <Badge variant="secondary" className="text-sm">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {profile.industry}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                    </span>
                  </div>
                </div>
                
                {profile.website_url && (
                  <Button variant="outline" asChild className="mt-4 md:mt-0">
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>
              
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{stats.total_offers}</div>
                  <div className="text-muted-foreground">Offers Made</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{stats.active_partnerships}</div>
                  <div className="text-muted-foreground">Active Partnerships</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{stats.completed_campaigns}</div>
                  <div className="text-muted-foreground">Completed Campaigns</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget and Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-primary">
              {formatBudgetRange(profile.budget_range_min, profile.budget_range_max)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Partnership Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-primary">
              {stats.completed_campaigns > 0 ? '4.8/5.0' : 'New Sponsor'}
            </p>
            <p className="text-sm text-muted-foreground">
              Based on {stats.completed_campaigns} completed campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company Description */}
      {profile.company_description && (
        <Card>
          <CardHeader>
            <CardTitle>About {profile.company_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {profile.company_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Offers */}
      {isOwnProfile && offers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Partnership Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {offers.slice(0, 5).map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{offer.offer_title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {offer.offer_description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-medium">
                        ${(offer.offer_amount_cents / 100).toLocaleString()}
                      </span>
                      <Badge 
                        variant={offer.status === 'accepted' ? 'default' : 
                               offer.status === 'rejected' ? 'destructive' : 'secondary'}
                      >
                        {offer.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(offer.created_at), 'MMM dd')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}