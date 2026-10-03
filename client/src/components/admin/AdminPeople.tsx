// People: one list for everyone Lucas deals with. Replaces the old Users,
// Leads and Referrals tabs and the two engagement tables. Tap anyone to open
// the same user card the Today screen uses (UserSheet). Leads have no account,
// so tapping one opens a ready-to-send welcome email instead.
// Server side: GET /api/admin/people in server/adminMobile.ts.

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw, Download, ChevronRight, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { UserSheet, ago, shortDate, mailto } from "./AdminToday";

interface Person {
  id: string; name: string; email: string; status: string; plan: string; hasAccess: boolean;
  trialEndsAt: string | null; registeredAt: string | null; lastActiveAt: string | null;
  lessons: number; xp: number; referralCount: number; referredBy: string | null;
  isAdmin: boolean; isInternal: boolean;
}
interface Lead { email: string; source: string | null; createdAt: string | null }

type Filter = "all" | "trial" | "trial_ended" | "paying" | "free" | "referrals" | "leads";
type SortKey = "active" | "newest" | "lessons" | "xp";

const PAID = ["active", "annual", "lifetime"];

const FILTERS: { key: Filter; label: string; test: (p: Person) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "trial", label: "On trial", test: p => p.status === "trialing" },
  { key: "trial_ended", label: "Trial ended", test: p => p.status === "trial_ended" },
  { key: "paying", label: "Paying", test: p => PAID.includes(p.status) },
  { key: "free", label: "Free", test: p => p.status === "free" },
  { key: "referrals", label: "Referrals", test: p => p.referralCount > 0 || !!p.referredBy },
];

const BADGE: Record<string, string> = {
  lifetime: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  annual: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  trialing: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  trial_ended: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  free: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  lead: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};
const LABEL: Record<string, string> = {
  lifetime: "Lifetime", annual: "Annual", active: "Monthly", trialing: "Trial",
  trial_ended: "Trial ended", free: "Free", lead: "Lead",
};

