import React from 'react';

interface HeaderIconButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  badge?: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * HeaderIconButton – circular icon buttons in the sticky header.
 * White with a subtle border at rest; lighter primary fill when active.
 * Tooltip appears below on hover/focus.
 */
export const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  icon,
  tooltip,
  onClick,
  active = false,
  badge,
  disabled = false,
  ariaLabel,
}) => {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel || tooltip}
        className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all shadow-sm ${
          active
            ? 'bg-white text-primary-700 border-white/80'
            : 'bg-white/15 text-white border-white/30 hover:bg-white/25 hover:border-white/50'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {icon}
        {badge}
      </button>

      {/* Tooltip */}
      <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-text-primary text-white text-[11px] font-medium py-1 px-2.5 rounded-card whitespace-nowrap shadow-md">
          {tooltip}
        </div>
      </div>
    </div>
  );
};
