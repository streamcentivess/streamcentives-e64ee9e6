import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, DollarSign, Calendar, Target, Loader2 } from "lucide-react";

interface Creator {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  followerCount: number;
  engagementRate: number;
  offer_receiving_rate_cents?: number;
}

interface SponsorOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: Creator | null;
}

export function SponsorOfferModal({ isOpen, onClose, creator }: SponsorOfferModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    offerTitle: "",
    offerAmount: "",
    campaignDuration: "",
    description: "",
    deliverables: "",
    terms: ""
  });

  const offerRate = creator?.offer_receiving_rate_cents || 500; // Default $5.00
  const offerRateDisplay = (offerRate / 100).toFixed(2);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, DOC, or DOCX file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const uploadContractFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('sponsor-contracts')
      .upload(fileName, file);
      
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('sponsor-contracts')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !creator) return;
    
    // Validate required fields
    if (!formData.offerTitle || !formData.offerAmount || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, offer amount, and description",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let contractUrl = "";
      
      // Upload contract file if provided
      if (uploadedFile) {
        contractUrl = await uploadContractFile(uploadedFile);
      }
      
      // Prepare deliverables array
      const deliverables = formData.deliverables
        .split('\n')
        .filter(item => item.trim())
        .map(item => ({ description: item.trim() }));

      // Create the sponsor offer
      const { error: offerError } = await supabase
        .from('sponsor_offers')
        .insert({
          sponsor_id: user.id,
          creator_id: creator.user_id,
          offer_title: formData.offerTitle,
          offer_description: formData.description,
          offer_amount_cents: parseInt(formData.offerAmount) * 100,
          campaign_duration_days: formData.campaignDuration ? parseInt(formData.campaignDuration) : null,
          deliverables,
          terms: formData.terms,
          status: 'pending'
        });

      if (offerError) throw offerError;

      // Simulate payment processing for offer fee
      // In a real app, you would integrate with Stripe or another payment processor
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create notification for creator
      await supabase.rpc('create_notification', {
        user_id_param: creator.user_id,
        type_param: 'sponsor_offer',
        title_param: 'New Sponsor Offer',
        message_param: `${formData.offerTitle} - $${formData.offerAmount}`,
        data_param: {
          sponsor_id: user.id,
          offer_amount: formData.offerAmount,
          contract_url: contractUrl
        }
      });

      toast({
        title: "Offer Sent Successfully!",
        description: `Your offer has been sent to ${creator.display_name || creator.username}. You paid $${offerRateDisplay} for delivery.`
      });

      onClose();
      
      // Reset form
      setFormData({
        offerTitle: "",
        offerAmount: "",
        campaignDuration: "",
        description: "",
        deliverables: "",
        terms: ""
      });
      setUploadedFile(null);
      
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error Sending Offer",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!creator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Offer to Creator</DialogTitle>
          <DialogDescription>
            Create and send a sponsorship offer. A fee of ${offerRateDisplay} will be charged to deliver your offer.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creator Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Creator Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback>
                      {creator.display_name?.[0] || creator.username?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{creator.display_name || creator.username}</h3>
                    <p className="text-sm text-muted-foreground">@{creator.username}</p>
                  </div>
                </div>
                
                {creator.bio && (
                  <p className="text-sm text-muted-foreground">{creator.bio}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Followers:</span>
                    <span className="font-medium">{creator.followerCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Engagement:</span>
                    <span className="font-medium">{creator.engagementRate}%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>Offer Fee: <strong>${offerRateDisplay}</strong></span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This fee goes to the creator for reviewing your offer
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Offer Creation Form */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="manual" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Upload Contract</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offerTitle">Offer Title *</Label>
                    <Input
                      id="offerTitle"
                      value={formData.offerTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, offerTitle: e.target.value }))}
                      placeholder="Brand Partnership for Summer Campaign"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="offerAmount">Offer Amount (USD) *</Label>
                    <Input
                      id="offerAmount"
                      type="number"
                      value={formData.offerAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, offerAmount: e.target.value }))}
                      placeholder="5000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campaignDuration">Campaign Duration (days)</Label>
                    <Input
                      id="campaignDuration"
                      type="number"
                      value={formData.campaignDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, campaignDuration: e.target.value }))}
                      placeholder="30"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Campaign Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your campaign goals, target audience, and key messaging..."
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deliverables">Deliverables (one per line)</Label>
                  <Textarea
                    id="deliverables"
                    value={formData.deliverables}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                    placeholder={`2 Instagram posts\n1 Instagram story\n1 YouTube video mention`}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="terms">Additional Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    placeholder="Any specific requirements, usage rights, exclusivity clauses..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    {uploadedFile ? (
                      <div className="space-y-3">
                        <FileText className="h-12 w-12 text-green-600 mx-auto" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setUploadedFile(null)}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="font-medium">Upload Contract Document</p>
                          <p className="text-sm text-muted-foreground">
                            PDF, DOC, or DOCX up to 10MB
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => document.getElementById('contractFile')?.click()}>
                          Choose File
                        </Button>
                        <input
                          id="contractFile"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractTitle">Contract Title *</Label>
                      <Input
                        id="contractTitle"
                        value={formData.offerTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, offerTitle: e.target.value }))}
                        placeholder="Brand Partnership Agreement"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contractAmount">Offer Amount (USD) *</Label>
                      <Input
                        id="contractAmount"
                        type="number"
                        value={formData.offerAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, offerAmount: e.target.value }))}
                        placeholder="5000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contractDescription">Brief Description *</Label>
                    <Textarea
                      id="contractDescription"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief summary of the contract terms and expectations..."
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Total Cost: <strong>${offerRateDisplay}</strong> (delivery fee)
              </div>
              <div className="space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send Offer & Pay ${offerRateDisplay}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}