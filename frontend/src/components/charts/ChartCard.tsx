import React from 'react';
import { Maximize2, X } from 'lucide-react';
import { labels } from '../../constants/labels';

interface ChartCardProps {
  title: string;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  children: React.ReactNode;
  height?: string;
  fullscreenHeight?: string;
  headerAction?: React.ReactNode;
  className?: string;
}

/**
 * ChartCard – white card with 1px border, 8px radius, subtle shadow.
 * Header uses sentence-case title, fullscreen toggle with tooltip.
 */
export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  onToggleFullscreen,
  isFullscreen = false,
  children,
  height = 'h-[310px]',
  fullscreenHeight = 'w-full h-[540px]',
  headerAction,
  className = '',
}) => {
  const fsLabel = isFullscreen
    ? labels.charts.fullscreenExit
    : labels.charts.fullscreenExpand;

  return (
    <div
      className={`bg-surface border border-border rounded-card shadow-card flex flex-col overflow-hidden transition-all duration-200 ${
        isFullscreen ? fullscreenHeight : height
      } ${className}`}
    >
      {/* Chart header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-surface select-none">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary tracking-tight truncate">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {headerAction}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={fsLabel}
              title={fsLabel}
              className="w-7 h-7 flex items-center justify-center rounded-card hover:bg-primary-50 text-text-secondary hover:text-primary-700 transition-colors border border-transparent hover:border-border"
            >
              {isFullscreen ? (
                <X className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Chart canvas */}
      <div className="flex-1 p-2 sm:p-3 relative min-h-0 w-full">
        {children}
      </div>
    </div>
  );
};
