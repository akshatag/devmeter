"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { AuthButton } from "@/components/auth/auth-button";
import { UserProfile } from "@/components/auth/user-profile";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [checkingData, setCheckingData] = useState(true);
  const [error, setError] = useState("");
  const isAuthenticated = status === "authenticated";
  
  // Check if user data already exists on component mount
  useEffect(() => {
    async function checkExistingData() {
      // Only check for existing data if the user is authenticated
      if (isAuthenticated) {
        try {
          const userResponse = await fetch('/api/github/user');
          const userData = await userResponse.json();
          
          if (userData.success && userData.user) {
            // User data exists, redirect to dashboard
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Error checking existing data:', err);
          // Don't set error here, just continue to show the landing page
        }
      }
      setCheckingData(false);
    }
    
    checkExistingData();
  }, [router, isAuthenticated]);
  
  // Function to fetch GitHub data from our API endpoints
  async function fetchGitHubData() {
    // Only proceed if the user is authenticated
    if (!isAuthenticated) {
      setError("Please sign in with GitHub first");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Fetch user data first
      const userResponse = await fetch('/api/github/user');
      const userData = await userResponse.json();
      
      if (!userData.success) {
        throw new Error(userData.message || 'Failed to fetch user data');
      }
      
      // Then fetch metrics data
      const metricsResponse = await fetch('/api/github/metrics');
      const metricsData = await metricsResponse.json();
      
      if (!metricsData.success) {
        throw new Error(metricsData.message || 'Failed to fetch metrics data');
      }
      
      // Redirect to dashboard after successful data fetch
      router.push('/dashboard');
    } catch (err) {
      console.error('Error fetching GitHub data:', err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }
  
  if (checkingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Checking for existing data...</h1>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <main className="max-w-md w-full mx-auto text-center">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">DevMeter</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Analyze your GitHub developer metrics and visualize your coding profile
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 mb-8">
          <div className="flex justify-center mb-8">
            <Image
              src="/code-icon.svg"
              alt="Code Icon"
              width={120}
              height={120}
              className="opacity-80"
              priority
              // Fallback to a default icon if the custom one doesn't exist
              onError={(e) => {
                e.currentTarget.src = "/vercel.svg";
                e.currentTarget.className = "dark:invert";
              }}
            />
          </div>
          
          {/* Show user profile if authenticated */}
          {isAuthenticated && session?.user && (
            <div className="mb-6">
              <UserProfile />
            </div>
          )}
          
          {/* Sign in button */}
          <div className="mb-4">
            <AuthButton />
          </div>
          
          <Button 
            className="w-full py-6 text-lg"
            onClick={fetchGitHubData}
            disabled={loading || !isAuthenticated}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fetching Data...
              </span>
            ) : "Analyze My GitHub Profile"}
          </Button>
          
          {error && (
            <div className="mt-6 p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            This will analyze your GitHub profile and calculate metrics based on your activity.
          </p>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>DevMeter analyzes your GitHub activity to generate insights about your coding habits.</p>
          <p className="mt-2">Your data is processed securely and never shared with third parties.</p>
        </div>
      </main>
    </div>
  );
}
