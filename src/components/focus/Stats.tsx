"use client";

import { useState } from "react";
import {
  BarChart2,
  Clock,
  Target,
  Award,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface StatsProps {
  totalSessions: number;
  totalFocusTime: number;
  averageFocusScore: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  todayFocusTime: number;
  weeklyGoal: number;
}

export default function Stats({
  totalSessions,
  totalFocusTime,
  averageFocusScore,
  completionRate,
  currentStreak,
  bestStreak,
  todayFocusTime,
  weeklyGoal,
}: StatsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const stats = [
    {
      label: "Total Sessions",
      value: totalSessions,
      icon: Target,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Total Focus Time",
      value: formatTime(totalFocusTime),
      icon: Clock,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Average Focus Score",
      value: `${Math.round(averageFocusScore)}%`,
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      label: "Completion Rate",
      value: `${Math.round(completionRate)}%`,
      icon: Award,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Focus Statistics"
      >
        <BarChart2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Focus Statistics
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${stat.bgColor}`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {stat.label}
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Streaks */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Streaks
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Current Streak
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {currentStreak} days
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Best Streak
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {bestStreak} days
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Progress */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Today&apos;s Progress
              </h4>
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Focus Time
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(todayFocusTime)} / {formatTime(weeklyGoal / 7)}
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${calculateProgress(
                        todayFocusTime,
                        weeklyGoal / 7
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
