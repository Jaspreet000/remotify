"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";

interface UserProfile {
  name: string;
  email: string;
  stats: {
    focusTime: number;
    completedSessions: number;
    averageScore: number;
    currentStreak: number;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
  }>;
  preferences: {
    theme: string;
    notifications: boolean;
    focusDuration: number;
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          setProfile(data.profile);
        } else {
          setError(data.message);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePreferenceUpdate = async (
    key: string,
    value: string | number | boolean
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await res.json();
      if (data.success) {
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            preferences: {
              ...prev.preferences,
              [key]: value,
            },
          };
        });
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("Preference update error:", error);
      setError("Failed to update preferences");
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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-600 sm:px-10">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {profile?.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-300 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {profile?.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="px-3 py-2 border border-blue-300 rounded-md text-gray-900"
                    />
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(profile?.name || "");
                      }}
                      className="px-4 py-2 bg-white text-gray-600 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        {profile?.name}
                      </h1>
                      <p className="text-blue-100">{profile?.email}</p>
                      <p className="text-blue-200 text-sm">
                        Joined{" "}
                        {new Date(profile?.joinedAt || "").toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(["overview", "achievements", "teams"] as const).map(
                (section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`py-4 px-6 text-sm font-medium ${
                      activeSection === section
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                )
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeSection === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500">
                      Focus Hours
                    </h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {profile?.stats.totalFocusHours}h
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500">
                      Tasks Completed
                    </h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {profile?.stats.tasksCompleted}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500">
                      Current Streak
                    </h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {profile?.stats.currentStreak} days
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500">
                      Longest Streak
                    </h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {profile?.stats.longestStreak} days
                    </p>
                  </div>
                </div>

                {/* Recent Badges */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Badges
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profile?.badges.slice(0, 4).map((badge) => (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-lg border ${
                          badge.tier === "platinum"
                            ? "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300"
                            : badge.tier === "gold"
                            ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
                            : badge.tier === "silver"
                            ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                            : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
                        }`}
                      >
                        <div className="text-center">
                          <p className="font-medium text-gray-900">
                            {badge.name}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {badge.tier}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "achievements" && (
              <div className="space-y-4">
                {profile?.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-center space-x-4"
                  >
                    <div className="flex-shrink-0">
                      <Image
                        src={achievement.icon}
                        alt={achievement.name}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {achievement.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        Unlocked on{" "}
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "teams" && (
              <div className="space-y-4">
                {profile?.teams.map((team) => (
                  <div
                    key={team.name}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {team.name}
                        </h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {team.role}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400">
                        Joined {new Date(team.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
