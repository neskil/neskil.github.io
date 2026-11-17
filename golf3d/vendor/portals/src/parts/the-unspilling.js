// THE UNSPILLING: hero set piece. "The tea tray falling upward."
//
// One accident, authored forward in closed form and played backwards by a clock: a 12 m hammered copper tray
// (scalloped rim, ring handle on three beaded arms) slides off a pass shelf, tips, flings forty tulip glasses
// (gold rims, red-and-white saucers, spoons), lands on its rim, rolls 78 m down the aisle and falls back against
// the island end. Each glass IS its 24 shards (exactly shared edges, one vertex shader that picks the branch by
// the clock), so there is never a swap: 960 curved shards, splinters, amber tea ribbons, puddles and wet trails.
// (An egg opens into two cups of shell and four chips from its crack instead.)
//
// LOCAL FRAME: origin on the floor, +Y up, the camera arrives from +Z and flies toward -Z. The piece is laid out
// in the brief's room coordinates shifted by 115 m: place hero.object at world (0, 0, -115), unrotated, unscaled.
//   tray at rest on the shelf   local (14, 18, -50)   = world (14, 18, -165)
//   tray lands on the floor     local (-2, 0, -15)    = world (-2, 0, -130)
//   tray leaning at the island  local (16, 0, 53)     = world (16, 0, -62)   (disc faces +Z, lit, on the entry axis;
//                                                                         opts.restZ moves it: the room uses 79)
//   wreck of glass and tea      spread around local (-3, 0, -5), about 35 m in radius
//
// CLOCK: T = seconds of forward time since the accident began (T = 0 everything laid on the shelf, T = 11 the
// tray leaning on the island and every shard still). hero.setProgress(u) maps the world's path u to T with the
// brief's falling curve (T 11 until u 0.008, upright by 0.05, roll to 0.285, the rise 0.285..0.38 slow at first and
// quicker at the end, so the load is still docking at 0.34..0.37 when the room's camera is close, slide home by 0.395,
// T = 0 afterwards).
// hero.setProgress(u, true) adds the rare
// "time catches" bump (from u 0.326 T rises a quarter of a second in a second, then runs back to the curve by 0.368). hero.setClock(T) sets T directly.
// Any u gives the same frame: nothing is integrated. If the world never calls setProgress, update() plays a demo
// keyed to the camera's bearing around the centre (that is what the set-piece viewer shows).
//
// opts: palette (7 hex strings, the brief's), load: 'tea' | 'milk' | 'sherbet' (tulip glasses and amber tea; eggs,
//   yolks and milk; bottles, red sherbet and pomegranate seeds), stage (default true: a stand-in piece of pass
//   shelf and island end so the tray rests on something; pass stage: false when the room has the real ones),
//   sunDir / sunColor / skyColor / bounceColor (see setLight), windows: { wallX, y0, y1, z: [[z0,z1] x4] } in
//   LOCAL space for the beam mask (default: the brief's four windows; up to five), beams (0..1, default 1; 0 for
//   overcast), fillColor (cool light from the window wall on faces turned to it), windowGain (how bright the windows
//   are in reflections),
//   saucerColor (hex for the saucer band; default madder red, blue-grey for milk), rare (default for setProgress),
//   breath (seconds, default 0.03: a slow sway of the clock so a held frame is never frozen; 0 switches it off),
//   restZ (local z of the island end the tray leans on), camAt(u, out) (the camera's local position along the
//   flight: the load is planned so that no vessel passes within 7.5 m of it).
// returns: object, radius 38 (the viewing radius round the rise; the whole event spans about 62 m), height 27, center, anchors, update(dt, time, camera), setProgress(u, rare),
//   setClock(T), setLight({ sunDir, sunColor, skyColor, bounceColor, beams }), uniforms (shared), trayPose(T, pos,
//   quat) (the tray's local pose at clock T, for aiming pois), clockAt(u), plan (the planned load, for tools), dispose().
// anchors (local): trayShelf, trayFloor, trayLean, wreck, closePass (camera point abreast of the laid tray),
//   flyThrough (the brief's camera line through the event, at least 6 m clear of the tray's swept track and of the
//   shelf), viewpoints (entry: looking at the leaning disc; rise: behind and below the climbing tray),
//   portalSeat (where the brief's hatch portal is, far outside the piece, for reference only).
// LIGHT: self-lit ShaderMaterials (no three.js lights are read): one sun direction, a blue-grey sky shade, a warm
//   floor bounce and an analytic window-beam mask with a slow leaf dapple; glass and tea are back and side lit.
//   Copper is a dark tinted mirror of floor, vault and windows with the light in its rim and highlights. HERO_GLSL
//   exports the light block, the solid shader and the liquid chunk so the room's ware, cat and vessels match.
//   Give it the room's sun through setLight() so shards agree with the kit rig. Fog: scene fog is honoured.
// COST: about 67k triangles, 13 draw calls (12 with stage: false), 12 shader programs, no lights, no textures, build about
//   100 ms with yields every few glasses. ground is false while the stage is on (it brings its own marble floor patch).

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#ECE8DF', '#8E9AA8', '#B5673A', '#C8791C', '#9DB24C', '#3A2A22', '#2F8F8C'];
const TRAY_R = 6, GRAV = 9.8, T_END = 11;
const T_SLIDE = 0.9, T_AIR = 2.45, T_LAND = T_SLIDE + T_AIR, T_ROLL_END = 9.6;
const LEAN_REST = 0.354, LAND_LEAN = 0.12, SLIDE_K = 0.45;
const SHELF = new THREE.Vector3(14, 18.14, -50), LAND = new THREE.Vector3(-2, 0, -15), REST_X = 16, REST_Z = 53;
const UP = new THREE.Vector3(0, 1, 0);

// monotone cubic through knots (Fritsch-Carlson): C1, never overshoots
function makePchip(xs, ys) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return (x) => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
export { makePchip };
const clockCurve = makePchip([0, 0.008, 0.05, 0.12, 0.285, 0.30, 0.32, 0.34, 0.36, 0.38, 0.395, 1], [T_END, T_END, T_ROLL_END, 6.4, T_LAND, 2.9, 2.58, 2.15, 1.45, 0.55, 0, 0]);
function clockAt(u, rare) {
  let T = clockCurve(u);
  // time catches: for about a second (u 0.326 to 0.3415 of this clock's u) the clock runs forward again, a quarter of a
  // second net, so the tray and its half-knitted load sag; then it runs back fast and joins the ordinary curve by 0.368.
  // The curve falls about 21 s per unit u there, so the lift has to be steeper than that: 0.58 s over 0.0155.
  if (rare) T += 0.58 * smoothstep(0.326, 0.3415, u) * (1 - smoothstep(0.3415, 0.368, u));
  return clamp(T, 0, T_END);
}

// The tray's forward motion in closed form. Returns pose(T, pos, quat) in local space plus the constants used.
function makeTrayMotion(rng, restZ = REST_Z) {
  const spinRate = rng.range(2.3, 3.0) * (rng.chance(0.5) ? 1 : -1);
  // rim-roll track on the floor (forward time: from the landing point round the island corner to the rest point)
  const B = [new THREE.Vector2(LAND.x, LAND.z), new THREE.Vector2(-12 + rng.range(-1.5, 1.5), 10 + rng.range(-3, 3)),
    new THREE.Vector2(-14 + rng.range(-2, 1), restZ), new THREE.Vector2(REST_X, restZ)];
  const bez = (t, o) => { const a = 1 - t; return o.set(a * a * a * B[0].x + 3 * a * a * t * B[1].x + 3 * a * t * t * B[2].x + t * t * t * B[3].x, a * a * a * B[0].y + 3 * a * a * t * B[1].y + 3 * a * t * t * B[2].y + t * t * t * B[3].y); };
  const NS = 96, tab = new Float32Array(NS + 1), pa = new THREE.Vector2(), pb = new THREE.Vector2();
  bez(0, pa); for (let i = 1; i <= NS; i++) { bez(i / NS, pb); tab[i] = tab[i - 1] + pa.distanceTo(pb); pa.copy(pb); }
  const trackLen = tab[NS];
  const paramAt = (s) => { s = clamp(s, 0, trackLen); let i = 0; while (i < NS - 1 && tab[i + 1] < s) i++; return (i + (s - tab[i]) / Math.max(tab[i + 1] - tab[i], 1e-6)) / NS; };
  const hL = new THREE.Vector3(B[1].x - B[0].x, 0, B[1].y - B[0].y).normalize();          // heading at the landing
  const nL = new THREE.Vector3().crossVectors(hL, UP);
  const landC = new THREE.Vector3(LAND.x, 0, LAND.z).addScaledVector(UP, TRAY_R * Math.cos(LAND_LEAN)).addScaledVector(nL, -TRAY_R * Math.sin(LAND_LEAN));
  const vh = new THREE.Vector3(landC.x - SHELF.x, 0, landC.z - SHELF.z).multiplyScalar(1 / (T_AIR + T_SLIDE * 0.5));
  const slideD = vh.clone().multiplyScalar(T_SLIDE * 0.5), airA = SHELF.clone().add(slideD);
  const vy0 = (landC.y - airA.y + 0.5 * GRAV * T_AIR * T_AIR) / T_AIR;
  const psiAir0 = 0.5 * spinRate * T_SLIDE, psiLand = psiAir0 + spinRate * T_AIR;
  const h = new THREE.Vector3(), n = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
  const m4 = new THREE.Matrix4(), qs = new THREE.Quaternion(), p2 = new THREE.Vector2(), p3 = new THREE.Vector2();
  function pose(T, pos, quat) {
    let lean, psi;
    if (T <= T_SLIDE) {
      const x = Math.max(T, 0) / T_SLIDE; h.copy(hL); lean = Math.PI / 2; psi = 0.5 * spinRate * T_SLIDE * x * x;
      pos.copy(SHELF).addScaledVector(slideD, x * x);
    } else if (T <= T_LAND) {
      const dt = T - T_SLIDE, x = dt / T_AIR; h.copy(hL); psi = psiAir0 + spinRate * dt;
      lean = Math.PI / 2 - (Math.PI / 2 - LAND_LEAN) * x * x * (1.4 - 0.4 * x);
      pos.copy(airA).addScaledVector(vh, dt); pos.y += vy0 * dt - 0.5 * GRAV * dt * dt;
    } else {
      const x = clamp((T - T_LAND) / (T_ROLL_END - T_LAND), 0, 1), s = trackLen * (1 - Math.pow(1 - x, 1.6)), t = paramAt(s);
      const t0 = Math.min(t, 0.985); bez(t0, p2); bez(t0 + 0.012, p3); h.set(p3.x - p2.x, 0, p3.y - p2.y).normalize(); bez(t, p2);
      psi = psiLand - s / TRAY_R;
      lean = LAND_LEAN * Math.pow(1 - x, 8) + (0.03 + 0.24 * x * x * x) * Math.sin(Math.PI * (2 + 12 * x * x)) * (1 - Math.pow(1 - x, 8));
      let hop = 0; const b1 = (T - T_LAND) / 0.5, b2 = (T - T_LAND - 0.5) / 0.32;
      if (b1 > 0 && b1 < 1) hop = 1.7 * Math.sin(Math.PI * b1); else if (b2 > 0 && b2 < 1) hop = 0.55 * Math.sin(Math.PI * b2);
      if (T > T_ROLL_END) { const tau = T - T_ROLL_END; lean = LEAN_REST * (1 - Math.exp(-3.6 * tau) * Math.abs(Math.cos(4.6 * tau))); }
      n.crossVectors(h, UP);
      pos.set(p2.x, hop, p2.y).addScaledVector(UP, TRAY_R * Math.cos(lean)).addScaledVector(n, -TRAY_R * Math.sin(lean));
      // rounding the island's corner (x 5.4, 3.4 m north of the rest line) the disc swings wide of it, toward the room:
      // yawed and wobbling as it is there, it would otherwise cut through the end of the island
      pos.z += 3.0 * smoothstep(13.5, 8, pos.x) * smoothstep(-4, 2.5, pos.x) * smoothstep(restZ - 22, restZ - 10, pos.z);
    }
    n.crossVectors(h, UP); X.copy(h); Y.copy(n).multiplyScalar(Math.cos(lean)).addScaledVector(UP, Math.sin(lean)); Z.crossVectors(X, Y);
    m4.makeBasis(X, Y, Z); quat.setFromRotationMatrix(m4); qs.setFromAxisAngle(UP, psi); quat.multiply(qs);
    if (T > T_LAND && T < T_ROLL_END) {                    // rolling, it yaws a little off its heading, its face to the room (a wide disc on its rim never runs true)
      const x = (T - T_LAND) / (T_ROLL_END - T_LAND), a = clamp(x / 0.14, 0, 1), c = clamp((x - 0.5) / 0.3, 0, 1);
      qs.setFromAxisAngle(UP, (0.4 + 0.06 * Math.sin(T * 2.3)) * a * a * (3 - 2 * a) * (1 - c * c * (3 - 2 * c))); quat.premultiply(qs);
    }
    return pos;
  }
  return { pose, trackLen, hL, vh, spinRate };
}

