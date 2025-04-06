// For NextAuth.js v5, we need to use a different approach
import { cookies } from 'next/headers';
import NextAuth, { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaClient } from "@prisma/client";

// Extend the types for NextAuth.js
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

// Define custom types for GitHub profile
interface GitHubProfile {
  id?: string | number;
  login?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

const prisma = new PrismaClient();

// Create the auth configuration
export const authConfig: NextAuthConfig = {
  debug: true,
  trustHost: true,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.accessToken = (token.accessToken as string | undefined) || "";
      }
      return session;
    },
    async signIn({ user, profile }) {
      if (!user.email) {
        return false;
      }

      try {
        if (profile) {
          const githubProfile = profile as unknown as GitHubProfile;
          const githubId = String(githubProfile.id || '');
          
          await prisma.user.upsert({
            where: { githubId },
            update: {
              name: githubProfile.name || user.name || '',
              email: user.email,
              avatarUrl: githubProfile.avatar_url || '',
            },
            create: {
              githubId,
              username: githubProfile.login || '',
              name: githubProfile.name || user.name || '',
              email: user.email,
              avatarUrl: githubProfile.avatar_url || '',
            },
          });
        }
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return true;
      }
    },
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

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
