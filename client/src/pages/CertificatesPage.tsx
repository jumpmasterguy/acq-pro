import { useEffect, useState } from "react";
import { ArrowLeft, Award, Download, FileSpreadsheet, Copy, CheckCircle, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, API_BASE } from "@/lib/queryClient";
import { isNativeApp } from "@/lib/platform";
import { isNewPricing, topPlanName } from "@shared/pricing";

/**
 * My Certificates: the CLP ledger. An Annual/Lifetime Pro feature (server enforces it
 * on /api/clp-ledger and the CSV). Every other tier sees what they have earned
 * so far and what the ledger adds; individual certificates stay downloadable
 * from each module page on every tier.
 */

interface LedgerEntry {
  moduleId: string;
  title: string;
  clps: number;
  functionalAreas: string[];
  completedAt: string;
  certId: string;
  backfilled: boolean;
  inCurrentCycle: boolean;
}

type LedgerResponse =
  | { locked: true; certificates: number; totalClps: number; availableClps: number; cycleTarget: number; modulesTotal: number }
  | {
      locked: false; name: string; entries: LedgerEntry[]; totalClps: number; cycleClps: number;
      cycleTarget: number; cycleStart: string; availableClps: number; modulesTotal: number;
    };

interface Props {
  onBack: () => void;
  onUpgrade: () => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

/** The block of text learners paste into CAPPMIS / eDACM / FAITAS, one course at a time. */
function portalText(e: LedgerEntry): string {
  return [
    `Course title: ${e.title}`,
    `Provider: Acqlerate (acqlerate.com)`,
    `Training type: External / self-paced online`,
    `Completion date: ${e.completedAt.slice(0, 10)}`,
    `Hours: ${e.clps.toFixed(1)}`,
    `CLPs: ${e.clps.toFixed(1)}`,
    `DAWIA functional areas: ${e.functionalAreas.join(", ")}`,
    `Certificate ID: ${e.certId} (verify at acqlerate.com/verify/${e.certId})`,
  ].join("\n");
}

export default function CertificatesPage({ onBack, onUpgrade }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    apiRequest("GET", "/api/clp-ledger")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const copy = async (e: LedgerEntry) => {
    try {
      await navigator.clipboard.writeText(portalText(e));
      setCopied(e.certId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Select the text and copy it by hand.", variant: "destructive" });
    }
  };

  const header = (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5" data-testid="certificates-back">
        <ArrowLeft className="w-4 h-4" />Back
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-6 pb-8">
        {header}
        <p className="text-sm text-muted-foreground">Couldn't load your certificates. Refresh to try again.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6 pb-8">
        {header}
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading your certificates…</div>
      </div>
    );
  }

  // ── Locked: every tier except Annual and Lifetime ───────────────────────
  if (data.locked) {
    return (
      <div className="space-y-6 pb-8" data-testid="certificates-locked">
        {header}
        <div className="rounded-xl p-6 bg-amber-500/[0.10] border border-amber-500/35">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-2xl">🎓</div>
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-1">Your CLP ledger</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.certificates > 0
                  ? <>You've earned <strong className="text-foreground">{data.certificates} {data.certificates === 1 ? "certificate" : "certificates"}</strong> worth <strong className="text-foreground">{data.totalClps.toFixed(1)} CLPs</strong>. Each one is on its module page.</>
                  : <>Finish a module and its certificate lands here. {data.availableClps.toFixed(1)} CLPs are available across all {data.modulesTotal} modules.</>}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
            <Lock className="w-3.5 h-3.5" /> {topPlanName()}
          </div>
          <h2 className="font-bold">Every certificate in one place, ready for your portal</h2>
          <ul className="space-y-2.5 text-sm">
            {[
              ["Your two-year cycle, tracked", `CLPs earned in the last 24 months against the ${data.cycleTarget}-point requirement.`],
              ["Copy for CAPPMIS, eDACM, or FAITAS", "One tap copies course title, date, hours, functional areas, and certificate ID in the order the forms ask for them."],
              ["Export the whole ledger", "A spreadsheet of every certificate for your supervisor, your training coordinator, or an audit."],
              isNewPricing()
                ? ["Your certificates stay yours", "Every certificate you earn stays downloadable from its module page, whatever plan you're on."]
                : ["Kept for good", "Your ledger never expires, whatever you finish next year or the year after."],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span><strong>{title}.</strong> <span className="text-muted-foreground">{desc}</span></span>
              </li>
            ))}
          </ul>
          {!isNativeApp() && (
            <Button onClick={onUpgrade} className="w-full sm:w-auto" data-testid="certificates-upgrade">
              <Award className="w-4 h-4 mr-1.5" /> {isNewPricing() ? "Get Annual Pro, $149 a year" : "Get Lifetime Pro, $99 once"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Unlocked: the ledger ────────────────────────────────────────────────
  const pct = Math.min(100, Math.round((data.cycleClps / data.cycleTarget) * 100));
  const anyBackfilled = data.entries.some((e) => e.backfilled);

  return (
    <div className="space-y-6 pb-8" data-testid="certificates-ledger">
      {header}

      <div className="rounded-xl p-6 bg-amber-500/[0.10] border border-amber-500/35">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-2xl">🎓</div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">CLP ledger</div>
            <h1 className="text-xl font-bold">{data.name}</h1>
            <p className="text-sm text-muted-foreground">DAWIA continuous learning: {data.cycleTarget} CLPs every two years</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-3xl font-bold">{data.cycleClps.toFixed(1)} <span className="text-base font-medium text-muted-foreground">of {data.cycleTarget} CLPs</span></div>
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">{pct}%</div>
          </div>
          <div className="h-2 rounded-full bg-amber-900/15 dark:bg-amber-200/15 overflow-hidden mt-2">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Earned since {fmtDate(data.cycleStart)} (the last 24 months). {data.totalClps.toFixed(1)} earned all time, {data.availableClps.toFixed(1)} available across all {data.modulesTotal} modules.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" disabled={data.entries.length === 0}>
          <a href={`${API_BASE}/api/clp-ledger.csv`} data-testid="ledger-csv"><FileSpreadsheet className="w-4 h-4 mr-1.5" />Export ledger (CSV)</a>
        </Button>
      </div>

      {data.entries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
          No certificates yet. Finish every lesson in a module and its certificate shows up here with a permanent ID.
        </div>
      ) : (
        <div className="space-y-3">
          {data.entries.map((e) => (
            <div key={e.certId} className="bg-card border border-border rounded-xl p-4" data-testid={`ledger-entry-${e.moduleId}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{e.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Completed {fmtDate(e.completedAt)}{e.backfilled ? "*" : ""} · {e.functionalAreas.join(" · ")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <a href={`/verify/${e.certId}`} target="_blank" rel="noopener" className="font-mono hover:underline">{e.certId}</a>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{e.clps.toFixed(1)}</div>
                  <div className="text-[11px] text-muted-foreground">CLPs</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button asChild variant="outline" size="sm">
                  <a href={`${API_BASE}/api/certificate/${e.moduleId}`}><Download className="w-3.5 h-3.5 mr-1.5" />Certificate PDF</a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => copy(e)} data-testid={`ledger-copy-${e.moduleId}`}>
                  {copied === e.certId ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy for your portal</>}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5 text-sm">
        <h2 className="font-bold mb-3">Logging it</h2>
        <ol className="space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">1.</strong> Open your portal: CAPPMIS (Army), eDACM (Navy, Marine Corps, Air Force), or FAITAS (civilian agencies).</li>
          <li><strong className="text-foreground">2.</strong> Add it as External Training, self-paced online.</li>
          <li><strong className="text-foreground">3.</strong> Paste the details from "Copy for your portal" and attach the certificate PDF.</li>
        </ol>
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
        {anyBackfilled && <>* Finished before Acqlerate recorded completion dates, so the date shown is when it was first recorded. </>}
        Acqlerate is not affiliated with WarU, DoD, or any government agency. CLPs are self-reported by you; 1 hour of instruction = 1 CLP. Anyone can confirm a certificate at acqlerate.com/verify.
      </p>
    </div>
  );
}
