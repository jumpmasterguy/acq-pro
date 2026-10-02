import { useRef, useState } from "react";
import { BookOpen, Zap, Award, Gift } from "lucide-react";
import { getTotalLessons } from "@/lib/curriculumMeta";

/**
 * Left-panel content for the sign-in / create-account page (desktop only).
 *
 * Three pieces, stacked by AuthPage inside its dark brand panel:
 *   - AuthHero: headline, a rotating "Decoded" card, and what you get
 *   - FounderNote: a real line from the founder's story (replaces the old
 *     anonymous testimonial, which was not a real customer quote)
 *
 * The rotating card is a plain-English acronym explainer with one dry line
 * of humor each. It pauses on hover/focus and does not auto-rotate for people
 * who ask their system for reduced motion.
 */

interface Decoded {
  term: string;
  full: string;
  plain: string;
  real: string;
}

// Keep these accurate and plain. The humor goes in `real`, never in `plain`.
const DECODED: Decoded[] = [
  {
    term: "EAC",
    full: "Estimate at Completion",
    plain: "What the whole job will cost by the time it's done.",
    real: "The number your boss asks for right before the meeting ends.",
  },
  {
    term: "CLIN",
    full: "Contract Line Item Number",
    plain: "One numbered line on a contract's price list: what you're buying and what it costs.",
    real: "The reason contracts look like very long receipts.",
  },
  {
    term: "DSO",
    full: "Days Sales Outstanding",
    plain: "How many days, on average, it takes to get paid after you send the invoice.",
    real: "The question that started all of this.",
  },
  {
    term: "IGCE",
    full: "Independent Government Cost Estimate",
    plain: "The government's own price estimate, built before it ever sees your offer.",
    real: "A guess that went to college.",
  },
  {
    term: "CPARS",
    full: "Contractor Performance Assessment Reporting System",
    plain: "Your performance report card. Future evaluators can read it.",
    real: "Yes, it follows you. No, there is no extra credit.",
  },
  {
    term: "PPBE",
    full: "Planning, Programming, Budgeting and Execution",
    plain: "How DoD decides what to buy, years before it actually buys it.",
    real: "The answer to “why can't we just buy it today?”",
  },
  {
    term: "Color of Money",
    full: "Appropriation types",
    plain: "Each pot of government money comes with its own rules and its own expiration date.",
    real: "Spend the wrong color and you will meet a lawyer.",
  },
  {
    term: "UCA",
    full: "Undefinitized Contract Action",
    plain: "Work starts before the final price is agreed.",
    real: "Eat the meal first, argue about the bill later.",
  },
];

const ROTATE_MS = 7000;

export function AuthHero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useRef(
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  // Rotation is driven by the progress bar's animationend, so pausing the bar
  // (hover/focus) pauses the rotation in lockstep. No bar (reduced motion) means
  // no auto-rotate; the dots still work.

  const d = DECODED[i];
  const highlights = [
    { icon: BookOpen, label: `${getTotalLessons()} short lessons with real program examples` },
    { icon: Zap, label: "Streaks, XP and weekly leaderboards" },
    { icon: Award, label: "Certificates with CLP and PDU hours" },
    { icon: Gift, label: "Module 1 is free. No card." },
  ];

  return (
    <div className="space-y-8 relative z-10">
      <style>{`
        @keyframes acq-decode-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes acq-decode-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .acq-decode-in { animation: acq-decode-in .5s ease both; }
        .acq-decode-bar { transform-origin: left; animation: acq-decode-bar ${ROTATE_MS}ms linear both; }
        @media (prefers-reduced-motion: reduce) { .acq-decode-in, .acq-decode-bar { animation: none; } }
        /* Short windows: drop the extras so the panel never forces a page scroll.
           The FounderNote below uses these same classes. */
        @media (max-height: 1120px) { .acq-hide-short { display: none !important; } }
        @media (max-height: 965px) { .acq-hide-shorter { display: none !important; } }
      `}</style>

      <div className="space-y-5">
        <div
          className="acq-hide-short inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white/80"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2dd4bf" }} />
          Plain-English DoD acquisition training
        </div>
        <h1
          className="font-bold leading-[1.1] tracking-tight text-white"
          style={{ fontSize: "clamp(2.1rem, 3vw, 3rem)", textWrap: "balance" } as React.CSSProperties}
        >
          <span className="block" style={{ textWrap: "balance" } as React.CSSProperties}>
            Stop nodding along in meetings.
          </span>
          <span
            className="block"
            style={{
              textWrap: "balance",
              background: "linear-gradient(90deg, #2dd4bf 0%, #7ee8d9 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            } as React.CSSProperties}
          >
            Start knowing what it means.
          </span>
        </h1>
        <p className="acq-hide-shorter text-white/65 text-base leading-relaxed max-w-lg">
          Short lessons on how defense programs get funded, contracted, and run. Real numbers,
          real examples, and a certificate at the end of every module.
        </p>
      </div>

      {/* Rotating "Decoded" card */}
      <div
        className="rounded-2xl p-6 max-w-xl relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 60px -24px rgba(0,0,0,0.6)",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        role="group"
        aria-label="Acquisition terms, decoded"
      >
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[11px] font-bold tracking-[0.14em] uppercase rounded-full px-2.5 py-1"
            style={{ background: "rgba(217,182,76,0.16)", color: "#E7D69B" }}
          >
            Decoded
          </span>
          <div className="flex items-center gap-1.5">
            {DECODED.map((x, n) => (
              <button
                key={x.term}
                type="button"
                onClick={() => setI(n)}
                aria-label={`Show ${x.term}`}
                aria-current={n === i}
                className="h-1.5 rounded-full transition-all cursor-pointer"
                style={{
                  width: n === i ? 18 : 6,
                  background: n === i ? "#2dd4bf" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        </div>

        <div key={d.term} className="acq-decode-in min-h-[172px]">
          <div className="text-3xl font-bold text-white tracking-tight">{d.term}</div>
          <div className="text-sm font-medium mb-3" style={{ color: "#2dd4bf" }}>
            {d.full}
          </div>
          <p className="text-[15px] leading-relaxed text-white/85 mb-3">{d.plain}</p>
          <p className="text-[15px] leading-relaxed italic" style={{ color: "#E7D69B" }}>
            {d.real}
          </p>
        </div>

        {!reduceMotion.current && (
          <div className="absolute left-0 right-0 bottom-0 h-[3px]" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              key={d.term}
              className="acq-decode-bar h-full"
              onAnimationEnd={() => setI((x) => (x + 1) % DECODED.length)}
              style={{ background: "rgba(45,212,191,0.7)", animationPlayState: paused ? "paused" : "running" }}
            />
          </div>
        )}
      </div>

      <div className="acq-hide-short grid grid-cols-2 gap-x-6 gap-y-3 max-w-xl">
        {highlights.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-start gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "rgba(45,212,191,0.14)" }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: "#2dd4bf" }} />
            </div>
            <span className="text-[13px] leading-snug text-white/75">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FounderNote() {
  return (
    <div
      className="acq-hide-shorter rounded-2xl p-5 relative z-10 flex items-start gap-4 max-w-xl"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
        style={{ background: "linear-gradient(135deg, #01696F 0%, #0C4E54 100%)" }}
        aria-hidden="true"
      >
        L
      </div>
      <div>
        <p className="text-sm leading-relaxed text-white/80">
          I built Acqlerate because I once answered a finance question with a slow, thoughtful nod.
        </p>
        <div className="text-xs text-white/50 mt-2">Lucas, founder. Army veteran, former DoD program manager.</div>
      </div>
    </div>
  );
}
