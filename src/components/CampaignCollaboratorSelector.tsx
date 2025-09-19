import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search, Users, Building2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Collaborator {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'creator' | 'sponsor' | 'collaborator';
}

interface CampaignCollaboratorSelectorProps {
  selectedCollaborators: Collaborator[];
  onCollaboratorsChange: (collaborators: Collaborator[]) => void;
  isEditMode?: boolean;
}

export const CampaignCollaboratorSelector: React.FC<CampaignCollaboratorSelectorProps> = ({
  selectedCollaborators,
  onCollaboratorsChange,
  isEditMode = false
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Collaborator[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      
      // Search regular profiles
      const { data: profileResults, error: profileError } = await supabase.rpc('search_public_profiles', {
        search_query: query,
        limit_count: 10
      });

      if (profileError) throw profileError;

      // Search sponsor profiles
      const { data: sponsorResults, error: sponsorError } = await supabase
        .from('sponsor_profiles')
        .select('user_id, company_name')
        .or(`company_name.ilike.%${query}%`)
        .limit(10);

      if (sponsorError) throw sponsorError;

      // Get profile info for sponsors
      const sponsorUserIds = sponsorResults?.map(s => s.user_id) || [];
      let sponsorProfiles: any[] = [];
      
      if (sponsorUserIds.length > 0) {
        const { data: sponsorProfileData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', sponsorUserIds);
        
        sponsorProfiles = (sponsorProfileData || []).map(profile => ({
          ...profile,
          role: 'sponsor' as const
        }));
      }

      // Combine results and determine roles
      const regularProfiles = (profileResults || []).map((profile: any) => ({
        user_id: profile.user_id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        role: profile.spotify_connected ? 'creator' as const : 'collaborator' as const
      }));

      // Merge and deduplicate
      const allResults = [...regularProfiles, ...sponsorProfiles];
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.user_id === result.user_id)
      );

      // Filter out current user and already selected collaborators
      const filteredResults = uniqueResults.filter(result => 
        result.user_id !== user?.id && 
        !selectedCollaborators.some(c => c.user_id === result.user_id)
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCollaborators]);

  const addCollaborator = (collaborator: Collaborator) => {
    const newCollaborators = [...selectedCollaborators, collaborator];
    onCollaboratorsChange(newCollaborators);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeCollaborator = (userId: string) => {
    const newCollaborators = selectedCollaborators.filter(c => c.user_id !== userId);
    onCollaboratorsChange(newCollaborators);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'creator':
        return <Users className="w-4 h-4" />;
      case 'sponsor':
        return <Building2 className="w-4 h-4" />;
      default:
        return <UserPlus className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'creator':
        return 'bg-primary/10 text-primary';
      case 'sponsor':
        return 'bg-blue-500/10 text-blue-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Campaign Collaborators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search creators, sponsors, or collaborators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                onClick={() => addCollaborator(user)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>
                      {user.display_name?.[0] || user.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {user.display_name || user.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{user.username}
                    </div>
                  </div>
                </div>
                <Badge className={getRoleColor(user.role)}>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(user.role)}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Selected Collaborators */}
        {selectedCollaborators.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Selected Collaborators ({selectedCollaborators.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCollaborators.map((collaborator) => (
                <div
                  key={collaborator.user_id}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg p-2"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={collaborator.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {collaborator.display_name?.[0] || collaborator.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {collaborator.display_name || collaborator.username}
                    </span>
                    <Badge className={`${getRoleColor(collaborator.role)} text-xs`}>
                      {getRoleIcon(collaborator.role)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCollaborator(collaborator.user_id)}
                    className="h-auto p-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <strong>Collaboration features:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Collaborators can help manage and promote the campaign</li>
            <li>• The campaign will appear in all collaborators' dashboards</li>
            <li>• Sponsors can co-create campaigns with creators</li>
            <li>• All collaborators receive notifications about campaign activity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};