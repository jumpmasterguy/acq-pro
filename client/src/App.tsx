import { useState, useEffect, useCallback, useRef, Component } from "react";
import type { ReactNode } from "react";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FREE_MODULES, FREE_PREVIEW_LESSONS, getModuleProgress, getLevel, calculateXP } from "@/lib/progress";
import { hasFullAccess, trialDaysRemaining } from "@shared/access";
import { isNativeApp } from "@/lib/platform";
import { modules } from "@/lib/curriculum";
import { LayoutDashboard, BookOpen, Award, LogOut, Sun, Moon, Menu, X, Zap, User, ShieldCheck, BarChart3, ChevronRight, ChevronDown, Lock, Download, FolderOpen, Wrench, Sparkles, ExternalLink, Calculator, Flame } from "lucide-react";
import { SIDEBAR_RESOURCES } from "@/lib/resources";
import { FAR_TRANSLATOR, TOOLS_DIRECTORY } from "@/lib/toolsDirectory";
import { AcqlerateLogo } from "@/components/AcqlerateLogo";
import InstallPrompt from "@/components/InstallPrompt";

// ── Error Boundary — catches render crashes and shows a recovery UI ─────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md font-mono bg-muted px-3 py-2 rounded">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} className="text-sm text-primary underline">← Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Tiny inline component — sidebar link that triggers PWA install
function PWAInstallLink() {
  // Guard: window.matchMedia not available in all environments
  try {
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);
    if (isStandalone) return null;
  } catch { return null; }
  return (
    <button
      onClick={() => {
        try { window.dispatchEvent(new Event('pwa-install-request')); } catch {}
      }}
      className="text-[10px] text-primary/60 hover:text-primary transition-colors"
    >
      Install App
    </button>
  );
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ModulePage from "@/pages/ModulePage";
import LessonPage from "@/pages/LessonPage";
import UpgradePage from "@/pages/UpgradePage";
import AuthPage, { type AuthUser, type SkillLevel, type UserProfile } from "@/pages/AuthPage";
import AdminPage from "@/pages/AdminPage";
import AdminAnalytics from "@/pages/AdminAnalytics";
import PDUTracker from "@/pages/PDUTracker";
import CostTrackerIntroPage from "@/pages/cost/CostTrackerIntroPage";
import CostProjectsPage from "@/pages/cost/CostProjectsPage";
import CostProjectDetailPage from "@/pages/cost/CostProjectDetailPage";
import CostRatesPage from "@/pages/cost/CostRatesPage";
import CostTaskOrdersPage from "@/pages/cost/CostTaskOrdersPage";
import CostTaskOrderDetailPage from "@/pages/cost/CostTaskOrderDetailPage";
import { ModuleAssessment } from "@/components/ModuleAssessment";
import OnboardingFlow from "@/components/OnboardingFlow";
import { apiRequest } from "@/lib/queryClient";

// View types
type View =
  | { type: 'landing' }
  | { type: 'auth' }
  | { type: 'onboarding' }
  | { type: 'dashboard' }
  | { type: 'module'; moduleId: string; activeCareer?: string }
  | { type: 'lesson'; lessonId: string; activeCareer?: string }
  | { type: 'upgrade' }
  | { type: 'admin' }
  | { type: 'analytics' }
  | { type: 'pdu' }
  | { type: 'costTrackerIntro' }
  | { type: 'costProjects' }
  | { type: 'costProject'; projectId: string }
  | { type: 'costRates' }
  | { type: 'costTaskOrders' }
  | { type: 'costTaskOrder'; taskOrderId: string };

// Auth state
type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: AuthUser };

function buildProgressFromUser(user: AuthUser) {
  const isPremium = hasFullAccess(user);
  return {
    completedLessons: new Set<string>(user.completedLessons ?? []),
    quizScores: user.quizScores ?? {},
    unlockedModules: new Set<string>(['foundations']),
    isPremium,
    xp: 0,
  };
}

const VIEW_STORAGE_KEY = 'acqpro_last_view';

function saveView(v: View) {
  // Only persist meaningful authenticated views
  if (v.type === 'landing' || v.type === 'auth') return;
  try { sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(v)); } catch {}
}

function loadSavedView(): View | null {
  try {
    const raw = sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as View;
    const valid: View['type'][] = ['dashboard', 'module', 'lesson', 'upgrade', 'admin', 'analytics', 'pdu', 'costProjects', 'costRates', 'costTaskOrders'];
    if (!valid.includes(parsed.type)) return null;
    // Validate lesson ID still exists in curriculum
    if (parsed.type === 'lesson') {
      const { modules: allMods } = require('@/lib/curriculum');
      const exists = allMods.some((m: any) => m.lessons.some((l: any) => l.id === (parsed as any).lessonId));
      if (!exists) return { type: 'dashboard' };
    }
    return parsed;
  } catch { return null; }
}

function clearSavedView() {
  try { sessionStorage.removeItem(VIEW_STORAGE_KEY); } catch {}
}

