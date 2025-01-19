interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const colors = [
  { name: "blue", value: "#3B82F6" },
  { name: "purple", value: "#8B5CF6" },
  { name: "pink", value: "#EC4899" },
  { name: "green", value: "#10B981" },
  { name: "orange", value: "#F97316" },
  { name: "red", value: "#EF4444" },
];

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {colors.map((color) => (
        <button
          key={color.name}
          className={`w-8 h-8 rounded-full transition-transform ${
            value === color.name
              ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
              : ""
          }`}
          style={{ backgroundColor: color.value }}
          onClick={() => onChange(color.name)}
          title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
        />
      ))}
    </div>
  );
}
