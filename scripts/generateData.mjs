#!/usr/bin/env node
/**
 * scripts/generateData.mjs
 * Produces backend/src/data/masterData.json from the skeleton hierarchy.
 * Run: node scripts/generateData.mjs
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../backend/src/data/masterData.json');

// ─── Seed ────────────────────────────────────────────────────────────────────
let seed = 42;
function rand(min, max) {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  const t = (seed >>> 0) / 0xffffffff;
  return Math.floor(t * (max - min + 1)) + min;
}

const TODAY = '2026-11-17';

// ─── ISO Weeks Jan 2025 – Dec 2026 ───────────────────────────────────────────
// A week belongs to the month containing its Thursday; no split weeks.
const WEEKS = [];
let d = new Date(Date.UTC(2024, 11, 30)); // Mon Dec 30 2024
while (true) {
  const thu = new Date(d.getTime() + 3 * 86400000);
  const yr = thu.getUTCFullYear();
  if (yr > 2026) break;
  const end = new Date(d.getTime() + 6 * 86400000); // Sunday
  const jan4 = new Date(Date.UTC(yr, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const thu1 = new Date(jan4.getTime() + (3 - jan4Day) * 86400000);
  const weekNum = 1 + Math.round((thu.getTime() - thu1.getTime()) / (7 * 86400000));
  const yrStr = String(yr).slice(2);
  const wLabel = `W${String(weekNum).padStart(2, '0')} ${yrStr}`;
  const moIdx = thu.getUTCMonth();
  const moNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mLabel = `${moNames[moIdx]} ${yrStr}`;
  const qNum = Math.floor(moIdx / 3) + 1;
  const qLabel = `Q${qNum} ${yrStr}`;
  const hNum = moIdx < 6 ? 1 : 2;
  const hLabel = `H${hNum} ${yrStr}`;
  const yLabel = `FY${yrStr}`;
  const sStr = d.toISOString().slice(0, 10);
  const eStr = end.toISOString().slice(0, 10);
  const thuStr = thu.toISOString().slice(0, 10);

  WEEKS.push({
    wLabel,
    mLabel,
    qLabel,
    hLabel,
    yLabel,
    start: sStr,
    end: eStr,
    thu: thuStr,
    weekNum,
    year: yr,
    isActual: eStr < TODAY,
  });
  d = new Date(d.getTime() + 7 * 86400000);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SKELETON = [
  {
    categoryId: 'cat_bw', category: 'Beauty & Wellbeing',
    sops: [
      {
        sopId: 'sop_hc', sop: 'Hair Care',
        brands: [
          {
            brandId: 'br_dove', brand: 'Dove',
            fgs: [
              {
                fgId: 'fg_dove_sh', fg: 'Dove Shampoo Range',
                fus: [
                  { fuId: 'fu_dove_sh_200', fu: 'Dove Nourishing Shampoo 200ml' },
                  { fuId: 'fu_dove_sh_340', fu: 'Dove Nourishing Shampoo 340ml' },
                  { fuId: 'fu_dove_sh_650', fu: 'Dove Nourishing Shampoo 650ml' },
                ]
              },
              {
                fgId: 'fg_dove_co', fg: 'Dove Conditioner Range',
                fus: [
                  { fuId: 'fu_dove_co_180', fu: 'Dove Intensive Repair Conditioner 180ml' },
                  { fuId: 'fu_dove_co_335', fu: 'Dove Intensive Repair Conditioner 335ml' },
                ]
              },
            ]
          },
          {
            brandId: 'br_sunsilk', brand: 'Sunsilk',
            fgs: [
              {
                fgId: 'fg_sun_sh', fg: 'Sunsilk Shampoo Range',
                fus: [
                  { fuId: 'fu_sun_sh_180', fu: 'Sunsilk Black Shine Shampoo 180ml' },
                  { fuId: 'fu_sun_sh_340', fu: 'Sunsilk Black Shine Shampoo 340ml' },
                ]
              },
            ]
          },
        ],
      },
      {
        sopId: 'sop_sk', sop: 'Skin Care',
        brands: [
          {
            brandId: 'br_ponds', brand: "Pond's",
            fgs: [
              {
                fgId: 'fg_ponds_cr', fg: "Pond's Cream Range",
                fus: [
                  { fuId: 'fu_ponds_cr_50', fu: "Pond's Age Miracle Cream 50g" },
                  { fuId: 'fu_ponds_cr_100', fu: "Pond's Age Miracle Cream 100g" },
                ]
              },
              {
                fgId: 'fg_ponds_fw', fg: "Pond's Face Wash Range",
                fus: [
                  { fuId: 'fu_ponds_fw_100', fu: "Pond's Bright Beauty Face Wash 100ml" },
                  { fuId: 'fu_ponds_fw_200', fu: "Pond's Bright Beauty Face Wash 200ml" },
                ]
              },
            ]
          },
          {
            brandId: 'br_vas', brand: 'Vaseline',
            fgs: [
              {
                fgId: 'fg_vas_bl', fg: 'Vaseline Body Lotion Range',
                fus: [
                  { fuId: 'fu_vas_bl_200', fu: 'Vaseline Intensive Care Lotion 200ml' },
                  { fuId: 'fu_vas_bl_400', fu: 'Vaseline Intensive Care Lotion 400ml' },
                ]
              },
              {
                fgId: 'fg_vas_pj', fg: 'Vaseline Petroleum Jelly Range',
                fus: [
                  { fuId: 'fu_vas_pj_50', fu: 'Vaseline Petroleum Jelly 50ml' },
                  { fuId: 'fu_vas_pj_100', fu: 'Vaseline Petroleum Jelly 100ml' },
                ]
              },
            ]
          },
        ],
      },
    ],
  },
  {
    categoryId: 'cat_pc', category: 'Personal Care',
    sops: [
      {
        sopId: 'sop_sc', sop: 'Skin Cleansing',
        brands: [
          {
            brandId: 'br_lux', brand: 'Lux',
            fgs: [
              {
                fgId: 'fg_lux_bar', fg: 'Lux Bar Range',
                fus: [
                  { fuId: 'fu_lux_bar_75', fu: 'Lux Soft Touch Soap Bar 75g' },
                  { fuId: 'fu_lux_bar_150', fu: 'Lux Soft Touch Soap Bar 150g' },
                ]
              },
              {
                fgId: 'fg_lux_bw', fg: 'Lux Body Wash Range',
                fus: [
                  { fuId: 'fu_lux_bw_200', fu: 'Lux Velvet Touch Body Wash 200ml' },
                  { fuId: 'fu_lux_bw_500', fu: 'Lux Velvet Touch Body Wash 500ml' },
                ]
              },
            ]
          },
          {
            brandId: 'br_life', brand: 'Lifebuoy',
            fgs: [
              {
                fgId: 'fg_life_bar', fg: 'Lifebuoy Soap Bar Range',
                fus: [
                  { fuId: 'fu_life_bar_90', fu: 'Lifebuoy Total 10 Soap 90g' },
                  { fuId: 'fu_life_bar_120', fu: 'Lifebuoy Total 10 Soap 120g' },
                  { fuId: 'fu_life_bar_4p', fu: 'Lifebuoy Total 10 Soap 4-Pack' },
                ]
              },
            ]
          },
        ],
      },
      {
        sopId: 'sop_deo', sop: 'Deodorants',
        brands: [
          {
            brandId: 'br_rex', brand: 'Rexona',
            fgs: [
              {
                fgId: 'fg_rex_spray', fg: 'Rexona Spray Range',
                fus: [
                  { fuId: 'fu_rex_spray_150', fu: 'Rexona Active Dry Spray 150ml' },
                  { fuId: 'fu_rex_spray_200', fu: 'Rexona Active Dry Spray 200ml' },
                ]
              },
              {
                fgId: 'fg_rex_roll', fg: 'Rexona Roll-On Range',
                fus: [
                  { fuId: 'fu_rex_roll_50', fu: 'Rexona Active Dry Roll-On 50ml' },
                ]
              },
            ]
          },
        ],
      },
      {
        sopId: 'sop_oc', sop: 'Oral Care',
        brands: [
          {
            brandId: 'br_close', brand: 'Closeup',
            fgs: [
              {
                fgId: 'fg_close_tp', fg: 'Closeup Toothpaste Range',
                fus: [
                  { fuId: 'fu_close_tp_80', fu: 'Closeup Red Hot Toothpaste 80g' },
                  { fuId: 'fu_close_tp_150', fu: 'Closeup Red Hot Toothpaste 150g' },
                ]
              },
            ]
          },
        ],
      },
    ],
  },
  {
    categoryId: 'cat_home', category: 'Home Care',
    sops: [
      {
        sopId: 'sop_fab', sop: 'Fabric Care',
        brands: [
          {
            brandId: 'br_surf', brand: 'Surf Excel',
            fgs: [
              {
                fgId: 'fg_surf_pow', fg: 'Surf Excel Powder Range',
                fus: [
                  { fuId: 'fu_surf_pow_500', fu: 'Surf Excel Matic Liquid 500ml' },
                  { fuId: 'fu_surf_pow_1kg', fu: 'Surf Excel Matic Liquid 1L' },
                  { fuId: 'fu_surf_pow_2kg', fu: 'Surf Excel Matic Liquid 2L' },
                ]
              },
              {
                fgId: 'fg_surf_bar', fg: 'Surf Excel Bar Range',
                fus: [
                  { fuId: 'fu_surf_bar_250', fu: 'Surf Excel Stain Removal Bar 250g' },
                ]
              },
            ]
          },
          {
            brandId: 'br_comf', brand: 'Comfort',
            fgs: [
              {
                fgId: 'fg_comf_soft', fg: 'Comfort Fabric Softener Range',
                fus: [
                  { fuId: 'fu_comf_soft_500', fu: 'Comfort Fabric Softener 500ml' },
                  { fuId: 'fu_comf_soft_1L', fu: 'Comfort Fabric Softener 1L' },
                ]
              },
            ]
          },
        ],
      },
      {
        sopId: 'sop_hcl', sop: 'Home Cleaning',
        brands: [
          {
            brandId: 'br_dom', brand: 'Domestos',
            fgs: [
              {
                fgId: 'fg_dom_bl', fg: 'Domestos Bleach Range',
                fus: [
                  { fuId: 'fu_dom_bl_500', fu: 'Domestos Extended Power Bleach 500ml' },
                  { fuId: 'fu_dom_bl_1L', fu: 'Domestos Extended Power Bleach 1L' },
                ]
              },
            ]
          },
          {
            brandId: 'br_vim', brand: 'Vim',
            fgs: [
              {
                fgId: 'fg_vim_liq', fg: 'Vim Dishwash Liquid Range',
                fus: [
                  { fuId: 'fu_vim_liq_250', fu: 'Vim Dishwash Liquid 250ml' },
                  { fuId: 'fu_vim_liq_500', fu: 'Vim Dishwash Liquid 500ml' },
                ]
              },
              {
                fgId: 'fg_vim_bar', fg: 'Vim Dishwash Bar Range',
                fus: [
                  { fuId: 'fu_vim_bar_200', fu: 'Vim Dishwash Bar 200g' },
                ]
              },
            ]
          },
        ],
      },
    ],
  },
  {
    categoryId: 'cat_food', category: 'Foods',
    sops: [
      {
        sopId: 'sop_sav', sop: 'Savoury',
        brands: [
          {
            brandId: 'br_knorr', brand: 'Knorr',
            fgs: [
              {
                fgId: 'fg_knorr_stock', fg: 'Knorr Stock Range',
                fus: [
                  { fuId: 'fu_knorr_chk_80', fu: 'Knorr Chicken Stock Cubes 80g' },
                  { fuId: 'fu_knorr_veg_80', fu: 'Knorr Vegetable Stock Cubes 80g' },
                ]
              },
              {
                fgId: 'fg_knorr_soup', fg: 'Knorr Soup Range',
                fus: [
                  { fuId: 'fu_knorr_soup_tom', fu: 'Knorr Tomato Soup 54g' },
                  { fuId: 'fu_knorr_soup_chk', fu: 'Knorr Chicken Noodle Soup 50g' },
                ]
              },
            ]
          },
          {
            brandId: 'br_hell', brand: "Hellmann's",
            fgs: [
              {
                fgId: 'fg_hell_mayo', fg: "Hellmann's Mayonnaise Range",
                fus: [
                  { fuId: 'fu_hell_mayo_200', fu: "Hellmann's Real Mayonnaise 200ml" },
                  { fuId: 'fu_hell_mayo_430', fu: "Hellmann's Real Mayonnaise 430ml" },
                ]
              },
            ]
          },
        ],
      },
      {
        sopId: 'sop_tea', sop: 'Tea',
        brands: [
          {
            brandId: 'br_bb', brand: 'Brooke Bond',
            fgs: [
              {
                fgId: 'fg_bb_black', fg: 'Brooke Bond Black Tea Range',
                fus: [
                  { fuId: 'fu_bb_loose_250', fu: 'Brooke Bond Red Label Loose 250g' },
                  { fuId: 'fu_bb_loose_500', fu: 'Brooke Bond Red Label Loose 500g' },
                  { fuId: 'fu_bb_bags_100', fu: 'Brooke Bond Red Label Bags 100pc' },
                ]
              },
            ]
          },
          {
            brandId: 'br_lip', brand: 'Lipton',
            fgs: [
              {
                fgId: 'fg_lip_grn', fg: 'Lipton Green Tea Range',
                fus: [
                  { fuId: 'fu_lip_grn_25', fu: 'Lipton Green Tea 25 bags' },
                  { fuId: 'fu_lip_grn_50', fu: 'Lipton Green Tea 50 bags' },
                ]
              },
              {
                fgId: 'fg_lip_yel', fg: 'Lipton Yellow Label Range',
                fus: [
                  { fuId: 'fu_lip_yel_100', fu: 'Lipton Yellow Label 100 bags' },
                ]
              },
            ]
          },
        ],
      },
    ],
  },
];

// APGs + brand×APG gaps
const APGS = ['Modern Trade', 'General Trade', 'E-commerce', 'Quick Commerce'];
const APG_GAPS = new Set(['br_ponds_Quick Commerce', 'br_dom_Quick Commerce', 'br_close_E-commerce']);

// ─── Pack details: unitsPerCase (6, 12, 24, 48) and unit price ──────────────
function getPackDetails(name) {
  let unitsPerCase = 12;
  if (/50g|50ml|75g|80g|25 bags|54g/i.test(name)) unitsPerCase = 48;
  else if (/90g|100g|100ml|120g|150g|150ml|180ml|200g|200ml|50 bags/i.test(name)) unitsPerCase = 24;
  else if (/250g|250ml|335ml|340ml|400ml|430ml|500g|500ml|100 bags|100pc/i.test(name)) unitsPerCase = 12;
  else unitsPerCase = 6;

  let price = 120;
  if (/shampoo|conditioner|cream|face wash|lotion/i.test(name)) price = 220;
  if (/soap|bar/i.test(name)) price = 45;
  if (/spray|roll-on/i.test(name)) price = 180;
  if (/bleach|liquid|clean/i.test(name)) price = 160;
  if (/tea|mayo|soup|stock/i.test(name)) price = 140;
  if (unitsPerCase === 48) price = Math.round(price * 0.4);
  else if (unitsPerCase === 6) price = Math.round(price * 2.5);

  return { unitsPerCase, price };
}

// ─── Hierarchy nodes ──────────────────────────────────────────────────────────
const nodes = [];
for (const cat of SKELETON) {
  nodes.push({ id: cat.categoryId, name: cat.category, level: 1, parentId: null });
  for (const sop of cat.sops) {
    nodes.push({ id: sop.sopId, name: sop.sop, level: 2, parentId: cat.categoryId });
    for (const br of sop.brands) {
      nodes.push({ id: br.brandId, name: br.brand, level: 3, parentId: sop.sopId });
      for (const fg of br.fgs) {
        nodes.push({ id: fg.fgId, name: fg.fg, level: 4, parentId: br.brandId });
        for (const fu of fg.fus) {
          nodes.push({ id: fu.fuId, name: fu.fu, level: 5, parentId: fg.fgId });
        }
      }
    }
  }
}

// ─── Build lookup maps ────────────────────────────────────────────────────────
const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
function ancestorAt(nodeId, level) {
  let cur = nodeById[nodeId];
  while (cur && cur.level > level) cur = nodeById[cur.parentId];
  return cur;
}

// ─── Items with Weekly facts ──────────────────────────────────────────────────
const items = [];
let itemNum = 0;

for (const cat of SKELETON) {
  for (const sop of cat.sops) {
    for (const br of sop.brands) {
      for (const apg of APGS) {
        const gapKey = `${br.brandId}_${apg}`;
        if (APG_GAPS.has(gapKey)) continue;

        for (const fg of br.fgs) {
          for (const fu of fg.fus) {
            itemNum++;
            const pack = getPackDetails(fu.fu);
            const weeklyBaseUnits = rand(2000, 6000);

            const weeklyActuals = {};
            const weeklyForecast = {};
            const weeklyOpportunity = {};
            const weeklyRisk = {};
            const weeklyForecastByCycle = {
              'Current cycle': {},
              'MRF': {},
              'Prior cycle snapshot': {},
            };

            // Also maintain rolled-up monthly facts for compatibility
            const pastActuals = {};
            const pastForecast = {};
            const actualFcst = {};
            const opportunity = {};
            const risk = {};

            // Determine category and FG-specific cycle multipliers to show realistic diversification
            // across all comparison options (growth in 1 category + 1 FG, stability/neutral in another, contraction in others)
            let mrfMult = 0.88;
            let priorMult = 0.96;
            let pastForecastRatio = 1.06; // past forecast > actual means actual was lower (red)

            if (cat.categoryId === 'cat_home' || cat.category === 'Home Care') {
              // Increase entire category: Home Care (Surf Excel, Rin, Vim)
              mrfMult = 1.15; // +15% vs Current cycle (Green)
              priorMult = 1.08; // +8% vs Current cycle (Green)
              pastForecastRatio = 0.89; // actual exceeded past forecast by +12.4% (Green)
            } else if (fg.fgId === 'fg_ponds_cr') {
              // Increase specific FG in Beauty & Wellbeing: Pond's Cream Range
              mrfMult = 1.18; // +18% vs Current cycle (Green)
              priorMult = 1.12; // +12% vs Current cycle (Green)
              pastForecastRatio = 0.86; // actual exceeded past forecast by +16.3% (Green)
            } else if (fg.fgId === 'fg_lux_bw') {
              // Also increase FG in Personal Care: Lux Body Wash Range
              mrfMult = 1.10; // +10% vs Current cycle (Green)
              priorMult = 1.06; // +6% vs Current cycle (Green)
              pastForecastRatio = 0.91; // actual exceeded past forecast by +9.9% (Green)
            } else if (cat.categoryId === 'cat_food') {
              // Foods: near neutral
              mrfMult = 1.01; // +1% (Neutral grey / subtle green)
              priorMult = 0.99; // -1% (Neutral grey)
              pastForecastRatio = 1.00; // actual closely matched forecast (Neutral)
            } else if (cat.categoryId === 'cat_pc') {
              // Personal Care: contraction
              mrfMult = 0.84; // -16% (Red)
              priorMult = 0.93; // -7% (Red)
              pastForecastRatio = 1.10; // actual fell short of forecast (Red)
            } else {
              // Other Beauty & Wellbeing
              mrfMult = 0.86; // -14% (Red)
              priorMult = 0.95; // -5% (Red)
              pastForecastRatio = 1.08; // actual fell short of forecast (Red)
            }

            WEEKS.forEach((w, wIdx) => {
              const seasonal = 1 + 0.15 * Math.sin((wIdx / 52) * 2 * Math.PI);
              const v = Math.round(weeklyBaseUnits * seasonal * (0.9 + rand(0, 20) / 100));

              let fcstCurrent = v;
              let fcstMRF = Math.round(v * mrfMult);
              let fcstPrior = Math.round(v * priorMult);

              if (w.isActual) {
                weeklyActuals[w.wLabel] = v;
                // Seeded forecast values for past periods per cycle so Actuals vs Forecast works
                fcstCurrent = Math.round(v * pastForecastRatio * (0.98 + rand(0, 4) / 100));
                fcstMRF = Math.round(fcstCurrent * mrfMult);
                fcstPrior = Math.round(fcstCurrent * priorMult);

                weeklyForecast[w.wLabel] = fcstCurrent;
                weeklyOpportunity[w.wLabel] = 0;
                weeklyRisk[w.wLabel] = 0;
              } else {
                weeklyActuals[w.wLabel] = 0;
                weeklyForecast[w.wLabel] = v;
                weeklyOpportunity[w.wLabel] = Math.round(v * (0.05 + rand(0, 10) / 100));
                weeklyRisk[w.wLabel] = -Math.round(v * (0.03 + rand(0, 8) / 100));
              }

              weeklyForecastByCycle['Current cycle'][w.wLabel] = fcstCurrent;
              weeklyForecastByCycle['MRF'][w.wLabel] = fcstMRF;
              weeklyForecastByCycle['Prior cycle snapshot'][w.wLabel] = fcstPrior;

              // Rollup into month label
              const m = w.mLabel;
              if (w.isActual) {
                pastActuals[m] = (pastActuals[m] || 0) + v;
                pastForecast[m] = (pastForecast[m] || 0) + fcstCurrent;
                actualFcst[m] = (actualFcst[m] || 0) + v;
              } else {
                actualFcst[m] = (actualFcst[m] || 0) + v;
                opportunity[m] = (opportunity[m] || 0) + weeklyOpportunity[w.wLabel];
                risk[m] = (risk[m] || 0) + weeklyRisk[w.wLabel];
              }
            });

            items.push({
              id: `item_${itemNum}`,
              fuId: fu.fuId,
              fgId: fg.fgId,
              brandId: br.brandId,
              sopId: sop.sopId,
              categoryId: cat.categoryId,
              forecastUnit: fu.fu,
              forecastGroup: fg.fg,
              brand: br.brand,
              sop: sop.sop,
              category: cat.category,
              apg,
              unitsPerCase: pack.unitsPerCase,
              price: pack.price,
              weeklyActuals,
              weeklyForecast,
              weeklyForecastByCycle,
              weeklyOpportunity,
              weeklyRisk,
              pastActuals,
              pastForecast,
              definitions: { opportunity, actualFcst, risk },
            });
          }
        }
      }
    }
  }
}

// Build distinct period lists
const monthsList = Array.from(new Set(WEEKS.map(w => w.mLabel)));
const quartersList = Array.from(new Set(WEEKS.map(w => w.qLabel)));
const halvesList = Array.from(new Set(WEEKS.map(w => w.hLabel)));
const yearsList = Array.from(new Set(WEEKS.map(w => w.yLabel)));

const output = {
  today: TODAY,
  weeks: WEEKS,
  months: monthsList,
  quarters: quartersList,
  halves: halvesList,
  years: yearsList,
  currentMonthIndex: monthsList.indexOf('Nov 26'),
  targets: {
    totalForecast: 1820000,
    forecastAdjustment: 42000,
    risk: -96000,
    opportunity: 128000,
    growthFy: 2.8,
    growthYtd: 5.8,
    growthYtg: -1.9,
    growthFyRo: 2.8,
    growthYtgRo: -1.9,
    baseline: 1600000,
    demandDrivers: 178000,
    manualAdjustment: 42000,
  },
  nodes,
  items,
  scenarios: [
    {
      id: "scen_1",
      name: "Festive Season Upside",
      status: "saved",
      lastModified: "2026-11-12T07:31:00.000Z",
      userId: "usr_dp_1",
      userName: "Priya Sharma"
    },
    {
      id: "scen_2",
      name: "Base Forecast Refresh",
      status: "saved",
      lastModified: "2026-11-11T09:30:00.000Z",
      userId: "usr_dp_1",
      userName: "Priya Sharma"
    },
    {
      id: "scen_3",
      name: "Q3 Committed Plan",
      status: "committed",
      lastModified: "2026-07-15T14:30:00.000Z",
      userId: "usr_dp_1",
      userName: "Priya Sharma"
    },
    {
      id: "scen_4",
      name: "Raw Material Delay Risk",
      status: "saved",
      lastModified: "2026-07-18T10:15:00.000Z",
      userId: "usr_dp_1",
      userName: "Priya Sharma"
    }
  ]
};

writeFileSync(OUT, JSON.stringify(output, null, 2));
console.log(`Written ${items.length} items, ${nodes.length} nodes, ${WEEKS.length} weeks → ${OUT}`);
