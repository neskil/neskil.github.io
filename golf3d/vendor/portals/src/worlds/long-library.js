// THE LONG LIBRARY: a late-afternoon flight down a vaulted library a quarter of a kilometre long, through
// sun shafts thick with dust, under an arched mezzanine bridge, into a decagonal rotunda where a brass
// orrery turns beneath a coffered dome, and out down a second gallery to the great doorway.
//
// Layout (world space = the hero's local space): rotunda centre at the origin, the long hall on +Z
// (z 33..269), the exit gallery on -Z (z -33..-118). The camera flies toward -Z; the sun is on -X.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/long-library.js';

const PI = Math.PI, TAU = PI * 2, S = 1.5;
const V3 = THREE.Vector3;
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 8, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const sph = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const lathe = (pts, seg = 12) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p[0], 1e-4), p[1])), seg);
const S_WOOD = INT.surf(1, 0.42), S_WOODM = INT.surf(1, 0.2), S_BRASS = INT.surf(0, 0.78, 1), S_STONE = INT.surf(3, 0.16);
const S_MATTE = INT.surf(0, 0.06), S_PAPER = INT.surf(0, 0.1), S_ENAMEL = INT.surf(0, 0.7), S_LEAF = INT.surf(0, 0.35, 0, 0, 1);
const WOOD = '#4a2c18', OAK = '#7d5231', CREAM = '#d6c9ab', BRASS = '#c9a148', BLUE = '#1f3a5a', RED = '#6b1f1f';

// quad whose flat normal faces the point `t`
function quadTo(b, p0, p1, p2, p3, t, c, sf) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * (t[0] - p0[0]) + ny * (t[1] - p0[1]) + nz * (t[2] - p0[2]) >= 0) b.quad(p0, p1, p2, p3, c, sf); else b.quad(p0, p3, p2, p1, c, sf);
}
// counter-clockwise outline of a round-headed opening in wall coordinates (u, y), starting bottom-left
function archOutline(u, y, w, h, seg = 14) {
  const hw = w / 2, y0 = y + h - hw, pts = [[u - hw, y], [u + hw, y]];
  for (let i = 0; i <= seg; i++) { const a = (i / seg) * PI; pts.push([u + Math.cos(a) * hw, y0 + Math.sin(a) * hw]); }
  return pts;
}
// a bust on a plinth (real-life metres * s), origin on the floor
function addBust(b, x, z, ry, s, stone) {
  b.add(box(0.62 * s, 1.25 * s, 0.62 * s), { p: [x, 0.625 * s, z], r: [0, ry, 0], c: WOOD, surf: S_WOOD });
  b.add(box(0.74 * s, 0.1 * s, 0.74 * s), { p: [x, 1.3 * s, z], r: [0, ry, 0], c: OAK, surf: S_WOOD });
  b.add(box(0.72 * s, 0.14 * s, 0.72 * s), { p: [x, 0.07 * s, z], r: [0, ry, 0], c: OAK, surf: S_WOOD });
  b.add(lathe([[0.26, 0], [0.3, 0.06], [0.24, 0.2], [0.1, 0.3], [0.085, 0.37], [0.125, 0.43], [0.14, 0.53], [0.115, 0.63], [0.05, 0.68], [0.001, 0.69]], 10),
    { p: [x, 1.35 * s, z], r: [0, ry, 0], s: [s, s, s * 0.82], c: stone, surf: S_STONE });
}
// card-catalogue cabinet: oak carcass with a grid of small drawers and brass pulls, front = +Z before rotation
function addCatalogue(b, x, z, ry, s) {
  const w = 1.7 * s, h = 1.45 * s, d = 0.62 * s, m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, 0, z);
  b.add(box(w, h, d), { p: [0, h / 2 + 0.12 * s, 0], pre: m, c: WOOD, surf: S_WOOD });
  b.add(box(w * 1.05, 0.12 * s, d * 1.08), { p: [0, 0.06 * s, 0], pre: m, c: OAK, surf: S_WOOD });
  b.add(box(w * 1.06, 0.07 * s, d * 1.1), { p: [0, h + 0.155 * s, 0], pre: m, c: OAK, surf: S_WOOD });
  const nx = 6, ny = 5, cw = w * 0.94 / nx, ch = h * 0.92 / ny;
  for (const f of [-1, 1]) for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const px = (i - (nx - 1) / 2) * cw, py = 0.12 * s + h * 0.04 + (j + 0.5) * ch;
    b.add(box(cw * 0.86, ch * 0.8, 0.03 * s), { p: [px, py, f * (d / 2 + 0.01 * s)], pre: m, c: OAK, surf: S_WOOD });
    b.add(box(cw * 0.3, ch * 0.16, 0.03 * s), { p: [px, py - ch * 0.12, f * (d / 2 + 0.03 * s)], pre: m, c: BRASS, surf: S_BRASS });
  }
}
// a heap of big folios on the floor
function addFloorBooks(b, rng, x, z, s) {
  const cols = [RED, BLUE, '#2f4a2a', '#5a4022', '#3a1f3a', '#8a6a2a'];
  for (let q = 0; q < 2; q++) {
    let y = 0; const ox = x + (q ? rng.range(0.5, 0.8) * s : 0), oz = z + (q ? rng.range(-0.4, 0.4) * s : 0), n = rng.int(3, 7 - q * 3);
    for (let i = 0; i < n; i++) {
      const w = rng.range(0.5, 0.72) * s, d = rng.range(0.36, 0.5) * s, t = rng.range(0.07, 0.14) * s, ry = rng.range(-0.5, 0.5);
      b.add(box(w, t, d), { p: [ox, y + t / 2, oz], r: [0, ry, 0], c: rng.pick(cols), surf: INT.surf(0, 0.3) });
      b.add(box(w * 0.96, t * 0.7, d * 0.96), { p: [ox + 0.012 * s, y + t / 2, oz + 0.012 * s], r: [0, ry, 0], c: '#d8ceb4', surf: S_PAPER });
      y += t;
    }
  }
}
// an open atlas lying on a table; the turning leaf is a separate instance (see pages below). Spine along local z.
function addAtlas(b, x, y, z, ry, s) {
  const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z), w = 0.7 * s, d = 0.95 * s;
  b.add(box(w * 2.06, 0.03 * s, d * 1.04), { p: [0, 0.015 * s, 0], pre: m, c: RED, surf: INT.surf(0, 0.35) });
  for (const f of [-1, 1]) {
    b.add(box(w * 0.98, 0.05 * s, d), { p: [f * w * 0.5, 0.055 * s, 0], r: [0, 0, -f * 0.035], pre: m, c: '#e9dfc4', surf: S_PAPER });
    for (let i = 0; i < 3; i++) b.add(box(w * 0.72, 0.004 * s, d * 0.16), { p: [f * w * 0.5, 0.086 * s, (i - 1) * d * 0.28], r: [0, 0, -f * 0.035], pre: m, c: i === 1 ? '#8a9aa8' : '#b9a27a', surf: S_PAPER });
  }
}

// tables, lamps, chairs, stairs, chandeliers for one library room (the kit's arrangement, kept clear of the flight axis)
// pause: the build's ctx.yield, as in buildRotunda (the kit builds the furniture in steps)
async function furnish(room, rng, o = {}, pause) {
  const sz = room.size, bm = sz.bay / S, bays = sz.bays, top = sz.height / S, X = sz.width / S / 2;
  const t1 = room.features.tiers.t1 / S, bal = room.features.tiers.balcony / S, items = [];
  const I = (kind, x, y, z, ry, opts, extra) => items.push({ kind, position: [x * S, y * S, z * S], rotation: ry || 0, opts, ...(extra || {}) });
  for (let k = 0; k < bays; k++) {
    const zc = -(k + 0.5) * bm;
    for (const s of [-1, 1]) {
      const tx = s * 3.3, sh = -s * (o.sunSide ?? -1);                      // sh > 0: the shadow-side row, which has two lamps a table
      if (!(o.skipTable && o.skipTable(k, s))) {
        I('table', tx, 0, zc, PI / 2, { width: 4.2, depth: 1.25, height: 0.78, legs: 'square', color: '#6e4526' }, { occluder: false });
        const far = o.farFrom != null && k >= o.farFrom;                   // distant bays carry less: fewer lamps, chairs and books
        for (const e of sh > 0 && k < (o.pairsTo ?? 99) ? [-1, 1] : [1]) I('lamp', tx, 0.78, zc + e * 1.1, s > 0 ? PI / 2 : -PI / 2, { kind: 'desk', shadeColor: o.shade || '#1c7a48', glow: o.lampGlow ?? 1 },
          { scale: 1.5, tag: e < 0 ? 'X' : s > 0 ? 'R' : 'L', light: o.lights && sh > 0 && e > 0 ? { priority: 7, intensity: o.lampI ?? 5, range: 6 * S } : false });
        for (const q of [-1, 1]) for (const e of [-1, 1]) if (rng.chance(far ? 0.14 : 0.34)) I('chair', tx + q * 0.95, 0, zc + e * 1.15 + rng.range(-0.1, 0.1), Math.atan2(-q, 0) + rng.range(-0.3, 0.3),
          { style: 'dining', seatColor: '#2f4a3a', color: '#6e4526' }, { scale: 1.1, occluder: false });
        if (rng.chance(far ? 0.3 : 0.7)) I('bookStack', tx + rng.range(-0.2, 0.2), 0.78, zc + rng.range(-0.6, 0.4), rng.range(0, 3), { count: rng.int(3, 7) }, { scale: 1.4 });
      }
    }
    if (k % 6 === (o.stairAt ?? 1) && k < (o.stairsTo ?? 99)) I('staircase', ((k >> 1) % 2 ? 1 : -1) * (X - bal - 0.86), 0, zc + bm * 0.25, 0, { kind: 'spiral', height: t1 + 0.24, width: 0.85, turns: 1.6 }, { occluder: false });
    const ch = o.chandelier ? o.chandelier(k) : null;                      // hangs over the boundary between bay k and k+1
    if (ch) I('chandelier', 0, top - 0.3, zc - bm / 2, k * 0.7, { arms: ch.arms ?? 10, tiers: ch.tiers, radius: 0.9, drop: ch.drop, crystals: false }, { scale: ch.scale, light: false });
  }
  for (const g of o.globes || []) I('globe', g[0], 0, g[1], g[2] || 0, { radius: g[3] || 0.5 }, { scale: 1.6 });
  for (const p of o.plants || []) I('plant', p[0], 0, p[1], rng.range(0, TAU), { kind: p[2], height: p[3] }, { scale: p[4] || 1.3, occluder: false });
  const f = await INT.makeFurnitureAsync({ rig: room.rig, rng: rng.fork('furniture'), scale: S, items, chunks: Math.min(6, bays), length: sz.length, material: room.materials.prop,
    lights: !!o.lights, occluders: false, maxLights: 4, flameGain: o.flameGain }, pause);
  room.object.add(f.object);
  await pause();
  // bulb positions (room-local) of the desk lamps, by side
  const lamps = { R: [], L: [], X: [], all: [] }, Y = new V3(0, 1, 0);
  f.items.forEach((it, i) => {
    if (it.kind !== 'lamp' || !it.userData.light) return;
    const p = new V3().fromArray(it.userData.light).applyAxisAngle(Y, it.rotation).add(new V3().fromArray(it.position));
    lamps.all.push(p); lamps[items[i].tag].push(p);
  });
  const rugs = [];
  for (let k = 0; k + 1 < bays; k += 2) rugs.push({ position: [0, 0, -(k + 1) * bm * S], width: 2.7 * S, length: Math.min(10.5, bm * 1.45) * S });
  const rr = INT.makeRugs({ rig: room.rig, rng: rng.fork('rugs'), scale: S, rugs, colors: o.rugColors });
  room.object.add(rr.object);
  return { furniture: f, lamps, triangles: f.triangles + rr.triangles };
}

