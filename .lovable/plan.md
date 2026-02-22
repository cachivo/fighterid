

# Uniformar Tarjetas de Ranking

Las tarjetas del ranking actualmente se ven inconsistentes porque la informacion se acomoda de forma variable: algunos peleadores tienen nickname y otros no, los nombres de gimnasio se truncan a distintos anchos, y el record se mezcla con los badges en una sola linea que se desborda.

## Cambios

### Estructura fija por filas en cada tarjeta (archivo: `src/components/sections/Ranking.tsx`)

Reorganizar el contenido de cada tarjeta para que siempre ocupe las mismas lineas, sin importar si el peleador tiene nickname o gym:

```text
Linea 1: Nombre completo + badge campeon (si aplica)
Linea 2: Nickname (si existe, en italica; si no, se omite pero el espacio se mantiene con min-height)
Linea 3: [Badge division] [Gym name] [Record W-L-D]
```

Cambios especificos:

1. **Nombre del peleador**: Quitar `max-w-[100px]` y `truncate` del nombre. En movil, permitir que el nombre ocupe toda la linea con `text-ellipsis` solo si realmente no cabe.

2. **Nickname**: Mantener un `min-h-[14px]` para que las tarjetas sin nickname no colapsen esa linea, manteniendo la alineacion vertical uniforme entre todas las tarjetas.

3. **Fila de badges (division + gym + record)**: Usar `flex items-center gap-1.5` con anchos maximos consistentes para cada elemento:
   - Division badge: ancho fijo con truncate
   - Gym name: `flex-1 truncate` para que ocupe el espacio disponible sin empujar el record
   - Record (W-L-D): `shrink-0 ml-auto` para que siempre quede alineado a la derecha de esa fila

4. **Puntos**: Ya estan bien posicionados a la derecha. Sin cambios.

### Resultado visual esperado

Todas las tarjetas tendran exactamente la misma altura y estructura visual, con la informacion alineada en las mismas posiciones independientemente de los datos del peleador.

## Detalle tecnico

| Archivo | Cambio |
|---------|--------|
| `src/components/sections/Ranking.tsx` | Reestructurar lineas 301-340: separar nickname en su propia linea con min-height, fijar layout de badges, quitar truncates agresivos del nombre |

Solo se modifica 1 archivo. No hay cambios en base de datos ni en logica de negocio.

