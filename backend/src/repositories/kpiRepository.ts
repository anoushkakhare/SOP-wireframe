import masterData from '../data/masterData.json';
import { KpiItem, ProductLevel, CustomerLevel, Uom } from '../types';

export class KpiRepository {
  async getKpis(params: {
    productLevel?: ProductLevel;
    customerLevel?: CustomerLevel;
    uom?: Uom;
    parent?: string;
    scenarioId?: string;
  }): Promise<KpiItem[]> {
    let items = masterData.items as any[];

    if (params.parent) {
      items = items.filter((it) => it.brand === params.parent);
    }

    // Calculate totals directly from master data items
    let totalForecast = 0;
    let totalOpportunity = 0;
    let totalRisk = 0;

    items.forEach((it) => {
      masterData.months.forEach((m: string, idx: number) => {
        if (idx < masterData.currentMonthIndex) {
          totalForecast += it.pastActuals[m] || 0;
        } else {
          totalForecast += it.definitions.actualFcst[m] || 0;
          totalOpportunity += it.definitions.opportunity[m] || 0;
          totalRisk += it.definitions.risk[m] || 0;
        }
      });
    });

    let forecastAdjustment = masterData.targets.forecastAdjustment;
    let growthFy = masterData.targets.growthFy;
    let growthYtd = masterData.targets.growthYtd;
    let growthYtg = masterData.targets.growthYtg;
    let growthFyRo = masterData.targets.growthFyRo;
    let growthYtgRo = masterData.targets.growthYtgRo;

    // Unit of measure scaling
    let multiplier = 1.0;
    if (params.uom === 'volume') multiplier = 1.25;
    else if (params.uom === 'revenue') multiplier = 4.5;

    // Scenario adjustment
    if (params.scenarioId === 'scen_1') {
      // Festive Season Upside
      forecastAdjustment += 65000;
      totalForecast += 65000;
      growthFy = +(growthFy + 1.2).toFixed(1);
    } else if (params.scenarioId === 'scen_4') {
      // Raw Material Delay Risk
      forecastAdjustment -= 80000;
      totalForecast -= 80000;
      growthFy = +(growthFy - 1.5).toFixed(1);
      growthYtg = +(growthYtg - 2.1).toFixed(1);
    }

    totalForecast = Math.round(totalForecast * multiplier);
    forecastAdjustment = Math.round(forecastAdjustment * multiplier);
    totalOpportunity = Math.round(totalOpportunity * multiplier);
    totalRisk = Math.round(totalRisk * multiplier);

    return [
      {
        key: 'total_forecast',
        label: 'Total forecast',
        value: totalForecast,
        format: 'number',
        isNeutral: true,
      },
      {
        key: 'forecast_adj',
        label: 'Forecast adjustment',
        value: forecastAdjustment,
        format: 'number',
        growthType: 'positive',
      },
      {
        key: 'risk',
        label: 'Risk',
        value: totalRisk,
        format: 'number',
        growthType: 'negative',
      },
      {
        key: 'opportunity',
        label: 'Opportunity',
        value: totalOpportunity,
        format: 'number',
        growthType: 'positive',
      },
      {
        key: 'growth_fy',
        label: 'FY growth',
        value: growthFy,
        format: 'percent',
        growthType: 'positive',
      },
      {
        key: 'growth_ytd',
        label: 'YTD growth',
        value: growthYtd,
        format: 'percent',
        growthType: 'positive',
      },
      {
        key: 'growth_ytg',
        label: 'YTG growth',
        value: growthYtg,
        format: 'percent',
        growthType: 'negative',
      },
      {
        key: 'growth_fy_ro',
        label: 'FY growth (R&O)',
        value: growthFyRo,
        format: 'percent',
        growthType: 'positive',
      },
      {
        key: 'growth_ytg_ro',
        label: 'YTG growth (R&O)',
        value: growthYtgRo,
        format: 'percent',
        growthType: 'negative',
      },
    ];
  }
}

export const kpiRepository = new KpiRepository();
