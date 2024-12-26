"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { motion } from "framer-motion";

interface Challenge {
  _id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "achievement" | "team";
  difficulty: "easy" | "medium" | "hard";
  requirements: {
    focusTime?: number;
    sessions?: number;
    productivity?: number;
    teamParticipation?: number;
  };
  rewards: {
    experience: number;
    badges: string[];
    specialPerks: string[];
  };
  participants: Array<{
    user: {
      _id: string;
      name: string;
      avatar?: string;
    };
    progress: number;
    completed: boolean;
    completedAt?: string;
  }>;
  startDate: string;
  endDate: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  dateEarned: string;
  icon: string;
}

interface UserProgress {
  level: number;
  experience: number;
  badges: string[];
  recentAchievements: Achievement[];
  leaderboardPosition: number;
}

export default function Gamification() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("/api/gamification/challenges", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (result.success) {
          setChallenges(result.data.challenges);
          setProgress(result.data.progress);
        } else {
          setError(result.message);
        }
      } catch (error) {
        console.error("Failed to load challenges:", error);
        setError("Failed to load challenges");
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const joinChallenge = async (challengeId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/gamification/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ challengeId }),
      });

      const result = await res.json();
      if (result.success) {
        // Update challenges list with new participant
        setChallenges((prevChallenges) =>
          prevChallenges.map((challenge) =>
            challenge._id === challengeId
              ? {
                  ...challenge,
                  participants: [
                    ...challenge.participants,
                    result.data.participant,
                  ],
                }
              : challenge
          )
        );
      }
    } catch (error) {
      console.error("Failed to join challenge:", error);
      setError("Failed to join challenge");
    }
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with User Progress */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600">
            <h1 className="text-2xl font-bold text-white">
              Challenges & Achievements
            </h1>
            <p className="text-purple-100 mt-1">Level up your productivity</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Level</p>
                <p className="text-3xl font-bold text-purple-600">
                  {progress?.level}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Experience</p>
                <p className="text-3xl font-bold text-purple-600">
                  {progress?.experience}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Badges</p>
                <p className="text-3xl font-bold text-purple-600">
                  {progress?.badges.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Leaderboard Rank</p>
                <p className="text-3xl font-bold text-purple-600">
                  #{progress?.leaderboardPosition}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Challenges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <motion.div
              key={challenge._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div
                className={`px-6 py-4 ${
                  challenge.difficulty === "easy"
                    ? "bg-green-100"
                    : challenge.difficulty === "medium"
                    ? "bg-yellow-100"
                    : "bg-red-100"
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {challenge.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {challenge.description}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Requirements
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {challenge.requirements.focusTime && (
                      <li className="text-sm text-gray-600">
                        • {challenge.requirements.focusTime} minutes of focus
                        time
                      </li>
                    )}
                    {challenge.requirements.sessions && (
                      <li className="text-sm text-gray-600">
                        • Complete {challenge.requirements.sessions} sessions
                      </li>
                    )}
                    {challenge.requirements.productivity && (
                      <li className="text-sm text-gray-600">
                        • Maintain {challenge.requirements.productivity}%
                        productivity
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Rewards</h4>
                  <ul className="mt-2 space-y-2">
                    <li className="text-sm text-gray-600">
                      • {challenge.rewards.experience} XP
                    </li>
                    {challenge.rewards.badges.map((badge, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {badge} Badge
                      </li>
                    ))}
                  </ul>
                </div>
                {!challenge.participants.some(
                  (p) => p.user._id === localStorage.getItem("userId")
                ) && (
                  <button
                    onClick={() => joinChallenge(challenge._id)}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Accept Challenge
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
