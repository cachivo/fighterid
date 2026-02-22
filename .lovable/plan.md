

# Corregir Dashboard de Gimnasio: Banner, Main Coach y Dimensiones

## Problemas detectados

1. **Franja degradada innecesaria**: El banner del header (`h-28 bg-gradient-to-br...`) muestra un degradado morado vacio porque ningun gimnasio tiene banner subido (0 de 27 gyms). Esto desperdicia espacio valioso en movil.

2. **Nombre del Main Coach incorrecto**: El OWNER del gym "Honduras Hood Fights" tiene `first_name: null` y `last_name: null`, por lo que el badge muestra "Main Coach: null null". Debe usar el `handle` como fallback cuando no hay nombre.

3. **Dimensiones del header**: Sin banner, el avatar queda flotando sobre un espacio vacio. Hay que compactar el header para movil.

## Cambios

### 1. Eliminar banner degradado (archivo: `src/components/gym/GymDashboardHeader.tsx`)

- Quitar completamente el bloque del banner (`h-28 bg-gradient-to-br`). En su lugar, usar un header compacto sin franja decorativa.
- Reorganizar: avatar + info en una fila horizontal con padding superior simple, sin el `-mt-10` que dependia del banner.
- Si en el futuro se sube un banner, mostrar una version mas compacta (`h-20`); por ahora, sin banner = sin franja.

### 2. Mostrar nombre correcto del Main Coach

- En el badge del Main Coach, usar fallback: si `first_name` y `last_name` estan vacios, mostrar el `handle` del usuario.
- Actualizar la interfaz `GymDashboardHeaderProps` para incluir `handle` en el tipo del usuario del staff (ya disponible en el query de `useGymDashboard`).

### 3. Ajustar dimensiones para movil

- Header sin banner: `px-4 pt-4` con flex row (avatar + texto).
- Avatar: mantener `h-14 w-14` (ligeramente mas pequeno).
- Separador sutil debajo del header (`border-b`).

## Detalle tecnico

| Archivo | Cambio |
|---------|--------|
| `src/components/gym/GymDashboardHeader.tsx` | Eliminar banner, compactar header, fallback handle para nombre del Main Coach |
| `src/hooks/gyms/useGymDashboard.ts` | Ya incluye `handle` en staff users - sin cambios necesarios |

Solo se modifica 1 archivo. No hay cambios en base de datos.
