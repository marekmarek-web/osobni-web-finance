/* Osobní stránka pro firmu: volby u nálezů a podnětů, výpočty, souhrn a okno kontaktu. Volby se pamatují jen v tomto prohlížeči. */
(function () {
  const root = document.querySelector('.fp');
  if (!root) return;
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const KEY = 'fp:' + root.dataset.firma;
  const total = +root.dataset.total || 0;
  const LBL = { resime: 'Řešíme', neresime: 'Neřešíme', vic: 'Chci vědět víc' };
  let st = { a: {}, add: {} };
  try { st = Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const topics = $$('.fp-find, .fp-topic');
  const gens = $$('.fp-g');
  const title = (id) => { const el = root.querySelector('[data-topic="' + id + '"]'); return el ? el.dataset.title : id; };

  function render() {
    topics.forEach((t) => {
      const v = st.a[t.dataset.topic];
      if (v) t.dataset.ans = v; else delete t.dataset.ans;
      $$('.fp-pick button', t).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
    });
    gens.forEach((g) => {
      const on = !!st.add[g.dataset.topic];
      if (on) g.dataset.on = ''; else delete g.dataset.on;
      const b = g.querySelector('.fp-add');
      b.setAttribute('aria-pressed', on);
      b.querySelector('[data-l]').textContent = on ? 'Přidáno do schůzky' : 'Přidat do schůzky';
    });
    const n = topics.filter((t) => st.a[t.dataset.topic]).length;
    const nEl = root.querySelector('[data-fp-n]'), bar = root.querySelector('[data-fp-bar]');
    if (nEl) nEl.textContent = n;
    if (bar) bar.style.width = (total ? (n / total) * 100 : 0) + '%';

    const want = topics.filter((t) => st.a[t.dataset.topic] === 'vic').map((t) => t.dataset.title)
      .concat(gens.filter((g) => st.add[g.dataset.topic]).map((g) => g.dataset.title));
    const has = topics.filter((t) => st.a[t.dataset.topic] === 'resime').map((t) => t.dataset.title);
    const no = topics.filter((t) => st.a[t.dataset.topic] === 'neresime').map((t) => t.dataset.title);
    const box = root.querySelector('[data-fp-sum]');
    const row = (h, arr, cls) => arr.length ? '<div><dt>' + h + '</dt><dd' + (cls ? ' class="' + cls + '"' : '') + '>' + arr.map((x) => '<span>' + esc(x) + '</span>').join('') + '</dd></div>' : '';
    box.innerHTML = want.length || has.length || no.length
      ? '<dl>' + row('Chcete probrat', want, 'hi') + row('Máte vyřešené', has) + row('Teď neřešíte', no) + '</dl>'
      : '<p class="fp-empty">Zatím nic nevybráno. Klidně rovnou termín, projdeme to spolu.</p>';
    const h = root.querySelector('[data-fp-h]');
    if (h) h.innerHTML = want.length ? 'Tohle probereme. Stačí 30 minut<span class="dot">.</span>' : 'Projdeme to spolu<span class="dot">.</span>';
    // „První krok hotový“ jen po skutečné volbě (plán, sekce 3, bod 4).
    const c = root.querySelector('[data-fp-contact]');
    if (c) c.toggleAttribute('data-done', n > 0 || want.length > 0);
    // Do zprávy Markovi jde i to, co si klient nastavil ve výpočtech.
    const calc = () => {
      const k3 = root.querySelector('[data-k3]'), jn = root.querySelector('[data-jn][aria-pressed="true"]');
      return [k3 ? 'Výpočet 4 %: lidí ve 3. kategorii ' + k3.querySelector('[data-k3-n]').value + ', mzda ' + k3.querySelector('[data-k3-wv]').textContent + ', ročně ' + k3.querySelector('[data-k3-y]').textContent : '', jn ? 'Jednatelů: ' + jn.dataset.jn : ''];
    };
    window.MM_summary = () => [want.length ? 'Probrat: ' + want.join(', ') : '', has.length ? 'Řešíme: ' + has.join(', ') : '', no.length ? 'Neřešíme: ' + no.join(', ') : ''].concat(calc()).filter(Boolean).join('; ');
  }

  topics.forEach((t) => $$('.fp-pick button', t).forEach((b) => b.addEventListener('click', () => {
    const id = t.dataset.topic;
    st.a[id] = st.a[id] === b.dataset.v ? undefined : b.dataset.v;
    if (!st.a[id]) delete st.a[id];
    save(); render();
  })));
  gens.forEach((g) => g.querySelector('.fp-add').addEventListener('click', () => {
    const id = g.dataset.topic;
    if (st.add[id]) delete st.add[id]; else st.add[id] = 1;
    save(); render();
  }));

  // Výpočet povinného příspěvku 4 %: lidé × hrubá mzda.
  const kc = (v) => Math.round(v).toLocaleString('cs-CZ') + '\u00a0Kč';
  const paint = (r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%');
  $$('[data-k3]').forEach((c) => {
    const n = c.querySelector('[data-k3-n]'), w = c.querySelector('[data-k3-w]');
    const calc = () => {
      paint(n); paint(w);
      c.querySelector('[data-k3-nv]').textContent = n.value;
      c.querySelector('[data-k3-wv]').textContent = kc(+w.value);
      const m = n.value * w.value * 0.04;
      c.querySelector('[data-k3-m]').textContent = kc(m);
      c.querySelector('[data-k3-y]').textContent = kc(m * 12);
    };
    n.addEventListener('input', calc); w.addEventListener('input', calc); calc();
  });
  // Počet jednatelů: 50 000 Kč na každého a rozdíl proti dividendě.
  $$('[data-jn]').forEach((b) => b.addEventListener('click', () => {
    const box = b.closest('.fp-jn'), k = +b.dataset.jn;
    $$('[data-jn]', box).forEach((x) => x.setAttribute('aria-pressed', x === b));
    box.querySelector('[data-jn-y]').textContent = kc(50000 * k);
    box.querySelector('[data-jn-d]').textContent = kc(+box.dataset.gap * k);
  }));

  // Okno kontaktu: na této stránce nejde o výpočet, upravit popisky po otevření.
  const dlg = document.getElementById('kontakt-okno');
  if (dlg && 'MutationObserver' in window) {
    new MutationObserver(() => {
      if (!dlg.open) return;
      const first = dlg.querySelector('[data-first]');
      if (first && !first.hidden) {
        const d = first.querySelector('.done'); if (d) d.textContent = 'Výpočty prošlé';
        const s = dlg.querySelector('[data-subject]'); if (s) s.textContent = 'Vaše volby mám. Zbývá říct, kam se mám ozvat.';
        const a = dlg.querySelector('[data-attach-txt]'); if (a && a.parentElement) a.parentElement.firstChild.textContent = 'Připojit moje volby ';
      }
    }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  }
  render();
})();
