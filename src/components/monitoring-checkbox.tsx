"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { setMonitoringCheck } from "@/lib/actions";

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
  const [isPending, startTransition] = useTransition();

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
        startTransition(async () => {
          await setMonitoringCheck(projectId, code, questionId, value);
        });
      }}
    />
  );
}
