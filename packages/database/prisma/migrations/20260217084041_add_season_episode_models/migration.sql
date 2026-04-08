-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "airDate" TIMESTAMP(3),
    "posterPath" TEXT,
    "voteAverage" DOUBLE PRECISION,
    "episodeCount" INTEGER,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "airDate" TIMESTAMP(3),
    "runtime" INTEGER,
    "stillPath" TEXT,
    "voteAverage" DOUBLE PRECISION,
    "voteCount" INTEGER,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonImage" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ratio" DOUBLE PRECISION,
    "height" INTEGER,
    "width" INTEGER,

    CONSTRAINT "SeasonImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonVideo" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT,
    "type" TEXT,
    "url" TEXT NOT NULL,
    "image" TEXT,
    "official" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SeasonVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonProvider" (
    "seasonId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'IN',
    "url" TEXT,

    CONSTRAINT "SeasonProvider_pkey" PRIMARY KEY ("seasonId","providerId","type","region")
);

-- CreateIndex
CREATE INDEX "Season_tvShowId_idx" ON "Season"("tvShowId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_tvShowId_seasonNumber_key" ON "Season"("tvShowId", "seasonNumber");

-- CreateIndex
CREATE INDEX "Episode_tvShowId_idx" ON "Episode"("tvShowId");

-- CreateIndex
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_tvShowId_seasonNumber_episodeNumber_key" ON "Episode"("tvShowId", "seasonNumber", "episodeNumber");

-- CreateIndex
CREATE INDEX "SeasonImage_seasonId_idx" ON "SeasonImage"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonVideo_seasonId_idx" ON "SeasonVideo"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonProvider_seasonId_idx" ON "SeasonProvider"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonProvider_region_idx" ON "SeasonProvider"("region");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonImage" ADD CONSTRAINT "SeasonImage_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonVideo" ADD CONSTRAINT "SeasonVideo_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonProvider" ADD CONSTRAINT "SeasonProvider_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonProvider" ADD CONSTRAINT "SeasonProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
