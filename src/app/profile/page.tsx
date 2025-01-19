"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import StatCard from "@/components/profile/StatCard";
import AchievementGrid from "@/components/profile/AchievementGrid";
import type { Achievement } from "@/types/achievement";
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Clock,
  Target,
  Trophy,
  Flame,
  Brain,
  LineChart,
  Camera,
  Edit3,
} from "lucide-react";

interface ProfileData {
  user: {
    name: string;
    email: string;
    profile: {
      bio: string;
      avatar: string;
      socialLinks: {
        twitter?: string;
        github?: string;
        linkedin?: string;
      };
      goals: string[];
    };
  };
  stats: {
    totalSessions: number;
    totalFocusTime: number;
    averageFocusScore: number;
    streakDays: number;
    level: number;
    achievements: Achievement[];
  };
}

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    bio: "",
    goals: [""],
    socialLinks: {
      twitter: "",
      github: "",
      linkedin: "",
    },
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseData = await res.json();

      if (responseData.success) {
        setData(responseData);
        setEditedProfile({
          bio: responseData.user.profile.bio,
          goals: responseData.user.profile.goals,
          socialLinks: responseData.user.profile.socialLinks,
        });
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedProfile),
      });

      const responseData = await res.json();

      if (responseData.success) {
        setData((prev) => ({
          ...prev!,
          user: {
            ...prev!.user,
            profile: responseData.profile,
          },
        }));
        setEditing(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await res.json();

      if (responseData.success) {
        setData((prev) => ({
          ...prev!,
          user: {
            ...prev!.user,
            profile: {
              ...prev!.user.profile,
              avatar: responseData.avatar,
            },
          },
        }));
        toast.success("Profile picture updated");
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!data) return null;

  const { user, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <img
                src={user.profile.avatar || "/default-avatar.png"}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover"
              />
              <label
                className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
                htmlFor="avatar-upload"
              >
                <Camera className="w-4 h-4 text-white" />
              </label>
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {editing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>

              {editing ? (
                <div className="mt-4 space-y-4">
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        bio: e.target.value,
                      })
                    }
                    placeholder="Write something about yourself..."
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                  />
                  <div className="flex gap-4">
                    <Button onClick={handleSaveProfile} variant="primary">
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setEditing(false)}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  {user.profile.bio || "No bio yet"}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Focus Sessions"
            value={stats.totalSessions}
            icon={<Target className="w-6 h-6" />}
          />
          <StatCard
            title="Total Focus Time"
            value={`${Math.round(stats.totalFocusTime / 60)}h`}
            icon={<Clock className="w-6 h-6" />}
          />
          <StatCard
            title="Current Streak"
            value={`${stats.streakDays} days`}
            icon={<Flame className="w-6 h-6" />}
          />
          <StatCard
            title="Focus Score"
            value={`${Math.round(stats.averageFocusScore)}%`}
            icon={<Brain className="w-6 h-6" />}
          />
        </div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Level {stats.level}
            </h2>
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: `${((stats.totalSessions % 10) / 10) * 100}%`,
              }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {10 - (stats.totalSessions % 10)} sessions until next level
          </p>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Achievements
          </h2>
          <AchievementGrid
            achievements={stats.achievements}
            unlockedAchievements={stats.achievements
              .filter((a) => a.unlockedAt)
              .map((a) => a.id)}
          />
        </motion.div>
      </div>
    </div>
  );
}
