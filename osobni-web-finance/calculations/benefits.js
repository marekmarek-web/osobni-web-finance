/**
 * Výpočet orientační úspory přes benefity (DIP/DPS/IŽP)
 * Parametrické hodnoty z config.js
 */
(function(global) {
  const cfg = (typeof DIAG_CONFIG !== 'undefined') ? DIAG_CONFIG : { benefits: { odvodyRate: 0.338, employerMultiplier: 1.338, netMultiplier: 0.67 }, osvcMaxInvestment: 48000 };

  function fmt(n) {
    return n ? Math.round(n).toLocaleString('cs-CZ') + ' Kč' : '—';
  }

  /**
   * Orientation savings for SRO benefit program
   * @param {number} amountPerPerson - monthly contribution per employee
   * @param {number} employeeCount - number of employees receiving benefit
   * @param {boolean} hasCat3 - has employees in 3rd category
   * @returns {{yearlySavings: number, wageEquivalent: number, benefitCost: number, wageCost: number}}
   */
  function calcBenefitSavings(amountPerPerson, employeeCount, hasCat3) {
    const amount = amountPerPerson || cfg.benefits?.defaultAmountPerPerson || 1000;
    const count = employeeCount || 0;
    const mult = cfg.benefits?.employerMultiplier || 1.338;
    const netMult = cfg.benefits?.netMultiplier || 0.67;

    const benefitCost = amount * count * 12;
    const grossEquiv = amount / netMult;
    const wageCost = grossEquiv * mult * count * 12;
    const yearlySavings = wageCost - benefitCost;

    return {
      yearlySavings,
      wageEquivalent: grossEquiv * count,
      benefitCost,
      wageCost,
      hasCat3: !!hasCat3
    };
  }

  /**
   * OSVČ tax return for DIP/DPS investment
   */
  function calcOsvcTaxSavings(investment, taxRate) {
    const max = cfg.osvcMaxInvestment ?? cfg.benefits?.osvcMaxInvestment ?? 48000;
    const inv = Math.min(max, Math.max(0, investment || 0));
    const rate = taxRate || 0.15;
    return inv * rate;
  }

  global.DIAG_BENEFITS = {
    calcBenefitSavings,
    calcOsvcTaxSavings,
    fmt
  };
})(typeof window !== 'undefined' ? window : this);
