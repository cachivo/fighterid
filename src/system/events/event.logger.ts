import { supabase } from '@/integrations/supabase/client';
import { isValidEventType, type EventType } from './event.types';

/**
 * Loguea un evento significativo en la sesión actual.
 * - Whitelist enforcement: rechaza event_types no autorizados.
 * - Silent failure: nunca rompe UX (try/catch).
 *
 * @returns true si se logueó, false si no (sesión inválida, tipo inválido, error de red)
 */
export async function logEvent(
  sessionId: string | null | undefined,
  type: EventType,
  payload: Record<string, unknown> = {},
): Promise<boolean> {
  if (!sessionId) return false;
  if (!isValidEventType(type)) {
    console.warn('[event.logger] Rejected unknown event_type:', type);
    return false;
  }

  try {
    const { error } = await supabase.from('work_session_events').insert({
      session_id: sessionId,
      event_type: type,
      payload,
    });
    if (error) {
      console.warn('[event.logger] insert failed', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[event.logger] exception', e);
    return false;
  }
}

export async function getSessionEvents(sessionId: string) {
  const { data, error } = await supabase
    .from('work_session_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
