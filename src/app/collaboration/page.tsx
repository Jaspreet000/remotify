"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Brain,
  Target,
  TrendingUp,
  Award,
  Clock,
  Zap,
  BarChart2,
  Calendar,
  MessageSquare,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

interface CollaborationData {
  teamStats: {
    totalMembers: number;
    averageProductivity: number;
    totalFocusTime: number;
    teamSynergy: number;
    activeMembers: number;
    recentCollaborations: number;
  };
  memberStats: Array<{
    userId: string;
    name: string;
    email: string;
    image?: string;
    productivityScore: number;
    focusTime: number;
    lastActive: Date;
    status: "online" | "focusing" | "break" | "offline";
    strengths: string[];
    recentAchievements: string[];
  }>;
  aiInsights: {
    teamDynamics: {
      strengths: string[];
      improvements: string[];
      collaborationScore: number;
      performanceTrend: "rising" | "stable" | "declining";
    };
    recommendations: string[];
    focusPatterns: {
      peakHours: string[];
      commonBreakTimes: string[];
      productiveWeekdays: string[];
    };
    synergy: {
      score: number;
      factors: string[];
      opportunities: string[];
    };
  };
  recentActivity: Array<{
    type: string;
    user: string;
    action: string;
    timestamp: Date;
    impact: number;
  }>;
  challenges: Array<{
    id: string;
    title: string;
    description: string;
    participants: string[];
    progress: number;
    deadline: Date;
    rewards: {
      xp: number;
      coins: number;
      achievement?: string;
    };
  }>;
}

export default function CollaborationPage() {
  const [data, setData] = useState<CollaborationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollaborationData = async () => {
      try {
        const res = await fetch("/api/collaboration");
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (error) {
        console.error("Collaboration data error:", error);
        setError("Failed to load collaboration data");
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborationData();
    // Set up polling for real-time updates
    const interval = setInterval(fetchCollaborationData, 60000);
    return () => clearInterval(interval);
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

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Team Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Team Stats
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Members</span>
                <span className="font-semibold">
                  {data.teamStats.totalMembers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Now</span>
                <span className="font-semibold">
                  {data.teamStats.activeMembers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Focus Time</span>
                <span className="font-semibold">
                  {Math.round(data.teamStats.totalFocusTime / 60)}h
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Team Synergy
              </h3>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  data={[
                    { value: data.aiInsights.teamDynamics.collaborationScore },
                  ]}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar background dataKey="value" fill="#8B5CF6" />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-2xl font-bold"
                    fill="#1F2937"
                  >
                    {data.aiInsights.teamDynamics.collaborationScore}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Performance
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Productivity</span>
                <span className="font-semibold">
                  {Math.round(data.teamStats.averageProductivity)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trend</span>
                <span className="font-semibold capitalize">
                  {data.aiInsights.teamDynamics.performanceTrend}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Collaborations</span>
                <span className="font-semibold">
                  {data.teamStats.recentCollaborations}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Team Members
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.memberStats.map((member) => (
              <div
                key={member.userId}
                className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => setSelectedMember(member.userId)}
              >
                <div className="relative">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl font-semibold text-gray-600">
                        {member.name[0]}
                      </span>
                    </div>
                  )}
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                      member.status === "online"
                        ? "bg-green-500"
                        : member.status === "focusing"
                        ? "bg-blue-500"
                        : member.status === "break"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {member.status}
                  </p>
                  <div className="mt-2">
                    <div className="text-sm">
                      <span className="text-gray-500">Focus Score: </span>
                      <span className="font-medium">
                        {member.productivityScore}%
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Focus Time: </span>
                      <span className="font-medium">
                        {Math.round(member.focusTime / 60)}h
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
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Brain className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                AI Insights
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                <ul className="space-y-2">
                  {data.aiInsights.teamDynamics.strengths.map(
                    (strength, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                        <span className="text-gray-600">{strength}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {data.aiInsights.teamDynamics.improvements.map(
                    (improvement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2" />
                        <span className="text-gray-600">{improvement}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Focus Patterns
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Peak Hours</h4>
                <div className="flex flex-wrap gap-2">
                  {data.aiInsights.focusPatterns.peakHours.map(
                    (hour, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {hour}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Most Productive Days
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.aiInsights.focusPatterns.productiveWeekdays.map(
                    (day, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {day}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Team Challenges
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                <p className="text-gray-600 text-sm mt-1">
                  {challenge.description}
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{challenge.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${challenge.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="text-gray-500">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(challenge.deadline).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600">
                      {challenge.rewards.coins} 🪙
                    </span>
                    <span className="text-purple-600">
                      {challenge.rewards.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-4">
            {data.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{activity.user}</p>
                  <p className="text-gray-600 text-sm">{activity.action}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    +{activity.impact} Impact
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
