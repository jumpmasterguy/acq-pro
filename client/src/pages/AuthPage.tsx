import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Zap, Lock, BookOpen, Award, ArrowLeft } from "lucide-react";
import { AcqlerateLogo } from "@/components/AcqlerateLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, API_BASE } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativeApp } from "@/lib/platform";

// Official Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export type SkillLevel = 'novice' | 'intermediate' | 'advanced';

export interface UserProfile {
  role: 'dod_employee' | 'dod_contractor' | 'career_changer' | 'student';
  experience: 'new' | 'some' | 'experienced';
  goal: 'contracts_finance' | 'bd_capture' | 'program_management' | 'full_picture';
  completedOnboarding: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  subscriptionStatus: string;
  trialEndsAt?: string | null;
  completedLessons: string[];
  quizScores: Record<string, number>;
  isAdmin?: boolean;
  moduleSkillLevels?: Record<string, SkillLevel>;
  moduleAssessmentScores?: Record<string, number>;
  userProfile?: UserProfile | null;
  currentStreak?: number;
  longestStreak?: number;
  lastChallengeDate?: string | null;
  /** YYYY-MM-DD of the last day with activity. Drives the mobile week strip. */
  lastStreakDate?: string | null;
  /** XP earned from Daily Challenge completions (server-tracked, separate from lesson/quiz XP). */
  dailyChallengeXP?: number;
  /** XP earned from Acquisition This Week briefs (server-tracked, same deal). */
  briefsXP?: number;
}

interface AuthPageProps {
  onAuthenticated: (user: AuthUser) => void;
  darkMode: boolean;
  onBack?: () => void;
  // Shown above the tab switcher, e.g. after the idle-timeout middleware
  // (server/auth.ts) ends a session server-side — so it doesn't look like
  // an unexplained sign-out.
  notice?: string;
}

const highlights = [
  { icon: BookOpen, label: "48 in-depth lessons" },
  { icon: Zap, label: "XP tracking & gamification" },
  { icon: Award, label: "DoD Acquisitions expertise" },
  { icon: Lock, label: "Secure, private progress" },
];

