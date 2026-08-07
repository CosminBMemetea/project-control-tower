import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RAG_COLORS, RAG_LABELS, type RagStatus } from "@/lib/constants";

const RAG_ICONS = {
  GREEN: CheckCircle2,
  AMBER: AlertTriangle,
  RED: AlertOctagon,
} as const;

export function RagBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: "sm" | "lg";
}) {
  const s = (status in RAG_LABELS ? status : "GREEN") as RagStatus;
  const Icon = RAG_ICONS[s];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-semibold",
        size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs",
        RAG_COLORS[s]
      )}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3"} />
      {RAG_LABELS[s]}
    </span>
  );
}
