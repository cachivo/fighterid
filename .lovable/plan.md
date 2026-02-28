
# Correccion de Pop-ups de Perfil, Integridad de Datos y Seleccion de Gimnasios

## Problema 1: Pop-ups de perfil incompleto aparecen incluso con perfil completo

**Causa raiz:** `ProfileIncompleteNotification` (Header.tsx) verifica solo 3 campos (`birthdate`, `gender`, `phone`) pero el campo `phone` se busca en `fighter_profiles` donde no existe -- siempre sera `undefined`, haciendo que el pop-up aparezca siempre para usuarios con licencia, incluso si ya tienen telefono en `app_user`.

**Solucion:**
- **`src/components/ProfileIncompleteNotification.tsx`**: Modificar para que busque `phone` desde `app_user` (igual que LicenseDashboard). Despues de obtener el perfil del peleador, hacer un fetch a `app_user` para verificar si tiene telefono. Si los 3 campos estan completos, no mostrar la notificacion.
- Adicionalmente, si `birthdate` y `gender` estan llenos y `phone` esta en `app_user`, el pop-up no debe aparecer.

## Problema 2: Datos posiblemente perdidos tras actualizaciones

**Hallazgos de la base de datos:**
- La data NO se ha perdido. Consulte los perfiles activos y la informacion esta intacta en la base de datos (gym_name, gym_id, height_cm, weight_kg, etc.)
- El problema visual es que algunos campos no se cargan correctamente en el formulario de edicion (ej: `phone` siempre aparece vacio porque viene de `app_user`, no de `fighter_profiles`)
- En el ultimo fix ya se corrigio el enrichment de `phone` en LicenseDashboard, pero el formulario de edicion `UserFighterProfileEditForm` aun puede no recibir el phone correctamente si el `profile` pasado no lo incluye

**Solucion:** Verificar que la prop `enrichedProfile` en LicenseDashboard incluye correctamente el phone y que no hay campos que se esten borrando al guardar. Revisar que el `onSubmit` no envia campos vacios que sobrescriban datos existentes.

## Problema 3: Gimnasio debe ser solo de gimnasios registrados (no texto libre)

**Problemas encontrados:**
1. **`FighterProfileForm.tsx` (creacion de perfiles admin)**: Tiene un Select de gimnasios registrados PERO tambien un Input de texto libre debajo que dice "O escribe el nombre del gimnasio manualmente" (linea 239-245). Este input debe eliminarse.
2. **`UserFighterProfileEditForm.tsx` (edicion del usuario)**: El campo `gym_name` es un Input de texto libre (linea 784-785). Debe reemplazarse por un Select con gimnasios registrados + opcion "Independiente".

**Solucion:**
- **`src/components/FighterProfileForm.tsx`**: Eliminar el Input de texto libre de `gym_name` (lineas 239-245). Mantener solo el Select con gimnasios registrados. Cuando se selecciona un gimnasio, automaticamente llenar `gym_name` con el nombre del gimnasio seleccionado.
- **`src/components/UserFighterProfileEditForm.tsx`**: Reemplazar el Input de `gym_name` por un Select que cargue gimnasios desde `useGyms()`. Agregar opcion "Independiente" (sin gimnasio). Al seleccionar, actualizar tanto `gym_id` como `gym_name` automaticamente. Agregar `gym_id` al esquema Zod.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/ProfileIncompleteNotification.tsx` | Fetch phone desde app_user antes de decidir si mostrar la notificacion. No mostrar si todos los campos criticos estan completos |
| `src/components/FighterProfileForm.tsx` | Eliminar Input de texto libre para gym_name (lineas 239-245). Auto-llenar gym_name desde el Select |
| `src/components/UserFighterProfileEditForm.tsx` | Reemplazar Input de gym_name por Select de gimnasios registrados con opcion "Independiente". Agregar gym_id al esquema y al submit |

**Total: 3 archivos. 0 archivos nuevos. Sin migraciones de base de datos.**

---

## Detalle Tecnico

### Fix 1: ProfileIncompleteNotification
```text
Flujo actual:
  getUserFighterProfile() -> profile.phone (undefined) -> siempre muestra pop-up

Flujo corregido:
  getUserFighterProfile() -> si tiene user_id:
    fetch app_user.phone -> verificar birthdate + gender + phone
    Si todos completos -> no mostrar
    Si faltan -> mostrar con conteo correcto
```

### Fix 3: Select de Gimnasios en UserFighterProfileEditForm
- Importar `useGyms` desde `@/hooks/useGyms`
- Agregar `gym_id` al esquema Zod como `z.string().optional().or(z.literal(''))`
- Reemplazar Input por Select con opciones de gimnasios activos
- Al cambiar gimnasio: `gym_id = selectedId`, `gym_name = selectedGym.nombre`
- Opcion "Independiente" establece `gym_id = null`, `gym_name = "Independiente"`
- Agregar `gym_id` a `immediateUpdateFields` para persistencia directa

### Verificacion de integridad de datos
- Los datos existen en la base de datos (verificado via query directa)
- No se ha perdido informacion de campos como gym_name, height_cm, weight_kg, etc.
- El problema es de visualizacion/carga, no de perdida de datos
