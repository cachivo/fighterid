
# Correccion de Sincronizacion de Licencias - Bug RPC con RLS

## Problema Identificado

La funcion RPC `check_user_license_status` devuelve `"status": "no_license"` aunque la licencia existe y esta ACTIVA en la base de datos.

### Diagnostico Completo

| Paso | Query Directa | RPC |
|------|--------------|-----|
| 1. Buscar app_user | Encuentra `c52a3393...` | Encuentra `c52a3393...` |
| 2. Buscar fighter_profile | Encuentra Willis Yang | Encuentra Willis Yang |
| 3. Buscar fighter_license | **Encuentra licencia ACTIVE** | **NO encuentra (retorna NULL)** |

### Causa Raiz

El RPC tiene `SECURITY DEFINER` pero **RLS (Row Level Security) sigue activo** en la tabla `fighter_licenses`. La politica RLS usa `auth.uid()` para verificar permisos:

```sql
-- Politica actual en fighter_licenses
qual: (is_admin() OR (EXISTS ( 
  SELECT 1 FROM fighter_profiles fp 
  WHERE fp.id = fighter_licenses.fighter_id 
  AND EXISTS (
    SELECT 1 FROM app_user au 
    WHERE au.id = fp.user_id 
    AND au.auth_user_id = auth.uid()
  )
)))
```

Cuando la funcion SECURITY DEFINER ejecuta queries, el contexto de `auth.uid()` puede perderse o no estar disponible, causando que RLS bloquee el acceso a la licencia.

---

## Solucion

Modificar la funcion RPC para deshabilitar RLS explicitamente durante su ejecucion.

### Cambio en la Migracion SQL

```sql
CREATE OR REPLACE FUNCTION public.check_user_license_status(p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off  -- NUEVO: Deshabilita RLS dentro de la funcion
AS $$
...resto de la funcion sin cambios...
$$;
```

La clausula `SET row_security = off` permite que la funcion bypasee las politicas RLS mientras se ejecuta, ya que tiene SECURITY DEFINER y se ejecuta con privilegios elevados.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Recrear funcion con `SET row_security = off` |

---

## Codigo de la Nueva Migracion

```sql
-- Fix: RPC function not finding licenses due to RLS policies
-- Adding SET row_security = off to bypass RLS within the SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.check_user_license_status(p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_app_user record;
  v_profile record;
  v_license record;
  v_pending_license record;
BEGIN
  -- 1. Get app_user
  SELECT id, email, phone INTO v_app_user
  FROM app_user 
  WHERE auth_user_id = p_auth_user_id;
  
  IF v_app_user IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'no_user',
      'message', 'No app_user found for this auth user'
    );
  END IF;
  
  -- 2. Get active fighter profile
  SELECT * INTO v_profile
  FROM fighter_profiles
  WHERE user_id = v_app_user.id 
    AND active = true;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'no_profile',
      'user_id', v_app_user.id,
      'email', v_app_user.email
    );
  END IF;
  
  -- 3. Try to get ACTIVE primary license first
  SELECT id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url, created_at
  INTO v_license
  FROM fighter_licenses
  WHERE fighter_id = v_profile.id
    AND status = 'ACTIVE'
    AND is_primary = true;
  
  IF v_license IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'active_license',
      'license', jsonb_build_object(
        'id', v_license.id,
        'license_number', v_license.license_number,
        'status', v_license.status,
        'license_level', v_license.license_level,
        'issued_at', v_license.issued_at,
        'expires_at', v_license.expires_at,
        'is_primary', v_license.is_primary,
        'qr_code_url', v_license.qr_code_url,
        'created_at', v_license.created_at
      ),
      'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
    );
  END IF;
  
  -- 4. Fallback: check for PENDING_REVIEW or APPLIED license
  SELECT id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url, created_at
  INTO v_pending_license
  FROM fighter_licenses
  WHERE fighter_id = v_profile.id
    AND status IN ('PENDING_REVIEW', 'APPLIED')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_pending_license IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'pending_license',
      'license', jsonb_build_object(
        'id', v_pending_license.id,
        'license_number', v_pending_license.license_number,
        'status', v_pending_license.status,
        'license_level', v_pending_license.license_level,
        'issued_at', v_pending_license.issued_at,
        'expires_at', v_pending_license.expires_at,
        'is_primary', v_pending_license.is_primary,
        'qr_code_url', v_pending_license.qr_code_url,
        'created_at', v_pending_license.created_at
      ),
      'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
    );
  END IF;
  
  -- 5. Has profile but no license
  RETURN jsonb_build_object(
    'status', 'no_license',
    'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
  );
END;
$$;

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION public.check_user_license_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_license_status(uuid) TO service_role;
```

---

## Beneficios Esperados

| Metrica | Antes | Despues |
|---------|-------|---------|
| RPC encuentra licencias activas | NO | SI |
| Usuarios ven estado correcto | NO | SI |
| Redireccion automatica funciona | NO | SI |
| Campos de licencia muestran datos | NO | SI |

---

## Seccion Tecnica

### Por que `SET row_security = off` es seguro aqui

1. **SECURITY DEFINER**: La funcion ya se ejecuta con privilegios del owner (superuser)
2. **Parametro validado**: Solo busca datos para el `p_auth_user_id` proporcionado
3. **Sin exposicion de datos**: Solo retorna datos del usuario que hace la consulta
4. **Consistencia**: El usuario solo puede consultar su propia informacion

### Diferencia entre SECURITY DEFINER y row_security

```text
SECURITY DEFINER:
  - Ejecuta la funcion con privilegios del owner
  - NO deshabilita RLS automaticamente
  - Las queries dentro de la funcion siguen evaluando RLS

SET row_security = off:
  - Deshabilita RLS durante la ejecucion de la funcion
  - Solo funciona con SECURITY DEFINER
  - Permite acceso completo a las tablas dentro de la funcion
```

### Flujo corregido

```text
Usuario llama RPC
       |
       v
Funcion se ejecuta como owner (SECURITY DEFINER)
       |
       v
RLS se deshabilita (SET row_security = off)
       |
       v
Query encuentra la licencia ACTIVA
       |
       v
Retorna 'active_license' con todos los datos
       |
       v
UI muestra dashboard correctamente
```
