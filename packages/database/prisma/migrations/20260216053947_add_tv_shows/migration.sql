-- CreateTable
CREATE TABLE "TvShow" (
    "id" INTEGER NOT NULL,
    "internalId" TEXT NOT NULL,
    "tmdbId" TEXT,
    "imdbId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "tagline" TEXT,
    "status" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'tv',
    "firstAirDate" TIMESTAMP(3),
    "lastAirDate" TIMESTAMP(3),
    "numberOfSeasons" INTEGER,
    "numberOfEpisodes" INTEGER,
    "voteAverage" DOUBLE PRECISION,
    "voteCount" INTEGER,
    "popularity" DOUBLE PRECISION,
    "adult" BOOLEAN NOT NULL DEFAULT false,
    "originalLanguage" TEXT,

    CONSTRAINT "TvShow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvShowProvider" (
    "tvShowId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'IN',
    "url" TEXT,
    "cost" TEXT,
    "quality" TEXT,
    "iosUrl" TEXT,
    "androidUrl" TEXT,

    CONSTRAINT "TvShowProvider_pkey" PRIMARY KEY ("tvShowId","providerId","type","region")
);

-- CreateTable
CREATE TABLE "GenreOnTvShow" (
    "tvShowId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "GenreOnTvShow_pkey" PRIMARY KEY ("tvShowId","genreId")
);

-- CreateTable
CREATE TABLE "TvShowImage" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ratio" DOUBLE PRECISION,
    "height" INTEGER,
    "width" INTEGER,

    CONSTRAINT "TvShowImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvProduction" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "country" TEXT,

    CONSTRAINT "TvProduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TvShow_internalId_key" ON "TvShow"("internalId");

-- CreateIndex
CREATE INDEX "TvShow_popularity_idx" ON "TvShow"("popularity");

-- CreateIndex
CREATE INDEX "TvShow_voteAverage_idx" ON "TvShow"("voteAverage");

-- CreateIndex
CREATE INDEX "TvShow_firstAirDate_idx" ON "TvShow"("firstAirDate");

-- CreateIndex
CREATE INDEX "TvShow_type_idx" ON "TvShow"("type");

-- CreateIndex
CREATE INDEX "TvShowProvider_providerId_type_idx" ON "TvShowProvider"("providerId", "type");

-- CreateIndex
CREATE INDEX "TvShowProvider_type_idx" ON "TvShowProvider"("type");

-- CreateIndex
CREATE INDEX "TvShowProvider_region_idx" ON "TvShowProvider"("region");

-- CreateIndex
CREATE INDEX "GenreOnTvShow_genreId_idx" ON "GenreOnTvShow"("genreId");

-- CreateIndex
CREATE INDEX "TvShowImage_tvShowId_idx" ON "TvShowImage"("tvShowId");

-- CreateIndex
CREATE INDEX "TvShowImage_type_idx" ON "TvShowImage"("type");

-- CreateIndex
CREATE INDEX "TvProduction_tvShowId_idx" ON "TvProduction"("tvShowId");

-- AddForeignKey
ALTER TABLE "TvShowProvider" ADD CONSTRAINT "TvShowProvider_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvShowProvider" ADD CONSTRAINT "TvShowProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenreOnTvShow" ADD CONSTRAINT "GenreOnTvShow_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenreOnTvShow" ADD CONSTRAINT "GenreOnTvShow_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvShowImage" ADD CONSTRAINT "TvShowImage_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvProduction" ADD CONSTRAINT "TvProduction_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
