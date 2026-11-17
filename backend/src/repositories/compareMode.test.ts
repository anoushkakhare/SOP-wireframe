import { chartRepository } from './chartRepository';
import { kpiRepository } from './kpiRepository';
import { tableRepository } from './tableRepository';

async function testCompareMode() {
  console.log('--- Testing Backend Compare Mode ---');

  // 1. KPI Repository with compareTo
  console.log('Testing KPI Repository compare...');
  const kpis = await kpiRepository.getKpis({ compareTo: 'MRF', planningCycle: 'Current cycle' });
  for (const kpi of kpis) {
    if (kpi.compareValue != null && kpi.value != null && kpi.delta != null) {
      const diff = Math.round((kpi.compareValue - kpi.value) * 100) / 100;
      const expectedDelta = Math.round(kpi.delta * 100) / 100;
      if (Math.abs(diff - expectedDelta) > 0.01) {
        throw new Error(`KPI ${kpi.key} delta mismatch: B - A = ${diff}, reported delta = ${kpi.delta}`);
      }
    }
  }
  console.log('✓ KPI reconcile: compareValue - value === delta');

  // 2. Line Chart with compareTo
  console.log('Testing Line Chart compare...');
  const line = await chartRepository.getForecastLine({ compareTo: 'MRF', planningCycle: 'Current cycle' });
  if (!line.compareTo || line.points.length === 0) {
    throw new Error('Line chart missing compareTo or points');
  }
  for (const pt of line.points) {
    if (pt.seriesA != null && pt.seriesB != null && pt.delta != null) {
      if (pt.seriesB - pt.seriesA !== pt.delta) {
        throw new Error(`Line point ${pt.time} reconciliation failure: B - A != delta`);
      }
    }
  }
  console.log('✓ Line chart reconcile: seriesB - seriesA === delta');

  // 2b. Line Chart with Actuals compareTo
  const lineActuals = await chartRepository.getForecastLine({ compareTo: 'Actuals', planningCycle: 'Current cycle' });
  const pastPts = lineActuals.points.filter(p => p.seriesB != null);
  if (pastPts.length === 0) {
    throw new Error('Actuals compare should return past points for seriesB');
  }
  console.log(`✓ Line chart Actuals compare returned ${pastPts.length} past points with valid B`);

  // 3. Stacked Bar Chart with compareTo
  console.log('Testing Bar Chart compare...');
  const bar = await chartRepository.getStackedBar({ compareTo: 'MRF', planningCycle: 'Current cycle' });
  if (bar.items.length === 0) throw new Error('No bar items');
  for (const item of bar.items) {
    if (item.seriesA != null && item.seriesB != null && item.delta != null) {
      if (item.seriesB - item.seriesA !== item.delta) {
        throw new Error(`Bar item ${item.category} reconciliation failure: B - A != delta`);
      }
    }
    if (!item.segmentsA || !item.segmentsB) {
      throw new Error(`Bar item ${item.category} missing segmentsA or segmentsB for APG tooltip`);
    }
  }
  console.log('✓ Bar chart reconcile: seriesB - seriesA === delta, segmentsA & segmentsB present');

  // 4. Waterfall Chart with compareTo (Movement bridge)
  console.log('Testing Waterfall Chart compare (Movement bridge)...');
  const wfCompare = await chartRepository.getWaterfall({ compareTo: 'MRF', planningCycle: 'Current cycle' });
  if (wfCompare.steps.length !== 5) {
    throw new Error(`Expected 5 waterfall steps in compare mode movement bridge, got ${wfCompare.steps.length}`);
  }
  const [stepA, stepBase, stepDrivers, stepManual, stepB] = wfCompare.steps;
  if (!stepA.name.includes('Forecast') || !stepB.name.includes('Forecast')) {
    throw new Error('Waterfall bridge must start with Forecast A and end with Forecast B');
  }
  // Check top drivers
  for (const item of wfCompare.steps) {
    if (!item.topDrivers || item.topDrivers.length === 0) {
      throw new Error(`Waterfall step ${item.name} missing topDrivers`);
    }
  }
  // Check reconciliation: A + baseChange + driverChange + manualChange == B
  const sum = stepA.value + stepBase.value + stepDrivers.value + stepManual.value;
  if (Math.round(sum) !== Math.round(stepB.value)) {
    throw new Error(`Waterfall bridge reconciliation failure: A + changes (${sum}) !== B (${stepB.value})`);
  }
  console.log(`✓ Waterfall movement bridge reconciles: ${stepA.value} + ${stepBase.value} + ${stepDrivers.value} + ${stepManual.value} = ${stepB.value}`);

  // 4b. Waterfall Chart normal mode top drivers
  console.log('Testing Waterfall Chart normal mode top drivers...');
  const wfNormal = await chartRepository.getWaterfall({ planningCycle: 'Current cycle' });
  for (const item of wfNormal.steps) {
    if (!item.topDrivers || item.topDrivers.length === 0) {
      throw new Error(`Normal waterfall step ${item.name} missing topDrivers`);
    }
  }
  console.log('✓ Normal waterfall steps have topDrivers for planners');

  // 5. Treemap Chart with compareTo
  console.log('Testing Treemap compare...');
  const tm = await chartRepository.getTreemap({ compareTo: 'MRF', planningCycle: 'Current cycle' });
  for (const node of tm.data) {
    if (node.valueA != null && node.valueB != null && node.delta != null) {
      if (node.valueB - node.valueA !== node.delta) {
        throw new Error(`Treemap node ${node.name} reconciliation failure: B - A != delta`);
      }
      if (node.value !== node.valueB) {
        throw new Error(`Treemap node ${node.name} size must be valueB`);
      }
      if (node.pctChange === undefined) {
        throw new Error(`Treemap node ${node.name} missing pctChange`);
      }
    }
  }
  console.log('✓ Treemap reconcile: size = valueB, delta = valueB - valueA, pctChange is calculated');

  // 6. Table Repository with compareTo
  console.log('Testing Table compare...');
  const tbl = await tableRepository.getTable({ compareTo: 'MRF', planningCycle: 'Current cycle' });
  if (tbl.rows.length === 0) throw new Error('Table has no rows');
  for (const row of tbl.rows) {
    if (!row.definitionsB) {
      throw new Error(`Row ${row.id} missing definitionsB`);
    }
    if (!row.pastActualsB) {
      throw new Error(`Row ${row.id} missing pastActualsB`);
    }
  }
  console.log('✓ Table rows have definitionsB and pastActualsB populated');

  console.log('All compare mode backend tests passed successfully!');
}

testCompareMode().catch(err => {
  console.error(err);
  process.exit(1);
});
