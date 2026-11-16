"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ link }: { link: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          toast.success("Link copied.");
        } catch {
          toast.error("Couldn't copy — copy it manually instead.");
        }
      }}
    >
      <Copy className="size-3.5" />
      Copy link
    </Button>
  );
}
