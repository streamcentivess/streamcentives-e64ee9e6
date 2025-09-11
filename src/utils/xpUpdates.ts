import { supabase } from '@/integrations/supabase/client';

export const updateUserXP = async (userId: string, xpAmount: number) => {
  try {
    const { data, error } = await supabase.functions.invoke('update-user-xp', {
      body: { userId, xpAmount }
    });

    if (error) {
      console.error('Error updating user XP:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error('Exception updating user XP:', error);
    return { success: false, error: error.message };
  }
};

export const bulkUpdateAllUsersXP = async (xpAmount: number) => {
  try {
    const { data, error } = await supabase.functions.invoke('bulk-update-xp', {
      body: { xpAmount }
    });

    if (error) {
      console.error('Error in bulk XP update:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error('Exception in bulk XP update:', error);
    return { success: false, error: error.message };
  }
};

// Auto-trigger functions
export const executeXPUpdates = async () => {
  // First update current user to 800 XP
  const currentUserId = 'bfc4f2d3-8bc7-4848-9fa7-fec4242f445e';
  
  console.log('Updating current user XP to 800...');
  const userResult = await updateUserXP(currentUserId, 800);
  console.log('User XP update result:', userResult);

  // Wait a moment then update all users to 1000 XP
  setTimeout(async () => {
    console.log('Starting bulk update for all users to 1000 XP...');
    const bulkResult = await bulkUpdateAllUsersXP(1000);
    console.log('Bulk update result:', bulkResult);
  }, 2000);
};