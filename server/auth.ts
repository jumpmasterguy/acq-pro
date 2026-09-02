import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { type Express } from "express";
import { storage } from "./storage";
import { type User } from "@shared/schema";

const PgSession = ConnectPgSimple(session);

// Idle timeout: how long an authenticated session can go without a request
// before it's force-ended (see the middleware below). Separate from the
// cookie's 30-day maxAge, which just caps how long a session can exist at
// all — that's refreshed on every request (`rolling: true`) and doesn't
// care about inactivity. This is the actual "walked away and left it
// logged in" security control.
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Type augmentation for session data — loginAt is stamped once at login
// (used to compute a session's duration when it ends, for loginHistory);
// lastActivityAt is bumped on every authenticated request and is what the
// idle-timeout middleware below checks against.
declare module "express-session" {
  interface SessionData {
    loginAt?: string;
    lastActivityAt?: number;
  }
}

// Type augmentation for req.user
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      subscriptionStatus: string;
      stripeCustomerId: string | null;
      subscriptionId: string | null;
      completedLessons: string[];
      quizScores: Record<string, number>;
      moduleSkillLevels: Record<string, string>;
      moduleAssessmentScores: Record<string, number>;
      userProfile: Record<string, any> | null;
      isAdmin: boolean;
      currentStreak: number;
      longestStreak: number;
      lastChallengeDate: string | null;
      lastStreakDate: string | null;
      dailyChallengeXP: number;
    }
  }
}

// Create the session table if it doesn't exist — runs once at startup
async function ensureSessionTable(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    console.log("[session] Session table ready");
  } catch (err: any) {
    console.error("[session] Failed to create session table:", err.message);
  }
}

export async function setupAuth(app: Express): Promise<void> {
  // Trust Railway's reverse proxy — required for secure cookies over HTTPS
  app.set("trust proxy", 1);

  // ── Session store ──────────────────────────────────────────────────────────
  let store: session.Store;

  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    // Ensure table exists BEFORE the store is used
    await ensureSessionTable(pool);

    store = new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: false, // we already created it above
      ttl: 30 * 24 * 60 * 60,       // 30 days in seconds
      pruneSessionInterval: 60 * 60, // prune expired rows every hour
    });

    console.log("[session] Using PostgreSQL session store");
  } else {
    const MemoryStore = require("memorystore")(session);
    store = new MemoryStore({ checkPeriod: 86400000 });
    console.log("[session] No DATABASE_URL — using MemoryStore (local dev)");
  }

  // ── Session middleware ─────────────────────────────────────────────────────
  app.use(
    session({
      secret: (() => {
        const s = process.env.SESSION_SECRET;
        if (!s) {
          if (process.env.NODE_ENV === 'production') {
            console.error('[SECURITY] SESSION_SECRET env var is not set — using insecure fallback. Set this in Railway immediately.');
          }
          return 'acqpro-dev-secret-not-for-production';
        }
        return s;
      })(),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: true,      // always true — Railway + Cloudflare always serve HTTPS
        httpOnly: true,
        sameSite: "none",  // required for Google OAuth cross-origin redirect to set cookie
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ── Idle timeout — auto sign-out after IDLE_TIMEOUT_MS of inactivity ──────
  // Runs before every route. On an authenticated request, if it's been too
  // long since the last one, the session is force-ended right here: logged
  // out, destroyed, and (if we know when it started) recorded to
  // loginHistory as an 'idle_timeout' close before responding 401. A normal
  // request just bumps lastActivityAt and moves on — this never fires for
  // someone actively using the app, only for a session nobody's touched in
  // 30+ minutes (heartbeat included, so an open-but-idle tab still times out).
  app.use((req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) return next();
    const now = Date.now();
    const last = req.session.lastActivityAt;
    if (last && now - last > IDLE_TIMEOUT_MS) {
      const userId = req.user!.id;
      const loginAt = req.session.loginAt;
      return req.logout(() => {
        req.session.destroy(() => {
          res.clearCookie("connect.sid");
          if (loginAt) {
            storage.recordLoginEnd(userId, loginAt, 'idle_timeout').catch((e) => {
              console.error('[idle-timeout] recordLoginEnd failed:', e.message);
            });
          }
          res.status(401).json({ message: "Signed out due to inactivity", idleTimeout: true });
        });
      });
    }
    req.session.lastActivityAt = now;
    next();
  });

  // ── Passport local strategy — authenticate by email ───────────────────────
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const match = await bcrypt.compare(password, user.passwordHash);
          if (!match) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, toPassportUser(user));
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // ── Google OAuth strategy ──────────────────────────────────────────────────
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || "http://localhost:5000";

  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: `${appUrl}/api/auth/google/callback`,
          scope: ["profile", "email"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(null, false);
            }
            // Use email as username to guarantee uniqueness; displayName stored separately if needed
            const username = email;
            const user = await storage.upsertGoogleUser({
              googleId: profile.id,
              email,
              username,
            });
            return done(null, toPassportUser(user));
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
    console.log("[auth] Google OAuth strategy registered");
  } else {
    console.warn("[auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled");
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      done(null, toPassportUser(user));
    } catch (err) {
      done(err);
    }
  });
}

export function toPassportUser(user: User): Express.User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
    stripeCustomerId: user.stripeCustomerId,
    subscriptionId: user.subscriptionId,
    completedLessons: user.completedLessons ?? [],
    quizScores: (user.quizScores as Record<string, number>) ?? {},
    moduleSkillLevels: (user.moduleSkillLevels as Record<string, string>) ?? {},
    moduleAssessmentScores: (user.moduleAssessmentScores as Record<string, number>) ?? {},
    userProfile: (user.userProfile as Record<string, any>) ?? null,
    isAdmin: Boolean(user.isAdmin),
    // Bug fix (2026-08-31): these four were missing here, which meant every
    // request's req.user was silently stripped of them. Two visible symptoms:
    // (1) GET /api/daily-challenge computed `alreadyCompleted` off
    //     req.user.lastChallengeDate, which was always undefined -> the
    //     challenge always looked un-done, so it could be retaken all day.
    // (2) The client never received the XP the Daily Challenge actually
    //     earned server-side, so it never showed up in the user's total.
    currentStreak: user.currentStreak ?? 0,
    longestStreak: user.longestStreak ?? 0,
    lastChallengeDate: user.lastChallengeDate ?? null,
    // Same class of bug as the four fields above: without this, every
    // req.user is missing the one field getDisplayStreak() (server/storage.ts)
    // needs to tell a live streak from a lapsed one, so routes reading
    // req.user directly (GET /api/daily-challenge, /api/auth/me) would
    // always see it as undefined and report the streak as broken.
    lastStreakDate: user.lastStreakDate ?? null,
    dailyChallengeXP: ((user.challengeHistory as any[]) ?? []).reduce(
      (sum, entry) => sum + (entry?.xpEarned ?? 0),
      0
    ),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function requireAuth(
  req: any,
  res: any,
  next: () => void
) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Authentication required" });
}
