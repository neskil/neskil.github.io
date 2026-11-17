// The Cold Wake: hero set piece, "the river of fire".
// A 4,600 km cap of the Earth (1 unit = 1 km, radius 6371) drawn as a living false-colour thermal image.
// Exports
//   THERMAL_GLSL            shared style GLSL: the analytic temperature field and the 24-step ramp. The field is a
//                           signed distance d to the warm water (+ inside), built as smooth unions: the jet's north
//                           wall (travelling meanders, kind-specific bends), three warm rings (uRing[0..2]; [0] is the
//                           loop that pinches off, joined to the wall by the neck capsule uNeck), one cold-core ring or
//                           attached cold tongue (uRing[3]); T is a profile of d (cold shelf, sharp wall, magenta core,
//                           orange then yellow shoulder, Sargasso swirls; the warm side never falls under ramp step
//                           14, so there is no olive anywhere on it), then the cold wake is printed on it: one teal
//                           step with a hard shoulder and a flat cobalt ribbon inside. Above 450 km (thi()) the
//                           magenta band is 175 km wide with long cooler strands lying along it, and the same graded
//                           orange-to-yellow shoulder starts beyond it. Below 450 km (tlo()) the close-pass texture
//                           fades in: tshingle() scallops the north wall, tstreak() lays filament lanes along the
//                           contours of d that slide downstream, and inside the loop they wind into a turning spiral.
//   makeThermalUniforms()   the uniform set every thermal material shares (one object, so one clock).
//   jetFrame/ycBase/sampleT JS mirrors of the centreline and of the field without the flow warp (nadir fill, placement).
//   buildHero(ctx, opts)    object = Earth group in Earth-local axes: +Y up at the ground-track origin, the track runs
//                           along -Z, +X is to the right. Map coordinates m = (a along track, b to the right) in km.
//                           Layers: sea cap (emissive data), two cloud shells (+4 km, +16 km: streets, cells, the
//                           hurricane's bands, eye and outflow, or the winter low's comma), limb airglow shell.
// Instrument (SEA_FRAG): swath seams every 700 km, placed so the scar crossing XP (under the portal) is mid-swath.
// Swaths that show different moments, and the faint seam hairline, are a high-pass trait: both fade out between 750
// and 450 km (thi()), so close to, nothing shears the wall or the ring along a seam. A repaint front is the
// stair-stepped edge of the ground-locked blocks written so far (at least 4 px each): the picture behind it is six
// hours newer (tEp: the field's clock, the spiral a fifth of a turn on, the neck as it now stands), and that jump is
// the whole of the front: no line, no glow, no bright row and no band of fresh data is drawn on it, anywhere. The
// ambient front (one per swath) draws nothing. Dropped lines only on the noisy instrument: rare, short runs of one
// scan row over plain cold water (never on the scar) in the ramp's coldest indigo, ending in a teal tick, only above
// 440 km; the no-data gore beside a seam is switched off (uInst.y = 0). Striping (uInst.z) is a few faint lines along the
// scan, one detector in six, only from altitude: never an even comb. Under 260 km each ramp step splits in two. Land
// is drawn as data too: stepped greys from cool near-black ridges to a pale warm plain, relief contours, cobalt
// rivers, estuaries, ember towns, barrier islands. tFw (ground km per pixel) fades the filaments far away.
// Cloud (CLOUD_FRAG): the low deck is lowPuff(): cloud streets off the coast (streets(): rows of cumulus cells of
// unequal size, each an oval with a scalloped edge, carried offshore at 5 km a second, run together into rolls;
// every street has its own place, girth, spacing, start and length; a cell grows from nothing, keeps its size and
// shrinks to nothing where it ends or where it nears the loop, and the cells of a street end at places spread
// along its whole length, so the field opens into clumps seaward; no height or place of the camera decides
// whether a street cell is there, its size or its grey; a cell that spans under 3.4 pixels, reckoned by the
// longer axis of the pixel's footprint, thins away as the sea's own pixels do), cumulus clumps in the heart of
// each patch and a scatter of small puffs over the cold shelf round the loop on the low pass (these two read the
// camera's height, as live has them); nothing on the loop, its neck or the wall. It is sampled twice, once for
// the cloud and once a little to one side for the indigo print it lays on the sea, which is what lifts the deck
// off the map. Puffs are pale grey with white cores; a street cell has a white top (where it stands at half its
// own depth or more), a pale ring where the cloud is deep enough and a thin skirt one grey darker; the storm
// uses all five greys.
// Scripted uniforms (set by the world from u): uRing[0] + uNeck (the loop whose neck closes), uFront (three repaint
// fronts), uWake (printed scar length), uStorm/uStorm2 (storm centres), uCam (nadir map point), uCamL (camera, local).
import * as THREE from 'three';

export const R_EARTH = 6371;
export const XP = [1500, 0];                 // where the scar cuts the stream (map km); the portal hangs above it
const E1 = [0.980, -0.199], E2 = [0.199, 0.980];   // jet frame: along the stream, across it (+ = warm Sargasso side)
export const DW = [0.6, 0.8];                // storm track direction on the map
export const WAKE_BACK = 560;                // km of track behind XP where the scar begins
export const NECK_X = -620;                  // jet x of the meander loop that pinches off (under the low pass)

export const RAMP_HEX = ['#17125E', '#1E4BD2', '#10A39B', '#F3D03A', '#F0742A', '#E21F8C'];
export function rampColors() {
  const srgb = RAMP_HEX.map((h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; });
  const out = [];
  for (let i = 0; i < 24; i++) {
    const f = i / 23 * 5, k = Math.min(4, Math.floor(f)), w = f - k;
    const c = new THREE.Color().setRGB(srgb[k][0] + (srgb[k + 1][0] - srgb[k][0]) * w, srgb[k][1] + (srgb[k + 1][1] - srgb[k][1]) * w, srgb[k][2] + (srgb[k + 1][2] - srgb[k][2]) * w, THREE.SRGBColorSpace);
    out.push(new THREE.Vector3(c.r, c.g, c.b));
  }
  return out;
}

