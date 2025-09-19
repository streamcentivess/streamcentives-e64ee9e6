import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, X, UserPlus, UserMinus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UserSearchAndManageProps {
  type: 'supporters' | 'haters';
  currentUsers: any[];
  onUserAdded: () => void;
  onUserRemoved: () => void;
}

export function UserSearchAndManage({ type, currentUsers, onUserAdded, onUserRemoved }: UserSearchAndManageProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_public_profiles', {
        search_query: query,
        limit_count: 10
      });
      
      if (error) throw error;
      
      // Filter out current user and already added users
      const currentUserIds = currentUsers.map(u => 
        u.user_id || u.supporter_id || u.hater_id || u.follower_id
      );
      const filteredResults = (data || []).filter(profile => 
        profile.user_id !== user?.id && 
        !currentUserIds.includes(profile.user_id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);
  
  const addUser = async (targetUserId: string) => {
    if (!user) return;
    
    try {
      if (type === 'supporters') {
        // Check if relationship already exists to avoid duplicate error
        const { data: existingFollow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('following_id', user.id)
          .single();
        
        if (existingFollow) {
          toast({
            title: "Already Added",
            description: "This user is already in your supporters",
            variant: "default"
          });
          return;
        }
        
        // Add as a follower relationship
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: targetUserId, following_id: user.id });
        if (error) throw error;
      } else {
        // For haters, we'd need a separate blocking mechanism
        // This would require a user_blocks table to be created
        toast({
          title: "Feature Coming Soon",
          description: "User blocking functionality will be available soon",
          variant: "default"
        });
        return;
      }
      
      toast({
        title: "Success",
        description: `User added to ${type}`,
      });
      
      setShowAddDialog(false);
      setSearchQuery("");
      setSearchResults([]);
      onUserAdded();
    } catch (error) {
      console.error(`Error adding to ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to add user to ${type}`,
        variant: "destructive"
      });
    }
  };
  
  const removeUser = async (targetUserId: string) => {
    if (!user) return;
    
    try {
      if (type === 'supporters') {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', targetUserId)
          .eq('following_id', user.id);
        if (error) throw error;
      } else {
        toast({
          title: "Feature Coming Soon", 
          description: "User unblocking functionality will be available soon",
          variant: "default"
        });
        return;
      }
      
      toast({
        title: "Success",
        description: `User removed from ${type}`,
      });
      
      onUserRemoved();
    } catch (error: any) {
      console.error(`Error removing from ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to remove user from ${type}`,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold capitalize">{type}</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User to {type}</DialogTitle>
              <DialogDescription>
                Search for users to add to your {type} list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {isSearching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((profile) => (
                    <Card key={profile.user_id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback>
                              {profile.display_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.display_name || profile.username}</p>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addUser(profile.user_id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Current Users List */}
      {currentUsers.length > 0 ? (
        <div className="space-y-3">
          {currentUsers.map((userEntry) => {
            console.log('Rendering user entry:', userEntry);
            const profile = userEntry.profiles;
            const userId = userEntry.supporter_id || userEntry.hater_id || userEntry.follower_id;
            
            return (
              <Card key={userId} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile?.display_name || profile?.username}</p>
                      <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(userEntry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => removeUser(userId)}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No {type} Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add users to your {type} list to better manage your community
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First User
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}