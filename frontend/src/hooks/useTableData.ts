import { useQuery } from '@tanstack/react-query';
import { tableService } from '../services/tableService';
import { useViewStore } from '../store/viewStore';
import { useFilterStore } from '../store/filterStore';
import { useTableStore } from '../store/tableStore';

export function useTableData() {
  const { productLevel, scope, apg, measure, timeGrain, compare } = useViewStore();
  const { appliedFilters } = useFilterStore();
  const { isDesegregated, desegregatedParent } = useTableStore();

  const scopeStr = scope.join(',') || undefined;
  const apgStr = apg.join(',') || undefined;
  const from = appliedFilters.startDate;
  const to = appliedFilters.endDate;
  const compareTo = compare.on && compare.b ? compare.b : undefined;

  const params = {
    productLevel,
    scope: scopeStr,
    apg: apgStr,
    timeGrain,
    measure,
    from,
    to,
    planningCycle: appliedFilters.planningCycle,
    compareTo,
    activity: appliedFilters.activity,
  };

  const query = useQuery({
    queryKey: ['table', productLevel, scopeStr, apgStr, timeGrain, measure, from, to, isDesegregated, appliedFilters.planningCycle, compareTo, appliedFilters.activity],
    queryFn: () => {
      if (isDesegregated) {
        return tableService.desegregate(desegregatedParent || scopeStr, params);
      }
      return tableService.getTable(params);
    },
    staleTime: 1000 * 60 * 5,
  });

  return query;
}
