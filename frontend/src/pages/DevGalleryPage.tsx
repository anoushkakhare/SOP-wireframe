import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RoleBadge } from '../components/header/RoleBadge';
import { LabeledSelect } from '../components/header/LabeledSelect';
import { HeaderActions } from '../components/header/HeaderActions';
import { HeaderIconButton } from '../components/header/HeaderIconButton';
import { KpiCard } from '../components/kpi/KpiCard';
import { KpiCardRow } from '../components/kpi/KpiCardRow';
import { ChartCard } from '../components/charts/ChartCard';
import { ForecastLineChart } from '../components/charts/ForecastLineChart';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { WaterfallChart } from '../components/charts/WaterfallChart';
import { TreemapChart } from '../components/charts/TreemapChart';
import { StatusBadge } from '../components/scenarios/StatusBadge';
import { ScenarioCard } from '../components/scenarios/ScenarioCard';
import { TimeRangeSlider } from '../components/filters/TimeRangeSlider';
import { FilterSelect } from '../components/filters/FilterSelect';
import { FilterActions } from '../components/filters/FilterActions';
import { ModeHint } from '../components/table/ModeHint';
import { TableFloatingButtons } from '../components/table/TableFloatingButtons';
import { DeltaCell } from '../components/table/DeltaCell';
import { EditableCell } from '../components/table/EditableCell';
import { PlanningTable } from '../components/table/PlanningTable';
import { Save, ChevronLeft } from 'lucide-react';
import { KpiItem, PlanningTableRow, Scenario, StackedBarItem } from '../types';
import { labels } from '../constants/labels';

