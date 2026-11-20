import { useQuery } from '@tanstack/react-query';
import { kpiService } from '../services/kpiService';
import { useViewStore } from '../store/viewStore';
import { useFilterStore } from '../store/filterStore';
import { useScenarioStore } from '../store/scenarioStore';
import { useTableStore } from '../store/tableStore';
import { KpiItem } from '../types';
import { toMeasureUnits, editMatchesFilters } from '../utils/editsOverlay';
import { labels } from '../constants/labels';

export function useKpis() {
  const { productLevel, scope, apg, measure, timeGrain, compare } = useViewStore();
  const { appliedFilters } = useFilterStore();
  const { activeScenario } = useScenarioStore();
  const { draftEdits, savedEdits } = useTableStore();

  const scopeStr = scope.join(',') || undefined;
  const apgStr = apg.join(',') || undefined;
  const compareTo = compare.on && compare.b ? compare.b : undefined;

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
    compareTo,
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

  const rawKpis: KpiItem[] = (query.data || []).map((item) => {
    if (item.key === 'total_forecast' && totalForecastDelta !== 0 && item.value !== null) {
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

  // Filter out forecast_adj and merge opportunity & risk into ONE card
  const filteredKpis = rawKpis.filter((item) => item.key !== 'forecast_adj');
  const oppItem = filteredKpis.find((k) => k.key === 'opportunity');
  const riskItem = filteredKpis.find((k) => k.key === 'risk');

  let kpis: KpiItem[];
  if (oppItem && riskItem) {
    const oppRiskCard: KpiItem = {
      key: 'opportunity_risk',
      label: labels.kpi.opportunityRisk,
      value: null,
      opportunityValue: oppItem.value ?? 0,
      riskValue: riskItem.value ?? 0,
      opportunityDelta: oppItem.delta,
      riskDelta: riskItem.delta,
      opportunityCompareValue: oppItem.compareValue,
      riskCompareValue: riskItem.compareValue,
      opportunityPctChange: oppItem.pctChange,
      riskPctChange: riskItem.pctChange,
      compareTo: oppItem.compareTo || riskItem.compareTo,
      format: oppItem.format || 'number',
    };
    const result: KpiItem[] = [];
    let inserted = false;
    for (const item of filteredKpis) {
      if (item.key === 'opportunity' || item.key === 'risk') {
        if (!inserted) {
          result.push(oppRiskCard);
          inserted = true;
        }
      } else {
        result.push(item);
      }
    }
    kpis = result;
  } else {
    kpis = filteredKpis;
  }

  return { ...query, data: kpis };
}
