import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Eye, EyeOff, Zap, Lock, BookOpen, Award, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

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

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  subscriptionStatus: string;
  completedLessons: string[];
  quizScores: Record<string, number>;
}

interface AuthPageProps {
  onAuthenticated: (user: AuthUser) => void;
  darkMode: boolean;
  onBack?: () => void;
}

const highlights = [
  { icon: BookOpen, label: "15+ in-depth lessons" },
  { icon: Zap, label: "XP tracking & gamification" },
  { icon: Award, label: "DoD Acquisitions expertise" },
  { icon: Lock, label: "Secure, private progress" },
];

export default function AuthPage({ onAuthenticated, darkMode, onBack }: AuthPageProps) {
  const [tab, setTab] = useState<"login" | "register">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      const res = await apiRequest("POST", "/api/auth/register", payload);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      toast({ title: "Welcome to AcqPro!", description: "Your account has been created." });
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary" />
          </div>
          <div>
            <div className="font-bold text-base text-sidebar-foreground">AcqPro</div>
            <div className="text-[11px] text-sidebar-foreground/50">Defense Acquisitions Academy</div>
          </div>
        </div>

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
            "AcqPro gave me exactly what I needed to understand the FAR, DFARS, and how 
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
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm">AcqPro</div>
            <div className="text-[10px] text-muted-foreground">Defense Academy</div>
          </div>
        </div>

        <div className="w-full max-w-md">
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
