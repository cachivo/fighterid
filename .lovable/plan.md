
# Auditoria de Operatividad Movil - Fighter ID

## Estado General: BUENO con 5 problemas a corregir

La aplicacion esta bien optimizada para movil en general: botones con `min-h-[44px]`, clases `touch-manipulation`, layouts responsivos con `flex-col sm:flex-row`, y carga diferida con `React.lazy`. Sin embargo, se identificaron problemas criticos que afectan la experiencia del usuario en dispositivos moviles.

---

## Problemas Identificados

### 1. CRITICO: RPC `check_user_license_status` retorna `no_license` incorrectamente

El RPC retorna `no_license` para usuarios con licencia ACTIVA (ej: Willis Yang, `FGT-2025-006`). Aunque el perfil tiene `primary_license_id` apuntando a una licencia con status `ACTIVE`, la funcion falla en encontrarla. Esto causa:
- 4 llamadas redundantes al RPC en cada carga de pagina (visible en console logs)
- El fallback directo (`[FALLBACK] Direct fetch found ACTIVE license!`) rescata la situacion pero agrega latencia innecesaria
- En conexiones lentas (2G/3G), estas 4+ llamadas extras pueden tardar 8-12 segundos adicionales

**Impacto movil**: Tiempo de carga del dashboard duplicado en redes lentas.

**Solucion**: Reescribir la funcion RPC para simplificar la logica de busqueda de licencia, eliminando la cascada de fallbacks que no esta funcionando correctamente.

### 2. MEDIO: Service Worker no excluye rutas OAuth

El `sw.js` no tiene exclusion para rutas `/~oauth` ni `/auth/callback`. Si un usuario instala la PWA y luego intenta autenticarse via OAuth (si se implementa en el futuro), el Service Worker podria interceptar y cachear la redireccion, causando un loop infinito de autenticacion.

**Solucion**: Agregar exclusion explicita en `sw.js`:
```javascript
if (url.pathname.startsWith('/~oauth') || url.pathname.startsWith('/auth/callback')) {
  return; // Never cache auth redirects
}
```

### 3. MEDIO: Footer usa enlaces nativos `<a href>` en lugar de React Router

En `Footer.tsx`, los enlaces del footer (lineas 37-39, 46-48) usan `<a href="#">` nativos. Al hacer click en estos desde movil:
- Se recarga la pagina completa
- Se pierde el estado de autenticacion temporalmente
- El enlace `/license/auth` en linea 46 causa recarga completa

**Solucion**: Reemplazar con `<Link to="">` de React Router.

### 4. BAJO: `viewport` bloquea zoom del usuario

En `index.html` linea 5: `maximum-scale=1.0, user-scalable=no`. Esto viola las pautas de accesibilidad WCAG 2.1 (criterio 1.4.4) y puede ser problematico para usuarios con discapacidad visual que necesitan hacer zoom.

**Solucion**: Cambiar a `maximum-scale=5.0` y eliminar `user-scalable=no`.

### 5. BAJO: `useLicenseAuth` ejecuta `checkLicenseStatus` 4 veces en montaje

Los console logs muestran que al cargar la pagina principal, `checkLicenseStatus` se ejecuta 4 veces identicas en paralelo. Esto es causado por la combinacion de:
- `onAuthStateChange` dispara una verificacion
- `getSession()` dispara otra verificacion
- Cada una causa un re-render que dispara nuevamente

**Solucion**: Agregar un flag de debounce o `useRef` para prevenir ejecuciones duplicadas.

---

## Lo que FUNCIONA BIEN en movil

- Header responsivo con menu hamburguesa funcional (Sheet)
- Botones con tamanos tactiles adecuados (44px minimo)
- Pagina de autenticacion bien centrada y legible
- "Olvide mi contrasena" navega correctamente (corregido en auditoria anterior)
- QuickStats con scroll horizontal y snap
- FighterCards responsivas
- PWA manifest correctamente configurado
- Carga diferida de componentes pesados
- Filtros con `min-h-[44px]` y `touch-manipulation`

---

## Plan de Implementacion

### Paso 1: Corregir RPC `check_user_license_status`
Reescribir la funcion para simplificar: si el perfil tiene `primary_license_id`, buscar directamente y retornar. Eliminar la cascada compleja de fallbacks que causa el bug.

### Paso 2: Agregar exclusiones al Service Worker
Actualizar `public/sw.js` para no interceptar rutas de autenticacion.

### Paso 3: Corregir enlaces del Footer
Reemplazar `<a href>` por `<Link to>` en `src/components/Footer.tsx`.

### Paso 4: Corregir viewport meta tag
Actualizar `index.html` para permitir zoom del usuario.

### Paso 5: Debounce de `checkLicenseStatus`
Agregar proteccion contra ejecuciones duplicadas en `src/hooks/useLicenseAuth.tsx`.

---

## Seccion Tecnica

### Archivos a modificar:
1. **Migracion SQL** - Reescribir `check_user_license_status` con logica simplificada
2. **`public/sw.js`** - Agregar exclusiones para `/~oauth` y `/auth/callback`
3. **`src/components/Footer.tsx`** - Reemplazar `<a>` por `<Link>`
4. **`index.html`** - Corregir meta viewport
5. **`src/hooks/useLicenseAuth.tsx`** - Agregar debounce con `useRef`

### Prioridad de ejecucion:
1. RPC fix (critico - afecta rendimiento en redes lentas)
2. Debounce de license check (medio - reduce llamadas redundantes)
3. Footer links (medio - mantiene integridad SPA)
4. Service Worker exclusions (medio - previene problemas futuros)
5. Viewport meta (bajo - accesibilidad)
