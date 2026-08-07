"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendEmail, getAppBaseUrl } from "@/lib/email";
import {
  CHECKLIST_QUESTIONS,
  STRUCTURE_HIERARCHY_ITEMS,
  MAX_ALLOCATED_FTE,
  RAG_STATUSES,
  RISK_LEVELS,
  RISK_STATUSES,
  HEALTH_DIMENSIONS,
  HEALTH_SCORES,
  HEALTH_DEFAULT_SCORE,
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

export async function updateProjectLinks(formData: FormData) {
  const code = str(formData, "code");
  await prisma.project.update({
    where: { code },
    data: {
      gitRepoUrl: str(formData, "gitRepoUrl") || null,
      codebeamerUrl: str(formData, "codebeamerUrl") || null,
      wowPresentationUrl: str(formData, "wowPresentationUrl") || null,
      envSetupDocUrl: str(formData, "envSetupDocUrl") || null,
      onboardingGuideUrl: str(formData, "onboardingGuideUrl") || null,
    },
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
  await prisma.managerApproval.update({
    where: { id },
    data: { approved, approvedAt: approved ? new Date() : null },
  });
  revalidateProject(code);
}

export async function updateManagerApprovalComment(formData: FormData) {
  const id = str(formData, "id");
  const code = str(formData, "code");
  const comment = str(formData, "comment");

  await prisma.managerApproval.update({
    where: { id },
    data: { comment: comment || null },
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
  await prisma.goalProgress.upsert({
    where: { projectId_goalType: { projectId, goalType } },
    update: { level },
    create: { projectId, goalType, level },
  });
  revalidateProject(code);
}

// Kept independent of setGoalLevel so editing the evidence link can never
// clobber a level someone just set elsewhere on the same page.
export async function setGoalEvidenceUrl(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const goalType = str(formData, "goalType") as GoalType;
  const evidenceUrl = str(formData, "evidenceUrl");

  await prisma.goalProgress.upsert({
    where: { projectId_goalType: { projectId, goalType } },
    update: { evidenceUrl: evidenceUrl || null },
    create: { projectId, goalType, level: 0, evidenceUrl: evidenceUrl || null },
  });
  revalidateProject(code);
}

export async function addQuarterPresentation(
  formData: FormData
): Promise<ActionResult> {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const quarter = str(formData, "quarter");
  const url = str(formData, "url");
  if (!quarter || !url) return { error: "Quarter and URL are both required." };

  await prisma.quarterPresentation.upsert({
    where: { projectId_quarter: { projectId, quarter } },
    update: { url },
    create: { projectId, quarter, url },
  });
  revalidateProject(code);
}

export async function deleteQuarterPresentation(formData: FormData) {
  const id = str(formData, "id");
  const code = str(formData, "code");
  await prisma.quarterPresentation.delete({ where: { id } });
  revalidateProject(code);
}

export async function addTeamsMeeting(
  formData: FormData
): Promise<ActionResult> {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const label = str(formData, "label");
  const url = str(formData, "url");
  const dayOfWeek = str(formData, "dayOfWeek");
  const time = str(formData, "time");
  if (!type || !url) return { error: "A Teams link is required." };

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
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const url = str(formData, "url");
  const dayOfWeek = str(formData, "dayOfWeek");
  const time = str(formData, "time");
  if (!type || !url) return { error: "A Teams link is required." };

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

// Edits any existing meeting row by id — used for both core meeting cards
// and custom ("OTHER") meeting cards, since both already have a stable id.
// Deliberately doesn't touch recurrence: that's owned solely by
// setMeetingRecurrence's quick control, so saving url/day/time here can
// never silently wipe a recurrence someone just set.
export async function updateTeamsMeeting(
  formData: FormData
): Promise<ActionResult> {
  const id = str(formData, "id");
  const code = str(formData, "code");
  const url = str(formData, "url");
  const dayOfWeek = str(formData, "dayOfWeek");
  const time = str(formData, "time");
  if (!url) return { error: "A Teams link is required." };

  await prisma.teamsMeeting.update({
    where: { id },
    data: { url, dayOfWeek: dayOfWeek || null, time: time || null },
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
  const id = str(formData, "id");
  const code = str(formData, "code");
  await prisma.teamsMeeting.update({
    where: { id },
    data: { lastOccurredAt: new Date() },
  });
  revalidateProject(code);
}

export async function deleteTeamsMeeting(formData: FormData) {
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
// regardless, and saveReportSections upserts on save.
export async function createReport(
  formData: FormData
): Promise<ActionResult> {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const reportDateStr = str(formData, "reportDate");
  const title = str(formData, "title");
  if (!type || !reportDateStr)
    return { error: "Type and date are both required." };

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

export async function updateReportMeta(
  formData: FormData
): Promise<ActionResult> {
  const id = str(formData, "id");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const reportDateStr = str(formData, "reportDate");
  const title = str(formData, "title");
  if (!type || !reportDateStr)
    return { error: "Type and date are both required." };

  await prisma.report.update({
    where: { id },
    data: {
      type,
      reportDate: parseDateInput(reportDateStr),
      title: title || null,
    },
  });
  revalidateProject(code);
}

// One combined save for the whole report — every section is part of the
// same editing session, so there's no "sibling form" staleness risk the
// way there was with independent per-row toggles elsewhere in the app.
export async function saveReportSections(formData: FormData) {
  const reportId = str(formData, "reportId");
  const code = str(formData, "code");
  const sectionIds = formData.getAll("sectionId").map(String);

  await Promise.all(
    sectionIds.map((sectionId) =>
      prisma.reportSectionEntry.upsert({
        where: { reportId_sectionId: { reportId, sectionId } },
        update: {
          content: str(formData, `content_${sectionId}`) || null,
          links: str(formData, `links_${sectionId}`) || null,
        },
        create: {
          reportId,
          sectionId,
          content: str(formData, `content_${sectionId}`) || null,
          links: str(formData, `links_${sectionId}`) || null,
        },
      })
    )
  );
  revalidateProject(code);
}

export async function deleteReport(formData: FormData) {
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

export async function updateTemplateSection(
  formData: FormData
): Promise<ActionResult> {
  const id = str(formData, "id");
  const label = str(formData, "label");
  const hasLinks = formData.get("hasLinks") === "on";
  if (!label) return { error: "Section name is required." };

  await prisma.reportTemplateSection.update({
    where: { id },
    data: { label, hasLinks },
  });
  revalidatePath("/report-template");
  revalidateAllProjectReportingTabs();
}

export async function deleteTemplateSection(formData: FormData) {
  const id = str(formData, "id");
  await prisma.reportTemplateSection.delete({ where: { id } });
  revalidatePath("/report-template");
  revalidateAllProjectReportingTabs();
}

export async function moveTemplateSection(formData: FormData) {
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

// Auto-saved on blur from the FTE input — used on both the Portfolio
// Overview grid and the per-project header, same "one save path" idea as
// setGoalLevel. Clamped server-side too (not just in FteInput) since this
// is called directly as a Server Action RPC, not via a validated form —
// a crafted call could otherwise pass NaN/Infinity/negative values.
export async function setAllocatedFte(
  projectId: string,
  code: string,
  value: number
) {
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

export async function setRagComment(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const ragComment = str(formData, "ragComment");
  await prisma.project.update({
    where: { id: projectId },
    data: { ragComment: ragComment || null },
  });
  revalidateProject(code);
}

// --- Risk Register ---

export async function addRisk(formData: FormData): Promise<ActionResult> {
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

// One combined save per risk — title/description/impact/probability/
// owner/mitigation/status/date all edited together, so "closing" a risk
// is just picking Closed here and saving like any other field.
export async function updateRisk(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const code = str(formData, "code");
  const title = str(formData, "title");
  const owner = str(formData, "owner");
  const impact = str(formData, "impact");
  const probability = str(formData, "probability");
  const status = str(formData, "status");
  const identifiedAtStr = str(formData, "identifiedAt");
  const description = str(formData, "description");
  const mitigationPlan = str(formData, "mitigationPlan");
  if (!title || !owner) return { error: "Title and owner are both required." };
  if (!isRiskLevel(impact) || !isRiskLevel(probability)) {
    return { error: "Impact and probability must be Low, Medium, or High." };
  }
  if (!isRiskStatus(status)) {
    return { error: "Status must be Open, Mitigating, or Closed." };
  }
  if (identifiedAtStr && !DATE_RE.test(identifiedAtStr)) {
    return { error: "Date identified must be a valid date." };
  }

  await prisma.risk.update({
    where: { id },
    data: {
      title,
      owner,
      impact,
      probability,
      status,
      identifiedAt: identifiedAtStr ? parseDateInput(identifiedAtStr) : undefined,
      description: description || null,
      mitigationPlan: mitigationPlan || null,
    },
  });
  revalidateProject(code);
}

export async function deleteRisk(formData: FormData) {
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

export async function setHealthComment(formData: FormData): Promise<ActionResult> {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const dimension = str(formData, "dimension");
  const comment = str(formData, "comment");
  if (!isHealthDimension(dimension)) return { error: "Invalid health dimension." };

  await prisma.projectHealth.upsert({
    where: { projectId_dimension: { projectId, dimension } },
    update: { comment: comment || null },
    create: { projectId, dimension, score: HEALTH_DEFAULT_SCORE, comment: comment || null },
  });
  revalidateProject(code);
}

export async function toggleComplianceCompliant(formData: FormData) {
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
