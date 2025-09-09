import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'fan' | 'creator' | 'sponsor' | null>(null);
  
  const [profileData, setProfileData] = useState({
    username: '',
    display_name: '',
    age: '',
    bio: '',
    location: '',
    interests: ''
  });

  useEffect(() => {
    // Get selected role from sessionStorage
    const role = sessionStorage.getItem('selectedRole') as 'fan' | 'creator' | 'sponsor' | null;
    if (!role) {
      navigate('/role-selection');
      return;
    }
    setSelectedRole(role);
  }, [navigate]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted');
    console.log('User:', user);
    console.log('Selected role:', selectedRole);
    console.log('Profile data:', profileData);
    
    if (!user || !selectedRole) {
      console.error('Missing user or role');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting to save profile...');
      // Create or update profile using user_id as conflict target
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            username: profileData.username,
            display_name: profileData.display_name,
            bio: profileData.bio,
            age: profileData.age,
            location: profileData.location,
            interests: profileData.interests,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .maybeSingle();
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Error",
          description: `Failed to save profile: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Profile saved successfully, navigating...');
      
      // Clear the selected role from storage
      sessionStorage.removeItem('selectedRole');
      
      // Redirect based on role
      switch (selectedRole) {
        case 'fan':
          console.log('Redirecting to fan dashboard');
          navigate('/fan-dashboard');
          break;
        case 'creator':
          console.log('Redirecting to creator dashboard');
          navigate('/creator-dashboard');
          break;
        case 'sponsor':
          console.log('Redirecting to creator dashboard (sponsor)');
          // For now, redirect to creator dashboard as sponsor dashboard doesn't exist yet
          navigate('/creator-dashboard');
          break;
        default:
          console.log('Redirecting to universal profile');
          navigate('/universal-profile');
      }
      
      toast({
        title: "Profile Created!",
        description: "Welcome to Streamcentives!",
      });
      
    } catch (error) {
      console.error('Profile setup error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleSpecificFields = () => {
    switch (selectedRole) {
      case 'creator':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="genre">Music Genre</Label>
              <Input
                id="genre"
                placeholder="e.g., Hip-Hop, Pop, Rock"
                value={profileData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
              />
            </div>
          </>
        );
      case 'fan':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="interests">Favorite Genres</Label>
              <Input
                id="interests"
                placeholder="e.g., Hip-Hop, Pop, Electronic"
                value={profileData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
              />
            </div>
          </>
        );
      case 'sponsor':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Your company name"
                value={profileData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-modern">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/fc5c3f3a-25a8-47b8-a886-bbbfd21758e9.png" 
              alt="Streamcentives" 
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Set up your {selectedRole} profile to get started
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Choose a unique username"
                value={profileData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                placeholder="Your public display name"
                value={profileData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Select onValueChange={(value) => handleInputChange('age', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="13-17">13-17</SelectItem>
                  <SelectItem value="18-24">18-24</SelectItem>
                  <SelectItem value="25-34">25-34</SelectItem>
                  <SelectItem value="35-44">35-44</SelectItem>
                  <SelectItem value="45-54">45-54</SelectItem>
                  <SelectItem value="55+">55+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Country"
                value={profileData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
            
            {getRoleSpecificFields()}
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              disabled={loading || !profileData.username || !profileData.display_name || !profileData.age}
            >
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;