

# Unificar Pagina de Autenticacion con Selector de Rol

Actualmente existen dos paginas de auth separadas (`/auth` y `/license/auth`) con logica duplicada. Vamos a crear una experiencia unificada en `/auth` donde el usuario selecciona su tipo de cuenta antes de registrarse o iniciar sesion.

## Flujo propuesto

```text
/auth
  |
  v
[Selector de Rol] -- 4 tarjetas visuales --
  |
  +--> Peleador    --> Email-first flow --> Registro --> /license/onboarding
  +--> Gimnasio    --> Email-first flow --> Registro --> /gym/dashboard
  +--> Juez        --> Email-first flow --> Registro --> /judge/...
  +--> Admin       --> Email-first flow --> Login    --> /admin/dashboard
  |
  (Login existente: detecta rol automaticamente y redirige)
```

## Experiencia del usuario

### Paso 0: Selector de tipo (solo para nuevos)
- 4 tarjetas con iconos claros: Peleador (guantes), Gimnasio (edificio), Juez (balanza), Administrador (escudo)
- Diseno mobile-first con cuadricula 2x2
- Boton "Ya tengo cuenta" abajo que salta directo al paso de email (login detecta rol automaticamente)

### Paso 1: Email (igual que ahora)
- Si el email ya existe -> login con contrasena, redireccion inteligente segun roles del usuario
- Si el email no existe -> registro con contrasena

### Paso 2: Post-registro (segun tipo seleccionado)
- **Peleador**: redirige a `/license/onboarding` (flujo existente con datos deportivos + documentos)
- **Gimnasio**: redirige a un nuevo onboarding simplificado `/gym/onboarding` (nombre del gym, direccion, telefono)
- **Juez**: redirige a `/judge/onboarding` (datos basicos + certificaciones)
- **Admin**: no se auto-registra, solo login. Los admins son asignados manualmente.

### Login (usuarios existentes)
- El sistema detecta automaticamente los roles del usuario en `user_roles` y `fighter_licenses`
- Redirige al dashboard correspondiente (prioridad: admin > gym > fighter > judge)

## Cambios tecnicos

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Auth.tsx` | Reescribir: agregar paso 0 con selector de rol, unificar logica de LicenseAuth, post-registro inteligente |
| `src/pages/AuthCallback.tsx` | Actualizar `determineUserDestination` para considerar roles de gym/judge ademas de fighter |
| `src/App.tsx` | Redirigir `/license/auth` a `/auth?role=fighter`, agregar rutas de onboarding para gym y judge |

### Archivos nuevos

| Archivo | Proposito |
|---------|-----------|
| `src/pages/gym/GymOnboarding.tsx` | Formulario simple: nombre del gimnasio, direccion, telefono, logo. Crea registro en `gyms` y asigna rol `gym_owner` |
| `src/pages/judge/JudgeOnboarding.tsx` | Formulario simple: nombre, certificaciones, experiencia. Asigna rol `official_judge` |

### Archivos a eliminar

| Archivo | Razon |
|---------|-------|
| `src/pages/license/LicenseAuth.tsx` | Logica absorbida por el nuevo `Auth.tsx` unificado. La ruta `/license/auth` redirige a `/auth?role=fighter` |

### Logica de redireccion post-login

El `Auth.tsx` unificado consultara `user_roles` para determinar el destino:

1. Si tiene rol `admin` o `super_admin` -> `/admin/dashboard`
2. Si tiene rol `gym_owner` o `gym_coach` -> `/gym/dashboard`
3. Si tiene rol `official_judge` -> `/judge/scorecard` (o estacion asignada)
4. Si tiene `fighter_license` activa -> `/license/dashboard`
5. Si tiene `fighter_license` pendiente -> `/license/pending`
6. Default -> `/` (landing publica)

### Almacenamiento del tipo seleccionado

- Se guarda `selectedRole` en `localStorage` durante el registro
- `AuthCallback.tsx` lo lee para redirigir al onboarding correcto despues de confirmar email
- Se limpia despues del primer login exitoso

## Lo que NO cambia

- El onboarding de peleador (`LicenseOnboarding.tsx`) permanece intacto
- La tabla `user_roles` y el sistema RBAC existente no se modifican
- Los dashboards de cada portal siguen funcionando igual
- El flujo de invitaciones de peleador sigue operando via query params

