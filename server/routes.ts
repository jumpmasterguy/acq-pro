import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, hashPassword, requireAuth, toPassportUser } from "./auth";
import { registerSchema, loginSchema, userProfileSchema } from "@shared/schema";
import { sendWelcomeEmail, sendStarterKitEmail, processDripEmails } from "./email";

// Initialize Stripe — will be undefined if key not set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" })
  : null;

const STRIPE_PRICE_LIFETIME = process.env.STRIPE_PRICE_ID_LIFETIME;
const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup passport + sessions (async — creates session table in PostgreSQL)
  await setupAuth(app);

  // Health check — Railway uses this to confirm the app is alive
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ─── Auth Routes ───────────────────────────────────────────────────

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.errors[0]?.message || "Validation error",
      });
    }
    const { username, email, password } = parsed.data;

    // Check for existing email
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await storage.createUser({ username, email, passwordHash });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.username).catch(() => {});

    // Auto-login after registration
    req.login(toPassportUser(user), async (err) => {
      if (err) return res.status(500).json({ message: "Login failed after registration" });
      // Track first login analytics (non-blocking)
      try {
        await storage.updateUserAnalytics(user.id, {
          lastLoginAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          loginCount: 1,
        });
      } catch (e) {
        console.error('[analytics] registration login tracking error:', e);
      }
      return res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        completedLessons: user.completedLessons ?? [],
        quizScores: user.quizScores ?? {},
        isAdmin: isAdmin(req),
        moduleSkillLevels: (user.moduleSkillLevels as Record<string, string>) ?? {},
        moduleAssessmentScores: (user.moduleAssessmentScores as Record<string, number>) ?? {},
        userProfile: (user as any).userProfile ?? null,
      });
    });
  });

  // Login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.errors[0]?.message || "Validation error",
      });
    }

    passport.authenticate(
      "local",
      (err: Error | null, user: Express.User | false, info: { message: string }) => {
        if (err) return res.status(500).json({ message: "Authentication error" });
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        req.login(user, async (loginErr) => {
          if (loginErr) {
            console.error("[login] req.login error:", loginErr);
            return res.status(500).json({ message: "Session error" });
          }
          // Track login analytics (non-blocking)
          try {
            const currentUser = await storage.getUser(user.id);
            if (currentUser) {
              await storage.updateUserAnalytics(user.id, {
                lastLoginAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                loginCount: (currentUser.loginCount ?? 0) + 1,
              });
            }
          } catch (e) {
            console.error('[analytics] login tracking error:', e);
          }
          return res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            subscriptionStatus: user.subscriptionStatus,
            completedLessons: user.completedLessons ?? [],
            quizScores: user.quizScores ?? {},
            isAdmin: isAdmin(req),
            moduleSkillLevels: (user.moduleSkillLevels as Record<string, string>) ?? {},
            moduleAssessmentScores: (user.moduleAssessmentScores as Record<string, number>) ?? {},
            userProfile: (user as any).userProfile ?? null,
          });
        });
      }
    )(req, res);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
      });
    });
  });

  // Get current user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user;
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      completedLessons: user.completedLessons ?? [],
      quizScores: user.quizScores ?? {},
      isAdmin: isAdmin(req),
      moduleSkillLevels: (user.moduleSkillLevels as Record<string, string>) ?? {},
      moduleAssessmentScores: (user.moduleAssessmentScores as Record<string, number>) ?? {},
      userProfile: user.userProfile ?? null,
    });
  });

  // POST /api/profile — save onboarding answers
  app.post("/api/profile", requireAuth as any, async (req: Request, res: Response) => {
    const parsed = userProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid profile data" });
    }
    try {
      const updated = await storage.saveUserProfile(req.user!.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "User not found" });
      // Update session
      (req.user as any).userProfile = parsed.data;

      // Send role-specific starter kit email (non-blocking)
      const user = req.user as any;
      if (parsed.data.completedOnboarding && parsed.data.role && user.email) {
        sendStarterKitEmail(
          user.email,
          user.username || user.email,
          parsed.data.role as any
        ).catch((err) => console.error('[email] Starter kit send failed:', err));
      }

      return res.json({ userProfile: parsed.data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── Google OAuth Routes ──────────────────────────────────────────

  // Initiate Google OAuth flow
  app.get("/api/auth/google", (req: Request, res: Response, next) => {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({ message: "Google OAuth is not configured" });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  // Google OAuth callback — redirect to app after login
  app.get("/api/auth/google/callback",
    (req: Request, res: Response, next) => {
      passport.authenticate("google", { failureRedirect: "/auth?error=google_failed" })(req, res, next);
    },
    async (req: Request, res: Response) => {
      // Track login analytics (non-blocking)
      if (req.user) {
        try {
          const currentUser = await storage.getUser(req.user.id);
          if (currentUser) {
            await storage.updateUserAnalytics(req.user.id, {
              lastLoginAt: new Date().toISOString(),
              loginCount: (currentUser.loginCount ?? 0) + 1,
            });
          }
        } catch (e) {
          console.error('[analytics] google login tracking error:', e);
        }
      }
      // Redirect to the app (use /app route which always serves index.html)
      res.redirect(`${process.env.APP_URL || ""}/app#/dashboard`);
    }
  );

  // ─── Progress Routes ───────────────────────────────────────────────

  // Save lesson progress
  app.post("/api/progress", requireAuth as any, async (req: Request, res: Response) => {
    const { lessonId, quizScore } = req.body;
    if (!lessonId) {
      return res.status(400).json({ message: "lessonId is required" });
    }

    const userId = req.user!.id;
    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const completedLessons = Array.from(
      new Set([...(currentUser.completedLessons ?? []), lessonId])
    );
    const currentScores = (currentUser.quizScores as Record<string, number>) ?? {};
    const newScores = { ...currentScores };
    if (quizScore !== undefined && quizScore !== null) {
      if (!newScores[lessonId] || quizScore > newScores[lessonId]) {
        newScores[lessonId] = quizScore;
      }
    }

    const updated = await storage.updateUserProgress(userId, completedLessons, newScores);
    if (!updated) {
      return res.status(500).json({ message: "Failed to save progress" });
    }

    // Refresh the session user
    req.user!.completedLessons = updated.completedLessons ?? [];
    req.user!.quizScores = (updated.quizScores as Record<string, number>) ?? {};

    return res.json({ completedLessons: updated.completedLessons, quizScores: updated.quizScores });
  });

  // ─── Skill Level Routes ────────────────────────────────────────────

  // POST /api/skill-level — submit module assessment, unlock skill level
  app.post("/api/skill-level", requireAuth as any, async (req: Request, res: Response) => {
    const { moduleId, score } = req.body as { moduleId: string; score: number };
    if (!moduleId || score === undefined || score === null) {
      return res.status(400).json({ message: "moduleId and score required" });
    }

    const userId = req.user!.id;
    const currentUser = await storage.getUser(userId);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // Determine current and new level
    const currentLevels = (currentUser.moduleSkillLevels as Record<string, string>) ?? {};
    const currentLevel = (currentLevels[moduleId] ?? 'novice') as 'novice' | 'intermediate' | 'advanced';

    // Unlock logic: pass ≥75% to advance one tier
    const PASS_THRESHOLD = 75;
    let newLevel: 'novice' | 'intermediate' | 'advanced' = currentLevel;
    let unlocked = false;

    if (score >= PASS_THRESHOLD) {
      if (currentLevel === 'novice') {
        newLevel = 'intermediate';
        unlocked = true;
      } else if (currentLevel === 'intermediate') {
        newLevel = 'advanced';
        unlocked = true;
      } else {
        // Already advanced — record score but no new unlock
        newLevel = 'advanced';
      }
    }

    const updated = await storage.updateModuleSkillLevel(userId, moduleId, newLevel, score);
    if (!updated) return res.status(500).json({ message: "Failed to update skill level" });

    // Refresh session user
    (req.user as any).moduleSkillLevels = updated.moduleSkillLevels;
    (req.user as any).moduleAssessmentScores = updated.moduleAssessmentScores;

    return res.json({
      moduleId,
      newLevel,
      score,
      unlocked,
      moduleSkillLevels: updated.moduleSkillLevels,
      moduleAssessmentScores: updated.moduleAssessmentScores,
    });
  });

  // ─── Stripe Routes ─────────────────────────────────────────────────

  // Create checkout session
  app.post(
    "/api/stripe/create-checkout-session",
    requireAuth as any,
    async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing not configured" });
      }

      const { priceType } = req.body; // 'lifetime' | 'monthly'
      const priceId =
        priceType === "monthly" ? STRIPE_PRICE_MONTHLY : STRIPE_PRICE_LIFETIME;

      if (!priceId) {
        return res
          .status(503)
          .json({ message: "Payment option not available. Please contact support." });
      }

      const userId = req.user!.id;
      const userEmail = req.user!.email;

      try {
        // Create or retrieve Stripe customer
        // Always verify the stored ID is valid in the current Stripe mode (test vs live)
        let customerId = req.user!.stripeCustomerId;
        if (customerId) {
          try {
            await stripe.customers.retrieve(customerId);
          } catch (retrieveErr: any) {
            // Customer doesn't exist in this Stripe mode (e.g. test ID used in live mode)
            console.warn(`[stripe] Stored customer ${customerId} not found — creating new one`);
            customerId = null;
          }
        }
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: userEmail,
            metadata: { userId },
          });
          customerId = customer.id;
          await storage.updateUserSubscription(userId, { stripeCustomerId: customerId });
        }

        // Determine mode
        const mode = priceType === "monthly" ? "subscription" : "payment";

        // Build success/cancel URLs — use the app's origin
        const origin =
          process.env.APP_URL ||
          `${req.protocol}://${req.get("host")}`;
        const successUrl = `${origin}/app#/dashboard?payment=success`;
        const cancelUrl = `${origin}/app#/upgrade?payment=cancelled`;

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          mode,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { userId },
          allow_promotion_codes: true,
        });

        return res.json({ url: session.url });
      } catch (err: any) {
        console.error("Stripe checkout error:", err);
        return res.status(500).json({ message: err.message || "Payment error" });
      }
    }
  );

  // Stripe webhook — handles checkout.session.completed
  app.post(
    "/api/stripe/webhook",
    express_rawBody,
    async (req: Request, res: Response) => {
      if (!stripe || !STRIPE_WEBHOOK_SECRET) {
        return res.status(503).json({ message: "Webhook not configured" });
      }

      const sig = req.headers["stripe-signature"];
      if (!sig) {
        return res.status(400).json({ message: "Missing stripe-signature header" });
      }

      let event: Stripe.Event;
      try {
        // rawBody was captured in server/index.ts
        const rawBody = (req as any).rawBody;
        event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            if (!userId) break;

            // Determine if one-time or subscription
            const isSubscription = session.mode === "subscription";
            await storage.updateUserSubscription(userId, {
              subscriptionStatus: isSubscription ? "active" : "lifetime",
              subscriptionId: isSubscription ? (session.subscription as string) : undefined,
              stripeCustomerId: session.customer as string,
            });
            break;
          }
          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const customerId = sub.customer as string;
            // Find user by stripeCustomerId
            const allUsers = await storage.getUserByStripeCustomerId(customerId);
            if (allUsers) {
              await storage.updateUserSubscription(allUsers.id, {
                subscriptionStatus: "free",
                subscriptionId: undefined,
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error("Webhook handler error:", err);
      }

      return res.json({ received: true });
    }
  );

  // Stripe customer portal
  app.post(
    "/api/stripe/portal",
    requireAuth as any,
    async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing not configured" });
      }

      let portalCustomerId = req.user!.stripeCustomerId;
      if (!portalCustomerId) {
        return res.status(400).json({ message: "No billing account found" });
      }

      try {
        // Verify customer exists in current Stripe mode
        try { await stripe.customers.retrieve(portalCustomerId); }
        catch { return res.status(400).json({ message: "Billing account not found in current payment mode" }); }

        const origin =
          process.env.APP_URL ||
          `${req.protocol}://${req.get("host")}`;
        const session = await stripe.billingPortal.sessions.create({
          customer: portalCustomerId,
          return_url: `${origin}/#/dashboard`,
        });
        return res.json({ url: session.url });
      } catch (err: any) {
        console.error("Portal error:", err);
        return res.status(500).json({ message: err.message || "Portal error" });
      }
    }
  );

  // ─── Admin Routes ──────────────────────────────────────────────────

  // Helper: check if the requesting session user is an admin
  function isAdmin(req: Request): boolean {
    if (!req.isAuthenticated() || !req.user) return false;
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    return adminEmails.includes(req.user.email.toLowerCase());
  }

  // List all users — admin only
  app.get("/api/admin/users", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const users = await storage.getAllUsers();
    return res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      subscriptionStatus: u.subscriptionStatus,
      completedLessons: (u.completedLessons ?? []).length,
    })));
  });

  // Reset password — admin only
  app.post("/api/admin/reset-password", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: "email and newPassword required" });
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });
    const passwordHash = await hashPassword(newPassword);
    await storage.updateUserPassword(user.id, passwordHash);
    return res.json({ message: `Password reset for ${email}` });
  });

  // Grant/revoke Pro — admin only (by user id or email)
  app.post("/api/admin/make-pro", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) {
      // Legacy: also allow ADMIN_SECRET header for curl usage
      const adminSecret = process.env.ADMIN_SECRET;
      const { secret } = req.body;
      if (!adminSecret || secret !== adminSecret) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const { email, userId, plan } = req.body;
    let user;
    if (userId) {
      user = await storage.getUser(userId);
    } else if (email) {
      user = await storage.getUserByEmail(email);
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const status = plan === "free" ? "free" : plan === "lifetime" ? "lifetime" : "active";
    await storage.updateUserSubscription(user.id, { subscriptionStatus: status });
    return res.json({ message: `${user.email} is now ${status}`, userId: user.id });
  });

  // ─── Activity Tracking ────────────────────────────────────────────────────

  // POST /api/track-activity
  // Body: { minutesActive: number } — sent periodically by the client (heartbeat)
  // Also recalculates XP from progress data
  app.post("/api/track-activity", requireAuth as any, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { minutesActive = 0 } = req.body as { minutesActive?: number };

    try {
      const currentUser = await storage.getUser(userId);
      if (!currentUser) return res.status(404).json({ message: "User not found" });

      // Recalculate XP from progress data
      const completedCount = (currentUser.completedLessons ?? []).length;
      const quizScores = (currentUser.quizScores as Record<string, number>) ?? {};
      const quizValues = Object.values(quizScores);
      const avgQuiz = quizValues.length > 0
        ? quizValues.reduce((a, b) => a + b, 0) / quizValues.length
        : 0;
      const skillLevels = (currentUser.moduleSkillLevels as Record<string, string>) ?? {};
      const skillUnlocks = Object.values(skillLevels).filter(l => l === 'intermediate' || l === 'advanced').length
        + Object.values(skillLevels).filter(l => l === 'advanced').length; // advanced counts double
      const newXp = Math.round(
        completedCount * 10
        + avgQuiz * 5
        + skillUnlocks * 50
      );

      const newMinutes = (currentUser.totalMinutesActive ?? 0) + Math.max(0, Math.round(minutesActive));

      await storage.updateUserAnalytics(userId, {
        lastActiveAt: new Date().toISOString(),
        totalMinutesActive: newMinutes,
        xp: newXp,
      });

      return res.json({ ok: true, xp: newXp, totalMinutesActive: newMinutes });
    } catch (err: any) {
      console.error('[track-activity] error:', err);
      return res.status(500).json({ message: 'Failed to track activity' });
    }
  });

  // ─── Admin Analytics ─────────────────────────────────────────────────────

  // GET /api/admin/analytics — aggregate + per-user engagement stats
  app.get("/api/admin/analytics", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

    try {
      const allUsers = await storage.getAllUsers();
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Per-user stats
      const userStats = allUsers.map(u => {
        const completedLessons = (u.completedLessons ?? []).length;
        const quizScores = (u.quizScores as Record<string, number>) ?? {};
        const quizValues = Object.values(quizScores);
        const avgQuiz = quizValues.length > 0
          ? Math.round(quizValues.reduce((a, b) => a + b, 0) / quizValues.length)
          : 0;
        const skillLevels = (u.moduleSkillLevels as Record<string, string>) ?? {};
        const highestSkill = Object.values(skillLevels).includes('advanced') ? 'advanced'
          : Object.values(skillLevels).includes('intermediate') ? 'intermediate'
          : 'novice';
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          subscriptionStatus: u.subscriptionStatus,
          lastLoginAt: u.lastLoginAt ?? null,
          lastActiveAt: u.lastActiveAt ?? null,
          loginCount: u.loginCount ?? 0,
          totalMinutesActive: u.totalMinutesActive ?? 0,
          xp: u.xp ?? 0,
          completedLessons,
          avgQuizScore: avgQuiz,
          highestSkillLevel: highestSkill,
        };
      });

      // Platform aggregate
      const totalUsers = allUsers.length;
      const proUsers = allUsers.filter(u => u.subscriptionStatus !== 'free').length;
      const dau = allUsers.filter(u => {
        if (!u.lastActiveAt) return false;
        return now - new Date(u.lastActiveAt).getTime() < oneDayMs;
      }).length;
      const totalXp = userStats.reduce((sum, u) => sum + u.xp, 0);
      const avgXp = totalUsers > 0 ? Math.round(totalXp / totalUsers) : 0;
      const avgLessons = totalUsers > 0
        ? Math.round(userStats.reduce((sum, u) => sum + u.completedLessons, 0) / totalUsers)
        : 0;
      const avgMinutes = totalUsers > 0
        ? Math.round(userStats.reduce((sum, u) => sum + u.totalMinutesActive, 0) / totalUsers)
        : 0;

      return res.json({
        aggregate: { totalUsers, proUsers, dau, avgXp, avgLessons, avgMinutes },
        users: userStats,
      });
    } catch (err: any) {
      console.error('[admin/analytics] error:', err);
      return res.status(500).json({ message: 'Failed to load analytics' });
    }
  });

  // POST /api/admin/backfill-logins — fix users who registered before login tracking was added
  app.post("/api/admin/backfill-logins", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const allUsers = await storage.getAllUsers();
      const toFix = allUsers.filter((u) => !u.lastLoginAt);
      let fixed = 0;
      for (const u of toFix) {
        await storage.updateUserAnalytics(u.id, {
          lastLoginAt: u.lastActiveAt || new Date().toISOString(),
          loginCount: Math.max(u.loginCount ?? 0, 1),
        });
        fixed++;
      }
      return res.json({ fixed, total: allUsers.length });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── AI Explain Endpoint ────────────────────────────────────────────────
  // POST /api/explain
  // Body: { lessonTitle: string, lessonContext: string, mode: 'eli5' | 'apply' | 'lost' }
  // Returns: { explanation: string }
  app.post("/api/explain", requireAuth as any, async (req: Request, res: Response) => {
    const { lessonTitle, lessonContext, mode } = req.body;
    if (!lessonTitle || !lessonContext || !mode) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "AI explanations are not configured yet. Add GEMINI_API_KEY in Railway." });
    }
    const prompts: Record<string, string> = {
      eli5: `You are a friendly teacher explaining DoD acquisitions to someone who just started learning. Explain the following lesson topic in simple, plain English as if the student is completely new to this — use a real-world analogy they can relate to, keep it under 150 words, and avoid jargon.\n\nLesson: ${lessonTitle}\nContext: ${lessonContext}`,
      apply: `You are a seasoned DoD acquisition professional coaching a new Program Manager. For the following lesson topic, give 3-4 concrete, practical examples of how a real PM would apply this knowledge on an active defense program. Be specific — mention contract types, dollar thresholds, regulatory references, or realistic scenarios. Keep it under 200 words.\n\nLesson: ${lessonTitle}\nContext: ${lessonContext}`,
      lost: `You are a patient acquisition mentor. A student is confused about the following topic. First, identify what is typically confusing about it. Then re-explain it from scratch using a different approach — try a step-by-step breakdown, a comparison, or a concrete example. Keep it clear and under 200 words.\n\nLesson: ${lessonTitle}\nContext: ${lessonContext}`,
    };
    // Use raw REST to avoid SDK model-name lock; try models in order of preference
    const modelNames = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
    let lastErr = '';
    for (const modelName of modelNames) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompts[mode] }] }] }),
        });
        const data: any = await resp.json();
        if (resp.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (text) return res.json({ explanation: text });
        }
        lastErr = data?.error?.message ?? `HTTP ${resp.status}`;
        if (resp.status === 429) break; // rate limit — don't try more models
      } catch (err: any) {
        lastErr = err?.message ?? 'fetch error';
      }
    }
    console.error('Gemini explain failed — last error:', lastErr);
    return res.status(500).json({ message: `AI explanation failed: ${lastErr}` });
  });

  // ─── AI List Item Expand ─────────────────────────────────────────────────
  // POST /api/expand-item
  // Body: { item: string, lessonTitle: string, heading?: string }
  // Returns: { detail: string }
  app.post("/api/expand-item", requireAuth as any, async (req: Request, res: Response) => {
    const { item, lessonTitle, heading } = req.body;
    if (!item || !lessonTitle) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "GEMINI_API_KEY not configured" });
    }
    const context = heading ? `Section: ${heading}\nItem: ${item}` : `Item: ${item}`;
    const prompt = `You are a concise DoD acquisitions instructor. Expand on the following bullet point from a lesson titled "${lessonTitle}". Provide 2-4 sentences of practical, specific detail that a defense professional would find genuinely useful — include regulatory citations, dollar thresholds, real examples, or common pitfalls where relevant. Do not repeat the bullet text. Be direct and professional.\n\n${context}`;
    const modelNames = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
    let lastErr = '';
    for (const modelName of modelNames) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data: any = await resp.json();
        if (resp.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (text) return res.json({ detail: text.trim() });
        }
        lastErr = data?.error?.message ?? `HTTP ${resp.status}`;
        if (resp.status === 429) break;
      } catch (err: any) {
        lastErr = err?.message ?? 'fetch error';
      }
    }
    return res.status(500).json({ message: `Failed: ${lastErr}` });
  });

  // GET /api/ai-health — check Gemini key is working (no auth required, for debugging)
  app.get("/api/ai-health", async (_req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ ok: false, reason: 'GEMINI_API_KEY not set', keyPrefix: 'MISSING' });
    const keyPrefix = apiKey.substring(0, 8);
    // Confirmed working models as of March 2026 via ListModels
    const modelCandidates = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
    const attempts = modelCandidates.map(m => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
      label: `v1beta/${m}`
    }));
    const results: Record<string, string> = {};
    for (const { url } of attempts) {
      const label = url.replace(`?key=${apiKey}`, '').replace('https://generativelanguage.googleapis.com/', '');
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Say OK' }] }] }),
        });
        const data: any = await resp.json();
        if (resp.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'no text';
          results[label] = `OK: ${text.trim()}`;
          return res.json({ ok: true, workingEndpoint: label, keyPrefix, allResults: results });
        } else {
          results[label] = `${resp.status}: ${data?.error?.message?.substring(0, 100) ?? 'unknown'}`;
        }
      } catch (err: any) {
        results[label] = `FETCH_ERR: ${err?.message?.substring(0, 80)}`;
      }
    }
    return res.json({ ok: false, reason: 'No endpoints worked', keyPrefix, allResults: results });
  });

  // ── Email lead capture (landing page opt-in) ──────────────────────────────
  app.post("/api/leads", async (req: Request, res: Response) => {
    const { email, source } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email required' });
    }
    try {
      const lead = await storage.saveLead(email.toLowerCase().trim(), source || 'landing_page');
      return res.json({ ok: true, id: lead.id });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to save email' });
    }
  });

  // Admin: view all leads
  app.get("/api/admin/leads", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
    const leads = await storage.getAllLeads();
    return res.json(leads);
  });

  // ── Admin: Stripe Revenue Dashboard ──────────────────────────────────────────────
  app.get("/api/admin/revenue", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
    if (!stripe) return res.status(503).json({ message: 'Stripe not configured' });

    try {
      // Fetch active subscriptions
      const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'active' });
      const allUsers = await storage.getAllUsers();

      const monthlyCustomers = subscriptions.data.filter(s =>
        s.items.data.some(i => i.price.recurring?.interval === 'month')
      );
      const mrr = monthlyCustomers.reduce((sum, s) => {
        const monthlyAmount = s.items.data.reduce((a, i) => a + (i.price.unit_amount ?? 0), 0);
        return sum + monthlyAmount;
      }, 0) / 100; // cents to dollars

      // Lifetime payments (one-time charges)
      const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });
      const lifetimeSales = paymentIntents.data.filter(p => p.status === 'succeeded');
      const lifetimeRevenue = lifetimeSales.reduce((sum, p) => sum + p.amount, 0) / 100;

      // Signups by day (last 30 days from DB)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentSignups = allUsers.filter(u => {
        const reg = new Date(u.registeredAt ?? u.lastLoginAt ?? '');
        return reg >= thirtyDaysAgo;
      });

      // Signups by day (group)
      const signupsByDay: Record<string, number> = {};
      recentSignups.forEach(u => {
        const day = (u.registeredAt ?? u.lastLoginAt ?? '').slice(0, 10);
        if (day) signupsByDay[day] = (signupsByDay[day] ?? 0) + 1;
      });

      // Free to paid conversion
      const totalUsers = allUsers.length;
      const paidUsers = allUsers.filter(u => u.subscriptionStatus !== 'free').length;
      const conversionRate = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0;

      // Lesson completion rates
      const lessonCompletionCounts: Record<string, number> = {};
      allUsers.forEach(u => {
        (u.completedLessons ?? []).forEach((lid: string) => {
          lessonCompletionCounts[lid] = (lessonCompletionCounts[lid] ?? 0) + 1;
        });
      });
      const topLessons = Object.entries(lessonCompletionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, count]) => ({ id, count, pct: Math.round((count / totalUsers) * 100) }));

      return res.json({
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100,
        lifetimeRevenue: Math.round(lifetimeRevenue * 100) / 100,
        totalRevenue: Math.round((mrr + lifetimeRevenue) * 100) / 100,
        activeSubscriptions: monthlyCustomers.length,
        lifetimeSalesCount: lifetimeSales.length,
        totalUsers,
        paidUsers,
        freeUsers: totalUsers - paidUsers,
        conversionRate,
        signupsByDay,
        topLessons,
        recentSignups30d: recentSignups.length,
      });
    } catch (err: any) {
      console.error('[admin/revenue] error:', err);
      return res.status(500).json({ message: err.message });
    }
  });

  // ── Drip email cron endpoint ──────────────────────────────────────────────
  // Called by Railway cron (or any scheduler) every hour via:
  //   GET /api/cron/drip?secret=<CRON_SECRET>
  // Set CRON_SECRET in Railway env vars to protect this endpoint.
  app.get("/api/cron/drip", async (req: Request, res: Response) => {
    const secret = process.env.CRON_SECRET;
    if (secret && req.query.secret !== secret) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
      const users = await storage.getUsersForDrip();
      let processed = 0;
      let sent = 0;
      for (const user of users) {
        const updated = await processDripEmails(
          user.email,
          user.username,
          user.registeredAt,
          user.sentEmailDays
        );
        if (updated.length !== user.sentEmailDays.length) {
          await storage.updateSentEmailDays(user.id, updated);
          sent += updated.length - user.sentEmailDays.length;
        }
        processed++;
      }
      console.log(`[drip] Processed ${processed} users, sent ${sent} emails`);
      return res.json({ processed, sent });
    } catch (err: any) {
      console.error('[drip] Error running drip cron:', err);
      return res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}

// Middleware: expose raw body for Stripe webhook verification
function express_rawBody(
  req: Request,
  res: Response,
  next: () => void
) {
  // rawBody is already captured in server/index.ts via express.json verify
  next();
}
