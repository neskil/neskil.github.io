// The Growing Crescent, 66.04 million years ago: hero set piece for the world "crescent-over-yucatan".
//
// WHAT IT IS
//   1. THE STRANGER (the hero): the Chicxulub rock as it was seen in its last forty seconds, a lumpy chalk-white
//      crescent lit by the same Sun as the day Moon beside it, its dark side simply sky. Keyed to u it sinks and
//      swells (2.4 degrees wide, 19 up -> 13 wide, 9 up); from u 0.66 its lower, leading limb heats to a white-gold
//      hairline and sheath; from u 0.80 (full by 0.90) the head becomes a bead and a dead-straight train of fire stands up behind
//      it, leaning 12 degrees right, white at the head, gold at the tail. It is drawn analytically on a
//      camera-following dome laid OVER the world's own sky (premultiplied "over", renderOrder -0.5, no depth write).
//   2. THE MOON, the ruler: same function, 1.35 degrees wide, fixed 11 degrees right and 16.6 up (or dead ahead in the
//      rare seeded event, when the stranger slides across it).
//   3. MOSASAURUS (exported builder buildMosasaur): 12 m, lofted, scaled and banded, tail-driven, with its one breath.
//   4. A STAGE (opts.stage !== false): bed + water discs so the piece can be judged alone and as a worked example
//      of both glitter roads, the wake, and the two shadows (soft from the Sun, hard from the stranger).
//
// FRAME: origin on the sea surface where the animal surfaces at u 0.33; +Y up; the camera flies toward -Z, so the
//   stranger hangs over -Z and the piece's front (seen from +Z) has it behind and above the animal. Sun 40 degrees
//   right of -Z, 13 up. Units metres. Water level is local y = 0.
//
// opts: palette (7 hex, brief order), detail 0.6..1 (animal mesh density, breath sprites), stage (default true; the
//   world passes false and supplies its own sea), sunDir (unit Vector3, local), moonAz/moonEl/moonWidthDeg,
//   rareEvent (bool), soft (0..0.15, the thin-haze "pearl" variation), strangerBright/strangerCover/moonBright/moonCover,
//   skyRadius (default 1800, keep under camera.far), length (animal, m), back (hex), tailSweep (m), and for the stage
//   skyTop, skyHorizon, sunColor, depth, grass.
//
// RETURNS { object, radius 6, height 6, center, anchors, state, skyUniforms, seaUniforms, sky, mosasaur,
//           setProgress(u), setMosasaur(x, z, heading, surfaced, breath, dive), update(dt, time, camera), dispose() }
//   setProgress(u): THE hook. Call it every frame with the world's u; nothing here runs on wall-clock time except
//     ambient loops (tail, swell, caustics, the streaks sliding up the train). Until it is first called the piece
//     runs a 40 s demo loop of the whole event so it is alive in the set-piece viewer.
//   state (refreshed in update): { u, widthDeg, elevDeg, heat, fire, trainDeg, light, dir (unit Vector3 TOWARD the
//     stranger, local), lightColor }. state.light is the second light's intensity (0 until 0.70, 0.35 by 0.85,
//     2.2 by 0.97): put a DirectionalLight (created at build, intensity 0) at state.dir and feed it state.light.
//   strangerAt(u), mosasaurAt(u): the same numbers as pure functions, exported.
//   skyUniforms + STRANGER_UNIFORMS_GLSL + STRANGER_GLSL: add them to the world's water shader and call
//     strangerSky(reflectedRay) -> vec4(premultiplied rgb, cover) to get the second glitter road (see makeWater here).
//
// anchors (local space): heading; sunDir; moonDir; strangerDir(u); surfacing (0,0,0);
//   flyThrough: the brief's camera line seen from here (start 210 m short of the surfacing point and 6 m to its
//     right, straight toward -Z at the brief's heights, a 26 degree left turn of radius 300 m over u 0.61-0.86, the last 80 m straight); clear of
//     the animal by 6.5 m; portalSeat { position, facing }: centre and normal of the 14 m ring at the end of that
//     line (ring centre y 8); viewpoints: three composed views with their u.
//
// COST: about 9.9k triangles (9.4k the animal at detail 1), 5 draw calls with the stage (sky, bed, water, animal,
//   breath), 3 without; build about 45 ms; no lights, no textures, no render targets.
// LIGHT: wants one warm low Sun from opts.sunDir, a blue sky fill (hemisphere), and the world's second directional
//   light driven by state.light. The sky overlay ignores fog on purpose (it is at infinity); everything else fogs.
// Debug only (set-piece viewer URL): prog=0..1 pins the demo progress, prog=cam ties it to the orbit, rad=<m> orbits closer.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEG = Math.PI / 180;
export const DEFAULT_PALETTE = ['#3FC6C0', '#0F7F93', '#F4EEDC', '#9CCBEA', '#F2C879', '#E9E6DC', '#FFF1B8'];

// ---------------------------------------------------------------------------------------------
// The stranger's track, keyed to u (brief, setPiece table): [u, width in degrees, degrees above the horizon]
// ---------------------------------------------------------------------------------------------
// (heights at the start flattened more than the brief's 24, 21 and 18, so that it hangs inside the first frame and inside
// the previous portal's opening; it still only ever sinks)
// (polish 1: a little wider over the first half, 3.0 to 4.8 degrees, so that the growing is plain in small pictures; the end is unchanged)
const TRACK = [[0, 3.0, 19], [0.25, 3.7, 17.4], [0.5, 4.8, 16.2], [0.7, 6.2, 14.6], [0.85, 8.5, 12], [1, 13, 9]];
function trackAt(u, col) {            // Catmull-Rom through the table (non-uniform knots), monotone data so no overshoot worth the name
  u = clamp(u, 0, 1);
  let i = 0; while (i < TRACK.length - 2 && u > TRACK[i + 1][0]) i++;
  const p0 = TRACK[Math.max(i - 1, 0)], p1 = TRACK[i], p2 = TRACK[i + 1], p3 = TRACK[Math.min(i + 2, TRACK.length - 1)];
  const t = (u - p1[0]) / (p2[0] - p1[0]);
  const m1 = (p2[col] - p0[col]) / Math.max(p2[0] - p0[0], 1e-4) * (p2[0] - p1[0]);
  const m2 = (p3[col] - p1[col]) / Math.max(p3[0] - p1[0], 1e-4) * (p2[0] - p1[0]);
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1[col] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[col] + (t3 - t2) * m2;
}
const dirFrom = (azRightDeg, elDeg, out = new THREE.Vector3()) => {   // heading is local -Z; azimuth positive to the right (+X)
  const a = azRightDeg * DEG, e = elDeg * DEG;
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
};

/** Everything about the stranger at progress u, as plain numbers (pure function of u; the world may call it too). */
export function strangerAt(u, out = {}) {
  u = clamp(u, 0, 1);
  out.u = u;
  out.widthDeg = trackAt(u, 1);
  out.elevDeg = trackAt(u, 2);
  out.heat = smoothstep(0.56, 0.74, u);                         // hairline -> sheath on the leading limb (as handed in; with polish 3's pace this is the last 13 seconds)
  // bead + train: full by u 0.90, so the fire stands for its three seconds in clear sky before the ring grows over it
  out.fire = smoothstep(0.705, 0.805, u);              // (polish 2: the fire stands for the last quarter of the line, which pace() flies in the last seconds)
  out.trainDeg = 7 + 13 * smoothstep(0.71, 0.86, u) + 5 * smoothstep(0.86, 1.0, u);  // 17 growing to 23 degrees (its bright part 14 to 18)
  // the second light, a smooth tide (brief, light): 0 until 0.70, 0.35 by 0.85, then up with the fire, 2.2 by 0.95
  out.light = 0.55 * smoothstep(0.57, 0.71, u) + 1.65 * smoothstep(0.72, 0.94, u);     // (polish 3: the glowing limb's own light is felt on sea, sand and wings before the fire)
  out.wake = smoothstep(0.70, 0.82, u);                         // the dusky air round the train (its own smoke and shadow)
  out.flood = smoothstep(0.765, 0.985, u);                      // (polish 4) the sky itself takes the light: a gold tide spreading from the fire and along the horizon under it
  return out;
}

