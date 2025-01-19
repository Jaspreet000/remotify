import { useEffect, useState } from "react";

interface ShortcutFieldProps {
  label: string;
  keys: string[];
  onEdit: (keys: string[]) => void;
}

export default function ShortcutField({
  label,
  keys,
  onEdit,
}: ShortcutFieldProps) {
  const [recording, setRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);

  useEffect(() => {
    if (recording) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        const key = e.key.toUpperCase();
        if (!currentKeys.includes(key)) {
          setCurrentKeys((prev) => [...prev, key]);
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (currentKeys.length > 0) {
          setRecording(false);
          onEdit(currentKeys);
          setCurrentKeys([]);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }
  }, [recording, currentKeys, onEdit]);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-2 items-center">
        <div className="flex gap-1">
          {recording ? (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono animate-pulse">
              Recording...
            </span>
          ) : keys.length > 0 ? (
            keys.map((key, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 rounded text-sm font-mono"
              >
                {key}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No shortcut set</span>
          )}
        </div>
        <button
          onClick={() => setRecording(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {recording ? "Press keys..." : "Edit"}
        </button>
      </div>
    </div>
  );
}
