import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// CORS — allow credentials from any origin (required for Safari/Firefox cookie handling)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run database migrations if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    // Always run ADD COLUMN IF NOT EXISTS to keep schema current
    try {
      const { Pool: PgPool } = await import("pg");
      const schemaPool = new PgPool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      const schemaCols = [
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS module_skill_levels JSONB NOT NULL DEFAULT '{}'::JSONB`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS module_assessment_scores JSONB NOT NULL DEFAULT '{}'::JSONB`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TEXT`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TEXT`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_minutes_active INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0`,
        // Google OAuth column (nullable, unique)
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`,
        // Make password_hash nullable for Google OAuth users
        `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
        // Onboarding / learning path profile
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_profile JSONB DEFAULT '{}'::JSONB`,
        // Email drip tracking
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS registered_at TEXT NOT NULL DEFAULT now()::text`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS sent_email_days JSONB NOT NULL DEFAULT '[]'::JSONB`,
      ];
      // email_leads table for landing page opt-ins
      try {
        await schemaPool.query(`
          CREATE TABLE IF NOT EXISTS email_leads (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
            email TEXT NOT NULL UNIQUE,
            source TEXT DEFAULT 'landing_page',
            created_at TEXT NOT NULL DEFAULT now()::text
          )
        `);
      } catch (e: any) { /* table already exists */ }
      for (const stmt of schemaCols) {
        try { await schemaPool.query(stmt); } catch (e: any) { /* column already exists or already nullable */ }
      }
      // Add unique index on google_id if not already present
      try {
        await schemaPool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id) WHERE google_id IS NOT NULL`);
      } catch (e: any) { /* index already exists */ }
      await schemaPool.end();
      log("Analytics + Google OAuth schema columns ensured", "db");
    } catch (schemaErr: any) {
      log(`Schema column check failed: ${schemaErr.message}`, "db");
    }

    try {
      log("Running database migrations...", "db");
      const { migrate } = await import("drizzle-orm/node-postgres/migrator");
      const { drizzle } = await import("drizzle-orm/node-postgres");
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      const db = drizzle(pool);
      await migrate(db, { migrationsFolder: "./migrations" });
      log("Database migrations complete", "db");
    } catch (err: any) {
      // If no migrations folder yet, create table directly
      log(`Migration note: ${err.message} — attempting direct schema push`, "db");
      try {
        const { Pool } = await import("pg");
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            stripe_customer_id TEXT,
            subscription_status TEXT NOT NULL DEFAULT 'free',
            subscription_id TEXT,
            completed_lessons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
            quiz_scores JSONB NOT NULL DEFAULT '{}'::JSONB
          );
        `);
        log("Users table ensured via direct SQL", "db");
        // Add any missing columns (safe to run on every startup)
        const alterCols = [
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS module_skill_levels JSONB NOT NULL DEFAULT '{}'::JSONB`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS module_assessment_scores JSONB NOT NULL DEFAULT '{}'::JSONB`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TEXT`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TEXT`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_minutes_active INTEGER NOT NULL DEFAULT 0`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`,
          `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_profile JSONB DEFAULT '{}'::JSONB`,
        ];
        for (const sql of alterCols) {
          try { await pool.query(sql); } catch (e: any) { log(`alter col skipped: ${e.message}`, 'db'); }
        }
        try {
          await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id) WHERE google_id IS NOT NULL`);
        } catch (e: any) { /* index exists */ }
        log("Schema columns ensured (incl. Google OAuth)", "db");
        await pool.end();
      } catch (sqlErr: any) {
        log(`DB setup error: ${sqlErr.message}`, "db");
      }
    }
  } else {
    log("No DATABASE_URL — using in-memory storage (data lost on restart)", "db");
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
