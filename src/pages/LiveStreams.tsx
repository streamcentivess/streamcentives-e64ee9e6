import { useState } from 'react';
import { Plus, ArrowLeft, Radio, Calendar, Clock } from 'lucide-react';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { LiveStreamCard } from '@/components/LiveStreamCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

const LiveStreams = () => {
  const navigate = useNavigate();
  const { streams: allStreams, loading: allLoading } = useLiveStreams();
  const { streams: liveStreams, loading: liveLoading } = useLiveStreams('live');
  const { streams: scheduledStreams, loading: scheduledLoading } = useLiveStreams('scheduled');

  const handleCreateStream = () => {
    navigate('/create-stream');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Live Streams</h1>
            </div>
            <Button onClick={handleCreateStream} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Go Live
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="all">
              <Radio className="h-4 w-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger value="live">
              <Radio className="h-4 w-4 mr-2 animate-pulse text-red-500" />
              Live Now
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              <Calendar className="h-4 w-4 mr-2" />
              Scheduled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {allLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading streams...</p>
              </div>
            ) : allStreams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No streams available</p>
                <Button onClick={handleCreateStream}>
                  Create your first stream
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allStreams.map((stream) => (
                  <LiveStreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="mt-6">
            {liveLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading live streams...</p>
              </div>
            ) : liveStreams.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No live streams right now</p>
                </div>
                <Button onClick={handleCreateStream} variant="outline">
                  Start a live stream
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveStreams.map((stream) => (
                  <LiveStreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            {scheduledLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading scheduled streams...</p>
              </div>
            ) : scheduledStreams.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No scheduled streams</p>
                </div>
                <Button onClick={handleCreateStream} variant="outline">
                  Schedule a stream
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledStreams.map((stream) => (
                  <LiveStreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LiveStreams;