// ---------------------------------------------------------------------------------------------
// The rotunda: a decagon 64 m across the flats (one flat = the width of the hall), book walls with a gallery,
// a drum of clerestory windows and a coffered dome with an 8 m oculus. Lit by its own interior light rig.
// ---------------------------------------------------------------------------------------------
const RA = 32, RN = 10, RW = 2 * RA * Math.tan(PI / RN), RC = RA / Math.cos(PI / RN), DRUM = 26, DOME_H = 22, DOME_R = 31.4;
const DOOR = { w: 19.5, h: 24.6 }, WIN = { w: 6, h: 7.35, sill: 17.55, off: 5.2 };
function facet(k) {
  const az = k * TAU / RN, t = new V3(-Math.cos(az), 0, Math.sin(az)), n = new V3(-Math.sin(az), 0, -Math.cos(az));
  const ax = RA * Math.sin(az) - t.x * RW / 2, az0 = RA * Math.cos(az) - t.z * RW / 2;
  const m = new THREE.Matrix4().makeBasis(t, new V3(0, 1, 0), n).setPosition(ax, 0, az0);
  return { k, az, t, n, m, open: k === 0 || k === RN / 2, pt: (u, y, d = 0) => [ax + t.x * u + n.x * d, y, az0 + t.z * u + n.z * d], v3: (u, y, d = 0) => new V3(ax + t.x * u + n.x * d, y, az0 + t.z * u + n.z * d) };
}
// The drum windows of the rotunda: clear old glass looking out on a hazy afternoon. The view has real depth: a ring
// of park trees 60 m out whose crowns stir, a far tower and its long roof, drifting cloud; all found by intersecting
// the view ray with two cylinders, so tree tops and tower slide behind the glazing bars as the camera circles.
function rotundaPanes(panes, rig, mood, rng, th) {
  const P = [], AB = [], I = []; let n = 0;
  for (const { f, u } of panes) {
    for (const [a, b] of [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]]) { P.push(...f.pt(u + a * WIN.w, WIN.sill + b * WIN.h, -th * 0.92)); AB.push(a * WIN.w, b * WIN.h); }
    I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAB', new THREE.Float32BufferAttribute(AB, 2)); g.setIndex(I);
  const od = mood.outdoor, C = (c) => ({ value: new THREE.Color(c) });
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: rig.uniforms.uTime, uSunCol: rig.uniforms.uSunCol,
      uZenith: C(od.zenith), uHorizon: C(od.horizon), uGround: C(od.ground), uCloud: C(od.cloud), uGain: { value: (mood.paneK ?? 1.2) * 1.55 }, uFrost: { value: 0.1 },
      uTower: { value: new THREE.Vector4(rng.range(-2.0, -1.25), rng.range(55, 64), rng.range(4.2, 5.4), rng.range(0, 100)) },
      uWin: { value: new THREE.Vector4(WIN.w, WIN.h, 3, 4) } },
    vertexShader: /* glsl */`
      attribute vec2 aAB; varying vec2 vAB; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vAB = aAB; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`precision highp float;
      uniform float uTime, uGain, uFrost; uniform vec3 uSunCol, uZenith, uHorizon, uGround, uCloud; uniform vec4 uTower, uWin;
      varying vec2 vAB; varying vec3 vW;
      #include <fog_pars_fragment>
      float h21(vec2 p){ p = fract(p*vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      vec3 hitCyl(vec3 o, vec3 d, float R){ float a = dot(d.xz, d.xz) + 1e-5, b = dot(o.xz, d.xz), c = dot(o.xz, o.xz) - R*R; return o + d*((-b + sqrt(max(b*b - a*c, 0.)))/a); }
      void main(){
        vec3 ro = cameraPosition, rd = normalize(vW - ro);
        float el = rd.y, az = atan(rd.x, rd.z);
        vec3 sky = mix(uHorizon, uZenith, smoothstep(.03, .62, el));
        vec2 cq = vec2(az*2.6 + uTime*.014, el*6.5); float cl = n2(cq)*.6 + n2(cq*2.3 + 3.7)*.4;
        sky = mix(sky, uCloud, smoothstep(.46, .78, cl)*.7);
        vec3 col = sky, haze = mix(uHorizon, uZenith, .2);
        { // the far tower with its pointed cap, and the long roof it rises from
          vec3 p = hitCyl(ro, rd, 150.); float da = atan(p.x, p.z) - uTower.x; da = (da - 6.2832*floor(da/6.2832 + .5))*150.;
          float hw = uTower.z, top = uTower.y, y = p.y;
          float body = step(abs(da), hw)*step(y, top) + step(abs(da), (hw + 1.2)*clamp(1. - (y - top)/(hw*3.2), 0., 1.))*step(top, y);
          body = max(body, step(abs(da + 22.), 34.)*step(y, 37. + 6.*clamp(1. - abs(da + 22.)/34., 0., 1.)));
          body = max(body, step(abs(da - 31.), 2.2)*step(y, top*.62));
          float lit = .75 + .25*step(da, 0.);
          col = mix(col, mix(uGround*vec3(.9, .7, .8)*.6, haze, .62)*lit, min(body, 1.)); }
        { // tree tops, two ranks, the near one stirring
          vec3 p = hitCyl(ro, rd, 96.); float s = atan(p.x, p.z)*96.;
          float h = 24. + 9.*n2(vec2(s*.035, 2.)) + 4.*n2(vec2(s*.13, 7.)) + 1.5*n2(vec2(s*.5, 4.));
          col = mix(col, mix(uGround*.9, haze, .62), smoothstep(h + .4, h - .4, p.y));
          p = hitCyl(ro, rd, 60.); s = atan(p.x, p.z)*60. + uTower.w;
          float w = uTime*.7, sw = .5*sin(w + s*.11) + .3*sin(w*1.7 + s*.37);
          float crown = abs(fract(s*.085 + .3*n2(vec2(s*.02, 1.))) - .5);
          h = 19. + 8.*n2(vec2(s*.045, 3.)) + 3.2*n2(vec2((s + sw)*.2, 5.)) + 1.3*n2(vec2((s + sw*1.6)*.9, 9.)) - 5.*crown*crown + sw*.25;
          float lf = n2(vec2((s + sw)*.8, p.y*.8 + sw*.4));
          vec3 tc = uGround*(.62 + .5*lf)*mix(vec3(1.), uSunCol*.08, .6*smoothstep(h - 6., h, p.y));
          col = mix(col, mix(tc, haze, .3), smoothstep(h + .25, h - .25, p.y)); }
        col = mix(col, mix(uHorizon, uZenith, .3), uFrost)*uGain;
        // old glass: each quarry sits at its own slight tilt
        vec2 q = vec2(vAB.x/uWin.x + .5, vAB.y/uWin.y)*uWin.zw*vec2(3., 3.);
        col *= .9 + .2*h21(floor(q) + 7.);
        vec2 qb = vec2(vAB.x/uWin.x + .5, vAB.y/uWin.y)*uWin.zw, dl = (.5 - abs(fract(qb) - .5))*uWin.xy/uWin.zw;
        vec2 dq = (.5 - abs(fract(q) - .5))*uWin.xy/(uWin.zw*3.);
        float fw = length(fwidth(vAB));
        col *= .9 + .1*smoothstep(.012, .012 + fw, min(dq.x, dq.y));
        col = mix(vec3(.05, .035, .022), col, smoothstep(.035, .035 + fw, min(dl.x, dl.y)));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'rotunda-panes'; mesh.frustumCulled = false;
  return mesh;
}
// pause: the build's ctx.yield (hands the page back between the pieces; draws nothing)
async function buildRotunda(o, pause) {
  const { rng, pal, mood } = o, group = new THREE.Group(); group.name = 'rotunda';
  const t1 = 5.0 * S, t2 = 10.3 * S, bal = 1.55 * S, wallH = 11.2 * S, th = 1.0;
  const rig = INT.makeLightRig({ scale: S, sunDir: o.sunDir, sunColor: mood.sun, sunIntensity: mood.sunI, ambient: 2.35, ambientSky: mood.rotSky, ambientGround: mood.rotGround,
    bounceColor: '#8a6a44', bounce: 3.4, dapple: o.dapple });
  rig.setBounds([-RC, 0, -RC], [RC, DRUM + DOME_H, RC], 0);
  const wb = INT.makeBuilder(), tb = INT.makeBuilder(), fb = INT.makeBuilder(), facets = [], panes = [], skyI = mood.skyI * 0.75;
  for (let k = 0; k < RN; k++) {
    await pause();
    const f = facet(k); facets.push(f);
    // wall face with its openings
    const out = [new THREE.Vector2(0, 0)], holes = [];
    if (f.open) {
      const pts = archOutline(RW / 2, 0, DOOR.w, DOOR.h, 20);
      out.push(new THREE.Vector2(pts[0][0], pts[0][1])); for (let i = pts.length - 1; i >= 1; i--) out.push(new THREE.Vector2(pts[i][0], pts[i][1]));
      // archivolt facing the rotunda
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i], b2 = pts[i + 1], dx = b2[0] - a[0], dy = b2[1] - a[1], l = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), ox = dy / l * 0.32, oy = -dx / l * 0.32;
        tb.add(box(l + 0.25, 0.64, 0.5), { p: [(a[0] + b2[0]) / 2 + ox, (a[1] + b2[1]) / 2 + oy, 0.12], r: [0, 0, ang], pre: f.m, c: CREAM, surf: S_STONE });
      }
      tb.add(box(1.5, 2.2, 0.9), { p: [RW / 2, DOOR.h + 0.5, 0.25], pre: f.m, c: BRASS, surf: S_BRASS });
    } else {
      for (const s of [-1, 1]) {
        const u = RW / 2 + s * WIN.off, pts = archOutline(u, WIN.sill, WIN.w, WIN.h, 12), cen = f.pt(u, WIN.sill + WIN.h * 0.45, -th / 2);
        holes.push(new THREE.Path(pts.map((p) => new THREE.Vector2(p[0], p[1]))));
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b2 = pts[(i + 1) % pts.length]; quadTo(tb, f.pt(a[0], a[1]), f.pt(b2[0], b2[1]), f.pt(b2[0], b2[1], -th), f.pt(a[0], a[1], -th), cen, pal.reveal, S_STONE); }
        tb.add(box(WIN.w + 0.9, 0.3, 0.6), { p: [u, WIN.sill - 0.15, 0.12], pre: f.m, c: CREAM, surf: S_STONE });
      }
      const row = { origin: f.v3(RW / 2 - WIN.off, WIN.sill + WIN.h / 2), axis: f.t, normal: f.n, width: WIN.w, height: WIN.h, spacing: WIN.off * 2, count: 2, arch: 1, mullions: [3, 4],
        sky: mood.sky, skyIntensity: skyI, bar: 0.022 * S };
      // sunny flats light the room through the rig (pools, shafts, motes); every pane is drawn by rotundaPanes below
      const sunny = o.sunDir.dot(f.n) < -0.12, real = sunny && rig.rows.length < 5 ? rig.addWindowRow(row) : null;
      if (real) { real.depth = th; real.noPane = true; }
      for (const s of [-1, 1]) panes.push({ f, u: RW / 2 + s * WIN.off });
    }
    out.push(new THREE.Vector2(RW, 0), new THREE.Vector2(RW, DRUM), new THREE.Vector2(0, DRUM));
    const shape = new THREE.Shape(out); shape.holes = holes;
    wb.add(new THREE.ShapeGeometry(shape), { m: f.m, c: '#ffffff', surf: S_MATTE });
    // cornices
    tb.add(box(RW, 0.8, 1.3), { p: [RW / 2, DRUM - 0.4, 0.3], pre: f.m, c: CREAM, surf: S_STONE });
    if (!f.open) {
      tb.add(box(RW, 0.75, 1.0), { p: [RW / 2, wallH - 0.375, 0.2], pre: f.m, c: WOOD, surf: S_WOOD });
      for (const y of [0, t1 + 0.42 * S, t2]) tb.add(box(RW, 0.45, 0.75), { p: [RW / 2, y + 0.225, 0.15], pre: f.m, c: WOOD, surf: S_WOOD });
      for (let j = 1; j < 8; j++) tb.add(box(0.135, t2, 0.39), { p: [RW * j / 8, t2 / 2, 0.03], pre: f.m, c: '#40260f', surf: S_WOODM });
      // gallery balcony and its brass rail
      const e = bal * Math.tan(PI / RN), ry = t1 + 0.36, rh = 1.58, n = 10, d = bal - 0.12;
      tb.add(box(RW, 0.36, bal), { p: [RW / 2, t1 + 0.18, bal / 2], pre: f.m, c: '#52321c', surf: S_WOOD });
      for (let i = 0; i <= n; i++) tb.add(cyl(0.033, 0.033, rh, 5, true), { p: [lerp(e, RW - e, i / n), ry + rh / 2, d], pre: f.m, c: BRASS, surf: S_BRASS });
      for (const [yy, r] of [[rh, 0.06], [rh * 0.5, 0.03], [rh * 0.12, 0.03]]) tb.add(cyl(r, r, RW - 2 * e, 6, true), { p: [RW / 2, ry + yy, d], r: [0, 0, PI / 2], pre: f.m, c: BRASS, surf: S_BRASS });
      for (const u of [RW * 0.25, RW * 0.75]) tb.add(box(0.45, 1.3, bal * 0.9), { p: [u, t1 - 0.6, bal * 0.45], pre: f.m, c: WOOD, surf: S_WOOD });
    }
    // corner pier between this flat and the next
    const ac = f.az + PI / RN, cr = RC - 0.5, cx = Math.sin(ac) * cr, cz = Math.cos(ac) * cr;
    tb.add(box(1.6, wallH, 1.3), { p: [cx, wallH / 2, cz], r: [0, ac, 0], c: WOOD, surf: S_WOOD, grad: [0, 3, 0.7, 1] });
    tb.add(box(1.95, 0.9, 1.6), { p: [cx, 0.45, cz], r: [0, ac, 0], c: OAK, surf: S_WOOD });
    tb.add(box(2.0, 0.7, 1.7), { p: [cx, wallH - 0.2, cz], r: [0, ac, 0], c: OAK, surf: S_WOOD });
    tb.add(box(1.3, DRUM - wallH, 1.2), { p: [cx, (DRUM + wallH) / 2, cz], r: [0, ac, 0], c: CREAM, surf: S_STONE });
    // soffit between the flat and the dome's base circle
    const M = 4;
    for (let i = 0; i < M; i++) {
      const a0 = f.az - PI / RN + (i / M) * TAU / RN, a1 = f.az - PI / RN + ((i + 1) / M) * TAU / RN, r0 = RA / Math.cos(a0 - f.az), r1 = RA / Math.cos(a1 - f.az);
      quadTo(tb, [Math.sin(a0) * r0, DRUM, Math.cos(a0) * r0], [Math.sin(a1) * r1, DRUM, Math.cos(a1) * r1], [Math.sin(a1) * (DOME_R - 0.4), DRUM, Math.cos(a1) * (DOME_R - 0.4)], [Math.sin(a0) * (DOME_R - 0.4), DRUM, Math.cos(a0) * (DOME_R - 0.4)], [0, 0, 0], CREAM, S_STONE);
    }
  }
  // oculus: sky fill only (the low sun cannot reach it); its pane glows, the beam is a column of god rays
  const oc = rig.addWindowRow({ origin: [0, DRUM + DOME_H - 0.15, 0], axis: [1, 0, 0], up: [0, 0, 1], normal: [0, -1, 0], width: 8.2, height: 8.2, count: 1, arch: 3, mullions: [4, 4], sky: mood.sky, skyIntensity: skyI * 1.7, sun: false, bar: 0.03 * S });
  if (oc) { oc.depth = 0; oc.noShaft = true; oc.paneGain = 0.8; }
  // dome: coffers in six rings, blue panels with gilt rosettes
  const tmax = Math.acos(4.1 / DOME_R), st = Math.sin(tmax), NR = 6, NS = 40, C0 = [0, DRUM - 4, 0];
  const D = (t, a, push = 0) => { const r = DOME_R * Math.cos(t), y = DRUM + DOME_H * Math.sin(t) / st, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!push) return [x, y, z]; const dx = x - C0[0], dy = y - C0[1], dz = z - C0[2], l = push / Math.hypot(dx, dy, dz); return [x + dx * l, y + dy * l, z + dz * l]; };
  const rib = new THREE.Color(CREAM), ribD = rib.clone().multiplyScalar(0.7), panel = new THREE.Color(pal.coffer), gilt = new THREE.Color(BRASS);
  const mixP = (p00, p10, p11, p01, u, v) => [0, 1, 2].map((q) => lerp(lerp(p00[q], p10[q], u), lerp(p01[q], p11[q], u), v));
  for (let j = 0; j < NR; j++) {
    await pause();
    const ta = tmax * Math.pow(j / NR, 0.92), tb2 = tmax * Math.pow((j + 1) / NR, 0.92), dp = 0.75 * (1 - 0.55 * j / NR);
    for (let i = 0; i < NS; i++) {
      const a0 = (i / NS) * TAU, a1 = ((i + 1) / NS) * TAU;
      const c = [D(ta, a0), D(ta, a1), D(tb2, a1), D(tb2, a0)], cp = [D(ta, a0, dp), D(ta, a1, dp), D(tb2, a1, dp), D(tb2, a0, dp)];
      const at = (src, u, v) => mixP(src[0], src[1], src[2], src[3], u, v);
      const e1 = 0.16, e2 = 0.27, uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const A = uv.map(([u, v]) => at(c, lerp(e1, 1 - e1, u), lerp(e1, 1 - e1, v))), B = uv.map(([u, v]) => at(cp, lerp(e2, 1 - e2, u), lerp(e2, 1 - e2, v)));
      for (let q = 0; q < 4; q++) { const q1 = (q + 1) % 4; quadTo(tb, c[q], c[q1], A[q1], A[q], C0, rib, S_STONE); quadTo(tb, A[q], A[q1], B[q1], B[q], C0, ribD, S_STONE); }
      quadTo(tb, B[0], B[1], B[2], B[3], C0, panel, S_ENAMEL);
      const g0 = 0.38, g1 = 0.62, cq = D((ta + tb2) / 2, (a0 + a1) / 2, dp), k2 = 0.25 / Math.hypot(cq[0] - C0[0], cq[1] - C0[1], cq[2] - C0[2]);
      const R4 = [[0.5, g0], [g1, 0.5], [0.5, g1], [g0, 0.5]].map(([u, v]) => { const p = at(cp, lerp(e2, 1 - e2, u), lerp(e2, 1 - e2, v)); return [p[0] - (cq[0] - C0[0]) * k2, p[1] - (cq[1] - C0[1]) * k2, p[2] - (cq[2] - C0[2]) * k2]; });
      quadTo(tb, R4[0], R4[1], R4[2], R4[3], C0, gilt, S_BRASS);
    }
  }
  await pause();
  const ring = new THREE.TorusGeometry(4.25, 0.28, 8, 40); ring.rotateX(PI / 2);
  tb.add(ring, { p: [0, DRUM + DOME_H - 0.1, 0], c: BRASS, surf: S_BRASS });
  const ring2 = new THREE.TorusGeometry(DOME_R - 0.3, 0.3, 6, 80); ring2.rotateX(PI / 2);
  tb.add(ring2, { p: [0, DRUM + 0.1, 0], c: BRASS, surf: S_BRASS });
  await pause();
  // busts on plinths between the windows, floor
  for (const f of facets) if (!f.open) for (const u of [RW * 0.3, RW * 0.7]) { const p = f.pt(u, 0, bal + 1.1); addBust(tb, p[0], p[2], Math.atan2(-p[0], -p[2]), S * 1.25, CREAM); }
  fb.add(new THREE.CircleGeometry(RC + 0.4, RN, -PI / 2 + PI / RN, TAU), { r: [-PI / 2, 0, 0], c: '#ffffff', surf: S_MATTE });
  await pause();

  // lights: the orrery's glass sun and the cool skylight under the oculus
  const sunLamp = rig.addLight({ position: [0, 11, 0], color: '#ffb25a', intensity: 15 * mood.lamp, range: 44, flicker: 0.05 });
  rig.addLight({ position: [0, 40, 0], color: mood.sky, intensity: 9, range: 34 });

  const floorMat = INT.interiorMaterial({ rig, pattern: 'floor', mode: 3, colors: [pal.tileA, pal.tileB, '#8a7a5a', '#2a1c12'], patA: [1.25, 0.006, 1, 1], patB: [0.72, 0.4, 0, 0], scale: S });
  const wallMat = INT.interiorMaterial({ rig, pattern: 'wall', mode: 5, colors: [pal.wallA, pal.wallB, pal.wainscot, pal.wallD], patA: [0, 0.66, 1, t2 / S], patB: [0.1, 0.3, 0, 0], scale: S });
  const propMat = INT.propMaterial({ rig, scale: S, sway: { amp: 0.028, freq: 1.2 } });
  const add = (g, m, name) => { const me = new THREE.Mesh(g, m); me.name = name; group.add(me); return me; };
  await pause();
  add(fb.build(), floorMat, 'rotunda-floor'); add(wb.build(), wallMat, 'rotunda-walls'); await pause(); add(tb.build(), propMat, 'rotunda-trim');
  let triangles = fb.triangles + wb.triangles + tb.triangles;

  // potted palms at the piers, ferns and two big globes by the hall arch
  const items = [];
  for (let j = 0; j < RN; j++) {
    const ac = (j + 0.5) * TAU / RN, r = RC - 3.3, flank = j === 0 || j === RN - 1 || j === RN / 2 - 1 || j === RN / 2;
    items.push({ kind: 'plant', position: [Math.sin(ac) * r, 0, Math.cos(ac) * r], rotation: rng.range(0, TAU), opts: { kind: 'palm', height: flank ? 2.7 : rng.range(2.0, 2.5), potColor: '#7d5231' }, scale: 1.75, occluder: false });
    if (rng.chance(0.75)) { const a2 = ac + rng.sign() * 0.085, r2 = r - rng.range(0.2, 1.4); items.push({ kind: 'plant', position: [Math.sin(a2) * r2, 0, Math.cos(a2) * r2], rotation: rng.range(0, TAU), opts: { kind: 'fern', height: rng.range(0.8, 1.1) }, scale: 2.2, occluder: false }); }
  }
  await pause();
  const fur = await INT.makeFurnitureAsync({ rig, rng: rng.fork('rot-furniture'), scale: S, items, material: propMat, lights: false, occluders: false }, pause);
  group.add(fur.object); triangles += fur.triangles;
  await pause();

  const wlOpts = { paneGain: 0.27, outdoor: mood.outdoor, frost: mood.frost, scroll: 0.05, glare: 1, shaftGain: o.shaftGain, shaftDensity: o.shaftDensity, motesPerWindow: 220, maxMotes: 1800, moteSize: 0.03, moteGain: 1.8, moteDrift: 0.6 };
  const wl = INT.makeWindowLight({ rig, rng: rng.fork('rot-light'), ...wlOpts }); group.add(wl.object);
  await pause();
  const pm = rotundaPanes(panes, rig, mood, rng.fork('rot-view'), th); group.add(pm);
  return { object: group, rig, sunLamp, triangles: triangles + wl.triangles + panes.length * 2, materials: { prop: propMat },
    update(dt, time, camera) { rig.update(time, group); wl.update(dt, time, camera); fur.update(dt, time, camera); } };
}

