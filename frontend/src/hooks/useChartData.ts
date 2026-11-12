import { useQuery } from '@tanstack/react-query';
import { chartService } from '../services/chartService';
import { useHeaderStore } from '../store/headerStore';
import { useFilterStore } from '../store/filterStore';
import { useTableStore } from '../store/tableStore';

export function useChartData() {
  const { productLevel, parentBrand } = useHeaderStore();
  const { appliedFilters } = useFilterStore();
  const { savedEdits } = useTableStore();

  const totalEditsDelta = Object.values(savedEdits).reduce((sum, val) => sum + val, 0);

  // 1. Forecast Line Query
  const forecastLineQuery = useQuery({
    queryKey: ['forecast-line', parentBrand, appliedFilters.startDate, appliedFilters.endDate],
    queryFn: () => chartService.getForecastLine(parentBrand),
    staleTime: 1000 * 60 * 5,
  });

  // 2. Stacked Bar Query
  const stackedBarQuery = useQuery({
    queryKey: ['stacked-bar', productLevel, parentBrand, appliedFilters.brands],
    queryFn: () => chartService.getStackedBar(productLevel, parentBrand),
    staleTime: 1000 * 60 * 5,
  });

  // 3. Waterfall Query
  const waterfallQuery = useQuery({
    queryKey: ['waterfall', parentBrand],
    queryFn: () => chartService.getWaterfall(parentBrand),
    staleTime: 1000 * 60 * 5,
  });

  // 4. Treemap Query
  const treemapQuery = useQuery({
    queryKey: ['treemap', productLevel],
    queryFn: () => chartService.getTreemap(productLevel),
    staleTime: 1000 * 60 * 5,
  });

  // Adjust waterfall if manual client edits exist
  const waterfallData = waterfallQuery.data ? {
    steps: waterfallQuery.data.steps.map((s) => {
      if (s.name === 'Adjust') {
        return { ...s, value: s.value + totalEditsDelta };
      }
      if (s.name === 'Forecast') {
        return { ...s, value: s.value + totalEditsDelta };
      }
      return s;
    }),
  } : undefined;

  return {
    forecastLine: forecastLineQuery,
    stackedBar: stackedBarQuery,
    waterfall: { ...waterfallQuery, data: waterfallData },
    treemap: treemapQuery,
    isLoading:
      forecastLineQuery.isLoading ||
      stackedBarQuery.isLoading ||
      waterfallQuery.isLoading ||
      treemapQuery.isLoading,
  };
}

