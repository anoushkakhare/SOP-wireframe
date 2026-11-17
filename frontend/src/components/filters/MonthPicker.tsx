import React from 'react';
import { MONTHS, YEARS, getWeeksInYear, normalizeGrain } from '../../utils/dateRange';

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
  const g = normalizeGrain(grain);

  const containerClass =
    className !== undefined
      ? className
      : 'flex-1 bg-surface border border-border rounded-card p-2 shadow-xs';

  // 1. Year view: years only
  if (g === 'year') {
    const match = value.match(/\d{4}|\d{2}/);
    let currentYear = match ? parseInt(match[0], 10) : 2026;
    if (currentYear < 100) currentYear += 2000;

    return (
      <div className={containerClass}>
        <span className="block text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </span>
        <select
          value={currentYear}
          onChange={(e) => onChange(`FY${e.target.value}`)}
          aria-label={`${label} year`}
          className="w-full text-xs font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer border-b border-border pb-0.5"
        >
          {YEARS.map((y) => (
            <option key={y} value={y} className="text-text-primary bg-surface">
              {y}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // 2. Half-year view: H1/H2 + year
  if (g === 'half') {
    const parts = value.trim().split(' ');
    const currentHalf = parts[0]?.toUpperCase().startsWith('H2') ? 'H2' : 'H1';
    let currentYear = parseInt(parts[1], 10) || 2026;
    if (currentYear < 100) currentYear += 2000;

    return (
      <div className={containerClass}>
        <span className="block text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </span>
        <div className="flex gap-1.5">
          <select
            value={currentHalf}
            onChange={(e) => onChange(`${e.target.value} ${currentYear}`)}
            aria-label={`${label} half`}
            className="w-1/2 text-xs font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer border-b border-border pb-0.5"
          >
            <option value="H1" className="text-text-primary bg-surface">H1</option>
            <option value="H2" className="text-text-primary bg-surface">H2</option>
          </select>
          <select
            value={currentYear}
            onChange={(e) => onChange(`${currentHalf} ${e.target.value}`)}
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
  }

  // 3. Quarter view: Q1-Q4 + year
  if (g === 'quarter') {
    const parts = value.trim().split(' ');
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentQ = quarters.find((q) => q === parts[0]?.toUpperCase()) || 'Q1';
    let currentYear = parseInt(parts[1], 10) || 2026;
    if (currentYear < 100) currentYear += 2000;

    return (
      <div className={containerClass}>
        <span className="block text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </span>
        <div className="flex gap-1.5">
          <select
            value={currentQ}
            onChange={(e) => onChange(`${e.target.value} ${currentYear}`)}
            aria-label={`${label} quarter`}
            className="w-1/2 text-xs font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer border-b border-border pb-0.5"
          >
            {quarters.map((q) => (
              <option key={q} value={q} className="text-text-primary bg-surface">
                {q}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => onChange(`${currentQ} ${e.target.value}`)}
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
  }

  // 4. Week view: W01-W53 (filtered to valid periods) + year
  if (g === 'week') {
    const parts = value.trim().split(' ');
    let currentYear = parseInt(parts[1], 10) || 2026;
    if (currentYear < 100) currentYear += 2000;

    const maxWeeks = getWeeksInYear(currentYear);
    const weekOptions = Array.from({ length: maxWeeks }, (_, i) => `W${String(i + 1).padStart(2, '0')}`);
    let currentWeek = parts[0]?.toUpperCase() || 'W01';
    if (!weekOptions.includes(currentWeek)) {
      currentWeek = weekOptions[weekOptions.length - 1];
    }

    return (
      <div className={containerClass}>
        <span className="block text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </span>
        <div className="flex gap-1.5">
          <select
            value={currentWeek}
            onChange={(e) => onChange(`${e.target.value} ${currentYear}`)}
            aria-label={`${label} week`}
            className="w-1/2 text-xs font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer border-b border-border pb-0.5"
          >
            {weekOptions.map((w) => (
              <option key={w} value={w} className="text-text-primary bg-surface">
                {w}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => {
              const newYear = parseInt(e.target.value, 10);
              const newMax = getWeeksInYear(newYear);
              const wNum = parseInt(currentWeek.replace('W', ''), 10) || 1;
              const validW = wNum > newMax ? `W${newMax}` : currentWeek;
              onChange(`${validW} ${newYear}`);
            }}
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
  }

  // 5. Month view: month + year
  const [currentMonth = 'Jan', currentYearStr = '2026'] = value.split(' ');
  let currentYear = parseInt(currentYearStr, 10) || 2026;
  if (currentYear < 100) currentYear += 2000;
  const monthVal = MONTHS.includes(currentMonth) ? currentMonth : 'Jan';

  return (
    <div className={containerClass}>
      <span className="block text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">
        {label}
      </span>
      <div className="flex gap-1.5">
        <select
          value={monthVal}
          onChange={(e) => onChange(`${e.target.value} ${currentYear}`)}
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
          onChange={(e) => onChange(`${monthVal} ${e.target.value}`)}
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
