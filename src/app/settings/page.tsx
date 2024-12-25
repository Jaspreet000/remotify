"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface UserSettings {
  notifications: {
    email: {
      dailyDigest: boolean;
      weeklyReport: boolean;
      achievements: boolean;
      teamUpdates: boolean;
    };
    push: {
      focusReminders: boolean;
      breakReminders: boolean;
      teamMentions: boolean;
    };
  };
  focus: {
    defaultDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
    autoStartBreaks: boolean;
    autoStartNextSession: boolean;
    blockedSites: string[];
    blockedApps: string[];
  };
  theme: {
    mode: "light" | "dark" | "system";
    color: "blue" | "purple" | "green" | "orange";
    reducedMotion: boolean;
    fontSize: "small" | "medium" | "large";
  };
  collaboration: {
    showOnline: boolean;
    shareStats: boolean;
    autoJoinTeamSessions: boolean;
    defaultAvailability: "available" | "busy" | "offline";
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "notifications" | "focus" | "theme" | "collaboration"
  >("notifications");
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated");

        const res = await fetch("/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setUnsavedChanges(false);
        // Show success toast or message
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (path: string, value: any) => {
    setSettings((prev) => {
      if (!prev) return prev;

      const newSettings = { ...prev };
      const parts = path.split(".");
      let current: any = newSettings;

      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = value;
      return newSettings;
    });
    setUnsavedChanges(true);
  };

  if (loading) return <LoadingSpinner />;

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error || "Failed to load settings"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-blue-100 mt-1">Customize your experience</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(
                ["notifications", "focus", "theme", "collaboration"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === tab
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 space-y-6">
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications.email).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <label className="text-sm text-gray-700">
                            {key
                              .split(/(?=[A-Z])/)
                              .join(" ")
                              .toLowerCase()}
                          </label>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              handleChange(
                                `notifications.email.${key}`,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Push Notifications
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications.push).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <label className="text-sm text-gray-700">
                            {key
                              .split(/(?=[A-Z])/)
                              .join(" ")
                              .toLowerCase()}
                          </label>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              handleChange(
                                `notifications.push.${key}`,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "focus" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Timer Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Focus Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.focus.defaultDuration}
                        onChange={(e) =>
                          handleChange(
                            "focus.defaultDuration",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Break Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.focus.breakDuration}
                        onChange={(e) =>
                          handleChange(
                            "focus.breakDuration",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Blocked Sites & Apps
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Blocked Websites
                      </label>
                      <textarea
                        value={settings.focus.blockedSites.join("\n")}
                        onChange={(e) =>
                          handleChange(
                            "focus.blockedSites",
                            e.target.value.split("\n").filter(Boolean)
                          )
                        }
                        placeholder="Enter one website per line"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Blocked Applications
                      </label>
                      <textarea
                        value={settings.focus.blockedApps.join("\n")}
                        onChange={(e) =>
                          handleChange(
                            "focus.blockedApps",
                            e.target.value.split("\n").filter(Boolean)
                          )
                        }
                        placeholder="Enter one application per line"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Appearance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Theme Mode
                      </label>
                      <select
                        value={settings.theme.mode}
                        onChange={(e) =>
                          handleChange(
                            "theme.mode",
                            e.target.value as "light" | "dark" | "system"
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Accent Color
                      </label>
                      <select
                        value={settings.theme.color}
                        onChange={(e) =>
                          handleChange(
                            "theme.color",
                            e.target.value as
                              | "blue"
                              | "purple"
                              | "green"
                              | "orange"
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                        <option value="green">Green</option>
                        <option value="orange">Orange</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Accessibility
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">
                        Reduced Motion
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.theme.reducedMotion}
                        onChange={(e) =>
                          handleChange("theme.reducedMotion", e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Font Size
                      </label>
                      <select
                        value={settings.theme.fontSize}
                        onChange={(e) =>
                          handleChange(
                            "theme.fontSize",
                            e.target.value as "small" | "medium" | "large"
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "collaboration" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Team Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">
                        Show Online Status
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.collaboration.showOnline}
                        onChange={(e) =>
                          handleChange(
                            "collaboration.showOnline",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">
                        Share Statistics
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.collaboration.shareStats}
                        onChange={(e) =>
                          handleChange(
                            "collaboration.shareStats",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Default Availability
                      </label>
                      <select
                        value={settings.collaboration.defaultAvailability}
                        onChange={(e) =>
                          handleChange(
                            "collaboration.defaultAvailability",
                            e.target.value as "available" | "busy" | "offline"
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {unsavedChanges && (
                <p className="text-sm text-gray-600">
                  You have unsaved changes
                </p>
              )}
              <button
                onClick={updateSettings}
                disabled={saving || !unsavedChanges}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  saving || !unsavedChanges
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
