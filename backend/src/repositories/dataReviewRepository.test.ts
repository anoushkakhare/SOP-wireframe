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

// 5. Complete manual checks and load remaining feeds
dataReviewRepository.updateReadiness({
  innovationReviewed: true,
  comboPacksReviewed: true,
});

const uncompleted = dataReviewRepository.getPipeline().filter(f => f.status !== 'loaded');
uncompleted.forEach(f => {
  dataReviewRepository.loadFeed(f.id);
});

const readyState = dataReviewRepository.getReadiness();
if (readyState.completedSteps !== 7) {
  throw new Error(`Expected completedSteps 7, got ${readyState.completedSteps}`);
}
if (readyState.blockingItems.length !== 0) {
  throw new Error(`Expected 0 blocking items, got ${readyState.blockingItems.length}`);
}
console.log('✓ When all feeds and manual ticks completed: 7/7 steps');

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

console.log('All DataReviewRepository tests passed successfully!');

