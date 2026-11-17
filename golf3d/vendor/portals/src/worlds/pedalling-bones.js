// THE PEDALLING BONES (world id: pedalling-bones). After José Guadalupe Posada, 1852 to 1913.
// One black relief block on one sheet of cheap dyed paper: a tram avenue at noon packed with skeleton cyclists
// in hats, and a bone horse 90 m tall that gallops at us, over us, and at last out over the sheet's own border.
// Three sheets (one paper at a time) parted by two Rules of solid ink; the exit is a ring in the broken border.
// Each sheet has its own giant: the horse coming at us in the first, a grand lady calavera under a plumed brim leaning
// over the fronts of the second, and in the last a comet over the country end of the street as the horse jumps the border.
// A charro calavera stands up behind the first Rule as we dive at it; the last sheet has a band (guitars, drums, a tuba),
// a lady in her plumes and strings of pennants. A SECOND PRINTING, sparingly, as cheap two-colour broadsides had: one
// flat vermilion block a little off register (aMark.w + 4), only on accents: hat bands and bindings, every other plume,
// one loose sheet in five, one pennant in three, drum heads, a fan, the tuba's bell. Never on a building.
// Everything is ink, starved ink or the one paper (post.flat, no tone map, no lights, no fog, no textures):
// bones are bare paper inside inverted-hull contours, blacks are cut with the comb in each surface's own UV.
// Riders, tram, horse, hoof falls, roller, Rules and border are functions of u; flutter, sway and wobble loop on time.
// Variations by seed: paper order, weather (still / dust wind / engraver's rain with umbrellas), impression
// (fresh / worn), cast (town / country, with a bone mule cart). Rare: the double strike through the second sheet.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyleUniforms, inkMaterial, STYLE_GLSL, STYLE_FRAG_GLSL, PB_PALETTE,
  makeBuilder, loft, blob, bar, appendHulls } from '../parts/pedalling-bones.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const RULE1 = 265, RULE2 = 450, GATE_Z = 648, END_Z = 660, HALF_W = 13;   // the course along +Z
// THE SECOND RULE IS A TYPE RULE ACROSS THE STREET AT THE HEIGHT OF THE CORNICES: a thick bar BAR_Y0 to BAR_Y1 with a thin rule over it, the street open
// beneath it (the pack rides under; the flown line goes through the bar at BAR_YC). The first Rule is a slab from the street up, as it was.
const BAR_Y0 = 10, BAR_Y1 = 16.6, BAR_YC = 13.1, THIN_Y0 = 17.5, THIN_Y1 = 18.2, BAR_W = HALF_W + 2.5;
const SHEET3 = RULE2 - 2.5;       // where the third paper comes: the lens half a metre inside the bar's near skin, every face of the bar in the frame ink and ghost tone (no paper on them)
// THE NEAR SKIN'S TEAR, by the route's place alone: it begins when the lens is at TEAR_Z0 and its mean edge runs out TEAR_K m a metre of route
// (10 m at the crossing, z RULE2 - 3). The striped face holds until then; the tear then floods the picture.
const TEAR_Z0 = RULE2 - 8, TEAR_K = 2.4;
const X_AXIS = V3(1, 0, 0), Y_AXIS = V3(0, 1, 0), Z_AXIS = V3(0, 0, 1);

// monotone cubic through keys [[u, v], ...] (no overshoot, smooth speed): every scripted thing is a function of u
function keyed(keys) {
  const n = keys.length, xs = keys.map((k) => k[0]), ys = keys.map((k) => k[1]), d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  return (x) => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return ys[i] * (2 * t3 - 3 * t2 + 1) + m[i] * h * (t3 - 2 * t2 + t) + ys[i + 1] * (3 * t2 - 2 * t3) + m[i + 1] * h * (t3 - t2);
  };
}

// plain geometry from a builder, in short steps (attributes: position, normal, uv, aMark, aAux, aBone)
async function finish(B, Y, instanced = false) {
  while (B.hullFrom.length) { appendHulls(B, 60); await Y(); }
  const g = instanced ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
  const big = B.pos.length > 60000;                       // a large mesh hands its arrays over one at a time
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); if (big) await Y();
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3)); if (big) await Y();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.setAttribute('aMark', new THREE.Float32BufferAttribute(B.mark, 4)); if (big) await Y();
  g.setAttribute('aAux', new THREE.Float32BufferAttribute(B.aux, 2));
  g.setAttribute('aBone', new THREE.Float32BufferAttribute(B.bone, 1)); if (big) await Y();
  g.setIndex(B.pos.length / 3 > 65000 ? new THREE.Uint32BufferAttribute(B.idx, 1) : new THREE.Uint16BufferAttribute(B.idx, 1));
  g.boundingSphere = new THREE.Sphere(V3(0, 20, 330), 900);
  B.pos = B.nor = B.uv = B.mark = B.aux = B.bone = B.idx = null;      // a builder is done once finished: let its arrays go, so the page's collector has less to walk
  await Y();
  return g;
}

// a flat quad into a builder (corners a, b, c, d counter-clockwise seen from its front), uv in metres from (u0, v0)
function quad(B, a, b, c, d, mark, part = 0, uv = null) {
  const base = B.pos.length / 3, n = V3(0, 0, 0).subVectors(b, a).cross(V3(0, 0, 0).subVectors(d, a)).normalize();
  const w = a.distanceTo(b), h = a.distanceTo(d), q = uv || [0, 0, w, h];
  const uvs = [[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]];
  [a, b, c, d].forEach((p, i) => {
    B.pos.push(p.x, p.y, p.z); B.nor.push(n.x, n.y, n.z); B.uv.push(uvs[i][0], uvs[i][1]);
    B.mark.push(mark[0], mark[1], mark[2], Math.round(mark[3] * 1024) / 1024); B.aux.push(0, 1); B.bone.push(part);
  });
  B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
// an axis-aligned box of ink or paper (5 or 6 faces), uv in metres on each face
function box(B, x0, x1, y0, y1, z0, z1, mark, part = 0, faces = 'xXyYzZ') {
  const P = (x, y, z) => V3(x, y, z);
  if (faces.includes('z')) quad(B, P(x1, y0, z0), P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), mark, part);
  if (faces.includes('Z')) quad(B, P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), mark, part);
  if (faces.includes('x')) quad(B, P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), mark, part);
  if (faces.includes('X')) quad(B, P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), mark, part);
  if (faces.includes('Y')) quad(B, P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0), mark, part);
  if (faces.includes('y')) quad(B, P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1), mark, part);
}

