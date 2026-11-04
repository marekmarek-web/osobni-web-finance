/* Bydlení: mapa ceny, hypotéka a úvěr, rozcestí. Bez knihoven, nic se neposílá ani neukládá do URL. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const n0 = (v) => nf.format(Math.round(v));
  const kc = (v) => n0(v) + ' Kč';
  const pct = (v) => v.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
  const mil = (v) => (v / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + ' mil.';
  const paint = (r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%');
  const parseNum = (s) => { const d = String(s).replace(/[^\d]/g, ''); return d ? +d : 0; };

  /* ===================== Krok 1: mapa ===================== */
  const mapRoot = $('[data-by-map]');
  const st = { type: 'byt', m2: 70, k: null, o: null, size: null, est: null };
  let data = null;
  let svg = null, gK = null, gO = null, shown = null, anim = 0;

  // Teplá škála papír → žlutá → inkoust. Odmocnina drží Prahu, aby nesmazala zbytek.
  const STOPS = [[243, 238, 223], [251, 227, 160], [246, 185, 26], [201, 138, 0], [74, 58, 22]];
  const shade = (v, lo, hi) => {
    const p = hi > lo ? Math.sqrt(Math.max(0, Math.min(1, (v - lo) / (hi - lo)))) : 0.5;
    const s = Math.min(0.999, p) * (STOPS.length - 1), i = Math.floor(s), m = s - i;
    return `rgb(${STOPS[i].map((c, j) => Math.round(c + (STOPS[i + 1][j] - c) * m)).join(',')})`;
  };
  const kraj = () => (data && st.k !== null ? data.kraje[st.k] : null);
  const okres = () => { const k = kraj(); return k && st.o !== null ? k.okresy[st.o] : null; };

  const el = (n, a, p) => { const x = document.createElementNS(NS, n); for (const k in a) x.setAttribute(k, a[k]); if (p) p.appendChild(x); return x; };

  function setView(box, pad) {
    const [x, y, w, h] = box;
    const to = [x - w * pad, y - h * pad, w * (1 + 2 * pad), h * (1 + 2 * pad)];
    cancelAnimationFrame(anim);
    if (reduced || !shown) { shown = to; svg.setAttribute('viewBox', to.join(' ')); return; }
    const from = shown.slice(), t0 = performance.now();
    const step = (t) => {
      const q = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - q, 4);
      shown = from.map((v, i) => v + (to[i] - v) * e);
      svg.setAttribute('viewBox', shown.join(' '));
      if (q < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function hoverText(name, v) { $('[data-hover]', mapRoot).textContent = v ? `${name} · ${n0(v)} Kč/m²` : name; }
  function restHover() {
    const k = kraj(), o = okres();
    hoverText(o ? `${o.n} · vybráno` : k ? 'Vyberte okres' : 'Vyberte kraj');
  }

  function areaPath(parent, d, label, onPick, fill, extra = '') {
    const p = el('path', { d, class: 'by-area ' + extra, tabindex: '0', role: 'button', 'aria-label': label }, parent);
    if (fill) p.style.fill = fill;
    p.addEventListener('click', onPick);
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } });
    return p;
  }

  function drawMap() {
    if (!svg) return;
    gK.innerHTML = ''; gO.innerHTML = '';
    const k = kraj(), o = okres(), t = st.type;
    let lo, hi;
    if (!k) {
      const vs = data.kraje.map((x) => x[t]); lo = Math.min(...vs); hi = Math.max(...vs);
      data.kraje.forEach((x, i) => {
        const p = areaPath(gK, x.d, `${x.n}, ${n0(x[t])} Kč za m²`, () => pickKraj(i), shade(x[t], lo, hi));
        p.addEventListener('pointerenter', () => hoverText(x.n, x[t]));
        p.addEventListener('pointerleave', restHover);
        p.addEventListener('focus', () => hoverText(x.n, x[t]));
      });
    } else {
      data.kraje.forEach((x, i) => { if (i !== st.k) { const p = el('path', { d: x.d, class: 'by-area dim' }, gK); p.addEventListener('click', () => pickKraj(i)); } });
      const vs = k.okresy.map((x) => (x[t] ? x[t].a : 0)).filter(Boolean);
      lo = Math.min(...vs); hi = Math.max(...vs);
      k.okresy.forEach((x, i) => {
        const v = x[t] ? x[t].a : null;
        const on = i === st.o;
        const p = areaPath(gO, x.d, `Okres ${x.n}${v ? `, ${n0(v)} Kč za m²` : ''}`, () => pickOkres(i), on ? null : v ? shade(v, lo, hi) : '#EEE', on ? 'on' : o ? 'off' : '');
        p.setAttribute('aria-pressed', on);
        p.addEventListener('pointerenter', () => hoverText(x.n, v));
        p.addEventListener('pointerleave', restHover);
        p.addEventListener('focus', () => hoverText(x.n, v));
      });
    }
    $('[data-smin]', mapRoot).textContent = n0(lo);
    $('[data-smax]', mapRoot).textContent = n0(hi) + ' Kč/m²';
    $('[data-scale]', mapRoot).hidden = !!o;
    setView(o ? o.box : k ? k.box : [0, 0, data.w, data.h], o ? 0.6 : k ? 0.08 : 0.01);
    restHover();
  }

  function drawCrumbs() {
    const k = kraj(), o = okres();
    const [c0, c1, c2] = $$('[data-crumb]', mapRoot);
    c0.toggleAttribute('aria-current', !k); if (!k) c0.setAttribute('aria-current', 'true');
    c1.disabled = !k; c1.textContent = k ? k.n : 'Kraj';
    c1.toggleAttribute('aria-current', !!k && !o); if (k && !o) c1.setAttribute('aria-current', 'true');
    c2.textContent = o ? o.n : 'Okres'; c2.classList.toggle('on', !!o);
    const sk = $('[data-sel-kraj]', mapRoot), so = $('[data-sel-okres]', mapRoot);
    sk.value = k ? String(st.k) : '';
    so.innerHTML = k ? `<option value="">Celý kraj</option>${k.okresy.map((x, i) => `<option value="${i}">${x.n}</option>`).join('')}` : '<option value="">Nejdřív vyberte kraj</option>';
    so.disabled = !k; so.value = o ? String(st.o) : '';
  }

  function drawTable() {
    const k = kraj(), t = st.type;
    const rows = k ? k.okresy.map((x) => [x.n, x.byt && x.byt.a, x.dum && x.dum.a, (x[t] || {}).n]) : data.kraje.map((x) => [x.n, x.byt, x.dum, null]);
    $('[data-maptable]', mapRoot).innerHTML = `<table><thead><tr><th>${k ? 'Okres' : 'Kraj'}</th><th>Byt, Kč/m²</th><th>Dům, Kč/m²</th>${k ? `<th>Prodejů (${t === 'byt' ? 'byty' : 'domy'})</th>` : ''}</tr></thead><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1] ? n0(r[1]) : '–'}</td><td>${r[2] ? n0(r[2]) : '–'}</td>${k ? `<td>${r[3] ? n0(r[3]) : '–'}</td>` : ''}</tr>`).join('')}</tbody></table>`;
  }

  function drawSizes() {
    const o = okres(), wrap = $('[data-sizewrap]', mapRoot), box = $('[data-sizes]', mapRoot);
    const row = o && o[st.type];
    const has = row && row.s.filter((v) => v).length > 1;
    wrap.hidden = !has;
    if (!has) { st.size = null; return; }
    if (st.size !== null && !row.s[st.size]) st.size = null;
    const lab = ['do 2 tis.', '2–10 tis.', '10–50 tis.', 'nad 50 tis.'];
    box.innerHTML = `<button type="button" data-s="" aria-pressed="${st.size === null}">Nevím</button>` + data.meta.velikostiObce.map((full, i) => `<button type="button" data-s="${i}" aria-pressed="${st.size === i}"${row.s[i] ? '' : ' disabled'} title="Obec ${full}">${lab[i]}<small>obyvatel</small></button>`).join('');
  }

  // Rozpětí: nejnižší až nejvyšší průměr pro místo, aspoň ±10 % (předpoklad, označený na stránce).
  const stepFor = (v) => (v < 1e6 ? 10000 : v < 5e6 ? 50000 : 100000);
  function estimate() {
    const t = st.type, k = kraj(), o = okres();
    let avg, vals, n = null, place;
    if (o && o[t]) {
      const r = o[t]; n = r.n;
      if (st.size !== null && r.s[st.size]) { avg = r.s[st.size]; vals = [avg]; place = `okres ${o.n}, obec ${data.meta.velikostiObce[st.size]}`; }
      else { avg = r.a; vals = [r.a, r.y, ...r.s].filter(Boolean); place = `okres ${o.n}`; }
    } else if (k) { avg = k[t]; vals = [avg]; place = `${k.n}, průměr kraje`; }
    else { avg = data.cr[t]; vals = [avg]; place = 'průměr celé ČR'; }
    const m2 = st.m2;
    const lo0 = Math.min(avg * 0.9, ...vals) * m2, hi0 = Math.max(avg * 1.1, ...vals) * m2;
    const s = stepFor(avg * m2);
    return { avg, n, place, lo: Math.floor(lo0 / s) * s, hi: Math.ceil(hi0 / s) * s, mid: Math.round((avg * m2) / 10000) * 10000 };
  }

  function drawResult() {
    const e = estimate(); st.est = e;
    $('[data-place]', mapRoot).textContent = `${st.type === 'byt' ? 'Byt' : 'Rodinný dům'} ${st.m2} m², ${e.place}`;
    $('[data-lo]', mapRoot).textContent = n0(e.lo);
    $('[data-hi]', mapRoot).textContent = n0(e.hi);
    $('[data-pm2]', mapRoot).textContent = kc(e.avg);
    const c = Math.round((e.avg / data.cr[st.type] - 1) * 100);
    $('[data-cmp]', mapRoot).textContent = (c > 0 ? '+' : c < 0 ? '−' : '') + Math.abs(c) + ' %';
    $('[data-nn]', mapRoot).textContent = e.n ? n0(e.n) : '–';
    $('[data-low]', mapRoot).hidden = !(e.n && e.n < 50);
    loan.fromMap(e);
  }

  function render() { drawCrumbs(); drawMap(); drawTable(); drawSizes(); drawResult(); }
  function pickKraj(i) {
    st.k = i; st.size = null;
    st.o = i !== null && data.kraje[i].okresy.length === 1 ? 0 : null; // Praha je kraj i okres
    render();
  }
  function pickOkres(i) { st.o = i; st.size = null; render(); }

  function initMap() {
    if (!mapRoot) return;
    const m2 = $('[data-m2]', mapRoot), m2o = $('[data-m2o]', mapRoot);
    const showM2 = () => { m2o.textContent = m2.value + ' m²'; paint(m2); };
    showM2();
    m2.addEventListener('input', () => { st.m2 = +m2.value; showM2(); if (data) drawResult(); });
    $$('[data-type] button', mapRoot).forEach((b) => b.addEventListener('click', () => {
      st.type = b.dataset.v; st.size = null;
      $$('[data-type] button', mapRoot).forEach((x) => x.setAttribute('aria-pressed', x === b));
      if (data) render();
    }));
    $('[data-sizes]', mapRoot).addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      st.size = b.dataset.s === '' ? null : +b.dataset.s; drawSizes(); drawResult();
    });
    const [c0, c1] = $$('[data-crumb]', mapRoot);
    c0.addEventListener('click', () => pickKraj(null));
    c1.addEventListener('click', () => { if (st.k !== null && data.kraje[st.k].okresy.length > 1) pickOkres(null); });
    $('[data-sel-kraj]', mapRoot).addEventListener('change', (e) => pickKraj(e.target.value === '' ? null : +e.target.value));
    $('[data-sel-okres]', mapRoot).addEventListener('change', (e) => pickOkres(e.target.value === '' ? null : +e.target.value));
    $('[data-to-loan]', mapRoot).addEventListener('click', () => {
      if (st.est) loan.fromMap(st.est, true);
      const t = $('#splatka');
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => $('[data-price]').focus({ preventScroll: true }), reduced ? 0 : 500);
    });

    fetch('/assets/data/bydleni-mapa.json').then((r) => { if (!r.ok) throw new Error('mapa'); return r.json(); }).then((d) => {
      data = d;
      const box = $('[data-svgbox]', mapRoot);
      box.innerHTML = '';
      svg = el('svg', { viewBox: `0 0 ${d.w} ${d.h}`, role: 'group', 'aria-label': 'Mapa České republiky, průměrné ceny za m²' }, box);
      gK = el('g', {}, svg); gO = el('g', {}, svg);
      $('[data-sel-kraj]', mapRoot).insertAdjacentHTML('beforeend', d.kraje.map((x, i) => `<option value="${i}">${x.n}</option>`).join(''));
      render();
    }).catch(() => { const l = $('[data-load]', mapRoot); if (l) l.textContent = 'Mapu se nepodařilo načíst. Výpočet splátky níže funguje i bez ní.'; });
  }

  /* ===================== Krok 2: hypotéka a úvěr ===================== */
  const L = $('[data-by-loan]');
  const REF = L ? +L.dataset.ref : 0;
  const lst = { kind: 'hypo', priceTouched: false, years: { hypo: 30, uver: 5 }, rate: { hypo: '', uver: '' } };
  const annuity = (P, ratePct, years) => {
    const n = years * 12, r = ratePct / 1200;
    return r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
  };
  const loan = {
    fromMap(e, force) {
      if (!L) return;
      const inp = $('[data-price]', L);
      if (!lst.priceTouched || force) { inp.value = n0(e.mid); lst.priceTouched = false; }
      $('[data-from-map]', L).textContent = lst.priceTouched ? `Z mapy vyšlo ${kc(e.mid)}, máte vlastní cenu.` : `Převzato z mapy (${e.place}).`;
      calc();
    },
  };

  function rateNow() {
    const raw = $('[data-rate]', L).value.trim().replace(',', '.').replace(/[^\d.]/g, '');
    const v = raw === '' ? null : parseFloat(raw);
    const ok = v !== null && isFinite(v) && v > 0 && v < 30;
    return { own: ok ? v : null, bad: raw !== '' && !ok };
  }

  function bars(a, b) {
    const box = $('[data-bars]', L);
    const max = Math.max(a, b) || 1;
    const row = (v, lab, cls) => `<div class="by-brow"><p><span>${lab}</span><b>${kc(v)}</b></p><svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="100" height="10" class="by-btrack"/><rect x="0" y="0" width="${Math.max(5, (v / max) * 100).toFixed(2)}" height="10" class="${cls}"/></svg></div>`;
    box.innerHTML = row(a, 'Splátka s dnešní sazbou', 'by-b1') + row(b, 'Splátka o 1 bod výš', 'by-b2');
    box.setAttribute('aria-label', `Splátka ${kc(a)} měsíčně, při sazbě o 1 bod vyšší ${kc(b)} měsíčně.`);
  }

  function calc() {
    if (!L) return;
    const hypo = lst.kind === 'hypo';
    const years = +$('[data-years]', L).value;
    const own = +$('[data-own]', L).value;
    const price = parseNum($('[data-price]', L).value);
    const P = hypo ? Math.round(price * (1 - own / 100)) : parseNum($('[data-amt]', L).value);
    const r = rateNow();
    $('[data-owno]', L).textContent = `${own} %${hypo && price ? ' · ' + kc(price * own / 100) : ''}`;
    $('[data-yearso]', L).textContent = years + (years === 1 ? ' rok' : years < 5 ? ' roky' : ' let');
    const note = $('[data-rate-note]', L);
    note.classList.toggle('bad', r.bad);
    note.textContent = r.bad ? 'Sazbu zadejte jako číslo, třeba 5,2.' : hypo ? (r.own ? 'Počítám s vaší sazbou. Referenční sazbu máte pod polem pro srovnání.' : `Bez vaší nabídky počítám s referenční sazbou ${pct(REF)}.`) : (r.own ? 'Počítám s vaší sazbou.' : 'U úvěru zadejte sazbu z nabídky.');
    const rate = r.own || (hypo ? REF : null);
    const need = !rate || !P;
    $('[data-need]', L).hidden = !(!hypo && !rate);
    $('[data-out-lab]', L).textContent = hypo ? 'Měsíční splátka hypotéky' : 'Měsíční splátka úvěru';
    $('[data-l-amt]', L).textContent = hypo ? 'Výše hypotéky' : 'Výše úvěru';
    $('[data-o-amt]', L).textContent = P ? kc(P) : '–';
    if (need) {
      $('[data-pmt]', L).innerHTML = '–<small>Kč</small>';
      $('[data-o-rate]', L).textContent = rate ? pct(rate) : '–';
      $('[data-o-tot]', L).textContent = '–';
      $('[data-bars]', L).innerHTML = ''; $('[data-plus]', L).textContent = P ? 'Doplňte sazbu a uvidíte i dopad vyšší sazby.' : 'Zadejte částku.';
      $('[data-plustable]', L).innerHTML = '';
      setSummary(null);
      return;
    }
    const pm = annuity(P, rate, years), pm1 = annuity(P, rate + 1, years);
    const tot = pm * years * 12, tot1 = pm1 * years * 12;
    $('[data-pmt]', L).innerHTML = `${n0(pm)}<small>Kč</small>`;
    $('[data-o-rate]', L).textContent = pct(rate) + (r.own ? '' : ' (ref.)');
    $('[data-o-tot]', L).textContent = kc(tot);
    bars(pm, pm1);
    $('[data-plus]', L).innerHTML = `Při sazbě ${pct(rate + 1)} zaplatíte o <b>${kc(pm1 - pm)} měsíčně</b> víc, za ${years} ${years < 5 ? 'roky' : 'let'} celkem o <b>${kc(tot1 - tot)}</b>.`;
    $('[data-plustable]', L).innerHTML = `<table><thead><tr><th></th><th>Sazba</th><th>Splátka</th><th>Celkem</th><th>Z toho úroky</th></tr></thead><tbody>
      <tr><td>Dnes</td><td>${pct(rate)}</td><td>${kc(pm)}</td><td>${kc(tot)}</td><td>${kc(tot - P)}</td></tr>
      <tr><td>+1 bod</td><td>${pct(rate + 1)}</td><td>${kc(pm1)}</td><td>${kc(tot1)}</td><td>${kc(tot1 - P)}</td></tr></tbody></table>`;
    setSummary({ hypo, P, years, rate, pm, own: !!r.own });
  }

  // Shrnutí pro okno kontaktu (ui.js ho připojí jen po výslovném zaškrtnutí). Nikdy do URL.
  let summary = '';
  window.MM_summary = () => summary;
  function setSummary(s) {
    const e = st.est;
    const place = e ? `${st.type === 'byt' ? 'byt' : 'dům'} ${st.m2} m², ${e.place}, odhad ${mil(e.lo)} až ${mil(e.hi)} Kč` : '';
    const fin = s ? `${s.hypo ? 'hypotéka' : 'úvěr'} ${kc(s.P)} na ${s.years} let, sazba ${pct(s.rate)}${s.own ? ' z nabídky' : ' referenční'}, splátka asi ${kc(s.pm)}` : '';
    summary = [place, fin].filter(Boolean).join('; ');
  }

  function setKind(k) {
    const ri = $('[data-rate]', L);
    lst.rate[lst.kind] = ri.value; ri.value = lst.rate[k];
    if (!ri.dataset.ph) ri.dataset.ph = ri.placeholder;
    ri.placeholder = k === 'hypo' ? ri.dataset.ph : 'z nabídky';
    lst.kind = k;
    $$('[data-kind] button', L).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === k));
    $('[data-hypo]', L).hidden = k !== 'hypo';
    $('[data-uver]', L).hidden = k !== 'uver';
    $('[data-rate-opt]', L).textContent = k === 'hypo' ? 'nepovinné' : 'potřebná';
    $('[data-by-loan] .by-ref').hidden = k !== 'hypo';
    const y = $('[data-years]', L);
    if (k === 'hypo') { y.min = 5; y.max = 30; } else { y.min = 1; y.max = 10; }
    y.value = lst.years[k];
    $('[data-yends]', L).innerHTML = k === 'hypo' ? '<span>5 let</span><span>30 let</span>' : '<span>1 rok</span><span>10 let</span>';
    paint(y);
    calc();
  }

  function initLoan() {
    if (!L) return;
    $$('[data-kind] button', L).forEach((b) => b.addEventListener('click', () => setKind(b.dataset.v)));
    $$('input[type=range]', L).forEach((r) => { paint(r); r.addEventListener('input', () => { paint(r); if (r.matches('[data-years]')) lst.years[lst.kind] = +r.value; calc(); }); });
    const money = (inp, onEdit) => {
      inp.addEventListener('input', () => { onEdit && onEdit(); calc(); });
      inp.addEventListener('blur', () => { const v = parseNum(inp.value); inp.value = v ? n0(v) : ''; });
    };
    money($('[data-price]', L), () => { lst.priceTouched = true; if (st.est) $('[data-from-map]', L).textContent = `Z mapy vyšlo ${kc(st.est.mid)}, máte vlastní cenu.`; });
    money($('[data-amt]', L));
    $('[data-rate]', L).addEventListener('input', calc);
    // Bez mapy (chyba načtení) počítej s výchozí cenou, ať výpočet nikdy nezůstane prázdný.
    if (!parseNum($('[data-price]', L).value)) $('[data-price]', L).value = n0(4500000);
    calc();
  }

  initLoan();
  initMap();
})();
