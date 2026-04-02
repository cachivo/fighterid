

# Aplicar Principios Swiss-Brutalist al Tema Combat Fighter ID

## Filosofia

Adaptar las mejores tecnicas del diseño Swiss-minimalist al tema oscuro existente (negro/rojo UFC). NO se cambia la paleta de colores ni la identidad de marca. Se incorporan: echo tipografico, micro-interacciones premium, mejor jerarquia tipografica, transiciones grayscale-to-color en imagenes, y elementos pill-shaped.

## Cambios

### 1. Tipographic Echo Stack en Hero (`Hero.tsx`)

Agregar el efecto "echo" detras del titulo "FIGHTER ID" — 4 capas de texto en grises oscuros posicionadas absolutamente, cada una desplazada -0.04em, creando profundidad tipografica. Colores adaptados al tema oscuro: `#1a1a1a`, `#151515`, `#121212`, `#0f0f0f`.

### 2. Micro-interacciones CSS (`index.css`)

- `clip-path: inset` reveal animation (700ms cubic-bezier) para imagenes
- Transicion grayscale(20%) → grayscale(0%) + scale(1.05) en hover para tarjetas con imagenes (gyms, partners)
- Clase `.pill-button` con border-radius 9999px y border invertido en hover
- Clase `.editorial-divider` — linea vertical hairline animada
- Mejor tracking (-0.05em) para titulos grandes

### 3. Header — Boton Contact pill-shaped (`Header.tsx`)

Agregar boton "Contacto" con estilo pill (rounded-full, border 1px solid white/20) que invierte colores en hover. Sutil y editorial.

### 4. GymShowcase — Grayscale hover transition (`GymShowcase.tsx`)

Aplicar `filter: grayscale(20%)` por defecto a avatares de gimnasios, transitando a color completo + scale(1.05) en hover.

### 5. StrategicAllies — Grayscale logos + reveal (`StrategicAllies.tsx`)

Logos de partners inician en grayscale(100%), transicionan a color en hover. Agrega clase de reveal con clip-path.

### 6. Footer — Estilo editorial dark (`Footer.tsx`)

Fondo `#1e1e1e` (mas refinado que primary plano), texto al 60% opacidad, border-top sutil al 5% opacidad blanca, layout 4 columnas mas editorial.

### 7. QuickStats — Tipografia refinada (`QuickStats.tsx`)

Mejor spacing, tracking -0.02em en numeros, separadores mas sutiles.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/index.css` | Nuevas clases: echo-stack, image-reveal, pill-button, editorial-divider, grayscale hover |
| `src/components/Hero.tsx` | Echo stack en titulo FIGHTER ID |
| `src/components/Header.tsx` | Boton contacto pill-shaped |
| `src/components/sections/GymShowcase.tsx` | Grayscale-to-color hover en avatares |
| `src/components/StrategicAllies.tsx` | Grayscale logos con transicion |
| `src/components/Footer.tsx` | Estilo editorial dark refinado |
| `src/components/QuickStats.tsx` | Tipografia refinada con tracking |
| `index.html` | Agregar font Clash Display via Google Fonts alternativa (Bebas Neue o similar) |

## Detalle tecnico

```css
/* Echo Stack */
.echo-layer { position: absolute; pointer-events: none; }
.echo-1 { transform: translate(-0.04em, -0.04em); color: #1a1a1a; }
.echo-2 { transform: translate(-0.08em, -0.08em); color: #151515; }

/* Image reveal */
.image-reveal {
  clip-path: inset(100% 0 0 0);
  animation: reveal 700ms cubic-bezier(0.77, 0, 0.175, 1) forwards;
}
@keyframes reveal {
  to { clip-path: inset(0); }
}

/* Grayscale hover */
.grayscale-hover {
  filter: grayscale(20%);
  transition: filter 400ms, transform 400ms;
}
.grayscale-hover:hover {
  filter: grayscale(0%);
  transform: scale(1.05);
}
```

