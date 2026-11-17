// THE WIPE AND THE DRAWING - hero set piece for the world "wind-draws-the-namib".
//
// Sand animation on a light table. A 90 m dune with a burning S-crest stands on lit glass; a gust like the
// flat of a hand sweeps its whole length and leaves bare blazing glass with a few finger streaks; its sand
// hangs as an amber veil; and out of the settling veil sixty gemsbok are sifted into being from the hooves
// up (horns last, as two parallel strokes) already at full gallop, each dragging a smear of grains and
// stamping a row of prints across the clean glass. Everything is posed in vertex shaders and keyed to ONE
// progress value (the world's u), so it scrubs: nothing scripted reads wall-clock time.
//
// STYLE (so the world coder can match it; GLSL in COMMON below, copy it)
//   Light comes from below, tone is thickness. vec3 sandRamp(depthMetres, glass): 0 = bare glass (cream x
//   1.4 with dust, hairline scratches and a sliding cool sheen at grazing angles), 0.03 gold film, 0.14
//   orange, 1 m sienna, 3 m umber, 14 m umber-black. On anything deeper than ~3 m a slope term takes over:
//   windward (toward +Z here) sienna, slip faces umber, darkening with height, plus a 12 % rake from the
//   sun-print. Crests thin to a rim (depth forced to a film within ~1 m of the crest line). Animals are the
//   same sand: equivalent depth 6 m x exp(-6 x fresnel), so the silhouette edge burns gold; markings are
//   "wiped" to cream 1.2; grain is an unmoving object/world-anchored stipple faded by fwidth. No top light, no
//   cast shadows. Sand in the air (veil, crest smoke, hoof puffs) is alpha-blended amber, never additive.
//
// LOCAL SPACE  origin = centre of the dune's footprint on the glass (y = 0), +Y up. The dune's long axis is
//   X, its windward face looks toward +Z (the camera side, "front"). The camera of the brief flies toward
//   -X along z = +210 with the dune on its right; the wipe sweeps from +X to -X, overtaking it. The herd's
//   centre line is z = +190 (bull at z = +202, 8 m from the path). Sun-print: 75 deg left of heading, 25 up.
// SIZE   dune 420 x 290 m, 90 m high (hero.radius 250, height 90). Mesh covers the rectangle
//   x -235..235, z -150..150 (anchors.footprint); after the wipe it lies flat at y = opts.lift.
//   Gemsbok 1.25 m at the shoulder, ~2.2 m to the horn tips at the gallop; herd column 70 m x 12 m.
// COST   ~107k triangles, 6 draw calls (dune, glass pane, gemsbok, prints, smear trails, grain sprites),
//   no lights, no textures, ~150 ms build.
// LIGHT  Self-lit custom ShaderMaterials (linear HDR, scene fog). It needs no lights at all. Give the world
//   a warm cream/amber fog. Bare glass emits opts.glassEmit (default 1.0, just under a 0.9 bloom threshold):
//   if you raise it toward the brief's 1.4, raise the bloom threshold with it, or the bloom of so much
//   bright glass washes the umber animals and dunes to tan. Three's ACES lifts mid-tones, so sienna and
//   umber are fed in darker than their hex (x0.62, x0.9) to land on the palette on screen.
//
// OPTS   palette   7 hex strings, brief order: cream glass, gold, orange, sienna, umber, umber-black, cool
//        hour      'morning' (default) | 'golden' (glass deepened to gold, sun 9 deg) | 'night' (bone white)
//        weather   'wind' (default, crests smoking) | 'still' (little smoke) | 'fog' (cool glass sheen up)
//        cast      'gemsbok' (default) | 'calves' (a third of the herd are calves at heel)
//        count     gemsbok in the column (45-70, default 60 +- seed), plus the lead bull
//        track     [[x,y,z],...] herd centre line in local space, starting where the leader stands when the
//                  drawing begins; y is the ground the hooves plant on. Default: straight toward -X on
//                  z = 190 for 300 m, then bending 22 deg right. It is extended straight past both ends.
//        sentinels [{ pos:[x,y,z], yaw, size }] standing gemsbok (heads turning, tails flicking); default none
//        duration  seconds of the trip that u spans (40)       speed  herd speed m/s (16)
//        wipeU     [0.27, 0.37] u range of the wipe            drawU  [0.37, 0.42] u range of the drawing
//        wipeKeys  [[u, xFront], ...] optional shaped wipe: where the front (local x, 255 .. -305) is at each u
//        glassEmit emission of bare glass (1.0)
//        glass     false to omit the built-in glass pane (then cut or sink your own ground inside
//                  anchors.footprint, or raise the dune with opts.lift)
//        sunDir    [x,y,z] local direction toward the sun-print for the 12 % rake
//        lead      (u) => metres the leader has run along the track; must equal speed * (u * duration - drawU[0] *
//                  duration) until the drawing ends (prints are born on that line), free afterwards
//        bullA     where the big bull runs in the column, metres from the leader (default +3, in front)
//        bullLat   how far the bull runs to the camera's side of the centre line (default 12 m)
//        flank     [{ a, lat, sz, seed, gait, birth }] more runners placed by hand like the bull (a: metres from the leader,
//                  lat: metres to the camera's side); nothing else runs between them and the camera
//        shadow    [x, z, strength] every runner's shadow drawn in sand on level ground: the animal laid flat along
//                  (x, z) metres per metre of height (as the world's dead trees have theirs); default none
// HERO API (besides the contract)
//   setProgress(u)            the world's u every frame (also while seen through a portal: u = 0). Until it
//                             is called the piece runs a demo loop so the part viewer shows the event.
//   wipeAmount(u) / veilAmount(u)   0..1 (veilAmount is the eased gold-out for the world's fog ramp)
//   herdPoint(u, target, who) local position of 'bull' | 'lead' | 'mid' | 'tail' at u (for pois and paths)
//   uniforms                  shared uniforms (uGlass, uGold, ... uSun, uXf) if the world wants to match
// ANCHORS (local space)
//   flyThrough   ordered camera line, >= 6 m clear of everything (the bull runs 8 m to its right)
//   herdTrack    the resampled herd centre line          herdBirth  where the leader is drawn
//   footprint    { min:[x,z], max:[x,z] } rectangle the dune mesh covers
//   wipeFrom / wipeTo   where the palm enters and leaves (ground points)
//   viewpoints   { wipe:{pos,look}, gallop:{pos,look}, bull:{pos,look} } good camera placements
//   portalSeat   { position, facing } a seat for the 14 m ring if the piece is used alone (the brief seats
//                the real portal on the Great Dune, which the world builds)
//   sunDir       direction toward the sun-print
// ADDED (at the end of the file; nothing of the piece itself is changed by them)
//   COMB_GLSL                 float combStreaks(xz, fz): the combed strokes the fingers left behind the front (uniform uComb)
//   addGlassMarks(ctx, hero)  behind every runner its smear and its row of prints, for as far back as it has run on the glass
//   addFiles(ctx, hero, spec) more gemsbok of the same herd on lines of their own (the files that run on up the Great Dune's arm)
import * as THREE from 'three';

const DEF_PALETTE = ['#FFF1CF', '#F6B85A', '#D9772B', '#9E4420', '#4A2212', '#150A07', '#A9C3CC'];
const XB = 235, ZB = 150, WIPE_W = 50, NT = 40;
const STRIDE = 4.8, DUTY = 0.22, HIP_Y = 0.82, L1 = 0.48, L2 = 0.54;
const HIPS = [[0.13, -0.50], [-0.13, -0.50], [0.14, 0.36], [-0.14, 0.36]];   // hind L, hind R, front L, front R (x, z)
const LEG_OFF = [0.0, 0.1, 0.4, 0.5];
const PRINT_SLOTS = 20;

const COMMON = /* glsl */`
uniform vec3 uGlass, uGold, uOrange, uSienna, uUmber, uBlack, uCool, uSun;
uniform float uTime, uXf, uSeed, uSheen;
float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h31(vec3 p3){ p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y);
  float b = mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y);
  return mix(a, b, f.z); }
float fbm2(vec2 p){ return 0.5 * vn2(p) + 0.3 * vn2(p * 2.03 + 7.1) + 0.2 * vn2(p * 4.01 + 13.7); }
// tone is thickness: depth of sand in metres over the lit glass
vec3 sandRamp(float d, vec3 glass){
  vec3 c = mix(glass, uGold, smoothstep(0.0, 0.03, d));
  c = mix(c, uOrange, smoothstep(0.03, 0.14, d));
  c = mix(c, uSienna, smoothstep(0.14, 1.0, d));
  c = mix(c, uUmber, smoothstep(1.0, 3.2, d));
  return mix(c, uBlack, smoothstep(3.2, 14.0, d)); }
// the palm: everything with x beyond the front is gone; the fingers make the front wavy
float fingers(float z){ return 16. * sin(z * 0.041 + uSeed) + 9. * sin(z * 0.113 + 2.3 * uSeed) + 4. * sin(z * 0.29 + 1.7); }
float wipeGone(vec2 xz){ return smoothstep(0., ${WIPE_W.toFixed(1)}, xz.x + fingers(xz.y) - uXf); }
// between the fingers the palm leaves windrows: long low streaks of sand that wander, taper and break
float windrow(vec2 xz){
  float zc = xz.y / 37. + 0.35 * sin(xz.x * 0.013 + uSeed) + 0.5 * (vn2(vec2(xz.x * 0.021, 3.)) - 0.5);
  float zk = floor(zc), zf = abs(fract(zc) - 0.5);
  float sw = (0.05 + 0.12 * h11(zk + 5.)) * (0.4 + 0.9 * vn2(vec2(xz.x * 0.017 + zk * 7., 1.)));
  float brk = smoothstep(0.25, 0.5, vn2(vec2(xz.x * 0.011 + zk * 3.3, 7.)));
  float inR = (1. - smoothstep(118., 136., abs(xz.y))) * (1. - smoothstep(204., 224., abs(xz.x)));      // (clear of the footprint's own edge)
  return (1. - smoothstep(sw * 0.3, sw * 1.6 + 0.08, zf)) * brk * (0.45 + 0.55 * h11(zk + 2.)) * inR;
}
`;

const GLASS_LOOK = /* glsl */`
// bare glass: cream lamp with dust, hairline scratches, old smudges and the sliding cool sheen
vec3 glassLook(vec2 xz, vec3 V, float fw){
  vec3 g = uGlass * (0.89 + 0.13 * fbm2(xz * 0.03 + 3.1));
  float fine = vn2(xz * 1.9) - 0.5; g *= 1. - 0.07 * fine * (1. - clamp(fw * 1.9, 0., 1.));
  float c1 = dot(xz, vec2(0.83, 0.56)) * 0.21 + 2.5 * vn2(xz * 0.004), c2 = dot(xz, vec2(-0.31, 0.95)) * 0.13 + 1.5 * vn2(xz * 0.006 + 9.);
  float w1 = abs(fract(c1) - 0.5), w2 = abs(fract(c2) - 0.5);
  float s1 = (1. - smoothstep(0., 0.012 + fw * 0.35, w1)) * step(0.86, h11(floor(c1))) * smoothstep(0.55, 0.7, vn2(xz * 0.02 + floor(c1) * 3.7));
  float s2 = (1. - smoothstep(0., 0.012 + fw * 0.22, w2)) * step(0.88, h11(floor(c2) + 31.)) * smoothstep(0.55, 0.7, vn2(xz * 0.015 + floor(c2) * 5.3));
  g *= 1. - 0.13 * max(s1, s2) * (1. - clamp(fw * 0.25, 0., 1.));
  vec2 cell = floor(xz / 70.), cf = fract(xz / 70.) - 0.5;   // an old palm smudge here and there
  float sm = (1. - smoothstep(0.1, 0.42, length(cf + 0.3 * (vec2(h21(cell), h21(cell + 7.)) - 0.5)))) * step(0.6, h21(cell + 3.));
  g *= 1. - 0.035 * sm * (0.6 + 0.4 * sin(length(cf) * 90.));
  float fres = 1. - clamp(V.y, 0., 1.); fres *= fres; fres *= fres;
  float band = 0.5 + 0.5 * sin(dot(xz, vec2(0.011, 0.019)) - uTime * 0.22 + 5. * vn2(xz * 0.005));
  return mix(g, uCool * 1.25, clamp(fres * (0.12 + 0.5 * band) * uSheen, 0., 0.6));
}
`;
// what the palm's fingers left on the glass behind the front: a few long strokes lying along the gust, each one combed into
// hairlines of sand a hand apart that lift here and there, tapered to a point at both ends (uComb: x and z of its middle, half
// its length, half its width, dealt from a stream of their own). fz is how far one pixel reaches across the strokes.
const COMB_LOOK = /* glsl */`
uniform vec4 uComb[6];
float combStreaks(vec2 xz, float fz){
  float acc = 0.;
  for (int i = 0; i < 6; i++) {
    vec4 c = uComb[i]; float fi = float(i);
    float t = (xz.x - c.x) / max(c.z, 1.), tp = max(1. - t * t, 0.);
    float lat = xz.y - c.y - 5. * sin(xz.x * 0.012 + fi * 2.1) - 1.6 * sin(xz.x * 0.041 + fi * 4.7);
    float W = c.w * sqrt(tp), q = lat / 0.38, k = floor(q + 0.5), f = abs(q - k) * 0.38;
    float tw = 0.04 + 0.05 * h11(k + fi * 7.);
    float on = smoothstep(0.24, 0.44, vn2(vec2(xz.x * 0.03 + k * 5.3, fi + 0.5)));
    float line = (1. - smoothstep(tw, tw + 0.03 + fz * 0.8, f)) * on;
    float v = mix(line, 0.33 * on, clamp(fz * 2.4, 0., 1.)) * (1. - smoothstep(W - 0.25, W + 0.05, abs(lat))) * step(0.0001, tp);
    acc = max(acc, v * (0.55 + 0.45 * vn2(vec2(xz.x * 0.021 + fi * 3.3, k))));
  }
  return acc;
}
`;
// for the world's own ground and dune shaders: same uniforms (hero.uniforms), same sand ramp, same glass
export const SAND_GLSL = COMMON, GLASS_GLSL = GLASS_LOOK, COMB_GLSL = COMB_LOOK;