// Deep-link support: a URL like acqlerate.com/#/module/finance (used in
// emails, social posts, etc.) should open straight to that module instead of
// dumping everyone on the dashboard. Wins over the saved session view, since
// clicking a specific link is a more explicit signal than "wherever I was."
function parseHashView(): View | null {
  const hash = window.location.hash;
  const moduleMatch = hash.match(/^#\/module\/([a-z-]+)/);
  if (moduleMatch) {
    const id = moduleMatch[1];
    return modules.some(m => m.id === id) ? { type: 'module', moduleId: id } : null;
  }
  const lessonMatch = hash.match(/^#\/lesson\/([a-z0-9-]+)/);
  if (lessonMatch) {
    const id = lessonMatch[1];
    const exists = modules.some(m => m.lessons.some(l => l.id === id));
    return exists ? { type: 'lesson', lessonId: id } : null;
  }
  if (hash.startsWith('#/upgrade')) return { type: 'upgrade' };
  if (hash.startsWith('#/dashboard')) return { type: 'dashboard' };
  if (hash.startsWith('#/cost')) return { type: 'costTrackerIntro' };
  return null;
}

function AppContent() {
  // Check if we arrived via a landing page CTA (/app#/auth)
  const arrivedAtAuth = typeof window !== 'undefined' &&
    window.location.hash.startsWith('#/auth');
  // Capture any deep link (e.g. #/lesson/finance-8 from an email) once, at
  // mount, before the session check or anything else touches the hash. If
  // the visitor turns out to be logged out, we route them to login instead
  // of the marketing landing page, and send them on to this exact spot the
  // moment they're in — instead of dropping a signed-out click on the
  // homepage and a fresh login on the dashboard, both losing the destination.
  const pendingDeepLinkRef = useRef<View | null>(
    typeof window !== 'undefined' ? parseHashView() : null
  );
  const [view, setView] = useState<View>(
    arrivedAtAuth ? { type: 'auth' } : pendingDeepLinkRef.current ? { type: 'auth' } : { type: 'landing' }
  );
  // Dark mode — persisted in cookie (works on Railway, not a sandboxed iframe)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const c = document.cookie.split('; ').find(r => r.startsWith('theme='));
      if (c) return c.split('=')[1] !== 'light';
    } catch {}
    return true; // default dark
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [resourcesExpanded, setResourcesExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  // Module assessment modal state
  const [assessmentModuleId, setAssessmentModuleId] = useState<string | null>(null);
  const [showLevels, setShowLevels] = useState(false);
  // Burn Rate (streak) — surfaced persistently in the sidebar, not just on the
  // Dashboard page, so it behaves like Duolingo's always-visible flame.
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });

  // Derived progress from server auth
  const isPremium =
    authState.status === 'authenticated' && hasFullAccess(authState.user);
  const trialDaysLeft =
    authState.status === 'authenticated' ? trialDaysRemaining(authState.user) : null;
  // Distinct from isPremium: a trialing user has full access right now but
  // hasn't actually paid, so they should still see the upgrade CTA/countdown.
  const isActuallyPaid =
    authState.status === 'authenticated' &&
    (authState.user.subscriptionStatus === 'active' || authState.user.subscriptionStatus === 'lifetime');
  const completedLessons =
    authState.status === 'authenticated'
      ? new Set<string>(authState.user.completedLessons ?? [])
      : new Set<string>();
  const quizScores =
    authState.status === 'authenticated' ? authState.user.quizScores ?? {} : {};

  // Daily Challenge XP is tracked separately server-side (see toPassportUser
  // in server/auth.ts) — fold it in here so it counts toward the user's
  // total XP everywhere the total is shown (sidebar badge, Dashboard stat).
  const dailyChallengeXP =
    authState.status === 'authenticated' ? authState.user.dailyChallengeXP ?? 0 : 0;

  const progress = {
    completedLessons,
    quizScores,
    unlockedModules: new Set<string>(['foundations']),
    isPremium,
    xp: calculateXP(completedLessons, quizScores, dailyChallengeXP),
  };

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  const toggleDark = () => setDarkMode(d => {
    const next = !d;
    try { document.cookie = `theme=${next ? 'dark' : 'light'};path=/;max-age=31536000`; } catch {}
    return next;
  });

  // Activity heartbeat — sends accumulated active-minutes to server every 2 mins
  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    // Track how many minutes we've accumulated since last ping
    let accumulatedMins = 0;
    let lastTick = Date.now();
    const TICK_MS = 30_000;   // check every 30s
    const PING_MINS = 2;      // ping every 2 accumulated minutes
    const ticker = setInterval(() => {
      if (document.hidden) return; // don't count when tab is hidden
      const now = Date.now();
      const elapsed = (now - lastTick) / 60000; // minutes
      lastTick = now;
      accumulatedMins += elapsed;
      if (accumulatedMins >= PING_MINS) {
        const minsToSend = Math.floor(accumulatedMins);
        accumulatedMins -= minsToSend;
        apiRequest('POST', '/api/track-activity', { minutesActive: minsToSend }).catch(() => {});
      }
    }, TICK_MS);
    return () => clearInterval(ticker);
  }, [authState.status]);

  // Persist view changes to sessionStorage
  useEffect(() => {
    if (authState.status === 'authenticated') {
      saveView(view);
    }
  }, [view, authState.status]);

  // ── Browser back/forward support ──────────────────────────────────────────
  // The app doesn't use real URL routes for dashboard/module/lesson — it's all
  // in-memory view state. Without this, the browser history stack never grows
  // as the user navigates deeper into the app, so pressing Back from a lesson
  // jumps straight out of the whole app to whatever page was open before it
  // (usually the marketing landing page), skipping module/dashboard entirely.
  // Fix: push a real history entry on every authenticated view change, and
  // restore the view from history state when the user presses Back/Forward.
  const isRestoringFromHistory = useRef(false);

  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    if (isRestoringFromHistory.current) {
      isRestoringFromHistory.current = false;
      return;
    }
    try { window.history.pushState({ appView: view }, ''); } catch {}
  }, [view, authState.status]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const restored = (e.state as { appView?: View } | null)?.appView;
      isRestoringFromHistory.current = true;
      setView(restored ?? { type: 'dashboard' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Check session on mount — restore last view if session is still valid
  useEffect(() => {
    apiRequest("GET", "/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const user: AuthUser = await res.json();
          setAuthState({ status: 'authenticated', user });
          // Clear #/auth hash so it doesn't re-trigger auth view on reload
          if (window.location.hash.startsWith('#/auth')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          // A deep link (e.g. from an email) wins over wherever the user
          // last was — that's a more explicit signal than a stale session.
          const linked = parseHashView();
          if (linked) {
            setView(linked);
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            // Restore where the user was before the reload
            const saved = loadSavedView();
            if (saved && saved.type !== 'auth') {
              // If saved view was admin but user lost admin, fall back to dashboard
              if (saved.type === 'admin' && !user.isAdmin) {
                setView({ type: 'dashboard' });
              } else if (saved.type === 'analytics' && !user.isAdmin) {
                setView({ type: 'dashboard' });
              } else {
                setView(saved);
              }
            } else {
              setView({ type: 'dashboard' });
            }
          }
        } else {
          setAuthState({ status: 'unauthenticated' });
          clearSavedView();
          // Not logged in, but they clicked a real deep link (not just the
          // generic #/auth) — send them to login rather than the homepage,
          // so they don't have to also find and click "Sign In" themselves.
          if (pendingDeepLinkRef.current) setView({ type: 'auth' });
        }
      })
      .catch(() => {
        setAuthState({ status: 'unauthenticated' });
        clearSavedView();
        if (pendingDeepLinkRef.current) setView({ type: 'auth' });
      });
  }, []);

  // Fetch Burn Rate (streak) once authenticated, so it's ready before the
  // user ever visits the Dashboard page (the sidebar shows it everywhere).
  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    apiRequest('GET', '/api/daily-challenge')
      .then(r => r.json())
      .then(data => {
        if (typeof data.currentStreak === 'number') {
          setStreak({ currentStreak: data.currentStreak, longestStreak: data.longestStreak ?? 0 });
        }
      })
      .catch(() => {});
  }, [authState.status]);

  // Handle successful payment redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('payment=success') && authState.status === 'authenticated') {
      // Refresh user data after payment
      apiRequest("GET", "/api/auth/me")
        .then(async (res) => {
          if (res.ok) {
            const user: AuthUser = await res.json();
            setAuthState({ status: 'authenticated', user });
            setView({ type: 'dashboard' });
          }
        })
        .catch(() => {});
    }
  }, [authState.status]);

  // GA4 helper
  const track = (event: string, params?: Record<string, any>) => {
    try { (window as any).trackEvent?.(event, params); } catch {}
  };

  const handleAuthenticated = (user: AuthUser) => {
    setAuthState({ status: 'authenticated', user });
    const profile = user.userProfile as UserProfile | null | undefined;
    if (!profile?.completedOnboarding) {
      track('sign_up', { method: user.googleId ? 'google' : 'email' });
      // Onboarding still comes first for a brand-new account — the deep
      // link (if any) is honored right after, in handleOnboardingComplete.
      setView({ type: 'onboarding' });
    } else {
      track('login', { method: user.googleId ? 'google' : 'email' });
      setView(pendingDeepLinkRef.current ?? { type: 'dashboard' });
      pendingDeepLinkRef.current = null;
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setAuthState(prev => {
      if (prev.status !== 'authenticated') return prev;
      return { ...prev, user: { ...prev.user, userProfile: profile } };
    });
    track('onboarding_complete', { role: profile.role, goal: profile.goal });
    setView(pendingDeepLinkRef.current ?? { type: 'dashboard' });
    pendingDeepLinkRef.current = null;
  };

  const handleEditProfile = () => {
    setView({ type: 'onboarding' });
  };

  const handleGetStarted = () => {
    if (authState.status === 'authenticated') {
      setView({ type: 'dashboard' });
    } else {
      setView({ type: 'auth' });
    }
  };

  const handleSelectModule = (moduleId: string, activeCareer?: string) => setView({ type: 'module', moduleId, activeCareer });
  const handleSelectLesson = (lessonId: string) => {
    const career = (view as any).activeCareer;
    setView({ type: 'lesson', lessonId, ...(career ? { activeCareer: career } : {}) });
  };
  const handleUpgrade = () => setView({ type: 'upgrade' });

  const handleSignOut = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
    } catch {}
    clearSavedView();
    setAuthState({ status: 'unauthenticated' });
    setView({ type: 'landing' });
  }, []);

  const handleCompleteLesson = useCallback(async (lessonId: string, quizScore: number) => {
    if (authState.status !== 'authenticated') return;
    try {
      const res = await apiRequest("POST", "/api/progress", { lessonId, quizScore });
      if (res.ok) {
        const data = await res.json();
        setAuthState(prev => {
          if (prev.status !== 'authenticated') return prev;
          return {
            status: 'authenticated',
            user: {
              ...prev.user,
              completedLessons: data.completedLessons ?? prev.user.completedLessons,
              quizScores: data.quizScores ?? prev.user.quizScores,
            },
          };
        });
      }
    } catch {}
  }, [authState]);

  const handleNextLesson = (lessonId: string) => {
    const career = (view as any).activeCareer;
    setView({ type: 'lesson', lessonId, ...(career ? { activeCareer: career } : {}) });
  };

  const handleBackFromLesson = () => {
    if (view.type === 'lesson') {
      const lessonId = (view as any).lessonId;
      const career = (view as any).activeCareer;
      const parentMod = modules.find(m => m.lessons.some(l => l.id === lessonId));
      if (parentMod) {
        setView({ type: 'module', moduleId: parentMod.id, ...(career ? { activeCareer: career } : {}) });
        return;
      }
    }
    setView({ type: 'dashboard' });
  };

  // Loading state
  if (authState.status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AcqlerateLogo iconSize={40} showWordmark={false} />
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Landing page (no sidebar). When already authenticated, we still allow it
  // so the user can return to the marketing page without signing out.
  if (view.type === 'landing') {
    return (
      <Landing
        onGetStarted={handleGetStarted}
        isAuthenticated={authState.status === 'authenticated'}
        onBackToDashboard={() => setView({ type: 'dashboard' })}
      />
    );
  }

  // Auth page — only render when session check is DONE and user is NOT authenticated
  if (authState.status === 'unauthenticated') {
    return (
      <AuthPage
        onAuthenticated={handleAuthenticated}
        darkMode={darkMode}
        onBack={view.type === 'auth' ? () => setView({ type: 'landing' }) : undefined}
      />
    );
  }

  // Onboarding flow (no sidebar, full screen)
  if (view.type === 'onboarding' && authState.status === 'authenticated') {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="bg-background min-h-screen">
          <OnboardingFlow
            username={authState.user.username}
            onComplete={handleOnboardingComplete}
          />
        </div>
        <Toaster />
      </div>
    );
  }

  // Authenticated views
  const user = (authState as { status: 'authenticated'; user: AuthUser }).user;
  const isAdmin = user.isAdmin === true;
  const xp = progress.xp;
  const completedCount = completedLessons.size;

  const ALL_LEVELS = [
    { level: 1, title: 'Acquisition Trainee',    threshold: 0,    nextXP: 200,  desc: 'Just getting started. Learning the landscape.' },
    { level: 2, title: 'GS-9 Analyst',           threshold: 200,  nextXP: 500,  desc: 'Building foundational knowledge. You know the players and the process.' },
    { level: 3, title: 'GS-11 Professional',      threshold: 500,  nextXP: 1000, desc: 'Solid understanding of contracts, finance basics, and acquisition vehicles.' },
    { level: 4, title: 'GS-12 Specialist',        threshold: 1000, nextXP: 1800, desc: 'Deep functional knowledge. You can navigate a program review without a cheat sheet.' },
    { level: 5, title: 'GS-13 Senior Manager',    threshold: 1800, nextXP: 3000, desc: 'Multi-domain fluency. Source selection, EVM, modifications — you handle it.' },
    { level: 6, title: 'GS-14 Program Manager',   threshold: 3000, nextXP: 5000, desc: 'Senior PM territory. Leading programs, coaching others, managing the enterprise.' },
    { level: 7, title: 'SES-Level Executive',     threshold: 5000, nextXP: 9999, desc: 'The full picture — strategy, policy, leadership, and acquisition mastery.' },
  ];
  const currentLevel = getLevel(xp);

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300 safe-top",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo — opens the real acqlerate.com marketing site in a new tab
            so the user's authenticated dashboard tab stays open. */}
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
          <a
            href="https://acqlerate.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
            data-testid="sidebar-logo-home"
            aria-label="Open acqlerate.com in a new tab"
            title="Open acqlerate.com"
          >
            <AcqlerateLogo iconSize={32} />
          </a>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User + XP badge */}
        <div className="px-4 py-3 border-b border-sidebar-border space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-sidebar-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-sidebar-foreground truncate">{user.username}</div>
              <div className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</div>
            </div>
            {isPremium && (
              <span className="ml-auto flex-shrink-0 text-[9px] font-bold bg-sidebar-primary/20 text-sidebar-primary rounded-full px-1.5 py-0.5">PRO</span>
            )}
          </div>
          <button
            onClick={() => setShowLevels(true)}
            className="w-full bg-sidebar-accent border border-sidebar-primary/25 rounded-lg px-3 py-2 flex items-center gap-2 hover:border-sidebar-primary/50 hover:shadow-sm transition-all cursor-pointer text-left"
            data-testid="xp-level-card"
          >
            <Zap className="w-3.5 h-3.5 text-sidebar-primary flex-shrink-0 fill-sidebar-primary/20" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-sidebar-foreground/50">Level {currentLevel.level}</div>
              <div className="text-xs font-bold text-sidebar-foreground">{currentLevel.title}</div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-[10px] font-bold text-sidebar-primary">{xp} XP</div>
              <div className="text-[9px] text-sidebar-foreground/40">{completedCount} done</div>
            </div>
          </button>

          {/* Burn Rate — Acqlerate's take on a daily streak. In real acquisitions,
              burn rate is how fast a program spends its funding; here it's how
              fast you're spending daily reps. */}
          {streak.currentStreak > 0 ? (
            <div
              className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 bg-orange-500/10 border border-orange-500/30"
              title="Burn Rate: your consecutive days active. In acquisitions, burn rate tracks how fast a program spends its funding — here, it tracks how fast you're spending daily reps. Don't let it hit zero."
              data-testid="burn-rate-badge"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 fill-orange-400/30" />
              <span className="text-xs font-bold text-orange-300 flex-1 truncate">
                {streak.currentStreak}-day burn rate
              </span>
              {streak.currentStreak >= 7 && (
                <span className="text-[9px] font-bold text-amber-400 flex-shrink-0">🏆 {streak.longestStreak}d best</span>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setView({ type: 'costTrackerIntro' }); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 bg-primary/10 border border-primary/30 hover:bg-primary/15 hover:border-primary/50 transition-all text-left"
              title="See how the Spend Plan Tracker keeps every funding mod and burn rate in one place."
              data-testid="burn-rate-badge"
            >
              <Calculator className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-bold text-primary">Try our spend plan tracker</span>
              <ChevronRight className="w-3.5 h-3.5 text-primary/60 flex-shrink-0 ml-auto" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setView({ type: 'dashboard' }); setSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border",
              view.type === 'dashboard'
                ? "bg-sidebar-accent text-sidebar-foreground border-sidebar-accent-border shadow-sm"
                : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:border-sidebar-accent-border hover:text-sidebar-foreground"
            )}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className={cn("w-4 h-4", view.type === 'dashboard' && "text-sidebar-primary")} />
            Dashboard
          </button>

          {isAdmin && (
            <button
              onClick={() => { setView({ type: 'admin' }); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border",
                view.type === 'admin'
                  ? "bg-sidebar-accent text-sidebar-foreground border-sidebar-accent-border shadow-sm"
                  : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:border-sidebar-accent-border hover:text-sidebar-foreground"
              )}
              data-testid="nav-admin"
            >
              <ShieldCheck className={cn("w-4 h-4", view.type === 'admin' && "text-sidebar-primary")} />
              Admin Panel
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { setView({ type: 'analytics' }); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border",
                view.type === 'analytics'
                  ? "bg-sidebar-accent text-sidebar-foreground border-sidebar-accent-border shadow-sm"
                  : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:border-sidebar-accent-border hover:text-sidebar-foreground"
              )}
              data-testid="nav-analytics"
            >
              <BarChart3 className={cn("w-4 h-4", view.type === 'analytics' && "text-sidebar-primary")} />
              Analytics
            </button>
          )}

          <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/55 px-3 pt-3 pb-1.5">
            Modules
          </div>

          {modules.map((mod) => {
            const isModActive = view.type === 'module' && (view as any).moduleId === mod.id;
            const activeLessonId = view.type === 'lesson' ? (view as any).lessonId : null;
            const isLessonInMod = mod.lessons.some(l => l.id === activeLessonId);
            const lessonIds = mod.lessons.map(l => l.id);
            const progressPct = getModuleProgress(mod.id, lessonIds, progress.completedLessons);
            const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
            const hasPreview = mod.lessons.some(l => FREE_PREVIEW_LESSONS.includes(l.id));

            // Auto-expand if a lesson in this module is active
            const isExpanded = expandedModules.has(mod.id) || isLessonInMod || isModActive;

            const toggleExpand = (e: React.MouseEvent) => {
              e.stopPropagation();
              setExpandedModules(prev => {
                const next = new Set(prev);
                if (next.has(mod.id)) next.delete(mod.id); else next.add(mod.id);
                return next;
              });
            };

            // Module accent colors
            const moduleColors: Record<string, { accent: string; dot: string; lessonHover: string; activeLesson: string; activeLessonText: string }> = {
              foundations: { accent: '#3b82f6', dot: 'bg-blue-500',    lessonHover: 'hover:bg-blue-500/10',   activeLesson: 'bg-blue-500/15',   activeLessonText: 'text-blue-400' },
              finance:     { accent: '#f59e0b', dot: 'bg-amber-400',   lessonHover: 'hover:bg-amber-400/10',  activeLesson: 'bg-amber-400/15',  activeLessonText: 'text-amber-400' },
              contracts:   { accent: '#6366f1', dot: 'bg-indigo-400',  lessonHover: 'hover:bg-indigo-400/10', activeLesson: 'bg-indigo-400/15', activeLessonText: 'text-indigo-400' },
              data:        { accent: '#14b8a6', dot: 'bg-teal-400',    lessonHover: 'hover:bg-teal-400/10',   activeLesson: 'bg-teal-400/15',   activeLessonText: 'text-teal-400' },
              capture:     { accent: '#f97316', dot: 'bg-orange-400',  lessonHover: 'hover:bg-orange-400/10', activeLesson: 'bg-orange-400/15', activeLessonText: 'text-orange-400' },
              operations:  { accent: '#8b5cf6', dot: 'bg-violet-400',  lessonHover: 'hover:bg-violet-400/10', activeLesson: 'bg-violet-400/15', activeLessonText: 'text-violet-400' },
            };
            const mc = moduleColors[mod.id] ?? moduleColors.foundations;

            return (
              <div key={mod.id}>
                {/* Module header row */}
                <div
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer select-none border",
                    (isModActive || isLessonInMod)
                      ? "bg-sidebar-accent text-sidebar-foreground border-sidebar-accent-border shadow-sm"
                      : "text-sidebar-foreground/85 border-sidebar-border hover:bg-sidebar-accent hover:border-sidebar-accent-border hover:text-sidebar-foreground hover:-translate-y-px"
                  )}
                  style={(isModActive || isLessonInMod) ? { borderLeft: `3px solid ${mc.accent}` } : undefined}
                  onClick={(e) => {
                    setView({ type: 'module', moduleId: mod.id });
                    setSidebarOpen(false);
                    // Also expand
                    setExpandedModules(prev => { const n = new Set(prev); n.add(mod.id); return n; });
                  }}
                  data-testid={`sidebar-${mod.id}`}
                >
                  <span className="text-sm flex-shrink-0">{mod.icon}</span>
                  <span className="flex-1 text-left text-xs font-medium leading-tight">{mod.title}</span>
                  {/* Progress / lock badge */}
                  {!isAccessible && hasPreview ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex-shrink-0 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-1.5 py-0.5">Free</span>
                  ) : !isAccessible ? (
                    <span className="text-[10px] text-sidebar-foreground/55 flex-shrink-0">🔒</span>
                  ) : progressPct === 100 ? (
                    <span className="text-[10px] flex-shrink-0 bg-green-500/15 border border-green-500/40 rounded-full w-4 h-4 flex items-center justify-center text-green-400">✓</span>
                  ) : progressPct > 0 ? (
                    <span
                      className="text-[10px] font-bold flex-shrink-0 rounded-full px-1.5 py-0.5 border"
                      style={{ color: mc.accent, borderColor: mc.accent + '55', backgroundColor: mc.accent + '15' }}
                    >
                      {progressPct}%
                    </span>
                  ) : null}
                  {/* Chevron toggle */}
                  <button
                    onClick={toggleExpand}
                    className="flex-shrink-0 text-sidebar-foreground/55 hover:text-sidebar-foreground transition-colors p-0.5 rounded"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isExpanded && "rotate-180")} />
                  </button>
                </div>

                {/* Lesson list */}
                {isExpanded && (
                  <div className="ml-3 mt-0.5 mb-1 border-l-2 pl-2.5 space-y-0.5" style={{ borderColor: mc.accent + '55' }}>
                    {mod.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLessonId;
                      const isDone = progress.completedLessons.has(lesson.id);
                      const isPreview = FREE_PREVIEW_LESSONS.includes(lesson.id);
                      const canAccess = isAccessible || isPreview;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (!canAccess) { setView({ type: 'upgrade' }); setSidebarOpen(false); return; }
                            setView({ type: 'lesson', lessonId: lesson.id });
                            setSidebarOpen(false);
                          }}
                          className={cn(
                            "w-full text-left text-[11px] px-2 py-1.5 rounded-md transition-colors flex items-center gap-1.5 leading-tight group",
                            isActive
                              ? mc.activeLesson + ' ' + mc.activeLessonText + ' font-semibold'
                              : canAccess
                                ? 'text-sidebar-foreground/85 ' + mc.lessonHover + ' hover:text-sidebar-foreground'
                                : 'text-sidebar-foreground/45 cursor-default'
                          )}
                        >
                          {/* Status dot */}
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors",
                            isActive ? mc.dot
                              : isDone ? 'bg-green-500'
                              : 'bg-sidebar-foreground/40'
                          )} />
                          <span className="flex-1 truncate">{lesson.title}</span>
                          {!canAccess && <span className="text-[9px] flex-shrink-0">🔒</span>}
                          {isDone && !isActive && <span className="text-[9px] text-green-400 flex-shrink-0">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Downloadable Resources */}
          {SIDEBAR_RESOURCES.length > 0 && (
            <div className="pt-3">
              <button
                onClick={() => setResourcesExpanded(v => !v)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all select-none border",
                  resourcesExpanded
                    ? "bg-sidebar-accent text-sidebar-foreground border-sidebar-accent-border"
                    : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:border-sidebar-accent-border hover:text-sidebar-foreground"
                )}
                data-testid="sidebar-resources-toggle"
              >
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left text-xs font-medium">Resources</span>
                <span className="text-[10px] text-sidebar-foreground/40">{SIDEBAR_RESOURCES.length}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform", resourcesExpanded && "rotate-180")} />
              </button>
              {resourcesExpanded && (
                <div className="pl-2 pr-1 pt-1 space-y-1">
                  {SIDEBAR_RESOURCES.map((res, ri) => {
                    const locked = res.proOnly && !progress.isPremium;
                    const commonClass = "flex items-start gap-2 px-3 py-2 rounded-lg transition-colors group";
                    if (locked) {
                      return (
                        <button
                          key={ri}
                          onClick={() => { handleUpgrade(); setSidebarOpen(false); }}
                          className={cn(commonClass, "w-full text-left text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground/70")}
                          data-testid={`sidebar-resource-${ri}`}
                        >
                          <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-70" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold leading-tight">{res.title}</div>
                            <div className="text-[10.5px] leading-snug mt-0.5 opacity-80">{res.description}</div>
                            <div className="text-[10px] font-bold text-primary mt-1">Unlock with Pro →</div>
                          </div>
                        </button>
                      );
                    }
                    return (
                      <a
                        key={ri}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(commonClass, "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground")}
                        data-testid={`sidebar-resource-${ri}`}
                      >
                        <Download className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary opacity-80 group-hover:opacity-100" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold leading-tight text-sidebar-foreground/90">{res.title}</div>
                          <div className="text-[10.5px] text-sidebar-foreground/65 leading-snug mt-0.5">{res.description}</div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tools Directory */}
          <div className="pt-1">
            <button
              onClick={() => setToolsExpanded(v => !v)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all select-none border",
                toolsExpanded
                  ? "bg-sidebar-accent text-sidebar-foreground border-sidebar-accent-border"
                  : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:border-sidebar-accent-border hover:text-sidebar-foreground"
              )}
              data-testid="sidebar-tools-toggle"
            >
              <Wrench className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left text-xs font-medium">Tools</span>
              <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform", toolsExpanded && "rotate-180")} />
            </button>
            {toolsExpanded && (
              <div className="pl-2 pr-1 pt-1 space-y-2 max-h-80 overflow-y-auto">
                {/* FAR Translator — pinned, distinctly styled */}
                <a
                  href={FAR_TRANSLATOR.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-colors group"
                  data-testid="sidebar-far-translator"
                >
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-primary leading-tight">{FAR_TRANSLATOR.name}</div>
                    <div className="text-[10px] text-sidebar-foreground/50 leading-tight mt-0.5">{FAR_TRANSLATOR.description}</div>
                  </div>
                </a>
                {/* Cost & Burn Rate Tracker — pinned, internal page */}
                <button
                  onClick={() => setView({ type: 'costProjects' })}
                  className="w-full flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-colors group text-left"
                  data-testid="sidebar-cost-tracker"
                >
                  <Calculator className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-primary leading-tight">Cost &amp; Burn Rate Tracker</div>
                    <div className="text-[10px] text-sidebar-foreground/50 leading-tight mt-0.5">Track funding, mods, and spend across your projects — persists between visits.</div>
                  </div>
                </button>

                {TOOLS_DIRECTORY.map((cat, ci) => (
                  <div key={ci}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/35 px-3 pt-1.5 pb-1">
                      {cat.title}
                    </div>
                    {cat.tools.map((tool, ti) => (
                      <a
                        key={ti}
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group"
                        data-testid={`sidebar-tool-${ci}-${ti}`}
                      >
                        <span className="text-[11px] font-medium leading-tight truncate">{tool.name}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-60" />
                      </a>
                    ))}
                  </div>
                ))}
                <a
                  href="/tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 mt-1 rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  View full Tools page
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {trialDaysLeft !== null && (
            <div
              className="w-full px-3 py-1.5 rounded-lg text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 text-center"
              data-testid="trial-days-remaining"
            >
              {trialDaysLeft === 0
                ? "Trial ends today"
                : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`}
            </div>
          )}
          {!isActuallyPaid && !isNativeApp() && (
            <button
              onClick={() => { setView({ type: 'upgrade' }); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/30 hover:bg-sidebar-primary/20 hover:border-sidebar-primary/50 transition-all shadow-sm"
              data-testid="nav-upgrade"
            >
              <Award className="w-4 h-4" />
              {trialDaysLeft !== null ? "Keep Full Access" : "Upgrade to Pro"}
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            data-testid="nav-signout"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <div className="flex gap-3 px-3 pt-2 pb-1">
            <a href="/privacy" className="text-[10px] text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors">Privacy</a>
            <a href="/terms" className="text-[10px] text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors">Terms</a>
            <PWAInstallLink />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 relative">
        {/* Background: hex grid + radial glow */}
        <div aria-hidden="true" className="pointer-events-none fixed lg:left-64 inset-y-0 right-0 z-0 overflow-hidden">
          {/* Radial teal glow top-right */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.12]" style={{background: 'radial-gradient(circle, #01696f 0%, transparent 70%)'}} />
          {/* Radial teal glow bottom-left */}
          <div className="absolute -bottom-32 -left-16 w-[400px] h-[400px] rounded-full opacity-[0.05] dark:opacity-[0.08]" style={{background: 'radial-gradient(circle, #01696f 0%, transparent 70%)'}} />
          {/* Hex grid overlay */}
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-[0.06] dark:opacity-[0.05]">
            <defs>
              <pattern id="hex-bg" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon points="30,3 57,18 57,34 30,49 3,34 3,18" fill="none" stroke="#01696f" strokeWidth="1.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex-bg)" />
          </svg>
        </div>
        {/* Top Bar */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 safe-top" style={{minHeight: '3.5rem'}}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
            data-testid="mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-2">
            {isPremium && (
              <Badge className="bg-primary/10 text-primary border-0 text-xs hidden sm:flex">
                <Award className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
            <button
              onClick={toggleDark}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
              data-testid="theme-toggle"
              aria-label="Toggle theme"
            >
              {darkMode ? <><Sun className="w-3.5 h-3.5" /><span className="hidden sm:inline">Light</span></> : <><Moon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Dark</span></>}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 max-w-6xl mx-auto w-full relative z-10">
        <ErrorBoundary>
          {view.type === 'dashboard' && (
            <Dashboard
              progress={progress}
              onSelectModule={handleSelectModule}
              onSelectLesson={handleSelectLesson}
              onUpgrade={handleUpgrade}
              userProfile={authState.status === 'authenticated' ? (authState.user.userProfile as UserProfile | null) : null}
              username={authState.status === 'authenticated' ? authState.user.username : undefined}
              onEditProfile={handleEditProfile}
              isAdmin={isAdmin}
              onStreakUpdate={(s) => setStreak(s)}
            />
          )}
          {view.type === 'module' && (() => {
            const modId = (view as { type: 'module'; moduleId: string }).moduleId;
            const skillLevels = authState.status === 'authenticated'
              ? (authState.user.moduleSkillLevels ?? {}) : {};
            return (
              <ModulePage
                moduleId={modId}
                progress={progress}
                onBack={() => setView({ type: 'dashboard', activeCareer: (view as any).activeCareer } as any)}
                onSelectLesson={handleSelectLesson}
                onUpgrade={handleUpgrade}
                unlockedLevel={(skillLevels[modId] as SkillLevel) ?? 'novice'}
                onOpenAssessment={() => setAssessmentModuleId(modId)}
                activeCareer={(view as any).activeCareer ?? null}
              />
            );
          })()}
          {view.type === 'lesson' && (() => {
            const lessonId = (view as { type: 'lesson'; lessonId: string }).lessonId;
            const parentMod = modules.find(m => m.lessons.some(l => l.id === lessonId));
            const skillLevels = authState.status === 'authenticated'
              ? (authState.user.moduleSkillLevels ?? {}) : {};
            const unlockedLevel = parentMod
              ? ((skillLevels[parentMod.id] as SkillLevel) ?? 'novice')
              : 'novice';
            return (
              <LessonPage
                lessonId={lessonId}
                progress={progress}
                onBack={handleBackFromLesson}
                onComplete={handleCompleteLesson}
                onNextLesson={handleNextLesson}
                unlockedLevel={unlockedLevel}
                onOpenAssessment={parentMod ? () => setAssessmentModuleId(parentMod.id) : undefined}
                isLifetime={authState.status === 'authenticated' && authState.user.subscriptionStatus === 'lifetime'}
                activeCareer={(view as any).activeCareer ?? null}
              />
            );
          })()}
          {view.type === 'upgrade' && (
            <UpgradePage
              onBack={() => setView({ type: 'dashboard' })}
              onUpgrade={handleUpgrade}
              trialDaysLeft={trialDaysLeft}
            />
          )}
          {view.type === 'admin' && isAdmin && (
            <AdminPage />
          )}
          {view.type === 'analytics' && isAdmin && (
            <AdminAnalytics onBack={() => setView({ type: 'admin' })} />
          )}
          {view.type === 'pdu' && (
            <PDUTracker
              onBack={() => setView({ type: 'dashboard' })}
              completedLessons={Array.from(completedLessons)}
            />
          )}
          {view.type === 'costTrackerIntro' && (
            <CostTrackerIntroPage
              onBack={() => setView({ type: 'dashboard' })}
              onGetStarted={() => setView({ type: 'costTaskOrders' })}
            />
          )}
          {view.type === 'costProjects' && (
            <CostProjectsPage
              onBack={() => setView({ type: 'dashboard' })}
              onOpenProject={(projectId) => setView({ type: 'costProject', projectId })}
              onOpenRates={() => setView({ type: 'costRates' })}
              onOpenTaskOrders={() => setView({ type: 'costTaskOrders' })}
              onOpenTaskOrder={(taskOrderId) => setView({ type: 'costTaskOrder', taskOrderId })}
            />
          )}
          {view.type === 'costProject' && (
            <CostProjectDetailPage
              projectId={(view as { type: 'costProject'; projectId: string }).projectId}
              onBack={() => setView({ type: 'costProjects' })}
              onOpenTaskOrder={(taskOrderId) => setView({ type: 'costTaskOrder', taskOrderId })}
            />
          )}
          {view.type === 'costRates' && (
            <CostRatesPage
              onBack={() => setView({ type: 'costProjects' })}
            />
          )}
          {view.type === 'costTaskOrders' && (
            <CostTaskOrdersPage
              onBack={() => setView({ type: 'costProjects' })}
              onOpenTaskOrder={(taskOrderId) => setView({ type: 'costTaskOrder', taskOrderId })}
            />
          )}
          {view.type === 'costTaskOrder' && (
            <CostTaskOrderDetailPage
              taskOrderId={(view as { type: 'costTaskOrder'; taskOrderId: string }).taskOrderId}
              onBack={() => setView({ type: 'costTaskOrders' })}
              onOpenProject={(projectId) => setView({ type: 'costProject', projectId })}
            />
          )}

        </ErrorBoundary>
        </main>
      </div>
    </div>

    {/* Module Assessment Modal */}
    {assessmentModuleId && authState.status === 'authenticated' && (() => {
      const assessMod = modules.find(m => m.id === assessmentModuleId);
      if (!assessMod || !assessMod.assessment?.length) return null;
      const skillLevels = authState.user.moduleSkillLevels ?? {};
      const currentLevel = (skillLevels[assessmentModuleId] as SkillLevel) ?? 'novice';
      return (
        <ModuleAssessment
          module={assessMod}
          currentLevel={currentLevel}
          onClose={() => setAssessmentModuleId(null)}
          onLevelUnlocked={(moduleId, newLevel) => {
            setAuthState(prev => {
              if (prev.status !== 'authenticated') return prev;
              return {
                ...prev,
                user: {
                  ...prev.user,
                  moduleSkillLevels: {
                    ...(prev.user.moduleSkillLevels ?? {}),
                    [moduleId]: newLevel,
                  },
                },
              };
            });
          }}
        />
      );
    })()}

    {/* PWA install prompt */}
    <InstallPrompt />

    {/* ── Level Progression Modal ── */}
    {showLevels && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowLevels(false)}
      >
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 border-b border-border px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Your Progression</div>
                <h2 className="text-lg font-bold text-foreground">Acqlerate Career Levels</h2>
              </div>
              <button onClick={() => setShowLevels(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Current XP progress to next level */}
            {(() => {
              const nextLevel = ALL_LEVELS.find(l => l.threshold > xp);
              const xpToNext = nextLevel ? nextLevel.threshold - xp : 0;
              const progress = nextLevel
                ? ((xp - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
                : 100;
              return (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span className="font-semibold text-foreground">{currentLevel.title}</span>
                    <span>{nextLevel ? `${xpToNext} XP to Level ${nextLevel.level}` : 'Max level reached'}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{xp} XP earned</div>
                </div>
              );
            })()}
          </div>

          {/* Level list */}
          <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {ALL_LEVELS.map((lvl) => {
              const isCurrentLevel = lvl.level === currentLevel.level;
              const isUnlocked = xp >= lvl.threshold;
              const isNext = !isUnlocked && ALL_LEVELS.find(l => xp >= l.threshold)?.level === lvl.level - 1;
              return (
                <div
                  key={lvl.level}
                  className={cn(
                    "flex items-start gap-3 rounded-xl px-4 py-3 border transition-all",
                    isCurrentLevel
                      ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                      : isUnlocked
                      ? "bg-muted/30 border-transparent"
                      : "opacity-50 border-transparent"
                  )}
                >
                  {/* Level number badge */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
                    isCurrentLevel ? "bg-primary text-primary-foreground"
                    : isUnlocked ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
                  )}>
                    {isUnlocked ? lvl.level : <Lock className="w-3 h-3" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-bold",
                        isCurrentLevel ? "text-primary" : isUnlocked ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {lvl.title}
                      </span>
                      {isCurrentLevel && (
                        <span className="text-[9px] font-bold bg-primary/20 text-primary rounded-full px-2 py-0.5 uppercase tracking-wide">You are here</span>
                      )}
                      {isNext && (
                        <span className="text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full px-2 py-0.5 uppercase tracking-wide">Next</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{lvl.desc}</div>
                    <div className="text-[10px] text-muted-foreground/60 mt-1">
                      {lvl.threshold === 0 ? 'Starting level' : `Unlocks at ${lvl.threshold} XP`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-border bg-muted/20">
            <p className="text-[11px] text-muted-foreground text-center">
              Complete lessons and quizzes to earn XP. Each lesson = 10 XP. Perfect quiz score = bonus 5 XP.
            </p>
          </div>
        </div>
      </div>
    )}
  </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppContent />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
