"use client";

import { useState, useEffect, useCallback } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";

interface TimerProps {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  onComplete: () => void;
  onBreak: (type: "short" | "long") => void;
  onStateChange: (isRunning: boolean) => void;
}

export default function Timer({
  workDuration,
  shortBreakDuration,
  longBreakDuration,
  sessionsUntilLongBreak,
  onComplete,
  onBreak,
  onStateChange,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(workDuration * 60);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    onStateChange(true);
  }, [onStateChange]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    onStateChange(false);
  }, [onStateChange]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
    setCurrentDuration(workDuration * 60);
    onStateChange(false);
  }, [workDuration, onStateChange]);

  const skipTimer = useCallback(() => {
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(workDuration * 60);
      setCurrentDuration(workDuration * 60);
    } else {
      const isLongBreak =
        completedSessions % sessionsUntilLongBreak ===
        sessionsUntilLongBreak - 1;
      const breakDuration = isLongBreak
        ? longBreakDuration
        : shortBreakDuration;
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      setCurrentDuration(breakDuration * 60);
      onBreak(isLongBreak ? "long" : "short");
    }
    setIsRunning(false);
    onStateChange(false);
  }, [
    isBreak,
    workDuration,
    completedSessions,
    sessionsUntilLongBreak,
    longBreakDuration,
    shortBreakDuration,
    onBreak,
    onStateChange,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        setCompletedSessions((sessions) => sessions + 1);
        onComplete();
      }
      skipTimer();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, skipTimer, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / currentDuration) * 100;

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-64 h-64">
        <CircularProgressbar
          value={progress}
          text={`${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`}
          styles={buildStyles({
            textSize: "16px",
            pathTransitionDuration: 0.5,
            pathColor: isBreak ? "#10B981" : "#3B82F6",
            textColor: "#1F2937",
            trailColor: "#E5E7EB",
          })}
        />
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={resetTimer}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>

        <button
          onClick={isRunning ? pauseTimer : startTimer}
          className={`p-4 rounded-full ${
            isRunning
              ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-800/30"
              : "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-800/30"
          } transition-colors`}
          title={isRunning ? "Pause Timer" : "Start Timer"}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 text-red-600 dark:text-red-400" />
          ) : (
            <Play className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          )}
        </button>

        <button
          onClick={skipTimer}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isBreak ? "Skip Break" : "Skip to Break"}
        >
          <SkipForward className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {isBreak ? (
          <span>Break Time</span>
        ) : (
          <span>Session {completedSessions + 1}</span>
        )}
      </div>
    </div>
  );
}
