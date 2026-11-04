/* Důchodová kalkulačka v2: zákonný vzorec 2026, ročník v datech, výdaje státu, mezera, PDF. Bez knihoven, nic se neodesílá. */
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
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

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

  /* --- Souhrn do okna kontaktu (připojí se jen se zaškrtnutím) --- */
  window.MM_summary = () => `rok narození ${S.by}, hrubá mzda ${kc(S.wage)}, odhad důchodu ${nf.format(r100(R.lo.total))}–${nf.format(r100(R.hi.total))} Kč, chybí ${kc(r100(R.gap))} měsíčně`;

  /* --- Zpráva pro PDF: stejná čísla jako na stránce. Klient ji dostane e-mailem, ne stažením. --- */
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
    q('inputs').innerHTML = [['Rok narození', S.by], ['Hrubá mzda', kc(S.wage)], ['Roky pojištění', R.yrs], ['Vychované děti', S.kids], ['Cíl v důchodu', kc(R.want)], ['Zhodnocení po inflaci', S.r + ' % ročně'], ['Začnu odkládat za', S.delay + ' let']].map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('');
  };
  // E-mail s analýzou: formulář ověří ui.js, tady se jen připraví obsah. V návrhu se nic neodesílá.
  const pf = $('[data-pdf-form]');
  if (pf) pf.addEventListener('submit', fillReport, true);
  // Náhled pro Marka, jak PDF vypadá: ?nahled-pdf

  update();
  if (/[?&]nahled-pdf\b/.test(location.search)) { fillReport(); document.body.classList.add('pdf-view'); }
})();
