import React, { useRef } from "react";
import { modules, type SkillLevel } from "@/lib/curriculumMeta";
import { getModuleProgress, FREE_MODULES, FREE_PREVIEW_LESSONS } from "@/lib/progress";
import { getTrackData, sortLessonsByTrack, type CareerTrackId } from "@/lib/careerTracks";
import { getModuleTheme, getModuleFamilyTheme } from "@/lib/moduleTheme";
import { apiRequest } from "@/lib/queryClient";
import type { UserProgress } from "@/lib/progress";
import { ArrowLeft, Clock, CheckCircle, Lock, ChevronRight, BookOpen, Trophy, Target, Award, Download, FileText, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { isNativeApp } from "@/lib/platform";
import { useIsMobile } from "@/hooks/use-mobile";
import { moduleGradient } from "@/lib/moduleTheme";
import { getTotalLessons } from "@/lib/curriculumMeta";
import { formatClps, moduleClps } from "@shared/moduleClps";
import { SkillLevelPill, ResourceRow, LessonRow } from "@/components/mobile/ModulePieces";

const LEVEL_LABELS: Record<SkillLevel, string> = {
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
// Icon accent per level — the badge itself is a white glass pill (it sits on
// the module's colored gradient header), so the level is told apart by icon
// color + label rather than a full badge color.
const LEVEL_ICON_COLORS: Record<SkillLevel, string> = {
  novice: 'text-blue-200',
  intermediate: 'text-amber-200',
  advanced: 'text-emerald-200',
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
  const isMobile = useIsMobile();
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
  // The Lesson Book PDF is a downloadable, keepable asset, so a trialing
  // user shouldn't be able to grab all 6 and walk away with them for free
  // once the trial ends. It follows the module's free rule (Module 1) plus
  // isActuallyPaid — NOT progress.isPremium, which is also true mid-trial.
  // The Debrief audio stays Pro-only on every module, Module 1 included —
  // it's streamed, not downloaded, so it carries no such risk.
  const canDownloadPdf = FREE_MODULES.includes(mod.id) || progress.isActuallyPaid;
  const canListenAudio = progress.isPremium;
  const progressPct = getModuleProgress(mod.id, lessonIds, progress.completedLessons);
  const theme = getModuleFamilyTheme(mod.id);
  // Fires once per page visit, on the first play — not on every pause/resume
  // — so a listener replaying a section doesn't inflate the play count.
  const hasLoggedAudioPlay = useRef(false);
  const handleAudioPlay = () => {
    if (hasLoggedAudioPlay.current) return;
    hasLoggedAudioPlay.current = true;
    apiRequest("POST", "/api/audio/play", { moduleId: mod.id }).catch(() => {
      // Best-effort tracking — a failed log shouldn't interrupt playback.
    });
  };

  // ── Mobile Module screen ──────────────────────────────────────────────────
  if (isMobile) {
    const seq = modules.findIndex(m => m.id === mod.id) + 1;
    const doneCount = lessonIds.filter(id => progress.completedLessons.has(id)).length;
    const nextLevel: SkillLevel = unlockedLevel === 'novice' ? 'intermediate' : 'advanced';
    const clpLine = `${formatClps(moduleClps(mod.id))} · self-report as External Training in WarU`;

    return (
      <div className="flex flex-col gap-4 px-4 pb-8 pt-4" data-testid="module-page-mobile">
        {/* Header card */}
        <div
          className="rounded-2xl p-5 text-white"
          style={{ background: moduleGradient(theme), boxShadow: 'var(--acq-shadow-sm)' }}
        >
          <div className="flex items-start gap-3.5">
            <span
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)' }}
            >
              <BookOpen className="h-6 w-6" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: 'rgba(255,255,255,.7)' }}
              >
                {mod.subtitle}
              </div>
              <h1 className="mt-0.5 text-[19px] font-bold leading-[1.25]" style={{ textWrap: 'pretty' } as any}>
                {mod.title}
              </h1>
            </div>
          </div>

          <p className="mt-3 text-[13px] leading-[1.5]" style={{ color: 'rgba(255,255,255,.85)' }}>
            {mod.description}
          </p>

          {isAccessible ? (
            <>
              <div className="mt-3.5 flex items-center justify-between text-xs">
                <span style={{ color: 'rgba(255,255,255,.8)' }}>Module progress</span>
                <span className="acq-tnum font-semibold">{progressPct}% complete</span>
              </div>
              <div
                className="mt-1.5 h-2 w-full overflow-hidden rounded-full"
                style={{ background: 'rgba(255,255,255,.25)' }}
              >
                <div className="h-full rounded-full bg-white" style={{ width: `${progressPct}%` }} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SkillLevelPill level={unlockedLevel} onDark />
                {mod.assessmentCount ? (
                  <button
                    type="button"
                    onClick={onOpenAssessment}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)' }}
                    data-testid="module-assessment-cta"
                  >
                    <Lock className="h-3 w-3" strokeWidth={2} />
                    Test Your Knowledge → Unlock {LEVEL_LABELS[nextLevel]}
                  </button>
                ) : null}
              </div>

              <p className="mt-2.5 text-[11px]" style={{ color: 'rgba(255,255,255,.7)' }}>
                {clpLine}
              </p>
            </>
          ) : (
            <span
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)' }}
            >
              🔒 Premium
            </span>
          )}
        </div>

        {/* Lesson Book */}
        <ResourceRow
          icon={<FileText className="h-4 w-4" strokeWidth={2} />}
          title="Lesson Book"
          description="The full module as a printable PDF."
          theme={theme}
          locked={!canDownloadPdf}
          action={
            canDownloadPdf && mod.pdfUrl ? (
              <a
                href={mod.pdfUrl}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-white"
                style={{ background: theme.mobileHex }}
                data-testid="module-pdf-download"
              >
                <Download className="h-3 w-3" strokeWidth={2} />
                Download PDF
              </a>
            ) : (
              <button
                type="button"
                onClick={onUpgrade}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold"
                style={{ background: 'var(--acq-surface-sunken)', color: 'var(--acq-text-muted)' }}
              >
                <Lock className="h-3 w-3" strokeWidth={2} />
                Unlock to download
              </button>
            )
          }
        />

        {/* The Debrief */}
        <ResourceRow
          icon={<Headphones className="h-4 w-4" strokeWidth={2} />}
          title="The Debrief"
          description="A podcast-style audio overview of this module."
          theme={theme}
          locked={!canListenAudio}
          action={
            !canListenAudio ? (
              <button
                type="button"
                onClick={onUpgrade}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold"
                style={{ background: 'var(--acq-surface-sunken)', color: 'var(--acq-text-muted)' }}
              >
                <Lock className="h-3 w-3" strokeWidth={2} />
                Unlock to listen
              </button>
            ) : mod.audioReady && mod.audioUrl ? (
              <audio
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onPlay={handleAudioPlay}
                preload="none"
                className="h-9 w-full"
                data-testid="module-audio-player-mobile"
              >
                <source src={mod.audioUrl} type="audio/mp4" />
              </audio>
            ) : (
              <span className="text-xs" style={{ color: 'var(--acq-text-muted)' }}>Coming soon</span>
            )
          }
        />

        {/* Lessons */}
        <div className="mt-2 flex items-baseline justify-between">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--acq-text-muted)' }}
          >
            Lessons
          </h2>
          <span className="acq-tnum text-xs" style={{ color: 'var(--acq-text-muted)' }}>
            {doneCount} / {lessonIds.length} done
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {sortedLessons.map((lesson, i) => {
            const isFreePreview = FREE_PREVIEW_LESSONS.includes(lesson.id);
            const lessonLocked = !isAccessible && !isFreePreview;
            const state = progress.completedLessons.has(lesson.id)
              ? 'done'
              : lessonLocked
                ? 'locked'
                : 'open';
            return (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                seq={i + 1}
                state={state}
                isLast={i === sortedLessons.length - 1}
                moduleId={mod.id}
                isFreePreview={isFreePreview && !isAccessible}
                onOpen={() => (lessonLocked ? onUpgrade() : onSelectLesson(lesson.id))}
              />
            );
          })}
        </div>

        {/* Locked module footer */}
        {!isAccessible && (
          <div
            className="mt-2 rounded-[14px] p-6 text-center"
            style={{
              border: '2px dashed rgba(1,105,111,.3)',
              background: 'rgba(1,105,111,.05)',
            }}
          >
            <Lock className="mx-auto h-7 w-7" style={{ color: 'var(--acq-teal)' }} strokeWidth={2} />
            <h3 className="mt-2 text-[15px] font-semibold" style={{ color: 'var(--acq-text-heading)' }}>
              This Module Requires Pro Access
            </h3>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--acq-text-muted)' }}>
              Unlock all {getTotalLessons()} lessons across all modules. Pro is managed on acqlerate.com.
            </p>
            <button
              type="button"
              onClick={onUpgrade}
              className="mt-4 h-11 w-full rounded-[10px] text-[15px] font-semibold text-white"
              style={{ background: 'var(--acq-teal)' }}
              data-testid="module-unlock-cta"
            >
              How to unlock Pro
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5" data-testid="back-btn">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Module Header — colored gradient banner, matching this module's card on the dashboard */}
      <div className={cn("rounded-2xl p-6 border bg-gradient-to-br shadow-sm", theme.headerGrad)}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-4xl flex-shrink-0">
            {mod.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              {mod.subtitle && (
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
                  {mod.subtitle}
                </span>
              )}
              {trackData && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-white rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
                  Your path: {trackData.shortLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-white">{mod.title}</h1>
              {mod.free && (
                <span className="inline-flex items-center rounded-full bg-emerald-400/20 border border-emerald-300/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200 uppercase tracking-wide">
                  Free
                </span>
              )}
              {!isAccessible && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wide">
                  <Lock className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm mb-4">{mod.description}</p>
            {isAccessible && (
              <div className="space-y-3">
                <div className="space-y-1.5 max-w-xs">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Module progress</span>
                    <span className="font-bold text-white">{progressPct}% complete</span>
                  </div>
                  <Progress value={progressPct} className="h-2 bg-white/20 [&>div]:bg-white" />
                </div>
                {/* Certificate download — show when module is 100% complete */}
                {progressPct === 100 && (
                  <a
                    href={`/api/certificate/${mod.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                    data-testid="download-certificate"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Download Certificate of Completion
                    <Download className="w-3 h-3 ml-0.5" />
                  </a>
                )}
                {/* Skill level badge + assessment button */}
                {mod.assessmentCount ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-2.5 py-1 text-xs font-bold text-white">
                      {unlockedLevel === 'advanced'
                        ? <Trophy className={cn("w-3 h-3", LEVEL_ICON_COLORS[unlockedLevel])} />
                        : <Target className={cn("w-3 h-3", LEVEL_ICON_COLORS[unlockedLevel])} />}
                      {LEVEL_LABELS[unlockedLevel]} Level
                    </span>
                    {unlockedLevel !== 'advanced' && (
                      <button
                        onClick={onOpenAssessment}
                        className="text-xs text-white border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/15 transition-colors flex items-center gap-1.5 font-semibold"
                      >
                        <Lock className="w-3 h-3" />
                        Test Your Knowledge → Unlock {unlockedLevel === 'novice' ? 'Intermediate' : 'Advanced'}
                      </button>
                    )}
                    {unlockedLevel === 'advanced' && (
                      <button
                        onClick={onOpenAssessment}
                        className="text-xs text-white/70 border border-white/25 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
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

      {/* Module Resources: lesson book PDF + "The Debrief" audio overview.
          These two intentionally do NOT share one gate. The PDF is free on
          Module 1 but requires an actual paid plan (not just an active
          trial) on Modules 2-6, since a download survives the trial ending.
          The Debrief audio is Pro-only on every module, Module 1 included —
          it's streamed, not kept, so trial access is fine there. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Lesson Book PDF — free on Module 1; Modules 2-6 need a paid plan,
            not just an active trial (see canDownloadPdf above) */}
        <div className={cn(
          'rounded-xl border p-4 flex items-start gap-3',
          canDownloadPdf ? cn('bg-card', theme.border) : 'bg-muted/20 border-border opacity-70'
        )}>
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', canDownloadPdf ? theme.bgTint : 'bg-muted/40')}>
            <FileText className={cn('w-4 h-4', canDownloadPdf ? theme.text : 'text-muted-foreground')} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Lesson Book</p>
            <p className="text-xs text-muted-foreground mb-2">The full module as a printable PDF.</p>
            {canDownloadPdf && mod.pdfUrl ? (
              <a
                href={mod.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('inline-flex items-center gap-1.5 text-xs font-semibold hover:underline', theme.text)}
                data-testid="download-lesson-book"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>
            ) : (
              <button
                onClick={onUpgrade}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
              >
                <Lock className="w-3.5 h-3.5" /> Unlock to download
              </button>
            )}
          </div>
        </div>

        {/* "The Debrief" — NotebookLM audio overview. Pro-only on every
            module, including Module 1 — this is the paid draw; the PDF
            follows the module's normal free/paid rule instead. */}
        <div className={cn(
          'rounded-xl border p-4 flex items-start gap-3',
          canListenAudio ? cn('bg-card', theme.border) : 'bg-muted/20 border-border opacity-70'
        )}>
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', canListenAudio ? theme.bgTint : 'bg-muted/40')}>
            <Headphones className={cn('w-4 h-4', canListenAudio ? theme.text : 'text-muted-foreground')} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">The Debrief</p>
            <p className="text-xs text-muted-foreground mb-2">A podcast-style audio overview of this module.</p>
            {!canListenAudio ? (
              <button
                onClick={onUpgrade}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
              >
                <Lock className="w-3.5 h-3.5" /> Unlock to listen
              </button>
            ) : mod.audioReady && mod.audioUrl ? (
              <div className="space-y-1.5">
                <audio
                  controls
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  preload="none"
                  className="w-full h-9"
                  data-testid="module-audio-player"
                  onPlay={handleAudioPlay}
                >
                  <source src={mod.audioUrl} type="audio/mp4" />
                </audio>
              </div>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">Coming soon</span>
            )}
          </div>
        </div>
      </div>

      {/* Lessons List */}
      {(() => {
        // Module accent colors — same theme as the header banner above, so
        // the lesson path visually belongs to this module.
        const ac = { border: theme.hoverBorder, numBg: theme.bgTint, barColor: theme.hex };
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
                const hasQuiz = lesson.quizCount > 0;
                const termCount = lesson.termCount;

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
                          : 'text-white'
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
                            ✦ {lesson.quizCount} quiz
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
            {/* No price on native — App Store 3.1.1. */}
            {isNativeApp() ? "Upgrade to Pro" : "Upgrade to Pro — $99 lifetime"}
          </Button>
        </div>
      )}
    </div>
  );
}
