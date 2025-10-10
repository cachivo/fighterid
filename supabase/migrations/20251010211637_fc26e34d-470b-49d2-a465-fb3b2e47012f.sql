-- 1. Crear tabla fight_rounds
CREATE TABLE IF NOT EXISTS public.fight_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'paused', 'ended', 'cancelled')),
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(fight_id, number)
);

-- Enable RLS
ALTER TABLE public.fight_rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fight_rounds
CREATE POLICY "fight_rounds_admin_all" ON public.fight_rounds
  FOR ALL USING (is_admin());

CREATE POLICY "fight_rounds_public_read" ON public.fight_rounds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fights f
      JOIN public.bdg_event e ON f.event_id = e.id
      WHERE f.id = fight_rounds.fight_id
      AND e.state IN ('live', 'finished')
    )
  );

-- 2. Trigger: Auto-crear 3 rounds cuando se crea una pelea
CREATE OR REPLACE FUNCTION public.auto_create_fight_rounds()
RETURNS TRIGGER AS $$
DECLARE
  round_duration INTERVAL := '5 minutes';
BEGIN
  -- Crear 3 rounds automáticamente cuando se crea una pelea
  FOR i IN 1..3 LOOP
    INSERT INTO public.fight_rounds (
      fight_id,
      number,
      status,
      duration_seconds
    ) VALUES (
      NEW.id,
      i,
      'scheduled',
      300  -- 5 minutos en segundos
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_fight_created_create_rounds
  AFTER INSERT ON public.fights
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_fight_rounds();

-- 3. Función: Preparar pelea completa (crear rounds si no existen + asignar oficiales)
CREATE OR REPLACE FUNCTION public.prepare_fight_for_scoring(
  p_fight_id UUID,
  p_judge_1_id UUID,
  p_judge_2_id UUID,
  p_judge_3_id UUID,
  p_referee_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_round_ids UUID[];
BEGIN
  -- Verificar que la pelea existe
  IF NOT EXISTS (SELECT 1 FROM public.fights WHERE id = p_fight_id) THEN
    RAISE EXCEPTION 'Fight not found';
  END IF;
  
  -- Crear rounds si no existen (para peleas creadas antes del trigger)
  IF NOT EXISTS (SELECT 1 FROM public.fight_rounds WHERE fight_id = p_fight_id) THEN
    FOR i IN 1..3 LOOP
      INSERT INTO public.fight_rounds (fight_id, number, status, duration_seconds)
      VALUES (p_fight_id, i, 'scheduled', 300);
    END LOOP;
  END IF;
  
  -- Asignar jueces y referee (insertar o actualizar)
  INSERT INTO public.fight_officials (fight_id, official_id, role, confirmed)
  VALUES 
    (p_fight_id, p_judge_1_id, 'JUDGE_1', true),
    (p_fight_id, p_judge_2_id, 'JUDGE_2', true),
    (p_fight_id, p_judge_3_id, 'JUDGE_3', true),
    (p_fight_id, p_referee_id, 'REFEREE', true)
  ON CONFLICT (fight_id, official_id, role) DO UPDATE 
    SET confirmed = true;
  
  -- Obtener IDs de rounds existentes
  SELECT ARRAY_AGG(id ORDER BY number) INTO v_round_ids
  FROM public.fight_rounds WHERE fight_id = p_fight_id;
  
  -- Construir respuesta
  v_result := jsonb_build_object(
    'success', true,
    'fight_id', p_fight_id,
    'rounds', v_round_ids,
    'judge_panel_url', '/judge/fight/' || p_fight_id,
    'hud_url', '/hud/fight/' || p_fight_id,
    'message', 'Fight prepared successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Función: Control de rounds (start/pause/end/cancel)
CREATE OR REPLACE FUNCTION public.control_round(
  p_round_id UUID,
  p_action TEXT  -- 'start', 'pause', 'end', 'cancel'
) RETURNS JSONB AS $$
DECLARE
  v_round RECORD;
  v_result JSONB;
BEGIN
  -- Obtener round actual
  SELECT * INTO v_round FROM public.fight_rounds WHERE id = p_round_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found';
  END IF;
  
  -- Ejecutar acción según el tipo
  CASE p_action
    WHEN 'start' THEN
      UPDATE public.fight_rounds SET 
        status = 'live',
        starts_at = NOW()
      WHERE id = p_round_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', 'started',
        'round_id', p_round_id,
        'starts_at', NOW()
      );
      
    WHEN 'pause' THEN
      UPDATE public.fight_rounds SET status = 'paused' WHERE id = p_round_id;
      v_result := jsonb_build_object('success', true, 'action', 'paused');
      
    WHEN 'end' THEN
      UPDATE public.fight_rounds SET 
        status = 'ended',
        ends_at = NOW()
      WHERE id = p_round_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', 'ended',
        'ends_at', NOW()
      );
      
    WHEN 'cancel' THEN
      UPDATE public.fight_rounds SET status = 'cancelled' WHERE id = p_round_id;
      v_result := jsonb_build_object('success', true, 'action', 'cancelled');
      
    ELSE
      RAISE EXCEPTION 'Invalid action: %', p_action;
  END CASE;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Crear rounds para peleas existentes que no los tengan (one-time update)
INSERT INTO public.fight_rounds (fight_id, number, status, duration_seconds)
SELECT f.id, r.number, 'scheduled', 300
FROM public.fights f
CROSS JOIN generate_series(1, 3) AS r(number)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fight_rounds WHERE fight_id = f.id
)
ORDER BY f.id, r.number;