// ---------------------------------------------------------------------------------------------
// extras for a library room (room-local space): clerestory walkway, props between the tables, atlases
// ---------------------------------------------------------------------------------------------
// pause: the build's ctx.yield, as in buildRotunda
async function roomExtras(room, rng, o = {}, pause) {
  const b = INT.makeBuilder(), sz = room.size, L = sz.length, X = sz.width / 2, bay = sz.bay, bays = sz.bays, t2 = room.features.tiers.t2, atlases = [], lanterns = [];
  for (const s of [-1, 1]) {
    await pause();
    // upper walkway along the foot of the windows
    b.add(box(1.6, 0.3, L), { p: [s * (X - 0.8), t2 + 0.15, -L / 2], c: '#52321c', surf: S_WOOD });
    const n = bays * 2, rh = 1.5, rx = s * (X - 1.5);
    for (let i = 0; i <= n; i++) b.add(cyl(0.03, 0.03, rh, 5, true), { p: [rx, t2 + 0.3 + rh / 2, -i * L / n], c: BRASS, surf: S_BRASS });
    for (const [yy, r] of [[rh, 0.055], [rh * 0.5, 0.028]]) b.add(cyl(r, r, L, 6, true), { p: [rx, t2 + 0.3 + yy, -L / 2], r: [PI / 2, 0, 0], c: BRASS, surf: S_BRASS });
    for (let k = 0; k <= bays; k++) b.add(box(1.5, 0.9, 0.45), { p: [s * (X - 0.75), t2 - 0.45, -k * bay], c: WOOD, surf: S_WOOD });
    // props standing at the bay boundaries, level with the table rows
    for (let k = 1; k < bays; k++) {
      await pause();
      if (o.skipProp && o.skipProp(k, s)) continue;
      const z = -k * bay, x = s * 5.25, r = rng();
      if (r < 0.3) addBust(b, x, z, s > 0 ? -PI / 2 : PI / 2, S, CREAM);
      else if (r < 0.52) addCatalogue(b, x, z, PI / 2, S);
      else if (r < 0.74) addFloorBooks(b, rng, x - s * 0.3, z, S);
      else if (r < 0.86) { addBust(b, x, z - 0.9, s > 0 ? -PI / 2 : PI / 2, S * 0.85, CREAM); addFloorBooks(b, rng, x, z + 0.8, S); }
    }
    // open atlases on some tables
    await pause();
    for (let k = 0; k < bays; k++) if (rng.chance(o.atlasChance ?? 0.42)) {
      const p = [s * 4.95 + rng.range(-0.1, 0.1), 0.78 * S, -(k + 0.5) * bay + 2.3], ry = rng.range(-0.25, 0.25), as = S * 0.9;
      addAtlas(b, p[0], p[1], p[2], ry, as); atlases.push({ p, ry, s: as, ph: rng(), per: rng.range(4.5, 9) });
    }
  }
  {
    // vault ribs as chains of short bars (the kit's tube ribs cost ten times as much to build)
    const hs = sz.wallHeight, rise = sz.height - hs, N = 10, _q = new THREE.Quaternion(), _x = new V3(1, 0, 0), _d = new V3(), _mm = new THREE.Matrix4(), _sc = new V3(1, 1, 1), _c = new V3();
    const chain = (fn, th) => { let a = fn(-1); for (let i = 1; i <= N; i++) { const p = fn(-Math.cos(i / N * PI)); _d.set(p[0] - a[0], p[1] - a[1], p[2] - a[2]); const len = _d.length(); _q.setFromUnitVectors(_x, _d.multiplyScalar(1 / len));
      b.add(box(len + th * 0.5, th, th), { m: _mm.compose(_c.set((a[0] + p[0]) / 2, (a[1] + p[1]) / 2 - th * 0.3, (a[2] + p[2]) / 2), _q, _sc), c: '#b0935a', surf: S_STONE }); a = p; } };
    const hy = (q) => hs + rise * Math.sqrt(Math.max(0, 1 - q * q));
    await pause();
    for (let k = 0; k <= bays; k++) { if (k % 4 === 0) await pause(); chain((q) => [q * X, hy(q), -k * bay], 0.5); }
    for (let k = 0; k < bays; k++) { await pause(); const cz = -(k + 0.5) * bay;
      chain((q) => [q * X, hy(q), cz - q * bay / 2], 0.36); chain((q) => [q * X, hy(q), cz + q * bay / 2], 0.36);
      b.add(sph(0.6, 8, 6), { p: [0, sz.height - 0.3, cz], s: [1, 0.6, 1], c: BRASS, surf: S_BRASS }); }
  }
  if (o.bridgeAt != null) {
    // the mezzanine bridge: a brass-railed arch springing from the two walkways
    const zb = o.bridgeAt, xa = X - 1.5, y0 = t2 - 0.15, rise = o.bridgeRise ?? 5.1, n = 32, hw = 1.4;
    const ys = (x) => y0 + rise * Math.pow(Math.max(Math.cos(PI / 2 * x / xa), 0), 0.8);
    const railA = [[], []], railB = [[], []];
    for (let i = 0; i <= n; i++) {
      if (i % 8 === 0) await pause();
      const x = -xa + 2 * xa * i / n, y = ys(x);
      for (const [q, zz] of [[0, zb - hw + 0.1], [1, zb + hw - 0.1]]) {
        b.add(cyl(0.032, 0.032, 1.4, 5, true), { p: [x, y + 0.45 + 0.7, zz], c: BRASS, surf: S_BRASS });
        railA[q].push(new V3(x, y + 0.45 + 1.4, zz)); railB[q].push(new V3(x, y + 0.45 + 0.7, zz));
      }
      if (i === n) break;
      const x1 = -xa + 2 * xa * (i + 1) / n, y1 = ys(x1), len = Math.hypot(x1 - x, y1 - y), ang = Math.atan2(y1 - y, x1 - x), xm = (x + x1) / 2, ym = (y + y1) / 2;
      b.add(box(len + 0.06, 0.45, hw * 2), { p: [xm, ym + 0.225, zb], r: [0, 0, ang], c: OAK, surf: S_WOOD });
      // soffit: a coffer panel in every other segment, an oak rib at each joint, two brass beads running the length
      if (i % 2 === 0) b.add(box(len * 0.82, 0.07, hw * 1.05), { p: [xm, ym - 0.03, zb], r: [0, 0, ang], c: i % 4 === 0 ? '#8a6038' : '#3d2412', surf: S_WOODM });
      b.add(box(0.2, 0.34, hw * 2 + 0.1), { p: [x, y - 0.12, zb], r: [0, 0, ang], c: WOOD, surf: S_WOOD });
      for (const zz of [zb - hw * 0.66, zb + hw * 0.66]) b.add(box(len + 0.06, 0.08, 0.1), { p: [xm, ym - 0.04, zz], r: [0, 0, ang], c: BRASS, surf: S_BRASS });
      for (const zz of [zb - hw - 0.03, zb + hw + 0.03]) {
        b.add(box(len + 0.06, 0.78, 0.14), { p: [xm, ym + 0.2, zz], r: [0, 0, ang], c: WOOD, surf: S_WOOD });
        b.add(box(len + 0.06, 0.09, 0.18), { p: [xm, ym + 0.6, zz], r: [0, 0, ang], c: BRASS, surf: S_BRASS });
        b.add(box(len + 0.06, 0.07, 0.18), { p: [xm, ym - 0.16, zz], r: [0, 0, ang], c: BRASS, surf: S_BRASS });
      }
    }
    await pause();
    for (const q of [0, 1]) {
      b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railA[q]), 44, 0.06, 6, false), { c: BRASS, surf: S_BRASS });
      b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railB[q]), 44, 0.03, 5, false), { c: BRASS, surf: S_BRASS });
    }
    for (const fx2 of [-0.5, 0.5]) for (const zz of [zb - hw + 0.1, zb + hw - 0.1]) {         // lamp standards at the quarter points
      const x = fx2 * xa, y = ys(x) + 0.45;
      b.add(cyl(0.05, 0.08, 2.5, 6, true), { p: [x, y + 1.25, zz], c: BRASS, surf: S_BRASS });
      b.add(sph(0.3, 12, 8), { p: [x, y + 2.75, zz], c: '#ffd9a0', surf: INT.surf(0, 0.5, 0, 6) });
      b.add(cyl(0.16, 0.05, 0.14, 8), { p: [x, y + 2.47, zz], c: BRASS, surf: S_BRASS });
      lanterns.push(new V3(x, y + 2.75, zz));
    }
    b.add(sph(0.5, 12, 8), { p: [0, ys(0) - 0.25, zb], s: [1, 0.6, 1], c: BRASS, surf: S_BRASS });
    for (const s of [-1, 1]) for (const zz of [zb - hw * 0.8, zb + hw * 0.8]) {                 // raking struts at the springings
      const ax = s * (X - 0.35), ay = y0 - 2.7, bx = s * (xa - 2.6), by = ys(xa - 2.6) + 0.05, len = Math.hypot(bx - ax, by - ay);
      b.add(box(len, 0.3, 0.26), { p: [(ax + bx) / 2, (ay + by) / 2, zz], r: [0, 0, Math.atan2(by - ay, bx - ax)], c: WOOD, surf: S_WOOD });
      b.add(sph(0.24, 8, 6), { p: [ax - s * 0.1, ay, zz], c: BRASS, surf: S_BRASS });
    }
  }
  let clock = null;
  if (o.doorcase) {
    // the great doorway: stone voussoirs round the arch, oak pilasters and entablature, and in the lunette above a
    // softly glowing clock in a gilt sunburst
    await pause();
    const w = room.exit.width, h = room.exit.height, hw = w / 2, y0 = h - hw, z0 = -L, sg = 18, rv = hw + 0.4, stones = [CREAM, '#b9aa88'];
    for (const s of [-1, 1]) {
      const nj = Math.round(y0 / 1.5);
      for (let j = 0; j < nj; j++) b.add(box(0.8, y0 / nj - 0.05, 0.55), { p: [s * rv, (j + 0.5) * y0 / nj, z0 + 0.25], c: stones[j % 2], surf: S_STONE });
      b.add(box(1.4, 15.3, 0.75), { p: [s * (hw + 1.75), 7.65, z0 + 0.35], c: WOOD, surf: S_WOOD, grad: [0, 4, 0.75, 1] });
      b.add(box(1.75, 1.0, 1.0), { p: [s * (hw + 1.75), 0.5, z0 + 0.45], c: OAK, surf: S_WOOD });
      b.add(box(1.7, 0.5, 0.95), { p: [s * (hw + 1.75), 15.05, z0 + 0.45], c: BRASS, surf: S_BRASS });
      for (const dx of [-0.35, 0, 0.35]) b.add(box(0.12, 12.6, 0.1), { p: [s * (hw + 1.75) + dx, 8.2, z0 + 0.74], c: '#2c190c', surf: S_WOODM });
      b.add(cyl(0.8, 0.8, 0.14, 20), { p: [s * (hw - 0.15), 14.25, z0 + 0.12], r: [PI / 2, 0, 0], c: BRASS, surf: S_BRASS });
      b.add(sph(0.42, 10, 8), { p: [s * (hw - 0.15), 14.25, z0 + 0.2], s: [1, 1, 0.5], c: o.accent || BLUE, surf: S_ENAMEL });
      // oeil-de-boeuf medallions either side of the clock
      const mr = new THREE.TorusGeometry(1.15, 0.14, 6, 28);
      b.add(mr, { p: [s * 6.7, 19.4, z0 + 0.14], c: BRASS, surf: S_BRASS });
      b.add(cyl(1.1, 1.1, 0.08, 24), { p: [s * 6.7, 19.4, z0 + 0.06], r: [PI / 2, 0, 0], c: o.accent || BLUE, surf: S_ENAMEL });
      b.add(sph(0.3, 8, 6), { p: [s * 6.7, 19.4, z0 + 0.14], s: [1, 1, 0.5], c: BRASS, surf: S_BRASS });
    }
    await pause();
    for (let i = 0; i < sg; i++) {
      const am = (i + 0.5) / sg * PI, l = PI * (rv + 0.4) / sg;
      b.add(box(l + 0.02, 0.8, 0.55), { p: [Math.cos(am) * rv, y0 + Math.sin(am) * rv, z0 + 0.25], r: [0, 0, am + PI / 2], c: stones[(i + (sg >> 1)) % 2], surf: S_STONE });
    }
    b.add(box(1.25, 1.9, 0.85), { p: [0, h + 0.5, z0 + 0.4], c: BRASS, surf: S_BRASS });
    b.add(box(2 * (hw + 2.75), 1.05, 0.95), { p: [0, 15.85, z0 + 0.45], c: WOOD, surf: S_WOOD });
    b.add(box(2 * (hw + 2.75) + 0.5, 0.3, 1.25), { p: [0, 16.5, z0 + 0.6], c: OAK, surf: S_WOOD });
    b.add(box(2 * (hw + 2.75) - 0.5, 0.12, 0.1), { p: [0, 15.75, z0 + 0.95], c: BRASS, surf: S_BRASS });
    await pause();
    const cy = 20.9, cr = 3.1, hs2 = sz.wallHeight, rise2 = sz.height - hs2, inside = (x, y) => y > hs2 + 0.5 && Math.abs(x) < X && y < hs2 + rise2 * Math.sqrt(1 - x * x / (X * X)) - 0.7;
    b.add(cyl(cr, cr, 0.2, 48), { p: [0, cy, z0 + 0.2], r: [PI / 2, 0, 0], c: '#f3d9a0', surf: INT.surf(0, 0.45, 0, 1.25) });
    b.add(new THREE.TorusGeometry(cr + 0.12, 0.24, 8, 48), { p: [0, cy, z0 + 0.28], c: BRASS, surf: S_BRASS });
    b.add(new THREE.TorusGeometry(cr * 0.62, 0.05, 5, 40), { p: [0, cy, z0 + 0.32], c: '#3a2414', surf: S_WOODM });
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0, r = cr * (big ? 0.84 : 0.9);
      b.add(box(big ? 0.13 : 0.05, big ? 0.62 : 0.22, 0.05), { p: [Math.sin(a) * r, cy + Math.cos(a) * r, z0 + 0.32], r: [0, 0, -a], c: '#2a1a0e', surf: S_WOODM }); }
    await pause();
    for (let i = 0; i < 32; i++) {                                                          // sunburst
      const a = (i + 0.5) / 32 * TAU, r0 = cr + 0.6; let len = i % 2 ? 1.5 : 2.9;
      while (len > 0.5 && !inside(Math.sin(a) * (r0 + len), cy + Math.cos(a) * (r0 + len))) len -= 0.3;
      if (len <= 0.5) continue;
      const g = new THREE.CylinderGeometry(0.02, i % 2 ? 0.11 : 0.17, len, 4, 1); g.translate(0, len / 2 + r0, 0);
      b.add(g, { p: [0, cy, z0 + 0.12], r: [0, 0, -a], s: [1, 1, 0.4], c: BRASS, surf: S_BRASS });
    }
    await pause();
    const hand = (wd, len, tail, c, zf) => { const hb = INT.makeBuilder(), g = box(wd, len + tail, 0.05); g.translate(0, (len - tail) / 2, 0); hb.add(g, { c, surf: S_WOODM });
      if (wd > 0.1) { const tip = new THREE.CylinderGeometry(0.001, wd * 1.3, wd * 4, 4, 1); tip.translate(0, len, 0); hb.add(tip, { s: [1, 1, 0.3], c, surf: S_WOODM }); }
      hb.add(cyl(wd * 1.4, wd * 1.4, 0.06, 12), { r: [PI / 2, 0, 0], c: BRASS, surf: S_BRASS });
      const m = new THREE.Mesh(hb.build(), room.materials.prop); m.position.set(0, cy, z0 + zf); m.name = 'clock-hand'; room.object.add(m); return m; };
    clock = { hour: hand(0.26, cr * 0.5, 0.3, '#1c120a', 0.36), minute: hand(0.17, cr * 0.8, 0.45, '#1c120a', 0.42), second: hand(0.06, cr * 0.86, 0.7, RED, 0.48), h0: o.hour ?? 4.6 };
  }
  if (o.ivyBay != null) {
    // ivy that has crept in around one sunny window and spills down the shelves
    const zc = -(o.ivyBay + 0.5) * bay, side = room.sunSide, wx = side * X, greens = ['#2a5420', '#356224', '#4a742a', '#22461c', '#587a2e'];
    const leaf = (y, z, d) => { const sc = rng.range(0.2, 0.42); b.add(new THREE.PlaneGeometry(sc, sc * 1.25), { p: [wx - side * (0.1 + d), y, z], r: [rng.range(-0.6, 0.6), -side * PI / 2 + rng.range(-0.6, 0.6), rng.range(0, TAU)], c: rng.pick(greens), surf: S_LEAF }); };
    for (let st = 0; st < 34; st++) {
      if (st % 8 === 0) await pause();
      const jamb = st % 3 === 0; let z = jamb ? zc + rng.sign() * rng.range(2.9, 3.4) : zc + rng.range(-3.6, 3.6), y = jamb ? rng.range(18, 23) : 17.5 + rng.range(-0.2, 0.5);
      const steps = rng.int(8, jamb ? 14 : 22);
      for (let i = 0; i < steps; i++) { leaf(y, z, rng.range(0, 0.35) + (y < 15.5 ? 0.5 : 0)); if (rng.chance(0.5)) leaf(y + rng.range(-0.2, 0.2), z + rng.range(-0.25, 0.25), rng.range(0, 0.3) + (y < 15.5 ? 0.5 : 0)); y -= rng.range(0.15, 0.42); z += rng.range(-0.3, 0.3); }
    }
  }
  await pause();
  const mesh = new THREE.Mesh(b.build(), room.materials.prop); mesh.name = 'library-extras'; room.object.add(mesh);
  await pause();
  // the turning leaves of the atlases: one instanced, two-sided sheet hinged on the spine
  let pages = null;
  if (atlases.length) {
    const pb = INT.makeBuilder(), w = 0.66, d = 0.9;
    for (const f of [1, -1]) { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-f * PI / 2); g.translate(w / 2, 0, 0); pb.add(g, { c: '#efe6cc', surf: S_PAPER }); }
    pages = new THREE.InstancedMesh(pb.build(), room.materials.prop, atlases.length); pages.name = 'atlas-pages'; pages.frustumCulled = false;
    pages.instanceMatrix.setUsage(THREE.DynamicDrawUsage); room.object.add(pages);
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new V3(), _s = new V3();
  return { mesh, pages, atlases, lanterns, triangles: b.triangles + atlases.length * 4,
    update(time) {
      if (clock) {                                                                           // the minute hand creeps, the second hand ticks
        const sec = Math.floor(time), fr = time - sec, tick = sec + smoothstep(0, 0.14, fr) + 0.25 * Math.sin(fr * 40) * Math.exp(-fr * 14) * (fr > 0.14 ? 1 : 0), min = clock.h0 * 60 + time * 0.5;
        clock.second.rotation.z = -tick / 60 * TAU; clock.minute.rotation.z = -min / 60 * TAU; clock.hour.rotation.z = -min / 720 * TAU;
      }
      if (!pages) return;
      for (let i = 0; i < atlases.length; i++) {
        const a = atlases[i], f = (time / a.per + a.ph) % 1, k = smoothstep(0.0, 0.34, f), lift = Math.sin(PI * k);
        const th = lerp(0.07, PI - 0.07, k) + 0.07 * lift * Math.sin(time * 6.3 + a.ph * 40) + 0.05 * (1 - lift) * Math.max(0, Math.sin(time * 1.7 + a.ph * 9)) * (f > 0.34 ? -1 : 1);
        _e.set(0, a.ry, th, 'YXZ'); _q.setFromEuler(_e); _p.set(a.p[0], a.p[1] + 0.092 * a.s, a.p[2]); _s.set(a.s, a.s, a.s);
        pages.setMatrixAt(i, _m.compose(_p, _q, _s));
      }
      pages.instanceMatrix.needsUpdate = true;
    } };
}

