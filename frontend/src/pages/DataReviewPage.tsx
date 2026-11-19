import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { PipelineStepperCard } from '../components/data-review/PipelineStepperCard';
import { HistoryTableCard } from '../components/data-review/HistoryTableCard';
import { DataReviewCard } from '../components/data-review/DataReviewCard';
import { DataValidationCard } from '../components/data-review/DataValidationCard';
import { InnovationCard } from '../components/data-review/InnovationCard';
import { SpecialPacksCard } from '../components/data-review/SpecialPacksCard';
import { SignoffCard } from '../components/data-review/SignoffCard';
import { SECTIONS, useDataReviewNavStore } from './dataReview/sections';

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
    pipeline: false,
    review: false,
    validation: false,
    innovation: false,
    packs: false,
    signoff: false,
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

  // Opening with a hash scrolls to that section and expands it if collapsed
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      setCollapsedMap((prev) => ({ ...prev, [hash]: false }));
      useDataReviewNavStore.getState().setActiveSectionId(hash);
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // IntersectionObserver scroll-spy to set active section for both navs and update URL hash
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
          );
          const activeId = visibleEntries[0].target.id;
          if (SECTIONS.some((s) => s.id === activeId)) {
            useDataReviewNavStore.getState().setActiveSectionId(activeId);
            window.history.replaceState(null, '', `#${activeId}`);
          }
        }
      },
      {
        rootMargin: '-80px 0px -40% 0px',
        threshold: [0, 0.2, 0.5],
      }
    );

    SECTIONS.forEach((section) => {
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

  const renderSection = (id: string, index: number) => {
    switch (id) {
      case 'pipeline':
        return (
          <div key="pipeline" id="pipeline" className="scroll-mt-[72px]">
            {/* Section 1: Integration pipeline & schedule */}
            <PipelineStepperCard
              feeds={pipeline}
              isLoading={isPipelineLoading}
              orderNumber={index}
              isHistoryOpen={isHistoryOpen}
              onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
              isCollapsed={collapsedMap['pipeline']}
              onToggleCollapse={() => toggleSectionCollapse('pipeline')}
            />

            {/* Section 1 sub-panel: Integration status & history */}
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
        );
      case 'review':
        return (
          <div key="review" id="review" className="scroll-mt-[72px]">
            <DataReviewCard
              orderNumber={index}
              isCollapsed={collapsedMap['review']}
              onToggleCollapse={() => toggleSectionCollapse('review')}
            />
          </div>
        );
      case 'validation':
        return (
          <div key="validation" id="validation" className="scroll-mt-[72px]">
            <DataValidationCard
              orderNumber={index}
              isCollapsed={collapsedMap['validation']}
              onToggleCollapse={() => toggleSectionCollapse('validation')}
            />
          </div>
        );
      case 'innovation':
        return (
          <div key="innovation" id="innovation" className="scroll-mt-[72px]">
            <InnovationCard
              orderNumber={index}
              isCollapsed={collapsedMap['innovation']}
              onToggleCollapse={() => toggleSectionCollapse('innovation')}
            />
          </div>
        );
      case 'packs':
        return (
          <div key="packs" id="packs" className="scroll-mt-[72px]">
            <SpecialPacksCard
              orderNumber={index}
              isCollapsed={collapsedMap['packs']}
              onToggleCollapse={() => toggleSectionCollapse('packs')}
            />
          </div>
        );
      case 'signoff':
        return (
          <div key="signoff" id="signoff" className="scroll-mt-[72px]">
            <SignoffCard
              orderNumber={index}
              readiness={readiness}
              isLoading={isReadinessLoading}
              isCollapsed={collapsedMap['signoff']}
              onToggleCollapse={() => toggleSectionCollapse('signoff')}
            />
          </div>
        );
      default:
        return null;
    }
  };

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

        {/* Dynamically rendered 6 sections */}
        {SECTIONS.map((section) => renderSection(section.id, section.n))}
      </div>
    </AppShell>
  );
};
