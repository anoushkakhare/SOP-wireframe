import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/layout/AppShell';
import { KpiCardRow } from '../components/kpi/KpiCardRow';
import { ChartCard } from '../components/charts/ChartCard';
import { FullscreenChartFrame } from '../components/charts/FullscreenChartFrame';
import { ForecastLineChart } from '../components/charts/ForecastLineChart';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { WaterfallChart } from '../components/charts/WaterfallChart';
import { TreemapChart } from '../components/charts/TreemapChart';
import { BottomDock } from '../components/table/BottomDock';

import { useAuthStore } from '../store/authStore';
import { useHeaderStore } from '../store/headerStore';
import { useFilterStore } from '../store/filterStore';
import { useScenarioStore } from '../store/scenarioStore';
import { useTableStore } from '../store/tableStore';
import { useUiStore } from '../store/uiStore';

import { useKpis } from '../hooks/useKpis';
import { useChartData } from '../hooks/useChartData';
import { useTableData } from '../hooks/useTableData';
import { useScenarios } from '../hooks/useScenarios';
import { useFullscreen } from '../hooks/useFullscreen';
import { metaService } from '../services/metaService';
import { labels } from '../constants/labels';

export const DemandPlannerPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    productLevel,
    parentBrand,
    customerLevel,
    uom,
    setProductLevel,
    setCustomerLevel,
    setUom,
    drillDown,
    drillUp,
  } = useHeaderStore();

  const { appliedFilters, applyFilters, resetAll } = useFilterStore();
  const { activeScenario, setActiveScenario } = useScenarioStore();
  const {
    isDockOpen,
    toggleDock,
    openDock,
    setDesegregated,
    discardEdits,
  } = useTableStore();

  const {
    isFilterDrawerOpen,
    setFilterDrawerOpen,
    isScenarioDrawerOpen,
    setScenarioDrawerOpen,
    isSaveScenarioModalOpen,
    setSaveScenarioModalOpen,
    isCommitModalOpen,
    setCommitModalOpen,
    isDiscardConfirmModalOpen,
    setDiscardConfirmModalOpen,
    deleteScenarioTarget,
    setDeleteScenarioTarget,
    addToast,
  } = useUiStore();

  const { fullscreenChartId, openFullscreen, closeFullscreen, isFullscreen } = useFullscreen();

  // Data fetching
  const metaQuery = useQuery({
    queryKey: ['meta-options'],
    queryFn:  () => metaService.getOptions(),
  });

  const { data: kpis, isLoading: isKpisLoading } = useKpis();
  const chartData = useChartData();
  const { data: tableData, isLoading: isTableLoading } = useTableData();
  const { createScenario, commitScenario, deleteScenario } = useScenarios();

  // Drill handlers
  const handleDrillDown = (brand: string) => {
    drillDown(brand);
    setDesegregated(true, brand);
    openDock();
  };

  const handleDrillUp = () => {
    drillUp();
    setDesegregated(false, undefined);
  };

  // Scenario operations
  const handleSaveScenario = async (name: string) => {
    try {
      await createScenario(name);
      addToast(labels.toasts.saveSuccess, 'success');
    } catch {
      addToast(labels.toasts.saveError, 'error');
    }
  };

  const handleCommitScenario = async () => {
    if (activeScenario) {
      try {
        await commitScenario(activeScenario.id);
        addToast(labels.toasts.commitSuccess, 'success');
      } catch {
        addToast(labels.toasts.commitError, 'error');
      }
    }
  };

  const handleDeleteScenario = async () => {
    if (deleteScenarioTarget) {
      try {
        await deleteScenario(deleteScenarioTarget.id);
        addToast(labels.toasts.deleteSuccess, 'success');
      } catch {
        addToast(labels.toasts.deleteError, 'error');
      } finally {
        setDeleteScenarioTarget(null);
      }
    }
  };
  const handleConfirmDiscard = () => {
    discardEdits();
    setDiscardConfirmModalOpen(false);
  };

  const hasActiveFilters =
    appliedFilters.categories.length > 0 ||
    appliedFilters.brands.length > 0 ||
    appliedFilters.products.length > 0 ||
    appliedFilters.customerGroups.length > 0;

  // Dynamic chart titles (all from labels.ts)
  const { charts: cl } = labels;
  const stackedBarTitle = cl.forecastBy(
    productLevel === 'brand' ? 'brand' : 'product'
  );

  const drillUpButton = (
    <button
      type="button"
      onClick={handleDrillUp}
      title={cl.drillUp}
      className="text-[10px] font-semibold text-primary-700 bg-primary-50 border border-primary-300 px-2 py-0.5 rounded-full hover:bg-primary-100 transition-colors"
    >
      ▲ {cl.drillUp}
    </button>
  );

  return (
    <AppShell
      roleTitle={user?.roleTitle || labels.header.avatarRole}
      userName={user?.name}
      metaOptions={metaQuery.data || null}
      productLevel={productLevel}
      customerLevel={customerLevel}
      uom={uom}
      onProductLevelChange={setProductLevel}
      onCustomerLevelChange={setCustomerLevel}
      onUomChange={setUom}
      isTableActive={isDockOpen}
      onToggleTable={toggleDock}
      hasActiveFilters={hasActiveFilters}
      isFilterOpen={isFilterDrawerOpen}
      onCloseFilter={() => setFilterDrawerOpen(!isFilterDrawerOpen)}
      onApplyFilter={() => { applyFilters(); }}
      onResetFilter={() => { resetAll(); }}
      isScenarioOpen={isScenarioDrawerOpen}
      onCloseScenario={() => setScenarioDrawerOpen(!isScenarioDrawerOpen)}
      isSaveModalOpen={isSaveScenarioModalOpen}
      onCloseSaveModal={() => setSaveScenarioModalOpen(!isSaveScenarioModalOpen)}
      onSaveScenario={handleSaveScenario}
      isCommitModalOpen={isCommitModalOpen}
      onCloseCommitModal={() => setCommitModalOpen(!isCommitModalOpen)}
      onConfirmCommit={handleCommitScenario}
      deleteTarget={deleteScenarioTarget}
      onCloseDeleteModal={() => setDeleteScenarioTarget(null)}
      onConfirmDelete={handleDeleteScenario}
      isDiscardModalOpen={isDiscardConfirmModalOpen}
      onCloseDiscardModal={() => setDiscardConfirmModalOpen(false)}
      onConfirmDiscard={handleConfirmDiscard}
    >
      {/* 1. KPI row */}
      <section aria-label="Key performance indicators">
        <KpiCardRow kpis={kpis} isLoading={isKpisLoading} />
      </section>

      {/* 2. Charts */}
      <section aria-label="Forecast visualisations">
        {fullscreenChartId ? (
          <div className="w-full">
            {fullscreenChartId === 'chart-line' && (
              <FullscreenChartFrame title={cl.forecastTrend} onClose={closeFullscreen}>
                <ForecastLineChart data={chartData.forecastLine.data?.points} isLoading={chartData.forecastLine.isLoading} />
              </FullscreenChartFrame>
            )}
            {fullscreenChartId === 'chart-stacked' && (
              <FullscreenChartFrame
                title={stackedBarTitle}
                onClose={closeFullscreen}
                headerAction={productLevel === 'product' ? drillUpButton : undefined}
              >
                <StackedBarChart
                  data={chartData.stackedBar.data?.items}
                  level={productLevel}
                  parentBrand={parentBrand}
                  onDrillDown={handleDrillDown}
                  onDrillUp={handleDrillUp}
                  isLoading={chartData.stackedBar.isLoading}
                />
              </FullscreenChartFrame>
            )}
            {fullscreenChartId === 'chart-waterfall' && (
              <FullscreenChartFrame title={cl.forecastBridge} onClose={closeFullscreen}>
                <WaterfallChart data={chartData.waterfall.data?.steps} isLoading={chartData.waterfall.isLoading} />
              </FullscreenChartFrame>
            )}
            {fullscreenChartId === 'chart-treemap' && (
              <FullscreenChartFrame title={cl.productMix} onClose={closeFullscreen}>
                <TreemapChart data={chartData.treemap.data?.data} level={productLevel} isLoading={chartData.treemap.isLoading} />
              </FullscreenChartFrame>
            )}
          </div>
        ) : (
          /* Standard 2×2 grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Forecast trend */}
            <ChartCard title={cl.forecastTrend} onToggleFullscreen={() => openFullscreen('chart-line')}>
              <ForecastLineChart data={chartData.forecastLine.data?.points} isLoading={chartData.forecastLine.isLoading} />
            </ChartCard>

            {/* Forecast by brand/product × CG */}
            <ChartCard
              title={stackedBarTitle}
              onToggleFullscreen={() => openFullscreen('chart-stacked')}
              headerAction={productLevel === 'product' ? drillUpButton : undefined}
            >
              <StackedBarChart
                data={chartData.stackedBar.data?.items}
                level={productLevel}
                parentBrand={parentBrand}
                onDrillDown={handleDrillDown}
                onDrillUp={handleDrillUp}
                isLoading={chartData.stackedBar.isLoading}
              />
            </ChartCard>

            {/* Forecast bridge (waterfall) */}
            <ChartCard title={cl.forecastBridge} onToggleFullscreen={() => openFullscreen('chart-waterfall')}>
              <WaterfallChart data={chartData.waterfall.data?.steps} isLoading={chartData.waterfall.isLoading} />
            </ChartCard>

            {/* Product mix (treemap) */}
            <ChartCard title={cl.productMix} onToggleFullscreen={() => openFullscreen('chart-treemap')}>
              <TreemapChart data={chartData.treemap.data?.data} level={productLevel} isLoading={chartData.treemap.isLoading} />
            </ChartCard>
          </div>
        )}
      </section>

      {/* 3. Bottom table dock */}
      <BottomDock tableData={tableData} level={productLevel} isLoading={isTableLoading} />
    </AppShell>
  );
};
