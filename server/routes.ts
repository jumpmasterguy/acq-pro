import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, hashPassword, requireAuth, toPassportUser } from "./auth";
import { registerSchema, loginSchema } from "@shared/schema";
import { sendWelcomeEmail } from "./email";

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
  // Setup passport + sessions
  setupAuth(app);

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
    req.login(toPassportUser(user), (err) => {
      if (err) return res.status(500).json({ message: "Login failed after registration" });
      return res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        completedLessons: user.completedLessons ?? [],
        quizScores: user.quizScores ?? {},
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
        req.login(user, (loginErr) => {
          if (loginErr) return res.status(500).json({ message: "Session error" });
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
    });
  });

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
        let customerId = req.user!.stripeCustomerId;
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
        const successUrl = `${origin}/#/dashboard?payment=success`;
        const cancelUrl = `${origin}/#/upgrade?payment=cancelled`;

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

      const customerId = req.user!.stripeCustomerId;
      if (!customerId) {
        return res.status(400).json({ message: "No billing account found" });
      }

      try {
        const origin =
          process.env.APP_URL ||
          `${req.protocol}://${req.get("host")}`;
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
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