// ---------------------------------------------------------------------------------------------
// THE WORLD'S OWN MARKS, added to the hero's ink material as modes 6 and up (one fragment text for every mesh).
//   6 front (uv metres, aMark.y width, .z height)   7 wheel (uv metres from the hub, vX.x spin)
//   8 teeth band    9 street (world xz)   10 penny sheet   11 Rule skin (vX.x burst)   12 cartouche-less ornament bar
// ---------------------------------------------------------------------------------------------
const FRAG_PRE = /* glsl */`
uniform float uU, uShift; uniform vec4 uBurst;
const float RIM_W = 0.06;                                                                   // the torn rim of the second Rule's holes, metres
const float GHOST = 1.;                                                                   // THE GHOST TONE of the cuts inside the second Rule: the ink lifted this share of the way to the starved ink (no paper in it)
// THE TEAR'S FIELD on a Rule's skin (uv in metres on the sheet): the distance from the hole's middle (uv 0, 2.5), made ragged; the hole is where it is under r
float wTear(vec2 uv, float seed){ return length(uv - vec2(0., 2.5)) + 3.2 * (pbNoise(uv * 0.45 + seed * 9.) - 0.5) + 1.3 * (pbNoise(uv * 1.9) - 0.5); }
// the field on a ring of eight readings round a place, as a sum of waves round the ring (S0, S1, S2, S3, S4: the sums of the readings less the
// field at the place, each times 1, the cosine and sine of 1, 2 and 3 times its angle, and the cosine of 4 times it): for the direction e,
// x = half the difference and y = half the sum of the two readings where the line through the place along e meets the ring
vec2 wRing(vec2 e, float S0, vec2 S1, vec2 S2, vec2 S3, float S4){ vec2 e2 = vec2(e.x * e.x - e.y * e.y, 2. * e.x * e.y);
  return vec2(0.25 * (dot(S1, e) + dot(S3, vec2(e.x * e2.x - e.y * e2.y, e.y * e2.x + e.x * e2.y))), 0.125 * S0 + 0.25 * dot(S2, e2) + 0.125 * S4 * (e2.x * e2.x - e2.y * e2.y)); }
// how far along a line from a place the field falls to r: the field there is f0 over r; along the line it is taken as the parabola through that
// and the ring's two readings on the line (oe, from wRing; the ring's radius s1), its fall times k. 1e3 where it does not fall to r at all.
float wReach(vec2 oe, float f0, float s1, float k){ float gk = -oe.x / s1, ck = 2. * oe.y / (s1 * s1), dk = k * (k * gk * gk - 2. * f0 * ck), rk = sqrt(max(dk, 0.)); return dk >= 0. && k * gk + rk > 1e-6 ? 2. * f0 / (k * gk + rk) : 1e3; }
float c1(float d, float a){ return clamp(0.5 - d / max(a, 1e-5), 0., 1.); }                 // coverage of d < 0
float rect(vec2 p, vec2 c, vec2 h, vec2 a){ vec2 d = abs(p - c) - h; return c1(d.x, a.x) * c1(d.y, a.y); }
float rule(float d, float hw, float a){ return clamp((max(hw, 0.8 * a) - d) / max(a, 1e-5) + 0.5, 0., 1.); }   // a line that never thins under 1.6 px
float wDashes(vec2 w, vec2 cell, float sp, float hw0, vec2 a){
  vec2 id = floor(w / cell); vec2 f = w - (id + 0.5) * cell;
  float h = pbHash(id + 3.7), h2 = pbHash(id * 1.3 + 9.1);
  f.x += (h2 - 0.5) * cell.x * 0.4;
  float k = clamp(floor(f.y / sp + 0.5), -1., 1.);
  float dz = abs(f.y - k * sp), len = cell.x * (0.2 + 0.2 * pbHash(id + k * 7.3));
  float c = clamp((max(hw0, 0.8 * a.y) - dz) / a.y + 0.5, 0., 1.) * c1(abs(f.x + k * 0.1 * cell.x) - len, a.x);
  return c * step(0.45, h) * (1. - smoothstep(0.26, 0.4, a.y / sp));
}
// the country round the town, seen from above: a patchwork of ploughed plots (solid ink cut with broad furrow bundles,
// paper lanes between) and maguey plots (rows of black rosettes on bare paper)
float wFields(vec2 w, vec2 a){
  vec2 cell = vec2(24., 31.), id = floor(w / cell), f = w - id * cell;
  float h = pbHash(id + 11.3), h2 = pbHash(id * 1.7 + 4.1), aa = max(a.x, a.y);
  float e = min(min(f.x, cell.x - f.x), min(f.y, cell.y - f.y));
  float edge = rule(abs(e - 1.0), 0.13, aa) * smoothstep(5., 9., cell.x / aa) * step(0.1, fract(h2 * 9. + (f.x + f.y) * 0.031));   // a broken rule round every plot
  if (h < 0.3) {                                                         // ploughed, near: solid ink cut with broad furrow bundles; far: bare paper in its rule
    float cut = h2 < 0.5 ? pbComb(f + h * 40., vec2(1.9, 7.5), a, h2) : pbComb(f.yx + h * 40., vec2(1.9, 7.5), a.yx, h2);
    return max(edge, c1(2.3 - e, aa) * (1. - cut) * (1. - smoothstep(0.05, 0.09, aa / 1.9)));
  }
  if (h < 0.62) {                                                        // ploughed the other way: black furrow lines on paper
    float co = h2 < 0.5 ? f.x : f.y, ac = h2 < 0.5 ? a.x : a.y, d = abs(fract(co / 1.7) - 0.5) * 1.7;
    return max(edge, rule(d, 0.13, ac) * smoothstep(1.4, 2.6, 1.7 / ac) * c1(2.3 - e, aa) * step(0.12, fract(pbHash(vec2(floor(co / 1.7), h2)) + (f.x + f.y) * 0.02)));
  }
  vec2 g = vec2(8., 7.75), gi = floor(f / g), q = f - (gi + 0.5) * g;
  float hh = pbHash(gi + id * 13.1);
  q += (vec2(hh, fract(hh * 7.7)) - 0.5) * 1.2;
  float r = length(q), th = atan(q.y, abs(q.x) < 1e-5 ? 1e-5 : q.x);
  float cth = abs(cos(th * 3.5 + hh * 6.)), R = 3.1 * (0.7 + 0.4 * hh);
  float star = c1(r - R * (0.3 + 0.7 * cth * cth * cth), aa) * (1. - c1(r - 0.4, aa));
  return max(edge, star * c1(2.2 - e, aa) * (1. - smoothstep(0.3, 0.55, aa / R)));
}
float wStreet(vec2 w, vec2 a){
  float ink = 0.;
  if (w.y < ${(GATE_Z - 2.4).toFixed(1)}) {
    for (int i = 0; i < 2; i++) {                                         // two tram tracks: four black rules
      float c = i == 0 ? 4.3 : 7.3, vis = smoothstep(2.2, 3.6, 1.4 / a.x);
      ink = max(ink, max(rule(abs(abs(w.x - c) - 0.7), 0.055, a.x) * vis, rule(abs(w.x - c), 0.055, a.x) * (1. - vis)));
    }
    ink = max(ink, rule(abs(abs(w.x) - 12.35), 0.07, a.x));                 // the kerbs
    ink = max(ink, wDashes(w, vec2(1.7, 2.6), 0.22, 0.035, a));
    ink = max(ink, wDashes(w + 31.7, vec2(5.2, 9.5), 0.75, 0.10, a));
    ink = max(ink, wDashes(w * vec2(1., 1.) + vec2(11.3, 57.9), vec2(2.9, 4.3), 0.4, 0.06, a) * step(abs(w.x), 12.2));
    ink = max(ink, wDashes(w + vec2(63.1, 5.2), vec2(3.7, 6.1), 0.52, 0.075, a) * step(abs(w.x), 12.2));
    ink = max(ink, wDashes(w.yx * vec2(0.14, 1.) + 77.1, vec2(3.1, 17.), 4.1, 0.022, a.yx * vec2(0.14, 1.)) * step(abs(w.x), 12.));   // long scores the wheels left
  }
  ink = max(ink, c1(abs(w.y - ${RULE1}.) - 3., a.y) * step(abs(w.x), 13.5));                   // under the first Rule the street is ink
  ink = max(ink, c1(abs(w.y - ${RULE2}.) - 1.1, a.y) * step(abs(w.x), 13.5));                  // under the second Rule (a bar in the air) the street carries a thick and a thin rule, as under the border
  ink = max(ink, c1(abs(w.y - ${(RULE2 - 2.1).toFixed(1)}) - 0.25, a.y) * step(abs(w.x), 13.5));
  ink = max(ink, c1(abs(w.y - ${GATE_Z}.) - 1.1, a.y) * c1(abs(w.x) - 22., a.x));          // the border's bottom rules
  ink = max(ink, c1(abs(w.y - ${(GATE_Z - 2.1).toFixed(1)}) - 0.25, a.y) * c1(abs(w.x) - 19.3, a.x));
  if (abs(w.x) > (w.y > ${RULE2 + 3}. ? 26.5 : 78.)) ink = max(ink, wFields(w, a));
  return ink;
}
// a wordless front: solid ink opened by paper doors, windows, awning stripes, an empty cartouche and comb-cut bars
float wFront(vec2 uv, float W, float H, float seed, vec2 a, float clog, vec2 fw){
  float nb = max(1., floor(W / 3.5 + 0.5)), bw = W / nb, bi = clamp(floor(uv.x / bw), 0., nb - 1.), bx = uv.x - (bi + 0.5) * bw;
  float hb = pbHash(vec2(bi, seed * 91.)), hs = pbHash(vec2(seed * 31., 2.));
  vec2 p = vec2(bx, uv.y);
  float door = step(0.42, hb), paper = 0.;
  vec2 dh = mix(vec2(1.15, 1.2), vec2(0.72, 1.5), door); float cy = mix(1.95, 1.56, door);
  float open = rect(p, vec2(0., cy), dh, a);
  float bars = max(rule(abs(bx), 0.06, a.x) * door, rule(abs(abs(bx) - 0.42), 0.05, a.x) * (1. - door));
  bars = max(bars, rule(abs(uv.y - (cy + dh.y - 0.55)), 0.05, a.y));
  paper = open * (1. - bars);
  float awn = step(0.5, pbHash(vec2(bi + 7., seed * 17.))) * step(hs, 0.75);                 // striped awning over half the bays
  float sx = bx / 0.36, tri = abs(fract(sx) - 0.5) * 0.36;
  float stripeVis = smoothstep(1.3, 2.4, 0.36 / max(a.x, 1e-5));
  float stripe = c1(abs(fract(sx * 0.5) - 0.5) * 0.72 - 0.18, a.x) * stripeVis;
  paper = max(paper, awn * stripe * c1(abs(bx) - (bw * 0.5 - 0.3), a.x) * c1(uv.y - 4.15, a.y) * c1(3.3 + tri * 0.6 - uv.y, a.y));
  // the shop board: an empty cartouche (a broken double rule round bare paper), or a comb-cut ornament bar
  float by = uv.y - 5.15, cw = W * 0.5 - 0.7, bxx = uv.x - W * 0.5;
  float carto = step(0.4, hs);
  float outer = rect(vec2(bxx, by), vec2(0.), vec2(cw, 0.52), a) * (1. - rect(vec2(bxx, by), vec2(0.), vec2(cw - 0.09, 0.43), a));
  outer *= step(0.12, fract(uv.x * 0.31 + seed * 5.)) * smoothstep(1., 2., 0.09 / max(max(a.x, a.y), 1e-5));    // nicked and broken
  float inner = rect(vec2(bxx, by), vec2(0.), vec2(cw - 0.22, 0.30), a);
  float orn = pbComb(vec2(by + 0.5 + seed, uv.x), vec2(0.25, 1.1), fw.yx, seed) * c1(abs(by) - 0.5, a.y) * c1(abs(bxx) - cw, a.x) * (1. - clog);
  paper = max(paper, mix(orn, max(outer, inner), carto));
  // upper floors: a window to each bay, a sill with a bundle hanging under it
  float fy = uv.y - 6.3, fh = 3.3, nf = max(1., floor((H - 7.4) / fh)), fi = floor(fy / fh);
  float inF = step(0., fy) * step(fi, nf - 0.5), wy = fy - (fi + 0.5) * fh;
  float win = rect(vec2(bx, wy), vec2(0., 0.15), vec2(0.58, 1.02), a);
  float mull = max(rule(abs(bx), 0.045, a.x), rule(abs(wy - 0.45), 0.045, a.y));
  float sill = rect(vec2(bx, wy), vec2(0., -1.08), vec2(0.95, 0.07), a);
  float hang = pbBundle(vec2(bx, wy + 1.42), vec2(0.5, 0.42), 5., fw) * (1. - clog);
  paper = max(paper, inF * max(max(win * (1. - mull), sill), hang));
  // fluted piers between the bays, a cornice of comb bundles under a paper rule
  float pier = c1(bw * 0.5 - 0.22 - abs(bx), a.x) * c1(6.0 - uv.y, a.y) * c1(uv.y - (H - 1.5), a.y);
  paper = max(paper, pier * pbComb(vec2(bx + bw * 0.5 + 0.11, uv.y), vec2(0.22, 1.3), fw, seed + 1.) * (1. - clog) * step(0.35, hs));
  paper = max(paper, pbComb(uv, vec2(0.25, 0.8), fw, seed + 2.) * c1(abs(uv.y - (H - 0.72)) - 0.36, a.y) * (1. - clog));
  paper = max(paper, rule(abs(uv.y - (H - 1.3)), 0.04, a.y) * step(0.2, fract(uv.x * 0.17 + seed)));
  // the wall between the windows: one tall comb bundle each side of every window, floor by floor
  float at0 = 6.3 + nf * fh + 0.15, atH = H - 1.55 - at0;
  paper = max(paper, pbComb(vec2(uv.x + seed * 3., uv.y - at0), vec2(1.12, max(atH, 0.5)), fw, seed + 5.) * c1(abs(uv.y - at0 - atH * 0.5) - atH * 0.5, a.y) * step(0.9, atH) * (1. - clog));
  float wsx = abs(bx) - (bw * 0.25 + 0.36);
  paper = max(paper, inF * pbComb(vec2(wsx + 0.27, fy + 0.4), vec2(0.54, fh), fw, seed + 3. + bi) * c1(abs(wsx) - 0.25, a.x) * (1. - clog));
  return 1. - paper;
}
// a roof seen from above: a black parapet, a paper rule inside it, the flat cut with broad comb bundles; some have a
// paper court with a few dashes and a well, some a row of skylights
float wRoof(vec2 uv, float W, float D, float seed, vec2 a, float clog, vec2 fw){
  float e = min(min(uv.x, W - uv.x), min(uv.y, D - uv.y)), ae = max(a.x, a.y);
  float h1 = pbHash(vec2(seed * 53., 1.)), h2 = pbHash(vec2(seed * 29., 7.));
  float field = h1 < 0.5 ? pbComb(uv + seed * 40., vec2(1.9, 5.6), fw, seed) : pbComb(uv.yx + seed * 40., vec2(1.9, 5.6), fw.yx, seed);
  float paper = field * c1(1.05 - e, ae) * (1. - clog);
  paper = max(paper, rule(abs(e - 0.62), 0.075, ae));
  vec2 c = vec2(W, D) * 0.5, p = uv - c;
  if (h2 > 0.45 && D > 10.5) {                                           // the court
    vec2 hh = vec2(W * 0.23, D * 0.27);
    float court = rect(p, vec2(0.), hh, a), rim = rect(p, vec2(0.), hh + 0.55, a);
    float well = c1(abs(length(p) - 0.7) - max(0.14, 1.2 * ae), ae);
    float dash = wDashes(uv + seed * 13., vec2(1.7, 2.6), 0.22, 0.04, a);
    paper = max(paper * (1. - rim), court * (1. - max(well, dash)));
  } else if (h2 < 0.3) {                                                 // skylights
    float k = floor(p.y / 2.6), fy = p.y - (k + 0.5) * 2.6;
    float sky = rect(vec2(p.x, fy), vec2(0.), vec2(1.5, 0.8), a) * step(abs(k + 0.5), D * 0.5 / 2.6 - 1.2);
    float rimS = rect(vec2(p.x, fy), vec2(0.), vec2(1.85, 1.15), a) * step(abs(k + 0.5), D * 0.5 / 2.6 - 1.2);
    paper = max(paper * (1. - rimS), sky * (1. - max(rule(abs(p.x), 0.06, a.x), rule(abs(fy), 0.05, a.y))));
  }
  return 1. - paper;
}
`;
const FRAG_EXTRA = /* glsl */`
  if (mode < 6.5) {
    ink = wFront(vUv, vMark.y, vMark.z, seed, fw, clog, fw);
    if (uShift > 0.001) { float g2 = wFront(vUv - vec2(1.5, -0.3) * uShift, vMark.y, vMark.z, seed, fw, clog, fw); starveAdd = clamp(g2 - ink, 0., 1.); ink = max(ink, g2 * 0.999); }
  }
  else if (mode > 8.5 && mode < 9.5) {
    ink = wStreet(vW.xz, fwW); q = vW.xz;
    if (uShift > 0.001) { float g2 = wStreet(vW.xz + vec2(uShift, 0.), fwW); starveAdd = clamp(g2 - ink, 0., 1.); ink = max(ink, g2 * 0.999); }
  }
  else if (mode < 7.5) {                                                // a wheel: rim, hub, ten spokes turning with the distance ridden
    float r = length(vUv), a = max(fw.x, fw.y); if (r > 0.372) discard;
    float ang = atan(vUv.y, abs(vUv.x) < 1e-5 ? 1e-5 : vUv.x) + vX.x, pitch = 0.6283 * r;
    float sp = abs(fract(ang / 0.6283) - 0.5) * pitch;
    ink = max(c1(abs(r - 0.34) - 0.03, a), max(c1(r - 0.05, a), rule(sp, 0.005, a) * c1(r - 0.33, a) * smoothstep(2.2, 3.6, 0.6283 * 0.2 / a)));
  }
  else if (mode < 8.5) {                                                // a row of teeth: paper, parted by black cuts, a black line at gum and bite
    float t = 0.036, a = max(fw.x, 1e-5), gaps = rule(abs(fract(vUv.x / t) - 0.5) * t, 0.004, a) * smoothstep(1.6, 3., t / a);
    ink = max(gaps, max(c1(vUv.y - 0.07, fw.y), c1(0.93 - vUv.y, fw.y)));
  }
  else if (mode > 12.5 && mode < 13.5) {                                // the one ground mark: a cluster of short dashes under a wheel, paw or hoof
    float k = clamp(floor(vUv.y / 0.18 + 0.5), -1., 1.), len = 0.42 - 0.1 * abs(k + 0.4 + seed);
    ink = clamp((max(0.028, 0.8 * fw.y) - abs(vUv.y - k * 0.18)) / fw.y + 0.5, 0., 1.) * c1(abs(vUv.x - k * 0.06) - len, fw.x) * (1. - smoothstep(0.3, 0.45, fw.y / 0.18));
    if (ink < 0.01) discard;
  }
  else if (mode > 10.5 && mode < 11.5) {                               // a Rule's skin: solid ink cut in bundles, torn open round its hole's middle (uv 0, 2.5) as its channel of uBurst grows
    float t = vMark.y < 0.5 ? uBurst.x : vMark.y < 1.5 ? uBurst.y : vMark.y < 2.5 ? uBurst.z : uBurst.w;
    float d = wTear(vUv, seed);
    float r = 34. * sqrt(max(t, 0.)) - 2.;
    if (d < r) discard;
    float cut, tear;                                                     // tear: the paper a skin's own tearing lays on it. The cut edges wobble a little, as an inked edge does (wb, wv)
    if (abs(vMark.z) > 0.5) {                                            // THE SECOND RULE'S SKINS (mark z -1 outside, 1 inside). It is a bar: two 3.3 m bundles lie along it, as a type rule's do
      float wb = 0.07 * sin(uTime * 2.3 + vUv.x * 0.37) + 0.04 * sin(uTime * 3.7 + vUv.x * 1.3); cut = pbComb(vec2(vUv.y + 40.2 + wb, vUv.x + 40.), vec2(3.3, 9.), fw.yx, seed);
      // THE TORN RIM: once a skin's law has begun, a band of bare paper lies along its hole's ragged edge, RIM_W m of the sheet wide and never under
      // 1.5 px, hard-edged as print: the hole is a tear in a printed sheet, and the tear with its rim is the whole event here (no cracks on the bar).
      // The band is every place of the sheet that has the hole within that width of it, in any direction. It is found from the field itself, with
      // no screen derivative in this chain (fw comes from the top of main). The field is read at eight places on a ring round this one, a band's
      // reach (s1) off (S0 to S4 hold the ring as a sum of waves round it: wRing). Along sixteen lines from here (the first straight down the
      // slope, then two more beside the best of them) the hole's distance is taken from the field here and the ring's two readings on the line
      // (wReach); the least of them is the hole's distance. Where the field has a hollow close by (the bottom of the paraboloid that fits the
      // ring best, dm away) a line is tried through that bottom too; and where the bottom is within reach (a hole about to be born, or just
      // born) the field is read once more there and every line's fall is set right by it (k; while the bottom itself is still above r the fall
      // is never made steeper than the ring gives it). So a hollow that is not yet a hole lays no paper,
      // a new hole's rim is about as wide as any other (at the hole's very middle, where the field is a cone's tip, it can be a pixel or two
      // short on one side for a frame), and where two holes are about to join their rims meet as two bands do.
      float f0 = d - r, a0 = max(fw.x, fw.y), s1 = max(RIM_W, 1.5 * a0) + a0; tear = 0.;
      if (f0 < 10. * s1) {                                                 // (the field's slope is under 10 a metre: farther up it than this no rim can be)
        vec2 e = vec2(1., 0.), S1 = vec2(0.), S2 = vec2(0.), S3 = vec2(0.); float S0 = 0., S4 = 0.;
        for (int j = 0; j < 4; j++) {                                      // the ring, by opposite pairs
          float fp = wTear(vUv + s1 * e, seed) - d, fm = wTear(vUv - s1 * e, seed) - d; vec2 e2 = vec2(e.x * e.x - e.y * e.y, 2. * e.x * e.y);
          S0 += fp + fm; S1 += (fp - fm) * e; S2 += (fp + fm) * e2; S3 += (fp - fm) * vec2(e.x * e2.x - e.y * e2.y, e.y * e2.x + e.x * e2.y); S4 += (fp + fm) * (e2.x * e2.x - e2.y * e2.y);
          e = 0.70711 * vec2(e.x - e.y, e.x + e.y);
        }
        vec2 G = S1 / (4. * s1); float g = length(G), hxx = 0.25 * (S0 + 2. * S2.x) / (s1 * s1), hyy = 0.25 * (S0 - 2. * S2.x) / (s1 * s1), hxy = 0.5 * S2.y / (s1 * s1);    // the paraboloid that fits the ring best: f0 + G p + p H p / 2
        float det = hxx * hyy - hxy * hxy; vec2 dm = det > 1e-6 ? vec2(hxy * G.y - hyy * G.x, hxy * G.x - hxx * G.y) / det : vec2(1e3); float lm = length(dm), k = 1.;     // dm: from here to its bottom
        bool hollow = det > 1e-6 && hxx + hyy > 0. && lm < 2. * s1; vec2 em = dm / max(lm, 1e-6);
        if (hollow && lm < s1) { vec2 oe = wRing(em, S0, S1, S2, S3, S4); float fb = wTear(vUv + dm, seed) - d; k = clamp(fb / min((oe.x + oe.y * lm / s1) * lm / s1, -1e-7), 0.25, f0 + fb > 0. ? 1. : 4.); }
        e = g > 1e-5 ? -G / g : vec2(1., 0.); float a = length(e * fw), w = max(RIM_W, 1.5 * a);   // a: metres of the sheet under one pixel, down the slope
        float s = hollow ? wReach(wRing(em, S0, S1, S2, S3, S4), f0, s1, k) : 1e3; vec2 es = e;
        for (int j = 0; j < 16; j++) {
          float sk = wReach(wRing(e, S0, S1, S2, S3, S4), f0, s1, k); if (sk < s) { s = sk; es = e; }
          e = vec2(0.92388 * e.x - 0.38268 * e.y, 0.38268 * e.x + 0.92388 * e.y);
        }
        e = 0.19509 * vec2(-es.y, es.x); es *= 0.980785;                     // and two lines more, half a step either side of the best of the sixteen
        s = min(s, min(wReach(wRing(es + e, S0, S1, S2, S3, S4), f0, s1, k), wReach(wRing(es - e, S0, S1, S2, S3, S4), f0, s1, k)));
        tear = step(1e-6, t) * clamp((w - s) / a + 0.5, 0., 1.);
      }
    } else {                                                             // THE FIRST RULE'S SKINS and the bar's top skin (mark z 0): 2.7 m bundles standing upright
      vec2 wv = vec2(0.07 * sin(uTime * 2.3 + vUv.y * 0.37) + 0.04 * sin(uTime * 3.7 + vUv.y * 1.3), 0.); cut = pbComb(vUv + 40. + wv, vec2(2.7, 8.5), fw, seed);
      // the cracks that run ahead of the first Rule's holes (its channels: mark y 0 and 1); the bar's top skin (mark y 3) has none
      tear = rule(abs(pbNoise(vUv * 0.3 + 4.) - 0.5) * 6., 0.05, max(fw.x, fw.y) * 1.5) * smoothstep(r + 8., r + 1., d) * step(0.001, t) * step(vMark.y, 1.5);
    }
    ink = 1. - max(cut * (1. - clog) * step(vMark.z, 0.5), tear); starveMul = step(vMark.z, 0.5);
    starveAdd = GHOST * cut * (1. - clog) * step(0.5, vMark.z);            // the far skin seen from inside (mark z 1) stays ink: its cuts print in the ghost tone
  }
  else if (mode > 13.5 && mode < 14.5) {                               // the tram's side: comb-cut panels, paper windows full of hats
    vec2 a = fw; float aa = max(a.x, a.y), dirn = vMark.y;
    float paper = pbComb(vUv, vec2(0.25, 0.95), fw, seed) * c1(abs(vUv.y - 0.62) - 0.5, a.y) * (1. - clog);
    float wx = vUv.x - 0.3, wi = floor(wx / 1.4), fx = wx - (wi + 0.5) * 1.4, inW = step(0., wi) * step(wi, 5.5);
    float win = rect(vec2(fx, vUv.y), vec2(0., 1.97), vec2(0.6, 0.54), a) * inW;
    float h = pbHash(vec2(wi, seed * 7.)), hx = (fx - (h - 0.5) * 0.24) / 1.35, hy = (vUv.y - 1.76) / 1.35, kind = fract(h * 7.3); a /= 1.35; aa /= 1.35;
    float head = c1(abs(length(vec2(hx, hy * 0.92)) - 0.15) - max(0.016, 1.25 * aa), aa);
    head = max(head, c1(length(vec2(hx - 0.065 * dirn, hy - 0.025)) - 0.042, aa));
    head = max(head, rect(vec2(hx - 0.11 * dirn, hy + 0.085), vec2(0.), vec2(0.055, 0.014), a));
    float crownH = kind < 0.4 ? 0.13 : kind < 0.7 ? 0.3 : 0.2, crownW = kind < 0.7 ? 0.14 : 0.1, brim = kind < 0.4 ? 0.2 : kind < 0.7 ? 0.21 : 0.42;
    float hat = max(rect(vec2(hx, hy), vec2(0., 0.14 + crownH * 0.5), vec2(crownW, crownH * 0.5), a), rect(vec2(hx, hy), vec2(0., 0.135), vec2(brim, 0.024), a));
    paper = max(paper, win * (1. - max(head, hat)));
    paper = max(paper, rule(abs(vUv.y - 2.62), 0.03, fw.y) * step(0.1, fract(vUv.x * 0.37 + seed)));
    ink = 1. - paper;
  }
  else if (mode > 14.5 && mode < 15.5) {                               // the burst star on the wire: it changes shape, never brightness
    float k = floor(uU * 80.), f = smoothstep(0., 0.5, fract(uU * 80.));
    float r = length(vUv), th = atan(vUv.y, abs(vUv.x) < 1e-5 ? 1e-5 : vUv.x), aa = max(fw.x, fw.y);
    float n0 = 6. + floor(pbHash(vec2(k, 1.)) * 4.), n1 = 6. + floor(pbHash(vec2(k + 1., 1.)) * 4.);
    float t0 = abs(sin(th * n0 * 0.5 + k)), t1 = abs(sin(th * n1 * 0.5 + k + 1.));
    float rs = mix(0.3 + 0.55 * t0 * t0 * t0, 0.3 + 0.55 * t1 * t1 * t1, f);
    float line = c1(abs(r - rs) - max(0.035, 1.25 * aa), aa);
    float ray = rule(abs(sin(th * 5. + k * 1.7)) * r * 0.2, 0.03, aa) * c1(abs(r - 1.25) - 0.2, aa);
    ink = max(line, ray);
    if (r > rs && ink < 0.05) discard;
  }
  else if (mode > 9.5 && mode < 10.5) {                                // a loose penny sheet: paper in a contour, black ruled bands, a comb-cut block; no letter shapes
    vec2 sz = vMark.yz, m = vUv * sz, f2 = fw * sz, hs = sz * 0.5; float e = min(hs.x - abs(m.x), hs.y - abs(m.y)), fe = max(f2.x, f2.y);
    float y = (m.y + hs.y) / sz.y, x = abs(m.x) / hs.x;
    ink = pbEdge(e, 0.012, fe);
    ink = max(ink, c1(abs(y - 0.86) - 0.045, fw.y) * c1(x - 0.78, fw.x * 2.));
    ink = max(ink, (1. - pbComb(m + 3., vec2(0.05, 0.1), f2, 0.37)) * c1(abs(y - 0.6) - 0.15, fw.y) * c1(abs(vUv.x + 0.1) - 0.24, fw.x));
    float ln = rule(abs(fract(y / 0.07) - 0.5) * 0.07 * sz.y, 0.006, f2.y) * smoothstep(1.6, 3., 0.07 * sz.y / f2.y);
    ink = max(ink, ln * c1(x - 0.78 + 0.3 * step(0.5, fract(y / 0.07 * 0.5)), fw.x * 2.) * c1(y - 0.4, fw.y) * c1(0.07 - y, fw.y));
    q = m + vW.xz * 0.01;
  }
  else if (mode > 15.5 && mode < 16.5) {                               // rain as the engraver cut it: a bundle of five parallel black ribbons
    vec2 sz = vMark.yz; ink = pbBundle(vUv * sz, sz * vec2(0.9, 0.96), 5., fw * sz);
    if (ink < 0.03) discard;
  }
  else if (mode > 16.5 && mode < 17.5) { ink = wRoof(vUv, vMark.y, vMark.z, seed, fw, clog, fw); }
  else if (mode > 17.5 && mode < 18.5) { ink = 1. - pbComb(vUv.yx, vMark.yz, fw.yx, seed) * (1. - clog); }      // a type rule cut along its own length
  else if (mode > 18.5 && mode < 19.5) {                               // a plume: bare paper, a black quill down the middle, barbs raked back from it on both sides
    float C = max(vAux.y, 0.05), c = cos(6.2832 * vUv.x / C), pitch = max(vMark.y, 0.005);
    float aa = fw.y + fw.x * 1.4 / C + 1e-5, v = vUv.y - abs(c) * 0.28;
    float barb = rule(abs(fract(v / pitch) - 0.5) * pitch, pitch * 0.17, aa) * smoothstep(1.6, 3., pitch / aa);
    ink = max(barb * smoothstep(0.12, 0.3, abs(c)), rule(abs(c) * C * 0.2, 0.005, fw.x * 1.3 + 1e-5) * smoothstep(1.2, 2.4, C * 0.25 / (fw.x + 1e-5)));
  }
  else if (mode > 19.5 && mode < 20.5) {                               // the comet of the last sheet (uv in metres on its sheet of sky): a burst head in a
    vec2 d = vUv - vec2(560., 62.); float aa = max(fw.x, fw.y);          // black contour with a black heart and dash rays, and a fan of long tapered streamers
    float r = length(d), th = atan(d.y, abs(d.x) < 1e-5 ? 1e-5 : d.x);
    float wob = 0.5 + 0.5 * sin(uTime * 2.1), s4 = abs(sin(th * 4. + 0.4)), s7 = abs(sin(th * 3.5 + 2.));
    float rs = 20. + 26. * s4 * s4 * s4 + 5. * wob * s7 * s7;
    float head = max(c1(abs(r - rs) - max(1.5, 1.25 * aa), aa), c1(r - 7.5, aa));
    head = max(head, rule(abs(sin(th * 6.5 + 1.)) * r * 0.154, 0.9, aa) * c1(abs(r - 66. - 4. * wob) - 9., aa) * step(0.4, fract(th * 1.7 + 0.2)));
    float t0 = 2.78 - r * 0.00042, dth = 0.034, k = (th - t0) / dth, ki = floor(k + 0.5), hk = pbHash(vec2(ki, 3.));
    float len = 300. + 240. * hk - 22. * abs(ki), r0 = 52. + 22. * fract(hk * 5.3), f = clamp((r - r0) / max(len - r0, 1.), 0., 1.);
    float flick = 0.5 + 0.5 * sin(uTime * 1.4 + ki * 2.3 + r * 0.02);
    float tail = rule(abs(k - ki) * dth * r, mix(1.5, 0.25, f) * (0.75 + 0.25 * flick), aa) * step(abs(ki), 6.5) * step(r0, r) * step(r, len);
    tail *= step(0.16, fract(r * 0.0045 + hk * 9. + 0.03 * uTime));        // each streamer is broken once or twice, as a starved line is
    ink = r < rs ? head : max(head, tail);
    if (r > rs && ink < 0.05) discard;
  }
  // @@MODES
  else { ink = 0.; }
`;
// a hull whose aAux.y is -1 prints as PAPER: the white line the engraver leaves round a black hat so it parts from a black front
const WHITE = 'if (vAux.y < -0.5 && vAux.x > 0.) ink = 0.;';
const FRAG = { fragPre: FRAG_PRE, fragExtra: FRAG_EXTRA, fragPost: WHITE };
// THE INSIDE OF THE SECOND RULE (the Rules' material only): a plain ink face of mark y 1 (its floor, ceiling and inner sides) is cut by the comb
// in 3 m bundles (the skins' are 3.3 m), but the cuts print in the ghost tone: the face stays ink, no paper shows. On the floor and the ceiling
// two bundles lie along the bar, as on its skins; on the inner sides the bundles lie along the street, one above another.
// These faces end in the near skin's plane (z RULE2 - 3). Seen nearly edge-on, the first pixel of such a face beside that plane was drawn over the
// skin (a hairline one pixel wide in the bar's face): so no such face is drawn within two pixels' change of depth of that plane (fwW.y, the
// change of world z over one pixel, is taken at the top of main: no screen derivative is taken inside a branch). The strip left out is hidden
// by the skin wherever the skin stands. Where the tear has eaten the skin's foot it is in the frame: the floor's near lip then stands two pixels
// back, for up to three frames of the flight (the lens some 3.3 to 2.8 m before that plane), before the paper change.
const GHOST_IN = ` if (mode > 1.5 && mode < 2.5 && vMark.y > 0.5 && vAux.x <= 0.) { if (vW.z - ${RULE2 - 3}. < 2. * fwW.y) discard; float wb = 0.07 * sin(uTime * 2.3 + vUv.x * 0.37) + 0.04 * sin(uTime * 3.7 + vUv.x * 1.3); starveAdd = GHOST * pbComb(vec2(vUv.y + 39. + wb, vUv.x + 40.), vec2(3., 9.), fw.yx, seed) * (1. - clog); }`;
const whiteLine = (B, from) => { for (let i = from; i < B.pos.length / 3; i++) B.aux[i * 2 + 1] = -1; };

// THE STREET'S TWO FRONTS: black solids with comb-cut roofs and sides, a cornice, chimneys, balconies; in the
// last sheet low houses and board fences. Returns the chimney tops and the balcony seats.
async function buildTown(B, rng, Y) {
  const chimneys = [], balconies = [], stacks = [], fronts = [];
  for (const s of [-1, 1]) {
    let z = -74 + rng.range(0, 5), n = 0;
    while (z < 610) {
      const green = z > RULE2 + 3;
      const w = green ? rng.range(7, 11) : rng.range(9, 18), h = green ? rng.range(5.4, 7.6) : rng.range(10, 16), seed = rng();
      if (green && z + w > 606) break;
      const z0 = z, z1 = z + w, xa = s > 0 ? HALF_W : -HALF_W - 12, xb = xa + 12; fronts.push([s, z0, z1, h]);
      box(B, xa, xb, 0, h, z0, z1, [1, 1.0, 3.4, seed], 0, 'zZ'); box(B, xa, xb, 0, h, z0, z1, [17, 12, w, seed], 0, 'Y');
      if (s > 0) quad(B, V3(HALF_W, 0, z0), V3(HALF_W, 0, z1), V3(HALF_W, h, z1), V3(HALF_W, h, z0), [6, w, h, seed]);
      else quad(B, V3(-HALF_W, 0, z1), V3(-HALF_W, 0, z0), V3(-HALF_W, h, z0), V3(-HALF_W, h, z1), [6, w, h, seed]);
      const cx = s * (HALF_W - 0.2);
      box(B, Math.min(cx, cx + s * 1.2), Math.max(cx, cx + s * 1.2), h - 0.3, h + 0.32, z0 - 0.12, z1 + 0.12, [2, 0, 0, seed]);
      if (rng.chance(0.6)) {
        const cz = rng.range(z0 + 1.5, z1 - 1.5), cxx = s * rng.range(16, 21);
        box(B, cxx - 0.6, cxx + 0.6, h, h + 2.1, cz - 0.6, cz + 0.6, [2, 0, 0, seed], 0, 'xXzZY');
        chimneys.push(V3(cxx, h + 2.1, cz));
      }
      if (!green && rng.chance(0.55)) {              // a balcony on the first floor, its rail cut with the comb
        const bz0 = z0 + 1.2, bz1 = z1 - 1.2, x0 = s > 0 ? HALF_W - 1.1 : -HALF_W, x1 = x0 + 1.1, xr = s > 0 ? x0 : x1;
        box(B, x0, x1, 5.95, 6.2, bz0, bz1, [2, 0, 0, seed]);
        if (s > 0) quad(B, V3(xr, 6.2, bz0), V3(xr, 6.2, bz1), V3(xr, 7.15, bz1), V3(xr, 7.15, bz0), [1, 0.2, 0.95, seed]);
        else quad(B, V3(xr, 6.2, bz1), V3(xr, 6.2, bz0), V3(xr, 7.15, bz0), V3(xr, 7.15, bz1), [1, 0.2, 0.95, seed]);
        balconies.push({ x: s * (HALF_W - 0.55), y: 6.2, z0: bz0 + 0.5, z1: bz1 - 0.5, s });
      }
      z = z1 + (green ? rng.range(5, 22) * (1 + n * 0.25) : 0); n += green ? 1 : 0;
      await Y();
    }
    // the town behind the fronts (seen from under the horse and in the drop): three more rows of flat roofs with
    // their courts, the walls that face the avenue and us cut as fronts, back lanes of bare paper between; here and
    // there a works chimney stands over the roofs
    for (let row = 0; row < 3; row++) {
      let zb = -80 + rng.range(0, 8), nb = 0;
      while (zb < RULE2 - 14) {
        const d = rng.range(11, 24), h = rng.range(5.5, 12.5) - row, seed = rng(), wd = rng.range(10.5, 13), xi = HALF_W + 14.5 + row * 16.5 + rng.range(0, 1.5);
        const x0 = s > 0 ? xi : -xi - wd, x1 = x0 + wd;
        box(B, x0, x1, 0, h, zb, zb + d, [17, wd, d, seed], 0, 'Y');
        box(B, x0, x1, 0, h, zb, zb + d, [6, wd, h, seed], 0, 'z');
        box(B, x0, x1, 0, h, zb, zb + d, [6, d, h, seed + 0.31], 0, s > 0 ? 'x' : 'X');
        if (rng.chance(0.16)) {
          const cx = (x0 + x1) / 2, cz = zb + d / 2, ch = rng.range(21, 29);
          box(B, cx - 0.9, cx + 0.9, h, ch, cz - 0.9, cz + 0.9, [1, 0.45, 2.2, seed], 0, 'xXzZY'); box(B, cx - 1.15, cx + 1.15, ch - 1.1, ch - 0.5, cz - 1.15, cz + 1.15, [2, 0, 0, seed]);
          stacks.push(V3(cx, ch, cz));
        }
        zb += d + (rng.chance(0.3) ? rng.range(3.5, 6) : 0.4);
        if (++nb % 6 === 0) await Y();
      }
      await Y();
    }
    // the board fence of the last sheet
    const xf = s * (HALF_W + 0.35), f0 = RULE2 + 3, f1 = 628, sd = rng();
    if (s > 0) quad(B, V3(xf, 0, f0), V3(xf, 0, f1), V3(xf, 2.3, f1), V3(xf, 2.3, f0), [1, 0.25, 2.05, sd]);
    else quad(B, V3(xf, 0, f1), V3(xf, 0, f0), V3(xf, 2.3, f0), V3(xf, 2.3, f1), [1, 0.25, 2.05, sd]);
    box(B, Math.min(xf, xf - s * 0.25), Math.max(xf, xf - s * 0.25), 2.25, 2.5, f0, f1, [2, 0, 0, sd], 0, 'xXY');
  }
  // the street: one sheet of paper under everything, marked in world metres
  quad(B, V3(-460, 0, 1150), V3(460, 0, 1150), V3(460, 0, -160), V3(-460, 0, -160), [9, 0, 0, 0.5]);
  return { chimneys: [...stacks.slice(0, 7), ...chimneys], balconies, fronts };
}

