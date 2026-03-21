import { useState } from "react";
import { modules, getTotalLessons } from "@/lib/curriculum";
import { ArrowLeft, CheckCircle, Shield, Award, Zap, Lock, CreditCard, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isNativeApp } from "@/lib/platform";

interface UpgradePageProps {
  onBack: () => void;
  onUpgrade: () => void; // retained for compatibility but Stripe takes over
}

export default function UpgradePage({ onBack }: UpgradePageProps) {
  const totalLessons = getTotalLessons();
  const [loadingLifetime, setLoadingLifetime] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const nativeApp = isNativeApp();
  const { toast } = useToast();

  const proFeatures = [
    `All ${modules.length} modules — every domain covered`,
    `${totalLessons}+ in-depth lessons with real DoD content`,
    "All quiz questions with detailed explanations",
    "Key terms glossary for every lesson",
    "Formulas, tables, and quick-reference content",
    "Career roadmap for government and contractor tracks",
    "Salary benchmarks and certification guidance",
    "Content updates as regulations change",
    "Priority email support",
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
          Get lifetime access to every module, lesson, quiz, and resource — 
          everything you need to launch or advance your DoD acquisitions career.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Free */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-base font-semibold mb-1">Free</div>
          <div className="text-3xl font-bold mb-4">$0</div>
          <ul className="space-y-2.5 mb-6">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Module 1: Foundations (complete)
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Progress tracking &amp; XP
            </li>
            {premiumModules.map(m => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 flex-shrink-0" />
                {m.title}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" onClick={onBack} data-testid="stay-free">
            Continue with Free
          </Button>
        </div>

        {/* Pro */}
        <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary rounded-xl p-5 relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
            Best Value
          </Badge>
          <div className="text-base font-semibold mb-1">Pro Access</div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-3xl font-bold">$149</span>
            <span className="text-muted-foreground text-sm mb-1">one-time</span>
          </div>
          <div className="text-xs text-muted-foreground mb-4">or $5.99/month — cancel anytime</div>
          <ul className="space-y-2 mb-5">
            {proFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          {nativeApp ? (
            /* ── iOS native: no payment buttons (Apple policy) ── */
            <div className="bg-muted/40 rounded-xl p-4 text-center space-y-3">
              <Globe className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm font-semibold">Purchase on the Web</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To unlock Pro access, visit{" "}
                <span className="font-medium text-primary">acq-pro-production.up.railway.app</span>{" "}
                in your browser and complete your purchase there.
                Your account unlocks instantly — just sign back in here.
              </p>
              <Button variant="outline" className="w-full gap-1.5 text-sm" asChild>
                <a
                  href="https://acq-pro-production.up.railway.app/#/upgrade"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Go to Website to Purchase
                </a>
              </Button>
            </div>
          ) : (
            /* ── Web: full Stripe checkout ── */
            <>
              <Button
                className="w-full gap-1.5 mb-2"
                onClick={() => handleCheckout("lifetime")}
                disabled={loadingLifetime || loadingMonthly}
                data-testid="upgrade-lifetime"
              >
                {loadingLifetime ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Get Lifetime Access — $149
              </Button>

              <Button
                variant="outline"
                className="w-full gap-1.5 text-sm"
                onClick={() => handleCheckout("monthly")}
                disabled={loadingLifetime || loadingMonthly}
                data-testid="upgrade-monthly"
              >
                {loadingMonthly ? (
                  <span className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Start Monthly — $5.99/mo
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-2">
                Secured by Stripe · 30-day money-back guarantee
              </p>
            </>
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
                  {mod.lessons.length} lessons · {mod.lessons.reduce((sum, l) => sum + l.quiz.length, 0)} quiz questions
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
          If Acqlerate doesn't help you feel more confident about DoD acquisitions in 30 days, 
          we'll refund your purchase — no questions asked.
        </p>
      </div>
    </div>
  );
}
