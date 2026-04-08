-- CreateTable
CREATE TABLE "TvReview" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "reviewId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'tmdb',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TvReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TvReview_tvShowId_idx" ON "TvReview"("tvShowId");

-- CreateIndex
CREATE UNIQUE INDEX "TvReview_tvShowId_reviewId_key" ON "TvReview"("tvShowId", "reviewId");

-- AddForeignKey
ALTER TABLE "TvReview" ADD CONSTRAINT "TvReview_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
