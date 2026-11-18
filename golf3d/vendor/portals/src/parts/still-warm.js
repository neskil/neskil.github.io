// STILL WARM: the heating coming on, seen as one growing tree of gold.
//
// A thermal picture that is built, not filtered: nothing here has an albedo or receives light. Every surface
// writes a temperature t (0 = glass at -20 C ... 1 = flame) and one continuous ramp turns it into the seven
// palette tones (black, charcoal, slate, ash, bone white, and only above 50 C gold and white-gold).
//
// This module holds (a) the shared thermal kit the world builds everything with: HOUSE (the dimensions of the
// eight-times-life-size row house), PATH_POINTS (the camera route), thermalShared() (the uniforms every material
// shares: uFront is the one clock of the set piece), thermalMaterial() (the shell / prop material), makeTB() (a
// merging geometry builder that writes the per-vertex attribute aH = rest temperature, arrival, gain, surface
// kind) and (b) buildHero(): the heating system itself: the nine-section cast-iron boiler with its fire door,
// mica window, gauge glass and dripping drain cock, the hot-water cylinder, the open mains under the cellar
// joists, the pipe network inside floors and walls (ribbons with a gaussian core and a halo that widens after the
// front has passed) and every column radiator (one rib geometry, instanced, filling from the foot upward).
//
// Space: world space == house space. x -34 (west party wall) .. +34, z 0 (street) .. -164 (rear), cellar floor
// y -22, ground 0, first floor 24, top floor 48, top ceiling 74. The hero object sits at the origin, unrotated.
//
// hero = await buildHero(ctx, { shared, path, detail })
//   hero.object            Group (boiler, cylinder, tubes, ribbons, ribs, flame, drip)
//   hero.setProgress(u)    moves the front (latched: it never runs back). Without it update() loops on time.
//   hero.update(dt, time, camera, renderer)
//   hero.anchors           { boiler, cylinder, micaWindow, drainCock, mousePipe, radiators: [{ id, pos, axis,
//                            normal, n, width, height, arrive, full, top }], keys: { burner, leave, ... },
//                            portal: { position, width, height }, treeCenter }
//   hero.shared            the shared uniforms (uFront, uTime, uShift, uTop = the top storey's own shift, uSun, uPx,
//                          uDark = how far a composed room closes down round its hot thing, uToe = 1 keeps the window end's
//                          weakly lit walls grey)
import * as THREE from 'three';
import { makePath } from '../kit/core.js';

export const HOUSE = { X0: -34, X1: 34, Z0: 0, Z1: -164, CELLAR: -22, G: 0, F1: 24, F2: 48, TOP: 74, SLAB: 3,
  WELL: { x0: -24, x1: 24, z0: -116, z1: -164 }, BOILER: [-8, -22, -82], BYAW: -0.3, CYL: [2, -22, -62], LANE: -19,
  WIN: { x: -14, w: 22, sill: 55, head: 72 } };

// the cellar, entering between two piers with the boiler and the cylinder straight ahead, then bowing west round the
// boiler's front corner and flank -> the well -> the east hall -> a steep climbing turn high in the stairwell
// (the street wall is seen from above the second flight) -> down onto the top landing -> up to the window
export const PATH_POINTS = [
  [-7, -11, -10], [-7, -11, -30], [-8.5, -11, -43], [-12.5, -11.1, -55], [-18.8, -11.5, -66.5], [-23.3, -12, -78], [-23.5, -12, -89], [-22, -11.6, -99], [-19.5, -11, -108], [-18, -10.5, -116], [-17, -9, -126],
  [-17, -6.5, -137], [-12, -2.4, -149], [0, 1.8, -154], [12, 5.0, -149], [17, 6.6, -137], [16.5, 7, -122], [14.5, 7, -106], [13, 7, -90], [13.5, 8.5, -76], [15.5, 12, -64],
  [17, 19.5, -55], [17.5, 28.5, -47], [16, 37.5, -39.5], [11, 46.5, -31], [2, 54, -25.5], [-8, 59, -25], [-14.5, 60.5, -33], [-15, 60.5, -44],
  [-14.5, 60.5, -56], [-14, 58.5, -72], [-14, 58, -90], [-14, 59.5, -108], [-14, 62, -128], [-14, 62, -163.5]];

export const PALETTE = ['#070708', '#26282B', '#575B60', '#9C9D9B', '#EEE9DD', '#F0B43A', '#FFE9B2'];
// temperatures of the seven stops, and names for the ones the builders use
export const T = { GLASS: 0.0, COLD: 0.1, CHAR: 0.18, DIM: 0.27, SLATE: 0.36, WOOD: 0.45, ASH: 0.54, PALE: 0.63, BONE: 0.72, GOLD: 0.88, FLAME: 1.0 };
export const KIND = { PLAIN: 0, BRICK: 1, BOARD: 2, TILE: 3, CLOTH: 4, IRON: 5, PAPER: 6, METAL: 7, BEAM: 8, UNDER: 9, RUG: 10 };

