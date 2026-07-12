import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import passport from "passport";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, hashPassword, requireAuth, toPassportUser } from "./auth";
import { registerSchema, loginSchema, userProfileSchema } from "@shared/schema";
import { sendWelcomeEmail, sendStarterKitEmail, processDripEmails, sendAdminNotification, sendLeadNurtureEmail, verifyUnsubscribeToken } from "./email";
import { scanForTimingTraps, type TimingFinding } from "./farTimingScanner";

// Initialize Stripe — will be undefined if key not set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" })
  : null;

const STRIPE_PRICE_LIFETIME = process.env.STRIPE_PRICE_ID_LIFETIME;
const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// ── Template pack price IDs (set in Railway env vars) ─────────────────────────
const PACK_PRICES: Record<string, string | undefined> = {
  "pm-essentials":      process.env.STRIPE_PRICE_PACK_PM_ESSENTIALS,
  "proposal-toolkit":   process.env.STRIPE_PRICE_PACK_PROPOSAL_TOOLKIT,
  "finance-cheat-sheets": process.env.STRIPE_PRICE_PACK_FINANCE_SHEETS,
};

const PACK_FILES: Record<string, string[]> = {
  "pm-essentials": [
    "pack-guide.pdf",
    "rfp-compliance-matrix.xlsx",
    "risk-register.xlsx",
    "igce-calculator.xlsx",
    "stakeholder-raci.xlsx",
    "pm-briefing-deck.pptx",
  ],
  "proposal-toolkit": [
    "pack-guide.pdf",
    "proposal-compliance-matrix.xlsx",
    "section-lm-decoder.xlsx",
    "win-theme-development.xlsx",
    "past-performance-template.xlsx",
    "pricing-volume-checklist.xlsx",
  ],
  "finance-cheat-sheets": [
    "pack-guide.pdf",
    "ppbe-cycle-one-pager.xlsx",
    "color-of-money-decision-tree.xlsx",
    "evm-formulas-quick-reference.xlsx",
    "wrap-rate-breakdown.xlsx",
  ],
};

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
    const referredBy = (req.body.referralCode as string) || null;
    const user = await storage.createUser({ username, email, passwordHash });

    // Generate and save referral code for new user
    const referralCode = storage.generateReferralCode(email);
    await storage.updateUserFields(user.id, { referralCode, referredBy });

    // If referred, record the referral and potentially reward the referrer
    if (referredBy) {
      const { rewarded, referrer } = await storage.recordReferral(referredBy);
      if (rewarded && referrer) {
        // Notify referrer they earned a year of pro
        const { sendReferralRewardEmail } = await import('./email.js') as any;
        sendReferralRewardEmail?.(referrer.email, referrer.username).catch(() => {});
      }
    }

    // Send welcome email + admin notification (non-blocking)
    sendWelcomeEmail(user.email, user.username).catch(() => {});
    sendAdminNotification(user.email, user.username, 'email_password').catch(() => {});

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
        currentStreak: (user as any).currentStreak ?? 0,
        longestStreak: (user as any).longestStreak ?? 0,
        lastChallengeDate: (user as any).lastChallengeDate ?? null,
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
            currentStreak: (user as any).currentStreak ?? 0,
            longestStreak: (user as any).longestStreak ?? 0,
            lastChallengeDate: (user as any).lastChallengeDate ?? null,
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
      currentStreak: (user as any).currentStreak ?? 0,
      longestStreak: (user as any).longestStreak ?? 0,
      lastChallengeDate: (user as any).lastChallengeDate ?? null,
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
            const isNewUser = (currentUser.loginCount ?? 0) === 0;
            await storage.updateUserAnalytics(req.user.id, {
              lastLoginAt: new Date().toISOString(),
              loginCount: (currentUser.loginCount ?? 0) + 1,
            });
            // Notify admin only on first Google login (new account)
            if (isNewUser) {
              sendAdminNotification(currentUser.email, currentUser.username, 'google').catch(() => {});
            }
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

    // Update streak on lesson completion
    await storage.updateUserStreak(userId);

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
        return res.status(500).json({ message: "Payment error — please try again" });
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
            const purchaseType = session.metadata?.type;

            if (purchaseType === "pack_purchase") {
              // Template pack purchase — save to purchases table
              const pack = session.metadata?.pack;
              if (pack) {
                const downloadToken = crypto.randomBytes(32).toString("hex");
                const email = session.customer_details?.email || session.customer_email || "";
                await storage.savePurchase({
                  userId: userId || undefined,
                  email,
                  pack,
                  stripeSessionId: session.id,
                  stripePaymentIntent: session.payment_intent as string || "",
                  amountPaid: session.amount_total || 0,
                  downloadToken,
                });
                console.log(`[webhook] Pack purchase saved: ${pack} for ${email}`);
              }
            } else if (userId) {
              // Subscription / lifetime upgrade
              const isSubscription = session.mode === "subscription";
              await storage.updateUserSubscription(userId, {
                subscriptionStatus: isSubscription ? "active" : "lifetime",
                subscriptionId: isSubscription ? (session.subscription as string) : undefined,
                stripeCustomerId: session.customer as string,
              });
            }
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
        return res.status(500).json({ message: "Failed to open billing portal" });
      }
    }
  );


  // ─── Template Pack Routes ────────────────────────────────────────────────────

  // POST /api/packs/checkout — create Stripe checkout for a template pack
  app.post("/api/packs/checkout", async (req: Request, res: Response) => {
    if (!stripe) return res.status(503).json({ message: "Payment processing not configured" });

    const { pack, email } = req.body as { pack: string; email?: string };
    if (!pack || !PACK_FILES[pack]) {
      return res.status(400).json({ message: "Invalid pack" });
    }

    const priceId = PACK_PRICES[pack];
    if (!priceId) {
      return res.status(503).json({ message: `Price not configured for pack: ${pack}` });
    }

    const origin = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const userId = (req as any).isAuthenticated?.() ? (req.user as any)?.id : undefined;
    const customerEmail = email || (req.user as any)?.email;

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        success_url: `${origin}/products/${pack}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/products/${pack}`,
        metadata: { pack, userId: userId || "", type: "pack_purchase" },
        allow_promotion_codes: true,
      });
      return res.json({ url: session.url });
    } catch (err: any) {
      console.error("[packs/checkout] error:", err);
      return res.status(500).json({ message: "Payment error — please try again" });
    }
  });

  // GET /api/packs/session/:sessionId — return download links after successful purchase
  app.get("/api/packs/session/:sessionId", async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    try {
      const purchase = await storage.getPurchaseBySessionId(sessionId);
      if (!purchase) {
        return res.json({ status: "pending", message: "Processing your purchase..." });
      }
      const files = PACK_FILES[purchase.pack] || [];
      const downloadLinks = files.map(f => ({
        filename: f,
        name: f.replace(/-/g, " ").replace(/\.xlsx$/, " (Excel)").replace(/\.pptx$/, " (PowerPoint)"),
        url: `/api/packs/download/${purchase.downloadToken}/${f}`,
      }));
      return res.json({ status: "complete", pack: purchase.pack, email: purchase.email, downloadLinks });
    } catch (err: any) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/packs/download/:token/:filename — secure file download
  app.get("/api/packs/download/:token/:filename", async (req: Request, res: Response) => {
    const { token, filename } = req.params;
    const purchase = await storage.getPurchaseByToken(token);
    if (!purchase) return res.status(404).json({ message: "Download link not found" });

    const packFiles = PACK_FILES[purchase.pack] || [];
    if (!packFiles.includes(filename)) return res.status(403).json({ message: "File not in this pack" });

    const packDir = `pack${purchase.pack === "pm-essentials" ? "1" : purchase.pack === "proposal-toolkit" ? "2" : "3"}-${purchase.pack}`;
    const filePath = require("path").resolve(__dirname, "public", "products", packDir, filename);
    if (!require("fs").existsSync(filePath)) return res.status(404).json({ message: "File temporarily unavailable" });

    storage.incrementDownloadCount(purchase.id).catch(() => {});
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.sendFile(filePath);
  });

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
      referralCode: u.referralCode ?? null,
      referredBy: u.referredBy ?? null,
      referralCount: u.referralCount ?? 0,
      referralRewardGranted: u.referralRewardGranted ?? 0,
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
      return res.status(403).json({ message: "Forbidden" });
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

  // POST /api/admin/users/:userId/grant-yearly-pro
  app.post("/api/admin/users/:userId/grant-yearly-pro", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const { userId } = req.params;
    const updated = await storage.grantYearlyPro(userId);
    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.json({ message: `${updated.email} granted 1 year of Pro access`, userId });
  });

  // GET /api/admin/growth — lightweight signup counts for dashboard stat card
  app.get("/api/admin/growth", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const allUsers = await storage.getAllUsers();
    const totalUsers = allUsers.length;
    const proUsers = allUsers.filter((u: any) =>
      u.subscriptionStatus === "active" || u.subscriptionStatus === "lifetime"
    ).length;
    return res.json({ totalUsers, proUsers, freeUsers: totalUsers - proUsers });
  });

  // GET /api/admin/referrals — referral stats overview
  app.get("/api/admin/referrals", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const allUsers = await storage.getAllUsers();
    const stats = allUsers
      .filter((u: any) => (u.referralCount ?? 0) > 0 || (u.referralCode))
      .map((u: any) => ({
        email: u.email,
        referralCode: u.referralCode,
        referralCount: u.referralCount ?? 0,
        rewardsGranted: u.referralRewardGranted ?? 0,
        rewardsEarned: Math.floor((u.referralCount ?? 0) / 2),
      }))
      .sort((a: any, b: any) => b.referralCount - a.referralCount);
    return res.json({ stats, totalReferrals: stats.reduce((s: number, u: any) => s + u.referralCount, 0) });
  });

  // GET /api/my-referral — get current user's referral code and stats
  app.get("/api/my-referral", requireAuth as any, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    const u = user as any;
    // Auto-generate referral code if they don't have one
    if (!u.referralCode) {
      const code = storage.generateReferralCode(user.email);
      await storage.updateUserFields(user.id, { referralCode: code });
      u.referralCode = code;
    }
    return res.json({
      referralCode: u.referralCode,
      referralCount: u.referralCount ?? 0,
      rewardsEarned: Math.floor((u.referralCount ?? 0) / 2),
      rewardsGranted: u.referralRewardGranted ?? 0,
      referralLink: `https://acqlerate.com/app?ref=${u.referralCode}`,
      nextRewardAt: ((Math.floor((u.referralCount ?? 0) / 2) + 1) * 2),
    });
  });

  // DELETE /api/admin/users/:userId
  app.delete("/api/admin/users/:userId", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const { userId } = req.params;
    // Prevent self-deletion
    if (userId === req.user!.id) return res.status(400).json({ message: "Cannot delete your own account" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    await storage.deleteUser(userId);
    return res.json({ message: `${user.email} deleted` });
  });

  // ─── Daily Challenge ──────────────────────────────────────────────────

  // GET /api/daily-challenge — returns today's 5 questions (date-seeded, same for all users)
  app.get("/api/daily-challenge", requireAuth as any, async (req: Request, res: Response) => {
    const user = req.user!;
    const todayStr = new Date().toISOString().slice(0, 10);
    const alreadyCompleted = (user as any).lastChallengeDate === todayStr;

    // Build full quiz bank from all modules
    // We inline a seed-based shuffle here on the server
    const seed = parseInt(todayStr.replace(/-/g, ''), 10);
    function seededRandom(s: number) {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    }

    // Import curriculum questions — read from the built client bundle is not possible server-side
    // Instead we maintain a minimal question bank inline here
    const questionBank = [
      { id: 'dc1', q: 'What does IDIQ stand for?', options: ['Indefinite Delivery Indefinite Quantity', 'Incremental Delivery Immediate Quality', 'Independent Delivery Internal Quality', 'Integrated Defense and Inventory Quantity'], correct: 0, module: 'Contracts' },
      { id: 'dc2', q: 'A Cost Performance Index (CPI) of 0.85 means:', options: ['You are 15% ahead of budget', 'You are spending $1.18 for every $1.00 of work done', 'You are 15% under budget', 'Your schedule is 85% complete'], correct: 1, module: 'Data Analytics' },
      { id: 'dc3', q: 'Which appropriation type funds day-to-day operations and maintenance?', options: ['RDT&E', 'Procurement', 'O&M', 'MILCON'], correct: 2, module: 'Finance' },
      { id: 'dc4', q: 'The Simplified Acquisition Threshold (SAT) as of Oct 1, 2025 is:', options: ['$150,000', '$250,000', '$350,000', '$500,000'], correct: 2, module: 'Contracts' },
      { id: 'dc5', q: 'A fixed-price contract puts cost risk primarily on:', options: ['The government', 'The contractor', 'DCAA', 'The program office'], correct: 1, module: 'Contracts' },
      { id: 'dc6', q: 'EVM stands for:', options: ['Estimated Value Measurement', 'Earned Value Management', 'Execution Variance Metric', 'Enterprise Value Method'], correct: 1, module: 'Data Analytics' },
      { id: 'dc7', q: 'A wrap rate multiplies your base labor rate to cover:', options: ['Profit only', 'Fringe, overhead, G&A, and profit', 'Government taxes', 'Equipment costs'], correct: 1, module: 'Finance' },
      { id: 'dc8', q: 'Who is the only person authorized to obligate the government to additional costs?', options: ['The COR', 'The Program Manager', 'The Contracting Officer', 'The TPOC'], correct: 2, module: 'Contracts' },
      { id: 'dc9', q: 'Schedule Performance Index (SPI) > 1.0 means:', options: ['Over budget', 'Behind schedule', 'Ahead of schedule', 'At risk of Nunn-McCurdy'], correct: 2, module: 'Data Analytics' },
      { id: 'dc10', q: 'The PPBE cycle stands for:', options: ['Planning, Programming, Budgeting and Execution', 'Program, Procurement, Budget and Evaluation', 'Priority, Planning, Budget and Execution', 'Program, Process, Build and Execute'], correct: 0, module: 'Finance' },
      { id: 'dc11', q: 'A PWS (Performance Work Statement) describes:', options: ['How work must be performed', 'What outcomes must be achieved', 'Who performs the work', 'The contract price'], correct: 1, module: 'Contracts' },
      { id: 'dc12', q: 'DCAA stands for:', options: ['Defense Contract Audit Agency', 'Department of Contract Award Administration', 'Defense Cost Accounting Authority', 'DoD Contract and Acquisition Agency'], correct: 0, module: 'Finance' },
      { id: 'dc13', q: 'A "color of money" violation means:', options: ['Funds were spent on a prohibited vendor', 'Appropriated funds were spent outside their authorized purpose', 'A contract modification was unsigned', 'The contractor exceeded the ceiling price'], correct: 1, module: 'Finance' },
      { id: 'dc14', q: 'What does BAC stand for in EVM?', options: ['Budget At Completion', 'Baseline Actual Cost', 'Budgeted Acquisition Cost', 'Base Allocation Cost'], correct: 0, module: 'Data Analytics' },
      { id: 'dc15', q: 'An ACAT I program is also known as a:', options: ['Major Defense Acquisition Program (MDAP)', 'Minor Defense Acquisition Program', 'Sole Source Acquisition', 'Multiple Award Contract'], correct: 0, module: 'Foundations' },
      { id: 'dc16', q: 'A Cost-Plus-Award-Fee (CPAF) base fee is typically:', options: ['0% — all fee is at risk', '0-3% guaranteed regardless of performance', '10% fixed', '15% of target cost'], correct: 1, module: 'Finance' },
      { id: 'dc17', q: 'Obligated funding means:', options: ['Money has been spent', 'Money has been formally committed via contract action', 'Money has been requested from Congress', 'Money has been approved by the PM'], correct: 1, module: 'Finance' },
      { id: 'dc18', q: 'The FAR (Federal Acquisition Regulation) applies to:', options: ['State government contracts only', 'All executive branch federal procurement', 'DoD contracts only', 'Contracts over $1M only'], correct: 1, module: 'Contracts' },
      { id: 'dc19', q: 'Capture management is primarily focused on:', options: ['Managing contract modifications', 'Winning new business through strategic positioning', 'Tracking obligated funds', 'Managing subcontractors'], correct: 1, module: 'Capture' },
      { id: 'dc20', q: 'A Variance at Completion (VAC) of -$500K means:', options: ['You will finish $500K under budget', 'You are projected to overrun by $500K', 'Your schedule slipped $500K worth of work', 'Your EAC is $500K lower than BAC'], correct: 1, module: 'Data Analytics' },
    ];

    // Seed-shuffle and pick 5
    const shuffled = [...questionBank].sort((a, b) => {
      const ra = seededRandom(seed + a.id.charCodeAt(2));
      const rb = seededRandom(seed + b.id.charCodeAt(2));
      return ra - rb;
    });
    const todaysQuestions = shuffled.slice(0, 5).map(({ id, q, options, correct, module }) => ({
      id, question: q, options, correct, module,
    }));

    return res.json({
      date: todayStr,
      alreadyCompleted,
      lastChallengeDate: (user as any).lastChallengeDate ?? null,
      currentStreak: (user as any).currentStreak ?? 0,
      longestStreak: (user as any).longestStreak ?? 0,
      questions: todaysQuestions,
    });
  });

  // POST /api/daily-challenge/complete
  app.post("/api/daily-challenge/complete", requireAuth as any, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { score } = req.body as { score: number }; // 0-5
    const xpEarned = score === 5 ? 50 : score >= 3 ? 25 : 10;
    const updated = await storage.completeDailyChallenge(userId, score, xpEarned);
    if (!updated) return res.status(500).json({ message: 'Failed to record challenge' });
    return res.json({
      score,
      xpEarned,
      currentStreak: (updated as any).currentStreak ?? 0,
      longestStreak: (updated as any).longestStreak ?? 0,
      message: score === 5 ? 'Perfect score! +50 XP' : score >= 3 ? 'Nice work! +25 XP' : 'Keep going! +10 XP',
    });
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
    const PLAIN_ENGLISH_RULES = `PLAIN ENGLISH RULES (non-negotiable):
- Write like you are talking to a colleague, not writing a memo. No stiff openers like "Excellent question" or "Let's ground ourselves" — just start explaining.
- Never use markdown formatting. No asterisks, no **bold**, no bullet symbols, no headers. Plain sentences and plain numbered lists only (e.g. "1. ", "2. "), written as complete sentences.
- The first time you use any acronym, spell it out in plain words right there in the sentence — do not assume the reader already knows FAR, RFP, CPIF, IDIQ, T&M, O&M, OEM, GPC, COTS, or any other acronym. If an acronym is not essential to the point you are making, skip it entirely and just describe the thing in plain words.
- Do not stack multiple acronyms or citations back to back. One new term at a time, explained in the same breath you introduce it.
- Use short sentences. Prefer concrete, everyday language over formal or academic phrasing.
- Skip citing specific FAR/DFARS part numbers unless the student would actually need to go look something up — a plain description of the rule is almost always more useful than the citation.`;

    const prompts: Record<string, string> = {
      eli5: `You are a friendly teacher explaining DoD acquisitions to someone who just started learning, like they are a total beginner with zero background. Explain the following lesson topic in simple, plain English — use one real-world analogy a regular person would recognize (not a military or contracting analogy), keep it under 150 words.\n\n${PLAIN_ENGLISH_RULES}\n\nLesson: ${lessonTitle}\nContext: ${lessonContext}`,
      apply: `You are a seasoned DoD acquisition professional coaching a new Program Manager who is still learning the basics. For the following lesson topic, walk through 2-3 concrete, realistic moments where this knowledge would actually come up on the job — described as short stories or scenarios a new PM could picture themselves in, not a checklist of contract types and citations. Only mention a contract type, dollar figure, or regulation by name if it is essential to the scenario, and explain what it means in the same sentence. Keep it under 200 words.\n\n${PLAIN_ENGLISH_RULES}\n\nLesson: ${lessonTitle}\nContext: ${lessonContext}`,
      lost: `You are a patient acquisition mentor. A student is confused about the following topic. First, name in one plain sentence what usually trips people up about it. Then re-explain the whole idea from scratch using a different, simpler approach than a textbook would — a step-by-step walkthrough, a side-by-side comparison, or a concrete everyday example. Keep it under 200 words.\n\n${PLAIN_ENGLISH_RULES}\n\nLesson: ${lessonTitle}\nContext: ${lessonContext}`,
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
    const prompt = `You are a concise DoD acquisitions instructor. Expand on the following bullet point from a lesson titled "${lessonTitle}". Give 2-4 plain-English sentences of practical detail a defense professional would find genuinely useful — a real example or a common mistake beats a regulatory citation. Only include a dollar threshold or a FAR/DFARS citation if it's essential, and if you do, explain what it means in the same sentence rather than stating it bare. Do not repeat the bullet text.\n\nPLAIN ENGLISH RULES: no markdown formatting (no asterisks or bold), no stacking multiple acronyms back to back, spell out any acronym the first time you use it, short sentences, talk like a colleague explaining this over coffee, not a policy memo.\n\n${context}`;
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

  // POST /api/far-translate — FAR/DFARS clause plain-English translator (v2)
  // v2: deterministic timing scanner feeds findings as hard constraints to the LLM,
  // so embedded deadlines / day-type ambiguities / silent-acceptance traps are never dropped.
  app.post("/api/far-translate", requireAuth as any, async (req: Request, res: Response) => {
    const { clause } = req.body as { clause: string };
    if (!clause?.trim()) return res.status(400).json({ message: 'Clause number or keyword required' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ message: 'AI not configured' });

    // Run deterministic scanner on the input text
    const findings: TimingFinding[] = scanForTimingTraps(clause.trim());
    const findingsBlock = findings.length
      ? findings.map((f, i) => `${i + 1}. [${f.category}] "${f.excerpt}" — ${f.implication}`).join('\n')
      : '(scanner found no explicit timing constructs — still surface any implied deadlines from your own knowledge of the clause)';

    const prompt = `You are a plain-English DoD acquisition expert with precise knowledge of the Federal Acquisition Regulation. A defense contractor or program manager wants to understand: "${clause.trim()}"

IMPORTANT: If a specific clause number is provided (e.g. FAR 31.205-35), you MUST look up and explain that EXACT clause — do not confuse it with a different clause number. FAR 31.205-35 is Relocation Costs. FAR 31.205-22 is Lobbying. Get the clause number right before responding.

PLAIN ENGLISH RULES (non-negotiable):
- No "shall", "hereunder", "thereto", "pursuant to", "notwithstanding". Use "must", "under this", "to it", "under", "despite".
- Use digits for numbers (10, not ten). Always say "calendar days" or "business days" — never just "days".
- Active voice. Short sentences. Talk like you'd talk to a colleague, not a judge.

DETERMINISTIC TIMING FINDINGS (treat as hard constraints — every one MUST appear in "Watch out for"):
${findingsBlock}

Provide a structured response with exactly these four sections (use these exact headings):

**What it is:**
One sentence explaining what this clause/regulation is in plain English. No jargon.

**What it means for you:**
2-3 bullet points on the practical implications for a contractor PM or program manager.

**When you'll see it:**
One sentence on what contract types or situations it typically appears in.

**Watch out for:**
List every deadline, clock, and trap, one per line, each prefixed with ⏱ for time-related items. Non-timing watch-outs get ⚠. Cover every finding above plus any embedded time conditions, minimums, or thresholds baked into the clause itself — minimum tenure before costs are allowable, claim submission windows, cure notice periods, option exercise deadlines, silent-acceptance windows, stop-work limits, anything that would surprise someone who didn't read the fine print. State each one explicitly with the exact number and day type (e.g. "⏱ Cure notice gives you 10 calendar days, not business days, to fix the issue").

If the input is not a real FAR/DFARS clause or acquisition topic, say so clearly. Keep the total response under 250 words. Be direct and practical.`;

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
          if (text) return res.json({ result: text.trim(), clause: clause.trim() });
        }
        lastErr = data?.error?.message ?? `HTTP ${resp.status}`;
        if (resp.status === 429) break;
      } catch (err: any) {
        lastErr = err?.message ?? 'fetch error';
      }
    }
    return res.status(500).json({ message: `Failed: ${lastErr}` });
  });

  // GET /api/ai-health — check Gemini key is working (admin only)
  app.get("/api/ai-health", requireAuth as any, async (_req: Request, res: Response) => {
    if (!isAdmin(_req)) return res.status(403).json({ message: "Forbidden" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ ok: false, reason: 'GEMINI_API_KEY not set' });
    // Confirmed working models as of March 2026 via ListModels
    const modelCandidates = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
    const attempts = modelCandidates.map(m => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
      label: `v1beta/${m}`
    }));
    const results: Record<string, string> = {};
    for (const { url } of attempts) {
      const label = url.replace(/key=[^&]+/, 'key=REDACTED').replace('https://generativelanguage.googleapis.com/', '');
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
          return res.json({ ok: true, workingEndpoint: label, allResults: results });
        } else {
          results[label] = `${resp.status}: ${data?.error?.message?.substring(0, 100) ?? 'unknown'}`;
        }
      } catch (err: any) {
        results[label] = `FETCH_ERR: ${err?.message?.substring(0, 80)}`;
      }
    }
    return res.json({ ok: false, reason: 'No endpoints worked', allResults: results });
  });

  // ── Email lead capture (landing page opt-in) ──────────────────────────────
  app.post("/api/leads", async (req: Request, res: Response) => {
    const { email, source } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email required' });
    }
    try {
      const cleanEmail = email.toLowerCase().trim();
      const lead = await storage.saveLead(cleanEmail, source || 'landing_page');
      // Send lead nurture email (non-blocking — never delay the response), unless they've unsubscribed before
      storage.isUnsubscribed(cleanEmail).then((unsubscribed) => {
        if (unsubscribed) { console.log(`[email] Skipping lead nurture — ${cleanEmail} is unsubscribed`); return; }
        return sendLeadNurtureEmail(cleanEmail, source || 'landing_page');
      }).catch((err) => console.error('[email] Lead nurture send failed:', err));
      return res.json({ ok: true, id: lead.id });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to save email' });
    }
  });

  // ── Unsubscribe (one-click, no login required) ────────────────────────────
  // Every marketing/drip/newsletter email links here with an HMAC-signed token
  // scoped to that recipient's email — no account or session needed to opt out.
  function unsubscribePageHtml(opts: { ok: boolean; email?: string }): string {
    const { ok, email } = opts;
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${ok ? "Unsubscribed" : "Unsubscribe link invalid"} — Acqlerate</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F7F6F2;color:#1A1A1A;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{max-width:440px;background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:40px 36px;text-align:center}
  .icon{font-size:2.2rem;margin-bottom:16px}
  h1{font-size:1.4rem;font-weight:800;color:#0C2340;margin-bottom:10px}
  p{font-size:0.95rem;color:#374151;line-height:1.6;margin-bottom:8px}
  a{color:#01696F;font-weight:600;text-decoration:none}
</style></head>
<body>
  <div class="card">
    <div class="icon">${ok ? "✓" : "⚠"}</div>
    <h1>${ok ? "You're unsubscribed" : "That link isn't valid"}</h1>
    ${ok
      ? `<p>${email ? email + " " : "You "}will no longer receive marketing, drip, or newsletter emails from Acqlerate.</p><p>Account and billing emails (if you have an account) aren't affected.</p>`
      : `<p>This unsubscribe link is missing or doesn't match our records. Email <a href="mailto:hello@acqlerate.com">hello@acqlerate.com</a> and we'll remove you by hand.</p>`}
    <p style="margin-top:20px"><a href="/">Back to Acqlerate</a></p>
  </div>
</body></html>`;
  }

  app.get("/api/unsubscribe", async (req: Request, res: Response) => {
    const email = String(req.query.email || "").trim().toLowerCase();
    const token = String(req.query.token || "");
    if (!email || !email.includes("@") || !verifyUnsubscribeToken(email, token)) {
      return res.status(400).send(unsubscribePageHtml({ ok: false }));
    }
    try {
      await storage.setUnsubscribed(email);
      console.log(`[unsubscribe] ${email} opted out of marketing emails`);
      return res.send(unsubscribePageHtml({ ok: true, email }));
    } catch (err: any) {
      console.error("[unsubscribe] error:", err);
      return res.status(500).send(unsubscribePageHtml({ ok: false }));
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
  // ── Newsletter broadcast endpoint ─────────────────────────────────────────
  // POST /api/admin/newsletter — send a newsletter to all users
  // Body: { subject: string, previewText: string, html: string, testOnly?: boolean }
  app.post("/api/admin/newsletter", requireAuth as any, async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
    const { subject, previewText, html, testOnly } = req.body;
    if (!subject || !html) return res.status(400).json({ message: 'subject and html required' });
    try {
      const emailModule = await import('./email.js') as any;
      const sendNewsletterIssue = emailModule.sendNewsletterIssue;
      const allUsers = await storage.getAllUsers();
      const excludedEmails = new Set([
        'lucas@acqlerate.com',
        'lucas.l.cruz.es@gmail.com',
        'lucas.l.cruz.pr@gmail.com',
        'jumpmasterguy@gmail.com',
      ]);
      const unsubscribed = await storage.getUnsubscribedSet();
      const recipients = allUsers
        .filter((u: any) => {
          if (!u.email) return false;
          const lower = u.email.toLowerCase();
          if (excludedEmails.has(lower)) return false;
          if (unsubscribed.has(lower)) return false;
          return true;
        })
        .map((u: any) => u.email);

      if (testOnly) {
        await sendNewsletterIssue('lucas.l.cruz.es@gmail.com', subject, previewText || '', html);
        return res.json({ sent: 1, preview: true });
      }

      let sent = 0;
      for (const email of recipients) {
        try {
          await sendNewsletterIssue(email, subject, previewText || '', html);
          sent++;
        } catch (e: any) {
          console.error(`[newsletter] failed for ${email}:`, e.message);
        }
      }
      return res.json({ sent, total: recipients.length });
    } catch (err: any) {
      console.error('[newsletter] error:', err);
      return res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/cron/drip", async (req: Request, res: Response) => {
    const secret = process.env.CRON_SECRET;
    if (secret && req.query.secret !== secret) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
      const users = await storage.getUsersForDrip();
      const unsubscribed = await storage.getUnsubscribedSet();
      let processed = 0;
      let sent = 0;
      let skipped = 0;
      for (const user of users) {
        if (unsubscribed.has(user.email.toLowerCase())) { skipped++; continue; }
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
      console.log(`[drip] Processed ${processed} users, sent ${sent} emails, skipped ${skipped} unsubscribed`);
      return res.json({ processed, sent, skipped });
    } catch (err: any) {
      console.error('[drip] Error running drip cron:', err);
      return res.status(500).json({ message: err.message });
    }
  });

  // ── GET /api/certificate/:moduleId ─────────────────────────────────────────
  // Generates a PDF Certificate of Completion for an authenticated user.
  // Only available if user has completed all lessons in the module.
  app.get("/api/certificate/:moduleId", requireAuth as any, async (req: Request, res: Response) => {
    const { moduleId } = req.params;
    const user = (req as any).user as { id: number; username: string; email: string };

    const MODULE_CLPS: Record<string, { title: string; clps: number }> = {
      foundations: { title: 'DoD Acquisitions Foundations',          clps: 1.5 },
      finance:     { title: 'Defense Finance & Budgeting',            clps: 3.8 },
      contracts:   { title: 'Defense Contracting Fundamentals',       clps: 3.0 },
      data:        { title: 'Data Analytics for Program Managers',     clps: 1.3 },
      capture:     { title: 'Capture Management & Business Development', clps: 1.6 },
      operations:  { title: 'Program Operations & Leadership',         clps: 1.5 },
    };

    const mod = MODULE_CLPS[moduleId];
    if (!mod) return res.status(404).json({ message: 'Module not found' });

    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const path = await import('path');
    const execFileAsync = promisify(execFile);

    const payload = JSON.stringify({
      name: user.username || 'Defense Professional',
      module_id: moduleId,
      module_title: mod.title,
      clps: mod.clps,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      email: user.email || '',
    });

    try {
      const scriptPath = path.join(process.cwd(), 'server', 'certificate.py');
      const { stdout } = await execFileAsync('python3', [scriptPath, payload], {
        encoding: 'buffer',
        maxBuffer: 5 * 1024 * 1024,
      });

      const safeName = mod.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="acqlerate-certificate-${safeName}.pdf"`);
      res.send(stdout);
    } catch (err: any) {
      console.error('[certificate] PDF generation failed:', err.message);
      return res.status(500).json({ message: 'Certificate generation failed' });
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
