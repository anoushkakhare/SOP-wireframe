import { useQuery } from '@tanstack/react-query';
import { chartService } from '../services/chartService';
import { useViewStore } from '../store/viewStore';
import { useFilterStore } from '../store/filterStore';
import { useTableStore } from '../store/tableStore';
import {
  toMeasureUnits,
  editMatchesFilters,
  periodMatchesGrain,
  matchNodeAtLevel,
} from '../utils/editsOverlay';

export function useChartData() {
  const { productLevel, scope, apg, measure, timeGrain } = useViewStore();
  const { appliedFilters } = useFilterStore();
  const { draftEdits, savedEdits } = useTableStore();

  const edits = Object.keys(draftEdits).length > 0 ? draftEdits : savedEdits;

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

  // Calculate total forecast delta in current scope/apg
  let totalForecastDelta = 0;
  const activeEditsList = Object.values(edits).filter((e) =>
    editMatchesFilters(e, scope, apg)
  );

  for (const edit of activeEditsList) {
    if (edit.forecast) {
      totalForecastDelta += toMeasureUnits(
        edit.forecast,
        measure,
        edit.unitsPerCase,
        edit.price
      );
    }
  }

  // 1. Forecast Line overlay
  const forecastLineData = forecastLineQuery.data
    ? {
        points: forecastLineQuery.data.points.map((p) => {
          let periodFcst = 0;
          let periodOpp = 0;
          let periodRisk = 0;

          for (const edit of activeEditsList) {
            if (periodMatchesGrain(edit.period, p.time)) {
              const upc = edit.unitsPerCase || 12;
              const price = edit.price || 100;
              if (edit.forecast) {
                periodFcst += toMeasureUnits(edit.forecast, measure, upc, price);
              }
              if (edit.opportunity) {
                periodOpp += toMeasureUnits(edit.opportunity, measure, upc, price);
              }
              if (edit.risk) {
                periodRisk += toMeasureUnits(edit.risk, measure, upc, price);
              }
            }
          }

          const forecast = p.forecast + periodFcst;
          const bestCase = p.bestCase + periodFcst + periodOpp;
          const worstCase = p.worstCase + periodFcst + periodRisk;

          return {
            ...p,
            forecast,
            bestCase,
            worstCase,
          };
        }),
      }
    : undefined;

  // 2. Waterfall overlay
  const waterfallData = waterfallQuery.data
    ? {
        steps: waterfallQuery.data.steps.map((s) => {
          if (s.name === 'Final forecast' && totalForecastDelta !== 0) {
            return { ...s, value: s.value + totalForecastDelta };
          }
          return s;
        }),
      }
    : undefined;

  // 3. Stacked Bar overlay
  const stackedBarData = stackedBarQuery.data
    ? {
        ...stackedBarQuery.data,
        items: stackedBarQuery.data.items.map((item) => {
          let barFcstDelta = 0;
          const segmentDeltas: Record<string, number> = {};

          for (const edit of activeEditsList) {
            if (
              matchNodeAtLevel(
                edit,
                productLevel,
                item.category,
                item.id
              )
            ) {
              if (edit.forecast) {
                const delta = toMeasureUnits(
                  edit.forecast,
                  measure,
                  edit.unitsPerCase,
                  edit.price
                );
                barFcstDelta += delta;
                const segKey = edit.apg || 'Modern trade';
                segmentDeltas[segKey] = (segmentDeltas[segKey] || 0) + delta;
              }
            }
          }

          if (barFcstDelta === 0) return item;

          const updatedSegments = { ...item.segments };
          for (const [k, v] of Object.entries(segmentDeltas)) {
            // Find case-insensitive match in segments
            const matchedKey =
              Object.keys(updatedSegments).find(
                (sk) => sk.toLowerCase() === k.toLowerCase()
              ) || k;
            updatedSegments[matchedKey] = (updatedSegments[matchedKey] || 0) + v;
          }

          return {
            ...item,
            total: item.total + barFcstDelta,
            segments: updatedSegments,
          };
        }),
      }
    : undefined;

  // 4. Treemap overlay
  const treemapData = treemapQuery.data
    ? {
        ...treemapQuery.data,
        data: treemapQuery.data.data.map((node) => {
          if (node.children && node.children.length > 0) {
            let nodeTotalDelta = 0;
            const updatedChildren = node.children.map((child) => {
              let childFcstDelta = 0;
              for (const edit of activeEditsList) {
                if (
                  matchNodeAtLevel(
                    edit,
                    productLevel,
                    child.name,
                    child.id
                  )
                ) {
                  if (edit.forecast) {
                    childFcstDelta += toMeasureUnits(
                      edit.forecast,
                      measure,
                      edit.unitsPerCase,
                      edit.price
                    );
                  }
                }
              }
              nodeTotalDelta += childFcstDelta;
              return {
                ...child,
                value: (child.value || 0) + childFcstDelta,
              };
            });
            return {
              ...node,
              value: (node.value || 0) + nodeTotalDelta,
              children: updatedChildren,
            };
          } else {
            let nodeFcstDelta = 0;
            for (const edit of activeEditsList) {
              if (
                matchNodeAtLevel(
                  edit,
                  productLevel,
                  node.name,
                  node.id
                )
              ) {
                if (edit.forecast) {
                  nodeFcstDelta += toMeasureUnits(
                    edit.forecast,
                    measure,
                    edit.unitsPerCase,
                    edit.price
                  );
                }
              }
            }
            return {
              ...node,
              value: (node.value || 0) + nodeFcstDelta,
            };
          }
        }),
      }
    : undefined;

  return {
    forecastLine: { ...forecastLineQuery, data: forecastLineData },
    stackedBar: { ...stackedBarQuery, data: stackedBarData },
    waterfall: { ...waterfallQuery, data: waterfallData },
    treemap: { ...treemapQuery, data: treemapData },
    isLoading:
      forecastLineQuery.isLoading ||
      stackedBarQuery.isLoading ||
      waterfallQuery.isLoading ||
      treemapQuery.isLoading,
  };
}
