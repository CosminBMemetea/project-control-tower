"use client";

import { renameApprover } from "@/lib/actions";
import { AutosaveInput } from "@/components/autosave-text-field";

// Renames an approver in place on the Approvals page — their sign-off
// rows on every project follow the new name (see renameApprover).
export function ApproverNameInput({ id, name }: { id: string; name: string }) {
  return (
    <AutosaveInput
      value={name}
      onSave={(next) => renameApprover(id, next)}
      aria-label="Approver name"
      className="h-8 w-56"
    />
  );
}
