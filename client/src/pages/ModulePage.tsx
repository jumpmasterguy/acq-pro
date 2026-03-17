import { modules, type SkillLevel } from "@/lib/curriculum";
import { getModuleProgress, FREE_MODULES } from "@/lib/progress";
import type { UserProgress } from "@/lib/progress";
import { ArrowLeft, Clock, CheckCircle, Lock, ChevronRight, BookOpen, Trophy, Target } from "lucide-react";
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
}

export default function ModulePage({ moduleId, progress, onBack, onSelectLesson, onUpgrade, unlockedLevel = 'novice', onOpenAssessment }: ModulePageProps) {
  const mod = modules.find(m => m.id === moduleId);
  if (!mod) return null;

  const isAccessible = FREE_MODULES.includes(mod.id) || progress.isPremium;
  const lessonIds = mod.lessons.map(l => l.id);
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
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Lessons</h2>
        <div className="space-y-2">
          {mod.lessons.map((lesson, index) => {
            const isCompleted = progress.completedLessons.has(lesson.id);
            const isLocked = !isAccessible;

            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-4 p-4 rounded-xl border bg-card transition-all duration-200 ${
                  isLocked
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-primary/40 hover:shadow-sm cursor-pointer group'
                }`}
                onClick={() => isLocked ? onUpgrade() : onSelectLesson(lesson.id)}
                data-testid={`lesson-item-${lesson.id}`}
              >
                {/* Number or Status */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                    : isLocked
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4.5 h-4.5" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{lesson.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{lesson.description}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {lesson.duration}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      {lesson.keyTerms.length} key terms
                    </span>
                    {lesson.quiz.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        · {lesson.quiz.length} quiz questions
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                {!isLocked && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

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
