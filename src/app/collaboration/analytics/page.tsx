"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface TeamAnalytics {
  teamMetrics: {
    totalFocusHours: number;
    averageProductivity: number;
    activeMembers: number;
    totalSessions: number;
    weeklyParticipation: number;
  };
  memberStats: Array<{
    id: string;
    name: string;
    avatar?: string;
    stats: {
      focusHours: number;
      productivity: number;
      contribution: number;
      streak: number;
    };
    availability: "available" | "busy" | "offline";
  }>;
  collaborationScore: number;
  aiInsights: {
    summary: string;
    insights: Array<{
      type: "strength" | "improvement";
      message: string;
    }>;
    recommendations: string[];
  };
  recentActivity: Array<{
    type: string;
    user: {
      name: string;
      avatar?: string;
    };
    duration: number;
    score: number;
    timestamp: string;
  }>;
  peakHours: Array<{
    hour: number;
    sessions: number;
    averageScore: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function TeamAnalytics() {
  const [data, setData] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("/api/collaboration/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to load team analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
            <h1 className="text-2xl font-bold text-white">Team Analytics</h1>
            <p className="text-indigo-100 mt-1">
              Track team performance and collaboration
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h4 className="text-sm font-medium text-gray-500">Focus Hours</h4>
            <p className="text-2xl font-bold text-indigo-600">
              {data?.teamMetrics.totalFocusHours.toFixed(1)}h
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h4 className="text-sm font-medium text-gray-500">
              Average Productivity
            </h4>
            <p className="text-2xl font-bold text-indigo-600">
              {data?.teamMetrics.averageProductivity.toFixed(1)}%
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h4 className="text-sm font-medium text-gray-500">
              Active Members
            </h4>
            <p className="text-2xl font-bold text-indigo-600">
              {data?.teamMetrics.activeMembers}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h4 className="text-sm font-medium text-gray-500">
              Weekly Participation
            </h4>
            <p className="text-2xl font-bold text-indigo-600">
              {data?.teamMetrics.weeklyParticipation.toFixed(1)}%
            </p>
          </motion.div>
        </div>

        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Members
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.memberStats.map((member) => (
              <div
                key={member.id}
                className="p-4 border rounded-lg flex items-center space-x-4"
              >
                <div className="flex-shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-indigo-600">
                        {member.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {member.name}
                  </h4>
                  <div className="mt-1 flex items-center space-x-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        member.availability === "available"
                          ? "bg-green-400"
                          : member.availability === "busy"
                          ? "bg-yellow-400"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="text-sm text-gray-500 capitalize">
                      {member.availability}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Focus:</span>{" "}
                      <span className="font-medium">
                        {member.stats.focusHours}h
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Productivity:</span>{" "}
                      <span className="font-medium">
                        {member.stats.productivity}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Insights
          </h3>
          <div className="space-y-4">
            <p className="text-gray-600">{data?.aiInsights.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.aiInsights.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    insight.type === "strength"
                      ? "bg-green-50 border border-green-200"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Peak Hours Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Peak Productivity Hours
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageScore" fill="#818CF8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {data?.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {activity.user.avatar ? (
                    <img
                      src={activity.user.avatar}
                      alt={activity.user.name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-indigo-600">
                        {activity.user.name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.duration} min
                  </p>
                  <p className="text-xs text-gray-500">
                    Score: {activity.score}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
