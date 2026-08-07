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
    "sprintsDefined" BOOLEAN NOT NULL DEFAULT false,
    "allocatedFte" REAL NOT NULL DEFAULT 0,
    "ragStatus" TEXT NOT NULL DEFAULT 'GREEN',
    "ragComment" TEXT,
    "ragUpdatedAt" DATETIME
);
INSERT INTO "new_Project" ("code", "codebeamerUrl", "createdAt", "envSetupDocUrl", "epicsPlanned", "gitRepoUrl", "id", "name", "onboardingGuideUrl", "sprintsDefined", "status", "tasksPlanned", "updatedAt", "userStoriesPlanned", "wowPresentationUrl") SELECT "code", "codebeamerUrl", "createdAt", "envSetupDocUrl", "epicsPlanned", "gitRepoUrl", "id", "name", "onboardingGuideUrl", "sprintsDefined", "status", "tasksPlanned", "updatedAt", "userStoriesPlanned", "wowPresentationUrl" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
