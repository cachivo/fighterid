

## Audit: Admin Login Flow Issues

### Problems Found

**1. `LicenseAuthProvider` runs for ALL users on EVERY page (CRITICAL)**

The entire app is wrapped in `LicenseAuthProvider` (App.tsx line 153). This provider runs `checkLicenseStatusOptimized` for every authenticated user on every page load — including admins going to `/admin/dashboard`. This triggers:
- An RPC call to `check_user_license_status` (which may fail or be slow)
- A 25-second backup timeout that fires when the RPC is slow
- The console log confirms this: `[TIMEOUT] [LICENSE AUTH] Backup timeout triggered after 25s`

An admin user navigating to their dashboard is getting blocked by the License auth check running in the background, potentially causing the page to feel "stuck" while waiting.

**2. `useAdmin` doesn't check for `super_admin` role**

The `useAdmin` hook (line 39) queries `user_roles` with `.eq('role', 'admin')` only. A user with `super_admin` but not `admin` would be blocked by `AdminProtectedRoute`. Currently the only `super_admin` (cachivo@gmail.com) also has `admin`, so this is a latent bug, not a current blocker — but will break when more super_admins are added.

**3. Double role-check on login → admin redirect**

When an admin selects "Administrador" and logs in:
1. `Auth.tsx` `routeAuthenticatedUser` queries `user_roles` and navigates to `/admin/dashboard`
2. `AdminProtectedRoute` runs `useAdmin` which queries `user_roles` again
3. Meanwhile `LicenseAuthProvider` also fires `checkLicenseStatusOptimized`

That's 3 Supabase calls racing simultaneously. On slow connections (mobile Honduras), this causes the "stuck" loading spinner.

### Root Cause Summary

```text
User selects Admin → Signs In
  ├── Auth.tsx: queries user_roles → navigates to /admin/dashboard
  ├── LicenseAuthProvider: runs checkLicenseStatusOptimized (UNNECESSARY for admins)
  │     └── 25s timeout fires → shows "Tiempo de espera agotado"
  └── AdminProtectedRoute: queries user_roles AGAIN → shows spinner
```

### Proposed Fix

**1. Skip license check for non-license routes** — In `LicenseAuthProvider`, check if the current route starts with `/license/` before running `checkLicenseStatusOptimized`. If the user is on `/admin/*`, `/gym/*`, or other non-license routes, skip the heavy RPC call entirely.

**2. Add `super_admin` to `useAdmin` check** — Change the query to use `.in('role', ['admin', 'super_admin'])` instead of `.eq('role', 'admin')`.

**3. Cache admin status** — After `Auth.tsx` already verifies admin role, pass that context forward so `AdminProtectedRoute` doesn't need to re-query.

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useLicenseAuth.tsx` | Add route check — skip license verification when not on `/license/*` paths |
| `src/hooks/useAdmin.tsx` | Query `.in('role', ['admin', 'super_admin'])` instead of `.eq('role', 'admin')` |

### Impact

- Admins will no longer wait for the license RPC call (eliminates the 25s timeout)
- `super_admin` users will be properly recognized by `AdminProtectedRoute`
- No changes to license module behavior — it will continue working as before for fighters

