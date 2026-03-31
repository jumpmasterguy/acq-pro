import { useState } from "react";
import { modules, getTotalLessons, getModuleTotalMinutes, formatDuration, parseDuration } from "@/lib/curriculum";
import { getModuleProgress, getLevel, calculateXP, FREE_MODULES } from "@/lib/progress";
import type { UserProgress } from "@/lib/progress";
import type { UserProfile } from "@/pages/AuthPage";
import {
  Award, Lock, ChevronRight, Zap,
  ChevronDown, ChevronUp, Beaker,
  BookOpen, CheckCircle2, Circle, Target, TrendingUp, Clock,
  Briefcase, Building2, FileText, LayoutGrid, Filter
} from "lucide-react";
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

// ── Career track lesson-level definitions ───────────────────────────────────
type FilterMode = 'career' | 'subject';
type CareerTrackId = 'usg_pm' | 'contractor_pm' | 'contracting_officer' | 'capture_bd';
type SubjectGroupId = 'acquisition_foundations' | 'finance_contracts' | 'capture_analytics' | 'pm_operations';

interface CareerTrack {
  id: CareerTrackId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  desc: string;
  /** Lesson IDs in this track — ordered within each module. */
  primaryLessons: string[];
  /** Lesson IDs that are supplementary (visible but dimmed / in bonus). */
  bonusLessons: string[];
}

const CAREER_TRACKS: CareerTrack[] = [
  {
    id: 'usg_pm',
    label: 'USG Program Manager',
    shortLabel: 'USG PM',
    icon: <Building2 className="w-3.5 h-3.5" />,
    desc: 'Government-side PM managing programs, budgets, oversight, and the full acquisition lifecycle',
    primaryLessons: [
      // Foundations — all relevant
      'foundations-intro', 'foundations-players', 'foundations-contracts',
      'foundations-lifecycle', 'foundations-money', 'foundations-1', 'foundations-3',
      'foundations-4', 'foundations-2',
      // Finance — budget/oversight/EVM focus
      'finance-1', 'finance-4', 'finance-3', 'finance-2', 'finance-5', 'finance-7',
      // Contracts — source selection, admin, mods
      'contracts-2', 'contracts-3', 'contracts-6',
      // Data — metrics, EVM deep dive, IPMR
      'data-1', 'data-2', 'data-3', 'data-4',
      // Ops — risk, stakeholders, PM mistakes
      'ops-1', 'ops-2', 'ops-5',
    ],
    bonusLessons: [
      'finance-6', 'finance-8',
      'contracts-8', 'contracts-1', 'contracts-4', 'contracts-9', 'contracts-7', 'contracts-5',
      'capture-1', 'capture-3', 'capture-2', 'capture-4', 'capture-5',
      'ops-3', 'ops-4', 'ops-6', 'ops-7',
    ],
  },
  {
    id: 'contractor_pm',
    label: 'DoD Contractor PM',
    shortLabel: 'Contractor PM',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    desc: 'Industry-side PM executing contracts, managing costs, task orders, and subcontractors',
    primaryLessons: [
      // Foundations — the essentials, skip lifecycle depth and ACAT/OTA
      'foundations-intro', 'foundations-players', 'foundations-contracts', 'foundations-money',
      // Contracts — the day-to-day world of a contractor PM
      'contracts-8', 'contracts-1', 'contracts-4', 'contracts-9', 'contracts-3', 'contracts-6',
      'contracts-7', 'contracts-5',
      // Finance — cost structure, EVM, DCAA, CPAF burn rate
      'finance-2', 'finance-5', 'finance-6', 'finance-7', 'finance-8',
      // Data — metrics, EVM terms, IPMR
      'data-1', 'data-3', 'data-4',
      // Ops — risk, comms, subs, PM mistakes, what PMs actually do
      'ops-1', 'ops-2', 'ops-4', 'ops-5', 'ops-7',
    ],
    bonusLessons: [
      'foundations-lifecycle', 'foundations-1', 'foundations-3', 'foundations-4', 'foundations-2',
      'finance-1', 'finance-4', 'finance-3',
      'contracts-2',
      'data-2',
      'capture-1', 'capture-3', 'capture-2', 'capture-4', 'capture-5',
      'ops-3', 'ops-6',
    ],
  },
  {
    id: 'contracting_officer',
    label: 'Contracting Officer (1102)',
    shortLabel: '1102 / CO',
    icon: <FileText className="w-3.5 h-3.5" />,
    desc: '1102 series — source selection, contract administration, FAR/DFARS compliance',
    primaryLessons: [
      // Foundations — full picture needed
      'foundations-intro', 'foundations-players', 'foundations-contracts',
      'foundations-lifecycle', 'foundations-money', 'foundations-1', 'foundations-3',
      'foundations-4', 'foundations-2',
      // Contracts — everything, this is the CO's core domain
      'contracts-1', 'contracts-2', 'contracts-3', 'contracts-6',
      'contracts-4', 'contracts-8', 'contracts-7', 'contracts-5', 'contracts-9',
      // Finance — appropriations, cost estimating
      'finance-4', 'finance-3',
    ],
    bonusLessons: [
      'finance-1', 'finance-2', 'finance-5', 'finance-6', 'finance-7', 'finance-8',
      'data-1', 'data-2', 'data-3', 'data-4',
      'capture-1', 'capture-2', 'capture-3', 'capture-4', 'capture-5',
      'ops-1', 'ops-2', 'ops-3', 'ops-4', 'ops-5', 'ops-6', 'ops-7',
    ],
  },
  {
    id: 'capture_bd',
    label: 'Capture & BD',
    shortLabel: 'Capture / BD',
    icon: <LayoutGrid className="w-3.5 h-3.5" />,
    desc: 'Win more business — master the capture lifecycle, proposals, and source selection strategy',
    primaryLessons: [
      // Foundations — the essentials
      'foundations-intro', 'foundations-players', 'foundations-contracts',
      // Contracts — vehicles, who's buying, source selection from buyer's side
      'contracts-8', 'contracts-1', 'contracts-4', 'contracts-7', 'contracts-5', 'contracts-9',
      'contracts-2',
      // Capture — entire module is core
      'capture-1', 'capture-3', 'capture-2', 'capture-4', 'capture-5',
      // Ops — stakeholder comms matters for BD
      'ops-2',
    ],
    bonusLessons: [
      'foundations-lifecycle', 'foundations-money', 'foundations-1', 'foundations-3',
      'foundations-4', 'foundations-2',
      'finance-6', 'finance-8',
      'contracts-3', 'contracts-6',
      'data-1', 'data-2', 'data-3', 'data-4',
      'finance-1', 'finance-4', 'finance-3', 'finance-2', 'finance-5', 'finance-7',
      'ops-1', 'ops-3', 'ops-4', 'ops-5', 'ops-6', 'ops-7',
    ],
  },
];

