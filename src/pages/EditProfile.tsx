import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera, Settings, CreditCard, Lock, Bell, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import SettingsTab from '@/components/SettingsTab';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  creator_type?: string;
  spotify_connected: boolean;
  created_at: string;
}

const EditProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    email: '',
    creator_type: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      // Check if user signed up via OAuth (no password set)
      const signUpMethod = user.app_metadata?.provider;
      setIsOAuthUser(signUpMethod === 'spotify' || signUpMethod === 'google' || signUpMethod === 'facebook' || signUpMethod === 'apple');
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } else {
        setProfile(data);
        setFormData({
          display_name: data.display_name || '',
          username: data.username || '',
          bio: data.bio || '',
          email: user.email || '',
          creator_type: data.creator_type || ''
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      // Update profile data
       const { error: profileError } = await supabase
         .from('profiles')
         .update({
           display_name: formData.display_name,
           username: formData.username,
           bio: formData.bio,
           email: formData.email,
           creator_type: (formData.creator_type === '' ? null : formData.creator_type) as any
         })
         .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update email in auth if it changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) {
          throw new Error(`Profile updated but email change failed: ${emailError.message}`);
        }

        toast({
          title: "Email Verification Required",
          description: "Profile saved! Check your new email address to confirm the change."
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
      }
      
      const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle();
      if (profile?.username) {
        navigate(`/${profile.username}`);
      } else {
        navigate('/universal-profile');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : null);

      toast({
        title: "Success",
        description: "Profile photo updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both password fields match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Ensure we have a valid auth session
      let { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        // Try to refresh session once
        const { data: refreshed } = await supabase.auth.refreshSession();
        sessionData = refreshed;
      }

      if (!sessionData.session) {
        // No active session – fall back to secure email reset flow
        const emailToUse = formData.email || user?.email;
        if (!emailToUse) throw new Error('No email available for password reset');

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailToUse, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });

        if (resetError) throw resetError;

        toast({
          title: "Check your email",
          description: "We sent a secure link to set your password.",
        });
        setShowPasswordForm(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        return;
      }

      // We have a session – attempt direct password update
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        // If session-related error, fall back to email flow
        if (error.message?.toLowerCase().includes('session') || error.message?.toLowerCase().includes('auth')) {
          const emailToUse = formData.email || user?.email;
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailToUse!, {
            redirectTo: `${window.location.origin}/auth/callback`,
          });
          if (resetError) throw resetError;
          toast({
            title: "Verify via email",
            description: "We sent you a secure link to finish setting your password.",
          });
          setShowPasswordForm(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: isOAuthUser ? "Password set successfully! You can now sign in with your username/email and password." : "Password updated successfully!",
      });
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle();
              if (profile?.username) {
                navigate(`/${profile.username}`);
              } else {
                navigate('/universal-profile');
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>

        {/* Profile Photo Section */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-xl">
                    {formData.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <Label className="text-lg font-medium">Profile Photo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="card-modern">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Enter your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
              />
              <p className="text-xs text-muted-foreground">
                This email will be used for account recovery and can be used to sign in
              </p>
            </div>

            {/* Creator Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="creator-type">Creator Type</Label>
              <Select onValueChange={(value) => handleInputChange('creator_type', value)} value={formData.creator_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your creator type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="musician">🎵 Musician</SelectItem>
                  <SelectItem value="podcaster">🎙️ Podcaster</SelectItem>
                  <SelectItem value="video_creator">🎥 Video Creator</SelectItem>
                  <SelectItem value="comedian">😄 Comedian</SelectItem>
                  <SelectItem value="author">📚 Author</SelectItem>
                  <SelectItem value="artist">🎨 Visual Artist</SelectItem>
                  <SelectItem value="dancer">💃 Dancer</SelectItem>
                  <SelectItem value="gamer">🎮 Gamer</SelectItem>
                  <SelectItem value="fitness_trainer">💪 Fitness Trainer</SelectItem>
                  <SelectItem value="chef">👨‍🍳 Chef</SelectItem>
                  <SelectItem value="educator">🎓 Educator</SelectItem>
                  <SelectItem value="lifestyle_influencer">✨ Lifestyle Influencer</SelectItem>
                  <SelectItem value="tech_creator">💻 Tech Creator</SelectItem>
                  <SelectItem value="beauty_creator">💄 Beauty Creator</SelectItem>
                  <SelectItem value="travel_creator">✈️ Travel Creator</SelectItem>
                  <SelectItem value="other">🌟 Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Your creator type helps fans discover you in Streamseeker
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings with Tabs */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Manage your account, view purchases, and update preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <SettingsTab />
          </CardContent>
        </Card>

        {/* Password Management Section */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <Lock className="h-4 w-4 mr-2" />
              {isOAuthUser ? 'Set Password' : 'Change Password'}
            </Button>

          {/* Password Change Form */}
          {showPasswordForm && (
            <Card className="border-dashed mt-4">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">
                    {isOAuthUser ? 'Set Password for Your Account' : 'Change Password'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isOAuthUser 
                      ? 'Set a password so you can sign in with your username/email and password'
                      : 'Update your current password'
                    }
                  </p>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {!isOAuthUser && (
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{isOAuthUser ? 'Password' : 'New Password'}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder={isOAuthUser ? "Create a password (min 6 characters)" : "Enter new password (min 6 characters)"}
                      minLength={6}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                      required
                    />
                    {passwordForm.newPassword && passwordForm.confirmPassword && 
                     passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="text-sm text-destructive">Passwords do not match</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={saving || passwordForm.newPassword !== passwordForm.confirmPassword}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      {saving ? 'Setting...' : (isOAuthUser ? 'Set Password' : 'Update Password')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          </CardContent>
        </Card>

        {/* Delete Account Section */}
        <Card className="card-modern border-destructive/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, all your data will be permanently removed and cannot be recovered.
            </p>
            <DeleteAccountDialog />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-primary h-12 text-lg"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;