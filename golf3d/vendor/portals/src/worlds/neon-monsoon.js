// NEON MONSOON: a night dive through the rain-soaked canyon of a vertical megacity.
// Layout (canyon distance s, metres): leg 1 runs -Z for 300 m, a 25 degree dogleg left, leg 2 for 260 m, a 25 degree
// dogleg right into the 330 m final street. Leg 2 also carries straight on past the second dogleg as a side street:
// that is where the Koi Hologram (src/parts/neon-monsoon.js) comes from, swimming up leg 2 towards the camera.
// Beats: entry at 208 m under the cloud ceiling -> dive over the atrium-tree skybridge (s 150) -> the maglev crosses
// beneath (s 340) -> under the second skybridge -> beside the koi's eye, through its tail -> out over the junction,
// down through the ring sign -> the market street and the neon gateway.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as S from '../kit/structures.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import * as flora from '../kit/flora.js';
import { buildHero } from '../parts/neon-monsoon.js';

const BRIEF_PALETTE = ['#07060f', '#1a1038', '#2b2f6a', '#12151c', '#00e5ff', '#ff2bd6', '#ffb300'];
const TAU = Math.PI * 2;
const HALF = 30;                                   // half width of the street canyon
const M = [-Math.sin(25 * Math.PI / 180), -Math.cos(25 * Math.PI / 180)];   // heading of leg 2 (x, z)
const R2 = [-M[1], M[0]];                          // its right-hand normal
const B = [0, -300], C = [B[0] + M[0] * 260, B[1] + M[1] * 260], Q0 = [0, -45], QE = [C[0], C[1] - 480];
const MITER = [1, R2[1] / (1 + R2[0])];           // (r1 + r2) / (1 + r1.r2): the same vector at both doglegs
const SEG_S = [45, 300, 560, 1040];               // canyon distance at Q0, B, C, QE
const POLY = [Q0, B, C, QE], MIT = [[1, 0], MITER, MITER, [1, 0]];
const KOI_LAT = 10;                                // the koi swims 10 m right of the centre line of leg 2
const CEIL = 296;                                  // underside of the cloud ceiling

// point on the canyon at distance s, `lat` metres right of the centre line (mitred at the doglegs)
function canyon(s, lat = 0, out = [0, 0]) {
  const i = s < SEG_S[1] ? 0 : s < SEG_S[2] ? 1 : 2, f = (s - SEG_S[i]) / (SEG_S[i + 1] - SEG_S[i]);
  const ax = POLY[i][0] + MIT[i][0] * lat, az = POLY[i][1] + MIT[i][1] * lat, bx = POLY[i + 1][0] + MIT[i + 1][0] * lat, bz = POLY[i + 1][1] + MIT[i + 1][1] * lat;
  out[0] = ax + (bx - ax) * f; out[1] = az + (bz - az) * f; return out;
}
// point in the frame of leg 2 extended to a straight line (the koi's line and the side street): s as above
const leg2 = (s, lat = 0) => [B[0] + M[0] * (s - 300) + R2[0] * lat, B[1] + M[1] * (s - 300) + R2[1] * lat];

const FOG_GLSL = /* glsl */`
uniform vec3 uFogC; uniform float uFogD;
float nmFog(float d){ return 1. - exp(-uFogD * uFogD * d * d); }
`;
const HASH_GLSL = /* glsl */`
float nH(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float nH1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float nN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(nH(i), nH(i + vec2(1., 0.)), f.x), mix(nH(i + vec2(0., 1.)), nH(i + vec2(1., 1.)), f.x), f.y); }
float nF(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * nN(p); p = p * 2.03 + vec2(7.1, 3.3); a *= .5; } return s; }
`;
// the canyon polyline in GLSL (same maths as canyon() above)
const CANYON_GLSL = /* glsl */`
uniform vec2 uCP[4]; uniform vec2 uCM[4]; uniform float uCS[4];
vec2 canyonXZ(float s, float lat, out vec2 dir){
  int i = s < uCS[1] ? 0 : (s < uCS[2] ? 1 : 2);
  vec2 a = uCP[i] + uCM[i] * lat, b = uCP[i + 1] + uCM[i + 1] * lat;
  dir = normalize(b - a);
  return mix(a, b, (s - uCS[i]) / (uCS[i + 1] - uCS[i]));
}
`;
const canyonUniforms = () => ({
  uCP: { value: POLY.map((p) => new THREE.Vector2(p[0], p[1])) }, uCM: { value: MIT.map((p) => new THREE.Vector2(p[0], p[1])) }, uCS: { value: SEG_S.slice() },
});

const hexLin = (h, k = 1) => { const c = new THREE.Color(h); return [c.r * k, c.g * k, c.b * k]; };
const eqLin = (h) => { const c = hexLin(h), k = 0.8 * clamp(0.4 / (0.3 * c[0] + 0.6 * c[1] + 0.1 * c[2]), 0.8, 1.6); return [c[0] * k, c[1] * k, c[2] * k]; };
const mixHex = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

