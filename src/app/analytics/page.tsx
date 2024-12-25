"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface HabitData {
  date: string;
  productiveHours: number;
  focusScore: number;
  distractions: number;
}

interface AIInsight {
  type: 'improvement' | 'warning' | 'achievement';
  message: string;
  impact: number;
  suggestions: string[];
}

interface AnalyticsData {
  habitTrends: HabitData[];
  aiInsights: AIInsight[];
  summary: {
    averageProductivity: number;
    topDistractions: { type: string; count: number }[];
    bestTimeBlocks: { time: string; score: number }[];
    streakData: {
      current: number;
      longest: number;
      thisWeek: number;
    };
  };
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'trends' | 'insights' | 'summary'>('trends');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const res = await fetch('/api/analytics/habits', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to load analytics data');
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h1 className="text-2xl font-bold text-white">Productivity Analytics</h1>
            <p className="text-blue-100 mt-1">Analyze your work habits and get AI-powered insights</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['trends', 'insights', 'summary'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Trends</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.habitTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="productiveHours" stroke="#3B82F6" name="Productive Hours" />
                        <Line type="monotone" dataKey="focusScore" stroke="#10B981" name="Focus Score" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-4">
                {data?.aiInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      insight.type === 'improvement'
                        ? 'bg-green-50 border-l-4 border-green-500'
                        : insight.type === 'warning'
                        ? 'bg-yellow-50 border-l-4 border-yellow-500'
                        : 'bg-blue-50 border-l-4 border-blue-500'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-900">{insight.message}</h4>
                    <div className="mt-2 space-y-2">
                      {insight.suggestions.map((suggestion, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Summary</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Average Productivity</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {data?.summary.averageProductivity}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Streak</p>
                      <p className="text-2xl font-bold text-green-600">
                        {data?.summary.streakData.current} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Distractions</h3>
                  <div className="space-y-2">
                    {data?.summary.topDistractions.map((distraction, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{distraction.type}</span>
                        <span className="text-gray-900 font-medium">{distraction.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
