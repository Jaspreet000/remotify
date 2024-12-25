import React from "react";

interface HeatmapProps {
  data: Array<{ team: string; activity: { date: string; duration: number }[] }>;
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  // Simulate a simple heatmap
  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((entry, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <span className="font-semibold text-sm">{entry.team}</span>
          <div
            className={`w-8 h-8 rounded-md bg-blue-${Math.min(
              entry.activity.reduce((sum, act) => sum + act.duration, 0) / 10,
              500
            )}`}
          />
        </div>
      ))}
    </div>
  );
};

export default Heatmap;
