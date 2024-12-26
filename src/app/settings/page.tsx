"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface UserSettings {
  focus: {
    defaultDuration: number;
    breakDuration: number;
    sessionsBeforeLongBreak: number;
    blockedSites: string[];
    blockedApps: string[];
  };
  notifications: {
    enabled: boolean;
    breakReminders: boolean;
    progressUpdates: boolean;
    teamActivity: boolean;
  };
  theme: {
    mode: "light" | "dark";
    color: string;
  };
}

interface FormField {
  id: string;
  label: string;
  type: "number" | "text" | "toggle" | "select";
  options?: { value: string; label: string }[];
  section: "focus" | "notifications" | "theme";
  subsection?: string;
  value: number | string | boolean;
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          setSettings(data.settings);
        } else {
          setError(data.message);
        }
      } catch (error) {
        console.error("Settings fetch error:", error);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      if (!data.success) {
        setError(data.message);
      }
    } catch (error) {
      console.error("Settings update error:", error);
      setError("Failed to update settings");
    }
  };

  const handleFieldChange = (
    field: FormField,
    value: string | number | boolean
  ) => {
    if (!settings) return;

    setSettings((prev) => {
      if (!prev) return prev;

      const newSettings = { ...prev };
      if (field.subsection) {
        newSettings[field.section][field.subsection][field.id] = value;
      } else {
        newSettings[field.section][field.id] = value;
      }
      return newSettings;
    });
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
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Focus Settings */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Focus Settings</h2>
            {/* Focus settings fields */}
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            {/* Notification settings fields */}
          </div>

          {/* Theme Settings */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Theme</h2>
            {/* Theme settings fields */}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
