"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface LeaderboardEntry {
  _id: string;
  user: {
    name: string;
    avatar?: string;
  };
  focusHours: number;
  tasksCompleted: number;
  level: number;
  badges: string[];
  weeklyStreak: number;
  score: number;
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  );

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication required");

        const res = await fetch(`/api/leaderboard?timeframe=${timeframe}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (result.success) {
          setLeaderboardData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-yellow-600 to-orange-600">
            <h1 className="text-2xl font-bold text-white">
              Productivity Leaderboard
            </h1>
            <p className="text-yellow-100 mt-1">
              Top performers and achievements
            </p>
          </div>

          {/* Timeframe Selection */}
          <div className="p-4 border-b">
            <div className="flex justify-center space-x-4">
              {(["daily", "weekly", "monthly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeframe === t
                      ? "bg-yellow-100 text-yellow-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Focus Hours
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Streak
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboardData.map((entry, index) => (
                    <tr
                      key={entry._id}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-lg font-bold ${
                            index === 0
                              ? "text-yellow-500"
                              : index === 1
                              ? "text-gray-400"
                              : index === 2
                              ? "text-yellow-700"
                              : "text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {entry.user.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={entry.user.avatar}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {entry.user.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.user.name}
                            </div>
                            <div className="flex space-x-1">
                              {entry.badges.map((badge, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">
                          {entry.focusHours}h
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">
                          {entry.tasksCompleted}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Level {entry.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">
                          {entry.weeklyStreak} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
