"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
} from "lucide-react";

interface SettingsProps {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  blockedSites: string[];
  soundEnabled: boolean;
  soundType?: string;
  notificationsBlocked: boolean;
  onUpdate: (settings: any) => void;
  isSessionActive: boolean;
}

export default function Settings({
  workDuration,
  shortBreakDuration,
  longBreakDuration,
  sessionsUntilLongBreak,
  blockedSites,
  soundEnabled,
  soundType,
  notificationsBlocked,
  onUpdate,
  isSessionActive,
}: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newBlockedSite, setNewBlockedSite] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBlockedSite.trim()) {
      onUpdate({
        blockedSites: [...blockedSites, newBlockedSite.trim()],
      });
      setNewBlockedSite("");
    }
  };

  const removeBlockedSite = (site: string) => {
    onUpdate({
      blockedSites: blockedSites.filter((s) => s !== site),
    });
  };

  const soundOptions = [
    { value: "white_noise", label: "White Noise" },
    { value: "nature", label: "Nature Sounds" },
    { value: "rain", label: "Rain" },
    { value: "cafe", label: "Cafe Ambience" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => !isSessionActive && setIsOpen(!isOpen)}
        className={`p-2 rounded-full ${
          isSessionActive
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        } transition-colors`}
        disabled={isSessionActive}
        title={
          isSessionActive
            ? "Cannot change settings during active session"
            : "Settings"
        }
      >
        <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Focus Settings
            </h3>

            <div className="space-y-4">
              {/* Duration Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Work Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={workDuration}
                  onChange={(e) =>
                    onUpdate({ workDuration: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreakDuration}
                  onChange={(e) =>
                    onUpdate({ shortBreakDuration: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Long Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreakDuration}
                  onChange={(e) =>
                    onUpdate({ longBreakDuration: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sessions Until Long Break
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sessionsUntilLongBreak}
                  onChange={(e) =>
                    onUpdate({
                      sessionsUntilLongBreak: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Sound Settings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Background Sound
                  </label>
                  <button
                    onClick={() => onUpdate({ soundEnabled: !soundEnabled })}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {soundEnabled && (
                  <select
                    value={soundType}
                    onChange={(e) => onUpdate({ soundType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {soundOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Notification Settings */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Block Notifications
                </label>
                <button
                  onClick={() =>
                    onUpdate({ notificationsBlocked: !notificationsBlocked })
                  }
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {notificationsBlocked ? (
                    <BellOff className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Bell className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Blocked Sites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blocked Sites
                </label>
                <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newBlockedSite}
                    onChange={(e) => setNewBlockedSite(e.target.value)}
                    placeholder="e.g., facebook.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newBlockedSite.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </form>
                <div className="space-y-2">
                  {blockedSites.map((site) => (
                    <div
                      key={site}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {site}
                      </span>
                      <button
                        onClick={() => removeBlockedSite(site)}
                        className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
