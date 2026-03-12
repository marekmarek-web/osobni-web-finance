/**
 * Analýza rizik – kritické mezery firmy a jednatele
 */
(function(global) {
  const RISK_KEYS = ['property', 'interruption', 'liability', 'director', 'fleet', 'cyber'];
  const RISK_LABELS = {
    property: 'Majetek',
    interruption: 'Přerušení provozu',
    liability: 'Odpovědnost',
    director: 'D&O',
    fleet: 'Flotila',
    cyber: 'Kyber'
  };

  /**
   * Firemní rizika – skóre a mezery
   */
  function getCompanyRiskGaps(risks) {
    const r = risks || {};
    const covered = RISK_KEYS.filter(k => r[k]).length;
    const gaps = RISK_KEYS.filter(k => !r[k]).map(k => RISK_LABELS[k] || k);
    return {
      covered,
      total: RISK_KEYS.length,
      gaps,
      score: covered + '/' + RISK_KEYS.length
    };
  }

  /**
   * Jednatel – kritické mezery (teaser)
   * Smrt, invalidita, PN – jen identifikace mezer, ne konkrétní produkt
   */
  function getDirectorGaps(directorIns, netIncome, isOsvc) {
    const cfg = (typeof DIAG_CONFIG !== 'undefined') ? DIAG_CONFIG.director : { deathMultiplier: 5, invalidityMultiplier: 3, sickLeavePercent: 0.6 };
    const yearly = (netIncome || 0) * 12;
    const recDeath = yearly * (cfg.deathMultiplier || 5);
    const recInv = yearly * (cfg.invalidityMultiplier || 3);
    const recSick = isOsvc ? 0 : Math.round(netIncome * (cfg.sickLeavePercent || 0.6) / 30);

    const gaps = [];
    if ((directorIns.death || 0) < recDeath * 0.5) gaps.push('zajištění příjmů při úmrtí');
    if ((directorIns.invalidity || 0) < recInv * 0.5) gaps.push('invalidita');
    if (isOsvc) gaps.push('pracovní neschopnost (OSVČ bez státní PN)');
    else if ((directorIns.sick || 0) < recSick * 0.5) gaps.push('pracovní neschopnost');

    return {
      gaps,
      recommended: { death: recDeath, invalidity: recInv, sickPerDay: recSick }
    };
  }

  global.DIAG_RISKS = {
    getCompanyRiskGaps,
    getDirectorGaps,
    RISK_KEYS,
    RISK_LABELS
  };
})(typeof window !== 'undefined' ? window : this);
