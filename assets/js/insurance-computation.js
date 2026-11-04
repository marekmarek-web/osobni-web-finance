/**
 * Výpočet životního pojištění dle FP modelu (finanční plánování).
 * Sdílená logika pro statické HTML kalkulačky a budoucí Next.js migraci.
 */
(function (global) {
  const GROSS_FROM_NET_FACTOR = 0.74;
  const RENT_RATE = 0.06;
  const RENT_MULTIPLIER = 200;
  const INVALIDITY_COST_INCREASE = 1.2;
  const TN_PROGRESS = 8;

  const RH1 = 1633;
  const RH2 = 2449;
  const RH3 = 4897;
  const MAX_REDUCED_DVZ = 2419;

  const PARTNER_LUMP_SUM = 500000;
  const SURVIVOR_STATE_SUPPORT = 10000;
  const DEFAULT_CHILD_AGE = 10;

  function roundTo100k(val) {
    return Math.ceil(Math.max(0, val) / 100000) * 100000;
  }

  function calculateReducedDVZ(dvz) {
    let reduced = 0;
    if (dvz <= RH1) {
      reduced = dvz * 0.9;
    } else if (dvz <= RH2) {
      reduced = RH1 * 0.9 + (dvz - RH1) * 0.6;
    } else if (dvz <= RH3) {
      reduced = RH1 * 0.9 + (RH2 - RH1) * 0.6 + (dvz - RH2) * 0.3;
    } else {
      reduced = RH1 * 0.9 + (RH2 - RH1) * 0.6 + (RH3 - RH2) * 0.3;
    }
    return Math.min(reduced, MAX_REDUCED_DVZ);
  }

  function estimateInvalidityPension(net, isOsvc) {
    const factor = isOsvc ? 0.7 : 1.0;
    let pension = 0;
    if (net <= 20000) pension = Math.round(net * 0.45);
    else if (net <= 40000) pension = Math.round(9000 + (net - 20000) * 0.35);
    else if (net <= 60000) pension = Math.round(16000 + (net - 40000) * 0.25);
    else pension = Math.round(21000 + (net - 60000) * 0.15);
    return Math.round(pension * factor);
  }

  function calculateSicknessBenefit(netIncome, isOsvc) {
    if (isOsvc) {
      return { sicknessDaily: 0, sicknessMonthly: 0, pnGapMonthly: netIncome };
    }

    const grossIncome = Math.round(netIncome / GROSS_FROM_NET_FACTOR);
    const dvz = Math.round((grossIncome * 12) / 365);
    const reducedDVZ = calculateReducedDVZ(dvz);
    const sicknessDaily = Math.round(reducedDVZ * 0.66);
    const sicknessMonthly = sicknessDaily * 30;
    const pnGapMonthly = Math.max(0, netIncome - sicknessMonthly);

    return { sicknessDaily, sicknessMonthly, pnGapMonthly, dvz, reducedDVZ };
  }

  function getTnBase(netIncome) {
    if (netIncome >= 100000) return 3000000;
    if (netIncome >= 50000) return 2000000;
    if (netIncome >= 30000) return 1500000;
    return 1000000;
  }

  function computeChildrenLumpSum(childrenCount, clientAge) {
    if (childrenCount <= 0) return 0;

    const currentYear = new Date().getFullYear();
    const clientBirthYear = currentYear - clientAge;
    let total = 0;

    for (let i = 0; i < childrenCount; i += 1) {
      const childAge = DEFAULT_CHILD_AGE;
      const yearsTo18 = Math.max(0, 18 - childAge);
      total += 200000 + yearsTo18 * 12 * 5000;
    }

    return total;
  }

  /**
   * @param {object} input
   * @param {number} input.age
   * @param {number} input.netIncome
   * @param {number} input.expenses
   * @param {number} input.liabilities
   * @param {number} input.reserves
   * @param {number} input.children
   * @param {boolean} input.hasSpouse
   * @param {boolean} [input.isOsvc=false]
   */
  function computeInsurance(input) {
    const age = input.age || 35;
    const netIncome = input.netIncome || 0;
    const expenses = input.expenses || 0;
    const liabilities = input.liabilities || 0;
    const reserves = input.reserves || 0;
    const children = input.children || 0;
    const hasSpouse = !!input.hasSpouse;
    const isOsvc = !!input.isOsvc;

    const invalidityNeedBase = Math.max(expenses, netIncome);
    const invalidityNeedMonthly = Math.round(invalidityNeedBase * INVALIDITY_COST_INCREASE);
    const statePensionD3 = estimateInvalidityPension(netIncome, isOsvc);
    const ownAssetRentaMonthly = Math.round((reserves * RENT_RATE) / 12);
    const invalidityGapMonthly = Math.max(
      0,
      invalidityNeedMonthly - statePensionD3 - ownAssetRentaMonthly
    );
    const invalidityCapitalRaw = invalidityGapMonthly * RENT_MULTIPLIER;
    const capitalD3 = roundTo100k(invalidityCapitalRaw);
    const gapD3Renta = Math.round(capitalD3 / RENT_MULTIPLIER);

    const sickness = calculateSicknessBenefit(netIncome, isOsvc);
    const pnDailyNeed = Math.ceil((sickness.pnGapMonthly / 30) / 100) * 100;

    const tnBase = getTnBase(netIncome);
    const tnProgression = tnBase * TN_PROGRESS;

    const yearsTo65 = Math.max(0, 65 - age);
    const partnerLumpSum = hasSpouse ? PARTNER_LUMP_SUM : 0;
    const childrenLumpSum = computeChildrenLumpSum(children, age);
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

    return {
      deathCoverage,
      capitalD3,
      gapD3Renta,
      invalidityGapMonthly,
      invalidityNeedMonthly,
      statePensionD3,
      pnDailyNeed,
      tnBase,
      tnProgression,
      chartData: [
        {
          label: 'PN (měs.)',
          prijem: netIncome,
          stat: sickness.sicknessMonthly,
          chybi: sickness.pnGapMonthly,
        },
        {
          label: 'Invalidita (měs.)',
          prijem: netIncome,
          stat: statePensionD3,
          chybi: invalidityGapMonthly,
        },
      ],
    };
  }

  global.INSURANCE_COMPUTATION = {
    computeInsurance,
    roundTo100k,
    constants: {
      GROSS_FROM_NET_FACTOR,
      RENT_MULTIPLIER,
      INVALIDITY_COST_INCREASE,
      TN_PROGRESS,
      RH1,
      RH2,
      RH3,
      PARTNER_LUMP_SUM,
    },
  };
})(typeof window !== 'undefined' ? window : this);
