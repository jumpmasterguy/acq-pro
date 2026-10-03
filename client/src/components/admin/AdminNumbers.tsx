// Numbers: the whole business on one screen. Replaces the old Analytics tab
// and the separate Analytics page. Every figure comes from server/adminStats.ts,
// the same functions behind Today and the founder review.
// Server side: GET /api/admin/numbers in server/adminMobile.ts.

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign, Repeat, CalendarRange, Crown, UserPlus, Activity, BookOpen, Clock,
  Timer, RefreshCw, ExternalLink, Headphones, BarChart3, Users, ShoppingCart,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { modules, getAllLessons } from "@/lib/curriculumMeta";
import { Tile, money, localBoundaries, jsonOrThrow, openExternal } from "./AdminToday";

type Bucket = "paying" | "comped" | "lifetime" | "trialing" | "trialEnded" | "free";
interface NumbersData {
  generatedAt: string;
  counts: {
    total: number;
    plans: Record<Bucket, number>;
    signups: { today: number; yesterday: number; last7: number; last30: number; byDay: { day: string; count: number }[] };
    active: { today: number; last24h: number; last7: number };
  };
  usage: {
    avgLessons: number; avgMinutes: number; avgSessionMinutes: number | null; sessionsTracked: number;
    topLessons: { id: string; count: number; pct: number }[];
    audio: { moduleId: string; plays: number; listeners: number }[];
  };
  trials: { month: string; ended: number; checkout: number }[] | null;
  checkoutGraceDays: number;
  money: { monthToDate: number; last12Months: number; mrr: number; activeSubscriptions: number; newSubs7d: number } | null;
  stripeNote: string | null;
}

// Order = the path people take: in on trial, then pay, comp, or drop to free.
const SEGMENTS: { key: Bucket | "compedAll"; label: string; color: string }[] = [
  { key: "paying", label: "Paying", color: "bg-emerald-500" },
  { key: "compedAll", label: "Comped & Lifetime", color: "bg-amber-400" },
  { key: "trialing", label: "On trial", color: "bg-sky-500" },
  { key: "trialEnded", label: "Trial ended", color: "bg-slate-400" },
  { key: "free", label: "Free", color: "bg-slate-200 dark:bg-slate-700" },
];

const lessonInfo = new Map(getAllLessons().map(({ lesson, module }) => [lesson.id, { title: lesson.title, module: module.title }]));

function monthName(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "long", timeZone: "UTC" });
}

