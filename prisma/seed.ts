import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  CHECKLIST_QUESTIONS,
  MONITORING_QUESTIONS,
  GOAL_TYPES,
  HEALTH_DIMENSIONS,
  HEALTH_DEFAULT_SCORE,
} from "../src/lib/constants";
import { PROJECTS } from "../config/projects";
import { APPROVERS } from "../config/approvers";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_REPORT_TEMPLATE = [
  { label: "Highlights", hasLinks: false },
  { label: "Lowlights", hasLinks: false },
  { label: "Lessons Learned", hasLinks: false },
  { label: "Requests from the Team", hasLinks: false },
  { label: "Done This Sprint", hasLinks: true },
  { label: "Up Next Sprint", hasLinks: false },
];

async function main() {
  console.log("Seeding checklist questions...");
  for (let i = 0; i < CHECKLIST_QUESTIONS.length; i++) {
    await prisma.checklistQuestion.upsert({
      where: { order: i + 1 },
      update: { text: CHECKLIST_QUESTIONS[i] },
      create: { order: i + 1, text: CHECKLIST_QUESTIONS[i] },
    });
  }

  console.log("Seeding monitoring questions...");
  for (let i = 0; i < MONITORING_QUESTIONS.length; i++) {
    await prisma.monitoringQuestion.upsert({
      where: { order: i + 1 },
      update: { text: MONITORING_QUESTIONS[i] },
      create: { order: i + 1, text: MONITORING_QUESTIONS[i] },
    });
  }

  console.log("Seeding report template...");
  const existingSectionCount = await prisma.reportTemplateSection.count();
  if (existingSectionCount === 0) {
    for (let i = 0; i < DEFAULT_REPORT_TEMPLATE.length; i++) {
      await prisma.reportTemplateSection.create({
        data: { ...DEFAULT_REPORT_TEMPLATE[i], order: i + 1 },
      });
    }
  }

  console.log("Seeding projects...");
  for (const p of PROJECTS) {
    const project = await prisma.project.upsert({
      where: { code: p.code },
      update: {},
      create: {
        name: p.name,
        code: p.code,
        gitRepoUrl: p.gitRepoUrl,
      },
    });

    for (const goalType of GOAL_TYPES) {
      await prisma.goalProgress.upsert({
        where: { projectId_goalType: { projectId: project.id, goalType } },
        update: {},
        create: { projectId: project.id, goalType, level: 0 },
      });
    }

    for (const dimension of HEALTH_DIMENSIONS) {
      await prisma.projectHealth.upsert({
        where: { projectId_dimension: { projectId: project.id, dimension } },
        update: {},
        create: { projectId: project.id, dimension, score: HEALTH_DEFAULT_SCORE },
      });
    }

    for (const managerName of APPROVERS) {
      const existing = await prisma.managerApproval.findFirst({
        where: { projectId: project.id, managerName },
      });
      if (!existing) {
        await prisma.managerApproval.create({
          data: { projectId: project.id, managerName },
        });
      }
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