export const DevGalleryPage: React.FC = () => {
  const [selectVal, setSelectVal] = useState('brand');
  const [timeRange, setTimeRange] = useState<[number, number]>([12, 23]);
  const [startDate, setStartDate] = useState('Jan 2026');
  const [endDate, setEndDate] = useState('Dec 2026');
  const [selectedBrands, setSelectedBrands] = useState(['Dove', 'Surf Excel']);
  const [tableMode, setTableMode] = useState<'view' | 'edit' | 'delta'>('view');
  const [editableVal, setEditableVal] = useState(28400);

  const sampleKpis: KpiItem[] = [
    { key: 'total_forecast', label: labels.kpi.totalForecast, value: 1820000, format: 'number', isNeutral: true },
    { key: 'baseline', label: 'Baseline', value: 1600000, format: 'number', isNeutral: true },
    { key: 'actuals', label: 'Actuals', value: 720000, format: 'number', isNeutral: true },
    { key: 'forecast_adj', label: labels.kpi.forecastAdj, value: 42000, format: 'number', growthType: 'positive' },
    { key: 'opportunity', label: labels.kpi.opportunity, value: 128000, format: 'number', growthType: 'positive' },
    { key: 'risk', label: labels.kpi.risk, value: -96000, format: 'number', growthType: 'negative' },
    { key: 'growth_prev', label: 'Growth vs previous month', value: 3.4, format: 'percent', growthType: 'positive', roValue: 4.1 },
    { key: 'fy_growth', label: labels.kpi.fyGrowth, value: 2.8, format: 'percent', growthType: 'positive', roValue: 3.2 },
    { key: 'ytd_growth', label: labels.kpi.ytdGrowth, value: 5.8, format: 'percent', growthType: 'positive' },
    { key: 'ytg_growth', label: labels.kpi.ytgGrowth, value: -1.9, format: 'percent', growthType: 'negative', roValue: -1.2 },
  ];

  const sampleLinePoints = [
    { time: 'Jan 2026', forecast: 138000, worstCase: 120000, bestCase: 155000 },
    { time: 'Feb 2026', forecast: 142000, worstCase: 125000, bestCase: 160000 },
    { time: 'Mar 2026', forecast: 149000, worstCase: 131000, bestCase: 168000 },
    { time: 'Apr 2026', forecast: 145000, worstCase: 128000, bestCase: 162000 },
  ];

  const sampleStackedItems: StackedBarItem[] = [
    {
      category: 'Dove',
      hasDrillDown: true,
      segments: { 'Modern trade': 240000, 'E-commerce': 98000, 'Quick commerce': 42000 },
      total: 380000,
    },
    {
      category: 'Surf Excel',
      hasDrillDown: true,
      segments: { 'Modern trade': 310000, 'E-commerce': 72000 },
      total: 382000,
    },
  ];

  const sampleWaterfallSteps = [
    { name: labels.charts.waterfall.baseline, value: 1600000, type: 'total' as const },
    { name: labels.charts.waterfall.demandDrivers, value: 178000, type: 'increase' as const },
    { name: labels.charts.waterfall.manualAdjustment, value: 42000, type: 'increase' as const },
    { name: labels.charts.waterfall.finalForecast, value: 1820000, type: 'total' as const },
  ];

  const sampleTreemapData = [
    {
      name: 'Dove',
      brand: 'Dove',
      color: '#0F0E9A',
      children: [
        { name: 'Dove Nourishing Shampoo', value: 210000, color: '#0F0E9A' },
        { name: 'Dove Intensive Repair Conditioner', value: 170000, color: '#2B2AB0' },
      ],
    },
    {
      name: 'Surf Excel',
      brand: 'Surf Excel',
      color: '#2B2AB0',
      children: [{ name: 'Surf Excel Matic Liquid', value: 227000, color: '#2B2AB0' }],
    },
  ];

  const sampleScenario: Scenario = {
    id: 'scen_test',
    name: 'Festive Season Upside',
    status: 'saved',
    lastModified: new Date(Date.now() - 120000).toISOString(),
    userId: 'usr_1',
    userName: 'Priya Sharma',
  };

  const sampleRows: PlanningTableRow[] = [
    {
      id: 'row_1',
      category: 'Home Care',
      brand: 'Surf Excel',
      customerGroup: 'Modern trade',
      customer: 'Reliance Retail',
      pastActuals: { 'Jan 2026': 24000, 'Feb 2026': 25200 },
      definitions: {
        opportunity: { 'Jun 2026': 3200, 'Jul 2026': 2800 },
        actualFcst: { 'Jun 2026': 28400, 'Jul 2026': 27200 },
        risk: { 'Jun 2026': -1800, 'Jul 2026': -2100 },
      },
    },
  ];

  return (
    <div className="min-h-screen bg-bg-page p-6 space-y-8 max-w-[1400px] mx-auto text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Component Gallery (/dev)</h1>
          <p className="text-xs text-text-secondary">Showcase of standalone presentational components with sample props</p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-700 text-white rounded-card text-xs font-semibold hover:bg-primary-900"
        >
          <ChevronLeft className="w-4 h-4" /> Back to App
        </Link>
      </div>

      {/* 1. Header Components */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary border-b border-border pb-1">
          1. Header Components
        </h2>
        <div className="flex flex-wrap items-center gap-6 p-4 bg-primary-700 rounded-card shadow-sm">
          <RoleBadge roleTitle="Demand Planner" userName="Priya Sharma" />
          <LabeledSelect
            label={labels.header.selects.productView}
            value={selectVal}
            options={[
              { value: 'brand', label: labels.header.selects.productViewOptions.brand },
              { value: 'product', label: labels.header.selects.productViewOptions.product },
            ]}
            onChange={setSelectVal}
          />
          <HeaderIconButton
            icon={<Save className="w-4 h-4" />}
            tooltip={labels.header.actions.saveScenario}
            onClick={() => {}}
          />
          <HeaderActions
            onSaveScenario={() => {}}
            onCommitScenario={() => {}}
            onToggleTable={() => {}}
            onOpenFilter={() => {}}
            onOpenScenarios={() => {}}
            isTableActive={false}
          />
        </div>
      </section>

      {/* 2. KPI Components */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary border-b border-border pb-1">
          2. KPI Components (KpiCard &amp; KpiCardRow)
        </h2>
        <div className="p-4 bg-surface border border-border rounded-card space-y-4 shadow-card">
          <KpiCardRow kpis={sampleKpis} />
          <div className="flex gap-3">
            <KpiCard kpi={sampleKpis[0]} />
            <KpiCard kpi={sampleKpis[1]} />
            <KpiCard kpi={sampleKpis[2]} />
          </div>
        </div>
      </section>

      {/* 3. Charts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary border-b border-border pb-1">
          3. Chart Components (2x2 Grid)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title={labels.charts.forecastTrend}>
            <ForecastLineChart data={sampleLinePoints} />
          </ChartCard>

          <ChartCard title={labels.charts.forecastBy('Brand')}>
            <StackedBarChart
              data={sampleStackedItems}
              level="brand"
              onDrillDown={() => {}}
            />
          </ChartCard>

          <ChartCard title={labels.charts.forecastBridge}>
            <WaterfallChart data={sampleWaterfallSteps} />
          </ChartCard>

          <ChartCard title={labels.charts.productMix}>
            <TreemapChart data={sampleTreemapData} level="brand" />
          </ChartCard>
        </div>
      </section>

      {/* 4. Filters */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary border-b border-border pb-1">
          4. Filter Components
        </h2>
        <div className="p-4 bg-surface border border-border rounded-card grid grid-cols-1 md:grid-cols-2 gap-4 shadow-card">
          <TimeRangeSlider
            range={timeRange}
            startDate={startDate}
            endDate={endDate}
            onChangeRange={setTimeRange}
            onChangeStartDate={setStartDate}
            onChangeEndDate={setEndDate}
          />
          <div className="space-y-3">
            <FilterSelect
              label={labels.filterDrawer.fields.brand}
              options={['Dove', 'Surf Excel', 'Lifebuoy', 'Knorr', 'Vaseline']}
              selected={selectedBrands}
              onChange={setSelectedBrands}
            />
            <FilterActions
              onApply={() => {}}
              onReset={() => setSelectedBrands([])}
              onClose={() => {}}
            />
          </div>
        </div>
      </section>

      {/* 5. Scenarios */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary border-b border-border pb-1">
          5. Scenario Components
        </h2>
        <div className="p-4 bg-surface border border-border rounded-card flex flex-wrap gap-4 items-center shadow-card">
          <StatusBadge status="saved" />
          <StatusBadge status="committed" />
          <div className="w-80">
            <ScenarioCard
              scenario={sampleScenario}
              onSelect={() => {}}
              onDelete={() => {}}
            />
          </div>
        </div>
      </section>

      {/* 6. Table Components */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary border-b border-border pb-1">
          6. Table Components (PlanningTable, Cells, Hints &amp; Buttons)
        </h2>
        <div className="p-4 bg-surface border border-border rounded-card space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <ModeHint mode={tableMode} isDesegregated={false} />
            <TableFloatingButtons
              mode={tableMode}
              onToggleEdit={() => setTableMode(tableMode === 'edit' ? 'view' : 'edit')}
              onToggleDelta={() => setTableMode(tableMode === 'delta' ? 'view' : 'delta')}
              onCloseOrSave={() => setTableMode('view')}
            />
          </div>
          <div className="flex items-center gap-4 p-2 bg-primary-50 rounded">
            <span>Sample DeltaCell:</span>
            <DeltaCell delta={1400} />
            <DeltaCell delta={-600} />
            <DeltaCell delta={0} />
            <span className="ml-4">Sample EditableCell:</span>
            <div className="w-24">
              <EditableCell
                value={editableVal}
                isEditable={tableMode === 'edit'}
                onChange={setEditableVal}
              />
            </div>
          </div>
          <PlanningTable
            rows={sampleRows}
            period={['Jan 2026', 'Feb 2026', 'Jun 2026', 'Jul 2026']}
            currentMonthIndex={2}
            level="brand"
            mode={tableMode}
            draftEdits={{}}
            onCellEdit={() => {}}
          />
        </div>
      </section>
    </div>
  );
};
