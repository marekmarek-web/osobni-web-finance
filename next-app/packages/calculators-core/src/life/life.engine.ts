/**
 * Life insurance – FP model (finanční plánování).
 */

import { roundTo100k } from "./formatters";
import {
  RH1,
  RH2,
  RH3,
  MAX_REDUCED_DVZ,
  RENT_MULTIPLIER,
  INVALIDITY_COST_INCREASE,
  TN_PROGRESS,
  RETIREMENT_AGE,
  NET_TO_GROSS_FACTOR,
  PARTNER_LUMP_SUM,
  SURVIVOR_STATE_SUPPORT,
  DEFAULT_CHILD_AGE,
} from "./life.constants";
import type { LifeState, LifeResult, LifeChartDataItem } from "./life.types";

const RENT_RATE_LOCAL = 0.06;

function calculateReducedDVZ(dvz: number): number {
  let reduced = 0;
  if (dvz <= RH1) reduced = dvz * 0.9;
  else if (dvz <= RH2) reduced = RH1 * 0.9 + (dvz - RH1) * 0.6;
  else if (dvz <= RH3) reduced = RH1 * 0.9 + (RH2 - RH1) * 0.6 + (dvz - RH2) * 0.3;
  else reduced = RH1 * 0.9 + (RH2 - RH1) * 0.6 + (RH3 - RH2) * 0.3;
  return Math.min(reduced, MAX_REDUCED_DVZ);
}

function estimateInvalidityPension(net: number): number {
  if (net <= 20000) return Math.round(net * 0.45);
  if (net <= 40000) return Math.round(9000 + (net - 20000) * 0.35);
  if (net <= 60000) return Math.round(16000 + (net - 40000) * 0.25);
  return Math.round(21000 + (net - 60000) * 0.15);
}

export function calculateSicknessBenefit(netIncome: number): number {
  const grossIncome = Math.round(netIncome / NET_TO_GROSS_FACTOR);
  const dvz = Math.round((grossIncome * 12) / 365);
  const reducedDVZ = calculateReducedDVZ(dvz);
  const sicknessDaily = Math.round(reducedDVZ * 0.66);
  return sicknessDaily * 30;
}

function getTnBase(netIncome: number): number {
  if (netIncome >= 100_000) return 3_000_000;
  if (netIncome >= 50_000) return 2_000_000;
  if (netIncome >= 30_000) return 1_500_000;
  return 1_000_000;
}

function computeChildrenLumpSum(childrenCount: number): number {
  if (childrenCount <= 0) return 0;
  const yearsTo18 = Math.max(0, 18 - DEFAULT_CHILD_AGE);
  let total = 0;
  for (let i = 0; i < childrenCount; i += 1) {
    total += 200_000 + yearsTo18 * 12 * 5000;
  }
  return total;
}

export function runCalculations(state: LifeState): LifeResult {
  const { age, netIncome, expenses, liabilities, reserves, children, hasSpouse } = state;

  const invalidityNeedBase = Math.max(expenses, netIncome);
  const invalidityNeedMonthly = Math.round(invalidityNeedBase * INVALIDITY_COST_INCREASE);
  const statePensionD3 = estimateInvalidityPension(netIncome);
  const ownAssetRentaMonthly = Math.round((reserves * RENT_RATE_LOCAL) / 12);
  const invalidityGapMonthly = Math.max(
    0,
    invalidityNeedMonthly - statePensionD3 - ownAssetRentaMonthly
  );
  const capitalD3 = roundTo100k(invalidityGapMonthly * RENT_MULTIPLIER);
  const gapD3Renta = Math.round(capitalD3 / RENT_MULTIPLIER);

  const stateSicknessMonthly = calculateSicknessBenefit(netIncome);
  const pnGapMonthly = Math.max(0, netIncome - stateSicknessMonthly);
  const pnDailyNeed = Math.ceil((pnGapMonthly / 30) / 100) * 100;

  const tnBase = getTnBase(netIncome);
  const tnProgression = tnBase * TN_PROGRESS;

  const yearsTo65 = Math.max(0, RETIREMENT_AGE - age);
  const partnerLumpSum = hasSpouse ? PARTNER_LUMP_SUM : 0;
  const childrenLumpSum = computeChildrenLumpSum(children);
  const monthlyNeedForFamily = Math.max(0, netIncome - SURVIVOR_STATE_SUPPORT);
  const incomeReplacementYears = hasSpouse ? Math.min(yearsTo65, 20) : 0;
  const incomeReplacementCapital =
    monthlyNeedForFamily * 12 * incomeReplacementYears * 0.7;
  const familyProtection = Math.max(
    incomeReplacementCapital,
    partnerLumpSum + childrenLumpSum
  );

  let deathCoverageRaw = Math.max(0, liabilities + familyProtection - reserves);
  if (children === 0 && !hasSpouse && liabilities === 0) {
    deathCoverageRaw = 0;
  }
  const deathCoverage = roundTo100k(deathCoverageRaw);

  const chartData: LifeChartDataItem[] = [
    {
      label: "PN (měs.)",
      prijem: netIncome,
      stat: stateSicknessMonthly,
      chybi: pnGapMonthly,
    },
    {
      label: "Invalidita (měs.)",
      prijem: netIncome,
      stat: statePensionD3,
      chybi: invalidityGapMonthly,
    },
  ];

  return {
    deathCoverage,
    capitalD3,
    pnDailyNeed,
    tnBase,
    tnProgression,
    chartData,
    gapD3Renta,
  };
}
