"use client";

import { useState, useEffect } from "react";
import {
  Smile,
  Frown,
  Meh,
  Battery,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";

interface MoodResponse {
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  mood: "great" | "good" | "okay" | "tired" | "stressed";
  energy: number;
  notes: string;
  timestamp: Date;
}

interface TeamMood {
  date: Date;
  averageScore: number;
  responses: MoodResponse[];
}

interface Insight {
  date: Date;
  type: "trend" | "alert" | "suggestion";
  content: string;
  severity: "low" | "medium" | "high";
}

interface MoodTracking {
  teamMood: TeamMood[];
  insights: Insight[];
}

export default function MoodTracking() {
  const [moodTracking, setMoodTracking] = useState<MoodTracking | null>(null);
  const [currentMood, setCurrentMood] = useState<{
    mood: "great" | "good" | "okay" | "tired" | "stressed";
    energy: number;
    notes: string;
  }>({
    mood: "okay",
    energy: 3,
    notes: "",
  });

  useEffect(() => {
    loadMoodTracking();
  }, []);

  const loadMoodTracking = async () => {
    try {
      const response = await fetch("/api/team/mood");
      const data = await response.json();
      if (data.success) {
        setMoodTracking(data.data);
      }
    } catch (error) {
      console.error("Failed to load mood tracking:", error);
      toast.error("Failed to load mood tracking");
    }
  };

  const submitMood = async () => {
    try {
      const response = await fetch("/api/team/mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentMood),
      });

      const data = await response.json();
      if (data.success) {
        setMoodTracking(data.data);
        toast.success("Mood submitted successfully");
      }
    } catch (error) {
      console.error("Failed to submit mood:", error);
      toast.error("Failed to submit mood");
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "great":
      case "good":
        return <Smile className="w-6 h-6 text-green-500" />;
      case "okay":
        return <Meh className="w-6 h-6 text-yellow-500" />;
      case "tired":
      case "stressed":
        return <Frown className="w-6 h-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="w-5 h-5" />;
      case "alert":
        return <AlertTriangle className="w-5 h-5" />;
      case "suggestion":
        return <Battery className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getInsightColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-green-500 bg-green-100 dark:bg-green-900/20";
      case "medium":
        return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20";
      case "high":
        return "text-red-500 bg-red-100 dark:bg-red-900/20";
      default:
        return "";
    }
  };

  if (!moodTracking) {
    return <div>Loading...</div>;
  }

  const todayMood = moodTracking.teamMood.find(
    (m) => new Date(m.date).toDateString() === new Date().toDateString()
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Team Mood Tracking
      </h2>

      {/* Mood Input */}
      <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          How are you feeling today?
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            {["great", "good", "okay", "tired", "stressed"].map((mood) => (
              <button
                key={mood}
                onClick={() =>
                  setCurrentMood({
                    ...currentMood,
                    mood: mood as typeof currentMood.mood,
                  })
                }
                className={`p-3 rounded-lg ${
                  currentMood.mood === mood
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {getMoodIcon(mood)}
                <span className="block text-sm mt-1 capitalize">{mood}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Energy Level (1-5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={currentMood.energy}
              onChange={(e) =>
                setCurrentMood({
                  ...currentMood,
                  energy: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={currentMood.notes}
              onChange={(e) =>
                setCurrentMood({ ...currentMood, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              rows={3}
              placeholder="Any additional thoughts..."
            />
          </div>

          <button
            onClick={submitMood}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Team Mood Overview */}
      {todayMood && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Today&apos;s Team Mood
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Average Mood
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayMood.averageScore.toFixed(1)}/5.0
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Responses
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayMood.responses.length}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Most Common
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {
                  Object.entries(
                    todayMood.responses.reduce((acc, response) => {
                      acc[response.mood] = (acc[response.mood] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1])[0][0]
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Insights */}
      {moodTracking.insights.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Insights
          </h3>
          <div className="space-y-3">
            {moodTracking.insights
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 5)
              .map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start space-x-3 ${getInsightColor(
                    insight.severity
                  )}`}
                >
                  {getInsightIcon(insight.type)}
                  <div>
                    <div className="font-medium">{insight.content}</div>
                    <div className="text-sm opacity-75">
                      {new Date(insight.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
