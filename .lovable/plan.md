

# Plan: Eliminar Redundancia Entre Licencia y Perfil de Peleadores

## Problema Identificado

En el listado de peleadores (`/fighters`), cada tarjeta tiene:
1. **Click en la tarjeta** → Navega al Perfil (`/fighter/:id`)
2. **Botón "Ver Licencia"** → Navega a la Licencia (`/fighters/license/:id`)

Ambas páginas muestran información casi idéntica (nombre, récord, disciplina, nivel, etc.). La única diferencia es que la licencia muestra una "tarjeta digital" sin información adicional del perfil.

---

## Solución Propuesta

Integrar la tarjeta de licencia digital **dentro** del perfil del peleador y eliminar el botón redundante del listado.

### Cambios en `FighterCard.tsx`

**Eliminar**:
- El botón "Ver Licencia" que navega a `/fighters/license/:id`

**Resultado**: Al hacer click en cualquier parte de la tarjeta, el usuario va directamente al perfil completo.

### Cambios en `FighterProfile.tsx` (Perfil Público)

**Agregar**:
- Una sección de "Licencia Digital" que muestre el componente `DigitalFighterToken` de forma colapsable o en un modal
- Esto permite ver la tarjeta de identificación oficial desde el perfil sin navegar a otra página

---

## Flujo Mejorado

```text
ANTES (redundante):
+------------------+     +------------------+
|  FighterCard     | --> | Ver Licencia     |  (info repetida)
|  (click tarjeta) | --> | Ver Perfil       |  (info completa)
+------------------+     +------------------+

DESPUÉS (simplificado):
+------------------+     +------------------+
|  FighterCard     | --> | Perfil Completo  |
|  (click tarjeta) |     | + Licencia       |
+------------------+     +------------------+
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/FighterCard.tsx` | Eliminar botón "Ver Licencia" y sección de licencia redundante |
| `src/pages/FighterProfile.tsx` | Agregar sección/modal de "Licencia Digital" con `DigitalFighterToken` |

---

## Detalle Técnico

### FighterCard.tsx - Eliminar Sección Redundante

Eliminar líneas 167-190:
- La sección "License Info" con número de licencia y estado
- El botón "Ver Licencia"

La tarjeta quedará más limpia mostrando solo:
- Avatar y nombre
- Record
- Disciplina y artes marciales
- Estilo de pelea (si aplica)

### FighterProfile.tsx - Agregar Licencia Digital

Agregar después de la sección de perfil existente:
- Un acordeón o botón que muestre la tarjeta de licencia digital
- Utiliza el componente `DigitalFighterToken` existente
- Opcionalmente mostrar en modal para mejor presentación

---

## Beneficios

1. **Menos confusión** - Un solo destino al hacer click
2. **Menos código** - Eliminar redundancia de UI
3. **Mejor UX** - Toda la información en un solo lugar
4. **Mantiene funcionalidad** - La tarjeta digital sigue disponible desde el perfil

---

## Verificación Post-Implementación

1. Ir a `/fighters` y hacer click en cualquier tarjeta
2. Verificar que navega directamente al perfil
3. En el perfil, verificar que existe una forma de ver la licencia digital
4. Confirmar que no hay botón "Ver Licencia" separado en las tarjetas

