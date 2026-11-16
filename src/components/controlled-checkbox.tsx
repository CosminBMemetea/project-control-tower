"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Server-rendered pages re-submit the current DB value as a prop on every
 * revalidation, which Base UI's Checkbox flags as "changing the default
 * checked state of an uncontrolled Checkbox after being initialized."
 * This wraps it as a controlled component (checked + onCheckedChange).
 * Re-syncing when `checked` changes is done during render (React's
 * recommended pattern for deriving state from props) rather than in an
 * effect, so it can't lag a render behind.
 */
export function ControlledCheckbox({
  name,
  checked: serverChecked,
}: {
  name: string;
  checked: boolean;
}) {
  const [checked, setChecked] = useState(serverChecked);
  const [prevServerChecked, setPrevServerChecked] = useState(serverChecked);

  if (serverChecked !== prevServerChecked) {
    setPrevServerChecked(serverChecked);
    setChecked(serverChecked);
  }

  return (
    <Checkbox
      name={name}
      checked={checked}
      onCheckedChange={(value) => setChecked(value)}
    />
  );
}
