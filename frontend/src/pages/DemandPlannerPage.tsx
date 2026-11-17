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
import { LEVELS, LEVEL_MAP } from '../constants/hierarchy';
import { ProductLevelNum } from '../types';

export const DemandPlannerPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    productLevel,
    scope,
    customerView,
    measure,
    apg,
    setProductLevel,
    setCustomerView,
    setMeasure,
    setApg,
    setScope,
    drillDown,
    drillUp,
    resetHeaderOnly,
  } = useViewStore();

  const { appliedFilters, applyFilters, resetAll } = useFilterStore();
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
    queryFn:  () => metaService.getOptions(),
  });

  const hierarchyQuery = useQuery({
    queryKey: ['hierarchy'],
    queryFn:  () => metaService.getHierarchy(),
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

  // Drill down: go to clicked bar's nodeId at level+1
  const handleDrillDown = (barLabel: string) => {
    // Find node matching barLabel at current productLevel
    const matchNode = hierarchyNodes.find(
      n => n.name === barLabel && n.level === productLevel
    );
    const childLevel = Math.min(productLevel + 1, 5) as ProductLevelNum;
    if (matchNode) {
      drillDown(matchNode.id, childLevel);
      setDesegregated(true, matchNode.id);
      openDock();
    }
  };

  const handleDrillUp = () => {
    // Go up: productLevel-1, scope = parents of current scope nodes
    const parentLevel = Math.max(productLevel - 1, 1) as ProductLevelNum;
    const parentIds = scope
      .map(id => hierarchyNodes.find(n => n.id === id)?.parentId)
      .filter((id): id is string => !!id);
    drillUp(parentIds.length ? parentIds : [], parentLevel);
    setDesegregated(false, undefined);
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

  // Filter badge = scope nodes count + apg filters
  const activeFilterCount = scope.length + (apg.length > 0 ? 1 : 0);

  const { charts: cl } = labels;
  const levelLabel = LEVEL_MAP[productLevel]?.label || 'Brand';
  const stackedBarTitle = cl.forecastBy(levelLabel.toLowerCase());

  // Map numeric level to legacy 'brand'|'product' for chart components
  const legacyLevel = productLevel >= 4 ? 'product' : 'brand';

  const drillUpButton = productLevel > 1 ? (
    <button
      type="button"
      onClick={handleDrillUp}
      title={cl.drillUp}
      className="text-[10px] font-semibold text-primary-700 bg-primary-50 border border-primary-300 px-2 py-0.5 rounded-full hover:bg-primary-100 transition-colors"
    >
      ▲ {cl.drillUp}
    </button>
  ) : undefined;

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
      apg={apg}
      onProductLevelChange={setProductLevel}
      onCustomerViewChange={setCustomerView}
      onMeasureChange={setMeasure}
      onApgChange={setApg}
      onResetHeaderOnly={resetHeaderOnly}
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
    >
      {/* 1. KPI row */}
      <section aria-label="Key performance indicators">
        <KpiCardRow kpis={kpis} isLoading={isKpisLoading} isError={isKpisError} error={kpisError as Error} onRetry={refetchKpis} />
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
              <FullscreenChartFrame title={stackedBarTitle} onClose={closeFullscreen} headerAction={drillUpButton}>
                <StackedBarChart
                  data={chartData.stackedBar.data?.items}
                  level={legacyLevel}
                  parentBrand={scope[0]}
                  onDrillDown={handleDrillDown}
                  onDrillUp={handleDrillUp}
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
              <FullscreenChartFrame title={cl.productMix} onClose={closeFullscreen}>
                <TreemapChart
                  data={chartData.treemap.data?.data}
                  level={legacyLevel}
                  isLoading={chartData.treemap.isLoading}
                  isError={chartData.treemap.isError}
                  onRetry={chartData.treemap.refetch}
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

            <ChartCard title={stackedBarTitle} onToggleFullscreen={() => openFullscreen('chart-stacked')} headerAction={drillUpButton}>
              <StackedBarChart
                data={chartData.stackedBar.data?.items}
                level={legacyLevel}
                parentBrand={scope[0]}
                onDrillDown={handleDrillDown}
                onDrillUp={handleDrillUp}
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

            <ChartCard title={cl.productMix} onToggleFullscreen={() => openFullscreen('chart-treemap')}>
              <TreemapChart
                data={chartData.treemap.data?.data}
                level={legacyLevel}
                isLoading={chartData.treemap.isLoading}
                isError={chartData.treemap.isError}
                onRetry={chartData.treemap.refetch}
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
