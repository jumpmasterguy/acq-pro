// The one-time "Turn on AI features?" sheet. Mounted once in App.tsx and
// opened by ensureAiConsent() (lib/aiConsent.ts). Names Anthropic, says what
// is sent and what isn't, links the privacy policy, and needs an explicit tap.
// Wording matches public/privacy.html section on AI features.

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Sheet } from "@/components/mobile/Sheet";
import { useToast } from "@/hooks/use-toast";
import { openSitePageInApp } from "@/lib/platform";
import { Switch } from "@/components/ui/switch";
import { answerAiConsent, hasAiConsent, isAiConsentAsked, saveAiConsent, subscribeAiConsent } from "@/lib/aiConsent";

export default function AiConsentHost() {
  const [open, setOpen] = useState(isAiConsentAsked());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => subscribeAiConsent(() => setOpen(isAiConsentAsked())), []);

  if (!open) return null;

  const accept = async () => {
    setSaving(true);
    try {
      await saveAiConsent(true);
      answerAiConsent(true);
    } catch (err: any) {
      toast({ title: "Not saved", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Sheet
      title="Turn on AI features?"
      onClose={() => answerAiConsent(false)}
      testId="ai-consent-sheet"
      footer={
        <div className="flex flex-col gap-2">
          <button
            onClick={accept}
            disabled={saving}
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
            data-testid="ai-consent-accept"
          >
            {saving ? "Saving…" : "Turn on AI features"}
          </button>
          <button
            onClick={() => answerAiConsent(false)}
            disabled={saving}
            className="h-11 w-full rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
            data-testid="ai-consent-decline"
          >
            Not now
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-3 text-sm leading-relaxed text-foreground">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="w-4 h-4 text-primary" /> Powered by Claude, an AI made by Anthropic
        </div>
        <p className="text-muted-foreground">
          The AI buttons (explain it simpler, Teach It Back, Explain My Mistake and How Do I Apply This?)
          send text to Anthropic so Claude can write or grade the answer.
        </p>
        <div>
          <div className="font-semibold mb-1">What we send to Anthropic</div>
          <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
            <li>The lesson or quiz question you're on</li>
            <li>What you type, or the answer you picked</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-1">What we don't send</div>
          <p className="text-muted-foreground">Your name, email or account details.</p>
        </div>
        <p className="text-muted-foreground">
          Anthropic doesn't use this text to train its models. Turn this off any time in My Account.{" "}
          <a href="/privacy" onClick={e => openSitePageInApp(e, "/privacy")} className="text-primary underline">
            Privacy Policy
          </a>
        </p>
        <p className="text-xs text-muted-foreground">Everything else in Acqlerate works the same if you say not now.</p>
      </div>
    </Sheet>
  );
}

/** My Account: turn AI features (sending text to Anthropic) on or off. */
export function AiConsentRow() {
  const [on, setOn] = useState(hasAiConsent());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  useEffect(() => subscribeAiConsent(() => setOn(hasAiConsent())), []);

  const change = async (next: boolean) => {
    setSaving(true);
    try {
      await saveAiConsent(next);
    } catch (err: any) {
      toast({ title: "Not saved", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <label className="flex items-center gap-3 py-1" data-testid="account-ai-consent">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold" style={{ color: 'var(--acq-text-heading)' }}>AI features</span>
        <span className="mt-0.5 block text-xs" style={{ color: 'var(--acq-text-muted)' }}>
          Sends the lesson and what you type to Anthropic (Claude) to answer. Never your name or email.
        </span>
      </span>
      <Switch checked={on} disabled={saving} onCheckedChange={change} />
    </label>
  );
}
