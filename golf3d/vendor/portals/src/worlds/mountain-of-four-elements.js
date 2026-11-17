// The Mountain of Four Elements: one polar island volcano at sunrise, climbed in one unbroken flight from its icy
// sea, up a canyon of tilted beds, across the crater's dark lake of lava and out between pale pillars above a sea of
// cloud. This file is THE PLACE: land, sea and floes, lake and plume, cloud bank, pillars, the sky monastery on the pillars, sky,
// the light by height, blossom trees, far birds, the flown line, camera, ring and post. The led matter of the four stretches is the part
// src/parts/mountain-of-four-elements.js, called here and never edited here.
//
// AXES: +x east, +y up, +z south; a compass heading h gives the direction (sin h, 0, -cos h). Metres; sea level y 0;
// the crater's centre is x 0, z 0. A place on the flown line is given as s metres from the entry.
// LIGHT BY HEIGHT (by place only): the sun stands at heading 120, 5 degrees up; its direct light is
// smoothstep(60, 150, world y) times the land's own shadow. Under it the dawn sky's fill and the glow of the east
// carry the light; in the crater the lake's fire lights the rock.
// The land's great forms are the same on every seed (its noise has a fixed seed); a seed deals the cleft's ledges, the slabs' beds (the part's plan), the pillars, the sky monastery's towers, the plume's foot, the cloud heads and the dressing.
// The way out is drawn only on the final straight: portal.drawWithin is the straight's own length (the line's length less the turn's final knot's s: 110.10 m); portal.drawIn is not set.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudFieldAsync } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as part from '../parts/mountain-of-four-elements.js';

const D2R = Math.PI / 180;
const dirOf = (h, e = 0) => new THREE.Vector3(Math.sin(h * D2R) * Math.cos(e * D2R), Math.sin(e * D2R), -Math.cos(h * D2R) * Math.cos(e * D2R));
const SUN_DIR = dirOf(120, 5), GLOW_DIR = dirOf(105, 4);
// the sky's own colours: the kit's dawn sky takes them, and the way out's veil takes the one that stands behind it
const SKY = { zenith: '#112a60', mid: '#23428a', horizon: '#5a72ba', ground: '#2c3a66' };
const SEA_Y = 0, LAKE_Y = 110, LAKE_R = 95, BAND_Y0 = 60, BAND_Y1 = 150, CLOUD_TOP = 176;
const TURN_C = [185, 86], TURN_R = 100, TURN_H0 = 90, TURN_H1 = 235, TURN_KNOTS = 10;
// the cleft's half width (the design: a gully 26 m wide); a pillar's skirt flares by this share at its foot, and its two grains of
// roughness add these shares to its radius (one rule for the rock's form and for the places that must clear it)
const CLEFT_HW = 13, PILLAR_FLARE = 0.55, PILLAR_ROUGH = [0.22, 0.1];
// ONE SWITCH for the sky monastery on the summit's pillars (the lead's addition to leg six; the owner's ruling of 04:46Z lifts
// his term 2 for it): false leaves the whole set out and changes nothing else (its stream is its own; no other stream draws for it)
const SKY_MONASTERY = true;
// the lava's own three colours (the lake's cracks and the glowing cracks of the wall beside it); the plume's height and the wind
// that leans it; the cleft's foot on the line (where its bed leaves the lake's shore)
const LAVA_HOT = ['#7a1408', '#ff7a1a', '#ffe08a'], PLUME_H = 196, PLUME_WIND = [-2.6, 0, -2.4], CLEFT_S0 = 835;
// the ball of clear air the cloud sea keeps round the crater and its rim
const CRATER_CLEAR = 226;
// stand-in stations of the gates (used only where the part gives no plan of its own); the canyon's right-hand wall is broken near these three
const GATE_S0 = 290, GATE_STEP = 42, GATE_N = 8, GAPS = [300, 410, 520];
// tilted beds: they dip 20 degrees toward heading 205 (down the canyon)
const DIPX = Math.sin(205 * D2R), DIPZ = -Math.cos(205 * D2R), DIP = Math.tan(20 * D2R);
const lin = (hex) => new THREE.Color(hex);

// ---------------------------------------------------------------- the flown line
const WAY_TO_TURN = [
  [-312.7, 10, 670.7], [-283.2, 9, 607.2], [-249.3, 9, 534.7], [-219.8, 11, 471.3], [-184.7, 26, 410.4], [-146.1, 56, 351.2],
  [-125.6, 90, 283.5], [-108.7, 120, 214.1], [-71.8, 148, 154.1], [-43.7, 136, 103.2], [-6.9, 124, 57.5], [38, 124, 20],
  [90, 134, -4], [140, 166, -10],
];
// the turn: one even right-hand circle of 100 m about (185, 86) from heading 90 round to heading 235; lens heights by heading
const TURN_Y = [[90, 196], [120, 204], [150, 208], [180, 210], [210, 210], [235, 209]];
function linePoints() {
  const pts = WAY_TO_TURN.map((p) => p.slice());
  const yAt = (h) => {
    for (let i = 1; i < TURN_Y.length; i++) if (h <= TURN_Y[i][0]) { const a = TURN_Y[i - 1], b = TURN_Y[i]; return lerp(a[1], b[1], (h - a[0]) / (b[0] - a[0])); }
    return TURN_Y[TURN_Y.length - 1][1];
  };
  for (let i = 0; i <= TURN_KNOTS; i++) {
    const h = TURN_H0 + (TURN_H1 - TURN_H0) * i / TURN_KNOTS, a = (h - 90) * D2R;
    pts.push([TURN_C[0] + TURN_R * Math.sin(a), yAt(h), TURN_C[1] - TURN_R * Math.cos(a)]);
  }
  // then dead straight on heading 235, sinking gently to the way out
  const e = pts[pts.length - 1], dx = Math.sin(TURN_H1 * D2R), dz = -Math.cos(TURN_H1 * D2R);
  for (const d of [16, 55, 82.5, 110]) pts.push([e[0] + dx * d, e[1] - 4 * d / 110, e[2] + dz * d]);
  // (the way out, 110 m on: 152.3, 205, 231)
  return pts;
}

// ---------------------------------------------------------------- the land: one height function
// cone, radial ridges, the rim (low south and west, high east and north), the bowl, the east shoulder; then along
// the line: the canyon between two walls of tilted beds, the notch through the rim, the ramp inside it, the cleft.
function makeLand(core, path, hollows, cleft = []) {
  const N = core.makeNoise(90417);
  const S0 = 186, S1 = 966, DS = 3, n = Math.floor((S1 - S0) / DS) + 1;
  const wx = new Float32Array(n), wy = new Float32Array(n), wz = new Float32Array(n), tx = new Float32Array(n), tz = new Float32Array(n), hz = new Float32Array(n);
  const p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    path.posAtDist(S0 + i * DS, p); path.tangentAtDist(S0 + i * DS, t);
    const hl = Math.hypot(t.x, t.z) || 1;
    wx[i] = p.x; wy[i] = p.y; wz[i] = p.z; tx[i] = t.x / hl; tz[i] = t.z / hl; hz[i] = hl;
  }
  const W = { ok: false, s: 0, d: 0, y: 0 };
  // the nearest place of the line's ground stretches to (x, z): s, side distance d (right of travel positive), lens height
  const way = (x, z) => {
    let best = 1e12, bi = 0;
    for (let i = 0; i < n; i += 6) { const dx = x - wx[i], dz = z - wz[i], d2 = dx * dx + dz * dz; if (d2 < best) { best = d2; bi = i; } }
    if (best > 67600) { W.ok = false; return W; }
    const a = Math.max(0, bi - 6), b = Math.min(n - 1, bi + 6);
    for (let i = a; i <= b; i++) { const dx = x - wx[i], dz = z - wz[i], d2 = dx * dx + dz * dz; if (d2 < best) { best = d2; bi = i; } }
    const dx = x - wx[bi], dz = z - wz[bi];
    const f = clamp(bi + clamp((dx * tx[bi] + dz * tz[bi]) / (DS * hz[bi]), -0.5, 0.5), 0, n - 1), i0 = Math.min(n - 2, Math.floor(f)), u = f - i0;
    W.ok = true; W.s = S0 + f * DS; W.d = dz * tx[bi] - dx * tz[bi]; W.y = wy[i0] * (1 - u) + wy[i0 + 1] * u;
    return W;
  };
  const U_HI = [Math.sin(60 * D2R), -Math.cos(60 * D2R)], U_E = [Math.sin(100 * D2R), -Math.cos(100 * D2R)];
  const rimOf = (cx, cz, out) => {
    const hi = smoothstep(-0.05, 0.6, cx * U_HI[0] + cz * U_HI[1]), es = smoothstep(0.3, 0.8, cx * U_E[0] + cz * U_E[1]);
    const rn = N.n2(cx * 3.1 - 4, cz * 3.1 + 8);
    out.r = 150 + 35 * es; out.c = lerp(160 + 7 * rn, lerp(181, 194, es) + 5 * rn, hi); out.hi = hi; out.es = es;
    return out;
  };
  const RIM = { r: 150, c: 160, hi: 0, es: 0 };
  const natural = (x, z) => {
    const rr = Math.hypot(x, z), ir = 1 / (rr + 1e-6), cx = x * ir, cz = z * ir;
    const re = rr - 24 * N.fbm2(cx * 2.3 + 5.1, cz * 2.3 - 1.7, 2);
    // the canyon's own sector (heading 205) keeps the even 25 degree slope the line climbs; elsewhere the cone is hollow-flanked, steepest in its upper third
    const sw = smoothstep(0.5, 0.86, cx * DIPX + cz * DIPZ);
    let h = re < 500 ? lerp(163 * Math.pow(clamp((500 - re) / 350, 0, 1.2), 1.4), (500 - re) * 0.466, sw) : Math.max(-34, (500 - re) * 0.13);
    const fl = smoothstep(150, 250, rr) * (1 - smoothstep(430, 520, rr));
    const rid = 1 - Math.abs(N.n2(cx * 4.6 + 9.3 + rr * 0.0011, cz * 4.6 + 2.1));
    h += (rid * rid - 0.4) * 17 * fl + 5 * N.n2(x * 0.011, z * 0.011) * fl;
    const R = rimOf(cx, cz, RIM);
    h += 46 * R.es * smoothstep(120, 185, rr) * (1 - smoothstep(190, 400, rr));
    if (rr < R.r) {
      if (rr < LAKE_R) return LAKE_Y - 5 * smoothstep(LAKE_R, LAKE_R - 18, rr);
      // the bowl's inner wall, stepped in rough benches
      const hw = LAKE_Y + (R.c - LAKE_Y) * (1 - Math.pow(1 - (rr - LAKE_R) / (R.r - LAKE_R), 1.7 + 0.9 * R.hi)), tb = hw + 3 * N.n2(x * 0.02, z * 0.02);
      return hw + (stepper(tb, 10, 0.62) - tb) * smoothstep(LAKE_R, LAKE_R + 14, rr) * (1 - smoothstep(R.r - 16, R.r - 2, rr));
    }
    return lerp(R.c, h, smoothstep(0, 55, rr - R.r));
  };
  const stepper = (v, step, sharp) => { const k = v / step, f = Math.floor(k), w = 0.5 * (1 - sharp); return (f + smoothstep(0.5 - w, 0.5 + w, k - f)) * step; };
  const bedOf = (y, x, z) => y + DIP * (x * DIPX + z * DIPZ);
  // each stretch of the right-hand wall ends in a sloping shoulder: an opening is 22 m to either side at the floor and 56 m at
  // the wall's top, and its edge frays with the distance from the line, so no end of a wall stands as a straight upright face
  const gapK = (s, q = 0) => {
    const fray = q > 0 ? (9 * N.n2(s / 13 + 5.1, q / 8 + 2.7) + 4 * N.n2(s / 5.3 + 1.9, q / 4.1 + 6.3)) * smoothstep(2, 14, q) : 0;
    let k = 0; for (const g of GAPS) k = Math.max(k, 1 - smoothstep(22, 56, Math.abs(s - g) + fray)); return k;
  };
  const wallH = (s, side) => (50 + 13 * (0.5 + 0.5 * N.n2(s / 85 + side * 3.7, 1.3))) * smoothstep(204, 262, s) * lerp(1, 0.42, smoothstep(470, 596, s)) * lerp(1, 1.3, smoothstep(270, 360, s));
  const halfW = (s) => lerp(20.5 + 1.5 * N.n2(s / 60, 7.7), 15, smoothstep(588, 612, s));
  // a hollow may lie askew of the line: its long axis is turned by yaw about the line's point at its s (the part says how far)
  const pits = hollows.map((o) => ({ s: o.s, d0: o.d0, d1: o.d1, halfS: o.halfS, depth: o.depth, cy: Math.cos(o.yaw || 0), sy: Math.sin(o.yaw || 0) }));
  const hollowAt = (s, d) => {
    let dep = 0;
    for (const o of pits) {
      const ds = s - o.s; if (Math.abs(ds) > o.halfS + 16) continue;
      const dd = d * o.cy - ds * o.sy, ss = Math.abs(ds * o.cy + d * o.sy);
      const k = (1 - smoothstep(o.halfS - 0.2, o.halfS + 1, ss)) * smoothstep(o.d0 - 0.6, o.d0 + 0.6, dd) * (1 - smoothstep(o.d1 - 0.6, o.d1 + 0.6, dd));
      dep = Math.max(dep, o.depth * k);
    }
    return dep;
  };
  // the cleft: the depth of its bed under the line, and its ledges made ready (a ledge's riser is measured at the middle of
  // its own span, where its lip crosses; from there its tread runs as a plane of the mountain's beds)
  const cleftDepth = (s) => lerp(lerp(8, 11.5, smoothstep(835, 880, s)), 10, smoothstep(930, 949, s));
  const ledges = cleft.map((c) => {
    const end = 13 - c.span * 26, dm = c.side * 0.5 * (13 + end), tan = Math.tan(c.ang * D2R), sm = c.s + tan * dm + c.cv * dm * dm / 13;
    const f = clamp((sm - S0) / DS, 0, n - 1.001), i = Math.floor(f), u = f - i;
    return {
      s: c.s, side: c.side, end, tan, cv: c.cv, ph: c.ph, x: lerp(wx[i], wx[i + 1], u) - tz[i] * dm, z: lerp(wz[i], wz[i + 1], u) + tx[i] * dm,
      top: lerp(wy[i], wy[i + 1], u) - cleftDepth(sm) + c.r,
    };
  });
  const land = (x, z) => {
    const hn = natural(x, z), w = way(x, z);
    if (!w.ok) return hn;
    const s = w.s, d = w.d, ad = Math.abs(d), ly = w.y;
    let h = hn;
    if (s < 612 && ad < 215) {
      // the canyon: a floor of flat beds 6 m under the line, walls stepped along the beds, three gaps in the right-hand wall
      const fy = ly - 6, q = ad - halfW(s), side = d > 0 ? 1 : -1;
      let y;
      if (q <= 0) {
        const b = bedOf(fy, x, z);
        y = fy + (stepper(b, 1.5, 0.8) - b) * 0.8 - hollowAt(s, d);
      } else {
        // a gap is cut down to a low sill, so the low light that comes through it lies across the floor as well as on the far wall
        // the right-hand wall stands lower than the left and opens in three wide gaps: from the summit one looks into the canyon over it
        // (between its first two gaps it is no more than a low scarp, so the lower reach lies open to the dawn and to the eye above)
        const rw = side > 0 ? lerp(0.6, 0.16, smoothstep(322, 338, s) * (1 - smoothstep(372, 388, s))) : 1;
        const g = side > 0 ? gapK(s, q) : 0, wh = lerp(wallH(s, side) * rw, 1, g);
        const yS = fy + wh * (1 - Math.pow(1 - clamp(q / 22, 0, 1), 2.0));
        const b = bedOf(yS, x, z) + 2.2 * N.n2(x / 50, z / 50);
        // (the beds' ledges run on over a shoulder and die out only in the opening itself, so a wall's end is stepped, not sliced)
        y = Math.max(fy, yS + (stepper(b, 13, 0.72) - b) * smoothstep(0, 6, q) * (1 - g * g * g));
        y = lerp(y, hn, side > 0 ? smoothstep(34, 84, q) : smoothstep(44, 150, q));
        // east of the canyon a side gully runs beside it: from the summit one looks over it and through the gaps into the canyon
        if (side > 0) y -= 36 * smoothstep(26, 70, q) * (1 - smoothstep(125, 200, q)) * smoothstep(250, 330, s) * (1 - smoothstep(540, 592, s));
      }
      h = lerp(hn, y, smoothstep(196, 224, s) * (1 - smoothstep(590, 612, s)));
    }
    if (s > 572 && s < 700) {
      // the notch through the low rim (30 m wide at its floor) and the ramp down the inner wall
      const fy = ly - lerp(6, 7.5, smoothstep(600, 660, s)), q = ad - 15;
      h = lerp(h, Math.min(h, fy + (q > 0 ? q * 1.5 : 0)), smoothstep(572, 598, s) * (1 - smoothstep(684, 700, s)));
    }
    if (s > 822) {
      // the cleft in the high east wall: a gully 26 m wide between uneven stepped sides. Its bed is sloping broken rock, and on
      // it lie BROKEN LEDGES (dealt from the cleft's own stream): each springs from one wall and ends a third to two thirds of
      // the way across, its lip curved and oblique to the gully, its tread a plane that dips with the mountain's beds and dies
      // into the slope where the slope overtakes it. No two lips are level or evenly spaced. Nothing of the bed stands nearer
      // than 4.5 m under the line.
      const rough = smoothstep(835, 850, s) * (1 - smoothstep(940, 955, s));
      const base = ly - cleftDepth(s) + (1.1 * N.n2(x / 7.3, z / 7.3) + 0.5 * N.n2(x / 2.9 + 4.1, z / 2.9)) * rough;
      let f = base;
      for (const g of ledges) {
        const us = s - (g.s + g.tan * d + g.cv * d * d / 13 + 0.9 * N.n2(d / 3.1 + g.ph, 1.7));
        if (us < -4 || us > 22) continue;
        const across = smoothstep(g.end - 2.5, g.end + 1.5, d * g.side + 1.6 * N.n2(s / 4.3 + g.ph, 5.5));
        if (across <= 0) continue;
        const tread = g.top - DIP * ((x - g.x) * DIPX + (z - g.z) * DIPZ);
        f = Math.max(f, base + Math.max(0, tread - base) * smoothstep(-2.6, 0.4, us) * across);
      }
      f = Math.min(f, ly - 4.5);
      // (the gully's MOUTH FLARES where it opens on the lake: its floor is 8 m broader on each side there, narrowing to the
      // gully's own width by 31 m up from its foot; on those two flats the mouth's two clumps of trees stand)
      const q = ad - 13 - 8 * (1 - smoothstep(850, 866, s));
      h = lerp(h, Math.min(h, f + (q > 0 ? stepper(q * 1.5 + 2.6 * N.n2(x / 13 + 3.3, z / 13) * rough, 7, 0.55) : 0)), smoothstep(822, 840, s));
    }
    return h;
  };
  return { land, natural, way, wallH, halfW, gapK, rimOf, hollowAt, noise: N };
}

