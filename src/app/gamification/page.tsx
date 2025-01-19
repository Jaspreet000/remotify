"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { motion } from "framer-motion";
import type { Quest, PowerUp } from "@/lib/gamificationService";

interface GamificationData {
  quests: Quest[];
  powerUps: PowerUp[];
  stats: {
    level: number;
    xp: number;
    coins: number;
    totalFocusTime: number;
    weeklyStreak: number;
    achievements: number;
    leaderboardRank: number;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
}

export default function Gamification() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        const res = await fetch("/api/gamification");
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || "Failed to load gamification data");
        }

        setData(result.data);
      } catch (error) {
        console.error("Failed to load gamification data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load gamification data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchGamificationData();
    }
  }, [session]);

  const joinQuest = async (questId: string) => {
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questId }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to join quest");
      }

      // Update quests list with new participant
      setData((prevData) => {
        if (!prevData) return null;
        return {
          ...prevData,
          quests: prevData.quests.map((quest) =>
            quest.id === questId ? { ...quest, status: "active" } : quest
          ),
        };
      });
    } catch (error) {
      console.error("Failed to join quest:", error);
      setError(error instanceof Error ? error.message : "Failed to join quest");
    }
  };

  if (status === "loading" || loading) return <LoadingSpinner />;

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
            <p className="text-yellow-700">
              Please sign in to view your gamification progress
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Header with User Progress */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600">
            <h1 className="text-2xl font-bold text-white">
              Quests & Achievements
            </h1>
            <p className="text-purple-100 mt-1">Level up your productivity</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Level</p>
                <p className="text-3xl font-bold text-purple-600">
                  {data.stats.level}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Experience</p>
                <p className="text-3xl font-bold text-purple-600">
                  {data.stats.xp}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Coins</p>
                <p className="text-3xl font-bold text-purple-600">
                  {data.stats.coins}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Rank</p>
                <p className="text-3xl font-bold text-purple-600">
                  #{data.stats.leaderboardRank}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Quests */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.quests.map((quest) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div
                className={`px-6 py-4 ${
                  quest.difficulty === "easy"
                    ? "bg-green-100"
                    : quest.difficulty === "medium"
                    ? "bg-yellow-100"
                    : "bg-red-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{quest.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {quest.name}
                    </h3>
                    <p className="text-sm text-gray-600">{quest.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Conditions
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {quest.conditions.map((condition, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        •{" "}
                        {condition.type === "focus_time"
                          ? `${condition.target} minutes of focus time`
                          : condition.type === "streak"
                          ? `${condition.target}% focus score streak`
                          : `${condition.target} ${condition.type.replace(
                              "_",
                              " "
                            )}`}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-purple-600 rounded-full h-2"
                            style={{
                              width: `${Math.min(
                                (condition.current / condition.target) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Rewards</h4>
                  <ul className="mt-2 space-y-2">
                    <li className="text-sm text-gray-600">
                      • {quest.rewards.xp} XP
                    </li>
                    <li className="text-sm text-gray-600">
                      • {quest.rewards.coins} Coins
                    </li>
                    {quest.rewards.achievement && (
                      <li className="text-sm text-gray-600">
                        • Achievement: {quest.rewards.achievement}
                      </li>
                    )}
                  </ul>
                </div>
                {quest.status === "active" ? (
                  <div className="text-sm text-purple-600 font-medium">
                    Quest in progress
                  </div>
                ) : quest.status === "completed" ? (
                  <div className="text-sm text-green-600 font-medium">
                    Quest completed
                  </div>
                ) : (
                  <button
                    onClick={() => joinQuest(quest.id)}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Accept Quest
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
