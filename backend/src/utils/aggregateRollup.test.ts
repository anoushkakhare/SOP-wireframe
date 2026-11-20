import assert from 'node:assert';
import { aggregate } from './aggregate';

async function testTotalsMatchAcrossGrains() {
  console.log('Testing totals match across grains under day-based allocation...');

  // Year grain
  const yearGroups = aggregate({ timeGrain: 'year', from: 'FY26', to: 'FY26', level: 1 });
  const yearTotal = yearGroups.reduce((sum, g) => sum + g.totalForecast, 0);

  // Half grain
  const halfGroups = aggregate({ timeGrain: 'half', from: 'H1 26', to: 'H2 26', level: 1 });
  const halfTotal = halfGroups.reduce((sum, g) => sum + g.totalForecast, 0);

  // Quarter grain
  const quarterGroups = aggregate({ timeGrain: 'quarter', from: 'Q1 26', to: 'Q4 26', level: 1 });
  const quarterTotal = quarterGroups.reduce((sum, g) => sum + g.totalForecast, 0);

  // Month grain
  const monthGroups = aggregate({ timeGrain: 'month', from: 'Jan 26', to: 'Dec 26', level: 1 });
  const monthTotal = monthGroups.reduce((sum, g) => sum + g.totalForecast, 0);

  console.log(`Year Total:    ${yearTotal}`);
  console.log(`Half Total:    ${halfTotal}`);
  console.log(`Quarter Total: ${quarterTotal}`);
  console.log(`Month Total:   ${monthTotal}`);

  // Assert exact match across all full-year grains
  assert.strictEqual(halfTotal, yearTotal, `Half total (${halfTotal}) must equal Year total (${yearTotal})`);
  assert.strictEqual(quarterTotal, yearTotal, `Quarter total (${quarterTotal}) must equal Year total (${yearTotal})`);
  assert.strictEqual(monthTotal, yearTotal, `Month total (${monthTotal}) must equal Year total (${yearTotal})`);

  // Verify group-level exact match across grains
  for (const yg of yearGroups) {
    const hg = halfGroups.find(g => g.id === yg.id);
    const qg = quarterGroups.find(g => g.id === yg.id);
    const mg = monthGroups.find(g => g.id === yg.id);

    assert.ok(hg && qg && mg, `Group ${yg.name} must exist in all grains`);
    assert.strictEqual(hg.totalForecast, yg.totalForecast, `Group ${yg.name} Half total must match Year total`);
    assert.strictEqual(qg.totalForecast, yg.totalForecast, `Group ${yg.name} Quarter total must match Year total`);
    assert.strictEqual(mg.totalForecast, yg.totalForecast, `Group ${yg.name} Month total must match Year total`);
  }

  console.log('✓ All grains have equal totals at both global and group levels!');
}

testTotalsMatchAcrossGrains().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

