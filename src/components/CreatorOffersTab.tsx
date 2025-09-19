import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Calendar, FileText, Check, X, Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Offer {
  id: string;
  sponsor_id: string;
  offer_title: string;
  offer_description: string;
  offer_amount_cents: number;
  campaign_duration_days?: number;
  deliverables: any[];
  terms?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at?: string;
  created_at: string;
  sponsor_profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export function CreatorOffersTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOffers();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('creator-offers-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sponsor_offers',
          filter: `creator_id=eq.${user.id}`
        },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchOffers = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('sponsor_offers')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sponsor profiles
      const offersWithProfiles = await Promise.all(
        (data || []).map(async (offer) => {
          const { data: profileResult } = await supabase.rpc('get_public_profile_safe', { 
            target_user_id: offer.sponsor_id 
          });
          const profile = profileResult?.[0];

          return {
            ...offer,
            sponsor_profile: profile || { username: 'unknown', display_name: 'Unknown Sponsor', avatar_url: null }
          } as Offer;
        })
      );

      setOffers(offersWithProfiles);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOfferResponse = async (offerId: string, response: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('sponsor_offers')
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .eq('creator_id', user?.id);

      if (error) throw error;

      // Update local state
      setOffers(prev => prev.map(offer => 
        offer.id === offerId 
          ? { ...offer, status: response }
          : offer
      ));

      // Create notification for sponsor
      const offer = offers.find(o => o.id === offerId);
      if (offer) {
        await supabase.rpc('create_notification', {
          user_id_param: offer.sponsor_id,
          type_param: 'offer_response',
          title_param: `Offer ${response}`,
          message_param: `${user?.user_metadata?.display_name || 'Creator'} ${response} your sponsorship offer`,
          data_param: {
            offer_id: offerId,
            creator_id: user?.id,
            response: response
          },
          priority_param: 'high'
        });
      }

      toast({
        title: "Offer Updated",
        description: `Offer ${response} successfully`
      });

      setShowOfferModal(false);
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'accepted': return 'default';
      case 'declined': return 'destructive';
      case 'expired': return 'outline';
      default: return 'secondary';
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sponsorship Offers</h3>
        <Badge variant="outline">{offers.length} total</Badge>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No offers yet</h3>
            <p className="text-muted-foreground">
              Sponsorship offers will appear here when brands reach out to you
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id} className={`${offer.status === 'pending' ? 'ring-2 ring-primary/20' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={offer.sponsor_profile?.avatar_url} />
                      <AvatarFallback>
                        {offer.sponsor_profile?.display_name?.[0] || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{offer.offer_title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        From: {offer.sponsor_profile?.display_name || 'Unknown Sponsor'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(offer.status)}>
                      {offer.status}
                    </Badge>
                    {isExpired(offer.expires_at) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{offer.offer_description}</p>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      ${(offer.offer_amount_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  {offer.campaign_duration_days && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{offer.campaign_duration_days} days</span>
                    </div>
                  )}
                  {offer.deliverables?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{offer.deliverables.length} deliverables</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Received {format(new Date(offer.created_at), 'MMM dd, yyyy')}
                    {offer.expires_at && (
                      <> • Expires {format(new Date(offer.expires_at), 'MMM dd, yyyy')}</>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setShowOfferModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {offer.status === 'pending' && !isExpired(offer.expires_at) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOfferResponse(offer.id, 'declined')}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleOfferResponse(offer.id, 'accepted')}
                          className="bg-gradient-primary hover:opacity-90"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Offer Details Modal */}
      {selectedOffer && (
        <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedOffer.offer_title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedOffer.sponsor_profile?.avatar_url} />
                  <AvatarFallback>
                    {selectedOffer.sponsor_profile?.display_name?.[0] || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedOffer.sponsor_profile?.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{selectedOffer.sponsor_profile?.username}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm leading-relaxed">{selectedOffer.offer_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Compensation</h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-lg">
                      ${(selectedOffer.offer_amount_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
                {selectedOffer.campaign_duration_days && (
                  <div>
                    <h4 className="font-semibold mb-2">Duration</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOffer.campaign_duration_days} days</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedOffer.deliverables?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Deliverables</h4>
                  <ul className="space-y-1">
                    {selectedOffer.deliverables.map((deliverable: any, index: number) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {deliverable.description || deliverable}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedOffer.terms && (
                <div>
                  <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                  <p className="text-sm leading-relaxed">{selectedOffer.terms}</p>
                </div>
              )}

              {selectedOffer.status === 'pending' && !isExpired(selectedOffer.expires_at) && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleOfferResponse(selectedOffer.id, 'declined')}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline Offer
                  </Button>
                  <Button
                    onClick={() => handleOfferResponse(selectedOffer.id, 'accepted')}
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept Offer
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}