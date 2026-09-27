# Acqlerate Content Strategy Spec

## Brand Voice
- Down-to-earth, like a knowledgeable colleague over coffee
- Every article answers "why does this matter to ME?"
- Never textbook-dry. Use real examples, dollar amounts, named regulations
- Always connects to an Acqlerate module CTA + email capture
- Target: practitioners (GS-1102s, PMs, defense contractors, career changers)

## Blog Template Requirements (EVERY article must have):
1. Email capture block (mid-article teal form + sidebar gold form)
2. Internal module CTA linking to relevant Acqlerate module
3. Comparison table OR template
4. Callout block with key insight
5. FAQ section (3-5 questions at the bottom — good for SEO/featured snippets)

## HTML Structure
- File location: client/public/blog/{slug}.html
- Use existing blog CSS: /blog/blog.css
- Nav: ← Blog | Sign In | Start Free →
- Sidebar: TOC + module CTA + email capture
- Footer: Blog | Sign Up Free | Pricing | Contact

## Module Map (for CTAs)
- foundations: "DoD Acquisitions Foundations" — Module 1
- finance: "Defense Finance & Budgeting" — Module 2
- contracts: "Defense Contracting Fundamentals" — Module 3
- data: "Data Analytics for Program Managers" — Module 4
- capture: "Capture Management & Business Development" — Module 5
- operations: "Program Operations & Leadership" — Module 6

## Keyword Targets (high-intent, low-competition vs DAU/AcqNotes)
### Pillar 1 — DoD Acquisition Overview
- "what is defense acquisition" (500-1K/mo — DAU/AcqNotes dominant but dry)
- "DoD acquisition lifecycle" (300-500/mo)
- "ACAT levels explained" (200-400/mo — AcqNotes ranks but no plain English)
- "OTA vs FAR contract" (150-300/mo — minimal good content)
- "key roles in DoD acquisition" (100-200/mo)

### Pillar 2 — Defense Finance
- "what is PPBE" (300-500/mo — gov PDFs dominate, no readable guide)
- "color of money DoD" (400-600/mo — some blog content, none complete)
- "EVM for beginners" (200-400/mo — DAU videos only)
- "wrap rates explained defense" (100-200/mo — very low competition)
- "DCAA vs DCMA difference" (150-300/mo)

### Pillar 3 — Federal Contracting
- "DoD contract types explained" (300-500/mo)
- "GSA schedule guide" (400-800/mo — commercial competition)
- "source selection process DoD" (200-400/mo — only gov PDFs)
- "COR responsibilities federal" (150-300/mo)
- "contract modification REA claims" (100-200/mo — very low competition)

### Pillar 4 — GovCon Career
- "how to become a 1102" (500-800/mo — Reddit + OPM dominate)
- "BD to capture lifecycle" (100-200/mo — very low competition)
- "Section L vs Section M proposal" (200-400/mo)
- "how to win as small business federal" (300-600/mo)
- "CPARS ratings government contracting" (150-300/mo)

## Content Architecture
Each pillar = ~3,000 words (comprehensive, SEO pillar page)
Each cluster = ~1,500-2,000 words (focused, links back to pillar)
Pillars link to clusters; clusters link back to pillar and each other where relevant

## Internal Linking Rules
- Every cluster article links to its pillar (anchor text = pillar title)
- Every article links to 1-2 other relevant articles
- Every article has a module CTA (teal card)
- Pillar articles link to ALL their cluster articles in a "Related Guides" section

## Output Format
Each subagent writes: title, slug, article HTML body (no shell — just inner content)
Master assembler adds nav/sidebar/footer/capture forms
