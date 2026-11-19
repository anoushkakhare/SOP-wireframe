import React, { useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { PipelineStepperCard } from '../components/data-review/PipelineStepperCard';
import { HistoryTableCard } from '../components/data-review/HistoryTableCard';
import { DataReviewCard } from '../components/data-review/DataReviewCard';
import { DataValidationCard } from '../components/data-review/DataValidationCard';
import { InnovationCard } from '../components/data-review/InnovationCard';
import { SpecialPacksCard } from '../components/data-review/SpecialPacksCard';
import { SignoffCard } from '../components/data-review/SignoffCard';

import {
  useDataReviewPipeline,
  useDataReviewHistory,
  useDataReviewReadiness,
} from '../hooks/useDataReview';
import { useAuthStore } from '../store/authStore';

export const DataReviewPage: React.FC = () => {
  const { user, layoutManifest } = useAuthStore();
  const roleTitle = layoutManifest?.roleTitle || user?.roleTitle || 'Demand Planner';

  // Persist current page as last used
  useEffect(() => {
    localStorage.setItem('unilever_last_page', '/data-review');
  }, []);

  const { data: pipeline = [], isLoading: isPipelineLoading } = useDataReviewPipeline();
  const { data: history = [], isLoading: isHistoryLoading } = useDataReviewHistory();
  const { data: readiness, isLoading: isReadinessLoading } = useDataReviewReadiness();

  return (
    <AppShell roleTitle={roleTitle} userName={user?.name}>
      <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Page Title & Breadcrumb */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span>S&OP Planning Cycle</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Data Readiness</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Data Review & Ingestion
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify feed ingestion pipelines, data quality checks, and sign off readiness for the cycle
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-800 border border-primary-200">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              Cycle: {readiness?.signoff?.cycle || '2026-11'}
            </span>
          </div>
        </div>

        {/* 1. Integration pipeline & schedule */}
        <PipelineStepperCard feeds={pipeline} isLoading={isPipelineLoading} />

        {/* 2. Integration status & history */}
        <HistoryTableCard history={history} isLoading={isHistoryLoading} />

        {/* 3. Data review visual card */}
        <DataReviewCard orderNumber={3} />

        {/* 4. Data validation card */}
        <DataValidationCard orderNumber={4} />

        {/* 5. Innovation card */}
        <InnovationCard orderNumber={5} />

        {/* 6. Special packs card */}
        <SpecialPacksCard orderNumber={6} />

        {/* 7. Sign-off */}
        <SignoffCard readiness={readiness} isLoading={isReadinessLoading} />
      </div>
    </AppShell>
  );
};

