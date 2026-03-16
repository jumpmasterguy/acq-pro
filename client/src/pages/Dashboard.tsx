import { modules, getTotalLessons } from "@/lib/curriculum";
import { getModuleProgress, getLevel, calculateXP, FREE_MODULES } from "@/lib/progress";
import type { UserProgress } from "@/lib/progress";
import { Shield, TrendingUp, BookOpen, Award, Lock, ChevronRight, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

interface DashboardProps {
  progress: UserProgress;
  onSelectModule: (moduleId: string) => void;
  onUpgrade: () => void;
}

export default function Dashboard({ progress, onSelectModule, onUpgrade }: DashboardProps) {
  const totalLessons = getTotalLessons();
  const completedCount = progress.completedLessons.size;
  const xp = calculateXP(progress.completedLessons, progress.quizScores);
  const levelInfo = getLevel(xp);

  const colorMap: Record<string, string> = {
    navy: 'bg-blue-900/20 border-blue-800/30 text-blue-600 dark:text-blue-400',
    gold: 'bg-yellow-900/20 border-yellow-800/30 text-yellow-600 dark:text-yellow-400',
    blue: 'bg-cyan-900/20 border-cyan-800/30 text-cyan-600 dark:text-cyan-400',
    teal: 'bg-teal-900/20 border-teal-800/30 text-teal-600 dark:text-teal-400',
    amber: 'bg-amber-900/20 border-amber-800/30 text-amber-600 dark:text-amber-400',
    slate: 'bg-slate-900/20 border-slate-800/30 text-slate-600 dark:text-slate-400',
  };

  const iconBgMap: Record<string, string> = {
    navy: 'bg-blue-100 dark:bg-blue-950',
    gold: 'bg-yellow-100 dark:bg-yellow-950',
    blue: 'bg-cyan-100 dark:bg-cyan-950',
    teal: 'bg-teal-100 dark:bg-teal-950',
    amber: 'bg-amber-100 dark:bg-amber-950',
    slate: 'bg-slate-100 dark:bg-slate-800',
  };

  // Find next incomplete lesson across all accessible modules
  const nextLesson = (() => {
    for (const mod of modules) {
      const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
      if (!isAccessible) continue;
      for (const lesson of mod.lessons) {
        if (!progress.completedLessons.has(lesson.id)) {
          return { lesson, module: mod };
        }
      }
    }
    return null;
  })();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {completedCount === 0
              ? "Start your DoD acquisitions journey today."
              : `You've completed ${completedCount} of ${totalLessons} lessons.`}
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-4 py-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Level {levelInfo.level}</div>
            <div className="text-sm font-semibold">{levelInfo.title}</div>
          </div>
          <div className="ml-2 text-right">
            <div className="text-xs text-muted-foreground">XP</div>
            <div className="text-sm font-bold text-primary">{xp}</div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4" data-testid="stat-lessons">
          <div className="text-xs text-muted-foreground mb-1">Lessons Completed</div>
          <div className="text-2xl font-bold">{completedCount}<span className="text-sm font-normal text-muted-foreground ml-1">/ {totalLessons}</span></div>
          <Progress value={(completedCount / totalLessons) * 100} className="h-1.5 mt-2" />
        </div>
        <div className="bg-card border border-border rounded-xl p-4" data-testid="stat-xp">
          <div className="text-xs text-muted-foreground mb-1">Total XP Earned</div>
          <div className="text-2xl font-bold">{xp}</div>
          <div className="text-xs text-muted-foreground mt-1">Next level: {levelInfo.nextXP - xp} XP away</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4" data-testid="stat-modules">
          <div className="text-xs text-muted-foreground mb-1">Modules Unlocked</div>
          <div className="text-2xl font-bold">
            {progress.isPremium ? modules.length : FREE_MODULES.length}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ {modules.length}</span>
          </div>
          {!progress.isPremium && (
            <button onClick={onUpgrade} className="text-xs text-primary hover:underline mt-1">
              Upgrade to unlock all →
            </button>
          )}
        </div>
      </div>

      {/* Continue Learning */}
      {nextLesson && (
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-5">
          <div className="text-xs font-medium text-primary mb-2 uppercase tracking-wider">Continue Learning</div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{nextLesson.lesson.title}</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {nextLesson.module.title} · {nextLesson.lesson.duration}
              </div>
            </div>
            <Button
              onClick={() => onSelectModule(nextLesson.module.id)}
              size="sm"
              data-testid="continue-lesson-btn"
            >
              Continue <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modules Grid */}
      <div>
        <h2 className="text-base font-semibold mb-4">All Modules</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {modules.map((mod) => {
            const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
            const lessonIds = mod.lessons.map(l => l.id);
            const progressPct = getModuleProgress(mod.id, lessonIds, progress.completedLessons);
            const colorCls = colorMap[mod.color] || colorMap.slate;
            const iconBgCls = iconBgMap[mod.color] || iconBgMap.slate;

            return (
              <div
                key={mod.id}
                className={`relative rounded-xl border bg-card p-5 transition-all duration-200 lesson-card ${
                  isAccessible
                    ? 'hover:border-primary/40 cursor-pointer hover:shadow-md'
                    : 'opacity-75'
                }`}
                onClick={() => isAccessible ? onSelectModule(mod.id) : onUpgrade()}
                data-testid={`module-${mod.id}`}
              >
                {!isAccessible && (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${iconBgCls} flex items-center justify-center text-xl flex-shrink-0`}>
                    {mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{mod.title}</span>
                      {mod.free && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200 dark:border-green-800">Free</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{mod.lessons.length} lessons</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{mod.description}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className={`font-medium ${isAccessible && progressPct > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isAccessible ? `${progressPct}%` : 'Locked'}
                    </span>
                  </div>
                  <Progress value={isAccessible ? progressPct : 0} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade CTA if not premium */}
      {!progress.isPremium && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 p-6 text-center">
          <Award className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Unlock the Full Academy</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Get access to all {modules.length} modules, {getTotalLessons()}+ lessons, 
            quizzes, and career resources for a one-time investment in your career.
          </p>
          <Button onClick={onUpgrade} data-testid="upgrade-cta">
            Upgrade to Pro — $149 lifetime
          </Button>
        </div>
      )}
    </div>
  );
}
