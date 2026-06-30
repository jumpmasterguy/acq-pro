/**
 * Deterministic timing-trap scanner for FAR / DFARS / contract clause text.
 *
 * Philosophy: regex catches things LLMs miss because regex doesn't get tired,
 * doesn't paraphrase past the number, and doesn't decide "that's not important."
 *
 * Each rule extracts a verbatim excerpt and produces a structured finding.
 * The LLM later uses these as HARD CONSTRAINTS — it cannot drop a finding,
 * only enrich its plain-English explanation.
 */

// ---- Inlined types so this file is self-contained ----
export type TimingFinding = {
  category:
    | "hard_deadline"
    | "clock_starter"
    | "day_ambiguity"
    | "silent_acceptance"
    | "option_window"
    | "stop_work"
    | "cure_show_cause"
    | "claims_clock"
    | "ordering_period"
    | "payment_clock"
    | "recurring_obligation"
    | "notice_window";
  severity: "high" | "medium" | "low";
  excerpt: string;
  plain: string;
  recommendation: string;
  duration?: string;
  dayType?: "calendar" | "business" | "ambiguous";
  trigger?: string;
};

type Rule = {
  category: TimingFinding["category"];
  severity: TimingFinding["severity"];
  pattern: RegExp;
  build: (m: RegExpMatchArray, fullText: string) => Omit<TimingFinding, "category" | "severity">;
};

// Helper: grab a sentence-ish window around a match for context.
function windowAround(text: string, idx: number, len: number, pad = 80): string {
  const start = Math.max(0, idx - pad);
  const end = Math.min(text.length, idx + len + pad);
  let slice = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) slice = "…" + slice;
  if (end < text.length) slice = slice + "…";
  return slice;
}

function classifyDayType(text: string): "calendar" | "business" | "ambiguous" {
  if (/\bcalendar\s+day/i.test(text)) return "calendar";
  if (/\b(business|working|work)\s+day/i.test(text)) return "business";
  return "ambiguous";
}