const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const sq = (x) => x * x;
export function jetFrame(a, b) { const x = a - XP[0], y = b - XP[1]; return [x * E1[0] + y * E1[1], x * E2[0] + y * E2[1]]; }
export function jetToMap(x, y) { return [XP[0] + E1[0] * x + E2[0] * y, XP[1] + E1[1] * x + E2[1] * y]; }
// centreline of the north wall in the jet frame; shape = [far-field swing, mid swing, standing S] (see uShape)
function ycB(x, bend, s0, s1, s2) {
  return -190 + 190 * ss(-1000, 0, x) - s0 * ss(100, 1700, x) + 135 * (1 - ss(-1600, -1000, x)) + bend * Math.exp(-sq((x - NECK_X) / 200))
    + s1 * Math.exp(-sq((x + 270) / 190)) + s2 * (1.2 * Math.exp(-sq((x + 1250) / 170)) - Math.exp(-sq((x + 950) / 150)));
}
export function ycBase(x, bend = 70, shape = [380, 0, 0]) { return ycB(x, bend, shape[0], shape[1], shape[2]); }
const smax = (a, b, k) => { const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (a - b) / k)); return b + (a - b) * h + k * h * (1 - h); };
const segD = (dx, dy, len) => { const s = Math.sign(len), h = Math.max(0, Math.min(Math.abs(len), dy * s)) * s; return Math.hypot(dx, dy - h); };
// profile constants shared with thermalField() in the GLSL below (keep the two in step)
const CORE_HI = 0.3, CORE_LO = 0.18, WARM0 = 0.625, WARM1 = 0.26, WARM_L = 100, CORE_W = 2.2, HI_W2 = 30625;
// the field without the flow warp, the rings' wobble and the low-pass filaments: enough for the foil's nadir fill.
// U = the shared uniforms. Allocates nothing (it runs five times a frame).
export function sampleT(a, b, U) {
  const x0 = a - XP[0], y0m = b - XP[1], jx = x0 * E1[0] + y0m * E1[1], jy = x0 * E2[0] + y0m * E2[1];
  const t = U.uT.value, v = U.uVar.value, sh = U.uShape.value, rg = U.uRing.value, nk = U.uNeck.value, wk = U.uWake.value;
  const y0 = ycB(jx, v.z, sh.x, sh.y, sh.z) + v.x * (28 * Math.sin((jx - 3 * t) * 0.01496) + 16 * Math.sin((jx - 4.8 * t) * 0.0273 + 1.3)) * (1 - 0.8 * Math.exp(-sq((jx - NECK_X) / 260)));
  let d = jy - y0;
  for (let i = 0; i < 3; i++) d = smax(d, (rg[i].z - Math.hypot(jx - rg[i].x, jy - rg[i].y)) * 2.6, 14);
  d = smax(d, (nk.x - segD(jx - rg[0].x, jy - rg[0].y, nk.y)) * 2.6, 14);
  let dc = (Math.hypot(jx - rg[3].x, jy - rg[3].y) - rg[3].z) * 2.6;
  if (rg[3].w > 0.5) dc = -smax(-dc, -(segD(jx - rg[3].x, jy - rg[3].y, -nk.z) - rg[3].w) * 2.6, 14);
  d = -smax(-d, -dc, 14);
  const cl = U.uCamL.value, alt = Math.hypot(cl.x, cl.y + R_EARTH, cl.z) - R_EARTH, lo = 1 - ss(150, 450, alt);
  const cold = 0.07 + 0.17 * Math.exp(Math.min(d, 0) / 110);
  const hi = ss(450, 750, alt);
  const dS = d - 130 * hi;
  const warm = WARM0 + WARM1 * Math.exp(-Math.max(dS, 0) / WARM_L) + 0.085 * ss(300, 520, dS) + 0.035 * ss(250, 480, dS);
  const dk = d - 10 * lo;
  let core = Math.exp(-dk * dk / (dk > 0 ? 9000 * (1 + CORE_W * ss(150, 700, alt)) : 900));
  if (dk > 0) core += (Math.exp(-sq(dk * dk / HI_W2)) - core) * hi;
  let T = Math.max(cold + (warm - cold) * ss(-21, -15, d) + (CORE_HI + (CORE_LO - CORE_HI) * lo) * core, 0.592 * ss(-15, -8, d));
  const wx = a - (XP[0] - DW[0] * WAKE_BACK), wy = b - (XP[1] - DW[1] * WAKE_BACK);
  const l = wx * DW[0] + wy * DW[1], c = (wx * -DW[1] + wy * DW[0]) / Math.max(wk.z, 0.2);
  const mask = ss(0, 150, l) * (1 - ss(wk.x - 10, wk.x, l));
  const c4 = sq(sq(c / 80));
  T += (0.4 - T) * mask * Math.exp(-c4 * c4 * c4) * 0.95;
  T += (0.22 - T) * mask * Math.exp(-sq(sq((c - 12) / 44))) * wk.w * (0.6 + 0.4 * ss(0, 420, l));
  return Math.max(0, Math.min(0.999, T));
}

export function makeThermalUniforms() {
  return {
    uT: { value: 0 },
    // rings in the jet frame: xy centre, z radius km (0 = none); w: [0..2] wobble of the turning rim, [3] half-width of the tongue's channel (0 = a free ring)
    uRing: { value: [new THREE.Vector4(-620, -160, 42, 0), new THREE.Vector4(330, -270, 62, 0.07), new THREE.Vector4(760, -500, 62, 0.07), new THREE.Vector4(-230, 150, 62, 0)] },
    uNeck: { value: new THREE.Vector4(22, 130, 220, 22) },   // neck half-width km (< 0 = snapped), neck length, tongue channel length, half-width six hours on (shown behind a repaint front)
    uShape: { value: new THREE.Vector4(380, 0, 0, 0) },      // far-field swing, mid swing (jet x -270), standing S upstream
    uWake: { value: new THREE.Vector4(630, 0, 1, 1) },      // printed length, second (rare) wake length, width scale, depth
    uFront: { value: new THREE.Vector3(-9999, -9999, -9999) },
    uVar: { value: new THREE.Vector4(1, 1, 70, 0) },         // meander amplitude, warp amplitude, local bend at the neck, cloud streets over the whole shelf
    uInst: { value: new THREE.Vector4(0.0004, 0, 0, 0) },      // dropped-line rate, gore width (0 = none), striping
    uStorm: { value: new THREE.Vector4(1800, 400, 1, 0) },   // map xy, size scale, kind (0 compact, 1 ragged, 2 comma low)
    uStorm2: { value: new THREE.Vector4(1300, -260, 0, 0) }, // rare second storm: map xy, size scale (0 = none)
    uCam: { value: new THREE.Vector2(0, 0) },
    uCamL: { value: new THREE.Vector3(0, 800, 0) },
    uRamp: { value: rampColors() },
  };
}

