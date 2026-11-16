"use client";

import { useState } from "react";
import {
  RISK_LEVELS,
  RISK_LEVEL_LABELS,
  RISK_STATUSES,
  RISK_STATUS_LABELS,
  type RiskStatus,
} from "@/lib/constants";
import { setRiskField } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";
import {
  AutosaveInput,
  AutosaveTextarea,
} from "@/components/autosave-text-field";
import { RiskLevelBadge } from "@/components/risk-level-badge";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs disabled:opacity-50";

function dateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

type RiskData = {
  id: string;
  title: string;
  owner: string;
  impact: string;
  probability: string;
  status: string;
  identifiedAt: Date;
  description: string | null;
  mitigationPlan: string | null;
};

/**
 * Fully autosaved risk editor. Selects/status save immediately; free-text
 * fields save on blur + debounce. No manual Save button.
 */
export function RiskEditor({ risk, code }: { risk: RiskData; code: string }) {
  const [impact, setImpact] = useState(risk.impact);
  const [probability, setProbability] = useState(risk.probability);
  const [status, setStatus] = useState(risk.status);
  const [prev, setPrev] = useState({
    impact: risk.impact,
    probability: risk.probability,
    status: risk.status,
  });
  const { isPending, save } = useAutosave();

  if (
    risk.impact !== prev.impact ||
    risk.probability !== prev.probability ||
    risk.status !== prev.status
  ) {
    setPrev({
      impact: risk.impact,
      probability: risk.probability,
      status: risk.status,
    });
    setImpact(risk.impact);
    setProbability(risk.probability);
    setStatus(risk.status);
  }

  function saveField(
    field: Parameters<typeof setRiskField>[2],
    value: string
  ) {
    return setRiskField(risk.id, code, field, value);
  }

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium text-sm">{risk.title}</div>
        <div className="flex items-center gap-1.5">
          <RiskLevelBadge level={impact} prefix="Impact:" />
          <RiskLevelBadge level={probability} prefix="Prob:" />
          <Badge
            variant={
              status === "CLOSED"
                ? "secondary"
                : status === "MITIGATING"
                  ? "outline"
                  : "destructive"
            }
          >
            {RISK_STATUS_LABELS[status as RiskStatus] ?? status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Title</Label>
          <AutosaveInput
            value={risk.title}
            onSave={(next) => saveField("title", next)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Owner</Label>
          <AutosaveInput
            value={risk.owner}
            onSave={(next) => saveField("owner", next)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Impact</Label>
          <select
            aria-label="Impact"
            value={impact}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value;
              setImpact(next);
              save(() => saveField("impact", next));
            }}
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
            aria-label="Probability"
            value={probability}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value;
              setProbability(next);
              save(() => saveField("probability", next));
            }}
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
            aria-label="Status"
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value;
              setStatus(next);
              save(() => saveField("status", next));
            }}
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
          <AutosaveInput
            type="date"
            value={dateInputValue(risk.identifiedAt)}
            onSave={(next) => saveField("identifiedAt", next)}
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label>Description</Label>
          <AutosaveTextarea
            value={risk.description ?? ""}
            placeholder="Optional detail"
            onSave={(next) => saveField("description", next)}
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label>Mitigation plan</Label>
          <AutosaveTextarea
            value={risk.mitigationPlan ?? ""}
            placeholder="Optional"
            onSave={(next) => saveField("mitigationPlan", next)}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Changes save automatically.
      </p>
    </div>
  );
}
