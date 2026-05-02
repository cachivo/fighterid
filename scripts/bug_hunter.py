#!/usr/bin/env python3
"""
bug_hunter.py — Fighter ID codebase scanner.

Usage:
    python scripts/bug_hunter.py
    python scripts/bug_hunter.py --category security
    python scripts/bug_hunter.py --fix          # apply only safe fixes
    python scripts/bug_hunter.py --out bug_report.md

Pure stdlib. Walks src/, supabase/functions/, index.html, tsconfig*.json, .env*.
Emits a markdown report with severity-grouped findings.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

# ---------------------------------------------------------------------------
# Config

ROOT = Path(__file__).resolve().parent.parent
SCAN_DIRS = ["src", "supabase/functions"]
SCAN_FILES = ["index.html", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json"]
SKIP_DIRS = {"node_modules", "dist", "build", ".git", ".lovable", "react_fixes_patches"}
SKIP_SUFFIXES = {".lock", ".lockb", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff", ".woff2", ".ttf"}
SKIP_FILES = {"bun.lock", "bun.lockb", "package-lock.json"}

SEVERITY_EMOJI = {
    "critical": "🔴 Critical",
    "high":     "🟠 High",
    "medium":   "🟡 Medium",
    "low":      "🔵 Low",
}
SEVERITY_ORDER = ["critical", "high", "medium", "low"]

CATEGORIES = ["typescript", "react", "security", "logic", "a11y"]


@dataclass
class Finding:
    severity: str
    category: str
    rule: str
    file: str
    line: int
    snippet: str
    suggestion: str = ""

    def md(self) -> str:
        return (
            f"- **{self.rule}** — `{self.file}:{self.line}`\n"
            f"  ```\n  {self.snippet.strip()[:200]}\n  ```\n"
            + (f"  → _{self.suggestion}_\n" if self.suggestion else "")
        )


# ---------------------------------------------------------------------------
# Walking

def iter_files(root: Path) -> Iterable[Path]:
    seen: set[Path] = set()
    for d in SCAN_DIRS:
        base = root / d
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_dir():
                continue
            parts = set(p.parts)
            if parts & SKIP_DIRS:
                continue
            if p.suffix in SKIP_SUFFIXES:
                continue
            if p.name in SKIP_FILES:
                continue
            seen.add(p.resolve())
            yield p
    for f in SCAN_FILES:
        p = root / f
        if p.exists() and p.resolve() not in seen:
            yield p


def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


# ---------------------------------------------------------------------------
# Scanners

def scan_typescript(p: Path, text: str, findings: list[Finding]) -> None:
    name = p.name
    if name in {"tsconfig.json", "tsconfig.app.json", "tsconfig.node.json"}:
        try:
            data = json.loads(re.sub(r"//.*", "", text))
            opts = data.get("compilerOptions", {}) or {}
            if opts.get("strict") is False or "strict" not in opts:
                # Only flag the root file (tsconfig.app overrides)
                if name in {"tsconfig.json", "tsconfig.app.json"}:
                    findings.append(Finding(
                        "high", "typescript", "TS strict mode disabled",
                        rel(p), 1, '"strict": false (or missing)',
                        'Enable `"strict": true` in compilerOptions to catch null/undefined bugs at build time.',
                    ))
            if opts.get("noImplicitAny") is False:
                findings.append(Finding(
                    "medium", "typescript", "noImplicitAny disabled",
                    rel(p), 1, '"noImplicitAny": false',
                    "Re-enable noImplicitAny to force explicit parameter types.",
                ))
        except Exception:
            pass
        return

    if p.suffix not in {".ts", ".tsx"}:
        return

    for i, line in enumerate(text.splitlines(), 1):
        # `: any` (not in comments) — exclude `as any` cast frequency by counting separately
        if re.search(r":\s*any\b", line) and "// eslint" not in line and not line.strip().startswith("//"):
            findings.append(Finding(
                "medium", "typescript", "Explicit `any` annotation",
                rel(p), i, line, "Replace `any` with the actual type or `unknown` + narrowing.",
            ))
        # useState without generic, with null/[]/{} default
        m = re.search(r"useState\((null|\[\]|\{\})\)", line)
        if m and "useState<" not in line:
            findings.append(Finding(
                "low", "typescript", "useState without generic",
                rel(p), i, line, f"Add a type: useState<YourType{'[]' if m.group(1)=='[]' else ''}>({m.group(1)}).",
            ))


JSX_MAP_NO_KEY = re.compile(r"\.map\(\s*\(?[\w$,\s]*\)?\s*=>\s*<(\w[\w-]*)\b(?![^>]*\bkey=)")
DOM_MUTATION = re.compile(r"\b(document\.(getElementById|querySelector|querySelectorAll)|window\.(innerHTML|location\s*=))\b")
USE_EFFECT_EMPTY = re.compile(r"useEffect\(\s*\(\)\s*=>\s*\{")
ASYNC_USE_EFFECT = re.compile(r"useEffect\(\s*async\b")
ASYNC_FN = re.compile(r"\basync\s+(?:function\b|\([^)]*\)\s*=>|[\w$]+\s*\([^)]*\)\s*\{)")


def scan_react(p: Path, text: str, findings: list[Finding]) -> None:
    if p.suffix not in {".ts", ".tsx"}:
        return
    is_component = p.suffix == ".tsx"

    lines = text.splitlines()
    if is_component and len(lines) > 300:
        findings.append(Finding(
            "medium", "react", f"Component file too long ({len(lines)} LOC)",
            rel(p), 1, f"{len(lines)} lines",
            "Consider splitting into smaller focused components/hooks (<300 LOC).",
        ))

    for i, line in enumerate(lines, 1):
        if JSX_MAP_NO_KEY.search(line):
            findings.append(Finding(
                "high", "react", "`.map(...)` JSX without `key` prop",
                rel(p), i, line, "Add a stable `key={item.id ?? index}` to the rendered element.",
            ))
        if DOM_MUTATION.search(line) and "test" not in p.name:
            findings.append(Finding(
                "low", "react", "Direct DOM access",
                rel(p), i, line, "Use a ref or React state instead of direct DOM manipulation when possible.",
            ))
        if ASYNC_USE_EFFECT.search(line):
            findings.append(Finding(
                "high", "react", "`useEffect(async ...)` callback",
                rel(p), i, line, "useEffect callback must be sync; declare an inner async fn and call it.",
            ))


SECRETS = [
    (re.compile(r"sk_live_[A-Za-z0-9]{16,}"), "Stripe live secret key"),
    (re.compile(r"sk_test_[A-Za-z0-9]{16,}"), "Stripe test secret key"),
    (re.compile(r"AIza[0-9A-Za-z\-_]{35}"),  "Google API key"),
    (re.compile(r"AKIA[0-9A-Z]{16}"),         "AWS access key"),
    (re.compile(r"SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"]?eyJ"), "Supabase service-role key in source"),
]
LOCALSTORAGE_AUTH = re.compile(r"localStorage\.setItem\(\s*['\"](?:token|auth|jwt|session|access_token|refresh_token)")
WILDCARD_CORS = re.compile(r"['\"]Access-Control-Allow-Origin['\"]\s*:\s*['\"]\*['\"]")


def scan_security(p: Path, text: str, findings: list[Finding]) -> None:
    rp = rel(p)
    for i, line in enumerate(text.splitlines(), 1):
        for pat, label in SECRETS:
            if pat.search(line):
                findings.append(Finding(
                    "critical", "security", f"Hardcoded secret: {label}",
                    rp, i, line, "Move to Lovable Cloud secrets / environment, never commit.",
                ))
        if LOCALSTORAGE_AUTH.search(line):
            findings.append(Finding(
                "high", "security", "Auth/session token in localStorage",
                rp, i, line, "Use Supabase client session storage, not raw localStorage; XSS-exposed.",
            ))
        if WILDCARD_CORS.search(line) and "supabase/functions" in rp:
            findings.append(Finding(
                "high", "security", "Wildcard CORS in edge function",
                rp, i, line, "Restrict Access-Control-Allow-Origin to your domain(s).",
            ))


def scan_security_global(root: Path, findings: list[Finding]) -> None:
    # .env tracked in git?
    try:
        out = subprocess.run(
            ["git", "ls-files", ".env", ".env.local", ".env.production"],
            cwd=root, capture_output=True, text=True, timeout=5,
        )
        for ln in out.stdout.splitlines():
            if ln.strip():
                findings.append(Finding(
                    "critical", "security", ".env tracked in git",
                    ln.strip(), 1, ln.strip(),
                    "Remove from git history and add to .gitignore.",
                ))
    except Exception:
        pass


ASYNC_NO_TRY = re.compile(r"^\s*(?:export\s+)?(?:async\s+function|const\s+\w+\s*=\s*async)")


def scan_logic(p: Path, text: str, findings: list[Finding]) -> None:
    if p.suffix not in {".ts", ".tsx"}:
        return
    rp = rel(p)
    # Heuristic: async function blocks without try/catch in same function body.
    lines = text.splitlines()
    for i, line in enumerate(lines, 1):
        if ASYNC_NO_TRY.search(line):
            block = "\n".join(lines[i - 1 : i + 40])
            if "try" not in block and ".catch(" not in block and "await" in block:
                findings.append(Finding(
                    "medium", "logic", "Async function without try/catch",
                    rp, i, line, "Wrap awaited calls in try/catch and surface errors via toast/logger.",
                ))


IMG_NO_ALT = re.compile(r"<img\b(?![^>]*\balt=)[^>]*>", re.IGNORECASE)
BTN_NO_TYPE = re.compile(r"<button\b(?![^>]*\btype=)[^>]*>", re.IGNORECASE)
IMG_NO_LAZY = re.compile(r"<img\b(?![^>]*\bloading=)[^>]*>", re.IGNORECASE)


def scan_a11y(p: Path, text: str, findings: list[Finding]) -> None:
    if p.suffix not in {".tsx", ".html"}:
        return
    rp = rel(p)
    is_hero = "Hero" in p.name
    for i, line in enumerate(text.splitlines(), 1):
        if IMG_NO_ALT.search(line):
            findings.append(Finding(
                "medium", "a11y", "<img> missing alt",
                rp, i, line, "Add a meaningful alt or alt=\"\" for decorative images.",
            ))
        if BTN_NO_TYPE.search(line):
            findings.append(Finding(
                "low", "a11y", "<button> missing type",
                rp, i, line, "Add type=\"button\" to avoid unintended form submissions.",
            ))
        if IMG_NO_LAZY.search(line) and not is_hero:
            findings.append(Finding(
                "low", "a11y", "<img> missing loading=\"lazy\"",
                rp, i, line, "Add loading=\"lazy\" for non-hero images.",
            ))


# ---------------------------------------------------------------------------
# Safe auto-fixes (only with --fix)

CONSOLE_LOG = re.compile(r"^\s*console\.log\(.*\);?\s*$")


def safe_fix_file(p: Path) -> int:
    if p.suffix not in {".ts", ".tsx"}:
        return 0
    if p.name.endswith(".test.ts") or p.name.endswith(".test.tsx"):
        return 0
    text = read_text(p)
    if not text:
        return 0
    new_lines: list[str] = []
    changed = 0
    for line in text.splitlines():
        if CONSOLE_LOG.match(line):
            changed += 1
            continue  # drop the line
        # <button without type — only when the tag is on a single line
        new_line = re.sub(
            r"(<button\b(?![^>]*\btype=))",
            r'\1 type="button"',
            line,
        )
        if new_line != line:
            changed += 1
        new_lines.append(new_line)
    if changed:
        p.write_text("\n".join(new_lines) + ("\n" if text.endswith("\n") else ""), encoding="utf-8")
    return changed


# ---------------------------------------------------------------------------
# Orchestrator

def run(category: str, do_fix: bool, out_path: Path) -> int:
    findings: list[Finding] = []
    files = list(iter_files(ROOT))

    fixed = 0
    for p in files:
        text = read_text(p)
        if not text:
            continue
        if category in ("typescript", "all"):
            scan_typescript(p, text, findings)
        if category in ("react", "all"):
            scan_react(p, text, findings)
        if category in ("security", "all"):
            scan_security(p, text, findings)
        if category in ("logic", "all"):
            scan_logic(p, text, findings)
        if category in ("a11y", "all"):
            scan_a11y(p, text, findings)
        if do_fix:
            fixed += safe_fix_file(p)

    if category in ("security", "all"):
        scan_security_global(ROOT, findings)

    write_report(out_path, findings, files_scanned=len(files), fixes_applied=fixed)
    print(f"Scanned {len(files)} files. Findings: {len(findings)}. "
          f"Report: {rel(out_path)}{' (auto-fixed: ' + str(fixed) + ')' if do_fix else ''}")
    return 0


def write_report(out: Path, findings: list[Finding], files_scanned: int, fixes_applied: int) -> None:
    counts = Counter(f.severity for f in findings)
    cat_counts = Counter(f.category for f in findings)
    by_sev: dict[str, list[Finding]] = defaultdict(list)
    for f in findings:
        by_sev[f.severity].append(f)

    lines: list[str] = []
    lines.append("# Bug Hunter Report\n")
    lines.append(f"_Files scanned: **{files_scanned}** · Auto-fixes applied: **{fixes_applied}**_\n")
    lines.append("## Summary\n")
    lines.append("| Severity | Count | Status |")
    lines.append("|----------|-------|--------|")
    for sev in SEVERITY_ORDER:
        guidance = {
            "critical": "Fix immediately",
            "high":     "Fix this sprint",
            "medium":   "Fix next sprint",
            "low":      "Fix when convenient",
        }[sev]
        lines.append(f"| {SEVERITY_EMOJI[sev]} | {counts.get(sev, 0)} | {guidance} |")
    lines.append("\n## By category\n")
    lines.append("| Category | Count |")
    lines.append("|----------|-------|")
    for c in CATEGORIES:
        lines.append(f"| {c} | {cat_counts.get(c, 0)} |")
    lines.append("")

    for sev in SEVERITY_ORDER:
        items = by_sev.get(sev, [])
        if not items:
            continue
        lines.append(f"\n## {SEVERITY_EMOJI[sev]} ({len(items)})\n")
        items.sort(key=lambda f: (f.category, f.file, f.line))
        cur_cat = None
        for f in items:
            if f.category != cur_cat:
                lines.append(f"\n### {f.category}\n")
                cur_cat = f.category
            lines.append(f.md())

    out.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Fighter ID bug hunter")
    ap.add_argument("--category", choices=CATEGORIES + ["all"], default="all")
    ap.add_argument("--fix", action="store_true",
                    help="Apply only safe auto-fixes (drop console.log, add button type).")
    ap.add_argument("--out", default="bug_report.md")
    args = ap.parse_args()
    return run(args.category, args.fix, ROOT / args.out)


if __name__ == "__main__":
    sys.exit(main())
