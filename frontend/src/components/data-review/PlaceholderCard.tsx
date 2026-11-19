import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

interface PlaceholderCardProps {
  orderNumber: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'green' | 'amber' | 'blue' | 'gray';
  children: React.ReactNode;
}

export const PlaceholderCard: React.FC<PlaceholderCardProps> = ({
  orderNumber,
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'gray',
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'green':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'gray':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer border-b border-gray-100"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm">
            {orderNumber}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {badge && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
            >
              {badge}
            </span>
          )}
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Body */}
      {!isCollapsed && <div className="p-5">{children}</div>}
    </div>
  );
};

