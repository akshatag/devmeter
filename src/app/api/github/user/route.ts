import { NextResponse } from 'next/server';
import { fetchGitHubUserData, storeUserData } from '../utils';

export async function GET() {
  try {
    // For demo purposes, we'll use a fixed GitHub username
    // In a real app, this might come from the authenticated user or a query parameter
    const username = 'akshatag'; // Example username - replace with your own or make dynamic

    // Step 1: Fetch user data from GitHub
    const userData = await fetchGitHubUserData(username);
    
    // Step 2: Store or update user in the database
    const user = await storeUserData(userData);

    return NextResponse.json({ 
      success: true, 
      message: 'GitHub user data fetched and stored successfully',
      user
    });
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch GitHub user data',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
