// THE BARQUE STANDING ON LIGHT: hero set piece for the world "milky-sea".
//
// What it is
//   A three-masted iron barque of the 1880s lying becalmed on a sea that is the only light. The hull
//   is a black cut-out (plating strakes whose lower laps catch the glow, rivet rows, rubbing strake,
//   channels and deadeyes, verdigris boot-top, a moving jade lap line at the waterline). Under water
//   she is a rounded, coppered underbody lit by the glowing top of the sea: upper strakes verdigris-
//   jade, the bilge turning from lit to dark round its curve, down to a black bar keel (0.9 m deep), with a cut-away
//   forefoot, a black sternpost and a shaped rudder whose heel hangs below the counter: the form under water is the
//   site's own (seen from under water the lit copper fades between 44 and 60 m from the eye to under a fifth of its
//   light, the site's own term, so the far hull is a dark lens with keel and rudder in profile)
//   (the submerged light term is in SOLID_FS; it needs nothing from the world). Above it
//   eighteen slack sails hang in heavy folds, every foot burning pale jade, every head fading into
//   violet dusk, with seams, tabling, reef bands and pattering reef points, buntlines and patches
//   drawn on the lit canvas; about 190 lines of rigging as antialiased ribbons; red and green
//   sidelights (1 m glows) with wavering 20 m streaks; a pennant at the main truck and an ensign at the gaff; four
//   figures on deck. She rolls 4 degrees each way and the sails slat in time with the roll.
//   THE SECOND COLOUR: four amber lanterns (taffrail, poop, after end of the deckhouse, forecastle head) with
//   lit panes in the deckhouse and skylight. They are real light: msLamps() in LIGHT_GLSL adds warm pools to
//   the deck, houses, mast feet, figures and the feet of the lower sails (uniforms uMsLamp[4], uMsWarm;
//   anchors.lamps gives their places so the world can lay their reflections on its sea).
//
// Local space (identical to the brief's world space: place hero.object at the origin, no rotation)
//   Origin on the waterline amidships, +Y up, BOW TOWARD -Z, starboard +X. The viewer's "front" (+Z)
//   is her stern and port quarter, which is where the camera first meets her. Hull z -28.5..+28,
//   beam 10, rail y 4.8 amidships, keel y -5.5; jib-boom end (0, 9, -46); masts at z -14 / +3 / +19
//   with trucks at 41 / 44 / 36 m. radius 30 is the hull half-length (jib-boom and spanker boom
//   overhang it), height 46.
//
// Structure and motion
//   hero.object            root: stays level. Put it at sea level.
//     hero.ship            child group that rolls, pitches and heaves (hull, spars, sails, rigging, lights)
//     water layer          child that stays on the sea: hull slick, wake band, the mirrored sail stack
//                          and the two sidelight streaks (one mesh, premultiplied blend, renderOrder 2)
//     demo sea             only with opts.sea (default true so the piece can be judged alone)
//   update(dt, time, camera) drives everything. Roll and slatting loop on `time` (ambient motion).
//   hero.setRollPhase(p|null)  take over the roll clock (radians; roll = 4 deg * sin(p)), e.g. to have
//                          her roll toward the lens at the surface break. null = free-running.
//   hero.setGlow(gain)     scales the sea light on every surface (default 1).
//   hero.setGlowWave(amount, phase)  the "phosphorescent wheel" breath: a band of extra light that
//                          travels foot (phase 0) to head (phase 1) up hull, sails and spars.
//   hero.swellHeight(x, z, time) and hero.swellGLSL (float msSwell(vec2 xz), needs uniform uMsTime =
//                          hero.uniforms.uMsTime): the 0.4 m / 70 m / 9 s swell the ship heaves on and
//                          the water layer is draped over. Use the same function in the world's sea so
//                          the slick, the lap line and the sea agree. hero.uniforms holds the shared
//                          uniform objects (uMsTime, uMsGlow, uMsSky, uMsWave, uMsSeaY).
//   hero.toWorld(v)        local rest-pose point -> world, including the current roll and heave.
//
// anchors (local space, rest pose)
//   portalSeat   { position (0, 7.2, -146), normal (0,0,1), radius 7 }: 100 m beyond the jib-boom, facing aft.
//   flyThrough   the brief's line from the surface break to the ring: port side 19 m out, through the
//                slot, then a wide loop: a quarter turn out to 40 m off the starboard beam, aft along her side, a
//                half circle of 11 m radius round the starboard quarter (29 m astern at its furthest, 47 m up) and
//                forward past the mastheads 18 to 12 m to starboard of the centreline. It stays that far out so
//                that from the quarter and all along the top run the ring ahead is seen BESIDE the sail stacks,
//                never behind a mast or on top of one. Then down the starboard side of the headsails and bowsprit
//                (so they are seen as blades, not edge-on) and 55 m level at 7.2 m on the centreline. The loop is
//                exactly as long as the tighter one it replaced (474.8 m with the world's entry leg), so every
//                moment the world keys to u before and after it is where it was.
//                Solids are >= 6 m from it. Thin rigging near it: the main topmast stay passes ~5 m under
//                the slot crossing and the topgallant stay ~6 m over it; the fore royal braces lead to the
//                main topmast head (~9 m over it) and every other fore brace leads down to the rail by the
//                main shrouds (the nearest, the port topgallant brace, is ~6.5 m below the line at x -6).
//   slot         { center (0, 26.5, -5.5), halfGap 7 }: fore canvas at z -14.6 (bellying forward, away),
//                main canvas at z +2.3 bellying up to 0.9 m into the slot as it slats.
//   viewpoints   { underKeel, surfaceBreak, portSide, slot, quarter, top, bowsprit }: composed camera spots.
//   trucks       [fore, main, mizzen] mastheads (birds wheel here); mainTop (0,18,3) and foredeck (0,10,-10) gaze targets.
//   lamps        [taffrail, poop, deckhouse, forecastle] lantern positions (Vector3)
//   sidelights   { port (-4.7, 5.55, -12), starboard (4.7, 5.55, -12) }: on brackets just outboard of the fore
//                channels (the hull is 8.4 m wide there, so the brief's x 5.5 would hang in the air)
//   hawse        port hawse-pipe mouth (tow hawser starts here); stern, stem, jibBoomEnd, keel points;
//   helm, lookout, railHands  where the figures stand; wakeEnd; waterline { length, beam }.
//
// opts
//   palette     brief palette [seaBright, seaMid, laneDark, zenith, duskViolet, black, sidelightRed]
//   sea         true (default): add a simple marbled glowing demo sea out to 3 km. The world passes false.
//   contact     true (default): the water layer (slick, wake, reflection, streaks). false if the world draws its own.
//   courses     'set' | 'clewed' | undefined (seeded: about one seed in four has the courses hauled up in their gear)
//   rollDeg     roll amplitude in degrees (default 4)
//   swell       true/1 (default): heave on hero.swellHeight and drape the water layer over it; false/0: flat sea;
//               a number scales the swell (multiply hero.swellHeight by it yourself)
//   glow        initial light gain (default 1)
//   starboardGreen  hex of the starboard light (default '#2BFF8A')
//
// Size: 62 m hull, 74 m over the spars, 46 m tall. Closest designed pass: 7-8 m from the canvas (slot).
// Cost: about 54k triangles and 5 draw calls (hull+spars 20k, sails 27k, rigging 2.3k, water layer 3.6k, glows),
//   plus 9.5k and 1 for the demo sea; no lights, no textures, about 200-350 ms of build.
// Lighting: none needed. Every material is a ShaderMaterial that computes the brief's upside-down
//   hemisphere itself (ground #7FE0BE x 1.6 from below, sky #0A0A1E x 0.15 from above, occluded inside
//   the bulwarks) and applies scene fog, so scene lights are ignored and the piece looks the same in
//   any scene. Sails reach radiance ~0.9 at the foot (no bloom); only the two sidelights (4) bloom.
//   It wants a black-violet sky behind the mastheads and a sea brighter than the sky beneath.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#B8F2D6', '#5FCBA4', '#124A45', '#07061A', '#3A3158', '#020506', '#FF3B2A'];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SW = { k1x: 0.0826, k1z: -0.0350, w1: 0.698, a1: 0.2, k2x: -0.082, k2z: -0.26, w2: 1.64, a2: 0.05 };
function swellHeight(x, z, t) {
  return SW.a1 * Math.sin(x * SW.k1x + z * SW.k1z - SW.w1 * t) + SW.a2 * Math.sin(x * SW.k2x + z * SW.k2z - SW.w2 * t + 1.3);
}

// ---------------------------------------------------------------- shared GLSL
const SWELL_GLSL = /* glsl */`
uniform float uMsTime, uMsAmp;
float msSwell(vec2 p){
  return uMsAmp*0.2*sin(dot(p, vec2(0.0826,-0.0350)) - 0.698*uMsTime) + uMsAmp*0.05*sin(dot(p, vec2(-0.082,-0.26)) - 1.64*uMsTime + 1.3);
}`;
const LIGHT_GLSL = /* glsl */`
uniform vec3 uMsGlow;    // sea light from below (colour * intensity)
uniform vec3 uMsSky;     // sky fill from above
uniform vec3 uMsWave;    // x amount, y phase foot->head, z gain
uniform vec3 uMsFoot;    // sail colour at the foot
uniform vec3 uMsDusk;    // sail colour at the royals
uniform float uMsSeaY;
float msGain(float y){ float b = (y/46.0 - uMsWave.y)*4.0; return uMsWave.z*(1.0 + uMsWave.x*exp(-b*b)); }
vec3 msUnder(vec3 N, float occ, float y){
  float w = clamp(0.5 - 0.5*N.y, 0.0, 1.0); w = w*w*(3.0 - 2.0*w);
  return uMsGlow*(w*occ*msGain(y)) + uMsSky*(1.0 - w);
}
vec3 msSailCol(float y){
  float a = exp(-max(y - 6.5, 0.0)/19.5);
  return mix(uMsFoot*0.95*a, uMsDusk*1.7, smoothstep(27.0, 42.0, y))*msGain(y);
}
uniform vec4 uMsLamp[4]; // the four deck lanterns, ship space: xyz, strength
uniform vec3 uMsWarm;    // their amber
vec3 msLamps(vec3 P, vec3 N, float wrap){
  vec3 s = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec3 d = uMsLamp[i].xyz - P; float r2 = dot(d, d);
    float nl = dot(N, d)/sqrt(max(r2, 1e-4));
    s += uMsWarm*(uMsLamp[i].w*(wrap + (1.0 - wrap)*max(nl, 0.0))/(1.0 + r2*0.06));
  }
  return s;
}
float msH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float msN(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(msH(i), msH(i + vec2(1.,0.)), f.x), mix(msH(i + vec2(0.,1.)), msH(i + vec2(1.,1.)), f.x), f.y);
}`;

// ---------------------------------------------------------------- hull form
const KEEL = -5.5;
function railY(s) {
  const e = Math.abs(2 * s - 1);
  return 4.8 + 1.3 * Math.pow(e, 2.2) * (s > 0.5 ? 1.3 : 0.8) + 0.45 * (1 - smoothstep(0.249, 0.251, s)) + 0.55 * smoothstep(0.859, 0.861, s);
}
function deckY(s) {
  const r = railY(s);
  if (s < 0.25) return r - 0.55;
  if (s > 0.86) return r - 0.5;
  return r - 1.15;
}
function planB(s) {
  if (s < 0.36) return Math.pow(1 - Math.pow(1 - s / 0.36, 2.4), 0.5);
  if (s > 0.5) return Math.pow(Math.max(1 - Math.pow(1 - (1 - s) / 0.5, 2.1), 0), 0.8);
  return 1;
}
function sectB(s, yn) {
  const amid = Math.pow(Math.sin(Math.min(yn / 0.42, 1) * Math.PI / 2), 0.45) * (1 - 0.05 * smoothstep(0.62, 1, yn));
  const bow = Math.pow(yn, 1.45);
  const stern = Math.pow(smoothstep(0.26, 1.02, yn), 1.15);
  const eb = Math.pow(smoothstep(0.52, 1.0, s), 1.2), es = Math.pow(1 - smoothstep(0.0, 0.42, s), 1.5);
  return lerp(lerp(amid, bow, eb), stern, es);
}
// starboard hull point for station s (0 stern .. 1 bow) and height fraction yn (0 keel .. 1 rail)
// the stem in profile: raked above the water, a rounded cut-away forefoot below (keel ends at z -17)
function stemZ(yn) { const c = 1 - smoothstep(0, 0.42, yn); return -24.5 - 4 * Math.pow(yn, 1.6) + 7.5 * c * c; }
function hullPoint(s, yn, out) {
  const zK = lerp(23.5, -24.5, s), zD = lerp(28, -28.5, s);
  const w = lerp(smoothstep(0.42, 0.95, yn), Math.pow(yn, 1.6), smoothstep(0.3, 0.7, s));
  let x = 5 * planB(s) * sectB(s, yn), z = lerp(zK, zD, w);
  if (s > 0.5) {                       // under the forefoot the sections fine away to the stem line
    const zs = stemZ(yn), low = 1 - smoothstep(0.3, 0.46, yn);
    x *= lerp(1, smoothstep(0, 3.5, z - zs), low); z = Math.max(z, zs);
  }
  out.set(x, lerp(KEEL, railY(s), yn), z);
  return out;
}
const sOfZ = (z) => (28 - z) / 56.5;
function halfBeamAt(z, y) {           // half-breadth of the hull at local z and height y
  const s = clamp(sOfZ(z), 0, 1), r = railY(s);
  return 5 * planB(s) * sectB(s, clamp((y - KEEL) / (r - KEEL), 0, 1));
}
// how much of the sea light reaches a point (inside the bulwarks the deck is in shadow)
function occAt(x, y, z) {
  const s = sOfZ(z);
  if (s < 0 || s > 1) return 1;
  const b = 5 * planB(s), r = railY(s), ax = Math.abs(x);
  if (ax > b - 0.08) return 1;
  const up = smoothstep(r - 0.2, r + 7, y);
  const edge = smoothstep(b - 3.0, b, ax) * smoothstep(r - 0.3, r + 1.5, y);
  return clamp(0.05 + 0.95 * Math.max(up, edge * 0.8), 0, 1);
}

