import { useState, useRef } from "react";
import { modules, type Lesson, type Module, type QuizQuestion, type SkillLevel, type ExpandableItem } from "@/lib/curriculum";
import type { UserProgress } from "@/lib/progress";
import {
  ArrowLeft, ChevronRight, CheckCircle, BookOpen, AlertTriangle,
  Lightbulb, Table, Clock, Award, RotateCcw, ChevronDown, ChevronUp,
  GripVertical, ArrowRight, Lock, ChevronUp as LevelUp,
  Sparkles, BrainCircuit, HelpCircle, Briefcase, Loader2, X
} from "lucide-react";
import { apiRequest, API_BASE } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const SKILL_LEVELS: SkillLevel[] = ['novice', 'intermediate', 'advanced'];
const LEVEL_LABELS: Record<SkillLevel, string> = {
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
const LEVEL_COLORS: Record<SkillLevel, string> = {
  novice: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-400/30',
  advanced: 'bg-emerald-500/10 text-emerald-400 border-emerald-400/30',
};

// ─── Expandable List Item Component ─────────────────────────────────────────
const BADGE_COLORS: Record<string, string> = {
  blue:   'bg-blue-500/10 text-blue-400 border border-blue-400/30',
  amber:  'bg-amber-500/10 text-amber-400 border border-amber-400/30',
  green:  'bg-emerald-500/10 text-emerald-400 border border-emerald-400/30',
  red:    'bg-red-500/10 text-red-400 border border-red-400/30',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-400/30',
  gray:   'bg-muted/50 text-muted-foreground border border-border',
};

function ExpandableListItemCard({ item }: { item: ExpandableItem }) {
  const [open, setOpen] = useState(false);
  const badgeClass = BADGE_COLORS[item.badgeColor ?? 'gray'];
  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all duration-200",
      open ? "border-primary/40 bg-primary/5" : "border-border bg-card"
    )}>
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left group"
      >
        <div className={cn(
          "flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          open ? "border-primary bg-primary/20" : "border-border group-hover:border-primary/50"
        )}>
          {open
            ? <ChevronUp className="w-3 h-3 text-primary" />
            : <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{item.label}</span>
            {item.badge && (
              <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", badgeClass)}>
                {item.badge}
              </span>
            )}
          </div>
          {item.sublabel && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
          )}
          {item.summary && !open && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.summary}</p>
          )}
        </div>
      </button>
      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
          {item.content.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-1 h-3.5 rounded-full bg-primary inline-block"></span>
                  {section.heading}
                </h4>
              )}
              {section.type === 'bullets' && section.items && (
                <ul className="space-y-1.5">
                  {section.items.map((item, ii) => {
                    // Strip ||| detail text — only show the visible bullet portion
                    const bulletText = item.split('|||')[0];
                    // Em-dash split bold (same rule as main list items: label ≤45 chars)
                    const dashIdx = bulletText.indexOf(' — ');
                    const label = dashIdx > 0 && dashIdx <= 45 ? bulletText.slice(0, dashIdx) : null;
                    const rest = label ? bulletText.slice(dashIdx) : null;
                    return (
                      <li key={ii} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span>
                          {label
                            ? <><span className="font-semibold text-foreground">{label}</span><span>{rest}</span></>
                            : bulletText
                          }
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {section.type === 'grid' && section.grid && (
                <div className="grid grid-cols-2 gap-2">
                  {section.grid.map((cell, gi) => (
                    <div key={gi} className="bg-muted/30 rounded-lg px-3 py-2">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{cell.label}</div>
                      <div className="text-xs text-foreground">{cell.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {(section.type === 'text' || !section.type) && section.body && (
                <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
              )}
              {(section.type === 'text' || !section.type) && section.items && (
                <ul className="space-y-1.5 mt-2">
                  {section.items.map((it, ii) => (
                    <li key={ii} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      {it}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface LessonPageProps {
  lessonId: string;
  progress: UserProgress;
  onBack: () => void;
  onComplete: (lessonId: string, quizScore: number) => void;
  onNextLesson: (lessonId: string) => void;
  // Highest unlocked skill level for this lesson's module
  unlockedLevel?: SkillLevel;
  // Callback to open the module assessment from within a lesson
  onOpenAssessment?: () => void;
  // True only for lifetime subscribers — unlocks "How Do I Apply This?" AI button
  isLifetime?: boolean;
}

type Tab = 'lesson' | 'quiz' | 'terms';

// ─── Drag-Order Question ───────────────────────────────────────────────────

interface DragOrderProps {
  question: QuizQuestion;
  submitted: boolean;
  onOrderChange: (id: string, order: string[]) => void;
  currentOrder: string[];
}

// ── AI-powered expandable bullet item ─────────────────────────────────────────

const DETAIL_SEP = '|||';

function ExpandableBulletItem({
  item,
  lessonTitle,
  heading,
}: {
  item: string;
  lessonTitle: string;
  heading?: string;
}) {
  // Items can embed static detail: "Bullet text|||Static detail text"
  const sepIdx = item.indexOf(DETAIL_SEP);
  const bulletText = sepIdx >= 0 ? item.slice(0, sepIdx) : item;
  const staticDetail = sepIdx >= 0 ? item.slice(sepIdx + DETAIL_SEP.length) : null;

  const [open, setOpen] = useState(false);
  const [aiDetail, setAiDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const detail = staticDetail ?? aiDetail;

  const handleToggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    // If static detail exists, show instantly — no API call needed
    if (staticDetail !== null || aiDetail !== null) return;
    // Otherwise fetch from AI
    setLoading(true);
    setError(false);
    try {
      const res = await apiRequest('POST', '/api/expand-item', { item: bulletText, lessonTitle, heading });
      const data = await res.json();
      if (res.ok && data.detail) {
        setAiDetail(data.detail);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="rounded-lg overflow-hidden border border-transparent">
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-start gap-2.5 text-sm text-left py-1.5 px-1 rounded-lg transition-colors group",
          open ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className={cn(
          "flex-shrink-0 mt-0.5 transition-transform duration-200",
          open ? "rotate-90" : ""
        )}>
          <ChevronRight className={cn(
            "w-3.5 h-3.5 transition-colors",
            open ? "text-primary" : "text-primary/60 group-hover:text-primary"
          )} />
        </span>
        <span className="flex-1">
          {(() => {
            const dashIdx = bulletText.indexOf(' — ');
            // Only bold on em-dash split if the label is short/punchy (≤45 chars)
            // Long labels before an em-dash are descriptive sentences, not key terms
            if (dashIdx > 0 && dashIdx <= 45) {
              const label = bulletText.slice(0, dashIdx);
              const rest = bulletText.slice(dashIdx);
              return <><span className="font-semibold text-foreground">{label}</span><span>{rest}</span></>;
            }
            // Bold short items only if they don't look like numbered steps
            const isNumberedStep = /^Step \d+[:\s]/i.test(bulletText);
            if (!isNumberedStep && bulletText.length < 50) {
              return <span className="font-semibold text-foreground">{bulletText}</span>;
            }
            return bulletText;
          })()
          }
        </span>
      </button>
      {open && (
        <div className="ml-6 mt-1 mb-2 px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-lg">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading detail…
            </div>
          )}
          {error && (
            <p className="text-xs text-destructive">Couldn’t load detail — try again.</p>
          )}
          {detail && (
            <p className="text-xs text-foreground/85 leading-relaxed">{detail}</p>
          )}
        </div>
      )}
    </li>
  );
}

function DragOrderQuestion({ question, submitted, onOrderChange, currentOrder }: DragOrderProps) {
  const items = question.orderedItems ?? [];
  const order = currentOrder.length > 0 ? currentOrder : items;
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  };
  const handleDrop = () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(dragIdx.current, 1);
    newOrder.splice(dragOverIdx.current, 0, moved);
    dragIdx.current = null;
    dragOverIdx.current = null;
    onOrderChange(question.id, newOrder);
  };

  const getItemStatus = (item: string, idx: number) => {
    if (!submitted) return 'default';
    return items[idx] === item ? 'correct' : 'wrong';
  };

  return (
    <div className="space-y-2 ml-8">
      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
        <GripVertical className="w-3.5 h-3.5" />
        {submitted ? 'Final order:' : 'Drag to reorder — put them in the correct sequence'}
      </p>
      {order.map((item, idx) => {
        const status = getItemStatus(item, idx);
        return (
          <div
            key={item}
            draggable={!submitted}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-all",
              !submitted && "cursor-grab active:cursor-grabbing hover:border-primary/50 hover:bg-primary/5",
              submitted && status === 'correct' && "border-green-400 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300",
              submitted && status === 'wrong' && "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300",
              !submitted && "border-border bg-background"
            )}
            data-testid={`drag-order-item-${idx}`}
          >
            {!submitted && <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            {submitted && (
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                status === 'correct' ? "bg-green-500 text-white" : "bg-red-500 text-white"
              )}>
                {status === 'correct' ? '✓' : '✗'}
              </span>
            )}
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1">{item}</span>
          </div>
        );
      })}
      {submitted && (
        <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
          <strong>Correct order:</strong>
          <ol className="mt-1 space-y-0.5 list-decimal list-inside">
            {items.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Drag-Match Question ───────────────────────────────────────────────────

interface DragMatchProps {
  question: QuizQuestion;
  submitted: boolean;
  onMatchChange: (id: string, matches: Record<string, string>) => void;
  currentMatches: Record<string, string>;
}

function DragMatchQuestion({ question, submitted, onMatchChange, currentMatches }: DragMatchProps) {
  const pairs = question.pairs ?? [];
  const leftItems = pairs.map(p => p.left);
  // Stable shuffle: rotate by 1 so answers aren't in the same order as left items
  const stableRightItems = useRef(
    (() => {
      const arr = pairs.map(p => p.right);
      return [...arr.slice(1), arr[0]];
    })()
  ).current;

  const [draggingValue, setDraggingValue] = useState<string | null>(null);

  const handleDragStart = (value: string) => setDraggingValue(value);
  const handleDragEnd = () => setDraggingValue(null);

  const handleDropOnLeft = (e: React.DragEvent, leftKey: string) => {
    e.preventDefault();
    if (!draggingValue) return;
    const newMatches = { ...currentMatches, [leftKey]: draggingValue };
    onMatchChange(question.id, newMatches);
    setDraggingValue(null);
  };

  const handleDragOverLeft = (e: React.DragEvent) => e.preventDefault();

  // Unmatched right items
  const matchedRightValues = Object.values(currentMatches);
  const unmatchedRight = stableRightItems.filter(v => !matchedRightValues.includes(v));

  const getMatchStatus = (leftKey: string) => {
    if (!submitted) return 'default';
    const matched = currentMatches[leftKey];
    const correctPair = pairs.find(p => p.left === leftKey);
    if (!matched) return 'empty';
    return matched === correctPair?.right ? 'correct' : 'wrong';
  };

  return (
    <div className="space-y-4 ml-8">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ArrowRight className="w-3.5 h-3.5" />
        {submitted ? 'Results:' : 'Drag items from the right bank and drop them onto their matching left item'}
      </p>

      {/* Right bank (draggable pool) */}
      {!submitted && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border min-h-[48px]">
          {unmatchedRight.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">All items placed — submit or rearrange</span>
          ) : unmatchedRight.map(val => (
            <div
              key={val}
              draggable
              onDragStart={() => handleDragStart(val)}
              onDragEnd={handleDragEnd}
              className={cn(
                "px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-xs font-medium cursor-grab active:cursor-grabbing text-primary transition-all hover:bg-primary/20 select-none",
                draggingValue === val && "opacity-50"
              )}
              data-testid={`match-right-${val}`}
            >
              {val}
            </div>
          ))}
        </div>
      )}

      {/* Left items with drop zones */}
      <div className="space-y-2">
        {leftItems.map((leftKey) => {
          const status = getMatchStatus(leftKey);
          const matched = currentMatches[leftKey];
          const correctPair = pairs.find(p => p.left === leftKey);

          return (
            <div key={leftKey} className="flex items-center gap-3">
              {/* Left label */}
              <div className="flex-shrink-0 w-48 px-3 py-2.5 bg-card border border-border rounded-lg text-sm font-medium">
                {leftKey}
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {/* Drop zone */}
              <div
                onDrop={(e) => handleDropOnLeft(e, leftKey)}
                onDragOver={handleDragOverLeft}
                className={cn(
                  "flex-1 min-h-[40px] px-3 py-2 rounded-lg border text-sm transition-all flex items-center",
                  !submitted && !matched && "border-dashed border-border/60 bg-muted/20 text-muted-foreground/50",
                  !submitted && matched && "border-primary/40 bg-primary/5 text-primary font-medium",
                  submitted && status === 'correct' && "border-green-400 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300",
                  submitted && status === 'wrong' && "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300",
                  submitted && status === 'empty' && "border-border bg-muted/10 text-muted-foreground italic"
                )}
                data-testid={`match-drop-${leftKey}`}
              >
                {matched ? (
                  <span className="flex items-center gap-2">
                    {submitted && status === 'correct' && <span className="text-green-500 font-bold">✓</span>}
                    {submitted && status === 'wrong' && <span className="text-red-500 font-bold">✗</span>}
                    {matched}
                    {submitted && status === 'wrong' && (
                      <span className="text-green-600 dark:text-green-400 text-xs ml-1">→ {correctPair?.right}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs">{submitted ? 'Not answered' : 'Drop here'}</span>
                )}
              </div>
              {/* Allow removing a placed item by clicking it (not submitted) */}
              {!submitted && matched && (
                <button
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => {
                    const newMatches = { ...currentMatches };
                    delete newMatches[leftKey];
                    onMatchChange(question.id, newMatches);
                  }}
                  title="Remove match"
                >✕</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main LessonPage ───────────────────────────────────────────────────────

export default function LessonPage({ lessonId, progress, onBack, onComplete, onNextLesson, unlockedLevel = 'novice', onOpenAssessment, isLifetime = false }: LessonPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('lesson');
  // MC answers: questionId → optionIndex
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  // Drag-order answers: questionId → ordered string array
  const [dragOrders, setDragOrders] = useState<Record<string, string[]>>({});
  // Drag-match answers: questionId → { leftKey: rightValue }
  const [dragMatches, setDragMatches] = useState<Record<string, Record<string, string>>>({});
  // If user already has a stored score for this lesson, start in submitted state
  const hasPriorScore = lessonId in (progress.quizScores ?? {});
  const [quizSubmitted, setQuizSubmitted] = useState(hasPriorScore);
  const [storedScore] = useState<number | null>(hasPriorScore ? (progress.quizScores[lessonId] ?? 0) : null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  // Active viewing level — defaults to the unlocked level, can be toggled down
  const [viewLevel, setViewLevel] = useState<SkillLevel>(unlockedLevel);
  // AI Explain panel
  const [aiMode, setAiMode] = useState<'eli5' | 'apply' | 'lost' | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  if (!lesson || !mod) {
    // Lesson not found — show a recoverable error instead of blank screen
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-8">
        <div className="text-4xl">🔍</div>
        <h2 className="text-lg font-bold">Lesson not found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">We couldn\'t find lesson <code className="bg-muted px-1 rounded">{lessonId}</code>. It may have been moved.</p>
        <button onClick={onBack} className="text-sm text-primary underline">← Go back</button>
      </div>
    );
  }

  const isCompleted = progress.completedLessons.has(lessonId);

  // Content filtering: show blocks with no level (universal) + blocks at/below viewLevel
  const levelOrder: Record<SkillLevel, number> = { novice: 0, intermediate: 1, advanced: 2 };
  const unlockedOrder = levelOrder[unlockedLevel];
  const viewOrder = levelOrder[viewLevel];

  // A block is visible if: no level tag (universal), OR level <= viewLevel
  // A block is "locked preview" if: level exists AND level > unlockedLevel (user hasn't unlocked it yet)
  const hasLeveledContent = lesson.content.some(b => b.level !== undefined);

  // ── Answer handlers ──
  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleOrderChange = (id: string, order: string[]) => {
    if (quizSubmitted) return;
    setDragOrders(prev => ({ ...prev, [id]: order }));
  };

  const handleMatchChange = (id: string, matches: Record<string, string>) => {
    if (quizSubmitted) return;
    setDragMatches(prev => ({ ...prev, [id]: matches }));
  };

  // ── Scoring ──
  const calcScore = () => {
    let correct = 0;
    let total = 0;
    for (const q of lesson!.quiz) {
      const qType = q.type ?? 'multiple_choice';
      total++;
      if (qType === 'multiple_choice') {
        if (quizAnswers[q.id] === q.correct) correct++;
      } else if (qType === 'drag_order') {
        const userOrder = dragOrders[q.id] ?? q.orderedItems ?? [];
        const correctOrder = q.orderedItems ?? [];
        if (JSON.stringify(userOrder) === JSON.stringify(correctOrder)) correct++;
      } else if (qType === 'drag_match') {
        const pairs = q.pairs ?? [];
        const userMatches = dragMatches[q.id] ?? {};
        const allCorrect = pairs.every(p => userMatches[p.left] === p.right);
        if (allCorrect) correct++;
      }
    }
    return Math.round((correct / total) * 100);
  };

  const handleSubmitQuiz = () => {
    if (!isAllAnswered()) return;
    setQuizSubmitted(true);
    const score = calcScore();
    onComplete(lessonId, score);
    // GA4: lesson_complete event
    try {
      (window as any).trackEvent?.('lesson_complete', {
        lesson_id: lessonId,
        lesson_title: lesson?.title,
        quiz_score: score,
      });
    } catch {}
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setDragOrders({});
    setDragMatches({});
    setQuizSubmitted(false);
  };

  const quizScore = quizSubmitted
    ? (Object.keys(quizAnswers).length > 0 ? calcScore() : (storedScore ?? 0))
    : null;

  // ── All-answered check ──
  const isAllAnswered = () => {
    for (const q of lesson!.quiz) {
      const qType = q.type ?? 'multiple_choice';
      if (qType === 'multiple_choice') {
        if (quizAnswers[q.id] === undefined) return false;
      } else if (qType === 'drag_order') {
        // Consider answered if user has touched it (or use default order)
        // Allow submitting with default order — user may think it's correct
      } else if (qType === 'drag_match') {
        const pairs = q.pairs ?? [];
        const userMatches = dragMatches[q.id] ?? {};
        if (Object.keys(userMatches).length < pairs.length) return false;
      }
    }
    return true;
  };

  const answeredCount = (() => {
    let count = 0;
    for (const q of lesson.quiz) {
      const qType = q.type ?? 'multiple_choice';
      if (qType === 'multiple_choice' && quizAnswers[q.id] !== undefined) count++;
      else if (qType === 'drag_order') count++; // always countable (has default)
      else if (qType === 'drag_match') {
        const pairs = q.pairs ?? [];
        const userMatches = dragMatches[q.id] ?? {};
        if (Object.keys(userMatches).length >= pairs.length) count++;
      }
    }
    return count;
  })();

  // AI Explain handler
  const handleAiExplain = async (mode: 'eli5' | 'apply' | 'lost') => {
    if (!lesson) return;
    // If same mode clicked again, toggle off
    if (aiMode === mode && aiResult) { setAiMode(null); setAiResult(null); return; }
    setAiMode(mode);
    setAiResult(null);
    setAiError(null);
    setAiLoading(true);
    // Build a brief context from the first text/callout block
    const contextBlock = lesson.content.find(b => b.type === 'text' || b.type === 'callout');
    const lessonContext = contextBlock?.body ?? lesson.description;
    // 20-second timeout — Gemini can be slow on first call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonTitle: lesson.title, lessonContext, mode }),
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.explanation) setAiResult(data.explanation);
      else setAiError(data.message ?? 'Something went wrong.');
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e?.name === 'AbortError') {
        setAiError('The AI is taking too long. Please try again.');
      } else {
        setAiError('Could not reach the AI. Try again in a moment.');
      }
    } finally {
      setAiLoading(false);
    }
  };

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

      {/* Skill Level Selector — only shown if this lesson has leveled content */}
      {hasLeveledContent && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-foreground">Skill Level</div>
            {unlockedLevel !== 'advanced' && (
              <button
                onClick={onOpenAssessment}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                Take module assessment to unlock more
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {SKILL_LEVELS.map((lvl) => {
              const lvlOrder = levelOrder[lvl];
              const isUnlocked = lvlOrder <= unlockedOrder;
              const isActive = viewLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => isUnlocked && setViewLevel(lvl)}
                  disabled={!isUnlocked}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all",
                    isActive && isUnlocked
                      ? cn("border", LEVEL_COLORS[lvl])
                      : isUnlocked
                        ? "border-border text-muted-foreground hover:border-primary/50"
                        : "border-border/50 text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  {!isUnlocked && <Lock className="w-3 h-3 inline mr-1 mb-0.5 opacity-60" />}
                  {LEVEL_LABELS[lvl]}
                </button>
              );
            })}
          </div>
          {viewLevel !== 'novice' && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Showing <strong className="text-foreground">{LEVEL_LABELS[viewLevel]}</strong>-level content. Includes all Novice content plus deeper analysis.
            </p>
          )}
        </div>
      )}

      {/* Tab Navigation — sticky so it stays visible while scrolling */}
      <div className="sticky top-0 z-20 flex border-b border-border bg-background/95 backdrop-blur-sm -mx-4 px-4 lg:-mx-6 lg:px-6">
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
            // Skill level filtering
            if (block.level) {
              const blockOrder = levelOrder[block.level];
              // Block is above the user's unlocked level — show locked teaser
              if (blockOrder > unlockedOrder) {
                return (
                  <div key={i} className="bg-card border border-dashed border-border rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <div className="text-sm font-semibold text-foreground">{LEVEL_LABELS[block.level]} Content Locked</div>
                      <p className="text-xs text-muted-foreground text-center max-w-xs">
                        Pass the module assessment to unlock {LEVEL_LABELS[block.level]}-level content across all lessons.
                      </p>
                      {onOpenAssessment && (
                        <button
                          onClick={onOpenAssessment}
                          className="mt-1 text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors"
                        >
                          Take Module Assessment
                        </button>
                      )}
                    </div>
                    {/* Blurred preview of block heading */}
                    <div className="opacity-20 select-none">
                      {block.heading && <h2 className="font-semibold text-base mb-2">{block.heading}</h2>}
                      <p className="text-sm text-muted-foreground">{'█'.repeat(60)}</p>
                      <p className="text-sm text-muted-foreground mt-1">{'█'.repeat(40)}</p>
                    </div>
                  </div>
                );
              }
              // Block is at a level above what user is currently viewing — hide it
              if (blockOrder > viewOrder) {
                return null;
              }
            }
            // Render normally
            if (block.type === 'text') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h2 className="font-semibold text-base mb-3">{block.heading}</h2>}
                  {block.body && block.body.split('\n\n').filter(Boolean).map((para, pi) => (
                    <p key={pi} className={`text-sm text-muted-foreground leading-relaxed${pi > 0 ? ' mt-3' : ''}`}>
                      {para.trim().split(/\*\*([^*]+)\*\*/).map((seg, si) =>
                        si % 2 === 1 ? <strong key={si} className="font-semibold text-foreground">{seg}</strong> : seg
                      )}
                    </p>
                  ))}
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
                      {block.body && block.body.split('\n\n').filter(Boolean).map((para, pi) => (
                        <p key={pi} className={`text-sm text-muted-foreground leading-relaxed${pi > 0 ? ' mt-2' : ''}`}>{para.trim()}</p>
                      ))}
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
                      {block.body && block.body.split('\n\n').filter(Boolean).map((para, pi) => (
                        <p key={pi} className={`text-sm text-muted-foreground leading-relaxed${pi > 0 ? ' mt-2' : ''}`}>{para.trim()}</p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if (block.type === 'list') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h3 className="font-semibold text-sm mb-3">{block.heading}</h3>}
                  <ul className="space-y-0.5">
                    {block.items?.map((item, ii) => (
                      <ExpandableBulletItem
                        key={ii}
                        item={item}
                        lessonTitle={lesson!.title}
                        heading={block.heading}
                      />
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

            // ── wrap_rate_visual: stacked cost build-up graphic ─────────────
            if ((block as any).type === 'wrap_rate_visual') {
              const layers = [
                { label: 'Base Salary', sublabel: 'What you actually earn', amount: '$65.00/hr', color: 'bg-slate-500', width: '47%', icon: '👤' },
                { label: 'Fringe Benefits', sublabel: 'Health, PTO, retirement (32%)', amount: '+$20.80', color: 'bg-blue-500', width: '15%', icon: '🏥' },
                { label: 'Overhead', sublabel: 'Facilities, managers, IT (45%)', amount: '+$29.25', color: 'bg-violet-500', width: '21%', icon: '🏢' },
                { label: 'G&A', sublabel: 'CEO, legal, HR (12%)', amount: '+$13.81', color: 'bg-amber-500', width: '10%', icon: '📊' },
                { label: 'Fee / Profit', sublabel: 'Company profit (8%)', amount: '+$10.31', color: 'bg-emerald-500', width: '7%', icon: '💰' },
              ];
              return (
                <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  {/* Stacked bar */}
                  <div className="flex h-10 rounded-lg overflow-hidden gap-0.5">
                    {layers.map((l, li) => (
                      <div key={li} className={`${l.color} flex items-center justify-center`} style={{width: l.width}} title={l.label} />
                    ))}
                  </div>
                  {/* Legend rows */}
                  <div className="space-y-2">
                    {layers.map((l, li) => (
                      <div key={li} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${l.color}`} />
                        <span className="text-xl">{l.icon}</span>
                        <div className="flex-1">
                          <span className="text-sm font-semibold">{l.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{l.sublabel}</span>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{l.amount}</span>
                      </div>
                    ))}
                  </div>
                  {/* Total callout */}
                  <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-primary">Government pays: $139.17/hr</p>
                      <p className="text-xs text-muted-foreground">for an engineer earning $65/hr</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Wrap rate multiplier</p>
                      <p className="text-2xl font-black text-primary">2.14×</p>
                    </div>
                  </div>
                  {(block as any).explanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{(block as any).explanation}</p>
                  )}
                </div>
              );
            }

            // ── rate_comparison_visual: contractor size rate cards ───────────
            if ((block as any).type === 'rate_comparison_visual') {
              const companies = [
                {
                  label: 'Small Business', sublabel: 'Under 500 employees', icon: '🏪',
                  fringe: '28–35%', overhead: '40–70%', ga: '8–15%',
                  wrap: '2.5×–3.0×', color: 'border-blue-400/40 bg-blue-500/5',
                  badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                },
                {
                  label: 'Mid-Size', sublabel: 'SAIC, Leidos, CACI', icon: '🏬',
                  fringe: '30–38%', overhead: '50–80%', ga: '10–18%',
                  wrap: '2.8×–3.5×', color: 'border-violet-400/40 bg-violet-500/5',
                  badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                },
                {
                  label: 'Large Prime', sublabel: 'Lockheed, Raytheon, Boeing', icon: '🏭',
                  fringe: '32–42%', overhead: '60–100%', ga: '12–22%',
                  wrap: '3.0×–4.0×', color: 'border-amber-400/40 bg-amber-500/5',
                  badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="grid sm:grid-cols-3 gap-3">
                    {companies.map((c, ci) => (
                      <div key={ci} className={`rounded-xl border-2 ${c.color} p-4 space-y-3`}>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{c.icon}</span>
                          <div>
                            <p className="text-sm font-bold">{c.label}</p>
                            <p className="text-[11px] text-muted-foreground">{c.sublabel}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { name: 'Fringe', val: c.fringe },
                            { name: 'Overhead', val: c.overhead },
                            { name: 'G&A', val: c.ga },
                          ].map((row, ri) => (
                            <div key={ri} className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">{row.name}</span>
                              <span className="text-xs font-semibold">{row.val}</span>
                            </div>
                          ))}
                        </div>
                        <div className={`rounded-lg px-3 py-2 text-center ${c.badge}`}>
                          <p className="text-[11px] font-medium opacity-70">Wrap Rate</p>
                          <p className="text-lg font-black">{c.wrap}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Large primes have higher rates because of larger corporate overhead structures — not necessarily because they're less efficient. DCAA monitors all of these.</p>
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

            if (block.type === 'expandable_list') {
              return (
                <div key={i} className="space-y-2">
                  {block.heading && (
                    <div className="px-1 mb-1">
                      <h3 className="font-semibold text-sm text-foreground">{block.heading}</h3>
                      {block.body && <p className="text-xs text-muted-foreground mt-0.5">{block.body}</p>}
                    </div>
                  )}
                  {block.expandableItems?.map((item, ei) => (
                    <ExpandableListItemCard key={ei} item={item} />
                  ))}
                </div>
              );
            }

            if (block.type === 'risk_chart') {
              // contractorColor: how risky is it FOR THE CONTRACTOR (high % = red)
              // govColor: how risky is it FOR THE GOVERNMENT (high % = amber/red)
              const contracts = [
                { name: 'FFP',  full: 'Firm-Fixed-Price',             contractorRisk: 100, govRisk: 0,  costRisk: 'Contractor', perfRisk: 'Contractor' },
                { name: 'FPIF', full: 'Fixed-Price Incentive (Firm)', contractorRisk: 70,  govRisk: 30, costRisk: 'Shared',     perfRisk: 'Contractor' },
                { name: 'CPIF', full: 'Cost-Plus-Incentive-Fee',      contractorRisk: 25,  govRisk: 75, costRisk: 'Government', perfRisk: 'Shared'     },
                { name: 'CPAF', full: 'Cost-Plus-Award-Fee',          contractorRisk: 15,  govRisk: 85, costRisk: 'Government', perfRisk: 'Gov (FDO)'  },
                { name: 'CPFF', full: 'Cost-Plus-Fixed-Fee',          contractorRisk: 10,  govRisk: 90, costRisk: 'Government', perfRisk: 'Shared'     },
                { name: 'T&M',  full: 'Time & Materials',             contractorRisk: 5,   govRisk: 95, costRisk: 'Government', perfRisk: 'Government' },
              ];
              // Contractor risk: high = red (bad for contractor), low = green (safe for contractor)
              const contractorColor = (pct: number) => pct >= 70 ? '#dc2626' : pct >= 40 ? '#ea580c' : pct >= 15 ? '#d97706' : '#16a34a';
              // Gov risk: high = amber/red (bad for gov), low = slate (safe for gov)
              const govColor = (pct: number) => pct >= 80 ? '#b45309' : pct >= 50 ? '#d97706' : pct >= 20 ? '#ca8a04' : '#64748b';
              return (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border bg-muted/30">
                    <h3 className="font-semibold text-sm">Risk Allocation by Contract Type</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Who absorbs cost overruns — red means that side bears more risk</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-5 text-xs">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />Contractor bears risk</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-600 inline-block" />Government bears risk</div>
                    </div>
                    {contracts.map((c) => (
                      <div key={c.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-10 text-foreground">{c.name}</span>
                            <span className="text-muted-foreground text-[10px] hidden sm:inline">{c.full}</span>
                          </div>
                          <span className="text-muted-foreground text-[10px]">Cost: <span className="font-medium text-foreground">{c.costRisk}</span> · Perf: <span className="font-medium text-foreground">{c.perfRisk}</span></span>
                        </div>
                        <div className="flex h-6 rounded-lg overflow-hidden w-full gap-0.5">
                          <div className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            style={{ width: `${c.contractorRisk}%`, backgroundColor: contractorColor(c.contractorRisk), minWidth: c.contractorRisk > 0 ? '2px' : '0' }}>
                            {c.contractorRisk >= 20 ? `${c.contractorRisk}%` : ''}
                          </div>
                          <div className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            style={{ width: `${c.govRisk}%`, backgroundColor: govColor(c.govRisk), minWidth: c.govRisk > 0 ? '2px' : '0' }}>
                            {c.govRisk >= 20 ? `${c.govRisk}%` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-[11px] text-muted-foreground italic pt-2 border-t border-border">The higher the contractor risk, the more they’re on the hook for cost overruns. The higher the government risk, the more taxpayers absorb when things go wrong.</p>
                  </div>
                </div>
              );
            }

            // ── lucas_note: personal aside ───────────────────────────────────
            if (block.type === 'lucas_note') {
              return (
                <div key={i} className="bg-[#0d2137] border-2 border-primary/60 rounded-xl overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-[#f5c842] via-primary to-[#f5c842]" />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">L</div>
                      <span className="text-[10px] font-black text-[#f5c842] uppercase tracking-[0.2em]">From Lucas</span>
                    </div>
                    {block.body && block.body.split('\n\n').filter(Boolean).map((para: string, pi: number) => (
                      <p key={pi} className={`text-sm text-slate-200 leading-relaxed${pi > 0 ? ' mt-3' : ''}`}>
                        {para.trim().split(/\*\*([^*]+)\*\*/).map((seg: string, si: number) =>
                          si % 2 === 1
                            ? <strong key={si} className="font-bold text-[#f5c842]">{seg}</strong>
                            : seg
                        )}
                      </p>
                    ))}
                    <div className="flex items-center gap-2 mt-4">
                      <div className="h-px flex-1 bg-primary/20" />
                      <span className="text-[10px] text-primary/50 italic">— Lucas, Acqlerate</span>
                    </div>
                  </div>
                </div>
              );
            }

            // ── instrument_compare: IDIQ / Task Order / BPA side-by-side ────────
            if (block.type === 'instrument_compare') {
              const cols = [
                {
                  icon: '📋', label: 'IDIQ Base Contract', color: 'text-primary',
                  tagline: 'The umbrella',
                  rows: [
                    { key: 'What it is', val: 'Legal framework, terms, rates, ceiling. No specific work authorized.' },
                    { key: 'Competed', val: 'Once — full & open or small biz set-aside.' },
                    { key: 'Money obligated', val: 'Only the minimum guarantee at award.' },
                    { key: 'Period', val: 'Ordering period, e.g. 5+5 years.' },
                    { key: 'Modify to change', val: 'Rates, ceiling, ordering period, clauses.' },
                  ]
                },
                {
                  icon: '📝', label: 'Task Order', color: 'text-amber-400',
                  tagline: 'The actual work',
                  rows: [
                    { key: 'What it is', val: 'Specific scope, deliverables, funding. This is what the contractor actually executes.' },
                    { key: 'Competed', val: 'Each order — fair opportunity among pool holders (FAR 16.505).' },
                    { key: 'Money obligated', val: 'Full amount of each order — this is where revenue lives.' },
                    { key: 'Period', val: 'Task order PoP — can extend past IDIQ ordering period.' },
                    { key: 'Modify to change', val: 'Scope or funding on that specific task only.' },
                  ]
                },
                {
                  icon: '🛒', label: 'BPA', color: 'text-slate-400',
                  tagline: 'A pre-arranged account',
                  rows: [
                    { key: 'What it is', val: 'Simplified ordering arrangement against GSA Schedule. No guaranteed min/max.' },
                    { key: 'Competed', val: 'Once at BPA establishment — schedule price competition.' },
                    { key: 'Money obligated', val: 'At time of call (order) placement.' },
                    { key: 'Period', val: 'Typically 1 year, renewable.' },
                    { key: 'Modify to change', val: 'Terms of the BPA arrangement.' },
                  ]
                },
              ];
              return (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border bg-muted/30">
                    <h3 className="font-semibold text-sm">Three Instruments — One Layered System</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Winning an IDIQ is a hunting license, not a paycheck. The task order is where money flows.</p>
                  </div>
                  {/* Column headers */}
                  <div className="grid grid-cols-3 border-b border-border">
                    {cols.map(col => (
                      <div key={col.label} className="px-4 py-3.5 border-r border-border last:border-r-0 text-center">
                        <div className="text-xl mb-1">{col.icon}</div>
                        <div className={`text-xs font-bold ${col.color} leading-tight`}>{col.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 italic">{col.tagline}</div>
                      </div>
                    ))}
                  </div>
                  {/* Comparison rows */}
                  {cols[0].rows.map((_, ri) => (
                    <div key={ri} className={`grid grid-cols-3 ${ri % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      {cols.map((col, ci) => (
                        <div key={ci} className="px-4 py-3 border-r border-border/50 last:border-r-0">
                          {ci === 0 && <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{col.rows[ri].key}</div>}
                          <div className="text-xs text-muted-foreground leading-relaxed">{col.rows[ri].val}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            }

            // ── highlight: punchy single-insight callout ───────────────────────
            if (block.type === 'highlight') {
              return (
                <div key={i} className="border-l-4 border-primary pl-5 py-3">
                  <p className="text-base font-semibold text-foreground leading-snug">
                    {block.body?.split(/\*\*([^*]+)\*\*/).map((seg: string, si: number) =>
                      si % 2 === 1 ? <span key={si} className="text-primary">{seg}</span> : seg
                    )}
                  </p>
                  {block.subtext && <p className="text-xs text-muted-foreground mt-1.5 italic">{block.subtext}</p>}
                </div>
              );
            }

            // ── stat_row: 2–4 KPI cards with big number + label ───────────────
            if (block.type === 'stat_row') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h3 className="font-semibold text-sm mb-4">{block.heading}</h3>}
                  <div className={`grid gap-3 ${ (block.stats?.length ?? 0) <= 2 ? 'grid-cols-2' : (block.stats?.length ?? 0) === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                    {block.stats?.map((stat: any, si: number) => (
                      <div key={si} className="bg-muted/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-primary leading-none mb-1">{stat.value}</div>
                        <div className="text-xs font-semibold text-foreground mb-1">{stat.label}</div>
                        {stat.sub && <div className="text-[11px] text-muted-foreground leading-tight">{stat.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // ── lesson_image: inline image with optional caption ───────────
            if (block.type === 'lesson_image') {
              return (
                <div key={i} className="rounded-xl overflow-hidden border border-border">
                  <img src={block.src} alt={block.alt || ''} className="w-full h-auto" loading="lazy" />
                  {block.caption && (
                    <div className="px-4 py-2.5 bg-muted/30 text-xs text-muted-foreground italic text-center">{block.caption}</div>
                  )}
                </div>
              );
            }

            // ── evm_visual: CPI/SPI traffic light gauge ──────────────────
            if (block.type === 'evm_visual') {
              const gauges = block.gauges || [];
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h3 className="font-bold text-sm mb-1">{block.heading}</h3>}
                  {block.sub && <p className="text-xs text-muted-foreground mb-4">{block.sub}</p>}
                  <div className="grid grid-cols-1 gap-3">
                    {gauges.map((g: any, gi: number) => {
                      const val = g.value;
                      const isGood = val >= 1.0;
                      const isWarn = val >= 0.9 && val < 1.0;
                      const isBad = val < 0.9;
                      const color = isGood ? '#22c55e' : isWarn ? '#f59e0b' : '#ef4444';
                      const label = isGood ? 'ON TRACK' : isWarn ? 'WATCH' : 'AT RISK';
                      const pct = Math.min(Math.max((val / 1.3) * 100, 5), 100);
                      return (
                        <div key={gi} className="bg-muted/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-xs font-black uppercase tracking-widest" style={{color}}>{g.name}</span>
                              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{background: color+'22', color}}>{label}</span>
                            </div>
                            <span className="text-2xl font-black" style={{color}}>{val.toFixed(2)}</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{width: `${pct}%`, background: color}} />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">{g.formula}</span>
                            <span className="text-[10px] text-muted-foreground">{g.meaning}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {block.note && <p className="text-xs text-muted-foreground mt-3 italic border-t border-border/40 pt-3">{block.note}</p>}
                </div>
              );
            }

            // ── visual_spectrum: horizontal spectrum bar ──────────────────
            if (block.type === 'visual_spectrum') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h3 className="font-bold text-sm mb-1">{block.heading}</h3>}
                  {block.sub && <p className="text-xs text-muted-foreground mb-4">{block.sub}</p>}
                  <div className="relative mt-2">
                    <div className="flex rounded-xl overflow-hidden h-10">
                      {block.segments?.map((seg: any, si: number) => (
                        <div key={si} className="flex items-center justify-center flex-1 text-[10px] font-black text-white uppercase tracking-wide" style={{background: seg.color}}>
                          {seg.label}
                        </div>
                      ))}
                    </div>
                    <div className="flex mt-2">
                      {block.segments?.map((seg: any, si: number) => (
                        <div key={si} className="flex-1 text-center px-1">
                          <div className="text-[10px] font-bold" style={{color: seg.color}}>{seg.title}</div>
                          <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{seg.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {block.note && <p className="text-xs text-muted-foreground mt-3 italic border-t border-border/40 pt-3">{block.note}</p>}
                </div>
              );
            }

            // ── funding_flow: visual budget flow diagram ──────────────────
            if (block.type === 'funding_flow') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h3 className="font-bold text-sm mb-1">{block.heading}</h3>}
                  {block.sub && <p className="text-xs text-muted-foreground mb-4">{block.sub}</p>}
                  <div className="space-y-2">
                    {block.steps?.map((step: any, si: number) => (
                      <div key={si}>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black" style={{background: step.color || '#01696f'}}>{si + 1}</div>
                          <div className="flex-1 rounded-lg p-3" style={{background: (step.color || '#01696f') + '18', borderLeft: `3px solid ${step.color || '#01696f'}`}}>
                            <div className="text-xs font-black" style={{color: step.color || '#01696f'}}>{step.phase}</div>
                            <div className="text-xs text-foreground font-medium">{step.desc}</div>
                            {step.note && <div className="text-[10px] text-muted-foreground mt-0.5">{step.note}</div>}
                          </div>
                        </div>
                        {si < (block.steps?.length ?? 0) - 1 && (
                          <div className="ml-3.5 w-0.5 h-3 bg-border mx-auto" style={{marginLeft: '13px'}} />
                        )}
                      </div>
                    ))}
                  </div>
                  {block.note && <p className="text-xs text-muted-foreground mt-3 italic border-t border-border/40 pt-3">{block.note}</p>}
                </div>
              );
            }

            // ── two_col: label | explanation rows ──────────────────────────
            if (block.type === 'two_col') {
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  {block.heading && <h3 className="font-semibold text-sm mb-4">{block.heading}</h3>}
                  <div className="space-y-0">
                    {block.rows?.map((row: any, ri: number) => (
                      <div key={ri} className={`flex gap-4 py-3 ${ri < (block.rows?.length ?? 0) - 1 ? 'border-b border-border/50' : ''}`}>
                        <div className="w-28 flex-shrink-0 pt-0.5">
                          <span className="text-xs font-bold text-primary uppercase tracking-wide leading-tight">{row.label}</span>
                          {row.badge && <span className="block mt-0.5 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium w-fit">{row.badge}</span>}
                        </div>
                        <div className="flex-1 text-sm text-muted-foreground leading-relaxed">{row.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* AI Explain Panel */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
            {/* Header row with 3 buttons */}
            <div className="px-5 py-3.5 border-b border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">AI Study Assistant</span>
                <span className="text-xs text-muted-foreground ml-1">Powered by Gemini</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleAiExplain('eli5')}
                  data-testid="ai-eli5"
                  className={cn(
                    "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                    aiMode === 'eli5'
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <BrainCircuit className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-xs">Explain Like I'm 5</div>
                    <div className={cn("text-[11px]", aiMode === 'eli5' ? "text-primary-foreground/70" : "text-muted-foreground")}>Simple analogy, plain English</div>
                  </div>
                </button>
                {isLifetime ? (
                  <button
                    onClick={() => handleAiExplain('apply')}
                    data-testid="ai-apply"
                    className={cn(
                      "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                      aiMode === 'apply'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">How Do I Apply This?</div>
                      <div className={cn("text-[11px]", aiMode === 'apply' ? "text-primary-foreground/70" : "text-muted-foreground")}>Real PM scenarios & examples</div>
                    </div>
                  </button>
                ) : (
                  <div
                    data-testid="ai-apply-locked"
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border/60 text-sm text-left cursor-default opacity-60"
                    title="Upgrade to Lifetime to unlock"
                  >
                    <Lock className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-xs text-muted-foreground">How Do I Apply This?</div>
                      <div className="text-[11px] text-muted-foreground/70">Lifetime plan — <a href="/#/upgrade" className="underline hover:text-primary">upgrade</a></div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => handleAiExplain('lost')}
                  data-testid="ai-lost"
                  className={cn(
                    "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                    aiMode === 'lost'
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <HelpCircle className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-xs">I'm Still Lost</div>
                    <div className={cn("text-[11px]", aiMode === 'lost' ? "text-primary-foreground/70" : "text-muted-foreground")}>Different approach, re-explained</div>
                  </div>
                </button>
              </div>
            </div>
            {/* Result area */}
            {(aiLoading || aiResult || aiError) && (
              <div className="px-5 py-4 relative">
                {!aiLoading && (
                  <button
                    onClick={() => { setAiMode(null); setAiResult(null); setAiError(null); }}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Thinking...
                  </div>
                )}
                {aiError && (
                  <p className="text-sm text-red-500">{aiError}</p>
                )}
                {aiResult && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {aiMode === 'eli5' ? 'Simple Explanation' : aiMode === 'apply' ? 'How to Apply as a PM' : 'Re-Explained'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiResult}</p>
                  </div>
                )}
              </div>
            )}
          </div>

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
            const qType = question.type ?? 'multiple_choice';

            // ── Multiple Choice ──
            if (qType === 'multiple_choice') {
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
                            {option.split('|||')[0]}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className={cn(
                      "ml-8 rounded-lg p-3 text-xs leading-relaxed border",
                      isCorrect
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
                        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                    )} data-testid={`explanation-${qi}`}>
                      <strong className="font-semibold">{isCorrect ? "✓ Correct!" : "✗ Incorrect."}</strong>{" "}
                      {question.explanation || question.options[question.correct]?.split('|||')[1] || ""}
                    </div>
                  )}
                </div>
              );
            }

            // ── Drag Order ──
            if (qType === 'drag_order') {
              const userOrder = dragOrders[question.id] ?? question.orderedItems ?? [];
              const correctOrder = question.orderedItems ?? [];
              const isCorrect = quizSubmitted && JSON.stringify(userOrder) === JSON.stringify(correctOrder);

              return (
                <div key={question.id} className="bg-card border border-border rounded-xl p-5 space-y-3" data-testid={`question-${qi}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {qi + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm leading-relaxed">{question.question}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <GripVertical className="w-2.5 h-2.5" /> Drag to Order
                      </span>
                    </div>
                  </div>

                  <DragOrderQuestion
                    question={question}
                    submitted={quizSubmitted}
                    onOrderChange={handleOrderChange}
                    currentOrder={userOrder}
                  />

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
            }

            // ── Drag Match ──
            if (qType === 'drag_match') {
              const pairs = question.pairs ?? [];
              const userMatches = dragMatches[question.id] ?? {};
              const allCorrect = quizSubmitted && pairs.every(p => userMatches[p.left] === p.right);

              return (
                <div key={question.id} className="bg-card border border-border rounded-xl p-5 space-y-3" data-testid={`question-${qi}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {qi + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm leading-relaxed">{question.question}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <ArrowRight className="w-2.5 h-2.5" /> Drag to Match
                      </span>
                    </div>
                  </div>

                  <DragMatchQuestion
                    question={question}
                    submitted={quizSubmitted}
                    onMatchChange={handleMatchChange}
                    currentMatches={userMatches}
                  />

                  {quizSubmitted && (
                    <div className={cn(
                      "ml-8 rounded-lg p-3 text-xs leading-relaxed border",
                      allCorrect
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
                        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                    )} data-testid={`explanation-${qi}`}>
                      <strong className="font-semibold">{allCorrect ? "✓ All Correct!" : "✗ Some incorrect."}</strong>{" "}
                      {question.explanation}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}

          {/* Submit */}
          {!quizSubmitted && (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!isAllAnswered()}
              className="w-full"
              data-testid="submit-quiz"
            >
              Submit Quiz ({answeredCount}/{lesson.quiz.length} answered)
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
