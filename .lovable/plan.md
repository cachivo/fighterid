

# Validación de Acceso por Disciplina en AdminDisciplineLayout

## Cambio

Modificar `AdminDisciplineLayout.tsx` para verificar que el usuario tiene acceso a la disciplina del panel. Si no, redirigir a `/admin` con toast de error.

## Implementación

### `src/components/AdminDisciplineLayout.tsx`

- Importar `useUserDisciplineAccess` y `Navigate` de react-router-dom
- Importar `useEffect` y `toast` de sonner
- Después de obtener `discipline` prop, llamar `useUserDisciplineAccess()`
- Mientras `isLoading`, mostrar spinner (ya existe patrón en `AdminProtectedRoute`)
- Si `discipline === 'MMA' && !hasMMA` o `discipline === 'Boxeo' && !hasBoxeo`:
  - Disparar `toast.error('No tienes acceso al panel de ' + discipline)`
  - Retornar `<Navigate to="/admin" replace />`
- Si tiene acceso, renderizar normalmente

### Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/components/AdminDisciplineLayout.tsx` | Agregar guard de acceso con redirect + toast |

