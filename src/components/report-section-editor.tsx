"use client";

import {
  setReportMetaField,
  setReportSectionField,
} from "@/lib/actions";
import { REPORT_TYPES, REPORT_TYPE_LABELS } from "@/lib/constants";
import { useAutosave } from "@/hooks/use-autosave";
import {
  AutosaveInput,
  AutosaveTextarea,
} from "@/components/autosave-text-field";
import { SafeLink } from "@/components/safe-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

function parseLinks(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ReportMetaEditor({
  reportId,
  code,
  type: serverType,
  reportDate,
  title,
}: {
  reportId: string;
  code: string;
  type: string;
  reportDate: string;
  title: string | null;
}) {
  const [type, setType] = useState(serverType);
  const [prevType, setPrevType] = useState(serverType);
  const { isPending, save } = useAutosave();

  if (serverType !== prevType) {
    setPrevType(serverType);
    setType(serverType);
  }

  function saveMeta(field: "type" | "reportDate" | "title", value: string) {
    return setReportMetaField(reportId, code, field, value);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1.5">
        <label className="text-xs text-muted-foreground">Type</label>
        <select
          aria-label="Report type"
          value={type}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.value;
            setType(next);
            save(() => saveMeta("type", next));
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs disabled:opacity-50"
        >
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {REPORT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <label className="text-xs text-muted-foreground">Date</label>
        <AutosaveInput
          type="date"
          value={reportDate}
          className="w-40"
          aria-label="Report date"
          onSave={(next) => saveMeta("reportDate", next)}
        />
      </div>
      <div className="grid gap-1.5 flex-1 min-w-48">
        <label className="text-xs text-muted-foreground">
          Title (optional)
        </label>
        <AutosaveInput
          value={title ?? ""}
          aria-label="Report title"
          onSave={(next) => saveMeta("title", next)}
        />
      </div>
    </div>
  );
}

export function ReportSectionCard({
  reportId,
  code,
  sectionId,
  label,
  hasLinks,
  content,
  links,
}: {
  reportId: string;
  code: string;
  sectionId: string;
  label: string;
  hasLinks: boolean;
  content: string | null;
  links: string | null;
}) {
  const existingLinks = parseLinks(links);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AutosaveTextarea
          value={content ?? ""}
          rows={4}
          placeholder={`Write ${label.toLowerCase()}...`}
          aria-label={label}
          onSave={(next) =>
            setReportSectionField(reportId, code, sectionId, "content", next)
          }
        />
        {hasLinks && (
          <div className="space-y-2">
            {existingLinks.length > 0 && (
              <ul className="space-y-1">
                {existingLinks.map((url, i) => (
                  <li key={i}>
                    <SafeLink
                      href={url}
                      className="text-xs text-primary underline"
                    >
                      {url}
                    </SafeLink>
                  </li>
                ))}
              </ul>
            )}
            <AutosaveTextarea
              value={links ?? ""}
              rows={3}
              placeholder="One link per line, e.g. https://tracker.example/item/1234"
              className="text-xs"
              aria-label={`${label} links`}
              onSave={(next) =>
                setReportSectionField(reportId, code, sectionId, "links", next)
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
