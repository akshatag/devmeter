// Shared type definitions for GitHub data

export type GitHubUserData = {
  githubId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserMetricsData = {
  id?: string;
  userGithubId: string;
  commitFrequency: number;
  linesOfCodeAdded: number;
  linesOfCodeDeleted: number;
  averageCommitSize: number;
  repositoriesAnalyzed: string[];
  dateRangeStart: Date | string;
  dateRangeEnd: Date | string;
  lastCalculated?: Date | string;
  
  // Seniority metrics
  reviewToPRRatio?: number;
  reviewCount?: number;
  accountAgeInYears?: number;
  seniorityScore?: number;
};
