import React from 'react';

interface RoleBadgeProps {
  roleTitle: string;
  userName?: string;
}

/**
 * RoleBadge – shown in the top-left of the sticky header.
 * Displays a user avatar initial, the user's name and their role.
 * "Role based access" subtitle removed per spec.
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({ roleTitle, userName = 'Nishtha Agarwal' }) => {
  const displayName = userName?.trim() || 'Nishtha Agarwal';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      {/* Avatar circle – white bg, primary text */}
      <div
        className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-primary-700 text-sm font-bold shrink-0 shadow-sm select-none"
        aria-hidden="true"
      >
        {initial}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white leading-tight truncate max-w-[140px]">
          {displayName}
        </span>
        <span className="text-[11px] text-white/65 leading-none font-normal">
          {roleTitle}
        </span>
      </div>
    </div>
  );
};
