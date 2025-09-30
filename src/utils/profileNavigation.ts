import { supabase } from '@/integrations/supabase/client';

/**
 * Navigate to a user profile using their username
 * @param username - The username to navigate to
 * @returns The navigation path
 */
export const getProfilePath = (username: string): string => {
  return `/${username}`;
};

/**
 * Fetch username by user ID and return profile path
 * @param userId - The user ID
 * @returns The profile path with username, or fallback with userId
 */
export const getProfilePathByUserId = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error || !data?.username) {
      console.error('Error fetching username for userId:', userId, error);
      // Fallback to query param for backwards compatibility
      return `/universal-profile?userId=${userId}`;
    }
    
    return getProfilePath(data.username);
  } catch (error) {
    console.error('Error in getProfilePathByUserId:', error);
    return `/universal-profile?userId=${userId}`;
  }
};
