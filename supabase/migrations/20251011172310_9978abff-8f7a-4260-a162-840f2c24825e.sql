-- Fix ambiguous expires_at column reference in generate_station_pin

CREATE OR REPLACE FUNCTION public.generate_station_pin(
  p_event_id UUID,
  p_station_number INTEGER,
  p_assigned_judge_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  session_id UUID,
  pin_code TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_pin TEXT;
  v_expires_at TIMESTAMPTZ;
  v_session_id UUID;
  v_event_end TIMESTAMPTZ;
BEGIN
  -- Verificar que el usuario sea admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can generate station PINs';
  END IF;

  -- Validar station_number
  IF p_station_number NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid station number: must be 1, 2, or 3';
  END IF;

  -- Obtener fecha de fin del evento
  SELECT end_time INTO v_event_end
  FROM bdg_event
  WHERE id = p_event_id;

  IF v_event_end IS NULL THEN
    -- Si no hay end_time, expirar en 24 horas
    v_expires_at := NOW() + INTERVAL '24 hours';
  ELSE
    -- Expirar cuando termine el evento (o 24h si ya pasó)
    v_expires_at := GREATEST(v_event_end, NOW() + INTERVAL '24 hours');
  END IF;

  -- Generar PIN único de 4 dígitos
  LOOP
    v_new_pin := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- CRITICAL FIX: Calificar explícitamente la columna expires_at
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM station_sessions
      WHERE station_sessions.pin_code = v_new_pin
        AND station_sessions.is_active = true
        AND station_sessions.expires_at > NOW()
    );
  END LOOP;

  -- Invalidar sesión anterior si existe
  UPDATE station_sessions
  SET is_active = false
  WHERE event_id = p_event_id
    AND station_number = p_station_number
    AND is_active = true;

  -- Crear nueva sesión con alias para evitar ambigüedad
  INSERT INTO station_sessions AS ss (
    event_id,
    station_number,
    pin_code,
    assigned_judge_id,
    expires_at,
    created_by
  ) VALUES (
    p_event_id,
    p_station_number,
    v_new_pin,
    p_assigned_judge_id,
    v_expires_at,
    p_created_by
  )
  RETURNING ss.id, ss.pin_code, ss.expires_at
  INTO v_session_id, v_new_pin, v_expires_at;

  RETURN QUERY SELECT v_session_id, v_new_pin, v_expires_at;
END;
$$;