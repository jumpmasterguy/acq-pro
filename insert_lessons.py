#!/usr/bin/env python3
"""
Insert new lesson objects into curriculum.ts at the correct positions.
- finance-5, finance-6, finance-7  → before MODULE 3 marker (~line 936)
- contracts-6                      → before MODULE 4 marker (~line 1757)
- foundations-3, foundations-4     → before MODULE 2 marker (~line 355)
"""

import re

# ── Read source files ─────────────────────────────────────────────────────────

with open('/home/user/workspace/acq-pro/new_lessons.ts', 'r') as f:
    new_lessons_raw = f.read()

with open('/home/user/workspace/acq-pro/new_contracts_foundations.ts', 'r') as f:
    new_cf_raw = f.read()

with open('/home/user/workspace/acq-pro/client/src/lib/curriculum.ts', 'r') as f:
    curriculum = f.read()

# ── Extract lesson blocks by stripping comment header lines ──────────────────
# The temp files have comment lines starting with // ═ or // ─ or // FINANCE
# between lessons. Strip those, keep only the actual TS object blocks.

def strip_comment_lines(text):
    """Remove standalone comment lines (// ...) at the top level."""
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        stripped = line.strip()
        # Skip pure comment lines (not inside strings)
        if stripped.startswith('//'):
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)

# Strip comment-only lines from both temp files
finance_block = strip_comment_lines(new_lessons_raw).strip()
cf_block = strip_comment_lines(new_cf_raw).strip()

# Remove leading/trailing blank lines
finance_block = re.sub(r'^\n+', '', finance_block)
finance_block = re.sub(r'\n+$', '', finance_block)
cf_block = re.sub(r'^\n+', '', cf_block)
cf_block = re.sub(r'\n+$', '', cf_block)

# Remove runs of 3+ blank lines → 1 blank line
finance_block = re.sub(r'\n{3,}', '\n\n', finance_block)
cf_block = re.sub(r'\n{3,}', '\n\n', cf_block)

# ── Split cf_block into contracts-6 vs foundations-3/4 ───────────────────────
# Find boundary: contracts-6 ends just before foundations-3 starts.
# After stripping comments, contracts-6 will be first, foundations-3 second.

# Find where foundations-3 starts
f3_start = cf_block.find("id: 'foundations-3'")
# Walk back to the opening brace of that lesson object
f3_obj_start = cf_block.rfind('\n      {', 0, f3_start)
if f3_obj_start == -1:
    f3_obj_start = cf_block.rfind('      {', 0, f3_start)

contracts6_block = cf_block[:f3_obj_start].strip()
foundations_block = cf_block[f3_obj_start:].strip()

print("=== contracts6_block preview (first 200 chars) ===")
print(contracts6_block[:200])
print()
print("=== foundations_block preview (first 200 chars) ===")
print(foundations_block[:200])
print()

# ── Define unique insertion anchors ──────────────────────────────────────────
# Each anchor is the unique text right BEFORE where we want to insert.
# We insert AFTER the anchor (adding a trailing newline + content).

# Anchor for foundations-3, foundations-4 (before MODULE 2 — FINANCE)
ANCHOR_FOUNDATIONS = '    ]\n  },\n\n  // ─────────────────────────────────────────────────────────────\n  // MODULE 2 — FINANCE'

# Anchor for finance-5, finance-6, finance-7 (before MODULE 3 — CONTRACTS)
ANCHOR_FINANCE = '    ]\n  },\n\n  // ─────────────────────────────────────────────────────────────\n  // MODULE 3 — CONTRACTS'

# Anchor for contracts-6 (before MODULE 4 — DATA)
ANCHOR_CONTRACTS = '    ]\n  },\n\n  // ─────────────────────────────────────────────────────────────\n  // MODULE 4 — DATA'

# Verify anchors exist
for anchor_name, anchor in [
    ('FOUNDATIONS', ANCHOR_FOUNDATIONS),
    ('FINANCE', ANCHOR_FINANCE),
    ('CONTRACTS', ANCHOR_CONTRACTS),
]:
    count = curriculum.count(anchor)
    print(f"Anchor {anchor_name}: found {count} occurrence(s)")

print()

# ── Build replacement strings ─────────────────────────────────────────────────
# Strategy: replace ANCHOR with (new_lessons + ANCHOR)

# 1. Insert foundations-3, foundations-4 before MODULE 2
foundations_insert = foundations_block + ',\n    ]\n  },\n\n  // ─────────────────────────────────────────────────────────────\n  // MODULE 2 — FINANCE'
# Wait — we can't have lesson objects hanging outside a lessons array.
# Let me check the actual structure of the lessons array inside each module.
# The anchor pattern ends with `    ]` then `  }` which closes the module.
# Actually let me re-examine more carefully.

# ── Re-examine the actual structure ──────────────────────────────────────────
print("=== Looking at full foundations module structure ===")
mod_start = curriculum.find("  // MODULE 1 — FOUNDATIONS")
if mod_start == -1:
    mod_start = curriculum.find("id: 'foundations'")
    mod_start = curriculum.rfind('\n  {', 0, mod_start)

anchor_pos = curriculum.find(ANCHOR_FOUNDATIONS)
print(f"Foundations module start: {mod_start}")
print(f"Anchor position: {anchor_pos}")
print()
print("Context around anchor (100 chars before/after):")
print(repr(curriculum[anchor_pos-100:anchor_pos+80]))
