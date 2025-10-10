-- ============================================================================
-- FASE 1: PROTECCIÓN INMEDIATA
-- ============================================================================

-- 1.1. Agregar review_status a fighter_updates
ALTER TABLE fighter_updates 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'PENDING' 
CHECK (review_status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_fighter_updates_review_status 
ON fighter_updates(review_status, created_at DESC);

-- 1.2. Actualizar RLS policies para fighter_updates
DROP POLICY IF EXISTS "Fighters can manage their own updates" ON fighter_updates;
DROP POLICY IF EXISTS "Public can view active updates" ON fighter_updates;

-- Policy: Fighters pueden crear updates (quedan en PENDING)
CREATE POLICY "Fighters can create their own updates" 
ON fighter_updates 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fighter_profiles fp
    JOIN app_user au ON au.id = fp.user_id
    WHERE fp.id = fighter_updates.fighter_id 
    AND au.auth_user_id = auth.uid()
  )
);

-- Policy: Fighters pueden ver sus propios updates (todos los estados)
CREATE POLICY "Fighters can view their own updates" 
ON fighter_updates 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fighter_profiles fp
    JOIN app_user au ON au.id = fp.user_id
    WHERE fp.id = fighter_updates.fighter_id 
    AND au.auth_user_id = auth.uid()
  )
);

-- Policy: Fighters pueden editar solo sus updates PENDING
CREATE POLICY "Fighters can edit pending updates" 
ON fighter_updates 
FOR UPDATE 
TO authenticated
USING (
  review_status = 'PENDING' AND
  EXISTS (
    SELECT 1 FROM fighter_profiles fp
    JOIN app_user au ON au.id = fp.user_id
    WHERE fp.id = fighter_updates.fighter_id 
    AND au.auth_user_id = auth.uid()
  )
);

-- Policy: Fighters pueden eliminar solo sus updates PENDING
CREATE POLICY "Fighters can delete pending updates" 
ON fighter_updates 
FOR DELETE 
TO authenticated
USING (
  review_status = 'PENDING' AND
  EXISTS (
    SELECT 1 FROM fighter_profiles fp
    JOIN app_user au ON au.id = fp.user_id
    WHERE fp.id = fighter_updates.fighter_id 
    AND au.auth_user_id = auth.uid()
  )
);

-- Policy: Público puede ver solo updates APPROVED
CREATE POLICY "Public can view approved updates" 
ON fighter_updates 
FOR SELECT 
TO public
USING (review_status = 'APPROVED' AND active = true);

-- ============================================================================
-- FASE 2: SISTEMA DE AUDITORÍA ROBUSTO
-- ============================================================================