// ---------------------------------------------------------------------------------------------
// THE PACK: riders, hats, dogs. One vertex routine places every instance from u alone (uCamZ): it holds station
// by the camera's own distance times iA.z, wraps inside its window, pedals with true knees (two-circle
// intersection in closed form), spins its wheels with distance and, for the dozen under the hooves, is tossed.
//   aBone (part): 0 body, 1 head and hat, 2/3 left thigh/shin, 4/5 right thigh/shin, 6 right arm, 10 frame,
//   11 wheels, 13 cranks, 14 ground dashes, 20..23 dog legs, 24 dog body, 25 umbrella
//   iA: x lane, y metres ahead at u 0, z speed share, w seed        iB: x head yaw, y arm up, z toss order (-1 a sprinter; 0.25 the one row that swings wide), w size
// ---------------------------------------------------------------------------------------------
const PACK_PRE = /* glsl */`
attribute float aBone; attribute vec4 iA; attribute vec4 iB;
uniform float uCamZ, uToss; uniform vec3 uWin;
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
`;
const PACK_MOVE = /* glsl */`
  float part = floor(aBone + 0.5);
  float trav = iA.y + uCamZ * iA.z;                                   // metres ridden
  float rel = mod(trav - uCamZ - uWin.x, uWin.y) + uWin.x;            // metres ahead of the camera, wrapped
  float crank = trav / 0.8 + iA.w * 40. + uTime * 1.3;
  vX.x = trav / 0.36 + uTime * 2.;
  if (part > 1.5 && part < 5.5) {                                     // legs: hip fixed, foot on the pedal, knee solved
    float sd = part < 3.5 ? -1. : 1., a = crank + (sd > 0. ? 3.14159 : 0.);
    vec2 Hh = vec2(1.0, -0.26), F = vec2(0.36, -0.05) + 0.17 * vec2(cos(a), sin(a));
    vec2 dv = F - Hh; float dl = clamp(length(dv), 0.25, 0.94); vec2 dn = dv / max(length(dv), 1e-4);
    float a2 = (dl * dl + 0.2209 - 0.2500) / (2. * dl), hh = sqrt(max(0.2209 - a2 * a2, 0.));    // thigh 0.47, shin 0.50
    vec2 Kn = Hh + dn * a2 + vec2(dn.y, -dn.x) * hh;                    // the knee goes forward
    F = Hh + dn * dl;
    bool thigh = part < 2.5 || (part > 3.5 && part < 4.5);
    vec2 P0 = thigh ? Hh : Kn, P1 = thigh ? Kn : F;
    vec2 ax = (P1 - P0) / max(length(P1 - P0), 1e-4);                  // the bone's own +Y, as (y, z)
    p = vec3(p.x + sd * 0.11, P0.x + ax.x * p.y - ax.y * p.z, P0.y + ax.y * p.y + ax.x * p.z);
    n = vec3(n.x, ax.x * n.y - ax.y * n.z, ax.y * n.y + ax.x * n.z);
  } else if (part > 0.5 && part < 1.5) {                              // head and hat: turn on the neck, nod with the stroke
    vec3 c = vec3(0., 1.62, 0.02); p -= c; p *= uWin.z; p.xz = rot2(p.xz, -iB.x); n.xz = rot2(n.xz, -iB.x);
    p.yz = rot2(p.yz, 0.05 * sin(crank * 2. + 1.)); p += c;
  } else if (part > 5.5 && part < 6.5) {                              // the right arm: on the bar, or up holding the hat
    vec3 c = vec3(0.2, 1.52, -0.02); p -= c; p.yz = rot2(p.yz, -2.25 * iB.y); n.yz = rot2(n.yz, -2.25 * iB.y); p.x -= 0.1 * iB.y; p += c;
  } else if (part > 12.5 && part < 13.5) {                            // cranks and pedals
    vec2 c = vec2(0.36, -0.05); vec2 yz = rot2(p.yz - c, crank); p.yz = yz + c; n.yz = rot2(n.yz, crank);
  } else if (part > 19.5 && part < 23.5) {                            // dog legs swing from their own hips
    float k = part - 20., ph = trav * 1.9 + iA.w * 30. + uTime * 3. + (k < 1.5 ? 0. : 2.4) + mod(k, 2.) * 0.7;
    vec3 c = vec3(0., 0.5, k < 1.5 ? 0.32 : -0.34); p -= c; p.yz = rot2(p.yz, 0.75 * sin(ph)); n.yz = rot2(n.yz, 0.75 * sin(ph)); p += c;
  }
  if (part > 19.5 && part < 24.5) { float g = trav * 1.9 + iA.w * 30. + uTime * 3.; p.yz = rot2(p.yz - vec2(0.5, 0.), 0.12 * sin(g + 0.6)) + vec2(0.5 + 0.07 * sin(g * 2.), 0.); }
  if (part < 13.5) p.y += 0.012 * sin(crank * 2.) * step(part, 6.5);
  p *= iB.w;
  float lane = iA.x + 0.22 * sin(trav * 0.05 + iA.w * 50.);
  if (iB.z < -0.5) p.y += clamp((uCamZ + rel - 548.) * 0.0626, 0., 12.);   // the three sprinters leave the street for the ring
  // The street before the entry (z under 0) is where the opening's camera comes down the middle while this world is the next one,
  // and it came through the sprinters there. A CLEARANCE, said plainly: a rider of a middle lane (nearer the middle than the 3.6 m
  // the dealt near citizens keep) is not in the street before the entry; it joins at the mouth, 9 m and more behind the lens of the flight.
  if (uCamZ + rel < 0. && abs(iA.x) < 3.6) p.y -= 4000.;
  // The boater of the 0.79 still (his row alone carries the mark 0.25 in iB.z) swings 0.9 m to port and back as he rides the street from
  // z 524 to 610, full from 545 to 585. A CLEARANCE, said plainly: the route comes down into the pack at head height there and the lens
  // draws level with him at z 554. On his own lane the rim of his umbrella (rain editions) stood 1.36 m from the lens at the worst of his
  // lane's wander, and his brim 1.77 m in the others; with the swing they stand 2.26 m and 2.65 m. At his own still he is at z 521.9,
  // short of the swing; the tram is never beside him there (it has gone on to its terminus), and nobody else swings.
  if (iB.z > 0.2 && iB.z < 0.3) lane += 0.9 * smoothstep(524., 545., uCamZ + rel) * (1. - smoothstep(585., 610., uCamZ + rel));
  if (iB.z > 0.5 && part != 14.) {                                    // tossed by a hoof fall: up 15 m, cartwheeling, down again still pedalling
    float t = clamp(uToss * 2.2 - (iB.z - 1.) * 0.07, 0., 1.), up = 4. * t * (1. - t), spin = 6.2832 * (1. + floor(iA.w * 2.99)) * t * t * (3. - 2. * t);
    vec2 yz = rot2(p.yz - vec2(0.9, 0.), spin); p.yz = yz + vec2(0.9, 0.); n.yz = rot2(n.yz, spin);
    p.y += up * (11. + 6. * fract(iA.w * 7.)); lane += sign(iA.x) * up * 2.5 * (fract(iA.w * 13.) - 0.3);
  }
  p.x += lane; p.z += uCamZ + rel;
`;

// A light long bone from A to Bp (shaft swelling to a two-lobed knuckle at each end), lobes along `side`.
// hi: 9 rings of nseg; lo: 4 rings of 3. The loft's uv.y is the distance from A, so the joint bundles sit right.
function liteBone(B, part, A, Bp, R, K, seed, o = {}) {
  const { hi = true, side = X_AXIS, hull = 0.012, bw = 0.06, nseg = hi ? 4 : 3, mid = false } = o;
  const L = A.distanceTo(Bp), dir = V3(0, 0, 0).subVectors(Bp, A).normalize(), S = [];
  const rows = mid ? [[-0.8 * K, 0.4 * K, 1, -1], [0, K, 1, 0], [1.3 * K, R * 1.1, 0, 0], [L - 1.3 * K, R * 1.1, 0, 0], [L, K, 1, 0], [L + 0.8 * K, 0.4 * K, 1, 1]]
    : hi ? [[-0.85 * K, 0.34 * K, 1, -1], [-0.3 * K, 0.92 * K, 1, -1], [0.4 * K, K, 1, 0], [1.35 * K, R * 1.15, 0, 0], [L / 2, R * 0.9, 0, 0],
    [L - 1.35 * K, R * 1.15, 0, 0], [L - 0.4 * K, K, 1, 0], [L + 0.3 * K, 0.92 * K, 1, 1], [L + 0.85 * K, 0.34 * K, 1, 1]]
    : [[-0.7 * K, 0.5 * K, 1, 0], [0.25 * K, K * 0.95, 0, 0], [L - 0.25 * K, K * 0.95, 0, 0], [L + 0.7 * K, 0.5 * K, 1, 0]];
  for (const [y, r, w, cap] of rows) {
    S.push({ p: A.clone().addScaledVector(dir, y), rx: r * (1 + 0.42 * w), rz: r * (1 - 0.06 * w), lobe: hi || mid ? 0.2 * w : 0, notch: cap * 0.3 * K * w, v: y });
  }
  loft(B, S, nseg, side, [0, bw, L, seed], { bone: part, hull, circ: 2 * Math.PI * R * 1.15 });
}
// a flattened strip through given points (a rib): rx along `side`, rz across; tapered to both ends; no curve fitting
function strip(B, part, pts, rx, rz, side, mark, hull, t0 = 1, t1 = 1) {
  const n = pts.length, S = pts.map((p, i) => { const f = i / (n - 1), k = lerp(t0, t1, f) * (i === 0 || i === n - 1 ? 0.55 : 1); return { p, rx: rx * k, rz: rz * k, lobe: 0, notch: 0 }; });
  loft(B, S, 3, side, mark, { bone: part, hull, circ: 4 * rx });
}
// a thin ink tube that never thins under about 3 px: a 3- or 4-sided loft whose own skin is pushed out like a hull
function tube(B, part, pts, r, seed, nseg = 4) {
  const S = pts.map((p) => ({ p, rx: r, rz: r, lobe: 0, notch: 0 }));
  const base = loft(B, S, nseg, pts.length > 1 && Math.abs(pts[1].x - pts[0].x) > 0.9 * pts[0].distanceTo(pts[1]) ? Y_AXIS : X_AXIS, [2, 0, 0, seed], { bone: part, hull: 0, circ: 1 });
  for (let i = base; i < B.pos.length / 3; i++) B.aux[i * 2] = -r * 0.25;
}

// ONE CITIZEN ON A BICYCLE, in the rider's own frame (origin on the street under the cranks, +Z ahead).
// hi: the near cast (knuckled bones, ribs, the stamped skull with its teeth); lo: the far pack.
async function buildRider(B, rng, hi, Y) {
  const sd = () => rng(), R = 0.03, K = 0.06, o = { hi }, H = 0.012, ns = hi ? 8 : 5;
  for (const part of [2, 4]) {                                                  // legs in bone space
    liteBone(B, part, V3(0, 0, 0), V3(0, 0.47, 0), R * 1.15, K * 1.12, sd(), o);
    liteBone(B, part + 1, V3(0, 0, 0), V3(0, 0.5, 0), R, K, sd(), o);
  }
  await Y();
  if (hi) {
    // the pelvis: two paper wings flaring off the sacrum, a black hole in each
    for (const sx of [-1, 1]) {
      blob(B, 0, V3(sx * 0.082, 1.045, -0.275), [0.072, 0.1, 0.05], [3, 0, 0, sd()], { nseg: 5, nring: 3, hull: H, axis: V3(sx * 0.5, 1, 0) });
      blob(B, 0, V3(sx * 0.08, 1.0, -0.322), [0.028, 0.034, 0.02], [2, 0, 0, 0.3], { nseg: 4, nring: 2, hull: 0 });
    }
    // the spine: a string of paper knots from the sacrum to the neck, proud of the cage
    const sp = [[1.09, -0.3], [1.3, -0.24], [1.52, -0.11], [1.67, 0.0]];
    for (let i = 0; i < 9; i++) {
      const f = (i / 8) * 3, k = Math.min(2, Math.floor(f)), t = f - k, y = lerp(sp[k][0], sp[k + 1][0], t), z = lerp(sp[k][1], sp[k + 1][1], t);
      blob(B, 0, V3(0, y, z), [0.036, 0.042, 0.032], [3, 0, 0, sd()], { nseg: 4, nring: 2, hull: H, axis: V3(0, 0.9, 0.42) });
    }
    await Y();
    // the cage: solid ink, and four pairs of paper ribs springing from the spine and curving down round it
    const C = V3(0, 1.39, -0.085), ax = V3(0, 0.906, 0.423), bk = V3(0, 0.423, -0.906);
    blob(B, 0, C, [0.115, 0.175, 0.075], [2, 0, 0, sd()], { nseg: 6, nring: 4, hull: 0, axis: ax });
    for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) {
      const pts = [], s0 = 0.125 - i * 0.078;
      for (let j = 0; j <= 4; j++) {
        const ph = 0.32 + j * 0.5, sy = s0 - 0.1 * (j / 4), R = Math.sqrt(Math.max(0.08, 1 - (sy / 0.175) ** 2));
        pts.push(C.clone().addScaledVector(ax, sy).addScaledVector(bk, Math.cos(ph) * (0.075 * R + 0.014)).addScaledVector(X_AXIS, sx * Math.sin(ph) * (0.115 * R + 0.014)));
      }
      strip(B, 0, pts, 0.021, 0.013, ax, [3, 0, 0, sd()], H, 0.95, 0.55);
    }
  } else { const f0 = B.pos.length / 3; blob(B, 0, V3(0, 1.3, -0.15), [0.12, 0.3, 0.09], [1, 0.07, 0.2, sd()], { nseg: 4, nring: 3, hull: 0.012, axis: V3(0, 0.9, 0.42) }); whiteLine(B, f0); }
  await Y();
  for (const sx of [-1, 1]) {                                                   // arms to the bar (the right one can let go)
    const part = sx > 0 ? 6 : 0, S = V3(sx * 0.2, 1.52, -0.02), E = V3(sx * 0.27, 1.28, 0.15), Hd = V3(sx * 0.23, 1.11, 0.37);
    if (hi) { liteBone(B, part, S, E, R * 0.85, K * 0.85, sd(), { mid: true, nseg: 4 }); liteBone(B, part, E, Hd, R * 0.8, K * 0.8, sd(), { mid: true, nseg: 4 }); }
    else liteBone(B, part, S, Hd, R * 0.85, K * 0.85, sd(), o);
  }
  await Y();
  // the one stamped skull, cut to be seen three-quarters on: a lumpy cranium, a cheekbone under each black socket, the
  // nose notch, the upper jaw with its row of teeth, a black gap, and the lower jaw hanging under it as a bar of its own
  const Hc = V3(0, 1.8, 0.06), hp = (x, y, z) => V3(x, Hc.y + y, Hc.z + z);
  if (hi) {
    blob(B, 1, hp(0, 0.022, -0.025), [0.122, 0.13, 0.15], [3, 0, 0, sd()], { nseg: 7, nring: 4, hull: H, lump: 0.07 });
    blob(B, 1, hp(0, 0.075, 0.085), [0.1, 0.035, 0.05], [3, 0, 0, sd()], { nseg: 5, nring: 2, hull: H });                 // the brow
    for (const sx of [-1, 1]) {
      blob(B, 1, hp(sx * 0.1, -0.05, 0.062), [0.04, 0.03, 0.062], [3, 0, 0, sd()], { nseg: 4, nring: 2, hull: H });        // cheekbone
      blob(B, 1, hp(sx * 0.058, 0.008, 0.1), [0.046, 0.054, 0.036], [2, 0, 0, 0.3], { nseg: 6, nring: 2, hull: 0 });       // socket
      blob(B, 1, hp(sx * 0.112, 0.03, -0.035), [0.02, 0.055, 0.07], [5, 0.045, 0.1, sd()], { nseg: 4, nring: 2, hull: 0 });   // the comb on the temple
    }
    blob(B, 1, hp(0, -0.105, 0.09), [0.082, 0.056, 0.076], [3, 0, 0, sd()], { nseg: 6, nring: 3, hull: H });               // upper jaw
    blob(B, 1, hp(0, -0.066, 0.136), [0.021, 0.034, 0.034], [2, 0, 0, 0.3], { nseg: 3, nring: 2, hull: 0 });               // nose notch
    blob(B, 1, hp(0, -0.2, 0.04), [0.078, 0.07, 0.085], [2, 0, 0, 0.3], { nseg: 5, nring: 2, hull: 0 });                   // the open mouth
    const band = (rx, rz, cz, y0, y1, a, n, k0) => {                              // a row of teeth round the front of a jaw (wound to face outward)
      const arc = (t, y, k) => hp(Math.sin(t) * rx * k, y, cz + Math.cos(t) * rz * k);
      for (let j = 0; j < n; j++) { const t0 = -a + (2 * a * j) / n, t1 = t0 + (2 * a) / n, w = (2 * a * rx) / n;
        quad(B, arc(t0, y0, k0), arc(t1, y0, k0), arc(t1, y1, 1), arc(t0, y1, 1), [8, 0, 0, 0.3], 1, [j * w, 0, (j + 1) * w, 1]); }
    };
    band(0.088, 0.085, 0.09, -0.172, -0.118, 1.2, 6, 0.97);
    band(0.09, 0.094, 0.045, -0.292, -0.243, 1.0, 5, 0.95);
    bar(B, 1, [hp(-0.118, -0.1, -0.035), hp(-0.106, -0.275, 0.04), hp(0, -0.315, 0.137), hp(0.106, -0.275, 0.04), hp(0.118, -0.1, -0.035)],
      0.034, 0.024, Y_AXIS, [3, 0, 0, sd()], { nseg: 4, sub: 2, hull: H, taper0: 0.8, taper1: 0.8 });
  } else blob(B, 1, Hc, [0.125, 0.135, 0.15], [3, 0, 0, sd()], { nseg: 4, nring: 2, hull: H });
  await Y();
  // the bicycle: black rule frame, two wheels with spokes drawn in the wheel's own disc, cranks, a cluster of dashes under each wheel
  const bb = V3(0, 0.36, -0.05), sa = V3(0, 0.95, -0.3), ht = V3(0, 0.98, 0.34), rh = V3(0, 0.36, -0.58), fh = V3(0, 0.36, 0.62), bs = sd(), tn = 3;
  const tubes = hi ? [[bb, sa], [bb, V3(0, 0.82, 0.38)], [sa, ht], [bb, rh], [sa, rh], [ht, fh], [ht, V3(0, 1.1, 0.38)], [V3(-0.24, 1.1, 0.38), V3(0.24, 1.1, 0.38)]]
    : [[bb, sa], [bb, ht], [sa, rh]];
  for (const t of tubes) tube(B, 10, t, 0.016, bs, tn);
  if (hi) blob(B, 10, V3(0, 0.97, -0.3), [0.075, 0.035, 0.14], [2, 0, 0, bs], { nseg: 4, nring: 2, hull: 0 });
  for (const hub of [rh, fh]) {
    const r = 0.38, x = 0.004;
    quad(B, V3(x, hub.y - r, hub.z + r), V3(x, hub.y - r, hub.z - r), V3(x, hub.y + r, hub.z - r), V3(x, hub.y + r, hub.z + r), [7, 0, 0, bs], 11, [r, -r, -r, r]);
    quad(B, V3(-x, hub.y - r, hub.z - r), V3(-x, hub.y - r, hub.z + r), V3(-x, hub.y + r, hub.z + r), V3(-x, hub.y + r, hub.z - r), [7, 0, 0, bs], 11, [-r, -r, r, r]);
    const N = hi ? 10 : 6, base = B.pos.length / 3;                            // the tyre seen edge-on: a band that never thins away
    for (let j = 0; j <= N; j++) for (const sx of [-1, 1]) {
      const a = (j / N) * Math.PI * 2;
      B.pos.push(sx * 0.018, hub.y + Math.cos(a) * 0.355, hub.z + Math.sin(a) * 0.355); B.nor.push(sx, 0, 0); B.uv.push(0, 0);
      B.mark.push(2, 0, 0, 0.5); B.aux.push(-0.004, 1); B.bone.push(11);
    }
    for (let j = 0; j < N; j++) { const a = base + j * 2; B.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); if (hi) B.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    quad(B, V3(-0.5, 0.015, hub.z + 0.3), V3(0.5, 0.015, hub.z + 0.3), V3(0.5, 0.015, hub.z - 0.3), V3(-0.5, 0.015, hub.z - 0.3), [13, 0, 0, sd()], 14, [-0.5, -0.3, 0.5, 0.3]);
  }
  if (hi) for (const sx of [-1, 1]) {
    const pd = V3(sx * 0.09, 0.36 - sx * 0.17, -0.05);
    tube(B, 13, [V3(sx * 0.06, 0.36, -0.05), pd], 0.014, bs, 3);
    box(B, pd.x - 0.05 + sx * 0.03, pd.x + 0.05 + sx * 0.03, pd.y - 0.012, pd.y + 0.012, pd.z - 0.045, pd.z + 0.045, [2, 0, 0, bs], 13);
  }
}

