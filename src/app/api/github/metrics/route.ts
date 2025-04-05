import { NextResponse } from 'next/server';
import { getOctokit, getGraphQLClient, fetchGitHubUserData, storeUserMetrics, UserMetricsData } from '../utils';
import { auth } from '@/app/api/auth/[...nextauth]/route';

// Define type for the GraphQL response
type GitHubGraphQLResponse = {
  pullRequests: {
    issueCount: number;
  };
  mergedPullRequests: {
    issueCount: number;
  };
  reviews: {
    issueCount: number;
  };
  user: {
    repositories: {
      totalCount: number;
      nodes: Array<{
        name: string;
        owner: {
          login: string;
        };
        stargazerCount: number;
        languages: {
          edges: Array<{
            size: number;
            node: {
              name: string;
            };
          }>;
        };
        defaultBranchRef: {
          target: {
            history: {
              totalCount: number;
            };
          };
        };
      }>;
    };
    contributionsCollection: {
      commitContributionsByRepository: Array<{
        repository: {
          name: string;
          primaryLanguage: {
            name: string;
          } | null;
        };
        contributions: {
          totalCount: number;
        };
      }>;
      pullRequestContributionsByRepository: Array<{
        repository: {
          name: string;
        };
        contributions: {
          totalCount: number;
        };
      }>;
      pullRequestReviewContributionsByRepository: Array<{
        repository: {
          name: string;
        };
        contributions: {
          totalCount: number;
        };
      }>;
      issueContributionsByRepository: Array<{
        repository: {
          name: string;
        };
        contributions: {
          totalCount: number;
        };
      }>;
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{
          contributionDays: Array<{
            date: string;
            contributionCount: number;
          }>;
        }>;
      };
    };
  };
};

/**
 * Calculate Shannon diversity index for a set of counts
 * 
 * @param counts - Array of counts for each category
 * @returns Shannon diversity index value between 0-1
 */
function calculateShannonDiversityIndex(counts: number[]): number {
  // Return 0 if there are no counts or only one category
  if (!counts.length || counts.every(count => count === 0)) {
    return 0;
  }
  
  // Calculate total count
  const totalCount = counts.reduce((sum, count) => sum + count, 0);
  
  // Calculate Shannon entropy
  const shannonEntropy = counts
    .filter(count => count > 0) // Ignore categories with zero count
    .reduce((entropy, count) => {
      const proportion = count / totalCount;
      return entropy - proportion * Math.log(proportion);
    }, 0);
  
  // Calculate maximum possible entropy (when all categories are equally represented)
  const maxEntropy = Math.log(counts.filter(count => count > 0).length);
  
  // Return normalized entropy (between 0 and 1)
  return maxEntropy > 0 ? shannonEntropy / maxEntropy : 0;
}

/**
 * Calculate seniority score based on GitHub metrics
 * 
 * @param reviewToPRRatio - Ratio of reviews to pull requests
 * @param reviewCount - Total number of reviews
 * @param accountAgeInYears - Account age in years
 * @returns Seniority score between 0-100
 */
function calculateSeniorityScore(
  reviewToPRRatio: number,
  reviewCount: number,
  accountAgeInYears: number
): number {
  // normalize Review to PR ratio to 3 and multiply by 40
  const normalizedReviewToPRRatio = Math.min(reviewToPRRatio / 3, 1) * 40;
  
  // normalize total reviews to 100 and multiply by 30
  const normalizedReviewCount = Math.min(reviewCount / 100, 1) * 30;
  
  // normalize Github account age to 10 and multiply by 30
  const normalizedAccountAge = Math.min(accountAgeInYears / 10, 1) * 30;
  
  // Calculate final score and round to nearest integer
  return Math.round(
    normalizedReviewToPRRatio + normalizedReviewCount + normalizedAccountAge
  );
}

/**
 * Calculate versatility score based on GitHub metrics
 * 
 * @param result - GitHub GraphQL response data
 * @returns Object containing versatility metrics and final score
 */
