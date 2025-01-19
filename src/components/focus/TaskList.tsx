"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";

interface Task {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

interface TaskListProps {
  tasks: Task[];
  onAddTask: (description: string) => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  isSessionActive: boolean;
}

export default function TaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  isSessionActive,
}: TaskListProps) {
  const [newTask, setNewTask] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask.trim());
      setNewTask("");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tasks
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {tasks.filter((t) => t.completed).length}/{tasks.length} completed
        </span>
      </div>

      {!isSessionActive && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              task.completed
                ? "bg-green-50 dark:bg-green-900/20"
                : "bg-white dark:bg-gray-800"
            } border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center space-x-3 flex-1">
              <button
                onClick={() => onToggleTask(task.id, !task.completed)}
                className={`flex items-center justify-center w-5 h-5 rounded border ${
                  task.completed
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <span
                className={`flex-1 text-sm ${
                  task.completed
                    ? "text-gray-500 line-through dark:text-gray-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {task.description}
              </span>
            </div>
            {!isSessionActive && (
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No tasks added yet
          </div>
        )}
      </div>
    </div>
  );
}
