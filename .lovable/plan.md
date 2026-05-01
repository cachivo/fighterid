# Sistema de Sesiones + RAG para Workflow de Licencias Fighter ID

## Mapeo conceptual al stack actual

Tu spec genérica → tabla real Fighter ID:

| Spec genérica | Fighter ID |
|---|---|
| `expediente_id` | `fighter_profiles.id` (perfil del peleador) |
| `phase_id` | `fighter_licenses.status` (`pending`, `active`, `suspended`, `expired`) + `completion_level` del perfil |
| `workflow engine` | Reglas existentes en `useLicenseSystem`, `license_audit_log`, triggers SQL ya en BD |
| `db.session.create` (Prisma) | `supabase.from('work_sessions').insert(...)` |
| `openai.embeddings.create` | Lovable AI Gateway (`text-embedding-004` vía `LOVABLE_API_KEY`) |

No vamos a construir un workflow engine paralelo: ya existe (`license_audit_log`, `moderation_status`, triggers de fight result). El nuevo sistema **observa y registra**, no decide transiciones de estado por su cuenta — solo sugiere `can_advance` consultando reglas existentes.

## Alcance (acordado)

Solo backend + hooks. Cero UI nueva en este PR. Esto deja la infraestructura lista para que después se agreguen widgets de "actividad reciente", panel admin de auditoría, búsqueda RAG, etc.

## 1. Migración SQL

Cuatro tablas nuevas + extensión `pgvector` (ya disponible en Supabase).

```sql
-- Habilitar pgvector si no está
CREATE EXTENSION IF NOT EXISTS vector;

-- Sesiones de trabajo (devs, admins, fighters, gyms)
CREATE TABLE public.work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  fighter_profile_id UUID REFERENCES public.fighter_profiles(id) ON DELETE SET NULL, -- opcional: el "expediente"
  context TEXT NOT NULL, -- 'admin_panel' | 'license_onboarding' | 'profile_setup' | 'gym_dashboard' | etc.
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  client_meta JSONB DEFAULT '{}'::jsonb -- userAgent, viewport, route inicial
);
CREATE INDEX ON public.work_sessions (app_user_id, started_at DESC);
CREATE INDEX ON public.work_sessions (fighter_profile_id) WHERE fighter_profile_id IS NOT NULL;

-- Eventos significativos (whitelist controlada, NO ruido)
CREATE TABLE public.work_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'document_uploaded' | 'profile_field_updated' | 'license_submitted' | 'fighter_approved' | etc.
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.work_session_events (session_id, created_at);

-- Resúmenes de trabajo por sesión (tareas completadas + notas)
CREATE TABLE public.work_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES public.work_sessions(id) ON DELETE CASCADE,
  fighter_profile_id UUID REFERENCES public.fighter_profiles(id) ON DELETE SET NULL,
  current_phase TEXT, -- snapshot del license.status / completion_level al cerrar
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL,
  can_advance BOOLEAN DEFAULT false,
  blocking_reasons TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Embeddings RAG (append-only, nunca UPDATE)
CREATE TABLE public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL, -- 'work_update' | 'license_audit' | 'profile_change'
  source_id UUID NOT NULL,
  fighter_profile_id UUID REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768), -- text-embedding-004 dimensions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON public.knowledge_embeddings (fighter_profile_id, source_type);
```

**RLS** (sigue patrón del proyecto, `has_role` ya existe):
- `work_sessions` / `work_session_events` / `work_updates`: SELECT propio (`app_user_id = current app_user`) o admin/super_admin. INSERT propio. UPDATE solo del `ended_at` por dueño.
- `knowledge_embeddings`: SELECT solo admin/super_admin (info sensible agregada). INSERT solo via service role (edge function).

**RPC `match_knowledge_embeddings`** (security definer) para búsqueda vectorial filtrada por `fighter_profile_id` y rol.

## 2. Edge Function `session-embed`

`supabase/functions/session-embed/index.ts`

- Recibe `{ source_type, source_id, fighter_profile_id, content }`.
- Llama Lovable AI Gateway: `POST https://ai.gateway.lovable.dev/v1/embeddings` con `model: "google/text-embedding-004"`.
- Inserta en `knowledge_embeddings` usando service role.
- Maneja 429/402 devolviendo error claro.
- Validación con Zod, CORS estándar, JWT validado en código (verifica que el caller es admin o dueño del perfil).

## 3. Estructura de archivos

```text
src/system/
  session/
    session.types.ts       # Tipos TS (Session, SessionEvent, WorkUpdate, EventType union)
    session.service.ts     # startSession, endSession, getCurrentSession (Supabase client)
    useSession.tsx         # Hook React: auto-inicia al montar, auto-cierra en unmount/beforeunload
  events/
    event.logger.ts        # logEvent(sessionId, type, payload) + EVENT_TYPES whitelist
    event.types.ts         # Union literal de todos los event_type permitidos
  rag/
    embedding.service.ts   # Cliente que invoca edge function session-embed
    retrieval.service.ts   # retrieveRelevantContext(query, fighterProfileId) vía RPC
  workflow/
    workflow.adapter.ts    # getNextActions / extractCompletedTasks / generateSummary
                           # Lee fighter_licenses + completion_score, NO escribe
```

## 4. Detalles clave de implementación

### `event.types.ts` — whitelist estricta (regla "no ruido")

```ts
export const EVENT_TYPES = [
  // Profile
  'profile_field_updated', 'profile_setup_completed', 'avatar_uploaded',
  // License flow
  'license_document_uploaded', 'license_submitted', 'license_approved', 'license_rejected',
  // Admin actions
  'admin_fighter_created', 'admin_fighter_edited', 'admin_moderation_decision',
  // Gym flow
  'gym_membership_changed', 'gym_invite_sent',
  // Fight
  'fight_result_recorded',
] as const;
export type EventType = typeof EVENT_TYPES[number];
```