export const THERMAL_GLSL = /* glsl */`
uniform float uT; uniform vec4 uRing[4]; uniform vec4 uNeck; uniform vec4 uShape; uniform vec4 uWake; uniform vec3 uFront; uniform vec4 uVar; uniform vec4 uInst;
uniform vec4 uStorm; uniform vec4 uStorm2; uniform vec2 uCam; uniform vec3 uCamL; uniform vec3 uRamp[24];
const float R_E = 6371.;
float tFw = 0.;                                          // ground km per screen pixel at this fragment (set by the caller): fades the filaments before they alias
float tEp = 0.;                                          // repaints this fragment has had (set by the caller): the picture behind a front is six hours on
const vec2 TXP = vec2(1500., 0.); const vec2 TE1 = vec2(0.980, -0.199); const vec2 TE2 = vec2(0.199, 0.980);
const vec2 TDW = vec2(0.6, 0.8); const vec2 TSD = vec2(0.8, -0.6); const vec2 TSP = vec2(0.6, 0.8);
float sq(float x) { return x * x; }
float thash(float n) { return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
float thash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float tnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(thash2(i), thash2(i + vec2(1., 0.)), f.x), mix(thash2(i + vec2(0., 1.)), thash2(i + vec2(1., 1.)), f.x), f.y); }
vec2 tmapOf(vec3 objPos) { vec3 n = normalize(objPos + vec3(0., R_E, 0.)); return vec2(atan(-n.z, max(n.y, 1e-4)) * R_E, asin(clamp(n.x, -1., 1.)) * R_E); }
vec2 tjet(vec2 m) { vec2 d = m - TXP; return vec2(dot(d, TE1), dot(d, TE2)); }
float talt() { return length(uCamL + vec3(0., R_E, 0.)) - R_E; }
float tycBase(float x) {
  return -190. + 190. * smoothstep(-1000., 0., x) - uShape.x * smoothstep(100., 1700., x) + 135. * (1. - smoothstep(-1600., -1000., x)) + uVar.z * exp(-sq((x + 620.) / 200.))
    + uShape.y * exp(-sq((x + 270.) / 190.)) + uShape.z * (1.2 * exp(-sq((x + 1250.) / 170.)) - exp(-sq((x + 950.) / 150.)));
}
float tyc(float x, float t) {
  return tycBase(x) + uVar.x * (28. * sin((x - 3. * t) * 0.01496) + 16. * sin((x - 4.8 * t) * 0.0273 + 1.3)) * (1. - 0.8 * exp(-sq((x + 620.) / 260.)));
}
// the coast (jet y of the shoreline at jet x): long swings, three deep narrow bays, pointed capes and a fine wiggle
float tcoast(float x) {
  float b = max(sin(x / 97. + 0.9), 0.); b *= b; b *= b; b *= b;
  float c = max(sin(x / 61. + 2.2), 0.); c *= c; c *= c; c *= c * c;
  return -370. - 0.25 * (x + 1320.) + 40. * sin(x / 130.) + 25. * sin(x / 47. + 1.) + 9. * sin(x / 17. + 2.)
    - 38. * b + 24. * c + 3.2 * sin(x / 6.3 + 1.) + 1.8 * sin(x / 2.9);
}
// divergence-free travelling sine flow: stretches and winds the field instead of boiling it
vec2 twave(vec2 m, vec2 k, float amp, float ph) { return vec2(-k.y, k.x) * (amp * sin(dot(k, m) + ph) / max(length(k), 1e-4)); }
vec2 twarpA(vec2 m, float t) {
  vec2 w = twave(m, vec2(0.031, 0.017), 13., -0.21 * t);
  w += twave(m + w, vec2(-0.022, 0.052), 9., 0.33 * t + 1.7);
  w += twave(m + w, vec2(0.081, -0.037), 6.5, -0.47 * t + 4.1);
  w += twave(m + w, vec2(0.052, 0.128), 4.5, -0.62 * t + 2.3);
  return w;
}
vec2 twarpB(vec2 m, float t) {
  vec2 w = twave(m, vec2(0.21, 0.09), 3.2, -0.9 * t);
  w += twave(m + w * 2., vec2(-0.13, 0.33), 2.2, 1.3 * t + 0.6);
  w += twave(m + w * 2., vec2(0.55, -0.31), 1.2, -1.9 * t + 3.3);
  w += twave(m + w * 2., vec2(0.47, 1.05), 0.7, -2.6 * t + 5.2);
  return w;
}
float tsmax(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (a - b) / k, 0., 1.); return mix(b, a, h) + k * h * (1. - h); }
// a ring as a distance (+ inside, scaled so its rim is a 28 km band); its rim wobbles and turns once in 12 s.
// lo (1 at the low pass) adds thirteen small uneven roof tiles that turn with it and lean back with radius.
float tring(vec2 j, vec4 rg, float t, float spin, float arm, float lo) {
  vec2 d = j - rg.xy; float r = length(d); float th = atan(d.y, d.x + (abs(d.x) + abs(d.y) < 1e-3 ? 1e-2 : 0.));
  float wob = 1. + arm * (sin(2. * th - spin * t * 1.047 + r * 0.05) + 0.5 * sin(3. * th - spin * t * 1.571 + 2.))
    + lo * 0.045 * abs(sin(6.5 * (th - spin * t * 0.5236) + 1.4 * sin(2. * (th - spin * t * 0.5236) + 0.7) + r * 0.04));
  return (rg.z * wob - r) * 2.6;
}
float tseg(vec2 d, float len) { float s = sign(len); float h = clamp(d.y * s, 0., abs(len)) * s; return length(vec2(d.x, d.y - h)); }
// 1 at the low pass, 0 from altitude: the instrument resolves the stream's filaments and shingles only when close
float tlo() { return 1. - smoothstep(150., 450., talt()); }
// 1 on the high pass (above 750 km), 0 below 450 km: from far away the river is drawn as one broad magenta band
float thi() { return smoothstep(450., 750., talt()); }
// shingle eddies: scallops on the north wall (round lobes into the cold water, cusps between), leaning back as
// they peel and travelling downstream; x = jet x, d = distance to the wall (+ warm)
float tshingle(float x, float d, float t) {
  float a = abs(sin((x + 0.7 * clamp(d, -120., 20.) - 3. * t) / 11. + 1.6 * tnoise(vec2(x / 80., 3.))));
  float b = abs(sin((x - 1.6 * t) / 21. + 2.));
  return (11. * a + 5. * b * b) * smoothstep(-130., -18., d) * (1. - smoothstep(-6., 22., d));
}
// filaments: lanes that follow the wall's contour (d), each one sliding downstream at its own speed, with kinks
// that travel at 7 km a second and tapered ends. Returns about -1..1 (+ = hotter streak, - = cooler streak).
float tstreak(float x, float d, float t) {
  float xs = x - 7. * t;
  float kink = 6. * sin(xs * 0.019 + 1.4 * sin(xs * 0.0071 + d * 0.01)) + 8. * (tnoise(vec2(xs / 52., d / 70.)) - 0.5);
  float ph = (d + kink) * 0.215;                          // 29 km lanes
  float lane = floor(ph / 6.2832);
  float a = sin(ph);
  float v1 = 5.5 + 3. * thash(lane); float v2 = 4. + 3. * thash(lane + 37.);
  float bp = smoothstep(0.2, 0.58, tnoise(vec2((x - v1 * t) / 62., lane * 7.31 + 0.5)));
  float bn = smoothstep(0.2, 0.56, tnoise(vec2((x - v2 * t) / 48., lane * 3.77 + 51.5)));
  float fine = sin(ph * 2.6 + 4. * tnoise(vec2(xs / 34., d / 22.)));
  // thin cooler threads (11 km lanes) so the magenta core itself is never one flat band at the closest pass
  float ph2 = (d + 0.6 * kink) * 0.56 + 1.3; float lane2 = floor(ph2 / 6.2832);
  float b2 = smoothstep(0.2, 0.5, tnoise(vec2((x - (6. + 3. * thash(lane2 + 91.)) * t) / 40., lane2 * 5.13 + 9.5)));
  return max(a, 0.) * bp - max(-a, 0.) * bn + (0.22 * fine - 0.9 * max(-sin(ph2), 0.) * b2) * (1. - smoothstep(0.6, 1.6, tFw));
}
// T in 0..1 at map point m (km), field time t (hours), printed wake length lw (km)
float thermalField(vec2 m, float t, float lw) {
  float lo = tlo();
  vec2 q = m + twarpA(m, t) * uVar.y; q += twarpB(q, t) * uVar.y;
  vec2 j = tjet(q);
  float y0 = tyc(j.x, t); float dy = (tyc(j.x + 4., t) - y0) * 0.25;
  float d = (j.y - y0) / sqrt(1. + dy * dy);
  d += lo * tshingle(j.x, d, t);
  vec2 jr = tjet(mix(m, q, 0.3));                        // the loop keeps a rounder rim than the flow would give it
  float r0 = tring(jr, uRing[0], t, 1., uRing[0].w, lo);
  d = tsmax(d, r0, 14.);
  // (behind a repaint front the neck is six hours further closed: uNeck.w)
  d = tsmax(d, (mix(uNeck.x, uNeck.w, min(tEp, 1.)) - tseg(j - uRing[0].xy, uNeck.y)) * 2.6, 14.);
  d = tsmax(d, tring(j, uRing[1], t, 1., uRing[1].w, lo), 14.);
  d = tsmax(d, tring(j, uRing[2], t, 1., uRing[2].w, lo), 14.);
  float dc = -tring(j, uRing[3], t, -1., 0.07, lo);
  float ch = (tseg(j - uRing[3].xy, -uNeck.z) - uRing[3].w) * 2.6 + (uRing[3].w > 0.5 ? 0. : 1e4);
  dc = -tsmax(-dc, -ch, 14.);
  d = -tsmax(-d, -dc, 14.);
  float cold = 0.07 + 0.17 * exp(min(d, 0.) / 110.) + 0.035 * sin(j.x * 0.0041 + j.y * 0.0073);
  // warm side: orange then a yellow shoulder beside the stream, then the slack Sargasso deepening to burnt orange in
  // two or three big slow swirls (constants mirrored in sampleT)
  float swl = 0.5 + 0.5 * sin(j.x * 0.0064 + 2.3 * sin(j.y * 0.0052 + 0.6) + 0.02 * t);
  // (the base, 0.625, keeps the trough of the shoulder on step 14, pure yellow: nothing on the warm side may fall
  // to step 13, the olive between teal and yellow). From altitude (hi) the same graded shoulder starts 130 km
  // further out, beyond the broad magenta band, so the far picture grades exactly as the near one does.
  float hi = thi();
  float dS = d - 130. * hi;
  float warm = 0.625 + 0.26 * exp(-max(dS, 0.) / 100.) + 0.03 * sin(j.x * 0.0057 - j.y * 0.0049)
    + 0.085 * smoothstep(300., 520., dS) + 0.07 * swl * smoothstep(250., 480., dS);
  // the magenta core: from altitude a flat-topped band 175 km wide so the river is the boldest shape on the disc;
  // at the low pass a 42 km ridge just inside the wall, so T falls through pink, red-orange and orange over the next 100 km
  float dk = d - 10. * lo;
  float cw = dk > 0. ? 9000. * (1. + 2.2 * smoothstep(150., 700., talt())) : 900.;
  float core = exp(-dk * dk / cw);
  core = mix(core, dk > 0. ? exp(-sq(dk * dk / 30625.)) : core, hi);
  float T = mix(cold, warm, smoothstep(-21., -15., d)) + mix(0.3, 0.18, lo) * core;
  // from altitude the broad band is never one flat slab: long strands a step or two cooler (pink, red-orange) lie
  // along it, 60 km apart, sliding downstream and breaking up; faded out before they are finer than a few pixels
  float fa = hi * (1. - smoothstep(6., 18., tFw));
  if (fa > 0.003) {
    float kn = 16. * sin(j.x * 0.0085 + 1.7 * sin(j.x * 0.0031 + d * 0.006)) + 26. * (tnoise(vec2((j.x - 3. * t) / 150., d / 80.)) - 0.5);
    float ph = (d + kn) * 0.105; float ln = floor(ph / 6.2832);
    float br = smoothstep(0.25, 0.6, tnoise(vec2((j.x - (3. + 2. * thash(ln)) * t) / 190., ln * 5.7 + 0.5)));
    float st = max(sin(ph), 0.) * br + 0.35 * max(sin(ph * 2.3 + 1. + 3. * tnoise(vec2(j.x / 90., d / 40.))), 0.);
    T = min(T, 0.985) - fa * 0.085 * st * smoothstep(-8., 20., d) * (1. - smoothstep(150., 215., d));
  }
  // low pass: filaments along the stream, wound into a turning two-armed spiral inside the loop
  if (lo > 0.003) {
    vec2 dr = jr - uRing[0].xy; float rr = length(dr);
    float thr = atan(dr.y, dr.x + (abs(dr.x) + abs(dr.y) < 1e-3 ? 1e-2 : 0.));
    // (six hours is half a turn, which a two-armed spiral hides: each repaint also carries it a fifth of a turn on)
    float sp = (sin(2. * thr + 0.3 * rr - 1.047 * t - 2.5 * tEp) + 0.25 * sin(5. * thr - 0.55 * rr - 1.6 * t + 1.)) * smoothstep(1.5, 9., rr);
    float w0 = smoothstep(6., 46., r0);
    float aS = lo * (1. - smoothstep(1.6, 4., tFw));
    T = mix(min(T, mix(1.5, 0.985, lo)), 0.855, 0.85 * lo * w0);     // the loop's interior is carried by the spiral
    T += aS * mix(0.095 * tstreak(j.x, d, t) * smoothstep(-6., 16., d) * (1. - 0.6 * smoothstep(170., 380., d)), 0.125 * sp, w0);
  }
  T = max(T, 0.592 * smoothstep(-15., -8., d));              // the warm side never falls under step 14 (yellow): no olive
  // tidal-mixing fringe round the capes
  float cd = tjet(m).y - tcoast(tjet(m).x);
  T += 0.11 * exp(-max(cd, 0.) / 16.) * (0.5 + 0.5 * sin(tjet(m).x / 47. + 1.));
  // the cold wake: cobalt core (deeper right of the track) in a teal halo, printed up to lw
  vec2 w = q - (TXP - TDW * 560.); float l = dot(w, TDW); float c = dot(w, vec2(-TDW.y, TDW.x)) / max(uWake.z, 0.2);
  float mask = smoothstep(0., 150., l) * (1. - smoothstep(lw - 10., lw, l)) * (1. - 0.92 * smoothstep(-30., 10., r0));   // the new ring rides over the scar's edge
  // one teal step with a hard shoulder (twelfth-power profile: the green and yellow fringe between teal and the
  // warm water is about 20 km wide), and inside it a flat-topped cobalt ribbon
  float c4 = sq(sq(c / 80.));
  T = mix(T, 0.40, mask * exp(-c4 * c4 * c4) * 0.95);
  T = mix(T, 0.22, mask * exp(-sq(sq((c - 12.) / 44.))) * uWake.w * (0.6 + 0.4 * smoothstep(0., 420., l)));
  // rare: a second, braided wake riding the first
  float c2 = c - 70. - 46. * sin(l / 75.); float m2 = smoothstep(0., 150., l) * (1. - smoothstep(uWake.y - 10., uWake.y, l)) * step(1., uWake.y);
  T = mix(T, 0.40, m2 * exp(-sq(c2 / 55.)) * 0.9); T = mix(T, 0.2, m2 * exp(-sq(c2 / 24.)));
  return clamp(T, 0., 0.999);
}
vec3 thermalRamp(float T) { return uRamp[int(clamp(floor(T * 24.), 0., 23.))]; }
`;

