import { useQuery } from '@tanstack/react-query';
import { chartService } from '../services/chartService';
import { useViewStore } from '../store/viewStore';
import { useFilterStore } from '../store/filterStore';
import { useTableStore } from '../store/tableStore';

export function useChartData() {
  const { productLevel, scope, apg, measure, timeGrain } = useViewStore();
  const { appliedFilters } = useFilterStore();
  const { mode, draftEdits, savedEdits } = useTableStore();

  const edits = mode === 'edit' ? draftEdits : savedEdits;
  const totalForecastDelta = Object.values(edits).reduce(
    (sum, val) => sum + (val.forecastMeasure ?? val.forecast ?? 0),
    0
  );

  const scopeStr = scope.join(',') || undefined;
  const apgStr = apg.join(',') || undefined;
  const from = appliedFilters.startDate;
  const to = appliedFilters.endDate;

  const params = {
    productLevel,
    scope: scopeStr,
    apg: apgStr,
    timeGrain,
    measure,
    from,
    to,
    planningCycle: appliedFilters.planningCycle,
    activity: appliedFilters.activity,
  };

  const keyPrefix = [
    productLevel,
    scopeStr,
    apgStr,
    timeGrain,
    measure,
    from,
    to,
    appliedFilters.planningCycle,
    appliedFilters.activity,
  ];

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

  const forecastLineData = forecastLineQuery.data ? {
    points: forecastLineQuery.data.points.map((p) => {
      let periodForecastDelta = 0;
      let periodOpportunityDelta = 0;
      let periodRiskDelta = 0;

      for (const edit of Object.values(edits)) {
        if (edit.period === p.time) {
          periodForecastDelta += edit.forecastMeasure ?? edit.forecast ?? 0;
          periodOpportunityDelta += edit.opportunityMeasure ?? edit.opportunity ?? 0;
          periodRiskDelta += edit.riskMeasure ?? edit.risk ?? 0;
        }
      }

      const forecast = p.forecast + periodForecastDelta;
      const bestCase = p.bestCase + periodForecastDelta + periodOpportunityDelta;
      const worstCase = p.worstCase + periodForecastDelta + periodRiskDelta;

      return {
        ...p,
        forecast,
        bestCase,
        worstCase,
      };
    }),
  } : undefined;

  const waterfallData = waterfallQuery.data ? {
    steps: waterfallQuery.data.steps.map((s) => {
      if (s.name === 'Final forecast' && totalForecastDelta !== 0) {
        return { ...s, value: s.value + totalForecastDelta };
      }
      return s;
    }),
  } : undefined;

  return {
    forecastLine: { ...forecastLineQuery, data: forecastLineData },
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
