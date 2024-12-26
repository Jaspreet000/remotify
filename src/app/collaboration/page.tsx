"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  focusHours: number;
  tasksCompleted: number;
  availability: {
    status: "available" | "busy" | "offline";
    until?: string;
  };
}

interface TeamActivity {
  type: string;
  title: string;
  participants: string[];
  duration: number;
  date: string;
}

interface TeamMetrics {
  weeklyMeetingHours: number;
  avgParticipation: number;
  productivityScore: number;
  collaborationIndex: number;
}

interface CollaborationData {
  teamMembers?: TeamMember[];
  recentActivity?: TeamActivity[];
  metrics?: TeamMetrics;
  heatmap?: number[];
}

export default function Collaboration() {
  const [data, setData] = useState<CollaborationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "activity"
  >("overview");

  useEffect(() => {
    const fetchCollaborationData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("/api/collaboration", {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600">
            <h1 className="text-2xl font-bold text-white">
              Team Collaboration
            </h1>
            <p className="text-green-100 mt-1">
              Track team productivity and engagement
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(["overview", "members", "activity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === tab
                      ? "border-b-2 border-green-500 text-green-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Team Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500">
                      Weekly Meeting Hours
                    </h4>
                    <p className="text-2xl font-bold text-green-600">
                      {data?.metrics?.weeklyMeetingHours ?? 0}h
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500">
                      Avg Participation
                    </h4>
                    <p className="text-2xl font-bold text-green-600">
                      {data?.metrics?.avgParticipation ?? 0}%
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500">
                      Productivity Score
                    </h4>
                    <p className="text-2xl font-bold text-green-600">
                      {data?.metrics?.productivityScore ?? 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500">
                      Collaboration Index
                    </h4>
                    <p className="text-2xl font-bold text-green-600">
                      {data?.metrics?.collaborationIndex ?? 0}
                    </p>
                  </div>
                </div>

                {/* Team Activity Chart */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Team Activity
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.recentActivity}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="duration"
                          fill="#059669"
                          name="Activity Duration (hrs)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "members" && (
              <div className="space-y-4">
                {(data?.teamMembers ?? []).map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {member.name}
                        </h4>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Focus Hours</p>
                        <p className="text-lg font-medium text-gray-900">
                          {member.focusHours}h
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Tasks</p>
                        <p className="text-lg font-medium text-gray-900">
                          {member.tasksCompleted}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          member.availability.status === "available"
                            ? "bg-green-100 text-green-800"
                            : member.availability.status === "busy"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {member.availability.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                {(data?.recentActivity ?? []).map((activity, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-500">{activity.type}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Duration: {activity.duration} minutes
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activity.participants.map((participant, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                          >
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
