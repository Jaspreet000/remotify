"use client";

import { useEffect, useState } from "react";
import { Chart } from "chart.js/auto";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  BoltIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

interface AdminData {
  platformStats: {
    totalUsers: number;
    activeUsers: number;
    totalTeams: number;
    totalFocusHours: number;
    averageProductivity: number;
  };
  userStats: {
    newUsersToday: number;
    userGrowthRate: number;
    topPerformers: Array<{
      id: string;
      name: string;
      focusScore: number;
      level: number;
    }>;
    userRetention: number;
  };
  teamInsights: {
    activeTeams: number;
    teamCollaboration: number;
    topTeams: Array<{
      id: string;
      name: string;
      members: number;
      performance: number;
    }>;
  };
  aiRecommendations: Array<{
    type: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
  }>;
  systemHealth: {
    serverStatus: "healthy" | "warning" | "critical";
    responseTime: number;
    errorRate: number;
    lastDeployment: string;
  };
}

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          setAdminData(result.data);
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (!adminData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">No admin data available</div>
      </div>
    );

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={<UserGroupIcon className="h-6 w-6" />}
        title="Total Users"
        value={adminData.platformStats.totalUsers}
        trend={+15}
      />
      <StatCard
        icon={<ClockIcon className="h-6 w-6" />}
        title="Focus Hours"
        value={adminData.platformStats.totalFocusHours}
        trend={+8}
        suffix="hrs"
      />
      <StatCard
        icon={<ChartBarIcon className="h-6 w-6" />}
        title="Avg. Productivity"
        value={adminData.platformStats.averageProductivity}
        trend={+5}
        suffix="%"
      />
      <StatCard
        icon={<UserCircleIcon className="h-6 w-6" />}
        title="Active Teams"
        value={adminData.teamInsights.activeTeams}
        trend={+3}
      />
    </div>
  );

  const renderUserAnalytics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
        <Line
          data={{
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                label: "New Users",
                data: [65, 78, 90, 120, 150, 180],
                borderColor: "#3B82F6",
                tension: 0.4,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
        <Bar
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Active Users",
                data: [120, 150, 180, 190, 170, 160, 140],
                backgroundColor: "#3B82F6",
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      </div>
    </div>
  );

  const renderTeamInsights = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
        <div className="space-y-4">
          {adminData.teamInsights.topTeams.map((team) => (
            <div key={team.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{team.name}</p>
                <p className="text-sm text-gray-500">{team.members} members</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-24 bg-gray-200 rounded">
                  <div
                    className="h-full bg-blue-500 rounded"
                    style={{ width: `${team.performance}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{team.performance}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Collaboration Metrics</h3>
        <Doughnut
          data={{
            labels: ["Active", "Inactive", "New"],
            datasets: [
              {
                data: [70, 20, 10],
                backgroundColor: ["#3B82F6", "#9CA3AF", "#60A5FA"],
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "bottom",
              },
            },
          }}
        />
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div className="space-y-6 mb-8">
      {adminData.aiRecommendations.map((recommendation, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-start space-x-4">
            <div
              className={`p-2 rounded-lg ${
                recommendation.impact === "high"
                  ? "bg-red-100 text-red-600"
                  : recommendation.impact === "medium"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <BoltIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{recommendation.title}</h3>
              <p className="text-gray-600 mt-1">{recommendation.description}</p>
              <div className="mt-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    recommendation.impact === "high"
                      ? "bg-red-100 text-red-800"
                      : recommendation.impact === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {recommendation.impact.toUpperCase()} IMPACT
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSystemHealth = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ServerIcon className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-semibold">Server Status</h3>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              adminData.systemHealth.serverStatus === "healthy"
                ? "bg-green-100 text-green-800"
                : adminData.systemHealth.serverStatus === "warning"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {adminData.systemHealth.serverStatus.toUpperCase()}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">Response Time</p>
          <p className="text-2xl font-semibold">
            {adminData.systemHealth.responseTime}ms
          </p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold">Error Rate</h3>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-semibold">
            {adminData.systemHealth.errorRate}%
          </p>
          <div className="h-2 w-full bg-gray-200 rounded mt-2">
            <div
              className={`h-full rounded ${
                adminData.systemHealth.errorRate < 1
                  ? "bg-green-500"
                  : adminData.systemHealth.errorRate < 5
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{
                width: `${Math.min(
                  adminData.systemHealth.errorRate * 10,
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-3">
          <CogIcon className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold">Last Deployment</h3>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-semibold">
            {adminData.systemHealth.lastDeployment}
          </p>
          <p className="text-sm text-gray-500 mt-1">Successful deployment</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="mt-4 md:mt-0">
            <nav className="flex space-x-4">
              {["overview", "users", "teams", "ai-insights", "system"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === tab
                        ? "bg-blue-500 text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab
                      .split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </button>
                )
              )}
            </nav>
          </div>
        </div>

        {activeTab === "overview" && renderOverview()}
        {activeTab === "users" && renderUserAnalytics()}
        {activeTab === "teams" && renderTeamInsights()}
        {activeTab === "ai-insights" && renderAIInsights()}
        {activeTab === "system" && renderSystemHealth()}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  trend: number;
  suffix?: string;
}

function StatCard({ icon, title, value, trend, suffix = "" }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">{icon}</div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            trend > 0
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {trend > 0 ? "+" : ""}
          {trend}%
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-gray-900">
        {value.toLocaleString()}
        {suffix}
      </p>
    </div>
  );
}
