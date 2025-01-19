"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import WaterCooler from "@/components/team/WaterCooler";
import AsyncUpdates from "@/components/team/AsyncUpdates";
import MoodTracking from "@/components/team/MoodTracking";
import { Users, Video, LineChart } from "lucide-react";

export default function TeamPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<
    "watercooler" | "updates" | "mood"
  >("watercooler");

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Please sign in
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be signed in to access team features
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
            Team Collaboration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect, share updates, and track team well-being
          </p>
        </div>

        <div className="mb-8">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("watercooler")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                activeTab === "watercooler"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Water Cooler</span>
            </button>
            <button
              onClick={() => setActiveTab("updates")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                activeTab === "updates"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Video className="w-5 h-5" />
              <span>Team Updates</span>
            </button>
            <button
              onClick={() => setActiveTab("mood")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                activeTab === "mood"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <LineChart className="w-5 h-5" />
              <span>Mood Tracking</span>
            </button>
          </nav>
        </div>

        {activeTab === "watercooler" && <WaterCooler />}
        {activeTab === "updates" && <AsyncUpdates />}
        {activeTab === "mood" && <MoodTracking />}
      </div>
    </div>
  );
}