-- 2.1. Crear tabla de auditoría universal
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'fighter_profile', 'fighter_update', 'doping_test', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now(),
  changes JSONB, -- Diff de cambios
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(performed_at DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Solo admins pueden ver logs
CREATE POLICY "Admins can view all audit logs" 
ON audit_log 
FOR SELECT 
USING (is_admin());

-- Policy: Sistema puede insertar logs
CREATE POLICY "System can insert audit logs" 
ON audit_log 
FOR INSERT 
WITH CHECK (true);

-- 2.2. Función para auditar cambios en fighter_profiles
CREATE OR REPLACE FUNCTION audit_fighter_profile_changes()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (entity_type, entity_id, action, performed_by, changes)
  VALUES (
    'fighter_profile',
    NEW.id,
    TG_OP,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      WHEN TG_OP = 'INSERT' THEN
        jsonb_build_object('new', to_jsonb(NEW))
      ELSE
        jsonb_build_object('old', to_jsonb(OLD))
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para fighter_profiles
DROP TRIGGER IF EXISTS audit_fighter_profile_trigger ON fighter_profiles;
CREATE TRIGGER audit_fighter_profile_trigger
AFTER INSERT OR UPDATE ON fighter_profiles
FOR EACH ROW EXECUTE FUNCTION audit_fighter_profile_changes();

-- 2.3. Función para auditar cambios en fighter_updates
CREATE OR REPLACE FUNCTION audit_fighter_updates_changes()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (entity_type, entity_id, action, performed_by, changes)
  VALUES (
    'fighter_update',
    NEW.id,
    TG_OP,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      WHEN TG_OP = 'INSERT' THEN
        jsonb_build_object('new', to_jsonb(NEW))
      ELSE
        jsonb_build_object('old', to_jsonb(OLD))
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para fighter_updates
DROP TRIGGER IF EXISTS audit_fighter_updates_trigger ON fighter_updates;
CREATE TRIGGER audit_fighter_updates_trigger
AFTER INSERT OR UPDATE ON fighter_updates
FOR EACH ROW EXECUTE FUNCTION audit_fighter_updates_changes();

-- 2.4. Función para auditar cambios en doping_tests
CREATE OR REPLACE FUNCTION audit_doping_tests_changes()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (entity_type, entity_id, action, performed_by, changes)
  VALUES (
    'doping_test',
    NEW.id,
    TG_OP,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      WHEN TG_OP = 'INSERT' THEN
        jsonb_build_object('new', to_jsonb(NEW))
      ELSE
        jsonb_build_object('old', to_jsonb(OLD))
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para doping_tests
DROP TRIGGER IF EXISTS audit_doping_tests_trigger ON doping_tests;
CREATE TRIGGER audit_doping_tests_trigger
AFTER INSERT OR UPDATE ON doping_tests
FOR EACH ROW EXECUTE FUNCTION audit_doping_tests_changes();

-- ============================================================================
-- FASE 3: NOTIFICACIONES (Base de datos)
-- ============================================================================

-- Habilitar realtime para las tablas relevantes
ALTER PUBLICATION supabase_realtime ADD TABLE profile_change_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE fighter_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE doping_tests;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;

-- ============================================================================
-- FASE 4: VALIDACIONES Y REGLAS DE NEGOCIO
-- ============================================================================

-- 4.1. Función para validar solicitudes de cambio de perfil
CREATE OR REPLACE FUNCTION validate_profile_change_request(
  p_fighter_id UUID,
  p_requested_changes JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_record RECORD;
  v_new_wins INT;
  v_current_wins INT;
  v_new_losses INT;
  v_current_losses INT;
  v_new_weight NUMERIC;
  v_weight_class TEXT;
BEGIN
  -- Obtener record actual
  SELECT * INTO v_current_record
  FROM fighter_profiles 
  WHERE id = p_fighter_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Fighter profile not found'
    );
  END IF;
  
  -- Validar que no se reduzcan victorias sin justificación
  IF p_requested_changes ? 'record_wins' THEN
    v_new_wins := (p_requested_changes->>'record_wins')::INT;
    v_current_wins := v_current_record.record_wins;
    
    IF v_new_wins < v_current_wins THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'No se pueden reducir las victorias. Si hay un error en el record, contacte al administrador.',
        'field', 'record_wins'
      );
    END IF;
  END IF;
  
  -- Validar que no se reduzcan derrotas (aunque sea raro, es para consistencia)
  IF p_requested_changes ? 'record_losses' THEN
    v_new_losses := (p_requested_changes->>'record_losses')::INT;
    v_current_losses := v_current_record.record_losses;
    
    IF v_new_losses < v_current_losses THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'No se pueden reducir las derrotas. Si hay un error en el record, contacte al administrador.',
        'field', 'record_losses'
      );
    END IF;
  END IF;
  
  -- Validar que el peso esté dentro de un rango razonable para la categoría
  IF p_requested_changes ? 'weight_kg' AND p_requested_changes ? 'weight_class' THEN
    v_new_weight := (p_requested_changes->>'weight_kg')::NUMERIC;
    v_weight_class := p_requested_changes->>'weight_class';
    
    -- Validación básica de rangos (en kg)
    CASE v_weight_class
      WHEN 'Strawweight' THEN
        IF v_new_weight > 52.2 THEN
          RETURN jsonb_build_object(
            'valid', false,
            'error', 'El peso excede el límite de la categoría Strawweight (52.2kg)',
            'field', 'weight_kg'
          );
        END IF;
      WHEN 'Flyweight' THEN
        IF v_new_weight > 56.7 THEN
          RETURN jsonb_build_object(
            'valid', false,
            'error', 'El peso excede el límite de la categoría Flyweight (56.7kg)',
            'field', 'weight_kg'
          );
        END IF;
      WHEN 'Bantamweight' THEN
        IF v_new_weight > 61.2 THEN
          RETURN jsonb_build_object(
            'valid', false,
            'error', 'El peso excede el límite de la categoría Bantamweight (61.2kg)',
            'field', 'weight_kg'
          );
        END IF;
      WHEN 'Featherweight' THEN
        IF v_new_weight > 65.8 THEN
          RETURN jsonb_build_object(
            'valid', false,
            'error', 'El peso excede el límite de la categoría Featherweight (65.8kg)',
            'field', 'weight_kg'
          );
        END IF;
      WHEN 'Lightweight' THEN
        IF v_new_weight > 70.3 THEN
          RETURN jsonb_build_object(
            'valid', false,
            'error', 'El peso excede el límite de la categoría Lightweight (70.3kg)',
            'field', 'weight_kg'
          );
        END IF;
      WHEN 'Welterweight' THEN
        IF v_new_weight > 77.1 THEN
          RETURN jsonb_build_object(
            'valid', false,
            'error', 'El peso excede el límite de la categoría Welterweight (77.1kg)',
            'field', 'weight_kg'
          );
        END IF;
      WHEN 'Middleweight' THEN
        IF v_new_weight > 83.9 THEN
          RETURN jsonb_build_object(
            'valid', false,
            'error', 'El peso excede el límite de la categoría Middleweight (83.9kg)',
            'field', 'weight_kg'
          );
        END IF;
      WHEN 'Light Heavyweight' THEN
        IF v_new_weight > 93.0 THEN
          RETURN jsonb_build_object(
            'valid', false,
            'error', 'El peso excede el límite de la categoría Light Heavyweight (93.0kg)',
            'field', 'weight_kg'
          );
        END IF;
      ELSE
        -- Heavyweight no tiene límite superior
        NULL;
    END CASE;
  END IF;
  
  -- Todas las validaciones pasaron
  RETURN jsonb_build_object('valid', true);
END;
$$ LANGUAGE plpgsql;

-- 4.2. Función para aprobar/rechazar fighter updates
CREATE OR REPLACE FUNCTION moderate_fighter_update(
  p_update_id UUID,
  p_new_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_update RECORD;
BEGIN
  -- Verificar que el usuario sea admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins can moderate updates'
    );
  END IF;
  
  -- Verificar que el estado sea válido
  IF p_new_status NOT IN ('APPROVED', 'REJECTED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid status. Must be APPROVED or REJECTED'
    );
  END IF;
  
  -- Obtener el update
  SELECT * INTO v_update
  FROM fighter_updates
  WHERE id = p_update_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Fighter update not found'
    );
  END IF;
  
  -- Actualizar el estado
  UPDATE fighter_updates
  SET 
    review_status = p_new_status,
    updated_at = now()
  WHERE id = p_update_id;
  
  -- Registrar en audit_log
  INSERT INTO audit_log (
    entity_type, 
    entity_id, 
    action, 
    performed_by, 
    metadata
  ) VALUES (
    'fighter_update',
    p_update_id,
    p_new_status,
    auth.uid(),
    jsonb_build_object('admin_notes', p_admin_notes)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Fighter update ' || LOWER(p_new_status)
  );
END;
$$ LANGUAGE plpgsql;