// ---------------------------------------------------------------- geometry accumulator (non-indexed)
function makeAcc() { return { p: [], n: [], c: [], a: [] }; }
const _m3 = new THREE.Matrix3(), _v = new THREE.Vector3(), _n = new THREE.Vector3(), _q = new THREE.Quaternion();
const _I = new THREE.Matrix4();
// o: { occ, uv (use the geometry's uv as aux.zw), z (aux.z), jitter (rng-free tonal variation by position) }
function accAdd(A, geo, m, col, mat = 0, o = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  m = m || _I; _m3.getNormalMatrix(m);
  const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
  for (let i = 0; i < P.count; i++) {
    _v.fromBufferAttribute(P, i).applyMatrix4(m); _n.fromBufferAttribute(N, i).applyMatrix3(_m3).normalize();
    A.p.push(_v.x, _v.y, _v.z); A.n.push(_n.x, _n.y, _n.z);
    const j = o.jitter ? 1 + o.jitter * Math.sin(_v.x * 3.1 + _v.y * 5.7 + _v.z * 2.3) : 1;
    A.c.push(col.r * j, col.g * j, col.b * j);
    A.a.push(mat, o.occ !== undefined ? o.occ : occAt(_v.x, _v.y, _v.z), o.uv && U ? U.getX(i) : (o.z || 0), o.uv && U ? U.getY(i) : 0);
  }
  if (g !== geo) g.dispose();
  geo.dispose();
}
// matrix that maps a unit-height Y cylinder (centred) onto the segment a -> b
const _up = V(0, 1, 0), _d = new THREE.Vector3();
function between(a, b) {
  _d.subVectors(b, a); const len = _d.length() || 1e-4;
  _q.setFromUnitVectors(_up, _d.multiplyScalar(1 / len));
  return new THREE.Matrix4().compose(V((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), _q, V(1, len, 1));
}
// tapered round spar from a (radius ra) to b (radius rb)
function spar(A, a, b, ra, rb, col, seg = 8, mat = 0, o = {}) {
  accAdd(A, new THREE.CylinderGeometry(rb, ra, 1, seg, 1, false), between(a, b), col, mat, o);
}
// chamfered box: footprint w x d, height h, corners cut by c, top edge bevelled. Base centre at origin.
function chamferBox(w, h, d, c = 0.08, topInset = c) {
  const x = w / 2, z = d / 2;
  const ring = [[x - c, -z], [x, -z + c], [x, z - c], [x - c, z], [-x + c, z], [-x, z - c], [-x, -z + c], [-x + c, -z]];
  const lv = [[0, 1], [h - topInset, 1], [h, 0]], pos = [];
  const pt = (k, l) => { const r = ring[k % 8], y = lv[l][0], ins = lv[l][1] ? 0 : topInset; return [r[0] - Math.sign(r[0]) * ins, y, r[1] - Math.sign(r[1]) * ins]; };
  for (let l = 0; l < 2; l++) for (let k = 0; k < 8; k++) {
    const a = pt(k, l), b = pt(k + 1, l), c2 = pt(k + 1, l + 1), d2 = pt(k, l + 1);
    pos.push(...a, ...d2, ...b, ...b, ...d2, ...c2);
  }
  for (let k = 1; k < 7; k++) pos.push(...pt(0, 2), ...pt(k + 1, 2), ...pt(k, 2));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}
const TRS = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));
function accGeometry(A) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(A.c, 3));
  g.setAttribute('aAux', new THREE.Float32BufferAttribute(A.a, 4));
  return g;
}

// ---------------------------------------------------------------- rig plan (per seed)
function makeRig(rng, opts) {
  const R = { masts: [], yards: [], chains: [] };
  const defs = [{ z: -14, truck: 41, rake: 0.016 + rng() * 0.01 }, { z: 3, truck: 44, rake: 0.024 + rng() * 0.01 }, { z: 19, truck: 36, rake: 0.036 + rng() * 0.012, mizzen: true }];
  const yaw0 = rng.range(-0.12, 0.12);
  defs.forEach((d, mi) => {
    const k = d.truck / 44, m = { ...d, k, i: mi };
    m.top = d.mizzen ? 15.5 : 16.6 * k; m.cap = d.mizzen ? 19.2 : 20.6 * k; m.cross = d.mizzen ? 27 : 29.6 * k; m.head = d.mizzen ? 30 : 33.6 * k;
    m.off = (y) => (y > m.cross + 0.3 ? -0.8 : y > m.top + 0.3 ? -0.45 : 0);
    m.at = (y, fwd = 0) => V(0, y, d.z + d.rake * (y - 5) + fwd);
    m.yaw = d.mizzen ? 0 : yaw0 * (mi === 0 ? 1 : 0.6) + rng.range(-0.04, 0.04);
    R.masts.push(m);
    if (!d.mizzen) {
      const hs = [15, 22, 28, 35, 41], hl = [12, 10.5, 9, 7.2, 5.5];
      hs.forEach((h, yi) => {
        const y = h * k, yaw = m.yaw * (1 + yi * 0.12) + rng.range(-0.012, 0.012), tilt = rng.range(-0.014, 0.014);
        const c = m.at(y, m.off(y - 1) - (yi === 0 ? 0.78 : 0.58)), half = hl[yi] * (0.55 + 0.45 * k);
        const end = (sg, f = 1) => V(c.x + Math.cos(yaw) * half * f * sg, c.y + Math.sin(tilt) * half * f * sg, c.z + Math.sin(yaw) * half * f * sg);
        R.yards.push({ m, yi, c, half, yaw, tilt, end, r: 0.2 * Math.sqrt(half / 12) + 0.02 });
      });
    }
    // chain plates: shrouds then backstays, each side
    const nS = d.mizzen ? 4 : 5, nB = d.mizzen ? 2 : 3;
    for (const sg of [-1, 1]) for (let j = 0; j < nS + nB; j++) {
      const z = d.z + (d.mizzen ? (j < nS ? 0.6 + j * 0.8 : 4.3 + (j - nS) * 0.85) : (j < nS ? 0.7 + j * 0.95 : 6.2 + (j - nS) * 0.95)), ry = railY(sOfZ(z));
      R.chains.push({ m, sg, j, back: j >= nS ? j - nS : -1, foot: V(sg * (halfBeamAt(z, ry) + 0.34), ry + 0.8, z), z, ry });
    }
  });
  R.clewed = opts.courses ? opts.courses === 'clewed' : rng.chance(0.25);
  R.bowsprit = [V(0, 7.15, -24), V(0, 8.0, -36.5)]; R.jibboom = [V(0, 7.85, -33.5), V(0, 9.0, -46)];
  R.gaff = [V(0, 14.9, 19.75), V(0, 20.6, 29.6)]; R.boom = [V(0, 7.3, 19.75), V(0, 7.9, 32.2)];
  R.lamp = (sg) => { const ry = railY(sOfZ(-12)); return V(sg * (halfBeamAt(-12, ry) + 0.5), ry + 0.5, -12); };
  return R;
}

