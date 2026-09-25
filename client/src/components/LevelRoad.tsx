/**
 * The road to SES — a board-game view of the career levels.
 *
 * One space per 100 XP, which is about one lesson, so the distance on the
 * board is honest: SES at 5,000 XP is fifty spaces from the start, and the
 * gap between the top two rungs really is longer than between the first two.
 * Titles come from the learner's ladder (GS scale or industry titles). Spaces
 * behind you are filled in candy colours, spaces ahead are empty outlines,
 * and each career level is a landmark on the road.
 *
 * Drawn as one SVG so it scales to any width. Read bottom to top, like
 * climbing a ladder, and it opens scrolled to where you are standing.
 */

import { useEffect, useMemo, useRef } from 'react';
import { Check, Lock } from 'lucide-react';
import { LEVELS, getLevel, ladderFor } from '@/lib/progress';
import { Sheet } from '@/components/mobile/Sheet';

const XP_PER_SPACE = 100;
const LAST_SPACE = LEVELS[LEVELS.length - 1].threshold / XP_PER_SPACE; // 50

// Board geometry, in SVG units. The viewBox scales to the sheet's width.
const W = 340;
const COLS = 6;
// Wide enough that the half-circle turns (radius DY/2 plus half the road)
// stay inside the board instead of being clipped at the edges.
const PAD_X = 62;
const DX = (W - PAD_X * 2) / (COLS - 1);
const DY = 78;
const TOP = 64;          // room above the last row for the SES crown
const BOTTOM = 54;       // room below the first row for the Start label
const ROWS = Math.ceil((LAST_SPACE + 1) / COLS);
const H = TOP + (ROWS - 1) * DY + BOTTOM;
const ROAD = 34;

const CANDY = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

function spacePos(k: number) {
  const row = Math.floor(k / COLS);
  const idx = k % COLS;
  const col = row % 2 === 0 ? idx : COLS - 1 - idx;
  return { x: PAD_X + col * DX, y: H - BOTTOM - row * DY, col, row };
}

/** Road path through spaces 0..last, turning at row ends with a half circle. */
function roadPath(last: number): string {
  const p0 = spacePos(0);
  let d = `M ${p0.x} ${p0.y}`;
  for (let k = 1; k <= last; k++) {
    const p = spacePos(k);
    if (k % COLS === 0) {
      // New row: arc outward on whichever side the previous row ended.
      const sweep = p.col === COLS - 1 ? 0 : 1;
      d += ` A ${DY / 2} ${DY / 2} 0 0 ${sweep} ${p.x} ${p.y}`;
    } else {
      d += ` L ${p.x} ${p.y}`;
    }
  }
  return d;
}

