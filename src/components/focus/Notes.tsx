"use client";

import { useState, useEffect } from "react";
import { StickyNote } from "lucide-react";

interface NotesProps {
  notes: string;
  onUpdate: (notes: string) => void;
  isSessionActive: boolean;
}

export default function Notes({
  notes,
  onUpdate,
  isSessionActive,
}: NotesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setLocalNotes(newNotes);
    onUpdate(newNotes);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Session Notes"
      >
        <StickyNote className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Session Notes
              </h3>
              {isSessionActive && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Auto-saving...
                </span>
              )}
            </div>

            <textarea
              value={localNotes}
              onChange={handleChange}
              placeholder="Take notes during your focus session..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            />

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {isSessionActive ? (
                <p>Notes are automatically saved as you type.</p>
              ) : (
                <p>Session notes will be saved when you start a new session.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
