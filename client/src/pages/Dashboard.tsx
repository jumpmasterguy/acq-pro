import { useState, useEffect, useRef, useMemo } from "react";
import { modules, getTotalLessons, getModuleTotalMinutes, formatDuration, parseDuration } from "@/lib/curriculum";
import { getModuleTheme, getModuleFamilyTheme, getModuleFamily, FAMILY_LABEL } from "@/lib/moduleTheme";
import { formatClps, totalClps, moduleClps } from "@shared/moduleClps";
import { getModuleProgress, getLevel, FREE_MODULES, FREE_PREVIEW_LESSONS } from "@/lib/progress";
import type { UserProgress } from "@/lib/progress";
import type { UserProfile } from "@/pages/AuthPage";
import {
  Award, Lock, ChevronRight, Zap,
  ChevronDown, ChevronUp, Beaker,
  BookOpen, CheckCircle2, Circle, Target, TrendingUp, Clock,
  Briefcase, Building2, FileText, LayoutGrid, Filter, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { isNativeApp } from "@/lib/platform";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHome } from "@/components/mobile/MobileHome";
import { getActiveTrack } from "@/lib/careerTracks";
import { DailyChallengeSheet } from "@/components/mobile/DailyChallengeSheet";
import { WeeklyBrief } from "@/components/WeeklyBrief";

