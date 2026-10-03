// Acqlerate Coach: Explain My Mistake.
// Sits under a missed multiple-choice question after the quiz is checked.
// Annual/Lifetime: a "Why not my answer?" button that explains why the option
// the learner picked was tempting and why it's wrong. Everyone else: a small
// locked teaser that opens the upgrade page (no prices here, so it is safe to
// show inside the native apps).
import { useState } from "react";
import { GraduationCap, Lock, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { topPlanName } from "@shared/pricing";
import { ensureAiConsent, setAiConsentFromUser } from "@/lib/aiConsent";

interface Explanation { tempting: string; wrong: string; tell: string }

interface Props {
  lessonId: string;
  questionId: string;
  questionText: string;
  picked: number;
  hasTopPlan: boolean;
  onUpgrade?: () => void;
}

export function MistakeCoach({ lessonId, questionId, questionText, picked, hasTopPlan, onUpgrade }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<Explanation | null>(null);

  if (!hasTopPlan) {
    return (
      <button
        type="button"
        onClick={onUpgrade}
        data-testid={`coach-mistake-locked-${questionId}`}
        className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-xs"
        style={{ borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-muted)' }}
      >
        <Lock className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          <strong style={{ color: 'var(--acq-text-secondary)' }}>Why was that answer so tempting?</strong>{" "}
          Explain My Mistake is part of the Acqlerate Coach, included with {topPlanName()}.
        </span>
      </button>
    );
  }

  const load = async () => {
    // Nothing goes to Anthropic until the person has said yes (lib/aiConsent.ts).
    if (!(await ensureAiConsent())) return;
    setState("loading");
    try {
      const res = await apiRequest("POST", "/api/coach/mistake", { lessonId, questionId, question: questionText, picked });
      const json = await res.json();
      setData(json.explanation);
      setState("done");
    } catch (e: any) {
      if (String(e?.message ?? "").startsWith("428")) setAiConsentFromUser(null);
      setState("error");
    }
  };

  if (state === "done" && data) {
    const rows: [string, string][] = [
      ["Why it's tempting", data.tempting],
      ["Why it's wrong here", data.wrong],
      ["Spot it next time", data.tell],
    ];
    return (
      <div
        className="mt-2 rounded-lg border p-3 text-[13px] leading-relaxed"
        style={{ background: 'var(--acq-surface-brand-wash)', borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-body)' }}
        data-testid={`coach-mistake-${questionId}`}
      >
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ color: 'var(--acq-text-brand)' }}>
          <GraduationCap className="h-3.5 w-3.5" /> Acqlerate Coach · Explain My Mistake
        </div>
        <div className="space-y-2">
          {rows.map(([label, text]) => (
            <p key={label}>
              <strong style={{ color: 'var(--acq-text-heading)' }}>{label}.</strong> {text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={load}
      disabled={state === "loading"}
      data-testid={`coach-mistake-btn-${questionId}`}
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-70"
      style={{ borderColor: 'var(--acq-border-button)', color: 'var(--acq-text-brand)', background: 'var(--acq-surface-card)' }}
    >
      {state === "loading"
        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> The Coach is looking at your answer…</>
        : state === "error"
          ? <><GraduationCap className="h-3.5 w-3.5" /> Couldn't load that. Tap to try again</>
          : <><GraduationCap className="h-3.5 w-3.5" /> Why not my answer?</>}
    </button>
  );
}