function calculateVersatilityScore(result: GitHubGraphQLResponse): {
  languageDiversity: number;
  contributionTypeDiversity: number;
  repositoryDiversity: number;
  versatilityScore: number;
  languages: string[];
} {
  // 1. Calculate language diversity
  const languageCounts = new Map<string, number>();
  
  // Count languages from commit contributions only
  result.user.contributionsCollection.commitContributionsByRepository.forEach(contribution => {
    if (contribution.repository.primaryLanguage?.name) {
      const language = contribution.repository.primaryLanguage.name;
      const count = contribution.contributions.totalCount;
      languageCounts.set(language, (languageCounts.get(language) || 0) + count);
    }
  });
  
  // Get unique languages and normalize language diversity to 10
  const uniqueLanguages = Array.from(languageCounts.keys());
  const languageDiversity = Math.min(uniqueLanguages.length / 10, 1);
  
  // 2. Calculate contribution type diversity using Shannon index
  const commitCount = result.user.contributionsCollection.commitContributionsByRepository
    .reduce((sum, repo) => sum + repo.contributions.totalCount, 0);
  
  const prCount = result.user.contributionsCollection.pullRequestContributionsByRepository
    .reduce((sum, repo) => sum + repo.contributions.totalCount, 0);
  
  const reviewCount = result.user.contributionsCollection.pullRequestReviewContributionsByRepository
    .reduce((sum, repo) => sum + repo.contributions.totalCount, 0);
  
  const issueCount = result.user.contributionsCollection.issueContributionsByRepository
    .reduce((sum, repo) => sum + repo.contributions.totalCount, 0);
  
  const contributionTypeCounts = [commitCount, prCount, reviewCount, issueCount];
  const contributionTypeDiversity = calculateShannonDiversityIndex(contributionTypeCounts);
  
  // 3. Calculate repository diversity using Shannon index
  const repoContributionCounts = new Map<string, number>();
  
  // Count PR contributions by repository only (as per spec)
  result.user.contributionsCollection.pullRequestContributionsByRepository.forEach(contribution => {
    const repoName = contribution.repository.name;
    const count = contribution.contributions.totalCount;
    repoContributionCounts.set(repoName, (repoContributionCounts.get(repoName) || 0) + count);
  });
  
  const repositoryContributionCounts = Array.from(repoContributionCounts.values());
  const repositoryDiversity = calculateShannonDiversityIndex(repositoryContributionCounts);
  
  // 4. Calculate final versatility score
  // Normalize language diversity to 10 and multiply by 40
  const normalizedLanguageDiversity = languageDiversity * 40;
  
  // Multiply contribution type diversity by 30
  const normalizedContributionTypeDiversity = contributionTypeDiversity * 30;
  
  // Multiply repository diversity by 30
  const normalizedRepositoryDiversity = repositoryDiversity * 30;
  
  // Calculate final score and round to nearest integer
  const versatilityScore = Math.round(
    normalizedLanguageDiversity + 
    normalizedContributionTypeDiversity + 
    normalizedRepositoryDiversity
  );
  
  return {
    languageDiversity,
    contributionTypeDiversity,
    repositoryDiversity,
    versatilityScore,
    languages: uniqueLanguages
  };
}

/**
 * Calculate productivity score based on GitHub contribution calendar data
 * 
 * @param result - GitHub GraphQL response data containing contribution calendar
 * @returns Object containing productivity metrics and final score
 */
function calculateProductivityScore(result: GitHubGraphQLResponse): {
  contributionFrequency: number;
  activeDays: number;
  productivityScore: number;
} {
  // Default values if contribution calendar data is missing
  let contributionFrequency = 0;
  let activeDays = 0;
  
  // Check if we have contribution calendar data
  if (result.user.contributionsCollection.contributionCalendar) {
    const calendar = result.user.contributionsCollection.contributionCalendar;
    
    // 1. Calculate total contributions in the last year
    const totalContributions = calendar.totalContributions;
    
    // 2. Calculate contribution frequency (contributions per week)
    // There are 52 weeks in a year
    contributionFrequency = totalContributions / 52;
    
    // 3. Calculate active days (days with at least one contribution)
    const allDays = calendar.weeks.flatMap((week: { contributionDays: Array<{ date: string; contributionCount: number }> }) => week.contributionDays);
    activeDays = allDays.filter((day: { date: string; contributionCount: number }) => day.contributionCount > 0).length;
  }
  
  // 4. Calculate productivity score
  // Normalize contribution frequency to 30 and multiply by 50
  const normalizedContributionFrequency = Math.min(contributionFrequency / 30, 1) * 50;
  
  // Normalize active days to 365 and multiply by 50
  const normalizedActiveDays = Math.min(activeDays / 365, 1) * 50;
  
  // Calculate final score and round to nearest integer
  const productivityScore = Math.round(
    normalizedContributionFrequency + normalizedActiveDays
  );
  
  return {
    contributionFrequency,
    activeDays,
    productivityScore
  };
}

