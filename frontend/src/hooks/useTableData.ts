import { useQuery } from '@tanstack/react-query';
import { tableService } from '../services/tableService';
import { useHeaderStore } from '../store/headerStore';
import { useTableStore } from '../store/tableStore';
import { useFilterStore } from '../store/filterStore';

export function useTableData() {
  const { productLevel, parentBrand } = useHeaderStore();
  const { isDesegregated, desegregatedParent } = useTableStore();
  const { appliedFilters } = useFilterStore();

  const isProductView = productLevel === 'product' || isDesegregated;
  const parent = desegregatedParent || parentBrand;

  const query = useQuery({
    queryKey: ['table', isProductView ? 'product' : 'brand', parent, appliedFilters],
    queryFn: () => {
      if (isDesegregated) {
        return tableService.desegregate(parent);
      }
      return tableService.getTable({
        level: isProductView ? 'product' : 'brand',
        parent,
        filters: appliedFilters,
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  return query;
}

