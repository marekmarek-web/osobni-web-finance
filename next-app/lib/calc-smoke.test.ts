/**
 * Smoke testy kalkulaček — parita s calculations/*.js a calculators-core.
 * Spustit: pnpm test:calc (z next-app/)
 */
import { DEFAULT_MORTGAGE_STATE, BANKS_DATA } from "./mortgage-data";
import { calculateMortgage, getBorrowingAmount, syncOwnFromLtv } from "./mortgage-engine";
import { DEFAULT_STATE as LIFE_DEFAULT } from "@/lib/calculators/life/life.config";
import { runCalculations as runLifeCalculations } from "@/lib/calculators/life/life.engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

// --- Hypotéka: 5M @ 90% LTV ---
const hypoState = { ...DEFAULT_MORTGAGE_STATE };
const borrow = getBorrowingAmount(hypoState);
const own = syncOwnFromLtv(hypoState);
assert(borrow === 4_500_000, `LTV úvěr: očekáváno 4500000, dostáno ${borrow}`);
assert(own === 500_000, `LTV vlastní: očekáváno 500000, dostáno ${own}`);

const hypoResult = calculateMortgage(hypoState, BANKS_DATA, { fixYears: 5 });
assert(hypoResult.borrowingAmount === 4_500_000, "calculateMortgage borrowingAmount");

// --- Životní: FP model ---
const lifeState = { ...LIFE_DEFAULT, netIncome: 50_000, expenses: 40_000 };
const lifeResult = runLifeCalculations(lifeState);
assert(lifeResult.capitalD3 > 0, "life capitalD3 > 0");
assert(lifeResult.gapD3Renta === Math.round(lifeResult.capitalD3 / 200), "rent multiplier 200");
assert(lifeResult.tnProgression === lifeResult.tnBase * 8, "TN progrese 8×");

console.log("OK: hypotéka 5M @ 90% LTV → úvěr", borrow, "vlastní", own);
console.log("OK: životní FP model → capitalD3", lifeResult.capitalD3, "TN 8×", lifeResult.tnProgression);
