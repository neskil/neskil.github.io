// WHERE THE PATTERN FALLS
// A shadowless country of gold leaf. A river of upright black, white and silver rectangles marches to a ruled brink,
// tips over and lands as discs, almonds, spirals and flowers that drift off as a meadow between two robed peaks.
// The hero (plateau, cliff, falls, pool, meadow, peaks, sky sheet) is src/parts/where-the-pattern-falls.js; this file
// flies it and adds the cast: pattern hills, scroll trees, the Clasp, curl-rollers, eye-birds, spiral fish, stemmed
// heads, leaf flakes and silver rain. Nothing is lit: every material is an unlit ShaderMaterial writing flat ink.
//
// Layout is canonical with the dark peak at +X; when the seed puts it at -X the whole flight is mirrored in x (sd).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/where-the-pattern-falls.js';

const TAU = Math.PI * 2;

// ---- gold wire (trees, Clasp, curl-rollers): one flat tooled ink, an umber hull with a pixel floor ----
// aRoll: xyz = the roller's centre (0 for fixed wire), w = its radius (0 = fixed); aRk: roll direction x, z, phase, rate.
const WIRE_VERT = /* glsl */`
  attribute vec4 aRoll; attribute vec4 aRk; attribute float aS;
  uniform vec3 uCamL; uniform float uViewH, uTanHalf, uHull, uTime;
  varying float vS; varying float vPx;
  void main(){
    vec3 P = position, N = normal;
    if (aRoll.w > .01) {
      float ang = 1.9 * sin(uTime * aRk.w + aRk.z) + .25 * sin(uTime * aRk.w * 2.3 + aRk.z * 1.7);
      float c = cos(ang), s = sin(ang);
      vec3 d = vec3(aRk.x, 0., aRk.y);
      // local x runs along the roll direction, local y is up; turning by ang carries the centre -R * ang along it
      vec2 q = vec2(c * P.x + s * P.y, -s * P.x + c * P.y), n2 = vec2(c * N.x + s * N.y, -s * N.x + c * N.y);
      vec3 side = vec3(-d.z, 0., d.x);
      P = aRoll.xyz + d * (q.x + aRoll.w * ang) + vec3(0., q.y, 0.) + side * P.z;
      N = d * n2.x + vec3(0., n2.y, 0.) + side * N.z;
    }
    float dP = max(length(P - uCamL), .5);
    float pxM = dP * 2. * uTanHalf / max(uViewH, 1.);
    P += normalize(N + vec3(0., 1e-5, 0.)) * max(.09, 1.6 * pxM) * uHull;
    vS = aS; vPx = pxM;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(P, 1.);
  }`;
