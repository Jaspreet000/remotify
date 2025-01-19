"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ProductivityFeatures from "@/components/productivity/ProductivityFeatures";
import Timer from "@/components/focus/Timer";
import Stats from "@/components/focus/Stats";
import Settings from "@/components/focus/Settings";
import SmartBreak from "@/components/focus/SmartBreak";
import { Shield, Volume2, Bell } from "lucide-react";
import { toast } from "react-toastify";

export default function FocusPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"timer" | "productivity">("timer");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    notificationsBlocked: false,
    blockedSites: [],
  });

  const [stats, setStats] = useState({
    totalSessions: 0,
    totalFocusTime: 0,
    averageFocusScore: 0,
    completionRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    todayFocusTime: 0,
    weeklyGoal: 1500, // 25 hours per week
  });

  const [breakSuggestion, setBreakSuggestion] = useState({
    activity: "Take a short walk",
    duration: 5,
    benefits: ["Improves circulation", "Reduces eye strain", "Boosts energy"],
    alternatives: ["Quick stretching", "Deep breathing", "Hydration break"],
  });

  useEffect(() => {
    if (session?.user?.email) {
      loadUserSettings();
      loadUserStats();
    }
  }, [session]);

  const loadUserSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetch("/api/focus/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleSessionComplete = async () => {
    try {
      await fetch("/api/focus/complete", {
        method: "POST",
      });
      loadUserStats();
      toast.success("Focus session completed!");
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  };

  const handleBreak = async (type: "short" | "long") => {
    try {
      const response = await fetch("/api/focus/break-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await response.json();
      if (data.success) {
        setBreakSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error("Failed to get break suggestion:", error);
    }
  };

  const updateSettings = async (newSettings: Partial<typeof settings>) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await response.json();
      if (data.success) {
        setSettings({ ...settings, ...newSettings });
        toast.success("Settings updated successfully");
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Please sign in
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be signed in to access focus features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Focus Mode
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enhance your productivity with focus sessions and smart features
          </p>
        </div>

        <div className="mb-8">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("timer")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                activeTab === "timer"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span>Focus Timer</span>
            </button>
            <button
              onClick={() => setActiveTab("productivity")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                activeTab === "productivity"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span>Productivity Tools</span>
            </button>
          </nav>
        </div>

        {activeTab === "timer" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Focus Timer
                  </h2>
                  <Settings
                    {...settings}
                    onUpdate={updateSettings}
                    isSessionActive={isSessionActive}
                  />
                </div>
                <Timer
                  workDuration={settings.workDuration}
                  shortBreakDuration={settings.shortBreakDuration}
                  longBreakDuration={settings.longBreakDuration}
                  sessionsUntilLongBreak={settings.sessionsUntilLongBreak}
                  onComplete={handleSessionComplete}
                  onBreak={handleBreak}
                  onStateChange={setIsSessionActive}
                />
                <Stats {...stats} />
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Website Blocking
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Block distracting sites
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        AI Noise Reduction
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reduce background noise
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Smart Notifications
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        AI-powered notification management
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "productivity" && <ProductivityFeatures />}
      </div>
    </div>
  );
}
