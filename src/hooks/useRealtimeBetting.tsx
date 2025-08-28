import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PoolUpdate {
  market_id: string;
  outcome_id: string;
  pool: number;
  timestamp: number;
}

interface MarketStateUpdate {
  market_id: string;
  state: string;
  previous_state: string;
  timestamp: number;
}

interface TicketUpdate {
  id: string;
  status: string;
  market_id: string;
  outcome_id: string;
  stake: number;
  payout_amount?: number;
}

export const useRealtimeBetting = (eventId?: string) => {
  const [poolUpdates, setPoolUpdates] = useState<Record<string, PoolUpdate>>({});
  const [marketStates, setMarketStates] = useState<Record<string, string>>({});
  const [ticketUpdates, setTicketUpdates] = useState<Record<string, TicketUpdate>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const updateQueueRef = useRef<PoolUpdate[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();

  // Batch pool updates to avoid UI flickering
  const processBatchedUpdates = useCallback(() => {
    if (updateQueueRef.current.length === 0) return;

    const updates = updateQueueRef.current.slice();
    updateQueueRef.current = [];

    // Group by outcome_id and take the latest update for each
    const latestUpdates = updates.reduce((acc, update) => {
      const key = update.outcome_id;
      if (!acc[key] || update.timestamp > acc[key].timestamp) {
        acc[key] = update;
      }
      return acc;
    }, {} as Record<string, PoolUpdate>);

    setPoolUpdates(prev => ({
      ...prev,
      ...latestUpdates
    }));
  }, []);

  // Add update to batch queue
  const queuePoolUpdate = useCallback((update: PoolUpdate) => {
    updateQueueRef.current.push(update);
    
    // Clear existing timeout and set new one
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    batchTimeoutRef.current = setTimeout(processBatchedUpdates, 100); // 10 Hz batching
  }, [processBatchedUpdates]);

  // Get current pool for outcome
  const getPoolForOutcome = useCallback((outcomeId: string) => {
    const update = poolUpdates[outcomeId];
    return update?.pool || 0;
  }, [poolUpdates]);

  // Get market state
  const getMarketState = useCallback((marketId: string) => {
    return marketStates[marketId] || 'unknown';
  }, [marketStates]);

  // Setup real-time subscriptions
  useEffect(() => {
    setConnectionStatus('connecting');

    // Subscribe to PostgreSQL notifications
    const channel = supabase
      .channel('realtime-betting')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'outcome',
      }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          queuePoolUpdate({
            market_id: payload.new.market_id,
            outcome_id: payload.new.id,
            pool: payload.new.pool,
            timestamp: Date.now()
          });
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'market',
      }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          setMarketStates(prev => ({
            ...prev,
            [payload.new.id]: payload.new.state
          }));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bet_ticket',
      }, (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          const ticket = payload.new as any;
          setTicketUpdates(prev => ({
            ...prev,
            [ticket.id]: {
              id: ticket.id,
              status: ticket.status,
              market_id: ticket.market_id,
              outcome_id: ticket.outcome_id,
              stake: ticket.stake,
              payout_amount: ticket.payout_amount
            }
          }));
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    // Listen for PostgreSQL NOTIFY events (for custom notifications)
    const poolNotifyChannel = supabase
      .channel('pool-notifications')
      .on('broadcast', { event: 'pool_update' }, (payload) => {
        queuePoolUpdate(payload.payload as PoolUpdate);
      })
      .on('broadcast', { event: 'market_state' }, (payload) => {
        const update = payload.payload as MarketStateUpdate;
        setMarketStates(prev => ({
          ...prev,
          [update.market_id]: update.state
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(poolNotifyChannel);
      
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      setConnectionStatus('disconnected');
    };
  }, [queuePoolUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    getPoolForOutcome,
    getMarketState,
    ticketUpdates,
    connectionStatus,
    poolUpdates: Object.values(poolUpdates),
    isConnected: connectionStatus === 'connected'
  };
};