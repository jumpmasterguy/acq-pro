import { useState, useEffect, useCallback, useRef, Component } from "react";
import type { ReactNode } from "react";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FREE_MODULES, FREE_PREVIEW_LESSONS, getModuleProgress, getLevel, calculateXP } from "@/lib/progress";
import { hasFullAccess, hasPaidPlan, trialDaysRemaining } from "@shared/access";
import { isNativeApp, getPlatform } from "@/lib/platform";
import { modules } from "@/lib/curriculum";
import { getModuleTheme, getModuleFamilyTheme, getModuleFamily, FAMILY_LABEL, FAMILY_THEME, type ModuleFamily } from "@/lib/moduleTheme";
import { moduleClps, formatClps, totalClps } from "@shared/moduleClps";
import { LayoutDashboard, BookOpen, Award, LogOut, Sun, Moon, Menu, X, Zap, User, ShieldCheck, BarChart3, ChevronRight, ChevronDown, Lock, Download, FolderOpen, Wrench, Sparkles, ExternalLink, Calculator, Flame } from "lucide-react";
import { SIDEBAR_RESOURCES } from "@/lib/resources";
import { FAR_TRANSLATOR, TOOLS_DIRECTORY } from "@/lib/toolsDirectory";
import { AcqlerateLogo } from "@/components/AcqlerateLogo";
import InstallPrompt from "@/components/InstallPrompt";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell, type MobileTab, type MobileHeader } from "@/components/mobile/MobileShell";

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
import Dashboard from "@/pages/Dashboard";
import ModulePage from "@/pages/ModulePage";
import ModulesPage from "@/pages/ModulesPage";
import ResourcesPage from "@/pages/ResourcesPage";
import LessonPage from "@/pages/LessonPage";
import UpgradePage from "@/pages/UpgradePage";
import MyAccountPage from "@/pages/MyAccountPage";
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

/** Sidebar accent classes per subject family. Static strings for Tailwind's JIT. */
const FAMILY_SIDEBAR: Record<ModuleFamily, { dot: string; lessonHover: string; activeLesson: string; activeLessonText: string }> = {
  foundations: { dot: 'bg-[#3D8FD1]', lessonHover: 'hover:bg-[#3D8FD1]/10', activeLesson: 'bg-[#3D8FD1]/15', activeLessonText: 'text-[#4A9AE0]' },
  money:       { dot: 'bg-[#2E8B57]', lessonHover: 'hover:bg-[#2E8B57]/10', activeLesson: 'bg-[#2E8B57]/15', activeLessonText: 'text-[#41A56B]' },
  contracts:   { dot: 'bg-[#5E3596]', lessonHover: 'hover:bg-[#5E3596]/10', activeLesson: 'bg-[#5E3596]/15', activeLessonText: 'text-[#8E63D6]' },
  winning:     { dot: 'bg-[#D1571A]', lessonHover: 'hover:bg-[#D1571A]/10', activeLesson: 'bg-[#D1571A]/15', activeLessonText: 'text-[#DC7129]' },
  program:     { dot: 'bg-[#B0327A]', lessonHover: 'hover:bg-[#B0327A]/10', activeLesson: 'bg-[#B0327A]/15', activeLessonText: 'text-[#D2519A]' },
};
import { apiRequest } from "@/lib/queryClient";

// View types
type View =
  | { type: 'auth' }
  | { type: 'onboarding' }
  | { type: 'dashboard' }
  // Mobile-only screens. The desktop shell reaches modules through the
  // sidebar tree and resources through its collapsible sections, so these
  // two views exist to give the bottom tab bar a Learn and a Resources tab.
  | { type: 'modules' }
  | { type: 'resources' }
  | { type: 'module'; moduleId: string; activeCareer?: string }
  | { type: 'lesson'; lessonId: string; activeCareer?: string }
  | { type: 'upgrade' }
  | { type: 'account' }
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
  const isActuallyPaid = hasPaidPlan(user);
  return {
    completedLessons: new Set<string>(user.completedLessons ?? []),
    quizScores: user.quizScores ?? {},
    unlockedModules: new Set<string>(['foundations']),
    isPremium,
    isActuallyPaid,
    xp: 0,
  };
}

