"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, getAppBaseUrl } from "@/lib/email";
import {
  CHECKLIST_QUESTIONS,
  PROJECT_LINK_FIELDS,
  STRUCTURE_HIERARCHY_ITEMS,
  MAX_ALLOCATED_FTE,
  RAG_STATUSES,
  RISK_LEVELS,
  RISK_STATUSES,
  HEALTH_DIMENSIONS,
  HEALTH_SCORES,
  HEALTH_DEFAULT_SCORE,
  GOAL_TYPES,
  GOAL_LEVELS,
  REPORT_TYPES,
  type GoalType,
  type RagStatus,
  type RiskLevel,
  type RiskStatus,
  type HealthDimension,
} from "@/lib/constants";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// Returned by actions whose only real failure mode is "a required field
// was left empty" — ActionForm surfaces this.error as a toast instead of
// the submit silently doing nothing. `info` is for a non-error outcome
// still worth telling the user about (e.g. "email wasn't actually sent,
// no SMTP configured — here's the link instead").
export type ActionResult = { error: string } | { info: string } | void;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const QUARTER_RE = /^\d{4}-Q[1-4]$/;

function isRiskLevel(v: string): v is RiskLevel {
  return (RISK_LEVELS as readonly string[]).includes(v);
}
function isRiskStatus(v: string): v is RiskStatus {
  return (RISK_STATUSES as readonly string[]).includes(v);
}
function isHealthDimension(v: string): v is HealthDimension {
  return (HEALTH_DIMENSIONS as readonly string[]).includes(v);
}

function revalidateGlobal() {
  revalidatePath("/portfolio");
  revalidatePath("/portfolio/monthly-summary");
  revalidatePath("/projects");
  revalidatePath("/approvals");
}

function revalidateProject(code: string) {
  revalidateGlobal();
  revalidatePath(`/projects/${code}`, "layout");
}

// Template changes affect every project's reporting tab, not just one —
// the bracketed pattern revalidates every route matching that dynamic
// segment without needing to know all project codes up front.
function revalidateAllProjectReportingTabs() {
  revalidateGlobal();
  revalidatePath("/projects/[code]", "layout");
}

// CUSTOM is the only recurrence type that carries free text — anything
// else ignores whatever is in the label field, so a stale custom label
// can never resurface after switching to a preset.
function recurrenceData(formData: FormData) {
  const recurrenceType = str(formData, "recurrenceType");
  const recurrenceLabel = str(formData, "recurrenceLabel");
  return {
    recurrenceType: recurrenceType || null,
    recurrenceLabel: recurrenceType === "CUSTOM" ? recurrenceLabel || null : null,
  };
}

// Report dates are interpreted as UTC midnight so the stored date always
// matches the calendar day picked in the date input, regardless of
// server timezone.
function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

// Auto-saved on blur / debounced change from the project name field in
// the project header. Only `name` (display label) changes — `code` (the
// stable identifier used in URLs, links, and revalidation paths) is
// never touched by a rename.
export async function setProjectName(
  projectId: string,
  code: string,
  name: string
): Promise<ActionResult> {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Project name can't be empty." };
  await prisma.project.update({
    where: { id: projectId },
    data: { name: trimmed },
  });
  revalidateProject(code);
}

// Auto-saved on blur from LinkInput, one field at a time (replaces the
// old combined "Save Links" button) — each link is its own independent
// save, same reasoning as setStructureHierarchyField, so there's no
// shared submit step where forgetting to click one button loses every
// link's edits, and no risk of one field's save ever touching another's.
export async function setProjectLink(
  projectId: string,
  code: string,
  field: (typeof PROJECT_LINK_FIELDS)[number]["field"],
  value: string
) {
  await requireAuth();
  await prisma.project.update({
    where: { id: projectId },
    data: { [field]: value.trim() || null },
  });
  revalidateProject(code);
}

