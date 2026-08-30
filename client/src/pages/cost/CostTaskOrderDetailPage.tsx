import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TaskOrder, CostProject, ProjectSummary } from "@shared/costTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Link2 } from "lucide-react";

interface TaskOrderDetail {
  taskOrder: TaskOrder;
  projects: { project: CostProject; summary: ProjectSummary }[];
  summary: ProjectSummary;
}

interface AllProjectsRow {
  project: CostProject;
  summary: ProjectSummary;
}

interface CostTaskOrderDetailPageProps {
  taskOrderId: string;
  onBack: () => void;
  onOpenProject: (projectId: string) => void;
}

const fmtMoney = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const statusBadge: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
  unfunded: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function CostTaskOrderDetailPage({ taskOrderId, onBack, onOpenProject }: CostTaskOrderDetailPageProps) {
  const qc = useQueryClient();
  const key = [`/api/cost-tracker/task-orders/${taskOrderId}`];

  const { data, isLoading } = useQuery<TaskOrderDetail>({ queryKey: key });

  // New-project-in-this-TO form
  const [showNewProject, setShowNewProject] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  // Move-existing-project-here control
  const [movingProjectId, setMovingProjectId] = useState<string>("");

  const { data: allProjects } = useQuery<AllProjectsRow[]>({
    queryKey: ["/api/cost-tracker/projects"],
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cost-tracker/projects", { code, name, taskOrderId });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/task-orders"] });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/task-orders-lite"] });
      setCode(""); setName(""); setShowNewProject(false);
    },
  });

  const moveProjectHere = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("PUT", `/api/cost-tracker/projects/${projectId}/task-order`, { taskOrderId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/task-orders"] });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/task-orders-lite"] });
      setMovingProjectId("");
    },
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Task Orders
        </button>
        <p className="text-sm text-muted-foreground">Loading task order…</p>
      </div>
    );
  }

  const { taskOrder, projects, summary } = data;
  const memberIds = new Set(projects.map((p) => p.project.id));
  const availableToMove = (allProjects ?? []).filter((r) => !memberIds.has(r.project.id));

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Task Orders
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{taskOrder.name}</h1>
          <p className="text-sm text-muted-foreground">{taskOrder.code} · {projects.length} {projects.length === 1 ? "project" : "projects"}</p>
        </div>
        <Badge variant="outline" className={statusBadge[summary.status]}>
          {summary.status === "unfunded" ? "No funding" : `${Math.round(summary.pctUsed * 100)}% used`}
        </Badge>
      </div>

      {/* TO-wide per-CLIN rollup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {summary.byClin.map((c) => (
          <Card key={c.clin} data-testid={`to-clin-summary-${c.clin}`}>
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
            <div className="text-xs text-muted-foreground">Total Funded (TO-wide)</div>
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

      {/* Member projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Projects in this Task Order</CardTitle>
          <div className="flex items-center gap-2">
            {availableToMove.length > 0 && (
              <div className="flex items-center gap-1">
                <Select value={movingProjectId} onValueChange={setMovingProjectId}>
                  <SelectTrigger className="w-56 h-8 text-xs" data-testid="select-move-project"><SelectValue placeholder="Move existing project here…" /></SelectTrigger>
                  <SelectContent>
                    {availableToMove.map((r) => (
                      <SelectItem key={r.project.id} value={r.project.id}>{r.project.code} — {r.project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm" variant="outline"
                  disabled={!movingProjectId || moveProjectHere.isPending}
                  onClick={() => moveProjectHere.mutate(movingProjectId)}
                  data-testid="button-move-project"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowNewProject((v) => !v)} data-testid="button-add-project-to-to">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showNewProject && (
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2 mb-4 p-3 bg-muted/40 rounded-lg items-end">
              <div>
                <Label className="text-xs">Project code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. TF-2026" data-testid="input-to-project-code" />
              </div>
              <div>
                <Label className="text-xs">Project name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Task Force Modernization" data-testid="input-to-project-name" />
              </div>
              <Button
                disabled={!code.trim() || !name.trim() || createProject.isPending}
                onClick={() => createProject.mutate()}
                data-testid="button-save-to-project"
              >
                Create
              </Button>
              {createProject.isError && <p className="col-span-full text-sm text-red-600">{(createProject.error as Error).message}</p>}
            </div>
          )}

          {projects.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <Link2 className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">No projects assigned yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create a project above and pick this Task Order to link it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map(({ project, summary: ps }) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onOpenProject(project.id)}
                  data-testid={`to-card-project-${project.code}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm">{project.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{project.code}</p>
                      </div>
                      <Badge variant="outline" className={`${statusBadge[ps.status]} text-[10px]`}>
                        {ps.status === "unfunded" ? "No funding" : `${Math.round(ps.pctUsed * 100)}%`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={Math.min(ps.pctUsed * 100, 100)} className="h-1.5 mb-2" />
                    <div className="text-xs text-muted-foreground">
                      {fmtMoney(ps.totalBilledCents)} of {fmtMoney(ps.totalFundedCents)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
