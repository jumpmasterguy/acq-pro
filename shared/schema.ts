import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
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
