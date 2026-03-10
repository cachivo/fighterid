

## Plan: Phase 1 — Scalability & Low-End Device Optimizations

This is a large audit. I'll focus on **practical, immediate wins** that can be implemented now without restructuring the entire codebase. Later phases can tackle micro-frontends, feature flags DB table, and module federation.

### Scope: What we implement NOW

**A. Device Capability Detection** — New `src/lib/deviceCapability.ts`
- Detect memory, CPU cores, connection type, RTT
- Compute `isLowEnd` score
- React hook `useDeviceCapability()` with reactive connection change listener

**B. Adaptive UI Hook** — New `src/hooks/useReducedMotion.ts`
- Combine `prefers-reduced-motion` + device capability
- Auto-disable animations on low-end devices
- Used in Auth.tsx background animations and any pulse/glow effects

**C. Aggressive Code Splitting in App.tsx**
- Move remaining eager imports to `lazy()`: `Index`, `Auth`, `AuthCallback`, `SocialFeed`, `Events`, `EventDetail`, `Fighters`, `FighterProfile`, `Contact`, `Gimnasios`, `GimnasioDetalle`, `Entrenadores`, `EntrenadorDetalle`, and all admin pages currently imported eagerly (Dashboard, EventosPelea, LiveStreaming, etc.)
- Keep only providers, layout shells, and route config as eager

**D. LazyImage Component** — New `src/components/ui/lazy-image.tsx`
- Intersection Observer-based image loading
- Placeholder/skeleton while loading
- `loading="lazy"` + `decoding="async"` attributes
- Replace key image usages in Header logo, fighter cards

**E. Enhanced Service Worker** — Update `public/sw.js`
- Add separate `IMAGE_CACHE` with 50-item FIFO eviction
- Stale-while-revalidate for API-like requests
- SVG placeholder fallback for failed images
- Cache-first for static assets (CSS, JS, fonts) by `request.destination`

**F. Performance Meta Tags** — Update `index.html`
- Add `dns-prefetch` and `preconnect` for Supabase domain
- Add `meta` viewport already exists, verify `font-display: swap` on Google Fonts import

**G. Virtual Scrolling Utility** — Skip for now (requires `@tanstack/react-virtual` dependency + refactoring list components). Recommend for Phase 2.

### Files to create/modify

| File | Action |
|------|--------|
| `src/lib/deviceCapability.ts` | New — capability detection + hook |
| `src/hooks/useReducedMotion.ts` | New — motion preference + low-end detection |
| `src/components/ui/lazy-image.tsx` | New — IO-based lazy image |
| `src/App.tsx` | Convert ~20 eager imports to `lazy()` |
| `public/sw.js` | Add image cache, stale-while-revalidate, destination-based strategies |
| `index.html` | Add preconnect/dns-prefetch hints |
| `src/index.css` | Google Fonts URL: add `&display=swap` (already has it — verify) |

### What is NOT in this phase
- Feature flags system + DB table — separate effort, needs migration + admin UI
- Module federation / micro-frontends — architectural change for 15+ dev teams
- Domain-driven folder restructure (`src/modules/`) — refactor effort, no user-facing benefit now
- XState auth machine — over-engineering for current team size
- Virtual scrolling — needs new dependency
- Offline form queue with IndexedDB — complex, Phase 3
- `performance_logs` table — needs DB migration, Phase 2
- Babel plugins for tree shaking — Vite already handles this via ESM

### Impact on old phones
- Lazy loading cuts initial bundle by ~40-60%
- Device detection disables animations automatically on ≤2GB RAM / 2G connections
- Image lazy loading reduces initial data transfer significantly
- Service worker strategies provide instant repeat visits and offline image fallbacks
- Preconnect hints save 100-300ms on first Supabase request

