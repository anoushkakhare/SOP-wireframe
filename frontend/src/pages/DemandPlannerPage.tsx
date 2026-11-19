import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/layout/AppShell';
import { SelectionKpiRow, KpiNumbersRow } from '../components/kpi/KpiCardRow';
import { ChartCard } from '../components/charts/ChartCard';
import { FullscreenChartFrame } from '../components/charts/FullscreenChartFrame';
import { ForecastLineChart } from '../components/charts/ForecastLineChart';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { DrillToolbar } from '../components/charts/DrillToolbar';
import { WaterfallChart } from '../components/charts/WaterfallChart';
import { TreemapChart } from '../components/charts/TreemapChart';
import { BottomDock } from '../components/table/BottomDock';

import { useAuthStore } from '../store/authStore';
import { useViewStore } from '../store/viewStore';
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
import { allowedLevels } from '../utils/allowedLevels';
import { setDataRange } from '../utils/dateRange';
import { LEVELS, LEVEL_MAP } from '../constants/hierarchy';
import { ProductLevelNum } from '../types';

export const DemandPlannerPage: React.FC = () => {
  const { user } = useAuthStore();

  React.useEffect(() => {
    localStorage.setItem('unilever_last_page', '/dashboard');
  }, []);
  const {
    productLevel,
    scope,
    customerView,
    measure,
    timeGrain,
    apg,
    setProductLevel,
    setCustomerView,
    setMeasure,
    setTimeGrain,
    setApg,
    setScope,
    drillDown,
    drillUp,
    drillHistory,
    resetHeaderOnly,
  } = useViewStore();

  const [barDrillOn, setBarDrillOn] = React.useState(false);
  const [treemapDrillOn, setTreemapDrillOn] = React.useState(false);

  const { appliedFilters, applyFilters, resetAll, syncWithGrain } = useFilterStore();
  const { activeScenario } = useScenarioStore();
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

  const { fullscreenChartId, openFullscreen, closeFullscreen } = useFullscreen();

  // Data fetching
  const metaQuery = useQuery({
    queryKey: ['meta-options'],
    queryFn: () => metaService.getOptions(),
  });

  React.useEffect(() => {
    if (metaQuery.data?.dataRange) {
      setDataRange(metaQuery.data.dataRange);
    }
  }, [metaQuery.data?.dataRange]);

  const hierarchyQuery = useQuery({
    queryKey: ['hierarchy'],
    queryFn: () => metaService.getHierarchy(),
  });

  const hierarchyNodes = hierarchyQuery.data || [];

  const { data: kpis, isLoading: isKpisLoading, isError: isKpisError, error: kpisError, refetch: refetchKpis } = useKpis();
  const chartData = useChartData();
  const { data: tableData, isLoading: isTableLoading } = useTableData();
  const { createScenario, commitScenario, deleteScenario } = useScenarios();

  // Allowed product levels given current scope
  const allowed = allowedLevels(scope, hierarchyNodes);
  // If current level is below min allowed, auto-snap
  React.useEffect(() => {
    if (allowed.length > 0 && !allowed.includes(productLevel)) {
      setProductLevel(allowed[0]);
    }
  }, [allowed, productLevel, setProductLevel]);

  // Drill down: go to clicked bar/tile's nodeId at level+1
  const handleDrillDown = (barNodeIdOrLabel: string) => {
    const matchById = hierarchyNodes.find(n => n.id === barNodeIdOrLabel);
    if (matchById) {
      drillDown(matchById.id);
      setDesegregated(true, matchById.id);
      return;
    }
    const matchNode = hierarchyNodes.find(
      n => n.name === barNodeIdOrLabel && n.level === productLevel
    ) || hierarchyNodes.find(n => n.name === barNodeIdOrLabel);

    if (matchNode) {
      drillDown(matchNode.id);
      setDesegregated(true, matchNode.id);
    }
  };

  const handleDrillUp = () => {
    drillUp(hierarchyNodes);
    setDesegregated(false, undefined);
  };

  const handleTimeGrainChange = (grain: any) => {
    setTimeGrain(grain);
    syncWithGrain(grain);
  };

  const handleResetHeader = () => {
    resetHeaderOnly();
    syncWithGrain('month');
  };

  // Scenario operations
  const handleSaveScenario = async (name: string) => {
    try { await createScenario(name); addToast(labels.toasts.saveSuccess, 'success'); }
    catch { addToast(labels.toasts.saveError, 'error'); }
  };

  const handleCommitScenario = async () => {
    if (activeScenario) {
      try { await commitScenario(activeScenario.id); addToast(labels.toasts.commitSuccess, 'success'); }
      catch { addToast(labels.toasts.commitError, 'error'); }
    }
  };

  const handleDeleteScenario = async () => {
    if (deleteScenarioTarget) {
      try { await deleteScenario(deleteScenarioTarget.id); addToast(labels.toasts.deleteSuccess, 'success'); }
      catch { addToast(labels.toasts.deleteError, 'error'); }
      finally { setDeleteScenarioTarget(null); }
    }
  };

  const handleConfirmDiscard = () => { discardEdits(); setDiscardConfirmModalOpen(false); };

  // Filter badge = scope nodes count + apg filters + non-default planning cycle / activity
  const isPlanningCycleActive = appliedFilters.planningCycle && appliedFilters.planningCycle !== 'Current cycle';
  const isActivityActive = appliedFilters.activity && appliedFilters.activity !== 'Demand driver';
  const activeFilterCount =
    scope.length +
    (apg.length > 0 ? 1 : 0) +
    (isPlanningCycleActive ? 1 : 0) +
    (isActivityActive ? 1 : 0);

  const { charts: cl } = labels;
  const levelLabel = LEVEL_MAP[productLevel]?.label || 'Brand';
  const stackedBarTitle = `Forecast by ${levelLabel} and APG`;

  // Map numeric level to legacy 'brand'|'product' for chart components
  const legacyLevel = productLevel >= 4 ? 'product' : 'brand';

  const drillToolbar = (
    <DrillToolbar
      level={productLevel}
      minLevel={allowed[0] ?? 1}
      maxLevel={5}
      drillOn={barDrillOn}
      onUp={handleDrillUp}
      onToggleDown={() => setBarDrillOn((v) => !v)}
      drillHistoryEmpty={drillHistory.length === 0}
    />
  );

  const treemapDrillToolbar = (
    <DrillToolbar
      level={productLevel}
      minLevel={allowed[0] ?? 1}
      maxLevel={5}
      drillOn={treemapDrillOn}
      onUp={handleDrillUp}
      onToggleDown={() => setTreemapDrillOn((v) => !v)}
      drillHistoryEmpty={drillHistory.length === 0}
    />
  );

  return (
    <AppShell
      roleTitle={user?.roleTitle || labels.header.avatarRole}
      userName={user?.name}
      metaOptions={metaQuery.data || null}
      hierarchyNodes={hierarchyNodes}
      productLevel={productLevel}
      allowedLevels={allowed}
      customerView={customerView}
      measure={measure}
      timeGrain={timeGrain}
      apg={apg}
      onProductLevelChange={setProductLevel}
      onCustomerViewChange={setCustomerView}
      onMeasureChange={setMeasure}
      onTimeGrainChange={handleTimeGrainChange}
      onApgChange={setApg}
      onResetHeaderOnly={handleResetHeader}
      isTableActive={isDockOpen}
      onToggleTable={toggleDock}
      activeFilterCount={activeFilterCount}
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
      selectionRow={<SelectionKpiRow hierarchyNodes={hierarchyNodes} />}
    >
      {/* 1. Numbers row */}
      <section aria-label="Key performance indicators">
        <KpiNumbersRow
          kpis={kpis}
          isLoading={isKpisLoading}
          isError={isKpisError}
          error={kpisError as Error}
          onRetry={refetchKpis}
        />
      </section>

      {/* 2. Charts */}
      <section aria-label="Forecast visualisations">
        {fullscreenChartId ? (
          <div className="w-full">
            {fullscreenChartId === 'chart-line' && (
              <FullscreenChartFrame title={cl.forecastTrend} onClose={closeFullscreen}>
                <ForecastLineChart
                  data={chartData.forecastLine.data?.points}
                  isLoading={chartData.forecastLine.isLoading}
                  isError={chartData.forecastLine.isError}
                  onRetry={chartData.forecastLine.refetch}
                />
              </FullscreenChartFrame>
            )}
            {fullscreenChartId === 'chart-stacked' && (
              <FullscreenChartFrame title={stackedBarTitle} onClose={closeFullscreen} headerAction={drillToolbar}>
                <StackedBarChart
                  data={chartData.stackedBar.data?.items}
                  drillOn={barDrillOn}
                  onToggleDrillOn={setBarDrillOn}
                  onDrillDown={handleDrillDown}
                  isLoading={chartData.stackedBar.isLoading}
                  isError={chartData.stackedBar.isError}
                  onRetry={chartData.stackedBar.refetch}
                />
              </FullscreenChartFrame>
            )}
            {fullscreenChartId === 'chart-waterfall' && (
              <FullscreenChartFrame title={cl.forecastBridge} onClose={closeFullscreen}>
                <WaterfallChart
                  data={chartData.waterfall.data?.steps}
                  isLoading={chartData.waterfall.isLoading}
                  isError={chartData.waterfall.isError}
                  onRetry={chartData.waterfall.refetch}
                />
              </FullscreenChartFrame>
            )}
            {fullscreenChartId === 'chart-treemap' && (
              <FullscreenChartFrame title={cl.productMix} onClose={closeFullscreen} headerAction={treemapDrillToolbar}>
                <TreemapChart
                  data={chartData.treemap.data?.data}
                  level={legacyLevel}
                  productLevelNum={productLevel}
                  isLoading={chartData.treemap.isLoading}
                  isError={chartData.treemap.isError}
                  onRetry={chartData.treemap.refetch}
                  drillOn={treemapDrillOn}
                  onDrillDown={handleDrillDown}
                />
              </FullscreenChartFrame>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title={cl.forecastTrend} onToggleFullscreen={() => openFullscreen('chart-line')}>
              <ForecastLineChart
                data={chartData.forecastLine.data?.points}
                isLoading={chartData.forecastLine.isLoading}
                isError={chartData.forecastLine.isError}
                onRetry={chartData.forecastLine.refetch}
              />
            </ChartCard>

            <ChartCard title={stackedBarTitle} onToggleFullscreen={() => openFullscreen('chart-stacked')} headerAction={drillToolbar}>
              <StackedBarChart
                data={chartData.stackedBar.data?.items}
                drillOn={barDrillOn}
                onToggleDrillOn={setBarDrillOn}
                onDrillDown={handleDrillDown}
                isLoading={chartData.stackedBar.isLoading}
                isError={chartData.stackedBar.isError}
                onRetry={chartData.stackedBar.refetch}
              />
            </ChartCard>

            <ChartCard title={cl.forecastBridge} onToggleFullscreen={() => openFullscreen('chart-waterfall')}>
              <WaterfallChart
                data={chartData.waterfall.data?.steps}
                isLoading={chartData.waterfall.isLoading}
                isError={chartData.waterfall.isError}
                onRetry={chartData.waterfall.refetch}
              />
            </ChartCard>

            <ChartCard
              title={cl.productMix}
              onToggleFullscreen={() => openFullscreen('chart-treemap')}
              headerAction={treemapDrillToolbar}
            >
              <TreemapChart
                data={chartData.treemap.data?.data}
                level={legacyLevel}
                productLevelNum={productLevel}
                isLoading={chartData.treemap.isLoading}
                isError={chartData.treemap.isError}
                onRetry={chartData.treemap.refetch}
                drillOn={treemapDrillOn}
                onDrillDown={handleDrillDown}
              />
            </ChartCard>
          </div>
        )}
      </section>

      {/* 3. Bottom table dock */}
      <BottomDock tableData={tableData} level={legacyLevel} productLevelNum={productLevel} isLoading={isTableLoading} />
    </AppShell>
  );
};
