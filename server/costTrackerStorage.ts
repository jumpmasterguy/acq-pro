/**
 * Cost & Burn Rate Tracker — persistence layer.
 *
 * Follows the same "self-provisioning table" pattern already used for
 * `unsubscribes` in server/storage.ts: raw SQL, CREATE TABLE IF NOT EXISTS
 * on first use, no drizzle-kit migration required. That means this ships
 * and works the first time the app talks to Postgres — nothing to run by
 * hand against production.
 *
 * Falls back to an in-memory implementation when DATABASE_URL isn't set,
 * same as the rest of the app's storage layer — this is what makes local
 * dev (and this feature) fully testable without a live Postgres instance.
 */

import { randomUUID } from "crypto";
import type {
  CostProject, FundingMod, CostEntry, RatesConfig, Clin,
} from "@shared/costTracker";
import { DEFAULT_RATES } from "@shared/costTracker";

export interface ICostTrackerStorage {
  listProjects(userId: string): Promise<CostProject[]>;
  getProject(userId: string, projectId: string): Promise<CostProject | undefined>;
  createProject(userId: string, code: string, name: string): Promise<CostProject>;
  archiveProject(userId: string, projectId: string): Promise<void>;

  listFundingMods(projectId: string): Promise<FundingMod[]>;
  createFundingMod(projectId: string, data: Omit<FundingMod, "id" | "projectId" | "createdAt">): Promise<FundingMod>;
  deleteFundingMod(projectId: string, modId: string): Promise<void>;

  listCostEntries(projectId: string): Promise<CostEntry[]>;
  createCostEntry(projectId: string, data: Omit<CostEntry, "id" | "projectId" | "createdAt">): Promise<CostEntry>;
  deleteCostEntry(projectId: string, entryId: string): Promise<void>;

  getRates(userId: string): Promise<RatesConfig>;
  updateRates(userId: string, data: Omit<RatesConfig, "userId" | "updatedAt">): Promise<RatesConfig>;
}

// ─── Postgres (raw SQL, self-provisioning) ──────────────────────────────────

class PgCostTrackerStorage implements ICostTrackerStorage {
  constructor(private connectionString: string) {}

