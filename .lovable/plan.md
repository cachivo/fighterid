

# Correccion de Flujo de Onboarding por Modulo + Solucion de Emails en Spam

## Problemas Identificados

### Problema 1: Gimnasio redirige al formulario de Peleador
Cuando un usuario selecciona "Gimnasio" y se registra, el `AuthCallback` lo envia a `/gym/onboarding` (si no hay sesion) o a `resolveGymDestination()` (si hay sesion). Pero `resolveGymDestination()` busca en `gym_staff` por `user_id` -- y como el usuario es nuevo, no tiene registro ahi, entonces lo manda a `/gimnasios` (pagina publica). Si la sesion no se establece en el callback, lo manda a `/gym/onboarding` que esta protegido por `SuperAdminRoute`, asi que un usuario normal no puede acceder.

**Causa raiz**: El onboarding de gimnasio (`/gym/onboarding`) esta envuelto en `SuperAdminRoute` en App.tsx linea 233, bloqueando el acceso a usuarios nuevos. Ademas, el flujo normal para gimnasios nuevos deberia ser a traves de la invitacion del admin, no auto-registro.

### Problema 2: Juez cae al formulario de Peleador
Cuando un juez confirma su email sin sesion activa, el callback linea 49 lo envia a `/judge/onboarding` correctamente. Pero si la sesion SI se establece, `determineUserDestination()` cae al default (`resolveFighterDestination`) que lo manda a `/license/onboarding` -- el formulario de peleador.

### Problema 3: No hay deteccion de cuentas con multiples roles
El sistema no verifica si un usuario ya tiene un perfil de peleador al registrarse como gimnasio o juez, ni viceversa. Cada modulo opera de forma independiente.

### Problema 4: Emails caen en spam

Esto es un problema de configuracion de dominio, **no de codigo**. El sistema ya usa `notificaciones@fighter-id.org` como remitente. Para que los emails no caigan en spam se necesita configurar registros DNS en el proveedor de dominio de `fighter-id.org`.

---

## Plan de Implementacion

### Paso 1: Corregir rutas en App.tsx

- Remover `SuperAdminRoute` del wrapper de `/gym/onboarding` para que cualquier usuario autenticado pueda acceder
- La creacion de gimnasios desde el admin panel sigue protegida por `AdminProtectedRoute`
- El onboarding es solo para usuarios invitados por el admin

### Paso 2: Corregir logica de redireccion en AuthCallback.tsx

Actualizar `determineUserDestination()` para que cuando `savedRole === 'gym'` y el usuario no tiene `gym_staff`, lo redirija correctamente:
- Si tiene invitacion de gimnasio pendiente: procesarla
- Si no tiene gym_staff: mostrar mensaje de que necesita una invitacion del admin

Actualizar el bloque sin sesion (linea 44-53) para manejar correctamente cada rol.

### Paso 3: Corregir logica de redireccion en Auth.tsx

Actualizar `routeAuthenticatedUser()` para que:
- `gym` sin `gym_staff` -> muestre un mensaje informativo en vez de redirigir al formulario de peleador
- `judge` sin registro -> vaya a `/judge/onboarding` correctamente
- `fighter` -> siga el flujo actual de licencia

### Paso 4: Crear pagina informativa para gym sin invitacion

Crear una pagina simple `/gym/pending-invitation` que muestre:
- "Tu cuenta esta lista. Un administrador te vinculara a tu gimnasio."
- Contacto del admin para solicitar vinculacion

### Paso 5: Emails en Spam - Acciones Requeridas

**Esto NO se soluciona con codigo.** Se necesita configurar en el proveedor DNS de `fighter-id.org`:

1. **SPF Record** (TXT): Autorizar a Resend como servidor de envio
2. **DKIM Record** (CNAME): Firma digital para autenticar emails
3. **DMARC Record** (TXT): Politica de autenticacion de email

Estos registros se obtienen del dashboard de Resend (resend.com) en la seccion "Domains" y se agregan en el panel DNS del proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.).

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Remover `SuperAdminRoute` de `/gym/onboarding` |
| `src/pages/AuthCallback.tsx` | Corregir redireccion para gym y judge |
| `src/pages/Auth.tsx` | Corregir `routeAuthenticatedUser` para gym sin staff |
| `src/pages/gym/GymOnboarding.tsx` | Agregar verificacion de invitacion pendiente |

## Archivo Nuevo

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/gym/GymPendingInvitation.tsx` | Pagina informativa para usuarios gym sin invitacion |

---

## Detalle Tecnico

### AuthCallback - Redireccion corregida

```text
determineUserDestination(authUserId):
  savedRole = localStorage
  
  if savedRole == 'gym':
    -> buscar gym_staff activo
    -> SI tiene: /gym/:id/dashboard  
    -> NO tiene: /gym/pending-invitation
    
  if savedRole == 'judge':
    -> buscar en judges table
    -> SI tiene: / (home, esperando aprobacion)
    -> NO tiene: /judge/onboarding
    
  if savedRole == 'fighter':
    -> flujo actual (license/onboarding -> pending -> dashboard)
```

### App.tsx - Ruta corregida

```text
Antes:  ProtectedRoute > SuperAdminRoute > GymOnboarding
Ahora:  ProtectedRoute > GymOnboarding
```

### Emails - Pasos en Resend Dashboard

1. Ir a resend.com/domains
2. Agregar dominio `fighter-id.org`
3. Copiar los registros DNS que Resend proporciona
4. Agregar esos registros en el panel DNS del proveedor
5. Esperar verificacion (puede tomar 24-48 horas)
6. Una vez verificado, los emails ya no caeran en spam

**Importante**: Si el dominio `fighter-id.org` ya esta verificado en Resend, el problema podria ser que la API key no esta scoped a ese dominio. En ese caso, crear una nueva API key en Resend scoped a `fighter-id.org` y actualizar el secret `RESEND_API_KEY`.