export default {
  id: 'neon-monsoon',
  name: 'Neon Monsoon',
  category: 'city',
  weirdness: 0.3,
  async build(ctx) {
    const rng = ctx.rng, scene = new THREE.Scene();
    const time = { value: 0 };
    const updaters = [], disposables = [];

    // ------------------------------------------------------------------ per-seed character
    const mood = rng.pick(['cyan-magenta', 'cyan-magenta', 'blue-pink', 'teal-violet']);
    const ACC = { 'cyan-magenta': ['#00e5ff', '#ff2bd6'], 'blue-pink': ['#2f8bff', '#ff3d8a'], 'teal-violet': ['#19ffc6', '#b04bff'] }[mood];
    const flip = rng.chance(0.5);                               // which wall carries which key colour
    const COL_R = flip ? ACC[1] : ACC[0], COL_L = flip ? ACC[0] : ACC[1], AMBER = '#ffb300';
    const late = rng();                                         // 0 = busy evening, 1 = the small hours (fewer windows, more neon)
    const downpour = rng.range(0.55, 1.25);                     // rain weight
    const windX = rng.range(-5, 5);                             // rain slant
    const ceilWarm = rng.range(0.25, 0.9);                      // how orange the cloud ceiling glows
    const stormy = rng.range(0.4, 1);                           // lightning rate
    const treeLeft = rng.chance(0.6);                           // which end of the skybridge carries the atrium
    const fogHex = mixHex(mixHex('#1b1650', '#141a55', rng()), '#2a1248', rng.range(0, 0.5));
    const fogColor = new THREE.Color(fogHex);
    const fogDensity = rng.range(0.0034, 0.0041);              // towers are gone into the haze by ~500 m
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);
    scene.background = fogColor.clone().add(new THREE.Color('#de7a30').multiplyScalar(0.2 * (0.42 + 0.5 * ceilWarm))).add(new THREE.Color('#4a2e96').multiplyScalar(0.06));   // = the far cloud haze
    const fogU = { uFogC: { value: fogColor }, uFogD: { value: fogDensity } };
    const pal = BRIEF_PALETTE.slice(); pal[4] = ACC[0]; pal[5] = ACC[1];

    // lights: no sun here. Two raking neon keys from the two walls and an amber-under / violet-over ambient.
    const hemi = new THREE.HemisphereLight(new THREE.Color('#5a4cc8'), new THREE.Color('#ff9a3c'), 0.55);
    const keyR = new THREE.DirectionalLight(new THREE.Color(COL_R), 2.4); keyR.position.set(100, 22, 28);     // from the right wall, onto the left one
    const keyL = new THREE.DirectionalLight(new THREE.Color(COL_L), 2.4); keyL.position.set(-100, 22, 36);
    scene.add(hemi, keyR, keyL, keyR.target, keyL.target);

    // ------------------------------------------------------------------ hero and path
    const HERO_I = 0.9, heroPal = pal.slice(); heroPal[6] = '#ff8c1a';   // saturated orange so the kohaku patches survive the additive blend
    const hero = await buildHero(ctx, { palette: heroPal, length: 120, altitude: 36, rain: 7000, intensity: HERO_I });
    const HA = hero.anchors, ALT = hero.info.altitude;
    const heroYaw = Math.atan2(-M[0], -M[1]);                   // local +Z (its nose) points back up leg 2, towards the camera
    hero.object.rotation.y = heroYaw;
    scene.add(hero.object);
    await ctx.yield();

    // the fly-by in the koi's local frame: x = metres right of its spine as the camera sees the canyon, z = metres ahead of its middle
    const eye = HA.eyeRight, tc = HA.tailCross;
    const pass = [
      [-21, eye.y + 14, 140], [-24, eye.y + 5, 92], [eye.x - 20, eye.y + 0.5, eye.z], [-(hero.info.bodyHalfWidth + 15), ALT + 1, 16],
      [-(hero.info.bodyHalfWidth + 8), ALT, -15], [-5, ALT - 0.5, -30], [tc.x, tc.y, tc.z], [5, ALT - 2, -51],
    ];
    const SIG0 = 418, CLOSE = 1.4;                              // camera distance at pass[0]; closing speed (camera + koi) per camera metre
    const P = [];
    const cy = (s, lat, y) => { const p = canyon(s, lat); P.push([p[0], y, p[1]]); };
    const ps = treeLeft ? 1 : -1;                              // the dive passes on the side away from the atrium
    cy(0, 3 * ps, 208); cy(46, 6 * ps, 201); cy(100, 9 * ps, 181); cy(150, 10 * ps, 161); cy(215, 7 * ps, 133); cy(275, 1 * ps, 105); cy(336, -3, 80); cy(376, -7, 67);
    const passWorld = pass.map((q) => { const s = SIG0 + (140 - q[2]) / CLOSE, p = leg2(s, KOI_LAT + q[0]); return { s, v: new THREE.Vector3(p[0], q[1], p[1]), z: q[2] }; });
    for (const q of passWorld) P.push(q.v);
    cy(604, 5, 29); cy(648, 2, 21.5); cy(692, 0, 13); cy(745, 0, 11.4); cy(800, 0, 10); cy(832, 0, 9); cy(890, 0, 9);
    const path = makePath(P);
    const uOfPoint = (v) => { let best = 1e9, bu = 0; const q = new THREE.Vector3(); for (let i = 0; i <= 600; i++) { path.pointAt(i / 600, q); const d = q.distanceToSquared(v); if (d < best) { best = d; bu = i / 600; } } return bu; };
    const uEye = uOfPoint(passWorld[2].v), uTail = uOfPoint(passWorld[6].v);
    // koi origin (canyon distance along leg 2) as a linear function of u, exact at the eye pass and the tail crossing
    const kEye = passWorld[2].s + passWorld[2].z, kTail = passWorld[6].s + passWorld[6].z;
    const koiS = (u) => kEye + (kTail - kEye) * (u - uEye) / (uTail - uEye);
    const koiPos = new THREE.Vector3(), eyeWorld = new THREE.Vector3();
    const placeKoi = (u) => {
      const p = leg2(koiS(u), KOI_LAT); koiPos.set(p[0], 0, p[1]); hero.object.position.copy(koiPos);
      hero.setProgress(0.22 + 0.78 * smoothstep(0.27, 0.42, u));
      hero.setTurn(0.5 * (1 - smoothstep(0.3, 0.47, u)) - 0.25 * smoothstep(0.56, 0.8, u));
    };
    const eyeAt = (u) => { const p = leg2(koiS(u) - eye.z, KOI_LAT + eye.x); return eyeWorld.set(p[0], eye.y, p[1]); };
    const tailWorld = new THREE.Vector3(), tailAt = (u) => { const p = leg2(koiS(u) - HA.tailTip.z + 14, KOI_LAT + tc.x * 0.5); return tailWorld.set(p[0], tc.y, p[1]); };
    placeKoi(0);
    const uRing = uOfPoint(new THREE.Vector3(...P[17])), uMag = uOfPoint(new THREE.Vector3(...P[6]));
    const portalPos = path.end.clone();

    // ------------------------------------------------------------------ city: towers along the canyon walls
    const mats = S.makeMaterials({
      night: 1, lit: lerp(0.62, 0.38, late), glow: 1.7, warm: '#ffb45e', cool: '#9fdcff', glass: '#0c1220',
      nightFill: [0.012, 0.012, 0.032], halo: 0.6, streetGlow: 0.16, streetY: 0, streetFall: 55, reflect: 0.6,
      sky: { top: fogHex, horizon: fogHex, sun: '#000000', sunDir: [0, 1, 0] },
    });
    const FAC = mats.facades || mats.facade, SU = S.SURF;
    const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const WALLS = ['#3b4156', '#343a50', '#443a56', '#2c3c4c', '#3e3e4a', '#4c445a'].map((h) => S.lin(h));
    const ROOF = S.lin('#14161c'), TRIM = S.lin('#454a5c');
    const ACC_LIN = { r: S.lin(COL_R), l: S.lin(COL_L), a: S.lin(AMBER) };
    const signs = [], beacons = [], gardens = [];
    const signCol = (r, side) => { const k = r(); return k < 0.75 ? (side > 0 ? COL_R : COL_L) : k < 0.89 ? AMBER : k < 0.96 ? (side > 0 ? COL_L : COL_R) : '#dcecff'; };
    const builders = {}, BLD = (k) => builders[k] || (builders[k] = new S.Builder(4096));

    // fr: { x, z, ux, uz, side } = middle of the street face and the direction of local +X; local +Z runs back from the street
    function tower(b, r, fr, w, dp, h, o = {}) {
      const W = (lx, lz) => [fr.x + lx * fr.ux - lz * fr.uz, fr.z + lx * fr.uz + lz * fr.ux];
      b.tr(fr.x, 0, fr.z, Math.atan2(-fr.uz, fr.ux));
      const wall = r.pick(WALLS), seed = r(), style = o.style ?? r.pick([SU.CURTAIN, SU.CURTAIN, SU.RIBBON, SU.WINDOW]);
      const cellW = style === SU.CURTAIN ? r.range(1.2, 1.8) : style === SU.RIBBON ? r.range(2.4, 3.1) : r.range(1.6, 2.1), cellH = r.range(3.2, 3.6);
      const lit = (o.lit ?? 1) * r.range(0.75, 1.2), top = Math.min(h, CEIL + 50), ph = r.range(16, 30);
      const acc = r.chance(0.6) ? (fr.side > 0 ? ACC_LIN.r : ACC_LIN.l) : r.chance(0.5) ? ACC_LIN.a : (fr.side > 0 ? ACC_LIN.l : ACC_LIN.r);
      b.col(mul(wall, 0.9), 0.6, 1).surf(SU.SHOP, seed, 1.9); b.box(-w / 2, 0, 0, w / 2, 7, dp, { cellW: 6, cellH: 7, top: false });
      b.col(mul(wall, 1.15), 0.85, 1).surf(SU.WINDOW, (seed + 0.3) % 1, lit * 1.2); b.box(-w / 2, 7, 0, w / 2, ph, dp, { cellW: 2.4, cellH: 3.6, capColor: ROOF });
      b.col(TRIM, 0.8, 1).surf(SU.PLAIN); b.box(-w / 2 - 0.4, 6.6, -2.6, w / 2 + 0.4, 7.1, 0, { bottom: true });       // canopy over the pavement
      if (o.balconies) for (let y = 10.6; y < ph - 1; y += 3.6) b.box(-w / 2 + 1.5, y - 0.2, -1.4, w / 2 - 1.5, y + 0.9, 0, { bottom: true });
      const terrace = o.terrace ?? r.chance(0.4);
      let y = ph, tw = w * r.range(0.86, 0.97), z0 = terrace ? r.range(9, 15) : r.range(0, 2.5), z1 = dp - r.range(0, 6);
      const zFace = z0;
      if (terrace) {                                              // planted terrace on the podium, lit by a green planter strip
        b.col([0.02, 0.5, 0.12]).surf(SU.GLOW, 0, 0.22); b.box(-w / 2 + 1, ph, 0.6, w / 2 - 1, ph + 0.5, 1.4, {});
        const n = Math.round(w / 9);
        for (let i = 0; i < n; i++) { const q = W(-w / 2 + w * (i + 0.5) / n + r.range(-2, 2), r.range(3.5, z0 - 3)); gardens.push({ x: q[0], y: ph, z: q[1], s: r.range(0.75, 1.3), rot: r() * TAU, v: r.int(0, 1) }); }
      }
      const tiers = top - ph > 120 ? r.int(1, 3) : 1, fins = r.chance(0.6), finEvery = r.int(2, 4), strip = r.chance(0.4);
      for (let t = 0; t < tiers; t++) {
        const yt = t === tiers - 1 ? top : lerp(y, top, r.range(0.45, 0.75));
        b.col(wall, t ? 0.95 : 0.75, 1).surf(style, (seed + t * 0.37) % 1, lit); b.box(-tw / 2, y, z0, tw / 2, yt, z1, { cellW, cellH, capColor: ROOF });
        if (fins) {
          b.col(TRIM, 0.6, 1).surf(SU.PLAIN); const n = Math.max(2, Math.round(tw / (cellW * finEvery)));
          for (let i = 0; i <= n; i++) { const x = -tw / 2 + tw * i / n; b.box(x - 0.4, y, z0 - 1, x + 0.4, yt + 1.5, z0, { top: false }); }
        }
        b.col(acc).surf(SU.GLOW, 0, r.range(0.3, 0.7)); b.box(-tw / 2 - 0.25, yt - 2.6, z0 - 0.25, tw / 2 + 0.25, yt - 1.5, z1 + 0.25, { top: false });
        if (strip && t === 0) { b.surf(SU.GLOW, 0, 0.7); for (const sx of [-1, 1]) b.cbox(sx * (tw / 2 + 0.1), y, z0 - 0.1, 0.9, yt - y, 0.9, { top: false }); }
        if (t === tiers - 1 && h < CEIL - 8) {                     // a roof that stays under the cloud: plant room, mast, red beacon, garden
          b.col(mul(wall, 0.7), 0.9, 1).surf(SU.PLAIN); b.cbox(tw * r.range(-0.2, 0.2), yt, (z0 + z1) / 2, tw * 0.4, r.range(4, 9), (z1 - z0) * 0.4, { capColor: ROOF });
          const mh = r.range(14, 30), mx = tw * r.range(-0.3, 0.3), mz = lerp(z0, z1, r.range(0.2, 0.5));
          b.col(TRIM); b.cbox(mx, yt, mz, 0.8, mh, 0.8, {});
          const q = W(mx, mz); beacons.push([q[0], yt + mh + 0.6, q[1]]);
          if (yt < 215) { const n = r.int(3, 6); for (let i = 0; i < n; i++) { const g = W(tw * r.range(-0.42, 0.42), lerp(z0, z1, r.range(0.06, 0.25))); gardens.push({ x: g[0], y: yt, z: g[1], s: r.range(0.8, 1.4), rot: r() * TAU, v: r.int(0, 1) }); } }
        }
        y = yt; tw *= r.range(0.74, 0.9); z0 += r.range(1.5, 5); z1 -= r.range(2, 8);
      }
      b.pop();
      // signage: blades standing out from the wall (they face along the street) and screens flat on it
      const inx = fr.uz, inz = -fr.ux, lo = (terrace ? ph + 2 : 12), hi = Math.min(top - 10, o.signHi ?? 235);
      const nb = o.blades ?? r.int(2, 4);
      for (let k = 0; k < nb; k++) {
        const lx = r.range(-w / 2 + 3, w / 2 - 3), half = r.range(1.8, 4.5), hh = r.range(8, 30), yc = r.range(lo + hh, Math.max(lo + hh + 20, hi - hh));
        const q = W(lx, zFace - 0.5 - half);
        signs.push({ c: [q[0], yc, q[1]], u: [inx * half, 0, inz * half], hh, col: signCol(r, fr.side), col2: signCol(r, -fr.side), type: r.pick([0, 0, 0, 1, 2, 4]), seed: r(), bright: r.range(0.8, 1.3), side: fr.side });
      }
      const ns = o.stacks ?? r.int(1, 2);                           // stacked small signs, one above the other
      for (let k = 0; k < ns; k++) {
        const lx = r.range(-w / 2 + 3, w / 2 - 3), half = r.range(1.6, 3.2), n = r.int(3, 6), q = W(lx, zFace - 0.5 - half); let y = lo + r.range(0, 30);
        for (let i = 0; i < n && y < hi; i++) {
          const hh = r.range(2.5, 6);
          signs.push({ c: [q[0], y + hh, q[1]], u: [inx * half, 0, inz * half], hh, col: signCol(r, fr.side), col2: signCol(r, -fr.side), type: r.pick([0, 0, 1, 2, 4, 5]), seed: r(), bright: r.range(0.9, 1.4), side: fr.side });
          y += hh * 2 + r.range(0.6, 2);
        }
      }
      if (r.chance(o.screen ?? 0.3)) {
        const sw = Math.min(w * 0.35, r.range(8, 15)), hh = r.range(10, 26), lx = r.range(-w / 2 + sw + 2, w / 2 - sw - 2), yc = r.range(lo + hh, Math.max(lo + hh + 20, Math.min(hi, 200) - hh)), q = W(lx, zFace - 1);
        signs.push({ c: [q[0], yc, q[1]], u: [fr.ux * sw, 0, fr.uz * sw], hh, col: signCol(r, fr.side), col2: signCol(r, -fr.side), type: r.pick([3, 3, 1, 5]), seed: r(), bright: r.range(0.55, 0.85), flat: true, side: fr.side });
      }
    }
    // the vertical farm: stacked growing floors glowing green between dark slabs
    function farm(b, r, fr, w, dp, h) {
      b.tr(fr.x, 0, fr.z, Math.atan2(-fr.uz, fr.ux));
      const top = Math.min(h, CEIL + 50), wall = S.lin('#1c2622');
      b.col(mul(wall, 0.9), 0.6, 1).surf(SU.SHOP, r(), 1.6); b.box(-w / 2, 0, 0, w / 2, 9, dp, { cellW: 6, cellH: 9, top: false });
      for (let y = 9, i = 0; y < top; y += 7.5, i++) {
        const k = 0.5 + 0.5 * Math.sin(i * 1.7) * Math.sin(i * 0.31 + 2), pink = i % 7 === 3;
        b.col(pink ? [0.9, 0.1, 0.55] : [0.04 + 0.1 * k, 0.92, 0.13 + 0.14 * k]).surf(SU.GLOW, 0, pink ? 0.26 : 0.2 + 0.12 * k); b.box(-w / 2 + 1.2, y + 1.6, 1.2, w / 2 - 1.2, y + 7.5, dp - 1.2, { top: false });
        b.col(wall, 1, 1).surf(SU.PLAIN); b.box(-w / 2, y, 0, w / 2, y + 1.6, dp, { bottom: true });
        for (const yy of [y + 3.5, y + 5.5]) b.box(-w / 2 + 0.7, yy, 0.7, w / 2 - 0.7, yy + 0.22, dp - 0.7, { top: false });   // growing shelves
        // every bay grows something else: panels of differing green (and the odd violet grow-light) in front of the racks
        const nx = Math.round(w / 3.4), nz = Math.round(dp / 3.4);
        if (!pink) for (let j = 0; j < nx; j++) if (r.chance(0.55)) {
          const x0 = -w / 2 + w * j / nx + 0.2, x1 = x0 + w / nx - 0.4, kk = r(), vio = r.chance(0.07);
          b.col(vio ? [0.55, 0.12, 0.9] : [0.02 + 0.3 * kk * kk, 0.5 + 0.45 * r(), 0.06 + 0.3 * (1 - kk) * r()]).surf(SU.GLOW, 0, vio ? 0.3 : r.range(0.1, 0.42));
          for (const z of [0.98, dp - 1.18]) b.box(x0, y + 1.6, z, x1, y + (r.chance(0.3) ? 4.4 : 7.5), z + 0.2, { top: false });
        }
        b.col(wall, 1, 1).surf(SU.PLAIN);
        for (let j = 0; j < nx; j++) if (r.chance(0.2)) { const x0 = -w / 2 + w * j / nx, x1 = x0 + w / nx * (r.chance(0.3) ? 2 : 1); for (const z of [0.85, dp - 1.3]) b.box(x0, y + 1.6, z, Math.min(x1, w / 2 - 0.7), y + 7.5, z + 0.45, { top: false }); }
        for (let j = 0; j < nz; j++) if (r.chance(0.2)) { const z0 = dp * j / nz; for (const x of [-w / 2 + 0.85, w / 2 - 1.3]) b.box(x, y + 1.6, z0, x + 0.45, y + 7.5, z0 + dp / nz, { top: false }); }
      }
      b.col(mul(wall, 1.3)).surf(SU.PLAIN);                      // mullions between the racks
      { const nx = Math.round(w / 3.4), nz = Math.round(dp / 3.4);
        for (let j = 1; j < nx; j++) { const x = -w / 2 + w * j / nx; for (const z of [0.55, dp - 0.55]) b.cbox(x, 9, z, 0.3, top - 9, 0.5, { top: false }); }
        for (let j = 1; j < nz; j++) { const z = dp * j / nz; for (const x of [-w / 2 + 0.55, w / 2 - 0.55]) b.cbox(x, 9, z, 0.5, top - 9, 0.3, { top: false }); } }
      b.col(mul(wall, 0.8)).surf(SU.PLAIN);                      // fine glazing bars every 1.7 m
      { const nx = Math.round(w / 1.7); for (let j = 1; j < nx; j++) { const x = -w / 2 + w * j / nx; for (const z of [0.6, dp - 0.6]) b.cbox(x, 9, z, 0.14, top - 9, 0.3, { top: false }); } }
      b.col(mul(wall, 1.6)).surf(SU.PLAIN);
      for (let x = -w / 2; x <= w / 2 + 0.1; x += w / 8) for (const z of [0, dp]) b.cbox(x, 9, z, 1.3, top - 9, 1.3, { top: false });
      b.pop();
    }
    const farmAt = rng.range(40, 90);                              // on the wall that closes the view down leg 1
    function row(key, ax, az, dx, dz, len, side, s0, o = {}) {
      const r = rng.fork('row' + key), b = BLD(key), far = BLD('far'), ux = side > 0 ? dx : -dx, uz = side > 0 ? dz : -dz;
      let t = 0, guard = 0, farmDone = false;
      while (t < len - 24 && guard++ < 60) {
        let w = Math.min(r.range(46, 86), len - t); if (len - t - w < 30) w = len - t;
        const sA = s0 + t, gap = (o.gaps || []).find((g) => sA < g[1] && sA + w > g[0]);
        if (gap) { if (gap[0] - sA > 34) w = gap[0] - sA; else { t = gap[1] - s0; continue; } }
        const dp = Math.min(o.maxDepth ?? 200, r.range(52, 92)), tall = t < (o.tallUntil ?? 0) || r.chance(o.tall ?? 0.66), h = tall ? r.range(340, 700) : r.range(170, 285);
        const mid = t + w / 2, fr = { x: ax + dx * mid, z: az + dz * mid, ux, uz, side };
        if (o.farm && !farmDone && sA + w > s0 + farmAt) { farmDone = true; farm(b, r, fr, w - 1, dp, r.range(250, 290)); }
        else tower(b, r, fr, w - (r.chance(0.3) ? r.range(4, 8) : 0.6), dp, h, o.tower || {});
        if (!o.noBack && (!tall || r.chance(0.25))) {             // a taller neighbour behind fills the wall of windows above a low roof
          const w2 = w * r.range(0.7, 1.1), ox = -uz * (dp + 14), oz = ux * (dp + 14);
          far.tr(fr.x + ox, 0, fr.z + oz, Math.atan2(-uz, ux));
          far.col(r.pick(WALLS), 0.7, 1).surf(r.pick([SU.CURTAIN, SU.RIBBON]), r(), 0.9); far.box(-w2 / 2, 0, 0, w2 / 2, CEIL + 50, 70, { cellW: 2.2, cellH: 3.6, top: false });
          far.col(side > 0 ? ACC_LIN.r : ACC_LIN.l).surf(SU.GLOW, 0, 0.5); { const yb = r.range(180, 280); far.box(-w2 / 2 - 0.3, yb, -0.3, w2 / 2 + 0.3, yb + 1.3, 70.3, { top: false }); }
          far.pop();
        }
        t += w;
      }
    }
    const wallPt = (i, side) => [POLY[i][0] + MIT[i][0] * HALF * side, POLY[i][1] + MIT[i][1] * HALF * side];
    const lowSigns = { balconies: true, blades: 3, signHi: 120, screen: 0.45 };
    const MAG = [327, 353];                                        // the cross street the maglev runs through
    { const a = wallPt(0, 1), e = wallPt(1, 1); row('r1', a[0], a[1], 0, -1, a[1] - e[1], 1, SEG_S[0], { tallUntil: 110 }); }
    { const a = wallPt(0, -1), e = wallPt(1, -1); row('l1', a[0], a[1], 0, -1, a[1] - e[1], -1, SEG_S[0], { tallUntil: 110 }); }
    await ctx.yield();
    { const a = wallPt(1, 1); row('r2', a[0], a[1], M[0], M[1], 260, 1, 300 + MITER[1] * HALF, { gaps: [MAG], farm: true, tower: { lit: 0.7, blades: 2, stacks: 1, screen: 0.15 } }); }
    { const a = wallPt(1, -1); row('l2', a[0], a[1], M[0], M[1], 270, -1, 300 - MITER[1] * HALF, { gaps: [MAG], tower: { lit: 0.7, blades: 2, stacks: 1, screen: 0.15 } });
      row('l2b', a[0] + M[0] * 270, a[1] + M[1] * 270, M[0], M[1], 230, -1, 570 - MITER[1] * HALF, { tower: { blades: 2 } }); }
    await ctx.yield();
    { const a = wallPt(2, 1); row('r3', a[0], a[1], 0, -1, a[1] + 962, 1, 560 - MITER[1] * HALF, { tower: lowSigns }); }
    // the flatiron between the side street and the final street, then the walls behind it
    const sProw = 300 + (C[0] - HALF - R2[0] * HALF) / M[0], PROW = leg2(sProw, HALF);
    {
      const b = BLD('l3'), r = rng.fork('flatiron'), cut = 14, run = 124;
      const Pa = [PROW[0] + M[0] * cut, PROW[1] + M[1] * cut], Pb = [PROW[0], PROW[1] - cut], A1 = [PROW[0] + M[0] * run, PROW[1] + M[1] * run], A2 = [PROW[0], A1[1]];
      const poly = [Pb, A2, A1, Pa], wall = S.lin('#2c3142');
      b.col(mul(wall, 0.9), 0.6, 1).surf(SU.SHOP, r(), 1.9); b.prism(poly, 0, 7, { cellW: 6, cellH: 7, top: false });
      b.col(mul(wall, 1.15), 0.85, 1).surf(SU.WINDOW, r(), 1.2); b.prism(poly, 7, 26, { cellW: 3.1, cellH: 3.8 });
      for (let y = 26; y < 262; y += 59) {
        b.col(wall, 0.85, 1).surf(SU.CURTAIN, r(), 1); b.prism(poly, y, y + 56, { cellW: 1.9, cellH: 3.6 });
        b.col(ACC_LIN.l).surf(SU.GLOW, 0, 0.8); b.prism(poly, y + 56, y + 59, { top: y + 59 > 261 });
      }
      const mx = (Pa[0] + Pb[0]) / 2, mz = (Pa[1] + Pb[1]) / 2, tx = Pb[0] - Pa[0], tz = Pb[1] - Pa[1], tl = Math.hypot(tx, tz), nx = -tz / tl, nz = tx / tl, sg = nz > 0 ? 1 : -1;
      beacons.push([mx, 290, mz]);
      signs.push({ c: [mx + nx * sg * 2.2, 74, mz + nz * sg * 2.2], u: [tx / tl * 8.5, 0, tz / tl * 8.5], hh: 46, col: COL_L, col2: AMBER, type: 3, seed: r(), bright: 1.1, flat: true, big: true, side: -1 });
      signs.push({ c: [mx + nx * sg * 2.6, 150, mz + nz * sg * 2.6], u: [tx / tl * 5, 0, tz / tl * 5], hh: 24, col: AMBER, col2: COL_R, type: 0, seed: r(), bright: 1.2, flat: true, side: -1 });
      row('l3', PROW[0], A2[1] - 3, 0, -1, A2[1] - 3 + 962, -1, 560 + C[1] - (A2[1] - 3), { maxDepth: 44, tower: lowSigns });
      row('l2b', A1[0] + M[0] * 3, A1[1] + M[1] * 3, M[0], M[1], 170, 1, 2000, { maxDepth: 40, noBack: true });
    }
    {                                                              // the tower that closes the final street, behind the gateway
      const r = rng.fork('terminal'), zT = -986;
      tower(BLD('r3'), r, { x: C[0], z: zT, ux: -1, uz: 0, side: 1 }, 132, 80, 640, { terrace: false, blades: 0, stacks: 0, screen: 0, style: SU.CURTAIN, lit: 1.1 });
      for (const sx of [-1, 1]) signs.push({ c: [C[0] + sx * 27, 64, zT + 3.2], u: [13, 0, 0], hh: 44, col: sx > 0 ? COL_R : COL_L, col2: AMBER, type: sx > 0 ? 3 : 5, seed: r(), bright: 0.9, flat: true, big: true, side: sx });
      signs.push({ c: [C[0], 104, zT + 3.4], u: [7, 0, 0], hh: 58, col: AMBER, col2: COL_R, type: 4, seed: r(), bright: 1.1, flat: true, big: true });
      for (const sx of [-1, 1]) signs.push({ c: [C[0] + sx * 13.6, 14.5, C[1] - 330], u: [2.1, 0, 0], hh: 10.5, col: sx > 0 ? COL_L : COL_R, col2: AMBER, type: 0, seed: r(), bright: 1.2, flat: true, big: true, side: sx });   // the gateway's pylons
    }
    {                                                              // ... and the one that closes the side street the koi comes from
      const r = rng.fork('sideEnd'), q = leg2(905, 0), ux = -R2[0], uz = -R2[1], W2 = (lx, lz) => [q[0] + lx * ux - lz * uz, q[1] + lx * uz + lz * ux];
      tower(BLD('l2b'), r, { x: q[0], z: q[1], ux, uz, side: -1 }, 110, 70, 560, { terrace: false, blades: 0, stacks: 0, screen: 0, style: SU.CURTAIN, lit: 1.1 });
      for (const sx of [-1, 1]) { const c = W2(sx * 22, -3.2); signs.push({ c: [c[0], 78, c[1]], u: [ux * 12, 0, uz * 12], hh: 46, col: sx > 0 ? COL_L : COL_R, col2: AMBER, type: sx > 0 ? 5 : 3, seed: r(), bright: 1, flat: true, big: true, side: -1 }); }
      { const c = W2(0, -3.4); signs.push({ c: [c[0], 150, c[1]], u: [ux * 6, 0, uz * 6], hh: 40, col: AMBER, col2: COL_L, type: 4, seed: r(), bright: 1.1, flat: true, big: true, side: -1 }); }
    }
    await ctx.yield();

    // skybridges, the maglev viaduct
    const pb = BLD('props'), AX = -13 * ps, deckC = S.lin('#2a2e3c'), thL2 = Math.atan2(-R2[1], R2[0]);
    pb.col(deckC, 0.8, 1).surf(SU.RIBBON, rng(), 1.7); pb.box(-HALF - 2, 141, -158, HALF + 2, 147, -142, { cellW: 3, rows: 1, capColor: ROOF });
    pb.col(mul(deckC, 0.7)).surf(SU.PLAIN); pb.box(-HALF - 2, 139.8, -158.4, HALF + 2, 141, -141.6, { bottom: true });
    pb.col(ACC_LIN.a).surf(SU.GLOW, 0, 0.8); for (const z of [-157, -143.6]) pb.box(-HALF, 139.5, z, HALF, 139.8, z + 0.6, { bottom: true });
    pb.col(S.lin('#3a4050')).surf(SU.PLAIN); pb.cyl(AX, 147, -150, 12.6, 12.6, 1.2, 24);
    pb.col([0.02, 0.5, 0.12]).surf(SU.GLOW, 0, 0.35); pb.cyl(AX, 148.2, -150, 11.6, 11.6, 0.25, 24);
    pb.col(TRIM).surf(SU.PLAIN); for (const z of [-157.8, -142.5]) pb.box(-HALF - 2, 147, z, HALF + 2, 148.1, z + 0.3, {});
    { const q = leg2(420, 0); pb.tr(q[0], 0, q[1], thL2);
      pb.col(deckC, 0.8, 1).surf(SU.RIBBON, rng(), 1.7); pb.box(-HALF - 2, 120, -5, HALF + 2, 126.5, 5, { cellW: 3, rows: 1, capColor: ROOF });
      pb.col(mul(deckC, 0.7)).surf(SU.PLAIN); pb.box(-HALF - 2, 118.8, -5.4, HALF + 2, 120, 5.4, { bottom: true });
      pb.col(ACC_LIN.r).surf(SU.GLOW, 0, 0.9); pb.box(-HALF, 118.45, -3.6, 0, 118.8, -2.8, { bottom: true }); pb.box(-HALF, 118.45, 2.8, 0, 118.8, 3.6, { bottom: true });
      pb.col(ACC_LIN.l).surf(SU.GLOW, 0, 0.9); pb.box(0, 118.45, -3.6, HALF, 118.8, -2.8, { bottom: true }); pb.box(0, 118.45, 2.8, HALF, 118.8, 3.6, { bottom: true });
      pb.pop(); }
    { const q = leg2(340, 0); pb.tr(q[0], 0, q[1], thL2);
      pb.col(S.lin('#30343f'), 0.7, 1).surf(SU.PLAIN); pb.box(-240, 55.2, -4.2, 240, 58.2, 4.2, { bottom: true }); pb.box(-240, 58.2, -0.7, 240, 58.6, 0.7, {});
      pb.col(ACC_LIN.r).surf(SU.GLOW, 0, 1.4); for (const z of [-4.5, 4.2]) pb.box(-240, 56.9, z, 240, 57.6, z + 0.3, { bottom: true });
      pb.col(ACC_LIN.a).surf(SU.GLOW, 0, 1.4); for (const z of [-2.6, 1.8]) pb.box(-240, 54.9, z, 240, 55.2, z + 0.8, { bottom: true });   // light strips under the deck
      pb.col(S.lin('#30343f'), 0.5, 1).surf(SU.PLAIN); for (const x of [-150, -88, -26, 26, 88, 150]) pb.cbox(x, 0, 0, 3.6, 55.2, 3.6, { top: false });
      pb.col(ACC_LIN.l).surf(SU.GLOW, 0, 1.2); for (const x of [-150, -88, -26, 26, 88, 150]) for (const yb of [18, 36, 50.5]) pb.cbox(x, yb, 0, 4.1, 1.1, 4.1, { bottom: true });
      pb.pop(); }
    const train = S.makeTrain({ rng: rng.fork('train'), mats, type: 'bullet', points: [leg2(340, -232), leg2(340, 232)].map((q) => [q[0], 58.6, q[1]]), straight: true,
      cars: 7, speed: 1, loop: false, beam: false, lit: 1.5, fade: 12 });
    scene.add(train.object);
    const trainD = (u) => 232 + train.length * 0.5 + (u - uMag) * 1800;      // spans the canyon exactly when the camera is over it
    train.update(0, trainD(0));

    const skyline = S.makeSkyline({ rng: rng.fork('skyline'), mats, radius: 1150, count: 110, layers: 3, maxHeight: 460, baseY: -20, color: '#0b0d1c', hazeAmount: [0.8, 0.94] });
    scene.add(skyline.object);
    await ctx.yield();

    // ------------------------------------------------------------------ signs: one instanced, animated draw call
    const kept = signs.filter((sg) => {
      if (sg.big) return true;
      for (const ky of [-1, 0, 1]) for (const ku of [-1, 1]) if (path.distanceTo(sg.c[0] + sg.u[0] * ku, sg.c[1] + sg.hh * ky, sg.c[2] + sg.u[2] * ku) < 11) return false;
      return true;
    });
    {
      const n = kept.length, g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const iC = new Float32Array(n * 3), iU = new Float32Array(n * 3), iA = new Float32Array(n * 4), iK = new Float32Array(n * 3), iK2 = new Float32Array(n * 3);
      kept.forEach((sg, i) => {
        iC.set(sg.c, i * 3); iU.set(sg.u, i * 3); iA.set([sg.hh, sg.type, sg.seed, sg.bright], i * 4); iK.set(eqLin(sg.col), i * 3); iK2.set(eqLin(sg.col2), i * 3);
      });
      g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 3)); g.setAttribute('iU', new THREE.InstancedBufferAttribute(iU, 3)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
      g.setAttribute('iK', new THREE.InstancedBufferAttribute(iK, 3)); g.setAttribute('iK2', new THREE.InstancedBufferAttribute(iK2, 3)); g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: time, ...fogU }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec3 iC, iU, iK, iK2; attribute vec4 iA;
          varying vec2 vUv, vSize; varying vec3 vCol, vCol2, vPar, vW;
          void main(){
            vec3 wp = iC + iU * position.x + vec3(0., iA.x, 0.) * position.y;
            vUv = position.xy * .5 + .5; vSize = vec2(length(iU) * 2., iA.x * 2.);
            vCol = iK; vCol2 = iK2; vPar = iA.yzw; vW = wp;
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime; varying vec2 vUv, vSize; varying vec3 vCol, vCol2, vPar, vW;
          ${FOG_GLSL} ${HASH_GLSL}
          float glyph(vec2 p, float id){
            vec2 q = (p - .5) / .76 + .5;
            if (q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) return 0.;
            vec2 g = floor(q * vec2(5., 6.)); g.x = min(g.x, 4. - g.x);
            vec2 f = fract(q * vec2(5., 6.));
            return step(.4, nH(g + id * 13.7)) * step(.1, f.x) * step(.1, f.y);
          }
          void main(){
            float type = floor(vPar.x + .5), seed = vPar.y, t = uTime;
            vec2 m = vUv * vSize; vec3 col;
            if (type < .5) {                                       // columns or rows of changing glyphs
              float cs = min(vSize.x, vSize.y); vec2 n = max(floor(vSize / cs + .5), vec2(1.)); vec2 cuv = vUv * n, cell = floor(cuv);
              float id = nH(cell + seed * 91.) + floor(t * (.12 + .3 * nH(cell.yx + seed)) + nH(cell + 3.) * 9.);
              col = vCol * (glyph(fract(cuv), id) * 2.8 + .07);
            } else if (type < 1.5) {                               // equaliser bars
              float rows = floor(vSize.y / 1.5), row = floor(vUv.y * rows);
              float len = .22 + .78 * nN(vec2(row * .23 + seed * 17., t * 1.3 + nH1(row) * 3.));
              float on = step(vUv.x, len) * step(.18, fract(vUv.y * rows));
              col = mix(vCol, vCol2, vUv.x) * on * 2.4 + vCol * .05;
            } else if (type < 2.5) {                               // pulsing rings
              float d = length((vUv - .5) * vSize) / min(vSize.x, vSize.y);
              float ring = smoothstep(.2, .05, abs(fract(d * 2.4 - t * .5 + seed) - .5));
              col = mix(vCol, vCol2, fract(d * 1.2 - t * .25)) * ring * 2.4 + vCol2 * .05;
            } else if (type < 3.5) {                               // video wall
              vec2 p = m * .1;
              float a = sin(p.x * 1.3 + t * .7 + seed * 40.) + sin(p.y * 1.1 - t * .5) + sin((p.x + p.y) * .8 + t * .9 + sin(p.y * .6 + t * .3) * 2.);
              a = a / 3. * .5 + .5;
              col = mix(vCol2, vCol, smoothstep(.3, .7, a)) * (.3 + 1.7 * a * a);
              float cs = min(vSize.x, vSize.y) * .8; vec2 gp = (m - vSize * .5) / cs + .5;
              col += vec3(1.5) * glyph(gp, floor(t * .3 + seed * 7.)) * step(.5, fract(t * .15 + seed * 3.));
              col *= .78 + .22 * sin(m.y * 5. - t * 5.);
            } else if (type < 4.5) {                               // chevrons climbing
              float k = fract(m.y / 6. + abs(vUv.x - .5) * vSize.x / 6. - t * .7);
              col = vCol * step(k, .42) * 2.5 + vCol2 * .08;
            } else {                                               // LED matrix
              vec2 c = floor(m / 1.6); float v = nN(c * .22 + vec2(t * .5, seed * 30.));
              float dotm = smoothstep(.46, .28, length(fract(m / 1.6) - .5));
              col = mix(vCol, vCol2, smoothstep(.4, .8, v)) * step(.42, v) * dotm * 2.8 + vCol * .04;
            }
            float bw = .4, bd = step(m.x, bw) + step(vSize.x - bw, m.x) + step(m.y, bw) + step(vSize.y - bw, m.y);
            col = mix(col, vCol2 * 2.6, min(bd, 1.));
            float buzz = step(seed, .14);
            float fl = 1. - (.35 + .4 * buzz) * step(.985 - .12 * buzz, nH(vec2(floor(t * 13.), seed * 77.)));
            col *= vPar.z * fl * (.88 + .12 * sin(t * (1. + seed * 2.) + seed * 50.));
            float f = nmFog(length(vW - cameraPosition));
            gl_FragColor = vec4(col * (1. - .9 * f) + uFogC * f, 1.);
          }`,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; scene.add(mesh);
    }
    // halos in the rain haze round the larger signs, red aviation beacons on the roofs that stay under the cloud
    {
      const big = kept.filter((sg) => sg.hh * Math.hypot(sg.u[0], sg.u[2]) > 60).slice(0, 120);
      const halo = fx.makeGlows({ time, positions: big.map((sg) => sg.c), colors: big.map((sg) => sg.col), sizes: big.map((sg) => Math.min(44, sg.hh * 1.2 + Math.hypot(sg.u[0], sg.u[2]) * 2)),
        size: 1.15, intensity: 0.42, core: 0, halo: 1, fogAmount: 0.6, near: [0.5, 2], depthBias: 0.05 });
      const red = fx.makeGlows({ time, positions: beacons, color: '#ff1c14', size: 9, intensity: 2.6, flicker: 0.55, fogAmount: 0.3 });
      scene.add(halo.object, red.object); updaters.push(halo, red);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the wet street
    const NL = 12;
    const streetU = {
      uTime: time, ...fogU, uLP: { value: Array.from({ length: NL }, () => new THREE.Vector4(0, -999, 0, 1)) }, uLC: { value: Array.from({ length: NL }, () => new THREE.Vector3()) },
      uColL: { value: new THREE.Color(COL_L) }, uColR: { value: new THREE.Color(COL_R) }, uAmber: { value: new THREE.Color('#ff9a2e') },
      uB: { value: new THREE.Vector2(B[0], B[1]) }, uC: { value: new THREE.Vector2(C[0], C[1]) }, uM: { value: new THREE.Vector2(M[0], M[1]) },
      uX: { value: new THREE.Vector2(...leg2(340, 0)) }, uWet: { value: 0.75 + 0.25 * downpour }, uFlash: { value: 0 },
    };
    {
      const g = new THREE.PlaneGeometry(2600, 2600); g.rotateX(-Math.PI / 2); g.translate(-55, 0, -470);
      const mat = new THREE.ShaderMaterial({
        uniforms: streetU,
        vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          #define NL ${NL}
          uniform float uTime, uWet, uFlash; uniform vec4 uLP[NL]; uniform vec3 uLC[NL]; uniform vec3 uColL, uColR, uAmber; uniform vec2 uB, uC, uM, uX;
          varying vec3 vW;
          ${FOG_GLSL} ${HASH_GLSL}
          // head and tail lights streaming along a road from a in direction d for length L
          vec3 traffic(vec2 p, float dist, vec2 a, vec2 d, float L, float lanes, float so, out float lat){
            vec2 r = p - a; float s = dot(r, d); lat = dot(r, vec2(-d.y, d.x));
            if (s < 0. || s > L || abs(lat) > lanes * 4.5 + 2.5) return vec3(0.);
            float lane = floor(lat / 4.5 + .5);
            if (abs(lane) < .5 || abs(lane) > lanes + .5) return vec3(0.);
            float dirn = sign(lane), lx = lat - lane * 4.5;
            float sp = (11. + 5. * nH1(lane + so)) * dirn;
            float q = (s - uTime * sp) / 11. + nH1(lane * 7. + so) * 9.;
            float cell = floor(q);
            float on = step(.3, nH(vec2(cell, lane + so * 3.)));
            float along = (fract(q) - .5 - (nH(vec2(cell, lane + 5.)) - .5) * .3) * 11. * dirn;
            // two lamps a car's width apart; widened with distance so they never shrink below a pixel
            float px = dist * .0022, w2 = .12 + px * px, gain = sqrt(.12 / w2) * (1. + px * .9);
            float w = exp(-pow(abs(lx) - .75, 2.) / w2), body = exp(-lx * lx / (.8 + px * px));
            float l2 = .25 + px * px;
            float head = exp(-pow(along - 2.1, 2.) / l2), tail = exp(-pow(along + 2.1, 2.) / l2);
            float pool = exp(-max(along - 2.3, 0.) / 2.2) * step(2.3, along);                  // headlight thrown ahead on the wet road
            float trail = exp(-max(-2.1 - along, 0.) / 2.6) * step(along, -2.1);              // tail light smeared out behind
            float ends = smoothstep(0., 8., s) * smoothstep(L, L - 8., s);
            float roof = smoothstep(2.3, 1.7, abs(along)) * smoothstep(1.15, .85, abs(lx));   // the dark wet roof between the lamps
            vec3 c = (vec3(1., .8, .5) * head * 2.1 + vec3(1., .05, .03) * tail * 2.2) * w * gain
                   + (vec3(1., .78, .46) * pool * .5 + vec3(1., .05, .03) * trail * .45) * body
                   + mix(uColL, uColR, step(0., lat)) * roof * .035 / (1. + px * 4.);
            return c * on * ends;
          }
          void main(){
            vec2 p = vW.xz; vec3 Vv = vW - cameraPosition; float dist = length(Vv); vec3 V = Vv / dist;
            float lat1, lat2, lat3;
            vec3 cars = traffic(p, dist, vec2(0., 60.), vec2(0., -1.), 360., 3., 1., lat1) + traffic(p, dist, uB, uM, 500., 3., 2., lat2)
                      + traffic(p, dist, uX - vec2(-uM.y, uM.x) * 300., vec2(-uM.y, uM.x), 600., 2., 3., lat3);
            // damp asphalt and puddles, pitted by the rain
            float pud = smoothstep(.38, .62, nN(p * .09) * .7 + nN(p * .31) * .3), wet = mix(.4, 1., pud) * uWet;
            vec2 rip = vec2(nN(p * 2.1 + uTime * vec2(.9, .4)), nN(p * 2.1 - uTime * vec2(.5, .8))) - .5;
            float fadeN = 1. - smoothstep(60., 220., dist);
            vec3 N = normalize(vec3(rip.x * .2 * fadeN, 1., rip.y * .2 * fadeN));
            vec3 R = reflect(V, N);
            float cosv = max(dot(-V, N), 0.), fres = .05 + .95 * pow(1. - cosv, 4.), fs = .18 + .82 * pow(1. - cosv, 2.5);
            vec3 col = vec3(.007, .008, .014) * (.6 + .8 * nN(p * .9)) + uAmber * .003;
            // the neon walls smeared down the road: which wall the mirrored ray heads for, broken into streaks along the view
            vec2 vd = normalize(V.xz + vec2(1e-4)), cd = (p.y > uB.y ? vec2(0., -1.) : (p.x > uC.x - 34. ? uM : vec2(0., -1.)));
            float side = dot(R.xz, vec2(-cd.y, cd.x));
            float streak = nN(vec2(dot(p, vec2(-vd.y, vd.x)) * .42, dot(p, vd) * .022));
            vec3 wallc = mix(uColL, uColR, smoothstep(-.35, .35, side)) * .5 + uAmber * .12;
            wallc = mix(wallc, vec3(.05, .035, .09) + uFlash * vec3(.25, .3, .5), smoothstep(.3, .85, R.y));
            float finalLeg = smoothstep(uC.y + 20., uC.y - 30., p.y) * step(abs(p.x - uC.x), 34.);   // the market street keeps the road dark for distinct streaks
            col += wallc * (.15 + 1.9 * streak * streak) * fres * wet * .8 * (1. - .65 * finalLeg);
            // stretched reflections of the nearest signs, the gateway ring and the koi
            vec3 acc = vec3(0.); vec2 rh = normalize(R.xz + vec2(1e-5));
            for (int i = 0; i < NL; i++) {
              vec3 L = uLP[i].xyz - vW; float dL = length(L); vec3 l = L / dL;
              float ca = max(dot(rh, normalize(l.xz + vec2(1e-5))), 0.);
              float pw = clamp(1.1 * dL * dL / (uLP[i].w * uLP[i].w), 20., 2600.), ef = 1.5, att = .00012;
              if (i == 0) { pw = clamp(2.4 * dL * dL / (uLP[i].w * uLP[i].w), 90., 4000.); ef = .5; att = .000025; }   // the gateway ring: one long bar down the centre line
              float el = exp(-pow((R.y - l.y) * ef, 2.));
              acc += uLC[i] * pow(ca, pw) * el / (1. + dL * dL * att);
            }
            col += acc * wet * fs * (.7 + 1.3 * streak);
            // warm pools under the market stalls of the final street
            float zz = uC.y - p.y, lx3 = abs(p.x - uC.x);
            col += uAmber * (.15 * exp(-pow((lx3 - 13.) / 5., 2.)) * smoothstep(110., 150., zz) * smoothstep(345., 300., zz) * (.5 + nN(p * .35)));
            // rain rings
            vec2 rc = p * .7, ci = floor(rc); float ph = fract(uTime * .8 + nH(ci) * 7.);
            vec2 cf = fract(rc) - .5 - (vec2(nH(ci + 3.), nH(ci + 9.)) - .5) * .5;
            col += (uColL + uColR + vec3(.4)) * (smoothstep(.07, 0., abs(length(cf) - ph * .42)) * (1. - ph) * .035 * (1. - smoothstep(25., 70., dist)));
            col += cars * (1. + .5 * wet);
            gl_FragColor = vec4(mix(col, uFogC, nmFog(dist)), 1.);
          }`,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; scene.add(mesh);
    }
    const streetLights = kept.filter((sg) => sg.c[1] - sg.hh < 120).map((sg) => ({ p: sg.c, c: hexLin(sg.col, sg.bright * 1.1), r: Math.hypot(sg.u[0], sg.u[2]) + sg.hh * 0.35, side: sg.side || 1 }));
    await ctx.yield();

    // ------------------------------------------------------------------ green things: terrace gardens and the atrium tree
    const wind = flora.makeWind({ direction: [0.8, 0.5], strength: 1.3 });
    const fmat = flora.windMaterial({ wind, emissive: '#1f5226', emissiveIntensity: 0.5, backlight: 0.3, ambient: 2.6, leafAmbient: 2.4 });
    const gardenTrees = rng.fork('pick').shuffle(gardens).slice(0, 90).map((g) => Object.assign(g, { d: 0, u: 0 }));
    const garden = flora.makeScatter({ rng: rng.fork('garden'), material: fmat, points: gardenTrees, sink: 0.02, tilt: 0.03,
      variants: [flora.oakGeometry({ rng: rng.fork('g1'), detail: 0, height: 9 }), flora.cherryGeometry({ rng: rng.fork('g2'), detail: 0, height: 7.5 })] });
    scene.add(garden.object);
    const env = fx.makeEnv({ sunDir: [0.5 * ps, 0.6, 0.4], sunColor: COL_R, sunIntensity: 1.2, sky: '#4a3aa0', horizon: fogHex, ground: '#ff9a3c', ambient: 0.6 });
    {
      const atrium = new THREE.Group(); atrium.position.set(AX, 148.2, -150); scene.add(atrium);
      const tmat = flora.windMaterial({ wind, map: fmat.map, emissive: '#2a8a36', emissiveIntensity: 0.55, backlight: 0.6, ambient: 2.2, leafAmbient: 1.6 });
      const tree = new THREE.Mesh(flora.oakGeometry({ rng: rng.fork('atrium'), detail: 2, height: 19 }), tmat); atrium.add(tree);
      const DR = 12.2, DH = 21.5;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(DR, 28, 12, 0, TAU, 0, Math.PI / 2), fx.glassMaterial({ env, time, color: mixHex(COL_R, '#ffffff', 0.6), opacity: 0.1 }));
      dome.scale.y = DH / DR; dome.renderOrder = 2; atrium.add(dome);
      const tubes = [];
      for (let i = 0; i < 8; i++) { const a = TAU * i / 8, pts = []; for (let k = 0; k <= 8; k++) { const ph = Math.PI / 2 * k / 8; pts.push([DR * Math.cos(a) * Math.cos(ph), DH * Math.sin(ph), DR * Math.sin(a) * Math.cos(ph)]); } tubes.push({ points: pts, color: COL_R }); }
      for (const ph of [0.02, 0.5, 1.0]) { const pts = []; for (let k = 0; k < 20; k++) { const a = TAU * k / 20; pts.push([DR * Math.cos(a) * Math.cos(ph), DH * Math.sin(ph), DR * Math.sin(a) * Math.cos(ph)]); } tubes.push({ points: pts, closed: true, color: ph < 0.1 ? AMBER : COL_R }); }
      atrium.add(S.makeNeon({ rng: rng.fork('ribs'), mats, tubes, radius: 0.07, glow: 0.5 }).object);
      const lamps = fx.makeGlows({ time, positions: [[AX, 153, -150], [AX + 5, 151, -146], [AX - 5, 151, -154], [AX, 164, -150]], colors: ['#fff0c0', '#b8ffb0', '#b8ffb0', '#fff0c0'], size: 13, intensity: 0.55, fogAmount: 0.5 });
      scene.add(lamps.object); updaters.push(lamps);
      // the one local light of the world: the grow-lamps under the canopy, on the side the camera passes
      const grow = new THREE.PointLight(new THREE.Color('#d6ffb8'), 520, 46, 2); grow.position.set(AX + 6 * ps, 153.5, -143.5); scene.add(grow);
      updaters.push({ update(dt, t) { grow.intensity = 520 * (0.9 + 0.1 * Math.sin(t * 2.3) * Math.sin(t * 0.7 + 1)); } });
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the cloud ceiling, lit from below, with sheet lightning
    const ceilU = { uTime: time, ...fogU, uFlash: { value: 0 }, uFlashP: { value: new THREE.Vector2() },
      uWarm: { value: new THREE.Color('#de7a30').multiplyScalar(0.42 + 0.5 * ceilWarm) }, uCool: { value: new THREE.Color('#4a2e96').multiplyScalar(0.5) } };
    const ceiling = (() => {
      const g = new THREE.BufferGeometry(), P3 = [], AL = [], I = [], Hs = [CEIL + 16, CEIL], R = 1700;
      Hs.forEach((y, l) => { const o = l * 4; P3.push(-R, y, -R, R, y, -R, R, y, R, -R, y, R); AL.push(l, l, l, l); I.push(o, o + 1, o + 2, o, o + 2, o + 3); });
      g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(AL, 1)); g.setIndex(I);
      const mat = new THREE.ShaderMaterial({
        uniforms: ceilU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute float aL; varying vec3 vW; varying float vL;
          void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vL = aL; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uFlash; uniform vec2 uFlashP; uniform vec3 uWarm, uCool; varying vec3 vW; varying float vL;
          ${FOG_GLSL} ${HASH_GLSL}
          void main(){
            vec2 p = vW.xz * .0042 + uTime * vec2(.007, .003) + vL * 3.7;
            float n = nF(p), n2 = nN(p * 5.3 + 9.), dens = n * .74 + n2 * .26;
            vec3 col = mix(uCool, uWarm, smoothstep(.36, .7, dens + (nN(vW.xz * .0021 + 5.) - .5) * .5)) * (.22 + .85 * dens);
            float fl = uFlash * smoothstep(1., 0., length(vW.xz - uFlashP) / 520.) * (.35 + 1.3 * n2);
            col += vec3(.5, .62, 1.) * fl * 2.4;
            float a = vL < .5 ? 1. : smoothstep(.4, .68, dens) * .75;
            float f = nmFog(length(vW - cameraPosition) * .45);
            vec3 haze = uFogC * (1. + fl) + uWarm * .2 + uCool * .12;     // the city's glow soaked into the far cloud: warm toward the horizon
            gl_FragColor = vec4(mix(col * 1.25, haze, f), a);
          }`,
      });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1; scene.add(m); return m;
    })();
    const lh = (n) => { const x = Math.sin(n * 127.1 + ctx.seed * 0.013) * 43758.5453; return x - Math.floor(x); };
    const flashAt = (t, out) => {                                  // sheet lightning as a pure function of time
      const T = lerp(7.5, 3.4, stormy), k = Math.floor(t / T), x = t - k * T - lh(k) * T * 0.5;
      out.x = (lh(k + 0.31) - 0.5) * 900; out.y = (lh(k + 0.77) - 0.5) * 900 - 120;
      if (lh(k + 0.5) > 0.78 || x < 0) return 0;
      // an eased double pulse (0.1 s rise, 0.3 s decay): at most two flashes per event, events at least 3.4 s apart
      return smoothstep(0, 0.1, x) * Math.exp(-Math.max(x - 0.1, 0) * 3.3) + 0.6 * smoothstep(0.45, 0.55, x) * Math.exp(-Math.max(x - 0.55, 0) * 3.3);
    };

    // ------------------------------------------------------------------ flying traffic: streams of light trails in the air lanes
    {
      const r = rng.fork('flyers'), aP = [], aE = [], aQ = [], aK = [];
      const heads = ['#ffffff', mixHex(COL_R, '#ffffff', 0.4), '#ffe2a8'], tails = ['#ff2a18', '#ff5a1c', mixHex(COL_L, '#ff2020', 0.4)];
      const q3 = new THREE.Vector3();
      for (const y of [30, 46, 70, 96, 128, 160, 196, 232, 262]) for (const lat of [-17, -9, 9, 17]) {
        const la = lat + r.range(-2, 2), yy = y + r.range(-5, 5); let ok = true;
        for (let s = -40; s <= 1000 && ok; s += 9) { const p = canyon(s, la); if (path.distanceTo(p[0], yy, p[1]) < 10) ok = false; }
        if (!ok) continue;
        const dirn = lat > 0 ? 1 : -1, n = r.int(5, 11);
        for (let i = 0; i < n; i++) { aP.push(la, yy + r.range(-1.5, 1.5), -60, 1010); aE.push(0, 0, 0, 0); aQ.push(dirn * r.range(22, 40), r(), r.range(7, 17), r.range(0.5, 0.9)); const c = hexLin(r.pick(dirn > 0 ? tails : heads)); aK.push(c[0], c[1], c[2]); }
      }
      const line = (a, b, y, n, sp) => { for (let i = 0; i < n; i++) { const yy = y + r.range(-3, 3), fwd = r.chance(0.5), A = fwd ? a : b, Bq = fwd ? b : a;
        aP.push(A[0], yy, A[1], 0); aE.push(Bq[0], yy + r.range(-4, 4), Bq[1], 1); aQ.push(r.range(sp * 0.7, sp * 1.3), r(), r.range(7, 15), r.range(0.5, 0.9)); const c = hexLin(r.pick(r.chance(0.5) ? tails : heads)); aK.push(c[0], c[1], c[2]); } };
      for (const y of [28, 104, 150, 200, 250]) line(leg2(340, -330), leg2(340, 330), y, 7, 34);
      for (const y of [70, 110, 170, 230]) { line(leg2(585, -12), leg2(900, -12), y, 4, 30); }
      const n = aQ.length / 4, g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -0.5, 0, 0, -0.5, 0, 0, 0.5, 0, -1, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(aP), 4)); g.setAttribute('aE', new THREE.InstancedBufferAttribute(new Float32Array(aE), 4));
      g.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(aQ), 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(aK), 3)); g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: time, ...fogU, ...canyonUniforms() }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          uniform float uTime; attribute vec4 aP, aE, aQ; attribute vec3 aK;
          varying vec2 vU; varying vec3 vCol; varying float vFade, vDist;
          ${CANYON_GLSL}
          void main(){
            vec3 c, dir;
            if (aE.w < .5) {
              float range = aP.w - aP.z, s = aP.z + mod(aQ.y * range + uTime * aQ.x, range); vec2 d2; vec2 xz = canyonXZ(s, aP.x, d2);
              c = vec3(xz.x, aP.y + sin(s * .021 + aQ.y * 40.) * 2.5, xz.y); dir = vec3(d2.x, 0., d2.y) * sign(aQ.x);
              vFade = smoothstep(0., 40., s - aP.z) * smoothstep(0., 40., aP.w - s);
            } else {
              vec3 ab = aE.xyz - aP.xyz; float L = length(ab), f = fract(aQ.y + uTime * aQ.x / L);
              c = aP.xyz + ab * f; dir = ab / L; vFade = smoothstep(0., .08, f) * smoothstep(1., .92, f);
            }
            vec3 toCam = cameraPosition - c; float dC = length(toCam);
            vec3 sd = normalize(cross(dir, toCam / dC));
            vec3 wp = c + dir * position.x * aQ.z + sd * position.y * max(aQ.w, dC * .0026);
            vU = position.xy; vCol = aK; vDist = dC;
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vU; varying vec3 vCol; varying float vFade, vDist;
          ${FOG_GLSL}
          void main(){
            float x = -vU.x, across = 1. - smoothstep(.15, .5, abs(vU.y));
            vec3 col = (vCol * (1. - x) * (1. - x) * .5 + mix(vCol, vec3(1.), .55) * exp(-x * 13.) * 2.6) * across * vFade;
            gl_FragColor = vec4(col * (1. - .82 * nmFog(vDist)), 1.);
          }`,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; scene.add(mesh);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ weather: rain near and far, steam, street haze
    const set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, count: Math.round(6500 * downpour), box: [90, 60, 90], velocity: [windX, -30, 1.5],
      size: [0.035, 0.07], stretch: 0.045, intensity: 0.9, opacity: 0.4, colors: ['#9fb8e8', '#cfe0ff', mixHex(COL_R, '#ffffff', 0.5)] }));
    set.add(fx.makeParticles({ rng: rng.fork('rain2'), preset: 'rain', time, count: Math.round(1300 * downpour), box: [20, 16, 20], velocity: [windX, -30, 1.5],
      size: [0.012, 0.022], stretch: 0.06, intensity: 0.8, opacity: 0.3 }));
    // the innermost rain: a few long streaks right in front of the lens
    set.add(fx.makeParticles({ rng: rng.fork('rain3'), preset: 'rain', time, count: Math.round(260 * downpour), box: [8, 6, 8], velocity: [windX, -30, 1.5],
      size: [0.006, 0.011], stretch: 0.12, intensity: 0.8, opacity: 0.18 }));
    const ventS = [612, 676, 730, 772, 806, 838], ventNear = { 3: 9, 5: -9 }, nearVents = [];   // two of the six stand among the stalls, close to the flight line
    ventS.forEach((s, i) => {
      const near = ventNear[i], p = canyon(s + (near ? 0 : rng.range(-8, 8)), near || (i % 2 ? 1 : -1) * rng.range(15, 20));
      if (near) nearVents.push(p.slice());
      set.add(fx.makeSmokeColumn({ rng: rng.fork('vent' + i), time, position: [p[0], 0.3, p[1]], height: near ? rng.range(17, 21) : rng.range(24, 36), radius: near ? [0.7, 3.4] : [0.9, 6], size: near ? [2, 7] : [2.6, 11], count: 46,
        color: '#8088b4', colorTop: '#464a78', shadowColor: '#241c3c', hot: '#402408', hotFalloff: 9, opacity: 0.36, rate: 0.085, wind: [windX * 0.12, 0, 0.5],
        sunDir: [i % 2 ? -0.8 : 0.8, 0.4, 0.3], rim: 0.5 }));
    });
    set.add(fx.makeGroundFog({ time, layers: 2, size: 900, y: 4, height: 22, color: '#a8623a', opacity: 0.07, coverage: 0.55, scale: 0.012, wind: [windX * 0.2, 0.6] }));
    set.add(fx.makeMist({ rng: rng.fork('mist'), time, count: 30, area: [70, 12, 380], center: [C[0], 9, C[1] - 190], size: [16, 34], color: mixHex(AMBER, '#8a70c8', 0.65), opacity: 0.05, drift: [windX * 0.12, 0, 0.7] }));
    await ctx.yield();

    // ------------------------------------------------------------------ life: pigeons off a ledge, a shoal of small koi holograms
    const neonLight = { sunDir: [0.5 * ps, 0.5, 0.4], sunColor: COL_R, sunIntensity: 1.1, sky: '#7468d8', skyIntensity: 1.0, ground: '#ff9a3c', groundIntensity: 0.8 };
    const pigeons = F.makeFlock({ rng: rng.fork('pigeons'), species: 'crows', count: rng.int(50, 80), size: 0.9, speed: 16, flap: 6.5, amp: 0.75, glide: 0.08, light: neonLight,
      body: '#8f96a8', belly: '#aab0c0', wingC: '#727a90', trail: '#cfd3de', tip: '#3a3e4a', head: '#5c6480', beak: '#d0a070',
      cross: { path, u: 0.165, window: 0.13, lead: 42, span: 210, angle: 58, side: -ps, height: -14 } });
    scene.add(pigeons.object);
    await ctx.yield();                                             // a hand-back after each kit call from here to the crowd: together they were one step
    const shoal = F.makeFishSchool({ rng: rng.fork('shoal'), species: 'koi', count: rng.int(5, 10), size: rng.range(10, 15), speed: 2.6, center: [-8 * ps, 172, -205], spread: [26, 14], caustics: 0,
      light: { sunDir: [0, 1, 0], sunColor: '#ffffff', sunIntensity: 0.8, sky: '#c8ecff', skyIntensity: 2.4, ground: '#ffb060', groundIntensity: 2 } });
    shoal.material.transparent = true; shoal.material.blending = THREE.AdditiveBlending; shoal.material.depthWrite = false; shoal.object.renderOrder = 3;
    scene.add(shoal.object);
    await ctx.yield();

    // ------------------------------------------------------------------ the market street: stalls, strings of bulbs, laundry
    const zG = portalPos.z, zM0 = C[1] - 134, zM1 = zG + 26;
    {
      const pos = [], yaws = [], r = rng.fork('market');
      for (let z = zM0; z > zM1; z -= 8.5) for (const lat of [-17, -9.5, 9.5, 17]) {
        if (r.chance(0.12)) continue;
        if (nearVents.some((v) => Math.hypot(v[0] - C[0] - lat, v[1] - z) < 6.5)) continue;
        pos.push([C[0] + lat + r.range(-0.6, 0.6), 0, z + r.range(-1.5, 1.5)]); yaws.push((lat > 0 ? -1 : 1) * (Math.abs(lat) < 12 ? 1 : -1) * Math.PI / 2);
      }
      const market = await S.makeMarketAsync({ rng: r, mats, positions: pos, yaws }, ctx.yield, 1); scene.add(market.object);   // the market laid a stall at a time, handing back between
      await ctx.yield();
      const spans = [], sb = BLD('props');
      sb.col(TRIM, 0.6, 1).surf(SU.PLAIN);
      for (const sx of [-1, 1]) {
        let prev = null;
        for (let z = zM0 + 6; z > zM1 - 4; z -= 17) {
          const a = [C[0] + sx * 6.6, 7.6 + r.range(-0.4, 0.4), z + r.range(-2, 2)];
          sb.cbox(a[0], 0, a[2], 0.22, a[1], 0.22, {});
          if (prev) spans.push([prev, a]);
          spans.push([a, [C[0] + sx * 27.5, 10.5 + r.range(-1.5, 3), a[2] + r.range(-5, 5)]]);
          prev = a;
        }
      }
      // paper lanterns: small, dim enough that the paper keeps its colour, and none within 12 m of the flight line
      const lanterns = S.makeLanterns({ rng: r, mats, count: 80, shape: 'round', float: false, sway: 0.3, size: 0.95, haloSize: 1.0, area: { center: [C[0], 10, (zM0 + zM1) / 2], size: [50, 8, zM0 - zM1 + 30] },
        colors: ['#ffb35a', '#ff8a3c', '#ff6a4a', '#ff5a8a', COL_L].map((h) => hexLin(h, 0.6)), clear: (x, y, z) => path.distanceTo(x, y, z) > 12 });
      scene.add(lanterns.object);
      await ctx.yield();
      // a row of bulbs under the front edge of every awning
      const under = pos.map((q, i) => { const c = Math.cos(yaws[i]), sn = Math.sin(yaws[i]), W = (lx, lz) => [q[0] + lx * c + lz * sn, 1.74, q[2] - lx * sn + lz * c]; return [W(-1.45, 1.6), W(1.45, 1.6)]; });
      const bulbs = S.makeStringLights({ rng: r, mats, spans: under, sag: 0.04, spacing: 0.58, size: 0.2, colors: ['#ffc070', '#ffd9a0', '#ff9a50'], twinkle: 0.5 });
      scene.add(bulbs.object);
      await ctx.yield();
      const strings = S.makeStringLights({ rng: r, mats, spans, sag: 0.11, spacing: 1.5, size: 0.42, colors: ['#ffd9a0', '#ffd9a0', COL_L, COL_R, AMBER], twinkle: 1 });
      scene.add(strings.object);
      await ctx.yield();
      // laundry on lines along the balconies: small cloths swaying in the wet wind
      const n = 150, g = new THREE.InstancedBufferGeometry(), iP = new Float32Array(n * 4), iS = new Float32Array(n * 4), iK = new Float32Array(n * 3);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -1, 0, 0.5, -1, 0, 0.5, 0, 0, -0.5, 0, 0, -0.5, -0.5, 0, 0.5, -0.5, 0], 3)); g.setIndex([0, 1, 5, 0, 5, 4, 4, 5, 2, 4, 2, 3]);
      const cloth = ['#e8e4dc', '#c8d8f0', '#f0c8d0', '#d8e8c0', '#f0d890', '#b0b8d0', '#e06a5a', '#5a8ad0'];
      for (let i = 0, line = 0, lz = 0, ly = 0, lsx = 1; i < n; i++) {
        if (i % 6 === 0) { lsx = r.sign(); lz = lerp(C[1] - 140, zG + 10, r()); ly = 10.4 + 3.6 * r.int(0, 4); line++; }
        iP.set([C[0] + lsx * (HALF - 1.7), ly - 0.1 - 0.12 * Math.sin((i % 6) / 5 * Math.PI), lz + (i % 6) * 1.7, r() * TAU], i * 4);
        iS.set([r.range(0.9, 1.5), r.range(1.0, 2.2), lsx, r.range(0.6, 1.3)], i * 4); iK.set(hexLin(r.pick(cloth), 0.5), i * 3);
      }
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); g.setAttribute('iK', new THREE.InstancedBufferAttribute(iK, 3)); g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: time, ...fogU, uColL: { value: new THREE.Color(COL_L) }, uColR: { value: new THREE.Color(COL_R) } }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`uniform float uTime; attribute vec4 iP, iS; attribute vec3 iK; varying vec3 vCol, vW; varying float vSide, vY;
          void main(){
            float hang = -position.y, sw = sin(uTime * 1.9 * iS.w + iP.w + hang * 1.6) * .28 * hang + sin(uTime * .7 + iP.w * 3.) * .2 * hang;
            vec3 wp = vec3(iP.x - iS.z * sw, iP.y + position.y * iS.y, iP.z + position.x * iS.x * (1. - .12 * hang));
            vCol = iK; vW = wp; vSide = iS.z; vY = hang;
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
          }`,
        fragmentShader: /* glsl */`uniform vec3 uColL, uColR; varying vec3 vCol, vW; varying float vSide, vY; ${FOG_GLSL}
          void main(){
            vec3 key = vSide > 0. ? uColL : uColR;                 // each wall is lit by the signs across the street
            vec3 col = vCol * (vec3(.22, .2, .34) + key * .55 + vec3(1., .6, .25) * .35 * vY);
            gl_FragColor = vec4(mix(col, uFogC, nmFog(length(vW - cameraPosition))), 1.);
          }`,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();
    {                                                              // the crowd: people under lit umbrellas drifting between the stalls
      const r = rng.fork('people'), n = 150;
      const cone = new THREE.SphereGeometry(0.8, 8, 3, 0, TAU, 0, 1.05).scale(1, 0.6, 1).translate(0, 1.53, 0).toNonIndexed(), box = new THREE.BoxGeometry(0.4, 1.66, 0.28).translate(0, 0.83, 0).toNonIndexed();
      const nb = box.attributes.position.count, nc = cone.attributes.position.count, pa = new Float32Array((nb + nc) * 3), na = new Float32Array((nb + nc) * 3), part = new Float32Array(nb + nc);
      pa.set(box.attributes.position.array, 0); pa.set(cone.attributes.position.array, nb * 3); na.set(box.attributes.normal.array, 0); na.set(cone.attributes.normal.array, nb * 3); part.fill(1, nb);
      cone.dispose(); box.dispose();
      const g = new THREE.InstancedBufferGeometry(), iP = new Float32Array(n * 4), iK = new Float32Array(n * 3);
      g.setAttribute('position', new THREE.BufferAttribute(pa, 3)); g.setAttribute('normal', new THREE.BufferAttribute(na, 3)); g.setAttribute('aPart', new THREE.BufferAttribute(part, 1));
      const brolly = ['#ff5a7a', '#ffd27a', '#7ae0ff', '#e8ecff', '#ff9a3c', '#9a7aff', '#6affc0', COL_L, COL_R];
      for (let i = 0; i < n; i++) {
        const lane = r.pick([4.6, 5.8, 6.9, 6.9, 12.6, 13.6, 20.2, 21.6]) * r.sign() + r.range(-0.5, 0.5), still = r.chance(0.22);
        iP.set([C[0] + lane, r(), still ? 0 : r.sign() * r.range(0.7, 1.5), r()], i * 4); iK.set(hexLin(r.pick(brolly), r.range(0.7, 1.1)), i * 3);
      }
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iK', new THREE.InstancedBufferAttribute(iK, 3)); g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: time, ...fogU, uColL: { value: new THREE.Color(COL_L) }, uColR: { value: new THREE.Color(COL_R) }, uZ: { value: new THREE.Vector3(zM0 + 18, zM1 - 8, C[0]) } },
        vertexShader: /* glsl */`uniform float uTime; uniform vec3 uZ; attribute vec4 iP; attribute vec3 iK; attribute float aPart;
          varying vec3 vCol, vW, vN; varying float vPart, vH;
          void main(){
            float range = uZ.x - uZ.y, f = fract(iP.y + uTime * iP.z / range), fade = smoothstep(0., .02, f) * smoothstep(1., .98, f);
            float gait = uTime * abs(iP.z) * 4.2 + iP.w * 40., a = (iP.w - .5) * 1.2 + (iP.z < 0. ? 3.1416 : 0.), ca = cos(a), sa = sin(a);
            vec3 p = position; p.xz = vec2(p.x * ca + p.z * sa, -p.x * sa + p.z * ca);
            p.y += abs(sin(gait)) * .05 + aPart * (.04 * sin(uTime * 1.3 + iP.w * 60.) + (iP.w - .5) * .3);
            p.x += aPart * (.12 * sin(uTime * .9 + iP.w * 20.)) + sin(gait * .5) * .03 * step(position.y, .9);
            vec3 wp = vec3(iP.x + sin(uTime * .23 + iP.w * 30.) * .35, 0., uZ.x - f * range) + p * fade;
            vCol = iK; vW = wp; vN = normal; vPart = aPart; vH = position.y;
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
          }`,
        fragmentShader: /* glsl */`uniform vec3 uColL, uColR, uZ; varying vec3 vCol, vW, vN; varying float vPart, vH; ${FOG_GLSL}
          void main(){
            vec3 N = normalize(vN), key = mix(uColL, uColR, smoothstep(-10., 10., vW.x - uZ.z));
            vec3 col;
            if (vPart > .5) { float rib = .8 + .2 * step(.5, fract(atan(N.z, N.x) * 1.2732 + .5));          // translucent canopy lit from the stalls below
              col = vCol * (.26 + .4 * rib) * (.75 + .25 * N.y) + key * .06 + vec3(.5, .55, .7) * pow(max(N.y, 0.), 8.) * .06; }
            else col = vec3(.012, .013, .022) + vec3(1., .55, .2) * .025 * smoothstep(1.2, .1, vH) + key * .05 * (.4 + .6 * abs(N.x));
            gl_FragColor = vec4(mix(col, uFogC, nmFog(length(vW - cameraPosition))), 1.);
          }`,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the ring sign and the neon gateway
    const ringMat = (ca, cb, n) => new THREE.ShaderMaterial({
      uniforms: { uTime: time, ...fogU, uA: { value: new THREE.Color(ca) }, uB: { value: new THREE.Color(cb) }, uN: { value: n } },
      vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`uniform float uTime, uN; uniform vec3 uA, uB; varying vec2 vUv; varying vec3 vW; ${FOG_GLSL}
        void main(){
          float seg = step(fract(vUv.x * uN - uTime * .5), .72), chase = pow(.5 + .5 * sin(vUv.x * 18.85 - uTime * 2.4), 5.);
          vec3 col = mix(uA, uB, chase) * (1.5 + 2.6 * chase) * (.25 + .75 * seg);
          float f = nmFog(length(vW - cameraPosition));
          gl_FragColor = vec4(col * (1. - .6 * f) + uFogC * f * .5, 1.);
        }`,
    });
    const ring = new THREE.Group();
    {
      const c = path.pointAt(uRing), n = path.tangentAt(uRing).add(new THREE.Vector3(0.2 * rng.sign(), -0.12, 0)).normalize();
      ring.position.copy(c); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      ring.add(new THREE.Mesh(new THREE.TorusGeometry(15, 0.75, 10, 120), ringMat(COL_L, AMBER, 40)), new THREE.Mesh(new THREE.TorusGeometry(13.2, 0.16, 6, 96), ringMat(AMBER, AMBER, 1)));
      scene.add(ring);
      const pods = []; for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; pods.push(new THREE.Vector3(Math.cos(a) * 16.6, Math.sin(a) * 16.6, 0).applyQuaternion(ring.quaternion).add(c)); }
      const podGlow = fx.makeGlows({ time, positions: pods, color: '#bfe8ff', size: 5, intensity: 1.6, flicker: 0.3, fogAmount: 0.4 }); scene.add(podGlow.object); updaters.push(podGlow);
    }
    {
      const gate = new THREE.Group(); gate.position.copy(portalPos);
      gate.add(new THREE.Mesh(new THREE.TorusGeometry(8.8, 0.42, 12, 120), ringMat(COL_R, '#ffffff', 48)), new THREE.Mesh(new THREE.TorusGeometry(10.1, 0.13, 6, 96), ringMat(COL_L, COL_L, 1)));
      scene.add(gate);
      const gb = BLD('props'), gx = portalPos.x, gz = portalPos.z;
      gb.col(S.lin('#2c3040'), 0.6, 1).surf(SU.PLAIN);
      for (const sx of [-1, 1]) {
        gb.cbox(gx + sx * 13.6, 0, gz - 1.6, 5, 27, 2.2, {}); gb.box(gx + sx * 8.6 - 1.2, 0, gz - 1, gx + sx * 8.6 + 1.2, 3.2, gz + 1, {});
        gb.beam([gx + sx * 11.2, 20, gz - 1], [gx + sx * 6.4, 15.4, gz - 0.4], 0.5, 0.5); gb.beam([gx + sx * 11.2, 4, gz - 1], [gx + sx * 8, 5, gz - 0.4], 0.5, 0.5);
      }
      gb.box(gx - 16.2, 26, gz - 2.8, gx + 16.2, 28.4, gz - 0.4, { bottom: true });
      gb.col(ACC_LIN.a).surf(SU.GLOW, 0, 0.9); gb.box(gx - 16.2, 25.5, gz - 0.5, gx + 16.2, 26, gz - 0.3, { bottom: true });
      const glow = fx.makeGlow({ time, position: [gx, portalPos.y, gz + 0.5], color: COL_R, size: 46, intensity: 0.5, core: 0, fogAmount: 0.35 }); scene.add(glow.object); updaters.push(glow);
    }
    const city = new THREE.Group(); scene.add(city);
    for (const k in builders) { const g = builders[k].toGeometry(); g.computeBoundingSphere(); city.add(new THREE.Mesh(g, FAC)); }
    await ctx.yield();

    // ------------------------------------------------------------------ per-frame
    const camDir = new THREE.Vector3(), ref = new THREE.Vector3(), flashP = new THREE.Vector2();
    const selI = new Int32Array(8), selD = new Float32Array(8), koiC = new THREE.Vector3();
    const koiGlow = [0, 2, 4].map((i) => ({ p: HA.glowPoints[i].position, r: HA.glowPoints[i].radius, c: hexLin(HA.glowPoints[i].color, HA.glowPoints[i].intensity * 1.3) }));
    const gateCol = hexLin(mixHex(COL_R, '#ffffff', 0.2), 4.4);
    const setLights = (camera, u) => {                             // 0 gateway, 1-3 the koi, the rest: the signs nearest the view
      const LP = streetU.uLP.value, LC = streetU.uLC.value, k = koiS(u), vis = hero.uniforms.uReveal.value;
      LP[0].set(portalPos.x, portalPos.y, portalPos.z, 11); LC[0].set(gateCol[0], gateCol[1], gateCol[2]);
      for (let i = 0; i < 3; i++) { const gp = koiGlow[i], p = leg2(k - gp.p.z, KOI_LAT + gp.p.x); LP[1 + i].set(p[0], gp.p.y, p[1], gp.r); LC[1 + i].set(gp.c[0] * vis, gp.c[1] * vis, gp.c[2] * vis); }
      camera.getWorldDirection(camDir); ref.copy(camera.position).addScaledVector(camDir, 70);
      // the four nearest signs on each wall (so both key colours streak the road), by insertion: no sort, no allocation
      selI.fill(-1); selD.fill(1e12);
      for (let i = 0; i < streetLights.length; i++) {
        const sl = streetLights[i], dx = sl.p[0] - ref.x, dz = sl.p[2] - ref.z, d = dx * dx + dz * dz, o = sl.side > 0 ? 0 : 4;
        if (d >= selD[o + 3]) continue;
        let j = o + 3; while (j > o && selD[j - 1] > d) { selD[j] = selD[j - 1]; selI[j] = selI[j - 1]; j--; }
        selD[j] = d; selI[j] = i;
      }
      for (let j = 0; j < NL - 4; j++) {
        const sl = selI[j] >= 0 ? streetLights[selI[j]] : null;
        if (!sl) { LP[4 + j].set(0, -999, 0, 1); LC[4 + j].set(0, 0, 0); continue; }
        const fade = 1 - smoothstep(170 * 170, 290 * 290, selD[j]);
        LP[4 + j].set(sl.p[0], sl.p[1], sl.p[2], sl.r); LC[4 + j].set(sl.c[0] * fade, sl.c[1] * fade, sl.c[2] * fade);
      }
    };
    const ringInner = ring.children[1];

    return {
      scene, path, duration: 44, title: 'Neon Monsoon',
      camera: { fov: 64, near: 0.3, far: 2200, lookAhead: 30, sway: 1, bank: 1 },
      pois: [
        { at: [AX, 160, -150], from: 0.04, to: 0.2, weight: 0.22 },
        { at: (() => { const p = leg2(340, -8); return [p[0], 62, p[1]]; })(), from: uMag - 0.12, to: uMag + 0.01, weight: 0.18 },
        { at: (tt, uu) => eyeAt(uu), from: uEye - 0.15, to: uEye + 0.05, weight: 0.6 },
        { at: (tt, uu) => tailAt(uu), from: uEye + 0.02, to: uTail + 0.02, weight: 0.35 },   // hold the gaze on the tail fan until the camera is through it
      ],
      portal: { shape: 'circle', radius: 7, color: mixHex(COL_R, '#ffffff', 0.35), glow: 1.2, revealDistance: 300 },
      post: {
        exposure: 1.05, bloom: { strength: 0.5, radius: 0.8, threshold: 0.95 },
        grade: { saturation: 1.12, contrast: 1.06, tint: '#f1f2ff', shadowTint: '#0a0618', vignette: 0.42, grain: 0.035, aberration: 0 },
      },
      update(dt, t, camera, u) {
        time.value = t;
        train.update(dt, trainD(u)); mats.update(dt, t);           // the train is keyed to u; restore the kit clock afterwards
        placeKoi(u); hero.update(dt, t, camera);
        {                                                          // the hologram dims as the camera comes alongside, so the close pass keeps its pattern
          koiC.copy(camera.position).sub(koiPos).applyAxisAngle(THREE.Object3D.DEFAULT_UP, -heroYaw);
          const dz = koiC.z - clamp(koiC.z, -52, 50), dC = Math.hypot(koiC.x, koiC.y - ALT, dz);
          hero.uniforms.uIntensity.value = HERO_I * lerp(0.45, 1, smoothstep(14, 80, dC));
        }
        garden.update(dt, t, camera);
        ceiling.position.set(camera.position.x, 0, camera.position.z);
        const fl = flashAt(t, flashP);
        ceilU.uFlash.value = fl; ceilU.uFlashP.value.set(camera.position.x + flashP.x, camera.position.z + flashP.y);
        streetU.uFlash.value = fl; hemi.intensity = 0.55 + 0.28 * fl;
        skyline.update(dt, t, camera); set.update(dt, t, camera);
        for (const x of updaters) x.update(dt, t, camera);
        pigeons.object.visible = u < 0.5; if (pigeons.object.visible) pigeons.update(dt, t, camera, u);
        shoal.update(dt, t, camera, u);
        ringInner.rotation.z = t * 0.25;
        setLights(camera, u);
      },
      dispose() { hero.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
