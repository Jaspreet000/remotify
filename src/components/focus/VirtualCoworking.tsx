"use client";

import { useState } from "react";
import { Users, Volume2, VolumeX } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  status: "focusing" | "break" | "idle";
}

interface Room {
  id: string;
  name: string;
  participants: Participant[];
  ambientSound: string;
  focusTimer: {
    duration: number;
    remainingTime: number;
    isActive: boolean;
  };
}

interface VirtualCoworkingProps {
  room: Room | null;
  onJoin: (roomId: string) => void;
  onLeave: () => void;
}

export default function VirtualCoworking({
  room,
  onJoin,
  onLeave,
}: VirtualCoworkingProps) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [availableRooms] = useState([
    { id: "deep-work", name: "Deep Work Space", participants: [] },
    { id: "creative-flow", name: "Creative Flow", participants: [] },
    { id: "study-group", name: "Study Group", participants: [] },
  ]);

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    // Implement audio toggle logic here
  };

  if (!room) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Virtual Co-working Spaces
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableRooms.map((availableRoom) => (
            <button
              key={availableRoom.id}
              onClick={() => onJoin(availableRoom.id)}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {availableRoom.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {availableRoom.participants.length} participants
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {room.name}
        </h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleAudio}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {audioEnabled ? (
              <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={onLeave}
            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {room.participants.map((participant) => (
          <div
            key={participant.id}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  participant.status === "focusing"
                    ? "bg-green-500"
                    : participant.status === "break"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {participant.name}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {participant.status === "focusing"
                ? "Focusing"
                : participant.status === "break"
                ? "On Break"
                : "Idle"}
            </div>
          </div>
        ))}
      </div>

      {room.focusTimer.isActive && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Room Focus Timer: {Math.floor(room.focusTimer.remainingTime / 60)}:
            {(room.focusTimer.remainingTime % 60).toString().padStart(2, "0")}
          </div>
        </div>
      )}
    </div>
  );
}
