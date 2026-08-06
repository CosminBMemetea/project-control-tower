/*
  Warnings:

  - You are about to drop the `StatusReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "TeamsMeeting" ADD COLUMN "recurrenceLabel" TEXT;
ALTER TABLE "TeamsMeeting" ADD COLUMN "recurrenceType" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StatusReport";
PRAGMA foreign_keys=on;

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

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplateSection_order_key" ON "ReportTemplateSection"("order");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSectionEntry_reportId_sectionId_key" ON "ReportSectionEntry"("reportId", "sectionId");
