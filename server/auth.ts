import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { type Express } from "express";
import { storage } from "./storage";
import { type User } from "@shared/schema";

const MemoryStoreSession = MemoryStore(session);

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
  // Trust Railway's reverse proxy so secure cookies work over HTTPS
  app.set("trust proxy", 1);

  // Always use MemoryStore for sessions — reliable, no external dependency
  // Sessions are 30 days, so users stay logged in across normal usage
  // Only lost on a server restart (which is rare with Railway)
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  console.log("[session] Using MemoryStore for sessions");

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "acqpro-secret-key-change-in-prod-2024",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        proxy: true,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy — authenticate by email
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
