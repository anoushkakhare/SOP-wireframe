import { aggregate, getPeriodsForGrain, normalizeGrain } from '../utils/aggregate';
import masterData from '../data/masterData.json';
import { KpiItem, Uom } from '../types';

export class KpiRepository {
  async getKpis(params: {
    productLevel?: number;
    scope?: string;
    apg?: string;
    uom?: Uom;
    measure?: string;
    timeGrain?: string;
    from?: string;
    to?: string;
    scenarioId?: string;
    planningCycle?: string;
    activity?: string;
  }): Promise<KpiItem[]> {
    const meas = params.measure || params.uom || 'units';
    const normGrain = normalizeGrain(params.timeGrain);

    const groups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level: params.productLevel || 3,
      timeGrain: params.timeGrain,
      measure: meas,
      from: params.from,
      to: params.to,
      planningCycle: params.planningCycle,
      activity: params.activity,
    });

    let totalForecast = groups.reduce((s, g) => s + g.totalForecast, 0);
    let totalOpportunity = groups.reduce((s, g) => s + g.totalOpportunity, 0);
    let totalRisk = groups.reduce((s, g) => s + g.totalRisk, 0);
    let priorTotalForecast = groups.reduce((s, g) => s + g.priorTotalForecast, 0);
    let ytdForecast = groups.reduce((s, g) => s + g.ytdForecast, 0);
    let priorYtdForecast = groups.reduce((s, g) => s + g.priorYtdForecast, 0);
    let ytgForecast = groups.reduce((s, g) => s + g.ytgForecast, 0);
    let priorYtgForecast = groups.reduce((s, g) => s + g.priorYtgForecast, 0);

    let forecastAdjustment = Math.round(totalForecast * 0.023);

    // Scenario adjustment
    if (params.scenarioId === 'scen_1') {
      const delta = Math.round(totalForecast * 0.035);
      forecastAdjustment += delta;
      totalForecast += delta;
    } else if (params.scenarioId === 'scen_4') {
      const delta = Math.round(totalForecast * 0.045);
      forecastAdjustment -= delta;
      totalForecast -= delta;
    }

    // Baseline: MRF baseline sum for the range
    const mrfGroups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level: params.productLevel || 3,
      timeGrain: params.timeGrain,
      measure: meas,
      from: params.from,
      to: params.to,
      planningCycle: 'MRF',
      activity: params.activity,
    });
    const baseline = Math.round(mrfGroups.reduce((s, g) => s + g.totalForecast, 0));

    // Actuals: actual periods in range ("–" if none)
    const { activePeriods, allPeriods } = getPeriodsForGrain(params.timeGrain, params.from, params.to);
    const actualPeriods = activePeriods.filter(p => p.isActual);
    let totalActuals: number | null = null;
    if (actualPeriods.length > 0) {
      totalActuals = Math.round(
        groups.reduce((s, g) => {
          let sum = 0;
          for (const p of actualPeriods) {
            sum += (g.periodActuals[p.label] || 0);
          }
          return s + sum;
        }, 0)
      );
    }

    // Growth vs previous {period}
    // "Growth vs previous {period}" follows timeGrain: growth of the last full period in range vs the one before
    const grainLabelName = normGrain === 'half' ? 'half' : normGrain;
    const prevPeriodTitle = `Growth vs previous ${grainLabelName}`;

    let growthPrev = 0;
    let growthPrevRo = 0;
    if (activePeriods.length >= 2) {
      const currP = activePeriods[activePeriods.length - 1];
      const prevP = activePeriods[activePeriods.length - 2];
      const currVal = groups.reduce((s, g) => s + (g.periodForecast[currP.label] || 0), 0);
      const prevVal = groups.reduce((s, g) => s + (g.periodForecast[prevP.label] || 0), 0);
      const currOpp = groups.reduce((s, g) => s + (g.periodOpportunity[currP.label] || 0), 0);
      const currRisk = groups.reduce((s, g) => s + (g.periodRisk[currP.label] || 0), 0);

      if (prevVal > 0) {
        growthPrev = +(((currVal - prevVal) / prevVal) * 100).toFixed(1);
        growthPrevRo = +((((currVal + currOpp + currRisk) - prevVal) / prevVal) * 100).toFixed(1);
      }
    } else if (activePeriods.length === 1) {
      const currP = activePeriods[0];
      const currIdx = allPeriods.findIndex(p => p.label === currP.label);
      if (currIdx > 0) {
        const prevP = allPeriods[currIdx - 1];
        const prevGroups = aggregate({
          scope: params.scope,
          apg: params.apg,
          level: params.productLevel || 3,
          timeGrain: params.timeGrain,
          measure: meas,
          from: prevP.label,
          to: prevP.label,
          planningCycle: params.planningCycle,
          activity: params.activity,
        });
        const currVal = groups.reduce((s, g) => s + (g.periodForecast[currP.label] || 0), 0);
        const prevVal = prevGroups.reduce((s, g) => s + (g.periodForecast[prevP.label] || 0), 0);
        const currOpp = groups.reduce((s, g) => s + (g.periodOpportunity[currP.label] || 0), 0);
        const currRisk = groups.reduce((s, g) => s + (g.periodRisk[currP.label] || 0), 0);
        if (prevVal > 0) {
          growthPrev = +(((currVal - prevVal) / prevVal) * 100).toFixed(1);
          growthPrevRo = +((((currVal + currOpp + currRisk) - prevVal) / prevVal) * 100).toFixed(1);
        }
      }
    }

    // Dynamic YoY growth vs same period last year
    const calcGrowth = (curr: number, prev: number, fallback: number) => {
      if (prev > 0) {
        return +(((curr - prev) / prev) * 100).toFixed(1);
      }
      return fallback;
    };

    const growthFy = calcGrowth(totalForecast, priorTotalForecast, masterData.targets.growthFy);
    const growthYtd = calcGrowth(ytdForecast, priorYtdForecast, masterData.targets.growthYtd);
    const growthYtg = calcGrowth(ytgForecast, priorYtgForecast, masterData.targets.growthYtg);

    const growthFyRo = calcGrowth(
      totalForecast + totalOpportunity + totalRisk,
      priorTotalForecast,
      masterData.targets.growthFyRo
    );
    const growthYtgRo = calcGrowth(
      ytgForecast + totalOpportunity + totalRisk,
      priorYtgForecast,
      masterData.targets.growthYtgRo
    );

    const numFormat = meas === 'value' ? 'currency' : 'number';

    return [
      { key: 'total_forecast', label: 'Total forecast', value: totalForecast, format: numFormat, isNeutral: true },
      { key: 'baseline', label: 'Baseline', value: baseline, format: numFormat, isNeutral: true },
      { key: 'actuals', label: 'Actuals', value: totalActuals, format: numFormat, isNeutral: true },
      { key: 'forecast_adj', label: 'Forecast adjustment', value: forecastAdjustment, format: numFormat, growthType: forecastAdjustment >= 0 ? 'positive' : 'negative' },
      { key: 'opportunity', label: 'Opportunity', value: totalOpportunity, format: numFormat, growthType: 'positive' },
      { key: 'risk', label: 'Risk', value: totalRisk, format: numFormat, growthType: 'negative' },
      { key: 'growth_prev', label: prevPeriodTitle, value: growthPrev, format: 'percent', growthType: growthPrev >= 0 ? 'positive' : 'negative', roValue: growthPrevRo },
      { key: 'fy_growth', label: 'FY growth', value: growthFy, format: 'percent', growthType: growthFy >= 0 ? 'positive' : 'negative', roValue: growthFyRo },
      { key: 'ytd_growth', label: 'YTD growth', value: growthYtd, format: 'percent', growthType: growthYtd >= 0 ? 'positive' : 'negative' },
      { key: 'ytg_growth', label: 'YTG growth', value: growthYtg, format: 'percent', growthType: growthYtg >= 0 ? 'positive' : 'negative', roValue: growthYtgRo },
    ];
  }
}

export const kpiRepository = new KpiRepository();
