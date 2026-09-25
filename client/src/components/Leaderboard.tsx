/**
 * Leaderboards — "Burn rate champions" and friends.
 *
 * LeaderboardCard     the home-screen teaser: this week's top three and
 *                     where you stand. Opens the sheet.
 * LeaderboardSheet    all three boards: this week's XP, live streaks, and
 *                     Daily Challenge answers right this week.
 * LeaderboardVisibilityRow
 *                     the "show me on leaderboards" switch for Account.
 *
 * Everything is computed server-side (server/leaderboard.ts) with the same
 * XP formula the app displays (shared/xp.ts), so a learner's number on the
 * board is always the number on their own screen.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronRight, EyeOff, Trophy } from 'lucide-react';
import type { Board, BoardEntry, BoardId, LeaderboardResponse } from '@shared/leaderboard';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Sheet } from '@/components/mobile/Sheet';
import { Switch } from '@/components/ui/switch';

const QUERY_KEY = ['/api/leaderboard'];

/** A response that isn't shaped like a leaderboard is an error, not data:
 *  the home card must never crash the home screen over it. */
function isLeaderboard(d: any): d is LeaderboardResponse {
  return !!d && typeof d === 'object' && !!d.boards
    && (['week', 'streak', 'quiz'] as const).every(k => Array.isArray(d.boards[k]?.top));
}

export function useLeaderboard(enabled = true) {
  return useQuery<LeaderboardResponse>({
    queryKey: QUERY_KEY,
    enabled,
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/leaderboard');
      const body = await res.json();
      if (!isLeaderboard(body)) throw new Error('Unexpected leaderboard response');
      return body;
    },
    // Boards move slowly (weekly), but your own number should update when
    // you come back from a lesson, so refetch on mount once a minute old.
    staleTime: 60_000,
    refetchOnMount: true,
  });
}

