import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Users, Crown, UserX, RefreshCw, ChevronDown,
  BarChart2, Clock, Zap, TrendingUp, Activity, Star,
  BookOpen, Target, LogIn, Trash2, Share2, Mail, Send, Eye,
  ShieldCheck, ShieldOff, Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  username: string;
  email: string;
  subscriptionStatus: string;
  completedLessons: number;
  referralCode: string | null;
  referredBy: string | null;
  referralCount: number;
  referralRewardGranted: number;
  isAdmin: boolean;
  moduleSkillLevels: Record<string, string>;
}

interface AnalyticsUser {
  id: string;
  username: string;
  email: string;
  subscriptionStatus: string;
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
  active:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  free:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const statusLabel: Record<string, string> = {
  lifetime: "Lifetime Pro",
  active:   "Monthly Pro",
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

type AdminTab = "users" | "analytics" | "referrals" | "newsletter";

export default function AdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [sortField, setSortField] = useState<keyof AnalyticsUser>("xp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [nlSubject, setNlSubject] = useState("");
  const [nlPreview, setNlPreview] = useState("");
  const [nlHtml, setNlHtml] = useState("");
  const [nlResult, setNlResult] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────

  const { data: users = [], isLoading: usersLoading, isError: usersError, refetch: refetchUsers } =
    useQuery<AdminUser[]>({
      queryKey: ["/api/admin/users"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      },
    });

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

  const makePro = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const res = await apiRequest("POST", "/api/admin/make-pro", { userId, plan });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onMutate: ({ userId }) => setPendingId(userId),
    onSettled: () => setPendingId(null),
    onSuccess: (data) => {
      toast({ title: "User updated", description: data.message });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/toggle-admin`, { makeAdmin });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onMutate: ({ userId }) => setPendingId(userId),
    onSettled: () => setPendingId(null),
    onSuccess: (data) => {
      toast({ title: "Admin status updated", description: data.message });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const unlockSkillLevel = useMutation({
    mutationFn: async ({ userId, level }: { userId: string; level: "intermediate" | "advanced" }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/unlock-skill-level`, { level });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onMutate: ({ userId }) => setPendingId(userId),
    onSettled: () => setPendingId(null),
    onSuccess: (data) => {
      toast({ title: "Skill level unlocked", description: data.message });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unlock failed", description: err.message, variant: "destructive" });
    },
  });

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

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Delete failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onMutate: (userId) => setPendingId(userId),
    onSettled: () => { setPendingId(null); setConfirmDeleteId(null); },
    onSuccess: (data) => {
      toast({ title: "User deleted", description: data.message });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
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

  const userStats = {
    total: users.length,
    pro: users.filter(u => u.subscriptionStatus === "active" || u.subscriptionStatus === "lifetime").length,
    lifetime: users.filter(u => u.subscriptionStatus === "lifetime").length,
    free: users.filter(u => u.subscriptionStatus === "free").length,
  };

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
    <div className="space-y-6" data-testid="admin-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users &amp; engagement analytics</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchUsers(); if (activeTab === "analytics") refetchAnalytics(); }}
          className="gap-2"
          data-testid="admin-refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="admin-tab-users"
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Users
          </span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="admin-tab-analytics"
        >
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4" />
            Analytics
          </span>
        </button>
        <button
          onClick={() => setActiveTab("referrals")}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "referrals"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Share2 className="w-4 h-4" />
            Referrals
          </span>
        </button>
        <button
          onClick={() => setActiveTab("newsletter")}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "newsletter"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="admin-tab-newsletter"
        >
          <span className="flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            Newsletter
          </span>
        </button>
      </div>

      {/* ── USERS TAB ────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Users",  value: userStats.total,    icon: Users,  color: "text-blue-500" },
              { label: "Pro Users",    value: userStats.pro,      icon: Crown,  color: "text-amber-500" },
              { label: "Lifetime",     value: userStats.lifetime, icon: Crown,  color: "text-emerald-500" },
              { label: "Free",         value: userStats.free,     icon: UserX,  color: "text-slate-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-1">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
                <div className="text-2xl font-bold text-foreground">{value}</div>
              </div>
            ))}
          </div>

          {/* Grant lifetime tip */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Crown className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-foreground">Granting lifetime access:</span>
                <span className="text-muted-foreground ml-1">
                  Find the user in the table below, click the action button in their row, and select "Grant Lifetime Pro".
                  This immediately unlocks all content — no payment needed.
                </span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">All Users</h2>
              <span className="text-xs text-muted-foreground">{users.length} total</span>
            </div>

            {usersLoading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading users…
              </div>
            )}
            {usersError && (
              <div className="flex items-center justify-center py-16 text-destructive text-sm">
                Failed to load users. Make sure ADMIN_EMAILS is set in Railway.
              </div>
            )}
            {!usersLoading && !usersError && users.length === 0 && (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                No users yet.
              </div>
            )}
            {!usersLoading && !usersError && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="admin-users-table">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Lessons</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <>
                      <tr
                        key={user.id}
                        className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                        data-testid={`admin-user-row-${user.id}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-foreground">{user.username}</div>
                          <div className="text-xs text-muted-foreground sm:hidden truncate max-w-[140px]">{user.email}</div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell text-muted-foreground truncate max-w-[180px]">
                          {user.email}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[user.subscriptionStatus] ?? statusColors.free}`}>
                              {statusLabel[user.subscriptionStatus] ?? user.subscriptionStatus}
                            </span>
                            {user.isAdmin && (
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600">
                                <ShieldCheck className="w-3 h-3" /> Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-muted-foreground hidden md:table-cell">
                          {user.completedLessons}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pendingId === user.id}
                                className="gap-1.5 h-7 text-xs"
                                data-testid={`admin-action-${user.id}`}
                              >
                                {pendingId === user.id ? (
                                  <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                                ) : (
                                  <>Manage <ChevronDown className="w-3 h-3" /></>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => makePro.mutate({ userId: user.id, plan: "lifetime" })}
                                className="gap-2 cursor-pointer"
                                data-testid={`admin-grant-lifetime-${user.id}`}
                              >
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                                Grant Lifetime Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => makePro.mutate({ userId: user.id, plan: "active" })}
                              >
                                <Crown className="w-3.5 h-3.5" />
                                Make Monthly Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  await fetch(`/api/admin/users/${user.id}/grant-yearly-pro`, { method: 'POST', credentials: 'include' });
                                  qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
                                  toast({ title: '1 Year Pro granted', description: `${user.email} has 1 year of Pro access` });
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                <Crown className="w-3.5 h-3.5 text-emerald-500" />
                                Grant 1 Year Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => makePro.mutate({ userId: user.id, plan: "active" })}
                                className="gap-2 cursor-pointer"
                              >
                                <Crown className="w-3.5 h-3.5" />
                                Grant Monthly Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => makePro.mutate({ userId: user.id, plan: "free" })}
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                data-testid={`admin-revoke-${user.id}`}
                              >
                                <UserX className="w-3.5 h-3.5" />
                                Revoke Pro (→ Free)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => unlockSkillLevel.mutate({ userId: user.id, level: "intermediate" })}
                                className="gap-2 cursor-pointer"
                                data-testid={`admin-unlock-intermediate-${user.id}`}
                              >
                                <Unlock className="w-3.5 h-3.5 text-blue-500" />
                                Unlock Intermediate (All Modules)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => unlockSkillLevel.mutate({ userId: user.id, level: "advanced" })}
                                className="gap-2 cursor-pointer"
                                data-testid={`admin-unlock-advanced-${user.id}`}
                              >
                                <Unlock className="w-3.5 h-3.5 text-violet-500" />
                                Unlock Advanced (All Modules)
                              </DropdownMenuItem>
                              {user.isAdmin ? (
                                <DropdownMenuItem
                                  onClick={() => toggleAdmin.mutate({ userId: user.id, makeAdmin: false })}
                                  className="gap-2 cursor-pointer"
                                  data-testid={`admin-remove-admin-${user.id}`}
                                >
                                  <ShieldOff className="w-3.5 h-3.5 text-muted-foreground" />
                                  Remove Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => toggleAdmin.mutate({ userId: user.id, makeAdmin: true })}
                                  className="gap-2 cursor-pointer"
                                  data-testid={`admin-make-admin-${user.id}`}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setConfirmDeleteId(user.id)}
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive font-semibold"
                                data-testid={`admin-delete-${user.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                      {confirmDeleteId === user.id && (
                        <tr className="border-b border-destructive/30 bg-destructive/5">
                          <td colSpan={5} className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-destructive font-semibold">Delete <strong>{user.username || user.email}</strong>? This cannot be undone.</span>
                              <button
                                onClick={() => deleteUser.mutate(user.id)}
                                disabled={pendingId === user.id}
                                className="px-3 py-1 bg-destructive text-white text-xs font-bold rounded-lg hover:bg-destructive/80 transition-colors disabled:opacity-50"
                              >
                                {pendingId === user.id ? 'Deleting…' : 'Yes, Delete'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center pb-2">
            Admin access is gated to emails listed in the <code className="bg-muted px-1 rounded">ADMIN_EMAILS</code> Railway variable.
          </p>
        </>
      )}

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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Users",   value: analytics.aggregate.totalUsers,   icon: Users,     color: "text-blue-500",    bg: "bg-blue-500/10" },
                  { label: "Pro Users",     value: analytics.aggregate.proUsers,     icon: Crown,     color: "text-amber-500",   bg: "bg-amber-500/10" },
                  { label: "Active Today",  value: analytics.aggregate.dau,          icon: Activity,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Avg XP",        value: analytics.aggregate.avgXp,        icon: Zap,       color: "text-violet-500",  bg: "bg-violet-500/10" },
                  { label: "Avg Lessons",   value: analytics.aggregate.avgLessons,   icon: BookOpen,  color: "text-sky-500",     bg: "bg-sky-500/10" },
                  { label: "Avg Mins",      value: formatMinutes(analytics.aggregate.avgMinutes), icon: Clock, color: "text-rose-500", bg: "bg-rose-500/10" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    <div className="text-xl font-bold text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              {/* XP Formula explainer */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">XP Formula: </span>
                    <span className="text-muted-foreground">
                      Lessons completed × 10 + avg quiz score × 5 + skill level unlocks × 50.
                      XP is recalculated automatically when users complete lessons, quizzes, and assessments.
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-User Analytics Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">User Engagement</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{analytics.users.length} users · click column headers to sort</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
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
                  <div className="overflow-x-auto">
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
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[user.subscriptionStatus] ?? statusColors.free}`}>
                                {statusLabel[user.subscriptionStatus] ?? user.subscriptionStatus}
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
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center pb-2">
                Activity data updates as users log in and complete lessons. Time active is tracked via periodic heartbeats from the frontend.
              </p>
            </>
          )}
        </>
      )}

      {/* ── REFERRALS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "referrals" && (
        <div className="space-y-6 pt-2">

          {/* Referrers — who has sent people */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Who Has Referred People</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Users who have at least 1 signup from their referral link. Every 2 signups = 1 year Pro.</p>
            </div>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground p-5">Loading...</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Referrals</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rewards Earned</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rewards Granted</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users
                    .filter(u => (u.referralCount ?? 0) > 0)
                    .sort((a, b) => (b.referralCount ?? 0) - (a.referralCount ?? 0))
                    .map(u => {
                      const earned = Math.floor((u.referralCount ?? 0) / 2);
                      const granted = u.referralRewardGranted ?? 0;
                      const owes = earned - granted;
                      return (
                        <tr key={u.id} className={`hover:bg-muted/20 transition-colors ${owes > 0 ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}>
                          <td className="px-4 py-3.5">
                            <div className="font-medium">{u.username}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-bold text-primary">{u.referralCount}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`font-semibold ${earned > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                              {earned} yr{earned !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {owes > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                ⚠ {owes} owed
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Up to date</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                              disabled={pendingId === u.id}
                              onClick={async () => {
                                setPendingId(u.id);
                                try {
                                  await fetch(`/api/admin/users/${u.id}/grant-yearly-pro`, { method: 'POST', credentials: 'include' });
                                  await refetchUsers();
                                  toast({ title: '1 Year Pro granted', description: `${u.email} now has 1 year of Pro access` });
                                } catch { toast({ title: 'Error', description: 'Failed to grant Pro', variant: 'destructive' }); }
                                finally { setPendingId(null); }
                              }}
                            >
                              {pendingId === u.id ? 'Granting…' : 'Grant 1 Yr Pro'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  }
                  {users.filter(u => (u.referralCount ?? 0) > 0).length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No referrals yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Referred users — who signed up via a code */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Who Signed Up Via Referral</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Users who joined using someone else's referral code.</p>
            </div>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground p-5">Loading...</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Referred By Code</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users
                    .filter(u => u.referredBy)
                    .map(u => {
                      const referrer = users.find(r => r.referralCode === u.referredBy);
                      return (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-medium">{u.username}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[u.subscriptionStatus] ?? statusColors.free}`}>
                              {statusLabel[u.subscriptionStatus] ?? 'Free'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{u.referredBy}</code>
                          </td>
                          <td className="px-4 py-3.5">
                            {referrer ? (
                              <div>
                                <div className="text-sm font-medium">{referrer.username}</div>
                                <div className="text-xs text-muted-foreground">{referrer.email}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unknown</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  }
                  {users.filter(u => u.referredBy).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No referred signups yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>
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
    </div>
  );
}
