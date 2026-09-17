import { useState } from "react";
import { ChevronRight, Building2, HardHat, Compass, GraduationCap, Sprout, TrendingUp, Star, FileText, Target, LayoutGrid, CheckCircle2 } from "lucide-react";
import { AcqlerateLogo } from "@/components/AcqlerateLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { UserProfile } from "@/pages/AuthPage";
import { useIsMobile } from "@/hooks/use-mobile";
import { OptionCard as MobileOptionCard } from "@/components/mobile/OptionCard";
import { deriveTrackFromOnboarding, setActiveTrack } from "@/lib/careerTracks";

interface OnboardingFlowProps {
  username: string;
  onComplete: (profile: UserProfile) => void;
}

// ── Question definitions ──────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  {
    id: 'dod_employee' as const,
    icon: Building2,
    label: 'DoD / Government Employee',
    desc: 'Active duty, civilian, or government contractor working on behalf of a DoD agency',
  },
  {
    id: 'dod_contractor' as const,
    icon: HardHat,
    label: 'Defense Industry Contractor',
    desc: 'Working for a prime or sub contractor — PM, BD, Capture, Program Support',
  },
  {
    id: 'career_changer' as const,
    icon: Compass,
    label: 'Breaking Into the Field',
    desc: 'Coming from outside DoD acquisitions and want to land your first role',
  },
  {
    id: 'student' as const,
    icon: GraduationCap,
    label: 'Student / Exploring',
    desc: 'Learning about acquisitions to decide if it\'s the right path',
  },
];

const EXPERIENCE_OPTIONS = [
  {
    id: 'new' as const,
    icon: Sprout,
    label: 'Brand New',
    desc: 'I have little to no acquisitions experience',
  },
  {
    id: 'some' as const,
    icon: TrendingUp,
    label: 'Some Exposure',
    desc: '1–3 years in or adjacent to acquisitions',
  },
  {
    id: 'experienced' as const,
    icon: Star,
    label: 'Experienced Professional',
    desc: '4+ years — I want to sharpen specific skills and advance',
  },
];

const GOAL_OPTIONS = [
  {
    id: 'program_management' as const,
    icon: Target,
    label: 'Become a Better Program Manager',
    desc: 'Lead programs, manage cost/schedule/performance, work with stakeholders',
  },
  {
    id: 'contracts_finance' as const,
    icon: FileText,
    label: 'Master Contracts & Finance',
    desc: 'Understand contract types, FAR, appropriations, EVM, and cost management',
  },
  {
    id: 'bd_capture' as const,
    icon: LayoutGrid,
    label: 'Win More Business (BD / Capture)',
    desc: 'Build winning proposals, master the capture process, understand source selection',
  },
  {
    id: 'full_picture' as const,
    icon: Compass,
    label: 'Understand the Full Picture',
    desc: 'See how everything connects — from Congress to the contract to the contractor',
  },
];

// ── Step component ────────────────────────────────────────────────────────────

