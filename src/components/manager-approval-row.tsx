"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { AutosaveInput } from "@/components/autosave-text-field";
import { useAutosave } from "@/hooks/use-autosave";
import {
  toggleManagerApproval,
  setManagerApprovalComment,
} from "@/lib/actions";
import { formatDate } from "@/lib/period";

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
  const { isPending, save } = useAutosave();

  if (serverApproved !== prevServerApproved) {
    setPrevServerApproved(serverApproved);
    setApproved(serverApproved);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
      <label className="flex items-center gap-2 w-44 shrink-0 text-sm font-medium">
        <Checkbox
          checked={approved}
          disabled={isPending}
          onCheckedChange={(value) => {
            setApproved(value);
            save(() => toggleManagerApproval(id, code, value));
          }}
        />
        {managerName}
      </label>
      <AutosaveInput
        placeholder="Optional comment"
        value={comment ?? ""}
        className="flex-1 min-w-40"
        aria-label={`${managerName} approval comment`}
        onSave={(next) => setManagerApprovalComment(id, code, next)}
      />
      <span className="text-xs text-muted-foreground w-32 shrink-0">
        {approvedAt ? formatDate(approvedAt) : "Not approved"}
      </span>
    </div>
  );
}
