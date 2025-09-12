import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  RotateCcw, 
  Sun, 
  Contrast, 
  Palette,
  Filter,
  Crop,
  Sparkles,
  Upload,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface PhotoEditorProps {
  initialImage?: string;
  onSave: (editedImages: string[]) => void;
  onPost?: (editedImages: string[]) => void;
  onClose: () => void;
}

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia: number;
  grayscale: number;
  invert: number;
}

const presetFilters = [
  { name: 'Original', settings: { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0, grayscale: 0, invert: 0 } },
  { name: 'Vintage', settings: { brightness: 110, contrast: 90, saturation: 80, hue: 20, blur: 0, sepia: 30, grayscale: 0, invert: 0 } },
  { name: 'B&W', settings: { brightness: 100, contrast: 120, saturation: 0, hue: 0, blur: 0, sepia: 0, grayscale: 100, invert: 0 } },
  { name: 'Warm', settings: { brightness: 105, contrast: 95, saturation: 110, hue: 15, blur: 0, sepia: 0, grayscale: 0, invert: 0 } },
  { name: 'Cool', settings: { brightness: 100, contrast: 105, saturation: 90, hue: -10, blur: 0, sepia: 0, grayscale: 0, invert: 0 } },
  { name: 'High Contrast', settings: { brightness: 100, contrast: 140, saturation: 120, hue: 0, blur: 0, sepia: 0, grayscale: 0, invert: 0 } },
  { name: 'Soft', settings: { brightness: 110, contrast: 85, saturation: 95, hue: 0, blur: 1, sepia: 0, grayscale: 0, invert: 0 } },
  { name: 'Drama', settings: { brightness: 90, contrast: 150, saturation: 130, hue: 0, blur: 0, sepia: 0, grayscale: 0, invert: 0 } }
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ initialImage, onSave, onPost, onClose }) => {
  const [images, setImages] = useState<string[]>(initialImage ? [initialImage] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filters, setFilters] = useState<FilterSettings>(presetFilters[0].settings);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (images.length > 0) {
      loadImageToCanvas(images[currentImageIndex]);
    }
  }, [images, currentImageIndex]);

  useEffect(() => {
    applyFilters();
  }, [filters]);

  const loadImageToCanvas = (imageSrc: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size to match image
      const maxWidth = 800;
      const maxHeight = 600;
      
      let { width, height } = img;
      
      // Scale down if too large
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Store original image reference
      originalImageRef.current = img;
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      applyFilters();
    };
    img.src = imageSrc;
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const originalImage = originalImageRef.current;
    
    if (!canvas || !ctx || !originalImage) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply CSS filters to the canvas context
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      hue-rotate(${filters.hue}deg)
      blur(${filters.blur}px)
      sepia(${filters.sepia}%)
      grayscale(${filters.grayscale}%)
      invert(${filters.invert}%)
    `;
    
    // Redraw the original image with filters applied
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    const newImageUrls: string[] = [];
    let loadedCount = 0;

    imageFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newImageUrls[index] = result;
        loadedCount++;
        
        if (loadedCount === imageFiles.length) {
          setImages(prev => [...prev, ...newImageUrls]);
          if (images.length === 0) {
            setCurrentImageIndex(0);
          }
          toast.success(`Added ${imageFiles.length} image(s)`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    if (images.length === 1) {
      toast.error('You need at least one image');
      return;
    }
    
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(newImages.length - 1);
    }
  };

  const applyPresetFilter = (preset: typeof presetFilters[0]) => {
    setFilters(preset.settings);
  };

  const updateFilter = (key: keyof FilterSettings, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(presetFilters[0].settings);
  };

  const processImages = async (): Promise<string[]> => {
    const editedImages: string[] = [];
    
    // Process each image
    for (let i = 0; i < images.length; i++) {
      // Load image into a temporary canvas
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) continue;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve) => {
        img.onload = () => {
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          
          // Apply filters
          tempCtx.filter = `
            brightness(${filters.brightness}%)
            contrast(${filters.contrast}%)
            saturate(${filters.saturation}%)
            hue-rotate(${filters.hue}deg)
            blur(${filters.blur}px)
            sepia(${filters.sepia}%)
            grayscale(${filters.grayscale}%)
            invert(${filters.invert}%)
          `;
          
          tempCtx.drawImage(img, 0, 0);
          
          // Convert to blob and create URL
          tempCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              editedImages.push(url);
            }
            resolve(void 0);
          }, 'image/jpeg', 0.9);
        };
        img.src = images[i];
      });
    }
    
    return editedImages;
  };

  const saveEditedImages = async () => {
    if (images.length === 0) {
      toast.error('No images to save');
      return;
    }

    setIsProcessing(true);
    
    try {
      const editedImages = await processImages();
      onSave(editedImages);
      toast.success('Images saved successfully!');
      
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images');
    } finally {
      setIsProcessing(false);
    }
  };

  const postEditedImages = async () => {
    if (images.length === 0) {
      toast.error('No images to post');
      return;
    }

    if (!onPost) {
      toast.error('Post functionality not available');
      return;
    }

    setIsProcessing(true);
    
    try {
      const editedImages = await processImages();
      onPost(editedImages);
      toast.success('Images posted successfully!');
      
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCurrentImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Image downloaded!');
    }, 'image/jpeg', 0.9);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Photo Editor
            {images.length > 1 && (
              <Badge variant="secondary">
                {currentImageIndex + 1} of {images.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Image Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCurrentImage}
                  disabled={images.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex justify-center bg-muted/20 rounded-lg p-4 min-h-[400px]">
              {images.length > 0 ? (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full border rounded"
                  style={{ maxHeight: '400px' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Upload className="h-12 w-12 mb-4" />
                  <p>Upload images to start editing</p>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative flex-shrink-0 cursor-pointer ${
                      index === currentImageIndex ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-6 overflow-auto">
            {/* Preset Filters */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Preset Filters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presetFilters.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPresetFilter(preset)}
                      className="text-xs"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Manual Adjustments */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Adjustments
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Brightness</label>
                    <Slider
                      value={[filters.brightness]}
                      onValueChange={([value]) => updateFilter('brightness', value)}
                      min={0}
                      max={200}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{filters.brightness}%</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Contrast</label>
                    <Slider
                      value={[filters.contrast]}
                      onValueChange={([value]) => updateFilter('contrast', value)}
                      min={0}
                      max={200}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{filters.contrast}%</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Saturation</label>
                    <Slider
                      value={[filters.saturation]}
                      onValueChange={([value]) => updateFilter('saturation', value)}
                      min={0}
                      max={200}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{filters.saturation}%</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Hue</label>
                    <Slider
                      value={[filters.hue]}
                      onValueChange={([value]) => updateFilter('hue', value)}
                      min={-180}
                      max={180}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{filters.hue}°</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Blur</label>
                    <Slider
                      value={[filters.blur]}
                      onValueChange={([value]) => updateFilter('blur', value)}
                      min={0}
                      max={10}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{filters.blur}px</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Sepia</label>
                    <Slider
                      value={[filters.sepia]}
                      onValueChange={([value]) => updateFilter('sepia', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{filters.sepia}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={saveEditedImages}
              disabled={images.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            {onPost && (
              <Button
                onClick={postEditedImages}
                disabled={images.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};