/**
 * Konfigurace Diagnostiky s.r.o. pro jednatele
 * Parametrické hodnoty pro výpočty benefitů a rizik
 */
const DIAG_CONFIG = {
  // Benefit – parametry pro orientační úsporu DIP/DPS/IŽP
  benefits: {
    /** Sazba odvodů (33,8 %) – hrubá mzda vs. benefit */
    odvodyRate: 0.338,
    /** Koeficient nákladu zaměstnavatele (1 + odvody) */
    employerMultiplier: 1.338,
    /** Koeficient čisté mzdy pro zaměstnance (po odvodech) */
    netMultiplier: 0.67,
    /** Max. investice OSVČ do DIP/DPS pro daňový odpočet (Kč) */
    osvcMaxInvestment: 48000,
    /** Výchozí měsíční příspěvek na osobu (Kč) */
    defaultAmountPerPerson: 1000
  },

  // 3. kategorie zaměstnanců – flag pro zvýraznění v reportu
  cat3: {
    /** Má firma zaměstnance ve 3. kategorii? (vyšší riziko Úrazového pojištění) */
    enabled: true,
    /** Label pro report */
    label: '3. kategorie (fyzicky náročné práce)'
  },

  // Jednatel – doporučené násobky pro pojistné částky
  director: {
    deathMultiplier: 5,
    invalidityMultiplier: 3,
    sickLeavePercent: 0.6,
    /** Počet pracovních dní v měsíci pro výpočet denního odškodného */
    workingDaysPerMonth: 22
  },

  // Loga fondů do PDF – lokální obrázky z /images/ (exaktní cesty)
  images: {
    basePath: './images/',
    logoFiles: [
      'AlgoImperial.png',
      'Creif.png',
      'ATRIS.png',
      'Fidelity.png',
      'iShares.png',
      'PENTA.png',
      'Conseq.png'
    ]
  },

  // Cíle firmy pro benefity (Step 2)
  benefitGoals: [
    { value: 'fluktuace', label: 'Snížit fluktuaci' },
    { value: 'nabor', label: 'Nábor' },
    { value: 'danova', label: 'Daňová optimalizace' },
    { value: 'cat3', label: 'Musíme kvůli 3. kategorii' }
  ],

  // Podíl 3. kategorie (Step 1)
  cat3Options: [
    { value: '0', label: '0' },
    { value: '1-5', label: '1–5' },
    { value: '6-20', label: '6–20' },
    { value: '20+', label: '20+' }
  ]
};