// THE HATS (the hat is the person): solids of revolution cut with the comb round the crown, in the head's frame.
// 0 bowler, 1 charro sombrero, 2 top hat, 3 boater, 4 flat cap, 5 kepi, 6 the lady's wide brim heaped with plumes, 7 umbrella
function lathe(B, prof, k, mark, o = {}) {
  const { y0 = 1.885, z0 = 0.06, nseg = 8, part = 1, tilt = 0, hull = 0.014 } = o, from = B.pos.length / 3;
  const S = prof.map(([r, y]) => ({ p: V3(0, y0 + y * k, z0 + y * k * tilt), rx: Math.max(0.004, r * k), rz: Math.max(0.004, r * k), lobe: 0, notch: 0 }));
  let v = 0; S.forEach((s, i) => { if (i) v += Math.hypot((prof[i][0] - prof[i - 1][0]) * k, (prof[i][1] - prof[i - 1][1]) * k); s.v = v; });
  loft(B, S, nseg, X_AXIS, mark, { bone: part, hull, circ: 2 * Math.PI * Math.max(...prof.map((p) => p[0])) * k, axis: Y_AXIS });
  whiteLine(B, from);
}
// the second printing on a hat: a flat vermilion band round the crown (no contour: it is the colour block, a little off register)
function hatBand(B, r, ya, yb, k, s, o = {}) {
  const { y0 = 1.885, z0 = 0.06, nseg = 8, part = 1, tilt = 0 } = o;
  const S = [ya, yb].map((y, i) => ({ p: V3(0, y0 + y * k, z0 + y * k * tilt), rx: r * k, rz: r * k, lobe: 0, notch: 0, v: i * (yb - ya) * k }));
  loft(B, S, nseg, X_AXIS, [3, 0, 0, s + 4], { bone: part, hull: 0, circ: 6.3 * r * k, axis: Y_AXIS });
}
function buildHat(B, kind, rng, lo = false) {              // lo: the far pack's hat (plumes in few triangles)
  const s = rng(), m = [1, 0.06, 0.24, s];
  if (kind === 0) hatBand(B, 0.158, 0.036, 0.078, 1.4, s); else if (kind === 1) hatBand(B, 0.186, 0.055, 0.125, 1.0, s, { nseg: 10 });
  else if (kind === 2) hatBand(B, 0.163, 0.04, 0.115, 1.38, s); else if (kind === 3) hatBand(B, 0.166, 0.04, 0.095, 1.34, s);
  else if (kind === 5) hatBand(B, 0.176, 0.012, 0.06, 1.3, s, { tilt: 0.25 });
  if (kind === 0) lathe(B, [[0.1, -0.01], [0.21, 0], [0.225, 0.03], [0.2, 0.035], [0.145, 0.03], [0.145, 0.1], [0.13, 0.17], [0.085, 0.215], [0.01, 0.23]], 1.4, m);
  else if (kind === 1) lathe(B, [[0.12, -0.01], [0.47, 0], [0.54, 0.06], [0.52, 0.09], [0.45, 0.04], [0.17, 0.05], [0.145, 0.2], [0.11, 0.36], [0.05, 0.43], [0.01, 0.44]], 1.0, [1, 0.07, 0.3, s], { nseg: 10 });
  else if (kind === 2) lathe(B, [[0.1, -0.01], [0.215, 0], [0.225, 0.03], [0.15, 0.035], [0.14, 0.2], [0.158, 0.42], [0.15, 0.43], [0.01, 0.435]], 1.38, [1, 0.06, 0.5, s]);
  else if (kind === 3) lathe(B, [[0.1, -0.01], [0.27, 0], [0.27, 0.025], [0.155, 0.03], [0.155, 0.13], [0.14, 0.137], [0.01, 0.14]], 1.34, [1, 0.05, 0.2, s]);
  else if (kind === 4) {
    lathe(B, [[0.1, 0], [0.19, 0.005], [0.24, 0.05], [0.2, 0.1], [0.01, 0.115]], 1.25, [1, 0.06, 0.22, s], { z0: 0.03, tilt: -0.5 });
    blob(B, 1, V3(0, 1.9, 0.3), [0.15, 0.014, 0.1], [2, 0, 0, s], { nseg: 6, nring: 3, hull: 0 });
  } else if (kind === 5) {
    lathe(B, [[0.1, 0], [0.165, 0.005], [0.15, 0.17], [0.14, 0.18], [0.01, 0.185]], 1.3, [1, 0.05, 0.2, s], { tilt: 0.25 });
    blob(B, 1, V3(0, 1.9, 0.3), [0.14, 0.012, 0.1], [2, 0, 0, s], { nseg: 6, nring: 3, hull: 0 });
  } else if (kind === 6) {
    lathe(B, [[0.12, -0.01], [0.44, 0], [0.47, 0.03], [0.2, 0.05], [0.17, 0.12], [0.1, 0.16], [0.01, 0.17]], 1.15, [1, 0.07, 0.3, s], { nseg: 10 });
    for (let i = 0; i < 4; i++) {                                               // ostrich plumes heaped on the brim: broad paper feathers in a contour, a quill and its raked barbs cut all along, the tip curled over the edge (feathers only)
      const a = -1.15 + i * 0.77 + rng.range(-0.1, 0.1), h = rng.range(0.3, 0.42) * (i % 2 ? 1.25 : 0.9), c = Math.cos(a), sn = Math.sin(a), y = 2.0;
      const P = (r, dy) => V3(sn * r, y + dy, 0.06 - c * r);
      bar(B, 1, [P(0.06, 0.02), P(0.14, h * 0.75), P(0.34, h), P(0.58, h * 0.8), P(0.76, h * 0.42), P(0.8, h * 0.08), P(0.7, h * -0.04)], 0.2, 0.05, Y_AXIS, [19, 0.06, 1.5, rng() + (i % 2 ? 4 : 0)],
        { nseg: lo ? 3 : 5, sub: lo ? 3 : 6, hull: 0.012, taper0: 0.55, taper1: 0.45, circ: 0.8 });
    }
  } else {                                                                      // the black umbrella of the engraver's rain
    lathe(B, [[0.02, 0.02], [0.9, 0], [0.92, 0.03], [0.7, 0.2], [0.4, 0.33], [0.03, 0.4], [0.01, 0.46]], 1, [1, 0.2, 0.5, s], { y0: 2.5, z0: 0.1, nseg: 10, part: 25 });
    tube(B, 25, [V3(0.2, 1.6, 0.12), V3(0.03, 2.52, 0.1)], 0.014, s, 3);
  }
}

// the pack's instances: one table of citizens, shared by the rider meshes and the hat meshes
function instanced(geo, rows, material) {
  const iA = new Float32Array(rows.length * 4), iB = new Float32Array(rows.length * 4);
  rows.forEach((r, i) => { iA.set([r.x, r.off, r.k, r.seed], i * 4); iB.set([r.yaw, r.arm, r.toss, r.size], i * 4); });
  geo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); geo.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  geo.instanceCount = rows.length;
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false;
  return mesh;
}
// a second instanced geometry on the same vertex data (for the same shape in another tier of the pack)
function shareGeo(g) {
  const h = new THREE.InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'uv', 'aMark', 'aAux', 'aBone']) h.setAttribute(k, g.getAttribute(k));
  h.setIndex(g.index); h.boundingSphere = g.boundingSphere;
  return h;
}

// THE TWO RULES AND THE BORDER GATE with its ring. The first Rule is a slab of solid ink, wall to wall, 30 m tall from the street. The second is a
// hollow bar of ink across the street at the height of the cornices (BAR_Y0 to BAR_Y1, a thin rule over it), the street open beneath it.
// Each skin is torn open round its hole's middle by its own channel of uBurst, a law of the route's place alone (see where uBurst is set).
function buildRules(B, rng) {
  [RULE1, RULE2].forEach((z, i) => {
    const s = rng(), w = HALF_W + 0.5, wo = i ? BAR_W : w;
    // i 0: the slab. i 1: the bar. Its uv is lowered by dv, so the hole's middle (uv 0, 2.5) lies at BAR_YC (the route's height at the Rule's middle;
    // the route passes within 0.45 m of it at either skin). Its outer skins are cut to paper along its length (mark z -1). Its far skin seen from inside
    // (mark z 1), its floor, ceiling and inner sides (mode 2, mark y 1) are cut the same way in the ghost tone only: no face inside the bar carries
    // paper until the far skin's own law begins (its rim and hole: the bar's skins have no cracks).
    const y0 = i ? BAR_Y0 : 0, y1 = i ? BAR_Y1 : 30, dv = i ? BAR_YC - 2.5 : 0, lie = i ? -1 : 0;
    quad(B, V3(wo, y0, z - 3), V3(-wo, y0, z - 3), V3(-wo, y1, z - 3), V3(wo, y1, z - 3), [11, i * 2, lie, s], 0, [wo, y0 - dv, -wo, y1 - dv]);              // near skin
    quad(B, V3(w, y0, z + 2.96), V3(-w, y0, z + 2.96), V3(-w, y1, z + 2.96), V3(w, y1, z + 2.96), [11, i * 2 + 1, i, s + 0.1], 0, [w, y0 - dv, -w, y1 - dv]);    // far skin, seen from inside
    quad(B, V3(-wo, y0, z + 3), V3(wo, y0, z + 3), V3(wo, y1, z + 3), V3(-wo, y1, z + 3), [11, i * 2 + 1, lie, s + 0.1], 0, [-wo, y0 - dv, wo, y1 - dv]);    // and from beyond
    quad(B, V3(-wo, y1, z + 3), V3(wo, y1, z + 3), V3(wo, y1, z - 3), V3(-wo, y1, z - 3), [11, i * 2 + 1, 0, s], 0, [-wo, 31, wo, 37]);         // top
    for (const sx of [-1, 1]) box(B, sx > 0 ? w - 0.3 : -w, sx > 0 ? w : -w + 0.3, y0, y1, z - 3, z + 3, [2, i, 0, s + 0.5 * i], 0, sx > 0 ? 'x' : 'X');   // the inner sides (the bar's: mark y 1, ghost-cut)
    if (i) {
      box(B, -wo, wo, y0, y0 + 0.04, z - 3, z + 3, [2, 1, 0, s + 0.3], 0, 'Y');            // the bar's floor seen from inside (mark y 1: ghost-cut)
      box(B, -wo, wo, y0, y0 + 0.04, z - 3, z + 3, [2, 0, 0, s], 0, 'y');                  // and its underside
      box(B, -w, w, y1 - 0.04, y1, z - 3, z + 3, [2, 1, 0, s + 0.4], 0, 'y');              // its ceiling seen from inside (ghost-cut)
      box(B, -wo, wo, THIN_Y0, THIN_Y1, z - 3, z + 3, [2, 0, 0, s + 0.2], 0, 'zZyY');       // the thin rule over it
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) {                              // the nicked ends of the rule, where a low roof lets them show (heights from the Rule's own seed: no new draw)
        const h = 1 + 4.4 * ((s * 17.3 + k * 0.37 + (sx > 0 ? 0.5 : 0)) % 1), xa = sx > 0 ? wo + k * 0.45 : -wo - (k + 1) * 0.45;
        box(B, xa, xa + 0.45, k % 2 ? y0 : y1 - h, k % 2 ? y0 + h : y1, z - 3, z + 3, [2, 0, 0, s]);
      }
    }
  });
}
function buildGate(B, C, rng) {                     // B: what stands; C: the corner the hind hooves knock off (its own mesh, pivot at its inner foot)
  const s = rng(), m = [1, 1.0, 9.5, s], mh = [18, 1.13, 9.5, s], z0 = GATE_Z - 1.1, z1 = GATE_Z + 1.1, t = [2, 0, 0, s + 0.2];   // each rule is cut along its own length: long parallel lines, never a row of shapes
  box(B, 19, 22, 0, 33, z0, z1, m); box(B, -6, 19, 29.6, 33, z0, z1, mh); box(B, -22, -19, 0, 19, z0, z1, m);
  box(B, 17.3, 17.8, 0, 28.2, z0 - 0.4, z0, t); box(B, -4.5, 17.3, 27.7, 28.2, z0 - 0.4, z0, t); box(B, -17.8, -17.3, 0, 17.5, z0 - 0.4, z0, t);
  for (let i = 0; i < 5; i++) {                      // the nicked, bent ends of the broken rule
    const x = -6 - i * 0.45, h = rng.range(0.4, 2.9);
    box(B, x - 0.45, x, 29.6 + (i % 2 ? 0 : 3.4 - h), 29.6 + (i % 2 ? h : 3.4), z0, z1, [2, 0, 0, s]);
  }
  for (let i = 0; i < 4; i++) { const x = -22 + i * 0.75, h = rng.range(0.5, 2.4); box(B, x, x + 0.75, 19, 19 + h, z0, z1, [2, 0, 0, s]); }
  box(C, -16, 0, 10.6, 14, -1.1, 1.1, mh); box(C, -16, -13, 0, 10.6, -1.1, 1.1, m);        // local to (-6, 19, GATE_Z)
  for (let i = 0; i < 4; i++) box(C, i * 0.5, i * 0.5 + 0.5, 10.6 + (i % 2 ? 0.3 : 1.2), 14 - (i % 2 ? 1.4 : 0.2), -1.1, 1.1, [2, 0, 0, s]);
}
function buildRing(B, rng) {                         // the exit: a black comb-cut torus 1.5 m thick round the 14 m opening
  const S = [], n = 40;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; S.push({ p: V3(Math.cos(a) * 7.8, Math.sin(a) * 7.8, 0), rx: 0.78, rz: 0.78, lobe: 0, notch: 0, v: a * 7.8, side: Z_AXIS }); }
  loft(B, S, 10, Z_AXIS, [1, 0.5, 1.7, rng()], { bone: 0, hull: 0, circ: 4.9 });
}
// FLAKES OF INK: shards that leave a Rule as its hole reaches them, and that each hoof fall shakes off the fronts.
//   fA: origin xyz, group (0..3 the four skins, 4 and 5 the hoof falls)    fB: seed, release (0..1 of the group's progress), size, seconds
const FLAKE_PRE = /* glsl */`
attribute vec4 fA; attribute vec4 fB; uniform vec4 uBurst, uShake;
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
`;
const FLAKE_MOVE = /* glsl */`
  float g = fA.w, prog = g < 0.5 ? uBurst.x : g < 1.5 ? uBurst.y : g < 2.5 ? uBurst.z : g < 3.5 ? uBurst.w : g < 4.5 ? uShake.x : g < 5.5 ? uShake.y : uShake.z;
  float tau = max(prog - fB.y, 0.) * fB.w;
  float h1 = pbHash(vec2(fB.x, 1.3)), h2 = pbHash(vec2(fB.x, 5.7)), h3 = pbHash(vec2(fB.x, 9.1));
  vec3 vel = g < 3.5 ? vec3(fA.x * 0.25 + (h1 - 0.5) * 7., 3. + h2 * 9., (7. + h3 * 13.) * (mod(g, 2.) < 0.5 ? -0.8 : 1.)) : vec3(-sign(fA.x) * (1.5 + 4. * h1), 0.5 + 3. * h2, (h3 - 0.5) * 5.);
  if (fB.z > 0.948 && (g < 3.5 || g > 5.5)) vel.x = (fA.x < 0. ? -1. : 1.) * (3. + 4. * h1 + abs(fA.x) * 0.25);    // a flake over 1.0 m across (size over 0.948) of a Rule or of the border's end is thrown outward from the flight's line, by the side it is on
  p.xy = rot2(p.xy, fB.x * 20. + tau * (2. + 5. * h2)); p.yz = rot2(p.yz, tau * (1.5 + 4. * h1) * step(0.0001, tau));
  vec3 o = fA.xyz + vel * tau - vec3(0., 4.9 * tau * tau, 0.);
  float land = step(o.y, 0.05); o.y = max(o.y, 0.05);
  p = mix(p, vec3(p.x, 0., p.y), land) * fB.z * step(0.0001, tau);
  p += o;
`;

// THE TRAM: an electric car 9 m long, solid black with comb-cut panels, paper windows full of hats, three riders
// clinging to its back rail, a trolley pole and its burst star. Local frame: on the track, +Z ahead.
async function buildTram(B, rng, Y) {
  const s = rng(), sd = () => rng(), W2 = 1.15, m1 = [1, 0.25, 0.9, s];
  quad(B, V3(-W2, 0.45, -4.5), V3(-W2, 0.45, 4.5), V3(-W2, 3.25, 4.5), V3(-W2, 3.25, -4.5), [14, 1, 0, s], 0, [0, 0, 9, 2.8]);      // starboard side (toward the path)
  quad(B, V3(W2, 0.45, 4.5), V3(W2, 0.45, -4.5), V3(W2, 3.25, -4.5), V3(W2, 3.25, 4.5), [14, -1, 0, s + 0.3], 0, [0, 0, 9, 2.8]);
  box(B, -W2, W2, 0.45, 3.25, -4.5, 4.5, m1, 0, 'zZ');
  box(B, -W2 - 0.12, W2 + 0.12, 3.25, 3.42, -4.9, 4.9, [2, 0, 0, s]);
  box(B, -0.7, 0.7, 3.42, 3.72, -3.6, 3.6, [1, 0.2, 0.28, s + 0.5], 0, 'xXzZY');
  box(B, -W2 + 0.1, W2 - 0.1, 0.16, 0.45, -4.2, 4.2, [2, 0, 0, s], 0, 'xXzZ');
  box(B, -W2, W2, 0.5, 0.62, -5.5, -4.5, [2, 0, 0, s]);                                        // the back platform and its rail
  for (const x of [-W2, 0, W2]) tube(B, 0, [V3(x, 0.6, -5.45), V3(x, 1.6, -5.45)], 0.03, s, 3);
  tube(B, 0, [V3(-W2, 1.6, -5.45), V3(W2, 1.6, -5.45)], 0.03, s, 3);
  for (const z of [-2.9, 2.9]) for (const sx of [-1, 1]) {
    const x = sx * (W2 + 0.02), r = 0.42;
    if (sx < 0) quad(B, V3(x, 0, z - r), V3(x, 0, z + r), V3(x, 2 * r, z + r), V3(x, 2 * r, z - r), [7, 0, 0, s], 0, [-0.38, -0.38, 0.38, 0.38]);
    else quad(B, V3(x, 0, z + r), V3(x, 0, z - r), V3(x, 2 * r, z - r), V3(x, 2 * r, z + r), [7, 0, 0, s], 0, [0.38, -0.38, -0.38, 0.38]);
  }
  tube(B, 0, [V3(0, 3.7, -1.2), V3(0, 5.15, -3.9)], 0.035, s, 3);                                // the trolley pole
  for (const sx of [-1, 1]) quad(B, V3(-1.6 * sx, 3.6, -3.9), V3(1.6 * sx, 3.6, -3.9), V3(1.6 * sx, 6.8, -3.9), V3(-1.6 * sx, 6.8, -3.9), [15, 1, 0, s], 0, [-1.6, -1.6, 1.6, 1.6]);
  for (const sx of [-1, 1]) quad(B, V3(0, 3.6, -3.9 + 1.6 * sx), V3(0, 3.6, -3.9 - 1.6 * sx), V3(0, 6.8, -3.9 - 1.6 * sx), V3(0, 6.8, -3.9 + 1.6 * sx), [15, 1, 0, s], 0, [-1.6, -1.6, 1.6, 1.6]);
  for (const [i, x] of [-0.75, 0, 0.75].entries()) {                                             // three who cling to the back rail
    await Y();
    const z = -5.35, y = 0.62, Hc = V3(x, y + 1.72, z + 0.05), o = { mid: true, nseg: 4 };
    liteBone(B, 0, V3(x - 0.1, y + 0.95, z), V3(x - 0.12, y + 0.5, z + 0.12), 0.034, 0.066, sd(), o); liteBone(B, 0, V3(x - 0.12, y + 0.5, z + 0.12), V3(x - 0.1, y + 0.04, z), 0.03, 0.06, sd(), o);
    liteBone(B, 0, V3(x + 0.1, y + 0.95, z), V3(x + 0.14, y + 0.52, z - 0.25), 0.034, 0.066, sd(), o); liteBone(B, 0, V3(x + 0.14, y + 0.52, z - 0.25), V3(x + 0.1, y + 0.2, z - 0.55), 0.03, 0.06, sd(), o);
    bar(B, 0, [V3(x, y + 0.98, z), V3(x, y + 1.3, z - 0.05), V3(x, y + 1.58, z + 0.02)], 0.04, 0.04, X_AXIS, [4, 0.05, 0, sd()], { nseg: 4, sub: 2, hull: 0.012, taper0: 0.85, taper1: 0.85 });
    blob(B, 0, V3(x, y + 1.3, z - 0.02), [0.11, 0.17, 0.08], [1, 0.06, 0.2, sd()], { nseg: 6, nring: 3, hull: 0 });
    liteBone(B, 0, V3(x + 0.19, y + 1.47, z), V3(x + 0.3, y + 1.0, z - 0.02), 0.028, 0.052, sd(), o);
    liteBone(B, 0, V3(x - 0.19, y + 1.47, z), V3(x - 0.3 - 0.1 * i, y + 1.9 + 0.12 * i, z + 0.1), 0.028, 0.052, sd(), o);    // an arm flung up
    blob(B, 0, Hc, [0.125, 0.135, 0.15], [3, 0, 0, sd()], { nseg: 7, nring: 4, hull: 0.012 });
    const HB = makeBuilder(); buildHat(HB, [2, 1, 0][i], rng);                                 // a hat each, set on the head
    const off = B.pos.length / 3;
    for (let k = 0; k < HB.pos.length / 3; k++) {
      B.pos.push(HB.pos[k * 3] + x, HB.pos[k * 3 + 1] + y - 0.08, HB.pos[k * 3 + 2] + z - 0.01); B.nor.push(HB.nor[k * 3], HB.nor[k * 3 + 1], HB.nor[k * 3 + 2]);
      B.uv.push(HB.uv[k * 2], HB.uv[k * 2 + 1]); B.mark.push(HB.mark[k * 4], HB.mark[k * 4 + 1], HB.mark[k * 4 + 2], HB.mark[k * 4 + 3]); B.aux.push(HB.aux[k * 2], HB.aux[k * 2 + 1]); B.bone.push(0);
    }
    for (const k of HB.idx) B.idx.push(k + off);
  }
}

