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
  
  // Versatility metrics
  languageDiversity?: number;
  contributionTypeDiversity?: number;
  repositoryDiversity?: number;
  versatilityScore?: number;
  languages?: string[];
  
  // Productivity metrics
  contributionFrequency?: number;
  activeDays?: number;
  productivityScore?: number;
  
  // Code Quality metrics
  prMergeRatio?: number;
  prRevisions?: number;
  codeQualityScore?: number;
};
