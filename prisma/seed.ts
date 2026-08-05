import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { CHECKLIST_QUESTIONS, GOAL_TYPES } from "../src/lib/constants";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const PROJECTS = [
  {
    name: "ATHENA",
    code: "ATHENA",
    gitRepoUrl: "https://dev.azure.com/magna-ri/athena/_git/athena",
  },
  {
    name: "Drive Assist LLM",
    code: "DA-LLM",
    gitRepoUrl: "https://dev.azure.com/magna-ri/drive-assist-llm/_git/drive-assist-llm",
  },
  {
    name: "Voxel Grid",
    code: "VOXEL",
    gitRepoUrl: "https://dev.azure.com/magna-ri/voxel-grid/_git/voxel-grid",
  },
  {
    name: "Radar Camera Fusion Parking",
    code: "RCF-PARK",
    gitRepoUrl: "https://dev.azure.com/magna-ri/rcf-parking/_git/rcf-parking",
  },
  {
    name: "Live Range Assessor",
    code: "LRA",
    gitRepoUrl: "https://dev.azure.com/magna-ri/live-range-assessor/_git/live-range-assessor",
  },
  {
    name: "USS Replacement",
    code: "USS-REPL",
    gitRepoUrl: "https://dev.azure.com/magna-ri/uss-replacement/_git/uss-replacement",
  },
  {
    name: "Gating Imaging",
    code: "GATING-IMG",
    gitRepoUrl: "https://dev.azure.com/magna-ri/gating-imaging/_git/gating-imaging",
  },
];

const MANAGER_NAMES = ["Manager One", "Manager Two", "Manager Three"];

async function main() {
  console.log("Seeding checklist questions...");
  for (let i = 0; i < CHECKLIST_QUESTIONS.length; i++) {
    await prisma.checklistQuestion.upsert({
      where: { order: i + 1 },
      update: { text: CHECKLIST_QUESTIONS[i] },
      create: { order: i + 1, text: CHECKLIST_QUESTIONS[i] },
    });
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

    for (const managerName of MANAGER_NAMES) {
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
