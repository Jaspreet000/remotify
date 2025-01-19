interface SettingFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export default function SettingField({
  label,
  description,
  children,
}: SettingFieldProps) {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1 pr-4">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
