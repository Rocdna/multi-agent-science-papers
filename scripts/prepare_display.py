"""Prepare the existing literature display for sharing without local PDF paths."""

import argparse
from datetime import datetime
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
DISPLAY = ROOT / "index.html"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DISPLAY)
    args = parser.parse_args()
    original = args.source.read_text(encoding="utf-8")
    public, links = re.subn(
        r'<a\b[^>]*href="file:[^"]*"[^>]*>.*?</a>',
        "",
        original,
        flags=re.IGNORECASE | re.DOTALL,
    )
    public, paths = re.subn(
        r'("pdf"\s*:\s*)"file:[^"]*"', r'\1""', public,
        flags=re.IGNORECASE,
    )
    public = public.replace(
        "本地 PDF 路径依赖 D:\\zotero_doc",
        "公开版 · 原文请访问论文页面",
    )
    if public != original:
        backup_dir = ROOT / ".local"
        backup_dir.mkdir(exist_ok=True)
        backup = backup_dir / f"display-{datetime.now():%Y%m%d-%H%M%S-%f}.html"
        backup.write_text(original, encoding="utf-8")
        print(f"Original display saved to {backup.relative_to(ROOT)}")
    if public != original or args.source.resolve() != DISPLAY:
        DISPLAY.write_text(public, encoding="utf-8")
    print(f"Removed {links} local links and {paths} PDF paths.")


if __name__ == "__main__":
    main()