interface DashboardProps {
  progress: UserProgress;
  onSelectModule: (moduleId: string, activeCareer?: string) => void;
  onSelectLesson: (lessonId: string) => void;
  onUpgrade: () => void;
  userProfile?: UserProfile | null;
  username?: string;
  onEditProfile?: () => void;
  /** Opens My Account — the only place the career path can be changed now. */
  onOpenAccount?: () => void;
  isAdmin?: boolean;
  /** Mirrors this page's Burn Rate (streak) numbers up to the persistent sidebar badge. */
  onStreakUpdate?: (streak: { currentStreak: number; longestStreak: number }) => void;
  // ── Mobile Home ───────────────────────────────────────────────────────────
  // Below `md` this page renders MobileHome instead. These are the extra bits
  // that layout needs and the desktop one doesn't.
  firstName?: string | null;
  lastName?: string | null;
  /** Last day with activity — drives the week strip on the streak card. */
  lastStreakDate?: string | null;
  /** Learn tab target, for the carousel's "See all →". */
  onOpenModules?: () => void;
  /** Fired when a brief awards XP, so App can show it before the next reload. */
  onBriefXpEarned?: (xpEarned: number) => void;
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
      'foundations-1', 'foundations-3', 'foundations-5',
      'foundations-6', 'foundations-9', 'foundations-2', 'foundations-7',
      'foundations-8', 'foundations-4',
      // Finance — budget/oversight/EVM focus
      'finance-1', 'finance-4', 'finance-3', 'finance-2', 'finance-5', 'finance-7',
      // Contracts — source selection, admin, mods
      'contracts-2', 'contracts-3', 'contracts-6',
      // Data — metrics, EVM deep dive, IPMR
      'data-1', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7', 'data-8',
      // Ops — risk, stakeholders, PM mistakes
      'ops-1', 'ops-2', 'ops-5',
      'preaward-1', 'preaward-2', 'preaward-3', 'preaward-4', 'preaward-5', 'preaward-6', 'preaward-7', 'preaward-8', 'preaward-9', 'preaward-10', 'lifecycle-1', 'lifecycle-2', 'lifecycle-3', 'lifecycle-4', 'lifecycle-5', 'lifecycle-6', 'lifecycle-7', 'lifecycle-8',
    ],
    bonusLessons: [
      'history-1', 'history-2', 'history-3', 'history-4', 'history-5', 'history-6', 'history-7',
      'veteran-1', 'veteran-2', 'veteran-3', 'veteran-4', 'veteran-5', 'veteran-6', 'veteran-7',
      'contracts-10', 'contracts-11', 'contracts-12', 'contracts-13',
      'onramp-1', 'onramp-2', 'onramp-3', 'onramp-4', 'onramp-5', 'onramp-6', 'onramp-7', 'onramp-8',
      'finance-6', 'finance-8', 'business-1', 'business-2', 'business-3', 'business-4', 'business-5', 'business-6', 'business-7', 'business-8', 'business-9', 'business-10', 'smallbiz-1', 'smallbiz-2', 'smallbiz-3', 'smallbiz-4', 'smallbiz-5', 'smallbiz-6', 'smallbiz-7', 'smallbiz-8', 'smallbiz-9', 'smallbiz-10', 'compliance-1', 'compliance-2', 'compliance-3', 'compliance-4', 'compliance-5', 'compliance-6', 'compliance-7', 'compliance-8', 'compliance-9', 'compliance-10',
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
      'onramp-1', 'onramp-2', 'onramp-3', 'onramp-4', 'onramp-5', 'onramp-6', 'onramp-7', 'onramp-8',
      // Foundations — the essentials, skip lifecycle depth and ACAT/OTA
      'foundations-1', 'foundations-3', 'foundations-5', 'foundations-9',
      // Contracts — the day-to-day world of a contractor PM
      'contracts-8', 'contracts-1', 'contracts-4', 'contracts-9', 'contracts-3', 'contracts-6',
      'contracts-7', 'contracts-5',
      // Finance — cost structure, EVM, DCAA, CPAF burn rate
      'finance-2', 'finance-5', 'finance-6', 'finance-7', 'finance-8', 'business-1', 'business-2', 'business-3', 'business-4', 'business-5', 'business-6', 'business-7', 'business-8', 'business-9', 'business-10', 'smallbiz-1', 'smallbiz-2', 'smallbiz-3', 'smallbiz-4', 'smallbiz-5', 'smallbiz-6', 'smallbiz-7', 'smallbiz-8', 'smallbiz-9', 'smallbiz-10', 'compliance-1', 'compliance-2', 'compliance-3', 'compliance-4', 'compliance-5', 'compliance-6', 'compliance-7', 'compliance-8', 'compliance-9', 'compliance-10', 'preaward-1', 'preaward-2', 'preaward-3', 'preaward-4', 'preaward-5', 'preaward-6', 'preaward-7', 'preaward-8', 'preaward-9', 'preaward-10', 'lifecycle-1', 'lifecycle-2', 'lifecycle-3', 'lifecycle-4', 'lifecycle-5', 'lifecycle-6', 'lifecycle-7', 'lifecycle-8',
      // Data — metrics, EVM terms, IPMR
      'data-1', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7',
      // Ops — risk, comms, subs, PM mistakes, what PMs actually do
      'ops-1', 'ops-2', 'ops-4', 'ops-5', 'ops-7',
    ],
    bonusLessons: [
      'history-1', 'history-2', 'history-3', 'history-4', 'history-5', 'history-6', 'history-7',
      'veteran-1', 'veteran-2', 'veteran-3', 'veteran-4', 'veteran-5', 'veteran-6', 'veteran-7',
      'contracts-13',
      'foundations-6', 'foundations-2', 'foundations-7', 'foundations-8', 'foundations-4',
      'finance-1', 'finance-4', 'finance-3',
      'contracts-2',
      'data-2', 'data-8',
      'capture-1', 'capture-3', 'capture-2', 'capture-4', 'capture-5',
      'ops-3', 'ops-6',
    ],
  },
  {
    id: 'contracting_officer',
    label: 'Contracting Specialist / KO',
    shortLabel: 'KO / Specialist',
    icon: <FileText className="w-3.5 h-3.5" />,
    desc: 'Contracting Specialist or KO — source selection, contract administration, FAR/DFARS (the government contracting rulebooks) compliance',
    primaryLessons: [
      // Foundations — full picture needed
      'foundations-1', 'foundations-3', 'foundations-5',
      'foundations-6', 'foundations-9', 'foundations-2', 'foundations-7',
      'foundations-8', 'foundations-4',
      // Contracts — everything, this is the CO's core domain
      'contracts-1', 'contracts-2', 'contracts-3', 'contracts-6',
      'contracts-4', 'contracts-8', 'contracts-7', 'contracts-5', 'contracts-9',
      // Finance — appropriations, cost estimating
      'finance-4', 'finance-3',
      'smallbiz-1', 'smallbiz-2', 'smallbiz-3', 'smallbiz-4', 'smallbiz-5', 'smallbiz-6', 'smallbiz-7', 'smallbiz-8', 'smallbiz-9', 'smallbiz-10', 'compliance-1', 'compliance-2', 'compliance-3', 'compliance-4', 'compliance-5', 'compliance-6', 'compliance-7', 'compliance-8', 'compliance-9', 'compliance-10', 'preaward-1', 'preaward-2', 'preaward-3', 'preaward-4', 'preaward-5', 'preaward-6', 'preaward-7', 'preaward-8', 'preaward-9', 'preaward-10',
    ],
    bonusLessons: [
      'history-1', 'history-2', 'history-3', 'history-4', 'history-5', 'history-6', 'history-7',
      'veteran-1', 'veteran-2', 'veteran-3', 'veteran-4', 'veteran-5', 'veteran-6', 'veteran-7',
      'contracts-10', 'contracts-11', 'contracts-12', 'contracts-13',
      'onramp-1', 'onramp-2', 'onramp-3', 'onramp-4', 'onramp-5', 'onramp-6', 'onramp-7', 'onramp-8',
      'lifecycle-1', 'lifecycle-2', 'lifecycle-3', 'lifecycle-4', 'lifecycle-5', 'lifecycle-6', 'lifecycle-7', 'lifecycle-8',
      'finance-1', 'finance-2', 'finance-5', 'finance-6', 'finance-7', 'finance-8', 'business-1', 'business-2', 'business-3', 'business-4', 'business-5', 'business-6', 'business-7', 'business-8', 'business-9', 'business-10',
      'data-1', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7', 'data-8',
      'capture-1', 'capture-2', 'capture-3', 'capture-4', 'capture-5',
      'ops-1', 'ops-2', 'ops-3', 'ops-4', 'ops-5', 'ops-6', 'ops-7',
    ],
  },
  {
    id: 'capture_bd',
    label: 'Capture & Business Development (BD)',
    shortLabel: 'Capture / BD',
    icon: <LayoutGrid className="w-3.5 h-3.5" />,
    desc: 'Win more business — master the capture lifecycle, proposals, and source selection strategy',
    primaryLessons: [
      'onramp-1', 'onramp-2', 'onramp-3', 'onramp-4', 'onramp-5', 'onramp-6', 'onramp-7', 'onramp-8',
      // Foundations — the essentials
      'foundations-1', 'foundations-3', 'foundations-5',
      // Contracts — vehicles, who's buying, source selection from buyer's side
      'contracts-8', 'contracts-1', 'contracts-4', 'contracts-7', 'contracts-5', 'contracts-9',
      'contracts-2',
      // Capture — entire module is core
      'capture-1', 'capture-3', 'capture-2', 'capture-4', 'capture-5',
      // Ops — stakeholder comms matters for BD
      'ops-2',
      'smallbiz-1', 'smallbiz-2', 'smallbiz-3', 'smallbiz-4', 'smallbiz-5', 'smallbiz-6', 'smallbiz-7', 'smallbiz-8', 'smallbiz-9', 'smallbiz-10', 'compliance-1', 'compliance-2', 'compliance-3', 'compliance-4', 'compliance-5', 'compliance-6', 'compliance-7', 'compliance-8', 'compliance-9', 'compliance-10', 'preaward-1', 'preaward-2', 'preaward-3', 'preaward-4', 'preaward-5', 'preaward-6', 'preaward-7', 'preaward-8', 'preaward-9', 'preaward-10',
    ],
    bonusLessons: [
      'history-1', 'history-2', 'history-3', 'history-4', 'history-5', 'history-6', 'history-7',
      'veteran-1', 'veteran-2', 'veteran-3', 'veteran-4', 'veteran-5', 'veteran-6', 'veteran-7',
      'contracts-10', 'contracts-11', 'contracts-12', 'contracts-13',
      'lifecycle-1', 'lifecycle-2', 'lifecycle-3', 'lifecycle-4', 'lifecycle-5', 'lifecycle-6', 'lifecycle-7', 'lifecycle-8',
      'foundations-6', 'foundations-9', 'foundations-2', 'foundations-7',
      'foundations-8', 'foundations-4',
      'finance-6', 'finance-8', 'business-1', 'business-2', 'business-3', 'business-4', 'business-5', 'business-6', 'business-7', 'business-8', 'business-9', 'business-10',
      'contracts-3', 'contracts-6',
      'data-1', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7', 'data-8',
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
    desc: 'Lifecycle, key players, contract basics, and the government pre-award process — the framework everything else builds on',
    moduleIds: ['foundations', 'preaward', 'veteran', 'history'],
  },
  {
    id: 'finance_contracts',
    label: 'Finance & Contracting',
    shortLabel: 'Finance + Contracts',
    icon: <FileText className="w-3.5 h-3.5" />,
    desc: 'Appropriations, EVM (Earned Value Management), the business side of contracting, contract types, source selection, COR (Contracting Officer\'s Rep), and modifications',
    moduleIds: ['finance', 'business', 'contracts', 'compliance'],
  },
  {
    id: 'capture_analytics',
    label: 'Capture, BD & Analytics',
    shortLabel: 'Capture + Data',
    icon: <Target className="w-3.5 h-3.5" />,
    desc: 'Winning work and measuring it — proposals, pipelines, small business set-asides, dashboards, and KPIs (Key Performance Indicators)',
    moduleIds: ['capture', 'smallbiz', 'onramp', 'data'],
  },
  {
    id: 'pm_operations',
    label: 'PM Operations & Leadership',
    shortLabel: 'PM Operations',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    desc: 'Risk management, stakeholder communication, career roadmap, and subcontractor oversight',
    moduleIds: ['operations', 'lifecycle'],
  },
];

