

# Plan: Auditoría Técnica Fighter ID — Implementación en 4 Fases

## Validación del Diagnóstico

After reviewing the codebase, I confirm the following issues are real:

1. **Auth.tsx line 56**: `localStorage.setItem('fighter_id_selected_role', selectedRole)` — role lost on device change
2. **useAuth.tsx line 120**: `signUp` hardcodes redirect to `/license/onboarding` regardless of role
3. **AuthCallback.tsx line 48-49**: reads role from `localStorage` — fails cross-device
4. **useUserRole.tsx line 6**: `AppRole` only has 3 of 17 roles
5. **ProfileSetup.tsx line 57-63**: INSERT missing `first_name` and `last_name`
6. **LicenseOnboarding.tsx line 124-129**: draft saves on every `formData` change (no debounce)
7. **LicenseProtectedRoute.tsx lines 28,35**: fixed 8s/20s timers
8. **useOptimizedOnboarding.ts**: exists and works (audit claim of "import fails silently" is incorrect)
9. **FileUpload.tsx**: already has image compression via `resizeImageForMobile` — this is NOT a problem

## What We Will NOT Change (Already Working)
- FileUpload compression (already implemented with `resizeImageForMobile`)
- `useOptimizedOnboarding` (exists and works correctly)
- `useLicenseAuth` already uses RPC as primary method (line 65)

---

## FASE 1 — Flujo de Perfiles (7 archivos)

### 1.1 Auth.tsx — Save role in Supabase metadata instead of localStorage
- Line 54-61: Replace `localStorage.setItem('fighter_id_selected_role', selectedRole)` with `supabase.auth.updateUser({ data: { onboarding_role: selectedRole } })`
- Keep localStorage as immediate fallback for same-session use

### 1.2 useAuth.tsx — Dynamic signUp redirect
- Line 120: Change hardcoded `/license/onboarding` to `/auth/callback` so AuthCallback handles routing
- This ensures all users go through the proper routing logic

### 1.3 AuthCallback.tsx — Read role from Supabase metadata
- Lines 48-49: Read from `session.user.user_metadata?.onboarding_role` instead of localStorage
- Lines 189-190: Same change in `determineUserDestination()`
- Add fallback: try metadata first, then localStorage for backwards compatibility

### 1.4 useUserRole.tsx — Expand to all 17 roles
- Line 6: Expand `AppRole` type to include all roles: `gym_owner`, `gym_coach`, `gym_assistant`, `official_judge`, `official_referee`, `official_doctor`, `official_timekeeper`, `official_inspector`, `license_officer`, `technical_coordinator`, `auditor`, `promoter`, `super_admin`, `judge`
- Add convenience booleans: `isGymOwner`, `isJudge`, `isSuperAdmin`

### 1.5 ProfileSetup.tsx — Include first_name/last_name in INSERT
- Lines 57-63: Add `first_name: data.firstName` and `last_name: data.lastName` to the insert object
- Same for the update fallback (line 67-72)

### 1.6 Create ProfileHub.tsx — New page `/profile/hub`
- Central landing page for users without a specific module
- Shows available modules (Fighter, Gym, Judge) with status indicators
- Links to each module's onboarding
- Admin module not shown (assigned via admin panel only)

### 1.7 App.tsx — Add route `/profile/hub`
- Add new route pointing to ProfileHub component

---

## FASE 2 — Compatibilidad Móvil (2 archivos)

### 2.1 LicenseOnboarding.tsx — Debounce draft saves
- Lines 124-129: Add 500ms debounce using `useDebounce` hook (already exists in project) before saving to localStorage
- Only save when user stops typing

### 2.2 LicenseProtectedRoute.tsx — Adaptive timeouts
- Lines 28, 35: Use `navigator.connection.effectiveType` to determine timeouts
- 2g/slow-2g: 30s/60s
- 3g: 15s/40s
- 4g/wifi: 8s/20s (current)

---

## FASE 3 — Onboarding Guards (2 archivos)

### 3.1 GymOnboarding.tsx — Check for existing gym
- Add query to verify user doesn't already have an active gym before showing form

### 3.2 JudgeOnboarding.tsx — Check for existing judge record
- Add query to verify user isn't already registered as judge

---

## FASE 4 — No SQL migrations needed
- `app_user` table already has `first_name` and `last_name` columns (confirmed by ProfileSetup referencing them)
- No new tables required for Phase 1-3

---

## Files Modified Summary

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Save role to Supabase metadata |
| `src/hooks/useAuth.tsx` | Dynamic signUp redirect |
| `src/pages/AuthCallback.tsx` | Read role from metadata + localStorage fallback |
| `src/hooks/useUserRole.tsx` | Expand to 17 roles |
| `src/pages/profile/ProfileSetup.tsx` | Add first_name/last_name to INSERT |
| `src/pages/profile/ProfileHub.tsx` | NEW — module selection hub |
| `src/App.tsx` | Add /profile/hub route |
| `src/pages/license/LicenseOnboarding.tsx` | Debounce draft saves |
| `src/components/LicenseProtectedRoute.tsx` | Adaptive timeouts |
| `src/pages/gym/GymOnboarding.tsx` | Existing gym check |
| `src/pages/judge/JudgeOnboarding.tsx` | Existing judge check |

**11 files total. No SQL migrations.**

