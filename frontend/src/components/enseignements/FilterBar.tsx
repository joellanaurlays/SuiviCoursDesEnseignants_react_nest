import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  fields: FilterField[];
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
  onSearch?: (term: string) => void;
  searchValue?: string;
  onReset?: () => void;
}

const inputClass = "block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#00e5ff] focus:border-[#00e5ff] sm:text-sm rounded-md";

export function FilterBar({
  fields,
  filters,
  onFiltersChange,
  onSearch,
  searchValue = '',
  onReset,
}: FilterBarProps) {
  const [searchTerm, setSearchTerm] = useState(searchValue);

  const handleFieldChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    setSearchTerm('');
    onFiltersChange({});
    onSearch?.('');
    onReset?.();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {fields.map((field) => (
          <div key={field.key} className="min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
            <select
              value={filters[field.key] ?? ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={inputClass}
            >
              <option value="">Tous</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {onSearch && (
          <div className="min-w-48 flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch(searchTerm);
                }}
                placeholder="Matière, enseignant, mention..."
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {onSearch && (
            <button
              onClick={() => onSearch(searchTerm)}
              className="px-4 py-2 bg-[#0088aa] text-white rounded-md text-sm hover:bg-[#007799] transition-colors font-medium"
            >
              Rechercher
            </button>
          )}
          <button
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 bg-white hover:bg-gray-50"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}