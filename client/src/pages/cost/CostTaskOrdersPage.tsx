import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TaskOrder, ProjectSummary } from "@shared/costTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Trash2, Layers } from "lucide-react";

interface Row {
  taskOrder: TaskOrder;
  projectCount: number;
  summary: ProjectSummary;
}

interface CostTaskOrdersPageProps {
  onBack: () => void;
  onOpenTaskOrder: (taskOrderId: string) => void;
}

const fmtMoney = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const statusBadge: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
  unfunded: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function CostTaskOrdersPage({ onBack, onOpenTaskOrder }: CostTaskOrdersPageProps) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const { data: rows, isLoading } = useQuery<Row[]>({
    queryKey: ["/api/cost-tracker/task-orders"],
  });

  const createTaskOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cost-tracker/task-orders", { code, name });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/task-orders"] });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/task-orders-lite"] });
      setCode("");
      setName("");
      setShowNew(false);
    },
  });

  const archiveTaskOrder = useMutation({
    mutationFn: async (taskOrderId: string) => {
      await apiRequest("DELETE", `/api/cost-tracker/task-orders/${taskOrderId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/task-orders"] });
      qc.invalidateQueries({ queryKey: ["/api/cost-tracker/task-orders-lite"] });
    },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Task Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group related projects under a Task Order to see funded/billed rolled up across all of them.
          </p>
        </div>
        <Button onClick={() => setShowNew((v) => !v)} data-testid="button-new-task-order">
          <Plus className="w-4 h-4 mr-1.5" /> New Task Order
        </Button>
      </div>

      {showNew && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-3 items-end">
              <div>
                <Label htmlFor="to-code">TO code</Label>
                <Input id="to-code" placeholder="e.g. TO-0042" value={code} onChange={(e) => setCode(e.target.value)} data-testid="input-taskorder-code" />
              </div>
              <div>
                <Label htmlFor="to-name">TO name</Label>
                <Input id="to-name" placeholder="e.g. Enterprise IT Support Task Order" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-taskorder-name" />
              </div>
              <Button
                disabled={!code.trim() || !name.trim() || createTaskOrder.isPending}
                onClick={() => createTaskOrder.mutate()}
                data-testid="button-create-taskorder"
              >
                Create
              </Button>
            </div>
            {createTaskOrder.isError && (
              <p className="text-sm text-red-600 mt-2">{(createTaskOrder.error as Error).message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading task orders…</p>}

      {!isLoading && rows && rows.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No task orders yet. Create one above, then assign projects to it.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows?.map(({ taskOrder, projectCount, summary }) => (
          <Card
            key={taskOrder.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onOpenTaskOrder(taskOrder.id)}
            data-testid={`card-taskorder-${taskOrder.code}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{taskOrder.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {taskOrder.code} · {projectCount} {projectCount === 1 ? "project" : "projects"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusBadge[summary.status]}>
                    {summary.status === "unfunded" ? "No funding" : `${Math.round(summary.pctUsed * 100)}% used`}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Archive Task Order "${taskOrder.name}"? Member projects are not deleted.`)) archiveTaskOrder.mutate(taskOrder.id);
                    }}
                    className="text-muted-foreground hover:text-red-600"
                    data-testid={`button-archive-taskorder-${taskOrder.code}`}
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
