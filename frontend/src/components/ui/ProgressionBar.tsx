interface ProgressionBarProps {
  progression: number;
  showLabel?: boolean;
  labelRight?: boolean;
}

export function ProgressionBar({ progression, showLabel = false, labelRight = false }: ProgressionBarProps) {
  const clamped = Math.min(Math.max(progression, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-full min-w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="bg-[#00e5ff] h-2 rounded-full" style={{ width: `${clamped}%` }}></div>
      </div>
      {showLabel && (
        <span
          className={`text-sm font-bold text-gray-700 ${labelRight ? 'w-12 text-right' : ''}`}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}