/**
 * Smoke test: parita LTV s calculations/mortgage-engine.js
 * Spustit: pnpm test:calc (z next-app/)
 */
import { DEFAULT_MORTGAGE_STATE, BANKS_DATA } from './mortgage-data';
import { calculateMortgage, getBorrowingAmount, syncOwnFromLtv } from './mortgage-engine';

const state = { ...DEFAULT_MORTGAGE_STATE };
const borrow = getBorrowingAmount(state);
const own = syncOwnFromLtv(state);

if (borrow !== 4_500_000 || own !== 500_000) {
  console.error('LTV FAIL', { borrow, own });
  process.exit(1);
}

const result = calculateMortgage(state, BANKS_DATA, { fixYears: 5 });
if (result.borrowingAmount !== 4_500_000) {
  console.error('calculateMortgage FAIL', result);
  process.exit(1);
}

console.log('OK: 5M @ 90% LTV → úvěr', borrow, 'vlastní', own);
