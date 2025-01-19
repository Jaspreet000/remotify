import type { Achievement } from "@/types/achievement";

interface AchievementGridProps {
  achievements: Achievement[];
  unlockedAchievements: string[];
}

export default function AchievementGrid({
  achievements,
  unlockedAchievements,
}: AchievementGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className={`p-4 rounded-lg border ${
            unlockedAchievements.includes(achievement.id)
              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
              : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{achievement.icon}</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {achievement.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {achievement.description}
              </p>
            </div>
          </div>
          {unlockedAchievements.includes(achievement.id) && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Unlocked on{" "}
              {new Date(achievement.unlockedAt!).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
