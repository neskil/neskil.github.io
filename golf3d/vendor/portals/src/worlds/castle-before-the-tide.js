// CASTLE BEFORE THE TIDE. Early morning on a tidal beach at sand-hopper height: a drip-castle cathedral inside three
// moats, raked by a low sun, while the tide comes back. One material in two states (wet dark ochre, dry pale biscuit,
// never between), shadow the only draughtsman, three accents (glass-green water, white foam, cockles).
// +Z is the course, +X is port and the sea. Everything is shaded by the style in ../parts/castle-before-the-tide.js;
// post is flat (the pigments written are the pigments shown), nothing blooms.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, sunDirection, STYLE_GLSL, SHADOW_GLSL } from '../parts/castle-before-the-tide.js';
import { makeRng, hashSeed } from '../kit/core.js';
import { plumeMesh } from '../parts/castle-before-the-tide.js';

const T_END = 42;                       // journey seconds
const CZ = 385, K = 0.76;               // the castle is a family of ovals round (0, CZ), K as wide as long
const R_COURT = 161, R_CURT = 166, R_W2 = 235, R_W1 = 315, R_M = [340, 258, 193];
const TAU = Math.PI * 2;
const hyp = (a, b) => Math.sqrt(a * a + b * b);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// the editions (sand, cast) and the hours; see "variations" in the brief
const SANDS = {
  ochre: { name: 'Castle Before the Tide', pal: ['#8E6A3A', '#E6D3AA', '#5C6078', '#86C9B4', '#F7F3E8', '#C6D8E2', '#C98A6B'] },
  pewter: { name: 'Castle Before the Tide: Black Sand', shK: 0.12, pal: ['#44413C', '#B4B5AE', '#454A66', '#9CCDB8', '#F3F4EE', '#C6D8E2', '#C98A6B'] },
  bone: { name: 'Castle Before the Tide: Shell Sand', pal: ['#B59E7E', '#F6EEDD', '#6A7192', '#7FD3CF', '#FFFFFF', '#C6D8E2', '#C98A6B'] },
};
const HOURS = {
  morning: { elev: 12, skyLo: '#EEF1EC', skyHi: '#B7CEDD', dry: 0, shade: 1 },
  dawn: { elev: 5.5, skyLo: '#F3E9E2', skyHi: '#AFC3D9', dry: -0.12, shade: 1 },
  day: { elev: 26, skyLo: '#EEF3F2', skyHi: '#9FC6E4', dry: 0.14, shade: 1 },
  night: { elev: 14, skyLo: '#3A4A66', skyHi: '#131B33', dry: -0.05, shade: 0.5 },
};

// smooth beach: falls 1 in 40 to port, lifts 1 in 60 to starboard (the same function as cbtBase in the style)
const baseY = (x) => Math.max(x > 0 ? -x * 0.025 - 1.4 * sstep(3, 24, x) : Math.min(-x / 60, 5), -12);
const oval = (x, z) => { const qx = x / K, qz = CZ - z; return [hyp(qx, qz), Math.atan2(qx, qz)]; };

// THE GROUND as hands left it: beach, three finger-dragged moats with spoil levees, three patted walls with gates,
// the sand bridge, the ramp and the court. Returns [y, yAfterSlump, slumpSecond]. noise = ctx.noise.
function makeGround(noise, slumps) {
  const wall = (s, half, h) => { const run = h * 0.27, a = Math.abs(s) - half; return a <= 0 ? h : a >= run ? 0 : h * (1 - a / run); };
  const fan = (s, half, h) => 0.24 * h * (1 - sstep(0, half + 6 + h * 0.9, Math.abs(s)));
  const moat = (s, x, z) => {                                     // s = metres from the moat's centre line, outward positive
    const a = Math.abs(s);
    let d = a < 5 ? 5 + 0.55 * Math.cos((s / 2.5) * TAU) * (0.7 + 0.3 * noise.n2(x * 0.05, z * 0.05)) : a < 7.4 ? 5 * (1 - sstep(5, 7.4, a) ** 1.4) : 0;
    const lv = s > 6.8 && s < 13.8 ? (0.75 + 0.8 * (0.5 + 0.5 * noise.n2(x * 0.11, z * 0.11)) + 0.3 * noise.n2(x * 0.37, z * 0.37)) * Math.max(0, 1 - Math.abs(s - 10.2) / 3.4) : 0;   // a ragged levee of spoil on the outer lip, under 34 degrees
    return lv - d;
  };
  return (x, z) => {
    const [rho, th] = oval(x, z), ax = Math.abs(x);
    const und = 0.2 * noise.fbm2(x * 0.021, z * 0.021, 3) + 0.07 * noise.n2(x * 0.13, z * 0.13);
    let y = baseY(x) + und * sstep(150, 175, rho), yF, tS = 1e6, br = 0;
    // moats: crescents bowing toward the course, tapering out at both horns (the port horns run down into the sea)
    const horn = [0.86, 0.98, 1.25], bridge = [1, 1, sstep(4.5, 8, ax)];
    for (let i = 0; i < 3; i++) {
      let s = rho - R_M[i]; if (i === 2 && s > 0) s *= 0.62;      // moat 3 is dug wider on its outer side, the side we come from
      if (Math.abs(s) > 14) continue;
      const taper = (1 - sstep(horn[i] - 0.1, horn[i], Math.abs(th))) * (i === 2 && th > -0.4 && th < 0.4 ? bridge[i] : 1);
      y += moat(s + 1.3 * noise.n2(x * 0.03, z * 0.03), x, z) * taper;
    }
    yF = y;
    // walls: patted banks, faces at 75 degrees, with a gate 18 m wide on the axis
    const gate = sstep(8.6, 10.2, ax) + (th > 1.5 || th < -1.5 ? 1 : 0);
    const dent = 0.55 * noise.n2(th * rho * 0.19, rho * 0.9) + 0.25 * noise.n2(th * rho * 0.5, rho * 2.1);
    const W = [[R_W1, 2.1, 5, 0.66], [R_W2, 2.5, 8, 0.9], [R_CURT + 1.5, 2.3, 10.5, 9]];
    for (let i = 0; i < 3; i++) {
      const [rc, half, h0, span] = W[i], s = rho - rc; if (Math.abs(s) > 20) continue;
      const h = h0 * (1 + 0.1 * noise.n2(th * rc * 0.02, i * 7.1)) * Math.min(1, gate) * (1 - sstep(span - 0.07, span, Math.abs(th)));
      const top = (i === 2 ? Math.max(h + Math.min(baseY(x), 0.5), 11.2 * Math.min(1, gate)) - baseY(x) : h);
      const wy = baseY(x) + wall(s + dent, half, top);
      let wyF = baseY(x) + fan(s, half, top) + und;
      let sl = 1e6;
      for (const q of slumps) if (q.wall === i && th > q.a - 0.012 && th < q.b + 0.012) { const dd = q.d ?? 1.6; sl = q.t + Math.abs(dd) * (dd < 0 ? q.b - th : th - q.a) / (q.b - q.a) + 0.4 * noise.n2(th * 90, 3.3);      // (d < 0: it goes from the b end)
        if (q.breach) br = sstep(q.a - 0.012, q.a + 0.03, th) * (1 - sstep(q.b - 0.03, q.b + 0.012, th)); }
      if (sl > 1e5) wyF = Math.max(wy, y); else tS = sl;
      yF = Math.max(yF, wyF); y = Math.max(y, wy);
    }
    // the court (a table at y 8), the ramp through gate 3 and the hollow the mound sits in
    const inC = 1 - sstep(R_COURT - 1.5, R_COURT + 3.5, rho);
    const onRamp = z < CZ && rho < 210 && ax < 16, rampH = 1 + 7 * sstep(186, 160, rho), rampA = ax + 0.6 * Math.sin(z * 0.31 + (x > 0 ? 3.4 : 1.3)) + 0.4 * Math.sin(z * 0.83 + (x > 0 ? 0.5 : 2.6)) - 5.0;      // (its edges wander a metre either way: sines, so that the water's film can follow them)
    // a patted causeway: flat crown ten metres wide, sides at seventy degrees, and at their foot a ragged skirt of
    // crumbs lying at the angle of repose (thirty degrees: it dries pale)
    const skA = onRamp ? rampA + 1.5 * noise.n2(z * 0.16 + (x > 0 ? 31 : 0), 2.5) + 0.5 * noise.n2(z * 0.6, x > 0 ? 7.5 : 3.5) : 99;
    const skirt = Math.min(0.32 * rampH, Math.max(0, 0.32 * rampH + 0.4 - Math.max(0, skA) / 1.7));
    const ramp = onRamp ? (rampA <= 0 ? rampH : Math.max(skirt, rampH - rampA / 0.36)) : 0;
    let c = 8 + 0.12 * noise.n2(x * 0.05, z * 0.05);
    const lx = Math.abs(x), lz = 402 - z, inHero = Math.min(sstep(90, 86, lx), sstep(-133, -129, lz), sstep(129, 125, lz));
    c -= 0.75 * inHero;
    const rampY = onRamp ? ramp * sstep(205, 187, rho + 3 * noise.n2(x * 0.25, z * 0.25)) : 0;      // (it runs out raggedly onto the sand bridge)      // only where there is a ramp (max(y, 0) used to fill every moat and level the port beach)
    if (rampY > 0.001) { y = Math.max(y, rampY + Math.min(baseY(x), 0)); yF = Math.max(yF, rampY + Math.min(baseY(x), 0)); }
    if (inC > 0) { y = lerp(y, Math.max(c, y * (rho > R_COURT ? 1 : 0)), inC); yF = lerp(yF, Math.max(c, yF * (rho > R_COURT ? 1 : 0)), inC); }
    // the breach: where that length goes, the edge of the court washes out with it into a fan from the court down under the sea
    if (br > 0) yF = lerp(yF, Math.max(8.1 - 8.9 * sstep(146, 189, rho) + 0.3 * noise.n2(x * 0.09, z * 0.09), baseY(x) + 0.3), br);
    return [y, yF, tS];
  };
}

// rows (oval radius) and columns (angle) of the ground: dense through moats and walls and along the course
function groundRows() {
  const r = [];
  const run = (a, b, step) => { const n = Math.max(1, Math.round((b - a) / step)); for (let i = 0; i < n; i++) r.push(a + (b - a) * i / n); };
  // (down to the pole: a first ring of 3 m left a hole in the nave's water)
  r.push(0.04); run(3, 157, 12); run(157, 176, 1.1);
  run(176, 183, 1.45); run(183, 215, 1.45); run(215, 229, 3.5); run(229, 242, 1.1); run(242, 247, 2.5);
  run(247, 273, 1.4); run(273, 308, 4.0); run(308, 322, 1.1); run(322, 329, 2.4); run(329, 355, 1.4); run(355, 400, 4.5);
  for (let v = 400; v < 3300; v = v * 1.2 + 1) r.push(v);
  return r;
}
function groundCols() {
  const half = []; let t = 0, st = 0.006;
  while (t < Math.PI) { half.push(t); if (t > 0.2) st *= 1.095; t += st; }
  half.push(Math.PI);
  // on the port bow, where a length of the curtain is breached while we look, the columns are 3 m apart
  const port = half.filter((v) => v < 0.47 || v > 0.9); for (let v = 0.48; v < 0.895; v += 0.02) port.push(v); port.sort((a, b) => a - b);
  return [...half.slice(1).reverse().map((v) => -v), ...port];
}

