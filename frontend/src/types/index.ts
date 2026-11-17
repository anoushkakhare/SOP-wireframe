export type Role = 'demand_planner' | 'leadership';

export type ProductLevelNum = 1 | 2 | 3 | 4 | 5;
// Legacy compat
export type ProductLevel = 'brand' | 'product';
export type CustomerLevel = 'customer' | 'customer_group';
export type Uom = 'units' | 'volume' | 'revenue' | 'cases' | 'value';
export type TimeGrain = 'year' | 'half' | 'half_year' | 'quarter' | 'month' | 'week';
export type Measure = 'cases' | 'units' | 'value';

export interface User {
  id: string;
  name: string;
  role: Role;
  roleTitle: string;
}

export interface WidgetManifest {
  id: string;
  componentKey: string;
  title?: string;
  order: number;
  props?: Record<string, any>;
}

export interface PageManifest {
  id: string;
  label: string;
  path: string;
  icon: string;
  enabled: boolean;
}

export interface LayoutManifest {
  role: Role;
  roleTitle: string;
  widgets: WidgetManifest[];
  headerControls: {
    showProductLevel: boolean;
    showCustomerLevel: boolean;
    showUom: boolean;
    actions: ('save' | 'commit' | 'table' | 'filter' | 'scenarios')[];
  };
  pages?: PageManifest[];
}

export interface LoginResponse {
  token: string;
  user: User;
  layoutManifest: LayoutManifest;
}

export interface HierarchyNode {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
}

export interface MetaOptions {
  productLevels: Array<{ value: ProductLevel; label: string }>;
  customerLevels: Array<{ value: CustomerLevel; label: string }>;
  uoms: Array<{ value: Uom; label: string }>;
  timeGrains?: Array<{ value: string; label: string }>;
  measures?: Array<{ value: string; label: string }>;
  planningCycles?: Array<{ value: string; label: string }>;
  activities?: Array<{ value: string; label: string }>;
  filters: {
    categories: string[];
    brands: string[];
    products: string[];
    customerGroups: string[];
    customers: string[];
    businessUnits: string[];
  };
}

export interface FilterState {
  timeRange: [number, number];
  startDate: string;
  endDate: string;
  categories: string[];
  brands: string[];
  products: string[];
  customerGroups: string[];
  customers: string[];
  businessUnits: string[];
  planningCycle?: string;
  activity?: string;
}

export interface KpiItem {
  key: string;
  label: string;
  value: number | null;
  format: 'currency' | 'percent' | 'number';
  growthType?: 'positive' | 'negative' | 'neutral';
  isNeutral?: boolean;
  roValue?: number;
  compareValue?: number | null;
  delta?: number | null;
  pctChange?: number | null;
  compareTo?: string;
}

export interface ForecastLinePoint {
  time: string;
  forecast: number;
  worstCase: number;
  bestCase: number;
  seriesA?: number;
  seriesB?: number | null;
  delta?: number | null;
  aName?: string;
  bName?: string;
}

export interface ForecastLineResponse {
  points: ForecastLinePoint[];
  compareTo?: string;
  cycleA?: string;
}

export interface StackedBarItem {
  id?: string;
  category: string;
  hasDrillDown: boolean;
  segments: Record<string, number>;
  total: number;
  seriesA?: number;
  seriesB?: number;
  delta?: number;
  segmentsA?: Record<string, number>;
  segmentsB?: Record<string, number>;
}

export interface StackedBarResponse {
  level: ProductLevel;
  parent?: string;
  items: StackedBarItem[];
  availableCustomerGroups: string[];
  compareTo?: string;
  cycleA?: string;
}

export interface WaterfallDriver {
  name: string;
  value: number;
}

export interface WaterfallStep {
  name: string;
  value: number;
  type: 'total' | 'increase' | 'decrease';
  start?: number;
  end?: number;
  topDrivers?: WaterfallDriver[];
}

export interface WaterfallResponse {
  steps: WaterfallStep[];
  compareTo?: string;
  cycleA?: string;
}

export interface TreemapNode {
  id?: string;
  name: string;
  value?: number;
  valueA?: number;
  valueB?: number;
  delta?: number;
  pctChange?: number;
  brand?: string;
  parentId?: string | null;
  parentName?: string;
  children?: TreemapNode[];
  color?: string;
}

export interface TreemapResponse {
  level: ProductLevel;
  data: TreemapNode[];
  compareTo?: string;
  cycleA?: string;
}

export type ScenarioStatus = 'saved' | 'committed';

export interface Scenario {
  id: string;
  name: string;
  status: ScenarioStatus;
  lastModified: string;
  userId: string;
  userName: string;
}