// STREET FURNITURE AND THE SMALL LIFE THAT LOOPS ON THE CLOCK: poles and their four wires, the trolley wire, clipped
// street trees, the magueys of the last sheet, onlookers waving hats from balconies, chimney smoke as comb-cut puffs.
// aBone here is a sway code: 0 still, 0..1 sways sideways by that weight, 2..3 a waving arm (2 + reach), 4.. a smoke lobe (4 + phase).
const SWAY_PRE = /* glsl */`attribute float aBone;`;
const SWAY_MOVE = /* glsl */`
  float sw = aBone;
  if (sw < 1.5) { p.x += sw * (0.16 * sin(uTime * 1.3 + p.z * 0.11) + 0.07 * sin(uTime * 2.7 + p.z * 0.37 + p.y)); p.z += sw * 0.08 * sin(uTime * 1.9 + p.x); }
  else if (sw < 3.5) { float k = sw - 2.; p.z += k * 0.5 * sin(uTime * 6. + p.z * 1.7 + p.x); p.y += k * 0.08 * sin(uTime * 12. + p.z * 3.); }
  else if (sw > 5.5) {                                               // a standing calavera keeps time: 6.. the band, 8.. the charro over the Rule (weight = the fraction)
    float big = step(7.5, sw), k = sw - 6. - 2. * big, A = mix(0.5, 1.5, big), ph = uTime * mix(3.4, 1.2, big) + p.z * 0.03;
    p.x += k * A * sin(ph); p.y += k * A * 0.3 * abs(cos(ph));
  }
  else { float ph = fract(sw) * 6.2832; p.x += 0.45 * sin(uTime * 0.6 + ph); p.y += 0.5 * sin(uTime * 0.8 + ph * 1.7); p.z += 0.3 * sin(uTime * 0.5 + ph * 2.3); }
`;
const setCode = (B, from, f) => { for (let i = from; i < B.pos.length / 3; i++) B.bone[i] = f(B.pos[i * 3], B.pos[i * 3 + 1], B.pos[i * 3 + 2]); };
async function buildFurniture(B, rng, town, opts, Y) {
  const s = rng(), PX = -9;
  for (let z = -60; z <= 630; z += 30) {
    tube(B, 0, [V3(PX, 0, z), V3(PX, 9.2, z)], 0.11, s, 4);                                    // a pole and its crossarm, four comb-cut insulators
    tube(B, 0, [V3(PX - 1.05, 8.5, z), V3(PX + 1.05, 8.5, z)], 0.07, s, 3);
    for (const dx of [-0.85, -0.3, 0.3, 0.85]) {
      blob(B, 0, V3(PX + dx, 8.72, z), [0.09, 0.14, 0.09], [1, 0.05, 0.2, rng()], { nseg: 5, nring: 3, hull: 0 });
      if (z < 630) {
        const from = B.pos.length / 3, pts = [];
        for (let k = 0; k <= 4; k++) pts.push(V3(PX + dx, 8.86 - 0.55 * Math.sin(Math.PI * k / 4), z + 7.5 * k));
        tube(B, 0, pts, 0.02, s, 3); setCode(B, from, (x, y, zz) => Math.sin(Math.PI * (zz - z) / 30) * 0.8);
      }
    }
    if (z < 630) {                                                                             // the trolley wire over the port track
      const from = B.pos.length / 3; tube(B, 0, [V3(4.3, 5.2, z), V3(4.3, 5.1, z + 15), V3(4.3, 5.2, z + 30)], 0.02, s, 3);
      setCode(B, from, (x, y, zz) => Math.sin(Math.PI * (zz - z) / 30) * 0.3);
      if (z > RULE2 - 20) continue;
      const tz = z + 15, cs = rng(), from2 = B.pos.length / 3;                                 // a clipped street tree between the poles
      tube(B, 0, [V3(PX, 0, tz), V3(PX, 3.6, tz)], 0.1, s, 4);
      { const f0 = B.pos.length / 3; blob(B, 0, V3(PX, 4.7, tz), [1.5, 1.45, 1.5], [1, 0.22, 0.8, cs], { nseg: 10, nring: 6, hull: 0.03, lump: 0.05 }); whiteLine(B, f0); }
      setCode(B, from2, (x, y) => clamp((y - 1) / 5, 0, 1) * 0.55);
    }
    await Y();
  }
  const i0 = B.idx.length;
  for (let i = 0; i < opts.magueys; i++) {                                                     // magueys along the fences: a fan of black blades, one bundle down each spine
    const sx = i % 2 ? 1 : -1, x = sx * rng.range(11.3, 12.5), z = RULE2 + 8 + (i + rng()) * (165 / opts.magueys), h = rng.range(2, 4), n = 7 + (i % 3);
    for (let b = 0; b < n; b++) {
      const a = (b / n) * Math.PI * 2 + rng(), lean = rng.range(0.25, 0.8), c = Math.cos(a) * lean, sn = Math.sin(a) * lean, from = B.pos.length / 3;
      bar(B, 0, [V3(x, 0, z), V3(x + c * 0.3 * h, 0.5 * h, z + sn * 0.3 * h), V3(x + c * 0.75 * h, 0.9 * h, z + sn * 0.75 * h), V3(x + c * 1.0 * h, (1 - lean * 0.25) * h, z + sn * 1.0 * h)],
        0.085 * h, 0.03 * h, V3(-sn, 0, c), [1, 0.127 * h, 0, rng()], { nseg: 4, sub: 3, hull: 0, taper0: 0.75, taper1: 0.05, circ: 0.253 * h });
      setCode(B, from, (px, py) => clamp(py / h, 0, 1) * 0.15);
    }
    await Y();
  }
  const i1 = B.idx.length;
  let n = 0;                                                                                   // onlookers on the balconies, each waving a hat
  for (const b of town.balconies) {
    for (let z = b.z0; z < b.z1 && n < opts.onlookers; z += rng.range(1.1, 2.6), n++) {
      const x = b.x, y = b.y, sx = -b.s, sd = rng(), up = V3(x + sx * 0.12, y + 1.55, z + 0.38), sh = V3(x, y + 1.05, z + 0.16);
      blob(B, 0, V3(x, y + 0.72, z), [0.16, 0.42, 0.12], [1, 0.07, 0.22, sd], { nseg: 4, nring: 3, hull: 0 });
      blob(B, 0, V3(x, y + 1.33, z), [0.13, 0.14, 0.14], [3, 0, 0, sd], { nseg: 5, nring: 3, hull: 0.014 });
      blob(B, 0, V3(x + sx * 0.12, y + 1.34, z), [0.035, 0.05, 0.09], [2, 0, 0, sd], { nseg: 3, nring: 2, hull: 0 });
      const from = B.pos.length / 3;
      liteBone(B, 0, sh, up, 0.03, 0.055, sd, { hi: false, hull: 0.014 });
      lathe(B, [[0.02, 0], [0.24, 0.01], [0.13, 0.04], [0.11, 0.2], [0.01, 0.22]], 1, [1, 0.06, 0.2, sd], { y0: up.y, z0: up.z, nseg: 5, part: 0, hull: 0 });
      for (let k = from; k < B.pos.length / 3; k++) { if (B.uv[k * 2 + 1] !== undefined && B.mark[k * 4] === 1) B.pos[k * 3] += up.x; }
      setCode(B, from, (px, py) => 2 + clamp((py - sh.y) / 0.6, 0, 1));
      if (n % 2 === 1) await Y();
    }
    await Y();
  }
  const i2 = B.idx.length;
  const src = town.chimneys.slice(0, opts.smokes);
  for (let i = 0; i < (opts.dust || 0); i++) src.push(V3((i % 2 ? 1 : -1) * rng.range(6, 11), -0.6, 20 + i * 44 + rng.range(0, 20)));
  src.forEach((c, j) => {                                     // chimney smoke: curled comb-cut puffs in a contour
    for (let i = 0; i < 3; i++) {
      const from = B.pos.length / 3, r = (0.8 + 0.55 * i) * (c.y < 0 ? 0.7 : 1);
      blob(B, 0, V3(c.x - i * 0.9, c.y + 1.1 + i * 1.75 * (c.y < 0 ? 0.5 : 1), c.z - i * 0.8), [r, r * 0.8, r], [5, 0.4, 1.3, rng()], { nseg: 7, nring: 4, hull: 0.07, lump: 0.12 });
      setCode(B, from, () => 4 + ((j * 0.37 + i * 0.21) % 1));
    }
  });
  return [i0, i1, i2, B.idx.length];        // index ranges: street furniture, magueys, onlookers, smoke (then the contours)
}

// A BONE DOG (the pack's routine swings its legs: parts 20..23 from their own hips, 24 the body), about 0.5 m at the shoulder before iB.w.
function buildDog(B, rng) {
  const sd = () => rng(), H = 0.012;
  bar(B, 24, [V3(0, 0.5, -0.36), V3(0, 0.55, 0), V3(0, 0.52, 0.34)], 0.036, 0.036, X_AXIS, [4, 0.04, 0, sd()], { nseg: 4, sub: 2, hull: H, taper0: 0.85, taper1: 0.85 });
  blob(B, 24, V3(0, 0.45, 0.1), [0.085, 0.11, 0.2], [1, 0.05, 0.15, sd()], { nseg: 6, nring: 3, hull: 0, axis: Z_AXIS });
  liteBone(B, 24, V3(0, 0.52, 0.34), V3(0, 0.62, 0.47), 0.028, 0.045, sd(), { mid: true, nseg: 4 });
  blob(B, 24, V3(0, 0.64, 0.56), [0.075, 0.07, 0.14], [3, 0, 0, sd()], { nseg: 6, nring: 3, hull: H, axis: Z_AXIS });
  for (const sx of [-1, 1]) blob(B, 24, V3(sx * 0.055, 0.66, 0.6), [0.02, 0.024, 0.03], [2, 0, 0, 0.3], { nseg: 3, nring: 2, hull: 0 });
  bar(B, 24, [V3(0, 0.6, 0.52), V3(0, 0.555, 0.62), V3(0, 0.56, 0.7)], 0.03, 0.014, X_AXIS, [3, 0, 0, sd()], { nseg: 3, sub: 1, hull: H });
  bar(B, 24, [V3(0, 0.5, -0.36), V3(0, 0.66, -0.52), V3(0, 0.8, -0.56)], 0.02, 0.02, X_AXIS, [3, 0, 0, sd()], { nseg: 3, sub: 1, hull: H, taper1: 0.5 });
  [[20, -1, 0.32], [21, 1, 0.32], [22, -1, -0.34], [23, 1, -0.34]].forEach(([part, sx, z]) => {
    liteBone(B, part, V3(sx * 0.07, 0.5, z), V3(sx * 0.07, 0.06, z + 0.03), 0.024, 0.045, sd(), { hi: false, hull: H });
  });
  quad(B, V3(-0.4, 0.015, 0.3), V3(0.4, 0.015, 0.3), V3(0.4, 0.015, -0.3), V3(-0.4, 0.015, -0.3), [13, 0, 0, sd()], 14, [-0.5, -0.3, 0.5, 0.3]);
}
// WHAT THE AIR CARRIES, in a window that travels with the camera: loose penny sheets tumbling down the wind (kind 0),
// and the engraver's rain, slanted bundles of five parallel black ribbons (kind 1). aMark is per instance here.
//   dA: x, y, z in the window, seed      dB: kind, drift speed down the street, fall speed, sway
const DRIFT_PRE = /* glsl */`
attribute vec4 dA; attribute vec4 dB; uniform float uCamZ, uCamY, uCone; uniform vec3 uBox;
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
`;
const DRIFT_MOVE = /* glsl */`
  float sd = dA.w, t = uTime;
  p.xy *= aMark.yz;
  if (dB.x < 0.5) { p.yz = rot2(p.yz, t * (1.1 + 1.7 * sd) + sd * 40.); p.xy = rot2(p.xy, t * (0.7 + 1.3 * fract(sd * 7.)) + sd * 9.); p.xz = rot2(p.xz, 0.6 * sin(t * 1.3 + sd * 20.)); }
  else { p.xy = rot2(p.xy, -0.3); }
  float rel = mod(dA.z - t * dB.y - uCamZ, uBox.z) + uBox.x;
  float y = mod(dA.y - t * dB.z, uBox.y) + 0.25 + max(0., uCamY - 12.) * 0.9 * step(dB.x, 0.5);     // the loose sheets ride up with us under the horse
  float x = dA.x + dB.w * sin(t * 0.7 + sd * 30.) + (dB.x > 0.5 ? (y - 10.) * 0.31 : 0.);
  x += sign(x) * max(0., 1.5 - abs(x)) * step(dB.x, 0.5);            // the loose sheets keep off the lens
  float r2 = max(rel, 1.), cone = uCone * (0.15 * r2 + 1.) * step(dB.x, 0.5) * smoothstep(0.03, 0.08, (y - uCamY) / r2);
  x = (x < 0. ? -1. : 1.) * max(abs(x), cone);                       // and out of the hero's piece of the sky
  p += vec3(x, y, uCamZ + rel);
`;

// a hat set on a head that is not the pack's (the head's centre at x, y + 1.8, z + 0.06 in the hat's own frame)
function putHat(B, kind, rng, x, y, z) {
  const HB = makeBuilder(); buildHat(HB, kind, rng);
  const off = B.pos.length / 3;
  for (let k = 0; k < HB.pos.length / 3; k++) {
    B.pos.push(HB.pos[k * 3] + x, HB.pos[k * 3 + 1] + y, HB.pos[k * 3 + 2] + z); B.nor.push(HB.nor[k * 3], HB.nor[k * 3 + 1], HB.nor[k * 3 + 2]);
    B.uv.push(HB.uv[k * 2], HB.uv[k * 2 + 1]); B.mark.push(HB.mark[k * 4], HB.mark[k * 4 + 1], HB.mark[k * 4 + 2], HB.mark[k * 4 + 3]); B.aux.push(HB.aux[k * 2], HB.aux[k * 2 + 1]); B.bone.push(0);
  }
  for (const k of HB.idx) B.idx.push(k + off);
}
// THE COUNTRY CAST'S MULE CART (the bone mule is the dog's geometry at three times the size, in the pack's routine)
function buildCart(B, rng) {
  const s = rng(), sd = () => rng();
  box(B, -0.8, 0.8, 0.85, 1.3, -1.3, 1.1, [1, 0.2, 0.42, s]);
  for (const sx of [-1, 1]) {
    const x = sx * 0.93, r = 0.79, c = 0.75, zc = -0.2, pts = [];
    if (sx < 0) quad(B, V3(x, c - r, zc - r), V3(x, c - r, zc + r), V3(x, c + r, zc + r), V3(x, c + r, zc - r), [7, 0, 0, s], 0, [-0.38, -0.38, 0.38, 0.38]);
    else quad(B, V3(x, c - r, zc + r), V3(x, c - r, zc - r), V3(x, c + r, zc - r), V3(x, c + r, zc + r), [7, 0, 0, s], 0, [0.38, -0.38, -0.38, 0.38]);
    quad(B, V3(-x, c - r, zc + r * sx), V3(-x, c - r, zc - r * sx), V3(-x, c + r, zc - r * sx), V3(-x, c + r, zc + r * sx), [7, 0, 0, s], 0, [0.38, -0.38, -0.38, 0.38]);
    for (let j = 0; j <= 10; j++) { const a = (j / 10) * Math.PI * 2; pts.push(V3(x, c + Math.cos(a) * 0.72, zc + Math.sin(a) * 0.72)); }
    tube(B, 0, pts, 0.045, s, 3);
    tube(B, 0, [V3(sx * 0.5, 1.0, 1.1), V3(sx * 0.46, 1.08, 3.3)], 0.03, s, 3);
  }
  for (let i = 0; i < 4; i++) blob(B, 0, V3(rng.range(-0.4, 0.4), 1.55 + (i % 2) * 0.35, -0.9 + i * 0.42), [0.42, 0.3, 0.36], [5, 0.12, 0.4, sd()], { nseg: 6, nring: 3, hull: 0.02, lump: 0.1 });
  const x = 0, y = 0.72, z = 0.75;                                              // the driver
  bar(B, 0, [V3(x, y + 0.6, z), V3(x, y + 1.3, z - 0.04), V3(x, y + 1.58, z + 0.02)], 0.04, 0.04, X_AXIS, [4, 0.05, 0, sd()], { nseg: 4, sub: 2, hull: 0.012, taper0: 0.85, taper1: 0.85 });
  blob(B, 0, V3(x, y + 1.3, z - 0.02), [0.11, 0.17, 0.08], [1, 0.06, 0.2, sd()], { nseg: 6, nring: 3, hull: 0 });
  for (const sx of [-1, 1]) liteBone(B, 0, V3(x + sx * 0.19, y + 1.47, z), V3(x + sx * 0.25, y + 1.05, z + 0.35), 0.028, 0.052, sd(), { mid: true, nseg: 4 });
  blob(B, 0, V3(x, y + 1.72, z + 0.05), [0.125, 0.135, 0.15], [3, 0, 0, sd()], { nseg: 7, nring: 4, hull: 0.012 });
  putHat(B, 1, rng, x, y - 0.08, z - 0.01);
}

