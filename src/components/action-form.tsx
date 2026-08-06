"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions";

// Drop-in replacement for <form action={fn}> when fn can return
// { error: string } or { info: string } — surfaces either as a toast
// instead of the submit silently doing nothing or leaving the user
// unsure whether something like an email actually went out.
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
    if (!state) return;
    if ("error" in state) toast.error(state.error);
    else if ("info" in state) toast.info(state.info);
  }, [state]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
