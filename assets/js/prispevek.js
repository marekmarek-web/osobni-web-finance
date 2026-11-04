/* Průvodce povinným příspěvkem 4 %: rozhodovací strom a náklady. Nic se neposílá, odpovědi zůstávají v prohlížeči. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const nf = new Intl.NumberFormat('cs-CZ');
  const kc = (n) => nf.format(Math.round(n)) + ' Kč';
  const A = { q1: null, q2: null, q3: null };

  /* --- Strom: každá odpověď odemkne další otázku nebo ukončí větev --- */
  const OUT = {
    start: ['Odpovězte na první otázku.', 'Strom se větví podle vašich odpovědí. Nic se nikam neposílá.', []],
    no: ['Povinnost vám zřejmě nevzniká.', 'Příspěvek se týká jen prací 3. kategorie kvůli vibracím, chladu, teplu nebo celkové fyzické zátěži, a to aspoň při 3 takových směnách v měsíci. Když se u vás zařazení prací změní, projděte to znovu.', ['Zkontrolujte, že zařazení prací odpovídá skutečnosti.', 'Zvažte dobrovolný příspěvek jako benefit pro ostatní.']],
    unsure1: ['Nejdřív si ověřte zařazení prací.', 'Bez toho nejde říct, jestli povinnost máte. Zařazení najdete v podkladech ke kategorizaci prací, o 3. kategorii rozhoduje krajská hygienická stanice.', ['Vyžádejte si přehled kategorizace prací.', 'Zjistěte, kvůli kterému faktoru je práce ve 3. kategorii.', 'Pak se sem vraťte.']],
    unsure2: ['Spočítejte rizikové směny.', 'Rozhodují aspoň 3 směny v kalendářním měsíci, kde riziková práce tvoří víc než polovinu směny. Bez evidence směn to nepoznáte.', ['Nastavte evidenci rizikových směn po lidech.', 'Pak se sem vraťte.']],
    inform: ['Platit zatím nemusíte. Informovat ano.', 'Povinnost platit vzniká až od měsíce po oznámení zaměstnance. Písemně a prokazatelně ho ale musíte informovat o jeho právu, a to před začátkem rizikové práce.', ['Pošlete zaměstnancům písemnou informaci o nároku.', 'Připravte evidenci rizikových směn a oznámení.', 'Spočítejte si náklady pro případ, že nárok uplatní.']],
    pay: ['Ano, příspěvek platíte.', 'Od měsíce po oznámení zaměstnance platíte 4 % z vyměřovacího základu na jeho penzijní spoření nebo připojištění, vždy do konce následujícího měsíce.', ['Při první platbě vydejte zaměstnanci jednorázové potvrzení.', 'Evidujte rizikové směny, oznámení i platby.', 'Hlídejte společný limit 50 000 Kč ročně s dalšími příspěvky.']],
  };
  const route = () => {
    if (!A.q1) return ['start', 1];
    if (A.q1 === 'ne') return ['no', 1];
    if (A.q1 === 'nevim') return ['unsure1', 1];
    if (!A.q2) return ['start2', 2];
    if (A.q2 === 'ne') return ['no', 2];
    if (A.q2 === 'nevim') return ['unsure2', 2];
    if (!A.q3) return ['start3', 3];
    return [A.q3 === 'ano' ? 'pay' : 'inform', 3];
  };
  const render = () => {
    const [k, open] = route();
    $$('[data-step]').forEach((el, i) => {
      const lock = i >= open;
      el.toggleAttribute('data-lock', lock);
      $$('button', el).forEach((b) => (b.disabled = lock));
    });
    const done = Object.values(A).filter(Boolean).length;
    const count = $('[data-count]');
    if (count) count.textContent = `Zodpovězeno ${Math.min(done, open)} ze 3`;
    const o = OUT[k] || ['Pokračujte další otázkou.', 'Zatím to vypadá, že se vás příspěvek může týkat.', []];
    $('[data-out-h]').textContent = o[0];
    $('[data-out-p]').textContent = o[1];
    const todo = $('[data-out-todo]');
    todo.innerHTML = o[2].map((t) => `<li>${t}</li>`).join('');
    todo.hidden = !o[2].length;
    $('[data-out-cta]').hidden = !OUT[k] || k === 'start';
    $('[data-out]').dataset.state = k;
  };
  $$('[data-q]').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const q = g.dataset.q;
    A[q] = b.dataset.v;
    $$('button', g).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    // Změna dřívější odpovědi smaže ty pozdější, aby strom nelhal.
    const keys = Object.keys(A);
    keys.slice(keys.indexOf(q) + 1).forEach((k) => { A[k] = null; $$(`[data-q="${k}"] button`).forEach((x) => x.setAttribute('aria-pressed', 'false')); });
    render();
  }));
  render();

  /* --- Náklady: 4 % z hrubé mzdy --- */
  const P = { n: 10, w: 42000, m: 12 };
  const calc = () => {
    const pm = P.w * 0.04, py = pm * P.m;
    $('[data-r="year"]').innerHTML = `${nf.format(Math.round(py * P.n))}<small>Kč</small>`;
    $('[data-r="pm"]').textContent = kc(pm);
    $('[data-r="py"]').textContent = kc(py);
    $('[data-r="mo"]').textContent = kc(pm * P.n);
    $('[data-r="limit"]').textContent = py > 50000
      ? `Na člověka ${kc(py)} ročně je nad limitem 50 000 Kč. Část nad limitem už není osvobozená.`
      : `Na člověka ${kc(py)} ročně. Do limitu 50 000 Kč zbývá ${kc(50000 - py)} pro další příspěvky.`;
    window.MM_summary = () => `povinný příspěvek 4 %: ${P.n} zaměstnanců, průměrná mzda ${kc(P.w)}, ${P.m} měsíců, ročně zhruba ${kc(py * P.n)}`;
  };
  $$('[data-p]').forEach((r) => {
    const k = r.dataset.p, box = $(`[data-pn="${k}"]`);
    const set = (v, from) => {
      v = Math.min(+r.max, Math.max(+r.min, +v || +r.min));
      P[k] = v;
      if (from !== r) r.value = v;
      if (from !== box) box.value = v;
      r.style.setProperty('--p', ((v - r.min) / (r.max - r.min)) * 100 + '%');
      calc();
    };
    r.addEventListener('input', () => set(r.value, r));
    box.addEventListener('change', () => set(box.value, box));
    set(r.value);
  });
})();