// two rows of points -> a quad strip (indexed, smooth normals)
function stripGeo(a, b) {
  const pos = [], idx = [], n = a.length;
  for (let i = 0; i < n; i++) pos.push(a[i].x, a[i].y, a[i].z, b[i].x, b[i].y, b[i].z);
  for (let i = 0; i < n - 1; i++) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

async function buildHull(A, C, rig, rng, pause) {
  // stations: uniform plus pairs at the poop and forecastle breaks
  const ss = []; for (let i = 0; i <= 68; i++) ss.push(i / 68);
  ss.push(0.2488, 0.2512, 0.8588, 0.8612, 0.003, 0.007, 0.011, 0.02, 0.026, 0.034, 0.98, 0.992, 0.997); ss.sort((a, b) => a - b);
  const NS = ss.length, NR = 22, W = 2 * NR + 1, pos = [], uv = [], idx = [], p = V(0, 0, 0), q = V(0, 0, 0);
  let arc = 0; const pa = V(0, 0, 0), pb = V(0, 0, 0);
  for (let i = 0; i < NS; i++) {
    if (i % 6 === 5) await pause();
    if (i > 0) arc += hullPoint(ss[i], 0.85, pa).distanceTo(hullPoint(ss[i - 1], 0.85, pb));
    if (ss[i] <= 0.945) rig.hawseU = arc;
    const girth = [0]; hullPoint(ss[i], 1, q);
    for (let j = NR - 1; j >= 0; j--) { hullPoint(ss[i], j / NR, p); girth[NR - j] = girth[NR - j - 1] + p.distanceTo(q); q.copy(p); }
    for (let j = -NR; j <= NR; j++) {
      const a = Math.abs(j); hullPoint(ss[i], a / NR, p);
      pos.push(j < 0 ? -p.x : p.x, p.y, p.z); uv.push(arc + (j < 0 ? 100 : 0), girth[NR - a]);
    }
  }
  for (let i = 0; i < NS - 1; i++) for (let j = 0; j < W - 1; j++) { const a = i * W + j, b = a + W; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const hg = new THREE.BufferGeometry();
  hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); hg.setIndex(idx); hg.computeVertexNormals();
  await pause();
  // added in slices (same vertices and smooth normals, shared attributes) so that no build step is long
  const SLICE = 6 * (W - 1) * 10;
  for (let a = 0; a < idx.length; a += SLICE) {
    const part = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'uv']) part.setAttribute(k, hg.attributes[k]);
    part.setIndex(idx.slice(a, a + SLICE));
    accAdd(A, part, null, C.iron, 1, { occ: 1, uv: true });
    await pause();
  }
  hg.dispose();

  // deck, bulwark inner faces, cap rail, rubbing strake
  const rows = { dS: [], dP: [], iS: [], iP: [], iSb: [], iPb: [], cS: [], cP: [], cSi: [], cPi: [], r0: [], r1: [], r2: [], r3: [] };
  for (let i = 0; i < NS; i++) {
    const s = ss[i]; hullPoint(s, 1, p); const xin = Math.max(p.x - 0.2, 0), dy = deckY(s), ry = p.y, z = p.z;
    // the deck edge follows the rail line in plan but must stay inside the hull at deck height
    rows.dS.push(V(xin, dy, z)); rows.dP.push(V(-xin, dy, z));
    rows.iS.push(V(xin, ry, z)); rows.iSb.push(V(xin, dy, z)); rows.iP.push(V(-xin, ry, z)); rows.iPb.push(V(-xin, dy, z));
    rows.cS.push(V(p.x + 0.07, ry + 0.07, z)); rows.cSi.push(V(Math.max(p.x - 0.27, 0), ry + 0.07, z));
    rows.cP.push(V(-p.x - 0.07, ry + 0.07, z)); rows.cPi.push(V(-Math.max(p.x - 0.27, 0), ry + 0.07, z));
    const a = hullPoint(s, 0.80, V(0, 0, 0)), b = hullPoint(s, 0.835, V(0, 0, 0)), o = Math.min(0.13, a.x);
    rows.r0.push(a); rows.r1.push(V(a.x + o, a.y, a.z)); rows.r2.push(V(b.x + o, b.y, b.z)); rows.r3.push(b);
  }
  await pause();
  accAdd(A, stripGeo(rows.dS, rows.dP), null, C.deck, 0, { occ: 0.04 });
  accAdd(A, stripGeo(rows.iS, rows.iSb), null, C.iron2, 0, { occ: 0.05 }); accAdd(A, stripGeo(rows.iPb, rows.iP), null, C.iron2, 0, { occ: 0.05 });
  accAdd(A, stripGeo(rows.cS, rows.cSi), null, C.rail, 0, { occ: 1 }); accAdd(A, stripGeo(rows.cPi, rows.cP), null, C.rail, 0, { occ: 1 });
  accAdd(A, stripGeo(rows.cS, rows.iS.map((v, i) => V(rows.cS[i].x, v.y - 0.1, v.z))), null, C.rail, 0, { occ: 1 });
  accAdd(A, stripGeo(rows.cP, rows.iP.map((v, i) => V(rows.cP[i].x, v.y - 0.1, v.z))), null, C.rail, 0, { occ: 1 });
  await pause();
  const mir = (r) => r.map((v) => V(-v.x, v.y, v.z));
  for (const f of [(r) => r, mir]) {
    accAdd(A, stripGeo(f(rows.r0), f(rows.r1)), null, C.strake, 0, { occ: 1 });
    accAdd(A, stripGeo(f(rows.r1), f(rows.r2)), null, C.strake, 0, { occ: 1 });
    accAdd(A, stripGeo(f(rows.r2), f(rows.r3)), null, C.strake, 0, { occ: 1 });
  }
  await pause();
  // carved name board round the counter (no letters): a pale band with a raised frame
  const nb0 = [], nb1 = [], nb2 = [], nb3 = [];
  for (let k = -10; k <= 10; k++) {
    const s = Math.abs(k) / 10 * 0.035, sg = Math.sign(k) || 1, out = (yn, e) => { const h = hullPoint(s, yn, V(0, 0, 0)); h.x = sg * (h.x + e * 0.6) ; h.z += e; return h; };
    nb0.push(out(0.855, 0.03)); nb1.push(out(0.87, 0.1)); nb2.push(out(0.93, 0.1)); nb3.push(out(0.945, 0.03));
  }
  accAdd(A, stripGeo(nb0, nb1), null, C.gilt, 0, { occ: 1 }); accAdd(A, stripGeo(nb1, nb2), null, C.board, 0, { occ: 1, jitter: 0.25 }); accAdd(A, stripGeo(nb2, nb3), null, C.gilt, 0, { occ: 1 });
  await pause();
  // taffrail round the poop: turned posts and a top rail
  const tr = [[], []];
  for (let k = 0; k <= 15; k++) {
    hullPoint(0.004 + k * 0.0155, 1, p);
    for (const sg of [-1, 1]) { const b = V(sg * Math.max(p.x - 0.1, 0.05), p.y + 0.07, p.z); spar(A, b, V(b.x, b.y + 0.78, b.z), 0.045, 0.03, C.rail, 5, 0, { occ: 1 }); tr[sg < 0 ? 0 : 1].push(V(b.x, b.y + 0.8, b.z)); }
  }
  const full = tr[0].slice().reverse().concat(tr[1]);
  accAdd(A, stripGeo(full.map((v) => V(v.x * 1.03, v.y, v.z + 0.03)), full.map((v) => V(v.x * 0.95, v.y + 0.04, v.z - 0.07))), null, C.rail, 0, { occ: 1 });
  accAdd(A, stripGeo(full.map((v) => V(v.x * 1.03, v.y, v.z + 0.03)), full.map((v) => V(v.x * 1.03, v.y - 0.09, v.z + 0.03))), null, C.rail, 0, { occ: 1 });
  await pause();
  // sternpost, rudder, keel bar
  // (tarred iron: under water they stay near-black silhouettes against the glowing layer and the lit copper)
  accAdd(A, chamferBox(0.36, 6.8, 0.55, 0.07), TRS(0, KEEL - 0.85, 23.72), C.rudder, 0, { occ: 1, jitter: 0.2 });      // (the post, the rudder's heel and the bar keel stand 0.9 m below the body: seen from far off under water the profile shows them against the bright ceiling)
  // the rudder: a shaped blade, broad at the heel and narrowing to the stock that enters the counter,
  // hung a hand's width abaft the post and lying a few degrees to port
  const RUD = [[-6.35, 1.35], [-5.9, 1.75], [-5.35, 1.95], [-4.6, 2.15], [-3.6, 2.25], [-2.6, 1.9], [-1.7, 1.25], [-1.0, 0.7], [-0.45, 0.45], [1.2, 0.38]];
  const RM = TRS(0, 0, 24.05, -0.13);
  for (const sg of [-1, 1]) {
    accAdd(A, stripGeo(RUD.map((r) => V(sg * 0.13, r[0], 0)), RUD.map((r) => V(sg * 0.035, r[0], r[1]))), RM, C.rudder, 0, { occ: 1, jitter: 0.25 });
  }
  accAdd(A, stripGeo(RUD.map((r) => V(-0.13, r[0], 0)), RUD.map((r) => V(0.13, r[0], 0))), RM, C.rudder, 0, { occ: 1 });
  accAdd(A, stripGeo([V(-0.13, RUD[0][0], 0), V(-0.035, RUD[0][0], RUD[0][1])], [V(0.13, RUD[0][0], 0), V(0.035, RUD[0][0], RUD[0][1])]), RM, C.rudder, 0, { occ: 1 });
  for (const y of [-4.7, -3.3, -1.9, -0.6]) accAdd(A, chamferBox(0.46, 0.16, 0.95, 0.05), TRS(0, y, 24.0), C.iron2, 0, { occ: 1 });   // gudgeon straps
  accAdd(A, chamferBox(0.34, 0.95, 40.4, 0.06), TRS(0, KEEL - 0.9, 3.0), C.iron, 0, { occ: 1 });
  // channels, deadeyes
  for (const mi of [0, 1, 2]) for (const sg of [-1, 1]) {
    await pause();
    const cs = rig.chains.filter((c) => c.m.i === mi && c.sg === sg);
    for (const c of cs) {
      accAdd(A, chamferBox(0.5, 0.12, 1.02, 0.04), TRS(c.foot.x - sg * 0.12, c.ry - 0.42, c.z), C.strake, 0, { occ: 1 });
      for (const dy of [0, -0.62]) accAdd(A, new THREE.CylinderGeometry(0.11, 0.11, 0.1, 7), TRS(c.foot.x, c.foot.y + dy, c.z, 0, 1, 1, 1, 0, Math.PI / 2), C.mastDark, 0, { occ: 1 });
    }
  }
  // hawse pipes (the port mouth is anchors.hawse)
  for (const sg of [-1, 1]) {
    const h = hullPoint(0.945, 0.86, V(0, 0, 0));
    accAdd(A, new THREE.TorusGeometry(0.2, 0.07, 6, 10), TRS(sg * (h.x + 0.03), h.y, h.z, sg * 1.25), C.rail, 0, { occ: 1 });
  }
}

function gridGeo(rows) {
  const pos = [], idx = [], W = rows[0].length;
  for (const r of rows) for (const v of r) pos.push(v.x, v.y, v.z);
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < W - 1; j++) { const a = i * W + j, b = a + W; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function boatGeo(L, B, D) {
  const rows = [], NS = 10, NA = 7;
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, half = B / 2 * Math.pow(Math.sin(Math.PI * (s * 0.94 + 0.03)), 0.6), dp = D * Math.pow(Math.sin(Math.PI * (s * 0.88 + 0.06)), 0.35), row = [];
    for (let j = -NA; j <= NA; j++) { const t = j / NA * Math.PI / 2; row.push(V(half * Math.sin(t), -dp * Math.pow(Math.cos(t), 0.7), (s - 0.5) * L)); }
    rows.push(row);
  }
  return rows;
}
function figure(A, C, x, y, z, yaw, lean = 0.12) {
  const M = TRS(x, y, z, yaw), put = (g, m, w) => accAdd(A, g, M.clone().multiply(m), C.figure, 3, { z: w });
  for (const sx of [-0.11, 0.11]) put(chamferBox(0.17, 0.88, 0.2, 0.04), TRS(sx, 0, 0.03), 0.15);
  put(chamferBox(0.46, 0.66, 0.27, 0.08, 0.1), TRS(0, 0.84, 0, 0, 1, 1, 1, -lean), 0.6);
  put(new THREE.IcosahedronGeometry(0.12, 1), TRS(0, 1.64, -lean * 0.75), 1);
  put(new THREE.CylinderGeometry(0.1, 0.18, 0.09, 8), TRS(0, 1.75, -lean * 0.75), 1);
  for (const sx of [-1, 1]) {
    const a = V(sx * 0.26, 1.42, -lean * 0.5).applyMatrix4(M), e = V(sx * 0.31, 1.14, -0.2).applyMatrix4(M), b = V(sx * 0.2, 1.08, -0.46).applyMatrix4(M);
    spar(A, a, e, 0.065, 0.055, C.figure, 5, 3, { z: 0.7 }); spar(A, e, b, 0.055, 0.045, C.figure, 5, 3, { z: 0.6 });
  }
}

async function buildDeck(A, C, rig, rng, pause) {
  const dk = (z) => deckY(sOfZ(z));
  // deckhouse between fore and main, with roof overhang and a stove pipe
  const hz = -6.9, hy = dk(hz);
  accAdd(A, chamferBox(4.2, 2.15, 6.4, 0.12), TRS(0, hy, hz), C.house, 0, { jitter: 0.1 });
  accAdd(A, chamferBox(4.7, 0.12, 6.9, 0.2, 0.06), TRS(0, hy + 2.15, hz), C.rail);
  spar(A, V(1.3, hy + 2.2, hz + 2.2), V(1.3, hy + 3.3, hz + 2.2), 0.09, 0.09, C.iron2, 6);
  accAdd(A, chamferBox(2.6, 0.5, 2.3, 0.1), TRS(0, dk(-17.6), -17.6), C.house);
  accAdd(A, chamferBox(3.2, 0.55, 3.2, 0.1), TRS(0, dk(9), 9), C.house);
  await pause();
  // boats on skids abaft the main mast: their white bottoms sit above the rail and catch the sea light
  const sy = dk(9) + 2.3;
  for (const z of [6.4, 11.6]) {
    accAdd(A, chamferBox(8.4, 0.18, 0.24, 0.05), TRS(0, sy, z), C.rail);
    for (const x of [-3.9, 3.9]) spar(A, V(x, dk(z), z), V(x, sy, z), 0.07, 0.07, C.rail, 6);
  }
  const nBoats = rng.chance(0.3) ? 1 : 2;
  for (let b = 0; b < nBoats; b++) {
    const sx = (b === 0 ? -1 : 1) * (nBoats === 1 ? rng.sign() : 1), rows = boatGeo(6.6 + rng() * 0.6, 1.95, 0.9), M = TRS(sx * 2.25, sy + 1.12, 9, rng.range(-0.03, 0.03));
    accAdd(A, gridGeo(rows), M, C.boat, 0, { jitter: 0.08 });
    accAdd(A, gridGeo([rows.map((r) => r[0]), rows.map((r) => V(0, 0.22 * Math.sin(Math.PI * (r[0].z / 7 + 0.5)), r[0].z)), rows.map((r) => r[r.length - 1])]), M, C.canvas);
  }
  await pause();
  // poop: skylight, companion, binnacle, wheel and wheel box
  accAdd(A, chamferBox(1.7, 0.62, 2.3, 0.1, 0.32), TRS(0, dk(15.9), 15.9), C.house);
  accAdd(A, chamferBox(1.1, 1.25, 1.5, 0.1, 0.2), TRS(1.25, dk(21.8), 21.8), C.house);
  const wy = dk(24.3);
  accAdd(A, chamferBox(0.36, 1.05, 0.36, 0.09, 0.14), TRS(0, wy, 23.25), C.wood);
  accAdd(A, new THREE.IcosahedronGeometry(0.19, 1), TRS(0, wy + 1.08, 23.25), C.iron2);
  accAdd(A, new THREE.TorusGeometry(0.6, 0.045, 5, 18), TRS(0, wy + 1.05, 24.3), C.wood);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; spar(A, V(Math.cos(a) * 0.76, wy + 1.05 + Math.sin(a) * 0.76, 24.3), V(-Math.cos(a) * 0.76, wy + 1.05 - Math.sin(a) * 0.76, 24.3), 0.025, 0.025, C.wood, 4); }
  accAdd(A, chamferBox(0.28, 1.0, 0.4, 0.06), TRS(0, wy, 24.55), C.wood);
  accAdd(A, chamferBox(1.7, 0.62, 1.2, 0.12, 0.2), TRS(0, wy, 25.75), C.house);
  await pause();
  // forecastle: capstan, catheads
  const cy = dk(-23.4), prof = [[0.46, 0], [0.44, 0.12], [0.27, 0.3], [0.25, 0.62], [0.4, 0.78], [0.42, 0.95], [0.3, 1.02], [0.001, 1.04]].map((q) => new THREE.Vector2(q[0], q[1]));
  accAdd(A, new THREE.LatheGeometry(prof, 12), TRS(0, cy, -23.4), C.wood);
  for (const sg of [-1, 1]) { const ry = railY(sOfZ(-25.2)); spar(A, V(sg * 2.2, ry + 0.05, -25.0), V(sg * 3.9, ry + 0.3, -26.0), 0.15, 0.13, C.rail, 6); }
  await pause();
  // figures: helmsman, lookout, two hands at the port rail, all turned toward the water
  const P = { helm: V(rng.range(-0.25, 0.25), wy, 25.05), lookout: V(rng.range(-0.8, 0.8), cy, -25.6), hands: [] };
  figure(A, C, P.helm.x, wy, P.helm.z, rng.range(0.3, 0.9), 0.1);
  await pause();
  figure(A, C, P.lookout.x, cy, P.lookout.z, rng.range(-0.5, 0.5), 0.2);
  await pause();
  let hz2 = rng.range(-2, 1.5);
  for (let k = 0; k < 2; k++) {
    const z = hz2, x = -(halfBeamAt(z, railY(sOfZ(z))) - 0.62); P.hands.push(V(x, dk(z), z));
    figure(A, C, x, dk(z), z, Math.PI / 2 + rng.range(-0.25, 0.25), 0.26); hz2 += rng.range(1.1, 2.4);
    await pause();
  }
  // lanterns (the second colour): taffrail, poop, the after end of the deckhouse, the forecastle head. Each a post,
  // a caged body and a lens that glows (mat 2); lit panes in the deckhouse sides and the poop skylight
  P.lamps = [[0, dk(27.2) + 2.05, 27.2, 2.0], [0.0, dk(17.6) + 1.95, 17.6, 1.3], [0, hy + 3.0, hz + 3.75, 2.0], [0, dk(-20.6) + 2.1, -20.6, 1.8]].map((q) => new THREE.Vector4(q[0], q[1], q[2], q[3]));
  for (const q of P.lamps) {
    const base = q.z === hz + 3.75 ? hy + 2.2 : dk(q.z);
    spar(A, V(q.x, base, q.z), V(q.x, q.y - 0.2, q.z), 0.035, 0.03, C.iron2, 5, 0, { occ: 1 });
    accAdd(A, new THREE.CylinderGeometry(0.06, 0.15, 0.1, 6), TRS(q.x, q.y + 0.2, q.z), C.iron2, 0, { occ: 1 });
    accAdd(A, new THREE.CylinderGeometry(0.13, 0.1, 0.08, 6), TRS(q.x, q.y - 0.19, q.z), C.iron2, 0, { occ: 1 });
    accAdd(A, new THREE.CylinderGeometry(0.115, 0.115, 0.32, 6), TRS(q.x, q.y, q.z), C.amber, 2, { occ: 1 });
    await pause();
  }
  for (const sx of [-1, 1]) for (const dz of [-2.1, 0, 2.1]) accAdd(A, chamferBox(0.05, 0.42, 0.6, 0.01), TRS(sx * 2.11, hy + 1.15, hz + dz), C.pane, 2, { occ: 1 });
  for (const sx of [-1, 1]) accAdd(A, chamferBox(0.5, 0.04, 1.7, 0.01), TRS(sx * 0.4, dk(15.9) + 0.6, 15.9, 0, 1, 1, 1, 0, -sx * 0.35), C.pane, 2, { occ: 1 });
  return P;
}