// Auto-saved from a single checkbox toggle — each Structure Hierarchy
// item persists independently so toggling one item never discards an
// unsaved toggle on a sibling item elsewhere on the page.
export async function setStructureHierarchyField(
  projectId: string,
  code: string,
  field: (typeof STRUCTURE_HIERARCHY_ITEMS)[number]["field"],
  value: boolean
) {
  await requireAuth();
  await prisma.project.update({
    where: { id: projectId },
    data: { [field]: value },
  });
  revalidateProject(code);
}

// Auto-saved from the approval checkbox itself, independent of the
// comment field below — same reasoning as setStructureHierarchyField.
export async function toggleManagerApproval(
  id: string,
  code: string,
  approved: boolean
) {
  await requireAuth();
  await prisma.managerApproval.update({
    where: { id },
    data: { approved, approvedAt: approved ? new Date() : null },
  });
  revalidateProject(code);
}

// Auto-saved on blur / debounced change from ManagerApprovalRow — independent
// of the approval checkbox so a comment edit never races a toggle.
export async function setManagerApprovalComment(
  id: string,
  code: string,
  comment: string
) {
  await requireAuth();
  await prisma.managerApproval.update({
    where: { id },
    data: { comment: comment.trim() || null },
  });
  revalidateProject(code);
}

// Auto-saved the moment the level dropdown changes — used from both the
// Portfolio Overview grid and the per-project goal tabs, so the "current
// coverage level" is always a single explicit choice from GOAL_LEVELS,
// never derived from anything else.
export async function setGoalLevel(
  projectId: string,
  code: string,
  goalType: GoalType,
  level: number
) {
  await requireAuth();
  // Same RPC-hardening reasoning as setHealthScore: an invalid goalType is
  // a no-op (no safe substitute goal to fall back to), but an out-of-range
  // level falls back to 0 since it's the same field being set either way.
  if (!(GOAL_TYPES as readonly string[]).includes(goalType)) return;
  const safeLevel = (GOAL_LEVELS as readonly number[]).includes(level) ? level : 0;
  await prisma.goalProgress.upsert({
    where: { projectId_goalType: { projectId, goalType } },
    update: { level: safeLevel },
    create: { projectId, goalType, level: safeLevel },
  });
  revalidateProject(code);
}

// Kept independent of setGoalLevel so editing the evidence link can never
// clobber a level someone just set elsewhere on the same page. Auto-saved
// on blur / debounced change from GoalProgressForm.
export async function setGoalEvidenceUrl(
  projectId: string,
  code: string,
  goalType: GoalType,
  evidenceUrl: string
) {
  await requireAuth();
  if (!(GOAL_TYPES as readonly string[]).includes(goalType)) return;
  const url = evidenceUrl.trim() || null;

  await prisma.goalProgress.upsert({
    where: { projectId_goalType: { projectId, goalType } },
    update: { evidenceUrl: url },
    create: { projectId, goalType, level: 0, evidenceUrl: url },
  });
  revalidateProject(code);
}

export async function addQuarterPresentation(
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  // Uppercased so "2026-q1" and "2026-Q1" land on the same row instead of
  // silently creating a duplicate that never matches currentQuarter()'s
  // exact casing (which would show as "missing" on the Portfolio Overview
  // even though a presentation is actually on file).
  const quarter = str(formData, "quarter").toUpperCase();
  const url = str(formData, "url");
  if (!quarter || !url) return { error: "Quarter and URL are both required." };
  if (!QUARTER_RE.test(quarter)) {
    return { error: "Quarter must look like 2026-Q1." };
  }

  await prisma.quarterPresentation.upsert({
    where: { projectId_quarter: { projectId, quarter } },
    update: { url },
    create: { projectId, quarter, url },
  });
  revalidateProject(code);
}

export async function deleteQuarterPresentation(formData: FormData) {
  await requireAuth();
  const id = str(formData, "id");
  const code = str(formData, "code");
  await prisma.quarterPresentation.delete({ where: { id } });
  revalidateProject(code);
}

