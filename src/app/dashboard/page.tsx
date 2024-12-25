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
  RadialBarChart,
  RadialBar,
} from "recharts";
import { motion } from "framer-motion";

interface DashboardData {
  focusStats: {
    totalSessions: number;
    totalFocusTime: number;
    averageFocusScore: number;
    todayProgress: {
      completedSessions: number;
      totalFocusTime: number;
      targetHours: number;
    };
  };
  recommendations: Array<{
    type: string;
    priority: "high" | "medium" | "low";
    message: string;
    action: string;
  }>;
  recentActivity: Array<{
    type: string;
    duration: number;
    timestamp: string;
    score: number;
    summary: string;
  }>;
  streakInfo: {
    current: number;
    longest: number;
    lastActive: string;
  };
  productivityScore: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
        {/* Productivity Score and Streak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Productivity Score
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  data={[{ value: data?.productivityScore || 0 }]}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar background dataKey="value" fill="#3B82F6" />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold"
                    fill="#1F2937"
                  >
                    {data?.productivityScore}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Current Streak
            </h3>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {data?.streakInfo.current}
                </div>
                <p className="text-gray-500">Days</p>
                <p className="text-sm text-gray-400 mt-4">
                  Longest Streak: {data?.streakInfo.longest} days
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  rec.priority === "high"
                    ? "border-red-200 bg-red-50"
                    : rec.priority === "medium"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <h4 className="font-medium text-gray-900 mb-2">
                  {rec.message}
                </h4>
                <p className="text-sm text-gray-600">{rec.action}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Focus Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-sm font-medium text-gray-500">
              Total Sessions
            </h4>
            <p className="text-2xl font-bold text-blue-600">
              {data?.focusStats.totalSessions}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-sm font-medium text-gray-500">Focus Hours</h4>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round((data?.focusStats?.totalFocusTime ?? 0) / 60)} hrs
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-sm font-medium text-gray-500">Average Score</h4>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(data?.focusStats?.averageFocusScore ?? 0)}%
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-sm font-medium text-gray-500">
              Today's Progress
            </h4>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(
                ((data?.focusStats?.todayProgress?.totalFocusTime ?? 0) /
                  ((data?.focusStats?.todayProgress?.targetHours ?? 1) * 60)) *
                  100
              )}
              %
            </p>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
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
                <div>
                  <p className="font-medium text-gray-900">
                    {activity.summary}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-blue-600">
                    {activity.score}%
                  </p>
                  <p className="text-sm text-gray-500">Focus Score</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
