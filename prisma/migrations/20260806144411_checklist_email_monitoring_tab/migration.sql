/*
  Warnings:

  - You are about to drop the column `period` on the `ChecklistSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `sentTo` on the `ChecklistSubmission` table. All the data in the column will be lost.
  - Added the required column `recipientEmail` to the `ChecklistSubmission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `ChecklistSubmission` table without a default value. This is not possible if the table is not empty.

*/
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChecklistSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    CONSTRAINT "ChecklistSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChecklistSubmission" ("id", "projectId", "sentAt", "submittedAt") SELECT "id", "projectId", "sentAt", "submittedAt" FROM "ChecklistSubmission";
DROP TABLE "ChecklistSubmission";
ALTER TABLE "new_ChecklistSubmission" RENAME TO "ChecklistSubmission";
CREATE UNIQUE INDEX "ChecklistSubmission_token_key" ON "ChecklistSubmission"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringQuestion_order_key" ON "MonitoringQuestion"("order");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringResponse_projectId_questionId_key" ON "MonitoringResponse"("projectId", "questionId");
