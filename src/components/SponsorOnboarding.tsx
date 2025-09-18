import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Building2, Globe, DollarSign, Target, ChevronRight, ChevronLeft } from "lucide-react";
import { WelcomeModal } from "@/components/WelcomeModal";

const industries = [
  "Technology", "Fashion & Beauty", "Food & Beverage", "Fitness & Health",
  "Gaming", "Travel", "Automotive", "Finance", "Entertainment", "Education",
  "Real Estate", "Retail", "Healthcare", "Sports", "Music", "Other"
];

const targetAudiences = [
  "Gen Z (18-24)", "Millennials (25-40)", "Gen X (41-56)", "Baby Boomers (57+)",
  "All Ages", "Teens (13-17)", "Young Adults (18-35)", "Adults (35-65)"
];

const partnershipGoals = [
  "Brand Awareness", "Product Launch", "Sales Growth", "Lead Generation",
  "Community Building", "Content Creation", "Event Promotion", "Influencer Relations"
];

export default function SponsorOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Company Info
    company_name: "",
    industry: "",
    website_url: "",
    company_logo_url: "",
    
    // Step 2: Budget & Goals
    budget_range_min: "",
    budget_range_max: "",
    target_audience: "",
    partnership_goals: [] as string[],
    
    // Step 3: Profile Details
    username: "",
    display_name: "",
    company_description: "",
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      partnership_goals: prev.partnership_goals.includes(goal)
        ? prev.partnership_goals.filter(g => g !== goal)
        : [...prev.partnership_goals, goal]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create/update profile
      const profileData = {
        user_id: user.id,
        username: formData.username,
        display_name: formData.display_name || formData.company_name,
        bio: formData.company_description,
        onboarding_completed: true
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileData]);

      if (profileError) throw profileError;

      // Create sponsor profile
      const sponsorData = {
        user_id: user.id,
        company_name: formData.company_name,
        industry: formData.industry,
        website_url: formData.website_url,
        company_logo_url: formData.company_logo_url,
        company_description: formData.company_description,
        budget_range_min: formData.budget_range_min ? parseInt(formData.budget_range_min) : null,
        budget_range_max: formData.budget_range_max ? parseInt(formData.budget_range_max) : null,
        target_audience: formData.target_audience,
        partnership_goals: formData.partnership_goals,
      };

      const { error: sponsorError } = await supabase
        .from('sponsor_profiles')
        .insert([sponsorData]);

      if (sponsorError) throw sponsorError;

      // Award initial XP
      await supabase
        .from('user_xp_balances')
        .insert([{
          user_id: user.id,
          current_xp: 250,
          total_earned_xp: 250
        }]);

      toast({
        title: "Welcome to StreamCentives!",
        description: "Your sponsor profile has been created successfully."
      });

      setShowWelcomeModal(true);
    } catch (error) {
      console.error('Error creating sponsor profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    navigate('/sponsor-profile');
    toast({
      title: "Profile setup complete!",
      description: "Welcome to your sponsor profile."
    });
  };

  const isStep1Valid = formData.company_name && formData.industry;
  const isStep2Valid = formData.budget_range_min && formData.target_audience;
  const isStep3Valid = formData.username && formData.company_description;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/lovable-uploads/streamcentivesloveable.PNG" 
                alt="StreamCentives Logo" 
                className="w-20 h-20 mx-auto rounded-full shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold mb-2">Sponsor Onboarding</h1>
            <p className="text-muted-foreground">Let's set up your sponsor profile to connect with creators</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 1 && (
                  <>
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    <Target className="h-5 w-5" />
                    Budget & Goals
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    <Globe className="h-5 w-5" />
                    Profile Details
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Company Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
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
                      <Label htmlFor="industry">Industry *</Label>
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
                      <Label htmlFor="company_logo_url">Company Logo URL</Label>
                      <Input
                        id="company_logo_url"
                        value={formData.company_logo_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_logo_url: e.target.value }))}
                        placeholder="https://your-logo-url.com/logo.png"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Budget & Goals */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget_min">Monthly Budget Min ($) *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="budget_min"
                            type="number"
                            value={formData.budget_range_min}
                            onChange={(e) => setFormData(prev => ({ ...prev, budget_range_min: e.target.value }))}
                            placeholder="1000"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget_max">Monthly Budget Max ($)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="budget_max"
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
                      <Label>Target Audience *</Label>
                      <Select 
                        value={formData.target_audience} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target audience" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetAudiences.map(audience => (
                            <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Partnership Goals (select all that apply)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {partnershipGoals.map(goal => (
                          <label
                            key={goal}
                            className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                              formData.partnership_goals.includes(goal)
                                ? 'bg-primary/10 border-primary'
                                : 'border-muted hover:bg-muted/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.partnership_goals.includes(goal)}
                              onChange={() => handleGoalToggle(goal)}
                              className="sr-only"
                            />
                            <span className="text-sm">{goal}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Profile Details */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                        placeholder="company_username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder={formData.company_name || "Your display name"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_description">Company Description *</Label>
                      <Textarea
                        id="company_description"
                        value={formData.company_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
                        placeholder="Tell creators about your company, values, and partnership opportunities..."
                        rows={4}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={handlePrev}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < totalSteps ? (
                    <Button 
                      type="button" 
                      onClick={handleNext}
                      disabled={
                        (currentStep === 1 && !isStep1Valid) ||
                        (currentStep === 2 && !isStep2Valid)
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={loading || !isStep3Valid}
                    >
                      {loading ? "Creating Profile..." : "Complete Setup"}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {showWelcomeModal && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={handleWelcomeModalClose}
          role="sponsor"
        />
      )}
    </>
  );
}