// THE GRAND LADY OF THE SECOND SHEET: a calavera 16 m from crown to chin under a brim 37 m across heaped with ostrich
// plumes (feathers only), leaning over the starboard fronts to watch the parade, her finger bones hooked on the cornice.
// Built in her own frame at full size (origin the middle of the skull, +Z the way she faces, +Y up), with the same
// stamped skull as every citizen, cut finer. aBone: 0 body and hands (still), 1 skull and hat, 2 plumes (they nod).
const LADY_S = 34;
async function buildLady(B, rng, Y, hands) {
  const S = LADY_S, sd = () => rng(), H = 0.014 * S, P = (x, y, z) => V3(x * S, y * S, z * S), r3 = (a, b, c) => [a * S, b * S, c * S];
  const paper = () => [3, 0, 0, sd()], ink = [2, 0, 0, 0.3];
  blob(B, 1, P(0, 0.022, -0.025), r3(0.122, 0.13, 0.15), paper(), { nseg: 16, nring: 9, hull: H, lump: 0.07 });                 // the lumpy cranium
  blob(B, 1, P(0, 0.075, 0.085), r3(0.1, 0.035, 0.05), paper(), { nseg: 10, nring: 4, hull: H });                               // the brow
  for (const sx of [-1, 1]) {
    blob(B, 1, P(sx * 0.1, -0.05, 0.062), r3(0.04, 0.03, 0.062), paper(), { nseg: 8, nring: 4, hull: H });                      // cheekbone
    blob(B, 1, P(sx * 0.058, 0.008, 0.1), r3(0.046, 0.054, 0.036), ink, { nseg: 12, nring: 5, hull: 0 });                       // socket
    blob(B, 1, P(sx * 0.112, 0.03, -0.035), r3(0.02, 0.055, 0.07), [5, 0.045 * S, 0.1 * S, sd()], { nseg: 8, nring: 4, hull: 0 });   // the comb on the temple
    blob(B, 1, P(sx * 0.07, 0.115, -0.05), r3(0.03, 0.05, 0.085), [5, 0.05 * S, 0.14 * S, sd()], { nseg: 8, nring: 4, hull: 0 });    // and over the crown
  }
  await Y();
  blob(B, 1, P(0, -0.105, 0.09), r3(0.082, 0.056, 0.076), paper(), { nseg: 12, nring: 5, hull: H });                            // upper jaw
  blob(B, 1, P(0, -0.066, 0.136), r3(0.021, 0.034, 0.034), ink, { nseg: 6, nring: 3, hull: 0 });                                // nose notch
  blob(B, 1, P(0, -0.2, 0.04), r3(0.078, 0.07, 0.085), ink, { nseg: 10, nring: 4, hull: 0 });                                   // the open mouth
  const band = (rx, rz, cz, y0, y1, a, n, k0) => {                                // a row of teeth round the front of a jaw
    const arc = (t, y, k) => P(Math.sin(t) * rx * k, y, cz + Math.cos(t) * rz * k);
    for (let j = 0; j < n; j++) { const t0 = -a + (2 * a * j) / n, t1 = t0 + (2 * a) / n, w = (2 * a * rx) / n;
      quad(B, arc(t0, y0, k0), arc(t1, y0, k0), arc(t1, y1, 1), arc(t0, y1, 1), [8, 0, 0, 0.3], 1, [j * w, 0, (j + 1) * w, 1]); }
  };
  band(0.088, 0.085, 0.09, -0.172, -0.118, 1.2, 12, 0.97);
  band(0.09, 0.094, 0.045, -0.292, -0.243, 1.0, 10, 0.95);
  bar(B, 1, [P(-0.118, -0.1, -0.035), P(-0.106, -0.275, 0.04), P(0, -0.315, 0.137), P(0.106, -0.275, 0.04), P(0.118, -0.1, -0.035)],
    0.034 * S, 0.024 * S, Y_AXIS, paper(), { nseg: 8, sub: 8, hull: H, taper0: 0.8, taper1: 0.8 });                              // the lower jaw, hanging as a bar of its own
  await Y();
  // the hat: a wide black brim and a low crown cut with the comb, a paper line round it, and six plumes heaped on it
  const s = sd(), k = 1.15 * S, prof = [[0.12, -0.01], [0.44, 0], [0.47, 0.03], [0.2, 0.05], [0.17, 0.12], [0.1, 0.16], [0.01, 0.17]], from = B.pos.length / 3;
  const st = prof.map(([r, y]) => ({ p: V3(0, 0.085 * S + y * k, 0), rx: r * k, rz: r * k, lobe: 0, notch: 0 }));
  let v = 0; st.forEach((q, i) => { if (i) v += Math.hypot((prof[i][0] - prof[i - 1][0]) * k, (prof[i][1] - prof[i - 1][1]) * k); q.v = v; });
  loft(B, st, 24, X_AXIS, [1, 0.07 * S, 0.3 * S, s], { bone: 1, hull: H, circ: 2 * Math.PI * 0.47 * k, axis: Y_AXIS });
  whiteLine(B, from);
  loft(B, [0.058, 0.108].map((y, i) => ({ p: V3(0, 0.085 * S + y * k, 0), rx: 0.204 * k, rz: 0.204 * k, lobe: 0, notch: 0, v: i * 0.05 * k })), 24, X_AXIS, [3, 0, 0, s + 4], { bone: 1, hull: 0, circ: 1.28 * k, axis: Y_AXIS });   // her hat band, in the second ink
  for (let i = 0; i < 6; i++) {
    const a = -1.5 + i * 0.6 + rng.range(-0.08, 0.08), h = rng.range(0.3, 0.42) * (i % 2 ? 1.3 : 0.92), c = Math.cos(a), sn = Math.sin(a), y = 0.2;
    const Q = (r, dy) => P(sn * r, y + dy, -c * r);
    bar(B, 2, [Q(0.06, 0.02), Q(0.14, h * 0.75), Q(0.34, h), Q(0.58, h * 0.8), Q(0.76, h * 0.42), Q(0.8, h * 0.08), Q(0.7, h * -0.04)], 0.2 * S, 0.05 * S, Y_AXIS, [19, 0.06 * S, 1.5 * S, rng() + (i % 2 ? 4 : 0)],
      { nseg: 8, sub: 12, hull: 0.012 * S, taper0: 0.55, taper1: 0.45, circ: 0.8 * S });
    await Y();
  }
  // the neck (a string of paper knots), the collar bones, the cage (solid ink with paper ribs round it)
  const bone = (A, Bp, R, K, o = {}) => liteBone(B, 0, A, Bp, R * S, K * S, sd(), { hull: 0.012 * S, bw: 0.06 * S, nseg: 8, ...o });
  for (let i = 0; i < 5; i++) blob(B, 0, P(0, -0.2 - i * 0.045, -0.085 - i * 0.02), r3(0.04, 0.03, 0.036), paper(), { nseg: 8, nring: 3, hull: H });
  for (const sx of [-1, 1]) bone(P(sx * 0.025, -0.4, -0.13), P(sx * 0.23, -0.365, -0.15), 0.024, 0.045, { side: Y_AXIS });
  const C = P(0, -0.6, -0.17), ax = Y_AXIS, bk = V3(0, 0, -1);
  blob(B, 0, C, r3(0.15, 0.2, 0.1), [2, 0, 0, sd()], { nseg: 12, nring: 6, hull: 0, axis: ax });
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) {
    const pts = [], s0 = 0.15 - i * 0.07;
    for (let j = 0; j <= 6; j++) {
      const ph = 0.3 + j * 0.44, sy = s0 - 0.05 * (j / 6), R = Math.sqrt(Math.max(0.08, 1 - (sy / 0.2) ** 2));
      pts.push(C.clone().addScaledVector(ax, sy * S).addScaledVector(bk, Math.cos(ph) * (0.1 * R + 0.016) * S).addScaledVector(X_AXIS, sx * Math.sin(ph) * (0.15 * R + 0.016) * S));
    }
    strip(B, 0, pts, 0.024 * S, 0.014 * S, ax, paper(), H, 0.95, 0.6);
  }
  await Y();
  // the arms, elbows out, and four finger bones of each hand hooked over the cornice (hands: local points from the world)
  hands.forEach((hand, n) => {
    const sx = n ? 1 : -1, Sh = P(sx * 0.25, -0.38, -0.15), Wr = hand.wrist;
    const El = Sh.clone().add(Wr).multiplyScalar(0.5).add(V3(sx * 0.2 * S, -0.03 * S, -0.1 * S));
    bone(Sh, El, 0.03, 0.058); bone(El, Wr, 0.027, 0.05);
    for (const [k0, k1, k2] of hand.fingers) { bone(Wr.clone().lerp(k0, 0.25), k0, 0.012, 0.022, { nseg: 4, mid: true }); bone(k0, k1, 0.014, 0.027, { nseg: 5, mid: true }); bone(k1, k2, 0.013, 0.025, { nseg: 5, mid: true }); }
  });
  await Y();
}
const LADY_PRE = /* glsl */`attribute float aBone; uniform vec4 uNod;`;
const LADY_MOVE = /* glsl */`
  if (aBone > 0.5) {                                             // skull, hat and plumes nod and turn on the neck; the plumes sway on top of that
    vec3 c = vec3(0., -${(0.22 * LADY_S).toFixed(2)}, -${(0.09 * LADY_S).toFixed(2)}); p -= c;
    float ca = cos(uNod.x), sa = sin(uNod.x), cb = cos(uNod.y), sb = sin(uNod.y);
    p = vec3(p.x, ca * p.y - sa * p.z, sa * p.y + ca * p.z); n = vec3(n.x, ca * n.y - sa * n.z, sa * n.y + ca * n.z);
    p = vec3(cb * p.x + sb * p.z, p.y, -sb * p.x + cb * p.z); n = vec3(cb * n.x + sb * n.z, n.y, -sb * n.x + cb * n.z);
    p += c;
    if (aBone > 1.5) { float h = max(p.y - ${(0.2 * LADY_S).toFixed(2)}, 0.); p.x += 0.07 * h * sin(uTime * 1.1 + p.z * 0.2); p.z += 0.05 * h * sin(uTime * 1.6 + p.x * 0.17); }
  }
`;

// ---------------------------------------------------------------------------------------------
// STANDING CALAVERAS AT ANY SIZE (the charro who looks over the first Rule, the band and the lady of the last sheet).
// Each is built at full size in its own frame (origin between the feet, +Z the way it faces; one unit = a citizen
// 1.9 m tall, times S) and then set down with place(). d: fineness (1 for a giant, about 0.6 for the band).
// ---------------------------------------------------------------------------------------------
function stampSkull(B, S, c, sd, d = 1) {                  // the one stamped skull of every citizen; c: its middle
  const H = 0.014 * S, P = (x, y, z) => V3(c.x + x * S, c.y + y * S, c.z + z * S), r3 = (a, b, e) => [a * S, b * S, e * S];
  const paper = () => [3, 0, 0, sd()], ink = [2, 0, 0, 0.3], n = (k) => Math.max(4, Math.round(k * d));
  blob(B, 0, P(0, 0.022, -0.025), r3(0.122, 0.13, 0.15), paper(), { nseg: n(14), nring: n(8), hull: H, lump: 0.07 });      // the lumpy cranium
  blob(B, 0, P(0, 0.075, 0.085), r3(0.1, 0.035, 0.05), paper(), { nseg: n(8), nring: 3, hull: H });                        // the brow
  for (const sx of [-1, 1]) {
    blob(B, 0, P(sx * 0.1, -0.05, 0.062), r3(0.04, 0.03, 0.062), paper(), { nseg: n(7), nring: 3, hull: H });              // cheekbone
    blob(B, 0, P(sx * 0.058, 0.008, 0.1), r3(0.046, 0.054, 0.036), ink, { nseg: n(10), nring: n(5), hull: 0 });            // socket
    blob(B, 0, P(sx * 0.112, 0.03, -0.035), r3(0.02, 0.055, 0.07), [5, 0.045 * S, 0.1 * S, sd()], { nseg: n(7), nring: 3, hull: 0 });   // the comb on the temple
  }
  blob(B, 0, P(0, -0.105, 0.09), r3(0.082, 0.056, 0.076), paper(), { nseg: n(10), nring: n(4), hull: H });                 // upper jaw
  blob(B, 0, P(0, -0.066, 0.136), r3(0.021, 0.034, 0.034), ink, { nseg: n(5), nring: 3, hull: 0 });                        // nose notch
  blob(B, 0, P(0, -0.2, 0.04), r3(0.078, 0.07, 0.085), ink, { nseg: n(8), nring: 3, hull: 0 });                            // the open mouth
  const band = (rx, rz, cz, y0, y1, a, nn, k0) => {                               // a row of teeth round the front of a jaw
    const arc = (t, y, k) => P(Math.sin(t) * rx * k, y, cz + Math.cos(t) * rz * k);
    for (let j = 0; j < nn; j++) { const t0 = -a + (2 * a * j) / nn, t1 = t0 + (2 * a) / nn, w = (2 * a * rx) / nn;
      quad(B, arc(t0, y0, k0), arc(t1, y0, k0), arc(t1, y1, 1), arc(t0, y1, 1), [8, 0, 0, 0.3], 0, [j * w, 0, (j + 1) * w, 1]); }
  };
  band(0.088, 0.085, 0.09, -0.172, -0.118, 1.2, n(10), 0.97);
  band(0.09, 0.094, 0.045, -0.292, -0.243, 1.0, n(8), 0.95);
  bar(B, 0, [P(-0.118, -0.1, -0.035), P(-0.106, -0.275, 0.04), P(0, -0.315, 0.137), P(0.106, -0.275, 0.04), P(0.118, -0.1, -0.035)],
    0.034 * S, 0.024 * S, Y_AXIS, paper(), { nseg: n(7), sub: n(7), hull: H, taper0: 0.8, taper1: 0.8 });                   // the lower jaw, hanging as a bar of its own
}
// a solid of revolution at any size on a base point (a hat, a drum, a bell, a skirt): prof [[r, y], ...] times k
function turned(B, prof, k, base, mark, o = {}) {
  const { nseg = 14, hull = 0.014 * k, white = true, axis = Y_AXIS, side = X_AXIS } = o, from = B.pos.length / 3;
  const st = prof.map(([r, y]) => ({ p: base.clone().addScaledVector(axis, y * k), rx: Math.max(0.004 * k, r * k), rz: Math.max(0.004 * k, r * k), lobe: 0, notch: 0 }));
  let v = 0; st.forEach((q, i) => { if (i) v += Math.hypot((prof[i][0] - prof[i - 1][0]) * k, (prof[i][1] - prof[i - 1][1]) * k); q.v = v; });
  loft(B, st, nseg, side, mark, { bone: 0, hull, circ: 2 * Math.PI * Math.max(...prof.map((p) => p[0])) * k, axis });
  if (white && hull > 0) whiteLine(B, from);
}
const HAT_PROF = {
  sombrero: [[0.12, -0.01], [0.47, 0], [0.54, 0.06], [0.52, 0.09], [0.45, 0.04], [0.17, 0.05], [0.145, 0.2], [0.11, 0.36], [0.05, 0.43], [0.01, 0.44]],
  top: [[0.1, -0.01], [0.3, 0], [0.31, 0.04], [0.21, 0.05], [0.195, 0.28], [0.22, 0.58], [0.21, 0.6], [0.01, 0.605]],
  bowler: [[0.1, -0.01], [0.3, 0], [0.315, 0.04], [0.28, 0.05], [0.205, 0.045], [0.205, 0.14], [0.18, 0.24], [0.12, 0.3], [0.01, 0.32]],
  brim: [[0.12, -0.01], [0.44, 0], [0.47, 0.03], [0.2, 0.05], [0.17, 0.12], [0.1, 0.16], [0.01, 0.17]],
};
const HAT_BAND = { sombrero: [0.19, 0.056, 0.13], top: [0.213, 0.06, 0.17], bowler: [0.214, 0.052, 0.11], brim: [0.204, 0.058, 0.108] };
// turn (lean forward about X, then yaw about Y) and set down everything a builder holds from vertex `from`
function place(B, from, pos, yaw, lean = 0) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cl = Math.cos(lean), sl = Math.sin(lean);
  const tf = (A, i, t) => {
    let x = A[i], y = A[i + 1], z = A[i + 2];
    const y2 = cl * y - sl * z, z2 = sl * y + cl * z; y = y2; z = z2;
    const x3 = cy * x + sy * z, z3 = -sy * x + cy * z;
    A[i] = x3 + t * pos.x; A[i + 1] = y + t * pos.y; A[i + 2] = z3 + t * pos.z;
  };
  for (let i = from * 3; i < B.pos.length; i += 3) { tf(B.pos, i, 1); tf(B.nor, i, 0); }
}
// o: { hat: 'sombrero' | 'top' | 'bowler' | 'brim' (with plumes), d, legs: false (nothing below the ribs), skirt: true (a long comb-cut skirt),
//   arms: [[elbow, hand], [elbow, hand]] in unit points (the arm at -x first), fingers: per arm [[k0, k1, k2], ...] hooked finger bones,
//   prop: 'guitar' | 'tuba' | 'drum' | 'fan' }. The second ink goes on the hat band, a neckerchief, and one part of the prop.
async function buildFigure(B, rng, S, o, Y) {
  const sd = () => rng(), d = o.d ?? 0.6, H = 0.013 * S, P = (x, y, z) => V3(x * S, y * S, z * S), r3 = (a, b, c) => [a * S, b * S, c * S];
  const n = (k) => Math.max(4, Math.round(k * d)), paper = () => [3, 0, 0, sd()], U = (a) => P(a[0], a[1], a[2]), cm = () => [1, 0.07 * S, 0.3 * S, sd()];
  const bone = (A, Bp, R, K, oo = {}) => liteBone(B, 0, A, Bp, R * S, K * S, sd(), { hull: H, bw: 0.06 * S, nseg: n(7), ...(d < 0.7 ? { mid: true } : {}), ...oo });
  if (o.skirt) turned(B, [[0.02, 0], [0.5, 0.02], [0.36, 0.3], [0.21, 0.8], [0.15, 1.0], [0.02, 1.02]], S, V3(0, 0, 0), [1, 0.1 * S, 0.5 * S, sd()], { nseg: n(16), hull: H });
  else if (o.legs !== false) for (const sx of [-1, 1]) {
    const hip = P(sx * 0.1, 0.97, 0), knee = P(sx * 0.14, 0.52, 0.06), foot = P(sx * 0.16, 0.08, 0);
    bone(hip, knee, 0.036, 0.068); bone(knee, foot, 0.031, 0.06);
    blob(B, 0, P(sx * 0.17, 0.04, 0.08), r3(0.055, 0.13, 0.04), paper(), { nseg: n(6), nring: 3, hull: H, axis: Z_AXIS });               // the foot
    blob(B, 0, P(sx * 0.085, 1.03, -0.02), r3(0.09, 0.1, 0.05), paper(), { nseg: n(7), nring: 3, hull: H, axis: V3(sx * 0.5, 1, 0) });    // a wing of the pelvis, a black hole in it
    blob(B, 0, P(sx * 0.085, 1.0, 0.035), r3(0.03, 0.036, 0.02), [2, 0, 0, 0.3], { nseg: 4, nring: 2, hull: 0 });
  }
  await Y();
  for (let i = 0; i < 8; i++) blob(B, 0, P(0, 1.09 + i * 0.075, -0.02 + Math.max(0, i - 5) * 0.02), r3(0.042, 0.036, 0.036), paper(), { nseg: n(6), nring: 2, hull: H });   // spine and neck: a string of knots
  const C = P(0, 1.38, 0), bk = V3(0, 0, -1);
  blob(B, 0, C, r3(0.14, 0.185, 0.09), [2, 0, 0, sd()], { nseg: n(10), nring: n(5), hull: 0 });                                          // the cage: solid ink, paper ribs round it
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) {
    const pts = [], s0 = 0.14 - i * 0.065;
    for (let j = 0; j <= 5; j++) {
      const ph = 0.3 + j * 0.53, sy = s0 - 0.05 * (j / 5), R = Math.sqrt(Math.max(0.08, 1 - (sy / 0.185) ** 2));
      pts.push(C.clone().addScaledVector(Y_AXIS, sy * S).addScaledVector(bk, Math.cos(ph) * (0.09 * R + 0.016) * S).addScaledVector(X_AXIS, sx * Math.sin(ph) * (0.14 * R + 0.016) * S));
    }
    strip(B, 0, pts, 0.023 * S, 0.013 * S, Y_AXIS, paper(), H, 0.95, 0.6);
  }
  for (const sx of [-1, 1]) bone(P(sx * 0.02, 1.565, 0.02), P(sx * 0.2, 1.585, 0), 0.022, 0.042, { side: Y_AXIS });                       // collar bones
  blob(B, 0, P(0, 1.61, 0.085), r3(0.13, 0.055, 0.05), [3, 0, 0, sd() + 4], { nseg: n(8), nring: 2, hull: 0 });                           // a neckerchief, in the second ink
  await Y();
  (o.arms || []).forEach(([E, Hd], i) => {
    const sx = i ? 1 : -1, Sh = P(sx * 0.21, 1.56, -0.01), El = U(E), Wr = U(Hd), fing = o.fingers && o.fingers[i];
    bone(Sh, El, 0.03, 0.056); bone(El, Wr, 0.026, 0.05);
    if (!fing) blob(B, 0, Wr, r3(0.04, 0.055, 0.03), paper(), { nseg: n(6), nring: 2, hull: H });
    else for (const [k0, k1, k2] of fing) { bone(Wr.clone().lerp(U(k0), 0.25), U(k0), 0.012, 0.022, { nseg: 4, mid: true }); bone(U(k0), U(k1), 0.014, 0.027, { nseg: 5, mid: true }); bone(U(k1), U(k2), 0.013, 0.025, { nseg: 5, mid: true }); }
  });
  await Y();
  const c = P(0, 1.8, 0.05), hat = o.hat || 'sombrero', k = S * (hat === 'brim' ? 1.15 : 1), hb = V3(c.x, c.y + 0.085 * S, c.z), hs = sd();
  stampSkull(B, S, c, sd, d); await Y();
  turned(B, HAT_PROF[hat], k, hb, hat === 'top' ? [1, 0.06 * S, 0.5 * S, hs] : [1, 0.07 * S, 0.3 * S, hs], { nseg: n(20), hull: 0.014 * S });
  { const [r, ya, yb] = HAT_BAND[hat]; turned(B, [[r, ya], [r * (hat === 'sombrero' ? 0.93 : 1), yb]], k, hb, [3, 0, 0, hs + 4], { nseg: n(20), hull: 0 }); }
  if (hat === 'sombrero') turned(B, [[0.552, 0.028], [0.546, 0.088]], k, hb, [3, 0, 0, hs + 4], { nseg: n(20), hull: 0 });        // and the binding round the brim's edge
  if (hat === 'brim') for (let i = 0; i < 5; i++) {                              // ostrich plumes heaped on the brim (feathers only), every other one from the colour run
    const a = -1.4 + i * 0.7 + rng.range(-0.08, 0.08), h = rng.range(0.3, 0.42) * (i % 2 ? 1.3 : 0.92), cs = Math.cos(a), sn = Math.sin(a);
    const Q = (r, dy) => V3(hb.x + sn * r * S, hb.y + (0.115 + dy) * S, hb.z - cs * r * S);
    bar(B, 0, [Q(0.06, 0.02), Q(0.14, h * 0.75), Q(0.34, h), Q(0.58, h * 0.8), Q(0.76, h * 0.42), Q(0.8, h * 0.08), Q(0.7, h * -0.04)], 0.2 * S, 0.05 * S, Y_AXIS, [19, 0.06 * S, 1.5 * S, rng() + (i % 2 ? 4 : 0)],
      { nseg: n(7), sub: n(10), hull: 0.012 * S, taper0: 0.55, taper1: 0.45, circ: 0.8 * S });
  }
  await Y();
  if (o.prop === 'guitar') {
    const f0 = B.pos.length / 3;
    blob(B, 0, P(-0.04, 1.08, 0.2), r3(0.21, 0.07, 0.24), cm(), { nseg: n(12), nring: n(5), hull: H, axis: Z_AXIS });
    blob(B, 0, P(0.1, 1.3, 0.2), r3(0.15, 0.065, 0.17), cm(), { nseg: n(10), nring: n(5), hull: H, axis: Z_AXIS });
    whiteLine(B, f0);
    blob(B, 0, P(0.02, 1.18, 0.265), r3(0.075, 0.02, 0.075), [3, 0, 0, sd() + 4], { nseg: n(8), nring: 2, hull: H, axis: Z_AXIS });          // the sound hole, in the second ink
    bar(B, 0, [P(0.17, 1.4, 0.22), P(0.36, 1.62, 0.21), P(0.54, 1.83, 0.2)], 0.03 * S, 0.018 * S, Z_AXIS, [1, 0.04 * S, 0, sd()], { nseg: 4, sub: 3, hull: H, taper0: 1, taper1: 1 });
    blob(B, 0, P(0.58, 1.88, 0.2), r3(0.05, 0.07, 0.03), [2, 0, 0, 0.3], { nseg: 5, nring: 2, hull: 0 });
  } else if (o.prop === 'tuba') {
    const pts = [], ax = V3(0.25, 1, 0.3).normalize(), m0 = P(0.36, 1.45, 0.1);
    for (let i = 0; i <= 12; i++) { const a = -2.0 + (i / 12) * 5.4; pts.push(P(0.02 + 0.36 * Math.cos(a), 1.22 + 0.4 * Math.sin(a), 0.17 + 0.07 * Math.cos(a * 0.5))); }
    bar(B, 0, pts, 0.05 * S, 0.05 * S, Z_AXIS, [1, 0.05 * S, 0, sd()], { nseg: n(7), sub: n(16), hull: H, taper0: 0.7, taper1: 1 });
    turned(B, [[0.05, 0], [0.07, 0.3], [0.13, 0.5], [0.3, 0.62], [0.33, 0.63]], S, m0, cm(), { nseg: n(14), hull: H, axis: ax });
    blob(B, 0, m0.clone().addScaledVector(ax, 0.6 * S), r3(0.27, 0.03, 0.27), [3, 0, 0, sd() + 4], { nseg: n(12), nring: 2, hull: 0, axis: ax });   // the bell's mouth, in the second ink
  } else if (o.prop === 'drum') {
    turned(B, [[0.02, 0], [0.33, 0.01], [0.33, 0.3], [0.02, 0.31]], S, P(0, 1.12, 0.14), [1, 0.08 * S, 0.3 * S, sd()], { nseg: n(14), hull: H, axis: Z_AXIS });
    blob(B, 0, P(0, 1.12, 0.456), r3(0.27, 0.012, 0.27), [3, 0, 0, sd() + 4], { nseg: n(12), nring: 2, hull: 0, axis: Z_AXIS });               // the drum head, in the second ink
    (o.arms || []).forEach(([, Hd], i) => tube(B, 0, [U(Hd), P((i ? 1 : -1) * 0.12, 1.2 + 0.1 * i, 0.47)], 0.013 * S, sd(), 4));
  } else if (o.prop === 'fan') {
    const Hd = U(o.arms[1][1]);
    blob(B, 0, V3(Hd.x, Hd.y + 0.16 * S, Hd.z + 0.02 * S), r3(0.2, 0.012, 0.19), [4, 0.05 * S, 0, sd() + 4], { nseg: n(10), nring: 2, hull: H, axis: Z_AXIS, circ: 1.2 * S });
  }
}

// ==== HELPERS ABOVE; MORE ARE INSERTED HERE ====

