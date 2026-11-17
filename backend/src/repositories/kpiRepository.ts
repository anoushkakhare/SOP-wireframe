import { aggregate } from '../utils/aggregate';
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
  }): Promise<KpiItem[]> {
    const meas = params.measure || params.uom || 'units';

    const groups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level: params.productLevel || 3,
      timeGrain: params.timeGrain,
      measure: meas,
      from: params.from,
      to: params.to,
    });

    let totalForecast      = groups.reduce((s, g) => s + g.totalForecast, 0);
    let totalOpportunity   = groups.reduce((s, g) => s + g.totalOpportunity, 0);
    let totalRisk          = groups.reduce((s, g) => s + g.totalRisk, 0);
    let priorTotalForecast = groups.reduce((s, g) => s + g.priorTotalForecast, 0);
    let ytdForecast        = groups.reduce((s, g) => s + g.ytdForecast, 0);
    let priorYtdForecast   = groups.reduce((s, g) => s + g.priorYtdForecast, 0);
    let ytgForecast        = groups.reduce((s, g) => s + g.ytgForecast, 0);
    let priorYtgForecast   = groups.reduce((s, g) => s + g.priorYtgForecast, 0);

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

    return [
      { key: 'total_forecast', label: 'Total forecast',      value: totalForecast,      format: 'number',  isNeutral: true },
      { key: 'forecast_adj',   label: 'Forecast adjustment', value: forecastAdjustment, format: 'number',  growthType: 'positive' },
      { key: 'risk',           label: 'Risk',                value: totalRisk,          format: 'number',  growthType: 'negative' },
      { key: 'opportunity',    label: 'Opportunity',         value: totalOpportunity,   format: 'number',  growthType: 'positive' },
      { key: 'fy_growth',      label: 'FY growth',           value: growthFy,           format: 'percent', growthType: growthFy >= 0 ? 'positive' : 'negative' },
      { key: 'ytd_growth',     label: 'YTD growth',          value: growthYtd,          format: 'percent', growthType: growthYtd >= 0 ? 'positive' : 'negative' },
      { key: 'ytg_growth',     label: 'YTG growth',          value: growthYtg,          format: 'percent', growthType: growthYtg >= 0 ? 'positive' : 'negative' },
      { key: 'fy_growth_ro',   label: 'FY growth (R&O)',     value: growthFyRo,         format: 'percent', growthType: growthFyRo >= 0 ? 'positive' : 'negative' },
      { key: 'ytg_growth_ro',  label: 'YTG growth (R&O)',    value: growthYtgRo,        format: 'percent', growthType: growthYtgRo >= 0 ? 'positive' : 'negative' },
    ];
  }
}

export const kpiRepository = new KpiRepository();
