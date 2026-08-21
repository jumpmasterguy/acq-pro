import { useMemo, useState } from "react";
import { ArrowLeft, Calculator, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CLINS, type Clin, type FeeType, type RatesInput, type CostsByClin, type FundedByClin,
  DEFAULT_RATES, EMPTY_COSTS, EMPTY_FUNDED, calculate,
} from "@/lib/costTrackerEngine";

interface CostTrackerProps {
  onBack: () => void;
}

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function pctInput(value: number, onChange: (v: number) => void, testId: string) {
  return (
    <Input
      type="number"
      step="0.5"
      value={+(value * 100).toFixed(4)}
      onChange={(e) => onChange((parseFloat(e.target.value) || 0) / 100)}
      data-testid={testId}
      className="text-right"
    />
  );
}

const STATUS_STYLES: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300",
  yellow: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300",
  unfunded: "bg-muted text-muted-foreground border-muted-foreground/20",
};

export default function CostTracker({ onBack }: CostTrackerProps) {
  const [rates, setRates] = useState<RatesInput>(DEFAULT_RATES);
  const [costs, setCosts] = useState<CostsByClin>(EMPTY_COSTS);
  const [funded, setFunded] = useState<FundedByClin>(EMPTY_FUNDED);

  const result = useMemo(() => calculate({ rates, costs, funded }), [rates, costs, funded]);

  const setClinCost = (clin: Clin, field: "primeRaw" | "subRaw", value: number) =>
    setCosts((c) => ({ ...c, [clin]: { ...c[clin], [field]: value } }));
  const setClinFunded = (clin: Clin, value: number) =>
    setFunded((f) => ({ ...f, [clin]: value }));
  const setFeeType = (clin: Clin, type: FeeType) =>
    setRates((r) => ({ ...r, feeTypeByClin: { ...r.feeTypeByClin, [clin]: type } }));

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6" data-testid="page-cost-tracker">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Cost &amp; Burn Rate Calculator
          </h1>
          <p className="text-sm text-muted-foreground">
            Same Fringe → Overhead → G&amp;A/M&amp;S → Fee buildup as the Excel tracker — live, in your browser.
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">Draft — v1</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Fringe Rate (%)</Label>
            {pctInput(rates.fringe, (v) => setRates((r) => ({ ...r, fringe: v })), "input-fringe")}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Overhead Rate (%)</Label>
            {pctInput(rates.overhead, (v) => setRates((r) => ({ ...r, overhead: v })), "input-overhead")}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">G&amp;A Rate (%) — Prime only</Label>
            {pctInput(rates.ga, (v) => setRates((r) => ({ ...r, ga: v })), "input-ga")}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">M&amp;S Rate (%) — Sub only</Label>
            {pctInput(rates.ms, (v) => setRates((r) => ({ ...r, ms: v })), "input-ms")}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fixed Fee Rate (%)</Label>
            {pctInput(rates.fixedFeeRate, (v) => setRates((r) => ({ ...r, fixedFeeRate: v })), "input-fixed-fee")}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Target Award Fee Rate (%)</Label>
            {pctInput(rates.awardFeeRate, (v) => setRates((r) => ({ ...r, awardFeeRate: v })), "input-award-fee")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This Period — Cost by CLIN</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CLIN</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead className="text-right">Prime $ {" "}
                  <span className="text-[10px] text-muted-foreground font-normal">(Labor: unburdened)</span>
                </TableHead>
                <TableHead className="text-right">Sub $</TableHead>
                <TableHead className="text-right">Funded $ (period)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CLINS.map((clin) => (
                <TableRow key={clin} data-testid={`row-clin-${clin}`}>
                  <TableCell className="font-medium">{clin}</TableCell>
                  <TableCell>
                    <Select value={rates.feeTypeByClin[clin]} onValueChange={(v) => setFeeType(clin, v as FeeType)}>
                      <SelectTrigger className="h-8 w-28" data-testid={`select-feetype-${clin}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Award">Award</SelectItem>
                        <SelectItem value="CR">CR (0%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      className="w-32 ml-auto text-right"
                      value={costs[clin].primeRaw || ""}
                      onChange={(e) => setClinCost(clin, "primeRaw", parseFloat(e.target.value) || 0)}
                      data-testid={`input-prime-${clin}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      className="w-32 ml-auto text-right"
                      value={costs[clin].subRaw || ""}
                      onChange={(e) => setClinCost(clin, "subRaw", parseFloat(e.target.value) || 0)}
                      data-testid={`input-sub-${clin}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      className="w-32 ml-auto text-right"
                      value={funded[clin] || ""}
                      onChange={(e) => setClinFunded(clin, parseFloat(e.target.value) || 0)}
                      data-testid={`input-funded-${clin}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results (auto)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CLIN</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Total Billed</TableHead>
                <TableHead className="text-right">% of Funding Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.byClin.map((r) => (
                <TableRow key={r.clin} data-testid={`result-row-${r.clin}`}>
                  <TableCell className="font-medium">{r.clin}</TableCell>
                  <TableCell className="text-right">{money(r.totalCost)}</TableCell>
                  <TableCell className="text-right">{money(r.fee)}</TableCell>
                  <TableCell className="text-right font-semibold">{money(r.totalBilled)}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={STATUS_STYLES[r.status]} variant="outline" data-testid={`badge-status-${r.clin}`}>
                      {r.funded > 0 ? pct(r.pctUsed) : "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground">Subtotal</div>
              <div className="text-lg font-semibold" data-testid="text-subtotal">{money(result.subtotal)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">G&amp;A $ (Prime) + M&amp;S $ (Sub)</div>
              <div className="text-lg font-semibold" data-testid="text-ga-ms">
                {money(result.gaDollars)} + {money(result.msDollars)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Cost + Fee</div>
              <div className="text-lg font-semibold" data-testid="text-total-cost">
                {money(result.totalCost)} + {money(result.totalFee)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">TOTAL BILLED</div>
              <div className="text-2xl font-bold text-primary" data-testid="text-total-billed">{money(result.totalBilled)}</div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>
              Green = under 50% of period funding used, yellow = 50–70%, red = 70%+ (the FAR 52.232-20/22 notification
              zone). This is a single-period what-if — the full Excel tracker still handles multi-project, multi-month
              tracking, PTO, ROM estimating, and funding mod history.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
