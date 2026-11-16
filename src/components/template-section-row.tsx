"use client";

import { useState } from "react";
import { setTemplateSectionField } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveInput } from "@/components/autosave-text-field";
import { Checkbox } from "@/components/ui/checkbox";

/** Autosaved label + hasLinks controls for one report template section. */
export function TemplateSectionRow({
  id,
  label,
  hasLinks: serverHasLinks,
}: {
  id: string;
  label: string;
  hasLinks: boolean;
}) {
  const [hasLinks, setHasLinks] = useState(serverHasLinks);
  const [prevHasLinks, setPrevHasLinks] = useState(serverHasLinks);
  const { isPending, save } = useAutosave();

  if (serverHasLinks !== prevHasLinks) {
    setPrevHasLinks(serverHasLinks);
    setHasLinks(serverHasLinks);
  }

  return (
    <div className="flex flex-1 flex-wrap items-center gap-3">
      <AutosaveInput
        value={label}
        className="flex-1 min-w-48"
        aria-label="Section name"
        onSave={(next) => setTemplateSectionField(id, "label", next)}
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <Checkbox
          checked={hasLinks}
          disabled={isPending}
          onCheckedChange={(value) => {
            setHasLinks(value);
            save(() => setTemplateSectionField(id, "hasLinks", value));
          }}
        />
        Supports links
      </label>
    </div>
  );
}
