---
description: Audit curriculum modules in parallel, one module-auditor subagent each, then compile a scorecard.
argument-hint: [module ids, space separated, or blank for all]
---

Audit these modules: $ARGUMENTS

1. If no module ids were given, get every module id from `client/src/lib/curriculum.ts` (Grep for the module id fields; do not read the whole file).
2. Launch one `module-auditor` subagent per module, all in parallel in a single message. Prompt each with only: "Audit module <id>."
3. When all return, write `claude/module-audit-<YYYY-MM-DD>.md` containing:
   - A scorecard table sorted worst score first: module, score, verdict, lessons, assessment Qs, top fix.
   - A combined VERIFY list grouped by module.
   - A combined QUICK WINS list.
   - Then each auditor's full report, unedited.
4. Reply to me with only: the scorecard table, the 5 highest-impact fixes across all modules, and the count of VERIFY items. Plain English, short.
5. Do NOT edit curriculum.ts. Ask me which fixes to apply.
