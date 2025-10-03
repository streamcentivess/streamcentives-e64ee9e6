import { LiveStream } from '@/hooks/useLiveStreams';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface LiveStreamCardProps {
  stream: LiveStream;
}

export const LiveStreamCard = ({ stream }: LiveStreamCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/live/${stream.id}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
      onClick={handleClick}
    >
      <div className="relative aspect-video bg-muted">
        {stream.thumbnail_url ? (
          <img 
            src={stream.thumbnail_url} 
            alt={stream.stream_title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Eye className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {stream.status === 'live' && (
          <Badge 
            className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 animate-pulse"
          >
            LIVE
          </Badge>
        )}

        {stream.status === 'live' && stream.viewer_count && (
          <Badge 
            variant="secondary"
            className="absolute top-2 right-2 bg-black/70 backdrop-blur"
          >
            <Eye className="h-3 w-3 mr-1" />
            {stream.viewer_count}
          </Badge>
        )}

        {stream.status === 'scheduled' && stream.scheduled_start_time && (
          <Badge 
            variant="secondary"
            className="absolute bottom-2 left-2 bg-black/70 backdrop-blur"
          >
            <Clock className="h-3 w-3 mr-1" />
            {new Date(stream.scheduled_start_time).toLocaleString()}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={stream.profile?.avatar_url} />
            <AvatarFallback>{stream.profile?.display_name?.[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{stream.stream_title}</h3>
            <p className="text-sm text-muted-foreground">
              {stream.profile?.display_name}
            </p>
            {stream.stream_description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {stream.stream_description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
