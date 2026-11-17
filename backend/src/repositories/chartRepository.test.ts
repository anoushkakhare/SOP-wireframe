import assert from 'node:assert';
import { chartRepository } from './chartRepository';

async function testTreemapHierarchy() {
  console.log('Testing Treemap hierarchy grouping and Rexona/Closeup bug...');

  // Test Level 3 (Brand tiles grouped by S&OP parent)
  const resL3 = await chartRepository.getTreemap({ productLevel: 3 });
  assert.strictEqual(resL3.level, 'brand');
  assert.ok(resL3.data.length > 0, 'Should have parent groups');

  const skinCleansing = resL3.data.find(p => p.name === 'Skin Cleansing');
  assert.ok(skinCleansing, 'Skin Cleansing parent group should exist');
  const scChildren = skinCleansing.children?.map(c => c.name) || [];
  assert.ok(scChildren.includes('Lux'), 'Lux should be under Skin Cleansing');
  assert.ok(scChildren.includes('Lifebuoy'), 'Lifebuoy should be under Skin Cleansing');
  assert.ok(!scChildren.includes('Rexona'), 'Rexona must NOT be under Skin Cleansing');
  assert.ok(!scChildren.includes('Closeup'), 'Closeup must NOT be under Skin Cleansing');

  const deodorants = resL3.data.find(p => p.name === 'Deodorants');
  assert.ok(deodorants, 'Deodorants parent group should exist');
  const deoChildren = deodorants.children?.map(c => c.name) || [];
  assert.ok(deoChildren.includes('Rexona'), 'Rexona must sit under its true parent Deodorants');

  const oralCare = resL3.data.find(p => p.name === 'Oral Care');
  assert.ok(oralCare, 'Oral Care parent group should exist');
  const ocChildren = oralCare.children?.map(c => c.name) || [];
  assert.ok(ocChildren.includes('Closeup'), 'Closeup must sit under its true parent Oral Care');

  // Verify that EVERY tile sits under its true parent from the hierarchy
  for (const parent of resL3.data) {
    for (const child of parent.children || []) {
      assert.strictEqual(
        child.parentId,
        parent.id,
        `Tile ${child.name} (parentId: ${child.parentId}) must sit under parent ${parent.name} (id: ${parent.id})`
      );
    }
  }

  // Test Level 1 (flat with no band)
  const resL1 = await chartRepository.getTreemap({ productLevel: 1 });
  assert.ok(resL1.data.length > 0);
  for (const node of resL1.data) {
    assert.strictEqual(node.children, undefined, 'Level 1 must be flat with no children/bands');
  }

  // Cross-check total: tiles total = bar chart total
  for (const lvl of [1, 2, 3, 4, 5] as const) {
    const sb = await chartRepository.getStackedBar({ productLevel: lvl });
    const sbTotal = sb.items.reduce((s, it) => s + it.total, 0);
    const tm = await chartRepository.getTreemap({ productLevel: lvl });
    let tmTotal = 0;
    if (lvl === 1) {
      tmTotal = tm.data.reduce((s, d) => s + (d.value || 0), 0);
    } else {
      tmTotal = tm.data.reduce((s, p) => s + (p.children || []).reduce((cs, c) => cs + (c.value || 0), 0), 0);
    }
    assert.strictEqual(
      tmTotal,
      sbTotal,
      `Level ${lvl}: Treemap tiles total (${tmTotal}) must equal bar chart total (${sbTotal})`
    );
  }

  console.log('✓ All Treemap hierarchy and grouping tests passed successfully!');
}

testTreemapHierarchy().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