const glv = (hex) => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(5)},${c.g.toFixed(5)},${c.b.toFixed(5)})`; };

// the ramp, the sensor grain and the small noises every thermal shader shares
export const THERMAL_GLSL = /* glsl */`
uniform float uTime, uFront, uShift, uSun;
vec3 thRamp(float t) {
  t = clamp(t, 0., 1.);
  vec3 c = mix(${glv(PALETTE[0])}, ${glv(PALETTE[1])}, clamp(t / .18, 0., 1.));
  c = mix(c, ${glv(PALETTE[2])}, clamp((t - .18) / .18, 0., 1.));
  c = mix(c, ${glv(PALETTE[3])}, clamp((t - .36) / .18, 0., 1.));
  c = mix(c, ${glv(PALETTE[4])}, clamp((t - .54) / .18, 0., 1.));
  c = mix(c, ${glv(PALETTE[5])}, clamp((t - .75) / .13, 0., 1.));
  c = mix(c, ${glv(PALETTE[6])}, clamp((t - .88) / .12, 0., 1.));
  return c;
}
float thHash(vec2 p) { p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float thNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(thHash(i), thHash(i + vec2(1., 0.)), f.x), mix(thHash(i + vec2(0., 1.)), thHash(i + vec2(1., 1.)), f.x), f.y); }
float thGrain() {            // sensor noise: fine grain stepped eight times a second, and the slow crawl of a bolometer's drift
  return (thHash(floor(gl_FragCoord.xy) + floor(uTime * 8.) * vec2(17.13, 31.71)) - .5) * .046
    + (thNoise(gl_FragCoord.xy * .024 + uTime * vec2(.5, .21)) - .5) * .034;
}
`;

// ---- warm light. What is hot lays gold on what stands near it: every hot thing (a pipe run, a radiator, the fire
// door, the portal) is a line emitter a..b with a reach, a strength and the arrival of the front at each end. The
// house is cut into five parts, each with its own short list (a row of a small float texture read with texelFetch),
// so a pixel only ever adds up the emitters of the part it stands in.
export const NE = 26, NZ = 5, NE0 = 20;
const ZONES = [[-22, -2.9, -164, 0], [-2.9, 22.5, -164, -60.3], [-2.9, 24, -60.3, 0], [24, 74, -60.3, 0], [22.5, 74, -164, -60.3]];   // y0, y1, z0, z1
export function thermalShared() {
  const tex = new THREE.DataTexture(new Uint16Array(NE * NZ * 3 * 4), NE, NZ * 3, THREE.RGBAFormat, THREE.HalfFloatType);   // half floats, nearest: every phone reads these
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return { uTime: { value: 0 }, uFront: { value: 0 }, uShift: { value: 0 }, uSun: { value: 0 }, uPx: { value: 0.0025 }, uDoor: { value: 0 }, uStir: { value: 0 },
    uEm: { value: tex }, uGlow: { value: 1 }, uTop: { value: 0 }, uDark: { value: 1 }, uToe: { value: 0 }, emit: [] };
}
// o: { R reach (m), I strength, arr / arr1 arrival of the front at a / at b (-1 = always), I0 share that is on before it
//      arrives, w how long it takes to come on (in u), flick: a flame, down: something above the cellar that may light it
//      (the floor between the cellar and the house stops everything else), prio: always kept (on top of the NE0 strongest of
//      a part of the house), span: something at the head of the top landing that lights the gallery as well as the strip }
export function addEmitter(shared, a, b, o = {}) {
  shared.emit.push({ a, b: b || a, R: o.R ?? 5, I: o.I ?? 1, arr0: o.arr ?? -1, arr1: o.arr1 ?? o.arr ?? -1, I0: o.I0 ?? 0, w: o.w ?? 0.015, flick: !!o.flick, down: !!o.down, run: !!o.run, prio: !!o.prio, span: !!o.span });
}
export function bakeEmitters(shared, detail = 1, runScale = 1) {            // runScale: the reach of pipe runs (shorter on the night visit)
  const tex = shared.uEm.value, d = new Float32Array(NE * NZ * 3 * 4), hd = tex.image.data, cap = Math.max(8, Math.round(NE0 * Math.min(1, detail + 0.15)));
  d.fill(0);
  for (let z = 0; z < NZ; z++) {
    const [y0, y1, z0, z1] = ZONES[z], list = [];
    for (const e of shared.emit) {
      const below = Math.max(e.a[1], e.b[1]) < -2.9;
      if ((z === 0) !== below && !e.down) continue;
      // (the top landing is lit only by what stands on its own floor, behind its own walls)
      if (z === 4 && (Math.max(e.a[1], e.b[1]) < 44 || (Math.min(e.a[2], e.b[2]) > -60.2 && !e.span))) continue;
      const eR = e.R * (e.run ? runScale : 1), r = eR * 1.9, ay = Math.min(e.a[1], e.b[1]) - r, by = Math.max(e.a[1], e.b[1]) + r, az = Math.min(e.a[2], e.b[2]) - r, bz = Math.max(e.a[2], e.b[2]) + r;
      if (by < y0 || ay > y1 || bz < z0 || az > z1) continue;
      // how much of its reach lies inside this part of the house decides who stays when the list is full
      const oy = Math.min(by, y1) - Math.max(ay, y0), oz = Math.min(bz, z1) - Math.max(az, z0);
      list.push([e, e.I * eR * Math.min(1, oy / (2 * r)) * Math.min(1, oz / (2 * r))]);
    }
    list.sort((p, q) => q[1] - p[1]);
    // the strongest of the ordinary emitters, then every one marked prio (the pools the rooms are composed round)
    const keep = list.filter((l) => !l[0].prio).slice(0, cap).concat(list.filter((l) => l[0].prio)).slice(0, NE);
    for (let i = 0; i < keep.length; i++) {
      const e = keep[i][0], o0 = (z * 3 * NE + i) * 4, o1 = o0 + NE * 4, o2 = o1 + NE * 4;
      d[o0] = e.a[0]; d[o0 + 1] = e.a[1]; d[o0 + 2] = e.a[2]; d[o0 + 3] = e.R * (e.run ? runScale : 1);
      d[o1] = e.b[0]; d[o1 + 1] = e.b[1]; d[o1 + 2] = e.b[2]; d[o1 + 3] = e.I;
      const w = Math.max(e.w, 0.002); d[o2] = e.arr0; d[o2 + 1] = e.arr1; d[o2 + 2] = e.I0; d[o2 + 3] = e.flick ? -w : w;
    }
  }
  for (let i = 0; i < d.length; i++) hd[i] = THREE.DataUtils.toHalfFloat(d[i]);
  tex.needsUpdate = true;
}
const GOLD_GLSL = glv(PALETTE[5]), WGOLD_GLSL = glv(PALETTE[6]);
export const GLOW_GLSL = /* glsl */`
uniform highp sampler2D uEm; uniform float uGlow;
float thEdgeCut = 0.;            // set by the shader that includes this: 1 = the pipe in the floor's cut edge lights nothing above the boards
// x: gold light falling on a surface at p with normal N; y: the same emitters mirrored in a polished floor (gloss > 0)
vec2 thGlow(vec3 p, vec3 N, float gloss) {
  int row = 3 * (p.y < -2.9 ? 0 : (p.z > -60.3 ? (p.y < 24. ? 2 : 3) : (p.y < 22.5 ? 1 : 4)));
  vec3 cp = cameraPosition; vec2 vd = p.xz - cp.xz; float vl = max(length(vd), 1e-3); vd /= vl;
  float sP = max(cp.y - p.y, 0.) / vl, sinE = sP / sqrt(1. + sP * sP), fres = (1. - sinE) * (1. - sinE);
  float g = 0., sp = 0.;
  for (int i = 0; i < ${NE}; i++) {
    vec4 B = texelFetch(uEm, ivec2(i, row + 1), 0);
    if (B.w <= 0.) break;
    vec4 A = texelFetch(uEm, ivec2(i, row), 0);
    vec3 ba = B.xyz - A.xyz, pa = p - A.xyz;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.);
    vec3 d = A.xyz + ba * h - p; float d2 = dot(d, d), r2 = A.w * A.w;
    float cut = max(0., 1. - d2 / (r2 * 9.)), hgt = .5 * (A.y + B.y) - p.y;
    bool mir = gloss > 0. && hgt > .6 && d2 < 3600.;                                     // (most pixels are out of reach of most emitters)
    if (cut <= 0. && !mir) continue;
    vec4 C = texelFetch(uEm, ivec2(i, row + 2), 0);
    float on = C.z + (1. - C.z) * smoothstep(0., abs(C.w), uFront - mix(C.x, C.y, h));
    on *= 1. + step(C.w, 0.) * (.09 * sin(uTime * 9.7 + float(i)) + .06 * sin(uTime * 23.3)) + .035 * sin(uTime * 1.9 + float(i) * 2.1 + h * 5.);
    on *= 1. - step(A.y + B.y, -2.5) * smoothstep(.12, .8, p.y) * thEdgeCut;
    float lam = clamp(dot(N, d) * inversesqrt(max(d2, 1e-3)) * .62 + .38, 0., 1.);
    g += B.w * on * cut * cut * lam / (1. + 3. * d2 / r2);
    if (mir) {
      vec2 ea = A.xz - cp.xz, eb = B.xz - cp.xz;
      float la = ea.x * vd.y - ea.y * vd.x, lb = eb.x * vd.y - eb.y * vd.x;           // how far to the side of the line of sight
      float dl = la * lb < 0. ? 0. : min(abs(la), abs(lb));
      float da = max(dot(ea, vd), .05), db = max(dot(eb, vd), .05), dm = .5 * (da + db);
      float sa = (cp.y + A.y - 2. * p.y) / da, sb = (cp.y + B.y - 2. * p.y) / db;
      float ds = sP - clamp(sP, min(sa, sb), max(sa, sb)), k = ds > 0. ? .85 : .28;   // long toward the eye, short beyond
      float wl = .45 + .03 * dm;
      sp += B.w * on * smoothstep(.6, 3., hgt) * smoothstep(0., 4., dm - vl) * exp(-dl * dl / (wl * wl)) * exp(-ds * ds / (k * k * sP * sP + 4e-4)) * exp(-max(dm - vl, 0.) / 34.) * (1. - smoothstep(2500., 3600., d2));
    }
  }
  return vec2(g, sp * fres * gloss) * uGlow;
}
vec3 thLit(vec3 col, vec2 gl, float keep, float pool, float toe) {
  float s = 1. - exp(-gl.x * 1.5); s *= s * (3. - 2. * s);
  s *= mix(1., smoothstep(.05, .3, s), toe);                             // (toe: weak light leaves a grey wall grey instead of turning it khaki)
  float lum = dot(col, vec3(.33, .5, .17));
  col = mix(col, ${GOLD_GLSL} * min(.36 + 1.0 * lum + .4 * s * s, 1.), s * .86 * keep);      // deep gold at the edge of a pool, full gold beside what throws it
  col = mix(col, ${WGOLD_GLSL}, pool * smoothstep(.74, 1., s) * .38 * keep);                     // and, in a composed pool, white-gold where the light lands
  return col + (1. - col) * ${GOLD_GLSL} * min(gl.y, 1.) * .62;
}
`;

const SHELL_VERT = /* glsl */`
attribute vec4 aH; attribute float aS;
uniform float uTime, uFront, uStir;
varying vec4 vH; varying vec3 vW, vN, vL;
void main() {
  vH = aH; vL = position;
  vec3 p = position;
  #ifdef USE_INSTANCING
    vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.);
    vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  #else
    vec4 wp = modelMatrix * vec4(p, 1.);
    vN = normalize(mat3(modelMatrix) * normal);
  #endif
  float heat = aH.y < -.5 ? 0. : smoothstep(aH.y, aH.y + .03, uFront);
  float amp = aS * (.35 + .65 * heat + uStir * aS);
  wp.x += amp * (sin(uTime * 1.3 + wp.y * .33 + wp.z * .21) * .32 + sin(uTime * 2.9 + wp.y * .9) * .08);
  wp.z += amp * (sin(uTime * 1.1 + wp.y * .27 + wp.x * .19 + 1.7) * .3 + sin(uTime * 3.3 + wp.x * .8) * .07);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const SHELL_FRAG = /* glsl */`
varying vec4 vH; varying vec3 vW, vN, vL;
uniform float uLimb, uDoor, uTop, uDark, uToe;
${THERMAL_GLSL}
${GLOW_GLSL}
// light through one window of the street wall (centre cx, half-width hw, sill y0, head y1), with its mullion and transom
float sunWin(float xs, float hy, float cx, float hw, float y0, float y1) {
  float ax = abs(xs - cx), ym = .5 * (y0 + y1);
  float m = (1. - smoothstep(hw - .5, hw, ax)) * smoothstep(y0, y0 + .9, hy) * (1. - smoothstep(y1 - .9, y1, hy));
  return m * (.35 + .65 * smoothstep(.2, .55, ax)) * (.35 + .65 * smoothstep(.25, .7, abs(hy - ym)));
}
void main() {
  vec3 N = normalize(vN);
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  float ndv = abs(dot(N, V));
  float t = vH.x, k = floor(vH.w + .5);
  t -= .015 * smoothstep(.33, .41, t) * (1. - smoothstep(.5, .58, t));   // woodwork and cloth sit a clear tone above the walls
  float cool = 1. - smoothstep(.56, .68, t);                         // what is at body heat or hotter keeps its temperature
  // which plane the surface lies in, for patterns laid in world space
  vec3 an = abs(N); vec2 q = an.y > .6 ? vW.xz : (an.x > an.z ? vW.zy : vW.xy);
  float px = max(fwidth(q.x) + fwidth(q.y), 1e-4);
  float fade = 1. - smoothstep(.12, .7, px);
  float pat = 0.;
  if (k < .5) { pat = (thNoise(q * .22) - .5) * .05 + (thNoise(q * 1.7) - .5) * .018 * fade; }
  else if (k < 1.5) {                                                // brick: 1.8 x 0.6 m, mortar a touch warmer
    vec2 b = q / vec2(1.8, .62); b.x += .5 * floor(b.y); vec2 id = floor(b), f = fract(b);
    float m = smoothstep(.0, .07, f.x) * (1. - smoothstep(.93, 1., f.x)) * smoothstep(0., .16, f.y) * (1. - smoothstep(.84, 1., f.y));
    pat = ((thHash(id) - .5) * .085 * m + (1. - m) * .05) * fade + (thNoise(q * .13) - .5) * .07;
  } else if (k < 2.5 || (k > 8.5 && k < 9.5)) {                      // boards 1.05 m wide, butt joints, a knot now and then
    float amp = k > 8.5 ? .3 : 1.;                                   // (kind 9: the same boards seen from below, in the cold and nearly even)
    vec2 b = an.y > .6 ? vW.xz : q; float w = b.x / 1.05; float id = floor(w), f = fract(w);
    float len = (b.y + thHash(vec2(id, 3.)) * 17.) / 17.; float jid = floor(len), jf = fract(len);
    float gap = smoothstep(0., .05, f) * (1. - smoothstep(.95, 1., f)) * smoothstep(0., .006, jf) * (1. - smoothstep(.994, 1., jf));
    pat = ((thHash(vec2(id, jid)) - .5) * .07 * gap * amp - (1. - gap) * mix(.06, .035, step(8.5, k))) * fade + (thNoise(vec2(b.x * 2.3, b.y * .21)) - .5) * .03 * fade * amp + (thNoise(q * .11) - .5) * .04 * mix(1., .6, step(8.5, k));
  } else if (k < 3.5) {                                              // tiles 1.6 m, cold grout
    vec2 b = q / 1.6; vec2 id = floor(b), f = fract(b);
    float m = smoothstep(0., .05, f.x) * (1. - smoothstep(.95, 1., f.x)) * smoothstep(0., .05, f.y) * (1. - smoothstep(.95, 1., f.y));
    pat = ((mod(id.x + id.y, 2.) - .5) * .05 * m - (1. - m) * .05) * fade + (thNoise(q * .15) - .5) * .04;
  } else if (k < 4.5 || k > 9.5) {                                   // cloth: weave and soft folds (kind 10: a runner worn to a sheen)
    pat = (sin(q.x * 9.) * sin(q.y * 9.)) * .012 * fade + (thNoise(q * .9) - .5) * .05 + (thNoise(q * 3.7) - .5) * .02 * fade;
  } else if (k < 5.5) {                                              // cast iron: pitted, a little warmer on the flats
    pat = (thNoise(q * 2.6) - .5) * .045 * fade + (thNoise(q * .5) - .5) * .04;
  } else if (k < 6.5) {                                              // papered wall: stripes, a dado line
    float s = abs(fract(q.x / 2.4) - .5); pat = (smoothstep(.2, .24, s) - .5) * .026 * fade + (thNoise(q * .2) - .5) * .05;
    // below the dado rail the wall is panelled wood, a tone warmer than the paper: stiles, a sunk field with its bevel, a cap
    float hl = vW.y - (vW.y < 22.5 ? 0. : (vW.y < 46.5 ? 24. : 48.));
    if (vW.y > -1. && hl < 8.2 && an.y < .5) {
      float su = abs(fract(q.x / 4.4) - .5) * 4.4;
      float field = (1. - smoothstep(1.74, 1.8, su)) * smoothstep(1.9, 1.96, hl) * (1. - smoothstep(6.54, 6.6, hl));
      float ex = min(1.78 - su, min(hl - 1.92, 6.58 - hl));
      float bev = field * (1. - smoothstep(0., .24, ex));
      float wd = .085 - field * .035 - bev * .05 * fade + .03 * smoothstep(7.15, 7.25, hl) + .02 * (1. - smoothstep(1.2, 1.3, hl))
        + (thNoise(vec2(q.x * .35, hl * 3.3)) - .5) * .03 * fade;
      pat = mix(wd, pat, smoothstep(7.7 - px, 7.7 + px, hl));
    }
  } else if (k < 7.5) { pat = (thNoise(q * 1.1) - .5) * .03; }
  else {                                                             // a sawn beam: one piece of timber, its grain running the long way
    pat = (thNoise(vec2(q.x * .21, q.y * 3.1)) - .5) * .028 * fade + (thNoise(q * .07) - .5) * .03;
  }
  t += pat;
  // the house's own cold: outside walls, the floor edge of every wall, a paler band under each ceiling
  float lvl = vW.y < -1.5 ? -22. : (vW.y < 22.5 ? 0. : (vW.y < 46.5 ? 24. : 48.));
  float top = vW.y < -1.5 ? -3. : (vW.y < 22.5 ? 21. : (vW.y < 46.5 ? 45. : 74.));
  float wall = 1. - smoothstep(.3, .6, an.y);
  float cold = .12 * exp(vW.z / 13.) + .12 * exp(-(vW.z + 164.) / 13.) + .03 * exp(-(34. - abs(vW.x)) / 9.);
  cold += wall * (.055 * exp(-max(vW.y - lvl, 0.) / 1.6) - .012 * smoothstep(top - 9., top, vW.y));
  cold += step(N.y, -.6) * .035 * exp(-(34. - abs(vW.x)) / 6.);                    // ceilings fall off toward the walls
  t -= cold * cool;
  t += (.026 * N.y + .02 * (an.x - an.z)) * cool * step(-1.5, vW.y);         // each face of a solid sits at its own tone, so edges read
  // the visit's own chill or warmth; the cellar takes a cold night harder and an afternoon's sun hardly at all
  // (the top storey is the coldest lived-in part of the house on every visit: its walls and ceiling sit between slate and
  // charcoal, its woodwork and furniture a tone above them, so that the cat, the hollows, the prints and the gold carry it)
  float sh = vW.y < -1.5 ? uShift * (uShift < 0. ? 1.5 : .4) : mix(uShift, uTop * (1. - .5 * smoothstep(.465, .52, vH.x)), smoothstep(43., 47.5, vW.y));
  t += sh * cool;
  // the afternoon variant: fading parallelograms where the sun lay on the ground floor
  // (a low sun through the street wall: each window's light lands as a parallelogram crossed by its glazing bars; the
  // first-floor window's reaches under the lintel and far down the hall, the fanlight's lies at the foot of the stair)
  if (uSun > 0. && an.y > .6 && abs(vW.y) < .6 && vW.z > -112.) {
    float d = -vW.z, xs = vW.x + .14 * d, hy = d * .42;
    float sp = sunWin(xs, hy, -24., 4., 7., 19.) + sunWin(xs, hy, -8., 4., 7., 19.) + sunWin(xs, hy, 28., 3.5, 31., 43.) * step(0.7, vW.x);
    float fr = length(vec2(xs - 17., hy - 17.7));
    sp += (1. - smoothstep(4.2, 5., fr)) * smoothstep(17.7, 18.5, hy) * (.45 + .55 * smoothstep(.1, .3, abs(fract(atan(hy - 17.7, xs - 17. + 1e-4) * 1.91) - .5)));
    t += uSun * .37 * min(sp, 1.) * cool;
  }
  // and one upstairs: the laylight's sixteen panes lie on the landing rug, paler than anything else on that floor
  if (uSun > 0. && an.y > .6 && abs(vW.y - 48.) < .6 && vW.z < -92. && vW.z > -118.) {
    float dz = -105. - vW.z; vec2 pq = vec2((vW.x + 15.2 - .17 * dz) / 5.6, dz / 8.2);
    float m = (1. - smoothstep(.94, 1., abs(pq.x))) * (1. - smoothstep(.95, 1., abs(pq.y)));
    vec2 bar = abs(fract(pq * 2. + .5) - .5);
    m *= (.3 + .7 * smoothstep(.035, .1, bar.x)) * (.3 + .7 * smoothstep(.025, .07, bar.y));
    t += uSun * .27 * m * cool;
  }
  // rare event: a hard-edged wedge of outside air sliding down the hall floor from the open front door
  float wdg = 0.;
  if (uDoor > 0. && vW.y < 16. && vW.y > -.5 && vW.x > -6.) {
    float reach = uDoor * 124.; float d = -vW.z;
    float lat = abs(vW.x - 17.) - (5.5 + d * .13 + .7 * sin(d * .31 + uTime * .7));
    wdg = (1. - smoothstep(reach - 1.2, reach + .3, d + 1.6 * sin(vW.x * .6 + uTime * .9))) * (1. - smoothstep(-.5, .5, lat)) * smoothstep(.3, .7, an.y) * (1. - smoothstep(7., 11., vW.y));
    wdg *= min(uDoor * 9., 1.);
    t = mix(t, .035 + .05 * thNoise(vec2(vW.x * .35, d * .12 - uTime * .9)), wdg * cool);
  }
  // the front arriving at this vertex
  if (vH.y > -.5) {
    float age = uFront - vH.y;
    float on = smoothstep(0., .03, age);
    t += vH.z * on + .1 * sign(vH.z) * exp(-age * age / .00012) * step(.3, vH.z);
    t += .014 * sin(uTime * 5.3 + vW.y * 2.4 + vW.x * 1.1) * on * step(.4, vH.z);
    t -= sh * cool * on * smoothstep(.15, .4, vH.z);                     // what the water heats does not share the house's chill
    if (k > 6.5 && k < 7.5) t += .03 * sin(vH.y * 1400. - uTime * 6.) * smoothstep(0., .03, age);
  }
  // warm light from whatever is hot nearby, and its long reflection in boards and tiles
  float gloss = N.y > .6 ? (k > 1.5 && k < 3.5 ? 1. : (k > .5 && k < 1.5 ? .42 : (k > 3.5 && k < 4.5 ? 0. : (k > 9.5 ? 3. : .3)))) : 0.;
  gloss *= .6 + .8 * thNoise(q * .8);
  // three rooms are composed round one hot thing each (the radiator by the settle and the kitchen range on the ground
  // floor behind z -93, the tank cupboard at the head of the top landing). As it comes on, an imager's range closes down
  // round it: what its light does not reach falls toward charcoal, what it lands on warms through and the gold on it
  // rises to white-gold. Each is switched by the front, so nothing changes before its hot thing is lit.
  float rg0 = smoothstep(.268, .33, uFront);
  float rg = rg0 * (1. - smoothstep(-93., -86., vW.z)) * step(-3.2, vW.y) * (1. - smoothstep(21.5, 23., vW.y));
  float rt = smoothstep(.652, .692, uFront) * smoothstep(22.5, 25., vW.y) * smoothstep(-80., -63., vW.z);
  float pool = max(rg, rt);
  thEdgeCut = rg0;
  vec2 gl = thGlow(vW, gl_FrontFacing ? N : -N, gloss);
  // the cut edge of the floor round the well takes the gold of its own pipe as a band that falls off above and below the line
  float cutY = (vW.y + 1.5) / 1.05;
  float edge = max(step(abs(vW.z + 116.), 1.3) * step(abs(vW.x), 25.3), step(abs(abs(vW.x) - 24.), 1.3) * step(vW.z, -115.));   // the well's rim and the trimmer under it
  float em = step(-5.5, vW.y) * step(vW.y, .02) * wall * edge;
  gl *= 1. - .9 * wdg;
  gl.x *= mix(1., .03 + 1.5 * exp(-cutY * cutY * 2.2), em * rg0);       // (once the well is lit: a hot line with a shoulder, not a flat strip)
  float gsat = 1. - exp(-gl.x * 1.5); gsat *= gsat * (3. - 2. * gsat);
  t += (pool * .085 * gsat - uDark * (.115 * rg + .085 * rt) * (1. - gsat) * (1. + 1.2 * smoothstep(.4, .52, t))) * cool;   // (pale woodwork falls furthest: rails and table legs become dark shapes)
  float hotT = smoothstep(.8, .86, t);                                  // (taken before the limb)
  t -= uLimb * (1. - ndv) * (1. - ndv) * (.6 + .4 * cool);              // the soft dark limb
  t = mix(t, max(t, .862) + .045 * ndv * ndv, hotT);                     // what is gold turns away into deeper gold, never into white
  t = mix(t, .3 + sh, (1. - exp(-dist / 520.)) * .4 * cool);           // far surfaces soften toward slate
  vec3 col = thRamp(t + thGrain());
  // (what is pale by its own heat stays pale, and cast iron and cold fittings take little of the gold: the boiler is grey and white)
  // cast iron takes little, except where it faces up at a main: the boiler's crown carries the pipe's reflection
  float keep = (1. - .82 * smoothstep(.52, .68, t)) * (1. - hotT) * (k > 4.5 && k < 5.5 ? mix(.3, 1., smoothstep(.35, .85, N.y)) : (k > 6.5 && k < 7.5 ? .45 : 1.));
  keep *= mix(1., mix(.08 + .92 * exp(-cutY * cutY), 1., rg0), em);
  // the window end of the top landing (by day): gold on the radiator, round the arch and in the floor, the walls beside it slate
  float toe = uToe * smoothstep(45., 47., vW.y) * (1. - smoothstep(-128., -114., vW.z));
  gl_FragColor = vec4(thLit(col, gl, keep, pool, toe), 1.);
}`;

