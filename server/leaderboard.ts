// ─── Leaderboards ───────────────────────────────────────────────────────────
//
// Three weekly-flavoured boards, all computed from data already on the user
// record, so there is no extra write path to keep in sync:
//
//   week    Burn rate champions — XP earned since Monday 00:00 UTC.
//           Resets weekly, so a learner who joined yesterday can win.
//   streak  Streak leaders — current live streak (a lapsed streak is 0,
//           same rule the app uses).
//   quiz    Quiz champions — Daily Challenge answers right this week. Totals
//           rather than best score: everyone can hit 5/5 once, so "best"
//           would be a 40-way tie. Totals also reward showing up daily.
//
// Privacy: people appear as "First L." (never email, never full surname),
// and anyone can hide from every board in Account. Hidden learners are left
// out for everyone else, including their rank.

import { weeklyXp, weekStartOf } from "@shared/xp";
import { isInternalAccount } from "./internalAccounts";
import type { Board, BoardId, LeaderboardResponse } from "@shared/leaderboard";
export type { Board, BoardId, BoardEntry, LeaderboardResponse } from "@shared/leaderboard";

export interface LeaderboardRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  completedLessons: string[] | null;
  quizScores: unknown;
  challengeHistory: unknown;
  briefsRead: unknown;
  currentStreak: number | null;
  lastStreakDate: string | null;
  xpWeekOf: string | null;
  xpWeekStartXp: number | null;
  leaderboardHidden: boolean | null;
  /** Server-side only, for leaving out Lucas's own and test accounts. Never sent. */
  email: string | null;
  isAdmin: boolean | null;
}

const TOP_N = 10;

/** "Jane D." — or a neutral fallback for accounts with no first name. */
export function displayName(first: string | null, last: string | null): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (!f) return "Acqlerate learner";
  const cap = f.charAt(0).toUpperCase() + f.slice(1);
  return l ? `${cap} ${l.charAt(0).toUpperCase()}.` : cap;
}

/** Same rule as getDisplayStreak in storage.ts, with the clock injectable. */
export function liveStreak(current: number | null, lastDate: string | null, now: Date): number {
  if (!lastDate || !current) return 0;
  const today = now.toISOString().slice(0, 10);
  const y = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  return lastDate === today || lastDate === y ? current : 0;
}

/** Daily Challenge answers right since Monday; null if not played this week. */
export function quizPointsThisWeek(history: unknown, weekStart: string): number | null {
  if (!Array.isArray(history)) return null;
  const mine = history.filter((h: any) => typeof h?.date === "string" && h.date >= weekStart);
  if (mine.length === 0) return null;
  return mine.reduce((sum: number, h: any) => sum + (Number(h?.score) || 0), 0);
}

/** Standard competition ranking: 1, 2, 2, 4 — ties share a place. */
function buildBoard(
  id: BoardId,
  scored: { id: string; name: string; value: number }[],
  viewerId: string,
): Board {
  const sorted = [...scored].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  let rank = 0;
  let prev: number | null = null;
  const ranked = sorted.map((e, i) => {
    if (e.value !== prev) { rank = i + 1; prev = e.value; }
    return { rank, name: e.name, value: e.value, isYou: e.id === viewerId };
  });
  const mine = ranked.find(r => r.isYou);
  return {
    id,
    top: ranked.slice(0, TOP_N),
    you: mine ? { rank: mine.rank, value: mine.value } : null,
    participants: ranked.length,
  };
}

export function buildLeaderboards(rows: LeaderboardRow[], viewerId: string, now: Date = new Date()): LeaderboardResponse {
  const weekStart = weekStartOf(now);
  const resets = new Date(`${weekStart}T00:00:00.000Z`);
  resets.setUTCDate(resets.getUTCDate() + 7);

  const viewer = rows.find(r => r.id === viewerId);
  // Lucas's own and test accounts are "not users" everywhere else in the
  // product (analytics, investor exports), so they are not ranked either.
  const visible = rows.filter(r => !r.leaderboardHidden && !isInternalAccount(r));

  const week: { id: string; name: string; value: number }[] = [];
  const streak: typeof week = [];
  const quiz: typeof week = [];

  for (const r of visible) {
    const name = displayName(r.firstName, r.lastName);
    const w = weeklyXp(r as any, now);
    if (w > 0) week.push({ id: r.id, name, value: w });
    const s = liveStreak(r.currentStreak, r.lastStreakDate, now);
    if (s > 0) streak.push({ id: r.id, name, value: s });
    const q = quizPointsThisWeek(r.challengeHistory, weekStart);
    if (q !== null) quiz.push({ id: r.id, name, value: q });
  }

  return {
    weekStart,
    resetsAt: resets.toISOString(),
    hidden: !!viewer?.leaderboardHidden,
    internal: viewer ? isInternalAccount(viewer) : false,
    boards: {
      week: buildBoard("week", week, viewerId),
      streak: buildBoard("streak", streak, viewerId),
      quiz: buildBoard("quiz", quiz, viewerId),
    },
  };
}

