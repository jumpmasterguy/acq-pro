import { useState, useEffect, useCallback } from "react";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FREE_MODULES, getModuleProgress } from "@/lib/progress";
import { isNativeApp } from "@/lib/platform";
import { modules } from "@/lib/curriculum";
import { LayoutDashboard, BookOpen, Award, LogOut, Sun, Moon, Menu, X, Zap, User, ShieldCheck, BarChart3 } from "lucide-react";
import { AcqlerateLogo } from "@/components/AcqlerateLogo";
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
import { ModuleAssessment } from "@/components/ModuleAssessment";
import OnboardingFlow from "@/components/OnboardingFlow";
import { apiRequest } from "@/lib/queryClient";

// View types
type View =
  | { type: 'landing' }
  | { type: 'auth' }
  | { type: 'onboarding' }
  | { type: 'dashboard' }
  | { type: 'module'; moduleId: string }
  | { type: 'lesson'; lessonId: string }
  | { type: 'upgrade' }
  | { type: 'admin' }
  | { type: 'analytics' };

// Auth state
type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: AuthUser };

function buildProgressFromUser(user: AuthUser) {
  const isPremium =
    user.subscriptionStatus === "active" ||
    user.subscriptionStatus === "lifetime";
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
    const valid: View['type'][] = ['dashboard', 'module', 'lesson', 'upgrade', 'admin', 'analytics'];
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

function AppContent() {
  // Check if we arrived via a landing page CTA (/app#/auth)
  const arrivedAtAuth = typeof window !== 'undefined' &&
    (window.location.hash.startsWith('#/auth') || window.location.pathname === '/app');
  const [view, setView] = useState<View>(arrivedAtAuth ? { type: 'auth' } : { type: 'landing' });
  // Always default to dark mode to match brand
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  // Module assessment modal state
  const [assessmentModuleId, setAssessmentModuleId] = useState<string | null>(null);

  // Derived progress from server auth
  const isPremium =
    authState.status === 'authenticated' &&
    (authState.user.subscriptionStatus === 'active' ||
      authState.user.subscriptionStatus === 'lifetime');
  const completedLessons =
    authState.status === 'authenticated'
      ? new Set<string>(authState.user.completedLessons ?? [])
      : new Set<string>();
  const quizScores =
    authState.status === 'authenticated' ? authState.user.quizScores ?? {} : {};

  const progress = {
    completedLessons,
    quizScores,
    unlockedModules: new Set<string>(['foundations']),
    isPremium,
    xp:
      completedLessons.size * 100 +
      Object.values(quizScores).reduce((sum, s) => sum + Math.floor(s / 10), 0),
  };

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  const toggleDark = () => setDarkMode(d => !d);

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

  // Check session on mount — restore last view if session is still valid
  useEffect(() => {
    apiRequest("GET", "/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const user: AuthUser = await res.json();
          setAuthState({ status: 'authenticated', user });
          // Restore where the user was before the reload
          const saved = loadSavedView();
          if (saved) {
            // If saved view was admin but user lost admin, fall back to dashboard
            if (saved.type === 'admin' && !user.isAdmin) {
              setView({ type: 'dashboard' });
            } else {
              setView(saved);
            }
          } else {
            setView({ type: 'dashboard' });
          }
        } else {
          setAuthState({ status: 'unauthenticated' });
          clearSavedView();
        }
      })
      .catch(() => {
        setAuthState({ status: 'unauthenticated' });
        clearSavedView();
      });
  }, []);

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
      setView({ type: 'onboarding' });
    } else {
      track('login', { method: user.googleId ? 'google' : 'email' });
      setView({ type: 'dashboard' });
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setAuthState(prev => {
      if (prev.status !== 'authenticated') return prev;
      return { ...prev, user: { ...prev.user, userProfile: profile } };
    });
    track('onboarding_complete', { role: profile.role, goal: profile.goal });
    setView({ type: 'dashboard' });
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

  const handleSelectModule = (moduleId: string) => setView({ type: 'module', moduleId });
  const handleSelectLesson = (lessonId: string) => setView({ type: 'lesson', lessonId });
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
    setView({ type: 'lesson', lessonId });
  };

  const handleBackFromLesson = () => {
    if (view.type === 'lesson') {
      const lessonId = view.lessonId;
      const parentMod = modules.find(m => m.lessons.some(l => l.id === lessonId));
      if (parentMod) {
        setView({ type: 'module', moduleId: parentMod.id });
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

  // Landing page (no sidebar)
  if (view.type === 'landing') {
    return <Landing onGetStarted={handleGetStarted} />;
  }

  // Auth page (no sidebar)
  if (view.type === 'auth' || authState.status === 'unauthenticated') {
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

  return (
    <>
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
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
          <AcqlerateLogo iconSize={32} />
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
          <div className="bg-sidebar-accent rounded-lg px-3 py-2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-sidebar-primary" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-sidebar-foreground/50">XP Earned</div>
              <div className="text-sm font-bold text-sidebar-primary">{xp} XP</div>
            </div>
            <div className="text-[10px] text-sidebar-foreground/50">
              {completedCount} done
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setView({ type: 'dashboard' }); setSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              view.type === 'dashboard'
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          {isAdmin && (
            <button
              onClick={() => { setView({ type: 'admin' }); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                view.type === 'admin'
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              data-testid="nav-admin"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Panel
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { setView({ type: 'analytics' }); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                view.type === 'analytics'
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              data-testid="nav-analytics"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          )}

          <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 pt-3 pb-1.5">
            Modules
          </div>

          {modules.map((mod) => {
            const isActive = view.type === 'module' && (view as { type: 'module'; moduleId: string }).moduleId === mod.id;
            const isLessonInMod = view.type === 'lesson' &&
              mod.lessons.some(l => l.id === (view as { type: 'lesson'; lessonId: string }).lessonId);
            const lessonIds = mod.lessons.map(l => l.id);
            const progressPct = getModuleProgress(mod.id, lessonIds, progress.completedLessons);
            const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;

            return (
              <button
                key={mod.id}
                onClick={() => { setView({ type: 'module', moduleId: mod.id }); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  (isActive || isLessonInMod)
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                data-testid={`sidebar-${mod.id}`}
              >
                <span className="text-base">{mod.icon}</span>
                <span className="flex-1 text-left text-xs leading-tight">{mod.title}</span>
                {!isAccessible ? (
                  <span className="text-[10px] text-sidebar-foreground/40">🔒</span>
                ) : progressPct === 100 ? (
                  <span className="text-[10px] text-green-400">✓</span>
                ) : progressPct > 0 ? (
                  <span className="text-[10px] text-sidebar-primary">{progressPct}%</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {!isPremium && !isNativeApp() && (
            <button
              onClick={() => { setView({ type: 'upgrade' }); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20 transition-colors"
              data-testid="nav-upgrade"
            >
              <Award className="w-4 h-4" />
              Upgrade to Pro
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
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
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
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              data-testid="theme-toggle"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-4xl mx-auto w-full">
          {view.type === 'dashboard' && (
            <Dashboard
              progress={progress}
              onSelectModule={handleSelectModule}
              onUpgrade={handleUpgrade}
              userProfile={authState.status === 'authenticated' ? (authState.user.userProfile as UserProfile | null) : null}
              username={authState.status === 'authenticated' ? authState.user.username : undefined}
              onEditProfile={handleEditProfile}
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
                onBack={() => setView({ type: 'dashboard' })}
                onSelectLesson={handleSelectLesson}
                onUpgrade={handleUpgrade}
                unlockedLevel={(skillLevels[modId] as SkillLevel) ?? 'novice'}
                onOpenAssessment={() => setAssessmentModuleId(modId)}
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
              />
            );
          })()}
          {view.type === 'upgrade' && (
            <UpgradePage
              onBack={() => setView({ type: 'dashboard' })}
              onUpgrade={handleUpgrade}
            />
          )}
          {view.type === 'admin' && isAdmin && (
            <AdminPage />
          )}
          {view.type === 'analytics' && isAdmin && (
            <AdminAnalytics onBack={() => setView({ type: 'admin' })} />
          )}
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
  </>
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
