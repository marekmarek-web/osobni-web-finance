import {
  calculateMonthlyPayment,
  getCalculatedLtv,
  type BankRate,
  type MortgageState,
} from './mortgage-engine';

export interface BankOffer {
  bank: BankRate;
  rate: number;
  monthlyPayment: number;
  delayMs: number;
}

export function calculateBankOffers(
  state: MortgageState,
  banksData: BankRate[],
  borrowingAmount: number,
  months: number,
  fixYears: number
): BankOffer[] {
  const sorted = [...banksData].sort((a, b) => {
    if (state.product === 'mortgage') return a.baseRate - b.baseRate;
    return (a.loanRate || 10) - (b.loanRate || 10);
  });

  const ltv = getCalculatedLtv(state);

  return sorted.map((bank, index) => {
    let bankRateVal = 0;

    if (state.product === 'mortgage') {
      let p = 0;
      if (ltv > 90) p += 1.5;
      if (state.mortgageType === 'american') p += 1.5;
      if (state.mortgageType === 'investment') p += 0.4;
      if (state.type === 'refi') p -= 0.2;
      if (fixYears < 5) p += 0.1;
      else if (fixYears > 7) p -= 0.15;

      bankRateVal = bank.baseRate + p;
      if (bankRateVal < 4.19) bankRateVal = 4.19;
    } else {
      let mod = 0;
      if (state.loanType === 'auto') mod = -1.0;
      if (state.loanType === 'consolidation') mod = -0.5;
      bankRateVal = (bank.loanRate || 6.9) + mod;
    }

    const termYears = months / 12;
    const monthlyPayment = Math.round(
      calculateMonthlyPayment(borrowingAmount, bankRateVal, termYears)
    );

    return {
      bank,
      rate: bankRateVal,
      monthlyPayment,
      delayMs: index * 70,
    };
  });
}