function ms(v: string | null): number {
  if (!v) return 0;
  const t = new Date(v.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00")).getTime();
  return Number.isFinite(t) ? t : 0;
}

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${BADGE[status] ?? BADGE.free}`}>
      {LABEL[status] ?? status}
    </span>
  );
}

function trialNote(p: Person): string | null {
  if (p.status !== "trialing" || !p.trialEndsAt) return null;
  const days = Math.max(0, Math.ceil((ms(p.trialEndsAt) - Date.now()) / 864e5));
  return days <= 1 ? "ends today" : `${days}d left`;
}

export default function AdminPeople() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("active");
  const [showTest, setShowTest] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery<{ users: Person[]; leads: Lead[] }>({
    queryKey: ["/api/admin/people"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/people");
      if (!res.ok) throw new Error("Failed to load people");
      return res.json();
    },
    staleTime: 30_000,
  });

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text: string) => words.every(w => text.toLowerCase().includes(w));

  const base = useMemo(
    () => (data?.users ?? []).filter(p => showTest || !p.isInternal),
    [data, showTest],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.key] = base.filter(f.test).length;
    c.leads = data?.leads.length ?? 0;
    return c;
  }, [base, data]);

  const people = useMemo(() => {
    if (filter === "leads") return [];
    const test = FILTERS.find(f => f.key === filter)!.test;
    const list = base.filter(p => test(p) && matches(`${p.name} ${p.email}`));
    const key: Record<SortKey, (p: Person) => number> = {
      active: p => ms(p.lastActiveAt) || ms(p.registeredAt),
      newest: p => ms(p.registeredAt),
      lessons: p => p.lessons,
      xp: p => p.xp,
    };
    return list.sort((a, b) => key[sort](b) - key[sort](a));
  }, [base, filter, sort, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const leads = useMemo(() => {
    if (filter !== "leads" && !(filter === "all" && words.length > 0)) return [];
    return (data?.leads ?? [])
      .filter(l => matches(`${l.email} ${l.source ?? ""}`))
      .sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  }, [data, filter, q]); // eslint-disable-line react-hooks/exhaustive-deps

  function exportLeads() {
    const rows = (data?.leads ?? []).map(l => `${l.email},${l.source ?? ""},${l.createdAt ?? ""}`).join("\n");
    const url = URL.createObjectURL(new Blob(["email,source,created_at\n" + rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `acqlerate-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const empty = !isLoading && people.length === 0 && leads.length === 0;

  return (
    <div className="space-y-3 lg:space-y-4 w-full" data-testid="admin-people">
      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Name or email"
            inputMode="search"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-foreground text-[16px] lg:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="people-search"
          />
        </div>
        {filter !== "leads" && (
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="h-11 px-2.5 rounded-xl border border-border bg-card text-foreground text-sm"
            aria-label="Sort"
            data-testid="people-sort"
          >
            <option value="active">Last seen</option>
            <option value="newest">Newest</option>
            <option value="lessons">Most lessons</option>
            <option value="xp">Most XP</option>
          </select>
        )}
        <button onClick={() => refetch()} aria-label="Refresh"
          className="h-11 w-11 flex-shrink-0 inline-flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none]">
        {[...FILTERS.map(f => ({ key: f.key, label: f.label })), { key: "leads" as Filter, label: "Leads" }].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}
            data-testid={`people-filter-${f.key}`}
          >
            {f.label} <span className={filter === f.key ? "opacity-80" : "text-muted-foreground"}>{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-foreground">
          Couldn't load people. Check your connection and tap refresh.
        </div>
      )}
      {isLoading && <div className="h-40 rounded-2xl bg-muted animate-pulse" />}

      {/* Desktop table */}
      {people.length > 0 && (
        <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="text-left font-semibold px-4 py-2.5">Person</th>
                <th className="text-left font-semibold px-3 py-2.5">Status</th>
                <th className="text-right font-semibold px-3 py-2.5">Lessons</th>
                <th className="text-right font-semibold px-3 py-2.5">XP</th>
                <th className="text-right font-semibold px-3 py-2.5">Last seen</th>
                <th className="text-right font-semibold px-4 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {people.map(p => (
                <tr key={p.id} onClick={() => setOpenId(p.id)} className="cursor-pointer hover:bg-muted/50" data-testid="people-row">
                  <td className="px-4 py-2.5 max-w-[320px]">
                    <div className="font-semibold text-foreground truncate">
                      {p.name}
                      {p.isAdmin && <span className="ml-1.5 text-[10px] font-semibold text-violet-600">ADMIN</span>}
                      {p.isInternal && <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground">TEST</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5"><Badge status={p.status} />
                      {trialNote(p) && <span className="text-[11px] text-muted-foreground">{trialNote(p)}</span>}
                      {p.referralCount > 0 && <span className="text-[11px] text-muted-foreground">· referred {p.referralCount}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{p.lessons}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{p.xp.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground whitespace-nowrap">{ago(p.lastActiveAt)}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap">{shortDate(p.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phone cards */}
      {people.length > 0 && (
        <div className="lg:hidden rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {people.map(p => (
            <button key={p.id} onClick={() => setOpenId(p.id)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-muted" data-testid="people-card">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(p.name || p.email).trim().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{p.name}{p.isInternal ? " (test)" : ""}</div>
                <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {p.lessons} lesson{p.lessons === 1 ? "" : "s"} · seen {ago(p.lastActiveAt)}{trialNote(p) ? ` · ${trialNote(p)}` : ""}
                </div>
              </div>
              <Badge status={p.status} />
              <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Leads (no account yet) */}
      {leads.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Leads: gave an email, no account yet
          </div>
          {leads.map(l => (
            <a key={l.email} href={mailto(l.email, "lead")} className="flex items-center gap-3 px-3.5 py-3 hover:bg-muted/50" data-testid="people-lead">
              <div className="w-9 h-9 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{l.email}</div>
                <div className="text-xs text-muted-foreground truncate">From {l.source ?? "site"} · {ago(l.createdAt)}</div>
              </div>
              <Badge status="lead" />
            </a>
          ))}
        </div>
      )}

      {empty && !isError && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {words.length ? "Nobody matches that. Try part of their email." : "Nobody here yet."}
        </div>
      )}

      {/* Footer: test accounts + exports */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showTest} onChange={e => setShowTest(e.target.checked)} className="accent-[hsl(var(--primary))]" />
          Show your test accounts
        </label>
        <div className="flex items-center gap-3">
          <Download className="w-3.5 h-3.5" />
          <a href="/api/admin/export/users.csv" download className="font-semibold text-primary hover:underline">Users CSV</a>
          <a href="/api/admin/export/sessions.csv" download className="font-semibold text-primary hover:underline">Sessions CSV</a>
          <button onClick={exportLeads} className="font-semibold text-primary hover:underline">Leads CSV</button>
        </div>
      </div>

      {openId && <UserSheet id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
