## Goal

Make every landing-page section share the same title/subtitle pattern as the Boxeo block (the one you said you like):

```text
─────  TÍTULO  ─────
   subtítulo en mayúsculas
```

Reference (already live in `src/pages/Index.tsx`, `BoxeoBlock`):

- `<section>` with `border-y border-primary/20`, gradient background
- `<h2 class="text-3xl md:text-5xl font-black tracking-tighter uppercase">`
- Horizontal hairlines flanking the title
- Subtitle: `text-sm md:text-base text-muted-foreground uppercase tracking-widest`

Today only the Boxeo block uses it. MMA goes straight into a `Ranking` with no header, and the lower sections (Escuelas de Combate, Aliados, Cómo Funciona) use a different `ufc-label` echo style. Result: inconsistent hierarchy on landing.

## Changes

### 1. Create a reusable `SectionDivider` component
`src/components/landing/SectionDivider.tsx` — extracts the Boxeo header so every section uses one source of truth.

```tsx
<SectionDivider title="MMA" subtitle="Ultimate Combat Championship · Amateur · Pro" />
```

Props: `title: string`, `subtitle?: string`, optional `className`.

### 2. Refactor `BoxeoBlock` in `src/pages/Index.tsx`
Replace the inline `<section>` with `<SectionDivider title="Boxeo" subtitle="Liga Nacional Olímpica · Minor League" />`. Visual output unchanged.

### 3. Add an MMA divider before the MMA ranking in `Index.tsx`
```tsx
<SectionDivider title="MMA" subtitle="Ultimate Combat Championship Honduras" />
<Ranking organizationCode="UCC_MMA" compact />
```
Subtitle pulled from the org's `description` field in `ranking_organizations` (verified via DB: `Ultimate Combat Championship Honduras` / `UCC MMA`).

### 4. Unify the lower landing sections
Replace the `ufc-label` echo-layer headers with `<SectionDivider>` in:

- `src/components/sections/GymShowcase.tsx` — `title="Escuelas de Combate"`, `subtitle="Gimnasios y sus peleadores registrados"` (move current `<p>` into the subtitle slot, drop the duplicate header in the loading state by reusing the same component).
- `src/components/StrategicAllies.tsx` — `title="Aliados Estratégicos"` (keep existing subtitle text if any, else omit).
- `src/components/landing/HowItWorks.tsx` — wrap its current `<h2>` with `SectionDivider` using the same copy.

`Hero` (`<h1>`) is the page's only H1 and stays untouched — it's the brand title, not a section divider.

### 5. No DB / route / behavior changes
Pure presentational refactor. No new dependencies.

## Files touched

- new: `src/components/landing/SectionDivider.tsx`
- edit: `src/pages/Index.tsx` (add MMA divider, refactor `BoxeoBlock`)
- edit: `src/components/sections/GymShowcase.tsx`
- edit: `src/components/StrategicAllies.tsx`
- edit: `src/components/landing/HowItWorks.tsx`

## Out of scope

- Internal page headers (`PageHeader` on routes like `/social/discover`) — those use `<h1>` and a different gradient style appropriate for sub-pages, not landing sections. Happy to unify in a follow-up if you want one global standard.
- Copy/wording changes beyond what's needed to fit the title/subtitle slots.
