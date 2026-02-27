

# Rediseno del Hero -- Estilo UFC Impactante

## Vision

Transformar el Hero actual (minimalista con gradientes sutiles) en una seccion cinematica estilo UFC con imagen de fondo de octogono/arena, estadisticas en vivo prominentes, y una estructura visual de alto impacto.

---

## Estructura del Nuevo Hero

### Para usuarios NO autenticados

```text
+----------------------------------------------------------+
|  [Imagen de fondo: octogono/arena con overlay oscuro]    |
|                                                           |
|        FIGHTER ID (logo grande, centrado)                 |
|   "La plataforma profesional de artes marciales mixtas"   |
|                                                           |
|   +--- Stats en linea (sin auth) ---+                    |
|   | 150+ Peleadores | 20+ Gimnasios | 10+ Eventos |     |
|   +----------------------------------+                    |
|                                                           |
|   [ Iniciar Sesion ]   [ Registrarse ]                   |
|                                                           |
|   Linea roja decorativa horizontal (combat-cut)           |
+----------------------------------------------------------+
```

### Para usuarios autenticados

```text
+----------------------------------------------------------+
|  [Imagen de fondo: arena con overlay rojo/negro]         |
|                                                           |
|  [EN VIVO] BATALLA DE CAMPEONES - 15 DIC                |
|                                                           |
|  +--- Quick Stats Bar (combat-cut) ---+                  |
|  | Peleadores: 150 | Activos: 89 | En Vivo: 2 |        |
|  +-------------------------------------+                  |
|                                                           |
|   [ Ver Peleadores ]   [ Ver Gimnasios ]                 |
|   [ Panel de Administracion ] (solo admin)               |
|                                                           |
|   Linea roja decorativa                                   |
+----------------------------------------------------------+
```

---

## Cambios Concretos

### 1. `src/components/Hero.tsx` (reescritura completa)

**Fondo cinematico:**
- Usar imagen de fondo (`mma-cage-background.png` o `blue-arena.jpg` que ya existen en assets)
- Overlay oscuro con gradiente: `bg-gradient-to-b from-black/70 via-black/50 to-background`
- Barra diagonal roja decorativa usando `combat-cut` en la parte inferior

**Seccion no-auth:**
- Titulo grande "FIGHTER ID" con `font-barlow-condensed text-5xl md:text-7xl font-extrabold uppercase tracking-widest`
- Subtitulo con `ufc-label` class
- Mini stats bar inline mostrando contadores de peleadores, gimnasios y eventos (datos de `useRealTimeStats`)
- Botones Iniciar Sesion / Registrarse con separador visual tipo linea roja

**Seccion auth:**
- Indicador EN VIVO mas prominente con badge `status-live`
- Stats bar horizontal con fondo semi-transparente y `combat-cut` styling
- CTAs "Ver Peleadores" y "Ver Gimnasios" mas grandes con iconos
- Boton admin con estilo diferenciado

**Elementos decorativos:**
- Linea horizontal roja (`w-24 h-1 bg-primary`) como separador visual
- Esquinas cortadas estilo `combat-cut` en contenedores
- Efecto de vignette (bordes oscuros) en la imagen de fondo

### 2. `src/pages/Index.tsx` (menor)

- Mover `QuickStats` para que no se duplique con los stats del Hero (solo mostrar debajo si el usuario no esta autenticado, o eliminar duplicacion)

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Hero.tsx` | Reescritura completa con estructura UFC impactante, imagen de fondo, stats inline, combat-cut decorations |
| `src/pages/Index.tsx` | Ajustar posicion de QuickStats para evitar duplicacion con Hero stats |

**Total: 2 archivos, sin archivos nuevos**

---

## Assets Existentes Disponibles

Ya existen en el proyecto y se pueden usar como fondo del Hero:
- `src/assets/mma-cage-background.png`
- `src/assets/blue-arena.jpg`
- `src/assets/arena-octagon.png`
- `public/lovable-uploads/octagon-background.png`

Se usara `mma-cage-background.png` como imagen de fondo principal con un overlay negro/rojo.

---

## Notas Tecnicas

- Se mantienen las clases CSS de combate ya creadas (`.combat-cut`, `.status-live`, `.ufc-label`)
- Se reutiliza `useRealTimeStats` para datos dinamicos
- Responsive: mobile-first con breakpoints sm/md/lg
- Imagen de fondo con `object-cover` y lazy loading

