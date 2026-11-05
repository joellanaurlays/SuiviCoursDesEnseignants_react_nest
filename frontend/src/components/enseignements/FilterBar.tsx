import { useState } from 'react';
import { ChevronDown, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

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

  const activeCount =
    Object.values(filters).filter((value) => value && value.trim() !== '').length +
    (searchTerm.trim() ? 1 : 0);

  return (
    <section className="emit-card mb-6 p-4 sm:p-5" aria-label="Filtres de recherche">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#CAF0F8] text-[#0077B6]" aria-hidden="true">
            <SlidersHorizontal size={16} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#03045E]">Filtres</h2>
            <p className="text-xs text-slate-500">
              {activeCount > 0 ? `${activeCount} critère(s) actif(s)` : 'Aucun filtre appliqué'}
            </p>
          </div>
        </div>

        <button type="button" onClick={handleReset} className="emit-btn-ghost self-start sm:self-auto">
          <RotateCcw size={14} aria-hidden="true" />
          Réinitialiser
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {fields.map((field) => (
          <div key={field.key} className="min-w-40 flex-1 basis-40">
            <label htmlFor={`filtre-${field.key}`} className="emit-label">
              {field.label}
            </label>
            <div className="relative">
              <select
                id={`filtre-${field.key}`}
                value={filters[field.key] ?? ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="emit-input appearance-none pr-9"
              >
                <option value="">Tous</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        ))}

        {onSearch && (
          <div className="min-w-56 flex-1 basis-56">
            <label htmlFor="filtre-recherche" className="emit-label">
              Recherche
            </label>
            <div className="relative">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="filtre-recherche"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch(searchTerm);
                }}
                placeholder="Matière, enseignant, mention..."
                className="emit-input pl-9"
              />
            </div>
          </div>
        )}

        {onSearch && (
          <button type="button" onClick={() => onSearch(searchTerm)} className="emit-btn-primary">
            <Search size={14} aria-hidden="true" />
            Rechercher
          </button>
        )}
      </div>
    </section>
  );
}