async function buildSpars(A, C, rig, pause) {
  for (const m of rig.masts) {
    await pause();
    const kk = 0.75 + 0.25 * m.k, z = (y, f) => m.at(y, f).z;
    spar(A, m.at(deckY(sOfZ(m.z)) - 0.1), m.at(m.cap), 0.42 * kk, 0.33 * kk, C.mast, 10);
    accAdd(A, chamferBox(3.3 * kk, 0.14, 2.4, 0.4, 0.04), TRS(0, m.top, z(m.top) - 0.3), C.mastDark);
    for (const sx of [-0.3, 0.3]) accAdd(A, chamferBox(0.12, 0.3, 2.2, 0.03), TRS(sx * kk, m.top - 0.3, z(m.top) - 0.3), C.mastDark);
    accAdd(A, chamferBox(0.8, 0.22, 1.3, 0.1), TRS(0, m.cap - 0.12, z(m.cap) - 0.25), C.mastDark);
    spar(A, m.at(m.top - 0.7, -0.45), m.at(m.head, -0.45), 0.25 * kk, 0.18 * kk, C.spar, 8);
    for (const dz of [-0.75, -0.2]) spar(A, V(-1.3 * kk, m.cross, z(m.cross) + dz), V(1.3 * kk, m.cross, z(m.cross) + dz), 0.06, 0.06, C.mastDark, 5);
    accAdd(A, chamferBox(0.5, 0.16, 1.5, 0.08), TRS(0, m.cross - 0.1, z(m.cross) - 0.5), C.mastDark);
    accAdd(A, chamferBox(0.5, 0.18, 0.9, 0.08), TRS(0, m.head - 0.12, z(m.head) - 0.62), C.mastDark);
    spar(A, m.at(m.cross - 0.6, -0.8), m.at(m.truck, -0.8), 0.15 * kk, 0.07, C.spar, 7);
    accAdd(A, new THREE.IcosahedronGeometry(0.17, 1), TRS(0, m.truck + 0.08, z(m.truck) - 0.8, 0, 1, 0.6, 1), C.gilt);
  }
  await pause();
  for (const y of rig.yards) {
    for (const sg of [-1, 1]) spar(A, y.c, y.end(sg), y.r, y.r * 0.48, C.spar, 8);
    accAdd(A, chamferBox(0.5, 0.36, 0.62, 0.1), TRS(0, y.c.y - 0.18, y.c.z + 0.3), C.mastDark);
  }
  await pause();
  spar(A, rig.bowsprit[0], rig.bowsprit[1], 0.36, 0.27, C.mast, 10);
  spar(A, rig.jibboom[0], rig.jibboom[1], 0.19, 0.085, C.spar, 8);
  accAdd(A, chamferBox(0.5, 0.75, 0.24, 0.08), TRS(0, rig.bowsprit[1].y - 0.3, rig.bowsprit[1].z), C.mastDark);
  spar(A, V(0, 7.75, -36.55), V(0, 4.4, -36.95), 0.075, 0.05, C.spar, 6);
  spar(A, V(0, 6.75, -28.5), V(0, 5.75, -29.55), 0.3, 0.1, C.boat, 8);
  spar(A, rig.gaff[0], rig.gaff[1], 0.15, 0.085, C.spar, 8);
  spar(A, rig.boom[0], rig.boom[1], 0.19, 0.12, C.spar, 8);
  // sidelights: screen board, lamp body and a lens that glows (mat 2)
  for (const sg of [-1, 1]) {
    const p = rig.lamp(sg);
    accAdd(A, chamferBox(0.07, 0.72, 1.0, 0.02), TRS(p.x - sg * 0.24, p.y - 0.38, p.z), C.iron2, 0, { occ: 1 });
    accAdd(A, chamferBox(0.5, 0.06, 1.0, 0.02), TRS(p.x - sg * 0.02, p.y - 0.4, p.z), C.iron2, 0, { occ: 1 });
    accAdd(A, new THREE.CylinderGeometry(0.1, 0.14, 0.4, 8), TRS(p.x, p.y - 0.08, p.z), C.iron2, 0, { occ: 1 });
    accAdd(A, new THREE.IcosahedronGeometry(0.115, 1), TRS(p.x + sg * 0.03, p.y, p.z), sg < 0 ? C.red : C.green, 2, { occ: 1 });
  }
}

// ---------------------------------------------------------------- sails (one mesh; folds, slatting and shading in the shader)
function makeSailAcc() { return { p: [], uv: [], met: [], n: [], tu: [], sd: [], ph: [], idx: [] }; }
const _a = V(0, 0, 0), _b = V(0, 0, 0), _tu = V(0, 0, 0), _tv = V(0, 0, 0), _nn = V(0, 0, 0);
// fn(u, v, out): u -1..1 across, v 0 (head) .. 1 (foot). o: { nu, nv, kind, seed, fold, belly, phase, flag }
function addSail(S, fn, o) {
  const base = S.p.length / 3, nu = o.nu, nv = o.nv, W = nu + 1, G = new Float32Array(W * (nv + 1) * 3);
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { fn(-1 + 2 * i / nu, j / nv, _a); const k = (j * W + i) * 3; G[k] = _a.x; G[k + 1] = _a.y; G[k + 2] = _a.z; }
  const at = (i, j, out) => { const k = (j * W + i) * 3; return out.set(G[k], G[k + 1], G[k + 2]); };
  const drop = at(nu >> 1, nv, _a).distanceTo(at(nu >> 1, 0, _b));
  for (let j = 0; j <= nv; j++) {
    const half = at(nu, j, _a).distanceTo(at(0, j, _b)) / 2, jt = Math.max(j, 1);
    for (let i = 0; i <= nu; i++) {
      const u = -1 + 2 * i / nu, v = j / nv;
      _tu.subVectors(at(Math.min(i + 1, nu), jt, _a), at(Math.max(i - 1, 0), jt, _b)).normalize();
      _tv.subVectors(at(i, Math.min(j + 1, nv), _a), at(i, Math.max(j - 1, 0), _b));
      _nn.crossVectors(_tu, _tv).normalize();
      at(i, j, _a);
      S.p.push(_a.x, _a.y, _a.z); S.uv.push(u, v); S.met.push(u * half, v * drop, half, drop);
      S.n.push(_nn.x, _nn.y, _nn.z); S.tu.push(_tu.x, _tu.y, _tu.z);
      S.sd.push(o.seed, o.kind, o.fold, o.belly); S.ph.push(o.phase, o.flag || 0);
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * W + i, b = a + W; S.idx.push(a, b, a + 1, a + 1, b, b + 1); }
}
function quadFn(hl, hr, fl, fr, o = {}) {
  const h = V(0, 0, 0), f = V(0, 0, 0), hc = hl.clone().lerp(hr, 0.5), fc = fl.clone().lerp(fr, 0.5), c = V(0, 0, 0);
  const hollow = o.hollow ?? 0.035, roach = o.roach || 0, scal = o.scallop || 0, sag = o.sag || 0;
  return (u, v, out) => {
    const t = (u + 1) / 2; h.lerpVectors(hl, hr, t); f.lerpVectors(fl, fr, t); out.lerpVectors(h, f, v); c.lerpVectors(hc, fc, v);
    out.sub(c).multiplyScalar(1 - hollow * Math.sin(Math.PI * v)).add(c);
    out.y += roach * v * v * Math.pow(1 - u * u, 0.8) + scal * Math.pow(v, 1.5) * (0.5 - 0.5 * Math.cos(u * Math.PI * 3)) - sag * t * Math.sin(Math.PI * v);
    return out;
  };
}

async function buildSails(S, rig, rng, detail, pause) {
  const N = (n) => Math.max(8, Math.round(n * (0.7 + 0.3 * detail)));
  const list = [];   // outlines for anchors / reflection
  rig.faClews = []; rig.courseClews = [];
  // square sails
  for (const y of rig.yards) {
    const m = y.m, below = y.yi > 0 ? rig.yards.find((q) => q.m === m && q.yi === y.yi - 1) : null;
    const hl = y.end(-1, 0.95), hr = y.end(1, 0.95); hl.y -= 0.28; hr.y -= 0.28;
    let fl, fr, o = { roach: 0.3, hollow: 0.03 }, fold = rng.range(0.85, 1.2), belly = rng.range(0.3, 0.62);
    if (below) { fl = below.end(-1, 0.93); fr = below.end(1, 0.93); fl.y += 0.5; fr.y += 0.5; }
    else {
      const fy = m.i === 0 ? 8.0 : 7.5, clew = rig.clewed;
      fl = y.end(-1, clew ? 0.8 : 0.9); fr = y.end(1, clew ? 0.8 : 0.9);
      fl.y = fr.y = clew ? y.c.y - 3.0 : fy; fl.z += 0.15; fr.z += 0.15;
      o = clew ? { roach: 0, scallop: 1.25, hollow: 0.01 } : { roach: 0.9, hollow: 0.04 };
      if (clew) { fold *= 1.7; belly *= 0.5; } else belly *= 1.25;
      rig.courseClews.push(fl.clone(), fr.clone());
    }
    addSail(S, quadFn(hl, hr, fl, fr, o), { nu: N(y.half > 8.5 ? 60 : 44), nv: N(18), kind: 0, seed: rng.range(1, 60), fold, belly, phase: m.i * 0.9 + y.yi * 0.35 + rng.range(-0.25, 0.25), flag: (y.yi === 0 && !rig.clewed) || y.yi === 2 ? 1 : 0 });
    list.push({ kind: 0, top: hl.y, foot: fl.y, half: y.half });
    await pause();
  }
  await pause();
  // fore-and-aft sails: luff on the stay (u = -1), clew hanging slack
  const fa = (head, tack, clew, o = {}) => {
    const side = rig.faClews.length % 2 ? -1 : 1, bel = rng.range(0.5, 0.85) * side;
    clew = clew.clone(); clew.x = side * rng.range(0.5, 1.0) * (o.off ?? 3.4); rig.faClews.push(clew);     // eased sheets: the clews hang off to alternate sides, so from above the staysails fan out as blades
    addSail(S, quadFn(head, head, tack, clew, { hollow: 0.05, sag: o.sag ?? 0.35 }), { nu: N(28), nv: N(18), kind: 1, seed: rng.range(1, 60), fold: rng.range(1.2, 1.7), belly: bel, phase: rng.range(0, 6.28), flag: 0 });
  };
  const F = rig.masts[0], M = rig.masts[1], Z = rig.masts[2];
  rig.stays = {
    fore: [V(0, 7.25, -29.2), F.at(F.top - 0.6, -0.5)], foreTop: [rig.bowsprit[1].clone().add(V(0, 0.25, 0.4)), F.at(F.cross - 0.4, -0.75)],
    jib: [V(0, 8.75, -41.3), F.at(F.head - 0.3, -0.9)], flying: [rig.jibboom[1].clone().add(V(0, 0.1, 0.15)), F.at(F.truck - 5.5, -0.9)],
    mizzen: [M.at(8.2, 0.5), Z.at(Z.top - 0.5, -0.45)], mizzenTop: [M.at(M.top + 0.6, 0.45), Z.at(Z.cross - 0.5, -0.5)],
  };
  const onStay = (st, t) => st[0].clone().lerp(st[1], t);
  fa(onStay(rig.stays.fore, 0.86), onStay(rig.stays.fore, 0.1), V(0, 8.3, -16.6));
  await pause();
  fa(onStay(rig.stays.foreTop, 0.84), onStay(rig.stays.foreTop, 0.07), V(0, 9.0, -24.5));
  fa(onStay(rig.stays.jib, 0.82), onStay(rig.stays.jib, 0.06), V(0, 9.8, -30.5));
  await pause();
  fa(onStay(rig.stays.flying, 0.78), onStay(rig.stays.flying, 0.06), V(0, 11.2, -36.5));
  fa(onStay(rig.stays.mizzen, 0.88), onStay(rig.stays.mizzen, 0.12), V(0, 8.0, 15.2));
  await pause();
  fa(onStay(rig.stays.mizzenTop, 0.88), onStay(rig.stays.mizzenTop, 0.1), V(0, 16.6, 14.8));
  await pause();
  // spanker (gaff, mast, boom) and gaff topsail
  const g0 = rig.gaff[0].clone().add(V(0, -0.2, 0.35)), g1 = rig.gaff[1].clone().add(V(0, -0.25, -0.3)), b0 = rig.boom[0].clone().add(V(0, 0.35, 0.35)), b1 = rig.boom[1].clone().add(V(0, 0.3, -0.9));
  addSail(S, quadFn(g0, g1, b0, b1, { hollow: 0.03, sag: 0.25 }), { nu: N(24), nv: N(16), kind: 1, seed: rng.range(1, 60), fold: rng.range(1, 1.4), belly: rng.range(0.4, 0.7) * rng.sign(), phase: rng.range(0, 6.28), flag: 2 });
  fa(Z.at(Z.head + 1.0, -0.2), Z.at(Z.top + 0.5, 0.25), rig.gaff[1].clone().add(V(0, 0.35, -0.5)), { sag: 0.1, off: 0 });
  await pause();
  // pennant at the main truck (12 m) and ensign at the gaff
  const truck = M.at(M.truck + 0.05, -0.8), ang = rng.range(0.3, 1.2), PL = rng.range(10.5, 13), out = V(Math.sin(ang), 0, Math.cos(ang)), hz = V(out.z, 0, -out.x);
  const pa = V(0, 0, 0);
  rig.pennant = { root: truck.clone(), tip: truck.clone().addScaledVector(out, PL * 0.5).add(V(0, -PL * 0.7, 0)) };
  addSail(S, (u, v, o) => {
    const tx = 0.5, ty = -1.05 * Math.sqrt(Math.max(v, 0.02)), w = lerp(0.3, 0.04, v);
    pa.set(out.x * tx, ty, out.z * tx).cross(hz).normalize();
    o.copy(truck).addScaledVector(out, PL * 0.5 * v).addScaledVector(pa, u * w); o.y -= PL * 0.7 * Math.pow(v, 1.5);
    return o;
  }, { nu: 2, nv: N(36), kind: 2, seed: rng.range(1, 60), fold: 1, belly: 0, phase: 0.5, flag: 0 });
  const pk = rig.gaff[1].clone().add(V(0, -0.5, -0.2));
  addSail(S, (u, v, o) => o.set(0, pk.y - (u + 1) * 0.95 - 2.7 * v - 0.25 * v * (u + 1), pk.z + 1.15 * v + 0.12 * (u + 1)), { nu: 6, nv: N(12), kind: 2, seed: rng.range(1, 60), fold: 0.45, belly: 0, phase: 2.0, flag: 1 });
  return list;
}
function sailGeometry(S) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(S.p, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(S.uv, 2));
  g.setAttribute('aMet', new THREE.Float32BufferAttribute(S.met, 4)); g.setAttribute('aN', new THREE.Float32BufferAttribute(S.n, 3));
  g.setAttribute('aTu', new THREE.Float32BufferAttribute(S.tu, 3)); g.setAttribute('aSd', new THREE.Float32BufferAttribute(S.sd, 4));
  g.setAttribute('aPh', new THREE.Float32BufferAttribute(S.ph, 2)); g.setIndex(S.idx);
  return g;
}

