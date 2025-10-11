-- Create judge station pins table
CREATE TABLE IF NOT EXISTS public.judge_station_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_number INTEGER NOT NULL CHECK (station_number IN (1, 2, 3)),
  pin_code TEXT NOT NULL,
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES public.judges(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(fight_id, station_number)
);

-- Create judge station sessions table for audit
CREATE TABLE IF NOT EXISTS public.judge_station_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_number INTEGER NOT NULL,
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES public.judges(id) ON DELETE SET NULL,
  pin_used TEXT NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  logout_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.judge_station_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_station_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for judge_station_pins
CREATE POLICY "Admins can manage station pins"
  ON public.judge_station_pins
  FOR ALL
  USING (is_admin());

CREATE POLICY "Judges can view pins for their fights"
  ON public.judge_station_pins
  FOR SELECT
  USING (
    judge_id = get_current_user_judge_id() OR
    is_admin()
  );

-- RLS Policies for judge_station_sessions
CREATE POLICY "Admins can view all sessions"
  ON public.judge_station_sessions
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert sessions"
  ON public.judge_station_sessions
  FOR INSERT
  WITH CHECK (true);

-- Function to validate station PIN
CREATE OR REPLACE FUNCTION public.validate_station_pin(
  p_station_number INTEGER,
  p_pin_code TEXT,
  p_fight_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pin_record RECORD;
  v_session_id UUID;
BEGIN
  -- Find matching PIN
  SELECT * INTO v_pin_record
  FROM public.judge_station_pins
  WHERE station_number = p_station_number
    AND pin_code = p_pin_code
    AND fight_id = p_fight_id
    AND active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'PIN inválido o expirado'
    );
  END IF;
  
  -- Create session record
  INSERT INTO public.judge_station_sessions (
    station_number,
    fight_id,
    judge_id,
    pin_used,
    login_at
  ) VALUES (
    p_station_number,
    p_fight_id,
    v_pin_record.judge_id,
    p_pin_code,
    now()
  ) RETURNING id INTO v_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'judge_id', v_pin_record.judge_id,
    'fight_id', p_fight_id,
    'station_number', p_station_number
  );
END;
$$;

-- Function to control round states (start, pause, end, cancel)
CREATE OR REPLACE FUNCTION public.control_round(
  p_round_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round RECORD;
  v_elapsed_ms BIGINT;
  v_result JSONB;
BEGIN
  -- Only admins and referees can control rounds
  IF NOT (is_admin() OR is_assigned_referee((SELECT fight_id FROM public.fight_rounds WHERE id = p_round_id))) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and assigned referees can control rounds';
  END IF;

  -- Get current round state
  SELECT * INTO v_round
  FROM public.fight_rounds
  WHERE id = p_round_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Round no encontrado'
    );
  END IF;
  
  -- Handle different actions
  CASE p_action
    WHEN 'start' THEN
      IF v_round.status = 'scheduled' THEN
        UPDATE public.fight_rounds
        SET status = 'live',
            starts_at = now(),
            updated_at = now()
        WHERE id = p_round_id;
        
        v_result := jsonb_build_object(
          'success', true,
          'message', 'Round iniciado',
          'status', 'live'
        );
      ELSIF v_round.status = 'paused' THEN
        -- Resume from pause
        v_elapsed_ms := EXTRACT(EPOCH FROM (v_round.ends_at - v_round.starts_at)) * 1000;
        
        UPDATE public.fight_rounds
        SET status = 'live',
            starts_at = now() - (v_elapsed_ms || ' milliseconds')::INTERVAL,
            ends_at = NULL,
            updated_at = now()
        WHERE id = p_round_id;
        
        v_result := jsonb_build_object(
          'success', true,
          'message', 'Round reanudado',
          'status', 'live'
        );
      ELSE
        v_result := jsonb_build_object(
          'success', false,
          'message', 'Round no puede ser iniciado desde estado: ' || v_round.status
        );
      END IF;
    
    WHEN 'pause' THEN
      IF v_round.status = 'live' THEN
        UPDATE public.fight_rounds
        SET status = 'paused',
            ends_at = now(),
            updated_at = now()
        WHERE id = p_round_id;
        
        v_result := jsonb_build_object(
          'success', true,
          'message', 'Round pausado',
          'status', 'paused'
        );
      ELSE
        v_result := jsonb_build_object(
          'success', false,
          'message', 'Solo rounds en vivo pueden ser pausados'
        );
      END IF;
    
    WHEN 'end' THEN
      IF v_round.status IN ('live', 'paused') THEN
        UPDATE public.fight_rounds
        SET status = 'ended',
            ends_at = COALESCE(ends_at, now()),
            updated_at = now()
        WHERE id = p_round_id;
        
        v_result := jsonb_build_object(
          'success', true,
          'message', 'Round finalizado',
          'status', 'ended'
        );
      ELSE
        v_result := jsonb_build_object(
          'success', false,
          'message', 'Solo rounds en vivo o pausados pueden ser finalizados'
        );
      END IF;
    
    WHEN 'cancel' THEN
      UPDATE public.fight_rounds
      SET status = 'cancelled',
          updated_at = now()
      WHERE id = p_round_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Round cancelado',
        'status', 'cancelled'
      );
    
    ELSE
      v_result := jsonb_build_object(
        'success', false,
        'message', 'Acción no válida: ' || p_action
      );
  END CASE;
  
  RETURN v_result;
END;
$$;