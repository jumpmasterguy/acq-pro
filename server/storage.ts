import { type User, type InsertUser, type InsertGoogleUser, users, emailLeads, type Lead } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

export type SkillLevel = 'novice' | 'intermediate' | 'advanced';

// ─── Interface ─────────────────────────────────────────────────────────────

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;
  createUser(user: InsertUser): Promise<User>;
  upsertGoogleUser(data: InsertGoogleUser & { avatarUrl?: string }): Promise<User>;
  saveUserProfile(userId: string, profile: Record<string, any>): Promise<User | undefined>;
  updateUserSubscription(
    userId: string,
    data: {
      subscriptionStatus?: string;
      stripeCustomerId?: string;
      subscriptionId?: string;
    }
  ): Promise<User | undefined>;
  updateUserProgress(
    userId: string,
    completedLessons: string[],
    quizScores: Record<string, number>
  ): Promise<User | undefined>;
  updateUserPassword(userId: string, passwordHash: string): Promise<User | undefined>;
  updateModuleSkillLevel(
    userId: string,
    moduleId: string,
    level: SkillLevel,
    assessmentScore: number
  ): Promise<User | undefined>;
  updateUserAnalytics(
    userId: string,
    data: {
      lastLoginAt?: string;
      lastActiveAt?: string;
      loginCount?: number;
      totalMinutesActive?: number;
      xp?: number;
    }
  ): Promise<User | undefined>;
  saveLead(email: string, source?: string): Promise<Lead>;
  getAllLeads(): Promise<Lead[]>;
  // Template pack purchases
  savePurchase(data: { userId?: string; email: string; pack: string; stripeSessionId: string; stripePaymentIntent: string; amountPaid: number; downloadToken: string; }): Promise<Purchase>;
  getPurchaseBySessionId(sessionId: string): Promise<Purchase | undefined>;
  getPurchaseByToken(token: string): Promise<Purchase | undefined>;
  incrementDownloadCount(purchaseId: string): Promise<void>;
  getUsersForDrip(): Promise<Array<{ id: string; email: string; username: string; registeredAt: string; sentEmailDays: number[] }>>;
  updateSentEmailDays(userId: string, days: number[]): Promise<void>;
}

// ─── Postgres Storage (production) ─────────────────────────────────────────

