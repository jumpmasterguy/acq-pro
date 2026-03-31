import { useState } from "react";
import { modules, getTotalLessons, getModuleTotalMinutes, formatDuration } from "@/lib/curriculum";
import { getModuleProgress, getLevel, calculateXP, FREE_MODULES } from "@/lib/progress";
import type { UserProgress } from "@/lib/progress";
import { getLearningPath, ROLE_LABELS, GOAL_LABELS } from "@/lib/learningPaths";
import type { UserProfile } from "@/pages/AuthPage";
import {
  Shield, Award, Lock, ChevronRight, Star, Zap,
  ChevronDown, ChevronUp, Beaker, Settings,
  BookOpen, CheckCircle2, Circle, Target, TrendingUp, Clock,
  Briefcase, Building2, FileText, LayoutGrid, Filter
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

// ── Career path filter definitions ─────────────────────────────────────────
type FilterMode = 'career' | 'subject';
type CareerTrackId = 'usg_pm' | 'contractor_pm' | 'contracting_officer' | 'capture_bd';
type SubjectGroupId = 'acquisition_foundations' | 'finance_contracts' | 'capture_analytics' | 'pm_operations';

interface CareerTrack {
  id: CareerTrackId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  desc: string;
  /** Module IDs in priority order */
  primaryModules: string[];
  bonusModules: string[];
}

interface SubjectGroup {
  id: SubjectGroupId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  desc: string;
  moduleIds: string[];
}

const CAREER_TRACKS: CareerTrack[] = [
  {
    id: 'usg_pm',
    label: 'USG Program Manager',
    shortLabel: 'USG PM',
    icon: <Building2 className="w-3.5 h-3.5" />,
    desc: 'Government-side PM managing programs, budgets, and contractor oversight',
    primaryModules: ['foundations', 'finance', 'contracts', 'data', 'ops'],
    bonusModules: ['capture'],
  },
  {
    id: 'contractor_pm',
    label: 'DoD Contractor PM',
    shortLabel: 'Contractor PM',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    desc: 'Industry-side PM executing contracts, managing costs, and delivering programs',
    primaryModules: ['contracts', 'finance', 'data', 'ops', 'foundations'],
    bonusModules: ['capture'],
  },
  {
    id: 'contracting_officer',
    label: 'Contracting Officer',
    shortLabel: '1102 / CO',
    icon: <FileText className="w-3.5 h-3.5" />,
    desc: '1102 series — source selection, contract administration, FAR/DFARS compliance',
    primaryModules: ['contracts', 'foundations', 'finance'],
    bonusModules: ['data', 'capture', 'ops'],
  },
  {
    id: 'capture_bd',
    label: 'Capture & BD',
    shortLabel: 'Capture / BD',
    icon: <LayoutGrid className="w-3.5 h-3.5" />,
    desc: 'Win more business — master the capture lifecycle, proposals, and source selection',
    primaryModules: ['capture', 'contracts', 'foundations'],
    bonusModules: ['finance', 'data', 'ops'],
  },
];

const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    id: 'acquisition_foundations',
    label: 'Acquisition Foundations',
    shortLabel: 'Foundations',
    icon: <Shield className="w-3.5 h-3.5" />,
    desc: 'Lifecycle, key players, contract basics — the framework everything else builds on',
    moduleIds: ['foundations'],
  },
  {
    id: 'finance_contracts',
    label: 'Finance & Contracting',
    shortLabel: 'Finance + Contracts',
    icon: <FileText className="w-3.5 h-3.5" />,
    desc: 'Appropriations, EVM, contract types, source selection, COR, and modifications',
    moduleIds: ['finance', 'contracts'],
  },
  {
    id: 'capture_analytics',
    label: 'Capture, BD & Analytics',
    shortLabel: 'Capture + Data',
    icon: <Target className="w-3.5 h-3.5" />,
    desc: 'Winning work and measuring it — proposals, pipelines, dashboards, and KPIs',
    moduleIds: ['capture', 'data'],
  },
  {
    id: 'pm_operations',
    label: 'PM Operations & Leadership',
    shortLabel: 'PM Operations',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    desc: 'Risk management, stakeholder communication, career roadmap, and subcontractor oversight',
    moduleIds: ['ops'],
  },
];

