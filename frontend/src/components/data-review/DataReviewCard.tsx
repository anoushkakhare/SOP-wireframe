import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDataReviewNavStore } from '../../pages/dataReview/sections';
import {
  Database,
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  GitBranch,
  Grid,
  ChevronDown,
  ChevronUp,
  Layers,
  Users,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { HierarchyNetwork } from '../hierarchy/HierarchyNetwork';
import { TreemapChart } from '../charts/TreemapChart';
import { ChartCard } from '../charts/ChartCard';
import {
  TransactionBarChart,
  TransactionLineChart,
  TransactionPieChart,
} from './TransactionCharts';
import {
  DockedDataTable,
  MasterDataRow,
  TransactionDataRow,
  DockedTableData,
} from './DockedDataTable';
import { metaService } from '../../services/metaService';
import { chartService } from '../../services/chartService';
import { useDataReviewTransactions } from '../../hooks/useDataReview';
import { LEVELS, LEVEL_MAP } from '../../constants/hierarchy';
import { HierarchyNode, TreemapNode } from '../../types';

// Static customer hierarchy definition
export const CUSTOMER_HIERARCHY_DATA = [
  {
    id: 'cg_mt',
    name: 'Modern Trade',
    level: 1,
    levelName: 'Customer Group',
    parentId: null,
    customers: [
      { id: 'cust_rr', name: 'Reliance Retail', level: 2, levelName: 'Customer', parentId: 'cg_mt', parentName: 'Modern Trade', value: 1840000 },
      { id: 'cust_dm', name: 'DMart', level: 2, levelName: 'Customer', parentId: 'cg_mt', parentName: 'Modern Trade', value: 1420000 },
      { id: 'cust_mr', name: 'More Retail', level: 2, levelName: 'Customer', parentId: 'cg_mt', parentName: 'Modern Trade', value: 890000 },
      { id: 'cust_sp', name: "Spencer's", level: 2, levelName: 'Customer', parentId: 'cg_mt', parentName: 'Modern Trade', value: 650000 },
    ],
  },
  {
    id: 'cg_gt',
    name: 'General Trade',
    level: 1,
    levelName: 'Customer Group',
    parentId: null,
    customers: [
      { id: 'cust_nrd', name: 'North Region Distributors', level: 2, levelName: 'Customer', parentId: 'cg_gt', parentName: 'General Trade', value: 2150000 },
      { id: 'cust_srd', name: 'South Region Distributors', level: 2, levelName: 'Customer', parentId: 'cg_gt', parentName: 'General Trade', value: 1920000 },
      { id: 'cust_wrd', name: 'West Region Distributors', level: 2, levelName: 'Customer', parentId: 'cg_gt', parentName: 'General Trade', value: 1130000 },
    ],
  },
  {
    id: 'cg_ec',
    name: 'E-commerce',
    level: 1,
    levelName: 'Customer Group',
    parentId: null,
    customers: [
      { id: 'cust_amz', name: 'Amazon', level: 2, levelName: 'Customer', parentId: 'cg_ec', parentName: 'E-commerce', value: 1380000 },
      { id: 'cust_fk', name: 'Flipkart', level: 2, levelName: 'Customer', parentId: 'cg_ec', parentName: 'E-commerce', value: 920000 },
      { id: 'cust_bb', name: 'BigBasket', level: 2, levelName: 'Customer', parentId: 'cg_ec', parentName: 'E-commerce', value: 390000 },
    ],
  },
  {
    id: 'cg_qc',
    name: 'Quick Commerce',
    level: 1,
    levelName: 'Customer Group',
    parentId: null,
    customers: [
      { id: 'cust_blnk', name: 'Blinkit', level: 2, levelName: 'Customer', parentId: 'cg_qc', parentName: 'Quick Commerce', value: 740000 },
      { id: 'cust_zpt', name: 'Zepto', level: 2, levelName: 'Customer', parentId: 'cg_qc', parentName: 'Quick Commerce', value: 520000 },
      { id: 'cust_swg', name: 'Swiggy Instamart', level: 2, levelName: 'Customer', parentId: 'cg_qc', parentName: 'Quick Commerce', value: 410000 },
    ],
  },
];

interface DataReviewCardProps {
  orderNumber?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DataReviewCard: React.FC<DataReviewCardProps> = ({
  orderNumber = 3,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCardCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleCardToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // 1. Top tabs: Master data | Transactional data
  const [mainTab, setMainTab] = useState<'master' | 'transactional'>('master');

  // 2. Master data sub-tabs: Product hierarchy | Customer hierarchy
  const [masterSubTab, setMasterSubTab] = useState<'product' | 'customer'>('product');

  // Segmented switches: Tree | Treemap (Default Tree)
  const [productViewType, setProductViewType] = useState<'tree' | 'treemap'>('tree');
  const [productTreemapLevel, setProductTreemapLevel] = useState<number>(3); // Default Brand (3)

  const [customerViewType, setCustomerViewType] = useState<'tree' | 'treemap'>('tree');
  const [customerTreemapLevel, setCustomerTreemapLevel] = useState<number>(1); // Default Customer group (1)

  // 3. Transactional data controls
  const [txChartType, setTxChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [txMeasure, setTxMeasure] = useState<'cases' | 'units' | 'value'>('value');
  const [txGroupBy, setTxGroupBy] = useState<'category' | 'sop' | 'brand'>('category');
  const [txFromPeriod, setTxFromPeriod] = useState<string>('Jan 25');
  const [txToPeriod, setTxToPeriod] = useState<string>('Oct 26');

  // 4. Fullscreen and docked table state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTableCollapsed, setIsTableCollapsed] = useState<boolean>(false); // default docked and open
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);

  // Sync with reviewTarget from store (navigation from pipeline stepper)
  const reviewTarget = useDataReviewNavStore((s) => s.reviewTarget);

  useEffect(() => {
    if (reviewTarget && reviewTarget.timestamp) {
      setMainTab(reviewTarget.mainTab);
      if (reviewTarget.masterSubTab) {
        setMasterSubTab(reviewTarget.masterSubTab);
      }
      if (reviewTarget.txChartType) {
        setTxChartType(reviewTarget.txChartType);
      }
      setIsFullscreen(false);
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [reviewTarget]);

  // ── Data Queries ──
  // Hierarchy nodes for Product Tree
  const hierarchyQuery = useQuery({
    queryKey: ['hierarchy'],
    queryFn: () => metaService.getHierarchy(),
  });
  const productNodes: HierarchyNode[] = hierarchyQuery.data || [];

  // Product Treemap Query
  const productTreemapQuery = useQuery({
    queryKey: ['treemap-chart', productTreemapLevel, txMeasure],
    queryFn: () =>
      chartService.getTreemap({
        productLevel: productTreemapLevel,
        measure: txMeasure,
      }),
    enabled: mainTab === 'master' && masterSubTab === 'product' && productViewType === 'treemap',
  });

  // Transactional Data Query
  const transactionsQuery = useDataReviewTransactions({
    measure: txMeasure,
    groupBy: txGroupBy,
    from: txFromPeriod,
    to: txToPeriod,
  });

  const txData = transactionsQuery.data;
  const txPeriods = txData?.periods || [];
  const txGroups = txData?.groups || [];
  const txItems = txData?.items || [];

  // ── Customer Treemap Data ──
  const customerTreemapData: TreemapNode[] = useMemo(() => {
    if (customerTreemapLevel === 1) {
      return CUSTOMER_HIERARCHY_DATA.map((g) => ({
        id: g.id,
        name: g.name,
        value: g.customers.reduce((s, c) => s + c.value, 0),
      }));
    } else {
      return CUSTOMER_HIERARCHY_DATA.map((g) => ({
        id: g.id,
        name: g.name,
        value: g.customers.reduce((s, c) => s + c.value, 0),
        children: g.customers.map((c) => ({
          id: c.id,
          name: c.name,
          value: c.value,
          parentId: g.id,
          parentName: g.name,
        })),
      }));
    }
  }, [customerTreemapLevel]);

  // ── Master Data Table Rows for Docked Table ──
  const masterProductTableRows: MasterDataRow[] = useMemo(() => {
    const parentMap = new Map<string, string>();
    const childCountMap = new Map<string, number>();

    for (const n of productNodes) {
      if (n.parentId) {
        childCountMap.set(n.parentId, (childCountMap.get(n.parentId) || 0) + 1);
      }
    }

    const nodeById = new Map<string, HierarchyNode>(productNodes.map((n) => [n.id, n]));
    for (const n of productNodes) {
      if (n.parentId && nodeById.has(n.parentId)) {
        parentMap.set(n.id, nodeById.get(n.parentId)!.name);
      }
    }

    return productNodes.map((n) => ({
      id: n.id,
      name: n.name,
      level: LEVEL_MAP[n.level]?.label || `Level ${n.level}`,
      parent: parentMap.get(n.id) || '—',
      childCount: childCountMap.get(n.id) || 0,
    }));
  }, [productNodes]);

  const masterCustomerTableRows: MasterDataRow[] = useMemo(() => {
    const rows: MasterDataRow[] = [];
    for (const g of CUSTOMER_HIERARCHY_DATA) {
      rows.push({
        id: g.id,
        name: g.name,
        level: 'Customer group (1)',
        parent: '—',
        childCount: g.customers.length,
      });
      for (const c of g.customers) {
        rows.push({
          id: c.id,
          name: c.name,
          level: 'Customer (2)',
          parent: g.name,
          childCount: 0,
        });
      }
    }
    return rows;
  }, []);

  // ── Active Table Data for Fullscreen Dock ──
  const activeDockTableData: DockedTableData = useMemo(() => {
    if (mainTab === 'master') {
      return {
        type: 'master',
        rows: masterSubTab === 'product' ? masterProductTableRows : masterCustomerTableRows,
      };
    } else {
      const rows: TransactionDataRow[] = txItems.map((it) => ({
        period: it.period,
        group: it.group,
        value: it.value,
        rowCount: it.rowCount,
        isAnomaly: it.isAnomaly,
      }));
      return {
        type: 'transaction',
        rows,
        measure: txMeasure,
      };
    }
  }, [
    mainTab,
    masterSubTab,
    masterProductTableRows,
    masterCustomerTableRows,
    txItems,
    txMeasure,
  ]);

  // Compute chart card title
  const chartCardTitle = useMemo(() => {
    if (mainTab === 'master') {
      if (masterSubTab === 'product') {
        return productViewType === 'tree'
          ? 'Product hierarchy — Tree network'
          : `Product hierarchy — Treemap (${LEVEL_MAP[productTreemapLevel]?.label || `Level ${productTreemapLevel}`})`;
      } else {
        return customerViewType === 'tree'
          ? 'Customer hierarchy — Tree network'
          : `Customer hierarchy — Treemap (${customerTreemapLevel === 1 ? 'Customer group' : 'Customer'})`;
      }
    } else {
      const gLabel =
        txGroupBy === 'sop' ? 'S&OP group' : txGroupBy === 'brand' ? 'Brand' : 'Category';
      const mLabel =
        txMeasure === 'cases' ? 'Cases' : txMeasure === 'units' ? 'Units' : 'Value';
      const cLabel =
        txChartType === 'bar' ? 'Stacked Bar' : txChartType === 'line' ? 'Trend Line' : 'Distribution Pie';
      return `Transactional review — ${cLabel} by ${gLabel} (${mLabel})`;
    }
  }, [
    mainTab,
    masterSubTab,
    productViewType,
    productTreemapLevel,
    customerViewType,
    customerTreemapLevel,
    txGroupBy,
    txMeasure,
    txChartType,
  ]);

  // ── Render Chart / Hierarchy Content ──
  const renderVisualContent = () => {
    if (mainTab === 'master') {
      if (masterSubTab === 'product') {
        if (productViewType === 'tree') {
          return <HierarchyNetwork mode="product" nodes={productNodes} />;
        } else {
          return (
            <TreemapChart
              data={productTreemapQuery.data?.data}
              level={productTreemapLevel <= 3 ? 'brand' : 'product'}
              productLevelNum={productTreemapLevel}
              isLoading={productTreemapQuery.isLoading}
            />
          );
        }
      } else {
        if (customerViewType === 'tree') {
          return <HierarchyNetwork mode="customer" />;
        } else {
          return (
            <TreemapChart
              data={customerTreemapData}
              level="brand"
              productLevelNum={customerTreemapLevel}
            />
          );
        }
      }
    } else {
      if (txChartType === 'bar') {
        return (
          <TransactionBarChart
            items={txItems}
            periods={txPeriods}
            groups={txGroups}
            measure={txMeasure}
            isLoading={transactionsQuery.isLoading}
          />
        );
      } else if (txChartType === 'line') {
        return (
          <TransactionLineChart
            items={txItems}
            periods={txPeriods}
            groups={txGroups}
            measure={txMeasure}
            isLoading={transactionsQuery.isLoading}
          />
        );
      } else {
        return (
          <TransactionPieChart
            items={txItems}
            periods={txPeriods}
            groups={txGroups}
            measure={txMeasure}
            isLoading={transactionsQuery.isLoading}
          />
        );
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5 transition-all duration-300 ${
        isHighlighted ? 'ring-2 ring-primary-500 shadow-md' : ''
      }`}
    >
      {/* ── Section Card Header ── */}
      <button
        type="button"
        onClick={handleCardToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer border-b border-gray-100 select-none"
        aria-expanded={!isCardCollapsed}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm">
            {orderNumber}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Data review</h2>
            <p className="text-xs text-gray-500">
              Master data hierarchy networks, SKU volume profiling, and transactional feed integrity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            14,250 SKUs Profiled
          </span>
          <div className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            {isCardCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* ── Card Content Body ── */}
      {!isCardCollapsed && (
        <div className="p-4 sm:p-5">
          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">
                Active SKUs
              </span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">14,250</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium truncate">
                100% hierarchy mapped
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">
                Customer Accounts
              </span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">3,820</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium truncate">
                Mapped to 4 APG channels
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">
                History Range
              </span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">24 Months</span>
              <span className="text-[10px] text-gray-500 block mt-0.5 truncate">
                Jan 2025 to Dec 2026
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">
                Seeded Anomalies
              </span>
              <span className="text-lg sm:text-xl font-bold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />2 Detected
              </span>
              <span className="text-[10px] text-amber-600 block mt-0.5 font-medium truncate">
                1 Feed Gap · 1 Spike
              </span>
            </div>
          </div>

          {/* ── 1. Top Tabs: Master data | Transactional data ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 mb-4 border-b border-gray-200">
            <div className="inline-flex p-1 bg-gray-100 rounded-lg border border-gray-200 select-none">
              <button
                type="button"
                onClick={() => {
                  setMainTab('master');
                  setIsFullscreen(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  mainTab === 'master'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Master data
              </button>
              <button
                type="button"
                onClick={() => {
                  setMainTab('transactional');
                  setIsFullscreen(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  mainTab === 'transactional'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Transactional data
              </button>
            </div>

            {/* Contextual description tag */}
            <div className="text-xs text-gray-500 flex items-center gap-1.5 self-start sm:self-auto">
              {mainTab === 'master' ? (
                <span>
                  Explore <span className="font-semibold text-gray-700">5-level product</span> &amp;{' '}
                  <span className="font-semibold text-gray-700">customer channel</span> hierarchies
                </span>
              ) : (
                <span>
                  Analyze volume actuals with seeded feed integrity anomalies
                </span>
              )}
            </div>
          </div>

          {/* ── 2. Master Data Sub-controls ── */}
          {mainTab === 'master' && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2.5 bg-gray-50/80 rounded-lg border border-gray-200 text-xs">
              {/* Sub-tabs: Product hierarchy | Customer hierarchy */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Hierarchy:
                </span>
                <div className="inline-flex p-0.5 bg-gray-200/70 rounded-md">
                  <button
                    type="button"
                    onClick={() => setMasterSubTab('product')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      masterSubTab === 'product'
                        ? 'bg-white text-primary-900 font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Product hierarchy
                  </button>
                  <button
                    type="button"
                    onClick={() => setMasterSubTab('customer')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      masterSubTab === 'customer'
                        ? 'bg-white text-primary-900 font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Customer hierarchy
                  </button>
                </div>
              </div>

              {/* Segmented switch: Tree | Treemap + Level selector */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    View:
                  </span>
                  {masterSubTab === 'product' ? (
                    <div className="inline-flex p-0.5 bg-gray-200/70 rounded-md">
                      <button
                        type="button"
                        onClick={() => setProductViewType('tree')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                          productViewType === 'tree'
                            ? 'bg-white text-primary-900 font-semibold shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        Tree
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductViewType('treemap')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                          productViewType === 'treemap'
                            ? 'bg-white text-primary-900 font-semibold shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                        Treemap
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex p-0.5 bg-gray-200/70 rounded-md">
                      <button
                        type="button"
                        onClick={() => setCustomerViewType('tree')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                          customerViewType === 'tree'
                            ? 'bg-white text-primary-900 font-semibold shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        Tree
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerViewType('treemap')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                          customerViewType === 'treemap'
                            ? 'bg-white text-primary-900 font-semibold shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                        Treemap
                      </button>
                    </div>
                  )}
                </div>

                {/* Level Selector (shown when Treemap is active) */}
                {masterSubTab === 'product' && productViewType === 'treemap' && (
                  <div className="flex items-center gap-1.5 animate-in fade-in">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Level:
                    </span>
                    <select
                      value={productTreemapLevel}
                      onChange={(e) => setProductTreemapLevel(Number(e.target.value))}
                      aria-label="Product Treemap Level"
                      className="px-2 py-1 text-xs font-semibold bg-white border border-gray-300 rounded shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                    >
                      {LEVELS.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          Level {lvl.id} · {lvl.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {masterSubTab === 'customer' && customerViewType === 'treemap' && (
                  <div className="flex items-center gap-1.5 animate-in fade-in">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Level:
                    </span>
                    <select
                      value={customerTreemapLevel}
                      onChange={(e) => setCustomerTreemapLevel(Number(e.target.value))}
                      aria-label="Customer Treemap Level"
                      className="px-2 py-1 text-xs font-semibold bg-white border border-gray-300 rounded shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                    >
                      <option value={1}>Level 1 · Customer group</option>
                      <option value={2}>Level 2 · Customer</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 3. Transactional Data Controls ── */}
          {mainTab === 'transactional' && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2.5 bg-gray-50/80 rounded-lg border border-gray-200 text-xs">
              {/* Chart switch: Bar | Line | Pie (default Bar) */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Visual:
                </span>
                <div className="inline-flex p-0.5 bg-gray-200/70 rounded-md">
                  <button
                    type="button"
                    onClick={() => setTxChartType('bar')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                      txChartType === 'bar'
                        ? 'bg-white text-primary-900 font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxChartType('line')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                      txChartType === 'line'
                        ? 'bg-white text-primary-900 font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LineChartIcon className="w-3.5 h-3.5" />
                    Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxChartType('pie')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                      txChartType === 'pie'
                        ? 'bg-white text-primary-900 font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                    Pie
                  </button>
                </div>
              </div>

              {/* Controls: Measure, Group-by, Period Range */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Measure Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Measure:
                  </span>
                  <select
                    value={txMeasure}
                    onChange={(e) => setTxMeasure(e.target.value as any)}
                    aria-label="Transactional Measure"
                    className="px-2 py-1 text-xs font-semibold bg-white border border-gray-300 rounded shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  >
                    <option value="cases">Cases</option>
                    <option value="units">Units</option>
                    <option value="value">Value ($)</option>
                  </select>
                </div>

                {/* Group-by Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Group by:
                  </span>
                  <select
                    value={txGroupBy}
                    onChange={(e) => setTxGroupBy(e.target.value as any)}
                    aria-label="Transactional Group-by"
                    className="px-2 py-1 text-xs font-semibold bg-white border border-gray-300 rounded shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  >
                    <option value="category">Category</option>
                    <option value="sop">S&OP group</option>
                    <option value="brand">Brand</option>
                  </select>
                </div>

                {/* Period Range Selectors */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    Range:
                  </span>
                  <select
                    value={txFromPeriod}
                    onChange={(e) => setTxFromPeriod(e.target.value)}
                    aria-label="Period From"
                    className="px-1.5 py-1 text-xs font-medium bg-white border border-gray-300 rounded shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  >
                    {txPeriods.map((p) => (
                      <option key={`from-${p}`} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-xs">to</span>
                  <select
                    value={txToPeriod}
                    onChange={(e) => setTxToPeriod(e.target.value)}
                    aria-label="Period To"
                    className="px-1.5 py-1 text-xs font-medium bg-white border border-gray-300 rounded shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  >
                    {txPeriods.map((p) => (
                      <option key={`to-${p}`} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. Visual inside ChartCard with Fullscreen & Docked Table ── */}
          <ChartCard
            title={chartCardTitle}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => {
              setIsFullscreen(!isFullscreen);
              setIsTableCollapsed(false); // open by default in fullscreen
            }}
            fullscreenHeight="w-full h-[640px]"
            height="h-[460px]"
          >
            <div className="w-full h-full flex flex-col min-h-0">
              {/* Visual Container */}
              <div className="flex-1 min-h-0 relative w-full overflow-hidden">
                {renderVisualContent()}
              </div>

              {/* VIEW-ONLY Docked Data Table in Fullscreen */}
              {isFullscreen && (
                <DockedDataTable
                  data={activeDockTableData}
                  isCollapsed={isTableCollapsed}
                  onToggleCollapse={() => setIsTableCollapsed(!isTableCollapsed)}
                />
              )}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
};
