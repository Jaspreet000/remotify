"use client";

import { useState, useEffect } from "react";
import { LineChart, BarChart, AlertTriangle, Users, Brain } from "lucide-react";
import { toast } from "react-toastify";

interface AnalyticsData {
  predictiveMetrics: {
    projectedFocusTime: number;
    projectedProductivity: number;
    recommendedBreaks: number;
    nextWeekForecast: {
      date: string;
      predictedScore: number;
    }[];
  };
  teamComparison: {
    averageFocusTime: number;
    averageProductivity: number;
    ranking: number;
    topPerformers: {
      name: string;
      score: number;
    }[];
  };
  burnoutMetrics: {
    riskLevel: "low" | "medium" | "high";
    riskFactors: string[];
    recommendations: string[];
    wellnessScore: number;
  };
}

export default function AnalyticsInsights() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter"
  >("week");

  const loadAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/analytics/insights?timeRange=${selectedTimeRange}`
      );
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-end space-x-2">
        {["week", "month", "quarter"].map((range) => (
          <button
            key={range}
            onClick={() =>
              setSelectedTimeRange(range as "week" | "month" | "quarter")
            }
            className={`px-4 py-2 rounded-lg ${
              selectedTimeRange === range
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Predictive Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Brain className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Predictive Analytics
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Projected Focus Time
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analyticsData.predictiveMetrics.projectedFocusTime}h
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Projected Productivity
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analyticsData.predictiveMetrics.projectedProductivity}%
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Recommended Breaks
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analyticsData.predictiveMetrics.recommendedBreaks}/day
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Next Week Forecast
          </div>
          <div className="h-48 flex items-end space-x-2">
            {analyticsData.predictiveMetrics.nextWeekForecast.map(
              (day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-600 dark:bg-blue-500 rounded-t"
                  style={{ height: `${day.predictedScore}%` }}
                  title={`${day.date}: ${day.predictedScore}%`}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Team Performance
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Team Avg Focus Time
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analyticsData.teamComparison.averageFocusTime}h
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Team Avg Productivity
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analyticsData.teamComparison.averageProductivity}%
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Your Ranking
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              #{analyticsData.teamComparison.ranking}
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Top Performers
          </div>
          <div className="space-y-2">
            {analyticsData.teamComparison.topPerformers.map(
              (performer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-gray-900 dark:text-white">
                    {performer.name}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {performer.score}%
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Burnout Prevention */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Burnout Prevention
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Risk Level
                </div>
                <div
                  className={`px-2 py-1 rounded text-sm ${
                    analyticsData.burnoutMetrics.riskLevel === "high"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      : analyticsData.burnoutMetrics.riskLevel === "medium"
                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  }`}
                >
                  {analyticsData.burnoutMetrics.riskLevel.toUpperCase()}
                </div>
              </div>
              <div className="mt-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Wellness Score
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.burnoutMetrics.wellnessScore}%
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Risk Factors
              </div>
              <ul className="space-y-2">
                {analyticsData.burnoutMetrics.riskFactors.map(
                  (factor, index) => (
                    <li
                      key={index}
                      className="flex items-center text-gray-600 dark:text-gray-300"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                      {factor}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Recommendations
            </div>
            <ul className="space-y-2">
              {analyticsData.burnoutMetrics.recommendations.map(
                (rec, index) => (
                  <li
                    key={index}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300"
                  >
                    {rec}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
