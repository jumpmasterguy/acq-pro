// Acqlerate Coach: Teach It Back.
// Shown after the quiz is checked. The learner explains the lesson to a new
// hire in their own words; the Coach grades it against the lesson's key points,
// names what they nailed and the one gap, and shows how a pro would say it.
// Annual/Lifetime: unlimited. Everyone else: one free try in total, then a
// teaser (no prices, so it is safe inside the native apps).
import { useState } from "react";
import { GraduationCap, Lock, Loader2, Check, Circle, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { topPlanName } from "@shared/pricing";
import { ensureAiConsent, setAiConsentFromUser } from "@/lib/aiConsent";

const MIN = 40;
const MAX = 1500;

interface Result {
  verdict: "pass" | "almost" | "not_yet";
  keyPoints: { point: string; covered: boolean }[];
  nailed: string | null;
  gap: string | null;
  misconception: string | null;
  proVersion: string;
  xpAwarded: number;
  freeTry: boolean;
}

interface Props {
  lessonId: string;
  hasTopPlan: boolean;
  /** Lessons already attempted by this account (server + this session). */
  teachBackCount: number;
  onResult?: (xpAwarded: number) => void;
  onUpgrade?: () => void;
}

const VERDICT: Record<Result["verdict"], { title: string; wash: string; border: string }> = {
  pass: { title: "Nailed it. You could teach this.", wash: 'var(--acq-success-wash)', border: 'var(--acq-success-border)' },
  almost: { title: "Almost there.", wash: 'var(--acq-surface-brand-wash)', border: 'var(--acq-border-default)' },
  not_yet: { title: "Not yet. Give it another pass.", wash: 'var(--acq-danger-wash)', border: 'var(--acq-danger-border)' },
};

export function TeachItBack({ lessonId, hasTopPlan, teachBackCount, onResult, onUpgrade }: Props) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  // Locked only if the free try was used before this card was opened.
  const [lockedAtOpen] = useState(!hasTopPlan && teachBackCount > 0);

  const header = (
    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ color: 'var(--acq-text-brand)' }}>
      <GraduationCap className="h-3.5 w-3.5" /> Acqlerate Coach · Teach It Back
    </div>
  );
  const card = "rounded-xl border p-4 text-sm";
  const cardStyle = { background: 'var(--acq-surface-card)', borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-body)' };

  const upgradeTeaser = (lead: string) => (
    <button
      type="button"
      onClick={onUpgrade}
      className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-xs"
      style={{ borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-muted)' }}
      data-testid="coach-teachback-upgrade"
    >
      <Lock className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{lead} Teach It Back is unlimited with {topPlanName()}.</span>
    </button>
  );

  if (lockedAtOpen && !result) {
    return (
      <div className={card} style={cardStyle} data-testid="coach-teachback-locked">
        {header}
        <p className="font-semibold" style={{ color: 'var(--acq-text-heading)' }}>Could you explain this lesson to a new hire?</p>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--acq-text-secondary)' }}>
          Write it in your own words and the Coach grades it against what a pro would say.
        </p>
        {upgradeTeaser("You've used your free try.")}
      </div>
    );
  }

  const submit = async () => {
    // Nothing goes to Anthropic until the person has said yes (lib/aiConsent.ts).
    if (!(await ensureAiConsent())) return;
    setState("loading");
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/coach/teach-back", { lessonId, answer: text });
      const json: Result = await res.json();
      setResult(json);
      setState("done");
      onResult?.(json.xpAwarded ?? 0);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.startsWith("428")) setAiConsentFromUser(null);
      const body = msg.replace(/^\d+:\s*/, "");
      let friendly = "The Coach couldn't grade that just now. Try again in a moment.";
      try { friendly = JSON.parse(body).message ?? friendly; } catch { /* not JSON */ }
      setError(friendly);
      setState("idle");
    }
  };

  if (state === "done" && result) {
    const v = VERDICT[result.verdict];
    const hits = result.keyPoints.filter(k => k.covered).length;
    return (
      <div className={card} style={cardStyle} data-testid="coach-teachback-result">
        {header}
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2" style={{ background: v.wash, borderColor: v.border }}>
          <strong style={{ color: 'var(--acq-text-heading)' }}>{v.title}</strong>
          <span className="text-xs" style={{ color: 'var(--acq-text-secondary)' }}>{hits} of {result.keyPoints.length} key ideas</span>
          {result.xpAwarded > 0 && (
            <span
              className="ml-auto rounded-full border px-2 py-0.5 text-xs font-bold"
              style={{ background: 'var(--acq-surface-gold-wash)', borderColor: 'var(--acq-gold-border)', color: 'var(--acq-text-gold)' }}
              data-testid="coach-teachback-xp"
            >
              +{result.xpAwarded} XP
            </span>
          )}
        </div>

        <ul className="mt-3 space-y-1.5">
          {result.keyPoints.map((k, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-snug">
              {k.covered
                ? <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--acq-success)' }} />
                : <Circle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--acq-text-faint)' }} />}
              <span style={{ color: k.covered ? 'var(--acq-text-body)' : 'var(--acq-text-muted)' }}>{k.point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-2 text-[13px] leading-relaxed">
          {result.nailed && <p><strong style={{ color: 'var(--acq-text-heading)' }}>What you nailed.</strong> {result.nailed}</p>}
          {result.misconception && <p><strong style={{ color: 'var(--acq-text-heading)' }}>Watch out.</strong> {result.misconception}</p>}
          {result.gap && <p><strong style={{ color: 'var(--acq-text-heading)' }}>What to add.</strong> {result.gap}</p>}
        </div>

        <div className="mt-3 rounded-lg p-3 text-[13px] leading-relaxed" style={{ background: 'var(--acq-surface-sunken)' }}>
          <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ color: 'var(--acq-text-muted)' }}>How a pro would say it</div>
          {result.proVersion}
        </div>

        {hasTopPlan ? (
          <button
            type="button"
            onClick={() => { setResult(null); setState("idle"); }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: 'var(--acq-text-brand)' }}
            data-testid="coach-teachback-again"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try again
          </button>
        ) : upgradeTeaser("That was your free try.")}
      </div>
    );
  }

  const len = text.trim().length;
  return (
    <div className={card} style={cardStyle} data-testid="coach-teachback">
      {header}
      <p className="font-semibold" style={{ color: 'var(--acq-text-heading)' }}>Explain this lesson to a new hire in 2 to 4 sentences.</p>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--acq-text-secondary)' }}>
        Your own words, no scrolling back up. If you can teach it, you know it.
        {!hasTopPlan && <> <strong>This one's a free try;</strong> it's unlimited with {topPlanName()}.</>}
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, MAX))}
        rows={4}
        placeholder="So basically, the way this works is…"
        className="mt-3 w-full rounded-lg border p-3 text-sm leading-relaxed outline-none focus:ring-2"
        style={{ background: 'var(--acq-surface-page)', borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-body)' }}
        disabled={state === "loading"}
        data-testid="coach-teachback-input"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={len < MIN || state === "loading"}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--acq-teal)' }}
          data-testid="coach-teachback-submit"
        >
          {state === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> The Coach is reading…</> : "Grade me"}
        </button>
        <span className="text-[11px]" style={{ color: 'var(--acq-text-faint)' }}>
          {len < MIN ? `${MIN - len} more characters` : "We keep your score, not your words."}
        </span>
      </div>
      {error && <p className="mt-2 text-xs" style={{ color: 'var(--acq-text-secondary)' }}>{error}</p>}
    </div>
  );
}
