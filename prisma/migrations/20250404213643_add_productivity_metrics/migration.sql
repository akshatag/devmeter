-- AlterTable
ALTER TABLE "UserMetrics" ADD COLUMN     "activeDays" INTEGER,
ADD COLUMN     "contributionFrequency" DOUBLE PRECISION,
ADD COLUMN     "productivityScore" INTEGER;