// ---------------------------------------------------------------- shared GLSL
const G_VERT_COMMON = /* glsl */`
uniform float uT;
uniform mat4 uTray;
varying vec3 vLocal; varying vec3 vN; varying vec3 vView;
const float SLIDE_K = ${SLIDE_K.toFixed(2)};
vec3 qrot(vec4 q, vec3 v) { return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
vec3 rod(vec3 w, float t, vec3 v) {
  float r = length(w); vec3 k = w / max(r, 1e-5); float a = r * t, c = cos(a), s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c);
}
`;
const G_VERT_END = /* glsl */`
  vLocal = P; vN = mat3(modelMatrix) * N;
  vec4 wp = modelMatrix * vec4(P, 1.); vView = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
`;
const G_LIGHT = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uBounceCol;
uniform vec4 uWin[5]; uniform vec3 uWall; uniform vec4 uFill;        // uFill: rgb = soft light from the window wall, a = how bright the windows are in reflections
float beamMask(vec3 p) {
  float sx = min(uSunDir.x, -.05);
  vec3 h = p + uSunDir * max((uWall.x - p.x) / sx, 0.);
  float m = 0.;
  for (int i = 0; i < 5; i++) {
    vec4 w = uWin[i];
    m += smoothstep(w.x - .7, w.x + .7, h.z) * (1. - smoothstep(w.y - .7, w.y + .7, h.z)) * smoothstep(w.z - .7, w.z + .7, h.y) * (1. - smoothstep(w.w - .7, w.w + .7, h.y));
  }
  float dap = .76 + .24 * sin(h.z * .21 + uWall.z * .8) * sin(h.y * .27 - uWall.z * .6 + h.z * .08);
  return mix(1., clamp(m, 0., 1.) * dap, uWall.y);
}
// shade: sky from above, warm floor bounce from below, and the cool soft light of the window wall from the left
vec3 ambient(vec3 N) { return mix(uBounceCol, uSkyCol, N.y * .5 + .5) + uFill.rgb * max(.4 - .6 * N.x, 0.); }
// what a shiny thing sees: the sunlit or shaded marble below, the dark vault above, and to the left the tall bright
// windows with their glazing bars
vec3 envLight(vec3 R, float beam) {
  vec3 L = normalize(uSunDir);
  vec3 e = mix(uBounceCol * 1.4 + uSunCol * beam * vec3(.2, .17, .13), uSkyCol * .6, smoothstep(-.12, .3, R.y));
  float wx = max(-R.x, 0.);
  float win = smoothstep(.1, .45, wx) * (1. - smoothstep(.3, .7, abs(R.y - .2)));
  vec2 q = vec2(R.z, R.y) / max(wx, .15);
  float bars = smoothstep(.03, .1, abs(fract(q.x * .8) - .5)) * smoothstep(.04, .14, abs(fract(q.y * 1.5 + .2) - .5));
  float pier = 1. - smoothstep(.3, .36, abs(fract(q.x * .4 + .3) - .5));                 // the piers between the windows stay dark
  e += uSkyCol * uFill.a * win * (.08 + .92 * pier) * (.35 + .65 * bars);
  return e + uSunCol * beam * 2.5 * smoothstep(.93, .995, dot(R, L));
}
float hash21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
float veins(vec2 p) {                                 // 0..1 darkening: long irregular veins, finer ones, soft clouds
  float w = vnoise(p * .11) * 2.;
  float a = 1. - smoothstep(0., .05, abs(vnoise(p * .3 + w * 1.7) - .5)), b = 1. - smoothstep(0., .035, abs(vnoise(p * .85 + 5. + w) - .5));
  return .28 * a * (.4 + .6 * vnoise(p * .5 + 3.)) + .1 * b + .07 * (vnoise(p * .21 + 9.) - .5);
}
`;

// the light chunk, for the world's own shaders (nuts, jars, cat, laid trays): they bind hero.uniforms and pass points in
// the hero's LOCAL space (world z + 115) to beamMask()
export const HERO_GLSL = { light: G_LIGHT, solid: '', tea: '' };

// lit solids: copper, brass, glazed ceramic, marble, walnut. vSurf = (metal, gloss, pattern id)
const SOLID_FRAG = /* glsl */`
${G_LIGHT}
varying vec3 vLocal; varying vec3 vN; varying vec3 vView; varying vec3 vColor; varying vec3 vSurf; varying vec3 vObj;
#include <fog_pars_fragment>
vec3 cell(vec2 p) {                                   // hammer dimples: distance to the nearest facet centre, and its offset
  vec2 ip = floor(p), fp = fract(p); float best = 9.; vec2 off = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = g + vec2(hash21(ip + g), hash21(ip + g + 17.3)) - fp; float d = dot(o, o);
    if (d < best) { best = d; off = o; }
  }
  return vec3(sqrt(best), off);
}
void main() {
  vec3 V = normalize(vView + vec3(1e-5));
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  vec3 alb = vColor; float metal = vSurf.x, gloss = vSurf.y, pat = vSurf.z;
  if (pat > .5 && pat < 1.5) {                        // hammered, engraved copper (object space, so it turns with the tray)
    float r = length(vObj.xz);
    vec3 c = cell(vObj.xz * 6.5 + vObj.y * 6.);
    vec3 t1 = normalize(cross(N, vec3(.31, .2, .93)) + vec3(1e-4)); vec3 t2 = cross(N, t1);
    vec2 hq = vObj.xz * 6.5 + vObj.y * 6.; float hf = clamp(1.3 - 1.6 * length(fwidth(hq)), 0., 1.);
    N = normalize(N + (t1 * c.y + t2 * c.z) * .14 * hf * smoothstep(.0, .5, c.x));
    float ring = (1. - smoothstep(.0, .035, abs(fract(r * .62 + .5) - .5))) * step(r, 5.6);
    float petals = (1. - smoothstep(.0, .1, abs(sin(atan(vObj.z, vObj.x + (abs(vObj.x) < 1e-4 ? 2e-4 : 0.)) * 8.) * .5 - fract(r * .31) + .25))) * step(r, 1.9) * step(.45, r);
    alb *= 1. - .34 * max(ring, petals);
    alb *= .93 + .12 * vnoise(vObj.xz * 3.3 + 3.) + .12 * (vnoise(vObj.xz * .7) - .5);
    gloss *= 1. - .6 * max(ring, petals);
  } else if (pat > 1.5 && pat < 2.5) {                // marble: grey veins
    alb *= 1. - veins(vObj.xz + vObj.y * vec2(.7, .4)) - .04 * hash21(floor(vObj.xz * 9.));
  } else if (pat > 2.5 && pat < 3.5) {                // walnut: long grain
    float g = vnoise(vec2((vObj.x + vObj.z) * .3, vObj.y * 5.)) + .5 * vnoise(vec2((vObj.x - vObj.z) * .9, vObj.y * 17.));
    alb *= 2.1 * (.8 + .2 * g + .04 * sin(vObj.y * 43. + vObj.z * 3.));
  } else if (pat > 3.5) {                             // floor: 6 m marble slabs, grey veins, brass joint strips
    vec2 g = vObj.xz / 6., f = abs(fract(g) - .5); float joint = step(.4875, max(f.x, f.y));
    float hs = hash21(floor(g)); vec2 q = (hs > .5 ? vObj.xz : vObj.zx) + hs * 40.;
    alb *= (.92 + .08 * hash21(floor(g) + 7.)) * (1. - veins(q));
    alb = mix(alb, vec3(.6, .4, .16), joint); metal = joint; gloss = mix(gloss, .6, joint);
  }
  float beam = beamMask(vLocal);
  vec3 L = normalize(uSunDir), H = normalize(L + V + vec3(1e-5));
  float nlr = dot(N, L), nl = max(nlr, 0.), nh = max(dot(N, H), 0.);
  vec3 R = reflect(-V, N), env = envLight(R, beam);
  float nv = max(dot(N, V), 0.), f1 = 1. - nv, fres = f1 * f1 * f1;
  float sp = pow(nh, mix(10., 120., gloss)) * (.4 + 3.2 * gloss);
  // not metal: lit colour, a little of the room in the glaze
  vec3 col = alb * (uSunCol * nl * beam + ambient(N)) + vec3(.045) * (env * .12 * gloss + uSunCol * sp * beam * nl) + fres * gloss * .25 * env;
  // metal: a dark tinted mirror of the room (windows, vault, floor), a satin sheen where the sun is on it, a hot
  // highlight; the underside of the tray looks down into its own shadow
  float under = pat > .5 && pat < 1.5 ? 1. - smoothstep(-.12, .0, vObj.y) : 0.;
  vec3 F0 = min(alb * 1.25, vec3(1.)), F = F0 + (1. - F0) * fres * f1;
  float wrap = max(nlr * .4 + .6, 0.); wrap *= wrap;
  vec3 met = F * (env / (1. + env * 1.6)) * mix(1., .3, under) + alb * ambient(N) * mix(.08, .05, under)
    + F0 * uSunCol * beam * (wrap * mix(.11, .04, under) * (pat > .5 ? 1. : .6) + .12 * nh * nh * nh * nh + .35 * sp * nl + 5. * pow(nh, 240.) * nl);
  met += F0 * (uBounceCol * 1.4 + uSunCol * beam * vec3(.4, .34, .26)) * (1. - under) * .5 * clamp(1. - N.y, 0., 1.) * clamp(1. - N.y, 0., 1.);     // a face turned from the sky takes the glow of the sunlit marble
  col = mix(col, met, metal);
  if (dot(vView, vView) < 4.) discard;
  gl_FragColor = vec4(clamp(col, 0., 24.), 1.);
  #include <fog_fragment>
}`;

HERO_GLSL.solid = SOLID_FRAG;                          // the world draws its copper and brass ware with the same shader

// a rigid thing placed by one matrix (the tray; the stage with the identity)
const OBJ_VERT = /* glsl */`
${G_VERT_COMMON}
uniform mat4 uObj;
attribute vec3 color; attribute vec3 aSurf;
varying vec3 vColor; varying vec3 vSurf; varying vec3 vObj;
#include <fog_pars_vertex>
void main() {
  vec3 nb = normal;                                    // the tray's flat faces are very slightly dished, so the room's reflection sweeps across them
  if (aSurf.z > .5 && aSurf.z < 1.5 && abs(normal.y) > .9) nb = normalize(nb + vec3(position.x, 0., position.z) * (.05 * sign(normal.y)));
  vec3 P = (uObj * vec4(position, 1.)).xyz, N = mat3(uObj) * nb;
  vColor = color; vSurf = aSurf; vObj = position;
  ${G_VERT_END}
  #include <fog_vertex>
}`;

// instanced rigid flyers (saucers, spoons, tea plugs): ride the tray, fly a parabola tumbling, land, rattle flat, slide
const FLYER_PARS = /* glsl */`
attribute vec4 iSlot; attribute vec3 iP0; attribute vec4 iV0; attribute vec4 iW; attribute vec4 iQ; attribute vec4 iSl;
void flyer(in vec3 l0, in vec3 n0, out vec3 P, out vec3 N) {
  float yc = cos(iSl.z * 6.2832), ys = sin(iSl.z * 6.2832);
  vec3 l = vec3(l0.x * yc + l0.z * ys, l0.y, l0.z * yc - l0.x * ys), n = vec3(n0.x * yc + n0.z * ys, n0.y, n0.z * yc - n0.x * ys);
  if (uT <= iSlot.w) { P = (uTray * vec4(iSlot.xyz + l, 1.)).xyz; N = mat3(uTray) * n; return; }
  float dt = min(uT, iV0.w) - iSlot.w, ds = max(uT - iV0.w, 0.);
  vec3 C = iP0 + iV0.xyz * dt + vec3(0., -4.9, 0.) * dt * dt;
  vec3 v = rod(iW.xyz, dt, qrot(iQ, l)); N = rod(iW.xyz, dt, qrot(iQ, n));
  vec3 a = rod(iW.xyz, dt, qrot(iQ, vec3(0., 1., 0.)));
  vec3 tgt = vec3(0., a.y < 0. ? -1. : 1., 0.);
  vec3 kx = cross(a, tgt); float kl = length(kx);
  float s = 1. - exp(-3.2 * ds) * abs(cos(7.5 * ds + iSl.z * 6.));
  if (kl > 1e-3 && ds > 0.) { vec3 w = kx / kl * asin(clamp(kl, 0., 1.)) * s; v = rod(w, 1., v); N = rod(w, 1., N); }
  C.xz += iSl.xy * (1. - exp(-SLIDE_K * ds));
  C.y = mix(C.y, iW.w, ds > 0. ? s : 0.);
  P = C + v;
}`;
const FLYER_VERT = /* glsl */`
${G_VERT_COMMON}
${FLYER_PARS}
attribute vec3 color; attribute vec3 aSurf;
varying vec3 vColor; varying vec3 vSurf; varying vec3 vObj;
#include <fog_pars_vertex>
void main() {
  vec3 P, N; flyer(position, normal, P, N);
  vColor = color; vSurf = aSurf; vObj = position;
  ${G_VERT_END}
  #include <fog_vertex>
}`;

// the forty vessels: every vertex knows its piece, so the glass is its shards
const GLASS_VERT = /* glsl */`
${G_VERT_COMMON}
attribute vec4 aSlot; attribute vec3 aP0; attribute vec4 aV0; attribute vec4 aW; attribute vec4 aQ;
attribute vec3 aPc; attribute vec4 aPv; attribute vec4 aPw; attribute vec2 aInfo;
varying vec3 vInfo;
#include <fog_pars_vertex>
void main() {
  vec3 P, N;
  if (uT <= aSlot.w) { P = (uTray * vec4(aSlot.xyz + position, 1.)).xyz; N = mat3(uTray) * normal; }
  else {
    float tB = aV0.w, dt = min(uT, tB) - aSlot.w;
    vec3 G = aP0 + aV0.xyz * dt + vec3(0., -4.9, 0.) * dt * dt;
    vec3 a = rod(aW.xyz, dt, qrot(aQ, position));
    N = rod(aW.xyz, dt, qrot(aQ, normal));
    if (uT <= tB) P = G + a;
    else {
      vec3 pc = rod(aW.xyz, dt, qrot(aQ, aPc));
      float d2 = min(uT, aW.w) - tB, ds = max(uT - aW.w, 0.);
      vec3 C = G + pc + aPv.xyz * d2 + vec3(0., -4.9, 0.) * d2 * d2;
      C.xz += vec2(aPv.w, aPw.w) * (1. - exp(-SLIDE_K * ds));
      float ang = d2 + (1. - exp(-3. * ds)) * .12;
      P = C + rod(aPw.xyz, ang, a - pc); N = rod(aPw.xyz, ang, N);
    }
  }
  vInfo = vec3(aInfo, 0.);
  ${G_VERT_END}
  #include <fog_vertex>
}`;
const SPLINTER_VERT = /* glsl */`
${G_VERT_COMMON}
attribute vec4 iB; attribute vec4 iV; attribute vec4 iS; attribute vec3 iL;
varying vec3 vInfo;
#include <fog_pars_vertex>
void main() {
  float d = clamp(uT - iB.w, 0., iV.w - iB.w), ds = max(uT - iV.w, 0.);
  float show = smoothstep(0., .08, uT - iB.w);
  vec3 C = iB.xyz + iV.xyz * d + vec3(0., -4.9, 0.) * d * d;
  C.xz += iL.xy * (1. - exp(-SLIDE_K * ds));
  float ang = d + (1. - exp(-3. * ds)) * .1;
  vec3 P = C + rod(iS.xyz, ang, position * iS.w * show), N = rod(iS.xyz, ang, normal);
  vInfo = vec3(.3, iL.z, step(.5, fract(iL.z * 7.13)));
  ${G_VERT_END}
  #include <fog_vertex>
}`;
// vInfo = (height fraction along the vessel, per-piece seed, gem: 1 for a pomegranate seed)
const GLASS_FRAG = /* glsl */`
${G_LIGHT}
uniform vec3 uTint; uniform vec3 uGold; uniform vec3 uGem; uniform vec4 uGlassP;   // opaque 0|1, rim band start, gem share, waist line
uniform float uT;
varying vec3 vLocal; varying vec3 vN; varying vec3 vView; varying vec3 vInfo;
#include <fog_pars_fragment>
void main() {
  vec3 V = normalize(vView + vec3(1e-5)), N = normalize(vN + vec3(0., 1e-5, 0.));
  float inside = dot(N, V) < 0. ? 1. : 0.; if (inside > .5) N = -N;
  float nv = max(dot(N, V), 0.), fres = (1. - nv) * (1. - nv);
  float beam = beamMask(vLocal);
  vec3 L = normalize(uSunDir), H = normalize(L + V + vec3(1e-5)), R = reflect(-V, N);
  float nl = max(dot(N, L), 0.);
  float laid = 1. - smoothstep(0., 1.2, uT);                                                               // the load at rest on its tray
  float sp = pow(max(dot(N, H), 0.), mix(70., 230., laid)) * beam;
  float glint = pow(max(dot(R, L), 0.), 10.) * beam * (.55 + .45 * sin(uWall.z * .9 + vInfo.y * 61.));     // one slow glint per shard
  glint *= mix(1., .2, laid);                                                           // the laid load is calm: with the sun behind the viewer the tea shows amber, not a white flare on every glass
  float back = .5 + .5 * max(dot(-V, L), 0.);                                                            // lit through from behind
  vec3 env = envLight(R, beam);
  vec3 col = env * (.10 + .9 * fres) + uSunCol * (sp * 2. + glint * .5 + fres * beam * back * .45) + uTint * (uSunCol * beam * .3 * back + ambient(N) * .7);
  float wl = pow(max(dot(N, normalize(vec3(-.85, .4, -.15) + V)), 0.), 60.);                               // the windows: one sharp line down the glass
  col += uSkyCol * uFill.a * .45 * wl * (1. - .45 * laid);
  float a = .16 + .7 * fres + sp + glint * .5 + .12 * beam + wl * .6 * (1. - .45 * laid);
  float gold = max(smoothstep(uGlassP.y, uGlassP.y + .015, vInfo.x), 1. - smoothstep(.004, .012, abs(vInfo.x - uGlassP.w)));
  vec3 gcol = uGold * (uSunCol * nl * beam * .4 + ambient(N) * .6) + uGold * env * .8 + uSunCol * sp * 1.6 + uGold * uSunCol * beam * (.28 + .9 * pow(max(dot(R, L), 0.), 4.));
  col = mix(col, gcol, gold); a = mix(a, 1., gold);
  float gem = vInfo.z * uGlassP.z;                                                                       // pomegranate seeds among the splinters
  col = mix(col, uGem * (uSunCol * beam * (.3 + .6 * back) + ambient(N) * 1.2 + vec3(.2)) + uSunCol * sp * 1.2, gem); a = mix(a, 1., gem);
  // an opaque shell (eggs): a sunlit side that keeps its cream, a terminator, and a shadow side in the blue of the shade of the
  // room, warmed from below by the floor and the copper
  vec3 shell = uTint * (uSunCol * (nl * .86 + .05) * beam + ambient(N) * mix(1.32, .98, beam) + uBounceCol * 1.1 * max(-N.y, 0.) * beam) * mix(1., .74, inside) + uSunCol * sp * .45
    + uSkyCol * uFill.a * .16 * pow(max(dot(R, normalize(vec3(-.9, .3, -.12))), 0.), 9.) + env * (.05 + fres * .22);
  col = mix(col, shell, uGlassP.x); a = mix(clamp(a, 0., 1.), 1., uGlassP.x);
  float dcam = length(vView); if (dcam < 2.2) discard; a *= mix(smoothstep(2.2, 4.5, dcam), 1., uGlassP.x);
  gl_FragColor = vec4(clamp(col, 0., 24.), a);
  #include <fog_fragment>
}`;

// the liquid inside a vessel: rides with it and drains as the pour leaves (clipped above the level)
const PLUG_VERT = /* glsl */`
${G_VERT_COMMON}
${FLYER_PARS}
attribute float aLv;
varying float vClip; varying vec2 vTopR;
#include <fog_pars_vertex>
void main() {
  vec3 P, N; flyer(position, normal, P, N);
  vTopR = vec2(normal.y, length(position.xz));
  float fill = 1. - smoothstep(iSlot.w + .03, iSlot.w + iSl.w, uT);
  vClip = aLv - fill * 1.001;
  ${G_VERT_END}
  #include <fog_vertex>
}`;
const TEA_SHADE = /* glsl */`
uniform vec3 uTea; uniform vec3 uTeaP;       // x: milkiness (0 clear, 1 opaque white), y: ribbon width, z: glow of its own
// A clear liquid with the light coming through it: a dark stained edge, a glowing core thrown to the side away from the
// sun (as a lens throws it), one hard highlight line from the sun and a long cool one from the windows. core: 0 at the
// silhouette, 1 through the middle. Milk is a glossy white solid with the same two highlights.
vec3 teaShadeK(vec3 N, vec3 V, vec3 p, float core, float specPow) {      // specPow: how tight the sun's highlight is (a ribbon 90, the tea in a glass 220)
  float beam = beamMask(p); vec3 L = normalize(uSunDir), H = normalize(L + V + vec3(1e-5));
  float nv = max(dot(N, V), 0.);
  vec3 Lp = L - V * dot(L, V); Lp = Lp / max(length(Lp), 1e-3);
  float lens = (1. - smoothstep(-.5, .3, dot(N, Lp))) * smoothstep(.08, .5, core), front = max(dot(V, L), 0.);    // front: the sun behind the viewer lights the body of the tea
  // a red with no green in it (sherbet) keeps its depth: the lift toward white that suits amber would turn it candy pink
  float warmK = smoothstep(.03, .2, uTea.g / max(uTea.r, 1e-3));
  vec3 edge = uTea * mix(.34, .5, warmK), glowC = mix(uTea * vec3(1.9, 1.1, 1.3), mix(uTea, sqrt(max(uTea, vec3(0.))), .5) * vec3(1., .82, .6) + .05, warmK);
  vec3 soft = ambient(-V) * .9 + uFill.rgb * 1.6 + vec3(uTeaP.z * .55);
  vec3 clear = edge * (soft + uSunCol * beam * .28) * (.55 + .45 * core) + glowC * (uSunCol * beam * (.42 * lens + .13 * core) + soft * (.3 + .7 * lens) * core * 1.1)
    + uTea * uSunCol * beam * (.55 * front * core);
  vec3 milk = uTea * (ambient(N) * 1.3 + uSunCol * beam * (.25 + .75 * max(dot(N, L), 0.)) + vec3(uTeaP.z * .5)) * mix(vec3(.42, .5, .66), vec3(1.), smoothstep(0., .75, core));   // a white rope needs its shaded edge to read on white marble
  vec3 Hw = normalize(vec3(-.85, .4, -.15) + V);
  vec3 col = mix(clear, milk, uTeaP.x) + uSunCol * beam * pow(max(dot(N, H), 0.), specPow) * (1.6 + uTeaP.x)
    + uSkyCol * uFill.a * (.32 + .3 * uTeaP.x) * pow(max(dot(N, Hw), 0.), 48.)
    + envLight(reflect(-V, N), beam) * (1. - nv) * (1. - nv) * .16;
  return max(col, 0.);
}
vec3 teaShade(vec3 N, vec3 V, vec3 p, float core) { return teaShadeK(N, V, p, core, 90.); }`;
HERO_GLSL.tea = TEA_SHADE;                             // the world shades the tea in its laid glasses with the same chunk
const PLUG_FRAG = /* glsl */`
${G_LIGHT}
${TEA_SHADE}
uniform float uPlugR;
varying vec3 vLocal; varying vec3 vN; varying vec3 vView; varying float vClip; varying vec2 vTopR;
#include <fog_pars_fragment>
void main() {
  if (vClip > 0.) discard;
  vec3 V = normalize(vView + vec3(1e-5)), N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  float nv = max(dot(N, V), 0.), top = step(.5, vTopR.x), r = vTopR.y / max(uPlugR, 1e-3);
  // the surface of the tea, seen from above: deep in the middle, a bright meniscus under the glass
  float core = mix(nv, .35 + .65 * smoothstep(.55, .98, r), top);
  vec3 col = teaShadeK(N, V, vLocal, core, 220.);
  col = mix(col, col * .8 + uTea * uSkyCol * 1.2, top * (1. - smoothstep(.3, .9, r)) * (1. - uTeaP.x));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// the pour: a strand that slides along the arc from the vessel's rim to its pool on the floor. Forward in time its head
// leaves the rim when the pour starts and reaches the floor a moment later; the strand then spans the whole arc while
// the vessel flies on; when the vessel is empty the tail follows the head down. Backwards: it stands up out of the pool,
// its top finds the rim, and the last of it climbs in just before the vessel docks on the tray.
const RIBBON_VERT = /* glsl */`
${G_VERT_COMMON}
uniform vec3 uTeaP; uniform vec4 uTeaQ;      // uTeaQ: height of the rim above the vessel's centre, -, -, -
attribute vec4 aE; attribute vec4 aEv; attribute vec4 aEn; attribute vec4 aEvn; attribute vec4 aPool; attribute vec3 aSide;
varying vec3 vS; varying vec3 vF; varying vec2 vX;
#include <fog_pars_vertex>
vec3 arc(vec3 R, float s) { return vec3(mix(R.x, aPool.x, s), R.y - (R.y - .06) * s * s, mix(R.z, aPool.y, s)); }
void main() {
  float dt = clamp(uT, aE.w, aEv.w) - aE.w;
  vec3 R = aE.xyz + aEv.xyz * dt + vec3(0., -4.9, 0.) * dt * dt + rod(aEn.xyz, dt, qrot(aEvn, vec3(0., uTeaQ.x, 0.)));
  float head = clamp((uT - aPool.z) / aEn.w, 0., 1.), tail = clamp((uT - aPool.w) / aEn.w, 0., 1.);
  float s0 = mix(tail, head, aSide.y);
  vec3 P0 = arc(R, s0), P1 = arc(R, s0 + .02);
  vec4 wp = modelMatrix * vec4(P0, 1.);
  vec3 t = mat3(modelMatrix) * (P1 - P0), toCam = cameraPosition - wp.xyz;
  vec3 s = cross(t, toCam); s = s / max(length(s), 1e-4);
  vec3 f = cross(s, t); f = f / max(length(f), 1e-4);
  float len = head - tail, f1 = aSide.y;
  float prof = mix(1.2, .5, f1) + .4 * exp(-36. * (1. - f1) * (1. - f1)) * step(head, .999);     // thick at the rim, a thread toward the floor, a bead at its head
  prof *= 1. + .22 * sin(f1 * 19. + aSide.z * 40. + uT * 5.);
  float w = .16 * uTeaP.y * prof * smoothstep(0., .03, len) * mix(1., smoothstep(0., .08, f1), step(.001, tail));   // the upper end tapers once it has left the rim
  w = max(w, length(toCam) * .0011 * step(.02, len));                                               // never under a pixel and a half
  wp.xyz += s * aSide.x * w;
  vLocal = P0; vView = toCam; vS = s; vF = f; vX = vec2(aSide.x, f1); vN = f;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RIBBON_FRAG = /* glsl */`
${G_LIGHT}
${TEA_SHADE}
varying vec3 vLocal; varying vec3 vN; varying vec3 vView; varying vec3 vS; varying vec3 vF; varying vec2 vX;
#include <fog_pars_fragment>
void main() {
  float x = clamp(vX.x, -1., 1.), core = sqrt(max(1. - x * x, 0.));
  vec3 N = normalize(vS * x + vF * core + vec3(0., 1e-5, 0.));
  float near = smoothstep(2.5, 7., length(vView));
  gl_FragColor = vec4(teaShade(N, normalize(vView + vec3(1e-5)), vLocal, core), mix(mix(.92, .74, core), 1., uTeaP.x) * near);
  #include <fog_fragment>
}`;

// amber pools on the marble: each spreads (in reverse: shrinks to nothing) after its pour landed
const PUDDLE_VERT = /* glsl */`
uniform float uT;
attribute vec4 iPud; attribute float iSeed;
varying vec3 vLocal; varying vec3 vView; varying vec2 vUv2; varying vec2 vGrow;
#include <fog_pars_vertex>
void main() {
  float dt = max(uT - iPud.z, 0.);
  vGrow = vec2(.62 * (1. - exp(-2.4 * dt)) + .38 * (1. - exp(-.28 * dt)), iSeed);
  vUv2 = position.xz * 1.25;
  vec3 P = vec3(iPud.x + vUv2.x * iPud.w, .035, iPud.y + vUv2.y * iPud.w);
  vLocal = P; vec4 wp = modelMatrix * vec4(P, 1.); vView = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUDDLE_FRAG = /* glsl */`
${G_LIGHT}
uniform vec3 uTea; uniform vec3 uTeaP;
varying vec3 vLocal; varying vec3 vView; varying vec2 vUv2; varying vec2 vGrow;
#include <fog_pars_fragment>
void main() {
  float r = length(vUv2), ang = atan(vUv2.y, vUv2.x + (abs(vUv2.x) < 1e-4 ? 2e-4 : 0.)), sd = vGrow.y * 6.283;
  float edge = vGrow.x * (.74 + .15 * sin(ang * 3. + sd * 3.) + .08 * sin(ang * 7. - sd * 5.) + .045 * sin(ang * 13. + sd * 9.));
  float a = 1. - smoothstep(edge - .05, edge, r);
  vec2 cellp = vUv2 * 5. + sd; vec2 cf = fract(cellp) - .5; float hs = hash21(floor(cellp));        // flung drops round the pool
  a = max(a, step(.72, hs) * (1. - smoothstep(.03, .07 + .1 * hs, length(cf))) * step(r, edge + .28) * step(.02, vGrow.x));
  if (a < .02) discard;
  float depth = clamp((edge - r) / max(edge, 1e-3), 0., 1.), beam = beamMask(vLocal);
  vec3 V = normalize(vView + vec3(1e-5)), L = normalize(uSunDir), up = vec3(0., 1., 0.);
  vec3 body = mix(sqrt(uTea) * 1.05, uTea * .8, smoothstep(0., .5, depth));
  body = mix(body, uTea, uTeaP.x);
  vec3 col = body * (ambient(up) * 1.3 + uSunCol * beam * mix(.36, .3, uTeaP.x) + vec3(uTeaP.z * .6));
  float fres = .04 + .96 * pow(1. - max(V.y, 0.), 4.);
  col += envLight(reflect(-V, up), beam) * fres * .6;
  col += uSkyCol * .45 * (1. - smoothstep(.0, .1, abs(depth - .06)));                                        // meniscus
  gl_FragColor = vec4(max(col, 0.), a * mix(.86, .97, uTeaP.x));
  #include <fog_fragment>
}`;

// wet trails behind sliding shards, and the tray's contact shadow: soft-edged flat patches
const TRAIL_VERT = /* glsl */`
uniform float uT;
attribute vec4 iTr; attribute vec3 iTr2;
varying vec3 vLocal; varying vec3 vSoft;
#include <fog_pars_vertex>
void main() {
  float ds = max(uT - iTr2.x, 0.), f = 1. - exp(-${SLIDE_K.toFixed(2)} * ds);
  vec2 sl = iTr.zw; float len = length(sl); vec2 dir = sl / max(len, 1e-4), perp = vec2(-dir.y, dir.x);
  vec2 xz = iTr.xy + dir * (len * f * position.x + .25 * (position.x - .5) * 2. * step(.001, f)) + perp * position.z * iTr2.y;
  vec3 P = vec3(xz.x, .02, xz.y);
  vSoft = vec3(position.x, position.z * 2., smoothstep(0., .4, ds) * (.55 + .45 * exp(-.25 * ds)));
  vLocal = P; vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BLOB_VERT = /* glsl */`
uniform mat4 uObj; uniform float uFade;
varying vec3 vLocal; varying vec3 vSoft;
#include <fog_pars_vertex>
void main() {
  vec3 P = (uObj * vec4(position, 1.)).xyz;
  vSoft = vec3(.5, position.z * 2., uFade * (1. - 4. * (position.x - .5) * (position.x - .5)));
  vLocal = P; vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SOFT_FRAG = /* glsl */`
${G_LIGHT}
uniform vec4 uSoftCol; uniform float uSoftBeam;
varying vec3 vLocal; varying vec3 vSoft;
#include <fog_pars_fragment>
void main() {
  float across = clamp(1. - vSoft.y * vSoft.y, 0., 1.);
  float a = uSoftCol.a * across * across * vSoft.z * smoothstep(0., .12, vSoft.x) * (1. - smoothstep(.9, 1., vSoft.x));
  float beam = beamMask(vLocal);
  a *= mix(1., .25 + .75 * beam, uSoftBeam);
  gl_FragColor = vec4(uSoftCol.rgb * (ambient(vec3(0., 1., 0.)) + uSunCol * beam * .3), a);
  #include <fog_fragment>
}`;

// short blue shadows of the shards on the marble, thrown away from the sun
const SHADOW_VERT = /* glsl */`
uniform float uT; uniform vec3 uSunDir;
attribute vec4 iA; attribute vec4 iBv; attribute vec3 iC;
varying vec3 vLocal; varying vec3 vSoft;
#include <fog_pars_vertex>
void main() {
  float d2 = clamp(uT - iA.w, 0., iBv.w - iA.w), ds = max(uT - iBv.w, 0.);
  vec3 C = iA.xyz + iBv.xyz * d2 + vec3(0., -4.9, 0.) * d2 * d2;
  C.xz += iC.xy * (1. - exp(-${SLIDE_K.toFixed(2)} * ds));
  float h = max(C.y, 0.), sz = iC.z * (1. + h * .3);
  vec2 off = -uSunDir.xz / max(uSunDir.y, .05) * (h + .1);
  vec3 P = vec3(C.x + off.x + (position.x - .7) * sz * 2.2, .025, C.z + off.y + position.z * sz);
  float along = 1. - 4. * (position.x - .5) * (position.x - .5);
  vSoft = vec3(.5, position.z * 2., step(iA.w, uT) * (1. - smoothstep(0., 3., h)) * along);
  vLocal = P; vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// steam sinking into the full glasses while they stand on the tray
const STEAM_VERT = /* glsl */`
uniform float uT; uniform mat4 uTray; uniform float uTime;
attribute vec4 iSt; attribute vec2 iSt2;
varying vec3 vLocal; varying vec3 vSoft;
#include <fog_pars_vertex>
void main() {
  float ph = fract(iSt2.x - uTime * iSt2.y);
  vec3 c = iSt.xyz + vec3(sin(iSt2.x * 40. + ph * 5.) * .35 * ph, .15 + 2.6 * ph * ph, cos(iSt2.x * 27. + ph * 4.) * .35 * ph);
  vec3 P = (uTray * vec4(c, 1.)).xyz;
  float size = (.3 + 1.1 * ph) * step(uT, iSt.w);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.); mvPosition.xy += position.xy * size;
  vSoft = vec3(position.xy * 2., sin(3.1416 * ph) * (1. - smoothstep(iSt.w - .25, iSt.w, uT)));
  vLocal = P; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STEAM_FRAG = /* glsl */`
${G_LIGHT}
varying vec3 vLocal; varying vec3 vSoft;
#include <fog_pars_fragment>
void main() {
  float r2 = dot(vSoft.xy, vSoft.xy), a = clamp(1. - r2, 0., 1.); a = a * a * vSoft.z * .2;
  float beam = beamMask(vLocal);
  gl_FragColor = vec4(vec3(.82, .85, .9) * (ambient(vec3(0., 1., 0.)) * 1.6 + uSunCol * beam * .45), a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- geometry helpers
function makeMesher() {
  const P = [], N = [], C = [], S = [];
  const put = (x, y, z, nx, ny, nz, c, s) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(c[0], c[1], c[2]); S.push(s[0], s[1], s[2]); };
  const api = {
    // surface of revolution about +Y. prof: [[r, y], ...]; sign +1 when the profile runs top-centre -> rim -> underside, -1 when it climbs an outside wall
    lathe(prof, segs, o = {}) {
      const n = prof.length, sign = o.sign ?? 1, m = o.m || null, col = o.color, surf = o.surf || [0, 0.5, 0], rmod = o.rmod || null;
      const v3 = new THREE.Vector3(), nrm = new THREE.Vector3(), rows = [];
      for (let k = 0; k < n; k++) {
        const a = prof[Math.max(k - 1, 0)], b = prof[Math.min(k + 1, n - 1)]; let dr = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dr, dy) || 1; dr /= l; dy /= l;
        const row = [];
        for (let j = 0; j <= segs; j++) {
          const th = (j % segs) / segs * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), r = prof[k][0] * (rmod ? rmod(th, k, prof[k][0]) : 1);
          v3.set(r * c, prof[k][1], r * s); nrm.set(-dy * c * sign, dr * sign, -dy * s * sign);
          if (m) { v3.applyMatrix4(m); nrm.transformDirection(m); }
          row.push([v3.x, v3.y, v3.z, nrm.x, nrm.y, nrm.z, typeof col === 'function' ? col(k, th, prof[k][0]) : col]);
        }
        rows.push(row);
      }
      const tri = (a, b, c) => { for (const q of [a, b, c]) put(q[0], q[1], q[2], q[3], q[4], q[5], q[6], surf); };
      for (let k = 0; k < n - 1; k++) for (let j = 0; j < segs; j++) {
        const a = rows[k][j], b = rows[k][j + 1], c = rows[k + 1][j + 1], d = rows[k + 1][j];
        if (prof[k][0] > 1e-6) tri(a, b, c); if (prof[k + 1][0] > 1e-6) tri(a, c, d);
      }
      return api;
    },
    // a tube along points with radius rad(t); squash flattens it along Y
    tube(pts, rad, sides, col, surf, squash = 1) {
      const n = pts.length, rings = [], t = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3(), ref = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        t.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
        ref.set(0, 1, 0); if (Math.abs(t.y) > 0.9) ref.set(1, 0, 0);
        u.crossVectors(ref, t).normalize(); w.crossVectors(t, u);
        const r = rad(i / (n - 1)), ring = [];
        for (let j = 0; j <= sides; j++) {
          const a = (j % sides) / sides * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a) * squash;
          const nx = u.x * ca + w.x * sa, ny = u.y * ca + w.y * sa, nz = u.z * ca + w.z * sa, nl = Math.hypot(nx, ny, nz) || 1;
          ring.push([pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r, nx / nl, ny / nl, nz / nl]);
        }
        rings.push(ring);
      }
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
        const a = rings[i][j], b = rings[i][j + 1], c = rings[i + 1][j + 1], d = rings[i + 1][j];
        for (const q of [a, b, c, a, c, d]) put(q[0], q[1], q[2], q[3], q[4], q[5], col, surf);
      }
      return api;
    },
    // a block with chamfered edges, flat shaded; col may be a function of (x, y, z)
    slab(cx, cy, cz, sx, sy, sz, bev, col, surf) {
      const hx = sx / 2, hy = sy / 2, hz = sz / 2, b = bev;
      const lv = [[hx - b, hz - b, -hy], [hx, hz, -hy + b], [hx, hz, hy - b], [hx - b, hz - b, hy]];   // rings bottom -> top
      const ring = (l) => [[-l[0], l[2], -l[1]], [l[0], l[2], -l[1]], [l[0], l[2], l[1]], [-l[0], l[2], l[1]]];
      const quad = (a, b2, c, d) => {
        const e1 = [b2[0] - a[0], b2[1] - a[1], b2[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0]; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        for (const q of [a, b2, c, a, c, d]) put(cx + q[0], cy + q[1], cz + q[2], nx, ny, nz, typeof col === 'function' ? col(cx + q[0], cy + q[1], cz + q[2]) : col, surf);
      };
      const rs = lv.map(ring);
      for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) quad(rs[k][j], rs[k + 1][j], rs[k + 1][(j + 1) % 4], rs[k][(j + 1) % 4]);
      quad(rs[3][0], rs[3][3], rs[3][2], rs[3][1]); quad(rs[0][0], rs[0][1], rs[0][2], rs[0][3]);
      return api;
    },
    put,
    get triangles() { return P.length / 9; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aSurf', new THREE.Float32BufferAttribute(S, 3));
      return g;
    },
  };
  return api;
}
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

async function buildTrayGeometry(ctx, rng, pal) {
  const M = makeMesher(), copper = mix3(mul3(lin(pal[2]), 1.4), lin('#D99A6C'), 0.35), gold = mix3(lin(pal[3]), lin(pal[0]), 0.35), scal = rng.pick([14, 16, 18]);
  const prof = [[0, 0.1], [0.5, 0.1], [0.62, 0.04], [1.9, 0.02], [2.0, 0.06], [2.1, 0.02], [3.6, 0.02], [5.3, 0.02], [5.45, 0.06], [5.62, 0.34], [5.85, 0.47], [6.0, 0.45],
    [6.08, 0.36], [6.0, 0.05], [5.8, -0.1], [5.2, -0.14], [4.6, -0.14], [4.5, -0.21], [4.3, -0.21], [4.2, -0.14], [2.0, -0.14], [0, -0.14]];
  M.lathe(prof, 128, {
    sign: 1, surf: [1, 0.55, 1],
    rmod: (th, k, r) => (r > 5.4 ? 1 + 0.03 * Math.pow(Math.abs(Math.sin(th * scal * 0.5)), 0.6) - 0.012 : 1),
    color: (k, th, r) => (k <= 1 ? mix3(copper, gold, 0.6) : k >= 9 && k <= 12 ? mix3(copper, lin(pal[0]), 0.22) : k >= 14 ? mul3(copper, 0.55) : mul3(copper, 0.92 + 0.12 * Math.sin(th * 3 + r))),
  });
  await ctx.yield();
  // ring handle on three beaded arms
  const top = new THREE.Vector3(0, 7.1, 0);
  for (let a = 0; a < 3; a++) {
    const th = a / 3 * Math.PI * 2 + 0.5, base = new THREE.Vector3(Math.cos(th) * 5.55, 0.4, Math.sin(th) * 5.55), pts = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30, e = Math.pow(t, 0.62); pts.push(new THREE.Vector3(base.x * (1 - e) * (1 + 0.1 * Math.sin(t * Math.PI)), lerp(base.y, top.y, Math.pow(t, 1.25)), base.z * (1 - e) * (1 + 0.1 * Math.sin(t * Math.PI)))); }
    M.tube(pts, (t) => 0.06 + 0.055 * Math.pow(Math.abs(Math.sin(t * 34)), 0.7), 5, gold, [1, 0.75, 0]);
    M.lathe([[0, 0.3], [0.2, 0.22], [0.26, 0.08], [0.2, -0.04], [0, -0.06]], 8, { sign: 1, color: gold, surf: [1, 0.75, 0], m: new THREE.Matrix4().makeTranslation(base.x, base.y, base.z) });
  }
  M.lathe([[0, 0.45], [0.3, 0.3], [0.38, 0], [0.24, -0.3], [0.1, -0.5], [0, -0.52]], 10, { sign: 1, color: gold, surf: [1, 0.75, 0], m: new THREE.Matrix4().makeTranslation(0, 7.1, 0) });
  const ring = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI * 2; ring.push(new THREE.Vector3(Math.cos(a) * 0.62, 8.1 + Math.sin(a) * 0.62, 0)); }
  M.tube(ring, () => 0.1, 6, gold, [1, 0.8, 0]);
  return M;
}

function buildSaucerGeometry(pal, load, bandHex) {
  const M = makeMesher(), white = mul3(lin(pal[0]), 0.9), red = bandHex ? lin(bandHex) : load === 'milk' ? lin(pal[1]) : lin('#A3342A'), gold = mix3(lin(pal[3]), lin(pal[0]), 0.3);
  const prof = [[0, 0.05], [0.34, 0.05], [0.38, 0.075], [0.4, 0.08], [0.58, 0.135], [0.6, 0.14], [0.69, 0.18], [0.72, 0.19], [0.73, 0.165], [0.5, 0.04], [0.3, 0], [0, 0]];
  M.lathe(prof, 16, { sign: 1, surf: [0, 0.85, 0], m: new THREE.Matrix4().makeScale(0.94, 0.94, 0.94), color: (k, th) => (k === 3 || k === 4 ? (Math.sin(th * 8) > 0.2 || k === 3 ? red : mix3(red, white, 0.75)) : k === 7 || k === 8 ? gold : white) });
  return M;
}
function buildSpoonGeometry(pal) {
  const M = makeMesher(), gold = mix3(lin(pal[3]), lin(pal[0]), 0.45), pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector3(0.3 + 0.62 * t, 0.2 + 0.1 * t - 0.05 * Math.sin(Math.min(t / 0.3, 1) * Math.PI), 0)); }
  M.tube(pts, (t) => (t < 0.3 ? 0.012 + 0.11 * Math.sin(Math.PI * Math.min(t / 0.3, 1) * 0.95) : 0.028 + 0.03 * smoothstep(0.6, 1, t)), 6, gold, [1, 0.8, 0], 0.35);
  return M;
}

// ---------------------------------------------------------------- the load: forty vessels and what happens to each
const VESSELS = {
  tea: { h: 1.5, vs: [0, 0.07, 0.2, 0.36, 0.5, 0.62, 0.78, 0.92, 1], rs: [0.3, 0.365, 0.39, 0.34, 0.27, 0.275, 0.35, 0.425, 0.47], closed: false, rim: 0.93, waist: 0.56, fillTop: 0.86 },
  milk: { h: 1.3, vs: [0, 0.04, 0.14, 0.3, 0.48, 0.66, 0.82, 0.93, 1], rs: [0, 0.19, 0.345, 0.45, 0.48, 0.43, 0.32, 0.19, 0], closed: true, rim: 2, waist: -1, fillTop: 0.6 },
  sherbet: { h: 1.9, vs: [0, 0.04, 0.2, 0.42, 0.56, 0.68, 0.82, 0.94, 1], rs: [0.3, 0.36, 0.37, 0.36, 0.31, 0.16, 0.125, 0.135, 0.19], closed: false, rim: 0.955, waist: 0.6, fillTop: 0.6 },
};
function solveFall(y0, vy, yFloor) { const d = Math.max(vy * vy + 2 * GRAV * (y0 - yFloor), 0); return Math.max((vy + Math.sqrt(d)) / GRAV, 0.02); }   // time until a ballistic point reaches yFloor

// The load lets go in order. The tray falls spinning; each vessel leaves when the whirl of its own slot points down the
// aisle, off the surface along the tray's normal, so all forty are flung the same way (onto open floor, never through the
// island) and, seen backwards, stream in from one side and dock on the turning rings from above. Its tea leaves it over
// more than a second and falls behind it to one pool, so each flying glass trails an arc that reaches the floor.
// clear: [{ T, p }] camera points by clock (local space); a vessel's flight is redrawn until it keeps away from them.
function planLoad(rng, tray, V, clear) {
  const rings = [[1.6, 7], [3.2, 13], [4.72, 20]], glasses = [], pos = new THREE.Vector3(), q = new THREE.Quaternion(), a = new THREE.Vector3(), b = new THREE.Vector3(), q2 = new THREE.Quaternion();
  const zero = new THREE.Vector3(), DX = 0.1, DZ = 0.995;
  const pointAt = (T, local, out) => { tray.pose(T, pos, q); return out.copy(local).applyQuaternion(q).add(pos); };
  const launch = (T, local, rel) => {                 // world position, velocity and tray orientation of a tray point at T
    const p0 = pointAt(T, local, new THREE.Vector3()), q0 = q.clone();
    pointAt(T + 0.02, local, a); pointAt(T - 0.02, local, b);
    const v0 = a.clone().sub(b).multiplyScalar(25).add(rel);    // its own vector: every vessel keeps the velocity it left with
    return { p0, v0, q0 };
  };
  const randDir = () => { const z = rng.range(-1, 1), th = rng.range(0, Math.PI * 2), r = Math.sqrt(1 - z * z); return new THREE.Vector3(r * Math.cos(th), z, r * Math.sin(th)); };
  const kick = (local, T, out, up, fwd) => {
    tray.pose(T, pos, q2); const o = new THREE.Vector3(local.x, 0, local.z).normalize().applyQuaternion(q2).multiplyScalar(out);
    return o.addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(q2), up).add(new THREE.Vector3(rng.range(-0.8, 0.8), 0, fwd));
  };
  const letGo = (local) => {                          // the clock at which the slot's whirl best points down the aisle
    let bt = 1, bs = -9;
    for (let T = 1.0; T <= 2.9; T += 0.04) {
      pointAt(T + 0.02, local, a); pointAt(T - 0.02, local, b); a.sub(b); pointAt(T + 0.02, zero, b); a.sub(b); pointAt(T - 0.02, zero, b); a.add(b);
      const s = (a.x * DX + a.z * DZ) / (Math.hypot(a.x, a.z) || 1) - 0.1 * (T - 1);
      if (s > bs) { bs = s; bt = T; }
    }
    return bt;
  };
  const nearest = (g) => {                            // how close the whole vessel comes to the camera
    let best = 1e9; if (!clear) return best;
    for (const c of clear) { if (c.T < g.tL || c.T > g.tB) continue; const dt = c.T - g.tL; best = Math.min(best, Math.hypot(g.p0.x + g.v0.x * dt - c.p.x, g.p0.y + g.v0.y * dt - 0.5 * GRAV * dt * dt - c.p.y, g.p0.z + g.v0.z * dt - c.p.z)); }
    return best;
  };
  const nAir = V.closed ? rng.int(33, 37) : rng.int(22, 27);
  const order = rng.shuffle([...Array(40).keys()]), airSet = new Set(order.slice(0, nAir));
  let gi = 0;
  for (let ri = 0; ri < rings.length; ri++) {
    const [rad, cnt] = rings[ri], ph = rng.range(0, 6.28);
    for (let k = 0; k < cnt; k++, gi++) {
      const th = ph + k / cnt * Math.PI * 2, sx = Math.cos(th) * rad, sz = Math.sin(th) * rad;
      const slotS = new THREE.Vector3(sx, 0.02, sz), slotG = new THREE.Vector3(sx, 0.07 + V.h * 0.5, sz), t0 = letGo(slotG);
      let g = null, far = -1;
      for (let tries = 0; tries < 10 && far < 7.5; tries++) {
        const tL = clamp(t0 + rng.range(-0.14, 0.14), 0.98, 2.95);
        const c = { i: gi, slotS, slotG, tL, yaw: th / (Math.PI * 2), ...launch(tL, slotG, kick(slotG, tL, rng.range(0.2, 1.4), rng.range(0.9, 2.7) + 0.5 * tries * (tries & 1), rng.range(0, 3))) };
        c.v0.x = Math.min(c.v0.x, -2.5);                 // always toward the aisle: nothing comes down on the island
        c.w = randDir().multiplyScalar(rng.range(1.2, 3.0));
        const tf = solveFall(c.p0.y, c.v0.y, 0.8);
        c.v0.x = Math.min(c.v0.x, -(c.p0.x - 2.5) / (tf * 0.8));
        c.air = airSet.has(gi); const off = c.v0.x < -0.5 ? (c.p0.x - 2.5) / -c.v0.x : 9;          // an air burst waits until the vessel is clear of the island
        c.tB = c.tL + (c.air ? (V.closed ? Math.min(Math.max(tf * rng.range(0.1, 0.3), 0.3), tf) : Math.min(Math.max(tf * rng.range(0.3, 0.72), 0.7, off), tf)) : tf);   // an egg breaks open almost at once: its white and yolk are in the air through the whole rise
        const d = nearest(c); if (d > far) { far = d; g = c; }
      }
      g.pour = Math.min(rng.range(0.7, 1.05), g.tB - g.tL - 0.04);
      // state at the burst
      const dB = g.tB - g.tL;
      g.G = g.p0.clone().addScaledVector(g.v0, dB); g.G.y -= 0.5 * GRAV * dB * dB;
      g.vB = g.v0.clone(); g.vB.y -= GRAV * dB;
      g.qB = new THREE.Quaternion().setFromAxisAngle(g.w.clone().normalize(), g.w.length() * dB).multiply(g.q0);
      // saucer and spoon leave just after, whole, and fly a little lower
      const tL = g.tL;
      const mk = (local, tLs, restUp, restDown) => {
        const f = { slot: local, tL: tLs, ...launch(tLs, local, kick(local, tLs, rng.range(0.2, 1.6), rng.range(0.2, 1.3), rng.range(0, 3))) };
        f.w = randDir().multiplyScalar(rng.range(2, 5));
        const tl = solveFall(f.p0.y, f.v0.y, 0.45); f.tLand = tLs + tl;
        f.v0.x = Math.min(f.v0.x, -2.5, -(f.p0.x - 2.5) / (tl * 0.8));
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(f.w.clone().normalize(), f.w.length() * tl).multiply(f.q0));
        f.rest = up.y < 0 ? restDown : restUp; const sk = rng.range(0.1, 0.25);
        f.slide = [f.v0.x * sk, f.v0.z * sk]; f.seed = rng();
        return f;
      };
      g.saucer = mk(slotS, tL + rng.range(0.06, 0.22), 0.0, 0.19);
      g.spoon = mk(slotS, tL + rng.range(0.02, 0.16), -0.17, 0.3); g.spoon.seed = Math.round(g.spoon.seed * 3) + 1 - th / (Math.PI * 2) + rng.range(-0.06, 0.06);
      // the pour: from tS to tE the tea leaves the rim and falls along an arc to one pool (an egg spills from where it
      // breaks); the pool keeps the glass's drift toward the aisle but little of its speed along it, and is never on the island
      const tS = V.closed ? g.tB + 0.01 : g.tL + 0.05, tE = V.closed ? g.tB + 0.5 : g.tL + g.pour, tm = Math.min(tS + 0.35 * (tE - tS), g.tB) - g.tL;
      const ym = g.p0.y + g.v0.y * tm - 0.5 * GRAV * tm * tm, tau = V.closed ? Math.max(0.8 * Math.sqrt(2 * Math.max(ym, 0.5) / GRAV), 0.3) : rng.range(0.5, 0.8);
      const sideways = rng.range(-3, 3), along = V.closed ? rng.range(-3.5, 3.5) : 0;
      g.tS = tS; g.tE = tE; g.tau = tau;
      g.pool = [clamp(g.p0.x + g.v0.x * (tm + 0.5 * solveFall(ym, 0, 0.05)) + sideways, -25, 3.2), g.p0.z + g.v0.z * tm + along];
      g.puddle = { x: g.pool[0], z: g.pool[1], t: tS + tau, r: rng.range(2.0, 3.9), seed: rng() };
      glasses.push(g);
    }
  }
  return { glasses, randDir };
}

// One merged mesh: 40 vessels x 24 pieces. Every piece vertex carries the constants of its vessel and of its piece.
async function buildGlassGeometry(ctx, rng, plan, V) {
  const SEG = 20, ROWS = 11, NP = V.closed ? 6 : 24, prof = makePchip(V.vs, V.rs);     // a glass bursts into 24 shards; an egg opens into two cups of shell and four chips from the crack
  const trisPer = SEG * ROWS * 2 + (V.closed ? 0 : SEG), NV = plan.glasses.length * trisPer * 3;
  const A = { position: new Float32Array(NV * 3), normal: new Float32Array(NV * 3), aSlot: new Float32Array(NV * 4), aP0: new Float32Array(NV * 3), aV0: new Float32Array(NV * 4),
    aW: new Float32Array(NV * 4), aQ: new Float32Array(NV * 4), aPc: new Float32Array(NV * 3), aPv: new Float32Array(NV * 4), aPw: new Float32Array(NV * 4), aInfo: new Float32Array(NV * 2) };
  let o = 0;
  const vp = new THREE.Vector3(), tmp = new THREE.Vector3(), rad = new THREE.Vector3();
  for (const g of plan.glasses) {
    // jittered lathe grid: the cracks run along its edges
    const gp = [], gn = [], gv = [], gth = [];
    for (let k = 0; k <= ROWS; k++) for (let j = 0; j < SEG; j++) {
      const edge = k === 0 || k === ROWS, v = clamp((k + (edge ? 0 : rng.range(-0.32, 0.32))) / ROWS, 0, 1), th = (j + (edge ? 0 : rng.range(-0.32, 0.32))) / SEG * Math.PI * 2;
      const r = Math.max(prof(v), 0), dr = prof(Math.min(v + 0.01, 1)) - prof(Math.max(v - 0.01, 0)), dy = V.h * (Math.min(v + 0.01, 1) - Math.max(v - 0.01, 0)), l = Math.hypot(dr, dy) || 1;
      gp.push([r * Math.cos(th), (v - 0.5) * V.h, r * Math.sin(th)]); gn.push([dy / l * Math.cos(th), -dr / l, dy / l * Math.sin(th)]); gv.push(v); gth.push(th);
    }
    const tris = [];
    for (let k = 0; k < ROWS; k++) for (let j = 0; j < SEG; j++) {
      const a = k * SEG + j, b = k * SEG + (j + 1) % SEG, c = (k + 1) * SEG + (j + 1) % SEG, d = (k + 1) * SEG + j;
      if ((j + k) & 1) tris.push([a, b, c], [a, c, d]); else tris.push([a, b, d], [b, c, d]);
    }
    if (!V.closed) { gp.push([0, -0.5 * V.h + 0.03, 0]); gn.push([0, -1, 0]); gv.push(0); gth.push(0); const ci = gp.length - 1; for (let j = 0; j < SEG; j++) tris.push([j, (j + 1) % SEG, ci]); }
    // 24 crack cells in (angle, height); each triangle joins the nearest
    const seeds = []; if (!V.closed) for (let b = 0; b < 4; b++) for (let s = 0; s < 6; s++) seeds.push([(s + rng.range(0.1, 0.9) + b * 0.5) / 6 * Math.PI * 2, (b + rng.range(0.15, 0.85)) / 4]);
    // an egg: a toothed crack round the middle, and four chips out of it
    const ckP = rng.range(0, 6.28), ckV = rng.range(0.42, 0.58), crack = (th) => ckV + 0.05 * Math.sin(3 * th + ckP) + 0.035 * Math.sin(8 * th - 2 * ckP);
    const chips = []; if (V.closed) for (let c = 0; c < 4; c++) { const a = ckP + (c + rng.range(-0.25, 0.25)) * Math.PI / 2; chips.push([a, crack(a) + rng.range(-0.03, 0.03), rng.range(0.14, 0.2)]); }
    const pid = new Uint8Array(tris.length), cen = [], cnt = new Float32Array(NP);
    for (let p = 0; p < NP; p++) cen.push([0, 0, 0]);
    for (let t = 0; t < tris.length; t++) {
      const T3 = tris[t]; let cx = 0, cy = 0, cz = 0, cv = 0;
      for (const ix of T3) { cx += gp[ix][0]; cy += gp[ix][1]; cz += gp[ix][2]; cv += gv[ix]; }
      cx /= 3; cy /= 3; cz /= 3; cv /= 3; const cth = Math.atan2(cz, cx + 1e-9);
      let best = 1e9, bp = 0;
      if (V.closed) {
        bp = cv > crack(cth) ? 1 : 0;
        for (let c = 0; c < 4; c++) { let dth = Math.abs(cth - chips[c][0]) % (Math.PI * 2); if (dth > Math.PI) dth = Math.PI * 2 - dth; if (Math.hypot(dth * 0.45, (cv - chips[c][1]) * V.h) < chips[c][2]) bp = 2 + c; }
      } else for (let p = 0; p < NP; p++) { let dth = Math.abs(cth - seeds[p][0]) % (Math.PI * 2); if (dth > Math.PI) dth = Math.PI * 2 - dth; const dv = (cv - seeds[p][1]) * V.h, dd = dth * dth * 0.12 + dv * dv; if (dd < best) { best = dd; bp = p; } }
      pid[t] = bp; cen[bp][0] += cx; cen[bp][1] += cy; cen[bp][2] += cz; cnt[bp]++;
    }
    await ctx.yield();
    // the fate of each piece after the burst
    g.pieces = [];
    for (let p = 0; p < NP; p++) {
      const n = Math.max(cnt[p], 1), pc = [cen[p][0] / n, cen[p][1] / n, cen[p][2] / n];
      rad.set(pc[0], pc[1], pc[2]).applyQuaternion(g.qB); const cB = g.G.clone().add(rad);
      rad.normalize(); const pv = g.vB.clone();
      const cup = V.closed && p < 2, ck = cup ? 0.42 : 1;   // half a shell: it parts gently from its yolk, turns slowly and comes to rest on its side
      if (g.air) pv.addScaledVector(rad, rng.range(1.5, 6) * ck).addScaledVector(plan.randDir(), rng.range(0, 2.5) * ck);
      else { pv.x *= 0.6; pv.z *= 0.6; pv.y = rng.range(1, 5.5); rad.y = 0; pv.addScaledVector(rad, rng.range(3, 11) * ck).addScaledVector(plan.randDir(), 1.5); pv.y = Math.max(pv.y, 1); }
      let tLand = g.tB + solveFall(cB.y, pv.y, Math.min(cup ? 0.3 : 0.14, cB.y)); const sk = rng.range(0.22, 0.6), pw = plan.randDir().multiplyScalar(cup ? rng.range(0.8, 2.6) : rng.range(2, 7));
      if (cB.x + pv.x * (tLand - g.tB) * (1 + sk) > 4.6) pv.x = -Math.abs(pv.x) * 0.6 - Math.max(cB.x - 4, 0) / Math.max(tLand - g.tB, 0.2);   // nothing comes to rest inside the island
      const dl = tLand - g.tB;
      g.pieces.push({ cB: [cB.x, cB.y, cB.z], tB: g.tB, pc, pv, pw, tLand, slide: [pv.x * sk, pv.z * sk], seed: rng(), land: [cB.x + pv.x * dl, cB.z + pv.z * dl] });
    }
    for (let t = 0; t < tris.length; t++) {
      const pc = g.pieces[pid[t]];
      for (const ix of tris[t]) {
        A.position.set(gp[ix], o * 3); A.normal.set(gn[ix], o * 3);
        A.aSlot[o * 4] = g.slotG.x; A.aSlot[o * 4 + 1] = g.slotG.y; A.aSlot[o * 4 + 2] = g.slotG.z; A.aSlot[o * 4 + 3] = g.tL;
        A.aP0[o * 3] = g.p0.x; A.aP0[o * 3 + 1] = g.p0.y; A.aP0[o * 3 + 2] = g.p0.z;
        A.aV0[o * 4] = g.v0.x; A.aV0[o * 4 + 1] = g.v0.y; A.aV0[o * 4 + 2] = g.v0.z; A.aV0[o * 4 + 3] = g.tB;
        A.aW[o * 4] = g.w.x; A.aW[o * 4 + 1] = g.w.y; A.aW[o * 4 + 2] = g.w.z; A.aW[o * 4 + 3] = pc.tLand;
        A.aQ[o * 4] = g.q0.x; A.aQ[o * 4 + 1] = g.q0.y; A.aQ[o * 4 + 2] = g.q0.z; A.aQ[o * 4 + 3] = g.q0.w;
        A.aPc.set(pc.pc, o * 3);
        A.aPv[o * 4] = pc.pv.x; A.aPv[o * 4 + 1] = pc.pv.y; A.aPv[o * 4 + 2] = pc.pv.z; A.aPv[o * 4 + 3] = pc.slide[0];
        A.aPw[o * 4] = pc.pw.x; A.aPw[o * 4 + 1] = pc.pw.y; A.aPw[o * 4 + 2] = pc.pw.z; A.aPw[o * 4 + 3] = pc.slide[1];
        A.aInfo[o * 2] = gv[ix]; A.aInfo[o * 2 + 1] = pc.seed;
        o++;
      }
    }
    await ctx.yield();
  }
  const geo = new THREE.BufferGeometry();
  const sizes = { position: 3, normal: 3, aSlot: 4, aP0: 3, aV0: 4, aW: 4, aQ: 4, aPc: 3, aPv: 4, aPw: 4, aInfo: 2 };
  for (const k in A) geo.setAttribute(k, new THREE.BufferAttribute(A[k], sizes[k]));
  return { geo, triangles: NV / 3 };
}

// the liquid plug: the inside of the vessel up to the fill line (or a yolk), with its level baked per vertex
function buildPlugGeometry(V, load) {
  const prof = makePchip(V.vs, V.rs), P = [], N = [], L = [], SEG = 12, ROWS = 7, rows = [];
  const yolk = load === 'milk';
  for (let k = 0; k <= ROWS; k++) {
    const t = k / ROWS, row = [];
    for (let j = 0; j <= SEG; j++) {
      const th = (j % SEG) / SEG * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
      if (yolk) { const a = t * Math.PI, r = 0.4 * Math.sin(a), y = -0.06 - 0.36 * Math.cos(a); row.push([r * c, y, r * s, Math.sin(a) * c, -Math.cos(a), Math.sin(a) * s, 0.0005]); }
      else { const v = 0.03 + (V.fillTop - 0.03) * t, r = prof(v) * 0.9; row.push([r * c, (v - 0.5) * V.h, r * s, c, 0, s, Math.max(t, 0.0005)]); }
    }
    rows.push(row);
  }
  const put = (q) => { P.push(q[0], q[1], q[2]); N.push(q[3], q[4], q[5]); L.push(q[6]); };
  for (let k = 0; k < ROWS; k++) for (let j = 0; j < SEG; j++) for (const q of [rows[k][j], rows[k][j + 1], rows[k + 1][j + 1], rows[k][j], rows[k + 1][j + 1], rows[k + 1][j]]) put(q);
  if (!yolk) for (let j = 0; j < SEG; j++) {            // the surface of the tea, and the bottom
    const a = rows[ROWS][j], b = rows[ROWS][j + 1], b0 = rows[0][j], b1 = rows[0][j + 1];
    put([a[0], a[1], a[2], 0, 1, 0, 1]); put([b[0], b[1], b[2], 0, 1, 0, 1]); put([0, a[1], 0, 0, 1, 0, 1]);
    put([b0[0], b0[1], b0[2], 0, -1, 0, 0.0005]); put([b1[0], b1[1], b1[2], 0, -1, 0, 0.0005]); put([0, b0[1], 0, 0, -1, 0, 0.0005]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aLv', new THREE.Float32BufferAttribute(L, 1));
  return g;
}

// ---------------------------------------------------------------- assembly
const LOADS = {
  tea: { tea: '#C8791C', teaGain: 1.0, milk: 0, tint: '#DCE8EE', tintGain: 0.22, opaque: 0, gem: 0, gemCol: '#B5673A', ribbon: 0.85, glow: 0.42 },
  milk: { tea: '#F2EEE6', teaGain: 0.95, milk: 1, tint: '#F3EEE4', tintGain: 0.95, opaque: 1, gem: 0, gemCol: '#E8A21C', ribbon: 1.6, glow: 0.3 },
  sherbet: { tea: '#B4142A', teaGain: 1.0, milk: 0, tint: '#F0C8C0', tintGain: 0.3, opaque: 0, gem: 1, gemCol: '#A3122A', ribbon: 0.85, glow: 0.5 },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('unspilling-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const load = VESSELS[opts.load] ? opts.load : 'tea', V = VESSELS[load], LD = LOADS[load];
  const detail = ctx.quality?.detail ?? 1;
  const object = new THREE.Group(); object.name = 'the-unspilling-hero';
  const tray = makeTrayMotion(rng, opts.restZ ?? REST_Z);
  await ctx.yield();

  // shared uniforms (one object per uniform, referenced by every material)
  const win = opts.windows || { wallX: -30, y0: 8, y1: 38, z: [[5, 75], [-95, -25], [-195, -125], [-295, -225]] };
  const U = {
    uT: { value: T_END }, uTime: { value: 0 }, uTray: { value: new THREE.Matrix4() },
    uSunDir: { value: new THREE.Vector3(-0.89, 0.34, -0.30).normalize() },
    uSunCol: { value: new THREE.Color(1.5, 1.36, 1.14) },
    uSkyCol: { value: new THREE.Color(pal[1]).multiplyScalar(0.62) },
    uBounceCol: { value: new THREE.Color(pal[0]).lerp(new THREE.Color(pal[3]), 0.12).multiplyScalar(0.42) },
    uWin: { value: win.z.slice(0, 5).map((z) => new THREE.Vector4(Math.min(z[0], z[1]), Math.max(z[0], z[1]), win.y0, win.y1)) },
    uWall: { value: new THREE.Vector3(win.wallX, opts.beams ?? 1, 0) },
    uFill: { value: new THREE.Vector4(0.1, 0.12, 0.15, 9) },
  };
  while (U.uWin.value.length < 5) U.uWin.value.push(new THREE.Vector4(0, 0, 0, 0));
  const setLight = (l = {}) => {
    if (l.sunDir) { U.uSunDir.value.set(l.sunDir.x ?? l.sunDir[0], l.sunDir.y ?? l.sunDir[1], l.sunDir.z ?? l.sunDir[2]).normalize(); if (U.uSunDir.value.y < 0.05) { U.uSunDir.value.y = 0.05; U.uSunDir.value.normalize(); } }
    if (l.sunColor) U.uSunCol.value.set(l.sunColor); if (l.skyColor) U.uSkyCol.value.set(l.skyColor); if (l.bounceColor) U.uBounceCol.value.set(l.bounceColor);
    if (l.sunGain != null) U.uSunCol.value.multiplyScalar(l.sunGain);
    if (l.beams != null) U.uWall.value.y = l.beams;
    if (l.fillColor) { const c = new THREE.Color(l.fillColor); U.uFill.value.set(c.r, c.g, c.b, U.uFill.value.w); }
    if (l.windowGain != null) U.uFill.value.w = l.windowGain;
  };
  setLight(opts);
  const mat = (vs, fs, own = {}, extra = {}) => {
    const m = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), ...U, ...own }, vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, ...extra });
    return m;
  };
  const add = (geo, m, order = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = order; mesh.matrixAutoUpdate = false; object.add(mesh); return mesh; };
  const instanced = (base, count, attrs) => {
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
    for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k][0], attrs[k][1]));
    g.instanceCount = count; return g;
  };
  let triangles = 0;
  await ctx.yield();

  // the tray
  const trayM = await buildTrayGeometry(ctx, rng, pal); triangles += trayM.triangles;
  await ctx.yield();
  const solidTray = mat(OBJ_VERT, SOLID_FRAG, { uObj: U.uTray });
  add(trayM.build(), solidTray);
  await ctx.yield();

  // the plan of the accident, then the vessels
  // where the camera is at each clock of the rise (the world gives camAt(u, out) in local space), so nothing whole flies through the lens
  let clear = null;
  if (opts.camAt) {
    clear = []; for (let u = 0.2; u <= 0.4; u += 0.003) clear.push({ T: clockAt(u, false), p: opts.camAt(u, new THREE.Vector3()) });
    if (opts.rare) for (let u = 0.32; u <= 0.372; u += 0.003) clear.push({ T: clockAt(u, true), p: opts.camAt(u, new THREE.Vector3()) });   // and while time catches
  }
  const plan = planLoad(rng, tray, V, clear), GL = plan.glasses, NG = GL.length;
  await ctx.yield();
  const glass = await buildGlassGeometry(ctx, rng, plan, V); triangles += glass.triangles;
  const tintC = new THREE.Color(LD.tint), goldC = new THREE.Color(pal[3]).lerp(new THREE.Color('#F4D27A'), 0.45), gemC = new THREE.Color(LD.gemCol);
  const glassU = { uTint: { value: tintC.clone().multiplyScalar(LD.tintGain) }, uGold: { value: goldC }, uGem: { value: gemC }, uGlassP: { value: new THREE.Vector4(LD.opaque, V.rim, LD.gem, V.waist) } };
  const glassMat = mat(GLASS_VERT, GLASS_FRAG, glassU, LD.opaque ? {} : { transparent: true, depthWrite: false, forceSinglePass: true });
  add(glass.geo, glassMat, 6);
  await ctx.yield();

  // flyers: per-instance launch constants
  const flyAttrs = (list) => {
    const n = list.length, iSlot = new Float32Array(n * 4), iP0 = new Float32Array(n * 3), iV0 = new Float32Array(n * 4), iW = new Float32Array(n * 4), iQ = new Float32Array(n * 4), iSl = new Float32Array(n * 4);
    list.forEach((f, i) => {
      iSlot.set([f.slot.x, f.slot.y, f.slot.z, f.tL], i * 4); iP0.set([f.p0.x, f.p0.y, f.p0.z], i * 3); iV0.set([f.v0.x, f.v0.y, f.v0.z, f.tLand], i * 4);
      iW.set([f.w.x, f.w.y, f.w.z, f.rest], i * 4); iQ.set([f.q0.x, f.q0.y, f.q0.z, f.q0.w], i * 4); iSl.set([f.slide[0], f.slide[1], f.seed, f.extra ?? 0], i * 4);
    });
    return { iSlot: [iSlot, 4], iP0: [iP0, 3], iV0: [iV0, 4], iW: [iW, 4], iQ: [iQ, 4], iSl: [iSl, 4] };
  };
  const solidFly = mat(FLYER_VERT, SOLID_FRAG);
  const saucerM = buildSaucerGeometry(pal, load, opts.saucerColor), spoonM = buildSpoonGeometry(pal);
  add(instanced(saucerM.build(), NG, flyAttrs(GL.map((g) => g.saucer))), solidFly); triangles += saucerM.triangles * NG;
  add(instanced(spoonM.build(), NG, flyAttrs(GL.map((g) => g.spoon))), solidFly); triangles += spoonM.triangles * NG;
  const teaC = new THREE.Color(LD.tea).multiplyScalar(LD.teaGain), teaU = { uTea: { value: teaC }, uTeaP: { value: new THREE.Vector3(LD.milk, LD.ribbon, LD.glow) } };
  const plugGeo = buildPlugGeometry(V, load), yolk0 = load === 'milk';
  const plugR = { value: yolk0 ? 9 : makePchip(V.vs, V.rs)(V.fillTop) * 0.9 };
  const plugMat = mat(PLUG_VERT, PLUG_FRAG, yolk0 ? { uTea: { value: new THREE.Color(1.25, 0.62, 0.02) }, uTeaP: { value: new THREE.Vector3(0.8, 1, 0.9) }, uPlugR: plugR } : { ...teaU, uPlugR: plugR });
  const yolk = load === 'milk';                       // a yolk outlives its shell: it flies on, lands and sits on the marble
  add(instanced(plugGeo, NG, flyAttrs(GL.map((g) => ({ slot: g.slotG, tL: g.tL, p0: g.p0, v0: g.v0, tLand: yolk ? g.tL + solveFall(g.p0.y, g.v0.y, 0.4) : 1e6, w: g.w, rest: yolk ? 0.42 : 0, q0: g.q0,
    slide: yolk ? [g.v0.x * 0.1, g.v0.z * 0.1] : [0, 0], seed: 0, extra: yolk ? 1e5 : g.pour })))), plugMat, 2);
  triangles += plugGeo.attributes.position.count / 3 * NG;
  await ctx.yield();

  // splinters: slivers thrown from every burst (thinned by quality; they are plentiful, not the form)
  {
    const per = V.closed ? Math.max(14, Math.round(40 * detail)) : Math.max(30, Math.round(125 * detail)), n = NG * per;
    const iB = new Float32Array(n * 4), iV = new Float32Array(n * 4), iS = new Float32Array(n * 4), iL = new Float32Array(n * 3);
    const v = new THREE.Vector3(), d = new THREE.Vector3();
    let o = 0;
    for (const g of GL) {
      for (let k = 0; k < per; k++, o++) {
        d.copy(plan.randDir()); const B = v.copy(d).multiplyScalar(rng.range(0.05, 0.4)).add(g.G); B.y = Math.max(B.y, 0.12);
        const sp = rng.range(1.5, 5) + rng.range(0, 1) * rng.range(0, 4);
        let vx = g.vB.x * (g.air ? 1 : 0.5) + d.x * sp, vy = (g.air ? g.vB.y + d.y * sp : Math.abs(d.y) * sp * 0.8 + rng.range(0.5, 3)), vz = g.vB.z * (g.air ? 1 : 0.5) + d.z * sp;
        const tl = solveFall(B.y, vy, 0.06), sk = rng.range(0.2, 0.7), w = plan.randDir().multiplyScalar(rng.range(3, 12));
        if (B.x + vx * tl * (1 + sk) > 4.6) vx = -Math.abs(vx) * 0.6 - Math.max(B.x - 4, 0) / Math.max(tl, 0.2);
        iB.set([B.x, B.y, B.z, g.tB], o * 4); iV.set([vx, vy, vz, g.tB + tl], o * 4); iS.set([w.x, w.y, w.z, rng.range(0.14, 0.5)], o * 4); iL.set([vx * sk, vz * sk, rng()], o * 3);
      }
    }
    const base = new THREE.BufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0, 0.07, 0.13, 0.62, 0, 0, -0.5, 0, 0, 0.62, 0, 0, 0.05, -0.05, -0.1], 3));
    base.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.88, -0.47, 0, 0.88, -0.47, 0, 0.88, -0.47, 0, 0.89, 0.45, 0, 0.89, 0.45, 0, 0.89, 0.45], 3));
    const m = mat(SPLINTER_VERT, GLASS_FRAG, glassU, { transparent: true, depthWrite: false, forceSinglePass: true });
    add(instanced(base, n, { iB: [iB, 4], iV: [iV, 4], iS: [iS, 4], iL: [iL, 3] }), m, 5); triangles += n * 2;
  }
  await ctx.yield();

  // tea ribbons: one strand per vessel, 28 stations along it, two vertices each
  {
    const NJ = 28, nv = NG * NJ * 2, aE = new Float32Array(nv * 4), aEv = new Float32Array(nv * 4), aEn = new Float32Array(nv * 4), aEvn = new Float32Array(nv * 4), aPool = new Float32Array(nv * 4), aSide = new Float32Array(nv * 3), idx = [];
    let o = 0;
    for (const g of GL) {
      const b0 = o, seed = rng();
      for (let j = 0; j < NJ; j++) {
        for (let sd = -1; sd <= 1; sd += 2, o++) {
          aE.set([g.p0.x, g.p0.y, g.p0.z, g.tL], o * 4); aEv.set([g.v0.x, g.v0.y, g.v0.z, g.tB], o * 4); aEn.set([g.w.x, g.w.y, g.w.z, g.tau], o * 4);
          aEvn.set([g.q0.x, g.q0.y, g.q0.z, g.q0.w], o * 4); aPool.set([g.pool[0], g.pool[1], g.tS, g.tE], o * 4); aSide.set([sd, j / (NJ - 1), seed], o * 3);
        }
        if (j < NJ - 1) { const a = b0 + j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    geo.setAttribute('aE', new THREE.BufferAttribute(aE, 4)); geo.setAttribute('aEv', new THREE.BufferAttribute(aEv, 4)); geo.setAttribute('aEn', new THREE.BufferAttribute(aEn, 4));
    geo.setAttribute('aEvn', new THREE.BufferAttribute(aEvn, 4)); geo.setAttribute('aPool', new THREE.BufferAttribute(aPool, 4)); geo.setAttribute('aSide', new THREE.BufferAttribute(aSide, 3)); geo.setIndex(idx);
    add(geo, mat(RIBBON_VERT, RIBBON_FRAG, { ...teaU, uTeaQ: { value: new THREE.Vector4(V.closed ? 0 : V.h * 0.42, 0, 0, 0) } }, { transparent: true, depthWrite: false, forceSinglePass: true }), 3); triangles += idx.length / 3;
  }

  // puddles and the wet trails of sliding shards
  const flat = new THREE.BufferGeometry();
  flat.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, -1, 1, 0, 1, -1, 0, 1], 3));
  {
    const iPud = new Float32Array(NG * 4), iSeed = new Float32Array(NG);
    GL.forEach((g, i) => { iPud.set([g.puddle.x, g.puddle.z, g.puddle.t, g.puddle.r * (load === 'milk' ? 1.25 : 1)], i * 4); iSeed[i] = g.puddle.seed; });
    const m = mat(PUDDLE_VERT, PUDDLE_FRAG, teaU, { transparent: true, depthWrite: false, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    add(instanced(flat, NG, { iPud: [iPud, 4], iSeed: [iSeed, 1] }), m, 1); triangles += NG * 2;
  }
  const strip = new THREE.BufferGeometry();
  strip.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.5, 1, 0, -0.5, 1, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 0, 0, 0.5], 3));
  const softCol = teaC.clone().multiplyScalar(0.55);
  {
    const per = 9, n = NG * per, iTr = new Float32Array(n * 4), iTr2 = new Float32Array(n * 3); let o = 0;
    for (const g of GL) for (let k = 0; k < per; k++, o++) { const p = g.pieces[(k * 5 + g.i) % g.pieces.length]; iTr.set([p.land[0], p.land[1], p.slide[0], p.slide[1]], o * 4); iTr2.set([p.tLand, rng.range(0.18, 0.5), rng()], o * 3); }
    const m = mat(TRAIL_VERT, SOFT_FRAG, { uSoftCol: { value: new THREE.Vector4(softCol.r, softCol.g, softCol.b, load === 'milk' ? 0.5 : 0.34) }, uSoftBeam: { value: 0 } }, { transparent: true, depthWrite: false, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    add(instanced(strip, n, { iTr: [iTr, 4], iTr2: [iTr2, 3] }), m, 0); triangles += n * 2;
  }
  {
    const n = NG * GL[0].pieces.length, iA = new Float32Array(n * 4), iBv = new Float32Array(n * 4), iC = new Float32Array(n * 3); let o = 0;
    for (const g of GL) for (const p of g.pieces) { iA.set([p.cB[0], p.cB[1], p.cB[2], p.tB], o * 4); iBv.set([p.pv.x, p.pv.y, p.pv.z, p.tLand], o * 4); iC.set([p.slide[0], p.slide[1], rng.range(0.45, 0.7)], o * 3); o++; }
    const m = mat(SHADOW_VERT, SOFT_FRAG, { uSoftCol: { value: new THREE.Vector4(0.035, 0.06, 0.13, 0.55) }, uSoftBeam: { value: 1 } }, { transparent: true, depthWrite: false, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    add(instanced(strip, n, { iA: [iA, 4], iBv: [iBv, 4], iC: [iC, 3] }), m, 0); triangles += n * 2;
  }
  // the tray's shadow on the floor
  const blobU = { uObj: { value: new THREE.Matrix4() }, uFade: { value: 0 }, uSoftCol: { value: new THREE.Vector4(0.03, 0.045, 0.085, 0.62) }, uSoftBeam: { value: 1 } };
  add(strip, mat(BLOB_VERT, SOFT_FRAG, blobU, { transparent: true, depthWrite: false, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), 0); triangles += 2;

  // steam sinking into the full glasses
  {
    const per = 3, n = NG * per, iSt = new Float32Array(n * 4), iSt2 = new Float32Array(n * 2); let o = 0;
    for (const g of GL) for (let k = 0; k < per; k++, o++) { iSt.set([g.slotG.x, g.slotG.y + V.h * 0.45, g.slotG.z, g.tL], o * 4); iSt2.set([rng(), rng.range(0.22, 0.4)], o * 2); }
    const quad = new THREE.BufferGeometry(); quad.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    add(instanced(quad, n, { iSt: [iSt, 4], iSt2: [iSt2, 2] }), mat(STEAM_VERT, STEAM_FRAG, {}, { transparent: true, depthWrite: false, forceSinglePass: true }), 8); triangles += n * 2;
  }
  await ctx.yield();

  // a stand-in for the room's own furniture where the tray touches it: a length of pass shelf on brass posts over
  // the island, and the island's south end that the tray leans on (opts.stage === false leaves them out)
  if (opts.stage !== false) {
    const M = makeMesher(), marble = mul3(lin(pal[0]), 0.82), walnut = lin(pal[5]), brass = mix3(lin(pal[3]), lin(pal[0]), 0.3);
    const wal = (x, y, z) => mul3(walnut, 0.85 + 0.3 * ((Math.sin(x * 1.7 + z * 2.3) * 0.5 + 0.5)));
    const island = (z0, z1) => {
      const zc = (z0 + z1) / 2, dz = Math.abs(z1 - z0);
      M.slab(18, 0.4, zc, 24.4, 0.8, dz + 0.4, 0.1, mul3(walnut, 0.6), [0, 0.3, 3]);
      M.slab(18, 5.2, zc, 24, 8.8, dz, 0.12, wal, [0, 0.35, 3]);
      M.slab(18, 9.75, zc, 24.3, 0.3, dz + 0.3, 0.08, mul3(walnut, 1.25), [0, 0.4, 3]);
      M.slab(18, 10.35, zc, 25, 0.9, dz + 1, 0.16, marble, [0, 0.7, 2]);
      for (let i = 0; i < 4; i++) {                    // raised panels and drawer fronts with brass pulls on the end face
        const x = 9 + i * 6, zf = Math.max(z0, z1);
        M.slab(x, 4.0, zf + 0.06, 5.0, 5.4, 0.3, 0.12, mul3(walnut, 1.12 + 0.1 * (i & 1)), [0, 0.45, 3]);
        M.slab(x, 8.2, zf + 0.06, 5.0, 1.9, 0.3, 0.1, mul3(walnut, 1.2), [0, 0.45, 3]);
        M.lathe([[0, 0.34], [0.2, 0.3], [0.26, 0.2], [0.14, 0.1], [0.12, 0], [0, 0]], 8, { sign: 1, color: brass, surf: [1, 0.7, 0], m: new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(x, 8.2, zf + 0.2) });
      }
    };
    island(49, 36); island(-32, -68);
    { const fl = mul3(lin(pal[0]), 0.86), s4 = [0, 0.5, 4], q = [[-30, 0, -84], [48, 0, -84], [48, 0, 150], [-30, 0, 150]]; for (const i of [0, 2, 1, 0, 3, 2]) M.put(q[i][0], q[i][1], q[i][2], 0, 1, 0, fl, s4); }
    M.slab(21, 17.6, -50, 18, 0.8, 36, 0.14, marble, [0, 0.7, 2]);
    const post = [[0, 0], [0.5, 0], [0.5, 0.3], [0.3, 0.5], [0.22, 0.9], [0.3, 1.2], [0.2, 1.5], [0.2, 4.6], [0.3, 4.9], [0.22, 5.2], [0.3, 5.5], [0.48, 5.75], [0.48, 5.9], [0, 5.9]];
    for (const z of [-66, -50, -34]) M.lathe(post, 10, { sign: -1, color: brass, surf: [1, 0.7, 0], m: new THREE.Matrix4().makeScale(1, 6.4 / 5.9, 1).setPosition(12.8, 10.8, z) });
    add(M.build(), mat(OBJ_VERT, SOLID_FRAG, { uObj: { value: new THREE.Matrix4() } })); triangles += M.triangles;
  }
  await ctx.yield();

  // ---------------------------------------------------------------- per frame
  const center = new THREE.Vector3(4, 9, -22);
  const tp = new THREE.Vector3(), tq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), camW = new THREE.Vector3(), objW = new THREE.Vector3();
  const nT = new THREE.Vector3(), sunH = new THREE.Vector3(), bx = new THREE.Vector3(), bz = new THREE.Vector3(), bo = new THREE.Vector3();
  let driven = false, clock = T_END;
  const rareOpt = !!opts.rare, breath = opts.breath ?? 0.03;
  function apply(T, time) {
    U.uT.value = T; U.uTime.value = time; U.uWall.value.z = time;
    tray.pose(T, tp, tq); U.uTray.value.compose(tp, tq, one);
    // shadow: the disc's centre carried down the sun's direction to the floor
    const L = U.uSunDir.value, k = tp.y / Math.max(L.y, 0.05);
    nT.set(0, 1, 0).applyQuaternion(tq); sunH.set(L.x, 0, L.z); const sl = sunH.length(); if (sl > 1e-4) sunH.multiplyScalar(1 / sl); else sunH.set(1, 0, 0);
    const flatness = Math.abs(nT.y), len = Math.min(12 * flatness + (12 / Math.max(L.y / Math.max(sl, 0.05), 0.2)) * (1 - flatness), 40);
    const wid = 12 * Math.max(flatness, Math.abs(nT.x * sunH.x + nT.z * sunH.z), 0.14);
    bx.copy(sunH).multiplyScalar(-len); bz.set(-sunH.z, 0, sunH.x).multiplyScalar(wid);
    bo.set(tp.x - L.x * k, 0.03, tp.z - L.z * k).addScaledVector(bx, -0.5 + 0.5 * (1 - flatness) * 0.7);
    blobU.uObj.value.makeBasis(bx, UP, bz).setPosition(bo);
    blobU.uFade.value = 1 - smoothstep(7, 19, tp.y);
  }
  apply(clock, 0);

  return {
    object, radius: 38, height: 27, center, ground: opts.stage === false, groundY: 0, triangles,
    uniforms: U,
    anchors: {
      trayShelf: new THREE.Vector3(14, 18, -50), trayFloor: new THREE.Vector3(-2, 0, -15), trayLean: new THREE.Vector3(16, 5.6, 51), wreck: new THREE.Vector3(-3, 0, -5),
      closePass: { position: new THREE.Vector3(1, 23, -53), lookAt: new THREE.Vector3(14, 19, -50) },
      flyThrough: [new THREE.Vector3(16, 7, 145), new THREE.Vector3(16, 7, 85), new THREE.Vector3(-3, 7.5, 45), new THREE.Vector3(-6, 8, 5), new THREE.Vector3(-2, 15, -25), new THREE.Vector3(1, 23, -53), new THREE.Vector3(-4, 15, -110)],
      viewpoints: {
        entry: { position: new THREE.Vector3(16, 7, 145), lookAt: new THREE.Vector3(16, 5.6, 51) },
        rise: { position: new THREE.Vector3(-5, 9, 12), lookAt: new THREE.Vector3(5, 15, -36) },
        laid: { position: new THREE.Vector3(1, 23, -53), lookAt: new THREE.Vector3(14, 19, -50) },
      },
      portalSeat: { position: new THREE.Vector3(0, 19.5, -353), facing: new THREE.Vector3(0, 0, 1) },
    },
    clockAt, trayPose: (T, pos, quat) => tray.pose(T, pos, quat || tq), plan: GL,
    setLight,
    setProgress(u, rare) { driven = true; clock = clockAt(u, rare ?? rareOpt); },
    setClock(T) { driven = true; clock = clamp(T, 0, T_END); },
    update(dt, time, camera) {
      if (!driven && camera) {                          // demo for the set-piece viewer: the camera's bearing plays the event
        camera.getWorldPosition(camW); object.getWorldPosition(objW);
        let az = Math.atan2(camW.x - objW.x - center.x, camW.z - objW.z - center.z); if (az < -0.6) az += Math.PI * 2;
        clock = clamp(clockAt(lerp(0.03, 0.45, clamp((az + 0.3) / (Math.PI * 1.5), 0, 1)), false) + 0.3 * Math.sin(time * 0.6), 0, T_END);
      }
      // time is never quite steady: a slow breath on the clock keeps a held frame alive (nothing moves at T = 0 or 11)
      apply(clamp(clock + breath * Math.sin(time * 1.3) * smoothstep(0, 0.3, clock) * smoothstep(0, 0.3, T_END - clock), 0, T_END), time);
    },
    dispose() {},
  };
}
