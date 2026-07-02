/**
 * Jednotná slovní zásoba CTA napříč webem.
 * Primary = konzultace / kontakt s člověkem.
 * Secondary = nástroje, čtení, nízký závazek.
 */

/** Hlavní konverzní text (šipka » je v komponentách jako ikona, viz životní kalkulačka). */
export const CTA_PRIMARY_TAILORED = "Chci řešení na míru" as const;

export const cta = {
  /** Text + styl modrého CTA na stránkách kalkulaček (panely výsledků) — nesdělujte s hlavičkou/blogem. */
  primaryTailored: CTA_PRIMARY_TAILORED,

  /** Header, mobilní drawer */
  headerPrimary: "Domluvit konzultaci",

  /** Sekce Můj postup (homepage) */
  homeProcessPrimary: "Domluvit úvodní konzultaci",

  /** Investiční projekce – odkaz na kalkulačku */
  homeProjectionCalc: "Spočítat orientační výnos",

  /** Homepage lead – odeslání kroku 2 */
  homeLeadSubmit: "Odeslat a domluvit krátký hovor",

  /** Kalkulačkové modaly – odeslání */
  calculatorSubmit: "Odeslat a domluvit zpětný kontakt",

  /** Obecné odeslání zprávy (kontakt, patička) */
  messageSubmit: "Odeslat zprávu",

  /** Blog – seznam */
  blogSeeAll: "Všechny články",

  /** Blog – článek – hlavní CTA v závěru */
  articleConsultTopic: "Domluvit konzultaci k tématu",

  /** Blog – článek – vedlejší */
  articleSeeCalculators: "Prohlédnout kalkulačky",
} as const;
