import { useState, useEffect, type ReactNode } from "react";
import { ArrowLeft, UserCircle, Mail, Compass, CreditCard, CheckCircle, Loader2, Zap, Trash2, AlertTriangle, Award, LogOut, Moon, Gift, Trophy } from "lucide-react";
import { LevelRoadSheet } from "@/components/LevelRoad";
import { LeaderboardVisibilityRow } from "@/components/Leaderboard";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hasPaidPlan, trialDaysRemaining } from "@shared/access";
import { CAREER_TRACK_DATA, getTrackStats, setActiveTrack, type CareerTrackId } from "@/lib/careerTracks";
import { formatDuration } from "@/lib/curriculumMeta";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativeApp } from "@/lib/platform";
import { getLevel } from "@/lib/progress";
import { AccountSection, LevelHero, ModuleStanding, earnedClps } from "@/components/mobile/AccountCards";
import { EmojiOptionCard } from "@/components/mobile/OptionCard";
import type { AuthUser } from "./AuthPage";

interface MyAccountPageProps {
  user: AuthUser;
  onBack: () => void;
  onUpgrade: () => void;
  onNameUpdated: (firstName: string, lastName: string, username: string) => void;
  onAccountDeleted: () => void;
  // ── Mobile Account ────────────────────────────────────────────────────────
  // The mobile screen carries the level hero, module standing and the theme
  // row, none of which the desktop page has.
  xp?: number;
  completedLessons?: Set<string>;
  streak?: number;
  onSignOut?: () => void;
  themeMode?: 'light' | 'dark' | 'system';
  onThemeChange?: (mode: 'light' | 'dark' | 'system') => void;
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

export default function MyAccountPage({ user, onBack, onUpgrade, onNameUpdated, onAccountDeleted,
  xp = 0, completedLessons = new Set<string>(), streak = 0, onSignOut, themeMode = 'system', onThemeChange }: MyAccountPageProps) {
  const isMobile = useIsMobile();
  const nativeApp = isNativeApp();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [referral, setReferral] = useState<{ referralCode: string; referralCount: number; rewardsEarned: number; referralLink: string; nextRewardAt: number } | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showRoad, setShowRoad] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    apiRequest('GET', '/api/my-referral')
      .then(r => r.json())
      .then(data => { if (data.referralCode) setReferral(data); })
      .catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE" || deleting) return;
    setDeleting(true);
    try {
      const res = await apiRequest("DELETE", "/api/account", { confirm: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Couldn't delete your account");
      onAccountDeleted();
    } catch (err: any) {
      toast({ title: "Couldn't delete account", description: err.message || "Please try again.", variant: "destructive" });
      setDeleting(false);
    }
  };

  const handleSelectPath = (id: CareerTrackId) => {
    if (id === activeCareer) return;
    setActiveCareer(id);
    setActiveTrack(id); // also tells the sidebar, whose level title depends on the track
    const track = CAREER_TRACK_DATA.find(t => t.id === id);
    toast({ title: `Switched to ${track?.label ?? id}`, description: "Your Dashboard will reorder lessons to match on your next visit." });
  };

  // Hoisted so the mobile branch can render the same confirmation.
  const deleteDialog = (
      <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!deleting) setDeleteOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{user.email}</strong> and everything tied to it — lessons completed, quiz scores, streak and XP. There is no undo.
              {user.subscriptionStatus === 'lifetime' && ' Your lifetime purchase will be gone too.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm" className="text-xs">Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
            <Input id="delete-confirm" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} autoComplete="off" placeholder="DELETE" data-testid="delete-confirm-input" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep my account</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteText !== "DELETE" || deleting} data-testid="delete-account-confirm">
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  );

  const sub = SUBSCRIPTION_LABELS[user.subscriptionStatus] ?? SUBSCRIPTION_LABELS.free;
  const paid = hasPaidPlan(user);
  const daysLeft = trialDaysRemaining(user);

  // ── Mobile Account ────────────────────────────────────────────────────────
  if (isMobile) {
    // Titles follow the chosen path: GS scale for government, industry titles otherwise.
    const level = getLevel(xp, activeCareer);
    const nextLevel = getLevel(level.nextXP, activeCareer);
    // Where this level starts, so the bar shows progress through the level,
    // not from zero. From the shared table in lib/progress.ts.
    const levelFloor = level.threshold;
    const span = Math.max(1, level.nextXP - levelFloor);
    const levelPct = Math.min(100, Math.round(((xp - levelFloor) / span) * 100));

    return (
      <div className="flex flex-col gap-4 px-4 pb-8 pt-4" data-testid="account-page-mobile">
        <LevelHero
          level={level.level}
          title={level.title}
          xp={xp}
          toNext={Math.max(0, level.nextXP - xp)}
          nextTitle={nextLevel.title}
          pct={levelPct}
          lessonsDone={completedLessons.size}
          dayStreak={streak}
          clpsEarned={earnedClps(completedLessons)}
          onOpenRoad={() => setShowRoad(true)}
        />
        {showRoad && <LevelRoadSheet xp={xp} track={activeCareer} onClose={() => setShowRoad(false)} />}

        <AccountSection icon={Award} title="Module standing">
          <ModuleStanding
            completedLessons={completedLessons}
            skillLevels={(user.moduleSkillLevels ?? {}) as Record<string, string>}
          />
        </AccountSection>

        <AccountSection icon={UserCircle} title="Name">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="m-first" className="text-xs">First Name</Label>
              <Input id="m-first" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 min-h-[44px]" />
            </div>
            <div>
              <Label htmlFor="m-last" className="text-xs">Last Name</Label>
              <Input id="m-last" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 min-h-[44px]" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="mt-3 flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--acq-teal)' }}
            data-testid="account-save-name"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>✓</>} Save Changes
          </button>
        </AccountSection>

        <AccountSection icon={Mail} title="Email">
          <div className="text-sm" style={{ color: 'var(--acq-text-body)' }}>{user.email}</div>
          <p className="mt-1 text-xs" style={{ color: 'var(--acq-text-muted)' }}>
            Tied to your login — contact support to change it.
          </p>
        </AccountSection>

        <AccountSection icon={Compass} title="Your Path">
          <div className="flex flex-col gap-2.5">
            {CAREER_TRACK_DATA.map(track => {
              const stats = getTrackStats(track.id);
              const isActive = track.id === activeCareer;
              return (
                <EmojiOptionCard
                  key={track.id}
                  emoji={track.icon}
                  selected={isActive}
                  onSelect={() => handleSelectPath(track.id)}
                  data-testid={`account-track-${track.id}`}
                >
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--acq-text-heading)' }}>
                      {track.label}
                    </span>
                    {isActive && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{ color: 'var(--acq-text-brand)', background: 'var(--acq-surface-brand-wash)' }}
                      >
                        Current
                      </span>
                    )}
                  </span>
                  <span className="block text-xs italic" style={{ color: 'var(--acq-text-muted)' }}>
                    {track.before}
                  </span>
                  <span className="my-0.5 block text-xs font-medium">{track.after}</span>
                  <span className="block text-[11px]" style={{ color: 'var(--acq-text-muted)' }}>
                    {stats.lessonCount} core lessons · {formatDuration(stats.totalMinutes)} focused
                  </span>
                </EmojiOptionCard>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-[1.5]" style={{ color: 'var(--acq-text-muted)' }}>
            Switch anytime — nothing gets locked away. Lessons outside your core focus are still
            there, just filed as bonus content instead of top billing.
          </p>
        </AccountSection>

        <AccountSection icon={CreditCard} title="Subscription">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: 'var(--acq-surface-gold-wash)', color: 'var(--acq-text-gold)' }}
            >
              {sub.label}
            </span>
            {daysLeft !== null && (
              <span className="acq-tnum text-xs" style={{ color: 'var(--acq-text-muted)' }}>
                {daysLeft === 0 ? 'Ends today' : `${daysLeft} days left`}
              </span>
            )}
          </div>
          {/* Native can't take payment, so it explains where to. On the web the
              billing portal and the priced upgrade page are both fair game. */}
          {nativeApp ? (
            <p className="mt-2 text-xs leading-[1.5]" style={{ color: 'var(--acq-text-muted)' }}>
              Plans are managed on acqlerate.com, not in the app. Upgrade there and sign back in here
              to unlock every module.
            </p>
          ) : paid ? (
            <p className="mt-2 text-xs leading-[1.5]" style={{ color: 'var(--acq-text-muted)' }}>
              Manage billing, payment method and cancellation in the customer portal.
            </p>
          ) : null}
          <button
            type="button"
            onClick={paid && !nativeApp ? handleManageBilling : onUpgrade}
            className="mt-3 flex h-10 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold"
            style={{ borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-body)' }}
            data-testid="account-upgrade"
          >
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {paid && !nativeApp ? 'Manage billing' : 'How to upgrade'}
          </button>
        </AccountSection>

        {/* Theme — not in the handoff, but the mobile top bar has no toggle and
            the app otherwise follows the OS with no way to override it. */}
        <AccountSection icon={Trophy} title="Leaderboards">
          <LeaderboardVisibilityRow />
        </AccountSection>

        <AccountSection icon={Moon} title="Appearance">
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => onThemeChange?.(mode)}
                className="h-11 flex-1 rounded-lg border text-[13px] font-semibold capitalize"
                style={
                  themeMode === mode
                    ? { borderColor: 'var(--acq-teal)', background: 'rgba(1,105,111,.05)', color: 'var(--acq-text-brand)' }
                    : { borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-secondary)' }
                }
                data-testid={`account-theme-${mode}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </AccountSection>

        <button
          type="button"
          onClick={onSignOut}
          className="mx-auto flex h-11 items-center gap-2 text-sm"
          style={{ color: 'var(--acq-text-muted)' }}
          data-testid="account-signout"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Sign out
        </button>

        {/* Required by App Store guideline 5.1.1(v): an app that lets you
            create an account has to let you delete it in-app.
            Muted rather than faint — faint (#6B7280) reads at 3.74:1 on the
            dark page, which is fine for decoration but not for a real action. */}
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="mx-auto flex h-11 items-center gap-2 text-xs"
          style={{ color: 'var(--acq-text-muted)' }}
          data-testid="account-delete"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Delete account
        </button>

        {deleteDialog}
      </div>
    );
  }

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

      <Section icon={Trophy} title="Leaderboards">
        <LeaderboardVisibilityRow />
      </Section>

      {/* Referrals */}
      {referral && (
        <Section icon={Gift} title="Refer & Earn Pro">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-primary mb-0.5">Spread the word, earn a year of Pro</p>
              <p className="text-xs text-muted-foreground">
                Get 2 people to sign up free and you earn <strong>1 year of Pro access</strong>. Every 2 signups = another year.
              </p>
            </div>
            <div className="text-right flex-shrink-0 bg-primary/10 rounded-xl px-3 py-2">
              <p className="text-2xl font-black text-primary leading-none">{referral.referralCount}</p>
              <p className="text-[10px] text-muted-foreground">signups</p>
              <p className="text-[10px] text-primary/70 font-medium mt-0.5">{referral.nextRewardAt - referral.referralCount} to go</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate flex-1 min-w-0 block">{referral.referralLink}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referral.referralLink);
                setReferralCopied(true);
                setTimeout(() => setReferralCopied(false), 2000);
              }}
              className="text-xs text-primary font-semibold hover:underline flex-shrink-0"
              data-testid="copy-referral-link"
            >
              {referralCopied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>
          {referral.rewardsEarned > 0 && (
            <p className="text-xs text-muted-foreground mt-2">You've earned {referral.rewardsEarned} year{referral.rewardsEarned === 1 ? '' : 's'} of Pro so far.</p>
          )}
        </Section>
      )}

      {/* Danger zone */}
      <Section icon={AlertTriangle} title="Delete Account">
        <p className="text-sm text-muted-foreground mb-3">
          Permanently deletes your account, progress, streaks and XP.
          {user.subscriptionStatus === 'active' && ' Your monthly subscription is cancelled immediately.'}
          {' '}This cannot be undone.
        </p>
        <Button size="sm" variant="outline" className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { setDeleteText(""); setDeleteOpen(true); }} data-testid="delete-account">
          <Trash2 className="w-3.5 h-3.5" />
          Delete my account
        </Button>
      </Section>

      {deleteDialog}
    </div>
  );
}
