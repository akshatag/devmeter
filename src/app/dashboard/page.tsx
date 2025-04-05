"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GitHubUserData, UserMetricsData } from "@/types/github";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<GitHubUserData | null>(null);
  const [metricsData, setMetricsData] = useState<UserMetricsData | null>(null);
  const [error, setError] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    
    try {
      // Fetch user data
      const userResponse = await fetch('/api/github/user');
      const userData = await userResponse.json();
      
      if (!userData.success) {
        throw new Error(userData.message || 'Failed to fetch user data');
      }
      
      if (!userData.user) {
        // No user data found, redirect to home page
        router.push('/');
        return;
      }
      
      setUserData(userData.user);
      
      // Fetch metrics data
      const metricsResponse = await fetch('/api/github/metrics');
      const metricsData = await metricsResponse.json();
      
      if (!metricsData.success) {
        throw new Error(metricsData.message || 'Failed to fetch metrics data');
      }
      
      setMetricsData(metricsData.metrics);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    setRefreshing(true);
    setError("");
    
    try {
      // Fetch fresh data
      const userResponse = await fetch('/api/github/user');
      const userData = await userResponse.json();
      
      if (!userData.success) {
        throw new Error(userData.message || 'Failed to fetch user data');
      }
      
      setUserData(userData.user);
      
      // Fetch fresh metrics
      const metricsResponse = await fetch('/api/github/metrics');
      const metricsData = await metricsResponse.json();
      
      if (!metricsData.success) {
        throw new Error(metricsData.message || 'Failed to fetch metrics data');
      }
      
      setMetricsData(metricsData.metrics);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }

  // Prepare radar chart data
  const radarData = {
    labels: ['Seniority', 'Versatility', 'Productivity', 'Code Quality', 'Community Impact'],
    datasets: [
      {
        label: 'Developer Metrics',
        data: metricsData ? [
          metricsData.seniorityScore || 0,
          metricsData.versatilityScore || 0,
          metricsData.productivityScore || 0,
          metricsData.codeQualityScore || 0,
          metricsData.communityImpactScore || 0,
        ] : [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          showLabelBackdrop: false,
        },
        pointLabels: {
          font: {
            size: 12,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem: TooltipItem<'radar'>) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}%`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading your developer metrics...</h1>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DevMeter Dashboard</h1>
          <div className="flex items-center gap-4">
            {userData && (
              <div className="flex items-center gap-2">
                {userData.avatarUrl && (
                  <Image 
                    src={userData.avatarUrl} 
                    alt={`${userData.username}'s avatar`} 
                    width={32} 
                    height={32} 
                    className="rounded-full"
                  />
                )}
                <span className="text-sm font-medium">@{userData.username}</span>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
            >
              Home
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Developer Metrics Overview</h2>
            <Button 
              onClick={refreshData}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
              {error}
            </div>
          )}

          {metricsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80">
                <h3 className="text-lg font-medium mb-4 text-center">Metrics Star Plot</h3>
                <Radar data={radarData} options={radarOptions} />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Metrics Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Seniority</p>
                    <p className="text-2xl font-bold">{metricsData.seniorityScore?.toFixed(0) || '0'}%</p>
                  </div>
                  <div className="p-4 border rounded-md bg-green-50 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Versatility</p>
                    <p className="text-2xl font-bold">{metricsData.versatilityScore?.toFixed(0) || '0'}%</p>
                  </div>
                  <div className="p-4 border rounded-md bg-purple-50 dark:bg-purple-900/20">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Productivity</p>
                    <p className="text-2xl font-bold">{metricsData.productivityScore?.toFixed(0) || '0'}%</p>
                  </div>
                  <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Code Quality</p>
                    <p className="text-2xl font-bold">{metricsData.codeQualityScore?.toFixed(0) || '0'}%</p>
                  </div>
                  <div className="p-4 border rounded-md bg-indigo-50 dark:bg-indigo-900/20 sm:col-span-2">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Community Impact</p>
                    <p className="text-2xl font-bold">{metricsData.communityImpactScore?.toFixed(0) || '0'}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {metricsData && (
          <>
            {/* Seniority Metrics Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Seniority Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-500">Review to PR Ratio</p>
                  <p className="text-2xl font-bold">{metricsData.reviewToPRRatio?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-500">Review Count</p>
                  <p className="text-2xl font-bold">{metricsData.reviewCount || 0}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-500">Account Age (Years)</p>
                  <p className="text-2xl font-bold">{metricsData.accountAgeInYears?.toFixed(1) || '0.0'}</p>
                </div>
              </div>
            </div>

            {/* Versatility Metrics Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Versatility Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-500">Language Diversity</p>
                  <p className="text-2xl font-bold">{(metricsData.languageDiversity || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-500">Contribution Type Diversity</p>
                  <p className="text-2xl font-bold">{(metricsData.contributionTypeDiversity || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-500">Repository Diversity</p>
                  <p className="text-2xl font-bold">{(metricsData.repositoryDiversity || 0).toFixed(2)}</p>
                </div>
              </div>
              {metricsData.languages && metricsData.languages.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-500 mb-2">Languages Used:</p>
                  <div className="flex flex-wrap gap-2">
                    {metricsData.languages.map((lang, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-md">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Other metrics sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Productivity Metrics Section */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Productivity Metrics</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium text-gray-500">Contribution Frequency</p>
                    <p className="text-2xl font-bold">{(metricsData.contributionFrequency || 0).toFixed(1)}<span className="text-sm ml-1">per week</span></p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium text-gray-500">Active Days</p>
                    <p className="text-2xl font-bold">{metricsData.activeDays || 0}<span className="text-sm ml-1">days</span></p>
                  </div>
                </div>
              </div>

              {/* Code Quality Metrics Section */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Code Quality Metrics</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium text-gray-500">PR Merge Ratio</p>
                    <p className="text-2xl font-bold">{((metricsData.prMergeRatio || 0) * 100).toFixed(0)}<span className="text-sm ml-1">%</span></p>
                    <p className="text-xs text-gray-500 mt-1">Percentage of PRs that were merged</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium text-gray-500">PR Revisions</p>
                    <p className="text-2xl font-bold">{(metricsData.prRevisions || 0).toFixed(1)}<span className="text-sm ml-1">avg</span></p>
                    <p className="text-xs text-gray-500 mt-1">Average revisions per PR</p>
                  </div>
                </div>
              </div>

              {/* Community Impact Metrics Section */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Community Impact Metrics</h3>
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-500">Star Count</p>
                  <p className="text-2xl font-bold">{metricsData.starCount || 0}<span className="text-sm ml-1">stars</span></p>
                  <p className="text-xs text-gray-500 mt-1">Total stars on repositories with contributions</p>
                </div>
              </div>

              {/* Activity Metrics Section */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Activity Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium text-gray-500">Commit Frequency</p>
                    <p className="text-2xl font-bold">{metricsData.commitFrequency}</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium text-gray-500">Lines Added</p>
                    <p className="text-2xl font-bold">{metricsData.linesOfCodeAdded}</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium text-gray-500">Lines Deleted</p>
                    <p className="text-2xl font-bold">{metricsData.linesOfCodeDeleted}</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium text-gray-500">Avg. Commit Size</p>
                    <p className="text-2xl font-bold">{metricsData.averageCommitSize.toFixed(0)}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Based on {metricsData.repositoriesAnalyzed.length} repositories analyzed
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
