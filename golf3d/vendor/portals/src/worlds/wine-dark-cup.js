// The Wine-Dark Cup: the inside of a Greek drinking cup a kilometre wide, painted in black-figure, that turns
// itself inside out into red-figure as we round the Vine Ship. Attic vase painting: two substances (matte clay,
// mirror glaze), two added colours (chalk white, wine purple), lines as relief, figures as thick slabs standing
// on real ring-ledges, no light but the kiln bar, no fog, no shadow. Everything is shaded by the one style kit
// in ../parts/wine-dark-cup.js (makeStyle), so the whole world is in one hand.
//
// LAYOUT  cup axis = world origin = the Vine Ship's mast foot. Sea y 0, r <= 200. Wall: rays riser r 200-243,
//   lower ledge y 42 (r 243-252, the horses), frieze ground, tongues r 300-318, upper ledge y 104 (r 318-327, the cranes),
//   the lip r 340-392 flaring from y 120 up to y 134 (so the bowl is seen over its edge from the entry, which is on
//   the key meander at r 386, on two launching rails 9 m above it, oars shipped: from there, and from behind the entry
//   through the previous world's portal, the hull stands whole on the sea under the sail and the keys lie in both lower
//   corners). We run in straight at the axis (the ship broadside, the sail between our horns), slide
//   down a slipway that bridges the ledges, thread the fleet, round the ship on the hero's fly-through arc (r 80),
//   cross the sea and climb the far slipway into the handle loop between its palmettes.
// THE REVERSAL  two lines (style.setFront / setFront2): one lies still beyond the ship (far wall already red-figure),
//   the other stands square to the keel and creeps along the hull from stern to bow over u 0.53-0.63 (see frontAt),
//   while a point of interest holds the join in the middle of the frame and pace() lingers.
// THE VINE  the hero's canopy is bent here into a vault (crown y 185 at r 262, brim y 148 at r 305); its hoop and
//   weeping shoots (built in the part) are the wreath across the kiln field at the entry. Since the fourth version a runner
//   of the same plant lies round the whole brim beyond them (r 312, y 164) with 36 shoots over the crown, tendrils, leaves
//   and bunches (the block at the end of the vine's lift below): it is what hangs in the upper half of the frame on the climb.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { buildHero, makeStyle } from '../parts/wine-dark-cup.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// the bowl profile (r, y) from the waterline to the outer edge of the lip; one entry per painted band
const LIP_TOP = 134, lipY = (r) => 120 + (LIP_TOP - 120) * clamp((r - 340) / 52, 0, 1);
const WALL = [
  { id: 0, r0: 200, y0: 0, r1: 243, y1: 42, ring: 0 },      // rays
  { id: 1, r0: 243, y0: 42, r1: 252, y1: 42, ring: 1 },     // crane ledge (groundline)
  { id: 2, r0: 252, y0: 42, r1: 300, y1: 80, ring: 1 },     // frieze ground behind the cranes, ivy band on top; the great eyes lie on it
  { id: 4, r0: 300, y0: 80, r1: 318, y1: 104, ring: 3 },    // tongues
  { id: 1, r0: 318, y0: 104, r1: 327, y1: 104, ring: 2 },   // horse ledge, just under the lip: we enter 16 m above it
  { id: 3, r0: 327, y0: 104, r1: 340, y1: 120, ring: 2 },   // frieze ground behind the horses, lotus band on top
  { id: 5, r0: 340, y0: 120, r1: 392, y1: LIP_TOP, ring: 4 },   // the lip, flaring up and outward like a kylix's: key meander (does not turn)
  { id: 6, r0: 392, y0: LIP_TOP, r1: 396, y1: 60, ring: 4 },    // the outside of the cup, plain
];
const ORBIT = 80, ARC0 = 140 * D2R, ARC1 = 270 * D2R, CAM_H = 2.5;
const HANDLE_AZ = -40 * D2R;                                 // where the handle stands on the rim
const FAR_EYES_AZ = -117 * D2R;                              // the pair of eyes on the far wall, seen from the entry
const FRONT_N = [0.17, -0.985], FRONT_REST = 104;              // the line that lies across the sea beyond the ship: night where dot(xz, n) > d
const LAUNCH = 9;                                            // the launching ramp's height over the lip where we start
const R_START = 382;                                         // we enter on the lip, on the key meander

// The course in plan, as a dense polyline with running distance, then its height profile.
function layoutCourse(rare) {
  // built backwards from the start of the arc: 50 m straight, a 30 degree bend (leftward as flown) over 90 m of
  // sea, then straight out to the lip, so that from the entry the Vine Ship stands dead ahead between our horns
  const head = [-Math.sin(ARC0), Math.cos(ARC0)], rgt = [-head[1], head[0]];
  // the bend is solved so that the run-in from the lip points exactly at the axis: the sail stands between our horns
  const lay = (bend) => {
    let p = [Math.cos(ARC0) * ORBIT, Math.sin(ARC0) * ORBIT], s = 0; const back = [p];
    while (Math.hypot(p[0], p[1]) < R_START && s < 700) {
      for (let j = 0; j < 3; j++) {
        const dl = bend * sstep(50, 140, s + 1), c = Math.cos(dl), sn = Math.sin(dl);
        p = [p[0] - (head[0] * c + rgt[0] * sn) * 2, p[1] - (head[1] * c + rgt[1] * sn) * 2]; s += 2;
      }
      back.push(p);
    }
    const q = back[back.length - 2], l = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
    return { back, s, miss: (p[0] * (p[1] - q[1]) - p[1] * (p[0] - q[0])) / l };
  };
  let b0 = 20 * D2R, b1 = 50 * D2R; const m0 = lay(b0).miss;
  for (let i = 0; i < 24; i++) { const bm = (b0 + b1) / 2; if (lay(bm).miss * m0 > 0) b0 = bm; else b1 = bm; }
  const { back, s } = lay((b0 + b1) / 2);
  const pts = back.reverse(), dArc0 = s;
  for (let a = 145; a <= 270.01; a += 5) pts.push([Math.cos(a * D2R) * ORBIT, Math.sin(a * D2R) * ORBIT]);
  // the bend onto the handle's axis: a quadratic from the end of the arc to r 150 on the radial line
  const hd = [Math.cos(HANDLE_AZ), Math.sin(HANDLE_AZ)], p0 = [0, -ORBIT], p2 = [hd[0] * 150, hd[1] * 150];
  const k = (p2[1] - p0[1]) / hd[1], p1 = [p2[0] - hd[0] * k, p0[1]];
  for (let i = 1; i <= 14; i++) { const t = i / 14, u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); }
  for (let r = 158; r <= 374.01; r += 8) pts.push([hd[0] * r, hd[1] * r]);
  const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const dArc1 = dArc0 + ORBIT * (ARC1 - ARC0);
  let dClimb = 0; for (let i = 0; i < pts.length; i++) if (d[i] > dArc1 && Math.hypot(pts[i][0], pts[i][1]) >= 134.9) { dClimb = d[i]; break; }
  const xAtR = (R) => { for (let i = 1; i < pts.length; i++) { const r0 = Math.hypot(pts[i - 1][0], pts[i - 1][1]), r1 = Math.hypot(pts[i][0], pts[i][1]); if (r1 <= R) return d[i - 1] + (d[i] - d[i - 1]) * clamp((r0 - R) / Math.max(r0 - r1, 1e-6), 0, 1); } return 0; };
  const xE = xAtR(366), xL = xAtR(330), xH = xAtR(247.5), yIn = lipY(Math.hypot(pts[0][0], pts[0][1])) + CAM_H, xF = xAtR(172), total = d[d.length - 1];
  const lift = rare ? 12 : 0;                                // the pouring lifts the sea 12 m as the arc begins
  const seaAt = (x) => lift * sstep(dArc0 - 40, dArc0 + 30, x);
  const raw = (x) => {
    if (x < xL) return lerp(yIn + LAUNCH, 122, clamp(x / xL, 0, 1));            // down the launching ramp that stands on the lip: the bowl is seen over its edge, hull and all
    // steep over the cranes and tongues, 14 m above the horse ledge, then out onto the sea outside every sea ring
    const down = x < xH ? lerp(122, 62.5, (x - xL) / (xH - xL)) : lerp(62.5, CAM_H, (x - xH) / (xF - xH));
    const up = CAM_H + (x - dClimb) * 0.64;
    return Math.max(down, up, seaAt(x) + CAM_H);
  };
  const yAt = (x) => {                                       // rounded kinks; the last 70 m keep the climb's slope
    if (x < 3 || x > total - 75) return raw(x);
    let sum = 0; for (let j = -4; j <= 4; j++) sum += raw(x + j * 4.5); return sum / 9;
  };
  const p3 = pts.map((q, i) => [q[0], yAt(d[i]), q[1]]);
  return { p3, d, total, dArc0, dArc1, dClimb, seaAt, yAt, head, hd, xL, xH, xF };
}

