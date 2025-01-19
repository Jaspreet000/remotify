"use client";

import { useState, useEffect } from "react";
import { Shield, Volume2, Bell } from "lucide-react";
import { toast } from "react-toastify";

interface BlockedSite {
  url: string;
  isBlocked: boolean;
}

interface NotificationPreference {
  type: string;
  enabled: boolean;
  priority: "low" | "medium" | "high";
}

export default function ProductivityFeatures() {
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
  const [newSite, setNewSite] = useState("");
  const [isNoiseReductionActive, setIsNoiseReductionActive] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<
    NotificationPreference[]
  >([
    { type: "focus_reminders", enabled: true, priority: "high" },
    { type: "break_reminders", enabled: true, priority: "medium" },
    { type: "team_updates", enabled: true, priority: "low" },
  ]);

  useEffect(() => {
    loadBlockedSites();
    loadNotificationPreferences();
  }, []);

  const loadBlockedSites = async () => {
    try {
      const response = await fetch("/api/productivity/blocked-sites");
      const data = await response.json();
      if (data.success) {
        setBlockedSites(data.data);
      }
    } catch (error) {
      console.error("Failed to load blocked sites:", error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const response = await fetch("/api/productivity/notifications");
      const data = await response.json();
      if (data.success) {
        setNotificationPreferences(data.data);
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
    }
  };

  const addBlockedSite = async () => {
    if (!newSite) return;

    try {
      const response = await fetch("/api/productivity/blocked-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newSite }),
      });

      const data = await response.json();
      if (data.success) {
        setBlockedSites([...blockedSites, data.data]);
        setNewSite("");
        toast.success("Site added to block list");
      }
    } catch (error) {
      console.error("Failed to add blocked site:", error);
      toast.error("Failed to add site to block list");
    }
  };

  const toggleNoiseReduction = async () => {
    try {
      const response = await fetch("/api/productivity/noise-reduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !isNoiseReductionActive }),
      });

      const data = await response.json();
      if (data.success) {
        setIsNoiseReductionActive(!isNoiseReductionActive);
        toast.success(
          `AI Noise reduction ${
            !isNoiseReductionActive ? "enabled" : "disabled"
          }`
        );
      }
    } catch (error) {
      console.error("Failed to toggle noise reduction:", error);
      toast.error("Failed to toggle noise reduction");
    }
  };

  const updateNotificationPreference = async (
    type: string,
    enabled: boolean
  ) => {
    try {
      const response = await fetch("/api/productivity/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, enabled }),
      });

      const data = await response.json();
      if (data.success) {
        setNotificationPreferences(
          notificationPreferences.map((pref) =>
            pref.type === type ? { ...pref, enabled } : pref
          )
        );
        toast.success("Notification preferences updated");
      }
    } catch (error) {
      console.error("Failed to update notification preference:", error);
      toast.error("Failed to update notification preferences");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Productivity Features
      </h2>

      {/* Website Blocking */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Website Blocking
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="Enter website URL"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
            <button
              onClick={addBlockedSite}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {blockedSites.map((site, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-gray-900 dark:text-white">
                  {site.url}
                </span>
                <button
                  onClick={() => {
                    setBlockedSites(
                      blockedSites.map((s, i) =>
                        i === index ? { ...s, isBlocked: !s.isBlocked } : s
                      )
                    );
                  }}
                  className={`px-3 py-1 rounded-md ${
                    site.isBlocked
                      ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  }`}
                >
                  {site.isBlocked ? "Blocked" : "Allowed"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Noise Reduction */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI Noise Reduction
          </h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-gray-900 dark:text-white">
            AI-powered noise cancellation
          </span>
          <button
            onClick={toggleNoiseReduction}
            className={`px-4 py-2 rounded-lg ${
              isNoiseReductionActive
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
            }`}
          >
            {isNoiseReductionActive ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      {/* Smart Notifications */}
      <div>
        <div className="flex items-center mb-4">
          <Bell className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Smart Notifications
          </h3>
        </div>
        <div className="space-y-3">
          {notificationPreferences.map((pref, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <span className="text-gray-900 dark:text-white capitalize">
                  {pref.type.replace("_", " ")}
                </span>
                <span
                  className={`ml-2 text-sm px-2 py-1 rounded-md ${
                    pref.priority === "high"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      : pref.priority === "medium"
                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  }`}
                >
                  {pref.priority}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pref.enabled}
                  onChange={(e) =>
                    updateNotificationPreference(pref.type, e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
