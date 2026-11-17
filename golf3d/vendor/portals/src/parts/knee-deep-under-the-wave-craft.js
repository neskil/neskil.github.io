// KNEE-DEEP UNDER THE WAVE, part CRAFT (film worlds D): the one small landing craft of our own design and the few
// floating hull panels with their amber beacon: the only made things in a world of water, the measure of the place.
//   buildCraft(ctx, { path, light }) -> { object, uniforms, update(time, s, camera), dispose() }
// DECLARED PACING: the craft flies the world on a course of its own, the law file's craft(s) by metres flown; it
// stands at PLACES.craft until CRAFT_STAGE.lift. Every place, heading and stage here comes from the law. The clock
// moves only what loops: the lamps' blink, the flames' flicker, the ripple rings, the panels' rocking.
// The camera is read only for the allowed kinds: a mirror's and a sheen's direction of view (the glass, the wet
// skin, the rings, the lamp's streak on the water, the craft's image in the water), the air by distance (kdHaze),
// the least size of a thin or small bright thing by a pixel's footprint (flames, lamps, trail), and sprites
// turned to the eye. NOTHING is lettered or marked; there is no figure in or near anything here.
// Everything is made in build; update sets uniforms and one matrix only.
// SIX DRAW CALLS: the craft (hull, glass, bells, pods, legs: one mesh, kinds by vertex), the panels and the float,
// the craft's image in the water (renderOrder 4) and the ripple rings (6): both want to be drawn after the sea's
// surface; the vapour trail (21) and the lights (22, added light): after the wave's see-through spray.
// WHAT A SEED DEALS (one stream, 'knee-deep-under-the-wave:craft:' + seed): five, six or seven panels, which strip of
// the scatter holds which panel and which the float, each panel's size, bend, side up, turn, tilt and rocking.
// There is no rare look.
import * as THREE from 'three';
import { PLACES, SEA, CRAFT_STAGE, craft } from './knee-deep-under-the-wave-law.js';

const S = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const HALF = PLACES.craft.length / 2;     // the hull runs from z = -HALF (nose) to z = +HALF (tail) in its own frame
const BELLY = 2.2;                        // metres of air between the calm water and the standing craft's belly
const NONE = -1000;                       // "this vertex does not fold" (the legs' vertices carry their hinge's height)

// ---- a small builder of merged solids. Each vertex: a place and aK = (kind, u, v, fold). Kinds: 0 white ceramic
// skin, 1 dark heat tiles, 3 strut metal, 4 an engine bell's inside, 5 a panel's skin (its back face is the ribbed
// inside), 6 plain grey. Normals are summed from the faces, so a patch is smooth and two patches meet in an edge.
function makeSolid() {
  const pos = [], kin = [], idx = [], extra = [];
  let tag = null;                          // what the next vertices carry besides (a panel's centre and rocking)
  const vert = (q) => { pos.push(q[0], q[1], q[2]); kin.push(q[3] || 0, q[4] || 0, q[5] || 0, q[6] === undefined ? NONE : q[6]); if (tag) extra.push(...tag); return pos.length / 3 - 1; };
  // a grid of nu by nv quads over f(a, b, i, j) -> [x, y, z, kind, u, v, fold]; wrap: the a direction closes
  function patch(nu, nv, f, wrap = false, flip = false) {
    const base = pos.length / 3, cols = wrap ? nu : nu + 1;
    for (let j = 0; j <= nv; j++) for (let i = 0; i < cols; i++) vert(f(i / nu, j / nv, i, j));
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const A = base + j * cols + i, B = base + j * cols + (i + 1) % cols, C = A + cols, D = B + cols;
      if (flip) idx.push(A, B, C, B, D, C); else idx.push(A, C, B, B, C, D);
    }
  }
  // a tube round the line from p0 to p1 (radii r0, r1), n sides, with closed ends
  function tube(p0, p1, r0, r1, n, kind, fold) {
    const ax = new THREE.Vector3().subVectors(p1, p0).normalize();
    const e1 = new THREE.Vector3(1, 0, 0); if (Math.abs(ax.x) > 0.8) e1.set(0, 0, 1);
    e1.cross(ax).normalize(); const e2 = new THREE.Vector3().crossVectors(ax, e1);
    const at = (a, t, r) => { const c = Math.cos(a * 2 * Math.PI) * r, s = Math.sin(a * 2 * Math.PI) * r, p = new THREE.Vector3().lerpVectors(p0, p1, t);
      return [p.x + e1.x * c + e2.x * s, p.y + e1.y * c + e2.y * s, p.z + e1.z * c + e2.z * s, kind, a, t, fold]; };
    patch(n, 1, (a, b) => at(a, b, b < 0.5 ? r0 : r1), true);
    patch(n, 1, (a, b) => at(a, 0, b < 0.5 ? 0 : r0), true);
    patch(n, 1, (a, b) => at(a, 1, b < 0.5 ? r1 : 0), true);
  }
  function geometry() {
    const n = new Float32Array(pos.length), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let t = 0; t < idx.length; t += 3) {
      const i = idx[t] * 3, j = idx[t + 1] * 3, k = idx[t + 2] * 3;
      a.set(pos[i], pos[i + 1], pos[i + 2]); b.set(pos[j], pos[j + 1], pos[j + 2]).sub(a); c.set(pos[k], pos[k + 1], pos[k + 2]).sub(a); b.cross(c);
      for (const v of [i, j, k]) { n[v] += b.x; n[v + 1] += b.y; n[v + 2] += b.z; }
    }
    for (let v = 0; v < n.length; v += 3) { const l = Math.hypot(n[v], n[v + 1], n[v + 2]) || 1; n[v] /= l; n[v + 1] /= l; n[v + 2] /= l; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(kin, 4));
    if (extra.length) { const e = new THREE.InterleavedBuffer(new Float32Array(extra), 7); g.setAttribute('aC', new THREE.InterleavedBufferAttribute(e, 3, 0)); g.setAttribute('aR', new THREE.InterleavedBufferAttribute(e, 4, 3)); }
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
    return g;
  }
  // every vertex used by the faces from index n0 on is given its hinge by fn (the legs)
  function foldFrom(n0, fn) {
    const seen = new Set();
    for (let t = n0; t < idx.length; t++) { const v = idx[t]; if (seen.has(v)) continue; seen.add(v); const q = [0, 0, 0, 0, 0, 0, 0]; fn(q); kin[v * 4 + 1] = q[4]; kin[v * 4 + 2] = q[5]; kin[v * 4 + 3] = q[6]; }
  }
  return { patch, tube, vert, idx, geometry, foldFrom, tagWith(t) { tag = t; }, count: () => idx.length / 3 };
}

