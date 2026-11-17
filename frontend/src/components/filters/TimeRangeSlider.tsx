import React from 'react';
import { MonthPicker } from './MonthPicker';
import {
  dateStringToMonthIndex,
  getGrainPeriods,
  monthIndexToDateString,
} from '../../utils/dateRange';
import { labels } from '../../constants/labels';
import { TimeGrain } from '../../types';

interface TimeRangeSliderProps {
  range: [number, number];
  startDate: string;
  endDate: string;
  grain?: TimeGrain | string;
  onChangeRange: (newRange: [number, number]) => void;
  onChangeStartDate: (date: string) => void;
  onChangeEndDate: (date: string) => void;
}

export const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  range,
  startDate,
  endDate,
  grain = 'month',
  onChangeRange,
  onChangeStartDate,
  onChangeEndDate,
}) => {
  const periods = getGrainPeriods(grain);
  const maxIdx = Math.max(1, periods.length - 1);

  const startIdx = Math.max(0, Math.min(maxIdx, range[0]));
  const endIdx = Math.max(startIdx, Math.min(maxIdx, range[1]));

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
    const idx = dateStringToMonthIndex(date, grain);
    onChangeStartDate(date);
    onChangeRange([Math.min(idx, endIdx), endIdx]);
  };

  const handleEndPicker = (date: string) => {
    const idx = dateStringToMonthIndex(date, grain);
    onChangeEndDate(date);
    onChangeRange([startIdx, Math.max(idx, startIdx)]);
  };

  const startPercent = (startIdx / maxIdx) * 100;
  const endPercent = (endIdx / maxIdx) * 100;

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
              width: `${Math.max(0, endPercent - startPercent)}%`,
            }}
          />

          {/* Slider input 1 (start) */}
          <input
            type="range"
            min={0}
            max={maxIdx}
            value={startIdx}
            onChange={handleStartSlider}
            aria-label={`${fields.startMonth} slider`}
            className="absolute w-full h-2 opacity-0 cursor-pointer pointer-events-auto z-20"
          />

          {/* Slider input 2 (end) */}
          <input
            type="range"
            min={0}
            max={maxIdx}
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

        {/* Ticks */}
        <div className="flex justify-between text-[10px] font-medium text-text-secondary pt-1 px-1">
          <span>{periods[0]}</span>
          <span>{periods[Math.floor(periods.length / 2)]}</span>
          <span>{periods[periods.length - 1]}</span>
        </div>
      </div>

      {/* Synced Period Pickers */}
      <div className="flex gap-2 pt-1">
        <MonthPicker
          label={fields.startMonth}
          value={startDate}
          grain={grain}
          onChange={handleStartPicker}
        />
        <MonthPicker
          label={fields.endMonth}
          value={endDate}
          grain={grain}
          onChange={handleEndPicker}
        />
      </div>
    </div>
  );
};
