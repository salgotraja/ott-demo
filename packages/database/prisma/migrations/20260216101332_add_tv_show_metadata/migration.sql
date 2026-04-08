-- AlterTable
ALTER TABLE "TvShow" ADD COLUMN     "keywords" TEXT;

-- CreateTable
CREATE TABLE "TvAlternateTitle" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "TvAlternateTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvContentRating" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "TvContentRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvSpokenLanguage" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "TvSpokenLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvRating" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "contentId" TEXT,
    "sourceUrl" TEXT,

    CONSTRAINT "TvRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvReference" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "facebookId" TEXT,
    "home" TEXT,
    "imdbId" TEXT,
    "instagramId" TEXT,
    "twitterId" TEXT,
    "wikidataId" TEXT,
    "wikipedia" TEXT,
    "wikipediaUrl" TEXT,
    "tmdbId" TEXT,

    CONSTRAINT "TvReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvVideo" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "size" INTEGER,
    "official" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "type" TEXT,
    "url" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "TvVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvActor" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "internalId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "gender" TEXT,
    "image" TEXT,
    "characterName" TEXT,
    "priority" INTEGER,

    CONSTRAINT "TvActor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvCrew" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "crewId" INTEGER NOT NULL,
    "internalId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "gender" TEXT,
    "image" TEXT,
    "job" TEXT NOT NULL,

    CONSTRAINT "TvCrew_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TvAlternateTitle_tvShowId_idx" ON "TvAlternateTitle"("tvShowId");

-- CreateIndex
CREATE INDEX "TvContentRating_tvShowId_idx" ON "TvContentRating"("tvShowId");

-- CreateIndex
CREATE INDEX "TvSpokenLanguage_tvShowId_idx" ON "TvSpokenLanguage"("tvShowId");

-- CreateIndex
CREATE INDEX "TvRating_tvShowId_idx" ON "TvRating"("tvShowId");

-- CreateIndex
CREATE INDEX "TvRating_source_idx" ON "TvRating"("source");

-- CreateIndex
CREATE UNIQUE INDEX "TvReference_tvShowId_key" ON "TvReference"("tvShowId");

-- CreateIndex
CREATE INDEX "TvVideo_tvShowId_idx" ON "TvVideo"("tvShowId");

-- CreateIndex
CREATE INDEX "TvVideo_type_idx" ON "TvVideo"("type");

-- CreateIndex
CREATE INDEX "TvActor_tvShowId_idx" ON "TvActor"("tvShowId");

-- CreateIndex
CREATE INDEX "TvActor_actorId_idx" ON "TvActor"("actorId");

-- CreateIndex
CREATE INDEX "TvActor_priority_idx" ON "TvActor"("priority");

-- CreateIndex
CREATE INDEX "TvCrew_tvShowId_idx" ON "TvCrew"("tvShowId");

-- CreateIndex
CREATE INDEX "TvCrew_crewId_idx" ON "TvCrew"("crewId");

-- CreateIndex
CREATE INDEX "TvCrew_job_idx" ON "TvCrew"("job");

-- AddForeignKey
ALTER TABLE "TvAlternateTitle" ADD CONSTRAINT "TvAlternateTitle_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvContentRating" ADD CONSTRAINT "TvContentRating_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvSpokenLanguage" ADD CONSTRAINT "TvSpokenLanguage_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvRating" ADD CONSTRAINT "TvRating_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvReference" ADD CONSTRAINT "TvReference_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvVideo" ADD CONSTRAINT "TvVideo_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvActor" ADD CONSTRAINT "TvActor_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvCrew" ADD CONSTRAINT "TvCrew_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
