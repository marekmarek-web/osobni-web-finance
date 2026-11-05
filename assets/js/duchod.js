/* Důchodová kalkulačka v2: zákonný vzorec 2026, ročník v datech, výdaje státu, mezera, kontrola let pojištění, analýza na e-mail. Bez knihoven, odesílá se jen formulář s e-mailem. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $('#d1');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const n1 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kc = (v) => nf.format(Math.round(v)) + ' Kč';
  const r100 = (v) => Math.round(v / 100) * 100;
  const tis = (v) => (v >= 1e6 ? n1.format(v / 1e6) + ' mil. Kč' : nf.format(Math.round(v / 1000)) + ' tis. Kč');
  const O = (k) => $$(`[data-o="${k}"]`);
  const set = (k, v) => O(k).forEach((e) => (e.textContent = v));
  const YEAR = 2026;

  /* --- Parametry 2026 podle ČSSZ (ověřeno 10. 12. 2025). Při změně roku upravit jen tady. --- */
  const P = { base: 4900, r1: 21546, r2: 195868, perYear: 0.01495, kid: 500, min: 9800 };
  const pension = (ovz, yrs, kids) => {
    const vz = Math.min(ovz, P.r1) * 0.99 + Math.max(0, Math.min(ovz, P.r2) - P.r1) * 0.26;
    const pct = Math.ceil(vz * P.perYear * yrs);
    const total = P.base + pct + P.kid * kids;
    return { vz, pct, total: Math.max(total, P.min), raw: total };
  };
  // Věk odchodu podle tabulky v zákoně pro ročníky 1966+: 65 let a měsíc za každý ročník po 1965, nejvýš 67 let.
  const retMonths = (by, law) => (law === 'cap' ? 780 : 780 + Math.min(24, Math.max(0, by - 1965)));
  const ageTxt = (m) => { const y = Math.floor(m / 12), mo = m % 12; return y + ' let' + (mo ? ' a ' + mo + (mo === 1 ? ' měsíc' : mo < 5 ? ' měsíce' : ' měsíců') : ''); };
  const pmt = (cap, rate, years) => { if (years <= 0) return Infinity; const i = rate / 100 / 12, m = years * 12; return i === 0 ? cap / m : (cap * i) / (Math.pow(1 + i, m) - 1); };

  /* --- Stav: zůstane ve prohlížeči, nikdy v adrese --- */
  const KEY = 'mm-duchod-v2';
  const S = { by: 1990, wage: 45000, yrs: null, kids: 0, g: 3, sy: 4, law: 'now', want: null, delay: 0, r: 4 };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  let noSave = false;
  const save = () => { if (noSave) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  /* --- Posuvník a číselné pole drží stejnou hodnotu --- */
  const paint = (r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%');
  const bindNum = (id, onUser) => {
    const r = $(`[data-d="${id}"]`), b = $(`[data-dn="${id}"]`);
    const put = (v) => { r.value = v; if (b) b.value = v; paint(r); };
    r.addEventListener('input', () => { if (b) b.value = r.value; paint(r); onUser(+r.value); });
    if (b) b.addEventListener('change', () => { const v = Math.min(+b.max, Math.max(+b.min, +b.value || +b.min)); put(v); onUser(v); });
    return put;
  };
  const segs = (name, onPick) => {
    const g = $(`[data-d="${name}"]`);
    const mark = (v) => $$('button', g).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === String(v)));
    $$('button', g).forEach((b) => b.addEventListener('click', () => { mark(b.dataset.v); onPick(b.dataset.v); }));
    return mark;
  };

  const put = {};
  put.by = bindNum('by', (v) => { S.by = v; S.yrs = null; update(); });
  put.wage = bindNum('wage', (v) => { S.wage = v; S.want = null; update(); });
  put.yrs = bindNum('yrs', (v) => { S.yrs = v; update(); });
  put.want = bindNum('want', (v) => { S.want = v; update(); });
  put.delay = bindNum('delay', (v) => { S.delay = v; update(); });
  const markKids = segs('kids', (v) => { S.kids = +v; update(); });
  const markLaw = segs('law', (v) => { S.law = v; S.yrs = null; update(); });
  const markR = segs('r', (v) => { S.r = +v; update(); });

  /* --- Hlavní výpočet --- */
  let R = {};
  function compute() {
    const rm = retMonths(S.by, S.law);
    const retAge = rm / 12;
    const age = YEAR - S.by;
    const autoYrs = Math.max(15, Math.min(50, Math.floor(retAge) - 22));
    const yrs = S.yrs == null ? autoYrs : S.yrs;
    const lo = pension(S.wage * 0.8, yrs, S.kids), hi = pension(S.wage, yrs, S.kids);
    const mid = (lo.total + hi.total) / 2;
    const want = S.want == null ? Math.min(120000, Math.max(10000, Math.round((S.wage * 0.7) / 1000) * 1000)) : S.want;
    const gap = Math.max(0, want - mid);
    const cap = gap * 12 * 20;
    const left = retAge - age;
    const now = pmt(cap, S.r, left), later = pmt(cap, S.r, left - S.delay);
    return { rm, retAge, age, yrs, autoYrs, lo, hi, mid, want, gap, cap, left, now, later, retYear: S.by + Math.floor(rm / 12) };
  }

  function update() {
    R = compute();
    put.by(S.by); put.wage(S.wage); put.yrs(R.yrs); put.want(R.want); put.delay(S.delay);
    markKids(S.kids); markLaw(S.law); markR(S.r);
    const range = `${nf.format(r100(R.lo.total))} až ${nf.format(r100(R.hi.total))}`;
    set('range', range);
    set('retAge', ageTxt(R.rm)); set('retAge2', ageTxt(R.rm)); set('retYear', String(R.retYear));
    set('toGo', R.left > 0 ? Math.ceil(R.left) + ' let' : 'už teď');
    // Rozpad důchodu proti dnešní mzdě: kolik z výplaty zůstane.
    const ratio = R.hi.total / S.wage;
    O('parts').forEach((el) => (el.innerHTML = `<div class="pb"><span class="pb-w" style="width:100%"></span><span class="pb-p" style="width:${Math.min(100, ratio * 100)}%"></span></div>
      <p class="pb-t"><b>${Math.round(ratio * 100)} %</b> dnešní hrubé mzdy. Z ${kc(S.wage)} na zhruba ${kc(r100(R.hi.total))}.</p>
      <ul class="pb-l"><li><i class="c1"></i>Základní výměra <b>${kc(P.base)}</b></li><li><i class="c2"></i>Procentní výměra <b>${kc(R.hi.pct)}</b></li>${S.kids ? `<li><i class="c3"></i>Výchovné <b>${kc(S.kids * P.kid)}</b></li>` : ''}</ul>`));
    const w = O('warn')[0];
    w.hidden = R.yrs >= 35;
    w.textContent = R.yrs < 35 ? 'Pozor: na starobní důchod je obvykle potřeba aspoň 35 let pojištění, nebo 30 let ve vyšším věku. Odhad platí, jen pokud nárok vznikne.' : '';
    set('calc', `Váš výpočtový základ (horní hranice) je ${kc(R.hi.vz)}, za ${R.yrs} let pojištění to dělá ${kc(R.hi.pct)} procentní výměry.`);
    set('retTxt', S.law === 'cap'
      ? `Kdyby platil navrhovaný strop 65 let, šli byste v roce ${R.retYear}. Zatím to zákon není.`
      : `Podle dnešní tabulky v zákoně půjdete do důchodu v roce ${R.retYear}. Roky pojištění jsme podle toho odhadli na ${R.autoYrs}.`);
    // Mezera
    set('gap', nf.format(r100(R.gap)));
    set('gapDay', R.gap > 0 ? `To je zhruba ${nf.format(Math.round(R.gap / 30.4))} Kč každý den.` : 'Podle tohoto odhadu vám nic nechybí. Výpis z ČSSZ to potvrdí.');
    set('save', isFinite(R.now) ? kc(r100(R.now)) : '–');
    set('cap', R.gap ? tis(R.cap) : '0 Kč');
    const cost = isFinite(R.later) && isFinite(R.now) ? R.later - R.now : Infinity;
    set('cost', S.delay === 0 ? 'začnete hned' : isFinite(cost) ? '+' + kc(r100(cost)) : 'nestihne se');
    set('saveTxt', R.gap <= 0 ? '' : S.delay === 0
      ? `Když začnete hned, odkládáte ${kc(r100(R.now))} měsíčně po ${Math.ceil(R.left)} let. Posuňte „Začnu odkládat za“ a uvidíte cenu odkladu.`
      : isFinite(R.later) ? `Když začnete za ${S.delay} let, musíte odkládat ${kc(r100(R.later))} měsíčně místo ${kc(r100(R.now))}. Odklad stojí ${kc(r100(cost))} každý měsíc.` : 'Do důchodu už nezbývá dost let, aby se to dalo dohnat jen odkládáním.');
    drawGap();
    set('sRange', `${nf.format(Math.round(R.lo.total / 1000))}–${nf.format(Math.round(R.hi.total / 1000))} tis.`);
    set('sGap', R.gap > 0 ? `${nf.format(Math.round(R.gap / 1000))} tis. měsíčně` : 'nic');
    drawSky(false);
    ckRender();
    save();
  }

  /* --- Graf mezery: cíl, stát, rozdíl. Tři pruhy, jedna osa. --- */
  function drawGap() {
    const svg = O('gapSvg')[0]; if (!svg) return;
    const max = Math.max(R.want, R.mid, 1), W = 420, x0 = 120;
    const row = (y, label, v, fill, txt, dark) => `<text x="0" y="${y + 16}" class="gl">${label}</text><rect x="${x0}" y="${y}" width="${Math.max(4, (v / max) * W)}" height="24" rx="4" fill="${fill}"/><text x="${x0 + Math.max(4, (v / max) * W) + 8}" y="${y + 17}" class="gv${dark ? ' d' : ''}">${txt}</text>`;
    svg.innerHTML = row(4, 'Chcete', R.want, '#FFFFFF', kc(R.want)) + row(44, 'Stát (odhad)', R.mid, '#8D8F96', kc(r100(R.mid))) + row(84, 'Chybí', R.gap, '#F6B91A', kc(r100(R.gap)));
  }

  /* --- Tip: kolik lidí 20–64 na jednoho 65+ --- */
  const gR = $('[data-d="g"]');
  const gShow = () => set('g', n1.format(S.g));
  gR.value = S.g; paint(gR); gShow();
  gR.addEventListener('input', () => { S.g = +gR.value; paint(gR); gShow(); save(); });
  $('[data-reveal]').addEventListener('click', (e) => {
    const out = O('gout')[0]; out.hidden = false; e.currentTarget.hidden = true;
    const d = S.g - 2.81;
    set('gtxt', (Math.abs(d) < 0.25 ? `Trefa. Tipovali jste ${n1.format(S.g)}.` : `Tipovali jste ${n1.format(S.g)}, skutečnost je 2,8.`) + ' V roce 1990 to bylo 4,6. Do roku 2060 to podle projekce klesne na 1,8. Za každým důchodcem bude stát méně lidí, kteří vydělávají.');
    setTimeout(() => out.classList.add('on'), 30);
    S.seen = 1; save(); unlock(true);
  });
  $('[data-share]').addEventListener('click', async (e) => {
    const text = 'V roce 1990 připadalo v Česku na jednoho člověka nad 65 let 4,6 lidí ve věku 20 až 64. Dnes 2,8. V roce 2060 podle projekce 1,8. Spočítejte si, kolik vám bude chybět v důchodu:';
    const url = location.origin + location.pathname;
    try { if (navigator.share) { await navigator.share({ title: 'Důchodová kalkulačka', text, url }); return; } await navigator.clipboard.writeText(text + ' ' + url); e.currentTarget.textContent = 'Zkopírováno'; } catch (err) {}
  });

  /* --- Váš ročník v datech: počet lidí podle věku, rok po roku --- */
  let DATA = null, YRS = [], cur = null, anim = 0;
  const sR = $('[data-d="sy"]'), svg = O('sky')[0];
  const H = 236, BASE = 262, X0 = 58, BW = 572 / 101, MAX = 200000;
  const color = (a, mine) => (mine ? '#F6B91A' : a >= 65 ? '#C98A00' : a >= 20 ? '#2A2D34' : '#CFC9BA');
  function skyFrame(vals, year) {
    const myAge = year - S.by;
    let s = `<line x1="${X0}" x2="630" y1="${BASE - (100000 / MAX) * H}" y2="${BASE - (100000 / MAX) * H}" class="sk-grid"/><text x="${X0 - 8}" y="${BASE - (100000 / MAX) * H + 4}" class="sk-ax" text-anchor="end">100 tis.</text><text x="${X0 - 8}" y="${BASE + 4}" class="sk-ax" text-anchor="end">0</text>`;
    s += `<rect x="${X0 + 20 * BW}" y="${BASE - H - 4}" width="${45 * BW}" height="${H + 4}" class="sk-band"/><text x="${X0 + 42 * BW}" y="${BASE - H + 10}" class="sk-ax" text-anchor="middle">20 až 64 let</text>`;
    for (let a = 0; a <= 100; a++) {
      const v = vals[a] || 0, h = (v / MAX) * H, mine = a === myAge;
      s += `<rect x="${(X0 + a * BW + 0.6).toFixed(1)}" y="${(BASE - h).toFixed(1)}" width="${(BW - 1.2).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${color(a, mine)}"${mine ? ' stroke="#16181D" stroke-width="1.5"' : ''}><title>${a === 100 ? '100 a více' : a} let: ${nf.format(v)} lidí</title></rect>`;
    }
    if (myAge >= 0 && myAge <= 100) {
      const x = X0 + myAge * BW + BW / 2, y = BASE - ((vals[myAge] || 0) / MAX) * H - 10;
      s += `<g class="sk-me"><line x1="${x}" x2="${x}" y1="${y}" y2="${y - 18}"/><text x="${Math.min(600, Math.max(50, x))}" y="${y - 24}" text-anchor="middle">Vy, ${myAge} let</text></g>`;
    }
    s += `<line x1="${X0}" x2="630" y1="${BASE}" y2="${BASE}" class="sk-base"/>`;
    [0, 20, 40, 65, 80, 100].forEach((a) => (s += `<text x="${X0 + a * BW + BW / 2}" y="${BASE + 18}" class="sk-ax" text-anchor="middle">${a}${a === 100 ? '+' : ''}</text>`));
    svg.innerHTML = s;
  }
  const ratioOf = (v) => v.slice(20, 65).reduce((a, b) => a + b, 0) / v.slice(65).reduce((a, b) => a + b, 0);
  function drawSky(animate = true) {
    if (!DATA) return;
    const y = YRS[S.sy], to = DATA.roky[y];
    const from = cur || to;
    cancelAnimationFrame(anim);
    const t0 = performance.now(), dur = animate && !reduced ? 650 : 0;
    const step = (t) => {
      const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      const v = to.map((x, i) => from[i] + (x - from[i]) * e);
      skyFrame(v, +y);
      if (k < 1) anim = requestAnimationFrame(step); else cur = to;
    };
    step(t0 + (dur ? 0 : 1));
    const proj = +y > DATA.skutecnost_do, myAge = +y - S.by, ratio = ratioOf(to);
    set('skyYear', y); set('skyKind', proj ? 'projekce' : 'skutečnost'); set('skyRatio', n2.format(ratio));
    O('skyKind').forEach((e) => e.classList.toggle('proj', proj));
    set('skyCap', myAge < 0 ? `V roce ${y} jste ještě nebyli na světě.` : `V roce ${y} vám ${proj ? 'bude' : 'bylo'} ${myAge} let. Na jednoho člověka nad 65 ${proj ? 'připadne' : 'připadalo'} ${n2.format(ratio)} lidí ve věku 20 až 64.`);
    sR.value = S.sy; paint(sR);
  }
  sR.addEventListener('input', () => { S.sy = +sR.value; stop(); drawSky(); save(); });
  let timer = 0;
  const playB = $('[data-play]');
  const stop = () => { clearInterval(timer); timer = 0; playB.textContent = '▶'; playB.setAttribute('aria-label', 'Přehrát vývoj'); };
  playB.addEventListener('click', () => {
    if (timer) return stop();
    if (S.sy >= YRS.length - 1) S.sy = 0;
    playB.textContent = '❚❚'; playB.setAttribute('aria-label', 'Zastavit');
    drawSky();
    timer = setInterval(() => { if (S.sy >= YRS.length - 1) return stop(); S.sy++; drawSky(); save(); }, reduced ? 1400 : 1000);
  });
  // Graf je zamčený, dokud si člověk netipne: jinak by mu prozradil odpověď.
  const sky = $('[data-sky]');
  function unlock(play) {
    sky.classList.remove('locked'); sky.removeAttribute('inert');
    if (play && !reduced) { S.sy = 0; drawSky(false); setTimeout(() => playB.click(), 500); }
  }
  if (!S.seen) { sky.classList.add('locked'); sky.setAttribute('inert', ''); } else { const out = O('gout')[0]; out.hidden = false; out.classList.add('on'); $('[data-reveal]').hidden = true; set('gtxt', 'V roce 1990 to bylo 4,6. Dnes 2,8. Do roku 2060 to podle projekce klesne na 1,8.'); }
  fetch('/assets/data/vek.json').then((r) => r.json()).then((d) => {
    DATA = d; YRS = Object.keys(d.roky).sort();
    sR.max = YRS.length - 1; if (S.sy > YRS.length - 1) S.sy = YRS.indexOf('2025');
    $('.sky-ends').innerHTML = `<span>${YRS[0]}</span><span>${YRS[YRS.length - 1]}</span>`;
    O('skyTbl')[0].innerHTML = `<table><thead><tr><th>Rok</th><th>Lidí 20–64 na 1 člověka 65+</th><th>Podíl 65+</th><th></th></tr></thead><tbody>${YRS.map((y) => { const v = d.roky[y], t = v.reduce((a, b) => a + b, 0); return `<tr><td>${y}</td><td>${n2.format(ratioOf(v))}</td><td>${n1.format((v.slice(65).reduce((a, b) => a + b, 0) / t) * 100)} %</td><td>${+y > d.skutecnost_do ? 'projekce' : 'skutečnost'}</td></tr>`; }).join('')}</tbody></table>`;
    drawSky(false);
  }).catch(() => { set('skyCap', 'Data se nepodařilo načíst.'); });

  /* --- Ze 100 Kč: sto čtverců, klik ukáže položku --- */
  const BUD = $$('[data-bud]').map((b) => ({ b, name: $('span', b).textContent, pct: +$('b', b).textContent.replace(',', '.') }));
  const MLD = [739.6, 388.1, 157.7, 110.0, 71.0, 50.6, 47.5, 44.1, 15.3, 13.6, 650.1];
  const CNT = [32, 17, 7, 5, 3, 2, 2, 2, 1, 1, 28];
  const coins = $('[data-coins]');
  coins.innerHTML = CNT.map((c, i) => Array.from({ length: c }, () => `<span class="coin ${$('i', BUD[i].b).className}" data-i="${i}"></span>`).join('')).join('');
  const pick = (i) => {
    BUD.forEach((x, j) => x.b.setAttribute('aria-pressed', j === i));
    $$('.coin', coins).forEach((c) => c.classList.toggle('dim', +c.dataset.i !== i));
    set('budName', BUD[i].name); set('budKc', n1.format(BUD[i].pct).replace(',0', '')); set('budMld', n1.format(MLD[i]) + ' mld. Kč ročně');
  };
  BUD.forEach((x, i) => x.b.addEventListener('click', () => pick(i)));
  coins.addEventListener('click', (e) => { const c = e.target.closest('.coin'); if (c) pick(+c.dataset.i); });
  pick(0);
  if ('IntersectionObserver' in window && !reduced) {
    coins.classList.add('wait');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { coins.classList.remove('wait'); coins.classList.add('go'); io.disconnect(); } }), { threshold: 0.3 });
    io.observe(coins);
  }
  $$('.coin', coins).forEach((c, i) => c.style.setProperty('--d', i * 12 + 'ms'));

  /* --- Lišta se souhrnem, když je odhad mimo obrazovku --- */
  const sum = $('[data-sum]');
  if (sum && 'IntersectionObserver' in window) {
    let past = false, atEnd = false;
    const vis = () => { sum.hidden = !past || atEnd; document.body.classList.toggle('sum-on', !sum.hidden); };
    new IntersectionObserver(([e]) => { past = !e.isIntersecting && e.boundingClientRect.top < 0; vis(); }).observe($('#d1 .d-res'));
    new IntersectionObserver(([e]) => { atEnd = e.isIntersecting; vis(); }).observe($('#konec'));
  }

  /* --- Kontrola let pojištění: klient označí roky z výpisu ČSSZ, výpis se nikam nenahrává.
     Pravidla zákona č. 155/1995 Sb.: § 29 (35 let, nebo 30 let bez náhradních dob), § 5 a § 34 odst. 2 (náhradní doby 80 %,
     péče o dítě do 4 let celá), studium jen prvních 6 let po 18 a jen do roku 2009 (ČSSZ, Náhradní doba pojištění, 4. 11. 2026). --- */
  const CKT = { p: 'Práce nebo podnikání', s: 'Studium', d: 'Péče o dítě do 4 let', u: 'Úřad práce', n: 'Bez pojištění' };
  const NEED = 35, NEED_NO_SUB = 30, VOL_MIN = 3428;
  if (!S.tl || typeof S.tl !== 'object') S.tl = {};
  let brush = 'p';
  const spans = (ys) => { const out = []; ys.forEach((y) => { const l = out[out.length - 1]; if (l && l[1] === y - 1) l[1] = y; else out.push([y, y]); }); return out.map(([a, b]) => (a === b ? String(a) : a + '–' + b)).join(', '); };
  const yrsTxt = (v) => { const r = Math.round(v); return r + (r === 1 ? ' rok' : r > 1 && r < 5 ? ' roky' : ' let'); };
  let C = {};
  const ckCompute = () => {
    const Y0 = Math.max(1960, S.by + 18), Y1 = YEAR - 1, rows = [];
    const g = { p: [], sOk: [], sLate: [], sOver: [], d: [], u: [], n: [] };
    for (let y = Y0; y <= Y1; y++) {
      const t = S.tl[y] || 'p';
      let st = 'ok';
      if (t === 'p') g.p.push(y);
      else if (t === 's') { if (y > 2009) { g.sLate.push(y); st = 'bad'; } else if (g.sOk.length < 6) { g.sOk.push(y); st = 'sub'; } else { g.sOver.push(y); st = 'bad'; } }
      else if (t === 'd') { g.d.push(y); st = 'sub'; }
      else if (t === 'u') { g.u.push(y); st = 'sub'; }
      else { g.n.push(y); st = 'bad'; }
      rows.push([y, t, st]);
    }
    const future = Math.max(0, R.retYear - YEAR);
    const own = g.p.length + future;
    const sub = own > 0 ? (g.sOk.length + g.u.length) * 0.8 + g.d.length : 0;
    const total = own + sub;
    const perYear = R.hi.vz * P.perYear;
    const lost = (g.n.length + g.sLate.length + g.sOver.length) * perYear + (g.sOk.length + g.u.length) * 0.2 * perYear;
    return { Y0, Y1, rows, g, future, own, sub, total, perYear, lost };
  };
  const ckFindings = () => {
    const { g, future, own, total, perYear } = C, f = [];
    const kcY = (n) => kc(r100(n * perYear));
    if (total >= NEED) f.push(['ok', 'Platné pravidlo', `Potřebnou dobu pojištění splníte: zhruba ${yrsTxt(total)} z ${NEED} potřebných.`, `Zákon, § 29 odst. 1. Počítáme s tím, že do důchodu budete pojištění dál (${yrsTxt(future)}).`]);
    else f.push(['bad', 'Platné pravidlo', `Do ${NEED} potřebných let vám chybí zhruba ${yrsTxt(NEED - total)}.`, own >= NEED_NO_SUB
      ? `Bez náhradních dob máte ${yrsTxt(own)}. Zákon zná i nárok s ${NEED_NO_SUB} lety doby pojištění bez náhradních dob (§ 29 odst. 3 písm. a).`
      : `Bez splnění podmínek se důchod nepřizná ke dni důchodového věku, jen později. S 20 lety doby pojištění včetně náhradních dob vzniká nárok až 2 roky po důchodovém věku muže stejného data narození (§ 29 odst. 2 písm. g); stejně s 15 lety bez náhradních dob (§ 29 odst. 3 písm. b).`]);
    if (g.n.length) f.push(['bad', 'Model', `${spans(g.n)}: bez pojištění, ${yrsTxt(g.n.length)}. Tyto roky se nezapočtou.`, `Orientační odhad: každý takový rok znamená zhruba ${kcY(1)} měsíčně méně, dohromady asi ${kcY(g.n.length)}. Zákon umožňuje dobrovolné důchodové pojištění, v roce 2026 nejméně ${kc(VOL_MIN)} měsíčně. Bez udání důvodu lze doplatit nejvýše 1 rok zpětně, celkem nejvýše 15 let; z důvodů v zákoně i déle.`]);
    if (g.sLate.length) f.push(['bad', 'Platné pravidlo', `${spans(g.sLate)}: studium po roce 2009 se nezapočítává.`, 'Výjimkou je prezenční doktorské studium, poprvé, ve standardní době a úspěšně dokončené, nejvýš 4 roky.']);
    if (g.sOver.length) f.push(['bad', 'Platné pravidlo', `${spans(g.sOver)}: studium nad 6 let se nezapočte.`, 'Počítá se jen prvních 6 let studia po 18. roce.']);
    if (g.sOk.length) f.push(['doc', 'Platné pravidlo', `${spans(g.sOk)}: studium se započte jako náhradní doba, v rozsahu 80 %.`, 'Ve výpisu ČSSZ často chybí. Délka studia se dokládá až při žádosti o důchod.']);
    if (g.d.length) f.push(['doc', 'Platné pravidlo', `${spans(g.d)}: péče o dítě do 4 let se započte celá.`, 'Ve výpisu může chybět. Rodný list a čestné prohlášení předkládáte až při žádosti o důchod. Muži dokládají péči skončenou do 30. 6. 2007 rozhodnutím správy sociálního zabezpečení.']);
    if (g.u.length) f.push(['doc', 'Platné pravidlo', `${spans(g.u)}: úřad práce se započte jen za dobu s podporou, v rozsahu 80 %.`, 'Platí pro evidenci po roce 1995. Bez podpory nejvýš 3 roky zpětně od vzniku nároku, z toho před 55. rokem nejvýš 1 rok. Co ČSSZ nemá, doložíte potvrzením úřadu práce.']);
    if (!g.n.length && !g.sLate.length && !g.sOver.length) f.push(['ok', 'Předpoklad', 'Mezery jste neoznačili.', 'Platí, jen pokud roky odpovídají výpisu na ePortálu ČSSZ.']);
    return f;
  };
  const ckSumRows = () => [['Práce a podnikání', yrsTxt(C.g.p.length)], ['Náhradní doby, započteno', yrsTxt(C.sub)], ['Nezapočte se', yrsTxt(C.g.n.length + C.g.sLate.length + C.g.sOver.length)], ['Do důchodu, předpoklad', yrsTxt(C.future)], ['Celkem pro nárok', `${yrsTxt(C.total)} z ${NEED}`]];
  const ckYearsHtml = (btn) => C.rows.map(([y, t, st]) => btn
    ? `<button type="button" class="ck-y t-${t}${st === 'bad' ? ' bad' : ''}" data-y="${y}" aria-label="${y}: ${CKT[t]}${st === 'bad' ? ', nezapočte se' : ''}"><b>${String(y).slice(2)}</b></button>`
    : `<span class="ck-y t-${t}${st === 'bad' ? ' bad' : ''}"><b>${String(y).slice(2)}</b></span>`).join('');
  const ckFindHtml = (f) => f.map(([k, chip, h, p]) => `<li class="ck-f ${k}"><span class="ck-chip">${chip}</span><b>${h}</b><span>${p}</span></li>`).join('');
  const CKI = { bad: '<path d="M12 7v6M12 16.5v.5"/>', doc: '<path d="M8 4h6l4 4v12H8zM14 4v4h4M10.5 13h5M10.5 16h5"/>', ok: '<path d="M7.5 12.5l3 3 6-6.5"/>' };
  const ckCards = (f) => f.map(([k, chip, h, p], i) => `<li class="ck-f ${k}" style="--i:${i}"><svg class="ck-ic" viewBox="0 0 24 24" aria-hidden="true">${CKI[k]}</svg><div><span class="ck-chip">${chip}</span><b>${h}</b><span>${p}</span></div></li>`).join('');
  const ckBox = $('[data-ck-years]'), ckOut = $('[data-ck-out]'), ckG = $('[data-ck-gauge]');
  let ckKey = '', ckSig = '';
  // Plynulé dopočítání čísla z předchozí hodnoty.
  const countTo = (el, to, fmt) => {
    const from = +el.dataset.v || 0; el.dataset.v = to;
    if (reduced || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const ckCell = (y, t, st, fut) => fut
    ? `<span class="ck-y fut${y % 5 ? '' : ' tick'}${y === YEAR ? ' now' : ''}" data-fy="${y}"><b>${String(y).slice(2)}</b></span>`
    : `<button type="button" class="ck-y t-${t}${st === 'bad' ? ' bad' : ''}${y % 5 ? '' : ' tick'}" data-y="${y}" aria-label="${y}: ${CKT[t]}${st === 'bad' ? ', nezapočte se' : ''}"><b>${String(y).slice(2)}</b></button>`;
  function ckRender() {
    if (!ckBox) return;
    C = ckCompute();
    if (C.Y0 > C.Y1) { ckBox.innerHTML = ''; ckKey = ''; ckOut.innerHTML = '<p class="mute">Kontrola začíná rokem, kdy vám bylo 18.</p>'; return; }
    const key = C.Y0 + '-' + R.retYear;
    if (key !== ckKey) {
      // Celá osa jen při změně roku narození nebo důchodu. Při malování se mění jen třídy.
      ckKey = key;
      const fut = []; for (let y = YEAR; y < R.retYear; y++) fut.push(ckCell(y, '', '', true));
      ckBox.innerHTML = `<div class="ck-mk"><span>${C.Y0}<small>18 let</small></span><span class="m-ret">${R.retYear}<small>důchod</small></span></div>
        <div class="ck-cells" style="--n:${C.rows.length + fut.length}">${C.rows.map(([y, t, st]) => ckCell(y, t, st, false)).join('')}${fut.join('')}${fut.length ? `<span class="ck-fsum">+${yrsTxt(fut.length)}<small>do důchodu</small></span>` : ''}</div>`;
    } else {
      C.rows.forEach(([y, t, st]) => { const c = ckBox.querySelector(`[data-y="${y}"]`); if (!c) return; c.className = `ck-y t-${t}${st === 'bad' ? ' bad' : ''}${y % 5 ? '' : ' tick'}`; c.setAttribute('aria-label', `${y}: ${CKT[t]}${st === 'bad' ? ', nezapočte se' : ''}`); });
    }
    // Prstenec: 35 let = celý kruh. Vlastní práce, náhradní doby, budoucí roky.
    const L = 2 * Math.PI * 58, cap = (v) => Math.max(0, Math.min(NEED, v));
    const own = cap(C.g.p.length), sub = cap(own + C.sub) - own, fut = cap(own + sub + C.future) - own - sub;
    const seg = (n, from, len) => { const c = ckG.querySelector(`[data-g="${n}"]`); c.style.strokeDasharray = `${(len / NEED) * L} ${L}`; c.style.strokeDashoffset = `${-(from / NEED) * L}`; };
    seg('own', 0, own); seg('sub', own, sub); seg('fut', own + sub, fut);
    countTo($('[data-ck-n]', ckG), Math.round(C.total), (v) => Math.round(v));
    const okAll = C.total >= NEED;
    ckG.classList.toggle('done', okAll);
    $('[data-ck-st]', ckG).textContent = okAll ? 'Potřebnou dobu pojištění splníte.' : `Chybí zhruba ${yrsTxt(NEED - C.total)}.`;
    const lostY = C.g.n.length + C.g.sLate.length + C.g.sOver.length;
    const f = ckFindings(), diff = Math.round(C.total) !== R.yrs, sig = f.map((x) => x[0] + x[2]).join('|') + diff;
    if (!ckOut.firstElementChild || !ckOut.querySelector('.ck-kpi')) {
      ckOut.innerHTML = `<div class="ck-kpi"><div><span>Náhradní doby, započteno</span><b data-k="sub">0</b><small>studium, dítě, úřad práce</small></div><div><span>Nezapočte se</span><b data-k="lost">0</b><small>z označených roků</small></div><div><span>Dopad na důchod, model</span><b data-k="kc">0 Kč</b><small>měsíčně, v dnešních penězích</small></div></div><ol class="ck-list"></ol><div data-ck-use-w></div>`;
    }
    countTo($('[data-k="sub"]', ckOut), Math.round(C.sub), (v) => yrsTxt(v));
    countTo($('[data-k="lost"]', ckOut), lostY, (v) => yrsTxt(v));
    countTo($('[data-k="kc"]', ckOut), r100(C.lost), (v) => (v >= 50 ? '−' + kc(r100(v)) : '0 Kč'));
    if (sig !== ckSig) {
      ckSig = sig;
      const ol = $('.ck-list', ckOut);
      ol.innerHTML = ckCards(f); ol.classList.remove('in'); void ol.offsetWidth; ol.classList.add('in');
      $('[data-ck-use-w]', ckOut).innerHTML = diff ? `<p class="ck-use">V odhadu nahoře počítáte s ${R.yrs} lety pojištění. <button type="button" class="btn w sm" data-ck-use>Použít ${Math.round(C.total)} let v odhadu</button></p>` : '';
    }
  }
  if (ckBox) {
    const marks = $$('[data-ck-brush] button');
    marks.forEach((b) => b.addEventListener('click', () => { brush = b.dataset.v; marks.forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    // Malování tahem: první buňka určí, jestli druh přidávám, nebo mažu. Klávesnice a klepnutí jdou přes click.
    let drag = null;
    const paint = (y) => {
      if (drag.done.has(y)) return; drag.done.add(y);
      if (drag.mode === 'p') delete S.tl[y]; else S.tl[y] = drag.mode;
      ckRender();
    };
    ckBox.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-y]'); if (!b || e.button) return;
      const y = +b.dataset.y;
      drag = { mode: brush === 'p' || S.tl[y] === brush ? 'p' : brush, done: new Set(), moved: false, id: e.pointerId, touch: e.pointerType !== 'mouse' };
      if (!drag.touch) { e.preventDefault(); paint(y); }
    });
    ckBox.addEventListener('pointermove', (e) => {
      if (!drag || drag.touch) return;
      const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest('[data-y]');
      if (b && ckBox.contains(b)) { drag.moved = true; paint(+b.dataset.y); }
    });
    const end = () => { if (drag && drag.done.size) { save(); ckBox.dataset.painted = '1'; } drag = drag && drag.touch ? drag : null; };
    addEventListener('pointerup', end); addEventListener('pointercancel', () => { drag = null; });
    ckBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-y]'); if (!b) return;
      if (ckBox.dataset.painted) { delete ckBox.dataset.painted; drag = null; return; }
      const y = +b.dataset.y;
      if (brush === 'p' || S.tl[y] === brush) delete S.tl[y]; else S.tl[y] = brush;
      drag = null; save(); ckRender();
    });
    ckOut.addEventListener('click', (e) => { if (e.target.closest('[data-ck-use]')) { S.yrs = Math.round(C.total); update(); } });
  }

  /* --- Souhrn do okna kontaktu (připojí se jen se zaškrtnutím) --- */
  window.MM_summary = () => `rok narození ${S.by}, hrubá mzda ${kc(S.wage)}, odhad důchodu ${nf.format(r100(R.lo.total))}–${nf.format(r100(R.hi.total))} Kč, chybí ${kc(r100(R.gap))} měsíčně` +
    (C.rows ? `, roky pojištění pro nárok zhruba ${yrsTxt(C.total)} z ${NEED}` : '');

  /* --- Zpráva pro PDF: stejná čísla jako na stránce. Klient ji dostane e-mailem od Marka, stáhnout ji nejde. --- */
  const fillReport = () => {
    const rp = $('[data-report]'), q = (k) => $(`[data-r="${k}"]`, rp);
    q('date').textContent = new Date().toLocaleDateString('cs-CZ');
    q('lead').textContent = `Ročník ${S.by}, do důchodu v ${ageTxt(R.rm)}, tedy v roce ${R.retYear}. Odhad podle zákonného vzorce a dnešních pravidel.`;
    q('range').textContent = `${nf.format(r100(R.lo.total))} až ${nf.format(r100(R.hi.total))} Kč`;
    q('gap').textContent = kc(r100(R.gap));
    q('want').textContent = kc(R.want);
    q('save').textContent = isFinite(R.now) ? kc(r100(R.now)) : '–';
    q('left').textContent = R.left > 0 ? Math.ceil(R.left) + ' let' : 'už teď';
    const max = Math.max(R.want, R.mid, 1), W = 380, x0 = 110;
    const bar = (y, l, v, f, t) => `<text x="0" y="${y + 15}" font-size="12" fill="#5C5E66">${l}</text><rect x="${x0}" y="${y}" width="${Math.max(4, (v / max) * W)}" height="22" rx="4" fill="${f}"/><text x="${x0 + Math.max(4, (v / max) * W) + 8}" y="${y + 15}" font-size="12" font-weight="700" fill="#16181D">${t}</text>`;
    q('chart').innerHTML = `<svg viewBox="0 0 600 100" role="img" aria-label="Chcete, stát, chybí">${bar(2, 'Chcete', R.want, '#16181D', kc(R.want))}${bar(38, 'Stát (odhad)', R.mid, '#B9BBC2', kc(r100(R.mid)))}${bar(74, 'Chybí', R.gap, '#F6B91A', kc(r100(R.gap)))}</svg>`;
    q('inputs').innerHTML = [['Rok narození', S.by], ['Hrubá mzda', kc(S.wage)], ['Roky pojištění v odhadu', R.yrs], ['Vychované děti', S.kids], ['Cíl v důchodu', kc(R.want)], ['Zhodnocení po inflaci', S.r + ' % ročně'], ['Začnu odkládat za', S.delay + ' let']].map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('');
    if (!C.rows) return;
    q('ckSum').innerHTML = ckSumRows().map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('');
    q('ckYears').innerHTML = `<div class="ck-years">${ckYearsHtml(false)}</div><p class="ck-leg">${Object.keys(CKT).map((k) => `<span><i class="t-${k}"></i>${CKT[k]}</span>`).join('')}<span><i class="bad"></i>Nezapočte se</span></p>`;
    q('ckFind').innerHTML = ckFindHtml(ckFindings());
  };
  addEventListener('beforeprint', fillReport);

  /* --- Analýza na e-mail: ui.js ověří a odešle Markovi. Přiloží se celé nálezy a odkaz na náhled PDF.
     Čísla jsou v odkazu za #, ten prohlížeč na server neposílá. --- */
  const pf = $('[data-pdf-form]');
  if (pf) pf.addEventListener('submit', () => {
    const f = ckFindings().map(([, chip, h, p]) => `${h} ${p} (${chip})`).join(' | ');
    pf.elements.analyza.value = window.MM_summary() + '. Kontrola let: ' + f;
    const st = { by: S.by, wage: S.wage, yrs: S.yrs, kids: S.kids, law: S.law, want: S.want, delay: S.delay, r: S.r, tl: S.tl };
    pf.elements.nahled_pdf.value = location.origin + location.pathname + '?nahled-pdf#a=' + btoa(unescape(encodeURIComponent(JSON.stringify(st))));
  }, true);

  // Náhled PDF pro Marka: ?nahled-pdf, s čísly klienta z odkazu v e-mailu. Do prohlížeče Marka se neukládají.
  const preview = /[?&]nahled-pdf\b/.test(location.search);
  if (preview) {
    const m = location.hash.match(/#a=([\w+/=]+)/);
    if (m) { try { Object.assign(S, JSON.parse(decodeURIComponent(escape(atob(m[1]))))); } catch (e) {} noSave = true; }
  }
  update();
  if (preview) { fillReport(); document.body.classList.add('pdf-view'); }
})();
