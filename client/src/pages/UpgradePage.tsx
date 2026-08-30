import { useState } from "react";
import { modules, getTotalLessons } from "@/lib/curriculum";
import { ArrowLeft, CheckCircle, Shield, Award, Zap, Lock, CreditCard, ExternalLink, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isNativeApp } from "@/lib/platform";
import { cn } from "@/lib/utils";

interface UpgradePageProps {
  onBack: () => void;
  onUpgrade: () => void; // retained for compatibility but Stripe takes over
  trialDaysLeft?: number | null;
}

export default function UpgradePage({ onBack, trialDaysLeft = null }: UpgradePageProps) {
  const totalLessons = getTotalLessons();
  const [loadingLifetime, setLoadingLifetime] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const nativeApp = isNativeApp();
  const { toast } = useToast();

  const freeFeatures = [
    "Module 1: Foundations (full access, 9 lessons)",
    "1 free preview lesson in every other module",
    "Progress tracking",
    "Key terms & glossary",
  ];

  const monthlyFeatures = [
    `All ${modules.length} modules — every domain covered`,
    `${totalLessons}+ in-depth lessons with real DoD content`,
    "All quiz questions with detailed explanations",
    "Key terms glossary for every lesson",
    "Career roadmap for gov & contractor tracks",
    "AI Study Assistant — limited",
    "Cancel anytime",
  ];

  const lifetimeFeatures = [
    `All ${modules.length} modules — every domain covered`,
    `${totalLessons}+ in-depth lessons with real DoD content`,
    "All quiz questions with detailed explanations",
    "Key terms glossary for every lesson",
    "Formulas, tables & quick-reference content",
    "Career roadmap for gov & contractor tracks",
    "Salary benchmarks & certification guidance",
    "AI Study Assistant — unlimited",
    "Lifetime content updates as regulations change",
    "Priority email support",
    "\u2605 \"How Do I Apply This?\" AI — exclusive to Lifetime",
  ];

  const premiumModules = modules.filter(m => !m.free);

  const handleCheckout = async (priceType: "lifetime" | "monthly") => {
    const setLoading = priceType === "lifetime" ? setLoadingLifetime : setLoadingMonthly;
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
            value: priceType === 'lifetime' ? 149 : 5.99,
            items: [{ item_name: `Acqlerate Pro ${priceType}`, price: priceType === 'lifetime' ? 149 : 5.99 }],
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

      {/* Pricing Cards — 3 columns, matching landing page layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

        {/* ── Free ── */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <div className="text-base font-semibold text-muted-foreground mb-1">Free</div>
          <div className="text-3xl font-bold mb-0.5">$0</div>
          <div className="text-xs text-muted-foreground mb-4">No credit card needed</div>
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

        {/* ── Monthly (featured / center) ── */}
        <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary rounded-xl p-5 flex flex-col relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap shadow-sm">
              <Star className="w-3 h-3" />
              Most Popular
            </span>
          </div>
          <div className="text-base font-semibold mb-1">Monthly Pro</div>
          <div className="flex items-end gap-1 mb-0.5">
            <span className="text-3xl font-bold">$5.99</span>
            <span className="text-muted-foreground text-sm mb-1">/month</span>
          </div>
          <div className="text-xs text-muted-foreground mb-4">Cancel anytime</div>
          <ul className="space-y-2 mb-5 flex-1">
            {monthlyFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
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
                className="w-full gap-1.5"
                onClick={() => handleCheckout("monthly")}
                disabled={loadingLifetime || loadingMonthly}
                data-testid="upgrade-monthly"
              >
                {loadingMonthly ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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

        {/* ── Lifetime ── */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-background border border-border text-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
              Best Value
            </span>
          </div>
          <div className="text-base font-semibold mb-1">Lifetime Pro</div>
          <div className="flex items-end gap-1 mb-0.5">
            <span className="text-3xl font-bold">$149</span>
            <span className="text-muted-foreground text-sm mb-1">one-time</span>
          </div>
          <div className="text-xs text-muted-foreground mb-4">Pay once, own it forever</div>
          <ul className="space-y-2 mb-5 flex-1">
            {lifetimeFeatures.map((f, i) => {
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
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => handleCheckout("lifetime")}
                disabled={loadingLifetime || loadingMonthly}
                data-testid="upgrade-lifetime"
              >
                {loadingLifetime ? (
                  <span className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Get Lifetime Access →
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Secured by Stripe · 30-day guarantee
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
                  {mod.lessons.length} lessons · {mod.lessons.reduce((sum, l) => sum + (l.quiz?.length ?? 0), 0)} quiz questions
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
