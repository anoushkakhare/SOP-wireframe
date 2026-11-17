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
  value: number;
  format: 'currency' | 'percent' | 'number';
  growthType?: 'positive' | 'negative' | 'neutral';
  isNeutral?: boolean;
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
  name: string;
  value?: number;
  brand?: string;
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

export interface DataQueryParams {
  productLevel?: ProductLevelNum;
  scope?: string;
  apg?: string;
  timeGrain?: TimeGrain | string;
  measure?: Measure | string;
  uom?: Uom | string;
  from?: string;
  to?: string;
}
