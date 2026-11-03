"use client";

import { useRouter, usePathname } from "next/navigation";
import { setProjectCode, type ActionResult } from "@/lib/actions";
import { AutosaveInput } from "@/components/autosave-text-field";

// Renames the project's short code (ALPHA, DELTA, ...) from the project
// header. Every nested route is keyed on this code, so on a successful
// save this also swaps the browser to the new URL — same sub-path,
// new code — instead of leaving the user on a now-404ing page.
export function ProjectCodeInput({
  projectId,
  code,
}: {
  projectId: string;
  code: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSave(next: string): Promise<ActionResult> {
    const normalized = next.trim().toUpperCase();
    const result = await setProjectCode(projectId, code, normalized);
    if (result && "error" in result) return result;
    if (normalized !== code && pathname?.startsWith(`/projects/${code}`)) {
      router.replace(`/projects/${normalized}${pathname.slice(`/projects/${code}`.length)}`);
    }
    return result;
  }

  return (
    <AutosaveInput
      value={code}
      onSave={handleSave}
      aria-label="Project short code"
      maxLength={32}
      className="h-6 w-auto min-w-16 max-w-80 field-sizing-content border-transparent bg-transparent px-1 -mx-1 py-0 font-mono text-sm uppercase shadow-none hover:border-input focus-visible:bg-background"
    />
  );
}
