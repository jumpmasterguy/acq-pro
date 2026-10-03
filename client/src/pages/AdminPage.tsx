import { useState } from "react";
import AdminToday, { UserSheet } from "@/components/admin/AdminToday";
import AdminPeople from "@/components/admin/AdminPeople";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, Crown, RefreshCw, BarChart2, Clock, Zap, Activity, BookOpen, Target, LogIn, Mail, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { displayStatus } from "@shared/access";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsUser {
  id: string;
  username: string;
  email: string;
  subscriptionStatus: string;
  trialEndsAt?: string | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  loginCount: number;
  totalMinutesActive: number;
  xp: number;
  completedLessons: number;
  avgQuizScore: number;
  highestSkillLevel: "novice" | "intermediate" | "advanced";
}

interface AnalyticsAggregate {
  totalUsers: number;
  proUsers: number;
  dau: number;
  avgXp: number;
  avgLessons: number;
  avgMinutes: number;
}

interface AnalyticsData {
  aggregate: AnalyticsAggregate;
  users: AnalyticsUser[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  lifetime: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  annual:   "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  trialing: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  trial_ended: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  active:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  free:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const statusLabel: Record<string, string> = {
  lifetime: "Lifetime Pro",
  annual:   "Annual Pro",
  active:   "Monthly Pro",
  trialing: "Trial",
  trial_ended: "Trial ended",
  free:     "Free",
};

const skillColors: Record<string, string> = {
  advanced:     "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  novice:       "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AdminTab = "today" | "people" | "analytics" | "newsletter";

export default function AdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  // Phone: tapping a person opens the same sheet as the Today tab.
  const [sheetUserId, setSheetUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("today");
  const [sortField, setSortField] = useState<keyof AnalyticsUser>("xp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [nlSubject, setNlSubject] = useState("");
  const [nlPreview, setNlPreview] = useState("");
  const [nlHtml, setNlHtml] = useState("");
  const [nlResult, setNlResult] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────

  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } =
    useQuery<AnalyticsData>({
      queryKey: ["/api/admin/analytics"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/admin/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      },
      enabled: activeTab === "analytics",
    });

  // ── Mutations ────────────────────────────────────────────────────────────

  const backfillLogins = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/backfill-logins");
      if (!res.ok) throw new Error("Backfill failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Login records fixed", description: `Updated ${data.fixed} of ${data.total} users.` });
      qc.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (err: Error) => {
      toast({ title: "Backfill failed", description: err.message, variant: "destructive" });
    },
  });

  const sendNewsletter = useMutation({
    mutationFn: async (testOnly: boolean) => {
      const res = await apiRequest("POST", "/api/admin/newsletter", {
        subject: nlSubject,
        previewText: nlPreview,
        html: nlHtml,
        testOnly,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Send failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data, testOnly) => {
      if (testOnly) {
        setNlResult("Test email sent to lucas.l.cruz.es@gmail.com. Check your inbox.");
        toast({ title: "Test sent", description: "Check your inbox for the preview." });
      } else {
        setNlResult(`Sent to ${data.sent} of ${data.total} users.`);
        toast({ title: "Newsletter sent", description: `Sent to ${data.sent} of ${data.total} users.` });
      }
    },
    onError: (err: Error) => {
      setNlResult(null);
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Computed ─────────────────────────────────────────────────────────────

  const sortedAnalyticsUsers = analytics
    ? [...analytics.users].sort((a, b) => {
        const av = a[sortField] ?? 0;
        const bv = b[sortField] ?? 0;
        if (typeof av === "string" && typeof bv === "string") {
          return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        const an = av as number;
        const bn = bv as number;
        return sortDir === "asc" ? an - bn : bn - an;
      })
    : [];

  function toggleSort(field: keyof AnalyticsUser) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: keyof AnalyticsUser }) {
    if (sortField !== field) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="admin-page">
      {/* Header */}
      <div className="hidden sm:flex items-center justify-between">
        {/* Phones already show "Admin" in the top bar. */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Today, people, numbers and email</p>
          </div>
        </div>
        {activeTab === "analytics" && <Button
          variant="outline"
          size="sm"
          onClick={() => refetchAnalytics()}
          className="gap-2"
          data-testid="admin-refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>}
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 max-sm:!mt-0 [scrollbar-width:none]">
        {([
          { key: "today", label: "Today", icon: Zap },
          { key: "people", label: "People", icon: Users },
          { key: "analytics", label: "Analytics", icon: BarChart2 },
          { key: "newsletter", label: "Newsletter", icon: Mail },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3.5 sm:px-5 py-2.5 text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors border-b-2 -mb-px ${
              activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`admin-tab-${key}`}
          >
            <span className="flex items-center gap-1.5"><Icon className="w-4 h-4" />{label}</span>
          </button>
        ))}
      </div>

      {/* ── TODAY TAB (phone-first) ──────────────────────────────────────────── */}
      {activeTab === "today" && <AdminToday />}

      {/* ── PEOPLE: users, trials, leads and referrals in one list ───────────── */}
      {activeTab === "people" && <AdminPeople />}

      {/* ── ANALYTICS TAB ────────────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <>
          {analyticsLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Loading analytics…
            </div>
          )}
          {analyticsError && (
            <div className="flex items-center justify-center py-20 text-destructive text-sm">
              Failed to load analytics. Check that ADMIN_EMAILS is set in Railway.
            </div>
          )}

          {analytics && (
            <>
              {/* Platform Summary Cards */}
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {[
                  { label: "Total Users",   value: analytics.aggregate.totalUsers,   icon: Users,     color: "text-blue-500",    bg: "bg-blue-500/10" },
                  { label: "Pro Users",     value: analytics.aggregate.proUsers,     icon: Crown,     color: "text-amber-500",   bg: "bg-amber-500/10" },
                  { label: "Active Today",  value: analytics.aggregate.dau,          icon: Activity,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Avg XP",        value: analytics.aggregate.avgXp,        icon: Zap,       color: "text-violet-500",  bg: "bg-violet-500/10" },
                  { label: "Avg Lessons",   value: analytics.aggregate.avgLessons,   icon: BookOpen,  color: "text-sky-500",     bg: "bg-sky-500/10" },
                  { label: "Avg Mins",      value: formatMinutes(analytics.aggregate.avgMinutes), icon: Clock, color: "text-rose-500", bg: "bg-rose-500/10" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-2.5 sm:p-4 space-y-1 sm:space-y-2 min-w-0">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-foreground">{value}</div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{label}</div>
                  </div>
                ))}
              </div>

              {/* XP Formula explainer */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">XP here matches the app: </span>
                    <span className="text-muted-foreground">
                      100 per lesson, plus a tenth of each quiz score, plus Daily Challenge and Coach XP.
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-User Analytics Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">User Engagement</h2>
                    <p className="text-xs text-muted-foreground">{analytics.users.length} users<span className="hidden sm:inline"> · click column headers to sort</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={`${String(sortField)}:${sortDir}`}
                      onChange={e => { const [f, d] = e.target.value.split(":"); setSortField(f as keyof AnalyticsUser); setSortDir(d as "asc" | "desc"); }}
                      className="sm:hidden h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                      aria-label="Sort users"
                      data-testid="analytics-sort"
                    >
                      <option value="lastLoginAt:desc">Last login</option>
                      <option value="xp:desc">Most XP</option>
                      <option value="completedLessons:desc">Most lessons</option>
                      <option value="totalMinutesActive:desc">Most time</option>
                      <option value="loginCount:desc">Most logins</option>
                      <option value="avgQuizScore:desc">Best quiz avg</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hidden sm:inline-flex h-7 text-xs gap-1.5"
                      onClick={() => backfillLogins.mutate()}
                      disabled={backfillLogins.isPending}
                      title="Fix login records for users who registered before login tracking was added"
                    >
                      <RefreshCw className={`w-3 h-3 ${backfillLogins.isPending ? 'animate-spin' : ''}`} />
                      Fix Login Records
                    </Button>
                  </div>
                </div>

                {analytics.users.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                    No users yet.
                  </div>
                ) : (
                  <>
                  <div className="sm:hidden divide-y divide-border" data-testid="analytics-cards">
                    {sortedAnalyticsUsers.map(user => (
                      <button key={user.id} onClick={() => setSheetUserId(user.id)} className="w-full text-left px-4 py-3 active:bg-muted/50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-foreground truncate">{user.username || user.email}</div>
                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-semibold text-foreground">{user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}</div>
                            <span className={`inline-flex mt-1 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[displayStatus(user)] ?? statusColors.free}`}>
                              {statusLabel[displayStatus(user)] ?? displayStatus(user)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 mt-2 text-center">
                          {[
                            { k: "XP", v: user.xp.toLocaleString(), c: "text-violet-600 dark:text-violet-400" },
                            { k: "Lessons", v: user.completedLessons, c: "text-foreground" },
                            { k: "Logins", v: user.loginCount, c: "text-foreground" },
                            { k: "Time", v: formatMinutes(user.totalMinutesActive), c: "text-foreground" },
                          ].map(({ k, v, c }) => (
                            <div key={k} className="rounded-lg bg-muted/50 py-1.5">
                              <div className={`text-sm font-bold tabular-nums ${c}`}>{v}</div>
                              <div className="text-[10px] text-muted-foreground">{k}</div>
                            </div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm" data-testid="admin-analytics-table">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Plan</th>
                          <th
                            className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                            onClick={() => toggleSort("lastLoginAt")}
                          >
                            Last Login <SortIcon field="lastLoginAt" />
                          </th>
                          <th
                            className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden md:table-cell"
                            onClick={() => toggleSort("loginCount")}
                          >
                            Logins <SortIcon field="loginCount" />
                          </th>
                          <th
                            className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden lg:table-cell"
                            onClick={() => toggleSort("totalMinutesActive")}
                          >
                            Time Active <SortIcon field="totalMinutesActive" />
                          </th>
                          <th
                            className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                            onClick={() => toggleSort("xp")}
                          >
                            XP <SortIcon field="xp" />
                          </th>
                          <th
                            className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden md:table-cell"
                            onClick={() => toggleSort("completedLessons")}
                          >
                            Lessons <SortIcon field="completedLessons" />
                          </th>
                          <th
                            className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden lg:table-cell"
                            onClick={() => toggleSort("avgQuizScore")}
                          >
                            Avg Quiz <SortIcon field="avgQuizScore" />
                          </th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">
                            Skill Level
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAnalyticsUsers.map((user, i) => (
                          <tr
                            key={user.id}
                            className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                            data-testid={`analytics-user-row-${user.id}`}
                          >
                            {/* User */}
                            <td className="px-5 py-3.5">
                              <div className="font-medium text-foreground">{user.username}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</div>
                            </td>

                            {/* Plan */}
                            <td className="px-4 py-3.5 hidden sm:table-cell">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[displayStatus(user)] ?? statusColors.free}`}>
                                {statusLabel[displayStatus(user)] ?? displayStatus(user)}
                              </span>
                            </td>

                            {/* Last Login */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="text-foreground text-xs font-medium">
                                {user.lastLoginAt
                                  ? formatRelativeTime(user.lastLoginAt)
                                  : user.totalMinutesActive > 0
                                  ? <span className="text-amber-600 dark:text-amber-400">Active*</span>
                                  : "Never"}
                              </div>
                              {user.lastLoginAt && (
                                <div className="text-xs text-muted-foreground">{new Date(user.lastLoginAt).toLocaleDateString()}</div>
                              )}
                              {!user.lastLoginAt && user.totalMinutesActive > 0 && (
                                <div className="text-xs text-muted-foreground">login untracked</div>
                              )}
                            </td>

                            {/* Login Count */}
                            <td className="px-4 py-3.5 text-right hidden md:table-cell">
                              <div className="flex items-center justify-end gap-1 text-foreground">
                                <LogIn className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{user.loginCount}</span>
                              </div>
                            </td>

                            {/* Time Active */}
                            <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                              <div className="flex items-center justify-end gap-1 text-foreground">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{formatMinutes(user.totalMinutesActive)}</span>
                              </div>
                            </td>

                            {/* XP */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Zap className="w-3 h-3 text-violet-500" />
                                <span className="font-semibold text-violet-600 dark:text-violet-400">{user.xp.toLocaleString()}</span>
                              </div>
                            </td>

                            {/* Lessons */}
                            <td className="px-4 py-3.5 text-right hidden md:table-cell">
                              <div className="flex items-center justify-end gap-1 text-foreground">
                                <BookOpen className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{user.completedLessons}</span>
                              </div>
                            </td>

                            {/* Avg Quiz */}
                            <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                              <div className="flex items-center justify-end gap-1 text-foreground">
                                <Target className="w-3 h-3 text-muted-foreground" />
                                <span className={`font-medium ${user.avgQuizScore >= 75 ? "text-emerald-600 dark:text-emerald-400" : user.avgQuizScore > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                                  {user.avgQuizScore > 0 ? `${user.avgQuizScore}%` : "—"}
                                </span>
                              </div>
                            </td>

                            {/* Skill Level */}
                            <td className="px-5 py-3.5 text-right hidden xl:table-cell">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${skillColors[user.highestSkillLevel]}`}>
                                {user.highestSkillLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center pb-2">
                Activity data updates as users log in and complete lessons. Time active is tracked via periodic heartbeats from the frontend.
              </p>
            </>
          )}
        </>
      )}

      {/* ── NEWSLETTER TAB ───────────────────────────────────────────────────── */}
      {activeTab === "newsletter" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Subject line</label>
              <input
                type="text"
                value={nlSubject}
                onChange={(e) => setNlSubject(e.target.value)}
                placeholder="New: real example documents inside your lessons"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Preview text</label>
              <input
                type="text"
                value={nlPreview}
                onChange={(e) => setNlPreview(e.target.value)}
                placeholder="Shown as the email preview snippet in the inbox"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">HTML body</label>
              <textarea
                value={nlHtml}
                onChange={(e) => setNlHtml(e.target.value)}
                rows={12}
                placeholder="Paste the email HTML body here"
                className="w-full px-3 py-2 text-xs font-mono border border-border rounded-lg bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">Sends individually to each user (no BCC exposure). Wrapped automatically in the Acqlerate email shell. Reply-to is hello@acqlerate.com.</p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                disabled={!nlSubject || !nlHtml || sendNewsletter.isPending}
                onClick={() => sendNewsletter.mutate(true)}
              >
                <Eye className="w-4 h-4 mr-1.5" />
                {sendNewsletter.isPending ? "Sending test..." : "Send test to me"}
              </Button>
              <Button
                disabled={!nlSubject || !nlHtml || sendNewsletter.isPending}
                onClick={() => {
                  if (confirm("Send this to every Acqlerate user? This cannot be undone.")) {
                    sendNewsletter.mutate(false);
                  }
                }}
              >
                <Send className="w-4 h-4 mr-1.5" />
                {sendNewsletter.isPending ? "Sending..." : "Send to all users"}
              </Button>
            </div>
            {nlResult && (
              <div className="text-sm bg-muted rounded-lg px-3 py-2">{nlResult}</div>
            )}
          </div>
        </div>
      )}

      {sheetUserId && <UserSheet id={sheetUserId} onClose={() => setSheetUserId(null)} />}
    </div>
  );
}
