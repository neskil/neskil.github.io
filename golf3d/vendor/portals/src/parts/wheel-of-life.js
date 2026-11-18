// THE ASCENSION: hero set piece of "The Wheel of Life" (header: see the HAND-OFF block at the foot of this comment).
// A turned plaster mast, 4 m thick and 110 m tall, wound with a helix of 240 cast cranes (5.2 m span) on brass pegs
// (9.5 m, slanting up out of the mast to a cup under each belly; the casts ride at radius 11 so that a camera orbiting
// at radius 18.5 passes 7.5 m from the nearest and 4.8 m off the wingtips, and so that 24 casts a turn do not touch): 10 turns of 24, each cast 0.46 m higher and one twenty-fourth of a wingbeat further on. The first eight
// stand and run on plinths on the top terrace, the next sixteen lift, the last 48 flare outward and shrink to
// 1.2 m (forced perspective). Up the mast winds a service stair of the same pitch, so mast, stair, pegs and birds
// are ONE screw: turning it slowly it is a barber's pole of statues; stepped one cast (15 degrees) a tick, every
// bearing shows the next cast one step higher and 240 birds climb at 5.5 m/s.
//
// LOCAL SPACE  origin at the foot of the mast ON THE TOP TERRACE DECK (world y 62 in the brief), +Y up, front +Z.
// SIZE         radius 34 (the T5 deck; the garland itself is 11.6 m, the flare 18.5 m), height 112.
// STYLE        painted plaster, unlit. See STYLE NOTES above the shaders: three flat tones by world normal.y, four flat
//              tones on upright faces by the painted sun's bearing (uniforms.uSunH, a unit Vector2 of world x and z),
//              faceted, brush mottle, seam, 35 % paint haze by 900 m, colours lifted for ACES (uLift).
// OPTS         palette  [cream, blue, coral, ochre, sage, slate] hex strings (the brief's by default)
//              detail   0.6..1: thins rivets, balusters and rake detail only (never the 240 casts)
//              deck     false leaves out the T5 deck drum (radius 34, riser 12 m down) if the world lathes its own
//              dir      +1 (default) birds climb anticlockwise seen from above, -1 clockwise
//              tick     ticks per second in lock (default 12; the brief's variation is 8)
//              lift     colour lift for the tone map (default 1.15; use 1 with post.flat)
// PER SEED     the cranes' markings (cream-necked, coral-headed or slate-throated), the finial (brass onion, turned spindle
//              or open cup), the brass bands' height and collar style, where the stair starts, which cast of each turn is
//              the repair with the bare white wingtip.
// See the foot of buildHero for ANCHORS, HOOKS (setProgress), COST and LIGHTING.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const N_CAST = 240, PER_TURN = 24, RISE = 0.46, R_HELIX = 11, MAST_R = 2, MAST_H = 110, GROUND_N = 8, PLINTH_H = 0.3;
const PITCH = TAU / PER_TURN;                       // 15 degrees: one cast, and two stair treads

