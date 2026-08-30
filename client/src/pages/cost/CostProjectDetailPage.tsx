import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CostProject, FundingMod, CostEntry, RatesConfig, ProjectSummary, Clin, PrimeSub } from "@shared/costTracker";
import { CLINS } from "@shared/costTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Layers, FileText } from "lucide-react";

interface ProjectDetail {
  project: CostProject;
  mods: FundingMod[];
  entries: CostEntry[];
  rates: RatesConfig;
  summary: ProjectSummary;
}

interface CostProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
  onOpenTaskOrder?: (taskOrderId: string) => void;
}

const fmtMoney = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const dollarsToCents = (v: string) => Math.round(parseFloat(v || "0") * 100);

const statusBadge: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
  unfunded: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function CostProjectDetailPage({ projectId, onBack, onOpenTaskOrder }: CostProjectDetailPageProps) {
  const qc = useQueryClient();
  const key = [`/api/cost-tracker/projects/${projectId}`];

  const { data, isLoading } = useQuery<ProjectDetail>({ queryKey: key });

  // Add-mod form state
  const [showModForm, setShowModForm] = useState(false);
  const [modNumber, setModNumber] = useState("");
  const [modClin, setModClin] = useState<Clin>("Labor");
  const [modAcrn, setModAcrn] = useState("");
  const [modSlin, setModSlin] = useState("");
  const [modAmount, setModAmount] = useState("");
  const [modDate, setModDate] = useState("");
  const [modDesc, setModDesc] = useState("");

  // Add-entry form state
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryClin, setEntryClin] = useState<Clin>("Labor");
  const [entryPrimeSub, setEntryPrimeSub] = useState<PrimeSub>("Prime");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryDesc, setEntryDesc] = useState("");

  const addMod = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cost-tracker/projects/${projectId}/mods`, {
        modNumber, clin: modClin, acrn: modAcrn || null, slin: modSlin || null,
        amountCents: dollarsToCents(modAmount), modDate: modDate || null, description: modDesc || null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] });
      setModNumber(""); setModAcrn(""); setModSlin(""); setModAmount(""); setModDate(""); setModDesc("");
      setShowModForm(false);
    },
  });

  const deleteMod = useMutation({
    mutationFn: async (modId: string) => {
      await apiRequest("DELETE", `/api/cost-tracker/projects/${projectId}/mods/${modId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] });
    },
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cost-tracker/projects/${projectId}/entries`, {
        clin: entryClin, primeOrSub: entryPrimeSub, amountCents: dollarsToCents(entryAmount),
        entryDate: entryDate || new Date().toISOString().slice(0, 10), description: entryDesc || null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] });
      setEntryAmount(""); setEntryDate(""); setEntryDesc("");
      setShowEntryForm(false);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest("DELETE", `/api/cost-tracker/projects/${projectId}/entries/${entryId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </div>
    );
  }

  const { project, mods, entries, summary } = data;

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.code}</p>
          {project.taskOrderId && onOpenTaskOrder && (
            <button
              onClick={() => onOpenTaskOrder(project.taskOrderId as string)}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
              data-testid="link-project-taskorder"
            >
              <Layers className="w-3 h-3" /> View Task Order
            </button>
          )}
        </div>
        <Badge variant="outline" className={statusBadge[summary.status]}>
          {summary.status === "unfunded" ? "No funding" : `${Math.round(summary.pctUsed * 100)}% used`}
        </Badge>
      </div>

      {/* Per-CLIN summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {summary.byClin.map((c) => (
          <Card key={c.clin} data-testid={`clin-summary-${c.clin}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground">{c.clin}</span>
                <Badge variant="outline" className={`${statusBadge[c.status]} text-[10px] px-1.5 py-0`}>
                  {c.status === "unfunded" ? "—" : `${Math.round(c.pctUsed * 100)}%`}
                </Badge>
              </div>
              <Progress value={Math.min(c.pctUsed * 100, 100)} className="h-1.5 mb-2" />
              <div className="text-sm font-semibold">{fmtMoney(c.totalBilledCents)}</div>
              <div className="text-xs text-muted-foreground">of {fmtMoney(c.fundedCents)} funded</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Total Funded</div>
            <div className="text-xl font-bold">{fmtMoney(summary.totalFundedCents)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Total Cost + Fee (Billed)</div>
            <div className="text-xl font-bold">{fmtMoney(summary.totalBilledCents)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              G&amp;A {fmtMoney(summary.gaCents)} · M&amp;S {fmtMoney(summary.msCents)} · Fee {fmtMoney(summary.totalFeeCents)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Remaining</div>
            <div className="text-xl font-bold">{fmtMoney(summary.totalFundedCents - summary.totalBilledCents)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Funding mods */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Funding Mods ({mods.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowModForm((v) => !v)} data-testid="button-add-mod">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Mod
          </Button>
        </CardHeader>
        <CardContent>
          {showModForm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-3 bg-muted/40 rounded-lg">
              <div>
                <Label className="text-xs">Mod #</Label>
                <Input value={modNumber} onChange={(e) => setModNumber(e.target.value)} placeholder="P00001" data-testid="input-mod-number" />
              </div>
              <div>
                <Label className="text-xs">CLIN</Label>
                <Select value={modClin} onValueChange={(v) => setModClin(v as Clin)}>
                  <SelectTrigger data-testid="select-mod-clin"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLINS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">ACRN</Label>
                <Input value={modAcrn} onChange={(e) => setModAcrn(e.target.value)} placeholder="AA" data-testid="input-mod-acrn" />
              </div>
              <div>
                <Label className="text-xs">SLIN</Label>
                <Input value={modSlin} onChange={(e) => setModSlin(e.target.value)} placeholder="0001" data-testid="input-mod-slin" />
              </div>
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input type="number" value={modAmount} onChange={(e) => setModAmount(e.target.value)} placeholder="50000" data-testid="input-mod-amount" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={modDate} onChange={(e) => setModDate(e.target.value)} data-testid="input-mod-date" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Input value={modDesc} onChange={(e) => setModDesc(e.target.value)} placeholder="optional" data-testid="input-mod-desc" />
              </div>
              <div className="col-span-2 flex items-end">
                <Button
                  className="w-full"
                  disabled={!modNumber.trim() || !modAmount || addMod.isPending}
                  onClick={() => addMod.mutate()}
                  data-testid="button-save-mod"
                >
                  Save Mod
                </Button>
              </div>
              {addMod.isError && <p className="col-span-full text-sm text-red-600">{(addMod.error as Error).message}</p>}
            </div>
          )}
          {mods.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <FileText className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">No funding mods yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add the first mod above to start tracking funded value against spend.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mod #</TableHead>
                  <TableHead>CLIN</TableHead>
                  <TableHead>ACRN/SLIN</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mods.map((m) => (
                  <TableRow key={m.id} data-testid={`row-mod-${m.id}`}>
                    <TableCell className="font-medium">{m.modNumber}</TableCell>
                    <TableCell>{m.clin}</TableCell>
                    <TableCell className="text-muted-foreground">{[m.acrn, m.slin].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.modDate || "—"}</TableCell>
                    <TableCell className="text-right font-mono">{fmtMoney(m.amountCents)}</TableCell>
                    <TableCell>
                      <button onClick={() => deleteMod.mutate(m.id)} className="text-muted-foreground hover:text-red-600" data-testid={`button-delete-mod-${m.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cost entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Cost Entries ({entries.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowEntryForm((v) => !v)} data-testid="button-add-entry">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          {showEntryForm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-3 bg-muted/40 rounded-lg">
              <div>
                <Label className="text-xs">CLIN</Label>
                <Select value={entryClin} onValueChange={(v) => setEntryClin(v as Clin)}>
                  <SelectTrigger data-testid="select-entry-clin"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLINS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prime / Sub</Label>
                <Select value={entryPrimeSub} onValueChange={(v) => setEntryPrimeSub(v as PrimeSub)}>
                  <SelectTrigger data-testid="select-entry-primesub"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prime">Prime</SelectItem>
                    <SelectItem value="Sub">Sub</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input type="number" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="1000" data-testid="input-entry-amount" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} data-testid="input-entry-date" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <Label className="text-xs">Description</Label>
                <Input value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="optional" data-testid="input-entry-desc" />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  disabled={!entryAmount || addEntry.isPending}
                  onClick={() => addEntry.mutate()}
                  data-testid="button-save-entry"
                >
                  Save Entry
                </Button>
              </div>
              {addEntry.isError && <p className="col-span-full text-sm text-red-600">{(addEntry.error as Error).message}</p>}
            </div>
          )}
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No cost entries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>CLIN</TableHead>
                  <TableHead>Prime/Sub</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id} data-testid={`row-entry-${e.id}`}>
                    <TableCell className="text-muted-foreground">{e.entryDate}</TableCell>
                    <TableCell>{e.clin}</TableCell>
                    <TableCell>{e.primeOrSub}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description || "—"}</TableCell>
                    <TableCell className="text-right font-mono">{fmtMoney(e.amountCents)}</TableCell>
                    <TableCell>
                      <button onClick={() => deleteEntry.mutate(e.id)} className="text-muted-foreground hover:text-red-600" data-testid={`button-delete-entry-${e.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
