import React from 'react';
import { KpiCardRow } from '../components/kpi/KpiCardRow';
import { ForecastLineChart } from '../components/charts/ForecastLineChart';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { WaterfallChart } from '../components/charts/WaterfallChart';
import { TreemapChart } from '../components/charts/TreemapChart';
import { BottomDock } from '../components/table/BottomDock';

export const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  KpiCardRow,
  ForecastLineChart,
  StackedBarChart,
  WaterfallChart,
  TreemapChart,
  BottomDock,
};

export function getComponentByKey(key: string): React.ComponentType<any> | null {
  return COMPONENT_REGISTRY[key] || null;
}

