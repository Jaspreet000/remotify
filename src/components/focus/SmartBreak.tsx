"use client";

import { useState, useEffect } from "react";
import { Play, Check, RefreshCw } from "lucide-react";

interface BreakSuggestion {
  activity: string;
  duration: number;
  benefits: string[];
  alternatives: string[];
}

interface SmartBreakProps {
  suggestion: BreakSuggestion;
  onComplete: () => void;
}

export default function SmartBreak({
  suggestion,
  onComplete,
}: SmartBreakProps) {
  const [timeLeft, setTimeLeft] = useState(suggestion.duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(suggestion.activity);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const startBreak = () => {
    setIsActive(true);
  };

  const switchActivity = () => {
    const currentIndex = [
      suggestion.activity,
      ...suggestion.alternatives,
    ].indexOf(currentActivity);
    const nextIndex = (currentIndex + 1) % (1 + suggestion.alternatives.length);
    setCurrentActivity(
      nextIndex === 0
        ? suggestion.activity
        : suggestion.alternatives[nextIndex - 1]
    );
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Smart Break Suggestion
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Take a moment to recharge
          </p>
        </div>
        {!isActive && (
          <button
            onClick={startBreak}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Break</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentActivity}
            </div>
            <button
              onClick={switchActivity}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Try another activity"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {isActive && (
            <div className="text-xl font-mono text-gray-900 dark:text-white">
              {minutes.toString().padStart(2, "0")}:
              {seconds.toString().padStart(2, "0")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Benefits
            </h4>
            <ul className="space-y-2">
              {suggestion.benefits.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {!isActive && suggestion.alternatives.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alternatives
              </h4>
              <ul className="space-y-2">
                {suggestion.alternatives.map((alternative, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => setCurrentActivity(alternative)}
                  >
                    {alternative}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
