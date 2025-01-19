"use client";

import { useState, useEffect, useRef } from "react";
import { Video, Camera, Plus, X, ThumbsUp, Eye, Tag } from "lucide-react";
import { toast } from "react-toastify";

interface AsyncUpdate {
  _id: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  videoUrl: string;
  thumbnail: string;
  title: string;
  description: string;
  tags: string[];
  views: {
    userId: {
      _id: string;
      name: string;
    };
    viewedAt: Date;
  }[];
  reactions: {
    userId: {
      _id: string;
      name: string;
    };
    type: string;
    timestamp: Date;
  }[];
  createdAt: Date;
}

export default function AsyncUpdates() {
  const [updates, setUpdates] = useState<AsyncUpdate[]>([]);
  const [showNewUpdateForm, setShowNewUpdateForm] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [newUpdate, setNewUpdate] = useState({
    title: "",
    description: "",
    tags: [] as string[],
  });

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      const response = await fetch("/api/team/updates");
      const data = await response.json();
      if (data.success) {
        setUpdates(data.data);
      }
    } catch (error) {
      console.error("Failed to load updates:", error);
      toast.error("Failed to load updates");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        setPreview(URL.createObjectURL(blob));
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to access camera/microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadVideo = async () => {
    if (!videoBlob) return;

    try {
      // Upload video to cloud storage (e.g., AWS S3, Cloudinary)
      const formData = new FormData();
      formData.append("video", videoBlob);
      const uploadResponse = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        // Create async update
        const response = await fetch("/api/team/updates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoUrl: uploadData.videoUrl,
            thumbnail: uploadData.thumbnailUrl,
            ...newUpdate,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setUpdates([data.data, ...updates]);
          resetForm();
          toast.success("Update posted successfully");
        }
      }
    } catch (error) {
      console.error("Failed to upload video:", error);
      toast.error("Failed to upload video");
    }
  };

  const resetForm = () => {
    setShowNewUpdateForm(false);
    setVideoBlob(null);
    setPreview(null);
    setNewUpdate({
      title: "",
      description: "",
      tags: [],
    });
  };

  const handleReaction = async (updateId: string, type: string) => {
    try {
      const response = await fetch("/api/team/updates", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updateId,
          action: "react",
          reactionType: type,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUpdates(
          updates.map((update) =>
            update._id === updateId
              ? { ...update, reactions: data.data.reactions }
              : update
          )
        );
      }
    } catch (error) {
      console.error("Failed to react to update:", error);
      toast.error("Failed to react to update");
    }
  };

  const markAsViewed = async (updateId: string) => {
    try {
      const response = await fetch("/api/team/updates", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updateId,
          action: "view",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUpdates(
          updates.map((update) =>
            update._id === updateId
              ? { ...update, views: data.data.views }
              : update
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark update as viewed:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Team Updates
        </h2>
        <button
          onClick={() => setShowNewUpdateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Update</span>
        </button>
      </div>

      {showNewUpdateForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Record Update
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {preview ? (
                <video
                  ref={videoRef}
                  src={preview}
                  controls
                  className="w-full h-full"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full"
                />
              )}
            </div>

            <div className="flex justify-center">
              {!recording && !preview ? (
                <button
                  onClick={startRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              ) : recording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <span>Stop Recording</span>
                </button>
              ) : null}
            </div>

            {preview && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newUpdate.title}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    placeholder="Enter update title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newUpdate.description}
                    onChange={(e) =>
                      setNewUpdate({
                        ...newUpdate,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    placeholder="Enter update description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Add tags (comma separated)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const tag = input.value.trim();
                        if (tag && !newUpdate.tags.includes(tag)) {
                          setNewUpdate({
                            ...newUpdate,
                            tags: [...newUpdate.tags, tag],
                          });
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newUpdate.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                        <button
                          onClick={() =>
                            setNewUpdate({
                              ...newUpdate,
                              tags: newUpdate.tags.filter(
                                (_, i) => i !== index
                              ),
                            })
                          }
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={uploadVideo}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Post Update
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {updates.map((update) => (
          <div
            key={update._id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div className="aspect-video relative">
              <video
                src={update.videoUrl}
                poster={update.thumbnail}
                controls
                onPlay={() => markAsViewed(update._id)}
                className="w-full h-full"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {update.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {update.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {update.views.length}
                  </div>
                  <div className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {update.reactions.length}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {update.userId.image ? (
                    <img
                      src={update.userId.image}
                      alt={update.userId.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {update.userId.name[0]}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {update.userId.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReaction(update._id, "like")}
                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {update.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {update.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
