import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, Check, X, MessageCircle, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SponsorOffers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [formData, setFormData] = useState({
    creator_id: "",
    offer_title: "",
    offer_description: "",
    offer_amount_cents: "",
    campaign_duration_days: "",
    deliverables: "",
    terms: ""
  });

  useEffect(() => {
    if (user) {
      fetchOffers();
      fetchCreators();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_offers')
        .select(`
          *,
          profiles!sponsor_offers_creator_id_fkey (username, display_name, avatar_url)
        `)
        .eq('sponsor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      // Fetch creators who have campaigns or are active
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .not('username', 'is', null)
        .limit(100);

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);
    try {
      const deliverables = formData.deliverables
        .split('\n')
        .filter(d => d.trim())
        .map(d => d.trim());

      const { error } = await supabase
        .from('sponsor_offers')
        .insert([{
          sponsor_id: user.id,
          creator_id: formData.creator_id,
          offer_title: formData.offer_title,
          offer_description: formData.offer_description,
          offer_amount_cents: parseInt(formData.offer_amount_cents) * 100,
          campaign_duration_days: formData.campaign_duration_days ? parseInt(formData.campaign_duration_days) : null,
          deliverables: deliverables,
          terms: formData.terms
        }]);

      if (error) throw error;

      toast({
        title: "Offer sent!",
        description: "Your offer has been sent to the creator. They have 7 days to respond."
      });

      // Reset form and refresh offers
      setFormData({
        creator_id: "",
        offer_title: "",
        offer_description: "",
        offer_amount_cents: "",
        campaign_duration_days: "",
        deliverables: "",
        terms: ""
      });
      setShowCreateOffer(false);
      fetchOffers();
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <Check className="h-4 w-4" />;
      case 'declined': return <X className="h-4 w-4" />;
      case 'negotiating': return <MessageCircle className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'accepted': return 'default';
      case 'declined': return 'destructive';
      case 'negotiating': return 'secondary';
      case 'expired': return 'outline';
      default: return 'default';
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Offers</h2>
          <p className="text-muted-foreground">Manage your partnership offers to creators</p>
        </div>
        <Dialog open={showCreateOffer} onOpenChange={setShowCreateOffer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Send New Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Partnership Offer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creator_id">Select Creator *</Label>
                <Select value={formData.creator_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, creator_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a creator" />
                  </SelectTrigger>
                  <SelectContent>
                    {creators.map(creator => (
                      <SelectItem key={creator.user_id} value={creator.user_id}>
                        {creator.display_name || creator.username} (@{creator.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer_title">Campaign Title *</Label>
                <Input
                  id="offer_title"
                  value={formData.offer_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, offer_title: e.target.value }))}
                  placeholder="Summer Collection Promotion"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer_description">Campaign Description *</Label>
                <Textarea
                  id="offer_description"
                  value={formData.offer_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, offer_description: e.target.value }))}
                  placeholder="Describe your campaign, goals, and what you're looking for..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offer_amount_cents">Offer Amount ($) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="offer_amount_cents"
                      type="number"
                      value={formData.offer_amount_cents}
                      onChange={(e) => setFormData(prev => ({ ...prev, offer_amount_cents: e.target.value }))}
                      placeholder="500"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_duration_days">Duration (Days)</Label>
                  <Input
                    id="campaign_duration_days"
                    type="number"
                    value={formData.campaign_duration_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaign_duration_days: e.target.value }))}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliverables">Deliverables (one per line)</Label>
                <Textarea
                  id="deliverables"
                  value={formData.deliverables}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                  placeholder="2 Instagram posts&#10;1 Instagram Story&#10;1 YouTube mention"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Additional Terms</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Any specific requirements, timelines, or conditions..."
                  rows={3}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Your payment will be held in escrow until the creator responds. 
                  If they don't respond within 7 days, you'll receive a full refund.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateOffer(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Sending..." : "Send Offer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Offers List */}
      {offers.length > 0 ? (
        <div className="grid gap-4">
          {offers.map(offer => (
            <Card key={offer.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{offer.offer_title}</h3>
                      <Badge variant={getStatusColor(offer.status)} className="flex items-center gap-1">
                        {getStatusIcon(offer.status)}
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      To: @{offer.profiles?.username} • ${(offer.offer_amount_cents / 100).toLocaleString()}
                    </p>
                    <p className="text-sm">{offer.offer_description}</p>
                  </div>
                </div>
                
                {offer.deliverables && offer.deliverables.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Deliverables:</h4>
                    <ul className="text-sm text-muted-foreground">
                      {offer.deliverables.map((deliverable, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                  <span>Created {new Date(offer.created_at).toLocaleDateString()}</span>
                  {offer.expires_at && offer.status === 'pending' && (
                    <span>Expires {new Date(offer.expires_at).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No offers sent yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start building partnerships by sending offers to creators
            </p>
            <Button onClick={() => setShowCreateOffer(true)}>
              Send Your First Offer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}