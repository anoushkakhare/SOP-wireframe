#!/usr/bin/env node
/**
 * smoke.mjs – End-to-end smoke test for the S&OP API.
 * Usage: node scripts/smoke.mjs
 * Exit 1 on any failure.
 */

const BASE = process.env.API_URL || 'http://localhost:5001/api';
const CREDENTIALS = { username: 'amy.chen', password: 'password123' };

let token = '';
let failures = 0;

function fail(msg) {
  console.error(`  ✗ FAIL: ${msg}`);
  failures++;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json };
}

async function main() {
  console.log('\n── Smoke Test ──────────────────────────────');
  console.log(`   API: ${BASE}\n`);

  // 1. Health
  console.log('1. GET /health');
  const health = await request('GET', '/health');
  if (health.status === 200 && health.json?.status === 'ok') ok(`health: ${health.json.status}`);
  else fail(`health returned ${health.status}`);

  // 2. Login
  console.log('2. POST /auth/login');
  const login = await request('POST', '/auth/login', CREDENTIALS);
  if (login.status === 200 && login.json?.token) {
    token = login.json.token;
    ok(`login: got token for ${login.json.user?.name || CREDENTIALS.username}`);
  } else {
    fail(`login returned ${login.status} – ${JSON.stringify(login.json)}`);
    process.exit(1); // cannot continue without token
  }

  // 3. KPIs
  console.log('3. GET /kpis');
  const kpis = await request('GET', '/kpis');
  if (kpis.status !== 200) { fail(`kpis returned ${kpis.status}`); }
  else {
    const items = kpis.json?.kpis ?? kpis.json ?? [];
    if (!Array.isArray(items) || items.length === 0) fail('kpis: empty array');
    else ok(`kpis: ${items.length} items`);
  }

  // 4. Charts
  const chartEndpoints = [
    ['/charts/forecast-line', 'points'],
    ['/charts/stacked-bar', 'items'],
    ['/charts/waterfall', 'steps'],
    ['/charts/treemap', 'data'],
  ];
  for (const [path, key] of chartEndpoints) {
    console.log(`4. GET ${path}`);
    const r = await request('GET', path);
    if (r.status !== 200) { fail(`${path} returned ${r.status}`); continue; }
    const arr = r.json?.[key] ?? r.json ?? [];
    if (!Array.isArray(arr) || arr.length === 0) fail(`${path}: empty ${key}`);
    else ok(`${path}: ${arr.length} ${key}`);
  }

  // 5. Table
  console.log('5. GET /table');
  const table = await request('GET', '/table');
  if (table.status !== 200) { fail(`table returned ${table.status}`); }
  else {
    const rows = table.json?.rows ?? table.json ?? [];
    if (!Array.isArray(rows) || rows.length === 0) fail('table: empty rows');
    else ok(`table: ${rows.length} rows`);
  }

  // 6. Cross-check: total_forecast KPI vs waterfall final step vs treemap sum
  console.log('6. Cross-check totals');
  const kpiTotal = (() => {
    const items = kpis.json?.kpis ?? kpis.json ?? [];
    const kpi = items.find(k => k.key === 'total_forecast');
    return kpi?.value ?? null;
  })();
  const waterfallFinal = (() => {
    const r2 = { json: null };
    return null; // already fetched above, re-use below
  })();

  // Re-fetch waterfall for cross-check
  const wf = await request('GET', '/charts/waterfall');
  const steps = wf.json?.steps ?? [];
  const finalStep = steps.find(s => s.type === 'total' && s.name !== 'Baseline');
  const wfTotal = finalStep?.value ?? null;

  const treemapR = await request('GET', '/charts/treemap');
  const treemapNodes = treemapR.json?.data ?? [];
  // Treemap may be hierarchical (brand nodes with children); sum leaf values
  function sumNodes(nodes) {
    return nodes.reduce((sum, n) => {
      if (Array.isArray(n.children) && n.children.length > 0) {
        return sum + sumNodes(n.children);
      }
      return sum + (n.value ?? 0);
    }, 0);
  }
  const treemapSum = sumNodes(treemapNodes);

  if (kpiTotal === null) fail('cross-check: could not find total_forecast KPI');
  else ok(`total_forecast KPI = ${kpiTotal.toLocaleString()}`);

  if (wfTotal === null) fail('cross-check: could not find waterfall final total step');
  else ok(`waterfall final step = ${wfTotal.toLocaleString()}`);

  // Allow ±1% tolerance for treemap sum (may differ by level)
  if (treemapSum > 0) ok(`treemap sum = ${treemapSum.toLocaleString()}`);
  else fail('cross-check: treemap sum is 0');

  if (kpiTotal !== null && wfTotal !== null) {
    const diff = Math.abs(kpiTotal - wfTotal);
    const pct = kpiTotal > 0 ? diff / kpiTotal : 1;
    if (pct < 0.01) ok(`KPI vs waterfall match (diff=${diff}, <1%)`);
    else fail(`KPI (${kpiTotal}) vs waterfall (${wfTotal}) differ by ${(pct * 100).toFixed(1)}%`);
  }

  // Cross-check: KPI total forecast = sum of bar chart = sum of line chart
  const sbR = await request('GET', '/charts/stacked-bar');
  const sbItems = sbR.json?.items ?? [];
  const barTotal = sbItems.reduce((s, it) => s + (it.total ?? 0), 0);

  const flR = await request('GET', '/charts/forecast-line');
  const flPoints = flR.json?.points ?? [];
  const lineTotal = flPoints.reduce((s, p) => s + (p.forecast ?? 0), 0);

  if (kpiTotal !== null) {
    const barDiff = Math.abs(kpiTotal - barTotal);
    const barPct = kpiTotal > 0 ? barDiff / kpiTotal : 1;
    if (barPct < 0.001) ok(`KPI vs bar chart match (diff=${barDiff}, <0.1%)`);
    else fail(`KPI (${kpiTotal}) vs bar chart (${barTotal}) differ by ${(barPct * 100).toFixed(1)}%`);

    const lineDiff = Math.abs(kpiTotal - lineTotal);
    const linePct = kpiTotal > 0 ? lineDiff / kpiTotal : 1;
    if (linePct < 0.001) ok(`KPI vs line chart match (diff=${lineDiff}, <0.1%)`);
    else fail(`KPI (${kpiTotal}) vs line chart (${lineTotal}) differ by ${(linePct * 100).toFixed(1)}%`);

    const tmDiff = Math.abs(barTotal - treemapSum);
    const tmPct = barTotal > 0 ? tmDiff / barTotal : 1;
    if (tmPct < 0.001) ok(`treemap tiles total vs bar chart match (diff=${tmDiff}, <0.1%)`);
    else fail(`bar chart (${barTotal}) vs treemap (${treemapSum}) differ by ${(tmPct * 100).toFixed(1)}%`);
  }

  // 7. Data Review Endpoints
  console.log('7. GET /data-review/pipeline');
  const pipelineRes = await request('GET', '/data-review/pipeline');
  if (pipelineRes.status === 200 && Array.isArray(pipelineRes.json) && pipelineRes.json.length === 5) {
    ok(`pipeline: 5 feeds present (${pipelineRes.json.map(f => f.name).join(', ')})`);
  } else {
    fail(`pipeline returned ${pipelineRes.status} (length ${pipelineRes.json?.length})`);
  }

  console.log('8. GET /data-review/history');
  const historyRes = await request('GET', '/data-review/history');
  if (historyRes.status === 200 && Array.isArray(historyRes.json) && historyRes.json.length === 20) {
    ok(`history: 20 load records present`);
  } else {
    fail(`history returned ${historyRes.status} (length ${historyRes.json?.length})`);
  }

  console.log('9. GET /data-review/readiness');
  const readinessRes = await request('GET', '/data-review/readiness');
  if (
    readinessRes.status === 200 &&
    readinessRes.json?.totalSteps === 7 &&
    readinessRes.json?.completedSteps >= 3 &&
    Array.isArray(readinessRes.json?.checklist) &&
    readinessRes.json?.checklist.length === 5
  ) {
    ok(`readiness: ${readinessRes.json.completedSteps}/${readinessRes.json.totalSteps} steps, 5 checklist items`);
  } else {
    fail(`readiness returned unexpected shape: ${JSON.stringify(readinessRes.json)}`);
  }

  console.log('10. GET /data-review/calendar');
  const calendarRes = await request('GET', '/data-review/calendar');
  if (calendarRes.status === 200 && Array.isArray(calendarRes.json) && calendarRes.json.length > 0) {
    ok(`calendar: ${calendarRes.json.length} calendar feed entries found`);
  } else {
    fail(`calendar returned ${calendarRes.status}`);
  }

  // Summary
  console.log('\n── Results ──────────────────────────────────');
  if (failures === 0) {
    console.log('  All checks passed ✓\n');
    process.exit(0);
  } else {
    console.log(`  ${failures} check(s) FAILED ✗\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Smoke test crashed:', err.message);
  process.exit(1);
});
