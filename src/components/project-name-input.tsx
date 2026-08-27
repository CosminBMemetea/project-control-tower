"use client";

import { setProjectName } from "@/lib/actions";
import { AutosaveInput } from "@/components/autosave-text-field";

// Renames the project in place from the project header — looks like a
// plain <h1> until focused. `code` (the stable identifier used in URLs)
// is never affected by this, only the display name.
export function ProjectNameInput({
  projectId,
  code,
  name,
}: {
  projectId: string;
  code: string;
  name: string;
}) {
  return (
    <AutosaveInput
      value={name}
      onSave={(next) => setProjectName(projectId, code, next)}
      aria-label="Project name"
      className="h-auto w-auto min-w-40 border-transparent bg-transparent px-1 -mx-1 py-0 text-2xl font-semibold tracking-tight shadow-none hover:border-input focus-visible:bg-background"
    />
  );
}
