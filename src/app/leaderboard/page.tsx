"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Users,
  Award,
  Target,
  Clock,
  Activity,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  badges: string[];
  recentAchievements: string[];
  performanceInsights: {
    strengths: string[];
    improvements: string[];
    consistency: number;
    trend: "rising" | "stable" | "declining";
  };
  focusMetrics: {
    totalFocusTime: number;
    averageSessionScore: number;
    weeklyImprovement: number;
    consistencyScore: number;
    collaborationScore: number;
  };
  specializations: string[];
  level: number;
  experience: number;
}

interface LeaderboardData {
  topPerformers: LeaderboardEntry[];
  userRank: LeaderboardEntry;
  nearbyUsers: LeaderboardEntry[];
  globalStats: {
    totalUsers: number;
    averageScore: number;
    topSpecializations: { name: string; count: number }[];
    mostActiveTime: string;
    competitionInsights: string[];
  };
  weeklyHighlights: {
    mostImproved: { name: string; improvement: number }[];
    longestStreak: { name: string; days: number }[];
    bestCollaborators: { name: string; score: number }[];
  };
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch("/api/leaderboard");
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch leaderboard data");
        }

        setLeaderboardData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchLeaderboardData();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">
          Please sign in to view the leaderboard.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!leaderboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No leaderboard data available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User's Current Rank */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4">Your Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-lg opacity-80">Current Rank</p>
            <p className="text-4xl font-bold">
              #{leaderboardData.userRank.rank}
            </p>
          </div>
          <div>
            <p className="text-lg opacity-80">Level</p>
            <p className="text-4xl font-bold">
              {leaderboardData.userRank.level}
            </p>
          </div>
          <div>
            <p className="text-lg opacity-80">Score</p>
            <p className="text-4xl font-bold">
              {leaderboardData.userRank.score}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            Top Performers
          </h2>
          <div className="space-y-4">
            {leaderboardData.topPerformers.slice(0, 5).map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <span className="w-8 text-lg font-bold">#{index + 1}</span>
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Level {user.level}
                    </p>
                  </div>
                </div>
                <p className="font-bold">{user.score}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Highlights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Star className="w-6 h-6 mr-2 text-yellow-500" />
            Weekly Highlights
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Most Improved
              </h3>
              <div className="space-y-2">
                {leaderboardData.weeklyHighlights.mostImproved.map((user) => (
                  <div
                    key={user.name}
                    className="flex justify-between items-center"
                  >
                    <span>{user.name}</span>
                    <span className="text-green-500">+{user.improvement}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                Longest Streaks
              </h3>
              <div className="space-y-2">
                {leaderboardData.weeklyHighlights.longestStreak.map((user) => (
                  <div
                    key={user.name}
                    className="flex justify-between items-center"
                  >
                    <span>{user.name}</span>
                    <span>{user.days} days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Global Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Target className="w-6 h-6 mr-2 text-blue-500" />
          Global Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Users</p>
            <p className="text-2xl font-bold">
              {leaderboardData.globalStats.totalUsers}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Average Score</p>
            <p className="text-2xl font-bold">
              {Math.round(leaderboardData.globalStats.averageScore)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Most Active Time</p>
            <p className="text-2xl font-bold">
              {leaderboardData.globalStats.mostActiveTime}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">
              Top Specialization
            </p>
            <p className="text-2xl font-bold">
              {leaderboardData.globalStats.topSpecializations[0]?.name}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Competition Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Crown className="w-6 h-6 mr-2 text-yellow-500" />
          Competition Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaderboardData.globalStats.competitionInsights.map(
            (insight, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
              >
                <p>{insight}</p>
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}
