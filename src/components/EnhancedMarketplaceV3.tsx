import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Eye, ShoppingCart, Tag, Filter, Search, Star, TrendingUp, Sparkles, Flame, Zap } from 'lucide-react';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileContainer, MobileCard } from '@/components/ui/mobile-container';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  xpPrice?: number;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  imageUrl: string;
  seller: string;
  views: number;
  watchers: number;
  featured: boolean;
  tags: string[];
}

const EnhancedMarketplaceV3 = () => {
  const { hapticImpact } = useMobileCapabilities();
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  const categories = [
    { id: 'all', name: 'All Categories', count: 24 },
    { id: 'music-equipment', name: 'Music Equipment', count: 8 },
    { id: 'concert-tickets', name: 'Concert Tickets', count: 6 },
    { id: 'merchandise', name: 'Merchandise', count: 5 },
    { id: 'collectibles', name: 'Collectibles', count: 3 },
    { id: 'digital-content', name: 'Digital Content', count: 2 }
  ];

  const items: MarketplaceItem[] = [
    {
      id: '1',
      title: 'Vintage Guitar Signed by Artist',
      description: 'Limited edition guitar with certificate of authenticity',
      price: 1500,
      xpPrice: 150000,
      category: 'music-equipment',
      condition: 'like_new',
      imageUrl: '/lovable-uploads/8cdc3579-a77c-42cf-8350-09d9f6c75009.png',
      seller: '@musicstar',
      views: 234,
      watchers: 12,
      featured: true,
      tags: ['signed', 'vintage', 'rare']
    },
    {
      id: '2',
      title: 'VIP Concert Meet & Greet',
      description: 'Exclusive backstage pass and photo opportunity',
      price: 299,
      category: 'concert-tickets',
      condition: 'new',
      imageUrl: '/lovable-uploads/5897885b-dc57-41a0-b75a-5fd38b676bad.png',
      seller: '@livemusic',
      views: 456,
      watchers: 28,
      featured: false,
      tags: ['vip', 'backstage', 'exclusive']
    }
  ];

  const handleMakeOffer = async (item: MarketplaceItem) => {
    await hapticImpact();
    setSelectedItem(item);
    setShowOfferDialog(true);
  };

  const handleSubmitOffer = async () => {
    await hapticImpact();
    toast.success('Offer submitted successfully!');
    setShowOfferDialog(false);
    setOfferAmount('');
    setOfferMessage('');
  };

  const handleWatchItem = async (itemId: string) => {
    await hapticImpact();
    toast.success('Added to watchlist');
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'text-green-600';
      case 'like_new': return 'text-blue-600';
      case 'good': return 'text-yellow-600';
      case 'fair': return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${isMobile ? 'space-y-4 pb-20 px-2' : 'space-y-6'} min-h-screen bg-gradient-to-br from-background via-surface to-background`}
    >
      {/* Hero Section - TikTok Style */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden hero-gradient py-8 text-center mb-6 rounded-3xl"
      >
        <div className="absolute inset-0 bg-grid-subtle opacity-20"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="flex items-center justify-center gap-3"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
            >
              <ShoppingCart className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-4xl font-black text-gradient-primary">
              Fan Marketplace
            </h1>
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.5
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center"
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg font-medium text-muted-foreground"
          >
            Discover exclusive treasures from your favorite creators 🛍️✨
          </motion.p>
        </div>
      </motion.div>

      <MobileContainer>
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >

      {/* Search and Filters */}
      <Card>
        <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${isMobile ? 'text-base' : ''}`}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  {isMobile ? category.name.split(' ')[0] : category.name}
                  <Badge variant="secondary" className="ml-1">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className={`flex ${isMobile ? 'flex-col' : ''} gap-2`}>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className={isMobile ? 'w-full' : 'w-40'}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="ending">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className={isMobile ? 'w-full' : ''}>
                <Filter className="h-4 w-4 mr-1" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Featured Items */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Featured Items
        </h2>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          {items.filter(item => item.featured).map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                {item.featured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
                    Featured
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80"
                  onClick={() => handleWatchItem(item.id)}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                    <div className="text-right">
                      <p className="font-bold text-lg">${item.price}</p>
                      {item.xpPrice && (
                        <p className="text-sm text-muted-foreground">
                          or {item.xpPrice.toLocaleString()} XP
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getConditionColor(item.condition)}>
                        {item.condition.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{item.seller}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {item.views}
                      <Heart className="h-4 w-4" />
                      {item.watchers}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleMakeOffer(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Make Offer
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Make Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className={isMobile ? 'w-[95vw] max-w-[95vw] h-auto max-h-[90vh] overflow-y-auto' : ''}>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <h3 className="font-medium">{selectedItem.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Listed at ${selectedItem.price}
                  </p>
                </div>
              </div>
              
              <Tabs defaultValue="cash" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cash">Cash Offer</TabsTrigger>
                  <TabsTrigger value="xp">XP Offer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cash" className="space-y-4">
                  <div>
                    <Label htmlFor="cash-offer">Your Offer ($)</Label>
                    <Input
                      id="cash-offer"
                      type="number"
                      placeholder="Enter your offer amount"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="xp" className="space-y-4">
                  <div>
                    <Label htmlFor="xp-offer">Your Offer (XP)</Label>
                    <Input
                      id="xp-offer"
                      type="number"
                      placeholder="Enter XP amount"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div>
                <Label htmlFor="offer-message">Message (Optional)</Label>
                <Textarea
                  id="offer-message"
                  placeholder="Add a personal message to your offer..."
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitOffer}
                  className="flex-1 bg-gradient-primary text-white"
                >
                  Submit Offer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowOfferDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </MobileContainer>
    </motion.div>
  );
};

export default EnhancedMarketplaceV3;