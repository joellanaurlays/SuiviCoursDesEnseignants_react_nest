import { Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Chargement en cours...' }: { label?: string }) {
  return (
    <div className="flex justify-center items-center p-12 text-[#0077B6]">
      <Loader2 className="animate-spin mr-2" size={20} />
      <span>{label}</span>
    </div>
  );
}