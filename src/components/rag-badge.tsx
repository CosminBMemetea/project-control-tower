import { cn } from "@/lib/utils";
import { RAG_COLORS, RAG_LABELS, type RagStatus } from "@/lib/constants";

export function RagBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: "sm" | "lg";
}) {
  const s = (status in RAG_LABELS ? status : "GREEN") as RagStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold",
        size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs",
        RAG_COLORS[s]
      )}
    >
      {RAG_LABELS[s]}
    </span>
  );
}