const RULES: Rule[] = [
  // ---- Hard deadlines: "within N days" ----
  {
    category: "hard_deadline",
    severity: "high",
    pattern: /\bwithin\s+(\d{1,3}|ten|fifteen|twenty|thirty|sixty|ninety|one\s+hundred(?:\s+twenty)?)\s+(calendar\s+days?|business\s+days?|working\s+days?|days?|months?|years?)\b/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      const excerpt = windowAround(full, idx, m[0].length);
      return {
        excerpt,
        duration: `${m[1]} ${m[2]}`,
        dayType: classifyDayType(m[0]),
        trigger: "see surrounding sentence",
        plain: `Clock runs out in ${m[1]} ${m[2]}. Missing this window is usually fatal to the right being protected.`,
        recommendation: `Calendar this deadline the moment the clause is invoked. Confirm whether ${m[2]} are calendar, business, or working days — the clause text decides, not your assumption.`,
      };
    },
  },

  // ---- Hard deadlines: "no later than" / "not later than" ----
  {
    category: "hard_deadline",
    severity: "high",
    pattern: /\bn[o]?t?\s+later\s+than\s+([^.,;]{3,80})/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length),
        plain: `Hard cutoff: "${m[1].trim()}". After this point, the right or remedy referenced is typically waived or forfeited.`,
        recommendation: `Treat this as a do-not-miss date. Put it on your contract calendar with at least one reminder 7-10 days prior.`,
      };
    },
  },

  // ---- Clock starters: "from [the date of] receipt/notice/award/delivery" ----
  {
    category: "clock_starter",
    severity: "high",
    pattern: /\b(from|after|upon|following)\s+(receipt\s+of|the\s+date\s+of\s+receipt\s+of|notice\s+of|the\s+date\s+of|delivery\s+of|award\s+of|execution\s+of|completion\s+of|expiration\s+of)\s+([a-z][a-z\s'’\-]{2,60})/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length),
        trigger: `${m[1]} ${m[2]} ${m[3]}`.trim(),
        plain: `The clock starts ${m[1].toLowerCase()} ${m[2].toLowerCase()}${m[3] ? " " + m[3].trim() : ""} — NOT when you find out about it internally or when your team gets around to logging it.`,
        recommendation: `Stamp the actual receipt/notice/delivery date in writing. Disputes about "when did the clock start" are common and you want documentation.`,
      };
    },
  },

  // ---- Calendar vs business day ambiguity: bare "days" without modifier ----
  {
    category: "day_ambiguity",
    severity: "medium",
    pattern: /\b(within|in|after|before|by)\s+(\d{1,3})\s+days\b(?!\s*(?:of\s+the\s+(?:calendar|business)\s+))/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      const window = windowAround(full, idx, m[0].length, 40);
      // Only flag if the same sentence doesn't already specify
      if (/\b(calendar|business|working|work)\s+days?\b/i.test(window)) {
        return {
          excerpt: window,
          plain: "Day type is specified in this sentence.",
          recommendation: "No action needed beyond confirming.",
        };
      }
      return {
        excerpt: window,
        duration: `${m[2]} days`,
        dayType: "ambiguous",
        plain: `The clause says "${m[2]} days" without specifying calendar vs business. FAR 33.101 default is calendar days unless stated otherwise, but disputes happen.`,
        recommendation: `Confirm in writing with the KO whether "${m[2]} days" means calendar or business days BEFORE the clock matters. Don't assume.`,
      };
    },
  },

  // ---- Silent acceptance traps ----
  {
    category: "silent_acceptance",
    severity: "high",
    pattern: /\b(deemed\s+(?:accepted|approved|to\s+have\s+(?:accepted|consented|waived))|failure\s+to\s+(?:respond|object|reply|notify)|absent\s+(?:a\s+)?(?:written\s+)?(?:response|objection)|if\s+the\s+(?:contractor|government)\s+does\s+not\s+(?:respond|object|reply))/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 100),
        plain: `Silent acceptance trap: silence = consent. If you do nothing, you are treated as having agreed.`,
        recommendation: `This is the most common way contractors lose money or rights. Set up an SOP so a clause invoking silent acceptance ALWAYS routes to a named human who must respond by the deadline.`,
      };
    },
  },

  // ---- Option exercise notice (FAR 52.217-9 family) ----
  {
    category: "option_window",
    severity: "high",
    pattern: /(preliminary\s+written\s+notice|written\s+notice\s+of\s+(?:its|the\s+government['’]s)\s+intent\s+to\s+exercise\s+(?:the\s+)?option|exercise\s+(?:the|this|an)\s+option)/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 120),
        plain: `Option exercise mechanics. Under FAR 52.217-9, the Government typically must give preliminary notice X days before the current period ends AND exercise the option within the option period itself.`,
        recommendation: `Track BOTH the preliminary-notice window and the option exercise date. Late or missing preliminary notice is grounds to challenge an option exercise (or, if you're the Government, can invalidate it).`,
      };
    },
  },

  // ---- Stop-work / suspension (FAR 52.242-15) ----
  {
    category: "stop_work",
    severity: "high",
    pattern: /\b(stop[\s-]work\s+order|suspension\s+of\s+work|suspend(?:ed)?\s+performance)\b/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 120),
        plain: `Stop-work / suspension. Under FAR 52.242-15, a stop-work order can run up to 90 days (extendable only by mutual agreement). You typically have 30 days after cancellation/expiration to submit a claim for equitable adjustment.`,
        recommendation: `Two clocks to track: (1) the 90-day max stop-work duration, and (2) the 30-day claim submission window after the stop-work ends. Document costs daily during the stoppage.`,
      };
    },
  },

  // ---- Cure / show-cause (FAR 52.249-8/9) ----
  {
    category: "cure_show_cause",
    severity: "high",
    pattern: /\b(cure\s+notice|show[\s-]cause\s+notice|terminate\s+this\s+contract\s+for\s+default|default\s+termination|period\s+of\s+10\s+days\s+\(?(?:or\s+longer)?[^)]{0,40}\)?\s+in\s+which\s+to\s+cure)/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 120),
        plain: `Cure / show-cause notice — the precursor to a default termination. A cure notice gives you 10 days (or as stated) to fix the deficiency. A show-cause is a final warning.`,
        recommendation: `Treat cure/show-cause notices as a five-alarm fire. Get legal and PM in a room within 24 hours. Respond IN WRITING before the deadline, even if just to acknowledge and request more time.`,
      };
    },
  },

  // ---- Claims clock (CDA — 6 years, 60-day CO decision, 30/60-day reach-back) ----
  {
    category: "claims_clock",
    severity: "high",
    pattern: /\b(contract\s+disputes\s+act|certified\s+claim|claim\s+(?:must|shall)\s+be\s+submitted|6\s+years\s+after\s+accrual|sixty\s+days\s+after\s+receipt\s+of\s+the\s+claim|contracting\s+officer['’]s?\s+(?:final\s+)?decision)/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 120),
        plain: `CDA claims mechanics. You have 6 years from claim accrual to submit. CO must issue a final decision within 60 days for claims ≤$100K (or set a reasonable schedule for >$100K). You have 90 days to appeal to BCA, or 12 months to COFC.`,
        recommendation: `Date-stamp the accrual event. For any disputed cost over $100K, the certified-claim language is mandatory — get it right or the claim is jurisdictionally defective.`,
      };
    },
  },

  // ---- IDIQ ordering period vs PoP ----
  {
    category: "ordering_period",
    severity: "high",
    pattern: /\b(ordering\s+period|order(?:s)?\s+(?:may|shall|will)\s+be\s+(?:issued|placed)|task\s+order(?:s)?\s+(?:may|shall|will)\s+be\s+issued|delivery\s+order(?:s)?\s+(?:may|shall|will)\s+be\s+issued)/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 140),
        plain: `IDIQ ordering-period trap. The ordering period is the window in which NEW orders can be placed; individual orders can have performance periods that extend BEYOND the ordering period (FAR 16.505(c)). These are two different clocks and people confuse them constantly.`,
        recommendation: `Map both clocks in your contract calendar: (a) the last day the Government can issue a new order, and (b) the last day of performance on any open order. If an order is issued on the last day of the ordering period with a 12-month PoP, you're still on the hook for that 12 months.`,
      };
    },
  },

  // ---- Fair opportunity (IAC/MAC / IDIQ multi-award) ----
  {
    category: "notice_window",
    severity: "high",
    pattern: /\b(fair\s+opportunity|fair\s+notice|reasonable\s+opportunity\s+to\s+be\s+considered)/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 140),
        plain: `Fair-opportunity under FAR 16.505(b). For multi-award IDIQ/MAC/IAC orders >$10M, the Government typically must provide a "reasonable response period." For orders ≤SAT, fair opportunity can be very thin. Protest rights at GAO exist for orders >$25M (DoD) or >$10M (civilian) — but only within tight windows.`,
        recommendation: `Confirm the actual response window in the task order RFP — it's often shorter than industry expects (5-10 business days is common). Decide bid/no-bid FAST; you cannot recover lost time on a 7-day TO response.`,
      };
    },
  },

  // ---- Prompt Payment Act clocks ----
  {
    category: "payment_clock",
    severity: "medium",
    pattern: /\b(prompt\s+payment|30\s+days?\s+after\s+(?:receipt\s+of\s+)?(?:a\s+)?(?:proper\s+)?invoice|7\s+days?\s+after\s+(?:receipt\s+of\s+)?(?:a\s+)?(?:proper\s+)?invoice|interest\s+penalty)/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 120),
        plain: `Prompt Payment Act. Standard is 30 days after receipt of a proper invoice (7 days for some commercial items/meat/produce). Late payments accrue interest automatically — you do not have to request it.`,
        recommendation: `Make sure your invoice is "proper" (matches the clause's elements exactly). Government commonly rejects invoices on technicalities to restart the clock. Keep the rejection notice — it has its own response window.`,
      };
    },
  },

  // ---- Recurring obligations: annual / monthly / quarterly reporting ----
  {
    category: "recurring_obligation",
    severity: "medium",
    pattern: /\b(annually|each\s+(?:calendar\s+)?year|monthly|each\s+month|quarterly|each\s+quarter|every\s+\d+\s+(?:days?|months?))\b/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 100),
        plain: `Recurring obligation. This isn't a one-time deadline — it repeats. The most-missed deadlines in GovCon are recurring ones because everyone assumes "someone has it."`,
        recommendation: `Assign a single named owner and put the recurrence on a shared contract calendar. "Annually" in particular is dangerous because the first miss often goes undetected for 11 months.`,
      };
    },
  },

  // ---- Specific date deadlines ("by January 15", "no later than 31 March 2026") ----
  {
    category: "hard_deadline",
    severity: "high",
    pattern: /\b(by|before|prior\s+to|on\s+or\s+before)\s+((?:\d{1,2}\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}?,?\s*\d{2,4}?|\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 80),
        plain: `Fixed-date deadline: "${m[1]} ${m[2].trim()}". This is a hard wall, not a rolling clock.`,
        recommendation: `Pin this to the calendar today. Set reminders at T-30, T-14, and T-7.`,
      };
    },
  },

  // ---- Prior to award / before contract award ----
  {
    category: "hard_deadline",
    severity: "medium",
    pattern: /\b(prior\s+to|before)\s+(contract\s+)?award\b/gi,
    build: (m, full) => {
      const idx = m.index ?? 0;
      return {
        excerpt: windowAround(full, idx, m[0].length, 100),
        plain: `Pre-award obligation. Something must be done BEFORE award — usually a rep/cert, a clearance, a flow-down, or a teaming submission.`,
        recommendation: `Treat as a gating item. If it's not done by source-selection close, you're either non-responsive or non-responsible.`,
      };
    },
  },
];

