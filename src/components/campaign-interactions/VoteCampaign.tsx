import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Vote, Check, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VoteCampaignProps {
  campaign: any;
  onComplete: () => void;
}

export const VoteCampaign = ({ campaign, onComplete }: VoteCampaignProps) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [voting, setVoting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [pollData, setPollData] = useState<any>(null);
  const [voteResults, setVoteResults] = useState<any[]>([]);

  useEffect(() => {
    fetchPollData();
    fetchVoteResults();
  }, [campaign.id]);

  const fetchPollData = async () => {
    // Get poll data from campaign assets
    const { data } = await supabase
      .from('campaign_assets')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('asset_type', 'poll')
      .single();

    if (data) {
      setPollData(data.asset_data);
    } else {
      // Default poll if none exists
      setPollData({
        question: campaign.description || "What do you think?",
        options: ["Option A", "Option B", "Option C", "Option D"]
      });
    }
  };

  const fetchVoteResults = async () => {
    const { data } = await supabase
      .from('poll_votes')
      .select('poll_option')
      .eq('campaign_id', campaign.id);

    setVoteResults(data || []);
  };

  const handleVote = async () => {
    if (!selectedOption) {
      toast({
        title: "Selection Required",
        description: "Please select an option before voting",
        variant: "destructive"
      });
      return;
    }

    setVoting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Submit vote
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
          campaign_id: campaign.id,
          user_id: user.id,
          poll_option: selectedOption
        });

      if (voteError) throw voteError;

      // Complete campaign
      const { data, error } = await supabase.rpc('complete_campaign_interaction', {
        campaign_id_param: campaign.id,
        interaction_data_param: {
          type: 'vote',
          selected_option: selectedOption,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      const result = data as { success: boolean; xp_awarded: number; error?: string };
      if (result.success) {
        setCompleted(true);
        toast({
          title: "Vote Submitted!",
          description: `You've earned ${result.xp_awarded} XP for participating in this poll!`
        });
        fetchVoteResults();
        onComplete();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote",
        variant: "destructive"
      });
    } finally {
      setVoting(false);
    }
  };

  const getVoteCount = (option: string) => {
    return voteResults.filter(vote => vote.poll_option === option).length;
  };

  const getTotalVotes = () => {
    return voteResults.length;
  };

  if (completed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Vote Submitted!</h3>
          <p className="text-green-600">Thank you for participating in this poll!</p>
          
          {/* Show results after voting */}
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-green-800">Results:</h4>
            {pollData?.options.map((option: string) => {
              const votes = getVoteCount(option);
              const percentage = getTotalVotes() > 0 ? (votes / getTotalVotes() * 100).toFixed(1) : 0;
              
              return (
                <div key={option} className="flex justify-between items-center text-sm">
                  <span>{option}</span>
                  <span className="font-medium">{votes} votes ({percentage}%)</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pollData) {
    return <div className="animate-pulse">Loading poll...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Poll Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">{pollData.question}</h3>
            
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {pollData.options.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {getTotalVotes()} {getTotalVotes() === 1 ? 'vote' : 'votes'} so far
          </div>

          <Button 
            onClick={handleVote}
            disabled={voting || !selectedOption}
            className="w-full"
          >
            {voting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Vote className="h-4 w-4 mr-2" />
            )}
            Submit Vote & Complete Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};