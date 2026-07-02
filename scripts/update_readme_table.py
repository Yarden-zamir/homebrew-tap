#!/usr/bin/env python3
"""Regenerate the formulae table in README.md between the marker comments.

Reads every Formula/*.rb, pulls its `desc` and `homepage`, and rewrites the
aligned Markdown table between `<!-- project_table_start -->` and
`<!-- project_table_end -->`. Stdlib only; run with `uv run --no-project` or
plain `python3`.
"""

from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FORMULA_DIR = ROOT / "Formula"
README = ROOT / "README.md"
START = "<!-- project_table_start -->"
END = "<!-- project_table_end -->"


def field(text: str, key: str) -> str:
    """Value of a quoted formula field, e.g. field(text, "desc")."""
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(key + " ") and '"' in stripped:
            return stripped.split('"')[1]
    return ""


def build_table() -> str:
    rows = []
    for rb in sorted(FORMULA_DIR.glob("*.rb")):
        text = rb.read_text(encoding="utf-8")
        name = rb.stem
        rows.append((
            f"[{name}]({field(text, 'homepage')})",
            field(text, "desc"),
            f"`brew install {name}`",
        ))
    headers = ("Project", "Description", "Install")
    columns = list(zip(headers, *rows)) if rows else [(h,) for h in headers]
    widths = [max(len(cell) for cell in col) for col in columns]

    def row(cells) -> str:
        return "| " + " | ".join(c.ljust(w) for c, w in zip(cells, widths)) + " |"

    lines = [row(headers), "| " + " | ".join("-" * w for w in widths) + " |"]
    lines += [row(r) for r in rows]
    return "\n".join(lines)


def main() -> int:
    content = README.read_text(encoding="utf-8")
    if START not in content or END not in content:
        print(f"markers {START} / {END} not found in {README}", file=sys.stderr)
        return 1
    pre = content.split(START)[0]
    post = content.split(END)[1]
    new = f"{pre}{START}\n{build_table()}\n{END}{post}"
    if new == content:
        print("README table already up to date")
        return 0
    README.write_text(new, encoding="utf-8")
    print("README table updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
