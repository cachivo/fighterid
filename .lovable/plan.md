

## Add "Volver al Hub" button to License, Gym, and Judge modules

### What
Add a navigation button in each module so users can easily switch between Fighter, Gym, and Judge modules via `/profile/hub`.

### Changes

**1. `src/components/LicenseLayout.tsx`**
- Add `LayoutGrid` icon import from lucide-react
- Add a new nav item to the `navigation` array: `{ name: 'Cambiar Módulo', href: '/profile/hub', icon: LayoutGrid }`
- Also add a small "Hub" button in the header bar (visible on mobile) next to the "Inicio" button

**2. `src/pages/gym/GymDashboard.tsx`**
- Import `LayoutGrid` from lucide-react
- Add a "Volver al Hub" button in the quick actions section at the bottom, linking to `/profile/hub`

**3. `src/pages/judge/JudgeOnboarding.tsx`**
- No change needed here — this is a one-time onboarding form, not a dashboard

**3 locations touched across 2 files.**

