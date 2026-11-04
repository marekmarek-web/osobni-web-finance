/* Reality: čistá částka po prodeji a jednoduché srovnání pronájmu s investicí. Orientační, bez knihoven. */
(function () {
  const root = document.querySelector('.rl');
  if (!root) return;
  const q = (s) => root.querySelector(s);
  const qa = (s) => [...root.querySelectorAll(s)];
  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const kc = (v) => nf.format(Math.round(v)) + ' Kč';
  const mil = (v) => (v / 1e6).toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const r10 = (v) => Math.round(v / 10000) * 10000;
  const R = {}; qa('[data-r]').forEach((el) => (R[el.dataset.r] = el));
  const S = { jist: 5, vyn: 4 };
  const out = (k) => q('[data-out="' + k + '"]');
  const bar = (k) => q('[data-b="' + k + '"]');
  const paint = (el) => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
  const v = (k) => +R[k].value;

  function update() {
    const cena = v('cena'), hypo = v('hypo'), nakl = v('nakl') / 100, u = S.jist / 100;
    q('[data-o="hypo"]').textContent = hypo ? mil(hypo) + ' mil. Kč' : 'bez hypotéky';
    q('[data-o="nakl"]').textContent = String(v('nakl')).replace('.', ',') + ' %';
    q('[data-o="cena"]').textContent = mil(cena) + ' mil. Kč';
    const net = (p) => p - hypo - p * nakl;
    const lo = r10(net(cena * (1 - u))), hi = r10(net(cena * (1 + u))), mid = net(cena);
    const neg = lo < 0;
    out('range').innerHTML = hi <= 0 ? '0<small>Kč</small>' : (neg ? '0' : mil(lo)) + '–' + mil(hi) + '<small>mil. Kč</small>';
    out('warn').hidden = !neg;
    const nCost = cena * nakl, you = Math.max(mid, 0), tot = Math.max(hypo + nCost + you, 1);
    bar('h').style.width = (hypo / tot) * 100 + '%';
    bar('n').style.width = (nCost / tot) * 100 + '%';
    bar('y').style.width = (you / tot) * 100 + '%';
    out('h').textContent = kc(hypo);
    out('n').textContent = kc(nCost);
    out('mid').textContent = mid < 0 ? 'chybí ' + kc(r10(-mid)) : kc(r10(mid));

    // Pronájem proti investování čisté částky (střed odhadu).
    const najem = v('najem'), rn = v('rnakl') / 100;
    q('[data-o="najem"]').textContent = kc(najem);
    q('[data-o="rnakl"]').textContent = v('rnakl') + ' %';
    const rent = najem * 12 * (1 - rn), inv = you * (S.vyn / 100), mx = Math.max(rent, inv, 1);
    out('rent').textContent = kc(rent) + ' ročně';
    out('inv').textContent = kc(inv) + ' ročně';
    out('rentm').textContent = 'Zhruba ' + kc(rent / 12) + ' měsíčně po nákladech, nemovitost zůstává vaše.';
    out('invm').textContent = 'Zhruba ' + kc(inv / 12) + ' měsíčně při ' + S.vyn + ' % ročně z ' + kc(r10(you)) + '.';
    bar('rent').style.width = (rent / mx) * 100 + '%';
    bar('inv').style.width = (inv / mx) * 100 + '%';
    const d = rent - inv, near = Math.abs(d) < mx * 0.1;
    out('verdict').textContent = you <= 0 ? 'Po prodeji by nezbyla částka k investování. Tohle chce probrat osobně.'
      : near ? 'Při těchto předpokladech vychází obě cesty podobně. Rozhodne to, co od peněz čekáte a kolik práce s nájmem chcete.'
        : (d > 0 ? 'Při těchto předpokladech vychází vyšší roční příjem z pronájmu, zhruba o ' : 'Při těchto předpokladech vychází vyšší roční příjem z investice, zhruba o ') + kc(Math.abs(d)) + '.';

    window.MM_summary = () => 'cena ' + mil(cena) + ' mil. Kč, hypotéka ' + mil(hypo) + ' mil. Kč, náklady ' + String(v('nakl')).replace('.', ',') + ' %' + (hi <= 0 ? ', prodej nepokryje hypotéku' : ', zůstane ' + (neg ? '0' : mil(lo)) + '–' + mil(hi) + ' mil. Kč');
  }

  Object.values(R).forEach((el) => { paint(el); el.addEventListener('input', () => { paint(el); update(); }); });
  qa('[data-s]').forEach((g) => g.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    S[g.dataset.s] = +b.dataset.v; update();
  })));
  update();
})();
