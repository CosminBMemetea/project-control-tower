import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  DEFAULT_CHECKLIST_QUESTIONS,
  DEFAULT_MONITORING_QUESTIONS,
  GOAL_TYPES,
  HEALTH_DIMENSIONS,
  HEALTH_DEFAULT_SCORE,
  DEFAULT_REPORT_TEMPLATE,
} from "../src/lib/constants";
import { PROJECTS } from "../config/projects";
import { APPROVERS } from "../config/approvers";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Both question sets are seeded only into an empty table — after that
  // they're edited in the app (Checklist / Monitoring tabs), and re-running
  // the seed must not overwrite those edits.
  console.log("Seeding checklist questions...");
  if ((await prisma.checklistQuestion.count()) === 0) {
    for (let i = 0; i < DEFAULT_CHECKLIST_QUESTIONS.length; i++) {
      await prisma.checklistQuestion.create({
        data: { order: i + 1, text: DEFAULT_CHECKLIST_QUESTIONS[i] },
      });
    }
  }

  console.log("Seeding monitoring questions...");
  if ((await prisma.monitoringQuestion.count()) === 0) {
    for (let i = 0; i < DEFAULT_MONITORING_QUESTIONS.length; i++) {
      await prisma.monitoringQuestion.create({
        data: { order: i + 1, text: DEFAULT_MONITORING_QUESTIONS[i] },
      });
    }
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

  console.log("Seeding approvers...");
  // Only into an empty roster — after that it's managed on the Approvals
  // page, and re-running the seed mustn't bring back someone removed there.
  if ((await prisma.approver.count()) === 0) {
    for (const name of APPROVERS) {
      await prisma.approver.create({ data: { name } });
    }
  }
  const approvers = await prisma.approver.findMany();

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

    for (const { name: managerName } of approvers) {
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
