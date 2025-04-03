import { NextResponse } from 'next/server';
import { octokit, fetchGitHubUserData, storeUserMetrics, UserMetricsData } from '../utils';

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
  // Get user's repositories
  const { data: repos } = await octokit.rest.repos.listForUser({
    username,
    per_page: 100,
    sort: 'updated',
  });

  // For the MVP, we're only using basic commit metrics
  // We could expand this in the future to include more metrics like:
  // - Repository count: repos.length
  // - Star count: repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
  // - Fork count: repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
  
  // Get commit activity for the first repo (as an example)
  let commitFrequency = 0;
  let linesAdded = 0;
  let linesDeleted = 0;
  
  if (repos.length > 0) {
    try {
      const firstRepo = repos[0];
      // This is a simplified example - in reality, you'd want to analyze multiple repos
      // and possibly use more detailed API endpoints
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner: username,
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

  return {
    commitFrequency: commitFrequency,
    linesOfCodeAdded: linesAdded,
    linesOfCodeDeleted: linesDeleted,
    averageCommitSize: linesAdded > 0 && commitFrequency > 0 ? linesAdded / commitFrequency : 0,
    repositoriesAnalyzed: repos.map(repo => repo.name),
    dateRangeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    dateRangeEnd: new Date(),
  };
}
