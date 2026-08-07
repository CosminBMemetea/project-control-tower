import type { LucideIcon } from "lucide-react";

// Consistent "nothing here yet" block for a first-run/empty deployment —
// used wherever a list could plausibly be genuinely empty (no projects
// configured yet, no risks logged yet, ...), so the app never looks
// broken or unfinished when there's simply no data yet.
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon className="size-8 text-muted-foreground/40" strokeWidth={1.5} />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
    </div>
  );
}