`logEvent` rechaza tipos fuera de la whitelist en runtime → fuerza disciplina.

### `useSession` — auto-lifecycle

Hook que al montarse en una ruta pivote (Admin layout, ProfileSetup, GymDashboard, LicenseOnboarding) hace `startSession` con el `context` correcto y guarda el `session_id` en un Context React. Al desmontar / `beforeunload` / cambio de ruta a fuera del contexto → `endSession`.

`endSession` llama a un RPC `close_work_session(session_id)` que en una sola transacción:
1. Setea `ended_at = now()`.
2. Lee todos los `work_session_events` de la sesión.
3. Llama función PL/pgSQL `extract_completed_tasks(session_id)` → JSON.
4. Genera `summary` text.
5. Inserta `work_updates`.
6. Devuelve `{ work_update_id, summary, fighter_profile_id }`.

Después, el cliente invoca la edge function `session-embed` con ese summary para crear el embedding (regla: "no embeddings sin summary"). Si no hay tareas significativas, `summary` queda vacío y NO se genera embedding.

### `workflow.adapter.ts` — read-only

```ts
export async function getNextActions(fighterProfileId: string) {
  // Lee fighter_profiles.completion_score, fighter_licenses.status,
  // license_documents requeridos vs subidos.
  // Devuelve { can_advance, blocking, available_transitions } SIN mutar nada.
}

export async function extractCompletedTasks(events) {
  // Mapea events → tareas semánticas (mismo shape de tu spec)
}

export function generateSummary(tasks) {
  // Texto plano corto en español (lo que va a embeddings)
}
```

**No hay `advancePhase()` automático.** La transición de estado de licencia se sigue haciendo a través de `useLicenseSystem` y triggers SQL existentes (`save_fight_result`, `license_audit_log`). El sistema solo *reporta* `can_advance: true`. Esto evita race conditions y respeta la arquitectura ya validada.

## 5. Integración mínima en el app (ejemplos)

Tres puntos de wiring iniciales, suficientes para empezar a generar datos:

| Componente | Acción |
|---|---|
| `AdminLayout` | `useSession({ context: 'admin_panel' })` |
| `AdminFighterForm` (al guardar) | `logEvent(sid, 'admin_fighter_edited', { profileId, changedFields })` |
| `ProfileSetup` (al completar) | `logEvent(sid, 'profile_setup_completed', { score })` |
| `LicenseOnboarding` (subida doc) | `logEvent(sid, 'license_document_uploaded', { docType })` |

El resto de integraciones (gym, fight, etc.) se van agregando incrementalmente sin tocar la infraestructura.

## 6. Reglas no-negociables (codificadas)

| Regla del spec | Cómo se cumple |
|---|---|
| No ruido | Whitelist `EVENT_TYPES` + runtime check |
| Toda sesión termina | `useSession` cierra en `beforeunload` + cleanup React. RPC idempotente |
| No embeddings sin resumen | `endSession` solo invoca `session-embed` si `summary !== ''` |
| Siempre adjuntar `fighter_profile_id` | Columna en `work_sessions`, propagada a `work_updates` y `knowledge_embeddings` |
| Embeddings append-only | RLS sin policy de UPDATE/DELETE en `knowledge_embeddings` |

## 7. Lo que NO entra en este PR

- UI de visualización (timeline, panel auditoría, búsqueda RAG): se hace después.
- Wiring exhaustivo en cada componente: solo los 4 puntos pivote arriba.
- Trigger automático de `advancePhase`: la decisión sigue siendo manual/por reglas existentes.
- Migración de datos históricos a `knowledge_embeddings`: se puede hacer en script aparte después.

## 8. Riesgo y demo

- **Cero impacto en flujos visibles.** Todo es observación pasiva. Si algo falla, las sesiones quedan abiertas pero no rompen UX (try/catch silencioso en `logEvent`).
- Recomendación: hacer merge de la migración + edge function antes del demo, pero **dejar los hooks `useSession` desactivados con un feature flag** (`localStorage.SESSIONS_ENABLED === 'true'`) hasta validar post-demo. Así la BD queda lista pero no hay sorpresas.

## Archivos a crear/editar

**Migración SQL** (1 archivo): tablas + RLS + RPC `close_work_session` + RPC `match_knowledge_embeddings` + función `extract_completed_tasks`.

**Edge function**: `supabase/functions/session-embed/index.ts` + entrada en `supabase/config.toml`.

**Frontend nuevo**:
- `src/system/session/session.types.ts`
- `src/system/session/session.service.ts`
- `src/system/session/useSession.tsx` (+ Context provider)
- `src/system/events/event.logger.ts`
- `src/system/events/event.types.ts`
- `src/system/rag/embedding.service.ts`
- `src/system/rag/retrieval.service.ts`
- `src/system/workflow/workflow.adapter.ts`

**Frontend editado** (mínimo viable):
- `src/components/AdminLayout.tsx` — montar `SessionProvider`
- `src/components/admin/AdminFighterForm.tsx` — `logEvent` al guardar
- `src/pages/profile/ProfileSetup.tsx` — `logEvent` al completar
- `src/pages/license/LicenseOnboarding.tsx` — `logEvent` al subir doc

**Memoria de proyecto**:
- Nuevo `mem://architecture/session-and-rag-system` documentando la convención (whitelist de eventos, regla read-only del workflow adapter, append-only embeddings).
- Update a `mem://index.md` agregando la referencia.
