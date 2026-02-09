

# Plan: Lista de Peleas Existentes + Edición + Remoción de Fondo

## Problema Identificado

En la página **EventosPelea.tsx**, el hook `useFights` está importado pero **nunca se usa**. Esto causa:

1. **No se ven las peleas creadas** - El modal de "Peleas" solo muestra el formulario para crear, pero no hay lista de peleas existentes
2. **No se pueden editar** - La función `handleEditFight` existe pero nunca se llama porque no hay lista visible
3. **La remoción de fondo ya funciona automáticamente** - Cuando subes imagen, se procesa con IA, pero esto solo aplica al crear nuevas peleas, no al editar

---

## Cambios a Implementar

### 1. Agregar hook `useFights` cuando se selecciona un evento

Cuando el usuario abre el modal "Peleas" de un evento, se deben cargar las peleas existentes:

```typescript
// Al inicio del componente, después de useEvents:
const [fightsEventId, setFightsEventId] = useState<string | null>(null);
const { fights, loading: fightsLoading, refreshFights } = useFights(fightsEventId || undefined);
```

Y cuando se abre el diálogo:
```typescript
onClick={() => {
  setSelectedEvent(event);
  setFightsEventId(event.id); // <-- Esto dispara useFights
  resetFightForm();
  setShowFightsDialog(true);
}}
```

### 2. Mostrar lista de peleas existentes en el modal

Agregar una sección **arriba del formulario** que muestre las peleas ya creadas:

```
┌────────────────────────────────────────────────────────────────┐
│ Peleas - Evento X                                              │
├────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 📋 PELEAS EXISTENTES (3)                                    ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ #1 │ Juan vs Pedro │ Peso Ligero │ [Editar] [Eliminar]     ││
│ │ #2 │ Carlos vs Andres │ Peso Medio │ [Editar] [Eliminar]   ││
│ │ #3 │ Luis vs Mario │ Peso Pesado │ [Editar] [Eliminar]     ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                │
│ ───────────────── Nueva Pelea / Editar ────────────────────── │
│                                                                │
│ [Formulario actual de crear/editar pelea]                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3. Botones de Editar y Eliminar por cada pelea

- **Editar**: Llama a `handleEditFight(fight)` que ya existe y carga los datos en el formulario
- **Eliminar**: Confirmar y borrar de la base de datos

### 4. Actualizar `handleSaveFight` para refrescar la lista

Después de guardar una pelea (crear o actualizar), llamar a `refreshFights()` para que la lista se actualice.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/EventosPelea.tsx` | Agregar estado para `fightsEventId`, usar `useFights`, mostrar lista de peleas, botones editar/eliminar, refrescar después de guardar |

---

## Detalles de Implementación

### A. Estado nuevo para controlar el eventId de peleas

```typescript
const [fightsEventId, setFightsEventId] = useState<string | null>(null);
const { fights, loading: fightsLoading, refreshFights } = useFights(fightsEventId || undefined);
```

### B. Lista de peleas existentes (dentro del Dialog de Peleas)

Se mostrará arriba del formulario con:
- Número de pelea
- Nombre de peleadores (registrados o externos)
- Categoría de peso
- Estado (scheduled, live, finished)
- Botones de acción

### C. Función para eliminar pelea

```typescript
const handleDeleteFight = async (fightId: string) => {
  const { error } = await supabase
    .from('fights')
    .delete()
    .eq('id', fightId);
  
  if (!error) {
    toast({ description: 'Pelea eliminada' });
    refreshFights();
  }
};
```

### D. Refrescar después de guardar

Al final de `handleSaveFight`:
```typescript
refreshFights(); // Actualizar lista
resetFightForm();
// NO cerrar el diálogo para poder seguir agregando peleas
```

---

## Resultado Esperado

1. **Abrir modal "Peleas"** → Ver lista de peleas existentes del evento
2. **Click en "Editar"** → Carga datos en el formulario, incluyendo imágenes procesadas previamente
3. **Subir nueva imagen** → Se procesa automáticamente con IA (ya funciona)
4. **Guardar** → Se actualiza la lista inmediatamente
5. **Click en "Eliminar"** → Confirmar y eliminar la pelea