// a rolling ladder on the gallery rail of the shadow side; slides along the shelves and coasts to a stop as the camera nears
function makeLadder(room, rng) {
  const b = INT.makeBuilder(), X = room.size.width / 2, s = -room.sunSide, t1 = room.features.tiers.t1, lean = 1.9, top = t1 * 0.94, len = Math.hypot(top, lean), tilt = Math.atan2(lean, top);
  const m = new THREE.Matrix4().makeTranslation(s * (X - 0.5 - lean), 0, 0).multiply(new THREE.Matrix4().makeRotationZ(-s * tilt));
  for (const dz of [-0.38, 0.38]) b.add(box(0.08, len, 0.1), { p: [0, len / 2, dz], pre: m, c: '#8a5a30', surf: S_WOOD });
  for (let q = 1; q < 15; q++) b.add(cyl(0.028, 0.028, 0.76, 5, true), { p: [0, q * len / 15, 0], r: [PI / 2, 0, 0], pre: m, c: '#9a6a3a', surf: S_WOOD });
  for (const dz of [-0.38, 0.38]) { b.add(cyl(0.11, 0.11, 0.06, 10), { p: [s * (X - 0.5 - lean), 0.11, dz], r: [PI / 2, 0, 0], c: BRASS, surf: S_BRASS }); b.add(cyl(0.07, 0.07, 0.2, 8), { p: [s * (X - 0.62), top + 0.05, dz], r: [0, 0, PI / 2], c: BRASS, surf: S_BRASS }); }
  const mesh = new THREE.Mesh(b.build(), room.materials.prop); mesh.name = 'rolling-ladder'; room.object.add(mesh);
  return { mesh, triangles: b.triangles };
}

