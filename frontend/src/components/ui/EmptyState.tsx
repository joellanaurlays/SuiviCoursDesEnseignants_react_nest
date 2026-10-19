import { Inbox } from 'lucide-react';

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-gray-500">
      <Inbox size={28} className="mb-2" />
      <p className="text-center">{message}</p>
    </div>
  );
}