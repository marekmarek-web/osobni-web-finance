export type MortgageProduct = 'mortgage' | 'loan';
export type MortgageType = 'standard' | 'investment' | 'american';
export type LoanType = 'consumer' | 'auto' | 'consolidation';

export interface MortgageState {
  product: MortgageProduct;
  mortgageType: MortgageType;
  loanType: LoanType;
  /** Hodnota nemovitosti (u hypotéky) nebo cena vozu / výše úvěru u spotřebitelských produktů */
  loan: number;
  own: number;
  extra: number;
  term: number;
  fix: number;
  type: 'new' | 'refi';
  ltvLock: number | null;
}

export interface BankRate {
  id: string;
  name: string;
  baseRate: number;
  loanRate?: number;
  logoUrl?: string;
}

export interface MortgageCalculationResult {
  propertyValue: number;
  borrowingAmount: number;
  ownResources: number;
  calcLtv: number;
  displayLtv: number;
  finalRate: number;
  monthlyPayment: number;
  totalPaid: number;
}

export function getPropertyValue(state: MortgageState): number {
  return state.loan || 0;
}

export function getBorrowingAmount(state: MortgageState): number {
  if (state.product !== 'mortgage') {
    if (state.product === 'loan' && state.loanType === 'auto') {
      return Math.max(0, state.loan - (state.own || 0));
    }
    if (state.product === 'loan' && state.loanType === 'consolidation') {
      return (state.loan || 0) + (state.extra || 0);
    }
    return state.loan || 0;
  }

  const propertyValue = getPropertyValue(state);
  if (propertyValue <= 0) return 0;

  if (state.ltvLock != null) {
    return Math.round((propertyValue * state.ltvLock) / 100);
  }

  const own = state.own || 0;
  return Math.max(0, propertyValue - own);
}

export function getOwnResources(state: MortgageState): number {
  if (state.product !== 'mortgage') {
    return state.own || 0;
  }

  const propertyValue = getPropertyValue(state);
  const borrowingAmount = getBorrowingAmount(state);
  return Math.max(0, propertyValue - borrowingAmount);
}

export function getCalculatedLtv(state: MortgageState): number {
  if (state.product === 'mortgage') {
    const propertyValue = getPropertyValue(state);
    if (propertyValue <= 0) return 0;
    const borrowingAmount = getBorrowingAmount(state);
    return Math.round((borrowingAmount / propertyValue) * 100);
  }

  if (state.product === 'loan' && state.loanType === 'auto') {
    if (state.loan > 0) {
      return Math.round(((state.own || 0) / state.loan) * 100);
    }
    return 0;
  }

  return 0;
}

export function syncOwnFromLtv(state: MortgageState): number {
  const propertyValue = getPropertyValue(state);
  if (propertyValue <= 0 || state.ltvLock == null) {
    return state.own || 0;
  }

  const borrowingAmount = Math.round((propertyValue * state.ltvLock) / 100);
  return Math.max(0, propertyValue - borrowingAmount);
}

export function calculateMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  termYears: number
): number {
  if (principal <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  if (r <= 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function calculateMortgageRate(
  state: MortgageState,
  banksData: BankRate[],
  options?: { fixYears?: number }
): { finalRate: number; calcLtv: number } {
  const calcLtv = getCalculatedLtv(state);
  let penalty = 0;

  if (calcLtv > 90) penalty += 1.5;
  if (state.mortgageType === 'american') penalty += 1.5;
  if (state.mortgageType === 'investment') penalty += 0.4;
  if (state.type === 'refi') penalty -= 0.2;

  const base = Math.min(...banksData.map((b) => b.baseRate));
  let finalRate = base + penalty;
  if (finalRate < 4.19) finalRate = 4.19;

  const fixYears = options?.fixYears ?? state.fix ?? 5;
  if (fixYears < 5) finalRate += 0.1;
  else if (fixYears > 7) {
    finalRate = Math.max(4.19, finalRate - 0.15);
  }

  return { finalRate, calcLtv };
}

export function calculateLoanRate(state: MortgageState, banksData: BankRate[]): number {
  let typeMod = 0;
  if (state.loanType === 'auto') typeMod = -1.0;
  if (state.loanType === 'consolidation') typeMod = -0.5;

  const avgRate =
    banksData.reduce((acc, b) => acc + (b.loanRate || 7.0), 0) /
    Math.max(1, banksData.length);

  return avgRate + typeMod;
}

export function calculateMortgage(
  state: MortgageState,
  banksData: BankRate[],
  options?: { fixYears?: number }
): MortgageCalculationResult {
  const borrowingAmount = getBorrowingAmount(state);
  let finalRate = 0;
  let calcLtv = 0;

  if (state.product === 'mortgage') {
    const rateResult = calculateMortgageRate(state, banksData, options);
    finalRate = rateResult.finalRate;
    calcLtv = rateResult.calcLtv;
  } else {
    finalRate = calculateLoanRate(state, banksData);
    calcLtv = getCalculatedLtv(state);
  }

  const monthlyPayment = calculateMonthlyPayment(
    borrowingAmount,
    finalRate,
    state.term || 30
  );
  const totalPaid = monthlyPayment * (state.term || 30) * 12;

  return {
    propertyValue: getPropertyValue(state),
    borrowingAmount,
    ownResources: getOwnResources(state),
    calcLtv,
    displayLtv: state.ltvLock != null ? state.ltvLock : calcLtv,
    finalRate,
    monthlyPayment: Math.round(monthlyPayment),
    totalPaid: Math.round(totalPaid),
  };
}
