
# Actualizaciones de Peleadores: Subida de Imagenes + Feed Estilo Facebook + Sincronizacion con Gimnasios

## Resumen

Transformar el sistema de actualizaciones de peleadores para que funcione como un "post de Facebook": con subida real de imagenes (no URLs), visualizacion tipo feed social en el perfil publico, y sincronizacion automatica con el dashboard del gimnasio al que pertenece el peleador.

---

## Cambios por Modulo

### 1. Storage: Crear bucket `fighter-update-images`

**Migracion SQL:**
- Crear bucket de storage `fighter-update-images` (publico, para que las imagenes se vean sin autenticacion)
- Politica de INSERT: cualquier usuario autenticado puede subir
- Politica de SELECT: acceso publico (las imagenes se muestran en perfiles publicos)
- Politica de DELETE: solo el usuario que subio puede borrar

### 2. Formulario de Creacion (`FighterStatusUpdateForm.tsx`)

**Reemplazar el input de URL** por un componente de subida real de imagen:
- Boton "Agregar Foto" que abre un file input (accept="image/*")
- Preview de la imagen seleccionada antes de publicar
- Boton X para quitar la imagen
- Al hacer submit: subir imagen a Supabase Storage (`fighter-update-images/{fighterId}/{uuid}.jpg`), obtener URL publica, y guardarla en `image_url` del registro
- Limitar tamano a 5MB con validacion visual
- Soporte para camara en movil (capture attribute)
- Indicador de progreso durante la subida

### 3. Hook `useFighterUpdates.tsx`

**Agregar funcion `uploadUpdateImage`:**
- Recibe `File` + `fighterId`
- Sube a `fighter-update-images/{fighterId}/{uuid}.{ext}`
- Retorna la URL publica
- Integrar en `createUpdate`: si hay archivo, subir primero, luego crear el registro con la URL

**Agregar funcion `fetchGymFighterUpdates`:**
- Nueva query que busca actualizaciones de TODOS los peleadores de un gimnasio
- Join: `fighter_updates` -> `fighter_profiles` -> `gym_memberships` WHERE `gym_id = X`
- Incluye nombre y avatar del peleador en cada update
- Ordenado por `created_at DESC`

### 4. Feed en Perfil Publico (`FighterUpdatesFeed.tsx`)

**Estilo Facebook post:**
- Header: avatar + nombre del peleador + timestamp relativo
- Contenido del texto
- Imagen a ancho completo (si existe) con aspect ratio preservado, click para ampliar
- Separador sutil entre posts
- Animacion de entrada suave

### 5. Dashboard de Gimnasio: Nueva seccion "Novedades de Cantera" (`GymDashboard.tsx`)

**Agregar seccion de actualizaciones recientes:**
- Titulo: "Novedades de la Cantera" con icono
- Muestra las ultimas 10 actualizaciones de peleadores vinculados al gimnasio
- Cada item muestra: avatar mini del peleador, nombre, contenido truncado, imagen thumbnail, y tiempo relativo
- Link "Ver perfil" que navega al perfil del peleador
- Si no hay actualizaciones: mensaje vacio elegante "Tus peleadores aun no han publicado novedades"
- La data se obtiene via la nueva funcion `fetchGymFighterUpdates` del hook

### 6. Componente nuevo: `GymFighterUpdateCard.tsx`

**Card individual para el feed del gimnasio:**
- Avatar del peleador + nombre + gym badge
- Texto del update (truncado a 2 lineas con "ver mas")
- Imagen thumbnail si existe
- Timestamp relativo
- Link al perfil completo del peleador

---

## Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| Migracion SQL | Crear | Bucket `fighter-update-images` con politicas RLS |
| `src/components/FighterStatusUpdateForm.tsx` | Modificar | Reemplazar input URL por file upload con preview |
| `src/hooks/useFighterUpdates.tsx` | Modificar | Agregar `uploadUpdateImage` y `fetchGymFighterUpdates` |
| `src/components/FighterUpdatesFeed.tsx` | Modificar | Redisenar como feed estilo Facebook con avatar, nombre, imagen grande |
| `src/pages/gym/GymDashboard.tsx` | Modificar | Agregar seccion "Novedades de la Cantera" |
| `src/components/gym/GymFighterUpdateCard.tsx` | Crear | Card de update para el dashboard del gimnasio |

**Total: 5 archivos modificados + 1 archivo nuevo + 1 migracion SQL**

---

## Detalle Tecnico

### Storage path
```text
fighter-update-images/
  {fighter_id}/
    {uuid}.jpg
```

### Query para updates del gimnasio
```text
fighter_updates
  JOIN fighter_profiles ON fighter_updates.fighter_id = fighter_profiles.id
  JOIN gym_memberships ON fighter_profiles.id = gym_memberships.fighter_id
WHERE gym_memberships.gym_id = {gymId}
  AND gym_memberships.status = 'active'
  AND fighter_updates.active = true
  AND fighter_updates.review_status IN ('APPROVED', 'PENDING')
ORDER BY fighter_updates.created_at DESC
LIMIT 10
```

### Flujo de subida de imagen
```text
1. Usuario selecciona imagen desde archivo o camara
2. Preview local usando URL.createObjectURL()
3. Al hacer click en "Publicar":
   a. Subir imagen a Supabase Storage
   b. Obtener URL publica
   c. Insertar registro en fighter_updates con image_url
   d. Resetear formulario
4. La imagen aparece inmediatamente en:
   - El feed del peleador (perfil publico)
   - El dashboard del gimnasio (si esta vinculado)
```

### Sincronizacion gimnasio-peleador
- La vinculacion se determina via `gym_memberships` (status = 'active')
- No se necesita campo adicional en `fighter_updates`
- El dashboard del gimnasio consulta en tiempo real las actualizaciones de sus peleadores activos
- Herramienta de trazabilidad: el entrenador/owner del gimnasio puede ver la evolucion cronologica de cada peleador
