import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Sender address — update to your verified domain once you set one up in Resend
// For now uses Resend's shared domain for testing
const FROM = process.env.EMAIL_FROM || "AcqPro <onboarding@resend.dev>";

export async function sendWelcomeEmail(
  to: string,
  username: string
): Promise<void> {
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to AcqPro</title>
  <style>
    body { margin: 0; padding: 0; background: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1e3a5f; padding: 40px 48px 32px; text-align: center; }
    .header-logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .logo-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.15); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; }
    .logo-text { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header h1 { color: #f5c842; font-size: 28px; font-weight: 800; margin: 16px 0 8px; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.75); font-size: 15px; margin: 0; }
    .body { padding: 40px 48px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1a2942; margin-bottom: 12px; }
    .intro { font-size: 15px; color: #4a5568; line-height: 1.7; margin-bottom: 28px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1e3a5f; margin-bottom: 16px; }
    .modules { display: grid; gap: 12px; margin-bottom: 32px; }
    .module-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; display: flex; align-items: flex-start; gap: 14px; }
    .module-icon { font-size: 24px; line-height: 1; flex-shrink: 0; margin-top: 2px; }
    .module-name { font-size: 14px; font-weight: 700; color: #1a2942; margin-bottom: 3px; }
    .module-desc { font-size: 13px; color: #64748b; line-height: 1.5; }
    .cta-box { background: linear-gradient(135deg, #1e3a5f, #2d5282); border-radius: 12px; padding: 28px 32px; text-align: center; margin-bottom: 32px; }
    .cta-box p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0 0 20px; line-height: 1.6; }
    .cta-btn { display: inline-block; background: #f5c842; color: #1e3a5f; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; letter-spacing: 0.2px; }
    .tip-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin-bottom: 28px; }
    .tip-box strong { color: #92400e; font-size: 13px; }
    .tip-box p { color: #78350f; font-size: 13px; line-height: 1.6; margin: 4px 0 0; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 48px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.6; }
    .footer a { color: #1e3a5f; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">
        <span class="logo-icon">🛡️</span>
        <span class="logo-text">AcqPro</span>
      </div>
      <h1>Welcome to AcqPro</h1>
      <p>Defense Acquisitions Academy</p>
    </div>

    <div class="body">
      <div class="greeting">Hi ${username},</div>
      <p class="intro">
        You've just taken a meaningful step toward mastering one of the most complex — and rewarding — career fields in the federal government and defense industry. Whether you're transitioning from the military, pivoting from the private sector, or deepening your existing acquisition expertise, AcqPro was built specifically for you.
      </p>

      <div class="section-title">What's waiting for you</div>
      <div class="modules">
        <div class="module-card">
          <span class="module-icon">🏛️</span>
          <div>
            <div class="module-name">DoD Acquisitions Foundations — Free</div>
            <div class="module-desc">The FAR, DFARS, acquisition lifecycle, ACAT categories, and the Adaptive Acquisition Framework. Start here — it's on us.</div>
          </div>
        </div>
        <div class="module-card">
          <span class="module-icon">💰</span>
          <div>
            <div class="module-name">Defense Finance & Budgeting</div>
            <div class="module-desc">PPBE cycles, color of money, EVM, Nunn-McCurdy, and per-service appropriation accounts (Air Force 3400, Army 2400, Navy 1611).</div>
          </div>
        </div>
        <div class="module-card">
          <span class="module-icon">📋</span>
          <div>
            <div class="module-name">Defense Contracting Fundamentals</div>
            <div class="module-desc">FFP vs. cost-plus, source selection, contract administration, task orders vs. contracts, and GSA vehicles like OASIS+ and FEDSIM.</div>
          </div>
        </div>
        <div class="module-card">
          <span class="module-icon">📊</span>
          <div>
            <div class="module-name">Data Analytics for PMs</div>
            <div class="module-desc">Program dashboards, schedule analysis, TPMs, and the data-driven reporting that gets PMs promoted.</div>
          </div>
        </div>
        <div class="module-card">
          <span class="module-icon">🎯</span>
          <div>
            <div class="module-name">Capture Management & Business Development</div>
            <div class="module-desc">Win strategies, competitive intelligence, gate reviews, proposal writing, and how BD actually works at defense firms.</div>
          </div>
        </div>
        <div class="module-card">
          <span class="module-icon">⚙️</span>
          <div>
            <div class="module-name">Program Operations & Leadership</div>
            <div class="module-desc">Risk management, stakeholder communication, subcontractor oversight, and your career roadmap into DoD acquisitions.</div>
          </div>
        </div>
      </div>

      <div class="cta-box">
        <p>Module 1 is completely free. Dive in now and see why acquisition professionals are calling AcqPro the resource they wish they had when starting out.</p>
        <a href="https://acq-pro-production.up.railway.app" class="cta-btn">Start Learning →</a>
      </div>

      <div class="tip-box">
        <strong>💡 Career Tip</strong>
        <p>The DoD acquisition community is smaller than you think. The GS-12 you collaborate with today could be the SES you brief in 10 years. Use AcqPro to build the vocabulary, frameworks, and confidence that get you in the room — and keep you there.</p>
      </div>

      <p style="font-size:14px; color:#4a5568; line-height:1.7;">
        Questions about your account or the content? Reply to this email — we read every message. We're excited to be part of your acquisition journey.
      </p>
      <p style="font-size:14px; color:#1e3a5f; font-weight:600; margin-top:4px;">— The AcqPro Team</p>
    </div>

    <div class="footer">
      <p>
        You received this because you created an account at AcqPro.<br/>
        <a href="https://acq-pro-production.up.railway.app">acqpro.app</a> &nbsp;·&nbsp; Defense Acquisitions Academy
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to AcqPro — Your Defense Acquisitions Journey Starts Now",
      html,
    });
    console.log(`[email] Welcome email sent to ${to}`);
  } catch (err) {
    // Never let email failure break registration
    console.error("[email] Failed to send welcome email:", err);
  }
}
