
# Correccion: Datos de Peleadores No Sincronizados con el Dashboard

## Causa Raiz

La funcion RPC `check_user_license_status` construye manualmente un objeto JSON del perfil con solo ~17 campos, pero el perfil tiene **40+ campos**. Los campos faltantes incluyen:

- `gender` (genero)
- `birthplace` (lugar de nacimiento)  
- `blood_type` (tipo de sangre)
- `weight_kg` (peso)
- `fighting_style` (estilo de pelea)
- `level`, `record_type`, `bio`
- `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relation`
- `medical_conditions`, `medical_allergies`
- `insurance_company`, `insurance_policy`
- `boxrec_url`, `tapology_url`
- `document_type`, `document_number`, `document_image_url`
- `martial_arts`
- `mma_record_wins/losses/draws`, `boxeo_record_wins/losses/draws`

Adicionalmente, el campo `birthdate` se devuelve como `date_of_birth` en el RPC, pero el formulario busca `birthdate` -- por lo que la fecha de nacimiento siempre aparece vacia aunque exista en la base de datos.

**La data NO se perdio.** Esta intacta en la base de datos. El problema es que el RPC no la envia al frontend.

---

## Solucion

### 1. Migracion SQL: Actualizar la funcion RPC `check_user_license_status`

Reescribir la seccion `v_profile_json` para incluir TODOS los campos relevantes del perfil, ademas del telefono desde `app_user`:

```text
Campos a agregar al JSON del perfil:
- gender, birthdate (no date_of_birth), birthplace, blood_type
- weight_kg, fighting_style, level, record_type, bio
- emergency_contact_name, emergency_contact_phone, emergency_contact_relation
- medical_conditions, medical_allergies
- insurance_company, insurance_policy  
- boxrec_url, tapology_url
- document_type, document_number, document_image_url
- martial_arts
- mma_record_wins, mma_record_losses, mma_record_draws
- boxeo_record_wins, boxeo_record_losses, boxeo_record_draws
- phone (desde app_user via v_app_user_id)
```

Corregir `date_of_birth` a `birthdate` para coincidir con lo que espera el frontend.

### 2. Archivo: `src/hooks/useLicenseAuth.tsx`

Actualmente hay un campo mapeado como `date_of_birth` en el RPC. Tras la migracion, este campo sera `birthdate`. Verificar que no haya mapeos legacy que referencien `date_of_birth` y que se use `birthdate` consistentemente.

---

## Archivos a Modificar

| Recurso | Cambio |
|---------|--------|
| Funcion SQL `check_user_license_status` | Agregar ~25 campos faltantes al JSON del perfil. Corregir `date_of_birth` a `birthdate`. Incluir phone desde `app_user` |
| `src/hooks/useLicenseAuth.tsx` | Verificar/limpiar mapeos de campos legacy si existen |

**1 migracion SQL + 1 archivo de codigo. Los datos existentes en la DB se mostraran correctamente sin necesidad de re-ingresarlos.**
