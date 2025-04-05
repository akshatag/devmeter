import { Octokit } from 'octokit';
import { PrismaClient } from '@prisma/client';
import { GitHubUserData, UserMetricsData } from '@/types/github';
import { getGitHubToken } from '@/lib/auth';

// Create shared instances to be reused across API routes
export const prisma = new PrismaClient();

/**
 * Create an Octokit instance with the authenticated user's token
 * Falls back to the environment token if no user token is available
 */
export async function getOctokit() {
  // Try to get the authenticated user's token first
  const authToken = await getGitHubToken();
  
  return new Octokit({
    auth: authToken || process.env.GITHUB_TOKEN,
  });
}

/**
 * Create a GraphQL client with the authenticated user's token
 * Falls back to the environment token if no user token is available
 */
export async function getGraphQLClient() {
  const authToken = await getGitHubToken();
  const token = authToken || process.env.GITHUB_TOKEN;
  
  const octokit = await getOctokit();
  return octokit.graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });
}

// Re-export types for convenience
export type { GitHubUserData, UserMetricsData };

// Shared utility functions
export async function fetchGitHubUserData(username: string): Promise<GitHubUserData> {
  // Get Octokit instance with the authenticated user's token
  const octokit = await getOctokit();
  
  // Fetch basic user profile from GitHub
  const { data: user } = await octokit.rest.users.getByUsername({
    username,
  });

  return {
    githubId: user.id.toString(),
    username: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    email: user.email,
  };
}



export async function storeUserMetrics(userGithubId: string, metrics: UserMetricsData) {
  // Upsert metrics data
  return prisma.userMetrics.upsert({
    where: { userGithubId },
    update: {
      lastCalculated: new Date(),
      commitFrequency: metrics.commitFrequency,
      linesOfCodeAdded: metrics.linesOfCodeAdded,
      linesOfCodeDeleted: metrics.linesOfCodeDeleted,
      averageCommitSize: metrics.averageCommitSize,
      repositoriesAnalyzed: metrics.repositoriesAnalyzed,
      dateRangeStart: metrics.dateRangeStart,
      dateRangeEnd: metrics.dateRangeEnd,
      // Seniority metrics
      reviewToPRRatio: metrics.reviewToPRRatio,
      reviewCount: metrics.reviewCount,
      accountAgeInYears: metrics.accountAgeInYears,
      seniorityScore: metrics.seniorityScore,
      // Versatility metrics
      languageDiversity: metrics.languageDiversity,
      contributionTypeDiversity: metrics.contributionTypeDiversity,
      repositoryDiversity: metrics.repositoryDiversity,
      versatilityScore: metrics.versatilityScore,
      languages: metrics.languages || [],
      // Productivity metrics
      contributionFrequency: metrics.contributionFrequency,
      activeDays: metrics.activeDays,
      productivityScore: metrics.productivityScore,
      // Code Quality metrics
      prMergeRatio: metrics.prMergeRatio,
      prRevisions: metrics.prRevisions,
      codeQualityScore: metrics.codeQualityScore,
      // Community Impact metrics
      starCount: metrics.starCount,
      communityImpactScore: metrics.communityImpactScore,
    },
    create: {
      userGithubId,
      lastCalculated: new Date(),
      commitFrequency: metrics.commitFrequency,
      linesOfCodeAdded: metrics.linesOfCodeAdded,
      linesOfCodeDeleted: metrics.linesOfCodeDeleted,
      averageCommitSize: metrics.averageCommitSize,
      repositoriesAnalyzed: metrics.repositoriesAnalyzed,
      dateRangeStart: metrics.dateRangeStart,
      dateRangeEnd: metrics.dateRangeEnd,
      // Seniority metrics
      reviewToPRRatio: metrics.reviewToPRRatio,
      reviewCount: metrics.reviewCount,
      accountAgeInYears: metrics.accountAgeInYears,
      seniorityScore: metrics.seniorityScore,
      // Versatility metrics
      languageDiversity: metrics.languageDiversity,
      contributionTypeDiversity: metrics.contributionTypeDiversity,
      repositoryDiversity: metrics.repositoryDiversity,
      versatilityScore: metrics.versatilityScore,
      languages: metrics.languages || [],
      // Productivity metrics
      contributionFrequency: metrics.contributionFrequency,
      activeDays: metrics.activeDays,
      productivityScore: metrics.productivityScore,
      // Code Quality metrics
      prMergeRatio: metrics.prMergeRatio,
      prRevisions: metrics.prRevisions,
      codeQualityScore: metrics.codeQualityScore,
      // Community Impact metrics
      starCount: metrics.starCount,
      communityImpactScore: metrics.communityImpactScore,
    },
  });
}
