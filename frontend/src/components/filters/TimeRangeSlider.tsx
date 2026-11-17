import React, { useState, useRef, useEffect } from 'react';
import { MonthPicker } from './MonthPicker';
import {
  dateStringToMonthIndex,
  getGrainPeriods,
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

  // Dragging states
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  // Hover & Focus states for popovers
  const [isStartHovered, setIsStartHovered] = useState(false);
  const [isStartFocused, setIsStartFocused] = useState(false);
  const [isEndHovered, setIsEndHovered] = useState(false);
  const [isEndFocused, setIsEndFocused] = useState(false);
  const [lastActive, setLastActive] = useState<'start' | 'end'>('start');

  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startContainerRef = useRef<HTMLDivElement>(null);
  const endContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  // Popover open handlers with ~150ms close delay
  const handleStartMouseEnter = () => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    setLastActive('start');
    setIsStartHovered(true);
  };

  const handleStartMouseLeave = () => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    startTimerRef.current = setTimeout(() => {
      setIsStartHovered(false);
    }, 150);
  };

  const handleStartFocus = () => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    setLastActive('start');
    setIsStartFocused(true);
  };

  const handleStartBlur = () => {
    setTimeout(() => {
      if (
        startContainerRef.current &&
        !startContainerRef.current.contains(document.activeElement)
      ) {
        setIsStartFocused(false);
      }
    }, 0);
  };

  const handleEndMouseEnter = () => {
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    setLastActive('end');
    setIsEndHovered(true);
  };

  const handleEndMouseLeave = () => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    endTimerRef.current = setTimeout(() => {
      setIsEndHovered(false);
    }, 150);
  };

  const handleEndFocus = () => {
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    setLastActive('end');
    setIsEndFocused(true);
  };

  const handleEndBlur = () => {
    setTimeout(() => {
      if (
        endContainerRef.current &&
        !endContainerRef.current.contains(document.activeElement)
      ) {
        setIsEndFocused(false);
      }
    }, 0);
  };

  // Drag handlers for Start Thumb
  const handleStartPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDraggingStart(true);
    setIsStartHovered(false);
    setIsStartFocused(false);
    setLastActive('start');
  };

  const handleStartPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingStart || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newStart = Math.min(Math.round(pct * maxIdx), endIdx);
    if (newStart !== startIdx) {
      onChangeRange([newStart, endIdx]);
      onChangeStartDate(periods[newStart]);
    }
  };

  const handleStartPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingStart) return;
    setIsDraggingStart(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Drag handlers for End Thumb
  const handleEndPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDraggingEnd(true);
    setIsEndHovered(false);
    setIsEndFocused(false);
    setLastActive('end');
  };

  const handleEndPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingEnd || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newEnd = Math.max(startIdx, Math.min(maxIdx, Math.round(pct * maxIdx)));
    if (newEnd !== endIdx) {
      onChangeRange([startIdx, newEnd]);
      onChangeEndDate(periods[newEnd]);
    }
  };

  const handleEndPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingEnd) return;
    setIsDraggingEnd(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Keyboard navigation
  const handleStartKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let newStart = startIdx;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newStart = Math.max(0, startIdx - 1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newStart = Math.min(endIdx, startIdx + 1);
    else if (e.key === 'Home') newStart = 0;
    else if (e.key === 'End') newStart = endIdx;
    else return;
    e.preventDefault();
    onChangeRange([newStart, endIdx]);
    onChangeStartDate(periods[newStart]);
  };

  const handleEndKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let newEnd = endIdx;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newEnd = Math.max(startIdx, endIdx - 1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newEnd = Math.min(maxIdx, endIdx + 1);
    else if (e.key === 'Home') newEnd = startIdx;
    else if (e.key === 'End') newEnd = maxIdx;
    else return;
    e.preventDefault();
    onChangeRange([startIdx, newEnd]);
    onChangeEndDate(periods[newEnd]);
  };

  // Track click handler
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).getAttribute('role') === 'slider') return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const clickedIdx = Math.round(pct * maxIdx);

    if (clickedIdx < startIdx) {
      onChangeRange([clickedIdx, endIdx]);
      onChangeStartDate(periods[clickedIdx]);
    } else if (clickedIdx > endIdx) {
      onChangeRange([startIdx, clickedIdx]);
      onChangeEndDate(periods[clickedIdx]);
    } else {
      if (clickedIdx - startIdx <= endIdx - clickedIdx) {
        onChangeRange([clickedIdx, endIdx]);
        onChangeStartDate(periods[clickedIdx]);
      } else {
        onChangeRange([startIdx, clickedIdx]);
        onChangeEndDate(periods[clickedIdx]);
      }
    }
  };

  // MonthPicker dropdown handlers inside popovers
  const handleStartPicker = (date: string) => {
    const idx = dateStringToMonthIndex(date, grain);
    const newEnd = Math.max(endIdx, idx);
    onChangeRange([idx, newEnd]);
    onChangeStartDate(periods[idx]);
    if (newEnd !== endIdx) {
      onChangeEndDate(periods[newEnd]);
    }
  };

  const handleEndPicker = (date: string) => {
    const idx = dateStringToMonthIndex(date, grain);
    const newStart = Math.min(startIdx, idx);
    onChangeRange([newStart, idx]);
    onChangeEndDate(periods[idx]);
    if (newStart !== startIdx) {
      onChangeStartDate(periods[newStart]);
    }
  };

  const startPercent = (startIdx / maxIdx) * 100;
  const endPercent = (endIdx / maxIdx) * 100;

  const showStartPopover =
    (isStartHovered || isStartFocused) && !isDraggingStart && !isDraggingEnd;
  const showEndPopover =
    (isEndHovered || isEndFocused) && !isDraggingStart && !isDraggingEnd;

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
      <div className="pt-2 px-1 relative">
        <div
          ref={trackRef}
          className="relative h-6 flex items-center cursor-pointer select-none"
          onPointerDown={handleTrackPointerDown}
        >
          {/* Track background */}
          <div className="absolute w-full h-2 bg-primary-100 rounded-full" />

          {/* Active colored bar between handles */}
          <div
            className="absolute h-2 bg-primary-700 rounded-full pointer-events-none"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(0, endPercent - startPercent)}%`,
            }}
          />

          {/* Start Thumb + Popover Container */}
          <div
            ref={startContainerRef}
            className={`absolute top-0 bottom-0 pointer-events-none ${
              lastActive === 'start' ? 'z-40' : 'z-30'
            }`}
            style={{ left: `${startPercent}%` }}
            onMouseEnter={handleStartMouseEnter}
            onMouseLeave={handleStartMouseLeave}
            onFocus={handleStartFocus}
            onBlur={handleStartBlur}
          >
            {/* Popover */}
            {showStartPopover && (
              <div
                className="absolute bottom-full mb-2 z-50 min-w-[150px] bg-surface border border-border rounded-card p-2 shadow-lg pointer-events-auto"
                style={{
                  left: '0',
                  transform: `translateX(-${startPercent}%)`,
                }}
              >
                {/* Invisible hover bridge to thumb */}
                <div className="absolute top-full left-0 right-0 h-3" />
                <MonthPicker
                  label={fields.startMonth}
                  value={startDate}
                  grain={grain}
                  onChange={handleStartPicker}
                  className=""
                />
              </div>
            )}

            {/* Visual thumb for Start */}
            <div
              tabIndex={0}
              role="slider"
              aria-label={`${fields.startMonth} slider`}
              aria-valuenow={startIdx}
              aria-valuemin={0}
              aria-valuemax={endIdx}
              aria-valuetext={startDate}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface border-2 border-primary-700 shadow-sm -ml-2 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 select-none pointer-events-auto"
              onPointerDown={handleStartPointerDown}
              onPointerMove={handleStartPointerMove}
              onPointerUp={handleStartPointerUp}
              onPointerCancel={handleStartPointerUp}
              onKeyDown={handleStartKeyDown}
            />
          </div>

          {/* End Thumb + Popover Container */}
          <div
            ref={endContainerRef}
            className={`absolute top-0 bottom-0 pointer-events-none ${
              lastActive === 'end' ? 'z-40' : 'z-30'
            }`}
            style={{ left: `${endPercent}%` }}
            onMouseEnter={handleEndMouseEnter}
            onMouseLeave={handleEndMouseLeave}
            onFocus={handleEndFocus}
            onBlur={handleEndBlur}
          >
            {/* Popover */}
            {showEndPopover && (
              <div
                className="absolute bottom-full mb-2 z-50 min-w-[150px] bg-surface border border-border rounded-card p-2 shadow-lg pointer-events-auto"
                style={{
                  left: '0',
                  transform: `translateX(-${endPercent}%)`,
                }}
              >
                {/* Invisible hover bridge to thumb */}
                <div className="absolute top-full left-0 right-0 h-3" />
                <MonthPicker
                  label={fields.endMonth}
                  value={endDate}
                  grain={grain}
                  onChange={handleEndPicker}
                  className=""
                />
              </div>
            )}

            {/* Visual thumb for End */}
            <div
              tabIndex={0}
              role="slider"
              aria-label={`${fields.endMonth} slider`}
              aria-valuenow={endIdx}
              aria-valuemin={startIdx}
              aria-valuemax={maxIdx}
              aria-valuetext={endDate}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary-700 border-2 border-surface shadow-sm -ml-2 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 select-none pointer-events-auto"
              onPointerDown={handleEndPointerDown}
              onPointerMove={handleEndPointerMove}
              onPointerUp={handleEndPointerUp}
              onPointerCancel={handleEndPointerUp}
              onKeyDown={handleEndKeyDown}
            />
          </div>
        </div>

        {/* Ticks */}
        <div className="flex justify-between text-[10px] font-medium text-text-secondary pt-1 px-1">
          <span>{periods[0]}</span>
          <span>{periods[Math.floor(periods.length / 2)]}</span>
          <span>{periods[periods.length - 1]}</span>
        </div>
      </div>
    </div>
  );
};
