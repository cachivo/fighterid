import { describe, it, expect } from 'vitest';
import { isValidEventType, EVENT_TYPES } from '@/system/events/event.types';

describe('event.types — whitelist enforcement', () => {
  it('accepts every type listed in EVENT_TYPES', () => {
    for (const t of EVENT_TYPES) {
      expect(isValidEventType(t)).toBe(true);
    }
  });

  it('rejects unknown event types (system rule: no noise)', () => {
    expect(isValidEventType('random_unknown_event')).toBe(false);
    expect(isValidEventType('')).toBe(false);
    expect(isValidEventType('PROFILE_FIELD_UPDATED')).toBe(false); // case sensitive
  });

  it('exposes a non-empty, frozen-style whitelist', () => {
    expect(EVENT_TYPES.length).toBeGreaterThan(0);
    // sanity: critical types must always exist
    expect(EVENT_TYPES).toContain('license_submitted');
    expect(EVENT_TYPES).toContain('admin_fighter_edited');
  });
});