// ── Color configs ───────────────────────────────────────────────────────────
const LIGHT_COLORS: Record<string, {
  border: string; accentLight: string; checkLight: string; progressLight: string;
}> = {
  navy:  { border: 'border-blue-200  dark:border-blue-800/40',  accentLight: 'text-blue-600  dark:text-blue-400',  checkLight: 'text-blue-500  dark:text-blue-400',  progressLight: '[&>div]:bg-blue-500'  },
  gold:  { border: 'border-yellow-200 dark:border-yellow-800/40', accentLight: 'text-yellow-600 dark:text-yellow-400', checkLight: 'text-yellow-500 dark:text-yellow-400', progressLight: '[&>div]:bg-yellow-500' },
  blue:  { border: 'border-cyan-200   dark:border-cyan-800/40',   accentLight: 'text-cyan-600   dark:text-cyan-400',   checkLight: 'text-cyan-500   dark:text-cyan-400',   progressLight: '[&>div]:bg-cyan-500'   },
  teal:  { border: 'border-teal-200   dark:border-teal-800/40',   accentLight: 'text-teal-600   dark:text-teal-400',   checkLight: 'text-teal-500   dark:text-teal-400',   progressLight: '[&>div]:bg-teal-500'   },
  amber: { border: 'border-amber-200  dark:border-amber-800/40',  accentLight: 'text-amber-600  dark:text-amber-400',  checkLight: 'text-amber-500  dark:text-amber-400',  progressLight: '[&>div]:bg-amber-500'  },
  slate: { border: 'border-slate-300  dark:border-slate-700/40',  accentLight: 'text-slate-600  dark:text-slate-300',  checkLight: 'text-slate-400  dark:text-slate-400',  progressLight: '[&>div]:bg-slate-400'  },
};

