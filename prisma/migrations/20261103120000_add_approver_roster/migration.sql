-- CreateTable
CREATE TABLE "Approver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Approver_name_key" ON "Approver"("name");

-- Backfill: approvers already in use (one ManagerApproval row per approver
-- per project, matched by name) become the starting roster, so existing
-- databases keep every sign-off they already have.
INSERT INTO "Approver" ("id", "name")
SELECT lower(hex(randomblob(12))), "managerName"
FROM (SELECT DISTINCT "managerName" FROM "ManagerApproval");
