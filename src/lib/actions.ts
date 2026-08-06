"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentReportingPeriod } from "@/lib/period";
import { STRUCTURE_HIERARCHY_ITEMS, type GoalType } from "@/lib/constants";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function revalidateProject(code: string) {
  revalidatePath("/portfolio");
  revalidatePath("/projects");
  revalidatePath("/approvals");
  revalidatePath(`/projects/${code}`, "layout");
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

export async function addQuarterPresentation(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const quarter = str(formData, "quarter");
  const url = str(formData, "url");
  if (!quarter || !url) return;

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

export async function addTeamsMeeting(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const label = str(formData, "label");
  const url = str(formData, "url");
  const dayOfWeek = str(formData, "dayOfWeek");
  const time = str(formData, "time");
  if (!type || !url) return;

  await prisma.teamsMeeting.create({
    data: {
      projectId,
      type,
      label: label || null,
      url,
      dayOfWeek: dayOfWeek || null,
      time: time || null,
    },
  });
  revalidateProject(code);
}

// Add or edit one of the 3 fixed core meeting slots (Weekly/Sprint
// Review/Retro) for a project — at most one row per (project, type), so
// this finds the existing row and updates it, or creates it if the slot
// is currently "Missing".
export async function upsertCoreMeeting(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const type = str(formData, "type");
  const url = str(formData, "url");
  const dayOfWeek = str(formData, "dayOfWeek");
  const time = str(formData, "time");
  if (!type || !url) return;

  const existing = await prisma.teamsMeeting.findFirst({
    where: { projectId, type },
  });

  const data = {
    url,
    dayOfWeek: dayOfWeek || null,
    time: time || null,
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
export async function updateTeamsMeeting(formData: FormData) {
  const id = str(formData, "id");
  const code = str(formData, "code");
  const url = str(formData, "url");
  const dayOfWeek = str(formData, "dayOfWeek");
  const time = str(formData, "time");
  if (!url) return;

  await prisma.teamsMeeting.update({
    where: { id },
    data: { url, dayOfWeek: dayOfWeek || null, time: time || null },
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

export async function sendChecklist(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const sentTo = str(formData, "sentTo") || "SELF";
  const period = currentReportingPeriod();

  await prisma.checklistSubmission.create({
    data: { projectId, period, sentTo },
  });
  revalidateProject(code);
}

export async function submitChecklistAnswers(formData: FormData) {
  const submissionId = str(formData, "submissionId");
  const code = str(formData, "code");
  const questionIds = formData.getAll("questionId").map(String);

  await Promise.all(
    questionIds.map((questionId) =>
      prisma.checklistAnswer.upsert({
        where: { submissionId_questionId: { submissionId, questionId } },
        update: { answer: str(formData, `answer_${questionId}`) || null },
        create: {
          submissionId,
          questionId,
          answer: str(formData, `answer_${questionId}`) || null,
        },
      })
    )
  );

  await prisma.checklistSubmission.update({
    where: { id: submissionId },
    data: { submittedAt: new Date() },
  });

  revalidateProject(code);
}

export async function addOrUpdateStatusReport(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const reportDateStr = str(formData, "reportDate");
  const notes = str(formData, "notes");
  if (!reportDateStr) return;

  // Interpreted as UTC midnight so the stored date always matches the
  // calendar day the user picked, regardless of server timezone.
  const reportDate = new Date(`${reportDateStr}T00:00:00.000Z`);

  await prisma.statusReport.upsert({
    where: { projectId_reportDate: { projectId, reportDate } },
    update: { notes: notes || null },
    create: { projectId, reportDate, notes: notes || null },
  });
  revalidateProject(code);
}

export async function deleteStatusReport(formData: FormData) {
  const id = str(formData, "id");
  const code = str(formData, "code");
  await prisma.statusReport.delete({ where: { id } });
  revalidateProject(code);
}

export async function addComplianceCheck(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const description = str(formData, "description");
  const compliant = formData.get("compliant") === "on";
  const deviationNote = str(formData, "deviationNote");
  if (!description) return;

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
