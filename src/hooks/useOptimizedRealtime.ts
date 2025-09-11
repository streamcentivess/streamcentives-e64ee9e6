import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounced } from './useDebounced';

interface RealtimeConfig {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onUpdate: () => void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useOptimizedRealtime({
  table,
  filter,
  event = '*',
  onUpdate,
  debounceMs = 300,
  enabled = true,
}: RealtimeConfig) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debouncedUpdate = useDebounced(onUpdate, debounceMs);

  const setupChannel = useCallback(() => {
    if (!enabled || channelRef.current) return;

    const channelName = `realtime-${table}-${filter || 'all'}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    const config: any = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      config.filter = filter;
    }

    channel.on('postgres_changes', config, (payload: any) => {
      console.log(`Realtime update on ${table}:`, payload);
      debouncedUpdate();
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${table} changes`);
      }
    });

    channelRef.current = channel;
  }, [enabled, table, filter, event, debouncedUpdate]);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    setupChannel();
    return cleanup;
  }, [setupChannel, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isConnected: !!channelRef.current,
    reconnect: () => {
      cleanup();
      setupChannel();
    }
  };
}