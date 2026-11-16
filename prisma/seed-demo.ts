// Demo portfolio — fills a database with Cosmin's own projects and
// illustrative governance data (RAG, health, risks, reports, sign-offs)
// so screenshots and walkthroughs show a populated Control Tower.
//
//   npm run db:seed-demo     (after `npm run db:setup`)
//
// Not run by `prisma db seed` or the Windows installer build, so real
// installs still start empty. Project names and descriptions come from
// each repo's README; every status, score, risk and report below is
// sample data for the demo, not a live measurement.
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  GOAL_TYPES,
  HEALTH_DIMENSIONS,
  type GoalType,
  type HealthDimension,
} from "../src/lib/constants";
import { currentQuarter } from "../src/lib/period";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const APPROVER_ROLES = ["Product Owner", "Engineering Lead", "Portfolio Sponsor"];

type Level = 0 | 25 | 50 | 75 | 100 | 120;
type Lvl = "LOW" | "MEDIUM" | "HIGH";

interface DemoRisk {
  title: string;
  description?: string;
  impact: Lvl;
  probability: Lvl;
  status?: "OPEN" | "MITIGATING" | "CLOSED";
  mitigationPlan?: string;
}

interface DemoProject {
  code: string;
  name: string;
  status: string;
  rag: "GREEN" | "AMBER" | "RED";
  ragComment: string;
  fte: number;
  gitRepoUrl?: string;
  docsUrl?: string;
  goals: Record<GoalType, Level>;
  health: Record<HealthDimension, number>;
  risks: DemoRisk[];
  // Weekly pulse: days ago (0 = today), or null for "not submitted yet"
  weeklyDaysAgo: number | null;
  sections: { wins: string; roadblocks: string; takeaways: string; asks: string; shipped: string; next: string; shippedLinks?: string };
  approved: string[]; // approver roles that have signed off
}

const gh = (repo: string) => `https://github.com/CosminBMemetea/${repo}`;

