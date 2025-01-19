interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  size?: "sm" | "md" | "lg";
}

export default function Toggle({
  enabled,
  onChange,
  size = "md",
}: ToggleProps) {
  const sizes = {
    sm: "w-9 h-5",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  };

  return (
    <button
      type="button"
      className={`${enabled ? "bg-blue-600" : "bg-gray-200"} 
        relative inline-flex ${
          sizes[size]
        } flex-shrink-0 cursor-pointer rounded-full 
        border-2 border-transparent transition-colors duration-200 ease-in-out 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        className={`${enabled ? "translate-x-5" : "translate-x-0"}
          pointer-events-none inline-block h-4 w-4 transform rounded-full 
          bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
}