// ---- THE HULL'S SHAPE (our own): a blunt lifting body. t runs 0 (nose) to 1 (tail). A section is a flat belly
// with rounded chines under a boxy arch; the nose is rounded off and its belly sweeps up; the tail is cut square.
const NOSE = (t) => Math.sqrt(Math.max(1 - (1 - Math.min(t / 0.13, 1)) ** 2, 0));          // the nose's rounding
const halfWidth = (t) => 4.5 * (0.40 + 0.60 * Math.pow(t, 0.8)) * NOSE(t);
const archHeight = (t) => 3.5 * (0.30 + 0.70 * S(t / 0.72)) * (1 - 0.10 * S((t - 0.8) / 0.2)) * NOSE(t);
const keelDepth = (t) => (0.7 + 0.3 * t) * NOSE(t);
const bellyRise = (t) => 1.05 * (1 - S(t / 0.32)) ** 2;
const chineY = (t) => bellyRise(t) + (0.7 + 0.3 * t);
// a point of the section at t; phi 0 is the starboard chine, 0.25 the top, 0.5 the port chine, 0.75 the keel
function sectionAt(t, phi) {
  const a = phi * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a), up = s >= 0, e = up ? 0.8 : 0.34;
  const x = halfWidth(t) * Math.sign(c) * Math.pow(Math.abs(c), e);
  const y = chineY(t) + (up ? archHeight(t) : -keelDepth(t)) * Math.pow(Math.abs(s), e);
  return [x, y, -HALF + 2 * HALF * t];
}

function buildHull(solid) {
  const NA = 44, NZ = 30;
  // the girth in metres from the top's middle line (for the panel lines and the window band), by station
  const girth = [];
  for (let j = 0; j <= NZ; j++) {
    const t = j / NZ, g = new Array(NA).fill(0), top = NA / 4;
    for (let d = 1; d <= NA / 2; d++) for (const sgn of [1, -1]) {
      const i = (top + sgn * d + NA) % NA, i0 = (top + sgn * (d - 1) + NA) % NA, p = sectionAt(t, i / NA), q = sectionAt(t, i0 / NA);
      g[i] = g[i0] + sgn * Math.hypot(p[0] - q[0], p[1] - q[1]);
    }
    girth.push(g);
  }
  solid.patch(NA, NZ, (a, b, i, j) => {
    const p = sectionAt(b, a), low = i > NA / 2 && i < NA;
    return [p[0], p[1], p[2], low ? 1 : 0, 2 * HALF * b, girth[j][i]];
  }, true, true);
  // the tail's square face
  solid.patch(NA, 1, (a, b) => { const p = sectionAt(1, a); return b < 0.5 ? [p[0], p[1], p[2], 6] : [0, chineY(1) + 1, HALF, 6]; }, true, true);
  // two engine bells at the tail: a flared bell of dark metal, its inside (kind 4) glows when the engines burn
  for (const bell of BELLS) {
    const r = (b) => 0.42 + 0.63 * (1 - (1 - b) * (1 - b)), z = (b) => HALF - 0.35 + 2.05 * b;
    const ring = (a, rr, zz, kind) => [bell[0] + Math.cos(a * 2 * Math.PI) * rr, bell[1] + Math.sin(a * 2 * Math.PI) * rr, zz, kind, a, zz];
    solid.patch(16, 5, (a, b) => ring(a, r(b), z(b), 3), true, true);                       // outside
    solid.patch(16, 5, (a, b) => ring(a, r(b) - 0.05, z(b), 4), true, false);               // inside
    solid.patch(16, 1, (a, b) => ring(a, r(1) - 0.05 * b, z(1), 3), true, true);            // the lip
    solid.patch(16, 1, (a, b) => ring(a, b < 0.5 ? 0 : r(0) - 0.05, z(0) + 0.02, 4), true, true);   // the throat
  }
  // four small thruster pods: plain grey blisters low on the flanks, two by the nose and two by the tail
  for (const [t, phi] of [[0.2, 0.035], [0.2, 0.465], [0.9, 0.04], [0.9, 0.46]]) {
    const p = sectionAt(t, phi), sx = Math.sign(p[0]);
    solid.patch(10, 6, (a, b) => {
      const lat = (b - 0.5) * Math.PI, cl = Math.cos(lat), an = a * 2 * Math.PI;
      return [p[0] + sx * (0.1 + 0.34 * cl * Math.cos(an)), p[1] + 0.12 + 0.3 * cl * Math.sin(an), p[2] + 0.75 * Math.sin(lat), 6];
    }, true, sx < 0);
  }
  // the tail lamp's small housing on the top of the tail
  { const top = sectionAt(0.965, 0.25); solid.tube(new THREE.Vector3(0, top[1] - 0.05, top[2]), new THREE.Vector3(0, top[1] + 0.2, top[2]), 0.13, 0.1, 8, 6); }
  // four stout landing legs with wide round pads: a sleeve, a piston, a brace, a pad on the sand. Their vertices
  // carry their hinge (aK.yzw): in flight they are drawn in to it, inside the belly
  for (const leg of LEGS) {
    const hinge = new THREE.Vector3(leg.hinge[0], leg.hinge[1], leg.hinge[2]), pad = new THREE.Vector3(leg.pad[0], PAD_Y, leg.pad[2]);
    const fold = (q) => { q[4] = hinge.x; q[5] = hinge.z; q[6] = hinge.y + 0.07; return q; };
    const n0 = solid.idx.length;
    const knee = new THREE.Vector3().lerpVectors(hinge, pad, 0.52), foot = new THREE.Vector3(pad.x, PAD_Y + 0.42, pad.z);
    solid.tube(hinge, knee, 0.3, 0.28, 12, 3);
    solid.tube(knee, foot, 0.19, 0.19, 10, 3);
    solid.tube(new THREE.Vector3(hinge.x * 0.55, hinge.y, hinge.z + (leg.hinge[2] < 0 ? 1.5 : -1.5)), knee, 0.085, 0.085, 6, 3);
    solid.tube(foot, new THREE.Vector3(pad.x, PAD_Y + 0.16, pad.z), 0.3, PAD_R, 20, 3);          // the pad's cone
    solid.tube(new THREE.Vector3(pad.x, PAD_Y + 0.16, pad.z), pad, PAD_R, PAD_R * 0.96, 20, 3);    // and its rim
    solid.foldFrom(n0, fold);
  }
}
// where the bells, the legs and the lamp sit in the craft's own frame (x right, y up from the belly, z aft)
const BELLS = [[-1.8, 2.15], [1.8, 2.15]];
const PAD_Y = -(BELLY + SEA.depth), PAD_R = 0.82;       // the pads stand on the bed: the law's depth under the belly
const LEGS = [
  { hinge: [-1.7, 0, -3.7], pad: [-3.0, 0, -4.4] }, { hinge: [1.7, 0, -3.7], pad: [3.0, 0, -4.4] },
  { hinge: [-3.0, 0, 4.7], pad: [-4.5, 0, 5.4] }, { hinge: [3.0, 0, 4.7], pad: [4.5, 0, 5.4] },
];
const LAMP = (() => { const p = sectionAt(0.965, 0.25); return [0, p[1] + 0.3, p[2]]; })();

