import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useDataReviewCalendarFeeds } from '../../hooks/useDataReview';

export const CalendarPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const { data: calendarFeeds = [] } = useDataReviewCalendarFeeds();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDay(null);
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust Monday-first (0 = Mon, 6 = Sun)
  const startOffset = (firstDayOfWeek + 6) % 7;

  // Filter feeds for the current displayed year and month
  const getFeedsForDay = (day: number) => {
    return calendarFeeds.filter(feed => {
      const d = new Date(feed.date);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === day
      );
    });
  };

  // Color logic for chips:
  // green = loaded on time
  // red = delayed/failed
  // amber = due today/upcoming
  // grey = scheduled
  const getChipStyle = (feed: any, day: number) => {
    const isPastOrToday =
      currentYear < today.getFullYear() ||
      (currentYear === today.getFullYear() && currentMonth < today.getMonth()) ||
      (currentYear === today.getFullYear() && currentMonth === today.getMonth() && day <= today.getDate());

    if (feed.status === 'loaded' && feed.delayHours === 0) {
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
        label: 'Loaded on time',
      };
    }
    if (feed.status === 'delayed' || feed.status === 'failed' || (feed.status === 'loaded' && feed.delayHours > 0)) {
      return {
        bg: 'bg-red-100 text-red-800 border-red-300',
        dot: 'bg-red-500',
        label: feed.status === 'failed' ? 'Failed' : `Delayed (${feed.delayHours}h)`,
      };
    }
    if (feed.status === 'pending') {
      if (isPastOrToday || day <= today.getDate() + 3) {
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: 'Due today / upcoming',
        };
      }
      return {
        bg: 'bg-gray-100 text-gray-700 border-gray-300',
        dot: 'bg-gray-400',
        label: 'Scheduled',
      };
    }
    return {
      bg: 'bg-gray-100 text-gray-700 border-gray-300',
      dot: 'bg-gray-400',
      label: 'Scheduled',
    };
  };

  const selectedDayFeeds = selectedDay ? getFeedsForDay(selectedDay) : [];

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Planning cycle calendar"
        className={`p-2 rounded-card text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative ${
          isOpen ? 'bg-white/20 text-white ring-1 ring-white/30' : ''
        }`}
        aria-label="Planning cycle calendar"
      >
        <CalendarIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] sm:w-[460px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-gray-800 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2 py-0.5 text-[11px] font-medium bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 ml-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thin Governance Strip */}
          <div className="bg-primary-50/60 border-b border-gray-200 px-3 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
              Planning cycle governance
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              <div className="bg-white border border-primary-200 rounded px-1.5 py-1 text-center shadow-xs">
                <span className="font-bold text-primary-700">W1</span>{' '}
                <span className="text-gray-600 block truncate">Activity / pre-demand</span>
              </div>
              <div className="bg-white border border-primary-200 rounded px-1.5 py-1 text-center shadow-xs">
                <span className="font-bold text-primary-700">W2</span>{' '}
                <span className="text-gray-600 block truncate">Demand review & lock</span>
              </div>
              <div className="bg-white border border-primary-200 rounded px-1.5 py-1 text-center shadow-xs">
                <span className="font-bold text-primary-700">W3</span>{' '}
                <span className="text-gray-600 block truncate">DSR / value review</span>
              </div>
              <div className="bg-white border border-primary-200 rounded px-1.5 py-1 text-center shadow-xs">
                <span className="font-bold text-primary-700">W4</span>{' '}
                <span className="text-gray-600 block truncate">Pre-S&OP / sign-off</span>
              </div>
            </div>
          </div>

          {/* Calendar Weekday Names */}
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-500 py-1.5 border-b border-gray-100 bg-gray-50/40">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 p-2 gap-1 text-xs max-h-[260px] overflow-y-auto">
            {/* Empty slots for offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 bg-gray-50/40 rounded-sm" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const feeds = getFeedsForDay(day);
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();
              const isSelected = selectedDay === day;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`h-14 p-1 rounded-md border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50/40 ring-1 ring-primary-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] font-medium leading-none px-1 py-0.5 rounded ${
                        isToday
                          ? 'bg-primary-600 text-white font-bold'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                    {feeds.length > 0 && (
                      <span className="text-[9px] font-bold text-gray-500">
                        {feeds.length}
                      </span>
                    )}
                  </div>

                  {/* Chips on day */}
                  <div className="w-full space-y-0.5 overflow-hidden">
                    {feeds.slice(0, 2).map((feed, idx) => {
                      const style = getChipStyle(feed, day);
                      return (
                        <div
                          key={feed.id || idx}
                          title={`${feed.name}: ${style.label}`}
                          className={`text-[9px] px-1 py-0.2 rounded truncate border flex items-center gap-1 ${style.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                          <span className="truncate">{feed.name}</span>
                        </div>
                      );
                    })}
                    {feeds.length > 2 && (
                      <span className="text-[9px] text-gray-500 block leading-tight font-medium pl-0.5">
                        +{feeds.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Feeds Details */}
          <div className="border-t border-gray-200 bg-gray-50 p-3 max-h-[160px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-800">
                {selectedDay
                  ? `Feeds on ${monthNames[currentMonth]} ${selectedDay}, ${currentYear}`
                  : 'Select a day to view feeds'}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> On time
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Delayed/Failed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Due/Upcoming
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Scheduled
                </span>
              </div>
            </div>

            {selectedDayFeeds.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2 text-center">
                No feed loads scheduled for this date.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedDayFeeds.map(feed => {
                  const style = getChipStyle(feed, selectedDay || 1);
                  const feedDate = new Date(feed.date);
                  const timeFormatted = feedDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={feed.id}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-xs flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Database className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-900 truncate">
                              {feed.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 capitalize">
                              {feed.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Source: {feed.source} • Time: {timeFormatted}
                            {feed.rowCount ? ` • ${feed.rowCount.toLocaleString()} rows` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

