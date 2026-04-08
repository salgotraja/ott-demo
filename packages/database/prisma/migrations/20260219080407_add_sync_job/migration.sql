-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "moviesAdded" INTEGER NOT NULL DEFAULT 0,
    "moviesUpdated" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncJob_status_idx" ON "SyncJob"("status");

-- CreateIndex
CREATE INDEX "SyncJob_startedAt_idx" ON "SyncJob"("startedAt");
