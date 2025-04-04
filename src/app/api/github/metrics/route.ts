import { NextResponse } from 'next/server';
import { octokit, graphqlWithAuth, fetchGitHubUserData, storeUserMetrics, UserMetricsData } from '../utils';

// Define type for the GraphQL response
type GitHubGraphQLResponse = {
  pullRequests: {
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
      }>;
    };
  };
};

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

export async function GET() {
  try {
    // For demo purposes, we'll use a fixed GitHub username
    // In a real app, this might come from the authenticated user or a query parameter
    const username = 'akshatag'; // Example username - replace with your own or make dynamic

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
    reviews: { issueCount: 0 },
    user: { 
      repositories: { 
        totalCount: 0,
        nodes: []
      } 
    }
  };
  
  try {
    // Using GraphQL to get both PR count and review count in a single query
    result = await graphqlWithAuth<GitHubGraphQLResponse>(`
      query ($username: String!) {
        # Get PRs authored by the user
        pullRequests: search(query: "author:$username type:pr", type: ISSUE, first: 1) {
          issueCount
        }
        # Get PRs reviewed by the user
        reviews: search(query: "reviewed-by:$username type:pr", type: ISSUE, first: 1) {
          issueCount
        }
        # Get user data including repositories
        user(login: $username) {
          repositories(first: 100) {
            totalCount
            nodes {
              name
              owner {
                login
              }
            }
          }
        }
      }
    `, {
      username: username
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
  return {
    userGithubId: userProfile.id.toString(), // Add the userGithubId from the user profile
    commitFrequency: commitFrequency,
    linesOfCodeAdded: linesAdded,
    linesOfCodeDeleted: linesDeleted,
    averageCommitSize: linesAdded > 0 && commitFrequency > 0 ? linesAdded / commitFrequency : 0,
    repositoriesAnalyzed: repos.map((repo: { name: string }) => repo.name),
    dateRangeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    dateRangeEnd: new Date(),
    // Seniority metrics
    reviewToPRRatio: reviewToPRRatio,
    reviewCount: reviewCount,
    accountAgeInYears: accountAgeInYears,
    seniorityScore: seniorityScore,
  };
}
