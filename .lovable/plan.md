
## Diagnóstico (por qué sigues viendo “cuadros negros”)
1) En `EventDetail.tsx` la imagen que se muestra para cada esquina usa este orden:
   - `fight.fighter_a_event_image_url` **(imagen especial de cartelera)**  
   - si no existe → `fight.fighter_a?.avatar_url` **(foto de perfil)**  
   - si no existe → `fight.fighter_a_external?.image_url`
2) En tu evento actual, **no hay `fighter_*_event_image_url` guardada** (o está vacía), entonces la UI cae a la **foto de perfil**, que suele venir en JPG/PNG con fondo oscuro/negro.  
3) Aunque ya existe la opción de “Remover fondo (IA)” en el admin, hoy:
   - es **opcional** (puedes guardar la pelea sin imagen de cartelera),
   - y el “recorte”/PNG transparente no queda garantizado si no subes imagen específica para cartelera.

Resultado: la cartelera sigue usando la foto de perfil con fondo → se ve el cuadro negro.

---

## Objetivos (lo que vamos a cambiar)
A) Para eventos tipo **Hoodfights**, **siempre pedir imagen de cartelera** por peleador (Roja/Azul) para que sea “sin fondo”.  
B) Mantener la opción de **usar la foto de perfil** si esa foto ya es buena (ej. PNG transparente).  
C) Evitar que la IA te consuma créditos “por accidente” o por reintentos: **la IA solo corre cuando tú la mandas a correr** y **no vuelve a correr si ya procesaste ese mismo archivo**.  
D) Usar **logos de Hoodfights** (y no UCC) en la cartelera cuando el evento esté marcado como Hoodfights.

---

## Cambios de producto (UX) propuestos

### 1) “Branding” del evento (UCC vs Hoodfights)
- Agregar en Admin (`EventosPelea.tsx`) un botón por evento: **Branding / Cartelera**.
- En ese modal:
  - Selector “Marca del evento”: `UCC` / `Hoodfights` / `Personalizado`
  - Subida de:
    - **Logo principal** (PNG recomendado)
    - **Watermark** (PNG recomendado)
  - Switch: **“Este evento requiere imágenes de cartelera sin fondo”** (ON por defecto si marca = Hoodfights)

**Dónde se guarda**: en `bdg_event.meta`, por ejemplo:
```ts
meta: {
  branding: {
    key: "hoodfights",
    logo_url: "...",
    watermark_url: "...",
    require_billboard_images: true
  }
}
```

### 2) Imágenes de cartelera por pelea: obligatorias (cuando aplique)
En el modal “Crear/Editar pelea” (Admin → `EventosPelea.tsx`):
- Por cada esquina (A y B) agregar un selector de “Fuente de imagen”:
  1) **Subir imagen para cartelera (recomendado)**  
  2) **Usar foto de perfil** (sin IA, sin créditos)  
- Si el evento tiene `require_billboard_images=true`:
  - No se podrá guardar la pelea si (para esa esquina) está en modo “Subir” y no hay archivo listo.
  - Si eligen “Usar foto de perfil”, se permite guardar, pero mostraremos una advertencia:  
    “Si la foto de perfil tiene fondo, se verá el cuadro negro en cartelera”.

### 3) IA sin “doble gasto”: procesamiento explícito + cache
Hoy la IA corre dentro de `handleSaveFight()`. Eso puede causar gasto repetido si:
- guardas, falla algo, vuelves a guardar,
- o cambias algo y guardas de nuevo sin darte cuenta.

Cambio:
- Separar el flujo en 2 pasos, por esquina:
  - Paso 1: Seleccionar archivo
  - Paso 2: Botón **“Procesar con IA (1 crédito)”** (solo si el archivo NO es PNG transparente o si lo deseas)
- Guardaremos en estado:
  - `rawFileA/B`
  - `processedFileA/B`
  - `processedPreviewUrlA/B`
  - `processedHashA/B` (SHA-256 del archivo original)
- Si el usuario vuelve a dar “Procesar” con el mismo archivo (mismo hash), **no re-llamamos a la edge function**.

### 4) “Recorte” real (que se vea solo el peleador, sin márgenes)
Después de que la IA devuelve el PNG transparente:
- Ejecutar el util existente `trimTransparentBorders()` (ya está en `src/lib/imageUtils.ts`) para:
  - eliminar bordes transparentes sobrantes,
  - hacer que el peleador se vea grande y centrado,
  - sin gastar créditos (es local en el navegador).

---