// a floating thing's slow rocking about its own middle c (r: two phases, the angle in radians, the rate): the clock
const GLSL_ROCK = /* glsl */`
vec3 kcTurn(vec3 d, vec4 r, float t) {
  float ax = r.z * sin(t * r.w + r.x), az = 0.8 * r.z * sin(t * r.w * 0.83 + r.y);
  float cx = cos(ax), sx = sin(ax), cz = cos(az), sz = sin(az);
  d = vec3(d.x, cx * d.y - sx * d.z, sx * d.y + cx * d.z);
  return vec3(cz * d.x - sz * d.y, sz * d.x + cz * d.y, d.z);
}
vec3 kcRock(vec3 p, vec3 c, vec4 r, float t) { return c + kcTurn(p - c, r, t) + vec3(0., 0.025 * sin(t * r.w * 1.3 + r.x + r.y), 0.); }
`;
// ---- THE SOLIDS (the craft; with ROCK the floating panels and the float): place, normal and aK
const SOLID_VERT = /* glsl */`
attribute vec4 aK; uniform float uFold; uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec4 vK; varying vec3 vL;
#ifdef ROCK
attribute vec3 aC; attribute vec4 aR;
${GLSL_ROCK}
#endif
void main() {
  vec3 p = position, n = normal;
  vL = p; vK = aK;
#ifdef ROCK
  p = kcRock(p, aC, aR, uTime); n = kcTurn(n, aR, uTime);
#else
  if (aK.w > -100.) { p = mix(p, vec3(aK.y, aK.w, aK.z), uFold); vK.yz = vec2(0.); }     // a leg, drawn in to its hinge
#endif
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = mat3(modelMatrix) * n;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SOLID_FRAG = /* glsl */`
//<LIGHT>
uniform float uFold;
varying vec3 vW; varying vec3 vN; varying vec4 vK; varying vec3 vL;
float kcHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1130)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
// lines w metres wide at every p metres of x, as a pixel of this footprint sees them: fine lines fade to their mean
float kcLine(float x, float p, float w) {
  float f = fwidth(x) + 1e-5, d = abs(fract(x / p + 0.5) - 0.5) * p;
  return mix(clamp((0.5 * w + 0.5 * f - d) / f, 0., min(1., w / f)), w / p, smoothstep(0.5 * p, p, f));
}
void main() {
  vec3 N = vN / sqrt(max(dot(vN, vN), 1e-10)); if (!gl_FrontFacing) N = -N;
  vec3 toEye = cameraPosition - vW; float dist = sqrt(max(dot(toEye, toEye), 1e-4)); vec3 V = toEye / dist;
  float k = vK.x, u = vK.y, v = vK.z, f0 = 0.04, gloss = 0.5;
  vec3 alb = vec3(0.4, 0.41, 0.43), glow = vec3(0.);
  if (k < 1.5 || (k > 4.5 && k < 5.5 && gl_FrontFacing)) {
    // WHITE CERAMIC PANELS in courses 1.6 m long, each course half a panel out of step with the last, with fine
    // dark lines between them; every panel has a tone of its own (a few percent)
    float row = floor(u / 1.6), vv = v + 0.55 * mod(row, 2.), fw = fwidth(u) + fwidth(v);
    float lines = max(kcLine(u, 1.6, 0.024), kcLine(vv, 1.1, 0.024));
    float tone = mix(0.5, kcHash(vec2(row, floor(vv / 1.1))), 1. - smoothstep(0.3, 1.0, fw));
    alb = vec3(0.80, 0.795, 0.775) * (0.92 + 0.08 * tone);
    alb = mix(alb, vec3(0.2, 0.2, 0.21), 0.85 * lines);
    if (k < 1.5) {
      // soot of many descents, faint, low on the flanks, in streaks that run aft
      float st = mix(0.5, kcHash(vec2(floor(v * 9.), 7.)), 1. - smoothstep(0.03, 0.1, fwidth(v)));
      alb *= 1. - (0.1 + 0.16 * st) * (1. - smoothstep(0.9, 2.3, vL.y)) * smoothstep(0.5, 3., u);
      // THE WINDOW BAND across the nose: five dark panes in a row, wrapped over the top of the nose
      float pane = floor(v / 0.95 + 0.5), dv = v - 0.95 * pane;
      vec2 q = abs(vec2(u - 2.75 - 0.12 * abs(pane), dv)) - vec2(0.95 - 0.1 * abs(pane), 0.40) + 0.13;
      float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - 0.13, aa = 0.7 * fw + 1e-4;
      float inBand = step(abs(pane), 2.5);
      float frame = inBand * (1. - smoothstep(0.035 - aa, 0.035 + aa, d)), glass = inBand * (1. - smoothstep(-aa, aa, d));
      alb = mix(alb, vec3(0.13, 0.135, 0.14), frame);
      alb = mix(alb, vec3(0.010, 0.012, 0.016), glass); f0 = mix(f0, 0.09, glass); gloss = mix(gloss, 1., glass);
      // THE HEAT TILES of the belly and the chines: small dark tiles, each a shade of its own
      float tile = clamp((k - 0.5) / max(fwidth(k), 1e-4) + 0.5, 0., 1.);
      vec2 tq = vL.xz / 0.34; tq.x += 0.5 * mod(floor(tq.y), 2.);
      float tf = fwidth(vL.x) + fwidth(vL.z), tl = max(kcLine(vL.z, 0.34, 0.02), kcLine(tq.x * 0.34, 0.34, 0.02));
      vec3 dark = vec3(0.040, 0.041, 0.046) * (0.7 + 0.6 * mix(0.5, kcHash(floor(tq)), 1. - smoothstep(0.1, 0.34, tf)));
      alb = mix(alb, mix(dark, vec3(0.014), 0.7 * tl), tile); f0 = mix(f0, 0.03, tile); gloss = mix(gloss, 0.25, tile);
    }
  } else if (k < 3.5) {                       // strut metal; the bells' outside is darker, burnt
    alb = mix(vec3(0.30, 0.29, 0.28), vec3(0.075, 0.07, 0.068), step(${(HALF - 0.4).toFixed(2)}, vL.z)); f0 = 0.45; gloss = 0.3;
  } else if (k < 4.5) {                       // a bell's inside: dark; blue-white when it burns, brightest at the throat
    alb = vec3(0.03); f0 = 0.3; gloss = 0.2;
    glow = vec3(0.55, 0.75, 1.0) * uFold * (0.8 + 4.2 * (1. - smoothstep(${(HALF - 0.4).toFixed(2)}, ${(HALF + 1.7).toFixed(2)}, vL.z)));
  } else if (k < 5.5) {
    // a panel's inside: grey, ribbed: stringers every 0.45 m along it, a frame every 1.3 m across them
    float rib = max(kcLine(v, 0.45, 0.07), kcLine(u, 1.3, 0.09)), sh = max(kcLine(v - 0.06, 0.45, 0.06), kcLine(u - 0.07, 1.3, 0.07));
    alb = vec3(0.27, 0.28, 0.30) * (1. - 0.45 * sh * (1. - rib)) + vec3(0.2) * rib; gloss = 0.2;
  }
  float wet = 1. - smoothstep(0.02, 0.2, vW.y);                       // wet where the water has lapped it
  alb *= 1. - 0.3 * wet; gloss = mix(gloss, 0.9, 0.6 * wet);
  // THE LIGHT: the hole's gold where the skin turns to it (cut by the wave's shade), the sky's cool fill, and a
  // sheen that mirrors the sky (the gold rim against the light)
  float lit = kdLit(vW), ndl = dot(N, KD_HOLE_DIR), ndv = clamp(dot(N, V), 0., 1.), g = 1. - ndv, g2 = g * g;
  vec3 fill = mix(vec3(0.078, 0.092, 0.10), vec3(0.115, 0.155, 0.22), 0.5 + 0.5 * N.y) * 1.35 * (0.7 + 0.3 * lit);
  vec3 col = alb * (fill + KD_GOLD * (1.02 * max(ndl, 0.) + 0.35 * g2 * g * smoothstep(-0.4, 0.4, ndl)) * lit);
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.02; R /= sqrt(dot(R, R));
  vec3 env = mix(KD_DEEP, min(kdSky(R), vec3(3.)), kdOpen(vW, R));
  col = mix(col, env, (f0 + (1. - f0) * g2 * g2 * g) * gloss) + glow;
  if (vW.y < 0.) col = mix(col, vec3(0.045, 0.10, 0.11), clamp(-vW.y * 1.4, 0., 0.75));      // seen through the water
  gl_FragColor = vec4(kdHaze(col, vW), 1.);
}`;

// ---- THE LIGHTS (added light, one mesh): the two flames (a round glow at each bell's mouth and a plume along the
// craft's axis), the white tail lamp, the beacon's amber lamp and its streak on the water. position = a corner
// (-1..1); aCen the middle (in the craft's frame or in the world); aPar = (metres, rides the craft, kind, phase).
const GLOW_VERT = /* glsl */`
attribute vec3 aCen; attribute vec4 aPar;
uniform mat4 uShip; uniform vec4 uGlow;       // uGlow: x the engines' burn, y the clock, z metres a pixel covers at 1 m
uniform vec3 uBeacon; uniform vec4 uBeaconRock;
varying vec3 vUV; varying vec4 vCol; varying vec3 vW;
${GLSL_ROCK}
void main() {
  float kind = aPar.z, T = uGlow.y, str = 1.;
  vec3 C = aPar.y > 0.5 ? (uShip * vec4(aCen, 1.)).xyz : kcRock(aCen, uBeacon, uBeaconRock, T);
  vec3 toEye = cameraPosition - C; float dist = sqrt(max(dot(toEye, toEye), 1e-4)), px = dist * uGlow.z;
  vec3 rt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float flick = 0.9 + 0.1 * sin(T * 31. + aPar.w) * sin(T * 17.3 + 2. * aPar.w);
  vec3 P = C; vec3 tint = vec3(1.);
  if (kind < 0.5) {                           // a flame: never under three pixels across its glow (a pixel and a half its core)
    P = C + (rt * position.x + up * position.y) * max(aPar.x, 3. * px);
    str = uGlow.x * flick; tint = vec3(0.62, 0.80, 1.0);
  } else if (kind < 1.5) {                    // its plume, turned to the eye; thin and long, it fades as it gets finer than a pixel
    vec3 ax = (uShip * vec4(0., 0., 1., 0.)).xyz; float t = 0.5 + 0.5 * position.x;
    vec3 Q = C + ax * t * aPar.x, te = cameraPosition - Q, sd = cross(ax, te);
    float sl = sqrt(max(dot(sd, sd), 1e-8)), w = mix(0.9, 0.3, t), wmin = 0.9 * px;
    P = Q + sd / sl * position.y * max(w, wmin);
    str = uGlow.x * flick * min(1., w / wmin) * smoothstep(0.1, 0.45, sl / sqrt(max(dot(te, te), 1e-8))); tint = vec3(0.45, 0.66, 1.0);
  } else if (kind < 3.5) {                    // a lamp: white at the craft's tail (a slow blink), amber on the float
    float R = max(aPar.x, 2.5 * px), ph = fract(T / (kind < 2.5 ? 2.7 : 1.9) + aPar.w);
    P = C + (rt * position.x + up * position.y) * R;
    str = smoothstep(0., 0.09, ph) * (1. - smoothstep(0.15, 0.36, ph)) * min(1., aPar.x / R);
    tint = kind < 2.5 ? vec3(1.0, 0.97, 0.90) : vec3(1.0, 0.50, 0.10);
  } else {                                    // the amber lamp's streak on the water: where the water mirrors it to this eye
    vec2 d = cameraPosition.xz - C.xz; float D = sqrt(max(dot(d, d), 1e-4)), H = max(cameraPosition.y, 0.5), ph = fract(T / 1.9 + aPar.w);
    float m = D * C.y / (C.y + H), t = 0.5 + 0.5 * position.x; d /= D;
    vec2 q = C.xz + d * m * mix(0.35, 2.2, t) + vec2(-d.y, d.x) * position.y * (0.16 + 0.5 * px + 0.25 * t);
    P = vec3(q.x, 0.03, q.y);
    str = 0.42 * smoothstep(0., 0.09, ph) * (1. - smoothstep(0.15, 0.36, ph)) * (1. - smoothstep(20., 60., m)); tint = vec3(1.0, 0.50, 0.10);
  }
  vUV = vec3(position.xy, kind); vCol = vec4(tint, str); vW = P;
  gl_Position = str > 0.002 ? projectionMatrix * viewMatrix * vec4(P, 1.) : vec4(2., 2., 2., 1.);       // a light that is out is not drawn
}`;
const GLOW_FRAG = /* glsl */`
//<LIGHT>
uniform vec4 uGlow;
varying vec3 vUV; varying vec4 vCol; varying vec3 vW;
void main() {
  float kind = vUV.z, r2 = dot(vUV.xy, vUV.xy), edge = 1. - smoothstep(0.55, 1., r2), b = 0.;
  vec3 col = vCol.rgb;
  if (kind < 0.5) { b = 5.2 * exp(-r2 * 20.) + 0.8 * exp(-r2 * 4.) * edge; col = mix(vec3(0.3, 0.55, 1.0), vec3(0.86, 0.93, 1.0), exp(-r2 * 12.)); }
  else if (kind < 1.5) { float t = 0.5 + 0.5 * vUV.x, it = 1. - t; b = (0.25 + 2.6 * it * it * it) * it * exp(-vUV.y * vUV.y * 4.5) * (1. - vUV.y * vUV.y) * (0.82 + 0.18 * cos(t * 30. - uGlow.y * 9.)); }
  else if (kind < 3.5) { b = 3.4 * exp(-r2 * 22.) + 0.4 * exp(-r2 * 4.) * edge; col = mix(col, vec3(1., 0.95, 0.85), 0.6 * exp(-r2 * 30.)); }
  else { float t = 0.5 + 0.5 * vUV.x, y = vUV.y; b = sin(3.14159 * t) * (1. - y * y) * (1. - y * y) * (0.7 + 0.3 * sin(t * 23. - uGlow.y * 2.3)); }
  col *= b * vCol.a;
  gl_FragColor = vec4(kdHaze(col, vW) - kdHaze(vec3(0.), vW), 1.);       // added light, thinned by the air between
}`;
// ---- THE VAPOUR TRAIL: a ribbon in the world along the last 150 m of the craft's course, turned to the eye, never
// under a pixel and a half wide, fading to nothing. position = (its knot, side -1 / +1, 0)
const TRAIL_N = 26;
const TRAIL_VERT = /* glsl */`
uniform vec3 uTrail[${TRAIL_N}]; uniform vec4 uGlow;
varying vec3 vT; varying vec3 vW;
void main() {
  int i = int(position.x + 0.5); float t = position.x / ${(TRAIL_N - 1).toFixed(1)};
  vec3 C = uTrail[i], tang = uTrail[i < ${TRAIL_N - 1} ? i + 1 : i] - uTrail[i > 0 ? i - 1 : i];
  vec3 te = cameraPosition - C, sd = cross(tang, te); float sl = sqrt(max(dot(sd, sd), 1e-8)), dist = sqrt(max(dot(te, te), 1e-4));
  float w = mix(0.7, 4.2, sqrt(t)), wmin = 0.8 * dist * uGlow.z;
  vec3 P = C + sd / sl * position.y * max(w, wmin);
  vT = vec3(t, position.y, uGlow.x * min(1., w / wmin)); vW = P;
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
}`;
const TRAIL_FRAG = /* glsl */`
//<LIGHT>
varying vec3 vT; varying vec3 vW;
void main() {
  float q = 1. - vT.y * vT.y, t = vT.x;
  float a = q * q * smoothstep(0., 0.06, t) * (1. - t) * (1. - t) * 0.5 * vT.z;
  vec3 col = vec3(0.80, 0.82, 0.85) * (vec3(0.16, 0.2, 0.27) + KD_GOLD * 0.55 * kdLit(vW));
  gl_FragColor = vec4(kdHaze(col, vW), a);
}`;

// ---- THE RIPPLE RINGS round the four legs: flat squares just over the calm water; thin rings spread outward (clock)
// and each tilts the water's mirror a little, so it shows a little more or a little less of the sky: soft, never
// brighter than the water's own glitter. position = the place; aQ = (metres from the leg, a phase)
const RING_VERT = /* glsl */`
attribute vec3 aQ; varying vec3 vQ; varying vec3 vW;
void main() { vQ = aQ; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const RING_FRAG = /* glsl */`
//<LIGHT>
uniform vec4 uRing;                           // x: 1 while the craft stands in the water, y: the clock
varying vec3 vQ; varying vec3 vW;
void main() {
  float r = sqrt(max(dot(vQ.xy, vQ.xy), 1e-6)); vec2 rd = vQ.xy / r;
  float ph = r * 6.4 - uRing.y * 2.0 + vQ.z;                                   // rings a metre apart, spreading at 0.3 m/s
  float env = smoothstep(0.3, 0.7, r) * (1. - smoothstep(1.0, 3.9, r)) * uRing.x * (1. - smoothstep(1.0, 2.6, fwidth(ph)));
  float tilt = cos(ph) * env * 0.085;
  vec3 V = cameraPosition - vW; V /= sqrt(max(dot(V, V), 1e-6));
  vec3 N = vec3(-rd.x * tilt, 1., -rd.y * tilt); N /= sqrt(dot(N, N));
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.01; R /= sqrt(dot(R, R));
  vec3 sky = mix(KD_DEEP, min(kdSky(R), vec3(1.3)), kdOpen(vW, R));
  gl_FragColor = vec4(kdHaze(sky, vW), clamp(abs(tilt) * 9., 0., 0.6));
}`;
// ---- THE CRAFT'S IMAGE IN THE WATER: the hull drawn again, mirrored in the calm sea's level and laid on the water
// along each line of sight (a mirror's direction of view), nearest part in front; it dims as the water's own
// mirror does with the angle of view, and is gone once the craft has lifted
const IMAGE_VERT = /* glsl */`
attribute vec4 aK; uniform float uFold;
varying vec3 vW; varying vec3 vN; varying vec4 vK; varying vec3 vP;
void main() {
  vec3 p = position;
  if (aK.w > -100.) p = mix(p, vec3(aK.y, aK.w, aK.z), uFold);
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = mat3(modelMatrix) * normal; vK = aK;
  vec3 m = vec3(w.x, -w.y, w.z), ray = m - cameraPosition;                     // the mirrored point and the line of sight to it
  float len = sqrt(max(dot(ray, ray), 1e-6)), t = clamp((cameraPosition.y - 0.02) / max(cameraPosition.y - m.y, 1e-3), 0., 1.);
  // nearer parts of the image lie a little nearer the eye on the same line of sight (so the nearest is the one seen):
  // by their distance against the distance of the craft's own middle
  vec3 mid = vec3(modelMatrix[3].x, -modelMatrix[3].y - 2., modelMatrix[3].z) - cameraPosition;
  float pull = 0.1 + 0.9 * clamp(0.5 + (sqrt(dot(mid, mid)) - len) / 28., 0., 1.);
  vP = cameraPosition + ray * max(t - pull / len, 0.);
  gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.);
  // what stands under the water has no image; nor has a bell's inside (its outside stands for it); none once it flies
  if (w.y < 0. || cameraPosition.y < 0.3 || uFold > 0.999 || (aK.x > 3.5 && aK.x < 4.5)) gl_Position = vec4(2., 2., 2., 1.);
}`;
const IMAGE_FRAG = /* glsl */`
//<LIGHT>
uniform float uFold;
varying vec3 vW; varying vec3 vN; varying vec4 vK; varying vec3 vP;
void main() {
  vec3 N = vN / sqrt(max(dot(vN, vN), 1e-10)); if (gl_FrontFacing) N = -N;      // (the mirror turns the faces round)
  float k = vK.x;
  vec3 alb = k < 0.5 ? vec3(0.78) : k < 1.5 ? vec3(0.04) : k < 3.5 ? vec3(0.2) : k < 4.5 ? vec3(0.03) : vec3(0.4);
  vec3 col = alb * (mix(vec3(0.078, 0.092, 0.10), vec3(0.115, 0.155, 0.22), 0.5 + 0.5 * N.y) * 1.3 + KD_GOLD * 1.02 * max(dot(N, KD_HOLE_DIR), 0.) * kdLit(vW));
  vec3 V = cameraPosition - vP; float dist = sqrt(max(dot(V, V), 1e-6)), c = clamp(V.y / dist, 0., 1.), g = 1. - c;
  float mirror = 0.02 + 0.98 * g * g * g * g * g;
  col = mix(vec3(0.05, 0.085, 0.09), col, mirror);                             // the dark water under the craft, and its image in it
  gl_FragColor = vec4(kdHaze(col, vP), 0.9 * (1. - uFold) * (1. - smoothstep(260., 520., dist)));
}`;

export async function buildCraft(ctx, opts) {
  const group = new THREE.Group(); group.name = 'craft';
  const light = opts.light, made = [];
  const U = { ...light.uniforms, uFold: { value: 0 }, uTime: { value: 0 }, uGlow: { value: new THREE.Vector4(0, 0, 0.003, 0) },
    uShip: { value: null }, uBeacon: { value: new THREE.Vector3() }, uBeaconRock: { value: new THREE.Vector4() },
    uTrail: { value: new Float32Array(3 * TRAIL_N) }, uRing: { value: new THREE.Vector4() } };
  const material = (vertexShader, fragmentShader, more = {}) => {
    const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader, fragmentShader: fragmentShader.replace('//<LIGHT>', light.GLSL), ...more });
    made.push(m); return m;
  };
  // the craft's own frame: a group whose matrix update() sets from the law's course
  const ship = new THREE.Group(); ship.matrixAutoUpdate = false; group.add(ship);
  U.uShip.value = ship.matrixWorld;
  const hull = makeSolid(); buildHull(hull);
  const hullGeo = hull.geometry(); made.push(hullGeo);
  const hullMesh = new THREE.Mesh(hullGeo, material(SOLID_VERT, SOLID_FRAG, { side: THREE.DoubleSide }));
  hullMesh.frustumCulled = false; ship.add(hullMesh);
  await ctx.yield();
  // ---- the lights: sprites gathered here, one mesh
  const gl = { pos: [], cen: [], par: [], idx: [] };
  const sprite = (c, metres, rides, kind, phase) => {
    const b = gl.pos.length / 3;
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { gl.pos.push(x, y, 0); gl.cen.push(c[0], c[1], c[2]); gl.par.push(metres, rides, kind, phase); }
    gl.idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3);
  };
  BELLS.forEach((bl, i) => { const c = [bl[0], bl[1], HALF + 1.72]; sprite(c, 11, 1, 1, 1.7 + 2.9 * i); sprite(c, 2.4, 1, 0, 1.7 + 2.9 * i); });
  sprite(LAMP, 0.42, 1, 2, 0);
  // ---- THE FLOATING PANELS and the float, dealt by the part's own stream. The scatter (PLACES.panels) is cut into
  // eight strips along the route; a strip holds one thing (five to seven panels, one float, the rest stay empty) and
  // the strips' places across step by three of eight, so neighbours never touch. The seed deals which strip holds
  // what, each panel's size, bend, side up, turn, tilt and rocking. Nothing here lies nearer the route's plane than the law's PLACES.panels.clear.
  const rng = ctx.core.makeRng(ctx.core.hashSeed('knee-deep-under-the-wave:craft:' + ctx.seed));
  const PP = PLACES.panels, nPanels = 5 + Math.floor(rng() * 3), start = Math.floor(rng() * 8), mirror = rng() < 0.5;
  const order = [0, 1, 2, 3, 4, 5, 6, 7];
  for (let i = 7; i > 0; i--) { const j = Math.floor(rng() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
  const floats = makeSolid();
  for (let n = 0; n <= nPanels; n++) {
    const strip = order[n], d = { len: 2 + 3 * rng(), wid: 1.6 + 1.5 * rng(), bend: 3.6 + 2.6 * rng(), sag: 16 + 16 * rng(), up: rng() < 0.62, yaw: rng() * Math.PI * 2,
      tx: (rng() - 0.5) * 0.2, tz: (rng() - 0.5) * 0.2, jx: rng() - 0.5, jz: rng() - 0.5, p1: rng() * 6.283, p2: rng() * 6.283, amp: 0.02 + 0.025 * rng(), rate: 0.5 + 0.4 * rng(), cut0: 0.35 * rng(), cut1: 0.35 * rng() };
    { const k = Math.min(1, 2.5 / (0.5 * Math.hypot(d.len, d.wid))); d.len *= k; d.wid *= k; }       // no panel reaches further than 2.5 m from its middle
    let across = (start + 3 * strip) % 8; if (mirror) across = 7 - across;
    const isFloat = n === nPanels;
    const ext = isFloat ? 0.6 : 0.5 * Math.hypot(d.len, d.wid) + 0.15;                     // its reach, however it is turned
    const xNear = -PP.clear - ext, xFar = PP.x - PP.across / 2 + ext;
    const cx = Math.min(xNear, Math.max(xFar, xFar + (xNear - 1.2 - xFar) * (across + 0.5 + 0.5 * d.jx) / 8));
    const cz = PP.z - PP.along / 2 + PP.along * (strip + 0.5 + 0.24 * d.jz) / 8;
    if (isFloat) {
      // THE FLOAT: a plain grey drum low in the water, a short mast, a small lamp housing; its amber lamp blinks
      const V = (y, x = 0) => new THREE.Vector3(cx + x, y, cz);
      floats.tagWith([cx, 0, cz, d.p1, d.p2, 0.035, 0.9]);
      floats.tube(V(-0.3), V(0.26), 0.5, 0.5, 14, 6); floats.tube(V(0.26), V(0.44), 0.5, 0.12, 14, 6);
      floats.tube(V(0.4), V(1.86), 0.05, 0.045, 6, 3); floats.tube(V(1.84), V(1.97), 0.1, 0.085, 8, 6);
      U.uBeacon.value.set(cx, 0, cz); U.uBeaconRock.value.set(d.p1, d.p2, 0.035, 0.9);
      sprite([cx, 2.0, cz], 0, 0, 4, d.p1); sprite([cx, 2.0, cz], 0.36, 0, 3, d.p1);
      continue;
    }
    // a panel: a piece of a hull's skin, bent across its width (and a little along it), its ends cut askew. Its
    // front face is the white outside, its back face the ribbed inside; a grey edge shows its thickness.
    const cy = d.up ? 0.07 + 0.5 * d.wid * d.wid / (8 * d.bend) : 0.02;                    // awash: its edges, or its middle, under water
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(d.tx, d.yaw, d.tz + (d.up ? 0 : Math.PI), 'YXZ')).setPosition(cx, cy, cz);
    const v3 = new THREE.Vector3();
    const at = (a, b, drop) => {
      const half = 0.5 - (b < 0.5 ? d.cut0 * (1 - 2 * b) : d.cut1 * (2 * b - 1)) * (a < 0.5 ? 0.5 : 0.15), th = (a - 0.5) * 2 * half * d.wid / d.bend, z = (b - 0.5) * d.len;
      v3.set((d.bend - drop) * Math.sin(th), (d.bend - drop) * Math.cos(th) - d.bend - z * z / (2 * d.sag), z).applyMatrix4(m);
      return [v3.x, v3.y, v3.z, drop ? 6 : 5, b * d.len, (a - 0.5) * d.wid];
    };
    floats.tagWith([cx, cy, cz, d.p1, d.p2, d.amp, d.rate]);
    floats.patch(10, 6, (a, b) => at(a, b, 0));
    const rim = (i, k) => (i < 10 ? at(i / 10, 0, k) : i < 16 ? at(1, (i - 10) / 6, k) : i < 26 ? at(1 - (i - 16) / 10, 1, k) : at(0, 1 - (i - 26) / 6, k));
    floats.patch(32, 1, (a, b, i, j) => rim(i, j * 0.16), true, true);
  }
  await ctx.yield();
  { const g = floats.geometry(); made.push(g);
    const mesh = new THREE.Mesh(g, material(SOLID_VERT, SOLID_FRAG, { side: THREE.DoubleSide, defines: { ROCK: 1 } }));
    mesh.frustumCulled = false; group.add(mesh); }
  await ctx.yield();
  const add = (geometry, mat, order, parent = group) => {
    const mesh = new THREE.Mesh(geometry, mat); mesh.frustumCulled = false; mesh.renderOrder = order;
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
    made.push(geometry); parent.add(mesh); return mesh;
  };
  const see = { transparent: true, depthWrite: false, side: THREE.DoubleSide };
  { const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(gl.pos, 3)); g.setAttribute('aCen', new THREE.Float32BufferAttribute(gl.cen, 3));
    g.setAttribute('aPar', new THREE.Float32BufferAttribute(gl.par, 4)); g.setIndex(gl.idx);
    add(g, material(GLOW_VERT, GLOW_FRAG, { ...see, blending: THREE.AdditiveBlending }), 22); }
  // the vapour trail: a ribbon of TRAIL_N knots, laid in update() from the law's course
  { const pos = [], idx = [];
    for (let i = 0; i < TRAIL_N; i++) { pos.push(i, -1, 0, i, 1, 0); if (i) { const a = 2 * i - 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    add(g, material(TRAIL_VERT, TRAIL_FRAG, see), 21); }
  await ctx.yield();
  // the craft's image in the water (the hull's own geometry again), and the ripple rings round its four legs
  { const mesh = new THREE.Mesh(hullGeo, material(IMAGE_VERT, IMAGE_FRAG, { transparent: true, side: THREE.DoubleSide }));
    mesh.frustumCulled = false; mesh.renderOrder = 4; ship.add(mesh); }
  { const f = new THREE.Vector3(PLACES.craft.nose[0], 0, PLACES.craft.nose[1]).normalize(), r = new THREE.Vector3(-f.z, 0, f.x);
    const pos = [], q = [], idx = [], H = 4.2;
    LEGS.forEach((leg, i) => {
      const cx = PLACES.craft.x + r.x * leg.pad[0] - f.x * leg.pad[2], cz = PLACES.craft.z + r.z * leg.pad[0] - f.z * leg.pad[2], b = pos.length / 3;
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { pos.push(cx + x * H, 0.025, cz + z * H); q.push(x * H, z * H, 1.9 * i); }
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 3)); g.setIndex(idx);
    add(g, material(RING_VERT, RING_FRAG, see), 6); }
  await ctx.yield();

  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), dir = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0), STAND = new THREE.Vector3(PLACES.craft.nose[0], 0, PLACES.craft.nose[1]).normalize();
  const pxH = () => (ctx.renderer && ctx.renderer.domElement && ctx.renderer.domElement.height) || 450;
  const heading = (a, b) => Math.atan2(b.x - a.x, a.z - b.z);
  const trail = U.uTrail.value, TRAIL_FROM = 9, TRAIL_TO = 150;
  function update(time, s, camera) {
    const c = craft(s), fly = c.flying;
    // its nose along its own course (pitching as the course climbs), with a little bank into its turns
    fwd.copy(STAND); let bank = 0;
    if (fly > 0) {
      const a = craft(s - 3), b = craft(s + 3);
      dir.set(b.x - a.x, b.y - a.y, b.z - a.z);
      if (dir.lengthSq() > 1e-6) fwd.lerp(dir.normalize(), fly).normalize();
      const a2 = craft(s - 9), b2 = craft(s + 9), run = Math.hypot(b2.x - a2.x, b2.z - a2.z);
      if (run > 4) { const dh = heading(c, b2) - heading(a2, c); bank = Math.max(-0.4, Math.min(0.4, 240 * Math.atan2(Math.sin(dh), Math.cos(dh)) / run)) * fly; }
    }
    right.crossVectors(fwd, UP); if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize(); up.crossVectors(right, fwd);
    if (bank) { const cb = Math.cos(bank), sb = Math.sin(bank); dir.copy(up); up.multiplyScalar(cb).addScaledVector(right, sb); right.multiplyScalar(cb).addScaledVector(dir, -sb); }
    // the law's y is the height of its lowest point: the pads while it stands, then its belly, its tail when it climbs
    const y = c.y + BELLY * (1 - S((s - CRAFT_STAGE.up) / 60)) + HALF * Math.abs(fwd.y) * fly;
    ship.matrix.set(right.x, up.x, -fwd.x, c.x, right.y, up.y, -fwd.y, y, right.z, up.z, -fwd.z, c.z, 0, 0, 0, 1);
    ship.matrixWorldNeedsUpdate = true;
    U.uFold.value = fly; U.uTime.value = time; U.uRing.value.set(1 - fly, time, 0, 0);
    U.uGlow.value.set(fly, time, 2 / ((camera && camera.projectionMatrix ? camera.projectionMatrix.elements[5] : 1.54) * pxH()), 0);
    // the trail's knots: even metres of the craft's own course behind it (never before its lift-off), stepped back
    // along the law's course by metres flown; a bounded walk
    let k = 0, lx = c.x, ly = c.y, lz = c.z, gone = 0, n = 0;
    const oy = y - c.y + 2.15 * up.y, ox = 2.15 * up.x, oz = 2.15 * up.z;
    while (n < TRAIL_N && k < 320 && s - k > CRAFT_STAGE.lift) {
      k += 2.5; const p = craft(Math.max(s - k, CRAFT_STAGE.lift)), seg = Math.hypot(p.x - lx, p.y - ly, p.z - lz);
      while (n < TRAIL_N) {
        const want = TRAIL_FROM + (TRAIL_TO - TRAIL_FROM) * n / (TRAIL_N - 1);
        if (want > gone + seg) break;
        const f = seg > 1e-6 ? (want - gone) / seg : 0;
        trail[3 * n] = lx + (p.x - lx) * f + ox; trail[3 * n + 1] = ly + (p.y - ly) * f + oy; trail[3 * n + 2] = lz + (p.z - lz) * f + oz; n++;
      }
      gone += seg; lx = p.x; ly = p.y; lz = p.z;
    }
    for (; n < TRAIL_N; n++) { trail[3 * n] = lx + ox; trail[3 * n + 1] = ly + oy; trail[3 * n + 2] = lz + oz; }
  }
  update(0, 0, null);
  return { object: group, uniforms: U, update, dispose() { for (const m of made) m.dispose(); } };
}
