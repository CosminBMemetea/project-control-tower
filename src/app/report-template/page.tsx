import { ArrowUp, ArrowDown, Trash2, Plus, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  addTemplateSection,
  deleteTemplateSection,
  moveTemplateSection,
} from "@/lib/actions";
import { EmptyState } from "@/components/empty-state";
import { TemplateSectionRow } from "@/components/template-section-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ControlledInput } from "@/components/controlled-input";
import { ControlledCheckbox } from "@/components/controlled-checkbox";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";

export default async function ReportTemplatePage() {
  const sections = await prisma.reportTemplateSection.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Report Template
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          These sections apply to every report, on every project. Add,
          rename, reorder, or remove sections here — no code changes
          needed. Removing a section deletes its content from all existing
          reports too. Edits save automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sections.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No sections defined yet"
              description="Add one below."
            />
          )}
          {sections.map((section, i) => (
            <div
              key={section.id}
              className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex flex-col gap-0.5">
                <form action={moveTemplateSection}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="direction" value="up" />
                  <Button
                    type="submit"
                    size="icon-xs"
                    variant="ghost"
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp />
                  </Button>
                </form>
                <form action={moveTemplateSection}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="direction" value="down" />
                  <Button
                    type="submit"
                    size="icon-xs"
                    variant="ghost"
                    disabled={i === sections.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </Button>
                </form>
              </div>

              <TemplateSectionRow
                id={section.id}
                label={section.label}
                hasLinks={section.hasLinks}
              />

              <form action={deleteTemplateSection}>
                <input type="hidden" name="id" value={section.id} />
                <Button type="submit" size="sm" variant="ghost">
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              </form>
            </div>
          ))}

          <ActionForm
            action={addTemplateSection}
            className="flex flex-wrap items-center gap-3 pt-2 border-t"
            successMessage="Section added"
          >
            <ControlledInput
              name="label"
              placeholder="New section name"
              defaultValue=""
              className="flex-1 min-w-48"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <ControlledCheckbox name="hasLinks" checked={false} />
              Supports links
            </label>
            <Button type="submit" size="sm">
              <Plus className="size-3.5" />
              Add Section
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
