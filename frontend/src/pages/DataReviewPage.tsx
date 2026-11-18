import React, { useEffect, useState } from 'react';
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Persist current page as last used
  useEffect(() => {
    localStorage.setItem('unilever_last_page', '/data-review');
  }, []);

  const { data: pipeline = [], isLoading: isPipelineLoading } = useDataReviewPipeline();
  const { data: history = [], isLoading: isHistoryLoading } = useDataReviewHistory();
  const { data: readiness, isLoading: isReadinessLoading } = useDataReviewReadiness();

  // Top-level sections to render in order (history panel is part of section 1)
  const sections = [
    {
      key: 'pipeline',
      render: (index: number) => (
        <div key="pipeline-section">
          {/* Section 1: Integration pipeline & schedule */}
          <PipelineStepperCard
            feeds={pipeline}
            isLoading={isPipelineLoading}
            orderNumber={index}
            isHistoryOpen={isHistoryOpen}
            onToggleHistory={() => setIsHistoryOpen(prev => !prev)}
          />

          {/* Section 1 sub-panel: Integration status & history (hidden by default, smoothly expandable) */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isHistoryOpen ? 'max-h-[2000px] opacity-100 mb-5' : 'max-h-0 opacity-0 mb-0 pointer-events-none'
            }`}
            aria-hidden={!isHistoryOpen}
          >
            <HistoryTableCard
              history={history}
              isLoading={isHistoryLoading}
              isExpanded={isHistoryOpen}
              onToggleExpand={() => setIsHistoryOpen(prev => !prev)}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'data-review',
      render: (index: number) => <DataReviewCard key="data-review" orderNumber={index} />,
    },
    {
      key: 'data-validation',
      render: (index: number) => <DataValidationCard key="data-validation" orderNumber={index} />,
    },
    {
      key: 'innovation',
      render: (index: number) => <InnovationCard key="innovation" orderNumber={index} />,
    },
    {
      key: 'special-packs',
      render: (index: number) => <SpecialPacksCard key="special-packs" orderNumber={index} />,
    },
    {
      key: 'signoff',
      render: (index: number) => (
        <SignoffCard
          key="signoff"
          orderNumber={index}
          readiness={readiness}
          isLoading={isReadinessLoading}
        />
      ),
    },
  ];

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

        {/* Dynamically numbered sections */}
        {sections.map((section, idx) => section.render(idx + 1))}
      </div>
    </AppShell>
  );
};

