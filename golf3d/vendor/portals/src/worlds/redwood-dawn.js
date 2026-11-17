// REDWOOD DAWN: first light slants through a fog-filled grove of giant redwoods; the camera follows a creek
// gully between trunks wider than houses and ends by flying down the burnt-out heart of the Fallen Giant.
//
// Layout (world space, metres): the Fallen Giant (src/parts/redwood-dawn.js) lies along Z at the origin, its
// root wheel facing +Z at z = 60, the portal seat at z = -15 inside the bore. The camera enters at z ~ 566 and
// flies toward -Z, straight at the low sun (14 degrees up, a little to the left):
//   0.00  an avenue of trunks receding into bright fog, the creek glinting below
//   0.28  the path curls right around the Elder Column, 7 m from its bark
//   0.43  a stag and does on a knoll 36 m to the left, dark against a shaft of light (heads lift as the camera passes)
//   0.62  the creek tumbles down a riffle, the path straightens and the root wheel stands dead ahead with the
//         portal ring already burning far down its black mouth
//   0.70  an owl drops from the roots and glides over the camera
//   0.87  through the wheel into the bore; skylight shafts slide past; the portal fills the far end
//
// Light: one low warm key + one hemisphere (kit light rig). No shadow map: trunk shadows are long blob streaks
// on the ground, the forest floor carries slow moving dapples (terrain cloud layer scaled down to canopy
// size), the canopy is a mask of ragged crown discs baked over the trunks, and three depth-tested glow veils between the camera and the sun fake forward-scattering fog so far
// trunks dissolve into light while near ones stay dark silhouettes.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import * as SKY from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as W from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/redwood-dawn.js';

const TAU = Math.PI * 2;
const PALETTE = ['#f6d9a4', '#b8c9b4', '#56704e', '#2a3a2a', '#5a3423', '#1b1410', '#ffb347'];
const DURATION = 46;
const C = (h) => new THREE.Color(h);
const hex = (c) => '#' + c.getHexString();