interface SubjectGroup {
  id: SubjectGroupId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  desc: string;
  moduleIds: string[];
}

const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    id: 'acquisition_foundations',
    label: 'Acquisition Foundations',
    shortLabel: 'Foundations',
    icon: <Building2 className="w-3.5 h-3.5" />,
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

// ── Color config ─────────────────────────────────────────────────────────────
const COLORS: Record<string, { border: string; accent: string; check: string; progress: string; headerGrad: string }> = {
  navy:  { border: 'border-blue-200  dark:border-blue-800/40',  accent: 'text-blue-600  dark:text-blue-400',  check: 'text-blue-500  dark:text-blue-400',  progress: '[&>div]:bg-blue-500',  headerGrad: 'from-blue-600  to-blue-700  dark:from-blue-800  dark:to-blue-900  border-blue-700/50'  },
  gold:  { border: 'border-yellow-200 dark:border-yellow-800/40', accent: 'text-yellow-600 dark:text-yellow-400', check: 'text-yellow-500 dark:text-yellow-400', progress: '[&>div]:bg-yellow-500', headerGrad: 'from-yellow-500 to-amber-600  dark:from-yellow-800 dark:to-amber-900  border-yellow-600/50' },
  blue:  { border: 'border-cyan-200   dark:border-cyan-800/40',   accent: 'text-cyan-600   dark:text-cyan-400',   check: 'text-cyan-500   dark:text-cyan-400',   progress: '[&>div]:bg-cyan-500',   headerGrad: 'from-cyan-500   to-cyan-700   dark:from-cyan-800   dark:to-cyan-900   border-cyan-600/50'   },
  teal:  { border: 'border-teal-200   dark:border-teal-800/40',   accent: 'text-teal-600   dark:text-teal-400',   check: 'text-teal-500   dark:text-teal-400',   progress: '[&>div]:bg-teal-500',   headerGrad: 'from-teal-500   to-teal-700   dark:from-teal-800   dark:to-teal-900   border-teal-600/50'   },
  amber: { border: 'border-amber-200  dark:border-amber-800/40',  accent: 'text-amber-600  dark:text-amber-400',  check: 'text-amber-500  dark:text-amber-400',  progress: '[&>div]:bg-amber-500',  headerGrad: 'from-amber-500  to-orange-600 dark:from-amber-800  dark:to-orange-900  border-amber-600/50'  },
  slate: { border: 'border-slate-300  dark:border-slate-700/40',  accent: 'text-slate-600  dark:text-slate-300',  check: 'text-slate-400  dark:text-slate-400',  progress: '[&>div]:bg-slate-400',  headerGrad: 'from-slate-500  to-slate-700  dark:from-slate-700  dark:to-slate-900  border-slate-600/50'  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Lessons in a module that are in the primary set — preserving module order */
function getPrimaryLessons(mod: typeof modules[0], primarySet: Set<string>) {
  return mod.lessons.filter(l => primarySet.has(l.id));
}

function getModuleTrackMinutes(mod: typeof modules[0], primarySet: Set<string>): number {
  return mod.lessons
    .filter(l => primarySet.has(l.id))
    .reduce((acc, l) => acc + parseDuration(l.duration), 0);
}

// ── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({
  mod, seqNum, isFirst, progress, onSelect, onUpgrade,
  primaryLessons, // lesson IDs in this track for this module
  isCareerMode,
}: {
  mod: typeof modules[0];
  seqNum: number;
  isFirst?: boolean;
  progress: UserProgress;
  onSelect: () => void;
  onUpgrade: () => void;
  primaryLessons: string[];   // IDs for track-relevant lessons in this module
  isCareerMode: boolean;
}) {
  const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
  const lessonIds = mod.lessons.map(l => l.id);
  const progressPct = getModuleProgress(mod.id, lessonIds, progress.completedLessons);
  const c = COLORS[mod.color] || COLORS.slate;

  const totalMins = getModuleTotalMinutes(mod.id);

  // In career mode: show only primary lessons in preview (up to 5)
  // In subject mode: show first 5 lessons
  const primarySet = new Set(primaryLessons);
  const displayLessons = isCareerMode
    ? mod.lessons.filter(l => primarySet.has(l.id)).slice(0, 5)
    : mod.lessons.slice(0, 5);
  const trackMins = isCareerMode ? getModuleTrackMinutes(mod, primarySet) : totalMins;
  const trackLessonCount = isCareerMode ? primaryLessons.length : mod.lessons.length;
  const remainingInTrack = isCareerMode
    ? Math.max(0, primaryLessons.length - 5)
    : Math.max(0, mod.lessons.length - 5);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all duration-200 bg-card shadow-sm",
        c.border,
        isAccessible ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer" : "opacity-70",
        isFirst ? "ring-2 ring-primary/30" : "",
      )}
      onClick={() => isAccessible ? onSelect() : onUpgrade()}
      data-testid={`module-${mod.id}`}
    >
      {/* Gradient header */}
      <div className={cn("px-5 py-4 border-b bg-gradient-to-r", c.headerGrad)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold tabular-nums border border-white/30">
              {String(seqNum).padStart(2, '0')}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{mod.icon}</span>
                <span className="font-bold text-white text-sm">{mod.title}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] text-white/60 whitespace-nowrap">{mod.subtitle}</span>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-[11px] text-white/80 font-medium whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {isCareerMode && trackMins !== totalMins
                    ? <span>{formatDuration(trackMins)}<span className="text-white/50 font-normal"> / {formatDuration(totalMins)}</span></span>
                    : <span>{formatDuration(totalMins)}</span>
                  }
                </span>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-[11px] text-white/70 whitespace-nowrap">
                  {isCareerMode && trackLessonCount !== mod.lessons.length
                    ? <>{trackLessonCount}<span className="text-white/50"> / {mod.lessons.length}</span> lessons</>
                    : <>{mod.lessons.length} lessons</>
                  }
                </span>
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

        {/* Lesson list */}
        <div className="space-y-1 mb-4">
          {displayLessons.map(lesson => {
            const done = progress.completedLessons.has(lesson.id);
            return (
              <div key={lesson.id} className="flex items-center gap-2.5">
                {done
                  ? <CheckCircle2 className={cn("w-3.5 h-3.5 flex-shrink-0", c.check)} />
                  : <Circle className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/40" />
                }
                <span className={cn("text-xs leading-snug truncate", done ? "text-muted-foreground line-through" : "text-foreground/80")}>
                  {lesson.title}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground/50 flex-shrink-0">{lesson.duration}</span>
              </div>
            );
          })}
          {remainingInTrack > 0 && (
            <div className={cn("text-[11px] font-medium mt-1 pl-6", c.accent)}>
              + {remainingInTrack} more lesson{remainingInTrack > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Progress footer */}
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <BookOpen className={cn("w-3 h-3", c.accent)} />
              <span className="text-xs text-muted-foreground">{mod.lessons.length} lessons</span>
            </div>
            <span className={cn("text-xs font-semibold", isAccessible && progressPct > 0 ? c.accent : 'text-muted-foreground')}>
              {isAccessible ? (progressPct > 0 ? `${progressPct}% done` : 'Not started') : 'Locked'}
            </span>
          </div>
          <Progress value={isAccessible ? progressPct : 0} className={cn("h-1.5", c.progress)} />
        </div>

        {isAccessible && (
          <div className={cn("flex items-center gap-1 mt-3 text-xs font-medium", c.accent)}>
            <span>{progressPct > 0 ? 'Continue' : 'Start module'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter tab ───────────────────────────────────────────────────────────────
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

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ progress, onSelectModule, onUpgrade, username }: DashboardProps) {
  const totalLessons = getTotalLessons();
  const completedCount = progress.completedLessons.size;
  const xp = calculateXP(progress.completedLessons, progress.quizScores);
  const levelInfo = getLevel(xp);

  const [filterMode, setFilterMode] = useState<FilterMode>('career');
  const [activeCareer, setActiveCareer] = useState<CareerTrackId>('usg_pm');
  const [activeSubject, setActiveSubject] = useState<SubjectGroupId>('acquisition_foundations');
  const [bonusExpanded, setBonusExpanded] = useState(false);

  // ── Resolve which modules + lessons to show ──────────────────────────────
  const { primaryModuleOrder, bonusModuleOrder, primaryLessonSetForModule } = (() => {
    if (filterMode === 'career') {
      const track = CAREER_TRACKS.find(t => t.id === activeCareer)!;
      const primarySet = new Set(track.primaryLessons);
      const bonusSet = new Set(track.bonusLessons);

      // Order modules by which has primary lessons, preserving natural module order
      const moduleOrder = ['foundations', 'finance', 'contracts', 'data', 'capture', 'ops'];

      // A module is "primary" if it has at least 1 primary lesson
      const primary = moduleOrder
        .map(id => modules.find(m => m.id === id))
        .filter(Boolean)
        .filter(m => m!.lessons.some(l => primarySet.has(l.id))) as typeof modules;

      // A module is "bonus" if it has bonus lessons but NO primary lessons in this track
      const bonus = moduleOrder
        .map(id => modules.find(m => m.id === id))
        .filter(Boolean)
        .filter(m => !m!.lessons.some(l => primarySet.has(l.id))) as typeof modules;

      // For each module, which lessons are in the primary set
      const lessonMap: Record<string, string[]> = {};
      for (const mod of [...primary, ...bonus]) {
        lessonMap[mod.id] = mod.lessons.filter(l => primarySet.has(l.id)).map(l => l.id);
      }

      return { primaryModuleOrder: primary, bonusModuleOrder: bonus, primaryLessonSetForModule: lessonMap };
    } else {
      // Subject mode: show group's modules, rest as bonus
      const group = SUBJECT_GROUPS.find(g => g.id === activeSubject)!;
      const primary = group.moduleIds.map(id => modules.find(m => m.id === id)).filter(Boolean) as typeof modules;
      const bonus = modules.filter(m => !group.moduleIds.includes(m.id));
      const lessonMap: Record<string, string[]> = {};
      for (const mod of modules) {
        lessonMap[mod.id] = mod.lessons.map(l => l.id); // show all
      }
      return { primaryModuleOrder: primary, bonusModuleOrder: bonus, primaryLessonSetForModule: lessonMap };
    }
  })();

  // Next incomplete lesson (primary modules first)
  const nextLesson = (() => {
    for (const mod of [...primaryModuleOrder, ...bonusModuleOrder]) {
      const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
      if (!isAccessible) continue;
      for (const lesson of mod.lessons) {
        if (!progress.completedLessons.has(lesson.id)) return { lesson, module: mod };
      }
    }
    return null;
  })();

  const statsStrip = [
    { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, value: completedCount, label: 'Lessons done', sub: `of ${totalLessons} total` },
    { icon: <Zap className="w-5 h-5 text-yellow-500" />, value: xp, label: 'XP earned', sub: `Lv ${levelInfo.level} · ${levelInfo.title}` },
    { icon: <Target className="w-5 h-5 text-primary" />, value: progress.isPremium ? modules.length : FREE_MODULES.length, label: 'Modules unlocked', sub: `of ${modules.length} available` },
    { icon: <TrendingUp className="w-5 h-5 text-cyan-500" />, value: `${Math.round((completedCount / totalLessons) * 100)}%`, label: 'Overall progress', sub: `${totalLessons - completedCount} remaining` },
  ];

  const activeTrack = CAREER_TRACKS.find(t => t.id === activeCareer);
  const activeGroup = SUBJECT_GROUPS.find(g => g.id === activeSubject);
  const activeFilterDesc = filterMode === 'career' ? activeTrack!.desc : activeGroup!.desc;
  const activeFilterLabel = filterMode === 'career' ? activeTrack!.label + ' Path' : activeGroup!.label;

  return (
    <div className="space-y-8">

      {/* Welcome */}
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

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsStrip.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3.5 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-2">{s.icon}<span className="text-xl font-bold tabular-nums">{s.value}</span></div>
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

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Mode context + toggle on one row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">View by</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/40 rounded-xl p-1">
            <FilterTab active={filterMode === 'career'} onClick={() => setFilterMode('career')}>
              Career Path
            </FilterTab>
            <FilterTab active={filterMode === 'subject'} onClick={() => setFilterMode('subject')}>
              Subject Matter
            </FilterTab>
          </div>
          {/* Context hint */}
          <p className="text-[11px] text-muted-foreground sm:ml-1">
            {filterMode === 'career'
              ? <><span className="font-semibold text-foreground/70">Career Path</span> — shows only the lessons most relevant to your role. Pick your track below to customize the order and lesson list.</>              
              : <><span className="font-semibold text-foreground/70">Subject Matter</span> — browse all modules grouped by topic. Best if you want to study a specific area regardless of career role.</>
            }
          </p>
        </div>

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
                {track.icon}{track.shortLabel}
              </button>
            ))}
          </div>
        )}

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
                {group.icon}{group.shortLabel}
              </button>
            ))}
          </div>
        )}

        {/* Active track/group description */}
        <p className="text-[11px] text-muted-foreground pl-0.5">
          {filterMode === 'career'
            ? CAREER_TRACKS.find(t => t.id === activeCareer)!.desc
            : SUBJECT_GROUPS.find(g => g.id === activeSubject)!.desc
          }
        </p>
      </div>

      {/* ── Primary Modules ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">{activeFilterLabel}</h2>
          <span className="text-xs text-muted-foreground">
            {primaryModuleOrder.length} module{primaryModuleOrder.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {primaryModuleOrder.map((mod, i) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              seqNum={i + 1}
              isFirst={i === 0}
              progress={progress}
              onSelect={() => onSelectModule(mod.id)}
              onUpgrade={onUpgrade}
              primaryLessons={primaryLessonSetForModule[mod.id] ?? []}
              isCareerMode={filterMode === 'career'}
            />
          ))}
        </div>
      </div>

      {/* ── Bonus Modules ─────────────────────────────────────────────────── */}
      {bonusModuleOrder.length > 0 && (
        <div>
          <button onClick={() => setBonusExpanded(e => !e)} className="w-full flex items-center gap-3 group mb-1">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Beaker className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {filterMode === 'career' ? 'Bonus Modules' : 'Other Modules'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {bonusModuleOrder.length} module{bonusModuleOrder.length !== 1 ? 's' : ''} —{' '}
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
              {bonusModuleOrder.map((mod, i) => (
                <ModuleCard
                  key={mod.id}
                  mod={mod}
                  seqNum={primaryModuleOrder.length + i + 1}
                  progress={progress}
                  onSelect={() => onSelectModule(mod.id)}
                  onUpgrade={onUpgrade}
                  primaryLessons={primaryLessonSetForModule[mod.id] ?? mod.lessons.map(l => l.id)}
                  isCareerMode={filterMode === 'career'}
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
