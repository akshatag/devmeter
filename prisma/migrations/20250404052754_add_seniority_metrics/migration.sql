-- CreateTable
CREATE TABLE "User" (
    "githubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "name" TEXT,
    "email" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("githubId")
);

-- CreateTable
CREATE TABLE "UserMetrics" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userGithubId" TEXT NOT NULL,
    "commitFrequency" DOUBLE PRECISION,
    "linesOfCodeAdded" INTEGER,
    "linesOfCodeDeleted" INTEGER,
    "averageCommitSize" DOUBLE PRECISION,
    "dailyActiveHours" DOUBLE PRECISION,
    "weeklyActiveHours" DOUBLE PRECISION,
    "weekendActivity" DOUBLE PRECISION,
    "pullRequestsCreated" INTEGER,
    "pullRequestsReviewed" INTEGER,
    "averageReviewTime" DOUBLE PRECISION,
    "testCoverage" DOUBLE PRECISION,
    "bugFixRate" DOUBLE PRECISION,
    "reviewToPRRatio" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "accountAgeInYears" DOUBLE PRECISION,
    "seniorityScore" INTEGER,
    "repositoriesAnalyzed" TEXT[],
    "dateRangeStart" TIMESTAMP(3),
    "dateRangeEnd" TIMESTAMP(3),

    CONSTRAINT "UserMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMetrics_userGithubId_key" ON "UserMetrics"("userGithubId");

-- AddForeignKey
ALTER TABLE "UserMetrics" ADD CONSTRAINT "UserMetrics_userGithubId_fkey" FOREIGN KEY ("userGithubId") REFERENCES "User"("githubId") ON DELETE RESTRICT ON UPDATE CASCADE;
