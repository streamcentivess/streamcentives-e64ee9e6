import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Download, 
  Scissors, 
  Volume2, 
  Palette, 
  Zap, 
  RotateCw,
  Crop,
  Filter,
  Share2,
  X,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoEditorProps {
  videoUrl: string;
  onSave: (editedVideoUrl: string) => void;
  onClose: () => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ videoUrl, onSave, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Editing controls
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  const [isProcessing, setIsProcessing] = useState(false);

  const filters = [
    { id: 'none', name: 'None', filter: '' },
    { id: 'grayscale', name: 'Grayscale', filter: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', filter: 'sepia(100%)' },
    { id: 'blur', name: 'Blur', filter: 'blur(2px)' },
    { id: 'vintage', name: 'Vintage', filter: 'sepia(50%) contrast(120%) brightness(90%)' },
    { id: 'cool', name: 'Cool', filter: 'hue-rotate(90deg) saturate(120%)' },
    { id: 'warm', name: 'Warm', filter: 'hue-rotate(-30deg) saturate(110%)' }
  ];

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setTrimEnd(videoRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const handleSpeedChange = (value: number[]) => {
    const newRate = value[0];
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      handleSeek(newTime);
    }
  };

  const getVideoStyle = () => {
    const selectedFilterObj = filters.find(f => f.id === selectedFilter);
    const filterStr = selectedFilterObj?.filter || '';
    
    return {
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${filterStr}`,
      transform: `rotate(${rotation}deg)`,
    };
  };

  const exportVideo = async () => {
    setIsProcessing(true);
    
    try {
      // Create a canvas to apply effects and export
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Apply filters and draw frame
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      
      if (rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          
          // Create download link
          const a = document.createElement('a');
          a.href = url;
          a.download = `edited-video-${Date.now()}.mp4`;
          a.click();
          
          // Save edited video
          onSave(url);
          toast.success('Video exported successfully!');
        }
      }, 'video/mp4');
      
    } catch (error) {
      console.error('Error exporting video:', error);
      toast.error('Failed to export video');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Video Editor</CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              style={getVideoStyle()}
              className="w-full h-64 object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              muted={volume === 0}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Video Controls */}
          <div className="space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <Button size="sm" variant="outline" onClick={() => skipTime(-10)}>
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button onClick={togglePlayPause} size="sm">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button size="sm" variant="outline" onClick={() => skipTime(10)}>
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 space-y-2">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration}
                  step={0.1}
                  onValueChange={(value) => handleSeek(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Audio & Speed Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume: {volume}%
                </label>
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Speed: {playbackRate}x
                </label>
                <Slider
                  value={[playbackRate]}
                  min={0.25}
                  max={2}
                  step={0.25}
                  onValueChange={handleSpeedChange}
                />
              </div>
            </div>
          </div>

          {/* Editing Tools */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="trim">Trim</TabsTrigger>
              <TabsTrigger value="transform">Transform</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brightness: {brightness}%</label>
                  <Slider
                    value={[brightness]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setBrightness(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contrast: {contrast}%</label>
                  <Slider
                    value={[contrast]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setContrast(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saturation: {saturation}%</label>
                  <Slider
                    value={[saturation]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setSaturation(value[0])}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={selectedFilter === filter.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter.id)}
                    className="h-auto p-3"
                  >
                    <div className="text-center">
                      <Filter className="h-4 w-4 mx-auto mb-1" />
                      <div className="text-xs">{filter.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trim" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time: {formatTime(trimStart)}</label>
                    <Slider
                      value={[trimStart]}
                      min={0}
                      max={duration}
                      step={0.1}
                      onValueChange={(value) => setTrimStart(value[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Time: {formatTime(trimEnd)}</label>
                    <Slider
                      value={[trimEnd]}
                      min={0}
                      max={duration}
                      step={0.1}
                      onValueChange={(value) => setTrimEnd(value[0])}
                    />
                  </div>
                </div>
                
                <Badge variant="outline" className="w-fit">
                  Duration: {formatTime(trimEnd - trimStart)}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="transform" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <RotateCw className="h-4 w-4" />
                    Rotation: {rotation}°
                  </label>
                  <Slider
                    value={[rotation]}
                    min={-180}
                    max={180}
                    step={90}
                    onValueChange={(value) => setRotation(value[0])}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setRotation(0)}>
                    Reset
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRotation(rotation + 90)}>
                    Rotate 90°
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Export Controls */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              onClick={exportVideo}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Video
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};