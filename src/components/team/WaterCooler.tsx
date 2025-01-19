"use client";

import { useState, useEffect } from "react";
import { Users, MessageSquare, Plus, X } from "lucide-react";
import { toast } from "react-toastify";

interface Participant {
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  status: "active" | "away" | "busy";
  joinedAt: Date;
}

interface Message {
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  content: string;
  type: "text" | "video" | "reaction";
  timestamp: Date;
}

interface Room {
  _id: string;
  name: string;
  description: string;
  type: "casual" | "interests" | "project";
  participants: Participant[];
  messages: Message[];
}

export default function WaterCooler() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [showNewRoomForm, setShowNewRoomForm] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    type: "casual" as const,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await fetch("/api/team/watercooler");
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error("Failed to load water cooler rooms:", error);
      toast.error("Failed to load rooms");
    }
  };

  const createRoom = async () => {
    try {
      const response = await fetch("/api/team/watercooler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRoom),
      });

      const data = await response.json();
      if (data.success) {
        setRooms([...rooms, data.data]);
        setShowNewRoomForm(false);
        setNewRoom({
          name: "",
          description: "",
          type: "casual",
        });
        toast.success("Room created successfully");
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create room");
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/team/watercooler/${roomId}/join`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setActiveRoom(data.data);
        toast.success("Joined room successfully");
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      toast.error("Failed to join room");
    }
  };

  const leaveRoom = async () => {
    if (!activeRoom) return;
    try {
      await fetch(`/api/team/watercooler/${activeRoom._id}/leave`, {
        method: "POST",
      });
      setActiveRoom(null);
      loadRooms();
      toast.info("Left room");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !message.trim()) return;

    try {
      const response = await fetch(
        `/api/team/watercooler/${activeRoom._id}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: message }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setActiveRoom({
          ...activeRoom,
          messages: [...activeRoom.messages, data.data],
        });
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  if (!activeRoom) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Water Cooler Rooms
          </h2>
          <button
            onClick={() => setShowNewRoomForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Room</span>
          </button>
        </div>

        {showNewRoomForm && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Create New Room
              </h3>
              <button
                onClick={() => setShowNewRoomForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  placeholder="Enter room name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newRoom.description}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  placeholder="Enter room description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Type
                </label>
                <select
                  value={newRoom.type}
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      type: e.target.value as
                        | "casual"
                        | "interests"
                        | "project",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="casual">Casual Chat</option>
                  <option value="interests">Shared Interests</option>
                  <option value="project">Project Discussion</option>
                </select>
              </div>
              <button
                onClick={createRoom}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Room
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {room.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {room.description}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    room.type === "casual"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : room.type === "interests"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {room.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {room.participants.length} participants
                  </span>
                </div>
                <button
                  onClick={() => joinRoom(room._id)}
                  className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {activeRoom.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeRoom.description}
          </p>
        </div>
        <button
          onClick={leaveRoom}
          className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
        >
          Leave Room
        </button>
      </div>

      <div className="flex space-x-4">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {activeRoom.messages.map((message, index) => (
              <div key={index} className="flex items-start space-x-3">
                {message.userId.image ? (
                  <img
                    src={message.userId.image}
                    alt={message.userId.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {message.userId.name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {message.userId.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </form>
        </div>

        {/* Participants */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-700 pl-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Participants ({activeRoom.participants.length})
          </h3>
          <div className="space-y-3">
            {activeRoom.participants.map((participant) => (
              <div
                key={participant.userId._id}
                className="flex items-center space-x-3"
              >
                {participant.userId.image ? (
                  <img
                    src={participant.userId.image}
                    alt={participant.userId.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {participant.userId.name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {participant.userId.name}
                  </div>
                  <div
                    className={`text-xs ${
                      participant.status === "active"
                        ? "text-green-600 dark:text-green-400"
                        : participant.status === "away"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {participant.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
