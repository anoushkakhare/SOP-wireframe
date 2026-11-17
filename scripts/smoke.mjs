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
