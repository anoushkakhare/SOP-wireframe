import { useQuery } from '@tanstack/react-query';
import { kpiService } from '../services/kpiService';
import { useViewStore } from '../store/viewStore';
import { useFilterStore } from '../store/filterStore';
import { useScenarioStore } from '../store/scenarioStore';
import { useTableStore } from '../store/tableStore';
import { KpiItem } from '../types';
import { toMeasureUnits, editMatchesFilters } from '../utils/editsOverlay';

export function useKpis() {
  const { productLevel, scope, apg, measure, timeGrain } = useViewStore();
  const { appliedFilters } = useFilterStore();
  const { activeScenario } = useScenarioStore();
  const { draftEdits, savedEdits } = useTableStore();

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

  const edits = Object.keys(draftEdits).length > 0 ? draftEdits : savedEdits;
  let totalForecastDelta = 0;
  let totalOpportunityDelta = 0;
  let totalRiskDelta = 0;

  for (const edit of Object.values(edits)) {
    if (editMatchesFilters(edit, scope, apg)) {
      const upc = edit.unitsPerCase || 12;
      const price = edit.price || 100;
      if (edit.forecast) {
        totalForecastDelta += toMeasureUnits(edit.forecast, measure, upc, price);
      }
      if (edit.opportunity) {
        totalOpportunityDelta += toMeasureUnits(edit.opportunity, measure, upc, price);
      }
      if (edit.risk) {
        totalRiskDelta += toMeasureUnits(edit.risk, measure, upc, price);
      }
    }
  }

  const kpis: KpiItem[] = (query.data || []).map((item) => {
    if (item.key === 'total_forecast' && totalForecastDelta !== 0 && item.value !== null) {
      return { ...item, value: item.value + totalForecastDelta };
    }
    if (item.key === 'forecast_adj' && totalForecastDelta !== 0 && item.value !== null) {
      return { ...item, value: item.value + totalForecastDelta };
    }
    if (item.key === 'opportunity' && totalOpportunityDelta !== 0 && item.value !== null) {
      return { ...item, value: item.value + totalOpportunityDelta };
    }
    if (item.key === 'risk' && totalRiskDelta !== 0 && item.value !== null) {
      return { ...item, value: item.value + totalRiskDelta };
    }
    if (item.key === 'fy_growth' || item.key === 'ytg_growth' || item.key === 'growth_prev') {
      const roDelta = totalOpportunityDelta + totalRiskDelta;
      if (item.value !== null && (roDelta !== 0 || totalForecastDelta !== 0)) {
        const updated = { ...item };
        if (item.roValue !== undefined && item.roValue !== null) {
          const tf = query.data?.find((k) => k.key === 'total_forecast')?.value ?? 0;
          const opp = query.data?.find((k) => k.key === 'opportunity')?.value ?? 0;
          const rsk = query.data?.find((k) => k.key === 'risk')?.value ?? 0;
          const curr0 = tf + opp + rsk;
          if (curr0 > 0 && 1 + item.roValue / 100 > 0) {
            const prev = curr0 / (1 + item.roValue / 100);
            const newCurr = curr0 + totalForecastDelta + roDelta;
            const newGrowth = +(((newCurr - prev) / prev) * 100).toFixed(1);
            updated.roValue = newGrowth;
          }
        }
        if (totalForecastDelta !== 0) {
          const tf = query.data?.find((k) => k.key === 'total_forecast')?.value ?? 0;
          if (tf > 0 && 1 + item.value / 100 > 0) {
            const prev = tf / (1 + item.value / 100);
            const newCurr = tf + totalForecastDelta;
            const newGrowth = +(((newCurr - prev) / prev) * 100).toFixed(1);
            updated.value = newGrowth;
            updated.growthType = newGrowth >= 0 ? 'positive' : 'negative';
          }
        }
        return updated;
      }
    }
    return item;
  });

  return { ...query, data: kpis };
}
