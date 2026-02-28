
# Auditoria Estetica: Panel de Administracion al Tema Combat UFC

## Problema Detectado

El panel de administracion mantiene una estetica generica de dashboard "light mode" que no corresponde con el manual de diseno Combat UFC implementado en el resto de la aplicacion. Ejemplos concretos:

- **ValidacionLicencias**: Usa `bg-amber-50/50`, `border-amber-200`, `text-amber-700`, `bg-white` -- colores claros que chocan con el fondo negro
- **LicenseCard**: Usa `bg-white` para cards pendientes, `hover:bg-blue-50`, `border-blue-200` -- completamente fuera del tema oscuro
- **Dashboard**: Usa `text-blue-600`, `text-green-600`, `text-purple-600` directamente en vez de tokens del sistema (`text-primary`, `text-fighter-success`, etc.)
- **AdminLayout header**: Usa `bg-background` generico sin identidad visual combat
- **AdminSidebar header**: Solo dice "Admin Panel" en texto, sin branding visual coherente

## Alcance de Cambios

### 1. AdminLayout (`src/components/AdminLayout.tsx`)
- Header con borde inferior rojo sutil (`border-primary/30`) en vez de `border-b` generico
- Titulo "Panel de Administracion" con clase `ufc-label` para Barlow Condensed uppercase
- Fondo del main area: `bg-background` puro (negro) en vez de `bg-muted/10`

### 2. AdminSidebar (`src/components/AdminSidebar.tsx`)
- Header: agregar linea decorativa roja debajo del titulo "Admin Panel"
- Items activos: usar `bg-primary/15 text-primary border-l-2 border-primary` en vez de `bg-muted`
- Group labels: aplicar `ufc-label` (Barlow Condensed uppercase tracking)
- Footer: boton "Cerrar Sesion" con estilo `combat-card` (borde izquierdo rojo)

### 3. Dashboard (`src/pages/admin/Dashboard.tsx`)
- Stats cards: agregar clase `combat-card` (borde izquierdo rojo)
- Iconos: reemplazar colores directos (`text-blue-600`, `text-purple-600`) por tokens del tema (`text-primary`, `text-fighter-success`, `text-fighter-info`)
- Card de AI: cambiar gradiente a usar `from-primary/10 to-primary/5` sobre fondo oscuro
- Seccion "Acciones Rapidas": bordes con `border-primary/20` en vez de `border` generico
- "Estado del Sistema": status colors usando tokens (`text-fighter-success`, `text-fighter-danger`)

### 4. ValidacionLicencias (`src/pages/admin/ValidacionLicencias.tsx`)
- Card de pendientes: cambiar `border-amber-200 bg-amber-50/50` por `border-fighter-warning/30 bg-fighter-warning/5`
- Titulo pendientes: `text-fighter-warning` en vez de `text-amber-700`
- Card de licencias activas: usar `combat-card` con borde izquierdo

### 5. LicenseCard (`src/components/admin/LicenseCard.tsx`)
- Card pendiente: cambiar `border-amber-200 bg-white` por `border-fighter-warning/30 bg-card`
- Card normal: mantener `bg-card/50` (ya es correcto para tema oscuro)
- Botones: Revisar `hover:bg-blue-50` -> `hover:bg-primary/10`, Aprobar `bg-green-600` -> `bg-fighter-success`
- Event card interna: ya usa `bg-primary/5` (correcto)

### 6. FightersProfiles (`src/pages/admin/FightersProfiles.tsx`)
- Verificar que las cards de peleadores usen tokens del tema
- Badges de status con colores del sistema fighter

### 7. Componentes Admin menores
- **DeleteFighterDialog, DeleteGymDialog, DeleteCoachDialog**: Ya usan `bg-destructive` (correcto)
- **RoleEditDialog**: Ya usa componentes shadcn (hereda tema automaticamente)
- **DeleteUserDialog**: Correcto con destructive tokens

## Archivos a Modificar

| Archivo | Cambio Principal |
|---------|-----------------|
| `src/components/AdminLayout.tsx` | Header con identidad combat, main bg puro |
| `src/components/AdminSidebar.tsx` | Active items rojos, labels UFC, linea decorativa |
| `src/pages/admin/Dashboard.tsx` | Iconos con tokens, combat-card en stats, colores sistema |
| `src/pages/admin/ValidacionLicencias.tsx` | Colores pendientes con tokens fighter-warning |
| `src/components/admin/LicenseCard.tsx` | Eliminar bg-white, usar bg-card, botones con tokens |

**5 archivos modificados. Sin migraciones SQL. Sin archivos nuevos.**

## Principios de Diseno Aplicados

- Fondo negro absoluto (`--background: 0 0% 5%`)
- Color primario rojo UFC (`--primary: 0 84% 44%`)
- Tipografia Barlow Condensed en uppercase para encabezados (`.ufc-label`)
- Cards con borde izquierdo rojo (`.combat-card`)
- Colores de status via tokens: `fighter-success` (verde), `fighter-warning` (amarillo), `fighter-danger` (rojo), `fighter-info` (azul)
- Zero colores hardcodeados directos (no `text-blue-600`, no `bg-white`, no `bg-amber-50`)
