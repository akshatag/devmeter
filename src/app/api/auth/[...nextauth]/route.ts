import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaClient } from "@prisma/client";

// Define custom types for GitHub profile
interface GitHubProfile {
  id?: string | number;
  login?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

// Extend the types for NextAuth.js
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string | undefined;
  }
}




const prisma = new PrismaClient();

// For NextAuth.js v5, let's use a simpler approach without the Prisma adapter
// This will use JWT strategy instead of database strategy

export const authOptions: NextAuthConfig = {
  debug: true,
  // Explicitly set the base URL for callbacks
  trustHost: true,
  // Remove the adapter to use JWT strategy instead of database strategy
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Request the scopes needed for GitHub API access
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token and refresh_token to the token
      if (account) {
        // Add custom properties to the token
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
      // Send properties to the client
      if (session.user) {
        // Add custom properties to the session
        session.user.id = token.sub || "";
        // Use type assertion with fallback to empty string
        session.accessToken = (token.accessToken as string | undefined) || "";
      }
      return session;
    },
    async signIn({ user, profile }) {
      // Basic validation
      if (!user.email) {
        return false;
      }

      try {
        if (profile) {
          // Cast profile to GitHub profile type
          const githubProfile = profile as unknown as GitHubProfile;
          const githubId = String(githubProfile.id || '');
          
          // Since we're using JWT strategy, we don't need to manually create users
          // in the database. The user data will be stored in the JWT token.
          // We can still store user data in our database for our application needs
          // but it's not required for authentication.
          
          // We can use upsert to create or update the user
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
        // Allow sign in even if database operations fail
        // since we're using JWT strategy
        return true;
      }
    },
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
  // Remove this section as it creates circular references
  session: {
    strategy: "jwt",
  },
};

// Create the auth handler with minimal configuration
export const { auth, handlers: { GET, POST } } = NextAuth(authOptions);
