

# Rediseño de CTAs del Hero (Página de Inicio)

## Cambio

En el Hero para usuarios autenticados, reemplazar los dos botones actuales:

- ~~"Ver Feed Social"~~ (eliminar como prioridad)
- "Explorar Peleadores" (mantener/renombrar)

Por estos dos CTAs principales:

1. **"Ver Peleadores"** -- boton primario (variant `hero`), icono `Trophy`, navega a `/fighters`
2. **"Ver Gimnasios"** -- boton secundario (variant `urban`), icono `Dumbbell`, navega a `/gimnasios`

## Archivo a modificar

`src/components/Hero.tsx` -- lineas 122-141

### Cambio concreto

Reemplazar el bloque de CTAs:

```text
Antes:
  Button "Ver Feed Social"  -> /social/feed  (hero)
  Button "Explorar Peleadores" -> /fighters (urban)

Despues:
  Button "Ver Peleadores"   -> /fighters    (hero, icono Trophy)
  Button "Ver Gimnasios"    -> /gimnasios   (urban, icono Dumbbell)
```

- Agregar import de `Dumbbell` desde `lucide-react`
- Eliminar import de `Zap` si no se usa en otro lugar del componente

**Total: 1 archivo modificado, ~10 lineas cambiadas**

