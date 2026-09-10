import { useState, type ReactNode } from "react";
import { ArrowLeft, UserCircle, Mail, Compass, CreditCard, CheckCircle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hasPaidPlan, trialDaysRemaining } from "@shared/access";
import { CAREER_TRACK_DATA, getTrackStats, type CareerTrackId } from "@/lib/careerTracks";
import { formatDuration } from "@/lib/curriculum";
import { cn } from "@/lib/utils";
import type { AuthUser } from "./AuthPage";

interface MyAccountPageProps {
  user: AuthUser;
  onBack: () => void;
  onUpgrade: () => void;
  onNameUpdated: (firstName: string, lastName: string, username: string) => void;
}

// Same localStorage key + default Dashboard.tsx already uses for the career
// filter bar — the path switcher here is a second way to change the same
// setting, so it has to read/write the exact same place to stay in sync.
const ACTIVE_CAREER_KEY = 'acq_active_career';
const DEFAULT_CAREER: CareerTrackId = 'contractor_pm';

const SUBSCRIPTION_LABELS: Record<string, { label: string; tone: string }> = {
  free: { label: 'Free', tone: 'bg-muted text-muted-foreground' },
  trialing: { label: 'Free Trial', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  active: { label: 'Pro (Monthly)', tone: 'bg-primary/15 text-primary' },
  lifetime: { label: 'Pro (Lifetime)', tone: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
};

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function MyAccountPage({ user, onBack, onUpgrade, onNameUpdated }: MyAccountPageProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeCareer, setActiveCareer] = useState<CareerTrackId>(() => {
    try { return (localStorage.getItem(ACTIVE_CAREER_KEY) as CareerTrackId) || DEFAULT_CAREER; } catch { return DEFAULT_CAREER; }
  });

  const dirty = firstName.trim() !== (user.firstName ?? "") || lastName.trim() !== (user.lastName ?? "");
  const canSave = dirty && firstName.trim().length > 0 && lastName.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await apiRequest("PUT", "/api/account/name", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      onNameUpdated(data.firstName, data.lastName, data.username);
      toast({ title: "Saved", description: "Your name has been updated." });
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Portal unavailable");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Billing portal error", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSelectPath = (id: CareerTrackId) => {
    if (id === activeCareer) return;
    setActiveCareer(id);
    try { localStorage.setItem(ACTIVE_CAREER_KEY, id); } catch {}
    const track = CAREER_TRACK_DATA.find(t => t.id === id);
    toast({ title: `Switched to ${track?.label ?? id}`, description: "Your Dashboard will reorder lessons to match on your next visit." });
  };

  const sub = SUBSCRIPTION_LABELS[user.subscriptionStatus] ?? SUBSCRIPTION_LABELS.free;
  const paid = hasPaidPlan(user);
  const daysLeft = trialDaysRemaining(user);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5" data-testid="account-back">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold">My Account</h1>
        <p className="text-sm text-muted-foreground">Your profile, learning path, and subscription.</p>
      </div>

      {/* Name — editable */}
      <Section icon={UserCircle} title="Name">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1">
            <Label htmlFor="account-first-name">First Name</Label>
            <Input
              id="account-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              data-testid="input-account-first-name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-last-name">Last Name</Label>
            <Input
              id="account-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              data-testid="input-account-last-name"
            />
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!canSave} data-testid="save-account-name">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Save Changes
        </Button>
      </Section>

      {/* Email — read-only */}
      <Section icon={Mail} title="Email">
        <p className="text-sm text-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground mt-1">Tied to your login — contact support to change it.</p>
      </Section>

      {/* Your Path — editable, drives lesson ordering on the Dashboard */}
      <Section icon={Compass} title="Your Path">
        <div className="space-y-2.5">
          {CAREER_TRACK_DATA.map((track) => {
            const isActive = track.id === activeCareer;
            const stats = getTrackStats(track.id);
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleSelectPath(track.id)}
                className={cn(
                  "w-full text-left rounded-xl border-2 p-3.5 transition-all",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
                data-testid={`path-card-${track.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl leading-none flex-shrink-0">{track.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm">{track.label}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-0.5">{track.before}</p>
                    <p className="text-xs font-medium text-foreground mb-2">{track.after}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {stats.lessonCount} core lessons · {formatDuration(stats.totalMinutes)} focused
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Switch anytime — nothing gets locked away. Lessons outside your core focus are still there, just filed as bonus content instead of top billing.
        </p>
      </Section>

      {/* Subscription — read-only, with billing/upgrade actions */}
      <Section icon={CreditCard} title="Subscription">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sub.tone}`}>{sub.label}</span>
          {daysLeft !== null && (
            <span className="text-xs text-muted-foreground">
              {daysLeft === 0 ? "ends today" : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {paid ? (
            <Button size="sm" variant="outline" onClick={handleManageBilling} disabled={portalLoading} data-testid="manage-billing">
              {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              Manage Billing
            </Button>
          ) : (
            <Button size="sm" onClick={onUpgrade} className="gap-1.5" data-testid="account-upgrade">
              <Zap className="w-3.5 h-3.5" />
              Upgrade to Pro
            </Button>
          )}
        </div>
      </Section>
    </div>
  );
}
