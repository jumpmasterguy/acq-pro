import { Resend } from "resend";
import { createHmac, timingSafeEqual } from "crypto";
import { COURSE_TOTALS } from "@shared/moduleClps.generated";
import { PRICES } from "@shared/pricing";
import { isPaidStatus } from "@shared/access";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.APP_URL || "https://acqlerate.com";
const FROM = process.env.EMAIL_FROM || "Lucas at Acqlerate <lucas@acqlerate.com>";

// ─── Unsubscribe tokens ──────────────────────────────────────────
// Stateless HMAC token — no per-user DB column needed. Anyone with the exact
// email + the server secret can produce a valid token, which lets the
// recipient of THAT specific email unsubscribe with one click.
const UNSUB_SECRET = process.env.SESSION_SECRET || "acqpro-dev-secret-not-for-production";

export function unsubscribeToken(email: string): string {
  return createHmac("sha256", UNSUB_SECRET).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (!token || token.length !== expected.length) return false;
  try { return timingSafeEqual(Buffer.from(expected), Buffer.from(token)); } catch { return false; }
}

export function unsubscribeUrl(email: string): string {
  const clean = email.trim().toLowerCase();
  return `${APP_URL}/api/unsubscribe?email=${encodeURIComponent(clean)}&token=${unsubscribeToken(clean)}`;
}

// ─── Easter eggs ─────────────────────────────────────────────────────────────
// Every email ends with one small joke, and it changes from email to email.
// The pick is day-based, offset per recipient, so one person's drip emails
// (sent on different days) never repeat within 40 days, while two
// people opening the same day's email see different eggs. Numbered so
// readers can "collect" them. Rules: dry insider humor, workplace-safe, no
// em dashes, no invented facts, nothing about CORs asking for work outside
// the SOW (overdone), no fiscal-year-end jokes (cliche). Add new ones at the END so existing numbers hold.
export const EASTER_EGGS: string[] = [
  "Estimated reading time of this email: 2 minutes. Estimated time to route it for signature: 6 to 8 weeks.",
  "Somewhere right now, a program office is renaming \"Final_v7_FINAL.pptx\" to \"Final_v8_USE_THIS_ONE.pptx.\"",
  "The color of money is not a paint swatch. We checked. Twice.",
  "Every program has three schedules: the one in the briefing, the one in the IMS, and the real one.",
  "\"We'll take that for action\" is the government's version of \"let me think about it.\"",
  "Every org chart is accurate for roughly 48 hours after it's published.",
  "Continuing resolution forecast: 80% chance of \"we'll know more next week.\"",
  "This email contains zero slide decks. You're welcome.",
  "You read all the way down here. That's worth 0 CLPs, but it is worth our respect.",
  "Obligated vs. expended: one is booking the flight, the other is actually boarding it.",
  "A milestone decision review is just a meeting with higher stakes and better snacks.",
  "The fastest-moving thing in any headquarters is the rumor about the next reorg.",
  "Our spell-checker still underlines \"DFARS.\" Honestly, same.",
  "If your CPI has been exactly 1.00 for six straight months, someone's math is doing yoga.",
  "The J-Book is not a novel. It does have more plot twists.",
  "A risk register with zero risks isn't a healthy program. It's a haunted one.",
  "Say \"POM\" in a meeting and half the room thinks budget. The other half thinks juice.",
  "Travel voucher status: pending. Your grandkids may see it approved.",
  "If you can explain appropriations to a 10-year-old, you can explain them to a general. The 10-year-old asks better follow-ups.",
  "\"It depends\" is the right answer to most acquisition questions. The rest are \"check with legal.\"",
  "The best time to update your IMS was last month. The second best time is before anyone asks.",
  "An RFP walks into a bar. The bartender asks for it in a different format, with a page limit.",
  "Nothing unites a program office faster than a fire drill at 4:55 on a Friday.",
  "In acquisition, \"quick question\" has never once been a quick question.",
  "The five stages of a data call: denial, anger, spreadsheet, more spreadsheet, acceptance.",
  "There's no crying in contracting. There is, however, a lot of re-reading Section L.",
  "Program manager superpower: turning \"we're late\" into \"we've re-baselined.\"",
  "EVM, made relatable: your budget is a pizza, and someone ate three slices before the meeting started.",
  "The shortest story in defense acquisition: \"Requirements changed.\"",
  "Somewhere, a slide has 14 bullets in 9-point font. Be the change.",
  "A \"draft\" document in a program office has a half-life of roughly forever.",
  "The real Revolutionary FAR Overhaul was the friends we cited along the way.",
  "Budget drills are like fire drills, except nobody leaves the building.",
  "\"Per my last email\" is the most polite way to say \"I have receipts.\"",
  "Every working group eventually spawns a sub-working group. It's the circle of life.",
  "Hidden achievement unlocked: Actually Scrolled to the Bottom.",
  "Our lawyers asked us to clarify that \"burn rate\" is about money, not the office coffee pot.",
  "Some people collect stamps. You collect acronyms. Both are valid hobbies.",
  "The unofficial fuel of every major program is coffee. The official one is also coffee, if you ask the program office.",
  "Congress has the power of the purse. Program offices have the power of the spreadsheet nobody else can open.",
];

