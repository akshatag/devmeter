import { Octokit } from 'octokit';
import { PrismaClient } from '@prisma/client';
import { GitHubUserData, UserMetricsData } from '@/types/github';

// Create shared instances to be reused across API routes
export const prisma = new PrismaClient();
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Re-export types for convenience
export type { GitHubUserData, UserMetricsData };

// Shared utility functions
export async function fetchGitHubUserData(username: string): Promise<GitHubUserData> {
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

export async function storeUserData(userData: GitHubUserData) {
  // Upsert user data (create if not exists, update if exists)
  return prisma.user.upsert({
    where: { githubId: userData.githubId },
    update: {
      username: userData.username,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
      email: userData.email,
    },
    create: {
      githubId: userData.githubId,
      username: userData.username,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
      email: userData.email,
    },
  });
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
    },
  });
}
