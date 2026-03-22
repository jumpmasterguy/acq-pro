import re

with open('client/src/lib/curriculum.ts', 'r') as f:
    content = f.read()

# ── Read new lessons ───────────────────────────────────────────────────────
with open('new_starter_kit_lessons.ts', 'r') as f:
    new_lessons_raw = f.read()

# Split into 4 individual lesson blocks by their id markers
def extract_lesson(raw, lesson_id):
    """Extract a single lesson object from the staging file."""
    start_marker = f"id: '{lesson_id}',"
    # Find the start of the outer { before the id line
    idx = raw.find(start_marker)
    if idx == -1:
        raise ValueError(f"Lesson {lesson_id} not found in staging file")
    # Walk back to find the opening {
    open_brace = raw.rfind('\n      {', 0, idx)
    if open_brace == -1:
        raise ValueError(f"Could not find opening brace for {lesson_id}")
    
    # Now find the matching closing }, by counting braces
    depth = 0
    i = open_brace
    while i < len(raw):
        if raw[i] == '{':
            depth += 1
        elif raw[i] == '}':
            depth -= 1
            if depth == 0:
                # Found closing brace — include trailing comma and newline
                end = i + 1
                if end < len(raw) and raw[end] == ',':
                    end += 1
                return raw[open_brace:end].strip()
        i += 1
    raise ValueError(f"Could not find closing brace for {lesson_id}")

contracts7 = extract_lesson(new_lessons_raw, 'contracts-7')
contracts8 = extract_lesson(new_lessons_raw, 'contracts-8')
capture5   = extract_lesson(new_lessons_raw, 'capture-5')
ops5       = extract_lesson(new_lessons_raw, 'ops-5')

print("Extracted lessons:")
print(f"  contracts-7: {len(contracts7)} chars")
print(f"  contracts-8: {len(contracts8)} chars")
print(f"  capture-5:   {len(capture5)} chars")
print(f"  ops-5:       {len(ops5)} chars")

# ── Insert contracts-7 and contracts-8 after contracts-6 ─────────────────

# Find contracts-6 lesson closing — look for the last quiz closing before contracts module assessment
# Strategy: find "id: 'contracts-6'" then find its closing "}," then insert after
idx_c6 = content.find("id: 'contracts-6',")
if idx_c6 == -1:
    raise ValueError("contracts-6 not found")

# Find the lesson closing }, after contracts-6 — walk forward counting braces
# The lesson block starts at the { before id: 'contracts-6'
open_brace_c6 = content.rfind('\n      {', 0, idx_c6)
depth = 0
i = open_brace_c6
while i < len(content):
    if content[i] == '{':
        depth += 1
    elif content[i] == '}':
        depth -= 1
        if depth == 0:
            c6_end = i + 1
            if c6_end < len(content) and content[c6_end] == ',':
                c6_end += 1
            break
    i += 1

# Insert contracts-7 and contracts-8 after contracts-6
insert_text = f"\n      {contracts7},\n      {contracts8},"
content = content[:c6_end] + insert_text + content[c6_end:]
print("✓ Inserted contracts-7 and contracts-8 after contracts-6")

# ── Insert capture-5 after capture-4 ─────────────────────────────────────
idx_c4 = content.find("id: 'capture-4',")
if idx_c4 == -1:
    raise ValueError("capture-4 not found")

open_brace_c4 = content.rfind('\n      {', 0, idx_c4)
depth = 0
i = open_brace_c4
while i < len(content):
    if content[i] == '{':
        depth += 1
    elif content[i] == '}':
        depth -= 1
        if depth == 0:
            c4_end = i + 1
            if c4_end < len(content) and content[c4_end] == ',':
                c4_end += 1
            break
    i += 1

insert_cap = f"\n      {capture5},"
content = content[:c4_end] + insert_cap + content[c4_end:]
print("✓ Inserted capture-5 after capture-4")

# ── Insert ops-5 after ops-4 ──────────────────────────────────────────────
idx_o4 = content.find("id: 'ops-4',")
if idx_o4 == -1:
    raise ValueError("ops-4 not found")

open_brace_o4 = content.rfind('\n      {', 0, idx_o4)
depth = 0
i = open_brace_o4
while i < len(content):
    if content[i] == '{':
        depth += 1
    elif content[i] == '}':
        depth -= 1
        if depth == 0:
            o4_end = i + 1
            if o4_end < len(content) and content[o4_end] == ',':
                o4_end += 1
            break
    i += 1

insert_ops = f"\n      {ops5},"
content = content[:o4_end] + insert_ops + content[o4_end:]
print("✓ Inserted ops-5 after ops-4")

# ── Enhance foundations-5: Add AAF Pathway Selector table ─────────────────
# Find foundations-5 lesson and append a pathway selector table before closing quiz array
aaf_pathway_table = """          {
            type: 'table',
            heading: 'AAF Pathway Selector — Quick Reference',
            headers: ['Pathway', 'Best For', 'Key Timeline', 'Governing DoDI', 'MDA Level'],
            rows: [
              ['Urgent Capability Acquisition (UCA)', 'Urgent warfighter needs validated by CCDR', '≤ 2 years to fielding', 'DoDI 5000.81', 'CAE or designated official'],
              ['Middle Tier of Acquisition (MTA) — Rapid Prototyping', 'New capability, prototype fielding', '≤ 5 years', 'DoDI 5000.80', 'CAE'],
              ['Middle Tier of Acquisition (MTA) — Rapid Fielding', 'Mature technology, rapid fielding', '≤ 6 years', 'DoDI 5000.80', 'CAE'],
              ['Major Capability Acquisition (MCA)', 'Complex, high-cost platforms; full lifecycle', 'Milestone-driven (A, B, C)', 'DoDI 5000.85', 'DAE or SAE'],
              ['Software Acquisition', 'Software-intensive programs; Agile/DevSecOps', '6-month capability drops', 'DoDI 5000.87', 'CAE'],
              ['Defense Business Systems (DBS)', 'Enterprise IT; financial/HR/logistics systems', 'BCAC review cycle', 'DoDI 5000.75', 'IRB + CAE'],
              ['Acquisition of Services', 'Services contracts > $250M', 'Services Acq. Strategy cycle', 'DoDI 5000.74', 'SAE or designated'],
            ],
          },"""

# Find the foundations-5 lesson
idx_f5 = content.find("id: 'foundations-5',")
if idx_f5 == -1:
    raise ValueError("foundations-5 not found")

# Find "quiz:" within foundations-5 lesson block
# Search forward from foundations-5 for "        quiz: ["
quiz_idx = content.find("        quiz: [", idx_f5)
if quiz_idx == -1:
    raise ValueError("Could not find quiz section in foundations-5")

# Insert the table content block just before "        quiz: ["
content = content[:quiz_idx] + aaf_pathway_table + "\n" + content[quiz_idx:]
print("✓ Added AAF Pathway Selector table to foundations-5")

# ── Write output ─────────────────────────────────────────────────────────
with open('client/src/lib/curriculum.ts', 'w') as f:
    f.write(content)

print("\n✅ All lessons inserted successfully!")

# Verify insertions
for lesson_id in ['contracts-7', 'contracts-8', 'capture-5', 'ops-5']:
    if f"id: '{lesson_id}'," in content:
        print(f"  ✓ {lesson_id} confirmed in curriculum")
    else:
        print(f"  ✗ {lesson_id} MISSING from curriculum!")
