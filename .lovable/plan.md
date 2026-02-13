

# Flujo Inteligente de Autenticacion: "Email-First"

## El Problema

Actualmente, la pagina de login (`/license/auth` y `/auth`) muestra dos tabs: "Iniciar Sesion" y "Registrarse". Los usuarios nuevos ingresan su email en "Iniciar Sesion" pensando que ya tienen cuenta, reciben un error, se frustran. Los usuarios existentes van a "Registrarse" y reciben un error de "email ya existe".

## La Solucion: Flujo "Email-First"

En lugar de forzar al usuario a elegir entre Login y Registro, el sistema detecta automaticamente el estado del email y adapta la interfaz.

```text
+----------------------------+
|    Fighter ID Portal       |
|                            |
|  Ingresa tu email:         |
|  [tu@email.com        ]    |
|  [  Continuar  ]           |
+----------------------------+
            |
     Email ingresado
            |
     +------+------+
     |             |
  Existe       No existe
     |             |
     v             v
+-----------+  +----------------+
| Paso 2A:  |  | Paso 2B:       |
| Password  |  | Crear cuenta   |
| [*****]   |  | Nombre: [   ]  |
| [Entrar]  |  | Apellido: [ ]  |
| Forgot?   |  | Password: [ ]  |
+-----------+  | Fecha nac: [ ] |
               | [Registrarse]  |
               +----------------+
```

## Como se detecta si el email existe

Se crea una Edge Function segura (`check-email-exists`) que:
1. Consulta `auth.users` por email (solo accesible desde el servidor con service_role)
2. Devuelve `{ exists: true/false }` sin revelar informacion sensible
3. Tiene rate limiting basico para evitar enumeracion masiva

Nota de seguridad: La enumeracion de emails es un riesgo conocido. Para mitigarlo:
- La Edge Function limita respuestas (no permite escaneo masivo)
- El mensaje al usuario es neutral ("Continuar" en ambos casos, sin revelar si existe antes de mostrar el formulario)
- Supabase ya tiene esta misma exposicion en su endpoint `signUp` (devuelve error si el email existe)

## Cambios Especificos

### 1. Nueva Edge Function: `check-email-exists`
- Recibe `{ email: string }`
- Usa `supabase.auth.admin.listUsers()` con filtro por email
- Devuelve `{ exists: boolean }`
- Solo accesible con la anon key (protegido por rate limiting de Supabase)

### 2. Modificar `/license/auth` (LicenseAuth.tsx)
- Reemplazar el sistema de Tabs por un flujo de 2 pasos:
  - **Paso 1**: Solo campo de email + boton "Continuar"
  - **Paso 2A** (email existe): Mostrar campo de password + boton "Iniciar Sesion" + link "Olvide mi contrasena"
  - **Paso 2B** (email no existe): Mostrar formulario de registro completo (nombre, apellido, password, fecha nacimiento)
- Agregar boton "Usar otro email" para volver al Paso 1
- Mantener todo el estilo visual actual (nebulosas, gradientes purple/blue)

### 3. Modificar `/auth` (Auth.tsx)
- Aplicar el mismo patron email-first
- Mantener la logica de invitaciones existente
- Mantener redirect a admin si es admin

### Lo que NO cambia
- El flujo post-registro (confirmacion por email, onboarding)
- AuthCallback y smart routing
- El sistema de invitaciones
- Las Edge Functions de email existentes
- El estilo visual general

## Seccion Tecnica

### Edge Function `check-email-exists`

```text
POST /check-email-exists
Body: { "email": "user@example.com" }
Response: { "exists": true }
```

La funcion usa `supabase.auth.admin.listUsers({ filter: email })` con el service_role key que ya esta disponible como `SUPABASE_SERVICE_ROLE_KEY` en las Edge Functions.

### Flujo de estados en el componente

```text
Estado: 'email' → 'login' | 'register'

email → (check-email-exists) → exists? → 'login'
                               → !exists? → 'register'

'login' → (signIn success) → smart routing
'register' → (signUp success) → email confirmation screen
```

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| `supabase/functions/check-email-exists/index.ts` | Crear |
| `src/pages/license/LicenseAuth.tsx` | Reescribir con flujo email-first |
| `src/pages/Auth.tsx` | Reescribir con flujo email-first |