const SEA_VERT = /* glsl */`
varying vec3 vObj;
void main() { vObj = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;

const SEA_FRAG = /* glsl */`
varying vec3 vObj;
${THERMAL_GLSL}
void main() {
  vec2 m = tmapOf(vObj);
  float fw = max(max(fwidth(m.x), fwidth(m.y)), 1e-4);
  vec3 nrm = normalize(vObj + vec3(0., R_E, 0.));
  float ndv = max(dot(nrm, normalize(uCamL - vObj)), 0.);
  float alt = talt();
  // swath coordinates and square ground pixels (1 km), faded out below ~3 px per cell
  vec2 sc = vec2(dot(m, TSD), dot(m, TSP));
  float snap = smoothstep(2.2, 3.4, 1. / fw);
  vec2 scq = floor(sc) + 0.5;
  vec2 sc2 = snap > 0.5 ? scq : sc;                       // the instrument's rows switch cleanly
  vec2 mq = TSD * scq.x + TSP * scq.y;
  vec2 mm = snap > 0.5 ? mq : m;
  float swc = sc.x / 700. + 0.786; float sw = floor(swc); float h = thash(sw);   // seams 350 km either side of the scar crossing
  // (thickness is measured across each line, with the derivative of its own coordinate, so a row or a seam seen
  // at a slant near the limb stays a hairline of about 1.6 px and never swells into a bar)
  float fy = max(fwidth(sc.y), 1e-4); float fx = max(fwidth(sc.x), 1e-4);
  float gy = length(vec2(dFdx(sc.y), dFdy(sc.y))); float gx = length(vec2(dFdx(sc.x), dFdy(sc.x)));   // km per pixel across a row, across a seam
  // repaint fronts: three scripted (uFront), one ambient per swath. A front is never a line and never a glow: it is
  // the stair-stepped edge of the blocks written so far. Blocks are squares of scan rows and columns locked to the
  // ground, a power of two km wide and at least 4 px on screen in every direction; the sweep runs diagonally to
  // them, so the edge is a connected staircase (each row of blocks is at most half a block ahead of its neighbour).
  // The picture behind the edge is six hours newer (tEp) and that jump is the whole of the front: no line, no
  // bright row and no band is drawn on it.
  float fdot = dot(m, vec2(0.944, 0.33));
  float gF = max(length(vec2(dFdx(fdot), dFdy(fdot))), 0.3); float gA = max(gy, 0.3);
  float cs = exp2(ceil(log2(max(max(gF, max(gx, gy)) * 4., 1.))));
  vec2 cid = floor(sc / cs); vec2 cmid = (cid + 0.5) * cs;
  float cf = dot(TSD * cmid.x + TSP * cmid.y, vec2(0.944, 0.33));       // the block's centre along the sweep
  float jb = (thash2(vec2(cid.y, 3.5)) + 0.6 * thash2(vec2(floor(cid.y / 4.), 9.5)) - 0.8) * 0.7;
  vec3 fb = (uFront - cf) / cs + jb;                                    // blocks behind each scripted front (+ = repainted)
  float cbk = exp2(ceil(log2(max(gx * 6., 1.))));
  float jc = thash2(vec2(floor(sc.x / cbk), 5.5)) + 0.7 * thash2(vec2(floor(sc.x / (cbk * 8.)), 1.5)) - 0.85;
  float e2 = step(0., fb.y) + step(0., fb.z);
  float epoch = step(0., fb.x) + e2;
  // swaths that show different moments are a high-pass trait: under 450 km (hi = 0) every swath shows the same
  // moment and shares one ambient front, so nothing shears the wall or the ring along a seam close to
  float hi = thi();
  float run = uT * 45. + h * 2600. * hi;
  float afPos = dot(uCam, TSP) + mod(run, 2600.) - 700.;
  float ab = afPos - sc2.y + jc * 7. * gA;                            // km behind the ambient front
  float behind = step(0., ab); float count = floor(run / 2600.);
  tEp = behind + epoch;
  float tt = uT + 6. * (floor(h * 3.) * hi + tEp);
  float lw = uWake.x + 200. * e2;
  tFw = fw;
  float T = thermalField(mm, tt, lw);
  // where pixels are between 2 and 3 px wide, blend the two temperatures (not the lookup points): no checkerboard
  if (snap > 0.02 && snap < 0.98) {
    float T2 = thermalField(snap > 0.5 ? m : mq, tt, lw);
    T = snap > 0.5 ? mix(T2, T, snap) : mix(T, T2, snap);
  }
  // the ramp cools three steps in the last sliver before the limb (warm water cools to yellow there, never to olive)
  float limbK = 1. - smoothstep(0.03, 0.16, ndv);
  float Tc = T - 0.125 * limbK;
  T = clamp(T > 0.5845 ? max(Tc, 0.5845) : Tc, 0., 0.999);
  float Tq = T * 24.; float idx = floor(Tq);
  float de = fwidth(idx);
  // 24 flat steps; on the low pass (under 260 km) each step splits in two, so the close bands grade twice as finely
  int i0 = int(idx);
  vec3 col = mix(uRamp[i0], uRamp[i0 < 23 ? i0 + 1 : 23], 0.5 * (1. - smoothstep(110., 260., alt)) * step(0.5, Tq - idx));
  // hairline isotherms where the step changes, faded where steps crowd
  col *= 1. - 0.35 * step(0.5, de) * (1. - smoothstep(1.5, 3.5, de));
  // ---- land, as the instrument sees it: stepped warm-to-cool greys, darker and greyer than any sea. A warm coastal
  // plain, a cooler mountain belt 170 km inland whose ridges run with the coast, contour hairlines between the steps,
  // rivers as cool indigo threads that widen into estuaries (the sea reaches into each mouth), towns as small ember
  // heat islands on the plain and at the river mouths, a pale shoreline and a chain of barrier islands with inlets.
  vec2 jl = tjet(mm); float yl = tcoast(jl.x); float cdist = jl.y - yl; float di = -cdist;
  float bo = 15. + 4. * sin(jl.x / 53.);
  float bar = step(abs(cdist - bo), 1.5 + 0.7 * sin(jl.x / 23. + 1.)) * step(-0.25, sin(jl.x / 85.)) * step(0.14, abs(sin(jl.x / 19.5)));
  float xr = jl.x + 22. * sin(di / 37. + 1.3) + 8. * sin(di / 11.5 + jl.x / 300.);
  float rk = floor(xr / 170.); float rx = (fract(xr / 170.) - 0.5) * 170. - (thash(rk + 3.) - 0.5) * 80.;
  float rlen = 90. + 260. * thash(rk + 7.);
  float dpos = max(di, 0.);
  float rwid = max(0.9 * fw, (0.7 + 3.2 * exp(-dpos / 9.)) * (1. - smoothstep(0.6 * rlen, rlen, di)));
  float river = step(abs(rx), rwid) * step(di, rlen);
  float mouth = step(abs(rx), 1.2 + 3.8 * exp(-dpos / 7.)) * step(di, 9.);
  float land = max(step(cdist, 0.) * (1. - mouth), bar);
  float n1 = tnoise(jl / 85.); float n2 = tnoise(jl / 29. + 7.3); float n3 = tnoise(jl / 10. + 3.1);
  float rdg = 1. - abs(2. * tnoise(vec2(jl.x / 64. + 0.4 * sin(di / 45.), di / 21.)) - 1.);
  float spine = exp(-sq((di - 170. - 45. * sin(jl.x / 240.)) / 80.));
  float Tl = 0.5 + 0.24 * exp(-dpos / 55.) - 0.46 * spine * (0.3 + 0.7 * rdg) + 0.2 * (n1 - 0.5) + 0.13 * (n2 - 0.5) + 0.07 * (n3 - 0.5)
    - 0.12 * smoothstep(260., 700., di) + 0.1 * exp(-abs(rx) / 14.) * step(di, rlen) - 0.25 * limbK;
  float li = floor(clamp(Tl, 0., 0.999) * 8.);
  float dle = fwidth(li);
  float lv = li / 7.;
  vec3 lc = mix(vec3(0.007, 0.009, 0.017), vec3(0.152, 0.139, 0.118), lv * (0.45 + 0.55 * lv));
  lc *= 1. - 0.3 * step(0.5, dle) * (1. - smoothstep(1.5, 3.5, dle));
  vec2 cp = vec2(jl.x, di); vec2 cc = floor(cp / 110.);
  vec2 ctr = (cc + 0.12 + 0.76 * vec2(thash2(cc + 1.5), thash2(cc + 7.5))) * 110.;
  float cr = max(4. + 7. * thash2(cc + 13.5), 1.6 * fw);
  float city = step(thash2(cc + 21.5), 0.62) * exp(-dot(cp - ctr, cp - ctr) / (cr * cr)) * step(ctr.y, 200.) * step(8., ctr.y);
  vec2 dmo = vec2(rx - 5., di - 7.); float mr = max(7., 1.6 * fw);
  city = max(city, exp(-dot(dmo, dmo) / (mr * mr)) * step(0.35, thash(rk + 11.)));
  lc = city > 0.55 ? vec3(0.78, 0.33, 0.07) : city > 0.25 ? vec3(0.34, 0.15, 0.055) : city > 0.08 ? lc * 1.5 + vec3(0.03, 0.014, 0.006) : lc;
  lc = mix(lc, vec3(0.018, 0.06, 0.26), river);
  float edge = max(step(abs(cdist), max(1.3 * fw, 0.9)) * (1. - mouth), bar * step(1.2, abs(cdist - bo)));
  col = mix(col, mix(lc, vec3(0.13, 0.135, 0.15), edge), land);
  // ---- instrument: swath seams (barely there), a very few dropped rows, faint striping. (uInst.y, the no-data gore
  // beside a seam, is 0 in this world: a 250 km black sliver reads as a crack in the planet however thin it is.)
  float gc = fract(swc);
  float rw = exp2(ceil(log2(max(fy * 1.1, 1.))));
  float row = floor(sc.y / rw);
  // a dropped line (noisy instrument only) is a short run (40 to 100 km) of one scan row over cold water, in the
  // ramp's coldest indigo until the detector resyncs with one teal tick; only from altitude (none under 440 km, so none after the dive: close to, a hairline reads as a crack), none in the last sliver
  // before the limb, none through the scar crossing (under the portal)
  float dl = 0.06 + 0.08 * thash2(vec2(row + 5.5, sw * 3. + 2.)); float d0 = thash2(vec2(row * 1.7 + 3.5, sw + 11.)) * (0.97 - dl);
  float hiAlt = step(440., alt) * step(0.2, ndv);
  vec2 wkp = mm - (TXP - TDW * 560.);
  float onScar = step(abs(dot(wkp, vec2(-TDW.y, TDW.x))), 150. * max(uWake.z, 0.2)) * step(-40., dot(wkp, TDW)) * step(dot(wkp, TDW), lw + 60.);
  float pick = step(thash2(vec2(row, sw * 7. + count + behind * 3.)), uInst.x) * step(160., abs(sc.y - 900.)) * hiAlt * step(T, 0.3) * step(0.14, T) * (1. - land) * (1. - onScar)
    * step(abs(fract(sc.y / rw) - 0.5) * rw, min(max(0.8 * gy, 0.5), 0.5 * rw));   // a whole 1 km row when rows are wider than 1.6 px, a 1.6 px line when not
  float drop = pick * step(d0, gc) * step(gc, d0 + dl);
  float tick = pick * step(d0 + dl, gc) * step(gc, d0 + dl + max(1.8 * gx, 1.) / 700.);
  float gore = step(gc * 700., min(uInst.y * 1750. * max(0., sin(sc.y / 240. + h * 6.283) - 0.75), max(1.8 * gx, 1.2))) * hiAlt * step(1e-5, uInst.y);   // a sliver 250 km long, never wider than 2 px or one ground pixel
  // (striping: one detector in six reads a touch low, so a few faint lines lie along the scan, never an even comb; only from altitude)
  col *= 1. - uInst.z * 0.06 * step(0.83, thash(floor(sc.x / exp2(ceil(log2(max(fx * 2.2, 1.))))) * 0.731 + 2.)) * smoothstep(300., 520., alt);
  col *= 1. - 0.18 * hi * step(gc * 700., max(1.3 * fx, 1.0));
  col = mix(col, vec3(0.0009, 0.0009, 0.0024), gore);
  col = mix(col, uRamp[0], drop);
  col = mix(col, uRamp[10], tick);
  gl_FragColor = vec4(col, 1.);
}
`;

// Cloud: a separate enhancement in five flat greys, on shells above the sea. uLayer 0 = low deck (streets off the
// coast, cumulus cells, the storm's rain bands); 1 = high deck (the storm's dense overcast, eye and outflow cirrus).
const CLOUD_FRAG = /* glsl */`
varying vec3 vObj;
uniform float uLayer;
${THERMAL_GLSL}
float stormCold(vec2 mm, vec4 st, float t) {
  vec2 d = (mm - st.xy) / max(st.z, 0.05); float r = length(d);
  float th = atan(d.y, d.x + (abs(d.x) + abs(d.y) < 1e-3 ? 1e-2 : 0.));
  float rag = tnoise(mm / 22. + vec2(t * 0.12, 0.)) - 0.5;
  float lr = log(max(r, 1.) / 20.);
  float c;
  if (st.w > 1.5) {
    // winter low: a comma. A small bright head and one long tail that leaves it, sweeps round three fifths of a
    // turn and thins to nothing, with a clear dry slot between head and tail; no eye, no dark core.
    // (the tail sweeps ahead of the storm, round its right and back to the south-west; it never points down the
    // track at the scar crossing, where the portal hangs)
    float sa = th - 1.6 * lr - 4.11;
    float tailw = 0.5 + 0.38 * smoothstep(110., 400., r);
    float arm = smoothstep(tailw, 0.97, cos(sa + rag * 0.5)) * (1. - smoothstep(240., 400., r)) * smoothstep(24., 60., r)
      * (0.8 + 0.2 * tnoise(vec2(lr * 7. - t * 0.3, sa * 2.)));
    vec2 hc = 40. * vec2(cos(5.21), sin(5.21));
    float head = (1. - smoothstep(26., 78., length(d - hc) + rag * 36.));
    float slot = smoothstep(0.35, 0.9, cos(sa - 1.25)) * smoothstep(30., 70., r) * (1. - smoothstep(150., 330., r));
    float v = max(arm, head) - 0.75 * slot + rag * 0.12;
    c = uLayer < 0.5 ? 0.36 + 0.42 * v : 0.36 + 0.66 * v * v;
  } else {
    float env = (1. - smoothstep(140., 215., r + rag * 60. * (0.4 + st.w)));
    float eye = smoothstep(7., 15., r) + step(0.5, st.w);
    if (uLayer < 0.5) {
      float band = 0.5 + 0.5 * sin(2. * th + 5.5 * lr + t * 0.42 + rag * 1.5);
      c = env * (0.3 + 0.62 * band) + 0.5 * (1. - smoothstep(55., 125., r));
    } else {
      float cdo = (1. - smoothstep(62., 104., r + rag * 34.)) * (0.72 + 0.28 * (1. - smoothstep(20., 60., r)));
      float cir = smoothstep(0.55, 0.95, sin(3. * th - 3.2 * lr - t * 0.3 + rag * 2.)) * (1. - smoothstep(120., 250., r)) * smoothstep(70., 110., r) * 0.62;
      c = max(cdo, cir);
    }
    c *= min(eye, 1.);
  }
  return c * step(0.05, st.z);
}
// three numbers of chance from one sine, for a thing's own number
vec3 thash3(float n) { return fract(sin(n) * vec3(43758.5453, 22578.1459, 19642.3490)); }
// cloud streets of a cold-air outbreak streaming off the coast, all along one wind (+y of the jet frame, straight
// out to sea), drawn as cloud. No place or height of the camera enters any line that decides whether a cell is
// there, how large it is or which grey it shows: not here, and not in the lines of lowPuff() that cut the greys
// (lowPuff() reads the height for live's cumulus alone). Beyond main()'s snap of the whole deck to its 2 km grid
// (live's, for every low cloud alike), the pixel's footprint is read in three places here (the last paragraph
// says which, and what each moves): two take away what the picture cannot show, the third brings the raggedness
// in where the picture can show the grid. Live's own fourth read, the offset of a cloud's print on the sea, is
// in main().
// Each street (a lane 28 km wide) is a row of cumulus cells carried down it at 5 km a second. A cell is a mound:
// its depth is w (1 - r2)^2 km, where w is its half-width across the wind and r2 is 0.944 of the squared distance
// from its centre in units of w and of its half-length l (1 to 1.8 w, never over its street's spacing), times
// the lobes' factor. Without the lobes the mound's foot is an oval of half-axes 1.03 w and 1.03 l, with no
// corner and no straight side of its own (the lane window's taper still cuts the shown oval of about one cell
// in a hundred, as in live). The lobes: one field (8 km across, carried with the cells) makes r2 up to a
// quarter more or less, so every ring of a cell (its outline, the pale ring's edge, the white's edge) lies up
// to 15.5 % farther from the cell's centre or up to 10.6 % nearer, and every outline is scalloped. The depths of
// cells that overlap add, so neighbours run together into rolls. The tones (cut in lowPuff()): there is cloud
// where the summed depth is 1.5 km or more. It is white where some cell stands at half its own depth or more
// (the inner 0.56 of its half-width, the lobes aside), so every cell that shows whole has a white top, whatever
// its size (one cut by a mask or by the frame may show its outer part alone), and a cell under 3 km in
// half-width is white to its edge. Elsewhere it is pale where the summed depth is
// 3.3 km or more, and what is left is the skirt grey, a rim.
// By the street's own number: whether it is there at all (one in four is not), its place in its lane (12 km
// either way), its girth (8 to 15 km), the spacing of its cells (15 to 24 km), where its cells begin to grow
// (from 20 km inland of the shore to 40 km off it) and its length (0.4 to 1 of 400 km; of 820 km when the streets
// cover the whole shelf). By the cell's own number: its place along and across the street, its full-grown
// half-width (0.5 to 1.6 of the girth, and never under 5 km), its length, and where it ends: a place somewhere
// on the street's length, six parts in ten of it shared with the other two cells of its group of three, so cells
// end in clumps and the field opens into separate clumps seaward instead of dwindling.
// (The 5 km is a constant of the world. By two counts over the whole flight at 1080 lines a full-grown cell of
// 5 km is shown whole on 81, or on 86 to 87, in a hundred of the field's pixels; one of 4 km on 67, or 78 to 80.)
// A cell grows from nothing while it drifts one spacing of its street (15 to 24 km: 3 to 4.8 s) and shrinks to
// nothing over its last such stretch. It is also smaller the nearer its centre lies to the loop that pinches off
// (uRing[0]): full size 140 km from the loop's rim, nothing 60 km from it, by the map alone. So a cell is born a
// point of white, gains its skirt rim from 3 km of half-width and its pale ring from 6.6 km (the grid's
// raggedness aside), and goes the same way back.
// The three reads of the footprint. (1) A cell's opacity: fl is the longer axis of the pixel's footprint on the
// ground (km); a cell is measured by 2 w sqrt(1 - sqrt(1.5 / w)) km (its seen body across the wind, within 3 %,
// the lobes aside): where that is under 3.4 fl the cell thins, and under 2.2 fl it is not drawn. The cell is
// judged by the longer axis alone: along the shorter one it may span more pixels than that. This is the law by
// which the sea shows its own 1 km pixels (SEA_FRAG: smoothstep(2.2, 3.4, pixels per cell)); it changes the
// cell's opacity and nothing else. (2) The 8 km lobes flatten by the same law on fl (whole where fl is 2.35 km
// or less, none where a lobe is under 2.2 fl, that is where fl is 3.64 km or more). What this moves is what the
// lobes move: every ring of a cell, by up to 15.5 % of its distance from the cell's centre outward or 10.6 %
// inward. For the white's edge that is at most 2.1 km out or 1.4 km in, on the largest cell there can be (24 km
// in half-width), and on a cell of 10 km in half-width 0.9 km out or 0.6 km in across the wind (along the wind,
// where such a cell may be 18 km in half-length, up to 1.55 km out or 1.06 km in). (3) In lowPuff() the raggedness by cells of
// the deck's 2 km grid comes in by the same law on fw: it moves the depth by up to a quarter, grid cell by grid
// cell, and so the outline and the pale ring's outer edge. The white is cut by two tests: that there is cloud
// at the point at all (the first test of the street's line, which carries the raggedness (3) as every outline
// does), and that some cell stands at half its own depth there (the share, into which no footprint enters but
// through (2)). So where a white top reaches the outline, or a cell is white to its edge, that edge is ragged
// with the outline; the white's edge inside the cloud is not.
// Returns x the depth of cloud at the point (km, summed over the cells in reach), y how much of it shows (0 to
// 1), z the greatest share of its own depth at which any cell in reach stands here (0 to 1).
vec3 streets(vec2 jl, float t, float fl) {
  vec2 p = vec2(jl.x + 9. * (tnoise(jl / 31.) - 0.5), jl.y);                  // a street wanders a few km across the wind
  vec2 q = vec2(p.x, p.y - t * 5.);
  float la = 0.5 * smoothstep(2.2, 3.4, 8. / fl); float lob = 1.;
  if (la > 0.) lob += la * (tnoise(q / 8. + 3.1) - 0.5);
  float lx = floor(p.x / 28.); float D = 0.; float O = 0.; float Q = 0.;
  for (int i = -1; i <= 1; i++) {
    float cx = lx + float(i);
    vec3 hl = thash3((cx * 1.7 + 0.3) * 12.9898 + 4.1414);
    if (hl.x < 0.25) continue;
    vec3 hm = thash3((cx * 2.9 + 4.1) * 12.9898 + 4.1414);
    float xc = (cx + 0.5) * 28. + 24. * (hl.y - 0.5);
    float w0 = mix(8., 15., hl.z); float sy = mix(15., 24., hm.x);
    float g0 = -20. + 60. * hm.y; float rl = (400. + 420. * uVar.w) * mix(0.4, 1., hm.z);
    float yl = tcoast(xc);                                                    // the shore where this street leaves it
    float qy = q.y / sy + hl.x * 17.; float ly = floor(qy);
    // (a cell is looked up from its own lane and the two beside it, and from three places along it; its reach is
    // tapered to nothing before either window ends, so no cell is ever cut by a straight edge)
    float twx = 1. - smoothstep(30., 42., abs(p.x - (cx + 0.5) * 28.));
    for (int j = -1; j <= 1; j++) {
      vec2 c = vec2(cx, ly + float(j));
      vec3 hc = thash3(dot(c + 7.5, vec2(127.1, 311.7)));
      float ry = (qy - (c.y + 0.5 + 0.6 * (hc.x - 0.5))) * sy;
      if (abs(ry) > 1.2 * sy) continue;
      vec3 hd = thash3(dot(c + 3.5, vec2(127.1, 311.7)));
      float off = p.y - ry - yl;                                              // how far off the shore the cell has drifted
      float fin = g0 + sy + (0.6 * thash2(vec2(cx, floor(c.y / 3.)) + 11.5) + 0.4 * hd.x) * rl;
      vec2 ctr = vec2(xc + 8.4 * (hc.z - 0.5), p.y - ry);                     // the cell's centre (jet km)
      float w = max(5., w0 * (0.5 + 1.1 * hc.y)) * smoothstep(0., sy, off - g0) * smoothstep(0., sy, fin - off)
        * smoothstep(60., 140., length(ctr - uRing[0].xy) - uRing[0].z);     // kept clear of the loop by the map alone
      if (w <= 1.5) continue;
      float l = min(w * (1. + 0.8 * hd.y), sy);                               // half-length down the wind
      vec2 r = vec2(p.x - ctr.x, ry) / vec2(w, l);
      float r2 = 0.944 * lob * dot(r, r);                                     // an oval, scalloped by the lobes
      if (r2 >= 1.) continue;
      float qs = twx * (1. - smoothstep(0.9 * sy, 1.2 * sy, abs(ry))) * (1. - r2) * (1. - r2);   // share of its own depth here
      float d = w * qs;
      D += d; O += d * smoothstep(2.2, 3.4, 2. * w * sqrt(1. - sqrt(1.5 / w)) / fl); Q = max(Q, qs);
    }
  }
  return vec3(D, D > 0. ? O / D : 0., Q);
}
float tSkirt = 0.;   // set by lowPuff(): 1 where the only cloud at the point is a street's grey skirt, else 0
float tShow = 1.;    // set by lowPuff(): how much of the cloud at the point shows (under 1 only where street cells are under 3.4 times the longer axis of the pixel's footprint across)
// the low deck at map point mm: cloud streets off the coast (streets()), cumulus in patches, a scatter of small
// puffs over the cold shelf round the loop on the low pass; never on the loop itself, its neck or the wall beside
// it. fw = km per pixel here, fl = the longer axis of the pixel's footprint (km). Returns under 0.5 for clear sky;
// for a street 0.5 (its skirt: tSkirt is 1), 0.6 (its pale body) or 0.95 (its white core); for cumulus 0.5 to
// 0.92, pale under 0.708 and white from there.
float lowPuff(vec2 mm, float alt, float fw, float fl) {
  vec2 jl = tjet(mm); float cdist = jl.y - tcoast(jl.x); float ds = jl.y - tyc(jl.x, uT);
  float lo = 1. - smoothstep(110., 330., alt);
  float dR = length(jl - uRing[0].xy) - uRing[0].z;
  float ex = mix(1., smoothstep(60., 140., dR), lo);   // live's leave near the loop, by the camera's height: for the cumulus below alone
  // cloud streets streaming off the coast over the cold shelf (never over the warm side, nor over the land; the
  // cells keep clear of the loop themselves, in streets()); the last cell of the longest street ends within
  // 490 km of the shore (910 km when they cover the whole shelf)
  float msk = (1. - smoothstep(-110., -30., ds)) * smoothstep(0., 8., cdist);
  float street = 0.; float show = 1.;
  if (msk > 0.001 && cdist < 490. + 420. * uVar.w) {
    vec3 st = streets(jl, uT, fl);
    // the outline and the pale ring's outer edge are ragged by whole cells of the deck's own 2 km grid (the depth
    // a quarter up or down by the grid cell's own number) where the picture shows that grid: it comes in by the
    // sea's law for its pixels. The white's share is not touched by it; the test that there is cloud here at all,
    // which the white must pass too, is.
    float rg = 1. + 0.5 * smoothstep(2.2, 3.4, 1. / fw) * (thash2(floor(vec2(dot(mm, TSD), dot(mm, TSP)) * 0.5 + 0.25)) - 0.5);
    float D = st.x * msk * rg;
    // cloud from 1.5 km of depth; white where a cell stands at half its own depth or more; else pale from 3.3 km
    street = D < 1.5 ? 0. : st.z >= 0.5 ? 0.95 : D >= 3.3 ? 0.6 : 0.5;
    show = st.y;
  }
  // open cumulus drifting in patches: small puffs when we are low; from altitude only the heart of a patch, as
  // clumps (a lone fleck of three pixels reads as a dead pixel)
  vec2 dm = mm + vec2(uT * 2.4, uT * 1.1);
  float ptc = smoothstep(0.52, 0.8, tnoise(dm / 310.) * 0.65 + tnoise(dm / 120.) * 0.35);
  float big = smoothstep(0.22, 0.62, tnoise(dm / 13.) * 0.55 + tnoise(dm / 34.) * 0.45) * smoothstep(0.55, 0.93, ptc);
  float small = smoothstep(0.42, 0.85, tnoise(dm / 3.7) * 0.6 + tnoise(dm / 8.5) * 0.4);
  float shelf = lo * smoothstep(70., 130., dR) * (1. - smoothstep(250., 360., dR)) * (1. - smoothstep(-80., -34., ds)) * smoothstep(0.4, 0.62, tnoise(dm / 48.));
  float cells = mix(big, max(ptc, shelf) * small, lo) * 0.92 * (0.74 + 0.26 * smoothstep(30., 150., abs(ds - 30.)));
  // (a puff keeps its pale-grey rim only in the heart of a patch seen from altitude: anywhere else it is white
  // right to its edge, so a puff too small to have a core is a white bead and never a lone grey fleck)
  float cl = cells * smoothstep(-80., 60., cdist) * ex;
  if (cl >= 0.5) cl = max(cl, mix(0.72, 0.5, smoothstep(0.8, 0.97, ptc) * (1. - lo)));
  tSkirt = cl < 0.5 && street > 0.4 && street < 0.55 ? 1. : 0.;
  tShow = cl >= 0.5 ? 1. : show;
  return max(street, cl);
}
void main() {
  vec3 o = vObj + vec3(0., R_E, 0.); vec3 sea = normalize(o) * R_E - vec3(0., R_E, 0.);
  vec2 m = tmapOf(sea);
  float fw = max(max(fwidth(m.x), fwidth(m.y)), 1e-4);
  vec2 sc = vec2(dot(m, TSD), dot(m, TSP));
  float snap = step(2.8, 2. / fw);
  vec2 sc2 = mix(sc, (floor(sc * 0.5) + 0.5) * 2., snap);
  vec2 mm = TSD * sc2.x + TSP * sc2.y;
  float c = max(stormCold(mm, uStorm, uT), stormCold(mm, uStorm2, uT + 7.));
  float puff = 0.; float shad = 0.; float skirt = 0.; float show = 1.; float showS = 1.;
  // the longer axis of the pixel's footprint on the ground (km), the same whichever way the camera is turned about
  // its line of sight: read only to thin street cells under 3.4 of it across and to flatten their 8 km lobes
  vec2 ma = dFdx(m); vec2 mb = dFdy(m); float f2 = dot(ma, ma) + dot(mb, mb); float dt = ma.x * mb.y - ma.y * mb.x;
  float fl = max(sqrt(0.5 * (f2 + sqrt(max(f2 * f2 - 4. * dt * dt, 0.)))), 1e-4);
  if (uLayer < 0.5) {
    float alt = talt();
    puff = lowPuff(mm, alt, fw, fl); skirt = tSkirt; show = tShow;
    // every low cloud lays a print of itself on the sea a little to one side, in the ramp's indigo: the thing that
    // lifts the deck off the map (two cells away when the pixels are cells, about three pixels from altitude)
    float so = max(2., 2.8 * fw);
    shad = lowPuff(mm - TSD * so - TSP * (0.5 * so), alt, fw, fl); showS = tShow;
  }
  float a = step(0.5, max(c, puff));
  // the storm uses all five greys; puffs have pale-grey rims and white cores; a street has those two steps and a
  // thin skirt one grey darker (the third of the five)
  float ks = floor(clamp((c - 0.5) * 2.2, 0., 0.999) * 5.);
  float kp = skirt > 0.5 ? 2. : 3. + floor(clamp((puff - 0.5) * 2.4, 0., 0.999) * 2.);
  float k = c >= 0.5 ? (puff >= 0.5 ? max(ks, kp) : ks) : kp;
  vec3 col = k < 0.5 ? vec3(0.0685, 0.0823, 0.107) : k < 1.5 ? vec3(0.146, 0.171, 0.211) : k < 2.5 ? vec3(0.27, 0.305, 0.366) : k < 3.5 ? vec3(0.46, 0.5, 0.56) : vec3(0.74, 0.76, 0.79);
  float sh = step(0.5, shad) * (1. - a);
  // (street cells under 3.4 times the longer axis of the pixel's footprint across thin away, they and their print: show and showS)
  gl_FragColor = vec4(mix(col, uRamp[0] * 0.55, sh), max(a * (uLayer < 0.5 ? 0.94 : 1.) * (c >= 0.5 ? 1. : show), 0.4 * sh * showS));
}
`;

// Limb: three flat teal airglow bands above the sea's edge, then black.
const LIMB_FRAG = /* glsl */`
varying vec3 vObj;
uniform vec3 uCamL; uniform vec3 uDawn;   // xyz: direction of the sunrise hairline (local), length = strength
void main() {
  vec3 c0 = vec3(0., -6371., 0.);
  vec3 rd = normalize(vObj - uCamL); vec3 oc = uCamL - c0;
  float tm = -dot(oc, rd); vec3 cp = oc + rd * max(tm, 0.);
  float alt = length(cp) - 6371.;
  if (alt < 0. || alt > 96. || tm < 0.) discard;
  float band = floor(alt / 32.);
  vec3 col = vec3(0.0052, 0.3663, 0.3231) * (band < 0.5 ? 1. : band < 1.5 ? 0.5 : 0.2);
  float sl = length(uDawn);
  float dawn = sl * smoothstep(0.86, 0.985, dot(normalize(cp), uDawn / max(sl, 1e-4))) * step(band, 0.5);
  col = mix(col, vec3(0.95, 0.55, 0.12), clamp(dawn, 0., 1.));
  gl_FragColor = vec4(col, 1.);
}
`;

// polar cap of a sphere of radius rr about the map point (1500, 0), in Earth-local axes (centre at 0,-R,0)
async function capGeometry(ctx, rr, rings, segs, maxAng) {
  const tc = XP[0] / R_EARTH, cy = Math.cos(tc), cz = -Math.sin(tc);
  const pos = new Float32Array((rings + 1) * segs * 3);
  let p = 0;
  for (let i = 0; i <= rings; i++) {
    const al = Math.pow(i / rings, 1.25) * maxAng, ca = Math.cos(al), sa = Math.sin(al);
    for (let k = 0; k < segs; k++) {
      const ph = k / segs * Math.PI * 2, cu = Math.cos(ph) * sa, cv = Math.sin(ph) * sa;
      // basis: c = (0, cy, cz), u = (1, 0, 0), v = (0, -cz, cy)
      pos[p++] = cu * rr; pos[p++] = (cy * ca + -cz * cv) * rr - R_EARTH; pos[p++] = (cz * ca + cy * cv) * rr;
    }
    if (i % 6 === 5) await ctx.yield();
  }
  const idx = new Uint32Array(rings * segs * 6);
  let q = 0;
  for (let i = 0; i < rings; i++) {
    for (let k = 0; k < segs; k++) {
      const a = i * segs + k, b = i * segs + (k + 1) % segs, c = a + segs, d = b + segs;
      idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c;
    }
    if (i % 6 === 5) await ctx.yield();
  }
  // make the faces look outward whatever the handedness of the basis turned out to be
  const A = new THREE.Vector3().fromArray(pos, idx[0] * 3), B = new THREE.Vector3().fromArray(pos, idx[1] * 3), C = new THREE.Vector3().fromArray(pos, idx[2] * 3);
  const nrm = B.clone().sub(A).cross(C.clone().sub(A));
  if (nrm.dot(A.clone().add(new THREE.Vector3(0, R_EARTH, 0))) < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -R_EARTH, 0), rr + 10);
  return g;
}

export async function buildHero(ctx, opts = {}) {
  const uniforms = opts.uniforms || makeThermalUniforms();
  const object = new THREE.Group();
  await ctx.yield();
  const layer = (frag, extra, order, blend) => {
    const m = new THREE.ShaderMaterial({ uniforms: { ...uniforms, ...extra }, vertexShader: SEA_VERT, fragmentShader: frag, depthTest: false, depthWrite: false, fog: false });
    if (blend) { m.blending = THREE.CustomBlending; m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; }
    m.userData.order = order;
    return m;
  };
  const add = (geo, mat) => { const me = new THREE.Mesh(geo, mat); me.frustumCulled = false; me.renderOrder = mat.userData.order; object.add(me); return me; };
  const seaGeo = await capGeometry(ctx, R_EARTH, 96, 192, 0.74);
  await ctx.yield();
  const seaMat = layer(SEA_FRAG, {}, -10, false);
  await ctx.yield();
  const sea = add(seaGeo, seaMat);
  await ctx.yield();
  const cloudGeoA = await capGeometry(ctx, R_EARTH + 4, 64, 128, 0.74);
  await ctx.yield();
  const cloudLow = add(cloudGeoA, layer(CLOUD_FRAG, { uLayer: { value: 0 } }, -9, true));
  await ctx.yield();
  const cloudGeoB = await capGeometry(ctx, R_EARTH + 16, 64, 128, 0.74);
  await ctx.yield();
  const cloudHigh = add(cloudGeoB, layer(CLOUD_FRAG, { uLayer: { value: 1 } }, -8, true));
  await ctx.yield();
  const limbGeo = await capGeometry(ctx, R_EARTH + 100, 48, 128, 0.76);
  await ctx.yield();
  const uDawn = { value: new THREE.Vector3(0, 0, 0) };
  const limb = add(limbGeo, layer(LIMB_FRAG, { uDawn }, -7, false));
  await ctx.yield();
  // in the set-piece viewer the cap is shown whole: shrink it and sit it on the ground disc
  const camL = new THREE.Vector3(), inv = new THREE.Matrix4();
  return {
    object, uniforms, uDawn, sea, cloudLow, cloudHigh, limb,
    radius: 2200, height: 600, center: new THREE.Vector3(0, -180, -1500),
    anchors: {
      scarCrossing: new THREE.Vector2(XP[0], XP[1]),          // map km: the portal hangs above this point
      stormTrack: new THREE.Vector2(DW[0], DW[1]),
      trackStart: new THREE.Vector3(0, 0, 0), trackDir: new THREE.Vector3(0, 0, -1),
    },
    // keeps the clock and the camera-local uniforms current; the world sets the scripted ones
    update(dt, time, camera) {
      uniforms.uT.value = time;
      object.updateMatrixWorld(true);
      inv.copy(object.matrixWorld).invert();
      camera.getWorldPosition(camL).applyMatrix4(inv);
      uniforms.uCamL.value.copy(camL);
      const up = camL.y + R_EARTH, rr = Math.max(1, Math.hypot(camL.x, up, camL.z));
      uniforms.uCam.value.set(Math.atan2(-camL.z, up) * R_EARTH, Math.asin(Math.max(-1, Math.min(1, camL.x / rr))) * R_EARTH);
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}
