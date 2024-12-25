interface ProgressBarProps {
  duration: number;
  timeLeft: number;
}

const ProgressBar = ({ duration, timeLeft }: ProgressBarProps) => {
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-linear"
        style={{ width: `${progress}%` }}
      >
        <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20 animate-pulse" />
      </div>
    </div>
  );
};

export default ProgressBar;
