/**
 * Generátor PDF reportu – Diagnostika s.r.o. pro jednatele
 * 6–8 stran, A4, header/footer, brand line, stejný vizuál jako fa-sro-main
 * Texty: diagnostika + mezery + další krok (teaser, ne kompletní recept)
 */
(function(global) {
  function fmt(n) {
    return n ? Math.round(n).toLocaleString('cs-CZ') + ' Kč' : '—';
  }
  function fmtShort(n) {
    if (!n) return '—';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' mil.';
    if (n >= 1e3) return Math.round(n / 1e3) + ' tis.';
    return n.toLocaleString('cs-CZ');
  }

  function hdr(t, today, companyName) {
    return '<div class="pdf-header"><span style="font-weight:bold;color:#0f172a;">' + t + '</span><span style="color:#64748b;">Vypracováno: <strong>' + today + '</strong> | ' + (companyName || 'Společnost') + '</span></div>';
  }
  function ftr(p) {
    return '<div class="footer"><span>Diagnostika s.r.o. pro jednatele</span><span>Strana ' + p + '</span></div>';
  }

  /**
   * Vytvoří HTML reportu (6–8 stran)
   * @param {Object} data - data z wizardu
   * @param {Object} calc - výsledky z calculations (benefits, risks)
   */
  function buildReportHTML(data, calc) {
    var d = data || {};
    var today = new Date().toLocaleDateString('cs-CZ');
    var companyName = d.company?.name || 'Společnost';
    var directorName = d.director?.name || 'Jednatel';
    var c = d.company || {};
    var f = d.finance || {};
    var b = d.benefits || {};
    var r = d.risks || {};
    var di = d.directorIns || {};
    var dir = d.director || {};
    var isOsvc = d.entityType === 'osvc-pausal' || d.entityType === 'osvc-tax';

    var employees = c.employees || 0;
    var cat3Val = c.cat3 || '0';
    var hasCat3 = cat3Val !== '0' && cat3Val !== '';
    var revenue = f.revenue || 0;
    var profit = f.profit || 0;
    var reserve = f.reserve || 0;
    var loanPayment = f.loanPayment || 0;
    var netIncome = dir.netIncome || 0;
    var wageFund = employees * (c.avgWage || 45000);

    var benefitResult = calc?.benefitSavings || {};
    var riskResult = calc?.companyRisks || {};
    var directorResult = calc?.directorGaps || {};

    var pages = [];

    // Strana 1 – Titulní
    pages.push(
      '<section class="pdf-page" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">' +
      '<div style="width:100px;height:100px;background:linear-gradient(135deg,#0a0f29,#1e3a6e);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;margin-bottom:40px;"><i class="fas fa-building"></i></div>' +
      '<h1 class="h1" style="font-size:42px;">DIAGNOSTIKA</h1>' +
      '<p style="font-size:18px;color:#64748b;margin-bottom:8px;">s.r.o. pro jednatele</p>' +
      '<p style="font-size:14px;color:#94a3b8;margin-bottom:50px;">Orientační přehled + mezery + doporučené kroky</p>' +
      '<div style="background:#f8fafc;padding:40px 60px;border-radius:16px;border:1px solid #e2e8f0;">' +
      '<p style="color:#64748b;font-size:10px;text-transform:uppercase;margin-bottom:6px;">Společnost</p>' +
      '<h2 style="font-size:26px;color:#0f172a;margin:0 0 24px 0;">' + companyName + '</h2>' +
      '<p style="color:#64748b;font-size:10px;text-transform:uppercase;margin-bottom:6px;">Jednatel</p>' +
      '<h3 style="font-size:20px;color:#0f172a;margin:0 0 24px 0;">' + directorName + '</h3>' +
      '<p style="color:#64748b;font-size:10px;text-transform:uppercase;margin-bottom:6px;">Datum</p>' +
      '<p style="font-size:16px;color:#0f172a;margin:0;">' + today + '</p>' +
      '</div>' +
      ftr(1) +
      '</section>'
    );

    // Strana 2 – KPI + orientační úspora benefitů
    var savingsText = benefitResult.yearlySavings > 0
      ? 'Orientační potenciál úspor na odvodech/daních přes benefity: ' + fmt(benefitResult.yearlySavings) + ' ročně.'
      : 'Vyplňte benefity pro výpočet orientační úspory.';
    if (hasCat3) savingsText += ' Firma má zaměstnance ve 3. kategorii – doporučeno prověřit Úrazové pojištění.';

    pages.push(
      '<section class="pdf-page">' + hdr('KLÍČOVÉ UKAZATELE', today, companyName) +
      '<div class="h2">Přehled firmy</div>' +
      '<div class="kpi">' +
      '<div class="box"><span class="lbl">Zaměstnanci</span><div class="val" style="color:#0B3A7A;">' + employees + '</div></div>' +
      '<div class="box"><span class="lbl">3. kategorie</span><div class="val">' + cat3Val + '</div></div>' +
      '<div class="box"><span class="lbl">Mzdový fond</span><div class="val">' + fmtShort(wageFund) + '</div><span class="sub">měsíčně</span></div>' +
      '<div class="box"><span class="lbl">Roční tržby</span><div class="val">' + fmtShort(revenue) + '</div></div>' +
      '<div class="box"><span class="lbl">Roční zisk</span><div class="val" style="color:#10b981;">' + fmtShort(profit) + '</div></div>' +
      '<div class="box"><span class="lbl">Cash rezerva</span><div class="val">' + fmt(reserve) + '</div></div>' +
      '</div>' +
      '<div class="h2">Orientační potenciál úspor – benefity</div>' +
      '<div class="recommendation">' + savingsText + '</div>' +
      '<p style="font-size:8pt;color:#64748b;">Diagnostika – orientační odhad. Pro přesný výpočet kontaktujte poradce.</p>' +
      ftr(2) +
      '</section>'
    );

    // Strana 3 – Kritické mezery firmy
    var riskItems = [
      { key: 'property', name: 'Majetek', icon: 'fa-building' },
      { key: 'interruption', name: 'Přerušení provozu', icon: 'fa-pause-circle' },
      { key: 'liability', name: 'Odpovědnost', icon: 'fa-gavel' },
      { key: 'director', name: 'D&O', icon: 'fa-user-tie' },
      { key: 'fleet', name: 'Flotila', icon: 'fa-truck' },
      { key: 'cyber', name: 'Kyber', icon: 'fa-shield-virus' }
    ];
    var riskMatrix = riskItems.map(function(item) {
      var covered = r[item.key];
      return '<div class="risk-item ' + (covered ? 'covered' : 'not-covered') + '"><div style="font-size:14pt;margin-bottom:2mm;"><i class="fas ' + item.icon + '" style="color:' + (covered ? '#10b981' : '#ef4444') + ';"></i></div><div style="font-size:8pt;font-weight:600;">' + item.name + '</div><div style="font-size:7pt;color:' + (covered ? '#10b981' : '#ef4444') + ';">' + (covered ? 'Kryto' : 'Nekryto') + '</div></div>';
    }).join('');

    var gapsList = (riskResult.gaps || []).length > 0
      ? '<div class="recommendation" style="background:#fef2f2;border-color:#ef4444;"><strong>Kritické mezery:</strong> ' + (riskResult.gaps || []).join(', ') + '.</div>'
      : '';

    pages.push(
      '<section class="pdf-page">' + hdr('KRITICKÉ MEZERY V OCHRANĚ FIRMY', today, companyName) +
      '<div class="h2">Risk Gap analýza</div>' +
      '<div class="kpi"><div class="box" style="flex:2;"><span class="lbl">Pokrytí rizik</span><div class="val" style="color:' + ((riskResult.covered || 0) >= 4 ? '#10b981' : '#ef4444') + ';">' + (riskResult.score || '0/6') + '</div></div></div>' +
      '<div class="risk-matrix">' + riskMatrix + '</div>' +
      gapsList +
      '<p style="font-size:8pt;color:#64748b;margin-top:4mm;">Diagnostika – mezery. Další krok: prověřit s poradcem konkrétní produkt a limit.</p>' +
      ftr(3) +
      '</section>'
    );

    // Strana 4 – Majetek (pokud jsou data)
    var assetText = 'Orientační přehled majetku a flotily – vyplňte v diagnostice pro detail.';
    pages.push(
      '<section class="pdf-page">' + hdr('MAJETEK A FLOTILA', today, companyName) +
      '<div class="h2">Přehled</div>' +
      '<p style="font-size:9pt;margin-bottom:4mm;">' + assetText + '</p>' +
      '<div class="recommendation">Další krok: inventura majetku, strojů a vozidel – zhodnotit pojistné limity.</div>' +
      ftr(4) +
      '</section>'
    );

    // Strana 5 – Jednatel – kritické mezery (teaser)
    var dirGaps = directorResult.gaps || [];
    var dirGapsText = dirGaps.length > 0
      ? 'Identifikované mezery: ' + dirGaps.join(', ') + '.'
      : 'Žádné zjevné mezery identifikovány.';
    pages.push(
      '<section class="pdf-page">' + hdr('KRITICKÉ MEZERY U JEDNATELE', today, companyName) +
      '<div class="h2">Zajištění příjmů</div>' +
      '<p style="font-size:9pt;">' + dirGapsText + '</p>' +
      '<div class="h2">Doporučené další kroky</div>' +
      '<ul style="font-size:9pt;margin-left:4mm;">' +
      '<li>Prověřit krytí smrt, invalidita, pracovní neschopnost</li>' +
      '<li>Konzultace s poradcem pro konkrétní produkt</li>' +
      '</ul>' +
      '<p style="font-size:8pt;color:#64748b;margin-top:4mm;">Diagnostika – teaser. Ne kompletní recept. Konzultace doporučena.</p>' +
      ftr(5) +
      '</section>'
    );

    // Strana 6 – Další kroky
    pages.push(
      '<section class="pdf-page">' + hdr('DOPORUČENÉ DALŠÍ KROKY', today, companyName) +
      '<div class="h2">Bez přesných produktů a částek</div>' +
      '<p style="font-size:9pt;margin-bottom:4mm;">Aby diagnostiku nebylo snadné okopírovat bez poradce, uvádíme jen směr:</p>' +
      '<ul style="font-size:9pt;margin-left:4mm;line-height:1.8;">' +
      '<li>Vyhodnotit benefity (DIP/DPS/IŽP) – orientační úspora viz strana 2</li>' +
      '<li>Doplnit krytí rizik – viz strana 3</li>' +
      '<li>Prověřit pojistku jednatele – viz strana 5</li>' +
      '<li>Rezervovat 15min call pro detailní rozbor</li>' +
      '</ul>' +
      '<div class="recommendation">Pro konkrétní plán a produkty kontaktujte svého poradce.</div>' +
      ftr(6) +
      '</section>'
    );

    // Strana 7 – Loga (pokud jsou)
    var logoPlaceholders = '';
    var cfg = typeof DIAG_CONFIG !== 'undefined' ? DIAG_CONFIG.images : null;
    var logoFiles = (cfg && cfg.logoFiles) ? cfg.logoFiles : [];
    var basePath = ((cfg && cfg.basePath) || './images/').replace(/\/?$/, '/');
    logoFiles.forEach(function(fname) {
      logoPlaceholders += '<img data-logo="' + fname + '" src="' + basePath + fname + '" alt="" style="height:12mm;object-fit:contain;">';
    });
    if (logoPlaceholders) {
      pages.push(
        '<section class="pdf-page">' + hdr('SPOLUPRACUJÍCÍ PARTNEŘI', today, companyName) +
        '<div class="h2">Doporučené produkty</div>' +
        '<p style="font-size:8pt;color:#64748b;margin-bottom:4mm;">V rámci portfolia lze prověřit nabídku níže.</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8mm;align-items:center;margin:6mm 0;">' + logoPlaceholders + '</div>' +
        ftr(7) +
        '</section>'
      );
    }

    return '<div class="pdf">' + pages.join('') + '</div>';
  }

  global.DIAG_REPORT = {
    buildReportHTML,
    fmt,
    fmtShort
  };
})(typeof window !== 'undefined' ? window : this);