export async function addTeamsMeeting(
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const label = str(formData, "label");
  const url = str(formData, "url");
  const dayOfWeek = str(formData, "dayOfWeek");
  const time = str(formData, "time");
  if (!type || !url) return { error: "A meeting link is required." };

  await prisma.teamsMeeting.create({
    data: {
      projectId,
      type,
      label: label || null,
      url,
      dayOfWeek: dayOfWeek || null,
      time: time || null,
      ...recurrenceData(formData),
    },
  });
  revalidateProject(code);
}

// Add or edit one of the 3 fixed core meeting slots (Weekly/Sprint
// Review/Retro) for a project — at most one row per (project, type), so
// this finds the existing row and updates it, or creates it if the slot
// is currently "Missing".
export async function upsertCoreMeeting(
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const url = str(formData, "url");
  const dayOfWeek = str(formData, "dayOfWeek");
  const time = str(formData, "time");
  if (!type || !url) return { error: "A meeting link is required." };

  const existing = await prisma.teamsMeeting.findFirst({
    where: { projectId, type },
  });

  const data = {
    url,
    dayOfWeek: dayOfWeek || null,
    time: time || null,
    ...recurrenceData(formData),
  };

  if (existing) {
    await prisma.teamsMeeting.update({ where: { id: existing.id }, data });
  } else {
    await prisma.teamsMeeting.create({ data: { projectId, type, ...data } });
  }
  revalidateProject(code);
}

// Per-field autosave for an existing meeting — url/day/time each write
// independently. Deliberately doesn't touch recurrence: that's owned
// solely by setMeetingRecurrence's quick control.
export async function setTeamsMeetingField(
  id: string,
  code: string,
  field: "url" | "dayOfWeek" | "time",
  value: string
): Promise<ActionResult> {
  await requireAuth();
  const trimmed = value.trim();

  if (field === "url") {
    if (!trimmed) return { error: "A meeting link is required." };
    await prisma.teamsMeeting.update({
      where: { id },
      data: { url: trimmed },
    });
    revalidateProject(code);
    return;
  }

  await prisma.teamsMeeting.update({
    where: { id },
    data: { [field]: trimmed || null },
  });
  revalidateProject(code);
}

// Auto-saved the moment the recurrence dropdown changes, from the
// Meeting Map's compact recurrence control — independent of the
// url/day/time edit form so it can be set retroactively in one click
// without opening the full edit panel.
export async function setMeetingRecurrence(
  id: string,
  code: string,
  recurrenceType: string,
  recurrenceLabel: string
) {
  await requireAuth();
  await prisma.teamsMeeting.update({
    where: { id },
    data: {
      recurrenceType: recurrenceType || null,
      recurrenceLabel: recurrenceType === "CUSTOM" ? recurrenceLabel || null : null,
    },
  });
  revalidateProject(code);
}

export async function markMeetingOccurred(formData: FormData) {
  await requireAuth();
  const id = str(formData, "id");
  const code = str(formData, "code");
  await prisma.teamsMeeting.update({
    where: { id },
    data: { lastOccurredAt: new Date() },
  });
  revalidateProject(code);
}

export async function deleteTeamsMeeting(formData: FormData) {
  await requireAuth();
  const id = str(formData, "id");
  const code = str(formData, "code");
  await prisma.teamsMeeting.delete({ where: { id } });
  revalidateProject(code);
}

