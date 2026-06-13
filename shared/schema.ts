import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),  // null for Google OAuth users
  googleId: text("google_id").unique(),  // null for local-auth users
  // Stripe
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").notNull().default("free"), // 'free' | 'active' | 'lifetime'
  subscriptionId: text("subscription_id"),
  // Progress
  completedLessons: text("completed_lessons").array().notNull().default(sql`ARRAY[]::text[]`),
  quizScores: jsonb("quiz_scores").notNull().default(sql`'{}'::jsonb`),
  // Skill levels per module: { moduleId: 'novice' | 'intermediate' | 'advanced' }
  moduleSkillLevels: jsonb("module_skill_levels").notNull().default(sql`'{}'::jsonb`),
  // Module gate assessment scores: { moduleId: number (0-100) }
  moduleAssessmentScores: jsonb("module_assessment_scores").notNull().default(sql`'{}'::jsonb`),
  // Onboarding / learning path profile
  // { role, experience, goal, completedOnboarding }
  userProfile: jsonb("user_profile").default(sql`'{}'::jsonb`),
  // Analytics / engagement tracking
  lastLoginAt: text("last_login_at"),         // ISO timestamp string
  lastActiveAt: text("last_active_at"),        // ISO timestamp string (last heartbeat)
  loginCount: integer("login_count").notNull().default(0),
  totalMinutesActive: integer("total_minutes_active").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  // Streak tracking
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStreakDate: text("last_streak_date"),  // YYYY-MM-DD of last activity
  // Daily challenge tracking
  lastChallengeDate: text("last_challenge_date"), // YYYY-MM-DD of last completed challenge
  challengeHistory: jsonb("challenge_history").notNull().default(sql`'[]'::jsonb`), // [{date, score, xpEarned}]
  // Email drip tracking
  registeredAt: text("registered_at").notNull().default(sql`now()::text`),
  sentEmailDays: jsonb("sent_email_days").notNull().default(sql`'[]'::jsonb`), // number[]
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
});

export const insertGoogleUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  googleId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGoogleUser = z.infer<typeof insertGoogleUserSchema>;
export type User = typeof users.$inferSelect;

// Registration schema (used in auth routes)
export const registerSchema = z.object({
  username: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Onboarding profile
export const userProfileSchema = z.object({
  role: z.enum(['dod_employee', 'dod_contractor', 'career_changer', 'student']),
  experience: z.enum(['new', 'some', 'experienced']),
  goal: z.enum(['contracts_finance', 'bd_capture', 'program_management', 'full_picture']),
  completedOnboarding: z.boolean().default(true),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// ── Email leads (landing page opt-in) ─────────────────────────────────────
export const emailLeads = pgTable("email_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  source: text("source").default("landing_page"),   // landing_page | exit_intent
  createdAt: text("created_at").notNull().default(sql`now()::text`),
});

export const insertLeadSchema = createInsertSchema(emailLeads).pick({ email: true, source: true });
export type Lead = typeof emailLeads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// ── Template pack purchases ────────────────────────────────────────────────────
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),            // null if bought without account (email-only)
  email: text("email").notNull(),
  pack: text("pack").notNull(),           // 'pm-essentials' | 'proposal-toolkit' | 'finance-cheat-sheets'
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntent: text("stripe_payment_intent"),
  amountPaid: integer("amount_paid").notNull(), // in cents
  downloadToken: text("download_token").notNull(), // secure random token for download links
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
});

export type Purchase = typeof purchases.$inferSelect;
