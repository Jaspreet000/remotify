"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import {
  Brain,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Award,
  Zap,
  BarChart2,
  Settings,
} from "lucide-react";

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
  recommendations: {
    dailyHabits: string[];
    improvements: string[];
    workLifeBalance: string[];
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    actionableSteps: string[];
  }>;
  dailyChallenge: {
    title: string;
    description: string;
    target: {
      sessions: number;
      minFocusScore: number;
    };
    rewardPoints: number;
  };
  workflowOptimizations: {
    schedule: string[];
    environment: string[];
    techniques: string[];
  };
  teamSync?: {
    synchronization: string[];
    collaboration: string[];
    productivity: string[];
  };
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
        const res = await fetch("/api/dashboard");
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (error) {
        console.error("Dashboard data error:", error);
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
        {/* Productivity Score and Daily Challenge */}
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Daily Challenge
              </h3>
              <div className="text-sm font-medium text-blue-600">
                {data?.dailyChallenge.rewardPoints} XP
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">
                  {data?.dailyChallenge.title}
                </h4>
                <p className="text-gray-600 mt-1">
                  {data?.dailyChallenge.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500">Target:</div>
                <div className="font-medium text-gray-900">
                  {data?.dailyChallenge.target.sessions} sessions with{" "}
                  {data?.dailyChallenge.target.minFocusScore}% focus score
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI-Powered Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === "pattern"
                    ? "border-blue-200 bg-blue-50"
                    : insight.type === "trend"
                    ? "border-green-200 bg-green-50"
                    : insight.type === "improvement"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-purple-200 bg-purple-50"
                }`}
              >
                <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                <p className="text-gray-600 mt-2">{insight.description}</p>
                <div className="mt-4 space-y-2">
                  {insight.actionableSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <p className="text-sm text-gray-600">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">
                Daily Habits
              </h4>
            </div>
            <ul className="space-y-3">
              {data?.recommendations.dailyHabits.map((habit, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                  <p className="text-gray-600">{habit}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h4 className="text-lg font-semibold text-gray-900">
                Improvements
              </h4>
            </div>
            <ul className="space-y-3">
              {data?.recommendations.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                  <p className="text-gray-600">{improvement}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h4 className="text-lg font-semibold text-gray-900">
                Work-Life Balance
              </h4>
            </div>
            <ul className="space-y-3">
              {data?.recommendations.workLifeBalance.map((tip, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                  <p className="text-gray-600">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Workflow Optimizations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Workflow Optimizations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Schedule</h4>
              </div>
              <ul className="space-y-2">
                {data?.workflowOptimizations.schedule.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Settings className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Environment</h4>
              </div>
              <ul className="space-y-2">
                {data?.workflowOptimizations.environment.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-gray-900">Techniques</h4>
              </div>
              <ul className="space-y-2">
                {data?.workflowOptimizations.techniques.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Team Sync (if available) */}
        {data?.teamSync && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Team Sync Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-medium text-gray-900">Synchronization</h4>
                </div>
                <ul className="space-y-2">
                  {data.teamSync.synchronization.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-5 h-5 text-pink-600" />
                  <h4 className="font-medium text-gray-900">Collaboration</h4>
                </div>
                <ul className="space-y-2">
                  {data.teamSync.collaboration.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart2 className="w-5 h-5 text-orange-600" />
                  <h4 className="font-medium text-gray-900">Productivity</h4>
                </div>
                <ul className="space-y-2">
                  {data.teamSync.productivity.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Focus Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
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
              Today&apos;s Progress
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
          transition={{ delay: 1.4 }}
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
