import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, Crown, UserX, RefreshCw, ChevronDown } from "lucide-react";
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

interface AdminUser {
  id: string;
  username: string;
  email: string;
  subscriptionStatus: string;
  completedLessons: number;
}

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

export default function AdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: users = [], isLoading, isError, refetch } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

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
    onSuccess: (data, { plan }) => {
      toast({
        title: "User updated",
        description: data.message,
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const stats = {
    total: users.length,
    pro: users.filter(u => u.subscriptionStatus === "active" || u.subscriptionStatus === "lifetime").length,
    lifetime: users.filter(u => u.subscriptionStatus === "lifetime").length,
    free: users.filter(u => u.subscriptionStatus === "free").length,
  };

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
            <p className="text-sm text-muted-foreground">Manage user subscriptions</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
          data-testid="admin-refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-blue-500" },
          { label: "Pro Users", value: stats.pro, icon: Crown, color: "text-amber-500" },
          { label: "Lifetime", value: stats.lifetime, icon: Crown, color: "text-emerald-500" },
          { label: "Free", value: stats.free, icon: UserX, color: "text-slate-400" },
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

      {/* How to Grant Lifetime */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Crown className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-foreground">Granting lifetime access:</span>
            <span className="text-muted-foreground ml-1">
              Find the user in the table below, click the action button in their row, and select "Grant Lifetime Pro". This immediately unlocks all content — no payment needed.
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

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading users…
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-16 text-destructive text-sm">
            Failed to load users. Make sure ADMIN_EMAILS is set in Railway.
          </div>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            No users yet.
          </div>
        )}

        {!isLoading && !isError && users.length > 0 && (
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
                  <tr
                    key={user.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    data-testid={`admin-user-row-${user.id}`}
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{user.username}</div>
                      <div className="text-xs text-muted-foreground sm:hidden truncate max-w-[140px]">{user.email}</div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 hidden sm:table-cell text-muted-foreground truncate max-w-[180px]">
                      {user.email}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[user.subscriptionStatus] ?? statusColors.free}`}>
                        {statusLabel[user.subscriptionStatus] ?? user.subscriptionStatus}
                      </span>
                    </td>

                    {/* Lessons completed */}
                    <td className="px-4 py-3.5 text-right text-muted-foreground hidden md:table-cell">
                      {user.completedLessons}
                    </td>

                    {/* Actions */}
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
                            className="gap-2 cursor-pointer"
                            data-testid={`admin-grant-monthly-${user.id}`}
                          >
                            <Crown className="w-3.5 h-3.5 text-emerald-500" />
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer tip */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        Admin access is gated to emails listed in the <code className="bg-muted px-1 rounded">ADMIN_EMAILS</code> Railway variable.
      </p>
    </div>
  );
}
