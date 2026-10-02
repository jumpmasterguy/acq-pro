// Leaderboard API shapes, shared by server/leaderboard.ts and the app.
// GET /api/leaderboard returns a LeaderboardResponse.

export type BoardId = "week" | "streak" | "quiz";

export interface BoardEntry {
  rank: number;
  name: string;
  value: number;
  isYou: boolean;
}

export interface Board {
  id: BoardId;
  top: BoardEntry[];
  /** The viewer's own standing, even when outside the top list. */
  you: { rank: number; value: number } | null;
  participants: number;
}

export interface LeaderboardResponse {
  weekStart: string;
  /** When this week's boards reset, ISO. */
  resetsAt: string;
  hidden: boolean;
  /** Viewer is an admin/test account, which is never ranked. */
  internal: boolean;
  boards: Record<BoardId, Board>;
}

