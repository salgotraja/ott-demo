-- AlterTable
ALTER TABLE "AlternateTitle" ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "ContentRating" ADD COLUMN     "language" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "releaseDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Reference" ADD COLUMN     "tiktokId" TEXT,
ADD COLUMN     "youtubeId" TEXT;

-- AlterTable
ALTER TABLE "TvAlternateTitle" ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "TvContentRating" ADD COLUMN     "language" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "releaseDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TvReference" ADD COLUMN     "tiktokId" TEXT,
ADD COLUMN     "youtubeId" TEXT;

-- CreateIndex
CREATE INDEX "AlternateTitle_country_idx" ON "AlternateTitle"("country");

-- CreateIndex
CREATE INDEX "ContentRating_country_idx" ON "ContentRating"("country");

-- CreateIndex
CREATE INDEX "TvAlternateTitle_country_idx" ON "TvAlternateTitle"("country");

-- CreateIndex
CREATE INDEX "TvContentRating_country_idx" ON "TvContentRating"("country");
