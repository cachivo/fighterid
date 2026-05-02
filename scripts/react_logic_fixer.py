#!/usr/bin/env python3
"""
react_logic_fixer.py — Conservative React/TS logic rewriter.

Dry-run by default: writes unified diffs to react_fixes_patches/*.patch
and a summary to react_fixes_report.md. Use --apply to mutate source.

Usage:
    python scripts/react_logic_fixer.py
    python scripts/react_logic_fixer.py --apply
    python scripts/react_logic_fixer.py --file src/components/Hero.tsx
"""
from __future__ import annotations

import argparse
import difflib
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parent.parent
PATCH_DIR = ROOT / "react_fixes_patches"
REPORT = ROOT / "react_fixes_report.md"

SCAN_DIRS = ["src"]
SKIP_DIR_PARTS = {"integrations", "node_modules", "dist", ".git", "__tests__"}
SKIP_FILE_SUFFIXES = (".test.ts", ".test.tsx", ".d.ts")
SKIP_FILE_PATHS = (
    "src/integrations/supabase/",
)


@dataclass
class FileResult:
    path: Path
    changes: Counter = field(default_factory=Counter)
    new_text: str = ""
    old_text: str = ""

    @property
    def changed(self) -> bool:
        return self.new_text != self.old_text


# ---------------------------------------------------------------------------
# Discovery

def iter_targets(root: Path, only: Path | None) -> list[Path]:
    if only:
        return [only]
    out: list[Path] = []
    for d in SCAN_DIRS:
        for p in (root / d).rglob("*"):
            if p.is_dir():
                continue
            if p.suffix not in {".ts", ".tsx"}:
                continue
            rel = str(p.relative_to(root))
            if any(part in SKIP_DIR_PARTS for part in p.parts):
                continue
            if rel.endswith(SKIP_FILE_SUFFIXES):
                continue
            if any(rel.startswith(s) for s in SKIP_FILE_PATHS):
                continue
            out.append(p)
    return out


# ---------------------------------------------------------------------------
# Transformers
# Each returns the new text and increments result.changes.

USE_STATE_NULL = re.compile(r"\buseState\((null)\)")
USE_STATE_ARR  = re.compile(r"\buseState\((\[\])\)")
USE_STATE_OBJ  = re.compile(r"\buseState\((\{\})\)")
USE_STATE_EMPTY = re.compile(r"\buseState\(\s*\)")
USE_STATE_UNDEF = re.compile(r"\buseState\(undefined\)")


def fix_usestate_types(text: str, result: FileResult) -> str:
    def repl(pattern: re.Pattern, generic: str, default: str) -> Callable[[str], str]:
        def f(s: str) -> str:
            new, n = pattern.subn(f"useState<{generic}>({default})", s)
            if n:
                result.changes[f"useState<{generic}>"] += n
            return new
        return f

    text = repl(USE_STATE_NULL, "unknown /* TODO: type */", "null")(text)
    text = repl(USE_STATE_ARR,  "unknown[] /* TODO: type */", "[]")(text)
    text = repl(USE_STATE_OBJ,  "Record<string, unknown> /* TODO: type */", "{}")(text)
    new, n = USE_STATE_EMPTY.subn("useState<unknown>(undefined)", text)
    if n:
        result.changes["useState<unknown>(undefined)"] += n
    text = new
    new, n = USE_STATE_UNDEF.subn("useState<unknown>(undefined)", text)
    if n:
        result.changes["useState<unknown>(undefined)"] += n
    return new


# Add key={index} to obvious .map(item => <Tag ...>) cases without key.
MAP_NO_KEY = re.compile(
    r"\.map\(\s*\((\w+)(?:\s*,\s*(\w+))?\)\s*=>\s*<(\w[\w.-]*)\b(?![^>]*\bkey=)",
)


