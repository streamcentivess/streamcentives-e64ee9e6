import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, Crown, Shield, UserPlus, Settings, Eye, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  description?: string;
  slug: string;
  plan_type: string;
  settings: any;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    display_name: string;
    username: string;
    avatar_url?: string;
    email?: string;
  };
}

const OrganizationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    description: '',
    type: 'label'
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member'
  });

  // Mock data for demonstration
  const teamMetrics = [
    { label: 'Total Revenue', value: '$12,450', change: '+15%', trend: 'up' as const },
    { label: 'Active Campaigns', value: '24', change: '+8%', trend: 'up' as const },
    { label: 'Team XP Earned', value: '145K', change: '+22%', trend: 'up' as const },
    { label: 'Fan Engagement', value: '89%', change: '-2%', trend: 'down' as const }
  ];

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedOrg) {
      fetchMembers();
    }
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          organizations (
            id,
            name,
            description,
            slug,
            plan_type,
            settings,
            created_at
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const orgs = data?.map(item => item.organizations).filter(Boolean) || [];
      setOrganizations(orgs as Organization[]);
      
      if (orgs.length > 0 && !selectedOrg) {
        setSelectedOrg(orgs[0] as Organization);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!selectedOrg) return;

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role, joined_at')
        .eq('organization_id', selectedOrg.id);

      if (error) throw error;

      // For now, set members without profile data
      const membersWithMockProfiles = (data || []).map(member => ({
        ...member,
        profiles: {
          display_name: 'Team Member',
          username: `user_${member.user_id.slice(0, 8)}`,
          avatar_url: undefined,
          email: undefined
        }
      }));

      setMembers(membersWithMockProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const createOrganization = async () => {
    if (!newOrgForm.name.trim()) return;

    setIsCreating(true);
    try {
      // Generate slug from name
      const slug = newOrgForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: newOrgForm.name,
          description: newOrgForm.description,
          slug: slug,
          plan_type: newOrgForm.type,
          settings: {}
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user?.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      toast({
        title: "Organization created",
        description: `${newOrgForm.name} has been created successfully.`,
      });

      setNewOrgForm({ name: '', description: '', type: 'label' });
      setShowCreateDialog(false);
      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteForm.email.trim() || !selectedOrg) return;

    try {
      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', inviteForm.email)
        .single();

      if (profileError) {
        toast({
          title: "User not found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
        return;
      }

      // Add member
      const { error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: selectedOrg.id,
          user_id: profile.user_id,
          role: inviteForm.role
        });

      if (error) throw error;

      toast({
        title: "Member invited",
        description: `User has been added to ${selectedOrg.name}.`,
      });

      setInviteForm({ email: '', role: 'member' });
      setShowInviteDialog(false);
      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite member",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      });

      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'moderator':
        return <Eye className="h-4 w-4 text-green-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'moderator':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-600';
      case 'admin':
        return 'text-blue-600';
      case 'moderator':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'text-purple-600';
      case 'pro':
        return 'text-blue-600';
      default:
        return 'text-green-600';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading organizations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Organization Management</h2>
          <p className="text-muted-foreground">Manage your team and resources</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Building className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Set up a new organization to manage your team and resources.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={newOrgForm.name}
                  onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Music Label"
                />
              </div>
              <div>
                <Label htmlFor="org-description">Description</Label>
                <Textarea
                  id="org-description"
                  value={newOrgForm.description}
                  onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of your organization"
                />
              </div>
              <div>
                <Label htmlFor="org-type">Organization Type</Label>
                <Select value={newOrgForm.type} onValueChange={(value) => setNewOrgForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">Music Label</SelectItem>
                    <SelectItem value="agency">Talent Agency</SelectItem>
                    <SelectItem value="collective">Artist Collective</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={createOrganization}
                disabled={isCreating || !newOrgForm.name.trim()}
              >
                {isCreating ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Organizations</h3>
            <p className="text-muted-foreground mb-4">
              Create an organization to manage your team and collaborate effectively.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organization List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Organizations</CardTitle>
              <CardDescription>Select an organization to manage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedOrg?.id === org.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedOrg(org)}
                  >
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.plan_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Organization Details */}
          {selectedOrg && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedOrg.name}</CardTitle>
                      <CardDescription>{selectedOrg.description || 'No description provided'}</CardDescription>
                    </div>
                    <Badge variant="outline" className={getPlanColor(selectedOrg.plan_type)}>
                      {selectedOrg.plan_type}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
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
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Add a new member to {selectedOrg.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              value={inviteForm.email}
                              onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="user@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="invite-role">Role</Label>
                            <Select value={inviteForm.role} onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={inviteMember} disabled={!inviteForm.email.trim()}>
                            Send Invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                            {member.profiles?.avatar_url ? (
                              <img 
                                src={member.profiles.avatar_url} 
                                alt={member.profiles.display_name}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.profiles?.display_name || 'Unknown User'}</p>
                              {getRoleIcon(member.role)}
                            </div>
                            <p className="text-sm text-muted-foreground">@{member.profiles?.username}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getRoleBadgeVariant(member.role) as any}>
                            <span className={getRoleColor(member.role)}>{member.role}</span>
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
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No members yet</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Analytics Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Detailed organization analytics will be available soon.
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationManager;