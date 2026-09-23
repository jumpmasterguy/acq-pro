/**
 * The career track rendered as a path rather than a grid of cards.
 *
 * Three things drive the layout, and all three came out of the same problem:
 * eleven full cards in a grid is a wall, and the only finish line is 100+
 * lessons away.
 *
 *  1. It opens at the active step. Finished work sits above the fold, so a
 *     learner on step 7 does not scroll past six done modules every session.
 *  2. Only the active step gets a full card with a button. Every other step is
 *     a single row that is itself the link. One affordance, not eleven.
 *  3. The steps break into legs with a checkpoint gate between them, and the
 *     path routes THROUGH each gate, so a milestone is something you pass
 *     through rather than a banner beside the road.
 *
 * Node colour stays the subject family, so the five-family grouping survives
 * the move from grid to path.
 */

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import type { Module } from '@/lib/curriculum';
import { formatDuration, parseDuration } from '@/lib/curriculum';
import { getModuleFamilyTheme, getModuleFamily, FAMILY_LABEL } from '@/lib/moduleTheme';
import { getModuleProgress, FREE_MODULES } from '@/lib/progress';
import type { UserProgress } from '@/lib/progress';
import { getTrackPath, splitIntoLegs } from '@/lib/careerPath';
import { cn } from '@/lib/utils';

const SPINE = 96;       // width of the node column
const GAP = 44;         // height of a connector block
const NODE_L = 30;      // node centre on even steps
const NODE_R = 66;      // node centre on odd steps
const NODE_C = 48;      // node centre for a gate or the finish
const R_ACTIVE = 30;
const R_STEP = 22;
const R_GATE = 19;

/**
 * CLPs for a leg are summed from the track's OWN lessons, not from
 * moduleClps(). A career track uses a subset of most modules, so crediting the
 * whole module here would claim more instruction time than the learner
 * actually walked through. Floored to one decimal for the same reason the
 * generator floors: this number sits next to a figure people file in WarU.
 */
function clpsOf(minutes: number): string {
  return (Math.floor((minutes / 60) * 10) / 10).toFixed(1);
}

type Step = {
  mod: Module;
  idx: number;            // 0-based position in the track
  pct: number;
  locked: boolean;
  trackLessons: number;
  trackMinutes: number;
  hex: string;
  textClass: string;
  family: string;
};

function Connector({ fromX, toX, hex }: { fromX: number; toX: number; hex: string }) {
  const mid = GAP / 2;
  const cx = (fromX + toX) / 2;
  const rot = toX > fromX ? 0 : toX < fromX ? 180 : 90;
  const d = `M ${fromX} 0 C ${fromX} ${mid}, ${toX} ${mid}, ${toX} ${GAP}`;
  return (
    <div className="flex-shrink-0" style={{ width: SPINE, height: GAP }} aria-hidden="true">
      <svg width={SPINE} height={GAP} viewBox={`0 0 ${SPINE} ${GAP}`} focusable="false">
        <path d={d} fill="none" stroke={hex} strokeWidth={12} strokeLinecap="round" opacity={0.24} />
        <path d={d} fill="none" stroke={hex} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="2 10" opacity={0.6} />
        <path
          d="M -6 -7 L 4 0 L -6 7"
          fill="none"
          stroke={hex}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`translate(${cx} ${mid}) rotate(${rot})`}
        />
      </svg>
    </div>
  );
}

