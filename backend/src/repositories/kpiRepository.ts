import { aggregate } from '../utils/aggregate';
import masterData from '../data/masterData.json';
import { KpiItem, DataQueryParams, Uom } from '../types';

export class KpiRepository {
  async getKpis(params: {
    productLevel?: number;
    scope?: string;
    apg?: string;
    uom?: Uom;
    scenarioId?: string;
    from?: string;
    to?: string;
  }): Promise<KpiItem[]> {
    const groups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level: params.productLevel || 3,
    });

    let totalForecast    = groups.reduce((s, g) => s + g.totalForecast, 0);
    let totalOpportunity = groups.reduce((s, g) => s + g.totalOpportunity, 0);
    let totalRisk        = groups.reduce((s, g) => s + g.totalRisk, 0);

    let forecastAdjustment = masterData.targets.forecastAdjustment;
    let growthFy  = masterData.targets.growthFy;
    let growthYtd = masterData.targets.growthYtd;
    let growthYtg = masterData.targets.growthYtg;
    let growthFyRo  = masterData.targets.growthFyRo;
    let growthYtgRo = masterData.targets.growthYtgRo;

    // UoM scaling
    let multiplier = 1.0;
    if (params.uom === 'volume')  multiplier = 1.25;
    else if (params.uom === 'revenue') multiplier = 4.5;

    // Scenario adjustment
    if (params.scenarioId === 'scen_1') {
      forecastAdjustment += 65000; totalForecast += 65000;
      growthFy = +(growthFy + 1.2).toFixed(1);
    } else if (params.scenarioId === 'scen_4') {
      forecastAdjustment -= 80000; totalForecast -= 80000;
      growthFy  = +(growthFy  - 1.5).toFixed(1);
      growthYtg = +(growthYtg - 2.1).toFixed(1);
    }

    totalForecast       = Math.round(totalForecast       * multiplier);
    forecastAdjustment  = Math.round(forecastAdjustment  * multiplier);
    totalOpportunity    = Math.round(totalOpportunity    * multiplier);
    totalRisk           = Math.round(totalRisk           * multiplier);

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
