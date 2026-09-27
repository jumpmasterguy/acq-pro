import { useState } from "react";
import { modules, getTotalLessons } from "@/lib/curriculumMeta";
import { ArrowLeft, CheckCircle, Shield, Award, Zap, Lock, CreditCard, ExternalLink, Globe, Star, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isNativeApp } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { FREE_MODULES } from "@/lib/progress";
import { getModuleTheme, moduleGradient, getModuleFamilyTheme } from "@/lib/moduleTheme";
import { formatClps, moduleClps } from "@shared/moduleClps";
import { isNewPricing, planPrice, topPlanName, PRICES, LEGACY_PRICES } from "@shared/pricing";

interface UpgradePageProps {
  onBack: () => void;
  onUpgrade: () => void; // retained for compatibility but Stripe takes over
  trialDaysLeft?: number | null;
  /** Shown in the native "sign in with {email}" step. */
  userEmail?: string;
  /** Native's "Already upgraded? Sign out and back in". */
  onSignOut?: () => void;
}

export default function UpgradePage({ onBack, trialDaysLeft = null, userEmail = 'your email', onSignOut }: UpgradePageProps) {
  const isMobile = useIsMobile();
  const totalLessons = getTotalLessons();
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  // Which price set is live (shared/pricing.ts). Until midnight Eastern on
  // 1 Oct 2026: Monthly $5.99 + Lifetime $99. From then: Monthly $14.99 +
  // Annual $149. Read once per render of the page; the server re-checks at
  // checkout, so a tab left open across the switch can't buy the old price.
  const newPricing = isNewPricing();
  const topPlan = newPricing ? "annual" as const : "lifetime" as const;
  const nativeApp = isNativeApp();
  const { toast } = useToast();

  const freeFeatures = [
    "Module 1: Foundations (full access, 10 lessons)",
    "1 free preview lesson in every other module",
    "Progress tracking",
    "Key terms & glossary",
  ];

  const monthlyFeatures = [
    `All ${modules.length} modules, every domain covered`,
    `${totalLessons} lessons with real DoD content`,
    "All quiz questions with detailed explanations",
    "Key terms glossary for every lesson",
    "Career roadmap for gov & contractor tracks",
    "\"The Debrief\": audio lessons for every module (stream anytime)",
    "A certificate for every module you finish",
    "AI Study Assistant (limited)",
    "Cancel anytime",
  ];

  // Shown under Monthly, greyed out, so the difference is visible at a glance.
  const monthlyExcluded = [
    "Lesson Book PDF downloads",
    "CLP ledger and portal export",
    "\"How Do I Apply This?\" AI",
  ];

  const annualFeatures = [
    "\u2605 Lesson Book PDFs: download every module to keep, print, and mark up",
    "\u2605 CLP ledger: every certificate in one place, your 2-year cycle tracked, one-tap copy for CAPPMIS, eDACM, and FAITAS, and a spreadsheet export",
    `All ${modules.length} modules, every domain covered`,
    `${totalLessons} lessons with real DoD content`,
    "All quiz questions with detailed explanations",
    "Key terms glossary for every lesson",
    "Formulas, tables & quick-reference content",
    "Career roadmap for gov & contractor tracks",
    "\"The Debrief\": audio lessons for every module (stream anytime)",
    "AI Study Assistant (unlimited), including \"How Do I Apply This?\"",
    "Every new lesson and module while you're subscribed",
    "Priority email support",
  ];

  const lifetimeFeatures = [
    "\u2605 Lesson Book PDFs: download every module to keep, print, and mark up",
    "\u2605 CLP ledger: every certificate in one place, your 2-year cycle tracked, one-tap copy for CAPPMIS, eDACM, and FAITAS, and a spreadsheet export",
    `All ${modules.length} modules, every domain covered`,
    `${totalLessons} lessons with real DoD content`,
    "All quiz questions with detailed explanations",
    "Key terms glossary for every lesson",
    "Formulas, tables & quick-reference content",
    "Career roadmap for gov & contractor tracks",
    "Salary benchmarks & certification guidance",
    "\"The Debrief\": audio lessons for every module (stream anytime)",
    "AI Study Assistant (unlimited), including \"How Do I Apply This?\"",
    "Lifetime content updates as regulations change",
    "Priority email support",
  ];

  const premiumModules = modules.filter(m => !m.free);

  const topFeatures = newPricing ? annualFeatures : lifetimeFeatures;
  const top = newPricing
    ? { name: "Annual Pro", price: `$${PRICES.annual}`, unit: "/year", note: `$${(PRICES.annual / 12).toFixed(2)} a month, billed yearly. Two months free vs. Monthly.`, badge: "Best Value", cta: "Get Annual Access →" }
    : { name: "Lifetime Pro", price: `$${LEGACY_PRICES.lifetime}`, unit: "one-time", note: "Pay once, own it forever. Last day to buy: September 30.", badge: "Ends Sept 30", cta: "Get Lifetime Access →" };
  const monthly = newPricing
    ? { price: `$${PRICES.monthly}`, note: "Cancel anytime" }
    : { price: `$${LEGACY_PRICES.monthly}`, note: `Subscribe by Sept 30 and keep $${LEGACY_PRICES.monthly} for as long as you stay. New price from Oct 1: $${PRICES.monthly}.` };

  const handleCheckout = async (priceType: "annual" | "lifetime" | "monthly") => {
    const setLoading = priceType === "monthly" ? setLoadingMonthly : setLoadingTop;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/stripe/create-checkout-session", { priceType });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment setup failed");
      if (data.url) {
        // GA4: begin_checkout
        try {
          (window as any).trackEvent?.('begin_checkout', {
            currency: 'USD',
            value: planPrice(priceType),
            items: [{ item_name: `Acqlerate Pro ${priceType}`, price: planPrice(priceType) }],
          });
        } catch {}
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({
        title: "Checkout error",
        description: err.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Portal unavailable");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: "Billing portal error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ── Mobile Pro access ─────────────────────────────────────────────────────
  // Native gets the handoff's explainer: no prices, no purchase. On the web a
  // phone is a perfectly legal place to sell, so mobile web keeps the real
  // plans — the gate is isNativeApp(), not the viewport.
  if (isMobile) {
    const lockedModules = modules.filter(m => !FREE_MODULES.includes(m.id) && !m.free);

    return (
      <div className="flex flex-col gap-4 px-4 pb-8 pt-4" data-testid="pro-access-mobile">
        {/* Hero */}
        <div
          className="rounded-2xl px-5 py-6 text-center"
          style={{ background: 'rgba(1,105,111,.05)', border: '1px solid rgba(1,105,111,.2)' }}
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'rgba(1,105,111,.15)' }}
          >
            <Shield className="h-7 w-7" style={{ color: 'var(--acq-teal)' }} strokeWidth={2} />
          </span>
          <h1
            className="mt-3.5 text-[22px] font-bold tracking-[-0.025em]"
            style={{ color: 'var(--acq-text-heading)' }}
          >
            Unlock the Full Academy
          </h1>
          <p className="mt-1.5 text-sm leading-[1.5]" style={{ color: 'var(--acq-text-muted)' }}>
            {nativeApp
              ? 'Every module, lesson, quiz, and resource. Pro access is set up on acqlerate.com, then works here automatically.'
              : 'Get access to every module, lesson, quiz, and resource — everything you need to launch or advance your DoD acquisitions career.'}
          </p>
          {trialDaysLeft !== null && (
            <span
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: 'var(--acq-surface-gold-wash)', color: 'var(--acq-text-gold)' }}
            >
              <span aria-hidden="true">⚡</span>
              {trialDaysLeft === 0
                ? 'Your free trial ends today'
                : `${trialDaysLeft} days left in your free trial`}
            </span>
          )}
        </div>

        {/* Native can't take payment, so it explains where to. On the web a
            phone is a perfectly legal place to sell, so mobile web keeps the
            real plans and Stripe checkout. */}
        {!nativeApp && (
          <div className="flex flex-col gap-2.5">
            {[
              { id: topPlan, name: top.name, price: top.price, unit: top.unit, note: top.note, loading: loadingTop, badge: top.badge },
              { id: 'monthly' as const, name: 'Monthly Pro', price: monthly.price, unit: '/month', note: monthly.note, loading: loadingMonthly, badge: null as string | null },
            ].map(plan => (
              <div
                key={plan.id}
                className="rounded-[14px] p-4"
                style={{
                  background: 'var(--acq-surface-card)',
                  border: '1px solid var(--acq-border-subtle)',
                  boxShadow: 'var(--acq-shadow-sm)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--acq-text-heading)' }}>
                    {plan.name}
                  </span>
                  {plan.badge && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: 'var(--acq-surface-brand-wash)', color: 'var(--acq-text-brand)' }}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-end gap-1">
                  <span className="acq-tnum text-3xl font-bold" style={{ color: 'var(--acq-text-heading)' }}>
                    {plan.price}
                  </span>
                  <span className="mb-1 text-sm" style={{ color: 'var(--acq-text-muted)' }}>{plan.unit}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--acq-text-muted)' }}>{plan.note}</div>
                <div className="mt-1 text-xs font-semibold" style={{ color: 'var(--acq-text-brand)' }}>
                  {plan.id === 'monthly'
                    ? 'Streams everything. No PDF downloads.'
                    : 'Includes Lesson Book PDF downloads and the CLP ledger.'}
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loadingTop || loadingMonthly}
                  className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold text-white disabled:opacity-50"
                  style={{ background: 'var(--acq-teal)' }}
                  data-testid={`mobile-checkout-${plan.id}`}
                >
                  {plan.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Get {plan.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* How to upgrade */}
        {nativeApp && (
        <section
          className="rounded-[14px] p-4"
          style={{
            background: 'var(--acq-surface-card)',
            border: '1px solid var(--acq-border-subtle)',
            boxShadow: 'var(--acq-shadow-sm)',
          }}
        >
          <h2
            className="mb-3 text-xs font-bold uppercase tracking-[0.06em]"
            style={{ color: 'var(--acq-text-muted)' }}
          >
            How to upgrade
          </h2>
          <ol className="flex flex-col gap-3">
            {[
              <>On a computer or in your browser, go to <strong>acqlerate.com</strong> and sign in with {userEmail}.</>,
              <>Choose Monthly Pro or {topPlanName()}. Both come with a 30-day money-back guarantee.</>,
              <>Come back to the app. Sign out and back in and all {modules.length} modules unlock.</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-sm leading-[1.5]" style={{ color: 'var(--acq-text-body)' }}>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: 'var(--acq-surface-brand-wash)', color: 'var(--acq-text-brand)' }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">{text}</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border text-sm font-semibold"
            style={{ borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-body)' }}
            data-testid="pro-signout"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            Already upgraded? Sign out and back in
          </button>
        </section>
        )}

        {/* What you unlock */}
        <div>
          <h2
            className="mb-2 text-xs font-bold uppercase tracking-[0.06em]"
            style={{ color: 'var(--acq-text-muted)' }}
          >
            What You Unlock
          </h2>
          <div className="flex flex-col gap-2">
            {lockedModules.map(mod => {
              const theme = getModuleFamilyTheme(mod.id);
              const seq = modules.findIndex(m => m.id === mod.id) + 1;
              const quizCount = mod.lessons.reduce((n, l) => n + l.quizCount, 0);
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3"
                  style={{
                    background: 'var(--acq-surface-card)',
                    border: '1px solid var(--acq-border-subtle)',
                  }}
                >
                  <span
                    className="acq-tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-extrabold text-white"
                    style={{ background: moduleGradient(theme) }}
                  >
                    {String(seq).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold" style={{ color: 'var(--acq-text-heading)' }}>
                      {mod.title}
                    </span>
                    <span className="block text-xs" style={{ color: 'var(--acq-text-muted)' }}>
                      {mod.lessons.length} lessons · {quizCount} quiz questions ·{' '}
                      {formatClps(moduleClps(mod.id))}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guarantee */}
        <div
          className="rounded-[14px] p-[18px] text-center"
          style={{ background: 'var(--acq-surface-sunken)' }}
        >
          <Award className="mx-auto h-[22px] w-[22px]" style={{ color: 'var(--acq-teal)' }} strokeWidth={2} />
          <div className="mt-2 text-sm font-semibold" style={{ color: 'var(--acq-text-heading)' }}>
            30-Day Money-Back Guarantee
          </div>
          <p className="mt-1 text-xs leading-[1.5]" style={{ color: 'var(--acq-text-muted)' }}>
            If Acqlerate doesn't help you feel more confident about DoD acquisitions in 30 days,
            we'll refund your purchase — no questions asked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5" data-testid="upgrade-back">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Hero */}
      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Unlock the Full Academy</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Get access to every module, lesson, quiz, and resource —
          everything you need to launch or advance your DoD acquisitions career.
        </p>
        {trialDaysLeft !== null && (
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            {trialDaysLeft === 0
              ? "Your free trial ends today — lock in full access before it reverts to the free tier"
              : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`}
          </div>
        )}
      </div>

      {/* Price change notice, shown until the switch (web only: no prices on native) */}
      {!newPricing && !nativeApp && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm" data-testid="price-change-notice">
          <strong>Prices change October 1.</strong>{" "}
          <span className="text-muted-foreground">
            Lifetime Pro ($99 once) is sold through September 30, then it's replaced by Annual Pro at $149 a year.
            Monthly goes to $14.99, but if you subscribe at $5.99 before then, you keep $5.99 for as long as you stay.
          </span>
        </div>
      )}

      {/* Pricing Cards — 3 columns, matching landing page layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

        {/* ── Free ── */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <div className="text-base font-semibold text-muted-foreground mb-1">Free</div>
          {/* App Store 3.1.1: a native build must not display prices for
              content it can't sell through IAP. Previously only the purchase
              buttons were gated, so the figures still rendered on native. */}
          {!nativeApp && <>
            <div className="text-3xl font-bold mb-0.5">$0</div>
            <div className="text-xs text-muted-foreground mb-4">No credit card needed</div>
          </>}
          <ul className="space-y-2.5 mb-6 flex-1">
            {freeFeatures.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                {f}
              </li>
            ))}
            <li className="pt-1 border-t border-border" />
            {premiumModules.slice(0, 4).map(m => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{m.title.split(":")[0]}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full mt-auto" onClick={onBack} data-testid="stay-free">
            {trialDaysLeft !== null ? "No thanks, I'll drop to Free" : "Continue with Free"}
          </Button>
        </div>

        {/* ── Monthly ── */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col relative">
          <div className="text-base font-semibold mb-1">Monthly Pro</div>
          {!nativeApp && <>
            <div className="flex items-end gap-1 mb-0.5">
              <span className="text-3xl font-bold">{monthly.price}</span>
              <span className="text-muted-foreground text-sm mb-1">/month</span>
            </div>
            <div className="text-xs text-muted-foreground mb-4">{monthly.note}</div>
          </>}
          <ul className="space-y-2 mb-5 flex-1">
            {monthlyFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
            {monthlyExcluded.map((f, i) => (
              <li key={`x${i}`} className="flex items-start gap-2 text-sm text-muted-foreground/70">
                <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{f} <span className="text-xs">({newPricing ? "Annual" : "Lifetime"} only)</span></span>
              </li>
            ))}
          </ul>

          {nativeApp ? (
            <div className="bg-muted/40 rounded-xl p-4 text-center space-y-3 mt-auto">
              <Globe className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm font-semibold">Purchase on the Web</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visit <span className="font-medium text-primary">acqlerate.com</span> in your browser.
                Your account unlocks instantly.
              </p>
              <Button variant="outline" className="w-full gap-1.5 text-sm" asChild>
                <a href="https://acqlerate.com/app#/upgrade" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Go to Website
                </a>
              </Button>
            </div>
          ) : (
            <div className="mt-auto space-y-2">
              <Button
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => handleCheckout("monthly")}
                disabled={loadingTop || loadingMonthly}
                data-testid="upgrade-monthly"
              >
                {loadingMonthly ? (
                  <span className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Get Monthly Access →
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Secured by Stripe · Cancel anytime
              </p>
            </div>
          )}
        </div>

        {/* ── Top plan: Lifetime until the switch, Annual from it (featured) ── */}
        <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary rounded-xl p-5 flex flex-col relative">
          {!nativeApp && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap shadow-sm">
                <Star className="w-3 h-3" />
                {top.badge}
              </span>
            </div>
          )}
          <div className="text-base font-semibold mb-1">{top.name}</div>
          {!nativeApp && <>
            <div className="flex items-end gap-1 mb-0.5">
              <span className="text-3xl font-bold">{top.price}</span>
              <span className="text-muted-foreground text-sm mb-1">{top.unit}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-4">{top.note}</div>
          </>}
          <ul className="space-y-2 mb-5 flex-1">
            {topFeatures.map((f, i) => {
              const isExclusive = f.startsWith('\u2605');
              return (
                <li key={i} className={cn(
                  "flex items-start gap-2 text-sm",
                  isExclusive && "mt-1 pt-2 border-t border-primary/20"
                )}>
                  <CheckCircle className={cn(
                    "w-3.5 h-3.5 flex-shrink-0 mt-0.5",
                    isExclusive ? "text-primary" : "text-green-500"
                  )} />
                  <span className={isExclusive ? "text-primary font-semibold" : ""}>
                    {f.replace('\u2605 ', '')}
                  </span>
                </li>
              );
            })}
          </ul>

          {nativeApp ? (
            <div className="bg-muted/40 rounded-xl p-4 text-center space-y-3 mt-auto">
              <Globe className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm font-semibold">Purchase on the Web</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visit <span className="font-medium text-primary">acqlerate.com</span> in your browser.
                Your account unlocks instantly.
              </p>
              <Button variant="outline" className="w-full gap-1.5 text-sm" asChild>
                <a href="https://acqlerate.com/app#/upgrade" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Go to Website
                </a>
              </Button>
            </div>
          ) : (
            <div className="mt-auto space-y-2">
              <Button
                className="w-full gap-1.5"
                onClick={() => handleCheckout(topPlan)}
                disabled={loadingTop || loadingMonthly}
                data-testid={`upgrade-${topPlan}`}
              >
                {loadingTop ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {top.cta}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Secured by Stripe · 30-day guarantee{newPricing ? " · Cancel anytime" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manage Billing (for paid users — web only) */}
      {!nativeApp && (
        <div className="text-center">
          <button
            onClick={handleManageBilling}
            className="text-xs text-muted-foreground underline flex items-center gap-1 mx-auto hover:text-foreground transition-colors"
            data-testid="manage-billing"
          >
            <ExternalLink className="w-3 h-3" />
            Manage billing &amp; subscription
          </button>
        </div>
      )}

      {/* Module Preview */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">What You Unlock</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {premiumModules.map(mod => (
            <div key={mod.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <div className="text-2xl">{mod.icon}</div>
              <div>
                <div className="font-semibold text-sm">{mod.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {mod.lessons.length} lessons · {mod.lessons.reduce((sum, l) => sum + l.quizCount, 0)} quiz questions
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Reversal */}
      <div className="bg-muted/30 rounded-xl p-4 text-center">
        <Award className="w-6 h-6 text-primary mx-auto mb-2" />
        <p className="text-sm font-medium mb-1">30-Day Money-Back Guarantee</p>
        <p className="text-xs text-muted-foreground">
          If Acqlerate doesn&apos;t help you feel more confident about DoD acquisitions in 30 days,
          we&apos;ll refund your purchase — no questions asked.
        </p>
      </div>
    </div>
  );
}
