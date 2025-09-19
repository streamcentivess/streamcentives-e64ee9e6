import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Globe, DollarSign, Users, Briefcase, Calendar, Star, Edit, TrendingUp, Target, Award, ArrowRight, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  target_audience?: string;
  partnership_goals?: string[];
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<SponsorProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
      let sponsorQuery, userQuery;
      
      if (viewingSponsorId) {
        sponsorQuery = supabase
          .from('sponsor_profiles')
          .select('*')
          .eq('id', viewingSponsorId)
          .maybeSingle();
      } else if (user) {
        sponsorQuery = supabase
          .from('sponsor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
      } else {
        return;
      }

      // Fetch sponsor profile
      const { data: sponsorData, error: sponsorError } = await sponsorQuery;

      if (sponsorError) {
        console.error('Error fetching sponsor profile:', sponsorError);
        toast({
          title: "Error",
          description: "Failed to load sponsor profile",
          variant: "destructive"
        });
        return;
      }

      if (sponsorData) {
        setProfile(sponsorData);

        // Fetch associated user profile
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, bio')
          .eq('user_id', sponsorData.user_id)
          .maybeSingle();

        if (!userError && userData) {
          setUserProfile(userData);
        }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-muted/20">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-white/20 shadow-xl">
                <AvatarImage 
                  src={profile.company_logo_url} 
                  alt={profile.company_name}
                />
                <AvatarFallback className="bg-white/10 text-white text-2xl">
                  <Building2 className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-3">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{profile.company_name}</h1>
                  {userProfile?.username && (
                    <p className="text-white/80 text-lg mb-2">streamcentives</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    {profile.industry && (
                      <Badge className="bg-white/20 text-white border-white/30 text-sm">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {profile.industry}
                      </Badge>
                    )}
                    {profile.target_audience && (
                      <Badge className="bg-white/20 text-white border-white/30 text-sm">
                        <Users className="h-3 w-3 mr-1" />
                        {profile.target_audience}
                      </Badge>
                    )}
                    <span className="flex items-center gap-2 text-white/90 text-sm">
                      <Calendar className="h-4 w-4" />
                      Partner since {format(new Date(profile.created_at), 'MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:ml-auto flex flex-col lg:flex-row gap-4">
              {isOwnProfile && (
                <Button 
                  onClick={() => navigate('/sponsor-dashboard')}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              {profile.website_url && (
                <Button 
                  asChild 
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Offers Made</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total_offers}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Partnership proposals</p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                  <Mail className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Partners</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.active_partnerships}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Current collaborations</p>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                  <Users className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Completed</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.completed_campaigns}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Successful campaigns</p>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                  <Award className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partnership Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  Investment Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-2xl font-bold text-primary">
                    {formatBudgetRange(profile.budget_range_min, profile.budget_range_max)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Available for creator partnerships and sponsored content
                  </p>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Ready to invest in quality partnerships</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Star className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  Partnership Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.completed_campaigns > 0 ? '4.8' : 'New'}
                    </p>
                    {stats.completed_campaigns > 0 && (
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < 5 ? 'fill-orange-400 text-orange-400' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {stats.completed_campaigns > 0 
                      ? `Based on ${stats.completed_campaigns} successful campaigns`
                      : 'New sponsor ready to build great partnerships'
                    }
                  </p>
                  <Badge variant="secondary" className="w-fit">
                    {stats.completed_campaigns > 10 ? 'Premium Partner' : 
                     stats.completed_campaigns > 5 ? 'Trusted Partner' : 
                     stats.completed_campaigns > 0 ? 'Active Partner' : 'New Partner'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Story */}
          <div className="space-y-6">
            {profile.company_description && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    About {profile.company_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {profile.company_description}
                    </p>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Why Partner With Us?
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span>Reliable payment terms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span>Creative freedom</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span>Long-term partnerships</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span>Professional support</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isOwnProfile && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Ready to find creators?</h3>
                      <p className="text-muted-foreground text-sm">
                        Browse our marketplace of talented creators and start building partnerships.
                      </p>
                    </div>
                    <Button onClick={() => navigate('/sponsor-dashboard')} className="shrink-0">
                      Discover Creators
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Partnership Activity */}
        {isOwnProfile && offers.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Recent Partnership Activity
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/sponsor-dashboard')}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {offers.slice(0, 5).map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base">{offer.offer_title}</h4>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(offer.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {offer.offer_description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            ${(offer.offer_amount_cents / 100).toLocaleString()}
                          </span>
                        </div>
                        <Badge 
                          variant={offer.status === 'accepted' ? 'default' : 
                                 offer.status === 'rejected' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action for New Sponsors */}
        {isOwnProfile && offers.length === 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Ready to Start Partnering?</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Connect with talented creators and start building meaningful partnerships that drive results for your brand.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/sponsor-dashboard')} size="lg" className="text-base">
                    <Users className="h-5 w-5 mr-2" />
                    Discover Creators
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/campaigns')} className="text-base">
                    <Target className="h-5 w-5 mr-2" />
                    Browse Campaigns
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}