// ─── XP: one formula, used by the app and the server ──────────────────────
//
// The number a learner sees is computed in the app; the leaderboards are
// computed on the server. If those two ever used different arithmetic, a
// learner could see 1,240 XP on their own screen and 310 next to their name
// on the board — which is exactly what the server's old `xp` column would
// have produced (it counts 10 per lesson for admin analytics; the app shows
// 100). So both sides call this file and nothing else.

export const XP_PER_LESSON = 100;

type ScoreMap = Record<string, number> | null | undefined;

/** The formula the app has always displayed. */
export function xpFromParts(
  completedCount: number,
  quizScores: ScoreMap,
  challengeXp: number,
  briefsXp: number,
): number {
  let xp = completedCount * XP_PER_LESSON;
  for (const score of Object.values(quizScores ?? {})) xp += Math.floor((Number(score) || 0) / 10);
  return xp + (challengeXp || 0) + (briefsXp || 0);
}

/** Sums `xpEarned` across challengeHistory / briefsRead style entries. */
export function sumEarned(entries: unknown): number {
  if (!Array.isArray(entries)) return 0;
  return entries.reduce((sum: number, e: any) => sum + (Number(e?.xpEarned) || 0), 0);
}

export interface XpSource {
  completedLessons?: string[] | null;
  quizScores?: unknown;
  challengeHistory?: unknown;
  briefsRead?: unknown;
}

/** A user's XP exactly as the app displays it, from their stored record. */
export function computeUserXp(u: XpSource): number {
  return xpFromParts(
    (u.completedLessons ?? []).length,
    (u.quizScores as ScoreMap) ?? {},
    sumEarned(u.challengeHistory),
    sumEarned(u.briefsRead),
  );
}

// ─── Weeks ────────────────────────────────────────────────────────────────
// Leaderboard weeks run Monday 00:00 to Sunday 23:59 UTC — the same UTC
// calendar every other date in the app uses (streaks, the Daily Challenge).

/** Monday of the week containing `now`, as YYYY-MM-DD (UTC). */
export function weekStartOf(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

export interface WeekTracked extends XpSource {
  xpWeekOf?: string | null;
  xpWeekStartXp?: number | null;
}

/**
 * Fields to write alongside ANY change that adds XP, so the week's starting
 * point is recorded before the new XP lands. Empty when this week's starting
 * point is already recorded.
 *
 * Why at write time: the alternative, snapshotting on the app's heartbeat,
 * only fires after two minutes of use, so XP earned in a learner's first
 * minutes of the week would be counted as "before the week started".
 */
export function weekRollPatch(
  u: WeekTracked,
  now: Date = new Date(),
): { xpWeekOf: string; xpWeekStartXp: number } | Record<string, never> {
  const monday = weekStartOf(now);
  if (u.xpWeekOf === monday) return {};
  return { xpWeekOf: monday, xpWeekStartXp: computeUserXp(u) };
}

/**
 * XP earned since Monday. If the week's starting point was never recorded,
 * nothing has earned XP this week (every earning path records it first),
 * so the answer is zero.
 */
export function weeklyXp(u: WeekTracked, now: Date = new Date()): number {
  if (u.xpWeekOf !== weekStartOf(now)) return 0;
  return Math.max(0, computeUserXp(u) - (u.xpWeekStartXp ?? 0));
}
