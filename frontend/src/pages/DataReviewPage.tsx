import React, { useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { PipelineStepperCard } from '../components/data-review/PipelineStepperCard';
import { HistoryTableCard } from '../components/data-review/HistoryTableCard';
import { PlaceholderCard } from '../components/data-review/PlaceholderCard';
import { SignoffCard } from '../components/data-review/SignoffCard';

import {
  useDataReviewPipeline,
  useDataReviewHistory,
  useDataReviewReadiness,
  useDataReviewMutations,
} from '../hooks/useDataReview';
import { useAuthStore } from '../store/authStore';

import {
  Database,
  ShieldCheck,
  Sparkles,
  PackageCheck,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Tag,
  Layers,
} from 'lucide-react';

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
  const { updateReadiness } = useDataReviewMutations();

  const isInnovationChecked =
    readiness?.checklist.find(c => c.id === 'innovation_reviewed')?.checked ?? false;
  const isComboPacksChecked =
    readiness?.checklist.find(c => c.id === 'combo_packs_reviewed')?.checked ?? false;

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

        {/* 3. Titled Placeholder Card: Data review */}
        <PlaceholderCard
          orderNumber={3}
          title="Data review"
          subtitle="Master data completeness, SKU volume profiling, and category coverage"
          icon={Database}
          badge="14,250 SKUs Profiled"
          badgeVariant="blue"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Active SKUs
              </span>
              <span className="text-xl font-bold text-gray-900">14,250</span>
              <span className="text-[11px] text-emerald-600 block mt-1 font-medium">
                100% mapped to brand hierarchy
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Customer Accounts
              </span>
              <span className="text-xl font-bold text-gray-900">3,820</span>
              <span className="text-[11px] text-emerald-600 block mt-1 font-medium">
                Mapped to APG & Channel
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Price Records
              </span>
              <span className="text-xl font-bold text-gray-900">89,400</span>
              <span className="text-[11px] text-emerald-600 block mt-1 font-medium">
                Current cycle prices loaded
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                History Range
              </span>
              <span className="text-xl font-bold text-gray-900">36 Months</span>
              <span className="text-[11px] text-gray-500 block mt-1">
                From Nov 2023 to Oct 2026
              </span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Master Dimension Profiling:</span> All product units,
              customer groupings, price tiers, and transactional actuals have passed dimension
              conformance. Deep-dive profiling tools and column frequency distributions will be
              rendered in this panel.
            </div>
          </div>
        </PlaceholderCard>

        {/* 4. Titled Placeholder Card: Data validation */}
        <PlaceholderCard
          orderNumber={4}
          title="Data validation"
          subtitle="Automated integrity verification: 0 mapping gaps, 0 null critical values"
          icon={ShieldCheck}
          badge="Checks Passed (100%)"
          badgeVariant="green"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="border border-emerald-200 bg-emerald-50/30 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  0 Mapping Gaps Detected
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  All active SKUs and customer accounts map without gaps to Global Brand, Local
                  Product Unit, APG, and Customer Group. Zero orphaned hierarchy nodes.
                </p>
                <div className="mt-2 text-[11px] font-medium text-emerald-700">
                  ✓ Verified against Master Data Repository
                </div>
              </div>
            </div>

            <div className="border border-emerald-200 bg-emerald-50/30 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  0 Null Critical Values
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Validated critical attributes across all 5 feeds: SKU Code, Customer Code, UOM,
                  Units Per Case, Base Unit Price, and Historical Volumes.
                </p>
                <div className="mt-2 text-[11px] font-medium text-emerald-700">
                  ✓ Verified across 600,000+ data points
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Rule engine:</span> Custom validation rules
            and statistical anomaly thresholds are active for price spikes and volume outliers.
          </div>
        </PlaceholderCard>

        {/* 5. Titled Placeholder Card: Innovation */}
        <PlaceholderCard
          orderNumber={5}
          title="Innovation"
          subtitle="New product introductions (NPDs), launch timing, cannibalisation & phase-ins"
          icon={Sparkles}
          badge={isInnovationChecked ? 'Reviewed' : 'Review Required'}
          badgeVariant={isInnovationChecked ? 'green' : 'amber'}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  New Launches (NPD)
                </span>
                <span className="text-lg font-bold text-gray-900 mt-0.5 block">
                  4 Active Launches
                </span>
                <span className="text-[11px] text-gray-600">Dove Men Care Fresh, Lux Botanic</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Cannibalisation
                </span>
                <span className="text-lg font-bold text-gray-900 mt-0.5 block">
                  -12% Existing SKUs
                </span>
                <span className="text-[11px] text-gray-600">Phase-out overlap mapped</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Launch Readiness
                </span>
                <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                  BOM Complete
                </span>
                <span className="text-[11px] text-gray-600">Production schedule locked</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-200 rounded-lg">
              <div className="text-xs text-purple-900">
                <span className="font-bold">Manual Review Status:</span>{' '}
                {isInnovationChecked
                  ? 'Innovation assumptions marked as reviewed for this cycle.'
                  : 'Requires planner verification before readiness sign-off.'}
              </div>
              <button
                type="button"
                onClick={() =>
                  updateReadiness({ innovationReviewed: !isInnovationChecked })
                }
                className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                  isInnovationChecked
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                    : 'bg-primary-700 text-white border-primary-800 hover:bg-primary-800'
                }`}
              >
                {isInnovationChecked ? '✓ Marked Reviewed' : 'Mark Innovation as Reviewed'}
              </button>
            </div>
          </div>
        </PlaceholderCard>

        {/* 6. Titled Placeholder Card: Special packs */}
        <PlaceholderCard
          orderNumber={6}
          title="Special packs"
          subtitle="Promotional bundles, value combo packs, seasonal multipacks & BOM explosion"
          icon={PackageCheck}
          badge={isComboPacksChecked ? 'Reviewed' : 'Review Required'}
          badgeVariant={isComboPacksChecked ? 'green' : 'amber'}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Combo Pack SKUs
                </span>
                <span className="text-lg font-bold text-gray-900 mt-0.5 block">
                  12 Active Packs
                </span>
                <span className="text-[11px] text-gray-600">Twin packs & holiday bundles</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  BOM Explosion
                </span>
                <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                  100% Validated
                </span>
                <span className="text-[11px] text-gray-600">Component SKUs tied to master</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Promotional Uplift
                </span>
                <span className="text-lg font-bold text-gray-900 mt-0.5 block">
                  +18.5% Forecast
                </span>
                <span className="text-[11px] text-gray-600">Aligned with trade spend</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
              <div className="text-xs text-amber-900">
                <span className="font-bold">Manual Review Status:</span>{' '}
                {isComboPacksChecked
                  ? 'Special packs and combo bundles marked as reviewed for this cycle.'
                  : 'Requires planner verification before readiness sign-off.'}
              </div>
              <button
                type="button"
                onClick={() =>
                  updateReadiness({ comboPacksReviewed: !isComboPacksChecked })
                }
                className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                  isComboPacksChecked
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                    : 'bg-primary-700 text-white border-primary-800 hover:bg-primary-800'
                }`}
              >
                {isComboPacksChecked ? '✓ Marked Reviewed' : 'Mark Combo Packs as Reviewed'}
              </button>
            </div>
          </div>
        </PlaceholderCard>

        {/* 7. Sign-off */}
        <SignoffCard readiness={readiness} isLoading={isReadinessLoading} />
      </div>
    </AppShell>
  );
};