/**
 * Calculate code quality score based on GitHub pull request metrics
 * 
 * @param totalPRs - Total number of pull requests created
 * @param mergedPRs - Number of pull requests that were merged
 * @param averagePRRevisions - Average number of revisions per pull request
 * @returns Object containing code quality metrics and final score
 */
function calculateCodeQualityScore(
  totalPRs: number,
  mergedPRs: number,
  averagePRRevisions: number
): {
  prMergeRatio: number;
  prRevisions: number;
  codeQualityScore: number;
} {
  // Calculate PR merge ratio (percentage of opened PRs that were merged)
  const prMergeRatio = totalPRs > 0 ? mergedPRs / totalPRs : 0;
  
  // Calculate normalized PR revisions score
  // Divide PR revisions by 2, normalize to 1 (lower is better)
  const normalizedPRRevisions = Math.min(1, 2/averagePRRevisions);
  
  // Calculate final code quality score
  // PR merge ratio * 40 + normalized PR revisions * 60
  const codeQualityScore = Math.round(
    (prMergeRatio * 40) + (normalizedPRRevisions * 60)
  );
  
  return {
    prMergeRatio,
    prRevisions: averagePRRevisions,
    codeQualityScore
  };
}

/**
 * Calculate community impact score based on GitHub repository stars
 * 
 * @param repositories - Array of repository objects with star counts
 * @returns Object containing community impact metrics and final score
 */
function calculateCommunityImpactScore(
  repositories: Array<{ name: string; stargazerCount: number }>
): {
  starCount: number;
  communityImpactScore: number;
} {
  // Calculate total star count across all repositories
  const starCount = repositories.reduce((total, repo) => total + repo.stargazerCount, 0);
  
  // Normalize star count to 500 (max value) and multiply by 100 to get score
  const normalizedStarCount = Math.min(1, starCount / 500);
  const communityImpactScore = Math.round(normalizedStarCount * 100);
  
  return {
    starCount,
    communityImpactScore
  };
}

/**
 * Calculate DevMeter score based on individual metrics
 * 
 * @param seniorityScore - Seniority score (0-100)
 * @param versatilityScore - Versatility score (0-100)
 * @param productivityScore - Productivity score (0-100)
 * @param codeQualityScore - Code quality score (0-100)
 * @param communityImpactScore - Community impact score (0-100)
 * @returns Object containing DevMeter score and tier
 */
function calculateDevMeterScore(
  seniorityScore: number = 0,
  versatilityScore: number = 0,
  productivityScore: number = 0,
  codeQualityScore: number = 0,
  communityImpactScore: number = 0
): {
  devMeterScore: number;
  devMeterTier: string;
} {
  // Calculate weighted score according to the formula:
  // Seniority/100 * 15 + Productivity/100 * 25 + Code Quality/100 * 30 + Versatility/100 * 20 + Community Impact/100 * 10
  const weightedScore = 
    (seniorityScore / 100 * 15) + 
    (productivityScore / 100 * 25) + 
    (codeQualityScore / 100 * 30) + 
    (versatilityScore / 100 * 20) + 
    (communityImpactScore / 100 * 10);
  
  // Round to nearest integer
  const finalScore = Math.round(weightedScore);
  
  // Determine tier based on score ranges
  let tier = "Amateur";
  
  if (finalScore >= 91) {
    tier = "Cracked";
  } else if (finalScore >= 81) {
    tier = "Master";
  } else if (finalScore >= 61) {
    tier = "Elite";
  } else if (finalScore >= 41) {
    tier = "Adept";
  } else if (finalScore >= 21) {
    tier = "Novice";
  }
  
  return {
    devMeterScore: finalScore,
    devMeterTier: tier
  };
}

