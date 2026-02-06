import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for real-time synchronization of fighter profile updates
 * Subscribes to postgres_changes on fighter_profiles table
 * Automatically invalidates relevant queries when changes occur
 * 
 * @param fighterId - Optional: filter to specific fighter, otherwise listens to all changes
 */
export function useRealtimeFighterUpdates(fighterId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = fighterId 
      ? `fighter-updates-${fighterId}` 
      : 'fighter-updates-global';

    console.log(`[Realtime] Setting up channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'fighter_profiles',
          ...(fighterId && { filter: `id=eq.${fighterId}` })
        },
        (payload) => {
          console.log('[Realtime] Fighter profile changed:', payload.eventType, payload.new);
          
          // Invalidate all fighter-related queries
          queryClient.invalidateQueries({ queryKey: ['fighters'] });
          queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
          queryClient.invalidateQueries({ queryKey: ['ranking-data'] });
          queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
          
          if (fighterId) {
            queryClient.invalidateQueries({ queryKey: ['fighter', fighterId] });
            queryClient.invalidateQueries({ queryKey: ['fighter-profile', fighterId] });
          }
          
          // If payload has new record with id, also invalidate that specific fighter
          const newId = (payload.new as any)?.id;
          if (newId && newId !== fighterId) {
            queryClient.invalidateQueries({ queryKey: ['fighter', newId] });
            queryClient.invalidateQueries({ queryKey: ['fighter-profile', newId] });
          }

          // Dispatch custom event for non-query-based components
          window.dispatchEvent(new CustomEvent('fighter-profile-updated', {
            detail: { 
              fighterId: newId || fighterId,
              eventType: payload.eventType,
              payload: payload.new
            }
          }));
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Channel ${channelName} status:`, status);
      });

    return () => {
      console.log(`[Realtime] Cleaning up channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [fighterId, queryClient]);
}

/**
 * Hook for real-time synchronization of fighter rankings
 * Listens to changes in fighter_rankings table
 */
export function useRealtimeRankingUpdates(organizationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = organizationId 
      ? `ranking-updates-${organizationId}` 
      : 'ranking-updates-global';

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fighter_rankings',
          ...(organizationId && { filter: `organization_id=eq.${organizationId}` })
        },
        (payload) => {
          console.log('[Realtime] Fighter ranking changed:', payload.eventType);
          
          queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
          queryClient.invalidateQueries({ queryKey: ['ranking-data'] });
          queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
          
          window.dispatchEvent(new CustomEvent('ranking-updated', {
            detail: { organizationId, eventType: payload.eventType }
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, queryClient]);
}
