import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CostProject, ProjectSummary } from "@shared/costTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Settings, Trash2, FolderKanban } from "lucide-react";

interface Row {
  project: CostProject;
  summary: ProjectSummary;
}

interface CostProjectsPageProps {
  onBack: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenRates: () => void;
}

const fmtMoney = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const statusBadge: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
  unfunded: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function CostProjectsPage({ onBack, onOpenProject, onOpenRates }: CostProjectsPageProps) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const { data: rows, isLoading } = useQuery<Row[]>({
    queryKey: ["/api/cost-tracker/projects"],
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cost-tracker/projects", { code, name });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] });
      setCode("");
      setName("");
      setShowNew(false);
    },
  });

  const archiveProject = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("DELETE", `/api/cost-tracker/projects/${projectId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/cost-tracker/projects"] }),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <Button variant="outline" size="sm" onClick={onOpenRates} data-testid="button-cost-rates">
          <Settings className="w-4 h-4 mr-1.5" /> Rates &amp; Fee Settings
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary" /> Cost &amp; Burn Rate Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track funding mods and spend across every project. Data persists between visits.
          </p>
        </div>
        <Button onClick={() => setShowNew((v) => !v)} data-testid="button-new-project">
          <Plus className="w-4 h-4 mr-1.5" /> New Project
        </Button>
      </div>

      {showNew && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-3 items-end">
              <div>
                <Label htmlFor="proj-code">Project code</Label>
                <Input id="proj-code" placeholder="e.g. TF-2026" value={code} onChange={(e) => setCode(e.target.value)} data-testid="input-project-code" />
              </div>
              <div>
                <Label htmlFor="proj-name">Project name</Label>
                <Input id="proj-name" placeholder="e.g. Task Force Modernization" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-project-name" />
              </div>
              <Button
                disabled={!code.trim() || !name.trim() || createProject.isPending}
                onClick={() => createProject.mutate()}
                data-testid="button-create-project"
              >
                Create
              </Button>
            </div>
            {createProject.isError && (
              <p className="text-sm text-red-600 mt-2">{(createProject.error as Error).message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading projects…</p>}

      {!isLoading && rows && rows.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No projects yet. Create one above to start tracking funding mods and spend.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows?.map(({ project, summary }) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onOpenProject(project.id)}
            data-testid={`card-project-${project.code}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{project.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusBadge[summary.status]}>
                    {summary.status === "unfunded" ? "No funding" : `${Math.round(summary.pctUsed * 100)}% used`}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Archive project "${project.name}"?`)) archiveProject.mutate(project.id);
                    }}
                    className="text-muted-foreground hover:text-red-600"
                    data-testid={`button-archive-${project.code}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={Math.min(summary.pctUsed * 100, 100)} className="h-2 mb-3" />
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Funded</div>
                  <div className="font-semibold">{fmtMoney(summary.totalFundedCents)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Billed</div>
                  <div className="font-semibold">{fmtMoney(summary.totalBilledCents)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Remaining</div>
                  <div className="font-semibold">{fmtMoney(summary.totalFundedCents - summary.totalBilledCents)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