export class DrizzleStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor(databaseUrl: string) {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("railway") || databaseUrl.includes("postgres")
        ? { rejectUnauthorized: false }
        : false,
    });
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return this.db.select().from(users).orderBy(users.email);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, userId));
  }

  // Generate a unique referral code for a user (e.g. LUCAS42)
  generateReferralCode(username: string): string {
    const base = username.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const suffix = Math.floor(Math.random() * 900 + 100);
    return `${base}${suffix}`;
  }

  // Get user by referral code
  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const result = await this.db.select().from(users)
      .where(sql`UPPER(${users.referralCode}) = UPPER(${code})`);
    return result[0];
  }

  // Record a successful referral signup — increment referrer's count, check reward threshold
  async recordReferral(referralCode: string): Promise<{ rewarded: boolean; referrer: User | undefined }> {
    const referrer = await this.getUserByReferralCode(referralCode);
    if (!referrer) return { rewarded: false, referrer: undefined };

    const newCount = (referrer.referralCount ?? 0) + 1;
    const rewardsEarned = Math.floor(newCount / 2); // every 2 referrals = 1 reward
    const alreadyGranted = referrer.referralRewardGranted ?? 0;
    const shouldReward = rewardsEarned > alreadyGranted;

    const updates: any = { referralCount: newCount };
    if (shouldReward) {
      updates.referralRewardGranted = rewardsEarned;
      // Grant 1 year of pro access (set expiry date 1 year from now)
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      updates.subscriptionStatus = 'active';
      updates.subscriptionId = `referral_reward_${Date.now()}`;
    }

    await this.db.update(users).set(updates).where(eq(users.id, referrer.id));
    const updated = await this.getUser(referrer.id);
    return { rewarded: shouldReward, referrer: updated };
  }

  // Update arbitrary user fields (for internal use)
  async updateUserFields(userId: string, fields: Record<string, any>): Promise<void> {
    await this.db.update(users).set(fields as any).where(eq(users.id, userId));
  }

  // Admin: grant yearly pro to a user manually
  async grantYearlyPro(userId: string): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set({
        subscriptionStatus: 'active',
        subscriptionId: `yearly_pro_${Date.now()}`,
      } as any)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Find or create a user for Google OAuth — links by email if account already exists
  async upsertGoogleUser(data: InsertGoogleUser & { avatarUrl?: string }): Promise<User> {
    // First check by Google ID
    const byGoogleId = await this.getUserByGoogleId(data.googleId!);
    if (byGoogleId) return byGoogleId;

    // Then check by email — existing local-auth account, link Google ID
    const byEmail = await this.getUserByEmail(data.email);
    if (byEmail) {
      const linked = await this.db
        .update(users)
        .set({ googleId: data.googleId })
        .where(eq(users.id, byEmail.id))
        .returning();
      return linked[0];
    }

    // New user — create account (ON CONFLICT on username: link googleId to existing row)
    const id = randomUUID();
    const result = await this.db
      .insert(users)
      .values({
        id,
        username: data.username,
        email: data.email,
        googleId: data.googleId,
        passwordHash: null,
        stripeCustomerId: null,
        subscriptionStatus: "free",
        subscriptionId: null,
        completedLessons: [],
        quizScores: {},
        moduleSkillLevels: {},
        moduleAssessmentScores: {},
      })
      .onConflictDoUpdate({
        target: users.username,
        set: { googleId: data.googleId },
      })
      .returning();
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const result = await this.db
      .insert(users)
      .values({
        id,
        ...insertUser,
        stripeCustomerId: null,
        subscriptionStatus: "free",
        subscriptionId: null,
        completedLessons: [],
        quizScores: {},
        moduleSkillLevels: {},
        moduleAssessmentScores: {},
      })
      .returning();
    return result[0];
  }

  async updateUserSubscription(
    userId: string,
    data: {
      subscriptionStatus?: string;
      stripeCustomerId?: string;
      subscriptionId?: string;
    }
  ): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserProgress(
    userId: string,
    completedLessons: string[],
    quizScores: Record<string, number>
  ): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ completedLessons, quizScores })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateModuleSkillLevel(
    userId: string,
    moduleId: string,
    level: SkillLevel,
    assessmentScore: number
  ): Promise<User | undefined> {
    const current = await this.getUser(userId);
    if (!current) return undefined;
    const currentLevels = (current.moduleSkillLevels as Record<string, SkillLevel>) ?? {};
    const currentScores = (current.moduleAssessmentScores as Record<string, number>) ?? {};
    const updated = await this.db
      .update(users)
      .set({
        moduleSkillLevels: { ...currentLevels, [moduleId]: level },
        moduleAssessmentScores: { ...currentScores, [moduleId]: assessmentScore },
      })
      .where(eq(users.id, userId))
      .returning();
    return updated[0];
  }

  async updateUserAnalytics(
    userId: string,
    data: {
      lastLoginAt?: string;
      lastActiveAt?: string;
      loginCount?: number;
      totalMinutesActive?: number;
      xp?: number;
    }
  ): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }


  // Streak update — call whenever a user completes a lesson, quiz, or daily challenge
  async updateUserStreak(userId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDate = (user as any).lastStreakDate;
    let currentStreak = (user as any).currentStreak ?? 0;
    let longestStreak = (user as any).longestStreak ?? 0;
    if (lastDate === todayStr) return user;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (lastDate === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    const result = await this.db
      .update(users)
      .set({ currentStreak, longestStreak, lastStreakDate: todayStr } as any)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async completeDailyChallenge(userId: string, score: number, xpEarned: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const todayStr = new Date().toISOString().slice(0, 10);
    if ((user as any).lastChallengeDate === todayStr) return user;
    const history = ((user as any).challengeHistory ?? []) as any[];
    history.push({ date: todayStr, score, xpEarned });
    const newXp = (user.xp ?? 0) + xpEarned;
    const result = await this.db
      .update(users)
      .set({ lastChallengeDate: todayStr, challengeHistory: history, xp: newXp } as any)
      .where(eq(users.id, userId))
      .returning();
    await this.updateUserStreak(userId);
    return result[0];
  }

  async saveUserProfile(userId: string, profile: Record<string, any>): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ userProfile: profile })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async saveLead(email: string, source = 'landing_page'): Promise<Lead> {
    // Upsert — ignore duplicate emails
    const existing = await this.db.select().from(emailLeads).where(eq(emailLeads.email, email)).limit(1);
    if (existing[0]) return existing[0];
    const result = await this.db.insert(emailLeads).values({ email, source }).returning();
    return result[0];
  }

  async getAllLeads(): Promise<Lead[]> {
    return this.db.select().from(emailLeads).orderBy(emailLeads.createdAt);
  }

  // ── Template pack purchases ──────────────────────────────────────────────
  async savePurchase(data: { userId?: string; email: string; pack: string; stripeSessionId: string; stripePaymentIntent: string; amountPaid: number; downloadToken: string; }): Promise<Purchase> {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const res = await pool.query(
      `INSERT INTO purchases (user_id, email, pack, stripe_session_id, stripe_payment_intent, amount_paid, download_token, download_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
       ON CONFLICT (stripe_session_id) DO NOTHING
       RETURNING *`,
      [data.userId || null, data.email, data.pack, data.stripeSessionId, data.stripePaymentIntent, data.amountPaid, data.downloadToken]
    );
    await pool.end();
    return res.rows[0] as Purchase;
  }

  async getPurchaseBySessionId(sessionId: string): Promise<Purchase | undefined> {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const res = await pool.query('SELECT * FROM purchases WHERE stripe_session_id = $1 LIMIT 1', [sessionId]);
    await pool.end();
    return res.rows[0] as Purchase | undefined;
  }

  async getPurchaseByToken(token: string): Promise<Purchase | undefined> {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const res = await pool.query('SELECT * FROM purchases WHERE download_token = $1 LIMIT 1', [token]);
    await pool.end();
    return res.rows[0] as Purchase | undefined;
  }

  async incrementDownloadCount(purchaseId: string): Promise<void> {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await pool.query('UPDATE purchases SET download_count = download_count + 1 WHERE id = $1', [purchaseId]);
    await pool.end();
  }

  async getUsersForDrip(): Promise<Array<{ id: string; email: string; username: string; registeredAt: string; sentEmailDays: number[] }>> {
    const rows = await this.db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      registeredAt: users.registeredAt,
      sentEmailDays: users.sentEmailDays,
    }).from(users);
    return rows.map(r => ({
      ...r,
      sentEmailDays: Array.isArray(r.sentEmailDays) ? (r.sentEmailDays as number[]) : [],
    }));
  }

  async updateSentEmailDays(userId: string, days: number[]): Promise<void> {
    await this.db.update(users).set({ sentEmailDays: days }).where(eq(users.id, userId));
  }
}

