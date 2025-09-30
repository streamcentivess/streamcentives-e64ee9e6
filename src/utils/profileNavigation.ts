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

/**
 * Navigate to a brand profile using their slug
 * @param brandSlug - The brand slug
 * @returns The brand profile path
 */
export const getBrandProfilePath = (brandSlug: string): string => {
  return `/brand/${brandSlug}`;
};

/**
 * Fetch brand slug by user ID and return profile path
 * @param userId - The user ID
 * @returns The brand profile path with slug, or fallback with userId
 */
export const getBrandProfilePathByUserId = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('sponsor_profiles')
      .select('company_slug')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error || !data?.company_slug) {
      console.error('Error fetching brand slug for userId:', userId, error);
      // Fallback to query param for backwards compatibility
      return `/brand-profile?sponsor_id=${userId}`;
    }
    
    return getBrandProfilePath(data.company_slug);
  } catch (error) {
    console.error('Error in getBrandProfilePathByUserId:', error);
    return `/brand-profile?sponsor_id=${userId}`;
  }
};
