

# Flujo de Creacion de Gimnasios con Invitacion al Main Coach

## Resumen

Cuando el admin crea un gimnasio desde el panel, ingresa el email del entrenador principal. El sistema:
1. Crea el gimnasio
2. Envia un correo de invitacion al entrenador
3. Al confirmar su email y registrarse, el entrenador selecciona "Gimnasio" en la pantalla de roles
4. Se redirige automaticamente al dashboard de su gimnasio
5. Si el entrenador tambien pelea, puede seleccionar "Peleador" en otra sesion para acceder a ese modulo

---

## Cambios Necesarios

### 1. Nueva tabla `gym_invitations`

Similar a `fighter_invitations` pero especifica para gimnasios:

```text
gym_invitations
  id           uuid PK
  gym_id       uuid FK -> gyms.id
  email        text NOT NULL
  coach_name   text
  token        text UNIQUE
  status       text (pending/accepted/expired/cancelled)
  invited_by   uuid FK -> auth.users
  created_at   timestamptz
  expires_at   timestamptz
  accepted_at  timestamptz
```

### 2. Nueva Edge Function: `send-gym-invitation`

Basada en la estructura existente de `send-fighter-invitation`:
- Recibe: `gymId`, `email`, `coachName`
- Crea registro en `gym_invitations`
- Envia email con enlace `https://fighterid.lovable.app/auth?role=gym&invite_gym=TOKEN`
- Maneja duplicados y reenvios igual que fighter invitations
- Usa el sistema compartido de email (`_shared/email-config.ts`)

### 3. Modificar formulario "Crear Gimnasio" en `GimnasiosAdmin.tsx`

Agregar campo obligatorio:
- **Email del Entrenador Principal** (campo nuevo)
- **Nombre del Entrenador** (campo nuevo, opcional)

Al enviar el formulario:
1. Crear el gimnasio (como ahora)
2. Invocar `send-gym-invitation` con el email y gymId
3. Mostrar confirmacion de que se envio la invitacion

### 4. Modificar flujo de registro en `Auth.tsx`

Detectar parametro `invite_gym` en la URL:
- Pre-seleccionar rol "Gimnasio"
- Al registrarse y confirmar email, vincular automaticamente:
  - Crear `app_user` si no existe
  - Insertar en `gym_staff` con `role: 'OWNER'`
  - Asignar rol `gym_owner` en `user_roles`
  - Actualizar `gym_invitations.status = 'accepted'`
- Redirigir al dashboard del gimnasio

### 5. Caso: entrenador que tambien pelea

No requiere cambios adicionales. El flujo ya implementado en la sesion anterior lo maneja:
- Al iniciar sesion, el entrenador ve la pantalla de seleccion de modulo
- Si elige "Gimnasio" -> va al dashboard del gym
- Si elige "Peleador" -> va al flujo de licencia de peleador
- Puede alternar entre modulos cerrando sesion y seleccionando otro

---

## Detalle Tecnico

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `supabase/functions/send-gym-invitation/index.ts` | Edge function para enviar invitacion |
| Migracion SQL | Tabla `gym_invitations` + RLS |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/GimnasiosAdmin.tsx` | Agregar campos email/nombre del entrenador al formulario de creacion |
| `src/pages/Auth.tsx` | Detectar `invite_gym` param, vincular coach al gym post-registro |
| `src/pages/AuthCallback.tsx` | Mismo manejo de `invite_gym` para el callback de confirmacion de email |

### Flujo Completo

```text
Admin crea gimnasio
  |
  v
Ingresa email del entrenador -> Se crea gym + se envia invitacion
  |
  v
Entrenador recibe email -> Click en enlace
  |
  v
Llega a /auth?role=gym&invite_gym=TOKEN
  |
  +--> Si es usuario nuevo: se registra, confirma email
  |    -> Se vincula automaticamente como OWNER del gym
  |    -> Redirige a /gym/:id/dashboard
  |
  +--> Si ya tiene cuenta: inicia sesion
       -> Se vincula como OWNER del gym
       -> Redirige a /gym/:id/dashboard
```

### Edge Function: `send-gym-invitation`

Estructura identica a `send-fighter-invitation`:
- Verificar autenticacion y permisos de admin
- Validar que el gym existe
- Crear/actualizar registro en `gym_invitations`
- Enviar email usando `sendEmailWithFallback` con template de Fighter ID
- Manejar duplicados: reenviar si expiro, rechazar si ya fue aceptada

### Tabla `gym_invitations` - RLS

- SELECT: solo admins y el usuario invitado (por email match)
- INSERT: solo admins
- UPDATE: solo admins o el usuario aceptando su propia invitacion
- DELETE: solo admins

**Total: 2 archivos nuevos, 3 archivos modificados, 1 migracion SQL**

