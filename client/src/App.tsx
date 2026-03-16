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
import { Shield, LayoutDashboard, BookOpen, Award, LogOut, Sun, Moon, Menu, X, Zap, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ModulePage from "@/pages/ModulePage";
import LessonPage from "@/pages/LessonPage";
import UpgradePage from "@/pages/UpgradePage";
import AuthPage, { type AuthUser } from "@/pages/AuthPage";
import PerplexityAttribution from "@/components/PerplexityAttribution";
import { apiRequest } from "@/lib/queryClient";

// View types
type View =
  | { type: 'landing' }
  | { type: 'auth' }
  | { type: 'dashboard' }
  | { type: 'module'; moduleId: string }
  | { type: 'lesson'; lessonId: string }
  | { type: 'upgrade' };

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

function AppContent() {
  const [view, setView] = useState<View>({ type: 'landing' });
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

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

  // Check session on mount
  useEffect(() => {
    apiRequest("GET", "/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const user: AuthUser = await res.json();
          setAuthState({ status: 'authenticated', user });
        } else {
          setAuthState({ status: 'unauthenticated' });
        }
      })
      .catch(() => {
        setAuthState({ status: 'unauthenticated' });
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

  const handleAuthenticated = (user: AuthUser) => {
    setAuthState({ status: 'authenticated', user });
    setView({ type: 'dashboard' });
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
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
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

  // Authenticated views
  const user = (authState as { status: 'authenticated'; user: AuthUser }).user;
  const xp = progress.xp;
  const completedCount = completedLessons.size;

  return (
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-sidebar-primary" />
            </div>
            <div>
              <div className="font-bold text-sm text-sidebar-foreground">AcqPro</div>
              <div className="text-[10px] text-sidebar-foreground/50 leading-tight">Defense Academy</div>
            </div>
          </div>
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
            />
          )}
          {view.type === 'module' && (
            <ModulePage
              moduleId={(view as { type: 'module'; moduleId: string }).moduleId}
              progress={progress}
              onBack={() => setView({ type: 'dashboard' })}
              onSelectLesson={handleSelectLesson}
              onUpgrade={handleUpgrade}
            />
          )}
          {view.type === 'lesson' && (
            <LessonPage
              lessonId={(view as { type: 'lesson'; lessonId: string }).lessonId}
              progress={progress}
              onBack={handleBackFromLesson}
              onComplete={handleCompleteLesson}
              onNextLesson={handleNextLesson}
            />
          )}
          {view.type === 'upgrade' && (
            <UpgradePage
              onBack={() => setView({ type: 'dashboard' })}
              onUpgrade={handleUpgrade}
            />
          )}
        </main>

        <footer className="px-4 lg:px-6 py-3 border-t border-border">
          <PerplexityAttribution />
        </footer>
      </div>
    </div>
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