  private async withPool<T>(fn: (pool: any) => Promise<T>): Promise<T> {
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: this.connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await this.ensureTables(pool);
      return await fn(pool);
    } finally {
      await pool.end();
    }
  }

  private async ensureTables(pool: any): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cost_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS cost_projects_user_idx ON cost_projects(user_id);

      CREATE TABLE IF NOT EXISTS cost_funding_mods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES cost_projects(id) ON DELETE CASCADE,
        mod_number TEXT NOT NULL,
        acrn TEXT,
        slin TEXT,
        clin TEXT NOT NULL,
        amount_cents BIGINT NOT NULL,
        mod_date DATE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS cost_funding_mods_project_idx ON cost_funding_mods(project_id);

      CREATE TABLE IF NOT EXISTS cost_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES cost_projects(id) ON DELETE CASCADE,
        clin TEXT NOT NULL,
        prime_or_sub TEXT NOT NULL,
        amount_cents BIGINT NOT NULL,
        entry_date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS cost_entries_project_idx ON cost_entries(project_id);

      CREATE TABLE IF NOT EXISTS cost_rates (
        user_id VARCHAR PRIMARY KEY,
        fringe REAL NOT NULL,
        overhead REAL NOT NULL,
        ga REAL NOT NULL,
        ms REAL NOT NULL,
        fixed_fee_rate REAL NOT NULL,
        award_fee_rate REAL NOT NULL,
        fee_type_labor TEXT NOT NULL,
        fee_type_travel TEXT NOT NULL,
        fee_type_odc TEXT NOT NULL,
        fee_type_me TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  private rowToProject(r: any): CostProject {
    return { id: r.id, userId: r.user_id, code: r.code, name: r.name, archived: r.archived, createdAt: r.created_at };
  }
  private rowToMod(r: any): FundingMod {
    return {
      id: r.id, projectId: r.project_id, modNumber: r.mod_number, acrn: r.acrn, slin: r.slin,
      clin: r.clin as Clin, amountCents: Number(r.amount_cents), modDate: r.mod_date, description: r.description,
      createdAt: r.created_at,
    };
  }
  private rowToEntry(r: any): CostEntry {
    return {
      id: r.id, projectId: r.project_id, clin: r.clin as Clin, primeOrSub: r.prime_or_sub,
      amountCents: Number(r.amount_cents), entryDate: r.entry_date, description: r.description,
      createdAt: r.created_at,
    };
  }
  private rowToRates(r: any, userId: string): RatesConfig {
    return {
      userId, fringe: r.fringe, overhead: r.overhead, ga: r.ga, ms: r.ms,
      fixedFeeRate: r.fixed_fee_rate, awardFeeRate: r.award_fee_rate,
      feeTypeByClin: { Labor: r.fee_type_labor, Travel: r.fee_type_travel, ODC: r.fee_type_odc, 'M&E': r.fee_type_me },
      updatedAt: r.updated_at,
    };
  }

  async listProjects(userId: string): Promise<CostProject[]> {
    return this.withPool(async (pool) => {
      const res = await pool.query(
        `SELECT * FROM cost_projects WHERE user_id = $1 AND archived = FALSE ORDER BY created_at ASC`,
        [userId]
      );
      return res.rows.map((r: any) => this.rowToProject(r));
    });
  }

  async getProject(userId: string, projectId: string): Promise<CostProject | undefined> {
    return this.withPool(async (pool) => {
      const res = await pool.query(`SELECT * FROM cost_projects WHERE id = $1 AND user_id = $2`, [projectId, userId]);
      return res.rows[0] ? this.rowToProject(res.rows[0]) : undefined;
    });
  }

  async createProject(userId: string, code: string, name: string): Promise<CostProject> {
    return this.withPool(async (pool) => {
      const res = await pool.query(
        `INSERT INTO cost_projects (user_id, code, name) VALUES ($1, $2, $3) RETURNING *`,
        [userId, code, name]
      );
      return this.rowToProject(res.rows[0]);
    });
  }

  async archiveProject(userId: string, projectId: string): Promise<void> {
    await this.withPool(async (pool) => {
      await pool.query(`UPDATE cost_projects SET archived = TRUE WHERE id = $1 AND user_id = $2`, [projectId, userId]);
    });
  }

  async listFundingMods(projectId: string): Promise<FundingMod[]> {
    return this.withPool(async (pool) => {
      const res = await pool.query(
        `SELECT * FROM cost_funding_mods WHERE project_id = $1 ORDER BY mod_date ASC NULLS LAST, created_at ASC`,
        [projectId]
      );
      return res.rows.map((r: any) => this.rowToMod(r));
    });
  }

  async createFundingMod(projectId: string, data: Omit<FundingMod, "id" | "projectId" | "createdAt">): Promise<FundingMod> {
    return this.withPool(async (pool) => {
      const res = await pool.query(
        `INSERT INTO cost_funding_mods (project_id, mod_number, acrn, slin, clin, amount_cents, mod_date, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [projectId, data.modNumber, data.acrn, data.slin, data.clin, data.amountCents, data.modDate, data.description]
      );
      return this.rowToMod(res.rows[0]);
    });
  }

  async deleteFundingMod(projectId: string, modId: string): Promise<void> {
    await this.withPool(async (pool) => {
      await pool.query(`DELETE FROM cost_funding_mods WHERE id = $1 AND project_id = $2`, [modId, projectId]);
    });
  }

  async listCostEntries(projectId: string): Promise<CostEntry[]> {
    return this.withPool(async (pool) => {
      const res = await pool.query(
        `SELECT * FROM cost_entries WHERE project_id = $1 ORDER BY entry_date ASC, created_at ASC`,
        [projectId]
      );
      return res.rows.map((r: any) => this.rowToEntry(r));
    });
  }

  async createCostEntry(projectId: string, data: Omit<CostEntry, "id" | "projectId" | "createdAt">): Promise<CostEntry> {
    return this.withPool(async (pool) => {
      const res = await pool.query(
        `INSERT INTO cost_entries (project_id, clin, prime_or_sub, amount_cents, entry_date, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [projectId, data.clin, data.primeOrSub, data.amountCents, data.entryDate, data.description]
      );
      return this.rowToEntry(res.rows[0]);
    });
  }

  async deleteCostEntry(projectId: string, entryId: string): Promise<void> {
    await this.withPool(async (pool) => {
      await pool.query(`DELETE FROM cost_entries WHERE id = $1 AND project_id = $2`, [entryId, projectId]);
    });
  }

  async getRates(userId: string): Promise<RatesConfig> {
    return this.withPool(async (pool) => {
      const res = await pool.query(`SELECT * FROM cost_rates WHERE user_id = $1`, [userId]);
      if (res.rows[0]) return this.rowToRates(res.rows[0], userId);
      // Provision defaults on first access
      const d = DEFAULT_RATES;
      const ins = await pool.query(
        `INSERT INTO cost_rates (user_id, fringe, overhead, ga, ms, fixed_fee_rate, award_fee_rate, fee_type_labor, fee_type_travel, fee_type_odc, fee_type_me)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [userId, d.fringe, d.overhead, d.ga, d.ms, d.fixedFeeRate, d.awardFeeRate,
         d.feeTypeByClin.Labor, d.feeTypeByClin.Travel, d.feeTypeByClin.ODC, d.feeTypeByClin['M&E']]
      );
      return this.rowToRates(ins.rows[0], userId);
    });
  }

  async updateRates(userId: string, data: Omit<RatesConfig, "userId" | "updatedAt">): Promise<RatesConfig> {
    return this.withPool(async (pool) => {
      const res = await pool.query(
        `INSERT INTO cost_rates (user_id, fringe, overhead, ga, ms, fixed_fee_rate, award_fee_rate, fee_type_labor, fee_type_travel, fee_type_odc, fee_type_me)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (user_id) DO UPDATE SET
           fringe = EXCLUDED.fringe, overhead = EXCLUDED.overhead, ga = EXCLUDED.ga, ms = EXCLUDED.ms,
           fixed_fee_rate = EXCLUDED.fixed_fee_rate, award_fee_rate = EXCLUDED.award_fee_rate,
           fee_type_labor = EXCLUDED.fee_type_labor, fee_type_travel = EXCLUDED.fee_type_travel,
           fee_type_odc = EXCLUDED.fee_type_odc, fee_type_me = EXCLUDED.fee_type_me,
           updated_at = NOW()
         RETURNING *`,
        [userId, data.fringe, data.overhead, data.ga, data.ms, data.fixedFeeRate, data.awardFeeRate,
         data.feeTypeByClin.Labor, data.feeTypeByClin.Travel, data.feeTypeByClin.ODC, data.feeTypeByClin['M&E']]
      );
      return this.rowToRates(res.rows[0], userId);
    });
  }
}

// ─── In-memory (local dev without DATABASE_URL) ─────────────────────────────

class MemCostTrackerStorage implements ICostTrackerStorage {
  private projects = new Map<string, CostProject>();
  private mods = new Map<string, FundingMod>();
  private entries = new Map<string, CostEntry>();
  private rates = new Map<string, RatesConfig>();

  async listProjects(userId: string): Promise<CostProject[]> {
    return Array.from(this.projects.values()).filter((p) => p.userId === userId && !p.archived);
  }
  async getProject(userId: string, projectId: string): Promise<CostProject | undefined> {
    const p = this.projects.get(projectId);
    return p && p.userId === userId ? p : undefined;
  }
  async createProject(userId: string, code: string, name: string): Promise<CostProject> {
    const p: CostProject = { id: randomUUID(), userId, code, name, archived: false, createdAt: new Date().toISOString() };
    this.projects.set(p.id, p);
    return p;
  }
  async archiveProject(userId: string, projectId: string): Promise<void> {
    const p = this.projects.get(projectId);
    if (p && p.userId === userId) this.projects.set(projectId, { ...p, archived: true });
  }

  async listFundingMods(projectId: string): Promise<FundingMod[]> {
    return Array.from(this.mods.values()).filter((m) => m.projectId === projectId);
  }
  async createFundingMod(projectId: string, data: Omit<FundingMod, "id" | "projectId" | "createdAt">): Promise<FundingMod> {
    const m: FundingMod = { id: randomUUID(), projectId, createdAt: new Date().toISOString(), ...data };
    this.mods.set(m.id, m);
    return m;
  }
  async deleteFundingMod(projectId: string, modId: string): Promise<void> {
    const m = this.mods.get(modId);
    if (m && m.projectId === projectId) this.mods.delete(modId);
  }

  async listCostEntries(projectId: string): Promise<CostEntry[]> {
    return Array.from(this.entries.values()).filter((e) => e.projectId === projectId);
  }
  async createCostEntry(projectId: string, data: Omit<CostEntry, "id" | "projectId" | "createdAt">): Promise<CostEntry> {
    const e: CostEntry = { id: randomUUID(), projectId, createdAt: new Date().toISOString(), ...data };
    this.entries.set(e.id, e);
    return e;
  }
  async deleteCostEntry(projectId: string, entryId: string): Promise<void> {
    const e = this.entries.get(entryId);
    if (e && e.projectId === projectId) this.entries.delete(entryId);
  }

  async getRates(userId: string): Promise<RatesConfig> {
    const existing = this.rates.get(userId);
    if (existing) return existing;
    const r: RatesConfig = { userId, updatedAt: new Date().toISOString(), ...DEFAULT_RATES };
    this.rates.set(userId, r);
    return r;
  }
  async updateRates(userId: string, data: Omit<RatesConfig, "userId" | "updatedAt">): Promise<RatesConfig> {
    const r: RatesConfig = { userId, updatedAt: new Date().toISOString(), ...data };
    this.rates.set(userId, r);
    return r;
  }
}

export const costTrackerStorage: ICostTrackerStorage = process.env.DATABASE_URL
  ? new PgCostTrackerStorage(process.env.DATABASE_URL)
  : new MemCostTrackerStorage();

if (!process.env.DATABASE_URL) {
  console.log("[costTrackerStorage] No DATABASE_URL — using in-memory storage (data resets on restart)");
}
