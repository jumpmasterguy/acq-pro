import { type User, type InsertUser, users } from "@shared/schema";
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
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
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

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return this.db.select().from(users).orderBy(users.email);
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

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.stripeCustomerId === customerId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.email.localeCompare(b.email));
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
