import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getCurrentBrief,
  getBriefArchive,
  getReadBriefIds,
  fetchReadBriefIds,
  completeBrief,
  formatWeekOf,
  type Brief,
} from "@/lib/briefs";
import {
  Newspaper,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowRight,
  Clock,
} from "lucide-react";

interface WeeklyBriefProps {
  /** Opens a lesson by ID when the reader follows a "go deeper" link. */
  onSelectLesson?: (lessonId: string) => void;
  /** Fired after the server awards XP, so the dashboard can refresh its header. */
  onXpEarned?: (xpEarned: number, currentStreak?: number) => void;
  className?: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  'Rule Change': 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  'Money': 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  'Protest & Case Law': 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
  'Industry': 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
  'Field Note': 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Career': 'text-lime-600 dark:text-lime-400 bg-lime-500/10 border-lime-500/30',
};

function BriefBody({ brief }: { brief: Brief }) {
  return (
    <div className="space-y-4">
      {brief.body.map((block, i) => {
        if (block.type === 'callout') {
          return (
            <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              {block.heading && (
                <div className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">{block.heading}</div>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>
            </div>
          );
        }
        if (block.type === 'list') {
          return (
            <div key={i}>
              {block.heading && <div className="text-sm font-semibold mb-2">{block.heading}</div>}
              <ul className="space-y-2">
                {(block.items ?? []).map((item, j) => {
                  const [label, desc] = item.split('|||');
                  return (
                    <li key={j} className="text-sm leading-relaxed">
                      <span className="font-medium">{label}</span>
                      {desc && <span className="text-muted-foreground">: {desc}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }
        return (
          <div key={i}>
            {block.heading && <div className="text-sm font-semibold mb-1">{block.heading}</div>}
            <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>
          </div>
        );
      })}
    </div>
  );
}

function BriefQuiz({ brief, onComplete, earnedXp }: { brief: Brief; onComplete: (score: number) => void; earnedXp: number | null }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answeredAll = brief.quiz.every(q => answers[q.id] !== undefined);

  const select = (qid: string, idx: number) => {
    if (answers[qid] !== undefined) return;
    const next = { ...answers, [qid]: idx };
    setAnswers(next);
    if (brief.quiz.every(q => next[q.id] !== undefined)) {
      const score = brief.quiz.reduce((n, q) => n + (next[q.id] === q.correct ? 1 : 0), 0);
      onComplete(score);
    }
  };

  return (
    <div className="space-y-5">
      {brief.quiz.map((q, qi) => {
        const chosen = answers[q.id];
        const answered = chosen !== undefined;
        return (
          <div key={q.id}>
            <div className="text-sm font-medium mb-2">
              {qi + 1}. {q.question}
            </div>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.correct;
                const isChosen = chosen === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => select(q.id, oi)}
                    disabled={answered}
                    className={cn(
                      "w-full text-left text-sm rounded-md border px-3 py-2 transition-colors",
                      !answered && "hover:border-primary/50 hover:bg-muted/50",
                      answered && isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                      answered && isChosen && !isCorrect && "border-rose-500/50 bg-rose-500/10",
                      answered && !isCorrect && !isChosen && "opacity-60",
                    )}
                  >
                    <span className="inline-flex items-start gap-2">
                      {answered && isCorrect && <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />}
                      {answered && isChosen && !isCorrect && <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />}
                      <span>{opt}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {answered && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{q.explanation}</p>
            )}
          </div>
        );
      })}
      {answeredAll && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          {earnedXp && earnedXp > 0
            ? `Brief complete. +${earnedXp} XP, and your streak is safe for today.`
            : 'Brief complete. Back next week.'}
        </div>
      )}
    </div>
  );
}

function BriefCard({
  brief,
  expanded,
  onToggle,
  onSelectLesson,
  isRead,
  onRead,
  earnedXp,
  featured,
}: {
  brief: Brief;
  expanded: boolean;
  onToggle: () => void;
  onSelectLesson?: (lessonId: string) => void;
  isRead: boolean;
  onRead: (score: number) => void;
  earnedXp: number | null;
  featured?: boolean;
}) {
  const catStyle = CATEGORY_STYLES[brief.category] ?? 'text-muted-foreground bg-muted border-border';
  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        featured ? "border-primary/30" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="outline" className={cn("text-[11px] px-2 py-0", catStyle)}>
              {brief.category}
            </Badge>
            <span className="text-[11px] text-muted-foreground">Week of {formatWeekOf(brief.weekOf)}</span>
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {brief.minutes} min
            </span>
            {isRead && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Read
              </span>
            )}
          </div>
          <div className={cn("font-semibold leading-snug", featured ? "text-base" : "text-sm")}>{brief.title}</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{brief.dek}</p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-border/60 pt-4">
          <BriefBody brief={brief} />

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="text-sm font-semibold mb-1">So what</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{brief.soWhat}</p>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Do this</div>
            <ul className="space-y-1.5">
              {brief.actions.map((a, i) => (
                <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">Quick check</div>
            <BriefQuiz brief={brief} onComplete={onRead} earnedXp={earnedXp} />
          </div>

          {brief.relatedLessons && brief.relatedLessons.length > 0 && onSelectLesson && (
            <div>
              <div className="text-sm font-semibold mb-2">Go deeper</div>
              <div className="flex flex-wrap gap-2">
                {brief.relatedLessons.map(id => (
                  <Button
                    key={id}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onSelectLesson(id)}
                  >
                    {id}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {brief.sources.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1.5">Sources</div>
              <ul className="space-y-1">
                {brief.sources.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground underline underline-offset-2"
                      >
                        {s.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      s.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WeeklyBrief({ onSelectLesson, onXpEarned, className }: WeeklyBriefProps) {
  const current = useMemo(() => getCurrentBrief(), []);
  const archive = useMemo(() => getBriefArchive(), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadBriefIds());
  const [xpByBrief, setXpByBrief] = useState<Record<string, number>>({});

  // Merge in what the server has recorded, so read state follows the user
  // across devices instead of living in one browser.
  useEffect(() => {
    let cancelled = false;
    fetchReadBriefIds().then(ids => {
      if (!cancelled) setReadIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!current) return null;

  const handleRead = (id: string, score: number) => {
    setReadIds(prev => new Set(prev).add(id));
    completeBrief(id, score).then(result => {
      if (result.xpEarned > 0) {
        setXpByBrief(prev => ({ ...prev, [id]: result.xpEarned }));
        onXpEarned?.(result.xpEarned, result.currentStreak);
      }
    });
  };

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          Acquisition This Week
        </h2>
        {archive.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setShowArchive(v => !v)}
          >
            {showArchive ? 'Hide past briefs' : `Past briefs (${archive.length})`}
          </Button>
        )}
      </div>

      <BriefCard
        brief={current}
        featured
        expanded={expandedId === current.id}
        onToggle={() => toggle(current.id)}
        onSelectLesson={onSelectLesson}
        isRead={readIds.has(current.id)}
        onRead={score => handleRead(current.id, score)}
        earnedXp={xpByBrief[current.id] ?? null}
      />

      {showArchive && (
        <div className="space-y-2">
          {archive.map(b => (
            <BriefCard
              key={b.id}
              brief={b}
              expanded={expandedId === b.id}
              onToggle={() => toggle(b.id)}
              onSelectLesson={onSelectLesson}
              isRead={readIds.has(b.id)}
              onRead={score => handleRead(b.id, score)}
              earnedXp={xpByBrief[b.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default WeeklyBrief;
