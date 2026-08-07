import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addRisk, deleteRisk, updateRisk } from "@/lib/actions";
import {
  RISK_LEVELS,
  RISK_LEVEL_LABELS,
  RISK_STATUSES,
  RISK_STATUS_LABELS,
  isHighSeverity,
  type RiskStatus,
} from "@/lib/constants";
import { RiskLevelBadge } from "@/components/risk-level-badge";
import { ActionForm } from "@/components/action-form";
import { ControlledInput } from "@/components/controlled-input";
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

function dateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
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
  const STATUS_ORDER: Record<string, number> = { OPEN: 0, MITIGATING: 1, CLOSED: 2 };
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
            <p className="text-sm text-muted-foreground">
              No risks logged yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.risks.map((risk) => (
                <div
                  key={risk.id}
                  className="rounded-lg border p-3 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-sm">{risk.title}</div>
                    <div className="flex items-center gap-1.5">
                      <RiskLevelBadge level={risk.impact} prefix="Impact:" />
                      <RiskLevelBadge
                        level={risk.probability}
                        prefix="Prob:"
                      />
                      <Badge
                        variant={
                          risk.status === "CLOSED"
                            ? "secondary"
                            : risk.status === "MITIGATING"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {RISK_STATUS_LABELS[risk.status as RiskStatus] ?? risk.status}
                      </Badge>
                    </div>
                  </div>

                  <ActionForm
                    action={updateRisk}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={risk.id} />
                    <input type="hidden" name="code" value={project.code} />
                    <div className="grid gap-1.5">
                      <Label>Title</Label>
                      <ControlledInput
                        name="title"
                        defaultValue={risk.title}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Owner</Label>
                      <ControlledInput
                        name="owner"
                        defaultValue={risk.owner}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Impact</Label>
                      <select
                        name="impact"
                        defaultValue={risk.impact}
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
                        defaultValue={risk.probability}
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
                      <Label>Status</Label>
                      <select
                        name="status"
                        defaultValue={risk.status}
                        className={SELECT_CLASS}
                      >
                        {RISK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {RISK_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Date identified</Label>
                      <ControlledInput
                        type="date"
                        name="identifiedAt"
                        defaultValue={dateInputValue(risk.identifiedAt)}
                      />
                    </div>
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        name="description"
                        defaultValue={risk.description ?? ""}
                        placeholder="Optional detail"
                      />
                    </div>
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label>Mitigation plan</Label>
                      <Textarea
                        name="mitigationPlan"
                        defaultValue={risk.mitigationPlan ?? ""}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                    </div>
                  </ActionForm>

                  <form action={deleteRisk} className="flex justify-end">
                    <input type="hidden" name="id" value={risk.id} />
                    <input type="hidden" name="code" value={project.code} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
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
                <Input type="date" name="identifiedAt" defaultValue={todayStr()} />
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
              Add Risk
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