// ---------------------------------------------------------------- small fallen logs (one merged mesh)
// Each log is a bumpy tapered tube lying on the ground: bark on the flanks, moss on top, a pale broken end.
function fallenLogsGeometry(logs, rng, noise, cols) {
  const P = [], N = [], Cc = [], I = []; let cnt = 0;
  const col = new THREE.Color(), SIDES = 10;
  for (const L of logs) {
    const segs = Math.max(6, Math.round(L.len / 2.2)), ca = Math.cos(L.yaw), sa = Math.sin(L.yaw), ph = rng.range(0, 60), start = cnt;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, r0 = L.r * lerp(1, 0.72, t) * (1 + 0.1 * noise.n2(ph, t * 5));
      const along = (t - 0.5) * L.len, cx = L.x + ca * along, cz = L.z + sa * along, cy = L.y(cx, cz) + r0 * 0.62;
      for (let s = 0; s < SIDES; s++) {
        const a = (s / SIDES) * TAU, r = r0 * (1 + 0.09 * Math.sin(a * 5 + ph + t * 3) + 0.06 * noise.n2(ph + a * 2, t * 9));
        const ox = Math.cos(a) * r, oy = Math.sin(a) * r;                 // ox across the log, oy up
        P.push(cx - sa * ox, cy + oy, cz + ca * ox); N.push(-sa * Math.cos(a), Math.sin(a), ca * Math.cos(a));
        const up = Math.sin(a), mossy = smoothstep(0.1, 0.75, up + 0.35 * noise.n2(ph + t * 7, a));
        col.copy(cols.bark).lerp(cols.barkDark, 0.5 + 0.5 * Math.sin(a * 5 + ph)).lerp(cols.moss, mossy * 0.9).multiplyScalar(0.75 + 0.4 * rng());
        if (up < -0.2) col.multiplyScalar(0.5);
        Cc.push(col.r, col.g, col.b); cnt++;
      }
    }
    for (let i = 0; i < segs; i++) for (let s = 0; s < SIDES; s++) {
      const a = start + i * SIDES + s, b = start + i * SIDES + (s + 1) % SIDES;
      I.push(a, b, a + SIDES, b, b + SIDES, a + SIDES);
    }
    for (const end of [0, segs]) {                                         // broken ends: a pale heartwood fan
      const t = end / segs, along = (t - 0.5) * L.len, cx = L.x + ca * along, cz = L.z + sa * along, cy = L.y(cx, cz) + L.r * lerp(1, 0.72, t) * 0.62, dir = end ? 1 : -1;
      P.push(cx + ca * dir * 0.5, cy, cz + sa * dir * 0.5); N.push(ca * dir, 0, sa * dir); Cc.push(cols.heart.r, cols.heart.g, cols.heart.b); const c0 = cnt++;
      for (let s = 0; s < SIDES; s++) { const a = start + end * SIDES + s, b = start + end * SIDES + (s + 1) % SIDES; if (end) I.push(a, b, c0); else I.push(b, a, c0); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- giants: bare columns, crowns only in the top 40 %
// The kit redwood starts its crown at 40-50 % of the height. A real 90 m redwood is a bare column for most of it, so
// the same tree is built twice from one seed (bare / crowned): every vertex past the bare trunk is a bough or a stub,
// and the boughs are lifted into the band [from, 0.97] x height. Returns { geo, lean: [x/y, z/y] }.
async function giantGeometry(seed, o, from = 0.6, wide = false, pause = null) {
  const bare = flora.redwoodGeometry({ ...o, rng: makeRng(seed), crown: false }), nb = bare.getAttribute('position').count;
  const bp = bare.getAttribute('position'); let top = 0;
  for (let i = 1; i < nb; i++) if (bp.getY(i) > bp.getY(top)) top = i;
  const lean = [bp.getX(top) / bp.getY(top), bp.getZ(top) / bp.getY(top)];
  bare.dispose();
  if (pause) await pause();
  const geo = flora.redwoodGeometry({ ...o, rng: makeRng(seed) }), pos = geo.getAttribute('position'), H = o.height;
  if (pos.count > nb) {
    const lo = 0.4 * H, k = (0.97 - from) / 0.55;
    for (let i = nb; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < 0.37 * H) continue;                                           // broken stubs low on the column stay where they are
      const y2 = from * H + (y - lo) * k, x = pos.getX(i), z = pos.getZ(i), ax = lean[0] * y, az = lean[1] * y;
      const tt = clamp((y2 / H - from) / (0.97 - from), 0, 1), w = wide ? 1.15 * (1 + 0.9 * tt * tt) : 0.8 * (1 + 0.8 * tt * tt);   // far crowns are a blunt dense column top packed into the canopy band (never a pagoda, never a spire); near ones are short dense sprays
      pos.setXYZ(i, lean[0] * y2 + (x - ax) * w, y2, lean[1] * y2 + (z - az) * w);
    }
    pos.needsUpdate = true; geo.computeBoundingSphere(); geo.computeBoundingBox();
  }
  return { geo, lean };
}

// The Elder Column's trunk: the kit profile at high resolution with deep wandering furrows (0.25-0.4 m), so the
// silhouette edge is fluted and the bark reads from 7 m. Attribute layout matches the kit flora geometry.
function elderTrunkGeometry(o, noise, cols) {
  const SIDES = 96, RINGS = 40, H = o.height, R = o.radius, ridges = o.ridges, P = [], Cc = [], Wd = [], Uv = [], I = [], col = new THREE.Color();
  for (let i = 0; i <= RINGS; i++) {
    const t = Math.pow(i / RINGS, 1.7), y = H * t, r0 = R * 1.17 * (1 - 0.9 * Math.pow(t, 0.8)) * (1 + 0.75 * Math.exp(-t * 26)), butt = Math.exp(-t * 16);
    for (let s = 0; s <= SIDES; s++) {
      const a = (s / SIDES) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const wander = 0.55 * noise.n3(ca * 1.6, sa * 1.6, y * 0.035) + 0.2 * noise.n3(ca * 4, sa * 4, y * 0.11);
      const w = Math.abs(Math.sin(a * ridges * 0.5 + o.phase + wander + y * 0.012));              // 0 in a furrow, 1 on a ridge crest
      const ridge = Math.pow(w, 0.55), big = 0.5 + 0.5 * Math.sin(a * Math.round(ridges * 0.31) + o.phase * 2 + wander * 0.6);
      const depth = (0.3 + 0.1 * noise.n3(ca * 2.3 + 5, sa * 2.3, y * 0.05)) * (0.45 + 0.55 * Math.min(1, r0 / R)) * (1 + 1.1 * butt);
      const r = r0 + depth * (ridge - 1) + R * 0.2 * butt * (big - 0.35) + 0.07 * noise.n3(ca * 9, sa * 9, y * 0.4);
      P.push(o.lean[0] * y + ca * r, y, o.lean[1] * y + sa * r);
      const grain = 0.5 + 0.5 * noise.n3(ca * 14, sa * 14, y * 0.22);
      col.copy(cols.barkDark).lerp(cols.bark, smoothstep(0.08, 0.55, ridge)).lerp(cols.barkLight, smoothstep(0.7, 1, ridge) * (0.35 + 0.5 * grain));
      col.lerp(cols.moss, smoothstep(0.1, 0.0, t) * 0.55 * smoothstep(0.35, 0.8, grain)).multiplyScalar((0.8 + 0.4 * grain) * lerp(0.45, 1, smoothstep(0, 3.5, y)));   // the butt sinks into dark humus (no pale band where the ground fog meets it)
      Cc.push(col.r, col.g, col.b); Wd.push(o.flex * 0.02 * H * t * t, 0, 0, 0); Uv.push(0.875, 0.75);
    }
  }
  const w = SIDES + 1;
  for (let i = 0; i < RINGS; i++) for (let s = 0; s < SIDES; s++) { const a = i * w + s, b = a + w; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(P.length), 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('wind', new THREE.Float32BufferAttribute(Wd, 4));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(Uv, 2)); g.setIndex(I); g.computeVertexNormals();
  // weld the seam normals (first and last column of each ring share a position)
  const n = g.getAttribute('normal');
  for (let i = 0; i <= RINGS; i++) {
    const a = i * w, b = a + SIDES, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}

// The leaning snag: a dead trunk seen from 10 m, so it gets what the small logs do not: a fluted bark column (12 wandering
// ridges, 0.15 m deep), moss along its upper side, a dark underside and broken branch stubs. Attribute layout matches
// the kit flora geometry, so it is shaded by the same bark material as the giants. Also returns the points on its
// underside where lichen hangs.
function snagGeometry(sn, rng, noise, cols) {
  const SIDES = 40, RINGS = 46, P = [], Cc = [], I = [], col = new THREE.Color(), hang = [];
  const A = new THREE.Vector3(sn.ax, sn.y0, sn.az), B = new THREE.Vector3(sn.bx, sn.y0 + sn.slope * sn.len, sn.bz), T = B.clone().sub(A), L = T.length(); T.normalize();
  const S = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 1, 0)).normalize(), U = new THREE.Vector3().crossVectors(S, T).normalize(), c = new THREE.Vector3(), ph = rng.range(0, 6.28);
  const rAt = (t) => sn.r * lerp(1.18, 0.72, t) * (1 + 0.08 * noise.n2(ph, t * 6));
  for (let i = 0; i <= RINGS; i++) {
    const t = i / RINGS, r0 = rAt(t); c.copy(A).addScaledVector(T, t * L);
    for (let k = 0; k <= SIDES; k++) {
      const a = (k / SIDES) * TAU, ca = Math.cos(a), sa = Math.sin(a), wander = 0.7 * noise.n3(ca * 1.5, sa * 1.5, t * 9 + ph) + 0.25 * noise.n3(ca * 4, sa * 4, t * 30);
      const ridge = Math.pow(Math.abs(Math.sin(a * 6 + ph + wander + t * 2.2)), 0.55), grain = 0.5 + 0.5 * noise.n3(ca * 11, sa * 11, t * 60);
      const r = r0 + 0.22 * (ridge - 1) + 0.05 * noise.n3(ca * 7, sa * 7, t * 40) + 0.12 * noise.n3(ca * 1.2 + 9, sa * 1.2, t * 7);
      const dx = ca * S.x + sa * U.x, dy = ca * S.y + sa * U.y, dz = ca * S.z + sa * U.z;
      P.push(c.x + dx * r, c.y + dy * r, c.z + dz * r);
      col.copy(cols.barkDark).lerp(cols.bark, smoothstep(0.08, 0.55, ridge)).lerp(cols.barkLight, smoothstep(0.7, 1, ridge) * (0.3 + 0.55 * grain));
      col.lerp(cols.moss, smoothstep(0.4, 0.85, dy + 0.3 * noise.n3(ca * 2 + 3, sa * 2, t * 14)) * 0.85).multiplyScalar((0.78 + 0.4 * grain) * lerp(0.42, 1, smoothstep(-0.75, 0.1, dy)));
      Cc.push(col.r, col.g, col.b);
    }
  }
  const w = SIDES + 1;
  for (let i = 0; i < RINGS; i++) for (let k = 0; k < SIDES; k++) { const a = i * w + k, b = a + w; I.push(a, b, a + 1, a + 1, b, b + 1); }
  let cnt = (RINGS + 1) * w;
  for (let j = 0; j < 8; j++) {                                              // broken branch stubs
    const t = 0.16 + 0.085 * j + rng.range(-0.03, 0.03), a = rng.range(-0.5, 3.6), len = rng.range(1.1, 2.8), rad = rng.range(0.2, 0.36), SD = 6, RN = 4, start = cnt;
    const dir = new THREE.Vector3().addScaledVector(S, Math.cos(a)).addScaledVector(U, Math.sin(a)).addScaledVector(T, rng.range(0.15, 0.6)).normalize();
    const e1 = new THREE.Vector3().crossVectors(dir, T).normalize(), e2 = new THREE.Vector3().crossVectors(dir, e1), o = c.copy(A).addScaledVector(T, t * L).addScaledVector(dir, rAt(t) * 0.7).clone();
    for (let i = 0; i <= RN; i++) for (let k = 0; k < SD; k++) {
      const q = i / RN, b = (k / SD) * TAU, rr = rad * (i === RN ? 0.25 : lerp(1.25, 0.6, q)) * (1 + 0.2 * Math.sin(b * 2 + j)), jag = i === RN ? rng.range(-0.25, 0.1) : 0;
      P.push(o.x + dir.x * len * (q + jag) + (Math.cos(b) * e1.x + Math.sin(b) * e2.x) * rr, o.y + dir.y * len * (q + jag) + (Math.cos(b) * e1.y + Math.sin(b) * e2.y) * rr, o.z + dir.z * len * (q + jag) + (Math.cos(b) * e1.z + Math.sin(b) * e2.z) * rr);
      col.copy(cols.barkDark).lerp(i === RN ? cols.heart : cols.bark, i === RN ? 0.8 : 0.3 + 0.5 * rng()); Cc.push(col.r, col.g, col.b); cnt++;
    }
    for (let i = 0; i < RN; i++) for (let k = 0; k < SD; k++) { const p0 = start + i * SD + k, p1 = start + i * SD + (k + 1) % SD; I.push(p0, p1, p0 + SD, p1, p1 + SD, p0 + SD); }
  }
  for (let j = 0; j < 44; j++) {                                              // where the lichen hangs: the underside of the middle stretch
    const t = rng.range(0.3, 0.86), a = -Math.PI / 2 + rng.range(-0.75, 0.75), r = rAt(t) * 0.82; c.copy(A).addScaledVector(T, t * L);
    hang.push([c.x + (Math.cos(a) * S.x + Math.sin(a) * U.x) * r, c.y + (Math.cos(a) * S.y + Math.sin(a) * U.y) * r, c.z + (Math.cos(a) * S.z + Math.sin(a) * U.z) * r]);
  }
  const g = new THREE.BufferGeometry(), n = P.length / 3, Wd = new Float32Array(n * 4), Uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { Uv[i * 2] = 0.875; Uv[i * 2 + 1] = 0.75; }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(P.length), 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('wind', new THREE.BufferAttribute(Wd, 4)); g.setAttribute('uv', new THREE.BufferAttribute(Uv, 2));
  g.setIndex(I); g.computeVertexNormals();
  const nr = g.getAttribute('normal');
  for (let i = 0; i <= RINGS; i++) {                                           // weld the seam
    const a = i * w, b = a + SIDES, x = nr.getX(a) + nr.getX(b), y = nr.getY(a) + nr.getY(b), z = nr.getZ(a) + nr.getZ(b), l = Math.hypot(x, y, z) || 1;
    nr.setXYZ(a, x / l, y / l, z / l); nr.setXYZ(b, x / l, y / l, z / l);
  }
  return { geo: g, hang };
}

// ================================================================ the world
export default {
  id: 'redwood-dawn',
  name: 'Redwood Dawn',
  category: 'wilderness',
  weirdness: 0.02,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const scene = new THREE.Scene();
    const time = { value: 0 };

    // ---------------- per-seed character
    const V = {
      sunEl: rng.range(12, 16.5), sunAz: -rng.range(4, 26),     // low sun ahead, a little to the left
      warm: rng.chance(0.5) ? rng.range(0.18, 0.3) : rng.range(0.45, 0.7),   // half the visits are cool green-gold first light, half warm gold (never mustard)
      fog: rng.range(0.0054, 0.0068), mist: rng.range(0.5, 1.6),
      bend: rng.range(0.82, 1.18),
      does: rng.int(2, 3), fawn: rng.chance(0.4),
      birds: rng.pick(['swifts', 'crows', 'none', 'swifts']), butterflies: rng.chance(0.55),
      maples: rng.int(7, 13), mapleRed: rng.range(0, 0.5),
      needles: rng.range(0.6, 1.4), moss: rng.range(0.35, 0.75),
      canopy: rng.range(0.36, 0.44), wheelBirds: rng.int(5, 11), dragonflies: rng.chance(0.6),
    };
    const fogCol = C('#b8c9b4').lerp(C('#efe2c0'), V.warm);                // pale green-gold
    const fogHi = fogCol.clone().lerp(C('#fff0c8'), 0.55);
    const keyCol = C('#ffd2a0').lerp(C('#ffb65c'), V.warm);
    const gold = C(PALETTE[6]).lerp(C('#ffd08a'), 0.35 * (1 - V.warm));

    // ---------------- sky (seen only through gaps), fog, light
    const sky = SKY.makeSky({
      rng: rng.fork('sky'), preset: 'goldenHour', clouds: false, clouds2: false, stars: 0,
      zenith: hex(fogHi.clone().lerp(C('#dfe8dc'), 0.35)), mid: hex(fogHi), horizon: hex(fogCol), ground: hex(fogCol), horizonPow: 1.4, midPow: 1.2, groundFalloff: 1,
      scatterColor: hex(gold.clone().lerp(C('#fff0c8'), 0.4)), scatter: 0.55, scatterPow: 2.5, scatterHigh: 0.35, scatterFall: 2,
      sunElevation: V.sunEl, sunAzimuth: V.sunAz, sunColor: '#ffe6b8', sunSize: 2.4, sunIntensity: 3.2, sunGlow: 1.0, sunGlowTight: 0.25,
      lightColor: hex(keyCol), lightIntensity: 3.3, ambientColor: hex(fogCol.clone().lerp(C(PALETTE[1]), 0.5)), groundLight: '#8a6a3c', ambientIntensity: 0.9, lightElevationMin: 10,
    });
    scene.add(sky.object);
    await ctx.yield();
    const sunDir = sky.sunDirection.clone().normalize();
    const sunH = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize();
    scene.fog = new THREE.FogExp2(fogCol.clone(), V.fog);
    const rig = SKY.makeLightRig(sky, { intensity: 1, ambient: 1 });
    scene.add(rig.object);
    await ctx.yield();

    // ---------------- the hero
    const hero = await buildHero(ctx, { palette: PALETTE, skyColor: hex(fogHi), portalColor: hex(gold), ember: 1.6, shaft: 1.7, bounce: 0.25, bounceIn: 0.5 });
    scene.add(hero.object);
    const A = hero.anchors;
    await ctx.yield();

    // ---------------- camera path
    const m = V.bend;
    const pathPts = [[-28 * m, 12.6, 566], [-28 * m, 11.9, 522], [-26 * m, 10.9, 474], [-19 * m, 10.0, 428], [-3 * m, 9.3, 386], [14 * m, 9.1, 344],
      [24 * m, 9.3, 300], [22 * m, 9.5, 266], [15.5 * m, 8.7, 240], [10.5 * m, 7.6, 216], [9.6, 7.8, 192], [9, 8.0, 166], [6.4, 7.7, 140], [2.2, 7.0, 114]];
    // the last bend holds 9 m to the right and a little high until z = 140, so the wheel is seen three-quarter and looms; from z = 85 it is the Giant's own axis
    for (const p of A.flyThrough) if (p.z < 100) pathPts.push([p.x, p.y, p.z]);
    const path = makePath(pathPts);

    // the route as x(z), y(z) tables (it never doubles back in z)
    const PZ0 = -20, PZ1 = 570, pxT = new Float32Array(PZ1 - PZ0 + 2), pyT = new Float32Array(PZ1 - PZ0 + 2);
    {
      const q = new THREE.Vector3(); let k = 0; path.pointAt(0, q); let ax = q.x, ay = q.y, az = q.z;
      for (let zi = PZ1; zi >= PZ0; zi--) {
        while (k < 900 && q.z > zi) { ax = q.x; ay = q.y; az = q.z; k++; path.pointAt(k / 900, q); }
        const t = az - q.z > 1e-4 ? clamp((az - zi) / (az - q.z), 0, 1) : 0;
        pxT[zi - PZ0] = lerp(ax, q.x, t); pyT[zi - PZ0] = lerp(ay, q.y, t);
      }
      pxT[PZ1 - PZ0 + 1] = pxT[PZ1 - PZ0]; pyT[PZ1 - PZ0 + 1] = pyT[PZ1 - PZ0];
    }
    await ctx.yield();
    const tab = (arr, z) => { const f = clamp(z - PZ0, 0, PZ1 - PZ0), i = Math.floor(f); return arr[i] + (arr[i + 1] - arr[i]) * (f - i); };
    const pathX = (z) => tab(pxT, z), pathY = (z) => tab(pyT, z);

    // ---------------- the creek: under the camera until the Giant, then it swings right and runs along his flank
    const creekPh = rng.range(-0.35, 0.35);            // the creek meanders 6-7 m either side of the route and slips under it four times; it starts on the left
    const creekX = (z) => lerp(31 * smoothstep(112, 60, z), pathX(clamp(z, PZ0, PZ1)) - 4.5 * Math.cos((z - 550) * 0.0419 + creekPh) * smoothstep(232, 300, z), smoothstep(150, 236, z)) - 7.5 * smoothstep(146, 198, z) * (1 - smoothstep(222, 264, z));   // below the riffle it runs 7-9 m left of the route, never under the lens
    const creekW = (z) => clamp(3.2 + 1.2 * Math.sin(z * 0.071 + creekPh * 9) + 0.6 * Math.sin(z * 0.19 + creekPh * 5), 2, 5);      // width of the water, metres
    const creekY = (z) => (z >= 250 ? 4.2 + (z - 250) * 0.006 : lerp(-0.45, 4.2, smoothstep(196, 250, z)));        // water surface
    // distance to the creek's centre line, from 1 m tables (it is asked for hundreds of thousands of times while the floor is built)
    const CZ0 = -210, CZ1 = 730, cxT = new Float32Array(CZ1 - CZ0 + 2), ckT = new Float32Array(CZ1 - CZ0 + 2);
    for (let i = 0; i < cxT.length; i++) { const z = CZ0 + i; cxT[i] = creekX(z); ckT[i] = 1 / Math.sqrt(1 + Math.pow((creekX(z + 2) - creekX(z - 2)) / 4, 2)); }
    const dCreek = (x, z) => { const f = clamp(z - CZ0, 0, CZ1 - CZ0), i = Math.floor(f), t = f - i; return Math.abs(x - (cxT[i] + (cxT[i + 1] - cxT[i]) * t)) * (ckT[i] + (ckT[i + 1] - ckT[i]) * t); };
    // the deer trail: it keeps to the bank opposite the creek, fords it where the creek slips under the route, and ends at the wheel's mouth
    const trailX = (z) => pathX(z) + 3.4 * Math.cos((z - 550) * 0.0419 + creekPh) * smoothstep(232, 300, z);
    const trailK = (x, z, k) => (z > 560 || z < 96 ? 0 : smoothstep(2.6 + 0.8 * k, 1.0 + 0.8 * k, Math.abs(x - trailX(z))) * smoothstep(96, 112, z));
    await ctx.yield();

    // the deer's glade: a low knoll 36 m to the LEFT of the path, so they stand clear of the ferns against bright fog
    const gladeU = 0.43, gp = path.pointAt(gladeU), gt = path.tangentAt(gladeU);
    const glade = { x: gp.x + gt.z * 36, z: gp.z - gt.x * 36, r: 13, y: 0 };

    // ---------------- terrain: rolling floor, creek gully, level bed for the Giant
    const height = (x, z) => {
      const dc = dCreek(x, z), wy = creekY(z);
      const n05 = noise.n2(x * 0.05, z * 0.05);
      let h = wy + 1.5 + 2.6 * noise.fbm2(x * 0.011 + 3, z * 0.011, 3) + 1.2 * n05 * smoothstep(5, 22, dc) + 0.3 * n05 + 5.5 * smoothstep(14, 110, dc) + 9 * smoothstep(120, 250, Math.abs(x));
      h += 4.6 * smoothstep(30, 7, Math.hypot(x - glade.x, z - glade.z));
      // level pad around the Giant (his duff berms dip to -1.1)
      const pad = smoothstep(125, 78, z) * smoothstep(-110, -70, z) * (1 - smoothstep(20, 44, Math.abs(x)));
      if (pad > 0) h = lerp(h, 0.15 + 0.3 * noise.n2(x * 0.07, z * 0.07) + (1.1 + 1.3 * noise.n2(x * 0.045 + 8, z * 0.045)) * smoothstep(13, 30, Math.abs(x)), pad);
      // keep the ground about 4.2 m under the camera (a noise-broken hollow, not a ruled cut)
      if (z > PZ0 && z < PZ1) {
        const dp = Math.abs(x - pathX(z)), nb = noise.n2(x * 0.09 + 11, z * 0.09);
        if (dp < 21) h = Math.min(h, lerp(pathY(z) - 4.2 - 0.5 * nb, h, smoothstep(6 + 1.5 * nb, 17 + 4 * nb, dp)));
      }
      // creek channel: a bed 1.3 m under the water, a short steep bank that the water laps, then the shoulders
      if (dc >= 14) h = Math.max(h, wy + 0.5);                                           // beyond the shoulders the channel leaves the floor alone
      else {
      const hw = creekW(z) * 0.5, bank = lerp(wy - 1.3 + 0.15 * noise.n2(x * 0.3, z * 0.3), wy + 0.14, smoothstep(hw - 0.9, hw + 0.5, dc));   // cut a little wider than the water: the floor's 2.5 m cells must not poke through the ribbon
      h = lerp(bank, Math.max(h, wy + 0.5), smoothstep(hw + 0.4, hw + 3.8 + 1.2 * noise.n2(x * 0.11, z * 0.11 + 9), dc) * (0.6 + 0.4 * smoothstep(5, 14, dc)));
      }
      // trench under the log so the floor of the bore is his own; it opens into a soft apron in front of the mouth
      if (z < 100 && z > -61) h = Math.min(h, lerp(-1.7, h, Math.max(smoothstep(6.5, 14, Math.abs(x) + 2.5 * noise.n2(x * 0.12, z * 0.12)), smoothstep(64, 100, z + 5 * noise.n2(x * 0.1 + 4, z * 0.1)))));
      return h;
    };

    // forest floor colours: red duff, dark humus, moss, pale gravel in the creek
    const cDuff = C('#735234'), cDuffB = C('#84623a'), cHumus = C('#3e3424'), cMoss = C(PALETTE[2]).lerp(C('#8aa24e'), 0.55), cMossD = C(PALETTE[3]).lerp(C(PALETTE[2]), 0.3), cGravel = C('#3c3a30'), cWet = C('#14120c'), cTrail = C('#9c8452'), mossK = Math.max(V.moss, 0.6);
    const groundColor = (x, z, y, ny, out) => {
      const o = out || new THREE.Color(), n = 0.5 + 0.5 * noise.fbm2(x * 0.035 + 7, z * 0.035, 3), k = 0.5 + 0.5 * noise.n2(x * 0.13, z * 0.13), dc = dCreek(x, z);
      o.copy(cDuff).lerp(cDuffB, k).lerp(cHumus, smoothstep(0.62, 0.3, n) * 0.45);
      o.lerp(cMossD, smoothstep(0.42, 0.7, n) * mossK * 0.7).lerp(cMoss, smoothstep(0.5, 0.8, n) * mossK);
      const tw = trailK(x, z, k);                                                          // the deer trail: pale trodden duff
      if (tw > 0) o.lerp(cTrail, 0.5 * tw);
      if (dc < 12) { const hw = creekW(z) * 0.5; o.lerp(cMoss, 0.6 * smoothstep(12, 5, dc)).lerp(cWet, 0.8 * smoothstep(hw + 1.6, hw + 0.4, dc)).lerp(cGravel, 0.6 * smoothstep(hw + 0.3, hw - 0.9, dc) * (0.6 + 0.4 * k)); }
      if (ny !== undefined) o.lerp(cHumus, smoothstep(0.9, 0.6, ny) * 0.4);
      return o.multiplyScalar(0.85 + 0.3 * k);
    };
    const landOpts = {
      rng: rng.fork('land'), noise, path, height, bounds: [-250, -200, 250, 664], cell: 2.5, near: 30, levels: 5, corridor: false, maxTriangles: 72000,
      biome: 'meadow', color: groundColor, sunDir, shadow: 0.55, ao: 0.35,
      palette: { rock: '#4a4034', rockB: '#5c4c3a', rockSlope: [0.4, 0.62], strata: 0.1, patch: '#7c9450', patchAmount: 0.5, tufts: 0.6, pebbles: 0.35, detail: 0.4, cracks: 0,
        clouds: 0.55, cloudSize: 64, cloudSpeed: 1.4, roughness: 0.95, bounce: '#6a5a30', bounceAmount: 1.6 },
    };
    const land = T.makeTerrainAsync ? await T.makeTerrainAsync(landOpts, () => ctx.yield()) : T.makeTerrain(landOpts);
    scene.add(land.object);
    const hAt = land.heightAt, sAt = land.surfaceAt || land.heightAt;
    await ctx.yield();

    // ---------------- water: the creek
    const riverPts = [];
    for (let z = 650; z >= -196; z -= 6) riverPts.push([creekX(z), creekY(z) + 0.08, z]);
    const rLen = [0]; for (let i = 1; i < riverPts.length; i++) rLen.push(rLen[i - 1] + Math.hypot(riverPts[i][0] - riverPts[i - 1][0], riverPts[i][1] - riverPts[i - 1][1], riverPts[i][2] - riverPts[i - 1][2]));
    const zOfT = (t) => {                                                                // arc-length fraction of the ribbon -> world z (the banks are cut in z)
      const d = clamp(t, 0, 1) * rLen[rLen.length - 1]; let i = Math.min(rLen.length - 2, Math.floor(clamp(t, 0, 1) * (rLen.length - 1)));
      while (i > 0 && rLen[i] > d) i--; while (i < rLen.length - 2 && rLen[i + 1] < d) i++;
      return lerp(riverPts[i][2], riverPts[i + 1][2], clamp((d - rLen[i]) / Math.max(1e-6, rLen[i + 1] - rLen[i]), 0, 1));
    };
    // forest water as the leading line: dark under the lens, a pale silver-gold ribbon where it runs toward the sun
    const river = W.makeRiver({ rng: rng.fork('creek'), light: sky, points: riverPts, width: (t) => creekW(zOfT(t)) + 1.6, speed: 1.2, across: 8, deep: '#0e2222', shallow: '#34504a', wetColor: '#1c1a12',
      zenith: '#284444', mid: hex(C('#243c3a').lerp(C('#cfe0d8'), 0.15)), horizon: hex(C('#6c8478').lerp(fogHi, 0.3)), scatter: 0.2, glint: 0.06, sunIntensity: 0.5,
      foam: 0.05, bankFoam: 0.1, ripple: 0.2, opacity: 0.8, bankFade: 2.2, chop: 0.02, bow: 0 });
    river.object.renderOrder = -0.2;                                                     // before the ground fog and mist, so they lie over the water (drawn after them it cut a clear window through the fog)
    scene.add(river.object);
    await ctx.yield();

    // ---------------- where the giants stand
    glade.y = hAt(glade.x, glade.z);
    await ctx.yield();
    const toSun = (x, z) => {                                                           // distance along / across the sun line leaving the glade
      const dx = x - glade.x, dz = z - glade.z, al = dx * sunH.x + dz * sunH.z; return [al, Math.abs(dx * sunH.z - dz * sunH.x)];
    };
    const sightFrom = [0.31, 0.34, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52].map((u) => path.pointAt(u));
    const blocksDeer = (x, z, r) => {                                                   // would a trunk here hide the glade from the path?
      for (const a of sightFrom) {
        const dx = glade.x - a.x, dz = glade.z - a.z, L2 = dx * dx + dz * dz, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / L2, 0, 1);
        if (Math.hypot(x - a.x - dx * t, z - a.z - dz * t) < r) return true;
      }
      return false;
    };
    // a dead trunk that fell and lodged high against a giant: it leans across the route at u 0.145 and the camera passes under it
    const snag = { r: 1.3 };
    {
      const sp = path.pointAt(0.145), st = path.tangentAt(0.145); st.y = 0; st.normalize();
      snag.ax = sp.x + st.z * 21; snag.az = sp.z - st.x * 21; snag.bx = sp.x - st.z * 17; snag.bz = sp.z + st.x * 17; snag.len = 38;       // butt on the ground 21 m to the left, top 17 m to the right
      snag.tx = sp.x - st.z * 18.7; snag.tz = sp.z + st.x * 18.7;                                                                     // the giant that caught it
      snag.y0 = hAt(snag.ax, snag.az) - 0.5; snag.slope = (sp.y + 9.4 + snag.r * 1.3 + 0.6 - snag.y0) / 21;   // its underside passes 9.4 m over the lens
      snag.along = (x, z) => ((x - snag.ax) * (snag.bx - snag.ax) + (z - snag.az) * (snag.bz - snag.az)) / snag.len;
      snag.dist = (x, z) => { const t = clamp(snag.along(x, z), 0, snag.len) / snag.len; return Math.hypot(x - lerp(snag.ax, snag.bx, t), z - lerp(snag.az, snag.bz, t)); };
    }
    const tr = rng.fork('trees'), trees = [];
    const RB = 1.8;                                                                      // base flare of the kit redwood (x girth radius)
    const treeOK = (x, z, R, strict = true) => {
      if (x < -235 || x > 235 || z < -185 || z > 650) return false;
      const near = path.nearestXZ(x, z);
      if (near.dist < R * RB + 7.2) return false;
      if (Math.hypot(x - path.start.x, z - path.start.z) < R * RB + 16) return false;
      if (z > path.start.z - 4 && Math.abs(x - path.start.x) < R * RB + 11) return false;      // the lane the portal camera looks down before the crossing
      if (Math.abs(x) < 23 + R && z > -74 && z < 84) return false;                        // the Giant and his berms
      if (Math.abs(x) < 27 + R && z >= 84 && z < 150) return false;                        // nothing crowds the root wheel
      if (dCreek(x, z) < R * RB + 3.5) return false;
      if (Math.hypot(x - glade.x, z - glade.z) < glade.r + R * RB) return false;
      const [al, ac] = toSun(x, z); if (al > 0 && al < 95 && ac < 7 + R + al * 0.05) return false;   // the sun lane that lights the deer
      if (blocksDeer(x, z, R * RB + 2.5)) return false;
      if (snag.dist(x, z) < R * RB + snag.r + 1) return false;
      if (strict) { const sp = near.dist > 60 ? 12 : 15.5; for (const t of trees) if (Math.hypot(x - t.x, z - t.z) < sp + (R + t.R) * 0.8) return false; }   // the far grove closes up into a wall of columns
      return true;
    };
    const addTree = (x, z, R, v) => { trees.push({ x, z, R, v: v ?? tr.int(0, 2), rot: tr.range(0, TAU) }); };
    // the Elder Column: the close pass, on the inside of the right-hand bend
    const eu = 0.278, ep = path.pointAt(eu), et = path.tangentAt(eu); et.y = 0; et.normalize();
    const elder = { x: ep.x - et.z * 11.6, z: ep.z + et.x * 11.6, R: 3.7 };
    for (let k = 0; k < 8 && path.nearestXZ(elder.x, elder.z).dist < 11.2; k++) { elder.x -= et.z * 0.5; elder.z += et.x * 0.5; }
    trees.push({ ...elder, v: -1, rot: 0 });
    await ctx.yield();
    addTree(snag.tx, snag.tz, 3.2, 0);
    // one near giant on the left where the path straightens: the root wheel is first seen past a dark foreground trunk
    for (let z = 252; z > 232; z -= 3) { const x = pathX(z) - 14.5, R = 3.9; if (dCreek(x, z) > R * RB + 3 && !blocksDeer(x, z, R * RB + 2.5)) { addTree(x, z, R, 1); break; } }
    // one dark trunk close on the right of the entry lane: the frame of the first view (also through the portal)
    { const z = 549 + tr.range(-1.5, 1.5); addTree(pathX(z) + 11.4, z, 2.8, 0); }
    // a dark wall of trunks beyond the deer's glade (away from the camera), clear of the sun lane that lights them
    {
      const ox = glade.x - gp.x, oz = glade.z - gp.z, ol = Math.hypot(ox, oz), nx = ox / ol, nz = oz / ol; let placed = 0;
      for (let i = 0; i < 60 && placed < 4; i++) {
        const d = tr.range(25, 40), a = (placed - 1.5) * 13 + tr.range(-5, 5), x = glade.x + nx * d - nz * a, z = glade.z + nz * d + nx * a, R = tr.range(2.9, 3.8);
        if (treeOK(x, z, R)) { addTree(x, z, R); placed++; }
      }
    }
    await ctx.yield();
    // the entry avenue, and the avenue that frames the root wheel
    for (const z of [548, 519, 489, 458]) for (const side of [-1, 1]) {
      const x = pathX(z) + side * tr.range(13.5, 17.5), zz = z + tr.range(-5, 5), R = tr.range(2.6, 3.6);
      if (treeOK(x, zz, R)) addTree(x, zz, R);
    }
    for (const z of [196, 164]) for (const side of [-1, 1]) {
      const x = pathX(z) + side * tr.range(15.5, 20), zz = z + tr.range(-6, 6), R = tr.range(2.7, 3.7);
      if (treeOK(x, zz, R)) addTree(x, zz, R);
    }
    // two giants flanking the root wheel: its frame and its scale reference
    for (const [x, z, R] of [[-33.5, 104, 3.5], [34.5, 97, 3.2]]) if (treeOK(x, z, R)) addTree(x, z, R);
    // the grove
    for (let i = 0; i < 3600 && trees.length < 160; i++) {
      const d = tr.range(-0.06, 1.12) * path.length, p = path.posAtDist(d), t = path.tangentAtDist(d), lat = tr.sign() * (9 + 165 * Math.pow(tr(), 1.35));
      const x = p.x - t.z * lat + tr.range(-6, 6), z = p.z + t.x * lat + tr.range(-6, 6), R = Math.abs(lat) < 40 ? tr.range(3.2, 4.6) : tr.range(2.55, 3.9);   // the giants beside the route are the fattest
      if (treeOK(x, z, R)) addTree(x, z, R);
      if (i % 30 === 29) await ctx.yield();
    }
    await ctx.yield();

    // ---------------- flora materials: one atlas; bark with deep furrows, ground cover that fades with distance
    const wind = flora.makeWind({ direction: [0.35, 0.9], strength: 0.55, speed: 0.7, gustiness: 0.6 });
    await ctx.yield();
    const treeMatOpts = { wind, backlight: 1.25, backlightTint: '#f0c890', wrap: 0.85, ambient: 2.3, leafAmbient: 1.35, detail: 0.6, detailScale: 1, barkBump: 0.9, sheen: 0.25 };
    if (flora.prepareLeafTexture) await flora.prepareLeafTexture(treeMatOpts, () => ctx.yield());      // the leaf atlas, drawn in short steps (in one piece it is a 60 ms stall)
    await ctx.yield();
    const matTree = flora.windMaterial(treeMatOpts);
    const atlas = matTree.map;
    await ctx.yield();
    const matCover = flora.windMaterial({ wind, map: atlas, fade: [78, 112], detail: 0, wrap: 0.5, backlight: 1.2, backlightTint: '#b8d47a', ambient: 1.8, leafAmbient: 1.35, sheen: 0.45 });
    const matFern = flora.windMaterial({ wind, map: atlas, fade: [100, 140], detail: 0, wrap: 0.5, backlight: 1.2, backlightTint: '#b8d47a', ambient: 1.8, leafAmbient: 1.35, sheen: 0.45 });
    const barkPal = { bark: '#6a4030', barkDark: '#22150f', barkLight: '#b07a58', leaf: '#263f2a', leafLight: '#6c8a4a', leafDark: '#0a1610' };
    const fr = rng.fork('flora');
    const GH = [[88, 0.040], [80, 0.043], [93, 0.037]];                                // height, girth (radius / height)
    // bare columns: the crowns start 58-64 % of the way up (see giantGeometry)
    const gSeed = Math.floor(fr() * 1e9), nearVar = [];
    for (let i = 0; i < GH.length; i++) {
      nearVar.push((await giantGeometry(gSeed + i * 17, { detail: 1, height: GH[i][0], girth: GH[i][1], flex: 0.35, ...barkPal }, 0.68 + 0.02 * i, false, () => ctx.yield())).geo);
      await ctx.yield();
    }
    await ctx.yield();
    const farVar = [(await giantGeometry(gSeed + 91, { detail: 0, height: GH[0][0], girth: GH[0][1], flex: 0.35, ...barkPal }, 0.78, true, () => ctx.yield())).geo];
    await ctx.yield();
    const treePts = [];
    for (const t of trees) {
      if (t.v < 0) continue;
      const [h, g] = GH[t.v], near = path.nearestXZ(t.x, t.z), s = t.R / (h * g);
      treePts.push({ x: t.x, y: sAt(t.x, t.z), z: t.z, s, rot: t.rot, d: near.dist, u: near.u, v: t.v });
    }
    const grove = flora.makeScatter({ rng: rng.fork('grove'), points: treePts, variants: nearVar, farVariants: farVar, farDistance: 72, material: matTree,
      chunks: 3, cullDistance: 520, sink: 0.03, tilt: 0.012, stretch: 0.12, tint: 0.16, hue: 0.04 });
    scene.add(grove.object);
    await ctx.yield();
    // the Elder Column: the kit tree carries the crown, its trunk is hidden inside a high-resolution fluted column
    const elderK = await giantGeometry(gSeed + 7, { detail: 2, height: 94, girth: elder.R / 94, flex: 0.3, ...barkPal }, 0.66, false, () => ctx.yield());
    await ctx.yield();
    const matElder = flora.windMaterial({ wind, map: atlas, backlight: 1.25, backlightTint: '#f0c890', wrap: 1.4, ambient: 3.1, leafAmbient: 1.4, detail: 0.75, detailScale: 1.6, barkBump: 2.0, sheen: 0.25 });
    const elderMesh = new THREE.Mesh(elderK.geo, matElder);
    elderMesh.position.set(elder.x, sAt(elder.x, elder.z) - 1.2, elder.z); elderMesh.name = 'elder-column';
    scene.add(elderMesh);
    await ctx.yield();
    const elderTrunk = new THREE.Mesh(elderTrunkGeometry({ height: 94, radius: elder.R, ridges: 26, phase: fr.range(0, 6), lean: elderK.lean, flex: 0.3 }, noise,
      { bark: C('#6a4030').multiplyScalar(0.66), barkDark: C('#1c120e').multiplyScalar(0.55), barkLight: C('#b07a58').multiplyScalar(0.74), moss: C(PALETTE[2]).multiplyScalar(0.8) }), matElder);
    elderTrunk.position.copy(elderMesh.position); elderTrunk.name = 'elder-trunk'; scene.add(elderTrunk);
    await ctx.yield();

    // long trunk shadows (blob streaks away from the sun) + the Giant's own
    // (giants further than 125 m from the route stand in fog and cast none; the sheets are built twenty casters at a time, since one call over all of them is a 180 ms step)
    const casters = [];
    for (const t of trees) if (path.nearestXZ(t.x, t.z).dist < 125) casters.push({ x: t.x, z: t.z, r: t.R * 1.35 });
    casters.sort((p, q) => q.z - p.z);
    casters.push({ x: -11, z: 62, r: 4 }, { x: 11, z: 62, r: 4 }, { x: 0, z: 30, r: 8 }, { x: 0, z: -10, r: 8 }, { x: 0, z: -45, r: 7 });
    const shadows = [];
    for (let i = 0; i < casters.length; i += 20) {
      const sh = flora.makeGroundShadows({ points: casters.slice(i, i + 20), heightAt: sAt, sunDir, strength: 0.4, color: '#1c2c18', size: 1.15, stretch: 5.5, lift: 0.16 });
      scene.add(sh.object); shadows.push(sh);
      await ctx.yield();
    }

    // ---------------- maples in yellow leaf: the colour notes, where light reaches the floor
    const mapleGold = hex(C('#e8b020').lerp(C('#d87018'), V.mapleRed)), mapleVar = [];
    for (let i = 0; i < 2; i++) {
      mapleVar.push(flora.mapleGeometry({ rng: fr, detail: 1, height: 11 + i * 3,
        leaf: i ? '#e2b324' : mapleGold, leafLight: '#ffe070', leafDark: '#8a5a12', gold: '#f2c838', crimson: hex(C('#d89a20').lerp(C('#c2501a'), V.mapleRed)), bark: '#3c3028', barkDark: '#1c1612' }));
      await ctx.yield();
    }
    await ctx.yield();
    const matMaple = flora.windMaterial({ wind, map: atlas, backlight: 1.2, backlightTint: '#ffe690', wrap: 0.85, ambient: 2.3, leafAmbient: 1.35, detail: 0.6, detailScale: 1, barkBump: 0.9, sheen: 0.25 });
    await ctx.yield();
    const maplePts = [], mr = rng.fork('maples');
    const mapleSpot = (x, z, s) => {
      const near = path.nearestXZ(x, z);
      if (maplePts.length && blocksDeer(x, z, 6 * s)) return false;
      if (near.dist < 12 || dCreek(x, z) < 5 || (Math.abs(x) < 24 && z > -74 && z < 84)) return false;
      for (const t of trees) if (Math.hypot(x - t.x, z - t.z) < t.R * RB + 5) return false;
      for (const q of maplePts) if (Math.hypot(x - q.x, z - q.z) < 12) return false;
      maplePts.push({ x, y: sAt(x, z), z, s, rot: mr.range(0, TAU), d: near.dist, u: near.u, v: mr.int(0, 1) }); return true;
    };
    { const ox = glade.x - gp.x, oz = glade.z - gp.z, ol = Math.hypot(ox, oz), a = mr.range(8, 12) * mr.sign(); mapleSpot(glade.x + ox / ol * 15 - oz / ol * a, glade.z + oz / ol * 15 + ox / ol * a, 1.5); }   // one just beyond the deer
    // one gold maple ahead-left of the entry axis (the orange note in the view through the previous portal), one at the foot of the leaning snag
    for (const [dz, lat] of [[40, 12.5], [34, 13], [46, 13], [52, 14], [28, 13.5]]) { const z = path.start.z - dz; if (mapleSpot(pathX(z) - lat, z, 1.25)) break; }
    for (const [a, b] of [[4, 5], [-2, 6], [6, -5], [0, -7]]) if (mapleSpot(snag.ax + a, snag.az + b, 1.1)) break;
    // scale cues: small maples (11-14 m) right at the feet of the avenue giants
    for (let i = 1, n = 0; i < Math.min(trees.length, 18) && n < 6; i += 2) {
      const t = trees[i], near = path.nearestXZ(t.x, t.z), p = path.pointAt(near.u), ox = t.x - p.x, oz = t.z - p.z, ol = Math.hypot(ox, oz) || 1, d0 = t.R * RB + 5.5;
      for (const [a, b] of [[0.3, -0.95], [0.75, -0.66], [1, 0], [0.75, 0.66]]) {
        if (mapleSpot(t.x + (ox / ol * a - oz / ol * b) * d0, t.z + (oz / ol * a + ox / ol * b) * d0, mr.range(0.95, 1.2))) { n++; break; }
      }
    }
    const mapleMax = maplePts.length + V.maples - 1;
    for (let i = 0; i < 400 && maplePts.length < mapleMax; i++) {
      const d = mr.range(0.02, 0.86) * path.length, p = path.posAtDist(d), t = path.tangentAtDist(d), lat = mr.sign() * mr.range(13, 46);
      mapleSpot(p.x - t.z * lat, p.z + t.x * lat, mr.range(1.0, 1.7));
    }
    await ctx.yield();
    const maples = flora.makeScatter({ rng: rng.fork('maple'), points: maplePts, variants: mapleVar, material: matMaple, sink: 0.02, tint: 0.14, hue: 0.05, shade: shadows });
    scene.add(maples.object);
    await ctx.yield();

    // ---------------- ground cover: sword ferns and a carpet of sorrel
    const inGiant = (x, z) => Math.abs(x) < 8.2 && z > -62 && z < 66;
    const coverDensity = (x, z) => (inGiant(x, z) ? 0 : dCreek(x, z) < creekW(z) * 0.5 - 0.4 ? 0 : 1 - 0.7 * trailK(x, z, 0.5));      // ferns root on the bank and overhang the water
    const offPath = (x, z) => (path.nearestXZ(x, z).dist < 3.2 ? 0 : 1);                 // no frond ever reaches the lens
    const fernDensity = (x, z) => coverDensity(x, z) * offPath(x, z) * (Math.hypot(x - glade.x, z - glade.z) < 13 ? 0 : blocksDeer(x, z, 4) ? 0.8 : 1);
    await ctx.yield();
    const fernVar = [];
    for (let i = 0; i < 2; i++) { fernVar.push(flora.fernGeometry({ rng: fr, size: 1.25 + i * 0.2, fronds: 9 + i, detail: 1, leaf: i ? '#4f8038' : '#5c8c40', leafLight: i ? '#8fae58' : '#a4b860', leafDark: '#16301c' })); await ctx.yield(); }
    await ctx.yield();
    const ferns = flora.makeScatter({ rng: rng.fork('fern'), path, heightAt: hAt, material: matFern, variants: fernVar, count: 1100, radius: 80, corridor: 0, clear: 0, falloff: 0.5,
      scale: [1.3, 2.2], sink: 0.02, tilt: 0.14, chunks: 4, cullDistance: 140, tint: 0.2, hue: 0.05, density: fernDensity, shade: shadows });
    scene.add(ferns.object);
    await ctx.yield();
    // low ferns: knee-high, so they can carpet the deer's sight lines and the knoll's foot without hiding the herd
    const lowFerns = flora.makeScatter({ rng: rng.fork('fernL'), path, heightAt: hAt, material: matFern, variants: fernVar, count: 400, radius: 30, corridor: 0, clear: 0, falloff: 0.3,
      scale: [0.6, 1.1], sink: 0.02, tilt: 0.14, chunks: 2, cullDistance: 110, tint: 0.2, hue: 0.05, density: (x, z) => coverDensity(x, z) * offPath(x, z) * (Math.hypot(x - glade.x, z - glade.z) < 7 ? 0 : 1), shade: shadows });
    scene.add(lowFerns.object);
    await ctx.yield();
    // a ring of ferns at the butt of every giant near the route: the trunks rise out of green, not out of bare duff
    const buttPts = [], br = rng.fork('butts');
    for (const t of trees) {
      const near = path.nearestXZ(t.x, t.z); if (near.dist > 46) continue;
      const n = t.v < 0 ? 9 : 5, a0 = br.range(0, TAU);
      for (let k = 0; k < n; k++) {
        const a = a0 + (k / n) * TAU + br.range(-0.3, 0.3), r = t.R * RB * br.range(0.92, 1.25), x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
        if (!offPath(x, z) || !coverDensity(x, z) || Math.hypot(x - glade.x, z - glade.z) < 13) continue;
        buttPts.push({ x, y: hAt(x, z), z, s: br.range(1.2, 2.0), rot: br.range(0, TAU), d: near.dist, u: near.u, v: br.int(0, 1) });
      }
    }
    const buttFerns = flora.makeScatter({ rng: rng.fork('fernB'), points: buttPts, material: matFern, variants: fernVar, sink: 0.02, tilt: 0.14, chunks: 2, cullDistance: 140, tint: 0.2, hue: 0.05, shade: shadows });
    scene.add(buttFerns.object);
    await ctx.yield();
    const sorrelOpts = { rng: rng.fork('sorrel'), path, heightAt: hAt, material: matCover, wind, fade: [78, 112], count: Math.round(6000 * (ctx.quality ? ctx.quality.detail : 1)), radius: 26, bias: 1.2, chunks: 4,
      width: [1.8, 3.0], height: [0.35, 0.8], root: '#35582a', tip: '#9ab85c', dryAmount: 0.08, dry: '#a89a48', tint: 0.18,
      flowers: 0, density: coverDensity, shade: shadows, heightStep: 3.5 };
    const sorrel = flora.makeGrassAsync ? await flora.makeGrassAsync(sorrelOpts, () => ctx.yield()) : flora.makeGrass(sorrelOpts);
    scene.add(sorrel.object);
    await ctx.yield();

    // ---------------- mossy boulders along the creek and smaller fallen logs under moss
    const rockMat = T.makeRockMaterial({ terrain: land, strata: 0.15, top: hex(cMoss), topAmount: 0.9, topSlope: [0.35, 0.8], contact: [0.5, 0.55, -0.2] });
    await ctx.yield();
    const spots = T.scatter({ rng: rng.fork('rocks'), terrain: land, path, count: 170, band: [2, 30], clearance: 4.5, scale: [0.5, 2.3], sink: 0.35,
      density: (x, z) => { const dc = dCreek(x, z), hw = creekW(z) * 0.5; return inGiant(x, z) ? 0 : Math.abs(dc - hw) < 1.3 ? 1 : dc < 7 ? 0.3 : 0.06; } });
    await ctx.yield();
    // stones in and beside the water: they break the creek's edge and stand dark in the sheen
    const stones = T.scatter({ rng: rng.fork('stones'), terrain: land, path, count: 160, band: [0, 12], clearance: 0, scale: [0.35, 1.2], sink: 0.4, slope: [0.2, 1],
      density: (x, z) => { const dc = dCreek(x, z), hw = creekW(z) * 0.5; return z < 200 || inGiant(x, z) ? 0 : Math.abs(dc - hw) < 1 ? 1 : dc < hw ? 0.25 : 0; } });
    await ctx.yield();
    const spotsFar = T.scatter({ rng: rng.fork('rocksFar'), terrain: land, path, count: 60, band: [30, 80], clearance: 4.5, scale: [0.9, 3.2], sink: 0.4,
      density: (x, z) => (Math.abs(x) < 26 && z < 90 ? 0 : 1) });
    await ctx.yield();
    const rocks = T.makeInstances(T.rockGeometry({ rng: rng.fork('rockg'), kind: 'boulder', color: '#6c675a', colorB: '#4e4a40' }), rockMat, spots,
      { lod: T.rockGeometry({ rng: rng.fork('rockl'), kind: 'boulder', detail: 1, color: '#6c675a', colorB: '#4e4a40' }), path, tints: ['#ffffff', '#d8d2c0', '#b8c0a8'] });
    scene.add(rocks.object);
    await ctx.yield();
    if (spotsFar.count) scene.add(T.makeInstances(T.rockGeometry({ rng: rng.fork('rockf'), kind: 'boulder', detail: 1, color: '#6c675a', colorB: '#4e4a40' }), rockMat, spotsFar, { tints: ['#ffffff', '#d8d2c0', '#b8c0a8'] }).object);
    await ctx.yield();
    if (stones.count) scene.add(T.makeInstances(T.rockGeometry({ rng: rng.fork('stoneg'), kind: 'boulder', detail: 1, color: '#5c5a50', colorB: '#3e3c34' }), rockMat, stones, { tints: ['#ffffff', '#cfcabb', '#aab49c'] }).object);
    await ctx.yield();
    if (land.addContact) for (let i = 0; i < spots.count; i += 16) {                    // contact shadows, sixteen boulders at a time (one call over all of them is a 200 ms step)
      const part = []; for (let k = i; k < Math.min(spots.count, i + 16); k++) part.push([spots.positions[k * 3], spots.positions[k * 3 + 2], spots.scales[k]]);
      land.addContact(part); await ctx.yield();
    }
    await ctx.yield();
    const lr = rng.fork('logs'), logs = [];
    for (let i = 0; i < 900 && logs.length < 26; i++) {
      // the first seven lie on the glade side of the route at the deer beat (near-parallel to it), so that stretch of floor is never bare
      const gl = logs.length < 7 && i < 260, d = (gl ? lr.range(0.32, 0.5) : lr.range(0.03, 0.8)) * path.length, p = path.posAtDist(d), t = path.tangentAtDist(d);
      const lat = gl ? -lr.range(11, 18) : lr.sign() * (logs.length < 13 ? lr.range(13, 34) : lr.range(26, 82));
      const x = p.x - t.z * lat, z = p.z + t.x * lat, len = gl ? lr.range(9, 17) : lr.range(13, 30), r = gl ? lr.range(0.6, 1.1) : lr.range(0.7, 1.7), yaw = gl ? Math.atan2(t.z, t.x) + lr.range(-0.45, 0.45) : lr.range(0, Math.PI);
      let ok = Math.hypot(x - glade.x, z - glade.z) > (gl ? 16 : 22) && !(Math.abs(x) < 30 && z < 90);
      if (gl) for (const q of logs) if (Math.hypot(x - q.x, z - q.z) < 9) ok = false;
      for (let k = -1; k <= 1 && ok; k++) {
        const ex = x + Math.cos(yaw) * len * 0.5 * k, ez = z + Math.sin(yaw) * len * 0.5 * k;
        if (path.nearestXZ(ex, ez).dist < 9 + r || dCreek(ex, ez) < 4) ok = false;
        for (const tt of trees) if (Math.hypot(ex - tt.x, ez - tt.z) < tt.R * RB + r) { ok = false; break; }
      }
      if (ok) logs.push({ x, z, len, r, yaw, y: sAt });
      if (i % 60 === 59) await ctx.yield();
    }
    await ctx.yield();
    if (logs.length) {
      const logMesh = new THREE.Mesh(fallenLogsGeometry(logs, lr, noise, { bark: C('#5a3423'), barkDark: C('#2a1810'), moss: cMoss.clone().multiplyScalar(0.9), heart: C('#8a6a48') }),
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }));
      logMesh.name = 'fallen-logs'; scene.add(logMesh);
    }
    await ctx.yield();
    // the leaning snag, dressed for its close pass: bark column in the giants' own material, lichen swaying from its underside
    const snagG = snagGeometry(snag, rng.fork('snag'), noise, { bark: C('#6a4030').multiplyScalar(0.66), barkDark: C('#1c120e').multiplyScalar(0.55), barkLight: C('#b07a58').multiplyScalar(0.74),
      moss: cMoss.clone().multiplyScalar(0.4), heart: C('#8a6a48').multiplyScalar(0.7) });
    const snagMesh = new THREE.Mesh(snagG.geo, matElder); snagMesh.name = 'snag'; scene.add(snagMesh);
    await ctx.yield();
    {
      const P = [], Q = [], I = [], lr2 = rng.fork('lichen'); let cnt = 0;
      for (const h of snagG.hang) {
        const len = lr2.range(1.1, 3.1), wd = lr2.range(0.22, 0.5), yaw = lr2.range(0, Math.PI), cx = Math.cos(yaw), cz = Math.sin(yaw), ph = lr2.range(0, 6.28), tone = lr2.range(0.6, 1.1), SEG = 5;
        for (let k = 0; k <= SEG; k++) for (const e of [-1, 1]) { const t = k / SEG, ww = wd * (1 - 0.75 * t) * e; P.push(h[0] + cx * ww, h[1] - len * t + 0.15, h[2] + cz * ww); Q.push(t, e, ph, tone); }
        for (let k = 0; k < SEG; k++) { const a = cnt + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        cnt += (SEG + 1) * 2;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4)); g.setIndex(I);
      const lichenMat = new THREE.ShaderMaterial({
        side: THREE.DoubleSide, fog: true,
        uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uTime: time, uLo: { value: C('#2c3a22') }, uHi: { value: C('#a4b078').lerp(fogHi, 0.3) } }),
        vertexShader: /* glsl */`attribute vec4 aQ; uniform float uTime; varying vec4 vQ;
          #include <fog_pars_vertex>
          void main(){ vQ = aQ; vec3 p = position; float s = aQ.x * aQ.x;
            p.x += s * (.55 * sin(uTime * .9 + aQ.z) + .2 * sin(uTime * 2.3 + aQ.z * 3.)); p.z += s * .45 * cos(uTime * .7 + aQ.z * 1.7);
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uLo, uHi; varying vec4 vQ;
          #include <fog_pars_fragment>
          void main(){ float t = clamp(vQ.x, 0., 1.), x = abs(vQ.y);
            float rag = .5 + .5 * sin(t * 37. + vQ.z * 5.) * sin(t * 13. + vQ.z);                       // a ragged, stringy edge
            if (x > .35 + .6 * rag * (1. - .5 * t)) discard;
            vec3 col = mix(uLo, uHi, (.25 + .75 * t) * (1. - .5 * x)) * vQ.w * .75;
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      const lichen = new THREE.Mesh(g, lichenMat); lichen.name = 'snag-lichen'; scene.add(lichen);
    }
    await ctx.yield();

    // ---------------- the canopy: every giant carries a ragged crown disc 62-74 m up (low enough to close the top of a level frame). The discs are baked into one mask
    // texture (R: lower tier, G: upper tier) laid over the grove, so foliage sits over trunks and the gaps between
    // crowns are bright sky; near-black green underneath, a thin translucent rim where the sun comes through.
    const CM = { x0: -290, z0: -240, x1: 290, z1: 710, w: 192, h: 315 };   // 3 m texels: the shader's needle-spray noise carries the finer edge
    const cmData = new Uint8Array(CM.w * CM.h * 4), cr = rng.fork('crowns');
    {
      const sx = CM.w / (CM.x1 - CM.x0), sz = CM.h / (CM.z1 - CM.z0);
      const splat = (cx, cz, rc, ch, nb, ph) => {
        const i0 = Math.max(0, Math.floor((cx - rc * 1.3 - CM.x0) * sx)), i1 = Math.min(CM.w - 1, Math.ceil((cx + rc * 1.3 - CM.x0) * sx));
        const j0 = Math.max(0, Math.floor((cz - rc * 1.3 - CM.z0) * sz)), j1 = Math.min(CM.h - 1, Math.ceil((cz + rc * 1.3 - CM.z0) * sz));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const dx = CM.x0 + (i + 0.5) / sx - cx, dz = CM.z0 + (j + 0.5) / sz - cz, d = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
          const lobes = Math.pow(Math.abs(Math.sin(a * nb * 0.5 + ph)), 0.7);                        // boughs radiating from the trunk
          const r = rc * (0.74 + 0.3 * lobes + 0.1 * Math.sin(a * 3 + ph * 2.1) + 0.07 * Math.sin(a * 17 + ph * 3.3));
          const v = Math.round(255 * clamp(1 - d / r, 0, 1) ** 0.6), k = (j * CM.w + i) * 4 + ch;
          if (v > cmData[k]) cmData[k] = v;
        }
      };
      let nSplat = 0;
      for (const t of trees) {
        const rc = 8.5 + t.R * 2.9;                                                                  // 14.5-20 m
        splat(t.x + cr.range(-2, 2), t.z + cr.range(-2, 2), rc * cr.range(0.92, 1.12), 0, cr.int(7, 11), cr.range(0, TAU));
        splat(t.x + cr.range(-3, 3), t.z + cr.range(-3, 3), rc * cr.range(0.55, 0.75), 1, cr.int(6, 9), cr.range(0, TAU));
        if (++nSplat % 4 === 0) await ctx.yield();
      }
      // boughs reaching in over the Giant's clearing from the trees around it, so the ceiling closes above the root wheel too
      for (const [x, z, rc] of [[-21, 152, 17], [23, 141, 16], [-31, 66, 17], [31, 58, 16], [-13, 22, 15], [15, 8, 16], [-2, -34, 17], [-22, -56, 15], [4, 104, 13]]) {
        splat(x + cr.range(-3, 3), z + cr.range(-3, 3), rc * cr.range(0.9, 1.1), 0, cr.int(7, 11), cr.range(0, TAU));
        splat(x + cr.range(-4, 4), z + cr.range(-4, 4), rc * cr.range(0.5, 0.7), 1, cr.int(6, 9), cr.range(0, TAU));
      }
      await ctx.yield();
    }
    const crownTex = new THREE.DataTexture(cmData, CM.w, CM.h, THREE.RGBAFormat);
    crownTex.magFilter = THREE.LinearFilter; crownTex.minFilter = THREE.LinearFilter; crownTex.needsUpdate = true;
    await ctx.yield();
    const canopyGeo = new THREE.BufferGeometry();
    {
      const S = 420, P = [], Ly = [];
      for (const [y, l] of [[74, 1], [62, 0]]) { P.push(-S, y, -S, S, y, -S, S, y, S, -S, y, -S, S, y, S, -S, y, S); for (let i = 0; i < 6; i++) Ly.push(l); }
      canopyGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); canopyGeo.setAttribute('layer', new THREE.Float32BufferAttribute(Ly, 1));
    }
    const canopyMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: time, uMask: { value: crownTex }, uBox: { value: new THREE.Vector4(CM.x0, CM.z0, 1 / (CM.x1 - CM.x0), 1 / (CM.z1 - CM.z0)) },
        uDark: { value: C('#070e09') }, uMid: { value: C(PALETTE[3]).lerp(C('#0c1a12'), 0.45) }, uLit: { value: C('#a2b04c').lerp(gold, 0.2).multiplyScalar(0.5) }, uSun: { value: sunDir },
        uFogCol: { value: fogCol.clone() }, uFogHi: { value: fogHi.clone() }, uFogD: { value: V.fog }, uCover: { value: V.canopy } },
      vertexShader: /* glsl */`attribute float layer; varying vec3 vW; varying float vL;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vL = layer; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`uniform sampler2D uMask; uniform vec4 uBox; uniform float uTime, uFogD, uCover; uniform vec3 uDark, uMid, uLit, uSun, uFogCol, uFogHi; varying vec3 vW; varying float vL;
        float h2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }
        void main(){
          vec3 dv = vW - cameraPosition; float d = length(dv); vec3 Vd = dv / d;
          float fade = 1. - smoothstep(220., 420., length(dv.xz)); if (fade < .01) discard;
          vec2 p = vW.xz + .5 * vec2(sin(uTime * .45 + vW.z * .06 + vL * 2.), cos(uTime * .37 + vW.x * .06));   // boughs breathing in the wind
          vec2 uv = (p - uBox.xy) * uBox.zw;
          vec4 m = texture2D(uMask, uv); float c = mix(m.r, m.g, vL);
          c *= step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.);
          float spray = vn(p * .55 + vL * 9.) * .55 + vn(p * 1.9 + 3.) * .3 + vn(p * 5.3 + uTime * .05) * .15;      // needle sprays breaking the rim
          float holes = vn(p * .16 + vL * 5.);                                                          // lighter windows inside a crown
          float cc = c - (spray - .5) * .34 * smoothstep(.55, .0, c) - smoothstep(.62, .82, holes) * .22 * (1. - uCover);
          float a = smoothstep(.02, .27, cc);                                                            // a feathered rim of needles, not a paper cut
          if (a < .02) discard;
          float edge = 1. - smoothstep(.1, .42, cc);
          float toSun = pow(max(dot(Vd, uSun), 0.), 2.5);
          vec3 col = mix(uDark, uMid, .15 + .45 * spray);
          col = mix(col, uLit, edge * (.3 + 1.1 * toSun) * (.3 + .9 * spray));
          col *= .8 + .35 * vL;
          float sunward = smoothstep(-.2, .7, dot(normalize(dv.xz + 1e-4), normalize(uSun.xz + 1e-4)));
          float gap = smoothstep(.52, .8, vn(p * .3 + 11. + vL * 3.) * .65 + vn(p * 1.05 + 5.) * .35);     // back-lit foliage: soft bright windows on the sun side
          col = mix(col, uFogHi * 1.1, .35 * gap * (.25 + .75 * sunward));
          float f = 1. - exp(-uFogD * uFogD * d * d * .3);
          col = mix(col, mix(uFogCol, uFogHi * 1.5, toSun), f);                                         // the far ceiling dissolves into the light it stands against
          a *= 1. - .8 * smoothstep(.9, .995, dot(Vd, uSun));                                           // the sun burns a hole through the far boughs
          gl_FragColor = vec4(col, a * fade);
        }`,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.frustumCulled = false; canopy.renderOrder = -0.5; canopy.name = 'canopy'; scene.add(canopy);
    await ctx.yield();

    // extra sword ferns banked around the Giant's approach so the last straight is never bare
    const heroFerns = flora.makeScatter({ rng: rng.fork('fernH'), bounds: [-52, 40, 52, 205], heightAt: hAt, material: matFern, variants: fernVar, count: 400, corridor: 0, clear: 0, falloff: 0,
      scale: [1.3, 2.2], sink: 0.02, tilt: 0.14, chunks: 1, cullDistance: 150, tint: 0.2, hue: 0.05, density: (x, z) => offPath(x, z) * (z > 62.5 && z < 74 && Math.abs(x) < 10 ? 1 : coverDensity(x, z) * (Math.abs(x) < 9 && z < 62.5 ? 0 : 1)), shade: shadows });
    scene.add(heroFerns.object);
    await ctx.yield();
    // the apron in front of the mouth: tall ferns that catch the gold spilling out of the bore
    const apronFerns = flora.makeScatter({ rng: rng.fork('fernA'), bounds: [-16, 66, 16, 90], heightAt: hAt, material: matFern, variants: fernVar, count: 150, corridor: 0, clear: 0, falloff: 0,
      scale: [1.5, 2.6], sink: 0.02, tilt: 0.14, chunks: 1, cullDistance: 150, tint: 0.2, hue: 0.05, density: (x, z) => (Math.abs(x) < 3.4 ? 0 : 1), shade: shadows });
    scene.add(apronFerns.object);
    await ctx.yield();

    // ---------------- atmosphere
    const set = fx.fxGroup(); scene.add(set.object);
    // glow veils: additive sprites hung between the camera and the sun at three depths. Trunks nearer than a
    // veil stay dark; everything behind it is washed in light, like fog scattering forward.
    const VEIL = [[58, 0.5], [118, 0.8], [215, 1.15]];
    await ctx.yield();
    const veils = fx.makeGlows({ positions: VEIL.map(() => [0, 40, 0]), sizes: VEIL.map((v) => v[0] * 1.15), size: 1, color: hex(gold.clone().lerp(fogHi, 0.55)), intensity: 0.07,
      halo: 1, core: 0.25, near: [0.01, 0.05], fogAmount: 0, depthBias: 0, minAngle: 0, time, renderOrder: 5 });
    veils.object.frustumCulled = false; scene.add(veils.object);
    // crepuscular shafts: bundles parallel to the sun, hung beside the route
    const shaftCol = hex(gold.clone().lerp(C('#fff2cc'), 0.45)), gr = rng.fork('rays'), rayDir = [-sunDir.x, -sunDir.y, -sunDir.z];
    const rays = [];
    const shaftAt = (x, y, z, o = {}) => {
      const L = o.length ?? 150;
      rays.push(set.add(fx.makeGodRays({ rng: gr, time, position: [x + sunDir.x * L, y + sunDir.y * L, z + sunDir.z * L], direction: rayDir, radius: o.radius ?? 16, count: o.count ?? 6, length: L * 1.04,
        width: o.width ?? [2.5, 7], color: shaftCol, intensity: o.intensity ?? 1.15, falloff: 0.5, speed: o.speed ?? 0.6, far: [170, 290], fogAmount: 0.15 })));
    };
    for (const [u, lat, n] of [[0.07, -17, 6], [0.13, 20, 5], [0.24, -22, 5], [0.36, 24, 5], [0.54, -20, 5], [0.60, 26, 5], [0.72, -24, 5], [0.80, 25, 4]]) {
      const p = path.pointAt(u), t = path.tangentAt(u), x = p.x - t.z * lat, z = p.z + t.x * lat;
      shaftAt(x, hAt(x, z) + 1, z, { count: n, radius: 13 });
    }
    // one bundle across the entry axis 40-80 m ahead of the first frame (and of the view through the previous portal)
    { const p = path.pointAt(0.06), t = path.tangentAt(0.06), x = p.x + t.z * 8, z = p.z - t.x * 8; shaftAt(x, hAt(x, z) + 1, z, { count: 6, radius: 7, intensity: 1.9, length: 140 }); }
    // more bundles on the sun side of the route, close enough that they cross the frame
    const gAway = [glade.x - gp.x, glade.z - gp.z].map((v, i, a) => v / Math.hypot(a[0], a[1]));       // from the path to the glade: lights go BEHIND the deer
    const sunSide = sunH.x < 0 ? -1 : 1;                                                 // the side of the route the sun stands on (the camera flies toward -Z, so +lat is +X)
    for (const u of [0.03, 0.18, 0.29, 0.51, 0.66, 0.76]) {
      const p = path.pointAt(u), t = path.tangentAt(u), lat = sunSide * gr.range(10, 14), x = p.x - t.z * lat, z = p.z + t.x * lat;
      shaftAt(x, hAt(x, z) + 1, z, { count: 4, radius: 9, length: 135 });
    }
    shaftAt(glade.x + gAway[0] * 10, glade.y + 0.5, glade.z + gAway[1] * 10, { count: 8, radius: 5, intensity: 1.25, width: [1.6, 5.5], length: 130, speed: 1.0 });        // the deer's light
    await ctx.yield();
    const rayBase = rays.map((r) => r.uniforms.uIntensity.value);
    const gladeGlow = fx.makeGlows({ positions: [[glade.x + gAway[0] * 8 + sunH.x * 3, glade.y + 4, glade.z + gAway[1] * 8 + sunH.z * 3]], sizes: [36], size: 1, color: hex(gold.clone().lerp(fogHi, 0.4)), intensity: 0.35,
      halo: 1, core: 0.2, near: [0.01, 0.05], fogAmount: 0.2, depthBias: 0, minAngle: 0, time, renderOrder: 5 });
    scene.add(gladeGlow.object);
    // ground fog hugging the floor, mist drifting through the shafts. The fog sheet is far coarser than the trench under
    // the Giant, so there it rides a floor with the hollow filled (otherwise it cuts the trench as a pale slab); it also stays
    // at the foot of the deer's knoll, so the herd stands above the bright fog as dark silhouettes
    const hFog = (x, z) => { const h = hAt(x, z) - 4.2 * smoothstep(30, 7, Math.hypot(x - glade.x, z - glade.z)); return z < 104 && z > -64 && Math.abs(x) < 16 ? Math.max(h, 0.4) : h; };
    const gfog = set.add(fx.makeGroundFog({ rng: rng.fork('fog'), time, layers: 5, size: 760, center: [0, 0, 232], y: 0, height: 6.5, color: hex(fogHi), opacity: 0.15 * V.mist, soft: 9, softGround: 8, coverage: 0.56, scale: 0.016,
      wind: [0.5, 1.1], sunDir, sunColor: hex(keyCol), scatter: 0.7, heightAt: hFog, mode: 'hug', lift: 0.35, segments: 40, near: [10, 34] }));
    const gfogBase = gfog.uniforms.uOpacity.value;
    let mistFU = null, mistFBase = 0;
    await ctx.yield();
    const mistPos = [], mrng = rng.fork('mist');
    for (let i = 0; i < 64; i++) {
      const d = mrng.range(0, 0.86) * path.length, p = path.posAtDist(d), t = path.tangentAtDist(d), lat = mrng.sign() * mrng.range(24, 70), x = p.x - t.z * lat, z = p.z + t.x * lat;
      if (Math.abs(x) < 42 && z < 135) continue;                                        // no flat puffs across the root wheel (one read as a pale slab under the mouth)
      mistPos.push([x, hAt(x, z) + mrng.range(2, 9), z]);
    }
    set.add(fx.makeMist({ rng: rng.fork('mistp'), time, positions: mistPos, size: [16, 34], color: hex(fogHi), opacity: 0.085 * V.mist, drift: [0.35, 0, 0.8] }));
    const mistF = set.add(fx.makeMist({ rng: rng.fork('mistd'), time, follow: true, count: 46, area: [250, 8, 250], center: [0, 6.5, 0], size: [12, 22], color: hex(fogHi), opacity: 0.048 * V.mist, drift: [0.45, 0, 1.1] }));
    if (mistF && mistF.uniforms && mistF.uniforms.uOpacity) { mistFU = mistF.uniforms.uOpacity; mistFBase = mistFU.value; }

    await ctx.yield();
    // ---------------- particles: motes in the light, falling needles, clouds of midges
    const motes = set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'pollen', time, count: 1700, colors: [hex(gold), '#fff0c0', hex(keyCol)], size: [0.03, 0.09] }));
    set.add(fx.makeParticles({ rng: rng.fork('needles'), preset: 'leaves', time, count: Math.round(520 * V.needles), colors: ['#8a5a26', '#b08230', '#5c6a2e'], size: [0.07, 0.17], aspect: 0.28, velocity: [0.45, -1.05, 0.7], velocityRandom: [0.5, 0.4, 0.5], lightDir: [sunDir.x, sunDir.y, sunDir.z] }));
    await ctx.yield();
    const midgeAt = [];
    for (const [u, lat] of [[0.1, 10], [0.2, -11], [0.33, -12], [0.41, -13], [0.52, 11], [0.6, -10], [0.7, 10], [0.79, -9.5]]) {
      const p = path.pointAt(u), t = path.tangentAt(u), x = p.x - t.z * lat, z = p.z + t.x * lat;
      midgeAt.push([x, Math.max(hAt(x, z) + 2.5, p.y - 2.5), z]);
    }
    for (const c of midgeAt) {
      set.add(fx.makeParticles({ rng: rng.fork('midge' + c[2].toFixed(0)), preset: 'dust', time, follow: false, center: c, box: [7, 5, 7], count: 210, size: [0.035, 0.07],
        velocity: [0, 0, 0], velocityRandom: [0.35, 0.25, 0.35], turbulence: [1.5, 1.1, 1.3], colors: ['#fff4cc', hex(gold), '#ffe9a8'], intensity: 2.4 }));
    }
    await ctx.yield();
    // sparks lifting off the ember cracks inside the bore
    set.add(fx.makeParticles({ rng: rng.fork('sparks'), preset: 'embers', time, follow: false, center: [0, A.axis.axisY - 0.5, 22], box: [9, 8, 74], count: 600, size: [0.03, 0.08],
      velocity: [0, 0.35, 0.25], velocityRandom: [0.25, 0.3, 0.3] }));
    await ctx.yield();

    // ---------------- fauna: stag and does in the light, the owl, midges' bigger cousins
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const deerLook = { coat: '#3a2618', belly: '#5a4630', legs: '#2c1c12', sock: '#241810', accent: '#8a7a60', horn: '#b0a080', pattern: 'none' };
    await ctx.yield();
    const deerGeo = F.quadrupedGeometry({ ...F.HERD_PRESETS.deer, ...deerLook });
    const stag = fauna.add(F.makeHerd({ rng: rng.fork('stag'), species: 'deer', geometry: deerGeo, count: 1, size: 3.6, varieties: 1, heightAt: sAt, center: [glade.x - sunH.x * 2, 0, glade.z - sunH.z * 2], radius: 2.5,
      roam: 0.45, pause: 0.3, speed: 0.5, rim: 1.0, fill: 0.05, shadowOpacity: 0.5, ...deerLook }), { always: true });
    await ctx.yield();
    const doeSizes = [2.4, 2.25, 2.3]; if (V.fawn) doeSizes[V.does - 1] = 1.1;
    const does = fauna.add(F.makeHerd({ rng: rng.fork('does'), species: 'deer', geometry: deerGeo, count: V.does, sizes: doeSizes.slice(0, V.does), size: 1, varieties: 0, heightAt: sAt,
      center: [glade.x + sunH.x * 2.5, 0, glade.z + sunH.z * 2.5], radius: 3, roam: 0.2, pause: 0.26, speed: 0.55, rim: 1.0, fill: 0.05, shadowOpacity: 0.5, ...deerLook }), { always: true });
    const grazeBase = [stag.uniforms.uGraze ? stag.uniforms.uGraze.value : 0, does.uniforms.uGraze ? does.uniforms.uGraze.value : 0];
    await ctx.yield();
    // breath: small bright puffs at head height in the shaft
    const breath = [];
    for (let i = 0; i < 2; i++) breath.push([glade.x - sunH.x * 2 - gAway[0] * (1.2 + i * 0.8) + rng.range(-0.6, 0.6), glade.y + 3.9 + i * 0.35, glade.z - sunH.z * 2 - gAway[1] * (1.2 + i * 0.8) + rng.range(-0.6, 0.6)]);   // in front of the stag's head, toward the path, against the dark trunk wall
    for (let i = 0; i < 3; i++) breath.push([glade.x + sunH.x * 2.5 + rng.range(-2.5, 2.5), glade.y + rng.range(2.6, 3.3), glade.z + sunH.z * 2.5 + rng.range(-2.5, 2.5)]);                               // the does
    set.add(fx.makeMist({ rng: rng.fork('breath'), time, positions: breath, size: [2.2, 3.4], color: '#fff3d2', opacity: 0.8, drift: [0.25, 0.12, 0.3] }));
    // midges and butterflies turning in the deer's shaft of light
    set.add(fx.makeParticles({ rng: rng.fork('midgeDeer'), preset: 'dust', time, follow: false, center: [glade.x + gAway[0] * 3, glade.y + 5, glade.z + gAway[1] * 3], box: [9, 6, 9], count: 150, size: [0.05, 0.1],
      velocity: [0, 0, 0], velocityRandom: [0.4, 0.3, 0.4], turbulence: [1.6, 1.2, 1.4], colors: ['#fff4cc', hex(gold), '#ffe9a8'], intensity: 2.6 }));
    // a glow behind the top of the root wheel, so the sunburst of roots separates from the fog
    const wtop = A.wheelTop && (A.wheelTop.position || A.wheelTop), wheelGlow = fx.makeGlows({ positions: [[0, (wtop ? wtop.y : 20) - 4, 60 - 8]], sizes: [60], size: 1, color: hex(gold.clone().lerp(fogHi, 0.5)), intensity: 0.8,
      halo: 1, core: 0.2, near: [0.01, 0.05], fogAmount: 0.15, depthBias: 0, minAngle: 0, time, renderOrder: 2 });
    scene.add(wheelGlow.object);
    // and a low one in front of the mouth, so the apron ferns stand in gold
    const apronGlow = fx.makeGlows({ positions: [[0, 1.2, 74]], sizes: [22], size: 1, color: hex(gold.clone().lerp(fogHi, 0.3)), intensity: 0.22,
      halo: 1, core: 0.2, near: [0.01, 0.05], fogAmount: 0.15, depthBias: 0, minAngle: 0, time, renderOrder: 2 });
    scene.add(apronGlow.object);

    await ctx.yield();
    // the owl: leaves the highest root of the wheel as the camera lines up, sinks to 9 m over the path, passes overhead
    const perch = A.owlPerch.position, OWL_U = 0.70, OWL_LEAD = 22;
    const owlMid = path.posAtDist(OWL_U * path.length + OWL_LEAD);
    const owl = fauna.add(F.makeFlock({ rng: rng.fork('owl'), species: 'eagles', form: 'loose', count: 1, size: 1.55, speed: 15, spread: [0, 0, 0], wander: [0.5, 0.35, 0.5, 0.3],
      flap: 2.3, amp: 0.62, glide: 0.4, translucency: 0.95, rim: 0.7,
      body: '#efe4c8', belly: '#fbf3e0', wingC: '#e4d4ae', trail: '#d0bb8e', tip: '#b09868', head: '#f6eedc', tailC: '#dccba2', beak: '#5a4a38',
      cross: { path, u: OWL_U, window: 0.09, lead: OWL_LEAD, span: Math.max(60, 2 * (owlMid.z - perch.z - 1.5)), angle: 180, side: 1, height: 9, offset: perch.x * 0.45, bow: 0,
        sag: Math.max(0, perch.y - (owlMid.y + 9)), rise: 0 } }), { always: true });
    await ctx.yield();
    if (V.birds !== 'none') {
      fauna.add(F.makeFlock({ rng: rng.fork('birds'), species: V.birds, count: V.birds === 'crows' ? 7 : 16, size: V.birds === 'crows' ? 1.5 : 1.7,
        cross: { path, u: 0.17, lead: 70, span: 320, angle: 62, side: rng.sign(), height: 13, duration: DURATION } }));
    }
    if (V.butterflies) fauna.add(F.makeButterflies({ rng: rng.fork('bfly'), path, uFrom: 0.3, uTo: 0.62, count: 40, clear: 7, spread: 28, lift: [-6.5, -1.5], size: 2.3 }));
    { const bAt = [], bb = rng.fork('bflyDeer'); for (let i = 0; i < 6; i++) bAt.push([glade.x + gAway[0] * 2 + bb.range(-5, 5), glade.y + bb.range(1.2, 4.5), glade.z + gAway[1] * 2 + bb.range(-5, 5)]);
      if (F.makeButterflies) fauna.add(F.makeButterflies({ rng: rng.fork('bflyD'), positions: bAt, count: bAt.length, jitter: 2.5, size: 2.6 }), { always: true }); }
    await ctx.yield();
    // small birds wheeling over the root wheel, pale moths in its mouth, dragonflies patrolling the creek
    const wt = A.wheelTop && (A.wheelTop.position || A.wheelTop), wheelC = [wt ? wt.x : 0, (wt ? wt.y : 20) + 9, (wt ? wt.z : 60) + 14];
    fauna.add(F.makeFlock({ rng: rng.fork('wheelbirds'), species: 'swifts', count: V.wheelBirds, size: 1.5, center: wheelC, radius: 30, height: 6, speed: 11 }), { always: true });
    const mothAt = [], mo = rng.fork('moths');
    for (let i = 0; i < 26; i++) { const a = mo.range(0, TAU), r = mo.range(7.5, 13); mothAt.push([A.mouth.position.x + Math.cos(a) * r, Math.max(2, A.mouth.position.y + Math.sin(a) * r), A.mouth.position.z + mo.range(1.5, 9)]); }
    for (const sk of A.skylights || []) for (let i = 0; i < 4; i++) mothAt.push([sk.floor.x + mo.range(-1.5, 1.5), sk.floor.y + mo.range(1, 3), sk.floor.z + mo.range(-1.5, 1.5)]);
    fauna.add(F.makeMoths({ rng: rng.fork('mothf'), positions: mothAt, jitter: 1.6, count: mothAt.length, size: 2.4 }));
    await ctx.yield();
    if (V.dragonflies) {
      const dAt = [], dr = rng.fork('dragon');
      for (let i = 0; i < 34; i++) { const z = dr.range(215, 540); dAt.push([creekX(z) + dr.range(-4.5, 4.5), creekY(z) + dr.range(0.5, 2.4), z]); }
      fauna.add(F.makeDragonflies({ rng: rng.fork('dragonf'), positions: dAt, count: dAt.length, size: 2.2 }));
    }
    await ctx.yield();

    // ---------------- gaze
    const elderAt = new THREE.Vector3(elder.x, path.pointAt(eu).y + 1.5, elder.z);
    const deerAt = new THREE.Vector3(glade.x, glade.y + 4.5, glade.z);
    const wheelAt = new THREE.Vector3(A.mouth.position.x, A.mouth.position.y + 1.2, A.mouth.position.z);
    const scatters = [grove, maples, ferns, lowFerns, buttFerns, heroFerns, apronFerns];
    const veilCol = C(hex(gold.clone().lerp(fogHi, 0.55))), vc = new THREE.Color();
    // the Giant's small dressing (bore ferns, mushrooms, shafts, motes) cannot be seen from the first half of the route: not drawn there
    const heroSmall = ['ferns', 'mushrooms', 'skylight-shafts', 'motes-and-halos'].map((n) => hero.object.getObjectByName(n)).filter(Boolean);
    const wgI = wheelGlow.uniforms.uIntensity, wgBase = wgI.value, agI = apronGlow.uniforms.uIntensity, agBase = agI.value;
    const veilI = veils.uniforms.uIntensity, veilBase = veilI.value, pv = new THREE.Vector3(), pv0 = new THREE.Vector3(); let veilThin = 1;

    if (sky.prewarm) await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DURATION,
      pace: (u) => 1 - 0.2 * smoothstep(0.54, 0.62, u) * (1 - smoothstep(0.78, 0.86, u)),   // linger while the root wheel grows in the frame
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 26, sway: 0.8, bank: 0.7 },
      pois: [
        { at: elderAt, from: 0.19, to: 0.32, weight: 0.32 },
        { at: deerAt, from: 0.31, to: 0.5, weight: 0.75 },
        { at: wheelAt, from: 0.56, to: 0.84, weight: 0.65 },
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: hex(gold.clone().lerp(C('#fff0c0'), 0.3)), glow: 0.8, revealDistance: 330 },
      post: { exposure: 0.94, bloom: { strength: 0.48, radius: 0.75, threshold: 0.86 },
        grade: { saturation: 1.10, contrast: 1.10, tint: '#fff4de', shadowTint: '#0c2418', vignette: 0.40, grain: 0.03, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        pv0.setFromMatrixPosition(camera.matrixWorld);                                       // the portal camera's world matrix is set directly: never read camera.position
        hero.setProgress(u);
        hero.update(dt, t, camera);
        for (const o of heroSmall) o.visible = u > 0.57;
        sky.update(dt, t, camera);
        // no camera for the rig: its follow mode calls camera.getWorldDirection(), which rebuilds matrixWorld from the local
        // matrix and so resets the engine's portal camera (matrixAutoUpdate = false) to the origin while this world is seen through a portal
        rig.update(dt, t, null);
        land.update(dt, t); river.update(dt, t, camera);
        flora.updateWind(wind, t);
        for (const s of scatters) s.update(dt, t, camera);
        sorrel.update(dt, t, camera);
        // glow veils ride between the camera and the sun; they fade as the camera enters the bore
        for (let i = 0; i < VEIL.length; i++) { pv.copy(pv0).addScaledVector(sunDir, VEIL[i][0]); veils.setPosition(i, pv.x, pv.y, pv.z); }
        veilI.value = veilBase * (1 - smoothstep(0.8, 0.875, u)) * (0.4 + 0.6 * smoothstep(0, 0.03, u));
        // the two near veils thin out on the final approach so the root wheel is not washed out
        const thin = 1 - 0.05625 * Math.round(16 * smoothstep(0.5, 0.6, u));               // 16 steps: the attribute is rewritten only when it changes
        if (thin !== veilThin) { veilThin = thin; for (let i = 0; i < 2; i++) veils.setColor(i, vc.copy(veilCol).multiplyScalar(thin)); }
        // inside the Giant the air clears: the pale haze that fills the grove would lift his charcoal walls to tan (values only: nothing is switched)
        const inBore = smoothstep(0.84, 0.885, u);
        gfog.uniforms.uOpacity.value = gfogBase * (1 - 0.88 * smoothstep(0.83, 0.875, u));
        if (mistFU) mistFU.value = mistFBase * (1 - inBore);
        const atMouth = 1 - smoothstep(0.835, 0.868, u);                                     // the two glow sprites at the wheel stand in the bore's own air: gone before the lens reaches them
        wgI.value = wgBase * atMouth; agI.value = agBase * atMouth;
        scene.fog.density = V.fog * (1 - 0.55 * inBore);
        canopy.position.set(pv0.x, 0, pv0.z);
        const outside = 1 - smoothstep(0.835, 0.872, u);
        for (let i = 0; i < rays.length; i++) rays[i].uniforms.uIntensity.value = rayBase[i] * outside;
        set.update(dt, t, camera);
        // the deer look up as the camera draws level
        const alert = smoothstep(0.34, 0.4, u) * (1 - smoothstep(0.53, 0.59, u));
        if (stag.uniforms.uGraze) stag.uniforms.uGraze.value = grazeBase[0] * (1 - alert);
        if (does.uniforms.uGraze) does.uniforms.uGraze.value = grazeBase[1] * (1 - 0.7 * alert);
        fauna.update(dt, t, camera, u);
      },
      dispose() { hero.dispose(); crownTex.dispose(); if (sky.dispose) sky.dispose(); },
    };
  },
};
