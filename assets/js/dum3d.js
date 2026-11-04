/* Bydlení: 3D náhled nemovitosti vedle mapy. Rodinný dům se zahradou, nebo moderní bytový dům se zvýrazněným bytem.
   Poslouchá přepínač Byt / Rodinný dům a posuvník plochy. Nic neposílá, jen kreslí. Základ převzatý z návrhu Příbramský (property-scene), upravený na naše barvy. */
const box = document.querySelector('[data-dum3d]');
if (box) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    start().catch(() => box.closest('.by-3d').hidden = true);
  }, { rootMargin: '300px' });
  io.observe(box);
}

async function start() {
  const THREE = await import('../vendor/three.module.min.js');
  const { RoundedBoxGeometry } = await import('../vendor/RoundedBoxGeometry.js');
  const canvas = box, wrap = canvas.closest('.by-3d');
  const root = canvas.closest('[data-by-map]') || document;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e2d2, 2.0));
  const sun = new THREE.DirectionalLight(0xfff6e6, 2.4);
  sun.position.set(-6, 11, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 11, bottom: -7, far: 40 });
  sun.shadow.radius = 4;
  scene.add(sun);

  // Paleta webu: papír, písek, inkoust, zlatá. K tomu dřevo a zeleň zahrady.
  const M = (color, roughness = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, ...extra });
  const C = {
    wall: M(0xffffff, 0.8), plaster: M(0xf4f1ea, 0.85), roof: M(0x2a2d34, 0.55), glass: M(0x23262e, 0.18, { metalness: 0.35 }),
    wood: M(0xb98656, 0.65), woodDark: M(0x8a5f3a, 0.7), sand: M(0xeae6db, 0.9), path: M(0xd9d3c4, 0.9),
    lawn: M(0xcfdcae, 0.95), hedge: M(0x86a463, 0.9), leaf: M(0x9bbd72, 0.85), leaf2: M(0x7fa35e, 0.85), trunk: M(0x7a5a3c, 0.9),
    gold: M(0xf6b91a, 0.45), goldSoft: M(0xfbe7ae, 0.75), railing: M(0xdfe6ea, 0.1, { transparent: true, opacity: 0.45 }), metal: M(0x3a3d45, 0.4, { metalness: 0.5 }),
  };
  const geos = [];
  const G = (g) => (geos.push(g), g);
  const rb = (w, h, d, r = 0.04) => G(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)));
  const mesh = (geo, mat, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; };

  const stage = new THREE.Group();
  scene.add(stage);

  // Pozemek: písková deska, trávník, chodník.
  stage.add(mesh(rb(11, 0.3, 8.6, 0.14), C.sand, 0, -0.15, 0, false));
  stage.add(mesh(rb(10.4, 0.06, 8, 0.05), C.lawn, 0, 0.03, 0, false));

  const tree = (x, z, s = 1, alt = false) => {
    const t = new THREE.Group();
    t.add(mesh(G(new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.9 * s, 10)), C.trunk, 0, 0.45 * s, 0));
    t.add(mesh(G(new THREE.IcosahedronGeometry(0.62 * s, 1)), alt ? C.leaf2 : C.leaf, 0, 1.25 * s, 0));
    t.add(mesh(G(new THREE.IcosahedronGeometry(0.42 * s, 1)), alt ? C.leaf : C.leaf2, 0.28 * s, 1.6 * s, 0.1 * s));
    t.position.set(x, 0.06, z);
    return t;
  };

  /* ---------- Rodinný dům se zahradou ---------- */
  const house = new THREE.Group();
  stage.add(house);
  const garden = new THREE.Group();
  house.add(garden);
  // Plot ze dřevěných latí kolem zahrady, vpředu branka.
  const fence = (x1, z1, x2, z2) => {
    const len = Math.hypot(x2 - x1, z2 - z1), n = Math.round(len / 0.32), g = new THREE.Group();
    const lath = rb(0.07, 0.62, 0.05, 0.015);
    for (let i = 0; i <= n; i++) g.add(mesh(lath, C.wood, -len / 2 + (i * len) / n, 0.37, 0));
    g.add(mesh(rb(len, 0.06, 0.04, 0.01), C.woodDark, 0, 0.5, -0.04));
    g.position.set((x1 + x2) / 2, 0.06, (z1 + z2) / 2);
    g.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    return g;
  };
  garden.add(fence(-4.9, -3.7, 4.9, -3.7), fence(-4.9, -3.7, -4.9, 3.7), fence(4.9, -3.7, 4.9, 3.7), fence(-4.9, 3.7, -0.9, 3.7), fence(0.9, 3.7, 4.9, 3.7));
  garden.add(mesh(rb(1.3, 0.04, 2.2, 0.02), C.path, 0, 0.07, 2.6, false));
  for (let i = 0; i < 6; i++) garden.add(mesh(rb(0.55, 0.42, 0.55, 0.12), C.hedge, -4.4 + i * 0.6, 0.27, -3.2));
  garden.add(tree(3.6, -2.4, 1.15), tree(-3.7, 2.2, 0.9, true), tree(4.0, 2.6, 0.75, true));
  // Terasa s dřevěnou podlahou a vyvýšený záhon.
  const deck = new THREE.Group();
  for (let i = 0; i < 7; i++) deck.add(mesh(rb(0.24, 0.05, 1.7, 0.01), C.wood, -0.78 + i * 0.26, 0.09, 0));
  deck.position.set(-2.5, 0, -0.2);
  garden.add(deck);
  garden.add(mesh(rb(1.5, 0.28, 0.6, 0.04), C.woodDark, 2.9, 0.2, 0.4), mesh(rb(1.36, 0.06, 0.48, 0.03), C.hedge, 2.9, 0.35, 0.4, false));

  const body = new THREE.Group();
  house.add(body);
  let builtFloors = 0;
  // Moderní český dům: bílá omítka, tmavá sedlová střecha bez přesahů, dřevěný obklad, velká okna.
  function buildHouse(floors) {
    body.clear();
    builtFloors = floors;
    const W = 3.4, D = 2.6, H = 1.05;
    for (let f = 0; f < floors; f++) {
      const y = f * H + H / 2 + 0.06;
      body.add(mesh(rb(W, H - 0.02, D, 0.03), C.wall, 0, y, 0));
      // Dřevěný obklad na pravé části průčelí.
      body.add(mesh(rb(1.2, H - 0.02, 0.06, 0.01), C.wood, W / 2 - 0.6, y, D / 2 + 0.02));
      if (f === 0) {
        body.add(mesh(rb(0.5, 0.82, 0.06, 0.02), C.woodDark, -0.2, 0.06 + 0.43, D / 2 + 0.03));
        body.add(mesh(rb(0.9, 0.62, 0.05, 0.02), C.glass, -1.1, y + 0.05, D / 2 + 0.03, false));
        body.add(mesh(rb(1.6, 0.8, 0.05, 0.02), C.glass, -0.6, 0.06 + 0.44, -D / 2 - 0.03, false));
      } else {
        body.add(mesh(rb(0.7, 0.5, 0.05, 0.02), C.glass, -0.9, y + 0.05, D / 2 + 0.03, false));
        body.add(mesh(rb(0.5, 0.5, 0.05, 0.02), C.glass, 0.1, y + 0.05, D / 2 + 0.03, false));
        body.add(mesh(rb(0.7, 0.5, 0.05, 0.02), C.glass, -0.6, y + 0.05, -D / 2 - 0.03, false));
      }
      body.add(mesh(rb(0.5, 0.5, 0.05, 0.02), C.glass, W / 2 - 0.6, y + 0.05, D / 2 + 0.06, false));
      for (const z of [-0.6, 0.6]) {
        const s = mesh(rb(0.05, 0.5, 0.55, 0.02), C.glass, W / 2 + 0.03, y + 0.05, z, false); body.add(s);
        const s2 = mesh(rb(0.05, 0.5, 0.55, 0.02), C.glass, -W / 2 - 0.03, y + 0.05, z, false); body.add(s2);
      }
    }
    // Sedlová střecha, hřeben kolmo do ulice (štít do zahrady i do ulice).
    const top = floors * H + 0.06;
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2 - 0.04, 0); sh.lineTo(0, 1.25); sh.lineTo(W / 2 + 0.04, 0); sh.closePath();
    const rg = G(new THREE.ExtrudeGeometry(sh, { depth: D + 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }));
    rg.translate(0, 0, -(D + 0.1) / 2);
    body.add(mesh(rg, C.roof, 0, top, 0));
    // Bílý štít pod střechou.
    const gs = new THREE.Shape();
    gs.moveTo(-W / 2, 0); gs.lineTo(0, 1.2); gs.lineTo(W / 2, 0); gs.closePath();
    const gg = G(new THREE.ExtrudeGeometry(gs, { depth: D - 0.02, bevelEnabled: false }));
    gg.translate(0, 0, -(D - 0.02) / 2);
    body.add(mesh(gg, C.wall, 0, top, 0, false));
    body.add(mesh(rb(0.62, 0.36, 0.05, 0.02), C.glass, 0, top + 0.4, D / 2 + 0.01, false));
    body.add(mesh(rb(0.3, 0.7, 0.3, 0.03), C.roof, 0.85, top + 0.75, -0.5));
    body.position.set(0.35, 0, -0.5);
  }

  /* ---------- Moderní bytový dům ---------- */
  const block = new THREE.Group();
  stage.add(block);
  const FL = 5, BAYS = 4, BW = 1.2, BH = 0.92, BD = 2.6;
  const flats = [];
  for (let f = 0; f < FL; f++) {
    for (let b = 0; b < BAYS; b++) {
      const x = (b - (BAYS - 1) / 2) * BW, y = f * BH + BH / 2 + 0.06;
      const wallMat = f === 0 ? C.plaster : C.wall.clone();
      const u = mesh(rb(BW - 0.02, BH - 0.02, BD, 0.02), wallMat, x, y, 0);
      block.add(u);
      if (f === 0) {
        block.add(mesh(rb(BW - 0.24, BH - 0.24, 0.05, 0.02), C.glass, x, y - 0.04, BD / 2 + 0.02, false));
        continue;
      }
      block.add(mesh(rb(0.42, 0.6, 0.05, 0.02), C.glass, x - 0.3, y + 0.02, BD / 2 + 0.02, false));
      block.add(mesh(rb(0.3, 0.42, 0.05, 0.02), C.glass, x + 0.3, y + 0.08, BD / 2 + 0.02, false));
      block.add(mesh(rb(0.6, 0.5, 0.05, 0.02), C.glass, x, y + 0.04, -BD / 2 - 0.02, false));
      // Lodžie s dřevěnou podlahou a skleněným zábradlím.
      const slabMat = C.wall.clone();
      const slab = mesh(rb(BW - 0.12, 0.07, 0.62, 0.02), slabMat, x, y - BH / 2 + 0.06, BD / 2 + 0.31);
      block.add(slab);
      block.add(mesh(rb(BW - 0.14, 0.32, 0.03, 0.01), C.railing, x, y - BH / 2 + 0.26, BD / 2 + 0.61, false));
      flats.push({ f, b, wall: u, slab });
    }
  }
  // Schodišťové jádro s dřevěnými lamelami a plochá střecha s atikou.
  const core = new THREE.Group();
  for (let i = 0; i < 9; i++) core.add(mesh(rb(0.05, FL * BH - 0.1, 0.06, 0.01), C.wood, -0.36 + i * 0.09, (FL * BH) / 2 + 0.06, 0));
  core.add(mesh(rb(0.84, FL * BH, 1.2, 0.03), C.plaster, 0, (FL * BH) / 2 + 0.06, -0.62));
  core.position.set(-(BAYS * BW) / 2 - 0.42, 0, BD / 2 - 0.62);
  block.add(core);
  block.add(mesh(rb(BAYS * BW + 0.16, 0.16, BD + 0.16, 0.03), C.roof, 0, FL * BH + 0.14, 0));
  block.add(mesh(rb(1.1, 0.4, 0.8, 0.04), C.plaster, 1.2, FL * BH + 0.42, -0.3));
  block.add(mesh(rb(6.6, 0.04, 1.4, 0.02), C.path, -0.3, 0.07, BD / 2 + 1.5, false));
  block.add(tree(-3.9, -2.4, 1.1), tree(3.6, -2.6, 0.95, true), tree(3.9, 2.8, 0.8), tree(-4.1, 2.9, 0.75, true));
  for (let i = 0; i < 4; i++) block.add(mesh(rb(0.5, 0.36, 0.5, 0.12), C.hedge, 1.4 + i * 0.58, 0.24, 2.9));
  block.position.z = -0.6;

  // Zvýrazněný byt: 3. podlaží, počet sekcí podle plochy.
  const FLAT_FLOOR = 2;
  const paintFlat = (m2) => {
    const n = Math.max(1, Math.min(BAYS, Math.ceil(m2 / 38)));
    flats.forEach((u) => {
      const on = u.f === FLAT_FLOOR && u.b < n;
      u.wall.material.color.setHex(on ? 0xfbe7ae : 0xffffff);
      u.slab.material.color.setHex(on ? 0xf6b91a : 0xffffff);
    });
  };

  /* ---------- Stav a pohyb ---------- */
  const st = { type: 'byt', m2: 70 };
  const cur = { house: 0, block: 1, s: 1, spin: -0.55, h: 0 };
  const tgt = { house: 0, block: 1, s: 1 };
  const read = () => {
    const t = root.querySelector('[data-type] [aria-pressed="true"]');
    const r = root.querySelector('[data-m2]');
    st.type = t ? t.dataset.v : 'byt';
    st.m2 = r ? +r.value : 70;
  };
  const apply = () => {
    read();
    tgt.house = st.type === 'dum' ? 1 : 0;
    tgt.block = st.type === 'byt' ? 1 : 0;
    const floors = st.m2 > 130 ? 2 : 1;
    if (floors !== builtFloors) { buildHouse(floors); body.scale.y = reduced ? 1 : 0.6; }
    tgt.s = Math.max(0.78, Math.min(1.28, Math.sqrt(st.m2 / floors / 75)));
    paintFlat(st.m2);
    canvas.setAttribute('aria-label', st.type === 'dum'
      ? `Rodinný dům se zahradou, ${floors === 1 ? 'přízemní' : 'patrový'}, ${st.m2} m²`
      : `Byt ${st.m2} m² ve 3. podlaží moderního bytového domu, zvýrazněný zlatě`);
    kick();
  };

  let last = performance.now(), visible = true, drag = false, lx = 0, idle = 0;
  const t0 = performance.now();
  const damp = (a, b, dt, k = 7) => (reduced ? b : a + (b - a) * (1 - Math.exp(-dt * k)));
  function frame() {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    cur.house = damp(cur.house, tgt.house, dt);
    cur.block = damp(cur.block, tgt.block, dt);
    cur.s = damp(cur.s, tgt.s, dt, 6);
    house.visible = cur.house > 0.01;
    block.visible = cur.block > 0.01;
    house.scale.setScalar(Math.max(0.001, cur.house));
    body.scale.set(cur.s, damp(body.scale.y, 1, dt, 6), cur.s);
    block.scale.setScalar(Math.max(0.001, cur.block));
    stage.rotation.y = cur.spin + (reduced || drag ? 0 : Math.sin((now - t0) / 4200) * 0.28);
    const h = cur.house * (builtFloors * 1.05 + 1.3) + cur.block * (FL * BH + 0.5);
    const fit = 19 + h * 1.15;
    const af = camera.aspect < 1.25 ? 1.25 / camera.aspect : 1;
    camera.position.set(0, (fit * 0.46 + h * 0.25) * af, fit * af);
    camera.lookAt(0, h * 0.36, 0);
    renderer.render(scene, camera);
    if (reduced && ++idle > 2) renderer.setAnimationLoop(null);
  }
  const kick = () => { idle = 0; renderer.setAnimationLoop(visible && !document.hidden ? frame : null); };
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    kick();
  };
  canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); wrap.classList.add('used'); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; cur.spin += (e.clientX - lx) * 0.009; lx = e.clientX; kick(); });
  const up = () => { drag = false; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); renderer.setAnimationLoop(null); wrap.hidden = true; });
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); kick(); }).observe(canvas);

  root.querySelectorAll('[data-type] button').forEach((b) => b.addEventListener('click', () => setTimeout(apply)));
  const r = root.querySelector('[data-m2]');
  if (r) r.addEventListener('input', apply);
  apply();
  cur.house = tgt.house; cur.block = tgt.block; cur.s = tgt.s; body.scale.y = 1;
  resize();
  wrap.classList.add('ready');
}
