import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calculator, TrendingUp, Layers, ShieldCheck, ArrowRight } from "lucide-react";

interface CostTrackerIntroPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Burn rate at a glance",
    description: "See funded vs. billed for every project as a live bar, so you know today whether you're on pace before finance asks.",
  },
  {
    icon: Layers,
    title: "Roll up by Task Order",
    description: "Group related projects under a Task Order to see a combined funded/billed total across all of them, not just one at a time.",
  },
  {
    icon: ShieldCheck,
    title: "Every funding mod, tracked",
    description: "Log each modification as it lands so your funded total always reflects reality, not the last time someone remembered to update a spreadsheet.",
  },
];

export default function CostTrackerIntroPage({ onBack, onGetStarted }: CostTrackerIntroPageProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center mb-4">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Spend Plan &amp; Burn Rate Tracker</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          The tool built for the part of the job no lesson covers: watching the money after the award. Track funding mods, burn rate, and task orders in one place.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {FEATURES.map((f, i) => (
          <Card key={i}>
            <CardContent className="pt-6 text-center">
              <f.icon className="w-5 h-5 text-primary mx-auto mb-3" />
              <h3 className="text-sm font-bold mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button size="lg" onClick={onGetStarted} data-testid="button-tracker-get-started">
          Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
        <p className="text-xs text-muted-foreground">Takes under a minute to set up your first project. We'll walk you through it.</p>
      </div>
    </div>
  );
}
