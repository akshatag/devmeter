-- AlterTable
ALTER TABLE "UserMetrics" ADD COLUMN     "contributionTypeDiversity" DOUBLE PRECISION,
ADD COLUMN     "languageDiversity" DOUBLE PRECISION,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "repositoryDiversity" DOUBLE PRECISION,
ADD COLUMN     "versatilityScore" INTEGER;
