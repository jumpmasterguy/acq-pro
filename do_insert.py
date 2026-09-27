#!/usr/bin/env python3
"""
Insert new lesson objects into curriculum.ts.
Each new lesson object is inserted just before the closing of each module's lessons array.
"""

import re, shutil, os

# ── Backup original ───────────────────────────────────────────────────────────
src = '/home/user/workspace/acq-pro/client/src/lib/curriculum.ts'
shutil.copy(src, src + '.bak')
print("Backup created:", src + '.bak')

# ── Read source files ─────────────────────────────────────────────────────────
with open('/home/user/workspace/acq-pro/new_lessons.ts', 'r') as f:
    new_lessons_raw = f.read()

with open('/home/user/workspace/acq-pro/new_contracts_foundations.ts', 'r') as f:
    new_cf_raw = f.read()

with open(src, 'r') as f:
    curriculum = f.read()

# ── Strip comment-only lines from temp files ──────────────────────────────────
def strip_comment_lines(text):
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('//'):
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)

finance_block = strip_comment_lines(new_lessons_raw).strip()
cf_block = strip_comment_lines(new_cf_raw).strip()

# Remove runs of 3+ blank lines → 1 blank line
finance_block = re.sub(r'\n{3,}', '\n\n', finance_block)
cf_block = re.sub(r'\n{3,}', '\n\n', cf_block)

# ── Split cf_block into contracts-6 and foundations-3/4 ───────────────────────
f3_start = cf_block.find("id: 'foundations-3'")
# Walk back to find the opening brace of the foundations-3 lesson object (6 spaces)
search_str = '      {'
pos = f3_start
while pos > 0:
    pos -= 1
    if cf_block[pos:pos+len(search_str)] == search_str:
        break
f3_obj_start = pos

contracts6_block = cf_block[:f3_obj_start].strip()
foundations_block = cf_block[f3_obj_start:].strip()

# Ensure there's no trailing comma issues
# Each block should end with `      },` or `      }` 
# The original lessons array entries end with `},`
# Let me check...
print("contracts6_block last 50:", repr(contracts6_block[-50:]))
print("foundations_block last 50:", repr(foundations_block[-50:]))
print("finance_block last 50:", repr(finance_block[-50:]))

# ── The anchors — unique strings we'll replace ───────────────────────────────
# We insert by replacing the anchor with: newcontent + anchor
# Each lesson ends with `      },\n` but the LAST lesson in the array
# may end with `      }` (no comma). We need to add a comma to the last
# existing lesson when inserting new ones after it.
# 
# Actually looking at the structure:
#   lessons: [
#     { id: 'foundations-1', ... },
#     { id: 'foundations-2', ... }   ← last lesson, no trailing comma in JS
#   ]
# But TypeScript/JS arrays can have trailing commas.
# The safest approach: insert ", \n      {new_lesson_content}" before the closing ]

# The exact closing sequence of each module's lessons array:
# `      }\n    ]\n  },`
# We insert before `    ]` — i.e., after the last lesson's closing `}`

# ANCHOR: unique ending of each module before our insertion point
ANCHOR_FOUNDATIONS = '    ]\n  },\n\n  // ─────────────────────────────────────────────────────────────\n  // MODULE 2 — FINANCE'
ANCHOR_FINANCE     = '    ]\n  },\n\n  // ─────────────────────────────────────────────────────────────\n  // MODULE 3 — CONTRACTS'
ANCHOR_CONTRACTS   = '    ]\n  },\n\n  // ─────────────────────────────────────────────────────────────\n  // MODULE 4 — DATA'

# The new content to insert goes just before the `    ]` in each anchor.
# So we replace `ANCHOR` with `(new_lessons),\n    ANCHOR`

def make_insertion(new_block):
    """
    Given a block of lesson object(s) (may be multiple, comma-separated),
    return the text to insert before the closing `    ]`.
    The block already contains commas between lessons if there are multiple.
    We add a leading comma to attach to the previous last lesson.
    """
    # Ensure the block ends without trailing comma (we'll add one if multi-lesson)
    block = new_block.strip()
    # Remove trailing comma if present  
    if block.endswith(','):
        block = block[:-1]
    return block

# ── Build blocks with proper comma structure ─────────────────────────────────
# The last existing lesson in each module does NOT have a trailing comma.
# We're inserting after it, so we need to add a comma after it.
# We do this by inserting `,\n      <new_lesson>` before `\n    ]`

# For foundations: insert foundations-3 and foundations-4
# Block is "      { id: 'foundations-3', ... },\n      { id: 'foundations-4', ... }"
# (they already have commas between them from the strip)

# Make sure blocks have proper trailing comma handling
foundations_insert = foundations_block
contracts6_insert = contracts6_block  
finance_insert = finance_block

# Each insert block needs:
# 1. A comma AFTER the previous last lesson (before our new content)
# 2. Proper comma between new lessons if multiple
# 3. No trailing comma after the very last new lesson (TS allows it but let's be safe)

def do_insertion(curriculum_text, anchor, new_block):
    """
    Insert new_block before the `    ]` that is part of `anchor`.
    The anchor starts with `    ]\n  },`.
    """
    block = new_block.strip()
    # Remove trailing comma
    if block.endswith(','):
        block = block[:-1]
    # The insertion: we find the anchor and put content before `    ]`
    insert_text = ',\n' + block + '\n' + anchor
    result = curriculum_text.replace(anchor, insert_text, 1)
    if result == curriculum_text:
        raise ValueError(f"Anchor not found or replacement failed!")
    return result

print()
print("Performing insertions...")

# 1. Insert foundations-3, foundations-4 before MODULE 2
curriculum = do_insertion(curriculum, ANCHOR_FOUNDATIONS, foundations_insert)
print("✓ Inserted foundations-3, foundations-4")

# 2. Insert finance-5, finance-6, finance-7 before MODULE 3
curriculum = do_insertion(curriculum, ANCHOR_FINANCE, finance_insert)
print("✓ Inserted finance-5, finance-6, finance-7")

# 3. Insert contracts-6 before MODULE 4
curriculum = do_insertion(curriculum, ANCHOR_CONTRACTS, contracts6_insert)
print("✓ Inserted contracts-6")

# ── Write the result ──────────────────────────────────────────────────────────
with open(src, 'w') as f:
    f.write(curriculum)

print()
print(f"✓ curriculum.ts written ({len(curriculum.splitlines())} lines)")

# Quick sanity check
with open(src, 'r') as f:
    final = f.read()

for lesson_id in ['foundations-3', 'foundations-4', 'finance-5', 'finance-6', 'finance-7', 'contracts-6']:
    if f"id: '{lesson_id}'" in final:
        print(f"  ✓ {lesson_id} present")
    else:
        print(f"  ✗ {lesson_id} MISSING!")