// ---------------------------------------------------------------------------------------------
// GLSL: the analytic sky bodies. strangerSky(dir) returns premultiplied radiance in rgb and the
// share of the sky behind that it covers in a:   sky = sky * (1. - s.a) + s.rgb.
// The world's dome and its water (on the reflected ray) can both call it; share hero.skyUniforms.
// ---------------------------------------------------------------------------------------------
export const S_NOISE_GLSL = /* glsl */`
float sH21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sH21(i), sH21(i + vec2(1., 0.)), f.x), mix(sH21(i + vec2(0., 1.)), sH21(i + vec2(1., 1.)), f.x), f.y); }
float sFbm(vec2 p){ return sVN(p) * .55 + sVN(p * 2.13 + 7.1) * .3 + sVN(p * 4.7 + 3.3) * .15; }
float sCaus(vec2 p, float t){
  vec2 a = p * 0.85 + vec2(t * .33, t * .21);
  vec2 b = vec2(p.x * .8 + p.y * .6, -p.x * .6 + p.y * .8) * 1.25 - vec2(t * .27, -t * .3);
  float n1 = sVN(a + 1.8 * sVN(b * .5)), n2 = sVN(b + 1.8 * sVN(a * .5));
  float r = clamp(1. - abs(n1 - n2) * 2.4, 0., 1.);
  return r * r * r * r;
}
`;
export const STRANGER_UNIFORMS_GLSL = /* glsl */`
uniform vec3 uSDir; uniform vec3 uMoonDir; uniform vec3 uSunDir;
uniform vec4 uSBody;      // angular radius (tan units), heat 0..1, fire 0..1, train length (tan units)
uniform vec4 uSShape;     // per-seed: lobe phases x,y,z and spin of the ellipsoid
uniform vec4 uSLook;      // stranger cover, moon cover, moon radius (tan units), softness (haze variation)
uniform vec3 uSChalk; uniform vec3 uSHot; uniform vec3 uSGold; uniform vec3 uSMoonCol;
uniform float uSTime;
uniform vec4 uSFx;       // wake 0..1 (dusky air round the train), crescent halo, spare, spare
uniform vec3 uSDusk;     // the colour of that air
`;
export const STRANGER_GLSL = /* glsl */`
${S_NOISE_GLSL}
// one sunlit body: q = tangent coords / radius, basis R,U,S (S toward the body), lump = rim lumpiness
// returns vec3(lit amount 0..1, coverage 0..1, normalised radius); px = size of a pixel in q units
vec3 sBody(vec2 q, vec3 R, vec3 U, vec3 S, vec3 sun, float lump, vec4 shape, float px, float soft){
  float r = length(q);
  if (r > 1.25) return vec3(0., 0., r);
  float ang = atan(q.y, q.x + step(abs(q.x) + abs(q.y), 1e-6) * 1e-4);
  float cs = cos(shape.w), sn = sin(shape.w);
  vec2 qe = vec2(cs * q.x + sn * q.y, -sn * q.x + cs * q.y);
  // lumpy rim: an ellipsoid plus three lobes plus a little rubble
  float rim = 1. - lump * (0.9 * (qe.y * qe.y) / max(r * r, 1e-4))
            + lump * (0.55 * sin(2. * ang + shape.x) + 0.42 * sin(3. * ang + shape.y) + 0.30 * sin(5. * ang + shape.z)
            + 0.22 * sin(9. * ang + shape.x * 2.7) + 0.10 * sin(17. * ang + shape.y * 1.9));
  float qn = r / max(rim, 0.3);
  float edge = 1. - smoothstep(1. - px * 0.8 - soft, 1. + px * 0.7 + soft * .5, qn);     // one pixel of smoothing, centred on the limb: a small body keeps its lit rim
  if (edge <= 0.) return vec3(0., 0., qn);
  float z = sqrt(max(1. - qn * qn, 0.));
  // relief: big facets and craters bend the normal so the terminator is ragged, as on a real rock
  vec2 e = vec2(.035, 0.);
  vec2 np = qe * 2.1 + shape.xy;
  float h0 = sFbm(np), hx = sFbm(np + e.xy), hy = sFbm(np + e.yx);
  vec2 g = vec2(hx - h0, hy - h0) / e.x;
  g = vec2(cs * g.x - sn * g.y, sn * g.x + cs * g.y);
  vec3 nl = normalize(vec3(q / max(rim, 0.3) - g * lump * 4.0 * (0.15 + z), z + 0.02));
  vec3 n = nl.x * R + nl.y * U - nl.z * S;
  float lam = dot(n, sun);
  float lit = smoothstep(-.01, .07 + soft, lam);
  float alb = 0.80 + 0.36 * (sFbm(qe * 4.3 + shape.yz) - .5) + 0.22 * (h0 - .5);
  lit *= alb * (0.80 + 0.20 * sqrt(clamp(lam, 0., 1.)));
  return vec3(lit, edge, qn);
}

const vec2 S_VDIR = vec2(-0.2079, -0.9781);     // the way it falls on the sky: down, and 12 degrees left of straight down
vec4 strangerSky(vec3 d){
  vec3 col = vec3(0.); float cover = 0.;
  float haze = smoothstep(0.0, 0.07, d.y);
  // ---- the stranger ----
  vec3 S = uSDir;
  vec3 R = normalize(cross(S, vec3(0., 1., 0.)));
  vec3 U = cross(R, S);
  float cz = dot(d, S);
  float sEdge = 0.;
  if (cz > 0.55) {
    vec2 t = vec2(dot(d, R), dot(d, U)) / cz;
    float rad = max(uSBody.x, 1e-4);
    vec2 q = t / rad;
    float px = clamp(length(fwidth(t)) / rad, 0., 0.3);
    float heat = uSBody.y, fire = uSBody.z;
    vec3 b = sBody(q, R, U, S, normalize(uSunDir - S * 0.30), 0.05, uSShape, px, uSLook.w);
    sEdge = b.y;
    float litc = b.x * b.y;
    float glare = 1. - 0.88 * fire;
    col += uSChalk * litc * uSLook.x * haze * glare;
    cover = max(cover, b.y * smoothstep(0., .22, b.x) * uSLook.x * 0.92 * haze * glare);
    float r = length(q);
    float lead = smoothstep(0.15, 0.92, dot(q / max(r, 1e-4), S_VDIR));
    if (heat > 0. && r < 3.5) {
      // the leading limb heats: a hairline along the edge that thickens to a sheath
      float w = mix(0.045, 0.26, heat * heat);
      float band = smoothstep(1. - w - px * 2., 1., b.z) * b.y;
      float hair = band * band * lead * (1.0 + 1.9 * heat);
      float outside = max(b.z - 1., 0.);
      float sheath = exp(-outside / (0.02 + 0.11 * heat)) * (1. - b.y) * lead * heat * (0.6 + 1.0 * heat);
      float flick = 0.86 + 0.14 * sVN(vec2(atan(q.y, q.x + step(abs(q.x) + abs(q.y), 1e-6) * 1e-4) * 6., uSTime * 2.3));
      col += mix(uSGold * vec3(1.15, 0.80, 0.42), uSHot, clamp(0.10 + 0.55 * heat * band, 0., 1.)) * (hair + sheath) * flick * smoothstep(0., .12, heat) * (1. - 0.9 * fire);
      cover = max(cover, band * lead * heat * glare);
    }
    // a faint halo of scattered light round the sunlit limb, so the eye finds it at a glance
    col += uSChalk * uSFx.y * exp(-max(b.z - 0.55, 0.) * 3.2) * smoothstep(-0.4, 0.5, dot(q, vec2(uSunDir.x, uSunDir.y - S.y))) * haze * (1. - b.y * 0.7);
    {
      float cw = clamp((cz - 0.55) / 0.45, 0., 1.); cw *= cw; cw *= cw; cw *= cw; cw *= cw;
      col += uSGold * vec3(1.06, 0.78, 0.48) * cw * (0.05 * heat + 0.07 * fire) * (0.35 + 0.65 * haze);     // (polish 5: a third of it: it veiled the sky round the fire in milk)
    }
    if (fire > 0.) {
      vec2 hq = S_VDIR * 0.42;
      vec2 dq = q - hq;
      float d2 = dot(dq, dq);
      float on = smoothstep(0., .18, fire);
      vec2 td = -S_VDIR;
      float s = dot(dq, td), dd = dot(dq, vec2(td.y, -td.x));
      float L = max(uSBody.w / rad, 1e-3);
      float sl = clamp(s / L, 0., 1.);
      // the dusky air round it: its own smoke, and the sky's blue deepening beside so bright a thing
      float wk = exp(-dd * dd / (1.6 + 3.0 * sl)) * smoothstep(-2.6, 0.6, s) * (1. - smoothstep(0.80, 1.5, s / L)) * 0.62 * uSFx.x;
      wk = max(wk, exp(-d2 / 7.0) * 0.55 * uSFx.x);
      col += uSDusk * wk * (1. - cover); cover = max(cover, wk);                 // laid behind the lit limb, over sky and dark side alike
      // the bead: a small hard white point, brighter than the Sun, gold-white, never clipped grey
      float bead = exp(-d2 / (0.004 + 0.022 * fire)) * (2.2 + 2.4 * fire);
      col += (uSHot * bead + uSGold * (exp(-d2 / (0.10 + 0.20 * fire)) * 0.42 * (0.35 + 0.65 * fire) + exp(-sqrt(d2) / 1.0) * 0.04 + exp(-d2 / 3.2) * 0.04) * fire) * on;     // (polish 5: at its first moment a hard bead with a streak behind it, not a ball in a round glow)       // a round white head in a gold halo: the crescent is lost in its glare
      // the train: dead straight, standing up behind it and leaning right; white at the head, saturated gold at the tail
      float rag = 0.80 + 0.4 * sFbm(vec2(s * 1.7 - uSTime * 1.9, 2.));                      // ragged edges, never a wavering centre line
      float w = mix(0.44, 0.075, sqrt(sl)) * (0.6 + 0.4 * on) * rag * (0.55 + 0.45 * fire);     // (polish 5: a slim spear from the first, filling out as it comes down)
      float xw = dd / max(w, 1e-3);
      float core = exp(-xw * xw);
      float hair = exp(-xw * xw * 12.);
      float along = smoothstep(-0.55, 0.15, s) * (1. - smoothstep(0.78, 1.0, sl));
      float streak = sFbm(vec2(xw * 2.4 + 3., s * 0.9 - uSTime * 2.6)) * 0.8 + sVN(vec2(xw * 6., s * 0.35 - uSTime * 4.3)) * 0.5;
      streak *= streak;
      float glow = exp(-abs(dd) / (w * 3.0 + 0.05)) * 0.16;
      vec3 gold = uSGold * vec3(1.12, 0.74, 0.30);
      vec3 tcol = mix(uSHot, gold, smoothstep(0.04, 0.50, sl));
      col += (tcol * (core * (0.75 + 1.5 * streak) * mix(1.7, 2.3, smoothstep(0., 0.25, sl)) + glow * mix(0.5, 0.6, sl)) + uSHot * hair * 2.4 * smoothstep(0.03, 0.2, sl) * (1. - smoothstep(0.2, 0.55, sl))) * along * on;
    }
  }
  {
    // (polish 4) the second daylight in the sky: a wide gold tide round the fire, strongest in the haze along the horizon under it
    float cw2 = clamp((cz - 0.10) / 0.90, 0., 1.); cw2 *= cw2; cw2 *= cw2 * cw2;
    float gl2 = cw2 * cw2 * uSFx.z * (0.12 + 0.88 * exp(-max(d.y, 0.) * 9.));          // (polish 5: narrower, and it keeps to the haze on the horizon)
    col += uSGold * vec3(1.18, 0.80, 0.42) * gl2 * 0.16 * (1. - 0.6 * cover);
    cover = max(cover, gl2 * 0.08);                               // gold laid OVER the blue (added to it, it went mauve)
  }
  // ---- the Moon: the same light on a smooth old ball; it is the ruler ----
  vec3 M = uMoonDir;
  float cm = dot(d, M);
  if (cm > 0.995) {
    vec3 Rm = normalize(cross(M, vec3(0., 1., 0.)));
    vec3 Um = cross(Rm, M);
    vec2 tm = vec2(dot(d, Rm), dot(d, Um)) / cm;
    float mr = max(uSLook.z, 1e-4);
    vec2 qm = tm / mr;
    float pxm = clamp(length(fwidth(tm)) / mr, 0., 0.4);
    vec3 m = sBody(qm, Rm, Um, M, normalize(uSunDir - M * 0.30), 0.0, vec4(1.7, 4.1, 2.3, 0.6), pxm, 0.015 + uSLook.w);
    float mc = m.x * m.y * (1. - sEdge) * haze;
    col += uSMoonCol * mc * uSLook.y;
    cover = max(cover, mc * uSLook.y * 0.8);
  }
  return vec4(col, clamp(cover, 0., 1.));
}
`;

