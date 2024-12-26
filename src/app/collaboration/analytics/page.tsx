"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";

interface CollaborationData {
  date: string;
  teamSize: number;
  activeMembers: number;
  tasksCompleted: number;
  avgProductivity: number;
}

export default function CollaborationAnalytics() {
  const [data, setData] = useState<CollaborationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const response = await fetch("/api/collaboration/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || "Failed to load analytics");
        }
      } catch (error) {
        console.error("Analytics fetch error:", error);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Collaboration Analytics</h1>

      <div className="grid gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Team Performance</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="activeMembers"
                  name="Active Members"
                  fill="#8884d8"
                />
                <Bar
                  dataKey="tasksCompleted"
                  name="Tasks Completed"
                  fill="#82ca9d"
                />
                <Bar
                  dataKey="avgProductivity"
                  name="Avg Productivity"
                  fill="#ffc658"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