// the one material of the shell, the furniture and the cellar tubes
export function thermalMaterial(shared, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uFront: shared.uFront, uShift: shared.uShift, uSun: shared.uSun, uDoor: shared.uDoor, uStir: shared.uStir, uEm: shared.uEm, uGlow: shared.uGlow, uTop: shared.uTop, uDark: shared.uDark, uToe: shared.uToe, uLimb: { value: o.limb ?? 0.13 } },
    vertexShader: SHELL_VERT, fragmentShader: SHELL_FRAG, side: o.side ?? THREE.FrontSide,
  });
}

// ---- geometry builder: merges parts and writes aH = (rest temperature, arrival, gain, kind) and aS (sway weight)
const _m4 = new THREE.Matrix4(), _n3 = new THREE.Matrix3(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
export function makeTB() {
  const pos = [], nrm = [], ah = [], as = [], idx = [];
  let baseM = null;
  const tb = {
    setBase(m) { baseM = m ? m.clone() : null; return tb; },
    get triangles() { return idx.length / 3; },
    // o: { p:[x,y,z], r:[x,y,z], s:number|[x,y,z], m:Matrix4, t, k, arr, gain, sway, fn(x,y,z,out) } ; fn may change out = [t, arr, gain, sway]
    add(geo, o = {}) {
      if (o.m) _m4.copy(o.m);
      else {
        const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s ?? 1;
        _q.setFromEuler(_e.set(r[0], r[1], r[2], 'YXZ'));
        _m4.compose(_p.set(p[0], p[1], p[2]), _q, typeof s === 'number' ? _s.set(s, s, s) : _s.set(s[0], s[1], s[2]));
      }
      if (baseM) _m4.premultiply(baseM);
      _n3.getNormalMatrix(_m4);
      const gp = geo.attributes.position, gn = geo.attributes.normal, gi = geo.index, base = pos.length / 3;
      const t = o.t ?? T.SLATE, k = o.k ?? 0, arr = o.arr ?? -1, gain = o.gain ?? 0, sway = o.sway ?? 0, out = [0, 0, 0, 0];
      for (let i = 0; i < gp.count; i++) {
        _v.fromBufferAttribute(gp, i).applyMatrix4(_m4); pos.push(_v.x, _v.y, _v.z);
        const x = _v.x, y = _v.y, z = _v.z;
        _v.fromBufferAttribute(gn, i).applyMatrix3(_n3).normalize(); nrm.push(_v.x, _v.y, _v.z);
        if (o.fn) { out[0] = t; out[1] = arr; out[2] = gain; out[3] = sway; o.fn(x, y, z, out, _v); ah.push(out[0], out[1], out[2], k); as.push(out[3]); }
        else { ah.push(t, arr, gain, k); as.push(sway); }
      }
      if (gi) for (let i = 0; i < gi.count; i++) idx.push(base + gi.getX(i));
      else for (let i = 0; i < gp.count; i++) idx.push(base + i);
      if (o.dispose !== false) geo.dispose();
      return tb;
    },
    box(w, h, d, o) { return tb.add(new THREE.BoxGeometry(w, h, d), o); },
    cyl(rt, rb, h, seg, o, open = false) { return tb.add(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), o); },
    sph(r, o, ws = 10, hs = 7) { return tb.add(new THREE.SphereGeometry(r, ws, hs), o); },
    // a tube along points [[x,y,z],...]; arr(i, point) -> arrival
    tube(pts, radius, o = {}, seg = 7) {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', o.tension ?? 0.05);
      return tb.add(new THREE.TubeGeometry(curve, o.steps ?? Math.max(4, pts.length * 4), radius, seg, false), o);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      g.setAttribute('aH', new THREE.Float32BufferAttribute(ah, 4));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 1));
      g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    },
  };
  return tb;
}

// ---- pipes inside floors and walls: ribbons with a gaussian core and a halo that widens once the front has passed
const RIBBON_VERT = /* glsl */`
attribute vec3 aDir; attribute vec4 aP; attribute float aSoft;
uniform float uPx, uDoor, uTime;
varying vec4 vP; varying float vCore, vTop, vSoft, vWdg;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.);
  // rare: the cold wedge from the open front door lies over the lines in the hall floor
  float dW = -wp.z, latW = abs(wp.x - 17.) - (5.5 + dW * .13);
  vWdg = (1. - smoothstep(uDoor * 124. - 1.2, uDoor * 124. + .3, dW)) * (1. - smoothstep(-.5, .5, latW)) * step(wp.y, 1.) * step(-.5, wp.y) * min(uDoor * 9., 1.);
  vTop = smoothstep(43., 47.5, wp.y);
  float dist = length(wp.xyz - cameraPosition);
  float core = max(.45, 2.5 * dist * uPx);
  float hw = max(aP.w, core * 1.6);
  wp.xyz += aDir * aP.x * hw;
  vP = vec4(aP.x * hw, aP.y, aP.z, hw); vCore = core; vSoft = aSoft;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RIBBON_FRAG = /* glsl */`