function OptionCard<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: { id: T; icon: any; label: string; desc: string };
  selected: boolean;
  onSelect: (id: T) => void;
}) {
  const Icon = option.icon;
  return (
    <button
      onClick={() => onSelect(option.id)}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 group",
        selected
          ? "border-primary bg-primary/5 dark:bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-muted/40"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("font-semibold text-sm mb-0.5", selected ? "text-primary" : "text-foreground")}>
          {option.label}
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">{option.desc}</div>
      </div>
      {selected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingFlow({ username, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<UserProfile['role'] | null>(null);
  const [experience, setExperience] = useState<UserProfile['experience'] | null>(null);
  const [goal, setGoal] = useState<UserProfile['goal'] | null>(null);
  const [saving, setSaving] = useState(false);

  const firstName = username.split(' ')[0];

  const steps = [
    {
      title: `Welcome, ${firstName}. Let's personalize your path.`,
      subtitle: 'Which best describes your current situation?',
      options: ROLE_OPTIONS,
      value: role,
      onSelect: (v: string) => setRole(v as UserProfile['role']),
      canAdvance: !!role,
    },
    {
      title: 'Where are you in your journey?',
      subtitle: 'This helps us tailor the depth and sequence of your lessons.',
      options: EXPERIENCE_OPTIONS,
      value: experience,
      onSelect: (v: string) => setExperience(v as UserProfile['experience']),
      canAdvance: !!experience,
    },
    {
      title: 'What\'s your primary goal?',
      subtitle: 'We\'ll highlight the modules most relevant to where you want to go.',
      options: GOAL_OPTIONS,
      value: goal,
      onSelect: (v: string) => setGoal(v as UserProfile['goal']),
      canAdvance: !!goal,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const isMobile = useIsMobile();

  // Skipping still picks a track — from whatever was answered before the
  // skip, falling back to the defaults below.
  const handleSkip = () => {
    const profile: UserProfile = {
      role: role ?? 'student',
      experience: experience ?? 'new',
      goal: goal ?? 'full_picture',
      completedOnboarding: true,
    };
    setActiveTrack(deriveTrackFromOnboarding({ role: profile.role, goal: profile.goal }));
    apiRequest("POST", "/api/profile", profile).catch(() => {});
    onComplete(profile);
  };

  const handleNext = async () => {
    if (!currentStep.canAdvance) return;
    if (!isLastStep) {
      setStep(s => s + 1);
      return;
    }

    // Final step — save profile
    if (!role || !experience || !goal) return;
    setSaving(true);
    // "Build My Path" has to actually build one: the rest of the app organises
    // lessons by career track, which onboarding never used to set.
    setActiveTrack(deriveTrackFromOnboarding({ role, goal }));
    try {
      const profile: UserProfile = { role, experience, goal, completedOnboarding: true };
      await apiRequest("POST", "/api/profile", profile);
      onComplete(profile);
    } catch (err) {
      // Even if save fails, let the user through — they can re-answer later
      const profile: UserProfile = { role: role!, experience: experience!, goal: goal!, completedOnboarding: true };
      onComplete(profile);
    } finally {
      setSaving(false);
    }
  };

  // ── Mobile layout ─────────────────────────────────────────────────────────
  // No shell — onboarding owns the whole screen, like auth.
  if (isMobile) {
    return (
      <div
        className="acq-shell acq-fullscreen acq-scroll acq-inset-top px-5 pb-8"
        data-testid="onboarding-mobile"
      >
        <div className="pb-6 pt-5">
          <AcqlerateLogo iconSize={32} />
        </div>

        {/* Progress pills — current step is wider, everything up to it fills */}
        <div className="mb-6 flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: i === step ? 44 : 30,
                background: i <= step ? 'var(--acq-teal)' : 'var(--acq-surface-muted)',
                transition: 'width .3s ease, background .3s ease',
              }}
            />
          ))}
          <span className="ml-2 text-xs" style={{ color: 'var(--acq-text-muted)' }}>
            {step + 1} of {steps.length}
          </span>
        </div>

        <h1
          className="text-xl font-bold tracking-[-0.02em]"
          style={{ color: 'var(--acq-text-heading)', textWrap: 'pretty' } as any}
        >
          {currentStep.title}
        </h1>
        <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--acq-text-muted)' }}>
          {currentStep.subtitle}
        </p>

        <div className="flex flex-col gap-2.5">
          {(currentStep.options as typeof ROLE_OPTIONS).map((option) => (
            <MobileOptionCard
              key={option.id}
              icon={option.icon}
              label={option.label}
              description={option.desc}
              selected={currentStep.value === option.id}
              onSelect={() => (currentStep.onSelect as any)(option.id)}
              data-testid={`onboarding-option-${option.id}`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex min-h-[44px] items-center text-sm"
              style={{ color: 'var(--acq-text-muted)' }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentStep.canAdvance || saving}
            className="flex h-11 min-w-[140px] items-center justify-center gap-1.5 rounded-[10px] text-[15px] font-semibold disabled:opacity-50"
            style={{ background: 'var(--acq-teal)', color: '#FFFFFF' }}
            data-testid="onboarding-continue"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                {isLastStep ? 'Build My Path' : 'Continue'}
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </>
            )}
          </button>
        </div>

        <p className="mt-5 text-center text-xs">
          <button
            type="button"
            onClick={handleSkip}
            className="underline"
            style={{ color: 'var(--acq-text-muted)' }}
            data-testid="onboarding-skip"
          >
            Skip for now — show everything
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <AcqlerateLogo iconSize={36} />
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i < step ? "bg-primary w-8" :
                i === step ? "bg-primary w-12" :
                "bg-muted w-8"
              )}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {step + 1} of {steps.length}
          </span>
        </div>

        {/* Question card */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground mb-1">{currentStep.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{currentStep.subtitle}</p>

          <div className="space-y-3">
            {(currentStep.options as typeof ROLE_OPTIONS).map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={currentStep.value === option.id}
                onSelect={currentStep.onSelect as any}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          <Button
            onClick={handleNext}
            disabled={!currentStep.canAdvance || saving}
            className="gap-2 min-w-[120px]"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                {isLastStep ? 'Build My Path' : 'Continue'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </>
            )}
          </Button>
        </div>

        {/* Skip */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          <button
            onClick={handleSkip}
            className="underline hover:text-foreground transition-colors"
          >
            Skip for now — show everything
          </button>
        </p>
      </div>
    </div>
  );
}
