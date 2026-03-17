import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { type Express } from "express";
import { storage } from "./storage";
import { type User } from "@shared/schema";

const PgSession = ConnectPgSimple(session);

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
    }
  }
}

export function setupAuth(app: Express) {
  // Trust Railway's reverse proxy so cookies work over HTTPS
  app.set("trust proxy", 1);

  // ── Session store ──────────────────────────────────────────────────────────
  // Use PostgreSQL when DATABASE_URL is set (production) — sessions survive
  // restarts and deploys. Fall back to in-memory for local dev without a DB.
  let store: session.Store;

  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("railway") || process.env.DATABASE_URL.includes("postgres")
        ? { rejectUnauthorized: false }
        : false,
    });

    store = new PgSession({
      pool,
      tableName: "session",          // auto-created by connect-pg-simple
      createTableIfMissing: true,    // creates the table on first boot
      ttl: 30 * 24 * 60 * 60,       // 30 days in seconds
      pruneSessionInterval: 60 * 60, // prune expired rows every hour
    });

    console.log("[session] Using PostgreSQL session store");
  } else {
    // Local dev fallback — memorystore
    const MemoryStore = require("memorystore")(session);
    store = new MemoryStore({ checkPeriod: 86400000 });
    console.log("[session] No DATABASE_URL — using MemoryStore");
  }

  // ── Session middleware ─────────────────────────────────────────────────────
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "acqpro-secret-key-change-in-prod-2024",
      resave: false,
      saveUninitialized: false,
      rolling: true,            // reset cookie expiry on every request
      store,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

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