function useSetHidden() {
  return useMutation({
    mutationFn: async (hidden: boolean) => {
      const res = await apiRequest('POST', '/api/leaderboard/visibility', { hidden });
      return (await res.json()) as { hidden: boolean };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

// ─── Presentation ───────────────────────────────────────────────────────────

const BOARD_META: Record<BoardId, {
  tab: string;
  emoji: string;
  title: string;
  blurb: string;
  value: (v: number) => string;
  empty: string;
}> = {
  week: {
    tab: 'This week',
    emoji: '🔥',
    title: 'Burn rate champions',
    blurb: 'XP earned since Monday',
    value: v => `${v.toLocaleString()} XP`,
    empty: "No one has earned XP yet this week. Finish a lesson and first place is yours.",
  },
  streak: {
    tab: 'Streaks',
    emoji: '📅',
    title: 'Streak leaders',
    blurb: 'Days in a row with a lesson, quiz, challenge or brief',
    value: v => `${v} day${v === 1 ? '' : 's'}`,
    empty: 'No live streaks right now. One lesson today starts yours.',
  },
  quiz: {
    tab: 'Quiz',
    emoji: '⚡',
    title: 'Quiz champions',
    blurb: 'Daily Challenge answers right this week',
    value: v => `${v} correct`,
    empty: "No one has played the Daily Challenge this week yet.",
  },
};

const MEDAL: Record<number, { bg: string; fg: string }> = {
  1: { bg: '#F5C842', fg: '#5C4300' },
  2: { bg: '#CBD5E1', fg: '#334155' },
  3: { bg: '#E3A77A', fg: '#5B2E0E' },
};

function RankBadge({ rank, size = 28 }: { rank: number; size?: number }) {
  const medal = MEDAL[rank];
  return (
    <span
      className="acq-tnum flex flex-shrink-0 items-center justify-center rounded-full font-black"
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: medal?.bg ?? 'var(--acq-surface-muted)',
        color: medal?.fg ?? 'var(--acq-text-muted)',
      }}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}

function resetsIn(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (!(ms > 0)) return 'Resets soon';
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  return d >= 1 ? `Resets in ${d}d ${h % 24}h` : `Resets in ${Math.max(1, h)}h`;
}

function Row({ e, board }: { e: BoardEntry; board: BoardId }) {
  return (
    <li
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={e.isYou ? { background: 'var(--acq-surface-brand-wash)', boxShadow: 'inset 0 0 0 1.5px var(--acq-teal)' } : undefined}
      data-testid={e.isYou ? 'leaderboard-you' : undefined}
    >
      <RankBadge rank={e.rank} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold" style={{ color: 'var(--acq-text-heading)' }}>
        {e.name}
        {e.isYou && (
          <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: 'var(--acq-teal)' }}>
            You
          </span>
        )}
      </span>
      <span className="acq-tnum text-sm font-bold" style={{ color: 'var(--acq-text-body)' }}>
        {BOARD_META[board].value(e.value)}
      </span>
    </li>
  );
}

function BoardList({ board, data }: { board: Board; data: LeaderboardResponse }) {
  const meta = BOARD_META[board.id];
  const youOutsideTop = board.you && !board.top.some(e => e.isYou);

  return (
    <div className="px-4 pb-4 pt-3">
      <p className="mb-3 px-1 text-xs" style={{ color: 'var(--acq-text-muted)' }}>{meta.blurb}</p>

      {data.hidden && (
        <Notice icon={<EyeOff className="h-4 w-4" />}>
          You're hidden from the leaderboards, so you're not ranked. Switch it back on below.
        </Notice>
      )}
      {data.internal && !data.hidden && (
        <Notice>Admin and test accounts aren't ranked, so real learners always top the board.</Notice>
      )}

      {board.top.length === 0 ? (
        <div className="rounded-xl px-4 py-8 text-center" style={{ background: 'var(--acq-surface-sunken)' }}>
          <div className="text-3xl" aria-hidden="true">{meta.emoji}</div>
          <p className="mt-2 text-sm" style={{ color: 'var(--acq-text-muted)' }}>{meta.empty}</p>
        </div>
      ) : (
        <ol className="space-y-1">
          {board.top.map((e, i) => <Row key={`${e.rank}-${e.name}-${i}`} e={e} board={board.id} />)}
          {youOutsideTop && (
            <>
              <li className="py-1 text-center text-xs tracking-[0.3em]" style={{ color: 'var(--acq-text-faint)' }} aria-hidden="true">•••</li>
              <Row e={{ rank: board.you!.rank, name: 'You', value: board.you!.value, isYou: true }} board={board.id} />
            </>
          )}
        </ol>
      )}

      {!data.hidden && !data.internal && board.top.length > 0 && !board.you && (
        <p className="mt-3 px-1 text-center text-xs" style={{ color: 'var(--acq-text-muted)' }}>
          {board.id === 'week' && 'Earn any XP this week and you are on the board.'}
          {board.id === 'streak' && 'Do one lesson today to start a streak and join the board.'}
          {board.id === 'quiz' && 'Play today’s Daily Challenge to join this board.'}
        </p>
      )}
      {board.participants > 0 && board.participants < 5 && (
        <p className="mt-3 px-1 text-center text-[11px]" style={{ color: 'var(--acq-text-faint)' }}>
          Early days: the board fills up as more learners join.
        </p>
      )}
    </div>
  );
}

function Notice({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ background: 'var(--acq-surface-sunken)', color: 'var(--acq-text-secondary)' }}>
      {icon && <span className="mt-px flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

// ─── Sheet ──────────────────────────────────────────────────────────────────

export function LeaderboardSheet({ onClose, initial = 'week' }: { onClose: () => void; initial?: BoardId }) {
  const [tab, setTab] = useState<BoardId>(initial);
  const { data, isLoading, isError, refetch } = useLeaderboard();
  const setHidden = useSetHidden();

  return (
    <Sheet
      title={<><span aria-hidden="true">🏆</span> Leaderboards</>}
      label="Leaderboards"
      subtitle={data ? `${resetsIn(data.resetsAt)} · Monday 00:00 UTC` : 'Weekly boards'}
      onClose={onClose}
      testId="leaderboard-sheet"
      footer={data && !data.internal ? (
        <label className="flex items-center gap-3">
          <span className="min-w-0 flex-1 text-xs" style={{ color: 'var(--acq-text-muted)' }}>
            Show me on leaderboards <span style={{ color: 'var(--acq-text-faint)' }}>· first name and last initial only</span>
          </span>
          <Switch
            checked={!data.hidden}
            disabled={setHidden.isPending}
            onCheckedChange={on => setHidden.mutate(!on)}
            data-testid="leaderboard-visibility"
          />
        </label>
      ) : undefined}
    >
      <div className="sticky top-0 z-10 px-4 pt-3" style={{ background: 'var(--acq-surface-card)' }}>
        <div className="grid grid-cols-3 gap-1 rounded-xl p-1" style={{ background: 'var(--acq-surface-muted)' }} role="tablist">
          {(Object.keys(BOARD_META) as BoardId[]).map(id => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className="rounded-lg py-2 text-[13px] font-semibold transition-colors"
              style={tab === id
                ? { background: 'var(--acq-surface-card)', color: 'var(--acq-text-heading)', boxShadow: 'var(--acq-shadow-sm)' }
                : { color: 'var(--acq-text-muted)' }}
              data-testid={`leaderboard-tab-${id}`}
            >
              {BOARD_META[id].tab}
            </button>
          ))}
        </div>
        <h3 className="px-1 pt-3 text-[15px] font-bold" style={{ color: 'var(--acq-text-heading)' }}>
          <span aria-hidden="true">{BOARD_META[tab].emoji}</span> {BOARD_META[tab].title}
        </h3>
      </div>

      {isLoading && <ListSkeleton />}
      {isError && (
        <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--acq-text-muted)' }}>
          Couldn't load the leaderboards.{' '}
          <button type="button" className="font-semibold underline" onClick={() => refetch()}>Try again</button>
        </div>
      )}
      {data && <BoardList board={data.boards[tab]} data={data} />}
    </Sheet>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2 px-4 py-4" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="h-11 animate-pulse rounded-xl" style={{ background: 'var(--acq-surface-muted)' }} />
      ))}
    </div>
  );
}