const PROJECTS: DemoProject[] = [
  {
    code: "PCT",
    name: "Project Control Tower",
    status: "ACTIVE",
    rag: "GREEN",
    ragComment: "v1.0.1 signed Windows installer released",
    fte: 1,
    gitRepoUrl: gh("project-control-tower"),
    docsUrl: gh("project-control-tower/blob/main/README.md"),
    goals: { ENVIRONMENT_SETUP: 120, PLANNING_TRACKING: 100, MEETING_CADENCE: 100, REPORTING_CHECKLIST: 75, PERIODIC_REPORTING: 100, EXECUTION_ASSURANCE: 75 },
    health: { SCOPE: 5, SCHEDULE: 4, COST: 5, RISK: 4, QUALITY: 4, RESOURCES: 3 },
    risks: [
      { title: "Code-signing certificate renewal", description: "SignPath Foundation certificate is tied to the open-source project.", impact: "MEDIUM", probability: "LOW", status: "MITIGATING", mitigationPlan: "Keep CODE_SIGNING.md current; renew ahead of expiry." },
      { title: "Single maintainer", impact: "MEDIUM", probability: "MEDIUM", mitigationPlan: "Document setup and release steps in the README." },
    ],
    weeklyDaysAgo: 0,
    sections: {
      wins: "v1.0.1 published with a signed Windows installer — installs Only for me, no admin rights.",
      roadblocks: "No blockers. macOS build not planned yet.",
      takeaways: "A pre-seeded template database removed every first-launch setup step.",
      asks: "Feedback from two more PMs on the reporting template.",
      shipped: "Portfolio Pulse, Risk Watchlist rollup, Project Health radar.",
      next: "Demo portfolio seed and refreshed walkthrough.",
      shippedLinks: gh("project-control-tower/releases/latest"),
    },
    approved: ["Product Owner", "Engineering Lead", "Portfolio Sponsor"],
  },
  {
    code: "MSENS",
    name: "MultiSens",
    status: "ACTIVE",
    rag: "GREEN",
    ragComment: "v1.1.0 — multi-model live inference & detection overlay",
    fte: 1.5,
    gitRepoUrl: gh("multisens"),
    docsUrl: gh("multisens#documentation"),
    goals: { ENVIRONMENT_SETUP: 100, PLANNING_TRACKING: 100, MEETING_CADENCE: 75, REPORTING_CHECKLIST: 100, PERIODIC_REPORTING: 75, EXECUTION_ASSURANCE: 100 },
    health: { SCOPE: 4, SCHEDULE: 4, COST: 4, RISK: 3, QUALITY: 5, RESOURCES: 3 },
    risks: [
      { title: "Real depth/thermal hardware availability", description: "Depth and thermal feeds are simulated in demos until hardware is attached.", impact: "HIGH", probability: "MEDIUM", status: "MITIGATING", mitigationPlan: "Use multirtsp synthetic streams; label every simulated feed." },
      { title: "GPU contention with several inference models", impact: "MEDIUM", probability: "MEDIUM", mitigationPlan: "Process-isolated workers; measure FPS per model." },
      { title: "Cross-sensor sync drift on long runs", impact: "MEDIUM", probability: "LOW", status: "CLOSED", mitigationPlan: "Evidence-based tolerance with live skew diagnostics." },
    ],
    weeklyDaysAgo: 0,
    sections: {
      wins: "Two models draw live, overlapping boxes on one real sensor feed; 1084 backend tests passing.",
      roadblocks: "Real thermal camera not on the bench yet — thermal stays simulated and labelled.",
      takeaways: "Showing N/A instead of a guessed number keeps the dashboard honest.",
      asks: "Bench time with a physical depth camera.",
      shipped: "v1.1.0 multi-model overlay; live resource collection.",
      next: "Evaluation reports per sensor pair.",
      shippedLinks: gh("multisens/releases/tag/v1.1.0"),
    },
    approved: ["Product Owner", "Engineering Lead"],
  },
  {
    code: "ROS2X",
    name: "ros2-x-container",
    status: "ACTIVE",
    rag: "RED",
    ragComment: "Arm64 base image refresh blocking the YOLO demo",
    fte: 0.5,
    gitRepoUrl: gh("ros2-x-container"),
    docsUrl: gh("ros2-x-container#readme"),
    goals: { ENVIRONMENT_SETUP: 100, PLANNING_TRACKING: 50, MEETING_CADENCE: 50, REPORTING_CHECKLIST: 25, PERIODIC_REPORTING: 50, EXECUTION_ASSURANCE: 25 },
    health: { SCOPE: 3, SCHEDULE: 2, COST: 4, RISK: 2, QUALITY: 3, RESOURCES: 1 },
    risks: [
      { title: "ROS 2 Humble base image drift on arm64", description: "Upstream image updates can break cv_bridge / foxglove_bridge builds.", impact: "HIGH", probability: "HIGH", mitigationPlan: "Pin base image digest; nightly build on Mac M2 and Jetson." },
      { title: "YOLOv3 weights hosted externally", impact: "MEDIUM", probability: "MEDIUM", mitigationPlan: "Document checksums; cache weights in the image build." },
    ],
    weeklyDaysAgo: 11,
    sections: {
      wins: "Publishes /image_raw and /annotated_image; Foxglove connects over WebSocket on 8765.",
      roadblocks: "Base image refresh pending — YOLO demo image not rebuilt.",
      takeaways: "Pin everything that ships in a container.",
      asks: "One focused day to rebuild and re-test on the Jetson.",
      shipped: "v0.1.0 boilerplate.",
      next: "Pinned base image and a newer detector option.",
    },
    approved: [],
  },
  {
    code: "KERA",
    name: "keraforge",
    status: "PLANNING",
    rag: "AMBER",
    ragComment: "Tuning abstain thresholds on a small local model",
    fte: 0.5,
    gitRepoUrl: gh("keraforge"),
    goals: { ENVIRONMENT_SETUP: 75, PLANNING_TRACKING: 50, MEETING_CADENCE: 25, REPORTING_CHECKLIST: 50, PERIODIC_REPORTING: 50, EXECUTION_ASSURANCE: 25 },
    health: { SCOPE: 3, SCHEDULE: 3, COST: 5, RISK: 3, QUALITY: 3, RESOURCES: 2 },
    risks: [
      { title: "Small local LLM answer quality", description: "qwen2.5:1.5b-instruct on 8 GB Apple Silicon.", impact: "MEDIUM", probability: "HIGH", mitigationPlan: "Abstain when retrieval is weak; ask a clarifying question." },
      { title: "Retrieval thresholds too strict for PL/RO queries", impact: "MEDIUM", probability: "MEDIUM", status: "MITIGATING", mitigationPlan: "Tune --min_score / --min_avg_score per language." },
    ],
    weeklyDaysAgo: 0,
    sections: {
      wins: "Answers carry citations (document + chunk id); weak retrieval abstains instead of guessing.",
      roadblocks: "MPS unstable on some machines — CPU fallback documented.",
      takeaways: "An honest 'I don't know' beats a fluent wrong answer.",
      asks: "A larger RO/PL document set for evaluation.",
      shipped: "FastAPI query API and local console.",
      next: "Traced agent mode with bounded tools.",
    },
    approved: ["Product Owner"],
  },
  {
    code: "CANML",
    name: "canml",
    status: "CLOSING",
    rag: "GREEN",
    ragComment: "v0.1.14-alpha on PyPI — maintenance mode",
    fte: 0.25,
    gitRepoUrl: gh("canml"),
    docsUrl: "https://pypi.org/project/canml/",
    goals: { ENVIRONMENT_SETUP: 100, PLANNING_TRACKING: 100, MEETING_CADENCE: 50, REPORTING_CHECKLIST: 75, PERIODIC_REPORTING: 100, EXECUTION_ASSURANCE: 100 },
    health: { SCOPE: 5, SCHEDULE: 5, COST: 5, RISK: 4, QUALITY: 4, RESOURCES: 3 },
    risks: [
      { title: "python-can / cantools API changes", impact: "LOW", probability: "MEDIUM", mitigationPlan: "Pin versions; CI on new releases." },
    ],
    weeklyDaysAgo: 4,
    sections: {
      wins: "Streams large BLF logs into pandas in chunks; CSV and Parquet export.",
      roadblocks: "None.",
      takeaways: "Chunked decoding keeps memory flat on big logs.",
      asks: "—",
      shipped: "DBC merging with collision detection.",
      next: "Close-out notes and handover.",
      shippedLinks: "https://pypi.org/project/canml/",
    },
    approved: ["Product Owner", "Engineering Lead", "Portfolio Sponsor"],
  },
  {
    code: "QDOC",
    name: "Querra Docs",
    status: "ACTIVE",
    rag: "AMBER",
    ragComment: "Client pilot — OCR path still simulated",
    fte: 1,
    docsUrl: "https://qerradoc.vercel.app",
    goals: { ENVIRONMENT_SETUP: 75, PLANNING_TRACKING: 75, MEETING_CADENCE: 75, REPORTING_CHECKLIST: 50, PERIODIC_REPORTING: 75, EXECUTION_ASSURANCE: 50 },
    health: { SCOPE: 3, SCHEDULE: 3, COST: 4, RISK: 3, QUALITY: 4, RESOURCES: 3 },
    risks: [
      { title: "Field technicians offline on site", impact: "MEDIUM", probability: "HIGH", status: "MITIGATING", mitigationPlan: "PWA with on-device storage; sync later." },
      { title: "OCR accuracy on handwritten sheets", impact: "HIGH", probability: "MEDIUM", mitigationPlan: "Mandatory manual review before saving." },
    ],
    weeklyDaysAgo: 0,
    sections: {
      wins: "Text → autocomplete → manual review → PDF flow works on Android Chrome.",
      roadblocks: "Photo OCR still simulated in the pilot.",
      takeaways: "Mandatory review keeps technicians in control of the record.",
      asks: "Real field sheets from the pilot for testing.",
      shipped: "PDF export and share from the phone.",
      next: "OCR on real photos.",
      shippedLinks: "https://qerradoc.vercel.app",
    },
    approved: ["Product Owner"],
  },
  {
    code: "QFLT",
    name: "Querra Fleet",
    status: "INITIATING",
    rag: "GREEN",
    ragComment: "Client project — live at fleet.querra.net",
    fte: 0.75,
    docsUrl: "https://fleet.querra.net",
    goals: { ENVIRONMENT_SETUP: 50, PLANNING_TRACKING: 25, MEETING_CADENCE: 50, REPORTING_CHECKLIST: 25, PERIODIC_REPORTING: 25, EXECUTION_ASSURANCE: 0 },
    health: { SCOPE: 3, SCHEDULE: 4, COST: 4, RISK: 4, QUALITY: 3, RESOURCES: 4 },
    risks: [
      { title: "Scope still being agreed with the client", impact: "MEDIUM", probability: "MEDIUM", mitigationPlan: "Short charter and a fixed first release." },
    ],
    weeklyDaysAgo: null,
    sections: { wins: "", roadblocks: "", takeaways: "", asks: "", shipped: "", next: "" },
    approved: [],
  },
];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCHours(9, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

async function main() {
  // Template, question sets and roster come from the regular seed.
  const sections = await prisma.reportTemplateSection.findMany({ orderBy: { order: "asc" } });
  if (sections.length === 0) throw new Error("Run `npm run db:setup` first (no report template).");

  for (const name of APPROVER_ROLES) {
    await prisma.approver.upsert({ where: { name }, update: {}, create: { name } });
  }

  const checklistQs = await prisma.checklistQuestion.findMany({ where: { archived: false }, orderBy: { order: "asc" } });
  const monitoringQs = await prisma.monitoringQuestion.findMany({ orderBy: { order: "asc" } });

  for (const p of PROJECTS) {
    // Idempotent: rebuild this project's demo rows from scratch.
    await prisma.project.deleteMany({ where: { code: p.code } });
    const project = await prisma.project.create({
      data: {
        name: p.name,
        code: p.code,
        status: p.status,
        gitRepoUrl: p.gitRepoUrl,
        envSetupDocUrl: p.docsUrl,
        onboardingGuideUrl: p.docsUrl,
        allocatedFte: p.fte,
        ragStatus: p.rag,
        ragComment: p.ragComment,
        ragUpdatedAt: daysAgo(1),
        epicsPlanned: true,
        userStoriesPlanned: p.goals.PLANNING_TRACKING >= 50,
        tasksPlanned: p.goals.PLANNING_TRACKING >= 75,
        sprintsDefined: p.goals.PLANNING_TRACKING >= 100,
      },
    });

    for (const goalType of GOAL_TYPES) {
      await prisma.goalProgress.create({ data: { projectId: project.id, goalType, level: p.goals[goalType] } });
    }
    for (const dimension of HEALTH_DIMENSIONS) {
      await prisma.projectHealth.create({ data: { projectId: project.id, dimension, score: p.health[dimension] } });
    }
    for (const managerName of APPROVER_ROLES) {
      const approved = p.approved.includes(managerName);
      await prisma.managerApproval.create({
        data: { projectId: project.id, managerName, approved, approvedAt: approved ? daysAgo(3) : null },
      });
    }
    for (const [i, r] of p.risks.entries()) {
      await prisma.risk.create({
        data: {
          projectId: project.id,
          title: r.title,
          description: r.description,
          impact: r.impact,
          probability: r.probability,
          status: r.status ?? "OPEN",
          owner: "Cosmin Memetea",
          mitigationPlan: r.mitigationPlan,
          identifiedAt: daysAgo(30 - i * 6),
        },
      });
    }

    const cadence: [string, string, string][] = [
      ["WEEKLY", "MONDAY", "WEEKLY"],
      ["SPRINT_REVIEW", "THURSDAY", "BIWEEKLY"],
      ["RETRO", "FRIDAY", "BIWEEKLY"],
    ];
    const meetingCount = p.goals.MEETING_CADENCE >= 75 ? 3 : p.goals.MEETING_CADENCE >= 50 ? 2 : 1;
    for (const [type, dayOfWeek, recurrenceType] of cadence.slice(0, meetingCount)) {
      await prisma.teamsMeeting.create({
        data: {
          projectId: project.id,
          type,
          url: "https://meet.example.com/" + p.code.toLowerCase() + "-" + type.toLowerCase(),
          dayOfWeek,
          time: type === "WEEKLY" ? "10:00" : "14:00",
          recurrenceType,
          lastOccurredAt: daysAgo(type === "WEEKLY" ? 0 : 4),
        },
      });
    }

    if (p.goals.PLANNING_TRACKING >= 50 && p.docsUrl) {
      await prisma.quarterPresentation.create({
        data: { projectId: project.id, quarter: currentQuarter(), url: p.docsUrl },
      });
    }

    // Reports: a month-end review, a mid-month checkpoint and the weekly pulse.
    const contentBySection = [
      p.sections.wins, p.sections.roadblocks, p.sections.takeaways,
      p.sections.asks, p.sections.shipped, p.sections.next,
    ];
    const addReport = async (type: string, date: Date) => {
      await prisma.report.create({
        data: {
          projectId: project.id,
          type,
          reportDate: date,
          sections: {
            create: sections.slice(0, contentBySection.length).map((s, i) => ({
              sectionId: s.id,
              content: contentBySection[i] || null,
              links: s.hasLinks ? p.sections.shippedLinks ?? null : null,
            })),
          },
        },
      });
    };
    if (p.weeklyDaysAgo !== null) {
      const now = new Date();
      const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 9));
      await addReport("END_MONTH", lastMonthEnd);
      await addReport("MID_MONTH", daysAgo(3));
      await addReport("WEEKLY", daysAgo(p.weeklyDaysAgo));
      if (p.weeklyDaysAgo === 0) await addReport("WEEKLY", daysAgo(4));
    }

    if (p.goals.REPORTING_CHECKLIST >= 50 && checklistQs.length > 0) {
      await prisma.checklistSubmission.create({
        data: {
          projectId: project.id,
          recipientEmail: `team-${p.code.toLowerCase()}@example.com`,
          token: randomBytes(16).toString("hex"),
          sentAt: daysAgo(6),
          submittedAt: daysAgo(5),
          answers: {
            create: checklistQs.slice(0, 3).map((q, i) => ({
              questionId: q.id,
              answer: [p.sections.shipped, p.sections.next, p.sections.roadblocks][i] || "—",
            })),
          },
        },
      });
    }

    const checkedCount = Math.round((p.goals.EXECUTION_ASSURANCE / 100) * monitoringQs.length);
    for (const [i, q] of monitoringQs.entries()) {
      await prisma.monitoringResponse.create({
        data: { projectId: project.id, questionId: q.id, checked: i < checkedCount },
      });
    }

    if (p.goals.EXECUTION_ASSURANCE >= 50) {
      await prisma.complianceCheck.create({
        data: { projectId: project.id, description: "Definition of Done applied to every story this sprint", compliant: true, checkedAt: daysAgo(7) },
      });
      await prisma.complianceCheck.create({
        data: {
          projectId: project.id,
          description: "Release notes published with the latest build",
          compliant: p.rag !== "AMBER",
          checkedAt: daysAgo(2),
          deviationNote: p.rag === "AMBER" ? "Notes drafted, not yet published" : null,
        },
      });
    }
  }

  console.log(`Demo portfolio seeded: ${PROJECTS.length} projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
