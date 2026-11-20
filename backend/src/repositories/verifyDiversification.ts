import { chartRepository } from './chartRepository';

async function checkDiversification() {
  console.log('=== Checking Diversification Across Comparison Options ===\n');

  for (const compareTo of ['MRF', 'Prior cycle snapshot', 'Actuals']) {
    console.log(`--- Comparing with: ${compareTo} ---`);

    // Level 1: Categories (Bar Chart & Treemap)
    const bar = await chartRepository.getStackedBar({ compareTo, productLevel: 1 });
    console.log('Category comparison (Bar Chart categories):');
    for (const item of bar.items) {
      const pct = item.seriesA ? (((item.seriesB! - item.seriesA) / item.seriesA) * 100).toFixed(1) : '0';
      const sign = item.delta! >= 0 ? '+' : '';
      console.log(`  ${item.category.padEnd(22)}: A=${item.seriesA}, B=${item.seriesB}, Δ=${sign}${item.delta} (${sign}${pct}%)`);
    }

    // Treemap Level 4 (Forecast Groups)
    const tm = await chartRepository.getTreemap({ compareTo, productLevel: 4 });
    const fgNodes: any[] = [];
    for (const parent of tm.data) {
      if (parent.children) {
        fgNodes.push(...parent.children);
      } else {
        fgNodes.push(parent);
      }
    }

    console.log('\nSample Forecast Group comparison:');
    const samples = ['Pond\'s Cream Range', 'Lux Body Wash Range', 'Surf Excel Matic Range', 'Knorr Soup Range', 'Lux Bar Range'];
    for (const name of samples) {
      const node = fgNodes.find(n => n.name === name);
      if (node) {
        const sign = node.delta >= 0 ? '+' : '';
        console.log(`  ${node.name.padEnd(25)}: A=${node.valueA}, B=${node.valueB}, Δ=${sign}${node.delta} (${sign}${node.pctChange}%)`);
      }
    }
    console.log('\n');
  }
}

checkDiversification().catch(console.error);