def fix_map_keys(text: str, result: FileResult) -> str:
    def repl(m: re.Match) -> str:
        item, idx, tag = m.group(1), m.group(2), m.group(3)
        key = f"{item}.id ?? {idx or 'undefined'}"
        result.changes["map key"] += 1
        return f".map(({item}{', ' + idx if idx else ''}) => <{tag} key={{{key}}}"
    return MAP_NO_KEY.sub(repl, text)


# Add Promise<void> return type on exported async function with no annotation.
EXPORT_ASYNC_FN = re.compile(
    r"^(\s*export\s+(?:default\s+)?async\s+function\s+\w+\s*\([^)]*\))\s*\{",
    re.MULTILINE,
)


def fix_async_return_type(text: str, result: FileResult) -> str:
    def repl(m: re.Match) -> str:
        head = m.group(1)
        if ":" in head.split(")")[-1]:
            return m.group(0)
        result.changes["Promise<void>"] += 1
        return f"{head}: Promise<void> {{"
    return EXPORT_ASYNC_FN.sub(repl, text)


TRANSFORMS: list[Callable[[str, FileResult], str]] = [
    fix_usestate_types,
    fix_map_keys,
    fix_async_return_type,
]


# ---------------------------------------------------------------------------
# Driver

def process(p: Path) -> FileResult:
    text = p.read_text(encoding="utf-8", errors="replace")
    res = FileResult(path=p, old_text=text)
    new = text
    for fn in TRANSFORMS:
        new = fn(new, res)
    res.new_text = new
    return res


def make_patch(res: FileResult) -> str:
    rel = str(res.path.relative_to(ROOT))
    return "".join(difflib.unified_diff(
        res.old_text.splitlines(keepends=True),
        res.new_text.splitlines(keepends=True),
        fromfile=f"a/{rel}",
        tofile=f"b/{rel}",
    ))


def run(only: Path | None, apply: bool) -> int:
    PATCH_DIR.mkdir(exist_ok=True)
    # Clear stale patches when running full
    if not only:
        for p in PATCH_DIR.glob("*.patch"):
            p.unlink()

    targets = iter_targets(ROOT, only)
    changed: list[FileResult] = []
    totals: Counter = Counter()

    for p in targets:
        res = process(p)
        if not res.changed:
            continue
        totals.update(res.changes)
        changed.append(res)
        if apply:
            p.write_text(res.new_text, encoding="utf-8")
        else:
            patch = make_patch(res)
            patch_name = str(p.relative_to(ROOT)).replace("/", "__") + ".patch"
            (PATCH_DIR / patch_name).write_text(patch, encoding="utf-8")

    write_report(changed, totals, applied=apply)
    print(f"Files modified: {len(changed)} / scanned: {len(targets)}. "
          f"{'APPLIED' if apply else 'patches in ' + str(PATCH_DIR.relative_to(ROOT))}")
    return 0


def write_report(changed: list[FileResult], totals: Counter, applied: bool) -> None:
    lines: list[str] = []
    lines.append("# React Logic Fixer Report\n")
    lines.append(f"Mode: **{'APPLY' if applied else 'DRY-RUN'}**  ·  Files modified: **{len(changed)}**\n")
    lines.append("## Totals by transform\n")
    lines.append("| Transform | Count |")
    lines.append("|-----------|-------|")
    for k, v in sorted(totals.items(), key=lambda kv: -kv[1]):
        lines.append(f"| {k} | {v} |")
    lines.append("")
    lines.append("## Per file\n")
    for r in changed:
        lines.append(f"### {r.path.relative_to(ROOT)}")
        for k, v in r.changes.items():
            lines.append(f"- {k}: {v}")
        lines.append("")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="React/TS conservative logic fixer")
    ap.add_argument("--apply", action="store_true", help="Write changes in place (default: dry-run)")
    ap.add_argument("--file", type=str, default=None, help="Limit to a single file")
    args = ap.parse_args()
    only = (ROOT / args.file).resolve() if args.file else None
    if only and not only.exists():
        print(f"file not found: {only}", file=sys.stderr)
        return 2
    return run(only, args.apply)


if __name__ == "__main__":
    sys.exit(main())
