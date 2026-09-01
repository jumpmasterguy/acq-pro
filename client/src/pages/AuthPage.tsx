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
  username: z.string().min(2, "Name must be at least 2 characters").max(50),
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
  /** XP earned from Daily Challenge completions (server-tracked, separate from lesson/quiz XP). */
  dailyChallengeXP?: number;
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
  { icon: BookOpen, label: "15+ in-depth lessons" },
  { icon: Zap, label: "XP tracking & gamification" },
  { icon: Award, label: "DoD Acquisitions expertise" },
  { icon: Lock, label: "Secure, private progress" },
];

export default function AuthPage({ onAuthenticated, darkMode, onBack, notice }: AuthPageProps) {
  const [tab, setTab] = useState<"login" | "register">(notice ? "login" : "register");
  const [referralCode, setReferralCode] = useState<string>("");

  // Pick up ?ref=CODE and ?mode=login from URL hash params
  useEffect(() => {
    const hash = window.location.hash; // e.g. #/auth?ref=LUCAS123 or #/auth?mode=login
    const queryStart = hash.indexOf('?');
    if (queryStart >= 0) {
      const params = new URLSearchParams(hash.slice(queryStart + 1));
      const ref = params.get('ref');
      if (ref) { setReferralCode(ref); setTab('register'); }
      if (params.get('mode') === 'login') { setTab('login'); }
    }
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
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
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
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

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row safe-top">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-sidebar text-sidebar-foreground p-10">
        {/* Logo */}
        <AcqlerateLogo iconSize={40} />

        {/* Hero copy */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold leading-tight mb-3">
              Master DoD Acquisitions.<br />
              <span className="text-sidebar-primary">Advance your career.</span>
            </h1>
            <p className="text-sidebar-foreground/60 text-sm leading-relaxed max-w-sm">
              The comprehensive training platform for professionals breaking into 
              Defense Program Management — finance, contracts, data, capture, and ops.
            </p>
          </div>

          <div className="space-y-3">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-sidebar-primary" />
                </div>
                <span className="text-sm text-sidebar-foreground/80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-sidebar-accent rounded-xl p-5">
          <p className="text-sm text-sidebar-foreground/80 italic mb-3">
            "Acqlerate gave me exactly what I needed to understand the FAR, DFARS, and how 
            defense budgets actually work — all in one place."
          </p>
          <div className="text-xs text-sidebar-foreground/50">— Defense PM Candidate</div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Back button */}
        {onBack && (
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

        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <AcqlerateLogo iconSize={36} />
        </div>

        <div className="w-full max-w-md">
          {notice && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2.5 mb-4 text-xs text-amber-700 dark:text-amber-300">
              <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{notice}</span>
            </div>
          )}
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-8">
            <button
              onClick={() => setTab("register")}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                tab === "register"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="tab-register"
            >
              Create Account
            </button>
            <button
              onClick={() => setTab("login")}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                tab === "login"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
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

              <div className="space-y-1">
                <Label htmlFor="reg-name">Full Name</Label>
                <Input
                  id="reg-name"
                  placeholder="Jane Smith"
                  data-testid="input-name"
                  {...registerForm.register("username")}
                  className={registerForm.formState.errors.username ? "border-destructive" : ""}
                />
                {registerForm.formState.errors.username && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-email">Email Address</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="jane@example.com"
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google Sign-In */}
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

              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our{" "}
                <span className="underline cursor-pointer">Terms of Service</span>{" "}
                and{" "}
                <span className="underline cursor-pointer">Privacy Policy</span>.
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google Sign-In */}
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
