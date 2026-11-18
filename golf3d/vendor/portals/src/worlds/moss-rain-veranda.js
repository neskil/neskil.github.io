// THE LONG RAIN: a Kyoto temple in the rains. We come in along an open-sided roofed gallery over two moss courts; the
// paper screens of the hall's back slide away ahead of us and the mirror hall (src/parts/moss-rain-veranda.js) lies open:
// its black lacquer floor doubles the whole wet garden. Across it, out through the eave drips, low over moss toward a lit
// stone lantern under the maples, past a deer-scarer, along stepping stones under a trained pine limb, into the round
// window of a teahouse.
//
// Everything is built in the hero's LOCAL frame (+Z = garden, floor y = 0, garden y = -5) and most of it goes straight
// into the hero's four merged batches through opts.extend, so it shares the self-lit rain-sky shader, the mirror and
// the snow of February at no extra draw calls. The hero is turned by PI so the world runs down -Z from the origin.
//
// The light: a dark blue-grey deck of rain cloud in layers, one silver seam under its edge low over the wall and cedars,
// and a break from which soft shafts come down through the rain onto pools of lit moss and water (six are staged, the
// rest drift). Warm things are few and small: flames in the
// stone lanterns, the hanging lanterns of the gallery and a paper lamp in the hall; a vermilion umbrella and tray.
//
// Looks by seed: June rain with blue hydrangeas, purple iris and two vermilion maples / November drizzle with crimson
// and gold maples and fallen leaves / February wet snow with bare maples, red camellias, a roped pine and an ice-skinned
// pond; hours day, dawn (bluer, mistier), golden (thin cloud, drizzle), night (blue dusk, on request); which side the hill
// lies on; rain weight. Rare: a grey heron lifts from the pond's edge and flies ahead of us over the water, outside
// the pond-side row of props, banked away, then turns in to the teahouse roof.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/moss-rain-veranda.js';

const PAL = ['#0D0F0D', '#0A1611', '#1E4A2C', '#4F8F2B', '#93C83F', '#C7D1CD', '#5A7FCC'];
const PI = Math.PI, Z_IN = -96, GY = -5;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

const NOISE = /* glsl */`
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vn3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

// ---- paper screens: 12 sliding cross leaves (ink wash, pull and tassel), 16 lattice court panels, 6 transoms
const SCREEN_VS = /* glsl */`
attribute vec4 aI;
varying vec2 vUv; varying vec4 vI;
void main(){ vUv = uv; vI = aI; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }`;
const SCREEN_FS = /* glsl */`
uniform vec3 uSky, uTassel; uniform float uTime, uGlow;
varying vec2 vUv; varying vec4 vI;
${NOISE}
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.)); }
// wet maple boughs behind the paper: they sway, and dip when a drop strikes
float leafShade(vec2 q, float idx){
  float sw = sin(uTime * 1.9 + idx * 2.1) * 0.6 + sin(uTime * 3.1 + idx) * 0.22, dip = sin(uTime * 2.6 + idx * 1.3) * 0.3;
  vec2 s = q * 0.32 + vec2(idx * 3.1 + sw * 0.32, dip * 0.32);
  float n = vn3(vec3(s, 1.)) * 0.6 + vn3(vec3(s * 2.9, 4.)) * 0.4;
  return smoothstep(0.47, 0.6, n + (vn3(vec3(s * 9., 7.)) - 0.5) * 0.28);
}
void main(){
  float kind = floor(vI.x + 0.5), idx = vI.y;
  vec2 sz = kind < 0.5 ? vec2(8., 14.) : (kind < 1.5 ? vec2(vI.w, 14.) : vec2(vI.w, 2.6));
  vec2 q = vUv * sz;
  float fw = fwidth(q.x) + fwidth(q.y) + 1e-4;
  float fe = min(min(q.x, sz.x - q.x), min(q.y, sz.y - q.y));
  float bw = kind < 0.5 ? 0.34 : 0.26;
  float dark = 1. - smoothstep(bw - fw, bw + fw, fe);
  vec3 paper = vec3(0.60, 0.655, 0.615);
  float glow = uGlow;
  vec3 extra = vec3(0.);
  if (kind < 0.5) {                                   // cross leaf: one ink wash of mist and pine boughs across the pair
    float right = step(0.5, fract(idx * 0.5));
    float w = floor(idx * 0.5) * 2.37 + (1. - right) + vUv.x, pv = vUv.y;
    float m1 = vn3(vec3(w * 1.3, pv * 3.2, 1.)), m2 = vn3(vec3(w * 3.1, pv * 7., 5.));
    float wash = smoothstep(0.35, 0.75, m1 * 0.7 + m2 * 0.3) * smoothstep(0.05, 0.5, pv);
    float y0 = 0.6 + 0.14 * sin(w * 1.7 + 1.) + 0.06 * sin(w * 4.3);
    float tuft = smoothstep(0.45, 0.7, vn3(vec3(w * 7., pv * 11., 9.)));
    float ink = (1. - smoothstep(0., 0.13, abs(pv - y0))) * tuft;
    ink = max(ink, (1. - smoothstep(0.004, 0.012, abs(pv - y0 + 0.012 * sin(w * 23.)))) * 0.9);
    float hills = smoothstep(0.0, 0.05, 0.2 + 0.07 * sin(w * 2.9) + 0.04 * sin(w * 7.1 + 2.) - pv);
    paper *= 1. - 0.3 * wash - 0.22 * hills;
    paper = mix(paper, vec3(0.03, 0.04, 0.045), clamp(ink, 0., 1.) * 0.85);
    glow *= 0.9 + 0.2 * vn3(vec3(q * 0.4, 2.));
    glow *= 1. - 0.34 * leafShade(q * 0.8, idx + 7.) * smoothstep(2., 8., q.y);
    // round iron pull near the meeting edge, indigo tassel swinging from it
    vec2 pc = vec2(mix(0.95, 7.05, right), 5.4);
    float pr = length(q - pc);
    dark = max(dark, (1. - smoothstep(0.5, 0.5 + fw, pr)) * smoothstep(0.3 - fw, 0.3, pr));
    vec2 ta = pc - vec2(0., 0.5), tb = ta + vec2(sin(vI.z), -cos(vI.z)) * 2.1;
    float td = seg(q, ta, tb), along = clamp(dot(q - ta, tb - ta) / 4.41, 0., 1.);
    float tas = 1. - smoothstep(mix(0.05, 0.22, smoothstep(0.55, 0.8, along)) , mix(0.05, 0.22, smoothstep(0.55, 0.8, along)) + fw, td);
    extra = uTassel * tas; dark = max(dark, tas);
  } else {                                            // lattice paper: shoji panel or transom
    vec2 cell = kind < 1.5 ? vec2(sz.x / floor(sz.x / 1.05 + 0.5), 1.42) : vec2(sz.x / floor(sz.x / 0.8 + 0.5), 0.87);
    vec2 g = abs(fract(q / cell + 0.5) - 0.5) * cell;
    float lw = 0.055;
    float lat = 1. - smoothstep(lw, lw + fw, min(g.x, g.y));
    lat *= 1. - smoothstep(0.25, 0.7, fw);            // far away the lattice melts into a slightly darker paper
    dark = max(dark, lat);
    paper *= 1. - 0.18 * smoothstep(0.25, 0.7, fw);
    if (kind < 1.5) {
      dark = max(dark, 1. - smoothstep(2.3 - fw, 2.3 + fw, q.y));     // boarded foot
      glow *= 1. - 0.55 * leafShade(q, idx) * smoothstep(3., 9., q.y);            // wet leaves stirring behind the paper
      glow *= 0.82 + 0.18 * smoothstep(0., 14., q.y);
    } else glow *= 0.8;
  }
  glow *= 0.8 + 0.38 * vn3(vec3(q * 0.12 + idx * 1.3, uTime * 0.8));           // rain veils crossing the cloud
  vec3 col = paper * uSky * glow * (1. - dark) + vec3(0.004, 0.005, 0.005) * dark + extra * uSky;
  gl_FragColor = vec4(col, 1.);
}`;

// ---- mist: big soft sheets lying in the air over the pond, the moss and between the cedars
const MIST_VS = /* glsl */`
attribute vec4 aS;
varying vec2 vUv; varying vec4 vS; varying float vD;
void main(){
  vUv = uv; vS = aS;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vD = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
// aS = (seed, alpha, drift, grain along the sheet): grain < 0 for a sheet lying in the air, > 0 for a band standing between
// the cedar ranks (paler, long, sliding sideways)
const MIST_FS = /* glsl */`
uniform vec3 uMistCol, uSky, uSeam, uStrata; uniform float uTime, uAmt;
varying vec2 vUv; varying vec4 vS; varying float vD;
${NOISE}
void main(){
  float band = step(0., vS.w);
  vec2 q = vUv * vec2(abs(vS.w), 1.6) + vS.x;
  float n = vn3(vec3(q + vec2(uTime * 0.035 * vS.z, 0.), uTime * 0.03)) * 0.65 + vn3(vec3(q * 2.7 - vec2(uTime * 0.05, 0.), 3. + uTime * 0.02)) * 0.35;
  vec2 ew = mix(vec2(0.3), vec2(0.05, 0.36), band);
  vec2 e = smoothstep(vec2(0.), ew, vUv) * smoothstep(vec2(0.), ew, 1. - vUv);
  float a = e.x * e.y * smoothstep(mix(0.3, 0.27, band), mix(0.85, 0.68, band), n) * vS.y * uAmt * smoothstep(10., 45., vD);
  // the standing bands are the sky's low edge: blue-grey at the wall, opening above into the silver seam
  vec3 bc = mix(mix(uMistCol, uStrata, 0.5), mix(uMistCol, uSky, 0.55) * 1.04 + uSeam * 0.32, smoothstep(0.25, 0.8, vUv.y));
  gl_FragColor = vec4(mix(uMistCol * 1.04, bc, band), clamp(a, 0., 1.));
}`;
// ---- ring where a fish breaks the surface
const RING_FS = /* glsl */`
uniform vec3 uSky; uniform float uTime, uK, uSeed;
varying vec2 vUv;
void main(){
  float r = length(vUv - 0.5) * 2., a = 0., lw = 0.006 + fwidth(r) * 1.1;
  for (int i = 0; i < 3; i++) {
    float ph = fract(uTime * 0.33 + float(i) / 3. + uSeed);
    a += (1. - smoothstep(0., lw, abs(r - ph * 0.95))) * (1. - ph) * (1. - ph);
  }
  gl_FragColor = vec4(uSky * 1.1, clamp(a * 0.55 * uK * (1. - smoothstep(0.85, 1., r)), 0., 1.));
}`;
const RING_VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

// ---- tree frogs: small bright blobs that hop out and back (never the subject, only life)
const FROG_VS = /* glsl */`
attribute vec3 aC; attribute vec4 aH;
uniform float uTime;
varying vec3 vN;
void main(){
  float tt = uTime * aH.w + aH.z, k = floor(tt), t = fract(tt);
  float s = smoothstep(0., 1., clamp(t / 0.16, 0., 1.)), out1 = mod(k, 2.) < 0.5 ? 1. : 0.;
  float f = mix(1. - s, s, out1), arc = 4. * s * (1. - s), face = out1 * 2. - 1.;
  float ca = cos(aH.x), sa = sin(aH.x);
  vec3 p = vec3(position.x * face, position.y * (1. + 0.3 * arc), position.z * face);
  vec3 q = vec3(p.x * ca + p.z * sa, p.y, -p.x * sa + p.z * ca);
  vec3 nn = vec3(normal.x * face, normal.y, normal.z * face);
  vN = vec3(nn.x * ca + nn.z * sa, nn.y, -nn.x * sa + nn.z * ca);
  vec3 c = aC + vec3(sa, 0., ca) * (aH.y * f) + vec3(0., arc * aH.y * 0.45, 0.);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(c + q, 1.);
}`;
const FROG_FS = /* glsl */`
uniform vec3 uSky, uFrog; varying vec3 vN;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  gl_FragColor = vec4(uFrog * uSky * (0.3 + 0.9 * (n.y * 0.5 + 0.5)) + uSky * 0.12 * pow(max(n.y, 0.), 6.), 1.);
}`;

// flat-shaded copy (stone and carpentry want facets, not lathe smoothing)
function flat(g) { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); if (n !== g) g.dispose(); return n; }
const bell = (x) => Math.exp(-x * x);