// Dedupe near-identical findings:
//  - same category + overlapping excerpt window → drop
//  - cap each category at 3 findings (most clauses don't need more)
function dedupe(findings: TimingFinding[]): TimingFinding[] {
  const out: TimingFinding[] = [];
  const categoryCounts: Record<string, number> = {};
  for (const f of findings) {
    const dup = out.find(
      (g) =>
        g.category === f.category &&
        (g.excerpt.includes(f.excerpt.slice(2, 40)) ||
          f.excerpt.includes(g.excerpt.slice(2, 40)))
    );
    if (dup) continue;
    const count = categoryCounts[f.category] ?? 0;
    if (count >= 3) continue; // cap noise per category
    categoryCounts[f.category] = count + 1;
    out.push(f);
  }
  // Sort: high severity first, then by category
  const sev = { high: 0, medium: 1, low: 2 };
  out.sort((a, b) => sev[a.severity] - sev[b.severity]);
  return out;
}

export function scanForTimingTraps(text: string): TimingFinding[] {
  const findings: TimingFinding[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0; // reset stateful regex
    let m: RegExpMatchArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      try {
        const built = rule.build(m, text);
        // Skip findings that the rule marked as "no action needed"
        if (built.plain.includes("No action needed")) continue;
        findings.push({
          category: rule.category,
          severity: rule.severity,
          ...built,
        });
      } catch {
        // skip malformed match
      }
      // safety: avoid infinite loop on zero-width matches
      if (m.index === rule.pattern.lastIndex) rule.pattern.lastIndex++;
    }
  }
  return dedupe(findings);
}
