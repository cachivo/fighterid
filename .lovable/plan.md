

## Plan: Rediseño del Flujo de Registro y Acceso a Módulos

### Problema actual
La pantalla de Auth obliga al usuario a seleccionar un rol (Peleador/Gimnasio/Juez/Admin) **antes** de registrarse. Esto confunde porque:
- Usuarios nuevos no saben qué elegir
- El registro y el onboarding de módulos están mezclados
- Después de confirmar email, la redirección depende del rol elegido en vez de llevar a un lugar universal
- Admin aparece como opción de registro cuando solo debería ser asignado

### Nuevo flujo propuesto

```text
┌─────────────────────────────────────────────┐
│  REGISTRO (simplificado)                     │
│  Email + Contraseña → Confirma email         │
│  Sin selección de rol                        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  POST-LOGIN: Landing pública (/)             │
│  Ve rankings, eventos, noticias, etc.        │
│  Header muestra: avatar + menú de módulos    │
└──────────────┬──────────────────────────────┘
               │ Usuario decide crear perfil
               ▼
┌─────────────────────────────────────────────┐
│  MENÚ DE MÓDULOS (desde Header o /profile/hub)│
│  • Crear perfil Peleador → /license/onboarding│
│  • Registrar Gimnasio → /gym/onboarding       │
│  • Ser Juez/Oficial → /judge/onboarding       │
│  • Panel Admin (solo si tiene rol admin)       │
└─────────────────────────────────────────────┘
```

### Cambios específicos

**1. `src/pages/Auth.tsx` — Simplificar registro**
- Eliminar paso `role-select` del registro
- Flujo: Email → (existe? Login : Registro) → Confirma email
- Eliminar la opción "Administrador" del registro
- Mantener flujos de invitación (fighter invite, gym invite) como excepciones que pre-seleccionan rol automáticamente
- Login directo sin selección de rol

**2. `src/pages/AuthCallback.tsx` — Redirección universal**
- Después de confirmar email: redirigir siempre a `/` (Home)
- Si el usuario ya tiene módulos activos y hace login normal: redirigir a `/` también
- Excepciones: invitaciones de gimnasio siguen redirigiendo al gym dashboard

**3. `src/pages/Auth.tsx` — Post-login routing**
- `routeAuthenticatedUser()`: siempre redirigir a `/` 
- Excepciones: si viene de invitación de gym/fighter, redirigir al módulo correspondiente

**4. `src/components/Header.tsx` — Agregar acceso a módulos**
- En el menú de usuario (dropdown del avatar), agregar sección "Mis Módulos":
  - Si tiene perfil peleador activo → "Mi Fighter ID" → `/license/dashboard`
  - Si es staff de gimnasio → "Mi Gimnasio" → `/gym/{id}/dashboard`
  - Si es admin → "Panel Admin" → `/admin/dashboard`
  - Siempre mostrar → "Gestionar Módulos" → `/profile/hub`

**5. `src/pages/profile/ProfileHub.tsx` — Mejorar como centro de módulos**
- Mantener como está pero accesible desde el Header en vez de ser destino obligatorio post-login
- Agregar botón "Volver al Inicio" prominente

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Auth.tsx` | Eliminar role-select, simplificar a email→password, post-login → `/` |
| `src/pages/AuthCallback.tsx` | Redirección post-confirmación siempre a `/` (excepto invitaciones) |
| `src/components/Header.tsx` | Agregar menú de módulos en dropdown del usuario |
| `src/pages/profile/ProfileHub.tsx` | Agregar "Volver al Inicio", mejorar como destino secundario |

### Lo que NO cambia
- Flujos de onboarding individuales (license, gym, judge) permanecen igual
- Sistema de roles en DB permanece igual
- Invitaciones por link siguen funcionando con su flujo especial
- Asignación de admin sigue siendo solo desde el panel UserRoles