// ─── In-Memory Storage (fallback when no DATABASE_URL) ─────────────────────

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.googleId === googleId);
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.stripeCustomerId === customerId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.email.localeCompare(b.email));
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  async upsertGoogleUser(data: InsertGoogleUser & { avatarUrl?: string }): Promise<User> {
    const byGoogleId = await this.getUserByGoogleId(data.googleId!);
    if (byGoogleId) return byGoogleId;
    const byEmail = await this.getUserByEmail(data.email);
    if (byEmail) {
      const updated = { ...byEmail, googleId: data.googleId };
      this.users.set(byEmail.id, updated);
      return updated;
    }
    const id = randomUUID();
    const user: User = {
      id,
      username: data.username,
      email: data.email,
      googleId: data.googleId ?? null,
      passwordHash: null,
      stripeCustomerId: null,
      subscriptionStatus: "free",
      subscriptionId: null,
      completedLessons: [],
      quizScores: {},
      moduleSkillLevels: {},
      moduleAssessmentScores: {},
      lastLoginAt: null,
      lastActiveAt: null,
      loginCount: 0,
      totalMinutesActive: 0,
      xp: 0,
    };
    this.users.set(id, user);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      stripeCustomerId: null,
      subscriptionStatus: "free",
      subscriptionId: null,
      completedLessons: [],
      quizScores: {},
      moduleSkillLevels: {},
      moduleAssessmentScores: {},
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserSubscription(
    userId: string,
    data: { subscriptionStatus?: string; stripeCustomerId?: string; subscriptionId?: string }
  ): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserProgress(
    userId: string,
    completedLessons: string[],
    quizScores: Record<string, number>
  ): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, completedLessons, quizScores };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, passwordHash };
    this.users.set(userId, updated);
    return updated;
  }

  async updateModuleSkillLevel(
    userId: string,
    moduleId: string,
    level: SkillLevel,
    assessmentScore: number
  ): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const currentLevels = (user.moduleSkillLevels as Record<string, SkillLevel>) ?? {};
    const currentScores = (user.moduleAssessmentScores as Record<string, number>) ?? {};
    const updated = {
      ...user,
      moduleSkillLevels: { ...currentLevels, [moduleId]: level },
      moduleAssessmentScores: { ...currentScores, [moduleId]: assessmentScore },
    };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserAnalytics(
    userId: string,
    data: {
      lastLoginAt?: string;
      lastActiveAt?: string;
      loginCount?: number;
      totalMinutesActive?: number;
      xp?: number;
    }
  ): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(userId, updated);
    return updated;
  }

  async saveUserProfile(userId: string, profile: Record<string, any>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, userProfile: profile };
    this.users.set(userId, updated);
    return updated;
  }

  async saveLead(email: string, source = 'landing_page'): Promise<Lead> {
    const lead: Lead = { id: randomUUID(), email, source, createdAt: new Date().toISOString() };
    return lead;
  }

  async getAllLeads(): Promise<Lead[]> { return []; }

  async savePurchase(data: any): Promise<Purchase> { throw new Error("Not implemented in MemStorage"); }
  async getPurchaseBySessionId(_: string): Promise<Purchase | undefined> { return undefined; }
  async getPurchaseByToken(_: string): Promise<Purchase | undefined> { return undefined; }
  async incrementDownloadCount(_: string): Promise<void> {}

  async getUsersForDrip(): Promise<Array<{ id: string; email: string; username: string; registeredAt: string; sentEmailDays: number[] }>> {
    return Array.from(this.users.values()).map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      registeredAt: u.registeredAt ?? new Date().toISOString(),
      sentEmailDays: Array.isArray(u.sentEmailDays) ? (u.sentEmailDays as number[]) : [],
    }));
  }

  async updateSentEmailDays(userId: string, days: number[]): Promise<void> {
    const user = this.users.get(userId);
    if (user) this.users.set(userId, { ...user, sentEmailDays: days });
  }
}

// ─── Export — auto-select based on DATABASE_URL ─────────────────────────────

function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    try {
      console.log("[storage] Using PostgreSQL (DrizzleStorage)");
      return new DrizzleStorage(process.env.DATABASE_URL);
    } catch (err: any) {
      console.error(`[storage] Failed to init Postgres, falling back to memory: ${err.message}`);
    }
  } else {
    console.log("[storage] No DATABASE_URL — using MemStorage (data resets on restart)");
  }
  return new MemStorage();
}

export const storage: IStorage = createStorage();
