import { NextResponse } from 'next/server';
import { fetchGitHubUserData, getOctokit } from '../utils';
import { PrismaClient } from '@prisma/client';
import { GitHubUserData } from '@/types/github';
import { auth } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

/**
 * Store user data in the database
 * 
 * @param userData GitHub user data to store
 * @returns The stored user record
 */
async function storeUserData(userData: GitHubUserData) {
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
    
    // Get the authenticated user's GitHub username from their session
    const octokit = await getOctokit();
    const { data: githubUser } = await octokit.rest.users.getAuthenticated();
    const username = githubUser.login;
    
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
