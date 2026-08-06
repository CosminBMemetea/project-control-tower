import { prisma } from "@/lib/prisma";
import {
  addTemplateSection,
  updateTemplateSection,
  deleteTemplateSection,
  moveTemplateSection,
} from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ControlledInput } from "@/components/controlled-input";
import { ControlledCheckbox } from "@/components/controlled-checkbox";
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
          reports too.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No sections defined yet — add one below.
            </p>
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
                  >
                    ↑
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
                  >
                    ↓
                  </Button>
                </form>
              </div>

              <form
                action={updateTemplateSection}
                className="flex flex-1 flex-wrap items-center gap-3"
              >
                <input type="hidden" name="id" value={section.id} />
                <ControlledInput
                  name="label"
                  defaultValue={section.label}
                  className="flex-1 min-w-48"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <ControlledCheckbox name="hasLinks" checked={section.hasLinks} />
                  Supports links
                </label>
                <Button type="submit" size="sm" variant="outline">
                  Save
                </Button>
              </form>

              <form action={deleteTemplateSection}>
                <input type="hidden" name="id" value={section.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Remove
                </Button>
              </form>
            </div>
          ))}

          <form
            action={addTemplateSection}
            className="flex flex-wrap items-center gap-3 pt-2 border-t"
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
              Add Section
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
