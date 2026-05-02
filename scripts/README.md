# Fighter ID — Developer Bug-Fix Toolkit

Three pure-Python (stdlib only, 3.10+) scripts that audit and lightly fix the codebase.
All scripts are **conservative**: they never apply destructive changes without explicit `--apply` or `--fix` flags.

| Script | Purpose | When to run |
|---|---|---|
| `bug_hunter.py` | Scan for bugs, security issues, anti-patterns | Weekly / before releases |
| `react_logic_fixer.py` | Auto-fix common React/TS logic bugs | After `bug_hunter` findings |
| `preflight.py` | Pre-commit validation (secrets, types, tests) | Before every commit |

## Quick start

```bash
# Full scan → bug_report.md at repo root
python scripts/bug_hunter.py

# Only one category
python scripts/bug_hunter.py --category security

# Apply ONLY the documented safe fixes (drop console.log, add type="button")
python scripts/bug_hunter.py --fix

# React logic — dry run, writes patches to react_fixes_patches/
python scripts/react_logic_fixer.py

# Apply for real
python scripts/react_logic_fixer.py --apply

# Single file
python scripts/react_logic_fixer.py --file src/components/Hero.tsx

# Pre-commit
python scripts/preflight.py
python scripts/preflight.py --no-types --no-tests   # quick
```

## Install preflight as a git hook

```bash
cp scripts/preflight.py .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## What `bug_hunter.py` detects

**TypeScript** — `strict: false`, `: any`, `useState(...)` without generic.
**React** — `.map(...)` without `key`, `useEffect(async ...)`, direct DOM mutation, files >300 LOC.
**Security** — `.env` tracked in git, hardcoded `sk_live_…` / AWS / Google / Supabase service-role keys, auth tokens in `localStorage`, wildcard CORS in edge functions.
**Logic** — async functions awaiting without `try/catch`.
**A11y** — `<img>` without `alt`, `<button>` without `type`, non-hero `<img>` without `loading="lazy"`.

Severity legend (in `bug_report.md`):

| | Meaning |
|--|--|
| 🔴 Critical | Fix immediately |
| 🟠 High     | Fix this sprint |
| 🟡 Medium   | Fix next sprint |
| 🔵 Low      | Fix when convenient |

### Safe `--fix` mode

Only two transforms (both reversible via git):
- Removes lines that are exactly `console.log(...)`.
- Adds `type="button"` to single-line `<button>` tags lacking a `type`.

Everything else is reported but not changed.

## What `react_logic_fixer.py` rewrites

| Transform | What it does |
|---|---|
| `useState<T>` generics | `useState(null)` → `useState<unknown /* TODO */>(null)` (also `[]`, `{}`, empty) |
| Map keys | Adds `key={item.id ?? index}` on `.map(item => <Tag …>)` without a `key` |
| Return type | Adds `: Promise<void>` to exported `async function` lacking annotation |

Skipped: `*.test.ts(x)`, `*.d.ts`, `src/integrations/**`, anything under `__tests__`.
Default mode emits unified diffs to `react_fixes_patches/` plus a summary in `react_fixes_report.md`.

> **Always review patches before `--apply`.** The `unknown /* TODO */` placeholders are intentional flags — replace with the real types.

```bash
# Review one
cat react_fixes_patches/src__components__Hero.tsx.patch

# Apply selectively
git apply react_fixes_patches/src__components__Hero.tsx.patch
```

## What `preflight.py` validates

Blocking:
- `.env*` not tracked in git.
- No hardcoded secrets in staged files.
- No new `console.log(` lines in the staged diff.
- `npx tsc --noEmit` passes (skip with `--no-types`).
- `bunx vitest run` passes (skip with `--no-tests`).

Warnings (non-blocking):
- `tsconfig` without `"strict": true`.
- New file in `src/lib/` or `src/system/` without a sibling `.test.ts`.

## CI

A GitHub Actions workflow at `.github/workflows/ci.yml` runs:
1. `python scripts/bug_hunter.py --category security` (artifact-uploaded, non-blocking).
2. `npx tsc --noEmit`.
3. `bunx vitest run`.

## Recommended workflow

```text
1. Before starting work       python scripts/preflight.py --no-types --no-tests
2. While developing           python scripts/react_logic_fixer.py --file <file>
3. Before committing          python scripts/preflight.py
4. Weekly / pre-release       python scripts/bug_hunter.py
                              python scripts/react_logic_fixer.py
                              # review, then apply selectively
```

## Safety notes

- **Always review patches** before `--apply`. The `unknown` placeholders flag work for you.
- Run `bunx vitest run` after applying any fix.
- Back up your branch (or commit a clean baseline) before `--apply`.
- These scripts never modify `src/integrations/**` or test files.
