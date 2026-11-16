"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { setStructureHierarchyField } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";
import type { STRUCTURE_HIERARCHY_ITEMS } from "@/lib/constants";

export function StructureHierarchyCheckbox({
  projectId,
  code,
  field,
  checked: serverChecked,
}: {
  projectId: string;
  code: string;
  field: (typeof STRUCTURE_HIERARCHY_ITEMS)[number]["field"];
  checked: boolean;
}) {
  const [checked, setChecked] = useState(serverChecked);
  const [prevServerChecked, setPrevServerChecked] = useState(serverChecked);
  const { isPending, save } = useAutosave();

  if (serverChecked !== prevServerChecked) {
    setPrevServerChecked(serverChecked);
    setChecked(serverChecked);
  }

  return (
    <Checkbox
      checked={checked}
      disabled={isPending}
      onCheckedChange={(value) => {
        setChecked(value);
        save(() => setStructureHierarchyField(projectId, code, field, value));
      }}
    />
  );
}