// ─── Home card ──────────────────────────────────────────────────────────────

export function LeaderboardCard() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useLeaderboard();
  // A failed teaser should never break the home screen: just leave it out.
  if (isError) return null;

  const week = data?.boards.week;
  const podium = week?.top.slice(0, 3) ?? [];

  let youLine: string;
  if (!data) youLine = '';
  else if (data.internal) youLine = 'Admin accounts aren’t ranked';
  else if (data.hidden) youLine = 'You’re hidden from the boards';
  else if (week?.you) youLine = `You: #${week.you.rank} of ${week.participants} · ${week.you.value.toLocaleString()} XP`;
  else youLine = 'Earn XP this week to get on the board';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="acq-press w-full rounded-2xl p-4 text-left"
        style={{
          background: 'var(--acq-surface-card)',
          border: '1px solid var(--acq-border-subtle)',
          boxShadow: 'var(--acq-shadow-sm)',
        }}
        data-testid="home-leaderboard"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--acq-surface-gold-wash)', color: 'var(--acq-text-gold)' }}
          >
            <Trophy className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold" style={{ color: 'var(--acq-text-heading)' }}>
              Burn rate champions
            </span>
            <span className="mt-0.5 block text-xs" style={{ color: 'var(--acq-text-muted)' }}>
              {data ? `Most XP this week · ${resetsIn(data.resetsAt).toLowerCase()}` : 'Most XP this week'}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--acq-text-faint)' }} />
        </div>

        {isLoading ? (
          <div className="mt-3 space-y-1.5" aria-hidden="true">
            {[0, 1, 2].map(i => <div key={i} className="h-7 animate-pulse rounded-lg" style={{ background: 'var(--acq-surface-muted)' }} />)}
          </div>
        ) : podium.length > 0 ? (
          <ol className="mt-3 space-y-1.5">
            {podium.map((e, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <RankBadge rank={e.rank} size={24} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" style={{ color: e.isYou ? 'var(--acq-text-brand)' : 'var(--acq-text-heading)' }}>
                  {e.isYou ? `${e.name} (you)` : e.name}
                </span>
                <span className="acq-tnum text-[13px] font-bold" style={{ color: 'var(--acq-text-body)' }}>
                  {e.value.toLocaleString()} XP
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-[13px]" style={{ color: 'var(--acq-text-muted)' }}>
            No one's on the board yet this week. Finish a lesson and first place is yours.
          </p>
        )}

        {youLine && (
          <div
            className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: 'var(--acq-surface-sunken)', color: 'var(--acq-text-secondary)' }}
          >
            {youLine}
          </div>
        )}
      </button>
      {open && <LeaderboardSheet onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── Account setting ────────────────────────────────────────────────────────

export function LeaderboardVisibilityRow() {
  const { data } = useLeaderboard();
  const setHidden = useSetHidden();
  if (!data || data.internal) return null;
  return (
    <label className="flex items-center gap-3 py-1" data-testid="account-leaderboard-visibility">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold" style={{ color: 'var(--acq-text-heading)' }}>Show me on leaderboards</span>
        <span className="mt-0.5 block text-xs" style={{ color: 'var(--acq-text-muted)' }}>
          Shown as your first name and last initial. Never your email.
        </span>
      </span>
      <Switch checked={!data.hidden} disabled={setHidden.isPending} onCheckedChange={on => setHidden.mutate(!on)} />
    </label>
  );
}

// ─── Desktop dashboard row ──────────────────────────────────────────────────
// The desktop dashboard keeps streak and Daily Challenge as quiet rows so they
// don't compete with Continue; the leaderboard joins them the same way.

export function LeaderboardQuietRow() {
  const [open, setOpen] = useState(false);
  const { data, isError } = useLeaderboard();
  if (isError) return null;
  const week = data?.boards.week;
  const leader = week?.top[0];

  let detail = 'Most XP this week';
  if (data?.internal) detail = 'Admin accounts aren’t ranked';
  else if (data?.hidden) detail = 'You’re hidden from the boards';
  else if (week?.you) detail = `You’re #${week.you.rank} of ${week.participants} this week · ${week.you.value.toLocaleString()} XP`;
  else if (leader) detail = `${leader.name} leads with ${leader.value.toLocaleString()} XP · earn XP to join`;

  return (
    <>
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}
        data-testid="dashboard-leaderboard-row"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-sm">🏆</span>
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">Burn rate champions</span>
          <span className="text-muted-foreground"> · {detail}</span>
        </p>
        <span className="flex-shrink-0 text-muted-foreground">›</span>
      </div>
      {open && <LeaderboardSheet onClose={() => setOpen(false)} />}
    </>
  );
}
