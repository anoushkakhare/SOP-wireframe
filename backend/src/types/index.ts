export type Role = 'demand_planner' | 'leadership';

export type ProductLevelNum = 1 | 2 | 3 | 4 | 5;
export type Uom = 'units' | 'volume' | 'revenue' | 'cases' | 'value';
export type TimeGrain = 'year' | 'half' | 'half_year' | 'quarter' | 'month' | 'week';
export type Measure = 'cases' | 'units' | 'value';

// Keep old aliases for backward compat during migration
export type ProductLevel = 'brand' | 'product';
export type CustomerLevel = 'customer' | 'customer_group';

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
}

export interface KpiItem {
  key: string;
  label: string;
  value: number | null;
  format: 'currency' | 'percent' | 'number';
  growthType?: 'positive' | 'negative' | 'neutral';
  isNeutral?: boolean;
  roValue?: number;
}

export interface ForecastLinePoint {
  time: string;
  forecast: number;
  worstCase: number;
  bestCase: number;
}

export interface ForecastLineResponse {
  points: ForecastLinePoint[];
}

export interface StackedBarItem {
  id?: string;
  category: string;
  hasDrillDown: boolean;
  segments: Record<string, number>;
  total: number;
}

export interface StackedBarResponse {
  level: ProductLevel;
  parent?: string;
  items: StackedBarItem[];
  availableCustomerGroups: string[];
}

export interface WaterfallStep {
  name: string;
  value: number;
  type: 'total' | 'increase' | 'decrease';
  start?: number;
  end?: number;
}

export interface WaterfallResponse {
  steps: WaterfallStep[];
}

export interface TreemapNode {
  id?: string;
  name: string;
  value?: number;
  brand?: string;
  parentId?: string | null;
  parentName?: string;
  children?: TreemapNode[];
  color?: string;
}

export interface TreemapResponse {
  level: ProductLevel;
  data: TreemapNode[];
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
  // Level columns (level 1..productLevel)
  category?: string;
  sop?: string;
  brand?: string;
  forecastGroup?: string;
  forecastUnit?: string;
  // Legacy compat
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
}

export interface TableResponse {
  period: string[];
  currentMonthIndex: number;
  level: ProductLevel;
  productLevelNum?: number;
  rows: PlanningTableRow[];
}

export interface TableEdit {
  rowId: string;
  definitionType: 'opportunity' | 'actualFcst' | 'risk';
  month: string;
  value: number;
  originalValue: number;
}

// New params shape for all data endpoints
export interface DataQueryParams {
  productLevel?: ProductLevelNum;
  scope?: string;        // comma-separated node ids
  apg?: string;          // comma-separated APG names
  timeGrain?: TimeGrain | string;
  measure?: Measure | string;
  uom?: Uom | string;
  from?: string;
  to?: string;
  planningCycle?: string;
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
