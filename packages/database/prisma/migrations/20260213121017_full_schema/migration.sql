-- CreateTable
CREATE TABLE "Movie" (
    "id" INTEGER NOT NULL,
    "internalId" TEXT NOT NULL,
    "eidr" TEXT,
    "tmdbId" TEXT,
    "imdbId" TEXT,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "tagline" TEXT,
    "status" TEXT,
    "description" TEXT,
    "runtime" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'movie',
    "releaseYear" INTEGER,
    "releaseDate" TIMESTAMP(3),
    "awards" TEXT,
    "budget" TEXT,
    "revenue" TEXT,
    "adult" BOOLEAN NOT NULL DEFAULT false,
    "keywords" TEXT,
    "voteAverage" DOUBLE PRECISION,
    "voteCount" INTEGER,
    "popularity" DOUBLE PRECISION,
    "originalLanguage" TEXT,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlternateTitle" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "AlternateTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRating" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "ContentRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpokenLanguage" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "SpokenLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "contentId" TEXT,
    "sourceUrl" TEXT,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieImage" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ratio" DOUBLE PRECISION,
    "height" INTEGER,
    "width" INTEGER,

    CONSTRAINT "MovieImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "facebookId" TEXT,
    "home" TEXT,
    "imdbId" TEXT,
    "instagramId" TEXT,
    "twitterId" TEXT,
    "wikidataId" TEXT,
    "wikipedia" TEXT,
    "wikipediaUrl" TEXT,
    "tmdbId" TEXT,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "size" INTEGER,
    "official" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "type" TEXT,
    "url" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "internalId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "gender" TEXT,
    "image" TEXT,
    "characterName" TEXT,
    "priority" INTEGER,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "crewId" INTEGER NOT NULL,
    "internalId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "gender" TEXT,
    "image" TEXT,
    "job" TEXT NOT NULL,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Production" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "country" TEXT,

    CONSTRAINT "Production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logoPath" TEXT,
    "displayPriority" INTEGER,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieProvider" (
    "movieId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'IN',
    "url" TEXT,
    "cost" TEXT,
    "quality" TEXT,
    "iosUrl" TEXT,
    "androidUrl" TEXT,

    CONSTRAINT "MovieProvider_pkey" PRIMARY KEY ("movieId","providerId","type","region")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenreOnMovie" (
    "movieId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "GenreOnMovie_pkey" PRIMARY KEY ("movieId","genreId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_internalId_key" ON "Movie"("internalId");

-- CreateIndex
CREATE INDEX "Movie_popularity_idx" ON "Movie"("popularity");

-- CreateIndex
CREATE INDEX "Movie_voteAverage_idx" ON "Movie"("voteAverage");

-- CreateIndex
CREATE INDEX "Movie_releaseDate_idx" ON "Movie"("releaseDate");

-- CreateIndex
CREATE INDEX "Movie_releaseYear_idx" ON "Movie"("releaseYear");

-- CreateIndex
CREATE INDEX "Movie_type_idx" ON "Movie"("type");

-- CreateIndex
CREATE INDEX "AlternateTitle_movieId_idx" ON "AlternateTitle"("movieId");

-- CreateIndex
CREATE INDEX "ContentRating_movieId_idx" ON "ContentRating"("movieId");

-- CreateIndex
CREATE INDEX "SpokenLanguage_movieId_idx" ON "SpokenLanguage"("movieId");

-- CreateIndex
CREATE INDEX "Rating_movieId_idx" ON "Rating"("movieId");

-- CreateIndex
CREATE INDEX "Rating_source_idx" ON "Rating"("source");

-- CreateIndex
CREATE INDEX "MovieImage_movieId_idx" ON "MovieImage"("movieId");

-- CreateIndex
CREATE INDEX "MovieImage_type_idx" ON "MovieImage"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Reference_movieId_key" ON "Reference"("movieId");

-- CreateIndex
CREATE INDEX "Video_movieId_idx" ON "Video"("movieId");

-- CreateIndex
CREATE INDEX "Video_type_idx" ON "Video"("type");

-- CreateIndex
CREATE INDEX "Actor_movieId_idx" ON "Actor"("movieId");

-- CreateIndex
CREATE INDEX "Actor_actorId_idx" ON "Actor"("actorId");

-- CreateIndex
CREATE INDEX "Actor_priority_idx" ON "Actor"("priority");

-- CreateIndex
CREATE INDEX "Crew_movieId_idx" ON "Crew"("movieId");

-- CreateIndex
CREATE INDEX "Crew_crewId_idx" ON "Crew"("crewId");

-- CreateIndex
CREATE INDEX "Crew_job_idx" ON "Crew"("job");

-- CreateIndex
CREATE INDEX "Production_movieId_idx" ON "Production"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "Provider_displayPriority_idx" ON "Provider"("displayPriority");

-- CreateIndex
CREATE INDEX "MovieProvider_providerId_type_idx" ON "MovieProvider"("providerId", "type");

-- CreateIndex
CREATE INDEX "MovieProvider_type_idx" ON "MovieProvider"("type");

-- CreateIndex
CREATE INDEX "MovieProvider_region_idx" ON "MovieProvider"("region");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "GenreOnMovie_genreId_idx" ON "GenreOnMovie"("genreId");

-- AddForeignKey
ALTER TABLE "AlternateTitle" ADD CONSTRAINT "AlternateTitle_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRating" ADD CONSTRAINT "ContentRating_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpokenLanguage" ADD CONSTRAINT "SpokenLanguage_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieImage" ADD CONSTRAINT "MovieImage_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actor" ADD CONSTRAINT "Actor_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieProvider" ADD CONSTRAINT "MovieProvider_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieProvider" ADD CONSTRAINT "MovieProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenreOnMovie" ADD CONSTRAINT "GenreOnMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenreOnMovie" ADD CONSTRAINT "GenreOnMovie_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
