-- AlterTable
ALTER TABLE "UserMetrics" ADD COLUMN     "codeQualityScore" INTEGER,
ADD COLUMN     "prMergeRatio" DOUBLE PRECISION,
ADD COLUMN     "prRevisions" DOUBLE PRECISION;
