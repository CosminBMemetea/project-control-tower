-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "gitRepoUrl" TEXT,
    "codebeamerUrl" TEXT,
    "wowPresentationUrl" TEXT,
    "envSetupDocUrl" TEXT,
    "onboardingGuideUrl" TEXT,
    "epicsPlanned" BOOLEAN NOT NULL DEFAULT false,
    "userStoriesPlanned" BOOLEAN NOT NULL DEFAULT false,
    "tasksPlanned" BOOLEAN NOT NULL DEFAULT false,
    "sprintsDefined" BOOLEAN NOT NULL DEFAULT false,
    "allocatedFte" REAL NOT NULL DEFAULT 0,
    "ragStatus" TEXT NOT NULL DEFAULT 'GREEN',
    "ragComment" TEXT,
    "ragUpdatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ProjectHealth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 3,
    "comment" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectHealth_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuarterPresentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuarterPresentation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamsMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "dayOfWeek" TEXT,
    "time" TEXT,
    "recurrenceType" TEXT,
    "recurrenceLabel" TEXT,
    "lastOccurredAt" DATETIME,
    CONSTRAINT "TeamsMeeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManagerApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "comment" TEXT,
    CONSTRAINT "ManagerApproval_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoalProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "evidenceUrl" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoalProgress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ChecklistSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    CONSTRAINT "ChecklistSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT,
    CONSTRAINT "ChecklistAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChecklistSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChecklistAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ChecklistQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonitoringQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MonitoringResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonitoringResponse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MonitoringResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MonitoringQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportTemplateSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "hasLinks" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reportDate" DATETIME NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportSectionEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "content" TEXT,
    "links" TEXT,
    CONSTRAINT "ReportSectionEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportSectionEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ReportTemplateSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "impact" TEXT NOT NULL,
    "probability" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "owner" TEXT NOT NULL,
    "mitigationPlan" TEXT,
    "identifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "compliant" BOOLEAN NOT NULL DEFAULT true,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviationNote" TEXT,
    CONSTRAINT "ComplianceCheck_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectHealth_projectId_dimension_key" ON "ProjectHealth"("projectId", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterPresentation_projectId_quarter_key" ON "QuarterPresentation"("projectId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "GoalProgress_projectId_goalType_key" ON "GoalProgress"("projectId", "goalType");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistQuestion_order_key" ON "ChecklistQuestion"("order");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistSubmission_token_key" ON "ChecklistSubmission"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistAnswer_submissionId_questionId_key" ON "ChecklistAnswer"("submissionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringQuestion_order_key" ON "MonitoringQuestion"("order");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringResponse_projectId_questionId_key" ON "MonitoringResponse"("projectId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplateSection_order_key" ON "ReportTemplateSection"("order");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSectionEntry_reportId_sectionId_key" ON "ReportSectionEntry"("reportId", "sectionId");

