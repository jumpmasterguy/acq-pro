import { useMemo } from "react";
import { modules, getAllLessons } from "@/lib/curriculum";
import { ArrowLeft, ExternalLink, Award, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDUTrackerProps {
  onBack: () => void;
  completedLessons: string[];
}

// PDU mapping per module
const MODULE_PDU_MAP: Record<string, { pduCategory: string; badgeColor: string }> = {
  foundations: { pduCategory: "Business Acumen",          badgeColor: "#01696F" },
  finance:     { pduCategory: "Business Acumen",          badgeColor: "#01696F" },
  contracts:   { pduCategory: "Business Acumen",          badgeColor: "#01696F" },
  data:        { pduCategory: "Ways of Working",           badgeColor: "#1D4ED8" },
  capture:     { pduCategory: "Business Acumen",          badgeColor: "#01696F" },
  operations:  { pduCategory: "Ways of Working + Power Skills", badgeColor: "#7C3AED" },
};

function parseDuration(dur: string): number {
  let mins = 0;
  const hr = dur.match(/(\d+)\s*hr/);
  const mn = dur.match(/(\d+)\s*min/);
  if (hr) mins += parseInt(hr[1]) * 60;
  if (mn) mins += parseInt(mn[1]);
  return mins;
}

export default function PDUTracker({ onBack, completedLessons }: PDUTrackerProps) {
  const allLessons = useMemo(() => getAllLessons(), []);

  const moduleData = useMemo(() => {
    return modules.map(mod => {
      const pduInfo = MODULE_PDU_MAP[mod.id] || { pduCategory: "Business Acumen", badgeColor: "#01696F" };
      const totalMins = mod.lessons.reduce((sum, l) => sum + parseDuration(l.duration || "0 min"), 0);
      const completedMins = mod.lessons
        .filter(l => completedLessons.includes(l.id))
        .reduce((sum, l) => sum + parseDuration(l.duration || "0 min"), 0);
      return {
        ...mod,
        pduInfo,
        totalMins,
        completedMins,
        totalPDUs: +(totalMins / 60).toFixed(1),
        earnedPDUs: +(completedMins / 60).toFixed(1),
        completedCount: mod.lessons.filter(l => completedLessons.includes(l.id)).length,
      };
    });
  }, [completedLessons]);

  const totalEarned = moduleData.reduce((s, m) => s + m.earnedPDUs, 0);
  const totalAvailable = moduleData.reduce((s, m) => s + m.totalPDUs, 0);

  const byCategory = {
    "Business Acumen": moduleData.filter(m => m.pduInfo.pduCategory.includes("Business Acumen")).reduce((s, m) => s + m.earnedPDUs, 0),
    "Ways of Working": moduleData.filter(m => m.pduInfo.pduCategory.includes("Ways of Working")).reduce((s, m) => s + m.earnedPDUs, 0),
    "Power Skills": moduleData.filter(m => m.pduInfo.pduCategory.includes("Power Skills")).reduce((s, m) => s + m.earnedPDUs, 0),
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />Back
        </Button>
      </div>

      {/* Hero */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-1">PMI PDU Tracker</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Acqlerate lessons qualify as <strong>Self-Paced Online Learning</strong> PDUs for PMP recertification.
              1 hour of learning = 1 PDU. Log them at <a href="https://pmlearning.pmi.org" target="_blank" rel="noopener" className="text-primary underline">pmlearning.pmi.org</a>.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{totalEarned.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">PDUs Earned</div>
          </div>
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{totalAvailable.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">PDUs Available</div>
          </div>
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">60</div>
            <div className="text-xs text-muted-foreground mt-0.5">PMP Requires</div>
          </div>
        </div>
      </div>

      {/* Talent Triangle breakdown */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Talent Triangle Breakdown</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Business Acumen", earned: byCategory["Business Acumen"], min: 8, color: "#01696F" },
            { label: "Ways of Working", earned: byCategory["Ways of Working"], min: 8, color: "#1D4ED8" },
            { label: "Power Skills", earned: byCategory["Power Skills"], min: 8, color: "#7C3AED" },
          ].map(cat => (
            <div key={cat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="text-xl font-bold" style={{ color: cat.color }}>{cat.earned.toFixed(1)}</div>
              <div className="text-xs font-medium mt-0.5">{cat.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{cat.min} min required</div>
              {cat.earned >= cat.min && (
                <div className="mt-1.5 text-xs font-bold text-green-500 flex items-center justify-center gap-0.5">
                  <CheckCircle className="w-3 h-3" /> Met
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Module breakdown */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">PDUs by Module</h2>
        <div className="space-y-3">
          {moduleData.map(mod => (
            <div key={mod.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{mod.title}</div>
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: mod.pduInfo.badgeColor }}>
                    {mod.pduInfo.pduCategory}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-primary">{mod.earnedPDUs.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">of {mod.totalPDUs.toFixed(1)} PDUs</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: mod.totalMins > 0 ? `${Math.min(100, (mod.completedMins / mod.totalMins) * 100)}%` : '0%' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                {mod.completedCount} of {mod.lessons.length} lessons · {mod.completedMins} min completed
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to log */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          How to Log Your PDUs in PMI CCRS
        </h2>
        <ol className="space-y-3">
          {[
            ["Go to", "pmlearning.pmi.org", "→ Certifications → Report PDUs"],
            ["Activity Type:", "Online or Digital Media"],
            ["Sub-Activity:", "Self-Paced Learning"],
            ["Provider:", "Acqlerate (acqlerate.com)"],
            ["Activity Title:", "e.g. \"Defense Finance & Budgeting — Acqlerate\""],
            ["PDUs:", "Enter hours completed · split by Talent Triangle category above"],
          ].map(([label, value, extra], i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-muted-foreground">
                {label} <strong className="text-foreground">{value}</strong> {extra || ""}
              </span>
            </li>
          ))}
        </ol>
        <a
          href="https://pmlearning.pmi.org"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open PMI CCRS →
        </a>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
        Acqlerate is not a PMI Authorized Training Partner. PDUs are self-reported by you directly to PMI.
        Self-paced online learning qualifies as Education PDUs under PMI's Continuing Certification Requirements.
        PDU amounts are based on lesson duration (1 hour = 1 PDU).
      </p>
    </div>
  );
}
