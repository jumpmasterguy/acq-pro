import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RatesConfig, Clin, FeeType } from "@shared/costTracker";
import { CLINS, DEFAULT_RATES } from "@shared/costTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

interface CostRatesPageProps {
  onBack: () => void;
}

type FormState = Omit<RatesConfig, "userId" | "updatedAt">;

const pctToStr = (v: number) => (v * 100).toString();
const strToPct = (v: string) => (parseFloat(v || "0") / 100);

export default function CostRatesPage({ onBack }: CostRatesPageProps) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<RatesConfig>({ queryKey: ["/api/cost-tracker/rates"] });

  const [form, setForm] = useState<FormState>(DEFAULT_RATES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        fringe: data.fringe, overhead: data.overhead, ga: data.ga, ms: data.ms,
        fixedFeeRate: data.fixedFeeRate, awardFeeRate: data.awardFeeRate,
        feeTypeByClin: data.feeTypeByClin,
      });
    }
  }, [data]);

  const saveRates = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/cost-tracker/rates", form);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/rates"] });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <p className="text-sm text-muted-foreground">Loading rates…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      <h1 className="text-2xl font-bold mb-1">Rates &amp; Fee Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        These rates apply to every project. Fringe and Overhead burden Prime labor. G&amp;A applies to Prime cost
        (labor, travel, ODC, M&amp;E). M&amp;S applies only to Sub-sourced travel/ODC/M&amp;E — Sub labor carries no
        G&amp;A/M&amp;S since Subs bring their own.
      </p>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Burden &amp; Indirect Rates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Fringe (%)</Label>
            <Input type="number" step="0.1" value={pctToStr(form.fringe)}
              onChange={(e) => setForm((f) => ({ ...f, fringe: strToPct(e.target.value) }))}
              data-testid="input-rate-fringe" />
          </div>
          <div>
            <Label className="text-xs">Overhead (%)</Label>
            <Input type="number" step="0.1" value={pctToStr(form.overhead)}
              onChange={(e) => setForm((f) => ({ ...f, overhead: strToPct(e.target.value) }))}
              data-testid="input-rate-overhead" />
          </div>
          <div>
            <Label className="text-xs">G&amp;A — Prime (%)</Label>
            <Input type="number" step="0.1" value={pctToStr(form.ga)}
              onChange={(e) => setForm((f) => ({ ...f, ga: strToPct(e.target.value) }))}
              data-testid="input-rate-ga" />
          </div>
          <div>
            <Label className="text-xs">M&amp;S — Sub Travel/ODC/M&amp;E (%)</Label>
            <Input type="number" step="0.1" value={pctToStr(form.ms)}
              onChange={(e) => setForm((f) => ({ ...f, ms: strToPct(e.target.value) }))}
              data-testid="input-rate-ms" />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fee Rates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Fixed Fee Rate (%)</Label>
            <Input type="number" step="0.1" value={pctToStr(form.fixedFeeRate)}
              onChange={(e) => setForm((f) => ({ ...f, fixedFeeRate: strToPct(e.target.value) }))}
              data-testid="input-rate-fixedfee" />
          </div>
          <div>
            <Label className="text-xs">Target Award Fee Rate (%)</Label>
            <Input type="number" step="0.1" value={pctToStr(form.awardFeeRate)}
              onChange={(e) => setForm((f) => ({ ...f, awardFeeRate: strToPct(e.target.value) }))}
              data-testid="input-rate-awardfee" />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fee Type by CLIN</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {CLINS.map((clin) => (
            <div key={clin}>
              <Label className="text-xs">{clin}</Label>
              <Select
                value={form.feeTypeByClin[clin]}
                onValueChange={(v) => setForm((f) => ({ ...f, feeTypeByClin: { ...f.feeTypeByClin, [clin]: v as FeeType } }))}
              >
                <SelectTrigger data-testid={`select-feetype-${clin}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Award">Award</SelectItem>
                  <SelectItem value="CR">CR (no fee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={() => saveRates.mutate()} disabled={saveRates.isPending} data-testid="button-save-rates">
        <Save className="w-4 h-4 mr-1.5" /> {saved ? "Saved" : "Save Rates"}
      </Button>
      {saveRates.isError && <p className="text-sm text-red-600 mt-2">{(saveRates.error as Error).message}</p>}
    </div>
  );
}
