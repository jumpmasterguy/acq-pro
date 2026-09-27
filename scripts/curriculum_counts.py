#!/usr/bin/env python3
"""Module and lesson totals, read from client/src/lib/curriculum.ts.

Single source of truth for anything that prints "N modules, M lessons".
Those figures have now gone stale twice: a July commit fixed "34+ lessons"
to 42, and by September the real number was 122 across 14 modules while 34
blog posts, the sign-in page, the tools page and three generators still said
six modules and 42 lessons.

Counting matches scripts/validate-curriculum.js exactly (the same lesson-ID
regex), so every number in the repo traces back to one definition.

    from curriculum_counts import counts
    c = counts()          # {"modules": 14, "lessons": 122, ...}
"""
import re
from pathlib import Path

CURRICULUM = Path(__file__).parent.parent / "client" / "src" / "lib" / "curriculum.ts"

_WORDS = {1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven",
          8: "Eight", 9: "Nine", 10: "Ten", 11: "Eleven", 12: "Twelve",
          13: "Thirteen", 14: "Fourteen", 15: "Fifteen", 16: "Sixteen",
          17: "Seventeen", 18: "Eighteen", 19: "Nineteen", 20: "Twenty"}


def number_word(n: int) -> str:
    """"Fourteen" for 14; the digits back for anything past the table."""
    return _WORDS.get(n, str(n))


def counts(path: Path = CURRICULUM) -> dict:
    src = path.read_text(encoding="utf-8")
    # modules: an `id:` at 4-space indent is a module; 8-space is a lesson
    modules = re.findall(r"^    id: '([a-z0-9-]+)',$", src, re.M)
    # lessons: same pattern validate-curriculum.js uses, so the two agree
    lessons = re.findall(r"\bid:\s*'([a-z]+-\d+[a-z]?)'", src)
    minutes = sum(int(m) for m in re.findall(r"duration:\s*'(\d+)\s*min'", src))
    if not modules or not lessons:
        raise SystemExit(f"curriculum_counts: parsed {len(modules)} modules and "
                         f"{len(lessons)} lessons from {path}; refusing to "
                         f"report obviously wrong totals")
    return {
        "modules": len(modules),
        "lessons": len(lessons),
        "module_ids": modules,
        "minutes": minutes,
        "hours": round(minutes / 60, 1),
        "modules_word": number_word(len(modules)),
    }


if __name__ == "__main__":
    c = counts()
    print(f"{c['modules']} modules ({c['modules_word']}), {c['lessons']} lessons, "
          f"{c['minutes']} min = {c['hours']} hours")