const PALETTE = ['#f3d9a0', '#d6c9ab', '#7d5231', '#4a2c18', '#1f3a5a', '#6b1f1f', '#ffc45a'];
// the hour of the afternoon: elevation of the sun, its colour, the sky seen through the glass, the haze
const MOODS = [
  // a clear blue afternoon: high white sun, cool skylight in the shadows, chandeliers unlit
  { name: 'afternoon', el: [56, 59], sun: '#fff0dc', sunI: 20.5, sky: '#cfdcf4', skyI: 8.6, amb: 2.5, ambSky: '#666f84', ambGround: '#e4c8a4', rotSky: '#c0c6d0', rotGround: '#a8845c', fog: '#4a4232', fogFar: 640, lamp: 0.8, exposure: 0.98,
    shaft: 0.14, frost: 0.2, outdoor: { zenith: '#6d9ade', horizon: '#f2eede', ground: '#4f7436', cloud: '#fffaf0' }, beam: '#f4f2ea', fill: '#b4c4e4', tint: '#fbf6ee', shadowTint: '#060a12', chandeliers: false, paneK: 1.15 },
  { name: 'golden', el: [53, 56], sun: '#ffd08a', sunI: 23, sky: '#f0dcc0', skyI: 8, amb: 2.4, ambSky: '#716a5e', ambGround: '#ecc08c', rotSky: '#c2b6a4', rotGround: '#a07448', fog: '#553a1a', fogFar: 540, lamp: 1.0, exposure: 1.0,
    shaft: 0.135, frost: 0.3, outdoor: { zenith: '#a9b8d0', horizon: '#ffdf9e', ground: '#5a6a34', cloud: '#fff0cc' }, beam: '#ffe6b8', fill: '#ffc888', tint: '#fff3e0', shadowTint: '#140a04', chandeliers: true, paneK: 1.2 },
  { name: 'late', el: [51, 54], sun: '#ffa652', sunI: 25, sky: '#e8c0a4', skyI: 7.4, amb: 2.4, ambSky: '#685e62', ambGround: '#e6ac78', rotSky: '#b4a49c', rotGround: '#94623c', fog: '#4c2813', fogFar: 480, lamp: 1.3, exposure: 1.05,
    shaft: 0.15, frost: 0.36, outdoor: { zenith: '#8e8cba', horizon: '#ffb066', ground: '#4a5230', cloud: '#ffc890' }, beam: '#ffd8a8', fill: '#ffb070', tint: '#ffeeda', shadowTint: '#180806', chandeliers: true, paneK: 1.25 },
];
const BINDINGS = [
  { wallA: '#b03a2e', wallB: '#34608f', wainscot: '#4d7a44', wallD: '#e0b85e', rug: ['#7a1a1c', '#141c36', '#d9c9a0', '#b0782c'], coffer: '#1f3a5a', accent: '#1f3a5a', shade: '#1c7a48' },
  { wallA: '#2f7a5e', wallB: '#96402a', wainscot: '#8a6c22', wallD: '#d8c090', rug: ['#14463a', '#4a1a14', '#e0d0a4', '#c08a2c'], coffer: '#14463c', accent: '#1c5a48', shade: '#b0382c' },
  { wallA: '#34608f', wallB: '#a8382f', wainscot: '#8f6b38', wallD: '#e2c485', rug: ['#18305a', '#5a1616', '#e0d2ac', '#b0782c'], coffer: '#6b1f1f', accent: '#6b1f1f', shade: '#1c7a48' },
  { wallA: '#c08a34', wallB: '#5a2a5e', wainscot: '#2f5a6a', wallD: '#e8dcc0', rug: ['#3a1a48', '#0e2a34', '#e4d8b4', '#c89a3a'], coffer: '#3a2452', accent: '#4a2a66', shade: '#28608a' },
];

