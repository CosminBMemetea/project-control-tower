import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { addQuestion, moveQuestion, removeQuestion } from "@/lib/actions";
import type { QuestionSet } from "@/lib/constants";
import { QuestionImport, QuestionTextInput } from "@/components/question-set-fields";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NOTES: Record<QuestionSet, string> = {
  checklist:
    "Shared by every project, including checklist links already sent. Removing a question keeps the answers already given to it.",
  monitoring:
    "Shared by every project. Removing a question clears its checkbox on every project.",
};

// Collapsed editor for one shared question set, shown under the questions
// on a project's Checklist / Monitoring tab. Opens by itself when the set
// is empty, since there's nothing else to do then.
export function QuestionSetEditor({
  set,
  questions,
  defaults,
}: {
  set: QuestionSet;
  questions: { id: string; text: string }[];
  defaults: readonly string[];
}) {
  return (
    <details open={questions.length === 0} className="rounded-lg border px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium">
        Edit questions{" "}
        <span className="font-normal text-muted-foreground">
          — shared by every project
        </span>
      </summary>

      <div className="mt-4 space-y-5">
        <p className="text-xs text-muted-foreground">{NOTES[set]}</p>

        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <form action={moveQuestion}>
                  <input type="hidden" name="set" value={set} />
                  <input type="hidden" name="id" value={q.id} />
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
                <form action={moveQuestion}>
                  <input type="hidden" name="set" value={set} />
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="direction" value="down" />
                  <Button
                    type="submit"
                    size="icon-xs"
                    variant="ghost"
                    disabled={i === questions.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </Button>
                </form>
              </div>
              <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {i + 1}.
              </span>
              <QuestionTextInput set={set} id={q.id} text={q.text} />
              <form action={removeQuestion}>
                <input type="hidden" name="set" value={set} />
                <input type="hidden" name="id" value={q.id} />
                <Button
                  type="submit"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Remove question"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </form>
            </div>
          ))}
        </div>

        <ActionForm
          action={addQuestion}
          className="flex flex-wrap items-center gap-2"
          successMessage="Question added"
        >
          <input type="hidden" name="set" value={set} />
          <Input name="text" placeholder="New question" className="h-8 flex-1 min-w-48" />
          <Button type="submit" size="sm">
            <Plus className="size-3.5" />
            Add Question
          </Button>
        </ActionForm>

        <div className="border-t pt-4">
          <QuestionImport
            set={set}
            current={questions.map((q) => q.text)}
            defaults={defaults}
          />
        </div>
      </div>
    </details>
  );
}
