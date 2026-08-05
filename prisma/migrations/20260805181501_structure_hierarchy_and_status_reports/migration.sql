-- CreateTable
CREATE TABLE "StatusReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "reportDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StatusReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
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
    "sprintsDefined" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Project" ("code", "codebeamerUrl", "createdAt", "envSetupDocUrl", "gitRepoUrl", "id", "name", "onboardingGuideUrl", "status", "updatedAt", "wowPresentationUrl") SELECT "code", "codebeamerUrl", "createdAt", "envSetupDocUrl", "gitRepoUrl", "id", "name", "onboardingGuideUrl", "status", "updatedAt", "wowPresentationUrl" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StatusReport_projectId_reportDate_key" ON "StatusReport"("projectId", "reportDate");
