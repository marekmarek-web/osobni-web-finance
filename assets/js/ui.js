/* Sdílené chování: menu, formuláře, grafy, kalkulačky a průvodce. Bez knihoven. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const kc = (v) => nf.format(Math.round(v)) + ' Kč';
  const num = (v) => nf.format(Math.round(v));
  const short = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: a >= 1e7 ? 0 : 1 }) + ' mil.';
    if (a >= 1e3) return nf.format(v / 1e3) + ' tis.';
    return nf.format(v);
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  /* --- Navigace --- */
  $$('.dd').forEach((dd) => {
    const b = $('button', dd);
    b.addEventListener('click', (e) => { e.stopPropagation(); const o = dd.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) { dd.classList.remove('open'); b.setAttribute('aria-expanded', false); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { dd.classList.remove('open'); b.setAttribute('aria-expanded', false); } });
  });
  const mm = $('.mobile-menu');
  if (mm) {
    const set = (o) => { mm.classList.toggle('open', o); document.documentElement.classList.toggle('menu-open', o); document.documentElement.style.overflow = o ? 'hidden' : ''; };
    $('.burger').addEventListener('click', () => set(true));
    $('.mm-x').addEventListener('click', () => set(false));
    $$('a', mm).forEach((a) => a.addEventListener('click', () => set(false)));
  }

  /* --- Odhalování při scrollu --- */
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    $$('.rise').forEach((el) => io.observe(el));
  } else $$('.rise').forEach((el) => el.classList.add('in'));

  /* --- Formuláře: validace a odeslání Markovi e-mailem přes FormSubmit (stejná cesta jako dnešní ostrý web).
     Mimo doménu marek-marek.cz (návrh, localhost) se nic neodesílá, jen se ukáže potvrzení. --- */
  const LIVE = /(^|\.)marek-marek\.cz$/.test(location.hostname);
  const sendLead = (form) => {
    const d = {};
    new FormData(form).forEach((v, k) => { if (v !== '' && k !== 'pripojit') d[k] = d[k] ? d[k] + ', ' + v : v; });
    const att = form.querySelector('[name=pripojit]');
    if (att && att.checked && typeof window.MM_summary === 'function') d.vypocet = window.MM_summary();
    d.stranka = location.pathname;
    // Poptávky jdou rovnou do Aidvisory (CRM a e-mail Markovi). Klíč je veřejný, jen pro zápis z této domény.
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
    return fetch('https://www.aidvisora.cz/api/public/web-leads/wlf_ZIYuSu3L5Q4UK9HQMNP5_bP1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d), signal: ctl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status); }).finally(() => clearTimeout(t));
  };
  function wireForm(form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let bad = null;
      $$('[data-req]', form).filter((w) => !w.closest('[hidden]')).forEach((w) => {
        const inp = $('input,select,textarea', w);
        let ok = inp.type === 'checkbox' ? inp.checked : inp.value.trim() !== '';
        if (ok && inp.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim());
        if (ok && inp.type === 'tel') ok = inp.value.replace(/\D/g, '').length >= 9;
        w.classList.toggle('err', !ok);
        if (!ok && !bad) bad = inp;
      });
      if (bad) { bad.focus(); return; }
      if (!LIVE) { const o = $('.ok b', form); if (o) o.textContent = 'Návrh: nic se neodeslalo. Na ostrém webu zpráva přijde Markovi e-mailem.'; form.classList.add('sent'); return; }
      const btn = $('[type=submit]', form), err = $('.send-err', form);
      btn.disabled = true; if (err) err.hidden = true;
      sendLead(form).then(() => form.classList.add('sent')).catch(() => { if (err) err.hidden = false; }).finally(() => { btn.disabled = false; });
    });
    $$('input,select,textarea', form).forEach((i) => i.addEventListener('input', () => { const w = i.closest('[data-req]'); if (w) w.classList.remove('err'); }));
  }
  $$('form.form').forEach((f) => { f.insertAdjacentHTML('beforeend', '<input type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">'); wireForm(f); });

  /* --- Kontaktní okno v2: kalendář, nebo krátká odpověď. Zavření nic nemaže a vrací focus. --- */
  const dlg = $('#kontakt-okno');
  let lastFocus = null;
  // Stránka s výpočtem může nabídnout souhrn: window.MM_summary = () => 'text'. Připojí se jen se zaškrtnutím.
  const openContact = (subject, afterWork) => {
    if (!dlg) return;
    const f = $('form', dlg);
    if (f.classList.contains('sent')) { f.classList.remove('sent'); f.reset(); setVia('email'); }
    f.elements.tema.value = subject || '';
    $('[data-first]', dlg).hidden = !afterWork;
    $('#dlg-t').textContent = afterWork ? 'První krok máte hotový.' : 'Probereme to spolu';
    $('[data-subject]', dlg).textContent = afterWork ? 'Výpočet máte. Zbývá říct, kam se mám ozvat.' : (subject || 'Rád s Vámi proberu Vaše možnosti.');
    const sum = afterWork && typeof window.MM_summary === 'function' ? window.MM_summary() : '';
    $('[data-attach]', dlg).hidden = !sum;
    $('[data-attach-txt]', dlg).textContent = sum ? '(' + sum + ')' : '';
    lastFocus = document.activeElement;
    dlg.showModal();
  };
  const setVia = (v) => {
    if (!dlg) return;
    $$('[data-via] button', dlg).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
    $('[data-via-email]', dlg).hidden = v !== 'email';
    $('[data-via-tel]', dlg).hidden = v !== 'tel';
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-contact]');
    if (t) { e.preventDefault(); openContact(t.getAttribute('data-contact'), t.hasAttribute('data-done') || !!t.closest('.res-foot,[data-wstep],.offers')); }
  });
  if (dlg) {
    $('.x', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
    const sh = $('[data-short]', dlg), sf = $('[data-shortform]', dlg);
    sh.addEventListener('click', () => { const o = sf.hidden; sf.hidden = !o; sh.setAttribute('aria-expanded', o); if (o) { const i = $('[data-via-email] input', dlg); if (i) i.focus(); } });
    $$('[data-via] button', dlg).forEach((b) => b.addEventListener('click', () => setVia(b.dataset.v)));
  }

  /* --- Cookies a režim kontroly tvrzení --- */
  const ck = $('.cookie');
  if (ck && !store.get('mm-cookies')) ck.hidden = false;
  if (ck) $$('button', ck).forEach((b) => b.addEventListener('click', () => { store.set('mm-cookies', b.dataset.v); ck.hidden = true; }));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cookie-open]');
    if (b && ck) { e.preventDefault(); ck.hidden = false; }
  });
  const setK = (on) => { document.documentElement.classList.toggle('kontrola', on); $$('.kbtn').forEach((b) => (b.textContent = on ? 'Skrýt značky ke kontrole' : 'Ukázat tvrzení ke kontrole')); };
  if (new URLSearchParams(location.search).has('kontrola')) setK(true);
  $$('.kbtn').forEach((b) => b.addEventListener('click', () => setK(!document.documentElement.classList.contains('kontrola'))));

  /* --- Posuvníky --- */
  const paint = (r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%');
  const bindRange = (el, fn) => { paint(el); el.addEventListener('input', () => { paint(el); fn(+el.value); }); };

  /* --- Čárový graf: tenké čáry, přímé popisky, křížek a bublina, tabulka vedle --- */
  function lineChart(root, cfg) {
    const svgNS = 'http://www.w3.org/2000/svg';
    let tip = $('.tip', root);
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; root.appendChild(tip); }
    let svg = $('svg', root);
    if (!svg) { svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('role', 'img'); root.prepend(svg); }
    svg.setAttribute('aria-label', cfg.title || 'Graf');
    const el = (n, a, p) => { const x = document.createElementNS(svgNS, n); for (const k in a) x.setAttribute(k, a[k]); (p || svg).appendChild(x); return x; };
    function nice(max) { if (max <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(max))); const m = max / p; const s = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10; return s * p; }
    function draw(data) {
      const W = root.clientWidth, H = root.clientHeight; if (!W || !H) return;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
      const small = W < 480;
      const m = { t: 22, r: small ? 12 : 12, b: 26, l: small ? 44 : 56 };
      const iw = W - m.l - m.r, ih = H - m.t - m.b;
      const n = data.x.length;
      const yMax = nice(Math.max(1, ...data.series.flatMap((s) => s.values)));
      const X = (i) => m.l + (n > 1 ? (i / (n - 1)) * iw : 0);
      const Y = (v) => m.t + ih - (v / yMax) * ih;
      [0, 0.5, 1].forEach((f) => {
        const y = Y(yMax * f);
        el('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, stroke: f === 0 ? '#C9C4B7' : '#EDEAE1', 'stroke-width': 1 });
        const t = el('text', { x: m.l - 8, y: y + 4, 'text-anchor': 'end' }); t.textContent = short(yMax * f);
      });
      const ticks = small ? 3 : 5;
      const seen = new Set();
      for (let k = 0; k < ticks; k++) {
        const i = Math.round((k / (ticks - 1)) * (n - 1)); if (seen.has(i)) continue; seen.add(i);
        const t = el('text', { x: X(i), y: H - 6, 'text-anchor': k === 0 ? 'start' : k === ticks - 1 ? 'end' : 'middle' });
        t.textContent = data.x[i];
      }
      const labels = [];
      data.series.forEach((s, si) => {
        const pts = s.values.map((v, i) => [X(i), Y(v)]);
        const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
        if (s.area) el('path', { d: `${d} L${X(n - 1)} ${Y(0)} L${X(0)} ${Y(0)} Z`, fill: s.color, opacity: 0.09 });
        const line = el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dash || '' });
        if (!root.dataset.drawn && !reduced && !s.dash) {
          const len = line.getTotalLength(); line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
          line.getBoundingClientRect(); line.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)'; line.style.strokeDashoffset = 0;
          setTimeout(() => { line.style.strokeDasharray = ''; line.style.transition = ''; }, 1200);
        }
        const last = pts[pts.length - 1];
        if (s.end) { el('circle', { cx: last[0], cy: last[1], r: 7, fill: '#F6B91A', stroke: '#fff', 'stroke-width': 2.5 }); }
        else el('circle', { cx: last[0], cy: last[1], r: 4.5, fill: s.color, stroke: '#fff', 'stroke-width': 2 });
        if (s.label) labels.push({ text: s.label, x: last[0] - 2, y: Math.max(13, last[1] + (s.labelDy != null ? s.labelDy : -13)) });
      });
      labels.sort((a, b) => a.y - b.y).forEach((l, i, all) => {
        if (i && l.y - all[i - 1].y < 16) l.y = all[i - 1].y + 16;
        el('text', { x: l.x, y: l.y, 'text-anchor': 'end', class: 'lbl' }).textContent = l.text;
      });
      root.dataset.drawn = '1';
      const cross = el('line', { y1: m.t, y2: m.t + ih, stroke: '#16181D', 'stroke-width': 1, opacity: 0 });
      const marks = data.series.map((s) => el('circle', { r: 5, fill: s.color, stroke: '#fff', 'stroke-width': 2, opacity: 0 }));
      root._hover = (cx) => {
        const i = Math.max(0, Math.min(n - 1, Math.round(((cx - m.l) / iw) * (n - 1))));
        const px = X(i);
        cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('opacity', 0.28);
        marks.forEach((c, si) => { c.setAttribute('cx', px); c.setAttribute('cy', Y(data.series[si].values[i])); c.setAttribute('opacity', 1); });
        tip.innerHTML = `<b>${data.xLong ? data.xLong[i] : data.x[i]}</b>` + data.series.map((s) => `<span><span style="display:inline"><i style="background:${s.color}"></i>${s.name}</span><em>${kc(s.values[i])}</em></span>`).join('');
        tip.hidden = false;
        const tw = tip.offsetWidth; let left = px - tw / 2; left = Math.max(0, Math.min(W - tw, left));
        tip.style.left = left + 'px'; tip.style.top = '-6px';
      };
      root._leave = () => { cross.setAttribute('opacity', 0); marks.forEach((c) => c.setAttribute('opacity', 0)); tip.hidden = true; };
    }
    root._data = cfg;
    const update = (d) => { root._data = d; draw(d); renderTable(root, d); renderLegend(root, d); };
    if (!root.dataset.bound) {
      root.dataset.bound = '1';
      const pos = (e) => { const r = root.getBoundingClientRect(); return e.clientX - r.left; };
      root.addEventListener('pointermove', (e) => root._hover && root._hover(pos(e)));
      root.addEventListener('pointerdown', (e) => root._hover && root._hover(pos(e)));
      root.addEventListener('pointerleave', () => root._leave && root._leave());
      new ResizeObserver(() => root._data && draw(root._data)).observe(root);
    }
    update(cfg);
    return update;
  }
  function renderLegend(root, d) {
    const l = root.parentElement.querySelector(':scope > .legend[data-for="' + root.id + '"]');
    if (l) l.innerHTML = d.series.length > 1 ? d.series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('') : '';
  }
  function renderTable(root, d) {
    const t = root.parentElement.querySelector(':scope > details.tbl[data-for="' + root.id + '"] .tw');
    if (!t) return;
    t.innerHTML = `<table><thead><tr><th>${d.xName || 'Období'}</th>${d.series.map((s) => `<th>${s.name}</th>`).join('')}</tr></thead><tbody>` +
      d.x.map((x, i) => `<tr><td>${d.xLong ? d.xLong[i] : x}</td>${d.series.map((s) => `<td>${kc(s.values[i])}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
  }
  const COLORS = { pine: '#0B7A5B', gold: '#C98A00', clay: '#A8482A', ink: '#16181D', stone: '#8F8A7C' };

  /* --- Vodorovné srovnávací sloupce --- */
  function hbar(rows, max) {
    return rows.map((r) => {
      const total = r.parts.reduce((a, p) => a + p.v, 0);
      const scale = (max || total) || 1;
      return `<div class="hb"><div class="top"><div>${r.label}</div><span>${r.value || ''}</span></div>
        <div class="track">${r.parts.filter((p) => p.v > 0).map((p) => `<i class="${p.c || ''}" style="width:${(p.v / scale) * 100}%" title="${p.n}: ${kc(p.v)}"></i>`).join('')}</div>
        ${r.note ? `<small>${r.note}</small>` : ''}</div>`;
    }).join('');
  }

  const C = window.MM_CALC, M = window.MORTGAGE_ENGINE, I = window.INSURANCE_COMPUTATION;

  /* --- Hypotéka --- */
  function initMortgage(root, full) {
    const s = { product: 'mortgage', mortgageType: 'standard', loanType: 'consumer', loan: 5000000, own: 500000, extra: 0, term: 30, fix: 5, type: 'new', ltvLock: 90 };
    const q = (k) => $(`[data-m="${k}"]`, root);
    const LIM = { mortgage: { min: 500000, max: 30000000, step: 100000, def: 5000000 }, loan: { min: 20000, max: 2500000, step: 5000, def: 200000 } };
    const TYPES = {
      mortgage: [['standard', 'Klasická', 'Nejčastější hypotéka na vlastní bydlení. Možnost LTV až 90 %.'], ['investment', 'Investiční', 'Hypotéka na nemovitost k pronájmu. Pozor: LTV je bankami omezeno na maximálně 70 %.'], ['american', 'Americká', 'Neúčelová hypotéka zajištěná nemovitostí. Peníze můžete použít na cokoliv, ale sazba bývá vyšší. Max. LTV 70 %.']],
      loan: [['consumer', 'Spotřebitelský', 'Klasická půjčka na cokoliv bez zajištění nemovitostí.'], ['auto', 'Auto / Leasing', 'Účelová půjčka na nákup automobilu. Často s výhodnější sazbou než běžný úvěr.'], ['consolidation', 'Konsolidace', 'Sloučení více půjček, kreditek a kontokorentů do jedné.']],
    };
    const ch = q('chart');
    let chart;
    function renderSub() {
      const box = q('sub'); if (!box) return;
      const cur = s.product === 'mortgage' ? s.mortgageType : s.loanType;
      box.innerHTML = TYPES[s.product].map(([id, l]) => `<button type="button" data-id="${id}" aria-pressed="${id === cur}">${l}</button>`).join('');
      const info = TYPES[s.product].find((t) => t[0] === cur);
      if (q('subinfo')) q('subinfo').textContent = info[2];
      $$('button', box).forEach((b) => b.addEventListener('click', () => {
        if (s.product === 'mortgage') { s.mortgageType = b.dataset.id; if (b.dataset.id !== 'standard' && s.ltvLock > 70) s.ltvLock = 70; } else s.loanType = b.dataset.id;
        renderSub(); renderLtv(); if (root.__lim) root.__lim(); calc();
      }));
    }
    function renderLtv() {
      const box = q('ltv'); if (!box) return;
      const max = s.mortgageType === 'standard' ? 90 : 70;
      box.innerHTML = [90, 80, 70, 60, 50].filter((v) => v <= max).map((v) => `<button type="button" data-v="${v}" aria-pressed="${s.ltvLock === v}">${v} %</button>`).join('');
      $$('button', box).forEach((b) => b.addEventListener('click', () => { s.ltvLock = +b.dataset.v; renderLtv(); calc(); }));
    }
    function calc() {
      const r = M.calculate(s, C.BANKS, { fixYears: s.fix });
      const set = (k, v) => { const e = q(k); if (e) e.textContent = v; };
      if (q('loanOut')) q('loanOut').textContent = kc(s.loan);
      set('term', s.term + (s.term === 1 ? ' rok' : s.term < 5 ? ' roky' : ' let')); set('ownO', kc(s.own)); set('extraO', kc(s.extra));
      set('monthly', num(r.monthlyPayment));
      set('rate', r.finalRate.toFixed(2).replace('.', ',') + ' %');
      set('borrow', kc(r.borrowingAmount));
      set('total', kc(r.totalPaid));
      set('over', kc(Math.max(0, r.totalPaid - r.borrowingAmount)));
      set('ltvv', s.product === 'mortgage' ? r.displayLtv + ' %' : '—');
      set('own', kc(s.product === 'mortgage' ? r.ownResources : s.own));
      if (ch) {
        const a = C.amortization(r.borrowingAmount, r.finalRate, s.term);
        const d = { title: 'Zůstatek úvěru a zaplacený úrok v čase', xName: 'Rok', x: a.map((p) => p.year === 0 ? 'Dnes' : p.year + '. rok'), xLong: a.map((p) => p.year === 0 ? 'Dnes' : p.year + '. rok splácení'),
          series: [{ name: 'Zůstatek úvěru', color: COLORS.pine, values: a.map((p) => p.balance), area: true, label: '', end: false }, { name: 'Zaplacený úrok celkem', color: COLORS.gold, values: a.map((p) => p.interest), label: 'Úrok celkem', labelDy: -14 }] };
        chart ? chart(d) : (chart = lineChart(ch, d));
      }
      const w = q('warn');
      if (w) { const showW = s.product === 'mortgage' && r.displayLtv > 80; w.hidden = !showW; }
      const o = q('offers');
      if (o) {
        o.innerHTML = C.bankOffers(s, r.borrowingAmount, r.calcLtv).slice(0, full ? 10 : 3).map((b) => `<div class="offer"><b>${b.name}</b><span class="r">${b.rate.toFixed(2).replace('.', ',')} %</span><span class="m">${kc(b.pmt)}</span><button class="btn sm" type="button" data-contact="Nabídka: ${b.name}, splátka od ${kc(b.pmt)}.">Chci nabídku</button></div>`).join('');
      }
      const show = (k, v) => { const e = q(k); if (e) e.hidden = !v; };
      show('box-prop', s.product === 'mortgage');
      show('box-own', s.product === 'loan' && s.loanType === 'auto');
      show('box-extra', s.product === 'loan' && s.loanType === 'consolidation');
      show('box-fix', s.product === 'mortgage');
      show('box-type', s.product === 'mortgage');
      const ll = q('loanLabel'); if (ll) ll.firstChild.textContent = s.product === 'mortgage' ? 'Hodnota nemovitosti' : s.loanType === 'auto' ? 'Cena auta' : s.loanType === 'consolidation' ? 'Součet úvěrů' : 'Výše úvěru';
    }
    const L = q('loan');
    function applyLimits() { const l = LIM[s.product]; L.min = l.min; L.max = l.max; L.step = l.step; L.value = s.loan; paint(L); const ee = q('ends'); if (ee) ee.innerHTML = `<span>${short(l.min)}</span><span>${short(l.max)}</span>`; const t = q('termR'); if (t) { t.max = s.product === 'mortgage' ? 35 : s.loanType === 'auto' ? 10 : 12; t.min = s.product === 'mortgage' ? 5 : 1; if (s.term > +t.max) s.term = +t.max; t.value = s.term; paint(t); } }
    root.__lim = applyLimits;
    bindRange(L, (v) => { s.loan = v; calc(); });
    const T = q('termR'); if (T) bindRange(T, (v) => { s.term = v; calc(); });
    const O = q('ownR'); if (O) bindRange(O, (v) => { s.own = v; calc(); });
    const E = q('extraR'); if (E) bindRange(E, (v) => { s.extra = v; calc(); });
    const seg = (key, field, after) => { const b = q(key); if (!b) return; $$('button', b).forEach((x) => x.addEventListener('click', () => { $$('button', b).forEach((y) => y.setAttribute('aria-pressed', y === x)); const v = x.dataset.v; s[field] = isNaN(+v) ? v : +v; after && after(); calc(); })); };
    seg('prod', 'product', () => { s.loan = LIM[s.product].def; s.term = 30; s.own = s.product === 'mortgage' ? 500000 : 0; s.extra = 0; if (O) { O.value = 0; paint(O); } if (E) { E.value = 0; paint(E); } applyLimits(); renderSub(); renderLtv(); });
    seg('type', 'type'); seg('fix', 'fix');
    applyLimits(); renderSub(); renderLtv(); calc();
    return { s, calc };
  }

  /* --- Investice --- */
  function initInvest(root) {
    const s = { initial: 100000, monthly: 5000, years: 10, pi: 1, start: 1995 };
    const q = (k) => $(`[data-i="${k}"]`, root);
    let ch, bt;
    function calc() {
      const p = C.PROFILES[s.pi], r = C.invest({ initial: s.initial, monthly: s.monthly, years: s.years, rate: p.rate });
      const set = (k, v) => { const e = q(k); if (e) e.textContent = v; };
      set('value', num(r.balance)); set('inv', kc(r.invested)); set('gain', '+' + kc(r.gain)); set('pct', '+' + r.gainPct.toFixed(1).replace('.', ',') + ' %');
      set('initO', kc(s.initial)); set('monO', kc(s.monthly)); set('yrO', s.years + ' let'); set('rate', p.rate + ' % ročně'); set('pname', p.name); set('pdesc', p.description);
      const d = { title: 'Předpokládaný vývoj hodnoty investice', xName: 'Rok', x: r.rows.map((x) => x.year === 0 ? 'Start' : x.year + '. rok'), xLong: r.rows.map((x) => x.year === 0 ? 'Start' : x.year + '. rok'),
        series: [{ name: 'Modelová hodnota', color: COLORS.pine, values: r.rows.map((x) => x.balance), area: true, end: true, label: 'Modelová hodnota', labelDy: -14 }, { name: 'Váš vklad', color: COLORS.stone, values: r.rows.map((x) => x.invested), label: 'Váš vklad', labelDy: 18 }] };
      const c = q('chart');
      if (c) ch ? ch(d) : (ch = lineChart(c, d));
      const al = q('alloc');
      if (al) {
        const cls = ['', 'gold', 'clay'];
        al.innerHTML = C.PROFILES.map((pr, i) => `<div class="hb" style="${i === s.pi ? '' : 'opacity:.68'}"><div class="top"><div>${pr.short}</div><span>${pr.rate} % ročně</span></div><div class="track">${pr.composition.map((x, j) => `<i class="${cls[j]}" style="width:${x.value}%"></i>`).join('')}</div><small>${pr.composition.map((x) => x.name + ' ' + x.value + ' %').join(' · ')}</small></div>`).join('');
      }
      const bc = q('bt');
      if (bc) {
        const rows = C.backtest(s.monthly, s.start);
        const dd = { title: 'Simulace historického vývoje', xName: 'Datum', x: rows.map((x) => x.date.slice(0, 4)), xLong: rows.map((x) => x.date.replace('-', '/')),
          series: [{ name: 'Akcie (S&P 500)', color: COLORS.pine, values: rows.map((x) => x.sp500), label: 'Akcie', labelDy: -14 }, { name: 'Zlato', color: COLORS.gold, values: rows.map((x) => x.gold), label: 'Zlato', labelDy: 16 }, { name: 'Váš vklad', color: COLORS.stone, values: rows.map((x) => x.invested), label: 'Vklad', labelDy: 18 }] };
        bt ? bt(dd) : (bt = lineChart(bc, dd));
        set('btS', s.start); set('btM', kc(s.monthly));
      }
    }
    const R = (k, f) => { const e = q(k); if (e) bindRange(e, (v) => { s[f] = v; calc(); }); };
    R('init', 'initial'); R('mon', 'monthly'); R('yr', 'years'); R('start', 'start');
    const seg = q('prof'); if (seg) $$('button', seg).forEach((b, i) => b.addEventListener('click', () => { s.pi = i; $$('button', seg).forEach((x, j) => x.setAttribute('aria-pressed', j === i)); calc(); }));
    calc();
  }

  /* --- Penze --- */
  function initPension(root) {
    const s = { age: 35, retireAge: 65, salary: 45000, rent: 35000, scenario: 'realistic' };
    const q = (k) => $(`[data-p="${k}"]`, root);
    let ch;
    function calc() {
      const r = C.pension(s);
      const set = (k, v) => { const e = q(k); if (e) e.textContent = v; };
      set('ageO', s.age + ' let'); set('retO', s.retireAge + ' let'); set('salO', kc(s.salary)); set('rentO', kc(s.rent));
      set('gap', num(r.gap)); set('need', kc(r.monthly)); set('target', r.target >= 1e6 ? (r.target / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' mil. Kč' : kc(r.target)); set('est', kc(r.estimate)); set('tl', 'Cílový majetek v ' + s.retireAge + ' letech');
      const b = q('bars');
      if (b) b.innerHTML = hbar([{ label: 'Cílová renta', value: kc(s.rent), parts: [{ n: 'Odhad státního důchodu', v: Math.min(r.estimate, s.rent) }, { n: 'Chybí měsíčně', v: r.gap, c: 'gold' }], note: `Odhad státního důchodu ${kc(r.estimate)} · chybí ${kc(r.gap)}` }, { label: 'Dnešní hrubá mzda', value: kc(s.salary), parts: [{ n: 'Hrubá mzda', v: s.salary, c: 'ink' }] }], Math.max(s.rent, s.salary, r.estimate));
      const c = q('chart');
      if (c) {
        const years = Math.max(1, r.years), real = 1.07 / 1.02 - 1, am = real / 12, rows = [];
        let bal = 0;
        for (let y = 0; y <= years; y++) { if (y) for (let m = 0; m < 12; m++) bal = bal * (1 + am) + r.monthly; rows.push({ y: s.age + y, v: Math.round(bal), inv: r.monthly * 12 * y }); }
        const d = { title: 'Jak se může skládat cílový majetek', xName: 'Věk', x: rows.map((x) => x.y + ' let'), xLong: rows.map((x) => 'Věk ' + x.y), series: [{ name: 'Modelový majetek', color: COLORS.pine, values: rows.map((x) => x.v), area: true, end: true, label: 'Modelový majetek', labelDy: -14 }, { name: 'Vložíte', color: COLORS.stone, values: rows.map((x) => x.inv), label: 'Vložíte', labelDy: 18 }] };
        ch ? ch(d) : (ch = lineChart(c, d));
      }
    }
    const R = (k, f) => { const e = q(k); if (e) bindRange(e, (v) => { s[f] = v; if (s.age >= s.retireAge) { s.age = s.retireAge - 1; const a = q('age'); if (a) { a.value = s.age; paint(a); } } calc(); }); };
    R('age', 'age'); R('ret', 'retireAge'); R('sal', 'salary'); R('rent', 'rent');
    const seg = q('sc'); if (seg) $$('button', seg).forEach((b) => b.addEventListener('click', () => { s.scenario = b.dataset.v; $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', x === b)); calc(); }));
    calc();
  }

  /* --- Životní pojištění --- */
  function initLife(root) {
    const s = { age: 30, netIncome: 30000, expenses: 20000, liabilities: 2000000, reserves: 100000, children: 2, hasSpouse: true, isOsvc: false };
    const q = (k) => $(`[data-l="${k}"]`, root);
    function calc() {
      const r = I.computeInsurance(s);
      const set = (k, v) => { const e = q(k); if (e) e.textContent = v; };
      set('ageO', s.age + ' let'); set('incO', kc(s.netIncome)); set('expO', kc(s.expenses)); set('liaO', kc(s.liabilities)); set('resO', kc(s.reserves)); set('chO', s.children);
      set('head', short(r.capitalD3) + ' Kč'); set('rent', kc(r.gapD3Renta) + ' měsíčně');
      const warn = q('expwarn'); if (warn) warn.hidden = s.expenses <= s.netIncome;
      const b = q('bars');
      if (b) b.innerHTML = hbar(r.chartData.map((x) => ({ label: x.label === 'PN (měs.)' ? 'Pracovní neschopnost' : 'Invalidita', value: 'příjem ' + kc(x.prijem), parts: [{ n: 'Od státu', v: Math.min(x.stat, x.prijem + x.chybi) }, { n: 'Chybí', v: x.chybi, c: 'gold' }], note: `Od státu ${kc(x.stat)} · chybí ${kc(x.chybi)} měsíčně` })), Math.max(...r.chartData.map((x) => x.stat + x.chybi)));
      const l = q('list');
      if (l) l.innerHTML = `
        <div class="resrow"><div><b>Smrt</b><span>Včetně zabezpečení ${s.hasSpouse ? 'partnera' : ''}${s.hasSpouse && s.children ? ' a ' : ''}${s.children ? s.children + (s.children === 1 ? ' dítěte' : ' dětí') : ''}</span></div><strong>${kc(r.deathCoverage)}</strong></div>
        <div class="resrow hi"><div><b>Invalidita III. + II. stupně</b><span>Krytí renty ${kc(r.gapD3Renta)} měsíčně</span></div><strong>${kc(r.capitalD3)}</strong></div>
        <div class="resrow"><div><b>Pracovní neschopnost</b><span>Denní dávka od 29. dne</span></div><strong>${kc(r.pnDailyNeed)}<span style="font:500 13px var(--body);letter-spacing:0"> / den</span></strong></div>
        <div class="resrow"><div><b>Trvalé následky</b><span>Až osminásobná progrese (${kc(r.tnProgression)})</span></div><strong>${kc(r.tnBase)}</strong></div>`;
    }
    const R = (k, f) => { const e = q(k); if (e) bindRange(e, (v) => { s[f] = v; calc(); }); };
    R('age', 'age'); R('inc', 'netIncome'); R('exp', 'expenses'); R('lia', 'liabilities'); R('res', 'reserves'); R('ch', 'children');
    const tog = (k, f) => { const seg = q(k); if (seg) $$('button', seg).forEach((b) => b.addEventListener('click', () => { s[f] = b.dataset.v === '1'; $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', x === b)); calc(); })); };
    tog('sp', 'hasSpouse'); tog('osvc', 'isOsvc');
    calc();
  }

  /* --- Firemní kalkulačka: jednotná sazba odvodů 33,8 % --- */
  function initBenefit(root) {
    const s = { n: 5, amt: 50000 };
    const q = (k) => $(`[data-b="${k}"]`, root);
    function calc() {
      const save = Math.round(s.amt * 0.338) * s.n;
      q('nO').textContent = s.n + (s.n === 1 ? ' osoba' : s.n < 5 ? ' osoby' : ' osob');
      q('amtO').textContent = kc(s.amt);
      q('save').textContent = num(save);
      q('per').textContent = kc(Math.round(s.amt * 0.338));
      q('bars').innerHTML = hbar([
        { label: 'Stejná částka přes mzdu', value: kc(s.amt * s.n * 1.338), parts: [{ n: 'Hrubá mzda', v: s.amt * s.n, c: 'ink' }, { n: 'Odvody firmy', v: s.amt * s.n * 0.338, c: 'gold' }], note: `Navíc odvody firmy ${kc(s.amt * s.n * 0.338)}` },
        { label: 'Stejná částka jako benefit', value: kc(s.amt * s.n), parts: [{ n: 'Příspěvek', v: s.amt * s.n, c: 'ink' }], note: 'Odvody firmy 0 Kč, do limitu 50 000 Kč na osobu za rok' },
      ], s.amt * s.n * 1.338);
    }
    bindRange(q('n'), (v) => { s.n = v; calc(); });
    bindRange(q('amt'), (v) => { s.amt = v; calc(); });
    calc();
  }

  /* --- Modelová projekce na homepage: čas a výnos --- */
  function initTime(root) {
    const s = { rate: 7 };
    const q = (k) => $(`[data-t="${k}"]`, root);
    let ch;
    function calc() {
      const acc = [], inv = [], labs = [];
      for (let y = 0; y <= 10; y++) { labs.push(y === 0 ? 'Start' : y + '. rok'); acc.push(Math.round(500000 * Math.pow(1.01, y))); inv.push(Math.round(500000 * Math.pow(1 + s.rate / 100, y))); }
      q('rO').textContent = s.rate + ' % ročně'; q('end').textContent = kc(inv[10]); q('acc').textContent = kc(acc[10]);
      const d = { title: 'Modelový výpočet 500 000 Kč na 10 let', xName: 'Rok', x: labs, series: [{ name: 'Modelové investování', color: COLORS.pine, values: inv, area: true, end: true, label: 'Investování', labelDy: -14 }, { name: 'Účet s úrokem 1 %', color: COLORS.stone, values: acc, label: 'Účet s úrokem 1 %', labelDy: 18 }] };
      ch ? ch(d) : (ch = lineChart(q('chart'), d));
    }
    bindRange(q('r'), (v) => { s.rate = v; calc(); });
    calc();
  }

  /* --- Přepínání záložek --- */
  function initTabs(root) {
    const tabs = $$('[role=tab]', root);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const activate = (i, focus) => {
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', j === i); t.tabIndex = j === i ? 0 : -1; panels[j].hidden = j !== i; });
      if (focus) tabs[i].focus();
      window.dispatchEvent(new Event('resize'));
      const c = panels[i].querySelector('.chart'); if (c && c._data) lineChart(c, c._data);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activate(i));
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') activate((i + 1) % tabs.length, true); if (e.key === 'ArrowLeft') activate((i - 1 + tabs.length) % tabs.length, true); });
    });
  }

  $$('[data-tabs]').forEach(initTabs);
  $$('[data-calc=mortgage]').forEach((r) => initMortgage(r, r.dataset.full === '1'));
  $$('[data-calc=invest]').forEach(initInvest);
  $$('[data-calc=pension]').forEach(initPension);
  $$('[data-calc=life]').forEach(initLife);
  $$('[data-calc=benefit]').forEach(initBenefit);
  $$('[data-calc=time]').forEach(initTime);

  /* --- Rychlý test na stránce pro majitele s.r.o. --- */
  $$('[data-quiz]').forEach((root) => {
    const steps = $$('[data-step]', root);
    const go = (i) => steps.forEach((s, j) => (s.hidden = j !== i));
    $$('[data-go]', root).forEach((b) => b.addEventListener('click', () => go(+b.dataset.go)));
    const amt = $('[data-qamt]', root);
    const calc = (v) => { const y = Math.min(v * 12, 50000); $('[data-qsave]', root).textContent = num(Math.round(y * 0.338)); $('[data-qded]', root).textContent = kc(y); $('[data-qo]', root).textContent = kc(v); };
    bindRange(amt, calc); calc(+amt.value);
    $$('[data-qpick]', root).forEach((b) => b.addEventListener('click', () => { amt.value = b.dataset.qpick; paint(amt); calc(+b.dataset.qpick); }));
    go(0);
  });

  /* --- Průvodce: finanční analýza, QuickScan, nástroj poradce --- */
  $$('[data-wizard]').forEach((root) => {
    const key = 'mm-wz-' + root.dataset.wizard;
    const panels = $$('[data-wstep]', root), btns = $$('.wz-steps button', root);
    let at = 0;
    const money = (n) => { const e = root.querySelector(`[name="${n}"]`); return e ? +String(e.value).replace(/\s/g, '').replace(',', '.') || 0 : 0; };
    const sum = (arr) => arr.reduce((a, n) => a + money(n), 0);
    const live = () => {
      const f = root.dataset.wizard === 'quickscan';
      const set = (k, v) => $$(`[data-w="${k}"]`, root).forEach((x) => (x.textContent = v));
      if (f) {
        const cnt = money('zam'), mz = money('mzda'), res = money('rezerva'), spl = money('splatka'), zisk = money('zisk'), prisp = money('prisp'), kol = money('kolika');
        const pay = cnt * mz;
        set('fond', kc(pay)); set('tr', kc(money('trzby'))); set('zisk', kc(zisk));
        const burn = pay * 1.338 + spl;
        set('runway', burn > 0 ? (res / burn).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' měsíce' : '—');
        const yr = prisp * kol * 12; set('rocne', kc(yr)); set('uspora', kc(yr * 0.338));
        const risks = $$('[data-risk]:checked', root).length; set('gap', (6 - risks) + ' z 6');
      } else {
        const inc = sum(['prijem', 'prijemPartner', 'prijemOst']), exp = sum(['bydleni', 'energie', 'jidlo', 'doprava', 'deti', 'pojistky', 'vydajOst']);
        const akt = sum(['hotovost', 'nemovitosti', 'investice', 'penzijni', 'ostatniAkt']), pas = sum(['hypoteka', 'uvery', 'ostatniPas']);
        set('inc', kc(inc)); set('exp', kc(exp)); set('bal', kc(inc - exp)); set('akt', kc(akt)); set('pas', kc(pas)); set('jm', kc(akt - pas));
        const mes = money('rezervaMes') || 6; set('rezCil', kc(exp * mes)); set('rezChybi', kc(Math.max(0, exp * mes - money('hotovost'))));
        const cil = money('cilRenta'), hor = money('cilHorizont') || 1, rate = +(root.querySelector('[name="cilStrategie"]') || { value: 7 }).value / 100 / 12;
        const cap = cil > 0 ? (cil * 12) / 0.06 : 0; const pm = cap > 0 ? (cap * rate) / (Math.pow(1 + rate, hor * 12) - 1) : 0;
        set('cilCap', kc(cap)); set('cilMes', kc(pm));
        const name = (root.querySelector('[name="jmeno"]') || {}).value; set('jm-kl', name ? ': ' + name : '');
      }
    };
    const show = (i) => { at = Math.max(0, Math.min(panels.length - 1, i)); panels.forEach((p, j) => (p.hidden = j !== at)); btns.forEach((b, j) => { b.classList.toggle('done', j < at); j === at ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'); }); live();  const cur = btns[at]; if (cur && cur.parentElement.scrollWidth > cur.parentElement.clientWidth) cur.parentElement.scrollLeft = cur.offsetLeft - cur.parentElement.offsetLeft - 16; };
    btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
    $$('[data-next]', root).forEach((b) => b.addEventListener('click', () => { show(at + 1); root.scrollIntoView({ block: 'start' }); }));
    $$('[data-prev]', root).forEach((b) => b.addEventListener('click', () => { show(at - 1); root.scrollIntoView({ block: 'start' }); }));
    $$('input,select', root).forEach((i) => { i.addEventListener('input', live); i.addEventListener('change', live); });
    const note = $('[data-wnote]', root);
    const say = (t) => { if (note) { note.textContent = t; } };
    const data = () => { const o = {}; $$('input,select', root).forEach((i) => { if (i.name) o[i.name] = i.type === 'checkbox' ? i.checked : i.value; }); return o; };
    const fill = (o) => $$('input,select', root).forEach((i) => { if (i.name in o) { if (i.type === 'checkbox') i.checked = o[i.name]; else i.value = o[i.name]; } });
    const act = (n, f) => { const b = $(`[data-act="${n}"]`, root); if (b) b.addEventListener('click', f); };
    act('save', () => { store.set(key, JSON.stringify(data())); say('Uloženo v tomto prohlížeči.'); });
    act('load', () => { const v = store.get(key); if (v) { fill(JSON.parse(v)); live(); say('Načteno z tohoto prohlížeče.'); } else say('Zatím tu nic uloženého není.'); });
    act('new', () => { $$('input,select', root).forEach((i) => { if (i.type === 'checkbox') i.checked = false; else i.value = i.defaultValue; }); store.del(key); show(0); say('Začínáme znovu.'); });
    show(0);
  });

  /* --- Vstup pro poradce: přepnutí přihlášení a registrace --- */
  $$('[data-auth]').forEach((root) => {
    const seg = $('.tabs', root); const pp = $$('[data-pane]', root);
    $$('button', seg).forEach((b) => b.addEventListener('click', () => { $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', x === b)); pp.forEach((p) => (p.hidden = p.dataset.pane !== b.dataset.v)); }));
  });
  $$('.year').forEach((y) => (y.textContent = new Date().getFullYear()));
})();
