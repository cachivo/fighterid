
-- ===========================================
-- FASE 4: Sistema de Sanciones
-- ===========================================

-- 1. Tabla de sanciones
CREATE TABLE public.sanctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('fighter','coach','official','gym','organization')),
  target_id UUID NOT NULL,
  sanction_type TEXT NOT NULL CHECK (sanction_type IN ('suspension','fine','warning','license_revocation','ban')),
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  reason TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  fine_amount NUMERIC(10,2),
  fine_paid BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','decided','appealed','closed')),
  evidence_urls TEXT[],
  related_fight_id UUID REFERENCES public.fights(id),
  related_event_id UUID REFERENCES public.bdg_event(id),
  issued_by UUID REFERENCES auth.users(id),
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de apelaciones
CREATE TABLE public.sanction_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sanction_id UUID NOT NULL REFERENCES public.sanctions(id) ON DELETE CASCADE,
  appealed_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','accepted','rejected')),
  decision_notes TEXT,
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indices
CREATE INDEX idx_sanctions_target ON public.sanctions(target_type, target_id);
CREATE INDEX idx_sanctions_status ON public.sanctions(status);
CREATE INDEX idx_sanctions_type ON public.sanctions(sanction_type);
CREATE INDEX idx_sanction_appeals_sanction ON public.sanction_appeals(sanction_id);

-- 4. RLS
ALTER TABLE public.sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanction_appeals ENABLE ROW LEVEL SECURITY;

-- Sanctions: admins can do everything, everyone can read
CREATE POLICY "Anyone can view sanctions" ON public.sanctions FOR SELECT USING (true);
CREATE POLICY "Admins can insert sanctions" ON public.sanctions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin','technical_coordinator')));
CREATE POLICY "Admins can update sanctions" ON public.sanctions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin','technical_coordinator')));
CREATE POLICY "Super admins can delete sanctions" ON public.sanctions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- Appeals: authenticated users can create, admins can manage
CREATE POLICY "Anyone can view appeals" ON public.sanction_appeals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create appeals" ON public.sanction_appeals FOR INSERT
  WITH CHECK (auth.uid() = appealed_by);
CREATE POLICY "Admins can update appeals" ON public.sanction_appeals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin','technical_coordinator')));

-- 5. Trigger updated_at
CREATE TRIGGER update_sanctions_updated_at BEFORE UPDATE ON public.sanctions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sanction_appeals_updated_at BEFORE UPDATE ON public.sanction_appeals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