export function pickEasterEgg(recipient = "", now: number = Date.now()): { n: number; total: number; text: string } {
  const day = Math.floor(now / 86_400_000);
  let h = 0;
  for (const ch of recipient.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const i = (day + h) % EASTER_EGGS.length;
  return { n: i + 1, total: EASTER_EGGS.length, text: EASTER_EGGS[i] };
}

function easterEggHtml(recipient?: string): string {
  const egg = pickEasterEgg(recipient || "");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td style="background:${T.goldWash};border:1.5px dashed ${T.goldBorder};border-radius:12px;padding:14px 18px">
<p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${T.goldInk}">&#129370; Easter egg ${egg.n} of ${egg.total}</p>
<p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.55;color:${T.soft}">${escHtml(egg.text)}</p>
</td></tr></table>`;
}

// ─── Design tokens ───────────────────────────────────────────────────────────
// Inlined from the Acqlerate design system (parchment neutrals, navy dark
// surface, teal for every action, gold only for rewards). Email clients drop
// <style> blocks and CSS variables unpredictably, so every helper below writes
// inline styles. Never use class names for layout in these emails: there is no
// stylesheet behind them and they render as plain text.
const T = {
  page: "#faf6ee",        // parchment-50
  card: "#ffffff",
  sunken: "#f4ede0",      // parchment-100
  border: "#eae0ce",      // border-subtle
  borderStrong: "#d9cbb3",
  ink: "#1a1a1a",
  soft: "#4f4a44",        // stone-600
  muted: "#6e6659",       // stone-500
  teal: "#01696f",
  tealWash: "#e6f2f3",
  tealBorder: "#c0dadb",  // teal at 25% on white
  cyan: "#4fc3cb",        // teal's stand-in on navy
  navy: "#0d1b2a",
  goldInk: "#7a5800",
  goldWash: "#fef9e7",
  goldBorder: "#f0d060",
} as const;

const FONT = `'General Sans','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

function escHtml(t: string): string {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** "Sam Rivera" -> "Sam". Falls back to "there" for empty names or emails used as usernames. */
function firstName(username?: string | null): string {
  const n = (username || "").trim().split(/\s+/)[0] || "";
  return !n || n.includes("@") ? "there" : escHtml(n);
}

// ─── Building blocks ─────────────────────────────────────────────────────────

const h1 = (html: string) =>
  `<h1 style="margin:0 0 18px;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.025em;color:${T.ink}">${html}</h1>`;

const p = (html: string, extra = "") =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.65;color:${T.ink};${extra}">${html}</p>`;

const small = (html: string) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:1.6;color:${T.muted}">${html}</p>`;

const eyebrow = (text: string, color: string = T.teal, margin = "28px 0 10px") =>
  `<p style="margin:${margin};font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${color}">${text}</p>`;

const link = (href: string, label: string) =>
  `<a href="${href}" style="color:${T.teal};font-weight:600;text-decoration:none">${label}</a>`;

/** The one primary action. Teal, left-aligned, bulletproof (a table cell, so Outlook keeps the shape). */
function button(href: string, label: string, margin = "8px 0 24px"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:${margin};border-collapse:separate"><tr><td style="background:${T.teal};border-radius:10px">
<a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:10px">${label} &rarr;</a>
</td></tr></table>`;
}

/** Promoted panel: 5% teal wash, 25% teal border. */
const callout = (html: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;border-collapse:separate"><tr><td style="background:${T.tealWash};border:1px solid ${T.tealBorder};border-radius:12px;padding:18px 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:${T.ink}">${html}</td></tr></table>`;

/** Sunken parchment panel for reference content. */
const panel = (html: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;border-collapse:separate"><tr><td style="background:${T.sunken};border-radius:12px;padding:18px 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:${T.ink}">${html}</td></tr></table>`;

/** Rows with a small leading glyph (emoji from the fixed set, or a teal bullet). */
function rows(items: Array<[string, string]>, margin = "0 0 18px"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:${margin}">${items.map(([g, html]) => `
<tr><td valign="top" style="width:28px;padding:0 0 12px;font-family:${FONT};font-size:16px;line-height:1.6;color:${T.teal}">${g}</td>
<td valign="top" style="padding:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.6;color:${T.ink}">${html}</td></tr>`).join("")}</table>`;
}

const bullets = (items: readonly string[]) => rows(items.map(i => ["&bull;", i] as [string, string]));

/** A lesson the reader can open in one tap. Meta uses the brand's · separator. */
function lessonCard(o: { id: string; glyph: string; module: string; title: string; minutes: number; note?: string }): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border-collapse:separate"><tr><td style="background:${T.card};border:1px solid ${T.border};border-radius:12px;padding:16px 18px">
<a href="${APP_URL}/app#/lesson/${o.id}" style="text-decoration:none;display:block">
<p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${T.muted}">${o.glyph}&nbsp; ${o.module} &middot; ${o.minutes} min</p>
<p style="margin:0;font-family:${FONT};font-size:16px;font-weight:700;line-height:1.4;color:${T.ink}">${o.title} <span style="color:${T.teal}">&rarr;</span></p>
${o.note ? `<p style="margin:6px 0 0;font-family:${FONT};font-size:14px;line-height:1.55;color:${T.muted}">${o.note}</p>` : ""}
</a></td></tr></table>`;
}

const SIGNOFF_TAGLINE = "Founder. Also customer support, the curriculum team, and IT.";

function signoff(ps?: string): string {
  return `<p style="margin:24px 0 2px;font-family:${FONT};font-size:16px;font-weight:700;color:${T.ink}">Lucas</p>
<p style="margin:0 0 ${ps ? 20 : 8}px;font-family:${FONT};font-size:13px;line-height:1.5;color:${T.muted}">${SIGNOFF_TAGLINE}</p>
${ps ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:14px;line-height:1.6;color:${T.soft}"><strong>P.S.</strong> ${ps}</p>` : ""}`;
}

// Course facts the drip copy leans on. Totals come from the generated file so
// they never go stale; the free tier mirrors FREE_MODULES / FREE_PREVIEW_LESSONS
// in client/src/lib/progress.ts (Foundations, plus the first lesson of the five
// original modules). Update both together.
const FOUNDATIONS_LESSONS = 10;
const FREE_PREVIEW_MODULES = ["Finance", "Contracts", "Data & Analytics", "Capture & BD", "Operations"];
const LOCKED_AFTER_TRIAL = COURSE_TOTALS.lessons - FOUNDATIONS_LESSONS - FREE_PREVIEW_MODULES.length;
const ANNUAL_PER_MONTH = (PRICES.annual / 12).toFixed(2);

// ─── Shared HTML shell ────────────────────────────────────

function emailShell(preheader: string, body: string, recipientEmail?: string, footerNote = "You're receiving this because you created an account at Acqlerate."): string {
  const unsubLink = recipientEmail
    ? ` &middot; <a href="${unsubscribeUrl(recipientEmail)}" style="color:${T.muted};text-decoration:underline">Unsubscribe</a>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/><title>Acqlerate</title>
<style>
@font-face{font-family:'General Sans';src:url('${APP_URL}/fonts/GeneralSans-Regular.woff2') format('woff2');font-weight:400;font-style:normal}
@font-face{font-family:'General Sans';src:url('${APP_URL}/fonts/GeneralSans-Semibold.woff2') format('woff2');font-weight:600;font-style:normal}
@font-face{font-family:'General Sans';src:url('${APP_URL}/fonts/GeneralSans-Bold.woff2') format('woff2');font-weight:700 800;font-style:normal}
@media only screen and (max-width:620px){
  .acq-outer{padding:0!important}
  .acq-card{border-radius:0!important;border-left:0!important;border-right:0!important}
  .acq-pad{padding-left:20px!important;padding-right:20px!important}
  .acq-plan{display:block!important;width:100%!important;padding:0 0 12px!important}
}
</style></head>
<body style="margin:0;padding:0;background:${T.page}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${T.page}"><tr><td class="acq-outer" align="center" style="padding:32px 16px">
<table role="presentation" class="acq-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${T.card};border:1px solid ${T.border};border-radius:16px;overflow:hidden;border-collapse:separate">
<tr><td class="acq-pad" style="background:${T.navy};padding:20px 40px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:10px;vertical-align:middle"><img src="${APP_URL}/icon-192x192.png?v=3d" width="32" height="32" alt="" style="display:block;border-radius:8px"/></td>
<td style="vertical-align:middle;font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#ffffff">Acq<span style="color:${T.cyan}">lerate</span></td>
</tr></table>
</td></tr>
<tr><td class="acq-pad" style="padding:36px 40px 16px;font-family:${FONT}">${body}</td></tr>
<tr><td class="acq-pad" style="padding:0 40px 32px">${easterEggHtml(recipientEmail)}</td></tr>
<tr><td class="acq-pad" style="background:${T.sunken};border-top:1px solid ${T.border};padding:20px 40px;text-align:center">
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.7;color:${T.muted}">${footerNote}${unsubLink}<br/><a href="${APP_URL}" style="color:${T.teal};text-decoration:none;font-weight:600">acqlerate.com</a> &middot; Plain-English DoD acquisition training<br/>Not affiliated with WarU, DoD, or any government agency.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ─── Email 1: Welcome (day 0, sent at signup) ──────────────────────────────

export async function sendWelcomeEmail(to: string, username: string, trialEndsAt?: string | Date | null): Promise<void> {
  if (!resend) { console.log("[email] RESEND_API_KEY not set, skipping email 1"); return; }

  // Normal signups get 14 days; a template-pack buyer can arrive with 30.
  const msLeft = trialEndsAt ? new Date(trialEndsAt).getTime() - Date.now() : NaN;
  const trialDays = Number.isFinite(msLeft) && msLeft > 0 ? Math.max(1, Math.round(msLeft / 86_400_000)) : 14;

  const body = `
    ${h1(`Welcome aboard, ${firstName(username)}.`)}
    ${p(`Your account came with a <strong>${trialDays}-day all-access pass</strong>. That's all ${COURSE_TOTALS.modules} modules and ${COURSE_TOTALS.lessons} lessons, open right now. There's no card on file, so nothing renews and nobody calls you about an extended warranty.`)}
    ${p(`Day ${trialDays + 1} isn't a cliff either. Foundations (all ${FOUNDATIONS_LESSONS} lessons) stays free for good.`)}

    ${eyebrow("Your first move")}
    ${lessonCard({ id: "foundations-1", glyph: "🏛️", module: "Foundations", title: "What Is Defense Acquisition? (Start Here)", minutes: 12, note: "The map everything else hangs on. Shorter than most status meetings." })}
    ${button(`${APP_URL}/app#/lesson/foundations-1`, "Start lesson 1")}
    ${small(`Already know your ACATs from your elbow? Skip ahead to ${link(`${APP_URL}/app#/lesson/business-2`, "Why Q3 Was Bad: EAC Changes and the Quarterly Results")}. It's the lesson a lot of PMs wish they'd read before their first program review.`)}

    ${eyebrow("How this place works")}
    ${rows([
      ["🔥", `<strong>Burn rate streak.</strong> One lesson a day keeps it alive. (Burn rate is how fast a program spends its money. Yours spends knowledge. Same idea, fewer auditors.)`],
      ["⚡", `<strong>Daily Challenge.</strong> 5 questions, about 2 minutes, up to 50 XP.`],
      ["✅", `<strong>Real credit.</strong> ${COURSE_TOTALS.clpsWhole}+ CLP hours across the course, and the same hours count as PMI PDUs.`],
    ])}
    ${p(`Your XP moves you up the ladder from Acquisition Trainee to SES-Level Executive. Promotions here take minutes, not a board.`)}
    ${p(`Questions? Hit reply. It comes straight to me, not a ticket queue.`)}
    ${signoff()}
  `;

  await resend.emails.send({
    from: FROM, to,
    replyTo: "hello@acqlerate.com",
    subject: `Welcome to Acqlerate. Your ${trialDays}-day all-access pass is on.`,
    html: emailShell(`Every module, no card, nothing renews. Start with a 12-minute lesson.`, body, to),
  });
  console.log(`[email] Email 1 (welcome) sent to ${to}`);
}


// ─── Password reset / set first password ──────────────────────────────────
// Transactional, so it deliberately skips the unsubscribe footer (emailShell
// only adds one when given a recipient) and is never gated on unsubscribe
// status: someone who opted out of marketing must still be able to get back
// into their account.
export async function sendPasswordResetEmail(
  to: string,
  username: string,
  resetUrl: string,
  isFirstPassword: boolean,
): Promise<void> {
  if (!resend) { console.log("[email] RESEND_API_KEY not set, skipping password reset email"); return; }

  const name = firstName(username);
  const body = isFirstPassword
    ? `
    ${h1(`Set a password for your account, ${name}.`)}
    ${p(`You signed up with Google, so your account has never had a password. The mobile app signs you in with an email and password, so you'll need one there.`)}
    ${p(`Nothing changes on the website. The Google button keeps working.`)}
    ${button(resetUrl, "Set my password")}
    ${small(`This link works once and expires in 60 minutes. If it has already expired, ask for a new one from the sign-in screen.`)}
    ${signoff()}`
    : `
    ${h1(`Let's get you back in, ${name}.`)}
    ${p(`Someone asked to reset the password on your Acqlerate account. If that was you, the button below lets you choose a new one.`)}
    ${button(resetUrl, "Choose a new password")}
    ${small(`This link works once and expires in 60 minutes. If it has already expired, ask for a new one from the sign-in screen.`)}
    ${small(`Didn't ask for this? Ignore this email. Nothing has changed on your account.`)}
    ${signoff()}`;

  await resend.emails.send({
    from: FROM, to,
    replyTo: "hello@acqlerate.com",
    subject: isFirstPassword ? "Set a password for Acqlerate" : "Reset your Acqlerate password",
    html: emailShell(isFirstPassword ? "One link to set a password so you can sign in on mobile." : "One link to choose a new password.", body),
  });
  console.log(`[email] password reset sent to ${to} (firstPassword=${isFirstPassword})`);
}

// ─── Starter Kit contents (one list for every email that sends the kits) ──
// Rebuild the PDFs with scripts/starter-kit/build_starter_kits.py and update
// STARTER_KIT_EDITION here in the same commit.
const STARTER_KIT_EDITION = 'September 2026';
const STARTER_KIT_ITEMS = {
  usg: [
    'What changed in 2025 and 2026: the FAR overhaul, CMMC, the end of JCIDS, new thresholds',
    'The six acquisition pathways, milestones and ACAT levels',
    'The dollar lines that come up in every meeting',
    '90+ acronyms decoded, a career roadmap and the 5 mistakes new PMs make',
  ],
  contractor: [
    'What changed: FAR clause moves, the CMMC pause, TINA and EVM thresholds',
    'Task orders vs. standalone contracts, and when GSA buys for DoD',
    "Who's actually buying, and the thresholds that change how you bid",
    '90+ terms decoded, the 5 mistakes contractors make and a pre-bid checklist',
  ],
} as const;

const KIT = {
  usg: { name: 'Government edition', glyph: '🏛️', pdf: `${APP_URL}/starter-kit-usg.pdf`, who: 'For DoD civilians, uniformed PMs, COs and budget analysts inside a program office or contracting shop.' },
  contractor: { name: 'Contractor edition', glyph: '🏢', pdf: `${APP_URL}/starter-kit-contractor.pdf`, who: 'For contractor PMs, BD leads, capture managers and proposal teams on the industry side.' },
} as const;

/** One edition of the kit as a card: who it's for, what's inside, one download button. */
function kitCard(ed: 'usg' | 'contractor'): string {
  const k = KIT[ed];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border-collapse:separate"><tr><td style="background:${T.card};border:1px solid ${T.border};border-radius:12px;padding:20px 20px 4px">
${eyebrow(`${k.glyph}&nbsp; Acquisition Starter Kit &middot; ${k.name}`, T.teal, '0 0 8px')}
${small(`${k.who} Updated ${STARTER_KIT_EDITION}.`)}
${bullets(STARTER_KIT_ITEMS[ed])}
${button(k.pdf, `Download the ${k.name}`, '0 0 16px')}
</td></tr></table>`;
}

// ─── Starter Kit Email ────────────────────────────────────────────────────
// Sent after onboarding is complete and role is known

type UserRole = 'dod_employee' | 'dod_contractor' | 'career_changer' | 'student';

export async function sendStarterKitEmail(to: string, username: string, role: UserRole): Promise<void> {
  if (!resend) { console.log('[email] RESEND_API_KEY not set, skipping starter kit email'); return; }

  const intro = role === 'dod_contractor'
    ? `You told us you're on the industry side, so this one's built for BD, capture, proposal and contracts people.`
    : role === 'dod_employee'
    ? `You told us you're on the government side, so this one's built for the people inside program offices and contracting shops.`
    : role === 'student'
    ? `You told us you're studying, so you get both editions. Knowing both sides of the table is the closest thing this field has to a cheat code.`
    : `You told us you're making the jump into defense acquisition, so you get both editions. Knowing both sides of the table is the closest thing this field has to a cheat code.`;

  const cards = role === 'dod_contractor' ? kitCard('contractor')
    : role === 'dod_employee' ? kitCard('usg')
    : kitCard('usg') + kitCard('contractor');

  const body = `
    ${h1(`Here's your Starter Kit, ${firstName(username)}.`)}
    ${p(intro)}
    ${cards}
    ${p(`Keep it open the next time someone says "ACAT" in a meeting and looks at you like you should already know.`)}
    ${p(`When the PDF raises a question, the lesson that answers it is one tap away in the app. Your all-access pass is still on.`)}
    ${signoff()}
  `;

  await resend.emails.send({
    from: FROM,
    replyTo: "hello@acqlerate.com",
    to,
    subject: role === 'dod_contractor' || role === 'dod_employee'
      ? `Your Starter Kit (${role === 'dod_contractor' ? 'Contractor' : 'Government'} edition) is ready`
      : `Your Starter Kits are ready (both editions)`,
    html: emailShell('Your acquisition field guide, written for your side of the table.', body, to),
  });
  console.log(`[email] Starter kit email sent to ${to} (role: ${role})`);
}

// ─── Lead Nurture Email (landing page opt-in) ────────────────────────────────

/**
 * Sent immediately when someone submits an email capture form. These people
 * don't have an account yet, so every variant ends by pointing them at a free
 * signup (which comes with the all-access trial).
 */
const SIGNUP_PITCH = `Create a free account (60 seconds, no card) and you get 14 days of every module. After that, Foundations stays free for good.`;

function signupBlock(lead: string): string {
  return `${eyebrow('Want more than a PDF?')}
    ${p(`${lead} ${SIGNUP_PITCH}`)}
    ${button(`${APP_URL}/app#/auth`, 'Start free')}`;
}

export async function sendLeadNurtureEmail(to: string, source?: string): Promise<void> {
  if (!resend) { console.log('[email] RESEND_API_KEY not set, skipping lead nurture email'); return; }

  // Teams playbook source gets a dedicated direct-download email
  if (source === 'teams_playbook') {
    const body = `
      ${h1('Your GovCon Onboarding Playbook is ready.')}
      ${p(`Here's your copy of the 30-day playbook for turning new hires into people who can follow a program review without a translator.`)}
      ${panel(`${eyebrow('GovCon Onboarding Playbook', T.teal, '0 0 8px')}
        <p style="margin:0 0 6px;font-family:${FONT};font-size:18px;font-weight:700;color:${T.ink}">How to onboard new hires into DoD acquisition in 30 days</p>
        ${small('9 pages: the 30-day framework, role-specific learning paths, the common onboarding mistakes, and a Day 1 checklist.')}
        ${button(`${APP_URL}/govcon-onboarding-playbook.pdf`, 'Download the playbook', '4px 0 4px')}`)}
      ${signupBlock(`The playbook tells you what to teach. Acqlerate is where they actually learn it, one short lesson a day, no classroom and no scheduling.`)}
      ${signoff()}
    `;
    await resend.emails.send({
      from: FROM,
      replyTo: "hello@acqlerate.com",
      to,
      subject: 'Your GovCon Onboarding Playbook is ready to download',
      html: emailShell('Your 30-day onboarding playbook, ready to download.', body, to, "You're receiving this because you asked for the GovCon Onboarding Playbook at acqlerate.com."),
    });
    console.log(`[email] Playbook delivery email sent to ${to}`);
    return;
  }

  // Pay guide source gets a dedicated delivery email
  if (source === 'pay_guide') {
    const body = `
      ${h1('Your pay guide is ready.')}
      ${p(`Here's <em>How Your Pay Works on a Government Contract</em>: the explanation nobody gives you on day one, usually because they never got it either.`)}
      ${panel(`${eyebrow('Free download', T.teal, '0 0 8px')}
        <p style="margin:0 0 6px;font-family:${FONT};font-size:18px;font-weight:700;color:${T.ink}">How Your Pay Works on a Government Contract</p>
        ${small('10 pages, plain English: rate structures, overhead, raises, contract types, and the questions you should be asking.')}
        ${button(`${APP_URL}/how-your-pay-works.pdf`, 'Download the guide', '4px 0 4px')}`)}
      ${signupBlock(`If this made you curious about the bigger picture, that's what Acqlerate is for: who the players are, how the money flows, and how contracts actually get awarded.`)}
      ${signoff()}
    `;
    await resend.emails.send({
      from: FROM,
      replyTo: "hello@acqlerate.com",
      to,
      subject: 'Your pay guide is ready: How Your Pay Works on a Government Contract',
      html: emailShell('How Your Pay Works on a Government Contract, ready to download.', body, to, "You're receiving this because you asked for the pay guide at acqlerate.com."),
    });
    console.log(`[email] Pay guide delivery email sent to ${to}`);
    return;
  }

  // Homepage kit bar with the edition picker: lead with the side they picked,
  // keep the other edition one click away.
  const kitEdition = source === 'hero_bar_usg' ? 'usg' : source === 'hero_bar_contractor' ? 'contractor' : null;
  if (kitEdition) {
    const other = kitEdition === 'usg' ? 'contractor' : 'usg';
    const body = `
      ${h1(`Your ${KIT[kitEdition].name} is ready.`)}
      ${p(`Updated ${STARTER_KIT_EDITION} for the FAR overhaul, the CMMC pause and the new thresholds. Keep it open the next time someone says "ACAT" in a meeting.`)}
      ${kitCard(kitEdition)}
      ${small(`Work with the other side of the table too? ${link(KIT[other].pdf, `Grab the ${KIT[other].name}`)}.`)}
      ${signupBlock(`Acqlerate turns the PDF into short daily lessons with quizzes, XP and real CLP credit.`)}
      ${signoff()}
    `;
    await resend.emails.send({
      from: FROM,
      replyTo: "hello@acqlerate.com",
      to,
      subject: `Your Acquisition Starter Kit (${KIT[kitEdition].name})`,
      html: emailShell(`Your ${KIT[kitEdition].name}, ready to download.`, body, to, "You're receiving this because you asked for the Acquisition Starter Kit at acqlerate.com."),
    });
    console.log(`[email] Starter kit (${kitEdition}) sent to ${to}`);
    return;
  }

  const body = `
    ${h1('Your Acquisition Starter Kit is ready. Both editions.')}
    ${p(`No extra steps. Here are both PDFs, updated ${STARTER_KIT_EDITION}. Grab whichever side of the table you sit on (or both, if you like knowing what the other side is thinking).`)}
    ${kitCard('usg')}
    ${kitCard('contractor')}
    ${signupBlock(`Acqlerate turns the PDF into short daily lessons with quizzes, XP and real CLP credit.`)}
    ${small(`Already have an account? ${link(`${APP_URL}/app#/dashboard`, 'Sign in here')} to pick up where you left off.`)}
    ${signoff()}
  `;

  await resend.emails.send({
    from: FROM,
    replyTo: "hello@acqlerate.com",
    to,
    subject: 'Your Acquisition Starter Kit is ready to download',
    html: emailShell('Both editions, ready to download right now.', body, to, "You're receiving this because you asked for the Acquisition Starter Kit at acqlerate.com."),
  });
  console.log(`[email] Lead nurture email sent to ${to}`);
}
// ─── Admin Signup Notification ──────────────────────────────────────────────

/**
 * Notify the admin (Lucas) whenever a new user signs up.
 * Fires non-blocking — failures are logged but never surface to the user.
 */
// ── Ops alerts (Stripe config, checkout 500s) ─────────────────────────────────
// Plain-text-ish alert to the founder. Never throws: if Resend is missing or
// fails, the caller's console.error is the fallback and the app carries on.
export async function sendOpsAlertEmail(subject: string, lines: string[]): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAILS || 'lucas.l.cruz.es@gmail.com';
  if (!resend) { console.error(`[ops-alert] RESEND_API_KEY not set — could not email: ${subject}`); return; }
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const body = `
    <div style="font-size:17px;font-weight:700;color:#b91c1c;margin:0 0 16px">${esc(subject)}</div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:18px 22px;font-size:14px;line-height:1.7;color:#0d2137">
      ${lines.map((l) => `<div style="margin:0 0 6px">${esc(l)}</div>`).join('')}
    </div>
    <p style="font-size:13px;color:#64748b;margin:16px 0 0">Automated alert from the Acqlerate server.</p>
  `;
  try {
    await resend.emails.send({ from: FROM, to: adminEmail, subject, html: emailShell(subject, body) });
    console.log(`[ops-alert] emailed ${adminEmail}: ${subject}`);
  } catch (err: any) {
    console.error(`[ops-alert] Resend failed for "${subject}": ${err?.message ?? err}`);
  }
}

export async function sendAdminNotification(
  newUserEmail: string,
  newUserName: string,
  method: 'email_password' | 'google' | 'apple'
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAILS || 'lucas.l.cruz.es@gmail.com';
  if (!resend) { console.log('[email] RESEND_API_KEY not set — skipping admin notification'); return; }

  const methodLabel = method === 'google' ? 'Google OAuth'
    : method === 'apple' ? 'Sign in with Apple'
    : 'Email / Password';
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const body = `
    <div style="font-size:17px;font-weight:700;color:#0d2137;margin:0 0 16px">🎉 New signup on Acqlerate</div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px">
      <tr><td style="background:#f0f9fa;border:1px solid #d1ede0;border-radius:10px;padding:20px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#01696f;padding-bottom:14px" colspan="2">User Details</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0;width:120px">Name</td>
            <td style="font-size:14px;font-weight:700;color:#0d2137;padding:4px 0">${newUserName}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0">Email</td>
            <td style="font-size:14px;font-weight:600;color:#01696f;padding:4px 0">${newUserEmail}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0">Method</td>
            <td style="font-size:14px;font-weight:600;color:#0d2137;padding:4px 0">${methodLabel}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0">Time (ET)</td>
            <td style="font-size:14px;color:#0d2137;padding:4px 0">${now}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-size:13px;color:#64748b;margin:0">This is an automated notification from Acqlerate. No action needed.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New signup: ${newUserName} (${newUserEmail}) via ${methodLabel}`,
    html: emailShell(`${newUserName} just created an account on Acqlerate.`, body),
  });
  console.log(`[email] Admin notification sent — new user: ${newUserEmail} (${method})`);
}

// ── Team Pack purchase — admin alert ────────────────────────────────────────
// Team seats are provisioned manually for now (this is an MVP, not full
// self-serve seat management), so the admin needs a clear, actionable email
// the moment a team purchase comes through.
export async function sendTeamPurchaseAdminAlert(
  buyerEmail: string,
  seats: number,
  amountPaidCents: number,
  stripeSessionId: string,
  /** "annual" = $999/yr Team (Annual seats); "lifetime" = old one-time Team Pack. */
  seatPlan: "annual" | "lifetime" = "lifetime"
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAILS || 'lucas.l.cruz.es@gmail.com';
  if (!resend) { console.log('[email] RESEND_API_KEY not set — skipping team purchase alert'); return; }

  const body = `
    <div style="font-size:17px;font-weight:700;color:#0d2137;margin:0 0 16px">💰 New Team Pack purchase</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px">
      <tr><td style="background:#fef9e7;border:1px solid #f5e6a8;border-radius:10px;padding:20px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="font-size:13px;color:#64748b;padding:4px 0;width:120px">Buyer email</td>
              <td style="font-size:14px;font-weight:700;color:#0d2137;padding:4px 0">${buyerEmail}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Seats</td>
              <td style="font-size:14px;font-weight:700;color:#0d2137;padding:4px 0">${seats}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Seat plan</td>
              <td style="font-size:14px;font-weight:700;color:#0d2137;padding:4px 0">${seatPlan === "annual" ? "Annual (renews yearly)" : "Lifetime (one-time Team Pack)"}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Amount paid</td>
              <td style="font-size:14px;font-weight:700;color:#01696f;padding:4px 0">$${(amountPaidCents / 100).toFixed(2)}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Stripe session</td>
              <td style="font-size:12px;color:#64748b;padding:4px 0">${stripeSessionId}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin:0">Action needed: reach out to provision ${seats} ${seatPlan === "annual" ? "Annual" : "Lifetime"} seats for this buyer (admin panel: ${seatPlan === "annual" ? "Make Annual" : "Make Lifetime"}).</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `💰 Team Pack purchase: ${buyerEmail} (${seats} seats)`,
    html: emailShell(`New team purchase — action needed.`, body),
  });
  console.log(`[email] Team purchase admin alert sent — ${buyerEmail}`);
}

// ── Purchase alerts — founder notification for every paid checkout ──────────
// Fires from the Stripe webhook for Monthly, Annual, Lifetime and template-pack
// purchases (Team Pack has its own alert above because it needs action).
// Never throws: a failed email must not break the webhook, which has already
// granted access / saved the purchase by the time this runs.
export interface PurchaseAlert {
  product: string;             // "Lifetime Pro", "Monthly Pro", "PM Essentials Pack"
  kind: "lifetime" | "monthly" | "annual" | "pack";
  buyerEmail: string;
  buyerName?: string;
  amountPaidCents: number;
  currency?: string;           // Stripe's lowercase code, e.g. "usd"
  previousStatus?: string;     // "trialing" | "free" | … — shows trial → paid
  stripeSessionId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
}

const esc = (t: string) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const money = (cents: number, currency = 'usd') =>
  `${currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase() + ' '}${(cents / 100).toFixed(2)}`;

const row = (label: string, value: string, strong = false) => `
  <tr><td style="font-size:13px;color:#64748b;padding:4px 0;width:130px;vertical-align:top">${esc(label)}</td>
      <td style="font-size:14px;font-weight:${strong ? 700 : 500};color:#0d2137;padding:4px 0">${value}</td></tr>`;

export async function sendPurchaseAdminAlert(p: PurchaseAlert): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAILS || 'lucas.l.cruz.es@gmail.com';
  if (!resend) { console.error('[email] RESEND_API_KEY not set — could not send purchase alert'); return; }

  const amount = money(p.amountPaidCents, p.currency);
  const when = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short',
  });
  const recurring = p.kind === 'monthly' ? ' / month' : p.kind === 'annual' ? ' / year' : ' one-time';
  const cameFrom = p.previousStatus === 'trialing' ? 'Free trial → paid'
    : p.previousStatus ? `${p.previousStatus} → paid` : undefined;

  // Deep links so a purchase can be checked from the phone in one tap.
  const stripeLink = p.stripeSubscriptionId
    ? `https://dashboard.stripe.com/subscriptions/${p.stripeSubscriptionId}`
    : p.stripePaymentIntentId
      ? `https://dashboard.stripe.com/payments/${p.stripePaymentIntentId}`
      : p.stripeCustomerId
        ? `https://dashboard.stripe.com/customers/${p.stripeCustomerId}`
        : undefined;

  const body = `
    <div style="font-size:17px;font-weight:700;color:#0d2137;margin:0 0 16px">💰 New purchase: ${esc(p.product)} — ${esc(amount)}${recurring}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px">
      <tr><td style="background:#f0f9fa;border:1px solid #d1ede0;border-radius:10px;padding:20px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          ${row('Product', esc(p.product), true)}
          ${row('Amount', `<span style="color:#01696f;font-weight:700">${esc(amount)}${esc(recurring)}</span>`)}
          ${row('Buyer', `${p.buyerName ? esc(p.buyerName) + ' &middot; ' : ''}<span style="color:#01696f;font-weight:600">${esc(p.buyerEmail)}</span>`)}
          ${cameFrom ? row('Came from', esc(cameFrom)) : ''}
          ${row('Time (ET)', esc(when))}
          ${stripeLink ? row('Stripe', `<a href="${stripeLink}" style="color:#01696f">Open in Stripe dashboard</a>`) : ''}
          ${row('Session', `<span style="font-size:12px;color:#64748b">${esc(p.stripeSessionId)}</span>`)}
        </table>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin:0">Access was granted automatically. No action needed — but a personal thank-you note within the hour converts a buyer into a referrer.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `💰 ${p.product} purchase: ${p.buyerEmail} (${amount}${recurring})`,
      html: emailShell(`${p.buyerEmail} just bought ${p.product}.`, body),
    });
    console.log(`[email] Purchase alert sent — ${p.product} for ${p.buyerEmail} (${amount})`);
  } catch (err: any) {
    console.error(`[email] Purchase alert failed for ${p.buyerEmail}: ${err?.message ?? err}`);
  }
}

// ── Cancellation alert — subscription ended (customer.subscription.deleted) ─
export async function sendSubscriptionCancelledAdminAlert(opts: {
  userEmail: string;
  userName?: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAILS || 'lucas.l.cruz.es@gmail.com';
  if (!resend) { console.error('[email] RESEND_API_KEY not set — could not send cancellation alert'); return; }

  const when = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short',
  });
  const body = `
    <div style="font-size:17px;font-weight:700;color:#b91c1c;margin:0 0 16px">📉 Monthly subscription cancelled</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px">
      <tr><td style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          ${row('User', `${opts.userName ? esc(opts.userName) + ' &middot; ' : ''}<span style="color:#01696f;font-weight:600">${esc(opts.userEmail)}</span>`)}
          ${row('Time (ET)', esc(when))}
          ${row('Stripe', `<a href="https://dashboard.stripe.com/customers/${opts.stripeCustomerId}" style="color:#01696f">Open customer in Stripe</a>`)}
          ${row('Subscription', `<span style="font-size:12px;color:#64748b">${esc(opts.stripeSubscriptionId)}</span>`)}
        </table>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin:0">Their account has been moved back to the free tier. Worth a short "what made you leave?" email — churn reasons are the cheapest product research there is.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `📉 Subscription cancelled: ${opts.userEmail}`,
      html: emailShell(`${opts.userEmail} cancelled their monthly subscription.`, body),
    });
    console.log(`[email] Cancellation alert sent — ${opts.userEmail}`);
  } catch (err: any) {
    console.error(`[email] Cancellation alert failed for ${opts.userEmail}: ${err?.message ?? err}`);
  }
}

// ─── Admin Lead Notification ────────────────────────────────────────────────

/**
 * Notify the admin (Lucas) whenever a new Starter Kit lead is captured.
 * Fires non-blocking — failures are logged but never surface to the user.
 */
export async function sendAdminLeadNotification(leadEmail: string, source: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAILS || 'lucas.l.cruz.es@gmail.com';
  if (!resend) { console.log('[email] RESEND_API_KEY not set — skipping lead notification'); return; }

  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const body = `
    <div style="font-size:17px;font-weight:700;color:#0d2137;margin:0 0 16px">📥 New Starter Kit lead</div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px">
      <tr><td style="background:#f0f9fa;border:1px solid #d1ede0;border-radius:10px;padding:20px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#01696f;padding-bottom:14px" colspan="2">Lead Details</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0;width:120px">Email</td>
            <td style="font-size:14px;font-weight:600;color:#01696f;padding:4px 0">${leadEmail}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0">Source</td>
            <td style="font-size:14px;font-weight:600;color:#0d2137;padding:4px 0">${source}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0">Time (ET)</td>
            <td style="font-size:14px;color:#0d2137;padding:4px 0">${now}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-size:13px;color:#64748b;margin:0 0 16px">Both Starter Kit PDFs were already sent to them automatically — no action needed unless you want to follow up personally.</p>
    <a href="${APP_URL}/app#/admin" style="display:inline-block;background:#01696f;color:#ffffff;font-weight:800;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">View in Admin Panel →</a>
  `;

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New lead: ${leadEmail} (${source})`,
    html: emailShell(`${leadEmail} just requested the Acquisition Starter Kit.`, body),
  });
  console.log(`[email] Admin lead notification sent — ${leadEmail} (${source})`);
}

// ─── Email 2: The decoder ring (Day 3) ──────────────────────────────────────

export async function sendEmail2New(to: string, username: string): Promise<void> {
  if (!resend) return;
  const body = `
    ${h1(`Nobody hands you the decoder ring.`)}
    ${p(`Hey ${firstName(username)}. Your first program meeting goes something like this: "The CDRL slipped, so EVM's showing a negative CV, and we need to brief it before the POM drill."`)}
    ${p(`Everyone nods. You nod too. You write "CDRL??" in your notebook and underline it twice.`)}
    ${p(`That isn't you being behind. The whole system runs on acronyms, and nobody stops to define them, mostly because the people in the room learned them the same way: by nodding until it clicked.`)}
    ${callout(`<strong>Quick decode, on the house</strong>
      ${rows([
        ["&bull;", `<strong>CDRL</strong> (Contract Data Requirements List): every report the contractor owes the government, and when it's due.`],
        ["&bull;", `<strong>EVM</strong> (Earned Value Management): is the program getting the work it paid for, on schedule?`],
        ["&bull;", `<strong>CV</strong> (Cost Variance): earned value minus actual cost. Negative means you're over budget.`],
        ["&bull;", `<strong>POM</strong> (Program Objective Memorandum): a service's five-year budget plan. Not the juice.`],
      ], "10px 0 0")}`)}
    ${p(`Foundations does this for the whole system, about 15 minutes a lesson. By the end you'll know why the rules exist, not just what the letters stand for.`)}
    ${lessonCard({ id: "foundations-2", glyph: "🏛️", module: "Foundations", title: "The DoD Acquisition System Overview", minutes: 12 })}
    ${button(`${APP_URL}/app#/lesson/foundations-2`, "Open the lesson")}
    ${small(`Already fluent? Try the ${link(`${APP_URL}/app#/lesson/data-3`, "EVM Acronym Deep Dive")}. It's the final boss of alphabet soup.`)}
    ${signoff()}
  `;
  await resend.emails.send({
    from: FROM, to, replyTo: "hello@acqlerate.com",
    subject: "Nobody hands you the decoder ring",
    html: emailShell("CDRL, EVM, CV, POM. Everyone nods. Here's what they actually mean.", body, to),
  });
  console.log(`[email] Email 2 (day 3) sent to ${to}`);
}

// ─── Email 3: The modules people miss (Day 7) ───────────────────────────────

export async function sendEmail3New(to: string, username: string): Promise<void> {
  if (!resend) return;
  const body = `
    ${h1(`Week one down, ${firstName(username)}.`)}
    ${p(`Foundations and Finance are the natural place to start. But your pass covers all ${COURSE_TOTALS.modules} modules, and the newer ones are easy to miss.`)}
    ${p(`Everything below is open on your account right now. Pick the one that sounds like your week:`)}
    ${eyebrow("If you're on the government side")}
    ${lessonCard({ id: "preaward-4", glyph: "📐", module: "From Need to RFP", title: "Writing the Requirement: SOW, PWS, and SOO", minutes: 27, note: "Because every bad contract started as a vague requirement." })}
    ${eyebrow("If you're on the industry side")}
    ${lessonCard({ id: "business-10", glyph: "📈", module: "Business of Defense Contracting", title: "Reading a Prime's 10-K in 20 Minutes", minutes: 24, note: "Know what your own leadership is reading before they bring it up." })}
    ${eyebrow("If you just traded the uniform for a badge")}
    ${lessonCard({ id: "veteran-1", glyph: "🎖️", module: "Veteran Transition", title: "You Already Did This: Translating Military Experience Into Acquisition Language", minutes: 20 })}
    ${eyebrow("If you like a good story")}
    ${lessonCard({ id: "history-2", glyph: "📜", module: "Why the Rules Exist", title: "The $435 Hammer, Operation Ill Wind, and Why Competition and Integrity Are Written Into Law", minutes: 22 })}
    ${signoff(`The history module is the one I'd show a friend who doesn't work in acquisition. It turns out a hammer explains a surprising amount of the FAR.`)}
  `;
  await resend.emails.send({
    from: FROM, to, replyTo: "hello@acqlerate.com",
    subject: "Week one down. Here's where the good stuff is hiding.",
    html: emailShell("From the $435 hammer to reading a prime's 10-K. All open on your account right now.", body, to),
  });
  console.log(`[email] Email 3 (day 7) sent to ${to}`);
}

// ─── Email 4: Pricing (Day 12) ──────────────────────────────────────────────

/** Side-by-side plan cards. Annual carries the selected (2px teal) border. */
function planCards(): string {
  const cell = (o: { name: string; price: string; per: string; lines: string[]; featured?: boolean }) => `
<td class="acq-plan" valign="top" width="50%" style="padding:0 6px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td style="background:${T.card};border:${o.featured ? `2px solid ${T.teal}` : `1px solid ${T.border}`};border-radius:14px;padding:18px 18px 8px">
<p style="margin:0 0 6px;font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${o.featured ? T.teal : T.muted}">${o.name}${o.featured ? " &middot; &#9733; Best value" : ""}</p>
<p style="margin:0;font-family:${FONT};font-size:28px;font-weight:800;letter-spacing:-0.03em;color:${T.ink}">${o.price}</p>
<p style="margin:0 0 12px;font-family:${FONT};font-size:13px;color:${T.muted}">${o.per}</p>
${o.lines.map(l => `<p style="margin:0 0 8px;font-family:${FONT};font-size:14px;line-height:1.5;color:${T.ink}"><span style="color:${T.teal};font-weight:700">&#10003;</span>&nbsp; ${l}</p>`).join("")}
</td></tr></table></td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px"><tr>
${cell({ name: "Monthly", price: `$${PRICES.monthly}`, per: "per month", lines: [`All ${COURSE_TOTALS.modules} modules, ${COURSE_TOTALS.lessons} lessons`, "The Debrief audio", "30 AI explain-it-simpler a day", "CLP certificates"] })}
${cell({ name: "Annual", price: `$${PRICES.annual}`, per: `per year ($${ANNUAL_PER_MONTH}/mo)`, featured: true, lines: ["Everything in Monthly", "Acqlerate Coach", "Lesson Book PDFs", "Unlimited AI explains"] })}
</tr></table>`;
}

export async function sendEmail4New(to: string, username: string): Promise<void> {
  if (!resend) return;
  const body = `
    ${h1(`Let's talk money. You've been training for it.`)}
    ${p(`Hey ${firstName(username)}. Here's what it costs to keep everything open when your pass ends, in plain numbers.`)}
    ${planCards()}
    ${p(`The <strong>Acqlerate Coach</strong> is the Annual perk worth knowing about. You explain a lesson back in your own words and it grades you the way a sharp mentor would: what you nailed, what you missed, and any misconception that would trip you up in a real meeting.`)}
    ${callout(`For scale: Management Concepts' <em>Introduction to Federal Contracting</em> runs <strong>$1,939</strong> for five days in a classroom. Acqlerate is <strong>$${PRICES.annual}</strong> for a year, and the classroom is wherever you are. We don't ask where.`)}
    ${p(`Either plan comes with a 30-day money-back guarantee, no questions asked.`)}
    ${button(`${APP_URL}/app#/upgrade`, "See the plans")}
    ${small(`Not ready? Foundations stays free for good, along with the first lesson of ${FREE_PREVIEW_MODULES.length} other modules.`)}
    ${signoff()}
  `;
  await resend.emails.send({
    from: FROM, to, replyTo: "hello@acqlerate.com",
    subject: `What $${PRICES.annual} a year actually buys you`,
    html: emailShell(`Less than one day of classroom training. Here's the math.`, body, to),
  });
  console.log(`[email] Email 4 (day 12) sent to ${to}`);
}

// ─── Email 5: Last nudge (Day 21) ───────────────────────────────────────────

export async function sendEmail7New(to: string, username: string): Promise<void> {
  if (!resend) return;
  const body = `
    ${h1(`This is the last upgrade email. I mean it.`)}
    ${p(`Hey ${firstName(username)}. No countdown timer. No "FINAL_v2_REALLY_FINAL" offer that shows up again next week.`)}
    ${p(`Just one thing I've noticed from years of watching people move through this field: the ones who move up fastest aren't the ones with the most certificates. They're the ones who can explain the money and the contract in plain English when the room goes quiet.`)}
    ${callout(`<strong>That's a skill you build ten minutes at a time, not in a five-day class.</strong>`)}
    ${p(`Foundations is yours for good, and the ${link(`${APP_URL}/blog`, "blog")} is free for everyone. When you want the rest, the ${link(`${APP_URL}/app#/upgrade`, "plans are here")}. Same price, no pressure.`)}
    ${p(`Thanks for giving this a shot. And if anything in the app ever annoyed you, reply and tell me. I turn fixes around faster than a contract mod.`)}
    ${signoff()}
    ${small(`<em>Built by someone who's been in the room. Made for people trying to get there.</em>`)}
  `;
  await resend.emails.send({
    from: FROM, to, replyTo: "hello@acqlerate.com",
    subject: "Last thing I'll say about this",
    html: emailShell("No countdown timer. Just one thing I've noticed about the people who move up fastest.", body, to,
      "You're receiving this because you created an account at Acqlerate. This is the last onboarding email; after this you'll only hear from me when there's something new worth your time."),
  });
  console.log(`[email] Email 5 (day 21) sent to ${to}`);
}

// ─── Trial ending (day 14, or later for template-pack buyers) — only sent to
// users still on an active trial ───
// Everyone else (already free-tier-only, already paid) never gets this one.

export async function sendTrialEndingEmail(to: string, username: string): Promise<void> {
  if (!resend) return;
  const body = `
    ${h1(`Your all-access pass ends today.`)}
    ${p(`Hey ${firstName(username)}. Think of it like the end of a period of performance: nothing you did gets lost, but new work needs funding.`)}
    ${eyebrow("Stays free, for good")}
    ${rows([
      ["✅", `Foundations, all ${FOUNDATIONS_LESSONS} lessons`],
      ["✅", `The first lesson of ${FREE_PREVIEW_MODULES.join(", ")}`],
      ["✅", `Your progress, XP, streak, and any certificates you've earned`],
    ])}
    ${eyebrow("Locks today", T.muted)}
    ${rows([
      ["🔒", `The other ${LOCKED_AFTER_TRIAL} lessons across ${COURSE_TOTALS.modules - 1} modules`],
      ["🔒", `AI explain-it-simpler drops from 30 a day to 5`],
    ])}
    ${p(`To keep it all: <strong>$${PRICES.monthly}/month</strong>, or <strong>$${PRICES.annual} for the year</strong> ($${ANNUAL_PER_MONTH} a month, with the Acqlerate Coach and Lesson Book downloads).`)}
    ${button(`${APP_URL}/app#/upgrade`, "Keep everything open")}
    ${small(`30-day money-back guarantee on either plan.`)}
    ${signoff()}
  `;
  await resend.emails.send({
    from: FROM, to, replyTo: "hello@acqlerate.com",
    subject: "Your all-access pass ends today",
    html: emailShell("What stays free, what locks today, and how to keep it all.", body, to),
  });
  console.log(`[email] Trial-ending sent to ${to}`);
}
// ─── Newsletter broadcast ────────────────────────────────────────────────────

const NEWSLETTER_SIGNATURE = `
<table cellpadding="0" cellspacing="0" style="margin-top:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<tr>
<td style="border-top:1px solid #eae0ce;padding-top:14px">
<p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1a1a1a">Lucas Cruz</p>
<p style="margin:0 0 10px;font-size:13px;color:#6e6659">Founder, Acqlerate</p>
<p style="margin:0;font-size:13px">
<a href="https://acqlerate.com" style="color:#01696f;text-decoration:none;font-weight:600">acqlerate.com</a>
<span style="color:#c4ccd4"> &nbsp;|&nbsp; </span>
<a href="https://www.linkedin.com/company/acqlerate/" style="color:#01696f;text-decoration:none;font-weight:600">LinkedIn</a>
<span style="color:#c4ccd4"> &nbsp;|&nbsp; </span>
<a href="https://www.facebook.com/share/1D7GysBxX2/" style="color:#01696f;text-decoration:none;font-weight:600">Facebook</a>
</p>
</td>
</tr>
</table>`;

export async function sendNewsletterIssue(
  to: string,
  subject: string,
  previewText: string,
  html: string
): Promise<void> {
  if (!resend) { console.warn('[newsletter] Resend not configured'); return; }

  // Wrap the html in the email shell if it's a partial, appending the signature to the body
  const fullHtml = html.includes('<!DOCTYPE') ? html : emailShell(previewText, html + NEWSLETTER_SIGNATURE, to);

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: "hello@acqlerate.com",
    subject,
    html: fullHtml,
  });
  console.log(`[newsletter] Sent to ${to}`);
}


const EMAIL_SEQUENCE: Array<{
  day: number;
  fn: (to: string, username: string, trialEndsAt?: string | null) => Promise<void>;
  /** Upgrade pitches. Skipped (and marked done) for anyone who has already paid. */
  sales?: boolean;
}> = [
  { day: 0,  fn: sendWelcomeEmail },
  { day: 3,  fn: sendEmail2New },
  { day: 7,  fn: sendEmail3New },
  { day: 12, fn: sendEmail4New, sales: true },
  { day: 21, fn: sendEmail7New, sales: true },
];

/**
 * Send any emails due today for a user.
 * `registeredAt` — ISO date string of when the user signed up.
 * `sentEmailDays` — array of day-numbers already sent (e.g. [0, 2]).
 * `subscriptionStatus` — when 'trialing', the day-14 trial-ending email is
 *   spliced into the sequence. Anyone else (plain free, or already paid)
 *   never gets it — the trial-end message would be wrong for them.
 * Returns the updated sentEmailDays array.
 */
export async function processDripEmails(
  to: string,
  username: string,
  registeredAt: string,
  sentEmailDays: number[],
  subscriptionStatus?: string,
  trialEndsAt?: string | null
): Promise<number[]> {
  const regDate = new Date(registeredAt);
  const now = new Date();
  const daysSinceReg = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));

  const updated = [...sentEmailDays];

  // The trial-ending email goes out on the day the trial actually ends: day 14
  // for a normal signup, later for a template-pack buyer (30-day bonus, see
  // server/packBonus.ts). Its sentEmailDays marker stays 14 whatever day it
  // fires, so anyone who already had it is not emailed twice.
  const DAY_MS = 1000 * 60 * 60 * 24;
  const trialLength = trialEndsAt ? Math.round((new Date(trialEndsAt).getTime() - regDate.getTime()) / DAY_MS) : NaN;
  const trialDay = Number.isFinite(trialLength) ? Math.max(1, trialLength) : 14;
  const base = EMAIL_SEQUENCE.map(e => ({ ...e, key: e.day }));
  const sequence = subscriptionStatus === 'trialing'
    ? [...base, { day: trialDay, key: 14, fn: sendTrialEndingEmail }].sort((a, b) => a.day - b.day)
    : base;

  // Only send the SINGLE earliest overdue email per call, not the whole backlog.
  // If a user is behind (e.g. after downtime), they catch up one email per
  // scheduler run instead of getting every missed email jammed in at once.
  const paid = isPaidStatus(subscriptionStatus);
  for (const { day, key, fn, sales } of sequence as Array<typeof sequence[number] & { sales?: boolean }>) {
    if (daysSinceReg >= day && !updated.includes(key)) {
      // A customer who already paid shouldn't be pitched the plan they're on.
      if (sales && paid) { updated.push(key); continue; }
      try {
        await fn(to, username, trialEndsAt);
        updated.push(key);
      } catch (err) {
        console.error(`[email] Failed drip email day=${day} to=${to}:`, err);
      }
      break; // stop after sending one — the rest wait for the next run
    }
  }

  return updated;
}

// ── Referral Reward Email ─────────────────────────────────────────────────────
// Referral reward. `result` says what the reward actually was, because a year
// of Pro means different things by plan (see server/referrals.ts).
export async function sendReferralRewardEmail(
  to: string,
  firstName: string | null,
  result: { kind: "extended" | "stripe-credit" | "already-unlimited" | "needs-manual"; until?: string; creditCents?: number },
): Promise<void> {
  if (!resend) { console.error("[email] RESEND_API_KEY not set, could not send referral reward email"); return; }
  const name = (firstName || "").trim() && !(firstName || "").includes("@") ? (firstName as string).trim() : "there";
  const untilText = result.until
    ? new Date(result.until).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
    : "";
  const copy = result.kind === "stripe-credit"
    ? {
        subject: "You earned a year of Acqlerate Pro",
        headline: "Your next 12 months are on us.",
        body: `We've added a $${((result.creditCents ?? 0) / 100).toFixed(2)} credit to your account, which covers your next 12 monthly payments. Nothing to do on your end. Your plan carries on exactly as it is, you just won't be charged for a year.`,
      }
    : result.kind === "already-unlimited"
    ? {
        subject: "Thanks for spreading the word",
        headline: "Two more people joined because of you.",
        body: "You already have full, permanent access, so there's nothing to add to your account. But it genuinely helps, and we noticed. Thank you.",
      }
    : {
        subject: "You earned a year of Acqlerate Pro",
        headline: "You just earned a year of Pro.",
        body: `Your account is already upgraded: every module, every lesson, and the audio Debriefs${untilText ? `, through ${untilText}` : " for the next year"}. No card needed.`,
      };
  await resend.emails.send({
    from: 'Lucas Cruz | Acqlerate <hello@acqlerate.com>',
    to,
    bcc: ['lucas.l.cruz.es@gmail.com'],
    replyTo: 'hello@acqlerate.com',
    subject: copy.subject,
    html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#060f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="margin-bottom:28px;">
      <span style="color:#fff;font-weight:800;font-size:1.1rem;">Acq<span style="color:#4FC3CB">lerate</span></span>
    </div>
    <div style="background:#0d1a2e;border:1px solid #1e2f4a;border-radius:16px;padding:36px;margin-bottom:24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:3rem;">🎉</div>
      </div>
      <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0 0 16px;text-align:center;">${copy.headline}</h1>
      <p style="color:#cbd5e1;font-size:0.95rem;line-height:1.8;margin:0 0 16px;">Hey ${name}, two people signed up through your referral link.</p>
      <p style="color:#cbd5e1;font-size:0.95rem;line-height:1.8;margin:0 0 24px;">${copy.body}</p>
      <div style="background:#01696f22;border:1px solid #01696f44;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#4FC3CB;font-size:0.85rem;margin:0;font-weight:600;">Keep sharing your link (it's in My Account). Every 2 new signups earns another year.</p>
      </div>
      <a href="https://acqlerate.com/app" style="display:inline-block;background:#01696f;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:0.95rem;">Go to Acqlerate →</a>
    </div>
    <p style="color:#4a6274;font-size:0.75rem;text-align:center;">Acqlerate · acqlerate.com · <a href="${unsubscribeUrl(to)}" style="color:#4a6274;text-decoration:underline">Unsubscribe</a></p>
  </div>
</body></html>`,
  });
}

// ── Template pack: buyer delivery email ─────────────────────────────────────
// Sent from the Stripe webhook once per purchase. The success page is not
// enough on its own: close the tab and the links were gone. Download links
// carry the purchase's token and never expire. Transactional, so no
// unsubscribe link. Never throws.
export interface PackPurchaseEmail {
  to: string;
  packName: string;                                   // "PM Essentials", "CPARS Playbook"
  files: Array<{ name: string; url: string }>;
  bonus: "granted" | "on-signup" | "already-paid";    // see server/packBonus.ts
}

export async function sendPackPurchaseEmail(p: PackPurchaseEmail): Promise<void> {
  if (!resend) { console.error("[email] RESEND_API_KEY not set, could not send pack delivery email"); return; }
  const fileRows = p.files.map(f => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:15px;color:#0d2137;font-weight:600">${esc(f.name)}</td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #e2e8f0"><a href="${f.url}" style="color:#01696f;font-weight:700;font-size:14px;text-decoration:none">Download &rarr;</a></td>
      </tr>`).join("");

  const btn = (href: string, label: string) => button(href, label.replace(/ ?&rarr;$/, ""), "0");;

  const bonus = p.bonus === "already-paid"
    ? `<p>You already have full access to Acqlerate, so every lesson these tools point to is open for you.</p>`
    : p.bonus === "granted"
      ? `<div style="background:#fff8e6;border:1px solid #f2d58a;border-radius:10px;padding:18px 22px;margin:0 0 24px">
           <p style="margin:0 0 8px;font-weight:800;color:#0d2137">Your 30 days of Acqlerate Pro are on.</p>
           <p style="margin:0 0 16px;color:#374151">Every module is unlocked on your account for the next 30 days. The Start Here tab in your pack tells you which lesson goes with each tool.</p>
           ${btn(`${APP_URL}/app`, "Open Acqlerate &rarr;")}
         </div>`
      : `<div style="background:#fff8e6;border:1px solid #f2d58a;border-radius:10px;padding:18px 22px;margin:0 0 24px">
           <p style="margin:0 0 8px;font-weight:800;color:#0d2137">Your pack includes 30 days of Acqlerate Pro.</p>
           <p style="margin:0 0 16px;color:#374151">Create a free account with this email address (${esc(p.to)}) and every module unlocks for 30 days. No card, nothing renews.</p>
           ${btn(`${APP_URL}/app#/auth`, "Create your account &rarr;")}
         </div>`;

  const body = `
    <div style="font-size:18px;font-weight:700;color:#0d2137;margin:0 0 16px">Thanks for your purchase.</div>
    <p>Here are your ${esc(p.packName)} files. The links never expire, so keep this email.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 28px">${fileRows}</table>
    <p style="margin:0 0 24px;color:#374151">Start with the Pack Guide. It walks you through every tool in the order you'll use them.</p>
    ${bonus}
    <p>Questions or something not working? Just reply to this email.</p>
    <p style="font-size:14px;color:#0d2137;font-weight:700;margin-top:4px">Lucas</p>
  `;
  try {
    await resend.emails.send({
      from: FROM, to: p.to, replyTo: "hello@acqlerate.com",
      subject: `Your ${p.packName} downloads`,
      html: emailShell(p.bonus === "already-paid" ? `Your ${p.packName} files.` : `Your ${p.packName} files, plus 30 days of Acqlerate Pro.`, body, undefined,
        "You're receiving this because you bought a template pack from Acqlerate."),
    });
    console.log(`[email] Pack delivery (${p.packName}) sent to ${p.to}`);
  } catch (err: any) {
    console.error(`[email] Pack delivery email failed for ${p.to}:`, err?.message);
  }
}