function Section({ icon, title, right, children }: { icon: ReactNode; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">{icon}{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function AdminNumbers() {
  const { data: d, isLoading, isError, isFetching, refetch } = useQuery<NumbersData>({
    queryKey: ["/api/admin/numbers"],
    queryFn: async () => {
      const { todayStart, monthStart } = localBoundaries();
      return jsonOrThrow(await apiRequest("GET", `/api/admin/numbers?todayStart=${encodeURIComponent(todayStart)}&monthStart=${encodeURIComponent(monthStart)}`));
    },
    staleTime: 60_000,
  });

  const plans = d?.counts.plans;
  const segValue = (k: Bucket | "compedAll") => !plans ? 0 : k === "compedAll" ? plans.comped + plans.lifetime : plans[k];
  const maxDay = Math.max(1, ...(d?.counts.signups.byDay ?? []).map(x => x.count));

  return (
    <div className="space-y-6 lg:space-y-8 w-full" data-testid="admin-numbers">
      {/* Refresh line */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {d ? `Updated ${new Date(d.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · your own accounts left out` : isLoading ? "Loading…" : ""}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => openExternal("https://dashboard.stripe.com")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/10">
            <ExternalLink className="w-3.5 h-3.5" /> Stripe
          </button>
          <button onClick={() => refetch()} data-testid="numbers-refresh"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/10">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-foreground">
          Couldn't load the numbers. Check your connection and tap Refresh.
        </div>
      )}
      {isLoading && <div className="h-64 rounded-2xl bg-muted animate-pulse" />}

      {d && plans && (
        <>
          {/* Money */}
          <Section icon={<DollarSign className="w-4 h-4 text-amber-500" />} title="Money">
            {d.money ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
                <Tile tone="text-amber-500" icon={<DollarSign className="w-3.5 h-3.5" />} label="This month" value={money(d.money.monthToDate)} sub="Collected, after refunds" />
                <Tile tone="text-emerald-500" icon={<Repeat className="w-3.5 h-3.5" />} label="Monthly recurring" value={money(d.money.mrr)} sub="Annual counted as 1/12" />
                <Tile tone="text-violet-500" icon={<CalendarRange className="w-3.5 h-3.5" />} label="Last 12 months" value={money(d.money.last12Months)} sub="Everything Stripe collected" />
                <Tile tone="text-sky-500" icon={<Crown className="w-3.5 h-3.5" />} label="Subscriptions" value={d.money.activeSubscriptions} sub={`${d.money.newSubs7d} new this week`} />
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">{d.stripeNote}</div>
            )}
          </Section>

          {/* Where everyone is */}
          <Section icon={<Users className="w-4 h-4 text-sky-500" />} title={`Where everyone is (${d.counts.total})`}>
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Share of people on each plan">
                {SEGMENTS.map(s => segValue(s.key) > 0 && (
                  <div key={s.key} className={s.color} style={{ width: `${(segValue(s.key) / Math.max(1, d.counts.total)) * 100}%` }} />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-2">
                {SEGMENTS.map(s => (
                  <div key={s.key} className="flex items-center gap-2 min-w-0" data-testid={`numbers-plan-${s.key}`}>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                    <span className="text-xs text-muted-foreground truncate">{s.label}</span>
                    <span className="ml-auto sm:ml-1 text-sm font-bold text-foreground tabular-nums">{segValue(s.key)}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Paying means Stripe bills them. Comped covers free Pro grants, hand-made team seats and Lifetime accounts.
              </p>
            </div>
          </Section>

          {/* Trials to checkout */}
          <Section icon={<ShoppingCart className="w-4 h-4 text-emerald-500" />} title="Trials that ended">
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {d.trials ? d.trials.map(t => (
                <div key={t.month} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-semibold text-foreground">{monthName(t.month)}</span>
                  <span className="text-sm text-muted-foreground text-right">
                    <span className="font-bold text-foreground tabular-nums">{t.ended}</span> ended ·{" "}
                    <span className="font-bold text-foreground tabular-nums">{t.checkout}</span> opened checkout
                  </span>
                </div>
              )) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">Checkout records couldn't be loaded just now.</div>
              )}
              <p className="px-4 py-2.5 text-[11px] text-muted-foreground leading-snug">
                Checkout counts if they opened it before the trial ended or within {d.checkoutGraceDays} days after. Recorded since 2 Oct 2026.
              </p>
            </div>
          </Section>

          {/* Signups */}
          <Section icon={<UserPlus className="w-4 h-4 text-violet-500" />} title="Signups">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span><span className="font-bold text-foreground tabular-nums">{d.counts.signups.today}</span> <span className="text-muted-foreground">today</span></span>
                <span><span className="font-bold text-foreground tabular-nums">{d.counts.signups.last7}</span> <span className="text-muted-foreground">last 7 days</span></span>
                <span><span className="font-bold text-foreground tabular-nums">{d.counts.signups.last30}</span> <span className="text-muted-foreground">last 30 days</span></span>
              </div>
              <div className="mt-4 flex items-end gap-1 h-28" role="img" aria-label="Signups per day, last 14 days">
                {d.counts.signups.byDay.map(({ day, count }) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${day}: ${count}`}>
                    <span className="text-[10px] text-muted-foreground tabular-nums h-3">{count || ""}</span>
                    <div className="w-full rounded-sm bg-primary" style={{ height: `${Math.max(2, (count / maxDay) * 72)}px`, opacity: count ? 1 : 0.15 }} />
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Number(day.slice(8))}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Engagement */}
          <Section icon={<Activity className="w-4 h-4 text-emerald-500" />} title="Engagement">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
              <Tile tone="text-emerald-500" icon={<Activity className="w-3.5 h-3.5" />} label="Active today" value={d.counts.active.today} sub={`${d.counts.active.last7} in the last 7 days`} />
              <Tile tone="text-sky-500" icon={<BookOpen className="w-3.5 h-3.5" />} label="Lessons per person" value={d.usage.avgLessons} sub="Average, all time" />
              <Tile tone="text-amber-500" icon={<Clock className="w-3.5 h-3.5" />} label="Minutes per person" value={d.usage.avgMinutes} sub="Average time in the app" />
              <Tile tone="text-violet-500" icon={<Timer className="w-3.5 h-3.5" />} label="Average visit" value={d.usage.avgSessionMinutes != null ? `${d.usage.avgSessionMinutes}m` : "n/a"} sub={`${d.usage.sessionsTracked} visits tracked`} />
            </div>
          </Section>

          {/* Content */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 items-start">
            <Section icon={<BarChart3 className="w-4 h-4 text-primary" />} title="Most finished lessons">
              <div className="rounded-2xl border border-border bg-card divide-y divide-border">
                {d.usage.topLessons.length === 0 && <div className="px-4 py-3 text-sm text-muted-foreground">No finished lessons yet.</div>}
                {d.usage.topLessons.map(l => {
                  const info = lessonInfo.get(l.id);
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{info?.title ?? l.id}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{info?.module ?? "Removed lesson"}</div>
                      </div>
                      <span className="text-sm font-bold text-foreground tabular-nums">{l.count}</span>
                      <span className="w-10 text-right text-xs text-primary font-semibold tabular-nums">{l.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section icon={<Headphones className="w-4 h-4 text-primary" />} title="The Debrief listens">
              <div className="rounded-2xl border border-border bg-card divide-y divide-border">
                {d.usage.audio.length === 0 && <div className="px-4 py-3 text-sm text-muted-foreground">No plays yet. This fills in as people listen.</div>}
                {d.usage.audio.map(a => (
                  <div key={a.moduleId} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">{modules.find(m => m.id === a.moduleId)?.title ?? a.moduleId}</div>
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{a.listeners} listener{a.listeners === 1 ? "" : "s"}</span>
                    <span className="w-16 text-right text-sm font-bold text-foreground tabular-nums whitespace-nowrap">{a.plays} play{a.plays === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
