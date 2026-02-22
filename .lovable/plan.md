

# Corregir Error Critico: Licencia No Detectada

## Problema

La funcion RPC `check_user_license_status` esta rota. Referencia el campo `v_profile.gym` que no existe en la tabla `fighter_profiles`. Los campos correctos son `gym_id` y `gym_name`.

Esto causa que TODOS los usuarios con licencia activa vean "Sin Licencia Oficial" porque el RPC falla con error `record "v_profile" has no field "gym"`, y el fallback legacy tampoco puede recuperar correctamente el estado.

Willis Yang tiene licencia ACTIVA (FGT-2025-006) en la base de datos, pero el sistema no la detecta por este error.

## Solucion

### 1. Corregir la funcion RPC (migracion SQL)

Crear una migracion que reemplace `v_profile.gym` por `v_profile.gym_name` en la funcion `check_user_license_status`.

Tambien agregar `gym_id` al JSON del perfil para que el frontend tenga acceso al ID del gimnasio si lo necesita.

### 2. Verificacion

Despues de aplicar la migracion, la funcion devolvera correctamente el estado `active_license` para Willis Yang y todos los demas peleadores con licencia activa.

## Detalle tecnico

| Archivo | Accion |
|---------|--------|
| `supabase/migrations/fix_license_rpc_gym_field.sql` | Crear: migracion que corrige `gym` a `gym_name` en el RPC |

Es un cambio de 1 linea en la funcion SQL. No hay cambios en archivos del frontend.

