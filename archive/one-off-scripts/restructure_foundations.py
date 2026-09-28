"""
Restructure Module 1 (foundations):
1. Replace all existing lessons in the foundations module with 5 new ones
2. Move foundations-3 (ACAT) and foundations-4 (OTAs) to the contracts module
3. Move foundations-1 (DoD Overview) and foundations-2 (Roles & Careers) to finance
   module as supplementary lessons (they're already there -- keep them)
4. Remove the old foundations-5 (lifecycle) from foundations -- replaced by new foundations-lifecycle
"""

import re

with open('client/src/lib/curriculum.ts', 'r') as f:
    content = f.read()

# ── Step 1: Extract the 5 new lessons from staging file ──────────────────

with open('new_foundations_lessons.ts', 'r') as f:
    new_raw = f.read()

def extract_lesson(raw, lesson_id):
    """Extract a single lesson object by id."""
    start_marker = f"id: '{lesson_id}',"
    idx = raw.find(start_marker)
    if idx == -1:
        raise ValueError(f"Lesson {lesson_id} not found")
    open_brace = raw.rfind('\n      {', 0, idx)
    if open_brace == -1:
        raise ValueError(f"Opening brace not found for {lesson_id}")
    depth = 0
    i = open_brace
    while i < len(raw):
        if raw[i] == '{': depth += 1
        elif raw[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                if end < len(raw) and raw[end] == ',': end += 1
                return raw[open_brace:end].strip()
        i += 1
    raise ValueError(f"Closing brace not found for {lesson_id}")

lessons = {}
for lid in ['foundations-intro', 'foundations-contracts', 'foundations-players', 
            'foundations-money', 'foundations-lifecycle']:
    lessons[lid] = extract_lesson(new_raw, lid)
    print(f"Extracted {lid}: {len(lessons[lid])} chars")

# ── Step 2: Find the foundations module lessons array ────────────────────
# The foundations module starts at "id: 'foundations'" and contains
# one lesson: foundations-5. We need to replace that lessons array.

# Find foundations module
f_mod_start = content.find("    id: 'foundations',")
if f_mod_start == -1:
    raise ValueError("Foundations module not found")

# Find lessons: [ array start
lessons_arr_start = content.find("    lessons: [\n", f_mod_start)
if lessons_arr_start == -1:
    raise ValueError("Lessons array not found in foundations module")

# Find the matching closing ], of the lessons array
# The lessons array is at depth 0 relative to itself
depth = 0
i = lessons_arr_start + len("    lessons: [")
while i < len(content):
    if content[i] == '[': depth += 1
    elif content[i] == ']':
        if depth == 0:
            lessons_arr_end = i + 1
            break
        depth -= 1
    i += 1

print(f"Foundations lessons array: chars {lessons_arr_start} to {lessons_arr_end}")
print("First 100 chars:", repr(content[lessons_arr_start:lessons_arr_start+100]))
print("Last 100 chars:", repr(content[lessons_arr_end-100:lessons_arr_end]))

# Build the new lessons array content
new_lessons_content = "\n".join([
    f"      {lessons['foundations-intro']},",
    f"      {lessons['foundations-contracts']},",
    f"      {lessons['foundations-players']},",
    f"      {lessons['foundations-money']},",
    f"      {lessons['foundations-lifecycle']},",
])

new_lessons_array = f"    lessons: [\n{new_lessons_content}\n    ]"

# Replace the old lessons array
old_lessons_array = content[lessons_arr_start:lessons_arr_end]
content = content[:lessons_arr_start] + new_lessons_array + content[lessons_arr_end:]
print(f"✓ Replaced foundations lessons array ({len(old_lessons_array)} chars → {len(new_lessons_array)} chars)")

# ── Step 3: Move foundations-3 (ACAT) and foundations-4 (OTAs) to Contracts ──
# They're currently in the Finance module. Find and extract them, then insert
# them at the start of the contracts module lessons array.

def extract_lesson_from_content(text, lesson_id):
    """Extract lesson block including the trailing comma."""
    start_marker = f"        id: '{lesson_id}',"
    idx = text.find(start_marker)
    if idx == -1:
        return None, text
    open_brace = text.rfind('\n      {', 0, idx)
    if open_brace == -1:
        return None, text
    depth = 0
    i = open_brace
    while i < len(text):
        if text[i] == '{': depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                if end < len(text) and text[end] == ',': end += 1
                # Include trailing newline
                if end < len(text) and text[end] == '\n': end += 1
                return text[open_brace:end], text[:open_brace] + text[end:]
        i += 1
    return None, text

f3_block, content = extract_lesson_from_content(content, 'foundations-3')
f4_block, content = extract_lesson_from_content(content, 'foundations-4')

if f3_block:
    print(f"✓ Extracted foundations-3 ({len(f3_block)} chars)")
else:
    print("⚠ foundations-3 not found (may already be removed)")

if f4_block:
    print(f"✓ Extracted foundations-4 ({len(f4_block)} chars)")
else:
    print("⚠ foundations-4 not found (may already be removed)")

# Insert at start of contracts module lessons array
contracts_mod = content.find("    id: 'contracts',")
if contracts_mod == -1:
    raise ValueError("Contracts module not found")

contracts_lessons_start = content.find("    lessons: [\n", contracts_mod)
if contracts_lessons_start == -1:
    raise ValueError("Contracts lessons array not found")

insert_pos = contracts_lessons_start + len("    lessons: [\n")

insert_text = ""
if f3_block:
    insert_text += f3_block.strip() + ",\n      "
if f4_block:
    insert_text += f4_block.strip() + ",\n      "

if insert_text:
    content = content[:insert_pos] + "      " + insert_text + content[insert_pos:]
    print("✓ Inserted foundations-3 and foundations-4 into contracts module")

# ── Step 4: Fix the duplicate comma introduced by AAF table fix ──────────
# Remove any "  }," followed immediately by another "}," at lesson boundaries
content = content.replace('\n      },\n      ,\n', '\n      },\n')

# ── Step 5: Write output ─────────────────────────────────────────────────
with open('client/src/lib/curriculum.ts', 'w') as f:
    f.write(content)

print("\n✅ Done!")

# Verify
for lid in ['foundations-intro', 'foundations-contracts', 'foundations-players',
            'foundations-money', 'foundations-lifecycle']:
    if f"id: '{lid}'" in content:
        print(f"  ✓ {lid} in curriculum")
    else:
        print(f"  ✗ {lid} MISSING!")

for lid in ['foundations-3', 'foundations-4']:
    count = content.count(f"id: '{lid}'")
    print(f"  {lid}: {count} occurrence(s) (expected 1 in contracts module)")