// ---------------------------------------------------------------- rigging: camera-facing ribbons, never thinner than 1.5 px
function makeRopeAcc() { return { p: [], o: [], a: [], idx: [], n: 0 }; }
function rope(Rp, a, b, w = 0.03, sag = 0, sway = 0, seg = 0) {
  const n = seg || (sag > 0.02 ? 8 : 1), ph = (Math.abs(a.x * 1.7 + a.y * 0.9 + b.z * 1.3 + b.x * 0.7)) % 6.28;
  let px = a.x, py = a.y, pz = a.z;
  for (let i = 1; i <= n; i++) {
    const t = i / n, cx = lerp(a.x, b.x, t), cy = lerp(a.y, b.y, t) - sag * 4 * t * (1 - t), cz = lerp(a.z, b.z, t);
    const s0 = sway * Math.sin(Math.PI * (i - 1) / n), s1 = sway * Math.sin(Math.PI * t), base = Rp.p.length / 3;
    Rp.p.push(px, py, pz, px, py, pz, cx, cy, cz, cx, cy, cz); Rp.o.push(cx, cy, cz, cx, cy, cz, px, py, pz, px, py, pz);
    Rp.a.push(1, w, s0, ph, -1, w, s0, ph, 1, -w, s1, ph, -1, -w, s1, ph);
    Rp.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    px = cx; py = cy; pz = cz;
  }
  Rp.n++;
}
function buildRigging(Rp, rig, rng) {
  const [F, M, Z] = rig.masts, L = (a, b, t) => a.clone().lerp(b, t), hb = (z) => halfBeamAt(z, railY(sOfZ(z))), rl = (z) => railY(sOfZ(z));
  const ratlines = (a0, a1, b0, b1, from, to, step) => { const len = a0.distanceTo(a1); for (let d = from; d < len - to; d += step) rope(Rp, L(a0, a1, d / len), L(b0, b1, d / len), 0.018); };
  for (const m of rig.masts) {
    const kk = 0.75 + 0.25 * m.k, zc = (y) => m.at(y, m.off(y)).z;
    for (const sg of [-1, 1]) {
      // lower shrouds, lanyards, ratlines
      const cs = rig.chains.filter((c) => c.m === m && c.sg === sg), sh = cs.filter((c) => c.back < 0);
      const head = (j) => m.at(m.top + 0.7).add(V(sg * 0.3, 0, (j - 2) * 0.07));
      sh.forEach((c, j) => rope(Rp, c.foot, head(j), 0.045));
      for (const c of cs) { rope(Rp, V(c.foot.x - sg * 0.05, c.foot.y, c.z - 0.05), V(c.foot.x - sg * 0.05, c.foot.y - 0.62, c.z + 0.05), 0.02); rope(Rp, V(c.foot.x, c.foot.y - 0.62, c.z), V(c.foot.x - sg * 0.2, c.ry - 1.5, c.z), 0.04); }
      ratlines(sh[0].foot, head(0), sh[sh.length - 1].foot, head(sh.length - 1), 1.5, 1.4, 0.42);
      // futtock and topmast shrouds
      const rim = (j) => V(sg * 1.55 * kk, m.top + 0.1, m.at(m.top).z - 0.75 + j * 0.55), th = (j) => m.at(m.cross - 0.1, -0.45).add(V(sg * 0.22, 0, (j - 1) * 0.06));
      for (let j = 0; j < 3; j++) { rope(Rp, rim(j), th(j), 0.035); rope(Rp, rim(j), m.at(m.top - 2.3).add(V(sg * 0.34, 0, (j - 1) * 0.1)), 0.035); }
      ratlines(rim(0), th(0), rim(2), th(2), 0.8, 1.0, 0.42);
      // topgallant shrouds
      for (const dz of [-0.75, -0.2]) rope(Rp, V(sg * 1.3 * kk, m.cross, m.at(m.cross).z + dz), m.at(lerp(m.head, m.truck, 0.45), -0.8).add(V(sg * 0.1, 0, 0)), 0.025);
      // backstays
      const bt = [m.at(m.cross - 0.4, -0.45), m.at(m.head - 0.2, -0.6), m.at(m.truck - 1.8, -0.8)];
      for (const c of cs) if (c.back >= 0) rope(Rp, c.foot, bt[Math.min(c.back + (m.mizzen ? 1 : 0), 2)].clone().add(V(sg * 0.15, 0, 0)), 0.04);
    }
  }
  // stays
  for (const k in rig.stays) rope(Rp, rig.stays[k][0], rig.stays[k][1], 0.05);
  const dkF = deckY(sOfZ(F.z + 1.2)) + 0.5;
  rope(Rp, M.at(M.top - 0.6, -0.5), V(0, dkF, F.z + 1.3), 0.055);
  rope(Rp, M.at(M.cross - 0.4, -0.75), F.at(13.0, 0.42), 0.045);        // passes ~5 m under the slot crossing
  rope(Rp, M.at(M.head - 0.2, -0.9), F.at(F.head - 0.2, -0.3), 0.035);   // ~6 m over it
  rope(Rp, M.at(M.truck - 2, -0.9), F.at(F.truck - 4, -0.7), 0.028);
  rope(Rp, Z.at(Z.truck - 2, -0.8), M.at(M.cross, 0.3), 0.03);
  // bowsprit gear: bobstay, martingale, back ropes, shrouds and guys
  const cap = rig.bowsprit[1], jb = rig.jibboom[1], dol = V(0, 4.4, -36.95);
  rope(Rp, V(0, cap.y - 0.35, cap.z + 0.2), V(0, 0.9, -25.95), 0.06); rope(Rp, jb, dol, 0.035); rope(Rp, V(0, 8.4, -41), dol, 0.03);
  for (const sg of [-1, 1]) {
    rope(Rp, dol, V(sg * (hb(-24.6) - 0.05), 4.6, -24.6), 0.035);
    rope(Rp, V(0, cap.y - 0.1, cap.z), V(sg * hb(-25.6), 5.9, -25.6), 0.045);
    rope(Rp, jb, V(sg * 3.9, rl(-26) + 0.3, -26.0), 0.03, 0.15);
  }
  // yards: lifts, braces, footropes with stirrups
  for (const y of rig.yards) {
    const m = y.m, fore = m.i === 0, liftTo = m.at(y.c.y + Math.min(5, y.half * 0.5), m.off(y.c.y + 2));
    for (const sg of [-1, 1]) {
      const arm = y.end(sg, 0.98);
      rope(Rp, y.end(sg, 0.96), liftTo.clone().add(V(sg * 0.15, 0, -0.1)), 0.025);
      let to;
      if (fore) to = y.yi === 4 ? M.at(M.head - 0.6, -0.4) : V(sg * (hb(0.6 + y.yi) + 0.05), rl(0.6 + y.yi) + 0.35, 0.6 + y.yi * 0.85);
      else to = y.yi >= 3 ? Z.at(y.yi === 4 ? Z.head : Z.cross - 1, -0.4) : V(sg * (hb(21 + y.yi) + 0.05), rl(21 + y.yi) + 0.35, 21 + y.yi * 0.8);
      rope(Rp, arm, to, 0.028, 0.35 + 0.05 * y.half, 0.1 + rng() * 0.08, 10);
      const fa = y.end(sg, 0.93), fb = y.end(sg, 0.04), sag = 0.5 + y.half * 0.03; fa.y -= 0.12; fb.y -= 0.3;
      rope(Rp, fa, fb, 0.03, sag, 0.02, 8);
      for (const t of [0.25, 0.5, 0.75]) { const q = L(fa, fb, t); rope(Rp, V(q.x, q.y + 0.2, q.z), V(q.x, q.y - sag * 4 * t * (1 - t), q.z), 0.02); }
    }
  }
  // course sheets and tacks (not when clewed up)
  if (!rig.clewed) rig.courseClews.forEach((c, i) => {
    const sg = i % 2 ? 1 : -1;
    rope(Rp, c, V(sg * hb(c.z + 5.5), rl(c.z + 5.5) + 0.2, c.z + 5.5), 0.035, 0.5, 0.08); rope(Rp, c, V(sg * hb(c.z - 5), rl(c.z - 5) + 0.2, c.z - 5), 0.035, 0.6, 0.08);
  });
  // fore-and-aft sheets, gaff and boom gear, halyards
  rig.faClews.forEach((c) => { if (Math.abs(c.x) < 0.01) return; const tz = Math.max(c.z + 4, -25.2); for (const sg of [-1, 1]) rope(Rp, c, V(sg * Math.min(hb(tz) - 0.3, 3.2), rl(tz) + 0.1, tz), 0.028, sg * c.x > 0 ? 0.25 : 0.8, 0.1); });
  const pk = rig.gaff[1], bm = rig.boom[1];
  rope(Rp, L(rig.gaff[0], pk, 0.5), Z.at(Z.cross - 0.5, -0.3), 0.03); rope(Rp, L(rig.gaff[0], pk, 0.95), Z.at(Z.cross + 0.5, -0.3), 0.03);
  rope(Rp, L(rig.boom[0], bm, 0.97), Z.at(Z.cross - 1.5, -0.3), 0.028, 0.3, 0.05);
  for (const sg of [-1, 1]) { rope(Rp, pk, V(sg * hb(26.3), rl(26.3) + 0.2, 26.3), 0.026, 0.5, 0.14); rope(Rp, L(rig.boom[0], bm, 0.8), V(sg * 0.9, deckY(sOfZ(26.6)) + 0.3, 26.6), 0.035, 0.1, 0.04); }
  rope(Rp, pk, V(0.4, rl(27.5) + 0.2, 27.5), 0.018, 0.25, 0.12);
  for (const m of rig.masts) rope(Rp, m.at(m.truck - 0.2, -0.8), V(0.5, deckY(sOfZ(m.z)) + 1.2, m.z + 0.6), 0.016, 0, 0.05, 6);
}
function ropeGeometry(Rp) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(Rp.p, 3)); g.setAttribute('aO', new THREE.Float32BufferAttribute(Rp.o, 3));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(Rp.a, 4)); g.setIndex(Rp.idx);
  return g;
}