export function LevelRoad({ xp, track }: { xp: number; track?: string | null }) {
  // Every ladder shares thresholds, so geometry is the same; only names differ.
  const ladder = ladderFor(track);
  const here = Math.min(LAST_SPACE, Math.floor(Math.max(0, xp) / XP_PER_SPACE));
  const tokenRef = useRef<SVGGElement>(null);
  const landmarks = useMemo(
    () => new Map(ladder.map(l => [l.threshold / XP_PER_SPACE, l])),
    [ladder],
  );

  // Open with the learner's own space in view rather than at the start line.
  useEffect(() => {
    tokenRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  const current = getLevel(xp, track);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label={`Career road: you are on space ${here} of ${LAST_SPACE}, level ${current.level}, ${current.title}.`}
      data-testid="level-road"
    >
      {/* The road itself, then the stretch already travelled, then lane markings. */}
      <path d={roadPath(LAST_SPACE)} fill="none" strokeWidth={ROAD} strokeLinecap="round" strokeLinejoin="round"
        style={{ stroke: 'var(--acq-surface-sunken)' }} />
      {here > 0 && (
        <path d={roadPath(here)} fill="none" strokeWidth={ROAD} strokeLinecap="round" strokeLinejoin="round"
          style={{ stroke: 'var(--acq-teal)', strokeOpacity: 0.16 }} />
      )}
      <path d={roadPath(LAST_SPACE)} fill="none" strokeWidth={2} strokeDasharray="2 9" strokeLinecap="round"
        style={{ stroke: 'var(--acq-border-default)' }} />

      {/* Ordinary spaces. */}
      {Array.from({ length: LAST_SPACE + 1 }, (_, k) => {
        if (landmarks.has(k)) return null;
        const { x, y } = spacePos(k);
        const colour = CANDY[k % CANDY.length];
        const done = k < here;
        return (
          <circle
            key={k}
            cx={x} cy={y} r={11}
            strokeWidth={done ? 0 : 2.5}
            style={{
              fill: done ? colour : 'var(--acq-surface-card)',
              stroke: colour,
              strokeOpacity: done ? 1 : 0.5,
            }}
          />
        );
      })}

      {/* Career landmarks. */}
      {ladder.map(l => {
        const k = l.threshold / XP_PER_SPACE;
        const { x, y, col } = spacePos(k);
        const reached = xp >= l.threshold;
        const isTop = k === LAST_SPACE;
        const isStart = k === 0;
        // Labels sit below their landmark; edge columns are nudged inward so a
        // label never runs into the road's turn.
        const lx = col === 0 ? x + 8 : col === COLS - 1 ? x - 8 : x;
        return (
          <g key={l.level}>
            <circle cx={x} cy={y} r={isTop ? 23 : 19}
              strokeWidth={3}
              style={{
                fill: reached ? (isTop ? '#F5C842' : 'var(--acq-teal)') : 'var(--acq-surface-card)',
                stroke: reached ? '#fff' : 'var(--acq-border-default)',
              }}
            />
            <text x={x} y={y + (isTop ? 7 : 5)} textAnchor="middle"
              fontSize={isTop ? 20 : 14} fontWeight={900}
              style={{ fill: reached ? (isTop ? '#5C4300' : '#fff') : 'var(--acq-text-faint)' }}>
              {isTop ? '👑' : l.level}
            </text>
            <text x={isTop ? x : lx} y={isTop ? y - 32 : y + (isStart ? 36 : 34)} textAnchor="middle"
              fontSize={11} fontWeight={800} letterSpacing={0.4}
              style={{ fill: reached ? 'var(--acq-text-heading)' : 'var(--acq-text-muted)' }}>
              {l.short}
            </text>
          </g>
        );
      })}

      {/* You. */}
      {(() => {
        const { x, y } = spacePos(here);
        return (
          <g ref={tokenRef} data-testid="level-road-you">
            <circle cx={x} cy={y} r={17} style={{ fill: 'var(--acq-teal)', opacity: 0.25 }}>
              <animate attributeName="r" values="17;25;17" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r={16} strokeWidth={3} style={{ fill: 'var(--acq-teal)', stroke: '#fff' }} />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={900} fill="#fff" letterSpacing={0.3}>
              YOU
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

export function LevelRoadSheet({ xp, track, onClose }: { xp: number; track?: string | null; onClose: () => void }) {
  const ladder = ladderFor(track);
  const top = ladder[ladder.length - 1];
  const current = getLevel(xp, track);
  const next = ladder.find(l => l.threshold > xp);
  const floor = current.threshold;
  const pct = next ? Math.round(((xp - floor) / (next.threshold - floor)) * 100) : 100;

  return (
    <Sheet
      title={<><span aria-hidden="true">🛣️</span> Your road to {top.short}</>}
      label={`Your road to ${top.short}`}
      subtitle="Each space is 100 XP, about one lesson"
      onClose={onClose}
      testId="level-road-sheet"
    >
      <div className="px-4 pt-4">
        <div className="rounded-2xl p-4 text-white" style={{ background: 'var(--acq-gradient-hero)' }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">Level {current.level}</div>
          <div className="text-lg font-extrabold leading-tight">{current.title}</div>
          <p className="mt-1 text-[13px] leading-snug text-white/75">{current.desc}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--acq-cyan)' }} />
          </div>
          <div className="acq-tnum mt-1.5 text-xs opacity-80">
            {next
              ? `${xp.toLocaleString()} XP · ${(next.threshold - xp).toLocaleString()} to ${next.title}`
              : `${xp.toLocaleString()} XP · top of the ladder`}
          </div>
        </div>
      </div>

      <div className="px-2 py-3">
        <LevelRoad xp={xp} track={track} />
      </div>

      <ol className="space-y-1 px-4 pb-5">
        {[...ladder].reverse().map(l => {
          const reached = xp >= l.threshold;
          const isCurrent = l.level === current.level;
          return (
            <li
              key={l.level}
              className="flex items-center gap-3 rounded-xl px-3 py-2"
              style={isCurrent ? { background: 'var(--acq-surface-brand-wash)' } : undefined}
            >
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                style={reached
                  ? { background: 'var(--acq-teal)', color: '#fff' }
                  : { background: 'var(--acq-surface-muted)', color: 'var(--acq-text-faint)' }}
              >
                {reached ? (isCurrent ? l.level : <Check className="h-3.5 w-3.5" />) : <Lock className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold" style={{ color: reached ? 'var(--acq-text-heading)' : 'var(--acq-text-muted)' }}>
                {l.title}
                {isCurrent && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--acq-text-brand)' }}>You are here</span>}
              </span>
              <span className="acq-tnum text-xs" style={{ color: 'var(--acq-text-muted)' }}>{l.threshold.toLocaleString()} XP</span>
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}
