import { useQuery } from '@tanstack/react-query';
import { chartService } from '../services/chartService';
import { useViewStore } from '../store/viewStore';
import { useTableStore } from '../store/tableStore';

export function useChartData() {
  const { productLevel, scope, apg } = useViewStore();
  const { savedEdits } = useTableStore();

  const totalEditsDelta = Object.values(savedEdits).reduce((sum, val) => sum + val, 0);
  const scopeStr = scope.join(',') || undefined;
  const apgStr   = apg.join(',')   || undefined;

  const params = { productLevel, scope: scopeStr, apg: apgStr };

  const forecastLineQuery = useQuery({
    queryKey: ['forecast-line', productLevel, scopeStr, apgStr],
    queryFn: () => chartService.getForecastLine(params),
    staleTime: 1000 * 60 * 5,
  });

  const stackedBarQuery = useQuery({
    queryKey: ['stacked-bar', productLevel, scopeStr, apgStr],
    queryFn: () => chartService.getStackedBar(params),
    staleTime: 1000 * 60 * 5,
  });

  const waterfallQuery = useQuery({
    queryKey: ['waterfall', productLevel, scopeStr, apgStr],
    queryFn: () => chartService.getWaterfall(params),
    staleTime: 1000 * 60 * 5,
  });

  const treemapQuery = useQuery({
    queryKey: ['treemap', productLevel, scopeStr, apgStr],
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
