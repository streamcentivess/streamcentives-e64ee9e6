import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Square, Image as ImageIcon } from 'lucide-react';

export interface ImageFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  icon: React.ReactNode;
  category: 'social' | 'device' | 'print' | 'custom';
  description: string;
}

interface ImageFormatSelectorProps {
  selectedFormat: ImageFormat;
  onFormatChange: (format: ImageFormat) => void;
}

const IMAGE_FORMATS: ImageFormat[] = [
  // Social Media Formats
  {
    id: 'instagram-square',
    name: 'Instagram Square',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    icon: <Square className="h-4 w-4" />,
    category: 'social',
    description: 'Perfect for Instagram posts and profile pictures'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    icon: <Smartphone className="h-4 w-4" />,
    category: 'social',
    description: 'Vertical format for Instagram and TikTok stories'
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    icon: <Monitor className="h-4 w-4" />,
    category: 'social',
    description: 'Optimal for Facebook posts and link previews'
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    icon: <Monitor className="h-4 w-4" />,
    category: 'social',
    description: 'Widescreen format for Twitter posts'
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    icon: <Monitor className="h-4 w-4" />,
    category: 'social',
    description: 'Standard YouTube thumbnail size'
  },
  
  // Device Formats
  {
    id: 'iphone-wallpaper',
    name: 'iPhone Wallpaper',
    width: 1170,
    height: 2532,
    aspectRatio: '19.5:9',
    icon: <Smartphone className="h-4 w-4" />,
    category: 'device',
    description: 'iPhone 14 Pro wallpaper dimensions'
  },
  {
    id: 'ipad-wallpaper',
    name: 'iPad Wallpaper',
    width: 2048,
    height: 2732,
    aspectRatio: '4:3',
    icon: <Monitor className="h-4 w-4" />,
    category: 'device',
    description: 'iPad Pro wallpaper dimensions'
  },
  {
    id: 'desktop-wallpaper',
    name: 'Desktop Wallpaper',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    icon: <Monitor className="h-4 w-4" />,
    category: 'device',
    description: 'Full HD desktop wallpaper'
  },
  
  // Print Formats
  {
    id: 'print-poster',
    name: 'Print Poster',
    width: 2480,
    height: 3508,
    aspectRatio: 'A4',
    icon: <ImageIcon className="h-4 w-4" />,
    category: 'print',
    description: 'High resolution A4 poster format'
  },
  
  // Custom/Creative
  {
    id: 'wide-banner',
    name: 'Wide Banner',
    width: 1920,
    height: 500,
    aspectRatio: '3.84:1',
    icon: <Monitor className="h-4 w-4" />,
    category: 'custom',
    description: 'Ultra-wide banner format'
  }
];

export const ImageFormatSelector: React.FC<ImageFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'social': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'device': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'print': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'custom': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Image Format & Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="format-select">Choose Format</Label>
          <Select
            value={selectedFormat.id}
            onValueChange={(value) => {
              const format = IMAGE_FORMATS.find(f => f.id === value);
              if (format) onFormatChange(format);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select image format">
                <div className="flex items-center gap-2">
                  {selectedFormat.icon}
                  {selectedFormat.name}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {IMAGE_FORMATS.map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  <div className="flex items-center gap-2 w-full">
                    {format.icon}
                    <div className="flex-1">
                      <div className="font-medium">{format.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format.width} × {format.height} ({format.aspectRatio})
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={getCategoryColor(format.category)}
                    >
                      {format.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Format Details */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            {selectedFormat.icon}
            <span className="font-medium">{selectedFormat.name}</span>
            <Badge className={getCategoryColor(selectedFormat.category)}>
              {selectedFormat.category}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Dimensions: {selectedFormat.width} × {selectedFormat.height} pixels</div>
            <div>Aspect Ratio: {selectedFormat.aspectRatio}</div>
            <div>{selectedFormat.description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { IMAGE_FORMATS };