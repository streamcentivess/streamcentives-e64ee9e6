import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Target, Plus, FileText, Share, MessageSquare, BarChart3 } from "lucide-react";
import { AICampaignBuilder } from "@/components/AICampaignBuilder";
import { ContentAssistant } from "@/components/ContentAssistant";

interface CreatorToolsHubProps {
  userRole: 'creator' | 'fan' | 'sponsor';
  profile?: any;
}

export function CreatorToolsHub({ userRole, profile }: CreatorToolsHubProps) {
  const navigate = useNavigate();
  const [showAICampaignBuilder, setShowAICampaignBuilder] = useState(false);
  const [showContentAssistant, setShowContentAssistant] = useState(false);
  
  const getUpgradeButtonText = () => {
    switch (userRole) {
      case 'creator': return '🚀 Upgrade to Creator Pro';
      case 'fan': return '🚀 Upgrade to Creator Pro';
      case 'sponsor': return '🚀 Upgrade to Brand Pro';
      default: return '🚀 Upgrade to Pro';
    }
  };
  
  const getDescription = () => {
    switch (userRole) {
      case 'creator': return 'Access premium creator tools to enhance your content creation and fan engagement';
      case 'fan': return 'Unlock premium creator tools with a subscription to enhance your content creation';
      case 'sponsor': return 'Access premium creator tools with a subscription to enhance your brand content';
      default: return 'Access premium creator tools to enhance your content creation';
    }
  };
  
  return (
    <>
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-primary"></div>
            Creator Tools Hub
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {getDescription()}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={() => setShowAICampaignBuilder(true)}
            className="w-full justify-start bg-gradient-primary text-white hover:shadow-glow transition-all" 
          >
            <Target className="h-4 w-4 mr-2" />
            AI Campaign Builder
          </Button>
          <Button 
            onClick={() => setShowContentAssistant(true)}
            className="w-full justify-start" 
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Content Assistant
          </Button>
          <Button 
            onClick={() => navigate('/content-creator-studio')}
            className="w-full justify-start" 
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Content Studio
          </Button>
          <Button 
            onClick={() => navigate('/shoutout-generator')}
            className="w-full justify-start" 
            variant="outline"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Shoutout Generator
          </Button>
          <Button 
            onClick={() => navigate('/sentiment-analysis')}
            className="w-full justify-start" 
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Sentiment Analysis
          </Button>
          <Button 
            onClick={() => navigate('/social-integrations')}
            className="w-full justify-start" 
            variant="outline"
          >
            <Share className="h-4 w-4 mr-2" />
            Social Integrations
          </Button>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Subscribe to unlock all creator tools and features
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              onClick={() => navigate('/monetization-tools')}
            >
              {getUpgradeButtonText()}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Modals */}
      <AICampaignBuilder
        isOpen={showAICampaignBuilder} 
        onClose={() => setShowAICampaignBuilder(false)} 
      />
      
      {showContentAssistant && (
        <ContentAssistant 
          profile={profile}
          onClose={() => setShowContentAssistant(false)} 
        />
      )}
    </>
  );
}