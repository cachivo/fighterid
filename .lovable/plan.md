# Plan: Remoción Automática de Fondo para Fotos de Peleadores

## ✅ IMPLEMENTADO

La funcionalidad de remoción automática de fondo con IA ha sido implementada exitosamente.

---

## Resumen de Cambios

### 1. Edge Function: `remove-image-background`
**Archivo:** `supabase/functions/remove-image-background/index.ts`

- Usa la API de Lovable (google/gemini-2.5-flash-image) para remover fondos
- Acepta imagen en base64 y devuelve imagen procesada con fondo transparente
- Maneja errores de rate limit (429) y payment required (402)

### 2. Utilitario: `src/lib/backgroundRemovalAI.ts`

- `removeBackgroundAI(file)`: Función principal que llama la edge function
- `removeBackgroundWithFeedback(file)`: Versión con toasts de feedback para el usuario
- Convierte archivos a base64 y viceversa

### 3. Modificación: `src/lib/photoUtils.ts`

- `uploadFighterAvatar()` ahora acepta parámetro `removeBackground: boolean = false`
- Si está activado, procesa la imagen con IA antes de subirla
- Mantiene formato PNG para preservar transparencia

### 4. UI - Formularios Actualizados

**FighterEditModal.tsx:**
- Toggle "Remover fondo automáticamente (IA)" con icono Wand2
- Se activa al subir nueva foto de perfil

**AdminFighterForm.tsx:**
- Toggle al crear nuevo peleador
- Permite subir foto y remover fondo en un solo paso

**UserFighterProfileEditForm.tsx:**
- Toggle para que peleadores puedan procesar sus propias fotos

**EventosPelea.tsx:**
- Toggles individuales para imágenes de cartelera (Peleador A y B)
- Acepta PNG, JPG, WebP cuando la IA está activada
- Solo PNG cuando no se usa IA

---

## Flujo de Uso

1. Usuario sube foto en cualquiera de los formularios
2. Activa toggle "Remover fondo con IA" si desea fondo transparente
3. Al guardar:
   - Se envía imagen a la edge function
   - Lovable AI procesa y devuelve imagen sin fondo
   - Se sube a Supabase Storage como PNG
   - Se actualiza el avatar_url

---

## Consideraciones

- **Límite de tamaño:** 5MB por imagen
- **Tiempo de procesamiento:** 3-8 segundos
- **Formato de salida:** PNG con transparencia
- **Fallback:** Si falla la IA, se usa imagen original con notificación