export default function AuthPage({ onAuthenticated, darkMode, onBack, notice }: AuthPageProps) {
  const [tab, setTab] = useState<"login" | "register">(notice ? "login" : "register");
  const [referralCode, setReferralCode] = useState<string>("");

  // 'auth' is the normal sign-in/register pair. 'forgot' asks for an email,
  // 'reset' is what the emailed link lands on.
  const [flow, setFlow] = useState<"auth" | "forgot" | "reset">("auth");
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Pick up ?ref=CODE, ?mode=login and the reset link's ?token= from URL hash params
  useEffect(() => {
    const hash = window.location.hash; // e.g. #/auth?ref=LUCAS123 or #/reset-password?token=...
    const queryStart = hash.indexOf('?');
    if (queryStart >= 0) {
      const params = new URLSearchParams(hash.slice(queryStart + 1));
      const ref = params.get('ref');
      if (ref) { setReferralCode(ref); setTab('register'); }
      if (params.get('mode') === 'login') { setTab('login'); }
      const token = params.get('token');
      if (token && hash.startsWith('#/reset-password')) {
        setResetToken(token);
        setFlow('reset');
      }
    }
  }, []);

  // Always reports success. The server does the same, so neither the page nor
  // the API can be used to work out which email addresses have accounts.
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/request-password-reset", { email: resetEmail });
    } catch { /* deliberately silent — see above */ }
    setLoading(false);
    setResetSent(true);
  };

  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords don't match", description: "Both fields need to be the same.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token: resetToken, password: newPassword });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "That link didn't work.");
      toast({ title: "Password set", description: "You can sign in with it now." });
      window.history.replaceState(null, '', window.location.pathname);
      setFlow('auth');
      setTab('login');
    } catch (err: any) {
      toast({ title: "Couldn't set your password", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Google OAuth: redirect to server-side OAuth flow (full page redirect)
  const handleGoogleSignIn = () => {
    const base = API_BASE || "";
    window.location.href = `${base}/api/auth/google`;
  };

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const getErrorMessage = (err: any): string => {
    if (err.message) {
      // Strip raw JSON from message if present
      try {
        const parsed = JSON.parse(err.message.replace(/^\d+:\s*/, ''));
        if (parsed.message) return parsed.message;
      } catch {}
      return err.message.replace(/^\d+:\s*\{.*?\}$/, 'Invalid email or password');
    }
    return 'Something went wrong. Please try again.';
  };

  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", values);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid email or password");
      if (!data.id || !data.email) throw new Error("Invalid session response — please try again");
      onAuthenticated(data);
    } catch (err: any) {
      toast({ title: "Login failed", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = values;
      const res = await apiRequest("POST", "/api/auth/register", {
        ...payload,
        ...(referralCode ? { referralCode } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      toast({ title: "Welcome to Acqlerate!", description: "Your account has been created." });
      onAuthenticated(data);
    } catch (err: any) {
      toast({ title: "Registration failed", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Native has no marketing site to return to, and capacitor.config.ts sets
  // limitsNavigationsToAppBoundDomains, so the homepage link would strand the
  // user rather than navigate. The handoff's auth screen has no Back button.
  const showBack = !!onBack && !isNativeApp();

  // Forgot-password and set-password are full-screen on their own rather than
  // squeezed into the tab card: they are one-shot, arrive cold from an email,
  // and the branding panel has nothing to add to either. Controls are 44px so
  // they clear the iOS and Android minimum touch target.
  if (flow === 'forgot' || flow === 'reset') {
    const backToSignIn = (
      <button
        type="button"
        onClick={() => { setFlow('auth'); setTab('login'); }}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 min-h-11"
        data-testid="link-back-to-signin"
      >
        Back to sign in
      </button>
    );

    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center p-6 safe-top",
        isMobile ? "acq-auth acq-shell acq-fullscreen acq-inset-top" : "bg-background",
      )}>
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-center">
            <AcqlerateLogo className="h-9" />
          </div>

          {flow === 'forgot' && (resetSent ? (
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-bold text-foreground">Check your email</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If there's an account for <span className="font-medium text-foreground">{resetEmail}</span>, a link to set
                a password is on its way. It works once and expires in an hour.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Signed up with Google? Same link — it lets you add a password so you can sign in here.
              </p>
              {backToSignIn}
            </div>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enter your email and we'll send a link. This also works if you created your account with Google and
                  have never had a password.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-11"
                  data-testid="input-reset-email"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 gap-2" disabled={loading} data-testid="btn-request-reset">
                {loading ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                Email me a link
              </Button>
              {backToSignIn}
            </form>
          ))}

          {flow === 'reset' && (
            <form onSubmit={handleSubmitReset} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <h1 className="text-xl font-bold text-foreground">Choose a password</h1>
                <p className="text-sm text-muted-foreground">At least 8 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 pr-10"
                    data-testid="input-new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm Password</Label>
                <Input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="h-11"
                  data-testid="input-confirm-new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 gap-2" disabled={loading} data-testid="btn-submit-reset">
                {loading ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                Save password
              </Button>
              {backToSignIn}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col lg:flex-row safe-top",
        isMobile ? "acq-auth acq-shell acq-fullscreen acq-inset-top" : "bg-background",
      )}
    >
      {/* Left panel — branding. Deliberately dark regardless of the app's
          light/dark toggle (a "deep field" brand treatment, not the sidebar
          theme) — see claude/auth-page-logo-back-link-2026-09.md for why. */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-10 relative overflow-hidden text-white"
        style={{ background: "linear-gradient(165deg, #0a1e23 0%, #0e2c30 55%, #0a2226 100%)" }}
      >
        {/* Decorative hexagon field — echoes the logo's own hex mark, enlarged */}
        <svg
          width="620" height="620" viewBox="0 0 620 620"
          className="absolute -top-36 -right-56 opacity-50 pointer-events-none"
          aria-hidden="true"
        >
          <polygon points="310,40 500,150 500,370 310,480 120,370 120,150" fill="none" stroke="#164047" strokeWidth="2" />
          <polygon points="310,110 440,185 440,335 310,410 180,335 180,185" fill="none" stroke="#1d5058" strokeWidth="2" />
        </svg>
        <svg
          width="420" height="420" viewBox="0 0 420 420"
          className="absolute -bottom-24 -left-36 opacity-45 pointer-events-none"
          aria-hidden="true"
        >
          <polygon points="210,20 350,100 350,260 210,340 70,260 70,100" fill="none" stroke="#164047" strokeWidth="2" />
        </svg>
        <div
          className="absolute top-28 right-16 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.16) 0%, rgba(45,212,191,0) 70%)" }}
        />

        {/* Logo — clickable back to the homepage whenever we can (see onBack) */}
        <div className="relative z-10">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center self-start hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Back to homepage"
              title="Back to homepage"
            >
              <AcqlerateLogo iconSize={40} wordmarkTheme="light" />
            </button>
          ) : (
            <AcqlerateLogo iconSize={40} wordmarkTheme="light" />
          )}
        </div>

        {/* Hero copy */}
        <div className="space-y-6 relative z-10">
          <div>
            <h1 className="text-3xl font-bold leading-tight mb-3 text-white">
              Master DoD Acquisitions.<br />
              <span style={{ color: "#2dd4bf" }}>Advance your career.</span>
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              The comprehensive training platform for professionals breaking into
              Defense Program Management — finance, contracts, data, capture, and ops.
            </p>
          </div>

          <div className="space-y-3">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(45,212,191,0.14)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#2dd4bf" }} />
                </div>
                <span className="text-sm text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div
          className="rounded-xl p-5 relative z-10"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-sm italic mb-3 text-white/80">
            "Acqlerate gave me exactly what I needed to understand the FAR, DFARS, and how
            defense budgets actually work — all in one place."
          </p>
          <div className="text-xs text-white/45">— Defense PM Candidate</div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div
        className={cn(
          "flex-1 flex flex-col items-center justify-center",
          isMobile ? "px-5 pb-8" : "px-6 py-12",
        )}
      >
        {/* Back button */}
        {showBack && (
          <div className="w-full max-w-md mb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* Mobile logo — centered, 28px of air above and below */}
        <div className={cn("lg:hidden", isMobile ? "py-7" : "mb-8")}>
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Back to homepage"
              title="Back to homepage"
            >
              <AcqlerateLogo iconSize={36} />
            </button>
          ) : (
            <AcqlerateLogo iconSize={36} />
          )}
        </div>

        <div className="w-full max-w-md">
          {notice && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2.5 mb-4 text-xs text-amber-700 dark:text-amber-300">
              <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{notice}</span>
            </div>
          )}
          {/* Tab switcher */}
          <div
            className={cn(
              "flex gap-1 rounded-lg mb-8",
              isMobile ? "gap-1 rounded-[10px] p-1 mb-7" : "p-1 bg-muted",
            )}
            style={isMobile ? { background: "var(--acq-surface-sunken)" } : undefined}
          >
            <button
              onClick={() => setTab("register")}
              className={cn(
                "flex-1 text-sm font-medium transition-all",
                isMobile ? "min-h-[44px] rounded-[7px] p-2.5" : "py-2 rounded-md",
                !isMobile && (tab === "register"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"),
              )}
              style={isMobile ? (tab === "register"
                ? { background: "var(--acq-surface-card)", color: "var(--acq-text-heading)", boxShadow: "var(--acq-shadow-sm)" }
                : { color: "var(--acq-text-muted)" }) : undefined}
              data-testid="tab-register"
            >
              Create Account
            </button>
            <button
              onClick={() => setTab("login")}
              className={cn(
                "flex-1 text-sm font-medium transition-all",
                isMobile ? "min-h-[44px] rounded-[7px] p-2.5" : "py-2 rounded-md",
                !isMobile && (tab === "login"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"),
              )}
              style={isMobile ? (tab === "login"
                ? { background: "var(--acq-surface-card)", color: "var(--acq-text-heading)", boxShadow: "var(--acq-shadow-sm)" }
                : { color: "var(--acq-text-muted)" }) : undefined}
              data-testid="tab-login"
            >
              Sign In
            </button>
          </div>

          {/* ── Register Form ── */}
          {tab === "register" && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold">Start learning for free</h2>
                <p className="text-sm text-muted-foreground">
                  Create your account — Module 1 is completely free.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="reg-first-name">First Name</Label>
                  <Input
                    id="reg-first-name"
                    placeholder="Jane"
                    autoComplete="given-name"
                    data-testid="input-first-name"
                    {...registerForm.register("firstName")}
                    className={registerForm.formState.errors.firstName ? "border-destructive" : ""}
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-last-name">Last Name</Label>
                  <Input
                    id="reg-last-name"
                    placeholder="Smith"
                    autoComplete="family-name"
                    data-testid="input-last-name"
                    {...registerForm.register("lastName")}
                    className={registerForm.formState.errors.lastName ? "border-destructive" : ""}
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-email">Email Address</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  data-testid="input-email-register"
                  {...registerForm.register("email")}
                  className={registerForm.formState.errors.email ? "border-destructive" : ""}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    data-testid="input-password-register"
                    {...registerForm.register("password")}
                    className={cn("pr-10", registerForm.formState.errors.password ? "border-destructive" : "")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-confirm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    data-testid="input-confirm-password"
                    {...registerForm.register("confirmPassword")}
                    className={cn("pr-10", registerForm.formState.errors.confirmPassword ? "border-destructive" : "")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading}
                data-testid="btn-register"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Create Free Account
              </Button>

              {/* Google sign-in, web only. Google refuses OAuth inside an app's
                  embedded browser, and handing it to the system browser puts the
                  session cookie in Safari's jar where the app can't see it. App
                  users sign in with email and password; "Forgot password" also
                  covers Google-created accounts, which have no password yet. */}
              {!isNativeApp() && (
                <>
                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2.5 font-medium"
                    onClick={handleGoogleSignIn}
                    data-testid="btn-google-register"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </Button>
                </>
              )}

              {/* These were inert <span>s — underlined, cursor-pointer, no
                  destination. App Store review checks that they resolve. */}
              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms of Service</a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
              </p>
            </form>
          )}

          {/* ── Login Form ── */}
          {tab === "login" && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold">Welcome back</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to continue your learning journey.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-email">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  data-testid="input-email-login"
                  {...loginForm.register("email")}
                  className={loginForm.formState.errors.email ? "border-destructive" : ""}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    autoComplete="current-password"
                    data-testid="input-password-login"
                    {...loginForm.register("password")}
                    className={cn("pr-10", loginForm.formState.errors.password ? "border-destructive" : "")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading}
                data-testid="btn-login"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Sign In
              </Button>

              <button
                type="button"
                onClick={() => { setResetEmail(loginForm.getValues("email") || ""); setResetSent(false); setFlow('forgot'); }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                data-testid="link-forgot-password"
              >
                Forgot your password?
              </button>

              {/* Google sign-in, web only. Google refuses OAuth inside an app's
                  embedded browser, and handing it to the system browser puts the
                  session cookie in Safari's jar where the app can't see it. App
                  users sign in with email and password; "Forgot password" also
                  covers Google-created accounts, which have no password yet. */}
              {!isNativeApp() && (
                <>
                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2.5 font-medium"
                    onClick={handleGoogleSignIn}
                    data-testid="btn-google-login"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </Button>
                </>
              )}

              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-primary underline"
                  data-testid="link-to-register"
                >
                  Create one free
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
