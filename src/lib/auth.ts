// For NextAuth.js v5, we need to use a different approach
import { cookies } from 'next/headers';

// Create a simple session getter that works without circular dependencies
export async function getSession() {
  // For server components, we'll use a direct API call
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
    headers: {
      cookie: cookies().toString(),
    },
  });
  
  const session = await response.json();
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function getGitHubToken() {
  const session = await getSession();
  
  // Return the access token if it exists, or undefined if it doesn't
  return session?.accessToken || undefined;
}
