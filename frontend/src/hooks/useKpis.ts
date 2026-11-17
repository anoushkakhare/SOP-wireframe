import { useQuery } from '@tanstack/react-query';
import { kpiService } from '../services/kpiService';
import { useViewStore } from '../store/viewStore';
import { useFilterStore } from '../store/filterStore';
import { useScenarioStore } from '../store/scenarioStore';
import { useTableStore } from '../store/tableStore';
import { KpiItem } from '../types';

export function useKpis() {
  const { productLevel, scope, apg, measure, timeGrain } = useViewStore();
  const { appliedFilters } = useFilterStore();
  const { activeScenario } = useScenarioStore();
  const { mode, draftEdits, savedEdits } = useTableStore();

  const scopeStr = scope.join(',') || undefined;
  const apgStr = apg.join(',') || undefined;

  const queryParams = {
    productLevel,
    scope: scopeStr,
    apg: apgStr,
    uom: measure,
    measure,
    timeGrain,
    from: appliedFilters.startDate,
    to: appliedFilters.endDate,
    scenarioId: activeScenario?.id,
    planningCycle: appliedFilters.planningCycle,
    activity: appliedFilters.activity,
  };

  const query = useQuery({
    queryKey: ['kpis', queryParams],
    queryFn: () => kpiService.getKpis(queryParams),
    staleTime: 1000 * 60 * 5,
  });

  const edits = mode === 'edit' ? draftEdits : savedEdits;
  const totalForecastDelta = Object.values(edits).reduce(
    (sum, val) => sum + (val.forecastMeasure ?? val.forecast ?? 0),
    0
  );
  const totalOpportunityDelta = Object.values(edits).reduce(
    (sum, val) => sum + (val.opportunityMeasure ?? val.opportunity ?? 0),
    0
  );
  const totalRiskDelta = Object.values(edits).reduce(
    (sum, val) => sum + (val.riskMeasure ?? val.risk ?? 0),
    0
  );

  const kpis: KpiItem[] = (query.data || []).map((item) => {
    if (item.key === 'total_forecast' && totalForecastDelta !== 0) {
      return { ...item, value: item.value + totalForecastDelta };
    }
    if (item.key === 'forecast_adj' && totalForecastDelta !== 0) {
      return { ...item, value: item.value + totalForecastDelta };
    }
    if (item.key === 'opportunity' && totalOpportunityDelta !== 0) {
      return { ...item, value: item.value + totalOpportunityDelta };
    }
    if (item.key === 'risk' && totalRiskDelta !== 0) {
      return { ...item, value: item.value + totalRiskDelta };
    }
    if (item.key === 'fy_growth_ro' || item.key === 'ytg_growth_ro') {
      const roDelta = totalOpportunityDelta + totalRiskDelta;
      if (roDelta !== 0 || totalForecastDelta !== 0) {
        const tf = query.data?.find((k) => k.key === 'total_forecast')?.value ?? 0;
        const opp = query.data?.find((k) => k.key === 'opportunity')?.value ?? 0;
        const rsk = query.data?.find((k) => k.key === 'risk')?.value ?? 0;
        const curr0 = tf + opp + rsk;
        if (curr0 > 0 && 1 + item.value / 100 > 0) {
          const prev = curr0 / (1 + item.value / 100);
          const newCurr = curr0 + totalForecastDelta + roDelta;
          const newGrowth = +(((newCurr - prev) / prev) * 100).toFixed(1);
          return {
            ...item,
            value: newGrowth,
            growthType: newGrowth >= 0 ? 'positive' : 'negative',
          };
        }
      }
    }
    return item;
  });

  return { ...query, data: kpis };
}