varying vec4 vP; varying float vCore, vTop, vSoft, vWdg; uniform float uTop;
${THERMAL_GLSL}
void main() {
  float s = abs(vP.x), age = uFront - vP.y;
  float on = smoothstep(0., .008, age);
  float hal = min(mix(.8, 2.7, smoothstep(0., .2, age)), vP.w * .46);
  float core = 1. - smoothstep(.65, 1.3, s / max(vCore, 1e-3));      // a flat gold core: the pale shoulder stays narrow
  float halo = exp(-s * s / max(hal * hal, 1e-3)) * (1. - smoothstep(vP.w * .62, vP.w, s));
  float head = exp(-age * age / .00016);
  float flow = .036 * sin(vP.y * 1500. - uTime * 6.5) + .032 * sin(vP.y * 370. - uTime * 2.3);
  float tw = vP.z + mix(uShift, uTop, vTop);
  float t = mix(tw + on * (.19 + .12 * head) * halo, .87 + flow + .12 * head, core * on);
  float a = on * clamp(core + halo * .9, 0., 1.);
  // the line in the cut edge of the floor, once the well is lit: no flat core and no grey halo, a white-gold thread
  // with a gaussian shoulder that hands over to the gold glow of the edge itself
  float soft = vSoft * smoothstep(.268, .33, uFront), x = s / max(vCore * 1.25, 1e-3), gsh = exp(-x * x * 1.6);
  t = mix(t, .845 + .15 * exp(-x * x * 7.) + flow * .6 + .1 * head, soft);
  a = mix(a, on * gsh, soft);
  t = mix(t, min(t, .2 + .1 * core), vWdg); a *= 1. - .55 * vWdg * (1. - core);
  if (a < .004) discard;
  gl_FragColor = vec4(thRamp(t + thGrain()), a);
}`;

// ---- radiator ribs: one cast section (two turned columns, hubs, a web with a cast scroll), instanced; water fills each
// from the foot upward with one level, crisp waterline that climbs the radiator a little behind in each later rib
const RIB_H = 6.4, RIB_PITCH = 0.7;
const RIB_VERT = /* glsl */`
attribute vec4 iA;
varying vec4 vA; varying vec3 vL, vN, vW;
void main() {
  vA = iA; vL = position;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RIB_FRAG = /* glsl */`
varying vec4 vA; varying vec3 vL, vN, vW; uniform float uTop;
${THERMAL_GLSL}
void main() {
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  float ndv = abs(dot(normalize(vN), V));
  float h = clamp(vL.y / ${RIB_H.toFixed(1)}, 0., 1.);
  float f = (uFront - vA.x) / max(vA.y, 1e-4), started = step(0., f);
  float lvl = clamp(f, 0., 1.04) + .004 * sin(uTime * 2.3 + vA.w) * step(f, 1.);
  float e = h - lvl;                                                  // above the waterline when positive
  float aa = max(fwidth(h) * 1.2, .006);
  float heat = (1. - smoothstep(-aa, aa, e)) * started;
  float line = exp(-e * e / .0005) * started * step(f, 1.03);
  float lead = exp(-max(e, 0.) / .07) * (1. - heat) * started * step(f, 1.03);   // iron just above the water is already warming
  // the cast scroll: on the web between the columns and, fainter, down the face of each column
  float col = step(.3, abs(vL.z));
  vec2 sp = vec2(mix(vL.z * 2.4, vL.x * 3.1, col), fract(vL.y / 1.42 + .25) * 2. - 1.);
  float ang = atan(sp.y, sp.x + 1e-4), rr = length(sp);
  float scroll = (1. - smoothstep(0., .3, abs(sin(ang * 1.5 + rr * 7.)))) * (1. - smoothstep(.7, 1.05, rr));
  float near = 1. - smoothstep(26., 70., dist);
  float inner = 1. - smoothstep(-.1, .45, vL.z);                      // the web and the back column, seen between the ribs
  float lim = (1. - ndv) * (1. - ndv);
  float rest = vA.z + mix(uShift, uTop * .6, smoothstep(43., 47.5, vW.y)) - .06 * exp(-vL.y / 1.1) - .05 * inner + (scroll - .35) * near * .045 - .24 * lim;
  // a full rib: each column a pale gold face turning away into deep gold, the gaps between the ribs deep gold throughout
  float hot = .874 + .095 * ndv * ndv * (1. - .85 * inner) + .012 * h + .007 * sin(uTime * 3.1 + vL.y * 3. + vA.w) + (scroll - .35) * near * .028;
  float t = mix(rest, hot, heat) + lead * .2 + line * .08;
  gl_FragColor = vec4(thRamp(t + thGrain() * mix(1., .3, heat)), 1.);
}`;

function ribGeometry() {
  const b = makeTB(), H = RIB_H;
  const prof = [[0.23, 0.42], [0.335, 0.66], [0.275, 1.35], [0.255, H * 0.5], [0.275, H - 1.5], [0.335, H - 0.85], [0.23, H - 0.55]].map((p) => new THREE.Vector2(p[0], p[1]));
  for (const z of [-0.5, 0.5]) b.add(new THREE.LatheGeometry(prof, 8), { p: [0, 0, z] });
  for (const z of [-0.5, 0.5]) for (const y of [1.6, H - 1.75]) b.cyl(0.325, 0.325, 0.16, 8, { p: [0, y, z] }, true);          // cast collars
  b.box(0.16, H - 2.3, 0.62, { p: [0, H * 0.5, 0] });                                                                                 // the web that carries the scroll
  for (const y of [H - 0.42, 0.5]) { const g = new THREE.SphereGeometry(0.36, 7, 4); b.add(g, { p: [0, y, 0], s: [0.92, y > 1 ? 1.0 : 0.8, 2.25] }); }   // top and bottom headers
  for (const y of [H - 0.5, 0.56]) { const g = new THREE.CylinderGeometry(0.2, 0.2, RIB_PITCH, 5, 1, true); g.rotateZ(Math.PI / 2); b.add(g, { p: [0, y, 0] }); }   // nipples joining the sections
  const g = b.build(); g.deleteAttribute('aH'); g.deleteAttribute('aS');
  return g;
}

// rest temperature of a wall or floor at a place (mirrors the cold terms of the shell shader, for ribbons and overlays)
export function wallRest(x, y, z, base) {
  return base - 0.12 * Math.exp(z / 13) - 0.12 * Math.exp(-(z + 164) / 13) - 0.03 * Math.exp(-(34 - Math.abs(x)) / 9);
}

// The pipe network: every run is a polyline with an arrival (in units of u) at each sample.
function makeNetwork(path) {
  const NS = 640, sx = new Float32Array(NS + 1), sy = new Float32Array(NS + 1), sz = new Float32Array(NS + 1), v = new THREE.Vector3();
  for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, v); sx[i] = v.x; sy[i] = v.y; sz[i] = v.z; }
  const uNear = (x, y, z) => { let best = 1e9, bi = 0; for (let i = 0; i <= NS; i++) { const dx = sx[i] - x, dy = sy[i] - y, dz = sz[i] - z, d = dx * dx + dy * dy * 1.6 + dz * dz; if (d < best) { best = d; bi = i; } } return bi / NS; };
  const LEAD = 30 / path.length, SP = 1 / (26 * 44);
  const runs = [];
  // o: { n:[nx,ny,nz] surface normal (ribbon) | tube: radius, start, follow: lead (u) | undefined, sched: [arrival per node], hw, base, gain }
  function run(pts, o = {}) {
    const samples = [], nodeArr = [];
    let arr = o.start ?? 0, acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.ceil(len / 2.5));
      for (let k = (i === 0 ? 0 : 1); k <= n; k++) {
        const f = k / n, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f;
        if (samples.length) arr += (len / n) * SP;
        if (o.sched) arr = o.sched[i] + (o.sched[i + 1] - o.sched[i]) * f;
        else if (o.follow !== undefined) arr = Math.max(arr, uNear(x, y, z) - o.follow);
        acc += samples.length ? len / n : 0;
        samples.push([x, y, z, arr, i]);
        if (k === 0) nodeArr.push(arr);
      }
      nodeArr.push(arr);
    }
    const r = { pts, samples, nodeArr, end: arr, o,
      // arrival at the sample nearest to a point
      at(x, y, z) { let best = 1e9, a = 0; for (const s of samples) { const d = (s[0] - x) ** 2 + (s[1] - y) ** 2 + (s[2] - z) ** 2; if (d < best) { best = d; a = s[3]; } } return a; } };
    runs.push(r);
    return r;
  }
  return { run, runs, uNear, LEAD, SP };
}

