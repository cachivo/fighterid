

# Auditoría: Creación de Perfiles - Campos Faltantes en RPC

## Problema Crítico Encontrado

La función SQL `admin_create_fighter_profile` (migración `20251008221338`) **NO inserta** los siguientes campos, aunque el formulario los envía correctamente:

| Campo faltante en CREATE RPC | Estado en UPDATE RPC |
|------------------------------|---------------------|
| `emergency_contact_name` | OK |
| `emergency_contact_relation` | OK |
| `emergency_contact_phone` | OK |
| `medical_allergies` | OK |
| `medical_conditions` | OK |
| `insurance_company` | OK |
| `insurance_policy` | OK |
| `gym_id` | OK |
| `mma_record_wins/losses/draws` | OK |
| `boxeo_record_wins/losses/draws` | OK |

Esto significa que al **crear** un peleador nuevo, toda la información médica, de emergencia, seguro, gimnasio vinculado y records por disciplina se **pierde silenciosamente**. Solo se guarda al **editar** el perfil después.

## Solución

Crear una nueva migración SQL que redefina `admin_create_fighter_profile` incluyendo todos los campos faltantes en el INSERT.

## Archivo a Crear

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Recrear `admin_create_fighter_profile` con los 13 campos faltantes |

**1 migración SQL. Sin cambios en frontend (el formulario ya envía los datos correctamente).**