// ── Color config ─────────────────────────────────────────────────────────────
// Shared with ModulePage.tsx (client/src/lib/moduleTheme.ts) so a module's
// color is identical on the dashboard card and its detail page.

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
  const theme = getModuleFamilyTheme(mod.id);
  const familyLabel = FAMILY_LABEL[getModuleFamily(mod.id)];
  const c = { border: theme.border, accent: theme.text, check: theme.text, progress: theme.progressBar, headerGrad: theme.headerGrad, bgTint: theme.bgTint, borderTint: theme.borderTint };

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
      style={{ borderTop: `3px solid ${theme.hex}` }}
      onClick={() => isAccessible ? onSelect() : onUpgrade()}
      data-testid={`module-${mod.id}`}
    >
      {/* Header. The family colour lives in a thin top edge (on the card) and a
          small icon tile, rather than a full bleed bar: with 11 modules on a
          page, saturated headers stack into a wall of colour and stop reading
          as identity. The module's own number used to appear twice, once in
          the circle and again inside mod.subtitle, so the subtitle is dropped
          and the family label takes its place. */}
      <div className="px-5 py-4 border-b border-border/70">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl text-lg flex-shrink-0 border", c.bgTint, c.borderTint)}>
              {mod.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tabular-nums text-muted-foreground/70">{String(seqNum).padStart(2, '0')}</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", c.accent)}>{familyLabel}</span>
              </div>
              <div className="font-bold text-sm mt-0.5 truncate">{mod.title}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-[11px] text-muted-foreground">
                <span className="whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {isCareerMode && trackMins !== totalMins
                    ? <span>{formatDuration(trackMins)}<span className="text-muted-foreground/60"> / {formatDuration(totalMins)}</span></span>
                    : <span>{formatDuration(totalMins)}</span>
                  }
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="whitespace-nowrap">
                  {isCareerMode && trackLessonCount !== mod.lessons.length
                    ? <>{trackLessonCount}<span className="text-muted-foreground/60"> / {mod.lessons.length}</span> lessons</>
                    : <>{mod.lessons.length} lessons</>
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isFirst && (
              <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
                Start Here
              </span>
            )}
            {mod.free && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Free
              </span>
            )}
            {!isAccessible && <Lock className="w-4 h-4 text-muted-foreground/60" />}
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
export default function Dashboard({ progress, onSelectModule, onSelectLesson, onUpgrade, username, isAdmin, onStreakUpdate, onBriefXpEarned, firstName, lastName, lastStreakDate, onOpenModules, onOpenAccount }: DashboardProps) {
  const totalLessons = getTotalLessons();
  const completedCount = progress.completedLessons.size;
  // Use progress.xp (computed once in App.tsx) rather than recalculating
  // here — this local recompute used to leave out Daily Challenge XP
  // entirely, so it never showed up in this page's "XP earned" stat.
  const xp = progress.xp;
  const levelInfo = getLevel(xp);

  // Streak + daily challenge state
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, alreadyCompleted: false, date: '' });
  const [filterMode, setFilterMode] = useState<FilterMode>(() => {
    try { return (localStorage.getItem('acq_filter_mode') as FilterMode) || 'career'; } catch { return 'career'; }
  });
  // Read-only here: the career path is chosen on the My Account page.
  const [activeCareer] = useState<CareerTrackId>(() => {
    try { return (localStorage.getItem('acq_active_career') as CareerTrackId) || 'contractor_pm'; } catch { return 'contractor_pm'; }
  });
  const [activeSubject, setActiveSubject] = useState<SubjectGroupId>('acquisition_foundations');
  const [bonusExpanded, setBonusExpanded] = useState(false);
  const [adminStats, setAdminStats] = useState<{ totalUsers: number; proUsers: number; freeUsers: number } | null>(null);
  const [startHereDismissed, setStartHereDismissed] = useState(() => {
    try { return localStorage.getItem('acq_start_here_dismissed') === '1'; } catch { return false; }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  // Search starts collapsed so the fold belongs to Continue, not to an empty input.
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [challenge, setChallenge] = useState<{ questions: any[], date: string } | null>(null);
  const isMobile = useIsMobile();
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, number>>({});
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const [challengeResult, setChallengeResult] = useState<{ score: number, xpEarned: number, message: string } | null>(null);

  // Persist filter choices to localStorage
  useEffect(() => {
    try { localStorage.setItem('acq_filter_mode', filterMode); } catch {}
  }, [filterMode]);


  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search index — flat list of all lessons with module context
  const searchIndex = useMemo(() => {
    const results: { lessonId: string; lessonTitle: string; moduleId: string; moduleTitle: string; moduleIcon: string; description: string; keyTerms: string[] }[] = [];
    modules.forEach(mod => {
      mod.lessons.forEach(lesson => {
        results.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleId: mod.id,
          moduleTitle: mod.title,
          moduleIcon: mod.icon,
          description: lesson.description ?? '',
          keyTerms: (lesson.keyTerms ?? []).map((t: any) => typeof t === 'string' ? t : t.term ?? ''),
        });
      });
    });
    return results;
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return searchIndex.filter(item =>
      item.lessonTitle.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keyTerms.some(t => t.toLowerCase().includes(q)) ||
      item.moduleTitle.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, searchIndex]);

  useEffect(() => {
    if (!isAdmin) return;
    apiRequest('GET', '/api/admin/growth')
      .then(r => r.json())
      .then(data => { if (data.totalUsers !== undefined) setAdminStats(data); })
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    apiRequest('GET', '/api/daily-challenge')
      .then(r => r.json())
      .then(data => {
        setStreak({ currentStreak: data.currentStreak, longestStreak: data.longestStreak, alreadyCompleted: data.alreadyCompleted, date: data.date });
        onStreakUpdate?.({ currentStreak: data.currentStreak, longestStreak: data.longestStreak });
        setChallenge({ questions: data.questions, date: data.date });
        if (data.alreadyCompleted) setChallengeSubmitted(true);
        // Today's score, so a reload still shows "complete · 4/5" rather than
        // just "complete" (see the todayResult note in GET /api/daily-challenge).
        if (data.todayResult) setChallengeResult({ score: data.todayResult.score, xpEarned: data.todayResult.xpEarned, message: '' });
      })
      .catch(() => {});
  }, []);

  async function submitChallenge() {
    if (!challenge) return;
    const score = challenge.questions.filter((q: any) => challengeAnswers[q.id] === q.correct).length;
    try {
      const res = await apiRequest('POST', '/api/daily-challenge/complete', { score });
      const data = await res.json();
      setChallengeResult(data);
      setChallengeSubmitted(true);
      setStreak(s => ({ ...s, currentStreak: data.currentStreak, longestStreak: data.longestStreak }));
      onStreakUpdate?.({ currentStreak: data.currentStreak, longestStreak: data.longestStreak });
    } catch {}
  }



  // ── Resolve which modules + lessons to show ──────────────────────────────
  const resolvedModuleLayout = useMemo(() => {
    if (filterMode === 'career') {
      const careerTrack = CAREER_TRACKS.find(careerT => careerT.id === activeCareer)!;
      const careerPrimarySet = new Set(careerTrack.primaryLessons);
      new Set(careerTrack.bonusLessons);
      const careerModuleOrder = ['foundations', 'finance', 'business', 'contracts', 'data', 'preaward', 'capture', 'smallbiz', 'onramp', 'compliance', 'lifecycle', 'veteran', 'history', 'operations'];
      const careerPrimary = careerModuleOrder
        .map(careerModId => modules.find(careerMod => careerMod.id === careerModId))
        .filter(Boolean)
        .filter(careerMod => careerMod!.lessons.some(careerL => careerPrimarySet.has(careerL.id))) as typeof modules;
      const careerBonus = careerModuleOrder
        .map(careerModId => modules.find(careerMod => careerMod.id === careerModId))
        .filter(Boolean)
        .filter(careerMod => !careerMod!.lessons.some(careerL => careerPrimarySet.has(careerL.id))) as typeof modules;
      const careerLessonMap: Record<string, string[]> = {};
      for (const careerMapMod of [...careerPrimary, ...careerBonus]) {
        careerLessonMap[careerMapMod.id] = careerMapMod.lessons.filter(careerMapL => careerPrimarySet.has(careerMapL.id)).map(careerMapL => careerMapL.id);
      }
      return { primaryModuleOrder: careerPrimary, bonusModuleOrder: careerBonus, primaryLessonSetForModule: careerLessonMap };
    } else {
      const subjectGroup = SUBJECT_GROUPS.find(subjectG => subjectG.id === activeSubject)!;
      const subjectPrimary = subjectGroup.moduleIds.map(subjectModId => modules.find(subjectMod => subjectMod.id === subjectModId)).filter(Boolean) as typeof modules;
      const subjectBonus = modules.filter(subjectMod => !subjectGroup.moduleIds.includes(subjectMod.id));
      const subjectLessonMap: Record<string, string[]> = {};
      for (const subjectMapMod of modules) {
        subjectLessonMap[subjectMapMod.id] = subjectMapMod.lessons.map(subjectMapL => subjectMapL.id);
      }
      return { primaryModuleOrder: subjectPrimary, bonusModuleOrder: subjectBonus, primaryLessonSetForModule: subjectLessonMap };
    }
  }, [filterMode, activeCareer, activeSubject]);
  const { primaryModuleOrder, bonusModuleOrder, primaryLessonSetForModule } = resolvedModuleLayout;

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
    ...(isAdmin && adminStats ? [
      { icon: <Users className="w-5 h-5 text-violet-500" />, value: adminStats.totalUsers, label: 'Total signups', sub: `${adminStats.proUsers} paid · ${adminStats.freeUsers} free` },
    ] : []),
  ];

  // Hoisted so the mobile branch can render it too. Step 6 of the mobile
  // build replaces this with the bottom-sheet version.
  const challengeModal = (
    challengeActive && challenge && !challengeSubmitted && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setChallengeActive(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Fixed header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="font-bold text-lg">⚡ Daily Challenge</h2>
                <p className="text-xs text-muted-foreground">{challenge.date} · 5 questions</p>
              </div>
              <button onClick={() => setChallengeActive(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>
            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
            <div className="space-y-5">
              {challenge.questions.map((q: any, qi: number) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-semibold">{qi + 1}. {q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt: string, oi: number) => (
                      <button
                        key={oi}
                        onClick={() => setChallengeAnswers(a => ({ ...a, [q.id]: oi }))}
                        className={cn(
                          "w-full text-left text-xs px-3 py-2 rounded-lg border transition-all",
                          challengeAnswers[q.id] === oi
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-5"
              disabled={Object.keys(challengeAnswers).length < challenge.questions.length}
              onClick={submitChallenge}
            >
              Submit Answers
            </Button>
            </div>{/* end scrollable body */}
            </div>{/* end scrollable wrapper */}
        </div>
    )
  );

  // ── Mobile Home ───────────────────────────────────────────────────────────
  if (isMobile) {
    const challengeDone = challengeSubmitted || streak.alreadyCompleted;
    return (
      <>
        <MobileHome
          firstName={(firstName || username?.split(' ')[0] || 'there') as string}
          lastName={lastName ?? undefined}
          xp={progress.xp}
          completedLessons={progress.completedLessons}
          isPremium={progress.isPremium}
          streak={{
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            // lastStreakDate comes from the auth payload, which isn't refetched
            // after a submission — so once today's challenge is done, treat
            // today as the last active day and today's circle lights up.
            lastStreakDate: challengeDone
              ? new Date().toISOString().slice(0, 10)
              : lastStreakDate ?? null,
          }}
          challenge={{
            done: challengeDone,
            score: challengeResult?.score,
            xpEarned: challengeResult?.xpEarned,
          }}
          track={getActiveTrack()}
          onOpenAccount={() => onOpenAccount?.()}
          onOpenModule={(id) => onSelectModule(id)}
          onOpenLesson={onSelectLesson}
          onOpenModules={() => onOpenModules?.()}
          onOpenChallenge={() => setChallengeActive(true)}
          onUpgrade={onUpgrade}
        />
        {challengeActive && challenge && !challengeSubmitted && (
          <DailyChallengeSheet
            date={challenge.date}
            questions={challenge.questions}
            answers={challengeAnswers}
            onAnswer={(id, oi) => setChallengeAnswers(prev => ({ ...prev, [id]: oi }))}
            onSubmit={async () => { await submitChallenge(); setChallengeActive(false); }}
            onClose={() => setChallengeActive(false)}
          />
        )}
      </>
    );
  }

  const activeTrack = CAREER_TRACKS.find(t => t.id === activeCareer);
  const activeGroup = SUBJECT_GROUPS.find(g => g.id === activeSubject);
  const activeFilterDesc = filterMode === 'career' ? activeTrack!.desc : activeGroup!.desc;
  const activeFilterLabel = filterMode === 'career' ? activeTrack!.label + ' Path' : activeGroup!.label;

  return (
    <div className="space-y-8">

      {/* Welcome */}
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

      {/* Search bar */}
      <div ref={searchRef} className="relative">
        {!searchOpen && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border bg-card/60 rounded-full px-3.5 py-1.5 transition-colors"
            aria-label="Search lessons and terms"
            data-testid="search-open"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span>Search lessons and terms</span>
          </button>
        )}
        <div className={`${searchOpen ? 'flex' : 'hidden'} items-center gap-3 bg-card border rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
          searchFocused ? 'border-primary/60 shadow-md' : 'border-border'
        }`}>
          <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search lessons, terms, topics... e.g. wrap rate, EVM, IDIQ"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            autoFocus={searchOpen}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchFocused(false); setSearchOpen(false); }} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {searchFocused && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden z-50">
            {searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No lessons found for "{searchQuery}"</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different term or topic</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {searchResults.map((result, ri) => {
                  const isAccessible = FREE_MODULES.includes(result.moduleId) || progress.isPremium;
                  const isPreview = FREE_PREVIEW_LESSONS.includes(result.lessonId);
                  const canAccess = isAccessible || isPreview;
                  // Family colour, so all 14 modules are covered rather than 6.
                  const accentColor = getModuleFamilyTheme(result.moduleId).hex;
                  // Highlight matching terms
                  const matchedTerms = result.keyTerms.filter(t =>
                    t.toLowerCase().includes(searchQuery.toLowerCase())
                  ).slice(0, 3);

                  return (
                    <button
                      key={result.lessonId}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors group"
                      onClick={() => {
                        if (!canAccess) { onUpgrade(); return; }
                        onSelectLesson(result.lessonId);
                        setSearchQuery('');
                        setSearchFocused(false);
                      }}
                    >
                      {/* Module icon dot */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: accentColor + '22' }}>
                        {result.moduleIcon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{result.lessonTitle}</p>
                          {!canAccess && <span className="text-[10px] text-muted-foreground flex-shrink-0">🔒</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium" style={{ color: accentColor }}>{result.moduleTitle}</span>
                          {matchedTerms.length > 0 && (
                            <>
                              <span className="text-muted-foreground/40 text-[10px]">·</span>
                              <span className="text-[11px] text-muted-foreground truncate">{matchedTerms.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <svg className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="px-4 py-2 bg-muted/30 border-t border-border">
              <p className="text-[11px] text-muted-foreground">{searchResults.length > 0 ? `${searchResults.length} lesson${searchResults.length !== 1 ? 's' : ''} found` : 'No results'} · Searches titles, descriptions, and key terms</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress hero */}
      {(() => {
        const overallPct = Math.round((completedCount / totalLessons) * 100);
        const ringSize = 76;
        const strokeWidth = 7;
        const radius = (ringSize - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (overallPct / 100) * circumference;
        const adminStat = statsStrip.find(s => s.label === 'Total signups');
        return (
          <div className="space-y-3">
            {/* A brand new account has nothing to report, and a scoreboard reading
                0%, 0 XP, 0 lessons tells a paying customer their first
                impression is failure. Until the first lesson lands, the same
                space looks forward instead: what is available, not what is
                missing. */}
            {completedCount === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-5 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-bold">Your path ahead</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Finish Module 1 and your first Certificate of Completion is worth {formatClps(moduleClps('foundations'))} CLPs.
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div>
                      <div className="text-lg font-bold tabular-nums leading-none">{totalLessons}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Lessons ahead</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold tabular-nums leading-none">{formatClps(totalClps())}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">CLPs available</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold tabular-nums leading-none">{progress.isPremium ? modules.length : FREE_MODULES.length}<span className="text-xs text-muted-foreground font-normal">/{modules.length}</span></div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Modules unlocked</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 shadow-lg" style={{ background: 'linear-gradient(135deg, #0d2137 0%, #123047 55%, #0a1b2d 100%)' }}>
              {/* Decorative glow */}
              <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 bottom-0 w-40 h-40 rounded-full bg-[#f5c842]/10 blur-3xl pointer-events-none" />

              <div className="relative flex items-center justify-between gap-6 flex-wrap">
                {/* Hero: overall progress ring */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
                    <svg width={ringSize} height={ringSize} className="-rotate-90">
                      <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" strokeWidth={strokeWidth} stroke="rgba(255,255,255,0.14)" />
                      <circle
                        cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" strokeWidth={strokeWidth}
                        strokeLinecap="round" stroke="#f5c842" className="transition-all duration-700"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold tabular-nums text-white">{overallPct}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Overall progress</div>
                    <div className="text-xs text-white/60 mt-0.5">{totalLessons - completedCount} lessons remaining</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#f5c842]/20 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-[#f5c842]" />
                      </div>
                      <span className="text-xs font-semibold text-white">Lv {levelInfo.level} · {levelInfo.title}</span>
                      <span className="text-xs text-white/60">· {xp} XP</span>
                    </div>
                  </div>
                </div>

                {/* Supporting stats */}
                <div className="relative flex items-center gap-5 sm:gap-7">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-primary" style={{ color: '#4ecdc4' }} />
                    <div>
                      <div className="text-lg font-bold tabular-nums leading-none text-white">{completedCount}<span className="text-xs text-white/50 font-normal">/{totalLessons}</span></div>
                      <div className="text-[11px] text-white/60 mt-0.5">Lessons done</div>
                    </div>
                  </div>
                  <div className="h-9 w-px bg-white/15" />
                  <div className="flex items-center gap-2.5">
                    <Target className="w-5 h-5" style={{ color: '#4ecdc4' }} />
                    <div>
                      <div className="text-lg font-bold tabular-nums leading-none text-white">{progress.isPremium ? modules.length : FREE_MODULES.length}<span className="text-xs text-white/50 font-normal">/{modules.length}</span></div>
                      <div className="text-[11px] text-white/60 mt-0.5">Modules unlocked</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        );
      })()}

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
              <Button onClick={() => onSelectModule(nextLesson.module.id, filterMode === 'career' ? activeCareer : undefined)} data-testid="continue-lesson-btn">
                Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Burn Rate Streak + Daily Challenge ─────────────────────────────────
          "Burn Rate Streak" is Acqlerate's acquisitions-flavored spin on a
          daily streak: in real DoD acquisitions, burn rate is how fast a
          program spends its funding. Here, it's how fast you're spending
          daily reps. "Streak" is spelled out in the label so it reads as a
          streak counter, not a rate. */}
      {/* Streak and daily challenge are habits, not headlines. As equal sized
          cards they competed with Continue for the same glance; as two quiet
          rows they stay one click away and the eye goes where it should. */}
      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {/* Burn Rate Streak */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          title="In acquisitions, burn rate tracks how fast a program spends its funding. Here, it tracks how fast you're spending daily reps."
        >
          <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-sm flex-shrink-0">
            {streak.currentStreak > 0 ? '🔥' : '🎯'}
          </span>
          <p className="text-sm min-w-0 flex-1">
            {streak.currentStreak > 0 ? (
              <>
                <span className="font-semibold">{streak.currentStreak}-day burn rate streak</span>
                <span className="text-muted-foreground"> · personal best {streak.longestStreak} day{streak.longestStreak !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <span className="font-semibold">Start your burn rate streak</span>
                <span className="text-muted-foreground"> · one lesson today starts it{streak.longestStreak > 0 ? `, your best is ${streak.longestStreak} day${streak.longestStreak !== 1 ? 's' : ''}` : ''}</span>
              </>
            )}
          </p>
          {streak.currentStreak >= 7 && (
            <span className="text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex-shrink-0">🏆 {streak.currentStreak}d</span>
          )}
        </div>

        {/* Daily challenge */}
        <div
          className={`flex items-center gap-3 px-4 py-3 ${challengeSubmitted ? '' : 'cursor-pointer hover:bg-muted/50 transition-colors'}`}
          onClick={() => !challengeSubmitted && setChallengeActive(true)}
          data-testid="daily-challenge-row"
        >
          <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-sm flex-shrink-0">
            {challengeSubmitted ? '✅' : '⚡'}
          </span>
          <p className="text-sm min-w-0 flex-1">
            {challengeSubmitted && challengeResult ? (
              <>
                <span className="font-semibold">{challengeResult.message}</span>
                <span className="text-muted-foreground"> · {challengeResult.score}/5, +{challengeResult.xpEarned} XP, back tomorrow</span>
              </>
            ) : challengeSubmitted ? (
              <>
                <span className="font-semibold">Today's challenge complete</span>
                <span className="text-muted-foreground"> · back tomorrow for a new set</span>
              </>
            ) : (
              <>
                <span className="font-semibold">Today's Daily Challenge</span>
                <span className="text-muted-foreground"> · 5 questions, 2 min, up to 50 XP</span>
              </>
            )}
          </p>
          {!challengeSubmitted && <span className="text-muted-foreground flex-shrink-0">›</span>}
        </div>
      </div>

      {/* ── Acquisition This Week ──────────────────────────────────────────
          A short, dated brief that gives returning users a reason to open the
          app between lessons. Read state is local to the browser; XP and streak
          integration is a follow-up. */}
      <WeeklyBrief
        onSelectLesson={onSelectLesson}
        onXpEarned={(xp, currentStreak) => {
          if (xp > 0) onBriefXpEarned?.(xp);
          if (typeof currentStreak === 'number') {
            setStreak(st => ({ ...st, currentStreak }));
            onStreakUpdate?.({ currentStreak, longestStreak: streak.longestStreak });
          }
        }}
        className="mb-6"
      />

      {/* Daily challenge modal */}
      {challengeModal}

      {/* ── Start Here Banner (new users only) ─────────────────────────────── */}
      {completedCount === 0 && !startHereDismissed && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
          {/* Animated pulse ring */}
          <div className="absolute top-5 right-5 flex items-center justify-center">
            <span className="absolute inline-flex h-10 w-10 rounded-full bg-primary/20 animate-ping" />
            <span className="relative inline-flex h-6 w-6 rounded-full bg-primary items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" /></svg>
            </span>
          </div>

          <div className="pr-12">
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-1">Start Here</p>
            <h3 className="text-lg font-bold text-foreground leading-snug mb-1">
              Pick your career path in My Account.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you on the <strong className="text-foreground">contractor side</strong> or the <strong className="text-foreground">government side</strong>? Moving into <strong className="text-foreground">Capture &amp; BD</strong>? Choose your path in My Account and we'll show you exactly which lessons matter most for your role.
            </p>
          </div>

          {/* Career track quick-pick buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CAREER_TRACKS.map(track => (
              <button
                key={track.id}
                onClick={() => {
                  // The path itself is chosen on My Account — this just takes them there.
                  setFilterMode('career');
                  setStartHereDismissed(true);
                  try { localStorage.setItem('acq_start_here_dismissed', '1'); } catch {}
                  onOpenAccount?.();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-150 group"
              >
                <span className="text-sm">{track.icon}</span>
                <span className="text-foreground/80 group-hover:text-foreground">{track.label}</span>
                <svg className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
              </button>
            ))}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => {
              setStartHereDismissed(true);
              try { localStorage.setItem('acq_start_here_dismissed', '1'); } catch {}
            }}
            className="absolute top-2 right-14 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            dismiss
          </button>
        </div>
      )}

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Row 1: toggle + pills in one line */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View-by toggle */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 flex-shrink-0">
            <FilterTab active={filterMode === 'career'} onClick={() => setFilterMode('career')}>
              Career Path
            </FilterTab>
            <FilterTab active={filterMode === 'subject'} onClick={() => setFilterMode('subject')}>
              Subject Matter
            </FilterTab>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Role / subject pills — inline with toggle */}
          {filterMode === 'career'
            ? (() => {
                const track = CAREER_TRACKS.find(t => t.id === activeCareer)!;
                return (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-primary/10 border-primary/40 text-primary">
                      {track.icon}{track.shortLabel}
                    </span>
                    {onOpenAccount && (
                      <button onClick={onOpenAccount} className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline" data-testid="change-path-link">
                        Change path in My Account
                      </button>
                    )}
                  </div>
                );
              })()
            : SUBJECT_GROUPS.map(group => (
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
              ))
          }
        </div>

        {/* Row 2: single-line description of active selection */}
        <p className="text-[11px] text-muted-foreground">
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
              onSelect={() => onSelectModule(mod.id, filterMode === 'career' ? activeCareer : undefined)}
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
                  onSelect={() => onSelectModule(mod.id, filterMode === 'career' ? activeCareer : undefined)}
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
            {/* No price on native — App Store 3.1.1. */}
            {isNativeApp() ? "Upgrade to Pro" : "Upgrade to Pro — $99 lifetime"}
          </Button>
        </div>
      )}
    </div>
  );
}
