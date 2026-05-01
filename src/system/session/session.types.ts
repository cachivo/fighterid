import type { EventType } from '../events/event.types';

export type SessionContext =
  | 'admin_panel'
  | 'license_onboarding'
  | 'profile_setup'
  | 'gym_dashboard'
  | 'fighter_profile_edit'
  | 'judge_panel';

export interface WorkSession {
  id: string;
  app_user_id: string;
  fighter_profile_id: string | null;
  context: SessionContext | string;
  started_at: string;
  ended_at: string | null;
  client_meta: Record<string, unknown>;
}

export interface WorkSessionEvent {
  id: string;
  session_id: string;
  event_type: EventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface WorkUpdate {
  id: string;
  session_id: string;
  fighter_profile_id: string | null;
  current_phase: string | null;
  completed_tasks: Array<{ type: string; status: string; metadata: unknown; at: string }>;
  summary: string;
  can_advance: boolean;
  blocking_reasons: string[];
  created_at: string;
}

export interface CloseSessionResult {
  work_update_id: string;
  fighter_profile_id: string | null;
  summary: string;
  task_count: number;
}
