import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, TrendingUp, Users, BookOpen, DollarSign, Percent, BarChart3, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminAnalyticsProps {
  onBack: () => void;
}

function Stat({ label, value, sub, color = "teal" }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    teal: "text-primary",
    gold: "text-yellow-400",
    green: "text-green-400",
    blue: "text-blue-400",
    red: "text-red-400",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">{label}</div>
      <div className={`text-3xl font-bold ${colors[color] ?? colors.teal}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-8">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
    </div>
  );
}

export default function AdminAnalytics({ onBack }: AdminAnalyticsProps) {
  const { data: analytics, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/analytics");
      return res.json();
    },
  });

  const { data: revenue, isLoading: loadingRevenue, refetch: refetchRevenue } = useQuery({
    queryKey: ["/api/admin/revenue"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/revenue");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const isLoading = loadingAnalytics || loadingRevenue;

  const handleRefresh = () => {
    refetchAnalytics();
    refetchRevenue();
  };

  // Build signup sparkline data (last 14 days)
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const signupData = last14Days.map(day => ({
    day: day.slice(5), // MM-DD
    count: revenue?.signupsByDay?.[day] ?? 0,
  }));
  const maxSignups = Math.max(...signupData.map(d => d.count), 1);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-xs text-muted-foreground">Live data from Stripe + DB</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Stripe
            </Button>
          </a>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── Revenue ───────────────────────────────── */}
          <SectionHeader title="Revenue" icon={DollarSign} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="MRR"
              value={revenue ? `$${revenue.mrr.toFixed(2)}` : "—"}
              sub="Monthly recurring"
              color="teal"
            />
            <Stat
              label="ARR"
              value={revenue ? `$${revenue.arr.toFixed(2)}` : "—"}
              sub="Annualized"
              color="teal"
            />
            <Stat
              label="Lifetime Sales"
              value={revenue ? `$${revenue.lifetimeRevenue.toFixed(2)}` : "—"}
              sub={`${revenue?.lifetimeSalesCount ?? 0} payments`}
              color="gold"
            />
            <Stat
              label="Total Revenue"
              value={revenue ? `$${revenue.totalRevenue.toFixed(2)}` : "—"}
              sub="MRR + lifetime"
              color="green"
            />
          </div>

          {/* ── Users & Conversion ───────────────────── */}
          <SectionHeader title="Users & Conversion" icon={Users} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="Total Users"
              value={analytics?.aggregate?.totalUsers ?? revenue?.totalUsers ?? "—"}
              sub="All time"
              color="blue"
            />
            <Stat
              label="Pro Users"
              value={revenue?.paidUsers ?? analytics?.aggregate?.proUsers ?? "—"}
              sub="Active + lifetime"
              color="teal"
            />
            <Stat
              label="Free → Pro"
              value={revenue ? `${revenue.conversionRate}%` : "—"}
              sub="Conversion rate"
              color="gold"
            />
            <Stat
              label="Signups (30d)"
              value={revenue?.recentSignups30d ?? "—"}
              sub="Last 30 days"
              color="green"
            />
          </div>

          {/* ── Signups Chart ────────────────────────── */}
          <SectionHeader title="Signups — Last 14 Days" icon={TrendingUp} />
          <div className="bg-card border border-border rounded-xl p-5">
            {signupData.every(d => d.count === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No signup data yet for this period.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-24">
                {signupData.map(({ day, count }) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[9px] text-muted-foreground font-mono">
                      {count > 0 ? count : ''}
                    </div>
                    <div
                      className="w-full bg-primary rounded-sm transition-all"
                      style={{ height: `${(count / maxSignups) * 64}px`, minHeight: count > 0 ? '4px' : '2px', opacity: count > 0 ? 1 : 0.15 }}
                    />
                    <div className="text-[9px] text-muted-foreground">{day.slice(3)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Engagement ───────────────────────────── */}
          <SectionHeader title="Engagement" icon={BookOpen} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat
              label="DAU"
              value={analytics?.aggregate?.dau ?? "—"}
              sub="Active today"
              color="blue"
            />
            <Stat
              label="Avg Lessons"
              value={analytics?.aggregate?.avgLessons ?? "—"}
              sub="Per user (all time)"
              color="teal"
            />
            <Stat
              label="Avg Minutes"
              value={analytics?.aggregate?.avgMinutes ?? "—"}
              sub="Active per user"
              color="gold"
            />
          </div>

          {/* ── Top Lessons ─────────────────────────── */}
          {revenue?.topLessons?.length > 0 && (
            <>
              <SectionHeader title="Top Completed Lessons" icon={BarChart3} />
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Lesson ID</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Completions</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide">% of Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.topLessons.map((l: { id: string; count: number; pct: number }, i: number) => (
                      <tr key={l.id} className={i % 2 === 0 ? '' : 'bg-muted/10'}>
                        <td className="px-4 py-2.5 text-sm font-mono text-foreground">{l.id}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-foreground">{l.count}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-primary font-semibold">{l.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Per-User Table ───────────────────────── */}
          <SectionHeader title="All Users" icon={Users} />
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {["Email", "Plan", "Lessons", "Avg Quiz", "Minutes", "Logins", "Last Active"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.users ?? []).map((u: any, i: number) => (
                    <tr key={u.id} className={i % 2 === 0 ? '' : 'bg-muted/10'}>
                      <td className="px-3 py-2 text-xs text-foreground max-w-[180px] truncate">{u.email}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          u.subscriptionStatus === 'lifetime' ? 'bg-yellow-500/20 text-yellow-400' :
                          u.subscriptionStatus === 'active' ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {u.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-center">{u.completedLessons}</td>
                      <td className="px-3 py-2 text-xs text-center">{u.avgQuizScore > 0 ? `${u.avgQuizScore}%` : '—'}</td>
                      <td className="px-3 py-2 text-xs text-center">{u.totalMinutesActive}</td>
                      <td className="px-3 py-2 text-xs text-center">{u.loginCount}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── GA4 Note ─────────────────────────────── */}
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-yellow-400 mb-1">GA4 Setup Required</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Replace <code className="bg-muted px-1 rounded text-xs">GA_MEASUREMENT_ID</code> with your <strong>G-XXXXXXXXXX</strong> in both{' '}
              <code className="bg-muted px-1 rounded text-xs">landing.html</code> and{' '}
              <code className="bg-muted px-1 rounded text-xs">index.html</code>.
              Get your Measurement ID at{' '}
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                analytics.google.com
              </a>
              {' '}→ Admin → Data Streams → Web stream → Measurement ID.
              Google Search Console: add the meta tag verification code at{' '}
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                search.google.com/search-console
              </a>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
