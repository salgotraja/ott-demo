-- AlterTable
ALTER TABLE "Actor" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthName" TEXT,
ADD COLUMN     "family" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "otherWorks" TEXT,
ADD COLUMN     "quotes" TEXT,
ADD COLUMN     "trademarks" TEXT,
ADD COLUMN     "trivia" TEXT;

-- AlterTable
ALTER TABLE "AlternateTitle" ADD COLUMN     "description" TEXT,
ADD COLUMN     "language" TEXT;

-- AlterTable
ALTER TABLE "Crew" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthName" TEXT,
ADD COLUMN     "family" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "otherWorks" TEXT,
ADD COLUMN     "quotes" TEXT,
ADD COLUMN     "trademarks" TEXT,
ADD COLUMN     "trivia" TEXT;

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "verifiedByTeam" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SyncJob" ADD COLUMN     "syncType" TEXT NOT NULL DEFAULT 'all';

-- AlterTable
ALTER TABLE "TvActor" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthName" TEXT,
ADD COLUMN     "family" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "otherWorks" TEXT,
ADD COLUMN     "quotes" TEXT,
ADD COLUMN     "trademarks" TEXT,
ADD COLUMN     "trivia" TEXT;

-- AlterTable
ALTER TABLE "TvAlternateTitle" ADD COLUMN     "description" TEXT,
ADD COLUMN     "language" TEXT;

-- AlterTable
ALTER TABLE "TvCrew" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthName" TEXT,
ADD COLUMN     "family" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "otherWorks" TEXT,
ADD COLUMN     "quotes" TEXT,
ADD COLUMN     "trademarks" TEXT,
ADD COLUMN     "trivia" TEXT;

-- AlterTable
ALTER TABLE "TvShow" ADD COLUMN     "verifiedByTeam" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AlternateTitle_language_idx" ON "AlternateTitle"("language");

-- CreateIndex
CREATE INDEX "TvAlternateTitle_language_idx" ON "TvAlternateTitle"("language");
