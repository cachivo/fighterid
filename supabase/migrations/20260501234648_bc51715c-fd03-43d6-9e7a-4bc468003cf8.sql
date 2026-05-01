
-- ============================================================
-- Round 1 RLS Hardening — Non-breaking critical fixes
-- ============================================================

-- A2. fights: restrict write to admins / super_admins / event creator
DROP POLICY IF EXISTS "Authenticated users can create fights" ON public.fights;
DROP POLICY IF EXISTS "Authenticated users can update fights" ON public.fights;
DROP POLICY IF EXISTS "Authenticated users can delete fights" ON public.fights;

CREATE POLICY "Admins or event creators can create fights"
  ON public.fights FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.bdg_event e WHERE e.id = fights.event_id AND e.created_by = auth.uid())
  );

CREATE POLICY "Admins or event creators can update fights"
  ON public.fights FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.bdg_event e WHERE e.id = fights.event_id AND e.created_by = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.bdg_event e WHERE e.id = fights.event_id AND e.created_by = auth.uid())
  );

CREATE POLICY "Admins or event creators can delete fights"
  ON public.fights FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.bdg_event e WHERE e.id = fights.event_id AND e.created_by = auth.uid())
  );

-- A4. bet_delay_queue: admin-only
DROP POLICY IF EXISTS "bet_delay_queue_admin_manage" ON public.bet_delay_queue;
CREATE POLICY "bet_delay_queue_admin_only"
  ON public.bet_delay_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- A7. post_comments: enforce ownership on UPDATE + add DELETE policy
DROP POLICY IF EXISTS "Users can update their own comments" ON public.post_comments;
CREATE POLICY "Users can update their own comments"
  ON public.post_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user au
      WHERE au.auth_user_id = auth.uid()
        AND au.id = post_comments.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_user au
      WHERE au.auth_user_id = auth.uid()
        AND au.id = post_comments.user_id
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON public.post_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user au
      WHERE au.auth_user_id = auth.uid()
        AND au.id = post_comments.user_id
    )
    OR public.is_admin()
  );

-- A8. station_rate_limits: anon can only INSERT, admin manages
DROP POLICY IF EXISTS "rate_limits_system_manage" ON public.station_rate_limits;

CREATE POLICY "rate_limits_anon_insert"
  ON public.station_rate_limits FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "rate_limits_admin_update"
  ON public.station_rate_limits FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "rate_limits_admin_delete"
  ON public.station_rate_limits FOR DELETE TO authenticated
  USING (public.is_admin());

-- A12. station_access_log: only service-role/admin can write; anon read denied (already)
DROP POLICY IF EXISTS "access_log_system_insert" ON public.station_access_log;

CREATE POLICY "access_log_admin_insert"
  ON public.station_access_log FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
-- Note: anonymous PIN attempt logging should now go via edge function with service role.

-- A11. configuracion_sitio: admin-only writes
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear configuracion" ON public.configuracion_sitio;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar configuracion" ON public.configuracion_sitio;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar configuracion" ON public.configuracion_sitio;

CREATE POLICY "Admins can manage configuracion"
  ON public.configuracion_sitio FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- A11. servicios
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear servicios" ON public.servicios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar servicios" ON public.servicios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar servicios" ON public.servicios;

CREATE POLICY "Admins can manage servicios"
  ON public.servicios FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- A11. testimonios
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear testimonios" ON public.testimonios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar testimonios" ON public.testimonios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar testimonios" ON public.testimonios;

CREATE POLICY "Admins can manage testimonios"
  ON public.testimonios FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- A11. partners
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear partners" ON public.partners;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar partners" ON public.partners;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar partners" ON public.partners;

CREATE POLICY "Admins can manage partners"
  ON public.partners FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- A3 (partial — non-breaking part). Remove public read on license verification tokens.
-- Public verify will need an edge function follow-up. Admin reads keep working.
DROP POLICY IF EXISTS "Public can read verification tokens" ON public.license_verification_tokens;
