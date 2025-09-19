import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClickableMentions } from '@/components/ui/clickable-mentions';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, MessageCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SentimentAnalysis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [sentimentStats, setSentimentStats] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0,
    avgScore: 0
  });

  useEffect(() => {
    if (user) {
      fetchMessagesAndAnalysis();
    }
  }, [user, timeRange]);

  const fetchMessagesAndAnalysis = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Fetch messages received by the creator with analysis
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sentiment_score,
          flagged_content,
          flagged_reason,
          message_analysis (
            is_appropriate,
            confidence,
            flags
          )
        `)
        .eq('recipient_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Calculate sentiment statistics
      const validMessages = messagesData?.filter(msg => msg.sentiment_score !== null) || [];
      const totalMessages = validMessages.length;
      
      if (totalMessages > 0) {
        const positive = validMessages.filter(msg => msg.sentiment_score > 0.1).length;
        const negative = validMessages.filter(msg => msg.sentiment_score < -0.1).length;
        const neutral = totalMessages - positive - negative;
        const avgScore = validMessages.reduce((sum, msg) => sum + (msg.sentiment_score || 0), 0) / totalMessages;
        
        setSentimentStats({
          positive,
          neutral,
          negative,
          total: totalMessages,
          avgScore
        });
      } else {
        setSentimentStats({
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0,
          avgScore: 0
        });
      }

      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching sentiment analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (score: number | null) => {
    if (!score) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (score > 0.1) return <TrendingUp className="h-4 w-4 text-success" />;
    if (score < -0.1) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-warning" />;
  };

  const getSentimentLabel = (score: number | null) => {
    if (!score) return 'Unknown';
    if (score > 0.1) return 'Positive';
    if (score < -0.1) return 'Negative';
    return 'Neutral';
  };

  const getSentimentColor = (score: number | null) => {
    if (!score) return 'secondary';
    if (score > 0.1) return 'default';
    if (score < -0.1) return 'destructive';
    return 'secondary';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/creator-dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sentiment Analysis
            </h1>
            <p className="text-muted-foreground">Analyze the sentiment of messages from your fans</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{sentimentStats.total}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Positive</p>
                  <p className="text-2xl font-bold text-success">{sentimentStats.positive}</p>
                  <p className="text-xs text-muted-foreground">
                    {sentimentStats.total > 0 ? ((sentimentStats.positive / sentimentStats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Neutral</p>
                  <p className="text-2xl font-bold text-warning">{sentimentStats.neutral}</p>
                  <p className="text-xs text-muted-foreground">
                    {sentimentStats.total > 0 ? ((sentimentStats.neutral / sentimentStats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <Minus className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Negative</p>
                  <p className="text-2xl font-bold text-destructive">{sentimentStats.negative}</p>
                  <p className="text-xs text-muted-foreground">
                    {sentimentStats.total > 0 ? ((sentimentStats.negative / sentimentStats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">{sentimentStats.avgScore.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getSentimentLabel(sentimentStats.avgScore)}
                  </p>
                </div>
                {getSentimentIcon(sentimentStats.avgScore)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages List */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading sentiment analysis...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Messages Found</h3>
                <p className="text-sm text-muted-foreground">
                  No messages received in the selected time period
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="p-4 rounded-lg border bg-surface hover:bg-surface/80 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(message.sentiment_score)}
                        <Badge variant={getSentimentColor(message.sentiment_score) as any}>
                          {getSentimentLabel(message.sentiment_score)}
                        </Badge>
                        {message.sentiment_score !== null && (
                          <span className="text-xs text-muted-foreground">
                            {message.sentiment_score.toFixed(2)}
                          </span>
                        )}
                        {message.flagged_content && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <ClickableMentions text={message.content} className="text-sm leading-relaxed mb-2" />
                    {message.flagged_reason && (
                      <p className="text-xs text-destructive">Reason: {message.flagged_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-primary mb-2">Overall Sentiment</h4>
                <p className="text-muted-foreground">
                  {sentimentStats.total === 0 
                    ? 'No messages to analyze yet'
                    : sentimentStats.positive > sentimentStats.negative 
                      ? 'Your fans are expressing mostly positive sentiment! Keep up the great work.'
                      : sentimentStats.negative > sentimentStats.positive
                        ? 'Consider reaching out to address any concerns your fans might have.'
                        : 'Your fan sentiment is balanced. Great engagement overall!'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">Engagement Quality</h4>
                <p className="text-muted-foreground">
                  {sentimentStats.total < 10 
                    ? 'Build more engagement to get better insights'
                    : sentimentStats.avgScore > 0.2
                      ? 'Excellent! Your fans are highly engaged and positive.'
                      : sentimentStats.avgScore > -0.2
                        ? 'Good engagement levels with room for improvement.'
                        : 'Focus on creating more positive fan experiences.'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">Action Items</h4>
                <p className="text-muted-foreground">
                  {sentimentStats.negative > 0 
                    ? 'Review flagged messages and consider personalized responses.'
                    : sentimentStats.positive > 5
                      ? 'Great job! Consider featuring positive fan feedback.'
                      : 'Encourage more fan interaction through campaigns and rewards.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SentimentAnalysis;