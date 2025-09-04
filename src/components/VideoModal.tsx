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

  // Placeholder videos - you can replace these with your actual video URLs
  const videos = [
    {
      id: 1,
      title: "Platform Demo",
      thumbnail: "https://via.placeholder.com/320x180?text=Demo+Video+1",
      url: "https://www.w3schools.com/html/mov_bbb.mp4" // Sample video
    },
    {
      id: 2,
      title: "Fan Rewards System",
      thumbnail: "https://via.placeholder.com/320x180?text=Demo+Video+2", 
      url: "https://www.w3schools.com/html/movie.mp4" // Sample video
    },
    {
      id: 3,
      title: "Creator Dashboard",
      thumbnail: "https://via.placeholder.com/320x180?text=Demo+Video+3",
      url: "https://www.w3schools.com/html/mov_bbb.mp4" // Sample video
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
            Watch Streamcentives in Action
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-6 pt-0">
          {selectedVideo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {videos.find(v => v.url === selectedVideo)?.title}
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
                <video
                  key={selectedVideo}
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg"
                  src={selectedVideo}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {videos.map((video) => (
                <div 
                  key={video.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedVideo(video.url)}
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
          
          {!selectedVideo && (
            <div className="text-center mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                📁 <strong>Ready to add your videos?</strong> Replace the placeholder videos above with your actual demo content.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;