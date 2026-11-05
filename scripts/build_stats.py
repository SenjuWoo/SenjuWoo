#!/usr/bin/env python3
"""Regenerate assets/stack.svg from real GitHub language bytes.

The panel is committed, not hot-linked, so the profile renders even if every
third-party badge service dies. Run it locally (`gh` auth) or let
.github/workflows/stack.yml do it weekly.
"""
from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

USER = "SenjuWoo"
TOP_N = 6

# Ember ramp: the biggest language is the hottest. Deliberately one hue so the
# panel reads as a ranked chart, not a colour salad.
RAMP = ["#FF7A33", "#F26A2C", "#D8571F", "#B04618", "#8A3714", "#642811"]
DIM = "#5D7186"
STEEL = "#DCE9F3"


def gh(path: str) -> object:
    """Single object, or a flat list. --slurp makes pagination shape stable."""
    out = subprocess.run(
        ["gh", "api", path, "--paginate", "--slurp"],
        capture_output=True, text=True, check=True,
    ).stdout
    data = json.loads(out)
    # --slurp wraps pages in an outer array; languages returns one object page.
    return [item for page in data for item in page] if isinstance(data, list) and data and isinstance(data[0], list) else data[0] if isinstance(data, list) else data


def collect() -> tuple[Counter, int]:
    repos = gh(f"users/{USER}/repos?per_page=100")
    bytes_by_lang: Counter = Counter()
    counted = 0
    for repo in repos:
        if repo.get("fork") or not repo.get("size"):
            continue
        langs = gh(f"repos/{USER}/{repo['name']}/languages")
        if isinstance(langs, dict) and langs:
            bytes_by_lang.update(langs)
            counted += 1
    return bytes_by_lang, counted


def svg(bytes_by_lang: Counter, repo_count: int) -> str:
    total = sum(bytes_by_lang.values()) or 1
    top = bytes_by_lang.most_common(TOP_N)
    other = total - sum(v for _, v in top)
    rows = top + ([("Other", other)] if other else [])

    # 1200x380 canvas: one 40px row per language plus a caption line.
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="380" viewBox="0 0 1200 380" '
        'role="img" aria-label="Language distribution by bytes across public repositories">',
        "<title>Stack by bytes</title>",
        '<rect width="1200" height="380" fill="#070B10"/>',
        '<rect x="0.5" y="0.5" width="1199" height="379" fill="none" stroke="#16202B"/>',
        '<text x="64" y="60" font-family="\'Cascadia Mono\',Consolas,monospace" font-size="12" '
        'letter-spacing="4.4" fill="#6E8398">STACK / BYTES WRITTEN</text>',
        f'<text x="1136" y="60" text-anchor="end" font-family="\'Cascadia Mono\',Consolas,monospace" '
        f'font-size="12" letter-spacing="2" fill="#6E8398">{repo_count} REPOS · {len(bytes_by_lang)} LANGUAGES</text>',
    ]

    track_x, track_w = 250, 800
    for i, (lang, n) in enumerate(rows):
        y = 112 + i * 40
        pct = 100 * n / total
        w = max(3.0, track_w * n / total)
        colour = RAMP[i] if i < len(RAMP) else "#4A2312"
        parts += [
            f'<text x="64" y="{y + 12}" font-family="\'Cascadia Mono\',Consolas,monospace" font-size="15" '
            f'fill="{STEEL if i < TOP_N else DIM}">{escape(lang)}</text>',
            f'<rect x="{track_x}" y="{y}" width="{track_w}" height="14" rx="3" fill="#101923"/>',
            f'<rect x="{track_x}" y="{y}" width="{w:.1f}" height="14" rx="3" fill="{colour}"/>',
            f'<text x="{track_x + track_w + 24}" y="{y + 12}" font-family="\'Cascadia Mono\',Consolas,monospace" '
            f'font-size="14" fill="#8FA3B8">{pct:4.1f}%</text>',
        ]

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    parts += [
        f'<text x="64" y="352" font-family="\'Cascadia Mono\',Consolas,monospace" font-size="10.5" '
        f'fill="#4C5F73">snapshot {stamp} · generated from the GitHub API · refused forks</text>',
        "</svg>",
    ]
    return "\n".join(parts)


def main() -> int:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "assets/stack.svg")
    bytes_by_lang, repo_count = collect()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(svg(bytes_by_lang, repo_count), encoding="utf-8")
    print(f"wrote {out} — {sum(bytes_by_lang.values()):,} bytes across {repo_count} repos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