const VIEW_STORAGE_KEY = 'acqpro_last_view';

function saveView(v: View) {
  // Only persist meaningful authenticated views
  if (v.type === 'auth') return;
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

// Deep-link support: a URL like acqlerate.com/app#/module/finance (used in
// emails, social posts, etc.) should open straight to that module instead of
// dumping everyone on the dashboard. Note the /app — the app itself only
// lives at that path (server/static.ts serves the marketing landing page at
// the bare root "/"), so any link generated for this needs the /app prefix
// or the hash never reaches this code at all. Wins over the saved session view, since
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
  // Capture any deep link (e.g. #/lesson/finance-8 from an email) once, at
  // mount, before the session check or anything else touches the hash. If
  // the visitor turns out to be logged out, we route them to login instead
  // of the marketing homepage, and send them on to this exact spot the
  // moment they're in — instead of dropping a signed-out click on the
  // homepage and a fresh login on the dashboard, both losing the destination.
  const pendingDeepLinkRef = useRef<View | null>(
    typeof window !== 'undefined' ? parseHashView() : null
  );
  // The SPA (this file) only ever lives at /app — the actual marketing
  // homepage is a separate static page served at the bare "/" (see
  // server/static.ts) — so there's no in-app "landing" view to default to
  // here; every unauthenticated path starts at the sign-in screen.
  const [view, setView] = useState<View>({ type: 'auth' });
  // Theme — an explicit choice is persisted in a cookie (works on Railway,
  // unlike a sandboxed iframe's storage); no cookie means follow the OS, which
  // is what the mobile handoff specifies. The old code booted dark
  // unconditionally, so a phone in light mode still got a dark app.
  type ThemeMode = 'light' | 'dark' | 'system';
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const c = document.cookie.split('; ').find(r => r.startsWith('theme='));
      if (c) {
        const v = c.split('=')[1];
        if (v === 'light' || v === 'dark') return v;
      }
    } catch {}
    return 'system';
  });
  const [systemDark, setSystemDark] = useState(() => {
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return true; }
  });
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    } catch {}
  }, []);
  const darkMode = themeMode === 'system' ? systemDark : themeMode === 'dark';

  const applyThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      document.cookie = mode === 'system'
        ? 'theme=;path=/;max-age=0'
        : `theme=${mode};path=/;max-age=31536000`;
    } catch {}
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Below `md` the app swaps the sidebar shell for the native-style mobile
  // shell (bottom tab bar + 56px top bar). Desktop is untouched.
  const isMobile = useIsMobile();
  // Lesson reading-progress bar — MobileShell reports scroll percentage.
  const [readPct, setReadPct] = useState(0);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [resourcesExpanded, setResourcesExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  // Set when the server ends a session for inactivity (server/auth.ts idle
  // timeout) and the client notices via a 401 on the next heartbeat — shown
  // on the login screen so it doesn't look like an unexplained sign-out.
  const [idleSignOutNotice, setIdleSignOutNotice] = useState(false);
  // Module assessment modal state
  const [assessmentModuleId, setAssessmentModuleId] = useState<string | null>(null);
  const [showLevels, setShowLevels] = useState(false);
  // Burn Rate (streak) — surfaced persistently in the sidebar, not just on the
  // Dashboard page, so it behaves like Duolingo's always-visible flame.
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  // XP from briefs completed since this session's user object was loaded.
  const [sessionBriefXp, setSessionBriefXp] = useState(0);

  // Derived progress from server auth
  const isPremium =
    authState.status === 'authenticated' && hasFullAccess(authState.user);
  const trialDaysLeft =
    authState.status === 'authenticated' ? trialDaysRemaining(authState.user) : null;
  // Distinct from isPremium: a trialing user has full access right now but
  // hasn't actually paid, so they should still see the upgrade CTA/countdown.
  const isActuallyPaid =
    authState.status === 'authenticated' && hasPaidPlan(authState.user);
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

  // Acquisition This Week brief XP, same treatment as the Daily Challenge.
  // `sessionBriefXp` is the optimistic part: the session user object was
  // loaded at sign-in, so a brief completed since then is not in it yet. The
  // delta is added here and resets to 0 on the next load, when the server
  // value already includes it.
  const briefsXP =
    authState.status === 'authenticated' ? authState.user.briefsXP ?? 0 : 0;

  const progress = {
    completedLessons,
    quizScores,
    unlockedModules: new Set<string>(['foundations']),
    isPremium,
    isActuallyPaid,
    xp: calculateXP(completedLessons, quizScores, dailyChallengeXP, briefsXP + sessionBriefXp),
  };

  // Streak — fetched here rather than only in Dashboard. The mobile top bar
  // shows the flame on every screen, so waiting for a Home visit to populate
  // it would mean every other screen read "🔥 0" until you went Home.
  // Dashboard keeps its own fetch (it also needs the questions) and continues
  // to push updates back up through onStreakUpdate.
  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    apiRequest('GET', '/api/daily-challenge')
      .then(r => r.json())
      .then(data => {
        if (typeof data?.currentStreak === 'number') {
          setStreak({ currentStreak: data.currentStreak, longestStreak: data.longestStreak });
        }
      })
      .catch(() => {});
  }, [authState.status]);

  // Admin, Analytics, PDU and the Cost Tracker have no home in the four-tab
  // map, so they stay desktop-only. A saved view (sessionStorage) or a resize
  // could otherwise strand a phone on a screen it can't navigate away from.
  // Must sit above the auth/onboarding early returns — it's a hook.
  useEffect(() => {
    if (!isMobile) return;
    const MOBILE_VIEWS: View['type'][] = [
      'dashboard', 'modules', 'module', 'lesson', 'upgrade', 'account', 'resources', 'auth', 'onboarding',
    ];
    if (!MOBILE_VIEWS.includes(view.type)) setView({ type: 'dashboard' });
  }, [isMobile, view.type]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  // Desktop's top-bar button still flips between explicit light and dark.
  const toggleDark = () => applyThemeMode(darkMode ? 'light' : 'dark');

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
        apiRequest('POST', '/api/track-activity', { minutesActive: minsToSend }).catch((e: any) => {
          // A 401 here means the server already ended this session — almost
          // certainly the idle timeout (server/auth.ts), since we only get
          // here when the tab is visible and the heartbeat itself is what
          // would normally keep it alive. Bring the client's own state in
          // line with that instead of silently failing every request until
          // the user happens to reload.
          if (String(e?.message ?? '').startsWith('401')) {
            clearSavedView();
            setAuthState({ status: 'unauthenticated' });
            setIdleSignOutNotice(true);
            setView({ type: 'auth' });
          }
        });
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

  // Android's hardware/gesture Back. A Capacitor webview with no backButton
  // listener falls through to the platform default, which finishes the whole
  // activity — so Back from a lesson closed the app instead of returning to
  // the module. The view stack is already mirrored into real history entries
  // by the effect above, so Back only has to walk that stack, and exit when
  // there is nothing left to walk. iOS has no hardware back and uses the
  // in-app back affordance, so this is Android-only.
  useEffect(() => {
    if (getPlatform() !== 'android') return;
    let cancelled = false;
    let detach: (() => void) | undefined;
    // Imported lazily so the plugin never loads in the browser build.
    import('@capacitor/app')
      .then(({ App: CapacitorApp }) => {
        if (cancelled) return;
        const handle = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else CapacitorApp.exitApp();
        });
        detach = () => { void handle.then(h => h.remove()).catch(() => {}); };
        if (cancelled) detach();
      })
      .catch(() => {});
    return () => { cancelled = true; detach?.(); };
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
    setIdleSignOutNotice(false);
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

  // My Account page: keep authState.user in sync right after a name save,
  // same pattern as handleOnboardingComplete below — no full /api/auth/me
  // re-fetch needed since PUT /api/account/name already returns the result.
  const handleNameUpdated = (firstName: string, lastName: string, username: string) => {
    setAuthState(prev => {
      if (prev.status !== 'authenticated') return prev;
      return { ...prev, user: { ...prev.user, firstName, lastName, username } };
    });
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
    setIdleSignOutNotice(false);
    // On the web, send them to the real marketing homepage (a separate static
    // page at "/" — see server/static.ts), not an in-app view.
    //
    // In the native shell there is nowhere else to go: the marketing page is
    // not part of the app, it has no way back, and its sticky header has no
    // safe-area padding, so it renders under the status bar. Signing out there
    // stranded the user on a broken-looking page. Stay on the sign-in screen
    // instead, which is what the app launches on anyway.
    if (isNativeApp()) {
      setView({ type: 'auth' });
      return;
    }
    window.location.href = 'https://acqlerate.com/';
  }, []);

  // Server has already deleted the row and destroyed the session; just leave.
  const handleAccountDeleted = useCallback(() => {
    clearSavedView();
    setAuthState({ status: 'unauthenticated' });
    window.location.href = 'https://acqlerate.com/?account=deleted';
  }, []);

  // `scoreOnly` records the quiz result without marking the lesson complete —
  // the mobile lesson separates checking your answers from finishing.
  const handleCompleteLesson = useCallback(async (lessonId: string, quizScore: number, scoreOnly = false) => {
    if (authState.status !== 'authenticated') return;
    try {
      const res = await apiRequest("POST", "/api/progress", { lessonId, quizScore, scoreOnly });
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

  // Auth page — only render when session check is DONE and user is NOT authenticated
  if (authState.status === 'unauthenticated') {
    return (
      <AuthPage
        onAuthenticated={handleAuthenticated}
        darkMode={darkMode}
        // On the web, send them to the real marketing site, not the in-app
        // `landing` view — that view is an old, out-of-sync copy of the
        // homepage (stale headline/stats vs. the live acqlerate.com), so
        // routing back into it from the sign-in page showed visitors an
        // outdated page.
        //
        // Undefined in the native shell, which also makes the logo
        // non-clickable (AuthPage renders it as a plain mark when there is no
        // onBack, and its own showBack already checks isNativeApp). Tapping it
        // in the app loaded the marketing homepage inside the webview: no way
        // back, and its sticky header sits under the status bar because that
        // page was never built to run full-screen.
        onBack={view.type === 'auth' && !isNativeApp() ? () => { window.location.href = 'https://acqlerate.com/'; } : undefined}
        notice={idleSignOutNotice ? "You were signed out after 30 minutes of inactivity. Log back in to continue." : undefined}
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

  // ── Mobile shell wiring ───────────────────────────────────────────────────
  // Admin, Analytics, PDU and the Cost Tracker have no home in the four-tab
  // map, so they stay desktop-only. A saved view (sessionStorage) or a resize
  // could otherwise strand a phone on a screen it can't navigate away from.
  // Which tab lights up. Module, Lesson and Pro access all live under Learn.
  const mobileTab: MobileTab =
    view.type === 'resources' ? 'resources'
    : view.type === 'account' ? 'account'
    : (view.type === 'modules' || view.type === 'module' || view.type === 'lesson' || view.type === 'upgrade') ? 'modules'
    : 'home';

  // Back: Lesson → its Module; Module and Pro access → Modules list.
  const mobileHeader: MobileHeader = (() => {
    switch (view.type) {
      case 'dashboard':
        return { kind: 'logo' };
      case 'modules':
        return { kind: 'title', title: 'Modules' };
      case 'resources':
        return { kind: 'title', title: 'Resources & tools' };
      case 'account':
        return { kind: 'title', title: 'My Account' };
      case 'upgrade':
        return { kind: 'back', title: 'Pro access', onBack: () => setView({ type: 'modules' }) };
      case 'module': {
        const mod = modules.find(m => m.id === (view as any).moduleId);
        return { kind: 'back', title: mod?.title ?? 'Module', onBack: () => setView({ type: 'modules' }) };
      }
      case 'lesson': {
        const parent = modules.find(m => m.lessons.some(l => l.id === (view as any).lessonId));
        return {
          kind: 'back',
          title: parent?.title ?? 'Lesson',
          onBack: () => setView(parent ? { type: 'module', moduleId: parent.id } : { type: 'modules' }),
        };
      }
      default:
        return { kind: 'logo' };
    }
  })();

  const handleMobileTab = (tab: MobileTab) => {
    setView(
      tab === 'home' ? { type: 'dashboard' }
      : tab === 'modules' ? { type: 'modules' }
      : tab === 'resources' ? { type: 'resources' }
      : { type: 'account' }
    );
  };

  // The reading bar is filled in the current module's color.
  const lessonModuleHex = (() => {
    if (view.type !== 'lesson') return 'var(--acq-teal)';
    const parent = modules.find(m => m.lessons.some(l => l.id === (view as any).lessonId));
    return parent ? getModuleFamilyTheme(parent.id).mobileHex : 'var(--acq-teal)';
  })();

  // Drives the scroll-to-top reset on navigation.
  const mobileScrollKey = `${view.type}:${(view as any).moduleId ?? (view as any).lessonId ?? ''}`;

  // The page switch, shared by both shells. Desktop renders it inside the
  // sidebar layout; mobile renders it inside MobileShell.
  const pageContent = (
    <>
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
              onBriefXpEarned={(amount) => setSessionBriefXp(x => x + amount)}
              firstName={authState.status === 'authenticated' ? authState.user.firstName : null}
              lastName={authState.status === 'authenticated' ? authState.user.lastName : null}
              lastStreakDate={authState.status === 'authenticated' ? authState.user.lastStreakDate ?? null : null}
              onOpenModules={() => setView({ type: 'modules' })}
              onOpenAccount={() => setView({ type: 'account' })}
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
          {view.type === 'modules' && (
            <ModulesPage
              progress={progress}
              onSelectModule={(id) => setView({ type: 'module', moduleId: id })}
              onUpgrade={handleUpgrade}
            />
          )}
          {view.type === 'resources' && (
            <ResourcesPage isPremium={progress.isPremium} onUpgrade={handleUpgrade} />
          )}
          {view.type === 'upgrade' && (
            <UpgradePage
              onBack={() => setView({ type: 'dashboard' })}
              onUpgrade={handleUpgrade}
              trialDaysLeft={trialDaysLeft}
              userEmail={authState.status === 'authenticated' ? authState.user.email : undefined}
              onSignOut={handleSignOut}
            />
          )}
          {view.type === 'account' && authState.status === 'authenticated' && (
            <MyAccountPage
              user={authState.user}
              onBack={() => setView({ type: 'dashboard' })}
              onUpgrade={() => setView({ type: 'upgrade' })}
              onNameUpdated={handleNameUpdated}
              onAccountDeleted={handleAccountDeleted}
              xp={progress.xp}
              completedLessons={completedLessons}
              streak={streak.currentStreak}
              onSignOut={handleSignOut}
              themeMode={themeMode}
              onThemeChange={applyThemeMode}
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

    </>
  );

  return (
    <ErrorBoundary>
    {isMobile ? (
      <MobileShell
        header={mobileHeader}
        activeTab={mobileTab}
        onTabChange={handleMobileTab}
        streak={streak.currentStreak}
        onStreakPress={() => setView({ type: 'account' })}
        trialDaysLeft={view.type === 'dashboard' ? trialDaysLeft : null}
        scrollKey={mobileScrollKey}
        onScrollProgress={view.type === 'lesson' ? setReadPct : undefined}
        readingBar={view.type === 'lesson' ? { pct: readPct, color: lessonModuleHex } : null}
      >
        <ErrorBoundary>{pageContent}</ErrorBoundary>
      </MobileShell>
    ) : (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300 safe-top",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
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
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation. Four destinations rather than a wall of fourteen modules.
            The module tree nobody scanned now lives on My Path; the space it
            freed carries what a learner actually wants permanently on screen:
            where they are, whether the streak is alive, the five subject
            families as a colour legend, and the next CLP certificate. */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          <div className="space-y-1">
            {([
              { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard, go: () => setView({ type: 'dashboard' }) },
              { key: 'modules',   label: 'My Path',   Icon: BookOpen,        go: () => setView({ type: 'modules' }) },
              { key: 'resources', label: 'Resources', Icon: FolderOpen,      go: () => setView({ type: 'resources' }) },
              { key: 'account',   label: 'Account',   Icon: User,            go: () => setView({ type: 'account' }) },
            ] as const).map(({ key, label, Icon, go }) => {
              const active = view.type === key;
              return (
                <button
                  key={key}
                  onClick={() => { go(); setSidebarOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground border-sidebar-accent-border shadow-sm"
                      : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:border-sidebar-accent-border hover:text-sidebar-foreground"
                  )}
                  data-testid={`nav-${key}`}
                >
                  <Icon className={cn("w-4 h-4", active && "text-sidebar-primary")} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Your progress */}
          {(() => {
            const nextLvl = ALL_LEVELS.find(l => l.threshold > xp);
            const floor = ALL_LEVELS.filter(l => l.threshold <= xp).slice(-1)[0]?.threshold ?? 0;
            const pct = nextLvl ? Math.max(2, Math.min(100, Math.round(((xp - floor) / (nextLvl.threshold - floor)) * 100))) : 100;
            return (
              <div className="pt-3 border-t border-sidebar-border space-y-1.5" data-testid="sidebar-progress">
                <div className="text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/55 px-1">Your progress</div>
                <button
                  onClick={() => setShowLevels(true)}
                  className="w-full text-left px-1 space-y-1.5 group"
                  data-testid="xp-level-card"
                >
                  <div className="text-sm font-bold text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
                    Lv {currentLevel.level} &middot; {currentLevel.title}
                  </div>
                  <div className="h-1.5 rounded-full bg-sidebar-foreground/10 overflow-hidden">
                    <div className="h-full bg-sidebar-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-sidebar-foreground/60">
                    {nextLvl ? `${xp} / ${nextLvl.threshold} XP to ${nextLvl.title}` : `${xp} XP &middot; max level`}
                  </div>
                </button>
                <div className="flex items-center gap-1.5 px-1 pt-0.5">
                  <Flame className={cn("w-3.5 h-3.5 flex-shrink-0", streak.currentStreak > 0 ? "text-orange-400 fill-orange-400/30" : "text-sidebar-foreground/30")} />
                  <span className="text-[12px] text-sidebar-foreground/60 truncate">
                    {streak.currentStreak > 0
                      ? `${streak.currentStreak}-day streak`
                      : 'Streak: start today'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Jump to: doubles as the colour legend, which is how the family
              system gets learned without anyone explaining it. */}
          <div className="pt-3 border-t border-sidebar-border space-y-1" data-testid="family-legend">
            <div className="text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/55 px-1 mb-1.5">Jump to</div>
            {(['foundations', 'money', 'contracts', 'winning', 'program'] as ModuleFamily[]).map(fam => {
              const inFam = modules.filter(m => getModuleFamily(m.id) === fam);
              if (inFam.length === 0) return null;
              return (
                <button
                  key={fam}
                  onClick={() => { setView({ type: 'modules' }); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left hover:bg-sidebar-accent transition-colors"
                  style={{ borderLeft: `3px solid ${FAMILY_THEME[fam].hex}` }}
                  data-testid={`family-${fam}`}
                >
                  <span className="text-[13px] leading-none flex-shrink-0">{inFam[0].icon}</span>
                  <span className="text-[13px] text-sidebar-foreground/90 truncate flex-1">{FAMILY_LABEL[fam]}</span>
                  <span className="text-[12px] tabular-nums text-sidebar-foreground/40 flex-shrink-0">{inFam.length}</span>
                </button>
              );
            })}
          </div>

          {/* CLP credit. This is why a DAWIA professional is paying: 80 points
              every two years. Shown as the NEXT certificate rather than a
              running total, because a total reads "0.0 of 43.8" on day one,
              which is the same zero-state failure as a sleeping streak tile.
              A reward four lessons out pulls; one forty hours out does not.
              Figures derive from the curriculum, so this cannot drift. */}
          {(() => {
            const nextMod = modules.find(m => m.lessons.some(l => !progress.completedLessons.has(l.id)));
            if (!nextMod) return null;
            const done = nextMod.lessons.filter(l => progress.completedLessons.has(l.id)).length;
            const left = nextMod.lessons.length - done;
            const pct = Math.round((done / nextMod.lessons.length) * 100);
            const earned = modules
              .filter(m => m.lessons.every(l => progress.completedLessons.has(l.id)))
              .reduce((sum, m) => sum + moduleClps(m.id), 0);
            return (
              <div className="rounded-lg px-3 py-2 bg-amber-500/[0.12] border border-amber-500/35 space-y-1.5" data-testid="clp-tracker">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] leading-none">&#127891;</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">CLP credit</span>
                  {earned > 0 && <span className="ml-auto text-xs font-bold text-amber-500">{formatClps(earned)} earned</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs leading-none flex-shrink-0">{nextMod.icon}</span>
                  <span className="text-[13px] font-bold text-amber-900 dark:text-amber-50 truncate flex-1">{nextMod.title}</span>
                  <span className="text-[13px] font-bold text-amber-500 flex-shrink-0">{moduleClps(nextMod.id).toFixed(1)}</span>
                </div>
                <div className="h-1 rounded-full bg-amber-900/15 dark:bg-amber-200/15 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-amber-800 dark:text-amber-200/90">
                  {left} more {left === 1 ? 'lesson' : 'lessons'} to this certificate
                </div>
                <div className="text-xs text-amber-800/80 dark:text-amber-200/70">
                  {formatClps(totalClps())} available &middot; 80 per 2-year cycle
                </div>
              </div>
            );
          })()}

          {/* Spend plan tracker keeps its entry point, one line instead of a card. */}
          <button
            onClick={() => { setView({ type: 'costTrackerIntro' }); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-left"
            data-testid="burn-rate-badge"
          >
            <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-[13px] font-semibold text-primary flex-1 truncate">Spend plan tracker</span>
            <ChevronRight className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
          </button>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {trialDaysLeft !== null && (
            <div
              className="w-full px-3 py-1.5 rounded-lg text-[13px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 text-center"
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
          {/* Admin surfaces live behind the identity row rather than in a
              learner's main nav, where platform-wide signup counts were the
              second thing a paying customer read. */}
          {isAdmin && (
            <div className="flex items-center gap-3 px-3 pb-1">
              <button
                onClick={() => { setView({ type: 'admin' }); setSidebarOpen(false); }}
                className="flex items-center gap-1.5 text-[12px] text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                data-testid="nav-admin"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </button>
              <button
                onClick={() => { setView({ type: 'analytics' }); setSidebarOpen(false); }}
                className="flex items-center gap-1.5 text-[12px] text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                data-testid="nav-analytics"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Analytics
              </button>
            </div>
          )}
          <button
            onClick={() => { setView({ type: 'account' }); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left"
            data-testid="sidebar-identity"
          >
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-sidebar-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-sidebar-foreground truncate">{user.username}</div>
              <div className="text-[12px] text-sidebar-foreground/45 truncate">
                {isPremium ? 'Pro' : 'Free'}{isAdmin ? ' · Admin' : ''}
              </div>
            </div>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            data-testid="nav-signout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <div className="flex gap-3 px-3 pt-2 pb-1">
            <a href="/privacy" className="text-[12px] text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors">Privacy</a>
            <a href="/terms" className="text-[12px] text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors">Terms</a>
            <PWAInstallLink />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen min-w-0 relative">
        {/* Background: soft radial glow only. The hex grid that used to sit
            here fought every card on top of it and dated the page. */}
        <div aria-hidden="true" className="pointer-events-none fixed md:left-72 inset-y-0 right-0 z-0 overflow-hidden">
          {/* Radial teal glow top-right */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.12]" style={{background: 'radial-gradient(circle, #01696f 0%, transparent 70%)'}} />
          {/* Radial teal glow bottom-left */}
          <div className="absolute -bottom-32 -left-16 w-[400px] h-[400px] rounded-full opacity-[0.05] dark:opacity-[0.08]" style={{background: 'radial-gradient(circle, #01696f 0%, transparent 70%)'}} />
        </div>
        {/* Top Bar */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 safe-top" style={{minHeight: '3.5rem'}}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-muted-foreground hover:text-foreground"
            data-testid="mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 md:flex-none" />
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
        <main className="flex-1 min-w-0 p-4 md:p-6 max-w-6xl mx-auto w-full relative z-10">
        <ErrorBoundary>{pageContent}</ErrorBoundary>
        </main>
      </div>
    </div>
    )}

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
