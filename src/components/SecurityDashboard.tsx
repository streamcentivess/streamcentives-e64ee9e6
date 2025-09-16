import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Lock, 
  Smartphone, 
  MapPin,
  Clock,
  Activity
} from 'lucide-react';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';

interface SecurityEvent {
  id: string;
  type: 'login' | 'password_change' | 'suspicious_activity' | 'profile_update';
  description: string;
  timestamp: string;
  location: string;
  device: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  ipAddress: string;
}

const SecurityDashboard = () => {
  const { hapticImpact } = useMobileCapabilities();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const securityScore = 85;
  
  const recentEvents: SecurityEvent[] = [
    {
      id: '1',
      type: 'login',
      description: 'Successful login from new device',
      timestamp: '2 hours ago',
      location: 'New York, NY',
      device: 'iPhone 15 Pro',
      riskLevel: 'medium'
    },
    {
      id: '2',
      type: 'profile_update',
      description: 'Profile information updated',
      timestamp: '1 day ago',
      location: 'New York, NY',
      device: 'MacBook Pro',
      riskLevel: 'low'
    },
    {
      id: '3',
      type: 'password_change',
      description: 'Password successfully changed',
      timestamp: '3 days ago',
      location: 'New York, NY',
      device: 'MacBook Pro',
      riskLevel: 'low'
    }
  ];

  const activeSessions: ActiveSession[] = [
    {
      id: '1',
      device: 'iPhone 15 Pro (Current)',
      location: 'New York, NY',
      lastActive: 'Active now',
      current: true,
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      device: 'MacBook Pro',
      location: 'New York, NY',
      lastActive: '2 hours ago',
      current: false,
      ipAddress: '192.168.1.101'
    }
  ];

  const handleRevokeSession = async (sessionId: string) => {
    await hapticImpact();
    // Handle session revocation
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return Lock;
      case 'password_change': return Shield;
      case 'suspicious_activity': return AlertTriangle;
      case 'profile_update': return Eye;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-8 border-muted flex items-center justify-center">
                <span className="text-2xl font-bold">{securityScore}</span>
              </div>
              <div 
                className="absolute top-0 left-0 w-24 h-24 rounded-full border-8 border-green-500 border-t-transparent"
                style={{ 
                  transform: `rotate(${(securityScore / 100) * 360}deg)`,
                  borderTopColor: 'transparent'
                }}
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Good Security</h3>
              <p className="text-muted-foreground mb-2">
                Your account is well protected, but there's room for improvement.
              </p>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Strong password
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Two-factor authentication disabled
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Email verification enabled
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm">
                    Add an extra layer of security to your account
                  </p>
                  {!twoFactorEnabled && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Enable 2FA to improve your security score by 15 points
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of security events via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="login-alerts">Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert for logins from new devices
                  </p>
                </div>
                <Switch
                  id="login-alerts"
                  checked={loginAlerts}
                  onCheckedChange={setLoginAlerts}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event) => {
                  const Icon = getEventIcon(event.type);
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Icon className="h-5 w-5 mt-0.5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{event.description}</p>
                          <Badge 
                            variant="outline" 
                            className={getRiskColor(event.riskLevel)}
                          >
                            {event.riskLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.timestamp}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {event.device}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-5 w-5 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">{session.device}</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.lastActive}
                          </p>
                          <p>IP: {session.ipAddress}</p>
                        </div>
                      </div>
                    </div>
                    
                    {!session.current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke
                      </Button>
                    )}
                    
                    {session.current && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;