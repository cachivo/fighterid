

## Plan: Phase 1 — Quick Wins de UX (Auth, Loading States, Navigation)

This plan covers the Phase 1 items from the audit: password strength indicator, skeleton screens, improved error recovery, and visual feedback improvements. Phases 2 and 3 can follow in subsequent iterations.

### 1. Password Strength Indicator — `src/pages/Auth.tsx`

Add a real-time strength meter below the password input in the register step:
- Function `getPasswordStrength(pwd)` evaluates length, uppercase, numbers, special chars
- Visual bar with 3 levels: Debil (red), Media (yellow), Fuerte (green)
- Only shown in register step, not login

### 2. Email Check Visual Feedback — `src/pages/Auth.tsx`

Replace the simple `Loader2` during email check with a more descriptive state:
- Show "Verificando email..." text alongside the spinner
- Disable the email input during check to prevent double-submission

### 3. Skeleton Screens — New `src/components/ui/page-skeleton.tsx`

Create a reusable skeleton component for dashboard/page loading states:
- Replace `<Loader2>` spinners in `Auth.tsx` (loading state), `ProfileHub.tsx`, and `Header.tsx` module checks
- Content-shaped skeletons (card outlines, text lines) instead of generic spinners

### 4. Smart Error Recovery — `src/pages/AuthCallback.tsx`

Improve error states with contextual messages:
- Detect "expired" links → show "Tu enlace ha expirado. Solicita uno nuevo."
- Detect "already confirmed" → show "Tu cuenta ya fue confirmada. Inicia sesion." with direct button
- Add "Solicitar nuevo enlace" button that calls `resendConfirmation`

### 5. Reduced Motion Support — `src/pages/Auth.tsx`

Respect `prefers-reduced-motion` for the background pulse animations:
- Add CSS media query or inline check to disable/reduce animations

### Files to modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Password strength meter, email check feedback, reduced motion |
| `src/pages/AuthCallback.tsx` | Contextual error messages with recovery actions |
| `src/components/ui/page-skeleton.tsx` | New reusable skeleton component |
| `src/pages/profile/ProfileHub.tsx` | Replace Loader2 with skeleton |
| `src/index.css` | Add `prefers-reduced-motion` media query for pulse animations |

### What is NOT in this phase
- Social login (Google/Apple OAuth) — requires Supabase dashboard config, separate effort
- Magic links — separate feature
- Dashboard widgets redesign — Phase 2
- Command palette / module switcher — Phase 2
- Real-time subscriptions — Phase 3
- Offline support — Phase 3