// ---------------------------------------------------------------- shaders
const FOG_V = '#include <fog_pars_vertex>', FOG_F = '#include <fog_pars_fragment>';
const SOLID_VS = /* glsl */`
attribute vec3 aCol; attribute vec4 aAux;      // aux: material, sea-light occlusion, u, v
uniform float uMsTime;
varying vec3 vN, vW, vC, vL; varying vec4 vAux;
${FOG_V}
void main(){
  vec3 p = position;
  if (aAux.x > 2.5) { float w = aAux.z; p.x += w*0.05*sin(uMsTime*0.8 + position.z*3.0); p.z += w*0.04*sin(uMsTime*0.6 + position.x*2.0); }
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vW = wp.xyz; vL = p; vC = aCol; vAux = aAux; vN = mat3(modelMatrix)*normal;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SOLID_FS = /* glsl */`
${SWELL_GLSL}
${LIGHT_GLSL}
uniform float uBoot, uHawseU;
varying vec3 vN, vW, vC, vL; varying vec4 vAux;
${FOG_F}
void main(){
  vec2 uv = vAux.zw; vec2 fw = fwidth(uv) + 1e-4;
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  float mat = vAux.x; float hullM = step(0.5, mat)*(1.0 - step(1.5, mat));
  vec3 alb = vC;
  float h = vW.y - uMsSeaY - msSwell(vW.xz);
  // plating: in-and-out strakes whose lower laps catch the light, butts, rivet rows
  float sv = uv.y/1.15, row = floor(sv), fr = sv - row, outS = mod(row, 2.0);
  float fadeP = 1.0 - smoothstep(0.12, 0.5, fw.y);
  float edge = min(fr, 1.0 - fr)*1.15;
  float lap = (1.0 - smoothstep(0.0, 0.05 + fw.y, edge))*fadeP;
  float bf = 3.2 - abs(fract((uv.x + row*2.7)/6.4) - 0.5)*6.4;
  float butt = (1.0 - smoothstep(0.0, 0.03 + fw.x, bf))*(1.0 - smoothstep(0.12, 0.5, fw.x));
  vec2 rv = vec2(fract(uv.x/0.24) - 0.5, (edge - 0.1)/0.24);
  float riv = (1.0 - smoothstep(0.13, 0.22, length(rv)))*(1.0 - smoothstep(0.03, 0.1, fw.x));
  float n1 = msN(uv*vec2(0.7, 1.6)), n2 = msN(uv*3.1 + 7.0), n3 = msN(vec2(uv.x*1.9, 3.0));
  // boot-top: verdigris copper, weed and barnacle beard at the waterline
  float cop = 1.0 - smoothstep(-0.04, 0.04, vL.y - uBoot - 0.06*sin(uv.x*0.9));
  vec3 verd = mix(vec3(0.03, 0.09, 0.075), vec3(0.11, 0.26, 0.2), n1)*(0.5 + 0.8*n2);
  float weed = (1.0 - smoothstep(0.0, 0.25 + 0.5*n3, abs(vL.y - 0.05)))*smoothstep(0.3, 0.6, msN(uv*vec2(5.0, 2.0)));
  // rust weeping from the hawse pipes and scuppers
  float hx = (mod(uv.x, 100.0) - uHawseU)/0.2;
  float rust = exp(-hx*hx)*smoothstep(1.6, 1.9, uv.y)*(1.0 - smoothstep(1.9, 6.5, uv.y));
  float sx = (abs(fract(uv.x/4.7) - 0.5)*4.7 - 0.0)/0.1; sx = 2.35/0.1 - sx;
  rust += 0.6*exp(-sx*sx*0.3)*smoothstep(1.25, 1.45, uv.y)*(1.0 - smoothstep(1.45, 3.2 + 2.0*n3, uv.y))*step(0.2, n3);
  vec3 hullAlb = alb*(0.9 + 0.22*outS*fadeP)*(0.85 + 0.3*n2)*(1.0 - 0.4*butt)*(1.0 + 0.45*riv);
  hullAlb = mix(hullAlb, vec3(0.2, 0.075, 0.03)*(0.6 + 0.8*n2), clamp(rust, 0.0, 1.0)*0.85);
  hullAlb = mix(hullAlb, verd, cop); hullAlb = mix(hullAlb, vec3(0.01, 0.028, 0.02), weed*0.85);
  alb = mix(alb, hullAlb, hullM);
  N = normalize(N + vec3(0.0, -1.0, 0.0)*hullM*(lap*(0.35 + 0.5*outS) + riv*0.25));
  vec3 col = alb*msUnder(N, vAux.y, vW.y - uMsSeaY);
  col += (alb*1.25 + vec3(0.008, 0.006, 0.004))*msLamps(vL, N, 0.06)*smoothstep(0.2, 1.2, h);     // lantern light: warm pools on deck, houses, mast feet
  // under water the light is the luminous top of the sea: the upper strakes and boot-top glow
  // verdigris-jade, and the light dies with depth and as the bilge turns away, down to a black keel
  float dep = clamp(-h, 0.0, 14.0);
  float upL = clamp(0.5 + 0.5*N.y, 0.0, 1.0);
  // (the glowing layer is the top 5 m of the sea: inside it the plating takes light from every side, so the bilge
  // turns from lit to dark round its curve; under it a little still comes down past the hull's sides)
  float subL = (exp(-dep/2.6)*(0.1 + 0.9*upL) + 0.045*exp(-dep/9.0)*(0.3 + 0.7*upL))*(0.82 + 0.3*msN(vW.xz*0.11 + uMsTime*0.015));
  vec3 sub = (alb + vec3(0.002, 0.006, 0.005))*uMsGlow*msGain(0.0)*subL*3.2;
  // seen from far off under water she is a black lens against the ceiling: the lit copper only shows on the close pass
  sub *= 1.0 - 0.82*smoothstep(44.0, 60.0, distance(cameraPosition, vW))*step(cameraPosition.y, uMsSeaY);
  col = mix(sub, col, smoothstep(-0.35, 0.0, h));
  // the wet strake and the moving jade lap line
  float wob = 0.07*sin(uv.x*2.1 + uMsTime*1.7) + 0.05*sin(uv.x*5.3 - uMsTime*2.6);
  float lapl = smoothstep(-0.1, 0.0, h)*(1.0 - smoothstep(0.1 + wob, 0.2 + wob, h));
  float wet = smoothstep(-0.05, 0.05, h)*(1.0 - smoothstep(0.2, 1.3, h));
  col += hullM*uMsGlow*msGain(0.0)*(lapl*0.55*(0.7 + 0.3*sin(uv.x*9.0 + uMsTime*3.1)) + wet*0.03);
  if (mat > 1.5 && mat < 2.5) col = vC*4.0;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
const SAIL_FN = /* glsl */`
uniform float uRoll;
float msSailD(vec2 m, vec2 uv, vec4 sd, float ph){
  float u = uv.x, v = max(uv.y, 0.0), seed = sd.x, kind = sd.y, t = uRoll;
  float flagD = sd.z*pow(v, 0.8)*(0.34*sin(m.y*1.15 - t*3.1 + seed) + 0.14*sin(m.y*2.9 - t*5.3 + seed*2.0) + 0.5*v*sin(t + ph - v*2.4));
  float envV = pow(v, 0.7);
  float lf = 0.5 + 0.5*u;
  float pin = kind > 0.5 ? lf*(1.0 - 0.5*smoothstep(0.45, 1.0, u)) : 1.0 - 0.55*pow(abs(u), 6.0);      // (fore-and-aft: the folds ease toward the leech, so its edge hangs in a clean curve)
  float wob = 0.6*sin(v*2.3 + seed*5.0);
  float f = 0.16*sin(m.x*3.3 + seed*17.0 + wob) + 0.07*sin(m.x*5.9 + seed*31.0 - wob*1.7 + v*1.5) + 0.2*sin(m.x*1.45 + seed*7.0 + wob*0.5);
  f += step(0.5, kind)*(0.15*sin(m.x*2.1 + m.y*1.5 + seed*3.0) + 0.08*sin(m.x*4.3 - m.y*0.9 + seed*11.0));
  float sl = t + ph - v*1.3;
  float belly = sd.w*sin(3.14159*pow(v, 0.8))*(1.0 - 0.7*u*u)*(kind > 0.5 ? 0.55 + 0.75*sin(sl) : 0.68 + 0.62*sin(sl));
  float rip = 0.08*sin(v*11.0 - t*2.0 + m.x*0.6 + seed*3.0)*(0.4 + 0.6*cos(sl));
  float d = (f + rip)*sd.z*envV*pin + belly*(kind > 0.5 ? lf : 1.0);
  return kind > 1.5 ? flagD : d;
}`;
const SAIL_VS = /* glsl */`
attribute vec2 aUV; attribute vec4 aMet; attribute vec3 aN; attribute vec3 aTu; attribute vec4 aSd; attribute vec2 aPh;
varying vec2 vUV, vPh; varying vec4 vMet, vSd; varying vec3 vN, vTu, vW;
${SAIL_FN}
${FOG_V}
void main(){
  float d = msSailD(aMet.xy, aUV, aSd, aPh.x);
  vec4 wp = modelMatrix*vec4(position + aN*d, 1.0);
  vUV = aUV; vPh = aPh; vMet = aMet; vSd = aSd; vW = wp.xyz;
  vN = mat3(modelMatrix)*aN; vTu = mat3(modelMatrix)*aTu;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SAIL_FS = /* glsl */`
${LIGHT_GLSL}
${SAIL_FN}
uniform float uMsTime;
varying vec2 vUV, vPh; varying vec4 vMet, vSd; varying vec3 vN, vTu, vW;
${FOG_F}
float msPatch(vec2 uvm, vec2 c, vec2 size, float fx){ vec2 q = abs(uvm - c) - size; return 1.0 - smoothstep(-fx, fx, max(q.x, q.y)); }
void main(){
  vec2 m = vMet.xy; float half_ = max(vMet.z, 0.05), drop = max(vMet.w, 0.3);
  float u = vUV.x, v = vUV.y, seed = vSd.x, kind = vSd.y;
  float fx = fwidth(m.x) + 1e-4, fy = fwidth(m.y) + 1e-4, fxy = max(fx, fy);
  float sq = 1.0 - step(0.5, kind), flg = step(1.5, kind);
  // normal of the folded cloth
  float e = 0.07, d0 = msSailD(m, vUV, vSd, vPh.x);
  float dx = (msSailD(m + vec2(e, 0.0), vUV + vec2(e/max(half_, 0.5), 0.0), vSd, vPh.x) - d0)/e;
  float dy = (msSailD(m + vec2(0.0, e), vUV + vec2(0.0, e/drop), vSd, vPh.x) - d0)/e;
  vec3 n0 = normalize(vN + vec3(1e-5, 0.0, 0.0)), tu = normalize(vTu + vec3(0.0, 0.0, 1e-5)), tv = cross(n0, tu);
  vec3 N = normalize(n0 - tu*dx - tv*dy);
  float face = dot(N, cameraPosition - vW) >= 0.0 ? 1.0 : -1.0;
  float sN = N.y*face;
  float lit = 2.0*max(0.5 - 0.5*sN, 0.7*(0.5 + 0.5*sN));           // thin canvas: the lit face shows through
  lit = clamp(1.0 + (lit - 1.0)*1.9, 0.4, 1.3);
  float sh = clamp(0.95 - 0.5*abs(dx) + 0.2*dx*face, 0.22, 1.1);  // fold flanks fall into shadow
  float foot = mix(mix(0.74, 1.0, v), mix(0.55, 1.0, pow(max(v, 0.0), 1.4)), sq);
  // cloths, seams, tabling, bolt rope
  float cl = m.x/0.6 + seed, fadeX = 1.0 - smoothstep(0.1, 0.32, fx);
  float sf = abs(fract(cl + 0.5) - 0.5)*0.6;
  float seam = (1.0 - smoothstep(0.018, 0.022 + fx, sf))*fadeX;
  float tone = 0.9 + 0.2*msH(vec2(floor(cl + 0.5), seed))*fadeX;
  float ex = (1.0 - abs(u))*half_, ey1 = (1.0 - v)*drop, eMin = min(ex, min(m.y*1.3, ey1));
  float tab = 1.0 - smoothstep(0.22, 0.25 + fxy, eMin);
  float bolt = 1.0 - smoothstep(0.035, 0.05 + fxy, min(ex, ey1));
  // reef bands and pattering reef points
  float hasReef = sq*step(0.5, vPh.y), y1 = drop*0.24, y2 = drop*0.42, fadeY = 1.0 - smoothstep(0.1, 0.3, fy);
  float band = max(1.0 - smoothstep(0.07, 0.09 + fy, abs(m.y - y1)), 1.0 - smoothstep(0.07, 0.09 + fy, abs(m.y - y2)))*hasReef;
  float ry = m.y - (m.y > y2 ? y2 : y1), cid = floor(cl);
  float pin = smoothstep(0.0, 0.03, ry)*(1.0 - smoothstep(0.42, 0.5, ry));
  float px = (fract(cl) - 0.5)*0.6 + 0.07*sin(uMsTime*2.6 + cid*1.7 + seed)*ry*2.0;
  float pts = (1.0 - smoothstep(0.014, 0.02 + fx, abs(px)))*pin*hasReef*fadeX;
  // buntlines drawn across the lit canvas
  float bu = u;
  float bd = min(abs(abs(bu) - 0.3), abs(abs(bu) - 0.66))*half_;
  float bunt = (1.0 - smoothstep(0.02, 0.03 + fx, bd))*sq*(1.0 - smoothstep(0.25, 0.7, fx));
  // patches and weathering
  vec2 uvm = vec2(u*half_, v*drop);
  vec2 c1 = vec2((msH(vec2(seed, 1.0))*1.3 - 0.65)*half_, (0.25 + 0.6*msH(vec2(seed, 2.0)))*drop);
  vec2 c2 = vec2((msH(vec2(seed, 3.0))*1.3 - 0.65)*half_, (0.2 + 0.7*msH(vec2(seed, 4.0)))*drop);
  float p1 = msPatch(uvm, c1, vec2(0.55, 0.8), fxy), p1i = msPatch(uvm, c1, vec2(0.49, 0.74), fxy);
  float p2 = msPatch(uvm, c2, vec2(0.9, 0.5), fxy), p2i = msPatch(uvm, c2, vec2(0.84, 0.44), fxy);
  float patchTone = (1.0 - 0.3*(p1 - p1i) - 0.14*p1i)*(1.0 - 0.3*(p2 - p2i) + 0.1*p2i);
  float stain = 0.86 + 0.2*msN(m*0.55 + seed*10.0) - 0.12*msN(vec2(m.x*2.6 + seed, m.y*0.22));
  float detail = (1.0 - 0.32*seam)*tone*(1.0 - 0.2*tab)*(1.0 - 0.5*bolt)*(1.0 - 0.28*band)*(1.0 - 0.55*pts)*(1.0 - 0.7*bunt)*patchTone*stain;
  // flags: darker bunting, the ensign with a canton
  float canton = flg*step(0.5, vPh.y)*step(u, 0.0)*step(v, 0.5);
  detail = mix(detail, (0.55 - 0.3*canton)*stain, flg);
  vec3 base = msSailCol(vW.y - uMsSeaY)*0.86*foot*lit*(0.92 + 0.16*msH(vec2(seed, 9.0)));
  vec3 col = mix(base*0.13 + vec3(0.002, 0.004, 0.008), base, sh)*detail;
  col += 0.36*detail*(0.55 + 0.45*sh)*msLamps(vW, N*face, 0.6);      // the lanterns warm the feet of the lower sails
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
const ROPE_VS = /* glsl */`
attribute vec3 aO; attribute vec4 aA;      // other end of the segment; side, width * direction, sway, phase
uniform float uMsTime, uResY;
varying float vAl, vY;
${FOG_V}
void main(){
  vec3 off = vec3(sin(uMsTime*0.9 + aA.w), 0.2*sin(uMsTime*1.3 + aA.w*2.0), cos(uMsTime*0.7 + aA.w*1.3))*aA.z;
  vec4 wp = modelMatrix*vec4(position + off, 1.0); vY = wp.y;
  vec4 mvPosition = viewMatrix*wp; vec4 mo = modelViewMatrix*vec4(aO + off, 1.0);
  float dist = max(-mvPosition.z, 0.05);
  vec2 dir = (mo.xy/max(-mo.z, 0.05) - mvPosition.xy/dist)*sign(aA.y);
  dir = dir/max(length(dir), 1e-6);
  float px = dist*2.0/(projectionMatrix[1][1]*max(uResY, 1.0));
  float w = abs(aA.y), ww = max(w, 1.5*px); vAl = w/ww;
  mvPosition.xy += vec2(-dir.y, dir.x)*aA.x*ww*0.5;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ROPE_FS = /* glsl */`
${LIGHT_GLSL}
varying float vAl, vY;
${FOG_F}
void main(){
  float y = vY - uMsSeaY, occ = clamp((y - 4.5)/7.0, 0.12, 1.0);
  gl_FragColor = vec4(uMsGlow*msGain(y)*0.085*occ + uMsSky*0.1, vAl);
  #include <fog_fragment>
}`;
const GLOW_VS = /* glsl */`
attribute vec2 aC; attribute vec3 aCol; uniform float uMsTime; varying vec2 vC; varying vec3 vCol;
void main(){
  vC = aC; vCol = aCol*(0.93 + 0.07*sin(uMsTime*6.3 + aCol.g*40.0));
  vec4 mv = modelViewMatrix*vec4(position, 1.0); mv.xy += aC*1.8;
  gl_Position = projectionMatrix*mv;
}`;
const GLOW_FS = /* glsl */`
varying vec2 vC; varying vec3 vCol;
void main(){
  float r2 = dot(vC, vC), edge = 1.0 - smoothstep(0.55, 1.0, r2);
  gl_FragColor = vec4(vCol*(3.4*exp(-r2*90.0) + 1.1*exp(-r2*14.0) + 0.22*exp(-r2*3.2))*edge, 1.0);
}`;
const CONTACT_VS = /* glsl */`
${SWELL_GLSL}
uniform float uMsSeaY;
varying vec3 vW; varying float vFade;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.0);
  wp.y = uMsSeaY + msSwell(wp.xz) + 0.04;
  vW = wp.xyz;
  vFade = (1.0 - smoothstep(0.72, 1.0, abs(position.x)/75.0))*(1.0 - smoothstep(0.78, 1.0, abs(position.z - 14.0)/95.0));
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const CONTACT_FS = /* glsl */`
${SWELL_GLSL}
${LIGHT_GLSL}
uniform mat4 uShipInv; uniform vec4 uSt0, uSt1; uniform vec3 uLampP, uLampS, uColP, uColS; uniform vec2 uGate; uniform float uRefl;
varying vec3 vW; varying float vFade;
vec2 msStack(vec3 q, vec3 R, vec4 st){
  float rz = abs(R.z) < 1e-3 ? 1e-3 : R.z, t = (st.x - q.z)/rz;
  vec3 hp = q + R*t;
  float f = clamp((hp.y - st.y)/max(st.z - st.y, 1.0), 0.0, 1.0), hw = mix(st.w, st.w*0.46, f);
  float mk = step(0.0, t)*(1.0 - smoothstep(hw - 2.5, hw + 1.5, abs(hp.x)))*smoothstep(st.y - 1.0, st.y + 1.0, hp.y)*(1.0 - smoothstep(st.z - 2.5, st.z + 0.5, hp.y));
  return vec2(mk, hp.y);
}
float msStreak(vec2 P, vec2 F, vec2 C, float t){
  vec2 d = C - F; d = d/max(length(d), 1e-3);
  vec2 r = P - F; float a = dot(r, d), b = dot(r, vec2(-d.y, d.x));
  b += (0.42*sin(a*0.9 - t*2.0) + 0.16*sin(a*2.7 + t*3.0))*clamp(a/15.0, 0.0, 1.0);
  float w = 0.42 + 0.045*max(a, 0.0);
  return exp(-b*b/(w*w))*smoothstep(0.2, 2.5, a)*(1.0 - smoothstep(12.0, 24.0, a))*(0.65 + 0.35*sin(a*4.0 - t*5.0));
}
void main(){
  vec3 q = (uShipInv*vec4(vW, 1.0)).xyz; float tt = uMsTime;
  // slick of calmer, darker water hugging the hull; dark wake band astern
  float f = pow(abs(q.x)/5.3, 2.2) + pow(abs(q.z + 0.3)/29.5, 2.6);
  float d = (pow(max(f, 1e-4), 0.42) - 1.0)*5.3;
  float nz = msN(vW.xz*0.35 + tt*0.05), nz2 = msN(vW.xz*1.3 - tt*0.1);
  float slick = 1.0 - smoothstep(0.0, 3.2 + 2.2*nz, d);
  float wz = q.z - 24.0, ww = 3.6 + 0.08*max(wz, 0.0);
  float wx = q.x + 1.5*sin(wz*0.07 + 1.0)*clamp(wz/30.0, 0.0, 1.0);
  float wake = exp(-wx*wx/(ww*ww))*smoothstep(0.0, 8.0, wz)*(1.0 - smoothstep(30.0, 58.0, wz))*(0.55 + 0.45*nz2);
  float dark = clamp(slick*0.62 + wake*0.42, 0.0, 0.8);
  // the sail stacks mirrored in rippled water (analytic: ray against each mast's sail plane)
  vec3 Vd = normalize(vW - cameraPosition);
  vec2 rp = vec2(sin(vW.x*2.1 + tt*1.4 + sin(vW.z*1.3)) + 0.6*sin(vW.x*4.7 - tt*2.1 + vW.z*3.3), sin(vW.z*1.9 - tt*1.2 + sin(vW.x*1.1)) + 0.6*sin(vW.z*5.1 + tt*1.8 - vW.x*2.7));
  vec3 Nw = normalize(vec3(rp.x*0.045, 1.0, rp.y*0.045));
  vec3 R = reflect(Vd, Nw); R.y = abs(R.y);
  vec3 Rs = mat3(uShipInv)*R;
  vec2 s0 = msStack(q, Rs, uSt0), s1 = msStack(q, Rs, uSt1);
  vec2 s = s0.x > s1.x ? s0 : s1;
  float rx = abs(Rs.x) < 1e-3 ? 1e-3 : Rs.x, tf = -q.x/rx; vec3 hp = q + Rs*tf;
  float jib = smoothstep(-46.0, -41.0, hp.z)*(1.0 - smoothstep(-17.5, -15.5, hp.z))*smoothstep(8.0, 9.5, hp.y)*(1.0 - smoothstep(-2.5, 0.0, hp.y - (9.5 + (hp.z + 46.0)*0.7)));
  float spk = smoothstep(19.5, 20.5, hp.z)*(1.0 - smoothstep(29.0, 31.5, hp.z))*smoothstep(7.2, 8.2, hp.y)*(1.0 - smoothstep(-1.5, 0.5, hp.y - (15.0 + (hp.z - 19.5)*0.55)));
  float faM = step(0.0, tf)*max(jib, spk)*0.75;
  float om = 1.0 - clamp(dot(-Vd, Nw), 0.0, 1.0), fres = 0.04 + 0.96*om*om*om*om*om;
  float above = step(uMsSeaY, cameraPosition.y);
  vec3 add = (msSailCol(s.y)*s.x + msSailCol(hp.y)*faM*(1.0 - s.x))*fres*uRefl*above;
  // sidelight streaks reach toward the eye
  add += (uColP*msStreak(vW.xz, uLampP.xz, cameraPosition.xz, tt)*uGate.x + uColS*msStreak(vW.xz, uLampS.xz, cameraPosition.xz, tt + 1.7)*uGate.y)*above;
  gl_FragColor = vec4(add*vFade, dark*vFade);
}`;
const SEA_VS = /* glsl */`
${SWELL_GLSL}
uniform float uMsSeaY;
varying vec3 vW;
${FOG_V}
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.0);
  wp.y = uMsSeaY + msSwell(wp.xz)*(1.0 - smoothstep(600.0, 1500.0, length(position.xz)));
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SEA_FS = /* glsl */`
${LIGHT_GLSL}
uniform float uMsTime; uniform vec3 uLane;
varying vec3 vW;
${FOG_F}
float msFbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a*msN(p); p = p*2.03 + 17.3; a *= 0.5; } return s; }
void main(){
  vec2 p = vW.xz; float t = uMsTime, dist = length(vW - cameraPosition);
  vec2 q = vec2(msFbm(p/210.0 + t*0.002), msFbm(p/210.0 + 5.2 - t*0.002));
  float f = msFbm(p/95.0 + 2.4*q + vec2(0.0, 3.1));
  float mask = smoothstep(0.43, 0.57, f)*(0.75 + 0.25*smoothstep(0.3, 0.7, msFbm(p/23.0 - q*1.5)));
  float cat = 1.0 - 0.3*smoothstep(0.5, 0.7, msFbm(p/55.0 + t*0.03 + 9.0));
  float near = 1.0 - smoothstep(60.0, 260.0, dist);
  float rip = 1.0 - 0.16*near*(msN(p*1.7 + vec2(t*0.6, 0.0)) + 0.6*msN(p*4.3 - vec2(0.0, t*0.9)) - 0.6);
  vec3 col = mix(uLane, uMsFoot*0.66, mask)*cat*rip*uMsWave.z;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const hexes = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = hexes.map((h) => new THREE.Color(h));
  const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b);
  const C = {
    iron: lin(0.042, 0.046, 0.052), iron2: lin(0.06, 0.062, 0.066), deck: lin(0.07, 0.06, 0.05), rail: lin(0.17, 0.15, 0.12), strake: lin(0.1, 0.105, 0.11),
    gilt: lin(0.5, 0.4, 0.2), board: lin(0.36, 0.33, 0.27), wood: lin(0.2, 0.14, 0.09), house: lin(0.42, 0.42, 0.4), boat: lin(0.62, 0.62, 0.58), canvas: lin(0.4, 0.38, 0.32),
    rudder: lin(0.016, 0.024, 0.022), mast: lin(0.5, 0.48, 0.42), mastDark: lin(0.12, 0.11, 0.1), spar: lin(0.36, 0.3, 0.2), figure: lin(0.025, 0.025, 0.03),
    red: pal[6].clone(), green: new THREE.Color(opts.starboardGreen || '#2BFF8A'),
    amber: lin(0.95, 0.5, 0.15), pane: lin(0.2, 0.1, 0.028),
  };
  const U = {
    uMsTime: { value: 0 }, uMsGlow: { value: pal[0].clone().lerp(pal[1], 0.45).multiplyScalar(1.6) }, uMsSky: { value: pal[3].clone().multiplyScalar(0.3) },
    uMsWave: { value: V(0, 0, opts.glow ?? 1) }, uMsFoot: { value: pal[0].clone().lerp(pal[1], 0.28) }, uMsDusk: { value: pal[4].clone() }, uMsSeaY: { value: 0 }, uRoll: { value: 0 }, uMsWarm: { value: lin(1.0, 0.47, 0.12) },
    uMsLamp: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -99, 0, 0)) }, uMsAmp: { value: opts.swell === false ? 0 : (typeof opts.swell === 'number' ? opts.swell : 1) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...fogU(), ...U, ...extra }, fog: true, side: THREE.DoubleSide, ...o });

  const pause = async () => { if (ctx.yield) await ctx.yield(); };
  const root = new THREE.Group(); root.name = 'milky-sea-barque';
  const ship = new THREE.Group(); ship.name = 'ship'; root.add(ship);
  const rig = makeRig(rng.fork('rig'), opts);
  await pause();

  // hull, deck gear, spars: one mesh
  const A = makeAcc();
  await buildHull(A, C, rig, rng.fork('hull'), pause);
  await pause();
  const people = await buildDeck(A, C, rig, rng.fork('deck'), pause);
  if (opts.lanterns !== false) people.lamps.forEach((q, i) => U.uMsLamp.value[i].copy(q));
  await pause();
  await buildSpars(A, C, rig, pause);
  await pause();
  const solidGeo = accGeometry(A);
  await pause();
  const solid = new THREE.Mesh(solidGeo, mat(SOLID_VS, SOLID_FS, { uBoot: { value: rng.range(0.45, 0.85) }, uHawseU: { value: rig.hawseU || 55 } }));
  ship.add(solid);
  await ctx.yield?.();

  // sails
  const S = makeSailAcc();
  await buildSails(S, rig, rng.fork('sails'), detail, pause);
  await pause();
  const sailGeo = sailGeometry(S);
  await pause();
  const sails = new THREE.Mesh(sailGeo, mat(SAIL_VS, SAIL_FS));
  ship.add(sails);
  await ctx.yield?.();

  // rigging
  const Rp = makeRopeAcc();
  buildRigging(Rp, rig, rng.fork('ropes'));
  await pause();
  const ropeU = { uResY: { value: 1080 } };
  const ropes = new THREE.Mesh(ropeGeometry(Rp), mat(ROPE_VS, ROPE_FS, ropeU, { transparent: true, depthWrite: false }));
  ropes.renderOrder = 3; ropes.frustumCulled = false; ship.add(ropes);
  await pause();

  // sidelight glows
  const lampP = rig.lamp(-1), lampS = rig.lamp(1), gp = [], gc = [], gcol = [];
  const glowList = [[lampP, C.red], [lampS, C.green], ...people.lamps.map((q) => [q, lin(0.62, 0.3, 0.085)])];
  for (const [p, c] of glowList) for (const q of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { gp.push(p.x, p.y, p.z); gc.push(q[0], q[1]); gcol.push(c.r, c.g, c.b); }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('aC', new THREE.Float32BufferAttribute(gc, 2)); gg.setAttribute('aCol', new THREE.Float32BufferAttribute(gcol, 3));
  gg.setIndex(glowList.flatMap((_, i) => [0, 1, 2, 0, 2, 3].map((k) => i * 4 + k)));
  const glows = new THREE.Mesh(gg, new THREE.ShaderMaterial({ vertexShader: GLOW_VS, fragmentShader: GLOW_FS, uniforms: { uMsTime: U.uMsTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glows.renderOrder = 4; glows.frustumCulled = false; ship.add(glows);
  await ctx.yield?.();

  // water layer: slick, wake, mirrored sails, sidelight streaks
  const F = rig.masts[0], M = rig.masts[1];
  const conU = {
    uShipInv: { value: new THREE.Matrix4() }, uSt0: { value: new THREE.Vector4(F.z - 0.5, 8.0, F.truck - 0.5, 11.4) }, uSt1: { value: new THREE.Vector4(M.z - 0.5, 7.5, M.truck - 0.5, 11.6) },
    uLampP: { value: lampP.clone() }, uLampS: { value: lampS.clone() }, uColP: { value: C.red.clone().multiplyScalar(3.5) }, uColS: { value: C.green.clone().multiplyScalar(2.2) },
    uGate: { value: new THREE.Vector2(1, 1) }, uRefl: { value: 0.5 },
  };
  let contact = null;
  if (opts.contact !== false) {
    const cg = new THREE.PlaneGeometry(150, 190, 38, 48); cg.rotateX(-Math.PI / 2); cg.translate(0, 0, 14);
    contact = new THREE.Mesh(cg, new THREE.ShaderMaterial({
      vertexShader: CONTACT_VS, fragmentShader: CONTACT_FS, uniforms: { ...U, ...conU }, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    contact.renderOrder = 2; contact.frustumCulled = false; root.add(contact);
  }
  await pause();
  // demo sea (the world brings its own)
  let sea = null;
  if (opts.sea !== false) {
    const radii = [0]; for (let i = 1; i <= 44; i++) radii.push(i * 2.5); while (radii[radii.length - 1] < 3200) radii.push(radii[radii.length - 1] * 1.17);
    const SEG = 72, sp = [], si = [];
    radii.forEach((r) => { for (let k = 0; k < SEG; k++) { const a = k / SEG * Math.PI * 2; sp.push(Math.cos(a) * r, 0, Math.sin(a) * r); } });
    for (let i = 0; i < radii.length - 1; i++) for (let k = 0; k < SEG; k++) { const a = i * SEG + k, b = i * SEG + (k + 1) % SEG; si.push(a, b, a + SEG, b, b + SEG, a + SEG); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
    sea = new THREE.Mesh(sg, mat(SEA_VS, SEA_FS, { uLane: { value: pal[2].clone().lerp(pal[1], 0.22) } }));
    sea.frustumCulled = false; sea.renderOrder = -0.5; root.add(sea);
  }

  // ---- motion
  const rollAmp = (opts.rollDeg ?? 4) * Math.PI / 180, phase0 = rng.range(0, 6.28);
  let rollOverride = null;
  const size = new THREE.Vector2(), tmp = V(0, 0, 0);
  function update(dt, time, camera) {
    U.uMsTime.value = time;
    const ph = rollOverride !== null ? rollOverride : time * SW.w1 + phase0;
    U.uRoll.value = ph;
    root.updateWorldMatrix(true, false);
    const e = root.matrixWorld.elements; U.uMsSeaY.value = e[13];
    ship.position.y = 0.8 * U.uMsAmp.value * swellHeight(e[12], e[14], time);
    ship.rotation.set(rollAmp * 0.25 * Math.sin(ph * 0.83 + 1.1), 0, rollAmp * (Math.sin(ph) + 0.1 * Math.sin(2.3 * ph + 1.0)));
    root.updateMatrixWorld(true);
    conU.uShipInv.value.copy(ship.matrixWorld).invert();
    conU.uLampP.value.copy(lampP).applyMatrix4(ship.matrixWorld); conU.uLampS.value.copy(lampS).applyMatrix4(ship.matrixWorld);
    if (camera) { tmp.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(conU.uShipInv.value); conU.uGate.value.set(smoothstep(1.5, 5, -tmp.x), smoothstep(1.5, 5, tmp.x)); }
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); ropeU.uResY.value = size.y; }
  }
  update(0, 0, null);

  const P = (a) => V(a[0], a[1], a[2]);
  const anchors = {
    portalSeat: { position: V(0, 7.2, -146), normal: V(0, 0, 1), radius: 7 },
    flyThrough: [[-20, 0, 36], [-19, 10, 16], [-17, 20, 0], [-6, 25, -5.5], [8, 28, -5.5], [25.9, 32.8, -0.9], [36.5, 36.6, 10.4], [40, 42, 35.4], [40, 44.1, 46.35], [36.8, 45.5, 54.1], [29, 46.9, 57.35], [21.2, 48.1, 54.1], [18, 49.2, 46.35], [15.5, 51.5, 22.3], [12.5, 52, 10], [10, 48.5, -13], [6.6, 29, -45], [1.8, 10.2, -75], [0, 7.5, -91], [0, 7.2, -114], [0, 7.2, -146]].map(P),
    slot: { center: V(0, 26.5, -5.5), halfGap: 7 },
    viewpoints: { underKeel: V(-36, -12, 64), surfaceBreak: V(-20, 0.6, 36), portSide: V(-19, 10, 16), slot: V(-6, 25, -5.5), quarter: V(40, 42, 35.4), top: V(12.5, 52, 10), bowsprit: V(0, 30, -50) },
    trucks: rig.masts.map((m) => m.at(m.truck, -0.8)), mainTop: V(0, 18, 3), foredeck: V(0, 10, -10),
    sidelights: { port: lampP.clone(), starboard: lampS.clone() }, lamps: people.lamps.map((q) => V(q.x, q.y, q.z)),
    hawse: hullPoint(0.945, 0.86, V(0, 0, 0)).multiply(V(-1, 1, 1)), stern: V(0, 5.6, 28), stem: V(0, 7.0, -28.5), jibBoomEnd: rig.jibboom[1].clone(), keel: V(0, KEEL, 0),
    helm: people.helm, lookout: people.lookout, railHands: people.hands, pennantTip: rig.pennant.tip, wakeEnd: V(0, 0, 80), waterline: { length: 53, beam: 10 },
  };
  const R = 30, H = 46, center = V(0, 19, -3);
  return {
    object: root, ship, radius: R, height: H, center, anchors, update,
    setRollPhase(p) { rollOverride = (p === null || p === undefined) ? null : p; },
    setGlow(g) { U.uMsWave.value.z = g; },
    setGlowWave(amount, phase) { U.uMsWave.value.x = amount; U.uMsWave.value.y = phase; },
    swellHeight, swellGLSL: SWELL_GLSL, uniforms: U, clewed: rig.clewed,
    toWorld(v, out = V(0, 0, 0)) { return out.copy(v).applyMatrix4(ship.matrixWorld); },
    dispose() {},
    ground: sea ? false : true, groundY: -0.3,
  };
}
