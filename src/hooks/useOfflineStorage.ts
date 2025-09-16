import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OfflineData {
  id: string;
  type: 'campaign' | 'message' | 'xp_transaction' | 'user_action';
  data: any;
  timestamp: number;
  synced: boolean;
}

interface CachedData {
  campaigns: any[];
  userProfile: any;
  xpBalance: number;
  lastSync: number;
}

const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'streamcentives_offline_queue',
  CACHED_DATA: 'streamcentives_cached_data',
  LAST_SYNC: 'streamcentives_last_sync'
};

export const useOfflineStorage = () => {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [cachedData, setCachedData] = useState<CachedData | null>(null);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineData();
    };
    
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached data on mount
    loadCachedData();
    updateQueueSize();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_DATA);
      if (cached) {
        setCachedData(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }, []);

  const updateQueueSize = useCallback(() => {
    try {
      const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const items = queue ? JSON.parse(queue) : [];
      setQueueSize(items.filter((item: OfflineData) => !item.synced).length);
    } catch (error) {
      console.error('Error updating queue size:', error);
    }
  }, []);

  const addToOfflineQueue = useCallback((type: OfflineData['type'], data: any) => {
    try {
      const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const items: OfflineData[] = queue ? JSON.parse(queue) : [];
      
      const newItem: OfflineData = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        synced: false
      };
      
      items.push(newItem);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(items));
      updateQueueSize();
      
      console.log('Added to offline queue:', newItem);
      return newItem.id;
    } catch (error) {
      console.error('Error adding to offline queue:', error);
      return null;
    }
  }, [updateQueueSize]);

  const cacheData = useCallback((key: keyof CachedData, data: any) => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_DATA);
      const currentCache: CachedData = cached ? JSON.parse(cached) : {
        campaigns: [],
        userProfile: null,
        xpBalance: 0,
        lastSync: 0
      };
      
      currentCache[key] = data;
      currentCache.lastSync = Date.now();
      
      localStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(currentCache));
      setCachedData(currentCache);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  const getCachedData = useCallback((key: keyof CachedData) => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_DATA);
      if (cached) {
        const data: CachedData = JSON.parse(cached);
        return data[key];
      }
      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine || !user) return;

    try {
      const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const items: OfflineData[] = queue ? JSON.parse(queue) : [];
      const unsyncedItems = items.filter(item => !item.synced);

      if (unsyncedItems.length === 0) return;

      console.log(`Syncing ${unsyncedItems.length} offline items...`);

      for (const item of unsyncedItems) {
        try {
          await syncItem(item);
          
          // Mark as synced
          const updatedItems = items.map(i => 
            i.id === item.id ? { ...i, synced: true } : i
          );
          localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedItems));
          
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          // Continue with other items
        }
      }

      updateQueueSize();
      console.log('Offline sync completed');
      
    } catch (error) {
      console.error('Error during offline sync:', error);
    }
  }, [user, updateQueueSize]);

  const syncItem = async (item: OfflineData) => {
    // This would integrate with your actual API calls
    // For now, we'll simulate the sync process
    
    switch (item.type) {
      case 'campaign':
        // Sync campaign interactions
        console.log('Syncing campaign data:', item.data);
        break;
        
      case 'message':
        // Sync message sending
        console.log('Syncing message data:', item.data);
        break;
        
      case 'xp_transaction':
        // Sync XP transactions
        console.log('Syncing XP transaction:', item.data);
        break;
        
      case 'user_action':
        // Sync user actions (likes, shares, etc.)
        console.log('Syncing user action:', item.data);
        break;
        
      default:
        console.warn('Unknown sync item type:', item.type);
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const clearSyncedItems = useCallback(() => {
    try {
      const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const items: OfflineData[] = queue ? JSON.parse(queue) : [];
      const unsyncedItems = items.filter(item => !item.synced);
      
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(unsyncedItems));
      updateQueueSize();
    } catch (error) {
      console.error('Error clearing synced items:', error);
    }
  }, [updateQueueSize]);

  const clearAllData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
      localStorage.removeItem(STORAGE_KEYS.CACHED_DATA);
      localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      
      setQueueSize(0);
      setCachedData(null);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }, []);

  return {
    isOffline,
    queueSize,
    cachedData,
    
    // Queue management
    addToOfflineQueue,
    syncOfflineData,
    clearSyncedItems,
    
    // Cache management
    cacheData,
    getCachedData,
    
    // Utilities
    clearAllData,
    lastSync: cachedData?.lastSync
  };
};