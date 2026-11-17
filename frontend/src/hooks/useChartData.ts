import { useQuery } from '@tanstack/react-query';
import { chartService } from '../services/chartService';
import { useViewStore } from '../store/viewStore';
import { useFilterStore } from '../store/filterStore';
import { useTableStore } from '../store/tableStore';

export function useChartData() {
  const { productLevel, scope, apg, measure, timeGrain } = useViewStore();
  const { appliedFilters } = useFilterStore();
  const { savedEdits } = useTableStore();

  const totalEditsDelta = Object.values(savedEdits).reduce((sum, val) => sum + val, 0);
  const scopeStr = scope.join(',') || undefined;
  const apgStr   = apg.join(',')   || undefined;
  const from = appliedFilters.startDate;
  const to   = appliedFilters.endDate;

  const params = {
    productLevel,
    scope: scopeStr,
    apg: apgStr,
    timeGrain,
    measure,
    from,
    to,
  };

  const keyPrefix = [productLevel, scopeStr, apgStr, timeGrain, measure, from, to];

  const forecastLineQuery = useQuery({
    queryKey: ['forecast-line', ...keyPrefix],
    queryFn: () => chartService.getForecastLine(params),
    staleTime: 1000 * 60 * 5,
  });

  const stackedBarQuery = useQuery({
    queryKey: ['stacked-bar', ...keyPrefix],
    queryFn: () => chartService.getStackedBar(params),
    staleTime: 1000 * 60 * 5,
  });

  const waterfallQuery = useQuery({
    queryKey: ['waterfall', ...keyPrefix],
    queryFn: () => chartService.getWaterfall(params),
    staleTime: 1000 * 60 * 5,
  });

  const treemapQuery = useQuery({
    queryKey: ['treemap', ...keyPrefix],
    queryFn: () => chartService.getTreemap(params),
    staleTime: 1000 * 60 * 5,
  });

  const waterfallData = waterfallQuery.data ? {
    steps: waterfallQuery.data.steps.map((s) => {
      if (s.name === 'Final forecast' && totalEditsDelta !== 0) {
        return { ...s, value: s.value + totalEditsDelta };
      }
      return s;
    }),
  } : undefined;

  return {
    forecastLine: forecastLineQuery,
    stackedBar:   stackedBarQuery,
    waterfall:    { ...waterfallQuery, data: waterfallData },
    treemap:      treemapQuery,
    isLoading:
      forecastLineQuery.isLoading ||
      stackedBarQuery.isLoading ||
      waterfallQuery.isLoading ||
      treemapQuery.isLoading,
  };
}