// Creates the submission and its response link. If SMTP is configured
// (optional — see .env), also emails it automatically; otherwise the
// Submission History row's "Copy link" / "Email" (mailto:) buttons are
// the primary way to get it to the recipient, no configuration needed.
export async function sendChecklist(formData: FormData): Promise<ActionResult> {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const recipientEmail = str(formData, "recipientEmail");
  if (!recipientEmail) return { error: "An email address is required." };
  if (!EMAIL_RE.test(recipientEmail)) {
    return { error: "That doesn't look like a valid email address." };
  }

  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const token = randomBytes(24).toString("hex");

  await prisma.checklistSubmission.create({
    data: { projectId, recipientEmail, token },
  });

  revalidateProject(code);

  if (!process.env.SMTP_HOST) {
    return {
      info: "Checklist created — use Copy link or Email below to send it.",
    };
  }

  const link = `${await getAppBaseUrl()}/checklist-response/${token}`;
  const result = await sendEmail({
    to: recipientEmail,
    subject: `Reporting Checklist — ${project.name}`,
    html: `
      <p>You've been asked to complete the Reporting Checklist for <strong>${project.name}</strong>.</p>
      <p><a href="${link}">${link}</a></p>
      <p>It covers ${CHECKLIST_QUESTIONS.length} short questions on status, risks, and dependencies — should take a few minutes.</p>
    `,
  });

  if (result.sent) {
    return { info: `Emailed to ${recipientEmail}.` };
  }
  return {
    info: `Checklist created, but the automatic email failed (${result.reason}). Use Copy link or Email below instead.`,
  };
}

// Public: answered via the tokenized link, no project/session context
// available, so the submission's own project relation is used for
// revalidation.
export async function submitChecklistResponse(
  formData: FormData
): Promise<ActionResult> {
  const token = str(formData, "token");
  const questionIds = formData.getAll("questionId").map(String);

  const submission = await prisma.checklistSubmission.findUnique({
    where: { token },
    include: { project: true },
  });
  if (!submission) return { error: "This checklist link is no longer valid." };

  await Promise.all(
    questionIds.map((questionId) =>
      prisma.checklistAnswer.upsert({
        where: {
          submissionId_questionId: { submissionId: submission.id, questionId },
        },
        update: { answer: str(formData, `answer_${questionId}`) || null },
        create: {
          submissionId: submission.id,
          questionId,
          answer: str(formData, `answer_${questionId}`) || null,
        },
      })
    )
  );

  await prisma.checklistSubmission.update({
    where: { id: submission.id },
    data: { submittedAt: new Date() },
  });

  revalidateProject(submission.project.code);
  revalidatePath(`/checklist-response/${token}`);
  return { info: "Response recorded — thank you." };
}

// Auto-saved from a single Monitoring checkbox — same independent-field
// reasoning as setStructureHierarchyField.
export async function setMonitoringCheck(
  projectId: string,
  code: string,
  questionId: string,
  checked: boolean
) {
  await requireAuth();
  await prisma.monitoringResponse.upsert({
    where: { projectId_questionId: { projectId, questionId } },
    update: { checked },
    create: { projectId, questionId, checked },
  });
  revalidateProject(code);
}

// Creates the report row, then redirects straight to its edit page so
// the sections can be filled in. Doesn't pre-create ReportSectionEntry
// rows — the edit page renders one field per *current* template section
// regardless, and setReportSectionField upserts as the user types.
export async function createReport(
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const reportDateStr = str(formData, "reportDate");
  const title = str(formData, "title");
  if (!type || !reportDateStr)
    return { error: "Type and date are both required." };
  if (!(REPORT_TYPES as readonly string[]).includes(type)) {
    return { error: "Invalid report type." };
  }
  if (!DATE_RE.test(reportDateStr)) {
    return { error: "Report date must be a valid date." };
  }

  const report = await prisma.report.create({
    data: {
      projectId,
      type,
      reportDate: parseDateInput(reportDateStr),
      title: title || null,
    },
  });
  revalidateProject(code);
  redirect(`/projects/${code}/reporting/${report.id}`);
}