export default {
  id: 'castle-before-the-tide',
  name: 'Castle Before the Tide',
  category: 'ocean',
  weirdness: 0.15,
  media: ['tiny', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx;
    await ctx.yield();                      // the module has only just been read: let that step end before building
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), vary = ctx.vary ?? {}, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const rare = !!vary.rare;
    const scene = new THREE.Scene();

    // ---- the edition: sand, cast, weather, hour
    const sandId = rng.pick(['ochre', 'ochre', 'ochre', 'pewter', 'bone']);
    const cast = rng.pick(['cockles', 'cockles', 'razors', 'seaglass']);
    const weather = rng.pick(['clear', 'clear', 'fret', 'breeze']);
    const hourPick = rng.pick(['morning', 'morning', 'morning', 'dawn', 'day']);
    const hourId = vary.hour === 'dawn' ? 'dawn' : vary.hour === 'day' ? 'day' : vary.hour === 'night' ? 'night' : vary.hour === 'golden' ? 'morning' : hourPick;
    const hour = HOURS[hourId], pal = SANDS[sandId].pal.slice();
    const C = (h) => new THREE.Color(h);
    const moon = (h, k) => { const c = C(h), l = c.r * 0.3 + c.g * 0.5 + c.b * 0.2; return '#' + new THREE.Color(l * 0.50 * k, l * 0.62 * k, l * 0.92 * k).getHexString(); };
    const pig = (h) => (hourId === 'night' ? moon(h, 0.9) : h);      // any other pigment, as this hour's light shows it
    if (hourId === 'night') {            // a low full moon in the sun's place: silver-blue, sheen and mirrors doing the work
      pal[0] = moon(pal[0], 0.75); pal[1] = moon(pal[1], 0.98); pal[2] = '#0E1430'; pal[3] = moon(pal[3], 0.8); pal[4] = '#C9D6EE'; pal[6] = moon(pal[6], 1);
    }
    const sunW = sunDirection(hour.elev, 100);
    const sunLocal = new THREE.Vector3(-sunW.x, sunW.y, -sunW.z);
    const skyLo = C(hour.skyLo), skyHi = C(hour.skyHi);
    if (weather === 'fret') { skyHi.lerp(skyLo, 0.55); }

    // the court's water: its level by the journey second (the tide sets it below), and the highest it stands during
    // the flight. The hero is told that height above the court's table, y 8, on which it stands (its own y 0), so that
    // no cone of it is set down where that water will lie.
    const courtLevel = (T) => 8.4 + (rare ? 0.6 * sstep(21, 29, T) : 0);
    let courtTop = -1e9; for (let i = 0; i <= T_END * 4; i++) courtTop = Math.max(courtTop, courtLevel(i / 4));
    // ---- THE COURSE: level over the beach and through two gates, the sand bridge, up the ramp, out over the court,
    // up beside the growing spire, down into the nave and straight to the shell-ringed mouth (the hero's own line).
    // It is laid while the hero is built: the hero asks for it once, as soon as its own line through the nave is
    // known, because its spires carry trickles by how far they stand from the course. The answer sets the hero in its
    // place on the court, makes the path and gives the course's line as points along the route, one every 2 m of
    // route or less (their number comes from the route's own length).
    let path = null;
    const coursePts = [];
    const layCourse = (object, flyThrough, seatAt) => {
      object.position.set(0, 8, 402); object.rotation.y = Math.PI; object.updateMatrixWorld(true);
      const ft = flyThrough.map((v) => object.localToWorld(v.clone())), seat = object.localToWorld(seatAt.clone());
      const pathPts = [[0, 2.3, 0], [0, 2.3, 32], [0, 2.35, 62], [0, 3.0, 104], [0, 10.2, 146], [0, 11.6, 170], [0, 12.2, 192], [0, 16.4, 208], [0, 21.0, 224],
        ft[1], ft[2], ft[3], ft[4], ft[5], ft[6], ft[7], [0, seat.y, lerp(ft[7].z, seat.z, 0.2)], [0, seat.y, lerp(ft[7].z, seat.z, 0.6)], seat];
      path = makePath(pathPts.map((p) => (p.isVector3 ? [p.x, p.y, p.z] : p)));
      const steps = Math.ceil(path.length / 2);
      for (let i = 0; i <= steps; i++) coursePts.push(path.pointAt(i / steps));
      return coursePts;
    };
    // ---- the hero: the Drip Cathedral, on the court (in the dry breeze its finished tips stream; in the clear and in the fret they do not)
    await ctx.yield();
    const hero = await buildHero(ctx, { palette: pal, detail, sun: sunLocal, clockSlack: [1, 1.5], waterTop: courtTop - 8, breeze: weather === 'breeze', course: layCourse });
    // the style's uniforms belong to THIS build (the hero makes a fresh set), and so do the materials made from them
    const U = hero.style.uniforms, sandMaterial = hero.sandMaterial, slumpDepthMaterial = hero.slumpDepthMaterial;
    U.uBleach.value = weather === 'fret' ? 240 : hourId === 'dawn' ? 900 : 1110;
    U.uShK.value = SANDS[sandId].shK ?? 0.6;      // black sand: its shadow must stay darker than its lit face
    // (the hero was set in its place when the course was laid; everything built on it since takes that place now)
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    U.uSkyLo.value.copy(skyLo); U.uSkyHi.value.copy(skyHi);
    U.uFoamW.value.set(pal[4]);
    hero.setSun(sunW, new THREE.Vector3(30, 30, 285), 300, 700);
    { const sc = hero.sun.shadow.camera; sc.top = 190; sc.bottom = -150; sc.updateProjectionMatrix(); }
    hero.sun.shadow.needsUpdate = true;
    const toWorld = (v) => hero.object.localToWorld(v.clone());
    // the starboard file stands against the sun: we only ever see its shaded side close to, so its shadow (the bars
    // across the nave and the port file) is cast by a light stand-in, a slightly shrunken copy of the hero's
    // silhouette rings, instead of its 49k triangles
    { const rg = hero.reflection.geometry, rp = rg.attributes.position, ri = rg.index, P = [], I = [], map = new Int32Array(rp.count).fill(-1);
      for (let r = 0; r < rp.count / 6; r++) {
        let cx = 0, cz = 0; for (let k = 0; k < 6; k++) { cx += rp.getX(r * 6 + k) / 6; cz += rp.getZ(r * 6 + k) / 6; }
        if (cx <= -15 && cz >= 30) continue;      // the near port file casts its own shadow
        for (let k = 0; k < 6; k++) { const v = r * 6 + k; map[v] = P.length / 3; P.push(cx + (rp.getX(v) - cx) * 0.66, rp.getY(v), cz + (rp.getZ(v) - cz) * 0.66); }
      }
      for (let t = 0; t < ri.count; t += 3) { const a = map[ri.getX(t)], b = map[ri.getX(t + 1)], c = map[ri.getX(t + 2)]; if (a >= 0 && b >= 0 && c >= 0) I.push(a, b, c); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); pg.setIndex(I);
      const proxy = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
      proxy.castShadow = true; proxy.frustumCulled = false; proxy.name = 'starboard-file-shadow'; hero.object.add(proxy);
      for (const m of hero.meshes.spires) if (m.name !== 'spires-port') m.castShadow = false; }
    await ctx.yield();

    // ---- which turrets and lengths of wall the sea takes, and when (journey seconds); seaward ones first
    // ---- PACE (returned as pace(u)): unhurried from the look to port to the end of the linger
    const linger = (u) => 1.3 - 0.7 * sstep(0.46, 0.54, u) + 0.42 * sstep(0.72, 0.84, u) - 0.02 * sstep(0.9, 1, u);
    // journey second at each u under this pace (what the engine will fly at 1x): every scripted moment is keyed to it,
    // so swashes and slumps happen where the camera is, whatever the speed
    const Ttab = new Float32Array(129); { let acc = 0; for (let i = 1; i <= 128; i++) { acc += 1 / clamp(linger((i - 0.5) / 128), 0.35, 2.5); Ttab[i] = acc; } for (let i = 0; i <= 128; i++) Ttab[i] *= T_END / acc; }
    const Tof = (u) => { const f = clamp(u, 0, 1) * 128, i = Math.min(127, Math.floor(f)); return lerp(Ttab[i], Ttab[i + 1], f - i); };
    // THE BREACH: the fifth turret of the port curtain stands in the sun on the port bow, in full view from the climb to
    // the crest. It and the length of wall under it are what the sea takes while we look to port; the edge of the court
    // washes out with them and the court's water pours through. Its neighbour toward the gate follows as we turn away.
    const thStep = (Math.PI - 0.2 - 0.118) / 19, thB = 0.118 + thStep * 4, tBreach = Tof(0.52) - 4.2, tTurret = Tof(0.52) - 1.7, brA = thB - thStep - 0.065, BR_SWEEP = 2.6;
    const wallSlumps = [{ wall: 0, a: 0.36, b: 0.50, t: 3.2 }, { wall: 1, a: 0.05, b: 0.135, t: 7.5, d: 1.0 }, { wall: 1, a: 0.27, b: 0.40, t: 9.6 }, ...(rare ? [{ wall: 2, a: thB + 0.085, b: 2.06, t: Tof(0.53), d: 9.6 }] : []), { wall: 2, a: brA, b: thB + 0.11, t: tBreach, d: -BR_SWEEP, breach: true }];
    await ctx.yield();
    const G = makeGround(noise, wallSlumps);
    await ctx.yield();

    // ---- the ground: one polar grid
    const rows = groundRows(), cols = groundCols(), nr = rows.length, nc = cols.length, nv = nr * nc;
    const gPos = new Float32Array(nv * 3), gFan = new Float32Array(nv * 3), gSl = new Float32Array(nv * 2);
    for (let i = 0; i < nr; i++) {
      for (let j = 0; j < nc; j++) {
        const x = K * rows[i] * Math.sin(cols[j]), z = CZ - rows[i] * Math.cos(cols[j]), g = G(x, z), o = (i * nc + j) * 3;
        gPos[o] = x; gPos[o + 1] = g[0]; gPos[o + 2] = z; gFan[o] = x; gFan[o + 1] = g[1]; gFan[o + 2] = z;
        gSl[(i * nc + j) * 2] = g[2]; gSl[(i * nc + j) * 2 + 1] = 0;
        if (j % 64 === 63) await ctx.yield();
      }
      await ctx.yield();
    }
    // normals of both forms and the arris weight (convex = dries first) from the grid itself
    const gridNormals = async (P) => {
      const N = new Float32Array(nv * 3);
      for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
        const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nr - 1), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nc - 1);
        const a = (i0 * nc + j) * 3, b = (i1 * nc + j) * 3, c = (i * nc + j0) * 3, d = (i * nc + j1) * 3;
        const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[d] - P[c], vy = P[d + 1] - P[c + 1], vz = P[d + 2] - P[c + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1, o = (i * nc + j) * 3; N[o] = nx / l; N[o + 1] = ny / l; N[o + 2] = nz / l;
        if (j === nc - 1 && i % 16 === 15) await ctx.yield();
      }
      return N;
    };
    const gNrm = await gridNormals(gPos); await ctx.yield();
    const gFanN = await gridNormals(gFan); await ctx.yield();
    const gD = new Float32Array(nv * 2);
    for (let i = 1; i < nr - 1; i++) { if (i % 40 === 39) await ctx.yield(); for (let j = 0; j < nc; j++) {
      const o = i * nc + j, a = (o - nc) * 3, b = (o + nc) * 3, m = o * 3;
      const da = hyp(gPos[m] - gPos[a], gPos[m + 2] - gPos[a + 2]), db = hyp(gPos[b] - gPos[m], gPos[b + 2] - gPos[m + 2]);
      const curv = (gPos[m + 1] - gPos[a + 1]) / Math.max(da, 0.01) - (gPos[b + 1] - gPos[m + 1]) / Math.max(db, 0.01);   // change of slope across the row
      // (and across the columns: the two edges of the causeway's crown and the ends of a wall at its gate are arrises too)
      const j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nc - 1), c2 = (i * nc + j0) * 3, d2 = (i * nc + j1) * 3;
      const dc = hyp(gPos[m] - gPos[c2], gPos[m + 2] - gPos[c2 + 2]), dd = hyp(gPos[d2] - gPos[m], gPos[d2 + 2] - gPos[m + 2]);
      const curv2 = (gPos[m + 1] - gPos[c2 + 1]) / Math.max(dc, 0.01) - (gPos[d2 + 1] - gPos[m + 1]) / Math.max(dd, 0.01);
      const cv = curv2 > Math.abs(curv) ? curv2 : curv;
      gD[o * 2] = clamp(Math.abs(cv) > 0.25 ? cv * 0.7 : 0, -0.35, 1);
    } }
    await ctx.yield();
    const gIdx = [], cIdx = [], wIdx = [];
    const BANDS = [[155, 176, 2.1], [229, 242, 0.97], [308, 322, 0.73]];      // the moats run along the sun near the course: their banks need cast no shadow
    for (let i = 0; i < nr - 1; i++) { if (i % 8 === 7) await ctx.yield(); for (let j = 0; j < nc - 1; j++) {
      const a = i * nc + j, b = a + 1, c = a + nc, d = c + 1;
      const casts = BANDS.some(([r0, r1, sp]) => rows[i] >= r0 && rows[i] <= r1 && Math.abs(cols[j]) < sp) || (Math.abs(gPos[a * 3]) < 12 && rows[i] > 155 && rows[i] < 215 && Math.abs(cols[j]) < 1);
      (casts ? cIdx : gIdx).push(a, b, c, b, d, c);
      const x = gPos[a * 3], z = gPos[a * 3 + 2], rho = rows[i];
      const inMoat = Math.abs(rho - R_M[0]) < 12 || Math.abs(rho - R_M[1]) < 12 || Math.abs(rho - R_M[2]) < 12;
      if (rho < R_COURT + 4 || (rho < 1500 && (x > 55 || (z < CZ + 120 && (x > -48 || (inMoat && cols[j] > -1.35))) ) && !(rho > 420 && x < -10))) wIdx.push(a, b, c, b, d, c);
    } }
    await ctx.yield();
    const gGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(gPos, 3);
    gGeo.setAttribute('position', posAttr); gGeo.setAttribute('normal', new THREE.BufferAttribute(gNrm, 3));
    gGeo.setAttribute('aD', new THREE.BufferAttribute(gD, 2)); gGeo.setAttribute('aFan', new THREE.BufferAttribute(gFan, 3));
    gGeo.setAttribute('aFanN', new THREE.BufferAttribute(gFanN, 3)); gGeo.setAttribute('aSlump', new THREE.BufferAttribute(gSl, 2));
    gGeo.setIndex(gIdx);
    const groundMat = sandMaterial({ slump: true, ripple: true, hand: true, sunShift: true });
    const ground = new THREE.Mesh(gGeo, groundMat); ground.name = 'beach';
    ground.receiveShadow = true; ground.frustumCulled = false;
    scene.add(ground);
    // the rows that stand up (walls, moat banks, ramp) are a second mesh on the same vertices: only they cast shadows
    const cGeo = new THREE.BufferGeometry(); for (const k of Object.keys(gGeo.attributes)) cGeo.setAttribute(k, gGeo.attributes[k]); cGeo.setIndex(cIdx);
    const walls = new THREE.Mesh(cGeo, groundMat); walls.name = 'walls-and-moats';
    walls.castShadow = true; walls.receiveShadow = true; walls.frustumCulled = false; walls.customDepthMaterial = slumpDepthMaterial();
    scene.add(walls);
    await ctx.yield();

    // ---- bucket turrets: tapered drums 12 m across the foot, 13.5 m tall, two mould seams, eight notches in the rim;
    // a second mould for the one in six that lost a corner when the bucket lifted (crumbs at its foot). Each carries
    // the form it sits down into: a lobed fan under 12 degrees.
    const bucket = (broken, SEG = 24) => {
      const rings = [[6.55, -4.2, 0], [6.3, 0, -0.3], [6.0, 0.55, 0], [5.3, 6.6, 0], [4.6, 12.5, 0.2], [4.5, 13.5, 1], [3.75, 13.5, 1], [3.3, 12.95, 0], [0.01, 12.85, 0]];
      const P = [], F = [], D = [], I = [];
      const lobe = (f) => 1 + 0.2 * Math.sin(3 * f + 1) + 0.1 * Math.sin(5 * f + 2);
      for (let r = 0; r < rings.length; r++) for (let s = 0; s <= SEG; s++) {
        const f = (s % SEG) / SEG * TAU; let [rad, y, ar] = rings[r];
        const seam = (s % (SEG / 2)) === 0 && r < 5 ? 1 : 0, notch = (r === 5 || r === 6) && (s % (SEG / 8)) < 1;
        if (seam) { rad += 0.3; ar = 0.84; }
        if (notch) y -= 0.95;
        if (broken) { const bite = sstep(0.75, 0.2, Math.abs(f - 1.6)) * sstep(6.5, 9.5, y); y -= bite * (y - 7.2) * 0.8 * (0.8 + 0.2 * Math.sin(f * 9)); rad *= 1 - 0.1 * bite; if (bite > 0.3) ar = 0.9; }
        P.push(Math.cos(f) * rad, y, Math.sin(f) * rad);
        const hf = Math.max(0, y) / 13.5, Rf = r >= 6 ? rad / 4.5 * 4.2 : lerp(21 * lobe(f), 4.2, Math.min(1, hf)) * (r === 0 ? 1.04 : 1);
        F.push(Math.cos(f) * Rf, r >= 6 ? 3.4 + 0.3 * (1 - rad / 4.5) : Math.max(0, 21 * lobe(f) - Rf) * 0.2 + 0.05, Math.sin(f) * Rf);
        D.push(ar, 0);
        if (r < rings.length - 1 && s < SEG) { const a = r * (SEG + 1) + s, b = a + 1, c = a + SEG + 1, d = c + 1; I.push(a, c, b, b, c, d); }
      }
      if (broken) {                                            // the crumbs: a dry cone (31 degrees) where the corner fell
        const b0 = P.length / 3, cx = Math.cos(1.6) * 8.6, cz = Math.sin(1.6) * 8.6;
        P.push(cx, 2.0, cz); F.push(cx * 1.6, 0.4, cz * 1.6); D.push(1, 0);
        for (let s = 0; s <= 10; s++) { const f = s / 10 * TAU, rr = 3.3 * (1 + 0.15 * Math.sin(f * 3)); P.push(cx + Math.cos(f) * rr, -0.1, cz + Math.sin(f) * rr); F.push((cx + Math.cos(f) * rr) * 1.6, 0.3, (cz + Math.sin(f) * rr) * 1.6); D.push(0.3, 0);
          if (s < 10) I.push(b0, b0 + 2 + s, b0 + 1 + s); }
      }
      const g = new THREE.BufferGeometry(), gf = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
      gf.setAttribute('position', new THREE.Float32BufferAttribute(F, 3)); gf.setIndex(I); gf.computeVertexNormals();
      // close the seam of the lathe so the light does not show it
      const fix = (geo) => { const n = geo.attributes.normal; for (let r = 0; r < rings.length; r++) { const a = r * (SEG + 1), b = a + SEG; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.sqrt(x * x + y * y + z * z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } };
      fix(g); fix(gf);
      g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 2)); g.setAttribute('aFan', new THREE.Float32BufferAttribute(F, 3));
      g.setAttribute('aFanN', gf.attributes.normal.clone()); gf.dispose();
      return g;
    };
    const turretSpots = [];
    const addT = (wallI, th, t, dropTo) => {
      const rc = [R_W1, R_W2, R_CURT + 1.5][wallI], x = K * rc * Math.sin(th), z = CZ - rc * Math.cos(th);
      turretSpots.push({ wallI, th, x, z, y: wallI === 2 ? Math.max(baseY(x) + 3.15, 2.75) : baseY(x) - 0.25, drop: wallI === 2 ? (dropTo !== undefined ? Math.max(baseY(x) + 3.15, 2.75) - dropTo : t !== undefined && x > 30 ? Math.max(baseY(x) + 3.15, 2.75) + 0.35 : 2.6 + Math.max(baseY(x) + 3.15, 2.75) - (baseY(x) + 3.15)) : 0, t: t ?? 1e6, rot: rng.range(0, TAU), lean: rng.range(0, 0.06), ldir: rng.range(0, TAU), s: rng.range(0.93, 1.07), broken: false });
    };
    for (const th of [0.0627, 0.2, 0.34, 0.48, 0.62]) { addT(0, th, th === 0.62 ? 1.4 : th === 0.48 ? 5.6 : undefined); addT(0, -th); }
    for (const th of [0.084, 0.21, 0.34, 0.48, 0.62, 0.76, 0.9]) { addT(1, th, th === 0.084 ? 6.3 : th === 0.21 ? 8.9 : th === 0.62 ? 11.5 : undefined); addT(1, -th); }
    const lookSlumps = [];
    for (let k = 0; k < 20; k++) {
      const th = 0.118 + thStep * k;
      const t = k === 3 ? tTurret + 0.9 : rare ? (k >= 4 && k <= 12 ? tTurret + (k - 4) * 1.15 : undefined) : (k === 4 ? tTurret : k === 8 ? 27.7 : undefined);
      addT(2, th, t, k === 4 || k === 3 ? 1.5 : undefined); addT(2, -th);
      if (k === 4 || k === 3 || k === 8) { const q = turretSpots[turretSpots.length - 2]; lookSlumps.push(new THREE.Vector4(q.x, q.z, q.t, 0)); }
    }
    lookSlumps.reverse(); lookSlumps.unshift(lookSlumps.splice(1, 1)[0]);      // the breach turret first
    const breachAt = new THREE.Vector3(lerp(lookSlumps[0].x, lookSlumps[2].x, 0.5) + 20, 4, lerp(lookSlumps[0].y, lookSlumps[2].y, 0.5) - 24);      // the gaze rests between the two turrets of the breach
    { const q = turretSpots.find((s) => s.wallI === 1 && s.th === 0.084); lookSlumps.push(new THREE.Vector4(q.x, q.z, q.t, 1.3)); }      // (the fourth foam ring: gate 2's port turret)
    turretSpots.forEach((s, i) => { if (rare && s.wallI === 2 && Math.abs(s.th - (0.118 + thStep * 3)) < 1e-6) rng.chance(1 / 5);      // (the breach's second turret: the draw it used to take on rare seeds, so every later draw is unchanged)
      s.broken = s.t > 1e5 && Math.abs(s.th) > 0.13 && Math.abs(s.th) < 1.75 && rng.chance(1 / 5); });
    for (const s of turretSpots) {
      if (s.t < 1e5) s.rot = Math.PI / 2 - s.th;      // one that will sit down goes seaward: its rim tilts that way
      // where the ground meets it (local y): outside the wall and inside; a gate turret shows the course its foot
      const rc = [R_W1, R_W2, R_CURT + 1.5][s.wallI], gnd = (r) => G(K * r * Math.sin(s.th), CZ - r * Math.cos(s.th))[0] - s.y;
      if (Math.abs(s.th) < 0.13) { const f = clamp(G(s.x - Math.sign(s.x) * 6.9, s.z)[0] - s.y, -4.2, 9); s.foot = [f, f]; }
      else s.foot = [gnd(rc + 7.5), s.wallI === 2 ? 8.2 - s.y : gnd(rc - 7.5)];
    }
    const turretMat = sandMaterial({ slump: true, bucket: true, sunShift: true }), castMat = sandMaterial({ slump: true }), turretDepth = slumpDepthMaterial();
    const turretMeshes = [];
    for (const kind of [0, 1, 2]) {                    // whole, lost a corner, and the far side of the curtain (which casts no shadow we see)
      const broken = kind === 1, isBack = (s) => s.wallI === 2 && Math.abs(s.th) > 1.75, list = turretSpots.filter((s) => (kind === 2 ? isBack(s) : !isBack(s) && s.broken === broken));
      const im = new THREE.InstancedMesh(bucket(broken, kind === 2 ? 16 : 24), turretMat, Math.max(1, list.length));
      const sl = new Float32Array(Math.max(1, list.length) * 2), ft2 = new Float32Array(Math.max(1, list.length) * 2).fill(-50), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), ax = new THREE.Vector3();
      list.forEach((s, i) => {
        q.setFromAxisAngle(ax.set(Math.cos(s.ldir), 0, Math.sin(s.ldir)), s.lean); q2.setFromAxisAngle(ax.set(0, 1, 0), s.rot); q.multiply(q2);
        im.setMatrixAt(i, m4.compose(new THREE.Vector3(s.x, s.y, s.z), q, new THREE.Vector3(s.s, s.s, s.s))); sl[i * 2] = s.t; sl[i * 2 + 1] = s.drop; ft2[i * 2] = s.foot[0]; ft2[i * 2 + 1] = s.foot[1];
      });
      if (!list.length) im.setMatrixAt(0, m4.makeScale(0, 0, 0));
      im.geometry.setAttribute('aSlump', new THREE.InstancedBufferAttribute(sl, 2)); im.geometry.setAttribute('aFoot', new THREE.InstancedBufferAttribute(ft2, 2));
      im.castShadow = kind !== 2; im.receiveShadow = true; im.frustumCulled = false; im.customDepthMaterial = turretDepth; im.name = ['turrets', 'turrets-broken', 'turrets-far'][kind];
      scene.add(im); turretMeshes.push(im);
      await ctx.yield();
    }
    await ctx.yield();
    // a pale cone of crumbs leans against the foot of every turret of the two outer walls and of gate 3: dry sand that
    // let go of the cast, lying at 30 degrees. One small instanced mesh; the cones of a turret that sits down are left out.
    { const NS = 9, cp = [-0.5, 0.56, 0], cd = [1, 0], ci = [];
      for (let k = 0; k < NS; k++) { const f = k / NS * TAU, rr = 1 + 0.16 * Math.sin(f * 3 + 1) + 0.08 * Math.sin(f * 5); cp.push(Math.cos(f) * rr, -0.06, Math.sin(f) * rr); cd.push(0.6, 0); ci.push(0, 1 + (k + 1) % NS, 1 + k); }
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('aD', new THREE.Float32BufferAttribute(cd, 2)); cg.setIndex(ci); cg.computeVertexNormals();
      const hs2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
      const spots = turretSpots.filter((s) => s.t > 1e5 && (s.wallI < 2 || Math.abs(s.th) < 0.13)), list = [];
      spots.forEach((s, i) => {
        const gateT = Math.abs(s.th) < 0.13, out = Math.atan2(s.z - CZ, s.x), base = gateT ? (s.x > 0 ? Math.PI : 0) : out;
        for (let k = 0; k < 3; k++) {
          // a gate turret keeps its crumbs on the faces the course passes (toward the axis and toward the approach)
          const a = gateT ? base + (s.x > 0 ? 1 : -1) * (k - 0.4) * 0.8 + (hs2(i, k) - 0.5) * 0.3 : base + (k - 1) * 0.85 + (hs2(i, k) - 0.5) * 0.4;
          const r = 1.7 + 1.5 * hs2(i, k + 5), d = 6.25 * s.s + 0.42 * r, x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d;
          list.push({ x, y: G(x, z)[0], z, r, rot: -a });
        }
      });
      const crumbs = new THREE.InstancedMesh(cg, hero.materials.sand, Math.max(1, list.length)), cm = new THREE.Matrix4(), cq = new THREE.Quaternion(), cv = new THREE.Vector3(), cs = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      if (!list.length) crumbs.setMatrixAt(0, cm.makeScale(0, 0, 0));
      list.forEach((c, n) => crumbs.setMatrixAt(n, cm.compose(cv.set(c.x, c.y, c.z), cq.setFromAxisAngle(up, c.rot), cs.set(c.r, c.r, c.r))));
      crumbs.name = 'crumb-cones'; crumbs.receiveShadow = true; crumbs.frustumCulled = false; scene.add(crumbs); }
    await ctx.yield();

    // ---- THE WATER: one sheet lying on the same grid as the sand. A film where a swash has run, the level sea where
    // the beach is below it, the moats' seep and their racing tongues, the flood on the court. It mirrors the sky
    // function and an analytic silhouette of the castle (18 spires, mound, curtain); deep water is glass green; the
    // white edge is lobed lace that frays and fizzes out. Shadows fall through it onto the sand below.
    const spA = [], spB = [];
    for (const s of hero.anchors.spires) { const f = toWorld(s.foot), t = toWorld(s.tip); spA.push(new THREE.Vector4(f.x, f.y - 2, f.z, s.footRadius)); spB.push(new THREE.Vector4(t.x, t.y, t.z, 0.6)); }
    const growTop = [toWorld(hero.anchors.growingSpire.topAtArrival), toWorld(hero.anchors.growingSpire.topAtLeaving)];
    // the feet the sea takes (for the collars of foam: a turret that has sat down, or a length of wall, is no foot any more)
    const goneFeet = [], goneWalls = [];
    for (const s of turretSpots) if (s.t < 1e5 && goneFeet.length < 16) goneFeet.push(new THREE.Vector4(s.x, s.z, s.t, 0));
    while (goneFeet.length < 16) goneFeet.push(new THREE.Vector4(0, -1e5, 1e6, 0));
    for (const q of wallSlumps) if (goneWalls.length < 5) goneWalls.push(new THREE.Vector4([R_W1, R_W2, R_CURT + 1.5][q.wall], q.a, q.b, q.t));
    while (goneWalls.length < 5) goneWalls.push(new THREE.Vector4(-1e5, 0, 0, 1e6));
    const waterU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.lights), ...U,
      uWaterC: { value: C(pal[3]) }, uFoamC: { value: C(pal[4]) }, uSpA: { value: spA }, uSpB: { value: spB }, uShBias2: { value: 0.3 }, uSl: { value: lookSlumps }, uBr: { value: new THREE.Vector4(brA, thB + 0.11, tBreach, BR_SWEEP) }, uBore: { value: -1e5 } };
    waterU.uGone = { value: goneFeet };
    waterU.uWs = { value: goneWalls };
    const waterMat = new THREE.ShaderMaterial({ uniforms: waterU, lights: true, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        #include <common>
        #include <shadowmap_pars_vertex>
        uniform vec4 uSea, uCourt, uMoat[3], uBr; uniform vec3 uMoatR; uniform float uTs; varying float vBr, vCt;
        vec2 cbtOval(vec2 p){ vec2 q = vec2(p.x/0.76 + 1e-5, 385. - p.y); return vec2(length(q), atan(q.x, q.y)); }   // as in the style
        float cbtBase(vec2 p){ float b = p.x > 0. ? -p.x*0.025 - 1.4*smoothstep(3., 24., p.x) : min(-p.x/60., 5.); return max(b, -12.); }
        varying vec3 vW; varying vec2 vDp; varying vec4 vSh;
        void main(){
          vec3 p = position; vec2 o = cbtOval(p.xz); float y, still = 0.; vCt = 0.;
          if (o.x < 161.) { y = uCourt.z; vCt = 1.; }
          else if (abs(p.x) + 0.6*sin(p.z*0.31 + (p.x > 0. ? 3.4 : 1.3)) + 0.4*sin(p.z*0.83 + (p.x > 0. ? 0.5 : 2.6)) < 5.25 && o.x < 200. && p.z < 385.) { y = p.y + 0.07; vCt = 1.; }      // the crown of the ramp (cbtRamp in the style); its sides carry no film
          else {
            y = max(min(p.y + 0.06, cbtBase(p.xz) + 0.45), uSea.z);
            for (int i = 0; i < 3; i++) {
              float r = i == 0 ? uMoatR.x : i == 1 ? uMoatR.y : uMoatR.z;
              float dm = o.x - r; if (i == 2 && dm > 0.) dm *= 0.62;
              if (abs(dm) < 8.4) { float wB = 1. - smoothstep(6.6, 8.4, abs(dm)), lv = mix(uMoat[i].w, uMoat[i].y, smoothstep(0., 0.045, o.y - uMoat[i].x)); if (lv > y) y = mix(y, lv, wB); if (y > p.y + 0.12) still = wB*(1. - smoothstep(0., 0.045, o.y - uMoat[i].x)); }      // seep water stands in every moat at the level of the sea: still, a mirror
            }
          }
          // through the breach the court's water pours out down the washed fan, a thin fast film
          vBr = smoothstep(uBr.x - 0.012, uBr.x + 0.03, o.y)*(1. - smoothstep(uBr.y - 0.03, uBr.y + 0.012, o.y))*smoothstep(0.8, 3.4, uTs - uBr.z - uBr.w*clamp((uBr.y - o.y)/max(uBr.y - uBr.x, 1e-3), 0., 1.))*step(146., o.x)*step(o.x, 189.);      // (each part of the gap pours once its length of wall has gone)
          if (vBr > 0.) y = mix(y, max(8.24 - 8.9*smoothstep(146., 189., o.x) + 0.45, uSea.z), vBr);
          vDp = vec2(y - p.y, still); p.y = y;
          vec4 wp = modelMatrix*vec4(p, 1.); vW = wp.xyz;
          vSh = vec4(0.);
          #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
            vSh = directionalShadowMatrix[0]*(wp + vec4(0., 0.3, 0., 0.));
          #endif
          gl_Position = projectionMatrix*viewMatrix*wp;
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <packing>
        #include <shadowmap_pars_fragment>
        ${STYLE_GLSL}
        ${SHADOW_GLSL}
        uniform vec3 uWaterC, uFoamC; uniform vec4 uSpA[18], uSpB[18], uSl[4], uBr; uniform float uTs, uBore;
        varying vec3 vW; varying vec2 vDp; varying vec4 vSh; varying float vBr, vCt;
        // what the mirror holds: the sky, and the castle upside down
        // (skip: this pixel will not show the mirror, being cut or on the ramp's crown: it gives its neighbours the derivative they need and looks no further)
        vec3 cbtMirror(vec3 P, vec3 d, float px, float art, bool skip){
          vec3 col = cbtSky(vec3(d.x, d.y*0.6 + 0.2, d.z));
          float wob = (cbtN3(vec3(P.xz*0.5, uTime*1.1)) - 0.5) + 0.5*(cbtN3(vec3(P.xz*1.6 + 3., uTime*1.6)) - 0.5);
          d.xz += vec2(-d.z, d.x)*wob*(0.016 + 0.03*art); d.y *= 1. + 0.1*wob;
          vec2 dh = d.xz; float dd = max(dot(dh, dh), 1e-5), best = 1e9; vec3 hitC = col; float hitA = 0.;
          vec2 vh = dh/sqrt(dd); float alo = dot(P.xz, vh)*1.5, fa = fwidth(alo);
          if (skip) return col;
          float brk = mix(0.5 + 0.5*smoothstep(0.28, 0.62, cbtN3(vec3(alo + uTime*0.9, dot(P.xz, vec2(-vh.y, vh.x))*0.2, uTime*0.5))), 0.8, smoothstep(0.5, 1.2, fa));
          vec2 sunH = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
          // inside the nave its own walls stand in the mirror before anything else (wet sand, sunlit above the
          // starboard crest's shadow on the port face), so no spire's foot hangs alone in the water
          float wallM = 0.; vec3 wallC = col;
          if (abs(P.x) < 21.5 && P.z > 288. && P.z < 467.) {
            float dx = abs(d.x) < 1e-4 ? 1e-4 : d.x, tx = ((dx > 0. ? 23.5 : -23.5) - P.x)/dx, tz = d.z > 1e-4 ? (468. - P.z)/d.z : 1e9, tw = min(tx, tz);
            vec3 H = P + d*tw;
            float top = 38. + 1.3*sin(H.z*0.13 + H.x*0.2) + 0.7*sin(H.z*0.41);
            wallM = (1. - smoothstep(top - px*tw - 0.3, top + px*tw + 0.3, H.y))*smoothstep(284., 296., H.z);
            float tanE = uSunDir.y/max(length(uSunDir.xz), 1e-4), yl = 38. - (H.x + 26.5)*tanE/max(abs(sunH.x), 0.2);
            float litW = smoothstep(yl - 0.6, yl + 0.6, H.y)*step(-22., H.x);
            float bandW = 0.5 + 0.5*sin(H.y*0.9 + 2.*sin(H.z*0.2 + H.x*0.2));                      // the palm dents, as the mirror keeps them
            wallC = mix(mix(uShadeC*(uShK + 1.9*dot(uWetC, vec3(0.3, 0.5, 0.2))), uWetC*uShadeC*2.3, 0.3)*(0.72 + 0.2*bandW), uWetC, litW);
          }
          for (int i = 0; i < 18; i++) {
            vec4 A = uSpA[i], B = uSpB[i];
            float t = dot(A.xz - P.xz, dh)/dd; if (t < 0.) continue;
            float hgt = max(B.y - A.y, 1.), fr = (P.y + t*d.y - A.y)/hgt;
            if (fr < 0. || fr > 1.) continue;
            vec2 ax = mix(A.xz, B.xz, fr), off = P.xz + t*dh - ax; float dl = length(off);
            float rad = mix(A.w*1.05, B.w, sqrt(fr))*(1. + 0.16*sin(fr*hgt*1.25 + float(i)))*(1. + 0.7*art);      // (drawn a little stouter in still water, to be read at a glance)
            float a = 1. - smoothstep(rad*0.5 - px*t, rad*1.12 + px*t, dl);
            if (a > 0.01 && t < best) { best = t;
              float litS = smoothstep(-0.75, 0.45, dot(off/max(dl, 1e-3), sunH));
              float band = mix(0.5, smoothstep(-0.3, 0.3, sin(fr*hgt*2.3 + float(i))), 1. - smoothstep(0.45, 1.5, px*t));   // pale cap, dark flank, blob after blob
              band = mix(band, 0.2 + 0.6*smoothstep(-0.8, 0.8, sin(fr*22. + float(i) + 2.*wob)), art);                                       // still water keeps five or six rings of each
              vec3 c = mix(uWetC, uDryC, band*0.9);
              hitC = mix(mix(uShadeC*(uShK + 1.9*dot(c, vec3(0.3, 0.5, 0.2))), c*uShadeC*2.3, 0.3)*0.9, c, litS); hitA = a; }
          }
          // the mound (an oval drum under the crest) and the curtain wall with its turrets
          for (int j = 0; j < 2; j++) {
            float kx = j == 0 ? 0.56 : 0.76, cz = j == 0 ? 402. : 385., R = j == 0 ? 112. : 168.;
            vec2 q0 = vec2(P.x/kx, P.z - cz), qd = vec2(d.x/kx, d.z);
            float a = max(dot(qd, qd), 1e-6), b = dot(q0, qd), c = dot(q0, q0) - R*R, disc = b*b - a*c;
            if (disc <= 0.) continue;
            float sq = sqrt(disc), t = (-b - sq)/a; if (t < 0.) t = (-b + sq)/a; if (t < 0. || t > best) continue;
            vec2 q = q0 + t*qd; float ang = atan(q.x + 1e-5, -q.y), y = P.y + t*d.y;
            if (j == 0 && q.y < 0. && abs(q.x*kx) < 19. + 0.25*max(y - 8., 0.)) continue;      // the open end of the horseshoe: the nave
            // the curtain's turrets stand in the mirror where they stand on the wall (0.118 + k*0.14861), and one that has sat
            // down, or the length of wall that went with it, is gone from the mirror too
            float tk = (abs(ang) - 0.118)/0.14861, kk = floor(tk + 0.5), wB = j == 1 ? mix(11.2, 0., art) : 0., hT = clamp((y - wB)/mix(5.5, 9., art), 0., 1.), tw = mix(0.33, 0.23, hT), tur = (1. - smoothstep(tw - 0.035 - 0.06*art, tw + 0.035 + 0.06*art, abs(tk - kk)))*step(-0.5, tk)*step(tk, 19.5);
            if (j == 1 && ang > 0.) { float gone = kk == 4. ? uBr.z + 4.6 : kk == 3. ? uBr.z + 5.5 : 1e6; if (uTs > gone) tur = 0.; if (ang > uBr.x && ang < uBr.y && uTs > uBr.z + 1.2 + uBr.w*(uBr.y - ang)/max(uBr.y - uBr.x, 1e-3)) continue; }
            float top = j == 0 ? 37. + 1.5*sin(ang*7.) : mix(11.2 + 5.5*tur, 9.*tur, art) - 0.9*tur*smoothstep(-0.3, 0.3, sin((tk - kk)*50.));
            float m = 1. - smoothstep(top - px*t - 0.2 - art, top + px*t + 0.2 + art, y);
            if (m > 0.01) { best = t; float litS = smoothstep(-0.2, 0.2, (c < 0. ? -1. : 1.)*dot(normalize(q*vec2(kx, 1.) + 1e-4), sunH));      // (seen from inside the court, it is the inner face that the sun is on or off)
              vec3 c = y > top - 1.2 ? uDryC : uWetC;
              hitC = mix(mix(uShadeC*(uShK + 1.9*dot(c, vec3(0.3, 0.5, 0.2))), c*uShadeC*2.3, 0.3)*0.9, c, litS); hitA = m;
              if (j == 1) { float sp8 = mix(12.3, 4.5, art);                                   // a turret in the mirror: ochre above, slate below
                hitC = mix(mix(uShadeC*(uShK + 1.9*dot(uWetC, vec3(0.3, 0.5, 0.2))), uWetC*uShadeC*2.3, 0.3)*0.72, y > top - 1.2 ? uDryC : uWetC*1.2, smoothstep(sp8 - 0.5, sp8 + 0.5, y)*max(litS, 0.8)); } }
          }
          hitC = mix(hitC, uSkyLo, cbtBleach(min(best, 1e5))*step(best, 1e8));
          return mix(mix(col, hitC, hitA*brk), wallC, wallM);
        }
        // froth: (distance to the nearest bubble's centre, distance to the wall between the two nearest), bubbles drifting
        vec2 cbtFroth(vec2 p, float t){
          vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 g = vec2(float(x), float(y)); vec3 h = vec3(i + g, 3.7);
            vec2 o = 0.5 + 0.36*sin(t + 6.2832*vec2(cbtH31(h), cbtH31(h + 11.3)));
            vec2 r = g + o - f; float d = dot(r, r);
            if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
          }
          return vec2(sqrt(d1), sqrt(d2) - sqrt(d1));
        }
        // THE WHITE EDGE. f = metres behind the water's front, lw = the width of the band, fq = the pixel's footprint
        // in metres. A scalloped lip of solid white on the front; behind it lace, a net of filaments with holes in it
        // and rafts of bubbles, thinning out; then three curved lines of round froth that fall behind and fizz out.
        // The mesh of the net follows the band's width (two octaves, cross-faded) and gives way to its average tint
        // when it is finer than three pixels. (skip: a pixel that is cut gives its neighbours the two derivatives and draws nothing.)
        float cbtLace(vec2 q, float f, float lw, float fq, bool skip){
          vec2 wq = q + 0.9*(vec2(cbtN3(vec3(q*0.7, 1.3)), cbtN3(vec3(q*0.7, 6.1))) - 0.5);
          float nA = cbtN3(vec3(wq*1.05, uTime*0.22)), nB = cbtN3(vec3(wq*2.4 + 7., uTime*0.3));
          float wA = max(0.05, 1.25*fwidth(nA)), wB = max(0.06, 1.25*fwidth(nB));          // a filament is never under two and a half pixels
          if (skip) return 0.;
          float torn = cbtN3(vec3(q*0.55 + 11., uTime*0.15));
          float web = max(mix(1. - smoothstep(0.55*wA, wA, abs(nA - 0.5)), 0.42, smoothstep(0.1, 0.24, wA)),
                          mix(1. - smoothstep(0.55*wB, wB, abs(nB - 0.47)), 0.36, smoothstep(0.1, 0.24, wB))*smoothstep(0.3, 0.5, torn));      // the net: closed loops and wandering threads, a finer net inside the coarse one
          vec2 B = cbtFroth(wq*3.1 + 17., uTime*1.1);
          float bub = mix(1. - smoothstep(0.2, 0.3, B.x), 0.3, smoothstep(0.22, 0.5, fq*3.1));        // small round bubbles
          float fl = f + 0.6*lw*(nA - 0.5);                                        // the lip is scalloped
          float lip = smoothstep(0., 0.07*lw, fl)*(1. - smoothstep(0.36*lw, 0.46*lw, fl));
          float thin = cbtN3(vec3(q*0.31, uTime*0.12));
          float env = smoothstep(0., 0.1*lw, f)*(1. - smoothstep(1.2*lw, 4.2*lw, f + 2.4*lw*(thin - 0.5)));
          float a = max(lip, env*max(web, bub*smoothstep(0.5, 0.66, 1. - torn + 0.3*(1. - smoothstep(0.4*lw, 2.*lw, f)))));      // rafts of bubbles close behind the lip and where the net has torn
          for (int k = 0; k < 3; k++) {
            float fk = lw*(5.6 + 3.9*float(k)) + 2.*lw*(cbtN3(vec3(q*0.19 + float(k)*7.3, uTime*0.13)) - 0.5);
            float ln = 1. - smoothstep(0.2*lw, 0.46*lw, abs(f - fk));
            a = max(a, ln*max(bub, 0.5*web)*(0.95 - 0.2*float(k))*smoothstep(0.25 + 0.08*float(k), 0.5 + 0.08*float(k), cbtN3(vec3(q*0.43 + float(k)*3.1, uTime*0.25))));
          }
          return a;
        }
        // THE TIDE'S DRAWING on a sheet, behind its front. f = metres behind the front, run = the sheet's own run-up
        // coordinate here (metres), dir = the way the water runs, D = the depth of the lace band (6 to 12 m). Behind the
        // lip the lace frays into separate threads drawn out along the flow, which break into lengths and fizz out; further
        // back lie the lines of old foam that earlier fronts left, a dozen metres apart, drifting with the water until the
        // next front gathers them. White is threads, never a mass: a thread finer than three pixels gives way to its mean.
        // (skip: a pixel that is cut gives its neighbours the five derivatives and draws nothing.)
        float cbtTideDraw(vec2 q, float f, float run, vec2 dir, float D, float calm, bool skip){
          float s = dot(q, dir), c = dot(q, vec2(-dir.y, dir.x));
          float wa = 5.*(cbtN3(vec3(q*0.09, 3.3)) - 0.5) + 1.2*(cbtN3(vec3(q*0.33, 6.7)) - 0.5);
          float n1 = cbtN3(vec3((c + wa)*0.5, s*0.075 - uTime*0.06, 5.5)), n2 = cbtN3(vec3((c - wa)*1.15 + 9., s*0.17 - uTime*0.1, 2.5));
          // (a thread is a hand wide, 0.11 m, wherever the noise that draws it runs steep or slack, and never under a pixel and a quarter)
          float fqd = max(max(fwidth(q.x), fwidth(q.y)), 1e-4), g1 = fwidth(n1), g2 = fwidth(n2);
          float w1 = max(g1*max(0.11/fqd, 1.25), 1e-4), w2 = max(g2*max(0.08/fqd, 1.25), 1e-4);
          float t1 = mix(1. - smoothstep(0.5*w1, w1, abs(n1 - 0.5)), 0.16, smoothstep(0.08, 0.2, g1));
          float t2 = mix(1. - smoothstep(0.5*w2, w2, abs(n2 - 0.47)), 0.12, smoothstep(0.08, 0.2, g2));
          float brk = 0.; if (!skip) brk = cbtN3(vec3((c + wa)*0.3, s*0.1 - uTime*0.06, 8.1));                    // lengths of thread with gaps between
          float rag = cbtN3(vec3(q*0.07, 4.)) - 0.5;
          float band = smoothstep(0.04*D, 0.35*D, f)*(1. - smoothstep(0.7*D, 1.5*D, f + 0.6*D*rag));
          float fizz = smoothstep(0.25 + 0.5*clamp(f/max(1.5*D, 1e-3), 0., 1.), 0.9, brk + 0.25*t2);      // the further back, the fewer are left
          float a = band*max(t1*smoothstep(0.3, 0.5, brk), t2*fizz);
          // old foam: where earlier fronts stood (their lines are places of the run-up coordinate, creeping on with the water)
          float lr = (run + 6.*rag)/12.5 - uTime*0.012, lf = abs(fract(lr) - 0.5)*12.5, lwd = max(0.3, 1.5*fwidth(lr)*12.5);
          if (skip) return 0.;
          float keepL = 1. - smoothstep(4., 9., lwd);
          float old = (1. - smoothstep(0.5*lwd, lwd, lf))*smoothstep(0.38, 0.62, cbtN3(vec3(c*0.09, floor(lr)*3.1, uTime*0.04)))*max(t2, 0.35*smoothstep(0.4, 0.6, brk));
          a = max(a, 0.85*old*keepL*smoothstep(1.2*D, 2.2*D, f)*(1. - 0.5*calm));
          return a;
        }
        uniform vec4 uGone[16], uWs[5];
        // THE FEET THAT STAND IN THE WATER: metres from p to the nearest standing foot of a wall or a bucket turret of
        // the three walls (1e3 = none near), and that foot's own centre in plan. The turrets stand where the world put
        // them (the same angles); one that has sat down, or a length of wall the sea has taken, is no foot any more.
        vec3 cbtFoot(vec2 p, vec2 o){
          float best = 1e3; vec2 at = p;
          for (int i = 0; i < 3; i++) {
            float rc = i == 0 ? 315. : i == 1 ? 235. : 167.5, s = o.x - rc;
            if (abs(s) > 18.) continue;
            float a = abs(o.y), th;
            if (i == 0) th = a < 0.13 ? 0.0627 : 0.2 + 0.14*clamp(floor((a - 0.2)/0.14 + 0.5), 0., 3.);
            else if (i == 1) th = a < 0.147 ? 0.084 : a < 0.275 ? 0.21 : 0.34 + 0.14*clamp(floor((a - 0.34)/0.14 + 0.5), 0., 4.);
            else th = 0.118 + 0.14861*clamp(floor((a - 0.118)/0.14861 + 0.5), 0., 19.);
            if (o.y < 0.) th = -th;
            vec2 c = vec2(0.76*rc*sin(th), 385. - rc*cos(th));
            float gone = 0.;
            for (int k = 0; k < 16; k++) { vec2 dg = c - uGone[k].xy; if (dot(dg, dg) < 4. && uTs > uGone[k].z - 0.6) gone = 1.; }
            float d = length(p - c) - 6.4;
            if (gone < 0.5 && d < best) { best = d; at = c; }
            float span = i == 0 ? 0.66 : i == 1 ? 0.9 : 9., footW = i == 0 ? 3.4 : i == 1 ? 4.6 : 5.1;
            float there = step(9.6, abs(p.x))*step(a, span);
            for (int k = 0; k < 5; k++) if (abs(uWs[k].x - rc) < 1. && o.y > uWs[k].y - 0.02 && o.y < uWs[k].z + 0.02 && uTs > uWs[k].w - 0.6) there = 0.;
            float dw = abs(s) - footW;
            if (there > 0.5 && dw < best) { best = dw; at = p - vec2(0.76*sin(o.y), -cos(o.y))*s; }
          }
          return vec3(best, at);
        }
        void main(){
          // (every cut of this sheet is decided where it stands and made further down, straight after the last derivative is
          // taken, in the glitter: a derivative taken after a cut is not defined for the pixels beside it)
          bool cut = vCt > 0.02 && vCt < 0.98 && vBr < 0.5;
          { vec3 gn = cross(dFdx(vW), dFdy(vW)); if ((vBr > 0.003 || vCt > 0.003) && abs(gn.y) < 0.5*length(gn)) cut = true; }      // nor may the pour or the court's sheet stand steeper than sixty degrees anywhere      // a triangle that steps from the court's table down to the beach would stand on edge like a pane of glass
          vec3 P = vW; vec3 V = cameraPosition - P; float dist = length(V); V /= max(dist, 1e-3);
          vec2 o = cbtOval(P.xz); float lob = cbtLobes(P.xz) + 0.5*sin(uTime*0.9 + P.z*0.21 + P.x*0.13);
          float rampF = cbtRamp(P.xz, o.x)*step(161., o.x);
          if (vCt > 0.5 && o.x > 161.5 && rampF < 0.5 && vBr < 0.5) cut = true;      // the crown's sheet beyond the reach of the court's flood carries nothing
          float f, gap, depth = vDp.x, court = max(step(o.x, 161.), rampF);
          if (court > 0.5) { f = uCourt.x - (cbtCourtRun(P.xz) + lob); gap = 6.; depth = 0.07 + (0.25 + uCourt.w)*smoothstep(0., 30., f)*step(o.x, 161.) + 0.26*smoothstep(0.4, 9., f)*rampF; }
          else { f = uSea.x - (-P.x + lob); gap = max(uSea.w - uSea.x, 0.6); }
          float standing = court > 0.5 ? 0. : smoothstep(0.075, 0.14, depth + 0.02*lob);      // (the edge of standing water follows the lobes of the run-up: the beach falls 1 in 40, so a lobe of seven metres is 0.17 m of depth; no sheet ends in a straight line)
          // seep water is still only where the beach stands above the sea, along a ragged edge; a filled moat flows
          float stillF = vDp.y*smoothstep(-0.35, 0.45, cbtBase(P.xz) + 0.05*lob - uSea.z), flow = 0., flowS = 0., flowCr = 0.; vec2 lipF = vec2(0.);
          for (int i = 0; i < 3; i++) { float r = i == 0 ? uMoatR.x : i == 1 ? uMoatR.y : uMoatR.z;
            float dm = o.x - r; if (i == 2 && dm > 0.) dm *= 0.62;
            float fl = (1. - smoothstep(5.4, 8., abs(dm) + 0.1*lob))*smoothstep(0., 0.03, o.y - uMoat[i].x)*step(0.2, depth)*(1. - court)*smoothstep(-0.5, 0.2, cbtBase(P.xz) - uSea.z);
            if (fl > flow) { flow = fl; flowS = o.y*r*0.8; }
            { float lp = (1. - smoothstep(0.5, 2.2, abs(abs(dm + 0.4) - 7.5)))*(1. - smoothstep(0.75, 0.86, abs(o.y))); if (lp > lipF.x) lipF = vec2(lp, o.y*r*0.8); } }      // the outer lip of a moat, where a swash sheet falls in
          float fade = clamp(1. + f/gap, 0., 1.);                                   // the film the backwash leaves: thins, dulls, pricks with pinholes
          float pin = cbtN3(vec3(P.xz*1.9, 2.)), fv = fade*fade*1.2 - 0.1 - pin;
          float gfv = fwidth(fv);      // (its derivative, taken for every pixel: before the choice below, where neighbours agree)
          float film = f > 0. ? 1. : smoothstep(-1., 1., fv/max(gfv*0.9, 0.012));      // (pinholes with edges, never a haze)
          float present = max(standing, film);
          if (rampF > 0.5) { float rwd = abs(P.x) + 0.6*sin(P.z*0.31 + (P.x > 0. ? 3.4 : 1.3)) + 0.4*sin(P.z*0.83 + (P.x > 0. ? 0.5 : 2.6)); present *= (1. - smoothstep(4.0, 4.5, rwd + 0.14*lob))*smoothstep(-0.12, 0.12, f); }
          if (court < 0.5 && o.x > 190. && o.x < 212. && P.z < 385.) { float rwd2 = abs(P.x) + 0.6*sin(P.z*0.31 + (P.x > 0. ? 3.4 : 1.3)) + 0.4*sin(P.z*0.83 + (P.x > 0. ? 0.5 : 2.6));
            present *= mix(smoothstep(201.7, 202.3, o.x + 0.5*lob), 1., smoothstep(6.2, 6.8, rwd2)); }      // (the film thins out raggedly where the bridge begins to rise)
          if (present < 0.01) cut = true;
          // (from here on a pixel that is cut works out only what a derivative is taken of, for its neighbours' sake: the tests of cut below spare it the rest)
          float px = 1.5*fwidth(atan(V.y, max(length(V.xz), 1e-3))) + 0.0012;
          // little waves: standing water is calm, the sea chops a little
          float sea = smoothstep(0.3, 2.5, depth)*(1. - stillF);
          vec2 wv = P.xz*0.7 + vec2(uTime*0.7, uTime*0.3), wv2 = P.xz*2.9 - vec2(uTime*0.9, uTime*0.5);
          vec2 g = vec2(cbtN3(vec3(wv, 1.)) - cbtN3(vec3(wv + vec2(0.35, 0.), 1.)), cbtN3(vec3(wv, 1.)) - cbtN3(vec3(wv + vec2(0., 0.35), 1.)));
          g += 0.5*vec2(cbtN3(vec3(wv2, 4.)) - 0.5, cbtN3(vec3(wv2, 6.)) - 0.5);
          float amp = (0.035 + 0.22*sea + 0.03*smoothstep(0., 0.6, f)*(1. - smoothstep(2., 14., f)))/(1. + dist*0.012);
          vec3 N = vec3(g.x*amp, 1., g.y*amp); N /= max(length(N), 1e-4);
          float nv = max(dot(N, V), 0.), fr = 1. - nv; float fr2 = fr*fr; fr = 0.04 + 0.96*fr2*fr2*fr;
          vec3 R = reflect(-V, N); R.y = (abs(R.y) + 0.004)*(1. + 0.5*stillF); R /= max(length(R), 1e-4);      // still seep water holds the castle a little taller than a true mirror would
          float art = smoothstep(0.2, 0.9, stillF)*(1. - smoothstep(8., 9.5, abs(o.x - uMoatR.z)*(o.x > uMoatR.z ? 0.62 : 1.)));
          if (art > 0.003) { // STILL SEEP WATER HOLDS THE CASTLE: from its inner bank outward the trench shows the curtain's turrets and then the
            // spires above them, foot to tip, wherever we stand (a true mirror at this height would hold only the wall or only the sky)
            // across the trench, inner bank to outer: foot to tip; along it, from the bridge outward: the castle from side to side
            float mr = abs(o.x - uMoatR.x) < 9. ? uMoatR.x : abs(o.x - uMoatR.y) < 9. ? uMoatR.y : uMoatR.z, wid = mr < 200. ? 17. : 13.;
            float along = clamp((abs(P.x) - 5.)/50., 0., 1.)*2. - 1.;
            vec2 toC = vec2(along*(P.x < 0. ? -74. : 74.), 385.) - P.xz; toC /= max(length(toC), 1e-3);
            vec2 rh = R.xz/max(length(R.xz), 1e-4); rh = mix(toC, rh, 0.15); rh /= max(length(rh), 1e-4);
            float te = mix(0.1, 0.82, clamp((o.x - mr + 6.6)/wid, 0., 1.));
            vec3 Ra = vec3(rh.x, te, rh.y); R = mix(R, Ra/length(Ra), art); R /= max(length(R), 1e-4); }
          vec3 Rg = R;
          vec3 mirC = cbtMirror(P, R, px, art, cut || rampF > 0.5);      // (the mirror takes a derivative: it is asked for every pixel, before the choice below, where neighbours agree)
          vec3 mir = rampF > 0.5 ? cbtSky(vec3(R.x, R.y*0.6 + 0.2, R.z)) : mirC;
          float sh = cbtSun(vSh);
          if (!cut) depth = max(depth, 0.04 + 0.15*clamp(f - 0.4, 0., 7.)*(1. - 0.9*cbtRamp(P.xz, o.x)));                         // a swash sheet thickens behind its edge
          depth = mix(depth, 0.16, vBr);
          depth = max(depth, 0.95*vBr);                                             // (the outpour is glass green, like all this water)
          // the flood is glass green a few metres behind its edge (never sand-brown through a thin sheet), deeper in
          // pools away from the curtain's foot, paler where low bars of sand lie just under the surface
          if (!cut && court > 0.5 && rampF < 0.5) depth = max(depth, smoothstep(0.5, 6., f)*(0.5 + 0.9*smoothstep(0.3, 0.75, cbtN3(vec3(P.xz*0.03, 9.)))*smoothstep(2., 22., 161. - o.x)));
          float body = 1. - exp(-max(depth - 0.05, 0.)*1.6);                        // glass green by depth
          vec3 green = mix(uWaterC, uWaterC*uWaterC*1.15, 0.55*smoothstep(1., 6., depth))*mix(0.74, 1., sh*0.6 + 0.4);
          float frM = fr*mix(1., 0.5, body); frM = mix(frM, max(frM, 0.5), court*clamp(uCourt.w, 0., 1.));
          frM = mix(frM, max(frM, 0.82), (1. - step(0., f))*fade*(1. - court)*(1. - standing));              // sand the water has just left: a full mirror for a few seconds
          frM = mix(frM, max(frM, 0.8), stillF*(1. - court));                                    // still seep water in a moat is a mirror
          frM = mix(frM, max(frM, 0.46), step(o.x, 161.)*smoothstep(2., 14., f));                // the flood on the court lies still enough to hold the spires
          { // wavelets run through the flood on the court, each crest taking the sky (finer than three pixels: their average)
            float rph = dot(P.xz, vec2(-0.447, 0.894))*1.5 - uTime*2.6 + 5.5*cbtN3(vec3(P.xz*0.06, uTime*0.05)) + 1.6*cbtN3(vec3(P.xz*0.31, 3.));
            float rph2 = dot(P.xz, vec2(-0.13, 0.99))*2.3 - uTime*3.1 + 2.6*cbtN3(vec3(P.xz*0.13 + 9., uTime*0.07));
            float rw = fwidth(rph), rw2 = fwidth(rph2);
            float rip = 0.72*sin(rph)*(1. - smoothstep(0.7, 1.7, rw)) + 0.28*sin(rph2)*(1. - smoothstep(0.7, 1.7, rw2));
            float filmW = (1. - court)*smoothstep(0.4, 2.5, f)*(1. - smoothstep(7., 18., f))*(1. - standing);      // a swash sheet still running
            if (!cut) frM = clamp(frM + 0.24*rip*(0.55 + 0.9*cbtN3(vec3(P.xz*0.05, uTime*0.11)))*max(max(court*(1. - rampF)*smoothstep(1., 8., f), 0.2*filmW), 1.05*sea*(1. - court)), 0.02, 1.);
            // on a running sheet every wavelet crest is a thin line of sky: the sheet is drawn, not shaded
            if (!cut) { float cr1 = smoothstep(0.74, 0.92, sin(rph))*(1. - smoothstep(0.5, 1.4, rw)), cr2 = smoothstep(0.8, 0.95, sin(rph2))*(1. - smoothstep(0.5, 1.4, rw2));
              frM = clamp(frM + 0.5*max(cr1, 0.7*cr2)*max(filmW, 0.8*sea*(1. - court))*smoothstep(0.3, 0.6, cbtN3(vec3(P.xz*0.23, uTime*0.3))), 0.02, 1.); }
            // and down a filled moat the water runs: crests and streaks of fizz travelling from the port horn toward the bridge
            float mph = flowS*1.1 + uTime*3.4 + 3.*cbtN3(vec3(P.xz*0.09, uTime*0.06)), mw = fwidth(mph);
            frM = clamp(frM + 0.3*sin(mph)*(1. - smoothstep(0.7, 1.7, mw))*flow, 0.02, 1.);
            if (!cut) flowCr = smoothstep(0.93, 0.99, sin(mph*0.3 + 2.2*cbtN3(vec3(P.xz*0.21, uTime*0.2))))*(1. - smoothstep(2., 5., mw))*flow; }      // every third crest breaks: curved lines of fizz running with the tongue
          float alpha = (frM + (1. - frM)*body)*present;
          vec3 col = (green*(1. - frM)*body + mir*frM)/max(frM + (1. - frM)*body, 1e-3);
          // the white edge: lobed lace on the front, fraying to fizz behind it; thin surf lines far out
          float lw = clamp(0.06*dist, 0.5, 2.6);                                    // a lace edge of about the same width on screen near and far
          float fq = max(fwidth(P.x), fwidth(P.z));
          float cells = 0., cells2 = 0.; if (!cut) { cells = cbtN3(vec3(P.xz*1.5 + uTime*0.15, uTime*0.35)); cells2 = cbtN3(vec3((P.x*0.8 + P.z*0.6)*4.7, (P.z*0.8 - P.x*0.6)*2.6, uTime*0.6)); }
          float foam = cbtLace(P.xz, f, lw, fq, cut);
          { // behind the lip: lace fraying to threads along the flow, and the lines of old foam (the sheet shows which way it runs and where it has been)
            vec2 fdir = court > 0.5 ? vec2(-0.447, 0.894) : vec2(-1., 0.);
            float runC = court > 0.5 ? cbtCourtRun(P.xz) + lob : -P.x + lob;
            float bandD = 6.; if (!cut) bandD = mix(6., 12., cbtN3(vec3(P.xz*0.03, 7.)));
            foam = max(foam, cbtTideDraw(P.xz, f, runC, fdir, bandD, stillF, cut)*(1. - 0.75*rampF)*(1. - 0.85*sea)); }
          if (!cut) foam = max(foam, flow*smoothstep(0.6, 0.78, cbtN3(vec3(flowS*0.3 + uTime*1.5, o.x*0.7, uTime*0.25)))*0.7/(1. + dist*0.012));
          foam = max(foam, flowCr*smoothstep(0.3, 0.55, cells*0.5 + cells2*0.5)*0.9);
          float su = (P.x - 150.)/95. - uTime*0.06 + 0.12*cbtN3(vec3(P.z*0.012, 3., 1.)), sw = fwidth(su);
          float line = (1. - smoothstep(0.01 + sw*0.5, 0.02 + sw*1.5, abs(fract(su) - 0.5)))*smoothstep(300., 390., P.x)*(1. - smoothstep(680., 800., P.x));      // four ruled lines, well outside the outer wall
          if (!cut) foam = max(foam, line*(0.5 + 0.5*cbtN3(vec3(P.z*0.012 + uTime*0.06, P.x*0.02, 2.)))*(1. - court)*clamp(0.03/max(sw, 1e-4), 0., 1.));
          if (!cut) for (int i = 0; i < 3; i++) {                                             // the nose of each tongue racing along its moat
            float r = i == 0 ? uMoatR.x : i == 1 ? uMoatR.y : uMoatR.z, da = (o.y - uMoat[i].x)*r*0.8;
            da += lob*0.22;
            float dn = o.x - r; if (i == 2 && dn > 0.) dn *= 0.62;
            float nose = (1. - smoothstep(5.2, 8.2, abs(dn)))*smoothstep(-0.6, 0.4, da)*(1. - smoothstep(0.4*max(lw, 1.3), 3.*max(lw, 1.3), da))*step(0.5, stillF + step(0.3, depth));
            foam = max(foam, nose*smoothstep(0.4, 0.6, cells*0.6 + cells2*0.4 + 0.24*(1. - smoothstep(0., 2.5, da))));
          }
          if (!cut) { float pour = lipF.x*smoothstep(0.5, 3., f)*(1. - smoothstep(16., 38., f))*smoothstep(-0.5, 0.1, cbtBase(P.xz) - uSea.z)*(1. - court);
            // a broken white line: streaks of white water falling over the lip, each a hand wide, with gaps between
            float st1 = cbtN3(vec3(lipF.y*2.6, o.x*0.5 + uTime*1.7, 2.)), st2 = cbtN3(vec3(lipF.y*0.6, uTime*0.5, 7.));
            foam = max(foam, pour*smoothstep(0.46, 0.58, st1)*smoothstep(0.3, 0.42, st2)); }
          float ringW = 0.;
          if (!cut) for (int i = 0; i < 4; i++) {                                             // a turret sits down into the sea: a ring of foam runs out from its fan
            float dl = length(P.xz - uSl[i].xy), ag = uTs - uSl[i].z + uSl[i].w;      // (w: the ring of a turret passed close starts with its skirt)
            float nearT = step(0.5, uSl[i].w), lwr = lw*mix(1., 0.5, nearT);
            float rr = mix(21., 12., nearT) + mix(24., 12., nearT)*smoothstep(0.3, 4.8, ag) + 5.*(cbtN3(vec3(P.xz*0.13, 5.)) - 0.5) + 2.*(cbtN3(vec3(P.xz*0.45, 7.)) - 0.5) + 8.*smoothstep(5., 16., ag);      // it runs out beyond the fan (21 m), its edge in lobes
            float rOn = smoothstep(0.1, 0.9, ag)*(1. - smoothstep(10., 20., ag));
            float ring = max(max(1. - smoothstep(0., 5.6*lw, abs(dl - rr)), 0.8*(1. - smoothstep(0., 3.2*lw, abs(dl - rr + 9.)))), 0.5*(1. - smoothstep(rr - 12., rr, dl)))*rOn*mix(1., 0.22, nearT);
            float lead = smoothstep(rr - 4.6*lwr, rr - 3.4*lwr, dl)*(1. - smoothstep(rr - 0.25*lwr, rr + 0.25*lwr, dl))*rOn*(1. - smoothstep(7., 13., ag));      // the leading band: solid white
            foam = max(foam, max(lead*0.97, ring*smoothstep(0.04, 0.3, cells*0.6 + cells2*0.4 + ring*0.45))*(1. - court)); ringW = max(ringW, max(ring, lead)*(1. - court));
          }
          { // THE COLLAR: where a front reaches the foot of a turret or a wall its foam edge wraps the foot, falls back
            // and frays into lace that trails downstream of it
            vec3 ft = cbtFoot(P.xz, o);
            vec2 fdir = court > 0.5 ? vec2(-0.447, 0.894) : vec2(uSea.x >= uSea.w - 3.2 ? -1. : 1., 0.);      // up the beach with the swash, back down with the backwash
            vec2 v = P.xz - ft.yz; float al = dot(v, fdir), pe = dot(v, vec2(-fdir.y, fdir.x));
            float wk = cbtN3(vec3(pe*0.9 + 3.*cbtN3(vec3(P.xz*0.2, 1.)), al*0.14 - uTime*0.25, 4.4)), gwk = fwidth(wk);      // (the thread's noise and its derivative, taken for every pixel: before the branch, where neighbours agree)
            if (!cut && ft.x < 16.) {
              float fc = court > 0.5 ? f : max(f, 0.) + 6.*standing;                              // (standing sea laps a foot for good)
              float surge = smoothstep(0., 1.5, f)*(0.35 + 0.65*exp(-max(fc, 0.)/9.));
              float cw = mix(0.8, 2.4, surge)*(0.7 + 0.6*cbtN3(vec3(P.xz*0.4, uTime*0.3)));
              float ringF = (1. - smoothstep(0.3*cw, cw, ft.x))*step(-2.5, ft.x)*surge;
              float ww = max(gwk*max(0.11/max(fq, 1e-4), 1.25), 1e-4);
              float wake = smoothstep(4., 9., al)*(1. - smoothstep(14., 30., al))*(1. - smoothstep(4., 8.5, abs(pe)))*mix(1. - smoothstep(0.5*ww, ww, abs(wk - 0.5)), 0.2, smoothstep(0.08, 0.2, gwk))*smoothstep(0.5, 3., f)*(1. - smoothstep(12., 40., fc));
              float lacy = smoothstep(0.3, 0.62, cells*0.6 + cells2*0.4 + 0.45*surge*(1. - smoothstep(0., 0.5*cw, ft.x)));
              foam = max(foam, max(ringF*lacy, 0.85*wake)); } }
          { // down the breach the outpour is glass green, drawn with threads of lace along its flow (white is threads, not a mass)
            float nb = cbtN3(vec3(o.y*95., o.x*0.3 - uTime*2.4, 3.)), wb = max(0.06, 1.25*fwidth(nb));
            float nb2 = cbtN3(vec3(o.y*210. + 5., o.x*0.45 - uTime*3.1, 7.)), wb2 = max(0.07, 1.25*fwidth(nb2));
            float thrB = max(mix(1. - smoothstep(0.5*wb, wb, abs(nb - 0.5)), 0.2, smoothstep(0.1, 0.24, wb)), 0.8*mix(1. - smoothstep(0.5*wb2, wb2, abs(nb2 - 0.47)), 0.15, smoothstep(0.1, 0.24, wb2)));
            foam = max(foam, vBr*max(thrB, smoothstep(0.62, 0.8, cells2)*smoothstep(170., 186., o.x))*0.96); }
          { float brA = smoothstep(uBr.x - 0.012, uBr.x + 0.03, o.y)*(1. - smoothstep(uBr.y - 0.03, uBr.y + 0.012, o.y))*smoothstep(1.4, 4.5, uTs - uBr.z - uBr.w*clamp((uBr.y - o.y)/max(uBr.y - uBr.x, 1e-3), 0., 1.));
            float apron = brA*smoothstep(180., 189., o.x)*(1. - smoothstep(203., 228. + 0.8*lob, o.x));
            // where the outpour meets the water outside: one white edge of lace along the meeting, fraying to threads beyond it
            float meet = 1. - smoothstep(190., 199., o.x + 0.5*lob);
            foam = max(foam, apron*smoothstep(mix(0.4, 0.14, meet), mix(0.6, 0.42, meet), cells*0.55 + cells2*0.45 + 0.34*meet));
 }
          { float fb = uBore - (cbtCourtRun(P.xz) + 0.55*lob), bw = max(lw, 0.8);      // the bore on the nave floor: a lobed lace edge, fizz behind it
            foam = max(foam, step(o.x, 161.)*step(0.5, present)*cbtLace(P.xz + 31., fb, bw, fq, cut)); }
          foam *= step(0.5, present + step(0., f) + vBr);
          vec3 foamC = mix(mix(uShadeC*2.1, uFoamC, 0.35 + 0.57*max(vBr, ringW)), uFoamC, sh);
          col = mix(col, foamC, foam); alpha = max(alpha, foam);
          { vec3 fp = fwidth(P); float pm2 = max(max(fp.x, fp.y), fp.z);
            if (cut) discard;      // (the cuts decided above are made here: this was the last derivative)
            float lv = floor(log2(max(pm2, 0.004)/0.004)), cs = 1./(0.0075*exp2(lv));
            vec3 gc = vec3(floor(P.xz*cs), lv*17.); float gh = cbtH31(gc), g2 = cbtH31(gc + 9.7);
            float tw2 = smoothstep(0.55, 1., 0.5 + 0.5*sin(uTime*(1.4 + 2.6*g2) + g2*97.));
            float sd = max(dot(Rg, uSunDir), 0.), pth = sd*sd; pth *= pth;
            vec2 vh2 = -V.xz/max(length(V.xz), 1e-4), sh3 = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
            float az = smoothstep(-0.15, 0.95, dot(vh2, sh3)); az *= az;                    // the low sun lays a path of glitter on the water toward itself
            float glit = step(1. - (0.012 + 0.11*pth + 0.16*az)*(0.35 + 0.65*max(sea, smoothstep(0., 2., f))), gh)*tw2*sh*step(0.5, present)*uGlint;
            col = mix(col, vec3(1., 0.985, 0.93), glit*0.9); alpha = max(alpha, glit*0.9); }
          col = mix(col, uSkyLo, cbtBleach(dist));
          gl_FragColor = vec4(col, alpha);
        }` });
    await ctx.yield();
    const wGeo = new THREE.BufferGeometry(); wGeo.setAttribute('position', posAttr); wGeo.setIndex(wIdx);
    const water = new THREE.Mesh(wGeo, waterMat); water.name = 'water'; water.frustumCulled = false; water.renderOrder = 5;
    scene.add(water);
    await ctx.yield();

    // ---- the sky: a plain bleached gradient and nothing else (its real work is done lying down, in the mirrors)
    const skyMat = new THREE.ShaderMaterial({ uniforms: U, depthWrite: false, depthTest: false, side: THREE.BackSide,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.);
        if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`${STYLE_GLSL} varying vec3 vDir;
        void main(){ vec3 d = vDir/max(length(vDir), 1e-4); gl_FragColor = vec4(cbtSky(vec3(d.x, max(d.y, 0.), d.z)), 1.); }` });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, 24, 12), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'sky';
    scene.add(sky);
    await ctx.yield();

    // (the course, path, was laid above, while the hero was built)

    // ---- THE TIDE, as functions of the journey second T (scripted to the camera) with a slow lap on world time
    const pulse = (s) => (s < -1 || s > 2.2 ? 0 : s < 0 ? sstep(-1, 0, s) : 1 - sstep(0, 2.2, s));
    const SW = rare ? [[4, 1.7, 8], [8.4, 2.0, 11], [19.5, 3.2, 60], [27, 2.4, 12], [35, 2.4, 14]] : [[4, 1.7, 8], [8.4, 2.0, 11], [14.5, 2.2, 10], [24, 2.4, 12], [34, 2.6, 14]];
    const seaFront = (T) => { let f = -5 + Math.max(T, 0) * 0.3; for (const [t, w, a] of SW) f += a * pulse((T - t) / w); return f; };
    await ctx.yield();
    const reachTab = new Float32Array(T_END * 4 + 60); { let m = -1e9; for (let i = 0; i < reachTab.length; i++) { m = Math.max(m, seaFront(i / 4)); reachTab[i] = m; } }
    const seaLevel = (T) => -0.75 + T * 0.03 + (rare ? 1.0 * sstep(18, 24, T) : 0);
    // the fourth swash: over the court while we linger (the inner ward turns green), into the nave ahead of our descent, then
    // creeping to the mouth, where it arrives just behind us. [journey second, run coordinate of the front]
    const SW4 = [[16.6, -75], [18.2, -12], [19.4, 12], [21, 24], [22.5, 42], [24, 76], [26, 108], [28, 150], [29.3, 178], [33, 186], [36.4, 193], [40, 207], [42, 214], [60, 222]];
    const swash4 = (T) => { if (T <= SW4[0][0]) return SW4[0][1]; for (let i = 1; i < SW4.length; i++) if (T < SW4[i][0]) { const a = SW4[i - 1], b = SW4[i]; return lerp(a[1], b[1], sstep(-0.25, 1.25, (T - a[0]) / (b[0] - a[0])) * 1.174 - 0.087); } return 222; };
    const courtFront = (T) => Math.max(-70 + 90 * pulse((T - 14.7) / 4), rare ? Math.min(-60 + (T - 19.5) * 30, 230) : swash4(T));
    let courtMax = -1e5, courtT = 0;
    const tide = (T, time) => {
      const lap = 1.7 * Math.sin(time * 0.62) + 0.8 * Math.sin(time * 1.63 + 1);
      const f = seaFront(T) + lap; let rec = f; for (let k = 1; k <= 8; k++) rec = Math.max(rec, seaFront(T - k * 0.5));
      const L = seaLevel(T);
      U.uSea.value.set(f, Math.max(reachTab[Math.min(reachTab.length - 1, Math.max(0, Math.round(T * 4)))], f) + 2.6, L, rec + 3.2);
      // (moat 3: the nose races round from the port horn, slows as it nears the sand bridge and reaches it at 11.5 s, surging as it comes)
      const th3n = T < 9.5 ? 1.25 - Math.max(0, T - 5.5) * 0.2625 : 0.2 - 0.165 * sstep(9.5, 11.5, T), th3 = th3n + 0.011 * Math.sin(time * 1.1) * sstep(0.04, 0.1, th3n);
      const th = [0.25 - T * 0.085, 0.9 - T * 0.118, Math.max(rare && T > 21 ? -2 : 0.035, th3)];
      for (let i = 0; i < 3; i++) U.uMoat.value[i].set(th[i], L + 0.22, th[i], i === 2 ? -0.62 : -4.1 + 0.15 * i);      // moat 3 stands brim-full of seep water: the mirror of the 12.5 s image
      const cf = courtFront(T) + lap * 1.1;
      if (T < courtT - 0.5) courtMax = -1e5; courtT = T; courtMax = Math.max(courtMax, cf);
      U.uCourt.value.set(cf, courtMax + 1.5, courtLevel(T), rare ? 1.5 * sstep(22, 30, T) : 0);
      waterU.uBore.value = !rare && T > 30 ? 175 + (T - 36.9) * 11 + lap * 0.5 : -1e5;
    };
    tide(0, 0);


    // ---- LIFE. Everything below is shaded by the same sand light (tint = another pigment through the one light).
    const tintMat = sandMaterial({ tint: true });
    const lrng = rng.fork ? rng.fork('life') : rng;
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), qB = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    // small builder: merge simple parts into one geometry with position, normal, aD and (optionally) a vertex tint
    const partsGeo = (parts, flatShade) => {
      const P = [], I = [], Tn = [];
      for (const pt of parts) { const b = P.length / 3; for (let i = 0; i < pt.p.length; i += 3) { P.push(pt.p[i], pt.p[i + 1], pt.p[i + 2]); const c = pt.c ?? [1, 1, 1, 0]; Tn.push(c[0], c[1], c[2], c[3]); } for (const k of pt.i) I.push(b + k); }
      let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTint', new THREE.Float32BufferAttribute(Tn, 4)); g.setIndex(I);
      if (flatShade) { const ni = g.toNonIndexed(); g.dispose(); g = ni; }
      g.computeVertexNormals(); g.setAttribute('aD', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      return g;
    };
    // a tube of rings along a centre line: pts [x, y, z, radius], sides
    const tube = (pts, sides, c, squash = 1) => {
      const p = [], ix = [], n = pts.length;
      for (let k = 0; k < n; k++) {
        const a = pts[Math.max(k - 1, 0)], b = pts[Math.min(k + 1, n - 1)]; let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        let ux = -tz, uy = 0, uz = tx; const ul = Math.sqrt(ux * ux + uz * uz); if (ul < 1e-3) { ux = 1; uz = 0; } else { ux /= ul; uz /= ul; }
        const wx = ty * uz - tz * uy, wy = tz * ux - tx * uz, wz = tx * uy - ty * ux, r = pts[k][3];
        for (let s = 0; s < sides; s++) { const f = s / sides * TAU, cs = Math.cos(f) * r, sn = Math.sin(f) * r * squash; p.push(pts[k][0] + ux * cs + wx * sn, pts[k][1] + uy * cs + wy * sn, pts[k][2] + uz * cs + wz * sn); }
        if (k < n - 1) for (let s = 0; s < sides; s++) { const a0 = k * sides + s, a1 = k * sides + (s + 1) % sides, b0 = a0 + sides, b1 = a1 + sides; ix.push(a0, a1, b0, a1, b1, b0); }
      }
      return { p, i: ix, c };
    };
    const lin = (h) => { const c = C(pig(h)); return [c.r, c.g, c.b]; };
    await ctx.yield();

    // sand hoppers: glassy pale-grey bodies 1.1 m long that spring in arcs ahead of every swash
    const NH = Math.max(40, Math.round(120 * detail * density));
    const hopGeo = (() => {
      const g1 = [...lin('#BCC3CA'), 1.6], g2 = [...lin('#8E96A3'), 1.4], back = [];
      for (let k = 0; k <= 6; k++) { const t = k / 6, a = -1.15 + t * 2.75; back.push([Math.sin(a) * 0.44, 0.34 + Math.cos(a) * 0.34 - 0.16, 0, (0.05 + 0.25 * Math.max(0, Math.sin(Math.PI * Math.min(1, t * 1.1))) ** 0.6) * (k % 2 ? 1.08 : 0.9)]); }
      const leg = (z) => tube([[-0.05, 0.22, z, 0.07], [-0.42, 0.0, z * 1.6, 0.03]], 3, g2);
      const ant = (z) => tube([[0.38, 0.42, z, 0.035], [0.74, 0.5, z * 3, 0.02]], 3, g2);
      const body = tube(back, 5, g1, 1.0); for (let i = 2; i < body.p.length; i += 3) body.p[i] *= 0.6;      // laterally flat, like the real thing
      const walk = (x, z) => tube([[x, 0.2, z, 0.05], [x - 0.08, -0.04, z * 2, 0.025]], 3, g2);
      return partsGeo([body, leg(0.1), leg(-0.1), walk(0.22, 0.1), walk(0.22, -0.1), walk(0.06, 0.1), walk(0.06, -0.1), ant(0.04), ant(-0.04)]);
    })();
    const hoppers = new THREE.InstancedMesh(hopGeo, tintMat, NH); hoppers.frustumCulled = false; hoppers.name = 'sand-hoppers'; hoppers.receiveShadow = true;
    const hop = [];
    for (let i = 0; i < NH; i++) hop.push({ z: i < NH * 0.82 ? lrng.range(4, 236) : lrng.range(262, 300), side: lrng.chance(0.62) ? 1 : -1, off: lrng.range(1.5, 13), per: lrng.range(1.25, 1.9), ph: lrng.range(0, 10), sd: lrng.range(0, 1000), len: lrng.range(15, 20) });
    scene.add(hoppers);
    await ctx.yield();
    const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const hopLand = (h, n, T) => {            // where hop n comes down: just ahead of the water's edge, never across the course
      const edge = -seaFront(T), a = hsh(h.sd, n), b = hsh(h.sd + 7, n);
      let x = h.side > 0 ? Math.max(edge - h.off + (a - 0.5) * 9, 5.2 + a * 6) : Math.min(edge - h.off - 4 + (a - 0.5) * 9, -5.2 - a * 6);
      x = clamp(x, -42, 46);
      const sl = seaLevel(T) + 0.12; for (let k = 0; k < 28 && x > 5.2 && baseY(x) < sl; k++) x -= 1.5;      // never out onto the sea itself
      let z = h.z + (b - 0.5) * h.len * 1.5; const rho = oval(x, z)[0]; for (const r of R_M) if (Math.abs(rho - r) < 9.5) z += rho - (r - 10.5);      // nor down into a moat
      return [x, z];
    };
    const updateHoppers = (T, time) => {
      for (let i = 0; i < NH; i++) {
        const h = hop[i], tt = (time + h.ph) / h.per, n = Math.floor(tt), f = tt - n, air = clamp(f / 0.62, 0, 1);
        const A = hopLand(h, n, T), B = hopLand(h, n + 1, T);
        const e = air * air * (3 - 2 * air), x = lerp(A[0], B[0], e), z = lerp(A[1], B[1], e), d = hyp(B[0] - A[0], B[1] - A[1]);
        const gy = (h.z > 250 ? 8.05 : Math.max(baseY(x), U.uSea.value.z)) + 0.1, y = gy + Math.sin(air * Math.PI) * (1.1 + d * 0.13);
        e3.set(0, Math.atan2(-(B[1] - A[1]), B[0] - A[0]), air > 0 && air < 1 ? (0.5 - air) * 2.2 : 0, 'YZX');
        hoppers.setMatrixAt(i, m4.compose(v3.set(x, y, z), q4.setFromEuler(e3), s3.set(0.95, 0.95, 0.95)));
      }
      hoppers.instanceMatrix.needsUpdate = true;
    };

    // the escort: ten hoppers that spring along just ahead of us, a few metres off the course, from the entry to the
    // ramp, so that the natives of this height are seen close to: an arched, segmented, glassy body, legs, antennae.
    // Their clock is the journey second, so they keep station whatever the pace; they are folded away while u = 0.
    const hopGeoHi = (() => {
      const g1 = [...lin('#BCC3CA'), 1.6], g2 = [...lin('#8E96A3'), 1.4], back = [];
      for (let k = 0; k <= 12; k++) { const t = k / 12, a = -1.2 + t * 2.9; back.push([Math.sin(a) * 0.5, 0.36 + Math.cos(a) * 0.36 - 0.14, 0, (0.04 + 0.27 * Math.max(0, Math.sin(Math.PI * Math.min(1, t * 1.08))) ** 0.6) * (k % 2 ? 1.13 : 0.87)]); }
      const body = tube(back, 8, g1, 1.0); for (let i = 2; i < body.p.length; i += 3) body.p[i] *= 0.62;
      const parts = [body];
      for (const sz of [1, -1]) {
        for (let j = 0; j < 4; j++) { const x = 0.3 - j * 0.17; parts.push(tube([[x, 0.2, sz * 0.1, 0.05], [x - 0.04, 0.06, sz * 0.2, 0.04], [x - 0.1, -0.06, sz * 0.18, 0.02]], 4, g2)); }
        parts.push(tube([[-0.3, 0.22, sz * 0.1, 0.08], [-0.56, 0.34, sz * 0.17, 0.06], [-0.74, -0.04, sz * 0.2, 0.025]], 4, g2));      // the springing legs
        parts.push(tube([[0.42, 0.4, sz * 0.05, 0.035], [0.66, 0.52, sz * 0.12, 0.025], [0.86, 0.44, sz * 0.2, 0.012]], 4, g2));     // antennae
      }
      return partsGeo(parts);
    })();
    const NE = 10, escorts = new THREE.InstancedMesh(hopGeoHi, tintMat, NE); escorts.frustumCulled = false; escorts.name = 'hopper-escort'; escorts.receiveShadow = true; escorts.castShadow = true;
    const esc = [], EX = [3.4, 4.8, 6.4, 7.4, 5.4, -3.6, -5.2, 7.0, 4.0, -6.6];
    for (let j = 0; j < NE; j++) esc.push({ x: EX[j], lead: 10 + (j * 5.3) % 14, per: 1.2 + 0.3 * hsh(j, 3), ph: 3 * hsh(j, 9), sd: j * 13.7 });
    scene.add(escorts);
    const landE = (e, n) => {
      const x = clamp(e.x + 1.4 * (hsh(e.sd, n) - 0.5), -7.5, 7.5); let z = e.lead + 15.6 * ((n + 1) * e.per - e.ph);
      const rho = oval(x, z)[0]; for (const r of R_M) if (Math.abs(rho - r) < 9.5) z += rho - (r - 10.5);      // never down into a moat: over it
      return [x, z];
    };
    const updateEscorts = (T, u) => {
      const show = sstep(0.003, 0.03, u);
      for (let j = 0; j < NE; j++) {
        const e = esc[j], tt = (T + e.ph) / e.per, n = Math.floor(tt), fr = tt - n, air = clamp(fr / 0.62, 0, 1);
        const A = landE(e, n - 1), B = landE(e, n), k = air * air * (3 - 2 * air), x = lerp(A[0], B[0], k), z = lerp(A[1], B[1], k), d = hyp(B[0] - A[0], B[1] - A[1]);
        const y = lerp(G(A[0], A[1])[0], G(B[0], B[1])[0], k) + 0.16 + Math.sin(air * Math.PI) * (1.2 + d * 0.12), sc = 1.1 * show * (1 - sstep(204, 222, A[1]));
        e3.set(0, Math.atan2(-(B[1] - A[1]), B[0] - A[0]), air > 0 && air < 1 ? (0.5 - air) * 2.0 : 0, 'YZX');
        escorts.setMatrixAt(j, m4.compose(v3.set(x, y, z), q4.setFromEuler(e3), s3.set(sc, sc, sc)));
      }
      escorts.instanceMatrix.needsUpdate = true;
    };

    // THE HOPPERS OF THE NAVE'S FLOOR, with their own stream. Each has a home on the floor (3.5 to 13 m off the middle,
    // the last 160 m to the mouth) and stands there, at the mould's size as the ordinary hoppers are (the dealt sc and
    // ph are still dealt, as they were, and nothing reads them). It does what the brief's hoppers do: when a water's
    // edge comes within 10 m of where it stands it springs, in an arc of its dealt length (15 to 20 m) and its dealt
    // time in the air, away from the edge onto sand the water has not reached; it lands, stands, and springs again
    // when an edge is within 10 m of it again. One with no open sand left within an arc makes its last spring onto
    // sand that stands above the flood's highest surface (a cone, the foot of a wall) and stays there. None rides the
    // water and none stands under it. THEY RIDE ON THE JOURNEY SECOND, as the water does: every spring is worked out
    // here, once, from the water's own functions, and a hopper's place is a function of T alone.
    const nrng = makeRng(hashSeed('cbt-nave-hoppers:' + ctx.seed));
    const NN = Math.max(20, Math.round(40 * detail * density)), naveHop = [];
    const naveHoppers = new THREE.InstancedMesh(hopGeo, tintMat, NN); naveHoppers.frustumCulled = false; naveHoppers.name = 'nave-hoppers'; naveHoppers.receiveShadow = true;
    for (let j = 0; j < NN; j++) naveHop.push({ x: (nrng.chance(0.5) ? 1 : -1) * nrng.range(3.5, 13), z: nrng.range(300, 456), per: nrng.range(1.2, 1.75), ph: nrng.range(0, 10), sd: nrng.range(0, 1000), len: nrng.range(15, 20), sc: nrng.range(1.25, 1.6) });
    scene.add(naveHoppers);
    // THE EDGE'S LOBES exist only in the shader (cbtLobes, ../parts/castle-before-the-tide.js line 167). Here they are taken
    // at their furthest reach: so a hopper that springs from a stand does so a little early, with the drawn edge 12.7 to
    // 30.0 m off at the film's clock (seeds 1 to 60), while one that springs at once on landing can have it nearer (9.3 m);
    // and a landing is judged dry only where the lobes at their furthest could not have wetted it.
    const NAVE_LOBES = -(11 + 3 + 0.8) / 2;
    // the court's front has passed a place when courtFront(T), with its lap, is at or beyond this (the shader's
    // cbtCourtRun, part file line 168, and its lobes at their furthest reach)
    const naveRun = (x, z) => z - 250 - 0.5 * x + NAVE_LOBES;
    // the nave's sand as built (the mound and the two corner cones), read from their triangles on a grid of half a
    // metre, and on it the run coordinate of every place the flood can cover (sand below its highest surface)
    const NVX = -24, NVZ = 284, nvx = 97, nvz = 373, nvY = new Float32Array(nvx * nvz).fill(-1e9), nvR = new Float32Array(nvx * nvz).fill(1e9);
    for (const m of [hero.meshes.mound, hero.object.getObjectByName('corner-cones')]) {
      const p = m.geometry.attributes.position, ix = m.geometry.index.array, tv = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      for (let t = 0; t < ix.length; t += 3) {
        for (let k = 0; k < 3; k++) tv[k].fromBufferAttribute(p, ix[t + k]).applyMatrix4(m.matrixWorld);
        const x0 = tv[0].x, z0 = tv[0].z, e1x = tv[1].x - x0, e1z = tv[1].z - z0, e2x = tv[2].x - x0, e2z = tv[2].z - z0, det = e1x * e2z - e1z * e2x;
        const i0 = Math.max(0, Math.ceil((Math.min(x0, tv[1].x, tv[2].x) - NVX) * 2)), i1 = Math.min(nvx - 1, Math.floor((Math.max(x0, tv[1].x, tv[2].x) - NVX) * 2));
        const j0 = Math.max(0, Math.ceil((Math.min(z0, tv[1].z, tv[2].z) - NVZ) * 2)), j1 = Math.min(nvz - 1, Math.floor((Math.max(z0, tv[1].z, tv[2].z) - NVZ) * 2));
        if (Math.abs(det) > 1e-9) for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
          const dx = NVX + i * 0.5 - x0, dz = NVZ + j * 0.5 - z0, a = (dx * e2z - dz * e2x) / det, b = (dz * e1x - dx * e1z) / det;
          if (a >= -1e-6 && b >= -1e-6 && a + b <= 1 + 1e-6) nvY[i * nvz + j] = Math.max(nvY[i * nvz + j], tv[0].y + a * (tv[1].y - tv[0].y) + b * (tv[2].y - tv[0].y));
        }
        if (t % 9000 === 8997) await ctx.yield();
      }
      await ctx.yield();
    }
    for (let i = 0; i < nvx; i++) {
      for (let j = 0; j < nvz; j++) if (nvY[i * nvz + j] > 0 && nvY[i * nvz + j] < courtTop) nvR[i * nvz + j] = naveRun(NVX + i * 0.5, NVZ + j * 0.5);
      if (i % 6 === 5) await ctx.yield();
    }
    const naveSand = (x, z) => {            // the sand's height at a place of the nave (far below zero where the nave has none)
      const fi = (x - NVX) * 2, fj = (z - NVZ) * 2, i = Math.floor(fi), j = Math.floor(fj); if (i < 0 || j < 0 || i > nvx - 2 || j > nvz - 2) return -1e9;
      const o = i * nvz + j; return lerp(lerp(nvY[o], nvY[o + nvz], fi - i), lerp(nvY[o + 1], nvY[o + nvz + 1], fi - i), fj - j);
    };
    // a place to stand: sand of the nave, no steeper than dry sand lies (34 degrees), short of the head wall
    const NAVE_REPOSE = Math.tan(34 * Math.PI / 180);
    const naveStands = (x, z) => naveSand(x, z) > 0 && z <= 459 && hyp(naveSand(x + 0.5, z) - naveSand(x - 0.5, z), naveSand(x, z + 0.5) - naveSand(x, z - 0.5)) <= NAVE_REPOSE;
    // the least run coordinate the flood can cover within 10 m of a place (the grid's nodes within 10.4 m of it)
    const naveNear = (x, z) => {
      const ci = Math.round((x - NVX) * 2), cj = Math.round((z - NVZ) * 2); let m = 1e9;
      for (let i = Math.max(0, ci - 21); i <= Math.min(nvx - 1, ci + 21); i++) for (let j = Math.max(0, cj - 21); j <= Math.min(nvz - 1, cj + 21); j++) if (nvR[i * nvz + j] < m && (NVX + i * 0.5 - x) ** 2 + (NVZ + j * 0.5 - z) ** 2 <= 108.16) m = nvR[i * nvz + j];
      return m;
    };
    // HOW FAR THE DRAWN WATER CAN STAND AHEAD OF courtFront(T). The lap of the world's clock cannot be known here, so
    // it is taken at its furthest reach: tide()'s lap (1.7 + 0.8) times 1.1 on the court's front, the lobes' term in
    // time (0.5), and a tenth of a metre for what lies between the grid's nodes. So a hopper that springs from a stand
    // has the drawn foam edge 10 m off or more (one that springs at once on landing can have it nearer). Ahead of its front the water's shader draws a thinning film
    // (fade = 1 + f/6, there where fade*fade*1.2 - 0.1 is above a noise that is never below 0): NAVE_FILM of run at
    // most. A perch is sand a quarter of a metre or more above the flood's highest surface.
    const NAVE_LAP = 1.1 * (1.7 + 0.8) + 0.5 + 0.1, NAVE_FILM = 6 * (1 - Math.sqrt(0.1 / 1.2)), NAVE_PERCH = courtTop + 0.25;
    // the court's front by the journey second, from the water's own function, every twentieth of a second
    const nvF = new Float32Array(T_END * 20 + 2);
    for (let i = 0; i < nvF.length; i++) nvF[i] = courtFront(i / 20);
    // the journey second, from T0 on, at which the edge comes to a run coordinate (the step before it is crossed)
    const naveReached = (need, T0) => { for (let i = Math.floor(T0 * 20); i < nvF.length - 1; i++) if (Math.max(nvF[i], nvF[i + 1]) + NAVE_LAP >= need) return Math.max(T0, i / 20); return -1; };
    // an arc as it is flown (the easing and the height of the drawing below): true if it passes nowhere through sand
    // and nowhere within 4 m of the course's own line (the points laid with the course, joined; 4.7 m at each of the
    // 23 places tried, which is 4 m with the reach between two of them)
    const naveCourse = coursePts.filter((p) => p.z > 270);
    const naveArcClear = (ax, ay, az, bx, by, bz, top) => {
      for (let q = 1; q < 24; q++) {
        const a = q / 24, k = a * a * (3 - 2 * a), x = lerp(ax, bx, k), z = lerp(az, bz, k), y = lerp(ay, by, k) + Math.sin(a * Math.PI) * top;
        if (y < naveSand(x, z)) return false;
        for (let c = 1; c < naveCourse.length; c++) {
          const P = naveCourse[c - 1], Q = naveCourse[c], dx = Q.x - P.x, dy = Q.y - P.y, dz = Q.z - P.z, s = clamp(((x - P.x) * dx + (y - P.y) * dy + (z - P.z) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
          if ((P.x + dx * s - x) ** 2 + (P.y + dy * s - y) ** 2 + (P.z + dz * s - z) ** 2 < 22.09) return false;
        }
      }
      return true;
    };
    const naveTilt = (x, z, hd) => clamp(Math.atan(naveSand(x + 0.5 * Math.cos(hd), z + 0.5 * Math.sin(hd)) - naveSand(x - 0.5 * Math.cos(hd), z - 0.5 * Math.sin(hd))), -0.6, 0.6);
    // EVERY SPRING OF EVERY HOPPER, worked out once: [journey second, from x y z, to x y z, heading, tilt where it lands,
    // the arc's height, 1.2 m and 0.12 of its length as it was].
    // Away from the edge is up the nave, from its open end to the mouth (the hero's own axis), the way the swash runs
    // it; a spring's heading is dealt about that by the hopper's own sd and the spring's number, as its landings
    // were. The springs are taken in the order of their journey seconds, so that each hopper knows where every other
    // stands or is about to land: none lands within a metre and a half of another, but for the two cases the rule
    // itself makes: the first landing of two arcs, which does not stay, and the crowded perch a last spring falls back on.
    const naveEnd = toWorld(hero.anchors.naveAxis[0]), mouthAt = toWorld(hero.anchors.naveAxis[1]), NAVE_AWAY = Math.atan2(mouthAt.z - naveEnd.z, mouthAt.x - naveEnd.x);
    const naveGap = (e, x, z) => { let g = 1e9; for (const o of naveHop) if (o !== e) g = Math.min(g, (o.cx - x) ** 2 + (o.cz - z) ** 2); return g; };      // (metres squared to the nearest other)
    // the journey second of a hopper's next spring from where it stands (-1: none): an edge within 10 m of it, or the film at its own place
    const naveNext = (e) => naveReached(Math.min(naveNear(e.cx, e.cz), e.cy - 0.1 < courtTop ? naveRun(e.cx, e.cz) - NAVE_FILM : 1e9), e.t);
    // a perch a metre and a half clear of every other hopper that an arc of 15 to 20 m reaches from a place (the dealt
    // length first, then the length nearest to it; the heading nearest to straight away first), or null where there is none
    const navePerch = (e, x, y, z, side) => {
      for (let q = 0; q < 21; q++) {
        const len = e.len + (q % 2 ? 1 : -1) * ((q + 1) >> 1) * 0.5;
        for (let k = 0; k < 96 && len >= 15 && len <= 20; k++) {
          const th = side * (k % 2 ? 1 : -1) * ((k + 1) >> 1) * TAU / 96, cx = x + Math.cos(NAVE_AWAY + th) * len, cz = z + Math.sin(NAVE_AWAY + th) * len, cy = naveSand(cx, cz);
          if (cy >= NAVE_PERCH && naveGap(e, cx, cz) >= 2.25 && naveStands(cx, cz) && naveArcClear(x, y, z, cx, cy + 0.1, cz, 1.2 + 0.12 * len)) return [cx, cy + 0.1, cz];
        }
      }
      return null;
    };
    // one arc as the list keeps it
    const naveArc = (T, ax, ay, az, bx, by, bz) => [T, ax, ay, az, bx, by, bz, Math.atan2(-(bz - az), bx - ax), naveTilt(bx, bz, Math.atan2(bz - az, bx - ax)), 1.2 + 0.12 * hyp(bx - ax, bz - az)];
    for (let j = 0; j < NN; j++) {
      const e = naveHop[j];
      e.cx = e.x; e.cz = e.z; e.cy = e.y = naveSand(e.x, e.z) + 0.1; e.t = 0; e.sp = []; e.next = naveNext(e);
      if (j % 8 === 7) await ctx.yield();
    }
    for (let done = 0; done < NN * 40; done++) {
      let e = null;
      for (const o of naveHop) if (o.next >= 0 && (!e || o.next < e.next)) e = o;
      if (!e) break;
      if (done % 6 === 5) await ctx.yield();
      const n = e.sp.length, Ts = e.next, air = e.per * 0.62, top = 1.2 + 0.12 * e.len, x = e.cx, y = e.cy, z = e.cz;
      e.next = -1;
      const wetL = courtFront(Ts + air) + NAVE_LAP + NAVE_FILM, dev = (hsh(e.sd, n) - 0.5) * 0.9, side = hsh(e.sd + 7, n) < 0.5 ? 1 : -1;
      let bx = 0, bz = 0, by = -1e9, last = false, mid = null;
      for (let k = 0; k < 30 && by < 0; k++) {      // onto open sand: the dealt heading, else the nearest heading that serves, 80 degrees off straight away at most
        const th = dev + side * (k % 2 ? 1 : -1) * ((k + 1) >> 1) * 0.13, cx = x + Math.cos(NAVE_AWAY + th) * e.len, cz = z + Math.sin(NAVE_AWAY + th) * e.len;
        if (Math.abs(th) <= 1.4 && naveStands(cx, cz) && naveRun(cx, cz) > wetL && naveGap(e, cx, cz) >= 2.25 && naveArcClear(x, y, z, cx, naveSand(cx, cz) + 0.1, cz, top)) { bx = cx; bz = cz; by = naveSand(cx, cz) + 0.1; }
      }
      if (by < 0 && y - 0.1 < NAVE_PERCH) {          // no open sand within an arc (one that stands above the flood already stays where it is)
        last = true;
        // its last spring: an arc of its dealt length, else of the length nearest to it within the brief's 15 to 20 m,
        // on the heading nearest to straight away that lands on a perch a metre and a half clear of every other.
        // Failing that, the perch such an arc reaches that is furthest from the others; and where such arcs reach no
        // perch at all (a pocket at a cone's foot), TWO such arcs: the first onto any standing sand the water has not
        // reached when it lands there (judged dry as every landing is; it does not stay, so it need not be clear of the others), the second at once from there onto a perch a metre
        // and a half clear of every other. Only where there is no such pair, a shorter arc, the longest that reaches a
        // perch; and where nothing above the flood can be reached, the highest sand that can, if it is higher than
        // where it stands.
        let hx = 0, hz = 0, hy = -1e9, hs = y - 0.1;
        for (let q = 0; q < 47 && by < 0 && (q < 21 || hs < 100); q++) {
          for (let p = 0; q === 21 && p < 21 && by < 0; p++) {      // (before the first of the shorter arcs: the two arcs)
            const len = e.len + (p % 2 ? 1 : -1) * ((p + 1) >> 1) * 0.5;
            for (let k = 0; k < 96 && by < 0 && len >= 15 && len <= 20; k++) {
              const th = side * (k % 2 ? 1 : -1) * ((k + 1) >> 1) * TAU / 96, cx = x + Math.cos(NAVE_AWAY + th) * len, cz = z + Math.sin(NAVE_AWAY + th) * len, cy = naveSand(cx, cz) + 0.1;
              if (!(naveStands(cx, cz) && naveRun(cx, cz) > wetL && naveArcClear(x, y, z, cx, cy, cz, 1.2 + 0.12 * len))) continue;
              const to = navePerch(e, cx, cy, cz, side);
              if (to) { mid = [cx, cy, cz]; bx = to[0]; by = to[1]; bz = to[2]; }
              await ctx.yield();
            }
            if (len >= 15 && len <= 20) await ctx.yield();
          }
          const len = q < 21 ? e.len + (q % 2 ? 1 : -1) * ((q + 1) >> 1) * 0.5 : 14.5 - (q - 21) * 0.5;
          for (let k = 0; k < 96 && by < 0 && (q > 20 || (len >= 15 && len <= 20)); k++) {
            const th = side * (k % 2 ? 1 : -1) * ((k + 1) >> 1) * TAU / 96, cx = x + Math.cos(NAVE_AWAY + th) * len, cz = z + Math.sin(NAVE_AWAY + th) * len, cy = naveSand(cx, cz);
            const gap = cy >= NAVE_PERCH ? naveGap(e, cx, cz) : 0, sc = cy >= NAVE_PERCH ? 100 + gap : cy;
            if ((gap >= 2.25 || sc > hs) && naveStands(cx, cz) && naveArcClear(x, y, z, cx, cy + 0.1, cz, 1.2 + 0.12 * len)) { if (gap >= 2.25) { bx = cx; bz = cz; by = cy + 0.1; } else { hx = cx; hz = cz; hy = cy; hs = sc; } }
          }
        }
        if (by < 0 && hy > 0) { bx = hx; bz = hz; by = hy + 0.1; }
      }
      if (by > 0) {
        if (mid) e.sp.push(naveArc(Ts, x, y, z, mid[0], mid[1], mid[2]), naveArc(Ts + air, mid[0], mid[1], mid[2], bx, by, bz));
        else e.sp.push(naveArc(Ts, x, y, z, bx, by, bz));
        e.cx = bx; e.cy = by; e.cz = bz; e.t = Ts + air * (mid ? 2 : 1);
        if (!last) e.next = naveNext(e);
      }
    }
    for (const e of naveHop) { e.yaw = e.sp.length ? e.sp[0][7] : -NAVE_AWAY; e.tilt = naveTilt(e.x, e.z, -e.yaw); }
    const updateNaveHoppers = (T) => {      // T: the journey second, the one update() hands to the tide
      for (let j = 0; j < NN; j++) {
        const e = naveHop[j], sp = e.sp;
        let s = null;
        for (let n = 0; n < sp.length && sp[n][0] <= T; n++) s = sp[n];
        if (s) {
          const air = clamp((T - s[0]) / (e.per * 0.62), 0, 1), k = air * air * (3 - 2 * air);
          v3.set(lerp(s[1], s[4], k), lerp(s[2], s[5], k) + Math.sin(air * Math.PI) * s[9], lerp(s[3], s[6], k));
          e3.set(0, s[7], air < 1 ? (0.5 - air) * 2.0 : s[8], 'YZX');
        } else { v3.set(e.x, e.y, e.z); e3.set(0, e.yaw, e.tilt, 'YZX'); }
        naveHoppers.setMatrixAt(j, m4.compose(v3, q4.setFromEuler(e3), s3.set(0.95, 0.95, 0.95)));
      }
      naveHoppers.instanceMatrix.needsUpdate = true;
    };

    // sanderlings: nine white-bellied towers 15 m tall on blurred black legs, chasing each backwash down and trotting back
    const birdGeo = (() => {
      const wht = [...lin('#F4F1E6'), 0], gry = [...lin('#A39C8E'), 0], blk = [...lin('#2A2B33'), 0];
      const body = []; for (let k = 0; k <= 8; k++) { const t = k / 8; body.push([-4.6 + t * 9.2, 9 + 1.3 * Math.sin(t * 2.6) - 1.2 * t, 0, 0.3 + 3.1 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.08)) ** 0.8]); }
      const b = tube(body, 8, wht, 1.0);
      const backPts = body.map((p) => [p[0], p[1] + p[3] * 0.42, p[2], p[3] * 0.82]);
      const head = tube([[3.9, 11.4, 0, 0.5], [4.9, 12.6, 0, 1.25], [5.9, 13.2, 0, 1.1], [6.6, 13.1, 0, 0.3]], 7, wht);
      const cap = tube([[4.2, 12.6, 0, 0.9], [5.3, 13.5, 0, 1.0], [6.3, 13.5, 0, 0.5]], 6, gry);
      const bill = tube([[6.4, 13.0, 0, 0.32], [8.3, 12.6, 0, 0.2], [9.6, 12.3, 0, 0.1]], 4, blk);
      const legs = [];
      for (const [dx, dz] of [[-1.6, 0.7], [0.4, -0.7], [-0.6, 0.7], [1.4, -0.7], [-2.4, -0.7]]) legs.push(tube([[0.2, 7.2, dz, 0.3], [dx * 0.5, 3.4, dz, 0.24], [dx, 0, dz, 0.22], [dx + 1.1, 0, dz, 0.12]], 4, blk));
      return partsGeo([b, tube(backPts, 6, gry, 0.7), head, cap, bill, ...legs]);
    })();
    const NB = 9, birds = new THREE.InstancedMesh(birdGeo, tintMat, NB); birds.frustumCulled = false; birds.name = 'sanderlings'; birds.castShadow = true; birds.receiveShadow = true;
    const bird = []; for (let i = 0; i < NB; i++) bird.push({ z: 84 + i * 13.5 + lrng.range(-4, 4), off: 34 + lrng.range(0, 34) + (i % 3) * 9, ph: lrng.range(0, TAU), sp: lrng.range(0.8, 1.2) });
    scene.add(birds);
    await ctx.yield();
    const updateBirds = (T, time) => {
      for (let i = 0; i < NB; i++) {
        const b = bird[i], run = Math.sin(time * 0.62 * b.sp + b.ph), vel = Math.cos(time * 0.62 * b.sp + b.ph);
        const x = 118 - seaFront(T) * 0.35 + b.off * 1.2 + 9 * run + 2.5 * Math.sin(time * 0.23 + i),      // far to port, seaward of every wall's end
          z = b.z + 6 * Math.sin(time * 0.31 * b.sp + i * 1.7) + T * 1.6;
        const y = Math.max(baseY(x), U.uSea.value.z - 4.5) - 0.2 + 0.35 * Math.abs(Math.sin(time * 9 * b.sp + i));
        const peck = Math.max(0, Math.sin(time * 1.9 * b.sp + b.ph * 3)) ** 6 * 0.5 * (Math.abs(vel) < 0.5 ? 1 : 0.2);
        e3.set(0, vel > 0 ? 0 : Math.PI, -peck * (vel > 0 ? 1 : 1) + 0.06 * Math.sin(time * 9 * b.sp + i), 'YZX');
        birds.setMatrixAt(i, m4.compose(v3.set(x, y, z), q4.setFromEuler(e3), s3.set(1, 1, 1)));
      }
      birds.instanceMatrix.needsUpdate = true;
    };

    // the wrack line: six dark olive fronds of bladderwrack, flat forked straps with round bladders in pairs, which lie
    // on the sand as it undulates and lift, float and swing round when the first swash reaches them. One small mesh,
    // laid on the beach vertex by vertex every frame (a rigid frond would cut through the ripples and the film).
    const frondT = (() => {
      const ol = lin('#262B15'), ol2 = lin('#474F25'), mid = lin('#6E7A3A'), shd = [C(pal[2]).r, C(pal[2]).g, C(pal[2]).b], lx = [], lz = [], dy = [], nr = [], ci = [], tn = [], ix = [];
      const add = (x, z, y, n, c, col, wet) => { lx.push(x); lz.push(z); dy.push(y); nr.push(n[0], n[1], n[2]); ci.push(c); tn.push(col[0], col[1], col[2], wet); return lx.length - 1; };
      const bladder = (x, z, r) => {
        const c = add(x, z, r * 0.78, [0, 1, 0], -1, ol2, 1.9), c0 = c; ci[c] = c;
        for (let ring = 0; ring < 2; ring++) for (let s = 0; s < 6; s++) { const f = s / 6 * TAU, rr = ring ? r : r * 0.72, ny = ring ? 0.25 : 0.7, nh = Math.sqrt(1 - ny * ny);
          add(x + Math.cos(f) * rr, z + Math.sin(f) * rr, ring ? 0 : r * 0.55, [Math.cos(f) * nh, ny, Math.sin(f) * nh], c0, ring ? ol : ol2, 1.9); }
        for (let s = 0; s < 6; s++) { const a = c + 1 + s, b = c + 1 + (s + 1) % 6; ix.push(c, b, a, a, b, a + 6, b, b + 6, a + 6); }
      };
      const strap = (x0, z0, ang, len, w0, w1, depth) => {
        const n = 7, pts = []; let x = x0, z = z0, a = ang;
        for (let k = 0; k <= n; k++) {
          // narrow at the stalk; each fork tapers, the last ones to a ragged tip
          const t = k / n, prof = depth === 0 ? Math.min(1, 0.2 + 0.42 * k) : depth === 2 && k >= n - 2 ? [0.72, 0.42, 0.12][k - (n - 2)] : 1;
          const w = lerp(w0, w1, t) * prof * (1 + 0.16 * Math.sin(k * 2.3 + depth * 1.7 + ang * 5));
          const px = Math.cos(a), pz = -Math.sin(a), b = lx.length, jag = depth === 2 && k === n ? 0.3 : 0;
          add(x - px * w * 0.5, z - pz * w * 0.5, 0.05, [0, 1, 0], -1, ol, 1.3);
          add(x + jag * Math.sin(a), z + jag * Math.cos(a), 0.18, [0, 1, 0], -1, mid, 1.3);                  // the paler midrib
          add(x + px * w * 0.5, z + pz * w * 0.5, 0.05, [0, 1, 0], -1, ol, 1.3);
          add(x - px * w * 0.5, z - pz * w * 0.5, -0.02, [0, 1, 0], -2, shd, 0); add(x + px * w * 0.5, z + pz * w * 0.5, -0.02, [0, 1, 0], -2, shd, 0);      // its thin slate shadow (pushed away from the sun as it is laid)
          if (k > 0) ix.push(b - 5, b, b - 4, b, b + 1, b - 4, b - 4, b + 1, b - 3, b + 1, b + 2, b - 3, b - 2, b + 3, b - 1, b + 3, b + 4, b - 1);
          pts.push([x, z, w, a]);
          if (k < n) { a += 0.17 * Math.sin(t * 5 + depth * 2.1 + ang * 3); x += Math.sin(a) * len / n; z += Math.cos(a) * len / n; }
        }
        for (const k of depth === 0 ? [3, 5] : depth === 1 ? [2, 4, 6] : [2, 5]) { const p = pts[k], r = 0.44 + 0.07 * ((k * 7 + depth * 3) % 3), o = Math.max(p[2] * 0.24, r * 0.55);
          bladder(p[0] + Math.cos(p[3]) * o, p[1] - Math.sin(p[3]) * o, r); bladder(p[0] - Math.cos(p[3]) * o, p[1] + Math.sin(p[3]) * o, r * 0.9); }
        if (depth < 2) { const fx = Math.cos(a) * w1 * 0.2, fz = -Math.sin(a) * w1 * 0.2;      // the fork: two narrower straps leave the end side by side
          strap(x + fx, z + fz, a + 0.5, len * 0.7, w1 * 0.68, w1 * 0.52, depth + 1); strap(x - fx, z - fz, a - 0.46, len * 0.74, w1 * 0.68, w1 * 0.52, depth + 1); }
      };
      strap(0, 0, 0, 12, 1.35, 1.1, 0);
      return { lx, lz, dy, nr, ci, tn, ix, n: lx.length };
    })();
    const NWV = frondT.n, wPos = new Float32Array(NWV * 6 * 3), wNrm = new Float32Array(NWV * 6 * 3), wTint = new Float32Array(NWV * 6 * 4), wIx = [];
    for (let i = 0; i < 6; i++) wTint.set(frondT.tn, i * NWV * 4);
    const wrackGeo = new THREE.BufferGeometry();
    const wPosA = new THREE.BufferAttribute(wPos, 3), wNrmA = new THREE.BufferAttribute(wNrm, 3); wPosA.setUsage(THREE.DynamicDrawUsage); wNrmA.setUsage(THREE.DynamicDrawUsage);
    wrackGeo.setAttribute('position', wPosA); wrackGeo.setAttribute('normal', wNrmA); wrackGeo.setAttribute('aTint', new THREE.BufferAttribute(wTint, 4));
    wrackGeo.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(NWV * 6 * 2), 2));
    const wrack = new THREE.InstancedMesh(wrackGeo, tintMat, 1); wrack.setMatrixAt(0, m4.identity()); wrack.frustumCulled = false; wrack.name = 'wrack'; wrack.receiveShadow = true;
    const wr = [], WROT = [0.75, 0.55, 0.9, 0.35, 0.95, 0.6], WX = [1.8, 5.6, 9.5, 4.6, 12.5, 8.0], WZ = [10.5, 17, 12, 26, 21, 30];
    for (let i = 0; i < 6; i++) { const r0 = lrng.range(0, 4), r1 = lrng.range(-1, 1), r2 = lrng.range(-0.45, 0.4), sc = lrng.range(0.85, 1.1), mir = lrng.chance(0.5) ? 1 : -1, ph = lrng.range(0, TAU);
      wr.push({ x: WX[i] + r0 * 0.25, z: WZ[i] + r1, rot: WROT[i] + r2 * 0.2, sc: sc * 0.92, mir, ph }); }
    for (let i = 0; i < 6; i++) for (let k = 0; k < frondT.ix.length; k += 3) { const a = frondT.ix[k] + i * NWV, b = frondT.ix[k + 1] + i * NWV, c = frondT.ix[k + 2] + i * NWV; if (wr[i].mir > 0) wIx.push(a, b, c); else wIx.push(a, c, b); }
    wrackGeo.setIndex(wIx);
    scene.add(wrack);
    await ctx.yield();
    const wSurf = new Float32Array(NWV);
    const updateWrack = (T, time) => {
      const seaF = U.uSea.value.x, seaY = U.uSea.value.z, wnl = Math.sqrt(1 + 0.36 * (sunW.x * sunW.x + sunW.z * sunW.z)), wnx = 0.6 * sunW.x / wnl, wny = 1 / wnl, wnz = 0.6 * sunW.z / wnl, shl = 0.5 / Math.max(hyp(sunW.x, sunW.z), 1e-3), shx = -sunW.x * shl, shz = -sunW.z * shl;
      for (let i = 0; i < 6; i++) {
        const w = wr[i], fl = sstep(0, 3.2, seaFront(T) + 0.9 * Math.sin(time * 0.62) + w.x + 2.5);      // 0 lying on the sand .. 1 afloat
        const yaw = w.rot + fl * (0.3 + 0.1 * Math.sin(time * 0.5 + w.ph)) + sstep(4, 20, T) * 0.3, cs = Math.cos(yaw), sn = Math.sin(yaw);
        const ox = w.x + fl * 1.2 + sstep(3, 22, T) * 3 + fl * 0.5 * Math.sin(time * 0.43 + w.ph), oz = w.z + fl * 1.2 * Math.sin(time * 0.37 + w.ph * 2), o = i * NWV * 3;
        for (let v = 0; v < NWV; v++) {
          const ax = frondT.lx[v] * w.sc * w.mir, az = frondT.lz[v] * w.sc, X = ox + ax * cs + az * sn, Z = oz - ax * sn + az * cs, c = frondT.ci[v];
          let s, X2 = X, Z2 = Z;
          if (c >= 0 && c !== v) s = wSurf[c];
          else { const flv = sstep(0, 3, seaF + X); s = Math.max(G(X, Z)[0] + 0.08 + i * 0.012, seaY + 0.05) + flv * (0.1 + 0.035 * Math.sin(time * 1.3 + frondT.lz[v] * 0.7 + w.ph)); wSurf[v] = s;
            if (c === -2) { X2 = X + shx * (1 - flv); Z2 = Z + shz * (1 - flv); } }      // the shadow lies half a metre off, away from the sun, until the frond floats
          wPos[o + v * 3] = X2; wPos[o + v * 3 + 1] = s + frondT.dy[v]; wPos[o + v * 3 + 2] = Z2;
          const nx = frondT.nr[v * 3] * w.mir, nz = frondT.nr[v * 3 + 2];
          if (c < 0) { wNrm[o + v * 3] = wnx; wNrm[o + v * 3 + 1] = wny; wNrm[o + v * 3 + 2] = wnz; }      // a strap lies flat: its light is a flat tone (dark edges, a paler midrib), never a speckle
          else { wNrm[o + v * 3] = nx * cs + nz * sn; wNrm[o + v * 3 + 1] = frondT.nr[v * 3 + 1]; wNrm[o + v * 3 + 2] = -nx * sn + nz * cs; }
        }
      }
      wPosA.needsUpdate = true; wNrmA.needsUpdate = true;
    };

    // lugworm casts: coiled ropes of wet sand 3 m across. They obey the rule (pale on top, dark underneath) and the
    // tide sits them down as it reaches them.
    const NCAST = Math.max(50, Math.round(140 * detail * density));
    const castGeo = (rings, sides) => {
      const pts = []; for (let k = 0; k <= rings; k++) { const t = k / rings, a = t * 4.8 * Math.PI; const r = 1.35 * (1 - 0.62 * t) + 0.1 * Math.sin(t * 23); pts.push([Math.cos(a) * r, 0.24 + t * 0.95, Math.sin(a) * r, (0.33 - 0.1 * t) * (k === 0 || k === rings ? 0.35 : 1)]); }
      const tb = tube(pts, sides, null), g = new THREE.BufferGeometry(), fg = new THREE.BufferGeometry(), F = tb.p.slice();
      for (let i = 0; i < F.length; i += 3) { F[i] *= 1.25; F[i + 1] = 0.02 + F[i + 1] * 0.05; F[i + 2] *= 1.25; }
      g.setAttribute('position', new THREE.Float32BufferAttribute(tb.p, 3)); g.setIndex(tb.i); g.computeVertexNormals();
      fg.setAttribute('position', new THREE.Float32BufferAttribute(F, 3)); fg.setIndex(tb.i); fg.computeVertexNormals();
      g.setAttribute('aFan', new THREE.Float32BufferAttribute(F, 3)); g.setAttribute('aFanN', fg.attributes.normal.clone()); fg.dispose();
      g.setAttribute('aD', new THREE.Float32BufferAttribute(new Float32Array(tb.p.length / 3 * 2).fill(0.25), 2));
      return g;
    };
    // the casts beside the first hundred metres of the course are round coiled ropes; the far ones a lighter mould
    const castSpots = [];
    { let tries = 0;
      const reachT = (x) => { for (let t = 0; t < 60; t += 0.25) if (seaFront(t) > -x - 1) return t; return 1e6; };
      while (castSpots.length < NCAST && tries++ < NCAST * 12) {
        if (tries % 40 === 0) await ctx.yield();
        const x = lerp(-22, 9, lrng()), z = lrng.range(-6, 230), [rho] = oval(x, z);
        if (Math.abs(x) < 6.5 || R_M.some((r) => Math.abs(rho - r) < 15) || [R_W1, R_W2, R_CURT].some((r) => Math.abs(rho - r) < 7)) continue;
        const near = (z < 96 && z > 4) || (z > 138 && z < 236), sc = near ? lrng.range(0.72, 1.0) : lrng.range(0.5, 0.85);
        castSpots.push({ x, z, near, sc, sy: sc * lrng.range(0.8, 1.2), rot: lrng.range(0, TAU), t: reachT(x) + lrng.range(0, 1.2) });
      } }
    const castMeshes = [];
    for (const near of [true, false]) {
      const list = castSpots.filter((c) => c.near === near).slice(0, near ? 62 : 1e6), geo = near ? castGeo(24, 5) : castGeo(12, 3);
      const im = new THREE.InstancedMesh(geo, castMat, Math.max(1, list.length)), sl = new Float32Array(Math.max(1, list.length) * 2);
      im.frustumCulled = false; im.name = near ? 'lugworm-casts-near' : 'lugworm-casts'; im.receiveShadow = true;
      if (!list.length) im.setMatrixAt(0, m4.makeScale(0, 0, 0));
      list.forEach((c, n) => { q4.setFromAxisAngle(Y, c.rot); im.setMatrixAt(n, m4.compose(v3.set(c.x, G(c.x, c.z)[0] - 0.05, c.z), q4, s3.set(c.sc, c.sy, c.sc))); sl[n * 2] = c.t; });
      geo.setAttribute('aSlump', new THREE.InstancedBufferAttribute(sl, 2));
      scene.add(im); castMeshes.push(im); await ctx.yield();
    }
    await ctx.yield();

    // the cast: cockles (ribs outward), razor shells and limpets, or sea-glass pebbles, pressed into the gate turrets
    // and laid along the wall tops beside the gates
    const NSH = Math.round(260 * clamp(density, 0.8, 1.2));
    const shellGeo = (() => {
      if (cast === 'razors') return partsGeo([tube([[0, 0.12, -1.5, 0.08], [0, 0.2, 0, 0.36], [0, 0.12, 1.5, 0.12]], 3, null, 0.4)]);      // a stand-in: the razors are baked below
      if (cast === 'seaglass') return partsGeo([tube([[0, 0.25, -0.75, 0.1], [0, 0.3, -0.35, 0.55], [0, 0.3, 0.3, 0.6], [0, 0.25, 0.75, 0.12]], 6, null, 0.55)]);
      const p = [0, 0.12, 0], ix = [], NR = 7;                 // a cockle: nine ribs fanning from the hinge
      for (let r = 1; r <= 2; r++) for (let k = 0; k <= NR * 2; k++) { const a = (k / (NR * 2) - 0.5) * 2.5, rr = r === 1 ? 0.55 : 1, rib = k % 2 ? 0.1 : -0.03; p.push(Math.sin(a) * rr, (r === 1 ? 0.42 : 0.04) + rib * (r === 1 ? 1 : 0.6), Math.cos(a) * rr - 0.25); }
      const n1 = NR * 2 + 1;
      for (let k = 0; k < NR * 2; k++) { ix.push(0, 1 + k, 2 + k); const a = 1 + k, b = 2 + k, c = a + n1, d = b + n1; ix.push(a, c, b, b, c, d); }
      return partsGeo([{ p, i: ix }], true);
    })();
    shellGeo.deleteAttribute('aTint');
    const shellC = cast === 'seaglass' ? ['#8FCFB5', '#CFE8E0', '#B98B4E', '#E9F1EA'] : cast === 'razors' ? ['#EFE4CC', '#BFA07A', pal[6]] : ['#F1E6CF', pal[6], '#F1E6CF', '#E8C9B0'];
    const shells = new THREE.InstancedMesh(shellGeo, tintMat, NSH); shells.frustumCulled = false; shells.name = 'the-cast'; shells.receiveShadow = true;
    // PRESSED IN (the cockles): each cockle sits a third sunk in the face, and its dent shows only as the rim of shade
    // the shell lays in it on the side away from the sun: a thin crescent of the wet slate. One small instanced mesh of
    // flat fans lying on the face under the shells, each the outline of its shell where it meets the sand and no larger,
    // set off from the sun by an eighth of the shell's half width (never wider than a fifth of the shell).
    const sinkK = cast === 'cockles' ? 0.16 : 0;
    const dentGeo = () => {
      const out = [[0, 0]], P = [0, 0, 0.3], Tn = [], I = [], sl = lin(pal[2]), wt = lin(pal[0]);
      for (let k = 0; k <= 6; k++) { const a = (k / 6 - 0.5) * 2.5; out.push([Math.sin(a) * 0.92, Math.cos(a) * 0.92 - 0.25]); }
      // (the wet slate: the slate as it lies over wet sand in the style's own shade, blue-violet, never brown)
      const k = (SANDS[sandId].shK ?? 0.6) * 0.95 + 0.7 * (wt[0] * 0.3 + wt[1] * 0.5 + wt[2] * 0.2), ws = [sl[0] * 0.9 * k, sl[1] * 0.94 * k, sl[2] * 1.13 * k, 1];
      Tn.push(...ws);
      out.forEach((q, j) => { P.push(q[0], 0, q[1]); Tn.push(...ws); I.push(0, 1 + j, 1 + (j + 1) % out.length); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTint', new THREE.Float32BufferAttribute(Tn, 4)); g.setIndex(I);
      g.computeVertexNormals(); g.setAttribute('aD', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
      return g;
    };
    const dents = cast === 'cockles' ? new THREE.InstancedMesh(dentGeo(), tintMat, NSH) : null, dN = new THREE.Vector3(), dS = new THREE.Vector3(), dM = new THREE.Matrix4();
    if (dents) { dents.frustumCulled = false; dents.name = 'cast-dents'; dents.receiveShadow = true; }
    { const tint = new Float32Array(NSH * 4), bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), gates = turretSpots.filter((s) => Math.abs(s.th) < 0.13 && s.t > 1e5);
      for (let n = 0; n < NSH; n++) {
        if (n % 50 === 49) await ctx.yield();
        const sc = lrng.range(1.0, 1.7);
        if (n < NSH * 0.46) {             // pressed into a gate turret, on the faces the course passes
          const t = gates[n % gates.length], a = -Math.PI / 2 + lrng.range(-1.9, 1.9) + (t.x > 0 ? -0.5 : 0.5), h = lrng.range(1.2, 11.6);
          q4.setFromAxisAngle(v3.set(Math.cos(t.ldir), 0, Math.sin(t.ldir)), t.lean);
          const rad = lerp(6.02, 4.62, h / 13.5) + 0.03;
          v3.set(Math.cos(a) * rad * t.s, h * t.s, Math.sin(a) * rad * t.s).applyQuaternion(q4).add(bx.set(t.x, t.y, t.z));
          by.set(Math.cos(a), 0.11, Math.sin(a)).normalize().applyQuaternion(q4); bz.set(0, -1, 0).addScaledVector(by, by.y).normalize(); bx.crossVectors(by, bz).normalize();
          m4.makeBasis(bx, by, bz).scale(s3.set(sc, sc, sc)).setPosition(v3);
          dN.copy(by);
        } else {                          // laid on a wall top beside a gate
          const wi = n % 3, rc = [R_W1, R_W2, R_CURT + 1.5][wi]; let x = (n % 2 ? 1 : -1) * lrng.range(11.5, 58); const th = Math.asin(x / (K * rc)), z = CZ - rc * Math.cos(th) + lrng.range(-1.3, 1.3);
          if (G(x, z)[2] < 1e5 || wallSlumps.some((q) => q.wall === wi && th > q.a - 0.03 && th < q.b + 0.03)) x = -x;      // never on a length of wall that will sit down
          q4.setFromAxisAngle(Y, lrng.range(0, TAU)); m4.compose(v3.set(x, G(x, z)[0] + 0.02, z), q4, s3.set(sc, sc, sc));
          dN.set(0, 1, 0);
        }
        m4.setPosition(v3.addScaledVector(dN, -sinkK * sc));      // a third of a cockle is in the sand
        dS.copy(sunW).addScaledVector(dN, -sunW.dot(dN)); if (dS.lengthSq() > 1e-6) dS.normalize();
        if (dents) dents.setMatrixAt(n, dM.copy(m4).setPosition(v3.addScaledVector(dN, sinkK * sc + 0.04).addScaledVector(dS, -0.12 * sc)));
        shells.setMatrixAt(n, m4);
        const c = C(pig(lrng.pick(shellC))); tint.set([c.r, c.g, c.b, cast === 'seaglass' ? 1.9 : 0], n * 4);
      }
      shellGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 4)); }
    if (cast === 'razors') {
      // razor shells: long, slightly curved blades pressed half into the sand, cream with darker growth bands and a
      // wet face that takes the sky; all of them baked into one small mesh so that each vertex carries its own tint
      const NRK = 7, XS = [-1, -0.55, 0, 0.55, 1], YS = [0, 0.72, 1, 0.72, 0], BAND = [1, 1, 0.64, 1, 0.7, 0.95, 0.6];
      const P = new Float32Array(NSH * NRK * 5 * 3), Tn = new Float32Array(NSH * NRK * 5 * 4), I = [], tA = shellGeo.attributes.aTint.array, mI = new THREE.Matrix4(), rI = new THREE.Matrix4();
      for (let n = 0; n < NSH; n++) {
        if (n % 60 === 59) await ctx.yield();
        shells.getMatrixAt(n, mI); mI.multiply(rI.makeRotationY((hsh(n, 5) - 0.5) * 2.2)).scale(s3.set(0.52, 0.52, 0.52));
        const bend = (hsh(n, 8) > 0.5 ? 1 : -1) * (0.16 + 0.14 * hsh(n, 2));
        for (let k = 0; k < NRK; k++) {
          const t = k / (NRK - 1), w = 0.33 * Math.pow(Math.sin(Math.PI * clamp(0.06 + t * 0.88, 0, 1)), 0.3) * (1 - 0.25 * t), cx = bend * (1 - (2 * t - 1) ** 2);
          for (let j = 0; j < 5; j++) {
            const v = (n * NRK + k) * 5 + j; v3.set(cx + XS[j] * w, -0.05 + 0.25 * YS[j] * (0.6 + 0.4 * Math.sin(Math.PI * t)), (t - 0.5) * 3).applyMatrix4(mI);
            P[v * 3] = v3.x; P[v * 3 + 1] = v3.y; P[v * 3 + 2] = v3.z;
            const bd = BAND[k] * (j === 0 || j === 4 ? 0.8 : 1), dk = bd < 0.9 ? 1 : 0;
            Tn[v * 4] = tA[n * 4] * bd; Tn[v * 4 + 1] = tA[n * 4 + 1] * bd * (1 - 0.08 * dk); Tn[v * 4 + 2] = tA[n * 4 + 2] * bd * (1 - 0.2 * dk); Tn[v * 4 + 3] = j >= 1 && j <= 3 ? 1.4 : 0.8;
            if (k < NRK - 1 && j < 4) { const a = v, b = v + 1, c = v + 5, d = c + 1; I.push(a, c, b, b, c, d); }
          }
        }
      }
      const rz = new THREE.BufferGeometry(); rz.setAttribute('position', new THREE.BufferAttribute(P, 3)); rz.setAttribute('aTint', new THREE.BufferAttribute(Tn, 4));
      rz.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(NSH * NRK * 5 * 2), 2)); rz.setIndex(I); rz.computeVertexNormals();
      const razors = new THREE.InstancedMesh(rz, tintMat, 1); razors.setMatrixAt(0, m4.identity()); razors.frustumCulled = false; razors.name = 'the-cast'; razors.receiveShadow = true;
      scene.add(razors); shellGeo.dispose();
    } else scene.add(shells);
    if (dents) scene.add(dents);
    await ctx.yield();

    // THE DRY BREEZE (that edition only; in the clear and in the fret no grain is in the air): from every crest of the
    // world a plume of pale grains streams downwind, fastened to its crest, densest there, thinning and sinking over
    // 15 to 30 m. The crests: every bucket turret's rim, the tops of the three walls, the mound's crest line, every
    // finished spire's tip and two of its shoulders. A turret that sits down takes its plume with it.
    let plumes = null;
    if (weather === 'breeze') {
      const prng = makeRng(hashSeed('crest-plumes:' + ctx.seed)), wind = new THREE.Vector3(7.5, 0, 1.6).normalize(), all = [];
      const crests = { push(c) { all.push(c); } };
      // a rule of the place: no plume blows across the course. A crest whose ribbon would pass within 14 m of the
      // course's line (anywhere along either; the line as the points laid with the course, 2 m of route apart or less)
      // gives off none.
      const clearOfCourse = (c) => { for (let k = 0; k <= 6; k++) { const q = k / 6, x = c.p.x + wind.x * c.len * q, y = c.p.y - c.sink * q * q, z = c.p.z + wind.z * c.len * q; for (const cp of coursePts) if ((cp.x - x) ** 2 + (cp.y - y) ** 2 + (cp.z - z) ** 2 < 196) return false; } return true; };
      for (const s of turretSpots) crests.push({ p: new THREE.Vector3(s.x + wind.x * 4.3 * s.s, s.y + 13.4 * s.s, s.z + wind.z * 4.3 * s.s), len: prng.range(15, 26), sink: prng.range(3, 6), gone: s.t < 1e5 ? s.t + 0.6 : 1e6 });
      await ctx.yield();
      [R_W1, R_W2, R_CURT + 1.5].forEach((rc, wi) => {
        const span = [0.62, 0.86, 2.9][wi];
        for (let th = -span + prng.range(0, 0.04); th < span; th += prng.range(22, 34) / rc) {
          const x = K * rc * Math.sin(th), z = CZ - rc * Math.cos(th), g = G(x, z);
          if (Math.abs(x) > 12 && g[0] - baseY(x) > 3) crests.push({ p: new THREE.Vector3(x + wind.x * 1.5, g[0] - 0.1, z + wind.z * 1.5), len: prng.range(15, 24), sink: prng.range(2.5, 5), gone: g[2] < 1e5 ? g[2] + 0.4 : 1e6 });
        }
      });
      await ctx.yield();
      for (const c of hero.anchors.crests) { const w = toWorld(c.p); crests.push({ p: new THREE.Vector3(w.x + wind.x * c.r * 0.8, w.y, w.z + wind.z * c.r * 0.8), len: prng.range(18, 30), sink: prng.range(3, 7) }); }
      await ctx.yield();
      const kept = []; for (let i = 0; i < all.length; i++) { if (clearOfCourse(all[i])) kept.push(all[i]); if (i % 40 === 39) await ctx.yield(); }
      plumes = await plumeMesh(prng, kept, wind, U, () => ctx.yield());
      plumes.renderOrder = 6; scene.add(plumes);
    }
    const bufSize = new THREE.Vector2();

    // ---- RETURN
    const camPos = new THREE.Vector3(), poiV = new THREE.Vector3(), poiV2 = new THREE.Vector3(), poiV3 = new THREE.Vector3(), portBand = new THREE.Vector3(42, 44, 428), mouthW = toWorld(hero.anchors.portalSeat.position);
    const naveIn = new THREE.Vector3(0, 9, 296), bridgeAt = new THREE.Vector3(0, 8, 220), pourAt = new THREE.Vector3(15, 2.5, 56), wardAt = new THREE.Vector3(11, -1, 102), pictureAt = new THREE.Vector3(12, -3, 146), filesUp = new THREE.Vector3(22, 104, 452), gateAhead = new THREE.Vector3(0, 12, 236);
    const forkAt = toWorld(hero.anchors.forkLandings[Math.min(2, hero.anchors.forkLandings.length - 1)].position);
    return {
      scene, path, duration: T_END, pace: linger, title: SANDS[sandId].name + (hourId === 'night' ? ', by Moonlight' : hourId === 'dawn' && sandId === 'ochre' ? ': First Light' : ''),
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 22, sway: 0.5, bank: 0.4 },
      pois: [{ at: (time, u) => poiV.copy(growTop[0]).lerp(growTop[1], u).lerp(bridgeAt, sstep(0.22, 0.29, u)).lerp(naveIn, sstep(0.385, 0.44, u)).lerp(forkAt, sstep(0.555, 0.605, u)), from: 0.1, to: 0.7, weight: 0.55 },
        // 3 s: down and to port, where the first swash's white edge pours over the lip of moat 1 and runs along it under us
        { at: pourAt, from: 0.035, to: 0.125, fade: 0.3, weight: 0.8 },
        // (through gate 1 the gaze is straight ahead: its two turrets pass 9 m to either side)
        { at: wardAt, from: 0.172, to: 0.225, fade: 0.3, weight: 0.45 },
        // 9 s, the picture: the gate turret the sea is taking, the swash falling into moat 2 beside it
        { at: (time, u) => poiV3.copy(pictureAt).lerp(gateAhead, sstep(0.238, 0.258, u)), from: 0.165, to: 0.285, fade: 0.3, weight: 0.5 },      // (then straight through gate 2, both its turrets whole in the frame)
        // past the growing spire: a look to port through the saddle in the crest, at the flooded ward and a curtain turret sitting down
        { at: breachAt, from: 0.47, to: 0.612, fade: 0.25, weight: 0.9 },
        // down into the nave the gaze stays on the sunlit band of the port wall and the barred port file, not on the floor
        { at: (time, u) => poiV2.copy(portBand).lerp(mouthW, sstep(0.81, 0.9, u)), from: 0.68, to: 0.9, fade: 0.25, weight: 0.6 },
        // sinking into the shade of the nave: a look up the port file and the head spires, still in the sun against the sky
        { at: filesUp, from: 0.735, to: 0.845, fade: 0.3, weight: 0.85 }],
      portal: { shape: 'circle', radius: 7, color: '#F7F3E8', glow: 0.35, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        const T = Tof(u); U.uTs.value = T;
        hero.setProgress((T + 3 * sstep(8, 18, T)) / T_END); hero.update(dt, time, camera);   // the hero's clock follows the journey second this pace really gives, 3 s ahead on the crest so the fork's gobbets land as we pass
        U.uDryClock.value = clamp(U.uDryClock.value + hour.dry, 0.2, 1);
        tide(T, time);
        spB[0].y = lerp(growTop[0].y, growTop[1].y, clamp(U.uT.value / T_END, 0, 1));
        camPos.setFromMatrixPosition(camera.matrixWorld); sky.position.copy(camPos);
        updateHoppers(T, time); updateEscorts(T, u); updateBirds(T, time);
        updateNaveHoppers(T);
        if (u < 0.16) updateWrack(T, time);      // the wrack is astern after that (every part of it 25 to 75 m behind the eye at that point) and the gaze is ahead: nothing of it is laid on the ground again
        if (plumes && ctx.renderer) { ctx.renderer.getDrawingBufferSize(bufSize); plumes.material.uniforms.uViewH.value = bufSize.y; }
      },
      dispose() { hero.dispose(); turretDepth.dispose(); walls.customDepthMaterial.dispose(); },
    };
  },
};