export async function GET() {
  try {
    // Get the authenticated user's session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    // Get the authenticated user's GitHub username
    const octokit = await getOctokit();
    const { data: githubUser } = await octokit.rest.users.getAuthenticated();
    const username = githubUser.login;

    // Step 1: Fetch user data to get the GitHub ID
    const userData = await fetchGitHubUserData(username);
    
    // Step 2: Calculate metrics based on user's GitHub activity
    const metrics = await calculateUserMetrics(username);
    
    // Step 3: Store or update metrics in the database
    const userMetrics = await storeUserMetrics(userData.githubId, metrics);

    return NextResponse.json({ 
      success: true, 
      message: 'GitHub metrics calculated and stored successfully',
      metrics: userMetrics
    });
  } catch (error) {
    console.error('Error calculating GitHub metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to calculate GitHub metrics',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

async function calculateUserMetrics(username: string): Promise<UserMetricsData> {
  // Get Octokit instance with the authenticated user's token
  const octokit = await getOctokit();
  
  // Get user profile to calculate account age
  const { data: userProfile } = await octokit.rest.users.getByUsername({
    username,
  });

  // Calculate account age in years
  const createdAt = new Date(userProfile.created_at);
  const currentDate = new Date();
  const accountAgeInYears = (currentDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365.25);



  // Get pull requests and reviews using GraphQL
  let pullRequestCount = 0;
  let reviewCount = 0;
  
  // Initialize result with default values
  let result: GitHubGraphQLResponse = {
    pullRequests: { issueCount: 0 },
    mergedPullRequests: { issueCount: 0 },
    reviews: { issueCount: 0 },
    user: { 
      repositories: { 
        totalCount: 0,
        nodes: []
      },
      contributionsCollection: {
        commitContributionsByRepository: [],
        pullRequestContributionsByRepository: [],
        pullRequestReviewContributionsByRepository: [],
        issueContributionsByRepository: [],
        contributionCalendar: {
          totalContributions: 0,
          weeks: []
        }
      }
    }
  };
  
  try {
    // Using GraphQL to get data for seniority and versatility metrics
    // Calculate date from 1 year ago for the contribution calendar
    const fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get GraphQL client with the authenticated user's token
    const graphqlWithAuth = await getGraphQLClient();
    
    result = await graphqlWithAuth<GitHubGraphQLResponse>(`
      query ($username: String!, $fromDate: DateTime!) {
        # Get PRs authored by the user
        pullRequests: search(query: "author:$username type:pr", type: ISSUE, first: 1) {
          issueCount
        }
        # Get merged PRs authored by the user
        mergedPullRequests: search(query: "author:$username type:pr is:merged", type: ISSUE, first: 1) {
          issueCount
        }
        # Get PRs reviewed by the user
        reviews: search(query: "reviewed-by:$username type:pr", type: ISSUE, first: 1) {
          issueCount
        }
        # Get user data including repositories and contributions
        user(login: $username) {
          repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR]) {
            totalCount
            nodes {
              name
              owner {
                login
              }
              # Get star count for community impact metric
              stargazerCount
              # Get languages used in each repository
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    name
                  }
                }
              }
              # Get commit count for each repository
              defaultBranchRef {
                target {
                  ... on Commit {
                    history {
                      totalCount
                    }
                  }
                }
              }
            }
          }
          # Get contribution data by repository and type for the past year
          contributionsCollection(from: $fromDate) {
            # Commit contributions by repository
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                name
                primaryLanguage {
                  name
                }
              }
              contributions {
                totalCount
              }
            }
            # PR contributions by repository
            pullRequestContributionsByRepository(maxRepositories: 100) {
              repository {
                name
              }
              contributions {
                totalCount
              }
            }
            # Review contributions by repository
            pullRequestReviewContributionsByRepository(maxRepositories: 100) {
              repository {
                name
              }
              contributions {
                totalCount
              }
            }
            # Issue contributions by repository
            issueContributionsByRepository(maxRepositories: 100) {
              repository {
                name
              }
              contributions {
                totalCount
              }
            }
            # Contribution calendar for productivity metrics
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `, {
      username: username,
      fromDate: fromDate
    });
    
    pullRequestCount = result.pullRequests.issueCount;
    reviewCount = result.reviews.issueCount;
    
    console.log(`Found ${pullRequestCount} PRs and ${reviewCount} reviews for ${username}`);
  } catch (error) {
    console.error(`Error fetching GitHub data via GraphQL: ${error}`);
  }

  // Calculate review to PR ratio
  const reviewToPRRatio = pullRequestCount > 0 ? reviewCount / pullRequestCount : 0;

  // Calculate seniority score using the dedicated function
  const seniorityScore = calculateSeniorityScore(reviewToPRRatio, reviewCount, accountAgeInYears);
  
  // Calculate versatility metrics using the dedicated function
  const versatilityMetrics = calculateVersatilityScore(result);

  // Get commit activity for the first repo (as an example)
  let commitFrequency = 0;
  let linesAdded = 0;
  let linesDeleted = 0;

  // Get repositories from the GraphQL response
  const repos = result.user.repositories.nodes || [];
  
  if (repos.length > 0) {
    try {
      const firstRepo = repos[0];
      // This is a simplified example - in reality, you'd want to analyze multiple repos
      // and possibly use more detailed API endpoints
      // Get a fresh Octokit instance with the authenticated user's token
      const octokit = await getOctokit();
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner: firstRepo.owner.login,
        repo: firstRepo.name,
        per_page: 100,
      });
      
      commitFrequency = commits.length; // Simplified metric
      
      // For demo purposes, we'll set some placeholder values
      // In a real app, you'd calculate these from commit data
      linesAdded = commitFrequency * 100; // Placeholder
      linesDeleted = commitFrequency * 30; // Placeholder
    } catch (error) {
      console.error(`Error fetching commit data: ${error}`);
      // Continue with default values if we can't get commit data
    }
  }

  // The userGithubId will be provided by the calling function and passed to storeUserMetrics
  // We're just returning the calculated metrics here
  // Calculate productivity metrics using the dedicated function
  const productivityMetrics = calculateProductivityScore(result);
  
  // Calculate code quality metrics
  // For PR revisions, we'll use a placeholder value of 1.5 for now
  // In a real implementation, you would fetch this data from the GitHub API
  const totalPRs = result.pullRequests.issueCount;
  const mergedPRs = result.mergedPullRequests.issueCount;
  const averagePRRevisions = 1.5; // Placeholder - would be calculated from actual PR data
  
  const codeQualityMetrics = calculateCodeQualityScore(totalPRs, mergedPRs, averagePRRevisions);
  
  // Calculate community impact metrics
  // Extract repositories with star counts
  const reposWithStars = repos.map(repo => ({
    name: repo.name,
    stargazerCount: repo.stargazerCount || 0
  }));
  
  const communityImpactMetrics = calculateCommunityImpactScore(reposWithStars);

  // Calculate DevMeter score and tier
  const devMeterMetrics = calculateDevMeterScore(
    seniorityScore,
    versatilityMetrics.versatilityScore,
    productivityMetrics.productivityScore,
    codeQualityMetrics.codeQualityScore,
    communityImpactMetrics.communityImpactScore
  );

  return {
    userGithubId: userProfile.id.toString(), // Add the userGithubId from the user profile
    commitFrequency: commitFrequency,
    linesOfCodeAdded: linesAdded,
    linesOfCodeDeleted: linesDeleted,
    averageCommitSize: linesAdded > 0 && commitFrequency > 0 ? linesAdded / commitFrequency : 0,
    repositoriesAnalyzed: repos.map((repo: { name: string }) => repo.name),
    dateRangeStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    dateRangeEnd: new Date(),
    // Seniority metrics
    reviewToPRRatio: reviewToPRRatio,
    reviewCount: reviewCount,
    accountAgeInYears: accountAgeInYears,
    seniorityScore: seniorityScore,
    // Versatility metrics
    languageDiversity: versatilityMetrics.languageDiversity,
    contributionTypeDiversity: versatilityMetrics.contributionTypeDiversity,
    repositoryDiversity: versatilityMetrics.repositoryDiversity,
    versatilityScore: versatilityMetrics.versatilityScore,
    languages: versatilityMetrics.languages,
    // Productivity metrics
    contributionFrequency: productivityMetrics.contributionFrequency,
    activeDays: productivityMetrics.activeDays,
    productivityScore: productivityMetrics.productivityScore,
    // Code Quality metrics
    prMergeRatio: codeQualityMetrics.prMergeRatio,
    prRevisions: codeQualityMetrics.prRevisions,
    codeQualityScore: codeQualityMetrics.codeQualityScore,
    
    // Community Impact metrics
    starCount: communityImpactMetrics.starCount,
    communityImpactScore: communityImpactMetrics.communityImpactScore,
    
    // DevMeter score and tier
    devMeterScore: devMeterMetrics.devMeterScore,
    devMeterTier: devMeterMetrics.devMeterTier,
  };
}
