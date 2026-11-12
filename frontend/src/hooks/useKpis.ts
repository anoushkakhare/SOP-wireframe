import { useQuery } from '@tanstack/react-query';
import { kpiService } from '../services/kpiService';
import { useHeaderStore } from '../store/headerStore';
import { useFilterStore } from '../store/filterStore';
import { useScenarioStore } from '../store/scenarioStore';
import { useTableStore } from '../store/tableStore';
import { KpiItem } from '../types';

export function useKpis() {
  const { productLevel, parentBrand, customerLevel, uom } = useHeaderStore();
  const { appliedFilters } = useFilterStore();
  const { activeScenario } = useScenarioStore();
  const { savedEdits } = useTableStore();

  const queryParams = {
    productLevel,
    parent: parentBrand,
    customerLevel,
    uom,
    scenarioId: activeScenario?.id,
    startDate: appliedFilters.startDate,
    endDate: appliedFilters.endDate,
    categories: appliedFilters.categories.join(','),
    brands: appliedFilters.brands.join(','),
    products: appliedFilters.products.join(','),
  };

  const query = useQuery({
    queryKey: ['kpis', queryParams],
    queryFn: () => kpiService.getKpis(queryParams),
    staleTime: 1000 * 60 * 5,
  });

  // Recompute with client manual saved edits if any
  const totalEditsDelta = Object.values(savedEdits).reduce((sum, val) => sum + val, 0);

  const kpis: KpiItem[] = (query.data || []).map((item) => {
    if (totalEditsDelta !== 0) {
      if (item.key === 'total_forecast') {
        return { ...item, value: item.value + totalEditsDelta };
      }
      if (item.key === 'forecast_adj') {
        return { ...item, value: item.value + totalEditsDelta };
      }
    }
    return item;
  });

  return {
    ...query,
    data: kpis,
  };
}

