import { AlertCircle } from 'lucide-react';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-red-600 bg-red-50 rounded-xl border border-red-100">
      <AlertCircle size={24} className="mb-2" />
      <p className="text-center font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}