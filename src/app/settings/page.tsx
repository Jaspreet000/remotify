"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import LoadingSpinner from "@/components/LoadingSpinner";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingField from "@/components/settings/SettingField";
import { motion } from "framer-motion";
import Toggle from "@/components/settings/Toggle";
import ColorPicker from "@/components/settings/ColorPicker";
import ShortcutField from "@/components/settings/ShortcutField";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";

interface UserSettings {
  focus: {
    defaultDuration: number;
    breakDuration: number;
    sessionsBeforeLongBreak: number;
    blockedSites: string[];
    blockedApps: string[];
    autoStartBreaks: boolean;
    soundEffects: boolean;
    dailyGoal: number;
  };
  notifications: {
    enabled: boolean;
    breakReminders: boolean;
    progressUpdates: boolean;
    teamActivity: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
    emailDigest: "daily" | "weekly" | "never";
  };
  theme: {
    mode: "light" | "dark";
    color: string;
    fontSize: "small" | "medium" | "large";
    reducedMotion: boolean;
    customBackground?: string;
  };
  privacy: {
    shareProgress: boolean;
    showOnLeaderboard: boolean;
    activityVisibility: "public" | "friends" | "private";
    dataRetention: number; // days
  };
  integrations: {
    calendar: {
      provider: "google" | "outlook" | "apple" | "none";
      syncEnabled: boolean;
    };
    slack: {
      enabled: boolean;
      statusSync: boolean;
      channelUpdates: boolean;
    };
  };
  shortcuts: {
    startFocus: string[];
    pauseFocus: string[];
    skipBreak: string[];
    quickSettings: string[];
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
}

// Add default settings
const defaultSettings: UserSettings = {
  focus: {
    defaultDuration: 25,
    breakDuration: 5,
    sessionsBeforeLongBreak: 4,
    blockedSites: [],
    blockedApps: [],
    autoStartBreaks: true,
    soundEffects: true,
    dailyGoal: 10,
  },
  notifications: {
    enabled: true,
    breakReminders: true,
    progressUpdates: true,
    teamActivity: true,
    soundEnabled: true,
    desktopNotifications: true,
    emailDigest: "daily",
  },
  theme: {
    mode: "light",
    color: "blue",
    fontSize: "medium",
    reducedMotion: false,
  },
  privacy: {
    shareProgress: true,
    showOnLeaderboard: true,
    activityVisibility: "public",
    dataRetention: 30,
  },
  integrations: {
    calendar: {
      provider: "google",
      syncEnabled: true,
    },
    slack: {
      enabled: true,
      statusSync: true,
      channelUpdates: true,
    },
  },
  shortcuts: {
    startFocus: [],
    pauseFocus: [],
    skipBreak: [],
    quickSettings: [],
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    screenReader: false,
    keyboardNavigation: false,
  },
};

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings.accessibility.reducedMotion) {
      document.documentElement.style.setProperty("--motion-reduce", "reduce");
    } else {
      document.documentElement.style.removeProperty("--motion-reduce");
    }

    if (settings.accessibility.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    if (settings.accessibility.screenReader) {
      document.documentElement.setAttribute("role", "application");
    } else {
      document.documentElement.removeAttribute("role");
    }
  }, [settings.accessibility]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setSettings({ ...defaultSettings, ...data.settings });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Settings fetch error:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

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
        toast.success("Settings saved successfully");
        setHasChanges(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Settings update error:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (
    section: keyof UserSettings,
    subsection: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleExportData = async (format: "json" | "csv") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch(`/api/settings/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focus-data.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleThemeChange = (mode: "light" | "dark") => {
    setTheme(mode);
    updateSettings("theme", "mode", mode);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                onClick={handleSubmit}
                isLoading={saving}
                size="md"
                variant="primary"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Focus Settings */}
        <SettingsSection
          title="Focus Settings"
          description="Customize your focus session preferences"
        >
          <SettingField
            label="Default Session Duration"
            description="Set your preferred focus session length in minutes"
          >
            <input
              type="number"
              value={settings.focus.defaultDuration}
              onChange={(e) =>
                updateSettings(
                  "focus",
                  "defaultDuration",
                  parseInt(e.target.value)
                )
              }
              className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={1}
              max={120}
            />
          </SettingField>

          <SettingField
            label="Break Duration"
            description="Set your preferred break duration in minutes"
          >
            <input
              type="number"
              value={settings.focus.breakDuration}
              onChange={(e) =>
                updateSettings(
                  "focus",
                  "breakDuration",
                  parseInt(e.target.value)
                )
              }
              className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={1}
              max={30}
            />
          </SettingField>

          <SettingField
            label="Daily Focus Goal"
            description="Set your daily focus session target"
          >
            <input
              type="number"
              value={settings.focus.dailyGoal}
              onChange={(e) =>
                updateSettings("focus", "dailyGoal", parseInt(e.target.value))
              }
              className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={1}
              max={24}
            />
          </SettingField>

          <SettingField
            label="Auto-start Breaks"
            description="Automatically start breaks after each focus session"
          >
            <Toggle
              enabled={settings.focus.autoStartBreaks}
              onChange={(value) =>
                updateSettings("focus", "autoStartBreaks", value)
              }
            />
          </SettingField>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection
          title="Notifications"
          description="Manage your notification preferences"
        >
          <SettingField
            label="Enable Notifications"
            description="Receive notifications for important updates"
          >
            <Toggle
              enabled={settings.notifications.enabled}
              onChange={(value) =>
                updateSettings("notifications", "enabled", value)
              }
            />
          </SettingField>

          <SettingField
            label="Break Reminders"
            description="Get notified when it's time to take a break"
          >
            <Toggle
              enabled={settings.notifications.breakReminders}
              onChange={(value) =>
                updateSettings("notifications", "breakReminders", value)
              }
            />
          </SettingField>

          <SettingField
            label="Email Digest"
            description="Receive email summaries of your productivity"
          >
            <select
              value={settings.notifications.emailDigest}
              onChange={(e) =>
                updateSettings("notifications", "emailDigest", e.target.value)
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </SettingField>
        </SettingsSection>

        {/* Theme Settings */}
        <SettingsSection
          title="Theme & Appearance"
          description="Customize your visual experience"
        >
          <SettingField
            label="Theme Mode"
            description="Choose between light and dark mode"
          >
            <select
              value={settings.theme.mode}
              onChange={(e) =>
                handleThemeChange(e.target.value as "light" | "dark")
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 
                         dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </SettingField>

          <SettingField
            label="Font Size"
            description="Adjust the application font size"
          >
            <select
              value={settings.theme.fontSize}
              onChange={(e) =>
                updateSettings("theme", "fontSize", e.target.value)
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </SettingField>
        </SettingsSection>

        {/* Privacy Settings */}
        <SettingsSection
          title="Privacy"
          description="Control your data and visibility"
        >
          <SettingField
            label="Share Progress"
            description="Allow others to see your focus statistics"
          >
            <Toggle
              enabled={settings.privacy.shareProgress}
              onChange={(value) =>
                updateSettings("privacy", "shareProgress", value)
              }
            />
          </SettingField>

          <SettingField
            label="Leaderboard Visibility"
            description="Show your achievements on the leaderboard"
          >
            <Toggle
              enabled={settings.privacy.showOnLeaderboard}
              onChange={(value) =>
                updateSettings("privacy", "showOnLeaderboard", value)
              }
            />
          </SettingField>

          <SettingField
            label="Activity Visibility"
            description="Control who can see your activity"
          >
            <select
              value={settings.privacy.activityVisibility}
              onChange={(e) =>
                updateSettings("privacy", "activityVisibility", e.target.value)
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </SettingField>

          <SettingField
            label="Data Retention"
            description="Choose how long to keep your activity data"
          >
            <select
              value={settings.privacy.dataRetention}
              onChange={(e) =>
                updateSettings(
                  "privacy",
                  "dataRetention",
                  parseInt(e.target.value)
                )
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </SettingField>
        </SettingsSection>

        {/* Integrations */}
        <SettingsSection
          title="Integrations"
          description="Connect with your favorite tools"
        >
          <SettingField
            label="Calendar Integration"
            description="Sync focus sessions with your calendar"
          >
            <div className="space-y-2">
              <select
                value={settings.integrations.calendar.provider}
                onChange={(e) =>
                  updateSettings("integrations", "calendar", {
                    ...settings.integrations.calendar,
                    provider: e.target.value,
                  })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="none">No Calendar</option>
                <option value="google">Google Calendar</option>
                <option value="outlook">Outlook</option>
                <option value="apple">Apple Calendar</option>
              </select>
              {settings.integrations.calendar.provider !== "none" && (
                <Toggle
                  enabled={settings.integrations.calendar.syncEnabled}
                  onChange={(value) =>
                    updateSettings("integrations", "calendar", {
                      ...settings.integrations.calendar,
                      syncEnabled: value,
                    })
                  }
                  size="sm"
                />
              )}
            </div>
          </SettingField>

          <SettingField
            label="Slack Integration"
            description="Connect with your Slack workspace"
          >
            <div className="space-y-2">
              <Toggle
                enabled={settings.integrations.slack.enabled}
                onChange={(value) =>
                  updateSettings("integrations", "slack", {
                    ...settings.integrations.slack,
                    enabled: value,
                  })
                }
              />
              {settings.integrations.slack.enabled && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Update Status</span>
                    <Toggle
                      size="sm"
                      enabled={settings.integrations.slack.statusSync}
                      onChange={(value) =>
                        updateSettings("integrations", "slack", {
                          ...settings.integrations.slack,
                          statusSync: value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Channel Updates
                    </span>
                    <Toggle
                      size="sm"
                      enabled={settings.integrations.slack.channelUpdates}
                      onChange={(value) =>
                        updateSettings("integrations", "slack", {
                          ...settings.integrations.slack,
                          channelUpdates: value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </SettingField>
        </SettingsSection>

        {/* Keyboard Shortcuts */}
        <SettingsSection
          title="Keyboard Shortcuts"
          description="Customize your keyboard shortcuts for quick access"
        >
          <div className="space-y-4">
            <ShortcutField
              label="Start Focus Session"
              keys={settings.shortcuts.startFocus}
              onEdit={(keys) => updateSettings("shortcuts", "startFocus", keys)}
            />
            <ShortcutField
              label="Pause Focus Session"
              keys={settings.shortcuts.pauseFocus}
              onEdit={(keys) => updateSettings("shortcuts", "pauseFocus", keys)}
            />
            <ShortcutField
              label="Skip Break"
              keys={settings.shortcuts.skipBreak}
              onEdit={(keys) => updateSettings("shortcuts", "skipBreak", keys)}
            />
            <ShortcutField
              label="Quick Settings"
              keys={settings.shortcuts.quickSettings}
              onEdit={(keys) =>
                updateSettings("shortcuts", "quickSettings", keys)
              }
            />
          </div>
        </SettingsSection>

        {/* Accessibility */}
        <SettingsSection
          title="Accessibility"
          description="Make the app more accessible for your needs"
        >
          <SettingField
            label="Reduced Motion"
            description="Minimize animations throughout the app"
          >
            <Toggle
              enabled={settings.accessibility.reducedMotion}
              onChange={(value) =>
                updateSettings("accessibility", "reducedMotion", value)
              }
            />
          </SettingField>

          <SettingField
            label="High Contrast"
            description="Increase contrast for better visibility"
          >
            <Toggle
              enabled={settings.accessibility.highContrast}
              onChange={(value) =>
                updateSettings("accessibility", "highContrast", value)
              }
            />
          </SettingField>

          <SettingField
            label="Screen Reader Support"
            description="Enhanced support for screen readers"
          >
            <Toggle
              enabled={settings.accessibility.screenReader}
              onChange={(value) =>
                updateSettings("accessibility", "screenReader", value)
              }
            />
          </SettingField>

          <SettingField
            label="Keyboard Navigation"
            description="Improved keyboard navigation support"
          >
            <Toggle
              enabled={settings.accessibility.keyboardNavigation}
              onChange={(value) =>
                updateSettings("accessibility", "keyboardNavigation", value)
              }
            />
          </SettingField>
        </SettingsSection>

        {/* Export Data */}
        <SettingsSection
          title="Export Data"
          description="Download or transfer your data"
        >
          <div className="space-y-4">
            <Button
              onClick={() => handleExportData("json")}
              variant="outline"
              className="w-full"
            >
              Export as JSON
            </Button>
            <Button
              onClick={() => handleExportData("csv")}
              variant="outline"
              className="w-full"
            >
              Export as CSV
            </Button>
          </div>
        </SettingsSection>
      </motion.div>
    </div>
  );
}
