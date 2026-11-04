/* Spojený průvodce: důchod, děti, rodina při výpadku příjmu, majetek (plán v2, sekce 7).
   Život volá INSURANCE_COMPUTATION.computeInsurance, investice MM_CALC.invest. Obojí jen čte, nic nemění.
   Hodnoty drží jeden objekt S, ukládá se do localStorage (v try/catch), nic nejde do URL. Zpět nic nemaže. */
(function () {
  'use strict';
  const root = document.querySelector('[data-pruvodce]');
  if (!root) return;
  const $ = (s, r) => (r || root).querySelector(s);
  const $$ = (s, r) => [...(r || root).querySelectorAll(s)];
  const C = window.MM_CALC, I = window.INSURANCE_COMPUTATION;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const num = (v) => nf.format(Math.round(v));
  const kc = (v) => num(v) + ' Kč';
  const short = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: a >= 1e7 ? 0 : 1 }) + ' mil.';
    if (a >= 1e3) return nf.format(v / 1e3) + ' tis.';
    return nf.format(v);
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KK = (n, s) => `<span data-k="${n}">${s}</span>`;
  const COL = { ink: '#16181D', gold: '#F6B91A', mark: '#C98A00', pine: '#0B7A5B', stone: '#A39E90', track: '#ECE8DE', soft: '#FBE7AE' };
  const yrsTxt = (n) => n + (n === 1 ? ' rok' : n > 1 && n < 5 ? ' roky' : ' let');

  const KEY = 'mm-pruvodce-v1';
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    set(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} },
    del() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };

  const NAMES = { duchod: 'Důchod', deti: 'Děti', rodina: 'Rodina při výpadku příjmu', majetek: 'Budování majetku' };
  const SHORTN = { vyber: 'Co chcete vyřešit', spolecne: 'Společné údaje', duchod: 'Důchod', deti: 'Děti', rodina: 'Rodina', majetek: 'Majetek', souhrn: 'Přehled' };
  const ORDER = Object.keys(NAMES);
  // Meze čísel. Posuvník má užší rozsah, číselné pole pustí i víc.
  const F = {
    age: [18, 75], income: [0, 5e6], expenses: [0, 5e6], kids: [0, 8], gross: [0, 5e6], target: [0, 1e6], retAge: [55, 75],
    kidTarget: [0, 2e7], kidSaved: [0, 2e7], liab: [0, 2e8], reserves: [0, 1e8], initial: [0, 1e9], monthly: [0, 1e7], years: [1, 50],
  };
  const DEF = { age: 35, income: 40000, expenses: 25000, kids: 0, gross: null, target: null, retAge: 65, kidAges: [], kidTarget: 300000, kidSaved: 0,
    liab: 0, reserves: 0, partner: '1', osvc: '0', initial: 100000, monthly: 5000, years: 15, rate: '7' };
  const fresh = () => ({ v: JSON.parse(JSON.stringify(DEF)), topics: [], done: [], step: 'vyber' });

  /* --- Stav: načíst, ověřit, předvybrat téma --- */
  let S = fresh();
  const saved = store.get();
  if (saved && typeof saved === 'object') {
    if (saved.v && typeof saved.v === 'object') for (const k in DEF) if (k in saved.v) S.v[k] = saved.v[k];
    if (Array.isArray(saved.topics)) S.topics = saved.topics.filter((t) => ORDER.includes(t));
    if (Array.isArray(saved.done)) S.done = saved.done.filter((t) => typeof t === 'string');
    if (typeof saved.step === 'string') S.step = saved.step;
  }
  for (const k in F) {
    if ((k === 'gross' || k === 'target') && S.v[k] == null) continue;
    if (typeof S.v[k] !== 'number' || !isFinite(S.v[k])) S.v[k] = DEF[k];
    S.v[k] = clamp(S.v[k], F[k][0], F[k][1]);
  }
  if (!Array.isArray(S.v.kidAges)) S.v.kidAges = [];
  S.v.kidAges = S.v.kidAges.map((a) => clamp(+a || 0, 0, 30));
  if (!['5', '7', '9'].includes(String(S.v.rate))) S.v.rate = '7';
  S.v.rate = String(S.v.rate);
  const sortTopics = () => { S.topics = ORDER.filter((t) => S.topics.includes(t)); };
  let preset = root.dataset.preset || '';
  try { const t = new URLSearchParams(location.search).get('tema'); if (!preset && t) preset = t; } catch (e) {}
  const applyPreset = () => { if (ORDER.includes(preset) && !S.topics.includes(preset)) { S.topics.push(preset); sortTopics(); S.step = 'vyber'; } };
  applyPreset();
  sortTopics();

  const steps = () => ['vyber', 'spolecne', ...S.topics, 'souhrn'];
  const counted = () => ['spolecne', ...S.topics];
  const isDone = (k) => S.done.includes(k);
  const markDone = (k) => { if (k && k !== 'vyber' && k !== 'souhrn' && !isDone(k)) S.done.push(k); };
  if (!steps().includes(S.step)) S.step = 'vyber';

  const GF = (I && I.constants && I.constants.GROSS_FROM_NET_FACTOR) || 0.74;
  const get = (k) => {
    if (k === 'gross' && S.v.gross == null) return clamp(Math.round(S.v.income / GF / 1000) * 1000, 0, F.gross[1]);
    if (k === 'target' && S.v.target == null) return clamp(Math.round(S.v.income / 1000) * 1000, 0, F.target[1]);
    return S.v[k];
  };
  const ages = () => { while (S.v.kidAges.length < S.v.kids) S.v.kidAges.push(5); return S.v.kidAges.slice(0, S.v.kids); };

  /* --- Výpočty --- */
  const real = (r) => (1 + r / 100) / 1.02 - 1; // zvolený výnos po inflaci 2 %
  const pmt = (goal, yrs, r) => {
    if (goal <= 0) return 0;
    if (yrs <= 0) return null;
    const a = real(r) / 12, n = yrs * 12;
    return a > 0 ? (goal * a) / (Math.pow(1 + a, n) - 1) : goal / n;
  };
  // Zákonný vzorec, parametry 2026 (plán, sekce 6). Rozpětí = 35 až 45 let pojištění.
  function pens() {
    const g = get('gross'), tgt = get('target'), r = +S.v.rate;
    const vz = Math.min(g, 21546) * 0.99 + Math.max(0, Math.min(g, 195868) - 21546) * 0.26;
    const st = (y) => Math.round(4900 + vz * 0.01495 * y);
    const lo = st(35), mid = st(40), hi = st(45);
    const gap = Math.max(0, tgt - mid), yrs = S.v.retAge - S.v.age, cap = gap * 12 * 20;
    return { lo, mid, hi, gap, tgt, yrs, cap, pm: pmt(cap, yrs, r), late: pmt(cap, yrs - 5, r) };
  }
  function kidsCalc() {
    const r = +S.v.rate, a = real(r) / 12, list = ages(), n = list.length, T = S.v.kidTarget, each = n ? S.v.kidSaved / n : 0;
    const rows = list.map((age, i) => {
      const y = 18 - age;
      if (y <= 0) return { i, age, y, pm: null };
      const m = y * 12, grow = Math.pow(1 + a, m), need = Math.max(0, T - each * grow);
      return { i, age, y, pm: need <= 0 ? 0 : a > 0 ? (need * a) / (grow - 1) : need / m };
    });
    return { rows, sum: rows.reduce((s, x) => s + (x.pm || 0), 0) };
  }
  const life = () => I.computeInsurance({ age: S.v.age, netIncome: S.v.income, expenses: S.v.expenses, liabilities: S.v.liab, reserves: S.v.reserves,
    children: S.v.kids, hasSpouse: S.v.partner === '1', isOsvc: S.v.osvc === '1' });
  const inv = () => { const o = {}; [5, 7, 9].forEach((r) => (o[r] = C.invest({ initial: S.v.initial, monthly: S.v.monthly, years: S.v.years, rate: r }))); return o; };
  // Co by si vybraná a vyplněná témata řekla měsíčně. Pojistné bez nabídky neodhaduji, proto rodina tu chybí.
  function plan() {
    const parts = [];
    if (S.topics.includes('duchod') && isDone('duchod')) { const p = pens(); if (p.pm) parts.push({ k: 'duchod', n: 'Důchod', v: p.pm, c: COL.mark }); }
    if (S.topics.includes('deti') && isDone('deti') && S.v.kids > 0) { const k = kidsCalc(); if (k.sum) parts.push({ k: 'deti', n: 'Děti', v: k.sum, c: COL.gold }); }
    if (S.topics.includes('majetek') && isDone('majetek') && S.v.monthly) parts.push({ k: 'majetek', n: 'Majetek', v: S.v.monthly, c: COL.pine });
    return { parts, total: parts.reduce((s, p) => s + p.v, 0), free: S.v.income - S.v.expenses };
  }

  /* --- Grafy: vlastní SVG, kreslené na skutečnou šířku, překreslení při změně šířky --- */
  const charts = new Map();
  function draw(el) { const b = charts.get(el); if (!b) return; const W = Math.floor(el.clientWidth); el._w = W; if (!W) return; el.innerHTML = b(W, el); }
  const ro = 'ResizeObserver' in window ? new ResizeObserver((es) => es.forEach((e) => { const el = e.target; if (Math.floor(el.clientWidth) !== el._w) draw(el); })) : null;
  function chart(sel, builder, scope) {
    $$(sel, scope).forEach((el) => { if (!charts.has(el) && ro) ro.observe(el); charts.set(el, builder); draw(el); });
  }
  function gcCharts() { charts.forEach((b, el) => { if (!el.isConnected) { charts.delete(el); if (ro) ro.unobserve(el); } }); }

  function hbars(W, rows, max, title) {
    max = max || 1;
    let y = 0, s = '';
    rows.forEach((r) => {
      const lab = r.short && W < 460 ? r.short : r.label;
      s += `<text x="0" y="${y + 14}" class="pv-tl">${esc(lab)}</text>`;
      if (r.value) s += `<text x="${W}" y="${y + 14}" text-anchor="end" class="pv-tv">${esc(r.value)}</text>`;
      const by = y + 24, bh = 16;
      s += `<rect x="0" y="${by}" width="${W}" height="${bh}" rx="8" fill="${COL.track}"/>`;
      const parts = r.parts.filter((p) => p.v > 0);
      let x = 0;
      parts.forEach((p, i) => {
        const w = Math.min(W - x, (p.v / max) * W);
        if (w < 0.5) return;
        const ww = Math.max(1, w - (i < parts.length - 1 ? 2 : 0));
        s += `<rect x="${x.toFixed(1)}" y="${by}" width="${ww.toFixed(1)}" height="${bh}" rx="${Math.min(8, ww / 2).toFixed(1)}" fill="${p.c}"><title>${esc(p.n)}: ${kc(p.v)}</title></rect>`;
        x += w;
      });
      let extra = 0;
      if (r.range) {
        const a = clamp((r.range[0] / max) * W, 1, W - 1), b = clamp((r.range[1] / max) * W, 1, W - 1), ry = by + bh + 8;
        s += `<path d="M${a.toFixed(1)} ${ry - 5}V${ry}H${b.toFixed(1)}V${ry - 5}" fill="none" stroke="${COL.ink}" stroke-width="1.5" stroke-linecap="round"/>`;
        extra = 10;
      }
      if (r.mark != null && r.mark > 0) {
        const mx = clamp((r.mark / max) * W, 1.5, W - 1.5);
        s += `<line x1="${mx.toFixed(1)}" x2="${mx.toFixed(1)}" y1="${by - 5}" y2="${by + bh + 5}" stroke="${COL.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
      }
      if (r.note) { s += `<text x="0" y="${by + bh + extra + 17}" class="pv-tn">${esc(r.note)}</text>`; extra += 20; }
      y = by + bh + extra + 22;
    });
    y -= 10;
    return `<svg width="${W}" height="${y}" viewBox="0 0 ${W} ${y}" role="img" aria-label="${esc(title)}">${s}</svg>`;
  }

  function nice(max) { if (max <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(max))), m = max / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function lines(W, d, H, el) {
    const small = W < 480;
    H = H || (small ? 220 : 270);
    const m = { t: 16, r: 8, b: 24, l: small ? 40 : 50 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = d.x.length;
    const yMax = nice(Math.max(1, ...d.series.flatMap((s) => s.values)));
    const X = (i) => m.l + (n > 1 ? (i / (n - 1)) * iw : 0);
    const Y = (v) => m.t + ih - (v / yMax) * ih;
    let s = '';
    [0, 0.5, 1].forEach((f) => {
      const y = Y(yMax * f).toFixed(1);
      s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" stroke="${f === 0 ? '#C9C4B7' : '#EDEAE1'}" stroke-width="1"/><text x="${m.l - 8}" y="${+y + 4}" text-anchor="end" class="pv-ax">${short(yMax * f)}</text>`;
    });
    [0, Math.round((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).forEach((i, k, a) => {
      s += `<text x="${X(i).toFixed(1)}" y="${H - 6}" text-anchor="${k === 0 ? 'start' : k === a.length - 1 ? 'end' : 'middle'}" class="pv-ax">${esc(d.x[i])}</text>`;
    });
    const path = (vals) => vals.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    d.series.forEach((se) => { if (se.area) s += `<path d="${path(se.values)} L${X(n - 1).toFixed(1)} ${Y(0).toFixed(1)} L${X(0).toFixed(1)} ${Y(0).toFixed(1)} Z" fill="${COL.soft}" opacity=".55"/>`; });
    const labels = [];
    d.series.forEach((se) => {
      s += `<path d="${path(se.values)}" fill="none" stroke="${se.color}" stroke-width="${se.w || 1.6}" stroke-linejoin="round" stroke-linecap="round"${se.dash ? ` stroke-dasharray="${se.dash}"` : ''}/>`;
      const lx = X(n - 1), ly = Y(se.values[n - 1]);
      if (se.dot) s += `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="6.5" fill="${COL.gold}" stroke="#fff" stroke-width="2.5"/>`;
      if (se.label && (H > 200 || se.bold || se.dash)) labels.push({ t: se.label, y: ly - 11, b: se.bold });
    });
    labels.sort((a, b) => a.y - b.y).forEach((l, i, all) => { if (i && l.y - all[i - 1].y < 15) l.y = all[i - 1].y + 15; l.y = Math.max(12, l.y); s += `<text x="${(X(n - 1) - 10).toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="end" class="pv-ll${l.b ? ' b' : ''}">${esc(l.t)}</text>`; });
    s += `<line class="pv-guide" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" stroke="${COL.ink}" stroke-width="1" opacity="0"/>`;
    if (el) el._geo = { l: m.l, iw, n, X, read: d.read };
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.title)}">${s}</svg>`;
  }
  function table(head, rows) {
    return `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  /* --- Data pro grafy --- */
  function invData(m) {
    const r = +S.v.rate, rows = m[7].rows;
    const lab = rows.map((x) => (x.year === 0 ? 'Dnes' : x.year + '. rok'));
    const ser = [5, 9, 7].map((k) => ({ name: k + ' %', values: m[k].rows.map((x) => x.balance), color: k === r ? COL.ink : COL.stone, w: k === r ? 2.6 : 1.4, area: k === r, dot: k === r, label: k + ' %', bold: k === r }));
    ser.sort((a, b) => (a.bold ? 1 : 0) - (b.bold ? 1 : 0));
    ser.push({ name: 'Vklad', values: rows.map((x) => x.invested), color: COL.mark, w: 1.6, dash: '5 5', label: 'Vklad' });
    return { title: `Modelová hodnota investice při 5, 7 a 9 % ročně za ${yrsTxt(S.v.years)}`, x: lab,
      series: ser, read: (i) => `${i === 0 ? 'Dnes' : i + '. rok'}: vklad ${kc(rows[i].invested)} · 5 % ${kc(m[5].rows[i].balance)} · 7 % ${kc(m[7].rows[i].balance)} · 9 % ${kc(m[9].rows[i].balance)}` };
  }
  const penRows = (p) => [{ label: 'Chcete mít', value: kc(p.tgt), parts: [{ n: 'Odhad státního důchodu', v: Math.min(p.mid, p.tgt), c: COL.ink }, { n: 'Chybí', v: p.gap, c: COL.mark }], range: [p.lo, p.hi], note: `Stát odhadem ${short(p.lo)} až ${short(p.hi)} Kč` }];
  const lifeRows = (l) => l.chartData.map((x, i) => ({ label: i === 0 ? 'Nemoc (pracovní neschopnost)' : 'Invalidita', short: i === 0 ? 'Nemoc' : null, value: 'chybí ' + kc(x.chybi), parts: [{ n: 'Odhad od státu', v: Math.min(x.stat, x.prijem + x.chybi), c: COL.ink }, { n: 'Chybí', v: x.chybi, c: COL.mark }] }));
  const lifeMax = (l) => Math.max(...l.chartData.map((x) => x.stat + x.chybi), 1);
  const kidRows = (k) => k.rows.map((x) => ({ label: `${x.i + 1}. dítě, ${yrsTxt(x.age)}`, value: x.pm == null ? 'už je dospělé' : kc(x.pm) + ' měsíčně', parts: [{ n: 'Uplynulo', v: Math.min(18, x.age), c: COL.ink }, { n: 'Zbývá do 18 let', v: Math.max(0, x.y), c: COL.gold }], note: x.pm == null ? '' : `Do 18 let zbývá ${yrsTxt(x.y)}` }));

  /* --- Výstupy kroků --- */
  const out = (k, html) => $$(`[data-o="${k}"]`).forEach((e) => { e.innerHTML = html; });
  function renderSteps() {
    const v = S.v, free = v.income - v.expenses;
    out('free', num(free));
    $('[data-o="freewarn"]').hidden = free >= 0;
    chart('[data-chart="cash"]', (W) => hbars(W, [{ label: 'Čistý příjem', value: kc(v.income), parts: [{ n: 'Nutné výdaje', v: Math.min(v.expenses, v.income), c: COL.ink }, { n: 'Zbývá', v: Math.max(0, free), c: COL.gold }], note: `Výdaje ${kc(v.expenses)} · zbývá ${kc(free)}` }], Math.max(v.income, v.expenses), 'Čistý příjem rozdělený na nutné výdaje a co zbývá'));

    const p = pens();
    out('pgap', num(p.gap));
    out('pday', p.gap > 0 ? `To je asi <b>${kc(p.gap / 30)} denně</b>.` : 'Podle odhadu by na zvolený příjem mohl stačit státní důchod.');
    out('pstate', `${short(p.lo)} až ${short(p.hi)} Kč`);
    out('psave', p.pm == null ? 'méně než rok' : kc(p.pm));
    out('plate', p.late == null ? 'nestihne se' : kc(p.late));
    chart('[data-chart="pen"]', (W) => hbars(W, penRows(p), Math.max(p.tgt, p.hi), 'Cílový příjem v důchodu, odhad státu a mezera'));
    out('ptbl', table(['Položka', 'Měsíčně'], [['Chcete mít', kc(p.tgt)], ['Stát, 35 let pojištění', kc(p.lo)], ['Stát, 40 let pojištění', kc(p.mid)], ['Stát, 45 let pojištění', kc(p.hi)], ['Mezera (ze 40 let)', kc(p.gap)], ['Mezera denně', kc(p.gap / 30)], ['Kapitál na 20 let čerpání', kc(p.cap)], ['Odkládat měsíčně při ' + v.rate + ' %', p.pm == null ? '—' : kc(p.pm)], ['Při odkladu o 5 let', p.late == null ? '—' : kc(p.late)]]));

    const hasKids = v.kids > 0;
    $('[data-o="nokids"]').hidden = hasKids;
    $('[data-o="kidsbox"]').hidden = !hasKids;
    renderKidAges();
    const k = kidsCalc();
    out('ksum', num(k.sum));
    chart('[data-chart="kids"]', (W) => hbars(W, kidRows(k), 18, 'Kolik let zbývá každému dítěti do 18 a kolik odkládat'));
    out('ktbl', table(['Dítě', 'Věk', 'Do 18 let', 'Odkládat měsíčně'], k.rows.map((x) => [`${x.i + 1}. dítě`, yrsTxt(x.age), x.y > 0 ? yrsTxt(x.y) : '—', x.pm == null ? '—' : kc(x.pm)])));

    const l = life();
    out('lgap', num(l.invalidityGapMonthly));
    chart('[data-chart="life"]', (W) => hbars(W, lifeRows(l), lifeMax(l), 'Výpadek příjmu při nemoci a invaliditě: odhad od státu a co chybí'));
    out('llist', `<div class="resrow"><div><b>Úmrtí</b><span>Závazky a zabezpečení rodiny minus rezervy</span></div><strong>${kc(l.deathCoverage)}</strong></div>
      <div class="resrow hi"><div><b>Invalidita</b><span>Renta ${kc(l.gapD3Renta)} měsíčně</span></div><strong>${kc(l.capitalD3)}</strong></div>
      <div class="resrow"><div><b>Pracovní neschopnost</b><span>Denní dávka</span></div><strong>${kc(l.pnDailyNeed)}<small> / den</small></strong></div>`);
    out('ltbl', table(['Situace', 'Příjem', 'Od státu', 'Chybí'], l.chartData.map((x, i) => [i ? 'Invalidita' : 'Nemoc', kc(x.prijem), kc(x.stat), kc(x.chybi)])) +
      table(['Orientační krytí', 'Částka'], [['Úmrtí', kc(l.deathCoverage)], ['Invalidita', kc(l.capitalD3)], ['Pracovní neschopnost, denně', kc(l.pnDailyNeed)], ['Trvalé následky úrazu', kc(l.tnBase)]]));

    const m = inv(), r = +v.rate, sel = m[r];
    out('mlab', `Modelová hodnota za ${yrsTxt(v.years)} při ${r} % ročně`);
    out('mval', num(sel.balance));
    out('minv', kc(sel.invested));
    out('mrange', `${short(m[5].balance)} až ${short(m[9].balance)} Kč`);
    out('freehint', free > 0 ? `Po nutných výdajích vám zbývá ${kc(free)} měsíčně.` : '');
    chart('[data-chart="inv"]', (W, el) => lines(W, invData(m), 0, el));
    const yr = m[7].rows.filter((x) => v.years <= 15 || x.year % 5 === 0 || x.year === v.years);
    out('mtbl', table(['Rok', 'Vklad', '5 %', '7 %', '9 %'], yr.map((x) => [x.year === 0 ? 'Dnes' : x.year + '. rok', kc(x.invested), kc(m[5].rows[x.year].balance), kc(m[7].rows[x.year].balance), kc(m[9].rows[x.year].balance)])));
    const rd = $('[data-o="mread"]'); if (rd && !rd._live) rd.textContent = 'Přejeďte grafem, ukážu hodnoty po letech.';
  }

  let kidN = -1;
  function renderKidAges() {
    const box = $('[data-o="kidages"]'), a = ages();
    if (a.length !== kidN) {
      kidN = a.length;
      box.innerHTML = a.map((x, i) => `<div class="pv-kid"><span>${i + 1}. dítě</span><div class="pv-stepper sm"><button type="button" data-kd="-1" data-i="${i}" aria-label="${i + 1}. dítě o rok mladší">−</button><input type="text" inputmode="numeric" autocomplete="off" data-kage="${i}" aria-label="Věk ${i + 1}. dítěte v letech"><button type="button" data-kd="1" data-i="${i}" aria-label="${i + 1}. dítě o rok starší">+</button></div><i>let</i></div>`).join('');
    }
    $$('[data-kage]', box).forEach((inp) => { if (inp !== document.activeElement) inp.value = a[+inp.dataset.kage]; });
  }

  /* --- Co už jde říct / co zatím nejde --- */
  function insights() {
    const can = [], cant = [], v = S.v, free = v.income - v.expenses, has = (t) => S.topics.includes(t);
    if (isDone('spolecne')) can.push(free >= 0 ? `Po nutných výdajích vám zbývá <b>${kc(free)}</b> měsíčně.` : `Výdaje jsou vyšší než příjem o <b>${kc(-free)}</b> měsíčně. To má přednost.`);
    else cant.push('Kolik vám měsíčně zbývá. Chybí společné údaje.');
    if (has('duchod')) {
      if (isDone('duchod')) { const p = pens(); can.push(p.gap > 0 ? `V důchodu může chybět zhruba <b>${kc(p.gap)}</b> měsíčně, asi ${kc(p.gap / 30)} denně.` : 'Na zvolený příjem v důchodu by podle hrubého odhadu mohl stačit stát.'); }
      else cant.push('Mezera v důchodu. Doplňte krok Důchod.');
      cant.push('Přesný důchod. Nárok stanoví ČSSZ, odhad zpřesní váš výpis.');
    }
    if (has('deti')) {
      if (v.kids === 0) cant.push('Odklad na děti. Ve společných údajích je 0 dětí.');
      else if (isDone('deti')) can.push(`Na start dětí odkládat zhruba <b>${kc(kidsCalc().sum)}</b> měsíčně.`);
      else cant.push('Odklad na děti. Doplňte krok Děti.');
    }
    if (has('rodina')) {
      if (isDone('rodina')) { const l = life(); can.push(`Při invaliditě by chybělo <b>${kc(l.invalidityGapMonthly)}</b> měsíčně, při nemoci ${kc(l.chartData[0].chybi)}. Hrubý model.`); }
      else cant.push('Výpadek příjmu. Doplňte krok Rodina.');
      cant.push('Jestli vaše dnešní pojistka sedí. To ukáže až pohled do smlouvy.');
    }
    if (has('majetek')) {
      if (isDone('majetek')) { const m = inv(); can.push(`Za ${yrsTxt(v.years)} model dává <b>${short(m[5].balance)} až ${short(m[9].balance)} Kč</b>, podle předpokladu 5 až 9 %.`); }
      else cant.push('Modelová hodnota investice. Doplňte krok Majetek.');
      cant.push('Jaký výnos opravdu přijde. Ten nikdo nezaručí.');
    }
    const pl = plan();
    if (isDone('spolecne') && pl.parts.length > 1) can.push(`Vyplněná témata by si řekla <b>${kc(pl.total)}</b> měsíčně z ${kc(Math.max(0, pl.free))}, které zbývají.`);
    cant.push('Konkrétní produkt. Bez rozhovoru o cílech a riziku ho doporučit nejde.');
    return { can, cant };
  }
  const li = (arr, empty) => (arr.length ? arr : [empty]).map((t) => `<li>${t}</li>`).join('');

  /* --- Přehled --- */
  function renderSummary() {
    const pl = plan(), v = S.v, hasSpol = isDone('spolecne');
    let h;
    if (!hasSpol) h = 'Doplňte společné údaje, ať jde plán porovnat s tím, co vám měsíčně zbývá.';
    else if (!pl.parts.length) h = `Po nutných výdajích vám zbývá <b>${kc(pl.free)}</b> měsíčně. Vyplněná témata zatím nemají měsíční částku.`;
    else {
      const diff = pl.free - pl.total;
      h = `Vyplněná témata by si řekla <b>${kc(pl.total)}</b> měsíčně. Po nutných výdajích vám zbývá <b>${kc(pl.free)}</b>. ` + (diff >= 0 ? `Vešlo by se to, zbylo by ${kc(diff)}.` : `Chybí ${kc(-diff)}, takže se vyplatí určit, co má přednost.`);
    }
    out('planh', h);
    const rows = [{ label: 'Zbývá měsíčně', value: kc(pl.free), parts: [{ n: 'Zbývá po nutných výdajích', v: Math.max(0, pl.free), c: COL.ink }] }];
    if (pl.parts.length) rows.push({ label: 'Vyplněná témata by si řekla', value: kc(pl.total), parts: pl.parts, mark: pl.free > 0 ? pl.free : null });
    chart('[data-chart="plan"]', (W) => hbars(W, rows, Math.max(pl.free, pl.total, 1), 'Kolik měsíčně zbývá a kolik by si řekla vyplněná témata'));
    out('planleg', [`<span><i style="background:${COL.ink}"></i>Zbývá po nutných výdajích</span>`, ...pl.parts.map((p) => `<span><i style="background:${p.c}"></i>${p.n} ${kc(p.v)}</span>`)].join('') +
      (S.topics.includes('rodina') ? '<span class="pv-legnote">Zajištění rodiny tu měsíční částku nemá, cenu pojistky bez nabídky neodhaduji.</span>' : ''));
    out('stbl', table(['Položka', 'Měsíčně'], [['Čistý příjem', kc(v.income)], ['Nutné výdaje', kc(v.expenses)], ['Zbývá', kc(pl.free)], ...pl.parts.map((p) => [p.n, kc(p.v)]), ['Témata celkem', kc(pl.total)]]));

    const card = (t, inner) => `<article class="pv-card${isDone(t) ? '' : ' todo'}"><div class="pv-card-h"><span class="pv-ic sm" aria-hidden="true">${$(`[data-topic="${t}"] .pv-ic`).innerHTML}</span><h3>${NAMES[t]}</h3><button class="pv-mini" type="button" data-goto="${t}">${isDone(t) ? 'Upravit' : 'Doplnit'}</button></div>${isDone(t) ? inner : '<p class="pv-todo">Zatím nevyplněno. Doplněním se objeví i v přehledu nahoře.</p>'}</article>`;
    const html = S.topics.map((t) => {
      if (t === 'duchod') { const p = pens(); return card(t, `<p class="pv-cbig">${kc(p.gap)}<small> může chybět měsíčně</small></p><p class="pv-cline">Asi ${kc(p.gap / 30)} denně. Odkládat ${p.pm == null ? '—' : kc(p.pm)} měsíčně při ${v.rate} %.</p><div class="pv-chart" data-chart="s-pen"></div><a class="pv-link" href="/duchodova-kalkulacka/">Podrobně v důchodové kalkulačce</a>`); }
      if (t === 'deti') { if (!v.kids) return card(t, '<p class="pv-todo">Ve společných údajích je 0 dětí.</p>'); const k = kidsCalc(); return card(t, `<p class="pv-cbig">${kc(k.sum)}<small> měsíčně</small></p><p class="pv-cline">${v.kids === 1 ? '1 dítě' : v.kids + (v.kids < 5 ? ' děti' : ' dětí')}, každé ${short(v.kidTarget)} Kč v 18 letech, při ${v.rate} %.</p><div class="pv-chart" data-chart="s-kids"></div>`); }
      if (t === 'rodina') { const l = life(); return card(t, `<p class="pv-cbig">${kc(l.invalidityGapMonthly)}<small> chybí měsíčně při invaliditě</small></p><p class="pv-cline">Orientační krytí: úmrtí ${short(l.deathCoverage)} Kč, invalidita ${short(l.capitalD3)} Kč. ${KK(61, 'Heuristika.')}</p><div class="pv-chart" data-chart="s-life"></div>`); }
      const m = inv(); return card(t, `<p class="pv-cbig">${short(m[+v.rate].balance)} Kč<small> za ${yrsTxt(v.years)} při ${v.rate} %</small></p><p class="pv-cline">Při 5 až 9 %: ${short(m[5].balance)} až ${short(m[9].balance)} Kč. Vložíte ${short(m[7].invested)} Kč.</p><div class="pv-chart pv-line sm" data-chart="s-inv"></div>`);
    }).join('');
    const box = $('[data-o="cards"]');
    box.innerHTML = html;
    box.classList.toggle('one', S.topics.length === 1);
    gcCharts();
    const p = pens(), k = kidsCalc(), l = life(), m = inv();
    chart('[data-chart="s-pen"]', (W) => hbars(W, penRows(p), Math.max(p.tgt, p.hi), 'Důchod: cíl, odhad státu a mezera'), box);
    chart('[data-chart="s-kids"]', (W) => hbars(W, kidRows(k), 18, 'Děti: roky do 18 a měsíční odklad'), box);
    chart('[data-chart="s-life"]', (W) => hbars(W, lifeRows(l), lifeMax(l), 'Rodina: výpadek příjmu při nemoci a invaliditě'), box);
    chart('[data-chart="s-inv"]', (W, el) => lines(W, invData(m), 150, el), box);
  }

  /* --- Navigace a průběh --- */
  function renderNav() {
    const st = steps(), at = st.indexOf(S.step), cnt = counted(), d = cnt.filter(isDone).length;
    // Krokoměr ukazuje stejné kroky jako seznam vpravo: krok X z Y, fajfka jen u kroků, které už jsou za vámi.
    out('count', S.topics.length ? `Krok <b>${at + 1} z ${st.length}</b>` : 'Vyberte, co chcete mít vyřešené');
    const bar = $('[data-o="bar"]'); if (bar) bar.style.width = (S.topics.length ? ((at + 1) / st.length) * 100 : 0) + '%';
    out('steps', st.map((k, i) => { const past = i < at && (k === 'vyber' || isDone(k)); return `<li><button type="button" data-step="${k}"${k === S.step ? ' aria-current="step"' : ''}${past ? ' class="done"' : ''}><i>${past ? '✓' : i + 1}</i><span>${SHORTN[k]}</span></button></li>`; }).join(''));
    const nx = st[at + 1];
    $$('[data-next-t]').forEach((e) => { e.textContent = S.step === 'vyber' ? 'Pokračovat' : nx === 'souhrn' ? 'Ukázat přehled' : 'Dál: ' + SHORTN[nx]; });
    $$('[data-topic]').forEach((b) => b.setAttribute('aria-pressed', S.topics.includes(b.dataset.topic)));
    const ins = insights();
    out('can', li(ins.can, 'Zatím nic. Stačí pár čísel.')); out('cant', li(ins.cant, ''));
    out('can2', li(ins.can, 'Zatím nic. Stačí pár čísel.')); out('cant2', li(ins.cant, ''));
    $('[data-o="know"]').hidden = S.step === 'souhrn';
    const names = S.topics.map((t) => NAMES[t].toLowerCase()).join(', ');
    const subj = 'Chci probrat svůj přehled z průvodce' + (names ? ` (${names})` : '') + '.';
    document.querySelectorAll('#konec [data-contact], [data-pstep="souhrn"] [data-contact]').forEach((b) => b.setAttribute('data-contact', subj));
  }

  function syncFields() {
    $$('[data-f]').forEach((w) => {
      const k = w.dataset.f, val = get(k), n = $('[data-num]', w), r = $('[data-rng]', w);
      if (n !== document.activeElement) n.value = num(val);
      r.value = clamp(val, +r.min, +r.max);
      r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%');
    });
    const kn = $('#pv-kids'); if (kn !== document.activeElement) kn.value = S.v.kids;
    $$('[data-auto]').forEach((e) => { e.hidden = S.v[e.dataset.auto] != null; });
    $$('[data-seg]').forEach((g) => $$('button', g).forEach((b) => b.setAttribute('aria-pressed', String(S.v[g.dataset.seg]) === b.dataset.v)));
  }

  const save = () => store.set({ v: S.v, topics: S.topics, done: S.done, step: S.step });
  function update() {
    syncFields();
    renderSteps();
    if (S.step === 'souhrn') renderSummary();
    renderNav();
    save();
  }

  function go(step, focus) {
    if (!steps().includes(step)) step = 'vyber';
    S.step = step;
    $$('[data-pstep]').forEach((s) => { const on = s.dataset.pstep === step; s.hidden = !on; s.classList.toggle('enter', on && !reduced && !!focus); });
    root.classList.toggle('is-sum', step === 'souhrn');
    update();
    if (focus) {
      const top = root.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.5) root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      const h = $('#pv-h-' + step); if (h) h.focus({ preventScroll: true });
    }
  }
  const stepOf = (el) => { const s = el.closest('[data-pstep]'); return s && s.dataset.pstep; };
  const setV = (k, val, from) => { S.v[k] = val; markDone(stepOf(from)); update(); };

  /* --- Události --- */
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-rng]')) { const k = t.dataset.rng; setV(k, +t.value, t); return; }
    if (t.matches('[data-num]')) {
      const k = t.dataset.num, raw = t.value.replace(/[^\d]/g, '');
      if (raw === '') return;
      setV(k, clamp(+raw, F[k][0], F[k][1]), t);
      return;
    }
    if (t.matches('[data-kage]')) {
      const raw = t.value.replace(/[^\d]/g, ''); if (raw === '') return;
      S.v.kidAges[+t.dataset.kage] = clamp(+raw, 0, 30); markDone('deti'); update();
    }
  });
  root.addEventListener('focusout', (e) => { if (e.target.matches('[data-num],[data-kage]')) setTimeout(() => { syncFields(); renderKidAges(); }, 0); });
  root.addEventListener('keydown', (e) => {
    const t = e.target;
    if (!t.matches('[data-num],[data-kage]') || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const dir = e.key === 'ArrowUp' ? 1 : -1;
    if (t.dataset.kage != null) { const i = +t.dataset.kage; S.v.kidAges[i] = clamp(ages()[i] + dir, 0, 30); markDone('deti'); update(); t.value = S.v.kidAges[i]; return; }
    const k = t.dataset.num, r = $(`[data-rng="${k}"]`), step = r ? +r.step : 1;
    S.v[k] = clamp(get(k) + dir * step, F[k][0], F[k][1]); markDone(stepOf(t)); update(); t.value = num(get(k));
  });
  let resetT = 0;
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    if (b.dataset.topic) {
      const t = b.dataset.topic;
      S.topics = S.topics.includes(t) ? S.topics.filter((x) => x !== t) : S.topics.concat(t);
      sortTopics();
      if (S.topics.length) $('[data-o="pickmsg"]').hidden = true;
      update(); return;
    }
    if (b.hasAttribute('data-next')) {
      if (S.step === 'vyber' && !S.topics.length) { const m = $('[data-o="pickmsg"]'); m.hidden = false; $('[data-topic]').focus(); return; }
      markDone(S.step);
      const st = steps(); go(st[st.indexOf(S.step) + 1], true); return;
    }
    if (b.hasAttribute('data-back')) { const st = steps(); go(st[Math.max(0, st.indexOf(S.step) - 1)], true); return; }
    if (b.dataset.goto) { go(b.dataset.goto, true); return; }
    if (b.dataset.step) { go(b.dataset.step, true); return; }
    if (b.dataset.v != null && b.parentElement.dataset.seg) { setV(b.parentElement.dataset.seg, b.dataset.v, b); return; }
    if (b.dataset.d) { S.v.kids = clamp(S.v.kids + +b.dataset.d, F.kids[0], F.kids[1]); markDone('spolecne'); update(); return; }
    if (b.dataset.kd) { const i = +b.dataset.i; S.v.kidAges[i] = clamp(ages()[i] + +b.dataset.kd, 0, 30); markDone('deti'); update(); return; }
    if (b.hasAttribute('data-reset')) {
      if (!b.dataset.armed) {
        b.dataset.armed = '1'; b.textContent = 'Opravdu smazat? Klikněte znovu.';
        clearTimeout(resetT); resetT = setTimeout(() => { delete b.dataset.armed; b.textContent = 'Smazat uložené hodnoty'; }, 5000);
        return;
      }
      clearTimeout(resetT); delete b.dataset.armed;
      store.del(); S = fresh(); applyPreset(); kidN = -1;
      b.textContent = 'Smazáno. Začínáme znovu.';
      setTimeout(() => { b.textContent = 'Smazat uložené hodnoty'; }, 3000);
      go('vyber', true);
    }
  });
  // Odečet z grafu investice: tah prstem nebo myší ukáže hodnoty v daném roce.
  const readAt = (el, e) => {
    const g = el._geo; if (!g) return;
    const x = e.clientX - el.getBoundingClientRect().left, i = clamp(Math.round(((x - g.l) / g.iw) * (g.n - 1)), 0, g.n - 1);
    const line = el.querySelector('.pv-guide'); if (line) { line.setAttribute('x1', g.X(i)); line.setAttribute('x2', g.X(i)); line.setAttribute('opacity', 0.35); }
    const rd = el.parentElement.querySelector('[data-o="mread"]'); if (rd && g.read) { rd._live = true; rd.textContent = g.read(i); }
  };
  root.addEventListener('pointermove', (e) => { const el = e.target.closest('[data-chart="inv"]'); if (el) readAt(el, e); });
  root.addEventListener('pointerdown', (e) => { const el = e.target.closest('[data-chart="inv"]'); if (el) readAt(el, e); });
  root.addEventListener('pointerout', (e) => {
    const el = e.target.closest('[data-chart="inv"]'); if (!el || el.contains(e.relatedTarget)) return;
    const line = el.querySelector('.pv-guide'); if (line) line.setAttribute('opacity', 0);
    const rd = el.parentElement.querySelector('[data-o="mread"]'); if (rd) { rd._live = false; rd.textContent = 'Přejeďte grafem, ukážu hodnoty po letech.'; }
  });

  // Souhrn pro zaškrtávátko „Připojit hodnoty výpočtu“ v kontaktním okně. Připojí se jen se zaškrtnutím.
  window.MM_summary = () => {
    const a = [];
    if (S.topics.includes('duchod') && isDone('duchod')) a.push('důchod: mezera ~' + kc(pens().gap) + ' měs.');
    if (S.topics.includes('deti') && isDone('deti') && S.v.kids) a.push('děti: ~' + kc(kidsCalc().sum) + ' měs.');
    if (S.topics.includes('rodina') && isDone('rodina')) a.push('invalidita: chybí ~' + kc(life().invalidityGapMonthly) + ' měs.');
    if (S.topics.includes('majetek') && isDone('majetek')) a.push('majetek: ' + kc(S.v.monthly) + ' měs., ' + yrsTxt(S.v.years) + ' při ' + S.v.rate + ' %');
    return a.length ? 'Průvodce, ' + a.join('; ') : '';
  };

  go(S.step, false);
})();