function ribbonGeometry(runs) {
  const pos = [], dir = [], ap = [], sf = [], idx = [];
  const n = new THREE.Vector3(), t = new THREE.Vector3(), d = new THREE.Vector3();
  for (const r of runs) {
    if (!r.o.n) continue;
    const hw = r.o.hw ?? 3.0, base = r.o.base ?? T.SLATE, S = r.samples, P = r.pts;
    n.set(r.o.n[0], r.o.n[1], r.o.n[2]);
    for (let seg = 0; seg < P.length - 1; seg++) {          // one strip per straight, each with its own widening direction
      t.set(P[seg + 1][0] - P[seg][0], P[seg + 1][1] - P[seg][1], P[seg + 1][2] - P[seg][2]);
      if (t.lengthSq() < 1e-8) continue;
      d.crossVectors(n, t.normalize()).normalize();
      let prev = -1;
      for (let i = 0; i < S.length; i++) {
        const s = S[i], mine = s[4] === seg, node = i + 1 < S.length && S[i + 1][4] === seg && s[4] === seg - 1;
        if (!mine && !node) continue;
        const b0 = pos.length / 3, w = wallRest(s[0], s[1], s[2], base);
        for (const side of [-1, 1]) { pos.push(s[0] + n.x * 0.11, s[1] + n.y * 0.11, s[2] + n.z * 0.11); dir.push(d.x, d.y, d.z); ap.push(side, s[3], w, hw); sf.push(r.o.soft ? 1 : 0); }
        if (prev >= 0) idx.push(prev, prev + 1, b0, prev + 1, b0 + 1, b0);
        prev = b0;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(ap, 4));
  g.setAttribute('aSoft', new THREE.Float32BufferAttribute(sf, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

// a seamless warm overlay: a disc (floor) or a panel (wall) of the same kind and rest temperature as what it lies on,
// whose gain falls to nothing at its rim. "Whatever is hot lays a soft halo of warmth into what it touches."
export function addHalo(tb, o) {
  const r = o.r ?? 6, gain = o.gain ?? 0.15;
  if (o.wall) {            // o.wall = [nx, nz] unit normal of the wall; panel w x h centred at p
    const w = o.w ?? 8, h = o.h ?? 10, g = new THREE.PlaneGeometry(w, h, 6, 8), p = o.p;
    tb.add(g, { p: [p[0] + o.wall[0] * 0.07, p[1], p[2] + o.wall[1] * 0.07], r: [0, Math.atan2(o.wall[0], o.wall[1]), 0], t: o.t, k: o.k ?? 0, arr: o.arr ?? -0.1,
      fn: (x, y, z, out) => { const u = ((x - p[0]) * o.wall[1] - (z - p[2]) * o.wall[0]) / (w / 2), v = (y - p[1]) / (h / 2); const e = Math.max(0, 1 - u * u) * Math.max(0, 1 - v) * Math.max(0, 1 + v) * 0.5 * (1.2 - 0.5 * v); out[2] = gain * Math.min(1, e * 1.6); } });
  } else {
    const g = new THREE.RingGeometry(0.01, r, 22, 4); g.rotateX(-Math.PI / 2);
    const p = o.p, sx = o.sx ?? 1, sz = o.sz ?? 1;
    tb.add(g, { p: [p[0], p[1] + 0.06, p[2]], s: [sx, 1, sz], t: o.t, k: o.k ?? 0, arr: o.arr ?? -0.1,
      fn: (x, y, z, out) => { const d = Math.min(1, Math.hypot((x - p[0]) / sx, (z - p[2]) / sz) / r); out[2] = gain * (1 - d) * (1 - d) * (1 + 2 * d) ; } });
  }
}

const FLAME_FRAG = /* glsl */`
varying vec2 vUv; uniform float uOn;
${THERMAL_GLSL}
void main() {
  vec2 p = vUv * 2. - 1.; float r = length(p);
  float pilot = exp(-dot(p - vec2(0., -.38), p - vec2(0., -.38)) / .2) * (.88 + .12 * sin(uTime * 13.) * sin(uTime * 3.1));
  float n = thNoise(vec2(p.x * 3.2, p.y * 2.4 - uTime * 3.4)) + .5 * thNoise(vec2(p.x * 7. + 3., p.y * 5. - uTime * 6.1));
  float fl = 1. - smoothstep(.1, 1.05, (p.y + .95) * .62 + abs(p.x) * .5 - n * .55);
  float flick = .05 * sin(uTime * 23.) + .04 * sin(uTime * 37. + 2.);
  float t = .2 + .3 * uOn + uOn * fl * (.6 + flick);
  t = max(t, .3 + pilot * .62);
  t -= .25 * smoothstep(.8, 1., r);
  gl_FragColor = vec4(thRamp(t + thGrain()), 1.);
}`;

export async function buildHero(ctx, opts = {}) {
  const shared = opts.shared || thermalShared();
  const path = opts.path || makePath(PATH_POINTS);
  const object = new THREE.Group(); object.name = 'still-warm-heating';
  const mat = opts.material || thermalMaterial(shared);
  const keys = { burner: -0.006, leave: 0.082 };            // lit as we come in: through the portal the fire door is on its pilot, gold a second later
  await ctx.yield();
  const net = makeNetwork(path), run = net.run;
  await ctx.yield();
  const tb = makeTB();

  // ------------------------------------------------------------------ the boiler (local: front = +z)
  const BP = HOUSE.BOILER, BYAW = HOUSE.BYAW;
  const BM = new THREE.Matrix4().compose(new THREE.Vector3(BP[0], BP[1], BP[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, BYAW, 0)), new THREE.Vector3(1, 1, 1));
  const bw = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(BM);
  tb.setBase(BM);
  const IRON = KIND.IRON, tB = keys.burner;
  tb.box(13, 1.2, 10.8, { p: [0, 0.6, 0], t: T.CHAR, k: KIND.BRICK });
  // hot cast iron: the sections grade from gold at the fire end to ash at the rear, each a little hotter at the height of
  // the firebox and cooler at its foot and over its rounded crown; the joints between them show the gold of the waterway
  const sm = THREE.MathUtils.smoothstep, cB = Math.cos(BYAW), sB = Math.sin(BYAW);
  const secT = (f) => 0.872 - 0.3 * Math.min(1, Math.max(0, f));
  const hgtT = (ly) => 0.03 * Math.exp(-(((ly - 5.5) / 3.5) ** 2)) - 0.2 * sm(ly, 11.8, 15.3) - 0.05 * (1 - sm(ly, 1.2, 3.2));
  const lz = (x, z) => (x - BP[0]) * sB + (z - BP[2]) * cB;
  const coreFn = (x, y, z, out) => { const f = (4.2 - lz(x, z)) / 8.4; out[1] = tB + 0.004 + Math.max(0, f) * 0.084; out[2] = 0.6 - 0.09 * Math.max(0, f) - 0.05 * sm(y - BP[1], 11, 15); };
  tb.add(new THREE.BoxGeometry(11.46, 11.4, 9.0, 1, 1, 9), { p: [0, 7.0, 0], t: 0.3, k: IRON, fn: coreFn });      // (nearly flush: the joints show as gold lines from any angle)
  { const cc = new THREE.CylinderGeometry(5.73, 5.73, 9.0, 14, 9, false, 0, Math.PI); cc.rotateX(Math.PI / 2); cc.rotateZ(Math.PI / 2); tb.add(cc, { p: [0, 13.2, 0], s: [1, 0.35, 1], t: 0.3, k: IRON, fn: coreFn }); }
  for (let i = 0; i < 9; i++) {
    const z = 4.2 - i * 1.05, arr = tB + 0.008 + i * 0.0105, jit = ((i * 3) % 4) * 0.008 - 0.012, base = secT(i / 8) + jit - 0.3, gain = base;
    // (the front casting keeps its own tone, bone white round the gold fire door: only the flanks and the crown grade to gold)
    const fn = (x, y, zz, out, n) => { const fr = i === 0 ? sm(n.x * sB + n.z * cB, 0.3, 0.7) : 0; out[2] = (base + hgtT(y - BP[1])) * (1 - fr) + 0.31 * fr; };
    tb.add(new THREE.BoxGeometry(11.6, 12, 0.86, 1, 6, 1), { p: [0, 7.2, z], t: 0.3, k: IRON, arr, fn });
    const crown = new THREE.CylinderGeometry(5.8, 5.8, 0.86, 18, 1, false, 0, Math.PI); crown.rotateX(Math.PI / 2); crown.rotateZ(Math.PI / 2);
    tb.add(crown, { p: [0, 13.2, z], s: [1, 0.36, 1], t: 0.3, k: IRON, arr, fn });
    tb.box(11.9, 0.3, 0.9, { p: [0, 1.5, z], t: 0.27, k: IRON, arr, gain: gain * 0.5 });
    for (const sx of [-1, 1]) {
      // the flank of a section is a cast face, not a slab: a convex web, three raised lozenge panels, the lugs the tie rods pass
      // through with a nut either side, and a bolted hand-hole cover low on every third section
      const web = new THREE.CylinderGeometry(0.43, 0.43, 11.3, 7, 6, true, sx > 0 ? 0 : Math.PI, Math.PI);
      tb.add(web, { p: [sx * 5.8, 7.35, z], s: [0.5, 1, 1], t: 0.3, k: IRON, arr, fn });
      for (const [y, hh] of [[7.4, 1.8], [12.3, 0.8], [3.0, 0.72]]) {            // a moulded frame round each panel
        const pf = { t: 0.3, k: IRON, arr: arr + 0.003, fn: (x, yy, zz, out) => { out[2] = base + hgtT(yy - BP[1]) - 0.06; } };
        for (const dz of [-0.25, 0.25]) tb.box(0.16, hh * 2, 0.1, { p: [sx * 6.0, y, z + dz], ...pf });
        for (const dy of [-hh, hh]) tb.box(0.16, 0.1, 0.6, { p: [sx * 6.0, y + dy, z], ...pf });
      }
      for (const y of [4.6, 10.2]) {
        tb.box(0.7, 0.95, 0.5, { p: [sx * 6.12, y, z], t: 0.28, k: IRON, arr: arr + 0.004, gain: gain * 0.82 });
        for (const dz of [-0.33, 0.33]) { const nut = new THREE.CylinderGeometry(0.33, 0.33, 0.16, 6); nut.rotateX(Math.PI / 2); tb.add(nut, { p: [sx * 6.42, y, z + dz], t: 0.22, k: IRON, arr: arr + 0.006, gain: gain * 0.55 }); }
      }
      if (i % 3 === 1) {
        const cov = new THREE.CylinderGeometry(0.62, 0.7, 0.2, 12); cov.rotateZ(Math.PI / 2); tb.add(cov, { p: [sx * 6.1, 2.9, z], s: [1, 1, 0.6], t: 0.3, k: IRON, arr: arr + 0.004, gain: gain * 0.9 });
        for (let j = 0; j < 4; j++) { const an = j * 1.5708 + 0.785; tb.sph(0.1, { p: [sx * 6.22, 2.9 + Math.sin(an) * 0.5, z + Math.cos(an) * 0.3], t: 0.2, k: IRON, arr: arr + 0.006, gain: gain * 0.5 }, 5, 3); }
      }
    }
    await ctx.yield();
  }
  for (const sx of [-1, 1]) for (const y of [4.6, 10.2]) {                                            // tie rods through the lugs
    const rod = new THREE.CylinderGeometry(0.13, 0.13, 10.6, 6, 8); rod.rotateX(Math.PI / 2);
    tb.add(rod, { p: [sx * 6.42, y, 0], t: 0.24, k: KIND.METAL, fn: (x, yy, zz, out) => { const f = (4.2 - lz(x, zz)) / 8.4; out[1] = tB + 0.02 + Math.max(0, f) * 0.09; out[2] = 0.34 - 0.2 * Math.max(0, f); } });
    for (const z of [5.2, -5.2]) { const nut = new THREE.CylinderGeometry(0.36, 0.36, 0.5, 6); nut.rotateX(Math.PI / 2); tb.add(nut, { p: [sx * 6.42, y, z], t: 0.22, k: IRON, arr: tB + 0.02, gain: z > 0 ? 0.3 : 0.12 }); }
  }
  await ctx.yield();
  // front plate: fire door, ash door, plate, rivets
  const zf = 4.63, hot = { t: 0.32, k: IRON, arr: tB + 0.003, gain: 0.57 };
  tb.box(5.6, 4.6, 0.3, { p: [0, 5.3, zf + 0.15], ...hot, gain: 0.5 });
  tb.box(4.6, 3.6, 0.3, { p: [0, 5.3, zf + 0.4], ...hot });
  const ring = new THREE.TorusGeometry(1.16, 0.16, 6, 22); tb.add(ring, { p: [0, 5.5, zf + 0.6], ...hot, gain: 0.4 });
  for (const y of [4.2, 6.5]) { tb.cyl(0.24, 0.24, 0.95, 7, { p: [-2.45, y, zf + 0.5], t: 0.24, k: IRON, arr: tB + 0.01, gain: 0.4 }); tb.box(1.0, 0.3, 0.14, { p: [-1.95, y, zf + 0.58], ...hot, gain: 0.45 }); }
  tb.box(1.5, 0.3, 0.3, { p: [1.8, 5.3, zf + 0.7], t: 0.2, k: KIND.METAL, arr: tB + 0.012, gain: 0.3 });
  tb.sph(0.3, { p: [2.6, 5.3, zf + 0.75], t: 0.2, k: KIND.METAL, arr: tB + 0.014, gain: 0.25 }, 8, 6);
  tb.box(4.0, 1.9, 0.26, { p: [0, 2.35, zf + 0.2], ...hot, gain: 0.3 });
  for (let i = 0; i < 4; i++) tb.box(0.5, 1.2, 0.12, { p: [-1.2 + i * 0.8, 2.35, zf + 0.36], t: 0.3, k: IRON, arr: tB + 0.002, gain: 0.62 });   // air slots glow
  { const pl = new THREE.CylinderGeometry(1.5, 1.5, 0.14, 20); pl.rotateX(Math.PI / 2); tb.add(pl, { p: [0, 9.6, zf + 0.1], s: [1.25, 0.6, 1], t: 0.34, k: IRON, arr: tB + 0.02, gain: 0.3 }); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; tb.sph(0.13, { p: [Math.cos(a) * 2.1, 9.6 + Math.sin(a) * 1.05, zf + 0.12], t: 0.26, k: IRON, arr: tB + 0.02, gain: 0.3 }, 6, 4); }
  for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) tb.sph(0.16, { p: [sx * 5.3, 2.2 + i * 1.7, zf + 0.06], t: 0.26, k: IRON, arr: tB + 0.012, gain: 0.34 }, 6, 4);
  // the front casting's own relief: a raised border, a belt across it over the fire door, two stiffening webs up to the crown
  { const rel = { t: 0.25, k: IRON, arr: tB + 0.01, gain: 0.3 };
    for (const sx of [-1, 1]) { tb.box(0.5, 12.2, 0.22, { p: [sx * 5.55, 7.3, zf + 0.06], ...rel }); tb.box(0.3, 4.6, 0.2, { p: [sx * 3.3, 11.9, zf + 0.05], r: [0, 0, sx * 0.12], ...rel }); }
    tb.box(11.4, 0.45, 0.22, { p: [0, 7.95, zf + 0.06], ...rel }); tb.box(11.4, 0.5, 0.24, { p: [0, 1.75, zf + 0.06], ...rel });
    const arc = new THREE.TorusGeometry(5.6, 0.2, 5, 18, Math.PI); tb.add(arc, { p: [0, 13.2, zf + 0.02], s: [1, 0.36, 1], ...rel }); }
  await ctx.yield();
  // gauge glass, thermometer, drain cock, safety valve, flue
  tb.cyl(0.15, 0.15, 3.2, 7, { p: [4.3, 10.4, zf + 0.5], t: 0.3, k: KIND.METAL, arr: tB + 0.03, gain: 0.42 });
  for (const y of [8.8, 12.0]) { const f = new THREE.CylinderGeometry(0.22, 0.22, 0.6, 7); f.rotateX(Math.PI / 2); tb.add(f, { p: [4.3, y, zf + 0.26], t: 0.13, k: KIND.METAL }); tb.sph(0.27, { p: [4.3, y, zf + 0.52], t: 0.13, k: KIND.METAL }, 7, 5); }
  { const d = new THREE.CylinderGeometry(0.8, 0.8, 0.22, 16); d.rotateX(Math.PI / 2); tb.add(d, { p: [-4.0, 10.6, zf + 0.12], t: 0.14, k: KIND.METAL }); tb.box(0.08, 0.6, 0.06, { p: [-4.0, 10.8, zf + 0.26], r: [0, 0, 0.6], t: 0.4, k: KIND.METAL }); }
  { const st = new THREE.CylinderGeometry(0.22, 0.22, 1.0, 7); st.rotateX(Math.PI / 2); tb.add(st, { p: [-4.6, 2.0, zf + 0.5], t: 0.2, k: KIND.METAL, arr: tB + 0.03, gain: 0.3 });
    tb.sph(0.34, { p: [-4.6, 2.0, zf + 1.0], t: 0.18, k: KIND.METAL, arr: tB + 0.03, gain: 0.3 }, 8, 6); tb.box(1.0, 0.12, 0.14, { p: [-4.6, 2.45, zf + 1.0], t: 0.16, k: KIND.METAL });
    tb.cyl(0.12, 0.1, 0.45, 6, { p: [-4.6, 1.65, zf + 1.05], t: 0.2, k: KIND.METAL, arr: tB + 0.03, gain: 0.35 }); }
  tb.cyl(0.3, 0.4, 1.3, 7, { p: [3.4, 14.6, 2.6], t: 0.16, k: KIND.METAL }); tb.box(1.6, 0.14, 0.14, { p: [3.9, 15.1, 2.6], r: [0, 0, -0.25], t: 0.16, k: KIND.METAL });
  tb.cyl(1.25, 1.25, 5.6, 14, { p: [2.6, 16.4, -2.4], t: 0.3, k: IRON, arr: tB + 0.02, gain: 0.44 });
  tb.cyl(1.5, 1.5, 0.5, 14, { p: [2.6, 14.4, -2.4], t: 0.26, k: IRON, arr: tB + 0.02, gain: 0.4 });
  tb.cyl(0.62, 0.62, 2.2, 10, { p: [-1.6, 15.0, -3], t: 0.3, k: KIND.METAL, arr: keys.leave - 0.012, gain: 0.56 });
  tb.setBase(null);
  await ctx.yield();

  // mica window: the pilot, then the burner; the plate round it is warm even on the pilot (a pale patch with one gold point)
  const FN = [Math.sin(BYAW), Math.cos(BYAW)];
  { const c = bw(0, 5.3, zf + 0.5), g = new THREE.PlaneGeometry(4.5, 3.5, 8, 6);
    tb.add(g, { p: [c.x + FN[0] * 0.07, c.y, c.z + FN[1] * 0.07], r: [0, BYAW, 0], k: IRON, arr: tB + 0.003,
      fn: (x, y, z, out) => { const du = ((x - c.x) * FN[1] - (z - c.z) * FN[0]) / 2.25, dv = (y - c.y - 0.2) / 1.75, e = Math.exp(-(du * du + dv * dv) * 2.2); out[0] = 0.32 + 0.33 * e; out[2] = 0.57 - 0.3 * e; } }); }
  const flameMat = new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime, uFront: shared.uFront, uShift: shared.uShift, uSun: shared.uSun, uOn: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: FLAME_FRAG });
  const flame = new THREE.Mesh(new THREE.CircleGeometry(1.08, 24), flameMat);
  flame.position.copy(bw(0, 5.5, zf + 0.74)); flame.rotation.y = BYAW; object.add(flame);
  await ctx.yield();

  // ------------------------------------------------------------------ the cylinder: already warm, pale at the top
  const CP = HOUSE.CYL, cy0 = CP[1] + 1.0;
  const night = opts.look === 2;            // on the night the power came back only the cylinder's cap is still pale
  const cylFn = (x, y, z, out) => { const h = (y - cy0) / 15; out[0] = night ? 0.4 + 0.3 * THREE.MathUtils.smoothstep(h, 0.66, 0.97) : 0.4 + 0.3 * THREE.MathUtils.smoothstep(h, 0.3, 0.92); out[1] = tB + 0.03 + (1 - h) * 0.55; out[2] = night ? 0.06 : 0.035; };
  tb.add(new THREE.CylinderGeometry(3.5, 3.5, 11.6, 22, 8), { p: [CP[0], cy0 + 7.4, CP[2]], k: KIND.CLOTH, fn: cylFn });
  tb.add(new THREE.SphereGeometry(3.5, 22, 6, 0, Math.PI * 2, 0, Math.PI / 2), { p: [CP[0], cy0 + 13.2, CP[2]], s: [1, 0.52, 1], k: KIND.CLOTH, fn: cylFn });
  tb.add(new THREE.SphereGeometry(3.5, 22, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), { p: [CP[0], cy0 + 1.6, CP[2]], s: [1, 0.45, 1], k: KIND.CLOTH, fn: cylFn });
  for (const y of [3.6, 7.4, 11.2]) { const s = new THREE.TorusGeometry(3.56, 0.12, 5, 28); s.rotateX(Math.PI / 2); tb.add(s, { p: [CP[0], cy0 + y, CP[2]], t: 0.2, k: KIND.METAL }); }
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; tb.box(0.7, 1.4, 0.7, { p: [CP[0] + Math.cos(a) * 2.4, CP[1] + 0.7, CP[2] + Math.sin(a) * 2.4], t: T.CHAR, k: KIND.BRICK }); }
  tb.cyl(0.4, 0.4, 3.2, 8, { p: [CP[0], cy0 + 16, CP[2]], t: 0.5, k: KIND.METAL, arr: tB + 0.05, gain: 0.25 });
  await ctx.yield();
  { const dfn = (x, y, z, out) => { out[1] = -0.3 + z * 0.0006; };
    // the hot draw-off: from the cylinder's cap under the joists toward the street, straight over the way in (one gold line)
    const DX = -3.2;
    tb.tube([[CP[0], cy0 + 15.2, CP[2]], [CP[0] - 0.7, -5.6, CP[2] + 0.5], [DX, -5.6, CP[2] + 5], [DX, -5.6, -44], [DX, -5.6, -22], [DX - 0.4, -3.2, -19.5]], 0.34, { t: 0.3, k: KIND.METAL, gain: 0.53, steps: 44, tension: 0.12, fn: dfn });
    for (let z = -24; z > CP[2] + 6; z -= 5.5) {
      tb.box(0.1, 0.75, 0.1, { p: [DX - 0.46, -5.3, z], t: 0.14, k: KIND.METAL }); tb.box(0.1, 0.75, 0.1, { p: [DX + 0.46, -5.3, z], t: 0.14, k: KIND.METAL });
      const fl = new THREE.CylinderGeometry(0.47, 0.47, 0.22, 10); fl.rotateX(Math.PI / 2); tb.add(fl, { p: [DX, -5.6, z - 2.7], t: 0.3, k: KIND.METAL, arr: -0.3, gain: 0.53 });
    } }
  for (const [ly, arr, gain] of [[9.5, tB + 0.035, 0.5], [4.0, tB + 0.06, 0.3]]) {          // flow and return between the boiler's flank and the cylinder
    const a = bw(6.2, ly, 1.6), b = bw(8.4, ly, 1.9), dx = CP[0] - b.x, dz = CP[2] - b.z, dl = Math.hypot(dx, dz), ex = CP[0] - (dx / dl) * 3.4, ez = CP[2] - (dz / dl) * 3.4;
    tb.tube([[a.x, a.y, a.z], [b.x, b.y, b.z], [(b.x + ex) / 2, a.y, (b.z + ez) / 2], [ex, a.y, ez]], 0.34, { t: 0.34, k: KIND.METAL, arr, gain });
    const fl = new THREE.CylinderGeometry(0.55, 0.55, 0.3, 10); fl.rotateZ(Math.PI / 2); tb.add(fl, { p: [b.x, b.y, b.z], r: [0, BYAW, 0], t: 0.22, k: IRON });
  }
  await ctx.yield();

  // ------------------------------------------------------------------ the network
  const LEAD = net.LEAD, UP = [0, 1, 0], COLDW0 = 0.14, LN = HOUSE.LANE, W_ = HOUSE.WELL;
  const _cm = new THREE.Matrix4(), _cq = new THREE.Quaternion(), _cd = new THREE.Vector3(), _cy = new THREE.Vector3(0, 1, 0), _cp = new THREE.Vector3(), _c1 = new THREE.Vector3(1, 1, 1);
  // an open main: the tube, a bolted flange every few metres of each straight, and strap hangers from the joists
  const tubeRun = (r, radius, o = {}) => {
    tb.tube(r.pts, radius, { t: 0.3, k: KIND.METAL, gain: 0.56, steps: Math.max(6, Math.round(r.samples.length * 1.2)), ...o, fn: (x, y, z, out) => { out[1] = r.at(x, y, z); } });
    for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i], b = r.pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (len < 5) continue;
      _cd.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).multiplyScalar(1 / len); _cq.setFromUnitVectors(_cy, _cd);
      const n = Math.max(1, Math.round(len / 4.6)), level = Math.abs(_cd.y) < 0.2, dx = _cd.x, dz = _cd.z;
      for (let k = 0; k < n; k++) {
        const f = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f, arr = r.at(x, y, z);
        tb.add(new THREE.CylinderGeometry(radius * 1.55, radius * 1.55, 0.34, 10), { m: _cm.compose(_cp.set(x, y, z), _cq, _c1), t: 0.3, k: KIND.METAL, arr, gain: o.gain ?? 0.56 });
        for (let j = 0; j < 4; j++) {            // bolt heads
          const an = j * 1.5708 + 0.785; _cp.set(Math.cos(an) * radius * 1.25, 0, Math.sin(an) * radius * 1.25).applyQuaternion(_cq); _cp.x += x; _cp.y += y; _cp.z += z;
          tb.add(new THREE.CylinderGeometry(0.11, 0.11, 0.52, 5), { m: _cm.compose(_cp, _cq, _c1), t: 0.18, k: KIND.METAL, arr, gain: 0.3 });
        }
        if (level && (k & 1) === 0) {            // a strap hanger a metre along from the flange
          const top = -5.0, hh = top - (y - radius), hx = x + dx * 1.1, hz = z + dz * 1.1;
          for (const sd of [-1, 1]) tb.box(0.1, hh, 0.1, { p: [hx - dz * sd * (radius + 0.08), top - hh / 2, hz + dx * sd * (radius + 0.08)], t: 0.13, k: KIND.METAL });
          tb.box(Math.abs(dz) * (radius * 2 + 0.3) + 0.1, 0.1, Math.abs(dx) * (radius * 2 + 0.3) + 0.1, { p: [hx, y - radius - 0.05, hz], t: 0.13, k: KIND.METAL });
        }
      }
    }
  };
  const m0 = bw(-1.6, 16.0, -3);
  // the main: up from the boiler, across to the lane, along it under the joists to the well (the way the camera is going)
  const m1 = run([[m0.x, m0.y, m0.z], [m0.x - 0.6, -5.9, m0.z - 0.6], [LN, -5.9, -95], [LN, -5.9, -104.5], [LN, -5.9, -116]], { start: keys.leave, follow: LEAD * 1.6 });
  await ctx.yield();
  tubeRun(m1, 0.5);
  await ctx.yield();
  const w1 = run([[LN, -5.6, -109], [-30, -5.6, -109], [-33.8, -6.3, -111]], { start: m1.at(LN, -5.9, -109) });           // the first fork: a branch to the west wall riser
  tubeRun(w1, 0.4, { gain: 0.5 });
  await ctx.yield();
  const w2 = run([[LN, -5.6, -100], [-2, -5.6, -100], [-1.4, -3.6, -100.6]], { start: m1.at(LN, -5.9, -100) });               // and one east, to rise under the kitchen
  tubeRun(w2, 0.36, { gain: 0.46 });
  await ctx.yield();
  // a cold return along the west wall above the jar shelves; it drops down the wall and crosses the lane on brick
  // sleepers to the boiler's flank: the mouse's road (it runs the pipe to the plinth and goes in under the boiler)
  const MPY = -6.3, MPX = -32.5;
  tb.tube([[MPX, MPY, -10], [MPX, MPY, -40], [MPX, MPY, -67], [-33.4, MPY - 0.8, -68.6]], 0.42, { t: 0.25, k: KIND.METAL, steps: 20 });
  for (let z = -14; z > -67; z -= 8) tb.box(1.3, 0.14, 0.5, { p: [-33.3, MPY - 0.5, z], t: 0.2, k: KIND.METAL });
  const RET = bw(-6.55, 1.6, 2.2), MQ = [[-33.4, -20.4, -68.6], [-30, -20.4, -71.5], [-17.4, -20.4, -81.0], [RET.x, RET.y, RET.z]];
  tb.cyl(0.42, 0.42, 13.6, 9, { p: [-33.4, -13.7, -68.6], t: 0.25, k: KIND.METAL });
  tb.tube(MQ, 0.42, { t: 0.25, k: KIND.METAL, steps: 16, tension: 0.02 });
  for (const yy of [-9.5, -16]) tb.box(0.9, 0.16, 1.3, { p: [-33.55, yy, -68.6], t: 0.18, k: KIND.METAL });
  for (let i = 0; i < 4; i++) { const f = 0.08 + i * 0.28, x = MQ[1][0] + (MQ[2][0] - MQ[1][0]) * f, z = MQ[1][2] + (MQ[2][2] - MQ[1][2]) * f;
    tb.box(1.5, 1.2, 0.9, { p: [x, -21.4, z], r: [0, 0.65, 0], t: T.CHAR, k: KIND.BRICK }); }
  { const fl = new THREE.CylinderGeometry(0.66, 0.66, 0.3, 10); fl.rotateZ(Math.PI / 2); tb.add(fl, { p: [RET.x - 0.25, RET.y, RET.z - 0.08], r: [0, BYAW, 0], t: 0.22, k: IRON }); }
  await ctx.yield();
  // round the well, in the cut edge of the floor
  const e1 = run([[LN, -1.5, -116.1], [24, -1.5, -116.1]], { n: [0, 0, -1], hw: 1.45, start: m1.end, base: T.DIM, soft: true });
  const e2 = run([[LN, -1.5, -116.1], [-23.9, -1.5, -116.1]], { n: [0, 0, -1], hw: 1.45, start: m1.end, base: T.DIM, soft: true });
  const wcut = run([[-23.9, -1.5, -116], [-23.9, -1.5, -163.9]], { n: [1, 0, 0], hw: 1.45, start: e2.end, base: T.DIM, soft: true });
  const ecut = run([[23.9, -1.5, -116], [23.9, -1.5, -163.9]], { n: [-1, 0, 0], hw: 1.45, start: e1.end, base: T.DIM, soft: true });
  const rearW = run([[-24.6, 0.2, -163.9], [-24.6, 19, -163.9], [24.6, 19, -163.9], [24.6, 1.6, -163.9], [33.9, 1.6, -163.9]], { n: [0, 0, 1], start: wcut.end, base: COLDW0 });
  const rearE = run([[-24.6, 1.6, -163.9], [-26.2, 1.6, -163.9]], { n: [0, 0, 1], start: wcut.end, base: COLDW0, hw: 2 });
  // from the rear wall's corner the line turns onto the party wall and runs in its skirting behind the settle to a radiator
  // under the picture, and a riser climbs from there to the floor above: its head goes up the wall as we rise through the well
  const uER = Math.max(rearW.end + 0.012, 0.275);
  const eSkirt = run([[33.9, 1.6, -163.9], [33.9, 1.6, -125.2]], { n: [-1, 0, 0], sched: [rearW.end, uER], hw: 2.4 });
  const eRise = run([[33.9, 1.6, -126.9], [33.9, 20.95, -126.9]], { n: [-1, 0, 0], sched: [uER + 0.02, uER + 0.072], hw: 3.3 });
  // the hall: one line in the floor beside the path, one in the east skirting
  const FL = T.SLATE - 0.07;
  const uT0 = 0.5, uH0 = Math.max(e1.at(8, -1.5, -116.1), 0.36);
  const hall = run([[8, 0.02, -116], [8, 0.02, -60], [8, 0.02, -12], [4, 0.02, -5], [4, 0.02, -0.5]], { n: UP, sched: [uH0, 0.45, uT0 - 0.008, uT0 - 0.003, uT0], base: FL });
  const esk = run([[24, 0.02, -116], [33.9, 0.02, -116]], { n: UP, start: e1.end, base: FL, hw: 2 });
  const esk2 = run([[33.9, 1.7, -116], [33.9, 1.7, -76]], { n: [-1, 0, 0], start: esk.end, follow: LEAD * 1.7, hw: 2.4 });
  const estrip = run([[29.5, 0.02, -116], [29.5, 0.02, -157.5]], { n: UP, start: esk.at(29.5, 0.02, -116), base: FL });        // down the east side of the well, past the settle
  const kit = run([[8, 0.02, -102], [-31.3, 0.02, -102]], { n: UP, start: hall.at(8, 0, -102), base: FL });
  const hrad = run([[8, 0.02, -69], [2.9, 0.02, -69]], { n: UP, start: hall.at(8, 0, -69), base: FL });
  const parl = run([[8, 0.02, -81], [-31.3, 0.02, -81]], { n: UP, start: hall.at(8, 0, -81), base: FL });
  await ctx.yield();
  // the tree on the street wall: a trunk that rises behind the second flight and forks into branches of unequal length.
  // Arrivals are scheduled so that at u 0.62 the corner-landing radiator is full, the one under the stair window half
  // full and the one on the top strip just starting, with the head of the front still running along the crown.
  const SW = [0, 0, -1], COLDW = 0.14, TX = 4, wl = (pts) => pts.map((p) => [p[0], p[1], -0.1]);
  const trunk = run(wl([[TX, 0.1], [TX, 33], [TX, 40], [TX, 64]]), { n: SW, sched: [uT0, uT0 + 0.022, uT0 + 0.027, uT0 + 0.045], base: COLDW, hw: 3.4 });
  const gW = run(wl([[TX, 1.7], [-33.9, 1.7]]), { n: SW, start: uT0 + 0.002, hw: 2.4, base: COLDW });
  const gW2 = run([[-33.9, 1.7, -0.1], [-33.9, 1.7, -27]], { n: [1, 0, 0], start: gW.end, hw: 2.4 });
  const gE = run([[TX, 0.02, -1.6], [23.6, 0.02, -1.6]], { n: UP, start: uT0, hw: 2, base: FL });
  const bFirst = run(wl([[TX, 33], [19.4, 33], [22.9, 29.5], [22.9, 25.0]]), { n: SW, start: trunk.nodeArr[1], base: COLDW });
  const bStair = run(wl([[TX, 40], [11.5, 47.5], [15.0, 47.5]]), { n: SW, sched: [trunk.nodeArr[2], 0.588, 0.596], base: COLDW });
  const bStairB = run(wl([[TX, 46], [1.1, 48.9], [-1.9, 48.9]]), { n: SW, sched: [trunk.at(TX, 46, -0.1), 0.604, 0.611], base: COLDW });
  const uTop = trunk.end;
  const crownW = run(wl([[TX, 64], [-2, 70], [-22.6, 70], [-33.9, 70]]), { n: SW, sched: [uTop, uTop + 0.006, 0.6, 0.612], base: COLDW });
  const dropW = run(wl([[-22.6, 70], [-22.6, 52.5], [-23.4, 49.2]]), { n: SW, sched: [0.6, 0.609, 0.611], base: COLDW });
  const crownE = run(wl([[TX, 64], [10, 70], [33.9, 70]]), { n: SW, sched: [uTop, uTop + 0.006, 0.625], base: COLDW });
  const sideE = run([[33.9, 70, -0.1], [33.9, 70, -59.9]], { n: [-1, 0, 0], sched: [0.625, 0.655], base: T.SLATE - 0.08 });
  const sideW = run([[-33.9, 70, -0.1], [-33.9, 70, -58]], { n: [1, 0, 0], sched: [0.612, 0.67], base: T.SLATE - 0.08 });
  const limb = run(wl([[TX, 14], [-0.5, 18.5], [-0.5, 24], [-16, 39.5]]), { n: SW, start: trunk.at(TX, 14, 0), base: COLDW });           // a limb that climbs under the flight toward the back rooms
  // the east crown turns the corner onto the wall over the hall, drops between the pictures and runs to the gallery:
  // its head crosses that wall as we come round onto the landing
  const backW = run([[33.9, 70, -59.88], [13.5, 70, -59.88], [13.5, 47.2, -59.88], [0.6, 47.2, -59.88]], { n: [0, 0, 1], sched: [0.655, 0.676, 0.699, 0.712], base: T.DIM, hw: 2.3 });
  await ctx.yield();
  // the top landing: along the strip, across to the lane, back to the window (the front overtakes the camera on the turn)
  const uL0 = 0.657;
  const land = run([[-30, 48.02, -2], [-30, 48.02, -57.5], [-7.6, 48.02, -64], [-7.6, 48.02, -150], [-14, 48.02, -160.2]], { n: UP, sched: [0.612, 0.648, uL0, 0.736, 0.74], base: FL });
  const t2 = run([[-30, 48.02, -22], [-31.5, 48.02, -22]], { n: UP, start: land.at(-30, 48, -22), hw: 2 });
  const bed2R = run([[-7.6, 48.02, -66], [-31.3, 48.02, -66]], { n: UP, start: land.at(-7.6, 48, -66), base: FL });
  const bedR = run([[-7.6, 48.02, -87], [-31.3, 48.02, -87]], { n: UP, start: land.at(-7.6, 48, -87), base: FL });
  const bathR = run([[-7.6, 48.02, -114], [-31.3, 48.02, -114]], { n: UP, start: land.at(-7.6, 48, -114), base: FL });
  const gR = run([[-7.6, 48.02, -68], [-2.9, 48.02, -68]], { n: UP, start: land.at(-7.6, 48, -68), base: FL });
  const g2R = run([[-7.6, 48.02, -146], [-2.9, 48.02, -146]], { n: UP, start: land.at(-7.6, 48, -146), base: FL });
  // the landing's east skirting: from the gallery radiator the line runs the foot of the wall behind the chest and the
  // bookcase, dips under the closed door's threshold and goes on behind the linen press to the window end
  const lsk = run([[-0.32, 49.0, -61], [-0.32, 49.0, -110.6]], { n: [-1, 0, 0], sched: [gR.end, 0.775], hw: 2.6, base: 0.3 });
  const lskD = run([[-1.0, 48.02, -110.6], [-1.0, 48.02, -123.4]], { n: UP, sched: [0.775, 0.781], hw: 1.7, base: FL });
  const lsk2 = run([[-0.32, 49.0, -123.4], [-0.32, 49.0, -163.6]], { n: [-1, 0, 0], sched: [0.781, 0.815], hw: 2.6, base: 0.3 });
  keys.tree = trunk.nodeArr[0]; keys.treeTop = trunk.end; keys.landing = uL0; keys.window = 0.74;
  await ctx.yield();

  // ------------------------------------------------------------------ radiators (twenty-two)
  // pos = centre of the foot, axis = the run of ribs (from the feed end), normal = out of the wall
  const R = [];
  const rad = (id, pos, axis, normal, n, arrive, o = {}) => {
    const step = o.step ?? 0.0015, fill = o.fill ?? 0.045, w = n * RIB_PITCH;
    R.push({ eR: o.eR ?? (id === 'window' ? 9.5 : 7.5), eI: o.eI ?? (id === 'window' ? 1.15 : 1.25), plume: o.plume ?? null, id, pos: new THREE.Vector3(...pos), axis: new THREE.Vector3(...axis), normal: new THREE.Vector3(...normal), n, width: w, height: RIB_H, arrive, step, fill, hung: !!o.hung,
      full: arrive + (n - 1) * step + fill, top: new THREE.Vector3(pos[0], pos[1] + RIB_H, pos[2]), rest: o.rest ?? 0.24 });
  };
  rad('rearW', [-29.2, 0, -162.8], [1, 0, 0], [0, 0, 1], 9, rearE.end);
  // (the one by the settle: eighteen ribs under the picture, filling one after another from the riser's end as we come up
  // through the well, a waterline that crosses it from end to end; it throws the pool that side of the house is composed round)
  rad('rearE', [32.8, 0, -122.6], [0, 0, 1], [-1, 0, 0], 18, uER + 0.002, { fill: 0.05, step: 0.0027, eR: 11.5, eI: 1.9, plume: { R: 11.5, I: 1.85, h0: 11, h1: 11, off: 3, half: 5.6 } });
  rad('east', [32.8, 0, -72], [0, 0, -1], [-1, 0, 0], 14, esk2.end);
  rad('kitchen', [-32.8, 0, -102], [0, 0, 1], [1, 0, 0], 14, kit.end);
  rad('hall', [1.25, 0, -69], [0, 0, 1], [1, 0, 0], 14, 0.452, { fill: 0.085 });
  rad('parlour', [-32.8, 0, -81], [0, 0, 1], [1, 0, 0], 10, parl.end);
  rad('street2', [-8, 0, -1.25], [1, 0, 0], [0, 0, -1], 12, gW.at(-4, 1.7, 0));
  rad('street1', [-24, 0, -1.25], [1, 0, 0], [0, 0, -1], 12, gW.at(-20, 1.7, 0));
  rad('doorE', [28.4, 0, -1.25], [1, 0, 0], [0, 0, -1], 10, gE.end);
  rad('stairW', [-32.8, 0, -31], [0, 0, 1], [1, 0, 0], 14, gW2.end);
  rad('first', [27.6, 24, -1.25], [1, 0, 0], [0, 0, -1], 12, bFirst.end, { fill: 0.026 });
  rad('first2', [32.8, 24, -5.2], [0, 0, 1], [-1, 0, 0], 7, bFirst.end + 0.012);
  rad('stairA', [19, 47.2, -1.25], [1, 0, 0], [0, 0, -1], 10, bStair.end, { hung: true });
  rad('stairB', [-6, 48.4, -1.25], [-1, 0, 0], [0, 0, -1], 10, bStairB.end, { hung: true });
  rad('top1', [-28, 48, -1.25], [-1, 0, 0], [0, 0, -1], 12, dropW.end, { fill: 0.05 });
  rad('top2', [-32.8, 48, -22], [0, 0, 1], [1, 0, 0], 12, t2.end);
  rad('bed2', [-32.8, 48, -65.9], [0, 0, 1], [1, 0, 0], 7, bed2R.end);
  rad('bed', [-32.8, 48, -87], [0, 0, 1], [1, 0, 0], 7, bedR.end);
  rad('bath', [-32.8, 48, -114], [0, 0, 1], [1, 0, 0], 9, bathR.end);
  rad('gallery', [-1.25, 48, -68], [0, 0, 1], [-1, 0, 0], 12, gR.end, { eR: 9.5, eI: 1.5, plume: { R: 8.5, I: 1.35, h0: 6.5, h1: 15, off: 2.4, half: 0 } });
  rad('gallery2', [-1.25, 48, -146], [0, 0, 1], [-1, 0, 0], 12, g2R.end);
  rad('window', [-14, 48, -162.6], [-1, 0, 0], [0, 0, 1], 22, 0.74, { step: 0.0088, fill: 0.045 });
  keys.windowFull = R[R.length - 1].full;

  await ctx.yield();
  // ---- what throws warm light: the fire door, the open mains, every run in a floor or a wall, every radiator
  { const em = (a, b, o) => addEmitter(shared, a, b, o);
    const emRun = (r, o = {}, i0 = 0, i1 = r.pts.length - 1) => { const n = r.o.n || [0, 0, 0], off = o.off ?? 0.7;
      for (let i = i0; i < i1; i++) { const a = r.pts[i], b = r.pts[i + 1]; em([a[0] + n[0] * off, a[1] + n[1] * off, a[2] + n[2] * off], [b[0] + n[0] * off, b[1] + n[1] * off, b[2] + n[2] * off], { R: 4.6, I: 0.95, w: 0.012, run: true, ...o, arr: r.nodeArr[i], arr1: r.nodeArr[i + 1] }); } };
    const fd = bw(0, 5.2, zf + 2.4);
    em([fd.x, fd.y, fd.z], null, { R: 11, I: 1.5, arr: tB + 0.004, w: 0.024, I0: 0.4, flick: true });
    // the fire door's light lies down the brick floor toward the way in as a long fan, and rakes the inner faces of the two
    // piers that frame the entry (their arrises toward the fire carry a gold rim)
    { const f0 = bw(0, 0.9, zf + 3), f1 = new THREE.Vector3(-6.5, -21.1, -41), f2 = bw(0, 0.9, zf + 18), fo = { arr: tB + 0.004, w: 0.024, I0: 0.45, flick: true };
      em([f0.x, f0.y, f0.z], [f1.x, f1.y, f1.z], { R: 6.6, I: 1.3, ...fo }); em([f0.x, f0.y, f0.z], [f2.x, f2.y, f2.z], { R: 4.6, I: 0.85, ...fo });
      em([-13.6, -20.5, -38.6], [-13.6, -7.5, -38.6], { R: 3.2, I: 1.6, ...fo }); em([4.1, -20.5, -38.6], [4.1, -7.5, -38.6], { R: 3.2, I: 1.6, ...fo }); }
    em([-3.2, -6.3, CP[2] + 5], [-3.2, -6.3, -22], { R: 8.5, I: 1.05 });                                   // the draw-off over the way in: always hot
    emRun(m1, { R: 7, I: 1.1, off: 0 }, 1); emRun(w1, { R: 5.5, I: 0.8, off: 0 }, 0, 1); emRun(w2, { R: 5.5, I: 0.8, off: 0 }, 0, 1);
    em([W_.x0 + 0.8, -1.5, W_.z0 - 0.8], [W_.x1 - 0.8, -1.5, W_.z0 - 0.8], { R: 6.5, I: 1.1, arr: e2.end, arr1: e1.end, w: 0.012, down: true });
    emRun(wcut, { R: 6.5, I: 1.1, down: true }); emRun(ecut, { R: 6.5, I: 1.1, down: true });
    emRun(rearW, { R: 5 }, 0, 3); emRun(hall, { R: 5, I: 1.0 }, 0, 2); emRun(esk2); emRun(estrip, { R: 3.8, I: 0.8, prio: true }); emRun(eSkirt, { R: 4.6 }); emRun(eRise, { R: 6, I: 1.15 }); emRun(kit, { R: 4.2 }); emRun(parl, { R: 4.2 });
    emRun(trunk, { R: 5.5, I: 1.05 }, 0, 1); em([TX, 33, -0.8], [TX, 64, -0.8], { R: 5.5, I: 1.05, arr: trunk.nodeArr[1], arr1: trunk.nodeArr[3], w: 0.012 });
    emRun(gW, { R: 4.2 }); emRun(gE, { R: 4 }); emRun(bFirst, {}, 0, 1); em([TX, 40, -0.8], [15, 47.5, -0.8], { R: 4.6, I: 0.95, arr: bStair.nodeArr[0], arr1: bStair.nodeArr[2], w: 0.012 });
    em([-2, 70, -0.8], [-33.9, 70, -0.8], { R: 4.2, I: 0.95, arr: crownW.nodeArr[1], arr1: crownW.nodeArr[3], w: 0.012 }); emRun(crownE, { R: 4.2 }, 1);
    emRun(dropW, {}, 0, 1); emRun(limb, { R: 4 }, 2, 3); emRun(sideE, { R: 4 }); emRun(sideW, { R: 4 }); emRun(backW, { R: 5 });
    emRun(land, { R: 5, I: 1.0 }, 0, 3); emRun(lsk, { R: 5.4, I: 1.1, off: 0.6 }); emRun(lsk2, { R: 5.4, I: 1.1, off: 0.6 }); emRun(bed2R, { R: 4 }); emRun(bedR, { R: 4 }); emRun(bathR, { R: 4 });
    for (const r of R) {
      const c = r.pos, a = r.axis, n = r.normal, hw = Math.max(0, r.width / 2 - 1.2);
      em([c.x - a.x * hw + n.x * 1.1, c.y + 3.3, c.z - a.z * hw + n.z * 1.1], [c.x + a.x * hw + n.x * 1.1, c.y + 3.3, c.z + a.z * hw + n.z * 1.1],
        { R: r.eR, I: r.eI, arr: r.arrive + r.fill * (r.plume ? 0.2 : 0.35), arr1: r.arrive + (r.n - 1) * r.step + r.fill * (r.plume ? 0.2 : 0.35), w: r.plume ? 0.02 : r.fill * 0.8, prio: !!r.plume });
      // the warm air standing up the wall above a full radiator lights the wall it climbs (and whatever hangs on it)
      if (r.plume) { const q = r.plume, ua = r.arrive + r.fill * 0.3, ub = q.half ? ua + (r.n - 1) * r.step : ua + 0.012;
        em([c.x + n.x * q.off - a.x * q.half, c.y + q.h0, c.z + n.z * q.off - a.z * q.half], [c.x + n.x * q.off + a.x * q.half, c.y + q.h1, c.z + n.z * q.off + a.z * q.half], { R: q.R, I: q.I, arr: ua, arr1: ub, w: 0.025, prio: true }); }
      // the wall behind a radiator warms through as its ribs fill: the gaps between full ribs are deep gold, never black
      const yaw = Math.atan2(n.x, n.z), g = new THREE.PlaneGeometry(r.width - 0.1, RIB_H - 1.3, Math.max(2, r.n), 1);
      const bg = 0.865 - wallRest(c.x, c.y, c.z, 0.3);
      tb.add(g, { p: [c.x - n.x * 0.95, c.y + RIB_H * 0.5, c.z - n.z * 0.95], r: [0, yaw, 0], t: 0.3, k: KIND.IRON,
        fn: (x, y, z, out) => { const f = ((x - c.x) * a.x + (z - c.z) * a.z) / RIB_PITCH + (r.n - 1) / 2; out[1] = r.arrive + Math.max(0, f) * r.step + r.fill * 0.45; out[2] = bg; } });
      if (r.n > 9) await ctx.yield();
    }
  }
  await ctx.yield();
  let ribCount = 0; for (const r of R) ribCount += r.n;
  const ribGeo = ribGeometry();
  const ribMat = new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime, uFront: shared.uFront, uShift: shared.uShift, uSun: shared.uSun, uTop: shared.uTop }, vertexShader: RIB_VERT, fragmentShader: RIB_FRAG });
  const ribs = new THREE.InstancedMesh(ribGeo, ribMat, ribCount);
  const iA = new Float32Array(ribCount * 4), M = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(), P = new THREE.Vector3();
  let ri = 0;
  for (const r of R) {
    X.copy(r.axis); Z.copy(r.normal);
    for (let k = 0; k < r.n; k++) {
      P.copy(r.pos).addScaledVector(r.axis, (k - (r.n - 1) / 2) * RIB_PITCH);
      M.makeBasis(X, Y, Z).setPosition(P); ribs.setMatrixAt(ri, M);
      iA[ri * 4] = r.arrive + k * r.step; iA[ri * 4 + 1] = r.fill; iA[ri * 4 + 2] = r.rest; iA[ri * 4 + 3] = (ri * 2.39) % 6.28; ri++;
    }
    // feet, valve and the stub that feeds it
    const yaw = Math.atan2(r.normal.x, r.normal.z), e = r.width / 2 + 0.1;
    for (const s of [-1, 1]) { P.copy(r.pos).addScaledVector(r.axis, s * (e - 0.5));
      if (r.hung) { tb.box(2.0, 0.4, 0.4, { p: [P.x, P.y - 0.2, P.z + r.normal.z * 0.1], r: [0, yaw + Math.PI / 2, 0], t: 0.2, k: KIND.IRON }); tb.box(0.4, 2.4, 0.4, { p: [P.x - r.normal.x * 0.9, P.y - 1.3, P.z - r.normal.z * 0.9], t: 0.2, k: KIND.IRON }); tb.box(1.9, 0.3, 0.3, { p: [P.x - r.normal.x * 0.2, P.y - 1.2, P.z - r.normal.z * 0.2], r: [yaw === 0 ? 0.8 : -0.8, yaw, 0], t: 0.2, k: KIND.IRON }); }
      else tb.box(1.7, 0.5, 0.34, { p: [P.x, P.y + 0.25, P.z], r: [0, yaw + Math.PI / 2, 0], t: 0.27, k: KIND.IRON, arr: r.arrive, gain: 0.3 }); }
    P.copy(r.pos).addScaledVector(r.axis, -(e + 0.35));
    tb.sph(0.36, { p: [P.x, P.y + 0.62, P.z], t: 0.2, k: KIND.METAL, arr: r.arrive - 0.002, gain: 0.5 }, 8, 6);
    tb.cyl(0.42, 0.42, 0.12, 9, { p: [P.x, P.y + 1.3, P.z], t: 0.16, k: KIND.METAL }); tb.cyl(0.08, 0.08, 0.6, 5, { p: [P.x, P.y + 1.0, P.z], t: 0.16, k: KIND.METAL });
    tb.cyl(0.17, 0.17, 0.62, 6, { p: [P.x, P.y + 0.31, P.z], t: 0.3, k: KIND.METAL, arr: r.arrive - 0.003, gain: 0.56 });
    if ((ri & 3) === 0 || r.n > 12) await ctx.yield();
  }
  await ctx.yield();
  ribs.geometry.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
  ribs.instanceMatrix.needsUpdate = true; ribs.frustumCulled = false; object.add(ribs);
  await ctx.yield();

  const ribbonMat = new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime, uFront: shared.uFront, uShift: shared.uShift, uSun: shared.uSun, uPx: shared.uPx, uTop: shared.uTop, uDoor: shared.uDoor },
    vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  await ctx.yield();
  const ribbons = new THREE.Mesh(ribbonGeometry(net.runs), ribbonMat); ribbons.frustumCulled = false; ribbons.renderOrder = 2; object.add(ribbons);

  // the drip from the drain cock and its warm puddle
  const cock = bw(-4.6, 1.4, zf + 1.05), floorY = HOUSE.CELLAR;
  const dtb = makeTB(); dtb.sph(0.2, { s: [1, 1.5, 1], t: 0.76 }, 8, 6);
  const drip = new THREE.Mesh(dtb.build(), mat); drip.position.copy(cock); object.add(drip);
  const ptb = makeTB(); { const g = new THREE.RingGeometry(0.25, 0.42, 16); g.rotateX(-Math.PI / 2); ptb.add(g, { t: 0.7 }); }
  const splash = new THREE.Mesh(ptb.build(), mat); splash.position.set(cock.x, floorY + 0.09, cock.z); object.add(splash);

  await ctx.yield();
  const sysGeo = tb.build();
  await ctx.yield();
  const system = new THREE.Mesh(sysGeo, mat); system.name = 'boiler-and-mains'; object.add(system);
  await ctx.yield();

  if (opts.bake !== false) bakeEmitters(shared, ctx.quality?.detail ?? 1);
  const size = new THREE.Vector2();
  let progressed = false, front = 0;
  const hero = {
    object, shared, path, radius: 95, height: 96, center: new THREE.Vector3(0, 26, -82), ground: false,
    triangles: tb.triangles + ribCount * (ribGeo.index.count / 3),
    anchors: {
      boiler: bw(0, 6, 4.7), boilerTop: bw(0, 15, 0), micaWindow: bw(0, 5.5, zf + 0.6), drainCock: cock, puddle: new THREE.Vector3(cock.x, floorY, cock.z),
      cylinder: new THREE.Vector3(CP[0], CP[1] + 9, CP[2]), mousePipe: { from: [-30, -20.0, -71.5], to: [-17.4, -20.0, -81.0], hole: [-16.0, -21.5, -81.5] },
      radiators: R, keys, lead: LEAD, treeCenter: new THREE.Vector3(8, 35, 0), portal: { position: new THREE.Vector3(HOUSE.WIN.x, 62, -163.5), width: 14, height: 14 },
    },
    // the front is a latched function of u: it never runs back
    setProgress(u) { progressed = true; front = Math.max(front, u); if (u < 0.003) front = u; shared.uFront.value = front; },
    update(dt, time, camera, renderer) {
      shared.uTime.value = time;
      if (!progressed) shared.uFront.value = (time * 0.03) % 1.15;                     // set-piece viewer: loop the whole firing
      if (renderer && camera) { renderer.getDrawingBufferSize(size); shared.uPx.value = 2 / (Math.max(0.2, camera.projectionMatrix.elements[5]) * Math.max(1, size.y)); }
      const f = shared.uFront.value;
      flameMat.uniforms.uOn.value = THREE.MathUtils.smoothstep(f, keys.burner, keys.burner + 0.02);
      // a drop swells at the cock, falls, and leaves a ring that widens on the puddle
      const T0 = 1.9, ph = (time % T0) / T0, fall = Math.max(0, ph - 0.45) / 0.3, drop = cock.y - floorY - 0.2;
      const y = fall < 1 ? cock.y - drop * fall * fall : floorY - 2;
      drip.position.set(cock.x, y, cock.z); drip.scale.setScalar(ph < 0.45 ? 0.4 + ph * 1.3 : 1);
      const sp = Math.max(0, ph - 0.75) / 0.25; splash.scale.setScalar(ph > 0.75 ? 0.6 + sp * 2.6 : 0.001); splash.position.y = floorY + 0.09 - (ph > 0.75 ? 0 : 3);
    },
    dispose() { if (!opts.material) { /* the material is reachable from the scene */ } },
  };
  return hero;
}