export default {
  id: 'moss-rain-veranda',
  name: 'The Long Rain',
  category: 'interior',
  weirdness: 0.05,
  media: ['interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---------------------------------------------------------------- the look of this visit
    const lr = rng.fork('season'), la = lr(), lh = lr();
    const season = la < 0.27 ? 'february' : la > 0.78 ? 'november' : 'june';
    const hour = vary.hour && vary.hour !== 'any' ? vary.hour : (lh < 0.18 ? 'dawn' : lh > 0.9 ? 'golden' : 'day');
    const S = lr() < 0.5 ? -1 : 1;                                   // +1: hill and court on the camera's left
    const rainW = clamp(lr.range(0.75, 1.3) * (hour === 'golden' ? 0.5 : 1), 0.35, 1.4);
    lr.int(0, 2);
    const snow = season === 'february', nov = season === 'november';
    const rare = !!vary.rare;
    const castA = lr(), castB = lr();
    const wagtails = castA < 0.3, cape = snow || castB < 0.25;     // the cast: swallows or wagtails; the umbrella or a straw cape

    // ---------------------------------------------------------------- the path (local frame, then the world's)
    const PL = [[0, 7, Z_IN], [0, 7, -76], [0, 7, -56], [0, 6.7, -20], [0, 6.5, 14], [0, 6.5, 44], [0, 6.5, 57], [0, 6.3, 69],
      [-4 * S, 4.5, 85], [-9 * S, 2.7, 100], [-11 * S, 2.0, 116], [-6 * S, 2.1, 141], [-9 * S, 2.2, 166], [-22 * S, 2.1, 190], [-35 * S, 2.0, 213],
      [-40 * S, 2.1, 238], [-40 * S, 2.4, 290], [-40 * S, 2.6, 332], [-40 * S, 2.6, 392]];
    const lp = makePath(PL);
    await ctx.yield();
    const toW = (p) => [-p[0], p[1], -p[2] + Z_IN];
    const path = makePath(PL.map(toW));
    const W = (v) => V3(-v.x, v.y, -v.z + Z_IN);                     // local point -> world point
    const uOf = (x, z) => lp.nearestXZ(x, z).u;
    const pAt = (u) => lp.pointAt(clamp(u, 0, 1));
    const sideOf = (u) => { const t = lp.tangentAt(clamp(u, 0, 1)); return V3(t.z, 0, -t.x).normalize(); };   // unit vector to the camera's left (hill side when S = +1)
    await ctx.yield();

    const dyn = { frogs: [] };                                                  // geometry for the things that move, filled in extend()
    // where the great lantern and the deer-scarer stand: the lantern ahead of the bend, so that the path points at it for
    // forty metres before passing it; the scarer beyond, on the hill side of the first stepping stones
    const LAN = [-9 * S, 190], SCA = [-23.5 * S, 214.3], POOL = [SCA[0] - 4.8 * S, SCA[1]], OLD = [[-16 * S, 161], [-24.5 * S, 176]];

    // ================================================================ static geometry, added into the hero's batches
    const extend = async (k) => {
      const { K, M, C, mixC, chamferBox: cb, box, lathe, limb, bo, ga, gb, spray, fall, hillAt, pondM, jit, pal } = k;
      let kr = k.rng;                                                 // let: the last pass of all deals from a stream of its own
      const keep = [], leafAt = [];                                   // where the small things stand, so that nothing dealt later buries them
      const col = k.colors, T = col.timber, TB = col.timberB, TD = col.timberD;
      const X = (x) => x * S;
      const earth = C('#76735f'), bamboo = C('#6d7650'), wallC = C('#6a5e4b'), lstone = C('#6c726b'), rope = C('#0c0d0c'), fernC = mixC(pal[3], pal[4], 0.55);
      const accentC = () => (nov ? C('#6d6c58') : mixC(col.accent, kr() < 0.5 ? C('#8ea4ea') : C('#6c62c4'), kr() * 0.6));
      // moss cushions, hydrangeas and stones come from the hero's kit (they also shade the ground they sit on)
      const dome = k.dome, mossC = k.mossC, rockG = k.rockGeo, hyd = (x, z, r, y0) => { keep.push([x, z, r]); k.hydrangea(x, z, r, y0); };
      // fern: a fan of arching, saw-edged fronds
      const fern = (x, z, r, y0, nf = 7, ns = 5) => {
        if (y0 == null) y0 = hillAt(x, z) - 0.1;
        keep.push([x, z, r * 0.6]);
        const pos = [], a0 = kr() * 6.28;
        for (let f = 0; f < nf; f++) {
          const an = a0 + (f / nf) * 6.28 + kr.range(-0.2, 0.2), L = r * kr.range(0.75, 1.15), ca = Math.cos(an), sa = Math.sin(an);
          let pl = null, pr = null;
          for (let s = 0; s <= ns; s++) {
            const t = s / ns, d = L * t, h = L * (0.75 * Math.sin(t * 2.2) - 0.25 * t * t), w = L * 0.17 * Math.sin(Math.min(1, t * 1.15 + 0.12) * PI) * (s % 2 ? 1 : 0.55);
            const cx = x + ca * d, cz = z + sa * d, l = [cx - sa * w, y0 + h, cz + ca * w], rr = [cx + sa * w, y0 + h, cz - ca * w];
            if (pl) pos.push(...pl, ...pr, ...rr, ...pl, ...rr, ...l);
            pl = l; pr = rr;
          }
        }
        const g = k.soup(pos);
        gb.add(g, null, fernC, [K.FROND, 0.35, 1, 0.05], { jit: jit(0.7, 1.25), grad: [y0, y0 + r * 0.6, 0.4, 1.15] });
      };
      const maple = async (...a) => { keep.push([a[0], a[1], 2.5]); k.mapleAt(...a); await ctx.yield(); };

      // a stone lantern (14 m at scale 1): hexagonal foot, shaft, fire-box with a flame behind its paper windows, roof
      // with upturned corners, jewel. The flame is the one warm thing out in the rain.
      const flameC = C('#ff9a3a').multiplyScalar(0.8), lst = [K.STONE, 0.8, 1];
      const lantern = (batch, LX, LY, LZ, sc, drips) => {
        const mm = (dx, dy, dz, rx = 0, ry = 0, rz = 0) => M(LX + dx * sc, LY + dy * sc, LZ + dz * sc, rx, ry, rz, sc, sc, sc);
        const st = (g, o) => batch.add(g, mm(0, 0, 0, 0, 0.26, 0), lstone, lst, o || { jit: jit(0.85, 1.2) });
        st(flat(lathe([[0, 0], [2.7, 0], [2.9, 0.5], [2.5, 1.2], [1.7, 1.5], [0, 1.5]], 6)));
        st(lathe([[0, 1.3], [1.08, 1.3], [0.92, 1.8], [0.9, 4.1], [1.06, 4.3], [1.06, 4.8], [0.9, 5], [0.9, 6.9], [1.25, 7.2], [0, 7.2]], 14));
        st(flat(lathe([[0, 7.1], [1.3, 7.1], [2.5, 7.9], [2.65, 8.35], [2.35, 8.5], [0, 8.5]], 6)));
        st(flat(lathe([[0, 8.45], [1.75, 8.45], [1.75, 10.6], [0, 10.6]], 6)), { jit: 0.9 });
        st(flat(lathe([[0, 10.5], [3.5, 10.45], [3.75, 10.75], [2.3, 11.45], [1.0, 12.25], [0.5, 12.5], [0, 12.5]], 6)), { jit: 1.1 });
        st(lathe([[0, 12.4], [0.5, 12.4], [0.78, 12.9], [0.62, 13.4], [0.26, 13.8], [0, 14]], 10));
        for (let f = 0; f < 6; f++) {
          const a = PI / 6 + f * PI / 3 + 0.26, ap = 1.53;
          if (f % 3 === 2) batch.add(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12), mm(Math.sin(a) * ap, 9.55, Math.cos(a) * ap, PI / 2, a, 0), flameC, [K.FLAME, 0, 1]);    // sun and moon faces
          else {
            batch.add(box(1.0, 1.35, 0.1), mm(Math.sin(a) * ap, 9.5, Math.cos(a) * ap, 0, a, 0), flameC, [K.FLAME, 0, 1]);                                        // the lit fire-box
            batch.add(box(1.06, 0.1, 0.16), mm(Math.sin(a) * ap, 9.5, Math.cos(a) * ap, 0, a, 0), lstone, lst, { jit: 0.7 });
            batch.add(box(0.1, 1.4, 0.16), mm(Math.sin(a) * ap, 9.5, Math.cos(a) * ap, 0, a, 0), lstone, lst, { jit: 0.7 });
          }
          const ca = f * PI / 3 + 0.26;
          batch.add(cb(0.75, 0.6, 1.5, 0.18), mm(Math.sin(ca) * 3.5, 10.95, Math.cos(ca) * 3.5, 0, ca, 0), lstone, lst, { jit: 1.15 });                           // upturned roof corners
          if (drips && !snow) for (let j = 0; j < 2; j++) fall(LX + Math.sin(ca) * 3.9 * sc, LY + 10.7 * sc, LZ + Math.cos(ca) * 3.9 * sc, 10.9 * sc, kr.range(0.34, 0.5), kr(), 0.15, 0.4, 0.9, 1);
        }
      };
      // purple iris: a clump of sword blades and, in June, two or three flowers standing over them
      const irisC = mixC(pal[3], pal[4], 0.35), irisF = [C('#5a2ec9'), C('#7d55e8'), C('#8b3fd2')];
      const iris = (x, z, y0 = hillAt(x, z) - 0.25, nb = 8) => {
        keep.push([x, z, 1.2]);
        const pos = [];
        for (let b = 0; b < nb; b++) {
          const an = kr() * 6.28, h = kr.range(2.3, 3.9), bx = x + Math.cos(an) * 0.6, bz = z + Math.sin(an) * 0.6, tx = bx + Math.cos(an) * h * 0.28, tz = bz + Math.sin(an) * h * 0.28, ox = -Math.sin(an) * 0.2, oz = Math.cos(an) * 0.2;
          pos.push(bx - ox, y0, bz - oz, bx + ox, y0, bz + oz, tx, y0 + h, tz);
        }
        const g = k.soup(pos);
        gb.add(g, null, irisC, [K.CLOTH, 0.5, 1, 0.09], { jit: jit(0.9, 1.4), grad: [y0, y0 + 3, 0.6, 1.3] });
        if (snow || nov) return;
        for (let f = 0, nf = kr.int(2, 3); f < nf; f++) {
          const an = kr() * 6.28, d = kr.range(0.2, 0.9), fx = x + Math.cos(an) * d, fz = z + Math.sin(an) * d, fy = y0 + kr.range(3.1, 4.2), sz = kr.range(0.55, 0.8), a0 = kr() * 6.28, fp = [], sp = [];
          sp.push(fx - 0.07, y0, fz, fx + 0.07, y0, fz, fx, fy, fz);
          for (let j = 0; j < 3; j++) {
            const a = a0 + j * 2.094, ca = Math.cos(a), sa = Math.sin(a), mx = fx + ca * 0.45 * sz, mz = fz + sa * 0.45 * sz, my = fy + 0.14 * sz;
            fp.push(fx, fy, fz, mx - sa * 0.34 * sz, my, mz + ca * 0.34 * sz, mx + sa * 0.34 * sz, my, mz - ca * 0.34 * sz);                         // the falls: out, then drooping
            fp.push(mx - sa * 0.34 * sz, my, mz + ca * 0.34 * sz, fx + ca * 0.95 * sz, fy - 0.5 * sz, fz + sa * 0.95 * sz, mx + sa * 0.34 * sz, my, mz - ca * 0.34 * sz);
            const b = a + 1.047, cb2 = Math.cos(b), sb = Math.sin(b);
            sp.push(fx - sb * 0.17 * sz, fy, fz + cb2 * 0.17 * sz, fx + sb * 0.17 * sz, fy, fz - cb2 * 0.17 * sz, fx + cb2 * 0.26 * sz, fy + 0.85 * sz, fz + sb * 0.26 * sz);   // the standards
          }
          const gf = k.soup(fp);
          gb.add(gf, null, irisF[f % 3], [K.CLOTH, 0.3, 1, 0.07], { jit: jit(0.9, 1.25), grad: [fy - 0.5 * sz, fy + 0.15 * sz, 1.5, 0.85] });
          const gs = k.soup(sp);
          gb.add(gs, null, irisF[1], [K.CLOTH, 0.3, 1, 0.07], { jit: 1.15, grad: [y0, fy, 0.22, 1.2] });
        }
      };

      // ---------------------------------------------------------------- THE GALLERY (z -114 .. -57): a roofed bridge, 20 m wide and open at
      // both sides, over two moss courts to the back of the hall, whose three centre bays stand open
      const GZ0 = -114, GZ1 = -57.2, GL = GZ1 - GZ0, GM = (GZ0 + GZ1) / 2, ceilC = C('#6e563a');
      bo.add(box(21, 0.1, GL), M(0, -0.3, GM), TB, [K.WOODZ, 0.3, 0.25], { jit: 0.55 });
      for (let i = 0; i < 13; i++) bo.add(cb(1.56, 0.44, GL, 0.025), M(-9.36 + i * 1.56, -0.22, GM), TB, [K.WOODZ, 0.62, 0.3], { jit: jit(0.7, 1.35) });     // a board on the axis: no seam down the middle of the picture
      bo.add(box(27.4, 0.3, GL), M(0, 18.3, GM), ceilC, [K.WOODX, 0.2, 0.3]);
      for (let z = GZ0 + 1.6; z < GZ1; z += 2.5) bo.add(cb(27, 0.8, 0.6, 0.1), M(0, 17.72, z), T, [K.WOODX, 0.5, 0.35], { jit: jit(0.85, 1.15) });
      for (const x of [-4, 4]) bo.add(cb(0.7, 0.7, GL, 0.1), M(x, 17.0, GM), T, [K.WOODZ, 0.5, 0.3]);
      await ctx.yield();
      for (const sx of [-1, 1]) {
        bo.add(cb(1.1, 1.3, GL, 0.14), M(sx * 10, 16.7, GM), T, [K.WOODZ, 0.6, 0.4]);                        // plate over the posts
        bo.add(cb(0.5, 1.1, GL, 0.1), M(sx * 13.5, 17.9, GM), T, [K.WOODZ, 0.5, 0.6]);                       // fascia at the eave
        bo.add(cb(0.7, 0.55, GL, 0.1), M(sx * 10.05, 0.27, GM), T, [K.WOODZ, 0.7, 0.45]);                    // sill, and a low rail on slim balusters
        bo.add(cb(0.4, 0.4, GL, 0.08), M(sx * 10.05, 2.7, GM), T, [K.WOODZ, 0.8, 0.5], { jit: 1.15 });
        bo.add(cb(0.26, 0.26, GL, 0.05), M(sx * 10.05, 1.5, GM), T, [K.WOODZ, 0.7, 0.5]);
        bo.add(box(0.3, 1.1, GL), M(sx * 10.3, -0.85, GM), TD, [K.WOODZ, 0.3, 0.6]);
        for (let z = GZ0 + 2; z < GZ1; z += 10) {
          bo.add(cb(1.3, 23.2, 1.3, 0.16), M(sx * 10, 6.0, z), T, [K.WOODY, 0.7, 0.45], { jit: jit(0.88, 1.15) });
          bo.add(cb(3.4, 0.7, 1.0, 0.14), M(sx * 10, 15.75, z), T, [K.WOODX, 0.6, 0.4], { jit: 1.1 });
          bo.add(cb(1.0, 0.7, 3.4, 0.14), M(sx * 10, 15.05, z), T, [K.WOODZ, 0.6, 0.4], { jit: 1.1 });
          bo.add(cb(1.56, 0.3, 1.56, 0.06), M(sx * 10, 0.62, z), col.bronze, [K.METAL, 0.6, 0.5]);
          gb.add(rockG(1.6, 1.0, 10, 0.8), M(sx * 10, GY - 0.3, z), col.stone, [K.STONE, 0.5, 1], { jit: jit(0.8, 1.2) });
          for (let j = 1; j < 4; j++) if (z + j * 2.5 < GZ1 - 1) bo.add(cb(0.2, 2.5, 0.2, 0.04), M(sx * 10.05, 1.45, z + j * 2.5), T, [K.WOODY, 0.6, 0.5]);
        }
        // drips off the gallery's eave on both sides
        for (let z = GZ0 + 2; z < GZ1 - 10; z += 2.7) for (let j = 0; j < (snow ? 1 : 2); j++) fall(sx * 13.6 + kr.range(-0.1, 0.1), 17.3, z, 22.3, kr.range(0.3, 0.55), kr(), 0.16, 0.42, kr.range(0.6, 1), snow ? 2 : 1);
        await ctx.yield();
      }
      // bronze lanterns hung from the gallery's beams, each with a red paper tag turning under it
      const hang = [];
      for (const [hx, hz] of [[7.3, -74], [-7.3, -74], [7.3, -94], [-7.3, -94]]) {
        const y = 12.2, br = col.bronze, sw = 0.11;
        bo.add(box(0.1, 4.6, 0.1), M(hx, y + 4.1, hz), br, [K.METAL, 0.4, 0.4, sw * 0.4]);
        bo.add(flat(lathe([[0, 1.9], [0.25, 1.85], [0.5, 1.5], [1.25, 1.1], [1.42, 0.92], [1.2, 0.92], [0, 0.98]], 6)), M(hx, y, hz), br, [K.METAL, 0.65, 0.4, sw], { jit: 1.3 });
        bo.add(new THREE.CylinderGeometry(0.78, 0.78, 1.72, 6, 1, true), M(hx, y + 0.08, hz), flameC, [K.FLAME, 0, 0.4, sw]);
        for (let j = 0; j < 6; j++) { const a = j * PI / 3 + PI / 6; bo.add(box(0.13, 1.8, 0.13), M(hx + Math.cos(a) * 0.8, y + 0.08, hz + Math.sin(a) * 0.8), br, [K.METAL, 0.6, 0.4, sw]); }
        bo.add(flat(lathe([[0, -1.0], [0.3, -0.98], [0.95, -0.8], [0.95, -0.7], [0, -0.7]], 6)), M(hx, y, hz), br, [K.METAL, 0.65, 0.4, sw], { jit: 1.2 });
        bo.add(box(0.5, 1.6, 0.04), M(hx, y - 2.0, hz, 0, 0.5 + hx, 0), C('#c22f17'), [K.CLOTH, 0.1, 0.5, sw * 2.2]);
        hang.push([hx, y, hz]);
      }
      dyn.hang = hang;
      await ctx.yield();

      // ---------------------------------------------------------------- THE COURTS either side of the gallery: moss, maples, hydrangeas, a lit lantern, rain
      for (const cs of [S, -S]) {
        const cx = (a) => a * cs, hillSide = cs === S;
        gb.add(box(2, 24, 66), M(cx(41), GY + 12, -89), earth, [K.PLASTER, 0.05, 1], { grad: [GY, GY + 24, 0.75, 1] });
        gb.add(cb(5.5, 1.8, 67, 0.5), M(cx(41), GY + 24.9, -89), col.tileC, [K.METAL, 0.6, 1]);
        for (let j = 0; j < 9; j++) gb.add(cb(0.9, 23.6, 0.9, 0.12), M(cx(39.7), GY + 11.8, -121.5 + j * 8.1), T, [K.WOODY, 0.5, 1], { jit: jit(0.85, 1.2) });      // the wall is framed in timber, a rail at two heights
        for (const y of [GY + 7.5, GY + 17]) gb.add(cb(0.6, 0.8, 66, 0.1), M(cx(39.75), y, -89), T, [K.WOODZ, 0.5, 1]);
        for (let i = 0; i < 26; i++) dome(gb, cx(kr.range(13, 38)), kr.range(-120, -60), 1.5 + Math.pow(kr(), 2) * 5.5, kr.range(0.5, 0.78), mossC(), 1, GY - 0.4);
        for (let i = 0; i < 3; i++) dome(gb, cx(kr.range(29, 36)), -112 + i * 22 + kr.range(-4, 4), kr.range(8, 11), 0.62, mossC(), 1, GY - 1);
        await ctx.yield();
        await maple(cx(hillSide ? 23 : 26), hillSide ? -70 : -73, hillSide ? 27 : 23, V3(-0.3 * cs, 0, hillSide ? -0.1 : 0.1), GY - 0.5, hillSide ? null : 'red');
        await maple(cx(hillSide ? 27 : 22), hillSide ? -100 : -103, hillSide ? 24 : 28, V3(-0.2 * cs, 0, 0.15), GY - 0.5, hillSide ? 'red' : null);
        for (let i = 0; i < 5; i++) hyd(cx(kr.range(15.5, 20)), -112 + i * 11.5 + kr.range(-2.5, 2.5), kr.range(2.6, 3.5), GY - 0.3);
        await ctx.yield();
        for (let i = 0; i < 7; i++) fern(cx(kr.range(13.5, 32)), kr.range(-116, -61), kr.range(2, 3.2), GY - 0.1);
        for (let i = 0; i < 2; i++) gb.add(rockG(kr.range(2.5, 4), kr.range(2, 3.4), 11, 0.4), M(cx(kr.range(24, 33)), GY - 0.5, -104 + i * 30 + kr.range(-4, 4), 0.1, kr() * 6.28, 0.1), col.stone, [K.STONE, 0.5, 1], { jit: jit(0.8, 1.2) });
        const lz = hillSide ? -66 : -84, lx2 = cx(hillSide ? 18.5 : 24);
        lantern(gb, lx2, GY - 0.3, lz, 0.8, true);
        dome(gb, lx2 + 0.2, lz - 0.1, 1.9, 0.42, mossC(), 1, GY - 0.3 + 8.95);
        for (let j = 0; j < 5; j++) { const an = j * 1.26 + kr() * 0.4; dome(gb, lx2 + Math.cos(an) * 3.4, lz + Math.sin(an) * 3.4, kr.range(1.1, 1.8), kr.range(0.5, 0.8), mossC(), 1, GY - 0.5); }
        iris(lx2 + cx(-3.5), lz + 3.5, GY - 0.3); iris(lx2 + cx(2.5), lz - 4, GY - 0.3, 6);
        if (hillSide) dyn.courtLamp = V3(lx2, GY - 0.3 + 7.6, lz);
        await ctx.yield();
        for (let i = 0; i < Math.round(95 * rainW * detail); i++) {
          const fx = cx(kr.range(14, 40)), fz = kr.range(-120, -58);
          if (snow) { const fs = kr.range(0.4, 0.75); fall(fx, 30, fz, 35, kr.range(0.07, 0.11), kr(), fs, fs, kr.range(0.8, 1), 2); } else fall(fx, 34, fz, 39, kr.range(0.34, 0.46), kr(), 0.07, kr.range(3.5, 6), kr.range(0.5, 1), 0);
        }
        for (let i = 0; i < 5; i++) { await ctx.yield(); k.cedarAt(cx(kr.range(56, 74)), -116 + i * 14 + kr.range(-4, 4), 1, gb, { h: kr.range(70, 104), mist: -0.4 }); }
        await ctx.yield();
      }

      // ---------------------------------------------------------------- THE GARDEN
      // maples beyond the gutter row: one leans over the axis so its crown is the green seen down the corridor
      await maple(X(15), 204, 46, V3(-0.3 * S, 0, -0.08));
      await maple(X(6), 186, 36, V3(-0.12 * S, 0, -0.2));              // these two fill the gap seen from the door with leaf
      await maple(X(5), 228, 24, V3(-0.05 * S, 0, -0.25), undefined, 'red');
      await maple(X(50), 152, 38, V3(-0.15 * S, 0, -0.2));
      await maple(X(74), 236, 43, V3(-0.1 * S, 0, -0.1));
      await maple(X(24), 302, 40, V3(-0.2 * S, 0, 0.1));
      await maple(X(-6), 352, 34, V3(0.12 * S, 0, -0.1), undefined, 'red');
      await maple(X(-150), 150, 40, V3(0.2 * S, 0, -0.1));
      // THE QUILT: cushions crowd the camera's way so thickly that no bare ground is left between them near the path;
      // each is sunk a third and overlaps its neighbours, sizes from under 2 m to 14 m, and the big ones carry a litter
      // of small ones round their rims
      const nMoss = Math.round(3000 * detail * (0.7 + 0.3 * dens));      // the quilt is whole on every visit
      const inTea = (x, z) => Math.abs(x - X(-40)) < 38 && z > 383, nul = k.makeBatch();
      for (let i = 0; i < nMoss; i++) {
        if ((i & 15) === 0) await ctx.yield();
        const u = kr.range(0.3, 1.0), p = pAt(u), sd = sideOf(u);
        const lat = (kr() < 0.5 ? -1 : 1) * Math.pow(kr(), 1.7) * 74, x = p.x + sd.x * lat + kr.range(-3, 3), z = p.z + sd.z * lat + kr.range(-3, 3);
        const r = 0.8 + Math.pow(kr(), 2.8) * 6.4;
        if (z < 77 || z > 424 || Math.abs(x) > 204 || pondM(x, z) > 0.1 || inTea(x, z)) continue;
        const d = lp.nearestXZ(x, z).dist;
        if (d < (r - 2.1) * 2.3 || (z > 200 && d < 3.2 + r) || Math.hypot(x - X(-29.5), z - 352) < r + 3 || Math.hypot(x - X(-16), z - 161) < r + 2.5 || Math.hypot(x - X(-24.5), z - 176) < r + 3) continue;
        const lod = d < 23 ? 2 : d < 58 ? 1 : 0;
        // a cushion that would stand where the lantern, the scarer or its pool now are is cut into a batch that is thrown
        // away, so that the rest of the quilt falls exactly as it did
        const free = (qx, qz, qr) => Math.hypot(qx - LAN[0], qz - LAN[1]) > qr + 3 && Math.hypot(qx - SCA[0], qz - SCA[1]) > qr + 2.6 && Math.hypot(qx - POOL[0], qz - POOL[1]) > qr + 3;
        const ok = free(x, z, r);
        dome(ok ? gb : nul, x, z, r, kr.range(0.5, 0.85), mossC(), lod, ok ? null : 0);
        if (r > 2.8 && lod > 0) for (let j = kr.int(2, 4); j > 0; j--) {
          const an = kr() * 6.28, rr = r * kr.range(0.28, 0.5), sx = x + Math.cos(an) * r * 0.95, sz = z + Math.sin(an) * r * 0.95;
          if (pondM(sx, sz) < 0.1 && sz > 77 && !inTea(sx, sz) && lp.nearestXZ(sx, sz).dist > (sz > 200 ? 3.2 + rr : (rr - 2.1) * 2.3) && Math.hypot(sx - X(-16), sz - 161) > rr + 2.5) { const ok2 = free(sx, sz, rr); dome(ok2 ? gb : nul, sx, sz, rr, kr.range(0.55, 0.9), mossC(), lod - 1, ok2 ? null : 0); }
        }
      }
      await ctx.yield();
      // garden rocks, each with its ferns
      const rocks = [];
      for (let i = 0; i < 22; i++) {
        if ((i & 7) === 0) await ctx.yield();
        const u = kr.range(0.36, 0.975), p = pAt(u), sd = sideOf(u), lat0 = (i % 3 ? S : -S) * kr.range(10, 19), lat = lat0 + Math.sign(lat0) * 9 * (1 - smoothstep(0.47, 0.52, u)), x = p.x + sd.x * lat, z = p.z + sd.z * lat, r = kr.range(1.4, 3.4);
        if (pondM(x, z) > 0.05 || inTea(x, z) || lp.nearestXZ(x, z).dist < 8 + r || Math.hypot(x - X(-16), z - 161) < r + 5 || Math.hypot(x - LAN[0], z - LAN[1]) < r + 6 || Math.hypot(x - SCA[0], z - SCA[1]) < r + 7 || Math.hypot(x - POOL[0], z - POOL[1]) < r + 4) continue;
        gb.add(rockG(r, r * kr.range(0.8, 1.5), 11, 0.38), M(x, hillAt(x, z) - 0.6, z, kr.range(-0.15, 0.15), kr() * 6.28, kr.range(-0.15, 0.15), 1, 1, kr.range(0.7, 1.1)), col.stone, [K.STONE, 0.5, 1], { jit: jit(0.75, 1.25) });
        rocks.push([x, z, r]); k.shade(x, z, r * 0.9, 0.7);
      }
      await ctx.yield();
      for (const [x, z, r] of rocks) for (let j = 0; j < 2; j++) { const an = kr() * 6.28, fx = x + Math.cos(an) * (r + 1.4), fz = z + Math.sin(an) * (r + 1.4); if (lp.nearestXZ(fx, fz).dist > 9.5) fern(fx, fz, kr.range(1.8, 2.8)); }
      for (let i = 0; i < Math.round(60 * detail); i++) {
        if ((i & 15) === 0) await ctx.yield();
        const u = kr.range(0.35, 0.99), p = pAt(u), sd = sideOf(u), lat = (kr() < 0.7 ? S : -S) * kr.range(9.5, 22), x = p.x + sd.x * lat, z = p.z + sd.z * lat;
        if (pondM(x, z) > 0.05 || inTea(x, z) || lp.nearestXZ(x, z).dist < 9.5) continue;
        fern(x, z, kr.range(1.6, 2.9));
      }
      await ctx.yield();

      // ---- the stone lantern, 14 m tall, under the maples ahead of the bend: the path points at it for forty metres, then
      // passes it 11 m off on the pond side (the close pass)
      const LX = LAN[0], LZ = LAN[1], LY = hillAt(LX, LZ) - 0.3;
      dyn.lantern = V3(LX, LY, LZ); k.shade(LX, LZ, 2.8, 0.8);
      {
        lantern(ga, LX, LY, LZ, 1, true);
        dome(ga, LX + 0.3, LZ - 0.2, 2.3, 0.42, mossC(), 2, LY + 11.25);                                                                  // moss cap
        dome(gb, LX + X(1.2), LZ - 1.6, 1.5, 0.5, mossC(), 2, LY + 1.0);
        for (let j = 0; j < 11; j++) { const an = j * 0.571 + kr() * 0.3, rd = 3.3 + kr() * 1.6; dome(gb, LX + Math.cos(an) * rd, LZ + Math.sin(an) * rd, kr.range(1.0, 1.9), kr.range(0.5, 0.8), mossC(), 2); }   // cushions crowd its foot
        // the snail on the platform's rim, on the side the camera passes
        const sa = Math.atan2(-0.55 * S, -1), sx = LX + Math.sin(sa) * 2.2, sz = LZ + Math.cos(sa) * 2.2;
        const shell = C('#5a4f36'), ta = sa + PI / 2, tx = Math.sin(ta), tz = Math.cos(ta);               // crawling along the rim
        ga.add(new THREE.SphereGeometry(0.34, 10, 8), M(sx, LY + 8.8, sz, 0, sa, 0, 1, 1, 0.55), shell, [K.CLOTH, 0.5, 1], { jit: 1.1 });
        ga.add(new THREE.TorusGeometry(0.2, 0.07, 6, 14), M(sx + Math.sin(sa) * 0.17, LY + 8.8, sz + Math.cos(sa) * 0.17, 0, sa, 0), shell.clone().multiplyScalar(1.7), [K.CLOTH, 0.5, 1]);
        ga.add(new THREE.SphereGeometry(0.09, 6, 5), M(sx + Math.sin(sa) * 0.2, LY + 8.8, sz + Math.cos(sa) * 0.2), shell.clone().multiplyScalar(0.5), [K.CLOTH, 0.5, 1]);
        ga.add(new THREE.SphereGeometry(0.15, 8, 5), M(sx + tx * 0.12, LY + 8.56, sz + tz * 0.12, 0, ta, 0, 0.8, 0.55, 3.6), C('#77806e'), [K.CLOTH, 0.9, 1]);
        for (const e of [-1, 1]) limb(ga, V3(sx + tx * 0.58, LY + 8.6, sz + tz * 0.58), V3(sx + tx * 0.78 + Math.sin(sa) * 0.08 * e, LY + 8.92, sz + tz * 0.78 + Math.cos(sa) * 0.08 * e), 0.03, 0.025, 4, C('#77806e'), [K.CLOTH, 0.9, 1]);
        for (let j = 0; j < 5; j++) { const an = j * 1.3 + 0.4; fern(LX + Math.cos(an) * 4.2, LZ + Math.sin(an) * 4.2, kr.range(2, 3)); }
        hyd(LX + X(8), LZ + 4, 3.1); hyd(LX + X(9.5), LZ - 7, 2.7);
        iris(LX + X(4.6), LZ + 5.2); iris(LX + X(-5.2), LZ - 5.5); iris(LX + X(-5.5), LZ + 6.5, undefined, 6);
      }
      await ctx.yield();

      // ---- the deer-scarer: posts, axle, knock stone, spout and pool (the tube itself moves: dyn.scarer). It stands across
      // our way, so that we see the whole tube from the side as it tips: R(across, along) turns its own frame (mouth at -along,
      // toward the path) into the garden's
      const SX = SCA[0], SZ = SCA[1], SY = hillAt(SX, SZ), psi = S * PI / 2, R = (dx, dz) => [SX + dz * S, SZ - dx * S];
      {
        for (const dx of [-0.75, 0.75]) {
          const [qx, qz] = R(dx, 0);
          limb(gb, V3(qx, SY - 0.4, qz), V3(qx, SY + 4.3, qz), 0.3, 0.27, 8, bamboo, [K.WOODY, 0.75, 1], { jit: jit(0.9, 1.15) });
          gb.add(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 8), M(qx, SY + 2.2, qz), bamboo, [K.WOODY, 0.6, 1], { jit: 0.8 });
        }
        gb.add(new THREE.CylinderGeometry(0.14, 0.14, 2.2, 6), M(SX, SY + 3.5, SZ, 0, psi, PI / 2), rope, [K.CLOTH, 0.3, 1]);
        const [kx, kz] = R(0, 3.3), [px, pz] = R(-3.4 * S, -4.3), [ex, ez] = R(-2.9 * S, -4.3), [fx, fz] = R(0, -4.3), [wx, wz] = R(0, -4.8);
        gb.add(rockG(1.5, 1.5, 11, 0.6), M(kx, Math.min(SY, hillAt(kx, kz)) - 0.3, kz, 0, 1, 0), col.stone, [K.STONE, 0.6, 1], { jit: 1.1 });
        limb(gb, V3(px, SY - 0.9, pz), V3(px, SY + 7.2, pz), 0.34, 0.3, 8, bamboo, [K.WOODY, 0.75, 1]);              // the spout's post, on the far side of the tube
        limb(gb, V3(ex, SY + 6.6, ez), V3(fx, SY + 6.1, fz), 0.22, 0.2, 7, bamboo, [K.WOODY, 0.75, 1], { jit: 1.1 });
        gb.add(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8), M(px, SY + 6.6, pz), rope, [K.CLOTH, 0.3, 1]);
        gb.add(new THREE.CylinderGeometry(0.075, 0.09, 1.1, 6, 1, true), M(fx, SY + 5.5, fz), col.pearl, [K.FLOW, 1, 0.9]);
        for (let j = 0; j < 3; j++) fall(fx, SY + 6, fz, 1.2, kr.range(1.0, 1.4), kr(), 0.13, 0.3, 0.9, 1);
        const wy = Math.min(SY, hillAt(wx, wz)) + 0.2;
        const wg = new THREE.CircleGeometry(2.1, 14); wg.rotateX(-PI / 2); gb.add(wg, M(wx, wy, wz), pal[1], [K.WATER, 1, 1]);
        for (let j = 0; j < 9; j++) { const an = j / 9 * 6.28; gb.add(rockG(kr.range(0.5, 0.85), 0.6, 8, 0.5), M(wx + Math.cos(an) * 2.3, wy - 0.3, wz + Math.sin(an) * 2.3, 0, kr() * 6, 0), col.stone, [K.STONE, 0.6, 1], { jit: jit(0.7, 1.3) }); }
        k.shade(wx, wz, 2.6, 0.9);
        { const [a1, b1] = R(-2.6 * S, -7.6), [a2, b2] = R(-3 * S, 1.5), [a3, b3] = R(1.5 * S, 5.5); fern(a1, b1, 2.4); fern(a2, b2, 2.2); fern(a3, b3, 2); }
        { const [a1, b1] = R(-4.2 * S, -2.5), [a2, b2] = R(3.4 * S, -6.4); iris(a1, b1); iris(a2, b2, undefined, 6); }
        // the tube: pivot at the origin, mouth toward -z
        const tb = k.makeBatch(), bs = [K.WOODY, 0.8, 1];
        tb.add(new THREE.CylinderGeometry(0.44, 0.44, 8, 12, 1, true), M(0, 0, -0.64, PI / 2, 0, 0), bamboo, bs, { jit: 1.1 });
        for (const z of [-3.6, -1.5, 0.6, 2.6]) tb.add(new THREE.CylinderGeometry(0.5, 0.5, 0.14, 12), M(0, 0, z, PI / 2, 0, 0), bamboo, bs, { jit: 0.8 });
        tb.add(new THREE.CircleGeometry(0.4, 12), M(0, 0, -4.5, 0, PI, 0), C('#050605'), [K.CLOTH, 0, 1]);
        tb.add(new THREE.CircleGeometry(0.44, 12), M(0, 0, 3.36), bamboo, bs, { jit: 0.7 });
        tb.add(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 8), M(0, 0, 0, PI / 2, 0, 0), rope, [K.CLOTH, 0.3, 1]);
        dyn.scarer = { geo: tb.build(), pivot: V3(SX, SY + 3.5, SZ), psi };
        const sb = k.makeBatch();
        sb.add(new THREE.CylinderGeometry(0.2, 0.06, 2.2, 7, 1, true), M(0, -0.22, -5.5, PI / 2 - 0.25, 0, 0), col.pearl, [K.FLOW, 1, 0.9]);
        dyn.spill = sb.build();
      }
      await ctx.yield();

      // ---- stepping stones along the pond's edge, under the camera all the way to the window
      {
        let d0 = 0; for (let d = 0; d < lp.length; d += 2) if (lp.posAtDist(d).z > 205) { d0 = d; break; }
        for (let d = d0; d < lp.length - 5; d += 6.7) {
          const p = lp.posAtDist(d), x = p.x + kr.range(-0.6, 0.6), z = p.z, r = kr.range(1.9, 2.3), h = 1.9;
          const top = Math.max(hillAt(x, z) + 0.45, GY + 0.1);
          gb.add(rockG(r, h, 16, 0.7), M(x, top - h, z, 0, kr() * 6.28, 0, 1, 1, kr.range(0.8, 1)), col.stone, [K.STONE, 0.65, 1], { jit: jit(0.8, 1.25) });
          if (kr() < 0.45) dyn.frogs.push([x + kr.range(-0.4, 0.4), top + 0.05, z + kr.range(-0.4, 0.4)]);
        }
        for (const [x, z, r] of rocks) if (kr() < 0.6) { const an = kr() * 6.28; dyn.frogs.push([x + Math.cos(an) * (r + 1), hillAt(x + Math.cos(an) * (r + 1), z + Math.sin(an) * (r + 1)) + 0.1, z + Math.sin(an) * (r + 1)]); }
        for (let i = 0; i < 26; i++) { const u = kr.range(0.36, 0.975), p = pAt(u), sd = sideOf(u), lat = (kr() < 0.5 ? -1 : 1) * kr.range(7.5, 13), x = p.x + sd.x * lat, z = p.z + sd.z * lat; if (pondM(x, z) < 0.25) dyn.frogs.push([x, hillAt(x, z) + 0.12, z]); }
      }
      await ctx.yield();

      // ---- the ancient pine: leaning trunk on the shore, one trained limb 130 m out over the stepping stones
      const lx = (z) => X(-40 + 1.3 * Math.sin(z * 0.045 + 1)), ly = (z) => 15.4 + 0.8 * Math.sin(z * 0.06), lrad = (z) => lerp(1.5, 0.45, clamp((z - 252) / 130, 0, 1));
      const barkC = C('#6a5c49'), pineC = mixC(pal[2], pal[3], 0.4).multiplyScalar(1.5), PB = [K.BARK, 0.4, 1, 0], PBL = [K.BARK, 0.4, 1, -1];
      {
        const tr = [[-22, GY - 0.6, 232, 2.8], [-22.8, 2.5, 233, 2.4], [-25.5, 8.5, 235.5, 2.1], [-29, 13.4, 239, 1.9], [-34, 15.9, 244.5, 1.7]].map((p) => [X(p[0]), p[1], p[2], p[3]]);
        tr.push([lx(252), ly(252), 252, 1.5]);
        for (let z = 262; z <= 382; z += 10) tr.push([lx(z), ly(z), z, lrad(z)]);
        const seg = (list, sides) => {
          for (let i = 0; i < list.length - 1; i++) {
            limb(gb, V3(list[i][0], list[i][1], list[i][2]), V3(list[i + 1][0], list[i + 1][1], list[i + 1][2]), list[i][3], list[i + 1][3], sides, barkC, list[i][2] > 246 ? PBL : PB, { jit: jit(0.85, 1.15) });
            gb.add(new THREE.SphereGeometry(list[i + 1][3] * 1.03, sides, 6), M(list[i + 1][0], list[i + 1][1], list[i + 1][2]), barkC, list[i][2] > 246 ? PBL : PB);
          }
        };
        seg(tr, 14);
        gb.add(lathe([[0, 0], [4.6, 0], [3.4, 1.3], [2.9, 3.2], [0, 3.2]], 11), M(tr[0][0], GY - 0.9, tr[0][2]), barkC, PB);
        const lead = [[-29, 13.4, 239, 1.5], [-27.5, 21, 238.5, 1.2], [-24.5, 28, 236.5, 0.9], [-25.5, 35.5, 234.5, 0.5]].map((p) => [X(p[0]), p[1], p[2], p[3]]);
        seg(lead, 9);
        await ctx.yield();
        // a pad of needles: a lens, domed above and shallow below; the shader cuts it into tufts and a spiky outline
        const padGeo = () => {
          const prof = [[0.45, 0.36], [0.8, 0.24], [1, 0.04], [0.62, -0.1]], n = 12, pos = [0, 0.42, 0], idx = [];
          for (const q of prof) for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832; pos.push(Math.cos(a) * q[0], q[1], Math.sin(a) * q[0]); }
          pos.push(0, -0.14, 0);
          const last = 1 + prof.length * n;
          for (let i = 0; i < n; i++) {
            const i2 = (i + 1) % n;
            idx.push(0, 1 + i2, 1 + i);
            for (let q = 0; q < prof.length - 1; q++) { const a = 1 + q * n + i, b = 1 + q * n + i2; idx.push(a, b, a + n, b, b + n, a + n); }
            idx.push(last, last - n + i, last - n + i2);
          }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
          return g;
        };
        const pad = (x, y, z, r, fx, fy, fz) => {
          const seed = kr();
          gb.add(padGeo(), M(x, y, z, 0, kr() * 6.28, 0, r, r, r), barkC, [K.NEEDLE, kr.range(0.8, 1.25), 1], { fn: (i, px, py, pz, v, Cc) => { Cc[i * 3] = (px - x) / r; Cc[i * 3 + 1] = seed; Cc[i * 3 + 2] = (pz - z) / r; } });
          // three crossed cards of upright needle fans: the pad's thickness and its bristling top in side view
          const a0 = kr() * PI, tint = kr.range(0.85, 1.3), cp = [], cn = [];
          for (let j = 0; j < 3; j++) {
            const a = a0 + j * PI / 3 + kr.range(-0.25, 0.25), dx = Math.cos(a), dz = Math.sin(a), hw = r * 0.88, yb = y + 0.02 * r, yt = y + 0.66 * r, ox = kr.range(-0.12, 0.12) * r, oz = kr.range(-0.12, 0.12) * r;
            const A = [x + ox - dx * hw, yb, z + oz - dz * hw], B = [x + ox + dx * hw, yb, z + oz + dz * hw], T1 = [B[0], yt, B[2]], T0 = [A[0], yt, A[2]];
            cp.push(...A, ...B, ...T1, ...A, ...T1, ...T0);
            for (let q = 0; q < 6; q++) cn.push(-dz, 0, dx);
          }
          const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(cn, 3));
          const uOfV = [-1, 1, 1, -1, 1, -1], vOfV = [0, 0, 1, 0, 1, 1];
          gb.add(cg, null, barkC, [K.NEEDLE, tint, 1], { fn: (i, px, py, pz, v, Cc) => { Cc[i * 3] = uOfV[i % 6]; Cc[i * 3 + 1] = seed + 2; Cc[i * 3 + 2] = vOfV[i % 6]; } });
          limb(gb, V3(fx, fy, fz), V3(x, y + 0.1, z), 0.32, 0.16, 5, barkC, PB);
        };
        let sgn = 1;
        for (let z = 249; z < 385; z += 4.4, sgn = -sgn) {
          const zz = Math.max(z, 252), t = (z - 249) / 136;
          pad(lx(zz) + sgn * kr.range(2.2, 5.4), ly(zz) + kr.range(0.3, 1.9), z + kr.range(-1, 1), kr.range(3, 5) * (1 - 0.3 * t), lx(zz), ly(zz), z);
          if (!snow && kr() < 0.8) fall(lx(zz) + sgn * kr.range(1, 5), ly(zz) - 0.4, z, ly(zz) + 4.2, kr.range(0.24, 0.4), kr(), 0.15, 0.4, 0.9, 1);
          await ctx.yield();
        }
        for (let j = 0; j < 11; j++) {
          const q = lead[1 + (j % 3)], an = j * 2.4, rr = kr.range(3, 7.5);
          pad(q[0] + Math.cos(an) * rr, q[1] + kr.range(-3, 2.5), q[2] + Math.sin(an) * rr, kr.range(3, 5.2), q[0], q[1] - 1, q[2]);
        }
        pad(lead[3][0], lead[3][1] - 0.2, lead[3][2], 4.4, lead[3][0], lead[3][1] - 1, lead[3][2]);
        await ctx.yield();
        // nine frames of bamboo props, 16 m apart, lashed with black rope
        for (let j = 0; j < 9; j++) {
          const z = 252 + j * 16, cx = lx(z), cy = ly(z) - lrad(z) - 0.45;
          for (const s of [-1, 1]) {
            const x = X(-40) + s * 8, yb = Math.min(hillAt(x, z), GY - 0.6) - 0.8;
            limb(gb, V3(x, yb, z), V3(x, cy + 1.5, z), 0.5, 0.44, 9, bamboo, [K.WOODY, 0.75, 1], { jit: jit(0.85, 1.15) });
            for (let y = yb + 2.2; y < cy + 1; y += 2.4) gb.add(new THREE.CylinderGeometry(0.56, 0.56, 0.15, 9), M(x, y, z), bamboo, [K.WOODY, 0.6, 1], { jit: 0.75 });
            gb.add(new THREE.CylinderGeometry(0.64, 0.64, 0.9, 8), M(x, cy, z), rope, [K.CLOTH, 0.3, 1]);
          }
          gb.add(new THREE.CylinderGeometry(0.42, 0.42, 18.4, 9), M(X(-40), cy, z, 0, 0, PI / 2), bamboo, [K.WOODY, 0.75, 1], { jit: jit(0.85, 1.15) });
          gb.add(new THREE.CylinderGeometry(lrad(z) + 0.22, lrad(z) + 0.22, 1.0, 9), M(cx, cy + lrad(z) + 0.45, z, PI / 2, 0, 0), rope, [K.CLOTH, 0.3, 1]);
          await ctx.yield();
        }
        if (snow) {                                                   // February: the limb roped to a tall pole in a cone of straw ropes
          const top = V3(X(-28), 52, 238), straw = C('#b3a475');
          limb(gb, V3(X(-28), GY - 1, 236), top, 0.5, 0.3, 7, bamboo, [K.WOODY, 0.6, 1]);
          for (let z = 250; z < 386; z += 8.5) for (const s of [-1, 1]) limb(gb, top, V3(lx(Math.max(z, 252)) + s * 4.5, ly(Math.max(z, 252)) + 1.2, z), 0.17, 0.17, 4, straw, [K.CLOTH, 0.2, 1]);
        }
      }
      await ctx.yield();

      // ---- the teahouse: clay walls, round window (the portal), mossed thatch, bamboo gutter
      const TX0 = X(-40), TZ0 = 392, clay = C('#c9c7b4');
      const roofY = (x, z) => { const t = clamp(Math.min((36 - Math.abs(x - TX0)) / 20, (20.5 - Math.abs(z - 406.5)) / 20.5), 0, 1); return 12.4 + 22 * Math.pow(t, 0.82); };
      dyn.roofY = roofY;
      {
        const sh = new THREE.Shape(); sh.moveTo(-30, GY - 0.5); sh.lineTo(30, GY - 0.5); sh.lineTo(30, 13); sh.lineTo(-30, 13); sh.closePath();
        const ho = new THREE.Path(); ho.absarc(0, 2.6, 7.25, 0, PI * 2, true); sh.holes.push(ho);
        gb.add(new THREE.ShapeGeometry(sh, 44), M(TX0, 0, TZ0, 0, PI, 0), clay, [K.PLASTER, 0.05, 0.75], { grad: [-5, 13, 1.05, 0.6] });
        gb.add(new THREE.CylinderGeometry(7.25, 7.25, 1.3, 44, 1, true), M(TX0, 2.6, TZ0 + 0.65, PI / 2, 0, 0), clay, [K.PLASTER, 0.05, 0.4], { jit: 0.7 });
        gb.add(new THREE.TorusGeometry(7.5, 0.36, 8, 48), M(TX0, 2.6, TZ0 - 0.25), T, [K.WOODX, 0.7, 0.75], { jit: 1.3 });
        for (const dx of [-30, -20, -10, 10, 20, 30]) gb.add(cb(1.1, 18.4, 1.1, 0.14), M(TX0 + dx, 3.8, TZ0 - 0.4), T, [K.WOODY, 0.6, 0.75], { jit: jit(0.9, 1.3) });
        gb.add(cb(61, 1.0, 1.2, 0.14), M(TX0, 12.4, TZ0 - 0.4), T, [K.WOODX, 0.6, 0.6]);
        for (const s of [-1, 1]) {
          await ctx.yield();
          gb.add(cb(20, 0.9, 0.9, 0.12), M(TX0 + s * 20, GY + 0.2, TZ0 - 0.35), T, [K.WOODX, 0.6, 0.8]);
          gb.add(cb(19, 0.55, 0.7, 0.1), M(TX0 + s * 20, 3.4, TZ0 - 0.3), T, [K.WOODX, 0.6, 0.8]);
          gb.add(box(18.9, 7.6, 0.3), M(TX0 + s * 20, -0.7, TZ0 - 0.16), wallC, [K.WOODY, 0.45, 0.8], { jit: 1.25 });
          for (let j = 0; j < 5; j++) gb.add(cb(0.3, 7.4, 0.2, 0.05), M(TX0 + s * (12 + j * 4), -0.7, TZ0 - 0.36), T, [K.WOODY, 0.5, 0.8]);
          gb.add(box(0.7, 18.5, 29), M(TX0 + s * 30, 3.75, TZ0 + 14.5), clay, [K.PLASTER, 0.05, 0.85], { grad: [-5, 13, 1.05, 0.7] });
          gb.add(box(0.9, 1.8, 41), M(TX0 + s * 35.8, 11.5, 406.5), C('#4f4a3a'), [K.THATCH, 0.2, 0.8]);
          hyd(TX0 + s * 13.5, TZ0 - 5, 3); fern(TX0 + s * 9.5, TZ0 - 3, 2.4); fern(TX0 + s * 18, TZ0 - 3.4, 2.6);
        }
        await ctx.yield();
        const g = new THREE.PlaneGeometry(72, 41, 28, 18); g.rotateX(-PI / 2); g.translate(TX0, 0, 406.5);
        const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, roofY(P.getX(i), P.getZ(i)) + 0.5 * ctx.noise.n2(P.getX(i) * 0.12, P.getZ(i) * 0.12));
        g.computeVertexNormals();
        gb.add(g, null, C('#6e6853'), [K.THATCH, 0.3, 1], { fn: (i, x, y, z, v, Cc) => { const n = 0.8 + 0.35 * ctx.noise.n2(x * 0.07, z * 0.07 + 9); Cc[i * 3] *= n; Cc[i * 3 + 1] *= n; Cc[i * 3 + 2] *= n; } });
        await ctx.yield();
        gb.add(box(72, 1.8, 0.9), M(TX0, 11.5, 386.3), C('#4f4a3a'), [K.THATCH, 0.2, 0.8]);
        gb.add(box(71, 0.25, 6.2), M(TX0, 11.0, 389.2), TD, [K.WOODX, 0.2, 0.3]);
        for (let dx = -34; dx <= 34; dx += 4) gb.add(cb(0.55, 0.65, 6.2, 0.1), M(TX0 + dx, 10.7, 389.1), T, [K.WOODZ, 0.5, 0.35], { jit: jit(0.9, 1.3) });
        gb.add(new THREE.CylinderGeometry(0.38, 0.38, 71, 8), M(TX0, 10.3, 385.7, 0, 0, PI / 2), bamboo, [K.WOODY, 0.75, 0.9]);
        const ry = roofY(TX0, 406.5);
        gb.add(new THREE.CylinderGeometry(1.0, 1.0, 34, 9), M(TX0, ry + 0.5, 406.5, 0, 0, PI / 2), bamboo.clone().multiplyScalar(0.7), [K.WOODY, 0.5, 1]);
        for (let j = 0; j < 7; j++) gb.add(new THREE.CylinderGeometry(1.4, 1.4, 1.0, 9), M(TX0 - 15 + j * 5, ry + 0.4, 406.5, 0, 0, PI / 2), C('#4f4a3a'), [K.THATCH, 0.2, 1]);
        if (!snow) for (let dx = -34; dx <= 34; dx += 2.3) if (Math.abs(dx) > 10) fall(TX0 + dx, 10.2, 385.8, 15.4, kr.range(0.3, 0.5), kr(), 0.15, 0.4, 0.9, 1);
        await ctx.yield();
        // the water basin and its dribbling bamboo pipe, hill side of the last stones
        const bx = X(-29.5), bz = 352, by = hillAt(bx, bz) - 0.4;
        gb.add(flat(lathe([[0, 0], [2.2, 0], [2.6, 0.8], [2.5, 2.2], [2.1, 2.5], [1.7, 2.3], [1.6, 1.9], [0, 1.8]], 9)), M(bx, by, bz), col.stone, [K.STONE, 0.55, 1], { jit: 1.1 });
        const wg = new THREE.CircleGeometry(1.66, 12); wg.rotateX(-PI / 2); gb.add(wg, M(bx, by + 2.1, bz), pal[1], [K.WATER, 1, 1]);
        limb(gb, V3(bx + X(2.9), by, bz + 1.2), V3(bx + X(2.9), by + 5, bz + 1.2), 0.3, 0.27, 8, bamboo, [K.WOODY, 0.75, 1]);
        limb(gb, V3(bx + X(3.3), by + 4.5, bz + 1.3), V3(bx + X(0.3), by + 4.0, bz + 0.2), 0.2, 0.18, 7, bamboo, [K.WOODY, 0.75, 1], { jit: 1.1 });
        gb.add(new THREE.CylinderGeometry(0.07, 0.08, 1.9, 6, 1, true), M(bx + X(0.3), by + 3.05, bz + 0.2), col.pearl, [K.FLOW, 1, 0.9]);
        for (let j = 0; j < 3; j++) fall(bx + X(0.3), by + 3.9, bz + 0.2, 1.8, kr.range(0.9, 1.3), kr(), 0.12, 0.3, 0.9, 1);
        for (let j = 0; j < 4; j++) gb.add(rockG(kr.range(0.9, 1.5), 0.8, 9, 0.5), M(bx - X(2.6) + kr.range(-0.6, 0.6), by - 0.1, bz - 2.4 + j * 1.7, 0, kr() * 6, 0), col.stone, [K.STONE, 0.6, 1], { jit: jit(0.75, 1.25) });
        fern(bx + X(2.5), bz - 2.6, 2.4); fern(bx + X(1), bz + 3.4, 2.2); fern(bx + X(4.6), bz + 2.5, 2.6);
        await ctx.yield();
        // bamboo on the hill side of the teahouse
        const culm = C('#6f8a4a');
        for (let i = 0; i < Math.round(44 * dens); i++) {
          if ((i & 7) === 0) await ctx.yield();
          const x = X(kr.range(-5, 26)), z = kr.range(380, 426), H = kr.range(24, 38), bend = kr.range(-0.12, 0.12), bz2 = kr.range(-0.1, 0.06), y0 = hillAt(x, z) - 0.5;
          if (lp.nearestXZ(x, z).dist < 12) continue;
          let a = V3(x, y0, z);
          for (let sgm = 0; sgm < 3; sgm++) {
            const t = (sgm + 1) / 3, b = V3(x + bend * H * t * t, y0 + H * t, z + bz2 * H * t * t);
            limb(gb, a, b, 0.36 - sgm * 0.07, 0.3 - sgm * 0.07, 6, culm, [K.WOODY, 0.75, 1], { jit: jit(0.8, 1.2) });
            if (sgm > 0) for (let j = 0; j < 3; j++) spray(lerp(a.x, b.x, kr()) + kr.range(-2.5, 2.5), lerp(a.y, b.y, kr()), lerp(a.z, b.z, kr()) + kr.range(-2.5, 2.5), kr.range(2.6, 4), kr.range(-0.3, 0.3), kr.range(-0.3, 0.3), mixC(pal[3], pal[4], kr.range(0.3, 0.9)).multiplyScalar(kr.range(0.7, 1.05)));
            a = b;
          }
        }
      }
      await ctx.yield();

      // ---- the pond's edge: hydrangeas and iris on the shore, lily pads (June), fallen leaves (November), ice (February)
      for (let z = 222; z < 380; z += 15) { const x = X(-40 + kr.range(11.5, 15)), r = kr.range(2.5, 3.3); if (lp.nearestXZ(x, z).dist > 7 + r && Math.abs(z - 352) > 8) hyd(x, z + kr.range(-3, 3), r); }
      await ctx.yield();
      hyd(X(-20), 165.5, 3); hyd(X(-36), 150, 3.2); hyd(X(-48), 132, 2.8);
      await ctx.yield();
      for (let z = 240; z < 382; z += 6.3) { const x = X(-34.2 + kr.range(-0.5, 1)); iris(x, z); }
      for (const [x, z, r] of rocks) if (kr() < 0.55) { const an = kr() * 6.28, ix = x + Math.cos(an) * (r + 1.6), iz = z + Math.sin(an) * (r + 1.6); if (lp.nearestXZ(ix, iz).dist > 8 && pondM(ix, iz) < 0.1) iris(ix, iz, undefined, 6); }
      await ctx.yield();
      const WY = GY - 0.5;
      if (!snow) {
        const padC = mixC(pal[2], pal[3], 0.5);
        for (let c = 0; c < 11; c++) {
          const cx = X(kr.range(-118, -51)), cz = kr.range(215, 372);
          for (let j = 0; j < 9; j++) {
            const x = cx + kr.range(-9, 9), z = cz + kr.range(-9, 9), r = kr.range(1.1, 2.3);
            if (pondM(x, z) < 0.65) continue;
            const g = new THREE.CircleGeometry(r, 10, 0.3, 5.7); g.rotateX(-PI / 2);
            gb.add(g, M(x, WY + 0.04, z, 0, kr() * 6.28, 0), padC, [K.CLOTH, 0.35, 1, 0.07], { jit: jit(0.7, 1.3) });
          }
        }
      } else {
        // one sheet over the whole pond: the shader breaks it into floes with thin, broken edges and dark leads between them,
        // and keeps the water open beside the stepping stones, where the koi rise
        const g = new THREE.PlaneGeometry(176, 300, 16, 28); g.rotateX(-PI / 2);
        gb.add(g, M(X(-116), WY + 0.06, 244), C('#9fb0bd'), [K.ICE, 0.5, 1], { fn: (i, x, y, z, v, Cc) => { Cc[i * 3] = smoothstep(15, 44, lp.nearestXZ(x, z).dist); } });
      }
      if (nov) {                                                       // red leaves lying on the moss and floating on the pond
        for (let i = 0; i < Math.round(190 * detail); i++) {
          if ((i & 31) === 0) await ctx.yield();
          const u = kr.range(0.33, 0.99), p = pAt(u), sd = sideOf(u), lat = (kr() < 0.5 ? -1 : 1) * kr.range(5, 34), x = p.x + sd.x * lat, z = p.z + sd.z * lat;
          if (z < 78 || inTea(x, z)) continue;
          const wet = pondM(x, z) > 0.3, r = kr.range(1.2, 2.4);
          leafAt.push([x, z, r * 0.6]);
          spray(x, (wet ? WY : hillAt(x, z)) + r * 0.3 + 0.1, z, r, 0, 0, k.leafCol());
        }
      }
      if (!snow && !nov) {                                             // June: vermilion leaves shed by the two red maples lie on the moss and float on the pond
        const red0 = C('#c52d16'), red1 = C('#e2542a'), redC = () => mixC(red0, red1, kr()).multiplyScalar(kr.range(0.8, 1.1));
        for (const [mx, mz, n, R] of [[X(5), 228, 28, 17], [X(-6), 352, 28, 18]]) for (let i = 0; i < n; i++) {
          const an = kr() * 6.28, d = Math.sqrt(kr()) * R, x = mx + Math.cos(an) * d, z = mz + Math.sin(an) * d;
          if (inTea(x, z)) continue;
          const wet = pondM(x, z) > 0.3, r = kr.range(1.0, 1.9);
          leafAt.push([x, z, r * 0.6]);
          spray(x, (wet ? WY : hillAt(x, z)) + r * 0.3 + 0.1, z, r, 0, 0, redC());
        }
      }
      await ctx.yield();
      {                                                                // a snow-viewing lantern on a rock in the pond, lit, beyond the props half way along the stones
        const yx = X(-52.5), yz = 308, by = WY + 1.3;
        gb.add(rockG(3.6, 2.7, 12, 0.7), M(yx, WY - 1.3, yz, 0, kr() * 6.28, 0), col.stone, [K.STONE, 0.6, 1], { jit: 1.1 });
        for (let j = 0; j < 3; j++) { const a = j * 2.094 + 0.5; limb(gb, V3(yx + Math.cos(a) * 1.8, by - 0.2, yz + Math.sin(a) * 1.8), V3(yx + Math.cos(a) * 0.9, by + 1.95, yz + Math.sin(a) * 0.9), 0.32, 0.27, 6, lstone, lst); }
        const st = (g, o, c, sf) => gb.add(g, M(yx, by, yz, 0, 0.3, 0), c || lstone, sf || lst, o || { jit: jit(0.85, 1.2) });
        st(flat(lathe([[0, 1.8], [1.5, 1.8], [1.6, 2.1], [0, 2.1]], 6)));
        st(flat(lathe([[0, 2.05], [1.05, 2.05], [1.05, 3.5], [0, 3.5]], 6)), { jit: 0.9 });
        st(flat(lathe([[0, 3.4], [3.3, 3.35], [3.5, 3.6], [2.0, 4.25], [0.7, 4.8], [0, 4.85]], 6)), { jit: 1 }, C('#454b47'), [K.STONE, 0.45, 1]);   // the wide roof: dark wet stone, so the flame under it is the brightest thing
        st(lathe([[0, 4.75], [0.4, 4.75], [0.55, 5.1], [0.3, 5.5], [0, 5.6]], 8));
        for (let f = 0; f < 6; f++) { const a = PI / 6 + f * PI / 3 + 0.3; gb.add(box(0.72, 1.0, 0.1), M(yx + Math.sin(a) * 0.93, by + 2.78, yz + Math.cos(a) * 0.93, 0, a, 0), flameC, [K.FLAME, 0, 1]); }
        dome(gb, yx + 0.2, yz - 0.1, 1.9, 0.4, mossC(), 1, by + 4.0);
        dyn.pondLamp = V3(yx, by + 2.8, yz);
      }
      // fine rain (or slow snow) all along the camera's way through the garden
      for (let i = 0; i < Math.round((snow ? 1700 : 950 * rainW) * detail); i++) {
        if ((i & 63) === 0) await ctx.yield();
        const u = kr.range(0.32, 1.0), p = pAt(u), sd = sideOf(u), lat = kr.range(-44, 44), x = p.x + sd.x * lat, z = p.z + sd.z * lat + kr.range(-5, 5);
        if (z < 71 || z > 386) continue;
        if (snow) { const fs = kr.range(0.4, 0.8); fall(x, 34, z, 40, kr.range(0.06, 0.1), kr(), fs, fs, kr.range(0.8, 1), 2); } else fall(x, 40, z, 46, kr.range(0.3, 0.42), kr(), 0.07, kr.range(3.5, 6.5), kr.range(0.45, 1), 0);
      }
      // mist sheets: [x, y, z, width, depth, alpha, drift]
      // standing bands between the cedar ranks and over the wall cap, on all three walled sides: [x0, z0, x1, z1, y0, y1, alpha, drift]
      dyn.bands = [];
      for (const [o, y0, y1, al, dr] of [[42, 4, 52, 0.6, 2.6], [56, 2, 66, 0.86, -2.2], [127, 6, 98, 0.9, 1.8]]) {
        dyn.bands.push([-(211 + o), 430 + o, 211 + o, 430 + o, y0, y1, al, dr]);
        for (const sx of [-1, 1]) dyn.bands.push([sx * (211 + o), 64, sx * (211 + o), 430 + o, y0, y1, al, dr * sx]);
      }
      dyn.mist = [[0, 0.55, -86, 19.6, 52, 0.26, 3.2], [X(26), 1.2, -89, 28, 60, 0.32, 0.8], [X(-26), 0.6, -89, 28, 60, 0.32, -0.8], [X(-95), GY + 4.5, 250, 150, 260, 0.26, 1], [X(-120), GY + 10, 310, 150, 200, 0.36, -0.7], [X(75), 13, 240, 170, 250, 0.34, 0.8], [0, 20, 404, 430, 90, 0.45, 0.6], [0, 36, 506, 520, 110, 0.55, -0.5],
        [X(186), 18, 250, 90, 330, 0.5, 0.7], [X(-186), 16, 250, 90, 330, 0.5, -0.6], [X(46), -1.5, 124, 100, 70, 0.17, 1], [X(-62), -1, 132, 110, 64, 0.17, -1], [X(10), 6, 300, 120, 120, 0.24, 0.9]];
      await ctx.yield();

      // ---- koi: white with vermilion, ink with slate, gold with white (three patterns); body along +z, 5 m long
      dyn.koi = [0, 1, 2].map((type) => {
        const b = k.makeBatch(), finC = type === 1 ? C('#2a3140') : type === 2 ? C('#d98a2a') : C('#c9cfc8'), fs = [K.CLOTH, 0.8, 1];
        const body = { fn: (i, x, y, z, v, Cc) => { Cc[i * 3] = x; Cc[i * 3 + 1] = y; Cc[i * 3 + 2] = z; } };
        b.add(lathe([[0, -2.5], [0.12, -2.42], [0.3, -2.1], [0.5, -1.4], [0.68, -0.5], [0.78, 0.3], [0.76, 1.0], [0.62, 1.7], [0.4, 2.2], [0.18, 2.45], [0, 2.5]], 18), M(0, 0, 0, PI / 2, 0, 0, 0.8, 1, 1.1), finC, [K.KOI, type, 1], body);
        const pos = [], tri = (a, c, e) => pos.push(...a, ...c, ...e);
        for (let j = 0; j < 7; j++) {                                  // dorsal fin: a low curved ridge
          const z0 = 1.0 - j * 0.3, z1 = z0 - 0.3, h0 = 0.55 * Math.sin(j / 7 * PI) + 0.04, h1 = 0.55 * Math.sin((j + 1) / 7 * PI) + 0.04, y0 = 0.8 - 0.05 * j, y1 = 0.8 - 0.05 * (j + 1);
          tri([0, y0, z0], [0, y0 + h0, z0 - 0.1], [0, y1, z1]); tri([0, y0 + h0, z0 - 0.1], [0, y1 + h1, z1 - 0.1], [0, y1, z1]);
        }
        for (let j = 0; j < 6; j++) {                                  // tail: a forked fan with a slight curl
          const a0 = -0.75 + j * 0.25, a1 = a0 + 0.25, l0 = 1.5 - 0.5 * Math.cos(a0 * 2.6), l1 = 1.5 - 0.5 * Math.cos(a1 * 2.6);
          tri([0, 0, -2.2], [0.25 * Math.sin(a0 * 2), Math.sin(a0) * l0, -2.2 - Math.cos(a0) * l0], [0.25 * Math.sin(a1 * 2), Math.sin(a1) * l1, -2.2 - Math.cos(a1) * l1]);
        }
        for (const sd of [-1, 1]) for (let j = 0; j < 4; j++) {        // pectoral fins
          const a0 = 0.3 + j * 0.35, a1 = a0 + 0.35;
          tri([sd * 0.5, -0.25, 1.3], [sd * (0.5 + Math.sin(a0) * 1.0), -0.4, 1.3 - Math.cos(a0) * 1.0], [sd * (0.5 + Math.sin(a1) * 1.0), -0.4, 1.3 - Math.cos(a1) * 1.0]);
        }
        const fin = new THREE.BufferGeometry(); fin.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fin.computeVertexNormals();
        b.add(fin, null, finC, fs, { jit: 0.9 });
        return b.build();
      });
      await ctx.yield();

      // ---- the grey heron (rare): body with folded neck, trailing legs, two-jointed wings 14 m across
      if (rare) {
        const grey = C('#b9c2ca'), dark = C('#39424e'), mid = C('#8f9aa7'), pale = C('#e3e7e6'), hs = [K.FEATHER, 0.25, 1];
        const hb = k.makeBatch();
        hb.add(new THREE.SphereGeometry(1, 14, 9), M(0, 0, 0, 0, 0, 0, 0.95, 0.85, 2.3), grey, hs, { fn: (i, x, y, z, v, Cc) => { if (y < -0.25) { Cc[i * 3] = pale.r; Cc[i * 3 + 1] = pale.g; Cc[i * 3 + 2] = pale.b; } } });
        limb(hb, V3(0, 0.2, 1.9), V3(0, 1.2, 2.5), 0.46, 0.34, 9, pale, hs); limb(hb, V3(0, 1.2, 2.5), V3(0, 0.9, 1.7), 0.34, 0.3, 9, pale, hs); limb(hb, V3(0, 0.9, 1.7), V3(0, 1.3, 3.0), 0.3, 0.26, 9, pale, hs);
        hb.add(new THREE.SphereGeometry(0.38, 8, 6), M(0, 1.35, 3.2, 0, 0, 0, 0.8, 0.85, 1.5), pale, hs);
        hb.add(new THREE.ConeGeometry(0.16, 1.9, 6), M(0, 1.3, 4.5, PI / 2, 0, 0), C('#a9a06c'), [K.CLOTH, 0.5, 1]);
        hb.add(new THREE.ConeGeometry(0.12, 1.5, 4), M(0, 1.62, 2.75, -PI / 2 + 0.25, 0, 0), dark, hs);                  // black crest
        hb.add(new THREE.ConeGeometry(0.75, 2.2, 6), M(0, 0.05, -2.9, -PI / 2, 0, 0, 1, 1, 0.35), dark, hs);              // tail
        const lg = k.makeBatch();
        for (const s of [-1, 1]) { limb(lg, V3(s * 0.3, 0, 0), V3(s * 0.25, 0, -4.4), 0.13, 0.1, 5, C('#6f6a4e'), hs); lg.add(new THREE.ConeGeometry(0.35, 1.0, 4), M(s * 0.25, 0, -4.8, -PI / 2, 0, 0, 1, 1, 0.3), C('#6f6a4e'), hs); }
        const wing = (s) => {
          const tri = (pts, list) => { for (let i = 1; i < list.length - 1; i++) pts.push(...list[0], ...list[i], ...list[i + 1]); };
          const ip = [], op = [];
          tri(ip, [[0, 0, 1.0], [3 * s, 0, 0.9], [3 * s, 0, -1.1], [1.5 * s, 0, -1.45], [0, 0, -1.3]]);
          tri(op, [[0, 0, -1.1], [0, 0, 0.9], [2.6 * s, 0, 0.65], [4 * s, 0, -0.1], [3.75 * s, 0, -0.55], [3.3 * s, 0, -0.45], [3.2 * s, 0, -0.95], [2.6 * s, 0, -0.8], [2.4 * s, 0, -1.3], [1.6 * s, 0, -1.1], [0.8 * s, 0, -1.45]]);
          const mk = (pts, c, c2) => {
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.computeVertexNormals();
            const b = k.makeBatch(); b.add(g, null, c, hs, { fn: (i, x, y, z, v, Cc) => { const q = z < -0.5 || Math.abs(x) > 3.1 ? c2 : null; if (q) { Cc[i * 3] = q.r; Cc[i * 3 + 1] = q.g; Cc[i * 3 + 2] = q.b; } } }); return b.build();
          };
          return { inner: mk(ip, grey, mid), outer: mk(op, mixC(grey, mid, 0.5), dark) };       // pale coverts, slate flight feathers, dark tips
        };
        dyn.heron = { body: hb.build(), legs: lg.build(), L: wing(1), R: wing(-1) };
      }
      // ---- last of all (so that nothing above falls differently): cushions, ferns and iris where the quilt leaves two clearings
      for (const [ox, oz] of OLD) {
        dome(gb, ox, oz, 3.3, 0.6, mossC(), 2);
        for (let j = 0; j < 9; j++) {
          const an = j * 0.71 + kr() * 0.4, rd = 2.6 + (j % 3) * 1.7 + kr(), x = ox + Math.cos(an) * rd, z = oz + Math.sin(an) * rd, r = kr.range(1.1, 2.4);
          if (lp.nearestXZ(x, z).dist > 5.5 + r * 0.5) dome(gb, x, z, r, kr.range(0.5, 0.8), mossC(), 2);
        }
        fern(ox + 4.5, oz - 1.5, 2.5); fern(ox - 3.2, oz + 4, 2.2); iris(ox - S * 4, oz + 2.5, undefined, 6);
        await ctx.yield();
      }

      // ================================================================ THE HILLSIDE IN THE BRIEF'S OWN WORDS (the last pass of all)
      // Everything from here is dealt over the GARDEN'S OWN GROUND by rules of the land alone. The extent is the garden inside
      // its wall, outside the pond and the teahouse. What a rule may read: the hill's own height (hillH: the hill as it stood
      // before the way was cut through it), the drift noise the ground's colour already has, the drawn ground (gAt) and the
      // cushions that already stand on it (the shade grid, domeAt). The way through the garden is asked for clearance only
      // (under, away). Every kind of thing has a stream of its own, named by the seed, so nothing above falls differently.
      const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
      const rGreat = stream('veranda6-great'), rCrowd = stream('veranda6-crowd'), rStone = stream('veranda6-stones'), rPool = stream('veranda6-pools'), rWall = stream('veranda6-wallfoot');
      const wasRng = k.useRng(rPool);
      kr = rPool;
      await k.groundPrep();
      const gAt = k.groundAt, GG = k.ground, domeAt = k.domeAt;
      dyn.frogsLive = dyn.frogs.length;                                 // the frogs dealt from here on hop on a stream of their own
      const land = (x, z, r) => z > 84 + r && z < 422 - r && Math.abs(x) < 203 - r && pondM(x, z) < 0.08 && !inTea(x, z);
      const hillH = (x, z) => 30 * smoothstep(-15, 150, x * S + (z - 230) * 0.15) * smoothstep(80, 190, z);
      const hsAt = (x, z) => smoothstep(3, 22, hillH(x, z));            // 0 on the garden's floor and the hill's foot, 1 high on the slope
      const driftAt = (x, z) => clamp(0.5 + 0.7 * ctx.noise.fbm2(x * 0.03, z * 0.03, 2), 0, 1);
      for (const [x, z, r] of rocks) keep.push([x, z, r + 1]);
      for (const f of dyn.frogs) keep.push([f[0], f[2], 1.2]);
      keep.push([LAN[0], LAN[1], 5], [SCA[0], SCA[1], 6], [POOL[0], POOL[1], 4], [X(-29.5), 352, 5], [X(-22), 232, 5.5], [X(-28), 236, 3]);
      const clearOf = (x, z, r, list, kq) => { for (const q of list) { const dx = q[0] - x, dz = q[1] - z, R = r + q[2] * kq; if (dx * dx + dz * dz < R * R) return false; } return true; };
      const away = (x, z) => lp.nearestXZ(x, z).dist;
      // How near the way may something new come: nothing nearer than 4 m to the line of flight. The ground lies 6.5 m under
      // it, so a low cushion may lie beneath it if its crown stays 4.6 m below; along the stepping stones nothing may cover them.
      const under = (x, z, r, top) => { const q = lp.nearestXZ(x, z); return (q.dist > r + 5 || top < q.y - 4.6) && !(z > 196 && q.dist < r + 3.6); };

      // (0) RAIN POOLS. The land decides: a pool lies at every hollow of the drawn ground, which is a corner of the ground's
      // mesh lower than all six of its neighbours by 3 cm or more. Its water stands at most 14 cm over that lowest point and
      // under the lowest of the rims; its outline is the ground's own contour at that level, pulled in a little (the shader
      // frays it, and lays a dark wet rim of moss round it); never wider than 2.4 m from its middle. Where a cushion already
      // lies over the hollow's middle, or the hollow holds less than 2 m2, there is no pool.
      const pools = [];
      {
        const w = GG.nx + 1, NB = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]], dirs = [];      // a corner's six neighbours, in order round it
        for (let e = 0; e < 6; e++) for (let q = 0; q < 3; q++) {       // 18 directions: toward each neighbour and two between each pair (the ground is one flat facet between two neighbours)
          const t = q / 3, dx = (NB[e][0] * (1 - t) + NB[(e + 1) % 6][0] * t) * GG.dx, dz = (NB[e][1] * (1 - t) + NB[(e + 1) % 6][1] * t) * GG.dz, l = Math.hypot(dx, dz);
          dirs.push([dx / l, dz / l, l, e, t]);
        }
        for (let j = 1; j < GG.nz; j++) {
          await ctx.yield();
          for (let i = 1; i < GG.nx; i++) {
            const x = GG.x0 + i * GG.dx, z = GG.z0 + j * GG.dz;
            if (z < 100 || !land(x, z, 2.5)) continue;
            const c = GG.Y[(j * w + i) * 3 + 1], dn = NB.map((q) => GG.Y[((j + q[1]) * w + i + q[0]) * 3 + 1] - c), lo = Math.min(...dn);
            if (lo < 0.03) continue;                                    // the land gives no hollow here
            const dep = Math.min(0.9 * lo, 0.14), L = c + dep;
            const rho = dirs.map(([, , l, e, t]) => Math.min(2.4, 0.9 * l * Math.min(1, dep / Math.max(dn[e] * (1 - t) + dn[(e + 1) % 6] * t, 1e-3))));
            let area = 0, rmax = 0, rsum = 0;
            for (let q = 0; q < 18; q++) { const a = dirs[q], b = dirs[(q + 1) % 18]; area += 0.5 * rho[q] * rho[(q + 1) % 18] * (a[0] * b[1] - a[1] * b[0]); rmax = Math.max(rmax, rho[q]); rsum += rho[q] / 18; }
            if (area < 2) continue;
            if (!under(x, z, rmax + 0.6, L + 0.04) || !clearOf(x, z, rsum + 0.5, keep, 1) || !clearOf(x, z, rsum, leafAt, 1)) continue;
            let buried = false;
            for (const d of domeAt) { const dx = d[0] - x, dz = d[1] - z, R = d[2] * 0.9; if (dx * dx + dz * dz < R * R) { buried = true; break; } }
            if (buried) continue;
            // the sheet: flat from its middle out to the contour, then a band draped up the ground for the wet rim
            const pos = [], rad = [], B = [], Cq = [];
            for (let q = 0; q < 18; q++) {
              const bx = x + dirs[q][0] * rho[q], bz = z + dirs[q][1] * rho[q], ro = rho[q] * 1.32 + 0.4, cx = x + dirs[q][0] * ro, cz = z + dirs[q][1] * ro;
              B.push([bx, L, bz]); Cq.push([cx, Math.max(L, gAt(cx, cz)) + 0.035, cz]);
            }
            for (let q = 0; q < 18; q++) {
              const q2 = (q + 1) % 18;
              pos.push(x, L, z, ...B[q2], ...B[q]); rad.push(0, 1.2, 1.2);
              pos.push(...B[q], ...B[q2], ...Cq[q2], ...B[q], ...Cq[q2], ...Cq[q]); rad.push(1.2, 1.2, 1.75, 1.2, 1.75, 1.75);
            }
            gb.add(k.soup(pos), null, pal[1], [K.WATER, 0.5, 1], { fn: (vi, px, py, pz, v, Cc) => { Cc[vi * 3] = rad[vi]; } });      // 0.5 marks a pool for the shader; colour x = how far out
            // cushions overlap its edge: one as wide as the pool beside it, two small ones on its rim
            const q0 = kr.int(0, 17), rb = Math.max(1.5, rmax * kr.range(1.02, 1.25));
            for (let n = 0; n < 3; n++) {
              const q = (q0 + n * 6 + kr.int(0, 2)) % 18, rr = n ? kr.range(0.6, 1.1) : rb, dq = rho[q] * 0.86 + rr * (n ? 0.5 : 0.8), sx = x + dirs[q][0] * dq, sz = z + dirs[q][1] * dq, sy = kr.range(0.6, 0.9), mc = mossC();
              if (!land(sx, sz, rr) || !under(sx, sz, rr, gAt(sx, sz) + rr * 0.6) || !clearOf(sx, sz, rr, keep, 0.4)) continue;
              dome(gb, sx, sz, rr, sy, mc, 4, gAt(sx, sz) - rr * 0.3); k.shade(sx, sz, rr);
            }
            pools.push([x, z, rsum, rmax]);
            if (kr() < 0.3) { const a = kr() * 6.28, fx = x + Math.cos(a) * (rmax + 1.3), fz = z + Math.sin(a) * (rmax + 1.3); dyn.frogs.push([fx, gAt(fx, fz) + 0.12, fz]); }
          }
        }
      }
      await ctx.yield();

      // (1) THE HILLSIDE'S OWN CAST. Grey stones with lichen, half sunk in the moss, set where a gardener sets them: on the
      // garden's floor and at the foot of the hill, few high on the slope, in loose drifts (the ground's own drift noise);
      // most small, every tenth a great one with shoulders; ferns at the foot on every side that the clearance leaves
      kr = rStone; k.useRng(rStone);
      const stones = [];
      for (let i = 0; i < 1500; i++) {
        if ((i & 15) === 0) await ctx.yield();
        const x = kr.range(-203, 203), z = kr.range(84, 422), pk = kr(), great = kr() < 0.1, r = great ? kr.range(3.3, 5) : 1 + Math.pow(kr(), 1.7) * 1.6, h = r * kr.range(0.9, 1.35), yaw = kr() * 6.28;
        if (z < 100 || !land(x, z, r + 2)) continue;
        const hs = hsAt(x, z);
        if (pk > 0.092 * (1 - 0.85 * hs) * (0.5 + driftAt(x, z))) continue;
        if (away(x, z) < r + (great ? 12 : 6) || !clearOf(x, z, r, keep, 1) || !clearOf(x, z, r, leafAt, 1) || !clearOf(x, z, r + 1, pools, 1) || !clearOf(x, z, 13, stones, 0)) continue;
        const y = gAt(x, z) - h * 0.5, fine = hs < 0.5;
        gb.add(rockG(r, h, great ? 15 : fine ? 8 : 7, great ? 0.5 : 0.42), M(x, y, z, kr.range(-0.16, 0.16), yaw, kr.range(-0.16, 0.16), 1, 1, kr.range(0.72, 1.05)), col.stone, [K.STONE, 0.5, 1], { jit: jit(0.75, 1.25) });
        if (great) for (let j = 0; j < 2; j++) {                          // a great stone has shoulders, and moss clinging on them
          const an = yaw + 0.8 + j * 2.7 + kr.range(-0.4, 0.4), rr = r * kr.range(0.45, 0.62), hh = h * kr.range(0.5, 0.75), sx = x + Math.cos(an) * r * 0.72, sz = z + Math.sin(an) * r * 0.72;
          gb.add(rockG(rr, hh, 10, 0.5), M(sx, gAt(sx, sz) - hh * 0.45, sz, 0, kr() * 6.28, 0), col.stone, [K.STONE, 0.5, 1], { jit: jit(0.75, 1.25) });
          dome(gb, x + Math.cos(an + 1.3) * r * 0.5, z + Math.sin(an + 1.3) * r * 0.5, r * kr.range(0.3, 0.42), 0.5, mossC(), 4, y + h * kr.range(0.62, 0.8));
        }
        k.shade(x, z, r * 0.9, 0.7);
        keep.push([x, z, r + 1]); stones.push([x, z, r]);
        const nfn = great ? kr.int(6, 8) : kr.int(4, 5), a0 = kr() * 6.28;
        for (let j = 0; j < nfn; j++) {
          const an = a0 + (j / nfn) * 6.28 + kr.range(-0.3, 0.3), q = r * 0.92 + kr.range(0.5, 1.2), fx = x + Math.cos(an) * q, fz = z + Math.sin(an) * q, fr = kr.range(1.7, great ? 3.2 : 2.5);
          if (pondM(fx, fz) < 0.1 && away(fx, fz) > fr + 4.5) fern(fx, fz, fr, gAt(fx, fz) - 0.1, 4, fine ? 3 : 2);
        }
        if (kr() < (great ? 0.9 : 0.12)) { const an = kr() * 6.28, fx = x + Math.cos(an) * (r + 0.9), fz = z + Math.sin(an) * (r + 0.9); if (pondM(fx, fz) < 0.1) dyn.frogs.push([fx, gAt(fx, fz) + 0.12, fz]); }
      }
      for (const [x, z, r] of rocks) { const an = kr() * 6.28, fx = x + Math.cos(an) * (r + 1.5), fz = z + Math.sin(an) * (r + 1.5); if (pondM(fx, fz) < 0.1 && away(fx, fz) > 9.5) fern(fx, fz, kr.range(1.8, 2.6), undefined, 6, 4); }
      await ctx.yield();

      // (2) THE GREAT CUSHIONS: broad and low, sunk a quarter, lying under and between whatever is there, so that no flat
      // ground is left anywhere in the garden. Darts are thrown evenly over the whole garden, many more than can be kept, so
      // every place fills up to the one spacing rule. The land sizes them: 6 to 10 m across on the garden's floor and the
      // hill's foot, 9 to 12 m high on the slope (fewer and larger there: that is what the triangle budget leaves).
      kr = rGreat; k.useRng(rGreat);
      const moms = [], BK = 12, bw = Math.ceil(408 / BK), bh = Math.ceil(340 / BK), bucket = [];
      for (let i = 0; i < bw * bh; i++) bucket.push([]);
      const apart = (x, z, r, hs) => {                                  // how near two great cushions may stand: 0.6 of the sum of their radii on the low ground, 1.05 high on the slope
        const bi = clamp(Math.floor((x + 204) / BK), 0, bw - 1), bj = clamp(Math.floor((z - 84) / BK), 0, bh - 1);
        for (let j = Math.max(0, bj - 1); j <= Math.min(bh - 1, bj + 1); j++) for (let i = Math.max(0, bi - 1); i <= Math.min(bw - 1, bi + 1); i++) for (const q of bucket[j * bw + i]) {
          const dx = q[0] - x, dz = q[1] - z, R = lerp(0.6, 1.05, (hs + q[5]) / 2) * (r + q[2]);
          if (dx * dx + dz * dz < R * R) return false;
        }
        return true;
      };
      for (let i = 0; i < 9000; i++) {
        if ((i & 63) === 0) await ctx.yield();
        const x = kr.range(-203, 203), z = kr.range(84, 422), kq = kr(), sy = kr.range(0.44, 0.6);
        const hs = hsAt(x, z), r = Math.min(6, 3.2 + 2.0 * Math.pow(kq, 1.5) + 2.3 * hs + 0.6 * (driftAt(x, z) - 0.5));
        if (!land(x, z, r) || !apart(x, z, r, hs)) continue;
        let open = 0;                                                   // is there still open ground under it?
        for (let q = 0; q < 5; q++) { const an = q * 1.5708, d = q === 4 ? 0 : r * 0.55; if (k.shadeAt(x + Math.cos(an) * d, z + Math.sin(an) * d) < 0.45) open++; }
        if (open < 2) continue;
        const y0 = gAt(x, z) - r * 0.26;
        if (!under(x, z, r, y0 + r * sy) || !clearOf(x, z, r * 0.85, keep, 0.5) || !clearOf(x, z, r * 0.85, leafAt, 1) || !clearOf(x, z, r * 0.85, pools, 0.55)) continue;
        dome(gb, x, z, r, sy, mossC(), 4, y0, 1);
        const m = [x, z, r, y0, sy, hs];
        moms.push(m); bucket[clamp(Math.floor((x + 204) / BK), 0, bw - 1) + bw * clamp(Math.floor((z - 84) / BK), 0, bh - 1)].push(m);
      }
      await ctx.yield();
      // (3) THE CROWD OF SMALL CUSHIONS, where the moss is fine: on the garden's floor and the hill's foot, none high on the
      // slope. At each great cushion's rim, one riding on its shoulder now and then (it lays its shade on it), and one more in
      // every gap that is still open ground
      kr = rCrowd; k.useRng(rCrowd);
      for (let i = 0; i < moms.length; i++) {
        if ((i & 15) === 0) await ctx.yield();
        const [x, z, r, y0, sy, hs] = moms[i];
        if (kr() < 0.35 * (1 - hs)) {                                      // one of the crowd at its rim
          const an = kr() * 6.28, rr = kr.range(0.8, 1.9), q = r * kr.range(0.84, 1.06), sx = x + Math.cos(an) * q, sz = z + Math.sin(an) * q, ss = kr.range(0.55, 0.9), mc = mossC();
          if (land(sx, sz, rr) && under(sx, sz, rr, gAt(sx, sz) + rr * 0.6) && clearOf(sx, sz, rr, keep, 0.4) && clearOf(sx, sz, rr * 0.85, leafAt, 1) && clearOf(sx, sz, rr * 0.8, pools, 0.6)) { dome(gb, sx, sz, rr, ss, mc, 4, gAt(sx, sz) - rr * 0.3); k.shade(sx, sz, rr); }
        }
        if (kr() < 0.15 * (1 - hs)) {                                     // and one that rides on it
          const an = kr() * 6.28, f = kr.range(0.3, 0.62), rr = r * kr.range(0.22, 0.36), sx = x + Math.cos(an) * r * f, sz = z + Math.sin(an) * r * f, ys = y0 + r * sy * Math.sqrt(1 - f * f) - rr * 0.36, rs = kr.range(0.6, 0.9), mc = mossC();
          if (under(sx, sz, rr, ys + rr * rs)) { dome(gb, sx, sz, rr, rs, mc, 4, ys); k.shade(sx, sz, rr * 0.8, 0.9); }
        }
        if (kr() < 0.03 && r > 3.6 && hs < 0.5) dyn.frogs.push([x + kr.range(-0.2, 0.2) * r, y0 + r * sy * 0.96 + 0.04, z + kr.range(-0.2, 0.2) * r]);     // a frog or two on the great cushions' crowns
      }
      // a great cushion lays a little shade on the ground just outside its foot (none on itself): a soft dark crease where it meets the ground
      for (let i = 0; i < moms.length; i++) {
        if ((i & 31) === 0) await ctx.yield();
        const [x, z, r] = moms[i];
        for (let j = 0; j < 8; j++) k.shade(x + Math.cos(j * 0.7854) * r * 1.12, z + Math.sin(j * 0.7854) * r * 1.12, r * 0.12, 0.5);
      }
      for (let i = 0; i < 800; i++) {
        if ((i & 63) === 0) await ctx.yield();
        const x = kr.range(-203, 203), z = kr.range(84, 422), r = kr.range(0.9, 2.1), sy = kr.range(0.5, 0.85), pk = kr();
        if (!land(x, z, r) || k.shadeAt(x, z) > 0.45 || pk > 1 - smoothstep(2, 9, hillH(x, z))) continue;
        const yg = gAt(x, z);
        if (!under(x, z, r, yg + r * (sy - 0.3)) || !clearOf(x, z, r * 0.8, keep, 0.4) || !clearOf(x, z, r * 0.8, leafAt, 1) || !clearOf(x, z, r * 0.8, pools, 0.6)) continue;
        dome(gb, x, z, r, sy, mossC(), 4, yg - r * 0.3); k.shade(x, z, r);
      }
      await ctx.yield();

      // (4) HYDRANGEAS AT THE WALL FOOT, wherever the wall stands clear of the hill: loose groups of two and three clumps of
      // unlike size, with unlike gaps between the groups. Blue in June. In November only dried heads, grey-olive, on the dark
      // leaves; in February dark leaf mounds under their snow, no heads at all. Nothing red or rose here in any look.
      kr = rWall; k.useRng(rWall);
      {
        const hd = pal[2].clone().multiplyScalar(0.55), blueA = C('#8ea4ea'), blueB = C('#6c62c4'), dried = C('#6d6c58');
        const clump = (x, z, r) => {
          const y0 = gAt(x, z) - 0.3;
          if (y0 > GY + 16 || pondM(x, z) > 0.05 || inTea(x, z) || Math.abs(x) > 207.5 || z > 427.5) return;
          gb.add(new THREE.SphereGeometry(1, 7, 3, 0, PI * 2, 0, PI / 2), M(x, y0, z, 0, kr() * 6.28, 0, r * 0.9, r * 0.74, r * 0.9), hd, [K.FROND, 0.2, 1], { grad: [y0, y0 + r * 0.7, 0.3, 1] });
          for (let j = 0; j < 5; j++) {
            const an = kr() * 6.28, el = kr.range(0.35, 1.35), hr = r * kr.range(0.3, 0.4), ca = kr(), cb = kr(), yw = kr() * 6.28;
            const hx = x + Math.cos(an) * Math.cos(el) * r * 0.9, hy = y0 + Math.sin(el) * r * 0.78 + hr * 0.3, hz = z + Math.sin(an) * Math.cos(el) * r * 0.9;
            if (snow) { if (j < 3) gb.add(new THREE.SphereGeometry(1, 6, 2, 0, PI * 2, 0, PI / 2), M(hx, hy - hr * 1.5, hz, 0, yw, 0, hr * 1.7, hr * 1.5, hr * 1.7), hd, [K.FROND, 0.2, 1], { jit: jit(0.8, 1.3) }); }      // a lobe of leaves
            else if (nov) gb.add(new THREE.SphereGeometry(1, 5, 3), M(hx, hy, hz, 0, yw, 0, hr * 0.8, 0.66 * hr, hr * 0.8), dried, [K.FROND, 0.15, 1, 0.05], { jit: 0.7 + 0.5 * ca });
            else gb.add(new THREE.SphereGeometry(1, 5, 3), M(hx, hy, hz, 0, yw, 0, hr, 0.82 * hr, hr), mixC(col.accent, ca < 0.5 ? blueA : blueB, cb * 0.6), [K.FLORET, 0.15, 1, 0.05], { jit: jit(0.85, 1.25) });
          }
        };
        // one group: the first clump the largest, the others smaller and standing off along the wall, a little in or out
        const group = (ax, az, tx, tz, nx, nz) => {
          const n = kr() < 0.2 ? 1 : kr() < 0.55 ? 2 : 3;
          let r0 = kr.range(3.6, 5.2), off = 0;
          for (let j = 0; j < n; j++) {
            const r = j ? r0 * kr.range(0.45, 0.8) : r0, io = kr.range(-1.2, 0.9) + (j ? kr.range(0, 1.6) : 0);
            if (j) off += (j === 1 ? 1 : -1.9) * kr.range(0.7, 1.1) * (r0 + r);
            clump(ax + tx * off + nx * io, az + tz * off + nz * io, r);
          }
        };
        for (const sx of [-1, 1]) for (let z = 106 + kr.range(0, 24); z < 422; z += kr.range(22, 58)) group(sx * 205.5, z, 0, 1, -sx, 0);
        for (let x = -190 + kr.range(0, 24); x < 196; x += kr.range(22, 58)) group(x, 424.5, 1, 0, 0, -1);
      }
      k.useRng(wasRng);
      await ctx.yield();
    };

    // ================================================================ the hero, with everything above built into it
    const hero = await buildHero(ctx, { palette: PAL, season, hour, side: S, rain: rainW, doorScreens: false, backOpen: true, courtShafts: true, beams: [0, 3, 4, 5], uSwallow: 0.12, uMirrorOff: 0.36, path: lp, rainDepth: 330, rainCount: 1.5, pondScene: true, cast: { wagtails, cape }, extend });
    const scene = new THREE.Scene();
    hero.object.rotation.y = PI; hero.object.position.set(0, 0, Z_IN);
    scene.add(hero.object);
    const HU = hero.uniforms, root = hero.object, solid = hero.solidMat;
    const night = hero.hour === 'night', dawn = hero.hour === 'dawn', golden = hero.hour === 'golden';
    const mistBase = (dawn ? 0.0043 : golden ? 0.0026 : 0.0032) * (snow ? 1.1 : 1);
    scene.background = HU.uMistCol.value.clone();
    scene.fog = new THREE.FogExp2(HU.uMistCol.value.clone(), 0.00035);
    await ctx.yield();

    // ---------------------------------------------------------------- paper screens: each side bay of the hall's open back closes with a pair of
    // ink-washed leaves; they stand ajar as we arrive and slide away into the wall pockets in a wave, the inner leaf first
    // (the centre bay has none). Lattice paper transoms glow over all three bays.
    const ZBK = -56, NS = 4 + 3;
    const sg = new THREE.PlaneGeometry(1, 1), aI = new Float32Array(NS * 4);
    const aIattr = new THREE.InstancedBufferAttribute(aI, 4); aIattr.setUsage(THREE.DynamicDrawUsage); sg.setAttribute('aI', aIattr);
    const screens = new THREE.InstancedMesh(sg, new THREE.ShaderMaterial({ uniforms: { uSky: HU.uSky, uTime: HU.uTime, uGlow: { value: night ? 1.5 : 1.12 }, uTassel: { value: new THREE.Color('#27386e') } },
      vertexShader: SCREEN_VS, fragmentShader: SCREEN_FS, side: THREE.DoubleSide }), NS);
    screens.frustumCulled = false; screens.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(screens);
    const sm = new THREE.Matrix4(), sq = new THREE.Quaternion(), sp = V3(0, 0, 0), ss = V3(1, 1, 1);
    const setI = (i, x, y, z, w, h, kind, idx, swing) => {
      sm.compose(sp.set(x, y, z), sq, ss.set(w, h, 1)); screens.setMatrixAt(i, sm);
      aI[i * 4] = kind; aI[i * 4 + 1] = idx; aI[i * 4 + 2] = swing; aI[i * 4 + 3] = w;
    };
    for (let i = 0; i < 3; i++) setI(4 + i, (i - 1) * 16, 16.65, ZBK + 0.05, 14.2, 2.7, 2, i, 0);
    const sm01 = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    const placeScreens = (u, time) => {
      for (let b = 0; b < 2; b++) for (let j = 0; j < 2; j++) {          // j = 0: the inner leaf, which leads; 1: the outer
        const sx = b ? -1 : 1, p = j ? (u - 0.006) / 0.04 : (u + 0.027) / 0.06;
        let d = (j ? 8 : 16) * sm01(p), sw = 0.2 * Math.sin(time * 1.3 + (b * 2 + j) * 1.7);
        if (p > 1) { const q = (p - 1) * 1.8; d += 0.2 * Math.exp(-5 * q) * Math.sin(26 * q); sw += 0.55 * Math.exp(-2.2 * q) * Math.cos(8 * q); }
        else if (p > 0) sw -= 0.5 * Math.sin(PI * p);
        setI(b * 2 + j, sx * ((j ? 20 : 12) + d), 7.05, ZBK + (j ? 0.6 : 0.72), 8, 14, 0, j * 2 + b, sx * sw);
      }
      screens.instanceMatrix.needsUpdate = true; aIattr.needsUpdate = true;
    };
    placeScreens(0, 0);

    // ---------------------------------------------------------------- mist sheets
    {
      const pos = [], uv = [], as = [], idx = [];
      dyn.mist.forEach((m, i) => {
        const [x, y, z, w, d, a, dr] = m, b = i * 4;
        pos.push(x - w / 2, y, z - d / 2, x + w / 2, y, z - d / 2, x + w / 2, y, z + d / 2, x - w / 2, y, z + d / 2);
        uv.push(0, 0, 1, 0, 1, 1, 0, 1); for (let j = 0; j < 4; j++) as.push(i * 3.7, a, dr, -3.2);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      });
      dyn.bands.forEach((m, i) => {
        const [x0, z0, x1, z1, y0, y1, a, dr] = m, b = pos.length / 3, L = Math.hypot(x1 - x0, z1 - z0);
        pos.push(x0, y0, z0, x1, y0, z1, x1, y1, z1, x0, y1, z0);
        uv.push(0, 0, 1, 0, 1, 1, 0, 1); for (let j = 0; j < 4; j++) as.push(40 + i * 5.3, a, dr, L / 85);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 4)); g.setIndex(idx);
      const mist = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uMistCol: HU.uMistCol, uSky: HU.uSky, uSeam: HU.uSeam, uStrata: HU.uStrata, uTime: HU.uTime, uAmt: { value: (dawn ? 1.3 : golden ? 0.75 : 1) * (night ? 0.7 : 1) * (snow ? 1.15 : 1) } },
        vertexShader: MIST_VS, fragmentShader: MIST_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      mist.frustumCulled = false; mist.renderOrder = 4; root.add(mist);
    }

    // ---------------------------------------------------------------- the deer-scarer's tube and its spill
    const scarer = new THREE.Mesh(dyn.scarer.geo, solid); scarer.position.copy(dyn.scarer.pivot); scarer.rotation.order = 'YXZ'; scarer.rotation.y = dyn.scarer.psi; root.add(scarer);
    const spill = new THREE.Mesh(dyn.spill, solid); scarer.add(spill);
    const uTip = uOf(dyn.scarer.pivot.x, dyn.scarer.pivot.z) - 16 / lp.length;
    const scarerAng = (c) => {
      if (c < 0.55) return 0.38;
      if (c < 0.68) { const t = (c - 0.55) / 0.13; return lerp(0.38, -0.5, t * t); }
      if (c < 0.8) return -0.5 + 0.02 * Math.sin((c - 0.68) * 90);
      if (c < 0.9) return lerp(-0.5, 0.38, smoothstep(0.8, 0.9, c));
      const t = (c - 0.9) / 0.1; return 0.38 - 0.08 * Math.exp(-5 * t) * Math.abs(Math.sin(t * 16));
    };

    // ---------------------------------------------------------------- koi: three rise beside the stones at u 0.70, six cruise along them
    const WY = GY - 0.5, uKoi = 0.7, koi = [];
    const pondSide = (u) => sideOf(u).multiplyScalar(-S);
    const uAtZ = (z) => uOf(-40 * S, z);
    const ringMat = () => new THREE.ShaderMaterial({ uniforms: { uSky: HU.uSky, uTime: HU.uTime, uK: { value: 0 }, uSeed: { value: 0 } }, vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false });
    const ringGeo = new THREE.PlaneGeometry(15, 15); ringGeo.rotateX(-PI / 2);
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(dyn.koi[i % 3], solid); root.add(m);
      const o = { mesh: m, riser: i < 3 };
      if (o.riser) {
        const ub = uKoi + (13 + i * 6) / lp.length, p = pAt(ub), sd = pondSide(ub), tg = lp.tangentAt(ub);
        o.base = V3(p.x + sd.x * (9.4 + i * 2.2), 0, p.z + sd.z * (9.4 + i * 2.2)); o.dir = V3(tg.x * 0.8 - sd.x * 0.6, 0, tg.z * 0.8 - sd.z * 0.6).normalize(); o.uPeak = uKoi + i * 0.011;
        o.ring = new THREE.Mesh(ringGeo, ringMat()); o.ring.material.uniforms.uSeed.value = i * 0.37; o.ring.renderOrder = 3; root.add(o.ring);
      } else {
        const ub = i === 8 ? uAtZ(150) : uAtZ([288, 318, 342, 364, 300][i - 3]), p = pAt(ub), sd = pondSide(ub), lat = i === 8 ? 62 : 13 + ((i * 7) % 5) * 1.6;
        o.base = V3(p.x + sd.x * lat, 0, p.z + sd.z * lat + (i === 8 ? 45 : 0)); o.rad = 4.5 + (i % 4) * 1.3; o.ph = i * 2.1; o.sp = (i % 2 ? 1 : -1) * (0.2 + 0.03 * i);
      }
      koi.push(o);
    }
    if (snow) for (const o of koi) if (!o.riser) o.mesh.visible = false;      // under the ice

    // ---------------------------------------------------------------- the grey heron (rare)
    let heron = null;
    if (rare && dyn.heron) {
      const H = dyn.heron, g = new THREE.Group(), mk = (geo, parent) => { const m = new THREE.Mesh(geo, solid); m.frustumCulled = false; parent.add(m); return m; };
      mk(H.body, g); const legs = mk(H.legs, g); legs.position.set(0, -0.5, -1.2);
      const wl = mk(H.L.inner, g), wr = mk(H.R.inner, g); wl.position.set(0.7, 0.35, 0.5); wr.position.set(-0.7, 0.35, 0.5); wl.scale.z = wr.scale.z = 1.4;
      const ol = mk(H.L.outer, wl), or = mk(H.R.outer, wr); ol.position.set(3, 0, 0); or.position.set(-3, 0, 0);
      root.add(g);
      // It stands in the shallows 22 m off the stones. As we come under the pine it lifts and flies the way we are going, out
      // over the water beyond the pond-side row of props, 21 m ahead of us and 8 m above the eye, banked away from us:
      // we see it three-quarter from behind and below, the pale undersides of its broad wings against the cedars. Past the
      // last frame it pulls ahead, turns in, swoops up with wings spread wide and settles on the lip of the thatch beside
      // the round window while we are still 46 m off, and stands there as we come in under it.
      const u0 = uAtZ(251), u1 = uAtZ(340), tmp = V3(0, 0, 0);
      const posAt = (u, out) => {
        const s = clamp((u - u0) / (u1 - u0), 0, 1);
        const t = (s - 0.6) / 0.4, t2 = t * t, t3 = t2 * t;
        const hz = s < 0.6 ? 270 + 89 * s + 2 * smoothstep(0.03, 0.22, s) : 325.4 * (2 * t3 - 3 * t2 + 1) + 35.6 * (t3 - 2 * t2 + t) + 386.6 * (3 * t2 - 2 * t3);
        const lat = 22 - 6 * smoothstep(272, 300, hz) + 3 * smoothstep(300, 340, hz) - 8.5 * smoothstep(350, 386, hz);
        out.set((-40 - lat) * S, lerp(WY + 4.6, 10, smoothstep(270, 290, hz)) - 0.8 * smoothstep(362, 378, hz) + 6.4 * smoothstep(379.5, 386.6, hz), hz);
        return s;
      };
      heron = { g, legs, wl, wr, ol, or, posAt, tmp, tmp2: V3(0, 0, 0), pos: V3(0, 0, 0), u0, u1 };
    }
    await ctx.yield();

    // ---------------------------------------------------------------- tree frogs
    if (!snow && dyn.frogs.length) {
      const fr0 = rng.fork('frogs'), fr6 = ctx.core.makeRng(ctx.core.hashSeed('veranda6-frogs:' + ctx.seed)), nLive = dyn.frogsLive ?? dyn.frogs.length, P = [], N = [], Cc = [], Hh = [], v = V3(0, 0, 0);
      const parts = [[new THREE.SphereGeometry(1, 7, 5), [0, 0.2, 0], [0.3, 0.2, 0.42]], [new THREE.SphereGeometry(1, 6, 4), [0, 0.3, 0.3], [0.2, 0.15, 0.2]],
        [new THREE.SphereGeometry(1, 5, 3), [0.28, 0.1, -0.2], [0.12, 0.1, 0.3]], [new THREE.SphereGeometry(1, 5, 3), [-0.28, 0.1, -0.2], [0.12, 0.1, 0.3]]].map((q) => [q[0].toNonIndexed(), q[1], q[2], q[0]]);
      for (let fi = 0; fi < dyn.frogs.length; fi++) {
        await ctx.yield();
        const f = dyn.frogs[fi], fr = fi < nLive ? fr0 : fr6;            // the frogs the garden always had keep their own stream
        const an = fr() * 6.28, hd = fr.range(1.1, 2.4), ph = fr() * 20, rate = fr.range(0.16, 0.3), sc = fr.range(0.9, 1.4);
        for (const [g, o, sz] of parts) {
          const pa = g.attributes.position, na = g.attributes.normal;
          for (let i = 0; i < pa.count; i++) {
            P.push((pa.getX(i) * sz[0] + o[0]) * sc, (pa.getY(i) * sz[1] + o[1]) * sc, (pa.getZ(i) * sz[2] + o[2]) * sc);
            v.set(na.getX(i) / sz[0], na.getY(i) / sz[1], na.getZ(i) / sz[2]).normalize(); N.push(v.x, v.y, v.z);
            Cc.push(f[0], f[1], f[2]); Hh.push(an, hd, ph, rate);
          }
        }
      }
      for (const q of parts) { q[0].dispose(); q[3].dispose(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aC', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(Hh, 4));
      const frogs = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: HU.uTime, uSky: HU.uSky, uFrog: { value: new THREE.Color('#8fd23c') } }, vertexShader: FROG_VS, fragmentShader: FROG_FS }));
      frogs.frustumCulled = false; root.add(frogs);
    }

    // ---------------------------------------------------------------- gaze, light, portal, grade
    const len = lp.length, lant = dyn.lantern, tA = V3(0, 0, 0), tP = V3(0, 0, 0), tT = V3(0, 0, 0), gA = V3(0, 0, 0), gB = V3(0, 0, 0), gC = V3(0, 0, 0);
    const ahead = (u, d, side, y, out) => {                          // a point d metres further on, `side` metres to the pond side of the path, in the world's frame
      const uu = clamp(u + d / len, 0, 1); lp.pointAt(uu, tP); lp.tangentAt(uu, tT);
      const l = Math.hypot(tT.x, tT.z) || 1;
      return out.set(-(tP.x - S * tT.z / l * side), y, -(tP.z + S * tT.x / l * side) + Z_IN);
    };
    const uLant = uOf(lant.x, lant.z), uScar = uOf(dyn.scarer.pivot.x, dyn.scarer.pivot.z), uPond = uOf(dyn.pondLamp.x, dyn.pondLamp.z);
    const pois = [
      { at: (t, u) => ahead(u, 60, 0, 1.5, gA), from: 0, to: 0.3, weight: 0.4 },                                  // the lacquer and what hangs in it
      { at: W(V3(lant.x, lant.y + 4.6, lant.z)), from: uLant - 0.19, to: uLant + 0.004, weight: 0.55 },           // the stone lantern, whole, and its flame
      { at: W(dyn.scarer.pivot), from: uScar - 0.085, to: uScar + 0.012, weight: 0.5 },                           // the deer-scarer tipping
      heron ? { at: (t, u) => gB.set(-heron.pos.x, heron.pos.y, -heron.pos.z + Z_IN), from: heron.u0 - 0.05, to: heron.u1 + 0.035, weight: 0.6 }
        : { at: (t, u) => ahead(u, 24, 9, WY, gB), from: uKoi - 0.045, to: uKoi + 0.07, weight: 0.42 },           // koi rising under the stones
    ];
    if (!heron) pois.push({ at: W(dyn.pondLamp), from: uPond - 0.085, to: uPond - 0.004, weight: 0.34 });         // the lit lantern standing in the pond
    for (const o of koi) o.mesh.rotation.order = 'YXZ';
    if (heron) heron.g.rotation.order = 'YXZ';
    HU.uGap.value.copy(snow ? new THREE.Color(0.55, 0.62, 0.68) : nov ? new THREE.Color(0.55, 0.1, 0.045) : new THREE.Color(0.2, 0.5, 0.08)).multiplyScalar(night ? 0.25 : 1);   // what the garden ahead lays along the gallery's boards
    HU.uCorr.value.set(0, 0, 1.2, 1e4);
    // the staged pools of light: on the moss beyond the veranda (seen from the hall and in its floor), over the stones and the pond
    // half way along, on the teahouse front, and in the court on the pond's side of the gallery
    // (each but the teahouse's has its own shaft): the moss slope under the red maple and the open pond, both in the middle
    // distance from the moss; the water beside the stones where the koi rise
    HU.uSunP.value[0].set(22 * S, 150, 26, 1); HU.uSunP.value[1].set(-95 * S, 232, 32, 1); HU.uSunP.value[2].set(-40 * S, 374, 30, 0.9); HU.uSunP.value[3].set(-25 * S, -76, 13, 1);
    HU.uSunP.value[4].set(8 * S, 230, 23, 1); HU.uSunP.value[5].set(-60 * S, 276, 24, 0.9);
    // flames that light what is near them: [1] and [4] the two pairs of hanging lanterns in the gallery, [2] the court lantern, [3] the great lantern ([0] is the hall's paper lamp)
    const lampK = night ? 1.7 : 1, lampAt = [null, V3(0, 12.6, -74), dyn.courtLamp, V3(lant.x, lant.y + 9.5, lant.z), V3(0, 12.6, -98)], lampW = [HU.uLamps.value[0].w, 1.7 * lampK, 0.9 * lampK, 1.0 * lampK, 1.3 * lampK];
    for (let i = 1; i < 5; i++) HU.uLamps.value[i].set(lampAt[i].x, lampAt[i].y, lampAt[i].z, lampW[i]);
    const exposure = night ? 2.3 : dawn ? 1.1 : snow ? 0.98 : 1.0;

    return {
      scene, path, duration: 42,
      // linger over the lacquer, a touch quicker through the open garden, unhurried to the window
      pace: (u) => 1 - 0.3 * Math.exp(-((u - 0.15) / 0.11) * ((u - 0.15) / 0.11)) + 0.1 * smoothstep(0.34, 0.5, u) * (1 - smoothstep(0.8, 0.9, u)),
      title: snow ? 'The Long Rain, Turning to Snow' : nov ? 'The Long Rain, November' : 'The Long Rain',
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 22, sway: 0.45, bank: 0.5 },
      pois,
      portal: { shape: 'circle', radius: 7, color: nov ? '#e8efe2' : '#dcf2e2', glow: 0.75, revealDistance: 300 },
      post: { exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 0.8 },
        grade: { saturation: nov ? 1.08 : 1.07, contrast: 1.03, tint: night ? '#e6edff' : '#f5faf4', shadowTint: night ? '#182238' : '#22302a', vignette: 0.26, grain: 0.02, aberration: 0 } },
      ride: 'none', companion: 'none',
      update(dt, time, camera, u = 0) {
        placeScreens(u, time);
        hero.setMist(lerp(mistBase * 0.45, mistBase, smoothstep(0.02, 0.3, u)));
        hero.setProgress(u);
        for (let i = 0; i < 5; i++) HU.uLamps.value[i].w = lampW[i] * (0.86 + 0.14 * Math.sin(time * 9.1 + i * 2.3) * Math.sin(time * 5.3 + i));    // the flames breathe
        // the deer-scarer fills, tips, spills and knocks back: on its own clock far away, on u as the camera comes by
        const cT = (time / 7) % 1, cU = 0.55 + 0.45 * clamp((u - (uTip - 0.012)) / 0.042, 0, 1);
        const wU = smoothstep(uTip - 0.1, uTip - 0.06, u) * (1 - smoothstep(uTip + 0.06, uTip + 0.1, u)), cc = wU > 0.5 ? cU : cT;
        scarer.rotation.x = lerp(scarerAng(cT), scarerAng(cU), wU);
        spill.visible = cc > 0.64 && cc < 0.84;
        for (const o of koi) {
          const m = o.mesh;
          if (o.riser) {
            const k = bell((u - o.uPeak) / 0.05), adv = (u - o.uPeak) * 66, sg = o.uPeak * 90;
            m.position.set(o.base.x + o.dir.x * adv, WY - 1.5 + 1.2 * k + 0.05 * Math.sin(time * 1.7 + sg), o.base.z + o.dir.z * adv);
            m.rotation.set(-0.14 * k * Math.sign(o.uPeak - u), Math.atan2(o.dir.x, o.dir.z) + 0.1 * Math.sin(time * 2.6 + sg), 0.22 * Math.sin(time * 1.1 + sg) * k);
            o.ring.position.set(m.position.x, WY + 0.07, m.position.z); o.ring.material.uniforms.uK.value = k; o.ring.visible = k > 0.02;
          } else if (m.visible) {
            const a = o.ph + time * o.sp;
            m.position.set(o.base.x + Math.cos(a) * o.rad, WY - 0.36 + 0.1 * Math.sin(time * 0.9 + o.ph), o.base.z + Math.sin(a) * o.rad);
            m.rotation.y = Math.atan2(-Math.sin(a) * o.sp, Math.cos(a) * o.sp) + 0.1 * Math.sin(time * 2.4 + o.ph);
          }
        }
        if (heron) {
          const h = heron, s = h.posAt(u, h.pos), hz = h.pos.z, du = 0.004;
          // heading from where it is going (frozen over the last metres, where it barely moves); banked away over the water, then in
          const ur = clamp(u, h.u0, h.u0 + 0.975 * (h.u1 - h.u0));
          h.posAt(ur, h.tmp); h.posAt(ur + du, h.tmp2);
          const dx = h.tmp2.x - h.tmp.x, dy = h.tmp2.y - h.tmp.y, dz = h.tmp2.z - h.tmp.z, yawF = Math.atan2(dx, dz);
          const fly = smoothstep(0, 0.06, s) * (1 - smoothstep(0.985, 1, s)), flare = smoothstep(380.5, 384.5, hz) * fly;
          const climb = clamp(dy / Math.max(Math.hypot(dx, dz), 1e-3), -0.4, 0.8);
          h.g.position.copy(h.pos);
          h.g.rotation.set(lerp(lerp(-0.85, -0.04 - 0.5 * climb, fly), -0.95, flare), lerp(lerp(0.9 * S, yawF, smoothstep(0, 0.05, s)), -1.75 * S, smoothstep(0.96, 1, s)), S * (0.4 * smoothstep(0.08, 0.24, s) * (1 - smoothstep(338, 356, hz)) - 0.3 * smoothstep(352, 368, hz)) * fly * (1 - flare));
          h.legs.rotation.x = lerp(lerp(-0.77, 0.04, fly), -0.9, flare);
          const ph = 6.2832 * (hz - 252) / 16 - 1.5708, a = lerp(0.1 + 0.36 * Math.sin(ph), 0.44 + 0.12 * Math.sin(time * 9), flare), b = lerp(0.42 * Math.sin(ph - 1.0) - 0.1, 0.12, flare);
          h.wl.rotation.z = lerp(-1.3, a, fly); h.wr.rotation.z = -h.wl.rotation.z;
          h.ol.rotation.z = lerp(2.3, b, fly); h.or.rotation.z = -h.ol.rotation.z;
          h.g.position.y += 0.5 * fly * (1 - flare) * Math.sin(ph - 1.6);
        }
        hero.update(dt, time, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
