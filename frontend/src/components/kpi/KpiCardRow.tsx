import React from 'react';
import { KpiCard } from './KpiCard';
import { KpiItem } from '../../types';
import { labels } from '../../constants/labels';

interface KpiCardRowProps {
  kpis?: KpiItem[];
  isLoading?: boolean;
}

export const KpiCardRow: React.FC<KpiCardRowProps> = ({ kpis = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-[130px] sm:min-w-[145px] max-w-[200px] h-[86px] bg-surface border border-border rounded-card p-2.5 flex flex-col justify-between animate-pulse"
          >
            <div className="h-3 bg-primary-100 rounded w-2/3" />
            <div className="h-6 bg-primary-100 rounded w-4/5 mx-auto" />
            <div className="h-2.5 bg-primary-50 rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!kpis || kpis.length === 0) {
    return (
      <div className="w-full h-16 bg-surface border border-border rounded-card flex items-center justify-center text-xs text-text-secondary">
        {labels.generic.noData}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.key} kpi={kpi} />
      ))}
    </div>
  );
};
