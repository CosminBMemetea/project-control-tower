"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions";

// Drop-in replacement for <form action={fn}> when fn can return
// { error: string } — surfaces it as a toast instead of the submit
// silently doing nothing when a required field was left empty.
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    (_prevState, formData) => action(formData),
    undefined
  );

  useEffect(() => {
    if (state && "error" in state) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
