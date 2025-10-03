import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Hls from 'hls.js';

interface VODPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  onEnded?: () => void;
}

export function VODPlayer({ videoUrl, thumbnailUrl, title, onEnded }: VODPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS error:', data);
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
    }
  }, [videoUrl]);

  return (
    <Card className="relative aspect-video bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        poster={thumbnailUrl}
        onEnded={onEnded}
      >
        <source src={videoUrl} type="application/x-mpegURL" />
        Your browser does not support the video tag.
      </video>
    </Card>
  );
}
