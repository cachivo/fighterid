-- Add RLS Policies and Security Functions for Fight Control System

-- Security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_judge_id()
RETURNS UUID 
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT j.id FROM public.judges j 
  JOIN public.app_user u ON j.email = u.email 
  WHERE u.auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_judge(p_fight_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL  
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fight_officials fo
    WHERE fo.fight_id = p_fight_id 
    AND fo.official_id = public.get_current_user_judge_id()
    AND fo.role LIKE 'JUDGE_%'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_referee(p_fight_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER  
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fight_officials fo
    WHERE fo.fight_id = p_fight_id
    AND fo.official_id = public.get_current_user_judge_id()
    AND fo.role = 'REFEREE'
  );
$$;

-- RLS Policies for JUDGES table
CREATE POLICY "judges_admin_all" ON public.judges FOR ALL USING (is_admin());

CREATE POLICY "judges_self_read" ON public.judges FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() 
    AND email = judges.email
  )
);

CREATE POLICY "judges_public_read_basic" ON public.judges FOR SELECT USING (
  active = true -- Public can see basic info of active judges
);

-- RLS Policies for FIGHT_OFFICIALS table  
CREATE POLICY "fight_officials_admin_all" ON public.fight_officials FOR ALL USING (is_admin());

CREATE POLICY "fight_officials_self_read" ON public.fight_officials FOR SELECT USING (
  official_id = public.get_current_user_judge_id()
);

CREATE POLICY "fight_officials_public_read" ON public.fight_officials FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fights f 
    JOIN public.bdg_event e ON f.event_id = e.id
    WHERE f.id = fight_officials.fight_id 
    AND e.state IN ('live', 'finished')
  )
);

-- RLS Policies for FIGHT_SCORECARDS table
CREATE POLICY "scorecards_admin_all" ON public.fight_scorecards FOR ALL USING (is_admin());

CREATE POLICY "scorecards_judge_insert" ON public.fight_scorecards FOR INSERT WITH CHECK (
  judge_id = public.get_current_user_judge_id() 
  AND public.is_assigned_judge(fight_id)
);

CREATE POLICY "scorecards_judge_update" ON public.fight_scorecards FOR UPDATE USING (
  judge_id = public.get_current_user_judge_id()
  AND public.is_assigned_judge(fight_id)
);

CREATE POLICY "scorecards_judge_read" ON public.fight_scorecards FOR SELECT USING (
  judge_id = public.get_current_user_judge_id() 
  OR is_admin()
);

CREATE POLICY "scorecards_public_read_finished" ON public.fight_scorecards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fights f 
    JOIN public.bdg_event e ON f.event_id = e.id
    WHERE f.id = fight_scorecards.fight_id 
    AND e.state = 'finished'
  )
);

-- RLS Policies for FIGHT_CONTROL_EVENTS table
CREATE POLICY "control_events_admin_all" ON public.fight_control_events FOR ALL USING (is_admin());

CREATE POLICY "control_events_referee_insert" ON public.fight_control_events FOR INSERT WITH CHECK (
  referee_id = public.get_current_user_judge_id()
  AND public.is_assigned_referee(fight_id)
);

CREATE POLICY "control_events_referee_read" ON public.fight_control_events FOR SELECT USING (
  referee_id = public.get_current_user_judge_id()
  OR is_admin()
);

CREATE POLICY "control_events_public_read_live" ON public.fight_control_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fights f
    JOIN public.bdg_event e ON f.event_id = e.id  
    WHERE f.id = fight_control_events.fight_id
    AND e.state IN ('live', 'finished')
  )
);

-- RLS Policies for FIGHT_STATISTICS table  
CREATE POLICY "statistics_admin_all" ON public.fight_statistics FOR ALL USING (is_admin());

CREATE POLICY "statistics_public_read" ON public.fight_statistics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fights f
    JOIN public.bdg_event e ON f.event_id = e.id
    WHERE f.id = fight_statistics.fight_id  
    AND e.state IN ('live', 'finished')
  )
);

-- RLS Policies for FIGHT_RESULTS table
CREATE POLICY "results_public_read" ON public.fight_results FOR SELECT USING (true);
CREATE POLICY "results_admin_insert" ON public.fight_results FOR INSERT WITH CHECK (is_admin());  
CREATE POLICY "results_admin_update" ON public.fight_results FOR UPDATE USING (is_admin());
CREATE POLICY "results_admin_delete" ON public.fight_results FOR DELETE USING (is_admin());

-- Add triggers for updated_at columns
CREATE TRIGGER update_judges_updated_at 
  BEFORE UPDATE ON public.judges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create comprehensive indexes for performance
CREATE INDEX idx_judges_active_cert ON public.judges(active, certification_level);
CREATE INDEX idx_judges_email ON public.judges(email) WHERE email IS NOT NULL;
CREATE INDEX idx_judges_license ON public.judges(license_number);

CREATE INDEX idx_fight_officials_fight_role ON public.fight_officials(fight_id, role);
CREATE INDEX idx_fight_officials_official ON public.fight_officials(official_id);
CREATE INDEX idx_fight_officials_confirmed ON public.fight_officials(fight_id) WHERE confirmed = true;

CREATE INDEX idx_scorecards_fight_judge_round ON public.fight_scorecards(fight_id, judge_id, round_number);
CREATE INDEX idx_scorecards_submitted ON public.fight_scorecards(fight_id, submitted_at);

CREATE INDEX idx_control_events_fight_type ON public.fight_control_events(fight_id, event_type);
CREATE INDEX idx_control_events_timestamp ON public.fight_control_events(fight_id, timestamp);
CREATE INDEX idx_control_events_referee ON public.fight_control_events(referee_id);

CREATE INDEX idx_statistics_fight_round_fighter ON public.fight_statistics(fight_id, round_number, fighter_id);
CREATE INDEX idx_statistics_fighter ON public.fight_statistics(fighter_id);

CREATE INDEX idx_results_winner ON public.fight_results(winner_id);
CREATE INDEX idx_results_type ON public.fight_results(result_type);
CREATE INDEX idx_results_confirmed ON public.fight_results(confirmed_at) WHERE confirmed_at IS NOT NULL;