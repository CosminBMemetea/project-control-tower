"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentReportingPeriod } from "@/lib/period";
import type { GoalType } from "@/lib/constants";

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

export async function setManagerApproval(formData: FormData) {
  const id = str(formData, "id");
  const code = str(formData, "code");
  const approved = formData.get("approved") === "on";
  const comment = str(formData, "comment");

  await prisma.managerApproval.update({
    where: { id },
    data: {
      approved,
      approvedAt: approved ? new Date() : null,
      comment: comment || null,
    },
  });
  revalidateProject(code);
}

export async function upsertGoalProgress(formData: FormData) {
  const projectId = str(formData, "projectId");
  const code = str(formData, "code");
  const goalType = str(formData, "goalType") as GoalType;
  const level = Number(str(formData, "level"));
  const evidenceUrl = str(formData, "evidenceUrl");

  await prisma.goalProgress.upsert({
    where: { projectId_goalType: { projectId, goalType } },
    update: { level, evidenceUrl: evidenceUrl || null },
    create: { projectId, goalType, level, evidenceUrl: evidenceUrl || null },
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
  if (!type || !url) return;

  await prisma.teamsMeeting.create({
    data: { projectId, type, label: label || null, url },
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