export default {
  id: 'long-library', name: 'The Long Library', category: 'interior', weirdness: 0.18,
  async build(ctx) {
    const { rng } = ctx;
    const scene = new THREE.Scene();
    // ---------------- what this visit is like
    const mood = { ...rng.pick(MOODS) }, bind = rng.pick(BINDINGS);
    // the sun stands over one long wall or the other; its beams cross the axis and land on the far table row
    const el = rng.range(mood.el[0], mood.el[1]), ahead = rng.range(0.27, 0.33), hazy = rng.chance(0.4), side = rng.chance(0.62) ? -1 : 1;
    if (hazy) { mood.shaft *= 1.12; mood.fogFar *= 0.82; mood.frost = Math.min(0.6, mood.frost + 0.12); }
    const dapple = { amount: 0.5, size: rng.range(1.9, 2.6), speed: rng.range(1.5, 2.1) };   // tree and cloud shade stirring in the sunlight
    const fogC = new THREE.Color(mood.fog);
    scene.background = fogC.clone().multiplyScalar(0.5); scene.fog = new THREE.Fog(fogC, 24, mood.fogFar);
    const roomOpts = {
      style: 'library', ceiling: { ribs: false }, floor: rng.chance(0.5) ? 'parquet' : 'chevron', skyColor: mood.sky,
      sun: { side, elevation: el, ahead, color: mood.sun, intensity: mood.sunI },
      light: { ambient: mood.amb, sky: mood.skyI, ambientSky: mood.ambSky, ambientGround: mood.ambGround, dapple },
      palette: { wallA: bind.wallA, wallB: bind.wallB, wainscot: bind.wainscot, wallD: bind.wallD, ceiling: '#6a6048', rib: '#9a7e48', reveal: '#6e5236' },
    };
    const wlOpts = { paneGain: 1.75 / mood.skyI, outdoor: mood.outdoor, frost: mood.frost, scroll: 0.08, shaftGain: mood.shaft, shaftDensity: hazy ? 0.11 : 0.09, motesPerWindow: 300, moteSize: 0.029, moteGain: 1.9, moteDrift: 0.75 };

    // ---------------- the long hall (21 bays, 236 m) and the exit gallery (8 bays, 85 m)
    const hall = await INT.makeRoomAsync({ ...roomOpts, rng: rng.fork('hall'), bays: 21, entry: 'open', exit: { w: DOOR.w / S, h: DOOR.h / S, arch: 1 }, windowLight: { ...wlOpts, maxMotes: 5200 } }, ctx.yield);
    const HL = hall.size.length, HZ = RA + 1.2 + HL, bay = hall.size.bay;
    hall.object.position.z = HZ; scene.add(hall.object);
    await ctx.yield();
    const gal = await INT.makeRoomAsync({ ...roomOpts, rng: rng.fork('gallery'), bays: 8, length: 85 / S, entry: { w: DOOR.w / S, h: DOOR.h / S, arch: 1 }, exit: { w: 10 / S, h: 14 / S, arch: 1 }, windowLight: { ...wlOpts, shaftGain: mood.shaft * 0.78, maxMotes: 2400 } }, ctx.yield);
    const GZ = -(RA + 1.2), GL = gal.size.length;
    gal.object.position.z = GZ; scene.add(gal.object);
    for (const r of [hall, gal]) { r.materials.prop.userData.uniforms.uSway.value.set(0.2, 0, 0.09, 0.8); r.rig.state.bounce = 3.5; r.rig.refresh(); }   // a draught: pendants, leaves
    // outermost surfaces last, so the depth test rejects what shelves, rails and furniture already cover
    const drawLast = (g) => g.traverse((m) => { if (m.isMesh && /walls$/.test(m.name)) m.renderOrder = 1; else if (m.isMesh && /floor$/.test(m.name)) m.renderOrder = 2; });
    drawLast(hall.object); drawLast(gal.object);
    await ctx.yield();

    // ---------------- the route
    const exitY = gal.exit.position.y, exitZ = GZ - GL;
    const pts = [[0, 6, HZ - 1], [0.6, 6, HZ - 17.5], [0, 6, 221], [-0.7, 6.2, 188], [0, 7.4, 160], [0, 10.8, 132], [0, 14, 104], [0, 14, 64], [0.5, 13, 46], [4, 12, 30]];
    for (let k = 0; k <= 6; k++) { const a = lerp(PI / 6, PI * 5 / 6, k / 6); pts.push([Math.sin(a) * 18, 11, Math.cos(a) * 18]); }
    pts.push([4, 10.7, -30], [0.5, 9.3, -44], [0, 7.7, -58], [0, exitY + 0.02, -72], [0, exitY, -95], [0, exitY, exitZ]);
    const path = makePath(pts);
    const uMid = path.nearestXZ(18, 0).u;

    // ---------------- furniture
    await ctx.yield();
    const bridgeBay = rng.pick([13, 15, 16]), flameGain = mood.chandeliers ? 1 : 0;
    const hallFur = await furnish(hall, rng.fork('hall-fur'), {
      skipTable: (k) => k === 0, lampGlow: mood.lamp, rugColors: bind.rug, shade: bind.shade, sunSide: side, farFrom: 8, pairsTo: 6, stairsTo: 8, flameGain,
      chandelier: (k) => (k % 3 !== 1 ? null : k < 8 ? { tiers: 2, drop: 2.2, scale: 2.6, arms: 10 } : { tiers: 1, drop: 0.7, scale: 2.0, arms: 8 }),
    }, ctx.yield);
    await ctx.yield();
    const galFur = await furnish(gal, rng.fork('gal-fur'), { lights: true, lampI: 5 * mood.lamp, lampGlow: mood.lamp, rugColors: bind.rug, shade: bind.shade, sunSide: side, stairAt: 2, flameGain, chandelier: (k) => (k === 1 || k === 4 ? { tiers: 2, drop: 2.0, scale: 2.5, arms: 10 } : null) }, ctx.yield);
    await ctx.yield();
    const hallX = await roomExtras(hall, rng.fork('hall-x'), { bridgeAt: -bridgeBay * bay, skipProp: (k) => k === 1 || k === bridgeBay, ivyBay: rng.int(2, 6) }, ctx.yield);
    await ctx.yield();
    const galX = await roomExtras(gal, rng.fork('gal-x'), { skipProp: (k) => k >= 7, atlasChance: 0.5, doorcase: true, accent: bind.accent, hour: rng.range(3.2, 5.8) }, ctx.yield);
    await ctx.yield();
    const ladder = makeLadder(hall, rng), ladderBay = rng.int(3, 5), ladderZ = -(ladderBay + 0.28) * bay, ladderRun = bay * 0.46;
    await ctx.yield();
    // three soft wash lights travel with the camera down the middle of the hall, nearer the dark sun-side wall, so the
    // shelves on both sides stay legible in lamp-coloured light; one more hangs in the exit gallery
    const lampsR = hallFur.lamps.R;
    const washSlots = [0, 1, 2].map(() => hall.rig.addLight({ position: [side * 1.5, 11, -60], color: mood.fill, intensity: 0, range: 44, flicker: 0.05 }));
    gal.rig.addLight({ position: [side * 1.5, 11, -GL * 0.5], color: mood.fill, intensity: 6.5 * mood.lamp, range: 60, flicker: 0.05 });
    const chandPos = (fur) => fur.furniture.items.filter((it) => it.kind === 'chandelier').map((it) => new V3(it.position[0] + it.userData.light[0], it.position[1] + it.userData.light[1], it.position[2] + it.userData.light[2]));
    const chandSlots = [0, 1].map(() => hall.rig.addLight({ position: [0, -60, 0], color: '#ffb46a', intensity: 0, range: 26, flicker: 0.3 }));
    const chandK = mood.chandeliers ? 1 : 0.3;                                 // unlit in the clear afternoon: only a little skylight off the brass
    const galChands = chandPos(galFur).map((p) => gal.rig.addLight({ position: p, color: '#ffb46a', intensity: 20 * mood.lamp, range: 26, flicker: 0.3 }));
    const chands = chandPos(hallFur), gutter = (i, t) => 1 + 0.42 * Math.sin(t * 1.31 + i * 2.4) * Math.sin(t * 0.43 + i * 1.3 + 1);
    const chandStep = chands.length > 1 ? (chands[0].z - chands[chands.length - 1].z) / (chands.length - 1) : 1;

    // ---------------- rotunda and orrery
    const rot = await buildRotunda({ rng: rng.fork('rotunda'), mood, sunDir: hall.rig.state.sunDir.clone(), shaftGain: mood.shaft * 1.02, shaftDensity: wlOpts.shaftDensity * 0.8, dapple,
      pal: { ...bind, reveal: '#cfc3a6', tileA: '#d6c9ab', tileB: rng.pick(['#7d5231', '#4a2c18', '#5c4a3a']) } }, ctx.yield);
    scene.add(rot.object);
    drawLast(rot.object);
    await ctx.yield();
    const hctx = Object.create(ctx); hctx.rng = rng.fork("orrery");
    // The balance beam is keyed to u: the mooned giant swings across the left of the frame as the camera comes in from
    // the hall, and the ringed giant rides the far side, above and beyond the glass sun, all the way round the arc,
    // closing until the camera leaves beneath it.
    const hero = await buildHero(hctx, { palette: PALETTE, passAt: uMid - 0.23, outerSweep: 8, sunIntensity: 6.6, speed: rng.range(0.9, 1.3) });
    scene.add(hero.object);
    hero.setLighting({ keyColor: mood.beam, keyIntensity: 1.7, windowColor: mood.sun, windowIntensity: 3.2, windowSide: side < 0 ? 1 : -1, beamRadius: 4.6 });
    await ctx.yield();

    // ---------------- air: lamp halos, the oculus beam, dust
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const toWorld = (room, list) => list.map((p) => new V3(p.x, p.y, p.z + room.object.position.z));
    const lampPts = [...toWorld(hall, hallFur.lamps.all), ...toWorld(gal, galFur.lamps.all)], lantPts = toWorld(hall, hallX.lanterns);
    set.add(fx.makeGlows({ rng: rng.fork('glow'), time, positions: [...lampPts, ...lantPts], sizes: [...lampPts.map(() => 1), ...lantPts.map(() => 2.3)], color: '#ffc880', size: 1.5,
      intensity: 1.1 * mood.lamp, flicker: 0.12, halo: 1, core: 0.8, fogAmount: 0.5 }));
    await ctx.yield();
    set.add(fx.makeGodRays({ rng: rng.fork('oculus'), time, position: [0, DRUM + DOME_H - 0.6, 0], direction: [0.02, -1, 0.01], radius: 3.3, count: 9, length: 47, width: [0.9, 2.4], color: mood.beam,
      intensity: hazy ? 0.3 : 0.22, falloff: 0.8, speed: 0.6 }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time, count: hazy ? 2200 : 1500, box: [30, 18, 46], colors: ['#ffdca8', '#ffc680', '#ffeccc'], intensity: 0.8, velocity: [0.3, 0.06, 0.15], turbulence: [0.6, 0.4, 0.35] }));
    await ctx.yield();

    // ---------------- doves under the dome, moths at two reading lamps
    const birdLight = { sunDir: [-0.15, 1, 0.1], sunColor: mood.beam, sunIntensity: 2.4, sky: mood.sky, skyIntensity: 0.9, ground: '#ffb060', groundIntensity: 1.0 };
    const nDoves = rng.int(3, 5), route = [], tiltPh = rng.range(0, TAU), dir = rng.sign();
    for (let k = 0; k < 12; k++) { const a = dir * k / 12 * TAU, r = 7.6 + 1.1 * Math.sin(2 * a + 1); route.push([Math.sin(a) * r, 16.3 + 2.6 * Math.sin(a + tiltPh), Math.cos(a) * r]); }
    const DOVE = { species: 'crows', form: 'loose', flap: 5.2, amp: 0.7, glide: 0.2, light: birdLight,
      palette: { fingers: 0, girth: 0.1, tail: 0.2, tailW: 0.17, body: '#f6f2ea', belly: '#ffffff', wingC: '#f0ebe0', tip: '#d2c8b8', trail: '#e8e2d6', head: '#f8f5ee', tailC: '#efeae0', beak: '#d89a78', legC: '#d08a78' } };
    const doves = F.makeFlock({ ...DOVE, rng: rng.fork('doves'), count: nDoves, size: 1.5, spread: [2.0, 0.9, 12], wander: [0.8, 0.5, 0.8, 0.4], speed: 6.5, route, closed: true });
    scene.add(doves.object);
    await ctx.yield();
    // a few more doves have strayed into the hall and fly ahead of the camera through the shafts
    const straySide = rng.sign();
    const hallLight = { ...birdLight, sunDir: hall.rig.state.sunDir.toArray(), sunColor: mood.sun, sunIntensity: 3, ground: '#a06a3a' };
    const strays = F.makeFlock({ ...DOVE, light: hallLight, rng: rng.fork('strays'), count: rng.int(3, 5), size: 1.55, spread: [3.2, 2, 8], wander: [1.2, 1.0, 1.4, 0.5], speed: 9,
      along: { path, side: straySide * 3.7, up: 3.4, lead: 27, from: 0.02, to: 0.5, drift: 3 } });
    await ctx.yield();
    // a second, smaller party keeps to the other side further up the hall
    const strays2 = F.makeFlock({ ...DOVE, light: hallLight, rng: rng.fork('strays2'), count: rng.int(2, 4), size: 1.5, spread: [3, 2.4, 9], wander: [1.2, 1.2, 1.6, 0.4], speed: 9,
      along: { path, side: -straySide * 4.2, up: 5.4, lead: 40, from: 0.12, to: 0.52, drift: 4 } });
    scene.add(strays2.object);
    await ctx.yield();
    // and a pair leaves through the great doorway just ahead of the camera
    const leavers = F.makeFlock({ ...DOVE, light: hallLight, rng: rng.fork('leavers'), count: rng.int(2, 3), size: 1.5, spread: [2.4, 1.4, 6], wander: [1.0, 0.8, 1.2, 0.5], speed: 9,
      along: { path, side: rng.sign() * 2.6, up: 2.6, lead: 25, from: 0.76, to: 1.08, drift: 1.5 } });
    scene.add(leavers.object);
    scene.add(strays.object);
    await ctx.yield();
    // passing clouds dim and brighten the sun: pools, shafts and motes breathe together
    const sunRigs = [hall.rig, gal.rig, rot.rig].map((rig) => ({ rig, base: rig.state.sunIntensity })), cl1 = rng.range(0, TAU), cl2 = rng.range(0, TAU);
    const gl = galFur.lamps.R, mothLamps = [lampsR[rng.int(2, 4)], lampsR[rng.int(6, 9)]].filter(Boolean).map((p) => [p.x, p.y + 0.5, p.z + HZ]);
    for (const p of [gl[gl.length - 1], gl[gl.length - 3]]) if (p) mothLamps.push([p.x, p.y + 0.5, p.z + GZ]);
    const moths = F.makeMoths({ rng: rng.fork('moths'), positions: mothLamps, jitter: 0.8, count: rng.int(44, 64), size: 2.4, roam: [1.6, 1.0, 1.5, 0.1],
      light: { sunDir: [0, 1, 0], sunColor: '#ffc27a', sunIntensity: 2.2, sky: '#c8a070', skyIntensity: 1.2, ground: '#ffb060', groundIntensity: 1.2 } });
    scene.add(moths.object);
    await ctx.yield();

    const _cp = new V3(), washI = 7.5 * mood.lamp;
    // slot j of a set carries every (slots.length)-th item of a list; only the two nearest the moving index c are lit
    const follow = (slots, list, c, I, t, flick) => {
      const n = slots.length;
      for (let j = 0; j < n; j++) {
        const L = slots[j]; if (!L) continue;
        const i = j + n * Math.round((c - j) / n), q = list[i];
        if (!q) { L.intensity = 0; continue; }
        L.position.copy(q); L.intensity = I * (flick ? flick(i, t) : 1) * (1 - smoothstep(0.55, 1.0, Math.abs(i - c)));
      }
    };
    const chandI = (i) => (chands[i] && chands[i].y > 18 ? 10 : 24);
    const chandFlick = (i, t) => chandI(i) / 24 * gutter(i, t);
    let cloudSet = -1;
    const sunPoi = hero.anchors.sun.clone();
    return {
      scene, path, duration: 46,
      title: mood.name === 'late' ? 'The Long Library, Closing Hour' : 'The Long Library',
      camera: { fov: 62, near: 0.3, far: 900, lookAhead: 18, sway: 0.6, bank: 0.45 },
      pois: [{ at: sunPoi, from: uMid - 0.19, to: uMid + 0.09, weight: 0.72, fade: 0.32 }],
      portal: { shape: 'arch', width: gal.exit.portal.width, height: gal.exit.portal.height, color: '#ffe2b0', glow: 1, revealDistance: 320 },
      post: { exposure: mood.exposure, bloom: { strength: 0.5, radius: 0.72, threshold: 0.95 },
        grade: { saturation: 1.06, contrast: 1.05, tint: mood.tint, shadowTint: mood.shadowTint, vignette: 0.36, grain: 0.03, aberration: 0 } },
      update(dt, t, camera, u = 0) {
        time.value = t;
        hall.update(dt, t, camera); gal.update(dt, t, camera); rot.update(dt, t, camera);
        hallFur.furniture.update(dt, t, camera); galFur.furniture.update(dt, t, camera);
        hallX.update(t); galX.update(t);
        hero.setProgress(u); hero.update(dt, t, camera);
        set.update(dt, t, camera);
        doves.update(dt, t, camera, u); moths.update(dt, t, camera, u);
        const inHall = u < 0.56; strays.object.visible = strays2.object.visible = inHall;
        if (inHall) { strays.update(dt, t, camera, u); strays2.update(dt, t, camera, u); }
        leavers.object.visible = u > 0.7; if (leavers.object.visible) leavers.update(dt, t, camera, u);
        // passing clouds dim and brighten the sun: pools, shafts and motes breathe together
        const cloud = 0.78 + 0.17 * Math.sin(t * 0.31 + cl1) + 0.09 * Math.sin(t * 0.83 + cl2);
        if (Math.abs(cloud - cloudSet) > 0.006) {
          cloudSet = cloud;
          for (let i = 0; i < sunRigs.length; i++) { const sr = sunRigs[i]; sr.rig.state.sunIntensity = sr.base * cloud; sr.rig.refresh(); }
          hero.setWindow(3.2 * cloud);
        }
        // the ladder coasts to a stop as the camera comes up the hall
        const k = clamp(u / 0.15, 0, 1), e = 1 - (1 - k) * (1 - k) * (1 - k);
        ladder.mesh.position.z = ladderZ - ladderRun * (1 - e);
        // reading-lamp and chandelier lights travel with the camera
        _cp.setFromMatrixPosition(camera.matrixWorld);
        for (let j = 0; j < 3; j++) { const L = washSlots[j]; if (!L) continue; const z = _cp.z - HZ - 7 - j * 27; L.position.z = clamp(z, -HL + 9, -7); L.intensity = washI * (1 - 0.6 * smoothstep(0, 16, Math.abs(z - L.position.z))); }
        follow(chandSlots, chands, chands.length ? (chands[0].z - (_cp.z - HZ)) / chandStep + 0.8 : 0, 24 * mood.lamp * chandK, t, chandFlick);
        for (let i = 0; i < galChands.length; i++) if (galChands[i]) galChands[i].intensity = 24 * mood.lamp * chandK * gutter(i + 9, t);
        rot.sunLamp.intensity = 15 * mood.lamp * (1 + 0.04 * Math.sin(t * 0.9));
      },
      dispose() { hero.dispose(); },
    };
  },
};
