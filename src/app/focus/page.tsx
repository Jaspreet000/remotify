"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface FocusSession {
  duration: number;
  breakDuration: number;
  sessionsCompleted: number;
  totalSessions: number;
}

interface BlockedItem {
  type: "website" | "app";
  name: string;
}

export default function FocusMode() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [session, setSession] = useState<FocusSession>({
    duration: 25 * 60, // 25 minutes in seconds
    breakDuration: 5 * 60, // 5 minutes in seconds
    sessionsCompleted: 0,
    totalSessions: 4,
  });
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("/api/focus", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success && data.preferences) {
          setSession((prev) => ({
            ...prev,
            duration: (data.preferences.focusDuration || 25) * 60,
            breakDuration: (data.preferences.breakDuration || 5) * 60,
            totalSessions: data.preferences.sessionsPerDay || 4,
          }));
          setBlockedItems(data.preferences.blockedItems || []);
        }
      } catch (err) {
        setError("Failed to load preferences");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = useCallback(async () => {
    const newSessionsCompleted = session.sessionsCompleted + 1;
    setSession((prev) => ({
      ...prev,
      sessionsCompleted: newSessionsCompleted,
    }));

    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(session.duration);
    } else {
      // Log completed focus session
      try {
        const token = localStorage.getItem("token");
        await fetch("/api/focus/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            duration: session.duration,
            completed: true,
          }),
        });
      } catch (err) {
        console.error("Failed to log session:", err);
      }

      if (newSessionsCompleted < session.totalSessions) {
        setIsBreak(true);
        setTimeLeft(session.breakDuration);
      } else {
        setIsActive(false);
        // Show completion message or notification
      }
    }
  }, [isBreak, session]);

  const startSession = () => {
    setTimeLeft(session.duration);
    setIsActive(true);
    setIsBreak(false);
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h1 className="text-2xl font-bold text-white">Focus Mode</h1>
            <p className="text-purple-100 mt-1">
              {isBreak
                ? "Take a break and recharge"
                : "Stay focused and productive"}
            </p>
          </div>

          {/* Timer Display */}
          <div className="p-8 text-center">
            <div className="mb-8">
              <div className="text-6xl font-bold text-gray-900 mb-4">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-500">
                Session {session.sessionsCompleted + 1} of{" "}
                {session.totalSessions}
              </div>
            </div>

            {/* Controls */}
            <div className="space-x-4">
              {!isActive ? (
                <button
                  onClick={startSession}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Start Session
                </button>
              ) : (
                <button
                  onClick={pauseSession}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Pause
                </button>
              )}
            </div>
          </div>

          {/* Blocked Items */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Currently Blocked
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blockedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-600">
                    {item.type === "website" ? "🌐" : "📱"} {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Progress
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {session.sessionsCompleted}
              </div>
              <div className="text-sm text-gray-500">Sessions Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  (session.sessionsCompleted / session.totalSessions) * 100
                )}
                %
              </div>
              <div className="text-sm text-gray-500">Daily Goal</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {session.sessionsCompleted * (session.duration / 60)} min
              </div>
              <div className="text-sm text-gray-500">Total Focus Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