// ---------------------------------------------------------------- triangle soup with flat normals
function makeSoup() {
  const P = [], C = [], R = [], U = [];
  const s = {
    P, C, R, U, count: 0,
    // a, b, c: [x,y,z]; col: THREE.Color; ra..rc: [part, t, side, tag]; hint: [x,y,z] the face should look toward
    tri(a, b, c, col, ra, rb, rc, hint, ua, ub, uc) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { const t = b; b = c; c = t; const tr = rb; rb = rc; rc = tr; const tu = ub; ub = uc; uc = tu; }
      P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      for (let k = 0; k < 3; k++) C.push(col.r, col.g, col.b);
      R.push(...ra, ...(rb || ra), ...(rc || ra));
      const z = [0, 0]; U.push(...(ua || z), ...(ub || ua || z), ...(uc || ua || z));
      s.count++;
    },
    quad(a, b, c, d, col, ra, rb, rc, rd, hint) { s.tri(a, b, c, col, ra, rb, rc, hint); s.tri(a, c, d, col, ra, rc, rd, hint); },
    // both faces of a thin blade (so it has a top tone and an underside tone)
    blade(a, b, c, col, ra, rb, rc) { s.tri(a, b, c, col, ra, rb, rc, [0, 1, 0]); s.tri(a, b, c, col, ra, rb, rc, [0, -1, 0]); },
    // closed faceted tube through rings: each ring = { c:[x,y,z], pts:[[x,y,z]...] }, cols per segment
    tube(rings, colFn, rigFn, capA, capB) {
      const n = rings[0].pts.length;
      for (let i = 0; i < rings.length - 1; i++) {
        const A = rings[i], B = rings[i + 1], mid = [(A.c[0] + B.c[0]) / 2, (A.c[1] + B.c[1]) / 2, (A.c[2] + B.c[2]) / 2];
        for (let j = 0; j < n; j++) {
          const j1 = (j + 1) % n, a = A.pts[j], b = A.pts[j1], c = B.pts[j1], d = B.pts[j];
          const hint = [(a[0] + b[0] + c[0] + d[0]) / 4 - mid[0], (a[1] + b[1] + c[1] + d[1]) / 4 - mid[1], (a[2] + b[2] + c[2] + d[2]) / 4 - mid[2]];
          const col = colFn(i, j, hint), ra = rigFn(i), rb = rigFn(i + 1);
          s.tri(a, b, c, col, ra, ra, rb, hint); s.tri(a, c, d, col, ra, rb, rb, hint);
        }
      }
      const cap = (ring, other, col, rig) => { const h = [ring.c[0] - other.c[0], ring.c[1] - other.c[1], ring.c[2] - other.c[2]]; for (let j = 1; j < n - 1; j++) s.tri(ring.pts[0], ring.pts[j], ring.pts[j + 1], col, rig, rig, rig, h); };
      if (capA) cap(rings[0], rings[1], capA, rigFn(0));
      if (capB) cap(rings[rings.length - 1], rings[rings.length - 2], capB, rigFn(rings.length - 1));
    },
    geometry(withRig) {
      const g = new THREE.BufferGeometry(), n = P.length / 3, N = new Float32Array(P.length);
      for (let i = 0; i < n; i += 3) {
        const o = i * 3, ux = P[o + 3] - P[o], uy = P[o + 4] - P[o + 1], uz = P[o + 5] - P[o + 2], vx = P[o + 6] - P[o], vy = P[o + 7] - P[o + 1], vz = P[o + 8] - P[o + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        for (let k = 0; k < 3; k++) { N[o + k * 3] = nx; N[o + k * 3 + 1] = ny; N[o + k * 3 + 2] = nz; }
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      if (withRig) g.setAttribute('aRig', new THREE.Float32BufferAttribute(R, 4));
      else { g.setAttribute('aKind', new THREE.Float32BufferAttribute(R.filter((_, i) => i % 4 === 0), 1)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); }
      return g;
    },
  };
  return s;
}
const ringPts = (n, fn) => { const pts = []; for (let j = 0; j < n; j++) pts.push(fn((j / n) * TAU)); return pts; };

// ---------------------------------------------------------------- the crane cast (rest pose, +Z forward, metres at 5.2 m span)
// aRig = (part, t, side, tag). part 0 body/tail (rigid), 1 neck (t along it), 2 head (head space), 3 wing (t 0 arm, 1 hand),
// 4 leg (t 0 thigh, 1 shin, 2 foot). tag 1 = left wingtip (left bare on a repair cast), 2 = seam-carrying part.
const SHOULDER = [0.2, 0.12, 0.25], HIP = [0.11, -0.14, -0.18], NECK0 = [0, 0.07, 0.5], NECK_L = 0.95, WRIST = 1.05, LEG1 = 0.9, LEG2 = 0.9;
function buildCraneGeometry(pal, marking = 0) {
  const s = makeSoup();
  const body = pal.blue, covert = pal.blue.clone().lerp(pal.cream, 0.12), second = pal.blue.clone().lerp(pal.slate, 0.38);
  const dark = pal.slate, belly = pal.blue.clone().lerp(pal.cream, 0.22);
  // body: six-sided spindle with a ridge on top (the mould seam runs along x = 0)
  const bs = [[-0.8, 0.04, 0.07, 0.04], [-0.48, 0.2, 0.2, 0.01], [-0.08, 0.32, 0.28, -0.03], [0.3, 0.3, 0.25, 0.0], [0.54, 0.16, 0.14, 0.06]];
  const bRings = bs.map(([z, ry, rx, y0]) => ({ c: [0, y0, z], pts: ringPts(6, (a) => [Math.sin(a) * rx, y0 + Math.cos(a) * ry, z]) }));
  s.tube(bRings, (i, j, h) => (h[1] < -0.02 ? belly : (i === 0 ? second : body)), () => [0, 0, 0, 2], dark, null);
  // tail: a slate-tipped fan
  for (const sd of [-1, 1]) { s.blade([0, 0.05, -0.7], [sd * 0.26, 0.02, -1.16], [0, 0.03, -1.26], dark, [0, 0, 0, 0]); s.blade([0, 0.05, -0.7], [sd * 0.2, 0.03, -0.72], [sd * 0.26, 0.02, -1.16], second, [0, 0, 0, 0]); }
  // neck: four-sided, stored straight along +Z from NECK0; the rig bends it in the YZ plane
  const nRings = [];
  for (let k = 0; k <= 5; k++) { const t = k / 5, r = lerp(0.135, 0.068, Math.pow(t, 0.7)), z = NECK0[2] + t * NECK_L; nRings.push({ c: [0, NECK0[1], z], pts: ringPts(4, (a) => [Math.sin(a) * r * 0.9, NECK0[1] + Math.cos(a) * r, z]) }); }
  const neckCol = marking === 1 ? (i) => (i >= 3 ? pal.coral : (i >= 2 ? pal.cream : body))                 // coral-headed (sarus)
    : marking === 2 ? (i, j, h) => (i >= 1 ? (h[1] < 0 ? dark : pal.cream) : body)                           // slate throat, cream nape
      : (i) => (i >= 3 ? pal.cream : (i >= 2 ? covert : body));                                           // cream-necked
  s.tube(nRings, neckCol, (i) => [1, i / 5, 0, 2], null, null);
  // head (head space: pivot at the origin, bill along +Z): crown coral, cheek cream, bill ochre, painted eye
  const HS = 1.4, hr = (z0, r0, y0) => { const z = z0 * HS, r = r0 * HS, y = y0 * HS; return { c: [0, y, z], pts: ringPts(4, (a) => [Math.sin(a) * r * 0.85, y + Math.cos(a) * r, z]) }; };
  s.tube([hr(-0.05, 0.05, 0), hr(0.07, 0.085, 0.015), hr(0.2, 0.06, 0.01), hr(0.27, 0.035, 0)], (i, j, h) => (h[1] > 0.01 ? pal.coral : pal.cream), () => [2, 1, 0, 2], pal.cream, null);
  s.tube([hr(0.27, 0.035, 0), hr(0.42, 0.022, -0.005), hr(0.58, 0.004, -0.02)], () => pal.ochre, () => [2, 1, 0, 0], null, null);
  for (const sd of [-1, 1]) s.tri([sd * 0.066 * HS, 0.045 * HS, 0.1 * HS], [sd * 0.062 * HS, 0.015 * HS, 0.135 * HS], [sd * 0.058 * HS, 0.05 * HS, 0.175 * HS], dark, [2, 1, 0, 0], null, null, [sd, 0.3, 0]);
  // wings
  const xs = [0, 0.55, WRIST, 1.6, 2.0], zl = [0.25, 0.37, 0.43, 0.3, 0.1], zt = [-0.62, -0.66, -0.62, -0.52, -0.34], th = [0.07, 0.06, 0.05, 0.035, 0.02];
  for (const sd of [-1, 1]) {
    const W = (k, z, y) => [SHOULDER[0] * sd + sd * xs[k], SHOULDER[1] + y, SHOULDER[2] + z];
    const rg = (k) => [3, k > 2 ? 1 : 0, sd, sd < 0 && k >= 3 ? 1 : 0];
    for (let k = 0; k < 4; k++) {
      const st = (q) => { const c = zl[q] - zt[q]; return { le: W(q, zl[q], 0), rd: W(q, zl[q] - 0.28 * c, th[q]), te: W(q, zt[q], 0), bt: W(q, zl[q] - 0.34 * c, -th[q] * 0.45) }; };
      const A = st(k), B = st(k + 1), ra = rg(k), rb = rg(k + 1), tip = k === 3;
      s.quad(A.le, B.le, B.rd, A.rd, tip ? second : covert, ra, rb, rb, ra, [0, 1, 0.3]);
      s.quad(A.rd, B.rd, B.te, A.te, tip ? dark : (k === 2 ? second : body), ra, rb, rb, ra, [0, 1, -0.2]);
      s.quad(A.te, B.te, B.bt, A.bt, tip ? dark : second, ra, rb, rb, ra, [0, -1, 0]);
      s.quad(A.bt, B.bt, B.le, A.le, belly, ra, rb, rb, ra, [0, -1, 0.3]);
      // secondaries: two chisel-cut feather teeth on the trailing edge of each segment
      for (let m = 0; m < 2; m++) {
        const f0 = m / 2, f1 = (m + 1) / 2, mix = (f, key) => [lerp(A[key][0], B[key][0], f), lerp(A[key][1], B[key][1], f), lerp(A[key][2], B[key][2], f)];
        const p0 = mix(f0, 'te'), p1 = mix(f1, 'te'), tipP = mix(f1 - 0.08, 'te'); tipP[2] -= 0.15 - k * 0.02; tipP[1] -= 0.012;
        const rt = [3, (k + f1) > 2.2 ? 1 : 0, sd, sd < 0 && k >= 3 ? 1 : 0];
        s.blade(p0, p1, tipP, tip ? dark : second, k === 2 && m === 0 ? ra : (m === 0 ? ra : rt), rt, rt);
      }
    }
    // primaries: five slotted slate fingers fanning from the hand
    const fa = [-0.3, 0.02, 0.3, 0.58, 0.86], fl = [0.6, 0.74, 0.74, 0.66, 0.54], rf = [3, 1, sd, sd < 0 ? 1 : 0];
    for (let j = 0; j < 5; j++) {
      const f = j / 4, zb = lerp(zl[4] - 0.02, zt[4] + 0.04, f), w = 0.062, a = fa[j];
      const b0 = W(4, zb + w, 0.008), b1 = W(4, zb - w, 0.008), t0 = [b0[0] + sd * Math.cos(a) * fl[j], b0[1] - 0.01, SHOULDER[2] + zb - Math.sin(a) * fl[j]];
      const m0 = [b0[0] + sd * Math.cos(a) * fl[j] * 0.6 - sd * Math.sin(a) * 0.0, b0[1], SHOULDER[2] + zb + w * 0.9 - Math.sin(a) * fl[j] * 0.6];
      s.blade(b0, b1, t0, dark, rf, rf, rf); s.blade(b0, m0, t0, dark, rf, rf, rf);
    }
  }
  // legs: three-sided, stored hanging straight down from the hip; a knee knob; three toes and a spur
  for (const sd of [-1, 1]) {
    const hx = HIP[0] * sd, lr = (y, r) => ({ c: [hx, HIP[1] + y, HIP[2]], pts: ringPts(3, (a) => [hx + Math.sin(a) * r, HIP[1] + y, HIP[2] + Math.cos(a) * r]) });
    s.tube([lr(0.06, 0.11), lr(-0.3, 0.075), lr(-LEG1, 0.045)], (i) => (i === 0 ? belly : dark), () => [4, 0, sd, 0], null, null);
    s.tube([lr(-LEG1 + 0.03, 0.062), lr(-LEG1 - 0.06, 0.045), lr(-LEG1 - LEG2, 0.036)], () => dark, () => [4, 1, sd, 0], null, null);
    const ank = [hx, HIP[1] - LEG1 - LEG2, HIP[2]], rfoot = [4, 2, sd, 0];
    for (const [dx, dz] of [[-0.14, 0.27], [0, 0.34], [0.14, 0.27], [0, -0.12]]) s.blade([ank[0] - 0.035, ank[1] + 0.03, ank[2]], [ank[0] + 0.035, ank[1] + 0.03, ank[2]], [ank[0] + dx, ank[1], ank[2] + dz], dark, rfoot, rfoot, rfoot);
  }
  return s.geometry(true);
}

// ---------------------------------------------------------------- STYLE NOTES (how the paint is done, for the world coder)
// PAINTED LIGHT (uSunH, the painted sun's bearing): every upright face takes one of four flat tones by the angle between
// its horizontal normal and that bearing: under 30 degrees +18 % cream, to 50 the flank colour, to 72 x uShade, beyond
// that x uShade squared (a quarter darker on screen). Tops and undersides keep their own tones; aKind 7 (painted scenery) is exempt. No lights, no cast shadows.
// The WORLD adds to this through shared uniforms (off in the set piece alone): uSunD gives the sun a slope and castSh() then paints
// exact cast shadows of the drums, the mast and the blades; uWheel.y = 1 adds the bounce band at the foot of each riser; the shade tone
// (shadeOf) keeps a paint's own colour the more saturated it is and takes the blue-grey of the shadow ovals the paler it is. Kinds 8 and 9
// are a ring at speed (streaked band, curtain of peg streaks).
// One paint function for everything (PAINT_FRAG): the flank colour comes from the vertex colour; where the WORLD
// normal's y is over 0.35 it is mixed 42 % toward cream (top tone), where under -0.3 it is multiplied by the shade
// tint (0.70, 0.77, 0.86) (underside tone), joins 0.08 wide; normals are per face (non-indexed soup), never smooth.
// Over it: +-5 % value noise at 3 cycles/m in object space (brush mottle) and a 12 % darker mould seam where the
// cast's own |x| < 1.6 cm, both fading out between 40 and 60 m; then smear (70 % toward the ring mean), then 35 % of
// horizon cream #EFE6D2 by 1 - exp(-d / 900), then x uLift (1.15) for ACES. No lights, no specular, no textures.
// Scene fog is honoured only if the world sets one (fog chunks compile to nothing without it).
const GLSL_COMMON = /* glsl */`
vec3 rX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
vec3 rY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }
`;
const PAINT_FRAG = /* glsl */`
uniform vec3 uHaze, uMean, uCream, uShade, uOval, uCoral, uSkyTop;
uniform float uSmear, uLift, uPx;
uniform vec2 uSunH;   // the painted sun's bearing (unit x, z): vertical faces take one of three flat tones by it
uniform vec3 uSunD;   // the same bearing with the sun's slope in y (x, tan elevation, z). y = 0: no painted cast shadows (the set piece alone)
uniform vec4 uWheel;  // x: the wall's drawn angle, y: 1 where there is a wheel to cast shadows and bounce light (the world), z: unused, w: unused
uniform vec4 uLongR;  // the world's long painted shadows (vAux.w == 11): the deck's inner and outer radius, its track band's inner and outer radius
uniform vec3 uLongG, uLongB, uLongL, uLongC;   // the deck's own paint under them (its ground, its track band, the band's two edge lines) and the stands' chalk (the vertex colour of live's lozenges)
uniform vec4 uDk, uDkR;   // the world's painted decks (kind 1): uDk = (0 none, 1 marsh, 2 meadow, 3 snow, 4 wet slate; the sector's angle; the ring's radius; the ring's direction), uDkR = (track band inner, outer; deck inner, outer)
uniform vec3 uDkA, uDkB, uDkC;   // their paints: the flowers' eyes (snow: pit and prints), the flowers' petals (snow: the pit's rim), (snow: x the bare pegs' pitch)
uniform vec3 uWedge;             // the yard's strobe disc: what the floor's paint is multiplied by on a pale wedge (0: no disc)
varying vec3 vCol, vN, vObj, vWorld;
varying vec4 vAux;   // x seam coordinate (m), y kind, zw uv
#include <common>
#include <fog_pars_fragment>
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// PAINTED CAST SHADOWS (no lights, no shadow maps): the wheel is five drums and a mast, the wall forty blades on one circle, so
// what stands between a point and the painted sun is worked out exactly: one ray against six cylinders and the circle of blades.
float cylSh(vec3 p, float R, float top){
  float b = dot(p.xz, uSunD.xz), c = dot(p.xz, p.xz) - R * R, disc = b * b - c;
  if (c < R * .9 || disc <= 0. || b >= 0.) return 0.;
  float t = -b - sqrt(max(disc, 0.));
  return 1. - smoothstep(top - .25, top + .25, p.y + t * uSunD.y);
}
float bladeAt(vec3 p, float t){
  vec2 q = p.xz + uSunD.xz * t; float h = p.y + t * uSunD.y;
  float f = fract((atan(q.x, q.y) - uWheel.x) / .15707963);
  return step(1.5, t) * (1. - smoothstep(39.7, 40.3, h)) * step(1.6, h) * smoothstep(0., .012, f) * (1. - smoothstep(.488, .5, f));
}
float castSh(vec3 p){
  if (uSunD.y < .01 || uWheel.y < .5) return 0.;
  float sh = max(max(cylSh(p, 150., 8.), cylSh(p, 118., 22.)), max(cylSh(p, 88., 36.), max(cylSh(p, 56., 50.), max(cylSh(p, 34., 62.), cylSh(p, 2., 172.)))));
  float b = dot(p.xz, uSunD.xz), c = dot(p.xz, p.xz) - 44100., disc = b * b - c;
  if (disc > 0. && abs(c) > 600.) { float sq = sqrt(disc); sh = max(sh, max(bladeAt(p, -b - sq), bladeAt(p, -b + sq))); }
  return sh;
}
// the shade tone of a paint: darker and cooler, and the paler and greyer the paint the more it takes the blue-grey of the painted
// shadow ovals, so plaster in shade is a powder blue-grey while coral, ochre and blue keep their own colour
vec3 shadeOf(vec3 b){
  float mx = max(b.r, max(b.g, b.b)), mn = min(b.r, min(b.g, b.b)), sat = (mx - mn) / max(mx, 1e-3), lum = dot(b, vec3(.3, .5, .2));
  return mix(b * uShade * uShade, uOval * (.5 + .55 * lum), .8 * (1. - sat) * step(.02, lum));
}
// a paint (linear) as the screen's 0 to 1 and back (the sRGB curve above its toe): the long shadows' tone rule is kept in screen values
vec3 toScr(vec3 c) { return 1.055 * pow(max(c, vec3(.0031308)), vec3(1. / 2.4)) - .055; }
vec3 ofScr(vec3 s) { return pow((s + .055) / 1.055, vec3(2.4)); }
// the lawns' flower drifts (the world's decks, round p4): how far out of a drift a point of a lawn lies (under 1: inside it).
// q = (along the sector, across the lawn; each 0 to 1), am and wm the sector's length and the lawn's width in metres. Four loose
// ovals a sector on each lawn (the second mend: were two), each about 6.6 by 4.5 m, turned a little and wavy at the edge, so
// that they run into one another and into their own next copies: a lawn in flower with green left between.
float dOval(vec2 q, vec2 c, vec2 ab, vec2 cs, float am, float wm){
  vec2 d = vec2((fract(q.x - c.x + .5) - .5) * am, (q.y - c.y) * wm), u = vec2(d.x * cs.x + d.y * cs.y, d.y * cs.x - d.x * cs.y);
  return length(u / ab) / (1. + .15 * sin(2.1 * u.x + 1.3 * u.y));
}
float driftAt(vec2 q, float am, float wm){
  return min(min(dOval(q, vec2(.2, .26), vec2(3.4, 2.3), vec2(.94, .34), am, wm), dOval(q, vec2(.7, .2), vec2(3.1, 2.), vec2(.97, -.26), am, wm)),
             min(dOval(q, vec2(.45, .62), vec2(3.5, 2.4), vec2(.91, -.42), am, wm), dOval(q, vec2(.95, .74), vec2(3.2, 2.2), vec2(.89, .45), am, wm)));
}
// one lawn's flowers at a point p of the deck (its own space): rgb the flower's paint here, a how much of it; din (out) how far out of
// a drift the point lies. One rosette at most to a cell of 0.8 m, rows set half a cell on from one another, each flower moved in
// its cell as far as its size leaves room; five or six petals round an eye, 0.42 to 0.68 m across; thinner toward a drift's
// edge (20 to 25 in a drift); cream with an ochre eye mostly, some blue with a cream eye, few coral. Exactly periodic in the
// sector (uDk.y). pk: half the pixels a metre of ground takes here (the footprint rule).
vec4 lawnFlower(vec3 p, float pk, out float din){
  float r = length(p.xz), sg = fract(atan(p.x, p.z) / uDk.y), inn = step(r, uDkR.x);
  float ra = inn > .5 ? uDkR.z : uDkR.y, rb = inn > .5 ? uDkR.x : uDkR.w, wm = rb - ra, v = (r - ra) / wm;
  din = 9.;
  if ((r > uDkR.x && r < uDkR.y) || v < 0. || v > 1.) return vec4(0.);
  float am = uDk.y * (ra + rb) * .5, nS = floor(am / .8 + .5), nV = floor(wm / .8 + .5);
  din = driftAt(vec2(sg - .37 * inn, mix(v, 1. - v, inn)), am, wm);          // the inner lawn's set a third of a sector on and turned over
  float row = min(floor(v * nV), nV - 1.), odd = mod(row, 2.), gx = sg * nS + .5 * odd, cx = floor(gx);
  float h1 = h3(vec3(mod(cx, nS), row, 3.7 + inn)), h2 = h3(vec3(mod(cx, nS), row, 9.1 + inn));
  float rad = .21 + .13 * fract(h1 * 7.), np = 5. + step(.5, fract(h1 * 13.));
  vec2 cf = vec2(.5) + (vec2(h1, h2) - .5) * 2. * max(vec2(0.), .5 - 1.03 * rad / vec2(am / nS, wm / nV));   // the flower's centre in its cell
  vec2 dc = (vec2(gx - cx, v * nV - row) - cf) * vec2(uDk.y * r / nS, wm / nV);
  float cy = (row + cf.y) / nV, ein = driftAt(vec2((cx + cf.x - .5 * odd) / nS - .37 * inn, mix(cy, 1. - cy, inn)), am, wm);
  float rp = rad * (.5 + .5 * abs(cos(.5 * np * (atan(dc.y, dc.x + 1e-6) + 6.2831853 * h2)))), rho = length(dc);
  float pet = (1. - smoothstep(rp - .035, rp, rho)) * step(ein, 1.) * step(.12 + .5 * ein * ein, fract(h2 * 5.));
  vec3 pc = h1 < .64 ? uDkB : (h1 < .88 ? uSkyTop : uCoral), ec = h1 < .64 || h1 > .88 ? uDkA : uDkB;
  return vec4(mix(pc, ec, 1. - smoothstep(.3 * rad - .03, .3 * rad, rho)), pet * clamp(2. * rad * pk - .5, 0., 1.));
}
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  vec3 toCam = cameraPosition - vWorld;
  float dist = max(length(toCam), 1e-3);
  float kind = vAux.y, near = 1. - smoothstep(40., 60., dist);
  vec3 base = vCol;
  float pxm = uPx / dist;                                   // pixels per metre here
  if (kind > 1.5 && kind < 2.5) {                           // rim stripe, coral and cream, 1.5 m
    float c = clamp(1.5 * pxm / 2. - .5, 0., 1.) * (1. - uSmear);
    float f = fract(vAux.z), sq = smoothstep(.0, .04, f) * (1. - smoothstep(.5, .54, f));
    base = mix(mix(uCream, uCoral, .5), mix(uCream, uCoral, sq), c) * .93;
  }
  if (kind > 3.5 && kind < 4.5) {                           // painted shadow oval on a plinth top
    float r2 = dot(vAux.zw, vAux.zw);
    base = mix(uOval, base, smoothstep(.85, 1., r2));
  }
  if (kind > 4.5 && kind < 5.5) {                           // foil: flat paint plus the analytic sky colour, in three flat steps
    float g = 1. - clamp(abs(toCam.y) / dist, 0., 1.);
    float st = floor(g * 3.99) / 3.;
    float rp = fract(length(vAux.zw) * 2.2 - .5);           // painted rings (uv = ring coordinates, 0 at the centre)
    base = mix(base, uSkyTop, .25 + .45 * st);
    base = mix(base, uCream, .5 * step(.01, dot(vAux.zw, vAux.zw)) * smoothstep(.0, .08, rp) * (1. - smoothstep(.16, .24, rp)) * clamp(.45 * pxm / 2. - .5, 0., 1.));
  }
  if (kind > 5.5 && kind < 6.5 && vObj.y < .03) {
    // THE CASTING YARD'S SETTING OUT (the world's round p4), on the floor itself (y 0) and UNDER the floor's own raked chequer: all of
    // it is laid into the ground tone here, before the chequer's lines, bed edges and alternate beds are worked over it just below,
    // so those keep their whole contrast on every tone of it.
    // THE STROBE DISC: from the wheel's foot to the ring of blades the floor is 48 alternate wedges in two close tones of its own
    // tan: the paler is the floor's paint times uWedge (the world works it out from the floor's paint: about 38 of 255 apart in one
    // channel on screen), the entry line down the middle of a pale one; cut by two scribed rings at 171 and 195 m. Beyond the
    // blades: scribed rings every 12 m to 330 m (clear of the floor's own painted rings) and 80 chalk lines struck from the centre.
    float ry = length(vObj.xz), kf = abs(toCam.y) / dist, az = atan(vObj.x, vObj.z);
    float on = step(152., ry) * step(ry, 470.), disc = step(152., ry) * step(ry, 209.);
    float wd = (.25 - abs(fract(az / .2617994 + .5) - .5)) * .2617994 * ry;
    base *= mix(vec3(1.), uWedge, disc * step(.001, uWedge.x) * smoothstep(-.6, .6, wd * pxm));
    float dr = disc > .5 ? abs(fract(ry / 24. + .375) - .5) * 24. : abs(fract(ry / 12. + .125) - .5) * 12.;
    base *= mix(vec3(1.), vec3(.6, .65, .76), on * step(ry, 335.) * clamp(1.7 * pxm * kf / 2. - .5, 0., 1.) * (1. - smoothstep(.7, .85, dr)));   // rings 1.7 m wide
    float da = abs(fract(az / .0785398 + .25) - .5) * .0785398 * ry;
    base = mix(base, mix(base, uCream, .72), on * (1. - disc) * clamp(1.2 * pxm * kf / 2. - .5, 0., 1.) * (1. - smoothstep(.48, .6, da)));   // chalk lines 1.2 m wide
  }
  if (kind > 5.5 && kind < 6.5) {                           // raked gravel of the yard: 24 m beds raked along x or z, chequerwise
    vec2 cell = floor(vObj.xz / 24.), fc = fract(vObj.xz / 24.);
    float alt = mod(cell.x + cell.y, 2.);
    float along = alt > .5 ? vObj.x : vObj.z;
    float f = fract(along / .5);
    float c = clamp(.5 * pxm * abs(toCam.y) / dist / 2. - .5, 0., 1.);
    base *= 1. - .15 * c * (abs(f - .5) * 2. - .5);
    float edge = min(min(fc.x, 1. - fc.x), min(fc.y, 1. - fc.y)) * 24.;
    float ce = clamp(.6 * pxm * abs(toCam.y) / dist / 2. - .5, 0., 1.);
    base = mix(base, base * vec3(.80, .84, .88), ce * (1. - smoothstep(.25, .45, edge)));
    base *= 1. - .09 * alt;
  }
  if (kind > .5 && kind < 1.5 && uDk.x > .5) {
    // THE DECKS PAINTED LIKE A STUDIO MODEL'S GROUND (the world's round p4; uDk.x: 1 marsh, 2 meadow, 3 snow, 4 wet slate). All of
    // it is paint in the deck's own space and repeats exactly once a sector (uDk.y, the fixed-thing pitch), so in lock it stands
    // still under the animals; sp runs 0 to 1 along a sector the way the casts' pose runs, so what is painted for a pose's place
    // lies under every cast that comes to it. Each mark's contrast fades before it is finer than two pixels; in the smear it goes.
    float r = length(vObj.xz), pk = pxm * abs(toCam.y) / dist / 2., live = 1. - smoothstep(0., .3, uSmear);
    float sg = fract(atan(vObj.x, vObj.z) / uDk.y), sp = uDk.w > 0. ? sg : 1. - sg, arc = uDk.y * r, dy = r - uDk.z;
    bool onBand = r > uDkR.x && r < uDkR.y;
    if (uDk.x < 2.5 && !onBand) {                           // the lawns: loose drifts of painted flowers, each a rosette of petals round an eye, laid on the lawn's own green
      float din; vec4 fl = lawnFlower(vObj, pk, din);
      base = mix(base, uCream, .16 * (1. - smoothstep(.55, .7, din)) * live);   // the heart of each drift a lighter green of the lawn, nothing more
      base = mix(base, fl.rgb, fl.a * live);
    }
    // (the meadow's own track band is live's and is left as live paints it: the worn clay strip, its scuffs and hoof prints of the earlier rounds are gone)
    if (uDk.x > 2.5 && uDk.x < 3.5) {                       // the snow: the trampled apron where a fox comes out of the mound, its take-off pit, the prints of its run between them, and an older train of prints off to each side
      float ax = (sp - .115) * arc, bx = (sp - .665) * arc, ea = ax * ax / 2.6 + dy * dy / .8, eb = bx * bx / .75 + dy * dy / .3;
      base = mix(base, uDkA, max(1. - smoothstep(.72, .9, ea), 1. - smoothstep(.65, .9, eb)) * live);
      base = mix(base, uDkB, max(smoothstep(.9, 1., ea) * (1. - smoothstep(1.25, 1.4, ea)), smoothstep(.9, 1., eb) * (1. - smoothstep(1.4, 1.6, eb))) * live * clamp(.3 * pk - .5, 0., 1.));
      float gx = sp * 20., hx = (fract(gx) - .5) * arc / 20., hy = dy - (mod(floor(gx), 2.) * 2. - 1.) * .21;
      float pr = (1. - smoothstep(.012, .024, hx * hx * .55 + hy * hy)) * step(.2, sp) * step(sp, .62);
      float t = (abs(dy) - 2.2) / .95, tc = floor(t) + .5, off = (.45 + (dy < 0. ? .028 : -.024) * tc) - sg, ox = (off - floor(off + .5)) * arc + (mod(floor(t), 2.) - .5) * .34, oy = (fract(t) - .5) * .95;
      pr = max(pr, (1. - smoothstep(.014, .028, ox * ox + oy * oy * .6)) * step(0., t) * step(t, 11.));
      base = mix(base, uDkA, pr * live * clamp(.32 * pk - .5, 0., 1.));
      // a painted contact shadow at the foot of each bare peg (the second train stands half a cast pitch, uDkC.x, between the first's plinths): on the turntable, so it goes with its cast
      float qx = (fract(atan(vObj.x, vObj.z) / max(uDkC.x, 1e-3)) - .5) * uDkC.x * r;
      base = mix(base, uDkA, (1. - smoothstep(.7, 1., qx * qx / 1.2 + dy * dy / .17)) * live * step(1e-3, uDkC.x));
    }
    if (uDk.x > 3.5) {                                      // the wet slate: two larger painted rings round each puddle, and off the track slabs with joints and chisel strokes
      float cx = (sg - floor(sg + .5)) * arc, d2 = dy * dy + cx * cx / .64;
      float rg3 = max(1. - smoothstep(2.4, 2.8, abs(d2 - 9.6)), max(1. - smoothstep(3.6, 4.05, abs(d2 - 20.25)), .85 * (1. - smoothstep(4.8, 5.3, abs(d2 - 34.8))) * step(abs(cx), .47 * arc)));   // three bands 0.9 m wide, 3.1, 4.5 and 5.9 m out (the second mend: were 0.7 m and fainter)
      base = mix(base, uCream, .92 * rg3 * live * clamp(.9 * pk - .5, 0., 1.));
      if (!onBand) {
        float cr = (r - uDkR.z) / 2.4, ci = floor(cr), cf = fract(cr), ga = sg * 3. + mod(ci, 2.) * .5, af = fract(ga), sa = arc / 3.;
        float tone = h3(vec3(mod(floor(ga), 3.), ci, 5.3));
        base *= 1. + (tone - .5) * .64 * live;
        vec2 q = vec2((af - .5) * sa, (cf - .5) * 2.4);
        float u1 = q.x * .8 + q.y * .6, v1 = q.y * .8 - q.x * .6;
        base = mix(base, mix(base, uCream, .28), (1. - smoothstep(.03, .07, abs(fract(v1 / .5 + tone) - .5) * .5)) * (1. - smoothstep(.45, .65, abs(u1))) * step(abs(v1), .7) * live * clamp(.14 * pk - .5, 0., 1.));
        base = mix(base, base * vec3(.6, .64, .74), (1. - smoothstep(.05, .12, min(min(cf, 1. - cf) * 2.4, min(af, 1. - af) * sa))) * live * clamp(.24 * pk - .5, 0., 1.));
      }
    }
  }
  if (kind > 7.5) {                                         // a ring at speed (the world's rope): soft lengthwise streaks, and the curtain of pegs under it
    float sAlong = atan(vObj.x, vObj.z) * max(length(vObj.xz), 1.), v = vAux.z;
    if (kind < 8.5) {
      float pulse = vnoise(vec3(sAlong * .13, v * .9, 2.7)), fine = vnoise(vec3(sAlong * .5, v * 6., 9.1)), fine2 = vnoise(vec3(sAlong * .28, v * 11., 4.3));
      float edge = smoothstep(.95, 2., abs(v));              // the fringe: fewer and thinner streaks toward its tip
      if (edge > 0. && vnoise(vec3(sAlong * .33, v * 3., 6.2)) * (1.15 - edge) < .34) discard;
      base = mix(base, mix(base, uCream, .5), smoothstep(.38, .8, pulse) * .8);
      base = mix(base, base * vec3(.66, .64, .68), smoothstep(.5, .78, fine) * .75);
      base = mix(base, mix(base, uCream, .7), smoothstep(.6, .85, fine2) * .6);
      base = mix(base, base * vec3(.7, .68, .72), smoothstep(.45, .8, v) * .55);          // a darker spine
      base = mix(base, mix(base, uCream, .6), (1. - smoothstep(-.75, -.4, v)) * .7);      // a pale belly line
      base = mix(base, uMean * .92, edge * .5);
    } else {
      float fq = exp2(floor(log2(clamp(pxm / 14., .125, 4.))));      // thin upright streaks, never finer than about two pixels
      float w = vnoise(vec3(sAlong * 3.1 * fq, 1.3, 4.)), w2 = vnoise(vec3(sAlong * 7.3 * fq, 7.7, 1.));
      if (max(w, w2 * .96) < .64) discard;
      base = mix(base, uCream, .3 * w2);
    }
  }
  if (kind < .5 && abs(vAux.w - 5.) < .5) {                 // a riser at speed (the world's skin): fine lengthwise threads in each tone band, lighter and darker, with tapered ends
    float sA = atan(vObj.x, vObj.z) * max(length(vObj.xz), 1.);
    float f1 = vnoise(vec3(sA * .22, vObj.y * 4.6, 3.1)), f2 = vnoise(vec3(sA * .11, vObj.y * 8.3, 7.7)), f3 = vnoise(vec3(sA * .4, vObj.y * 13., 1.9));
    base = mix(base, base * vec3(.84, .85, .89), smoothstep(.52, .74, f1) * .8);
    base = mix(base, mix(base, uCream, .55), smoothstep(.58, .8, f2) * .7);
    base = mix(base, base * vec3(.78, .8, .86), smoothstep(.66, .8, f3) * .6);
  }
  float wt = smoothstep(.31, .39, n.y), wu = 1. - smoothstep(-.34, -.26, n.y);
  if (kind > 7.5) { wt = 0.; wu = 0.; }
  float amt = (kind > 2.5 && kind < 3.5) ? .55 : 1.;        // brass takes the tones at half strength
  float lum = dot(base, vec3(.3, .5, .2));
  vec3 col = mix(base, mix(base, uCream, .3), wt * amt * smoothstep(.02, .3, lum));
  col = mix(col, base * uShade, wu * amt);
  // the painted shade side: every upright face is lit, half-tone or shade by which way it faces the painted sun
  // (flat steps, no falloff: still unlit paint). Tops and undersides keep their own tones.
  float hl = length(n.xz);
  float sdot = hl > 1e-3 ? dot(n.xz, uSunH) / hl : 1.;
  float upr = (1. - wt) * (1. - wu) * amt * (1. - step(6.5, kind));   // kind 7: painted scenery, one tone whichever way it stands
  float s0 = smoothstep(.83, .90, sdot), s1 = 1. - smoothstep(.60, .68, sdot), s2 = 1. - smoothstep(.27, .35, sdot);
  col = mix(col, mix(col, uCream, .18), upr * s0 * smoothstep(.02, .3, lum));   // facing the sun: a warm lift
  col = mix(col, col * mix(vec3(1.), uShade, .6), upr * s1);                    // turning away: half tone
  // turned away, or in the painted shadow of a drum, the mast or a blade: the shade tone. Within a few metres above a deck (or
  // the yard) the shade takes the chalk's bounce: a warmer, paler band along the foot of every riser
  float dark = max(upr * s2, castSh(vWorld) * (1. - wu) * amt * (1. - step(6.5, kind)));
  float hd = vWorld.y < 8. ? vWorld.y : (vWorld.y < 62. ? mod(vWorld.y - 8., 14.) : 9.);
  vec3 shd = shadeOf(base);
  shd = mix(shd, mix(shd * 1.1, uCream, .22), uWheel.y * (1. - wt) * (1. - smoothstep(.3, 3.6, hd)));
  col = mix(col, shd, dark);
  if (kind < .5 && abs(vAux.w - 8.) < .5) col = shadeOf(mix(vCol, uCream, .3));   // a painted cast shadow lying on a deck (the world's shadowProxy)
  if (kind < .5 && abs(vAux.w - 11.) < .5) {                // a LONG painted shadow (the world's, round p4); never off its deck
    float rr = length(vObj.xz);
    if (rr < uLongR.x || rr > uLongR.y) discard;
    // ONE TONE RULE ON EVERY DECK, made from live's own tones (the fourth mend). The deck's paint as live draws it here (a top
    // face's lift toward cream; the deck's own shade inside the painted shadow of a drum, the mast or a blade) is taken toward the
    // tone of live's lozenge (live's own line above, with the stands' chalk for vCol) until the lozenge is still 21 of 255 darker
    // in Rec. 709 luma on screen: so a lozenge lying on a long shadow reads on every deck. The mix number comes of the deck's plain
    // paint (picked by the radius), so a lawn's flowers under the shadow keep their step from the lawn; a paint darker than the
    // plain one is taken less far, and one already within 21 of the lozenge is left as it is.
    vec3 b = (rr > uLongR.z + .3 && rr < uLongR.w - .3) ? uLongB : ((rr > uLongR.z && rr < uLongR.w) ? uLongL : uLongG), bf = b;
    if (uDk.x > .5 && uDk.x < 2.5 && !(rr > uDkR.x && rr < uDkR.y)) {   // a lawn's flowers, as the deck paints them
      float din, lv = 1. - smoothstep(0., .3, uSmear); vec4 fl = lawnFlower(vObj, pxm * abs(toCam.y) / dist / 2., din);
      bf = mix(b, uCream, .16 * (1. - smoothstep(.55, .7, din)) * lv); bf = mix(bf, fl.rgb, fl.a * lv);
    }
    float cs = castSh(vWorld);
    vec3 lz = toScr(shadeOf(mix(uLongC, uCream, .3))), Y7 = vec3(.2126, .7152, .0722);
    vec3 d0 = toScr(mix(mix(b, mix(b, uCream, .3), smoothstep(.02, .3, dot(b, vec3(.3, .5, .2)))), shadeOf(b), cs));
    vec3 d1 = toScr(mix(mix(bf, mix(bf, uCream, .3), smoothstep(.02, .3, dot(bf, vec3(.3, .5, .2)))), shadeOf(bf), cs));
    col = ofScr(mix(d1, lz, clamp(1. - .0824 / max(min(dot(d0, Y7), dot(d1, Y7)) - dot(lz, Y7), 1e-4), 0., 1.)));
    col *= 1. - .16 * clamp(.4 * pxm * abs(toCam.y) / dist / 2. - .5, 0., 1.) * (abs(fract(rr / .4) - .5) * 2. - .5);   // the deck's rake lines run on through it
  }
  if (kind > 2.5 && kind < 3.5) {                           // brass: one fixed pale stripe by object angle
    float f = fract(vAux.z);
    col = mix(col, mix(col, uCream, .55), smoothstep(.10, .13, f) * (1. - smoothstep(.22, .25, f)));
  }
  if (kind > .5 && kind < 1.5) {                            // raked chalk: concentric lines 0.4 m apart
    float r = length(vObj.xz), f = fract(r / .4);
    float c = clamp(.4 * pxm * abs(toCam.y) / dist / 2. - .5, 0., 1.);
    col *= 1. - .16 * c * (abs(f - .5) * 2. - .5);
    float f2 = fract(r / 4.8 + .1);                         // a broad band every twelfth line keeps the deck from going blank
    col *= 1. - .05 * clamp(4.8 * pxm * abs(toCam.y) / dist / 2. - .5, 0., 1.) * step(.9, f2);
    float f3 = fract(r / 2.9 + .37);                        // at speed the deck streaks: broad concentric tone bands
    col *= 1. - .1 * uSmear * (smoothstep(0., .12, f3) - smoothstep(.42, .6, f3));
  }
  col *= 1. + (vnoise(vObj * 3.) - .5) * .10 * near;
  col *= 1. - .12 * near * (1. - smoothstep(.012, .02, abs(vAux.x)));
  col = mix(col, uMean, (.8 - .45 * step(.5, vAux.z)) * min(1., uSmear * 2.6) * step(kind, .5) * step(-.5, -abs(vAux.w - 7.)));   // casts only (w == 7 marks them): the mean coat by a third of the smear
  col = mix(col, uHaze, .35 * (1. - exp(-dist / 900.)));
  gl_FragColor = vec4(col * uLift, 1.);
  #include <fog_fragment>
}`;

// Cast rig: reads ONLY per-instance constants (a pose never changes in time; life comes from the rotor angle alone).
// aP0 = (wing root flap, wrist flap, wing sweep, head pitch), aP1 = (neck pitch at base, neck curl, repair, mottle seed),
// aP2 = (hip L, knee L, hip R, knee R), aP3 = (ankle L, ankle R, smear stretch, smear rise per metre).
const CAST_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aRig, aP0, aP1, aP2, aP3;
uniform float uSmear, uDir; uniform vec3 uBare;
varying vec3 vCol, vN, vObj, vWorld; varying vec4 vAux;
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
const vec3 SH = vec3(${SHOULDER[0]}, ${SHOULDER[1]}, ${SHOULDER[2]}), HP = vec3(${HIP[0]}, ${HIP[1]}, ${HIP[2]}), NK = vec3(0., ${NECK0[1]}, ${NECK0[2]});
void main(){
  float part = aRig.x, t = aRig.y, sd = aRig.z;
  vec3 p = position, n = normal;
  float k = abs(aP1.y) < .1 ? .1 : aP1.y, a0 = aP1.x;
  if (part > .5 && part < 2.5) {
    float tt = part > 1.5 ? 1. : t, a = a0 + k * tt;
    vec3 c = NK + ${NECK_L.toFixed(3)} * vec3(0., (cos(a0) - cos(a)) / k, (sin(a) - sin(a0)) / k);
    if (part < 1.5) {
      vec3 up = vec3(0., cos(a), -sin(a)), tg = vec3(0., sin(a), cos(a));
      p = c + vec3(position.x, 0., 0.) + up * (position.y - NK.y);
      n = vec3(normal.x, 0., 0.) + up * normal.y + tg * normal.z;
    } else { p = c + rX(position, -aP0.w); n = rX(normal, -aP0.w); }
  } else if (part > 2.5 && part < 3.5) {
    vec3 S = vec3(SH.x * sd, SH.yz), q = position - S;
    if (t > .5) { q.x -= sd * ${WRIST.toFixed(3)}; q = rZ(q, sd * aP0.y); n = rZ(n, sd * aP0.y); q.x += sd * ${WRIST.toFixed(3)}; }
    q = rZ(q, sd * aP0.x); n = rZ(n, sd * aP0.x);
    q = rY(q, sd * aP0.z); n = rY(n, sd * aP0.z);
    p = S + q;
  } else if (part > 3.5) {
    vec3 H = vec3(HP.x * sd, HP.yz), q = position - H;
    float hip = sd < 0. ? aP2.x : aP2.z, knee = sd < 0. ? aP2.y : aP2.w, ank = sd < 0. ? aP3.x : aP3.y;
    if (t > 1.5) { q.y += ${(LEG1 + LEG2).toFixed(3)}; q = rX(q, ank); n = rX(n, ank); q.y -= ${(LEG1 + LEG2).toFixed(3)}; }
    if (t > .5) { q.y += ${LEG1.toFixed(3)}; q = rX(q, knee); n = rX(n, knee); q.y -= ${LEG1.toFixed(3)}; }
    q = rX(q, hip); n = rX(n, hip); p = H + q;
  }
  vObj = p + vec3(aP1.w * 37., aP1.w * 11., 0.);
  vAux = vec4(aRig.w > 1.5 ? position.x : 9., 0., 1., 7.);   // z = 1: the hero's casts keep more of their own paint in the smear
  vCol = (aRig.w > .5 && aRig.w < 1.5 && aP1.z > .5) ? uBare : color;
  // into rotor space, then the smear: stretch along the helix to one pitch, squash across it
  vec3 rp = (instanceMatrix * vec4(p, 1.)).xyz, c0 = instanceMatrix[3].xyz;
  vec3 rn = mat3(instanceMatrix) * n;
  float rr = max(length(c0.xz), 1.);
  vec3 T = vec3(c0.z, 0., -c0.x) / rr * uDir;
  vec3 rel = rp - c0; float d = dot(rel, T);
  vec3 perp = rel - T * d;
  float dd = d * mix(1., aP3.z, uSmear), ang = uDir * dd / rr * uSmear;
  vec3 sp = c0 + perp * mix(1., .6, uSmear) + vec3(0., dd * aP3.w * uSmear, 0.);
  rp = rY(sp, ang) + T * dd * (1. - uSmear);
  rn = mix(rn, vec3(rn.x, rn.y * 2., rn.z), uSmear);
  vec4 wp = modelMatrix * vec4(rp, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix) * rn;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// Static paint and brass pegs (the instanced variant unrolls each peg into a screw blade as the smear comes in).
const PAINT_VERT = /* glsl */`
attribute vec3 color; attribute float aKind;
uniform float uSmear, uDir, uUnroll; uniform vec3 uCream;
varying vec3 vCol, vN, vObj, vWorld; varying vec4 vAux;
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 p = position, n = normal;
  vObj = position; vCol = color; vAux = vec4(9., aKind, uv);
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.)).xyz; n = mat3(instanceMatrix) * n;
    vObj = p * .5;
    float w = (uv.x - .5) * uSmear * uv.y * uUnroll;        // uUnroll: share of one pitch a peg's blur covers
    vCol = mix(color, uCream, .3 * uSmear);
    p = rY(p, uDir * w * ${PITCH.toFixed(5)}); p.y += w * ${RISE.toFixed(3)};
    n = rY(n, uDir * w * ${PITCH.toFixed(5)});
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix) * n;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
function makeMaterials(pal, lift) {
  const shared = {
    uSmear: { value: 0 }, uUnroll: { value: 0.13 }, uDir: { value: 1 }, uLift: { value: lift }, uPx: { value: 700 },
    uHaze: { value: new THREE.Color('#EFE6D2') }, uMean: { value: pal.blue.clone().lerp(pal.cream, 0.25) },
    uCream: { value: pal.cream.clone() }, uShade: { value: new THREE.Color(0.70, 0.77, 0.86) }, uBare: { value: new THREE.Color('#EDE8DC') },
    uOval: { value: new THREE.Color('#9FB0BC') }, uCoral: { value: pal.coral.clone() }, uSkyTop: { value: pal.blue.clone() },
    uSunH: { value: new THREE.Vector2(Math.sin(3.04), Math.cos(3.04)) },   // almost opposite an exit bearing of +Z (the sun at your back as you leave); the world sets its own
    uSunD: { value: new THREE.Vector3(Math.sin(3.04), 0, Math.cos(3.04)) }, uWheel: { value: new THREE.Vector4(0, 0, 0, 0) },   // painted cast shadows: off until the world gives the sun a slope and says there is a wheel
  };
  const mk = (vertexShader) => new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), vertexShader, fragmentShader: PAINT_FRAG, fog: true, side: THREE.FrontSide,
  });
  const cast = mk(CAST_VERT), paint = mk(PAINT_VERT), brass = mk(PAINT_VERT);
  for (const m of [cast, paint, brass]) Object.assign(m.uniforms, shared);   // the same uniform objects: one write drives all three
  return { cast, paint, brass, shared };
}

// ---------------------------------------------------------------- the pose of cast i (a constant of the cast)
function castPose(i, dir, repairSet) {
  const fly = smoothstep(5.5, 15, i), flare = smoothstep(190, 239, i), ph = ((i % PER_TURN) / PER_TURN) * TAU;
  const stand = [1, 0.55, 0.2][i] || 0;                                 // cast 0 stands with wings held high, 1-2 unfold into the run
  const amp = lerp(0.46, 0.64, fly) * (1 - 0.5 * flare);
  let flap1 = 0.1 + amp * Math.sin(ph) + 0.22 * flare, flap2 = -0.12 + amp * 0.9 * Math.sin(ph - 1.1) - 0.08 * flare;
  flap1 = lerp(flap1, 1.02, stand); flap2 = lerp(flap2, -0.95, stand);
  const sweep = 0.09 * Math.cos(ph) * (1 - stand) + 0.12 * stand;
  const out = smoothstep(1, 12, i);
  const psi0 = lerp(1.3, 0.2, out) - 0.1 * flare, psi1 = lerp(-0.45, -0.24, out), headPitch = lerp(-0.12, -0.06, out) - 0.1 * Math.sin(ph) * (1 - fly);
  const g = (i * TAU) / 6, run = 1 - stand;
  const leg = (gg) => {
    const hipR = 0.52 * Math.sin(gg) * run, kneeR = (-0.15 - 0.75 * Math.max(0, -Math.cos(gg))) * run, ankR = -(hipR + kneeR) + 0.35 * Math.max(0, Math.sin(gg)) * Math.max(0, -Math.cos(gg)) * run;
    return [lerp(hipR, 1.4, fly), lerp(kneeR, 0.1, fly), lerp(ankR, 1.3, fly)];
  };
  const L = leg(g), Rr = leg(g + Math.PI);
  const scale = lerp(1, 0.24, flare), r = R_HELIX + 4.6 * Math.pow(flare, 1.3);
  const y = PLINTH_H + 1.86 + (i < GROUND_N ? 0 : RISE * (i - GROUND_N + 1)) + 4.5 * flare * flare;
  const pitch = 0.32 * smoothstep(5, 10, i) * (1 - 0.55 * smoothstep(12, 30, i)) + 0.4 * flare;
  const bank = -0.13 * dir * fly * (1 - flare), yawOut = 0.5 * flare;
  const phi = dir * i * PITCH;
  const castLen = 3.05 * scale, pitchLen = PITCH * r;
  return {
    r, y, phi, scale, pitch, bank, heading: Math.atan2(dir * Math.cos(phi), -dir * Math.sin(phi)) - dir * yawOut,
    P0: [flap1, flap2, sweep, headPitch], P1: [psi0, psi1, repairSet.has(i) ? 1 : 0, (i * 0.61803) % 1],
    P2: [L[0], L[1], Rr[0], Rr[1]], P3: [L[2], Rr[2], Math.max(1, 1.45 * pitchLen / castLen), i < GROUND_N ? 0 : RISE / pitchLen],
  };
}

// unit peg along +Y (0..1 before scaling; the collar and cup are sized for a 9 m peg 0.2 m thick): kind 3 = brass
function buildPegGeometry(pal) {
  const s = makeSoup(), n = 6, col = pal.ochre, deep = pal.ochre.clone().lerp(pal.slate, 0.3);
  const prof = [[0, 1.9], [0.012, 1.9], [0.014, 1.25], [0.03, 1.15], [0.032, 0.62], [0.5, 0.5], [0.965, 0.4], [0.972, 0.9], [0.99, 1.0], [1, 0.35]];
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < n; j++) {
    const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, [y0, r0] = prof[k], [y1, r1] = prof[k + 1];
    const A = [Math.sin(a0) * r0, y0, Math.cos(a0) * r0], B = [Math.sin(a1) * r0, y0, Math.cos(a1) * r0], C = [Math.sin(a1) * r1, y1, Math.cos(a1) * r1], D = [Math.sin(a0) * r1, y1, Math.cos(a0) * r1];
    const hint = [Math.sin((a0 + a1) / 2), (r0 - r1) * 3, Math.cos((a0 + a1) / 2)], ua = [j / n, 1], ub = [(j + 1) / n, 1], c = (k === 1 || k === 6) ? deep : col;
    s.tri(A, B, C, c, [3, 0, 0, 0], null, null, hint, ua, ub, ub); s.tri(A, C, D, c, [3, 0, 0, 0], null, null, hint, ua, ub, ua);
  }
  return s.geometry(false);
}

// The crane's cut-out (the world's round p4): a few triangles cut from the cast's own measures and carrying its rig parts. The
// world lays it out as the chalk figure of a crane on its yard's floor (the cranes themselves carry no long shadow). Body, neck,
// head and legs are side views (they stand in planes of constant x); wings and tail are plan views.
function buildCraneLong() {
  const s = makeSoup(), c = new THREE.Color(0, 0, 0), sx = [1, 0, 0], up = [0, 1, 0], R0 = [0, 0, 0, 0];
  const bs = [[-0.8, 0.07, 0.04], [-0.48, 0.22, 0.01], [-0.08, 0.34, -0.03], [0.3, 0.32, 0.0], [0.54, 0.18, 0.06]];   // z, half height, middle
  for (let i = 0; i < 4; i++) { const [za, ha, ca] = bs[i], [zb, hb, cb] = bs[i + 1]; s.quad([0, ca + ha, za], [0, ca - ha, za], [0, cb - hb, zb], [0, cb + hb, zb], c, R0, R0, R0, R0, sx); }
  for (const sd of [-1, 1]) s.tri([0, 0.05, -0.7], [sd * 0.26, 0.02, -1.16], [0, 0.03, -1.26], c, R0, R0, R0, up);
  for (let k = 0; k < 5; k++) {
    const t0 = k / 5, t1 = (k + 1) / 5, r0 = lerp(0.15, 0.085, Math.pow(t0, 0.7)), r1 = lerp(0.15, 0.085, Math.pow(t1, 0.7)), z0 = NECK0[2] + t0 * NECK_L, z1 = NECK0[2] + t1 * NECK_L, A = [1, t0, 0, 0], B = [1, t1, 0, 0];
    s.quad([0, NECK0[1] + r0, z0], [0, NECK0[1] - r0, z0], [0, NECK0[1] - r1, z1], [0, NECK0[1] + r1, z1], c, A, A, B, B, sx);
  }
  const RH = [2, 1, 0, 0]; s.quad([0, 0.11, -0.07], [0, -0.11, -0.07], [0, -0.08, 0.38], [0, 0.08, 0.38], c, RH, RH, RH, RH, sx); s.tri([0, 0.06, 0.38], [0, -0.06, 0.38], [0, -0.03, 0.81], c, RH, RH, RH, sx);
  const xs = [0, 0.55, WRIST, 1.6, 2.0], zl = [0.25, 0.37, 0.43, 0.3, 0.1], zt = [-0.62, -0.66, -0.62, -0.52, -0.34], fa = [-0.3, 0.02, 0.3, 0.58, 0.86], fl = [0.6, 0.74, 0.74, 0.66, 0.54];
  for (const sd of [-1, 1]) {
    const W = (k, z) => [SHOULDER[0] * sd + sd * xs[k], SHOULDER[1], SHOULDER[2] + z], rg = (k) => [3, k > 2 ? 1 : 0, sd, 0], rf = [3, 1, sd, 0];
    for (let k = 0; k < 4; k++) s.quad(W(k, zl[k]), W(k + 1, zl[k + 1]), W(k + 1, zt[k + 1]), W(k, zt[k]), c, rg(k), rg(k + 1), rg(k + 1), rg(k), up);
    for (let j = 0; j < 5; j++) { const zb = lerp(zl[4] - 0.02, zt[4] + 0.04, j / 4), b0 = W(4, zb + 0.08), b1 = W(4, zb - 0.08); s.tri(b0, b1, [b0[0] + sd * Math.cos(fa[j]) * fl[j], b0[1], SHOULDER[2] + zb - Math.sin(fa[j]) * fl[j]], c, rf, rf, rf, up); }
    const hx = HIP[0] * sd, L = (y, w) => [[hx, HIP[1] + y, HIP[2] + w], [hx, HIP[1] + y, HIP[2] - w]], T0 = [4, 0, sd, 0], T1 = [4, 1, sd, 0], T2 = [4, 2, sd, 0];
    const a = L(0.06, 0.17), b = L(-LEG1, 0.08), d = L(-LEG1 - LEG2, 0.06), ay = HIP[1] - LEG1 - LEG2;
    s.quad(a[0], a[1], b[1], b[0], c, T0, T0, T0, T0, sx); s.quad(b[0], b[1], d[1], d[0], c, T1, T1, T1, T1, sx);
    s.tri([hx, ay + 0.06, HIP[2] - 0.12], [hx, ay - 0.02, HIP[2] - 0.12], [hx, ay, HIP[2] + 0.34], c, T2, T2, T2, sx);
  }
  return s.geometry(true);
}

// ================================================================ buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('ascension') : ctx.rng;
  const hex = opts.palette || ['#F3EAD6', '#7FA6B8', '#E2725B', '#D9A441', '#9DB58A', '#2E3A46'];
  const pal = { cream: new THREE.Color(hex[0]), blue: new THREE.Color(hex[1]), coral: new THREE.Color(hex[2]), ochre: new THREE.Color(hex[3]), sage: new THREE.Color(hex[4]), slate: new THREE.Color(hex[5]) };
  pal.plaster = new THREE.Color('#D8CEB6');
  const detail = clamp(opts.detail ?? 1, 0.6, 1), dir = opts.dir === -1 ? -1 : 1, tickRate = opts.tick || 12;
  const mats = makeMaterials(pal, opts.lift ?? 1.15);
  mats.shared.uDir.value = dir;
  const object = new THREE.Group(); object.name = 'ascension';
  const rotor = new THREE.Group(); rotor.name = 'ascension-rotor'; object.add(rotor);

  // per-seed: which cast of each turn is the repair (bare wingtip), where the stair starts, the finial, the band rhythm
  const repairSet = new Set(); for (let m = 0; m < N_CAST / PER_TURN; m++) repairSet.add(m * PER_TURN + rng.int(0, PER_TURN - 1));
  const finial = rng.int(0, 2), bandShift = rng.range(0.15, 0.85), stairLead = rng.int(0, 47), collarStyle = rng.int(0, 2), marking = rng.int(0, 2);

  // ---- the 240 casts and their pegs
  const craneGeo = buildCraneGeometry(pal, marking);
  await ctx.yield();
  const cranes = new THREE.InstancedMesh(craneGeo, mats.cast, N_CAST);
  const pegGeo = buildPegGeometry(pal), pegs = new THREE.InstancedMesh(pegGeo, mats.brass, N_CAST);
  const P = [0, 1, 2, 3].map(() => new Float32Array(N_CAST * 4)), dummy = new THREE.Object3D(); dummy.rotation.order = 'YXZ';
  const poses = [], vA = new THREE.Vector3(), vB = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N_CAST; i++) {
    const q = castPose(i, dir, repairSet); poses.push(q);
    const x = Math.sin(q.phi) * q.r, z = Math.cos(q.phi) * q.r;
    dummy.position.set(x, q.y, z); dummy.rotation.set(-q.pitch, q.heading, q.bank); dummy.scale.setScalar(q.scale); dummy.updateMatrix();
    cranes.setMatrixAt(i, dummy.matrix);
    P[0].set(q.P0, i * 4); P[1].set(q.P1, i * 4); P[2].set(q.P2, i * 4); P[3].set(q.P3, i * 4);
    // peg: upright from the plinth for the ground casts, slanting up out of the mast for the rest
    vB.set(x, q.y - 0.2 * q.scale, z);
    if (i < GROUND_N) vA.set(x, PLINTH_H, z); else vA.set(Math.sin(q.phi) * MAST_R * 0.96, Math.max(1.3, vB.y - 3.3 - 1.2 * (1 - q.scale)), Math.cos(q.phi) * MAST_R * 0.96);
    const len = vA.distanceTo(vB), thick = 0.1 * lerp(0.6, 1, q.scale);
    dummy.position.copy(vA); dummy.quaternion.setFromUnitVectors(yAxis, vB.clone().sub(vA).normalize()); dummy.scale.set(thick, len, thick); dummy.updateMatrix();
    pegs.setMatrixAt(i, dummy.matrix);
    if (i % 80 === 79) await ctx.yield();
  }
  dummy.rotation.order = 'XYZ';
  ['aP0', 'aP1', 'aP2', 'aP3'].forEach((name, k) => craneGeo.setAttribute(name, new THREE.InstancedBufferAttribute(P[k], 4)));
  cranes.frustumCulled = false; pegs.frustumCulled = false;
  cranes.instanceMatrix.needsUpdate = true; pegs.instanceMatrix.needsUpdate = true;
  rotor.add(cranes, pegs);
  await ctx.yield();

  // ---- everything else on the rotor: one soup, one draw call. Lathe profiles run anticlockwise in (r, y), solid on the left.
  const st = makeSoup();
  const lathe = (prof, segs, uRep = 0, a0 = 0) => {
    for (let k = 0; k < prof.length - 1; k++) {
      const p0 = prof[k], p1 = prof[k + 1], dy = p1.y - p0.y, dr = p1.r - p0.r, kind = p0.kind || 0;
      for (let j = 0; j < segs; j++) {
        const b0 = a0 + (j / segs) * TAU, b1 = a0 + ((j + 1) / segs) * TAU, bm = (b0 + b1) / 2;
        const A = [Math.sin(b0) * p0.r, p0.y, Math.cos(b0) * p0.r], B = [Math.sin(b1) * p0.r, p0.y, Math.cos(b1) * p0.r], C = [Math.sin(b1) * p1.r, p1.y, Math.cos(b1) * p1.r], D = [Math.sin(b0) * p1.r, p1.y, Math.cos(b0) * p1.r];
        const hint = [Math.sin(bm) * dy, -dr, Math.cos(bm) * dy], rg = [kind, 0, 0, 0];
        const u0 = p0.u !== undefined ? p0.u : (j / segs) * uRep, u1 = p0.u !== undefined ? p0.u : ((j + 1) / segs) * uRep, w0 = p1.u !== undefined ? p1.u : u0, w1 = p1.u !== undefined ? p1.u : u1;
        if (p0.r > 1e-4) st.tri(A, B, C, p0.col, rg, rg, rg, hint, [u0, 0], [u1, 0], [w1, 0]);
        if (p1.r > 1e-4) st.tri(A, C, D, p0.col, rg, rg, rg, hint, [u0, 0], [w1, 0], [w0, 0]);
      }
    }
  };
  const plaster = pal.plaster, chalk = pal.plaster.clone().lerp(pal.cream, 0.35), brass = pal.ochre, seam = pal.slate.clone().lerp(pal.plaster, 0.35);
  const sageWash = pal.plaster.clone().lerp(pal.sage, 0.55), blueWash = pal.plaster.clone().lerp(pal.blue, 0.5);
  const pp = (r, y, col, kind, u) => ({ r, y, col, kind, u });

  // the mast: a turned base, a shaft of 24 facets in ten drums, a capital, and one of three finials (per seed)
  const mastProf = [pp(4.3, 0, plaster), pp(4.3, 0.8, chalk), pp(4.0, 1.05, seam), pp(3.9, 1.1, plaster), pp(3.9, 1.9, blueWash), pp(4.1, 2.15, blueWash), pp(4.1, 2.45, chalk),
    pp(3.4, 2.9, plaster), pp(2.75, 3.3, plaster), pp(2.45, 4.1, chalk), pp(2.45, 4.5, plaster), pp(MAST_R + 0.06, 4.9, plaster)];
  const drum = MAST_H / 10;
  for (let m = 0; m < 9; m++) {                                            // drum joints: a slate hairline groove and a slight swell
    const y0 = 4.9 + m * drum * 0.985, y1 = y0 + drum * 0.985, tint = m % 2 ? plaster : plaster.clone().lerp(pal.cream, 0.3);
    mastProf.push(pp(MAST_R, y0 + 0.25, tint), pp(MAST_R + 0.05, (y0 + y1) / 2, tint), pp(MAST_R, y1 - 0.2, seam), pp(MAST_R - 0.07, y1 - 0.12, seam), pp(MAST_R - 0.07, y1 - 0.04, plaster), pp(MAST_R + 0.06, y1, plaster));
  }
  const yCap = mastProf[mastProf.length - 1].y;                             // ~102.4
  mastProf.push(pp(MAST_R, yCap + 2.6, sageWash), pp(2.35, yCap + 3.0, sageWash), pp(2.35, yCap + 3.5, chalk), pp(3.0, yCap + 4.4, chalk), pp(3.2, yCap + 4.5, pal.coral), pp(3.2, yCap + 5.0, chalk), pp(2.9, yCap + 5.2, plaster), pp(2.2, yCap + 5.35, plaster));
  const yF = yCap + 5.35;
  if (finial === 0) mastProf.push(pp(0.9, yF + 0.5, brass, 3, 0.4), pp(0.6, yF + 0.9, brass, 3, 0.05), pp(1.25, yF + 1.5, brass, 3, 0.17), pp(1.5, yF + 2.3, brass, 3, 0.3), pp(1.25, yF + 3.1, brass, 3, 0.6), pp(0.5, yF + 3.6, brass, 3, 0.7), pp(0.22, yF + 3.9, brass, 3, 0.8), pp(0, yF + 5.6, brass));
  else if (finial === 1) mastProf.push(pp(1.6, yF + 0.5, plaster), pp(1.0, yF + 1.0, blueWash), pp(1.5, yF + 1.5, blueWash), pp(0.8, yF + 2.1, chalk), pp(1.15, yF + 2.6, pal.coral), pp(0.6, yF + 3.2, chalk), pp(0.8, yF + 3.6, brass, 3, 0.17), pp(0.4, yF + 4.1, brass, 3, 0.6), pp(0, yF + 6.0, brass));
  else mastProf.push(pp(1.2, yF + 0.6, plaster), pp(1.0, yF + 1.4, sageWash), pp(1.9, yF + 2.6, sageWash), pp(2.3, yF + 3.4, chalk), pp(2.3, yF + 3.6, pal.coral), pp(1.9, yF + 3.6, plaster), pp(1.2, yF + 2.9, plaster), pp(0.5, yF + 3.0, brass, 3, 0.17), pp(0.3, yF + 4.2, brass, 3, 0.6), pp(0, yF + 5.4, brass));
  await ctx.yield();
  lathe(mastProf, 24, 0, PITCH / 2);
  const topY = mastProf[mastProf.length - 1].y;
  await ctx.yield();

  // brass bands with 24 rivets each, one per helix turn (their height within the turn is per seed)
  const rivetN = detail < 0.8 ? 12 : 24;
  for (let m = 0; m < 9; m++) {
    const y = 7 + (m + bandShift) * 11, w = collarStyle === 2 ? 0.34 : 0.26, R1 = MAST_R + 0.17;
    lathe([pp(MAST_R, y - w - 0.1, brass, 3, 0.9), pp(R1, y - w, brass, 3, 0.02), pp(R1, y - 0.06, brass, 3, 0.17), pp(R1, y + 0.06, brass, 3, 0.4), pp(R1, y + w, brass, 3, 0.9), pp(MAST_R, y + w + 0.1, brass)], 24, 0, PITCH / 2);
    if (collarStyle === 1) lathe([pp(MAST_R, y + w + 0.25, pal.coral), pp(MAST_R + 0.09, y + w + 0.3, pal.coral), pp(MAST_R + 0.09, y + w + 0.5, pal.coral), pp(MAST_R, y + w + 0.55, pal.coral)], 24, 0, PITCH / 2);
    for (let j = 0; j < rivetN; j++) {
      const a = (j / rivetN) * TAU, sx = Math.sin(a), cz = Math.cos(a), tx = cz, tz = -sx, rr = R1 * Math.cos(PITCH / 2) - 0.01, h = 0.075, e = 0.085;
      const c = [sx * (rr + h), y, cz * (rr + h)], q = [[-e, 0], [0, e], [e, 0], [0, -e]].map(([dt, dyy]) => [sx * rr + tx * dt, y + dyy, cz * rr + tz * dt]);
      for (let k = 0; k < 4; k++) st.tri(q[k], q[(k + 1) % 4], c, seam, [0, 0, 0, 0], null, null, [sx, (q[k][1] + q[(k + 1) % 4][1] - 2 * y) * 4, cz]);
    }
    if (m % 3 === 2) await ctx.yield();
  }
  await ctx.yield();

  // the service stair: 48 treads a turn rising 0.23 m each, so it has exactly the casts' pitch (two treads a cast)
  // and screws upward with them; it runs half a turn above the peg sockets. Coral nosings draw the barber's-pole line.
  const stairOff = 0.94 + (stairLead / 47 - 0.5) * 3, hw = PITCH / 4, r0 = MAST_R - 0.08, r1 = 3.3, half = RISE / 2;
  const kA = Math.ceil((5.3 - stairOff) / half), kB = Math.floor((yCap + 2.3 - stairOff) / half), postEvery = detail < 0.8 ? 4 : 2;
  const pol = (r, a, y) => [Math.sin(a) * r, y, Math.cos(a) * r], K0 = [0, 0, 0, 0];
  for (let k = kA; k <= kB; k++) {
    const a = dir * k * (PITCH / 2), aLo = a - dir * hw, aHi = a + dir * hw, y = stairOff + k * half, tx = Math.cos(a) * dir, tz = -Math.sin(a) * dir;
    const A = pol(r0, aLo, y), B = pol(r1, aLo, y), C = pol(r1, aHi, y), D = pol(r0, aHi, y), dn = (p, h) => [p[0], p[1] - h, p[2]], up = (p, h) => [p[0], p[1] + h, p[2]];
    st.quad(A, B, C, D, chalk, K0, K0, K0, K0, [0, 1, 0]);
    st.quad(dn(A, 0.1), dn(B, 0.1), dn(C, 0.1), dn(D, 0.1), plaster, K0, K0, K0, K0, [0, -1, 0]);
    st.quad(dn(B, 0.14), dn(C, 0.14), C, B, k % 2 ? pal.coral : chalk, K0, K0, K0, K0, [Math.sin(a), 0, Math.cos(a)]);
    st.quad(dn(A, half + 0.1), dn(B, half + 0.1), B, A, blueWash, K0, K0, K0, K0, [-tx, 0, -tz]);
    // handrail (brass, a pale line along it) and slate posts
    const R0 = up(pol(r1, aLo, y - half * 0.5), 1.15), R1 = up(pol(r1, aHi, y + half * 0.5), 1.15), B3 = [3, 0, 0, 0], out = [Math.sin(a), 0.2, Math.cos(a)];
    st.tri(dn(R0, 0.13), dn(R1, 0.13), R1, brass, B3, B3, B3, out, [0.5, 0], [0.5, 0], [0.17, 0]); st.tri(dn(R0, 0.13), R1, R0, brass, B3, B3, B3, out, [0.5, 0], [0.17, 0], [0.17, 0]);
    st.quad(R0, R1, pol(r1 - 0.1, aHi, R1[1]), pol(r1 - 0.1, aLo, R0[1]), brass, B3, B3, B3, B3, [0, 1, 0]);
    if (k % postEvery === 0) {
      const c = pol(r1 - 0.04, a, y), e = 0.035;
      const q = [[e, 0], [-e * 0.5, e * 0.87], [-e * 0.5, -e * 0.87]].map(([dr, dt]) => [c[0] + Math.sin(a) * dr + tx * dt, y, c[2] + Math.cos(a) * dr + tz * dt]);
      for (let m = 0; m < 3; m++) { const p = q[m], p2 = q[(m + 1) % 3]; st.quad(p, p2, up(p2, 1.04), up(p, 1.04), seam, K0, K0, K0, K0, [(p[0] + p2[0]) / 2 - c[0], 0, (p[2] + p2[2]) / 2 - c[2]]); }
    }
    if (k % 32 === 0) await ctx.yield();
  }

  // plinths of the eight ground casts, each with its painted shadow oval (kind 4; uv = oval coordinates)
  for (let i = 0; i < GROUND_N; i++) {
    const q = poses[i], cx = Math.sin(q.phi) * q.r, cz = Math.cos(q.phi) * q.r, fx = Math.sin(q.heading), fz = Math.cos(q.heading), sx = fz, sz = -fx;
    const corner = (l, w, y) => [cx + fx * l + sx * w, y, cz + fz * l + sz * w], Lh = 1.25, Wh = 0.62, ins = 0.08;
    const lo = [corner(-Lh, -Wh, 0), corner(Lh, -Wh, 0), corner(Lh, Wh, 0), corner(-Lh, Wh, 0)], hi = [corner(-Lh + ins, -Wh + ins, PLINTH_H), corner(Lh - ins, -Wh + ins, PLINTH_H), corner(Lh - ins, Wh - ins, PLINTH_H), corner(-Lh + ins, Wh - ins, PLINTH_H)];
    for (let m = 0; m < 4; m++) { const m2 = (m + 1) % 4; st.quad(lo[m], lo[m2], hi[m2], hi[m], m % 2 ? plaster : chalk, K0, K0, K0, K0, [(lo[m][0] + lo[m2][0]) / 2 - cx, 0.3, (lo[m][2] + lo[m2][2]) / 2 - cz]); }
    const K4 = [4, 0, 0, 0], uvs = [[-1.25, -1.45], [1.25, -1.45], [1.25, 1.45], [-1.25, 1.45]];
    st.tri(hi[0], hi[1], hi[2], chalk, K4, K4, K4, [0, 1, 0], uvs[0], uvs[1], uvs[2]); st.tri(hi[0], hi[2], hi[3], chalk, K4, K4, K4, [0, 1, 0], uvs[0], uvs[2], uvs[3]);
  }

  // the top terrace (T5): raked chalk deck with a sage running track under the garland, a curb, the striped rim, the riser
  const hasDeck = opts.deck !== false;
  if (hasDeck) {
    const dseg = detail < 0.8 ? 72 : 96, D1 = (r, y, col) => pp(r, y, col, 1);
    lathe([pp(34.3, -12, seam), pp(34.3, -11.2, blueWash), pp(34, -10.9, plaster), pp(34, -6.2, seam), pp(33.9, -6.1, seam), pp(33.9, -5.9, plaster), pp(34, -5.8, plaster), pp(34, -1.7, seam), pp(34.12, -1.6, chalk, 2), pp(34.12, -0.1, chalk),
      pp(34, 0.0, chalk), pp(34, 0.32, chalk), pp(33.45, 0.32, plaster), pp(33.45, 0, chalk, 1), D1(27, 0, chalk), D1(20, 0, chalk), D1(13.2, 0, chalk), pp(12.9, 0, pal.coral), D1(12.6, 0, sageWash), D1(11, 0, sageWash), D1(9.4, 0, sageWash), pp(9.1, 0, pal.coral), D1(8.8, 0, chalk), D1(6.4, 0, chalk), pp(4.3, 0, chalk)], dseg, 72);
    // the riser's dress: 24 bays (one a cast pitch, so it holds still in lock), each a pilaster with a coral capital and
    // two arched panels with slate lights, over a door: the same scale cue the lower terraces carry
    const K0 = [0, 0, 0, 0], R = 34.02, bay = TAU / 24, spz = (r, a, y) => [Math.sin(a) * r, y, Math.cos(a) * r], arcC = blueWash.clone().lerp(pal.slate, 0.12);
    for (let k = 0; k < 24; k++) {
      const a0 = k * bay, o0 = spz(1, a0, 0), pw = 0.4 / R;
      st.quad(spz(R + 0.3, a0 - pw, -10.9), spz(R + 0.3, a0 + pw, -10.9), spz(R + 0.3, a0 + pw, -1.9), spz(R + 0.3, a0 - pw, -1.9), chalk, K0, K0, K0, K0, o0);
      st.quad(spz(R + 0.36, a0 - pw * 1.3, -2.3), spz(R + 0.36, a0 + pw * 1.3, -2.3), spz(R + 0.36, a0 + pw * 1.3, -1.8), spz(R + 0.36, a0 - pw * 1.3, -1.8), pal.coral, K0, K0, K0, K0, o0);
      for (const fa of [0.27, 0.73]) {
        const ac = a0 + bay * fa, o3 = spz(1, ac, 0);
        for (const [rad, hwM, yB, yC, col] of [[R + 0.03, 1.3, -5.7, -3.15, pal.cream], [R + 0.06, 1.08, -5.55, -3.2, arcC]]) {
          const hw = hwM / R, ring = [spz(rad, ac - hw, yB)]; for (let q = 0; q <= 6; q++) { const t = Math.PI * (q / 6); ring.push(spz(rad, ac - hw * Math.cos(t), yC + hwM * Math.sin(t))); } ring.push(spz(rad, ac + hw, yB));
          const c = spz(rad, ac, (yC + yB) / 2); for (let q = 0; q < ring.length; q++) st.tri(c, ring[q], ring[(q + 1) % ring.length], col, K0, K0, K0, o3);
        }
        const lw = 0.38 / R; st.quad(spz(R + 0.09, ac - lw, -4.4), spz(R + 0.09, ac + lw, -4.4), spz(R + 0.09, ac + lw, -3.3), spz(R + 0.09, ac - lw, -3.3), seam, K0, K0, K0, K0, o3);
      }
      const ad = a0 + bay * 0.5, dw = 0.55 / R, o4 = spz(1, ad, 0);
      st.quad(spz(R + 0.03, ad - dw * 1.3, -10.9), spz(R + 0.03, ad + dw * 1.3, -10.9), spz(R + 0.03, ad + dw * 1.3, -8.7), spz(R + 0.03, ad - dw * 1.3, -8.7), pal.cream, K0, K0, K0, K0, o4);
      st.quad(spz(R + 0.06, ad - dw, -10.9), spz(R + 0.06, ad + dw, -10.9), spz(R + 0.06, ad + dw, -8.9), spz(R + 0.06, ad - dw, -8.9), seam, K0, K0, K0, K0, o4);
    }
    await ctx.yield();
  }
  await ctx.yield();
  const fixed = new THREE.Mesh(st.geometry(false), mats.paint); fixed.frustumCulled = false; rotor.add(fixed);
  await ctx.yield();

  // ---------------------------------------------------------------- the drive: one angle (the rotor) and one smear
  // HOOKS  hero.setProgress(u)   the brief's schedule: statues turning slowly (angle = a smooth function of u), smear up over
  //                              u 0.30-0.40, LOCK from u 0.42 to 0.81 (the jump hides in the rope), smear down 0.44-0.47,
  //                              and the reverse over 0.78-0.84. Call it every frame; until it is called the piece runs a
  //                              36 s demo loop on the time given to update() (statues 0-7 s, lock 9.5-30 s: t 12 is locked).
  //        hero.setManual(angle, smear)  drive both yourself (pass null to go back to the schedule).
  //        hero.follow (default 1)  share of the camera's azimuth about the mast added to the locked angle, so the stations
  //                              ride round with an orbiting camera (the brief's lock). 0 lets the camera sweep past them.
  //        hero.drift (rad/s, default 0.14 = 1.5 m/s at the garland)  forward creep in lock: it turns columns into spirals.
  //        hero.slowTurns (default 2.4)  turns of the rotor over u 0..1 in the slow regime.  hero.tick  ticks per second.
  //        hero.rotor is the turning group; hero.uniforms.uSmear / uLift / uHaze / uMean are live; uUnroll (default 0.5) is the
  //                              share of a pitch each peg's blur covers at full smear (1 = a solid brass screw).
  const state = { mode: 'auto', u: 0, angle: 0, smear: 0, locked: false, offset: 0, started: false };
  const camPos = new THREE.Vector3(); let camAz = 0;
  const hero = {
    object, rotor, uniforms: mats.shared, state,
    follow: opts.follow ?? 1, drift: opts.drift ?? 0.14, slowTurns: opts.slowTurns ?? 2.4, tick: tickRate, slowRate: 0.3,
    setProgress(u) { state.mode = 'progress'; state.u = clamp(u, 0, 1); },
    setManual(angle, smear) { if (angle === null || angle === undefined) { state.mode = 'progress'; return; } state.mode = 'manual'; state.angle = angle; state.smear = clamp(smear || 0, 0, 1); },
  };
  const tickFn = (time) => { const q = hero.tick * time + 0.37, f = q - Math.floor(q); return Math.floor(q) + smoothstep(0.8, 1, f); };
  function update(dt, time, camera) {
    let s = 0, lock = false, slow = 0;
    if (camera) {
      camPos.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(camPos);
      if (camPos.x * camPos.x + camPos.z * camPos.z > 1e-4) camAz = Math.atan2(camPos.x, camPos.z);
      const hgt = ctx.renderer?.domElement?.height || 900;
      mats.shared.uPx.value = 0.5 * hgt * camera.projectionMatrix.elements[5];
    }
    if (state.mode === 'manual') { rotor.rotation.y = state.angle; mats.shared.uSmear.value = state.smear; return; }
    if (state.mode === 'progress') {
      const u = state.u;
      s = Math.max(smoothstep(0.30, 0.40, u) * (1 - smoothstep(0.44, 0.47, u)), smoothstep(0.78, 0.805, u) * (1 - smoothstep(0.815, 0.84, u)));
      lock = u >= 0.42 && u < 0.81; slow = dir * hero.slowTurns * TAU * u;
    } else {
      const tc = time % 36;
      s = Math.max(smoothstep(7, 9.5, tc) * (1 - smoothstep(10, 11.2, tc)), smoothstep(28.5, 30.2, tc) * (1 - smoothstep(30.6, 32, tc)));
      lock = tc >= 9.75 && tc < 30.4; slow = dir * hero.slowRate * time;
    }
    const raw = lock ? hero.follow * camAz + dir * hero.drift * time - dir * PITCH * tickFn(time) : slow;
    // the hand-over between regimes keeps the drawn angle (nothing jumps, even under the smear): the offset absorbs it
    if (state.started && lock !== state.locked) state.offset = state.angle - raw;
    state.started = true; state.locked = lock; state.smear = s;
    state.angle = raw + state.offset;
    rotor.rotation.y = state.angle; mats.shared.uSmear.value = s;
  }

  // ---------------------------------------------------------------- ANCHORS (local space; add the deck's world y, 62 in the brief)
  //  mastFoot / crown     the axis: [0,0,0] to the finial tip.
  //  garland              { radius 11 (cast centres), reach 13.7 (wingtips), yFirst, yLast, flareRadius 18.5 (the shrinking last 48) }
  //  orbit                the brief's turn round the mast: radius 24, local y 13 to 58 (world 75 to 120), clear of every wingtip
  //                       by 10 m and of the flare (local y > 95) by 35 m. flyThrough is that turn as 13 points, clockwise seen
  //                       from above, starting due -Z of the mast (where a camera entering along +Z meets it) and ending there.
  //  viewpoints           wide (the whole garland), inside (on the orbit, looking up the stream), foot (the runners on their plinths).
  //  portalSeat           the brief seats the 14 m portal OUTSIDE the wall at radius 250, world y 16: on the exit bearing (+Z here)
  //                       that is [0, -46, 250] facing back at the mast. Turn it to whatever exit bearing the world uses.
  const yLast = poses[N_CAST - 1].y, flyThrough = [];
  for (let k = 0; k <= 12; k++) { const a = Math.PI - (k / 12) * TAU; flyThrough.push(new THREE.Vector3(Math.sin(a) * 24, lerp(13, 58, k / 12), Math.cos(a) * 24)); }
  const anchors = {
    mastFoot: new THREE.Vector3(0, 0, 0), crown: new THREE.Vector3(0, topY, 0),
    garland: { radius: R_HELIX, reach: R_HELIX + 2.7, yFirst: poses[0].y, yLast, flareRadius: 18.5, pitch: RISE * PER_TURN, perTurn: PER_TURN, dir },
    orbit: { radius: 24, yFrom: 13, yTo: 58, clockwise: true },
    flyThrough,
    viewpoints: [
      { name: 'wide', position: new THREE.Vector3(0, 34, 78), target: new THREE.Vector3(0, 52, 0) },
      { name: 'inside', position: new THREE.Vector3(-24, 36, 0), target: new THREE.Vector3(0, 78, 6) },
      { name: 'foot', position: new THREE.Vector3(15, 3.2, 17), target: new THREE.Vector3(6, 3.5, 6) },
    ],
    portalSeat: { position: new THREE.Vector3(0, -46, 250), facing: new THREE.Vector3(0, 0, -1), radius: 7 },
  };
  // COST  casts 240 x 366 triangles, pegs 240 x 108, mast + stair + deck ~14k: about 128k triangles, 3 draw calls, no lights,
  //       no textures, build ~60-110 ms in steps under 35 ms. Nothing is frustum culled (the rig and smear move vertices in the shader).
  // LIGHTING  none: unlit paint; wants a pale high-key sky, bloom ~0.12 with a high threshold, exposure 1.
  //           The paint has a shade side: set uniforms.uSunH (unit Vector2: world x, z of the painted sun's bearing).
  return Object.assign(hero, {
    radius: hasDeck ? 34 : 19, height: topY, center: new THREE.Vector3(0, topY * 0.47, 0), anchors,
    update, dispose() {}, ground: true, groundY: hasDeck ? -12 : 0,
  });
}

// for the world module: the same soup builder, paint and helpers, so every ring is painted like the mast
export { makeSoup, ringPts, GLSL_COMMON, PAINT_FRAG, PAINT_VERT, buildCraneLong };
