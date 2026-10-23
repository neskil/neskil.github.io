// The party, in 3D: five figures and a campfire in front of the gates, with Warcraft's own UI
// furniture laid over the canvas (nameplates, target frame, minimap, party chat, action bar).
// Reads the roster from window.WOW, which the page script fills in; everything here is look.
(() => {
  const W = window.WOW;
  const host = document.getElementById("world");
  if (!W || !host) return;
  if (!window.THREE) { host.classList.add("no-gl"); return; }
  const T = THREE;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = id => document.getElementById(id);

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: $("world-gl"), antialias: true });
    if (!renderer.getContext()) throw new Error("no context");
  } catch (e) { host.classList.add("no-gl"); return; }
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  scene.background = new T.Color(0x070b18).convertSRGBToLinear();
  scene.fog = new T.Fog(scene.background.getHex(), 13, 32);
  const camera = new T.PerspectiveCamera(38, 16 / 9, 0.1, 100);

  /* ---------- Light ---------- */
  scene.add(new T.HemisphereLight(0x5f78b8, 0x0d120a, 0.55));
  const moon = new T.DirectionalLight(0xa9c0ff, 0.55);
  moon.position.set(-6, 12, 6);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  scene.add(moon);
  const fireLight = new T.PointLight(0xff8a3a, 2.6, 16, 1.4);
  fireLight.position.set(0, 0.9, 0);
  scene.add(fireLight);
  const gateLight = new T.PointLight(0x6cc4ff, 1.2, 12, 1.6);
  gateLight.position.set(0, 2.2, -5.6);
  scene.add(gateLight);

  /* ---------- Helpers ---------- */
  const lin = c => new T.Color(c).convertSRGBToLinear();
  const M = (color, o) => new T.MeshStandardMaterial(Object.assign({ color: lin(color), roughness: 0.82, metalness: 0, flatShading: true }, o));
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  function glowTexture(inner, outer) {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  const glowTex = glowTexture("rgba(255,255,255,1)", "rgba(255,255,255,.35)");
  const glow = (color, size) => {
    const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.set(size, size, 1); return s;
  };

  /* ---------- Ground, stones, trees ---------- */
  const groundTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#1d3519"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const v = Math.random();
      g.fillStyle = v < 0.5 ? "rgba(52,84,38,.55)" : v < 0.85 ? "rgba(18,34,16,.6)" : "rgba(84,96,52,.45)";
      g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 3);
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(8, 8); t.encoding = T.sRGBEncoding;
    return t;
  })();
  const ground = new T.Mesh(new T.CircleGeometry(30, 48), new T.MeshStandardMaterial({ map: groundTex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const dirt = new T.Mesh(new T.CircleGeometry(1.25, 24), M(0x2a2016, { roughness: 1 }));
  dirt.rotation.x = -Math.PI / 2; dirt.position.y = 0.01; dirt.receiveShadow = true; scene.add(dirt);

  const stoneMat = M(0x6f6a62), darkStone = M(0x4a4640);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2;
    const s = mesh(new T.DodecahedronGeometry(0.16 + Math.random() * 0.05, 0), stoneMat, Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62);
    s.rotation.set(Math.random() * 3, Math.random() * 3, 0); scene.add(s);
  }
  const logMat = M(0x5a3a1e);
  for (let i = 0; i < 4; i++) {
    const l = mesh(new T.CylinderGeometry(0.07, 0.08, 0.9, 7), logMat, 0, 0.12, 0);
    l.rotation.z = Math.PI / 2 - 0.35; l.rotation.y = i * Math.PI / 4; scene.add(l);
  }

  const trunkMat = M(0x3b2a1b), pineMat = [M(0x1c3a22), M(0x173020), M(0x22452a)];
  function pine(x, z, s) {
    const g = new T.Group();
    g.add(mesh(new T.CylinderGeometry(0.12, 0.16, 1, 6), trunkMat, 0, 0.5, 0));
    for (let i = 0; i < 3; i++) g.add(mesh(new T.ConeGeometry(1.1 - i * 0.28, 1.5, 7), pineMat[i % 3], 0, 1.3 + i * 0.8, 0));
    g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = Math.random() * 6;
    scene.add(g);
  }
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, r = 9 + Math.random() * 9;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > 4 && Math.abs(x) < 7) continue;          // keep the camera's side open
    pine(x, z, 0.8 + Math.random() * 0.8);
  }
  pine(5.6, -1.8, 1.05);                               // Robin's tree
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 10;
    const rock = mesh(new T.DodecahedronGeometry(0.2 + Math.random() * 0.4, 0), darkStone, Math.cos(a) * r, 0.1, Math.sin(a) * r);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, 0); scene.add(rock);
  }

  /* ---------- The gates ---------- */
  const gate = new T.Group(); gate.position.set(0, 0, -6.2); scene.add(gate);
  const gateStone = M(0x3d3a44, { roughness: 0.9 });
  const gateTrim = M(0x8a5d1c, { metalness: 0.5, roughness: 0.45 });
  for (const s of [-1, 1]) {
    gate.add(mesh(new T.BoxGeometry(0.9, 5, 0.9), gateStone, s * 2.2, 2.5, 0));
    gate.add(mesh(new T.BoxGeometry(1.15, 0.35, 1.15), gateTrim, s * 2.2, 0.18, 0));
    gate.add(mesh(new T.ConeGeometry(0.35, 1.1, 4), gateStone, s * 2.75, 5.6, 0));
  }
  gate.add(mesh(new T.BoxGeometry(5.6, 0.8, 1.1), gateStone, 0, 5.3, 0));
  gate.add(mesh(new T.BoxGeometry(5.8, 0.16, 1.2), gateTrim, 0, 4.86, 0));
  gate.add(mesh(new T.ConeGeometry(0.4, 1.4, 4), gateStone, 0, 6.3, 0));
  const portalMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, side: T.DoubleSide,
    uniforms: { uTime: { value: 0 }, uOpen: { value: 0.35 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      uniform float uTime; uniform float uOpen; varying vec2 vUv;
      void main(){
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p * vec2(1.0, 0.8));
        float a = atan(p.y, p.x);
        float s1 = sin(a * 3.0 + r * 9.0 - uTime * 1.7) * 0.5 + 0.5;
        float s2 = sin(a * 5.0 - r * 13.0 + uTime * 2.4) * 0.5 + 0.5;
        vec3 col = mix(vec3(0.22, 0.58, 1.0), vec3(0.56, 0.26, 0.96), s1) * (0.45 + s2 * 0.8);
        col += vec3(0.85, 0.93, 1.0) * smoothstep(0.45, 0.0, r) * (0.25 + 0.75 * uOpen);
        float edge = smoothstep(1.0, 0.82, max(abs(p.x), abs(p.y)));
        gl_FragColor = vec4(col * (0.5 + 0.7 * uOpen), edge * (0.6 + 0.4 * uOpen));
      }`
  });
  const portal = new T.Mesh(new T.PlaneGeometry(3.5, 4.5), portalMat);
  portal.position.set(0, 2.5, 0); gate.add(portal);

  /* ---------- Fire ---------- */
  const fire = new T.Group(); scene.add(fire);
  const flames = [0xffd27a, 0xff9a2e, 0xff5a1a].map((c, i) => {
    const f = new T.Mesh(new T.ConeGeometry(0.28 - i * 0.05, 0.75 + i * 0.12, 7, 1, true),
      new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8 - i * 0.15, blending: T.AdditiveBlending, depthWrite: false }));
    f.position.y = 0.42 + i * 0.03; fire.add(f); return f;
  });
  const fireGlow = glow(0xff8a3a, 2.4); fireGlow.position.y = 0.55; fire.add(fireGlow);
  const sparkN = 70, sparkPos = new Float32Array(sparkN * 3), sparkLife = new Float32Array(sparkN);
  const resetSpark = i => { sparkPos[i * 3] = (Math.random() - 0.5) * 0.4; sparkPos[i * 3 + 1] = 0.3; sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4; sparkLife[i] = Math.random(); };
  for (let i = 0; i < sparkN; i++) { resetSpark(i); sparkPos[i * 3 + 1] = 0.3 + Math.random() * 2.5; }
  const sparkGeo = new T.BufferGeometry(); sparkGeo.setAttribute("position", new T.BufferAttribute(sparkPos, 3));
  const sparks = new T.Points(sparkGeo, new T.PointsMaterial({ color: 0xffb060, size: 0.06, map: glowTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
  scene.add(sparks);

  // Stars on a dome
  const starGeo = new T.BufferGeometry(), sp = [];
  for (let i = 0; i < 700; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.45;
    sp.push(Math.cos(th) * Math.sin(ph) * 40, Math.cos(ph) * 40 * 0.6 + 4, Math.sin(th) * Math.sin(ph) * 40);
  }
  starGeo.setAttribute("position", new T.Float32BufferAttribute(sp, 3));
  scene.add(new T.Points(starGeo, new T.PointsMaterial({ color: 0xdfe8ff, size: 0.12, fog: false })));

  /* ---------- Figures ---------- */
  function limb(r1, r2, h, mat) { const g = new T.CylinderGeometry(r1, r2, h, 8); g.translate(0, -h / 2, 0); const m = new T.Mesh(g, mat); m.castShadow = true; return m; }
  function figure(o) {
    const root = new T.Group(), body = new T.Group(); root.add(body);
    const skin = M(o.skin || 0xe2b48c), cloth = M(o.cloth, o.clothOpts), trim = M(o.trim || 0x8a5d1c, { metalness: 0.45, roughness: 0.5 });
    if (o.ghost) [skin, cloth, trim].forEach(m => Object.assign(m, { transparent: true, opacity: 0.38, emissive: new T.Color(0x3a6fa0), emissiveIntensity: 0.6, depthWrite: false }));
    if (o.robe) body.add(mesh(new T.CylinderGeometry(0.2, 0.44, 1.15, 10), cloth, 0, 0.575, 0));
    else for (const s of [-1, 1]) {
      const leg = limb(0.085, 0.07, 0.8, o.ghost ? cloth : M(o.legs || 0x3a2f25)); leg.position.set(s * 0.11, 0.82, 0); body.add(leg);
      body.add(mesh(new T.BoxGeometry(0.14, 0.1, 0.24), o.ghost ? cloth : M(0x2a1f17), s * 0.11, 0.05, 0.03));
    }
    body.add(mesh(new T.CylinderGeometry(0.25, 0.19, 0.64, 10), cloth, 0, 1.12, 0));
    body.add(mesh(new T.CylinderGeometry(0.2, 0.2, 0.07, 10), trim, 0, 0.84, 0));
    const pad = o.plate ? 0.15 : 0.09;
    for (const s of [-1, 1]) body.add(mesh(new T.SphereGeometry(pad, 8, 6), o.plate ? trim : cloth, s * 0.27, 1.4, 0));
    const head = new T.Group(); head.position.y = 1.6 + (o.bigHead ? 0.06 : 0); head.scale.setScalar(o.bigHead || 1); body.add(head);
    head.add(mesh(new T.SphereGeometry(0.17, 12, 10), skin));
    const eyeMat = o.glowEyes ? new T.MeshBasicMaterial({ color: o.glowEyes }) : M(0x111111);
    if (!o.ghost) for (const s of [-1, 1]) head.add(mesh(new T.SphereGeometry(o.glowEyes ? 0.028 : 0.022, 6, 4), eyeMat, s * 0.06, 0.02, 0.155));
    const top = new T.Object3D(); top.position.y = 0.34; head.add(top);
    if (o.hood) {
      const hood = mesh(new T.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), cloth, 0, 0.02, -0.02);
      hood.rotation.x = -0.25; head.add(hood);
      head.add(mesh(new T.ConeGeometry(0.2, 0.3, 10, 1, true), cloth, 0, -0.08, -0.06));
    }
    if (o.chef) {
      const white = M(0xf4f1ea, { emissive: new T.Color(0x332f28) });
      head.add(mesh(new T.CylinderGeometry(0.13, 0.12, 0.2, 12), white, 0, 0.22, 0));
      const puff = mesh(new T.SphereGeometry(0.19, 12, 8), white, 0, 0.38, 0); puff.scale.y = 0.7; head.add(puff);
      top.position.y = 0.6;
    }
    if (o.pigtails) {
      const hair = M(o.pigtails);
      const cap = mesh(new T.SphereGeometry(0.178, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.01, -0.01); head.add(cap);
      for (const s of [-1, 1]) { head.add(mesh(new T.SphereGeometry(0.085, 8, 6), hair, s * 0.2, 0.0, -0.04)); head.add(mesh(new T.SphereGeometry(0.06, 8, 6), hair, s * 0.25, -0.1, -0.05)); }
    }
    const arms = [];
    for (const s of [-1, 1]) {
      const arm = new T.Group(); arm.position.set(s * 0.31, 1.4, 0); body.add(arm);
      arm.add(limb(0.065, 0.055, 0.6, cloth));
      arm.add(mesh(new T.SphereGeometry(0.065, 8, 6), skin, 0, -0.63, 0));
      const hand = new T.Object3D(); hand.position.y = -0.63; arm.add(hand);
      arm.userData = { side: s, hand }; arms.push(arm);
    }
    root.userData = { body, head, top, armL: arms[1], armR: arms[0], glow: null, orb: null };
    root.scale.setScalar(o.scale || 1);
    return root;
  }
  function staff(fig, colors) {
    const g = new T.Group(); fig.userData.armL.userData.hand.add(g);
    g.add(mesh(new T.CylinderGeometry(0.03, 0.035, 1.7, 6), M(0x5a3a1e), 0, 0.25, 0.04));
    const orbMat = new T.MeshStandardMaterial({ color: lin(colors[0]), emissive: lin(colors[0]), emissiveIntensity: 1.4 });
    const orb = mesh(new T.SphereGeometry(0.08, 12, 10), orbMat, 0, 1.12, 0.04); g.add(orb);
    const gl = glow(colors[0], 0.9); gl.position.copy(orb.position); g.add(gl);
    fig.userData.orb = { mat: orbMat, glow: gl, colors: colors.map(lin) };
  }
  function sword(fig) {
    const g = new T.Group(); g.rotation.x = 1.15; fig.userData.armR.userData.hand.add(g);
    g.add(mesh(new T.BoxGeometry(0.06, 0.8, 0.018), M(0xd8dee8, { metalness: 0.8, roughness: 0.25 }), 0, 0.52, 0));
    g.add(mesh(new T.BoxGeometry(0.26, 0.04, 0.05), M(0xc9a040, { metalness: 0.6, roughness: 0.4 }), 0, 0.12, 0));
    g.add(mesh(new T.CylinderGeometry(0.025, 0.025, 0.16, 6), M(0x3a2a1a), 0, 0.03, 0));
  }
  function shield(fig) {
    const arm = fig.userData.armL;
    const g = new T.Group(); g.position.set(0.09, -0.42, 0.02); arm.add(g);
    const face = mesh(new T.CylinderGeometry(0.3, 0.3, 0.05, 16), M(0x1f4fa0, { roughness: 0.55 })); face.rotation.z = Math.PI / 2; g.add(face);
    const rim = mesh(new T.TorusGeometry(0.3, 0.03, 6, 20), M(0xc9a040, { metalness: 0.7, roughness: 0.35 })); rim.rotation.y = Math.PI / 2; g.add(rim);
    const boss = mesh(new T.SphereGeometry(0.07, 8, 6), M(0xc9a040, { metalness: 0.7, roughness: 0.35 }), 0.04, 0, 0); g.add(boss);
  }
  function daggers(fig) {
    for (const arm of [fig.userData.armL, fig.userData.armR]) {
      const g = new T.Group(); g.rotation.x = 1.3; arm.userData.hand.add(g);
      g.add(mesh(new T.BoxGeometry(0.04, 0.34, 0.014), M(0xcfd6e0, { metalness: 0.8, roughness: 0.25 }), 0, 0.22, 0));
      g.add(mesh(new T.BoxGeometry(0.14, 0.03, 0.04), M(0x5a4a6a, { metalness: 0.4 }), 0, 0.05, 0));
    }
  }
  function backpack(fig) {
    fig.userData.body.add(mesh(new T.BoxGeometry(0.36, 0.44, 0.2), M(0x6b4a2a), 0, 1.15, -0.25));
    const roll = mesh(new T.CylinderGeometry(0.07, 0.07, 0.4, 8), M(0x4a5a3a), 0, 1.42, -0.27);
    roll.rotation.z = Math.PI / 2;
    fig.userData.body.add(roll);
  }

  const LOOKS = {
    Adam:   { o: { cloth: 0x8f949e, clothOpts: { metalness: 0.55, roughness: 0.4 }, trim: 0xc9a040, plate: true, legs: 0x6b6f78, skin: 0xf2cdb0, scale: 0.64, bigHead: 1.45, pigtails: 0xff6fb0 }, gear: [sword, shield] },
    Kocken: { o: { cloth: 0xd9d4ca, trim: 0x2a6fd0, robe: true, chef: true }, gear: [f => staff(f, [0x0070dd, 0xffffff])] },
    Victor: { o: { cloth: 0x3b2a5c, trim: 0x8788ee, robe: true, hood: true, skin: 0xd8a888 }, gear: [f => staff(f, [0x0070dd, 0x8788ee, 0xffffff])] },
    Niklas: { o: { cloth: 0x2b2330, hood: true, legs: 0x1f1a24, skin: 0x8f9c7e, glowEyes: 0xffe14a }, gear: [daggers] },
    Dredde: { o: { cloth: 0x6a2626, hood: true, legs: 0x2e2a26, skin: 0xe8bc98 }, gear: [backpack] },
    Robin:  { o: { cloth: 0x9fc4ff, ghost: true }, gear: [] }
  };

  // Five round the fire on the far side, facing the camera; Robin off by a tree.
  // The dead lie on this side of the fire, where the camera can see them.
  const standing = W.party.filter(p => !p.pending && !p.dead).length;
  const spots = Array.from({ length: standing }, (_, i) => [standing > 1 ? -58 + i * 116 / (standing - 1) : 0, i % 2 ? 2.4 : 2.5]);
  const figs = [];
  let slot = 0;
  W.party.forEach((p, i) => {
    const look = LOOKS[p.name] || { o: { cloth: 0x555555, hood: true }, gear: [] };
    const f = figure(look.o);
    look.gear.forEach(g => g(f));
    if (p.pending) { f.position.set(4.8, 0, -1.2); f.lookAt(0, 0, 0); }
    else if (p.dead) { f.position.set(-1.45, 0.2, 0.55); f.rotation.set(0, 0.35, 0); f.rotateZ(Math.PI / 2); }
    else {
      const [deg, r] = spots[slot++] || [0, 3];
      const a = (180 + deg) * Math.PI / 180;
      f.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
      f.lookAt(0, 0, 2.5);
    }
    f.traverse(o => { o.userData.idx = i; });
    f.userData.idx = i;
    f.userData.phase = Math.random() * 6;
    scene.add(f);
    figs.push(f);
  });
  // Robin's quest marker
  const bang = new T.Group();
  const bangMat = new T.MeshBasicMaterial({ color: 0xffd100 });
  bang.add(mesh(new T.CylinderGeometry(0.07, 0.035, 0.42, 8), bangMat, 0, 0.18, 0));
  bang.add(mesh(new T.SphereGeometry(0.055, 8, 6), bangMat, 0, -0.14, 0));
  const bangGlow = glow(0xffd100, 0.9); bang.add(bangGlow);
  const robinIdx = W.party.findIndex(p => p.pending);
  if (robinIdx >= 0) { bang.position.copy(figs[robinIdx].position).add(new T.Vector3(0, 2.35, 0)); scene.add(bang); }

  // Selection circle
  const ring = new T.Mesh(new T.RingGeometry(0.45, 0.54, 40), new T.MeshBasicMaterial({ color: 0x2bff4a, transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);

  /* ---------- Overlay UI ---------- */
  const platesEl = $("plates");
  const plates = W.party.map((p, i) => {
    const d = document.createElement("div");
    d.className = "np" + (p.pending ? " np-pending" : "");
    d.innerHTML = `<span class="np-rc"></span><span class="np-name"></span><span class="np-guild">&lt;Kapitalombudsmannen&gt;</span>${p.dead ? '<span class="np-dead">Dead</span>' : ""}`;
    d.querySelector(".np-name").textContent = p.name;
    d.style.setProperty("--nc", W.nameColor(p));
    d.addEventListener("click", () => setTarget(i));
    platesEl.appendChild(d);
    return d;
  });
  const partyList = $("ui-party");
  W.party.forEach((p, i) => {
    if (p.pending) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "pl" + (p.dead ? " dead" : "");
    b.innerHTML = `<span class="pl-name"></span><span class="pl-hp"><i></i></span><span class="pl-mp${p.classes[0] === "warrior" ? " rage" : ""}"><i></i></span>`;
    b.querySelector(".pl-name").textContent = p.name;
    b.style.setProperty("--bar", W.barFill(p));
    b.style.setProperty("--nc", W.nameColor(p));
    b.addEventListener("click", () => setTarget(i));
    partyList.appendChild(b);
  });

  let target = -1;
  const tgt = $("ui-target"), tip = $("ui-tip");
  function setTarget(i) {
    target = i;
    if (i < 0) { tgt.hidden = true; tip.hidden = true; ring.visible = false; return; }
    const p = W.party[i];
    tgt.hidden = false; tip.hidden = false;
    tgt.style.setProperty("--bar", W.barFill(p));
    tgt.style.setProperty("--nc", W.nameColor(p));
    tgt.querySelector(".t-port").textContent = p.name[0];
    tgt.querySelector(".t-name").textContent = p.name;
    tgt.querySelector(".t-lvl").textContent = p.pending ? "??" : "1";
    tgt.querySelector(".t-hp span").textContent = p.dead ? "Dead" : p.spec;
    tgt.classList.toggle("dead", !!p.dead);
    tip.querySelector(".tt-name").textContent = p.name;
    tip.querySelector(".tt-name").style.color = W.nameColor(p);
    tip.querySelector(".tt-line").textContent = p.pending ? "Invite pending" : `Level 1 ${p.race && !p.spec.startsWith(p.race) ? p.race + " " : ""}${p.spec}${p.dead ? " (Corpse)" : ""}`;
    tip.querySelector(".tt-role").textContent = W.roleName[p.role];
    tip.querySelector(".tt-note").innerHTML = p.note;
    ring.visible = true;
    const f = figs[i];
    ring.position.set(f.position.x, 0.03, f.position.z);
    ring.scale.setScalar(Math.max(0.8, f.scale.x * 1.1));
  }

  const chatEl = $("ui-chat");
  function say(kind, who, text) {
    const line = document.createElement("div");
    line.className = "cl cl-" + kind;
    if (who) { const n = document.createElement("span"); n.className = "cl-who"; n.textContent = `[${kind === "party" ? "Party" : "Say"}] [${who}]: `; line.appendChild(n); }
    line.appendChild(document.createTextNode(text));
    chatEl.appendChild(line);
    while (chatEl.children.length > 7) chatEl.firstChild.remove();
  }
  const script = [
    ["sys", "", "Adam has joined the party."], ["sys", "", "Kocken has joined the party."],
    ["sys", "", "Victor has joined the party."], ["sys", "", "Niklas has joined the party."],
    ["sys", "", "Dredde has joined the party."], ["sys", "", "Robin has been invited to the party."],
    ["party", "Adam", "Jag tankar gärna"],
    ["party", "Kocken", "Kan tänka mig köra healer Shaman eller kanske prälle"],
    ["party", "Adam", "Om det fortsätter som betan är det rätt chill att levla"],
    ["party", "Adam", "Blir prot war för mig"],
    ["party", "Victor", "Shaman, warlock, priest och paladin är de jag aldrig spelat tror jag"],
    ["party", "Adam", "Gnome Female warrior är bis"],
    ["party", "Niklas", "Fan vad jag har saknat uttrycket bis"],
    ["party", "Adam", "Shammy är ju riktigt trevligt sen med windfury"],
    ["party", "Robin", "Jag har inte tålamodet"],
    ["sys", "", "Victor has died."],
    ["sys", "", "Victor has released spirit. Again."],
    ["sys", "", "Robin is thinking about it."]
  ];
  let si = 0;
  const nextLine = () => { const [k, w, t] = script[si % script.length]; say(k, w, t); si++; };
  for (let i = 0; i < 4; i++) nextLine();

  // Minimap: north-up around the fire, party as blue dots, Robin's "!" and the camera's arrow.
  const mini = $("mini"), mg = mini.getContext("2d");
  function drawMini() {
    const R = mini.width / 2, k = R / 9;
    mg.clearRect(0, 0, mini.width, mini.height);
    mg.save(); mg.beginPath(); mg.arc(R, R, R, 0, 6.283); mg.clip();
    const bg = mg.createRadialGradient(R, R, 0, R, R, R); bg.addColorStop(0, "#3c5a2a"); bg.addColorStop(1, "#1a2a14");
    mg.fillStyle = bg; mg.fillRect(0, 0, R * 2, R * 2);
    mg.fillStyle = "rgba(108,196,255,.9)"; mg.fillRect(R - 2.2 * k, R - 6.2 * k - 3, 4.4 * k, 6);
    mg.fillStyle = "#ff9a2e"; mg.beginPath(); mg.arc(R, R, 4, 0, 6.283); mg.fill();
    figs.forEach((f, i) => {
      const x = R + f.position.x * k, y = R + f.position.z * k;
      if (W.party[i].pending) { mg.fillStyle = "#ffd100"; mg.font = "bold 16px Georgia"; mg.textAlign = "center"; mg.fillText("!", x, y + 6); return; }
      mg.fillStyle = i === target ? "#2bff4a" : "#4d9bff"; mg.beginPath(); mg.arc(x, y, 3.6, 0, 6.283); mg.fill();
      mg.strokeStyle = "#000"; mg.lineWidth = 1; mg.stroke();
    });
    const cx = R + camera.position.x * k * 0.75, cy = R + camera.position.z * k * 0.75, ang = Math.atan2(-camera.position.x, -camera.position.z);
    mg.translate(Math.max(10, Math.min(R * 2 - 10, cx)), Math.max(10, Math.min(R * 2 - 10, cy)));
    mg.rotate(-ang + Math.PI);
    mg.fillStyle = "#fff"; mg.beginPath(); mg.moveTo(0, -8); mg.lineTo(5, 6); mg.lineTo(0, 3); mg.lineTo(-5, 6); mg.closePath(); mg.fill();
    mg.restore();
  }

  /* ---------- Emotes & action bar ---------- */
  let emote = null, emoteUntil = 0;
  const doEmote = (name, ms, line) => { emote = name; emoteUntil = performance.now() + ms; say("emote", "", line); };
  const castEl = $("ui-cast"), castFill = castEl.querySelector("i");
  const actions = {
    ready: () => document.getElementById("ready-check").click(),
    wave:  () => doEmote("wave", 2200, "The party waves at you."),
    cheer: () => doEmote("cheer", 2400, "The party cheers!"),
    dance: () => doEmote("dance", 5000, "The party bursts into dance."),
    hearth: () => {
      castEl.hidden = false; castFill.style.transition = "none"; castFill.style.width = "0";
      requestAnimationFrame(() => { castFill.style.transition = "width 1.5s linear"; castFill.style.width = "100%"; });
      setTimeout(() => {
        castEl.hidden = true;
        const v = document.getElementById("vault");
        v.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        if (!v.classList.contains("open")) setTimeout(() => document.getElementById("open-vault").click(), reduce ? 0 : 600);
      }, reduce ? 0 : 1550);
    },
    invite: () => {
      say("sys", "", "You have invited Robin to join your group.");
      setTimeout(() => say("sys", "", "Robin is still thinking about it."), 1800);
      if (robinIdx >= 0) setTarget(robinIdx);
    }
  };
  const cds = { ready: 4, wave: 2.5, cheer: 2.5, dance: 5, hearth: 2, invite: 3 };
  const slots = [...document.querySelectorAll("#ui-bar .ab")];
  function fire_(btn) {
    if (btn.dataset.cd === "1") return;
    const a = btn.dataset.act;
    actions[a]();
    const ov = btn.querySelector(".cd"), dur = cds[a] * 1000, t0 = performance.now();
    btn.dataset.cd = "1";
    (function spin() {
      const k = Math.min(1, (performance.now() - t0) / dur);
      ov.style.background = k < 1 ? `conic-gradient(transparent ${k * 360}deg, rgba(0,0,0,.68) 0)` : "none";
      if (k < 1) requestAnimationFrame(spin); else btn.dataset.cd = "0";
    })();
  }
  slots.forEach(b => b.addEventListener("click", () => fire_(b)));
  document.addEventListener("keydown", e => {
    if (e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) return;
    if (!(host.matches(":hover") || host.contains(document.activeElement))) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= slots.length) { e.preventDefault(); fire_(slots[n - 1]); }
    if (e.key === "Escape") setTarget(-1);
    if (e.key === "Tab" && host.matches(":hover") && document.activeElement === host) {
      e.preventDefault();
      const live = W.party.map((p, i) => i);
      setTarget(live[(live.indexOf(target) + 1) % live.length]);
    }
  });

  document.addEventListener("wow:rc", e => {
    const { i, state } = e.detail;
    const el = plates[i] && plates[i].querySelector(".np-rc");
    if (!el) return;
    el.className = "np-rc" + (state === "clear" ? "" : " on " + state);
    el.textContent = state === "yes" ? "✓" : state === "no" ? "✗" : state === "wait" ? "?" : "";
    if (state === "wait" && i === 0) say("sys", "", "Ready check initiated.");
  });
  document.addEventListener("wow:rcdone", () => say("sys", "", "Everyone is ready. Robin is still thinking about it."));

  /* ---------- Camera: slow swing, drag to look, click to target ---------- */
  let yaw = 0, pitch = 0.36, dist = 8.6, dragging = false, moved = 0, lastX = 0, lastY = 0, idleAt = 0;
  const canvasEl = renderer.domElement;
  canvasEl.addEventListener("pointerdown", e => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; canvasEl.setPointerCapture(e.pointerId); });
  canvasEl.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    yaw -= dx * 0.006; pitch = Math.max(0.12, Math.min(0.9, pitch + dy * 0.004));
    idleAt = performance.now() + 5000;
  });
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  canvasEl.addEventListener("pointerup", e => {
    dragging = false;
    if (moved > 6) return;
    const r = canvasEl.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(figs, true)[0];
    setTarget(hit ? hit.object.userData.idx : -1);
  });
  canvasEl.addEventListener("wheel", e => {
    if (!host.matches(":hover")) return;
    e.preventDefault();
    dist = Math.max(5, Math.min(13, dist + e.deltaY * 0.006));
  }, { passive: false });

  /* ---------- Loop ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 52 : 38;
    if (w / h < 1) dist = Math.max(dist, 10);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  let visible = true, raf = 0, last = performance.now(), chatT = 0;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: "100px" }).observe(host);
  const v3 = new T.Vector3(), colA = new T.Color();

  function animateFig(f, t, now) {
    const u = f.userData, ph = u.phase;
    if (W.party[u.idx].dead) return;
    const active = emote && now < emoteUntil && !W.party[u.idx].pending;
    u.body.position.y = reduce ? 0 : Math.sin(t * 2 + ph) * 0.012;
    u.body.rotation.y = 0;
    let l = 0.08 + Math.sin(t * 1.3 + ph) * 0.03, r = -0.08 - Math.sin(t * 1.1 + ph) * 0.03;
    if (active && emote === "wave") r = -2.5 + Math.sin(t * 11 + ph) * 0.35;
    if (active && emote === "cheer") { l = 2.8; r = -2.8; u.body.position.y = Math.abs(Math.sin(t * 7 + ph)) * 0.22; }
    if (active && emote === "dance") {
      u.body.position.y = Math.abs(Math.sin(t * 8 + ph)) * 0.12;
      u.body.rotation.y = Math.sin(t * 5 + ph) * 0.6;
      l = 1.3 + Math.sin(t * 8 + ph) * 0.8; r = -1.3 + Math.sin(t * 8 + ph + 1.5) * 0.8;
    }
    u.armL.rotation.z = l; u.armR.rotation.z = r;
    if (u.orb) {
      const cs = u.orb.colors, k = (t * 0.35 + ph) % cs.length, a = Math.floor(k), b = (a + 1) % cs.length;
      colA.copy(cs[a]).lerp(cs[b], Math.min(1, (k - a) * 2.5));
      u.orb.mat.color.copy(colA); u.orb.mat.emissive.copy(colA); u.orb.glow.material.color.copy(colA);
    }
  }

  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    if (!dragging && now > idleAt && !reduce) yaw += (Math.sin(t * 0.12) * 0.45 - yaw) * 0.004;
    camera.position.set(Math.sin(yaw) * dist * Math.cos(pitch), 0.9 + Math.sin(pitch) * dist, Math.cos(yaw) * dist * Math.cos(pitch));
    camera.lookAt(0, 1.05, -0.6);

    const fl = reduce ? 1 : 0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.07;
    flames.forEach((f, i) => { f.scale.set(1, fl + i * 0.05, 1); f.rotation.y = t * (1 + i); });
    fireLight.intensity = 2.3 * fl + 0.3;
    fireGlow.material.opacity = 0.65 + fl * 0.25;
    for (let i = 0; i < sparkN; i++) {
      sparkLife[i] += dt * 0.5;
      sparkPos[i * 3 + 1] += dt * (0.8 + sparkLife[i]);
      sparkPos[i * 3] += Math.sin(t * 2 + i) * dt * 0.15;
      if (sparkPos[i * 3 + 1] > 3.2) resetSpark(i);
    }
    sparkGeo.attributes.position.needsUpdate = true;

    const open = Date.now() >= W.LAUNCH ? 1 : 0.35;
    portalMat.uniforms.uTime.value = t;
    portalMat.uniforms.uOpen.value += (open - portalMat.uniforms.uOpen.value) * 0.02;
    gateLight.intensity = 0.9 + portalMat.uniforms.uOpen.value * 1.2 + Math.sin(t * 2) * 0.15;

    figs.forEach(f => animateFig(f, t, now));
    if (emote && now > emoteUntil) emote = null;
    bang.rotation.y = t * 1.6; bang.position.y = 2.35 * (figs[robinIdx]?.scale.x || 1) + Math.sin(t * 2.2) * 0.06;
    if (ring.visible) ring.material.opacity = 0.7 + Math.sin(t * 4) * 0.2;

    renderer.render(scene, camera);

    const w = host.clientWidth, h = host.clientHeight;
    figs.forEach((f, i) => {
      f.userData.top.getWorldPosition(v3);
      v3.project(camera);
      const el = plates[i];
      if (v3.z > 1) { el.style.opacity = 0; return; }
      el.style.opacity = 1;
      el.style.transform = `translate(${(v3.x * 0.5 + 0.5) * w}px, ${(-v3.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
      el.classList.toggle("np-target", i === target);
    });
    drawMini();
    chatT += dt;
    if (chatT > 4.2) { chatT = 0; nextLine(); }
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } });
  raf = requestAnimationFrame(loop);
  W.world = { setTarget, say };
})();