// ---------------------------------------------------------------------------------------------
// The sky overlay: a camera-following dome drawn over the world's own sky (premultiplied "over"),
// so the stranger's dark side is simply whatever sky is behind it.
// ---------------------------------------------------------------------------------------------
function makeSkyUniforms(rng, pal, opts) {
  const C = (h) => new THREE.Color(h);
  const sun = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : dirFrom(40, 13)).normalize();
  const rare = opts.rareEvent ?? rng.chance(0.08);                // the stranger slides across the Moon: it is nearer
  const moonAz = opts.moonAz ?? (rare ? 0.6 : 11), moonEl = opts.moonEl ?? (rare ? 15.0 : 16.6);   // (rare: a little lower now that the stranger is drawn wider, so that it still reaches the Moon at u 0.25)
  const hot = C(pal[6]); hot.g *= 0.97; hot.b *= 0.86;            // keep the hue in the highlight
  return {
    uSDir: { value: dirFrom(0, 24) },
    uMoonDir: { value: dirFrom(moonAz, moonEl) },
    uSunDir: { value: sun },
    uSBody: { value: new THREE.Vector4(Math.tan(1.2 * DEG), 0, 0, 0) },
    uSShape: { value: new THREE.Vector4(rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28), rng.range(-1.2, 1.2)) },
    uSLook: { value: new THREE.Vector4(opts.strangerCover ?? 0.9, opts.moonCover ?? 0.7, Math.tan((opts.moonWidthDeg ?? 1.35) * 0.5 * DEG), opts.soft ?? 0) },
    uSChalk: { value: C(pal[2]).multiplyScalar(opts.strangerBright ?? 0.95) },
    uSHot: { value: hot },
    uSGold: { value: C(pal[4]) },
    uSMoonCol: { value: C(pal[5]).multiplyScalar(opts.moonBright ?? 1.0) },
    uSTime: { value: 0 },
    uSFx: { value: new THREE.Vector4(0, opts.strangerHalo ?? 0.16, 0, 0) },
    uSDusk: { value: C(opts.dusk ?? '#3D5E86').multiplyScalar(0.55) },
  };
}
function makeSky(uniforms) {
  const geo = new THREE.SphereGeometry(1, 32, 16);
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, depthTest: true, transparent: true, fog: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec3 vDir;
      ${STRANGER_UNIFORMS_GLSL}
      ${STRANGER_GLSL}
      void main(){
        vec3 d = normalize(vDir + vec3(0., 1e-6, 0.));
        vec4 s = strangerSky(d);
        gl_FragColor = s;
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'strangerSky'; mesh.renderOrder = -0.5; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// The stage (opts.stage !== false): a disc of the shelf sea so the piece can be judged alone, and
// a reference for the world's own water: glass over white rippled sand, leopard seagrass, caustics,
// both glitter roads, the animal's wake and its two shadows (soft from the Sun, hard from the stranger).
// ---------------------------------------------------------------------------------------------
export const SEA_GLSL = /* glsl */`
uniform vec3 uSkyTop; uniform vec3 uSkyHor; uniform vec3 uSunCol; uniform vec3 uCamL;
uniform vec4 uMo;        // the animal: x, z, heading (radians, 0 = +Z), surfaced 0..1
uniform vec4 uSea;       // depth of the bank (m), second light 0..2.2, time, seed
uniform vec3 uTurq; uniform vec3 uDeep; uniform vec3 uSand; uniform vec3 uGrass;
vec3 seaSky(vec3 r){
  float h = clamp(r.y, 0., 1.);
  vec3 c = mix(uSkyHor, uSkyTop, smoothstep(0.02, 0.55, h));
  c = mix(c, uSkyHor * 1.08 + 0.04, exp(-h * 14.));           // the milky band on the horizon
  float sd = clamp(dot(r, uSunDir), 0., 1.);
  float s2 = sd * sd; float s8 = s2 * s2 * s2 * s2; float s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8;
  c += uSunCol * (s8 * 0.12 + s64 * s64 * 0.5 + smoothstep(0.99985, 0.99997, sd) * 14.);
  return c;
}
`;
function makeStageUniforms(rng, pal, skyUniforms, opts) {
  const C = (h) => new THREE.Color(h);
  return {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...skyUniforms,
    uSkyTop: { value: C(opts.skyTop ?? '#5E9FD6') }, uSkyHor: { value: C(opts.skyHorizon ?? '#DCEBEC') },
    uSunCol: { value: C(opts.sunColor ?? '#FFE7B0') }, uCamL: { value: new THREE.Vector3(0, 3, 30) },
    uMo: { value: new THREE.Vector4(0, 0, 0, 0) },
    uSea: { value: new THREE.Vector4(opts.depth ?? 5, 0, 0, rng.range(0, 50)) },
    uTurq: { value: C(pal[0]) }, uDeep: { value: C(pal[1]) }, uSand: { value: C(pal[2]).multiplyScalar(0.74) }, uGrass: { value: C(opts.grass ?? '#5E7F3A') },
  };
}
const STAGE_VERT = /* glsl */`
  varying vec3 vPos;
  #include <fog_pars_vertex>
  void main(){
    vPos = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
function makeBed(uniforms) {
  const geo = new THREE.CircleGeometry(1500, 48); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, vertexShader: STAGE_VERT,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec3 vPos;
      ${STRANGER_UNIFORMS_GLSL}
      ${STRANGER_GLSL}
      ${SEA_GLSL}
      #include <fog_pars_fragment>
      float shadowBlob(vec2 p, vec3 L, float soft, float halfW){
        // the animal's shadow thrown down the light's direction onto the bed
        float depth = uSea.x;
        vec2 off = -L.xz / max(L.y, 0.12) * depth;
        vec2 d = p - (uMo.xy + off);
        float ch = cos(uMo.z), sh = sin(uMo.z);
        vec2 l = vec2(ch * d.x - sh * d.y, sh * d.x + ch * d.y);        // x across, y along the body
        float stretch = 1. + abs(dot(normalize(L.xz + vec2(1e-4, 0.)), vec2(sh, ch))) * (1. / max(L.y, 0.12) - 1.) * 0.12;
        float e = length(vec2(l.x / halfW, (l.y + 0.8) / (5.6 * stretch)));
        return 1. - smoothstep(1. - soft, 1. + soft * 0.4, e);
      }
      void main(){
        vec2 p = vPos.xz;
        vec3 toCam = uCamL - vec3(p.x, -uSea.x, p.y);
        float dist = length(toCam);
        float nearF = 1. / (1. + dist * 0.035);
        float t = uSea.z;
        // the channel on the left, the bank under us
        float chan = 1. - smoothstep(-78., -34., p.x + 16. * sin(p.y * .021 + uSea.w) + 9. * sin(p.y * .067));
        // white sand in ripple bars 0.4 m apart, bending
        float wob = sFbm(p * 0.11 + uSea.w) * 9. + sFbm(p * 0.9) * 0.5;
        float bars = sin((p.x * 0.78 + p.y * 0.62 + wob) * 15.7);
        float rip = mix(1., 0.78 + 0.22 * smoothstep(-0.6, 0.9, bars), 1. - smoothstep(10., 38., dist));
        vec3 col = uSand * rip * (0.92 + 0.16 * sFbm(p * 0.35 + 9.));
        // seagrass in leopard patches 8 to 30 m across
        float gm = sFbm(p * 0.07 + uSea.w * 1.7) + 0.22 * (sFbm(p * 0.33) - .5);
        float grass = smoothstep(0.50, 0.56, gm) * (0.8 + 0.2 * smoothstep(0.42, 0.52, sFbm(p * 0.021 + 31.)));
        float blades = 0.55 + 0.6 * sVN(vec2(p.x * 2.3 + sin(t * .7 + p.y * .3) * .5, p.y * 9.));
        col = mix(col, uGrass * 0.42 * blades, grass * 0.92);
        col = mix(col, uDeep * 0.18, chan);
        // light: the Sun, the caustic net, and the tide of the second light
        float ca = sCaus(p * 1.7, t) * min(nearF * 2.4, 1.);
        float l2 = uSea.y;
        vec3 light = uSunCol * (0.74 + 0.6 * ca) * (1. - 0.5 * shadowBlob(p, uSunDir, 0.6, 1.9));
        light += uSHot * l2 * (0.32 + 0.42 * ca) * (1. - 0.85 * shadowBlob(p, uSDir, 0.10, 1.35));
        col *= light;
        // looking down through clear water: red goes first, turquoise comes back
        float depth = uSea.x + chan * 22.;
        vec3 vd = toCam / max(dist, 1e-3);
        float path = depth / max(vd.y, 0.07) + depth * 0.6;
        vec3 T = exp(-path * vec3(0.105, 0.022, 0.030));
        vec3 scatter = mix(uTurq, uDeep, smoothstep(6., 60., path)) * (0.55 + 0.25 * l2);
        col = col * T + scatter * (1. - exp(-path * 0.045));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'stageBed'; mesh.position.y = -uniforms.uSea.value.x; mesh.frustumCulled = false;
  return mesh;
}

function makeWater(uniforms) {
  const geo = new THREE.CircleGeometry(1500, 48); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, vertexShader: STAGE_VERT, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec3 vPos;
      ${STRANGER_UNIFORMS_GLSL}
      ${STRANGER_GLSL}
      ${SEA_GLSL}
      #include <fog_pars_fragment>
      void main(){
        vec2 p = vPos.xz;
        vec3 toCam = uCamL - vec3(p.x, 0., p.y);
        float dist = length(toCam);
        vec3 V = toCam / max(dist, 1e-3);
        float nearF = 1. / (1. + dist * 0.03);
        float t = uSea.z;
        // glass with a long slow swell and the faintest cat's-paws
        vec2 g = vec2(0.);
        float sw = sFbm(p * 0.035 + 3.) * 7.;                       // the swell is never ruler-straight
        float swF = 0.25 + 0.75 * nearF;
        g += vec2(0.80, 0.60) * 0.022 * swF * cos(dot(p, vec2(0.80, 0.60)) * 0.35 - t * 0.9 + sw);
        g += vec2(-0.45, 0.89) * 0.016 * swF * cos(dot(p, vec2(-0.45, 0.89)) * 0.57 - t * 1.2 + 1.7 - sw * 1.3);
        vec2 rp = p * 1.6 + vec2(t * 0.25, t * 0.18);
        float r0 = sFbm(rp);
        g += vec2(sFbm(rp + vec2(.12, 0.)) - r0, sFbm(rp + vec2(0., .12)) - r0) * (0.10 + 0.5 * nearF);
        vec2 fp = p * 5.3 - vec2(t * 0.4, -t * 0.3);
        float f0 = sVN(fp);
        g += vec2(sVN(fp + vec2(.2, 0.)) - f0, sVN(fp + vec2(0., .2)) - f0) * 0.10 * nearF;
        // the animal's bow wave and V wake, in its own frame (x across, y ahead)
        vec2 d = p - uMo.xy;
        float ch = cos(uMo.z), sh = sin(uMo.z);
        vec2 l = vec2(ch * d.x - sh * d.y, sh * d.x + ch * d.y);
        float behind = 5.2 - l.y;
        float foam = 0.;
        if (uMo.w > 0.001 && behind > -3. && behind < 90.) {
          float bb = max(behind, 0.);
          float a = abs(l.x) - bb * 0.33 - 0.35;
          float wd = 0.30 + bb * 0.040;
          float fade = smoothstep(-0.5, 2.0, behind) * exp(-bb / 26.) * uMo.w;
          float arm = exp(-(a * a) / (wd * wd)) * fade;
          float dadx = -2. * a / (wd * wd) * arm * sign(l.x) * 0.16;
          float inside = (1. - smoothstep(-0.6, 0.3, a)) * fade;
          float tw = cos(bb * 2.1 - t * 5.) * 0.10 * inside * exp(-bb / 12.);
          vec2 gl2 = vec2(dadx, tw);
          g += vec2(ch * gl2.x + sh * gl2.y, -sh * gl2.x + ch * gl2.y);
          float churn = sVN(l * 2.2 + vec2(0., t * 1.5)) * sVN(l * 5.1 - vec2(t, 0.));
          foam = arm * arm * (1. - smoothstep(1., 14., bb)) * (0.35 + 1.6 * churn)
               + (1. - smoothstep(0.04, 0.16, abs(length(vec2(l.x / 0.66, (l.y - 1.9) / 3.7)) - 1.))) * uMo.w * uMo.w * (0.10 + 0.9 * churn);
        }
        vec3 n = normalize(vec3(-g.x, 1., -g.y));
        vec3 R = reflect(-V, n); R.y = abs(R.y) + 0.002; R = normalize(R);
        float c1 = 1. - clamp(dot(n, V), 0., 1.);
        float F = 0.02 + 0.98 * c1 * c1 * c1 * c1 * c1;
        float far = 1. - nearF;
        vec3 Rs = normalize(R + vec3(0., 0.22 * far, 0.));
        vec3 refl = seaSky(Rs);
        vec4 st = strangerSky(R);
        refl = refl * (1. - st.a) + min(st.rgb, vec3(2.4));
        F = min(F, 0.80 - 0.12 * far);
        F *= 1. - 0.38 * exp(-dot(l * vec2(1., 0.55), l * vec2(1., 0.55)) / 30.);
        float k = mix(0.10, 0.95, far * far);
        vec3 scatter = mix(uTurq * 0.5, uTurq * 0.42 + uDeep * 0.55, far) * (1. + 0.4 * uSea.y);
        foam = clamp(foam, 0., 1.);
        vec3 col = refl * F + scatter * (1. - F) * k;
        float alpha = F + (1. - F) * k;
        vec3 foamCol = (uSunCol * 0.62 + uSHot * 0.35 * uSea.y + uSkyTop * 0.25);
        col = mix(col, foamCol, foam * 0.85); alpha = mix(alpha, 1., foam * 0.85);
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'stageWater'; mesh.renderOrder = 1; mesh.frustumCulled = false;
  return mesh;
}

/** The animal's part in the journey, keyed to u (brief, journey 0.25-0.45), in the hero's frame: it comes up from the channel on
 *  the left, swims toward +Z (toward the oncoming camera) at 3 m/s, surfaces at the origin at u 0.33, breathes once, and by 0.42
 *  has sunk, tail lobe last, and turned away to the left. A pure function of u. */
export function mosasaurAt(u, out = {}) {
  const track = (uu) => {
    const d = 120 * (uu - 0.33);                                          // metres along its line (3 m/s over a 40 s journey)
    const x = -15 * (1 - smoothstep(-34, -2, d)) - 0.022 * Math.pow(Math.max(d - 9, 0), 2);
    return [x, d - 0.012 * Math.pow(Math.max(d - 9, 0), 2)];
  };
  const a = track(u - 0.004), b = track(u + 0.004), c = track(u);
  out.x = c[0]; out.z = c[1]; out.heading = Math.atan2(b[0] - a[0], b[1] - a[1]);
  out.surfaced = smoothstep(0.285, 0.33, u) * (1 - smoothstep(0.385, 0.425, u));
  out.breath = clamp((u - 0.336) / 0.05, 0, 1);
  out.dive = smoothstep(0.385, 0.40, u) * (1 - smoothstep(0.42, 0.45, u));
  return out;
}

// (heights over u 0.57 to 0.80 kept low, 4 to 5.5 m, so that the bed, the turtles and the animal beside us stay large; 8 m from u 0.85 as before)
// (polish 1: the first 340 m are no longer a ruled line. We come in 6.5 m up, stoop to the right toward the Sun's road and skim the
// ammonites at 1.6 m, swing back left and climb for a look down over the channel's lip, drop beside the mosasaur, and lift again
// under the pterosaurs: every few seconds another height and heading. From z -134 on, the old line to the ring.)
// (polish 2: lower over the first reef, 2.6 m over the sand spit we cross at u 0.535, then a swing right and back left so that the
// Sun, the tower and the stranger change places in the frame; the last 80 m are as they were)
// (polish 3: twelve different pictures. Skim the ammonites at 1 m with wave crests at eye height; 2 m beside the mosasaur; a hard S
// (right, then left) round the plunging pterosaurs, banked; over the spit; then one climb to 18.5 m at u 0.70, from where bank, creek,
// shoals, reefs and cay lie below as a chart, and a long straight glide of 173 m down to the ring at 8 m (the last 60 m level).)
// (polish 4: the glide down from the top of the climb is now a stoop: from 18.5 m to 2.4 m over the second creek at u 0.79, where the
// fire's road lies on the water at wave height, then a steady lift to 8 m for the last 60 m, which are as they were.)
const FLY = [[6, 6.5, 210], [6, 6.3, 190], [6.6, 5.4, 172], [10.5, 3.6, 150], [18.5, 1.5, 122], [22.5, 1.0, 95], [20, 1.35, 70], [11.5, 3.3, 46], [3.5, 3.7, 21], [-1.5, 2.7, -20], [-2, 2.5, -44], [7, 3.0, -66], [13.5, 2.1, -88], [12, 2.2, -108], [14, 3.0, -122], [16.5, 8, -141], [18, 15.5, -162], [16.4, 18.5, -181.9], [9.0, 12.6, -199.0], [2.0, 5.2, -215.5], [-4.6, 2.4, -230.0], [-13.2, 2.2, -246.5], [-24.36, 4.6, -265.5], [-33.13, 8, -283.48], [-41.89, 8, -301.46], [-59.43, 8, -337.41]];
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? 1, 0.6, 1);
  const object = new THREE.Group(); object.name = 'crescent-over-yucatan';
  const skyUniforms = makeSkyUniforms(rng.fork('sky'), pal, opts);
  const sky = makeSky(skyUniforms);
  sky.scale.setScalar(opts.skyRadius ?? 1800);
  object.add(sky);
  await ctx.yield();
  const stage = opts.stage !== false;
  const seaUniforms = makeStageUniforms(rng.fork('sea'), pal, skyUniforms, opts);
  if (stage) { object.add(makeBed(seaUniforms)); await ctx.yield(); object.add(makeWater(seaUniforms)); await ctx.yield(); }

  const mosa = await buildMosasaur(ctx, { ...opts, rng: rng.fork('mosasaur'), detail });
  object.add(mosa.object);
  await ctx.yield();
  let mosaAuto = true; const mScript = {};
  const HEAD0 = opts.demoHeading ?? (0.55 + rng.range(-0.25, 0.25));
  function demoMosa(time) {                              // alone on the stage: it swims a straight line through the centre, surfacing there
    const T = 16, ph = ((((time - 4) % T) + T) % T) / T, d = (ph - 0.5) * T * 3.0;      // 3 m/s; through the centre when time = 12, 28, ...
    const k = clamp(1 - Math.abs(ph - 0.5) / 0.36, 0, 1), surf = smoothstep(0, 0.45, k);
    mosa.setPose(Math.sin(HEAD0) * d, Math.cos(HEAD0) * d, HEAD0, surf, clamp((ph - 0.42) / 0.16, 0, 1));
  }

  const state = strangerAt(0);
  state.dir = new THREE.Vector3(); state.lightColor = new THREE.Color(pal[6]);
  let progress = -1;                                   // < 0: nobody has set it yet, run the demo loop
  let demo = null;
  let demoCam = false, dbgRad = null;
  try { const q = globalThis.location?.search || ''; const m = /[?&]prog=([0-9.]+)/.exec(q); if (m) demo = parseFloat(m[1]); demoCam = /[?&]prog=cam/.test(q); const r = /[?&]rad=([0-9.]+)/.exec(q); if (r) dbgRad = parseFloat(r[1]); } catch (e) { demo = null; }
  const camPos = new THREE.Vector3();
  const moonHome = skyUniforms.uMoonDir.value.clone(), moonIn = new THREE.Vector3();
  const moonAzEl = [Math.atan2(moonHome.x, -moonHome.z) / DEG, Math.asin(clamp(moonHome.y, -1, 1)) / DEG];
  function apply(u, time) {
    strangerAt(u, state);
    // seen through the previous portal (u exactly 0) the opening shows about 13 degrees round the entry axis: both crescents are
    // drawn inside it there and ease up to their true places over the first second after the crossing
    const drop = progress >= 0 ? 1 - smoothstep(0, 0.035, u) : 0;
    dirFrom(0, state.elevDeg, state.dir);
    dirFrom(0, state.elevDeg - 8.5 * drop, skyUniforms.uSDir.value);
    const mNear = Math.abs(moonAzEl[0]) < 3;          // the rare morning: the Moon dead ahead keeps its distance below the stranger
    if (drop > 0) skyUniforms.uMoonDir.value.copy(dirFrom(moonAzEl[0] * (1 - (mNear ? 0 : 0.50) * drop), moonAzEl[1] - (mNear ? 8.5 : 8.4) * drop, moonIn)); else skyUniforms.uMoonDir.value.copy(moonHome);
    skyUniforms.uSBody.value.set(Math.tan(state.widthDeg * 0.5 * DEG), state.heat, state.fire, Math.tan(state.trainDeg * DEG));
    skyUniforms.uSFx.value.x = state.wake; skyUniforms.uSFx.value.z = state.flood;
    skyUniforms.uSTime.value = time % 1000;
    seaUniforms.uSea.value.y = state.light; seaUniforms.uSea.value.z = time % 1000;
    if (mosaAuto) { if (progress >= 0) { mosasaurAt(progress, mScript); mosa.setPose(mScript.x, mScript.z, mScript.heading, mScript.surfaced, mScript.breath, mScript.dive); } else demoMosa(time); }
    mosa.update(0, time, state.light);
    seaUniforms.uMo.value.set(mosa.pose.x, mosa.pose.z, mosa.pose.heading, mosa.pose.surfaced);
  }
  apply(0, 0);
  return {
    object, radius: dbgRad ?? 6, height: dbgRad != null ? 3.5 : 6, center: new THREE.Vector3(0, dbgRad != null ? 1.0 : 2.0, 0),
    anchors: {
      heading: new THREE.Vector3(0, 0, -1),                                  // the way the camera flies; the stranger hangs dead ahead of it
      sunDir: skyUniforms.uSunDir.value.clone(), moonDir: skyUniforms.uMoonDir.value.clone(),
      strangerDir: (u, out = new THREE.Vector3()) => dirFrom(0, trackAt(u, 2), out),   // also the direction TO the second light
      surfacing: new THREE.Vector3(0, 0, 0),                                 // where the animal breaks the surface at u 0.33
      // the brief's line, except: lower beside the animal, and the left turn is 26 degrees of radius 300 m over u 0.61-0.86 (not 14),
      // so the ring ends 26 degrees left of the stranger and the fire stands in clear sky beside it
      flyThrough: FLY.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      portalSeat: { position: new THREE.Vector3(FLY[FLY.length - 1][0], 8, FLY[FLY.length - 1][2]), facing: new THREE.Vector3(0.4384, 0, 0.8988) },
      viewpoints: [
        { u: 0.0, position: new THREE.Vector3(6, 3, 210), lookAt: new THREE.Vector3(6, 3, 150), note: 'entry: crescent 24 degrees up dead ahead, Moon 13 degrees to its right' },
        { u: 0.36, position: new THREE.Vector3(6, 2.8, 9), lookAt: new THREE.Vector3(0, 0.3, 3), note: 'drawing level: wet banded back, breath, V wake under the crescent' },
        { u: 0.95, position: new THREE.Vector3(-47.1, 8, -312.2), lookAt: new THREE.Vector3(-59.4, 8, -337.4), note: 'fire train right of the ring, second glitter road' },
      ],
    }, state, skyUniforms, seaUniforms, sky, mosasaur: mosa,
    setMosasaur(x, z, heading, surfaced, breathU, dive) { mosaAuto = false; mosa.setPose(x, z, heading, surfaced, breathU, dive); },
    setProgress(u) { progress = clamp(u, 0, 1); },
    update(dt, time, camera) {
      camera.getWorldPosition(camPos);
      object.updateWorldMatrix(true, false);
      sky.position.copy(object.worldToLocal(camPos));
      let u = progress >= 0 ? progress : (demo ?? ((time / 40 + 0.59) % 1));
      if (progress < 0 && demoCam) u = clamp((Math.atan2(sky.position.x, sky.position.z) + 0.25) / 0.5, 0, 1);
      apply(u, time);
      seaUniforms.uCamL.value.copy(sky.position);
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}

// ---------------------------------------------------------------------------------------------
// Mosasaurus, 12 m. Side silhouette, as shares of the length (snout at +Z, origin at mid-length on the
// spine line): skull an eighth (a narrow blunt cone, nostrils on top), no neck, barrel deepest (1.8 m)
// a third of the way back, four flat paddles (front pair larger) low on the flanks, tail the whole rear
// half, flattened side to side, its tip turned DOWN with a triangular lobe standing above it.
// ---------------------------------------------------------------------------------------------
class Geo {
  constructor() { this.p = []; this.c = []; this.k = []; this.i = []; this.n = 0; }
  // skin = [ring (-1 belly .. 1 back), part (0 skin, 1 eye, 2 highlight, 3 paddle), limb phase, limb weight]
  v(x, y, z, skin, col) { this.p.push(x, y, z); this.k.push(skin[0], skin[1], skin[2], skin[3]); this.c.push(col[0], col[1], col[2]); return this.n++; }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.i.push(a, b, c); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('aSkin', new THREE.Float32BufferAttribute(this.k, 4));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i); g.computeVertexNormals();
    return g;
  }
}
// [z, spine y, height above, depth below, half width, superellipse exponent]
const MOSA_SECTIONS = [
  [6.00, -0.03, 0.04, 0.05, 0.06, 2.0], [5.93, -0.03, 0.10, 0.11, 0.13, 2.2], [5.72, -0.02, 0.15, 0.17, 0.20, 2.4], [5.32, -0.01, 0.20, 0.23, 0.265, 2.5],
  [4.92, 0.00, 0.245, 0.28, 0.335, 2.6], [4.52, 0.00, 0.285, 0.32, 0.40, 2.5], [4.12, 0.00, 0.35, 0.40, 0.40, 2.3], [3.60, 0.00, 0.50, 0.57, 0.50, 2.25],
  [2.80, 0.00, 0.70, 0.79, 0.66, 2.2], [1.90, 0.00, 0.84, 0.92, 0.75, 2.2], [1.00, 0.00, 0.85, 0.89, 0.72, 2.2], [0.10, 0.00, 0.75, 0.72, 0.56, 2.1],
  [-0.90, 0.00, 0.63, 0.57, 0.39, 2.0], [-1.90, 0.00, 0.53, 0.47, 0.26, 1.9], [-2.90, 0.00, 0.46, 0.41, 0.175, 1.8], [-3.80, -0.01, 0.42, 0.38, 0.125, 1.7],
  [-4.50, -0.05, 0.40, 0.37, 0.095, 1.65], [-5.00, -0.17, 0.35, 0.31, 0.07, 1.6], [-5.50, -0.50, 0.25, 0.21, 0.048, 1.6], [-5.85, -0.82, 0.13, 0.11, 0.028, 1.6],
  [-6.00, -1.00, 0.03, 0.03, 0.01, 1.6],
];
function mosaSection(z, out) {            // Catmull-Rom across the table at any z
  const S = MOSA_SECTIONS; let i = 0; while (i < S.length - 2 && z < S[i + 1][0]) i++;
  const a = S[Math.max(i - 1, 0)], b = S[i], c = S[i + 1], d = S[Math.min(i + 2, S.length - 1)];
  const t = clamp((z - b[0]) / (c[0] - b[0]), 0, 1), t2 = t * t, t3 = t2 * t;
  for (let k = 1; k < 6; k++) {
    const m1 = (c[k] - a[k]) / (c[0] - a[0]) * (c[0] - b[0]), m2 = (d[k] - b[k]) / (d[0] - b[0]) * (c[0] - b[0]);
    out[k] = (2 * t3 - 3 * t2 + 1) * b[k] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * c[k] + (t3 - t2) * m2;
  }
  out[2] = Math.max(out[2], 0.02); out[3] = Math.max(out[3], 0.02); out[4] = Math.max(out[4], 0.008);
  return out;
}
function mosaBody(G, rng, K, NR) {
  const sec = [0, 0, 0, 0, 0, 0], WHITE = [1, 1, 1], rings = [];
  // rings closer together on the skull and the fluke, where the outline turns fastest
  for (let r = 0; r <= NR; r++) {
    const t = r / NR, tt = t + 0.055 * Math.sin(t * Math.PI * 2) * -1;            // a little denser at both ends
    const z = 6 - 12 * clamp(tt, 0, 1);
    mosaSection(z, sec);
    const first = G.n, e = 2 / sec[5];
    for (let j = 0; j < K; j++) {
      const th = (j / K) * Math.PI * 2, cx = Math.cos(th), sy = Math.sin(th);
      let x = sec[4] * Math.sign(cx) * Math.pow(Math.abs(cx), e);
      let y = sec[1] + (sy > 0 ? sec[2] : sec[3]) * Math.sign(sy) * Math.pow(Math.abs(sy), e);
      // the skull: a brow over each eye, a jaw-muscle swell behind it, a flat table between the brows
      const bx = Math.abs(x) - 0.27, by = y - 0.17, bz = z - 5.0;
      const brow = Math.exp(-(bx * bx * 30 + by * by * 60 + bz * bz * 9));
      const jz = z - 4.45, jy = y + 0.05;
      const jaw = Math.exp(-(jz * jz * 5 + jy * jy * 10)) * (Math.abs(cx) > 0.3 ? 1 : 0.3);
      const k = 1 + 0.10 * brow + 0.11 * jaw;
      x *= k; y += 0.035 * brow;
      // shoulders and hips: the paddles leave the body from a swell, not from a hole
      for (const [lz, amp] of [[3.55, 0.10], [0.25, 0.07]]) {
        const dz = z - lz, dy = y + 0.42;
        x *= 1 + amp * Math.exp(-(dz * dz * 3.2 + dy * dy * 5)) * (sy < 0.3 ? 1 : 0.4);
      }
      G.v(x, y, z, [sy, 0, 0, 0], WHITE);
    }
    rings.push(first);
  }
  for (let r = 0; r < NR; r++) for (let j = 0; j < K; j++) {
    const a = rings[r] + j, b = rings[r] + (j + 1) % K, c = rings[r + 1] + (j + 1) % K, d = rings[r + 1] + j;
    G.quad(a, d, c, b);
  }
  const tip = G.v(0, -0.03, 6.035, [0, 0, 0, 0], WHITE), end = G.v(0, -1.0, -6.03, [0, 0, 0, 0], WHITE);
  for (let j = 0; j < K; j++) { G.tri(tip, rings[0] + j, rings[0] + (j + 1) % K); G.tri(end, rings[NR] + (j + 1) % K, rings[NR] + j); }
}
// a flat fin or paddle: stations from root to tip, a lens section across the chord, both faces
function mosaFin(G, o) {
  const { root, span, fwd, len, chord, sweep, thick, n = 12, m = 8, part, phase, col } = o;
  const N = new THREE.Vector3().crossVectors(span, fwd).normalize();
  const flip = o.up && N.dot(o.up) < 0; if (flip) N.negate();          // face 0 is always the one toward o.up
  const P = new THREE.Vector3(), rows = [[], []];
  for (let i = 0; i <= n; i++) {
    const s = i / n, c = chord(s), sw = sweep(s), th = thick(s);
    for (let side = 0; side < 2; side++) {
      const row = [];
      for (let j = 0; j <= m; j++) {
        const cj = j / m, across = (0.5 - cj) * c + sw;                    // j = 0 is the leading edge
        const lens = Math.sin(Math.PI * Math.pow(cj, 0.75)) * th * (side ? -1 : 1);   // thickest a third back, like a wing
        P.copy(root).addScaledVector(span, s * len).addScaledVector(fwd, across).addScaledVector(N, lens);
        const shade = col(s, cj, side);
        row.push(G.v(P.x, P.y, P.z, [o.ring ?? (side ? -1 : 1), part, phase, s], shade));
      }
      rows[side].push(row);
    }
  }
  for (let side = 0; side < 2; side++) for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const a = rows[side][i][j], b = rows[side][i][j + 1], c = rows[side][i + 1][j + 1], d = rows[side][i + 1][j];
    if ((side === 1) !== !!flip) G.quad(a, d, c, b); else G.quad(a, b, c, d);
  }
}
function mosaEye(G, x, y, z, r) {
  const sx = Math.sign(x), DARK = [0.012, 0.016, 0.02], LID = [0.32, 0.36, 0.36], HI = [1, 1, 1], rows = [];
  const NA = 10, NB = 6;
  for (let b = 0; b <= NB; b++) {
    const row = [], lat = (b / NB) * Math.PI * 0.62;                    // a cap of a sphere, pole pointing outward
    for (let a = 0; a < NA; a++) {
      const lon = (a / NA) * Math.PI * 2, rr = Math.sin(lat) * r;
      const lid = b === NB;                                             // the last ring is the lid, sunk into the skin
      row.push(G.v(x + sx * (Math.cos(lat) * r - (lid ? 0.012 : 0)), y + Math.sin(lon) * rr * (lid ? 1.25 : 1), z + Math.cos(lon) * rr * (lid ? 1.35 : 1), lid ? [0.6, 0, 0, 0] : [0, 1, 0, 0], lid ? LID : DARK));
    }
    rows.push(row);
  }
  for (let b = 0; b < NB; b++) for (let a = 0; a < NA; a++) {
    const p = rows[b][a], q = rows[b][(a + 1) % NA], s = rows[b + 1][(a + 1) % NA], t = rows[b + 1][a];
    if (sx > 0) G.quad(p, q, s, t); else G.quad(p, t, s, q);
  }
  // one highlight, up and forward on the ball
  const hx = x + sx * r * 0.93, hy = y + r * 0.42, hz = z + r * 0.34, h = r * 0.24;
  const a = G.v(hx, hy - h, hz - h, [0, 2, 0, 0], HI), b = G.v(hx, hy - h, hz + h, [0, 2, 0, 0], HI), c = G.v(hx + sx * 0.004, hy + h, hz + h * 0.6, [0, 2, 0, 0], HI), d = G.v(hx + sx * 0.004, hy + h, hz - h * 0.6, [0, 2, 0, 0], HI);
  if (sx > 0) G.quad(a, d, c, b); else G.quad(a, b, c, d);
}
async function mosaGeometry(rng, detail, yieldFn) {
  const G = new Geo(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  mosaBody(G, rng, detail > 0.8 ? 32 : 24, detail > 0.8 ? 84 : 64);
  await yieldFn();
  // paddles: a short thick upper limb, a bend at the elbow, then the broad flat blade swept back
  const paddle = (side, z, len, wide, phase) => mosaFin(G, {
    root: V(side * (z > 2 ? 0.34 : 0.34), z > 2 ? -0.40 : -0.40, z), span: V(side * 0.96, -0.16, -0.22).normalize(), fwd: V(side * 0.22, 0.05, 0.97).normalize(),
    len, part: 3, phase, n: 13, m: 8, up: V(0, 1, 0),
    chord: (s) => wide * (0.50 + 0.50 * Math.sin(Math.PI * clamp(0.10 + 0.72 * s, 0, 1))) * Math.sqrt(Math.max(1 - Math.pow(s, 5), 0)) + 0.02 * (1 - s),
    sweep: (s) => 0.09 * Math.sin(Math.PI * Math.min(s / 0.42, 1)) - 0.40 * Math.pow(Math.max(s - 0.28, 0), 1.25) * len,
    thick: (s) => 0.17 * Math.pow(1 - s, 1.5) + 0.060 * (1 - s) + 0.016,      // (polish 5: a fleshy hydrofoil, thick at the root and still rounded at the tip: it read as paper)
    // (polish 4) five finger rays show through the skin of the blade as soft ridges that fan toward the tip; pale along the trailing edge
    col: (s, cj, face) => { const k = (face ? 1.0 : 0.82) * (1 - 0.30 * s * s) * (0.80 + 0.20 * Math.cos(cj * 15.7 - s * 1.5) * Math.min(s * 3, 1)) * (1 + 0.35 * smoothstep(0.82, 1.0, cj)); return [k, k, k]; },
  });
  paddle(1, 3.50, 1.45, 0.84, 0); paddle(-1, 3.50, 1.45, 0.84, 0.5);
  paddle(1, 0.30, 1.12, 0.64, 2.2); paddle(-1, 0.30, 1.12, 0.64, 2.7);
  // the fluke's upper lobe: a triangle standing above the downturned tip
  mosaFin(G, {
    root: V(0, 0.10, -4.93), span: V(0, 0.80, -0.60).normalize(), fwd: V(0, 0.60, 0.80).normalize(), len: 1.42, part: 0, phase: 0, n: 9, m: 7, ring: 0.9,
    chord: (s) => 1.02 * (1 - s) * (1 - 0.25 * Math.sin(Math.PI * s)) + 0.015,
    sweep: (s) => -0.20 * s,
    thick: (s) => 0.075 * (1 - s) + 0.006,
    col: () => [1, 1, 1],
  });
  mosaEye(G, 0.300, 0.150, 5.00, 0.05); mosaEye(G, -0.300, 0.150, 5.00, 0.05);
  await yieldFn();
  return G.build();
}

function mosaMaterial(rng, pal, opts) {
  const C = (h) => new THREE.Color(h);
  const uniforms = {
    uSwim: { value: new THREE.Vector4(0, 1, 0, 0) },                      // tail phase, tail amplitude (m at the tip), paddle phase, spare
    uWater: { value: new THREE.Vector4(0, 0, 0, rng.range(0, 40)) },      // water level (world y), second light, time, seed
    uSkinA: { value: C(opts.back ?? '#1F3A44').multiplyScalar(3.4) }, uSkinB: { value: C(pal[5]).multiplyScalar(0.80) },
    uMScat: { value: C(pal[0]) }, uMSky: { value: C(opts.skyFill ?? pal[3]) },
  };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.46, metalness: 0.0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aSkin; varying vec4 vSkin; varying vec3 vBody; varying vec3 vWPos; uniform vec4 uSwim;`)
      .replace('#include <beginnormal_vertex>', `
        vec3 objectNormal = vec3(normal);
        // the swimming wave: nothing forward of the hips, growing to the fluke (a sideways shear x += f(z))
        float mTail = clamp((1.2 - position.z) / 7.2, 0., 1.);
        float mArg = uSwim.x - mTail * 2.4;
        float mHead = clamp(position.z / 6., 0., 1.);
        float mOff = uSwim.y * (mTail * mTail * sin(mArg) + 0.045 * mHead * sin(uSwim.x + 1.3));
        float mD = uSwim.y * ((-1. / 7.2) * step(0., mTail) * step(mTail, 0.9999) * (2. * mTail * sin(mArg) - mTail * mTail * 2.4 * cos(mArg)) + 0.045 / 6. * step(0., position.z) * sin(uSwim.x + 1.3));
        objectNormal.z -= mD * objectNormal.x;
        objectNormal = normalize(objectNormal + vec3(0., 1e-5, 0.));`)
      .replace('#include <begin_vertex>', `
        vec3 transformed = vec3(position);
        transformed.x += mOff;
        transformed.y -= 0.27 * mTail * mTail;                             // the tail trails low: only the tip of its upper lobe cuts the surface
        if (aSkin.y > 2.5) {                                              // paddles: slow flat steering strokes from the shoulder
          float w = aSkin.w * aSkin.w, st = uSwim.z + aSkin.z;
          transformed.y += w * 0.20 * sin(st);
          transformed.z -= w * 0.12 * cos(st);
        }
        vSkin = aSkin; vBody = position;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vWPos = (modelMatrix * vec4(transformed, 1.)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec4 vSkin; varying vec3 vBody; varying vec3 vWPos;
        uniform vec4 uWater; uniform vec3 uSkinA; uniform vec3 uSkinB; uniform vec3 uMScat; uniform vec3 uMSky;
        ${S_NOISE_GLSL}
        float mScale(vec2 uv, out float keel, out float fade){
          vec2 q = uv * 17.; q = vec2(q.x + q.y, q.x - q.y) * 0.7071;
          fade = clamp(1. - 1.5 * length(fwidth(q)), 0., 1.);
          vec2 f = fract(q) - .5;
          keel = (1. - smoothstep(0.03, 0.14, abs(f.x - f.y))) * (1. - smoothstep(0.25, 0.45, abs(f.x + f.y)));
          return smoothstep(0.30, 0.47, max(abs(f.x), abs(f.y)));           // 1 in the seams between scales
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float mPart = vSkin.y, mRing = vSkin.x, mKeel = 0., mFade = 0.;
        float mIsSkin = (mPart < 0.5 || mPart > 2.5) ? 1. : 0.;
        {
          vec3 b = vBody; float sd = uWater.w;
          float n1 = sFbm(vec2(b.z * 0.9 + sd, mRing * 1.5 + b.y));
          // (polish 4) a lizard's skin, not a panelled hull: soft dark saddles of uneven length and spacing whose ragged edges melt
          // down the flank, a zone of pale rosettes below them, dark speckle running out onto the cream; no ruled bars anywhere
          float n2 = sFbm(vec2(b.z * 2.6 - sd, mRing * 3.3 + b.y * 2.1));
          float onBody = 1. - smoothstep(4.1, 5.3, b.z);
          float tailK = 1. - smoothstep(-4.2, 0.4, b.z);                                         // 1 on the tail: flat-sided, dark almost to its lower edge
          float bz = b.z * 0.60 + (sFbm(vec2(b.z * 0.42 + sd * 2., 3.)) - .5) * 1.7 + 0.10 * mRing * sin(b.z * 1.1 + sd);
          float cell = abs(fract(bz) - 0.5);
          float wid = 0.16 + 0.14 * sVN(vec2(floor(bz) * 7.3 + sd, 1.7));
          float saddle = (1. - smoothstep(wid - 0.17, wid + 0.19, cell + (n2 - 0.5) * 0.46 + (n1 - 0.5) * 0.20)) * onBody;   // soft, torn edges: blotches, never bars
          saddle *= smoothstep(-0.50 - 0.35 * n1, 0.30, mRing + 0.25 * (n2 - 0.5));               // each one narrows and frays down the flank
          float lo = mix(-0.86, -0.95, tailK), hi = mix(-0.44, -0.62, tailK);
          float shade = smoothstep(lo, hi, mRing + (n1 - 0.5) * 0.36 + 0.16 * saddle);
          float fine = sVN(vec2(b.z * 21., mRing * 8. + b.y * 15.));
          vec3 back = uSkinA * (1.00 + 0.26 * n1) * mix(vec3(1.10, 1.04, 0.90), vec3(0.86, 1.0, 1.06), n2);      // slate with an olive cast here, a blue one there
          back = mix(back, uSkinA * 0.56, saddle * 0.50);      // (polish 5: the saddles sit quieter; the scales carry the skin)
          float ros = smoothstep(0.60, 0.78, sVN(vec2(b.z * 4.3 + sd, mRing * 3.4 + b.y * 4.6))) * (1. - smoothstep(-0.05, 0.50, mRing)) * (1. - saddle);
          back = mix(back, uSkinA * 1.75 + uSkinB * 0.10, ros * 0.55);                             // pale rosettes on the flank
          back = mix(back, uSkinA * 1.7 + 0.03, smoothstep(0.82, 0.93, fine) * 0.22);                // fine pale flecks
          vec3 belly = uSkinB * (0.88 + 0.16 * n1);
          belly = mix(belly, back, smoothstep(0.72, 0.90, sVN(vec2(b.z * 7., mRing * 5. + b.y * 7.))) * smoothstep(-0.95, -0.35, mRing) * 0.7);   // dark speckle runs out onto the cream
          vec3 skin = mix(belly, back, shade);
          if (mPart > 2.5) {                                                                       // paddles: the back's slate with pale spots, a pale trailing edge, the underside cream-grey
            vec3 top = uSkinA * (0.80 + 0.5 * n1) * (1. + 0.9 * smoothstep(0.62, 0.80, sVN(b.zx * 6.5 + sd)));
            skin = mix(mix(uSkinB * 0.55, uSkinA, 0.45), top, smoothstep(-0.2, 0.2, mRing));
          }
          float k1, f1, k2, f2;
          float s1 = mScale(b.zy, k1, f1), s2 = mScale(b.zx, k2, f2);
          float topw = smoothstep(0.55, 0.85, abs(mRing));
          float seam = mix(s1, s2, topw); mKeel = mix(k1, k2, topw); mFade = mix(f1, f2, topw);
          skin *= 1. - 0.34 * seam * mFade;
          {
            // (polish 4) a second, coarser grain that still reads from eight metres: rows of scales in a diagonal lattice a hand wide
            float k3, f3, k4, f4;
            float s3 = mScale(b.zy * 0.30 + 0.37, k3, f3), s4 = mScale(b.zx * 0.30 + 0.37, k4, f4);
            skin *= 1. - 0.19 * mix(s3 * f3, s4 * f4, topw) * (0.55 + 0.9 * n2);      // (polish 5: stronger than it was, and uneven, so it is skin and not a net)
            skin *= 1. + 0.12 * mix(k3 * f3, k4 * f4, topw);
          }
          skin *= 1. + 0.22 * mKeel * mFade;
          // the closed, lipped mouth: a dark line from the snout back under the eye, pale lips either side
          float ym = -0.050 - 0.020 * (6. - b.z) - 0.020 * (1. - smoothstep(4.45, 4.80, b.z));
          float my = abs(b.y - ym), onSkull = smoothstep(4.40, 4.50, b.z) * step(mPart, 0.5);
          skin = mix(skin, belly * 0.95, (1. - smoothstep(0.02, 0.075, my)) * onSkull * 0.55);
          skin = mix(skin, vec3(0.012, 0.016, 0.02), (1. - smoothstep(0.005, 0.014, my)) * onSkull * 0.92);
          // nostrils on top of the snout
          float ns = length(vec2(abs(b.x) - 0.065, (b.z - 5.62) * 0.55));
          skin = mix(skin, vec3(0.01), (1. - smoothstep(0.014, 0.026, ns)) * step(0., b.y) * step(mPart, 0.5));
          diffuseColor.rgb *= mix(vec3(1.), skin, mIsSkin); mKeel *= mIsSkin;
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.16, mKeel * mFade * 0.7);
        if (mPart > 0.5 && mPart < 1.5) roughnessFactor = 0.05;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (mPart > 1.5 && mPart < 2.5) totalEmissiveRadiance += vec3(1.0, 0.96, 0.88) * 2.2;`)
      .replace('#include <opaque_fragment>', `
        {
          vec3 mVd = normalize(vViewPosition + vec3(0., 0., 1e-5));
          float mNv = clamp(dot(normal, mVd), 0., 1.);
          float mFr = (1. - mNv) * (1. - mNv); mFr = mFr * mFr * (1. - mNv);
          float mUp = 0.5 + 0.5 * dot(normal, normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz));
          outgoingLight += uMSky * (0.030 + 0.36 * mFr) * (0.25 + 0.75 * mUp) * (1. + 0.5 * uWater.y) * step(mPart, 0.5 + 2.5 * step(2.5, mPart));
          outgoingLight += diffuseColor.rgb * (uMSky * 0.36 + vec3(0.10, 0.10, 0.085)) * mUp;            // sky fill, so the shaded flank is blue, not black
          outgoingLight += diffuseColor.rgb * uMScat * 0.85 * (1. - mUp) * (1. - mUp);   // (polish 4) the lit sea throws turquoise up under the flank: a round body, not a slab
        }
        float mDepth = max(uWater.x - vWPos.y, 0.);
        // the waterline: a bright wet line where the skin cuts the surface
        outgoingLight += (uMSky * 0.05 + vec3(0.008)) * (1. - smoothstep(0.0, 0.035, abs(vWPos.y - uWater.x - 0.02 - 0.03 * sin(vBody.z * 2.3 + uWater.z * 1.9)))) * smoothstep(0.42, 0.72, sVN(vBody.zy * 2.3 + uWater.z * 0.7));   // (polish 4) a broken thread of bright water lapping along her
        {
          // wet skin: the top of the back mirrors the bright sky in a broken highlight along the spine
          float mUp2 = clamp(dot(normal, normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz)), 0., 1.);
          // (polish 3) a fine broken glitter along the spine and on every keel, not broad pale patches (they read as a whale's blotches)
          float mU4 = mUp2 * mUp2 * mUp2 * mUp2;
          float wetHi = mU4 * mU4 * smoothstep(0.50, 0.85, sFbm(vec2(vBody.z * 5.1 + vBody.x * 4.1, vBody.x * 9.3 - vBody.z * 3.9) + uWater.z * 0.2));
          outgoingLight += (uMSky * 0.34 + vec3(0.09)) * wetHi * step(uWater.x, vWPos.y) * step(mPart, 0.5);
          if (mPart > 2.5 || vBody.z < -4.7) outgoingLight += (uMSky * 0.30 + vec3(0.05)) * step(uWater.x, vWPos.y) * (0.45 + 0.55 * sVN(vBody.zy * 5.));    // a wet fin or tail lobe above the water carries the sky: slate, never a black wedge
        }
        if (mDepth > 0.) {
          vec3 mv = cameraPosition - vWPos;
          float mvy = mv.y / max(length(mv), 1e-3);
          float mPath = mDepth * (1.3 + 1.5 / max(mvy, 0.16));
          float mCa = sCaus(vWPos.xz * 1.7, uWater.z) * exp(-mDepth * 0.16) * clamp(mRing * 1.5 + 0.35, 0., 1.) * smoothstep(0.0, 0.45, mDepth);   // (none right at the waterline: it drew a ruled bright line along her)
          outgoingLight *= mix(1., 0.82, smoothstep(0.0, 0.45, mDepth)) + 1.9 * mCa;                              // (polish 4) the Sun's net of light plays over her back and tail: she is IN the water
          outgoingLight = outgoingLight * exp(-mPath * vec3(0.12, 0.034, 0.040)) + uMScat * (0.30 + 0.20 * uWater.y) * (1. - exp(-mPath * 0.019));   // (polish 5: clearer water over her: the sunk tail and far flank stay a dark solid animal, they were a pale ghost)   // (polish 3: denser, so the sunk tail and far flank are soft shapes in the green, never hard slabs)
        }
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'crescent-mosasaur';
  return { mat, uniforms };
}

// the one breath: a low bushy puff of mist from the nostrils, never a spout
function mosaBreath(rng, count, sunCol, hotCol) {
  const base = new THREE.InstancedBufferGeometry();
  base.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  base.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { seed[i * 4] = rng.range(-1, 1); seed[i * 4 + 1] = rng.range(0.25, 1); seed[i * 4 + 2] = rng.range(-0.5, 1); seed[i * 4 + 3] = rng(); }
  base.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  base.instanceCount = count;
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uPuff: { value: new THREE.Vector4(0, 0.2, 5.62, 0) },      // nostrils (animal's frame) and progress 0..1
    uPuffLook: { value: new THREE.Vector4(1.2, 2.6, 0, 0) },   // height (m), distance left behind over the puff's life (m), second light
    uPSun: { value: sunCol }, uPHot: { value: hotCol },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform vec4 uPuff; uniform vec4 uPuffLook;
      varying vec2 vUv; varying float vA; varying float vS;
      #include <fog_pars_vertex>
      void main(){
        float age = clamp(uPuff.w * 1.35 - aSeed.w * 0.35, 0., 1.);
        float out1 = 1. - exp(-age * 5.);
        vec3 dir = vec3(aSeed.x * 1.55, aSeed.y * (0.50 + 0.50 * aSeed.w), 0.15 + aSeed.z * 1.25);       // (polish 3) a low wide bush: wider than it is high
        vec3 c = uPuff.xyz + dir * out1 * uPuffLook.x * 0.8 + vec3(aSeed.x * 0.25, 0.10 - 0.25 * age, -uPuffLook.y) * age;
        float size = (0.08 + 0.50 * age) * (0.5 + 0.9 * aSeed.w);
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
        mvPosition.xy += position.xy * size;
        gl_Position = projectionMatrix * mvPosition;
        vUv = position.xy; vS = aSeed.w * 37.;
        vA = smoothstep(0., 0.07, age) * (1. - smoothstep(0.45, 1., age)) * step(0.0001, uPuff.w);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec4 uPuffLook; uniform vec3 uPSun; uniform vec3 uPHot;
      varying vec2 vUv; varying float vA; varying float vS;
      ${S_NOISE_GLSL}
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vUv, vUv);
        float a = exp(-r2 * 3.2) * smoothstep(0.15, 0.85, sVN(vUv * 2.3 + vS) + 0.4 * sVN(vUv * 5.1 - vS)) * (1. - smoothstep(0.7, 1., r2)) * clamp(vA, 0., 1.) * 0.13;
        // ragged veils, each its own tone: sunlit cream by turns with blue-grey shade, so the bush has depth and never clips to a white ball
        vec3 col = (uPSun * 0.75 + vec3(0.60, 0.66, 0.70) + uPHot * 0.45 * uPuffLook.z) * (0.85 + 0.2 * vUv.y) * mix(vec3(0.50, 0.60, 0.68), vec3(1.02, 1.0, 0.95), fract(vS * 0.61));
        gl_FragColor = vec4(col * a, a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(base, mat); mesh.name = 'mosasaurBreath'; mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, uniforms };
}

/** The Mosasaurus alone: object origin at mid-length on the spine line, snout toward +Z, 12 m long (opts.length scales it). */
export async function buildMosasaur(ctx, opts = {}) {
  const rng = opts.rng ?? ctx.rng.fork('mosasaur');
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const geo = await mosaGeometry(rng, clamp(opts.detail ?? 1, 0.6, 1), () => ctx.yield());
  await ctx.yield();
  const { mat, uniforms } = mosaMaterial(rng, pal, opts);
  const body = new THREE.Mesh(geo, mat); body.name = 'mosasaur'; body.frustumCulled = false;
  const breath = mosaBreath(rng, Math.round(150 * clamp(opts.detail ?? 1, 0.6, 1)), new THREE.Color(opts.sunColor ?? '#FFE7B0'), new THREE.Color(pal[6]));
  const object = new THREE.Group(); object.name = 'mosasaurus'; object.rotation.order = 'YXZ';
  const scale = (opts.length ?? rng.range(11.2, 12.8)) / 12; object.scale.setScalar(scale);
  const sweep = opts.tailSweep ?? rng.range(1.0, 1.3);
  object.add(body, breath.mesh);
  const pose = { x: 0, z: 0, heading: 0, surfaced: 0, breath: 0, dive: 0 };
  const wp = new THREE.Vector3();
  return {
    object, body, breath: breath.mesh, uniforms, pose, length: 12 * scale,
    /** x, z: where mid-body is in the parent's frame; heading: radians from +Z toward +X; surfaced 0 (3.4 m down) .. 1 (snout and back awash); breath 0..1 once */
    setPose(x, z, heading, surfaced, breathU = 0, dive = 0) { pose.x = x; pose.z = z; pose.heading = heading; pose.surfaced = clamp(surfaced, 0, 1); pose.breath = clamp(breathU, 0, 1); pose.dive = clamp(dive, 0, 1); },
    update(dt, time, light2 = 0) {
      const s = pose.surfaced, e = s * s * (3 - 2 * s);
      object.position.set(pose.x, lerp(-3.4, -0.07, e) * scale, pose.z);            // awash: snout, back and the tail's upper lobe along one line
      object.rotation.set(-(4.6 * DEG) * e + (9 * DEG) * pose.dive + 0.012 * Math.sin(time * 1.26), pose.heading, 0.035 * Math.sin(time * 2.513 + 0.6));
      uniforms.uSwim.value.set((time * 2.513) % 6283.185, sweep, (time * 0.95) % 6283.185, 0);
      object.updateWorldMatrix(true, false);
      const parent = object.parent; wp.set(0, 0, 0); if (parent) parent.localToWorld(wp);
      uniforms.uWater.value.x = wp.y; uniforms.uWater.value.y = light2; uniforms.uWater.value.z = time % 1000;
      breath.uniforms.uPuff.value.w = pose.breath; breath.uniforms.uPuffLook.value.z = light2;
    },
  };
}
