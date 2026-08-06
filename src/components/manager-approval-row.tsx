"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ControlledInput } from "@/components/controlled-input";
import { Button } from "@/components/ui/button";
import {
  toggleManagerApproval,
  updateManagerApprovalComment,
} from "@/lib/actions";

export function ManagerApprovalRow({
  id,
  code,
  managerName,
  approved: serverApproved,
  approvedAt,
  comment,
}: {
  id: string;
  code: string;
  managerName: string;
  approved: boolean;
  approvedAt: Date | null;
  comment: string | null;
}) {
  const [approved, setApproved] = useState(serverApproved);
  const [prevServerApproved, setPrevServerApproved] = useState(serverApproved);
  const [isPending, startTransition] = useTransition();

  if (serverApproved !== prevServerApproved) {
    setPrevServerApproved(serverApproved);
    setApproved(serverApproved);
  }

  return (
    <form
      action={updateManagerApprovalComment}
      className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="code" value={code} />
      <label className="flex items-center gap-2 w-44 shrink-0 text-sm font-medium">
        <Checkbox
          checked={approved}
          disabled={isPending}
          onCheckedChange={(value) => {
            setApproved(value);
            startTransition(async () => {
              await toggleManagerApproval(id, code, value);
            });
          }}
        />
        {managerName}
      </label>
      <ControlledInput
        name="comment"
        placeholder="Optional comment"
        defaultValue={comment ?? ""}
        className="flex-1 min-w-40"
      />
      <span className="text-xs text-muted-foreground w-32 shrink-0">
        {approvedAt ? new Date(approvedAt).toLocaleDateString() : "Not approved"}
      </span>
      <Button type="submit" size="sm" variant="outline">
        Save Comment
      </Button>
    </form>
  );
}
