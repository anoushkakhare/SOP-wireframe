import React, { useState, useRef, useEffect } from 'react';
import { GitCompare, X, Check } from 'lucide-react';
import { useViewStore } from '../../store/viewStore';
import { useFilterStore } from '../../store/filterStore';

export const ComparePopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { compare, setCompare } = useViewStore();
  const { appliedFilters } = useFilterStore();

  const cycleA = appliedFilters.planningCycle || 'Current cycle';

  const ALL_CYCLES = ['Current cycle', 'MRF', 'Prior cycle snapshot'];
  const otherCycles = ALL_CYCLES.filter((c) => c !== cycleA);

  const options = [
    ...otherCycles.map((c) => ({ label: c, value: c })),
    { label: 'Actuals (past periods only)', value: 'Actuals' },
  ];

  // Close on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (bValue: string) => {
    setCompare({ on: true, b: bValue });
    setIsOpen(false);
  };

  const handleExit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCompare({ on: false, b: '' });
  };

  return (
    <div className="relative flex items-center gap-2" ref={popoverRef}>
      {/* Compare button */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Compare planning cycles"
          title={compare.on ? `Comparing ${cycleA} vs ${compare.b}` : 'Compare'}
          className={`h-9 px-2.5 flex items-center gap-1.5 rounded-full border transition-all shadow-sm ${
            compare.on
              ? 'bg-amber-500 text-white border-amber-400 font-semibold shadow-amber-900/20'
              : 'bg-white/15 text-white border-white/30 hover:bg-white/25 hover:border-white/50'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span className="text-xs hidden md:inline">Compare</span>
        </button>
      </div>

      {/* Header chip when comparing */}
      {compare.on && compare.b && (
        <div
          role="status"
          aria-label={`Comparing ${cycleA} vs ${compare.b}`}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 text-xs font-semibold shadow-sm animate-in fade-in"
        >
          <span>Comparing {cycleA} vs {compare.b}</span>
          <button
            type="button"
            onClick={handleExit}
            title="Exit compare mode"
            aria-label="Exit compare mode"
            className="p-0.5 rounded-full hover:bg-amber-400/30 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-surface border border-border rounded-lg shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="text-xs font-bold text-text-primary">
              Compare {cycleA} with:
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors"
              aria-label="Close compare popover"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {options.map((opt) => {
              const isSelected = compare.on && compare.b === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200'
                      : 'text-text-primary hover:bg-background-hover hover:text-primary-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary-700" />}
                </button>
              );
            })}
          </div>

          {compare.on && (
            <div className="mt-2 pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCompare({ on: false, b: '' });
                  setIsOpen(false);
                }}
                className="text-[11px] text-negative font-medium hover:underline"
              >
                Exit compare mode
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

