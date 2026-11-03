"use client";

import { useRef, useState } from "react";
import { RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { replaceQuestions, setQuestionText } from "@/lib/actions";
import { MAX_QUESTION_LENGTH, type QuestionSet } from "@/lib/constants";
import { AutosaveInput } from "@/components/autosave-text-field";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Plenty for a list of questions; anything bigger is almost certainly the
// wrong file.
const MAX_IMPORT_BYTES = 200_000;

export function QuestionTextInput({
  set,
  id,
  text,
}: {
  set: QuestionSet;
  id: string;
  text: string;
}) {
  return (
    <AutosaveInput
      value={text}
      onSave={(next) => setQuestionText(set, id, next)}
      aria-label="Question"
      maxLength={MAX_QUESTION_LENGTH}
      className="h-8 flex-1 min-w-48 text-sm"
    />
  );
}

/**
 * The whole question set as plain text, one question per line — for
 * pasting a list, loading one from a .txt / .csv file, or going back to
 * the defaults. Nothing is saved until "Replace questions" (see
 * replaceQuestions for how existing answers are kept).
 */
export function QuestionImport({
  set,
  current,
  defaults,
}: {
  set: QuestionSet;
  current: string[];
  defaults: readonly string[];
}) {
  const joined = current.join("\n");
  const [text, setText] = useState(joined);
  const [prevJoined, setPrevJoined] = useState(joined);
  const fileRef = useRef<HTMLInputElement>(null);

  if (joined !== prevJoined) {
    setPrevJoined(joined);
    setText(joined);
  }

  return (
    <ActionForm action={replaceQuestions} className="space-y-2" successMessage="">
      <input type="hidden" name="set" value={set} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`${set}-question-list`} className="text-sm font-medium">
          Edit as a list
        </label>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Load file
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setText(defaults.join("\n"))}
          >
            <RotateCcw className="size-3.5" />
            Load defaults
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.csv,.md,text/plain,text/csv,text/markdown"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // so picking the same file again still fires
            if (!file) return;
            if (file.size > MAX_IMPORT_BYTES) {
              toast.error("That file is too big for a question list.");
              return;
            }
            setText(await file.text());
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        One question per line — paste a list or load a .txt / .csv file
        (numbering and bullets are stripped). Nothing changes until you
        click Replace questions.
      </p>
      <Textarea
        id={`${set}-question-list`}
        name="questions"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(Math.max(current.length, 4) + 1, 16)}
        className="font-mono text-xs md:text-xs"
      />
      <Button type="submit" size="sm">
        Replace questions
      </Button>
    </ActionForm>
  );
}