// Auto-saved per section field (content or links) from the report editor —
// each section writes independently so editing one section can never
// clobber an in-flight edit to another.
export async function setReportSectionField(
  reportId: string,
  code: string,
  sectionId: string,
  field: "content" | "links",
  value: string
) {
  await requireAuth();
  const cleaned = value.trim() || null;
  const existing = await prisma.reportSectionEntry.findUnique({
    where: { reportId_sectionId: { reportId, sectionId } },
  });

  if (existing) {
    await prisma.reportSectionEntry.update({
      where: { id: existing.id },
      data: { [field]: cleaned },
    });
  } else {
    await prisma.reportSectionEntry.create({
      data: {
        reportId,
        sectionId,
        content: field === "content" ? cleaned : null,
        links: field === "links" ? cleaned : null,
      },
    });
  }
  revalidateProject(code);
}

// Auto-saved on change for discrete meta fields (type) and on blur for
// free-text meta (title, date) from the report header editor.
export async function setReportMetaField(
  id: string,
  code: string,
  field: "type" | "reportDate" | "title",
  value: string
): Promise<ActionResult> {
  await requireAuth();
  const trimmed = value.trim();

  if (field === "type") {
    if (!(REPORT_TYPES as readonly string[]).includes(trimmed)) {
      return { error: "Invalid report type." };
    }
    await prisma.report.update({ where: { id }, data: { type: trimmed } });
    revalidateProject(code);
    return;
  }

  if (field === "reportDate") {
    if (!DATE_RE.test(trimmed)) {
      return { error: "Report date must be a valid date." };
    }
    await prisma.report.update({
      where: { id },
      data: { reportDate: parseDateInput(trimmed) },
    });
    revalidateProject(code);
    return;
  }

  await prisma.report.update({
    where: { id },
    data: { title: trimmed || null },
  });
  revalidateProject(code);
}

export async function deleteReport(formData: FormData) {
  await requireAuth();
  const id = str(formData, "id");
  const code = str(formData, "code");
  await prisma.report.delete({ where: { id } });
  revalidateProject(code);
  redirect(`/projects/${code}/reporting`);
}

// --- Report template management (Report Template settings page) ---

export async function addTemplateSection(
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();
  const label = str(formData, "label");
  const hasLinks = formData.get("hasLinks") === "on";
  if (!label) return { error: "Section name is required." };

  const last = await prisma.reportTemplateSection.findFirst({
    orderBy: { order: "desc" },
  });
  await prisma.reportTemplateSection.create({
    data: { label, hasLinks, order: (last?.order ?? 0) + 1 },
  });
  revalidatePath("/report-template");
  revalidateAllProjectReportingTabs();
}

// Per-field autosave for an existing template section (label on blur,
// hasLinks on toggle). Replaces the old combined "Save" form.
export async function setTemplateSectionField(
  id: string,
  field: "label" | "hasLinks",
  value: string | boolean
): Promise<ActionResult> {
  await requireAuth();

  if (field === "label") {
    const label = String(value).trim();
    if (!label) return { error: "Section name is required." };
    await prisma.reportTemplateSection.update({
      where: { id },
      data: { label },
    });
  } else {
    await prisma.reportTemplateSection.update({
      where: { id },
      data: { hasLinks: Boolean(value) },
    });
  }
  revalidatePath("/report-template");
  revalidateAllProjectReportingTabs();
}

export async function deleteTemplateSection(formData: FormData) {
  await requireAuth();
  const id = str(formData, "id");
  await prisma.reportTemplateSection.delete({ where: { id } });
  revalidatePath("/report-template");
  revalidateAllProjectReportingTabs();
}

export async function moveTemplateSection(formData: FormData) {
  await requireAuth();
  const id = str(formData, "id");
  const direction = str(formData, "direction"); // "up" | "down"

  const sections = await prisma.reportTemplateSection.findMany({
    orderBy: { order: "asc" },
  });
  const index = sections.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= sections.length) return;

  const a = sections[index];
  const b = sections[swapWith];
  // `order` is unique, so swapping directly (a -> b.order while b still
  // holds b.order) collides mid-transaction. Bounce through a value
  // outside the valid range first.
  await prisma.$transaction([
    prisma.reportTemplateSection.update({
      where: { id: a.id },
      data: { order: -1 },
    }),
    prisma.reportTemplateSection.update({
      where: { id: b.id },
      data: { order: a.order },
    }),
    prisma.reportTemplateSection.update({
      where: { id: a.id },
      data: { order: b.order },
    }),
  ]);
  revalidatePath("/report-template");
  revalidateAllProjectReportingTabs();
}

