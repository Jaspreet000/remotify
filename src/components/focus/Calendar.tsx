import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { toast } from "react-toastify";

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  attendees?: { email: string }[];
}

interface FocusBlock {
  startTime: string;
  duration: number;
  priority: "high" | "medium" | "low";
  reason: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      // Load calendar events
      const eventsResponse = await fetch("/api/calendar/events");
      const eventsData = await eventsResponse.json();
      if (eventsData.success) {
        setEvents(eventsData.data);
      }

      // Load focus blocks
      const blocksResponse = await fetch("/api/calendar/focus-blocks");
      const blocksData = await blocksResponse.json();
      if (blocksData.success) {
        setFocusBlocks(blocksData.data.optimizedBlocks?.focusBlocks || []);
      }
    } catch (error) {
      console.error("Calendar data loading error:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const blockFocusTime = async (startTime: string, duration: number) => {
    try {
      const response = await fetch("/api/calendar/focus-blocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime,
          duration,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Focus time blocked successfully");
        loadCalendarData();
      }
    } catch (error) {
      console.error("Focus time blocking error:", error);
      toast.error("Failed to block focus time");
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <CalendarIcon className="w-5 h-5 mr-2" />
        Calendar & Focus Blocks
      </h3>

      <div className="space-y-6">
        {/* Today's Schedule */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Today's Schedule
          </h4>
          <div className="space-y-2">
            {events
              .filter(
                (event) =>
                  new Date(event.start.dateTime).toDateString() ===
                  new Date().toDateString()
              )
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {event.summary}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(event.start.dateTime)} -{" "}
                        {formatTime(event.end.dateTime)}
                      </div>
                    </div>
                  </div>
                  {event.attendees && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-1" />
                      {event.attendees.length}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Suggested Focus Blocks */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Suggested Focus Blocks
          </h4>
          <div className="space-y-2">
            {focusBlocks.map((block, index) => (
              <div
                key={index}
                className="p-3 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatTime(block.startTime)} ({block.duration} min)
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      block.priority === "high"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : block.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    {block.priority} priority
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {block.reason}
                </p>
                <button
                  onClick={() =>
                    blockFocusTime(block.startTime, block.duration)
                  }
                  className="mt-2 w-full px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                >
                  Block This Time
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
