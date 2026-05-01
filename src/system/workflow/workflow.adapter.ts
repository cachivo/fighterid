import { supabase } from '@/integrations/supabase/client';
import type { EventType } from '../events/event.types';

/**
 * READ-ONLY adapter al workflow real de licencias.
 * NUNCA escribe ni dispara transiciones de estado — solo reporta.
 * Las transiciones se siguen haciendo a través de useLicenseSystem y triggers SQL existentes.
 */

export interface NextActionsResult {
  can_advance: boolean;
  blocking: string[];
  current_phase: string | null;
}

export async function getNextActions(
  fighterProfileId: string | null,
): Promise<NextActionsResult> {
  if (!fighterProfileId) {
    return { can_advance: false, blocking: ['no_fighter_profile'], current_phase: null };
  }

  // Lee perfil + licencia primaria
  const [{ data: profile }, { data: license }] = await Promise.all([
    supabase
      .from('fighter_profiles')
      .select('completion_score, completion_level')
      .eq('id', fighterProfileId)
      .maybeSingle(),
    supabase
      .from('fighter_licenses')
      .select('status, medical_cleared, physical_cleared, expires_at')
      .eq('fighter_id', fighterProfileId)
      .eq('is_primary', true)
      .maybeSingle(),
  ]);

  const blocking: string[] = [];
  if (!profile) blocking.push('profile_missing');
  if ((profile?.completion_score ?? 0) < 70) blocking.push('profile_incomplete');
  if (!license) {
    blocking.push('license_missing');
  } else {
    if (!license.medical_cleared) blocking.push('medical_not_cleared');
    if (!license.physical_cleared) blocking.push('physical_not_cleared');
  }

  return {
    can_advance: blocking.length === 0,
    blocking,
    current_phase: license?.status ?? profile?.completion_level ?? null,
  };
}

interface RawEvent {
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CompletedTask {
  type: string;
  status: 'completed';
  metadata: Record<string, unknown>;
}

export function extractCompletedTasks(events: RawEvent[]): CompletedTask[] {
  const tasks: CompletedTask[] = [];
  for (const e of events) {
    switch (e.event_type as EventType) {
      case 'license_document_uploaded':
        tasks.push({ type: 'document', status: 'completed', metadata: e.payload });
        break;
      case 'license_submitted':
        tasks.push({ type: 'license_submission', status: 'completed', metadata: e.payload });
        break;
      case 'license_approved':
        tasks.push({ type: 'license_approval', status: 'completed', metadata: e.payload });
        break;
      case 'profile_setup_completed':
        tasks.push({ type: 'profile_setup', status: 'completed', metadata: e.payload });
        break;
      case 'profile_field_updated':
        tasks.push({ type: 'profile_edit', status: 'completed', metadata: e.payload });
        break;
      case 'avatar_uploaded':
        tasks.push({ type: 'avatar', status: 'completed', metadata: e.payload });
        break;
      case 'admin_fighter_created':
      case 'admin_fighter_edited':
      case 'admin_moderation_decision':
        tasks.push({ type: 'admin_action', status: 'completed', metadata: { action: e.event_type, ...e.payload } });
        break;
      case 'gym_membership_changed':
      case 'gym_invite_sent':
        tasks.push({ type: 'gym_action', status: 'completed', metadata: { action: e.event_type, ...e.payload } });
        break;
      case 'fight_result_recorded':
        tasks.push({ type: 'fight_result', status: 'completed', metadata: e.payload });
        break;
      default:
        // Whitelist already filtered upstream; ignore unknown.
        break;
    }
  }
  return tasks;
}

export function generateSummary(tasks: CompletedTask[]): string {
  if (tasks.length === 0) return '';
  const lines = tasks.map((t) => {
    switch (t.type) {
      case 'document': return 'Documento subido';
      case 'license_submission': return 'Solicitud de licencia enviada';
      case 'license_approval': return 'Licencia aprobada';
      case 'profile_setup': return 'Perfil completado';
      case 'profile_edit': return 'Perfil editado';
      case 'avatar': return 'Avatar actualizado';
      case 'admin_action': {
        const action = (t.metadata as any)?.action ?? 'admin';
        return `Admin: ${action}`;
      }
      case 'gym_action': {
        const action = (t.metadata as any)?.action ?? 'gym';
        return `Gimnasio: ${action}`;
      }
      case 'fight_result': return 'Resultado de pelea registrado';
      default: return t.type;
    }
  });
  return lines.join('\n');
}
