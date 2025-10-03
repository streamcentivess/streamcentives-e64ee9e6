import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { GiftAnimations } from './GiftAnimations';
import Hls from 'hls.js';

interface LiveStreamPlayerProps {
  streamUrl: string;
  streamId: string;
}

export function LiveStreamPlayer({ streamUrl, streamId }: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setError('Failed to start playback'));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError('Stream error occurred');
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setError('Failed to start playback'));
      });
    } else {
      setError('HLS is not supported in this browser');
    }
  }, [streamUrl]);

  return (
    <Card className="relative aspect-video bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted={false}
        controls
      />

      {/* Gift Animations Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <GiftAnimations streamId={streamId} />
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
          <p>{error}</p>
        </div>
      )}

      {!isPlaying && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </Card>
  );
}
