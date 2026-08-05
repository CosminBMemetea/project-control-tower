"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Server-rendered pages re-submit the current DB value as a prop on every
 * revalidation, which Base UI's Checkbox flags as "changing the default
 * checked state of an uncontrolled Checkbox after being initialized."
 * This wraps it as a controlled component (checked + onCheckedChange) and
 * re-syncs local state when the server value changes underneath it.
 */
export function ControlledCheckbox({
  name,
  checked: serverChecked,
}: {
  name: string;
  checked: boolean;
}) {
  const [checked, setChecked] = useState(serverChecked);

  useEffect(() => {
    setChecked(serverChecked);
  }, [serverChecked]);

  return (
    <Checkbox
      name={name}
      checked={checked}
      onCheckedChange={(value) => setChecked(value)}
    />
  );
}
