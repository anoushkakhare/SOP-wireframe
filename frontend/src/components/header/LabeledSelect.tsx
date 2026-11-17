import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface LabeledSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  /** Optional renderer for each option in the native select (unused in native select, but accepted for compat) */
  renderOption?: (opt: Option) => React.ReactNode;
}

/**
 * LabeledSelect – header dropdown sitting on the primary-700 header.
 * Uses a translucent white background so the brand colour shows through.
 * Label text and option text are white for readability on the dark header.
 */
export const LabeledSelect: React.FC<LabeledSelectProps> = ({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  renderOption: _renderOption,
}) => {
  return (
    <div className="relative inline-flex flex-col justify-center min-w-[130px] sm:min-w-[145px] px-2.5 py-1.5 bg-white/12 border border-white/25 rounded-card hover:bg-white/20 transition-colors">
      <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider leading-none mb-0.5">
        {label}
      </span>
      <div className="flex items-center justify-between">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel || label}
          className="appearance-none bg-transparent text-xs sm:text-sm font-semibold text-white pr-5 cursor-pointer focus:outline-none w-full truncate"
          style={{ colorScheme: 'dark' }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-sm font-normal text-text-primary bg-surface">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-white/70 absolute right-2 pointer-events-none" />
      </div>
    </div>
  );
};
