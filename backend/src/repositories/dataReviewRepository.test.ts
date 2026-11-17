import { dataReviewRepository } from './dataReviewRepository';

console.log('Testing DataReviewRepository...');

// 1. Pipeline has 5 feeds
const pipeline = dataReviewRepository.getPipeline();
if (pipeline.length !== 5) {
  throw new Error(`Expected 5 feeds, got ${pipeline.length}`);
}
console.log('✓ Pipeline has 5 feeds');

const feedNames = pipeline.map(f => f.name);
const expectedNames = [
  'Product master',
  'Customer master',
  'Price master',
  'Actuals (SAP/BW)',
  'Statistical forecast',
];
expectedNames.forEach(n => {
  if (!feedNames.includes(n)) {
    throw new Error(`Missing expected feed: ${n}`);
  }
});
console.log('✓ All 5 required feed names exist');

// 2. History has 20 items
const history = dataReviewRepository.getHistory();
if (history.length !== 20) {
  throw new Error(`Expected 20 history items, got ${history.length}`);
}
console.log('✓ History has 20 items');

// 3. Initial readiness is 3/7 steps
const readiness = dataReviewRepository.getReadiness();
if (readiness.totalSteps !== 7) {
  throw new Error(`Expected totalSteps 7, got ${readiness.totalSteps}`);
}
if (readiness.completedSteps !== 3) {
  throw new Error(`Expected completedSteps 3, got ${readiness.completedSteps}`);
}
if (readiness.signedOff !== false) {
  throw new Error('Expected signedOff false initially');
}
if (readiness.blockingItems.length === 0) {
  throw new Error('Expected blocking items initially');
}
console.log(`✓ Initial readiness: ${readiness.completedSteps}/${readiness.totalSteps} steps (amber), blocked as expected`);

// 4. Try signing off while blocked - should throw
try {
  dataReviewRepository.signoff({ signedBy: 'Test User' });
  throw new Error('Signoff should have thrown when blocked');
} catch (err: any) {
  if (!err.message.includes('Cannot sign off')) {
    throw err;
  }
  console.log('✓ Premature sign-off properly rejected');
}

// 5. Complete manual checks, fix validation gaps, and load remaining feeds
dataReviewRepository.updateReadiness({
  innovationReviewed: true,
  comboPacksReviewed: true,
});

const uncompleted = dataReviewRepository.getPipeline().filter(f => f.status !== 'loaded');
uncompleted.forEach(f => {
  dataReviewRepository.loadFeed(f.id);
});

// Fix mapping gaps and null values
const valBefore = dataReviewRepository.getValidationData();
if (valBefore.mappingGaps.count !== 25) {
  throw new Error(`Expected initial mapping gaps 25, got ${valBefore.mappingGaps.count}`);
}
dataReviewRepository.fixMappingGap('mg-1', 'master');
const valAfterOne = dataReviewRepository.getValidationData();
if (valAfterOne.mappingGaps.count !== 20) {
  throw new Error(`Expected 20 after fixing one mapping gap, got ${valAfterOne.mappingGaps.count}`);
}
dataReviewRepository.fixAllMappingGaps();
dataReviewRepository.fixAllNullValues('zero');

const readyState = dataReviewRepository.getReadiness();
if (readyState.completedSteps !== 7) {
  throw new Error(`Expected completedSteps 7, got ${readyState.completedSteps}`);
}
if (readyState.blockingItems.length !== 0) {
  throw new Error(`Expected 0 blocking items, got ${readyState.blockingItems.length}`);
}
console.log('✓ When all feeds, validation fixes, and manual ticks completed: 7/7 steps and 0 blocking');

// 6. Sign off
const signed = dataReviewRepository.signoff({ signedBy: 'Nishta', cycle: '2026-11' });
if (!signed.signedOff || signed.signoff?.signedBy !== 'Nishta') {
  throw new Error('Signoff state failed');
}
console.log('✓ Successfully signed off');

// 7. Reopen
const reopened = dataReviewRepository.reopen();
if (reopened.signedOff !== false || reopened.signoff !== null) {
  throw new Error('Reopen failed');
}
console.log('✓ Successfully reopened');

// 8. Transactions review
const txDefault = dataReviewRepository.getTransactions();
if (!txDefault.items || txDefault.items.length === 0) {
  throw new Error('Expected transaction items');
}
if (!txDefault.groups.includes('Beauty & Wellbeing') || !txDefault.groups.includes('Home Care')) {
  throw new Error('Expected default category groups');
}
if (txDefault.summary.gapCount < 1 || txDefault.summary.spikeCount < 1) {
  throw new Error(`Expected at least 1 gap and 1 spike, got gap=${txDefault.summary.gapCount}, spike=${txDefault.summary.spikeCount}`);
}

const gapItem = txDefault.items.find(i => i.isAnomaly === 'gap');
if (!gapItem || gapItem.value !== 0 || gapItem.rowCount !== 0) {
  throw new Error('Seeded gap item invalid');
}

const spikeItem = txDefault.items.find(i => i.isAnomaly === 'spike');
if (!spikeItem || spikeItem.value <= 0) {
  throw new Error('Seeded spike item invalid');
}

const txSop = dataReviewRepository.getTransactions({ groupBy: 'sop', measure: 'cases' });
if (txSop.groupBy !== 'sop' || txSop.measure !== 'cases' || txSop.groups.length < 5) {
  throw new Error('S&OP grouping with cases measure failed');
}
console.log('✓ Successfully tested getTransactions with seeded anomalies and groupings');

console.log('All DataReviewRepository tests passed successfully!');


