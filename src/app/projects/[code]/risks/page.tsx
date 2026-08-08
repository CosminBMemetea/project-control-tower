import { notFound } from "next/navigation";
import { Plus, Trash2, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { addRisk, deleteRisk } from "@/lib/actions";
import {
  RISK_LEVELS,
  RISK_LEVEL_LABELS,
  isHighSeverity,
} from "@/lib/constants";
import { RiskEditor } from "@/components/risk-editor";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs disabled:opacity-50";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function RisksPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    include: {
      risks: { orderBy: { identifiedAt: "desc" } },
    },
  });

  if (!project) notFound();

  // `status` sorts alphabetically in the DB (CLOSED, MITIGATING, OPEN),
  // which would bury the actionable risks below resolved ones — reorder
  // so Open/Mitigating always lead and Closed sinks to the bottom.
  const STATUS_ORDER: Record<string, number> = {
    OPEN: 0,
    MITIGATING: 1,
    CLOSED: 2,
  };
  project.risks.sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0)
  );

  const openRisks = project.risks.filter((r) => r.status !== "CLOSED");
  const highSeverity = openRisks.filter(isHighSeverity);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Risk Register</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={openRisks.length === 0 ? "default" : "outline"}>
              {openRisks.length} open
            </Badge>
            {highSeverity.length > 0 && (
              <Badge variant="destructive">
                {highSeverity.length} high severity
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.risks.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No risks logged yet"
              description="Use the form below to log the first risk for this project."
            />
          ) : (
            <div className="space-y-4">
              {project.risks.map((risk) => (
                <div key={risk.id} className="space-y-1">
                  <RiskEditor risk={risk} code={project.code} />
                  <form action={deleteRisk} className="flex justify-end">
                    <input type="hidden" name="id" value={risk.id} />
                    <input type="hidden" name="code" value={project.code} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log a New Risk</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={addRisk} className="space-y-3">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Title</Label>
                <Input name="title" placeholder="Short risk title" />
              </div>
              <div className="grid gap-1.5">
                <Label>Owner</Label>
                <Input name="owner" placeholder="Who owns this risk" />
              </div>
              <div className="grid gap-1.5">
                <Label>Impact</Label>
                <select
                  name="impact"
                  defaultValue="MEDIUM"
                  className={SELECT_CLASS}
                >
                  {RISK_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {RISK_LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Probability</Label>
                <select
                  name="probability"
                  defaultValue="MEDIUM"
                  className={SELECT_CLASS}
                >
                  {RISK_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {RISK_LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Date identified</Label>
                <Input
                  type="date"
                  name="identifiedAt"
                  defaultValue={todayStr()}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea name="description" placeholder="Optional detail" />
            </div>
            <div className="grid gap-1.5">
              <Label>Mitigation plan</Label>
              <Textarea name="mitigationPlan" placeholder="Optional" />
            </div>
            <Button type="submit" size="sm">
              <Plus className="size-3.5" />
              Add Risk
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
