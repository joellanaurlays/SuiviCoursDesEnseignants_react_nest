import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
  children?: ReactNode;
}

export function StatCard({ label, value, hint, accent, children }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-6 ${
        accent ? 'border-emit-sky bg-gradient-to-br from-emit-ice to-white' : 'border-gray-200'
      }`}
    >
      <p className="text-sm text-gray-500 font-medium mb-2">{label}</p>
      <p className="text-4xl font-bold text-[#03045E]">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}