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

// Manual trigger function (call only when needed)
export const executeXPUpdates = async (userId: string, userXPAmount: number, bulkXPAmount: number) => {
  console.log(`Updating user ${userId} XP to ${userXPAmount}...`);
  const userResult = await updateUserXP(userId, userXPAmount);
  console.log('User XP update result:', userResult);

  if (bulkXPAmount > 0) {
    // Wait a moment then update all users
    setTimeout(async () => {
      console.log(`Starting bulk update for all users to ${bulkXPAmount} XP...`);
      const bulkResult = await bulkUpdateAllUsersXP(bulkXPAmount);
      console.log('Bulk update result:', bulkResult);
    }, 2000);
  }
};