// ---------------------------------------------------------------- the light by place, shared by every surface of the world
// Colours here are linear light, not paint. One set of uniform objects is shared by all the world's own materials.
function lightUniforms(tU) {
  return {
    uTime: tU,
    uSunDir: { value: SUN_DIR.clone() }, uSunCol: { value: lin('#ffcf9a').multiplyScalar(2.4) },
    uSkyCol: { value: new THREE.Color(0.28, 0.42, 0.95).multiplyScalar(0.7) }, uShadeCol: { value: new THREE.Color(0.24, 0.26, 0.60).multiplyScalar(0.45) },
    uGlowDir: { value: GLOW_DIR.clone() }, uGlowCol: { value: new THREE.Color(1.0, 0.56, 0.40).multiplyScalar(0.7) },
    uFireCol: { value: new THREE.Color(1.0, 0.33, 0.06).multiplyScalar(2.4) },
    uFogCol: { value: lin('#5a6ea6') }, uFogDen: { value: 0.00042 },
    uBand: { value: new THREE.Vector2(BAND_Y0, BAND_Y1) }, uLake: { value: new THREE.Vector4(0, 0, LAKE_R, LAKE_Y) },
    uShadeMap: { value: null }, uShadeBox: { value: new THREE.Vector4(0, 0, 1, 1) },
  };
}
const LIGHT_GLSL = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uShadeCol, uGlowDir, uGlowCol, uFireCol, uFogCol;
uniform vec4 uShadeBox, uLake; uniform vec2 uBand; uniform float uFogDen, uTime, uFire0;
uniform sampler2D uShadeMap;
// direct sun by place: none below the band, full above it, and only where the land does not stand in its way
float sunSeen(vec3 P) {
  vec4 sm = texture2D(uShadeMap, (P.xz - uShadeBox.xy) * uShadeBox.zw);
  return smoothstep(uBand.x, uBand.y, P.y) * smoothstep(-1.5, 3.0, P.y - sm.b);
}
// the rose of the east sky before the sun: below the sun's band it falls wherever the land leaves the way to the east open
// (through the canyon's gaps, on the dawn side of the shore) and fades out higher up, where the sun itself takes over
vec3 dawnRose(vec3 P, vec3 N) {
  vec4 sm = texture2D(uShadeMap, (P.xz - uShadeBox.xy) * uShadeBox.zw);
  float open = smoothstep(-1.5, 3.0, P.y - sm.b) * (1.0 - smoothstep(uBand.x, uBand.y, P.y));
  // rose low down, turning to the first gold higher up (the canyon's lowest gap lets in rose, its upper two gold)
  vec3 c = mix(uGlowCol * 1.3, uSunCol * 0.5, smoothstep(45.0, 105.0, P.y));
  return c * open * clamp(dot(N, uSunDir) * 0.75 + 0.25, 0.0, 1.0);
}
vec3 placeLight(vec3 P, vec3 N, float ao, float sunK) {
  vec3 amb = mix(uShadeCol, uSkyCol, N.y * 0.5 + 0.5);
  float gl = max(dot(N, uGlowDir), 0.0);
  vec3 glow = uGlowCol * (0.16 + 0.84 * gl * gl);
  vec2 dl = P.xz - uLake.xy; float rl = length(dl), kk = min(1.0, uLake.z * 0.75 / max(rl, 1e-3));
  vec3 Lv = vec3(uLake.x + dl.x * kk, uLake.w, uLake.y + dl.y * kk) - P; float ll = length(Lv);
  float fire = max(dot(N, Lv / max(ll, 1e-3)), 0.0) / (1.0 + ll * ll / 1800.0) * (1.0 - smoothstep(165.0, 215.0, rl));
  fire *= 0.86 + 0.14 * sin((uTime + uFire0) * 1.7 + rl * 0.05);
  return uSunCol * sunK * max(dot(N, uSunDir), 0.0) + (amb + glow) * ao + uFireCol * fire;
}
// a thin sheen of the sky on every face, whatever its paint: it keeps shade blue-violet
vec3 skySheen(vec3 N, float ao) { return uSkyCol * (0.045 + 0.04 * N.y) * ao; }
vec3 placeFog(vec3 col, vec3 P) {
  vec3 V = P - cameraPosition; float d = length(V), f = 1.0 - exp(-uFogDen * uFogDen * d * d);
  vec2 vh = V.xz / max(length(V.xz), 1e-3), gh = uGlowDir.xz / max(length(uGlowDir.xz), 1e-3);
  float e = max(dot(vh, gh), 0.0);
  return mix(col, mix(uFogCol, uGlowCol * 0.8, e * e * e * 0.55), f);
}
`;
// THE CLOSE-RANGE LAYER of every rock face: thin lines, small cracks and pits, each drawn crisp against the pixel's own
// footprint and faded by ONE LAW for every pattern (footK below): by the pattern's own step, never by a size in metres
// chosen for one window. So a face near the eye is never a magnified blur; nothing in it reads a distance to the eye.
const NEAR_GLSL = /* glsl */`
// THE SITE'S LAW: nothing here thins or shows by a distance to the eye. Fine paint fades by the footprint of one pixel on the
// rock against THE PATTERN'S OWN STEP (st, in metres), as a mip does, with the same two shares for every pattern, BY THE NATURE OF
// PIXELS: a pattern is whole where a pixel covers under a quarter of its step (four pixels and more to a step) and is its mean
// where a pixel covers half its step and more (two pixels to a step: a grid of pixels carries nothing finer). The pixel's span
// is the smaller of its two, so a floor seen at a low angle keeps its lines. A line drawn by coverage (lineAA) takes its
// spacing as the step; an edge with no coverage of its own takes its own breadth. The fades inside lineAA and crackPit are
// measured in the line's own coordinate and begin at a quarter of the step or later, so none fades earlier than the law
float footK(vec3 P, float st) { return 1.0 - smoothstep(0.25 * st, 0.5 * st, min(length(dFdx(P)), length(dFdy(P)))); }
// the lit colour of rock stays under white: above 0.62 the brightest channel is led toward 0.93 and the others keep their
// share of it, so rock in full sun keeps its hue and its bands
vec3 underWhite(vec3 c) { float m = max(max(c.r, c.g), c.b), k = max(m - 0.62, 0.0); return c * ((min(m, 0.62) + k / (1.0 + 3.2 * k)) / max(m, 1e-4)); }
// the same for the pillars' pale rock and the monastery's white walls, which stand close in full sun: a knee and a room of their
// own (the brightest channel is led toward k0 + room), so a sunlit face holds a tone under white and keeps its form
vec3 underTone(vec3 c, float k0, float room) { float m = max(max(c.r, c.g), c.b), k = max(m - k0, 0.0); return c * ((min(m, k0) + k / (1.0 + k / room)) / max(m, 1e-4)); }
const float PALE_K0 = 0.33, PALE_ROOM = 0.19;
// the steps of the patterns below: the crack net's cell, the pits' cell, the upright cracks' spacing (three level lines to
// a cell of their noise)
const float NET_STEP = 0.85, PIT_STEP = 0.31, UP_STEP = 1.0 / (0.55 * 3.0);
float lineAA(float x, float w) {
  float f = abs(fract(x + 0.5) - 0.5), a = fwidth(x) + 1e-4;
  return clamp((w - f) / a + 0.5, 0.0, 1.0) * (1.0 - smoothstep(0.3, 0.8, a));
}
// the crack net lies on a flat map q (ground, or the plane a flat face lies nearest to); the pits are small hollows dealt in cells
// of SPACE, so a pit is round on a face of any lean and nothing is drawn out along a steep one
vec2 crackPit(vec2 q, vec3 P) {
  vec3 j = voronoi(q / NET_STEP + 13.0); float aj = length(fwidth(q)) / NET_STEP + 1e-4;
  float crack = clamp((0.035 - j.y) / aj + 0.5, 0.0, 1.0) * (1.0 - smoothstep(0.25, 0.7, aj));
  vec3 pq = P / PIT_STEP, pi = floor(pq), pf = fract(pq) - 0.5; float ph = hash11(dot(pi, vec3(12.9898, 78.233, 37.719))), ap = length(fwidth(pq)) + 1e-4;
  vec3 po = vec3(hash11(ph * 17.0 + 0.3), hash11(ph * 29.0 + 0.7), hash11(ph * 41.0 + 0.2)) * 0.3 - 0.15;
  float pit = step(0.55, ph) * clamp((0.1 + 0.1 * hash11(ph * 5.0 + 0.9) - length(pf - po)) / ap + 0.5, 0.0, 1.0) * (1.0 - smoothstep(0.3, 0.8, ap));
  return vec2(crack, pit);
}
// upright cracks on a steep face: the level lines of a noise drawn out along the height, so each one wanders; a crack is
// broken off in some thin layers (li) and runs on in others, as joints do in bedded rock
float uprightCracks(vec3 P, float li) {
  float v = vnoise(vec3(P.x * 0.55, P.y * 0.06, P.z * 0.55) + 31.0) * 3.0;
  return lineAA(v, 0.03) * step(0.42, hash11(li * 2.3 + floor(v + 0.5) * 7.1 + 0.4));
}
`;
const ROCK_VERT = /* glsl */`
attribute vec2 aShade; varying vec3 vP, vN, vC; varying vec2 vS;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-6, 0.0)); vC = color; vS = aShade;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
// The land's paint. Vertex colour carries the zones: r the tilted beds of the canyon, g snow, b the pale rock of the shoulder.
const LAND_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying vec2 vS;
${fx.GLSL_NOISE}
${LIGHT_GLSL}
${NEAR_GLSL}
uniform vec3 uDip; uniform vec3 uBlk[48]; uniform vec3 uHot1, uHot2, uHot3;
void main() {
  vec3 P = vP, N = normalize(vN + vec3(0.0, 1e-6, 0.0)), N0 = N;
  float nA = vnoise(P * 0.55), nB = vnoise(P * 0.13 + 7.0), nC = vnoise(P * 2.3);
  float e = 0.35;
  vec3 g = vec3(vnoise(P * 0.55 + vec3(e, 0., 0.)) - nA, vnoise(P * 0.55 + vec3(0., e, 0.)) - nA, vnoise(P * 0.55 + vec3(0., 0., e)) - nA);
  // the fine grain fades as a pixel's footprint on the rock grows, so slopes drawn small carry no speckle
  // each pattern by its own step: the two grains' cells, the bed, a bed's thin layers, the upright cracks, the breadth of
  // a proud bed's light foot, the joints' own spacing (a joint is drawn by coverage), the crack net's cell and the pits' cell
  float kA = footK(P, 1.0 / 0.55), kC = footK(P, 1.0 / 2.3), kBed = footK(P, 2.6), kLam = footK(P, 2.6 / 8.0), kUp = footK(P, UP_STEP);
  float kFoot = footK(P, 0.25 * 2.6), kJoint = footK(P, 10.5), kNet = footK(P, NET_STEP), kPit = footK(P, PIT_STEP);
  nA = mix(0.5, nA, kA); nC = mix(0.5, nC, kC);
  float rc = length(P.xz);
  // THE CRATER'S INNER WALL AND THE PALE ROCK ARE BROKEN ROCK, not soft ground: there the rock is cut into faces 2 to 8 m across
  // (cells of 5 m on a map of the wall that keeps its measure up a steep face: the height above the lake is laid into the range
  // from the lake's middle). Each face leans a little its own way, so the lake's orange and the sky's blue-violet fall on it
  // flat, with a hard edge to the next face; a thin dark crack (0.08 to 0.18 m, by coverage) runs between two faces. The soft
  // grain bump is laid on by a third there
  float wallK = max(1.0 - smoothstep(186.0, 214.0, rc), smoothstep(0.2, 0.6, vC.b)), shoreD = rc - uLake.z;
  vec2 hq = P.xz * (1.0 + 0.55 * (P.y - uLake.w) / max(rc, 1.0));
  // (the map is drawn about by a broad noise, 2.5 m either way, so the faces are of uneven size and no two edges run alike)
  hq += 5.0 * (vec2(vnoise(vec3(hq * 0.07, 1.0)), vnoise(vec3(hq * 0.07, 5.0))) - 0.5);
  vec3 fv = voronoi(hq / 5.0 + 3.7);
  float dF = fv.y * 5.0, fqh = length(fwidth(hq)) + 1e-4, aF = clamp(fwidth(fv.y) * 5.0, 0.2 * fqh, fqh), hwF = mix(0.04, 0.09, hash11(fv.z * 37.1 + 0.6));
  float crF = clamp((hwF - dF) / aF + 0.5, 0.0, 1.0) + clamp((hwF + dF) / aF + 0.5, 0.0, 1.0) - 1.0;
  vec3 lean = vec3(hash11(fv.z * 53.1 + 0.2), hash11(fv.z * 71.7 + 0.5), hash11(fv.z * 97.3 + 0.8)) - 0.5;
  N = normalize(mix(N0 - g * (1.3 * kA), N0 + lean * (0.8 * mix(0.25, 1.0, hash11(fv.z * 13.7 + 0.9))) - g * (0.45 * kA), wallK));
  // dark lava rock with rust
  // patches of rust and of snow follow a broad noise, so far slopes show fields and no stipple
  float nP = 0.5 * nB + 0.5 * vnoise(P * 0.031 + 7.0);
  vec3 rock = mix(vec3(0.135, 0.128, 0.175), vec3(0.27, 0.13, 0.09), smoothstep(0.5, 0.7, nP) * 0.5);
  // the bowl: black rock with rust in rough level bands
  float bowl = 1.0 - smoothstep(150.0, 186.0, rc);
  float rust = smoothstep(0.6, 0.66, vnoise(vec3(P.x * 0.03, P.y * 0.2, P.z * 0.03)) + 0.16 * (nA - 0.5) + 0.1 * (nC - 0.5));
  rock = mix(rock, mix(vec3(0.075, 0.068, 0.08), vec3(0.30, 0.12, 0.07), rust * 0.8), bowl);
  rock *= (0.7 + 0.45 * nA) * (0.82 + 0.3 * nC);
  // the canyon's tilted beds: ochre, red-brown and cream, with dark seams between beds and joints across them
  float bc = (P.y + uDip.z * (P.x * uDip.x + P.z * uDip.y) + 2.0 * nB) / 2.6;
  bc += 0.38 * sin(bc * 1.7) + 0.2 * sin(bc * 4.1 + 1.0);
  float bi = floor(bc), bf = bc - bi, hsh = hash11(bi * 7.13 + 3.0), hs2 = hash11(floor(bc / 5.0) * 3.7 + 1.0);
  vec3 bed = mix(vec3(0.479, 0.138, 0.045), vec3(0.658, 0.323, 0.102), smoothstep(0.25, 0.45, hsh));
  // the cream beds show on the walls; where a bed lies open as floor it is the darker rock, so no floor reads as snow in the shade
  bed = mix(bed, vec3(0.807, 0.624, 0.352), smoothstep(0.62, 0.8, hsh) * (1.0 - 0.8 * smoothstep(0.72, 0.94, N0.y)));
  bed = mix(bed, bed * vec3(0.8, 0.62, 0.6), hs2 * 0.5);
  // the seam between two beds: a soft dark ramp from afar, a thin sharp line near the lens. The line is a cleft 0.1 m wide ON
  // THE ROCK'S OWN SURFACE at the most (gb: how fast the beds' coordinate runs along the surface, by the metre): where the ground
  // lies nearly along a bed the coordinate runs slowly, and a line of a set share of the bed would spread there into a broad
  // dark band from wall to wall; so it stays a thin crack on a floor as on a wall
  vec3 dPx = dFdx(P), dPy = dFdy(P); float bx = dFdx(bc), by = dFdy(bc), pxx = dot(dPx, dPx), pyy = dot(dPy, dPy), pxy = dot(dPx, dPy);
  float gb = sqrt(max(bx * bx * pyy - 2.0 * bx * by * pxy + by * by * pxx, 0.0) / max(pxx * pyy - pxy * pxy, 1e-14));
  float sw = 0.04 + 0.07 * hs2, seam = mix(smoothstep(0.0, sw, bf) * (1.0 - smoothstep(1.0 - sw, 1.0, bf)), 1.0 - lineAA(bc, min(0.02, 0.05 * gb)), kBed);
  // joints: upright cracks that break each bed into uneven many-sided slabs, each a shade of its own
  // this net of great cracks belongs to ground one can stand on: it fades out between slopes of 25 and 40 degrees, so no
  // crack of the floor runs up a wall across the beds
  vec2 jq = vec2(dot(P.xz, vec2(uDip.y, -uDip.x)), dot(P.xz, uDip.xy) + P.y * 0.8);
  vec3 jv = voronoi(jq / 10.5);
  // a joint is a dark cleft with a hard edge, 0.1 to 0.25 m wide (each slab's side of it 0.05 to 0.125 m, by the slab's own
  // hash), drawn by the share of the pixel it covers in the joint's own coordinate: it keeps its breadth at any range and never
  // spreads into a soft wide line. Beside it runs a thin light lip (0.07 m): the slab's broken edge under the sky
  float lev = smoothstep(0.766, 0.906, N0.y), dj = jv.y * 10.5, fqj = length(fwidth(jq)) + 1e-4, aJ = clamp(fwidth(jv.y) * 10.5, 0.2 * fqj, fqj);
  float hwj = mix(0.05, 0.125, hash11(jv.z * 37.1 + 0.6)), inJ = clamp((hwj - dj) / aJ + 0.5, 0.0, 1.0);
  float cleftJ = inJ + clamp((hwj + dj) / aJ + 0.5, 0.0, 1.0) - 1.0, lipJ = clamp((hwj + 0.07 - dj) / aJ + 0.5, 0.0, 1.0) - inJ;
  float joint = 1.0 - lev * kJoint * cleftJ;
  bed *= (0.6 + 0.4 * seam) * (0.14 + 0.86 * joint) * (1.0 + 0.32 * lev * kJoint * lipJ) * (0.8 + 0.4 * nA) * mix(1.0, 0.84 + 0.32 * hash11(jv.z * 91.7 + 2.0), lev);
  // near the lens every bed shows its thin layers: sharp lines a hand apart, each of its own strength
  // (on a wall the layers are crossed by upright cracks; on the floor the layers show faintly where they crop out)
  // (upright cracks belong to faces that stand steeper than 53 to 70 degrees: on a slope the noise's level lines close into loops)
  float lam = bc * 8.0 + 0.7 * nA, upc = uprightCracks(P, floor(lam)), cliffK = 1.0 - smoothstep(0.34, 0.6, N0.y);
  bed *= 1.0 - kLam * mix(0.36, 0.07, lev) * lineAA(lam, 0.09) * (0.3 + 0.7 * hash11(floor(lam + 0.5) * 3.17 + 1.3));
  bed *= 1.0 - kUp * 0.42 * cliffK * upc;
  // ledges: every few beds one stands proud of the wall; its foot is light, the bed under it lies in its shade
  float steep = 1.0 - smoothstep(0.55, 0.85, N0.y);
  float lgUp = step(0.6, hash11((bi + 1.0) * 5.3 + 0.7)), lgMe = step(0.6, hash11(bi * 5.3 + 0.7));
  bed *= (1.0 - 0.52 * steep * lgUp * smoothstep(mix(0.3, 0.6, kFoot), mix(1.0, 0.72, kFoot), bf)) * (1.0 + 0.3 * steep * lgMe * (1.0 - smoothstep(0.0, mix(0.25, 0.07, kFoot), bf)));
  // the hollows where slabs were lifted out: fresh rock, darker
  float hol = vC.g * step(0.5, vC.r), snowK = vC.g * (1.0 - step(0.5, vC.r));
  bed *= mix(1.0, 0.46, hol);
  vec3 alb = mix(rock, bed, smoothstep(0.25, 0.75, vC.r + (nB - 0.5) * 0.3));
  // the pale rock of the summit's shoulder and its scree
  alb = mix(alb, vec3(0.62, 0.53, 0.45) * (0.7 + 0.5 * nA), smoothstep(0.3, 0.8, vC.b + (nB - 0.5) * 0.4));
  // the pale rock's ledges are in the land's own form: nothing is painted under a lip and no level line is drawn. The paint
  // only follows the form's own normal: a face that stands steep is a shade darker and, near the lens, shows its thin beds
  // (they dip with the mountain's beds) and its upright cracks; ground that lies near level is a shade lighter
  float paleK = smoothstep(0.2, 0.6, vC.b), stK = 1.0 - smoothstep(0.55, 0.85, N0.y);
  alb *= 1.0 - paleK * (0.3 * stK - 0.25 * smoothstep(0.75, 0.95, N0.y));
  alb *= 1.0 - paleK * (0.3 * stK * footK(P, 2.6 / 4.7) * lineAA(bc * 4.7 + 0.6 * nA, 0.09) + 0.36 * cliffK * kUp * upc);
  alb *= mix(1.0, (0.84 + 0.3 * hash11(fv.z * 91.7 + 2.0)) * (1.0 - 0.6 * crF * smoothstep(0.3, 0.55, vnoise(vec3(hq * 0.2, 9.0)))), wallK);
  // the close-range layer on every kind of rock: pits and, on ground one can stand on, a net of small cracks; both in patches
  vec2 cp = crackPit(jq, P);
  alb *= 1.0 - smoothstep(0.3, 0.6, vnoise(P * 0.21 + 5.0)) * (0.3 * lev * kNet * cp.x + 0.3 * kPit * cp.y);
  // snow on what faces up, and shore ice
  float sn = snowK * smoothstep(0.6, 0.88, N0.y + (nB - 0.5) * 0.3) * smoothstep(0.4, 0.58, nP + snowK * 0.3);
  sn *= 0.8;
  sn = max(sn, smoothstep(5.5, 1.5, P.y + nA * 2.0) * (1.0 - vC.r) * step(250.0, rc));
  alb = mix(alb, vec3(0.64, 0.69, 0.76), clamp(sn, 0.0, 1.0));
  // the dark feet of the fallen blocks and of the larger lumps of the floor's small rubble: the ground is shaded close round
  // each (x, z and reach of each, set by place at build; forty blocks and eight lumps at the most)
  float foot = 1.0;
  for (int i = 0; i < 48; i++) foot *= 1.0 - 0.6 * (1.0 - smoothstep(0.5, 1.6, length(P.xz - uBlk[i].xy) / uBlk[i].z));
  float ao = vS.y * mix(1.0, 0.75 + 0.25 * seam, vC.r) * foot;
  // the dawn's rose and first gold fall at full strength on the canyon's beds; the dark cone outside takes less of them and stays dark
  vec3 col = underWhite(alb * (placeLight(P, N, ao, sunSeen(P)) + dawnRose(P, N) * mix(0.4, 1.0, vC.r) * (0.4 + 0.6 * foot))) + skySheen(N, ao);
  // THE LAKE'S HEAT IN THE ROCK: the cracks between the wall's faces glow where they are near the lake, all round its shore:
  // nearly all of them at the shore, fewer in uneven tongues higher up, none beyond 40 m from the shore MEASURED UP THE WALL (by
  // place: the range beyond the lake's radius and the height above the lake, together). A glowing crack is broader than a cold
  // one (up to two and a half times), drawn by coverage in the lava's own three colours, with a dull red on the rock a hand
  // from it; it breathes on the fire's own seeded clock. No level hairline is drawn
  float heatK = smoothstep(0.0, 0.3, (1.0 - length(vec2(shoreD, P.y - uLake.w)) / 40.0) - 0.75 * vnoise(vec3(hq * 0.12, 3.0))) * step(0.0, shoreD);
  float hwG = hwF * (1.0 + 1.5 * heatK), glF = clamp((hwG - dF) / aF + 0.5, 0.0, 1.0) + clamp((hwG + dF) / aF + 0.5, 0.0, 1.0) - 1.0;
  vec3 em = mix(uHot1, uHot2, smoothstep(0.15, 0.7, heatK)); em = mix(em, uHot3, smoothstep(0.75, 1.0, heatK) * (1.0 - smoothstep(0.0, hwG, dF)));
  col += (em * 1.4 * glF + uHot1 * 0.35 * exp(-dF / 0.3)) * heatK * (0.85 + 0.15 * sin((uTime + uFire0) * 1.3 + vnoise(P * 0.2) * 12.0));
  gl_FragColor = vec4(placeFog(col, P), 1.0);
}
`;
// The bergs' paint: plain sea ice, white above, blue in its faces, darker at the waterline. Nothing in it glows.
const BERG_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying vec2 vS;
${fx.GLSL_NOISE}
${LIGHT_GLSL}
void main() {
  vec3 P = vP, N = normalize(cross(dFdx(P), dFdy(P)) + vec3(0.0, 1e-12, 0.0));
  float top = smoothstep(0.35, 0.8, N.y), n = vnoise(P * 0.7);
  vec3 alb = mix(vec3(0.42, 0.62, 0.78), vec3(0.86, 0.9, 0.95), top) * (0.85 + 0.2 * n);
  alb = mix(alb, vec3(0.25, 0.5, 0.62), smoothstep(1.2, 0.0, P.y) * 0.7);
  vec3 col = alb * (placeLight(P, N, 1.0, sunSeen(P)) + dawnRose(P, N) * 0.7);
  gl_FragColor = vec4(placeFog(col, P), 1.0);
}
`;
// The pillars' paint: pale bare rock, level beds, upright cracks; faces are flat where the rock breaks. aShade.x is the height above the foot (0..1).
const PILLAR_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying vec2 vS;
${fx.GLSL_NOISE}
${LIGHT_GLSL}
${NEAR_GLSL}
void main() {
  vec3 P = vP, Nf = normalize(cross(dFdx(vP), dFdy(vP)) + vec3(0.0, 1e-12, 0.0));
  vec3 N = normalize(mix(normalize(vN + vec3(0.0, 1e-6, 0.0)), Nf, 0.55));
  float nA = vnoise(P * 0.5), nB = vnoise(P * 0.12 + 3.0), nC = vnoise(P * 1.9);
  float e = 0.3;
  vec3 g = vec3(vnoise(P * 0.5 + vec3(e, 0., 0.)) - nA, vnoise(P * 0.5 + vec3(0., e, 0.)) - nA, vnoise(P * 0.5 + vec3(0., 0., e)) - nA);
  N = normalize(N - g * 1.2);
  // upright joints as soft dark streaks (no courses, no drawn lines)
  float streak = vnoise(vec3(P.x * 0.36, P.y * 0.032, P.z * 0.36));
  float joint = smoothstep(0.14, 0.36, abs(streak - 0.5) * 2.0 + nC * 0.12);
  vec3 alb = vec3(0.686, 0.578, 0.479) * (0.64 + 0.36 * joint) * (0.74 + 0.36 * nA) * (0.86 + 0.28 * nC);
  alb = mix(alb, alb * vec3(0.8, 0.72, 0.74), smoothstep(0.5, 0.8, nB) * 0.6);
  // near the lens: thin uneven level layers, wandering upright cracks and pits, all sharp (natural rock: nothing regular, nothing dressed)
  float py = P.y / 0.42 + 0.9 * nA;
  vec2 cp = crackPit(vec2(P.x * 0.8 + P.z * 0.6, P.y * 1.15 + (P.z * 0.8 - P.x * 0.6) * 0.45), P);
  alb *= 1.0 - (0.3 * footK(P, 0.42) * lineAA(py, 0.08) * (0.3 + 0.7 * hash11(floor(py + 0.5) * 3.17 + 1.3)) + 0.42 * footK(P, UP_STEP) * uprightCracks(P, floor(py)) + 0.3 * footK(P, PIT_STEP) * cp.y);
  // AT ARM'S LENGTH the rock shows its build: beds 1 to 3 m thick, some standing proud (a light top edge, the rock under the
  // bed above in its shade), and blocks 1 to 3.5 m across (cells of 2.2 m on the upright plane the face lies nearest to), each
  // face leaning a little its own way with a thin dark joint (by coverage) to the next and a shade of its own. Both fade by
  // the law (footK) with the pixel's span, so a pillar far off keeps its soft streaks
  float pbc = P.y / 1.9 + 1.3 * nB, pbi = floor(pbc), pbf = pbc - pbi, kBd = footK(P, 1.9);
  alb *= (1.0 - 0.4 * kBd * step(0.45, hash11((pbi + 1.0) * 5.3 + 0.7)) * smoothstep(0.6, 0.95, pbf)) * (1.0 + 0.14 * kBd * step(0.45, hash11(pbi * 5.3 + 0.7)) * (1.0 - smoothstep(0.0, 0.12, pbf)));
  vec3 aNf = abs(Nf); vec2 bq = aNf.x > aNf.z ? vec2(P.z, P.y) : vec2(P.x, P.y);
  bq += 1.1 * (vec2(vnoise(vec3(bq * 0.3, 2.0)), vnoise(vec3(bq * 0.3, 6.0))) - 0.5);
  vec3 bv = voronoi(bq / 2.2 + 5.3);
  float kBlk = footK(P, 2.2), dB = bv.y * 2.2, fqb = length(fwidth(bq)) + 1e-4, aB = clamp(fwidth(bv.y) * 2.2, 0.2 * fqb, fqb);
  float crB = clamp((mix(0.03, 0.07, hash11(bv.z * 37.1 + 0.6)) - dB) / aB + 0.5, 0.0, 1.0);
  N = normalize(N + (vec3(hash11(bv.z * 53.1 + 0.2), hash11(bv.z * 71.7 + 0.5), hash11(bv.z * 97.3 + 0.8)) - 0.5) * (0.45 * kBlk));
  alb *= mix(1.0, (0.86 + 0.28 * hash11(bv.z * 91.7 + 2.0)) * (1.0 - 0.6 * crB), kBlk);
  float ao = (0.5 + 0.5 * smoothstep(0.0, 0.2, vS.x)) * (0.7 + 0.3 * joint), sunK = sunSeen(P);
  // the low sun wraps a little round a pale needle; THE SUNLIT FACE HOLDS A ROCK TONE UNDER WHITE (underTone)
  float hw = max(dot(N, uSunDir) * 0.5 + 0.5, 0.0);
  vec3 col = underTone(alb * (placeLight(P, N, ao * 0.7, sunK) + uSunCol * sunK * 0.5 * hw * hw), PALE_K0, PALE_ROOM) + skySheen(N, ao);
  gl_FragColor = vec4(placeFog(col, P), 1.0);
}
`;
// The sky monastery's paint (SKY_MONASTERY). vC.r is the kind (0 dressed stone, 1 roof tile, 2 a roof's tip); vC.g and vC.b are the
// body's own paint coordinates (stone: a window's cell across the wall and the height in metres by the rows' own scale; tile:
// metres across a roof's face and up its slope); aShade.x is a hash of the body (2 is added where a wall carries no windows),
// aShade.y its shade
const MONASTERY_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying vec2 vS;
${fx.GLSL_NOISE}
${LIGHT_GLSL}
${NEAR_GLSL}
void main() {
  // every face is flat: the normal is the face's own, turned to the eye (a roof seen from below shows its dark underside)
  vec3 P = vP, N = normalize(cross(dFdx(vP), dFdy(vP)) + vec3(0.0, 1e-12, 0.0));
  float kind = vC.r, u = vC.g, v = vC.b, bh = fract(vS.x), plain = step(1.5, vS.x);
  float nA = vnoise(P * 0.5), nC = vnoise(P * 1.9);
  // STONE: white to pale cream, dressed and old: courses 0.55 m high with broken upright joints, each stone a shade of its own,
  // grey streaks of old rain down the walls
  float cy = v / 0.55, ci = floor(cy), cu = u * 2.0 + 0.5 * mod(ci, 2.0);
  vec3 stone = vec3(0.86, 0.835, 0.78) * (0.86 + 0.2 * nA) * (0.93 + 0.14 * nC) * (0.94 + 0.12 * bh);
  stone *= 0.93 + 0.14 * hash11(ci * 7.3 + floor(cu) * 3.1 + bh * 17.0);
  stone *= 1.0 - 0.26 * smoothstep(0.5, 0.8, vnoise(vec3(P.x * 0.9, P.y * 0.07, P.z * 0.9) + 11.0));
  stone *= 1.0 - 0.24 * footK(P, 0.55) * max(lineAA(cy, 0.05), 0.7 * lineAA(cu, 0.03));
  // small dark arched windows in rows, PAINTED on the wall (not cut): one to a face and row at the most, a row to every 3.4 m of
  // the body's own scale; a window is 0.22 of its cell broad and 1.4 m tall with a round head, drawn by coverage
  float wr = v / 3.4, ym = (fract(wr) - 0.5) * 3.4 - 0.2, X = (fract(u) - 0.5) / 0.11;
  float dW = ym > 0.35 ? length(vec2(X, (ym - 0.35) / 0.3)) - 1.0 : max(abs(X) - 1.0, (-0.75 - ym) / 0.3);
  float win = clamp(0.5 - dW / (fwidth(dW) + 1e-4), 0.0, 1.0) * step(0.0, v) * (1.0 - plain) * step(0.42, hash11(floor(u) * 5.7 + floor(wr) * 11.3 + bh * 31.0));
  // a dark arched doorway at the foot of one face in five (2.3 m tall by the body's scale); the window over it is left out
  float door = step(0.8, hash11(floor(u) * 3.3 + bh * 7.7)), X2 = (fract(u) - 0.5) / 0.17;
  float dD = v > 1.7 ? length(vec2(X2, (v - 1.7) / 0.6)) - 1.0 : max(abs(X2) - 1.0, -v / 0.6);
  float dr = clamp(0.5 - dD / (fwidth(dD) + 1e-4), 0.0, 1.0) * door * (1.0 - plain);
  win *= 1.0 - door * step(wr, 1.0);
  stone = mix(stone, vec3(0.03, 0.03, 0.05), 0.92 * max(win, dr) * footK(P, 1.2));
  // TILE: clear blue, weathered, in rows 0.45 m apart up the slope, each row's tiles a shade of their own; a pale line along
  // every hip of a roof (u runs -1 to 1 across a roof's face) and along its eave; a little snow and pale lichen on the sides
  // turned from the sun
  float ty = v / 0.45, ti = floor(ty);
  vec3 tile = vec3(0.035, 0.2, 0.82) * (0.8 + 0.4 * hash11(ti * 5.1 + floor(u * 2.0 + 0.5 * mod(ti, 2.0)) * 9.7 + bh * 13.0)) * (0.85 + 0.3 * nA);
  tile *= 1.0 - 0.4 * footK(P, 0.45) * lineAA(ty, 0.09);
  tile = mix(tile, vec3(0.74, 0.76, 0.74), max(smoothstep(0.9, 0.96, abs(u)), 1.0 - smoothstep(0.08, 0.14, v)) * 0.8);
  float away = smoothstep(0.1, -0.5, dot(N, uSunDir)) * smoothstep(0.0, 0.35, N.y);
  tile = mix(tile, vec3(0.42, 0.47, 0.36), away * 0.45 * smoothstep(0.58, 0.7, vnoise(P * 0.8 + 17.0)));
  tile = mix(tile, vec3(0.64, 0.69, 0.76), away * smoothstep(0.62, 0.7, vnoise(P * 0.35 + 29.0) + 0.15 * (nC - 0.5)));
  // the tip: pale gold, plain (it carries no light of its own)
  vec3 alb = kind < 0.5 ? stone : (kind < 1.5 ? tile : vec3(0.86, 0.66, 0.30));
  float ao = vS.y, sunK = sunSeen(P), hw = max(dot(N, uSunDir) * 0.5 + 0.5, 0.0);
  // (the white walls in full sun hold a tone under white, as the pillars do; the shaded side takes the sky's blue-violet)
  vec3 col = underTone(alb * (placeLight(P, N, ao * 0.8, sunK) + uSunCol * sunK * 0.3 * hw * hw * step(kind, 0.5)), PALE_K0, PALE_ROOM) + skySheen(N, ao);
  gl_FragColor = vec4(placeFog(col, P), 1.0);
}
`;
function rockMaterial(LU, frag, extra = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...LU, ...extra }, vertexShader: ROCK_VERT, fragmentShader: frag, vertexColors: true });
}

