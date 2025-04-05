"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GitHubUserData, UserMetricsData } from "@/types/github";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<GitHubUserData | null>(null);
  const [metricsData, setMetricsData] = useState<UserMetricsData | null>(null);
  const [error, setError] = useState("");
  
  // Function to fetch GitHub data from our API endpoints
  async function fetchGitHubData() {
    setLoading(true);
    setError("");
    
    try {
      // Fetch user data first
      const userResponse = await fetch('/api/github/user');
      const userData = await userResponse.json();
      
      if (!userData.success) {
        throw new Error(userData.message || 'Failed to fetch user data');
      }
      
      setUserData(userData.user);
      
      // Then fetch metrics data
      const metricsResponse = await fetch('/api/github/metrics');
      const metricsData = await metricsResponse.json();
      
      if (!metricsData.success) {
        throw new Error(metricsData.message || 'Failed to fetch metrics data');
      }
      
      setMetricsData(metricsData.metrics);
    } catch (err) {
      console.error('Error fetching GitHub data:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Button asChild variant="default">
            <a
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={20}
                height={20}
              />
              Deploy now
            </a>
          </Button>
          
          <Button asChild variant="outline">
            <a
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read our docs
            </a>
          </Button>
          
          <Button 
            variant="secondary" 
            className="mt-2 sm:mt-0"
            onClick={fetchGitHubData}
            disabled={loading}
          >
            {loading ? "Loading..." : "Fetch GitHub Data"}
          </Button>
          
          {/* Display results */}
          {(userData || metricsData) && (
            <div className="mt-8 w-full max-w-3xl p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
              <h2 className="text-2xl font-bold mb-4">GitHub Data</h2>
              
              {userData && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">User Profile</h3>
                  <div className="flex items-center gap-4 mb-4">
                    {userData.avatarUrl && (
                      <Image 
                        src={userData.avatarUrl} 
                        alt={`${userData.username}'s avatar`} 
                        width={64} 
                        height={64} 
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{userData.name || userData.username}</p>
                      <p className="text-sm text-muted-foreground">@{userData.username}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {metricsData && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">Metrics</h3>
                  
                  {/* Seniority Metrics Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Seniority Score</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full" 
                        style={{ width: `${metricsData.seniorityScore || 0}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Review to PR Ratio</p>
                        <p className="text-2xl font-bold">{metricsData.reviewToPRRatio?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Review Count</p>
                        <p className="text-2xl font-bold">{metricsData.reviewCount || 0}</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Account Age (Years)</p>
                        <p className="text-2xl font-bold">{metricsData.accountAgeInYears?.toFixed(1) || '0.0'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Versatility Metrics Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Versatility Score</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div 
                        className="bg-green-600 h-4 rounded-full" 
                        style={{ width: `${metricsData.versatilityScore || 0}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Language Diversity</p>
                        <p className="text-2xl font-bold">{(metricsData.languageDiversity || 0).toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Contribution Type Diversity</p>
                        <p className="text-2xl font-bold">{(metricsData.contributionTypeDiversity || 0).toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Repository Diversity</p>
                        <p className="text-2xl font-bold">{(metricsData.repositoryDiversity || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    {metricsData.languages && metricsData.languages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Languages Used:</p>
                        <div className="flex flex-wrap gap-2">
                          {metricsData.languages.map((lang, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded-md">{lang}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Productivity Metrics Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Productivity Score</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div 
                        className="bg-purple-600 h-4 rounded-full" 
                        style={{ width: `${metricsData.productivityScore || 0}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Contribution Frequency</p>
                        <p className="text-2xl font-bold">{(metricsData.contributionFrequency || 0).toFixed(1)}<span className="text-sm ml-1">per week</span></p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Active Days</p>
                        <p className="text-2xl font-bold">{metricsData.activeDays || 0}<span className="text-sm ml-1">days</span></p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Code Quality Metrics Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Code Quality Score</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div 
                        className="bg-amber-600 h-4 rounded-full" 
                        style={{ width: `${metricsData.codeQualityScore || 0}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">PR Merge Ratio</p>
                        <p className="text-2xl font-bold">{((metricsData.prMergeRatio || 0) * 100).toFixed(0)}<span className="text-sm ml-1">%</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Percentage of PRs that were merged</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">PR Revisions</p>
                        <p className="text-2xl font-bold">{(metricsData.prRevisions || 0).toFixed(1)}<span className="text-sm ml-1">avg</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Average revisions per PR</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Community Impact Metrics Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Community Impact Score</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div 
                        className="bg-indigo-600 h-4 rounded-full" 
                        style={{ width: `${metricsData.communityImpactScore || 0}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm font-medium text-muted-foreground">Star Count</p>
                        <p className="text-2xl font-bold">{metricsData.starCount || 0}<span className="text-sm ml-1">stars</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Total stars on repositories with contributions</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity Metrics Section */}
                  <h4 className="text-lg font-semibold mb-2">Activity Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md">
                      <p className="text-sm font-medium text-muted-foreground">Commit Frequency</p>
                      <p className="text-2xl font-bold">{metricsData.commitFrequency}</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="text-sm font-medium text-muted-foreground">Lines Added</p>
                      <p className="text-2xl font-bold">{metricsData.linesOfCodeAdded}</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="text-sm font-medium text-muted-foreground">Lines Deleted</p>
                      <p className="text-2xl font-bold">{metricsData.linesOfCodeDeleted}</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="text-sm font-medium text-muted-foreground">Avg. Commit Size</p>
                      <p className="text-2xl font-bold">{metricsData.averageCommitSize.toFixed(0)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Based on {metricsData.repositoriesAnalyzed.length} repositories analyzed
                  </p>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
              {error}
            </div>
          )}
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