export default {
  id: 'pedalling-bones',
  name: 'The Pedalling Bones',
  category: 'artists',
  placeKind: 'city',
  after: 'José Guadalupe Posada, 1852 to 1913',
  weirdness: 0.6,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, Y = () => ctx.yield();
    const detail = ctx.quality?.detail ?? 1, density = ctx.vary?.density ?? 1, rare = !!ctx.vary?.rare;
    const scene = new THREE.Scene();
    // ---- the edition (seeded once; always noon)
    const order = rng.pick([[2, 3, 4], [2, 3, 4], [3, 4, 2], [4, 2, 3]]);       // paper of each sheet, one at a time
    const weather = rng.pick(['still', 'still', 'wind', 'rain']);
    const cast = rng.pick(['town', 'country']);
    const impression = rng.chance(0.45) ? 'worn' : 'fresh';
    const papers = order.map((i) => new THREE.Color(PB_PALETTE[i]));
    scene.background = papers[0].clone();
    const style = makeStyleUniforms(PB_PALETTE);
    const W = { uCamZ: { value: 0 }, uCamY: { value: 1.6 }, uU: { value: 0 }, uToss: { value: 0 }, uShift: { value: 0 }, uCone: { value: 1 } };   // world uniforms shared by reference

    // ---- the course: dead straight down +Z on x 0
    // (handlebar height in; up over the hats for the whole parade; low again as the hooves land; up between the fore
    // legs, under the ribs, and straight down between the hind legs through the first Rule)
    const path = makePath([[0, 1.6, 0], [0, 1.6, 30], [0, 1.9, 56], [0, 3.6, 76], [0, 6.2, 98], [0, 6.9, 114], [0, 6.3, 140], [0, 6, 160], [0, 6.1, 167], [0, 7, 173],
      [0, 10, 180], [0, 20.5, 197], [0, 30, 212.5], [0, 33.4, 220], [0, 33, 226], [0, 29, 233], [0, 15.5, 253], [0, 5.2, 268], [0, 2.4, 276], [0, 1.8, 288],
      // second sheet: up over the tram and the hats to meet the grand lady leaning over the fronts, and past under her brim
      [0.4, 2.6, 300], [1.6, 7.4, 318], [2.5, 11.2, 336], [2.6, 12, 360], [2.2, 11.2, 396], [0.8, 11, 425],
      // through the second Rule 13 m up, out high over the country end of the street, then down into the pack for the horse
      [0, 12.6, 446], [0, 14.2, 458], [0, 16, 474], [0, 15.2, 486], [0, 5.2, 512], [0, 2.3, 526], [0, 1.9, 538], [0, 2.1, 545], [0, 5.4, 600], [0, 9, 660]]);
    const camZ = (u) => path.pointAt(clamp(u, 0, 1), _p).z, _p = V3(0, 0, 0), _poi = V3(0, 0, 0);

    // ---- the hero: the bone horse and its rider
    const hero = await buildHero(ctx, { style, paper: order[0], impression, detail, puff: 1.6 });
    scene.add(hero.object); await Y();
    // where it is. FIRST (u < 0.5) it comes at us facing -Z: metres ahead of the camera. It prances at the far end of
    // the street on a collected stride (reach = the ground it really covers, so the hooves stay planted), brings both
    // fore hooves down either side of the path at u 0.2, strides over us and is gone behind.
    const offA = keyed([[0, 238], [0.08, 196], [0.16, 150], [0.22, 108], [0.25, 88], [0.27, 76], [0.29, 58], [0.31, 32], [0.325, 2], [0.34, -40], [0.36, -90], [0.39, -160], [0.43, -260], [0.5, -400]]);
    const HA = (u) => camZ(u) + offA(u);
    // THEN it overtakes facing +Z, by its own place on the street (world z): a true gallop, 96 m to the stride. It
    // takes off 60 m short of the border, clears the gate and sails on up and out over the sheet's edge.
    const HB = keyed([[0.5, -80], [0.62, 170], [0.7, 400], [0.745, 530], [0.79, 610], [0.83, 645], [0.87, 676], [0.92, 714], [1, 790]]);
    const leapY = keyed([[600, 0], [626, 16], [648, 31], [700, 40], [735, 42], [790, 40], [850, 34], [960, 28]]);
    const heroAt = (u) => {
      const a = u < 0.5, z = a ? HA(u) : HB(u);
      hero.object.position.set(0, a ? 0 : leapY(z), z);
      hero.object.rotation.y = a ? Math.PI : 0.9 * hero.arm * smoothstep(545, 700, z);       // it veers as it jumps, so the whole horse shows from behind
      hero.setHatTilt(a ? 0.5 : -0.6);
      hero.setPuffSide(a ? lerp(0.85, 1.5, smoothstep(0.265, 0.3, u)) : 1.9);
      hero.setPuffScale(a ? 1 : 0.625); hero.setPuffHold(a ? 0 : hero.object.rotation.y);       // IN THE OVERTAKING each dust heap stands with its middle 19 m from the street's middle line (9 m outboard of its hoof; its inner edge 10 to 12 m out), at 0.625 of its size (about 14 to 16 m wide, 14 m tall), and keeps the place ALONG the street where its hoof struck though the horse veers: the street between the legs is kept open
      const k = a ? clamp((HA(u - 0.004) - HA(u + 0.004)) / (0.008 * 12.5 * 96), 0.03, 1.3) : 1;
      hero.setReach(k); hero.setGroundSpeed(k);
      hero.setGallop(a ? 0.6 + (u - 0.25) * 12.5 : 0.1 + (z - 448) / 96); hero.setLeap(a ? 0 : smoothstep(596, 630, z));
    };
    const heroLook = (u) => { const z = HB(Math.max(u, 0.5)); return _poi2.set(0, leapY(z) + 54, z); }, _poi2 = V3(0, 0, 0), _poi3 = V3(0, 0, 0), _poi4 = V3(0, 0, 0), _poi5 = V3(0, 0, 0), _poi6 = V3(0, 0, 0), _poi7 = V3(0, 0, 0), _poi8 = V3(0, 0, 0);
    // where on the route (u) the lens is at a place z of the street: the route runs up +Z all the way
    const uAt = (z) => { let a = 0, b = 1; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (camZ(m) < z) a = m; else b = m; } return (a + b) / 2; };
    const U_GATE0 = uAt(RULE2 - 43), U_GATE1 = uAt(RULE2 + 3);       // from 40 m before the second Rule's near face to its far face

    // ---- the sheet itself: paper all round (sky, street and distance are one unprinted stock)
    const paperMat = new THREE.ShaderMaterial({
      uniforms: style, side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
        if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: `${STYLE_GLSL}${STYLE_FRAG_GLSL} varying vec3 vD;
        void main(){ vec3 d = vD / max(length(vD), 1e-4); gl_FragColor = vec4(pbPaper(d.xy * 260. + d.z * 90.), 1.); }` });
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(50, 2), paperMat);
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);

    const parts = [];          // { update(dt, time, camera, u, cz) } of every piece added below
    // ---- the street and its fronts
    const matStatic = inkMaterial(style, { ...FRAG, uniforms: W, starveLift: 0.045 });
    const BT = makeBuilder();
    const town = await buildTown(BT, rng.fork('town'), Y);
    const townMesh = new THREE.Mesh(await finish(BT, Y), matStatic); townMesh.frustumCulled = false; scene.add(townMesh);
    await Y();
    // ---- the pack: the citizens on their wheels (a near cast in full bone, a far pack in few), each under a hat
    const packMat = (w0, len, head) => inkMaterial(style, { ...FRAG, vertexPre: PACK_PRE, vertexMove: PACK_MOVE, starveLift: 1, uniforms: { ...W, uWin: { value: new THREE.Vector3(w0, len, head) } } });
    const matNear = packMat(-30, 92, 1.5), matFar = packMat(62, 240, 1.3);      // the citizens never starve: a hat is never a grey hat
    const prng = rng.fork('pack');
    const nNear = Math.round(46 * (detail < 1 ? 0.9 : 1)), nFar = Math.round(clamp(204 * density, 166, 222) * (detail < 1 ? 0.66 : 1));
    const lane = (keep = 2.3) => { for (;;) { const x = prng.range(-11.4, 11.4); if (Math.abs(x) < keep || (x > 2.9 && x < 5.8)) continue; return x; } };   // the near pack leaves the leads their lanes
    const hatBag = cast === 'town' ? [0, 0, 0, 2, 2, 3, 3, 5, 5, 6, 6, 1, 4] : [1, 1, 1, 1, 4, 4, 4, 6, 6, 0, 3, 5];
    const rows = [];
    for (let i = 0; i < nNear + nFar; i++) {
      const near = i < nNear;
      rows.push({ near, x: lane(near ? 3.6 : 2.3), off: near ? prng.range(-30, 62) : prng.range(62, 302), k: prng.range(0.85, 0.95), seed: prng(), hat: prng.pick(hatBag),
        yaw: prng.chance(0.1) ? prng.sign() * prng.range(1.75, 2.2) : prng.range(-0.25, 0.25), arm: prng.chance(0.05) ? 1 : 0, toss: 0, size: prng.range(0.95, 1.08) });
    }
    // one near citizen in three grins back over a shoulder, turned toward the middle of the street (toward us)
    for (const r of rows) if (r.near) { const h = (r.seed * 7.13) % 1; r.yaw = h < 0.34 ? -Math.sign(r.x) * (1.75 + 0.45 * ((r.seed * 31.7) % 1)) : (h - 0.67) * 0.5; }
    // THE LEADS: each sheet brings its own two or three citizens past the lens. A lead is set by the still it is made
    // for (u), where it rides then (x, metres ahead) and its speed share k < 1, so it comes up out of the pack ahead,
    // passes at arm's length three-quarters on, and drifts back out of the frame as we thread forward: no figure
    // sits in the same place twice. (+x is port, the left of the picture.)
    const LEADS = [
      { u: 0.02, x: -2.45, r: 4.3, k: 0.88, hat: 1, yaw: 2.45, size: 1.05 },             // the charro, grinning back over his shoulder
      { u: 0.02, x: 4.1, r: 6.4, k: 0.84, hat: 0, yaw: -0.12 },                          // a bowler from behind: spine, ribs, pelvis
      { u: 0.08, x: 2.5, r: 3.9, k: 0.87, hat: 2, yaw: -2.2, arm: 1, size: 1.06 },       // the top hat, holding it on, grinning back
      { u: 0.08, x: -3.5, r: 7.2, k: 0.9, hat: 4, yaw: 0.2 },
      { u: 0.16, x: -2.6, r: 7.5, k: 0.9, hat: 3, yaw: 1.9 },
      { u: 0.43, x: 2.35, r: 4.7, k: 0.93, hat: 6, yaw: -2.25, size: 1.15 },              // the grand lady under her plumes. Her k is a CLEARANCE, said
      // plainly: the lens climbs out of the street just past her still. At her first k of 0.87 it rose by her brim at 1.3 to 1.6 m and her plumes
      // smeared the left of the picture. At 0.93 she falls back more slowly and it passes her brim at 2.4 to 2.6 m (a rare edition's doubled hat: 2.26 m).
      { u: 0.43, x: -3.1, r: 8.0, k: 0.9, hat: 5, yaw: 0.15 },
      { u: 0.52, x: -2.7, r: 4.5, k: 0.88, hat: 3, yaw: 2.3 },                           // a boater beside the tram
      { u: 0.61, x: 2.45, r: 4.3, k: 0.88, hat: cast === 'town' ? 2 : 1, yaw: -2.1, arm: cast === 'town' ? 1 : 0, size: 1.05 },
      { u: 0.7, x: -2.5, r: 4.1, k: 0.88, hat: 5, yaw: 2.3, size: 1.05 },                // the kepi, with the bone dog at our other side
      { u: 0.79, x: 2.5, r: 4.4, k: 0.88, hat: 3, yaw: -2.15, toss: 0.25 },                // the boater; 0.25 marks him for the swing wide in PACK_MOVE (neither a sprinter nor tossed)
      { u: 0.79, x: -3.3, r: 8.5, k: 0.9, hat: 6, yaw: 0.25 },
      { u: 0.94, x: -1.7, r: 12.5, k: 0.9, hat: 1, yaw: 0.1, toss: -1 },                  // the three sprinters: they ride on up the last ramp and through the ring ahead of us
      { u: 0.94, x: 1.6, r: 16.5, k: 0.9, hat: 0, yaw: -0.1, toss: -1 },
      { u: 0.94, x: -0.4, r: 21.5, k: 0.9, hat: 2, yaw: 0.05, arm: 1, toss: -1 },
    ];
    LEADS.forEach((L, i) => { const z = camZ(L.u); Object.assign(rows[i], { x: L.x, off: L.r + (1 - L.k) * z, k: L.k, hat: L.hat, yaw: L.yaw, arm: L.arm || 0, toss: L.toss || 0, size: L.size || 1 }); });
    const DOG_LEADS = [{ u: 0.02, x: 2.3, r: 9.5, k: 0.94, size: 1.3 }, { u: 0.79, x: -2.3, r: 3.0, k: 0.92, size: 1.3 }, { u: 0.16, x: 3.4, r: 6, k: 0.93, size: 1.3 }, { u: 0.43, x: -3.7, r: 9.5, k: 0.93, size: 1.3 }];
    {                                                           // the dozen under the fore hooves at u 0.2 (they land 80 m ahead of us, in the far pack)
      const z2 = camZ(0.25), hoof = HA(0.25) - 33.5 - z2; let t = 0;
      for (const [i, r] of rows.entries()) {
        if (i < LEADS.length || t >= 12) continue;
        const w0 = r.near ? -30 : 62, wl = r.near ? 92 : 240, rel = ((r.off + z2 * r.k - z2 - w0) % wl + wl) % wl + w0;
        if (rel > hoof - 18 && rel < hoof + 14) { r.toss = ++t; r.x = (t % 2 ? 1 : -1) * prng.range(5.5, 12); }
      }
    }
    const BRh = makeBuilder(); await buildRider(BRh, prng, true, Y); await Y();
    const geoNear = await finish(BRh, Y, true);
    const BRl = makeBuilder(); await buildRider(BRl, prng, false, Y); await Y();
    const geoFar = await finish(BRl, Y, true);
    scene.add(instanced(geoNear, rows.filter((r) => r.near), matNear), instanced(geoFar, rows.filter((r) => !r.near), matFar));
    const hatSets = [], FAR_RNG = Object.assign(() => 0.5, { range: (a, b) => (a + b) / 2 });
    for (let h = 0; h < 7; h++) {
      const BH = makeBuilder(); buildHat(BH, h, prng); await Y();
      const BHf = makeBuilder(); buildHat(BHf, h, FAR_RNG, true); BHf.hullFrom = [];       // the far pack's hats: cut in fewer triangles, and they carry no white line
      const g = await finish(BH, Y, true), gf = await finish(BHf, Y, true);
      const rn = rows.filter((r) => r.hat === h && r.near), rf = rows.filter((r) => r.hat === h && !r.near);
      if (rn.length) { scene.add(instanced(g, rn, matNear)); hatSets.push([g, rn, true]); }
      if (rf.length) { scene.add(instanced(gf, rf, matFar)); hatSets.push([gf, rf, false]); }
      await Y();
    }
    if (weather === 'rain') {                                   // riders under black umbrellas
      const BU = makeBuilder(); buildHat(BU, 7, prng); const g = await finish(BU, Y, true);
      scene.add(instanced(g, rows.filter((r, i) => r.near && i % 3 === 1), matNear), instanced(shareGeo(g), rows.filter((r, i) => !r.near && i % 3 === 1), matFar));
    }
    parts.push({ update(dt, time, camera, u) { W.uToss.value = clamp((u - 0.234) / 0.1, 0, 1); } });
    // ---- the Rules, the border gate and its falling corner, the ring, the flakes
    W.uBurst = { value: new THREE.Vector4(0, 0, 0, 0) }; W.uShake = { value: new THREE.Vector4(0, 0, 0, 0) };
    const matRule = inkMaterial(style, { ...FRAG, fragPost: WHITE + GHOST_IN, uniforms: W, starveLift: 0.03 });
    const BR = makeBuilder(), BC = makeBuilder(), grng = rng.fork('rules');
    buildRules(BR, grng); await Y(); buildGate(BR, BC, grng); await Y();
    const ruleMesh = new THREE.Mesh(await finish(BR, Y), matRule); ruleMesh.frustumCulled = false; scene.add(ruleMesh);
    const corner = new THREE.Mesh(await finish(BC, Y), matRule); corner.frustumCulled = false; scene.add(corner);
    const BG = makeBuilder(); buildRing(BG, grng); await Y();
    const ring = new THREE.Mesh(await finish(BG, Y), matRule); ring.frustumCulled = false; scene.add(ring);
    { const e = path.end, t = path.endTangent; ring.position.copy(e); ring.lookAt(e.x + t.x, e.y + t.y, e.z + t.z); }
    const nFl = Math.round(600 * detail), fA = new Float32Array(nFl * 4), fB = new Float32Array(nFl * 4);
    for (let i = 0; i < nFl; i++) {
      if (i % 120 === 119) await Y();
      const g = i < nFl * 0.72 ? i % 4 : 4 + (i % 3), sx = grng.sign();
      if (g < 4) {
        const a = grng.range(0, Math.PI), r = 30 * Math.sqrt(grng()), x = clamp(Math.cos(a) * r, -13, 13), y = clamp(2.5 + Math.sin(a) * r, 0.3, 29.5);
        if (g < 2) {         // the first Rule's flakes: born on its two skins, each let go as its skin's hole reaches it
          // A flake of the FAR skin of stored size over 0.948 (1.0 m across to a tenth of a millimetre: the very test, on the very number, by which FLAKE_MOVE throws
          // it outward) is not born
          // within r0 m sideways of the flown line, by the law the second Rule's flakes have below. The lens overtakes a far-skin flake let go before it reaches
          // the skin, mostly within ten metres of route, and one born beside the line had not flown clear by then (on seeds 1 to 400 at detail 1, 59 of them came
          // under 2.0 m of the lens in the picture, the nearest 0.86 m). Now it is clear BY PLACE: born r0 m out or more, and thrown outward from there. Its share of release is that of the place it is born at, so it is
          // still let go as the hole reaches it. The same draws, in the same order (the size is drawn after x, so x is mapped once the size is known). Smaller
          // flakes and all of the near skin's are as they were, to the bit. (The near skin has no such law by place: its large flakes are clear by count only.)
          const hs = grng(), sz = grng.range(0.35, 1.5), r0 = 4;
          const xb = g === 1 && Math.fround(sz) > Math.fround(0.948) ? (x < 0 ? -1 : 1) * (r0 + Math.abs(x) * (13 - r0) / 13) : x;
          fA.set([xb, y, RULE1 + (g % 2 ? 3 : -3), g], i * 4);
          fB.set([hs, Math.min(0.97, (Math.hypot(xb, y - 2.5) / 34) ** 2), sz, g % 2 ? 0.9 : 9], i * 4);
        } else {            // the second Rule's flakes leave the bar, and none is born within r0 m of the flown line: they are clear of it BY PLACE (the same draws, in the same order)
          const r0 = 4, xb = (x < 0 ? -1 : 1) * (r0 + Math.abs(x) * (13 - r0) / 13), yb = BAR_Y0 + 0.3 + (y / 29.5) * (BAR_Y1 - BAR_Y0 - 0.6);
          fA.set([xb, yb, RULE2 + (g % 2 ? 3 : -3), g], i * 4);
          fB.set([grng(), Math.min(0.97, (Math.hypot(xb, yb - BAR_YC) / 34) ** 2), grng.range(0.35, 1.5), g % 2 ? 0.9 : 9], i * 4);
        }
      } else if (g === 6) {                                   // off the broken end of the border's top rule
        fA.set([grng.range(-22, -5), grng.range(19, 33), GATE_Z + sx * 1.2, g], i * 4);
        fB.set([grng(), grng.range(0, 0.6), grng.range(0.5, 1.6), 4], i * 4);
      } else {
        fA.set([sx * (HALF_W - 0.1), grng.range(3, 14), (g === 4 ? 216 : 482) + grng.range(-30, 30), g], i * 4);      // the fronts beside each hoof fall
        fB.set([grng(), grng.range(0, 0.5), grng.range(0.25, 0.9), 3.2], i * 4);
      }
    }
    const fg = new THREE.InstancedBufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.3, 0, 0.55, -0.2, 0, 0.1, 0.5, 0, -0.5, -0.3, 0, 0.1, 0.5, 0, -0.35, 0.3, 0], 3));
    fg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    fg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(12), 2));
    fg.setAttribute('aMark', new THREE.Float32BufferAttribute(new Float32Array(24).map((v, i) => (i % 4 === 0 ? 2 : 0.5 * (i % 4 === 3))), 4));
    fg.setAttribute('aAux', new THREE.Float32BufferAttribute(new Float32Array(12), 2));
    fg.setAttribute('fA', new THREE.InstancedBufferAttribute(fA, 4)); fg.setAttribute('fB', new THREE.InstancedBufferAttribute(fB, 4));
    fg.instanceCount = nFl;
    const flakes = new THREE.Mesh(fg, inkMaterial(style, { ...FRAG, vertexPre: FLAKE_PRE, vertexMove: FLAKE_MOVE, starveLift: 1, uniforms: W, side: THREE.DoubleSide }));
    flakes.frustumCulled = false; scene.add(flakes); await Y();
    const shakeZ = [0, 0];
    parts.push({ update(dt, time, camera, u, cz) {
      const b = W.uBurst.value;
      const fr = (R) => (clamp((cz - (R - 42)) * 0.5, 0, 34) / 34) ** 2;       // the near skin's hole grows as the pack ahead of us goes in
      // The far skin of the first Rule begins to open when the lens is 3.91 m before it (RULE1 - 0.95, just after the sheet has changed, as
      // the second Rule's does; it was RULE1 + 0.3, and what was left of the skin stood 1.5 to 2.4 m before the lens as it opened).
      // A CLEARANCE, said plainly, by the flight's own place.
      // The second Rule is a bar the pack rides UNDER: its near skin tears round the flown line as the lens comes, from TEAR_Z0 (its law is said there).
      b.set(fr(RULE1), clamp((cz - (RULE1 - 0.95)) / 22, 0, 1), (clamp((cz - TEAR_Z0) * TEAR_K, 0, 34) / 34) ** 2, clamp((cz - (SHEET3 + 0.05)) / 14, 0, 1) ** 2);      // the far skin opens just after the sheet has changed, its hole 2.43 m a metre of route
      W.uShake.value.set(clamp((u - 0.24) / 0.08, 0, 1), clamp((u - 0.722) / 0.08, 0, 1), clamp((u - 0.85) / 0.1, 0, 1), 0);
      const t = clamp((u - 0.85) / 0.15, 0, 1);              // the hind hooves cross the top rule at u 0.88: the corner goes
      corner.position.set(-6 - t * 9, 19 + t * 9 - t * t * 27.5, GATE_Z + t * 4); corner.rotation.z = t * (2 - t) * 1.1; corner.rotation.x = t * 0.5;
    } });
    // ---- the tram: overtakes to port in the second sheet, holds abeam, runs on to the terminus by the gate
    const BTr = makeBuilder(); await buildTram(BTr, rng.fork('tram'), Y); await Y();
    const tram = new THREE.Mesh(await finish(BTr, Y), matStatic); tram.frustumCulled = false; scene.add(tram);
    const offT = keyed([[0.43, -60], [0.47, -14], [0.52, 28], [0.565, 40], [0.625, 46], [0.66, 62], [0.71, 150]]);   // it passes under us as we rise and runs on ahead, in view from above
    // The street before the entry (z under 0) is no place for it: while this world is the next one, the opening's camera comes down
    // that stretch far off the middle, and came through its roof there. A CLEARANCE, said plainly: the tram is not in the street until
    // the whole of it (5.95 m to its tail) is past the entry; it joins there 60 m behind the lens of the flight, and rides as before.
    parts.push({ update(dt, time, camera, u, cz) { const tz = Math.min(cz + offT(u), 626); tram.position.set(4.3, tz < 6 ? -4000 : 0, tz); } });
    // ---- poles, wires, trees, magueys, onlookers, smoke (they sway and wave on the clock)
    const matSway = inkMaterial(style, { ...FRAG, vertexPre: SWAY_PRE, vertexMove: SWAY_MOVE, starveLift: 0.06, uniforms: W });
    const BF = makeBuilder();
    const fRange = await buildFurniture(BF, rng.fork('furniture'), town, { magueys: Math.round(40 * Math.min(1, density)), onlookers: Math.round(60 * detail * Math.min(1.2, density)), smokes: weather === 'wind' ? 20 : 12, dust: weather === 'wind' ? 14 : 0 }, Y);
    const furniture = new THREE.Mesh(await finish(BF, Y), matSway); furniture.frustumCulled = false; scene.add(furniture); await Y();
    // ---- bone dogs among the wheels (one runs at our side through the last sheet)
    const BD = makeBuilder(); buildDog(BD, prng); await Y(); const dogGeo = await finish(BD, Y, true);
    const nDog = cast === 'country' ? 22 : 14, dogs = [];
    for (let i = 0; i < nDog; i++) dogs.push({ x: lane(3.6), off: prng.range(-30, 62), k: prng.range(0.9, 0.99), seed: prng(), yaw: 0, arm: 0, toss: 0, size: prng.range(1.05, 1.4) });
    DOG_LEADS.forEach((L, i) => Object.assign(dogs[i], { x: L.x, off: L.r + (1 - L.k) * camZ(L.u), k: L.k, size: L.size }));
    scene.add(instanced(dogGeo, dogs, matNear)); await Y();
    // ---- the air: loose penny sheets, and in the rain edition the engraver's rain
    const nSheet = Math.round((weather === 'wind' ? 640 : 400) * detail), nRain = weather === 'rain' ? Math.round(340 * detail) : 0, nD = nSheet + nRain;
    const dA = new Float32Array(nD * 4), dB = new Float32Array(nD * 4), dM = new Float32Array(nD * 4), arng = rng.fork('air');
    for (let i = 0; i < nD; i++) {
      if (i % 160 === 159) await Y();
      const rain = i >= nSheet, sz = arng.range(0.7, 1.5);
      dA.set([arng.range(-13, 13), arng.range(0, 40), arng.range(0, 200), arng()], i * 4);
      if (rain) { dB.set([1, 0, 24, 0], i * 4); dM.set([16, 0.3, arng.range(2.2, 3.6), 0.25], i * 4); }
      else { dB.set([0, weather === 'wind' ? arng.range(7, 13) : arng.range(1.5, 4), weather === 'wind' ? 0.3 : arng.range(0.3, 1.1), arng.range(0.3, 0.9)], i * 4); dM.set([10, 0.5 * sz, 0.66 * sz, i % 5 === 2 ? 4.25 : 0.25], i * 4); }
    }
    const dg = new THREE.InstancedBufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    dg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    dg.setAttribute('uv', new THREE.Float32BufferAttribute([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5], 2));
    dg.setAttribute('aAux', new THREE.Float32BufferAttribute(new Float32Array(8), 2));
    dg.setAttribute('aMark', new THREE.InstancedBufferAttribute(dM, 4));
    dg.setAttribute('dA', new THREE.InstancedBufferAttribute(dA, 4)); dg.setAttribute('dB', new THREE.InstancedBufferAttribute(dB, 4));
    dg.setIndex([0, 1, 2, 0, 2, 3]); dg.instanceCount = nD;
    const air = new THREE.Mesh(dg, inkMaterial(style, { ...FRAG, vertexPre: DRIFT_PRE, vertexMove: DRIFT_MOVE, starveLift: 1, side: THREE.DoubleSide,
      uniforms: { ...W, uBox: { value: new THREE.Vector3(-6, weather === 'rain' ? 26 : 17, 150) } } }));
    air.frustumCulled = false; scene.add(air); await Y();
    // ---- the wet roller: once per sheet a band 12 m wide runs down the fronts toward us and the grooves clog
    const rollZ = keyed([[0.05, 150], [0.17, 6], [0.5, 150], [0.62, 6], [0.71, 140], [0.8, 6]]);
    parts.push({ update(dt, time, camera, u, cz) {
      const k = smoothstep(0.05, 0.07, u) * (1 - smoothstep(0.15, 0.17, u)) + smoothstep(0.5, 0.52, u) * (1 - smoothstep(0.6, 0.62, u)) + smoothstep(0.71, 0.725, u) * (1 - smoothstep(0.785, 0.8, u));
      style.uRoller.value.set(k, cz + rollZ(u), 6, 0);
    } });
    // ---- the rare double strike: through the second sheet every black shape of the street carries a second,
    // starved impression 0.4 m to starboard, until the second Rule knocks the press true
    if (rare) {
      const GH = '\n  p.x -= uShift; p.y -= step(uShift, 0.001) * 3000.;\n';
      const ghost = (pre, move, extra = {}) => {
        const m = inkMaterial(style, { ...FRAG, vertexPre: pre, vertexMove: (move || '') + GH, starveLift: -1, fragPost: WHITE + ' if (ink < 0.5) discard;', uniforms: { ...W, ...extra } });
        m.depthWrite = false; m.depthTest = false; return m;       // struck first: every true impression prints over it, so it shows only on bare paper
      };
      const gStatic = ghost('uniform float uShift;', ''), gSway = ghost(SWAY_PRE + 'uniform float uShift;', SWAY_MOVE);
      const gNear = ghost(PACK_PRE + 'uniform float uShift;', PACK_MOVE, { uWin: matNear.uniforms.uWin }), gFar = ghost(PACK_PRE + 'uniform float uShift;', PACK_MOVE, { uWin: matFar.uniforms.uWin });
      const fi = furniture.geometry.index.array, [i0, i1, i2, i3] = fRange, gi = new fi.constructor(i0 + (i2 - i1) + (fi.length - i3));
      gi.set(fi.subarray(0, i0), 0); gi.set(fi.subarray(i1, i2), i0); gi.set(fi.subarray(i3), i0 + i2 - i1);      // the second strike takes the street's furniture and the onlookers, not the last sheet's magueys
      const fGhost = new THREE.BufferGeometry();
      for (const k of ['position', 'normal', 'uv', 'aMark', 'aAux', 'aBone']) fGhost.setAttribute(k, furniture.geometry.getAttribute(k));
      fGhost.setIndex(new THREE.BufferAttribute(gi, 1)); fGhost.boundingSphere = furniture.geometry.boundingSphere;
      for (const [geo, mat, parent] of [[townMesh.geometry, gStatic, scene], [fGhost, gSway, scene], [tram.geometry, gStatic, tram]]) {
        const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -5; parent.add(m);
      }
      for (const [g, rs, near] of hatSets) { if (!near) continue; const m = instanced(shareGeo(g), rs, near ? gNear : gFar); m.renderOrder = -5; scene.add(m); }
      await Y();
      parts.push({ update(dt, time, camera, u, cz) { W.uShift.value = cz > RULE1 - 1 ? 0.4 * (1 - smoothstep(RULE2 - 14, RULE2 - 3, cz)) : 0; } });
    }
    // ---- the country cast's bone mule cart, waiting beyond the second Rule and trotting through the last sheet ahead of us
    if (cast === 'country') {
      const BM = makeBuilder(); buildCart(BM, rng.fork('cart')); await Y();
      const cart = new THREE.Mesh(await finish(BM, Y), matStatic); cart.frustumCulled = false; scene.add(cart);
      const muleMat = inkMaterial(style, { ...FRAG, vertexPre: PACK_PRE, vertexMove: PACK_MOVE, uniforms: { ...W, uCamZ: { value: 0 }, uWin: { value: new THREE.Vector3(-1000, 4000, 1) } } });
      scene.add(instanced(shareGeo(dogGeo), [{ x: -5.6, off: 488.6, k: 1, seed: 0.37, yaw: 0, arm: 0, toss: 0, size: 3.1 }], muleMat));
      parts.push({ update(dt, time, camera, u, cz) { const f = Math.max(0, cz - 440) * 0.8; muleMat.uniforms.uCamZ.value = f; cart.position.set(-5.6, 0, 486 + f); } });
    }
    // ---- the grand lady calavera of the second sheet, leaning over the starboard fronts (always there, far off at first)
    {
      const LZ = 424, seat = new THREE.Object3D();
      seat.position.set(-25, 31, LZ); seat.rotation.order = 'YXZ'; seat.rotation.set(0.3, 2.15, 0); seat.updateMatrixWorld(true);
      const roofAt = (z) => { for (const [s, z0, z1, h] of town.fronts) if (s < 0 && z >= z0 && z < z1) return h; return 12; };
      const L = (x, y, z) => seat.worldToLocal(V3(x, y, z));
      const hands = [LZ + 12, LZ - 11].map((zc) => ({ wrist: L(-18.6, roofAt(zc) + 2.3, zc),
        fingers: [0, 1, 2, 3].map((i) => { const z = zc + (i - 1.5) * 2.1, h = roofAt(z); return [L(-15.8, h + 1.5, z), L(-12.7, h + 0.75, z), L(-11.85, h - 3.4, z + 0.3)]; }) }));
      const BL = makeBuilder(); await buildLady(BL, rng.fork('lady'), Y, hands);
      const uNod = { value: new THREE.Vector4(0, 0, 0, 0) };
      const lady = new THREE.Mesh(await finish(BL, Y), inkMaterial(style, { ...FRAG, vertexPre: LADY_PRE, vertexMove: LADY_MOVE, starveLift: 1, uniforms: { ...W, uNod } }));
      lady.position.copy(seat.position); lady.rotation.copy(seat.rotation); lady.frustumCulled = false; scene.add(lady); await Y();
      parts.push({ update(dt, time, camera, u, cz) {             // she nods to the passing hats and turns to see us go by
        uNod.value.set(0.05 * Math.sin(time * 0.8) + 0.03 * Math.sin(time * 1.9), 0.1 * Math.sin(time * 0.5) - 0.35 * smoothstep(LZ - 60, LZ + 10, cz), 0, 0);
      } });
    }
    // ---- the comet of the last sheet: it stands in the sky of the country end, high to port, and is not there before
    {
      const BK = makeBuilder(), c = V3(270, 262, 1300), ux = V3(-0.94, 0, 0.34), uy = V3(0, 1, 0), w = 640, h = 260;
      const at = (a, b) => c.clone().addScaledVector(ux, (a - 560) * 1.5).addScaledVector(uy, (b - 62) * 1.5);
      quad(BK, at(0, 0), at(w, 0), at(w, h), at(0, h), [20, 0, 0, 0.5], 0, [0, 0, w, h]);
      const comet = new THREE.Mesh(await finish(BK, Y), inkMaterial(style, { ...FRAG, starveLift: 1, uniforms: W, side: THREE.DoubleSide }));
      comet.frustumCulled = false; comet.renderOrder = -8; comet.material.depthWrite = false; scene.add(comet);
      parts.push({ update(dt, time, camera, u, cz) { comet.position.y = cz > SHEET3 ? 0 : -4000; } });
    }
    // ---- THE CHARRO WHO LOOKS OVER THE FIRST RULE: as the horse strides away over us he stands up behind the slab of ink
    // that closes the street, hooks his finger bones over its top and grins at us under a sombrero as wide as the avenue,
    // so the dive has a face to dive at. Before that he is down behind the Rule, out of sight. (A function of u.)
    {
      const BP = makeBuilder(), S = 38, org = V3(0, -24, 275.5), lean = 0.14, cl = Math.cos(lean), sl = Math.sin(lean), top = 30;
      const un = (x, y, z) => { const dx = -(x - org.x), dy = y - org.y, dz = -(z - org.z); return [dx / S, (cl * dy + sl * dz) / S, (-sl * dy + cl * dz) / S]; };
      const arms = [1, -1].map((sx) => [un(sx * 20.5, top + 0.5, 273), un(sx * 9.6, top + 1.8, 267.4)]);
      const fingers = [1, -1].map((sx) => [0, 1, 2, 3].map((j) => { const x = sx * (9.6 + (j - 1.5) * 2.0); return [un(x, top + 1.3, 263.6), un(x, top + 0.75, 261.5), un(x, top - 4.2, 261.3)]; }));
      await buildFigure(BP, rng.fork('peek'), S, { hat: 'sombrero', d: 0.85, legs: false, arms, fingers }, Y);
      place(BP, 0, org, Math.PI, lean);
      setCode(BP, 0, (x, y) => 8 + clamp((y - (top + 2)) / 32, 0, 0.99));
      const peek = new THREE.Mesh(await finish(BP, Y), matSway); peek.frustumCulled = false; scene.add(peek); await Y();
      parts.push({ update(dt, time, camera, u) {
        peek.position.set(0, -72 * (1 - smoothstep(0.272, 0.318, u)), 21 * (1 - smoothstep(0.296, 0.336, u)));
      } });
    }
    // ---- THE LAST SHEET'S FIESTA: strings of pennants across the country end of the street (two black, one from the colour
    // run), a guitarist and a lady in her plumes standing over the fences where we come out of the second Rule, a drummer
    // and a second guitar down the street, and a tuba and a bass drum either side of the border gate.
    {
      const BB = makeBuilder(), brng = rng.fork('band');
      const cast = [
        { S: 9.5, x: 16.5, z: 481, yaw: Math.PI + 0.62, o: { hat: 'sombrero', prop: 'guitar', arms: [[[-0.36, 1.25, 0.1], [0.0, 1.16, 0.3]], [[0.5, 1.4, 0.1], [0.42, 1.7, 0.25]]] } },
        { S: 9.5, x: -16.5, z: 478, yaw: Math.PI - 0.62, o: { hat: 'brim', skirt: true, prop: 'fan', arms: [[[-0.34, 1.22, 0.02], [-0.3, 0.95, 0.2]], [[0.42, 1.3, 0.1], [0.36, 1.62, 0.28]]] } },
        { S: 5.2, x: 15.6, z: 562, yaw: Math.PI + 0.5, o: { hat: 'bowler', prop: 'drum', arms: [[[-0.42, 1.3, 0.1], [-0.36, 1.32, 0.42]], [[0.42, 1.3, 0.1], [0.36, 1.4, 0.42]]] } },
        { S: 5.2, x: -15.6, z: 566, yaw: Math.PI - 0.5, o: { hat: 'sombrero', prop: 'guitar', arms: [[[-0.36, 1.25, 0.1], [0.0, 1.16, 0.3]], [[0.5, 1.4, 0.1], [0.42, 1.7, 0.25]]] } },
        { S: 7.4, x: 16.6, z: 642.5, yaw: Math.PI + 0.3, o: { hat: 'top', prop: 'tuba', arms: [[[-0.4, 1.28, 0.08], [-0.2, 1.1, 0.3]], [[0.45, 1.3, 0.05], [0.3, 1.36, 0.3]]] } },
        { S: 7.4, x: -16.6, z: 642.5, yaw: Math.PI - 0.3, o: { hat: 'bowler', prop: 'drum', arms: [[[-0.42, 1.3, 0.1], [-0.36, 1.32, 0.42]], [[0.42, 1.3, 0.1], [0.36, 1.4, 0.42]]] } },
      ];
      for (const f of cast) {
        const from = BB.pos.length / 3, hgt = 1.95 * f.S;
        await buildFigure(BB, brng, f.S, { d: f.S < 6 ? 0.42 : 0.52, ...f.o }, Y);
        place(BB, from, V3(f.x, 0, f.z), f.yaw, 0.04);
        setCode(BB, from, (x, y) => 6 + clamp(y / hgt, 0, 0.99));
        await Y();
      }
      const strings = [[464, 10.6], [493, 10.4], [520, 12.5], [534, 12], [548, 12.6], [566, 12.2], [590, 12.8], [604, 13], [618, 14.2], [631, 14.8]];
      for (const [z, h] of strings) {
        const s = brng(), pts = [], sag = brng.range(2.0, 2.9), W2 = 13.4, at = (t) => V3(t * W2, h - sag * (1 - t * t), z + 0.8 * Math.sin(t * 2 + s * 6));
        for (let k = 0; k <= 8; k++) pts.push(at(-1 + k / 4));
        const f0 = BB.pos.length / 3;
        tube(BB, 0, pts, 0.035, s, 3);
        for (const sx of [-1, 1]) tube(BB, 0, [V3(sx * W2, 0, at(sx).z), V3(sx * W2, h + 0.5, at(sx).z)], 0.1, s, 4);
        setCode(BB, f0, (x, y) => 0.5 * clamp(1 - Math.abs(x) / W2, 0, 1));
        const np = 12;
        for (let k = 0; k < np; k++) {                                            // pennants: two cut with the comb, one from the colour run
          const t = -1 + (k + 0.5) * 2 / np, a = at(t - 0.062), b = at(t + 0.062), tip = at(t); tip.y -= 2.3 + 0.5 * ((k * 7 + Math.floor(s * 9)) % 3);
          const red = (k + Math.floor(s * 3)) % 3 === 0, mark = red ? [3, 0, 0, s + 4] : [1, 0.28, 1.0, s + k * 0.07], base = BB.pos.length / 3, nz = 1;
          for (const [p, uu, vv, c] of [[a, 0, 0, 0.25], [b, a.distanceTo(b), 0, 0.25], [tip, a.distanceTo(b) / 2, a.y - tip.y, 1.25]]) {
            BB.pos.push(p.x, p.y, p.z); BB.nor.push(0, 0, -nz); BB.uv.push(uu, vv); BB.mark.push(mark[0], mark[1], mark[2], Math.round(mark[3] * 1024) / 1024); BB.aux.push(0, 1); BB.bone.push(c * clamp(1 - Math.abs(p.x) / W2 + 0.3, 0, 1));
          }
          BB.idx.push(base, base + 1, base + 2, base, base + 2, base + 1);
        }
        await Y();
      }
      const band = new THREE.Mesh(await finish(BB, Y), matSway); band.frustumCulled = false; scene.add(band); await Y();
    }
    // @@PIECES

    const size = new THREE.Vector2();
    let sheet = -1;
    const update = (dt, time, camera, u) => {
      const cz = camZ(u);
      style.uTime.value = time; W.uCamZ.value = cz; W.uCamY.value = _p.y; W.uU.value = u;
      const s = cz < RULE1 - 1 ? 0 : cz < SHEET3 ? 1 : 2;       // the paper changes while the lens is inside a Rule: in the first the inner far skin's cuts are in the frame and change with it; in the second (SHEET3) no face of the bar in the frame carries paper
      if (s !== sheet) { sheet = s; style.uPaper.value.copy(papers[s]); scene.background.copy(papers[s]); }
      W.uCone.value = 1 - smoothstep(0.17, 0.25, u) + smoothstep(0.74, 0.8, u);
      heroAt(u); hero.update(dt, time, camera);
      for (const p of parts) p.update(dt, time, camera, u, cz);
    };
    update(0, 0, null, 0);
    return {
      scene, path, duration: 40,
      // speeds of the brief over the mean: 15 m/s in, 11 under the ribs, 20 down the drop, 18 with the tram, 17 out
      pace: (u) => 0.9 - 0.28 * smoothstep(0.22, 0.26, u) * (1 - smoothstep(0.32, 0.35, u)) + 0.4 * smoothstep(0.34, 0.37, u) * (1 - smoothstep(0.4, 0.44, u))
        + 0.12 * smoothstep(0.43, 0.48, u) * (1 - smoothstep(0.5, 0.55, u)) - 0.24 * smoothstep(0.53, 0.58, u) * (1 - smoothstep(0.63, 0.68, u)) + 0.1 * smoothstep(0.66, 0.72, u),   // and linger under the grand lady
      camera: { fov: 64, near: 0.25, far: 3000, lookAhead: 26, sway: 0.5, bank: 0.3, nearThrough: 0.3 },
      pois: [{ at: (time, u) => _poi4.set(30, 4.5, camZ(u) + 24), from: 0.035, to: 0.125, weight: 0.75 },     // the top hat passes to port: turn to him and the fronts behind him, the horse to one side
        { at: (time, u) => _poi.set(0, 44, camZ(u) + 150), from: 0.12, to: 0.21, weight: 0.3 },      // over the hats: lift the gaze to the whole horse
        { at: (time, u) => _poi3.set(0, 36, camZ(u) + 82), from: 0.2, to: 0.285, weight: 0.5 },     // the reveal: hooves, dust heaps and the street stay in the picture as the path tips up
        { at: (time, u) => _poi7.set(0, 50, 264), from: 0.3, to: 0.39, weight: 0.7 },                 // the charro standing up over the first Rule: the dive has a face to dive at
        { at: (time, u) => _poi5.set(-22, 27, 424), from: 0.455, to: 0.665, weight: 0.72 },         // the grand lady over the starboard fronts
        { at: (time, u) => _poi6.set(0, 0, camZ(u) + 62), from: 0.655, to: 0.735, weight: 0.3 },         // out of the second Rule: look down the country end of the street
        { at: (time, u) => heroLook(u), from: 0.725, to: 0.97, weight: 0.66 },                        // the leap: lift the gaze to the horse over the border
        { at: () => _poi8.set(0, 5, RULE2 + 12), from: U_GATE0, to: U_GATE1, weight: 0.6 }],      // from 40 m before the second Rule's near face to its far face: down to the gateway under it and the pack going through
      portal: { shape: 'circle', radius: 7, color: '#14110F', glow: 0, tilt: true, revealDistance: 240, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update, dispose() { hero.dispose(); },
    };
  },
};
