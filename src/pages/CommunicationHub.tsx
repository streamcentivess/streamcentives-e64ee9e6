import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Bell, Video, Calendar, Send, Plus, Users, Phone } from 'lucide-react';

const CommunicationHub = () => {
  const { user } = useAuth();
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [showStreamDialog, setShowStreamDialog] = useState(false);

  // Mock data
  const emailCampaigns = [
    { id: 1, name: 'Welcome Series', status: 'active', openRate: 24.5, clickRate: 3.2, sent: 1240 },
    { id: 2, name: 'Weekly Update', status: 'scheduled', openRate: 28.1, clickRate: 4.1, sent: 890 },
    { id: 3, name: 'Product Launch', status: 'draft', openRate: 0, clickRate: 0, sent: 0 }
  ];

  const smsCampaigns = [
    { id: 1, name: 'Live Stream Alert', status: 'sent', deliveryRate: 97.8, responses: 156, sent: 445 },
    { id: 2, name: 'New Release Notification', status: 'scheduled', deliveryRate: 0, responses: 0, sent: 0 }
  ];

  const liveStreams = [
    { id: 1, title: 'Q&A Session', platform: 'YouTube', scheduledTime: '2024-03-15 19:00', status: 'upcoming' },
    { id: 2, title: 'Behind the Scenes', platform: 'Twitch', scheduledTime: '2024-03-18 20:00', status: 'scheduled' }
  ];

  const pushNotifications = [
    { id: 1, title: 'New Campaign Live!', sent: '2 hours ago', clickRate: 12.3, recipients: 2340 },
    { id: 2, title: 'Weekly Rewards Available', sent: '1 day ago', clickRate: 8.7, recipients: 1890 }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Communication Hub
            </h1>
            <p className="text-muted-foreground">Manage all your fan communication in one place</p>
          </div>
        </div>

        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email">Email Marketing</TabsTrigger>
            <TabsTrigger value="sms">SMS Campaigns</TabsTrigger>
            <TabsTrigger value="push">Push Notifications</TabsTrigger>
            <TabsTrigger value="video">Video Messages</TabsTrigger>
            <TabsTrigger value="streaming">Live Streaming</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Email Campaigns</h3>
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Email Campaign</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input id="campaign-name" placeholder="Enter campaign name" />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input id="subject" placeholder="Enter email subject" />
                    </div>
                    <div>
                      <Label htmlFor="content">Email Content</Label>
                      <Textarea id="content" placeholder="Write your email content..." rows={6} />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1">Save Draft</Button>
                      <Button className="flex-1 bg-gradient-primary hover:opacity-90">Schedule</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {emailCampaigns.map((campaign) => (
                <Card key={campaign.id} className="card-modern">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {campaign.name}
                      </CardTitle>
                      <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'scheduled' ? 'secondary' : 'outline'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Sent</p>
                        <p className="text-xl font-bold">{campaign.sent.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <p className="text-xl font-bold text-primary">{campaign.openRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Click Rate</p>
                        <p className="text-xl font-bold text-success">{campaign.clickRate}%</p>
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

          <TabsContent value="sms" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">SMS Campaigns</h3>
              <Dialog open={showSMSDialog} onOpenChange={setShowSMSDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create SMS Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create SMS Campaign</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sms-name">Campaign Name</Label>
                      <Input id="sms-name" placeholder="Enter campaign name" />
                    </div>
                    <div>
                      <Label htmlFor="sms-content">Message Content</Label>
                      <Textarea id="sms-content" placeholder="Write your SMS message..." rows={4} maxLength={160} />
                      <p className="text-xs text-muted-foreground">160 characters max</p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1">Save Draft</Button>
                      <Button className="flex-1 bg-gradient-primary hover:opacity-90">Send Now</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {smsCampaigns.map((campaign) => (
                <Card key={campaign.id} className="card-modern">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        {campaign.name}
                      </CardTitle>
                      <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Sent</p>
                        <p className="text-xl font-bold">{campaign.sent.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Delivery Rate</p>
                        <p className="text-xl font-bold text-primary">{campaign.deliveryRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Responses</p>
                        <p className="text-xl font-bold text-success">{campaign.responses}</p>
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

          <TabsContent value="push" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Push Notifications</h3>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </div>

            <div className="grid gap-4">
              {pushNotifications.map((notification) => (
                <Card key={notification.id} className="card-modern">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent {notification.sent} • {notification.recipients.toLocaleString()} recipients
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Click Rate</p>
                        <p className="font-bold text-primary">{notification.clickRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Send personalized video messages to your fans. Perfect for special announcements, 
                  thank you messages, or exclusive content.
                </p>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Video className="h-4 w-4 mr-2" />
                  Record Video Message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streaming" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Live Streaming</h3>
              <Dialog open={showStreamDialog} onOpenChange={setShowStreamDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Stream
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Live Stream</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stream-title">Stream Title</Label>
                      <Input id="stream-title" placeholder="Enter stream title" />
                    </div>
                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="twitch">Twitch</SelectItem>
                          <SelectItem value="instagram">Instagram Live</SelectItem>
                          <SelectItem value="custom">Custom RTMP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="stream-description">Description</Label>
                      <Textarea id="stream-description" placeholder="Stream description..." />
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">Schedule Stream</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {liveStreams.map((stream) => (
                <Card key={stream.id} className="card-modern">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{stream.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {stream.platform} • {new Date(stream.scheduledTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={stream.status === 'upcoming' ? 'default' : 'secondary'}>
                        {stream.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunicationHub;