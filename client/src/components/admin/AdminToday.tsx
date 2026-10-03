// Phone-first admin home: today's numbers, what needs Lucas, and a user
// lookup with the handful of fixes he actually does from his phone.
// Server side: server/adminMobile.ts.

import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus, Activity, DollarSign, Crown, AlertTriangle, CreditCard, Hourglass,
  Mail, Search, RefreshCw, ChevronRight, Flame, KeyRound, ExternalLink, Gift,
  BookOpen, Zap, Clock, Inbox, Unlock, LifeBuoy, ChevronDown,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sheet } from "@/components/mobile/Sheet";
import { isNativeApp } from "@/lib/platform";

// ─── Types (mirror server/adminMobile.ts) ────────────────────────────────────

type AttentionKind = "past_due" | "cancelling" | "trial_ending" | "lead";
interface AttentionItem { kind: AttentionKind; title: string; detail: string; email: string; userId?: string; at?: string }
interface TodayData {
  generatedAt: string;
  signups: { today: number; yesterday: number; last7: number; total: number };
  active: { today: number; last7: number };
  /** paying = Stripe is billing them; comped = free Pro grants, team seats and comped Lifetime */
  plans: { paying: number; comped: number; trialing: number };
  revenue: { monthToDate: number; mrr: number; newSubs7d: number } | null;
  stripeNote: string | null;
  attention: AttentionItem[];
  recentSignups: Array<{ id: string; name: string; email: string; plan: string; registeredAt: string }>;
}
interface FoundUser { id: string; name: string; email: string; plan: string; hasAccess: boolean; lastActiveAt: string | null; isInternal: boolean }
interface UserSummary {
  id: string; name: string; firstName: string | null; email: string; status: string; plan: string;
  hasAccess: boolean; accessUntil: string | null; signIn: string[]; registeredAt: string | null;
  lastActiveAt: string | null; loginCount: number; minutesActive: number; lessonsDone: number;
  modulesDone: number; xp: number; streak: number; longestStreak: number; lastStreakDate: string | null;
  referralCount: number; referredBy: string | null; isAdmin: boolean; isInternal: boolean;
  unlockedLevel: "novice" | "intermediate" | "advanced";
  stripeUrl: string | null; subscriptionIsStripe: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toMs(v: string | null | undefined): number {
  if (!v) return NaN;
  let s = v.trim();
  if (/^\d{4}-\d{2}-\d{2} /.test(s)) s = s.replace(" ", "T");
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  return new Date(s).getTime();
}

export function ago(v: string | null | undefined): string {
  const t = toMs(v);
  if (!Number.isFinite(t)) return "never";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 45) return `${d}d ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function shortDate(v: string | null | undefined): string {
  const t = toMs(v);
  return Number.isFinite(t) ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "n/a";
}

export const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export async function jsonOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body?.message || "Request failed"), { body });
  return body;
}

export function openExternal(url: string) {
  if (isNativeApp()) {
    import("@capacitor/browser").then(({ Browser }) => Browser.open({ url })).catch(() => window.open(url, "_blank"));
  } else {
    window.open(url, "_blank", "noopener");
  }
}

/** A ready-to-send email in Lucas's voice. He can edit before sending. */
export function mailto(email: string, kind: AttentionKind | "hello", firstName?: string | null) {
  const hi = firstName ? `Hi ${firstName},` : "Hi there,";
  const sign = "\n\nLucas\nAcqlerate";
  const t: Record<string, [string, string]> = {
    trial_ending: ["Your Acqlerate trial", `${hi}\n\nQuick note from Lucas at Acqlerate. Your trial wraps up in a couple of days. If anything has been confusing, missing, or just plain boring, hit reply and tell me. I read every one.`],
    past_due: ["Heads up on your Acqlerate card", `${hi}\n\nLooks like your last payment didn't go through. Happens to the best of us (expired cards are sneaky). You can update it in the app under My Account, then Manage billing.`],
    cancelling: ["Quick question from Acqlerate", `${hi}\n\nSaw you cancelled. No hard feelings. What is one thing that would have made it worth keeping? Your answer comes straight to me, not a survey robot.`],
    lead: ["Welcome to Acqlerate", `${hi}\n\nThanks for signing up for updates. If you want to kick the tires, the first module is free: https://acqlerate.com/app`],
    hello: ["Hello from Acqlerate", `${hi}\n\n`],
  };
  const [subject, body] = t[kind];
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + sign)}`;
}

export function localBoundaries() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  return { todayStart: today.toISOString(), monthStart: month.toISOString() };
}

// ─── Small pieces ───────────────────────────────────────────────────────────

export function Tile({ icon, label, value, sub, tone }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode; tone: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3.5 lg:p-5 min-w-0">
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${tone}`}>
        {icon}<span className="truncate">{label}</span>
      </div>
      <div className="mt-1 lg:mt-2 text-2xl lg:text-3xl font-bold text-foreground tabular-nums leading-tight">{value}</div>
      {sub && <div className="mt-0.5 lg:mt-1 text-xs lg:text-sm text-muted-foreground leading-snug">{sub}</div>}
    </div>
  );
}

const KIND_STYLE: Record<AttentionKind, { icon: ReactNode; ring: string }> = {
  past_due: { icon: <CreditCard className="w-4 h-4 text-red-500" />, ring: "bg-red-500/10" },
  cancelling: { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, ring: "bg-amber-500/10" },
  trial_ending: { icon: <Hourglass className="w-4 h-4 text-sky-500" />, ring: "bg-sky-500/10" },
  lead: { icon: <Inbox className="w-4 h-4 text-emerald-500" />, ring: "bg-emerald-500/10" },
};

export function UserRow({ name, email, right, onClick, testId }: { name: string; email: string; right: ReactNode; onClick: () => void; testId?: string }) {
  return (
    <button onClick={onClick} data-testid={testId} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors">
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
        {(name || email).trim().charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{name}</div>
        <div className="text-xs text-muted-foreground truncate">{email}</div>
      </div>
      <div className="text-right text-[11px] text-muted-foreground flex-shrink-0">{right}</div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
    </button>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function AdminToday() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const today = useQuery<TodayData>({
    queryKey: ["/api/admin/today"],
    queryFn: async () => {
      const { todayStart, monthStart } = localBoundaries();
      const res = await apiRequest("GET", `/api/admin/today?todayStart=${encodeURIComponent(todayStart)}&monthStart=${encodeURIComponent(monthStart)}`);
      return jsonOrThrow(res);
    },
    staleTime: 60_000,
  });

  const found = useQuery<{ total: number; users: FoundUser[] }>({
    queryKey: ["/api/admin/find-users", dq],
    queryFn: async () => jsonOrThrow(await apiRequest("GET", `/api/admin/find-users?q=${encodeURIComponent(dq)}`)),
    enabled: dq.length > 0,
  });

  const d = today.data;

  return (
    <div className="space-y-5 lg:space-y-6 w-full" data-testid="admin-today">
      {/* Refresh line */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {d ? `Updated ${new Date(d.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : today.isLoading ? "Loading…" : ""}
        </p>
        <button
          onClick={() => today.refetch()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/10"
          data-testid="admin-today-refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${today.isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {today.isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-foreground">
          Couldn't load today's numbers. Check your connection and tap Refresh.
        </div>
      )}

      {/* Numbers */}
      {d && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
          <Tile tone="text-violet-500" icon={<UserPlus className="w-3.5 h-3.5" />} label="New signups" value={d.signups.today}
            sub={`${d.signups.yesterday} yesterday · ${d.signups.last7} this week`} />
          <Tile tone="text-emerald-500" icon={<Activity className="w-3.5 h-3.5" />} label="Active today" value={d.active.today}
            sub={`${d.active.last7} in the last 7 days`} />
          <Tile tone="text-amber-500" icon={<DollarSign className="w-3.5 h-3.5" />} label="This month"
            value={d.revenue ? money(d.revenue.monthToDate) : "n/a"}
            sub={d.revenue ? `${money(d.revenue.mrr)} monthly recurring` : d.stripeNote} />
          <Tile tone="text-sky-500" icon={<Crown className="w-3.5 h-3.5" />} label="Paying" value={d.plans.paying}
            sub={`${d.plans.trialing} on trial · ${d.plans.comped} comped${d.revenue ? ` · ${d.revenue.newSubs7d} new this week` : ""}`} />
        </div>
      )}
      {today.isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-[92px] lg:h-[118px] rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Desktop: "Needs you" and "Find a user" side by side */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6 items-start">
      {/* Needs you */}
      {d && (
        <section>
          <h2 className="text-sm font-bold text-foreground mb-2">Needs you {d.attention.length > 0 && <span className="text-muted-foreground font-medium">({d.attention.length})</span>}</h2>
          {d.attention.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              All quiet. Nothing needs you right now. Go touch grass (or write a lesson).
            </div>
          ) : (
            <div className="space-y-2">
              {d.attention.map((a, i) => (
                <div key={`${a.kind}-${a.email}-${i}`} className="rounded-2xl border border-border bg-card p-3.5" data-testid={`attention-${a.kind}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${KIND_STYLE[a.kind].ring}`}>{KIND_STYLE[a.kind].icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground leading-snug break-words">{a.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.detail}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2.5 pl-11">
                    {a.email && (
                      <a href={mailto(a.email, a.kind)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">
                        <Mail className="w-3.5 h-3.5" /> Email
                      </a>
                    )}
                    {a.userId && (
                      <button onClick={() => setOpenId(a.userId!)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-foreground">
                        Open
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Find a user */}
      <section>
        <h2 className="text-sm font-bold text-foreground mb-2">Find a user</h2>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Name or email"
            inputMode="search"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-foreground text-[16px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="admin-user-search"
          />
        </div>

        <div className="mt-2 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {dq ? (
            found.isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Searching…</div>
            ) : (found.data?.users.length ?? 0) === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Nobody by that name. Check the spelling, or try part of their email.</div>
            ) : (
              <>
                {found.data!.users.map(u => (
                  <UserRow key={u.id} name={u.name + (u.isInternal ? " (you)" : "")} email={u.email} onClick={() => setOpenId(u.id)} testId="admin-found-user"
                    right={<><div className={u.hasAccess ? "text-emerald-600 font-semibold" : ""}>{u.plan}</div><div>{ago(u.lastActiveAt)}</div></>} />
                ))}
                {found.data!.total > found.data!.users.length && (
                  <div className="px-4 py-2.5 text-xs text-muted-foreground">Showing 25 of {found.data!.total}. Type more to narrow it down.</div>
                )}
              </>
            )
          ) : (
            <>
              <div className="px-3.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Newest signups</div>
              {(d?.recentSignups ?? []).map(u => (
                <UserRow key={u.id} name={u.name} email={u.email} onClick={() => setOpenId(u.id)}
                  right={<><div>{u.plan}</div><div>{ago(u.registeredAt)}</div></>} />
              ))}
              {d && d.recentSignups.length === 0 && <div className="p-4 text-sm text-muted-foreground">No signups yet.</div>}
            </>
          )}
        </div>
      </section>
      </div>

      {openId && <UserSheet id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

// ─── One user ───────────────────────────────────────────────────────────────

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2.5 min-w-0">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">{icon}{label}</div>
      <div className="text-sm font-bold text-foreground truncate">{value}</div>
    </div>
  );
}

export function UserSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const key = ["/api/admin/users", id, "summary"];
  // Anything that changes an account takes two taps: the first arms it.
  const [armed, setArmed] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [streakInput, setStreakInput] = useState<string>("");

  const { data: u, isLoading, isError } = useQuery<UserSummary>({
    queryKey: key,
    queryFn: async () => jsonOrThrow(await apiRequest("GET", `/api/admin/users/${id}/summary`)),
  });

  useEffect(() => {
    if (u && streakInput === "") setStreakInput(String(Math.max(u.longestStreak, u.streak, 1)));
  }, [u]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = useMutation({
    mutationFn: async ({ path, body }: { path: string; body?: unknown }) =>
      jsonOrThrow(await apiRequest("POST", `/api/admin/users/${id}/${path}`, body ?? {})),
    onSuccess: (data: { message: string; user: UserSummary | null }) => {
      if (data.user) qc.setQueryData(key, data.user);
      qc.invalidateQueries({ queryKey: ["/api/admin/today"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/people"] });
      toast({ title: "Done", description: data.message });
      setArmed(null);
    },
    onError: (err: any) => {
      if (err?.body?.user) qc.setQueryData(key, err.body.user);
      toast({ title: "Not changed", description: err.message, variant: "destructive" });
      setArmed(null);
    },
  });

  const remove = useMutation({
    mutationFn: async () => jsonOrThrow(await apiRequest("DELETE", `/api/admin/users/${id}`)),
    onSuccess: (data: { message?: string }) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/people"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/today"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Deleted", description: data?.message ?? "User deleted." });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Not deleted", description: err.message, variant: "destructive" });
      setArmed(null);
    },
  });

  const busy = act.isPending || remove.isPending;
  /** Two-tap button: first tap arms, second runs. */
  const twoTap = (key: string, label: string, run: () => void, opts: { disabled?: boolean; danger?: boolean; testId?: string } = {}) => {
    const on = armed === key;
    return (
      <button
        key={key}
        disabled={busy || opts.disabled}
        onClick={() => (on ? run() : setArmed(key))}
        className={`min-h-10 px-2 py-2 rounded-xl text-xs font-bold leading-tight transition-colors disabled:opacity-40 ${
          on ? (opts.danger ? "bg-red-600 text-white" : "bg-amber-500 text-white")
             : opts.danger ? "border border-red-500/40 text-red-600 hover:bg-red-500/10" : "border border-border text-foreground hover:bg-muted"}`}
        data-testid={opts.testId ?? key}
      >
        {on ? "Tap to confirm" : label}
      </button>
    );
  };
  const paying = u ? ["active", "annual", "lifetime"].includes(u.status) : false;
  const billedByStripe = !!u && u.subscriptionIsStripe && ["active", "annual"].includes(u.status);
  const levelRank = { novice: 0, intermediate: 1, advanced: 2 } as const;

  return (
    <Sheet
      title={u?.name ?? "User"}
      subtitle={u?.email}
      onClose={onClose}
      testId="admin-user-sheet"
    >
      <div className="px-5 py-4 space-y-4">
        {isLoading && <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>}
        {isError && <div className="py-10 text-center text-sm text-muted-foreground">Couldn't load this user.</div>}
        {u && (
          <>
            {/* Plan line */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.hasAccess ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                {u.plan}
              </span>
              {u.accessUntil && u.hasAccess && <span className="text-xs text-muted-foreground">until {shortDate(u.accessUntil)}</span>}
              {u.isAdmin && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600">Admin</span>}
              {u.isInternal && !u.isAdmin && <span className="text-xs text-muted-foreground">(your test account)</span>}
            </div>

            {/* Numbers */}
            <div className="grid grid-cols-3 gap-2">
              <Stat icon={<BookOpen className="w-3 h-3" />} label="Lessons" value={u.lessonsDone} />
              <Stat icon={<Crown className="w-3 h-3" />} label="Modules" value={u.modulesDone} />
              <Stat icon={<Zap className="w-3 h-3" />} label="XP" value={u.xp.toLocaleString()} />
              <Stat icon={<Flame className="w-3 h-3" />} label="Streak" value={`${u.streak} (best ${u.longestStreak})`} />
              <Stat icon={<Activity className="w-3 h-3" />} label="Last seen" value={ago(u.lastActiveAt)} />
              <Stat icon={<Clock className="w-3 h-3" />} label="Time in app" value={u.minutesActive >= 90 ? `${Math.round(u.minutesActive / 60)}h` : `${u.minutesActive}m`} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {u.registeredAt ? `Joined ${shortDate(u.registeredAt)} · ` : ""}{u.loginCount} login{u.loginCount === 1 ? "" : "s"} · signs in with {u.signIn.join(" + ") || "n/a"}
              {u.referredBy ? ` · referred by code ${u.referredBy}` : ""}
              {u.referralCount > 0 ? ` · has referred ${u.referralCount}` : ""}
            </p>

            {/* Give Pro */}
            <div className="rounded-2xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Gift className="w-4 h-4 text-amber-500" /> Access: give time</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {u.status === "lifetime" ? "Lifetime already. They're set for life (literally)."
                  : paying ? `Paying ${u.plan}. "1 year" adds a year of credit to their Stripe billing.`
                  : "Stacks on any time they have left. No card needed."}
              </p>
              {u.status !== "lifetime" && (
                <div className="grid grid-cols-3 gap-2 mt-2.5">
                  {[7, 30, 365].map(days =>
                    twoTap(`give-${days}`, days === 365 ? "+1 year" : `+${days} days`,
                      () => act.mutate({ path: "give-access", body: { days } }),
                      { disabled: paying && days !== 365 }))}
                </div>
              )}
            </div>

            {/* Set plan */}
            <div className="rounded-2xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Crown className="w-4 h-4 text-teal-500" /> Access: set plan</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {billedByStripe
                  ? `Pays through Stripe (${u.plan}). Change or cancel it in Stripe so billing matches.`
                  : "Free of charge, no end date. Annual is how team seats are set up."}
              </p>
              {!billedByStripe && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
                  {twoTap("plan-monthly", "Monthly", () => act.mutate({ path: "set-plan", body: { plan: "monthly" } }), { disabled: u.status === "active" })}
                  {twoTap("plan-annual", "Annual (team seat)", () => act.mutate({ path: "set-plan", body: { plan: "annual" } }), { disabled: u.status === "annual" })}
                  {twoTap("plan-lifetime", "Lifetime", () => act.mutate({ path: "set-plan", body: { plan: "lifetime" } }), { disabled: u.status === "lifetime" })}
                  {twoTap("plan-free", "Remove Pro", () => act.mutate({ path: "set-plan", body: { plan: "free" } }), { disabled: !u.hasAccess, danger: true })}
                </div>
              )}
            </div>

            {/* Help */}
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <LifeBuoy className="w-3.5 h-3.5" /> Help
            </div>

            {/* Unlock levels */}
            <div className="rounded-2xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Unlock className="w-4 h-4 text-blue-500" /> Unlock levels</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Skips the gate check in every module. Highest open now: <span className="font-semibold capitalize">{u.unlockedLevel}</span>.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                {twoTap("unlock-intermediate", "Intermediate", () => act.mutate({ path: "unlock-level", body: { level: "intermediate" } }), { disabled: levelRank[u.unlockedLevel] >= 1 })}
                {twoTap("unlock-advanced", "Advanced", () => act.mutate({ path: "unlock-level", body: { level: "advanced" } }), { disabled: levelRank[u.unlockedLevel] >= 2 })}
              </div>
            </div>

            {/* Streak */}
            <div className="rounded-2xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Flame className="w-4 h-4 text-orange-500" /> Restore streak</div>
              <p className="text-xs text-muted-foreground mt-0.5">For "the app ate my streak" emails. They keep it by doing a lesson today.</p>
              <div className="flex gap-2 mt-2.5">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={3650}
                  value={streakInput}
                  onChange={e => setStreakInput(e.target.value)}
                  className="w-24 h-10 px-3 rounded-xl border border-border bg-background text-foreground text-[16px] tabular-nums"
                  aria-label="Streak days"
                  data-testid="streak-input"
                />
                <button
                  disabled={busy || !(Number(streakInput) >= 1)}
                  onClick={() => act.mutate({ path: "set-streak", body: { streak: Number(streakInput) } })}
                  className="flex-1 h-10 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40"
                  data-testid="streak-save"
                >
                  Set to {Number(streakInput) || 0} day{Number(streakInput) === 1 ? "" : "s"}
                </button>
              </div>
            </div>

            {/* Contact + account */}
            <div className="grid grid-cols-2 gap-2">
              <a href={mailto(u.email, "hello", u.firstName)} className="h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-1.5">
                <Mail className="w-4 h-4" /> Email {u.firstName || "them"}
              </a>
              <button
                disabled={busy}
                onClick={() => act.mutate({ path: "send-reset" })}
                className="h-11 rounded-xl border border-border text-sm font-bold text-foreground inline-flex items-center justify-center gap-1.5 hover:bg-muted disabled:opacity-40"
                data-testid="send-reset"
              >
                <KeyRound className="w-4 h-4" /> Send reset link
              </button>
            </div>
            {u.stripeUrl && (
              <button onClick={() => openExternal(u.stripeUrl!)} className="w-full h-10 rounded-xl text-xs font-semibold text-primary inline-flex items-center justify-center gap-1.5 hover:bg-primary/10">
                <ExternalLink className="w-3.5 h-3.5" /> Open in Stripe (refunds, receipts, billing)
              </button>
            )}

            {/* Rare */}
            <div className="border-t border-border pt-3">
              <button onClick={() => { setShowMore(v => !v); setArmed(null); }}
                className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground" data-testid="user-more">
                More (admin access, delete)
                <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
              </button>
              {showMore && (
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  {u.isAdmin
                    ? twoTap("admin-off", "Remove admin", () => act.mutate({ path: "set-admin", body: { admin: false } }))
                    : twoTap("admin-on", "Make admin", () => act.mutate({ path: "set-admin", body: { admin: true } }))}
                  {twoTap("delete", "Delete user", () => remove.mutate(), { danger: true })}
                  <p className="col-span-2 text-[11px] text-muted-foreground leading-snug">
                    Delete removes their account and progress for good, and cancels any Stripe subscription first.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
