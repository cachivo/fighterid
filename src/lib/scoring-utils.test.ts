import { describe, it, expect } from 'vitest';
import { scoreEvent, calculateSimpleAggression } from '@/lib/scoring-utils';
import type { ScoringEvent, ScoringWeights } from '@/lib/scoring-types';

const weights: ScoringWeights = {
  punch_weight: 1.0,
  kick_weight: 1.3,
  defense_weight: 0.5,
  head_multiplier: 1.5,
  body_multiplier: 1.2,
} as ScoringWeights;

describe('scoring-utils.scoreEvent', () => {
  it('weights a head punch higher than a body punch', () => {
    const head: ScoringEvent = { type: 'punch', target: 'head', corner: 'red', timestamp_ms: 0 } as ScoringEvent;
    const body: ScoringEvent = { type: 'punch', target: 'body', corner: 'red', timestamp_ms: 0 } as ScoringEvent;
    expect(scoreEvent(head, weights)).toBeGreaterThan(scoreEvent(body, weights));
  });

  it('falls back to base 1.0 for unknown event types', () => {
    const unknown = { type: 'wrestle', corner: 'red', timestamp_ms: 0 } as unknown as ScoringEvent;
    expect(scoreEvent(unknown, weights)).toBe(1.0);
  });
});

describe('scoring-utils.calculateSimpleAggression', () => {
  const evs: ScoringEvent[] = [
    { type: 'punch', corner: 'red', timestamp_ms: 1000 } as ScoringEvent,
    { type: 'punch', corner: 'red', timestamp_ms: 5000 } as ScoringEvent,
    { type: 'punch', corner: 'blue', timestamp_ms: 6000 } as ScoringEvent,
    { type: 'punch', corner: 'red', timestamp_ms: 100 } as ScoringEvent, // outside window
  ];

  it('counts only same-corner events within the window', () => {
    expect(calculateSimpleAggression(evs, 10000, 10000, 'red')).toBe(3);
    expect(calculateSimpleAggression(evs, 10000, 10000, 'blue')).toBe(1);
  });

  it('excludes events outside the time window', () => {
    expect(calculateSimpleAggression(evs, 10000, 5000, 'red')).toBe(1); // only ts=5000
  });
});
