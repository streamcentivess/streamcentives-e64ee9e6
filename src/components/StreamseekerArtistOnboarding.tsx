import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Circle, 
  ExternalLink, 
  Music, 
  User, 
  Link as LinkIcon, 
  Upload,
  BookOpen,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: any;
  weight: number;
}

interface ArtistProfile {
  eligibility_status: string;
  discovery_pool: string;
  profile_completion_score: number;
  total_discoveries: number;
  total_follows_from_discovery: number;
}

const StreamseekerArtistOnboarding = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'pro_registration',
      title: 'Professional Registration',
      description: 'Link your PRO (BMI, ASCAP) or distributor (TuneCore, DistroKid)',
      completed: false,
      icon: Award,
      weight: 25
    },
    {
      id: 'profile_complete',
      title: 'Complete Your Profile',
      description: 'Add profile picture, header, bio, and contact info',
      completed: false,
      icon: User,
      weight: 25
    },
    {
      id: 'social_media_linked',
      title: 'Link Social Media',
      description: 'Connect your active social media accounts',
      completed: false,
      icon: LinkIcon,
      weight: 25
    },
    {
      id: 'content_uploaded',
      title: 'Upload Content',
      description: 'Have at least 3 songs or videos on your profile',
      completed: false,
      icon: Upload,
      weight: 25
    }
  ]);

  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [proInfo, setProInfo] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);
  const { toast } = useToast();

  const fetchArtistProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get streamseeker artist profile
      const { data: artistData, error: artistError } = await supabase
        .from('streamseeker_artists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (artistData) {
        setArtistProfile(artistData);
      }

      // Get checklist status
      const { data: checklistData, error: checklistError } = await supabase
        .from('streamseeker_checklist')
        .select('*')
        .eq('artist_id', user.id)
        .single();

      if (checklistData) {
        setChecklist(prev => prev.map(item => ({
          ...item,
          completed: checklistData[item.id] || false
        })));
      }

      // Get profile data to check completion
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        const profileComplete = !!(
          profileData.avatar_url &&
          profileData.display_name &&
          profileData.bio
        );

        setChecklist(prev => prev.map(item => 
          item.id === 'profile_complete' 
            ? { ...item, completed: profileComplete }
            : item
        ));
      }

      // Get content count (mock - you'd replace with actual content tables)
      const contentCount = 0; // Replace with actual query
      setChecklist(prev => prev.map(item => 
        item.id === 'content_uploaded' 
          ? { ...item, completed: contentCount >= 3 }
          : item
      ));

    } catch (error) {
      console.error('Error fetching artist profile:', error);
    }
  };

  const updateChecklistItem = async (itemId: string, completed: boolean, additionalData?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update checklist in database
      const updateData = { [itemId]: completed };
      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      const { error } = await supabase
        .from('streamseeker_checklist')
        .upsert({
          artist_id: user.id,
          ...updateData
        });

      if (error) {
        console.error('Error updating checklist:', error);
        return;
      }

      // Update local state
      setChecklist(prev => prev.map(item => 
        item.id === itemId ? { ...item, completed } : item
      ));

      // Update artist eligibility
      const { data, error: eligibilityError } = await supabase
        .rpc('update_artist_eligibility', { artist_user_id: user.id });

      if (eligibilityError) {
        console.error('Error updating eligibility:', error);
      } else if (data) {
        const result = data as any;
        if (result.success) {
          toast({
            title: "Progress Updated!",
            description: `Eligibility status: ${result.status} (${result.score}/100)`,
            variant: "default"
          });
        }
      }

      // Refresh profile
      fetchArtistProfile();

    } catch (error) {
      console.error('Error in updateChecklistItem:', error);
    }
  };

  const handleProRegistration = async () => {
    if (!proInfo.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your PRO or distributor information",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    await updateChecklistItem('pro_registration', true, {
      pro_registration_info: { info: proInfo }
    });
    setLoading(false);
  };

  const handleSocialLinks = async () => {
    if (!socialLinks.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please provide your social media links",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    await updateChecklistItem('social_media_linked', true, {
      social_links: socialLinks.split(',').map(link => link.trim())
    });
    setLoading(false);
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const totalScore = checklist.reduce((sum, item) => sum + (item.completed ? item.weight : 0), 0);

  useEffect(() => {
    fetchArtistProfile();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Join Streamseeker
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete your artist checklist to get discovered by fans
        </p>
      </div>

      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Music className="h-6 w-6 text-primary" />
            Artist Eligibility Checklist
          </CardTitle>
          <p className="text-muted-foreground">
            Complete these steps to be eligible for discovery by fans on Streamseeker
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{completedCount}/4 completed</span>
            </div>
            <Progress value={(completedCount / 4) * 100} className="h-2" />
            <div className="flex justify-between text-sm">
              <span>Score: {totalScore}/100</span>
              {artistProfile && (
                <Badge variant={artistProfile.eligibility_status === 'approved' ? 'default' : 'secondary'}>
                  {artistProfile.eligibility_status}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artist Stats */}
      {artistProfile && artistProfile.total_discoveries > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Streamseeker Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{artistProfile.total_discoveries}</div>
                <div className="text-sm text-muted-foreground">Times Discovered</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{artistProfile.total_follows_from_discovery}</div>
                <div className="text-sm text-muted-foreground">Follows from Discovery</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {artistProfile.total_discoveries > 0 
                    ? Math.round((artistProfile.total_follows_from_discovery / artistProfile.total_discoveries) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Need Help Getting Started?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => setShowTutorials(!showTutorials)}
            className="mb-4"
          >
            {showTutorials ? 'Hide' : 'Show'} Tutorials & Resources
          </Button>
          
          {showTutorials && (
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <div>
                <h4 className="font-semibold">Performance Rights Organizations (PROs)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Register with a PRO to collect royalties for your music:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.bmi.com" target="_blank" rel="noopener noreferrer">
                      BMI <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.ascap.com" target="_blank" rel="noopener noreferrer">
                      ASCAP <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold">Music Distribution</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Get your music on streaming platforms:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.tunecore.com" target="_blank" rel="noopener noreferrer">
                      TuneCore <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://distrokid.com" target="_blank" rel="noopener noreferrer">
                      DistroKid <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-4">
        {checklist.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {item.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge variant="outline">{item.weight} pts</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                    
                    {/* Action Forms */}
                    {item.id === 'pro_registration' && !item.completed && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="pro-info">PRO/Distributor Information</Label>
                          <Textarea
                            id="pro-info"
                            placeholder="e.g., BMI IPI: 123456789, TuneCore Profile: username"
                            value={proInfo}
                            onChange={(e) => setProInfo(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleProRegistration} disabled={loading}>
                          {loading ? 'Saving...' : 'Save PRO Info'}
                        </Button>
                      </div>
                    )}
                    
                    {item.id === 'social_media_linked' && !item.completed && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="social-links">Social Media Links</Label>
                          <Input
                            id="social-links"
                            placeholder="Instagram, Twitter, TikTok URLs (comma separated)"
                            value={socialLinks}
                            onChange={(e) => setSocialLinks(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleSocialLinks} disabled={loading}>
                          {loading ? 'Saving...' : 'Save Social Links'}
                        </Button>
                      </div>
                    )}
                    
                    {item.id === 'profile_complete' && !item.completed && (
                      <Button variant="outline" asChild>
                        <a href="/edit-profile">
                          Complete Your Profile
                        </a>
                      </Button>
                    )}
                    
                    {item.id === 'content_uploaded' && !item.completed && (
                      <Button variant="outline" asChild>
                        <a href="/creator-dashboard">
                          Upload Your Content
                        </a>
                      </Button>
                    )}
                    
                    {item.completed && (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StreamseekerArtistOnboarding;