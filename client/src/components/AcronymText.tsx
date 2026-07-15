import { useMemo, useRef, Fragment } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { KeyTerm } from "@/lib/curriculum";

/**
 * Renders body text with the first occurrence of each lesson key term
 * wrapped in a dotted-underline tooltip trigger showing its definition.
 * Subsequent occurrences of the same term render as plain text so the
 * page doesn't get cluttered with repeated tooltip triggers.
 *
 * Usage: pass the already-bold-processed segments (strings and React
 * nodes) as `parts`, plus the lesson's keyTerms and a shared `seen` Set
 * (created once per lesson render) to track which terms have already
 * been annotated so "first use" is tracked across the whole lesson,
 * not just within one paragraph.
 */

interface AcronymTextProps {
  text: string;
  keyTerms: KeyTerm[];
  seenTerms: Set<string>;
}

// Build a regex that matches any key term as a whole word, longest terms first
// so multi-word terms (e.g. "Cost of Living Allowance") match before a
// substring acronym would.
function buildTermRegex(keyTerms: KeyTerm[]): RegExp | null {
  const escaped = keyTerms
    .map((t) => t.term)
    .filter((t) => t && t.length >= 2)
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (escaped.length === 0) return null;
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "g");
}

export function AcronymText({ text, keyTerms, seenTerms }: AcronymTextProps) {
  const regex = useMemo(() => buildTermRegex(keyTerms), [keyTerms]);
  const termMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of keyTerms) m.set(t.term.toLowerCase(), t.definition);
    return m;
  }, [keyTerms]);

  if (!regex) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const matched = match[0];
    const lower = matched.toLowerCase();
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    const alreadySeen = seenTerms.has(lower);
    if (!alreadySeen && termMap.has(lower)) {
      seenTerms.add(lower);
      const definition = termMap.get(lower)!;
      nodes.push(
        <Tooltip key={key++} delayDuration={150}>
          <TooltipTrigger asChild>
            <span className="underline decoration-dotted decoration-muted-foreground/60 underline-offset-2 cursor-help">
              {matched}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="start" collisionPadding={16} avoidCollisions className="max-w-xs text-sm leading-relaxed">
            {definition}
          </TooltipContent>
        </Tooltip>
      );
    } else {
      nodes.push(<Fragment key={key++}>{matched}</Fragment>);
    }
    lastIndex = match.index + matched.length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{nodes}</>;
}

/** Creates a fresh "seen terms" tracker, one per lesson render. */
export function useSeenTermsRef() {
  return useRef<Set<string>>(new Set());
}
