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
    "onboardingGuideUrl" TEXT
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
    "period" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "QuarterPresentation_projectId_quarter_key" ON "QuarterPresentation"("projectId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "GoalProgress_projectId_goalType_key" ON "GoalProgress"("projectId", "goalType");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistQuestion_order_key" ON "ChecklistQuestion"("order");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistAnswer_submissionId_questionId_key" ON "ChecklistAnswer"("submissionId", "questionId");
