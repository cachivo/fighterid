

# Fix: Sección de disciplina no visible en RoleEditDialog (móvil)

## Problema
La sección "Acceso por Disciplina" (MMA/Boxeo) aparece condicionalmente solo cuando se selecciona un rol de gimnasio. En viewport 390x575, el contenedor tiene `max-h-[50vh]` (~287px) y los 4 grupos de roles ocupan todo el espacio visible. Cuando el usuario marca "Main Coach", la sección de disciplina aparece fuera del área visible sin indicación.

## Solución
1. **Aumentar max-height del scroll** en móvil: cambiar `max-h-[50vh]` a `max-h-[60vh]`
2. **Auto-scroll** al final cuando se selecciona un rol de gimnasio, usando `useRef` + `scrollIntoView`
3. **Mostrar indicador visual** — la sección de disciplina tendrá un borde destacado (amarillo/warning) para que sea obvia al hacer scroll

## Archivo a modificar
- `src/components/admin/roles/RoleEditDialog.tsx`

## Cambios técnicos
- Agregar `useRef` para el contenedor de disciplinas
- En el `useEffect` o dentro de `handleRoleToggle`, cuando se detecta que `hasGymRole` cambia a `true`, llamar `ref.current?.scrollIntoView({ behavior: 'smooth' })`
- Cambiar `max-h-[50vh]` → `max-h-[60vh]`
- Agregar styling más prominente al bloque de disciplina (borde amarillo + icono)

