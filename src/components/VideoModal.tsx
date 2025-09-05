import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";

interface VideoModalProps {
  children: React.ReactNode;
}

const VideoModal = ({ children }: VideoModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // YouTube videos - paste your YouTube embed URLs here
  const videos = [
    {
      id: 1,
      title: "Marketing Video", // Update this title to match your video
      thumbnail: "https://img.youtube.com/vi/38arSmCyHxY/maxresdefault.jpg",
      embedUrl: "https://www.youtube.com/embed/38arSmCyHxY",
      type: "youtube"
    },
    {
      id: 2,
      title: "More marketing vids until we get a budget",
      thumbnail: "https://img.youtube.com/vi/KK_vHOMlQbc/maxresdefault.jpg",
      embedUrl: "https://www.youtube.com/embed/KK_vHOMlQbc",
      type: "youtube"
    },
    {
      id: 4,
      title: "Streamcentives Logo",
      thumbnail: "https://img.youtube.com/vi/sSGxzzDK_y0/maxresdefault.jpg",
      embedUrl: "https://www.youtube.com/embed/sSGxzzDK_y0",
      type: "youtube"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-center">
            Are you creative? Great at marketing? We want YOU !!! Come work with us at Streamcentives send portfolios to Meco@Streamcentives.io or tag us in your work on instagram @streamcentives
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-6 pt-0">
          {selectedVideo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {videos.find(v => v.embedUrl === selectedVideo)?.title}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedVideo(null)}
                >
                  <X className="w-4 h-4" />
                  Back to Gallery
                </Button>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  key={selectedVideo}
                  src={selectedVideo}
                  title="Video Player"
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {videos.map((video) => (
                <div 
                  key={video.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedVideo(video.embedUrl)}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white transition-colors">
                        <Play className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <h4 className="mt-2 font-semibold text-center">{video.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;