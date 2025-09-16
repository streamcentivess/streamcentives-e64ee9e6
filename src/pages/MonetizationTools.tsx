import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DollarSign, CreditCard, Bitcoin, Heart, TrendingUp, Plus, FileText, Crown, Gift } from 'lucide-react';

const MonetizationTools = () => {
  const { user } = useAuth();
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showAffiliateDialog, setShowAffiliateDialog] = useState(false);

  // Mock data
  const subscriptionTiers = [
    { id: 1, name: 'Fan Tier', price: 4.99, subscribers: 234, benefits: ['Early access', 'Monthly Q&A'], active: true },
    { id: 2, name: 'Super Fan', price: 9.99, subscribers: 156, benefits: ['All Fan Tier', 'Exclusive content', '1-on-1 chat'], active: true },
    { id: 3, name: 'VIP', price: 24.99, subscribers: 67, benefits: ['All previous', 'Video calls', 'Merchandise'], active: true }
  ];

  const tipDonations = [
    { id: 1, amount: 25.00, sender: 'MusicFan123', message: 'Love your latest track!', date: '2024-03-14' },
    { id: 2, amount: 10.00, sender: 'Anonymous', message: 'Keep making great music', date: '2024-03-14' },
    { id: 3, amount: 50.00, sender: 'SuperSupporter', message: 'Can\'t wait for the next album!', date: '2024-03-13' }
  ];

  const affiliatePrograms = [
    { id: 1, name: 'Music Gear Store', commission: 8.5, clicks: 234, conversions: 12, earnings: 156.78 },
    { id: 2, name: 'Streaming Platform', commission: 15.0, clicks: 89, conversions: 7, earnings: 98.50 }
  ];

  const cryptoWallets = [
    { currency: 'Bitcoin', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', balance: 0.00234, value: 98.45 },
    { currency: 'Ethereum', address: '0x742d35Cc6A' + 'f66665502D3C1d999E5', balance: 0.187, value: 245.67 }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Monetization Tools
            </h1>
            <p className="text-muted-foreground">Maximize your revenue with advanced monetization features</p>
          </div>
        </div>

        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="tips">Tips & Donations</TabsTrigger>
            <TabsTrigger value="affiliate">Affiliate Programs</TabsTrigger>
            <TabsTrigger value="crypto">Crypto Payments</TabsTrigger>
            <TabsTrigger value="tax">Tax Documents</TabsTrigger>
            <TabsTrigger value="multi-currency">Multi-Currency</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Subscription Tiers</h3>
              <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tier
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Subscription Tier</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tier-name">Tier Name</Label>
                      <Input id="tier-name" placeholder="Enter tier name" />
                    </div>
                    <div>
                      <Label htmlFor="tier-price">Monthly Price ($)</Label>
                      <Input id="tier-price" type="number" placeholder="4.99" />
                    </div>
                    <div>
                      <Label>Benefits (one per line)</Label>
                      <textarea 
                        className="w-full p-2 border rounded-md" 
                        rows={4} 
                        placeholder="Early access to content&#10;Monthly Q&A sessions&#10;Exclusive merchandise"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="max-subscribers" />
                      <Label htmlFor="max-subscribers">Limit subscribers</Label>
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">Create Tier</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {subscriptionTiers.map((tier) => (
                <Card key={tier.id} className="card-modern">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        {tier.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">${tier.price}/month</Badge>
                        <Badge variant={tier.active ? 'default' : 'outline'}>
                          {tier.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Subscribers</p>
                        <p className="text-2xl font-bold">{tier.subscribers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-success">
                          ${(tier.price * tier.subscribers).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Benefits</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tier.benefits.map((benefit, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="card-modern">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tips Today</p>
                      <p className="text-xl font-bold">$85.00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-modern">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-xl font-bold text-success">$1,234.56</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-modern">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Average Tip</p>
                      <p className="text-xl font-bold">$28.33</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Tips & Donations</h3>
              {tipDonations.map((tip) => (
                <Card key={tip.id} className="card-modern">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                          <Heart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">${tip.amount.toFixed(2)} from {tip.sender}</p>
                          <p className="text-sm text-muted-foreground">"{tip.message}"</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{tip.date}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="affiliate" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Affiliate Programs</h3>
              <Dialog open={showAffiliateDialog} onOpenChange={setShowAffiliateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Program
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Affiliate Program</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="program-name">Program Name</Label>
                      <Input id="program-name" placeholder="Enter program name" />
                    </div>
                    <div>
                      <Label htmlFor="product-url">Product URL</Label>
                      <Input id="product-url" placeholder="https://example.com/product" />
                    </div>
                    <div>
                      <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                      <Input id="commission-rate" type="number" placeholder="5.0" />
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">Add Program</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {affiliatePrograms.map((program) => (
                <Card key={program.id} className="card-modern">
                  <CardHeader>
                    <CardTitle>{program.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Commission</p>
                        <p className="text-lg font-bold">{program.commission}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Clicks</p>
                        <p className="text-lg font-bold">{program.clicks}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Conversions</p>
                        <p className="text-lg font-bold text-primary">{program.conversions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Earnings</p>
                        <p className="text-lg font-bold text-success">${program.earnings}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5" />
                  Cryptocurrency Wallets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cryptoWallets.map((wallet, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{wallet.currency}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 6)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{wallet.balance} {wallet.currency.substring(0, 3)}</p>
                        <p className="text-sm text-muted-foreground">${wallet.value}</p>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tax Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Download your tax documents and earnings reports for the current and previous tax years.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="bg-gradient-primary hover:opacity-90">
                      Generate 2024 1099
                    </Button>
                    <Button variant="outline">
                      Download 2023 Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="multi-currency" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Multi-Currency Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Accept payments in multiple currencies and automatically convert them to your preferred currency.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">$1,234.56</p>
                      <p className="text-sm text-muted-foreground">USD Revenue</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">€987.65</p>
                      <p className="text-sm text-muted-foreground">EUR Revenue</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">¥156,789</p>
                      <p className="text-sm text-muted-foreground">JPY Revenue</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MonetizationTools;