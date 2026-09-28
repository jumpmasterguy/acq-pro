import crypto from "crypto";
import type { User } from "@shared/schema";
import { storage } from "./storage";
import { sendPasswordResetEmail } from "./email";

/**
 * Email this user a one-hour, single-use link to set a new password.
 * Shared by "Forgot password?" and the admin "Send reset email" button.
 * Throws if the email can't be sent, so the caller decides what to say.
 */
export async function issuePasswordReset(user: User): Promise<void> {
  // Raw token goes in the email and nowhere else; only its hash is stored.
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await storage.consumePasswordResetTokens(user.id); // a new link kills the old one
  await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

  const appUrl = process.env.APP_URL || "https://acqlerate.com";
  const resetUrl = `${appUrl}/app#/reset-password?token=${token}`;
  // A Google-created account has no password hash: this is a first
  // password, not a reset, and the email says so.
  await sendPasswordResetEmail(user.email, user.firstName || user.username, resetUrl, !user.passwordHash);
}