// ── Module Card ─────────────────────────────────────────────────────────────
function ModuleCard({
  mod, seqNum, isFirst, progress, onSelect, onUpgrade, isPrimary
}: {
  mod: typeof modules[0];
  seqNum?: number;
  isFirst?: boolean;
  progress: UserProgress;
  onSelect: () => void;
  onUpgrade: () => void;
  isPrimary?: boolean;
}) {
  const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
  const lessonIds = mod.lessons.map(l => l.id);
  const progressPct = getModuleProgress(mod.id, lessonIds, progress.completedLessons);
  const colors = LIGHT_COLORS[mod.color] || LIGHT_COLORS.slate;
  const totalMins = getModuleTotalMinutes(mod.id);

  const previewLessons = mod.lessons.slice(0, 5);
  const remaining = mod.lessons.length - previewLessons.length;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all duration-200 bg-card shadow-sm",
        colors.border,
        isAccessible ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer" : "opacity-70",
        isFirst ? "ring-2 ring-primary/30" : "",
        !isPrimary ? "opacity-80" : ""
      )}
      onClick={() => isAccessible ? onSelect() : onUpgrade()}
      data-testid={`module-${mod.id}`}
    >
      {/* Colored gradient header */}
      <div className={cn(
        "px-5 py-4 border-b bg-gradient-to-r",
        mod.color === 'navy'  ? "from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 border-blue-700/50" :
        mod.color === 'gold'  ? "from-yellow-500 to-amber-600 dark:from-yellow-800 dark:to-amber-900 border-yellow-600/50" :
        mod.color === 'blue'  ? "from-cyan-500 to-cyan-700 dark:from-cyan-800 dark:to-cyan-900 border-cyan-600/50" :
        mod.color === 'teal'  ? "from-teal-500 to-teal-700 dark:from-teal-800 dark:to-teal-900 border-teal-600/50" :
        mod.color === 'amber' ? "from-amber-500 to-orange-600 dark:from-amber-800 dark:to-orange-900 border-amber-600/50" :
                                "from-slate-500 to-slate-700 dark:from-slate-700 dark:to-slate-900 border-slate-600/50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {seqNum !== undefined ? (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold tabular-nums border border-white/30">
                {String(seqNum).padStart(2, '0')}
              </span>
            ) : (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-medium border border-white/30">★</span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{mod.icon}</span>
                <span className="font-bold text-white text-sm">{mod.title}</span>
              </div>
              {/* Minutes + lessons in subtitle */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-white/60">{mod.subtitle}</span>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-[11px] text-white/80 font-medium flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 inline" /> {formatDuration(totalMins)}
                </span>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-[11px] text-white/70">{mod.lessons.length} lessons</span>
              </div>
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

      {/* Body */}
      <div className="p-5">
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">{mod.description}</p>

        {/* Lesson sub-list */}
        <div className="space-y-1 mb-4">
          {previewLessons.map((lesson) => {
            const done = progress.completedLessons.has(lesson.id);
            return (
              <div key={lesson.id} className="flex items-center gap-2.5">
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

        {/* Progress footer */}
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

// ── Filter Tab Button ───────────────────────────────────────────────────────
function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard({ progress, onSelectModule, onUpgrade, userProfile, username, onEditProfile }: DashboardProps) {
  const totalLessons = getTotalLessons();
  const completedCount = progress.completedLessons.size;
  const xp = calculateXP(progress.completedLessons, progress.quizScores);
  const levelInfo = getLevel(xp);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('career');
  const [activeCareer, setActiveCareer] = useState<CareerTrackId>('usg_pm');
  const [activeSubject, setActiveSubject] = useState<SubjectGroupId>('acquisition_foundations');
  const [bonusExpanded, setBonusExpanded] = useState(false);

  // Resolve display order from filters
  const { orderedPrimary, orderedBonus } = (() => {
    if (filterMode === 'career') {
      const track = CAREER_TRACKS.find(t => t.id === activeCareer)!;
      const primary = track.primaryModules.map(id => modules.find(m => m.id === id)).filter(Boolean) as typeof modules;
      const bonus = track.bonusModules.map(id => modules.find(m => m.id === id)).filter(Boolean) as typeof modules;
      // Any module not in either list
      const extra = modules.filter(m => !track.primaryModules.includes(m.id) && !track.bonusModules.includes(m.id));
      return { orderedPrimary: [...primary, ...extra], orderedBonus: bonus };
    } else {
      // Subject mode: show group's modules prominently, others as bonus
      const group = SUBJECT_GROUPS.find(g => g.id === activeSubject)!;
      const primary = group.moduleIds.map(id => modules.find(m => m.id === id)).filter(Boolean) as typeof modules;
      const bonus = modules.filter(m => !group.moduleIds.includes(m.id));
      return { orderedPrimary: primary, orderedBonus: bonus };
    }
  })();

  // Seq numbers (primary modules only)
  const moduleSeqNum: Record<string, number> = {};
  orderedPrimary.forEach((m, i) => { moduleSeqNum[m.id] = i + 1; });

  // Next lesson (across all modules)
  const nextLesson = (() => {
    for (const mod of [...orderedPrimary, ...orderedBonus]) {
      const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
      if (!isAccessible) continue;
      for (const lesson of mod.lessons) {
        if (!progress.completedLessons.has(lesson.id)) return { lesson, module: mod };
      }
    }
    return null;
  })();

  const learningPath = getLearningPath(userProfile);

  const statsStrip = [
    { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, value: completedCount, label: 'Lessons done', sub: `of ${totalLessons} total` },
    { icon: <Zap className="w-5 h-5 text-yellow-500" />, value: xp, label: 'XP earned', sub: `Lv ${levelInfo.level} · ${levelInfo.title}` },
    { icon: <Target className="w-5 h-5 text-primary" />, value: progress.isPremium ? modules.length : FREE_MODULES.length, label: 'Modules unlocked', sub: `of ${modules.length} available` },
    { icon: <TrendingUp className="w-5 h-5 text-cyan-500" />, value: `${Math.round((completedCount / totalLessons) * 100)}%`, label: 'Overall progress', sub: `${totalLessons - completedCount} remaining` },
  ];

  // Active filter description
  const activeFilterDesc = filterMode === 'career'
    ? CAREER_TRACKS.find(t => t.id === activeCareer)!.desc
    : SUBJECT_GROUPS.find(g => g.id === activeSubject)!.desc;

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

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">View by</span>
          <div className="flex items-center gap-1.5 bg-muted/40 rounded-xl p-1">
            <FilterTab active={filterMode === 'career'} onClick={() => setFilterMode('career')}>
              Career Path
            </FilterTab>
            <FilterTab active={filterMode === 'subject'} onClick={() => setFilterMode('subject')}>
              Subject Matter
            </FilterTab>
          </div>
        </div>

        {/* Career path tabs */}
        {filterMode === 'career' && (
          <div className="flex flex-wrap gap-2">
            {CAREER_TRACKS.map(track => (
              <button
                key={track.id}
                onClick={() => setActiveCareer(track.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  activeCareer === track.id
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {track.icon}
                {track.shortLabel}
              </button>
            ))}
          </div>
        )}

        {/* Subject group tabs */}
        {filterMode === 'subject' && (
          <div className="flex flex-wrap gap-2">
            {SUBJECT_GROUPS.map(group => (
              <button
                key={group.id}
                onClick={() => setActiveSubject(group.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  activeSubject === group.id
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {group.icon}
                {group.shortLabel}
              </button>
            ))}
          </div>
        )}

        {/* Active filter description */}
        <p className="text-xs text-muted-foreground italic">{activeFilterDesc}</p>
      </div>

      {/* ── Primary Modules ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">
            {filterMode === 'career'
              ? CAREER_TRACKS.find(t => t.id === activeCareer)!.label + ' Path'
              : SUBJECT_GROUPS.find(g => g.id === activeSubject)!.label}
          </h2>
          <span className="text-xs text-muted-foreground">
            {orderedPrimary.length} module{orderedPrimary.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {orderedPrimary.map((mod, i) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              seqNum={moduleSeqNum[mod.id]}
              isFirst={i === 0}
              progress={progress}
              onSelect={() => onSelectModule(mod.id)}
              onUpgrade={onUpgrade}
              isPrimary
            />
          ))}
        </div>
      </div>

      {/* ── Supporting Modules ────────────────────────────────────────── */}
      {orderedBonus.length > 0 && (
        <div>
          <button
            onClick={() => setBonusExpanded(e => !e)}
            className="w-full flex items-center gap-3 group mb-1"
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Beaker className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {filterMode === 'career' ? 'Bonus Modules' : 'Other Modules'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {orderedBonus.length} module{orderedBonus.length !== 1 ? 's' : ''} —{' '}
                  {filterMode === 'career' ? 'outside this career track, but valuable context' : 'outside this subject group'}
                </div>
              </div>
            </div>
            <div className="text-muted-foreground group-hover:text-foreground transition-colors">
              {bonusExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {bonusExpanded && (
            <div className="mt-4 grid md:grid-cols-2 gap-5">
              {orderedBonus.map(mod => (
                <ModuleCard
                  key={mod.id}
                  mod={mod}
                  seqNum={undefined}
                  isFirst={false}
                  progress={progress}
                  onSelect={() => onSelectModule(mod.id)}
                  onUpgrade={onUpgrade}
                  isPrimary={false}
                />
              ))}
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
