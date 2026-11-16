"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * A destructive form action behind a confirm dialog — for deletes that
 * take more than one row with them (a whole project, an approver's
 * sign-offs on every project). `fields` become the form's hidden inputs.
 */
export function ConfirmActionButton({
  action,
  fields,
  triggerLabel,
  title,
  description,
  confirmLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  triggerLabel: string;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-3.5" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={action}>
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" variant="destructive">
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
