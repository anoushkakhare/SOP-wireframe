import React from 'react';
import { MONTHS, YEARS, getGrainPeriods } from '../../utils/dateRange';

interface MonthPickerProps {
  label: string;
  value: string;
  grain?: string;
  onChange: (val: string) => void;
  className?: string;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  label,
  value,
  grain = 'month',
  onChange,
  className,
}) => {
  const periods = getGrainPeriods(grain);
  const isMonthGrain = grain === 'month';

  const containerClass =
    className !== undefined
      ? className
      : 'flex-1 bg-surface border border-border rounded-card p-2 shadow-xs';

  if (!isMonthGrain) {
    return (
      <div className={containerClass}>
        <span className="block text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} select`}
          className="w-full text-xs font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer border-b border-border pb-0.5"
        >
          {periods.map((p) => (
            <option key={p} value={p} className="text-text-primary bg-surface">
              {p}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const [currentMonth, currentYearStr] = value.split(' ');
  const currentYear = parseInt(currentYearStr, 10) || 2026;

  const handleMonthChange = (m: string) => {
    const yr2 = String(currentYear).slice(-2);
    onChange(`${m} ${yr2}`);
  };

  const handleYearChange = (y: number) => {
    const yr2 = String(y).slice(-2);
    onChange(`${currentMonth} ${yr2}`);
  };

  const normYear = currentYear < 100 ? 2000 + currentYear : currentYear;

  return (
    <div className={containerClass}>
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
          value={normYear}
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
