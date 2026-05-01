-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- TABLE: work_sessions
-- =========================================================
CREATE TABLE public.work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  fighter_profile_id UUID REFERENCES public.fighter_profiles(id) ON DELETE SET NULL,
  context TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  client_meta JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_work_sessions_user ON public.work_sessions (app_user_id, started_at DESC);
CREATE INDEX idx_work_sessions_fighter ON public.work_sessions (fighter_profile_id) WHERE fighter_profile_id IS NOT NULL;
CREATE INDEX idx_work_sessions_open ON public.work_sessions (app_user_id) WHERE ended_at IS NULL;

ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own work sessions"
  ON public.work_sessions FOR SELECT
  USING (
    app_user_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Users create their own work sessions"
  ON public.work_sessions FOR INSERT
  WITH CHECK (
    app_user_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users close their own work sessions"
  ON public.work_sessions FOR UPDATE
  USING (
    app_user_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid())
  );

-- =========================================================
-- TABLE: work_session_events
-- =========================================================
CREATE TABLE public.work_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_events_session ON public.work_session_events (session_id, created_at);
CREATE INDEX idx_session_events_type ON public.work_session_events (event_type, created_at DESC);

ALTER TABLE public.work_session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view events from their sessions"
  ON public.work_session_events FOR SELECT
  USING (
    session_id IN (
      SELECT ws.id FROM public.work_sessions ws
      JOIN public.app_user u ON u.id = ws.app_user_id
      WHERE u.auth_user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Users insert events into their sessions"
  ON public.work_session_events FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT ws.id FROM public.work_sessions ws
      JOIN public.app_user u ON u.id = ws.app_user_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- =========================================================
-- TABLE: work_updates
-- =========================================================
CREATE TABLE public.work_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES public.work_sessions(id) ON DELETE CASCADE,
  fighter_profile_id UUID REFERENCES public.fighter_profiles(id) ON DELETE SET NULL,
  current_phase TEXT,
  completed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL DEFAULT '',
  can_advance BOOLEAN NOT NULL DEFAULT false,
  blocking_reasons TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_work_updates_fighter ON public.work_updates (fighter_profile_id, created_at DESC);

ALTER TABLE public.work_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view updates from their sessions"
  ON public.work_updates FOR SELECT
  USING (
    session_id IN (
      SELECT ws.id FROM public.work_sessions ws
      JOIN public.app_user u ON u.id = ws.app_user_id
      WHERE u.auth_user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- =========================================================
-- TABLE: knowledge_embeddings (append-only, admin-only read)
-- =========================================================
CREATE TABLE public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  fighter_profile_id UUID REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_knowledge_embeddings_vector ON public.knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_embeddings_fighter ON public.knowledge_embeddings (fighter_profile_id, source_type);
CREATE INDEX idx_knowledge_embeddings_source ON public.knowledge_embeddings (source_type, source_id);

ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Only admins / super_admins can read embeddings (sensitive aggregated info)
CREATE POLICY "Admins view all knowledge embeddings"
  ON public.knowledge_embeddings FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );
-- No INSERT/UPDATE/DELETE policies → only service role (edge function) can write.

-- =========================================================
-- FUNCTION: extract_completed_tasks
-- =========================================================
CREATE OR REPLACE FUNCTION public.extract_completed_tasks(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'type', event_type,
      'status', 'completed',
      'metadata', payload,
      'at', created_at
    ) ORDER BY created_at
  ), '[]'::jsonb)
  INTO result
  FROM public.work_session_events
  WHERE session_id = p_session_id;
  RETURN result;
END;
$$;

-- =========================================================
-- FUNCTION: close_work_session (atomic close + summary insert)
-- =========================================================
CREATE OR REPLACE FUNCTION public.close_work_session(
  p_session_id UUID,
  p_summary TEXT,
  p_current_phase TEXT DEFAULT NULL,
  p_can_advance BOOLEAN DEFAULT false,
  p_blocking_reasons TEXT[] DEFAULT '{}'
)
RETURNS TABLE (
  work_update_id UUID,
  fighter_profile_id UUID,
  summary TEXT,
  task_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.work_sessions%ROWTYPE;
  v_caller_app_user UUID;
  v_tasks JSONB;
  v_update_id UUID;
BEGIN
  -- Verify caller owns the session OR is admin
  SELECT id INTO v_caller_app_user
  FROM public.app_user
  WHERE auth_user_id = auth.uid();

  SELECT * INTO v_session FROM public.work_sessions WHERE id = p_session_id;
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.app_user_id <> v_caller_app_user
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to close this session';
  END IF;

  -- Close session if not already closed (idempotent)
  IF v_session.ended_at IS NULL THEN
    UPDATE public.work_sessions SET ended_at = now() WHERE id = p_session_id;
  END IF;

  -- If a work_update already exists, return it (idempotent)
  SELECT id INTO v_update_id FROM public.work_updates WHERE session_id = p_session_id;
  IF v_update_id IS NOT NULL THEN
    RETURN QUERY
      SELECT wu.id, wu.fighter_profile_id, wu.summary,
             jsonb_array_length(wu.completed_tasks)::int
      FROM public.work_updates wu WHERE wu.id = v_update_id;
    RETURN;
  END IF;

  v_tasks := public.extract_completed_tasks(p_session_id);

  INSERT INTO public.work_updates (
    session_id, fighter_profile_id, current_phase,
    completed_tasks, summary, can_advance, blocking_reasons
  ) VALUES (
    p_session_id, v_session.fighter_profile_id, p_current_phase,
    v_tasks, COALESCE(p_summary, ''), COALESCE(p_can_advance, false), COALESCE(p_blocking_reasons, '{}')
  )
  RETURNING id INTO v_update_id;

  RETURN QUERY
    SELECT wu.id, wu.fighter_profile_id, wu.summary,
           jsonb_array_length(wu.completed_tasks)::int
    FROM public.work_updates wu WHERE wu.id = v_update_id;
END;
$$;

-- =========================================================
-- FUNCTION: match_knowledge_embeddings (vector search)
-- =========================================================
CREATE OR REPLACE FUNCTION public.match_knowledge_embeddings(
  query_embedding vector(768),
  p_fighter_profile_id UUID DEFAULT NULL,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  fighter_profile_id UUID,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can run vector search (mirrors RLS of embeddings table)
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT ke.id, ke.source_type, ke.source_id, ke.fighter_profile_id,
           ke.content,
           1 - (ke.embedding <=> query_embedding) AS similarity,
           ke.created_at
    FROM public.knowledge_embeddings ke
    WHERE (p_fighter_profile_id IS NULL OR ke.fighter_profile_id = p_fighter_profile_id)
      AND ke.embedding IS NOT NULL
    ORDER BY ke.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;