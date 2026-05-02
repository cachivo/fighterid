# Fighter ID — Developer Bug-Fix Toolkit

Conservative, dry-run-by-default Python toolkit committed to `scripts/`, plus a CI workflow and a real first-run report.

## Deliverables

### 1. `scripts/bug_hunter.py`
Pure-stdlib Python (no pip deps) AST + regex scanner.

- **CLI**: `--category {typescript,react,security,logic,a11y,all}` (default `all`), `--fix` (only safe fixes: `console.log` removal, `<button>` `type="button"`, `<img>` `alt=""` placeholder), `--path <dir>` (default repo root), `--out bug_report.md`.
- **Scope**: walks `src/`, `supabase/functions/`, `index.html`, `tsconfig*.json`, `.env*`. Honors `.gitignore` basics (skips `node_modules`, `dist`, `.lovable`, `mem://`).
- **Rules** (each tagged severity 🔴/🟠/🟡/🔵):
  - TS: `strict: false`, `: any` annotations, untyped function params, `useState(` without generic.
  - React: `useEffect` with empty deps but referenced vars; direct `document.`/`window.` mutation; `.map(` without `key=`; inline arrows in JSX props (info only); early-return inside hook body; component file >300 LOC.
  - Security: `.env` tracked (checks `git ls-files`), `Access-Control-Allow-Origin: *` in edge functions, `localStorage.setItem('token'|'session'|'auth'`, regex for hardcoded keys (`sk_live_`, `eyJ…` JWTs, `SUPABASE_SERVICE_ROLE`).
  - Logic: `async` function bodies without `try`/`catch` or `.catch(`; `useEffect(async` or async IIFE without `AbortController`; component prop count ≥8; pages without `<ErrorBoundary>` ancestor (heuristic on `src/pages/`).
  - A11y: `<img` missing `alt`, `<button` missing `type`, `<img` missing `loading="lazy"` outside hero.
- **Output**: `bug_report.md` with summary table + grouped findings (file:line, snippet, suggested fix).

### 2. `scripts/react_logic_fixer.py`
AST-light line-based rewriter. **Dry-run by default** → writes unified diffs to `react_fixes_patches/*.patch` and `react_fixes_report.md`. `--apply` writes in place. `--file <path>` scopes to one file.

- AbortController scaffolding around `useEffect(() => { ... fetch/supabase ... })`.
- Wrap unguarded `async` function bodies in `try { … } catch (err) { console.error(err); }`.
- Wrap obvious `arr.sort(`/`.filter(`/`.reduce(` on inline arrays inside components in `useMemo`.
- Add `<unknown>` (flagged for manual review) generic to `useState(null|[]|{})`.
- Add `key={…id ?? index}` to `.map(` JSX without `key`.
- Replace `useState(undefined)` / `useState()` with typed empty defaults per pattern (`''`, `null`, `[]`, `false`).
- Add `: Promise<void>` to exported `async function` lacking return annotation.

Safety: never touches files under `supabase/functions/_shared/`, `src/integrations/supabase/`, `*.test.ts`, or `*.d.ts`. All rewrites are reversible via the emitted patch.

### 3. `scripts/preflight.py`
Local + git-hook validator.

- Aborts if `.env` is staged or tracked.
- Greps staged diff for hardcoded secrets and stray `console.log`.
- Asserts `tsconfig.json` (or `.app.json`) sets `"strict": true` (warns, doesn't block — current repo is loose).
- Warns when `.tsx`/`.ts` source is modified without a corresponding `*.test.ts`.
- Runs `npx tsc --noEmit` and `bunx vitest run --reporter=dot` (skippable via `--no-types` / `--no-tests` for speed).
- Exit code propagates to git pre-commit.

### 4. `scripts/README.md`
The toolkit doc you provided, trimmed to match actual flags + repo paths.

### 5. `.github/workflows/ci.yml`
Job matrix: `bug-hunter` (security category, non-blocking artifact upload of `bug_report.md`), `typecheck` (`npx tsc --noEmit`), `tests` (`bunx vitest run`). Triggers: PR + push to default branch.

### 6. First-run artifacts (run after build)
- Execute `python scripts/bug_hunter.py` → commit `bug_report.md` at repo root and copy to `/mnt/documents/bug_report.md` for download.
- Execute `python scripts/react_logic_fixer.py` (dry-run) → emit `react_fixes_report.md` + `react_fixes_patches/` (gitignored, surfaced as a downloadable zip in `/mnt/documents/`).
- Do **not** auto-apply any fix in this loop. Findings are reviewed by you before any follow-up patch loop.

## Out of scope (this loop)
- Applying any patch to `src/` (beyond the toolkit + CI files themselves).
- Installing the git hook automatically — `scripts/README.md` documents the one-liner.
- Fixing findings the scanner surfaces (separate loop, prioritized by severity).

## File map

```text
scripts/
├── bug_hunter.py
├── react_logic_fixer.py
├── preflight.py
└── README.md
.github/workflows/ci.yml
.gitignore                      # +react_fixes_patches/, +bug_report.md (optional)
bug_report.md                   # generated, committed
/mnt/documents/bug_report.md    # downloadable copy
/mnt/documents/react_fixes_patches.zip
```

## Acceptance
- All three scripts run with `python scripts/<name>.py --help` and exit 0 on a clean tree.
- `bug_report.md` has the summary table from your spec, populated with real counts.
- CI workflow parses (`actionlint`-clean) and references existing `bun`/`npm` setup.
- No source files in `src/` modified.

Approve and I'll build + run.