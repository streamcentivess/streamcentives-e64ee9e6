import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Handshake } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import MessageCreator from "./MessageCreator";
import { SponsorOfferModal } from "./SponsorOfferModal";

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

interface SponsorContactOptionsProps {
  creator: Creator;
  recipientName: string;
}

export function SponsorContactOptions({ creator, recipientName }: SponsorContactOptionsProps) {
  const { role } = useUserRole();
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // If user is a sponsor, prioritize offering
  if (role === 'sponsor') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Choose how you'd like to contact {recipientName}:
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={() => setShowOfferModal(true)}
            className="bg-gradient-primary hover:opacity-90 h-12"
            size="lg"
          >
            <Handshake className="h-5 w-5 mr-2" />
            Send Sponsorship Offer
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowMessageModal(true)}
            size="lg"
            className="h-12"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Send Regular Message
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>💡 Tip: Sponsorship offers get priority attention from creators</p>
        </div>

        <SponsorOfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          creator={creator}
        />

        {showMessageModal && (
          <div className="mt-4">
            <MessageCreator 
              recipientId={creator.user_id} 
              recipientName={recipientName}
              onMessageSent={() => setShowMessageModal(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // For non-sponsors, show regular message interface
  return (
    <MessageCreator 
      recipientId={creator.user_id} 
      recipientName={recipientName}
    />
  );
}