## Cambios de UI en la cartelera pública (`EventDetail.tsx`)
### 5) Logos correctos por evento (Hoodfights)
En `EventDetail.tsx` hoy está hardcodeado UCC:
- Logo header
- Watermark dentro de cada card

Cambio:
- Usar `event.meta?.branding?.logo_url` y `watermark_url` si existen,
- fallback a UCC si no hay branding configurado.

### 6) Evitar fallback silencioso a foto de perfil (solo cuando “se exige cartelera”)
Cuando `event.meta.branding.require_billboard_images === true`:
- En vez de caer automáticamente a `avatar_url`, mostraremos:
  - placeholder (“Falta imagen de cartelera”)
  - o solo permitir `avatar_url` si el admin eligió explícitamente “Usar foto de perfil” (esto se logra guardando en DB una preferencia o guardando el `fighter_*_event_image_url` igual al avatar en el admin al confirmar).

Implementación práctica (sin cambiar esquema DB):
- Si el admin elige “Usar foto de perfil” para esa esquina, al guardar:
  - seteamos `fighter_*_event_image_url = fighter.avatar_url`
  - así la UI siempre usa “event_image_url” y no depende de fallback

---

## Cambios técnicos (archivos a tocar)
1) `src/pages/admin/EventosPelea.tsx`
   - Agregar modal “Branding/Cartelera” por evento
   - Guardar `bdg_event.meta.branding`
   - En modal de pelea:
     - “Fuente de imagen” por esquina
     - Botón “Procesar con IA”
     - Preview con fondo tipo “checkerboard” para confirmar transparencia
     - Validaciones: requerido si `require_billboard_images=true`
     - Upload a storage solo del `processedFile` (o raw PNG transparente)
     - Guardar `fighter_*_event_image_url` siempre (incluso si es avatar_url por elección)

2) `src/hooks/useEvents.tsx`
   - Extender `createEvent()` para aceptar `meta` opcional, o añadir `updateEventMeta(eventId, meta)`.

3) `src/pages/EventDetail.tsx`
   - Branding dinámico (logos/watermark) desde `event.meta.branding`
   - Ajustar lógica de fallback si `require_billboard_images=true` (no fallback silencioso)
   - (Opcional) mejorar el rendering: quitar `mix-blend-lighten` cuando el PNG ya es transparente (se puede detectar por URL `.png` o por flag guardado en meta de la pelea; si no, lo dejamos como está para no romper estilos).

4) Storage / buckets
   - Reutilizar `event-fighter-images` para imágenes de pelea (ya existe en el código).
   - Crear bucket nuevo opcional `event-branding` para logos (más limpio), o reutilizar uno existente si ya es público.
   - Añadir/confirmar políticas de lectura pública y escritura admin.

---

## Qué hacer AHORA para probar sin gastar más créditos (antes de los cambios)
Mientras implementamos lo de “obligatorio + branding”, puedes verificar si el pipeline de recorte funciona:
1) En Admin → **EventosPelea** → tu evento → **Peleas** → **Editar pelea**
2) En “Imágenes de Cartelera”:
   - Sube una imagen para “Imagen Peleador A”
   - Activa “Remover fondo (IA)”
   - Guarda
3) Recarga `/evento/9cc74101-8bef-4595-9bf7-9f543e5f1845`
4) Si ahora se ve bien: confirma que el problema era el fallback a `avatar_url`.
5) Si sigue negro incluso con `fighter_a_event_image_url` cargada, entonces:
   - la IA no está removiendo el fondo para ese archivo específico (ahí el preview del resultado, que vamos a agregar, es clave para evitar reintentos y gasto doble).

---

## Dependencias / insumos que necesito de ti (para Hoodfights)
- Que subas por chat:
  1) **Logo Hoodfights** (PNG ideal transparente)
  2) **Watermark Hoodfights** (PNG ideal transparente, opcional)
Con eso dejamos el evento 100% brand-aligned.

---

## Criterios de éxito (cómo sabremos que quedó resuelto)
- En eventos Hoodfights:
  - No se puede guardar una pelea sin imágenes de cartelera (o sin elegir explícitamente “usar perfil”).
  - La IA solo corre cuando se presiona “Procesar con IA (1 crédito)”.
  - Si se intenta procesar el mismo archivo otra vez, no vuelve a consumir créditos.
  - En la vista pública, no aparecen cuadros negros: los PNG tienen transparencia y además quedan “recortados” (trim de bordes transparentes).
  - Los logos y watermark mostrados corresponden a Hoodfights (no UCC).