export default {
  id: 'mountain-of-four-elements',
  name: 'The Mountain of Four Elements',
  category: 'screen',
  placeKind: 'wilderness',
  screen: 'Avatar: The Last Airbender',
  screenYear: '2005',
  screenKind: 'series',
  media: ['air', 'water'],
  weirdness: 0.5,
  async build(ctx) {
    const { core } = ctx, scene = new THREE.Scene(), detail = (ctx.quality && ctx.quality.detail) || 1, vary = ctx.vary || {};
    // every stream of the world, taken here in one fixed list; each is made from the seed and a name and draws from no parent
    // (cloudHeadsTwin is a twin of the cloud heads' stream, the same name and seed: it deals the kit's own dice a second time, to
    // find where the kit will set each puff before the field is made)
    const stream = (name) => core.makeRng(core.hashSeed(name + ':' + ctx.seed));
    const R = {
      sky: stream('mountain-sky'), land: stream('mountain-land'), sea: stream('mountain-sea'), floes: stream('mountain-floes'), bergs: stream('mountain-bergs'),
      plume: stream('mountain-plume'), pillars: stream('mountain-pillars'), trees: stream('mountain-trees'),
      birds: stream('mountain-birds'), rubble: stream('mountain-rubble'),
      dust: stream('mountain-diamond-dust'), frost: stream('mountain-frost'), cloudHeads: stream('mountain-cloud-heads'), cloudHeadsTwin: stream('mountain-cloud-heads'), cloudSea: stream('mountain-cloud-sea'),
      birdsEast: stream('mountain-birds-east'), blocks: stream('mountain-blocks'), cleft: stream('mountain-cleft'),
      plumeFoot: stream('mountain-plume-foot'), pillarPlaces: stream('mountain-pillar-places'), headPlaces: stream('mountain-cloud-head-places'),
      clockLake: stream('mountain-clock-lake'), clockBank: stream('mountain-clock-bank'), clockFire: stream('mountain-clock-fire'), clockGlow: stream('mountain-clock-glow'),
      footLumps: stream('mountain-foot-lumps'), gapMotes: GAPS.map((g, i) => stream('mountain-gap-motes-' + i)), clumps: stream('mountain-clumps'), floorRubble: stream('mountain-floor-rubble'),
      wallRibs: stream('mountain-wall-ribs'), blockGroups: stream('mountain-block-groups'), monastery: stream('mountain-sky-monastery'),
    };
    const density = clamp(vary.density || 1, 0.7, 1.3), golden = vary.hour === 'golden', rare = !!vary.rare;
    const tU = { value: 0 }, LU = lightUniforms(tU);
    // FOUR CLOCKS take a start dealt from a stream of their own (seconds added to the world's time): the lake fire's flicker on the
    // rock, the lake's plates, the cloud bank's heave and shreds, the glow's breath
    LU.uFire0 = { value: R.clockFire.range(0, 600) };
    const lake0 = { value: R.clockLake.range(0, 600) }, bank0 = { value: R.clockBank.range(0, 600) }, glow0 = { value: R.clockGlow.range(0, 600) };
    if (golden) { LU.uSunCol.value.multiply(new THREE.Color(1.06, 0.97, 0.86)); LU.uGlowCol.value.multiply(new THREE.Color(1.1, 1.0, 0.9)); }

    // ------------------------------------------------------------ the line, and the land's height function
    const path = makePath(linePoints());
    const line = (s) => ({ p: path.posAtDist(s), t: path.tangentAtDist(s) });
    let hollows = null;
    try { if (typeof part.gateHollows === 'function') hollows = part.gateHollows(ctx); } catch (err) { console.error('mountain part, gateHollows: ' + (err && err.message)); }
    if (!Array.isArray(hollows)) {
      hollows = [];
      for (let i = 0; i < GATE_N; i++) {
        const s = GATE_S0 + i * GATE_STEP;
        hollows.push({ s, d0: 4, d1: 16.5, halfS: 4.5, depth: 1.8 }, { s, d0: -16.5, d1: -4, halfS: 4.5, depth: 1.8 });
      }
    }
    // the gates' stations along the line, read from the part's own plan (one hollow to a gate; the stand-in above has two): the talus, the blocks and
    // the small rubble keep their distance from the gates by these, so they follow whatever the plan deals
    const gateS = [...new Set(hollows.map((h) => h.s))].sort((a, b) => a - b);
    // THE CLEFT'S LEDGES, dealt from the cleft's own stream before the land is made: thirteen lips between s 838 and s 946 at
    // uneven spacing (thirteen gaps dealt 5 to 13 and fitted to the stretch), each from one wall or the other as its die falls,
    // spanning 0.34 to 0.66 of the gully's width, its riser 1.5 to 6 m, its lip oblique by 10 to 35 degrees either way and
    // curved either way; rank chooses the ledges that shelter a clump of trees
    const CL = R.cleft, cleftLedges = [], clGaps = [];
    for (let i = 0; i < 13; i++) clGaps.push(CL.range(5, 13));
    {
      const sum = clGaps.reduce((a, b) => a + b, 0);
      let s = 838;
      for (let i = 0; i < 13; i++) {
        s += clGaps[i] * 108 / sum * (i === 0 ? 0.5 : 1);
        cleftLedges.push({
          s, side: CL() < 0.5 ? -1 : 1, span: CL.range(0.34, 0.66), r: CL.range(1.5, 6), ang: CL.range(10, 35) * (CL() < 0.5 ? -1 : 1),
          cv: CL.range(0.1, 0.3) * (CL() < 0.5 ? -1 : 1), ph: CL.range(0, 40), rank: CL(),
        });
      }
    }
    const land = makeLand(core, path, hollows, cleftLedges), groundAt = land.land;

    // ------------------------------------------------------------ sky, fog, and the two lights the kit's plants need
    const sky = makeSky({
      rng: R.sky, preset: 'dawn', zenith: SKY.zenith, mid: SKY.mid, horizon: SKY.horizon, ground: SKY.ground, horizonPow: 3.2,
      scatterColor: golden ? '#ffa468' : '#ff9a70', scatter: 0.95, scatterPow: 3.6, scatterHigh: 0.04, scatterFall: 5.5,
      sunElevation: 5, sunAzimuth: 120, sunColor: '#fff0d0', sunSize: 1.6, sunIntensity: 11, sunGlow: 0.8,
      stars: 0.3, starDensity: 0.4, bodies: [], clouds: false, clouds2: { coverage: 0.36, opacity: 0.2, lit: '#ffc8b4', shade: '#6a70b0' },
      lightElevationMin: 5,
    });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(LU.uFogCol.value.clone(), LU.uFogDen.value);
    const sunLight = new THREE.DirectionalLight(lin('#ffcf9a'), 2.4); sunLight.position.copy(SUN_DIR).multiplyScalar(400);
    const hemi = new THREE.HemisphereLight(lin('#7f9fe6'), lin('#5a5690'), 1.5);
    scene.add(sunLight, sunLight.target, hemi);
    await ctx.yield();

    // ------------------------------------------------------------ the mountain: the kit's mesh of our height function, our own paint
    const blkU = Array.from({ length: 48 }, () => new THREE.Vector3(1e6, 1e6, 1));
    const landMat = rockMaterial(LU, LAND_FRAG, {
      uDip: { value: new THREE.Vector3(DIPX, DIPZ, DIP) }, uBlk: { value: blkU },
      uHot1: { value: lin(LAVA_HOT[0]) }, uHot2: { value: lin(LAVA_HOT[1]) }, uHot3: { value: lin(LAVA_HOT[2]) },
    });
    const blank = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1); blank.needsUpdate = true; landMat.userData.blank = blank;
    const RIMQ = { r: 0, c: 0, hi: 0, es: 0 };
    const zone = (x, z, h, ny, out) => {
      const rr = Math.hypot(x, z), w = land.way(x, z);
      let beds = 0;
      if (w.ok && w.s < 650) {
        const ad = Math.abs(w.d), right = w.d > 0;
        beds = smoothstep(192, 220, w.s) * (1 - smoothstep(590, 646, w.s)) * (1 - smoothstep(24, 34, ad - land.halfW(w.s)));
      }
      const cleft = w.ok && w.s > 826 ? 0.55 * smoothstep(826, 850, w.s) * (1 - smoothstep(34, 64, Math.abs(w.d))) : 0;
      land.rimOf(x / (rr + 1e-6), z / (rr + 1e-6), RIMQ);
      // snow and shore ice lie low (none above y 58), none on the canyon's beds or the warm shoulder
      const snow = smoothstep(168, 215, rr) * (1 - beds) * (1 - smoothstep(34, 58, h)) * (1 - 0.8 * RIMQ.es * (1 - smoothstep(260, 330, rr)));
      // the pale rock of the shoulder also lines the cleft that climbs to it
      const pale = Math.max(RIMQ.es * smoothstep(150, 176, rr) * (1 - smoothstep(214, 256, rr)), cleft);
      // on the beds the snow channel carries the hollows where slabs were lifted out (fresh dark rock)
      const pit = beds > 0.5 ? clamp(land.hollowAt(w.s, w.d) / 2.5, 0, 1) : 0;
      return out.setRGB(beds, Math.max(snow, pit), pale);
    };
    const terrain = await T.makeTerrainAsync({
      rng: R.land, noise: land.noise, path, corridor: false, height: groundAt, bounds: [-640, -640, 640, 640], cell: 3, near: 60, levels: 5,
      maxTriangles: 96000, sunDir: SUN_DIR, ao: 0.5, color: zone, materialInstance: landMat, detailTexture: blank,
    }, ctx.yield);
    LU.uShadeMap.value = terrain.shadeMap; LU.uShadeBox.value.copy(terrain.shadeBox);
    scene.add(terrain.object);
    const sunTopAt = (x, z) => terrain.shadeAt(x, z).top;
    await ctx.yield();

    // ------------------------------------------------------------ the sea: the kit's ocean under the dawn sky
    const WL = Water.waterLight(sky);
    const depthRect = [-640, -640, 640, 640], depthAt = (x, z) => -groundAt(x, z);
    const depthData = await Water.oceanDepthAsync({ depthAt, depthRect, depthRes: 96 }, ctx.yield);
    const ocean = Water.makeOcean({
      rng: R.sea, light: WL, preset: 'calm', level: SEA_Y, deep: '#0e2f4a', scatter: '#1c5a78', depthAt, depthRect, depthRes: 96, depthData,
      radius: 3600, rings: 110, segments: 128, shallowColor: '#3f9fb8', foam: 0.3,
    });
    scene.add(ocean.object);
    await ctx.yield();

    // ------------------------------------------------------------ the crater: the lake of lava (kept dark) and its leaning plume
    // The lake's paint is the world's own: dark plates of 20 m that drift, glowing cracks that widen where the crust is thin,
    // small plates embossed on the large ones. THE SITE'S LAW holds in it as in the rock: nothing reads a distance to the eye.
    // Every fine thing is weighed against the footprint of one pixel in the pattern's own coordinate (fp: the larger of the
    // pixel's two spans, as a mip takes it) and of each line's own coordinate: a crack line widens to its footprint and
    // covers the pixel by the same share less, so its light is kept and no line breaks into dots; the grain, the mottle and a plate's own tone give their mean where
    // a pixel covers more than their cell; the plates' relief goes flat where a pixel covers more than a bevel.
    const lakeMat = new THREE.ShaderMaterial({
      uniforms: { ...LU, uT0: lake0, uCrust: { value: lin('#1a1012') }, uHot1: { value: lin(LAVA_HOT[0]) }, uHot2: { value: lin(LAVA_HOT[1]) }, uHot3: { value: lin(LAVA_HOT[2]) } },
      vertexShader: /* glsl */`
        varying vec3 vP;
        void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        ${fx.GLSL_NOISE}
        ${LIGHT_GLSL}
        uniform vec3 uCrust, uHot1, uHot2, uHot3; uniform float uT0;
        varying vec3 vP;
        // plates: (distance to the nearest middle, distance to the plate's edge, the plate's own number)
        vec3 plates(vec2 x) {
          vec2 n = floor(x), f = fract(x); float f1 = 8.0, f2 = 8.0, id = 0.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j)), r = g + hash22(n + g) - f; float d = dot(r, r);
            if (d < f1) { f2 = f1; f1 = d; id = hash12(n + g + 17.3); } else if (d < f2) f2 = d;
          }
          return vec3(sqrt(max(f1, 0.0)), sqrt(max(f2, 0.0)) - sqrt(max(f1, 0.0)), id);
        }
        void main() {
          const float GLOW = 1.8; const vec2 FLOW = vec2(1.0, 0.3);
          vec3 N = vec3(0.0, 1.0, 0.0), V = normalize(cameraPosition - vP), lp = vP * 0.05;
          vec2 p = lp.xz; float t = (uTime + uT0) * 0.5;
          float fp = max(length(dFdx(p)), length(dFdy(p)));
          vec2 w = vec2(fbmLo(p * 0.6 + vec2(0.0, t * 0.05)), fbmLo(p * 0.6 + vec2(5.2, -t * 0.04)));
          vec2 q = p + (w - 0.5) * 1.2 + FLOW * t * 0.06;
          vec3 v1 = plates(q), v2 = plates(q * 2.6 + 3.1);
          // each line's own footprint: the span of its own coordinate over one pixel (so a line that runs along the gaze stays
          // thin), never more than the pattern's footprint allows and never less than a fifth of it
          float a1 = clamp(fwidth(v1.y), 0.3 * fp, 2.0 * fp), a2 = clamp(fwidth(v2.y), 0.8 * fp, 5.2 * fp);
          // the small plates' embossing is finer than the large plates' bevels: it gives its mean where a pixel covers its bevel
          float e2 = 1.0 - smoothstep(0.025, 0.05, 2.6 * fp);
          float hm = fbmLo(p * 0.33 - FLOW * t * 0.02 + 9.0) - 0.12;
          float wc = 0.8 * (0.35 + 2.4 * smoothstep(0.4, 0.85, hm)), W1 = wc * 0.1, W2 = wc * 0.07, WH = max(wc, 0.05) / 12.0;
          // each line's shape, widened by its footprint, and the share of the pixel it covers
          float s1 = 1.0 - smoothstep(0.0, W1 + a1, v1.y), s2 = (1.0 - smoothstep(0.0, W2 + a2, v2.y)) * 0.55 * smoothstep(0.3, 0.7, hm);
          float sh = exp(-v1.y / (WH + a1)) * 0.3;
          float pool = smoothstep(0.66, 0.95, hm) * (0.55 + 0.45 * mix(0.45, v2.x, 1.0 - smoothstep(0.35, 1.0, 2.6 * fp)));
          float heat = clamp(max(max(max(s1, s2), pool), sh), 0.0, 1.0);
          float cov = clamp(max(max(s1 * W1 / (W1 + a1), s2 * W2 / (W2 + a2)), max(pool, sh * WH / (WH + a1))) / max(heat, 1e-3), 0.0, 1.0);
          // relief: flat plate tops that bevel down into the cracks, small plates embossed on top; bevels widen with the footprint
          float hgt = smoothstep(0.0, 0.2 + a1, v1.y) * (0.7 + 0.3 * mix(0.9, smoothstep(0.0, 0.1 + a2, v2.y), e2))
            + (v1.z - 0.5) * 0.3 * smoothstep(0.04, 0.3 + a1, v1.y) + (w.x - 0.5) * 0.25;
          hgt *= 1.0 - pool;
          vec3 dpx = dFdx(vP), dpy = dFdy(vP); float hx = dFdx(hgt), hy = dFdy(hgt);
          vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
          vec3 Nb = normalize(abs(det) * N - sign(det) * (hx * r1 + hy * r2) * 2.4 * (1.0 - smoothstep(0.05, 0.1, fp)) + N * 1e-6);
          float ndv = max(dot(Nb, V), 0.0);
          float idk = 1.0 - smoothstep(0.3, 1.0, fp), id = mix(0.5, v1.z, idk);
          vec3 em = uHot1 * smoothstep(0.0, 0.35, heat); em = mix(em, uHot2, smoothstep(0.25, 0.7, heat)); em = mix(em, uHot3, smoothstep(0.65, 1.0, heat));
          float shimmer = 1.0 + 0.3 * pool * (1.0 - smoothstep(0.25, 0.5, 3.1 * fp)) * sin((uTime + uT0) * 2.3 + vnoise(lp * 3.1 + (uTime + uT0) * 0.17) * 14.0);
          em *= GLOW * (0.3 + 0.7 * heat) * (0.88 + 0.12 * idk * sin((uTime + uT0) * 1.7 + v1.z * 40.0)) * shimmer;
          // the crust's mottle (cells of 7 m) and grit (cells of 1.8 m): each gives its mean where a pixel covers more than its cell
          float mk = 1.0 - smoothstep(0.35, 1.0, 2.7 * fp), gk = 1.0 - smoothstep(0.35, 1.0, 11.0 * fp), mo = vnoise(lp * 2.7 + v1.z * 17.0);
          float mottle = mix(0.5, mo, mk), mott2 = mix(0.3, mo * mo, mk), grit = mix(0.5, vnoise(lp * 11.0), gk);
          vec3 crust = uCrust * (0.45 + 1.1 * id) * (0.5 + 0.9 * mott2 + 0.45 * grit);
          // a dull sheen of the horizon's sky on the cooled plates, seen at a low angle
          float fr = min(0.04 + 0.96 * pow(clamp(1.0 - ndv, 0.0, 1.0), 5.0), 0.28);
          vec3 col = crust * (placeLight(vP, Nb, 1.0, sunSeen(vP)) + dawnRose(vP, Nb)) + uFogCol * 0.24 * fr * (0.5 + 0.9 * mottle) * (1.0 - pool);
          // the cracks light the plate edges from below
          col += uHot2 * GLOW * 0.1 * pow(1.0 - clamp(hgt, 0.0, 1.0), 3.0) * max(dot(Nb, N), 0.0) * (0.2 / (0.2 + a1));
          col = mix(col, em, smoothstep(0.0, 0.3, heat) * cov) + uHot1 * GLOW * 0.04 * (1.0 - heat);
          gl_FragColor = vec4(placeFog(col, vP), 1.0);
        }`,
    });
    const lake = new THREE.Mesh(new THREE.CircleGeometry(LAKE_R + 8, 64).rotateX(-Math.PI / 2), lakeMat);
    lake.position.set(0, LAKE_Y, 0); scene.add(lake);
    // the plume: the kit's smoke column over the lake, leaning north-west with the wind; its puffs keep the stream mountain-plume
    // THE PLUME'S FOOT is dealt from a stream of its own: on the lake, on the far side of the line's way across it (the line's
    // left, the outer side of its right-hand curve toward the cleft: the wind carries the plume north-west, so it leans away from
    // the line), between 0.45 and 0.85 of the lake's radius from its middle and 60 m and more from the line. Twelve places are
    // dealt; the first that stands so is taken (were there none, the place on that side farthest from the line)
    const PF = R.plumeFoot, pfc = [];
    for (let i = 0; i < 12; i++) pfc.push({ b: PF.range(0, 360) * D2R, r: PF.range(0.45, 0.85) * LAKE_R });
    for (const c of pfc) {
      c.x = Math.sin(c.b) * c.r; c.z = -Math.cos(c.b) * c.r;
      const nr = path.nearestXZ(c.x, c.z), p = path.pointAt(nr.u), t = path.tangentAt(nr.u);
      c.left = (c.x - p.x) * -t.z + (c.z - p.z) * t.x < 0; c.far = path.distanceTo(c.x, LAKE_Y, c.z);
    }
    const pfAt = pfc.find((c) => c.left && c.far >= 60) || pfc.filter((c) => c.left).sort((a, b) => b.far - a.far)[0] || pfc[0];
    const PLUME_AT = [pfAt.x, pfAt.z];
    const plume = fx.makeSmokeColumn({
      rng: R.plume, time: tU, position: [PLUME_AT[0], LAKE_Y + 2, PLUME_AT[1]], height: PLUME_H, radius: [14, 76], size: [28, 96], count: 116, color: '#d2bbb6', colorTop: '#eee2dc',
      shadowColor: '#6c5c80', ambient: '#4a4468', hot: '#ff6a24', hotFalloff: 130, opacity: 0.72, rate: 0.04, wind: PLUME_WIND, sunDir: SUN_DIR, sunColor: '#f0c8a8',
    });
    scene.add(plume.object);
    await ctx.yield();

    // THE BANK'S OWN GEOMETRY (the design's words): its south edge runs from the crater's south-east rim toward (330, 300) and on;
    // its west edge leaves (-120, -120) on heading 330. From them: the south edge's length and direction, and each edge's
    // normal toward the clear side
    const BANK_S0 = [95, 130], BANK_S1 = [330, 300], BANK_W0 = [-120, -120], BANK_WH = 330;
    const bankLen = Math.hypot(BANK_S1[0] - BANK_S0[0], BANK_S1[1] - BANK_S0[1]), bankEx = (BANK_S1[0] - BANK_S0[0]) / bankLen, bankEz = (BANK_S1[1] - BANK_S0[1]) / bankLen;
    const nSx = -bankEz, nSz = bankEx, nWx = -Math.cos(BANK_WH * D2R), nWz = -Math.sin(BANK_WH * D2R);
    // ------------------------------------------------------------ the cloud bank: against the east and north sides only
    // One layer with a cloud paint of our own (the kit's cloud sea cannot be bounded to one side of a mountain). Its
    // south edge runs from the crater's south-east rim (95, 130) south-eastward; there it pours a little down the lee slope.
    const cloudGeo = (() => {
      const rings = 64, segs = 96, pos = new Float32Array((rings + 1) * segs * 3), idx = [];
      for (let i = 0; i <= rings; i++) {
        const r = i <= 30 ? i * 10 : 300 * Math.pow(3500 / 300, (i - 30) / 34);
        for (let j = 0; j < segs; j++) { const a = (j + (i % 2) * 0.5) / segs * Math.PI * 2, k = (i * segs + j) * 3; pos[k] = TURN_C[0] + Math.cos(a) * r; pos[k + 1] = 0; pos[k + 2] = TURN_C[1] + Math.sin(a) * r; }
      }
      for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
        const a = i * segs + j, b = i * segs + (j + 1) % segs, c = a + segs, d = b + segs;
        if (i % 2) idx.push(a, c, d, a, d, b); else idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(TURN_C[0], CLOUD_TOP, TURN_C[1]), 3600);
      return g;
    })();
    const CLOUD_FN = /* glsl */`
      uniform vec4 uEdgeA, uEdgeB; uniform float uTop;
      // billows: rounded heads with sharp hollows between them, heaving slowly
      float billow(vec3 q) { return sqrt(clamp(abs(2.0 * vnoise(q) - 1.0), 0.0, 1.0)); }
      float cloudH(vec2 p, float t) {
        vec2 q = p + vec2(t * 1.1, t * 0.45);
        return billow(vec3(q / 92.0, t * 0.021)) * 17.0 + billow(vec3(q / 33.0 + 9.0, t * 0.04)) * 7.5 - 15.0;
      }
      float cloudFall(vec2 p) { return 1.0 - smoothstep(-70.0, 45.0, dot(p - uEdgeA.xy, uEdgeA.zw)); }
    `;
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: { ...LU, uT0: bank0, uTop: { value: CLOUD_TOP - 4 }, uEdgeA: { value: new THREE.Vector4(BANK_S0[0], BANK_S0[1], -nSx, -nSz) }, uEdgeB: { value: new THREE.Vector4(BANK_W0[0], BANK_W0[1], -nWx, -nWz) } },
      transparent: true, depthWrite: true,
      vertexShader: /* glsl */`
        ${fx.GLSL_NOISE}
        uniform float uTime, uT0; ${CLOUD_FN}
        varying vec3 vP;
        void main() {
          vec3 P = position; P.y = uTop + cloudH(P.xz, (uTime + uT0)) - 44.0 * cloudFall(P.xz);
          vP = P; gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
        }`,
      fragmentShader: /* glsl */`
        ${fx.GLSL_NOISE}
        ${LIGHT_GLSL}
        ${CLOUD_FN}
        uniform float uT0; varying vec3 vP;
        void main() {
          vec2 p = vP.xz; float h0 = cloudH(p, (uTime + uT0)), e = 3.0, rc = length(p);
          float fine = vnoise(p / 7.0 + (uTime + uT0) * 0.05) + 0.5 * vnoise(p / 3.1 - (uTime + uT0) * 0.07);
          float nz = (fine - 0.75) * 26.0 + h0 * 1.6;
          float k = smoothstep(-64.0, 28.0, dot(p - uEdgeA.xy, uEdgeA.zw) + nz) * smoothstep(-40.0, 50.0, dot(p - uEdgeB.xy, uEdgeB.zw) + nz) * smoothstep(182.0, 236.0, rc + nz);
          vec3 N = normalize(vec3(-(cloudH(p + vec2(e, 0.), (uTime + uT0)) - h0) / e, 0.8, -(cloudH(p + vec2(0., e), (uTime + uT0)) - h0) / e) + vec3(0.3, 0., 0.3) * (fine - 0.75));
          // gold on what faces the low sun, violet in its own shade, blue-violet in the hollows
          float sunK = smoothstep(uBand.x, uBand.y, vP.y), nl = clamp(dot(N, uSunDir) * 2.4 + 0.04, 0.0, 1.0);
          float depth = smoothstep(-13.0, 5.0, h0 + (fine - 0.75) * 5.0);
          vec3 shade = mix(vec3(0.05, 0.06, 0.21), vec3(0.23, 0.19, 0.43), depth);
          // the tops stand in the low sun whatever way they face; the hollows and far sides keep the violet shade
          float lit = max(nl * (0.15 + 0.85 * depth), 0.8 * smoothstep(-3.0, 7.0, h0 + (fine - 0.75) * 4.0));
          vec3 col = mix(shade, vec3(1.0, 0.85, 0.64) * 1.16, lit * sunK);
          col += uGlowCol * 0.08 * (1.0 - nl);
          // the edge breaks into shreds, it is no even veil; the shreds belong to the edge alone: where the layer has no body at
          // all (k = 0: the whole clear side, over the sea and the canyon) nothing is drawn, so no fleck of it stands in the sky
          float a = smoothstep(0.3, 0.62, k + (fine - 0.75) * 0.8 * (1.0 - k) * smoothstep(0.0, 0.12, k));
          gl_FragColor = vec4(placeFog(col, vP), a);
          if (a < 0.02) discard;
        }`,
    });
    cloudMat.side = THREE.DoubleSide;
    const cloud = new THREE.Mesh(cloudGeo, cloudMat); cloud.renderOrder = -0.5; cloud.frustumCulled = false; scene.add(cloud);
    await ctx.yield();
    // heads of cloud standing out of the layer (the kit's cumulus, each at a place of its own, no drift): along the bank's south
    // edge, down the lee slope beside it, and near and far in the bank's own sector.
    // THE KIT'S TRUE BODY (src/kit/sky.js, genCumulus): the height given to the kit is a head's flat BASE; its tallest tower
    // stands 0.42 to 0.70 of the breadth above that base and side towers stand up to half a breadth and their own radius from
    // the middle. So a head's top stands ABOVE the layer's top, as a head of cumulus does over a bank (by tens of metres on
    // the broad heads); the line is kept clear of every puff by the rule under the places.
    // PLACES BY RULE, from the bank's own geometry; the dice come from a stream of their own, all dealt first.
    // A HEAD'S BREADTH has one reason for every head: its flat base lies inside the bank's own depth under the top given here
    // (the layer's top less the land or sea under its place), between a half and the whole of that depth down, dealt; the
    // breadth is that drop over 0.56 (the height share handed to the kit). Where the land stands within 20 m of the layer's
    // top there is no head.
    //  - five along the south edge, at even shares of the edge's own length from a dealt start, each standing in from the edge
    //    by a dealt 0.2 to 0.4 of its breadth;
    //  - the falls: midway between each two of them, two smaller heads step down the lee slope on the clear side, a dealt 25 to
    //    40 m apart; the bank's depth at the edge thins by a third at each step (it is gone at the third), and each keeps to the slope;
    //  - six near heads and four far ones in the bank's own sector round the crater's middle (from the west edge's heading round
    //    by north and east to the south edge's), one in each equal part of it at a dealt bearing: the near ones between one and
    //    two times the turn's far reach from the crater's middle (the turn's centre's range plus its radius), the far ones
    //    between two and three times; each stands in from both edges by 0.3 of its breadth.
    const HP = R.headPlaces, hDice = [], heads = [];
    for (let i = 0; i < 23; i++) hDice.push({ a: HP(), b: HP(), c: HP() });
    const edgeStart = HP(), HEAD_ASPECT = 0.56, HEAD_PUFFS = 34;
    const breadth = (depth, die) => depth * lerp(0.5, 1, die) / HEAD_ASPECT;
    const headAt = (x, z, w, top) => heads.push([x, top - HEAD_ASPECT * w, z, w]);
    const under = (x, z) => Math.max(SEA_Y, groundAt(x, z));
    for (let i = 0; i < 5; i++) {
      const t = (edgeStart + i) / 5 * bankLen, x0 = BANK_S0[0] + bankEx * t, z0 = BANK_S0[1] + bankEz * t, dp = CLOUD_TOP - under(x0, z0), D = hDice[i];
      if (dp < 20) continue;
      const w = breadth(dp, D.a), inn = w * lerp(0.2, 0.4, D.b);
      headAt(x0 - nSx * inn, z0 - nSz * inn, w, CLOUD_TOP);
    }
    for (let i = 0; i < 4; i++) {
      const t = (edgeStart + i + 0.5) / 5 * bankLen, x0 = BANK_S0[0] + bankEx * t, z0 = BANK_S0[1] + bankEz * t, dp = CLOUD_TOP - under(x0, z0);
      if (dp < 20) continue;
      for (let k = 1; k <= 2; k++) {
        const D = hDice[5 + i * 2 + k - 1], out = k * lerp(25, 40, D.b), x = x0 + nSx * out, z = z0 + nSz * out, th = dp * (1 - k / 3);
        headAt(x, z, breadth(th, D.a), Math.min(CLOUD_TOP, under(x, z) + th));
      }
    }
    {
      const reach = Math.hypot(TURN_C[0], TURN_C[1]) + TURN_R, sH = Math.atan2(bankEx, -bankEz) / D2R, span = ((sH - BANK_WH) % 360 + 360) % 360;
      const sector = (j, n, lo, hi, D) => {
        const b = (BANK_WH + (j + D.a) / n * span) * D2R, r = reach * lerp(lo, hi, D.b);
        let x = Math.sin(b) * r, z = -Math.cos(b) * r;
        const dp = CLOUD_TOP - under(x, z);
        if (dp < 20) return;
        const w = breadth(dp, D.c), oS = (x - BANK_S0[0]) * nSx + (z - BANK_S0[1]) * nSz + 0.3 * w;
        if (oS > 0) { x -= nSx * oS; z -= nSz * oS; }
        const oW = (x - BANK_W0[0]) * nWx + (z - BANK_W0[1]) * nWz + 0.3 * w;
        if (oW > 0) { x -= nWx * oW; z -= nWz * oW; }
        headAt(x, z, w, CLOUD_TOP - 2);
      };
      for (let j = 0; j < 6; j++) sector(j, 6, 1, 2, hDice[13 + j]);
      for (let j = 0; j < 4; j++) sector(j, 4, 2, 3, hDice[19 + j]);
    }
    // THE LINE KEEPS CLEAR OF EVERY PUFF. The kit deals the puffs inside itself from the heads' own stream; a twin of that stream
    // (the same name and seed) deals the same dice here in the kit's own order, so every puff's place and size are known before
    // the field is made. A head of which a puff's drawn body (a ball of half its size) would be crossed by the line, or would
    // stand within one puff's size of it (eyes every 2 m from s 850 to the end), is given no body: it keeps its turn in the
    // kit's dealing, 1 m broad and far under the sea, so every other head stands exactly as it did
    {
      const TW = R.cloudHeadsTwin, pr = TW.fork ? TW.fork('clouds') : TW, eyes = [], none = [];
      for (let s = 850; s <= path.length; s += 2) eyes.push(path.posAtDist(s));
      for (let k = 0; k < heads.length; k++) {
        const hd = heads[k], W = hd[3], H = W * HEAD_ASPECT * (0.75 + 0.5 * pr()), tw = [{ x: 0, z: 0, r: W * 0.5, h: H }];
        let hit = false;
        for (let t = 1 + Math.floor(pr() * 3); t > 0; t--) { const a = pr() * 6.283, d = W * (0.22 + 0.3 * pr()); tw.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: W * (0.28 + 0.2 * pr()), h: H * (0.35 + 0.45 * pr()) }); }
        for (let j = 0; j < HEAD_PUFFS; j++) {
          const t = tw[pr() < 0.45 ? 0 : Math.floor(pr() * tw.length)];
          const f = pr() ** 1.25, a = pr() * 6.283, rr = t.r * (1 - 0.62 * f ** 1.4) * Math.sqrt(pr()), size = W * (0.3 - 0.13 * f) * (0.8 + 0.4 * pr());
          const px = hd[0] + t.x + Math.cos(a) * rr, py = hd[1] + f * t.h + size * 0.5, pz = hd[2] + t.z + Math.sin(a) * rr;
          pr();
          for (const e of eyes) if (Math.hypot(e.x - px, e.y - py, e.z - pz) < 1.5 * size) { hit = true; break; }
        }
        if (hit) none.push(k);
      }
      for (const k of none) heads[k] = [heads[k][0], -500, heads[k][2], 1];
    }
    const cloudHeads = await makeCloudFieldAsync({ rng: R.cloudHeads, mode: 'cumulus', sky, at: heads, height: HEAD_ASPECT, puffs: HEAD_PUFFS, wind: [0, 0, 0], hazeColor: LU.uFogCol.value }, ctx.yield);
    scene.add(cloudHeads.object);
    await ctx.yield();
    // the cloud sea's packed heads (the kit's sea of cloud without its own floor), held to the east and north by three solids it must
    // stay out of: the crater with its rim, and two great balls that stand for the clear air south-west of the bank's two edges
    const cloudSea = await makeCloudFieldAsync({
      rng: R.cloudSea, mode: 'sea', sky, altitude: 171, deck: false, spacing: 84, relief: 34, towers: 0.12, wind: [0.9, 0, 0.35], noiseTexture: cloudHeads.noiseTexture,
      hazeColor: LU.uFogCol.value, avoid: [[0, 168, 0, CRATER_CLEAR], [BANK_S0[0] + nSx * 2985, CLOUD_TOP, BANK_S0[1] + nSz * 2985, 3000], [BANK_W0[0] + nWx * 2985, CLOUD_TOP, BANK_W0[1] + nWz * 2985, 3000]],
    }, ctx.yield);
    scene.add(cloudSea.object);
    await ctx.yield();
    // the crater's glow: the lake's light on the gas above it, seen through the notch from the canyon and over the rim from the sea.
    // It is a volume BY PLACE: a density that depends on the world point alone (greatest 92 m over the lake, none beyond 135 m
    // to the side of that place or 48 m above or below that height), and every eye sees the sum of that density along its own ray.
    // Nothing in it reads the eye's distance or its facing. The line passes under it and beside it by place (it stays outside it).
    // THE GAS DRIFTS AS THE PLUME LEANS: the volume's middle stands down the plume's wind from the lake's middle by 0.3 of its
    // own breadth (40 m, north-west), so it does not hang between the lens and the east wall where the line makes for the cleft
    {
      const GR = new THREE.Vector3(135, 48, 135), gw = 0.3 * GR.x / Math.hypot(PLUME_WIND[0], PLUME_WIND[2]);
      const GC = new THREE.Vector3(PLUME_WIND[0] * gw, LAKE_Y + 92, PLUME_WIND[2] * gw);
      const glowMat = new THREE.ShaderMaterial({
        uniforms: { uTime: tU, uT0: glow0, uCol: { value: new THREE.Color(1.0, 0.36, 0.09) }, uC: { value: GC }, uR: { value: GR } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
        vertexShader: /* glsl */`varying vec3 vP; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uT0; uniform vec3 uCol, uC, uR; varying vec3 vP;
          void main() {
            // the ray from the eye to this point of the volume's far side, in the volume's own measure (a ball of radius 1)
            vec3 E = (cameraPosition - uC) / uR, D = vP - cameraPosition; D = D / max(length(D), 1e-3) / uR;
            float A = dot(D, D), B = dot(E, D), Cc = dot(E, E) - 1.0, h = sqrt(max(B * B - A * Cc, 0.0));
            float t0 = max((-B - h) / A, 0.0), t1 = max((-B + h) / A, t0);
            // the sum of the density (1 - r * r) along the ray, in metres, over the longest such sum (a level ray through the middle)
            float sum = -(A * (t1 * t1 * t1 - t0 * t0 * t0) / 3.0 + B * (t1 * t1 - t0 * t0) + Cc * (t1 - t0));
            float a = pow(clamp(sum / (1.3333 * uR.x), 0.0, 1.0), 1.3333);
            gl_FragColor = vec4(uCol * a * (0.8 + 0.06 * sin((uTime + uT0) * 0.8)), 1.0);
          }`,
      });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), glowMat);
      glow.position.copy(GC); glow.scale.copy(GR); glow.renderOrder = 3; glow.frustumCulled = false; scene.add(glow);
    }

    await ctx.yield();

    // ------------------------------------------------------------ fallen rock: in the canyon talus at the walls' feet, blocks and small rubble; in the crater's east wall, bedded ribs
    {
      const RR = R.rubble, want = Math.round(330 * density), cand = [], list = [];
      // every candidate's dice are drawn first; the first fourteen are the great blocks, the final ninety lie at the shoulders' feet
      // (the ninety take their dice from a stream of their own, so they lie alike whatever the density makes of the others)
      for (let i = 0; i < want + 90; i++) {
        const foot = i >= want, G = foot ? R.footLumps : RR, gi = Math.floor(G() * 3) % 3, sgn = G() < 0.5 ? -1 : 1, sd = G() < 0.5 ? -1 : 1;
        cand.push({
          s: foot ? GAPS[gi] + sgn * G.range(19, 37) : G.range(238, 594), side: foot ? 1 : sd, off: foot ? G.range(-2.5, 7) : G.range(-5.2, -0.5),
          sz: i < 14 ? G.range(2.4, 4.4) : 0.5 + 1.9 * Math.pow(G(), 2.2), rx: G.range(0, 6.28), ry: G.range(0, 6.28), rz: G.range(0, 6.28),
          sq: G.range(0.6, 1.0), tint: G(), sh: G.range(0.75, 1.08), ph: G(),
        });
      }
      // one uneven broken lump of eighty faces: every corner has its own reach by a fixed rule (0.6 to 1.3), the whole lump is
      // lopsided (one broad end) and one flank is broken off short; turned and stretched for each stone, so no two are alike and
      // there is no cube, no brick and no tablet among them
      const bg = new THREE.IcosahedronGeometry(0.6, 1), bp = bg.attributes.position;
      for (let i = 0; i < bp.count; i++) {
        const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
        const h = Math.sin(Math.round(x * 50) * 12.9898 + Math.round(y * 50) * 78.233 + Math.round(z * 50) * 37.719) * 43758.5453;
        let k = 0.6 + 0.7 * (h - Math.floor(h));
        k *= 1 + 0.3 * (0.8 * x + 0.6 * z) / 0.6;
        if ((0.5 * x - 0.7 * y + 0.5 * z) / 0.6 > 0.5) k *= 0.62;
        bp.setXYZ(i, x * k, y * k, z * k);
      }
      const slopeAt = (x, z) => Math.hypot(groundAt(x + 1.2, z) - groundAt(x - 1.2, z), groundAt(x, z + 1.2) - groundAt(x, z - 1.2)) / 2.4;
      for (let ci = 0; ci < cand.length; ci++) {
        const c = cand[ci];
        if (ci % 40 === 39) await ctx.yield();
        // none beside a gate (15 m along the line), none in a hollow, none on a wall: every block lies on near-level ground at a
        // wall's or a shoulder's foot, sunk about a third, 6 m or more to the side of the line
        let nearGate = false;
        for (const gs of gateS) if (Math.abs(c.s - gs) < 15) nearGate = true;
        if (nearGate) continue;
        const L = line(c.s), rl = Math.hypot(L.t.x, L.t.z) || 1, d = c.side * (land.halfW(c.s) + c.off), x = L.p.x - L.t.z / rl * d, z = L.p.z + L.t.x / rl * d;
        if (land.hollowAt(c.s, d) > 0.05 || slopeAt(x, z) > 0.42) continue;
        list.push({ x, y: groundAt(x, z) + c.sz * 0.13, z, c });
      }
      const rm = new THREE.ShaderMaterial({
        uniforms: { ...LU },
        vertexShader: /* glsl */`
          attribute vec4 aTint; varying vec3 vP, vL; varying vec4 vT;
          void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vP = wp.xyz; vL = position; vT = aTint; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          ${fx.GLSL_NOISE}
          ${LIGHT_GLSL}
          ${NEAR_GLSL}
          varying vec3 vP, vL; varying vec4 vT;
          void main() {
            vec3 N = normalize(cross(dFdx(vP), dFdy(vP)) + vec3(0.0, 1e-12, 0.0));
            // a block keeps the beds it broke from: bands across it in its own tilt, a dark seam between two bands
            float bb = vL.y * (5.0 + 4.0 * vT.w) + vT.w * 7.0 + 0.25 * vnoise(vP * 0.9), bh = hash11(floor(bb) * 3.1 + vT.w * 11.0);
            // every band takes the land's own bed paint: its two tones, mixed by the band's hash as the land mixes them by the bed's
            vec3 tone = mix(vec3(0.479, 0.138, 0.045), vec3(0.658, 0.323, 0.102), smoothstep(0.25, 0.45, bh));
            // (a lump of the crater's wall, vT.y 1, takes the bowl's own two tones: dark lava, and rust in some of its bands)
            tone = mix(tone, mix(vec3(0.12, 0.11, 0.135), vec3(0.30, 0.12, 0.07), step(0.66, bh)), vT.y);
            vec3 alb = tone * vT.x * (0.78 + 0.4 * fract(bh * 7.3)) * (1.0 - 0.4 * lineAA(bb, 0.07)) * (0.8 + 0.3 * vnoise(vP * 1.3));
            // the crack net is mapped on the plane the face lies nearest to (a lump's faces are flat), so it is never drawn out along a face
            vec3 aN = abs(N); vec2 cq = aN.y >= max(aN.x, aN.z) ? vP.xz : (aN.x > aN.z ? vP.zy : vP.xy);
            vec2 cp = crackPit(cq, vP);
            alb *= 1.0 - (0.42 * footK(vP, NET_STEP) * cp.x + 0.34 * footK(vP, PIT_STEP) * cp.y);
            // a lump takes the light much as the floor it lies on does (its faces lean the light, they do not turn it off), so it
            // keeps the beds' tone in the shade as well as in the sun
            // (a lump of the crater's wall keeps its own flat faces to the light: the lake's orange on one, the sky's blue-violet on the next)
            float ao = 0.78 + 0.22 * (N.y * 0.5 + 0.5); vec3 NL = normalize(N + vec3(0.0, 0.9 * (1.0 - vT.y), 0.0));
            vec3 col = underWhite(alb * (placeLight(vP, NL, ao, sunSeen(vP)) + dawnRose(vP, NL))) + skySheen(NL, ao);
            gl_FragColor = vec4(placeFog(col, vP), 1.0);
          }`,
      });
      const rubble = new THREE.InstancedMesh(bg, rm, Math.max(1, list.length));
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), tint = new Float32Array(Math.max(1, list.length) * 4);
      // a stone's tones are the land's own bed paint (in the stone's paint above); each stone only has a shade and a phase of its own
      list.forEach((r, i) => {
        const c = r.c;
        m4.compose(v4.set(r.x, r.y, r.z), q4.setFromEuler(e4.set(c.rx, c.ry, c.rz)), s4.set(c.sz, c.sz * c.sq, c.sz * (1.5 - c.sq)));
        rubble.setMatrixAt(i, m4); tint[i * 4] = c.sh; tint[i * 4 + 3] = c.ph;
      });
      bg.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 4));
      rubble.count = list.length; rubble.instanceMatrix.needsUpdate = true; rubble.frustumCulled = false; scene.add(rubble);

      // FALLEN BLOCKS: first up to twelve large lumps (the same lump, 2 to 5 m through) at the walls' feet, by rule along the whole
      // canyon, from a stream of their own. The stretches keep 15 m and more from every gate along the line, the gates' stations
      // read from the part's own plan: the mouth (46 to 20 m before the first gate), the middle of each pair of gates (15 m
      // short of either gate) and the head (16 to 22 m past the final gate). Each stretch has one block on a
      // seeded side; the three middles with the lowest dice have a second one on the other side. A block lies 0.6 to 2.6 m
      // inside the wall's foot with its whole body 12 m and more from the line, on near-level ground, in no hollow, sunk a
      // little; one that fails where its dice put it is tried at a few places near by and else left out. Every die is drawn
      // before any test. Its dark foot is in the land's paint (uBlk), so nothing see-through is added.
      await ctx.yield();
      const BK = R.blocks, spots = [[gateS[0] - 33, 13]], bcand = [], blist = [], taken = new Set(), lineS = [];
      for (let ss = 200; ss <= 650; ss += 2) lineS.push(path.posAtDist(ss));
      for (let g = 0; g < gateS.length - 1; g++) spots.push([0.5 * (gateS[g] + gateS[g + 1]), Math.max(0, 0.5 * (gateS[g + 1] - gateS[g]) - 15)]);
      spots.push([gateS[gateS.length - 1] + 19, 3]);
      const die = () => ({
        j: BK.range(-1, 1), side: BK() < 0.5 ? -1 : 1, m: BK.range(0.6, 2.6), sz: BK.range(1.9, 4.2), rx: BK.range(0, 6.28), ry: BK.range(0, 6.28), rz: BK.range(0, 6.28),
        sq: BK.range(0.6, 1.0), sh: BK.range(0.75, 1.08), ph: BK(), rank: BK(),
      });
      for (let i = 0; i < spots.length; i++) bcand.push({ i, twin: false, ...die() });
      const twins = bcand.slice(1, spots.length - 1).sort((a, b) => a.rank - b.rank).slice(0, 3).map((c) => c.i).sort((a, b) => a - b);
      for (const i of twins) bcand.push({ i, twin: true, ...die() });
      // the same dice are tried at six places in turn (the station as drawn, mirrored in its stretch, and nearer its middle with
      // the block 1.4 and 2.8 m farther in from the wall's foot), each on the drawn side first and then on the other
      const VAR = [[1, 0], [-1, 0], [0.35, 1.4], [-0.35, 1.4], [0.7, 2.8], [-0.7, 2.8]];
      const tryAt = (c, side, v) => {
        const key = c.i * 2 + (side > 0 ? 1 : 0), s = spots[c.i][0] + c.j * v[0] * spots[c.i][1], W = land.halfW(s);
        const sz = Math.min(c.sz, (W - 12.7) / 1.01), d = side * Math.max(W - c.m - v[1], 12.4 + 1.01 * sz);
        if (sz < 1.9 || taken.has(key)) return false;
        const L = line(s), rl = Math.hypot(L.t.x, L.t.z) || 1, x = L.p.x - L.t.z / rl * d, z = L.p.z + L.t.x / rl * d, e = Math.max(1.2, 0.6 * sz);
        // the ground's slope over the block's own span (a block may lie across a low step of the floor)
        if (land.hollowAt(s, d) > 0.05 || Math.hypot(groundAt(x + e, z) - groundAt(x - e, z), groundAt(x, z + e) - groundAt(x, z - e)) / (2 * e) > 0.5) return false;
        const y = groundAt(x, z) + 0.3 * sz * c.sq;
        let dl = 1e9;
        for (let k = Math.floor((s - 240) / 2); k <= Math.ceil((s - 160) / 2); k++) { const q = lineS[k]; dl = Math.min(dl, Math.hypot(q.x - x, q.y - y, q.z - z)); }
        if (dl - 1.01 * sz < 12) return false;
        taken.add(key); blist.push({ x, y, z, sz, c });
        return true;
      };
      const place = (c, side) => { for (const v of VAR) if (tryAt(c, side, v) || tryAt(c, -side, v)) return true; return false; };
      // one candidate a step of the build: the land is asked for its height many times for each
      for (const c of bcand) if (!c.twin) { place(c, c.side); await ctx.yield(); }
      for (const c of bcand) if (c.twin) { place(c, c.side); await ctx.yield(); }
      // LOOSE GROUPS OF BLOCKS bring the canyon's blocks to a dealt 28 to 40 a seed (the floor is no bare plain): fourteen
      // groups, one in each fourteenth of the blocks' own stretch, each of up to five blocks 1.5 to 5 m across within 7 m of the
      // group's middle. A group lies, as its die falls, at a wall's foot (1.5 to 4.5 m inside it, on a dealt side) or out on the
      // floor, 6 to 12 m to a dealt side of the line. From a stream of their own, every die drawn before any test. A block is
      // left out where a slab's bed lies under any part of it (the part's hollows, with 1.5 m to spare), on
      // steep ground, where it would touch another block, and where its whole body would leave less than 3.5 m of clear air to
      // the line (true distance); the groups are filled in order until the dealt count stands (seven more blocks are dealt to
      // each group and tried in a second and a third round where the first leaves the count short). Each has its dark foot (uBlk).
      {
        const BG = R.blockGroups, blkWant = 28 + Math.floor(BG() * 13), groups = [];
        for (let i = 0; i < 14; i++) {
          const g = { u: BG(), kind: BG(), side: BG() < 0.5 ? -1 : 1, e: BG(), lumps: [] };
          for (let k = 0; k < 12; k++) g.lumps.push({ r: 7 * Math.sqrt(BG()), a: BG.range(0, 6.283), sz: BG.range(1.25, 4.2), rx: BG.range(0, 6.28), ry: BG.range(0, 6.28), rz: BG.range(0, 6.28), sq: BG.range(0.6, 1.0), sh: BG.range(0.75, 1.08), ph: BG() });
          groups.push(g);
        }
        const gS0 = spots[0][0] - spots[0][1], gS1 = spots[spots.length - 1][0] + spots[spots.length - 1][1];
        for (let round = 0; round < 3; round++) for (let i = 0; i < 14 && blist.length < blkWant; i++) {
          const g = groups[i], s0 = lerp(gS0, gS1, (i + g.u) / 14), W0 = land.halfW(s0);
          const d0 = g.side * (g.kind < 0.5 ? W0 - lerp(1.5, 4.5, g.e) : lerp(6, 12, g.e));
          for (let k = [0, 5, 9][round]; k < [5, 9, 12][round] && blist.length < blkWant; k++) {
            const c = g.lumps[k], sl = s0 + Math.cos(c.a) * c.r, lim = land.halfW(sl) - 0.6 * c.sz - 0.6, rb = 0.6 * c.sz + 1.5;
            // (a block dealt beyond a wall's foot lies at that foot)
            const d = clamp(d0 + Math.sin(c.a) * c.r, -lim, lim);
            let inBed = land.hollowAt(sl, d) > 0.05;
            for (let a = 0; a < 6 && !inBed; a++) inBed = land.hollowAt(sl + Math.cos(a * 1.0472) * rb, d + Math.sin(a * 1.0472) * rb) > 0.05;
            if (inBed) continue;
            const L = line(sl), rl = Math.hypot(L.t.x, L.t.z) || 1, x = L.p.x - L.t.z / rl * d, z = L.p.z + L.t.x / rl * d, e = Math.max(1.2, 0.6 * c.sz);
            if (Math.hypot(groundAt(x + e, z) - groundAt(x - e, z), groundAt(x, z + e) - groundAt(x, z - e)) / (2 * e) > 0.5) continue;
            const y = groundAt(x, z) + 0.25 * c.sz * c.sq;
            let dl = 1e9;
            for (let j = Math.max(0, Math.floor((sl - 220) / 2)); j <= Math.min(lineS.length - 1, Math.ceil((sl - 180) / 2)); j++) { const q = lineS[j]; dl = Math.min(dl, Math.hypot(q.x - x, q.y - y, q.z - z)); }
            if (dl - 1.01 * c.sz < 3.6) continue;
            if (blist.some((b) => Math.hypot(b.x - x, b.z - z) < 0.75 * (b.sz + c.sz))) continue;
            blist.push({ x, y, z, sz: c.sz, c });
          }
          await ctx.yield();
        }
      }
      const bg2 = bg.clone(), blocks = new THREE.InstancedMesh(bg2, rm, 40), tint2 = new Float32Array(40 * 4);
      blist.forEach((r, i) => {
        const c = r.c;
        m4.compose(v4.set(r.x, r.y, r.z), q4.setFromEuler(e4.set(c.rx, c.ry, c.rz)), s4.set(r.sz, r.sz * c.sq, r.sz * (1.5 - c.sq)));
        blocks.setMatrixAt(i, m4); tint2[i * 4] = c.sh; tint2[i * 4 + 3] = c.ph;
        blkU[i].set(r.x, r.z, 0.8 * r.sz);
      });
      bg2.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint2, 4));
      blocks.count = blist.length; blocks.instanceMatrix.needsUpdate = true; blocks.frustumCulled = false; blocks.name = 'fallen-blocks'; scene.add(blocks);

      // SMALL RUBBLE ON THE FLOOR, under and beside the line (the lens flies about 6 m above the floor): the same lump at 0.4 to
      // 1.8 m, banded as the beds, sunk a little, in twelve drifts of five to twelve, one drift in each twelfth of the canyon's
      // length (the blocks' own stretch, from the mouth to the head), its lumps within 4.5 m of the drift's middle. A drift's
      // place is one of four kinds, as its die falls: along the rim of the nearest slab's bed (from the bed's middle outward in
      // a dealt direction to where the bed ends, and 1.2 m on); at a wall's foot (1.5 to 4 m inside it, on a dealt side); below a
      // gap of the east wall where one lies within 21 m (2 to 7 m inside the gap's foot); or scattered at a dealt place across
      // the floor's whole width. From a stream of its own; every die is drawn before any test. A lump is left out where a
      // slab's bed lies (the part's hollows), where it would stand in a wall's foot, where the ground is steep, where a block
      // lies, and where its whole body would leave less than 3.5 m of clear air to the line (true distance). Ninety-six lumps at
      // the most: 7,680 triangles. The eight largest have their dark foot in the land's paint, as the blocks have (the land's
      // paint holds forty-eight places, forty of them the blocks').
      const FR = R.floorRubble, fdr = [], flist = [];
      for (let i = 0; i < 12; i++) {
        const dr = { u: FR(), w: FR.range(-1, 1), kind: FR(), e: FR(), n: 5 + Math.floor(FR() * 8), lumps: [] };
        for (let k = 0; k < 12; k++) {
          dr.lumps.push({ r: 4.5 * Math.sqrt(FR()), a: FR.range(0, 6.283), sz: 0.4 + 1.4 * Math.pow(FR(), 1.6), rx: FR.range(0, 6.28), ry: FR.range(0, 6.28), rz: FR.range(0, 6.28), sq: FR.range(0.6, 1.0), sh: FR.range(0.75, 1.08), ph: FR() });
        }
        fdr.push(dr);
      }
      const fS0 = spots[0][0] - spots[0][1], fS1 = spots[spots.length - 1][0] + spots[spots.length - 1][1];
      for (let i = 0; i < 12; i++) {
        const dr = fdr[i];
        let s0 = lerp(fS0, fS1, (i + dr.u) / 12), d0 = dr.w * (land.halfW(s0) - 2);
        const gap = GAPS.find((g) => Math.abs(g - s0) < 21), bed = hollows.reduce((a, h) => (!a || Math.abs(h.s - s0) < Math.abs(a.s - s0) ? h : a), null);
        if (dr.kind < 0.3 && bed) {
          // the bed's middle in the line's own measures (the bed lies askew by its yaw)
          const dm = 0.5 * (bed.d0 + bed.d1), sm = bed.s - dm * Math.sin(bed.yaw || 0), dmid = dm * Math.cos(bed.yaw || 0), a = dr.e * 6.283;
          let r = 0;
          while (r < 30 && land.hollowAt(sm + Math.cos(a) * r, dmid + Math.sin(a) * r) > 0.05) r += 0.5;
          const sr = sm + Math.cos(a) * (r + 1.2), dr2 = dmid + Math.sin(a) * (r + 1.2);
          if (Math.abs(dr2) < land.halfW(sr) - 1) { s0 = sr; d0 = dr2; }
        } else if (dr.kind < 0.55) {
          d0 = (dr.w < 0 ? -1 : 1) * (land.halfW(s0) - lerp(1.5, 4, dr.e));
        } else if (dr.kind < 0.75 && gap !== undefined) {
          s0 = gap + lerp(-8, 8, dr.e); d0 = land.halfW(s0) - lerp(2, 7, Math.abs(dr.w));
        }
        for (let k = 0; k < dr.n && flist.length < 96; k++) {
          const c = dr.lumps[k], sl = s0 + Math.cos(c.a) * c.r, d = d0 + Math.sin(c.a) * c.r;
          if (Math.abs(d) > land.halfW(sl) - 0.6 * c.sz - 0.5 || land.hollowAt(sl, d) > 0.05) continue;
          const L = line(sl), rl = Math.hypot(L.t.x, L.t.z) || 1, x = L.p.x - L.t.z / rl * d, z = L.p.z + L.t.x / rl * d, e = Math.max(0.6, 0.6 * c.sz);
          if (Math.hypot(groundAt(x + e, z) - groundAt(x - e, z), groundAt(x, z + e) - groundAt(x, z - e)) / (2 * e) > 0.5) continue;
          const y = groundAt(x, z) + 0.2 * c.sz * c.sq;
          let dl = 1e9;
          for (let j = Math.max(0, Math.floor((sl - 216) / 2)); j <= Math.min(lineS.length - 1, Math.ceil((sl - 184) / 2)); j++) { const q = lineS[j]; dl = Math.min(dl, Math.hypot(q.x - x, q.y - y, q.z - z)); }
          // (3.5 m, and 0.1 m more for the 2 m grid the line is measured on)
          if (dl - 1.01 * c.sz < 3.6) continue;
          if (blist.some((b) => Math.hypot(b.x - x, b.z - z) < 0.8 * b.sz + 0.6 * c.sz)) continue;
          flist.push({ x, y, z, c });
        }
        await ctx.yield();
      }
      const bg3 = bg.clone(), floorRub = new THREE.InstancedMesh(bg3, rm, 96), tint3 = new Float32Array(96 * 4);
      flist.forEach((r, i) => {
        const c = r.c;
        m4.compose(v4.set(r.x, r.y, r.z), q4.setFromEuler(e4.set(c.rx, c.ry, c.rz)), s4.set(c.sz, c.sz * c.sq, c.sz * (1.5 - c.sq)));
        floorRub.setMatrixAt(i, m4); tint3[i * 4] = c.sh; tint3[i * 4 + 3] = c.ph;
      });
      bg3.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint3, 4));
      flist.slice().sort((a, b) => b.c.sz - a.c.sz).slice(0, 8).forEach((r, i) => blkU[40 + i].set(r.x, r.z, 0.8 * r.c.sz));
      floorRub.count = flist.length; floorRub.instanceMatrix.needsUpdate = true; floorRub.frustumCulled = false; floorRub.name = 'floor-rubble'; scene.add(floorRub);

      // RIBS AND OUTCROPS OF THE CRATER'S EAST WALL, the wall the lens faces from the lake's far shore to the cleft: BODIES of the
      // blocks' own lump, 2 to 8 m across, bedded to their middle in the wall and drawn out one and a half to twice, down the
      // wall (a rib) or along it (a ledge) as the die falls; dark lava with rust in some bands. From a stream of their own,
      // every die drawn before any test: sixty places in the sector of the wall the lens sees from the lake (the bearing of the
      // cleft's foot from the lake's middle, and the lens's own half field of 47 degrees to either side), from the shore to
      // 55 m beyond it. One is left out on the lake, in the cleft's own bed and at its trees (24 m and its own reach to either
      // side of the line from the cleft's foot on), and where its whole body would leave less than 3.5 m of clear air to the line.
      await ctx.yield();
      {
        const WR = R.wallRibs, wc = [], wl = [], wLine = [], pm = path.posAtDist(CLEFT_S0), b0 = Math.atan2(pm.x, -pm.z), half = 47 * D2R;
        for (let i = 0; i < 60; i++) wc.push({ u: WR(), v: WR(), sz: WR.range(1.67, 6.67), rib: WR() < 0.5, st: WR.range(1.5, 2.0), roll: WR.range(0, 6.283), sq: WR.range(0.6, 1.0), sh: WR.range(0.8, 1.1), ph: WR() });
        for (let ss = 700; ss <= 960; ss += 2) wLine.push(path.posAtDist(ss));
        const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), nrm = new THREE.Vector3(), bm = new THREE.Matrix4(), qr = new THREE.Quaternion();
        for (let i = 0; i < wc.length; i++) {
          const c = wc[i], b = b0 + (2 * c.u - 1) * half, rr = LAKE_R + 55 * c.v, x = Math.sin(b) * rr, z = -Math.cos(b) * rr, reach = 1.01 * c.sz * c.st;
          if (i % 12 === 11) await ctx.yield();
          if (rr < LAKE_R + 0.5 * reach) continue;
          const w = land.way(x, z);
          if (w.ok && w.s > CLEFT_S0 - 9 && Math.abs(w.d) < 24 + reach) continue;
          const y = groundAt(x, z) + 0.1 * c.sz;
          let dl = 1e9;
          for (const q of wLine) dl = Math.min(dl, Math.hypot(q.x - x, q.y - y, q.z - z));
          if (dl - reach < 3.6) continue;
          // the wall's own lie at the place: its normal, and the long axis down the wall (a rib) or along it (a ledge)
          const gx = (groundAt(x + 2, z) - groundAt(x - 2, z)) / 4, gz = (groundAt(x, z + 2) - groundAt(x, z - 2)) / 4;
          nrm.set(-gx, 1, -gz).normalize();
          if (c.rib) X.set(Math.sin(b), Math.hypot(gx, gz), -Math.cos(b)).normalize(); else X.set(Math.cos(b), 0, Math.sin(b));
          Z.crossVectors(X, nrm).normalize(); Y.crossVectors(Z, X);
          bm.makeBasis(X, Y, Z); q4.setFromRotationMatrix(bm).multiply(qr.setFromAxisAngle(v4.set(1, 0, 0), c.roll));
          wl.push({ x, y, z, c, q: q4.clone() });
        }
        const bg4 = bg.clone(), ribs = new THREE.InstancedMesh(bg4, rm, 60), tint4 = new Float32Array(60 * 4);
        wl.forEach((r, i) => {
          const c = r.c;
          m4.compose(v4.set(r.x, r.y, r.z), r.q, s4.set(c.sz * c.st, c.sz * c.sq * 0.8, c.sz * (1.5 - c.sq) * 0.8));
          ribs.setMatrixAt(i, m4); tint4[i * 4] = c.sh; tint4[i * 4 + 1] = 1; tint4[i * 4 + 3] = c.ph;
        });
        bg4.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint4, 4));
        ribs.count = wl.length; ribs.instanceMatrix.needsUpdate = true; ribs.frustumCulled = false; ribs.name = 'wall-ribs'; scene.add(ribs);
      }
    }

    await ctx.yield();

    // ------------------------------------------------------------ plain bergs on the sea, and frost smoke low over the water
    {
      const BR = R.bergs, M = 9, pos = [], col = [], shd = [], idx = [], cand = [];
      for (let i = 0; i < 16; i++) cand.push({ s: BR.range(8, 205), d: (BR() < 0.5 ? -1 : 1) * BR.range(55, 190), r: BR.range(9, 18), h: BR.range(4.5, 9), ph: BR.range(0, 6.28), ox: BR.range(-0.3, 0.3), oz: BR.range(-0.3, 0.3) });
      let made = 0;
      for (const c of cand) {
        if (made >= 7) break;
        const L = line(c.s), rl = Math.hypot(L.t.x, L.t.z) || 1, x = L.p.x - L.t.z / rl * c.d, z = L.p.z + L.t.x / rl * c.d;
        // a berg floats on open water only, 55 m or more to the side of the line
        if (groundAt(x, z) > -1.5 || groundAt(x + c.r, z) > -1.5 || groundAt(x - c.r, z) > -1.5 || groundAt(x, z + c.r) > -1.5 || groundAt(x, z - c.r) > -1.5) continue;
        const base = pos.length / 3, rings = [[-2.5, 1.05], [0.32 * c.h, 0.94], [0.72 * c.h, 0.58], [c.h, 0.2]];
        for (let i = 0; i < rings.length; i++) for (let j = 0; j < M; j++) {
          const a = j / M * Math.PI * 2 + c.ph, rr = c.r * rings[i][1] * (0.8 + 0.4 * land.noise.n2(x * 0.1 + j * 1.7, z * 0.1 + i * 2.3)), top = i / (rings.length - 1);
          pos.push(x + c.ox * c.r * top + Math.cos(a) * rr, rings[i][0] + (i === 2 ? 0.25 * c.h * land.noise.n2(j * 3.1, x) : 0), z + c.oz * c.r * top + Math.sin(a) * rr); col.push(1, 1, 1); shd.push(top, 1);
        }
        for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < M; j++) { const a = base + i * M + j, b = base + i * M + (j + 1) % M; idx.push(a, a + M, b, b, a + M, b + M); }
        const apex = pos.length / 3; pos.push(x + c.ox * c.r, c.h + 0.6, z + c.oz * c.r); col.push(1, 1, 1); shd.push(1, 1);
        for (let j = 0; j < M; j++) idx.push(base + 3 * M + j, apex, base + 3 * M + (j + 1) % M);
        made++;
      }
      if (made) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aShade', new THREE.Float32BufferAttribute(shd, 2));
        g.setIndex(idx); g.computeVertexNormals();
        scene.add(new THREE.Mesh(g, rockMaterial(LU, BERG_FRAG)));
      }
      // frost smoke: thin level layers of mist a few metres over the water, well to the side of the line
      const fp = [], fu = [], fi = [], FS = R.frost;
      for (let i = 0; i < 12; i++) {
        const s = FS.range(0, 215), d = (FS() < 0.5 ? -1 : 1) * FS.range(46, 210), w = FS.range(70, 150), l = FS.range(40, 80), y = FS.range(2.2, 5.5), L = line(s), rl = Math.hypot(L.t.x, L.t.z) || 1;
        const x = L.p.x - L.t.z / rl * d, z = L.p.z + L.t.x / rl * d, b = fp.length / 3;
        fp.push(x - w, y, z - l, x + w, y, z - l, x + w, y, z + l, x - w, y, z + l); fu.push(0, 0, 1, 0, 1, 1, 0, 1); fi.push(b, b + 2, b + 1, b, b + 3, b + 2);
      }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(fu, 2)); fg.setIndex(fi);
      const fm = new THREE.ShaderMaterial({
        uniforms: { ...LU, uAmt: { value: rare ? 0.42 : 0.22 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vP; void main() { vUv = uv; vP = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`
          ${fx.GLSL_NOISE}
          ${LIGHT_GLSL}
          uniform float uAmt; varying vec2 vUv; varying vec3 vP;
          void main() {
            vec2 c = vUv * 2.0 - 1.0; float e = clamp(1.0 - dot(c, c), 0.0, 1.0);
            float n = vnoise(vec3(vP.xz * 0.035 + vec2(uTime * 0.03, 0.0), uTime * 0.02)) * 0.65 + vnoise(vP.xz * 0.11 - uTime * 0.02) * 0.35;
            float a = e * e * smoothstep(0.35, 0.75, n) * uAmt;
            vec3 col = vec3(0.50, 0.58, 0.80) + uGlowCol * 0.22;
            gl_FragColor = vec4(placeFog(col, vP), a);
          }`,
      });
      const frost = new THREE.Mesh(fg, fm); frost.renderOrder = 2; scene.add(frost);
    }

    await ctx.yield();

    // ------------------------------------------------------------ dust in the canyon's bands of light
    // Motes that sink slowly in the air near the three gaps. Each keeps to its own upright column at least 4.2 m to the side of the
    // line, and is lit only where the way to the sun stands open (the same rule as the land's dawn light), so it shows in the bands.
    {
      // the rare look: diamond dust, the same motes hanging in the air over the sea stretch as well
      const DR = R.dust, per = Math.round(420 * density), nSea = rare ? 450 : 0, n = per * GAPS.length + nSea, pos = new Float32Array(n * 3), sd = new Float32Array(n);
      let k = 0;
      for (let i = 0; i < nSea; i++) {
        const s = DR.range(0, 235), d = (DR() < 0.5 ? -1 : 1) * DR.range(4.5, 70), L = line(s), rl = Math.hypot(L.t.x, L.t.z) || 1;
        pos[k * 3] = L.p.x - L.t.z / rl * d; pos[k * 3 + 1] = DR.range(7, 34); pos[k * 3 + 2] = L.p.z + L.t.x / rl * d; sd[k] = DR(); k++;
      }
      for (let gi = 0; gi < GAPS.length; gi++) {
        // each gap's motes from a stream of the gap's own
        const gs = GAPS[gi], AR = R.gapMotes[gi];
        for (let i = 0; i < per; i++) {
          const s = gs + AR.range(-30, 30), d = (AR() < 0.5 ? -1 : 1) * AR.range(4.2, 19), up = AR.range(1, 30), L = line(s);
          const rl = Math.hypot(L.t.x, L.t.z) || 1, x = L.p.x - L.t.z / rl * d, z = L.p.z + L.t.x / rl * d;
          pos[k * 3] = x; pos[k * 3 + 1] = groundAt(x, z) + up; pos[k * 3 + 2] = z; sd[k] = AR(); k++;
        }
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dg.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
      const dm = new THREE.ShaderMaterial({
        uniforms: { ...LU }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute float aSeed; uniform float uTime; varying vec3 vP; varying float vK;
          void main() {
            float ph = mod(uTime * (0.2 + 0.25 * aSeed) + aSeed * 7.0, 6.0);
            vec3 P = position; P.y -= ph;
            vP = P; vK = sin(3.14159 * ph / 6.0) * (0.55 + 0.45 * sin(uTime * (1.3 + 2.0 * aSeed) + aSeed * 90.0));
            vec4 mv = viewMatrix * vec4(P, 1.0);
            gl_PointSize = clamp(46.0 * (0.6 + aSeed) / max(-mv.z, 1.0), 1.2, 6.0);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          ${LIGHT_GLSL}
          varying vec3 vP; varying float vK;
          void main() {
            vec2 c = gl_PointCoord * 2.0 - 1.0; float a = max(1.0 - dot(c, c), 0.0);
            vec4 sm = texture2D(uShadeMap, (vP.xz - uShadeBox.xy) * uShadeBox.zw);
            float open = smoothstep(-1.0, 2.5, vP.y - sm.b);
            vec3 col = mix(uGlowCol * 1.5, uSunCol * 0.8, smoothstep(45.0, 105.0, vP.y));
            gl_FragColor = vec4(col * (a * a * open * vK * 0.85), 1.0);
          }`,
      });
      const motes = new THREE.Points(dg, dm); motes.frustumCulled = false; motes.renderOrder = 4; scene.add(motes);
    }


    await ctx.yield();

    // ------------------------------------------------------------ the summit's pillars: bare pale rock, rooted, widening to the foot
    // PLACES BY RULE, every end from the design's words (land.summit) and the land's own geometry. The places' dice come from a
    // stream of their own, all dealt first, twelve pillars' worth whatever the count; the shapes' dice from the older stream:
    //  - the count: two at the cleft's head, a crown of five or six (dealt) inside the turn, three or four (dealt) outside it;
    //  - tops are dealt between y 232 and 292 (the design's span);
    //  - a pillar's foot radius is a dealt share, 0.16 to 0.22, of the height it stands above the cloud's top: a tall spire is
    //    broad at the foot, a low one slim;
    //  - the two at the cleft's head are the two slimmest of the twelve dealt (the gully's head has the least room); they stand
    //    either side of the gully where the line comes out of it (the turn's first knot), off the line by the gully's half width, the greatest reach of the pillar's own skirt (its foot radius, its lowest blocks'
    //    swell, its flare, its lobes and roughness: the shape rule's own terms) and a dealt 2 to 6 m of open rock;
    //  - the crown stands on a ring round the turn's centre. The south pillar of the cleft's head stands inside the turn too,
    //    so it takes its place in the ring: that pillar and the crown's five or six share the circle in proportion to their
    //    feet (foot radius and 1.5 m each), going round from the head pillar's own bearing in a dealt direction, in the dealt
    //    order. So neighbours stand feet apart at any range from rMin outward (the range at which the shared arcs are as long
    //    as the feet are broad, with 8 in 100 more for the chords); each one's range is dealt between rMin and the range at
    //    which its foot is 30 m from the line (the turn's radius less 30 m less its foot radius). Where the ring has no such
    //    room, all the crown's pillars are made slimmer by one share until it has;
    //  - those outside the turn stand along the turn's own span (the bearings its first and final knots have from its centre),
    //    one in each equal part of it at a dealt share of its middle four tenths, the foot 30 m and more from the line, the
    //    axis 120 m or less from it;
    //  - feet apart, as a final guard: were two feet to touch, both pillars are made slimmer until 3 m of ground lie between.
    const PP = R.pillarPlaces, PR = R.pillars;
    const nCrown = PP() < 0.5 ? 5 : 6, nOut = PP() < 0.5 ? 3 : 4, crownDir = PP() < 0.5 ? -1 : 1, pDice = [];
    for (let i = 0; i < 12; i++) pDice.push({ top: PP.range(232, 292), share: PP.range(0.16, 0.22), u: PP(), v: PP() });
    const pShape = pDice.map((d) => {
      const nb = PR.int(5, 7), jit = [0, 1, 2, 3, 4, 5].map(() => PR.range(-0.3, 0.3)), mul = [0, 1, 2, 3, 4, 5, 6, 7].map(() => PR.range(0.8, 1.2)), bounds = [0];
      for (let b = 1; b < nb; b++) bounds.push((b + jit[b - 1]) / nb);
      bounds.push(1);
      return {
        top: d.top, rFoot: (d.top - CLOUD_TOP) * d.share, rTopK: PR.range(0.36, 0.48), ph: PR.range(0, 6.28), lobes: PR.range(0.14, 0.3),
        lean: [PR.range(-0.035, 0.035), PR.range(-0.035, 0.035)], seed: PR.range(0, 100), bounds, mult: mul.slice(0, nb + 1), peak: [PR.range(-0.5, 0.5), PR.range(2, 7), PR.range(-0.5, 0.5)],
      };
    });
    const PILL = [];
    {
      const put = (i, x, z) => PILL.push({ ...pShape[i], x, z });
      // the two slimmest for the cleft's head; the other ten keep their dealt order: six places for the crown, four for outside
      const bySlim = pShape.map((S, i) => i).sort((a, b) => pShape[a].rFoot - pShape[b].rFoot);
      const headI = bySlim.slice(0, 2).sort((a, b) => a - b), restI = bySlim.slice(2).sort((a, b) => a - b);
      // the cleft's head: the turn's first knot, and the line's right hand there
      const b0 = (TURN_H0 - 90) * D2R, hx = TURN_C[0] + TURN_R * Math.sin(b0), hz = TURN_C[1] - TURN_R * Math.cos(b0), rx = Math.cos(TURN_H0 * D2R), rz = Math.sin(TURN_H0 * D2R);
      for (const [i, side] of [[headI[0], -1], [headI[1], 1]]) {
        const S = pShape[i], reach = S.rFoot * Math.max(S.mult[0], S.mult[1]) * (1 + PILLAR_FLARE) * (1 + S.lobes + PILLAR_ROUGH[0] + PILLAR_ROUGH[1]);
        const off = CLEFT_HW + reach + lerp(2, 6, pDice[i].u);
        put(i, hx + rx * side * off, hz + rz * side * off);
      }
      {
        const H = PILL[1], hb = Math.atan2(H.x - TURN_C[0], -(H.z - TURN_C[1])), crownI = restI.slice(0, nCrown);
        const wSum = (f) => H.rFoot + 1.5 + crownI.reduce((a, i) => a + f * pShape[i].rFoot + 1.5, 0);
        const rMinAt = (f) => 1.08 * wSum(f) / Math.PI, rHiLeast = (f) => TURN_R - 30 - f * Math.max(...crownI.map((i) => pShape[i].rFoot));
        let slim = 1;
        while (slim > 0.5 && rMinAt(slim) > rHiLeast(slim)) slim -= 0.02;
        const wAll = wSum(slim), rMin = rMinAt(slim);
        let acc = (H.rFoot + 1.5) / 2;
        for (let k = 0; k < nCrown; k++) {
          const i = crownI[k], S = pShape[i], rF = S.rFoot * slim, w = rF + 1.5, b = hb + crownDir * (acc + w / 2) / wAll * 2 * Math.PI;
          const rHi = TURN_R - 30 - rF, r = lerp(Math.min(rMin, rHi), rHi, pDice[i].v);
          acc += w;
          PILL.push({ ...S, rFoot: rF, x: TURN_C[0] + Math.sin(b) * r, z: TURN_C[1] - Math.cos(b) * r });
        }
      }
      const spanLo = TURN_H0 - 90, spanHi = TURN_H1 - 90;
      for (let k = 0; k < nOut; k++) {
        const i = restI[6 + k], S = pShape[i], d = pDice[i], b = (spanLo + (k + lerp(0.3, 0.7, d.u)) * (spanHi - spanLo) / nOut) * D2R;
        let r = TURN_R + lerp(30 + S.rFoot, 120, d.v), x = TURN_C[0] + Math.sin(b) * r, z = TURN_C[1] - Math.cos(b) * r;
        // near the span's two ends the cleft's way in or the final straight may lie nearer than the turn's arc: stand out till the foot is 30 m off
        for (let n = 0; n < 40 && path.nearestXZ(x, z).dist < 30 + S.rFoot; n++) { r += 3; x = TURN_C[0] + Math.sin(b) * r; z = TURN_C[1] - Math.cos(b) * r; }
        put(i, x, z);
      }
      for (let a = 0; a < PILL.length; a++) for (let b = a + 1; b < PILL.length; b++) {
        const A = PILL[a], B = PILL[b], d = Math.hypot(A.x - B.x, A.z - B.z);
        if (d < A.rFoot + B.rFoot + 3) { const k = Math.max(0.3, (d - 3) / (A.rFoot + B.rFoot)); A.rFoot *= k; B.rFoot *= k; }
      }
    }
    const pillars = PILL.map((q) => {
      const { x, z, top, rFoot } = q;
      let foot = 1e9; for (let a = 0; a < 8; a++) foot = Math.min(foot, groundAt(x + Math.cos(a * 0.785) * rFoot, z + Math.sin(a * 0.785) * rFoot));
      return { x, z, top, foot: foot - 5, rFoot, rTop: rFoot * q.rTopK, radius: rFoot * 0.62, ph: q.ph, lobes: q.lobes, lean: q.lean, seed: q.seed, bounds: q.bounds, mult: q.mult, peak: q.peak };
    });
    // the crown's tallest pillar (the first look's subject)
    const crownTall = pillars.slice(2, 2 + nCrown).reduce((a, b) => (b.top > a.top ? b : a));
    // a pillar's radius at height share t, in block b, toward angle a: one rule for the rock and for what roots on its ledges
    const pillarR = (P, t, b, a) => {
      const y = P.foot + (P.top - P.foot) * t, cx = Math.cos(a), cz = Math.sin(a), N2 = land.noise;
      // the foot flares into a skirt of fallen rock
      return (P.rTop + (P.rFoot - P.rTop) * (1 - t)) * P.mult[b] * (1 + PILLAR_FLARE * (1 - smoothstep(0, 0.16, t))) * (1 + P.lobes * Math.cos(2 * a + P.ph + t * 1.6) + PILLAR_ROUGH[0] * N2.n3(cx * 1.3 + P.seed, y * 0.045, cz * 1.3) + PILLAR_ROUGH[1] * N2.n3(cx * 3.1, y * 0.16 + P.seed, cz * 3.1));
    };
    const pillarGeo = (() => {
      const M = 13, pos = [], col = [], shd = [], idx = [], N2 = land.noise;
      for (const P of pillars) {
        const base = pos.length / 3, H = P.top - P.foot, ts = [], bs = [];
        // rings crowd at the bounds of the pillar's great blocks, so each block steps in from the one below: ledges
        for (let b = 0; b < P.bounds.length - 1; b++) for (const f of [0.02, 0.3, 0.62, 0.98]) { ts.push(lerp(P.bounds[b], P.bounds[b + 1], f)); bs.push(b); }
        const K = ts.length;
        for (let i = 0; i < K; i++) {
          const t = ts[i], y = P.foot + H * t;
          for (let j = 0; j < M; j++) {
            const a = (j + 0.37 * bs[i]) / M * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
            const r = pillarR(P, t, bs[i], a);
            pos.push(P.x + P.lean[0] * H * t + cx * r, y + 1.2 * N2.n2(a * 2 + P.seed, t * 9), P.z + P.lean[1] * H * t + cz * r); col.push(P.x, P.z, 0); shd.push(t, 1);
          }
        }
        pos.push(P.x + P.lean[0] * H + P.peak[0] * P.rTop, P.top + P.peak[1], P.z + P.lean[1] * H + P.peak[2] * P.rTop); col.push(P.x, P.z, 0); shd.push(1, 1);
        for (let i = 0; i < K - 1; i++) for (let j = 0; j < M; j++) { const a = base + i * M + j, b = base + i * M + (j + 1) % M; idx.push(a, a + M, b, b, a + M, b + M); }
        for (let j = 0; j < M; j++) idx.push(base + (K - 1) * M + j, base + K * M, base + (K - 1) * M + (j + 1) % M);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aShade', new THREE.Float32BufferAttribute(shd, 2));
      g.setIndex(idx); g.computeVertexNormals(); return g;
    })();
    const pillarMesh = new THREE.Mesh(pillarGeo, rockMaterial(LU, PILLAR_FRAG)); scene.add(pillarMesh);
    await ctx.yield();

    // ------------------------------------------------------------ pack ice: flat white floes with blue edges, rocking gently
    const floeGeo = (() => {
      const M = 9, rad = [1.0, 0.86, 1.08, 0.94, 0.8, 1.05, 0.9, 1.1, 0.84], pos = [0, 0.44, 0], idx = [];
      for (const [k, y] of [[0.9, 0.44], [1.0, 0.26], [1.03, -0.55]]) for (let j = 0; j < M; j++) { const a = j / M * Math.PI * 2; pos.push(Math.cos(a) * rad[j] * k, y, Math.sin(a) * rad[j] * k); }
      for (let j = 0; j < M; j++) idx.push(0, 1 + (j + 1) % M, 1 + j);
      for (let r = 0; r < 2; r++) for (let j = 0; j < M; j++) { const a = 1 + r * M + j, b = 1 + r * M + (j + 1) % M; idx.push(a, b, a + M, b, b + M, a + M); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const flat = g.toNonIndexed(); flat.computeVertexNormals(); return flat;
    })();
    const FR = R.floes, floeWant = Math.round(640 * density), floes = [];
    const entryBack = path.startTangent.clone().setY(0).normalize();
    {
      // every candidate's dice first, then the tests: on open water, clear of the line by 9 m and of the entry's axis behind it
      // two fields: the pack round the sea stretch of the line (up to 170 m either side), and the open pack of the south and west sea
      const cand = [], nNear = Math.round(floeWant * 0.26), tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3();
      for (let i = 0; i < floeWant; i++) cand.push({ near: i < nNear, a: FR(), u: FR(), sz: 3 + 12 * Math.pow(FR(), i < nNear ? 2.0 : 1.3), yaw: FR.range(0, Math.PI * 2), sq: FR.range(0.8, 1.25), ph: FR.range(0, 6.28), amp: FR.range(0.05, 0.16) });
      for (const c of cand) {
        let x, z; const reach = c.sz * 1.15;
        if (c.near) {
          const s = -120 + 370 * c.a, d = (c.u * 2 - 1) * 170;
          path.posAtDist(s, tmpP); path.tangentAtDist(s, tmpT); const hl = Math.hypot(tmpT.x, tmpT.z) || 1;
          x = tmpP.x - tmpT.z / hl * d; z = tmpP.z + tmpT.x / hl * d;
        } else {
          const hd = (125 + 200 * c.a) * D2R, r = 525 + 1300 * Math.pow(c.u, 1.4);
          x = Math.sin(hd) * r; z = -Math.cos(hd) * r;
        }
        if (groundAt(x, z) > -2.5 || groundAt(x + reach, z) > -1.5 || groundAt(x - reach, z) > -1.5 || groundAt(x, z + reach) > -1.5 || groundAt(x, z - reach) > -1.5) continue;
        if (path.nearestXZ(x, z).dist < reach + 9.5) continue;
        const bx = x - path.start.x, bz = z - path.start.z, al = bx * entryBack.x + bz * entryBack.z;
        if (al < 0 && al > -345 && Math.abs(bx * entryBack.z - bz * entryBack.x) < reach + 16) continue;
        let free = true; for (const f of floes) if ((f.x - x) ** 2 + (f.z - z) ** 2 < (f.sz + c.sz) * (f.sz + c.sz) * 1.2) { free = false; break; }
        if (free) floes.push({ x, z, ...c });
      }
    }
    const floeMat = new THREE.ShaderMaterial({
      uniforms: { ...LU },
      vertexShader: /* glsl */`
        attribute vec2 aPh; uniform float uTime; varying vec3 vP, vN; varying float vY;
        void main() {
          vec3 p = position; vY = p.y;
          p.y += (p.x * sin(uTime * 0.55 + aPh.x) + p.z * sin(uTime * 0.43 + aPh.x * 1.7)) * aPh.y + 0.08 * sin(uTime * 0.6 + aPh.x * 2.3);
          vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
          vP = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal + vec3(0.0, 1e-6, 0.0));
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        ${fx.GLSL_NOISE}
        ${LIGHT_GLSL}
        varying vec3 vP, vN; varying float vY;
        void main() {
          vec3 N = normalize(vN + vec3(0.0, 1e-6, 0.0)); float top = smoothstep(0.35, 0.75, N.y), n = vnoise(vP.xz * 0.5), n2 = vnoise(vP.xz * 2.1);
          vec3 snow = vec3(0.86, 0.9, 0.95) * (0.82 + 0.14 * n + 0.08 * n2);
          vec3 ice = mix(vec3(0.10, 0.32, 0.50), vec3(0.46, 0.72, 0.88), smoothstep(-0.5, 0.3, vY));
          vec3 col = mix(ice, snow, top) * (placeLight(vP, N, 1.0, sunSeen(vP)) + dawnRose(vP, N) * 0.7);
          gl_FragColor = vec4(placeFog(col, vP), 1.0);
        }`,
    });
    const floeMesh = new THREE.InstancedMesh(floeGeo, floeMat, Math.max(1, floes.length));
    {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), ph = new Float32Array(Math.max(1, floes.length) * 2);
      floes.forEach((f, i) => {
        m.compose(new THREE.Vector3(f.x, SEA_Y, f.z), q.setFromAxisAngle(up, f.yaw), new THREE.Vector3(f.sz * f.sq, 1, f.sz / f.sq));
        floeMesh.setMatrixAt(i, m); ph[i * 2] = f.ph; ph[i * 2 + 1] = f.amp;
      });
      floeGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 2));
      floeMesh.count = floes.length; floeMesh.instanceMatrix.needsUpdate = true; floeMesh.frustumCulled = false;
    }
    scene.add(floeMesh);
    await ctx.yield();

    // ------------------------------------------------------------ blossom trees: small and rooted, in clumps in the cleft's sheltered pockets and on the pillars' ledges
    const TR = R.trees, treePts = [], ledges = [];
    // each tree shape is a build step of its own (the page is handed back between them)
    const treeGeos = [];
    treeGeos.push(flora.cherryGeometry({ rng: TR, height: 6.4, detail: 1, leaf: '#f4b6cc', leafLight: '#ffe8f0' }));
    await ctx.yield();
    treeGeos.push(flora.cherryGeometry({ rng: TR, height: 5.6, detail: 1, leaf: '#fbdde8', leafLight: '#fff6f8', leafDark: '#c890a4' }));
    await ctx.yield();
    treeGeos.push(flora.cherryGeometry({ rng: TR, height: 7.0, detail: 1, leaf: '#ee9fbd', leafLight: '#ffdbe8' }));
    await ctx.yield();
    const treeFar = [flora.cherryGeometry({ rng: TR, height: 6.0, detail: 0, leaf: '#f6c2d4', leafLight: '#fff0f5' })];
    await ctx.yield();
    {
      const reach = Math.max(treeGeos[0].userData.radius, treeGeos[1].userData.radius, treeGeos[2].userData.radius, treeFar[0].userData.radius);
      // every candidate's dice are drawn first, so the stream is used alike whatever the land answers
      const cand = [], pc = [];
      // the cleft's trees stand in CLUMPS of two to five in sheltered pockets, with open rock between the clumps: in the inner
      // corner of six of the thirteen ledges (those with the lowest rank: on the tread just above the lip, at the wall the
      // ledge springs from) and at four places of the walls' feet (one in each quarter of the cleft, on a seeded side). Never
      // one tree to a ledge, never a row. The clumps take their dice from a stream of their own. A clump is a family: its size
      // is the clump's own deal (0.9 to 1.35 of the kit's tree), its first tree full grown and the others 0.6 to 0.95 of it.
      const CT = R.clumps;
      let nClump = 0;
      const clump = (s, side, q, great = false) => {
        const nTree = great ? 8 : 2 + Math.min(3, Math.floor(CT() * 4)), vigour = great ? 1.5 : CT.range(0.9, 1.35), cl = nClump++;
        for (let k = 0; k < (great ? 8 : 5); k++) {
          const rel = CT.range(0.6, 0.95);
          cand.push({ cl, s, side, q, gr: (great ? (k === 0 ? 0 * CT() : 4.9 + 1.1 * Math.sqrt(CT())) : 0.8 + 2.9 * Math.sqrt(CT())), ga: CT.range(0, 6.283), sc: vigour * (k === 0 ? 1 : rel), rot: CT.range(0, 6.283), v: CT.int(0, 2), on: k < nTree, great });
        }
        return cl;
      };
      const corner = cleftLedges.map((g, i) => ({ g, i })).sort((a, b) => a.g.rank - b.g.rank).slice(0, 6).sort((a, b) => a.i - b.i);
      for (const { g } of corner) clump(g.s + Math.tan(g.ang * D2R) * g.side * CLEFT_HW + g.cv * CLEFT_HW + 3.5, g.side, CT.range(14.5, 17.5));
      for (let k = 0; k < 4; k++) clump(838 + 27 * (k + CT.range(0.15, 0.85)), CT() < 0.5 ? -1 : 1, CT.range(14.5, 18.5));
      // THE CLEFT'S MOUTH, the goal seen from the lake: a clump of the LARGEST trees on each side of it, on the two flats of the
      // gully's flared mouth (16.5 to 18.5 m to the side of the line): the greatest tree at the clump's middle, one and a half
      // of the kit's tree (more than any other clump's deal), and seven smaller ones dealt round it, 4.9 to 6 m off (a
      // great crown's own room); up to five of the eight stand as the land and the trees' own spacing allow. Each side is
      // dealt two places, 3 to 9 m and 11 to 17 m beyond the cleft's foot: the
      // nearer keeps its clump where two trees and more stand there, else the farther does; so each side has one clump.
      // They are dealt after every other clump, so the others' dice fall as before, and they are STOOD FIRST, so a great
      // tree has its place before a smaller clump's tree takes it
      const greatPairs = [-1, 1].map((side) => [clump(CLEFT_S0 + CT.range(3, 9), side, CT.range(16.5, 18.5), true), clump(CLEFT_S0 + CT.range(11, 17), side, CT.range(16.5, 18.5), true)]);
      const greatN = {};
      cand.sort((a, b) => (b.great ? 1 : 0) - (a.great ? 1 : 0));
      for (let i = 0; i < 12; i++) for (let k = 0; k < 6; k++) pc.push({ i, b: TR(), a: TR.range(0, 6.283), sc: TR.range(0.55, 0.85), rot: TR.range(0, 6.283) });
      const want = Math.round(48 * density);
      let ti = 0;
      for (const c of cand) {
        if (treePts.length >= want) break;
        if (++ti % 20 === 0) await ctx.yield();
        if (!c.on || (c.great && (greatN[c.cl] || 0) >= 5)) continue;
        const L = line(c.s), rl = Math.hypot(L.t.x, L.t.z) || 1, rx = -L.t.z / rl, rz = L.t.x / rl, d = c.side * c.q;
        const x = L.p.x + rx * d + Math.cos(c.ga) * c.gr, z = L.p.z + rz * d + Math.sin(c.ga) * c.gr, w = land.way(x, z), wok = w.ok, wd = Math.abs(w.d);
        const sc = c.sc;
        // a tree keeps its whole crown at least 3.4 m to the side of the line, by place
        if (!wok || wd < reach * sc + 3.4) continue;
        const y0 = groundAt(x, z), y1 = Math.min(groundAt(x + rx * 1.6, z + rz * 1.6), groundAt(x - rx * 1.6, z - rz * 1.6));
        if (y0 - y1 > 3.4 || y0 > L.p.y + 24) continue;
        let free = true;
        for (const p of treePts) if (Math.hypot(p.x - x, p.z - z) < 2.6 + 1.6 * sc) { free = false; break; }
        if (!free) continue;
        treePts.push({ x, y: Math.min(y0, y1 + 1.2) - 0.25, z, s: sc, rot: c.rot, d: 0, u: c.s / path.length, v: c.v, cl: c.cl });
        if (c.great) greatN[c.cl] = (greatN[c.cl] || 0) + 1;
      }
      for (const pair of greatPairs) {
        const drop = (greatN[pair[0]] || 0) >= 2 ? pair[1] : pair[0];
        for (let i = treePts.length - 1; i >= 0; i--) if (treePts[i].cl === drop) treePts.splice(i, 1);
      }
      // never one tree alone: a clump that the land let keep a single tree gives that tree up
      {
        const per = {};
        for (const p of treePts) per[p.cl] = (per[p.cl] || 0) + 1;
        for (let i = treePts.length - 1; i >= 0; i--) if (per[treePts[i].cl] < 2) treePts.splice(i, 1);
      }
      await ctx.yield();
      // on the pillars: where a block steps in from the one below there is a ledge; a tree roots there when the ledge is wide enough
      const nearLine = [], perPillar = pillars.map(() => 0);
      for (let s = 880; s <= path.length; s += 4) nearLine.push(path.posAtDist(s));
      for (const c of pc) {
        // (twelve pillars' worth of dice are dealt whatever the count: those of a pillar that does not stand are passed over)
        if (c.i >= pillars.length) continue;
        const P = pillars[c.i], nb = P.bounds.length - 1;
        if (perPillar[c.i] >= 3 || nb < 2) continue;
        const b = Math.min(nb - 2, Math.floor(c.b * (nb - 1))), H = P.top - P.foot;
        const t0 = lerp(P.bounds[b], P.bounds[b + 1], 0.98), t1 = lerp(P.bounds[b + 1], P.bounds[b + 2], 0.02);
        const r0 = pillarR(P, t0, b, c.a) * 0.965, r1 = pillarR(P, t1, b + 1, c.a), y = P.foot + H * (t0 + t1) * 0.5;
        if (r0 - r1 < 1.5 || y < CLOUD_TOP + 8) continue;
        const rr = r1 + (r0 - r1) * 0.55, x = P.x + P.lean[0] * H * t0 + Math.cos(c.a) * rr, z = P.z + P.lean[1] * H * t0 + Math.sin(c.a) * rr;
        let dmin = 1e9;
        for (const q of nearLine) dmin = Math.min(dmin, Math.hypot(q.x - x, q.y - y - 3, q.z - z));
        if (dmin < reach * c.sc + 6) continue;
        perPillar[c.i]++;
        treePts.push({ x, y: y - 1.1, z, s: c.sc, rot: c.rot, d: 999, u: 0.8, v: 0 });
        ledges.push({ x, y: y + 3.2 * c.sc, z });
      }
      await ctx.yield();
      // each tree of the cleft has a dark foot on the ground: the shade of its own crown under the open sky, painted where it stands
      const feet = treePts.filter((p) => p.d === 0), fg = new THREE.PlaneGeometry(1, 1);
      const fm = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: /* glsl */`
          varying vec2 vUv; varying vec3 vP;
          void main() { vUv = uv; vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying vec3 vP;
          void main() {
            float r = length(vUv - 0.5) * 2.0, a = (1.0 - smoothstep(0.15, 1.0, r)) * 0.86;
            gl_FragColor = vec4(0.035, 0.03, 0.085, a);
          }`,
      });
      const footMesh = new THREE.InstancedMesh(fg, fm, Math.max(1, feet.length)), fm4 = new THREE.Matrix4(), fq = new THREE.Quaternion();
      const fn = new THREE.Vector3(), fup = new THREE.Vector3(0, 0, 1), fp = new THREE.Vector3(), fs = new THREE.Vector3(), footLine = [];
      for (let s = 815; s <= 965; s += 3) footLine.push(path.posAtDist(s));
      for (let i = 0; i < feet.length; i++) {
        const p = feet[i];
        if (i % 12 === 11) await ctx.yield();
        // a foot lies along the broad slope under its tree (the slope over the foot's own span, never steeper than 0.6, so none
        // stands up at a riser), and by place it keeps 3.2 m and more from the line: one that would come nearer is made smaller
        const gy = groundAt(p.x, p.z) + 0.14;
        let dl = 1e9;
        for (const q of footLine) dl = Math.min(dl, Math.hypot(q.x - p.x, q.y - gy, q.z - p.z));
        const r = Math.max(0.01, Math.min(reach * p.s * 1.45, dl - 3.2)), e = Math.max(1.5, 0.8 * r);
        let gx = (groundAt(p.x + e, p.z) - groundAt(p.x - e, p.z)) / (2 * e), gz = (groundAt(p.x, p.z + e) - groundAt(p.x, p.z - e)) / (2 * e);
        const gm = Math.hypot(gx, gz);
        if (gm > 0.6) { gx *= 0.6 / gm; gz *= 0.6 / gm; }
        fn.set(-gx, 1, -gz).normalize();
        footMesh.setMatrixAt(i, fm4.compose(fp.set(p.x, gy, p.z), fq.setFromUnitVectors(fup, fn), fs.set(2 * r, 2 * r, 1)));
      }
      footMesh.count = feet.length; footMesh.instanceMatrix.needsUpdate = true; footMesh.frustumCulled = false; footMesh.renderOrder = 1; scene.add(footMesh);
    }
    await ctx.yield();
    await flora.prepareLeafTexture({}, ctx.yield);
    const treeWind = flora.makeWind({ direction: [-0.73, -0.68], strength: 1.15 });
    const treeMat = flora.windMaterial({ wind: treeWind, backlight: 1.0, backlightTint: '#ffd6e4' });
    const grove = flora.makeScatter({ rng: TR, points: treePts, variants: treeGeos, farVariants: treeFar, farDistance: 60, material: treeMat, tint: 0.08, hue: 0.02, tilt: 0.1 });
    scene.add(grove.object);
    await ctx.yield();

    // ------------------------------------------------------------ far birds: white seabirds, far from the line, for the size of things
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    {
      // one flock over the low west flank beside the canyon (190 m left of the line at s 360, 48 m over the ground); one far out over
      // the cloud bank, 50 m over the cloud's top. Each flock has a stream of its own.
      // THE EAST FLOCK wheels over the cloud bank outside the turn, by one rule: its middle is dealt at any bearing from the turn's
      // centre, the flock's own reach (its radius and spread) and a dealt 100 to 200 m beyond the turn's circle. Eight places are
      // dealt; the first that stands inside the bank (inside both its edges and outside the crater's clear ball, each by the
      // flock's reach) is taken. Where none of the eight does, the east flock is left out: never a place that failed the rule
      const BE = R.birdsEast, eReach = 46 + 12, eCand = [];
      for (let i = 0; i < 8; i++) eCand.push({ b: BE.range(0, 360) * D2R, r: TURN_R + eReach + BE.range(100, 200) });
      for (const c of eCand) {
        c.x = TURN_C[0] + Math.sin(c.b) * c.r; c.z = TURN_C[1] - Math.cos(c.b) * c.r;
        c.ok = (c.x - BANK_S0[0]) * nSx + (c.z - BANK_S0[1]) * nSz < -eReach && (c.x - BANK_W0[0]) * nWx + (c.z - BANK_W0[1]) * nWz < -eReach && Math.hypot(c.x, c.z) > CRATER_CLEAR + eReach;
      }
      const eAt = eCand.find((c) => c.ok);
      const pb = path.posAtDist(360), tb = path.tangentAtDist(360), tl = Math.hypot(tb.x, tb.z) || 1, bx = pb.x + tb.z / tl * 190, bz = pb.z - tb.x / tl * 190;
      fauna.add(F.makeFlock({ rng: R.birds, species: 'gulls', count: 16, size: 2.2, center: [bx, groundAt(bx, bz) + 48, bz], radius: 50, spread: [12, 5, 12], wander: [3, 1.5, 3, 0.35], maxSigma: 3 }));
      if (eAt) fauna.add(F.makeFlock({ rng: BE, species: 'gulls', count: 9, size: 2.2, center: [eAt.x, CLOUD_TOP + 50, eAt.z], radius: 46, spread: [12, 5, 12], wander: [3, 1.5, 3, 0.35], maxSigma: 3 }));
    }
    await ctx.yield();

    // ------------------------------------------------------------ THE SKY MONASTERY on the summit's pillars (SKY_MONASTERY)
    // An old, empty monastery of the high air, of the kind monks built on rock pillars and cliffs: a white temple city of slender
    // towers under stacked blue roofs, standing on and against the pillars above the sea of cloud. No figure, no banner, no emblem
    // or mark, nothing lettered, no lamp, nothing that flies. EVERY PLACE IS THE PILLARS' OWN (no typed position):
    //  - the pillars: the crown's tallest; the two at the cleft's head and those outside the turn (the ones the line passes
    //    between and looks at all along the turn); then others of the crown (dealt which), up to eight or nine in all (dealt);
    //  - on the crown's tallest the MAIN TOWER stands on the peak: twelve-sided, 34 to 46 m tall, four or five tiers of roof; six
    //    to nine lesser towers (dealt) stand round it and below it, on the top's rim and down the shoulders;
    //  - on every other chosen pillar a tower stands on the peak (the tallest of its pillar) and two to four lesser ones (dealt)
    //    on its rim and shoulders; thirty-two towers at the most, so every pillar is sure of its three before any takes more;
    //  - a shoulder is a ledge of the pillar's own form (where a block steps in from the one below); a tower stands against the
    //    block above, at the broadest of eight bearings that keeps the rules: 20 m of clear air from the line for its whole body,
    //    its eaves clear of its neighbours', off every tree that roots on the pillar;
    //  - EVERY FOOT IS LET INTO THE ROCK: a tower's lowest ring hangs 3 to 8 m under its floor and each corner of it is led in to
    //    the pillar's own face (the mesh's own thirteen corners to a ring), so a tower that stands out over a ledge's edge is
    //    carried by a corbelled foot and nothing floats;
    //  - a terrace with a low wall runs round the ledge under every shoulder tower; a stair winds up each chosen pillar from above
    //    the cloud to under its top; slim arched bridges join two pillars where their faces stand 3 to 30 m apart at a ledge's
    //    height (the narrowest gaps first, two to a pillar and five in all at the most), never over the line.
    // Typed sizes are the design's (the lead's notes of 04:40Z and 04:49Z): towers 3.5 to 6 m across; a roof tier is a flared cone
    // with an upturned eave standing 1.6 to 2.4 m out (well out, so the blue reads from the sea), each tier 0.85 of the one below; a
    // thin gold spire ends the top tier.
    if (SKY_MONASTERY) {
      const M = R.monastery, mPos = [], mCol = [], mShd = [], TAU = Math.PI * 2;
      // every die first, in set counts whatever stands
      const md = { nPil: M() < 0.5 ? 8 : 9, mainN: 6 + Math.floor(M() * 4), mainTiers: M() < 0.5 ? 4 : 5, nBr: 3 + Math.floor(M() * 3), pick: [], pil: [], tw: [] };
      for (let i = 0; i < 6; i++) md.pick.push(M());
      for (let i = 0; i < 12; i++) md.pil.push({ n: 2 + Math.floor(M() * 3), a: M(), stairA: M(), stairDir: M() < 0.5 ? -1 : 1 });
      for (let i = 0; i < 48; i++) md.tw.push({ d: M(), h: M(), e: M(), tiers: M(), turn: M(), hsh: M(), drop: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(() => M()) });
      const mLine = [];
      for (let s = 800; s <= path.length; s += 2) mLine.push(path.posAtDist(s));
      const air = (x, y, z) => { let d = 1e9; for (const q of mLine) d = Math.min(d, Math.hypot(q.x - x, q.y - y, q.z - z)); return d; };
      const airPlan = (x, z) => { let d = 1e9; for (const q of mLine) d = Math.min(d, Math.hypot(q.x - x, q.z - z)); return d; };
      // one flat triangle; a corner is [x, y, z, u, v, shade]
      const tri = (a, b, c, k, h) => { for (const q of [a, b, c]) { mPos.push(q[0], q[1], q[2]); mCol.push(k, q[3], q[4]); mShd.push(h, q[5]); } };
      const quad = (a, b, c, d, k, h) => { tri(a, b, c, k, h); tri(a, c, d, k, h); };
      // the pillar's axis at a height, and its face there as the pillar's own mesh has it: thirteen corners to a ring (turned by
      // 0.37 of a step for every block), straight between them, four rings to a block
      const axisAt = (P, y) => [P.x + P.lean[0] * (y - P.foot), P.z + P.lean[1] * (y - P.foot)];
      const meshR = (P, t, b, a) => {
        const st = TAU / 13, f = a / st - 0.37 * b, j = Math.floor(f), w = f - j, a0 = (j + 0.37 * b) * st, r0 = pillarR(P, t, b, a0), r1 = pillarR(P, t, b, a0 + st);
        return r0 * r1 * Math.sin(st) / (r0 * Math.sin(w * st) + r1 * Math.sin((1 - w) * st));
      };
      const RINGS = [0.02, 0.3, 0.62, 0.98];
      const rockAt = (P, y, a) => {
        const t = clamp((y - P.foot) / (P.top - P.foot), 0.001, 0.995);
        let b = 0, i = 0;
        while (b < P.bounds.length - 2 && t >= P.bounds[b + 1]) b++;
        const f = (t - P.bounds[b]) / (P.bounds[b + 1] - P.bounds[b]);
        while (i < 2 && f > RINGS[i + 1]) i++;
        const w = clamp((f - RINGS[i]) / (RINGS[i + 1] - RINGS[i]), 0, 1);
        return lerp(meshR(P, lerp(P.bounds[b], P.bounds[b + 1], RINGS[i]), b, a), meshR(P, lerp(P.bounds[b], P.bounds[b + 1], RINGS[i + 1]), b, a), w);
      };
      // a corner is let into the rock: led toward the pillar's axis until it lies inside the face by a tenth of the radius and 0.3 m
      const sink = (P, q) => {
        const c = axisAt(P, q[1]), dx = q[0] - c[0], dz = q[2] - c[1], r = Math.hypot(dx, dz) || 1e-6, R0 = 0.9 * rockAt(P, q[1], Math.atan2(dz, dx)) - 0.3;
        if (r > R0) { q[0] = c[0] + dx * R0 / r; q[2] = c[1] + dz * R0 / r; }
        return q;
      };
      const ringOf = (cx, cz, y, rad, v, ao, tw, n) => { const o = []; for (let k = 0; k < n; k++) { const a = tw + k / n * TAU; o.push([cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad, v, ao]); } return o; };
      // a band between two rings: stone takes one window's cell to a face, tile takes the face's own breadth as -1 to 1
      const band = (A, B, kind, h) => {
        const n = A.length;
        for (let k = 0; k < n; k++) {
          const k1 = (k + 1) % n, u0 = kind === 1 ? -1 : k, u1 = kind === 1 ? 1 : k + 1;
          quad([A[k][0], A[k][1], A[k][2], u0, A[k][3], A[k][4]], [A[k1][0], A[k1][1], A[k1][2], u1, A[k1][3], A[k1][4]], [B[k1][0], B[k1][1], B[k1][2], u1, B[k1][3], B[k1][4]], [B[k][0], B[k][1], B[k][2], u0, B[k][3], B[k][4]], kind, h);
        }
      };
      const fan = (A, tip, kind, h) => {
        const n = A.length;
        for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; tri([A[k][0], A[k][1], A[k][2], -1, A[k][3], A[k][4]], [A[k1][0], A[k1][1], A[k1][2], 1, A[k1][3], A[k1][4]], [tip[0], tip[1], tip[2], 0, tip[3], tip[4]], kind, h); }
      };
      // a tower's measures from its breadth, eave and tiers: the eaves' radii, the roof's whole height
      const roofOf = (D, eave, tiers) => { const Rg = D / 2 * 0.96 + 0.4, Rs = []; let hR = 0; for (let i = 0; i < tiers; i++) { Rs.push((Rg + eave) * Math.pow(0.85, i)); hR += (i < tiers - 1 ? 1.1 : 1.7) * Rs[i]; } return { Rg, Rs, hR }; };
      const tower = (P, ax, az, yB, D, tall, eave, tiers, turn, hsh, drop, n) => {
        const r = D / 2, { Rg, Rs, hR } = roofOf(D, eave, tiers), hS = Math.max(tall - hR, 4.5), hb = hS - 1.4, rows = Math.max(1, Math.round(hb / 3.4)), vk = 3.4 * rows / hb;
        const foot = ringOf(ax, az, yB, r * 1.3, -1, 0.55, turn, n);
        for (let k = 0; k < n; k++) { foot[k][1] = yB - (3 + 5 * drop[k]); sink(P, foot[k]); }
        const base = ringOf(ax, az, yB, r * 1.08, 0, 0.8, turn, n), mid = ringOf(ax, az, yB + 0.4 * hb, r, 0.4 * hb * vk, 1, turn, n), neck = ringOf(ax, az, yB + hb, r * 0.96, 3.4 * rows, 0.85, turn, n);
        const g0 = ringOf(ax, az, yB + hb + 0.5, Rg, 0.5, 0.8, turn, n), g1 = ringOf(ax, az, yB + hS, Rg, 1.4, 0.6, turn, n);
        band(foot, base, 0, hsh + 2); band(base, mid, 0, hsh); band(mid, neck, 0, hsh); band(neck, g0, 0, hsh + 2); band(g0, g1, 0, hsh + 2);
        let y = yB + hS - 0.2;
        for (let i = 0; i < tiers; i++) {
          const R0 = Rs[i], fin = i === tiers - 1, h = (fin ? 1.0 : 0.75) * R0, topR = (fin ? 0.2 : 0.36) * R0;
          const v1 = 0.2 * R0, v2 = v1 + Math.hypot(0.3 * R0, 0.36 * h), v3 = v2 + Math.hypot(0.54 * R0 - topR, 0.64 * h);
          const lip = ringOf(ax, az, y + 0.12 * R0, R0, 0, 1, turn, n), low = ringOf(ax, az, y, 0.84 * R0, v1, 0.9, turn, n);
          const midR = ringOf(ax, az, y + 0.36 * h, 0.54 * R0, v2, 1, turn, n), top = ringOf(ax, az, y + h, topR, v3, 1, turn, n);
          band(lip, low, 1, hsh); band(low, midR, 1, hsh); band(midR, top, 1, hsh);
          if (fin) {
            const tipY = y + 1.7 * R0;
            fan(top, [ax, tipY, az, v3 + Math.hypot(topR, 0.7 * R0), 1], 1, hsh);
            // the thin gold spire
            fan(ringOf(ax, az, tipY - 0.5, 0.14 + 0.02 * D, 0, 1, turn, 4), [ax, tipY + 0.5 * D + 1.0, az, 0, 1], 2, hsh);
          } else {
            // the white drum that carries the next tier
            band(ringOf(ax, az, y + 0.7 * h, 0.36 * R0, 0.2, 0.7, turn, n), ringOf(ax, az, y + 1.1 * R0 + 0.3, 0.36 * R0, 1.3, 0.6, turn, n), 0, hsh + 2);
            y += 1.1 * R0;
          }
        }
      };
      // the chosen pillars
      const ci = pillars.indexOf(crownTall), chosen = [ci, 0, 1], pool = [];
      for (let i = 2 + nCrown; i < pillars.length; i++) chosen.push(i);
      for (let i = 2; i < 2 + nCrown; i++) if (i !== ci) pool.push(i);
      for (let n = 0; chosen.length < md.nPil && pool.length; n++) chosen.push(pool.splice(Math.floor(md.pick[n] * pool.length), 1)[0]);
      const mainWant = Math.min(md.mainN, 31 - 3 * (chosen.length - 1));
      let spare = 31 - mainWant - 3 * (chosen.length - 1);
      // the ledges of a pillar that stand clear above the cloud, from the highest down
      const ledgesOf = (P) => {
        const H = P.top - P.foot, o = [];
        for (let b = P.bounds.length - 3; b >= 0; b--) {
          const t0 = lerp(P.bounds[b], P.bounds[b + 1], 0.98), t1 = lerp(P.bounds[b + 1], P.bounds[b + 2], 0.02), y = P.foot + H * (t0 + t1) * 0.5;
          if (y >= CLOUD_TOP + 8) o.push({ b, y, yLo: P.foot + H * t0, yHi: P.foot + H * t1 });
        }
        return o;
      };
      const towers = [], terraces = [], pTrees = treePts.filter((p) => p.d === 999);
      let twN = 0;
      // does a tower of these measures stand here by the rules?
      const stands = (pi, x, z, yB, D, tall, eave, tiers) => {
        const Re = roofOf(D, eave, tiers).Rs[0];
        for (const f of [0, 0.35, 0.7, 1]) if (air(x, yB + f * tall, z) - Re - 0.5 < 20) return false;
        for (const q of towers) if (q.pi === pi && Math.abs(q.yB - yB) < 16 && Math.hypot(q.x - x, q.z - z) < q.Re + Re + 0.3) return false;
        for (const p of pTrees) if (Math.hypot(p.x - x, p.z - z) < D / 2 + 2.6 && p.y > yB - 5 && p.y < yB + tall) return false;
        return true;
      };
      for (let c = 0; c < chosen.length; c++) {
        const pi = chosen[c], P = pillars[pi], H = P.top - P.foot, main = c === 0, pd = md.pil[c], more = main ? 0 : Math.min(pd.n - 2, spare), want = main ? mainWant : 2 + more;
        spare -= more;
        // the peak's tower
        {
          const d = md.tw[twN++], D = main ? lerp(5.2, 6, d.d) : lerp(4, 5, d.d), tall = main ? lerp(34, 46, d.h) : lerp(19, 26, d.h), eave = lerp(1.6, 2.4, d.e), tiers = main ? md.mainTiers : 3;
          const x = P.x + P.lean[0] * H + P.peak[0] * P.rTop, z = P.z + P.lean[1] * H + P.peak[2] * P.rTop, yB = P.top - 1;
          tower(P, x, z, yB, D, tall, eave, tiers, d.turn * TAU, d.hsh, d.drop, main ? 12 : 8);
          towers.push({ pi, x, z, yB, Re: roofOf(D, eave, tiers).Rs[0], tall });
        }
        // the lesser towers: the top's rim first, then the shoulders from the highest down; at each, the broadest bearing first
        const places = [], yRim = P.foot + 0.965 * H;
        for (let k = 0; k < 8; k++) { const a = (pd.a + k / 8) * TAU; places.push({ a, y: yRim - 0.5, rim: true, w: rockAt(P, yRim, a) }); }
        places.sort((p, q) => q.w - p.w);
        for (const L of ledgesOf(P)) {
          const row = [];
          for (let k = 0; k < 8; k++) { const a = (pd.a + (k + 0.5) / 8) * TAU, rUp = rockAt(P, L.yHi + 0.5, a); row.push({ a, y: L.y, b: L.b, rUp, w: rockAt(P, L.yLo - 0.5, a) - rUp }); }
          row.sort((p, q) => q.w - p.w);
          for (const p of row) places.push(p);
        }
        let got = 0;
        for (const p of places) {
          if (got >= want || towers.length >= 32 || twN >= md.tw.length) break;
          const d = md.tw[twN], D = lerp(3.5, 4.8, d.d), tiers = d.tiers < 0.5 ? 2 : 3, eave = lerp(1.6, 2.4, d.e);
          const tall = Math.max(p.rim ? lerp(16, 26, d.h) : lerp(12, 20, d.h), roofOf(D, eave, tiers).hR + 4.5);
          const rho = p.rim ? Math.max(0.5, 0.85 * p.w - 0.5 * D) : p.rUp + 0.15 * D, c0 = axisAt(P, p.y), x = c0[0] + Math.cos(p.a) * rho, z = c0[1] + Math.sin(p.a) * rho;
          if (!stands(pi, x, z, p.y, D, tall, eave, tiers)) continue;
          twN++; got++;
          tower(P, x, z, p.y, D, tall, eave, tiers, d.turn * TAU, d.hsh, d.drop, 8);
          towers.push({ pi, x, z, yB: p.y, Re: roofOf(D, eave, tiers).Rs[0], tall });
          if (!p.rim) terraces.push({ P, b: p.b, a: p.a, y: p.y, hsh: d.hsh });
        }
      }
      // a terrace with a low wall round the ledge under a shoulder tower: 50 degrees of the pillar's round either way
      for (const T of terraces) {
        const P = T.P, H = P.top - P.foot, t0 = lerp(P.bounds[T.b], P.bounds[T.b + 1], 0.98), t1 = lerp(P.bounds[T.b + 1], P.bounds[T.b + 2], 0.02), y = T.y + 0.3, n = 9;
        let prev = null;
        for (let i = 0; i <= n; i++) {
          const a = T.a + lerp(-0.87, 0.87, i / n), c0 = axisAt(P, y), ca = Math.cos(a), sa = Math.sin(a), rUp = rockAt(P, P.foot + H * t1 + 0.5, a);
          const rOut = Math.max(rockAt(P, P.foot + H * t0 - 0.5, a) + 0.5, rUp + 2.4), ox = c0[0] + ca * rOut, oz = c0[1] + sa * rOut;
          const cur = { i: [c0[0] + ca * 0.8 * rUp, y, c0[1] + sa * 0.8 * rUp], o: [ox, y, oz], lo: sink(P, [ox, y - 5, oz]), ok: air(ox, y, oz) >= 20.6 };
          if (prev && prev.ok && cur.ok) {
            // the floor, the low wall at its outer edge (1 m), the wall under it down into the rock
            quad([...prev.i, 0, -3, 0.85], [...cur.i, 0, -3, 0.85], [...cur.o, 0, -3, 1], [...prev.o, 0, -3, 1], 0, T.hsh + 2);
            quad([...prev.o, i - 1, 0, 0.9], [...cur.o, i, 0, 0.9], [cur.o[0], y + 1, cur.o[2], i, 1, 1], [prev.o[0], y + 1, prev.o[2], i - 1, 1, 1], 0, T.hsh + 2);
            quad([...prev.lo, i - 1, -5, 0.55], [...cur.lo, i, -5, 0.55], [...cur.o, i, 0, 0.9], [...prev.o, i - 1, 0, 0.9], 0, T.hsh + 2);
          }
          prev = cur;
        }
      }
      // a stair winds up each chosen pillar: a tread 1.2 m out of the face, rising 0.6 m to the metre, from 4 m above the cloud
      // to under the top; a stretch that would come within 20 m of the line is left out
      let stairN = 0;
      for (let c = 0; c < chosen.length; c++) {
        const P = pillars[chosen[c]], H = P.top - P.foot, pd = md.pil[c], y0 = Math.max(CLOUD_TOP + 4, P.foot + 0.12 * H), y1 = P.foot + 0.94 * H;
        let a = pd.stairA * TAU, prev = null, along = 0;
        for (let y = y0; y <= y1; y += 1.2) {
          const R0 = rockAt(P, y, a), c0 = axisAt(P, y), ca = Math.cos(a), sa = Math.sin(a), ox = c0[0] + ca * (R0 + 1.2), oz = c0[1] + sa * (R0 + 1.2);
          const cur = { i: [c0[0] + ca * 0.8 * R0, y, c0[1] + sa * 0.8 * R0], o: [ox, y, oz], lo: sink(P, [ox, y - 2.6, oz]), ok: air(ox, y, oz) >= 20.6, s: along };
          if (prev && prev.ok && cur.ok) {
            // the tread (its steps are the stone's own courses, drawn across it) and the wall that carries it
            quad([...prev.i, 0, prev.s, 0.8], [...cur.i, 0, cur.s, 0.8], [...cur.o, 1, cur.s, 1], [...prev.o, 1, prev.s, 1], 0, 2.37);
            quad([...prev.lo, 0, -2.6, 0.55], [...cur.lo, 1, -2.6, 0.55], [...cur.o, 1, 0, 0.9], [...prev.o, 0, 0, 0.9], 0, 2.37);
            stairN++;
          }
          prev = cur; a += pd.stairDir * 1.2 / (0.6 * Math.max(R0, 2)); along += 2.3;
        }
      }
      // bridges: every chosen pillar to every other pillar, at each ledge's height where both faces stand 3 to 30 m apart; the
      // narrowest first
      const spans = [], perP = pillars.map(() => 0), pairs = {};
      for (const pi of chosen) for (let qi = 0; qi < pillars.length; qi++) {
        if (qi === pi) continue;
        const A = pillars[pi], B = pillars[qi];
        for (const L of ledgesOf(A)) {
          const y = L.y;
          if (y > B.top - 10 || y < B.foot + 6) continue;
          const ca = axisAt(A, y), cb = axisAt(B, y), d = Math.hypot(cb[0] - ca[0], cb[1] - ca[1]), ux = (cb[0] - ca[0]) / d, uz = (cb[1] - ca[1]) / d, aAB = Math.atan2(uz, ux);
          const ra = rockAt(A, y, aAB), rb = rockAt(B, y, aAB + Math.PI), gap = d - ra - rb;
          if (gap < 3 || gap > 30) continue;
          let ok = true;
          for (let k = 0; k <= 6 && ok; k++) { const f = ra + gap * k / 6; if (airPlan(ca[0] + ux * f, ca[1] + uz * f) < 21.5 || air(ca[0] + ux * f, y, ca[1] + uz * f) < 21.5) ok = false; }
          if (ok) spans.push({ pi, qi, y, gap, ca, ux, uz, ra: 0.8 * ra, len: d - 0.8 * ra - 0.8 * rb });
        }
      }
      spans.sort((p, q) => p.gap - q.gap);
      let brN = 0;
      for (const S of spans) {
        const key = Math.min(S.pi, S.qi) + ':' + Math.max(S.pi, S.qi);
        if (brN >= md.nBr || pairs[key] || perP[S.pi] >= 2 || perP[S.qi] >= 2) continue;
        pairs[key] = true; perP[S.pi]++; perP[S.qi]++; brN++;
        // an arched span 2 m wide: a deck with a slight camber, an arch under it deep at the two ends and 0.7 m at the middle,
        // a low wall (0.9 m) either side
        const N = 12, nx = -S.uz, nz = S.ux, hb = 2.41 + 0.1 * brN;
        let prev = null;
        for (let i = 0; i <= N; i++) {
          const f = i / N, px = S.ca[0] + S.ux * (S.ra + S.len * f), pz = S.ca[1] + S.uz * (S.ra + S.len * f), top = S.y + 0.4 + 0.05 * S.len * 4 * f * (1 - f), bot = top - 0.7 - (0.2 * S.len + 1.2) * (2 * f - 1) * (2 * f - 1);
          const cur = { l: [px + nx, pz + nz], r: [px - nx, pz - nz], top, bot, s: S.len * f / 2.2 };
          if (prev) {
            quad([prev.l[0], prev.top, prev.l[1], 0, -3, 1], [cur.l[0], cur.top, cur.l[1], 0, -3, 1], [cur.r[0], cur.top, cur.r[1], 1, -3, 1], [prev.r[0], prev.top, prev.r[1], 1, -3, 1], 0, hb);
            quad([prev.l[0], prev.bot, prev.l[1], 0, -3, 0.5], [cur.l[0], cur.bot, cur.l[1], 0, -3, 0.5], [cur.r[0], cur.bot, cur.r[1], 1, -3, 0.5], [prev.r[0], prev.bot, prev.r[1], 1, -3, 0.5], 0, hb);
            for (const e of ['l', 'r']) quad([prev[e][0], prev.bot, prev[e][1], prev.s, prev.bot - prev.top, 0.7], [cur[e][0], cur.bot, cur[e][1], cur.s, cur.bot - cur.top, 0.7], [cur[e][0], cur.top + 0.9, cur[e][1], cur.s, 0.9, 1], [prev[e][0], prev.top + 0.9, prev[e][1], prev.s, 0.9, 1], 0, hb);
          }
          prev = cur;
        }
      }
      const mg = new THREE.BufferGeometry();
      mg.setAttribute('position', new THREE.Float32BufferAttribute(mPos, 3)); mg.setAttribute('color', new THREE.Float32BufferAttribute(mCol, 3)); mg.setAttribute('aShade', new THREE.Float32BufferAttribute(mShd, 2));
      mg.computeVertexNormals();
      const mm = rockMaterial(LU, MONASTERY_FRAG); mm.side = THREE.DoubleSide;
      const monastery = new THREE.Mesh(mg, mm); monastery.name = 'sky-monastery';
      // the counts, for the world's own checks
      monastery.userData.counts = { towers: towers.length, pillars: chosen.length, terraces: terraces.length, stairTreads: stairN, bridges: brN, triangles: mPos.length / 9 };
      scene.add(monastery);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the led matter of the four stretches (the part)
    const pillarList = pillars.map((P) => ({ x: P.x, z: P.z, top: P.top, radius: P.radius, foot: P.foot + 4, rFoot: P.rFoot, rTop: P.rTop }));
    const heroOpts = {
      line, length: path.length, floorAt: groundAt, groundAt, seaY: SEA_Y, lakeY: LAKE_Y, pillars: pillarList, time: tU,
      sunDir: SUN_DIR.clone(), sunColor: lin('#ffcf9a'), shadeColor: lin('#3a3f7a'), skyGlow: lin('#ff9f78'), sunBand: { y0: BAND_Y0, y1: BAND_Y1 },
      fog: { color: LU.uFogCol.value.clone(), density: LU.uFogDen.value }, detail,
      sunTopAt, sunTop: { texture: terrain.shadeMap, box: terrain.shadeBox.clone() },
      lake: { x: 0, z: 0, r: LAKE_R }, ledges, light: LU,
    };
    let hero = null, heroDown = false;
    try { hero = await part.buildHero(ctx, heroOpts); if (hero && hero.object) scene.add(hero.object); }
    catch (err) { console.error('mountain part, buildHero: ' + (err && err.message)); hero = null; }
    await ctx.yield();

    // places the looks hang on: the shore arch (the part's fifth arch of the sea, at the canyon's mouth), the crown's tallest pillar,
    // the notch, the plume's foot, the turn's final knot (where the final straight begins) and the canyon's lowest gap
    const SHORE_S = 232, SL = path.length, crownP = crownTall;
    // a knot's own distance along the line, from the curve's own table of lengths (the knots stand at even shares of its parameter)
    const knotS = (k) => { const Ls = path.curve.getLengths(), f = k / (path.points.length - 1) * (Ls.length - 1), i = Math.min(Ls.length - 2, Math.floor(f)); return lerp(Ls[i], Ls[i + 1], f - i); };
    // where the turn ends and the final straight begins: the turn's final knot
    const turnEndS = knotS(WAY_TO_TURN.length + TURN_KNOTS);
    // the end look's subject: the canyon's lowest gap, far below (the way the lens came up)
    const lowGap = path.posAtDist(GAPS[0]);
    // the canyon's look ends at the notch: where the line crosses the rim's own circle into the crater (found on the line, metre by metre)
    let notchS = 560;
    for (const rq = { r: 0, c: 0, hi: 0, es: 0 }; notchS < 760; notchS++) { const q = path.posAtDist(notchS), rr = Math.hypot(q.x, q.z); land.rimOf(q.x / rr, q.z / rr, rq); if (rr < rq.r) break; }
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: 50,
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 26, sway: 0.4, bank: 0.15 },
      // LOOKS, each by two places
      pois: [
        // over the sea the gaze lifts a little toward the crown of pillars (the middle of the crown's tallest pillar, inside the turn):
        // from 60 m after the entry to the shore arch
        { at: [crownP.x, 0.5 * (crownP.foot + crownP.top), crownP.z], from: 60 / SL, to: SHORE_S / SL, weight: 0.3 },
        // ALONG THE CANYON the gaze lifts toward the fire's sign: the plume over the lake, at the plume's own top above its foot
        // (the line itself climbs at 25 degrees here, so a subject lower on the plume would tip the gaze down), so the walls, the
        // sky and the summit fill the view and the floor less of it. From the shore arch to the notch, as one whole bell (it
        // comes in and goes out over half the stretch each, so it is nearly gone where the line tips over into the crater): it
        // ends before its subject passes abeam (the plume stands to the left of the line's way across the lake)
        { at: [PLUME_AT[0], LAKE_Y + PLUME_H, PLUME_AT[1]], from: SHORE_S / SL, to: notchS / SL, weight: 1, fade: 0.5 },
        // on the final straight the gaze tips down and a little to the right, toward the canyon's lowest gap: from the turn's
        // final knot to the line's end (the engine's own guard lets it go before the way out)
        { at: [lowGap.x, lowGap.y, lowGap.z], from: turnEndS / SL, to: 1, weight: 0.55 },
      ],
      // the way out is first drawn where the turn ends and the line runs straight to it: the straight's own length, from the
      // knots (seen from farther round the turn it would be a small pale disc low over the sea, and the owner's terms bar anything
      // that reads so). While the next world is not there its opening shows one flat colour, the sky's own behind it: the line
      // sinks about two degrees along the straight, so the sky's horizon band stands behind the way out: SKY.horizon
      portal: { shape: 'circle', radius: 7, color: '#fff0cc', glow: 0.6, revealDistance: 300, drawWithin: SL - turnEndS, veil: SKY.horizon },
      post: {
        exposure: 1.08, bloom: { strength: 0.5, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#0a0c24', vignette: 0.3, grain: 0.03, aberration: 0 },
      },
      update(dt, time, camera, u) {
        tU.value = time;
        grove.update(dt, time, camera); fauna.update(dt, time, camera, u);
        sky.update(dt, time, camera); ocean.update(dt, time, camera); plume.update(dt, time, camera); cloudHeads.update(dt, time, camera); cloudSea.update(dt, time, camera);
        if (hero && !heroDown) {
          try { hero.update(dt, time, camera); } catch (err) { heroDown = true; console.error('mountain part, update: ' + (err && err.message)); }
        }
      },
      dispose() {
        if (hero && hero.dispose) hero.dispose();
        if (sky.dispose) sky.dispose();
        if (terrain.strata && terrain.strata.texture) terrain.strata.texture.dispose();
        blank.dispose();
      },
    };
  },
};
