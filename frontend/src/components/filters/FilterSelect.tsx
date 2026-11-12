import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { labels } from '../../constants/labels';

interface FilterSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel?: string;
}

/**
 * FilterSelect – multi-select dropdown in the filter drawer.
 * Uses design-system tokens; checkboxes use primary-700.
 */
export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  allLabel = 'All',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((item) => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const summaryText =
    selected.length === 0
      ? allLabel
      : selected.length === options.length
        ? 'All selected'
        : selected.length <= 2
          ? selected.join(', ')
          : labels.filterDrawer.selectedCount(selected.length);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-card text-left text-xs hover:border-border-strong transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <span className="truncate font-medium text-text-primary pr-2">{summaryText}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-secondary transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded-card shadow-lg z-30 max-h-48 overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100">
          {/* Select all */}
          <div
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-primary-50 rounded cursor-pointer text-xs font-semibold border-b border-border mb-1"
          >
            <div
              className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${selected.length === options.length
                  ? 'bg-primary-700 border-primary-700 text-white'
                  : 'border-border-strong bg-surface'
                }`}
            >
              {selected.length === options.length && <Check className="w-2.5 h-2.5" />}
            </div>
            <span>{selected.length === options.length ? 'Deselect all' : 'Select all'}</span>
          </div>

          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <div
                key={opt}
                onClick={() => toggleOption(opt)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-primary-50 rounded cursor-pointer text-xs font-medium text-text-primary transition-colors"
              >
                <div
                  className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${isChecked
                      ? 'bg-primary-700 border-primary-700 text-white'
                      : 'border-border-strong bg-surface'
                    }`}
                >
                  {isChecked && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className="truncate">{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
