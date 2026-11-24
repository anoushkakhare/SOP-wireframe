import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/layout/AppShell';
import { SelectionKpiRow, KpiNumbersRow } from '../components/kpi/KpiCardRow';
import { ChartCard } from '../components/charts/ChartCard';
import { FullscreenChartFrame } from '../components/charts/FullscreenChartFrame';
import { ForecastLineChart } from '../components/charts/ForecastLineChart';
import { DrillToolbar } from '../components/charts/DrillToolbar';
import { TreemapChart } from '../components/charts/TreemapChart';
import { PlanningTable } from '../components/table/PlanningTable';
import { ForecastTrendTable } from '../components/table/ForecastTrendTable';
import { ModeHint } from '../components/table/ModeHint';
import { TableFloatingButtons } from '../components/table/TableFloatingButtons';

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
import { LEVEL_MAP } from '../constants/hierarchy';
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
    compare,
    setProductLevel,
    setCustomerView,
    setMeasure,
    setTimeGrain,
    setApg,
    drillDown,
    drillUp,
    drillHistory,
    resetHeaderOnly,
  } = useViewStore();

  const [treemapDrillOn, setTreemapDrillOn] = React.useState(false);

  const { appliedFilters, applyFilters, resetAll, syncWithGrain } = useFilterStore();
  const { activeScenario } = useScenarioStore();
  const {
    isDockOpen,
    toggleDock,
    mode,
    draftEdits,
    isDesegregated,
    setMode,
    setCellEdit,
    revertCellEdit,
    saveEdits,
    discardEdits,
    hasUnsavedEdits,
    setDesegregated,
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

  // Map numeric level to legacy 'brand'|'product' for chart components
  const legacyLevel = productLevel >= 4 ? 'product' : 'brand';

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

  // Table editing controls logic
  const canEdit = !compare.on && (timeGrain === 'month' || timeGrain === 'week');
  const disabledReason = compare.on
    ? 'Table editing disabled in compare mode'
    : 'Switch to Month or Week to edit';
  const hasDraft = Object.keys(draftEdits).length > 0;

  React.useEffect(() => {
    if (mode === 'edit' && !canEdit) {
      setMode('view');
    }
  }, [mode, canEdit, setMode]);

  const handleToggleEdit = () => {
    if (!canEdit) return;
    if (mode === 'edit') {
      if (hasDraft || hasUnsavedEdits()) {
        setDiscardConfirmModalOpen(true);
      } else {
        setMode('view');
      }
    } else {
      setMode('edit');
    }
  };

  const handleToggleDelta = () => {
    setMode(mode === 'delta' ? 'view' : 'delta');
  };

  const handleCloseOrSave = () => {
    if (mode === 'edit') {
      saveEdits();
      addToast(labels.toasts.editSaved, 'success');
    }
  };

  return (
    <AppShell
      roleTitle={user?.roleTitle || labels.header.avatarRole}
      userName={user?.name || 'Nishtha Agarwal'}
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
      isTableActive={false}
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
      <div className="summary-dashboard flex flex-col w-full">
        {/* 1. Numbers row */}
        <section aria-label="Key performance indicators" className="mb-4">
          <KpiNumbersRow
            kpis={kpis}
            isLoading={isKpisLoading}
            isError={isKpisError}
            error={kpisError as Error}
            onRetry={refetchKpis}
          />
        </section>

        {/* 2. Charts */}
        <section aria-label="Forecast visualisations" className="mb-4">
          {fullscreenChartId ? (
            <div className="w-full">
              {fullscreenChartId === 'chart-line' && (
                <FullscreenChartFrame title={cl.forecastTrend} onClose={closeFullscreen}>
                  <div className="expanded-forecast-trend-view w-full h-full min-h-0">
                    <div className="w-full h-full min-h-0 relative">
                      <ForecastLineChart
                        data={chartData.forecastLine.data?.points}
                        isLoading={chartData.forecastLine.isLoading}
                        isError={chartData.forecastLine.isError}
                        onRetry={chartData.forecastLine.refetch}
                      />
                    </div>
                    <div className="w-full h-full min-h-0 overflow-auto">
                      <ForecastTrendTable
                        points={chartData.forecastLine.data?.points}
                        isLoading={chartData.forecastLine.isLoading}
                      />
                    </div>
                  </div>
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
            <div
              className="summary-dashboard-graphs grid w-full"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                gap: '16px',
              }}
            >
              <ChartCard
                title={cl.forecastTrend}
                onToggleFullscreen={() => openFullscreen('chart-line')}
                className="!h-[340px] !min-h-0 !overflow-visible"
              >
                <ForecastLineChart
                  data={chartData.forecastLine.data?.points}
                  isLoading={chartData.forecastLine.isLoading}
                  isError={chartData.forecastLine.isError}
                  onRetry={chartData.forecastLine.refetch}
                />
              </ChartCard>

              <ChartCard
                title={cl.productMix}
                onToggleFullscreen={() => openFullscreen('chart-treemap')}
                headerAction={treemapDrillToolbar}
                className="!h-[340px] !min-h-0 !overflow-visible"
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

        {/* 3. Static Forecast Table */}
        <section aria-label="Forecast planning table" className="w-full bg-surface border border-border rounded-card shadow-card flex flex-col mb-4">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-primary-50 border-b border-border rounded-t-card">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-semibold text-text-primary tracking-tight">
                Forecast Planning Table
              </h3>
              <ModeHint mode={mode} isDesegregated={isDesegregated} />
            </div>
            <div className="shrink-0 flex items-center gap-3">
              {hasDraft && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-sm animate-in fade-in">
                  Previewing unsaved edits
                </span>
              )}
              <TableFloatingButtons
                mode={mode}
                onToggleEdit={handleToggleEdit}
                onToggleDelta={handleToggleDelta}
                onCloseOrSave={handleCloseOrSave}
                canEdit={canEdit}
                disabledTooltip={disabledReason}
                showClose={false}
              />
            </div>
          </div>

          {/* Table Body Container */}
          <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto">
            <PlanningTable
              rows={tableData?.rows || []}
              period={tableData?.period || []}
              currentMonthIndex={tableData?.currentMonthIndex || 5}
              level={legacyLevel}
              productLevelNum={productLevel}
              mode={mode}
              draftEdits={draftEdits}
              onCellEdit={(row, defType, month, deltaBase) => {
                const fu = row.forecastUnit || row.product || row.forecastGroup || row.brand || row.id;
                const apg = row.apg || 'All';
                setCellEdit(
                  {
                    forecastUnit: fu,
                    apg,
                    period: month,
                    defType,
                    rowMeta: {
                      fuId: row.id,
                      forecastUnit: fu,
                      forecastGroup: row.forecastGroup,
                      brand: row.brand,
                      sop: row.sop,
                      category: row.category,
                      unitsPerCase: row.unitsPerCase || 12,
                      price: row.price || 100,
                    },
                  },
                  deltaBase
                );
              }}
              onCellRevert={(row, defType, month) => {
                const fu = row.forecastUnit || row.product || row.forecastGroup || row.brand || row.id;
                const apg = row.apg || 'All';
                revertCellEdit({ forecastUnit: fu, apg, period: month, defType });
              }}
              isLoading={isTableLoading}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
};

