import { useState, useRef } from "react";
import { getTrackData, type CareerTrackId } from "@/lib/careerTracks";
import { modules, type Lesson, type Module, type QuizQuestion, type SkillLevel, type ExpandableItem } from "@/lib/curriculum";
import type { UserProgress } from "@/lib/progress";
import {
  ArrowLeft, ChevronRight, CheckCircle, BookOpen, AlertTriangle,
  Lightbulb, Table, Clock, Award, RotateCcw, ChevronDown, ChevronUp,
  GripVertical, ArrowRight, Lock, ChevronUp as LevelUp,
  Sparkles, BrainCircuit, HelpCircle, Briefcase, Loader2, X,
  Download, FileText
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
  activeCareer?: string | null;
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

export default function LessonPage({ lessonId, progress, onBack, onComplete, onNextLesson, unlockedLevel = 'novice', onOpenAssessment, isLifetime = false, activeCareer }: LessonPageProps) {
  const trackData = getTrackData((activeCareer as CareerTrackId) ?? null);
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
  const [expandedProcessStep, setExpandedProcessStep] = useState<number | null>(null);
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
  const hasLeveledContent = (lesson.content ?? []).some(b => b.level !== undefined);

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
    for (const q of (lesson!.quiz ?? [])) {
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
    for (const q of (lesson!.quiz ?? [])) {
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
    for (const q of (lesson.quiz ?? [])) {
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
    const contextBlock = (lesson.content ?? []).find(b => b.type === 'text' || b.type === 'callout');
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
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-muted-foreground">{mod.title}</span>
              {trackData && (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
                  Your path: {trackData.shortLabel}
                </span>
              )}
            </div>
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
              {(lesson.quiz ?? []).length > 0 && (
                <span>{(lesson.quiz ?? []).length} quiz questions</span>
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

      {/* Prominent Download Banner — real-world example document(s) for this lesson */}
      {lesson.attachments && lesson.attachments.length > 0 && (
        <div className="rounded-xl bg-primary text-primary-foreground p-4 sm:p-5 flex items-center gap-4 flex-wrap shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm font-bold">
              {lesson.attachments.length === 1 ? 'Real-world example document included' : `${lesson.attachments.length} real-world example documents included`}
            </div>
            <div className="text-xs text-primary-foreground/80 mt-0.5">
              {lesson.attachments.map(a => a.title.replace('Example: ', '')).join(' · ')}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {lesson.attachments.map((att, ai) => (
              <a
                key={ai}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white text-primary font-bold text-xs px-3.5 py-2 rounded-lg hover:bg-white/90 transition-colors flex-shrink-0"
                data-testid={`banner-download-${ai}`}
              >
                <Download className="w-3.5 h-3.5" />
                {lesson.attachments!.length === 1 ? 'Download PDF' : `Download ${ai + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}

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
          const labels: Record<Tab, string> = { lesson: 'Lesson', terms: `Key Terms (${lesson!.keyTerms.length})`, quiz: `Quiz (${(lesson!.quiz ?? []).length}Q)` };
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
          {/* Levels-based lessons (sections format) */}
          {!(lesson.content?.length) && (lesson as any).levels && (() => {
            const lvl = (lesson as any).levels[viewLevel] ?? (lesson as any).levels['novice'];
            if (!lvl?.sections) return null;
            return lvl.sections.map((section: any, si: number) => (
              <div key={si} className="space-y-3">
                {section.heading && <h3 className="font-bold text-sm text-foreground">{section.heading}</h3>}
                {section.content && <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>}
                {section.items && (
                  <ul className="space-y-2">
                    {section.items.map((item: string, ii: number) => {
                      const [label, desc] = item.split('|||');
                      return (
                        <li key={ii} className="bg-card border border-border rounded-xl p-4">
                          <p className="font-semibold text-sm text-foreground">{label}</p>
                          {desc && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ));
          })()}

          {/* Standard content-array lessons */}
          {(lesson.content ?? []).map((block, i) => {
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


            // ── table_visual: clean card-style table (replaces raw table type) ──
            if ((block as any).type === 'table_visual') {
              const b = block as any;
              return (
                <div key={i} className="space-y-2">
                  {b.heading && <h3 className="font-bold text-sm">{b.heading}</h3>}
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      {b.headers && (
                        <thead>
                          <tr className="bg-muted/60 border-b border-border">
                            {b.headers.map((h: string, hi: number) => (
                              <th key={hi} className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {b.rows?.map((row: string[], ri: number) => (
                          <tr key={ri} className={`border-b border-border/50 last:border-0 ${ri % 2 === 0 ? '' : 'bg-muted/20'}`}>
                            {row.map((cell: string, ci: number) => (
                              <td key={ci} className={`px-4 py-2.5 text-xs leading-relaxed ${ci === 0 ? 'font-semibold' : 'text-muted-foreground'}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {b.explanation && <p className="text-xs text-muted-foreground leading-relaxed">{b.explanation}</p>}
                </div>
              );
            }

            // ── burn_rate_visual ──────────────────────────────────────────────
            if ((block as any).type === 'burn_rate_visual') {
              return (
                <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h3 className="font-bold text-sm">{(block as any).heading}</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Total Obligation Authority', symbol: '÷', desc: 'Total funded ceiling on the contract', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: '💵' },
                      { label: 'Execution Months', symbol: '=', desc: 'Months in the period of performance', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', icon: '📅' },
                      { label: 'Monthly Burn Rate', symbol: '', desc: 'What you should be spending per month', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: '🔥' },
                    ].map((item, ii) => (
                      <div key={ii} className={`rounded-xl p-4 ${item.color.split(' ')[0]} border border-border/50 text-center`}>
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <p className={`text-sm font-bold ${item.color.split(' ').slice(1).join(' ')}`}>{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-4">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">⚠️ Red flag: If actual spend {'>'} burn rate target — you're on track to exhaust funding early</p>
                    <p className="text-xs text-muted-foreground">Finance tracks burn rate weekly. A PM who ignores it ends up with zero funds and a team who can't work.</p>
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── color_of_money_visual ─────────────────────────────────────────
            if ((block as any).type === 'color_of_money_visual') {
              const moneys = [
                { color: '#4f86c6', label: 'RDT&E', full: 'Research, Development, Test & Evaluation', uses: 'Developing & testing new systems', expires: '2 years', icon: '🔬' },
                { color: '#5cb85c', label: 'Procurement', full: 'Procurement Appropriations', uses: 'Buying production units & end items', expires: '3 years', icon: '🛒' },
                { color: '#f0ad4e', label: 'O&M', full: 'Operations & Maintenance', uses: 'Day-to-day services & operations', expires: '1 year', icon: '⚙️' },
                { color: '#d9534f', label: 'MILCON', full: 'Military Construction', uses: 'Building facilities & infrastructure', expires: '5 years', icon: '🏗️' },
                { color: '#9b59b6', label: 'MPAF', full: 'Military Personnel', uses: 'Salaries & allowances for military members', expires: '1 year', icon: '🎖️' },
              ];
              return (
                <div key={i} className="space-y-3">
                  <h3 className="font-bold text-sm">{(block as any).heading}</h3>
                  <p className="text-xs text-muted-foreground">Every dollar is tagged to a purpose. Spend it on the wrong thing and you've violated federal law.</p>
                  <div className="space-y-2">
                    {moneys.map((m, mi) => (
                      <div key={mi} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{backgroundColor: m.color}}>{m.label}</div>
                        <span className="text-xl flex-shrink-0">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{m.full}</p>
                          <p className="text-xs text-muted-foreground">{m.uses}</p>
                        </div>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full whitespace-nowrap">{m.expires}</span>
                      </div>
                    ))}
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── evm_metrics_visual (EVM core metrics) ────────────────────────
            if ((block as any).type === 'evm_metrics_visual') {
              const metrics = [
                { abbr: 'CV', name: 'Cost Variance', formula: 'EV − AC', good: 'Positive = under budget', bad: 'Negative = over budget', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
                { abbr: 'SV', name: 'Schedule Variance', formula: 'EV − PV', good: 'Positive = ahead of schedule', bad: 'Negative = behind schedule', color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10' },
                { abbr: 'CPI', name: 'Cost Performance Index', formula: 'EV ÷ AC', good: '> 1.0 = under budget', bad: '< 1.0 = over budget', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
                { abbr: 'SPI', name: 'Schedule Performance Index', formula: 'EV ÷ PV', good: '> 1.0 = ahead of schedule', bad: '< 1.0 = behind schedule', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {metrics.map((m, mi) => (
                      <div key={mi} className="rounded-xl border border-border bg-card p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${m.color}`}>{m.abbr}</span>
                          <span className="text-sm font-semibold">{m.name}</span>
                        </div>
                        <div className={`text-base font-mono font-bold px-3 py-1.5 rounded-lg ${m.color}`}>{m.formula}</div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ {m.good}</p>
                          <p className="text-xs text-destructive">✗ {m.bad}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // ── eac_quick_visual ──────────────────────────────────────────────
            if ((block as any).type === 'eac_quick_visual') {
              const methods = [
                { formula: 'BAC ÷ CPI', when: 'Most common — assumes same efficiency going forward', color: 'border-primary/40 bg-primary/5' },
                { formula: 'AC + (BAC − EV)', when: 'Remaining work at original planned rate', color: 'border-blue-400/40 bg-blue-500/5' },
                { formula: 'AC + Re-estimate', when: 'You have a specific bottom-up re-estimate', color: 'border-violet-400/40 bg-violet-500/5' },
                { formula: 'AC + (BAC − EV) ÷ (CPI × SPI)', when: 'Both cost AND schedule are in trouble', color: 'border-amber-400/40 bg-amber-500/5' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="space-y-2">
                    {methods.map((m, mi) => (
                      <div key={mi} className={`flex items-center gap-4 p-3 rounded-xl border-2 ${m.color}`}>
                        <code className="text-sm font-mono font-bold whitespace-nowrap">{m.formula}</code>
                        <span className="text-xs text-muted-foreground">{m.when}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // ── eac_methods_visual ────────────────────────────────────────────
            if ((block as any).type === 'eac_methods_visual') {
              const methods_b = [
                { num: '1', formula: 'BAC ÷ CPI', title: 'Trend Continuation', when: 'Future work will mirror past efficiency', best: 'Stable programs', color: 'border-primary/40 bg-primary/5 text-primary' },
                { num: '2', formula: 'AC + (BAC − EV)', title: 'Optimistic Reset', when: 'Remaining work at original planned rate', best: 'One-time anomaly caused the overrun', color: 'border-blue-400/40 bg-blue-500/5 text-blue-600 dark:text-blue-400' },
                { num: '3', formula: 'AC + Re-estimate', title: 'Bottom-Up', when: 'You re-estimated remaining work from scratch', best: 'Major scope change or re-baseline', color: 'border-violet-400/40 bg-violet-500/5 text-violet-600 dark:text-violet-400' },
                { num: '4', formula: 'AC + (BAC−EV) ÷ (CPI×SPI)', title: 'Composite', when: 'Both cost and schedule are degraded', best: 'Programs in double trouble', color: 'border-amber-400/40 bg-amber-500/5 text-amber-600 dark:text-amber-400' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {methods_b.map((m, mi) => (
                      <div key={mi} className={`rounded-xl border-2 p-4 space-y-2 ${m.color.split(' ').slice(0,2).join(' ')}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${m.color.split(' ')[0].replace('border-','bg-').replace('/40','')}`}>{m.num}</span>
                          <span className="text-sm font-bold">{m.title}</span>
                        </div>
                        <code className={`text-sm font-mono block font-bold ${m.color.split(' ')[2]}`}>{m.formula}</code>
                        <p className="text-xs text-muted-foreground">{m.when}</p>
                        <p className="text-[11px] bg-muted/60 rounded px-2 py-1">Best for: {m.best}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // ── vac_tcpi_visual ───────────────────────────────────────────────
            if ((block as any).type === 'vac_tcpi_visual') {
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border-2 border-blue-400/40 bg-blue-500/5 p-4 space-y-2">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">VAC</span>
                      <p className="text-sm font-bold">Variance at Completion</p>
                      <code className="text-base font-mono font-bold text-blue-600 dark:text-blue-400 block">BAC − EAC</code>
                      <div className="space-y-0.5 text-xs">
                        <p className="text-emerald-600 dark:text-emerald-400">✓ Positive = projected underrun (good)</p>
                        <p className="text-destructive">✗ Negative = projected overrun (bad)</p>
                      </div>
                    </div>
                    <div className="rounded-xl border-2 border-violet-400/40 bg-violet-500/5 p-4 space-y-2">
                      <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-wide">TCPI</span>
                      <p className="text-sm font-bold">To-Complete Performance Index</p>
                      <code className="text-base font-mono font-bold text-violet-600 dark:text-violet-400 block">(BAC − EV) ÷ (BAC − AC)</code>
                      <div className="space-y-0.5 text-xs">
                        <p className="text-emerald-600 dark:text-emerald-400">✓ {'<'} 1.0 = achievable</p>
                        <p className="text-amber-600 dark:text-amber-400">⚠ {'>'} 1.1 = essentially unachievable</p>
                      </div>
                    </div>
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── contractor_finance_waterfall_visual ───────────────────────────
            if ((block as any).type === 'contractor_finance_waterfall_visual') {
              const bars = [
                { label: 'Contract Price', sub: 'What gov pays', value: 100, pct: 100, color: '#3b82f6', textColor: 'text-blue-400' },
                { label: 'Direct Labor', sub: 'Salaries on the contract', value: -45, pct: 45, color: '#ef4444', textColor: 'text-red-400' },
                { label: 'Subcontractors', sub: 'Work you pass through', value: -15, pct: 15, color: '#f97316', textColor: 'text-orange-400' },
                { label: 'Materials/ODCs', sub: 'Equipment, travel, supplies', value: -10, pct: 10, color: '#f59e0b', textColor: 'text-amber-400' },
                { label: 'Gross Profit', sub: '30 cents left before overhead', value: 30, pct: 30, color: '#10b981', textColor: 'text-emerald-400', divider: true },
                { label: 'Overhead', sub: 'Facilities, IT, division mgmt', value: -12, pct: 12, color: '#8b5cf6', textColor: 'text-violet-400' },
                { label: 'G&A', sub: 'CEO, HR, legal, corporate', value: -8, pct: 8, color: '#6366f1', textColor: 'text-indigo-400' },
                { label: 'Operating Profit', sub: 'What the business actually earns', value: 10, pct: 10, color: '#14b8a6', textColor: 'text-teal-400', divider: true },
              ];
              return (
                <div key={i} className="space-y-4">
                  {(block as any).heading && <h3 className="font-bold text-base text-foreground">{(block as any).heading}</h3>}
                  <p className="text-xs text-muted-foreground">For every $100 the government pays, here is where it goes. These are typical defense services numbers.</p>
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
                    {bars.map((bar, bi) => (
                      <div key={bi}>
                        {bar.divider && bi > 0 && <div className="border-t border-border/60 my-3" />}
                        <div className="flex items-center gap-3">
                          <div className="w-32 flex-shrink-0">
                            <p className="text-xs font-semibold text-foreground truncate">{bar.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">{bar.sub}</p>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 bg-muted/40 rounded-full h-6 overflow-hidden">
                              <div
                                className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
                                style={{ width: `${bar.pct}%`, background: bar.color + (bar.value < 0 ? '99' : 'dd') }}
                              >
                                <span className="text-[10px] font-black text-white">{bar.value > 0 ? `$${bar.value}` : `-$${bar.pct}`}</span>
                              </div>
                            </div>
                            <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${bar.textColor}`}>
                              {bar.value > 0 ? `+${bar.pct}%` : `-${bar.pct}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Numbers vary by company size and contract type. Large primes often see operating margin of 6-9%. Small businesses can hit 12-18% on FFP work.</p>
                </div>
              );
            }

            // ── fee_type_comparison_visual ────────────────────────────────────
            if ((block as any).type === 'fee_type_comparison_visual') {
              const feeTypes = [
                {
                  label: 'CPFF',
                  name: 'Cost-Plus Fixed Fee',
                  emoji: '🔒',
                  tagline: 'Guaranteed paycheck. No upside.',
                  analogy: 'Like a salary. You get paid the same no matter how efficient you are.',
                  fee: '7-10%',
                  risk: 'Zero',
                  upside: 'None',
                  when: 'R&D, new development, high uncertainty',
                  color: '#3b82f6',
                  bg: 'bg-blue-500/10',
                  border: 'border-blue-500/30',
                  riskDots: 1,
                  rewardDots: 1,
                },
                {
                  label: 'CPAF',
                  name: 'Cost-Plus Award Fee',
                  emoji: '⭐',
                  tagline: 'You earn it. Or you don\'t.',
                  analogy: 'Like a performance bonus. Strong reviews mean more money. Bad reviews mean you leave money on the table.',
                  fee: '0-3% base + up to 10% award',
                  risk: 'Low',
                  upside: 'Medium',
                  when: 'Large service programs, operations support',
                  color: '#f59e0b',
                  bg: 'bg-amber-500/10',
                  border: 'border-amber-500/30',
                  riskDots: 2,
                  rewardDots: 3,
                },
                {
                  label: 'CPIF',
                  name: 'Cost-Plus Incentive Fee',
                  emoji: '🎯',
                  tagline: 'Save money. Share the savings.',
                  analogy: 'Like a piece rate. The more efficient you run, the more you earn. You split savings with the government by a formula set at award.',
                  fee: 'Adjusts with cost performance',
                  risk: 'Low-Medium',
                  upside: 'Medium-High',
                  when: 'Production, well-defined service work',
                  color: '#10b981',
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/30',
                  riskDots: 2,
                  rewardDots: 4,
                },
                {
                  label: 'FFP',
                  name: 'Firm Fixed Price',
                  emoji: '🎲',
                  tagline: 'All the risk. All the upside.',
                  analogy: 'Like running your own business. If you come in under cost you keep the difference. If you blow the budget you eat the loss. Nobody bails you out.',
                  fee: 'Whatever is left after costs',
                  risk: 'Full',
                  upside: 'Unlimited',
                  when: 'Mature, well-defined requirements',
                  color: '#8b5cf6',
                  bg: 'bg-violet-500/10',
                  border: 'border-violet-500/30',
                  riskDots: 5,
                  rewardDots: 5,
                },
              ];
              return (
                <div key={i} className="space-y-4">
                  {(block as any).heading && <h3 className="font-bold text-base text-foreground">{(block as any).heading}</h3>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {feeTypes.map((ft, fi) => (
                      <div key={fi} className={`rounded-2xl border ${ft.border} ${ft.bg} p-4 space-y-3`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{ft.emoji}</span>
                              <span className="text-xs font-black tracking-wider text-foreground">{ft.label}</span>
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">{ft.name}</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: ft.color + '22', color: ft.color }}>{ft.fee}</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{ft.tagline}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">"{ft.analogy}"</p>
                        <div className="space-y-1.5 pt-1 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Cost risk</span>
                            <div className="flex gap-1">{[1,2,3,4,5].map(d => <div key={d} className="w-3 h-3 rounded-full" style={{ background: d <= ft.riskDots ? ft.color : ft.color + '33' }} />)}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Profit upside</span>
                            <div className="flex gap-1">{[1,2,3,4,5].map(d => <div key={d} className="w-3 h-3 rounded-full" style={{ background: d <= ft.rewardDots ? ft.color : ft.color + '33' }} />)}</div>
                          </div>
                          <p className="text-[10px] text-muted-foreground pt-1">Common on: {ft.when}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // ── dso_cash_gap_visual ───────────────────────────────────────────
            if ((block as any).type === 'dso_cash_gap_visual') {
              return (
                <div key={i} className="space-y-4">
                  {(block as any).heading && <h3 className="font-bold text-base text-foreground">{(block as any).heading}</h3>}
                  <p className="text-sm text-muted-foreground">Your company pays expenses <strong className="text-foreground">every two weeks</strong>. But billing the government and getting paid are two different events.</p>

                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    {/* Timeline */}
                    <div className="relative">
                      <div className="absolute top-5 left-6 right-6 h-0.5 bg-border" />
                      <div className="flex justify-between relative z-10">
                        {[
                          { day: 'Day 0', label: 'Work delivered', emoji: '✅', color: '#3b82f6' },
                          { day: 'Day 7', label: 'Invoice submitted', emoji: '📄', color: '#f59e0b' },
                          { day: 'Day 30', label: 'Gov processes invoice', emoji: '🏛️', color: '#8b5cf6' },
                          { day: 'Day 45-60', label: 'Cash arrives', emoji: '💰', color: '#10b981' },
                        ].map((evt, ei) => (
                          <div key={ei} className="flex flex-col items-center gap-2 w-20">
                            <div className="w-10 h-10 rounded-full bg-card border-2 flex items-center justify-center text-lg" style={{ borderColor: evt.color }}>
                              {evt.emoji}
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold" style={{ color: evt.color }}>{evt.day}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight text-center">{evt.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* The gap */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-sm font-bold text-red-400 mb-1">The Gap: 45 to 60 days of expenses with no cash in</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">During that window your company is still paying salaries, benefits, rent, and overhead. Every day of DSO above 45 costs real money. Large contractors track this weekly.</p>
                    </div>

                    {/* DSO benchmarks */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { range: 'Under 35', label: 'Excellent', color: '#10b981', bg: 'bg-emerald-500/10' },
                        { range: '35 to 45', label: 'Healthy', color: '#3b82f6', bg: 'bg-blue-500/10' },
                        { range: '45 to 60', label: 'Watch it', color: '#f59e0b', bg: 'bg-amber-500/10' },
                      ].map((bench, bi) => (
                        <div key={bi} className={`${bench.bg} rounded-xl p-3 text-center border`} style={{ borderColor: bench.color + '44' }}>
                          <p className="text-xs font-black" style={{ color: bench.color }}>{bench.range}</p>
                          <p className="text-[10px] text-muted-foreground">{bench.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">DSO above 60 days usually means the government is slow-paying or there are invoice disputes. Above 90 days is a serious cash flow problem.</p>
                  </div>
                </div>
              );
            }
            // ── cpaf_formula_visual ───────────────────────────────────────────
            if ((block as any).type === 'cpaf_formula_visual') {
              return (
                <div key={i} className="space-y-4">
                  {(block as any).heading && <h3 className="font-bold text-base text-foreground">{(block as any).heading}</h3>}
                  <p className="text-sm text-muted-foreground">Three components. Two are automatic. One you have to earn.</p>
                  <div className="space-y-3">
                    {[
                      { emoji: '✅', label: 'Allowable Costs', sublabel: 'Always paid back', desc: 'Labor, subcontractors, materials, ODCs, indirect rates. As long as costs are allowable, allocable, and reasonable under FAR Part 31, the government reimburses 100%. You never eat these.', color: '#3b82f6', auto: true },
                      { emoji: '🔒', label: 'Base Fee', sublabel: 'Guaranteed, capped at 3%', desc: 'Fixed in dollars at award. You earn it no matter what. Think of it as the floor — enough to keep the lights on, not enough to satisfy shareholders. DFARS 216.405-2 caps it at 3% of estimated cost.', color: '#6366f1', auto: true },
                      { emoji: '⭐', label: 'Award Fee', sublabel: 'Earned through performance', desc: 'This is where real profit lives. The government scores you on Technical, Cost Control, Schedule, and Management. Your score determines what percentage of the award fee pool you collect. Earn Excellent = collect almost all of it. Earn Poor = collect nothing.', color: '#f59e0b', auto: false },
                    ].map((row, ri) => (
                      <div key={ri} className="flex gap-3 items-stretch">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: row.color + '22' }}>{row.emoji}</div>
                          {ri < 2 && <div className="w-0.5 flex-1 bg-border" />}
                        </div>
                        <div className="flex-1 bg-card border border-border rounded-xl p-4 mb-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <p className="text-sm font-bold text-foreground">{row.label}</p>
                              <p className="text-xs font-medium" style={{ color: row.color }}>{row.sublabel}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${row.auto ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                              {row.auto ? 'AUTOMATIC' : 'EARNED'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{row.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Payment Formula</p>
                    <p className="text-sm font-black text-foreground">Allowable Costs + Base Fee + <span className="text-amber-400">Award Fee Earned</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Maximize the third element. That is where your decisions convert to profit.</p>
                  </div>
                </div>
              );
            }

            // ── award_fee_factors_visual ──────────────────────────────────────
            if ((block as any).type === 'award_fee_factors_visual') {
              const factors = [
                { label: 'Technical Performance', pct: 35, color: '#3b82f6', emoji: '🎯', desc: 'Quality of deliverables, solutions, and technical results. The largest single factor. A Fair score here still only earns 25-47% of available fee.' },
                { label: 'Cost Control', pct: 25, color: '#10b981', emoji: '💰', desc: 'Required by regulation to be at least 25% of total weight. Are you tracking to budget? Weekly burn rate reviews directly protect this score.' },
                { label: 'Schedule / Timeliness', pct: 25, color: '#f59e0b', emoji: '📅', desc: 'On-time delivery is worth one quarter of your fee. A perfect deliverable two weeks late is still a financial loss.' },
                { label: 'Management / COR Trust', pct: 15, color: '#8b5cf6', emoji: '🤝', desc: 'Proactive communication, no surprises, subcontractor oversight. The customer cannot score what they cannot see.' },
              ];
              const ratings = [
                { label: 'Excellent', range: '95-100', earn: '97.5-100%', color: '#10b981' },
                { label: 'Good', range: '76-85', earn: '50-72.5%', color: '#3b82f6' },
                { label: 'Fair', range: '66-75', earn: '25-47.5%', color: '#f59e0b' },
                { label: 'Poor / Unsat', range: '<60', earn: '$0', color: '#ef4444' },
              ];
              return (
                <div key={i} className="space-y-4">
                  {(block as any).heading && <h3 className="font-bold text-base text-foreground">{(block as any).heading}</h3>}
                  <p className="text-xs text-muted-foreground">At the end of each period, a Fee Determining Official scores you on four weighted factors. That score converts directly to dollars.</p>
                  <div className="space-y-2">
                    {factors.map((f, fi) => (
                      <div key={fi} className="bg-card border border-border rounded-xl p-4 flex gap-3 items-start">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: f.color + '22' }}>{f.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="text-sm font-bold text-foreground">{f.label}</p>
                            <span className="text-sm font-black flex-shrink-0" style={{ color: f.color }}>{f.pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full mb-2 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: f.color }} />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-muted/40 border-b border-border">
                      <p className="text-xs font-bold text-foreground">Rating → Fee Earned</p>
                    </div>
                    <div className="divide-y divide-border">
                      {ratings.map((r, ri) => (
                        <div key={ri} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                            <span className="text-sm font-semibold text-foreground">{r.label}</span>
                            <span className="text-xs text-muted-foreground">score {r.range}</span>
                          </div>
                          <span className="text-sm font-black" style={{ color: r.color }}>{r.earn}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
                      <p className="text-xs text-red-400 font-semibold">One Unsatisfactory rating = $0 for the entire period regardless of other scores.</p>
                    </div>
                  </div>
                </div>
              );
            }

            // ── burn_rate_visual ──────────────────────────────────────────────
            if ((block as any).type === 'burn_rate_visual') {
              return (
                <div key={i} className="space-y-4">
                  {(block as any).heading && <h3 className="font-bold text-base text-foreground">{(block as any).heading}</h3>}
                  <p className="text-sm text-muted-foreground">The government obligates a specific dollar amount. That is the ceiling. Burn rate tells you how fast you are approaching it.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { emoji: '🔴', label: 'Too Fast', sublabel: 'Overburn', desc: 'You will hit the funded ceiling before the next modification. Work stops. Schedule scores drop. The government scrutinizes your planning.', alert: 'Alert finance immediately', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                      { emoji: '✅', label: 'On Track', sublabel: '±5% of plan', desc: 'Burn is tracking to the monthly spend plan. EAC is stable. Finance and the government PM are both comfortable. Keep going.', alert: 'Weekly check-in', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                      { emoji: '🟡', label: 'Too Slow', sublabel: 'Underburn', desc: 'Signals staffing gaps or delivery delays. Unused funds get swept at fiscal year end. Schedule scores suffer because work is not progressing.', alert: 'Explain variance to PM', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                    ].map((s, si) => (
                      <div key={si} className={`rounded-xl border ${s.border} ${s.bg} p-4 space-y-2`}>
                        <div className="text-2xl">{s.emoji}</div>
                        <p className="text-sm font-bold text-foreground">{s.label}</p>
                        <p className="text-xs font-medium" style={{ color: s.color }}>{s.sublabel}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                        <div className="pt-1 border-t border-white/10">
                          <p className="text-[11px] font-bold" style={{ color: s.color }}>{s.alert}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 flex gap-3 items-start">
                    <span className="text-xl flex-shrink-0">📋</span>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Track weekly. Not monthly.</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">By the time a funding gap is visible to leadership, it is already a crisis. Finance calculates burn weekly. A 5% variance from planned monthly spend is a yellow flag. Sync with your Finance PM every single week.</p>
                    </div>
                  </div>
                </div>
              );
            }

            // ── award_fee_pitfalls_visual ─────────────────────────────────────
            if ((block as any).type === 'award_fee_pitfalls_visual') {
              const pitfalls = [
                { n: '01', emoji: '👥', label: 'Overstaffing just in case', factor: 'Cost Control', impact: 'Idle labor burns funding and spikes overhead rates across every other contract in the company. Staff to the work you have.' },
                { n: '02', emoji: '📊', label: 'Ignoring burn rate until it is urgent', factor: 'Cost + Schedule', impact: 'Weekly reviews catch problems while they are still manageable. Monthly reviews catch them when they are emergencies.' },
                { n: '03', emoji: '📝', label: 'Loose subcontractor scope', factor: 'Cost Control', impact: 'Every undocumented task outside the subcontractor SOW is a potential unallowable cost. Define scope tightly and enforce it.' },
                { n: '04', emoji: '⏰', label: 'Chasing perfection over schedule', factor: 'Schedule (25%)', impact: 'A technically perfect deliverable delivered three weeks late is worth less than a very good one delivered on time.' },
                { n: '05', emoji: '📂', label: 'Poor documentation', factor: 'Technical', impact: 'Award fee evaluations run on evidence. If it is not written down, the FDO cannot credit it. Document achievements throughout the period, not the week before review.' },
                { n: '06', emoji: '😬', label: 'Surprising the customer', factor: 'Management (15%)', impact: 'Bad news delivered early with a recovery plan preserves trust. Bad news discovered by the customer destroys it. COR trust is a scored factor with dollar value attached.' },
              ];
              const factorColors: Record<string, string> = { 'Cost Control': '#10b981', 'Cost + Schedule': '#f59e0b', 'Schedule (25%)': '#f59e0b', 'Technical': '#3b82f6', 'Management (15%)': '#8b5cf6' };
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-base text-foreground">{(block as any).heading}</h3>}
                  <p className="text-xs text-muted-foreground">Each one maps directly to a fee factor and a dollar impact.</p>
                  <div className="space-y-2">
                    {pitfalls.map((p, pi) => (
                      <div key={pi} className="bg-card border border-border rounded-xl p-4 flex gap-3 items-start group hover:border-red-500/30 transition-colors">
                        <div className="flex-shrink-0 text-center">
                          <div className="text-xl mb-1">{p.emoji}</div>
                          <div className="text-[10px] font-black text-muted-foreground/50">{p.n}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-bold text-foreground">{p.label}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap" style={{ background: (factorColors[p.factor] ?? '#6366f1') + '22', color: factorColors[p.factor] ?? '#6366f1' }}>
                              {p.factor}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{p.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            // ── dcaa_audits_visual ────────────────────────────────────────────
            if ((block as any).type === 'dcaa_audits_visual') {
              const phases = [
                { phase: 'Pre-Award', color: 'bg-blue-500', items: ['Accounting System Survey', 'Estimating System Survey', 'Forward Pricing Rate Audit', 'Pre-Award Accounting System Survey'] },
                { phase: 'During Performance', color: 'bg-violet-500', items: ['Provisional Billing Rate Review', 'Incurred Cost Audit (annual)', 'Labor Timekeeping Audit', 'Progress Payment Reviews'] },
                { phase: 'Post-Award', color: 'bg-emerald-500', items: ['Incurred Cost Submission (ICS) Audit', 'Closeout Audit', 'Cost Accounting Standards Audit', 'Defective Pricing Audit'] },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="space-y-3">
                    {phases.map((p, pi) => (
                      <div key={pi} className="rounded-xl border border-border overflow-hidden">
                        <div className={`${p.color} px-4 py-2`}>
                          <span className="text-white text-xs font-bold uppercase tracking-wide">{p.phase}</span>
                        </div>
                        <div className="p-3 grid sm:grid-cols-2 gap-1.5">
                          {p.items.map((item, ii) => (
                            <div key={ii} className="flex items-center gap-2 text-xs">
                              <div className={`w-1.5 h-1.5 rounded-full ${p.color} flex-shrink-0`} />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── cpif_share_visual ─────────────────────────────────────────────
            // ── category_cards_visual ── generic color-coded category cards, driven by items[] ──
            if ((block as any).type === 'category_cards_visual') {
              const catColorMap: Record<string, string> = {
                blue: 'bg-blue-500', teal: 'bg-teal-500', violet: 'bg-violet-500',
                amber: 'bg-amber-500', orange: 'bg-orange-500', red: 'bg-red-500',
                green: 'bg-green-500', purple: 'bg-purple-500', gray: 'bg-gray-500',
              };
              const catItems = (block as any).items ?? [];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="space-y-2.5">
                    {catItems.map((cat: any, ci: number) => (
                      <div key={ci} className="rounded-xl border border-border overflow-hidden">
                        <div className={`${catColorMap[cat.color] || 'bg-primary'} px-4 py-2.5 flex items-baseline gap-2 flex-wrap`}>
                          <span className="text-white text-xs font-bold uppercase tracking-wide">{cat.label}</span>
                          {cat.sublabel && <span className="text-white/80 text-[11px]">{cat.sublabel}</span>}
                        </div>
                        {cat.desc && (
                          <div className="p-3.5 text-xs text-muted-foreground leading-relaxed">{cat.desc}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── related_lesson ── clickable cross-reference to another lesson that explains a term in depth ──
            if ((block as any).type === 'related_lesson') {
              const refs = (block as any).refs ?? [];
              return (
                <div key={i} className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                  {(block as any).heading && (
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2.5">{(block as any).heading}</h3>
                  )}
                  <div className="space-y-2">
                    {refs.map((ref: any, ri: number) => (
                      <button
                        key={ri}
                        onClick={() => onNextLesson(ref.lessonId)}
                        className="w-full flex items-center justify-between gap-3 text-left p-2.5 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                        data-testid={`related-lesson-${ri}`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{ref.label}</div>
                          {ref.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{ref.sub}</div>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if ((block as any).type === 'cpif_share_visual') {
              return (
                <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h3 className="font-bold text-sm">{(block as any).heading}</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Target Cost', value: '$10M', sub: 'What both sides agreed to', color: 'bg-primary/10 text-primary' },
                      { label: 'Target Fee', value: '$1M', sub: '10% of target cost', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                      { label: 'Share Ratio', value: '80/20', sub: 'Gov/Contractor split', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
                    ].map((item, ii) => (
                      <div key={ii} className={`rounded-xl p-3 ${item.color.split(' ')[0]}`}>
                        <p className={`text-xl font-black ${item.color.split(' ').slice(1).join(' ')}`}>{item.value}</p>
                        <p className="text-xs font-semibold mt-1">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { scenario: 'Came in at $9M (under by $1M)', gov: '-$800K', contractor: '+$200K', color: 'bg-emerald-500/10 border-emerald-400/30', label: '✓ Under budget' },
                      { scenario: 'Came in at $11M (over by $1M)', gov: '+$800K', contractor: '-$200K', color: 'bg-destructive/10 border-destructive/30', label: '✗ Over budget' },
                    ].map((s, si) => (
                      <div key={si} className={`rounded-lg border p-3 ${s.color}`}>
                        <p className="text-xs font-semibold mb-1">{s.label}: {s.scenario}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Government absorbs: <strong>{s.gov}</strong></span>
                          <span>Contractor absorbs: <strong>{s.contractor}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── idiq_process_visual ───────────────────────────────────────────
            if ((block as any).type === 'idiq_process_visual') {
              const steps = ((block as any).items ?? []).map((item: string, idx: number) => {
                const [label, detail] = item.split('|||');
                // Extract just the step label text after the dash
                const dashIdx = label.indexOf(' — ');
                const stepNum = idx + 1;
                const stepTitle = dashIdx > -1 ? label.slice(dashIdx + 3) : label;
                return { stepNum, stepTitle, detail };
              });

              // Color sequence cycling through accent colors
              const stepColors = [
                { bg: 'bg-blue-500',   light: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   num: '#3b82f6' },
                { bg: 'bg-indigo-500', light: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', num: '#6366f1' },
                { bg: 'bg-violet-500', light: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', num: '#8b5cf6' },
                { bg: 'bg-teal-500',   light: 'bg-teal-500/10',   border: 'border-teal-500/30',   text: 'text-teal-400',   num: '#14b8a6' },
                { bg: 'bg-cyan-500',   light: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-400',   num: '#06b6d4' },
                { bg: 'bg-amber-500',  light: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  num: '#f59e0b' },
                { bg: 'bg-orange-500', light: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', num: '#f97316' },
                { bg: 'bg-green-500',  light: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  num: '#22c55e' },
              ];

              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && (
                    <h3 className="font-bold text-base text-foreground">{(block as any).heading}</h3>
                  )}
                  <div className="space-y-0">
                    {steps.map((step: any, si: number) => {
                      const sc = stepColors[si % stepColors.length];
                      const isOpen = expandedProcessStep === si;
                      const isLast = si === steps.length - 1;
                      return (
                        <div key={si} className="flex gap-0">
                          {/* Left timeline column */}
                          <div className="flex flex-col items-center w-10 flex-shrink-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 z-10 shadow-md"
                              style={{ background: sc.num }}
                            >
                              {step.stepNum}
                            </div>
                            {!isLast && (
                              <div className="w-0.5 flex-1 bg-border my-1" />
                            )}
                          </div>

                          {/* Right content card */}
                          <div className={`flex-1 mb-2 ml-3 rounded-xl border ${sc.border} ${sc.light} overflow-hidden transition-all duration-200`}>
                            <button
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                              onClick={() => setExpandedProcessStep(isOpen ? null : si)}
                            >
                              <span className={`text-sm font-semibold ${sc.text}`}>{step.stepTitle}</span>
                              <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${sc.text} flex-shrink-0`}>▾</span>
                            </button>
                            {isOpen && step.detail && (
                              <div className="px-4 pb-4 border-t border-white/10">
                                <p className="text-xs text-muted-foreground leading-relaxed pt-3">{step.detail}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Tap any step to expand the detail.</p>
                </div>
              );
            }

            // ── idiq_structure_visual ─────────────────────────────────────────
            if ((block as any).type === 'idiq_structure_visual') {
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm font-black text-primary">📋 IDIQ Base Contract</p>
                      <p className="text-xs text-muted-foreground">Sets terms, rates, ceiling value — no work ordered here</p>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">↓ Task Orders issued against base ↓</div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Task Order 1', 'Task Order 2', 'Task Order N'].map((to, ti) => (
                        <div key={ti} className="text-center p-2 rounded-lg border border-border bg-card">
                          <p className="text-xs font-semibold">{to}</p>
                          <p className="text-[10px] text-muted-foreground">Specific work scope</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-primary/20 pt-2 grid grid-cols-2 gap-2 text-xs">
                      <div><span className="font-semibold">Min guaranteed:</span> <span className="text-muted-foreground">$1 (typical)</span></div>
                      <div><span className="font-semibold">Max ceiling:</span> <span className="text-muted-foreground">Set in base contract</span></div>
                    </div>
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── rea_process_visual ────────────────────────────────────────────
            if ((block as any).type === 'rea_process_visual') {
              const stepsRea = [
                { num: '1', label: 'Government Directs Change', desc: 'Formal or constructive direction outside contract scope', icon: '📢', color: 'bg-blue-500' },
                { num: '2', label: 'Contractor Submits REA', desc: 'Must include: factual basis, legal entitlement, quantified cost impact', icon: '📝', color: 'bg-violet-500' },
                { num: '3', label: 'Contracting Officer Reviews', desc: 'CO has 60 days to issue final decision (FAR 33.211)', icon: '🔍', color: 'bg-amber-500' },
                { num: '4', label: 'Negotiation', desc: 'Both parties negotiate the equitable adjustment amount', icon: '🤝', color: 'bg-emerald-500' },
                { num: '5', label: 'Contract Modification Issued', desc: 'Bilateral mod executed — price and/or schedule adjusted', icon: '✅', color: 'bg-primary' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="space-y-2">
                    {stepsRea.map((s, si) => (
                      <div key={si} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${s.color} text-white text-xs font-black flex items-center justify-center flex-shrink-0`}>{s.num}</div>
                        <span className="text-xl flex-shrink-0">{s.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{s.label}</p>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                        {si < stepsRea.length - 1 && <div className="absolute ml-4 mt-8 w-0.5 h-4 bg-border" />}
                      </div>
                    ))}
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── commercial_item_visual ────────────────────────────────────────
            if ((block as any).type === 'commercial_item_visual') {
              const tests = [
                { label: 'Sold commercially', desc: 'Offered for sale in commercial marketplace', icon: '🏬' },
                { label: 'Catalog pricing', desc: 'Has established catalog or market prices', icon: '📖' },
                { label: 'Minor modification', desc: 'Commercial item with minor government-specific mods', icon: '🔧' },
                { label: 'Evolved from commercial', desc: 'Derived from commercial items via minor mods', icon: '🔄' },
                { label: 'Used by general public', desc: 'Used by general public or non-government entities', icon: '👥' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <p className="text-xs text-muted-foreground">Meets ANY ONE of these criteria = commercial item. Qualifies for streamlined FAR Part 12 acquisition.</p>
                  <div className="space-y-2">
                    {tests.map((t, ti) => (
                      <div key={ti} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <span className="text-xl flex-shrink-0">{t.icon}</span>
                        <div>
                          <p className="text-sm font-semibold">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                        <div className="ml-auto w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓</div>
                      </div>
                    ))}
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── risk_formula_visual ───────────────────────────────────────────
            if ((block as any).type === 'risk_formula_visual') {
              const levels = [
                { level: 'High', range: 'Score ≥ 10', prob: '≥ 50%', impact: '≥ 3', color: 'bg-red-500', badge: 'bg-red-500/15 text-red-600 dark:text-red-400', action: 'Immediate mitigation required' },
                { level: 'Medium', range: 'Score 4–9', prob: '20–49%', impact: '2–4', color: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', action: 'Monitor actively, plan mitigation' },
                { level: 'Low', range: 'Score 1–3', prob: '< 20%', impact: '1–2', color: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', action: 'Accept, log in risk register' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-2xl font-black text-primary">Risk Score = Probability × Impact</p>
                    <p className="text-xs text-muted-foreground mt-1">Both rated 1–5. Max possible score: 25.</p>
                  </div>
                  <div className="space-y-2">
                    {levels.map((l, li) => (
                      <div key={li} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                        <div className={`w-3 h-10 rounded-full ${l.color} flex-shrink-0`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.badge}`}>{l.level} Risk</span>
                            <span className="text-xs text-muted-foreground">{l.range}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{l.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // ── cost_risk_visual ──────────────────────────────────────────────
            if ((block as any).type === 'cost_risk_visual') {
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="text-center">
                      <code className="text-sm font-mono font-bold text-primary">(P80 Cost − Point Estimate) ÷ Point Estimate × 100%</code>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      {[
                        { label: 'Low Risk', range: '< 10%', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                        { label: 'Medium Risk', range: '10–30%', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                        { label: 'High Risk', range: '> 30%', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
                      ].map((r, ri) => (
                        <div key={ri} className={`rounded-lg p-2 ${r.color.split(' ')[0]}`}>
                          <p className={`font-black text-base ${r.color.split(' ').slice(1).join(' ')}`}>{r.range}</p>
                          <p className="font-semibold">{r.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Historical DoD average cost overrun: 20–30%. If your P80 is more than 30% above your point estimate, re-examine your assumptions.</p>
                  </div>
                </div>
              );
            }

            // ── compa_ratio_visual ────────────────────────────────────────────
            if ((block as any).type === 'compa_ratio_visual') {
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <code className="text-sm font-mono font-bold text-primary block text-center">Compa-Ratio = Employee Salary ÷ Pay Band Midpoint</code>
                    <div className="space-y-2">
                      {[
                        { ratio: '< 0.90', label: 'Below midpoint', meaning: 'Underpaid vs. market — flight risk', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
                        { ratio: '0.90–1.10', label: 'At midpoint', meaning: 'Competitively priced — target range', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                        { ratio: '> 1.10', label: 'Above midpoint', meaning: 'Overpaid vs. band — cost risk at recompete', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                      ].map((r, ri) => (
                        <div key={ri} className={`flex items-center gap-3 p-3 rounded-lg ${r.color.split(' ')[0]}`}>
                          <span className={`text-lg font-black w-16 text-center ${r.color.split(' ').slice(1).join(' ')}`}>{r.ratio}</span>
                          <div>
                            <p className="text-xs font-semibold">{r.label}</p>
                            <p className="text-xs text-muted-foreground">{r.meaning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── acat_requirements_visual ──────────────────────────────────────
            if ((block as any).type === 'acat_requirements_visual') {
              const reqs = [
                { label: 'Selected Acquisition Report (SAR)', when: 'Annual — submitted to Congress', icon: '📊' },
                { label: 'Defense Acquisition Board (DAB) Review', when: 'At each major milestone', icon: '🏛️' },
                { label: 'Full Funding Policy', when: 'Must budget procurement in single year', icon: '💰' },
                { label: 'Independent Cost Estimate (ICE)', when: 'Before Milestone B & C', icon: '🔢' },
                { label: 'Operational Test & Evaluation (OT&E)', when: 'Before full-rate production', icon: '🧪' },
                { label: 'Nunn-McCurdy Reporting', when: 'If cost growth exceeds thresholds', icon: '⚠️' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <p className="text-xs text-muted-foreground">ACAT I programs (MDAPs) have the heaviest congressional oversight. These are non-negotiable.</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {reqs.map((r, ri) => (
                      <div key={ri} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                        <span className="text-xl flex-shrink-0">{r.icon}</span>
                        <div>
                          <p className="text-xs font-semibold">{r.label}</p>
                          <p className="text-[11px] text-muted-foreground">{r.when}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }

            // ── nunn_mccurdy_visual ───────────────────────────────────────────
            if ((block as any).type === 'nunn_mccurdy_visual') {
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="space-y-2">
                    {[
                      { level: 'Significant Breach', threshold: 'APB Unit Cost × 1.15', desc: 'Requires written notification to Congress within 45 days', color: 'border-amber-400/50 bg-amber-500/5', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
                      { level: 'Critical Breach', threshold: 'APB Unit Cost × 1.25', desc: 'Program must be restructured or terminated. SecDef certification required.', color: 'border-red-400/50 bg-red-500/5', badge: 'bg-red-500/15 text-red-600 dark:text-red-400' },
                    ].map((l, li) => (
                      <div key={li} className={`rounded-xl border-2 p-4 space-y-2 ${l.color}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.badge}`}>{l.level}</span>
                          <code className="text-sm font-mono font-bold">{l.threshold}</code>
                        </div>
                        <p className="text-xs text-muted-foreground">{l.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                    💡 APB = Acquisition Program Baseline — the cost, schedule, and performance goals set at Milestone B. Nunn-McCurdy thresholds are calculated against this baseline.
                  </div>
                  {(block as any).explanation && <p className="text-xs text-muted-foreground">{(block as any).explanation}</p>}
                </div>
              );
            }



            // ── principal_agent_visual ────────────────────────────────────────
            if ((block as any).type === 'principal_agent_visual') {
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Agent */}
                    <div className="rounded-xl border-2 border-red-400/40 bg-red-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📦</span>
                        <div>
                          <p className="text-sm font-bold">Agent (The Middleman)</p>
                          <span className="text-[11px] bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">Books NET only</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <p>✗ No ownership of delivery</p>
                        <p>✗ No technical value added</p>
                        <p>✗ No performance risk</p>
                        <p>✗ Just moves goods or information</p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">On a $10M contract with $500K fee</p>
                        <p className="text-xl font-black text-red-600 dark:text-red-400">Books $500K</p>
                      </div>
                    </div>
                    {/* Principal */}
                    <div className="rounded-xl border-2 border-emerald-400/40 bg-emerald-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔧</span>
                        <div>
                          <p className="text-sm font-bold">Principal (The Partner)</p>
                          <span className="text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Books GROSS</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <p>✓ Owns the delivery</p>
                        <p>✓ Integrates, hardens, secures</p>
                        <p>✓ Bears performance risk</p>
                        <p>✓ Manages the lifecycle</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">On a $10M contract with $500K fee</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">Books $10M</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 text-center">
                    <p className="text-xs text-muted-foreground">Same contract. Same work. The documentation determines which column you're in.</p>
                  </div>
                </div>
              );
            }

            // ── five_step_revenue_visual ──────────────────────────────────────
            if ((block as any).type === 'five_step_revenue_visual') {
              const steps_c = [
                { num: '1', label: 'Identify the Contract', desc: 'Is the scope airtight? A vague SOW cannot support a performance obligation.', question: 'Is this scope clearly defined?', icon: '📋' },
                { num: '2', label: 'Define Obligations', desc: 'What specifically are you building, integrating, or engineering? Each deliverable must be distinct.', question: 'What exactly are we delivering?', icon: '🎯' },
                { num: '3', label: 'Determine the Price', desc: 'Is the value clearly attached to each obligation? Vague pricing = vague revenue.', question: 'Is the price tied to the work?', icon: '💵' },
                { num: '4', label: 'Allocate the Price', desc: 'Does the money match the effort? If you\'re engineering 80% of the work, 80% of the revenue should be there.', question: 'Does the money match the effort?', icon: '⚖️' },
                { num: '5', label: 'Recognize Revenue', desc: 'Only book when the technical work is actually done. Not when invoiced. Not when awarded.', question: 'Is the work actually complete?', icon: '✅' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="space-y-2">
                    {steps_c.map((s, si) => (
                      <div key={si} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.num}</div>
                        <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{s.label}</p>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-muted-foreground italic max-w-[120px] leading-snug">{s.question}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">All five steps_c must be satisfied. Weakness in any one step can trigger an Agent reclassification during an audit.</p>
                </div>
              );
            }

            // ── value_add_examples_visual ─────────────────────────────────────
            if ((block as any).type === 'value_add_examples_visual') {
              const examples = [
                { before: 'Deliver 50 servers', after: 'Deliver, configure, and security-harden 50 servers per DISA STIG requirements', icon: '🖥️' },
                { before: 'Provide IT support services', after: 'Provide Tier 1–3 IT support with SLA-governed incident management and monthly reporting', icon: '🛠️' },
                { before: 'Supply network equipment', after: 'Supply, rack, configure, and integrate network equipment into existing infrastructure with cutover testing', icon: '🌐' },
                { before: 'Deliver software licenses', after: 'Deliver, install, configure, and provide user training for enterprise software with 90-day post-deployment support', icon: '💻' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="space-y-2">
                    {examples.map((ex, ei) => (
                      <div key={ei} className="rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border-b border-border/50">
                          <span className="text-base">{ex.icon}</span>
                          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Agent / Logistics</span>
                        </div>
                        <div className="px-4 py-2 bg-red-500/5">
                          <p className="text-xs text-muted-foreground italic">"{ex.before}"</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border-t border-b border-border/50">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">↓ Principal / Engineering</span>
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/5">
                          <p className="text-xs font-medium">"{ex.after}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">The technical work may be identical. The language determines the revenue classification.</p>
                </div>
              );
            }

            // ── fee_limits_visual: contract type fee cap cards ────────────────
            if ((block as any).type === 'fee_limits_visual') {
              const contracts = [
                {
                  name: 'Cost-Plus Fixed Fee', abbr: 'CPFF', icon: '📋', color: 'border-blue-400/50 bg-blue-500/5',
                  badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                  rules: [
                    { label: 'Completion contracts', value: 'Max 10%' },
                    { label: 'Term contracts', value: 'Max 7%' },
                    { label: 'Reference', value: 'FAR 15.404-4(c)(4)' },
                  ],
                  note: 'Fixed fee paid regardless of performance.',
                },
                {
                  name: 'Cost-Plus Incentive Fee', abbr: 'CPIF', icon: '🎯', color: 'border-violet-400/50 bg-violet-500/5',
                  badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
                  rules: [
                    { label: 'Max total fee', value: '15% of target cost' },
                    { label: 'Min fee floor', value: '0% (never negative)' },
                    { label: 'Structure', value: 'Share ratio splits over/under' },
                  ],
                  note: 'Fee tied to cost efficiency — do better, earn more.',
                },
                {
                  name: 'Cost-Plus Award Fee', abbr: 'CPAF', icon: '⭐', color: 'border-amber-400/50 bg-amber-500/5',
                  badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                  rules: [
                    { label: 'Base fee', value: '0–3% (guaranteed)' },
                    { label: 'Award fee pool', value: '5–10% of est. cost' },
                    { label: 'Combined max', value: '~10–15% typical' },
                  ],
                  note: 'Award fee earned through performance ratings.',
                },
                {
                  name: 'Fixed-Price Contracts', abbr: 'FFP / FPIF', icon: '🔒', color: 'border-emerald-400/50 bg-emerald-500/5',
                  badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                  rules: [
                    { label: 'Statutory cap', value: 'None — embedded in price' },
                    { label: 'Typical profit', value: '7–15%' },
                    { label: 'Governed by', value: 'Weighted Guidelines (DFARS 215.404-4)' },
                  ],
                  note: 'Contractor keeps every dollar saved — all the incentive to be efficient.',
                },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {contracts.map((c, ci) => (
                      <div key={ci} className={`rounded-xl border-2 ${c.color} p-4 space-y-2.5`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{c.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold leading-tight">{c.name}</p>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{c.abbr}</span>
                        </div>
                        <div className="space-y-1">
                          {c.rules.map((r, ri) => (
                            <div key={ri} className="flex justify-between items-center gap-2">
                              <span className="text-xs text-muted-foreground">{r.label}</span>
                              <span className="text-xs font-semibold text-right">{r.value}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 italic">{c.note}</p>
                      </div>
                    ))}
                  </div>
                  {(block as any).explanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{(block as any).explanation}</p>
                  )}
                </div>
              );
            }

            // ── weighted_guidelines_visual: 5-factor scoring breakdown ───────────
            if ((block as any).type === 'weighted_guidelines_visual') {
              const factors_b = [
                { num: '01', label: 'Performance Risk', desc: 'How technically difficult and risky is the work?', icon: '⚠️', weight: 'High impact' },
                { num: '02', label: 'Contract Type Risk', desc: 'How much cost risk is the contractor bearing?', icon: '📄', weight: 'High impact' },
                { num: '03', label: 'Facilities Capital', desc: 'How much has the contractor invested in equipment?', icon: '🏭', weight: 'Medium impact' },
                { num: '04', label: 'Cost Efficiency', desc: 'Is the contractor managing costs well historically?', icon: '📊', weight: 'Medium impact' },
                { num: '05', label: 'Independent Development', desc: 'Has the contractor invested in tech beneficial to DoD?', icon: '🔬', weight: 'Lower impact' },
              ];
              return (
                <div key={i} className="space-y-3">
                  {(block as any).heading && <h3 className="font-bold text-sm">{(block as any).heading}</h3>}
                  <p className="text-xs text-muted-foreground">The government scores 5 factors_b to set a target profit rate. Higher risk = higher fee earned. This is why contractors can't just claim "this work is risky" — the method already accounts for it.</p>
                  <div className="space-y-2">
                    {factors_b.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary flex-shrink-0">{f.num}</div>
                        <span className="text-lg flex-shrink-0">{f.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight">{f.label}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">{f.weight}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold text-primary">Result: a target profit % between 7–15%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Each factor gets a score → multiplied by its weight → summed into a final rate the government uses as its negotiation anchor.</p>
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
                  fringe: '28–35%', overhead: '25–50%', ga: '10–20%',
                  wrap: '1.6×–2.2×', color: 'border-blue-400/40 bg-blue-500/5',
                  badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                },
                {
                  label: 'Mid-Size', sublabel: 'SAIC, Leidos, CACI', icon: '🏬',
                  fringe: '30–38%', overhead: '40–65%', ga: '10–18%',
                  wrap: '2.0×–2.6×', color: 'border-violet-400/40 bg-violet-500/5',
                  badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                },
                {
                  label: 'Large Prime', sublabel: 'Lockheed, Raytheon, Boeing', icon: '🏭',
                  fringe: '32–42%', overhead: '50–80%', ga: '8–15%',
                  wrap: '1.6×–2.8× per BU*', color: 'border-amber-400/40 bg-amber-500/5',
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
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">* Large prime wrap rates vary significantly by business unit. Two divisions inside the same company commonly run 1.6x and 2.7x simultaneously — each BU maintains its own overhead pool. The corporate G&A layer sits on top of all of them. DCAA audits each pool separately.</p>
                    <p className="text-xs text-muted-foreground">Sources: <a href="https://cabrilloclub.com/insights/federal-contract-wrap-rate-calculator" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cabrillo Club Federal Contract Benchmarks (2026)</a> · <a href="https://www.govdash.com/blog/wrap-rate-government-contracting-guide" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GovDash Wrap Rate Guide (2026)</a> · <a href="https://www.blackflag-advisors.com/wrap-rates/wrap-rate-201-wrap-rate-types-and-calculation" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BlackFlag Advisors — Multiple Wrap Rates</a> · <a href="https://www.dcaa.mil/Small-Business/Presentations/Overview-of-Indirect-Cost-and-Rates/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">DCAA Overview of Indirect Cost and Rates</a></p>
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
              const contracts_b = [
                { name: 'FFP',  full: 'Firm Fixed Price',          contractorRisk: 100, profitDots: 5, plain: 'You own every dollar of cost risk. You also keep every dollar of savings.', who: '🏭' },
                { name: 'FPIF', full: 'Fixed-Price Incentive Fee', contractorRisk: 70,  profitDots: 4, plain: 'Mostly on you, but savings are shared with the government by a formula.', who: '🤝' },
                { name: 'CPIF', full: 'Cost-Plus Incentive Fee',   contractorRisk: 25,  profitDots: 3, plain: 'Government pays costs. You earn more fee if you come in under target cost.', who: '🏛️' },
                { name: 'CPAF', full: 'Cost-Plus Award Fee',       contractorRisk: 15,  profitDots: 3, plain: 'Government pays costs. Your profit depends on performance ratings from their board.', who: '🏛️' },
                { name: 'CPFF', full: 'Cost-Plus Fixed Fee',       contractorRisk: 10,  profitDots: 2, plain: 'Government pays costs. You earn a fixed fee no matter how efficient you are.', who: '🏛️' },
                { name: 'T&M',  full: 'Time & Materials',          contractorRisk: 5,   profitDots: 1, plain: 'Government pays labor rates + materials. Almost no cost risk on you.', who: '🏛️' },
              ];
              return (
                <div key={i} className="space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Who Bears the Cost Risk?</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">The further right the bar, the more cost risk falls on the government. The further left, the more on you.</p>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">← Contractor risk</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">Government risk →</span>
                  </div>
                  <div className="space-y-2">
                    {contracts_b.map((c) => {
                      const govRisk = 100 - c.contractorRisk;
                      return (
                        <div key={c.name} className="bg-card border border-border rounded-2xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 pt-3 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{c.who}</span>
                              <div>
                                <span className="text-sm font-black text-foreground">{c.name}</span>
                                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{c.full}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground mr-1">profit upside</span>
                              {[1,2,3,4,5].map((d: number) => (
                                <div key={d} className={cn('w-2.5 h-2.5 rounded-full', d <= c.profitDots ? 'bg-primary' : 'bg-muted')} />
                              ))}
                            </div>
                          </div>
                          <div className="px-4 pb-2">
                            <div className="flex h-7 rounded-xl overflow-hidden w-full">
                              {c.contractorRisk > 0 && (
                                <div
                                  className="flex items-center justify-center text-[11px] font-bold text-white"
                                  style={{ width: `${c.contractorRisk}%`, background: 'linear-gradient(90deg, #0D1B2A 0%, #1B3A4A 100%)' }}
                                >
                                  {c.contractorRisk >= 25 ? `${c.contractorRisk}%` : ''}
                                </div>
                              )}
                              {govRisk > 0 && (
                                <div
                                  className="flex items-center justify-center text-[11px] font-bold text-white"
                                  style={{ width: `${govRisk}%`, background: 'linear-gradient(90deg, #01696F 0%, #4F98A3 100%)' }}
                                >
                                  {govRisk >= 25 ? `${govRisk}%` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="px-4 pb-3">
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{c.plain}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg, #0D1B2A, #1B3A4A)' }} />
                      <span className="text-xs text-muted-foreground">Contractor bears cost risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg, #01696F, #4F98A3)' }} />
                      <span className="text-xs text-muted-foreground">Government bears cost risk</span>
                    </div>
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

          {/* Example document image gallery, if this lesson has one */}
          {lesson.attachments && lesson.attachments.length > 0 && (
            <div className="space-y-6">
              {lesson.attachments.map((att, ai) => (
                att.images && att.images.length > 0 && (
                  <div key={ai} className="rounded-xl border border-border bg-muted/10 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{att.title}</h3>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        View full PDF
                      </a>
                    </div>
                    <div className="space-y-4">
                      {att.images.map((img, imgI) => (
                        <figure key={imgI}>
                          <img
                            src={img.src}
                            alt={att.title}
                            className="w-full rounded-lg border border-border"
                          />
                          <figcaption className="text-xs text-muted-foreground mt-2 leading-relaxed px-1">{img.caption}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

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
          {( lesson.quiz ?? [] ).map((question, qi) => {
            const qzType = question.type ?? 'multiple_choice';

            // ── Multiple Choice ──
            if (qzType === 'multiple_choice') {
              const answered = quizAnswers[question.id] !== undefined;
              const qzIsCorrect = quizSubmitted && quizAnswers[question.id] === question.correct;
              const isWrong = quizSubmitted && answered && !qzIsCorrect;

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
                      qzIsCorrect
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
                        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                    )} data-testid={`explanation-${qi}`}>
                      <strong className="font-semibold">{qzIsCorrect ? "✓ Correct!" : "✗ Incorrect."}</strong>{" "}
                      {question.explanation || question.options[question.correct]?.split('|||')[1] || ""}
                    </div>
                  )}
                </div>
              );
            }

            // ── Drag Order ──
            if (qzType === 'drag_order') {
              const qzUserOrder = dragOrders[question.id] ?? question.orderedItems ?? [];
              const qzCorrectOrder = question.orderedItems ?? [];
              const qzIsCorrectOrder = quizSubmitted && JSON.stringify(qzUserOrder) === JSON.stringify(qzCorrectOrder);

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
                    currentOrder={qzUserOrder}
                  />

                  {quizSubmitted && (
                    <div className={cn(
                      "ml-8 rounded-lg p-3 text-xs leading-relaxed border",
                      qzIsCorrectOrder
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
                        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                    )} data-testid={`explanation-${qi}`}>
                      <strong className="font-semibold">{qzIsCorrectOrder ? "✓ Correct!" : "✗ Incorrect."}</strong>{" "}
                      {question.explanation}
                    </div>
                  )}
                </div>
              );
            }

            // ── Drag Match ──
            if (qzType === 'drag_match') {
              const qzPairs = question.qzPairs ?? [];
              const qzUserMatches = dragMatches[question.id] ?? {};
              const qzAllCorrect = quizSubmitted && qzPairs.every(p => qzUserMatches[p.left] === p.right);

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
                    currentMatches={qzUserMatches}
                  />

                  {quizSubmitted && (
                    <div className={cn(
                      "ml-8 rounded-lg p-3 text-xs leading-relaxed border",
                      qzAllCorrect
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
                        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                    )} data-testid={`explanation-${qi}`}>
                      <strong className="font-semibold">{qzAllCorrect ? "✓ All Correct!" : "✗ Some incorrect."}</strong>{" "}
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
              Submit Quiz ({answeredCount}/{(lesson.quiz ?? []).length} answered)
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
