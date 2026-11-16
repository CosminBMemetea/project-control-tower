"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions";

// Drop-in replacement for <form action={fn}> when fn can return
// { error: string } or { info: string } — surfaces either as a toast.
// On a successful void return (typical create/update), shows "Saved".
export function ActionForm({
  action,
  children,
  className,
  successMessage = "Saved",
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  /** Toast on successful void result. Pass "" to suppress. */
  successMessage?: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    (_prevState, formData) => action(formData),
    undefined
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      if (state && typeof state === "object" && "error" in state) {
        toast.error(state.error);
      } else if (state && typeof state === "object" && "info" in state) {
        toast.info(state.info);
      } else if (successMessage) {
        toast.success(successMessage);
      }
    }
    wasPending.current = isPending;
  }, [isPending, state, successMessage]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
