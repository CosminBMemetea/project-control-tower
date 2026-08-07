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

-- CreateIndex
CREATE UNIQUE INDEX "ProjectHealth_projectId_dimension_key" ON "ProjectHealth"("projectId", "dimension");
