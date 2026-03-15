import { useState, useEffect, useCallback, useRef } from 'react';

const STRIKE_TYPES = ['jab', 'cross', 'hook', 'uppercut', 'low_kick', 'high_kick', 'body_kick', 'knee', 'elbow'] as const;
const FIGHTERS = ['A', 'B'] as const;
const EVENT_TYPES = ['strike_attempted', 'strike_connected'] as const;

interface DemoEvent {
  id: number;
  fight_id: string;
  round_number: number;
  timestamp_ms: number;
  fighter: 'A' | 'B';
  event_type: 'strike_attempted' | 'strike_connected';
  strike_type: string;
  confidence: number;
  model_version: string;
  created_at: string;
}

interface DemoRound {
  number: number;
  startsAt: string;
  durationSeconds: number;
  status: 'live' | 'rest' | 'finished';
}

export function useHudDemoMode() {
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [round, setRound] = useState<DemoRound>({
    number: 1,
    startsAt: new Date().toISOString(),
    durationSeconds: 180,
    status: 'live',
  });
  const [isRunning, setIsRunning] = useState(true);
  const idCounter = useRef(1);
  const roundStartRef = useRef(Date.now());

  const generateStrikeAction = useCallback((): DemoEvent[] => {
    const fighter = FIGHTERS[Math.random() > 0.5 ? 1 : 0];
    // Weight strike types: jab/cross most common
    const weights = [0.25, 0.2, 0.15, 0.1, 0.1, 0.07, 0.06, 0.04, 0.03];
    let r = Math.random(), cumulative = 0;
    let strikeIdx = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (r <= cumulative) { strikeIdx = i; break; }
    }

    const now = new Date().toISOString();
    const tsMs = Date.now() - roundStartRef.current;
    const strikeType = STRIKE_TYPES[strikeIdx];
    const confidence = 0.75 + Math.random() * 0.24;

    // Every action is an attempt; ~60% also connect
    const events: DemoEvent[] = [{
      id: idCounter.current++,
      fight_id: 'demo',
      round_number: round.number,
      timestamp_ms: tsMs,
      fighter,
      event_type: 'strike_attempted',
      strike_type: strikeType,
      confidence,
      model_version: 'demo-v1',
      created_at: now,
    }];

    if (Math.random() < 0.6) {
      events.push({
        id: idCounter.current++,
        fight_id: 'demo',
        round_number: round.number,
        timestamp_ms: tsMs,
        fighter,
        event_type: 'strike_connected',
        strike_type: strikeType,
        confidence,
        model_version: 'demo-v1',
        created_at: now,
      });
    }

    return events;
  }, [round.number]);

  // Generate events at random intervals (0.4–1.8s)
  useEffect(() => {
    if (!isRunning || round.status !== 'live') return;

    const scheduleNext = () => {
      const delay = 400 + Math.random() * 1400;
      return setTimeout(() => {
        // Sometimes generate a burst (2-3 actions)
        const burst = Math.random() < 0.15 ? Math.floor(Math.random() * 2) + 2 : 1;
        const newEvents: DemoEvent[] = [];
        for (let i = 0; i < burst; i++) {
          newEvents.push(...generateStrikeAction());
        }
        setEvents(prev => [...newEvents, ...prev].slice(0, 500));
        timerRef.current = scheduleNext();
      }, delay);
    };

    const timerRef = { current: scheduleNext() };
    return () => clearTimeout(timerRef.current);
  }, [isRunning, round.status, generateStrikeAction]);

  // Round transitions: 3min round → 1min rest → next round
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - roundStartRef.current;
      if (round.status === 'live' && elapsed >= round.durationSeconds * 1000) {
        if (round.number >= 3) {
          setRound(prev => ({ ...prev, status: 'finished' }));
          setIsRunning(false);
        } else {
          setRound(prev => ({ ...prev, status: 'rest' }));
          // After 10s rest (shortened for demo), start next round
          setTimeout(() => {
            roundStartRef.current = Date.now();
            setRound(prev => ({
              number: prev.number + 1,
              startsAt: new Date().toISOString(),
              durationSeconds: 180,
              status: 'live',
            }));
          }, 10000);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, round]);

  const reset = useCallback(() => {
    setEvents([]);
    idCounter.current = 1;
    roundStartRef.current = Date.now();
    setRound({ number: 1, startsAt: new Date().toISOString(), durationSeconds: 180, status: 'live' });
    setIsRunning(true);
  }, []);

  const togglePause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  return { events, round, isRunning, reset, togglePause };
}