// the herd's centre line: NT evenly spaced points, Catmull-Rom between them, straight beyond both ends
const TRACK = /* glsl */`
uniform vec3 uTrk[${NT}]; uniform float uTrkDs;
uniform float uSLead, uClock, uT0, uSpeed, uPx;
void trackAt(float s, out vec3 p, out vec3 t){
  float f = s / uTrkDs; float fi = clamp(floor(f), 0., ${(NT - 2).toFixed(1)}); float k = f - fi; float kc = clamp(k, 0., 1.);
  int i = int(fi);
  vec3 p1 = uTrk[i], p2 = uTrk[i + 1];
  // (the end points are mirrored, so the line runs on straight at full pace beyond both ends)
  vec3 p0 = i > 0 ? uTrk[max(i - 1, 0)] : 2. * p1 - p2, p3 = i < ${NT - 2} ? uTrk[min(i + 2, ${NT - 1})] : 2. * p2 - p1;
  vec3 a = 2. * p1, b = p2 - p0, c = 2. * p0 - 5. * p1 + 4. * p2 - p3, d = -p0 + 3. * p1 - 3. * p2 + p3;
  vec3 tg = 0.5 * (b + 2. * c * kc + 3. * d * kc * kc);
  p = 0.5 * (a + b * kc + c * kc * kc + d * kc * kc * kc) + tg * (k - kc);
  t = tg / max(length(tg), 1e-4);
}
float herdLat(float lat, float s, float seed){
#ifdef FILES
  return lat + 0.3 * sin(s * 0.05 + seed * 6.283);
#endif
  return lat + 1.1 * sin(s * 0.021 + seed * 6.283); }
#ifdef FILES
// the files that run on up the arm beside our furrow: uFile = (metres along their line where they are sifted in, metres that takes,
// metres where the line ends, lift of marks over the sand); uFK = how the ground rises per metre out from the line, node by node.
// An animal's metres along its line are FILE_PACE (metres a second: a define of the files' materials, see addFiles) times the
// seconds of the flight's clock (uClock) since its own second (iB.x), the moment it left the herd's stream; nothing else moves it.
uniform vec4 uFile; uniform float uFK[${NT}];
float fileRise(float s, float lat){ float f = clamp(s / uTrkDs, 0., ${(NT - 1).toFixed(1)}), fi = min(floor(f), ${(NT - 2).toFixed(1)}); int i = int(fi); return lat * mix(uFK[i], uFK[i + 1], f - fi); }
#endif
`;

// ---------- small JS mirrors of the shader maths ----------
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const fingersJS = (z, seed) => 16 * Math.sin(z * 0.041 + seed) + 9 * Math.sin(z * 0.113 + 2.3 * seed) + 4 * Math.sin(z * 0.29 + 1.7);

function makeTrackJS(pts, ds) {
  const n = pts.length;
  return (s, out, tan) => {
    const f = s / ds, fi = Math.min(n - 2, Math.max(0, Math.floor(f))), k = f - fi, kc = Math.min(1, Math.max(0, k));
    const p1 = pts[fi], p2 = pts[fi + 1], p0 = fi > 0 ? pts[fi - 1] : null, p3 = fi < n - 2 ? pts[fi + 2] : null;
    const ax = ['x', 'y', 'z']; const tg = [0, 0, 0], pp = [0, 0, 0];
    for (let j = 0; j < 3; j++) {
      const c1 = p1[ax[j]], c2 = p2[ax[j]], c0 = p0 ? p0[ax[j]] : 2 * c1 - c2, c3 = p3 ? p3[ax[j]] : 2 * c2 - c1;
      const a = 2 * c1, b = c2 - c0, c = 2 * c0 - 5 * c1 + 4 * c2 - c3, d = -c0 + 3 * c1 - 3 * c2 + c3;
      tg[j] = 0.5 * (b + 2 * c * kc + 3 * d * kc * kc);
      pp[j] = 0.5 * (a + b * kc + c * kc * kc + d * kc * kc * kc) + tg[j] * (k - kc);
    }
    out.set(pp[0], pp[1], pp[2]);
    if (tan) tan.set(tg[0], tg[1], tg[2]).normalize();
    return out;
  };
}

// ---------- the dune: a knife crest on an S-curve, scalloped feet, height baked per vertex ----------
function makeDuneShape(rng) {
  const sAmp = rng.range(18, 26) * rng.sign(), sPh = rng.range(-0.5, 0.5), wob = rng.range(3, 6), wobPh = rng.range(0, 6.28);
  const x1 = rng.range(15, 70), x2 = -115 - 20 * rng(), h1 = 0.7 + 0.12 * rng(), sad = rng.range(0.5, 0.6);
  const scPh = rng.range(0, 6.28), scPh2 = rng.range(0, 6.28);
  const crestZ = (x) => sAmp * Math.sin((x / 420) * Math.PI * 2 + sPh) + wob * Math.sin(x * 0.047 + wobPh);
  const crestH = (x) => {
    // (the higher summit is the forward one: it still stands, a third of the frame high, while the palm's front is beside us)
    const e = Math.max(0, 1 - Math.pow(Math.abs(x + 15) / 212, 4));
    const b1 = h1 * Math.exp(-Math.pow((x - x1) / 85, 2)), b2 = Math.exp(-Math.pow((x - x2) / 68, 2));
    const m = Math.max(b1, b2) + sad * (1 - Math.max(b1 / h1, b2)) * 0.9;
    return 95 * Math.pow(e, 0.8) * Math.min(1, m) * (1 + 0.03 * Math.sin(x * 0.11 + scPh));
  };
  const ridged = (v) => 1 - Math.abs(Math.sin(v));
  const height = (x, z) => {
    const hc = crestH(x); if (hc <= 0.01) return 0;
    const dz = z - crestZ(x), edge = 1 - sstep(ZB - 14, ZB - 1, Math.abs(z));
    if (dz >= 0) {   // windward, toward +Z: rounded shoulder, buttressed foot
      const w = (36 + 0.85 * hc) * (0.78 + 0.18 * ridged(x * 0.045 + scPh) + 0.06 * ridged(x * 0.13 + scPh2));
      const t = Math.min(1, dz / w); return edge * hc * Math.pow(1 - Math.pow(t, 1.12), 1.7);
    }
    const w = (26 + 0.95 * hc) * (0.9 + 0.16 * ridged(x * 0.06 + scPh2));   // slip face: straight and steep, cuspate foot
    const t = Math.min(1, -dz / w); return edge * hc * Math.pow(1 - t, 1.4);
  };
  return { crestZ, crestH, height, x1 };
}

async function buildDuneGeometry(shape, pause) {
  const NX = 230, NZ = 96, JC = 44, nv = (NX + 1) * (NZ + 1);
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), aD = new Float32Array(nv * 2);
  const zAt = (x, j) => {
    const zc = shape.crestZ(x);
    if (j <= JC) return zc - (ZB + zc) * Math.pow((JC - j) / JC, 1.9);
    return zc + (ZB - zc) * Math.pow((j - JC) / (NZ - JC), 1.9);
  };
  for (let j = 0, v = 0; j <= NZ; j++) {
    for (let i = 0; i <= NX; i++, v++) {
      const x = -XB + (2 * XB * i) / NX, z = zAt(x, j);
      pos[v * 3] = x; pos[v * 3 + 1] = shape.height(x, z); pos[v * 3 + 2] = z;
      aD[v * 2] = z - shape.crestZ(x); aD[v * 2 + 1] = shape.crestH(x);
    }
    if (pause && j % 12 === 11) await pause();
  }
  // normals from the analytic height, one-sided at the crest row so the blade stays a blade
  const e = 0.35;
  for (let j = 0, v = 0; j <= NZ; j++) {
    for (let i = 0; i <= NX; i++, v++) {
      const x = pos[v * 3], z = pos[v * 3 + 2], side = j < JC ? -1 : 1, zz = j === JC ? z + 0.5 : z;
      const dx = (shape.height(x + e, zz) - shape.height(x - e, zz)) / (2 * e);
      const dzv = (shape.height(x, zz + e * side) - shape.height(x, zz)) / (e * side);
      const l = Math.hypot(dx, 1, dzv); nor[v * 3] = -dx / l; nor[v * 3 + 1] = 1 / l; nor[v * 3 + 2] = -dzv / l;
    }
    if (pause && j % 6 === 5) await pause();
  }
  const idx = new Uint32Array(NX * NZ * 6);
  for (let j = 0, k = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aD', new THREE.BufferAttribute(aD, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 300);
  return g;
}

// ---------- ground shader: the dune (wiped in the vertex shader) and the optional glass pane ----------
const GROUND_VERT = /* glsl */`
#ifdef DUNE
attribute vec2 aD;
#endif
uniform float uLift;
varying vec3 vW; varying vec3 vN; varying float vH; varying float vY; varying vec2 vD;
${COMMON}
#include <fog_pars_vertex>
void main(){
  vec3 p = position; vec3 n = vec3(0., 1., 0.); vH = 0.; vY = 0.; vD = vec2(1000., 0.);
#ifdef DUNE
  float g = wipeGone(p.xz);
  float lf = (p.x + fingers(p.z) - uXf + 14.) / 18.;
  float lip = exp(-lf * lf) * smoothstep(0.5, 8., p.y);   // sand heaped ahead of the palm
  vH = p.y; vY = p.y * (1. - g) + 9. * lip * (1. - g) + g * 2.8 * windrow(p.xz); vD = aD;      // (the windrows stand a couple of metres high, so they read at a grazing angle)
  n = normalize(mix(normal, vec3(0., 1., 0.), g));
  p.y = vY + uLift;
#endif
  vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const GROUND_FRAG = /* glsl */`
