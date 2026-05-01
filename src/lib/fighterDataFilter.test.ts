import { describe, it, expect } from 'vitest';
import {
  filterPublicFighterData,
  isSensitiveField,
  PUBLIC_FIGHTER_FIELDS,
  SENSITIVE_FIGHTER_FIELDS,
} from '@/lib/fighterDataFilter';

describe('fighterDataFilter — security boundary', () => {
  const fullProfile = {
    id: 'abc',
    first_name: 'Juan',
    last_name: 'Pérez',
    nickname: 'El Toro',
    avatar_url: null,
    weight_class: 'lightweight',
    record_wins: 5,
    record_losses: 1,
    record_draws: 0,
    active: true,
    // SENSITIVE — must be stripped
    birthdate: '1995-01-01',
    document_number: 'X12345',
    medical_conditions: 'Bipolaridad afectiva',
    medical_allergies: 'penicillin',
    emergency_contact_phone: '+50499999999',
    blood_type: 'O+',
    insurance_policy: 'POL-001',
  };

  it('strips every sensitive field from filtered output', () => {
    const filtered = filterPublicFighterData(fullProfile) as unknown as Record<string, unknown>;
    for (const f of SENSITIVE_FIGHTER_FIELDS) {
      expect(filtered[f]).toBeUndefined();
    }
  });

  it('preserves all public fields that exist on the source', () => {
    const filtered = filterPublicFighterData(fullProfile) as unknown as Record<string, unknown>;
    expect(filtered.id).toBe('abc');
    expect(filtered.first_name).toBe('Juan');
    expect(filtered.nickname).toBe('El Toro');
    expect(filtered.record_wins).toBe(5);
  });

  it('classifies medical and document fields as sensitive', () => {
    expect(isSensitiveField('medical_conditions')).toBe(true);
    expect(isSensitiveField('document_number')).toBe(true);
    expect(isSensitiveField('emergency_contact_phone')).toBe(true);
    expect(isSensitiveField('blood_type')).toBe(true);
  });

  it('classifies common public fields as non-sensitive', () => {
    expect(isSensitiveField('first_name')).toBe(false);
    expect(isSensitiveField('record_wins')).toBe(false);
    expect(isSensitiveField('avatar_url')).toBe(false);
  });

  it('public + sensitive field lists do not overlap', () => {
    const overlap = (PUBLIC_FIGHTER_FIELDS as string[]).filter(f =>
      (SENSITIVE_FIGHTER_FIELDS as string[]).includes(f),
    );
    expect(overlap).toEqual([]);
  });
});