export interface CreateScenarioDto {
  name: string;
}

export interface PlanningTableRow {
  id: string;
  category?: string;
  sop?: string;
  brand?: string;
  forecastGroup?: string;
  forecastUnit?: string;
  // legacy compat
  product?: string;
  customerGroup: string;
  customer: string;
  apg?: string;
  unitsPerCase?: number;
  price?: number;
  definitions: {
    opportunity: Record<string, number>;
    actualFcst: Record<string, number>;
    risk: Record<string, number>;
  };
  pastActuals: Record<string, number>;
  diffs?: Record<string, Record<string, number>>;
  definitionsB?: {
    opportunity: Record<string, number>;
    actualFcst: Record<string, number>;
    risk: Record<string, number>;
  };
  pastActualsB?: Record<string, number>;
}

export interface TableResponse {
  period: string[];
  currentMonthIndex: number;
  level: ProductLevel;
  productLevelNum?: number;
  rows: PlanningTableRow[];
  compareTo?: string;
  cycleA?: string;
}

export interface TableEdit {
  rowId: string;
  definitionType: 'opportunity' | 'actualFcst' | 'risk';
  month: string;
  value: number;
  originalValue: number;
}

export interface DataQueryParams {
  productLevel?: ProductLevelNum;
  scope?: string;
  apg?: string;
  timeGrain?: TimeGrain | string;
  measure?: Measure | string;
  uom?: Uom | string;
  from?: string;
  to?: string;
  planningCycle?: string;
  compareTo?: string;
  activity?: string;
}

export type FeedType = 'master' | 'transactional';
export type FeedStatus = 'loaded' | 'delayed' | 'pending' | 'failed';

export interface DataReviewFeed {
  id: string;
  name: string;
  type: FeedType;
  expectedDate: string;
  status: FeedStatus;
  loadedAt: string | null;
  rowCount: number | null;
  source: string;
  delayHours?: number;
}

export interface DataReviewHistoryItem {
  id: string;
  feedId: string;
  feedName: string;
  type: FeedType;
  cycle: string;
  expectedDate: string;
  loadedAt: string | null;
  status: FeedStatus;
  delayHours: number;
  rowCount: number | null;
  source: string;
}

export interface ReadinessCheckItem {
  id: string;
  label: string;
  status: 'passed' | 'failed' | 'pending';
  checked: boolean;
  isManual: boolean;
  details?: string;
}

export interface DataReviewReadinessResponse {
  totalSteps: number;
  completedSteps: number;
  signedOff: boolean;
  signoff: {
    signedBy: string;
    signedAt: string;
    cycle: string;
  } | null;
  checklist: ReadinessCheckItem[];
  blockingItems: string[];
}

export interface SignoffRequest {
  signedBy?: string;
  signedAt?: string;
  cycle?: string;
}

export interface TransactionReviewItem {
  period: string;
  group: string;
  value: number;
  rowCount: number;
  isAnomaly?: 'gap' | 'spike';
}

export interface TransactionReviewQueryParams {
  measure?: 'cases' | 'units' | 'value';
  groupBy?: 'category' | 'sop' | 'brand';
  from?: string;
  to?: string;
}

export interface TransactionReviewResponse {
  items: TransactionReviewItem[];
  periods: string[];
  groups: string[];
  measure: 'cases' | 'units' | 'value';
  groupBy: 'category' | 'sop' | 'brand';
  summary: {
    totalValue: number;
    totalRows: number;
    gapCount: number;
    spikeCount: number;
  };
}

export interface MappingGapRow {
  id: string;
  transactionCode: string;
  description: string;
  period: string;
  value: number;
  suggestedMaster: string;
  fixed: boolean;
  fixedType?: 'master' | 'transaction';
}

export interface NullValueRow {
  id: string;
  column: string;
  row: string;
  expected: string;
  fixed: boolean;
  replacedWith?: 'zero' | 'mean' | 'median' | 'mode' | null;
}

export interface MissingItemRow {
  id: string;
  feedId: string;
  feedName: string;
  description: string;
}

export interface DataValidationData {
  mappingGaps: {
    count: number;
    rows: MappingGapRow[];
  };
  nullValues: {
    count: number;
    rows: NullValueRow[];
  };
  missingItems: {
    count: number;
    rows: MissingItemRow[];
  };
}

export interface InnovationProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  sopGroup: string;
  brand: string;
  sourceForecastUnits: string[];
  launchMonth: string;
  upliftPct: number;
}

export interface ComboPackComponent {
  id: string;
  name: string;
  code: string;
  quantity: number;
}

export interface ComboPack {
  id: string;
  name: string;
  code: string;
  components: ComboPackComponent[];
}


