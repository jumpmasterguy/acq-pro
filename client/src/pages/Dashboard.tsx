import { useState } from "react";
import { modules, getTotalLessons } from "@/lib/curriculum";
import { getModuleProgress, getLevel, calculateXP, FREE_MODULES } from "@/lib/progress";
import type { UserProgress } from "@/lib/progress";
import { getLearningPath, ROLE_LABELS, GOAL_LABELS } from "@/lib/learningPaths";
import type { UserProfile } from "@/pages/AuthPage";
import {
  Shield, Award, Lock, ChevronRight, Star, Zap,
  ChevronDown, ChevronUp, Beaker, Settings,
  BookOpen, CheckCircle2, Circle, Target, TrendingUp, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DashboardProps {
  progress: UserProgress;
  onSelectModule: (moduleId: string) => void;
  onUpgrade: () => void;
  userProfile?: UserProfile | null;
  username?: string;
  onEditProfile?: () => void;
}

// Color configs per module color key
const COLOR_CONFIG: Record<string, {
  headerBg: string;
  headerBorder: string;
  numBg: string;
  numText: string;
  accentText: string;
  iconBg: string;
  pillBg: string;
  pillText: string;
  progressBar: string;
  checkColor: string;
}> = {
  navy: {
    headerBg: 'bg-blue-950/60 dark:bg-blue-950/80',
    headerBorder: 'border-blue-800/40',
    numBg: 'bg-blue-600',
    numText: 'text-white',
    accentText: 'text-blue-400',
    iconBg: 'bg-blue-900/50',
    pillBg: 'bg-blue-900/40',
    pillText: 'text-blue-300',
    progressBar: '[&>div]:bg-blue-500',
    checkColor: 'text-blue-400',
  },
  gold: {
    headerBg: 'bg-yellow-950/50 dark:bg-yellow-950/70',
    headerBorder: 'border-yellow-800/40',
    numBg: 'bg-yellow-600',
    numText: 'text-white',
    accentText: 'text-yellow-400',
    iconBg: 'bg-yellow-900/50',
    pillBg: 'bg-yellow-900/40',
    pillText: 'text-yellow-300',
    progressBar: '[&>div]:bg-yellow-500',
    checkColor: 'text-yellow-400',
  },
  blue: {
    headerBg: 'bg-cyan-950/50 dark:bg-cyan-950/70',
    headerBorder: 'border-cyan-800/40',
    numBg: 'bg-cyan-600',
    numText: 'text-white',
    accentText: 'text-cyan-400',
    iconBg: 'bg-cyan-900/50',
    pillBg: 'bg-cyan-900/40',
    pillText: 'text-cyan-300',
    progressBar: '[&>div]:bg-cyan-500',
    checkColor: 'text-cyan-400',
  },
  teal: {
    headerBg: 'bg-teal-950/50 dark:bg-teal-950/70',
    headerBorder: 'border-teal-800/40',
    numBg: 'bg-teal-600',
    numText: 'text-white',
    accentText: 'text-teal-400',
    iconBg: 'bg-teal-900/50',
    pillBg: 'bg-teal-900/40',
    pillText: 'text-teal-300',
    progressBar: '[&>div]:bg-teal-500',
    checkColor: 'text-teal-400',
  },
  amber: {
    headerBg: 'bg-amber-950/50 dark:bg-amber-950/70',
    headerBorder: 'border-amber-800/40',
    numBg: 'bg-amber-600',
    numText: 'text-white',
    accentText: 'text-amber-400',
    iconBg: 'bg-amber-900/50',
    pillBg: 'bg-amber-900/40',
    pillText: 'text-amber-300',
    progressBar: '[&>div]:bg-amber-500',
    checkColor: 'text-amber-400',
  },
  slate: {
    headerBg: 'bg-slate-800/60 dark:bg-slate-800/80',
    headerBorder: 'border-slate-700/40',
    numBg: 'bg-slate-500',
    numText: 'text-white',
    accentText: 'text-slate-300',
    iconBg: 'bg-slate-700/50',
    pillBg: 'bg-slate-700/40',
    pillText: 'text-slate-300',
    progressBar: '[&>div]:bg-slate-400',
    checkColor: 'text-slate-400',
  },
};

// Light mode overrides for card body area
const LIGHT_COLORS: Record<string, {
  border: string;
  accentLight: string;
  numBgLight: string;
  pillBgLight: string;
  pillTextLight: string;
  checkLight: string;
  progressLight: string;
}> = {
  navy:  { border: 'border-blue-200  dark:border-blue-800/40',  accentLight: 'text-blue-600  dark:text-blue-400',  numBgLight: 'bg-blue-600',  pillBgLight: 'bg-blue-100  dark:bg-blue-900/40',  pillTextLight: 'text-blue-700  dark:text-blue-300',  checkLight: 'text-blue-500  dark:text-blue-400',  progressLight: '[&>div]:bg-blue-500' },
  gold:  { border: 'border-yellow-200 dark:border-yellow-800/40', accentLight: 'text-yellow-600 dark:text-yellow-400', numBgLight: 'bg-yellow-600', pillBgLight: 'bg-yellow-100 dark:bg-yellow-900/40', pillTextLight: 'text-yellow-700 dark:text-yellow-300', checkLight: 'text-yellow-500 dark:text-yellow-400', progressLight: '[&>div]:bg-yellow-500' },
  blue:  { border: 'border-cyan-200   dark:border-cyan-800/40',   accentLight: 'text-cyan-600   dark:text-cyan-400',   numBgLight: 'bg-cyan-600',   pillBgLight: 'bg-cyan-100   dark:bg-cyan-900/40',   pillTextLight: 'text-cyan-700   dark:text-cyan-300',   checkLight: 'text-cyan-500   dark:text-cyan-400',   progressLight: '[&>div]:bg-cyan-500'   },
  teal:  { border: 'border-teal-200   dark:border-teal-800/40',   accentLight: 'text-teal-600   dark:text-teal-400',   numBgLight: 'bg-teal-600',   pillBgLight: 'bg-teal-100   dark:bg-teal-900/40',   pillTextLight: 'text-teal-700   dark:text-teal-300',   checkLight: 'text-teal-500   dark:text-teal-400',   progressLight: '[&>div]:bg-teal-500'   },
  amber: { border: 'border-amber-200  dark:border-amber-800/40',  accentLight: 'text-amber-600  dark:text-amber-400',  numBgLight: 'bg-amber-600',  pillBgLight: 'bg-amber-100  dark:bg-amber-900/40',  pillTextLight: 'text-amber-700  dark:text-amber-300',  checkLight: 'text-amber-500  dark:text-amber-400',  progressLight: '[&>div]:bg-amber-500'  },
  slate: { border: 'border-slate-300  dark:border-slate-700/40',  accentLight: 'text-slate-600  dark:text-slate-300',  numBgLight: 'bg-slate-500',  pillBgLight: 'bg-slate-100  dark:bg-slate-700/40',  pillTextLight: 'text-slate-600  dark:text-slate-300',  checkLight: 'text-slate-400  dark:text-slate-400',  progressLight: '[&>div]:bg-slate-400'  },
};

export default function Dashboard({ progress, onSelectModule, onUpgrade, userProfile, username, onEditProfile }: DashboardProps) {
  const totalLessons = getTotalLessons();
  const completedCount = progress.completedLessons.size;
  const xp = calculateXP(progress.completedLessons, progress.quizScores);
  const levelInfo = getLevel(xp);
  const [bonusExpanded, setBonusExpanded] = useState(false);

  const learningPath = getLearningPath(userProfile);
  const hasBonusModules = learningPath.bonusModules.length > 0;

  // Sort modules
  const primaryMods = learningPath.primaryModules
    .map(id => modules.find(m => m.id === id))
    .filter(Boolean) as typeof modules;
  const bonusMods = learningPath.bonusModules
    .map(id => modules.find(m => m.id === id))
    .filter(Boolean) as typeof modules;
  const otherMods = modules.filter(
    m => !learningPath.primaryModules.includes(m.id) && !learningPath.bonusModules.includes(m.id)
  );
  const allPrimary = [...primaryMods, ...otherMods];

  const moduleSeqNum: Record<string, number> = {};
  allPrimary.forEach((m, i) => { moduleSeqNum[m.id] = i + 1; });

  const nextLesson = (() => {
    for (const mod of [...allPrimary, ...bonusMods]) {
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

  // ── Module Card ──────────────────────────────────────────────
  function ModuleCard({ mod, seqNum, isFirst }: { mod: typeof modules[0]; seqNum?: number; isFirst?: boolean }) {
    const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
    const lessonIds = mod.lessons.map(l => l.id);
    const progressPct = getModuleProgress(mod.id, lessonIds, progress.completedLessons);
    const colors = LIGHT_COLORS[mod.color] || LIGHT_COLORS.slate;

    // Show up to 5 lessons as preview
    const previewLessons = mod.lessons.slice(0, 5);
    const remaining = mod.lessons.length - previewLessons.length;

    return (
      <div
        className={cn(
          "group relative rounded-2xl border overflow-hidden transition-all duration-200",
          "bg-card shadow-sm",
          colors.border,
          isAccessible
            ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            : "opacity-70",
          isFirst ? "ring-2 ring-primary/30" : ""
        )}
        onClick={() => isAccessible ? onSelectModule(mod.id) : onUpgrade()}
        data-testid={`module-${mod.id}`}
      >
        {/* Colored Header Band */}
        <div className={cn(
          "px-5 py-4 border-b",
          "bg-gradient-to-r",
          mod.color === 'navy'  ? "from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 border-blue-700/50" :
          mod.color === 'gold'  ? "from-yellow-500 to-amber-600 dark:from-yellow-800 dark:to-amber-900 border-yellow-600/50" :
          mod.color === 'blue'  ? "from-cyan-500 to-cyan-700 dark:from-cyan-800 dark:to-cyan-900 border-cyan-600/50" :
          mod.color === 'teal'  ? "from-teal-500 to-teal-700 dark:from-teal-800 dark:to-teal-900 border-teal-600/50" :
          mod.color === 'amber' ? "from-amber-500 to-orange-600 dark:from-amber-800 dark:to-orange-900 border-amber-600/50" :
                                  "from-slate-500 to-slate-700 dark:from-slate-700 dark:to-slate-900 border-slate-600/50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Number badge */}
              {seqNum !== undefined ? (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold tabular-nums border border-white/30">
                  {String(seqNum).padStart(2, '0')}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-medium border border-white/30">★</span>
              )}

              {/* Icon + title */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{mod.icon}</span>
                  <span className="font-bold text-white text-sm">{mod.title}</span>
                </div>
                <div className="text-[11px] text-white/70 mt-0.5">{mod.subtitle}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isFirst && (
                <span className="inline-flex items-center rounded-full bg-white/20 border border-white/30 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                  Start Here
                </span>
              )}
              {mod.free && (
                <span className="inline-flex items-center rounded-full bg-emerald-400/20 border border-emerald-300/40 px-2 py-0.5 text-[10px] font-bold text-emerald-200 uppercase tracking-wide">
                  Free
                </span>
              )}
              {!isAccessible && <Lock className="w-4 h-4 text-white/60" />}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Description */}
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">{mod.description}</p>

          {/* Lesson Sub-List */}
          <div className="space-y-1 mb-4">
            {previewLessons.map((lesson) => {
              const done = progress.completedLessons.has(lesson.id);
              return (
                <div key={lesson.id} className="flex items-center gap-2.5 group/lesson">
                  {done ? (
                    <CheckCircle2 className={cn("w-3.5 h-3.5 flex-shrink-0", colors.checkLight)} />
                  ) : (
                    <Circle className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={cn(
                    "text-xs leading-snug truncate",
                    done ? "text-muted-foreground line-through" : "text-foreground/80"
                  )}>
                    {lesson.title}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground/50 flex-shrink-0">{lesson.duration}</span>
                </div>
              );
            })}
            {remaining > 0 && (
              <div className={cn("text-[11px] font-medium mt-1 pl-6", colors.accentLight)}>
                + {remaining} more lesson{remaining > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Progress Footer */}
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <BookOpen className={cn("w-3 h-3", colors.accentLight)} />
                <span className="text-xs text-muted-foreground">{mod.lessons.length} lessons</span>
              </div>
              <span className={cn("text-xs font-semibold", isAccessible && progressPct > 0 ? colors.accentLight : 'text-muted-foreground')}>
                {isAccessible ? (progressPct > 0 ? `${progressPct}% done` : 'Not started') : 'Locked'}
              </span>
            </div>
            <Progress value={isAccessible ? progressPct : 0} className={cn("h-1.5", colors.progressLight)} />
          </div>

          {/* CTA arrow */}
          {isAccessible && (
            <div className={cn("flex items-center gap-1 mt-3 text-xs font-medium", colors.accentLight)}>
              <span>{progressPct > 0 ? 'Continue' : 'Start module'}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Stats strip ──────────────────────────────────────────────
  const statsStrip = [
    { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, value: completedCount, label: 'Lessons done', sub: `of ${totalLessons} total` },
    { icon: <Zap className="w-5 h-5 text-yellow-500" />, value: xp, label: 'XP earned', sub: `Lv ${levelInfo.level} · ${levelInfo.title}` },
    { icon: <Target className="w-5 h-5 text-primary" />, value: progress.isPremium ? modules.length : FREE_MODULES.length, label: 'Modules unlocked', sub: `of ${modules.length} available` },
    { icon: <TrendingUp className="w-5 h-5 text-cyan-500" />, value: `${Math.round((completedCount / totalLessons) * 100)}%`, label: 'Overall progress', sub: `${totalLessons - completedCount} remaining` },
  ];

  return (
    <div className="space-y-8">

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {username ? `Welcome back, ${username.split(' ')[0]}` : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {completedCount === 0
              ? "Start your DoD acquisitions journey today."
              : `You've completed ${completedCount} of ${totalLessons} lessons.`}
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Level {levelInfo.level}</div>
            <div className="text-sm font-bold">{levelInfo.title}</div>
          </div>
          <div className="ml-3 pl-3 border-l border-border text-right">
            <div className="text-xs text-muted-foreground">XP</div>
            <div className="text-sm font-bold text-primary">{xp}</div>
          </div>
        </div>
      </div>

      {/* Learning Path Banner */}
      {userProfile?.completedOnboarding && (
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground">{learningPath.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{learningPath.description}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {ROLE_LABELS[userProfile.role]}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {GOAL_LABELS[userProfile.goal]}
              </span>
            </div>
          </div>
          {onEditProfile && (
            <button onClick={onEditProfile} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors" title="Update your learning path">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* No profile yet */}
      {!userProfile?.completedOnboarding && (
        <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Personalize your learning path</div>
            <div className="text-xs text-muted-foreground mt-0.5">Answer 3 quick questions to get a custom module order tailored to your role and goals.</div>
          </div>
          {onEditProfile && (
            <Button size="sm" variant="outline" onClick={onEditProfile} className="flex-shrink-0 gap-1.5">
              <ChevronRight className="w-3.5 h-3.5" /> Personalize
            </Button>
          )}
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsStrip.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3.5 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-2">
              {s.icon}
              <span className="text-xl font-bold tabular-nums">{s.value}</span>
            </div>
            <div className="text-xs font-medium text-foreground/80">{s.label}</div>
            <div className="text-[10px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      {nextLesson && (
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/25 rounded-2xl p-5">
          {/* Decorative */}
          <div className="absolute right-4 top-0 bottom-0 flex items-center opacity-5 pointer-events-none select-none">
            <span className="text-[120px] font-black text-primary">→</span>
          </div>
          <div className="relative">
            <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Continue where you left off
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-base">{nextLesson.lesson.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {nextLesson.module.title} · {nextLesson.lesson.duration}
                </div>
              </div>
              <Button onClick={() => onSelectModule(nextLesson.module.id)} data-testid="continue-lesson-btn">
                Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">
            {userProfile?.completedOnboarding ? 'Your Learning Path' : 'All Modules'}
          </h2>
          <span className="text-xs text-muted-foreground">{allPrimary.length} modules · {getTotalLessons()} lessons</span>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {allPrimary.map((mod, i) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              seqNum={moduleSeqNum[mod.id]}
              isFirst={i === 0}
            />
          ))}
        </div>
      </div>

      {/* Bonus modules */}
      {hasBonusModules && (
        <div>
          <button
            onClick={() => setBonusExpanded(e => !e)}
            className="w-full flex items-center gap-3 group"
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
                <Beaker className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  See How the Sauce is Made
                </div>
                <div className="text-xs text-muted-foreground">
                  {bonusMods.length} bonus module{bonusMods.length > 1 ? 's' : ''} — beyond your primary track
                </div>
              </div>
            </div>
            <div className="text-muted-foreground group-hover:text-foreground transition-colors">
              {bonusExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {bonusExpanded && (
            <div className="mt-4 grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed bg-muted/40 rounded-lg p-3 border border-border">
                  These modules are outside your primary track but give you insight into how the full acquisition ecosystem works —
                  from Congressional appropriations to how contractors build their BD pipeline.
                </p>
              </div>
              {bonusMods.map(mod => <ModuleCard key={mod.id} mod={mod} seqNum={undefined} isFirst={false} />)}
            </div>
          )}
        </div>
      )}

      {/* Upgrade CTA */}
      {!progress.isPremium && (
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-7 text-center">
          <Award className="w-9 h-9 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1.5">Unlock the Full Academy</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Get access to all {modules.length} modules, {getTotalLessons()}+ lessons,
            quizzes, and career resources for a one-time investment in your career.
          </p>
          <Button onClick={onUpgrade} size="lg" data-testid="upgrade-cta">
            Upgrade to Pro — $149 lifetime
          </Button>
        </div>
      )}
    </div>
  );
}
