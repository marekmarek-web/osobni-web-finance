/* Výpočty převzaté 1:1 z živých kalkulaček marek-marek.cz.
   Hypotéka a život používají původní enginy (mortgage-engine.js, insurance-computation.js).
   Investice, penze a historická simulace jsou zde přepsané z inline skriptů živých stránek beze změny vzorců. */
(function (g) {
  // Sazby z živé stránky: Hypoindex.cz, listopad 2025. Před nasazením aktualizovat.
  const BANKS = [
    { id: 'ucb', name: 'UniCredit Bank', baseRate: 4.29, loanRate: 6.5 },
    { id: 'rb', name: 'Raiffeisenbank', baseRate: 4.34, loanRate: 5.9 },
    { id: 'csob', name: 'ČSOB / Hypoteční banka', baseRate: 4.79, loanRate: 7.9 },
    { id: 'kb', name: 'Komerční banka', baseRate: 4.59, loanRate: 6.9 },
    { id: 'cs', name: 'Česká spořitelna', baseRate: 4.59, loanRate: 7.5 },
    { id: 'mbank', name: 'mBank', baseRate: 4.79, loanRate: 6.2 },
  ];

  function bankOffers(state, borrowing, ltv) {
    const months = state.term * 12;
    const list = BANKS.map((bank) => {
      let rate;
      if (state.product === 'mortgage') {
        let p = 0;
        if (ltv > 90) p += 1.5;
        if (state.mortgageType === 'american') p += 1.5;
        if (state.mortgageType === 'investment') p += 0.4;
        if (state.type === 'refi') p -= 0.2;
        if (state.fix < 5) p += 0.1;
        else if (state.fix > 7) p -= 0.15;
        rate = Math.max(4.19, bank.baseRate + p);
      } else {
        let mod = 0;
        if (state.loanType === 'auto') mod = -1.0;
        if (state.loanType === 'consolidation') mod = -0.5;
        rate = (bank.loanRate || 6.9) + mod;
      }
      const r = rate / 100 / 12;
      const pmt = borrowing > 0 ? Math.round((borrowing * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)) : 0;
      return { name: bank.name, rate, pmt };
    });
    return list.sort((a, b) => a.rate - b.rate);
  }

  // Zůstatek hypotéky po letech: měří úmor pro graf, vzorec anuity je stejný jako v enginu.
  function amortization(principal, rate, term) {
    const r = rate / 100 / 12, n = term * 12;
    const pmt = r > 0 ? (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : principal / n;
    const out = [{ year: 0, balance: principal, interest: 0 }];
    let bal = principal, totI = 0;
    for (let y = 1; y <= term; y++) {
      for (let m = 0; m < 12; m++) { const i = bal * r; totI += i; bal = Math.max(0, bal + i - pmt); }
      out.push({ year: y, balance: Math.round(bal), interest: Math.round(totI) });
    }
    return out;
  }

  const PROFILES = [
    { id: 'konzervativni', short: 'Konzervativní', name: 'Konzervativní investor', rate: 5,
      description: 'Stabilní zhodnocení s menším kolísáním. Pro opatrné investory. Využívá dluhopisy a nemovitostní fondy.',
      composition: [{ name: 'Dluhopisy', value: 70 }, { name: 'Nemovitostní fondy', value: 20 }, { name: 'Akcie', value: 10 }] },
    { id: 'vyvazeny', short: 'Vyvážená', name: 'Vyvážený investor', rate: 7,
      description: 'Zlatá střední cesta. Kombinace stability dluhopisů, růstového potenciálu akcií a nemovitostních fondů.',
      composition: [{ name: 'Akcie (ETF)', value: 50 }, { name: 'Dluhopisy', value: 35 }, { name: 'Nemovitostní fondy', value: 15 }] },
    { id: 'dynamicky', short: 'Dynamická', name: 'Dynamický investor', rate: 9,
      description: 'Vyšší potenciál výnosu, vyšší kolísání. Strategie pro dlouhodobé cíle.',
      composition: [{ name: 'Globální akcie', value: 90 }, { name: 'Dluhopisy', value: 10 }] },
  ];

  function invest({ initial, monthly, years, rate }) {
    let bal = initial, inv = initial;
    const rows = [{ year: 0, invested: initial, balance: initial }];
    for (let i = 1; i <= years; i++) {
      for (let m = 0; m < 12; m++) { bal += bal * (rate / 100 / 12) + monthly; inv += monthly; }
      rows.push({ year: i, invested: Math.round(inv), balance: Math.round(bal) });
    }
    return { rows, balance: Math.round(bal), invested: Math.round(inv), gain: Math.round(bal - inv), gainPct: inv > 0 ? ((bal - inv) / inv) * 100 : 0 };
  }

  const HIST = [
    ['1995-01',459,380,100,100],['1996-06',670,385,108,106],['1998-01',970,290,115,112],['1999-12',1469,290,118,120],
    ['2001-09',1040,290,125,128],['2002-10',776,315,135,132],['2004-01',1130,410,138,140],['2007-10',1565,750,145,155],
    ['2008-09',1100,830,148,158],['2009-03',676,920,152,156],['2010-06',1030,1240,158,162],['2011-08',1120,1820,165,168],
    ['2013-01',1498,1660,170,175],['2015-01',2000,1280,175,185],['2018-09',2900,1200,178,205],['2020-02',3380,1550,185,215],
    ['2020-03',2300,1470,180,214],['2020-08',3500,2060,190,218],['2021-12',4766,1800,185,225],['2022-06',3785,1810,165,228],
    ['2022-10',3580,1650,155,230],['2023-12',4700,2040,162,245],['2024-04',5200,2350,164,250],
  ].map(([date, sp500, gold, bonds, re]) => ({ date, sp500, gold, bonds, re }));

  function backtest(monthly, startYear) {
    const start = new Date(startYear + '-01-01');
    let idx = HIST.findIndex((d) => new Date(d.date) >= start); if (idx < 0) idx = 0;
    let inv = 0; const u = { sp500: 0, gold: 0, bonds: 0, re: 0 }; const rows = [];
    const diff = (a, b) => { let m = (b.getFullYear() - a.getFullYear()) * 12; m -= a.getMonth(); m += b.getMonth(); return m <= 0 ? 0 : m; };
    for (let i = idx; i < HIST.length; i++) {
      const pt = HIST[i], d = new Date(pt.date);
      let mp = i > idx ? diff(new Date(HIST[i - 1].date), d) : 1; if (mp < 1) mp = 1;
      const dep = monthly * mp; inv += dep;
      ['sp500', 'gold', 'bonds', 're'].forEach((k) => { u[k] += dep / pt[k]; });
      rows.push({ date: pt.date, invested: inv, sp500: Math.round(u.sp500 * pt.sp500), gold: Math.round(u.gold * pt.gold), bonds: Math.round(u.bonds * pt.bonds), re: Math.round(u.re * pt.re) });
    }
    return rows;
  }

  function pension({ age, retireAge, salary, rent, scenario }) {
    let base;
    if (salary < 20000) base = 0.55; else if (salary < 40000) base = 0.48; else if (salary < 60000) base = 0.42; else if (salary < 80000) base = 0.35; else base = 0.28;
    let est = salary * base;
    const yrs = retireAge - age;
    if (scenario === 'realistic') est *= 1 - yrs * 0.008;
    if (retireAge > 65) est *= 1 + (retireAge - 65) * 0.015;
    else if (retireAge < 65) est *= 1 - (65 - retireAge) * 0.05;
    if (est < 0) est = 0;
    est = Math.round(est);
    const gap = Math.max(0, rent - est);
    let monthly = 0, target = 0;
    if (yrs > 0) {
      const real = 1.07 / 1.02 - 1;
      const rm = 0.015 / 12, nm = 240;
      target = (gap * (1 - Math.pow(1 + rm, -nm))) / rm;
      const am = real / 12, mo = yrs * 12;
      monthly = (target * am) / (Math.pow(1 + am, mo) - 1);
    }
    return { estimate: est, gap: Math.round(gap), monthly: Math.round(monthly), target: Math.round(target), years: yrs };
  }

  g.MM_CALC = { BANKS, bankOffers, amortization, PROFILES, invest, backtest, pension };
})(window);