export async function addComplianceCheck(
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const description = str(formData, "description");
  const compliant = formData.get("compliant") === "on";
  const deviationNote = str(formData, "deviationNote");
  if (!description) return { error: "Description is required." };

  await prisma.complianceCheck.create({
    data: {
      projectId,
      description,
      compliant,
      deviationNote: deviationNote || null,
    },
  });
  revalidateProject(code);
}

// --- Resources (FTE) ---

// Auto-saved on blur from the FTE input. Stores the exact decimal the user
// typed (Float) — no rounding. Clamped server-side only for range safety
// (negative / over-ceiling / non-finite), never for precision.
export async function setAllocatedFte(
  projectId: string,
  code: string,
  value: number
) {
  await requireAuth();
  // Preserve full float precision — do not round. Only clamp to [0, max]
  // and reject non-finite values (NaN / Infinity from a crafted RPC).
  const safeValue = Number.isFinite(value)
    ? Math.min(Math.max(value, 0), MAX_ALLOCATED_FTE)
    : 0;
  await prisma.project.update({
    where: { id: projectId },
    data: { allocatedFte: safeValue },
  });
  revalidateProject(code);
}

// --- RAG status ---

// Auto-saved the moment the dropdown changes — independent of the
// comment field below so changing status can never get blocked on (or
// clobbered by) an in-progress comment edit. Falls back to GREEN rather
// than trusting the caller, for the same RPC-hardening reason as
// setAllocatedFte above.
export async function setRagStatus(
  projectId: string,
  code: string,
  status: string
) {
  await requireAuth();
  const safeStatus: RagStatus = (RAG_STATUSES as readonly string[]).includes(
    status
  )
    ? (status as RagStatus)
    : "GREEN";
  await prisma.project.update({
    where: { id: projectId },
    data: { ragStatus: safeStatus, ragUpdatedAt: new Date() },
  });
  revalidateProject(code);
}

// Auto-saved on blur / debounced change — independent of setRagStatus so
// typing a reason never races or blocks a status change.
export async function setRagComment(
  projectId: string,
  code: string,
  comment: string
) {
  await requireAuth();
  await prisma.project.update({
    where: { id: projectId },
    data: { ragComment: comment.trim() || null },
  });
  revalidateProject(code);
}

// --- Risk Register ---

export async function addRisk(formData: FormData): Promise<ActionResult> {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const title = str(formData, "title");
  const owner = str(formData, "owner");
  const impact = str(formData, "impact");
  const probability = str(formData, "probability");
  const identifiedAtStr = str(formData, "identifiedAt");
  const description = str(formData, "description");
  const mitigationPlan = str(formData, "mitigationPlan");
  if (!title || !owner) return { error: "Title and owner are both required." };
  if (!isRiskLevel(impact) || !isRiskLevel(probability)) {
    return { error: "Impact and probability must be Low, Medium, or High." };
  }
  if (identifiedAtStr && !DATE_RE.test(identifiedAtStr)) {
    return { error: "Date identified must be a valid date." };
  }

  await prisma.risk.create({
    data: {
      projectId,
      title,
      owner,
      impact,
      probability,
      status: "OPEN",
      identifiedAt: identifiedAtStr ? parseDateInput(identifiedAtStr) : new Date(),
      description: description || null,
      mitigationPlan: mitigationPlan || null,
    },
  });
  revalidateProject(code);
}

