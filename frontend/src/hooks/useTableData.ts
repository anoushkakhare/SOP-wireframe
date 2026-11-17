import { useQuery } from '@tanstack/react-query';
import { tableService } from '../services/tableService';
import { useViewStore } from '../store/viewStore';
import { useTableStore } from '../store/tableStore';

export function useTableData() {
  const { productLevel, scope, apg } = useViewStore();
  const { isDesegregated, desegregatedParent } = useTableStore();

  const scopeStr = scope.join(',') || undefined;
  const apgStr   = apg.join(',')   || undefined;

  const query = useQuery({
    queryKey: ['table', productLevel, scopeStr, apgStr, isDesegregated],
    queryFn: () => {
      if (isDesegregated) {
        return tableService.desegregate(desegregatedParent || scopeStr);
      }
      return tableService.getTable({ productLevel, scope: scopeStr, apg: apgStr });
    },
    staleTime: 1000 * 60 * 5,
  });

  return query;
}
