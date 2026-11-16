"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * Same problem as ControlledCheckbox: Base UI's Input warns
 * ("changing the default value state of an uncontrolled FieldControl")
 * whenever a mounted Input's `defaultValue` prop changes after a server
 * action revalidates the page. This makes it a real controlled input,
 * re-syncing from the server-provided value during render (not in an
 * effect) whenever it changes.
 */
export function ControlledInput({
  defaultValue,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue ?? "");

  if ((defaultValue ?? "") !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue ?? "");
    setValue(defaultValue ?? "");
  }

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
