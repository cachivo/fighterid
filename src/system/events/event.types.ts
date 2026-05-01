/**
 * Whitelist estricta de event_types permitidos.
 * Regla NO-NEGOCIABLE del sistema de sesiones: NO logear ruido.
 * Cualquier evento fuera de esta lista será rechazado en runtime por logEvent().
 */
export const EVENT_TYPES = [
  // Profile lifecycle
  'profile_field_updated',
  'profile_setup_completed',
  'avatar_uploaded',

  // License flow
  'license_document_uploaded',
  'license_submitted',
  'license_approved',
  'license_rejected',

  // Admin actions
  'admin_fighter_created',
  'admin_fighter_edited',
  'admin_moderation_decision',

  // Gym flow
  'gym_membership_changed',
  'gym_invite_sent',

  // Fight
  'fight_result_recorded',
] as const;

export type EventType = typeof EVENT_TYPES[number];

export function isValidEventType(t: string): t is EventType {
  return (EVENT_TYPES as readonly string[]).includes(t);
}
