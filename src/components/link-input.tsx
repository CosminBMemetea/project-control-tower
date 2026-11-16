"use client";

import { setProjectLink } from "@/lib/actions";
import type { PROJECT_LINK_FIELDS } from "@/lib/constants";
import { AutosaveInput } from "@/components/autosave-text-field";

// Auto-saves on blur + debounced change — one independent save per link
// field, no shared "Save Links" button.
export function LinkInput({
  projectId,
  code,
  field,
  value,
  id,
  placeholder,
}: {
  projectId: string;
  code: string;
  field: (typeof PROJECT_LINK_FIELDS)[number]["field"];
  value: string;
  id?: string;
  placeholder?: string;
}) {
  return (
    <AutosaveInput
      id={id}
      placeholder={placeholder}
      value={value}
      onSave={(next) => setProjectLink(projectId, code, field, next)}
    />
  );
}