uniform vec4 uRect; uniform mat4 uInv;
varying vec3 vW; varying vec3 vN; varying float vH; varying float vY; varying vec2 vD;
${COMMON}
#include <fog_pars_fragment>
${GLASS_LOOK}
${COMB_LOOK}
void main(){
  vec3 lw = (uInv * vec4(vW, 1.)).xyz;           // hero-local position: the sand is anchored to the piece
  vec3 V = normalize(cameraPosition - vW);
  float fw = fwidth(lw.x) + fwidth(lw.z);
  vec3 glass = glassLook(lw.xz, V, fw);
  vec3 col;
#ifdef DUNE
  float g = wipeGone(lw.xz);
  float n1 = fbm2(lw.xz * 0.08), n2 = vn2(lw.xz * 0.9);
  float d = max(vY, 0.) * (0.5 + 1.0 * n1);
  float inside = smoothstep(0.3, 5., vH);
  float st = vn2(vec2(lw.x * 0.008 + 5., lw.z * 0.21)), st2 = vn2(vec2(lw.x * 0.017, lw.z * 1.7 + 9.)), st3 = vn2(vec2(lw.x * 0.03 + 2., lw.z * 0.45));
  float stF = 1. - smoothstep(0.6, 4., fw);   // fingers fade out before they can alias into dashes
  d += g * 0.25 * windrow(lw.xz) * (0.45 + 0.55 * st3) + g * inside * (stF * (0.12 * smoothstep(0.68, 0.92, st) * (0.45 + 0.55 * st3) + 0.03 * smoothstep(0.62, 0.9, st2) * (1. - clamp(fw * 1.2, 0., 1.))));
  d += g * 0.05 * combStreaks(lw.xz, fwidth(lw.z));
  d *= 1. + 0.5 * (n2 - 0.5) * (1. - clamp(fw * 0.9, 0., 1.));
  // the crest is a thin blade: it burns
  float standing = (1. - g) * smoothstep(2., 10., vH);
  // (a wedge: its thickness grows with distance below the crest line; kept >= ~2 px wide on screen)
  float below = max(abs(vD.x) - fw * 1.3, 0.) * mix(1., 0.8, step(0., vD.x));
  float blade = 0.025 + 0.04 * n2 + below * (0.22 + 0.2 * n1) + below * below * 0.02;
  float dEff = mix(d, min(d, blade), standing);
  col = sandRamp(dEff, glass);
  // form inside the darks: windward sienna, slip umber, heart umber-black, 12 % rake from the sun-print
  vec3 N = normalize(vN + vec3(1e-5));
  float rpF = 1. - clamp(fw * 0.35, 0., 1.);
  float rp = sin(dot(lw.xz, vec2(0.25, 1.9)) + 7. * n1 + 2. * vn2(lw.xz * 0.21)) * rpF;
  float facing = smoothstep(-0.2, 0.6, N.z * 0.9 + N.y * 0.2);
  float hgt = smoothstep(3., 85., vY);
  vec3 form = mix(uUmber * 0.8, mix(uSienna, uUmber, 0.5), facing) * mix(1.05, 0.3, sqrt(hgt)) * (1. + 0.22 * rp * facing);
  form = mix(form, uBlack, smoothstep(0.3, 1., hgt) * mix(0.9, 0.45, facing));
  form += uOrange * 0.12 * max(dot(normalize(N + vec3(0.25 * rp, 0., 0.)), uSun), 0.) * mix(1., 0.5, hgt);
  // avalanche tongues slide down the slip face
  float lee = step(vD.x, 0.);
  float cx = lw.x / 11. + 0.6 * vn2(vec2(lw.x * 0.03, 2.)); float ci = floor(cx);
  float hd = fract(uTime * (0.035 + 0.03 * h11(ci)) + h11(ci + 9.)) * 110.;
  float tongue = (1. - smoothstep(hd - 3., hd, -vD.x)) * smoothstep(hd - 46., hd - 6., -vD.x) * (1. - smoothstep(0.1, 0.45, abs(fract(cx) - 0.5))) * step(0.45, h11(ci + 3.));
  form = mix(form, uSienna * 0.9, lee * tongue * 0.6 * rpF);
  col = mix(col, form, smoothstep(1.6, 5., dEff));
#else
  if (lw.x > uRect.x && lw.x < uRect.z && lw.z > uRect.y && lw.z < uRect.w) discard;
  // far washes of thin sand so distance is drawn with thinner and thinner films
  float far = smoothstep(330., 700., length(lw.xz - vec2(0., 40.)));
  float wash = smoothstep(0.42, 0.72, fbm2(lw.xz * 0.0035 + uSeed)) * far;
  float comb = 0.6 + 0.4 * sin(dot(lw.xz, vec2(0.12, 0.9)) + 3. * vn2(lw.xz * 0.02)) * (1. - clamp(fw * 0.4, 0., 1.));
  col = sandRamp(wash * 0.16 * comb, glass);
#endif
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---------- gemsbok geometry: lofted rings, two-bone legs, straight horns, flick tail ----------
function buildGemsbokGeometry(lo = false) {      // lo: half the sides, for the shadows laid on the glass
  const ST = lo ? 6 : 12, SN = lo ? 4 : 8, SL = lo ? 3 : 6;
  const P = [], PART = [], RAD = [], PAINT = [], I = [];
  const add = (p, part, rad, paint) => { P.push(p[0], p[1], p[2]); PART.push(part[0], part[1], part[2], part[3]); RAD.push(rad[0], rad[1], rad[2]); PAINT.push(paint[0], paint[1], paint[2] ?? 0); return P.length / 3 - 1; };
  const basis = (d) => {
    const D = new THREE.Vector3(d[0], d[1], d[2]).normalize();
    const a = new THREE.Vector3(0, 1, 0).cross(D); if (a.lengthSq() < 1e-6) a.set(1, 0, 0); a.normalize();
    return { a, b: new THREE.Vector3().crossVectors(D, a), D };
  };
  // ring of `sides` vertices around c; fn(k, cos, sin) -> { part, paint, sx, sy, thin } per vertex
  const ring = (c, d, rx, ry, sides, fn) => {
    const { a, b } = basis(d); const start = P.length / 3;
    for (let k = 0; k < sides; k++) {
      const th = (k / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), o = fn(k, cs, sn);
      const ox = rx * cs * (o.sx ?? 1), oy = ry * sn * (o.sy ?? 1);
      const r = [a.x * ox + b.x * oy, a.y * ox + b.y * oy, a.z * ox + b.z * oy];
      add([c[0] + r[0], c[1] + r[1], c[2] + r[2]], o.part, o.rad ? r : [0, 0, 0], o.paint);
    }
    return start;
  };
  const join = (r0, r1, sides) => { for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; I.push(r0 + k, r0 + k1, r1 + k, r0 + k1, r1 + k1, r1 + k); } };
  const cap = (r, sides, p, part, paint, flip) => { const c = add(p, part, [0, 0, 0], paint); for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; if (flip) I.push(c, r + k1, r + k); else I.push(c, r + k, r + k1); } };
  const BODY = [0, 0, 0, 0];

  // torso: rump -> chest, barrel belly, narrow withers; belly line wiped to cream
  const T = [[-0.80, 1.08, 0.06, 0.05], [-0.72, 1.04, 0.21, 0.16], [-0.52, 1.02, 0.30, 0.225], [-0.22, 0.975, 0.315, 0.245], [0.10, 0.975, 0.34, 0.255], [0.36, 1.0, 0.345, 0.235], [0.56, 1.03, 0.27, 0.175], [0.67, 1.05, 0.14, 0.10]];
  let prev = -1;
  T.forEach((r, ri) => {
    const cur = ring([0, r[1], r[0]], [0, 0, 1], r[3], r[2], ST, (k, cs, sn) => ({
      part: BODY, sx: 1 - 0.3 * Math.max(sn, 0) + 0.06 * Math.max(-sn, 0), sy: sn < 0 ? 0.92 : 1,
      paint: [sn < -0.8 && ri >= 1 && ri <= 6 ? 1 : (sn < -0.4 && ri >= 1 && ri <= 2 && cs * cs < 0.9 ? 0.75 : 0), 0] }));
    if (prev >= 0) join(prev, cur, ST); else cap(cur, ST, [0, r[1], r[0] - 0.02], BODY, [0, 0], true);
    prev = cur;
  });
  cap(prev, ST, [0, 1.05, 0.70], BODY, [0, 0], false);

  // neck (weights rise along it) and the long wedge head with its mask
  const NECK = [[0.44, 1.06, 0.23, 0.15, 0.1], [0.62, 1.2, 0.185, 0.125, 0.45], [0.8, 1.34, 0.15, 0.105, 0.8], [0.95, 1.46, 0.125, 0.09, 1]];
  prev = -1;
  NECK.forEach((r) => {
    const cur = ring([0, r[1], r[0]], [0, 0.37, 0.48], r[3], r[2], SN, (k, cs, sn) => ({ part: [5, r[4], 0, 0], paint: [sn < -0.9 && r[4] > 0.3 ? 0.8 : 0, 0] }));
    if (prev >= 0) join(prev, cur, SN); prev = cur;
  });
  const hd = [0, -0.27, 0.43], hl = Math.hypot(hd[1], hd[2]);
  const HEAD = [[-0.04, 0.07, 0.065, 0], [0.07, 0.105, 0.085, 1], [0.2, 0.1, 0.08, 0], [0.34, 0.075, 0.062, 1], [0.44, 0.058, 0.052, 0.15], [0.5, 0.04, 0.042, 0]];
  const hc = (t) => [0, 1.50 + (hd[1] / hl) * t, 0.95 + (hd[2] / hl) * t];
  prev = -1;
  HEAD.forEach((r, ri) => {
    const cur = ring(hc(r[0]), hd, r[2], r[1], SN, (k, cs, sn) => ({ part: [5, 1, 0, 0], paint: [ri === 1 ? (sn > -0.3 ? 1 : 0.2) : r[3], 0.05] }));
    if (prev >= 0) join(prev, cur, SN); else cap(cur, SN, hc(-0.07), [5, 1, 0, 0], [0, 0], true);
    prev = cur;
  });
  cap(prev, SN, hc(0.53), [5, 1, 0, 0], [0, 0.1], false);
  // horns: two long straight strokes, laid back; widened in the shader so they never thin below ~1.5 px
  for (const sgn of [-1, 1]) {
    const hb = [0.045 * sgn, 1.565, 0.955], hdir = [0.09 * sgn, 0.6, -0.8], hlen = 0.96, hn = Math.hypot(...hdir);
    prev = -1;
    [[0, 0.03], [0.33, 0.024], [0.66, 0.017], [0.97, 0.008]].forEach((r) => {
      const c = [hb[0] + (hdir[0] / hn) * hlen * r[0], hb[1] + (hdir[1] / hn) * hlen * r[0], hb[2] + (hdir[2] / hn) * hlen * r[0]];
      const cur = ring(c, hdir, r[1], r[1], 4, () => ({ part: [5, 1, 0, 0], rad: true, paint: [0, 0.12] }));
      if (prev >= 0) join(prev, cur, 4); prev = cur;
    });
    cap(prev, 4, [hb[0] + (hdir[0] / hn) * hlen, hb[1] + (hdir[1] / hn) * hlen, hb[2] + (hdir[2] / hn) * hlen], [5, 1, 0, 0], [0, 0.3], false);
    // ear: a small leaf
    const e0 = add([0.07 * sgn, 1.5, 0.92], [5, 1, 0, 0], [0, 0, 0], [0, 0.2]), e1 = add([0.16 * sgn, 1.57, 0.9], [5, 1, 0, 0], [0, 0, 0], [0.9, 0.5]);
    const e2 = add([0.25 * sgn, 1.56, 0.84], [5, 1, 0, 0], [0, 0, 0], [0, 0.7]), e3 = add([0.15 * sgn, 1.49, 0.87], [5, 1, 0, 0], [0, 0, 0], [0.9, 0.5]);
    I.push(e0, e1, e3, e1, e2, e3);
  }
  // tail: thin stalk and a loose black tuft
  prev = -1;
  [[0, 0.024], [0.3, 0.018], [0.55, 0.05], [0.8, 0.055], [1, 0.012]].forEach((r) => {
    const cur = ring([0, 1.12 - 0.7 * r[0], -0.77 - 0.09 * r[0]], [0, -0.99, -0.13], r[1], r[1], 4, () => ({ part: [6, r[0], 0, 0], rad: true, paint: [0, 0.15 + 0.5 * r[0]] }));
    if (prev >= 0) join(prev, cur, 4); prev = cur;
  });
  // legs: straight in the rest pose; the shader solves hip -> knee -> hoof. part = (leg 1..4, t, radial x, radial fore-aft)
  HIPS.forEach((h, li) => {
    const hind = li < 2;
    const R = hind
      ? [[0, 0.085, 0.17], [0.2, 0.07, 0.125], [0.47, 0.042, 0.06], [0.55, 0.033, 0.042], [0.88, 0.027, 0.032], [0.93, 0.04, 0.05], [1, 0.046, 0.058]]
      : [[0, 0.08, 0.12], [0.2, 0.062, 0.088], [0.47, 0.04, 0.048], [0.55, 0.031, 0.037], [0.88, 0.026, 0.03], [0.93, 0.04, 0.048], [1, 0.045, 0.056]];
    prev = -1;
    R.forEach((r) => {
      const y = HIP_Y * (1 - r[0]), start = P.length / 3;
      for (let k = 0; k < SL; k++) {
        const th = (k / SL) * Math.PI * 2, ox = r[1] * Math.cos(th), of = r[2] * Math.sin(th);
        const stocking = r[0] > 0.5 && r[0] < 0.9 ? 1 : 0;
        add([h[0] + ox, y, h[1] + of], [li + 1, r[0], ox, of], [0, 0, 0], [stocking, r[0] > 0.4 ? 0.3 : 0.05, 1]);
      }
      if (prev >= 0) join(prev, start, SL); prev = start;
    });
    cap(prev, SL, [h[0], 0, h[1]], [li + 1, 1, 0, 0], [0, 0.3], false);
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(PART, 4));
  g.setAttribute('aRad', new THREE.Float32BufferAttribute(RAD, 3));
  g.setAttribute('aPaint', new THREE.Float32BufferAttribute(PAINT, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

// ---------- gemsbok shader: gallop with planted hooves, drawn in from the hooves up ----------
const HERD_DEFS = /* glsl */`
#define STRIDE ${STRIDE.toFixed(2)}
#define DUTY ${DUTY.toFixed(3)}
#define HIP_Y ${HIP_Y.toFixed(3)}
#define L1 ${L1.toFixed(3)}
#define L2 ${L2.toFixed(3)}
// per leg: hip (x, z), phase offset. Leg ids 0 hind L, 1 hind R, 2 front L, 3 front R
vec3 legInfo(float li){ float hind = step(li, 1.5), left = step(mod(li, 2.), 0.5);
  return vec3(mix(-1., 1., left) * mix(0.14, 0.13, hind), mix(0.36, -0.50, hind), mix(0.4, 0., hind) + mix(0.1, 0., left)); }
`;

const GEMS_VERT = /* glsl */`
attribute vec4 aPart; attribute vec3 aRad; attribute vec3 aPaint;
attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
uniform float uDrawDur; uniform vec3 uShadow;
varying vec3 vRest; varying vec3 vN; varying vec3 vW; varying vec3 vPaint; varying vec4 vI;
${COMMON}${TRACK}${HERD_DEFS}
#include <fog_pars_vertex>
vec3 pitchBob(vec3 p, float sz, float cp, float sp, float bob){
  float y0 = p.y - 0.9 * sz; return vec3(p.x, y0 * cp + p.z * sp + 0.9 * sz + bob, p.z * cp - y0 * sp); }
void main(){
  float sz = iA.z, seed = iA.w, stand = iB.z, run = 1. - iB.z;
  float stride = STRIDE * sz;
  float s = uSLead + iA.x;
#ifdef FILES
  s = FILE_PACE * (uClock - iB.x);
#endif
  float q = (s / stride + iB.y) * run;
  vec3 O, T; trackAt(s, O, T);
  vec3 Nn = vec3(T.z, 0., -T.x); Nn /= max(length(Nn), 1e-4);
  O += Nn * herdLat(iA.y, s, seed);
#ifdef FILES
  O.y += fileRise(s, herdLat(iA.y, s, seed));
#endif
  if (stand > 0.5) { O = iC.xyz; T = vec3(sin(iC.w), 0., cos(iC.w)); Nn = vec3(T.z, 0., -T.x); }
  vec3 U = cross(T, Nn);
  float draw = mix(clamp((uClock - iB.x) / uDrawDur, 0., 1.), 1., stand);
#ifdef FILES
  draw = clamp((s - uFile.x) / uFile.y, 0., 1.) * step(s, uFile.z);
#endif
  float bob = 0.05 * sz * sin(6.2832 * (q + 0.62)) * run;
  float pitch = 0.06 * cos(6.2832 * (q - 0.15)) * run;
  float cp = cos(pitch), sp = sin(pitch);
  vec3 Ow = (modelMatrix * vec4(O, 1.)).xyz;
  float rMin = 0.8 * length(cameraPosition - Ow) / max(uPx, 1.);
  float kind = aPart.x;
  vec3 lp = position * sz; vec3 ln = normal;
  if (kind > 0.5 && kind < 4.5) {
    vec3 info = legInfo(kind - 1.); float hind = step(kind - 1., 1.5);
    float ql = q - info.z, ph = fract(ql), n = floor(ql);
    float x = clamp((ph - DUTY) / (1. - DUTY), 0., 1.);
    float e = 0.5 * (x + x * x * (3. - 2. * x));
    float sTd = (n + info.z - iB.y) * stride;                       // where the body was at touchdown
    float sF = sTd + info.y * sz + 0.5 * DUTY * stride + stride * e;  // the print: fixed for the whole stance
    vec3 PF, TF; trackAt(sF, PF, TF);
    vec3 NF = vec3(TF.z, 0., -TF.x); NF /= max(length(NF), 1e-4);
    PF += NF * herdLat(iA.y, sF, seed);
#ifdef FILES
    PF.y += fileRise(sF, herdLat(iA.y, sF, seed));
#endif
    float sx = sin(3.14159 * x);
    vec3 rel = PF - O;
    vec2 Ff = vec2(dot(rel, T), dot(rel, U) + sz * mix(0.44, 0.34, hind) * sx * (0.55 + 0.45 * sx));
    Ff = mix(Ff, vec2((info.y + mix(0.03, -0.05, hind)) * sz, 0.), stand);
    vec3 H3 = pitchBob(vec3(info.x, HIP_Y, info.y) * sz, sz, cp, sp, bob);
    vec2 Hh = vec2(H3.z, H3.y);
    vec2 dv = Ff - Hh; float dl0 = max(length(dv), 1e-3); vec2 dir = dv / dl0;
    float Lt = (L1 + L2) * sz; float dl = min(dl0, Lt * 0.995);
    float Le = max(clamp(dl * mix(1.02, 1.07, hind), 0.8 * Lt, Lt), dl * 1.002);
    float l1 = Le * L1 / (L1 + L2), l2 = Le - l1;
    float a1 = (l1 * l1 - l2 * l2 + dl * dl) / (2. * dl);
    float hk = sqrt(max(l1 * l1 - a1 * a1, 0.));
    vec2 K = Hh + dir * a1 + vec2(-dir.y, dir.x) * hk * mix(1., -1., hind);
    vec2 Fe = Hh + dir * dl;
    float t = aPart.y;
    vec2 d1 = K - Hh; d1 /= max(length(d1), 1e-4); vec2 d2 = Fe - K; d2 /= max(length(d2), 1e-4);
    vec2 c = t < 0.5 ? mix(Hh, K, t * 2.) : mix(K, Fe, (t - 0.5) * 2.);
    vec2 bd = mix(d1, d2, smoothstep(0.4, 0.6, t)); bd /= max(length(bd), 1e-4);
    vec2 bp = vec2(-bd.y, bd.x);
    vec2 o = aPart.zw * sz; o *= clamp(rMin / max(length(o), 1e-4), 1., 3.);
    lp = vec3(info.x * sz + o.x, c.y + bp.y * o.y, c.x + bp.x * o.y);
    ln = vec3(aPart.z, bp.y * aPart.w, bp.x * aPart.w) + vec3(1e-5, 0., 0.);
  } else {
    float rl = length(aRad) * sz;
    if (rl > 1e-5) lp += aRad * sz * (clamp(rMin / rl, 1., 5.) - 1.);
    if (kind > 5.5) {          // tail: streams back at the gallop, flicks when standing
      vec3 pv = vec3(0., 1.12, -0.77) * sz; float w = aPart.y;
      float ang = -w * (1.0 + 0.3 * sin(6.2832 * q + seed * 9.)) * run - w * 0.1 * stand;
      float ca = cos(ang), sa = sin(ang); vec3 r = lp - pv;
      lp = pv + vec3(r.x, r.y * ca + r.z * sa, r.z * ca - r.y * sa);
      float flick = smoothstep(0.2, 1., sin(uTime * 0.7 + seed * 50.));
      lp.x += w * w * sz * (run * 0.1 * sin(12.566 * q + seed * 20.) + stand * 0.25 * sin(uTime * 5. + seed * 30.) * flick);
    } else if (kind > 4.5) {   // neck and head: rock at the gallop; sentinels lift and turn their heads
      vec3 pv = vec3(0., 1.1, 0.46) * sz; float w = aPart.y;
      // a standing gemsbok carries its head high with the face tipped down, so the horns stand up-and-back
      float ha = -0.95 * stand * step(0.999, w); float chh = cos(ha), shh = sin(ha);
      vec3 hpv = vec3(0., 1.47, 0.94) * sz; vec3 rh = lp - hpv;
      lp = hpv + vec3(rh.x, rh.y * chh + rh.z * shh, rh.z * chh - rh.y * shh);
      ln = vec3(ln.x, ln.y * chh + ln.z * shh, ln.z * chh - ln.y * shh);
      float ang = w * (stand * 0.5 + run * (0.07 * sin(6.2832 * (q + 0.35)) - 0.03));
      float ca = cos(ang), sa = sin(ang); vec3 r = lp - pv;
      r = vec3(r.x, r.y * ca + r.z * sa, r.z * ca - r.y * sa);
      ln = vec3(ln.x, ln.y * ca + ln.z * sa, ln.z * ca - ln.y * sa);
      float yw = w * stand * 0.7 * sin(uTime * 0.45 + seed * 40.);
      float cy = cos(yw), sy = sin(yw);
      r = vec3(r.x * cy + r.z * sy, r.y, r.z * cy - r.x * sy);
      ln = vec3(ln.x * cy + ln.z * sy, ln.y, ln.z * cy - ln.x * sy);
      lp = pv + r;
    }
    lp = pitchBob(lp, sz, cp, sp, bob);
    ln = vec3(ln.x, ln.y * cp + ln.z * sp, ln.z * cp - ln.y * sp);
  }
  vec3 P = O + Nn * lp.x + U * lp.y + T * lp.z;
  vec3 Nl = Nn * ln.x + U * ln.y + T * ln.z;
  float hide = step(draw, 0.);
#ifdef SHADOW
  // the shadow is drawn in sand: the animal itself laid flat on the glass, away from the sun-print (level ground only)
  float hgt = max(P.y - O.y, 0.);
  P = vec3(P.x + uShadow.x * hgt, O.y + 0.045, P.z + uShadow.y * hgt);
  hide = max(hide, max(step(0.35, O.y), stand));
#endif
  vec4 wp = modelMatrix * vec4(P, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * Nl;
  vRest = position; vPaint = aPaint; vI = vec4(draw, seed, sz, stand);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  if (hide > 0.5) gl_Position = vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}`;

const GEMS_FRAG = /* glsl */`
uniform vec3 uShadow;
varying vec3 vRest; varying vec3 vN; varying vec3 vW; varying vec3 vPaint; varying vec4 vI;
${COMMON}
#include <fog_pars_fragment>
void main(){
  float fw = fwidth(vRest.x) + fwidth(vRest.y) + fwidth(vRest.z);
  float gA = mix(vn3(vRest * 46. + vI.y * 17.), 0.5, clamp(fw * 30. - 0.3, 0., 1.));
  float gB = vn3(vRest * 8. + vI.y * 5.);
  // sifted in from the hooves up: a noisy rising edge with a thin burning fringe
  float edge = vI.x * 3.2 - 0.4 - vRest.y + (gB - 0.5) * 0.55 + (gA - 0.5) * 0.2;
  float drawing = 1. - step(0.999, vI.x);
  if (drawing > 0.5 && edge < 0.) discard;
  float fringe = (1. - smoothstep(0., 0.28, edge)) * drawing;
#ifdef SHADOW
  {   // a film of sifted sand, orange at its heart, with single grains missing: it is sifted in with the animal
    float fs = fwidth(vW.x) + fwidth(vW.z);
    float sn = vn2(vW.xz * 2.3), sg = vn2(vW.xz * 19.);
    if (sg < 0.3 * (1. - clamp(fs * 12., 0., 1.))) discard;
    vec3 sc = sandRamp((0.42 + 0.5 * sn) * (0.75 + 0.5 * sg) * uShadow.z + 0.02, uGlass);
    gl_FragColor = vec4(max(sc, 0.), 1.);
    #include <fog_fragment>
    return;
  }
#endif
  vec3 N = normalize(vN + vec3(1e-5)) * (gl_FrontFacing ? 1. : -1.);
  vec3 V = normalize(cameraPosition - vW);
  float rim = 1. - abs(dot(N, V)); rim = rim * rim * (0.35 + 0.65 * rim);
  float k = clamp(rim * 1.05 + vPaint.y * 0.2 * (0.4 + rim) + fringe * 0.9, 0., 1.);
  float dEq = 10. * exp(-7. * k) * (0.65 + 0.7 * gA);
  vec3 col = sandRamp(dEq, uGlass * 0.9);
  float wiped = smoothstep(0.4, 0.62, vPaint.x + (gB - 0.5) * 0.4 + (gA - 0.5) * 0.2);
  // wiped back to (nearly) bare glass; stockings keep a gold film so the legs still read on cream
  col = mix(col, mix(uGlass * (0.72 + 0.14 * gA), mix(uGold, uOrange, 0.25 + 0.5 * rim) * (0.6 + 0.3 * gA), vPaint.z), wiped);
  col += uSienna * 0.12 * max(dot(N, uSun), 0.) * (1. - wiped);
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---------- prints: instanced dabs pinned exactly where the hooves plant ----------
const PRINT_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;
varying vec2 vUv; varying float vA; varying float vSeed;
${COMMON}${TRACK}${HERD_DEFS}
#include <fog_pars_vertex>
void main(){
  float sz = iA.z, seed = iA.w, stride = STRIDE * sz;
  float s = uSLead + iA.x;
#ifdef FILES
  s = FILE_PACE * (uClock - iB.x);
#endif
  vec3 info = legInfo(iB.z);
  float ql = s / stride + iB.y - info.z, n = floor(ql), ph = fract(ql);
  float nr = n - mod(n - iB.w, ${PRINT_SLOTS.toFixed(1)});
  float sTd = (nr + info.z - iB.y) * stride;
  float sP = sTd + info.y * sz + 0.5 * DUTY * stride;
  float sBirth = uSpeed * (iB.x - uT0) + iA.x;
  float age = n - nr + ph;
  vA = step(sBirth, sTd) * step(iB.x, uClock) * (1. - smoothstep(${(PRINT_SLOTS * 0.6).toFixed(1)}, ${(PRINT_SLOTS - 0.6).toFixed(1)}, age)) * smoothstep(0., 0.04, age);
  vec3 O, T; trackAt(sP, O, T);
  vec3 Nn = vec3(T.z, 0., -T.x); Nn /= max(length(Nn), 1e-4);
  O += Nn * (herdLat(iA.y, sP, seed) + info.x * sz);
#ifdef FILES
  vA = step(uFile.x + 5., sTd) * step(sTd, uFile.z) * (1. - smoothstep(${(PRINT_SLOTS * 0.6).toFixed(1)}, ${(PRINT_SLOTS - 0.6).toFixed(1)}, age)) * smoothstep(0., 0.04, age);
  O.y += fileRise(sP, herdLat(iA.y, sP, seed) + info.x * sz) + uFile.w;
#endif
  vec3 P = O + (Nn * position.x * 0.13 + T * position.y * 0.19) * sz * 1.2 + vec3(0., 0.035, 0.);
  vUv = position.xy; vSeed = seed + nr * 0.37;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
  if (vA <= 0.) gl_Position = vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}`;
const PRINT_FRAG = /* glsl */`
varying vec2 vUv; varying float vA; varying float vSeed;
${COMMON}
#include <fog_pars_fragment>
void main(){
  // cloven hoof: two teardrops, pointed forward, with a feathered gold lip of displaced grains
  vec2 p = vUv; p.x = abs(p.x) - 0.3; p.y -= 0.1;
  float w = mix(0.3, 0.17, smoothstep(-0.6, 0.7, p.y));
  float dd = length(vec2(p.x / max(w, 0.05), p.y / 0.72));
  float n = vn2(vUv * 5. + vSeed * 13.);
  float body = 1. - smoothstep(0.55, 1.15, dd + (n - 0.5) * 0.5);
  float spray = (1. - smoothstep(0.3, 1., length(vUv * vec2(1., 0.8) + vec2(0., 0.25)))) * smoothstep(0.45, 0.8, n) * 0.5;
  float a = max(body, spray) * vA;
  if (a < 0.02) discard;
  vec3 col = sandRamp(mix(0.03, 5., body * body), uGold);
  gl_FragColor = vec4(max(col, 0.), clamp(a, 0., 1.));
  #include <fog_fragment>
}`;

// ---------- smear trails: one ribbon of dragged grains behind each animal ----------
const TRAIL_LEN = 40;
const TRAIL_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;
varying vec2 vUv; varying float vA; varying float vSeed;
${COMMON}${TRACK}
#include <fog_pars_vertex>
void main(){
  float sz = iA.z, seed = iA.w;
  float s = uSLead + iA.x;
#ifdef FILES
  s = FILE_PACE * (uClock - iB.x);
#endif
  float sv = s - 0.5 * sz - position.y * ${TRAIL_LEN.toFixed(1)};
  float sBirth = uSpeed * (iB.x - uT0) + iA.x;
  vA = smoothstep(0., 4., sv - sBirth) * step(iB.x, uClock) * (1. - position.y) * smoothstep(0., 0.03, position.y);
  vec3 O, T; trackAt(sv, O, T);
  vec3 Nn = vec3(T.z, 0., -T.x); Nn /= max(length(Nn), 1e-4);
  vec3 P = O + Nn * (herdLat(iA.y, sv, seed) + position.x * 0.5 * sz) + vec3(0., 0.02, 0.);
#ifdef FILES
  vA = smoothstep(0., 4., sv - uFile.x - 5.) * step(s, uFile.z) * (1. - position.y) * smoothstep(0., 0.03, position.y);
  P.y += fileRise(sv, herdLat(iA.y, sv, seed) + position.x * 0.5 * sz) + uFile.w;
#endif
  vUv = vec2(position.x, sv); vSeed = seed;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TRAIL_FRAG = /* glsl */`
varying vec2 vUv; varying float vA; varying float vSeed;
${COMMON}
#include <fog_pars_fragment>
void main(){
  float fw = fwidth(vUv.y);
  float st = vn2(vec2(vUv.x * 5. + vSeed * 31., vUv.y * 0.22)), st2 = vn2(vec2(vUv.x * 14. + vSeed * 7., vUv.y * 0.9));
  float edge = 1. - vUv.x * vUv.x; edge = 0.4 * edge * edge + 0.75 * (1. - smoothstep(0.1, 0.34, abs(vUv.x + 0.25 * (st2 - 0.5))));
  float a = edge * (0.25 + 0.75 * smoothstep(0.35, 0.75, st)) * mix(0.55 + 0.45 * st2, 0.8, clamp(fw * 1.5, 0., 1.)) * vA;
  vec3 col = sandRamp(0.015 + 0.13 * a * a, uGold);
  gl_FragColor = vec4(max(col, 0.), clamp(a * 0.62, 0., 1.));
  #include <fog_fragment>
}`;

// ---------- grains in the air: the veil, crest smoke, hoof puffs and the sifting threads of the drawing ----------
const SPRITE_VERT = /* glsl */`
attribute vec4 iP; attribute vec4 iQ;
uniform float uDrawDur;
varying vec2 vUv; varying vec3 vK; varying vec2 vF; varying vec2 vB;
${COMMON}${TRACK}${HERD_DEFS}
#include <fog_pars_vertex>
void main(){
  float kind = iQ.x, seed = iP.w; vec3 C = vec3(0.); float S = 1., A = 0., stretch = 1., hem = 0., nearB = 26.;
  float r1 = h11(seed * 7.13 + 1.), r2 = h11(seed * 3.71 + 2.), r3 = h11(seed * 11.3 + 3.);
  if (kind < 0.5) {            // the veil: thrown ahead by the palm, billowing across the path, settling
    float k = clamp(uClock - iQ.y, 0., 40.), life = iQ.z;
    float e1 = 1. - exp(-1.1 * k), e2 = 1. - exp(-1.4 * k);
    C = iP.xyz + vec3(-30. - 26. * r1, 0., 4. + 12. * r2) * e1 / 1.1 + vec3(-2.5, 0., 1.5 + 2. * r3) * k;   // it hangs behind the herd's line: the animals are drawn in front of it
    C.y = max(iP.y * (0.45 + 0.55 * exp(-0.3 * k)) + (12. + 26. * r3) * e2 - (0.7 + 0.9 * r1) * k - 0.05 * k * k, 0.3);
    hem = 22. * smoothstep(0.1, 0.9, k) * (0.7 + 0.6 * r2);      // behind the front the swept glass shows under it
    A = smoothstep(0., 0.35, k) * (1. - smoothstep(life * 0.4, life, k)) * smoothstep(0.3, 2.5, C.y) * (0.14 + 0.2 * r2) * (1. + 1.6 * exp(-0.7 * k));
    S = iQ.w * (0.45 + 0.95 * e2); stretch = 1.1;
  } else if (kind < 1.5) {     // crest smoke: every standing ridge streams grains to leeward
    float life = iQ.z, age = fract(uTime * iQ.y + seed) * life, f = age / life;
    C = iP.xyz + vec3(-0.5, 0., -0.86) * age * (9. + 8. * r1) + vec3(0., 1.2 * age - 0.2 * age * age + 0.8 * sin(age * 1.7 + seed * 6.), 0.);
    A = smoothstep(0., 0.1, f) * (1. - f) * (1. - smoothstep(0.02, 0.3, wipeGone(iP.xz))) * 0.8;
    S = iQ.w * (0.5 + 2.2 * f); stretch = 0.5;
  } else if (kind < 2.5 || kind > 3.5) {     // sand kicked up at each touchdown (kind 4: the dust of the stride before, still hanging low)
    float lag = step(3.5, kind);
    float sz = iP.z, stride = STRIDE * sz, s = uSLead + iP.x; vec3 info = legInfo(iQ.y);
    float ql = s / stride + iQ.z - info.z, n = floor(ql) - lag, ph = fract(ql) + lag;
    float sTd = (n + info.z - iQ.z) * stride, sP = sTd + info.y * sz + 0.5 * DUTY * stride;
    vec3 O, T; trackAt(sP, O, T);
    vec3 Nn = vec3(T.z, 0., -T.x); Nn /= max(length(Nn), 1e-4);
    float a = clamp(ph / mix(0.8, 2., lag), 0., 1.);
    C = O + Nn * (herdLat(iP.y, sP, seed) + info.x * sz + (r1 - 0.5) * 0.5 * lag) + vec3(0., 0.1 + mix(0.5, 0.75, lag) * a, 0.) - T * mix(1.0, 0.5, lag) * a;
    A = step(uSpeed * (iQ.w - uT0) + iP.x, sTd) * step(iQ.w, uClock) * (1. - a) * (1. - a) * smoothstep(0., 0.07, a) * mix(0.7, 0.42, lag);
    S = sz * mix(0.2 + 0.7 * a, 0.45 + 1.1 * a, lag);   // a kick of grains at the hoof, never a veil over the body
    nearB = 9.;
  } else {                     // the drawing: threads of grains falling onto the rising edge of each animal
    float sz = iP.z, s = uSLead + iP.x; vec3 O, T; trackAt(s, O, T);
    vec3 Nn = vec3(T.z, 0., -T.x); Nn /= max(length(Nn), 1e-4);
    float d = (uClock - iQ.w) / uDrawDur, fall = fract(iQ.y * 7.31 + uClock * 1.6);
    C = O + Nn * (herdLat(iP.y, s, seed) + (h11(iQ.y * 5.3) - 0.5) * 0.8 * sz) + T * (h11(iQ.y * 3.1) - 0.5) * 2.3 * sz;
    C.y += clamp(d, 0., 1.) * 2.5 * sz + (1. - fall) * sz * (1.2 + 2.2 * (1. - clamp(d, 0., 1.)));
    A = smoothstep(0., 0.12, d) * (1. - smoothstep(0.9, 1.2, d)) * (0.3 + 0.7 * fall) * 0.9;
    S = sz * (0.35 + 0.4 * h11(iQ.y * 9.7)); stretch = 2.6;
  }
  vec4 mvPosition = modelViewMatrix * vec4(C, 1.);
  A *= smoothstep(3., nearB, -mvPosition.z);
  mvPosition.xy += position.xy * S * vec2(1., stretch);
  vUv = position.xy; vK = vec3(A, kind, seed);
  vF = vec2(kind < 0.5 ? C.y + position.y * S * stretch : 100., r3); vB = vec2(hem, S);
  gl_Position = projectionMatrix * mvPosition;
  if (A <= 0.003) gl_Position = vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}`;
const SPRITE_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vK; varying vec2 vF; varying vec2 vB;
${COMMON}
#include <fog_pars_fragment>
void main(){
  float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
  float soft = (1. - r2); soft *= soft;
  // falling curtains: streaks run down the sprite, broken into grains
  // billows of loose grains with faint falling streaks; they sink into the glass without an edge
  float n = fbm2(vUv * 1.6 + vK.z * 37.), n1 = vn2(vec2(vUv.x * 4. + vK.z * 3., vUv.y * 0.7)), n2 = vn2(vUv * vec2(15., 9.) + vK.z * 11.);
  float a = soft * smoothstep(0.15, 0.8, n) * (0.55 + 0.45 * n1) * (0.6 + 0.8 * n2) * 1.7 * vK.x * smoothstep(0., 3.5, vF.x);
  // the veil's hem: below it only falling threads of grains, each of its own length
  float tx = vUv.x * vB.y, low = (1. - smoothstep(vB.x - 3., vB.x + 5., vF.x)) * smoothstep(0., 6., vB.x);
  float thr = smoothstep(0.64, 0.86, vn2(vec2(tx * 0.5 + vK.z * 13., vF.x * 0.04 + uTime * 0.3)));
  float tl = 2. + 9. * vn2(vec2(tx * 0.27 + vK.z * 5., 2.));
  a *= mix(1., 1.2 * thr * smoothstep(vB.x - tl - 3., vB.x - tl + 2., vF.x), low);
  if ((vK.y > 0.5 && vK.y < 2.5) || vK.y > 3.5) a = soft * (0.35 + 0.65 * n) * (0.55 + 0.6 * n2) * vK.x;   // smoke and puffs: finer, softer
  vec3 col = mix(uGold * 0.85, uOrange * 0.8, clamp(smoothstep(0.02, 0.22, a) * 0.7 + vF.y * 0.45, 0., 1.));
  col = mix(col, uSienna * 0.9, smoothstep(0.18, 0.55, a) * (0.4 + 0.5 * vF.y));
  gl_FragColor = vec4(max(col, 0.), clamp(a, 0., 0.92));
  #include <fog_fragment>
}`;

function instanced(base, attrs, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], 4));
  g.instanceCount = count;
  return g;
}
const quadGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };

// a stream of one's own, named: nothing the piece or the world already deals is disturbed by what is added
function ownStream(ctx, name) {
  const c = ctx.core;
  if (c && c.makeRng && c.hashSeed) return c.makeRng(c.hashSeed(name + ':' + ctx.seed));
  let a = 0x9e3779b9 ^ (name.length * 2654435761);
  const f = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (lo, hi) => lo + (hi - lo) * f();
  return f;
}
// the strokes the fingers left: six, spread from deep in the dune's footprint out to the glass the herd and the route run on
function dealComb(ctx) {
  const r = ownStream(ctx, 'namib-comb'), out = [];
  for (let i = 0; i < 6; i++) out.push(new THREE.Vector4(r.range(-150, 40), 44 + (148 * (i + r.range(0.15, 0.85))) / 6, r.range(80, 170), r.range(1.0, 2.2)));
  return out;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('namib-hero') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const hour = opts.hour || 'morning', weather = opts.weather || 'wind', cast = opts.cast || 'gemsbok';
  const DUR = opts.duration ?? 40, SPEED = opts.speed ?? 16;
  const [W0, W1] = opts.wipeU || [0.27, 0.37], [D0, D1] = opts.drawU || [0.37, 0.42];
  const T0 = D0 * DUR, DRAW_DUR = Math.max(0.5, (D1 - D0) * DUR * 0.45), BIRTH_SPAN = Math.max(0.1, (D1 - D0) * DUR - DRAW_DUR - 0.05);
  const seedF = rng.range(0, 6.28);
  const XF0 = XB + 20, XF1 = -XB - 20 - WIPE_W;
  const wKeys = Array.isArray(opts.wipeKeys) && opts.wipeKeys.length >= 2 ? opts.wipeKeys.map((k) => [k[0], (XF0 - k[1]) / (XF0 - XF1)]) : null;
  const wLin = (u) => {
    if (!wKeys) return (u - W0) / (W1 - W0);
    if (u <= wKeys[0][0]) return wKeys[0][1];
    for (let i = 1; i < wKeys.length; i++) if (u <= wKeys[i][0]) { const a = wKeys[i - 1], b = wKeys[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / Math.max(1e-6, b[0] - a[0]); }
    return wKeys[wKeys.length - 1][1];
  };
  const wipeAmount = (u) => THREE.MathUtils.clamp(wKeys ? 0.25 * (wLin(u - 0.004) + 2 * wLin(u) + wLin(u + 0.004)) : wLin(u), 0, 1);
  const WU0 = wKeys ? wKeys[0][0] - 0.004 : W0, WU1 = wKeys ? wKeys[wKeys.length - 1][0] + 0.004 : W1;
  const wipeUAt = (w) => { let lo = WU0, hi = WU1; for (let i = 0; i < 26; i++) { const m = 0.5 * (lo + hi); if (wipeAmount(m) < w) lo = m; else hi = m; } return 0.5 * (lo + hi); };

  // ----- palette and light -----
  const warm = rng.range(-0.04, 0.04);
  const emit = opts.glassEmit ?? 1.0;
  const glass = pal[0].clone().multiplyScalar(emit); glass.g *= 0.96; glass.b *= 0.72;
  if (hour === 'golden') glass.copy(pal[0]).lerp(pal[1], 0.65).multiplyScalar(emit * 0.93);
  if (hour === 'night') glass.set('#E6E2D6').lerp(pal[6], 0.25).multiplyScalar(emit * 0.68);
  glass.g *= 1 - warm; glass.b *= 1 - 2 * warm;
  const elev = (hour === 'golden' ? 9 : 25) * Math.PI / 180, az = 75 * Math.PI / 180;
  const sun = opts.sunDir ? new THREE.Vector3(...opts.sunDir).normalize()
    : new THREE.Vector3(-Math.cos(az) * Math.cos(elev), Math.sin(elev), Math.sin(az) * Math.cos(elev));
  const night = hour === 'night' ? 0.55 : 0;
  const tone = (c, m) => { const o = c.clone().multiplyScalar(m); if (night) { const l = (o.r + o.g + o.b) / 3; o.lerp(new THREE.Color(l, l, l * 1.1), night); } return o; };

  // ----- the herd's centre line -----
  const rawTrack = (opts.track && opts.track.length >= 2 ? opts.track : [[0, 0, 190], [-150, 0, 190], [-280, 0, 190], [-345, 0, 177], [-440, 0, 139], [-560, 0, 90]]).map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(rawTrack, false, 'centripetal');
  const trkPts = curve.getSpacedPoints(NT - 1), trkDs = curve.getLength() / (NT - 1);
  const trackAt = makeTrackJS(trkPts, trkDs);

  const U = {
    uGlass: { value: glass }, uGold: { value: tone(pal[1], 1.0) }, uOrange: { value: tone(pal[2], 0.95) }, uSienna: { value: tone(pal[3], 0.62) },
    uUmber: { value: tone(pal[4], 0.9) }, uBlack: { value: tone(pal[5], 1.0) }, uCool: { value: pal[6].clone() }, uSun: { value: sun },
    uTime: { value: 0 }, uXf: { value: XF0 }, uSeed: { value: seedF }, uSheen: { value: weather === 'fog' ? 1.6 : 1 },
    uTrk: { value: trkPts }, uTrkDs: { value: trkDs }, uSLead: { value: 0 }, uClock: { value: 0 }, uT0: { value: T0 }, uSpeed: { value: SPEED },
    uPx: { value: 500 }, uDrawDur: { value: DRAW_DUR }, uLift: { value: opts.lift ?? 0 },
    uShadow: { value: new THREE.Vector3(opts.shadow ? opts.shadow[0] : 0, opts.shadow ? opts.shadow[1] : 0, opts.shadow ? (opts.shadow[2] ?? 1) : 0) },
    uRect: { value: new THREE.Vector4(-XB + 0.2, -ZB + 0.2, XB - 0.2, ZB - 0.2) }, uInv: { value: new THREE.Matrix4() },
  };
  U.uComb = { value: dealComb(ctx) };
  const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  const object = new THREE.Group(); object.name = 'wind-draws-the-namib-hero';

  // ----- dune and glass -----
  const shape = makeDuneShape(rng);
  const pause = ctx.yield ? () => ctx.yield() : null;
  const dune = new THREE.Mesh(await buildDuneGeometry(shape, pause), mat(GROUND_VERT, GROUND_FRAG, { defines: { DUNE: 1 }, side: THREE.DoubleSide }));
  dune.frustumCulled = false; object.add(dune);
  await ctx.yield?.();
  if (opts.glass !== false) {
    const pg = new THREE.PlaneGeometry(6400, 6400, 1, 1); pg.rotateX(-Math.PI / 2);
    const pane = new THREE.Mesh(pg, mat(GROUND_VERT, GROUND_FRAG));
    pane.frustumCulled = false; object.add(pane);
  }

  // ----- the herd -----
  const want = Math.round(THREE.MathUtils.clamp(opts.count ?? rng.int(56, 64), 45, 70));
  const herd = [];   // { a, lat, sz, seed, gait, birth, stand, pos, yaw }
  const bullA = opts.bullA ?? 3, bullLat = opts.bullLat ?? 12;
  herd.push({ a: bullA, lat: bullLat, sz: 1.14, seed: rng(), gait: rng(), birth: T0 + 0.25 * BIRTH_SPAN, stand: 0 });
  const flank = Array.isArray(opts.flank) ? opts.flank : [];
  for (const f of flank) herd.push({ a: f.a, lat: f.lat, sz: f.sz ?? 1.04, seed: f.seed ?? 0.37, gait: f.gait ?? 0.3, birth: T0 + (f.birth ?? 0.5) * BIRTH_SPAN, stand: 0 });
  for (let tries = 0; herd.length < want + 1 + flank.length && tries < 6000; tries++) {
    const f = rng(), a = -70 * Math.pow(f, 0.85), lat = rng.range(-6, 6) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, f + 0.15)));
    if (herd.some((h) => Math.abs(h.a - a) < 2.9 && Math.abs(h.lat - lat) < 1.7)) continue;
    if (lat > 0.5 && a > bullA - 22 && a < bullA + 12) continue;      // the bull runs out on the camera's flank by himself: nothing between him and us, nothing at his heels
    if (flank.some((f) => lat > f.lat - 1.2 && Math.abs(a - f.a) < 6)) continue;      // (nor between us and the runners placed by hand)
    const calf = cast === 'calves' && herd.length > 6 && rng.chance(0.33);
    herd.push({ a, lat, sz: calf ? rng.range(0.58, 0.7) : rng.range(0.92, 1.07), seed: rng(), gait: rng(), birth: T0 + rng.range(0, BIRTH_SPAN), stand: 0 });
  }
  const runners = herd.length;
  const sentinels = (opts.sentinels || []).slice();
  for (const sn of sentinels) herd.push({ a: 0, lat: 0, sz: sn.size ?? rng.range(1.0, 1.1), seed: sn.seed ?? rng(), gait: 0, birth: -1e3, stand: 1, pos: sn.pos, yaw: sn.yaw ?? 0 });
  const nH = herd.length, iA = new Float32Array(nH * 4), iB = new Float32Array(nH * 4), iC = new Float32Array(nH * 4);
  herd.forEach((h, i) => { iA.set([h.a, h.lat, h.sz, h.seed], i * 4); iB.set([h.birth, h.gait, h.stand, 0], i * 4); if (h.pos) iC.set([h.pos[0], h.pos[1], h.pos[2], h.yaw], i * 4); });
  if (pause) await pause();
  const gemsGeo = buildGemsbokGeometry(); if (pause) await pause();
  const gems = new THREE.Mesh(instanced(gemsGeo, { iA, iB, iC }, nH), mat(GEMS_VERT, GEMS_FRAG, { side: THREE.DoubleSide }));
  gems.frustumCulled = false; object.add(gems);
  await ctx.yield?.();
  if (opts.shadow) {      // the runners' shadows (the same geometry, laid flat in the vertex shader)
    const sh = new THREE.Mesh(instanced(buildGemsbokGeometry(true), { iA, iB, iC }, runners), mat(GEMS_VERT, GEMS_FRAG, { side: THREE.DoubleSide, defines: { SHADOW: 1 }, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2 }));
    sh.frustumCulled = false; object.add(sh);
    await ctx.yield?.();
  }

  if (pause) await pause();
  // prints (ring buffer of PRINT_SLOTS footfalls per hoof) and smear trails
  const quad = quadGeo();
  const nP = runners * 4 * PRINT_SLOTS, pA = new Float32Array(nP * 4), pB = new Float32Array(nP * 4);
  for (let i = 0, k = 0; i < runners; i++) for (let l = 0; l < 4; l++) for (let r = 0; r < PRINT_SLOTS; r++, k++) {
    const h = herd[i]; pA.set([h.a, h.lat, h.sz, h.seed], k * 4); pB.set([h.birth, h.gait, l, r], k * 4);
  }
  // (no slope-scaled depth offset: at a grazing camera it would lift the marks over the legs and bodies standing in front of them)
  const blend = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2 };
  const prints = new THREE.Mesh(instanced(quad, { iA: pA, iB: pB }, nP), mat(PRINT_VERT, PRINT_FRAG, { ...blend, side: THREE.DoubleSide }));
  prints.frustumCulled = false; prints.renderOrder = 2; object.add(prints);
  const SEG = 24, rp = [], ri = [];
  for (let k = 0; k <= SEG; k++) { rp.push(-1, k / SEG, 0, 1, k / SEG, 0); if (k < SEG) { const a = k * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const ribbon = new THREE.BufferGeometry(); ribbon.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); ribbon.setIndex(ri);
  const tA = new Float32Array(runners * 4), tB = new Float32Array(runners * 4);
  for (let i = 0; i < runners; i++) { const h = herd[i]; tA.set([h.a, h.lat, h.sz, h.seed], i * 4); tB.set([h.birth, h.gait, 0, 0], i * 4); }
  const trails = new THREE.Mesh(instanced(ribbon, { iA: tA, iB: tB }, runners), mat(TRAIL_VERT, TRAIL_FRAG, { ...blend, side: THREE.DoubleSide }));
  trails.frustumCulled = false; trails.renderOrder = 1; object.add(trails);

  if (pause) await pause();
  // ----- grains in the air -----
  const nVeil = Math.round(2400 * detail), nSmoke = Math.round((weather === 'still' ? 160 : 720) * detail), nPuff = runners * 4, nDraw = runners * 10;
  const nS = nVeil + nSmoke + 2 * nPuff + nDraw, sP = new Float32Array(nS * 4), sQ = new Float32Array(nS * 4);
  let k = 0;
  for (let i = 0, tries = 0; i < nVeil && tries < nVeil * 30; tries++) {
    if (pause && (tries & 511) === 511) await pause();
    const x = rng.range(-212, 212), z = rng.range(-ZB, ZB), h = shape.height(x, z);
    if (h < 2.5 || rng() > 0.25 + h / 60) continue;
    const w = (XF0 - (x + fingersJS(z, seedF) - 0.4 * WIPE_W)) / (XF0 - XF1);
    sP.set([x, h * (0.25 + 0.75 * rng()), z, rng() * 100], k * 4);
    sQ.set([0, wipeUAt(THREE.MathUtils.clamp(w, 0, 1)) * DUR + rng.range(0, 0.3), rng.range(5, 9.5), rng.range(8, 20)], k * 4); k++; i++;
  }
  const nVeilMade = k;
  for (let i = 0; i < nSmoke; i++) {
    let x = rng.range(-205, 205); for (let t = 0; t < 6 && shape.crestH(x) < 8; t++) x = rng.range(-205, 205);
    const life = rng.range(3, 6.5);
    sP.set([x, shape.crestH(x) - 0.2, shape.crestZ(x), rng() * 100], k * 4); sQ.set([1, 1 / life, life, rng.range(4, 11)], k * 4); k++;
  }
  for (let i = 0; i < runners; i++) for (let l = 0; l < 4; l++) { const h = herd[i]; sP.set([h.a, h.lat, h.sz, h.seed], k * 4); sQ.set([2, l, h.gait, h.birth], k * 4); k++; }
  for (let i = 0; i < runners; i++) for (let j = 0; j < 10; j++) { const h = herd[i]; sP.set([h.a, h.lat, h.sz, h.seed], k * 4); sQ.set([3, rng() * 50 + 1, 0, h.birth], k * 4); k++; }
  for (let i = 0; i < runners; i++) for (let l = 0; l < 4; l++) { const h = herd[i]; sP.set([h.a, h.lat, h.sz, h.seed], k * 4); sQ.set([4, l, h.gait, h.birth], k * 4); k++; }
  const sprites = new THREE.Mesh(instanced(quad, { iP: sP, iQ: sQ }, k), mat(SPRITE_VERT, SPRITE_FRAG, { transparent: true, depthWrite: false }));
  sprites.frustumCulled = false; sprites.renderOrder = 5; object.add(sprites);
  await ctx.yield?.();

  // ----- progress -----
  const veilAmount = (u) => sstep(WU0 + 0.35 * (WU1 - WU0), WU1, u) * (1 - sstep(Math.max(D0, WU1) + 0.02, Math.max(D1, WU1) + 0.05, u));
  const _p = new THREE.Vector3(), _t = new THREE.Vector3();
  const leadS = typeof opts.lead === 'function' ? opts.lead : (u) => SPEED * (u * DUR - T0);
  const WHO = { bull: [bullA, bullLat, herd[0].seed], lead: [0, 0, 0], mid: [-32, 0, 0], tail: [-70, 0, 0] };
  const herdPoint = (u, target = new THREE.Vector3(), who = 'mid') => {
    const [a, lat, sd] = typeof who === 'number' ? [who, 0, 0] : (WHO[who] || WHO.mid), s = leadS(u) + a;
    trackAt(s, _p, _t);
    const l = who === 'bull' ? lat + 1.1 * Math.sin(s * 0.021 + sd * 6.283) : lat;
    return target.set(_p.x + _t.z * l, _p.y + 1.0, _p.z - _t.x * l);
  };

  const radius = 170, height = 90, center = new THREE.Vector3(-10, 22, 50);

  let progress = 0, progressSet = false;
  const _size = new THREE.Vector2();
  const update = (dt, time, camera) => {
    let u = progress;
    if (!progressSet) {
      u = 0.22 + 0.5 * ((((time - 7) / 26) % 1 + 1) % 1);   // in a world that never calls setProgress: a 26 s loop
    }
    const clock = u * DUR;
    U.uTime.value = time; U.uClock.value = clock; U.uSLead.value = leadS(u);
    U.uXf.value = XF0 + (XF1 - XF0) * wipeAmount(u);
    if (camera) {
      const hgt = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_size).y : 1080;
      U.uPx.value = 0.5 * hgt * camera.projectionMatrix.elements[5];
    }
    object.updateMatrixWorld(); U.uInv.value.copy(object.matrixWorld).invert();
  };
  update(0, 0, null);

  // ----- anchors -----
  const fly = [];
  for (let s = -330; s <= 500; s += 83) { trackAt(s, _p, _t); fly.push(new THREE.Vector3(_p.x + _t.z * 20, _p.y + (s < -120 ? 5 : 4), _p.z - _t.x * 20)); }
  trackAt(560, _p, _t);
  const anchors = {
    flyThrough: fly, herdTrack: trkPts.map((p) => p.clone()), herdBirth: trkPts[0].clone(),
    footprint: { min: [-XB, -ZB], max: [XB, ZB] },
    wipeFrom: new THREE.Vector3(XF0, 0, 0), wipeTo: new THREE.Vector3(-XB, 0, 0),
    viewpoints: {
      wipe: { pos: new THREE.Vector3(60, 5, 210), look: new THREE.Vector3(-60, 30, 0) },
      gallop: { pos: herdPoint(0.5, new THREE.Vector3(), 'tail').add(new THREE.Vector3(18, 3, 20)), look: herdPoint(0.5, new THREE.Vector3(), 'mid') },
      bull: { pos: herdPoint(0.61, new THREE.Vector3(), 'bull').add(new THREE.Vector3(2, 3, 8)), look: herdPoint(0.61, new THREE.Vector3(), 'bull') },
    },
    portalSeat: { position: new THREE.Vector3(_p.x + _t.z * 20, _p.y + 7.5, _p.z - _t.x * 20), facing: _t.clone().negate() },
    sunDir: sun.clone(),
  };

  return {
    object, radius, height, center, anchors, ground: false, groundY: 0,
    uniforms: U, wipeAmount, veilAmount, herdPoint, herdRows: herd, trackAt, leadS,
    setProgress(u) { progress = u; progressSet = true; },
    update, dispose() {},
    info: { gemsbok: runners, sentinels: nH - runners, veilSprites: nVeilMade, duneHeight: 90, trackLength: curve.getLength() },
  };
}

// ================= ADDED: what stays written on the glass, and the files that run on up the arm =================
// Nothing above is changed by these: they are meshes of their own, built from the herd's rows and the shared uniforms.

// ---------- the marks that stay: behind every runner its smear and its row of prints, for as far back as it has run ----------
// One ribbon per animal along its own lane, from where it was sifted in to a few metres behind it; it lies on the glass only
// (it thins out where the herd's line climbs off the glass). The piece's own trail and prints lie nearer the animal: this begins
// where those end, with the prints at the very places the hooves were planted.
const FAR_SEG = 24, FAR_SPAN = 360, FAR_HW = 0.42;
const FAR_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;
varying vec2 vUv; varying vec4 vI; varying float vA;
${COMMON}${TRACK}
#include <fog_pars_vertex>
void main(){
  float sz = iA.z, seed = iA.w;
  float sNow = uSLead + iA.x, sBirth = uSpeed * (iB.x - uT0) + iA.x;
  float sv = min(sBirth + position.y * ${FAR_SPAN.toFixed(1)}, sNow - 6.);
  vec3 O, T; trackAt(sv, O, T);
  vec3 Nn = vec3(T.z, 0., -T.x); Nn /= max(length(Nn), 1e-4);
  vA = step(iB.x, uClock) * step(sBirth + 1., sNow - 6.) * smoothstep(0., 4., sv - sBirth) * (1. - smoothstep(0.03, 0.4, O.y));
  vec3 P = O + Nn * (herdLat(iA.y, sv, seed) + position.x * ${FAR_HW.toFixed(2)} * sz) + vec3(0., 0.018, 0.);
  vUv = vec2(position.x * ${FAR_HW.toFixed(2)} * sz, sv); vI = vec4(sz, iB.y, seed, sNow - sv);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FAR_FRAG = /* glsl */`
varying vec2 vUv; varying vec4 vI; varying float vA;
${COMMON}${HERD_DEFS}
#include <fog_pars_fragment>
void main(){
  float sz = max(vI.x, 0.3), stride = STRIDE * sz, back = max(vI.w, 0.);
  float fwS = fwidth(vUv.y), fwL = fwidth(vUv.x);
  float st = vn2(vec2(vUv.x * 5. + vI.z * 31., vUv.y * 0.22)), st2 = vn2(vec2(vUv.x * 14. + vI.z * 7., vUv.y * 0.9));
  float core = 1. - smoothstep(0.07 * sz, 0.3 * sz + fwL, abs(vUv.x + 0.1 * (st2 - 0.5)));
  float smear = core * (0.25 + 0.75 * smoothstep(0.35, 0.75, st)) * mix(0.55 + 0.45 * st2, 0.8, clamp(fwS * 1.5, 0., 1.)) * smoothstep(8., 38., back);
  float pr = 0.;
  for (int l = 0; l < 4; l++) {
    vec3 info = legInfo(float(l));
    float off = (info.z - vI.y) * stride + info.y * sz + 0.5 * DUTY * stride;
    float fy = (fract((vUv.y - off) / stride + 0.5) - 0.5) * stride;
    vec2 p = vec2((vUv.x - info.x * sz) / (0.156 * sz), fy / (0.228 * sz));
    p.x = abs(p.x) - 0.3; p.y -= 0.1;
    float w = mix(0.3, 0.17, smoothstep(-0.6, 0.7, p.y));
    pr = max(pr, 1. - smoothstep(0.55, 1.15, length(vec2(p.x / w, p.y / 0.72))));
  }
  pr = mix(pr, 0.07, clamp(fwS * 1.4 - 0.25, 0., 1.)) * (1. - clamp(fwL * 3. - 0.4, 0., 1.)) * smoothstep(56., 90., back / sz);
  float a = max(smear * 0.5, pr * 0.92) * vA;
  if (a < 0.015) discard;
  vec3 col = mix(sandRamp(0.02 + 0.11 * smear * smear, uGold), sandRamp(2.6, uGold), pr);
  gl_FragColor = vec4(max(col, 0.), clamp(a, 0., 1.));
  #include <fog_fragment>
}`;
export async function addGlassMarks(ctx, hero) {
  const U = hero.uniforms, rows = hero.herdRows.filter((h) => !h.stand), n = rows.length;
  const rp = [], ri = [];
  for (let k = 0; k <= FAR_SEG; k++) { rp.push(-1, k / FAR_SEG, 0, 1, k / FAR_SEG, 0); if (k < FAR_SEG) { const a = k * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const ribbon = new THREE.BufferGeometry(); ribbon.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); ribbon.setIndex(ri);
  const tA = new Float32Array(n * 4), tB = new Float32Array(n * 4);
  rows.forEach((h, i) => { tA.set([h.a, h.lat, h.sz, h.seed], i * 4); tB.set([h.birth, h.gait, 0, 0], i * 4); });
  await ctx.yield?.();
  const m = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: FAR_VERT, fragmentShader: FAR_FRAG, fog: true,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(instanced(ribbon, { iA: tA, iB: tB }, n), m);
  mesh.frustumCulled = false; mesh.renderOrder = 1; hero.object.add(mesh);
  await ctx.yield?.();
  return { mesh, triangles: n * FAR_SEG * 2 };
}

// ---------- the files: gemsbok that run on up the arm, each on a line of its own beside our furrow ----------
// spec.lines: [{ pts: [[x, y, z, rise], ...] a dense line on the sand (rise: metres the ground rises per metre to the line's left),
//               sAt: metres the herd's leader has run when it is at the line's first point,
//               rows: [{ a, lat, sz, seed, gait }] (a: metres from the leader, as in the herd; lat: metres to the left of the line) }]
// spec.siftLen: metres along the line over which an animal is sifted in at its start; spec.lift: metres its marks lie over the sand;
// spec.duration: the seconds of the whole flight (the hero's clock is u times this);
// spec.eye(u, out): the eye's place on the route at u of the flight (the route's own point), written into out.
// An animal is there by where it is: from the line's start, where it is sifted in from the hooves up, to its end. It comes out of
// the herd's stream: its moment is the second of the flight's clock at which the herd's column (the hero's leadS) brings its seat
// (a) to the line's start (sAt). That moment and that place are all it takes from the herd. From then on it runs on its own: its
// metres along its line are FILE_PACE times the seconds of the flight's clock since its moment.
// THE CLEAR CORRIDOR. An animal that would be within FILE_CLEAR of the eye at any moment of the flight is left out whole: no
// body, no prints, no trail. The test is made once in build, for each animal: at every step of the flight's clock from the
// animal's own second to the end (while it is on its line), the distance from the eye's place on the route to the nearest point
// of the animal's body (its box in the rest pose, standing where the rule above and the files' shaders put it). The smallest
// of these decides. It reads where the eye is along the route and nothing else.
// The pace of a file animal, in metres a second. The design, setPiece and journey: 'The herd ... runs at 16 m/s, so we gain 4 m/s'.
const FILE_PACE = 16;
// The corridor a file animal leaves the eye, in metres. The contract for worlds (docs/WORLD_GUIDE.md): 'Keep a clear corridor:
// nothing solid within ~6 m of the path'.
const FILE_CLEAR = 6;
// the even steps of the whole flight the corridor is tested at (the eye moves a few hand's breadths between two)
const FILE_STEPS = 4000;
export async function addFiles(ctx, hero, spec) {
  const U = hero.uniforms, DUR = spec.duration, out = { lines: [], triangles: 0 };
  const gemsGeo = buildGemsbokGeometry(); await ctx.yield?.();
  const quad = quadGeo(), SEG = 24, rp = [], ri = [];
  for (let k = 0; k <= SEG; k++) { rp.push(-1, k / SEG, 0, 1, k / SEG, 0); if (k < SEG) { const a = k * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const ribbon = new THREE.BufferGeometry(); ribbon.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); ribbon.setIndex(ri);
  const blend = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2 };
  // the smallest distance, over the flight, between the eye on the route and the body of the animal of seat h whose second is t0
  // (at, ds, fk: its line, as the shaders have it; sEnd: the metres along it where an animal is gone)
  const box = new THREE.Box3().setFromBufferAttribute(gemsGeo.attributes.position), eyes = [], _o = new THREE.Vector3(), _t = new THREE.Vector3();
  const eyeAt = (k) => eyes[k] || (eyes[k] = spec.eye(k / FILE_STEPS, new THREE.Vector3()));
  const clearOf = (h, t0, at, ds, fk, sEnd) => {
    let best = Infinity;
    for (let k = Math.ceil(t0 / DUR * FILE_STEPS); k <= FILE_STEPS; k++) {
      const s = FILE_PACE * (k / FILE_STEPS * DUR - t0); if (s > sEnd) break;
      // where it stands: the shaders' trackAt, herdLat and fileRise of the FILES branches
      at(s, _o, _t);
      const nl = Math.max(Math.hypot(_t.x, _t.z), 1e-4), nx = _t.z / nl, nz = -_t.x / nl, lat = h.lat + 0.3 * Math.sin(s * 0.05 + h.seed * 6.283);
      const f = Math.min(NT - 1, Math.max(0, s / ds)), fi = Math.min(Math.floor(f), NT - 2), e = eyeAt(k);
      const dx = e.x - _o.x - nx * lat, dy = e.y - _o.y - lat * (fk[fi] + (fk[fi + 1] - fk[fi]) * (f - fi)), dz = e.z - _o.z - nz * lat;
      // the eye in the animal's own frame (to its side, up, along its line), and from there to the nearest point of its box
      const qx = dx * nx + dz * nz, qy = dx * _t.y * nz + dy * (_t.z * nx - _t.x * nz) - dz * _t.y * nx, qz = dx * _t.x + dy * _t.y + dz * _t.z;
      const ex = Math.max(box.min.x * h.sz - qx, 0, qx - box.max.x * h.sz), ey = Math.max(box.min.y * h.sz - qy, 0, qy - box.max.y * h.sz), ez = Math.max(box.min.z * h.sz - qz, 0, qz - box.max.z * h.sz);
      best = Math.min(best, Math.hypot(ex, ey, ez));
    }
    return best;
  };
  for (const ln of spec.lines) {
    // the line resampled to NT nodes evenly spaced along its length (as the herd's own line is)
    const P = ln.pts, cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]));
    const len = cum[cum.length - 1], ds = len / (NT - 1), nodes = [], fk = [];
    for (let k = 0, j = 0; k < NT; k++) {
      const s = Math.min(len, k * ds); while (j < P.length - 2 && cum[j + 1] < s) j++;
      const t = Math.min(1, Math.max(0, (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]))), a = P[j], b = P[j + 1];
      nodes.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)); fk.push(a[3] + (b[3] - a[3]) * t);
    }
    const uni = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uTrk: { value: nodes }, uTrkDs: { value: ds },
      uFile: { value: new THREE.Vector4(1, spec.siftLen ?? 12, len - 1, spec.lift ?? 0.05) }, uFK: { value: fk } };
    const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: uni, vertexShader: vs, fragmentShader: fs, fog: true, defines: { FILES: 1, FILE_PACE: FILE_PACE.toFixed(1) }, ...extra });
    const seats = ln.rows, at = makeTrackJS(nodes, ds);
    // each animal's moment, found once: the herd's count of metres only ever grows over the flight, so the second at which it
    // brings the seat to the line's start is found by halving the flight's span, forty times over. It is kept in iB.x, the
    // herd's slot for the second an animal is sifted in (what the herd's own lines make of that slot is replaced in the FILES branches)
    const second = seats.map((h) => { let lo = 0, hi = DUR; for (let k = 0; k < 40; k++) { const m = 0.5 * (lo + hi); if (hero.leadS(m / DUR) + h.a < ln.sAt) lo = m; else hi = m; } return 0.5 * (lo + hi); });
    // the clear corridor: each seat's smallest distance from the eye; the seats that keep the corridor stand, the others are left out
    const clear = [];
    for (let i = 0; i < seats.length; i++) { clear.push(clearOf(seats[i], second[i], at, ds, fk, len - 1)); await ctx.yield?.(); }
    const stand = seats.map((h, i) => i).filter((i) => clear[i] >= FILE_CLEAR);
    const rows = stand.map((i) => seats[i]), born = stand.map((i) => second[i]), n = rows.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
    rows.forEach((h, i) => { iA.set([h.a - ln.sAt, h.lat, h.sz, h.seed], i * 4); iB.set([born[i], h.gait, 0, 0], i * 4); });
    const gems = new THREE.Mesh(instanced(gemsGeo, { iA, iB, iC }, n), mat(GEMS_VERT, GEMS_FRAG, { side: THREE.DoubleSide }));
    gems.frustumCulled = false; hero.object.add(gems);
    await ctx.yield?.();
    const nP = n * 4 * PRINT_SLOTS, pA = new Float32Array(nP * 4), pB = new Float32Array(nP * 4);
    for (let i = 0, k = 0; i < n; i++) for (let l = 0; l < 4; l++) for (let r = 0; r < PRINT_SLOTS; r++, k++) { const h = rows[i]; pA.set([h.a - ln.sAt, h.lat, h.sz, h.seed], k * 4); pB.set([born[i], h.gait, l, r], k * 4); }
    const prints = new THREE.Mesh(instanced(quad, { iA: pA, iB: pB }, nP), mat(PRINT_VERT, PRINT_FRAG, { ...blend, side: THREE.DoubleSide }));
    prints.frustumCulled = false; prints.renderOrder = 2; hero.object.add(prints);
    const tA = new Float32Array(n * 4), tB = new Float32Array(n * 4);
    rows.forEach((h, i) => { tA.set([h.a - ln.sAt, h.lat, h.sz, h.seed], i * 4); tB.set([born[i], h.gait, 0, 0], i * 4); });
    const trails = new THREE.Mesh(instanced(ribbon, { iA: tA, iB: tB }, n), mat(TRAIL_VERT, TRAIL_FRAG, { ...blend, side: THREE.DoubleSide }));
    trails.frustumCulled = false; trails.renderOrder = 1; hero.object.add(trails);
    await ctx.yield?.();
    out.triangles += n * (gemsGeo.index.count / 3 + 4 * PRINT_SLOTS * 2 + SEG * 2);
    out.lines.push({ at, born, metres: (i, clock) => FILE_PACE * (clock - born[i]), length: len, sAt: ln.sAt, rows, clear });
  }
  return out;
}
