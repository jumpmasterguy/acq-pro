/**
 * Lesson content blocks that needed a rethink for phones.
 *
 * MobileTableCards   A 3- to 5-column table does not fit a 390px screen, and
 *                    squeezing it produced one-letter-wide columns. On a phone
 *                    each row becomes a card instead: the first column is the
 *                    card's title, every other column a labelled field.
 *
 * FormulaBlock       Replaces the green-on-black monospace box. Each line of
 *                    a formula is read into its parts, the answer, the terms
 *                    and the operators, and drawn as coloured pieces: the
 *                    result as a solid chip, terms as soft chips, a simple
 *                    A ÷ B as a real fraction, and each operator in its own
 *                    colour so × and ÷ and − read at a glance. Anything the
 *                    reader cannot make sense of falls back to plain text, so
 *                    no formula can ever render as less than it did before.
 */

import type { ReactNode } from "react";
import { Calculator, Lightbulb, Table as TableIcon } from "lucide-react";

// ─── Colour helpers ─────────────────────────────────────────────────────────

/** '#2563eb' + 0.12 → '#2563eb1f'. Module accents are always 6-digit hex. */
function alpha(hex: string, a: number): string {
  const n = Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${n}` : hex;
}

// ─── Tables, phone layout ───────────────────────────────────────────────────

/** Values at or under this length sit beside their label on one line. */
const SHORT_VALUE = 32;

export function MobileTableCards({
  heading,
  headers,
  rows,
  accentHex,
  explanation,
}: {
  heading?: string;
  headers?: string[];
  rows?: string[][];
  accentHex: string;
  explanation?: string;
}) {
  const hdrs = headers ?? [];
  const body = rows ?? [];

  return (
    <div className="space-y-2.5" data-testid="table-cards">
      {heading && (
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: alpha(accentHex, 0.12), color: accentHex }}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-bold">{heading}</h3>
        </div>
      )}

      {body.map((row, ri) => {
        const [title, ...rest] = row;
        return (
          <div
            key={ri}
            className="overflow-hidden rounded-xl border bg-card"
            style={{ borderLeft: `4px solid ${accentHex}` }}
          >
            <div className="px-4 pb-3.5 pt-3">
              <div className="text-[15px] font-bold leading-snug text-foreground">{title}</div>

              {rest.length > 0 && (
                <div className="mt-2.5 space-y-2.5">
                  {rest.map((value, ci) => {
                    const label = hdrs[ci + 1] ?? "";
                    const short = (value ?? "").length <= SHORT_VALUE;
                    if (short) {
                      return (
                        <div key={ci} className="flex items-baseline justify-between gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                            {label}
                          </span>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-right text-[13px] font-semibold"
                            style={{ background: alpha(accentHex, 0.12), color: accentHex }}
                          >
                            {value}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={ci}>
                        {label && (
                          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                            {label}
                          </div>
                        )}
                        <div className="mt-0.5 text-[15px] leading-relaxed text-foreground/85">{value}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {explanation && <p className="text-muted-foreground">{explanation}</p>}
    </div>
  );
}

// ─── Formulas ───────────────────────────────────────────────────────────────

/**
 * Each operator keeps one colour everywhere in the app, so a learner's eye
 * learns "violet is multiply" the same way it learns a module's colour.
 * Hues chosen to stay distinct from each other and readable in both themes.
 */
const OPERATOR_STYLE: Record<string, { color: string; label: string }> = {
  "×": { color: "#7c3aed", label: "times" },
  "*": { color: "#7c3aed", label: "times" },
  "÷": { color: "#0284c7", label: "divided by" },
  "/": { color: "#0284c7", label: "divided by" },
  "−": { color: "#e11d48", label: "minus" },
  "-": { color: "#e11d48", label: "minus" },
  "+": { color: "#059669", label: "plus" },
};
const RELATIONS = ["=", "≈", "≤", "≥"];

type Token = { kind: "term"; text: string } | { kind: "op"; op: string };

/** Splits on operators that sit at the top level (outside parentheses) and
 *  have a space either side, so "Work-to-Cash" and "(1 + Fee)" stay whole. */
function tokenize(expr: string): Token[] {
  const out: Token[] = [];
  let depth = 0;
  let buf = "";
  const chars = Array.from(expr);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === "(") depth++;
    if (c === ")") depth = Math.max(0, depth - 1);
    const isOp =
      depth === 0 &&
      c in OPERATOR_STYLE &&
      chars[i - 1] === " " &&
      chars[i + 1] === " ";
    if (isOp) {
      if (buf.trim()) out.push({ kind: "term", text: buf.trim() });
      out.push({ kind: "op", op: c });
      buf = "";
    } else {
      buf += c;
    }
  }
  if (buf.trim()) out.push({ kind: "term", text: buf.trim() });
  return out;
}

const hasOps = (t: Token[]) => t.some((x) => x.kind === "op");

/** "(BAC − EV)" → "BAC − EV" when the parentheses wrap the whole thing. */
function unwrap(text: string): string {
  const t = text.trim();
  if (!t.startsWith("(") || !t.endsWith(")")) return t;
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "(") depth++;
    if (t[i] === ")") depth--;
    if (depth === 0 && i < t.length - 1) return t; // closes early: "(a) × (b)"
  }
  return t.slice(1, -1).trim();
}

/** Pulls a trailing aside off a line: "EV ÷ AC   (below 1.0: over cost)"
 *  or "…Revenue Recognized (± adjustments for descopes…)". A short trailing
 *  group straight after an operator is an operand, not an aside, and stays. */
function splitNote(line: string): { main: string; note?: string } {
  const spaced = line.match(/^(.*?\S)\s{2,}\(([^()]+)\)\s*$/);
  if (spaced) return { main: spaced[1], note: spaced[2] };
  const trailing = line.match(/^(.*\S)\s\(([^()]{20,})\)\s*$/);
  if (trailing) {
    const before = trailing[1].trim();
    const last = before.slice(-1);
    if (!(last in OPERATOR_STYLE) && !RELATIONS.includes(last)) {
      return { main: before, note: trailing[2] };
    }
  }
  return { main: line };
}

type Line =
  | { kind: "equation"; label?: string; lhs: Token[]; rel: string; rhs: Token[]; note?: string }
  | { kind: "stack"; op?: string; text: string; note?: string; isResult: boolean }
  | { kind: "note"; text: string }
  | { kind: "text"; label?: string; text: string }
  | { kind: "gap" };

function findRelation(s: string): { idx: number; rel: string } | null {
  let best: { idx: number; rel: string } | null = null;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(") depth++;
    if (c === ")") depth = Math.max(0, depth - 1);
    if (depth === 0 && RELATIONS.includes(c) && s[i - 1] === " " && s[i + 1] === " ") {
      best = { idx: i, rel: c };
      break;
    }
  }
  return best;
}

export function parseFormula(formula: string): Line[] {
  const raw = formula.split("\n");
  const lines: Line[] = [];

  raw.forEach((rawLine, li) => {
    const line = rawLine.trim();
    if (!line) { lines.push({ kind: "gap" }); return; }

    // A line wholly in parentheses is an aside to the line above it.
    if (/^\(.*\)$/.test(line) && unwrap(line) !== line) {
      lines.push({ kind: "note", text: unwrap(line) });
      return;
    }

    // Ledger-style stacks: "Incurred to date / − Billed to date / = Unbilled".
    const lead = line.match(/^([−+×÷=\-])\s+(.*)$/);
    const nextLead = /^[−+×÷=\-]\s/.test((raw[li + 1] ?? "").trim());
    if (lead || (nextLead && !findRelation(line))) {
      const body = lead ? lead[2] : line;
      const { main, note } = splitNote(body);
      lines.push({
        kind: "stack",
        op: lead ? lead[1] : undefined,
        text: main,
        note,
        isResult: lead?.[1] === "=",
      });
      return;
    }

    // "Example: $10M ÷ $50M = 20%" and "Where x ≈ y" carry a lead-in label.
    let label: string | undefined;
    let rest = line;
    const labelled = line.match(/^([^=≈≤≥:()]{1,40}):\s+(.*)$/);
    if (labelled && findRelation(labelled[2])) { label = labelled[1]; rest = labelled[2]; }
    else if (/^Where\s/i.test(line) && findRelation(line.slice(6))) { label = "Where"; rest = line.slice(6); }

    const { main, note } = splitNote(rest);
    const rel = findRelation(main);
    if (!rel) { lines.push({ kind: "text", text: line }); return; }

    const lhs = tokenize(main.slice(0, rel.idx));
    const rhs = tokenize(main.slice(rel.idx + 1));
    if (!lhs.length || !rhs.length) { lines.push({ kind: "text", text: line }); return; }
    lines.push({ kind: "equation", label, lhs, rel: rel.rel, rhs, note });
  });

  // Trim leading/trailing and doubled gaps.
  return lines.filter((l, i, a) => l.kind !== "gap" || (i > 0 && i < a.length - 1 && a[i - 1].kind !== "gap"));
}

// ── Pieces ──

function OpBubble({ op }: { op: string }) {
  const style = OPERATOR_STYLE[op];
  const color = style?.color ?? "#64748b";
  return (
    <span
      role="img"
      aria-label={style?.label ?? op}
      className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[15px] font-black leading-none"
      style={{ background: alpha(color, 0.14), color }}
    >
      {op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : op}
    </span>
  );
}

function RelBubble({ rel, accentHex }: { rel: string; accentHex: string }) {
  return (
    <span
      className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[16px] font-black leading-none"
      style={{ background: alpha(accentHex, 0.14), color: accentHex }}
    >
      {rel}
    </span>
  );
}

function TermChip({ text, accentHex }: { text: string; accentHex: string }) {
  return (
    <span
      className="inline-block rounded-lg border px-2.5 py-1 text-[14px] font-semibold leading-snug text-foreground"
      style={{ background: alpha(accentHex, 0.07), borderColor: alpha(accentHex, 0.22) }}
    >
      {text}
    </span>
  );
}

function ResultChip({ text, accentHex }: { text: string; accentHex: string }) {
  return (
    <span
      className="inline-block rounded-lg px-2.5 py-1 text-[14px] font-extrabold leading-snug text-white shadow-sm"
      style={{ background: accentHex }}
    >
      {text}
    </span>
  );
}

/** A lone "A ÷ B" drawn as a stacked fraction. */
function Fraction({ top, bottom, accentHex }: { top: string; bottom: string; accentHex: string }) {
  return (
    <span className="inline-flex max-w-full flex-col items-stretch text-center align-middle">
      <TermChip text={unwrap(top)} accentHex={accentHex} />
      <span className="mx-1 my-1 h-[2.5px] rounded-full" style={{ background: OPERATOR_STYLE["÷"].color }} />
      <TermChip text={unwrap(bottom)} accentHex={accentHex} />
    </span>
  );
}

function Side({ tokens, asResult, accentHex }: { tokens: Token[]; asResult: boolean; accentHex: string }) {
  if (asResult && tokens.length === 1 && tokens[0].kind === "term") {
    return <ResultChip text={tokens[0].text} accentHex={accentHex} />;
  }
  const ops = tokens.filter((t) => t.kind === "op") as { kind: "op"; op: string }[];
  if (tokens.length === 3 && ops.length === 1 && (ops[0].op === "÷" || ops[0].op === "/")) {
    const [a, , b] = tokens as { kind: "term"; text: string }[];
    return <Fraction top={a.text} bottom={b.text} accentHex={accentHex} />;
  }
  return (
    <>
      {tokens.map((t, i) =>
        t.kind === "op"
          ? <OpBubble key={i} op={t.op} />
          : <TermChip key={i} text={t.text} accentHex={accentHex} />,
      )}
    </>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <div className="mt-2 text-[13px] italic leading-snug text-muted-foreground">{children}</div>;
}

export function FormulaBlock({
  heading,
  formula,
  explanation,
  accentHex,
}: {
  heading?: string;
  formula?: string;
  explanation?: string;
  accentHex: string;
}) {
  const lines = formula ? parseFormula(formula) : [];
  // Step badges only when there is a sequence to number. Labelled lines
  // ("Example:") are illustrations of a step, not steps themselves.
  const equationCount = lines.filter((l) => l.kind === "equation" && !l.label).length;
  let step = 0;

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: alpha(accentHex, 0.28), background: alpha(accentHex, 0.04) }}
      data-testid="formula-block"
    >
      <div className="flex items-center gap-3 px-4 pb-1 pt-4 sm:px-5">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ background: accentHex }}
        >
          <Calculator className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: accentHex }}>
            Formula
          </div>
          {heading && <h3 className="font-bold leading-tight">{heading}</h3>}
        </div>
      </div>

      <div className="space-y-2.5 px-3 pb-4 pt-3 sm:px-4">
        {lines.map((line, li) => {
          if (line.kind === "gap") return <div key={li} className="h-1" />;

          if (line.kind === "note") {
            return <Note key={li}>{line.text}</Note>;
          }

          if (line.kind === "text") {
            return (
              <div key={li} className="px-1 text-[15px] leading-relaxed text-foreground/85">
                {line.text}
              </div>
            );
          }

          if (line.kind === "stack") {
            return (
              <div key={li} className="flex items-start gap-2.5 rounded-xl border bg-card px-3 py-2.5">
                {line.op ? (
                  line.op === "=" ? <RelBubble rel="=" accentHex={accentHex} /> : <OpBubble op={line.op} />
                ) : (
                  <span className="h-7 w-7 flex-shrink-0" />
                )}
                <div className="min-w-0 pt-0.5">
                  {line.isResult
                    ? <ResultChip text={line.text} accentHex={accentHex} />
                    : <TermChip text={line.text} accentHex={accentHex} />}
                  {line.note && <Note>{line.note}</Note>}
                </div>
              </div>
            );
          }

          // equation
          step += 1;
          const lhsIsResult = !hasOps(line.lhs);
          const rhsIsResult = !lhsIsResult && !hasOps(line.rhs);
          return (
            <div key={li} className="flex gap-3 rounded-xl border bg-card px-3 py-3 shadow-sm">
              {equationCount > 1 && !line.label && (
                <span
                  className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                  style={{ background: accentHex }}
                >
                  {step}
                </span>
              )}
              <div className="min-w-0 flex-1">
                {line.label && (
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {line.label}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  <Side tokens={line.lhs} asResult={lhsIsResult} accentHex={accentHex} />
                  <RelBubble rel={line.rel} accentHex={accentHex} />
                  <Side tokens={line.rhs} asResult={rhsIsResult} accentHex={accentHex} />
                </div>
                {line.note && <Note>{line.note}</Note>}
              </div>
            </div>
          );
        })}

        {explanation && (
          <div className="flex gap-2.5 px-1 pt-1">
            <Lightbulb className="mt-1 h-4 w-4 flex-shrink-0" style={{ color: "#d97706" }} />
            <p className="leading-relaxed text-muted-foreground">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

