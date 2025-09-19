import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Globe, DollarSign, Lock } from "lucide-react";

interface SponsorProfileProps {
  existingProfile?: any;
  onProfileCreated?: () => void;
  onProfileUpdated?: () => void;
}

const industries = [
  "Technology", "Fashion & Beauty", "Food & Beverage", "Fitness & Health",
  "Gaming", "Travel", "Automotive", "Finance", "Entertainment", "Education",
  "Real Estate", "Retail", "Healthcare", "Sports", "Music", "Other"
];

export function SponsorProfile({ existingProfile, onProfileCreated, onProfileUpdated }: SponsorProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "",
    website_url: "",
    company_logo_url: "",
    company_description: "",
    budget_range_min: "",
    budget_range_max: "",
    email: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (existingProfile) {
        // Load sponsor profile data only - completely independent from user profiles
        setFormData({
          company_name: existingProfile.company_name || "",
          industry: existingProfile.industry || "",
          website_url: existingProfile.website_url || "",
          company_logo_url: existingProfile.company_logo_url || "",
          company_description: existingProfile.company_description || "",
          budget_range_min: existingProfile.budget_range_min?.toString() || "",
          budget_range_max: existingProfile.budget_range_max?.toString() || "",
          email: user?.email || ""
        });
      } else if (user) {
        // For new sponsor profiles, use auth user email directly
        setFormData(prev => ({
          ...prev,
          email: user.email || ""
        }));
      }
    };

    loadProfileData();
  }, [existingProfile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your profile.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if session is valid before saving
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Session Expired",
          description: "Please sign in again to save changes.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const profileData = {
        user_id: user.id,
        company_name: formData.company_name,
        industry: formData.industry,
        website_url: formData.website_url,
        company_logo_url: formData.company_logo_url,
        company_description: formData.company_description,
        budget_range_min: formData.budget_range_min ? parseInt(formData.budget_range_min) : null,
        budget_range_max: formData.budget_range_max ? parseInt(formData.budget_range_max) : null,
      };

      // Update sponsor profile first
      const { error: sponsorError } = existingProfile
        ? await supabase
            .from('sponsor_profiles')
            .update(profileData)
            .eq('id', existingProfile.id)
        : await supabase
            .from('sponsor_profiles')
            .insert([profileData]);

      if (sponsorError) throw sponsorError;

      // Update authentication email if changed
      if (formData.email && formData.email.trim() && formData.email.trim() !== user.email) {
        const { error: authEmailError } = await supabase.auth.updateUser({
          email: formData.email.trim()
        });

        if (authEmailError) {
          console.error('Error updating auth email:', authEmailError);
          let errorMessage = "Failed to update email address.";
          
          if (authEmailError.message.includes('already been registered')) {
            errorMessage = "This email is already registered with another account.";
          } else if (authEmailError.message.includes('rate limit')) {
            errorMessage = "Too many email update attempts. Please wait before trying again.";
          }
          
          toast({
            title: "Email Update Failed",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Email Update Confirmation",
            description: "A confirmation email has been sent to your new email address. Please check your inbox to complete the email change.",
            variant: "default"
          });
        }
      }

      toast({
        title: "Success!",
        description: existingProfile 
          ? "Sponsor profile updated successfully. Your company information has been saved." 
          : "Sponsor profile created successfully. You can now be discovered by creators.",
        variant: "default"
      });

      if (existingProfile && onProfileUpdated) {
        onProfileUpdated();
      } else if (!existingProfile && onProfileCreated) {
        onProfileCreated();
      }
    } catch (error) {
      console.error('Error saving sponsor profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to update your password.",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short", 
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Check for basic password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast({
        title: "Password Not Strong Enough",
        description: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        variant: "destructive"
      });
      return;
    }

    setPasswordLoading(true);
    try {
      // Check if session is valid before updating password
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Session Expired",
          description: "Please sign in again to update your password.",
          variant: "destructive"
        });
        setPasswordLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        if (error.message.includes('weak') || error.message.includes('pwned') || error.message.includes('easy to guess')) {
          toast({
            title: "Password Too Weak",
            description: "This password is too common or has been compromised. Please choose a unique password with uppercase, lowercase, numbers, and special characters.",
            variant: "destructive"
          });
        } else {
          console.error('Password update error:', error);
          let errorMessage = "Failed to update password. Please try again with a stronger password.";
          if (error.message?.includes('JWT') || error.message?.includes('session')) {
            errorMessage = "Your session has expired. Please sign in again.";
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Success!",
        description: "Password updated successfully"
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      let errorMessage = "Failed to update password. Please try again with a stronger password.";
      if (error.message?.includes('JWT') || error.message?.includes('session')) {
        errorMessage = "Your session has expired. Please sign in again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload a logo.",
        variant: "destructive"
      });
      return;
    }

    setUploadLoading(true);
    try {
      // Check if session is valid before uploading
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Session Expired",
          description: "Please sign in again to upload files.",
          variant: "destructive"
        });
        setUploadLoading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sponsor-logos')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('sponsor-logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, company_logo_url: publicUrl }));
      
      toast({
        title: "Success!",
        description: "Logo uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      
      let errorMessage = "Failed to upload logo. Please try again.";
      if (error.message?.includes('row-level security')) {
        errorMessage = "Authentication error. Please sign in again and try uploading.";
      } else if (error.message?.includes('JWT')) {
        errorMessage = "Your session has expired. Please sign in again.";
      }
      
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {existingProfile ? "Edit Sponsor Profile" : "Create Your Sponsor Profile"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  required
                  placeholder="Your company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="your-email@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  This email will be used for sign-in and communications
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select 
                  value={formData.industry} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://your-company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_logo">Company Logo</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="company_logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  {formData.company_logo_url && (
                    <img 
                      src={formData.company_logo_url} 
                      alt="Company logo preview" 
                      className="w-10 h-10 object-cover rounded border"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_range_min">Monthly Budget Range (Min) $</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget_range_min"
                    type="number"
                    value={formData.budget_range_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_range_min: e.target.value }))}
                    placeholder="1000"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_range_max">Monthly Budget Range (Max) $</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget_range_max"
                    type="number"
                    value={formData.budget_range_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_range_max: e.target.value }))}
                    placeholder="10000"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_description">Company Description</Label>
              <Textarea
                id="company_description"
                value={formData.company_description}
                onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
                placeholder="Tell creators about your company, your values, and what kind of partnerships you're looking for..."
                rows={4}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : existingProfile ? "Update Profile" : "Create Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Password Update Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Update Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter strong password (8+ chars, upper, lower, number)"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Password must contain: uppercase letter, lowercase letter, number, and be unique (not commonly used)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                required
                minLength={8}
              />
              {passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={passwordLoading || 
                       passwordData.newPassword !== passwordData.confirmPassword || 
                       !passwordData.newPassword ||
                       passwordData.newPassword.length < 8 ||
                       !/[A-Z]/.test(passwordData.newPassword) ||
                       !/[a-z]/.test(passwordData.newPassword) ||
                       !/\d/.test(passwordData.newPassword)} 
              className="w-full"
            >
              {passwordLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}