const WIRE_FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uInk[14]; uniform float uHull; uniform vec3 uWireA, uWireB, uWireC;
  varying float vS; varying float vPx;
  void main(){
    if (uHull > .5) { gl_FragColor = vec4(uInk[9], 1.); return; }
    // tooling along the wire: long gold runs, a pale collar and a dark tick, all flat; plain gold once it is too small to read
    float s = fract(vS * .5), k = smoothstep(.02, .06, .5 / max(vPx, 1e-4) * .01);
    vec3 col = uWireA;
    col = mix(col, uWireB, step(.62, s) * step(s, .9) * k);
    col = mix(col, uWireC, step(.92, s) * k);
    gl_FragColor = vec4(col, 1.);
  }`;

// sweep a tube along points (parallel-transport frames); rad(t) in metres; pushes into G { pos, nor, s, roll, rk, idx }
function sweep(G, pts, rad, roll, rk, seg = 6) {
  const n = pts.length, base = G.pos.length / 3;
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), prevT = new THREE.Vector3(), q = new THREE.Quaternion(), v = new THREE.Vector3();
  let s = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.subVectors(b, a); if (T.lengthSq() < 1e-10) T.set(0, 1, 0); T.normalize();
    if (i === 0) { N.set(0, 0, 1); if (Math.abs(T.z) > 0.9) N.set(1, 0, 0); N.addScaledVector(T, -N.dot(T)).normalize(); }
    else { q.setFromUnitVectors(prevT, T); N.applyQuaternion(q); N.addScaledVector(T, -N.dot(T)).normalize(); s += pts[i].distanceTo(pts[i - 1]); }
    B.crossVectors(T, N); prevT.copy(T);
    const r = rad(i / (n - 1));
    for (let j = 0; j <= seg; j++) {
      const a2 = (j / seg) * TAU, c = Math.cos(a2), sn = Math.sin(a2);
      v.copy(N).multiplyScalar(c).addScaledVector(B, sn);
      G.pos.push(pts[i].x + v.x * r, pts[i].y + v.y * r, pts[i].z + v.z * r); G.nor.push(v.x, v.y, v.z); G.s.push(s);
      G.roll.push(roll[0], roll[1], roll[2], roll[3]); G.rk.push(rk[0], rk[1], rk[2], rk[3]);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const a = base + i * (seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1;
    G.idx.push(a, b, c, b, d, c);
  }
}
// a volute: a spiral of `turns` turns from radius r0 inwards, in the plane (ex, ey) round centre c, starting at angle a0
function volute(c, ex, ey, r0, turns, a0, dir = 1, steps = 44) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = a0 + dir * t * turns * TAU, r = r0 * Math.pow(1 - t, 0.85) * 0.94 + r0 * 0.06;
    out.push(new THREE.Vector3().copy(c).addScaledVector(ex, Math.cos(a) * r).addScaledVector(ey, Math.sin(a) * r));
  }
  return out;
}
const rampL = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  id: 'where-the-pattern-falls',
  name: 'Where the Pattern Falls',
  category: 'bizarre',
  after: 'Gustav Klimt, 1862 to 1918',
  media: ['air', 'open'],
  weirdness: 0.8,
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, detail = Math.min(1, Math.max(0.5, ctx.quality?.detail ?? 1));
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const wr = ctx.rng.fork ? ctx.rng.fork('pattern-world') : ctx.rng;      // the world's own stream, apart from the hero's
    // cast for this visit (drawn first, in a fixed order)
    const nFiles = Math.min(8, Math.max(3, Math.round((3 + wr() * 5) * density)));
    const nFish = Math.min(60, Math.max(20, Math.round((20 + wr() * 40) * density)));
    const nTrees = 4 + Math.floor(wr() * 3);              // river bank, the brink and two over the pool always; up to two more
    const hillSeed = wr();

    // ---- the hero: the whole country, the falls and the peaks. A night visit asks for the black lacquer panel. ----
    const heroOpts = { rare: !!vary.rare, detail };
    if (vary.hour === 'night') heroOpts.metal = 2; else if (vary.hour === 'dawn') heroOpts.metal = 1; else if (vary.hour === 'golden') heroOpts.metal = 0;
    const hero = await buildHero(ctx, heroOpts);
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, U = hero.uniforms, inkOf = hero.inkOf, inks = hero.inks;
    const dark = A.darkPeak, bright = A.brightPeak;
    const sd = Math.sign(dark.base.x) || 1;                // canonical layout has the dark robe at +X; mirror in x otherwise
    const V = (x, y, z) => new THREE.Vector3(x * sd, y, z);
    // the imaginary window stands abeam, on the side away from the last straight, so the blazing leaf is never behind the ring
    const lightFrom = A['window']; lightFrom.set(-0.879 * sd, 0.242, 0.41).normalize();

    // ---- the flight ----
    // River run (a file of eye-birds crosses close ahead) up to the scroll tree at the
    // brink (held whole); then one volute over the lower country: out over the brink looking down the valley (both robes,
    // the meadow between them, the ring, great hills beyond), a pan that passes the dark robe whole and goes on round at
    // one even rate while the cliff with its inlaid flanks slides in, to the falls met head on from 230 m between its two
    // flanks and held to the far corner, a string of large eyes flying with us as we come in; down from the far corner and along
    // the face 8 to 9 m from the falling tiles, past the pier, looking out over the lower country; then over the pool with
    // both robes in sight, past a cluster of curl-rollers through great flower heads, one look up the whole dark robe, and straight
    // through the gap to the ring. Far off stand eight great hills, each one bold flat pattern (see the hills block).
    const aEnd = 22 * Math.PI / 180, dirEnd = new THREE.Vector3(Math.cos(aEnd) * sd, 0, Math.sin(aEnd));
    // the last straight is the line that clears the whorl hem by 12 m and runs on into the dark robe; the ring stands 132 m before that robe's centre
    const hemT = new THREE.Vector3(bright.base.x + 128 * Math.sin(aEnd) * sd, 9.5, bright.base.z - 128 * Math.cos(aEnd));
    const offL = Math.abs((dark.base.x - hemT.x) * dirEnd.z - (dark.base.z - hemT.z) * dirEnd.x), tcL = (dark.base.x - hemT.x) * dirEnd.x + (dark.base.z - hemT.z) * dirEnd.z;
    const seat = hemT.clone().addScaledVector(dirEnd, tcL - Math.sqrt(Math.max(132 * 132 - offL * offL, 1)));
    const approach = seat.clone().addScaledVector(dirEnd, -120);
    const RING = 8.5;                                       // the portal's radius: the ring is 17 m across so that it reads from the pool
    const pts = [
      V(-23, 258, -276), V(-27, 258, -228), V(-40, 258, -180), V(-74, 258, -128), V(-118, 258, -75), V(-140, 257.5, -30),
      V(-140, 256, 22), V(-132, 254, 80), V(-108, 250, 156), V(-54, 243, 222), V(24, 232, 228), V(76, 222, 214), V(100, 208, 184), V(104, 194, 152),
      V(94, 180, 122), V(80, 166, 92), V(66, 152, 62), V(53, 139, 30), V(37, 125, 12.5), V(4, 100, 12), V(-28, 70, 12.5), V(-54, 46, 15), V(-76, 26, 27), V(-88, 14, 52),
      V(-103, 9.5, 95), V(-123, 8.5, 134), V(-133, 8, 168), V(-119, 8, 199), V(-80, 8.6, 221), approach, approach.clone().lerp(seat, 0.5), seat,
    ];
    const path = makePath(pts);
    const uOf = (i) => { let best = 0, bd = 1e9; const p = new THREE.Vector3(); for (let k = 0; k <= 400; k++) { path.pointAt(k / 400, p); const d = p.distanceToSquared(pts[i]); if (d < bd) { bd = d; best = k / 400; } } return best; };
    const uBrink = uOf(6), uOut = uOf(9), uTop = uOf(12), uPort = uOf(14), uFace = uOf(18), uFoot = uOf(23), uHem = uOf(27), uApp = uOf(29);
    const uR = 0.34, uF = 0.44;                             // where the tour's gaze has the dark robe whole, and where it reaches the falls
    await ctx.yield();

    const updaters = [];

    // ---- pattern hills: every hill one flat motif cut to its outline, ringing both countries out to 2.4 km ----
    const meadowMid = (z) => 46 * Math.sin((z - 330) * 0.0105) * smooth(330, 430, z);      // as in the hero's shaders
    const meadowHalf = (z) => (100 * (0.55 + 0.45 * smooth(-6, 42, z)) + 10 * smooth(70, 150, z) - 16 * smooth(170, 300, z) * (1 - smooth(300, 420, z)) + 60 * smooth(330, 520, z)) * (1 - 0.95 * smooth(470, 700, z));
    {
      const hr = wr.fork ? wr.fork('hills') : wr;
      const H = { pos: [], nor: [], cm: [], pat: [], idx: [] };
      const golds = [0, 1, 2, 13, 12], accents = [5, 6, 8, 4, 3];
      const addHill = (cx, cy, cz, R, Ht, m) => {
        const rx = R * (0.8 + hr() * 0.4), rz = R * (0.8 + hr() * 0.4), yaw = hr() * TAU, lean = (hr() - 0.5) * 0.5, pw = 0.55 + hr() * 0.5;
        const motif = Math.floor(hr() * 8), g = hr.shuffle ? hr.shuffle(golds.slice()) : golds, acc = hr() < 0.38 ? accents[Math.floor(hr() * accents.length)] : g[2];
        const set = hr() < 0.5 ? [g[0], g[1], acc] : [g[0], acc, g[1]];
        const base = H.pos.length / 3, SEG = 22, RINGS = 9, cy0 = Math.cos(yaw), sy0 = Math.sin(yaw);
        for (let j = 0; j <= RINGS; j++) {
          const t = j / RINGS, y = Ht * Math.sin(t * Math.PI / 2), rr = Math.pow(Math.cos(t * Math.PI / 2), pw) * (j === 0 ? 1.04 : 1);
          for (let i = 0; i <= SEG; i++) {
            const a = (i / SEG) * TAU, lx = Math.cos(a) * rx * rr + lean * y, lz = Math.sin(a) * rz * rr;
            H.pos.push(cx + lx * cy0 - lz * sy0, cy + y - (j === 0 ? 0.5 : 0), cz + lx * sy0 + lz * cy0);
            const nx = Math.cos(a) / rx, nz = Math.sin(a) / rz, ny = (0.25 + 1.6 * t) / Math.max(Ht, 1) , l = Math.hypot(nx, ny, nz) || 1;
            H.nor.push((nx * cy0 - nz * sy0) / l, ny / l, (nx * sy0 + nz * cy0) / l);
            H.cm.push(cx, cy + Ht * 0.45, cz, m); H.pat.push(motif, set[0], set[1], set[2]);
          }
        }
        for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
          const a = base + j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
          H.idx.push(a, c, b, b, c, d);
        }
      };
      const clearOf = (x, z, R, yLevel) => {
        const n = path.nearestXZ(x, z);
        if (Math.abs(n.y - yLevel) < 120 && n.dist < R + 34) return false;
        if (yLevel < 100) {
          if (z > -R && z < 720 && Math.abs(x - meadowMid(z)) < meadowHalf(Math.max(z, 0)) + R + 22) return false;
          if (Math.hypot(x - dark.base.x, z - dark.base.z) < 128 + R || Math.hypot(x - bright.base.x, z - bright.base.z) < 128 + R) return false;
          if (Math.abs(x) < 470 + R && z < R + 6) return false;                 // not through the cliff
        } else if (Math.abs(x) < 112 + R && z > -470 - R) return false;         // not in the river
        return true;
      };
      const want = Math.round(60 * (detail < 1 ? 0.6 : 1));
      let made = 0;
      for (let k = 0; k < 400 && made < want; k++) {
        const kind = made < 9 ? 0 : made < Math.round(want * 0.58) ? 1 : 2;      // plateau, lower country, the far ring
        let x, z, R, Ht, m, y = 0;
        if (kind === 0) { x = (hr() < 0.5 ? -1 : 1) * (135 + hr() * 280); z = -650 + hr() * 600; R = 22 + hr() * 48; Ht = R * (0.5 + hr() * 0.55); m = 5 + hr() * 5; y = 250; if (Math.abs(x) + R > 440) continue; }
        else if (kind === 1) { x = (hr() * 2 - 1) * 720; z = 30 + hr() * 800; R = 24 + hr() * 70; Ht = Math.min(90, R * (0.45 + hr() * 0.6)); m = 5 + hr() * 7; }
        else { const a = hr() * TAU, d = 820 + hr() * 1580; x = Math.cos(a) * d; z = 300 + Math.sin(a) * d; R = 60 + hr() * 70; Ht = 40 + hr() * 50; m = 20 + hr() * 20; }
        if (!clearOf(x, z, R, y)) continue;
        if (kind < 2) m = Math.min(26, Math.max(m, path.distanceTo(x, y + Ht * 0.5, z) * 0.04)) * (0.85 + 0.3 * hr());   // big enough to read from the flight
        addHill(x, y, z, R, Ht, m); made++;
        if (made % 8 === 7) await ctx.yield();
      }
      // two set by hand beside the foot of the falls, where the descent looks down
      addHill(170 * sd, 0, 60, 33, 25, 5.5); addHill(212 * sd, 0, 126, 30, 33, 6.5);
      // THE GREAT HILLS (round 4a; they were colossi, which the brief forbids): eight broad low domes at the top of the brief's
      // range (210 to 260 m across, 70 to 90 m tall), each ONE flat pattern with a far motif of 24 to 38 m so it reads from
      // 1.5 km. The second scale of the backdrop is carried by ink: three in black and white chequers or bars, two in rose and
      // cobalt spirals or ringed rounds, three dark gold on gold. Three stand beyond the meadow's end, three beyond the dark
      // robe, two beyond the whorl robe. (addHill draws its own motif and inks from hr first, then these replace them.)
      for (const [x, z, R, Ht, m, motif, set] of [
        [-330, 1010, 104, 86, 30, 5, [6, 5, 0]], [90, 1260, 108, 90, 34, 0, [3, 4, 0]], [480, 1060, 98, 78, 28, 3, [2, 13, 0]],
        [830, 640, 104, 88, 30, 4, [5, 0, 6]], [910, 250, 96, 80, 26, 1, [3, 4, 7]], [1060, 980, 106, 84, 36, 7, [2, 0, 13]],
        [-810, 540, 106, 88, 32, 0, [3, 4, 0]], [-770, 160, 96, 74, 26, 6, [2, 13, 1]]]) {     // R is the mean radius: addHill's own spread keeps every one under 260 m across
        const from = H.pat.length; addHill(x * sd, 0, z, R, Ht, m);
        for (let i = from; i < H.pat.length; i += 4) { H.pat[i] = motif; H.pat[i + 1] = set[0]; H.pat[i + 2] = set[1]; H.pat[i + 3] = set[2]; }
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry(), n = H.pos.length / 3;
      g.setAttribute('position', new THREE.Float32BufferAttribute(H.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(H.nor, 3));
      g.setAttribute('aCM', new THREE.Float32BufferAttribute(H.cm, 4)); g.setAttribute('aPat', new THREE.Float32BufferAttribute(H.pat, 4));
      g.setAttribute('aHemP', new THREE.Float32BufferAttribute(new Float32Array(n * 4), 4)); g.setAttribute('aHem', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
      g.setIndex(H.idx);
      const hills = new THREE.Mesh(g, hero.makePatternMaterial(false)), hull = new THREE.Mesh(g, hero.makePatternMaterial(true));
      hills.frustumCulled = false; hull.frustumCulled = false; scene.add(hills, hull);
      await ctx.yield();
    }

    // ---- gold wire: scroll trees, the Clasp and the curl-rollers (one geometry, drawn twice: ink and umber hull) ----
    const leafSpots = [];                                   // where the trees' triangle leaves hang: x, y, z, phase
    const rollers = [];
    {
      const tr = wr.fork ? wr.fork('wire') : wr;
      const G = { pos: [], nor: [], s: [], roll: [], rk: [], idx: [] }, still = [0, 0, 0, 0];
      const up = new THREE.Vector3(0, 1, 0);
      const tree = (base, leanTo, leanAmt, size) => {
        const Ht = 22 * size, lean = new THREE.Vector3(leanTo.x - base.x, 0, leanTo.z - base.z); if (lean.lengthSq() < 1e-6) lean.set(1, 0, 0); lean.normalize();
        const ph = tr() * TAU, side = new THREE.Vector3(-lean.z, 0, lean.x);
        const trunkAt = (t) => new THREE.Vector3().copy(base).addScaledVector(up, Ht * t).addScaledVector(lean, leanAmt * Ht * t * t).addScaledVector(side, Math.sin(t * 3.4 + ph) * 0.9 * size * t);
        const trunk = []; for (let i = 0; i <= 22; i++) trunk.push(trunkAt(i / 22 * 0.97));
        sweep(G, trunk, (t) => (0.62 - 0.3 * t + 0.5 * Math.pow(1 - t, 8)) * size, still, still, 7);
        const crown = volute(trunkAt(0.97).addScaledVector(up, 1.7 * size), lean, up, 1.7 * size, 2.1, -Math.PI / 2, 1, 36);
        sweep(G, crown, (t) => (0.38 - 0.18 * t) * size, still, still, 5);
        for (let b = 0; b < 9; b++) {
          const hb = 0.3 + 0.64 * (b / 8), az = b * 2.4 + ph + (tr() - 0.5) * 0.5, len = (9.5 - 5.5 * (b / 8) + tr() * 2) * size, rise = (2.5 + tr() * 3.5) * size;
          const out = new THREE.Vector3(Math.cos(az), 0, Math.sin(az)), p0 = trunkAt(hb), arm = [];
          for (let i = 0; i <= 12; i++) { const t = i / 12; arm.push(new THREE.Vector3().copy(p0).addScaledVector(out, len * t).addScaledVector(up, rise * Math.sin(t * Math.PI / 2) - 0.8 * size * Math.sin(t * Math.PI))); }
          const r0 = 1.5 * size, end = arm[arm.length - 1], vol = volute(end.clone().addScaledVector(up, r0), out, up, r0, 2.2, -Math.PI / 2, 1, 34);
          const wire = arm.concat(vol.slice(1));
          sweep(G, wire, (t) => (0.36 - 0.18 * t) * size, still, still, 5);
          for (let i = 3; i < wire.length; i++) {             // leaves hang under the arm and round the volute, points down
            const n = i < arm.length ? 5 : 1;
            for (let k = 0; k < n; k++) { const p = wire[i], q = wire[i - 1], f = tr(); leafSpots.push(p.x + (q.x - p.x) * f + (tr() - 0.5) * 0.5, p.y + (q.y - p.y) * f - 0.42 - tr() * 0.9, p.z + (q.z - p.z) * f + (tr() - 0.5) * 0.5, tr()); }
          }
        }
      };
      const river = (z) => 35 + 55 * Math.pow(Math.max(0, (z + 420) / 421.6), 1.6);
      const spots = [
        [V(-62, 250, -172), V(0, 250, -140), 0.1, 1.0],                        // on the river's bank, to port of the entry and behind us before the first bend
        [V(-107, 250, -25), V(-60, 250, 0), 0.08, 1.15],                       // inside the sweep to the brink: the flight turns round it
        [V(-143, 0, 92), V(-100, 0, 102), 0.22, 1.1],                           // two lean in over the pool (this one over the flight as it leaves)
        [V(114, 0, 110), V(40, 0, 60), 0.26, 1.0],
        [V(120, 0, 236), V(60, 0, 250), 0.15, 0.9],                            // more, on the meadow's banks and by the brink
        [V(118, 250, -64), V(60, 250, -30), 0.12, 0.95],
      ];
      for (let i = 0; i < nTrees; i++) { tree(...spots[i]); await ctx.yield(); }

      // the Clasp: the ring, and two volutes 16 m tall curling toward each other to hold it
      const sideV = new THREE.Vector3(-dirEnd.z, 0, dirEnd.x), ck = RING / 7;
      const ring = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU; ring.push(seat.clone().addScaledVector(sideV, Math.cos(a) * (RING + 0.8)).addScaledVector(up, Math.sin(a) * (RING + 0.8))); }
      sweep(G, ring, () => 0.46, still, still, 6);
      for (const s of [-1, 1]) {
        const ex = sideV.clone().multiplyScalar(s), c = seat.clone().addScaledVector(ex, 12.1 * ck); c.y = 11.6 * ck;
        const stem = []; for (let i = 0; i <= 10; i++) { const t = i / 10; stem.push(new THREE.Vector3().copy(c).addScaledVector(ex, (4 + 1.6 * (1 - t) * (1 - t)) * ck).setY(-0.3 + (11.6 * ck + 0.3) * t)); }
        const wire = stem.concat(volute(c, ex, up, 4 * ck, 2.6, 0, 1, 52).slice(1));
        sweep(G, wire, (t) => (0.5 - 0.26 * t + 0.5 * Math.pow(1 - t, 10)) * ck, still, still, 7);
        const foot = volute(c.clone().addScaledVector(ex, 7.3 * ck).setY(1.7 * ck), ex, up, 1.7 * ck, 1.9, Math.PI, 1, 26);   // a small counter-scroll at the foot
        sweep(G, foot, (t) => (0.3 - 0.14 * t) * ck, still, still, 5);
      }
      await ctx.yield();

      // curl-rollers: volutes 9 m tall rolling to and fro along the meadow's banks (the vertex shader rolls them)
      const rspots = [[V(-135, 0, 207), [0.55, 0.8]], [V(-88, 0, 196), [0.86, 0.51]], [V(124, 0, 168), [0.1, 1]], [V(-128, 0, 30), [0, 1]], [V(128, 0, 318), [0.3, 1]],
        [V(-111, 0, 133), [-0.3, 0.95], 4.6], [V(-102, 0, 152), [-0.2, 0.98], 6], [V(-96, 0, 118), [-0.3, 0.95], 3.2]];   // and a cluster of three beside the flight as it leaves the pool   // the first rolls between the flight and the whorl hem
      for (const [p, d0, R0] of rspots) {
        const R = R0 || 4.5, d = new THREE.Vector2(d0[0] * sd, d0[1]).normalize(), ph = tr() * TAU, rate = 0.16 + tr() * 0.08;
        const loc = volute(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), up, R - 0.3, 2.7, tr() * TAU, tr() < 0.5 ? 1 : -1, 60);
        sweep(G, loc, (t) => (0.36 - 0.2 * t) * R / 4.5, [p.x, R + 0.1, p.z, R], [d.x, d.y, ph, rate], 6);
        rollers.push({ p, d, ph, rate, R });
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(G.s, 1)); g.setAttribute('aRoll', new THREE.Float32BufferAttribute(G.roll, 4)); g.setAttribute('aRk', new THREE.Float32BufferAttribute(G.rk, 4));
      g.setIndex(G.idx);
      const wireMat = (hull) => new THREE.ShaderMaterial({ uniforms: { ...U, uHull: { value: hull ? 1 : 0 }, uWireA: { value: inks[0] }, uWireB: { value: inks[1] }, uWireC: { value: inks[2] } },
        vertexShader: WIRE_VERT, fragmentShader: WIRE_FRAG, side: hull ? THREE.BackSide : THREE.FrontSide, fog: false });
      const wires = new THREE.Mesh(g, wireMat(false)), wiresHull = new THREE.Mesh(g, wireMat(true));
      wires.frustumCulled = false; wiresHull.frustumCulled = false; scene.add(wires, wiresHull);
      await ctx.yield();
    }

    // ---- instanced quads with drawn shapes: every one flat ink, edged in umber inside the quad, discarded outside ----
    const quadGeo = (attrs, count) => {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], 4));
      g.instanceCount = count; return g;
    };
    const addQuads = (attrs, count, vert, frag, extra = {}, add = false) => {
      const mat = new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide, fog: false,
        ...(add ? { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } : {}) });
      const mesh = new THREE.Mesh(quadGeo(attrs, count), mat); mesh.frustumCulled = false; if (add) mesh.renderOrder = 3; scene.add(mesh); return mesh;
    };
    const HEAD = /* glsl */`
      precision highp float;
      uniform vec3 uInk[14]; uniform float uTime, uViewH, uTanHalf, uGold; uniform vec3 uCamL;
      vec3 inkAt(float i){ int k = int(clamp(i + .5, 0., 13.)); return uInk[k]; }
      float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }`;

    // the scroll trees' triangle leaves: 0.7 m, point down, black, white, malachite and gold, trembling
    {
      const n = leafSpots.length / 4, a = new Float32Array(leafSpots);
      addQuads({ aP: a }, n, HEAD + /* glsl */`
        attribute vec4 aP; varying vec2 vQ; varying vec2 vK;
        void main(){
          vec3 C = aP.xyz; vec3 tc = uCamL - C; float d = max(length(tc), .5);
          vec3 r = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.));
          float w = .22 * sin(uTime * (2.2 + aP.w * 2.) + aP.w * 40.) + .1 * sin(uTime * 5.3 + aP.w * 90.);      // it hangs from its top edge and trembles
          vec3 rr = r * cos(w) + vec3(0., 1., 0.) * sin(w), uu = vec3(0., 1., 0.) * cos(w) - r * sin(w);
          float pxM = d * 2. * uTanHalf / max(uViewH, 1.), hs = .36 + .1 * h11(aP.w * 7.) + pxM;
          vec3 P = C + rr * position.x * hs + uu * (position.y - 1.) * hs;
          vQ = position.xy * hs; vK = vec2(aP.w, pxM);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(P, 1.);
        }`, HEAD + /* glsl */`
        varying vec2 vQ; varying vec2 vK;
        void main(){
          float hs = .36 + .1 * h11(vK.x * 7.);
          vec2 p = vQ / hs;                                             // triangle: flat top at y 1, point at y -1
          float dd = min(((1. + p.y) * .5 - abs(p.x)) * .894, 1. - p.y) * hs;                // metres inside the outline
          if (dd < -vK.y) discard;
          float cw = max(.045, 1.4 * vK.y), k = h11(vK.x * 13.7);
          vec3 col = k < .3 ? uInk[3] : k < .55 ? uInk[4] : k < .8 ? uInk[8] : uInk[0];
          gl_FragColor = vec4(dd < cw ? uInk[9] : col, 1.);
        }`);
      await ctx.yield();
    }

    // stemmed heads: daisies of eight petals, ringed targets and spirals on single umber stems, nodding in a wave that follows the flow
    {
      const hr = wr.fork ? wr.fork('heads') : wr, n = Math.round(8400 * detail * (0.85 + 0.15 * density)), nG = 110, a = new Float32Array((n + nG) * 4), b = new Float32Array((n + nG) * 4);
      const p = new THREE.Vector3(), t = new THREE.Vector3();
      // THE LANE (round 4c): a rule in space, the same at every point of the flight and for every head, small or great. No face
      // stands nearer the flight line than LANE (ten) times its own radius, measured from the face's centre to the nearest
      // point of the whole path (sampled every metre), its sideways distance first shortened by the reach of its nod (0.22 of
      // its stem). A face that passes UNDER the line is counted further off than it is, up to twice when it is straight below
      // (laneFar): the gaze is never lowered more than a few degrees, so what is under the line of flight is seen only ahead
      // and low in the frame, about twice as far off as it is deep, while what stands beside the line, up to 40 degrees below
      // our level, can be looked at squarely and is counted at its true distance. So faces up to half a metre in radius still
      // brush past some 3 m below (the brief), and a face a metre in radius keeps 10 m off to the side. A head that would
      // stand inside the lane is moved straight outward, level, until it clears; its height, size and kind are untouched.
      // One whose place outside would be in the pool, in the cliff, on a robe's base or on the seat is tried on the other
      // side of the line, and failing that is not planted. (Round 4d: the 110 great heads keep LANE_GREAT, thirteen, times their
      // radius, and so does every other face of 0.8 m radius or more, the figure rising from ten at half a metre: the faces that
      // brush past 3 m below are the small ones, and a face a metre in radius stands 13 m off, an eighth of the frame high seen
      // square on.)
      const LANE = 10, LANE_GREAT = 13, laneN = Math.ceil(path.length), lane = new Float32Array((laneN + 1) * 3);
      for (let i = 0; i <= laneN; i++) { path.pointAt(i / laneN, p); lane[i * 3] = p.x; lane[i * 3 + 1] = p.y; lane[i * 3 + 2] = p.z; }
      // (the samples are binned in 24 m squares, so a head looks only at the stretch of path near it: no head reaches 24 m,
      // and no sample over 40 m up can be within reach of a face, the tallest of which stands 8 m high)
      const LANE_G = 24, laneBins = new Map(), laneKey = (ix, iz) => ix * 4096 + iz;
      for (let i = 0; i <= laneN; i++) {
        if (lane[i * 3 + 1] > 40) continue;
        const key = laneKey(Math.floor(lane[i * 3] / LANE_G), Math.floor(lane[i * 3 + 2] / LANE_G));
        let bin = laneBins.get(key); if (!bin) laneBins.set(key, bin = []); bin.push(i);
      }
      const laneFar = (h, below) => { const d = Math.hypot(h, below); return d * (1 + smooth(0.64, 1, Math.max(below, 0) / Math.max(d, 1e-6))); };   // 0.64: the sine of 40 degrees
      const laneXZ = [0, 0, 0];                                 // x, z, and how it went: 0 untouched, 1 moved, 2 no room
      const clearLane = (x, z, tall, rad, flip, wide) => {
        const need = wide * rad + 0.2, nod = 0.22 * tall, yF = 0.25 + tall;    // (20 cm over, for the metre between samples)
        let state = 0;
        for (let pass = 0; pass < 40; pass++) {
          let best = need, bx = 0, bb = 0, bz = 0, hit = false;
          const reach = need + nod, ix0 = Math.floor(x / LANE_G), iz0 = Math.floor(z / LANE_G);
          for (let gx = -1; gx <= 1; gx++) for (let gz = -1; gz <= 1; gz++) {
            const bin = laneBins.get(laneKey(ix0 + gx, iz0 + gz)); if (!bin) continue;
            for (let j = 0; j < bin.length; j++) {
              const i = bin[j], below = lane[i * 3 + 1] - yF, dx = x - lane[i * 3], dz = z - lane[i * 3 + 2];
              if (below > need || dx > reach || dx < -reach || dz > reach || dz < -reach) continue;
              const e = laneFar(Math.max(Math.hypot(dx, dz) - nod, 0), below);
              if (e < best) { best = e; bx = dx; bb = below; bz = dz; hit = true; }
            }
          }
          if (!hit) { if (state === 2) state = 1; break; }
          const h = Math.hypot(bx, bz), ux = h > 1e-3 ? bx / h : 1, uz = h > 1e-3 ? bz / h : 0;
          let lo = h, hi = h + 0.25; while (laneFar(Math.max(hi - nod, 0), bb) < need && hi < h + 60) { lo = hi; hi += 0.25; }
          for (let k = 0; k < 5; k++) { const mid = 0.5 * (lo + hi); if (laneFar(Math.max(mid - nod, 0), bb) < need) lo = mid; else hi = mid; }
          const want = hi + 0.3 * Math.min(pass, 1);            // (after the first move, a third of a metre further each time a neighbouring sample is still too near)
          if (flip && pass === 0) { x -= ux * (want + h); z -= uz * (want + h); } else { x += ux * (want - h); z += uz * (want - h); }
          state = 2;                                             // moved, and not yet seen to be clear
        }
        laneXZ[0] = x; laneXZ[1] = z; laneXZ[2] = state; return laneXZ;
      };
      const offGround = (x, z, seatR) => z < 4 || (Math.abs(x) < 104 && z < 112 && z > 0) || Math.hypot(x - dark.base.x, z - dark.base.z) < 118
        || Math.hypot(x - bright.base.x, z - bright.base.z) < 118 || Math.hypot(x - seat.x, z - seat.z) < seatR;
      const plant = (x, z, tall, rad, seatR, wide = LANE) => {              // the head's place by the lane's rule; x of 1e6 is "not planted"
        let L = clearLane(x, z, tall, rad, false, wide);
        if (L[2] === 0) return L;
        if (L[2] === 2 || offGround(L[0], L[1], seatR)) { L = clearLane(x, z, tall, rad, true, wide); if (L[2] === 2 || offGround(L[0], L[1], seatR)) { L[0] = 1e6; L[2] = 3; } }
        return L;
      };
      let made = 0;
      for (let k = 0; k < n * 6 && made < n; k++) {
        let x, z, lift = 0;
        const pick = hr();
        if (pick < 0.52) {                                           // a dense, tall drift under the flight from the pool's edge past the whorl hem to the last straight
          const u = uFoot + 0.03 + hr() * (uApp + 0.035 - uFoot - 0.03); path.pointAt(u, p); path.tangentAt(u, t);
          const o = hr(), off = (hr() < 0.5 ? -1 : 1) * (0.6 + 40 * Math.pow(o, 1.35)); x = p.x - t.z * off + (hr() - 0.5) * 5; z = p.z + t.x * off + (hr() - 0.5) * 5;
          lift = 2.4 * Math.max(0, 1 - Math.abs(off) / 16);          // the nearest stand tallest: their heads pass 3 m under us
        } else if (pick < 0.78) {                                    // more along the whole low part of the flight
          const u = uFoot + 0.02 + hr() * (0.985 - uFoot); path.pointAt(u, p); path.tangentAt(u, t);
          const off = (hr() < 0.5 ? -1 : 1) * (1.5 + 34 * Math.pow(hr(), 1.6)); x = p.x - t.z * off + (hr() - 0.5) * 6; z = p.z + t.x * off + (hr() - 0.5) * 6;
        } else { z = 112 + hr() * 470; x = meadowMid(z) + (hr() * 2 - 1) * (meadowHalf(z) + 14); }
        const tall = 0.8 + 1.4 * hr() + (hr() < 0.2 ? 1.1 : 0) + lift * (0.5 + 0.5 * hr()), rad = (0.34 + 0.4 * hr()) * (1 + 0.16 * lift), kind = Math.floor(hr() * 3), ink = hr(), seed = hr();
        if (z < 4 || (Math.abs(x) < 104 && z < 112 && z > 0)) continue;                       // not in the pool, not in the cliff
        if (Math.hypot(x - dark.base.x, z - dark.base.z) < 118 || Math.hypot(x - bright.base.x, z - bright.base.z) < 118) continue;
        if (Math.hypot(x - seat.x, z - seat.z) < 9) continue;
        const L = plant(x, z, tall, rad, 9, LANE + (LANE_GREAT - LANE) * smooth(0.5, 0.8, rad));
        a.set([L[0], tall, L[1], rad], made * 4); b.set([kind, ink, seed, 0], made * 4); made++;
        if (k % 150 === 149) await ctx.yield();
      }
      // the great heads: a hundred on tall stems beside the flight from the pool's edge to the last straight, each a metre or
      // more across. ONE HEIGHT LAW for all of them, a rule of the plant and of nothing else: no great head stands taller
      // than the tallest small head of the drift can (DRIFT_TOP, 6.7 m to the face's top), and each stands under that by up
      // to the smallest great head's own width (1.6 m), by a draw of its own. Nothing in it is taken from the flight line or
      // from the look. The side is a coin's, everywhere, and they keep the lane like every other head (above).
      {
        const gr = hr.fork ? hr.fork('great-heads') : hr;        // the great heads' own fork
        const DRIFT_TOP = 0.8 + 1.4 + 1.1 + 2.4 + (0.34 + 0.4) * (1 + 0.16 * 2.4);   // the tallest a small head of the drift can stand: its stem's four terms and its face's radius, as drawn above
        // WHERE THE STAND BEGINS: at the pool's bank. The route is walked from its first metre to its last in steps of 3 m of its
        // own length; the bank is the first of those steps from which the route's own point is outside the pool's outline and
        // stays outside. (inPool is that outline, as the planting tests have it; the great heads' own test below reads it.)
        const inPool = (x, z) => Math.abs(x) < 104 && z < 112 && z > 0;
        const BANK_STEP = 3; let mBank = 0;
        for (let m = 0; m + BANK_STEP <= path.length; m += BANK_STEP) { path.posAtDist(m, p); if (inPool(p.x, p.z)) mBank = m + BANK_STEP; }
        const uBank = mBank / path.length;
        for (let i = 0; i < nG; i++) {
          const u = uBank + (uApp - uBank) * gr(); path.pointAt(u, p); path.tangentAt(u, t);
          const r1 = gr(), r2 = gr(), r3 = gr(), sgn = gr() < 0.5 ? -1 : 1;
          const off = sgn * (2.9 + 6.5 * r1), x = p.x - t.z * off, z = p.z + t.x * off;
          const rad = 0.8 + 0.6 * r3;
          const tall = DRIFT_TOP - rad - 1.6 * r2;
          const kind = Math.floor(gr() * 3), ink = gr(), seed = gr();
          if (z < 4 || inPool(x, z)) continue;
          if (Math.hypot(x - dark.base.x, z - dark.base.z) < 118 || Math.hypot(x - bright.base.x, z - bright.base.z) < 118 || Math.hypot(x - seat.x, z - seat.z) < 14) continue;
          const L = plant(x, z, tall, rad, 14, LANE_GREAT);
          if (i % 20 === 19) await ctx.yield();
          a.set([L[0], tall, L[1], rad], made * 4); b.set([kind, ink, seed, 0], made * 4); made++;
        }
      }
      addQuads({ aA: a, aB: b }, made, HEAD + /* glsl */`
        attribute vec4 aA; attribute vec4 aB; varying vec2 vQ; varying vec4 vK; varying vec3 vS; varying vec2 vE;
        void main(){
          float tall = aA.y, rad = aA.w;
          float nod = .16 * sin(uTime * 1.3 - aA.z * .07 + aA.x * .02) + .06 * sin(uTime * 2.9 + aB.z * 30.);       // the wave runs downstream
          vec3 N3 = vec3(.3, 0., .95) * nod * tall;
          vec3 Hc = vec3(aA.x, .25 + tall, aA.z) + N3;                 // the head faces the eye; the stem runs from it to the foot
          vec3 tc = uCamL - Hc; float d = max(length(tc), .5); tc /= d;
          vec3 r = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.)), u2 = cross(tc, r);
          float pxM = d * 2. * uTanHalf / max(uViewH, 1.);
          vec2 E = vec2(-dot(N3, r), -tall * u2.y - dot(N3, u2));       // the foot, in the head's plane
          float hw = rad + pxM, pad = 2. * pxM + .05;
          vec2 lo = min(vec2(-hw), E - pad), hi = max(vec2(hw), E + pad);
          vec2 q = mix(lo, hi, position.xy * .5 + .5);
          vQ = q; vE = E; vK = vec4(tall, rad, pxM, aB.x); vS = vec3(aB.y, aB.z, uTime * (.25 + .3 * aB.z) * (aB.z > .5 ? 1. : -1.));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(Hc + r * q.x + u2 * q.y, 1.);
        }`, HEAD + /* glsl */`
        varying vec2 vQ; varying vec4 vK; varying vec3 vS; varying vec2 vE;
        void main(){
          // (round 4b) a head under seven pixels of radius thins its umber edge, and under three it is its own flat ink with
          // no edge, so a far stand reads as flowers and not as umber speckle; a stem is one pixel wide, never less
          float R = vK.y, px = vK.z, far = smoothstep(3., 7., R / max(px, 1e-4)), cw = min(max(.04, 1.2 * px), R * .3) * far;
          float hw = R + px, pad = 2. * px + .05;                       // the quad's own extent (as the vertex shader lays it): the across coordinate is held to it before it is squared
          vec2 p = clamp(vQ, min(vec2(-hw), vE - pad), max(vec2(hw), vE + pad)); float r = length(p), th = atan(p.y + 1e-5, p.x + 1e-5) + vS.z;
          float edge = R; vec3 colA, colB;
          float k = vS.x; float gold = step(2.6, uGold);
          colA = k < .25 ? uInk[5] : k < .5 ? uInk[6] : k < .75 ? uInk[8] : uInk[4]; colB = k < .5 ? uInk[4] : uInk[0];
          colA = mix(colA, uInk[0], gold); colB = mix(colB, uInk[1], gold);
          vec3 col;
          if (vK.w < .5) { float pet = abs(cos(th * 4.)); edge = R * (.56 + .44 * pet); col = r < R * .3 ? uInk[3] : (r < R * .42 ? colB : colA); }       // daisy
          else if (vK.w < 1.5) { float b = floor(r / max(R, 1e-3) * 4.); col = b < .5 ? uInk[3] : (mod(b, 2.) < .5 ? colA : colB); }                  // ringed target
          else { float s = fract((th + r / max(R, 1e-3) * 5.) / 3.14159); col = r < R * .22 ? uInk[3] : (s < .5 ? colA : colB); }                       // spiral
          float dHead = edge - r;
          float hseg = clamp(dot(p, vE) / max(dot(vE, vE), 1e-4), 0., 1.);
          bool stem = length(p - vE * hseg) < max(px * .5, .035);
          float rim = -px * .5 * far;
          if (dHead < rim && !stem) discard;
          col = dHead < cw ? uInk[9] : col;
          gl_FragColor = vec4(dHead < rim ? uInk[9] : col, 1.);
        }`);
      await ctx.yield();
    }

    // eye-birds: one almond each, pearl with a cobalt iris and a black pupil ring; files fly nose to tail round closed loops.
    // File 0 crosses ahead of us over the river and file 1 threads the ring on the approach (both keyed to u); the rest loop by time.
    const MAXF = 11, fileC = [], fileD = [], fileE = [], fileDefs = [];
    {
      const br = wr.fork ? wr.fork('birds') : wr;
      const pX = new THREE.Vector3(), tX = new THREE.Vector3();
      const uCross = 95 / path.length; path.pointAt(uCross, pX); path.tangentAt(uCross, tX);
      const crossAt = pX.clone().addScaledVector(tX, 12.5); crossAt.y += 0.4;
      const sideX = new THREE.Vector3(-tX.z, 0, tX.x).multiplyScalar(-sd);                        // out over the river
      const sideR = new THREE.Vector3(-dirEnd.z, 0, dirEnd.x).multiplyScalar(-sd);                // the ring loop swings to the upstream side
      const uS = uR + 0.012, pS = new THREE.Vector3(), tS = new THREE.Vector3(); path.pointAt(uS, pS); path.tangentAt(uS, tS); tS.y = 0; tS.normalize();
      // centre, ex (loop's first axis), rx, rz, bob, size, keyed [u0, radians per u] or null, rate (radians a second)
      const defs = [
        // a straight line (a loop of no width and great length) that crosses 12 m ahead, river side to bank side, and leads off ahead of us
        { c: crossAt, ex: new THREE.Vector3(1, 0, 0), rx: 0, rz: 4000, along: sideX.clone().multiplyScalar(-0.8).addScaledVector(tX, 0.6), bob: 0, size: 1, key: [uCross, 1.1 * path.length / 4000, 4], rate: 0 },
        // a long file strung from just ahead of us to the ring, coming in from the upstream side and threading it as we close (keyed to u)
        { c: seat.clone(), ex: new THREE.Vector3(1, 0, 0), rx: 0, rz: 4000, along: dirEnd.clone().multiplyScalar(Math.cos(0.13)).addScaledVector(sideR, Math.sin(0.13)), bob: 0, size: -3.4, key: [0.9, 1.04 * path.length / 4000, -1], rate: 0, span: 122 },   // size < 0: each almond faces the eye
        { c: V(-106, 267, -25), ex: new THREE.Vector3(1, 0, 0), rx: 17.5, rz: 16.5, bob: 2.2, size: 1, key: null, rate: 0.5 },      // round the scroll tree at the brink
        { c: V(26, 262.5, -92), ex: new THREE.Vector3(1, 0, 0), rx: 30, rz: 24, bob: 2, size: 1, key: null, rate: 0.24 },
        { c: V(-4, 13, 54), ex: new THREE.Vector3(1, 0, 0), rx: 34, rz: 22, bob: 3, size: 1, key: null, rate: -0.3 },
        { c: V(-105, 15, 173), ex: new THREE.Vector3(0, 0, 1), rx: 27, rz: 25, bob: 3, size: 1, key: null, rate: 0.33 },
        { c: V(-18, 14, 272), ex: new THREE.Vector3(1, 0, 0), rx: 32, rz: 17, bob: 2.5, size: 1, key: null, rate: -0.28 },
        // a close file that flies with us through the middle of the sweep, 45 m off on the dark robe's side, strung toward the cliff: it leads the eye round to the falls
        { c: pS.clone().add(V(42, -7, -16)), ex: new THREE.Vector3(1, 0, 0), rx: 0, rz: 4000, along: tS.clone().multiplyScalar(0.8).add(V(0, 0, -0.35)).normalize(), bob: 0, size: 3.4, key: [uS, 0.95 * path.length / 4000, -2], rate: 0, always: true },
      ];
      {   // two more keyed files, always flown
        // one sweeps out past us, low on the inside of the turn, as the lower country opens beyond the brink
        const uE = uBrink + 0.05; path.pointAt(uE, pX); path.tangentAt(uE, tX);
        const inS = new THREE.Vector3(-tX.z, 0, tX.x).multiplyScalar(-sd), tH = new THREE.Vector3(tX.x, 0, tX.z).normalize();
        defs.push({ c: pX.clone().addScaledVector(tH, 28).addScaledVector(inS, 5).add(new THREE.Vector3(0, -16, 0)), ex: new THREE.Vector3(1, 0, 0), rx: 0, rz: 4000,
          along: tH.clone().multiplyScalar(0.86).addScaledVector(inS, 0.5), bob: 0, size: 1.7, key: [uE, 1.05 * path.length / 4000, -2], rate: 0, always: true });
        // the other crosses between us and the cliff while the flight rounds the far side with the falls in frame
        const uK = uF; path.pointAt(uK, pX);
        const toF = new THREE.Vector3(0, 134, 0).sub(pX).normalize();
        defs.push({ c: pX.clone().addScaledVector(toF, 46).add(new THREE.Vector3(0, -6, 0)), ex: new THREE.Vector3(1, 0, 0), rx: 0, rz: 4000,
          along: V(1, 0, -0.22).normalize(), bob: 0, size: 3, key: [uK, 0.5 * path.length / 4000, -2], rate: 0, always: true });
        // and one flies with us as we come in on the falls from the far corner: a string of large eyes from just ahead of us off toward the cliff
        const uQ = 0.52; path.pointAt(uQ, pX); path.tangentAt(uQ, tX);
        const tQ = new THREE.Vector3(tX.x, 0, tX.z).normalize(), rQ = new THREE.Vector3(-tQ.z, 0, tQ.x);
        defs.push({ c: pX.clone().addScaledVector(tQ, 38).addScaledVector(rQ, 4).add(new THREE.Vector3(0, -4, 0)), ex: new THREE.Vector3(1, 0, 0), rx: 0, rz: 4000,
          along: tQ.clone().multiplyScalar(0.85).addScaledVector(rQ, 0.53).normalize(), bob: 0, size: -3, key: [uQ, 1.16 * path.length / 4000, -2], rate: 0, span: 60, always: true });   // strung 32 degrees across our line, so it slides over the frame as it keeps pace
      }
      const rows = [];
      for (let f = 0; f < MAXF; f++) {
        const d = defs[f], n = (f < nFiles || d.always) ? 9 + Math.floor(br() * 6) : 0, ph = br() * TAU;
        if (d.along) { d.ex.normalize(); if (d.rx === 0) d.ex.set(d.along.z, 0, -d.along.x).normalize(); if (-d.ex.z * d.along.x + d.ex.x * d.along.z < 0) d.rz = -d.rz; }
        if (d.key && d.key[2] < 0) d.key[2] = d.key[2] < -1.5 ? Math.round(n / 2) : n;                 // the leader is at the point when u reaches the key
        d.ph = ph; d.n = n; d.step = (d.span ? d.span / Math.max(n - 1, 1) : 2 * Math.abs(d.size)) / (d.rx === 0 ? Math.abs(d.rz) : Math.max(0.5 * (d.rx + Math.abs(d.rz)), 1)); fileDefs.push(d);
        fileC.push(new THREE.Vector4(d.c.x, d.c.y, d.c.z, d.rx)); fileD.push(new THREE.Vector4(d.ex.x, d.ex.z, d.rz, 0)); fileE.push(new THREE.Vector4(d.bob, d.size, ph, d.step));
        for (let j = 0; j < n; j++) rows.push(f, j, br(), n);
      }
      addQuads({ aB: new Float32Array(rows) }, rows.length / 4, HEAD + /* glsl */`
        attribute vec4 aB; uniform vec4 uFC[11], uFD[11], uFE[11]; varying vec2 vQ; varying vec3 vK;
        void main(){
          int f = int(clamp(aB.x + .5, 0., 10.)); vec4 fc = uFC[f], fd = uFD[f], fe = uFE[f];
          float sz = abs(fe.y);
          float a = fd.w - aB.y * fe.w;
          vec3 ex = vec3(fd.x, 0., fd.y), ez = vec3(-fd.y, 0., fd.x);
          vec3 C = fc.xyz + ex * cos(a) * fc.w + ez * sin(a) * fd.z + vec3(0., fe.x * sin(a * 2. + fe.z) + .32 * sin(uTime * 2.4 - aB.y * .8 + fe.z), 0.);
          vec3 T = normalize(-ex * sin(a) * fc.w + ez * cos(a) * fd.z + vec3(0., 2. * fe.x * cos(a * 2. + fe.z), 0.) + vec3(1e-4, 0., 0.));
          vec3 tc = uCamL - C; float d = max(length(tc), .5);
          vec3 S = normalize(cross(T, tc / d) + vec3(0., 1e-4, 0.));
          if (fe.y < 0.) { T = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.)); S = vec3(0., 1., 0.); }      // a file flown away from us shows its eyes broadside
          float wob = .28 * sin(uTime * 2.4 - aB.y * .8 + fe.z + 1.2) + .12 * sin(uTime * 5.1 + aB.z * 30.);          // each almond tilts as the wave passes
          vec3 Tx = T * cos(wob) + S * sin(wob), Ty = S * cos(wob) - T * sin(wob);
          float pxM = d * 2. * uTanHalf / max(uViewH, 1.), hl = .8 * sz + pxM, hwd = .42 * sz + pxM;
          vQ = vec2(position.x * hl, position.y * hwd); vK = vec3(sz, pxM, aB.z);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(C + Tx * vQ.x + Ty * vQ.y, 1.);
        }`, HEAD + /* glsl */`
        varying vec2 vQ; varying vec3 vK;
        void main(){
          float sz = vK.x, px = vK.y; vec2 hq = vec2(.8, .42) * sz + px, p = clamp(vQ, -hq, hq) / max(sz, .1);   // almond: two discs intersected, 1.6 by 0.8 (the across coordinate held to the quad's own extent first)
          float rho = 1., c = .6;
          float dd = (rho - max(length(p - vec2(0., c)), length(p + vec2(0., c)))) * sz;
          if (dd < -px * .5) discard;
          float cw = max(.05, 1.4 * px), r = length(p - vec2(.06, 0.));
          vec3 col = uInk[4];
          col = r < .33 ? uInk[6] : col;
          col = (r < .2 && r > .1) ? uInk[3] : col;
          col = r < .1 ? uInk[1] : col;
          col = (dd > cw && dd < cw + .05 * sz && r > .36) ? uInk[0] : col;         // a hair of gold inside the contour
          gl_FragColor = vec4(dd < cw ? uInk[9] : col, 1.);
        }`, { uFC: { value: fileC }, uFD: { value: fileD }, uFE: { value: fileE } });
      updaters.push((dt, time, camera, u) => {
        for (let f = 0; f < MAXF; f++) {
          const d = fileDefs[f];
          // keyed files: the bird key[2] from the tail is at the crossing point (angle 0) when u reaches the key
          fileD[f].w = d.key ? (d.n - d.key[2]) * d.step + (u - d.key[0]) * d.key[1] + 0.6 * d.step * Math.sin(time * 0.7 + d.ph) : d.ph + time * d.rate;
        }
      });
      await ctx.yield();
    }

    // spiral fish: flat spirals 2.5 m across, rose and gold with a black core, rolling through the pool's surface like wheels
    {
      const fr = wr.fork ? wr.fork('fish') : wr, a = new Float32Array(nFish * 4), b = new Float32Array(nFish * 4), c = new Float32Array(nFish * 4);
      const p = new THREE.Vector3(), t = new THREE.Vector3();
      for (let i = 0; i < nFish; i++) {
        let x, z; const trk = 3 + fr() * 5;
        const near = i < nFish * 0.55; c[i * 4] = near ? 4.5 + fr() * 3 : 1.5 + fr() * 3;      // how high it leaps
        if (near) {                                             // beside the flight over the pool, 8 to 13 m off
          const u = uFoot + 0.012 + fr() * 0.085; path.pointAt(u, p); path.tangentAt(u, t);
          const off = (fr() < 0.5 ? -1 : 1) * (8 + trk + fr() * 3); x = p.x - t.z * off; z = p.z + t.x * off;
        } else { x = (fr() * 2 - 1) * 86; z = 14 + fr() * 86; }
        x = Math.min(88, Math.max(-88, x)); z = Math.min(100, Math.max(12, z));
        a.set([x, z, trk, fr()], i * 4); b.set([fr(), (0.2 + fr() * 0.2) * (fr() < 0.5 ? -1 : 1), 1.4 + fr() * 0.3, fr()], i * 4);
      }
      addQuads({ aA: a, aB: b, aC: c }, nFish, HEAD + /* glsl */`
        attribute vec4 aA; attribute vec4 aB; attribute vec4 aC; varying vec2 vQ; varying vec4 vK;
        void main(){
          float ang = uTime * aB.y + aA.w * 6.2831853, R = aB.z;
          float dive = .2 + .8 * sin(uTime * (.55 + .4 * aB.w) + aB.x * 6.2831853);                 // 1 up through the surface, -1 under
          vec3 C = vec3(aA.x + cos(ang) * aA.z, .4 + R * .2 + aC.x * max(dive, 0.) + R * 1.5 * min(dive, 0.), aA.y + sin(ang) * aA.z);          // right under, then clear of the surface
          vec3 tc = uCamL - C; float d = max(length(tc), .5);
          vec3 r = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.));
          float pxM = d * 2. * uTanHalf / max(uViewH, 1.), hs = R + pxM;
          float roll = -ang * aA.z / max(R, .1) * .6 - uTime * .5;
          vQ = position.xy * hs; vK = vec4(R, pxM, roll, dive);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(C + r * vQ.x + vec3(0., vQ.y, 0.), 1.);
        }`, HEAD + /* glsl */`
        varying vec2 vQ; varying vec4 vK;
        void main(){
          float R = vK.x, px = vK.y; vec2 q = clamp(vQ, -(R + px), R + px);          // the across coordinate, held to the quad's own extent before it is squared
          float r = length(q), rn = r / max(R, .1);
          float cw = max(.06, 1.4 * px);
          float th = atan(q.y + 1e-5, q.x + 1e-5) + vK.z;
          // the outline: a disc with one arm unfurled as a tail, so it reads as a wheel with a flipper and never as a meadow disc
          float tt = fract(th / 6.2831853) * 6.2831853, kt = tt / 2.4;
          float dTail = tt < 2.4 ? (.27 * (1. - kt) + .012) - abs(rn - (.5 + .44 * kt)) : -1.;
          float dd = max(.64 - rn, dTail) * R;
          if (dd < -px * .5) discard;
          float wind = 5.2 + .785 * vK.w;                                                 // it unwinds a quarter turn as it dives
          float s = fract((th - rn * wind) / 3.14159265);                                 // two arms
          vec3 col = s < .5 ? uInk[5] : uInk[0];
          col = (abs(s - .5) < .06 || s < .06 || s > .94) ? uInk[9] : col;                // the arms are parted by a drawn line
          col = rn < .17 ? uInk[3] : (rn < .23 ? uInk[1] : col);
          col = (rn > .52 && dd > cw) ? (dTail > .64 - rn ? (kt > .55 ? uInk[1] : uInk[3]) : uInk[3]) : col;   // a black tyre and tail, the tail tipped pale
          gl_FragColor = vec4(dd < cw ? uInk[9] : col, 1.);
        }`);
      await ctx.yield();
    }

    // loose flakes of leaf blowing through in sheets, and silver rain far off in three places (additive, no depth write)
    {
      const ar = wr.fork ? wr.fork('air') : wr;
      const nFl = Math.round(800 * detail), nRain = Math.round(600 * detail), n = nFl + nRain, a = new Float32Array(n * 4), b = new Float32Array(n * 4);
      for (let i = 0; i < nFl; i++) { a.set([ar(), ar(), ar(), 0], i * 4); b.set([ar(), 0.1 + 0.16 * ar(), 0.6 + 0.8 * ar(), ar()], i * 4); }
      const places = [V(-260, 0, 1500), V(-1250, 0, 760), V(1150, 0, 1050)];
      for (let i = nFl; i < n; i++) {
        const c = places[i % 3], ang = ar() * TAU, d = Math.sqrt(ar()) * 190;
        a.set([c.x + Math.cos(ang) * d, ar() * 430, c.z + Math.sin(ang) * d, 1], i * 4); b.set([ar(), 0.45, 0.8 + 0.5 * ar(), ar()], i * 4);
      }
      addQuads({ aA: a, aB: b }, n, HEAD + /* glsl */`
        attribute vec4 aA; attribute vec4 aB; varying vec2 vQ; varying vec2 vK;
        void main(){
          vec3 C; vec2 hs; float k = 1.; vec3 rr, uu;
          if (aA.w < .5) {                                        // a flake: wrapped in a box that travels with the eye
            vec3 box = vec3(110., 46., 110.);
            vec3 q = aA.xyz * box + vec3(5.5, -.7, 3.2) * uTime * aB.z + vec3(0., 3. * sin(uTime * .8 + aB.w * 20.), 0.);
            C = uCamL + mod(q - uCamL + box * .5, box) - box * .5;
            float sheet = sin(dot(C.xz, vec2(.045, .028)) - uTime * .9 + C.y * .05);    // gusts carry them through in sheets
            k = smoothstep(.1, .7, sheet) * smoothstep(3., 9., length(C - uCamL));
            float tu = uTime * (2. + 3. * aB.x) + aB.w * 40.;
            rr = normalize(vec3(cos(tu), .3 * sin(tu * .7), sin(tu))); uu = normalize(cross(rr, vec3(.3 * sin(tu * 1.3), 1., .2)) + vec3(0., 1e-4, 0.));
            hs = vec2(aB.y);
          } else {                                                // a rain dash: far off, falling
            C = vec3(aA.x, mod(aA.y - uTime * 60. * aB.z, 430.) + 20., aA.z);
            vec3 tc = uCamL - C; rr = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.)); uu = vec3(0., 1., 0.);
            hs = vec2(aB.y, 9. + 9. * aB.x);
          }
          float pxM = max(length(uCamL - C), .5) * 2. * uTanHalf / max(uViewH, 1.);
          vec2 h2 = max(hs, vec2(pxM * .8));
          k *= min(1., hs.x / max(h2.x, 1e-4));
          vQ = position.xy; vK = vec2(k, aA.w);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(C + rr * position.x * h2.x + uu * position.y * h2.y, 1.);
        }`, HEAD + /* glsl */`
        uniform vec3 uRainInk; varying vec2 vQ; varying vec2 vK;
        void main(){
          vec3 col = vK.y < .5 ? uInk[1] * .55 : uRainInk * .8;
          gl_FragColor = vec4(col * clamp(vK.x, 0., 1.), 1.);
        }`, { uRainInk: { value: inkOf('#C9CCD0') } }, true);
      await ctx.yield();
    }

    // a tributary: a brook of the same upright rectangles crosses the bank under the flight's sweep and joins the river at the brink
    {
      const kr = wr.fork ? wr.fork('brook') : wr;
      const line = new THREE.CatmullRomCurve3([V(-446, 0, -384), V(-320, 0, -350), V(-220, 0, -300), V(-150, 0, -230), V(-110, 0, -160), V(-95, 0, -105),
        V(-113, 0, -62), V(-127, 0, -27), V(-121, 0, -6), V(-91, 0, -4)], false, 'centripetal');
      const NS = 48, samples = [], len = line.getLength(), tmp = new THREE.Vector3();
      for (let i = 0; i < NS; i++) { line.getPointAt(i / (NS - 1), tmp); const t = i / (NS - 1); samples.push(new THREE.Vector3(tmp.x, tmp.z, 8 + 6.5 * smooth(0.3, 0.5, t) - 6 * smooth(0.8, 1, t))); }
      const ranks = Math.round(len / 2.6), lanes = 12, n = ranks * lanes, a = new Float32Array(n * 4);
      for (let r = 0; r < ranks; r++) for (let l = 0; l < lanes; l++) {
        const k = kr();
        a.set([((l + 0.5) / lanes * 2 - 1) + (kr() - 0.5) * 0.06, (r + 0.08 * (kr() - 0.5)) / ranks, kr(), k < 0.36 ? 0 : k < 0.72 ? 1 : 2], (r * lanes + l) * 4);
      }
      addQuads({ aA: a }, n, HEAD + /* glsl */`
        attribute vec4 aA; uniform vec3 uBrook[48]; uniform float uBrookRate; varying vec2 vQ; varying vec4 vK;
        void main(){
          float s = fract(aA.y + uTime * uBrookRate), f = s * 47., fi = floor(min(f, 46.)), k = f - fi;
          int i = int(fi);
          vec3 p0 = uBrook[i], p1 = uBrook[i + 1];
          vec2 c = mix(p0.xy, p1.xy, k), tg = normalize(p1.xy - p0.xy + vec2(1e-5, 0.)), nr = vec2(-tg.y, tg.x);
          float hw = mix(p0.z, p1.z, k);
          vec3 base = vec3(c.x + nr.x * aA.x * hw, 250.05, c.y + nr.y * aA.x * hw);
          vec3 tc = uCamL - base; float d = max(length(tc), .5);
          vec3 r = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.)), Tx0 = vec3(nr.x, 0., nr.y);
          float abeam = abs(dot(normalize(vec3(tc.x, 0., tc.z) + vec3(1e-4, 0., 0.)), Tx0));          // edge-on to the eye: turn part way to it
          vec3 Tx = normalize(mix(Tx0 * (dot(Tx0, r) < 0. ? -1. : 1.), r, .75 * smoothstep(.35, .95, abeam)));
          float pxM = d * 2. * uTanHalf / max(uViewH, 1.), cw = min(max(.05, 1.6 * pxM), .135);
          float sc = smoothstep(0., .03, s) * (1. - smoothstep(.955, .995, s));
          vec2 ext = vec2(.3, .8) + cw + pxM;
          vQ = position.xy * ext; vK = vec4(aA.w, pxM, cw, step(aA.z * .3 + .5, uGold));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(base + vec3(0., .8 * sc, 0.) + (Tx * vQ.x + vec3(0., vQ.y, 0.)) * sc, 1.);
        }`, HEAD + /* glsl */`
        varying vec2 vQ; varying vec4 vK;
        void main(){
          vec2 q = abs(vQ); float dd = min(.3 - q.x, .8 - q.y) + vK.z;                 // metres inside the umber edge's outer line
          if (dd < 0.) discard;
          vec3 body = vK.x < .5 ? uInk[3] : (vK.x < 1.5 ? uInk[4] : uInk[7]);
          vec3 line = vK.x < .5 ? uInk[7] : (vK.x < 1.5 ? uInk[7] : uInk[4]);
          body = mix(body, uInk[1], vK.w); line = mix(line, uInk[3], vK.w);            // the rare gold rank: pale gold with a black inner band
          float inner = min(.3 - q.x, .8 - q.y), fine = step(vK.y, .05);
          float lo = mix(.075, .06, vK.w), hi = mix(.105, .2, vK.w);
          vec3 col = (inner > lo && inner < hi) ? mix(body, line, max(fine, vK.w)) : body;
          gl_FragColor = vec4(dd < vK.z ? uInk[9] : col, 1.);
        }`, { uBrook: { value: samples }, uBrookRate: { value: 7 / len } });
      await ctx.yield();
    }
    // ==== CAST ====

    // ---- gaze, pace and the contract ----
    const tmpP = new THREE.Vector3(), tmpQ = new THREE.Vector3();
    // ---- the tour: ONE scripted gaze from the river run to the pool, set out as keys (u, heading, pitch) ----
    // Headings are in the canonical layout (0 = downstream, 90 = toward the dark robe) and only ever increase: the look goes
    // once round. Most keys are bearings taken from where the flight is at that u (so moving the path moves them with it):
    // the scroll tree at the brink held whole as the flight comes up to it, the lower country as it opens, the dark robe
    // whole (uR), round at one even rate to the falls (uF), the falls held head on and then three-quarter; then, down the
    // dive and along the pass in front of the falling tiles, out over the lower country and round over the pool to both
    // robes. Every key is the first crew's own, as that crew wrote it (firstKeys, below); there the tour lets go as that
    // crew's did (uTourEnd) and the look is the engine's own. Before the brink the tour runs through those keys as they
    // stand; from the brink (uBrink) on it is laid out again from them with a key every 3 m of the route (kOn) under one
    // cap, 9.5 degrees of heading in 15 m of the route (a hundredth of it). Both angles then run on a monotone cubic, so
    // nothing overshoots. It is ONE poi of weight 1, listed first, so until the pool the flying camera looks exactly
    // where this says; the ring and the dark robe are listed after it, as that crew listed them, and pull on top of it
    // where their stretches lie. The steady camera takes a third of each poi and so a third of this one; nothing else
    // pulls it round.
    const uTourEnd = uFoot + 0.03, DEG = Math.PI / 180;
    const gP = new THREE.Vector3(), gA = new THREE.Vector3(), gT = new THREE.Vector3(), gV = new THREE.Vector3(), gOut = new THREE.Vector3();
    const valleyAt = V(100, -40, 318);
    const valleyKey = (u) => {                             // down the valley: a pull of 0.55 toward a point beyond the peaks
      const d0 = u * path.length; path.posAtDist(d0, gP); path.posAtDist(d0 + 22, gA); gT.subVectors(gA, gP).normalize();
      gV.subVectors(valleyAt, gP).normalize().multiplyScalar(0.55).addScaledVector(gT, 0.45).normalize();
      return [u, Math.atan2(gV.x * sd, gV.z), Math.max(-30 * DEG, Math.asin(Math.max(-1, Math.min(1, gV.y))))];
    };
    const tangentKey = (u) => { const d0 = u * path.length; path.posAtDist(d0, gP); path.posAtDist(d0 + 22, gA); gT.subVectors(gA, gP).normalize(); return [u, Math.atan2(gT.x * sd, gT.z), Math.asin(Math.max(-1, Math.min(1, gT.y)))]; };
    // a key that bears on a point (canonical x): dh degrees to the far side of it, at a given pitch (or the point's own)
    const key = (u, x, y, z, dh, p) => { path.pointAt(u, gP); const dx = x - gP.x * sd, dz = z - gP.z; return [u, Math.atan2(dx, dz) + dh * DEG, p === undefined ? Math.atan2(y - gP.y, Math.hypot(dx, dz)) : p * DEG]; };
    const dM = dark.base.clone().lerp(dark.crown, 0.45), bM = bright.base.clone().lerp(bright.crown, 0.45);
    const kRobe = key(uR, dM.x * sd, dM.y, dM.z, 13, -13), kFalls = key(uF, 0, 126, 0, -11, -24);
    while (kFalls[1] < kRobe[1]) kFalls[1] += TAU;
    const onLine = (t) => [uR + (uF - uR) * t, kRobe[1] + (kFalls[1] - kRobe[1]) * t, kRobe[2] + (kFalls[2] - kRobe[2]) * t];
    const pchip = (xs, ys) => {                             // monotone cubic through the keys: no overshoot between them
      const n = xs.length, d = [], m = new Array(n);
      for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
      m[0] = d[0]; m[n - 1] = d[n - 2];
      for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
      return (x) => {
        if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
        let i = 0; while (x > xs[i + 1]) i++;
        const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (3 * t2 - 2 * t3) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
      };
    };
    // THE DIVE AND THE PASS (round 4e): the look is the first crew's again. Down the dive it looks OUT: the curtain down one
    // side of the frame and the whorl robe across the pool, then round over the flower river to both robes with the open
    // leaf between them. firstKeys are that crew's own keys, every one of them as that crew wrote it (bearings taken from
    // where the flight is), and hFirst and pFirst run through them: that crew's look, whole.
    const kHold = key(0.63, bM.x * sd, 0, bM.z, -37, -14), kPool = key(0.7, dM.x * sd, 0, dM.z, -33, -6);
    while (kPool[1] < kHold[1]) kPool[1] += TAU;
    const toPool = (i) => [0.63 + 0.015 * i, kHold[1] + (kPool[1] - kHold[1]) * 0.22 * i, kHold[2] + (kPool[2] - kHold[2]) * 0.2 * i];
    const firstKeys = [
      tangentKey(0.05), tangentKey(0.08), [0.14, 14 * DEG, 6 * DEG], [0.168, 16 * DEG, 6 * DEG], [0.2, 20 * DEG, -10 * DEG],   // the scroll tree at the brink, whole, as the flight comes up to it
      valleyKey(uBrink + 0.03),                                                    // the lower country opens
      kRobe, onLine(0.25), onLine(0.5), onLine(0.75), kFalls,                    // the dark robe whole, then round to the falls at an even rate
      key(0.47, 0, 126, 0, -8, -21), key(0.5, 0, 126, 0, -4, -17), key(0.52, 0, 126, 0, -1, -15),   // the falls held, head on then three-quarter
      key(0.58, bM.x * sd, 0, bM.z, -50, -17),
      key(0.61, bM.x * sd, 0, bM.z, -41, -16), kHold,                             // the curtain down one side, the whorl robe across the pool
      toPool(1), toPool(2), toPool(3), toPool(4), kPool, key(0.735, dM.x * sd, 0, dM.z, -30, -2),   // round at an even rate to both robes over the pool
    ];
    for (let i = 1; i < firstKeys.length; i++) { while (firstKeys[i][1] < firstKeys[i - 1][1] - 0.3) firstKeys[i][1] += TAU; firstKeys[i][1] = Math.max(firstKeys[i][1], firstKeys[i - 1][1]); }
    const hFirst = pchip(firstKeys.map((k) => k[0]), firstKeys.map((k) => k[1])), pFirst = pchip(firstKeys.map((k) => k[0]), firstKeys.map((k) => k[2]));
    // Before the brink (uBrink) the tour is those keys as they stand; from the brink to
    // the last of them it goes with them, with a key every STEP metres of the route (kOn). Where they turn faster than TURN
    // in a hundredth of the route the tour starts a little early and arrives a little late (half the excess each side), so
    // no stretch of that length turns more than TURN. The pitch moves only as much as keeps the whole turn (the turn as the
    // eye sees it at that pitch, and the pitch) under WHOLE in a hundredth of the route.
    const STEP = 3, perStep = STEP / (0.01 * path.length), TURN = 9.5 * DEG * perStep, WHOLE = 9.6 * DEG * perStep;
    const kOn = [];
    {
      const uLast = firstKeys[firstKeys.length - 1][0], L = [];
      for (let m = uBrink * path.length; m < uLast * path.length; m += STEP) L.push([m / path.length, hFirst(m / path.length), pFirst(m / path.length)]);
      L.push([uLast, hFirst(uLast), pFirst(uLast)]);
      const n = L.length, late = new Array(n), early = new Array(n);
      for (let i = 0; i < n; i++) late[i] = i ? Math.max(late[i - 1], Math.min(L[i][1], late[i - 1] + TURN)) : L[0][1];
      for (let i = n - 1; i >= 0; i--) early[i] = i < n - 1 ? Math.max(L[i][1], early[i + 1] - TURN) : L[i][1];
      for (let i = 0, h = L[0][1], pt = L[0][2]; i < n; i++) {
        const was = h; h = Math.max(was, 0.5 * (late[i] + early[i]));
        const turned = (h - was) * Math.cos(pt), room = i ? Math.sqrt(Math.max(WHOLE * WHOLE - turned * turned, 0)) : 1;
        pt += Math.max(-room, Math.min(room, L[i][2] - pt));
        kOn.push([L[i][0], h, pt]);
      }
    }
    const K = [
      ...firstKeys.filter((k) => k[0] < uBrink),                                 // before the brink: the first crew's keys as they stand
      ...kOn,                                                                    // from the brink on: the same keys under the cap, a key every 3 m of the route
    ];
    for (let i = 1; i < K.length; i++) { while (K[i][1] < K[i - 1][1] - 0.3) K[i][1] += TAU; K[i][1] = Math.max(K[i][1], K[i - 1][1]); }   // once round, never back
    const hAt = pchip(K.map((k) => k[0]), K.map((k) => k[1])), pAt = pchip(K.map((k) => k[0]), K.map((k) => k[2]));
    const tour = (u) => {
      const h = hAt(u), pt = pAt(u), cp = Math.cos(pt); path.pointAt(u, gP);
      return gOut.set(Math.sin(h) * cp * sd, Math.sin(pt), Math.cos(h) * cp).multiplyScalar(300).add(gP);
    };
    const tourGaze = (time, u) => tour(u);
    // linger on the valley, on the falls and on their face; the sweep between them is flown at an even, unhurried pace
    const pace = (u) => 1.15 - 0.4 * smooth(uBrink - 0.03, uBrink + 0.02, u) + 0.15 * smooth(uR - 0.01, uR + 0.03, u) - 0.35 * smooth(uF - 0.02, uF + 0.02, u)
      + 0.3 * smooth(0.5, 0.54, u) - 0.1 * smooth(uFace - 0.03, uFace, u) + 0.15 * smooth(uFoot - 0.03, uFoot + 0.03, u) + 0.2 * smooth(uFoot + 0.05, uFoot + 0.1, u) - 0.1 * smooth(0.9, 0.97, u);
    return {
      scene, path, duration: 58, pace,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 22, sway: 0.5, bank: 0.4 },
      pois: [
        { at: tourGaze, from: 0.03, to: uTourEnd, weight: 1, fade: 0.08 },             // valley, sweep, falls: the flying camera's gaze
        { at: seat.clone(), from: uFoot - 0.05, to: 1, weight: 0.6, fade: 0.12 },           // the ring, from the pool on
        { at: dark.base.clone().lerp(dark.crown, 0.5), from: 0.845, to: 0.93, weight: 0.62, fade: 0.35 },   // once, on the last straight, up the whole height of the dark robe
      ],
      portal: { shape: 'circle', radius: RING, color: '#ffe9b0', glow: 0.8, revealDistance: 300 },
      // flat authored colour: the tone map is skipped, every ink is at or under 1 and only the blazing leaf is over the bloom threshold
      post: { flat: 1, exposure: 1, bloom: { strength: 0.5, radius: 0.4, threshold: 1.15 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0.012, aberration: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);
        // the rare gold rank, keyed to this flight: down the river by the brink, a gold band at the curtain's top in the portrait,
        // the front coming down beside us on the 8 m pass, then out across the meadow
        if (hero.variant.rare) hero.setRare(0.3 + 0.7 * rampL(0, uBrink, u) + 0.6 * rampL(uTop - 0.06, uFace, u) + 0.4 * rampL(uFace, uFoot - 0.03, u) + 1.05 * rampL(uFoot, 0.94, u));
        for (let i = 0; i < updaters.length; i++) updaters[i](dt, time, camera, u);
      },
      dispose() { hero.dispose(); },
    };
  },
};
