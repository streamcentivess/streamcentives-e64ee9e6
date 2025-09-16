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
import { 
  Building, 
  Users, 
  Crown, 
  Shield, 
  UserPlus, 
  Settings,
  BarChart3,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  plan: 'basic' | 'pro' | 'enterprise';
  logo?: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  joinedAt: string;
  lastActive: string;
  avatar?: string;
}

interface TeamMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

const OrganizationManager = () => {
  const { hapticImpact } = useMobileCapabilities();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');

  const organizations: Organization[] = [
    {
      id: '1',
      name: 'StreamCentives Pro',
      slug: 'streamcentives-pro',
      memberCount: 8,
      plan: 'enterprise'
    },
    {
      id: '2',
      name: 'Independent Artists',
      slug: 'independent-artists',
      memberCount: 3,
      plan: 'pro'
    }
  ];

  const members: Member[] = [
    {
      id: '1',
      name: 'John Creator',
      email: 'john@example.com',
      role: 'owner',
      joinedAt: '6 months ago',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'Sarah Manager',
      email: 'sarah@example.com',
      role: 'admin',
      joinedAt: '4 months ago',
      lastActive: '1 day ago'
    },
    {
      id: '3',
      name: 'Mike Artist',
      email: 'mike@example.com',
      role: 'member',
      joinedAt: '2 months ago',
      lastActive: '3 hours ago'
    }
  ];

  const teamMetrics: TeamMetric[] = [
    { label: 'Total Revenue', value: '$12,450', change: '+15%', trend: 'up' },
    { label: 'Active Campaigns', value: '24', change: '+8%', trend: 'up' },
    { label: 'Team XP Earned', value: '145K', change: '+22%', trend: 'up' },
    { label: 'Fan Engagement', value: '89%', change: '-2%', trend: 'down' }
  ];

  const handleCreateOrg = async () => {
    await hapticImpact();
    toast.success('Organization created successfully!');
    setShowCreateDialog(false);
    setOrgName('');
    setOrgDescription('');
  };

  const handleInviteMember = async () => {
    await hapticImpact();
    toast.success('Invitation sent successfully!');
    setShowInviteDialog(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    await hapticImpact();
    toast.success('Member role updated successfully!');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return Shield;
      case 'manager': return Settings;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-600';
      case 'admin': return 'text-blue-600';
      case 'manager': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'text-purple-600';
      case 'pro': return 'text-blue-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage your teams and collaborations</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-white">
              <Building className="h-4 w-4 mr-1" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Enter organization name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="org-description">Description</Label>
                <Textarea
                  id="org-description"
                  placeholder="Describe your organization..."
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateOrg} className="flex-1">
                  Create Organization
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organizations List */}
      <div className="grid gap-4">
        {organizations.map((org) => (
          <Card key={org.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{org.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {org.memberCount} members
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getPlanColor(org.plan)}>
                    {org.plan}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedOrg(org)}
                  >
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organization Management */}
      {selectedOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedOrg.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {teamMetrics.map((metric, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{metric.label}</p>
                            <p className="text-xl font-bold">{metric.value}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            {metric.trend === 'up' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <Activity className="h-4 w-4 text-red-600" />
                            )}
                            <span className={metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                              {metric.change}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Team Members</h3>
                  
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleInviteMember} className="flex-1">
                            Send Invitation
                          </Button>
                          <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
                  {members.map((member) => {
                    const RoleIcon = getRoleIcon(member.role);
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              <RoleIcon className={`h-4 w-4 ${getRoleColor(member.role)}`} />
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {member.joinedAt} • Active {member.lastActive}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                          {member.role !== 'owner' && (
                            <Select 
                              value={member.role} 
                              onValueChange={(value) => handleChangeRole(member.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground">
                    Detailed team performance metrics and insights coming soon.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Organization Settings</h3>
                  <p className="text-muted-foreground">
                    Configure organization preferences and permissions.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizationManager;