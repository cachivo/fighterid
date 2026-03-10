

## Plan: Agregar botón "Volver a la página principal" en el header del Admin

### Cambio
En `src/components/AdminLayout.tsx`, agregar un botón/icono visible en el header del panel de administración que lleve al usuario de regreso a `/` (la página principal pública).

### Implementación
- Agregar un botón con icono `Home` (de lucide-react) al lado derecho del header, con tooltip "Ir a página principal"
- Link a `/` usando `Link` de react-router-dom
- Estilo discreto (`ghost` variant) que no compita con el logo existente

### Archivo a modificar
| Archivo | Cambio |
|---------|--------|
| `src/components/AdminLayout.tsx` | Agregar botón Home en el header |

