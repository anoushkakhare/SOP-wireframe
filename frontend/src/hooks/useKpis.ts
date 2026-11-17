import { useQuery } from '@tanstack/react-query';
import { kpiService } from '../services/kpiService';
import { useViewStore } from '../store/viewStore';
import { useScenarioStore } from '../store/scenarioStore';
import { useTableStore } from '../store/tableStore';
import { KpiItem } from '../types';

export function useKpis() {
  const { productLevel, scope, apg, measure } = useViewStore();
  const { activeScenario } = useScenarioStore();
  const { savedEdits } = useTableStore();

  const scopeStr = scope.join(',') || undefined;
  const apgStr   = apg.join(',')   || undefined;

  const queryParams = {
    productLevel,
    scope: scopeStr,
    apg: apgStr,
    uom: measure,
    scenarioId: activeScenario?.id,
  };

  const query = useQuery({
    queryKey: ['kpis', queryParams],
    queryFn: () => kpiService.getKpis(queryParams),
    staleTime: 1000 * 60 * 5,
  });

  const totalEditsDelta = Object.values(savedEdits).reduce((sum, val) => sum + val, 0);

  const kpis: KpiItem[] = (query.data || []).map((item) => {
    if (totalEditsDelta !== 0) {
      if (item.key === 'total_forecast') return { ...item, value: item.value + totalEditsDelta };
      if (item.key === 'forecast_adj')   return { ...item, value: item.value + totalEditsDelta };
    }
    return item;
  });

  return { ...query, data: kpis };
}
