

# Mejora Visual: Gimnasio vs Ligas Activas

## Problema

En el perfil del peleador, la seccion de **Gimnasio** (club al que pertenece) y las **Ligas Activas** (organizaciones donde compite) tienen un estilo visual similar. Esto causa confusion, como en el caso de Willis Yang donde "Club de Boxeo Chele Munguia" (su gimnasio) y "Honduras Hood Fights" (una liga) parecen ser lo mismo.

## Solucion

Diferenciar visualmente ambas secciones con iconos, colores y etiquetas claras.

### Cambio 1: Seccion Gimnasio en el header (ya existente, mejorar)

- Agregar una etiqueta "CLUB" mas visible con icono `Building2`
- Mantener el fondo `bg-muted/50` actual pero agregar un borde izquierdo de color para diferenciarlo
- Si no tiene gimnasio, mostrar "Independiente" con icono de usuario solo

### Cambio 2: Seccion Ligas Activas (ya existente, mejorar)

- Cambiar icono de `Swords` a `Trophy` para cada liga individual (las ligas son competencias, no combates)
- Agregar una etiqueta explicativa debajo del titulo: "Organizaciones donde compite"
- Agregar un borde izquierdo de color diferente (amarillo/dorado) para diferenciar de gimnasio
- Mostrar el nombre completo de la organizacion, no solo el `short_name`

### Cambio 3: Mover Ligas Activas fuera de la seccion "Perfil del Peleador"

Actualmente las ligas estan mezcladas dentro de la card de "Perfil del Peleador" junto con biografia y artes marciales. Moverlas a su propia Card separada inmediatamente despues del gimnasio, para que la distincion sea aun mas clara.

## Resultado Visual Esperado

```text
+------------------------------------------+
| CLUB (Building2 icon)                    |
| Club de Boxeo Chele Munguia  [logo]     |
| border-left: blue                        |
+------------------------------------------+

+------------------------------------------+
| LIGAS ACTIVAS (Trophy icon)              |
| "Organizaciones donde compite"           |
|                                          |
| [Trophy] UCC Honduras                   |
|   MMA - Amateur - 135 lbs  |  45 pts    |
|                                          |
| [Trophy] Honduras Hood Fights            |
|   MMA - Amateur - 135 lbs  |  30 pts    |
| border-left: yellow/gold                 |
+------------------------------------------+
```

## Seccion Tecnica

### Archivo modificado: `src/pages/FighterProfile.tsx`

1. **Lineas 234-259** (seccion Gimnasio en header): Agregar `border-l-4 border-l-blue-500` y hacer la etiqueta "CLUB" mas prominente

2. **Lineas 400-443** (seccion Ligas Activas): Extraer de la card "Perfil del Peleador" y crear una Card independiente justo despues de la grid de stats (linea 342). Cambiar iconos de `Swords` a `Trophy`, agregar subtitulo explicativo, y usar `border-l-4 border-l-yellow-500`

3. **Mostrar nombre completo**: Cambiar `league.organization_short_name` a `league.organization_name` con `organization_short_name` como subtexto

### Archivo modificado: `src/components/EnhancedFighterID.tsx`

No requiere cambios ya que este componente no muestra ligas (solo muestra info del gimnasio en la seccion profesional).

