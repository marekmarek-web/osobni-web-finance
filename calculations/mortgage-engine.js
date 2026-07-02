/**
 * Hypoteční kalkulačka – výpočetní engine.
 * state.loan = hodnota nemovitosti; borrowingAmount = property × LTV%.
 */
(function (global) {
  function getPropertyValue(state) {
    return state.loan || 0;
  }

  function getBorrowingAmount(state) {
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

  function getOwnResources(state) {
    if (state.product !== 'mortgage') {
      return state.own || 0;
    }

    const propertyValue = getPropertyValue(state);
    const borrowingAmount = getBorrowingAmount(state);
    return Math.max(0, propertyValue - borrowingAmount);
  }

  function getCalculatedLtv(state) {
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

  function syncOwnFromLtv(state) {
    const propertyValue = getPropertyValue(state);
    if (propertyValue <= 0 || state.ltvLock == null) {
      return state.own || 0;
    }

    const borrowingAmount = Math.round((propertyValue * state.ltvLock) / 100);
    return Math.max(0, propertyValue - borrowingAmount);
  }

  function calculateMonthlyPayment(principal, annualRatePercent, termYears) {
    if (principal <= 0) return 0;
    const r = annualRatePercent / 100 / 12;
    const n = termYears * 12;
    if (r <= 0) return principal / n;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function calculateMortgageRate(state, banksData, options) {
    const opts = options || {};
    const calcLtv = getCalculatedLtv(state);
    let penalty = 0;

    if (calcLtv > 90) penalty += 1.5;
    if (state.mortgageType === 'american') penalty += 1.5;
    if (state.mortgageType === 'investment') penalty += 0.4;
    if (state.type === 'refi') penalty -= 0.2;

    const base = Math.min(...(banksData || []).map((b) => b.baseRate));
    let finalRate = base + penalty;
    if (finalRate < 4.19) finalRate = 4.19;

    const fixYears = opts.fixYears != null ? opts.fixYears : state.fix || 5;
    if (fixYears < 5) finalRate += 0.1;
    else if (fixYears > 7) {
      finalRate = Math.max(4.19, finalRate - 0.15);
    }

    return { finalRate, calcLtv };
  }

  function calculateLoanRate(state, banksData) {
    let typeMod = 0;
    if (state.loanType === 'auto') typeMod = -1.0;
    if (state.loanType === 'consolidation') typeMod = -0.5;

    const avgRate =
      (banksData || []).reduce((acc, b) => acc + (b.loanRate || 7.0), 0) /
      Math.max(1, (banksData || []).length);

    return avgRate + typeMod;
  }

  function calculate(state, banksData, options) {
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

  global.MORTGAGE_ENGINE = {
    getPropertyValue,
    getBorrowingAmount,
    getOwnResources,
    getCalculatedLtv,
    syncOwnFromLtv,
    calculateMonthlyPayment,
    calculateMortgageRate,
    calculateLoanRate,
    calculate,
  };
})(typeof window !== 'undefined' ? window : this);