export default {
  id: 'wine-dark-cup',
  name: 'The Wine-Dark Cup',
  category: 'ocean',
  weirdness: 0.6,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    // ---- the seeded look (all draws up front, in a fixed order)
    const hour = vary.hour || 'any', rare = !!vary.rare, density = vary.density ?? 1;
    const startNight = hour === 'night';
    const warm = hour === 'dawn' || hour === 'golden';
    const colourway = rng.pick(['orange', 'orange', 'coral', 'white', 'orange', 'coral']);
    const castHorse = rng.pick(['horse', 'deer', 'goat', 'horse']);
    const castBird = rng.pick(['crane', 'swan', 'crane']);
    const castFish = rng.pick(['tunny', 'cuttle', 'tunny']);
    const wheel = rng.pick(['counter', 'counter', 'oneway', 'slowing']);
    const brows = rng.chance(0.5);
    const hex = ['#D8703A', '#0D0B0A', '#EDE4D0', '#6B2342', '#7A4322', '#F0A868'];
    if (colourway === 'white') { hex[0] = '#DCCBA6'; hex[5] = '#EFB47A'; }
    if (warm) hex[5] = '#F2A27C';
    const style = makeStyle(ctx, { palette: hex, startNight });
    if (warm) style.ink.bar.multiply(new THREE.Color(1.0, 0.86, 0.84));
    if (colourway === 'white') style.ink.clay.copy(new THREE.Color('#D6C49C')).multiply(new THREE.Color(1.1, 1.02, 0.96));   // chalk slip over the clay, a little buff
    const U = style.uniforms;
    const C = layoutCourse(rare);
    const path = makePath(C.p3);
    const duration = 46;
    const uOf = (dist) => dist / C.total;
    const uArc0 = uOf(C.dArc0), uArc1 = uOf(C.dArc1), uClimb = uOf(C.dClimb);
    const disposables = [];
    const group = (parent = scene) => { const g = new THREE.Group(); parent.add(g); return g; };
    const mesh = (geo, mat, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; parent.add(m); return m; };
    await ctx.yield();
    // ---- the pot wall: every band is drawn in polar coordinates by one material; each ring-ledge turns by
    //      its own angle (uRingA), the lip, the slipways and the handle stay with us
    const WALL_VERT = /* glsl */`
      attribute float aBand; attribute float aT; attribute float aLen; attribute float aRing;
      uniform float uRingA[5];
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vBand; varying float vM; varying float vLen; varying float vAng;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * normal; vUv = uv;
        vBand = aBand; vLen = aLen; vM = aT * aLen; vAng = uRingA[int(clamp(aRing, 0., 4.) + 0.5)];
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`;
    const WALL_FRAG = /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vBand; varying float vM; varying float vLen; varying float vAng;
      uniform vec4 uBrush;      // azimuth of the brush tip (world), extent of the laid band (rad), reload phase 0..1, ring 0 angular speed (rad/s)
      uniform float uWhiteGround; uniform float uSeam;
      ${style.glsl}
      float sdBox(vec2 p, vec2 a, vec2 b){ vec2 c = 0.5 * (a + b), h = 0.5 * abs(b - a); vec2 d = abs(p - c) - h; return max(d.x, d.y); }
      // coverage of a shape from its distance d (m): filtered across the edge itself (its own screen gradient), so an
      // edge stays crisp at grazing angles; pm (the pixel's mean size on the surface) only bounds it at cell seams
      float cov(float d, float pm){ float w = clamp(0.75 * length(vec2(dFdx(d), dFdy(d))), 1e-4, 4. * pm); return 1. - smoothstep(-w, w, d); }
      // a drawn line of half width hw about x = 0: never thinner than 1.6 pixels, so it cannot break into dashes
      float lin(float x, float hw, float pm){ float w = clamp(0.75 * length(vec2(dFdx(x), dFdy(x))), 1e-4, 6. * pm); float h = max(hw, 1.1 * w); return 1. - smoothstep(h - w, h + w, abs(x)); }
      void main(){
        vec3 N = vN / max(length(vN), 1e-5);
        vec3 V = cameraPosition - vW; float vl = max(length(V), 1e-4); V /= vl;
        float pm = max(sqrt(length(dFdx(vW)) * length(dFdy(vW))), 1e-4) * 0.8;
        float r = max(length(vW.xz), 1.);
        float thw = atan(vW.z, vW.x + (vW.x < 0. ? -1e-4 : 1e-4));
        float th = thw + vAng;
        float arc = th * r;                                   // metres round the band
        float m = vM, b = floor(vBand + 0.5);
        float fig = 0., purple = 0., white = 0., dry = 0.;
        if (b < 0.5) {                                        // rays, then the band the brush is laying
          float cells = 126.; float sc = th * 0.15915494 * cells; float x = fract(sc); float cw = 6.2831853 * r / cells;
          float k = clamp(1. - m / 43., 0., 1.);
          float d = (abs(x - 0.5) - 0.46 * k) * cw;
          float ray = cov(d, pm) * step(m, 43.);
          fig = mix(ray, 0.92 * k * step(m, 43.), smoothstep(0.3 * cw, 0.9 * cw, pm));
          fig = max(fig, cov(abs(m - 0.8) - 0.8, pm));
          fig = max(fig, cov(abs(m - 46.) - 0.45, pm));
          float dn = mod(thw - uBrush.x + 12.5663706, 6.2831853);          // angle downstream of the brush (ring 0 runs toward +theta)
          float inb = cov(abs(m - 53.) - 4.7, pm) * step(dn, uBrush.y) * smoothstep(0., 0.012, dn);
          float age = dn / max(uBrush.w, 1e-4);                             // seconds since this stretch was laid
          float load = fract(uBrush.z - age / 9.);
          float lr = smoothstep(0.64, 1., load);                             // 0 wet from the dip .. 1 the brush run dry
          float sn = wdcN(vec2(arc * 0.035, m * 3.3)); float sfw = clamp(fwidth(sn), 0.01, 0.3);
          dry = inb * smoothstep(1.05 - 0.8 * lr - sfw, 1.05 - 0.8 * lr + sfw, sn);
          inb *= 1. - smoothstep(1.5 - 0.85 * lr - sfw, 1.5 - 0.85 * lr + sfw, sn);     // and at the very end it skips: bare clay between the hairs
          fig = max(fig, inb);
        } else if (b < 1.5) {                                 // a ledge: the groundline
          fig = lin(m - 1.1, 0.9, pm) + lin(m - vLen + 0.5, 0.3, pm);
        } else if (b < 3.5) {                                 // frieze grounds with an ivy (2) or lotus (3) band at the top
          float os = b < 2.5 ? 1. : 0.55; float top = vLen - (b < 2.5 ? 3. : 1.2); float c0 = top - 5. * os; float pmo = pm / os;
          fig = lin(m - top, 0.4, pm) + lin(m - (top - 10. * os), 0.4, pm) + lin(m - 1.6, 0.35, pm);
          float sp = b < 2.5 ? 7. : 6.; float cells = floor(6.2831853 * r / (sp * os)); float sc = th * 0.15915494 * cells;
          float ci = floor(sc); float x = (fract(sc) - 0.5) * sp; float y = (m - c0) / os; float alt = mod(ci, 2.) < 0.5 ? 1. : -1.;
          float orn;
          if (b < 2.5) {                                      // ivy: a stem with heart leaves alternately above and below
            float leaf = length(vec2(x * 0.85, (y - alt * 2.3) * (1. + 0.35 * sign(y * alt - 2.3)))) - 1.75;
            orn = max(cov(leaf, pmo), cov(abs(y - 0.5 * sin(sc * 3.14159)) - 0.22, pmo));
            orn = max(orn, cov(sdBox(vec2(x, y), vec2(-0.2, min(0., alt * 0.8)), vec2(0.2, max(0., alt * 0.8))), pmo));
          } else {                                            // lotus: tall pointed buds and dots, linked by arcs
            float bud = max(abs(x) - 1.7 * clamp(1. - (y + 1.) / 5., 0., 1.) * smoothstep(-4.4, -2.2, y), abs(y) - 4.);
            float dotd = length(vec2(abs(x) - sp * 0.5, y + 2.6)) - 0.8;
            orn = max(cov(bud, pmo), cov(dotd, pmo));
            orn = max(orn, cov(abs(length(vec2(abs(x) - sp * 0.5, y + 3.4)) - sp * 0.5) - 0.2, pmo) * step(y, -3.2));
          }
          fig = max(fig, mix(orn, 0.3, smoothstep(0.5, 1.6, pmo)) * step(abs(y), 4.6));
          fig = min(fig, 1.);
        } else if (b < 4.5) {                                 // tongues, alternately black and wine purple
          float sp = 9.; float cells = floor(6.2831853 * r / sp); float sc = th * 0.15915494 * cells;
          float ci = floor(sc); float x = (fract(sc) - 0.5) * sp; float y = m - 2.2;
          float hw = sp * 0.37; float tl = vLen - 5.6;
          float d = y < hw ? length(vec2(x, y - hw)) - hw : max(abs(x) - hw, y - tl);
          float tongue = cov(d, pm);
          fig = mix(tongue, 0.72 * step(0., y) * step(y, tl), smoothstep(0.25 * sp, 0.7 * sp, pm));
          purple = fig * step(0.5, mod(ci, 2.)) * (1. - smoothstep(0.4 * sp, 0.9 * sp, pm) * 0.5);
          fig = max(fig, cov(abs(m - vLen + 1.6) - 0.5, pm));
        } else if (b < 5.5) {                                 // the lip: key meander, 12 m keys, with border lines and a dot row
          float sp = 12.; float cells = 6.2831853 * 370. / sp + 0.41;
          float tk = mod(thw - uSeam + 12.5663706, 6.2831853);              // the band was begun at uSeam and closes there: the last key does not fit
          float sc = tk * 0.15915494 * cells;
          vec2 q = vec2(fract(sc), (m - 27.) / 12.); float t = 0.085;
          q.y += 0.035 * step(cells - 1., sc);                                // and the hand has drifted by the time it comes round
          float d = sdBox(q, vec2(-t, 0.), vec2(t, 1.));
          d = min(d, sdBox(q, vec2(0., 1. - 2. * t), vec2(0.74, 1.)));
          d = min(d, sdBox(q, vec2(0.74 - 2. * t, 0.3), vec2(0.74, 1.)));
          d = min(d, sdBox(q, vec2(0.34, 0.3), vec2(0.74, 0.3 + 2. * t)));
          d = min(d, sdBox(q, vec2(0.34, 0.3), vec2(0.34 + 2. * t, 0.66)));
          d = min(d, sdBox(q, vec2(1. - t, 0.), vec2(1. + t, 1.)));
          d = min(d, sdBox(q, vec2(0.74, 0.), vec2(1., 2. * t)));
          float inK = step(0., q.y) * step(q.y, 1.);
          float key = cov(d * sp, pm) * inK;
          fig = mix(key, 0.45 * inK, smoothstep(1.2, 4.5, pm));
          fig = max(fig, lin(m - 24.6, 0.7, pm) + lin(m - 41.4, 0.7, pm) + lin(m - 44., 0.3, pm) + lin(m - 21.6, 0.3, pm) + lin(m - 3., 0.3, pm) + lin(m - 7.2, 0.5, pm));
          float sc2 = thw * 0.15915494 * floor(6.2831853 * 354. / 5.); vec2 dq = vec2((fract(sc2) - 0.5) * 5., m - 14.5);
          fig = max(fig, mix(cov(length(dq) - 1.5, pm), 0.28 * step(abs(dq.y), 1.5), smoothstep(0.8, 2.5, pm)));
          fig = max(fig, step(vLen - 4., m));                  // the glazed rim
          fig = min(fig, 1.);
        } else if (b < 6.5) { fig = 1.; float sn = wdcN(vec2(arc * 0.014, m * 2.1)); dry = 0.7 * smoothstep(0.66, 0.7, sn);
        } else {                                              // a slipway: uv = metres along, metres across from the centre
          float a = abs(vUv.y); float L = 9.;
          float sc = vUv.x / L; vec2 q = vec2(fract(sc) * L, a - 3.4);
          float base = abs(q.y - 0.4) - 0.5;
          float curl = max(length(q - vec2(5.2, 2.5)) - 1.9, -(length(q - vec2(6.1, 2.0)) - 1.15));
          float back = max(q.y - (0.9 + 2.6 * clamp(q.x / 4.4, 0., 1.) * clamp(q.x / 4.4, 0., 1.)), q.x - 4.4);
          float wv = cov(min(base, min(curl, max(back, -q.y))), pm);
          fig = mix(wv, 0.4 * step(3.3, a) * step(a, 7.8), smoothstep(0.8, 3., pm));
          fig = max(fig, cov(abs(a - 7.4) - 0.6, pm));
          // a band of lengthwise stripes down the keel line, between two fine lines (never squares along the direction of
          // travel: at 20 m/s a 1.1 m chequer alternates nine times a second under the camera)
          float cq = sin(3.14159265 * vUv.y / 1.1); float cqw = clamp(fwidth(cq), 1e-3, 1.);
          float chq = smoothstep(-cqw, cqw, cq) * step(a, 2.2);
          fig = max(fig, mix(chq, 0.5 * step(a, 2.2), smoothstep(0.35, 1.1, pm)));
          fig = max(fig, lin(a - 2.75, 0.16, pm));
          fig = min(fig, 1.);
        }
        if (fig > 0.001 && b > 0.5 && b < 5.5) {                 // the dry brush: streaks along the band, never a wash
          float sn = wdcN(vec2(arc * 0.014 + b * 7., m * 4.3)); float sfw = clamp(fwidth(sn), 0.01, 0.3);
          dry = 0.75 * smoothstep(0.76 - sfw, 0.76 + sfw, sn) * (1. - smoothstep(0.5, 1.5, pm));
        }
        vec3 col = wdcResolve(fig, 0., white, purple, dry, vW, N, N, V, b > 5.5 ? -1. : 1.);
        gl_FragColor = vec4(col, 1.);
      }`;
    const ringA = new Float32Array(5);
    const wallMat = new THREE.ShaderMaterial({
      vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, side: THREE.DoubleSide,
      uniforms: Object.assign({}, U, { uRingA: { value: ringA }, uBrush: { value: new THREE.Vector4(0, 1, 0, 0.02) }, uWhiteGround: { value: colourway === 'white' ? 1 : 0 }, uSeam: { value: Math.atan2(C.p3[0][2], C.p3[0][0]) - 13 / 370 } }),
    });
    wallMat.extensions.derivatives = true;
    {
      const SEG = 200, P = [], Nn = [], Bd = [], T = [], Ln = [], Rg = [], UV = [], idx = [];
      for (const w of WALL) {
        const len = Math.hypot(w.r1 - w.r0, w.y1 - w.y0), nr = -(w.y1 - w.y0) / len, ny = (w.r1 - w.r0) / len, k0 = P.length / 3;
        for (let j = 0; j <= 1; j++) for (let i = 0; i <= SEG; i++) {
          const a = (i / SEG) * TAU, r = j ? w.r1 : w.r0, y = j ? w.y1 : w.y0;
          P.push(Math.cos(a) * r, y, Math.sin(a) * r); Nn.push(Math.cos(a) * nr, ny, Math.sin(a) * nr);
          Bd.push(w.id); T.push(j); Ln.push(len); Rg.push(w.ring); UV.push(0, 0);
        }
        for (let i = 0; i < SEG; i++) { const a = k0 + i, b = a + 1, c = a + SEG + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aBand', new THREE.Float32BufferAttribute(Bd, 1));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 1)); g.setAttribute('aLen', new THREE.Float32BufferAttribute(Ln, 1));
      g.setAttribute('aRing', new THREE.Float32BufferAttribute(Rg, 1)); g.setIndex(idx);
      mesh(g, wallMat);
    }
    const dome = style.kilnDome(); scene.add(dome);
    dome.material.uniforms.uRim.value.set(392, LIP_TOP); dome.material.uniforms.uKilnAvoid.value = HANDLE_AZ;
    await ctx.yield();
    const RING_R = [221, 247, 322.5, 309, 366], RING_V = [4.2, -5.2, -3.6, 3.0, 0];     // rays, cranes, horses, tongues, lip: neighbours turn against each other
    const ringAng = [0, 0, 0, 0, 0];
    const ringRate = [0, 0, 0, 0, 0];                       // each ring's turn in radians a second as it is now (the cranes' lift-off law reads it)
    const ringGroups = [];                                  // { g, ring, k } groups that turn with a ring-ledge
    // ---- the hero: the Vine Ship at the axis, with its sea of running-wave rings and its mirrored hull
    const ticks = [];                                       // (dt, time, camera, u) => void, run in order by update()
    const hero = await buildHero(ctx, { style, detail, mirror: true, spin: 0.006, kiln: false, leaves: Math.round(1150 * clamp(density, 0.8, 1.15)) });
    scene.add(hero.object);
    const seaMat = hero.parts.sea.material;
    // the vine is lifted above the rim (a second sky over the whole cup, seen from below even from the lip), and the
    // bunches that would hang into the slipways' air (outside r 255) are taken off, so the canopy can turn freely
    {
      // a vault, not a funnel: it climbs from the ship to a crown 185 m up at r 262 and weeps down again to a brim
      // above the ledges, so that from the lip its underside is turned toward us and reads as a lattice, not a line
      const lift = (x, z) => { const r = Math.hypot(x, z); return 88 * sstep(90, 262, r) - 37 * sstep(264, 306, r); };
      const vp = hero.parts.vine.geometry.getAttribute('position');
      for (let i = 0; i < vp.count; i++) { vp.setY(i, vp.getY(i) + lift(vp.getX(i), vp.getZ(i))); if (i % 2500 === 2499) await ctx.yield(); }
      vp.needsUpdate = true;
      await ctx.yield();
      const lm = hero.parts.leaves, mt = new THREE.Matrix4(), z0 = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < lm.count; i++) { lm.getMatrixAt(i, mt); mt.elements[13] += lift(mt.elements[12], mt.elements[14]); lm.setMatrixAt(i, mt); }
      lm.instanceMatrix.needsUpdate = true;
      const dm = hero.parts.discs, pv = dm.geometry.getAttribute('aPivot');
      // bunches are 41 instances each (the stalk first); long stalks are shortened so that no bunch hangs into the
      // line of sight from the lip to the sail (the canopy turns, so this holds at every azimuth)
      const bi = hero.anchors.bunches, E0 = C.p3[0]; let E = 0, st2 = 0, gone = false;
      for (let i = 0; i < dm.count; i++) {
        const px = pv.getX(i), pz = pv.getZ(i), r = Math.hypot(px, pz), L = lift(px, pz), b = bi[Math.floor(i / 41)];
        if (i % 41 === 0 && b) {
          // nothing hangs into the slipways' air nor across the sight line from the lip to the sail: the stalk is
          // shortened, and a bunch that still hangs too low is taken off
          const stalk = pv.getY(i) - b.top, sight = LIP_TOP + 4 - 0.132 * (R_START + 4 - r);
          // from the entry (the picture in the previous world's portal) the outer bunches hang against the kiln field only,
          // above the far rim; and in the strip between the eye and the sail nothing hangs lower than 4 m over the sail's top
          const ez = E0[2] - pz, ex = px - E0[0], dE = Math.hypot(ex, ez), strip = Math.abs(ex) < 44 * dE / 386, sailLine = E0[1] - 0.137 * dE + 4;
          const lat = Math.atan2(ex, Math.max(ez, 1)) / D2R, win = false && lat > 0;                       // (a wider window round the far eye was tried: it cost the bunches over the bow in the hero frames)
          const floorY = Math.max(r > 200 || win ? E0[1] + 2 : sight, strip ? sailLine : 0), need = floorY - (b.bottom + L);
          E = r > 95 || strip ? clamp(need, 0, Math.max(0, stalk - 2)) : 0; st2 = stalk - E;
          gone = (r > 200 || strip || win) && need > E + 0.5;
        }
        if (gone) { dm.setMatrixAt(i, z0); continue; }
        dm.getMatrixAt(i, mt);
        if (i % 41 === 0 && b) {
          mt.elements[5] = st2 / 2 + 0.9; mt.elements[13] = pv.getY(i) + L - st2 / 2 - 0.3;
        } else mt.elements[13] += L + E;
        dm.setMatrixAt(i, mt); pv.setY(i, pv.getY(i) + L);
        if (i % 800 === 799) await ctx.yield();
      }
      dm.instanceMatrix.needsUpdate = true; pv.needsUpdate = true;
      // ---- (the fourth version, hand round "wreath") THE BRIM'S WREATH: more of the one plant, all the way round, so the
      //      runner has no end and nothing here is a clock. A runner lies round the whole brim; 36 shoots begin as free ends
      //      2.4 to 13.5 m inside the hoop (between the arms: the hoop's wave is the part's dice and is not known here), cross
      //      the hoop touching it, climb over the crown of the vault and weep down to the runner, leaning by turns; each ends
      //      past the runner in its tendril. Leaves, bunches and tendrils are the vine's own. No dice are drawn (a fixed hash);
      //      no live line is touched. Typed here: RUN_Y 164, the first whole metre at which the bunches under the runner clear
      //      the cranes that climb under it (by 1.1 to 1.8 m on the seeds counted, 0.6 m with every bird dealt its highest);
      //      it does not follow the flock's line. 99.4 is the level of the part's hoop; the 0.6 m over 22 m of radius is this
      //      block's own (the part's weeping shoots rise 0.4, 0.9 or 1.4 m over their first 22 m of length). Leaves and
      //      bunches thin with detail; the ribbons do not.
      {
        const hsh = (i, k) => { const q = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return q - Math.floor(q); };
        const NSH = 36, IN_R = 216, RUN_R = 312, RUN_Y = 164, floorY = E0[1] + 2, dq = clamp(detail, 0.5, 1);
        const V3 = (x, y, z) => new THREE.Vector3(x, y, z), arms = [];
        const hd = (A, i) => { const n = A.P.length, a = A.P[Math.max(i - 1, 0)], b = A.P[Math.min(i + 1, n - 1)]; return Math.atan2(b.z - a.z, b.x - a.x); };
        const run = { P: [], W: [] };                         // the runner: one closed ring, waved nine times round
        for (let i = 0; i <= 360; i++) { const az = i * D2R, r = RUN_R + 2.5 * Math.sin(az * 9); run.P.push(V3(Math.cos(az) * r, RUN_Y, Math.sin(az) * r)); run.W.push(2.2); }
        arms.push(run);
        const shoots = [];
        for (let j = 0; j < NSH; j++) {
          const azK = j * TAU / NSH, rK = RUN_R + 2.5 * Math.sin(azK * 9), sd = j % 2 ? -1 : 1, lean = sd * (3.2 + 1.6 * hsh(j, 31)) * D2R, ph = hsh(j, 32) * TAU;
          const A = { P: [], W: [], sd };
          for (let i = 0; i <= 20; i++) {
            const f = i / 20, az = azK - lean * (1 - f) + 1.1 * D2R * Math.sin(f * TAU + ph) * Math.sin(Math.PI * f), r = lerp(IN_R, rK, f), x = Math.cos(az) * r, z = Math.sin(az) * r;
            A.P.push(V3(x, lerp(99.4 + 0.6 * sstep(0, 22, r - IN_R) + lift(x, z), RUN_Y, sstep(0.5, 1, f)), z)); A.W.push(lerp(2.3, 1.0, f));
          }
          arms.push(A); shoots.push(A);
        }
        const rib = [];
        arms.forEach((A, i) => rib.push(style.ribbonGeometry(A.P, A.W, { thick: 2.4, edgeSub: 1, u0: 911 + i * 17 })));
        await ctx.yield();
        shoots.forEach((A, j) => {                            // a tendril as the part winds them: six coils, one more each pose
          const p = A.P[20], h = hd(A, 20), dir = -A.sd, r = 5 + 2.5 * hsh(j, 33);
          const px = -Math.sin(h) * dir, pz = Math.cos(h) * dir, cx = p.x + px * r, cz = p.z + pz * r, a0 = Math.atan2(-pz, -px);
          for (let k = 0; k < 6; k++) {
            const pts = [], ws = [];
            for (let q = 0; q <= 9; q++) { const f = (k + q / 9) / 6, a = a0 + dir * f * 2.55 * TAU, rr = r * (1 - 0.86 * Math.pow(f, 0.8)); pts.push(V3(cx + Math.cos(a) * rr, p.y, cz + Math.sin(a) * rr)); ws.push(1.0 * (1 - 0.5 * f)); }
            rib.push(style.ribbonGeometry(pts, ws, { thick: 1.6, edgeSub: 1, pose: k }));
          }
        });
        await ctx.yield();
        const wr = mesh(mergeGeometries(rib, false), hero.parts.vine.material, hero.parts.turn);
        for (const g of rib) g.dispose();
        // leaves on the runner only: the part's leaf and material, one seat at every degree, sides by turns (the part lays one
        // or two at every 5 m of an arm); as in the part the seats are sorted by a key and the first n taken, n following
        // density and detail as the part's count does
        const seats = [];
        for (let i = 0; i < 360; i++) {
          const p = run.P[i], h = hd(run, Math.max(i, 1)), side = i % 2 ? 1 : -1, along = (hsh(i, 2) - 0.5) * 4, yaw = h + side * (1.0 + hsh(i, 4) * 0.75);
          seats.push([p.x + Math.cos(h) * along - Math.sin(h) * side * 0.88, p.y - 0.12 - hsh(i, 6) * 0.2, p.z + Math.sin(h) * along + Math.cos(h) * side * 0.88, yaw, 0.8 + hsh(i, 8) * 0.5, hsh(i, 10)]);
        }
        seats.sort((a, b) => a[5] - b[5]);
        const nL = Math.min(seats.length, Math.round(240 * clamp(density, 0.8, 1.15) * dq));
        const lg = hero.parts.leaves.geometry.clone(), lI = new Float32Array(nL * 4);
        const wl = new THREE.InstancedMesh(lg, hero.parts.leaves.material, nL); wl.frustumCulled = false; hero.parts.turn.add(wl);
        const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i < nL; i++) {
          const st = seats[i];
          q4.setFromAxisAngle(UP, Math.PI / 2 - st[3]); wl.setMatrixAt(i, m4.compose(v3.set(st[0], st[1], st[2]), q4, sc.setScalar(st[4])));
          lI[i * 4] = st[5] * 97; lI[i * 4 + 1] = 0.5 + ((st[5] * 7919) % 1);
        }
        lg.setAttribute('aI', new THREE.InstancedBufferAttribute(lI, 4)); wl.instanceMatrix.needsUpdate = true;
        await ctx.yield();
        // bunches: the part's bunch of eight rows on its stalk. Seats: one on every shoot at its point 13, 14 or 15 of 21 (r 277 to
        // 290), one under the runner in the middle of every span (r 310 to 314; the part itself hangs none beyond r 286). As in
        // the part they are taken in the order of a key, none within 19 m of a HUNG live bunch (the same test against new ones
        // never bites: the seats lie 29 m apart), the count following detail; then LIVE'S RULE for a bunch beyond r 200, typed
        // here a second time (the floor E0[1] + 2 and its arithmetic; equal to live's on every seat, whose strip term never
        // passes the floor out here): the stalk is shortened to the floor, 2 m over the eye at the entry, never under 2 m, and
        // a bunch still more than 0.5 m too low is not hung. Under the runner the stalk is the part's least, 2.5 m (the cranes:
        // see RUN_Y at the block's head).
        const cand = [];
        shoots.forEach((A, j) => { const i = 13 + (j % 3); cand.push({ p: A.P[i], psi: hd(A, i) + Math.PI / 2, key: hsh(j, 40), drop: hsh(j, 41), jit: hsh(j, 42), ph: hsh(j, 43) }); });
        for (let j = 0; j < NSH; j++) { const i = Math.round((j + 0.5) * 360 / NSH) % 360; cand.push({ p: run.P[i], psi: hd(run, Math.max(i, 1)), key: hsh(j, 44), drop: 0, jit: hsh(j, 45), ph: hsh(j, 46) }); }
        cand.sort((a, b) => a.key - b.key);
        const hung = [], wantW = Math.round(cand.length * dq), liveHung = bi.filter((b, k) => { dm.getMatrixAt(k * 41, mt); return mt.elements[5] !== 0; });
        for (const h of cand) {
          if (hung.length >= wantW) break;
          let ok = true;
          for (const c of liveHung) { const dx = c.x - h.p.x, dz = c.z - h.p.z; if (dx * dx + dz * dz < 19 * 19) { ok = false; break; } }
          for (const c of hung) { const dx = c.p.x - h.p.x, dz = c.p.z - h.p.z; if (dx * dx + dz * dz < 19 * 19) { ok = false; break; } }
          if (!ok) continue;
          const hy = h.p.y - 0.5, stalk0 = 2.5 + h.drop * h.drop * 22, need = floorY - (hy - stalk0 - 12), cut = clamp(need, 0, Math.max(0, stalk0 - 2));
          if (need > cut + 0.5) continue;
          h.hy = hy; h.stalk = stalk0 - cut; hung.push(h);
        }
        const ROWS = [8, 7, 6, 5, 5, 4, 3, 2], PER = 41, nD = hung.length * PER, dg = hero.parts.discs.geometry.clone(), dI = new Float32Array(nD * 4), dP = new Float32Array(nD * 4);
        const wd = new THREE.InstancedMesh(dg, hero.parts.discs.material, nD); wd.frustumCulled = false; hero.parts.turn.add(wd);
        const bx = new THREE.Vector3(), bz = new THREE.Vector3(); let di = 0;
        hung.forEach((h, b) => {
          const p = h.p, hy = h.hy, psi = h.psi + (h.jit - 0.5) * 1.5, rx = Math.cos(psi), rz = Math.sin(psi), top = hy - h.stalk;
          const put = (ox, oy, sx, sy, flag) => {
            bx.set(rx * sx, 0, rz * sx); bz.set(-rz, 0, rx);
            wd.setMatrixAt(di, m4.makeBasis(bx, v3.set(0, sy, 0), bz).setPosition(p.x + rx * ox, oy, p.z + rz * ox));
            dI[di * 4 + 1] = 1; dI[di * 4 + 2] = flag; dP[di * 4] = p.x; dP[di * 4 + 1] = hy; dP[di * 4 + 2] = p.z; dP[di * 4 + 3] = h.ph * 40; di++;
          };
          put(0, hy - h.stalk / 2 - 0.3, 0.3, h.stalk / 2 + 0.9, 2);
          let gi = 0;
          for (let r = 0; r < ROWS.length; r++) for (let i = 0; i < ROWS[r]; i++, gi++) put((i - (ROWS[r] - 1) / 2) * 1.5 + ((gi * 37 + b * 11) % 7 - 3) * 0.035, top - 0.8 - r * 1.42 - ((gi * 13 + b) % 5) * 0.03, 0.84, 0.84, (gi + b) % 3 === 0 ? 1 : 0);
        });
        dg.setAttribute('aI', new THREE.InstancedBufferAttribute(dI, 4)); dg.setAttribute('aPivot', new THREE.InstancedBufferAttribute(dP, 4)); wd.instanceMatrix.needsUpdate = true;
        wr.matrixAutoUpdate = wl.matrixAutoUpdate = wd.matrixAutoUpdate = true;
        await ctx.yield();
      }
    }
    if (colourway === 'coral') seaMat.uniforms.uClay = { value: new THREE.Color('#B23A22').multiply(new THREE.Color(1.05, 0.9, 1.3)) };
    await ctx.yield();
    // the pouring (rare): a level disc of wine-purple gloss wells up from under the ship and lifts us 12 m
    let wine = null, seaAtU = () => 0;
    {
      const wm = style.sea({ r0: 14, pitch: 19, band: 7.5, cell: 13, speed: 6, nightAlpha: 0.78, outer: 215 });
      wm.uniforms.uClay = { value: style.ink.purple.clone().multiplyScalar(1.25) };
      const wg = new THREE.CircleGeometry(216, 96); wg.rotateX(-Math.PI / 2);
      wine = mesh(wg, wm); wine.renderOrder = 3; wine.visible = rare; wine.position.y = -2;
      if (rare) ticks.push((dt, time, cam, u) => {
        wine.position.y = seaAtU(u) - 0.03 - 1.5 * (1 - sstep(uArc0 - 0.075, uArc0 - 0.05, u)); wine.scale.setScalar(0.02 + 0.98 * sstep(uArc0 - 0.085, uArc0 + 0.01, u));
      });
    }
    // ---- the slipways: static ramps that bridge the turning ledges, wave scroll down both edges
    const planAt = (dist) => {
      const d = C.d, p = C.p3; let i = 1; while (i < d.length - 1 && d[i] < dist) i++;
      const t = clamp((dist - d[i - 1]) / (d[i] - d[i - 1]), -2, 3), a = p[i - 1], b = p[i], l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1;
      return { x: lerp(a[0], b[0], t), z: lerp(a[2], b[2], t), tx: (b[0] - a[0]) / l, tz: (b[2] - a[2]) / l };
    };
    const slipGeo = (dA, dB, floorY, capY, half = () => 8) => {
      const P = [], Nn = [], Bd = [], T = [], Ln = [], Rg = [], UV = [], idx = [], n = Math.ceil((dB - dA) / 5);
      let run = 0, py = 0;
      for (let i = 0; i <= n; i++) {
        const dist = lerp(dA, dB, i / n), q = planAt(dist), y = clamp(C.yAt(dist) - CAM_H, floorY, capY);
        if (i) run += Math.hypot((dB - dA) / n, y - py); py = y;
        const sx = -q.tz, sz = q.tx, sl = (C.yAt(dist + 2) - C.yAt(dist - 2)) / 4, nl = Math.hypot(1, sl);
        const rr = Math.hypot(q.x, q.z), sk = rr > 338 && capY > 121 ? Math.max(1.4, y - lipY(rr) + 1.2) : 1.4;      // on the lip the skirts stand on it
        const hw = half(dist), cols = [[-hw, -sk, 6], [-hw, 0, 6], [-hw, 0, 7], [hw, 0, 7], [hw, 0, 6], [hw, -sk, 6]];
        for (const c of cols) {
          P.push(q.x + sx * c[0], y + c[1], q.z + sz * c[0]);
          if (c[2] === 7) Nn.push(-q.tx * sl / nl, 1 / nl, -q.tz * sl / nl); else Nn.push(sx * Math.sign(c[0]), 0, sz * Math.sign(c[0]));
          Bd.push(c[2]); T.push(c[1] < 0 ? 0 : 1); Ln.push(sk); Rg.push(4); UV.push(run, c[0]);
        }
        if (i < n) { const k = i * 6; for (const j of [0, 2, 4]) idx.push(k + j, k + j + 1, k + j + 6, k + j + 6, k + j + 1, k + j + 7); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aBand', new THREE.Float32BufferAttribute(Bd, 1));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 1)); g.setAttribute('aLen', new THREE.Float32BufferAttribute(Ln, 1));
      g.setAttribute('aRing', new THREE.Float32BufferAttribute(Rg, 1)); g.setIndex(idx);
      return g;
    };
    // the launching ways: on the lip the boat rides two glazed rails that stand on the key meander (open between them,
    // so the keys slide under the keel and, from behind the entry, the sail shows between the rails)
    const railGeo = (dA, dB) => {
      const P = [], Nn = [], Bd = [], T = [], Ln = [], Rg = [], UV = [], idx = [], n = Math.ceil((dB - dA) / 4);
      for (const sg of [-1, 1]) {
        const k0 = P.length / 3;
        for (let i = 0; i <= n; i++) {
          const dist = lerp(dA, dB, i / n), q = planAt(dist), y = C.yAt(dist) - CAM_H, sx = -q.tz * sg, sz = q.tx * sg;
          const rr = Math.hypot(q.x, q.z), sk = Math.max(1.4, y - lipY(rr) + 1.2), w0 = 2.7, w1 = 3.5;
          for (const c of [[w1, -sk, 1, 0], [w1, 0, 1, 0], [w1, 0, 0, 1], [w0, 0, 0, 1], [w0, 0, -1, 0], [w0, -sk, -1, 0]]) {
            P.push(q.x + sx * c[0], y + c[1], q.z + sz * c[0]); Nn.push(sx * c[2], c[3], sz * c[2]);
            Bd.push(6); T.push(c[1] < 0 ? 0 : 1); Ln.push(sk); Rg.push(4); UV.push(dist, c[0]);
          }
          if (i < n) { const k = k0 + i * 6; for (const j of [0, 2, 4]) idx.push(k + j, k + j + 1, k + j + 6, k + j + 6, k + j + 1, k + j + 7); }
        }
        const e = P.length / 3, q = planAt(dA), y = C.yAt(dA) - CAM_H, sx = -q.tz * sg, sz = q.tx * sg, sk = Math.max(1.4, y - lipY(Math.hypot(q.x, q.z)) + 1.2);
        for (const c of [[3.5, -sk], [3.5, 0], [2.7, 0], [2.7, -sk]]) {       // the end we look past from behind the entry
          P.push(q.x + sx * c[0], y + c[1], q.z + sz * c[0]); Nn.push(-q.tx, 0, -q.tz); Bd.push(6); T.push(c[1] < 0 ? 0 : 1); Ln.push(sk); Rg.push(4); UV.push(dA, c[0]);
        }
        idx.push(e, e + 1, e + 2, e, e + 2, e + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aBand', new THREE.Float32BufferAttribute(Bd, 1));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 1)); g.setAttribute('aLen', new THREE.Float32BufferAttribute(Ln, 1));
      g.setAttribute('aRing', new THREE.Float32BufferAttribute(Rg, 1)); g.setIndex(idx);
      return g;
    };
    mesh(mergeGeometries([railGeo(0, C.xL - 13), slipGeo(C.xL - 14, C.xF + 14, 0.4, 200, (x) => lerp(3.5, 8, sstep(C.xL - 14, C.xL + 24, x))), slipGeo(C.dClimb - 22, C.total - 20, 0.4, 120.05)]), wallMat);
    await ctx.yield();
    // ---- the figure kit: every creature is a thick slab in strict profile, authored as outlines; held poses are
    //      separate slabs (aPose) swapped at eight a second; added colour and incisions are thinner slabs set proud
    const SO = style.smoothOutline, SG = style.slabGeometry;
    let oneFace = false;                                    // ledge figures are only ever seen from the axis side: no back face
    const piece = (ctrl, o = {}) => SG(o.raw ? ctrl.map((p) => [p[0], p[1]]) : SO(ctrl, o.per ?? 4), o.thick ?? 0.6, { sub: o.sub ?? 1, pose: o.pose ?? -1, z: o.z ?? 0, back: o.back ?? !oneFace });
    const over = (ctrl, sub, o = {}) => piece(ctrl, Object.assign({ sub, thick: (o.base ?? 0.6) + 0.14 }, o));
    const xf = (pts, ang, dx, dy, s = 1) => { const c = Math.cos(ang), sn = Math.sin(ang); return pts.map((p) => [(p[0] * c - p[1] * sn) * s + dx, (p[0] * sn + p[1] * c) * s + dy, p[2]]); };
    const limb = (x, y, a1, l1, a2, l2, w0, w1) => {          // a bent leg: angles from straight down, forward positive
      const d1 = [Math.sin(a1), -Math.cos(a1)], d2 = [Math.sin(a2), -Math.cos(a2)], n1 = [Math.cos(a1), Math.sin(a1)], n2 = [Math.cos(a2), Math.sin(a2)];
      const k = [x + d1[0] * l1, y + d1[1] * l1], h = [k[0] + d2[0] * l2, k[1] + d2[1] * l2], wk = (w0 + w1) * 0.5, nm = [(n1[0] + n2[0]) * 0.5, (n1[1] + n2[1]) * 0.5];
      return [[x - n1[0] * w0, y - n1[1] * w0], [k[0] - nm[0] * wk, k[1] - nm[1] * wk], [h[0] - n2[0] * w1, h[1] - n2[1] * w1], [h[0] + n2[0] * w1 * 1.8, h[1] + n2[1] * w1 * 1.8],
        [k[0] + nm[0] * wk, k[1] + nm[1] * wk], [x + n1[0] * w0, y + n1[1] * w0]];
    };
    const ghost = (outline, dx, dy, w, thick, sub = 0) => {   // the sketch line the painter did not follow: a thin closed strip offset from an outline
      const n = outline.length, o = [], inn = [];
      for (let i = 0; i < n; i++) {
        const a = outline[(i + n - 1) % n], b = outline[(i + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = ty / l, ny = -tx / l;
        o.push([outline[i][0] + dx + nx * w, outline[i][1] + dy + ny * w]); inn.push([outline[i][0] + dx - nx * w, outline[i][1] + dy - ny * w]);
      }
      return SG(o, thick, { holes: [inn], sub });
    };
    const disc = (x, y, r, n = 10) => { const p = []; for (let i = 0; i < n; i++) p.push([x + Math.cos(i / n * TAU) * r, y + Math.sin(i / n * TAU) * r]); return p; };
    const figMat = (poses, o = {}) => style.slab(Object.assign({ poses, poseRate: 8, inst: true, dry: 0.7, load: 9, strokeW: 1.6, lineW: 0.07 }, o));
    // instances standing on a ring: local +x runs round the ring (the way the figure faces), +y up, slab faces the axis
    const ringGroup = (ring) => { const g = group(); ringGroups.push({ g, ring }); return g; };
    const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0), _z = new THREE.Vector3();
    const standOn = (im, i, r, y, phi, dir, s = 1, lean = 0) => {
      _x.set(-Math.sin(phi) * dir, 0, Math.cos(phi) * dir); _z.set(-Math.cos(phi), 0, -Math.sin(phi));
      _m.makeBasis(_x, _y, _z); _m.scale(_x.set(s, s, s)); _m.setPosition(Math.cos(phi) * r, y + lean, Math.sin(phi) * r); im.setMatrixAt(i, _m);
    };
    const instanced = (geo, mat, n, parent, phase = (i) => rng() * 8) => {
      const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; parent.add(im);
      const aI = new Float32Array(n * 4); for (let i = 0; i < n; i++) { aI[i * 4] = phase(i); aI[i * 4 + 1] = 1; }
      geo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4)); return im;
    };

    // ---- the lower ledge (y 42, the slipway passes 14 m over it): sixty riderless horses 9 m tall at the gallop, manes purple (or deer, or long-horned goats)
    oneFace = false;                                        // from the slipways the ledge figures are seen from the rim side too
    {
      const parts = [];
      const body = [[-3.7, 6.1], [-1.6, 6.5], [1.1, 6.6], [2.5, 8.2], [3.25, 9.0, 1], [3.8, 8.55], [5.1, 7.25], [5.0, 6.85, 1], [4.4, 6.75], [3.5, 7.2], [2.9, 5.7], [2.6, 4.5], [0.5, 4.05], [-1.9, 4.3], [-3.7, 4.5], [-4.2, 5.3]];
      parts.push(piece(body, { per: 3 }));
      parts.push(over([[1.0, 6.75], [1.6, 7.9], [2.55, 8.9], [3.2, 9.15, 1], [2.3, 8.3], [1.7, 7.0]], 3));                      // the mane
      parts.push(over(disc(4.05, 8.05, 0.2, 6), 0, { raw: true }));                                                           // the eye: a prick of bare clay
      parts.push(over([[2.3, 6.9, 1], [2.75, 5.8], [2.5, 4.7, 1], [2.62, 4.7, 1], [2.9, 5.8], [2.45, 6.9, 1]], 0, { per: 3 })); // shoulder line
      parts.push(over([[-2.5, 6.2, 1], [-2.0, 5.3], [-2.6, 4.5, 1], [-2.45, 4.5, 1], [-1.85, 5.3], [-2.35, 6.2, 1]], 0, { per: 3 }));
      if (castHorse === 'deer') for (const s of [0, 1]) {
        parts.push(piece([[3.0 - s * 0.5, 8.8], [2.6 - s * 0.6, 10.6], [3.3 - s * 0.5, 11.9], [3.05 - s * 0.5, 11.9], [2.7 - s * 0.5, 11.0], [2.0 - s * 0.6, 11.6], [1.85 - s * 0.6, 11.45], [2.4 - s * 0.6, 10.5], [2.7 - s * 0.5, 8.8]], { raw: true }));
      }
      if (castHorse === 'goat') parts.push(piece([[3.3, 8.9, 1], [2.9, 10.6], [1.2, 11.3], [-0.6, 10.4], [-0.5, 10.1, 1], [1.2, 10.8], [2.5, 10.2], [2.7, 8.9, 1]], { per: 4 }));
      const F = [[1.0, 0.55], [0.3, -0.15], [-0.55, -1.25], [0.45, -1.05]], H = [[-0.9, -0.45], [-0.3, -0.95], [0.6, 0.1], [0.2, -0.65]], TL = [-0.5, -0.2, 0.25, -0.1];
      for (let k = 0; k < 4; k++) {
        for (const s of [0, 1]) {
          const kk = (k + s) % 4, m = 1 - s;                   // the far legs run one pose ahead: never more than one overlap
          parts.push(piece(limb(2.0 - s * 0.5, 4.9, lerp(F[k][0], F[kk][0], 0.4 * s), 2.25, lerp(F[k][1], F[kk][1], 0.4 * s) + 0.1 * s, 2.5, 0.42, 0.17), { raw: true, pose: k, z: m * 0.02 }));
          parts.push(piece(limb(-2.9 + s * 0.6, 5.0, lerp(H[k][0], H[kk][0], 0.4 * s), 2.3, lerp(H[k][1], H[kk][1], 0.4 * s) - 0.1 * s, 2.55, 0.55, 0.17), { raw: true, pose: k }));
        }
        parts.push(piece(xf([[0, 0.3, 1], [-1.6, 0.5], [-3.2, -0.4], [-3.9, -2.0, 1], [-2.8, -0.9], [-1.4, -0.35], [0, -0.3, 1]], TL[k], -3.9, 5.8), { pose: k, per: 2 }));
      }
      await ctx.yield();
      const geo = mergeGeometries(parts); geo.translate(0, -0.2, 0);
      await ctx.yield();
      const n = Math.round(60 * lerp(0.8, 1, detail)), g = ringGroup(1), dir = Math.sign(RING_V[1]) || 1;
      const im = instanced(geo, figMat(4), n, g);
      for (let i = 0; i < n; i++) standOn(im, i, 247.5, 42, (i + 0.25 * Math.sin(i * 2.4)) / n * TAU, wheel === 'oneway' ? 1 : dir, 1.3);
      im.instanceMatrix.needsUpdate = true;
    }
    await ctx.yield();
    // ---- the upper ledge (y 104, just under the lip): eighty cranes 7 m tall striding the other way; every few seconds one opens white wings
    {
      const sw = castBird === 'swan', leg = sw ? 0.55 : 1, by = sw ? -1.5 : 0;
      const body = xf([[-2.5, 3.5, 1], [-1.2, 4.4], [0.3, 4.6], [1.05, 5.2], [1.2, 6.3], [1.0, 6.95], [1.5, 7.35], [2.0, 7.1], [3.4, 6.85, 1], [2.0, 6.7], [1.7, 6.3], [1.8, 5.2], [1.5, 4.0], [0.2, 3.3], [-1.2, 3.3]], 0, 0, by);
      const common = () => [piece(body, { per: 3 }), over(disc(1.62, 7.02 + by, 0.13, 6), 0, { raw: true }), over(xf([[1.0, 7.1], [1.5, 7.5], [1.95, 7.2], [1.5, 7.3]], 0, 0, by), 3, { raw: true })];
      const SA = [[0.55, 0.2], [0.1, -0.1], [-0.45, -0.75]];
      const walk = common();
      walk.push(over(xf([[-2.0, 3.75], [-0.6, 4.35], [0.5, 4.3], [0.3, 3.7], [-1.2, 3.45]], 0, 0, by), 2));                   // the folded wing
      for (let k = 0; k < 3; k++) for (const s of [0, 1]) { const a = SA[(k + s * 2) % 3]; walk.push(piece(limb(0.1 - s * 0.3, 3.5 + by, a[0], 1.75 * leg, a[1], 1.75 * leg, 0.2, 0.13), { raw: true, pose: k })); }
      await ctx.yield();
      const fly = common();
      for (let k = 0; k < 2; k++) {
        fly.push(over(xf([[-1.6, 0], [-0.4, 0.5], [1.0, 0.2], [0.4, 3.9 - k * 1.2], [-0.9, 4.4 - k * 1.5, 1], [-2.6, 3.6 - k * 2.2], [-3.4, 2.2 - k * 2.6, 1], [-2.2, 1.6 - k * 1.2]], 0, 0, 4.2 + by), 2, { pose: k, per: 3 }));
        for (const s of [0, 1]) fly.push(piece(limb(-0.2 - s * 0.3, 3.5 + by, -0.9 - 0.2 * k, 1.6 * leg, -1.3, 1.6 * leg, 0.2, 0.13), { raw: true, pose: k }));
      }
      await ctx.yield();
      const gW = mergeGeometries(walk), gF = mergeGeometries(fly);
      await ctx.yield();
      const n = Math.round(80 * lerp(0.8, 1, detail)), g = ringGroup(2), dir = wheel === 'oneway' ? 1 : (Math.sign(RING_V[2]) || 1);
      const imW = instanced(gW, figMat(3, { poseRate: 5 }), n, g), imF = instanced(gF, figMat(2, { poseRate: 4 }), Math.ceil(n / 3), g, () => 0);
      const phi = []; for (let i = 0; i < n; i++) phi.push((i + 0.3 * Math.sin(i * 1.7)) / n * TAU);
      const up = new Float32Array(n).fill(-1);
      const hop = [0, 1.6, 3.4, 4.6, 4.0, 2.2, 0.6];
      // no crane lifts off under a slipway: where the course passes less than 2.5 m over the highest hop, a crane whose hop would
      // carry it under the slipway's deck (the deck's half width there by the course's own metre, which errs up to a metre wide, the figure's reach of 3.5 m and 0.3 m) walks on: nothing
      // rises through the deck, and its skin keeps 6 m of air from the course's line. Each hop is judged once, where it begins.
      const slipAz = []; { const sp = new THREE.Vector3(); for (let sd = 0; sd < path.length; sd += 1) { path.posAtDist(sd, sp); if (Math.abs(Math.hypot(sp.x, sp.z) - 322.5) < 1.5 && sp.y < 104 + 8.6 + by + 4.6 + 2.5) slipAz.push([Math.atan2(sp.z, sp.x), lerp(3.5, 8, sstep(C.xL - 14, C.xL + 24, sd)) + 3.5 + 0.3]); } }
      const offSlip = (a) => { for (const s of slipAz) { let da = Math.abs(a - s[0]) % TAU; if (da > Math.PI) da = TAU - da; if (da * 322.5 < s[1]) return false; } return true; };
      const hopAt = new Int32Array(n).fill(-1e9), hopOk = new Uint8Array(n);
      const place = (time) => {
        const st = Math.floor(time * 8); let dirty = false;
        for (let i = 0; i < n; i++) {
          const cyc = 50 + (i * 37) % 60, k = (st + i * 23) % cyc; let air = k < hop.length && (i % 3 === 0) ? k : -1;
          if (air >= 0) {                                   // (where it stood when the hop began, and where the hop ends)
            if (hopAt[i] !== st - k) { hopAt[i] = st - k; const a0 = phi[i] + ringAng[2] - ringRate[2] * (time - (st - k) / 8); hopOk[i] = offSlip(a0) && offSlip(a0 + ringRate[2] * 0.875) ? 1 : 0; }
            if (!hopOk[i]) air = -1;
          }
          if (air === up[i]) continue;
          up[i] = air; dirty = true;
          standOn(imW, i, 322.5, 104, phi[i], dir, air < 0 ? 1 : 0);
          if (i % 3 === 0) standOn(imF, i / 3, 322.5, 104, phi[i], dir, air < 0 ? 0 : 1, air < 0 ? 0 : hop[air]);
        }
        if (dirty) { imW.instanceMatrix.needsUpdate = true; imF.instanceMatrix.needsUpdate = true; }
      };
      up.fill(-2); place(0); hopAt.fill(-1e9);              // (the build's own answers are not kept: the rings have no rate yet)
      // a flight of the same cranes crosses the kiln field ahead of us on the climb: white wings on the black
      const NFK = 13, flock = instanced(gF.clone(), figMat(2, { poseRate: 3.5 }), NFK, scene, (i) => i * 0.37), fo = [];
      for (let i = 0; i < NFK; i++) fo.push([rng() * 2 - 1, rng(), rng() * 2 - 1]);
      const fr = new THREE.Vector3(), fp = new THREE.Vector3(), ft = new THREE.Vector3(), fz = new THREE.Vector3();
      ticks.push((dt, time, cam, u) => {
        const k = (u - 0.72) / 0.25, show = k > -0.55 && k < 1.2 ? 1.55 : 0, lat0 = k < -0.25 ? -96 - (-0.25 - k) * 420 : lerp(-64, 64, k);      // they fly in from outside the frame
        path.posAtDist(u * path.length + 62, fp); path.tangentAt(clamp(u, 0, 1), ft); ft.y = 0; ft.normalize(); fr.set(-ft.z, 0, ft.x); fz.crossVectors(fr, _y);
        for (let i = 0; i < NFK; i++) {                       // two staggered ranks: no crane overlaps another
          const row = i % 2, col = (i - row) / 2, lat = lat0 + (col - 3 + 0.5 * row) * 15.5, h = 0 + row * 18 + fo[i][1] * 2 + 1.2 * Math.sin(time * 1.3 + i * 2.1), al = row * 5;
          _m.makeBasis(fr, _y, fz).scale(_x.set(show, show, show)).setPosition(fp.x + fr.x * lat + ft.x * al, fp.y + h, fp.z + fr.z * lat + ft.z * al);
          flock.setMatrixAt(i, _m);
        }
        flock.instanceMatrix.needsUpdate = true;
      });
      ticks.push((dt, time) => place(time));
    }
    oneFace = false;
    await ctx.yield();
    // ---- where the course crosses a given radius: [{ u, th }] (for everything that rides a sea ring)
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    const crossings = (R, anyHeight = false) => {
      const out = []; let pr = 0, pu = 0;
      for (let i = 0; i <= 900; i++) {
        const u = i / 900; path.pointAt(u, _p); const r = Math.hypot(_p.x, _p.z);
        if (i && (pr - R) * (r - R) <= 0 && (anyHeight || _p.y < 40)) out.push({ u: (u + pu) / 2, th: Math.atan2(_p.z, _p.x) });
        pr = r; pu = u;
      }
      return out;
    };
    const wrap = (a) => a - TAU * Math.round(a / TAU);
    seaAtU = (u) => seaLevel(u);
    // the sea's height under us: on a rare visit the wine lifts it 12 m, and the course rides 2.5 m above it, so it is
    // read back from the course itself (the fleet, the fish and the wine disc then rise exactly with our keel)
    const _sl = new THREE.Vector3(); let slU = -1, slV = 0;
    const seaLevel = (u) => {
      if (!rare || u < 0.3) return 0;
      if (u !== slU) { slU = u; slV = u > uClimb - 0.012 ? 12 : clamp(path.pointAt(clamp(u, 0, 1), _sl).y - CAM_H, 0, 12); }
      return slV;
    };
    // ---- the fleet: fourteen war galleys 40 m long in two rings that row opposite ways; their turning is keyed to u,
    //      so that the two rings open a gate (bow to port, stern to starboard, 10 m off) exactly as we cross them
    const galleyGeo = async () => {
      const T = 1.6, parts = [];
      const hull = [[21, 1.5, 1], [18, 0.2], [10, -0.4], [-10, -0.4], [-16, 0.6], [-19.5, 3.5], [-20.5, 7.5], [-19.5, 11], [-17.7, 12.2], [-16.2, 11.3, 1], [-17.6, 10.5], [-18.5, 8], [-17.8, 5.4],
        [-15, 4.6], [0, 4.2], [12, 4.5], [14.4, 5.2, 1], [15.4, 8.8], [14.9, 10.2, 1], [16.5, 8.8], [16.8, 5.6], [16.4, 3.7], [18.2, 2.6]];
      parts.push(piece(hull, { thick: T, per: 3 }));
      const ov = (pts, sub, o = {}) => over(pts, sub, Object.assign({ base: T, raw: true }, o));
      parts.push(ov(disc(14.2, 2.9, 1.0, 9), 2), piece(disc(14.2, 2.9, 0.55, 8), { raw: true, sub: 3, thick: T + 0.26 }), piece(disc(14.2, 2.9, 0.16, 5), { raw: true, sub: 0, thick: T + 0.36 }));
      for (let i = 0; i < 8; i++) {                           // the hung shields: round, with a boss and a ring like the Vine Ship's own
        const sx = -12.5 + i * 3.2, su = i % 2 ? 0 : 1;
        parts.push(ov(disc(sx, 3.3, 0.95, 12), i % 2 ? 3 : 2), piece(disc(sx, 3.3, 0.3, 6), { raw: true, sub: su, thick: T + 0.26 }));
        for (const s of [-1, 1]) parts.push(SG(disc(sx, 3.3, 0.7, 12), 0, { holes: [disc(sx, 3.3, 0.57, 12)], sub: su, back: false, z: s * (T / 2 + 0.2) }));
      }
      parts.push(ov([[-16, 1.75], [16.5, 1.75], [16.5, 1.95], [-16, 1.95]], 0), ov([[14.9, 9.2], [16.2, 9.0], [16.3, 9.5], [15.0, 9.7]], 2));
      parts.push(piece([[-0.25, 4.2], [0.25, 4.2], [0.25, 13.4], [-0.25, 13.4]], { raw: true }), piece([[-7, 12.3], [7, 12.3], [7, 12.75], [-7, 12.75]], { raw: true }));
      parts.push(over([[-6.4, 12.3, 1], [6.4, 12.3, 1], [5.2, 11.3], [0, 11.6], [-5.2, 11.3]], 2, { per: 2 }));                    // the furled sail
      const SW = [1.1, 0.8, 0.5], TIPY = [1.0, 0.75, 0.25];
      await ctx.yield();
      for (let k = 0; k < 3; k++) for (let i = 0; i < 20; i++) for (const s of [-1, 1]) {
        // raked aft, a shaft and a blade: forward and clear of the water, half way, dipped
        const x = -12.4 + i * 1.4, a = SW[k], dx = -Math.sin(a), dy = -Math.cos(a), L = (2.5 - TIPY[k]) / Math.cos(a), nx = -dy, ny = dx, y0 = 2.5;
        const q = (l, w) => [x + dx * l + nx * w, y0 + dy * l + ny * w];
        parts.push(piece([q(0, -0.1), q(L - 1.25, -0.12), q(L - 1.05, -0.36), q(L, -0.3), q(L, 0.3), q(L - 1.05, 0.36), q(L - 1.25, 0.12), q(0, 0.1)], { raw: true, pose: k, thick: 0, back: false, z: s * (T / 2 + 0.32) }));
      }
      await ctx.yield();
      const g = mergeGeometries(parts); g.translate(0, -0.9, 0); return g;
    };
    const fleetGeo = await galleyGeo();
    await ctx.yield();
    const fleetMat = figMat(3, { poseRate: 3, pingpong: true, dry: 0.4, load: 23, strokeW: 2.2 });
    const NF = 14, fleet = instanced(fleetGeo, fleetMat, NF, scene), fleetMir = new THREE.InstancedMesh(fleetGeo, fleetMat, NF);
    fleetMir.frustumCulled = false; scene.add(fleetMir);
    const FR = [{ R: 100, dir: 1, v: 5.2, phi: [] }, { R: 134, dir: -1, v: 4.4, phi: [] }];
    for (const fr of FR) {
      await ctx.yield();
      // no hull may be in the approach corridor (16 m either side) while we come down it, nor at the exit crossing
      const cr = crossings(fr.R), A = (u) => fr.dir * (fr.v / fr.R) * duration * u; fr.A = A;
      const ok = (phi) => cr.every((c, ci) => {
        const half = (ci === 0 ? 37 : 30) / fr.R, u0 = ci === 0 ? c.u - 0.16 : c.u - 0.02;
        for (let u = u0; u <= c.u + 0.031; u += 0.01) if (Math.abs(wrap(phi + A(u) - c.th)) < half) return false;
        return true;
      });
      let best = 0; for (let off = 0; off < TAU / 6; off += 0.01) { let all = true; for (let i = 0; i < 6; i++) if (!ok(off + i * TAU / 6)) { all = false; break; } if (all) { best = off; break; } }
      for (let i = 0; i < 6; i++) { let phi = best + i * TAU / 6, n = 0; while (!ok(phi) && n++ < 120) phi += 0.02; fr.phi.push(phi); }
    }
    // two escorts row down the approach either side of us, slower than we are: the lane, with stepped oars both sides
    const escortS = (u, stop) => { const s = 60 + 8 * duration * (0.30 - u); return s > stop + 30 ? s : stop + 30 * Math.exp((s - stop - 30) / 30); };
    const placeFleet = (u) => {
      const sy = seaLevel(u); let i = 0;
      const mir = () => { fleet.getMatrixAt(i, _m); _m.elements[4] *= -1; _m.elements[5] *= -1; _m.elements[6] *= -1; _m.elements[13] = sy - 0.2; fleetMir.setMatrixAt(i, _m); i++; };
      for (let j = 0; j < 2; j++) for (const phi of FR[j].phi) { standOn(fleet, i, FR[j].R, sy, phi + FR[j].A(u), FR[j].dir); mir(); }
      for (const s of [-1, 1]) {                             // local +x = the approach heading, the slab faces us
        const q = planAt(C.dArc0 - escortS(u, s < 0 ? -22 : 24)), px = q.x - q.tz * s * 15.5, pz = q.z + q.tx * s * 15.5;
        _x.set(q.tx, 0, q.tz).applyAxisAngle(_y, s * 0.3); _z.set(_x.z * s, 0, -_x.x * s);       // toed in 17 degrees: in profile to us, not end-on
        _m.makeBasis(_x, _y, _z).setPosition(px, sy, pz); fleet.setMatrixAt(i, _m); mir();
      }
      fleet.instanceMatrix.needsUpdate = true; fleetMir.instanceMatrix.needsUpdate = true;
    };
    placeFleet(0); ticks.push((dt, time, cam, u) => placeFleet(u));
    await ctx.yield();
    // ---- our own galley: two parallel profile slabs 3 m apart with the eye between them, 2.5 m above the keel;
    //      horns with a white fillet ahead, an eye on each cheek, nine oars a side in three held poses
    const boat = group(), boatMir = group();
    {
      const parts = [];
      const side = [[-11, -2.7], [-11.6, -0.9], [-9, -1.65], [0, -1.8], [6, -1.72], [8.5, -1.5], [9.5, -0.7], [9.45, 0.0], [10.1, 0.4, 1], [10.9, -0.25], [11.2, -1.2], [11.0, -2.0], [12.7, -2.4, 1], [11, -2.95], [0, -3.1], [-9, -2.95]];
      for (const s of [-1, 1]) {
        parts.push(piece(side, { thick: 0.36, z: s * 1.5, per: 3 }));
        parts.push(piece([[9.45, -0.5], [10.95, -0.55], [10.85, -0.15], [9.45, -0.12]], { raw: true, sub: 2, thick: 0.5, z: s * 1.5 }));       // the fillet
        parts.push(piece(disc(8.3, -2.2, 0.5, 9), { raw: true, sub: 2, thick: 0.5, z: s * 1.5 }), piece(disc(8.3, -2.2, 0.27, 7), { raw: true, sub: 3, thick: 0.6, z: s * 1.5 }),
          piece(disc(8.3, -2.2, 0.08, 5), { raw: true, sub: 0, thick: 0.7, z: s * 1.5 }));
      }
      const deckPts = [], deckW = []; for (let i = 0; i <= 8; i++) { deckPts.push(new THREE.Vector3(-4 + i * 1.1, -2.05, 0)); deckW.push(3); }     // stops short of the bow: the view ahead is open between the cheeks
      const deckGeo = style.ribbonGeometry(deckPts, deckW, { thick: 0.3, rib: true });
      const ex = new THREE.Vector3(), ey = new THREE.Vector3(), ez = new THREE.Vector3(), mm = new THREE.Matrix4();
      const SWP = [1.1, 0, -1.1], TIP = [-1.95, -2.55, -2.55], oarParts = [];
      for (let k = 0; k < 3; k++) for (let i = 0; i < 9; i++) for (const s of [-1, 1]) {
        const x0 = 0.9 + i * 0.68;
        ex.set(SWP[k], TIP[k] + 1.75, s * 3.8); const L = ex.length(); ex.divideScalar(L);
        ez.set(-ex.z, 0, ex.x).normalize(); ey.crossVectors(ez, ex);       // a profile slab: its plane is upright
        const g = piece([[0, -0.025], [L - 1.0, -0.03], [L - 0.9, -0.085], [L, -0.07], [L, 0.07], [L - 0.9, 0.085], [L - 1.0, 0.03], [0, 0.025]], { raw: true, pose: k, thick: 0.06 });
        g.applyMatrix4(mm.makeBasis(ex, ey, ez).setPosition(x0, -1.75, s * 1.72)); oarParts.push(g);
      }
      await ctx.yield();
      // the mirrored hull carries no deck: between our cheeks the night sea is black mirror, not a brown pane
      const geoMir = mergeGeometries(parts); geoMir.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 0, 0]), 4));
      const geo = mergeGeometries([...parts, deckGeo]), mat = figMat(3, { poseRate: 3, pingpong: true, dry: 0.5, load: 14, strokeW: 1.1, wide: 0.1, noEdgeBar: true });
      const im = instanced(geo, mat, 1, boat, () => 0); im.setMatrixAt(0, _m.identity());
      const im2 = new THREE.InstancedMesh(geoMir, mat, 1); im2.frustumCulled = false; im2.setMatrixAt(0, _m.identity()); boatMir.add(im2);
      // the oars are their own mesh: on the launching ramp they lie shipped inboard (the key meander is clear in both
      // lower corners), and are run out as the bow tips down the slipway
      const oarGeo = mergeGeometries(oarParts), imO = instanced(oarGeo, mat, 1, boat, () => 0); imO.setMatrixAt(0, _m.identity());
      const imO2 = new THREE.InstancedMesh(oarGeo, mat, 1); imO2.frustumCulled = false; imO2.setMatrixAt(0, _m.identity()); boatMir.add(imO2);
      let oarK = -1;
      const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), bp = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
      ticks.push((dt, time, cam, u) => {
        bp.setFromMatrixPosition(cam.matrixWorld);
        const ok = Math.round(lerp(0.27, 1, sstep(0.022, 0.052, u)) * 200) / 200;
        if (ok !== oarK) { oarK = ok; imO.setMatrixAt(0, _m.makeScale(1, 1, ok)); imO.instanceMatrix.needsUpdate = true; }
        path.tangentAt(clamp(u, 0, 1), bx).normalize();
        const pitch = 0.03 * Math.sin(time * 3 * TAU / 4);                                   // the hull pitches to the stroke
        bx.y *= sstep(3.5, 9, bp.y - seaLevel(u)); bx.normalize();                           // level on the water, pitched on the slipways
        bz.crossVectors(bx, UP).normalize(); by.crossVectors(bz, bx);
        const settle = sstep(0.85, 0.94, u);                                               // by the bow on the last climb: the loop stands clear of our horns
        bx.addScaledVector(by, pitch - 0.15 * settle).normalize(); by.crossVectors(bz, bx); bp.addScaledVector(by, -0.9 * settle);
        boat.matrixAutoUpdate = false; boat.matrix.makeBasis(bx, by, bz).setPosition(bp); boat.matrixWorldNeedsUpdate = true;
        // the same hull upside down under the sea, for the black mirror of the night
        const sy = seaLevel(u), deep = bp.y - sy;
        boatMir.visible = deep < 30; boatMir.matrixAutoUpdate = false;
        bx.y = -bx.y; by.set(-by.x, by.y, -by.z).multiplyScalar(-1); bz.y = -bz.y;
        boatMir.matrix.makeBasis(bx, by, bz).setPosition(bp.x, 2 * sy - bp.y - 0.15, bp.z); boatMir.matrixWorldNeedsUpdate = true;
      });
    }
    await ctx.yield();
    // ---- the handle: a strap loop standing on the rim, 9 m thick, its opening the way out; the portal sits in it
    const endP = path.pointAt(1, new THREE.Vector3()), endT = path.tangentAt(1, new THREE.Vector3()).normalize();
    {
      const X = new THREE.Vector3().crossVectors(endT, new THREE.Vector3(0, 1, 0)).normalize(), Y = new THREE.Vector3().crossVectors(X, endT).normalize();
      const foot = -(endP.y - 119) / Math.max(Y.y, 0.3);
      // a strap loop: a ring 10 m broad round the opening, two legs splaying to the rim, and on each leg a root spur
      // with a flat top where a cockerel perches. Its face is painted: tongues round the arch, lines down the legs,
      // an eye on each root.
      const half = (sg) => [[sg * 34, foot, 1], [sg * 33.5, -33], [sg * 38.5, -25, 1], [sg * 38, -14.2, 1], [sg * 24.5, -13.4, 1], [sg * 19.6, -6], [sg * 17.6, 2], [sg * 14.2, 10.6], [sg * 7.4, 16.2]];
      const under = [[22, foot, 1], [20.5, -31], [14.5, -20.5], [7.4, -14.6], [0, -13.2], [-7.4, -14.6], [-14.5, -20.5], [-20.5, -31], [-22, foot, 1]];
      const outer = SO([...half(-1), [0, 17.8], ...half(1).reverse(), ...under], 5);
      const g = SG(outer, 9, { holes: [disc(0, 0, 7.7, 28)], sub: 1 });
      const fil = [], pc = (pts, sub, th = 9.3) => fil.push(piece(pts, { raw: true, sub, thick: th }));
      const arcStrip = (r0, r1, a0, a1, n = 26) => { const o = [], inn = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([Math.cos(a) * r1, Math.sin(a) * r1]); inn.push([Math.cos(a) * r0, Math.sin(a) * r0]); } return o.concat(inn.reverse()); };
      const NT = 19, A0 = -22 * D2R, A1 = 202 * D2R;
      for (let i = 0; i < NT; i++) {                           // tongues round the arch, alternately black and wine purple
        const a = lerp(A0, A1, (i + 0.5) / NT), da = (A1 - A0) / NT * 0.36, c = Math.cos(a), sn = Math.sin(a), tx = -sn, ty = c;
        const p = (r, w) => [c * r + tx * w, sn * r + ty * w];
        pc([p(10.7, -10.7 * da), p(14.6, -14.6 * da), p(15.6, -8 * da), p(15.9, 0), p(15.6, 8 * da), p(14.6, 14.6 * da), p(10.7, 10.7 * da)], i % 2 ? 3 : 0);
      }
      pc(arcStrip(16.35, 16.9, A0 - 0.05, A1 + 0.05), 0); pc(arcStrip(9.75, 10.2, A0 - 0.05, A1 + 0.05), 0);
      for (const sg of [-1, 1]) {
        for (const o of [0, 3.4]) pc([[sg * (20.4 + o), -9.5], [sg * (24.2 + o), -19], [sg * (26.2 + o * 0.9), -30], [sg * (26.6 + o * 0.9), foot + 6], [sg * (27.3 + o * 0.9), foot + 6], [sg * (26.9 + o * 0.9), -30], [sg * (24.9 + o), -19], [sg * (21.1 + o), -9.5]], 0);
        pc(disc(sg * 33.2, -20.2, 3.3, 16), 2); pc(disc(sg * 33.2, -20.2, 2.1, 14), 3, 9.5); pc(disc(sg * 33.2, -20.2, 0.85, 8), 0, 9.7);       // the eye on the root
        pc([[sg * 29.2, -14.9], [sg * 37.6, -15.4], [sg * 37.6, -16.0], [sg * 29.2, -15.5]], 0);
        pc([[sg * 21.8, foot + 3], [sg * 33.8, foot + 3], [sg * 33.8, foot + 4.6], [sg * 21.8, foot + 4.6]], 3);
      }
      fil.push(ghost(disc(0, 0, 17.9, 40).filter((q) => q[1] > -4), 1.0, -0.7, 0.16, 9.3));          // the sketched arch, a hand's width off
      const ringPts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; ringPts.push([Math.cos(a) * 9.4, Math.sin(a) * 9.4]); }
      fil.push(SG(ringPts, 9.25, { holes: [disc(0, 0, 8.7, 28)], sub: 0 }));
      const hg = mergeGeometries([g, ...fil]);
      const hm = mesh(hg, style.slab({ dry: 0.7, load: 30, strokeW: 3, wide: 0.3 }));
      hm.matrixAutoUpdate = false; hm.matrix.makeBasis(X, Y, new THREE.Vector3().crossVectors(X, Y)).setPosition(endP.x, endP.y, endP.z).multiply(_m.makeTranslation(0, 0, -5.2));
    }
    await ctx.yield();
    // ---- the great eyes on the wall: a pair either side of the handle, a pair on the far wall ahead of the entry.
    //      Almond slabs lying on the frieze ground; iris and pupil are a separate slab that turns to follow us.
    {
      const almond = SG(SO([[-35, -3, 1], [-18, 9.5], [0, 13.5], [18, 10], [34, 2, 1], [16, -9.5], [0, -12.5], [-18, -9.5]], 6), 1.2, { sub: 1 });
      const lid = brows ? piece([[-36, 6, 1], [-18, 18.5], [2, 22], [22, 17.5], [36, 8, 1], [22, 15.6], [2, 19.8], [-18, 16.4]], { thick: 1.2, per: 5 }) : null;
      const sketch = ghost(SO([[-35, -3, 1], [-18, 9.5], [0, 13.5], [18, 10], [34, 2, 1], [16, -9.5], [0, -12.5], [-18, -9.5]], 6), 1.5, -1.1, 0.17, 1.36);
      const eyeGeo = mergeGeometries(lid ? [almond, lid, sketch] : [almond, sketch]);
      const irisGeo = mergeGeometries([piece(disc(0, 0, 11.6, 30), { raw: true, sub: 0, thick: 1.6 }), piece(disc(0, 0, 9.2, 28), { raw: true, sub: 2, thick: 2.0 }),
        piece(disc(0, 0, 6.6, 24), { raw: true, sub: 3, thick: 2.4 }), piece(disc(0, 0, 3.7, 18), { raw: true, sub: 0, thick: 2.8 }), piece(disc(0, 0, 0.55, 8), { raw: true, sub: 1, thick: 3.2 })]);
      const irisFar = mergeGeometries([piece(disc(0, 0, 12.4, 30), { raw: true, sub: 0, thick: 1.6 }), piece(disc(0, 0, 11.4, 28), { raw: true, sub: 2, thick: 2.0 }),
        piece(disc(0, 0, 5.8, 24), { raw: true, sub: 3, thick: 2.4 }), piece(disc(0, 0, 3.2, 18), { raw: true, sub: 0, thick: 2.8 }), piece(disc(0, 0, 0.5, 8), { raw: true, sub: 1, thick: 3.2 })]);
      const eyeMat = style.slab({ dry: 0.75, load: 60, strokeW: 4.5, wide: 0.6 });
      const eyes = [];
      const sl = new THREE.Vector2(48, 38).normalize();
      // three eyes: two flank the handle; from the entry the lone far one and the handle's nearer one flank the sail
      for (const [phi, s, big] of [[HANDLE_AZ - 15 * D2R, -1, 1], [HANDLE_AZ + 15 * D2R, 1, 1], [FAR_EYES_AZ, 1, 2.25]]) {
        const g = group();
        const X = new THREE.Vector3(-Math.sin(phi), 0, Math.cos(phi)).multiplyScalar(-s), Y = new THREE.Vector3(Math.cos(phi) * sl.x, sl.y, Math.sin(phi) * sl.x);
        const Z = new THREE.Vector3().crossVectors(X, Y); if (Z.y < 0) Z.multiplyScalar(-1);
        g.matrixAutoUpdate = false; g.matrix.makeBasis(X, Y, Z).setPosition(Math.cos(phi) * 277, 61.8, Math.sin(phi) * 277).multiply(_m.makeTranslation(0, 0, 0.7)).multiply(_m.makeScale(big, big, 1)); g.updateMatrixWorld(true);
        mesh(eyeGeo, eyeMat, g); const iris = mesh(big > 1.5 ? irisFar : irisGeo, eyeMat, g); iris.position.set(2, 0.5, 0);
        eyes.push({ g, iris, X, Y, lim: big > 1.5 ? 7 : 15, c: new THREE.Vector3(Math.cos(phi) * 277, 61.8, Math.sin(phi) * 277) });
      }
      const cp = new THREE.Vector3();
      ticks.push((dt, time, cam) => {
        cp.setFromMatrixPosition(cam.matrixWorld);
        for (const e of eyes) {
          _p.subVectors(cp, e.c); const l = Math.max(_p.length(), 1);
          const tx = clamp(_p.dot(e.X) / l * 26, -e.lim, e.lim), ty = clamp(_p.dot(e.Y) / l * 6, -1.5, 1.5);
          e.iris.position.x = Math.round(tx * 2) / 2; e.iris.position.y = ty;
        }
      });
    }
    await ctx.yield();
    // ---- two cockerels perched on the rim either side of the handle's roots, facing it
    {
      const parts = [piece([[-2.5, 3.2], [-1.0, 2.4], [1.2, 2.6], [2.4, 3.8], [2.6, 5.4], [2.2, 6.6], [2.6, 7.6], [3.2, 7.9, 1], [2.6, 8.2], [2.0, 8.6], [1.2, 8.0], [0.6, 6.2], [-0.8, 5.2], [-2.4, 5.0]])];
      parts.push(over([[1.3, 8.3], [1.6, 9.2], [2.0, 8.7], [2.3, 9.3], [2.6, 8.5], [2.0, 8.4]], 3, { raw: true }), over(disc(2.75, 7.3, 0.36, 7), 3, { raw: true }), over(disc(2.2, 8.0, 0.13, 5), 0, { raw: true }));
      parts.push(over([[-1.6, 4.6], [0.6, 5.0], [1.2, 3.8], [-0.6, 3.2]], 2));
      for (const s of [0, 1]) parts.push(piece(limb(0.3 - s * 0.7, 2.7, 0.15 - s * 0.3, 1.35, -0.1, 1.4, 0.24, 0.14), { raw: true }));
      for (let k = 0; k < 2; k++) parts.push(piece(xf([[0.2, 0.3], [-1.0, 3.0], [-3.0, 4.2], [-4.8, 2.8], [-5.2, 0.4, 1], [-4.0, 2.3], [-2.7, 3.0], [-1.4, 1.8], [-0.4, -0.4]], k * 0.16 - 0.08, -2.2, 4.6), { pose: k, per: 3 }),
        over(xf([[-0.6, 0.6], [-2.2, 2.0], [-3.6, 1.2, 1], [-2.2, 1.4]], k * 0.16 - 0.08, -2.2, 4.3), 3, { pose: k, per: 2 }));
      const geo = mergeGeometries(parts), im = instanced(geo, figMat(2, { poseRate: 1.5 }), 2, scene, (i) => i * 0.5);
      const X = new THREE.Vector3().crossVectors(endT, _y).normalize(), Y = new THREE.Vector3().crossVectors(X, endT).normalize(), Zh = new THREE.Vector3().crossVectors(X, Y);
      for (const sg of [-1, 1]) {                             // each on its root spur, facing the loop, in the plane of the handle
        _x.copy(X).multiplyScalar(-sg); _z.copy(Zh).multiplyScalar(-sg);
        _m.makeBasis(_x, Y, _z).scale(_p.set(1.3, 1.3, 1.3)).setPosition(endP.x + X.x * sg * 31.5 + Y.x * -14.3 + Zh.x * -2.6, endP.y + X.y * sg * 31.5 + Y.y * -14.3 + Zh.y * -2.6, endP.z + X.z * sg * 31.5 + Y.z * -14.3 + Zh.z * -2.6);
        im.setMatrixAt(sg < 0 ? 0 : 1, _m);
      }
      im.instanceMatrix.needsUpdate = true;
    }
    await ctx.yield();
    // ---- the handle palmettes: as on every kylix, a great palmette with volutes stands on the rim either side of the
    //      handle. Thick slabs like everything else; by night clay on the black field, the frame of the way out.
    {
      const parts = [], HY = 6, N = 9;
      for (let i = 0; i < N; i++) {
        const a = lerp(-1.36, 1.36, i / (N - 1)), len = 15.5 - 4.6 * Math.abs(a) / 1.36, w = 2.35;
        const pet = (l, ww) => xf([[-ww * 0.24, 2.6], [-ww * 0.5, l * 0.55], [-ww * 0.4, l * 0.86], [0, l], [ww * 0.4, l * 0.86], [ww * 0.5, l * 0.55], [ww * 0.24, 2.6]], a, 0, HY);
        parts.push(piece(pet(len, w), { raw: true, thick: 1.0 }));
        if (i % 2 === 0) parts.push(piece(pet(len - 2.2, w * 0.42).map((q, k) => (k === 0 || k === 6 ? [q[0] - Math.sin(a) * 2.4, q[1] + Math.cos(a) * 2.4] : q)), { raw: true, sub: 3, thick: 1.2 }));
      }
      parts.push(piece(disc(0, HY, 3.5, 18), { raw: true, thick: 1.0 }), piece(disc(0, HY, 2.2, 14), { raw: true, sub: 0, thick: 1.2 }), piece(disc(0, HY, 1.0, 9), { raw: true, sub: 3, thick: 1.4 }));
      for (const sg of [-1, 1]) {                             // the volutes it springs from, and the tendril that encloses it
        const L = [], R = [], n = 30;
        for (let i = 0; i <= n; i++) {
          const t = i / n, a = (sg > 0 ? Math.PI : 0) + sg * (-0.5 + t * 3.4 * Math.PI), r = 5.2 * (1 - 0.8 * t), w = 0.55 * (1 - 0.5 * t);
          const cx = sg * 7.6 + Math.cos(a) * r, cy = 1.2 + Math.sin(a) * r, nx = Math.cos(a), ny = Math.sin(a);
          L.push([cx + nx * w, cy + ny * w]); R.push([cx - nx * w, cy - ny * w]);
        }
        parts.push(piece(L.concat(R.reverse()), { raw: true, thick: 1.0 }));
        const o = [], inn = [];
        for (let i = 0; i <= 16; i++) { const a = sg * lerp(1.5, 0.05, i / 16), c = Math.sin(a), sn = Math.cos(a); o.push([c * 18.6, HY + sn * 18.6]); inn.push([c * 17.7, HY + sn * 17.7]); }
        parts.push(piece(o.concat(inn.reverse()), { raw: true, thick: 1.0 }));
      }
      parts.push(piece([[-13.5, -6], [13.5, -6], [13.5, -3.2], [-13.5, -3.2]], { raw: true, thick: 1.0 }), piece([[-12.6, -5], [12.6, -5], [12.6, -4.2], [-12.6, -4.2]], { raw: true, sub: 3, thick: 1.2 }));
      const one = mergeGeometries(parts), both = [];
      const X = new THREE.Vector3().crossVectors(endT, _y).normalize(), Zp = new THREE.Vector3().crossVectors(X, _y), hdx = Math.cos(HANDLE_AZ), hdz = Math.sin(HANDLE_AZ);
      for (const sg of [-1, 1]) {
        const g = one.clone();
        g.applyMatrix4(_m.makeBasis(X, _y, Zp).scale(_p.set(1.75, 1.75, 1.75)).setPosition(hdx * 371 + X.x * sg * 63, 137.5, hdz * 371 + X.z * sg * 63));
        both.push(g);
      }
      mesh(mergeGeometries(both), style.slab({ dry: 0.6, load: 26, strokeW: 2.4, wide: 0.3 }));
    }
    await ctx.yield();
    // ---- the brush: the one thing that does not belong to the pot. A tapered bundle 20 m wide and 60 m long hangs in
    //      from above the rim on the day side, its tip on the ray band, laying glaze as the wall turns under it
    {
      // (hand round "port") THE BRUSH HANGS FARTHER TO PORT: 140 m round the ray band from where the course crosses it (it was 56 m).
      // At 56 m it stood before the sea, 19 to 33 degrees to port of the line to the mast over the first 80 m of route (never across the
      // ship); the top of the frame cut its ferrule from u 0.095 to 0.134 and strangers read an oar or a blade, not a brush. At 140 m it
      // passes 132 m off (live 55 m): bundle and ferrule stand inside the frame at the left, the flat within 11 degrees of face-on, for the
      // length of the launching ramp (to 61 m of route; the handle runs out of the top of the frame in both), before the bowl's wall, clear of sea and ship.
      const BAZ = crossings(238, true)[0].th + 140 / 238, tip = new THREE.Vector3(Math.cos(BAZ) * 238, 37.3, Math.sin(BAZ) * 238);
      const parts = [piece([[0, 0, 1], [-4, 8], [-8, 24], [-10, 44], [-9.5, 60, 1], [9.5, 60, 1], [10, 44], [8, 24], [4, 8]], { thick: 2.2 })];
      for (let j = -2; j <= 2; j++) { const x = j * 3.3; parts.push(piece([[x * 0.3 - 0.1, 14], [x - 0.22, 58.5], [x + 0.22, 58.5], [x * 0.3 + 0.1, 14]], { raw: true, sub: 0, thick: 2.4 })); }
      parts.push(piece([[-9.5, 60], [9.5, 60], [8.2, 68], [-8.2, 68]], { raw: true, thick: 2.6 }), piece([[-9.3, 61.6], [9.3, 61.6], [8.7, 65.6], [-8.7, 65.6]], { raw: true, sub: 3, thick: 2.9 }),
        piece([[-9.45, 60.5], [9.45, 60.5], [9.35, 61.2], [-9.35, 61.2]], { raw: true, sub: 2, thick: 3.0 }), piece([[-8.6, 66.1], [8.6, 66.1], [8.5, 66.8], [-8.5, 66.8]], { raw: true, sub: 2, thick: 3.0 }));
      parts.push(piece([[-3, 68], [3, 68], [2.3, 420], [-2.3, 420]], { raw: true, thick: 2.2 }));
      const bm = mesh(mergeGeometries(parts), style.slab({ dry: 0.85, load: 75, strokeW: 2.6, wide: 0.3 }));
      // it leans in over the bowl and its flat is turned toward the top of the slide (by the route's point at u 0.07, below), so from the ramp and the slipway's first 16 m it is a brush in profile
      const Y = new THREE.Vector3(-Math.cos(BAZ) * 0.1, 0.995, -Math.sin(BAZ) * 0.1).normalize();
      const Z = path.pointAt(0.07, new THREE.Vector3()).sub(tip).addScaledVector(Y, -34); Z.addScaledVector(Y, -Z.dot(Y)).normalize();
      const X = new THREE.Vector3().crossVectors(Y, Z).normalize();
      bm.matrixAutoUpdate = false;
      const w0 = Math.abs(RING_V[0]) / RING_R[0];
      ticks.push((dt, time) => {
        const t9 = (time / 9) % 1, k = Math.sin(Math.PI * clamp(t9 / 0.2, 0, 1)), lift = 9 * k * k;
        bm.matrix.makeBasis(X, Y, Z).setPosition(tip.x + Y.x * lift, tip.y + Y.y * lift, tip.z + Y.z * lift); bm.matrixWorldNeedsUpdate = true;
        wallMat.uniforms.uBrush.value.set(BAZ, clamp(w0 * (time + 90), 0.5, 5.7), t9, w0);
      });
    }
    await ctx.yield();
    // ---- the sea rings' own creatures. Rings that carry figures turn by u, laid out so the course is always clear.
    const keyedRing = (R, dir, v, halfFirst, halfRest) => {
      const cr = crossings(R), A = (u) => dir * (v / R) * duration * u;
      const ok = (phi) => cr.every((c, ci) => {
        const half = (ci === 0 ? halfFirst : halfRest) / R;
        for (let u = c.u - (ci === 0 ? 0.16 : 0.03); u <= c.u + 0.031; u += 0.01) if (Math.abs(wrap(phi + A(u) - c.th)) < half) return false;
        return true;
      });
      return { A, ok, cr };
    };
    {   // a shoal of ninety tunny 5 m long, bellies purple, leaping in three held poses (or cuttlefish)
      const cut = castFish === 'cuttle', parts = [];
      const fish = [[2.5, 0, 1], [1.2, 0.7], [-0.6, 0.75], [-1.8, 0.25], [-2.5, 0.95, 1], [-2.15, 0, 1], [-2.5, -0.95, 1], [-1.8, -0.25], [-0.6, -0.7], [1.2, -0.6]];
      const belly = [[2.2, -0.12], [1.2, -0.6], [-0.6, -0.7], [-1.7, -0.25], [-0.5, -0.12], [1.2, -0.05]];
      const R3 = [0.5, 0, -0.5], Y3 = [1.0, 2.1, 1.0], X3 = [-1.2, 0, 1.2];
      for (let k = 0; k < 3; k++) {
        parts.push(piece(xf(fish, R3[k], X3[k], Y3[k]), { pose: k, per: 2 }), over(xf(belly, R3[k], X3[k], Y3[k]), cut ? 2 : 3, { pose: k, raw: true }));
        parts.push(piece(xf([[0.2, 0.7], [-0.5, 1.5], [-0.9, 0.72]], R3[k], X3[k], Y3[k]), { pose: k, raw: true }));
        if (cut) for (const a of [-0.3, 0, 0.3]) parts.push(piece(xf(xf([[0, 0.12], [2.2, 0.02], [2.2, -0.02], [0, -0.12]], a, 2.3, 0), R3[k], X3[k], Y3[k]), { pose: k, raw: true }));
      }
      const geo = mergeGeometries(parts), mat = figMat(3, { poseRate: 4, dry: 0.4, load: 5, strokeW: 0.8 });
      const per = Math.round(30 * lerp(0.75, 1, detail));
      for (const [R, dir, v] of [[117, -1, 6], [146, 1, 7], [160, -1, 6]]) {
        await ctx.yield();
        const kr = keyedRing(R, dir, v, 22, 13), g = group(), im = instanced(geo.clone(), mat, per, g);
        let c0 = rng() * TAU;
        for (let i = 0; i < per; i++) {
          if (i % 6 === 0) c0 = rng() * TAU;
          let phi = c0 + (i % 6) * 7 / R + rng() * 0.02, n = 0; while (!kr.ok(phi) && n++ < 200) phi += 0.03;
          standOn(im, i, R + (rng() - 0.5) * 5, -0.4, phi, dir, 0.9 + rng() * 0.3);
        }
        im.instanceMatrix.needsUpdate = true;
        ticks.push((dt, time, cam, u) => { g.rotation.y = -kr.A(u); g.position.y = seaLevel(u); });
      }
    }
    await ctx.yield();
    await ctx.yield();
    {   // six octopuses 14 m across standing in the sea, their eight arms re-curling between held poses
      const parts = [piece([[-2.6, 5.2], [-3.1, 7.6], [-1.9, 9.7], [0, 10.3], [1.9, 9.7], [3.1, 7.6], [2.6, 5.2], [1.5, 4.3], [-1.5, 4.3]])];
      for (const s of [-1, 1]) parts.push(over(disc(s * 1.15, 6.5, 0.62, 9), 2, { raw: true }), piece(disc(s * 1.15, 6.5, 0.24, 6), { raw: true, sub: 0, thick: 0.9 }));
      parts.push(over(disc(0, 8.6, 0.5, 7), 3, { raw: true }), over(disc(-1.1, 8.3, 0.34, 6), 3, { raw: true }), over(disc(1.1, 8.3, 0.34, 6), 3, { raw: true }));
      const CF = [0.75, 1.1, 1.5];
      for (let k = 0; k < 3; k++) for (let a = 0; a < 8; a++) {
        const side = a < 4 ? -1 : 1, j = a % 4, len = 9.2 - j * 1.1, n = 14, f = CF[(j % 2) ? k : 2 - k];
        let h = side > 0 ? -0.12 - j * 0.33 : Math.PI + 0.12 + j * 0.33, x = side * (0.5 + j * 0.5), y = 4.6;
        const L = [], Rr = [];
        for (let i = 0; i <= n; i++) {
          const t = i / n, w = 0.62 * (1 - t) + 0.1, nx = -Math.sin(h), ny = Math.cos(h);
          L.push([x + nx * w, y + ny * w]); Rr.push([x - nx * w, y - ny * w]);
          h += side * f * (0.05 + 0.62 * t * t); x += Math.cos(h) * len / n; y += Math.sin(h) * len / n;
        }
        parts.push(piece(L.concat(Rr.reverse()), { raw: true, pose: k }));
      }
      await ctx.yield();
      const geo = mergeGeometries(parts); geo.translate(0, -0.2, 0);
      await ctx.yield();
      const im = instanced(geo, figMat(3, { poseRate: 2, pingpong: true, dry: 0.5, load: 8, strokeW: 1.2 }), 6, scene);
      const spots = []; const rt = new THREE.Vector3();
      const beside = (R, last, side, off) => { const cr = crossings(R), c = cr[last ? cr.length - 1 : 0]; path.pointAt(c.u, _p); path.tangentAt(c.u, _t); rt.set(-_t.z, 0, _t.x).normalize();
        const px = _p.x + rt.x * side * off, pz = _p.z + rt.z * side * off; spots.push([R, Math.atan2(pz, px)]); };
      beside(125, true, 1, 17); beside(173, true, -1, 21);       // the port one stands out by the rays, clear of the fleet ring beside(153, false, -1, 27); beside(185, false, 1, 27);
      spots.push([125, 3.6], [185, 5.3]);
      spots.forEach((s, i) => standOn(im, i, s[0], 0, s[1], i % 2 ? 1 : -1, 1));
      im.instanceMatrix.needsUpdate = true;
      ticks.push((dt, time, cam, u) => { im.position.y = seaLevel(u); });
    }
    await ctx.yield();
    {   // flights of flying fish, wings white, crossing our bow in three held poses
      const parts = [];
      const fish = [[1.5, 0, 1], [0.6, 0.36], [-0.6, 0.3], [-1.2, 0.08], [-1.6, 0.5, 1], [-1.4, 0, 1], [-1.7, -0.6, 1], [-1.2, -0.1], [-0.4, -0.32], [0.7, -0.3]];
      parts.push(piece(fish, { per: 2, thick: 0.3 }), piece(disc(1.0, 0.08, 0.07, 5), { raw: true, sub: 0, thick: 0.4 }));
      const WA = [1.25, 0.75, 0.2];
      for (let k = 0; k < 3; k++) parts.push(piece(xf([[0.1, 0.05], [0.4, 0.45], [-0.9, 1.5], [-2.3, 1.9], [-1.5, 1.0], [-0.6, 0.05]], WA[k] - 0.9, 0.4, 0.2), { pose: k, raw: true, sub: 2, thick: 0.38 }),
        piece(xf([[0, 0], [-0.3, -0.5], [-1.1, -0.8], [-0.5, 0]], (WA[k] - 0.9) * -0.6, -0.1, -0.2), { pose: k, raw: true, sub: 2, thick: 0.38 }));
      const geo = mergeGeometries(parts), NFL = 30, im = instanced(geo, figMat(3, { poseRate: 8, pingpong: true }), NFL, scene);
      const flights = [0.315, 0.43, 0.7].map((uf, f) => { const o = { L: uf * path.length, p: path.pointAt(uf, new THREE.Vector3()), r: new THREE.Vector3(), sgn: f % 2 ? -1 : 1 }; path.tangentAt(uf, _t); o.r.set(-_t.z, 0, _t.x).normalize(); o.t = _t.clone().setY(0).normalize(); return o; });
      ticks.push((dt, time, cam, u) => {
        const sy = seaLevel(u);
        for (let i = 0; i < NFL; i++) {
          const fl = flights[i % 3], j = (i - i % 3) / 3, t = (u * path.length - (fl.L - 34)) / 20, lat = fl.sgn * (40 * t - 5.6 * (j - 4.5));     // a file, nose to tail: none overlaps another
          const hopA = lat * 0.13 + j * 1.3, hy = Math.abs(Math.sin(hopA)), sl = Math.cos(hopA) * Math.sign(Math.sin(hopA)) * 0.5 * fl.sgn;
          const s = Math.abs(lat) < 85 ? 1.2 : 0, al = 0;
          _x.copy(fl.r).multiplyScalar(fl.sgn); _x.y = sl * fl.sgn; _x.normalize(); _z.copy(fl.t).multiplyScalar(-1); _t.crossVectors(_z, _x).normalize();
          _m.makeBasis(_x, _t, _z).scale(_p.set(s, s, s)).setPosition(fl.p.x + fl.r.x * lat + fl.t.x * al, sy + 0.9 + 3.1 * hy, fl.p.z + fl.r.z * lat + fl.t.z * al);
          im.setMatrixAt(i, _m);
        }
        im.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();
//@@BUILD
    // ---- the wheel, the kiln, the reversal: everything the medium itself does
    // The reversal. One line lies still across the sea beyond the ship (FRONT_N, FRONT_REST): the far wall is already
    // red-figure. The second line is the one that moves: it stands square to the Vine Ship's keel, comes in from
    // astern, and then creeps along the hull from stern to bow for the whole second half of the arc, so the bilingual
    // join stands across the hull, the sail unbroken above it, before it runs on over the fleet and us.
    const frontAt = (u) => {
      if (u < 0.44) return 470;
      if (u < 0.53) { const k = (u - 0.44) / 0.09; return lerp(470, 30, 1 - (1 - k) * (1 - k)); }
      if (u < 0.61) return lerp(30, -24, (u - 0.53) / 0.08);
      const k = clamp((u - 0.61) / 0.08, 0, 1); return lerp(-24, -490, k * k);
    };
    const joinAt = new THREE.Vector3();
    const pois = [
      { at: new THREE.Vector3(0, 30, 0), from: 0.0, to: 0.09, weight: 0.5, fade: 0.3 },
      { at: new THREE.Vector3(0, 30, 0), from: 0.06, to: 0.21, weight: 0.3 },
      { at: new THREE.Vector3(0, 30, 0), from: 0.17, to: 0.36, weight: 0.5 },
      { at: new THREE.Vector3(0, 36, 0), from: 0.33, to: 0.53, weight: 0.62 },
      { at: (time, u) => { const th = hero.parts.turn.rotation.y, x = clamp(frontAt(u), -26, 22) + 4; return joinAt.set(x * Math.cos(th), 27, -x * Math.sin(th)); }, from: 0.47, to: 0.665, weight: 0.92, fade: 0.28 },
    ];
    return {
      scene, path, duration, title: 'The Wine-Dark Cup',
      pace: (u) => 1 - 0.36 * sstep(0.46, 0.53, u) * (1 - sstep(0.61, 0.68, u)),          // linger while the join stands on the hull
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 26, sway: 0.25, bank: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#EDE4D0', glow: 0.5, tilt: true, revealDistance: 300 },
      post: { exposure: 1, bloom: { strength: 0.1, radius: 0.4, threshold: 0.96 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0.018, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        const step = clamp(dt || 0, 0, 0.1);
        const slow = wheel === 'slowing' ? 1 - sstep(0.45, 0.82, u) : 1;
        for (let i = 0; i < 5; i++) {
          const v = wheel === 'oneway' ? Math.abs(RING_V[i]) : RING_V[i];
          if (wheel === 'slowing') ringAng[i] += (v / RING_R[i]) * step * slow; else ringAng[i] = (v / RING_R[i]) * time;
          ringRate[i] = (v / RING_R[i]) * slow;
          ringA[i] = -ringAng[i];
        }
        for (const rg of ringGroups) rg.g.rotation.y = -ringAng[rg.ring] * 0 + ringAng[rg.ring] * -1;
        style.update(dt, time, camera);
        hero.update(dt, time, camera);
        const th = hero.parts.turn.rotation.y;
        style.setFront(FRONT_N[0], FRONT_N[1], FRONT_REST, 2.5);
        style.setFront2(Math.cos(th), -Math.sin(th), frontAt(u), 1.1);
        for (const f of ticks) f(dt, time, camera, u);
      },
      dispose() { hero.dispose(); style.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
