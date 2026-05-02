#!/usr/bin/env python3
"""
preflight.py — pre-commit validation.

Usage:
    python scripts/preflight.py
    python scripts/preflight.py --no-types --no-tests   # quick mode

Install as git hook:
    cp scripts/preflight.py .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SECRET_PATTERNS = [
    re.compile(r"sk_live_[A-Za-z0-9]{16,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"AIza[0-9A-Za-z\-_]{35}"),
    re.compile(r"SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"]?eyJ"),
]
CONSOLE_LOG = re.compile(r"^\+\s*console\.log\(")


def sh(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(args, cwd=ROOT, capture_output=True, text=True)


def staged_files() -> list[str]:
    out = sh(["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"])
    return [l for l in out.stdout.splitlines() if l.strip()]


def staged_diff() -> str:
    return sh(["git", "diff", "--cached"]).stdout


# ---------------------------------------------------------------------------
# Checks

def check_env_not_tracked() -> list[str]:
    out = sh(["git", "ls-files", ".env", ".env.local", ".env.production"])
    return [f".env tracked in git: {l}" for l in out.stdout.splitlines() if l.strip()]


def check_no_secrets(files: list[str]) -> list[str]:
    errs: list[str] = []
    for f in files:
        p = ROOT / f
        if not p.exists() or p.is_dir():
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for pat in SECRET_PATTERNS:
            if pat.search(text):
                errs.append(f"possible hardcoded secret in {f}")
                break
    return errs


def check_no_console_log(diff: str) -> list[str]:
    hits = [l for l in diff.splitlines() if CONSOLE_LOG.match(l)]
    return [f"{len(hits)} new console.log line(s) in staged diff"] if hits else []


def check_strict_mode() -> list[str]:
    warnings: list[str] = []
    for tsf in ("tsconfig.json", "tsconfig.app.json"):
        p = ROOT / tsf
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        if '"strict": true' not in text:
            warnings.append(f"{tsf} does not enable strict: true (warning)")
    return warnings


def check_test_companions(files: list[str]) -> list[str]:
    warns: list[str] = []
    for f in files:
        if not (f.endswith(".ts") or f.endswith(".tsx")):
            continue
        if f.endswith(".test.ts") or f.endswith(".test.tsx") or f.endswith(".d.ts"):
            continue
        if "src/lib/" not in f and "src/system/" not in f:
            continue  # only require tests for pure-logic dirs
        base = f.rsplit(".", 1)[0]
        if not ((ROOT / f"{base}.test.ts").exists() or (ROOT / f"{base}.test.tsx").exists()):
            warns.append(f"no test for pure-logic file: {f} (warning)")
    return warns


def check_types() -> list[str]:
    out = sh(["npx", "--yes", "tsc", "--noEmit"])
    if out.returncode != 0:
        return ["tsc --noEmit failed:\n" + (out.stdout + out.stderr)[-2000:]]
    return []


def check_tests() -> list[str]:
    out = sh(["bunx", "vitest", "run", "--reporter=dot"])
    if out.returncode != 0:
        return ["vitest failed:\n" + (out.stdout + out.stderr)[-2000:]]
    return []


# ---------------------------------------------------------------------------
# Main

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-types", action="store_true")
    ap.add_argument("--no-tests", action="store_true")
    args = ap.parse_args()

    files = staged_files()
    diff = staged_diff() if files else ""

    blocking: list[str] = []
    warnings: list[str] = []

    blocking += check_env_not_tracked()
    blocking += check_no_secrets(files)
    if diff:
        blocking += check_no_console_log(diff)
    warnings += check_strict_mode()
    warnings += check_test_companions(files)

    if not args.no_types:
        blocking += check_types()
    if not args.no_tests:
        blocking += check_tests()

    print("=== Preflight ===")
    print(f"staged: {len(files)} files")
    for w in warnings:
        print(f"  ⚠  {w}")
    if blocking:
        print("BLOCKING:")
        for b in blocking:
            print(f"  ✗  {b}")
        return 1
    print("✓ all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
