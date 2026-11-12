import React from 'react';
import { MonthPicker } from './MonthPicker';
import { dateStringToMonthIndex } from '../../utils/dateRange';
import { labels } from '../../constants/labels';

interface TimeRangeSliderProps {
  range: [number, number]; // [startIdx, endIdx] from 0 to 35
  startDate: string;
  endDate: string;
  onChangeRange: (newRange: [number, number]) => void;
  onChangeStartDate: (date: string) => void;
  onChangeEndDate: (date: string) => void;
}

export const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  range,
  startDate,
  endDate,
  onChangeRange,
  onChangeStartDate,
  onChangeEndDate,
}) => {
  const [startIdx, endIdx] = range;
  const { fields } = labels.filterDrawer;

  const handleStartSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newStart = Math.min(val, endIdx);
    onChangeRange([newStart, endIdx]);
  };

  const handleEndSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newEnd = Math.max(val, startIdx);
    onChangeRange([startIdx, newEnd]);
  };

  const handleStartPicker = (date: string) => {
    const idx = dateStringToMonthIndex(date);
    onChangeStartDate(date);
    onChangeRange([Math.min(idx, endIdx), endIdx]);
  };

  const handleEndPicker = (date: string) => {
    const idx = dateStringToMonthIndex(date);
    onChangeEndDate(date);
    onChangeRange([startIdx, Math.max(idx, startIdx)]);
  };

  const startPercent = (startIdx / 35) * 100;
  const endPercent = (endIdx / 35) * 100;

  return (
    <div className="space-y-3 p-3 bg-surface border border-border rounded-card">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-primary">
          {fields.timeRange}
        </label>
        <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 border border-primary-100 rounded">
          {startDate} - {endDate}
        </span>
      </div>

      {/* Dual Slider Bar */}
      <div className="pt-2 px-1">
        <div className="relative h-6 flex items-center">
          {/* Track background */}
          <div className="absolute w-full h-2 bg-primary-100 rounded-full" />

          {/* Active colored bar between handles */}
          <div
            className="absolute h-2 bg-primary-700 rounded-full"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          />

          {/* Slider input 1 (start) */}
          <input
            type="range"
            min={0}
            max={35}
            value={startIdx}
            onChange={handleStartSlider}
            aria-label={`${fields.startMonth} slider`}
            className="absolute w-full h-2 opacity-0 cursor-pointer pointer-events-auto z-20"
          />

          {/* Slider input 2 (end) */}
          <input
            type="range"
            min={0}
            max={35}
            value={endIdx}
            onChange={handleEndSlider}
            aria-label={`${fields.endMonth} slider`}
            className="absolute w-full h-2 opacity-0 cursor-pointer pointer-events-auto z-20"
          />

          {/* Visual thumb for Start */}
          <div
            className="absolute w-4 h-4 rounded-full bg-surface border-2 border-primary-700 shadow-sm pointer-events-none z-10 -ml-2"
            style={{ left: `${startPercent}%` }}
          />

          {/* Visual thumb for End */}
          <div
            className="absolute w-4 h-4 rounded-full bg-primary-700 border-2 border-surface shadow-sm pointer-events-none z-10 -ml-2"
            style={{ left: `${endPercent}%` }}
          />
        </div>

        {/* Year Ticks: 2025, 2026, 2027 */}
        <div className="flex justify-between text-[10px] font-medium text-text-secondary pt-1 px-1">
          <span>2025</span>
          <span>2026</span>
          <span>2027</span>
        </div>
      </div>

      {/* Synced Month Pickers */}
      <div className="flex gap-2 pt-1">
        <MonthPicker
          label={fields.startMonth}
          value={startDate}
          onChange={handleStartPicker}
        />
        <MonthPicker
          label={fields.endMonth}
          value={endDate}
          onChange={handleEndPicker}
        />
      </div>
    </div>
  );
};
