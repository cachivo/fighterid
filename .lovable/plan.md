

# Cuenta Maestra + Gestor de Imagenes del Sistema

## Resumen

Crear un rol "super_admin" exclusivo para cachivo@gmail.com que permita editar imagenes y configuraciones visuales del sistema (logos, fondos, wallpapers) desde el panel de administracion. Los demas admins solo podran gestionar peleas y contenido operativo.

---

## Parte 1: Rol Super Admin

### Base de datos
- Agregar `super_admin` al enum `app_role` existente
- Insertar el rol `super_admin` para el usuario `cachivo@gmail.com` (user_id: `d9204e92-eb8c-4ed4-95b0-3b9dd8423bd7`)
- Crear funcion RPC `is_super_admin()` similar a `has_role()` pero especifica para super_admin

### Frontend
- Crear hook `useSuperAdmin()` que verifica si el usuario actual tiene rol `super_admin`
- Modificar `AdminSidebar.tsx` para mostrar "Configuracion" y "Gestion de Roles" solo si es super_admin
- Los admins regulares veran solo las secciones de peleas, eventos, peleadores, etc.

---

## Parte 2: Gestor Visual de Assets del Sistema

### Imagenes que se podran cambiar desde el panel

| Asset | Donde se usa | Clave en configuracion_sitio |
|-------|-------------|------------------------------|
| Logo principal (Fighter ID) | Header, Footer, Mobile menu | `system_logo_url` |
| Fondo del ranking | Seccion Ranking | `system_ranking_bg_url` |
| Logo UCC | Eventos, Branding | `system_ucc_logo_url` |
| Logo Hoodfights | Eventos, Branding | `system_hoodfights_logo_url` |
| Fondo octagon | Perfil social | `system_octagon_bg_url` |
| Background Hero | Seccion Hero (gradientes) | `system_hero_bg_url` |

### Nueva pagina: `/admin/system-assets`
- Interfaz visual con preview de cada imagen actual
- Boton de upload para cada una (sube a Supabase Storage bucket `system-assets`)
- Al subir, actualiza la clave correspondiente en `configuracion_sitio`
- Solo accesible si el usuario es `super_admin`

### Hook `useSystemAssets()`
- Lee las claves `system_*` de `configuracion_sitio`
- Cachea con React Query (staleTime largo)
- Devuelve URLs o fallback a las imagenes hardcodeadas actuales
- Se usa en Header, Footer, Ranking, EventDetail, etc.

---

## Parte 3: Proteccion de Secciones

### Secciones solo para super_admin
- Configuracion del Sitio (`/admin/configuracion`)
- Gestion de Roles (`/admin/user-roles`)
- Gestion de Assets (`/admin/system-assets`) - NUEVA

### Secciones para todos los admins
- Dashboard, Eventos, Peleadores, Gimnasios, Entrenadores
- Control de Peleas, Jueces, Estaciones, Resultados
- Monitor de IA, Betting, Comunidad

---

## Detalles Tecnicos

### Migracion SQL

```sql
-- 1. Agregar super_admin al enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Asignar rol a cachivo@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('d9204e92-eb8c-4ed4-95b0-3b9dd8423bd7', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Crear bucket para assets del sistema
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT DO NOTHING;

-- 4. RLS para el bucket (solo super_admin puede subir)
CREATE POLICY "Super admins can upload system assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'system-assets' 
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Anyone can view system assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'system-assets');

-- 5. Insertar configuraciones iniciales con valores actuales
INSERT INTO configuracion_sitio (clave, valor, descripcion) VALUES
('system_logo_url', '/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png', 'Logo principal del sistema'),
('system_ranking_bg_url', '/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png', 'Fondo de la seccion de ranking'),
('system_ucc_logo_url', '/lovable-uploads/ucc-logo-transparent.png', 'Logo de UCC'),
('system_hoodfights_logo_url', '/lovable-uploads/honduras-hoodfights-logo.png', 'Logo de Hoodfights'),
('system_octagon_bg_url', '/lovable-uploads/octagon-background.png', 'Fondo octagon para perfiles')
ON CONFLICT DO NOTHING;
```

### Hook useSuperAdmin

```typescript
// Verifica si el usuario actual tiene rol super_admin
export function useSuperAdmin() {
  // Consulta user_roles buscando role = 'super_admin'
  // Retorna { isSuperAdmin, loading }
}
```

### Hook useSystemAssets

```typescript
// Lee las claves system_* de configuracion_sitio
// Retorna { logoUrl, rankingBgUrl, uccLogoUrl, ... }
// Con fallbacks a las URLs hardcodeadas actuales
```

### Componentes a modificar para usar assets dinamicos

| Componente | Cambio |
|-----------|--------|
| `Header.tsx` | Logo de `useSystemAssets().logoUrl` |
| `Footer.tsx` | Logo de `useSystemAssets().logoUrl` |
| `Ranking.tsx` | Background de `useSystemAssets().rankingBgUrl` |
| `EventDetail.tsx` | Logos de marca de `useSystemAssets()` |
| `EventBrandingModal.tsx` | Logos predefinidos de `useSystemAssets()` |
| `AdminSidebar.tsx` | Ocultar secciones de sistema si no es super_admin |
| `AdminLayout.tsx` | Logo dinamico |

### Nueva pagina SystemAssets

Interfaz con tarjetas para cada imagen del sistema, cada una con:
- Preview de la imagen actual
- Boton "Cambiar" que abre file picker
- Sube al bucket `system-assets`
- Actualiza `configuracion_sitio` con la nueva URL
- Preview en tiempo real del cambio

---

## Archivos a crear

| Archivo | Descripcion |
|---------|-------------|
| `src/hooks/useSuperAdmin.tsx` | Hook para verificar rol super_admin |
| `src/hooks/useSystemAssets.tsx` | Hook para leer assets del sistema |
| `src/pages/admin/SystemAssets.tsx` | Pagina de gestion de imagenes |
| `src/components/SuperAdminRoute.tsx` | Proteccion de rutas super_admin |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Agregar ruta `/admin/system-assets` |
| `src/components/AdminSidebar.tsx` | Filtrar menu segun rol |
| `src/components/Header.tsx` | Usar logo dinamico |
| `src/components/Footer.tsx` | Usar logo dinamico |
| `src/components/sections/Ranking.tsx` | Usar fondo dinamico |
| `src/components/admin/EventBrandingModal.tsx` | Usar logos dinamicos |
| Migracion SQL | Enum + rol + bucket + datos iniciales |

