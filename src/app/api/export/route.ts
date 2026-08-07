import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_CONFIG } from "@config/app";

// Full data backup as a single downloadable JSON file — see the Settings
// page. Useful before resetting the database or moving to a new
// environment. Covered by the same password protection as the rest of the
// app (src/proxy.ts), since this is a full dump of everything.
export async function GET() {
  const [projects, checklistQuestions, monitoringQuestions, reportTemplateSections] =
    await Promise.all([
      prisma.project.findMany({
        include: {
          quarterPresentations: true,
          teamsMeetings: true,
          managerApprovals: true,
          goalProgress: true,
          checklistSubmissions: { include: { answers: true } },
          complianceChecks: true,
          reports: { include: { sections: true } },
          monitoringResponses: true,
          risks: true,
          healthScores: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.checklistQuestion.findMany({ orderBy: { order: "asc" } }),
      prisma.monitoringQuestion.findMany({ orderBy: { order: "asc" } }),
      prisma.reportTemplateSection.findMany({ orderBy: { order: "asc" } }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    appName: APP_CONFIG.name,
    data: {
      projects,
      checklistQuestions,
      monitoringQuestions,
      reportTemplateSections,
    },
  };

  const slug =
    APP_CONFIG.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "export";
  const filename = `${slug}-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
