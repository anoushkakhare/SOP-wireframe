import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { PipelineStepperCard } from '../components/data-review/PipelineStepperCard';
import { HistoryTableCard } from '../components/data-review/HistoryTableCard';
import { DataReviewCard } from '../components/data-review/DataReviewCard';
import { DataValidationCard } from '../components/data-review/DataValidationCard';
import { InnovationCard } from '../components/data-review/InnovationCard';
import { SpecialPacksCard } from '../components/data-review/SpecialPacksCard';
import { SignoffCard } from '../components/data-review/SignoffCard';
import { DATA_REVIEW_SECTIONS } from '../constants/dataReviewSections';

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

  // Track collapsed states for each section
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({
    'section-pipeline': false,
    'section-data-review': false,
    'section-validation': false,
    'section-innovation': false,
    'section-special-packs': false,
    'section-signoff': false,
  });

  const toggleSectionCollapse = useCallback((id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Listen for nav button clicks to auto-expand collapsed target section
  useEffect(() => {
    const handleNavClick = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetId = customEvent.detail;
      if (targetId) {
        setCollapsedMap((prev) => {
          if (prev[targetId]) {
            return { ...prev, [targetId]: false };
          }
          return prev;
        });
      }
    };

    window.addEventListener('sop-data-review-nav-click', handleNavClick);
    return () => {
      window.removeEventListener('sop-data-review-nav-click', handleNavClick);
    };
  }, []);

  // IntersectionObserver to dispatch active section event to header nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
          );
          const activeId = visibleEntries[0].target.id;
          window.dispatchEvent(
            new CustomEvent('sop-data-review-active-section', { detail: activeId })
          );
        }
      },
      {
        rootMargin: '-80px 0px -40% 0px',
        threshold: [0, 0.2, 0.5],
      }
    );

    DATA_REVIEW_SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

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
      id: DATA_REVIEW_SECTIONS[0].id,
      render: (index: number) => (
        <div key="pipeline-section" id={DATA_REVIEW_SECTIONS[0].id} className="scroll-mt-[72px]">
          {/* Section 1: Integration pipeline & schedule */}
          <PipelineStepperCard
            feeds={pipeline}
            isLoading={isPipelineLoading}
            orderNumber={index}
            isHistoryOpen={isHistoryOpen}
            onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
            isCollapsed={collapsedMap[DATA_REVIEW_SECTIONS[0].id]}
            onToggleCollapse={() => toggleSectionCollapse(DATA_REVIEW_SECTIONS[0].id)}
          />

          {/* Section 1 sub-panel: Integration status & history (hidden by default, smoothly expandable) */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isHistoryOpen
                ? 'max-h-[2000px] opacity-100 mb-5'
                : 'max-h-0 opacity-0 mb-0 pointer-events-none'
            }`}
            aria-hidden={!isHistoryOpen}
          >
            <HistoryTableCard
              history={history}
              isLoading={isHistoryLoading}
              isExpanded={isHistoryOpen}
              onToggleExpand={() => setIsHistoryOpen((prev) => !prev)}
            />
          </div>
        </div>
      ),
    },
    {
      id: DATA_REVIEW_SECTIONS[1].id,
      render: (index: number) => (
        <div key="data-review" id={DATA_REVIEW_SECTIONS[1].id} className="scroll-mt-[72px]">
          <DataReviewCard
            orderNumber={index}
            isCollapsed={collapsedMap[DATA_REVIEW_SECTIONS[1].id]}
            onToggleCollapse={() => toggleSectionCollapse(DATA_REVIEW_SECTIONS[1].id)}
          />
        </div>
      ),
    },
    {
      id: DATA_REVIEW_SECTIONS[2].id,
      render: (index: number) => (
        <div key="data-validation" id={DATA_REVIEW_SECTIONS[2].id} className="scroll-mt-[72px]">
          <DataValidationCard
            orderNumber={index}
            isCollapsed={collapsedMap[DATA_REVIEW_SECTIONS[2].id]}
            onToggleCollapse={() => toggleSectionCollapse(DATA_REVIEW_SECTIONS[2].id)}
          />
        </div>
      ),
    },
    {
      id: DATA_REVIEW_SECTIONS[3].id,
      render: (index: number) => (
        <div key="innovation" id={DATA_REVIEW_SECTIONS[3].id} className="scroll-mt-[72px]">
          <InnovationCard
            orderNumber={index}
            isCollapsed={collapsedMap[DATA_REVIEW_SECTIONS[3].id]}
            onToggleCollapse={() => toggleSectionCollapse(DATA_REVIEW_SECTIONS[3].id)}
          />
        </div>
      ),
    },
    {
      id: DATA_REVIEW_SECTIONS[4].id,
      render: (index: number) => (
        <div key="special-packs" id={DATA_REVIEW_SECTIONS[4].id} className="scroll-mt-[72px]">
          <SpecialPacksCard
            orderNumber={index}
            isCollapsed={collapsedMap[DATA_REVIEW_SECTIONS[4].id]}
            onToggleCollapse={() => toggleSectionCollapse(DATA_REVIEW_SECTIONS[4].id)}
          />
        </div>
      ),
    },
    {
      id: DATA_REVIEW_SECTIONS[5].id,
      render: (index: number) => (
        <div key="signoff" id={DATA_REVIEW_SECTIONS[5].id} className="scroll-mt-[72px]">
          <SignoffCard
            orderNumber={index}
            readiness={readiness}
            isLoading={isReadinessLoading}
            isCollapsed={collapsedMap[DATA_REVIEW_SECTIONS[5].id]}
            onToggleCollapse={() => toggleSectionCollapse(DATA_REVIEW_SECTIONS[5].id)}
          />
        </div>
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

