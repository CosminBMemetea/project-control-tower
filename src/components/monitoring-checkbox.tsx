"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { setMonitoringCheck } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";

export function MonitoringCheckbox({
  projectId,
  code,
  questionId,
  checked: serverChecked,
}: {
  projectId: string;
  code: string;
  questionId: string;
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
        save(() => setMonitoringCheck(projectId, code, questionId, value));
      }}
    />
  );
}
