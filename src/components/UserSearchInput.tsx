import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';

interface User {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface UserSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onUserSelect: (user: User) => void;
  placeholder?: string;
}

export const UserSearchInput: React.FC<UserSearchInputProps> = ({
  value,
  onChange,
  onUserSelect,
  placeholder = "Search users..."
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .not('username', 'is', null)
        .limit(5);

      if (error) {
        console.error('Error searching users:', error);
        setUsers([]);
      } else {
        setUsers(data || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      searchUsers(newValue);
    }, 300);
  };

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    onChange(''); // Clear the input
    setShowSuggestions(false);
    setUsers([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <UserPlus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pl-10"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
        />
        
        {showSuggestions && users.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="px-3 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                onMouseDown={() => handleUserSelect(user)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url} alt={user.display_name || user.username} />
                    <AvatarFallback className="text-xs">
                      {(user.display_name || user.username)?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user.display_name || user.username}
                    </span>
                    {user.display_name && (
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};