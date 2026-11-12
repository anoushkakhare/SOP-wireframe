import React from 'react';
import { MONTHS, YEARS } from '../../utils/dateRange';

interface MonthPickerProps {
  label: string;
  value: string; // e.g. "Jan 2026"
  onChange: (val: string) => void;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ label, value, onChange }) => {
  const [currentMonth, currentYearStr] = value.split(' ');
  const currentYear = parseInt(currentYearStr, 10) || 2026;

  const handleMonthChange = (m: string) => {
    onChange(`${m} ${currentYear}`);
  };

  const handleYearChange = (y: number) => {
    onChange(`${currentMonth} ${y}`);
  };

  return (
    <div className="flex-1 bg-surface border border-border rounded-card p-2 shadow-xs">
      <span className="block text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">
        {label}
      </span>
      <div className="flex gap-1.5">
        <select
          value={currentMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          aria-label={`${label} month`}
          className="w-1/2 text-xs font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer border-b border-border pb-0.5"
        >
          {MONTHS.map((m) => (
            <option key={m} value={m} className="text-text-primary bg-surface">
              {m}
            </option>
          ))}
        </select>
        <select
          value={currentYear}
          onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
          aria-label={`${label} year`}
          className="w-1/2 text-xs font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer border-b border-border pb-0.5"
        >
          {YEARS.map((y) => (
            <option key={y} value={y} className="text-text-primary bg-surface">
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
