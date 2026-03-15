
Objetivo: resolver el “sigue igual” con un ajuste completo de mobile en Admin, empezando por el bloqueo real que se ve en `/admin/user-roles` y por el cierre del menú.

Diagnóstico actual (según código + captura):
1) El problema visible en tu screenshot no es solo sidebar: `UserRoles` no está adaptado a 390px (fila en horizontal con acciones a la derecha, badges sin wrap, botones largos), por eso se “rompe” y da sensación de pantalla bloqueada/negra.
2) En el sidebar móvil, el auto-cierre existe pero es frágil (depende de `isMobile` en click); además el `Sheet` oculta el botón de cerrar (`[&>button]:hidden`), así que si no se cierra automáticamente la UX queda confusa.
3) La auditoría previa cubrió 8 módulos, pero todavía quedan varios admin módulos con `grid-cols-2/3` sin breakpoint móvil y algunos flujos con overflow horizontal.

Plan de implementación (sin romper funcionalidad):
1) Endurecer cierre del menú admin en móvil (prioridad UX)
- Cerrar sidebar móvil de forma incondicional al navegar (no depender de `isMobile` en click).
- Cerrar también en cambio de ruta (fallback robusto).
- Mostrar una acción de cierre visible dentro del menú móvil (o dejar visible el close del Sheet) para eliminar el “pantalla negra / no sé cómo salir”.

2) Corregir `/admin/user-roles` para mobile-first (prioridad inmediata, es el módulo que se ve roto)
- Convertir cada fila de usuario a layout vertical en móvil (`flex-col`) y horizontal solo en `md+`.
- Mover acciones (“Editar Roles”, “Eliminar”) a bloque propio debajo del contenido en móvil.
- Permitir wrap en badges de roles y en filtros.
- Ajustar títulos/textos para que no empujen ancho.
- Revisar `RoleEditDialog` + `DeleteUserDialog` trigger buttons para no forzar ancho en 390px.

3) Completar auditoría de módulos admin pendientes (fase de cierre)
Aplicar patrón estándar del proyecto:
- formularios: `grid-cols-1` por defecto y `md:grid-cols-*` en desktop.
- tablas/listados anchos: `overflow-x-auto -mx-4 px-4`.
- evitar truncamientos críticos en nombres.
Módulos pendientes detectados por auditoría estática:
- `EventosPelea.tsx`
- `JudgesManagement.tsx`
- `OrganizationsManagement.tsx`
- `FightApproval.tsx`
- `PendingChangesHub.tsx`
- `ValidacionLicencias.tsx`
- (y revisar modales admin asociados que aún usan grids fijos de 2/3 columnas).

4) Validación final en viewport real de uso (390x575)
Checklist:
- Abrir menú admin → navegar a cualquier sección → menú se cierra siempre.
- En `/admin/user-roles`, ningún botón se sale del contenedor.
- No hay scroll horizontal accidental en páginas auditadas.
- Acciones críticas (editar rol, eliminar usuario, filtros, búsqueda) siguen funcionando igual.

Archivos principales a intervenir:
- `src/components/AdminSidebar.tsx`
- `src/components/ui/sidebar.tsx` (solo comportamiento de close en mobile)
- `src/pages/admin/UserRoles.tsx`
- `src/components/admin/roles/RoleEditDialog.tsx`
- `src/components/admin/roles/DeleteUserDialog.tsx`
- Fase 2: `EventosPelea.tsx`, `JudgesManagement.tsx`, `OrganizationsManagement.tsx`, `FightApproval.tsx`, `PendingChangesHub.tsx`, `ValidacionLicencias.tsx`

Detalles técnicos (resumen):
- Mantener compatibilidad total con flujo actual: solo cambios de layout/UX responsive y control de estado del sidebar.
- No cambiar lógica de roles ni permisos.
- No tocar backend/RLS para esta tarea.
- Estrategia incremental: primero bloqueo UX (sidebar + user-roles), luego sweep de módulos pendientes para cerrar deuda de responsive.