// Per-field autosave for an existing risk — selects save immediately,
// free-text fields save on blur / debounce from RiskEditor. Each field is
// its own independent write so editing title can never clobber a status
// change that landed a moment earlier.
export async function setRiskField(
  id: string,
  code: string,
  field:
    | "title"
    | "owner"
    | "impact"
    | "probability"
    | "status"
    | "identifiedAt"
    | "description"
    | "mitigationPlan",
  value: string
): Promise<ActionResult> {
  await requireAuth();
  const trimmed = value.trim();

  if (field === "title" || field === "owner") {
    if (!trimmed) return { error: `${field === "title" ? "Title" : "Owner"} is required.` };
    await prisma.risk.update({
      where: { id },
      data: { [field]: trimmed },
    });
    revalidateProject(code);
    return;
  }

  if (field === "impact" || field === "probability") {
    if (!isRiskLevel(trimmed)) {
      return { error: "Impact and probability must be Low, Medium, or High." };
    }
    await prisma.risk.update({
      where: { id },
      data: { [field]: trimmed },
    });
    revalidateProject(code);
    return;
  }

  if (field === "status") {
    if (!isRiskStatus(trimmed)) {
      return { error: "Status must be Open, Mitigating, or Closed." };
    }
    await prisma.risk.update({
      where: { id },
      data: { status: trimmed },
    });
    revalidateProject(code);
    return;
  }

  if (field === "identifiedAt") {
    if (trimmed && !DATE_RE.test(trimmed)) {
      return { error: "Date identified must be a valid date." };
    }
    if (!trimmed) return;
    await prisma.risk.update({
      where: { id },
      data: { identifiedAt: parseDateInput(trimmed) },
    });
    revalidateProject(code);
    return;
  }

  // description | mitigationPlan — optional free text
  await prisma.risk.update({
    where: { id },
    data: { [field]: trimmed || null },
  });
  revalidateProject(code);
}

export async function deleteRisk(formData: FormData) {
  await requireAuth();
  const id = str(formData, "id");
  const code = str(formData, "code");
  await prisma.risk.delete({ where: { id } });
  revalidateProject(code);
}

// --- Project Health Spider Web ---

// Auto-saved the moment the dropdown changes — independent of the
// comment save below, same reasoning as setRagStatus. Clamped/validated
// server-side since this is a direct RPC call, not a validated form. An
// invalid dimension is a no-op rather than falling back to a default one
// — unlike an out-of-range score, there's no safe substitute dimension
// that wouldn't mean silently overwriting a *different*, real score.
export async function setHealthScore(
  projectId: string,
  code: string,
  dimension: HealthDimension,
  score: number
) {
  await requireAuth();
  if (!isHealthDimension(dimension)) return;
  const safeScore = (HEALTH_SCORES as readonly number[]).includes(score)
    ? score
    : HEALTH_DEFAULT_SCORE;
  await prisma.projectHealth.upsert({
    where: { projectId_dimension: { projectId, dimension } },
    update: { score: safeScore },
    create: { projectId, dimension, score: safeScore },
  });
  revalidateProject(code);
}

// Auto-saved on blur / debounced change — independent of setHealthScore.
export async function setHealthComment(
  projectId: string,
  code: string,
  dimension: HealthDimension,
  comment: string
) {
  await requireAuth();
  if (!isHealthDimension(dimension)) return;
  const note = comment.trim() || null;

  await prisma.projectHealth.upsert({
    where: { projectId_dimension: { projectId, dimension } },
    update: { comment: note },
    create: {
      projectId,
      dimension,
      score: HEALTH_DEFAULT_SCORE,
      comment: note,
    },
  });
  revalidateProject(code);
}

export async function toggleComplianceCompliant(formData: FormData) {
  await requireAuth();
  const id = str(formData, "id");
  const code = str(formData, "code");
  const check = await prisma.complianceCheck.findUniqueOrThrow({
    where: { id },
  });
  await prisma.complianceCheck.update({
    where: { id },
    data: { compliant: !check.compliant },
  });
  revalidateProject(code);
}
