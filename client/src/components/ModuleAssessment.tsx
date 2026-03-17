import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Module, type ModuleAssessmentQuestion, type SkillLevel } from "@/lib/curriculum";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Trophy, Lock, ChevronRight, RotateCcw, Zap, Target } from "lucide-react";

interface ModuleAssessmentProps {
  module: Module;
  currentLevel: SkillLevel;
  onClose: () => void;
  onLevelUnlocked: (moduleId: string, newLevel: SkillLevel) => void;
}

type AssessmentState = 'intro' | 'quiz' | 'results';

const LEVEL_LABELS: Record<SkillLevel, string> = {
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const NEXT_LEVEL: Record<SkillLevel, SkillLevel | null> = {
  novice: 'intermediate',
  intermediate: 'advanced',
  advanced: null,
};

const LEVEL_COLORS: Record<SkillLevel, string> = {
  novice: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  advanced: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

export function ModuleAssessment({ module, currentLevel, onClose, onLevelUnlocked }: ModuleAssessmentProps) {
  const [state, setState] = useState<AssessmentState>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [newLevel, setNewLevel] = useState<SkillLevel>(currentLevel);
  const [saving, setSaving] = useState(false);

  const questions = module.assessment ?? [];
  const nextLevel = NEXT_LEVEL[currentLevel];
  const alreadyMaxed = currentLevel === 'advanced';

  const handleStart = () => {
    setState('quiz');
    setCurrentQ(0);
    setAnswers({});
    setSubmitted(false);
  };

  const handleAnswer = (qId: string, optionIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmit = useCallback(async () => {
    if (saving) return;
    const correct = questions.filter(q => answers[q.id] === q.correct).length;
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/skill-level", {
        moduleId: module.id,
        score: pct,
      });
      if (res.ok) {
        const data = await res.json();
        setUnlocked(data.unlocked);
        setNewLevel(data.newLevel as SkillLevel);
        if (data.unlocked) {
          onLevelUnlocked(module.id, data.newLevel as SkillLevel);
        }
      }
    } catch {}
    setSaving(false);
    setState('results');
  }, [answers, questions, module.id, onLevelUnlocked, saving]);

  const question = questions[currentQ];
  const allAnswered = questions.every(q => answers[q.id] !== undefined);
  const PASS = 75;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
              {module.icon}
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Module Assessment</div>
              <div className="text-sm font-semibold text-foreground">{module.title}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── INTRO ── */}
          {state === 'intro' && (
            <div className="p-6 space-y-5">
              {alreadyMaxed ? (
                <div className="text-center space-y-4 py-4">
                  <Trophy className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div className="text-lg font-semibold text-foreground">You've reached Advanced level</div>
                  <p className="text-sm text-muted-foreground">You've already unlocked all skill levels for this module. You can retake the assessment to track your mastery.</p>
                  <Badge className={cn("text-xs border px-3 py-1", LEVEL_COLORS['advanced'])}>Advanced Unlocked</Badge>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Unlock deeper content</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Each module has three skill levels — <strong className="text-foreground">Novice</strong>, <strong className="text-foreground">Intermediate</strong>, and <strong className="text-foreground">Advanced</strong>. Higher levels reveal more sophisticated analysis, real-world edge cases, and expert-level nuance within every lesson.
                    </p>
                  </div>

                  {/* Level progression visual */}
                  <div className="flex items-center gap-2 py-2">
                    {(['novice', 'intermediate', 'advanced'] as SkillLevel[]).map((lvl, i) => {
                      const isUnlocked = lvl === 'novice' ||
                        (lvl === 'intermediate' && (currentLevel === 'intermediate' || currentLevel === 'advanced')) ||
                        (lvl === 'advanced' && currentLevel === 'advanced');
                      const isCurrent = lvl === currentLevel;
                      const isNext = lvl === nextLevel;
                      return (
                        <div key={lvl} className="flex items-center gap-2 flex-1">
                          <div className={cn(
                            "flex-1 rounded-lg px-3 py-2 text-center border text-xs font-medium",
                            isUnlocked ? LEVEL_COLORS[lvl] : 'text-muted-foreground border-border bg-muted/30',
                            isCurrent && 'ring-1 ring-primary/40',
                          )}>
                            {!isUnlocked && <Lock className="w-3 h-3 inline mr-1 mb-0.5" />}
                            {LEVEL_LABELS[lvl]}
                            {isCurrent && <div className="text-[9px] mt-0.5 opacity-70">Current</div>}
                            {isNext && <div className="text-[9px] mt-0.5 opacity-70">Unlock next</div>}
                          </div>
                          {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary" /> Assessment Rules
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• {questions.length} questions covering all lessons in this module</li>
                      <li>• Score <strong className="text-foreground">75% or higher</strong> to unlock {nextLevel ? LEVEL_LABELS[nextLevel] : 'the next level'}</li>
                      <li>• You can retake the assessment as many times as you need</li>
                      <li>• Your best score is always saved</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── QUIZ ── */}
          {state === 'quiz' && question && (
            <div className="p-6 space-y-5">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Question {currentQ + 1} of {questions.length}</span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="text-sm font-medium text-foreground leading-relaxed">
                {question.question}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {question.options.map((opt, i) => {
                  const selected = answers[question.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(question.id, i)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <span className={cn("font-medium mr-2", selected ? "text-primary" : "text-muted-foreground")}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                >
                  ← Previous
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentQ(q => q + 1)}
                    disabled={answers[question.id] === undefined}
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!allAnswered || saving}
                    className="bg-primary text-primary-foreground"
                  >
                    {saving ? 'Saving...' : 'Submit'}
                  </Button>
                )}
              </div>

              {/* Question nav dots */}
              <div className="flex flex-wrap gap-1 pt-1">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQ(i)}
                    className={cn(
                      "w-6 h-6 rounded text-[10px] font-medium transition-colors",
                      i === currentQ ? "bg-primary text-primary-foreground" :
                        answers[q.id] !== undefined ? "bg-primary/20 text-primary" :
                          "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {state === 'results' && (
            <div className="p-6 space-y-5">
              {/* Score header */}
              <div className="text-center space-y-3">
                <div className={cn(
                  "w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold border-4",
                  score >= PASS ? "border-emerald-400 text-emerald-400 bg-emerald-400/10" : "border-red-400 text-red-400 bg-red-400/10"
                )}>
                  {score}%
                </div>
                {unlocked ? (
                  <div>
                    <div className="text-lg font-bold text-foreground">Level Unlocked!</div>
                    <Badge className={cn("mt-1 text-xs border px-3 py-1", LEVEL_COLORS[newLevel])}>
                      <Trophy className="w-3 h-3 mr-1" />
                      {LEVEL_LABELS[newLevel]} Unlocked
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      You can now access {LEVEL_LABELS[newLevel]}-level content in every lesson of this module.
                    </p>
                  </div>
                ) : score >= PASS && !unlocked ? (
                  <div>
                    <div className="text-base font-semibold text-foreground">Already at max level</div>
                    <p className="text-xs text-muted-foreground mt-1">You're already at Advanced. Score saved.</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-base font-semibold text-foreground">Not quite — need {PASS}% to advance</div>
                    <p className="text-xs text-muted-foreground mt-1">Review the lessons and try again. You can retake as many times as you need.</p>
                  </div>
                )}
              </div>

              {/* Answer review */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {questions.map((q, i) => {
                  const userAns = answers[q.id];
                  const correct = userAns === q.correct;
                  return (
                    <div key={q.id} className={cn(
                      "rounded-xl p-3 border text-xs space-y-1.5",
                      correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
                    )}>
                      <div className="flex items-start gap-2">
                        {correct
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        }
                        <span className="font-medium text-foreground leading-snug">{q.question}</span>
                      </div>
                      {!correct && (
                        <div className="pl-5 text-muted-foreground">
                          <span className="text-red-400">Your answer: </span>{q.options[userAns ?? 0]}
                          <br />
                          <span className="text-emerald-400">Correct: </span>{q.options[q.correct]}
                        </div>
                      )}
                      <div className="pl-5 text-muted-foreground/80 leading-relaxed">{q.explanation}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 flex-shrink-0">
          {state === 'intro' && (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleStart}>
                {alreadyMaxed ? 'Retake Assessment' : `Start Assessment (${questions.length}Q)`}
              </Button>
            </>
          )}
          {state === 'results' && (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
              {score < PASS && (
                <Button size="sm" variant="outline" onClick={handleStart}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retake
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
