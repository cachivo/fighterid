
# Rediseno de la Pagina de Perfil de Peleador -- Estilo UFC Cinematico

## Problema Actual

La pagina de perfil del peleador (`/fighter/:id`) tiene un diseno generico con Cards de Radix sobre fondo oscuro plano. No tiene el impacto visual cinematico del Hero de la landing page. Ademas, hay problemas de coherencia cromatica: algunos textos se pierden contra fondos oscuros (ej: "Club" en verde sobre fondo oscuro, badges con bajo contraste).

---

## Estructura Propuesta

```text
+----------------------------------------------------------+
| [Imagen de fondo: arena MMA con overlay oscuro/rojo]     |
|                                                           |
|  < Inicio   < Fighters              [Editar Mi Perfil]  |
|                                                           |
|  +--AVATAR--+   "Muneco Gonzales"                        |
|  |          |   MIGUEL ALBERTO GONZALES MENA             |
|  |  (foto)  |   Honduras  |  Boxeo  |  Profesional      |
|  |          |   Club: Muneco Gonzales                    |
|  +----------+                                            |
|                                                           |
|  +--- Record Bar (combat-cut) ---+                       |
|  |  16 Victorias | 12 Derrotas | 0 Empates  |           |
|  +--------------------------------+                      |
|                                                           |
|  Linea roja decorativa                                    |
+----------------------------------------------------------+
|                                                           |
|  [Stats Grid: Altura | Peso | Alcance | Guardia]        |
|                                                           |
|  [Ligas Activas]                                         |
|                                                           |
|  [Perfil del Peleador: Bio, Artes Marciales, Estilo]    |
|  [Record + Licencia Digital]                             |
+----------------------------------------------------------+
```

---

## Cambios Concretos

### 1. `src/pages/FighterProfile.tsx` -- Rediseno del header del perfil

**Hero cinematico del perfil (lineas 149-322):**

Reemplazar el Card generico del header por una seccion estilo Hero con:

- **Fondo cinematico**: Imagen de fondo (`mma-cage-background.png`) con overlay oscuro gradiente, igual que el Hero de la landing
- **Layout**: Avatar grande a la izquierda, info del peleador a la derecha con tipografia `ufc-label` y `font-barlow-condensed`
- **Nombre**: Texto grande blanco con `text-4xl md:text-6xl font-extrabold tracking-wider` -- alta visibilidad
- **Nickname**: En color `text-primary` (rojo UFC) para contraste
- **Record bar**: Contenedor `combat-cut` con fondo semi-transparente (`bg-white/5 backdrop-blur-md border border-white/10`)
- **Badges**: Status en colores de alto contraste, disciplina y nivel prominentes
- **Club/Gym**: Texto blanco con icono, no verde que se pierde
- **Vignette**: Efecto de bordes oscuros igual al Hero

**Coherencia cromatica -- reglas aplicadas:**

- Textos principales: `text-white` (no `text-foreground` que puede ser gris)
- Textos secundarios: `text-white/70` o `text-white/80` (legibles sobre fondo oscuro)
- Labels/subtitulos: `text-white/60` con `uppercase tracking-wider`
- Badges de status: Colores solidos de alto contraste (verde/rojo/amarillo sobre fondo oscuro)
- Links: `text-primary` (rojo UFC) con hover underline
- Separadores: `bg-primary` (rojo) en vez de `bg-border` gris invisible

### 2. Auditoria de Coherencia Cromatica

**Problemas identificados y correcciones:**

| Elemento | Problema | Solucion |
|----------|----------|----------|
| "CLUB" label | Verde (`text-blue-400`) poco visible | `text-white/60 uppercase` |
| Gym name | `text-primary` puede ser bajo contraste en cards | Mantener `text-primary` solo sobre fondos oscuros |
| Record numbers | Verde/Rojo/Gris sobre fondos claros de card | Sobre Hero: `text-white` con bg colored; en cards: mantener actual |
| Muted foreground | `55%` luminosidad -- puede ser muy tenue | Verificar legibilidad en context de hero |
| Breadcrumb nav | `variant="ghost"` puede perderse | Textos blancos sobre el hero background |
| Stats grid cards | Fondo `bg-card` (8% negro) con texto `text-foreground` | Mantener -- funciona bien fuera del hero |

### 3. `src/pages/FighterProfile.tsx` -- Stats grid y secciones inferiores

Las secciones debajo del Hero (stats grid, ligas activas, biografia, record, licencia digital) se mantienen con el diseno actual de Cards, que funciona bien sobre el fondo `bg-background`. Solo se ajusta el espaciado para fluir naturalmente desde el hero.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/FighterProfile.tsx` | Reescritura del header section (lineas 149-322) como hero cinematico con fondo de arena, combat-cut decorations, tipografia UFC. Ajuste de colores para coherencia cromatica |

**Total: 1 archivo principal modificado**

---

## Notas Tecnicas

- Reutiliza las clases CSS existentes: `.combat-cut`, `.ufc-label`, `.status-live`
- Importa `cageBackground` de `@/assets/mma-cage-background.png` (ya usado en Hero.tsx)
- Responsive: mobile-first con breakpoints sm/md/lg
- El avatar se muestra mas grande en el hero (h-64 w-48 en desktop, h-48 w-36 en mobile)
- Breadcrumbs con texto blanco sobre overlay oscuro para visibilidad
- Sin cambios en backend ni base de datos
