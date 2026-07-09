import React from "react";
import { modules, type SkillLevel } from "@/lib/curriculum";
import { getModuleProgress, FREE_MODULES, FREE_PREVIEW_LESSONS } from "@/lib/progress";
import { getTrackData, sortLessonsByTrack, type CareerTrackId } from "@/lib/careerTracks";
import type { UserProgress } from "@/lib/progress";
import { ArrowLeft, Clock, CheckCircle, Lock, ChevronRight, BookOpen, Trophy, Target, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const LEVEL_LABELS: Record<SkillLevel, string> = {
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
const LEVEL_COLORS: Record<SkillLevel, string> = {
  novice: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  advanced: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

interface ModulePageProps {
  moduleId: string;
  progress: UserProgress;
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
  onUpgrade: () => void;
  unlockedLevel?: SkillLevel;
  onOpenAssessment?: () => void;
  activeCareer?: string | null;
}

export default function ModulePage({ moduleId, progress, onBack, onSelectLesson, onUpgrade, unlockedLevel = 'novice', onOpenAssessment, activeCareer }: ModulePageProps) {
  const mod = modules.find(m => m.id === moduleId);
  if (!mod) return null;

  const trackData = getTrackData((activeCareer as CareerTrackId) ?? null);
  const lessonIds = mod.lessons.map(l => l.id);
  const { primary, bonus, unclassified } = sortLessonsByTrack(lessonIds, trackData);
  // Build sorted lesson list: primary first, then bonus, then unclassified
  const sortedLessonIds = trackData ? [...primary, ...bonus, ...unclassified] : lessonIds;
  // Map back to lesson objects in sorted order
  const lessonMap = Object.fromEntries(mod.lessons.map(l => [l.id, l]));
  const sortedLessons = sortedLessonIds.map(id => lessonMap[id]).filter(Boolean);
  const primarySet = new Set(primary);

  const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
  const progressPct = getModuleProgress(mod.id, lessonIds, progress.completedLessons);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5" data-testid="back-btn">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Module Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{mod.icon}</div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              {mod.subtitle && (
                <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">
                  {mod.subtitle}
                </span>
              )}
              {trackData && (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
                  Your path: {trackData.shortLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold">{mod.title}</h1>
              {mod.free && (
                <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800 text-xs">Free</Badge>
              )}
              {!isAccessible && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Lock className="w-3 h-3" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-4">{mod.description}</p>
            {isAccessible && (
              <div className="space-y-3">
                <div className="space-y-1.5 max-w-xs">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Module progress</span>
                    <span className="font-medium text-primary">{progressPct}% complete</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>
                {/* Certificate download — show when module is 100% complete */}
                {progressPct === 100 && (
                  <a
                    href={`/api/certificate/${mod.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                    data-testid="download-certificate"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Download Certificate of Completion
                    <Download className="w-3 h-3 ml-0.5" />
                  </a>
                )}
                {/* Skill level badge + assessment button */}
                {mod.assessment?.length ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={cn("text-xs border px-2.5 py-1 gap-1.5", LEVEL_COLORS[unlockedLevel])}>
                      {unlockedLevel === 'advanced' ? <Trophy className="w-3 h-3" /> : <Target className="w-3 h-3" />}
                      {LEVEL_LABELS[unlockedLevel]} Level
                    </Badge>
                    {unlockedLevel !== 'advanced' && (
                      <button
                        onClick={onOpenAssessment}
                        className="text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                      >
                        <Lock className="w-3 h-3" />
                        Test Your Knowledge → Unlock {unlockedLevel === 'novice' ? 'Intermediate' : 'Advanced'}
                      </button>
                    )}
                    {unlockedLevel === 'advanced' && (
                      <button
                        onClick={onOpenAssessment}
                        className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors"
                      >
                        Retake Assessment
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lessons List */}
      {(() => {
        // Module accent colors
        const accentMap: Record<string, { border: string; numBg: string; numText: string; dot: string; barColor: string }> = {
          foundations: { border: 'hover:border-blue-400/50',    numBg: 'bg-blue-500/15',   numText: 'text-blue-400',   dot: 'bg-blue-400',   barColor: '#3b82f6' },
          finance:     { border: 'hover:border-amber-400/50',   numBg: 'bg-amber-400/15',  numText: 'text-amber-400',  dot: 'bg-amber-400',  barColor: '#f59e0b' },
          contracts:   { border: 'hover:border-indigo-400/50',  numBg: 'bg-indigo-400/15', numText: 'text-indigo-400', dot: 'bg-indigo-400', barColor: '#6366f1' },
          data:        { border: 'hover:border-teal-400/50',    numBg: 'bg-teal-400/15',   numText: 'text-teal-400',   dot: 'bg-teal-400',   barColor: '#14b8a6' },
          capture:     { border: 'hover:border-orange-400/50',  numBg: 'bg-orange-400/15', numText: 'text-orange-400', dot: 'bg-orange-400', barColor: '#f97316' },
          operations:  { border: 'hover:border-violet-400/50',  numBg: 'bg-violet-400/15', numText: 'text-violet-400', dot: 'bg-violet-400', barColor: '#8b5cf6' },
        };
        const ac = accentMap[mod.id] ?? accentMap.foundations;
        const completedInModule = mod.lessons.filter(l => progress.completedLessons.has(l.id)).length;

        return (
          <div>
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Lessons</h2>
                {trackData && (
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {trackData.shortLabel} path
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{completedInModule} / {mod.lessons.length} done</span>
            </div>

            <div className="space-y-2">
              {sortedLessons.map((lesson, index) => {
                const isPrimary = primarySet.has(lesson.id);
                const isFirstBonus = trackData && !isPrimary && index > 0 && primarySet.has(sortedLessons[index - 1]?.id);
                const isFirstUnclassified = !trackData && index > 0;
                const isCompleted = progress.completedLessons.has(lesson.id);
                const isFreePreview = FREE_PREVIEW_LESSONS.includes(lesson.id);
                const isLocked = !isAccessible && !isFreePreview;
                const hasQuiz = (lesson.quiz?.length ?? 0) > 0;
                const termCount = lesson.keyTerms?.length ?? 0;

                return (
                  <React.Fragment key={lesson.id}>
                  {/* Bonus section divider */}
                  {isFirstBonus && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Good to know · outside your core path
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <div
                    key={lesson.id}
                    onClick={() => isLocked ? onUpgrade() : onSelectLesson(lesson.id)}
                    data-testid={`lesson-item-${lesson.id}`}
                    className={cn(
                      'group relative flex items-stretch gap-0 rounded-2xl border bg-card overflow-hidden transition-all duration-200',
                      isLocked
                        ? 'opacity-50 cursor-not-allowed border-border'
                        : cn('cursor-pointer border-border shadow-sm hover:shadow-md', ac.border),
                      // Dim bonus/unclassified lessons slightly when a track is active
                      trackData && !isPrimary ? 'opacity-60 hover:opacity-100' : ''
                    )}
                  >
                    {/* Left accent strip + number */}
                    <div className={cn(
                      'flex flex-col items-center justify-start gap-1 px-3 pt-4 pb-3 flex-shrink-0 min-w-[48px]',
                      isCompleted ? 'bg-green-500/10' : isLocked ? 'bg-muted/30' : ac.numBg
                    )}>
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black',
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isLocked
                          ? 'bg-muted-foreground/20 text-muted-foreground'
                          : cn('text-white', ac.numBg.replace('/15', ''))
                      )} style={!isCompleted && !isLocked ? { background: ac.barColor } : {}}>
                        {isCompleted ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : isLocked ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {/* Connector line (not on last item) */}
                      {index < mod.lessons.length - 1 && (
                        <div className={cn('w-0.5 flex-1 rounded-full mt-1', isCompleted ? 'bg-green-500/40' : 'bg-border')} />
                      )}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <p className={cn(
                            'font-semibold text-sm leading-snug',
                            isCompleted ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-foreground'
                          )}>
                            {lesson.title}
                          </p>
                          {/* Description */}
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                            {lesson.description}
                          </p>
                        </div>
                        {/* Arrow / lock */}
                        {!isLocked && (
                          <ChevronRight className={cn(
                            'w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-150',
                            isCompleted ? 'text-green-400' : 'text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5'
                          )} />
                        )}
                      </div>

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {/* Duration */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {lesson.duration}
                        </span>
                        {/* Key terms */}
                        {termCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">
                            <BookOpen className="w-2.5 h-2.5" />
                            {termCount} terms
                          </span>
                        )}
                        {/* Quiz */}
                        {hasQuiz && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">
                            ✦ {lesson.quiz!.length} quiz
                          </span>
                        )}
                        {/* Free preview badge */}
                        {isFreePreview && !isAccessible && (
                          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                            Free
                          </span>
                        )}
                        {/* Completed badge */}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Upgrade prompt if locked */}
      {!isAccessible && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 p-6 text-center">
          <Lock className="w-7 h-7 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">This Module Requires Pro Access</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unlock all {modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons across all modules 
            with a one-time Pro upgrade.
          </p>
          <Button onClick={onUpgrade} data-testid="module-upgrade-btn">
            Upgrade to Pro — $149 lifetime
          </Button>
        </div>
      )}
    </div>
  );
}
