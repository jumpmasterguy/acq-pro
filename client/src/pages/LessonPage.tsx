import { useState } from "react";
import { modules, type Lesson, type Module, type QuizQuestion } from "@/lib/curriculum";
import type { UserProgress } from "@/lib/progress";
import {
  ArrowLeft, ChevronRight, CheckCircle, BookOpen, AlertTriangle,
  Lightbulb, Table, Clock, Award, RotateCcw, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LessonPageProps {
  lessonId: string;
  progress: UserProgress;
  onBack: () => void;
  onComplete: (lessonId: string, quizScore: number) => void;
  onNextLesson: (lessonId: string) => void;
}

type Tab = 'lesson' | 'quiz' | 'terms';

export default function LessonPage({ lessonId, progress, onBack, onComplete, onNextLesson }: LessonPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('lesson');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  // Find lesson and module
  let lesson: Lesson | null = null;
  let mod: Module | null = null;
  let nextLesson: Lesson | null = null;

  for (const m of modules) {
    const idx = m.lessons.findIndex(l => l.id === lessonId);
    if (idx !== -1) {
      lesson = m.lessons[idx];
      mod = m;
      nextLesson = m.lessons[idx + 1] || null;
      break;
    }
  }

  if (!lesson || !mod) return null;

  const isCompleted = progress.completedLessons.has(lessonId);
  const existingScore = progress.quizScores[lessonId];

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(quizAnswers).length < lesson!.quiz.length) return;
    setQuizSubmitted(true);
    const correct = lesson!.quiz.filter(q => quizAnswers[q.id] === q.correct).length;
    const score = Math.round((correct / lesson!.quiz.length) * 100);
    onComplete(lessonId, score);
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const quizScore = (() => {
    if (!quizSubmitted) return null;
    const correct = lesson.quiz.filter(q => quizAnswers[q.id] === q.correct).length;
    return Math.round((correct / lesson.quiz.length) * 100);
  })();

  const allAnswered = Object.keys(quizAnswers).length === lesson.quiz.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5" data-testid="lesson-back">
          <ArrowLeft className="w-4 h-4" />
          Back to Module
        </Button>
      </div>

      {/* Lesson Header Card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">{mod.title}</div>
            <h1 className="text-lg font-bold leading-tight mb-2">{lesson.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lesson.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {lesson.keyTerms.length} key terms
              </span>
              {lesson.quiz.length > 0 && (
                <span>{lesson.quiz.length} quiz questions</span>
              )}
            </div>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full px-3 py-1 text-xs font-medium flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" />
              Completed
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {(['lesson', 'terms', 'quiz'] as Tab[]).map((tab) => {
          const labels: Record<Tab, string> = { lesson: 'Lesson', terms: `Key Terms (${lesson!.keyTerms.length})`, quiz: `Quiz (${lesson!.quiz.length}Q)` };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              data-testid={`tab-${tab}`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* TAB: LESSON CONTENT */}
      {activeTab === 'lesson' && (
        <div className="space-y-5">
          {lesson.content.map((block, i) => {
            if (block.type === 'text') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h2 className="font-semibold text-base mb-3">{block.heading}</h2>}
                  {block.body && <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>}
                </div>
              );
            }

            if (block.type === 'callout') {
              return (
                <div key={i} className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-4.5 h-4.5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      {block.heading && <h3 className="font-semibold text-sm mb-2 text-primary">{block.heading}</h3>}
                      {block.body && <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>}
                    </div>
                  </div>
                </div>
              );
            }

            if (block.type === 'warning') {
              return (
                <div key={i} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      {block.heading && <h3 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-400">{block.heading}</h3>}
                      {block.body && <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>}
                    </div>
                  </div>
                </div>
              );
            }

            if (block.type === 'tip') {
              return (
                <div key={i} className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Award className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      {block.heading && <h3 className="font-semibold text-sm mb-2 text-amber-700 dark:text-amber-400">{block.heading}</h3>}
                      {block.body && <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>}
                    </div>
                  </div>
                </div>
              );
            }

            if (block.type === 'list') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h3 className="font-semibold text-sm mb-3">{block.heading}</h3>}
                  <ul className="space-y-2">
                    {block.items?.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }

            if (block.type === 'table') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  {block.heading && (
                    <div className="px-5 py-3 border-b border-border bg-muted/30">
                      <h3 className="font-semibold text-sm">{block.heading}</h3>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/20">
                          {block.headers?.map((h, hi) => (
                            <th key={hi} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows?.map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-muted/10'}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-4 py-2.5 text-sm text-muted-foreground border-b border-border/50 last:border-b-0">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            if (block.type === 'formula') {
              return (
                <div key={i} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  {block.heading && <h3 className="font-semibold text-sm mb-3">{block.heading}</h3>}
                  {block.formula && (
                    <pre className="font-mono text-sm bg-slate-900 dark:bg-slate-950 text-green-400 rounded-lg p-4 overflow-x-auto mb-3 whitespace-pre-wrap">
                      {block.formula}
                    </pre>
                  )}
                  {block.explanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{block.explanation}</p>
                  )}
                </div>
              );
            }

            if (block.type === 'risk_chart') {
              const contracts = [
                { name: 'FFP',  full: 'Firm-Fixed-Price',             contractorRisk: 100, govRisk: 0,  costRisk: 'Contractor', perfRisk: 'Contractor', color: '#16a34a' },
                { name: 'FPIF', full: 'Fixed-Price Incentive (Firm)', contractorRisk: 70,  govRisk: 30, costRisk: 'Shared',     perfRisk: 'Contractor', color: '#65a30d' },
                { name: 'CPIF', full: 'Cost-Plus-Incentive-Fee',      contractorRisk: 25,  govRisk: 75, costRisk: 'Government', perfRisk: 'Shared',     color: '#d97706' },
                { name: 'CPAF', full: 'Cost-Plus-Award-Fee',          contractorRisk: 15,  govRisk: 85, costRisk: 'Government', perfRisk: 'Gov (FDO)',  color: '#ea580c' },
                { name: 'CPFF', full: 'Cost-Plus-Fixed-Fee',          contractorRisk: 10,  govRisk: 90, costRisk: 'Government', perfRisk: 'Shared',     color: '#dc2626' },
                { name: 'T&M',  full: 'Time & Materials',             contractorRisk: 5,   govRisk: 95, costRisk: 'Government', perfRisk: 'Government', color: '#991b1b' },
              ];
              return (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border bg-muted/30">
                    <h3 className="font-semibold text-sm">Risk Allocation by Contract Type</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Who absorbs cost overruns, performance failures, and technical risk</p>
                  </div>
                  <div className="p-5 space-y-5">
                    {/* Legend */}
                    <div className="flex items-center gap-5 text-xs">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary inline-block" />Contractor Risk</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted-foreground/30 inline-block" />Government Risk</div>
                    </div>
                    {/* Risk bars */}
                    {contracts.map((c) => (
                      <div key={c.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-10" style={{ color: c.color }}>{c.name}</span>
                            <span className="text-muted-foreground text-[10px] hidden sm:inline">{c.full}</span>
                          </div>
                          <span className="text-muted-foreground text-[10px]">Cost: <span className="font-medium text-foreground">{c.costRisk}</span> · Perf: <span className="font-medium text-foreground">{c.perfRisk}</span></span>
                        </div>
                        <div className="flex h-6 rounded-lg overflow-hidden w-full gap-0.5">
                          <div
                            className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            style={{ width: `${c.contractorRisk}%`, backgroundColor: c.color, minWidth: c.contractorRisk > 0 ? '2px' : '0' }}
                          >
                            {c.contractorRisk >= 20 ? `${c.contractorRisk}%` : ''}
                          </div>
                          <div
                            className="flex items-center justify-center text-[10px] font-bold text-white bg-slate-400 dark:bg-slate-600 transition-all"
                            style={{ width: `${c.govRisk}%`, minWidth: c.govRisk > 0 ? '2px' : '0' }}
                          >
                            {c.govRisk >= 20 ? `${c.govRisk}%` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Risk type breakdown */}
                    <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: '💰 Cost Risk', desc: 'Who pays for cost overruns above the target/ceiling price?' },
                        { label: '⚙️ Performance Risk', desc: 'Who absorbs losses if the deliverable underperforms or needs rework?' },
                        { label: '🔬 Technical Risk', desc: 'Who bears the burden if the technology proves harder than expected?' },
                      ].map(({ label, desc }) => (
                        <div key={label} className="bg-muted/30 rounded-lg p-3">
                          <div className="text-xs font-semibold mb-1">{label}</div>
                          <div className="text-[11px] text-muted-foreground leading-relaxed">{desc}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">FAR 16.103(a): The contract type must be appropriate for the circumstances — risk must be commensurate with the government's ability to define requirements and manage performance.</p>
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* Next Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => setActiveTab('quiz')}
              className="flex-1 gap-1.5"
              data-testid="go-to-quiz"
            >
              Take the Quiz
              <ChevronRight className="w-4 h-4" />
            </Button>
            {nextLesson && (
              <Button
                variant="outline"
                onClick={() => onNextLesson(nextLesson!.id)}
                className="flex-1"
                data-testid="next-lesson"
              >
                Next Lesson
              </Button>
            )}
          </div>
        </div>
      )}

      {/* TAB: KEY TERMS */}
      {activeTab === 'terms' && (
        <div className="space-y-2">
          {lesson.keyTerms.map((term) => (
            <div
              key={term.term}
              className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
              data-testid={`term-${term.term.replace(/\s/g, '-')}`}
            >
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="font-semibold text-sm">{term.term}</div>
                {expandedTerm === term.term ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              {expandedTerm === term.term && (
                <div className="px-5 pb-4 border-t border-border/50 bg-muted/10">
                  <p className="text-sm text-muted-foreground leading-relaxed pt-3">{term.definition}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB: QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-5">
          {/* Score banner if submitted */}
          {quizSubmitted && quizScore !== null && (
            <div className={cn(
              "rounded-xl p-4 text-center border",
              quizScore >= 80
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                : quizScore >= 60
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400"
            )} data-testid="quiz-score-banner">
              <div className="text-2xl font-bold mb-1">{quizScore}%</div>
              <div className="text-sm">
                {quizScore >= 80 ? "Excellent work! 🎯" : quizScore >= 60 ? "Good effort — review the missed questions below." : "Keep studying — review the explanations and retry."}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={handleRetakeQuiz}
                data-testid="retake-quiz"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Quiz
              </Button>
            </div>
          )}

          {/* Questions */}
          {lesson.quiz.map((question, qi) => {
            const answered = quizAnswers[question.id] !== undefined;
            const isCorrect = quizSubmitted && quizAnswers[question.id] === question.correct;
            const isWrong = quizSubmitted && answered && !isCorrect;

            return (
              <div key={question.id} className="bg-card border border-border rounded-xl p-5 space-y-3" data-testid={`question-${qi}`}>
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {qi + 1}
                  </span>
                  <p className="font-medium text-sm leading-relaxed">{question.question}</p>
                </div>

                <div className="space-y-2 ml-8">
                  {question.options.map((option, oi) => {
                    const isSelected = quizAnswers[question.id] === oi;
                    const isTheCorrect = question.correct === oi;

                    let optionClass = "border-border bg-background hover:border-primary/50 hover:bg-primary/5";
                    if (quizSubmitted) {
                      if (isTheCorrect) optionClass = "border-green-400 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300";
                      else if (isSelected && !isTheCorrect) optionClass = "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300";
                      else optionClass = "border-border bg-background opacity-60";
                    } else if (isSelected) {
                      optionClass = "border-primary bg-primary/10";
                    }

                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswerSelect(question.id, oi)}
                        disabled={quizSubmitted}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150",
                          optionClass,
                          !quizSubmitted && "cursor-pointer"
                        )}
                        data-testid={`option-${qi}-${oi}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex-shrink-0",
                            isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                          )} />
                          {option}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {quizSubmitted && (
                  <div className={cn(
                    "ml-8 rounded-lg p-3 text-xs leading-relaxed border",
                    isCorrect
                      ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
                      : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                  )} data-testid={`explanation-${qi}`}>
                    <strong className="font-semibold">{isCorrect ? "✓ Correct!" : "✗ Incorrect."}</strong>{" "}
                    {question.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit */}
          {!quizSubmitted && (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!allAnswered}
              className="w-full"
              data-testid="submit-quiz"
            >
              Submit Quiz ({Object.keys(quizAnswers).length}/{lesson.quiz.length} answered)
            </Button>
          )}

          {/* Mark complete / next */}
          {quizSubmitted && (
            <div className="flex flex-col sm:flex-row gap-3">
              {!isCompleted && (
                <Button
                  onClick={() => onComplete(lessonId, quizScore ?? 0)}
                  variant="outline"
                  className="flex-1 gap-1.5"
                  data-testid="mark-complete"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Mark Complete
                </Button>
              )}
              {nextLesson && (
                <Button
                  onClick={() => onNextLesson(nextLesson!.id)}
                  className="flex-1"
                  data-testid="quiz-next-lesson"
                >
                  Next Lesson <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