/** The vertical stub plus the node itself, centred in the spine column. */
function Spine({ x, r, hex, filled, ring, children }: {
  x: number; r: number; hex: string; filled: boolean; ring?: boolean; children?: ReactNode;
}) {
  return (
    <div className="relative flex-shrink-0 self-stretch" style={{ width: SPINE }} aria-hidden="true">
      <div className="absolute top-0 bottom-0 rounded-full" style={{ left: x - 6, width: 12, background: hex, opacity: 0.24 }} />
      {ring && (
        <div
          className="absolute rounded-full"
          style={{ left: x - r - 9, top: `calc(50% - ${r + 9}px)`, width: (r + 9) * 2, height: (r + 9) * 2, border: `3px solid ${hex}`, opacity: 0.3 }}
        />
      )}
      <div
        className={cn('absolute rounded-full flex items-center justify-center', !filled && 'bg-card')}
        style={{
          left: x - r,
          top: `calc(50% - ${r}px)`,
          width: r * 2,
          height: r * 2,
          background: filled ? hex : undefined,
          border: filled ? 'none' : `2.5px solid ${hex}`,
          fontSize: r > 26 ? 24 : 17,
          lineHeight: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function CareerPath({
  mods, progress, trackId, primaryLessonSetForModule, onSelectModule, onUpgrade,
}: {
  mods: Module[];
  progress: UserProgress;
  trackId: string;
  primaryLessonSetForModule: Record<string, string[]>;
  onSelectModule: (id: string) => void;
  onUpgrade: () => void;
}) {
  const path = getTrackPath(trackId);

  const steps: Step[] = mods.map((mod, idx) => {
    const primary = new Set(primaryLessonSetForModule[mod.id] ?? mod.lessons.map(l => l.id));
    const theme = getModuleFamilyTheme(mod.id);
    const inTrack = mod.lessons.filter(l => primary.has(l.id));
    return {
      mod,
      idx,
      pct: getModuleProgress(mod.id, mod.lessons.map(l => l.id), progress.completedLessons),
      locked: !FREE_MODULES.includes(mod.id) && !progress.isPremium,
      trackLessons: inTrack.length,
      trackMinutes: inTrack.reduce((a, l) => a + parseDuration(l.duration), 0),
      hex: theme.hex,
      textClass: theme.text,
      family: FAMILY_LABEL[getModuleFamily(mod.id)],
    };
  });

  // The step the page should open on: the one in progress, else the first not
  // started, else the last. Never "the top".
  const started = steps.findIndex(s => s.pct > 0 && s.pct < 100);
  const fresh = steps.findIndex(s => s.pct === 0);
  const activeIdx = started !== -1 ? started : fresh !== -1 ? fresh : steps.length - 1;

  const activeRef = useRef<HTMLDivElement | null>(null);
  const scrolled = useRef<string | null>(null);
  useEffect(() => {
    // Once per track, and never when the active step is already the first one:
    // scrolling there would only hide the header for no gain.
    if (scrolled.current === trackId || activeIdx <= 0) return;
    scrolled.current = trackId;
    activeRef.current?.scrollIntoView({ block: 'center' });
  }, [trackId, activeIdx]);

  const groups = splitIntoLegs(steps.map(s => ({ ...s, id: s.mod.id })), path);

  const rows: ReactNode[] = [];
  let prevX: number | null = null;
  let prevHex = steps[0]?.hex ?? '#3D8FD1';
  let runMinutes = 0;
  let runLessons = 0;

  const connect = (toX: number, hex: string, key: string) => {
    if (prevX === null) return;
    rows.push(<Connector key={key} fromX={prevX} toX={toX} hex={hex} />);
  };

  groups.forEach((group, gi) => {
    const isFinalLeg = gi === groups.length - 1;

    // The leg banner. A solid brand-teal band, deliberately louder than a step
    // and a different colour from every family, so it reads as "new stage of
    // the route" rather than a gap in the line. Teal banner, family-coloured
    // steps, gold gate, navy finish: each layer has its own colour.
    const legMinutes = group.mods.reduce((a, m) => a + m.trackMinutes, 0);
    const legDone = group.mods.filter(m => m.pct >= 100).length;
    const legComplete = legDone === group.mods.length;
    rows.push(
      <div
        key={`leghead-${gi}`}
        className={cn('rounded-2xl px-4 py-4 md:px-5 text-white shadow-sm', gi === 0 ? 'mt-1 mb-3' : 'mt-8 mb-3')}
        style={{ background: 'linear-gradient(135deg, #01696F 0%, #0A7C83 100%)' }}
        data-testid={`path-leg-${gi}`}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div
            className="flex-shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-[20px] md:text-[22px] font-extrabold tabular-nums"
            style={{ background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.35)' }}
            aria-hidden="true"
          >
            {legComplete ? (
              <svg viewBox="0 0 16 16" width={20} height={20} focusable="false">
                <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="#F5C842" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : gi + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Leg {gi + 1} of {groups.length}
            </div>
            <div className="text-[18px] md:text-[21px] font-extrabold leading-tight tracking-tight">{group.leg.name}</div>
            <div className="text-[12px] mt-0.5 tabular-nums" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {group.mods.length} module{group.mods.length !== 1 ? 's' : ''}
              {' · '}{formatDuration(legMinutes)}
              {' · '}{clpsOf(legMinutes)} CLPs
            </div>
          </div>
          <span
            className="hidden sm:inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-bold tabular-nums"
            style={legComplete
              ? { background: '#F5C842', color: '#3D2B00' }
              : { background: 'rgba(255,255,255,0.16)', color: '#fff' }}
          >
            {legComplete ? 'Leg complete' : `${legDone} of ${group.mods.length} done`}
          </span>
        </div>
      </div>,
    );

    group.mods.forEach(s => {
      const x = s.idx % 2 === 0 ? NODE_L : NODE_R;
      const active = s.idx === activeIdx;
      const r = active ? R_ACTIVE : R_STEP;
      connect(x, s.hex, `c-${s.mod.id}`);
      prevX = x;
      prevHex = s.hex;
      runMinutes += s.trackMinutes;
      runLessons += s.trackLessons;

      const meta = (
        <>
          <span className="tabular-nums">{s.trackLessons} lessons</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="tabular-nums">{formatDuration(s.trackMinutes)}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="tabular-nums font-bold text-amber-700 dark:text-amber-400">{clpsOf(s.trackMinutes)} CLPs</span>
        </>
      );

      rows.push(
        <div key={s.mod.id} ref={active ? activeRef : undefined} className="flex" data-testid={`path-step-${s.mod.id}`}>
          <Spine x={x} r={r} hex={s.hex} filled={active} ring={active}>
            <span aria-hidden="true">{s.mod.icon}</span>
          </Spine>

          {active ? (
            <div className="flex-1 min-w-0 my-2 rounded-2xl border border-border bg-card p-4 shadow-sm" style={{ borderTop: `3px solid ${s.hex}` }}>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className={cn('text-[10px] font-bold uppercase tracking-[0.1em]', s.textClass)}>
                  Step {s.idx + 1} · {s.family}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                  You are here
                </span>
              </div>
              <div className="text-[17px] font-bold leading-snug tracking-tight mb-2">{s.mod.title}</div>
              <div className="flex items-center gap-2 flex-wrap text-[12px] text-muted-foreground mb-3">{meta}</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-1.5 rounded-full" style={{ width: `${s.locked ? 0 : s.pct}%`, background: s.hex }} />
                </div>
                <span className={cn('text-[12px] font-bold tabular-nums', s.textClass)}>{s.locked ? '' : `${s.pct}%`}</span>
                <button
                  type="button"
                  onClick={() => (s.locked ? onUpgrade() : onSelectModule(s.mod.id))}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[132px] px-5 rounded-[10px] bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
                  data-testid={`path-continue-${s.mod.id}`}
                >
                  {s.locked ? 'Unlock to start' : s.pct > 0 ? 'Continue' : 'Start here'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (s.locked ? onUpgrade() : onSelectModule(s.mod.id))}
              className="flex-1 min-w-0 my-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-left hover:border-primary/40 transition-colors"
              style={{ borderTop: `3px solid ${s.hex}` }}
              data-testid={`path-step-btn-${s.mod.id}`}
            >
              <div className={cn('text-[9px] font-bold uppercase tracking-[0.1em] mb-0.5', s.textClass)}>
                Step {s.idx + 1} · {s.family}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="flex-1 min-w-0 text-sm font-bold leading-snug tracking-tight truncate">{s.mod.title}</span>
                {s.locked
                  ? <Lock className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
                  : s.pct > 0
                    ? <span className={cn('flex-shrink-0 text-[11px] font-bold tabular-nums', s.textClass)}>{s.pct}%</span>
                    : null}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground mt-0.5">{meta}</div>
            </button>
          )}
        </div>,
      );
    });

    if (!isFinalLeg && group.leg.claim) {
      connect(NODE_C, '#D19900', `gc-${gi}`);
      prevX = NODE_C;
      rows.push(
        <div key={`gate-${gi}`} className="flex" data-testid={`path-gate-${gi}`}>
          <Spine x={NODE_C} r={R_GATE} hex="#D19900" filled>
            <svg viewBox="0 0 24 24" width={19} height={19} aria-hidden="true" focusable="false">
              <path d="M6 21 V3" stroke="#3D2B00" strokeWidth={2.2} strokeLinecap="round" fill="none" />
              <path d="M6 4 H18 L15 8 L18 12 H6 Z" fill="#3D2B00" />
            </svg>
          </Spine>
          <div
            className="flex-1 min-w-0 my-2 rounded-2xl px-5 py-3.5"
            style={{ background: 'rgba(209,153,0,0.10)', border: '1.5px solid rgba(209,153,0,0.45)' }}
          >
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">Checkpoint</span>
              <span className="text-[11px] font-bold tabular-nums text-amber-700 dark:text-amber-400">
                {clpsOf(runMinutes)} CLPs through here · {runLessons} lessons
              </span>
            </div>
            <div className="text-[14px] font-bold leading-snug tracking-tight">{group.leg.claim}</div>
          </div>
        </div>,
      );
    }
  });

  connect(NODE_C, '#01696F', 'c-finish');

  return (
    <div data-testid="career-path">
      {rows}

      <div className="mt-2 rounded-2xl p-6 md:p-7 text-white" style={{ background: 'linear-gradient(135deg, #0d2137 0%, #123047 55%, #0a1b2d 100%)' }}>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
          <div className="flex-shrink-0 self-center">
            <PmCelebration />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: '#F5C842' }}>Finish line</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: '#F5C842' }}>
                {clpsOf(runMinutes)} CLPs · {runLessons} lessons
              </span>
            </div>
            <h3 className="text-[22px] md:text-[25px] font-bold tracking-tight leading-tight mb-1.5">{path.finish.headline}</h3>
            {path.finish.lines.length > 0 && (
              <>
                <p className="text-[13px] mb-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  By the last stop you can explain, out loud, without notes:
                </p>
                <ul className="space-y-2">
                  {path.finish.lines.map(line => (
                    <li key={line} className="flex gap-2.5 items-start">
                      <svg viewBox="0 0 16 16" width={12} height={12} aria-hidden="true" focusable="false" className="flex-shrink-0 mt-1">
                        <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="#F5C842" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[14px] leading-snug" style={{ color: 'rgba(255,255,255,0.93)' }}>{line}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Original flat figure. Not a likeness of anyone, and not a stock asset. */
function PmCelebration() {
  return (
    <svg viewBox="0 0 320 300" width={240} height={225} role="img" aria-label="A program manager celebrating at the end of the path">
      <rect x="36" y="60" width="9" height="9" rx="2" fill="#3D8FD1" opacity="0.85" transform="rotate(18 40.5 64.5)" />
      <rect x="268" y="44" width="8" height="8" rx="2" fill="#B0327A" opacity="0.85" transform="rotate(-22 272 48)" />
      <rect x="92" y="26" width="7" height="7" rx="2" fill="#D19900" opacity="0.85" transform="rotate(40 95.5 29.5)" />
      <rect x="232" y="96" width="8" height="8" rx="2" fill="#2E8B57" opacity="0.85" transform="rotate(12 236 100)" />
      <rect x="54" y="140" width="7" height="7" rx="2" fill="#5E3596" opacity="0.85" transform="rotate(-35 57.5 143.5)" />
      <rect x="278" y="152" width="8" height="8" rx="2" fill="#D1571A" opacity="0.85" transform="rotate(28 282 156)" />
      <circle cx="70" cy="96" r="4" fill="#D19900" opacity="0.8" />
      <circle cx="250" cy="70" r="4.5" fill="#01696F" opacity="0.75" />
      <circle cx="164" cy="18" r="4" fill="#D1571A" opacity="0.8" />
      <ellipse cx="160" cy="274" rx="54" ry="9" fill="#000000" opacity="0.18" />
      <rect x="140" y="210" width="16" height="56" rx="8" fill="#1B2D3E" />
      <rect x="166" y="210" width="16" height="56" rx="8" fill="#1B2D3E" />
      <rect x="132" y="260" width="30" height="13" rx="6.5" fill="#0D1B2A" />
      <rect x="162" y="260" width="30" height="13" rx="6.5" fill="#0D1B2A" />
      <rect x="152" y="130" width="16" height="16" fill="#E0A97E" />
      <rect x="128" y="140" width="64" height="80" rx="22" fill="#01696F" />
      <rect x="126.5" y="92" width="15" height="60" rx="7.5" fill="#01696F" transform="rotate(-32 134 150)" />
      <rect x="178.5" y="92" width="15" height="60" rx="7.5" fill="#01696F" transform="rotate(32 186 150)" />
      <circle cx="103" cy="101" r="9.5" fill="#E8B48D" />
      <circle cx="217" cy="101" r="9.5" fill="#E8B48D" />
      <path d="M144 150 L158 176" stroke="#D19900" strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M176 150 L162 176" stroke="#D19900" strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <rect x="147" y="174" width="27" height="19" rx="4" fill="#FAF6EE" stroke="#0D1B2A" strokeWidth={1.5} />
      <text x="160.5" y="187.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0D1B2A">PM</text>
      <circle cx="160" cy="112" r="30" fill="#E8B48D" />
      <path d="M130 110 a30 30 0 0 1 60 0 q-8 -10 -30 -10 q-22 0 -30 10 z" fill="#3A2A22" />
      <path d="M147 111 q5 -6 10 0" stroke="#1A1A1A" strokeWidth={3} strokeLinecap="round" fill="none" />
      <path d="M163 111 q5 -6 10 0" stroke="#1A1A1A" strokeWidth={3} strokeLinecap="round" fill="none" />
      <path d="M149 122 q11 11 22 0" stroke="#1A1A1A" strokeWidth={3} strokeLinecap="round" fill="none" />
      <circle cx="140" cy="121" r="5" fill="#D1571A" opacity="0.22" />
      <circle cx="180" cy="121" r="5" fill="#D1571A" opacity="0.22" />
    </svg>
  );
}
