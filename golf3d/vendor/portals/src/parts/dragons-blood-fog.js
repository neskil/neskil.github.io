// THE FOGFALL AND ITS RIM GROVE: hero set piece of "dragons-blood-fog" (The Umbrella Forest).
//
// A block of limestone escarpment 860 m wide and 300 m sheer with a bay cut into its middle; on top a
// belt of dragon's-blood trees (own build: recursive fork into a dome of leaf rosettes, three levels of
// detail) standing in a racing sheet of fog. The sheet bends over the lip in one glassy curve, clings
// to the wall for about 80 m, peels off in curtains, tears into streamers and is gone 60 m above the floor.
//
// SPACE  Origin on the canyon floor under the middle of the escarpment line. +Y up. The cliff faces +Z
//        (south); the plateau lies toward -Z (north); +X is east. The rim is at y = 300 (anchors.rimY):
//        set hero.object.position.y = -300 to put the rim at the brief's datum 0. The bay recedes to
//        about z = -200 and the block ends at x = +-430 and about z = -400 (plain sides and back, meant to
//        be buried in the world's own terrain). Fog flows -Z to +Z. Returned radius 340 is a framing radius
//        (the block's half width is 430); height 312.
// OPTS   palette  [pearl, limestone, crown green, shadow violet, turquoise, resin, pink] hex strings
//        hour     'morning' (default) | 'dawn' | 'evening' (sun in the west-south-west; the layout itself is
//                 not mirrored: set object.scale.x = -1 and call setSun(worldDir) for the brief's mirror) | 'night' (moon)
//        weather  'fog' (default, 4 m sheet at the lip, 11 m far back) | 'thin' (knee-deep sheet, the fall
//                 a set of veils) | 'drizzle' (deeper sheet, three times the drips and seep threads)
//        season   'feb' (default, flower sprays) | 'summer' (heaviest, fastest fog) | 'november' (green
//                 flush on the pavement, orange berries instead of flower sprays)
//        density  0.6..1.4 tree count multiplier (default 1)
//        sunDir   THREE.Vector3 pointing TO the sun; overrides the hour's direction
// LIGHT  Every material is a custom ShaderMaterial lit by this module's own uniforms (hero.uniforms):
//        uSunDir/uSunCol (key), uSkyCol (ambient from above), uBounce (ambient from below). No scene lights
//        are read and none are made. Scene fog (Fog or FogExp2) is honoured. On top of that all materials
//        share one analytic fog slab on the plateau (hero.glsl is the chunk, hero.uniforms its uniforms)
//        so the world's own pavement, shrubs and trees can sit in exactly the same fog.
//        The cap cloud ends at the lip: the plateau gets uCap.x of the sun except inside the sun break
//        (uBreak ellipse), the cliff and the fall get all of it.
//        The sheet (FOG_FS mode 0) is drawn as cloud, not as a surface. Within 124 m of the eye it is a fan of
//        rings laid round the camera each frame (aF.w = 1) and raised into soft relief (relief()); beyond that
//        the flat sheet carries on. Under the cap cloud it is violet pearl-grey and almost unmodelled; inside
//        the sun break it is white-gold with wind-drawn crests, violet troughs, and one round blue-violet
//        shadow per crown (the tree mask, thrown well clear of the crown). It is mist: looked down into from
//        close it is half see-through, its thin places (fogThin(): drifting torn holes, the wake behind every
//        trunk, the lull by the scarred trunk) break into puffs and show the pavement, and each crest's far
//        side melts away. A noisy skirt of slab fog (slabFog) licks up whatever stands in it. From inside the
//        river nothing beyond 280 m survives. Crown undersides and branches get fog bounce from below.
// HOOKS  setSunBreak(x, z, rx = 150, rz = 90)  place the sun break (local metres); until it is called the
//        break drifts south on its own. setSupply(s) 1..0 is the rare "tablecloth": the fog sheet's
//        trailing edge slides to the lip and the fall thins from the top. setSun(dir, colour) relights.
// ANCHORS (local space)
//        rimY, sunDir, lipCross (where the fly line crosses the lip), flyThrough (ordered points: through
//        the grove heading WSW at 7 m over the rim, left turn, over the lip at 9 m, out over the bay),
//        resinTrunk { position (scar centre), normal, viewFrom }, fallView { position, lookAt } (face-on
//        from 130 m), aboveFog (22 m over the grove), stoop (ordered points 40 m off the wall, down the
//        fall), pinnacle { top, ledge, radius }, portalSeat { position, facing } (a suggestion on the
//        floor 330 m south, ring centre 8 m up, facing north), trees (array of {x, z, r, h} for build asserts).
//        The fly line keeps 6 m from every trunk and crown except at the resin pass, where it is 5.5 m from
//        the scarred trunk and passes under the edge of that tree's crown (about 3 m), as the brief asks.
// COST   about 175k triangles (trees 110k: up to 56k full detail along the fly line, two finer trees for the
//        resin pass and the axis, 52 mid, about 800 far; rock 28k; fog 32k with the near fan; drips 2k), 15 draw calls, no lights, two textures (256 px noise, 2048x1024 mask),
//        about 280 ms of build. Nothing here keys to arrival: the sun break and the fog supply are the hooks.
// WORLD  opts.route lets the world lay the plateau route (see buildHero); hero.materials = { rock, tree, fog } and
//        hero.lip (the lip line, CPU side) are handed out so the world's own land and far fog match exactly.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#E9E6DE', '#D9C19A', '#2E4A34', '#6C7690', '#3DB5AC', '#B3122A', '#E8799C'];
const RIM = 300;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------
// tileable value-noise texture: R, G = fbm, B = fine detail, A = slow billow
async function makeNoiseTex(rng, size = 256, pause = null) {
  const data = new Uint8Array(size * size * 4);
  const chan = async (octs, base, c) => {
    const out = new Float32Array(size * size); let amp = 1, tot = 0;
    for (let o = 0; o < octs; o++) {
      const P = base << o, lat = new Float32Array(P * P);
      for (let i = 0; i < P * P; i++) lat[i] = rng();
      const sc = P / size;
      for (let y = 0; y < size; y++) {
        if (pause && (y & 31) === 0) await pause();                            // 32 rows of the lattice at a time
        const fy = y * sc, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), ya = (y0 % P) * P, yb = ((y0 + 1) % P) * P;
        for (let x = 0; x < size; x++) {
          const fx = x * sc, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % P, xb = (x0 + 1) % P;
          const a = lat[ya + xa], b = lat[ya + xb], cc = lat[yb + xa], d = lat[yb + xb];
          out[y * size + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (cc + (d - cc) * sx) * sy);
        }
      }
      tot += amp; amp *= 0.55; if (pause) await pause();
    }
    for (let i = 0; i < size * size; i++) data[i * 4 + c] = Math.round(clamp(((out[i] / tot) - 0.5) * 2.1 + 0.5, 0, 1) * 255);
  };
  await chan(5, 4, 0); await chan(5, 4, 1); await chan(4, 16, 2); await chan(4, 2, 3);
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;      // (the walls and the river are seen at grazing angles all flight long)
  return tex;
}

// ---------------------------------------------------------------------------------------------------
// shared GLSL: lip line, sun mask (cap cloud + sun break), the fog slab on the plateau
const COMMON = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uBounce;
uniform vec3 uFogLit; uniform vec3 uFogShade;
uniform vec4 uBreak;   // sun break ellipse: centre x, centre z, 1/rx, 1/rz
uniform vec4 uFogP;    // rim height, fog depth at the lip, fog depth far back, density
uniform vec4 uLipA;    // bay depth, inner half width, outer half width, centre x
uniform vec4 uLipB;    // west stretch, east stretch, phase 1, phase 2
uniform vec4 uCap;     // sun fraction under the cap cloud, wind speed, fog supply 0..1, drip rate
uniform vec4 uHole;    // a lull in the sheet: centre x, centre z, 1/r^2, how much of the depth it takes
uniform vec4 uView;    // x: metres of near field cleared while the eye is inside the fog, y: 0 eye inside the fog .. 1 eye above it
uniform float uTime;
uniform sampler2D uNoise;
uniform sampler2D uMask; uniform vec4 uMaskXf;   // top-down mask of the grove: r crowns, g wake edges and bow pillows, b wake troughs
// the moonlit look (all three are black by day, so the day looks do not change): the glow of the dragon's blood
// (sap veins, scars, crown undersides and the mist they light), the moon's silver rim light, the moon's bloom in the mist
uniform vec3 uEmber; uniform vec3 uRim; uniform vec3 uHalo;
uniform vec4 uGlowP;   // one ember light (the glowing tree on the pinnacle): position, radius; far below everything when there is none
vec3 glowAt(vec3 wp, vec3 N){
  vec3 d = uGlowP.xyz - wp; float l2 = dot(d, d), r2 = uGlowP.w * uGlowP.w, f = r2 / (r2 + l2);
  return uEmber * f * f * (0.35 + 0.65 * clamp(dot(N, d) / sqrt(max(l2, 1e-4)), 0., 1.));
}
// silver rim light: strongest on edges seen against the moon (N and V unit vectors, V toward the eye)
float moonRim(vec3 N, vec3 V){
  float r = 1. - abs(dot(N, V)); float b = max(dot(-V, uSunDir), 0.);
  return r * r * r * (0.3 + 0.7 * b * b);
}
float lipZf(float x){
  float d = x - uLipA.w; d = abs(d) * (d < 0. ? uLipB.x : uLipB.y);
  return -uLipA.x * (1. - smoothstep(uLipA.y, uLipA.z, d)) + 9. * sin(x * 0.021 + uLipB.z) + 5. * sin(x * 0.047 + uLipB.w);
}
// the cloud torn off the fall drifts on south down the canyon and dissolves: its shade slides over the canyon floor
// (0 no shade .. 1 under a wisp; only within a few metres of the floor, so no wall is stained by it)
float floorShade(vec3 wp){
  float low = 1. - smoothstep(5., 15., wp.y);
  if (low <= 0.) return 0.;
  vec2 q = wp.xz - vec2(uTime * 2.5, uTime * 12.);
  float n = textureLod(uNoise, q * 0.0031 + 0.31, 0.).a * 0.72 + textureLod(uNoise, q * 0.0113 + 0.6, 0.).r * 0.28;
  return low * smoothstep(0.46, 0.64, n);
}
float sunMask(vec3 wp){
  vec2 e = (wp.xz - uBreak.xy) * uBreak.zw;
  float wr = textureLod(uNoise, wp.xz * 0.0043 + 0.2, 1.).a - 0.5;                 // the pool's edge is a cloud's shadow: curved, a little ragged, some ten metres soft
  float br = 1. - smoothstep(0.84, 1.0, dot(e, e) * (1. + 0.3 * wr));
  float open = smoothstep(-26., 4., wp.z - lipZf(wp.x));
  return mix(uCap.x, 1., max(br, open)) * (1. - 0.45 * floorShade(wp));
}
// the falling cloud also carries slow drifting shade; rock does not (it read as grey stains on the sunlit wall)
float sunMaskF(vec3 wp){
  float open = smoothstep(-26., 4., wp.z - lipZf(wp.x));
  float deep = open * (1. - smoothstep(uFogP.x - 120., uFogP.x - 40., wp.y));
  float cs = textureLod(uNoise, (wp.xz + vec2(wp.y * 0.5, -uTime * 7.)) * 0.0052, 0.).a;
  return sunMask(wp) * (1. - 0.4 * deep * smoothstep(0.44, 0.74, cs));
}
// how deep the sheet is: 0 a knee-deep veil ("thin" weather) .. 1 the full river
float deepK(){ return smoothstep(1.5, 4., uFogP.y); }
// how much of the key light the sheet takes: 0 under the cap cloud, 1 inside the sun break. Under the thin high
// veil of "thin" weather (uCap.x about 0.8) the whole sheet takes the sun, only softened
float sunK(float m){ return mix(smoothstep(uCap.x + 0.05, 0.95, m), 1., 0.75 * smoothstep(0.62, 0.88, uCap.x)); }
// height of the fog top over the plateau at xz (local metres)
float fogTop(vec2 xz){
  float g = lipZf(xz.x) - xz.y;
  float d = mix(uFogP.y, uFogP.z, smoothstep(105., 235., g)) * mix(0.55, 1., smoothstep(0., 24., g));
  float sup = 1. - smoothstep(-60., 0., g - uCap.z * 520.);   // when the supply fails the sheet's trailing edge slides south to the lip
  vec2 w = vec2(0., uTime * uCap.y);
  float n = textureLod(uNoise, (xz - w) * 0.011, 0.).a;
  float n2 = textureLod(uNoise, (xz - w * 0.8) * 0.037, 0.).r;
  vec2 hd = xz - uHole.xy; d *= 1. - uHole.w * exp(-dot(hd, hd) * uHole.z);
  return uFogP.x + d * (0.8 + 0.17 * n + 0.08 * n2) * mix(1., sup, step(uCap.z, 0.999));
}
// how thin the sheet is over xz: 0 full fog .. 1 the pavement shows. Torn holes that drift with the wind in
// loose groups, the lull round the scarred trunk (its outline torn by the same noise), and the wake that
// every trunk trails downwind, its edges rippling
float fogThin(vec2 xz){
  vec2 q = xz - vec2(0., uTime * uCap.y);
  float n = textureLod(uNoise, q * vec2(0.058, 0.026) + 0.37, 1.).g;
  float n2 = textureLod(uNoise, q * vec2(0.011, 0.0047) + 0.71, 0.).a;
  float holes = smoothstep(0.6, 0.8, n) * smoothstep(0.3, 0.55, n2) * deepK();   // a knee-deep veil does not tear: bare pavement in it read as black water under ice
  vec2 hd = xz - uHole.xy;
  // (the lull is drawn out along the flow and its outline is torn by both noises: a ragged tear, never a ring)
  vec2 hs = hd * vec2(1., 0.6);
  float lull = uHole.w * smoothstep(0.22, 0.62, exp(-dot(hs, hs) * uHole.z * 0.6) + (n - 0.5) * 1.3 + (n2 - 0.5) * 0.5);
  vec2 wq = xz + vec2((n - 0.5) * 1.8, 0.);
  float wk = textureLod(uMask, (wq - uMaskXf.xy) * uMaskXf.zw, 0.).b;
  float dkW = smoothstep(1.5, 3.6, uFogP.y), dayW = dkW * (1. - uView.z);
  // a deep sheet opens right down to the pavement; a knee-deep one only thins. By day the deep river opens along the
  // whole wake, and behind the trunks nearest the route (a wide skirt in the mask) as a lane half a crown wide
  float wake = smoothstep(mix(mix(0.42, 0.3, dkW), 0.14, dayW), mix(mix(0.7, 0.58, dkW), 0.33, dayW), wk) * mix(0.42, 0.93, dkW);
  return max(max(holes, lull), wake) * smoothstep(-1., 3., lipZf(xz.x) - xz.y);
}
// the river's surface: metres of relief on the mean fog top. Long swells, round billows and small puffs, all
// racing downwind, drawn out along the flow, and all soft (a crease or a facet reads as wind-scoured snow); lod blurs it with distance.
// (The caller calms it toward the lip.)
float relief(vec2 xz, float lod){
  vec2 q = vec2(xz.x, xz.y - uTime * uCap.y);
  float sw = textureLod(uNoise, q * vec2(0.017, 0.0062) + 0.13, lod + 1.).a;
  float bi = textureLod(uNoise, vec2(q.x, q.y - uTime * 2.) * vec2(0.031, 0.0125) + vec2(sw * 0.3, 0.), lod).r;
  float pf = textureLod(uNoise, q * vec2(0.049, 0.02) + 0.61, lod).b;
  return ((sw - 0.5) * 1.5 + (bi - 0.5) * 1.5 + (pf - 0.5) * 0.4) * mix(0.34, 1., deepK());   // a shallow veil has shallow relief: its hollows must not reach the ground
}
// opacity of the part of the view ray wp -> cam that lies inside the slab (between the pavement and the
// fog top, and behind the lip)
float gDepth = 0.;
float slabFog(vec3 wp, vec3 cam){
  float gw = lipZf(wp.x) - wp.z, gc = lipZf(cam.x) - cam.z;
  float top = fogTop(wp.xz), bot = uFogP.x - 0.5;
  float dy = cam.y - wp.y;
  // the top is taken as a plane from the fog top over the point to the fog top over the eye; a and b are the
  // heights of the two ends of the ray above that plane, and the ray is inside the slab wherever it is below it
  float a = wp.y - top, b = cam.y - fogTop(cam.xz);
  gDepth = max(-a, 0.);
  float lo = 0., hi = 1.;
  if (a >= 0. && b >= 0.) hi = 0.;
  else if (a < 0. && b >= 0.) hi = a / (a - b);
  else if (a >= 0. && b < 0.) lo = a / (a - b);
  if (wp.y < bot && dy > 0.02) lo = max(lo, (bot - wp.y) / dy);
  if (gc < 0.) hi = min(hi, gw / max(gw - gc, 1e-3));
  if (gw < 0. && gc > 0.) lo = max(lo, gw / min(gw - gc, -1e-3));          // a point beyond the lip seen from inside the river: fogged as far as the lip
  float dist = distance(wp, cam);
  float len = dist * max(hi - lo, 0.);
  len *= mix(1., smoothstep(0., 1.6, -a), step(0., b));                   // seen from above, the sheet's top is soft
  len = max(len - uView.x * (1. - exp(-len / max(uView.x, 0.01))), 0.);     // the near field stays clear while we fly inside it
  len *= 1. - mix(0.8, 0.62, uView.z) * uView.y * step(0., b) * (1. - smoothstep(16., 60., dist)) * deepK();   // looked down into from just above, the near river is mist: the pavement ghosts through it (by day most of all)
  // seen from above, what counts is how thin the sheet is where the eye's ray enters it: a hole or a wake is a
  // window on whatever lies under and beyond it
  float thinAt = fogThin(mix(wp.xz, cam.xz, clamp(hi, 0., 1.))) * uView.y * step(0., b) * (1. - smoothstep(110., 240., dist));
  float dK = deepK();
  float f = 1. - exp(-uFogP.w * len * (1. - mix(0.5, 0.9, dK) * thinAt));
  // under a knee-deep veil the pavement is never bare: seen from above it is lifted at least halfway to the mist's colour
  f = max(f, 0.5 * (1. - dK) * smoothstep(0., 1., -a) * step(0., b) * uView.y * uCap.z * step(0., gw));
  f = max(f, 0.46 * dK * thinAt * smoothstep(0., 1., -a) * step(0., b) * uCap.z * step(0., gw));   // nor is the bottom of a hole torn in the deep river: mauve-grey, a third darker than the mist round it
  // the sheet licks up whatever stands in it: a trunk fades into the river over a metre or so, in tongues that
  // climb and fall, so nothing meets the top at a waterline
  float lk = textureLod(uNoise, vec2(wp.x * 0.31 + wp.z * 0.23, wp.y * 0.13 - uTime * 0.4), 0.).g;
  float lk2 = textureLod(uNoise, vec2(wp.x * 0.13 + wp.y * 0.21, (wp.z - uTime * uCap.y) * 0.05), 0.).g;
  float skirt = exp(-max(a, 0.) / (0.4 + 2.4 * lk * lk2)) * (0.6 + 0.38 * lk2) * step(0., b) * uView.y * uCap.z * (1. - thinAt);
  return max(f, skirt * step(0., gw + 3.) * (1. - smoothstep(60., 160., dist)));
}
vec3 fogColour(vec3 wp){ float m = sunMask(wp); return mix(uFogShade, uFogLit, 0.25 + 0.75 * m); }
// the pearl seen from inside the fog along direction d: brighter and white-gold toward the sun break. The sky
// and everything that dissolves into it use this one colour, so nothing far off stands as a paler band
vec3 pearl(vec3 cam, vec3 d){
  vec2 eb = (cam.xz + d.xz * 115. - uBreak.xy) * uBreak.zw;
  float brk = (1. - smoothstep(0.1, 1.9, dot(eb, eb))) * (1. - 0.6 * smoothstep(0.3, 0.75, d.y)) * (1. - uView.z);   // (by night there is no break: its edge stood in the mist as a pale pane)
  float s1 = max(dot(d, uSunDir), 0.), s2 = s1 * s1, s4 = s2 * s2, sd = s4 * s4;
  vec3 c = mix(uFogShade * 0.92, uFogLit * mix(vec3(1.), vec3(1.2, 1.12, 0.94), brk), (0.2 + 0.8 * mix(uCap.x * 0.7, 1., brk)) * mix(1., 0.6, uView.z)) * (1. + 0.16 * d.y + 0.3 * sd);
  // by night the mist is dark blue away from the moon and blooms warm silver round it
  c *= mix(1., 0.62 + 0.7 * s2, uView.z);
  return c + uHalo * (0.62 * sd * sd * sd + 0.3 * sd + 0.1 * s2);
}
vec3 applySlab(vec3 col, vec3 wp, vec3 cam){
  float sf = slabFog(wp, cam);
  // (seen from above, the fog that drowns a thing has the colour of the sheet beside it: violet pearl-grey under the cap by day)
  float sm = sunMask(wp), sunnyS = sunK(sm);
  vec3 shd = uFogShade * mix(vec3(1.), vec3(0.8, 0.79, 0.93), step(0., uSunDir.y) * (1. - uView.z) * uView.y);
  vec3 fc = mix(shd, uFogLit, mix(0.25 + 0.75 * sm, mix(0.12, 1., sunnyS), uView.y) * (0.42 + 0.58 * exp(-gDepth * 0.55)));
  if (uView.y < 0.999) {
    vec3 d = wp - cam; float dl = length(d); fc = mix(pearl(cam, d / max(dl, 1e-3)), fc, uView.y);
    // from inside the river nothing far off survives, however high it stands above the fog top (far crowns across
    // the bay showed as a dashed line in the pearl)
    sf = max(sf, (1. - smoothstep(0.6, 1., uView.y)) * smoothstep(140., 280., dl) * step(0., lipZf(cam.x) - cam.z + 3.));
  }
  return mix(col, fc, sf);
}
// called after the scene's own distance haze: seen from inside the river a far thing is pearl, not haze-blue
// (far crowns across the bay, fogged to pearl and then hazed blue, drew a dashed line in the fog)
vec3 farPearl(vec3 col, vec3 wp, vec3 cam){
  if (uView.y > 0.999) return col;
  vec3 d = wp - cam; float dl = length(d);
  float k = (1. - smoothstep(0.6, 1., uView.y)) * smoothstep(140., 280., dl) * step(0., lipZf(cam.x) - cam.z + 3.);
  return mix(col, pearl(cam, d / max(dl, 1e-3)), k);
}
`;

// the same lip line on the CPU
function makeLip(rng) {
  const L = {
    depth: rng.range(175, 215), w0: rng.range(120, 160), w1: rng.range(265, 300), cx: rng.range(-25, 25),
    sl: rng.range(0.88, 1.12), sr: rng.range(0.88, 1.12), p1: rng.range(0, TAU), p2: rng.range(0, TAU),
  };
  L.z = (x) => {
    let d = x - L.cx; d = Math.abs(d) * (d < 0 ? L.sl : L.sr);
    return -L.depth * (1 - smoothstep(L.w0, L.w1, d)) + 9 * Math.sin(x * 0.021 + L.p1) + 5 * Math.sin(x * 0.047 + L.p2);
  };
  return L;
}

function presets(opts, pal) {
  const hour = opts.hour || 'morning', weather = opts.weather || 'fog', season = opts.season || 'feb';
  const c = (h) => new THREE.Color(h);
  const pearl = c(pal[0]), violet = c(pal[3]);
  const P = { hour, weather, season };
  const dir = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)).normalize(); };
  if (hour === 'dawn') { P.sunDir = dir(98, 8); P.sunCol = c('#ffb07a').multiplyScalar(2.3); P.sky = c('#8d93b8').multiplyScalar(0.55); P.fogLit = c('#ffc9a8').multiplyScalar(1.05); P.fogShade = c('#7d83a6').multiplyScalar(0.75); P.cap = 0.3; }
  else if (hour === 'evening') { P.sunDir = dir(252, 22); P.sunCol = c('#ffc88a').multiplyScalar(2.5); P.sky = c('#93a0c4').multiplyScalar(0.6); P.fogLit = c('#ffe2bd').multiplyScalar(1.1); P.fogShade = violet.clone().multiplyScalar(0.85); P.cap = 0.28; }
  // night: a big low moon in the west-south-west, ahead of the plateau run. Silver key, deep blue shade; the whole river takes the moon
  else if (hour === 'night') { P.sunDir = dir(253, 11); P.sunCol = c('#b4c3ff').multiplyScalar(1.0); P.sky = c('#1c2a5a').multiplyScalar(1.05); P.fogLit = c('#b4c3ee').multiplyScalar(0.5); P.fogShade = c('#1b2650').multiplyScalar(0.62); P.cap = 0.86; }
  else { P.sunDir = dir(108, 30); P.sunCol = c('#fff0d8').multiplyScalar(2.3); P.sky = c('#a9b9d6').lerp(violet, 0.3).multiplyScalar(0.62); P.fogLit = pearl.clone().lerp(c('#fff6e0'), 0.5).multiplyScalar(1.02); P.fogShade = violet.clone().lerp(pearl, 0.36).multiplyScalar(0.95); P.cap = 0.2; }
  if (opts.sunDir) P.sunDir = opts.sunDir.clone().normalize();
  P.bounce = c(pal[1]).multiplyScalar(hour === 'night' ? 0.05 : 0.22); P.night = hour === 'night';
  P.fogLip = weather === 'thin' ? 1.6 : weather === 'drizzle' ? 5 : season === 'summer' ? 5 : 4;
  P.fogBack = weather === 'thin' ? 3 : weather === 'drizzle' ? 12 : season === 'summer' ? 13 : 11;
  P.wind = season === 'summer' ? 30 : 24;
  P.dripRate = weather === 'drizzle' ? 3 : 1;
  P.veil = weather === 'thin' ? 0.55 : 1;      // opacity of the fall
  if (weather === 'thin' && hour !== 'night') P.cap = 0.8;   // thin weather: only a high veil over the plateau, so the knee-deep mist and the trunks take the sun
  return P;
}

// ---------------------------------------------------------------------------------------------------
// geometry accumulator. aW = (branch flex weight, blade/tip weight, kind)
// kind: 0 trunk, 1 branch, 2 leaf blade, 3 beard lichen, 4 flower spray, 5 crown shell
const V3 = THREE.Vector3;
function newG() { return { p: [], n: [], c: [], u: [], w: [], i: [], nv: 0 }; }
function vtx(g, p, n, c, k, u, v, w0, w1, kind) {
  g.p.push(p.x, p.y, p.z); g.n.push(n.x, n.y, n.z); g.c.push(c.r * k, c.g * k, c.b * k); g.u.push(u, v); g.w.push(w0, w1, kind);
  return g.nv++;
}
function toGeometry(g) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(g.c, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.u, 2));
  geo.setAttribute('aW', new THREE.Float32BufferAttribute(g.w, 3));
  geo.setIndex(g.i);
  return geo;
}
const _t = new V3(), _a = new V3(), _b = new V3(), _q = new V3(), _nn = new V3();
// swollen tube through pts with per-ring radius, ao and flex weight
function tube(g, pts, radii, sides, col, ao, wts, kind, v0, rng, smooth = false) {
  const n = pts.length; let v = v0, prev = -1;
  for (let r = 0; r < n; r++) {
    const pa = pts[Math.max(0, r - 1)], pb = pts[Math.min(n - 1, r + 1)];
    _t.subVectors(pb, pa).normalize();
    if (Math.abs(_t.y) < 0.92) _a.set(0, 1, 0); else _a.set(1, 0, 0);
    _a.cross(_t).normalize(); _b.crossVectors(_t, _a);
    if (r > 0) v += pts[r].distanceTo(pts[r - 1]);
    const first = g.nv;
    for (let s = 0; s <= sides; s++) {
      const an = (s % sides) / sides * TAU, ca = Math.cos(an), sa = Math.sin(an);
      _nn.set(_a.x * ca + _b.x * sa, _a.y * ca + _b.y * sa, _a.z * ca + _b.z * sa);
      const rr = radii[r] * (smooth || s === sides || s === 0 ? 1 : 1 + (rng() - 0.5) * 0.1);
      _q.copy(pts[r]).addScaledVector(_nn, rr);
      vtx(g, _q, _nn, col, ao[r] * (smooth ? 1 : 0.92 + rng() * 0.16), s / sides, v, wts[r], 0, kind);
    }
    if (prev >= 0) for (let s = 0; s < sides; s++) g.i.push(prev + s, prev + s + 1, first + s, prev + s + 1, first + s + 1, first + s);
    prev = first;
  }
}
// a sword leaf: two triangles folded along the midrib, front face on the side of `up`
const _k0 = new V3(), _k1 = new V3(), _k2 = new V3(), _k3 = new V3(), _sd = new V3(), _fn = new V3();
function kite(g, base, d, up, len, wid, fold, c0, c1, k0, k1, nrm, bw, kind) {
  _sd.crossVectors(d, up); if (_sd.lengthSq() < 1e-6) _sd.set(1, 0, 0); _sd.normalize();
  _fn.crossVectors(_sd, d).normalize();
  _k0.copy(base);
  _k1.copy(base).addScaledVector(d, len * 0.36).addScaledVector(_sd, wid * 0.5).addScaledVector(_fn, fold);
  _k2.copy(base).addScaledVector(d, len * 0.36).addScaledVector(_sd, -wid * 0.5).addScaledVector(_fn, fold);
  _k3.copy(base).addScaledVector(d, len).addScaledVector(_fn, -len * 0.06);
  const a = vtx(g, _k0, nrm, c0, k0, 0.5, 0, bw, 0, kind), b = vtx(g, _k1, nrm, c1, (k0 + k1) * 0.5, 0, 0.36, bw, 0.45, kind);
  const c = vtx(g, _k2, nrm, c1, (k0 + k1) * 0.5, 1, 0.36, bw, 0.45, kind), e = vtx(g, _k3, nrm, c1, k1, 0.5, 1, bw, 1, kind);
  g.i.push(a, e, c, a, b, e);
}

// One dragon's-blood tree. lod 0: about 3,300 triangles (every fork, every rosette); lod 1: about 300
// (forks to the third level, crown shell with a zigzag rim and blade spikes); lod 2: about 40.
function buildTree(rng, lod, C, tall, fine = false, defer = false) {
  const g = newG(), L = 5;
  const trunkH = tall ? 5.5 : rng.range(4.7, 5.6), trunkR = rng.range(0.33, 0.5), R = rng.range(3.8, 5.2);
  const top = trunkH + rng.range(2.7, 3.4), drop = rng.range(0.9, 1.5);
  const lx = rng.range(-0.3, 0.3), lz = rng.range(-0.3, 0.3);
  const F = new V3(lx, trunkH, lz);
  const canopy = (r, t, out = new V3()) => out.set(F.x * 0.6 + R * r * Math.cos(t), top - drop * r * r, F.z * 0.6 + R * r * Math.sin(t));
  // trunk
  const fr = lod === 0 ? [0, 0.05, 0.2, 0.42, 0.64, 0.84, 0.95, 1.02] : lod === 1 ? [0, 0.5, 1.02] : [0, 1.02];
  const mul = lod === 0 ? [1.5, 1.16, 1.0, 0.95, 0.93, 0.98, 1.12, 1.26] : lod === 1 ? [1.3, 0.95, 1.22] : [1.15, 1.15];
  const tp = fr.map((f) => new V3(lx * f * f, trunkH * f, lz * f * f));
  tube(g, tp, mul.map((m) => m * trunkR), fine ? 16 : lod === 0 ? 10 : lod === 1 ? 6 : 4, C.bark, fr.map((f) => lerp(1.0, 0.62, f * f)), fr.map(() => 0), 0, 0, rng, fine);
  // recursive fork over regions of the crown disc
  const tips = [], mids = [];
  // fine: the two trees passed within a few metres (the scarred trunk, the umbrella on the entry axis) get round,
  // swollen branches of three sections that end in a domed knuckle at every fork, so no facet or open end shows
  const sides = fine ? [0, 12, 10, 8, 6, 5] : [0, 9, 8, 6, 4, 3], secs = fine ? [0, 4, 3, 3, 2, 1] : [0, 2, 2, 2, 1, 1];
  const endR = (l) => trunkR * 0.8 * Math.pow(0.73, l - 1);
  const nodePos = (reg, l) => {
    const rc = Math.sqrt((reg.r0 * reg.r0 + reg.r1 * reg.r1) / 2), tc = (reg.t0 + reg.t1) / 2;
    const T = canopy(rc, tc), f = l / L, gh = Math.pow(f, 0.88), gv = Math.pow(f, 1.15 + 0.3 * rc);
    const p = new V3(F.x + (T.x - F.x) * gh, F.y + (T.y - F.y) * gv, F.z + (T.z - F.z) * gh);
    if (l < L) { const j = R * 0.05; p.x += rng.range(-j, j); p.z += rng.range(-j, j); p.y += rng.range(-j, j) * 0.6; } else p.y += rng.range(-0.18, 0.12);
    p.userData = rc; return p;
  };
  const grow = (reg, l, A, rA) => {
    if (l === L) { tips.push({ p: A, dir: reg.dir, rc: A.userData, t: (reg.t0 + reg.t1) / 2 }); return; }
    const w = (reg.t1 - reg.t0) * (reg.r0 + reg.r1) / 2, d = reg.r1 - reg.r0;
    const kids = [];
    if (l === 0 || w > d * 1.12) {
      const n = l === 0 ? (rng.chance(0.7) ? 3 : 4) : (w > d * 2.5 ? 3 : 2);
      let t = reg.t0; const span = reg.t1 - reg.t0;
      for (let k = 0; k < n; k++) { const t1 = k === n - 1 ? reg.t1 : reg.t0 + span * (k + 1 + rng.range(-0.14, 0.14)) / n; kids.push({ r0: reg.r0, r1: reg.r1, t0: t, t1 }); t = t1; }
    } else {
      const rm = Math.sqrt((reg.r0 * reg.r0 + reg.r1 * reg.r1) / 2) * (1 + rng.range(-0.05, 0.05));
      kids.push({ r0: reg.r0, r1: rm, t0: reg.t0, t1: reg.t1 }, { r0: rm, r1: reg.r1, t0: reg.t0, t1: reg.t1 });
    }
    for (const kd of kids) {
      const B = nodePos(kd, l + 1), l1 = l + 1, rB = endR(l1), r0 = rA * 0.82;
      const dir = new V3().subVectors(B, A); const len = dir.length(); dir.multiplyScalar(1 / Math.max(len, 1e-4)); kd.dir = dir;
      const f0 = l / L, f1 = l1 / L, w0 = f0 * f0 * (0.4 + 0.6 * B.userData), w1 = f1 * f1 * (0.4 + 0.6 * B.userData);
      const build = lod === 0 || (lod === 1 && l1 <= 3);
      if (build) {
        const sd = lod === 0 ? sides[l1] : (l1 <= 2 ? 4 : 3), sc = lod === 0 ? secs[l1] : 1;
        const aoA = lod === 0 ? 0.84 : 0.66, aoB = lod === 0 ? 0.62 : 0.42;
        const pts = [A], rad = [r0], ao = [lerp(aoA, aoB, f0)], wt = [w0];
        if (sc === 2 && !fine) {
          const M = new V3().lerpVectors(A, B, 0.5); M.y -= len * 0.05; M.x += dir.x * 0 + (M.x - F.x) * 0.03; M.z += (M.z - F.z) * 0.03;
          pts.push(M); rad.push((r0 + rB) * 0.5 * 1.42); ao.push(lerp(aoA, aoB, (f0 + f1) / 2)); wt.push((w0 + w1) / 2);
          if (l1 === 2 || l1 === 3) mids.push({ p: M, dir, w: (w0 + w1) / 2, r: (r0 + rB) * 0.6 });
        }
        if (fine) {
          for (let j = 1; j < sc; j++) {
            const t = j / sc, sw = Math.sin(Math.PI * t), M = new V3().lerpVectors(A, B, t); M.y -= len * 0.05 * sw; M.x += (M.x - F.x) * 0.03 * sw; M.z += (M.z - F.z) * 0.03 * sw;
            pts.push(M); rad.push(lerp(r0, rB, t) * (1 + 0.42 * sw)); ao.push(lerp(aoA, aoB, lerp(f0, f1, t))); wt.push(lerp(w0, w1, t));
            if ((l1 === 2 || l1 === 3) && j === (sc >> 1)) mids.push({ p: M, dir, w: (w0 + w1) / 2, r: (r0 + rB) * 0.6 });
          }
          // the knuckle: the sausage rounds off past the fork, and the next ones grow out of it
          const re = rB * (l1 === L ? 0.8 : 1.0);
          pts.push(B); rad.push(re); ao.push(lerp(aoA, aoB, f1)); wt.push(w1);
          if (l1 < L) { pts.push(new V3().copy(B).addScaledVector(dir, re * 0.6)); rad.push(re * 0.78); ao.push(lerp(aoA, aoB, f1) * 0.9); wt.push(w1); }
          pts.push(new V3().copy(B).addScaledVector(dir, re * (l1 < L ? 1.02 : 0.9))); rad.push(re * 0.06); ao.push(lerp(aoA, aoB, f1) * 0.8); wt.push(w1);
        } else { pts.push(B); rad.push(rB * (sc === 2 ? 0.92 : 1.05)); ao.push(lerp(aoA, aoB, f1)); wt.push(w1); }
        tube(g, pts, rad, sd, C.bark, ao, wt, 1, rng() * 3, rng, fine);
      }
      grow(kd, l1, B, rB);
    }
  };
  const t00 = rng() * TAU;
  grow({ r0: 0, r1: 1, t0: t00, t1: t00 + TAU }, 0, F, trunkR * 1.2);
  const T0 = { trunkH, trunkR, R, top, drop, F, canopy, tips, mids, fine };
  return defer ? () => finishTree(g, rng, lod, C, T0) : finishTree(g, rng, lod, C, T0);
}
function finishTree(g, rng, lod, C, T) {
  const { R, top, drop, F, canopy, tips, mids } = T;
  const up = new V3(0, 1, 0), tmp = new V3(), ax = new V3(), u = new V3(), v = new V3(), d = new V3(), nr = new V3(), base = new V3();
  // crown shell: a dark under-dome behind the rosettes (lod 0) or the crown itself (lod 1, 2)
  const segs = lod === 0 ? 14 : lod === 1 ? 11 : 8, sink = lod === 0 ? 0.45 : -0.1, grow = lod === 0 ? 0.84 : 1.05;
  const shellCol = lod === 0 ? C.leafDark : C.leafShell, ring = [];
  const ctr = canopy(0, 0, tmp); ctr.y -= sink;
  const c0 = vtx(g, ctr, up, shellCol, lod === 0 ? 0.5 : 1.0, 0.5, 0.5, 0.1, 0, 5);
  for (let rI = 0; rI < 2; rI++) {
    const rr = rI === 0 ? 0.6 : 1.0; ring.push(g.nv);
    for (let s = 0; s < segs; s++) {
      const zig = (s % 2 ? 1 : -1) * (lod === 0 ? 0.0 : 0.075) * (rI ? 1 : 0.5) + (rng() - 0.5) * 0.06;
      const an = (s + (rI ? 0.5 : 0)) / segs * TAU;
      canopy(rr * grow * (1 + zig), an, tmp); tmp.y -= sink + (rI ? (lod === 0 ? 0.3 : 0.25 + zig * 2.5) : 0);
      const no = lod === 0 ? 0.95 : 1.7;
      nr.set(Math.cos(an) * rr * no, 1, Math.sin(an) * rr * no).normalize();
      const k = lod === 0 ? (s % 2 ? 0.34 : 0.5) : (rI ? 0.62 : 0.92) * (1 + 0 * rng());
      vtx(g, tmp, nr, shellCol, k, 0.5 + Math.cos(an) * rr * 0.5, 0.5 + Math.sin(an) * rr * 0.5, 0.5 * rr * rr, 0, 5);
    }
  }
  for (let s = 0; s < segs; s++) {
    const s1 = (s + 1) % segs, a = ring[0] + s, b = ring[0] + s1, c = ring[1] + s, e = ring[1] + s1;
    g.i.push(c0, b, a, a, b, c, b, e, c);
  }
  const spacing = R * Math.sqrt(Math.PI / Math.max(tips.length, 1));
  if (lod === 0) {
    // rosettes of 14 sword leaves at every branch tip
    for (const tp of tips) {
      tmp.set(Math.cos(tp.t), 0, Math.sin(tp.t));
      ax.copy(tp.dir).multiplyScalar(0.55).addScaledVector(up, 0.7).addScaledVector(tmp, 0.3 * tp.rc).normalize();
      u.crossVectors(ax, Math.abs(ax.y) < 0.9 ? up : tmp.set(1, 0, 0)).normalize(); v.crossVectors(ax, u);
      const ph = rng() * TAU, bl = clamp(spacing * rng.range(0.72, 0.9), 0.55, 1.0);
      for (let i = 0; i < 12; i++) {
        const an = ph + i * 2.39996, el = lerp(-0.42, 1.36, (i + 0.5) / 12 + rng.range(-0.03, 0.03)), ce = Math.cos(el), se = Math.sin(el);
        d.set(0, 0, 0).addScaledVector(u, Math.cos(an) * ce).addScaledVector(v, Math.sin(an) * ce).addScaledVector(ax, se).normalize();
        nr.copy(d).multiplyScalar(0.55).addScaledVector(ax, 0.75).normalize();
        base.copy(tp.p).addScaledVector(ax, 0.06 + 0.1 * Math.max(se, 0));
        const len = bl * rng.range(0.85, 1.12) * (0.82 + 0.18 * ce);
        kite(g, base, d, ax, len, len * 0.19, len * 0.035, C.leafDark, C.leafLight, 0.5, rng.range(0.85, 1.1) * (0.6 + 0.4 * smoothstep(-0.4, 0.5, el)), nr, tp.rc * 0.6 + 0.4, 2);
      }
      if (T.fine && tp.rc > 0.74) { // along the rim the lower swords hang out past the shell: the spiky ring seen from under the crown
        tmp.set(Math.cos(tp.t), 0, Math.sin(tp.t));
        for (let i = 0; i < 7; i++) {
          const an = ph + i * 0.9, el = rng.range(-0.75, -0.05), sp = rng.range(-0.9, 0.9);
          d.set(tmp.x * Math.cos(sp) - tmp.z * Math.sin(sp), 0, tmp.z * Math.cos(sp) + tmp.x * Math.sin(sp)).multiplyScalar(Math.cos(el)); d.y = Math.sin(el); d.normalize();
          nr.copy(d).multiplyScalar(0.4).addScaledVector(up, -0.6).normalize();
          base.copy(tp.p).addScaledVector(d, 0.05); base.y -= 0.05 + 0.01 * Math.sin(an);
          const len = bl * rng.range(0.95, 1.3);
          kite(g, base, d, up, len, len * 0.2, len * 0.03, C.leafDark, C.leafLight, 0.55, rng.range(0.9, 1.15), nr, tp.rc * 0.6 + 0.4, 2);
        }
      }
      if (rng() < 0.3) { // flower spray above the rosette
        base.copy(tp.p).addScaledVector(ax, 0.2); d.copy(ax).multiplyScalar(0.8).addScaledVector(up, 0.4).normalize();
        kite(g, base, d, u, rng.range(0.55, 0.8), 0.2, 0, C.spray, C.spray, 0.7, 1.0, d, 1, 4);
        kite(g, base, d, v, rng.range(0.55, 0.8), 0.2, 0, C.spray, C.spray, 0.7, 1.0, d, 1, 4);
      }
    }
    // beard lichen hanging under the lower forks
    for (const m of mids) {
      if (rng() > 0.85) continue;
      for (let st = 0; st < (T.fine ? 5 : 2); st++) {
      const len = T.fine ? rng.range(0.4, 0.8) : rng.range(0.35, 0.95), hw = T.fine ? rng.range(0.018, 0.034) : rng.range(0.012, 0.022);
      tmp.set(-m.dir.z, 0, m.dir.x).normalize(); nr.set(m.dir.x, 0.3, m.dir.z).normalize();
      base.copy(m.p).addScaledVector(m.dir, T.fine ? (st - 2) * 0.16 + rng.range(-0.05, 0.05) : (st - 0.5) * 0.3); base.y -= m.r * (T.fine ? 0.85 : 0.6);
      const lk = T.fine ? 0.6 : 1;
      const a = vtx(g, _q.copy(base).addScaledVector(tmp, hw), nr, C.lichen, 0.5 * lk, 0, 0, m.w, 0, 3), b = vtx(g, _q.copy(base).addScaledVector(tmp, -hw), nr, C.lichen, 0.5 * lk, 1, 0, m.w, 0, 3);
      base.y -= len;
      const c = vtx(g, _q.copy(base).addScaledVector(tmp, hw * 0.5), nr, C.lichen, 0.7 * lk, 0, 1, m.w, 1, 3), e = vtx(g, _q.copy(base).addScaledVector(tmp, -hw * 0.3), nr, C.lichen, 0.7 * lk, 1, 1, m.w, 1, 3);
      g.i.push(a, c, b, b, c, e);
      }
    }
  } else {
    // blade spikes that keep the cushion outline
    const n = lod === 1 ? Math.min(tips.length, 60) : 5;
    for (let i = 0; i < n; i++) {
      const tp = tips[Math.floor(i * tips.length / n)];
      tmp.set(Math.cos(tp.t), 0, Math.sin(tp.t));
      d.copy(up).multiplyScalar(0.75).addScaledVector(tmp, 0.25 + 0.6 * tp.rc).normalize();
      u.set(rng() - 0.5, rng() * 0.3, rng() - 0.5).normalize();
      base.copy(tp.p); base.y -= 0.25;
      const len = (lod === 1 ? rng.range(0.75, 1.1) : rng.range(1.3, 1.8));
      kite(g, base, d, u, len, len * (lod === 1 ? 0.24 : 0.34), 0.05, C.leafDark, C.leafLight, 0.6, 1.05, d, tp.rc, 2);
    }
    // a ring of rosettes round the rim: the spiky outline of the cushion against the fog
    if (lod === 1) for (let s = 0; s < segs * 2; s++) {
      const an = (s + rng.range(-0.3, 0.3)) / (segs * 2) * TAU;
      canopy(1.02, an, base); base.y -= 0.45; tmp.set(Math.cos(an), 0, Math.sin(an));
      u.set(-Math.sin(an), 0, Math.cos(an));
      for (let b = 0; b < 2; b++) {
        d.copy(tmp).multiplyScalar(b ? 0.35 : 0.9).addScaledVector(up, b ? 0.95 : 0.42).addScaledVector(u, rng.range(-0.35, 0.35)).normalize();
        const len = rng.range(0.85, 1.3);
        kite(g, base, d, u, len, len * 0.3, 0.05, C.leafDark, C.leafLight, 0.6, 1.2, nr.copy(d).multiplyScalar(0.5).addScaledVector(up, 0.8).normalize(), 0.9, 2);
      }
    }
  }
  return { geo: toGeometry(g), tris: g.i.length / 3, R, top, trunkH: T.trunkH, trunkR: T.trunkR, tips: tips.map((t) => t.p) };
}

// ---------------------------------------------------------------------------------------------------
// tree material: wind on tip distance, resin scars as a trunk mask, shared fog slab
const TREE_VS = /* glsl */`
attribute vec3 aW; attribute vec4 aInst;
varying vec3 vCol; varying vec3 vN; varying vec3 vWp; varying vec2 vUv; varying vec3 vK; varying float vKeep; varying float vBw;
#include <fog_pars_vertex>
${COMMON}
void main(){
  vec4 wp = instanceMatrix * vec4(position, 1.);
  vec3 p = position; float ph = aInst.x, t = uTime;
  float gust = 0.6 + 0.4 * sin(t * 0.7 + wp.x * 0.05 + wp.z * 0.03);
  float bw = aW.x;
  wp.z += bw * (0.11 + 0.08 * sin(t * 1.9 + ph + p.x * 1.3)) * gust;
  wp.x += bw * 0.05 * sin(t * 2.3 + ph * 1.7 + p.z * 1.1) * gust;
  wp.y += bw * 0.03 * sin(t * 2.9 + ph + p.x * 2. + p.z * 2.);
  float isLeaf = step(1.5, aW.z) * step(aW.z, 2.5) + step(3.5, aW.z) * step(aW.z, 4.5);
  wp.xyz += aW.y * isLeaf * 0.04 * gust * vec3(sin(t * 11. + ph + p.x * 9.), sin(t * 13. + p.z * 8. + ph), sin(t * 9. + p.y * 7.));
  float li = aW.y * step(2.5, aW.z) * step(aW.z, 3.5);
  wp.z += li * (0.38 + 0.16 * sin(t * 4. + ph + p.x * 3.)) * gust; wp.y += li * 0.14; wp.x += li * 0.08 * sin(t * 5.3 + ph);
  vWp = wp.xyz; vCol = color * (0.86 + 0.28 * aInst.z); vUv = uv; vK = vec3(aW.z, aInst.y, aW.y); vKeep = aInst.w; vBw = aW.x;
  vN = normalize(mat3(instanceMatrix) * normal);
  vec4 mvPosition = viewMatrix * modelMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TREE_FS = /* glsl */`
varying vec3 vCol; varying vec3 vN; varying vec3 vWp; varying vec2 vUv; varying vec3 vK; varying float vKeep; varying float vBw;
uniform vec3 uResin; uniform vec3 uCamL;
#include <fog_pars_fragment>
${COMMON}
// one bead of resin at c.xy, radius c.z: (cover, dome shading, glint)
vec3 beadAt(vec2 p, vec3 c){
  vec2 d = (p - c.xy) / c.z; float r2 = dot(d, d);
  float cov = 1. - smoothstep(0.7, 1., r2);
  vec2 g = d - vec2(-0.32, 0.36);
  return vec3(cov, cov * (1. - 0.75 * r2), cov * exp(-dot(g, g) * 14.));
}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 Vd = uCamL - vWp; vec3 V = Vd / max(length(Vd), 1e-3);
  float kind = vK.x; float leafy = step(1.5, kind);
  float back = gl_FrontFacing ? 0. : 1.;
  vec3 alb = vCol; float gloss = 0.; float resin = 0.; float wet = 0.;
  // by moonlight the dragon's blood shows: thin veins of crimson sap glow down every trunk and out along the lower
  // forks (never under a pixel and a half wide: far off they melt into one dull glow of the trunk)
  float sapN = texture2D(uNoise, vec2(vUv.x * 2. + 0.13, vUv.y * 0.045 + 0.2)).g;
  float sapW = 0.007 + fwidth(sapN) * 1.25, sap = 0., ribU = 0.5;
  if (kind < 1.5) {
    float n = texture2D(uNoise, vec2(vUv.x * 2., vUv.y * 0.31)).b;
    float n2 = texture2D(uNoise, vec2(vUv.x * 0.5, vUv.y * 0.07)).r;
    float ringS = smoothstep(0.38, 0.5, abs(fract(vUv.y * 3.4 + n * 0.35) - 0.5));
    // bark for the close pass: leaf-scar rings, fissures down the trunk, grain, patches of crust lichen
    float n3 = texture2D(uNoise, vec2(vUv.x * 5., vUv.y * 1.9)).b;
    float ring2 = smoothstep(0.3, 0.5, abs(fract(vUv.y * 11. + n * 0.8) - 0.5));
    float fis = smoothstep(0.52, 0.74, texture2D(uNoise, vec2(vUv.x * 3., vUv.y * 0.13 + 0.4)).g);
    float crust = smoothstep(0.6, 0.78, texture2D(uNoise, vec2(vUv.x * 1.3 + 0.2, vUv.y * 0.27)).r);
    alb *= (0.74 + 0.36 * n2) * (1. - 0.34 * ringS) * (0.82 + 0.3 * n) * (1. - 0.2 * ring2) * (0.8 + 0.4 * n3) * (1. - 0.38 * fis);
    alb = mix(alb, vec3(0.42, 0.46, 0.36) * (0.7 + 0.6 * n3), crust * 0.55);
    N = normalize(N + vec3((n3 - 0.5) * 0.7, (ringS - 0.3) * 0.6 + (ring2 - 0.4) * 0.3, (n - 0.5) * 0.7 - fis * 0.2) * mix(1., 0.3, step(0.5, kind)));
    alb = mix(alb, vCol * (0.9 + 0.2 * n) * (1. - 0.2 * ringS), 0.6 * step(0.5, kind));      // forks: paler, smoother skin than the trunk
    // out along the branches the bark darkens into the sheaths of dead leaf bases under the rosettes, and the
    // warm fog-bounce of the lower forks gives way to the cool shade under the shell
    float tipK = smoothstep(0.08, 0.6, vBw) * step(0.5, kind);
    alb *= mix(vec3(1.05, 1., 0.93), vec3(0.5, 0.56, 0.6) * (0.8 + 0.4 * n3), tipK);
    alb = mix(alb, alb * vec3(1.7, 0.5, 0.45), tipK * uView.z * 0.7);
    sap = (1. - smoothstep(sapW * 0.45, sapW, abs(sapN - 0.5))) * (1. - 0.8 * tipK) * mix(1., 0.55, step(0.5, kind));
    if (kind < 0.5 && vK.y >= 0.) {
      // the tapper's scar: an oblong cut 1.2 m tall, wet crimson with one long highlight, beads of resin standing
      // on it and one run creeping down the bark (x, y in metres round and along the trunk)
      float du = fract(vUv.x - vK.y + 0.5) - 0.5;
      float x = du * 2.6, y = vUv.y - 4.55;
      float wob = (texture2D(uNoise, vec2(y * 0.2, 0.3)).r - 0.5) * 0.08;
      float e = (x + wob) * (x + wob) / 0.04 + y * y / 0.5;
      float inside = 1. - smoothstep(0.72, 0.95, e);
      float lipR = smoothstep(0.6, 0.95, e) * (1. - smoothstep(1.05, 1.5, e));
      float wood = texture2D(uNoise, vec2(x * 3., y * 0.4)).b;
      float rw = texture2D(uNoise, vec2(y * 0.11, 0.83)).g - 0.5;
      float rx = x - 0.03 - rw * 0.12, ry = y + 0.6;                              // the run: from the cut's lower end, 1.1 m down
      float runW = 0.034 * (1. - 0.55 * (1. - smoothstep(-1.1, 0., ry))) * (1. + 0.5 * (1. - smoothstep(-1.1, -0.95, ry)));
      float run = (1. - smoothstep(runW * 0.7, runW, abs(rx))) * step(ry, 0.) * (1. - smoothstep(-1.12, -1.06, ry));
      vec3 cut = mix(vec3(0.13, 0.03, 0.02), uResin * 0.62, 0.35 + 0.55 * smoothstep(0.3, 0.7, wood));
      cut *= 0.7 + 0.5 * (1. - smoothstep(0.1, 1., e));                                  // deeper colour at the rim of the cut
      alb = mix(alb, vec3(0.62, 0.55, 0.44), lipR * 0.8);
      alb = mix(alb, cut, inside);
      alb = mix(alb, uResin * 0.7, run);
      // beads: (x, y, radius)
      vec3 bd = vec3(0.);
      bd += beadAt(vec2(x, y), vec3(-0.05, 0.36, 0.04)); bd += beadAt(vec2(x, y), vec3(0.07, 0.14, 0.034));
      bd += beadAt(vec2(x, y), vec3(-0.02, -0.1, 0.046)); bd += beadAt(vec2(x, y), vec3(0.085, -0.3, 0.036));
      bd += beadAt(vec2(x, y), vec3(-0.09, -0.36, 0.032)); bd += beadAt(vec2(x, y), vec3(0.01, -0.56, 0.044));
      bd += beadAt(vec2(rx + 0.03, ry), vec3(0.03, -0.52, 0.045)); bd += beadAt(vec2(rx + 0.03, ry), vec3(0.03, -1.08, 0.05));
      float bead = clamp(bd.x, 0., 1.);
      alb = mix(alb, uResin * (0.55 + 0.6 * bd.y), bead);
      resin = max(max(inside * (0.5 + 0.5 * smoothstep(0.4, 0.7, wood)), run), bead);
      gloss = resin;
      // the wet face mirrors the bright fog: one long streak down the cut and along the run, a glint on each bead
      float s1 = (x + 0.045 + wob) / 0.028, s2 = rx / max(runW * 0.4, 1e-3);
      float streak = exp(-s1 * s1) * inside * (1. - smoothstep(0.36, 0.72, abs(y))) + exp(-s2 * s2) * run * 0.7;
      wet = streak * 0.9 + bd.z * 1.6;
    }
  }
  if (kind > 4.5) {
    alb *= 0.66 + 0.8 * texture2D(uNoise, vUv * 2.7).b * (0.6 + 0.8 * texture2D(uNoise, vUv * 9.).b);
    vec2 g = vUv * 12. + vec2(0., 0.5 * floor(vUv.x * 12.)); vec2 id = floor(g), f = fract(g) - 0.5;
    float hh = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
    f += (hh - 0.5) * 0.3; float r = length(f);
    float spoke = 0.5 + 0.5 * cos(atan(f.y, f.x + 1e-4) * 7. + hh * 6.28);
    float ros = (1. - smoothstep(0.12, 0.56, r)) * mix(1., 0.45 + 0.75 * spoke, smoothstep(0.08, 0.3, r));
    float rosFar = smoothstep(45., 130., length(Vd));                          // far off the rosettes melt into one tone: no speckle, no jump between near and far crowns
    alb *= mix(1., mix(mix(0.62, 1.3, ros), 1.05, rosFar), 1. - back);
    alb += vec3(0.008, 0.02, 0.02) * ros * ros * (1. - back) * (1. - rosFar);   // pale rosette tips
    // the underside: dead leaf bases and bark, never black; by night it is the red of the tree's blood
    if (back > 0.5) { alb = mix(alb, mix(vec3(0.13, 0.12, 0.105), vec3(0.36, 0.045, 0.04), uView.z), mix(0.8 * (1. - 0.95 * vKeep), 0.92, uView.z)); N = -N; }
  }
  float m = sunMask(vWp);
  float ndl = dot(N, uSunDir);
  float wrap = mix(clamp(ndl, 0., 1.), clamp(ndl * 0.6 + 0.4, 0., 1.), leafy);
  float under = step(0.5, kind) * (1. - step(1.5, kind));
  vec3 lit = uSunCol * wrap * m * (1. - 0.62 * under) + uSkyCol * (0.55 + 0.45 * N.y) * (1. - 0.3 * under) + uBounce * (0.5 - 0.5 * N.y);
  // under the cap cloud the crowns are lit by the whole pearl sky: dark blue-green, never black beside the sunlit ones
  lit += (uSkyCol * 0.3 + uFogLit * 0.62) * (1. - m) * leafy * clamp(0.6 + 0.4 * N.y, 0., 1.) * (1. - 0.9 * vKeep) * step(0., uSunDir.y);
  // the fog sheet below is the brightest thing in the grove: it lights every underside
  lit += uFogLit * (0.2 + 0.34 * m) * clamp(0.5 - 0.85 * N.y, 0., 1.3) * (1. + 0.35 * under) * (1. - 0.6 * leafy * (1. - step(4.5, kind))) * (1. - 0.95 * vKeep) + uSkyCol * 0.22 * leafy;
  vec3 col = alb * lit;
  if (kind > 4.5) { vec2 rd = vUv - 0.5; float rib = 0.5 + 0.5 * sin(atan(rd.y, abs(rd.x) + 1e-4) * 26. + length(rd) * 9.); col *= mix(1., 0.62 + 0.5 * rib, back); ribU = rib; }
  col *= mix(1., mix(0.82, 0.9, step(4.5, kind)), back * leafy);
  float thru = max(dot(-V, uSunDir), 0.);
  col += alb * uSunCol * m * 0.3 * thru * thru * leafy * (1. - step(4.5, kind));
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
  float sp = pow(max(dot(N, H), 0.), 48.);
  col += gloss * uSunCol * (m * sp * 1.8 + 0.03) + wet * (uFogLit * (0.5 + 0.5 * m) + uSkyCol * 0.5);
  // night: the sap veins (a slow pulse running down them), the scars and the crowns' undersides glow like embers, and
  // every edge seen against the moon is rimmed silver
  float flowS = 0.6 + 0.4 * sin(vUv.y * 2.4 - uTime * 1.3 + sapN * 31.);
  float underG = back * step(4.5, kind);
  float farG = smoothstep(45., 170., length(Vd));                              // across the bay a crown's underside and its trunk are one ember each
  col += uEmber * (sap * (0.5 + 0.7 * flowS) + resin * 0.9 + underG * (0.12 + 0.2 * ribU) * (1. + 2.2 * farG) + 0.05 * back * leafy * (1. - step(4.5, kind)) + 0.2 * farG * (1. - leafy));
  col += uRim * moonRim(N, V) * mix(1., 0.28, leafy);
  // the canyon's own trees (aInst.y = -2) are seen from above and far off: the crown's top takes the night sky, a dark
  // blue-green dome with pale tips (never a black hole in a ring of red), and the trunk under it is lit by its own blood
  float cany = step(vK.y, -1.5);
  col += (alb * 1.15 + 0.01) * uRim * vec3(0.55, 0.85, 1.3) * leafy * (1. - back * step(4.5, kind)) * (0.45 + 0.55 * clamp(N.y, 0., 1.)) * cany;
  col += uEmber * 0.15 * (1. - leafy) * (1. - 0.6 * farG) * cany;
  col = mix(applySlab(col, vWp, uCamL), col, vKeep);     // vKeep: the one umbrella that must stand dark in the pearl
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  #include <fog_fragment>
  gl_FragColor.rgb = mix(farPearl(gl_FragColor.rgb, vWp, uCamL), gl_FragColor.rgb, vKeep);
}`;

// tree positions: a hand-set avenue of full-detail trees along the fly line, then a jittered grid
async function placeTrees(rng, L, fly, density, route, pause) {
  const trees = [], cell = 12.5 / Math.sqrt(density);
  const flyPts = fly.getSpacedPoints(route ? 150 : 90);
  const flyDist = (x, z) => { let b = 1e9; for (const p of flyPts) { if (p.y < RIM || p.y > RIM + 15) continue; const d = Math.hypot(p.x - x, p.z - z); if (d < b) b = d; } return b; };
  const flyDistAll = (x, z) => { let b = 1e9; for (const p of flyPts) { if (p.y < RIM) continue; const d = Math.hypot(p.x - x, p.z - z) + Math.max(p.y - RIM - 12, 0) * 0.5; if (d < b) b = d; } return b; };
  const hash = new Map(), key = (x, z) => Math.floor(x / 16) + ':' + Math.floor(z / 16);
  const add = (t) => { trees.push(t); const k = key(t.x, t.z); if (!hash.has(k)) hash.set(k, []); hash.get(k).push(t); };
  const tooClose = (x, z, d) => { const cx = Math.floor(x / 16), cz = Math.floor(z / 16);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = hash.get((cx + i) + ':' + (cz + j)); if (a) for (const t of a) if (Math.hypot(t.x - x, t.z - z) < d) return true; } return false; };
  // avenue: alternate sides of the fly line, crown rim 6.3 m from it
  const tan = new V3(); let resin = null, side = 1;
  if (route && route.axisTrees) for (const a of route.axisTrees) {
    const t = { x: a.x, z: a.z, s: a.s, rot: rng() * TAU, lod: 0, variant: a.variant ?? 1, scar: -1, phase: rng() * TAU, tint: a.tint ?? 0.5, keep: a.keep || 0 };
    if (a.scarTo) { const nx = a.scarTo.x - a.x, nz = a.scarTo.z - a.z, nl = Math.hypot(nx, nz) || 1; t.rot = 0; t.scar = ((Math.atan2(nx / nl, nz / nl) / TAU) % 1 + 1) % 1; }
    add(t);
  }
  let resinU = 0.44;
  if (route && route.resinAt) { let b = 1e9; for (let i = 0; i <= 400; i++) { const d = fly.getPointAt(i / 400).distanceTo(route.resinAt); if (d < b) { b = d; resinU = i / 400; } } }
  const NA = route ? (route.avenue || 22) : 13, uStep = route ? 0.9 / NA : 0.058;
  for (let k = 0; k < NA; k++) {
    let u = 0.04 + k * uStep; if (route && !resin && u < resinU && u + uStep >= resinU) u = resinU;
    const p = fly.getPointAt(u); fly.getTangentAt(u, tan);
    const g = L.z(p.x) - p.z; if (g < 8) break;
    if (p.y > RIM + 12) continue;
    const rx = -tan.z, rz = tan.x, len = Math.hypot(rx, rz) || 1;      // right-hand side of travel
    const isResin = !resin && u >= resinU - 1e-6;
    const s = isResin ? 1.22 : rng.range(0.92, 1.16), variant = k % 3;
    const off = isResin ? 5.5 : 5.2 * s + 6.4 + rng.range(0, 1.5), sg = isResin ? (route && route.resinSide) || 1 : side;
    const x = p.x + rx / len * off * sg, z = p.z + rz / len * off * sg;
    if (!isResin && (L.z(x) - z < 5.5 * s || tooClose(x, z, 9.5) || flyDist(x, z) < 5.2 * s + 5.6)) { side = -side; continue; }
    const t = { x, z, s, rot: rng() * TAU, lod: 0, variant, scar: -1, phase: rng() * TAU, tint: rng() };
    if (isResin) {
      const nx = (p.x - x) * 0.8 - tan.x * 4, nz = (p.z - z) * 0.8 - tan.z * 4, nl = Math.hypot(nx, nz) || 1;
      t.rot = 0; t.scar = ((Math.atan2(nx / nl, nz / nl) / TAU) % 1 + 1) % 1; t.variant = 0;
      resin = { tree: t, normal: new V3(nx / nl, 0, nz / nl), from: p.clone() };
    } else side = -side;
    add(t);
  }
  // the grove: jittered grid, belt 120 m deep at full density, thinner behind
  const zBack = -(L.depth + 14 + 185), cand = [];
  for (let x = -412; x < 412; x += cell) for (let z = zBack + 8; z < 18; z += cell) cand.push([x, z]);
  await pause(); let nc = 0;
  for (const [gx, gz] of cand) {
    if (++nc % 60 === 0) await pause();
    const x = gx + rng.range(0.1, 0.9) * cell, z = gz + rng.range(0.1, 0.9) * cell, s = rng.range(0.82, 1.18);
    const g = L.z(x) - z, keep = rng();
    if (g < 3.6 || Math.abs(x) > 414) continue;
    if (g > 120 && keep > (g > 190 ? 0.3 : 0.42)) continue;
    if (tooClose(x, z, 9.3)) continue;
    const fd = flyDist(x, z); if (fd < 5.3 * s + 6.6) continue;
    add({ x, z, s, rot: rng() * TAU, lod: 2, variant: rng.int(0, 2), scar: rng() < 0.16 ? rng() : -1, phase: rng() * TAU, tint: rng(), fd, fdAll: flyDistAll(x, z) });
  }
  // nearest of the grid trees become mid detail
  // (laid after everything else and from a stream of their own, so that the grove keeps the layout it had:
  //  route.clear = [{ x, z, r }] takes ordinary trees out of a spot the eye would crop them at; route.giants =
  //  [{ x, z, s, variant }] are old, big umbrellas at mid detail, each taking the place of the grid trees under it)
  if (route && route.clear) for (const c of route.clear) for (let i = trees.length - 1; i >= 0; i--) {
    const t = trees[i]; if (t.scar >= 0 && t.lod === 0) continue; if ((t.keep || 0) > 0 || (resin && resin.tree === t)) continue;
    if (Math.hypot(t.x - c.x, t.z - c.z) < c.r) trees.splice(i, 1);
  }
  if (route && route.giants) {
    const gr = makeRng(hashSeed('giants:' + Math.round(L.depth * 100)));
    for (const a of route.giants) {
      for (let i = trees.length - 1; i >= 0; i--) { const t = trees[i]; if (t.lod === 2 && Math.hypot(t.x - a.x, t.z - a.z) < 3.4 * (a.s + t.s)) trees.splice(i, 1); }
      trees.push({ x: a.x, z: a.z, s: a.s, rot: gr() * TAU, lod: a.lod ?? 1, variant: a.variant ?? 0, scar: -1, phase: gr() * TAU, tint: a.tint ?? 0.35, giant: true });
    }
  }
  return { trees, resin, zBack };
}

// top-down mask painted once: R = crowns (their shadows on the fog), G = trunk wakes streaming downwind
// A (only under a low sun) = the shadow each trunk and crown lays across the fog top, in true projection
async function paintMask(trees, X0, Z0, W, H, pause, shd = null) {
  // painted on the CPU into a byte texture (a 2D canvas rasterised its three thousand gradients in one long task)
  const MW = 2048, MH = 1024, px8 = new Uint8Array(MW * MH * 4), sx = MW / W, sz = MH / H;
  await pause();
  const add = (x, y, ch, v) => { if (x < 0 || y < 0 || x >= MW || y >= MH || v <= 0) return; const k = (y * MW + x) * 4 + ch; px8[k] = Math.min(255, px8[k] + v * 255); };
  const ramp = (t, a0, tm, am) => (t <= 0 ? a0 : t >= 1 ? 0 : t < tm ? a0 + (am - a0) * t / tm : am * (1 - (t - tm) / (1 - tm)));
  // an ellipse with a radial falloff
  const disc = (cx, cy, rx, ry, ch, a0, tm, am) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, t = Math.sqrt(dx * dx + dy * dy); if (t < 1) add(x, y, ch, ramp(t, a0, tm, am));
    }
  };
  const setMax = (x, y, v) => { const k = (y * MW + x) * 4 + 3, q = v * 255; if (q > px8[k]) px8[k] = q; };
  // a capsule from a to b (metres), radius r, edge e metres soft
  const capsule = (ax, az, bx, bz, r, e, amp) => {
    const xa = Math.max(Math.floor((Math.min(ax, bx) - r - X0) * sx), 0), xb = Math.min(Math.ceil((Math.max(ax, bx) + r - X0) * sx), MW - 1);
    const ya = Math.max(Math.floor((Math.min(az, bz) - r - Z0) * sz), 0), yb = Math.min(Math.ceil((Math.max(az, bz) + r - Z0) * sz), MH - 1);
    const vx = bx - ax, vz = bz - az, vv = Math.max(vx * vx + vz * vz, 1e-6);
    for (let y = ya; y <= yb; y++) { const pz = (y + 0.5) / sz + Z0 - az;
      for (let x = xa; x <= xb; x++) { const px = (x + 0.5) / sx + X0 - ax, tt = clamp((px * vx + pz * vz) / vv, 0, 1), ex = px - vx * tt, ez = pz - vz * tt, d = Math.sqrt(ex * ex + ez * ez); if (d < r) setMax(x, y, amp * clamp((r - d) / e, 0, 1)); } }
  };
  let nt = 0;
  for (const t of trees) {
    if (shd || (++nt & 1) === 0) await pause();                            // a tree's crown, wake and shadow are thousands of texels
    if (shd) {
      const d = shd.depthAt(t.x, t.z), s = t.s, off = (h) => Math.min(Math.max(h - d, 0) / shd.tan, 64);
      const hT = 5.3 * s, h0 = 5.7 * s, h1 = 7.6 * s;
      if (hT > d + 0.3) capsule(t.x, t.z, t.x + shd.dx * off(hT), t.z + shd.dz * off(hT), Math.max(0.5 * s, 0.6), 0.6, 0.9);
      if (h1 > d + 0.5) capsule(t.x + shd.dx * off(h0), t.z + shd.dz * off(h0), t.x + shd.dx * off(h1), t.z + shd.dz * off(h1), 4.5 * s * clamp((h1 - d) / 2.2, 0.35, 1), 1.5, 1);
    }
    const cx = (t.x - X0) * sx, cz = (t.z - Z0) * sz, r = 4.6 * t.s, len = 30 * t.s, y0 = cz - 0.8 * sz, y1 = cz + len * sz;
    const nearT = !t.giant && !(t.keep > 0) && (t.fd === undefined || t.fd < 30);
    disc(cx, cz, r * sx, r * sz, 0, 1, 0.8, 0.95);                           // r: the crown
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const f = (y + 0.5 - cz) / (len * sz);
      // b: the trough of the wake, a wedge widening downwind
      if (y + 0.5 >= cz - 0.4 * sz) { const fw = clamp((y + 0.5 - (cz - 0.4 * sz)) / (y1 - (cz - 0.4 * sz)), 0, 1), hw = lerp(0.6, 3.6, fw) * sx, a = ramp(f, 0.95, 0.4, 0.5);
        for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) add(x, y, 2, a * clamp(hw + 0.5 - Math.abs(x + 0.5 - cx), 0, 1));
        // the trunks nearest the route trail a wide, shallow skirt as well: by day the river opens there into a lane
        // half a crown wide and two crowns long (kept under the level at which a thin veil or the night river tears)
        if (nearT && f < 0.72) { const hs = lerp(1.5, 5.6, Math.min(fw * 1.6, 1)) * sx * t.s, as = 0.3 * (1 - smoothstep(0.5, 0.72, f)) * smoothstep(0, 0.05, fw);
          for (let x = Math.floor(cx - hs); x <= Math.ceil(cx + hs); x++) { const k = (y * MW + x) * 4 + 2; if (x < 0 || y < 0 || x >= MW || y >= MH) continue; const v = 255 * as * clamp((hs + 0.5 - Math.abs(x + 0.5 - cx)) / 3, 0, 1); if (v > px8[k]) px8[k] = v; } } }
      // g: its two rippling edges
      const fe = clamp((y + 0.5 - y0) / (y1 - y0), 0, 1), ex = lerp(0.9, 4.6, fe) * sx, hw2 = 0.75 * sx, a2 = ramp(f, 1, 0.5, 0.6);
      for (const sg of [-1, 1]) for (let x = Math.floor(cx + sg * ex - hw2); x <= Math.ceil(cx + sg * ex + hw2); x++) add(x, y, 1, a2 * clamp(hw2 + 0.5 - Math.abs(x + 0.5 - (cx + sg * ex)), 0, 1));
    }
    disc(cx, cz - 1.5 * sz, 2.6 * sx, 2.0 * sz, 1, 0.9, 0.5, 0.5);         // g: the pillow the river piles up against the trunk's upwind side
  }
  const tex = new THREE.DataTexture(px8, MW, MH, THREE.RGBAFormat); tex.flipY = false; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------------------------------
// rock: the escarpment wall (a closed loop: detailed front, plain sides and back), the plateau top and
// the free-standing pinnacle, one geometry. Vertex colour: r = occlusion, g = unused, b = fog-wet.
const clingOut = (hh) => 10 * (1 - Math.exp(-0.9 * Math.sqrt(Math.max(hh, 0)))) + 0.05 * hh;
function resample(pts, n) {
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1], out = []; let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = total * i / n; while (j < pts.length - 2 && cum[j + 1] < s) j++;
    const f = clamp((s - cum[j]) / Math.max(cum[j + 1] - cum[j], 1e-6), 0, 1);
    out.push({ x: lerp(pts[j][0], pts[j + 1][0], f), z: lerp(pts[j][1], pts[j + 1][1], f), a: s });
  }
  return out;
}
async function buildRock(rng, noise, L, zBack, P, pinAt, pause) {
  const XW = 430, fine = [];
  for (let x = -XW; x <= XW; x += 1) fine.push([x, L.z(x)]);
  const front = resample(fine, 136); front.forEach((c) => { c.front = true; });
  const zE = L.z(XW), zW = L.z(-XW), loop = front.slice();
  for (let i = 1; i <= 11; i++) loop.push({ x: XW, z: lerp(zE, zBack, i / 12) });
  for (let i = 0; i <= 21; i++) loop.push({ x: lerp(XW, -XW, i / 22), z: zBack });
  for (let i = 0; i <= 11; i++) loop.push({ x: -XW, z: lerp(zBack, zW, i / 12) });
  const NC = loop.length; let s = 0;
  for (let i = 0; i < NC; i++) {
    const a = loop[(i + NC - 1) % NC], b = loop[(i + 1) % NC], c = loop[i];
    let tx = b.x - a.x, tz = b.z - a.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    if (c.front && (i === 0 || i === 136)) { tx = 1; tz = 0; }
    c.tx = tx; c.tz = tz; c.nx = -tz; c.nz = tx;
    if (i > 0) s += Math.hypot(c.x - loop[i - 1].x, c.z - loop[i - 1].z); c.s = s;
  }
  for (let pass = 0; pass < 60; pass++) {
    let px = front[0].nx, pz = front[0].nz;
    for (let i = 1; i < 136; i++) { const c = front[i], nx = (px + 2 * c.nx + front[i + 1].nx) / 4, nz = (pz + 2 * c.nz + front[i + 1].nz) / 4; px = c.nx; pz = c.nz; c.nx = nx; c.nz = nz; }
  }
  for (let i = 1; i < 136; i++) { const c = front[i], l = Math.hypot(c.nx, c.nz) || 1; c.nx /= l; c.nz /= l; }
  // beds
  const bands = []; let yy = RIM;
  while (yy > 0.5) { let t = rng.range(9, 24); if (yy - t < 6) t = yy; bands.push({ hi: yy, lo: yy - t, o: rng() < 0.32 ? rng.range(4.5, 8) : rng.range(0, 3.2), seed: rng() * 50 }); yy -= t; }
  const rows = [{ y: RIM, k: 0, f: 0 }];
  bands.forEach((b, k) => {
    const t = b.hi - b.lo, n = Math.max(1, Math.round(t / 7.5));
    if (k > 0) rows.push({ y: b.hi - 0.45, k, f: 0 });
    for (let m = 0; m < n; m++) rows.push({ y: b.hi - t * (m + 0.5) / n, k, f: 0.5 });
    if (b.lo > 0.5) rows.push({ y: b.lo + 0.45, k, f: 1 });
  });
  rows.push({ y: 0, k: bands.length - 1, f: 1 });
  const bandOff = (k, s2) => bands[k].o * (0.5 + 0.7 * (0.5 + 0.5 * noise.n2(s2 / 80, bands[k].seed)));
  const ridge = (s2) => { const r = 1 - Math.abs(noise.n2(s2 / 95, 9.1)); return r * r; };
  const pos = [], col = [], idx = [];
  const outAt = (c, y, k) => {
    const h = RIM - y;
    let o = 0.05 * h + bandOff(k, c.s) + 11 * ridge(c.s) * (0.3 + 0.7 * h / RIM) + 3 * noise.fbm3(c.x * 0.045, y * 0.045, c.z * 0.045, 3) + 1.5;
    if (h > 250) o += 0.016 * (h - 250) * (h - 250);
    if (c.front && h < 105) o = lerp(Math.min(o, clingOut(h + P.fogLip) - 2.6), o, smoothstep(85, 105, h));
    return o * smoothstep(0, 5, h);
  };
  // wall
  const NR = rows.length;
  for (let j = 0; j < NR; j++) {
    const r = rows[j], v = r.y / RIM;
    for (let i = 0; i <= NC; i++) {
      const c = loop[i % NC], h = RIM - r.y;
      const y = r.y + 7 * Math.sin(Math.PI * v) * noise.n2(c.s / 260, 3.3);
      const o = outAt(c, r.y, r.k);
      pos.push(c.x + c.nx * o, y, c.z + c.nz * o);
      let ao = 1;
      if (r.k > 0 && r.f < 0.75) ao -= (r.f < 0.25 ? 0.62 : 0.3) * clamp((bandOff(r.k - 1, c.s) - bandOff(r.k, c.s)) / 3.5, 0, 1);
      ao *= 0.86 + 0.14 * noise.n2(c.s / 30, r.y / 30);
      col.push(ao, 0, c.front ? smoothstep(115, 15, h) : 0);
    }
    if ((j & 1) === 1) await pause();
  }
  for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NC; i++) {
    const a = j * (NC + 1) + i, b = a + 1, c = a + NC + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  // plateau top
  let base = pos.length / 3; const NP = 12;
  for (let d = 0; d <= NP; d++) for (let i = 0; i <= 136; i++) {
    const c = front[i], f = d / NP, z = lerp(c.z, zBack, f);
    pos.push(c.x, RIM + (d === 0 || d === NP || i === 0 || i === 136 ? 0 : 0.5 * noise.n2(c.x / 14, z / 14)), z);
    col.push(1, 0, 0);
  }
  for (let d = 0; d < NP; d++) for (let i = 0; i < 136; i++) {
    const a = base + d * 137 + i, b = a + 1, c = a + 137, e = c + 1;
    idx.push(a, b, c, b, e, c);
  }
  await pause();
  // pinnacle: 40 m across, top 15 m under the rim, 90 m out from the west shoulder
  const xw = L.cx - L.w1 / L.sl, pin = { x: pinAt ? pinAt.x : xw + 34, z: pinAt ? pinAt.z : L.z(xw) + 92, top: pinAt && pinAt.top !== undefined ? pinAt.top : RIM - 15, r: 20, ph: rng() * TAU };
  base = pos.length / 3; const PC = 26, prow = [{ y: pin.top, k: 0, f: 0 }].concat(rows.filter((r) => r.y < pin.top - 1));
  for (let j = 0; j < prow.length; j++) for (let i = 0; i <= PC; i++) {
    const r = prow[j], an = (i % PC) / PC * TAU, nx = Math.sin(an), nz = Math.cos(an), h = pin.top - r.y, s2 = 900 + i * 4.6;
    let rad = 13 + 0.03 * h + bandOff(r.k, s2) * 0.9 * (0.5 + 0.5 * noise.n2(an * 1.3 + r.k * 9.7, r.k * 3.3 + Math.cos(an))) + 4.5 * noise.fbm3(nx * 1.6 + 7, r.y * 0.03, nz * 1.6, 3);
    rad *= 1 + 0.2 * Math.sin(an * 2 + pin.ph + r.y * 0.006) + 0.12 * Math.sin(an * 3 + pin.ph * 2.3 - r.y * 0.011);
    if (h > 235) rad += 0.02 * (h - 235) * (h - 235);
    rad *= (0.5 + 0.5 * smoothstep(0, 9, h)) * lerp(1, pinAt && pinAt.slim ? pinAt.slim : 1, smoothstep(5, 28, h) * (1 - smoothstep(215, 260, h)));
    const lean = 5 * Math.sin(r.y * 0.011 + pin.ph) * smoothstep(0, 60, r.y);
    pos.push(pin.x + lean + nx * rad, r.y, pin.z + lean * 0.5 + nz * rad);
    let ao = 1; if (r.k > 0 && r.f < 0.75) ao -= (r.f < 0.25 ? 0.6 : 0.3) * clamp((bandOff(r.k - 1, s2) - bandOff(r.k, s2)) / 3.5, 0, 1);
    col.push(ao, 0, 0);
  }
  for (let j = 0; j < prow.length - 1; j++) for (let i = 0; i < PC; i++) {
    const a = base + j * (PC + 1) + i, b = a + 1, c = a + PC + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const capC = pos.length / 3; pos.push(pin.x + 5 * Math.sin(pin.top * 0.011 + pin.ph), pin.top + 1.6, pin.z + 2.5 * Math.sin(pin.top * 0.011 + pin.ph)); col.push(1, 0, 0);
  for (let i = 0; i < PC; i++) idx.push(capC, base + i, base + i + 1);
  await pause();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); await pause();
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); await pause();
  // (the index goes over in slices: copied in one go it held the page for longer than a frame should)
  const ix = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i += 120000) { const e = Math.min(i + 120000, idx.length); for (let k = i; k < e; k++) ix[k] = idx[k]; await pause(); }
  geo.setIndex(new THREE.BufferAttribute(ix, 1));
  // vertex normals, as three's computeVertexNormals makes them (area-weighted face normals summed at each vertex),
  // but in slices with a pause between: in one call it was the longest stall of the build
  const pa = geo.getAttribute('position').array, nrm = new Float32Array(pa.length);
  for (let i = 0; i < ix.length; i += 3) {
    const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
    const cx = pa[c] - pa[b], cy = pa[c + 1] - pa[b + 1], cz = pa[c + 2] - pa[b + 2], ax = pa[a] - pa[b], ay = pa[a + 1] - pa[b + 1], az = pa[a + 2] - pa[b + 2];
    const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
    nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
    if (i % 45000 === 44997) await pause();
  }
  await pause();
  for (let i = 0; i < nrm.length; i += 3) { const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l; }
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); await pause();
  return { geo, front, pin, tris: idx.length / 3 };
}
const ROCK_VS = /* glsl */`
varying vec3 vCol; varying vec3 vN; varying vec3 vWp;
#include <fog_pars_vertex>
void main(){
  vec4 wp = vec4(position, 1.);
  vWp = wp.xyz; vCol = color; vN = normal;
  vec4 mvPosition = viewMatrix * modelMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROCK_FS = /* glsl */`
varying vec3 vCol; varying vec3 vN; varying vec3 vWp;
uniform vec3 uRock; uniform vec3 uGreen; uniform vec3 uFloor; uniform vec3 uCamL; uniform float uFlush;
uniform vec4 uPin;        // the pinnacle's crown: centre x, centre z, top height, radius
uniform vec4 uBlob[12];   // things standing on the rock that shade it: x, z, radius, height of the foot
uniform float uWL;        // water level of the pools on the canyon floor (far below everything when there are none)
#include <fog_pars_fragment>
${COMMON}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float h = uFogP.x - vWp.y;
  float sx = vWp.x + vWp.z * 0.6;
  float warp = texture2D(uNoise, vWp.xz * 0.004 + vWp.y * 0.002).r;
  vec2 bq = vec2(sx * 0.0016, vWp.y * 0.041 + warp * 0.3);
  float bed = texture2D(uNoise, bq).g;
  float bedUp = texture2D(uNoise, bq + vec2(0., 0.004)).g;
  float fine = texture2D(uNoise, vec2(sx * 0.007, vWp.y * 0.31 + warp)).b;
  float camD = distance(uCamL, vWp), nearK = 1. - smoothstep(60., 240., camD);
  float streak = 0.5 * texture2D(uNoise, vec2(sx * 0.0113 + warp * 0.05, vWp.y * 0.0031)).r + 0.5 * texture2D(uNoise, vec2(sx * 0.0057 + 0.37, vWp.y * 0.0023 + warp * 0.02)).b;
  float grain = texture2D(uNoise, vWp.xy * 0.21 + vWp.z * 0.17).b;
  float flatness = smoothstep(0.5, 0.82, N.y);
  N = normalize(N + vec3(0., (bedUp - bed) * 5. + (fine - 0.5) * 0.5, 0.) * (1. - flatness) + vec3(0., 1e-4, 0.));
  float bed2 = texture2D(uNoise, vec2(sx * 0.0031 + 0.5, vWp.y * 0.13 + warp * 0.5)).r;
  float led = smoothstep(0.006, 0.03, bedUp - bed) * (1. - flatness);
  vec3 alb = uRock * (0.42 + 0.5 * bed) * (0.86 + 0.28 * grain) * (0.8 + 0.4 * bed2);
  alb = mix(alb, alb * vec3(1.1, 0.92, 0.74), smoothstep(0.5, 0.8, bed2) * 0.55);
  alb = mix(alb, alb * vec3(0.80, 0.75, 0.72), smoothstep(0.45, 0.75, fine) * 0.55);
  alb *= 1. - 0.1 * smoothstep(0.5, 0.74, streak) * (1. - flatness);
  alb = mix(alb, uRock * vec3(0.98, 0.96, 0.9), flatness * 0.45);
  float veg = smoothstep(0.7, 0.92, N.y) * smoothstep(0.55, 0.85, texture2D(uNoise, vWp.xz * 0.06).g) * smoothstep(3., 8., h) * (1. - smoothstep(215., 250., h));
  alb = mix(alb, uGreen * 1.25, veg * 0.5);
  alb = mix(alb, uRock * 0.9 * (0.75 + 0.4 * grain), smoothstep(235., 270., h) * 0.7);
  float scrubN = texture2D(uNoise, vWp.xz * 0.0019).r * 0.65 + texture2D(uNoise, vWp.xz * 0.011).g * 0.35;
  float scrub = smoothstep(0.42, 0.62, scrubN) * smoothstep(255., 285., h) * flatness * (1. - vCol.g);
  alb = mix(alb, mix(uGreen * 1.5, vec3(0.3, 0.25, 0.13), 0.35 + 0.3 * grain), scrub * 0.6);
  float top = flatness * (1. - smoothstep(1., 4., h));
  float gk = texture2D(uNoise, vWp.xz * 0.085).r, gk2 = texture2D(uNoise, vWp.xz * 0.33).b;
  float grike = (1. - smoothstep(0.0, 0.05 + camD * 0.0004, abs(gk - 0.5))) * (0.25 + 0.75 * nearK);
  vec3 pave = vec3(0.2, 0.192, 0.182) * (0.66 + 0.6 * gk2);
  pave = mix(pave, vec3(0.07, 0.07, 0.065), grike * 0.85);
  float tus = smoothstep(0.6, 0.72, texture2D(uNoise, vWp.xz * 0.052 + 0.3).g);
  pave = mix(pave, mix(vec3(0.46, 0.42, 0.27), uGreen * 1.2, max(step(0.55, gk2), uFlush)), tus * 0.75);
  pave = mix(pave, uGreen * 1.5, uFlush * 0.35 * smoothstep(0.4, 0.6, gk2));
  // cushion shrubs painted on the pavement between the real ones: what a hole torn in the fog shows at its bottom
  vec2 cg = vWp.xz * 0.21; vec2 ci = floor(cg), cf = fract(cg) - 0.5;
  float ch = fract(sin(dot(ci, vec2(127.1, 311.7))) * 43758.5453), ch2 = fract(ch * 7.31);
  vec2 co = cf - (vec2(ch2, fract(ch * 3.7)) - 0.5) * 0.5; float cr = length(co) / (0.15 + 0.17 * ch2);
  float cush = (1. - smoothstep(0.55, 1., cr + (gk2 - 0.5) * 0.7 + (gk - 0.5) * 0.5)) * step(0.62, ch) * (1. - smoothstep(90., 220., camD));
  vec3 cushC = mix(uGreen * 1.25, vec3(0.16, 0.17, 0.1), fract(ch * 5.3)) * (0.45 + 0.75 * clamp(1. - cr * cr, 0., 1.)) * (0.6 + 0.8 * gk2);
  pave = mix(pave * (1. - 0.4 * smoothstep(1.5, 0.9, cr) * step(0.62, ch)), cushC, cush * 0.9);
  alb = mix(alb, pave, top);
  // ledge and pinnacle tops: weathered lichen-grey pavement cut by grikes, never bleached
  float topK = flatness * (1. - smoothstep(4., 40., h)) * (1. - top);
  float gkB = texture2D(uNoise, vWp.xz * 0.23 + 0.4).g;
  float grB = max(grike, (1. - smoothstep(0.0, 0.06, abs(gkB - 0.5))) * nearK);
  vec3 ledge = mix(pave * 1.7, uRock * 0.55, 0.45) * (0.7 + 0.6 * gk2);
  ledge = mix(ledge, vec3(0.31, 0.33, 0.29) * (0.7 + 0.6 * grain), smoothstep(0.5, 0.68, texture2D(uNoise, vWp.xz * 0.11 + 0.7).r) * 0.7);
  ledge = mix(ledge, vec3(0.06, 0.055, 0.05), grB * 0.85);
  alb = mix(alb, ledge, topK * 0.85);
  // the pinnacle's crown, passed within twenty metres: weathered grey karst. Clints split by dark grikes a hand wide
  // wherever it lies near level, runnels fluting the steep faces, crust lichen and rust in patches, solution pits
  vec2 pq = vWp.xz - uPin.xy; float pdist = length(pq);
  float crownK = (1. - smoothstep(uPin.w, uPin.w + 6., pdist)) * smoothstep(uPin.z - 20., uPin.z - 10., vWp.y) * step(vWp.y, uPin.z + 6.);
  if (crownK > 0.001) {
    float nearC = 1. - smoothstep(45., 150., camD);
    vec2 wob = vec2(gk, gk2) - 0.5;
    vec2 g1 = mat2(0.78, 0.62, -0.62, 0.78) * vWp.xz * 0.62 + wob * 0.5 + vWp.y * 0.21;
    vec2 c1 = floor(g1), f1 = abs(fract(g1) - 0.5);
    float h1 = fract(sin(dot(c1, vec2(91.7, 37.3))) * 43758.5453);
    float w1 = 0.07 + 0.06 * h1 + min(camD, 70.) * 0.0009;
    float e1 = 0.5 - max(f1.x, f1.y), gr1 = 1. - smoothstep(w1 * 0.55, w1, e1), lip1 = smoothstep(w1, w1 * 1.25, e1) * (1. - smoothstep(w1 * 1.5, w1 * 2.6, e1));
    vec2 g2 = mat2(0.94, -0.34, 0.34, 0.94) * vWp.xz * 1.9 + wob * 0.8 + vWp.y * 0.5;
    vec2 f2 = abs(fract(g2) - 0.5);
    float gr2 = (1. - smoothstep(0.04, 0.1, 0.5 - max(f2.x, f2.y))) * step(0.45, h1) * nearC;
    // (the runnels are laid by angle round the crown, twice, each copy faded out round its own seam)
    float angA = atan(pq.y, pq.x + 1e-4), angB = atan(-pq.y, -pq.x + 1e-4), wA = 0.5 + 0.5 * cos(angA);
    float flA = (1. - smoothstep(0.03, 0.12, abs(texture2D(uNoise, vec2(angA * 1.9, vWp.y * 0.021 + 0.3)).b - 0.5))) * 0.75 + (1. - smoothstep(0.02, 0.1, abs(texture2D(uNoise, vec2(angA * 5.3 + 0.4, vWp.y * 0.05)).g - 0.5))) * 0.5 * nearC;
    float flB = (1. - smoothstep(0.03, 0.12, abs(texture2D(uNoise, vec2(angB * 1.9 + 0.5, vWp.y * 0.021 + 0.3)).b - 0.5))) * 0.75 + (1. - smoothstep(0.02, 0.1, abs(texture2D(uNoise, vec2(angB * 5.3 + 0.9, vWp.y * 0.05)).g - 0.5))) * 0.5 * nearC;
    float steep = 1. - smoothstep(0.35, 0.75, N.y);
    float grk = clamp(mix(max(gr1, gr2 * 0.45), mix(flB, flA, wA) * 0.38, steep), 0., 1.) * mix(0.3, 1., nearC);
    float pt = texture2D(uNoise, vWp.xz * 0.83 + vWp.y * 0.61).b, pt2 = texture2D(uNoise, vWp.xz * 0.19 + vWp.y * 0.13 + 0.5).r;
    vec3 karst = vec3(0.262, 0.25, 0.228) * (0.62 + 0.7 * pt2) * (0.8 + 0.4 * h1 * (1. - steep));
    karst = mix(karst, vec3(0.3, 0.33, 0.27), smoothstep(0.5, 0.64, texture2D(uNoise, vWp.xz * 0.07 + vWp.y * 0.05 + 0.2).g) * 0.75);
    karst = mix(karst, vec3(0.36, 0.2, 0.1), smoothstep(0.58, 0.7, texture2D(uNoise, vWp.xz * 0.06 + vWp.y * 0.04 + 0.8).r) * 0.7);
    karst = mix(karst, karst * 1.5 + 0.03, lip1 * (1. - steep) * 0.6 * nearC);
    karst *= 1. - 0.4 * smoothstep(0.6, 0.8, pt) * nearC;
    karst = mix(karst, vec3(0.06, 0.058, 0.065), grk * 0.88);
    float kk = crownK * mix(1., 0.62, steep * (1. - smoothstep(uPin.z - 14., uPin.z - 6., vWp.y)));      // cream is left only on the strata faces below the top
    alb = mix(alb, karst, kk);
    float ta = h1 * 6.2832;
    N = normalize(N + (vec3(pt - 0.5, 0., pt2 - 0.5) * 0.9 + vec3(cos(ta), 0., sin(ta)) * 0.22 * (1. - steep) - vec3(0., grk * 0.5, 0.)) * kk + vec3(0., 1e-4, 0.));
  }
  float fl = flatness * smoothstep(280., 296., h) * vCol.g;
  float damp = smoothstep(0.35, 0.7, texture2D(uNoise, vWp.xz * 0.013 + 0.21).r);
  // the canyon floor in three tones: white limestone flags split by joints, bars of grey gravel, damp ochre flats
  vec2 sq = vWp.xz * 0.15 + (vec2(gk, texture2D(uNoise, vWp.zx * 0.027 + 0.4).g) - 0.5) * 1.1;
  vec2 si = floor(sq), sf = abs(fract(sq) - 0.5);
  float sh1 = fract(sin(dot(si, vec2(41.3, 289.1))) * 43758.5453);
  float joint = 1. - smoothstep(0.012, 0.04 + camD * 0.00035, 0.5 - max(sf.x, sf.y));
  vec3 flo = uFloor * (0.74 + 0.26 * sh1) * (0.8 + 0.26 * grain) * (0.9 + 0.2 * gk2) * (1. - 0.6 * joint * (1. - smoothstep(120., 420., camD))) * (1. - 0.22 * grike);
  float gravel = smoothstep(0.54, 0.63, texture2D(uNoise, vWp.xz * 0.0077 + 0.63).r * 0.72 + texture2D(uNoise, vWp.xz * 0.045 + 0.2).g * 0.28);
  vec3 grav = vec3(0.3, 0.29, 0.275) * (0.5 + 1. * texture2D(uNoise, vWp.xz * 1.1).b) * (0.85 + 0.3 * gk2);
  flo = mix(flo, grav, gravel * 0.9);
  flo = mix(flo, flo * vec3(0.84, 0.76, 0.62), damp * 0.6 * (1. - gravel));
  // the pools' shores (vCol.b: near a pool): the bed dark and wet under the water and for a hand's height above it,
  // then a pale rim of calcite
  float hw = vWp.y - uWL + (gk2 - 0.5) * 0.05;
  float wetM = (1. - smoothstep(0.02, 0.11, hw)) * vCol.b, rimC = smoothstep(0.08, 0.13, hw) * (1. - smoothstep(0.2, 0.36, hw)) * vCol.b;
  flo = mix(flo, vec3(0.8, 0.77, 0.69) * (0.86 + 0.2 * grain), rimC * 0.85);
  flo *= 1. - 0.6 * wetM;
  flo = mix(flo, vec3(0.2, 0.33, 0.3) * (0.6 + 0.6 * grain), (1. - smoothstep(-0.5, 0., hw)) * vCol.b * 0.7);
  alb = mix(alb, flo, fl);
  alb *= 1. - 0.32 * vCol.b * (1. - fl);
  float m = sunMask(vWp), ao = vCol.r;
  // whatever stands on the rock shades its foot and throws a short shadow down-sun
  float occ = 0.;
  for (int i = 0; i < 12; i++) {
    vec4 bl = uBlob[i];
    float dd = length(vWp.xz - bl.xy + uSunDir.xz * bl.z * 0.45) / max(bl.z, 0.01);
    occ = max(occ, (1. - smoothstep(0.7, 1.55, dd)) * (1. - smoothstep(bl.z * 0.5 + 0.6, bl.z * 1.2 + 1.6, abs(vWp.y - bl.w))));
  }
  ao *= 1. - 0.55 * occ;
  m *= 1. - 0.5 * top * smoothstep(0.3, 0.9, uCap.z);
  float wall = smoothstep(2., 7., h);
  m = mix(m, 1., wall) * (1. - 0.8 * occ);      // the pavement lies in the shade of the sheet, except under its holes
  float fsh = floorShade(vWp);
  m *= 1. - 0.45 * fsh;                         // drifting shade of the dissolving cloud on the canyon floor
  float wr = mix(0.13, 0.36, wall * (1. - flatness));
  float ndl = max(dot(N, uSunDir) * (1. - wr) + wr, 0.);
  vec3 lit = uSunCol * ndl * m * mix(0.22, 1., ao) * (1. - 0.72 * led) + uSkyCol * (0.5 + 0.5 * N.y + 0.42 * wall * (1. - N.y)) * (0.35 + 0.65 * ao) * (1. - 0.25 * led) + uBounce * (0.6 - 0.4 * N.y) * ao;
  vec3 col = alb * lit;
  vec3 Vd = uCamL - vWp; vec3 V = Vd / max(length(Vd), 1e-3);
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
  col += uSunCol * m * vCol.b * 0.25 * pow(max(dot(N, H), 0.), 24.) * smoothstep(0.6, 0.8, grain);
  col += alb * uRim * moonRim(N, V) * 2.6;                       // night: cliff tops and ledges rimmed silver against the moon
  // night: no face is black. The sky's own deep blue fills every wall (a little more from above and on the side
  // turned to the moon, less in the recess under each bed), so the strata read as form in the dark
  vec3 mh = normalize(vec3(uSunDir.x, 0., uSunDir.z) + vec3(1e-5, 0., 0.));
  float toMoon = dot(N, mh);
  vec3 albN = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))), 0.72);
  // the beds by night: level layers some thirteen metres thick that dip gently along the wall. Each has its own tone
  // and is jointed into blocks, each block a shade of its own; under every bed's overhang lies a band of deep shade,
  // and the ledge on top of the bed below takes the sky: layered rock, not one navy face
  float bl = vWp.y * 0.078 + warp * 0.45 + texture2D(uNoise, vec2(sx * 0.0009, 0.37)).a * 1.5;
  float blw = fwidth(bl) + 1e-4, bf = fract(bl), bi = floor(bl), bh = fract(sin(bi * 12.9898) * 43758.5453);
  float bedK = (1. - smoothstep(0.22, 0.6, blw)) * (1. - flatness) * wall;
  float jx = sx * (0.05 + 0.04 * bh) + bh * 37., jr = fract(sin(floor(jx) * 78.233 + bi * 3.17) * 43758.5453);
  float jw = fwidth(jx) + 1e-4, jf = fract(jx), bjoint = (1. - smoothstep(0., 0.03 + jw, min(jf, 1. - jf))) * (1. - smoothstep(0.25, 0.6, jw));
  float under = smoothstep(0.66, 0.9, bf) * bedK;
  float shelf = (1. - smoothstep(0.05, 0.3, bf)) * bedK;
  float bedTone = mix(1., (0.68 + 0.46 * bh + 0.2 * jr) * (1. - 0.36 * bjoint), bedK);
  col += albN * uRim * vec3(0.5, 0.74, 1.42) * (0.3 + 0.22 * N.y + 0.3 * toMoon) * (0.35 + 0.65 * ao) * (1. - 0.45 * led) * (1. - top) * mix(0.55, 1., wall * (1. - fl)) * bedTone * (1. - 0.62 * under) * (1. + 0.4 * shelf);
  // whatever faces up (a ledge, the crown of a spur or of the pinnacle) takes the moonlit sky from above
  col += albN * uRim * vec3(0.56, 0.8, 1.36) * 0.75 * max(N.y, 0.) * (1. - top) * (0.4 + 0.6 * ao) * mix(0.5, 1., wall);
  col += alb * glowAt(vWp, N) * 2.3;                                 // and the stone by the glowing tree on the pinnacle takes its red
  // and the moon picks out the top edge of a bed: a blue-silver rim along the whole of a block, missing where a block
  // has fallen away, strongest where the face turns to the moon or stands under it in the eye's view (close by the
  // edges stay broad and soft; where the beds crowd closer than a pixel the glints melt into a faint sheen)
  float bth = 0.05 + 0.12 * bh, farL = smoothstep(60., 150., camD);
  float bthE = mix(bth, min(bth, blw * 1.25), farL);
  float ledT = smoothstep(0., blw * 1.4, bf) * (1. - smoothstep(bthE, mix(bth * 2.4 + blw * 1.4, bthE + blw * 1.3, farL), bf)) * smoothstep(0.22, 0.4, bh) * (0.45 + 0.55 * bh);
  ledT *= (1. - smoothstep(0.3, 0.7, blw)) * (1. - flatness) * wall;
  float brk = step(0.36, jr) * (1. - bjoint);
  vec2 vh = -V.xz; float bM = max(dot(vh / max(length(vh), 1e-3), mh.xz), 0.);      // how far round toward the moon the eye looks, whatever its pitch
  float moonW = clamp(0.05 + 0.95 * smoothstep(0.1, 0.95, bM) + 0.9 * max(dot(N, uSunDir), 0.), 0., 1.);
  col += uRim * (alb * 1.2 + 0.03) * ledT * (0.5 + 0.5 * ao) * mix(0.5, 1., smoothstep(25., 90., camD)) * (1. - 0.5 * smoothstep(350., 900., camD)) * brk * mix(1., 0.3 + 0.7 * moonW, farL) * 0.85;
  col = applySlab(col, vWp, uCamL);
  float clingK = vCol.b * (1. - smoothstep(3., 24., h)) * smoothstep(-1., 1.5, h) * 0.92 * uView.y * smoothstep(0.3, 0.9, uCap.z) * (0.5 + 0.5 * smoothstep(1., 4., uFogP.y));
  col = mix(col, mix(uFogShade, uFogLit, 0.3 + 0.7 * m), clingK);
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  #include <fog_fragment>
  gl_FragColor.rgb = farPearl(gl_FragColor.rgb, vWp, uCamL);
}`;

// ---------------------------------------------------------------------------------------------------
// fog: the sheet on the plateau that bends over the lip and clings (modes 0, 1), the curtains that peel
// off (2) and the streamers they tear into (3). One material, three meshes.
// aF = (mode, h: metres below the fog top or minus metres behind the lip, edge alpha, erosion threshold)
async function buildFog(rng, noise, front, zBack, P, pause) {
  const tauTab = [0]; { let prev = 0; for (let i = 1; i <= 540; i++) { const hh = i * 0.5, co = clingOut(hh), v = lerp(P.wind, 14, smoothstep(0, 14, hh)); tauTab.push(tauTab[i - 1] + Math.hypot(0.5, co - prev) / v); prev = co; } }
  const tauAt = (hh) => { const f = clamp(hh * 2, 0, 539.99), i = Math.floor(f); return lerp(tauTab[i], tauTab[i + 1], f - i); };
  const mk = () => ({ p: [], n: [], uv: [], f: [], t: [], l: [], sd: [], i: [], nv: 0 });
  const put = (G, x, y, z, nx, ny, nz, a, tau, mode, h, edge, th, c, side) => {
    G.p.push(x, y, z); G.n.push(nx, ny, nz); G.uv.push(a, tau); G.f.push(mode, h, edge, th); G.t.push(c.tx, c.tz); G.l.push(mode < 0.5 ? x : c.x, mode < 0.5 ? z : c.z); G.sd.push(side);
    return G.nv++;
  };
  const fin = (G, normals) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
    geo.setAttribute('aUV', new THREE.Float32BufferAttribute(G.uv, 2));
    geo.setAttribute('aF', new THREE.Float32BufferAttribute(G.f, 4));
    geo.setAttribute('aT', new THREE.Float32BufferAttribute(G.t, 2));
    geo.setAttribute('aL', new THREE.Float32BufferAttribute(G.l, 2));
    geo.setAttribute('aSide', new THREE.Float32BufferAttribute(G.sd, 1));
    geo.setIndex(G.i); if (normals) geo.computeVertexNormals();
    geo.boundingSphere = new THREE.Sphere(new V3(0, 180, -100), 700);
    return geo;
  };
  const NF = front.length - 1, topY = RIM + P.fogLip;
  // sheet on the plateau
  const S = mk(), gs = [1e9, 150, 118, 92, 68, 48, 32, 20, 10, 4, 0];
  for (let r = 0; r < gs.length; r++) for (let i = 0; i <= NF; i++) {
    const c = front[i], g = Math.min(gs[r], c.z - zBack);
    const edge = (r === 0 ? 0 : 1) * (i === 0 || i === NF ? 0 : 1);
    put(S, c.x, topY, c.z - g, 0, 1, 0, c.a, -g / P.wind, 0, -g, edge, 0, c, 0);
  }
  for (let r = 0; r < gs.length - 1; r++) for (let i = 0; i < NF; i++) {
    const a = r * (NF + 1) + i, b = a + 1, c = a + NF + 1, d = c + 1;
    S.i.push(a, c, b, b, c, d);
  }
  const A = front[NF].a, lipAt = (a) => {
    const f = clamp(a / A, 0, 0.9999) * NF, i = Math.floor(f), u = f - i, c0 = front[i], c1 = front[i + 1];
    return { x: lerp(c0.x, c1.x, u), z: lerp(c0.z, c1.z, u), nx: lerp(c0.nx, c1.nx, u), nz: lerp(c0.nz, c1.nz, u), tx: lerp(c0.tx, c1.tx, u), tz: lerp(c0.tz, c1.tz, u), a };
  };
  await pause();
  // over the lip and down the wall: twice the columns of the plateau sheet and six rings round the bend itself,
  // so the curve is a curve and its outline is not a row of facets
  const base = S.nv, NH = 21, NB = NF * 2;
  for (let r = 0; r <= NH; r++) { if (r % 2 === 1) await pause(); for (let i = 0; i <= NB; i++) {
    const c = i % 2 ? lipAt((front[(i - 1) / 2].a + front[(i + 1) / 2].a) / 2) : front[i / 2];
    const hh = 94 * Math.pow(r / NH, 2.3), co = clingOut(hh), dco = clingOut(hh + 0.25) - co;
    const cl = Math.hypot(c.nx, c.nz) || 1, cnx = c.nx / cl, cnz = c.nz / cl;
    const nl = Math.hypot(0.25, dco), ny = dco / nl, nh = 0.25 / nl;
    const edge = (r === NH ? 0 : 1) * (i === 0 || i === NB ? 0 : 1);
    const th = lerp(-0.6, 0.1, smoothstep(55, 94, hh)) + 0.14 * noise.n2(c.a / 110, 4.4) * smoothstep(40, 80, hh);
    put(S, c.x + cnx * co, topY - hh, c.z + cnz * co, cnx * nh, ny, cnz * nh, c.a, tauAt(hh), 1, hh, edge, th, c, 0);
  } }
  for (let r = 0; r < NH; r++) for (let i = 0; i < NB; i++) {
    const a = base + r * (NB + 1) + i, b = a + 1, c = a + NB + 1, d = c + 1;
    S.i.push(a, c, b, b, c, d);
  }
  await pause();
  // curtains
  const C = mk(), NK = 7, NJ = 12;
  for (let k = 0; k < NK; k++) {
    await pause();
    const a0 = Math.max(0, A * k / NK - 50 + rng.range(-20, 20)), a1 = Math.min(A, a0 + A / NK + 120), nc = Math.round((a1 - a0) / 10.5);
    const rk = rng(), b0 = C.nv, top = 46 + rng.range(0, 18), bot = 218 + rng.range(0, 22);
    for (let j = 0; j <= NJ; j++) for (let i = 0; i <= nc; i++) {
      const fa = i / nc, c = lipAt(lerp(a0, a1, fa)), fj = j / NJ, hh = lerp(top, bot, Math.pow(fj, 0.9));
      const co = clingOut(hh) + 1.5 + (k % 3) * 2.4 + 0.001 * (hh - 46) * (hh - 46) * (0.5 + 0.9 * rk) + 5 * Math.sin(c.a * 0.027 + k * 1.7) * smoothstep(50, 150, hh) + 6 * noise.n2(c.a / 60, hh / 60 + k * 5);
      const edge = smoothstep(0, 0.22, fa) * smoothstep(1, 0.78, fa) * smoothstep(0, 0.1, fj) * (j === NJ ? 0 : 1);
      const th = lerp(-0.3, 0.48, smoothstep(92, 142, hh)) + 0.32 * smoothstep(142, bot, hh) + 0.14 * noise.n2(c.a / 110, k * 3.1) * smoothstep(84, 130, hh);
      put(C, c.x + c.nx * co, topY - hh, c.z + c.nz * co, c.nx, 0, c.nz, c.a + k * 37, tauAt(hh) + k * 1.9, 2, hh, edge, th, c, 0);
    }
    for (let j = 0; j < NJ; j++) for (let i = 0; i < nc; i++) {
      const a = b0 + j * (nc + 1) + i, b = a + 1, c = a + nc + 1, d = c + 1;
      C.i.push(a, c, b, b, c, d);
    }
  }
  await pause();
  // streamers
  const R = mk(), NSEG = 8;
  for (let s = 0; s < 150; s++) {
    if (s % 25 === 24) await pause();
    const c = lipAt(rng.range(0.03, 0.97) * A), h0 = rng.range(112, 196), len = Math.min(rng.range(45, 88), 250 - h0);
    const w0 = rng.range(6, 14), spread = rng.range(0.4, 1.4), extra = rng.range(2, 12), ph = rng() * TAU, b0 = R.nv;
    for (let j = 0; j <= NSEG; j++) {
      const fj = j / NSEG, hh = h0 + len * fj, co = clingOut(hh) + extra + 0.001 * (hh - 46) * (hh - 46) * spread, wv = 3 * Math.sin(j * 0.9 + ph) * fj;
      const x = c.x + c.nx * co + c.tx * wv, z = c.z + c.nz * co + c.tz * wv, hw = lerp(w0, w0 * 0.38, Math.pow(fj, 0.8));
      const edge = smoothstep(0, 0.2, fj) * (j === NSEG ? 0 : 1), th = lerp(0.28, 0.78, fj);
      for (const sg of [-1, 1]) put(R, x, topY - hh, z, c.nx, 0, c.nz, c.a + s * 53 + sg * hw, tauAt(hh) + s * 0.7, 3, hh, edge, th, c, sg * hw);
    }
    for (let j = 0; j < NSEG; j++) { const a = b0 + j * 2; R.i.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  await pause();
  const sheetG = fin(S, false); await pause(); const curtG = fin(C, true); await pause(); const strmG = fin(R, false); await pause();
  return { sheet: sheetG, curtains: curtG, streamers: strmG, tris: (S.i.length + C.i.length + R.i.length) / 3, lipAt, A };
}
const FOG_VS = /* glsl */`
attribute vec2 aUV; attribute vec4 aF; attribute vec2 aT; attribute vec2 aL; attribute float aSide;
varying vec2 vUV; varying vec4 vF; varying vec3 vWp; varying vec3 vN; varying vec3 vX; varying float vS; varying float vAx;
uniform vec3 uCamL; uniform vec2 uFwd;
#include <fog_pars_vertex>
${COMMON}
// metres by which the lip's line rises and sinks along its length a: slow swells and lumps six metres long that
// travel with the wind, so the edge against the sea haze is never ruled
float lipLump(float a){
  float b1 = textureLod(uNoise, vec2(a * 0.011, uTime * 0.07), 0.).a - 0.5;
  float b2 = textureLod(uNoise, vec2(a * 0.043 + 0.5, uTime * 0.13), 0.).r - 0.5;
  return (b1 * 2.4 + b2 * 2.1) * mix(0.4, 1., deepK());
}
void main(){
  vec3 p = position; float mode = aF.x; vec3 nrm = normal;
  // the near river (aF.w = 1): a fan of rings laid round the eye each frame, far ring first, and raised into the
  // relief that the fragment shader lights, so that crests overlap, troughs hide and the wakes and holes are hollows
  float nearM = step(0.5, aF.w) * (1. - step(0.5, mode));
  vec2 L2 = aL; vec2 uvN = aUV; float gN = -aF.y;
  if (nearM > 0.5) { L2 = uCamL.xz + vec2(-uFwd.y, uFwd.x) * position.x + uFwd * position.z; p.xz = L2; gN = lipZf(L2.x) - L2.y; uvN = vec2(L2.x, -gN / max(uCap.y, 1.)); }
  float topLip = fogTop(L2);
  vec3 T3 = vec3(aT.x, 0., aT.y);
  if (mode < 0.5) {
    p.y = topLip + lipLump(aUV.x) * (1. - smoothstep(0., 22., gN)) * (1. - nearM);
    if (nearM > 0.5) {
      float d = length(position.xz);
      float calm = mix(0.32, 1., smoothstep(10., 34., gN)) * (1. - smoothstep(64., 100., d));
      float lod = clamp(log2(max(d, 1.) / 10.) + 3.5, 2., 7.);
      float pil = textureLod(uMask, (L2 - uMaskXf.xy) * uMaskXf.zw, 0.).g;
      float r0 = relief(L2, lod), st = max(1.2, d * 0.09);
      p.y = topLip + (r0 + 0.55 * pil) * calm;
      nrm = normalize(vec3(-(relief(L2 + vec2(st, 0.), lod) - r0) / st * calm, 1., -(relief(L2 + vec2(0., st), lod) - r0) / st * calm));
    }
  }
  else {
    p.y += (topLip - (uFogP.x + uFogP.y)) * exp(-aF.y / 9.) + lipLump(aUV.x) * exp(-aF.y / 7.) * (1. - step(1.5, mode));
    // slow billows ride down the clinging sheet, so its outline against the sky is never a ruled line
    float bl = textureLod(uNoise, vec2(aUV.x * 0.011, (aUV.y - uTime) * 0.33), 0.).a - 0.5;
    float bl2 = textureLod(uNoise, vec2(aUV.x * 0.043 + 0.5, (aUV.y - uTime) * 0.6), 0.).r - 0.5;
    p += normal * ((bl + 0.2) * 3. * smoothstep(0.02, 5., aF.y) + bl2 * 1.5 * smoothstep(0.02, 2., aF.y)) * (1. - step(1.5, mode));
    float sway = smoothstep(40., 200., aF.y);
    p += vec3(-aT.y, 0., aT.x) * sway * 3. * sin(uTime * 0.31 + aUV.x * 0.021 + aF.y * 0.02) + T3 * sway * 2. * sin(uTime * 0.23 + aUV.x * 0.013 + aF.y * 0.033);
    vec3 cd = p - uCamL; vec3 sd = cross(vec3(0., 1., 0.), cd);
    p += sd / max(length(sd), 1e-3) * aSide;
  }
  vWp = p; vN = nrm; vUV = uvN; vF = vec4(aF.x, mix(aF.y, -gN, nearM), aF.z, mode < 0.5 ? nearM : aF.w); vAx = L2.x;
  vS = aL.x + 0.7 * (aL.y + uLipA.x) * clamp((aL.x - uLipA.w) / 60., -1., 1.);
  float sgn = abs(aSide) > 0. ? sign(aSide) : 0.;
  vX = vec3(dot(uSunDir, T3), mode < 0.5 ? uSunDir.z : -uSunDir.y, sgn);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FOG_FS = /* glsl */`
varying vec2 vUV; varying vec4 vF; varying vec3 vWp; varying vec3 vN; varying vec3 vX; varying float vS; varying float vAx;
uniform vec3 uCamL; uniform float uVeil; uniform float uDive;
#include <fog_pars_fragment>
${COMMON}
float flowLn(float ax, float fz){
  // (broad soft folds five to fifteen metres across, ten times as long as wide, and a faint silk over them: drawn out sixty to one they read as a stretched texture)
  return 0.5 * texture2D(uNoise, vec2(ax * 0.043, fz * 0.0048)).r + 0.38 * texture2D(uNoise, vec2(ax * 0.019 + 0.31, fz * 0.0031 + 0.5)).g + 0.12 * texture2D(uNoise, vec2(ax * 0.052 + 0.17, fz * 0.0052 + 0.2)).b;
}
void main(){
  float mode = vF.x, h = vF.y;
  float flat0 = 1. - step(0.5, mode);
  // on the wall the noise is drawn out four times along the fall, so the cloud tears into streamers, not blotches
  vec2 q = mix(vec2(vUV.x, (vUV.y - uTime) * 14.), vec2(vWp.x, vWp.z - uTime * uCap.y), flat0);
  vec2 q2 = mix(vec2(vUV.x, (vUV.y - uTime * 1.25) * 14.), vec2(vWp.x, vWp.z - uTime * uCap.y * 1.18), flat0);
  vec2 s1 = mix(vec2(0.012, 0.0016), vec2(0.023, 0.008), flat0), s2 = mix(vec2(0.033, 0.0041), vec2(0.081, 0.03), flat0), s3 = mix(vec2(0.05, 0.0072), vec2(0.29, 0.09), flat0);
  vec2 lo = mix(vX.xy * 9., uSunDir.xz * 5., flat0);
  float n1 = texture2D(uNoise, q * s1).r;
  float n2 = texture2D(uNoise, q2 * s2 + vec2(n1 * 0.06, 0.)).g;
  float n3 = texture2D(uNoise, q * s3).b;
  float dens = n1 * 0.5 + n2 * 0.36 + n3 * 0.14;
  float m1 = texture2D(uNoise, (q + lo) * s1).r;
  float m2 = texture2D(uNoise, (q2 + lo * 0.35) * s2 + vec2(n1 * 0.06, 0.)).g;
  float shade = clamp(0.5 + ((n1 - m1) * 0.6 + (n2 - m2) * 0.4) * mix(1.5, 4.6, flat0) + (n3 - 0.5) * 0.34 * flat0, 0., 1.);
  float m = sunMaskF(vWp);
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 Vd = uCamL - vWp; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-3);
  // the long glassy lines the river draws out as it nears the edge; they carry on over the bend and down the
  // first metres of the wall (one coordinate for both: metres across the flow, metres along it)
  // (three widths of line; toward the lip they are gathered into channels, and each is lit as a low ridge: its
  // flank to the sun bright, its far flank and the trough beside it blue-violet)
  float fz = (vUV.y - uTime) * uCap.y;
  float gLip = flat0 * max(-h, 0.);
  float cvx = vAx + 11. * sin(vAx * 0.043 + 1.3) * (1. - smoothstep(0., 44., gLip)) + (n1 - 0.5) * 1.6;
  float ln = flowLn(cvx, fz), lnX = flowLn(cvx + 2.2, fz);
  float lines = smoothstep(0.3, 0.7, ln);
  float ridge = clamp(0.5 - (lnX - ln) * 5.5 * clamp(mix(vX.x, uSunDir.x, flat0) * 3., -1., 1.), 0., 1.);
  float lineL = mix(lines, ridge, 0.55) * (0.7 + 0.3 * lines);
  // (and broad lanes, metres wide, some thick and bright, some thin and blue: bundles of flow, not ruled lines)
  float lane = texture2D(uNoise, vec2(cvx * 0.043 + 0.2, fz * 0.0016 + 0.4)).a;
  float lipK = clamp(m * (0.42 + 0.62 * lineL), 0., 1.);
  lipK = mix(lipK, lipK * (0.1 + 1.15 * lineL * smoothstep(0.22, 0.7, lane)), uView.z);   // by moonlight: silver crests, deep blue troughs, never one pale sheet
  vec3 lipCol = mix(uFogShade * vec3(0.84, 0.9, 1.06), uFogLit * 1.03, lipK);
  lipCol *= 0.8 + 0.26 * smoothstep(0.32, 0.68, lane);
  vec3 col; float alpha;
  if (mode < 0.5) {
    // the river on the plateau, drawn as cloud: one height field (swells, cauliflower billows, puffs) racing to
    // the lip. Its slope is lit like a cloud top (sun-facing sides white-gold, lee sides and hollows blue-violet),
    // crowns throw round shadows on it, every trunk trails a hollow wake, and torn holes show the pavement.
    float lift = vWp.y - uFogP.x;
    float d2 = distance(vWp.xz, uCamL.xz);
    float glass = smoothstep(-24., -2., h);
    float calm = mix(mix(0.32, 0.7, uView.z), 1., smoothstep(10., 34., -h));    // the river keeps a third of its relief right to the edge (more by moonlight)
    float dK = deepK();
    float lodF = clamp(log2(max(dist, 6.) / 6.) + 1.6, 0., 6.);
    float ee = 0.5 + dist * 0.02;
    float h0 = relief(vWp.xz, lodF), hx = relief(vWp.xz + vec2(ee, 0.), lodF), hz = relief(vWp.xz + vec2(0., ee), lodF);
    vec2 su = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
    float hS = relief(vWp.xz + su * (2.2 + dist * 0.015), lodF + 0.5);
    vec3 wk = texture2D(uMask, (vWp.xz - uMaskXf.xy) * uMaskXf.zw, -0.7).rgb;
    float wakeK = 1. - smoothstep(70., 170., dist);
    vec3 Ns = normalize(vec3(-(hx - h0) / ee * calm * 0.8, 1., -(hz - h0) / ee * calm * 0.8));
    float ndl = dot(Ns, uSunDir);
    float lee = smoothstep(0.1, 1.1, hS - h0) * step(0., uSunDir.y);
    // under the cap cloud the river is pearl-grey with a violet cast, its relief soft; inside the sun break it snaps
    float sunny = sunK(m);
    // (no sun under the cap: there the relief is only a faint darkening of the hollows, or it reads as snow drifts)
    float relK = mix(0.5, 1., sunny) * (1. - 0.15 * uView.z) * (1. - 0.8 * smoothstep(140., 460., dist)) * calm;
    // close by, the river's skin is drawn out by the wind into soft crests a metre or two wide: bright tops, violet troughs
    float cr = texture2D(uNoise, vec2(q.x * 0.13 + n1 * 0.25, q.y * 0.024)).g * 0.65 + texture2D(uNoise, vec2(q2.x * 0.31, q2.y * 0.055) + 0.4).b * 0.35;
    float crestK = (1. - smoothstep(28., 85., dist)) * mix(0.8, 1., sunny);
    // (by moonlight, on the last fifty metres to the edge, the relief is drawn hard: silver crests, troughs in deep shade;
    //  there the skin is round billows a few metres across, not wind-drawn streaks: long hard streaks read as smear in the dark)
    float nL = uView.z * (1. - smoothstep(30., 60., -h));
    float rnd = texture2D(uNoise, vec2(q.x * 0.051 + n1 * 0.2, q.y * 0.034) + 0.15).g * 0.7 + texture2D(uNoise, vec2(q2.x * 0.14, q2.y * 0.09) + 0.4).r * 0.3;
    cr = mix(cr, rnd, nL);
    float lam = clamp(mix(0.7, 0.5, nL) + (((ndl - uSunDir.y) * mix(0.95, 1.8, nL) - mix(0.22, 0.75, nL) * lee) * sunny + h0 * mix(0.12, 0.3, nL) + (smoothstep(0.3, 0.7, cr) - 0.6) * 0.62 * crestK + 0.2 * wk.g * wakeK) * relK * mix(1., 1.6, nL), 0., 1.);
    // crown shadows: thrown well clear of each crown, a round pool of blue-violet a crown wide
    float lowSun = min(1. / max(uSunDir.y, 0.1), 2.4);
    vec2 so = uSunDir.xz * lowSun * max(17. - lift, 10.);
    float sh = texture2D(uMask, (vWp.xz + so - uMaskXf.xy) * uMaskXf.zw, 1.3).r;      // one tap: each shadow is one round disc
    sh = smoothstep(0.16, 0.8, sh) * step(0., uSunDir.y);
    // a low sun lays every trunk and crown out as one long shadow across the mist (painted once, in true projection)
    float lowK = (1. - smoothstep(0.36, 0.48, uSunDir.y)) * step(0., uSunDir.y);
    float shL = texture2D(uMask, (vWp.xz - uMaskXf.xy) * uMaskXf.zw, 0.2).a;
    sh = mix(sh, smoothstep(0.08, 0.5, shL), lowK);
    float key = smoothstep(0.1, 0.9, lam);
    float lightK = mix(0.06 * key, key, sunny) * (1. - 0.88 * sh * sunny);
    vec3 capC = mix(vec3(1.), vec3(0.8, 0.79, 0.93), step(0., uSunDir.y) * (1. - uView.z));   // by day the shade is pearl-grey with a violet cast
    vec3 shadeC = mix(uFogShade * capC, uFogLit, uView.w) * mix(0.56 + 0.48 * lam, 0.7 + 0.26 * lam, max(sunny, uView.z)) * (1. - 0.1 * sh * (1. - sunny));
    col = mix(shadeC, uFogLit * mix(vec3(1.), vec3(1.08, 1., 0.84), sunny * (1. - uView.z)), clamp(lightK, 0., 1.));
    col *= 1. - 0.2 * sh * lowK * (1. - 0.3 * uView.z);                             // (a long shadow is plainly darker, also where the veil is all one tone)
    col = mix(col, lipCol * (1. - 0.4 * sh) * mix(1., 0.45 + 0.75 * smoothstep(-0.55, 0.6, h0 + (cr - 0.5) * 1.3), uView.z), glass * mix(0.88, 0.7, uView.z));
    col *= mix(1., 0.5 + 0.72 * lam, nL * (1. - smoothstep(70., 150., dist)));
    col += uRim * 0.42 * nL * smoothstep(0.52, 0.8, cr) * key * (1. - sh);
    col *= 1. - 0.5 * wk.b * mix(0.72, 1., glass) * wakeK;                                  // the wake every trunk trails downwind: a darker lane
    // night: the moon lays a path of light down the river toward the eye, brightest on the crests, and the blood of
    // every tree lights the mist round its foot like an ember
    vec2 mxz = uSunDir.xz / max(length(uSunDir.xz), 1e-3), vxz = -V.xz / max(length(V.xz), 1e-3);
    float pathK = max(dot(mxz, vxz), 0.); pathK *= pathK; pathK *= pathK; pathK *= pathK; pathK *= pathK;
    col += uHalo * pathK * (0.3 + 0.7 * smoothstep(0.35, 0.7, cr)) * (0.4 + 0.6 * key) * (1. - 0.7 * sh);
    float em = texture2D(uMask, (vWp.xz - uMaskXf.xy) * uMaskXf.zw, 4.).r;
    col += uEmber * 0.2 * smoothstep(0.04, 0.5, em) * (1. - 0.5 * glass) * (1. - 0.75 * smoothstep(50., 190., dist));
    // how much cloud lies under this point of the surface: next to none in the drifting holes and in the wake of
    // each trunk; the eye ray's length through it sets the opacity
    float thin = fogThin(vWp.xz) * (1. - smoothstep(110., 240., dist));
    float thick = max(lift, 0.) * (1. - 0.99 * thin);
    // mist, not a surface: looked down into from just above, the river is half see-through (the pavement, the shrubs
    // and the trunks' feet ghost through it); it thickens to white with distance and as the eye climbs
    float od = thick / max(V.y, 0.1) * mix(0.08 + 0.014 * clamp(uCamL.y - vWp.y, 0., 22.), 1.2, glass * (1. - 0.45 * wk.b)) * mix(1.7, 1., dK);
    float body = 1. - exp(-od);
    body = max(body, 0.52 * (1. - dK) * (1. - thin));        // a knee-deep veil is never clear to the ground
    body *= 1. - 0.7 * (1. - dK) * (1. - smoothstep(12., 44., dist));   // within 25 m of the eye the pavement ghosts through it
    // the deep river too: within fifty metres it is drawn out into racing streaks with half-clear lanes between them: mist, not snow
    float stk = texture2D(uNoise, vec2(q.x * 0.17 + n1 * 0.2, q.y * 0.019) + 0.3).r * 0.6 + texture2D(uNoise, vec2(q2.x * 0.43, q2.y * 0.04) + 0.7).a * 0.4;
    stk = mix(stk, rnd, nL);
    body *= 1. - dK * (1. - smoothstep(14., 60., dist)) * (1. - glass) * (0.3 + 0.52 * (1. - smoothstep(0.34, 0.66, stk)));
    // by day the nearest thirty metres are plainly mist, not a surface: between the streaks whole lanes a few metres
    // wide are clear to the pavement, and the river closes to white only beyond that
    float dayN = dK * (1. - uView.z) * (1. - smoothstep(16., 48., dist)) * (1. - glass);
    float laneN = texture2D(uNoise, vec2(q.x * 0.06 + n1 * 0.15 + 0.5, q.y * 0.011)).g;
    body *= 1. - dayN * (0.22 + 0.62 * smoothstep(0.4, 0.6, laneN));
    // and by day the wake behind each near trunk is a lane open to the ground, two crowns long
    body *= 1. - 0.85 * smoothstep(0.06, 0.5, wk.b) * dK * (1. - uView.z) * (1. - glass) * (1. - smoothstep(45., 120., dist));
    // cloud has no outline: where it thins (the rim of a hole, the lip of a wake) it breaks into puffs, and each
    // crest's far side melts away, so billows overlap as soft layers and never as drifts with an edge
    float fr = texture2D(uNoise, q * 0.21).b * 0.6 + texture2D(uNoise, q2 * 0.53 + 0.3).g * 0.4;
    body *= smoothstep(0., 0.4, body - (fr - 0.3) * 0.55 * mix(0.3, 1., dK) * (1. - glass));
    body *= 1. - smoothstep(0.12, 0.9, thin + (fr - 0.5) * 0.6 * step(0.02, thin)) * (1. - glass);
    float turn = dot(normalize(vN + vec3(0., 1e-4, 0.)), V) / max(V.y, 0.03);
    body *= mix(1., smoothstep(-0.1 + 0.3 * fr, 0.4 + 0.3 * fr, turn), step(0.5, vF.w) * (1. - glass));
    body *= 1. - 0.9 * wk.r * smoothstep(4.2, 5.6, lift);                    // a drowned crown shows through the sheet as a dark island
    alpha = vF.z * smoothstep(0.25, 1.6, lift) * clamp(body, 0., 0.96) * smoothstep(-0.4, 2.2, uCamL.y - vWp.y) * uView.y * smoothstep(1.2, 5.5, dist);
    // the near fan hands over to the flat sheet beyond a hundred metres and along the lip's glassy run (they overlap, never cross-fade)
    alpha *= mix(max(smoothstep(72., 96., d2), 1. - smoothstep(17., 26., -h)), (1. - smoothstep(98., 120., d2)) * smoothstep(8., 17., -h), step(0.5, vF.w));
  } else {
    // the fall: one curtain modelled by long vertical folds, lit on the flanks that face the sun, blue inside
    float th = vF.w;
    float glass = 1. - smoothstep(5., 26., h);
    float w1 = (n1 - 0.5) * 2.2 + (n2 - 0.5) * 1.3;
    float lw = texture2D(uNoise, vec2(vS * 0.0031, 0.37)).a, lw2 = texture2D(uNoise, vec2(vS * 0.0113, 0.71 + h * 0.0009)).r;
    float amp = 0.6 + 1.1 * lw2;
    // the folds billow as they fall: round swells that ride down with the cloud push their edges about, so no fold is a ruled stripe
    float bz = texture2D(uNoise, q * vec2(0.021, 0.011) + 0.27).a, bz2 = texture2D(uNoise, q2 * vec2(0.057, 0.024) + 0.6).r;
    float bw = ((bz - 0.5) * 1.5 + (bz2 - 0.5) * 0.8) * (1. - 0.4 * glass) * mix(1., 0.4, smoothstep(50., 130., h));
    float a1 = vS * 0.122 + 9. * lw + w1 + h * 0.0035 + bw, a2 = vS * 0.27 + 2.1 + 14. * lw - w1 * 0.7 + h * 0.0061 - bw * 1.3, a3 = vS * 0.037 + 0.7;
    float F = (0.6 * sin(a1 + 0.5 * sin(a1)) + 0.25 * sin(a2)) * amp + 0.3 * sin(a3);
    float slope = clamp((0.73 * cos(a1 + 0.5 * sin(a1)) * (1. + 0.5 * cos(a1)) + 0.75 * cos(a2)) * amp * 0.8, -1., 1.);
    // a second, rounder field: slow billows some thirty metres across that ride down with the cloud. Looked down on
    // from close by, or seen along the wall at a grazing angle (the stoop), the fall is drawn from this field: a cascade of soft puffs with lit
    // edges and shadowed hollows, never long streaks fanning out from under the eye
    // (and all through the stoop, uDive: falling beside it, the whole fall is billows)
    float lookDn = max(max(smoothstep(0.3, 0.62, V.y), 1. - smoothstep(0.2, 0.5, abs(dot(N, V)))) * (1. - smoothstep(80., 125., length(Vd.xz))), uDive);
    vec2 qb = vec2(vUV.x + 31. * step(mode, 1.5), (vUV.y - uTime * 0.85) * 14.), lob = vX.xy * 8.;
    float b1 = texture2D(uNoise, qb * vec2(0.016, 0.0075) + 0.13).a;
    float b2 = texture2D(uNoise, qb * vec2(0.047, 0.021) + vec2(b1 * 0.08, 0.3)).r;
    float b3 = texture2D(uNoise, qb * vec2(0.13, 0.055) + 0.5).g;
    float c1 = texture2D(uNoise, (qb + lob) * vec2(0.016, 0.0075) + 0.13).a;
    float c2 = texture2D(uNoise, (qb + lob * 0.4) * vec2(0.047, 0.021) + vec2(b1 * 0.08, 0.3)).r;
    float densB = b1 * 0.44 + b2 * 0.38 + b3 * 0.18;
    float shadeB = clamp(0.5 + ((b1 - c1) * 0.6 + (b2 - c2) * 0.5) * 3.4, 0., 1.);
    float a = smoothstep(th, th + mix(0.42, mix(0.3, 0.2, uDive), lookDn), mix(mix(dens + 0.07 * F, densB + 0.1, lookDn), 0.62, glass * 0.8) + 0.08) * (mode > 2.5 ? mix(0.86, 0.66, lookDn) : mode > 1.5 ? 0.94 : 1.);   // (the billows' soft range is wide: they join into one falling curtain, not separate puffs)
    // strands: the falling cloud is drawn out into ropes a few metres across and threads a metre across, bright where
    // they are thick, with thin veil between them through which the layer behind shows darker: depth, not one drape
    // (the ropes wander with the billows and thicken and thin down their length; in places the fall is all ropes, in
    //  others one smooth veil)
    float stX = vS + bw * 2.6 + 1.8 * sin(h * 0.031 + vS * 0.05);
    float stN = texture2D(uNoise, vec2(stX * 0.071 + (n1 - 0.5) * 0.06, q.y * 0.0013 + 0.3)).r * 0.58 + texture2D(uNoise, vec2(stX * 0.23 + 0.4, q2.y * 0.0031 + lw)).g * 0.42;
    float stZone = smoothstep(0.3, 0.62, texture2D(uNoise, vec2(vS * 0.0047 + 0.6, q.y * 0.00035)).a + 0.25 * uView.z);
    float stK = (1. - glass) * (1. - lookDn) * smoothstep(18., 60., h) * mix(0.55, 1., uView.z) * (0.35 + 0.65 * stZone);
    float strand = smoothstep(0.5, 0.68, stN), stGap = 1. - smoothstep(0.28, 0.48, stN);
    a *= 1. - 0.46 * stGap * stK;
    // the lowest third of the fall tears into separate streamers: long ribbons a few metres wide with clear wall between them
    float deepF = smoothstep(150., 212., h) * (1. - step(2.5, mode)) * (1. - lookDn);
    float rbn = texture2D(uNoise, vec2(vS * 0.047 + (n1 - 0.5) * 0.07, q.y * 0.0009 + 0.3)).r * 0.62 + texture2D(uNoise, vec2(vS * 0.131 + 0.4, q2.y * 0.0017)).g * 0.38;
    float thR = mix(0.42, 0.6, smoothstep(150., 236., h));
    a = mix(a, smoothstep(thR, thR + 0.09, rbn) * (0.5 + 0.5 * smoothstep(0.3, 0.6, dens)) * 0.9, deepF);
    // between 80 and 170 m down the curtains part round the big billows: windows of bare wall, each with a soft lit rim
    float isCurt = step(1.5, mode) * (1. - step(2.5, mode)), bb = b1 + (b2 - 0.5) * 0.34;
    float winH = smoothstep(66., 96., h) * (1. - smoothstep(150., 186., h)) * isCurt;
    float win = smoothstep(0.5, 0.62, bb) * winH, winRim = smoothstep(0.4, 0.5, bb) * (1. - smoothstep(0.5, 0.6, bb)) * winH;
    a *= 1. - 0.92 * win * (1. - 0.75 * uDive);        // (in the stoop the windows are only thinner cloud: seen from beside the fall they were dark blots)
    // seen along its surface from the side the sheet's outline frays; seen from above, down the wall, it stays whole
    float nv = abs(dot(N, V));
    float fray = smoothstep(0., mix(0.34, 0.24, glass), nv + (n2 - 0.5) * mix(0.34, 0.22, glass));
    float ang = mode > 2.5 ? 1. : mix(fray, 1., smoothstep(0.2, 0.55, V.y));
    alpha = a * vF.z * (1. - vX.z * vX.z) * ang * mix(uVeil, min(uVeil * 1.5, 1.), (1. - smoothstep(0.36, 0.48, uSunDir.y)) * (1. - uView.z) * uDive);   // (a thin evening fall seen from beside it in the stoop is still cloud, not a tan haze on the wall)
    alpha *= clamp(uCap.z * 3. - (1. - h / 250.) * 2., 0., 1.);
    alpha *= smoothstep(mix(4., 24., uDive), mix(14., 66., uDive), dist);    // (in the stoop the cloud keeps its distance: seen from a few metres it was a smear across half the frame)
    alpha *= mix(exp(-uFogP.w * max(dist - 40., 0.)), 1., uView.y);          // from inside the fog on the plateau the fall is lost in the pearl
    float facing = 0.6 + 0.4 * clamp(dot(N, uSunDir) * 1.4 + 0.3, 0., 1.);
    float body = smoothstep(th - 0.1, th + 0.6, dens);
    float flank = clamp(0.5 - 0.8 * slope * clamp(vX.x * 2.4, -1., 1.), 0., 1.);
    float model = mix(flank, 0.5 + 0.5 * clamp(F, -1., 1.), 0.3);
    float light = m * facing * (0.12 + 0.95 * mix(model, 0.85, glass * 0.8)) * (0.66 + 0.34 * shade) * (0.72 + 0.3 * body) * (0.94 + 0.22 * (bz2 - 0.5) * (1. - glass));
    light = mix(light, min(light + 0.34, 1.02), winRim * shadeB);
    light = min(light * (1. + (0.5 * strand - 0.22 * stGap) * stK), 1.05);
    light *= mix(1., mode < 1.5 ? 0.74 : mode > 2.5 ? 1.12 : 1., stK);         // the sheet on the wall is the far layer, the streamers the nearest
    light = mix(light, m * facing * (mix(0.4, 0.3, uDive) + mix(0.66, 0.8, uDive) * shadeB) * (0.7 + 0.34 * smoothstep(th - 0.1, th + 0.5, densB)), lookDn);
    // the shade inside the cloud takes the hour: blue-violet under a high sun; under a low one mauve-rose, and lifted
    // toward the lit colour, so no hollow is a grey darker than the wall behind it (that read as smoke)
    float warmK = (1. - smoothstep(0.36, 0.48, uSunDir.y)) * (1. - uView.z);
    vec3 shT = mix(mix(vec3(0.7, 0.8, 1.1), vec3(1.), glass), vec3(1.3, 0.98, 1.02), warmK * (1. - glass));
    // (and under a low sun the fall is cloud in evening light: its lit side pale rose-white, plainly brighter than the
    //  lit wall behind it, its hollows mauve: lit the colour of the wall it read as blown dust)
    float wK = warmK * (1. - glass);
    light = mix(light, 0.26 + 0.8 * light, wK);
    vec3 litC = mix(uFogLit, vec3(1.13, 0.995, 0.99), 0.8 * wK);
    col = mix(mix(uFogShade * shT, litC, 0.24 * warmK), litC, clamp(light, 0., 1.05));
    col = mix(col, uFogShade, (1. - a) * 0.15);
    col = mix(col, lipCol, glass * (1. - step(1.5, mode)));                    // the bend: the same white curve as the river's last metres
    col += uFogLit * 0.14 * glass * pow(1. - nv, 3.) * m;
    float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd; fwd *= fwd;
    col += uHalo * 0.5 * fwd * fwd;                                           // night: the cloud between the eye and the moon glows
    // night: every rope and every torn edge of a veil is edged silver by the moon
    col += uRim * (0.85 * strand * stK * (0.4 + 0.6 * shade) + 1.1 * a * (1. - a) * (1. - glass) * (0.5 + 0.5 * m));
  }
  gl_FragColor = vec4(max(col, vec3(0.)), clamp(alpha, 0., 1.));
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------
// drips from leaf tips and thread-thin seep falls from the ledges: one draw, never under 1.5 px wide
const DRIP_VS = /* glsl */`
attribute vec4 aD; attribute vec2 aK;
uniform float uViewH; uniform vec3 uCamL;
varying vec3 vD; varying float vE;
#include <fog_pars_vertex>
${COMMON}
void main(){
  vec3 p = position; float f = fract(uTime * uCap.w / aD.w + aD.z); float len, w0, al;
  vE = -1.;
  if (aK.y < 0.5) { p.y -= f * f * aK.x; p.z += f * f * 0.9; len = 0.12 + 0.55 * f; w0 = 0.014; al = smoothstep(0., 0.06, f) * (1. - smoothstep(0.85, 1., f)); }
  else {
    // a seep thread: a broken string of falling drops, never longer than a sixth of the frame's height, tapering to
    // nothing at both ends, and gone when it is seen nearly end-on (down the wall in the stoop it drew a ruled line)
    vec3 toC = uCamL - position; float dC = length(toC);
    len = min(aK.x, 0.17 * dC + 1.5); w0 = 0.08; vE = aD.y;
    al = 0.7 * (1. - smoothstep(0.5, 0.8, abs(toC.y) / max(dC, 1e-3)));
  }
  float m = sunMask(p);
  p.y -= aD.y * len;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.);
  vec4 clip = projectionMatrix * mvPosition;
  float px = max(clip.w, 0.) * 3. / max(uViewH * projectionMatrix[1][1], 1.);
  float w = max(w0, px);
  mvPosition.x += aD.x * w * 0.5;
  gl_Position = projectionMatrix * mvPosition;
  al *= mix(exp(-uFogP.w * max(clip.w - 30., 0.)), 1., smoothstep(0.6, 1., uView.y));          // lost in the pearl while we fly inside the fog
  if (aK.y < 0.5) al *= 1. - smoothstep(70., 170., clip.w);               // a leaf drip is a near thing: far off, a row of them drew a dotted line
  vD = vec3(aD.y * len * step(0.5, aK.y) + aD.z * 31., al * clamp(w0 / w, mix(0.3, 0.07, step(0.5, aK.y)), 1.), m);
  #include <fog_vertex>
}`;
const DRIP_FS = /* glsl */`
varying vec3 vD; varying float vE;
#include <fog_pars_fragment>
${COMMON}
void main(){
  // (a leaf drip, vE = -1, keeps its faint pulse; a seep thread, vE running 0..1 down it, is beads with clear gaps between them)
  float seep = step(-0.5, vE);
  float ph = fract(vD.x * 0.42 - uTime * 2.3);
  float bead = smoothstep(0., 0.14, ph) * (1. - smoothstep(0.3, 0.46, ph));
  float dash = mix(0.55 + 0.45 * smoothstep(0.3, 0.6, fract(vD.x * 0.16 - uTime * 1.4)), bead * sin(3.14159 * clamp(vE, 0., 1.)), seep);
  vec3 col = uSkyCol * 1.5 + uSunCol * vD.z * 0.75;
  gl_FragColor = vec4(max(col, vec3(0.)), clamp(vD.y * dash, 0., 1.));
  #include <fog_fragment>
}`;
function buildDrips(rng, origins, seeps) {
  const n = origins.length + seeps.length, pos = new Float32Array(n * 12), aD = new Float32Array(n * 16), aK = new Float32Array(n * 8), idx = [];
  let q = 0;
  const quad = (o, fall, kind) => {
    const ph = rng(), per = kind ? 1 : rng.range(1.1, 2.6);
    for (let c = 0; c < 4; c++) {
      pos.set([o.x, o.y, o.z], q * 12 + c * 3);
      aD.set([c % 2 ? 1 : -1, c < 2 ? 0 : 1, ph, per], q * 16 + c * 4); aK.set([fall, kind], q * 8 + c * 2);
    }
    idx.push(q * 4, q * 4 + 2, q * 4 + 1, q * 4 + 1, q * 4 + 2, q * 4 + 3); q++;
  };
  for (const o of origins) quad(o, o.fall, 0);
  for (const o of seeps) quad(o, o.fall, 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aD', new THREE.BufferAttribute(aD, 4));
  geo.setAttribute('aK', new THREE.BufferAttribute(aK, 2));
  geo.setIndex(idx);
  return geo;
}

// ---------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('fogfall') : ctx.rng, noise = ctx.noise;
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const P = presets(opts, pal), detail = ctx.quality?.detail ?? 1, density = clamp(opts.density ?? 1, 0.6, 1.4);
  const col = (h) => new THREE.Color(h);
  const L = makeLip(rng);
  const object = new THREE.Group(); object.name = 'fogfall';
  const noiseTex = await makeNoiseTex(rng, 256, () => ctx.yield());
  await ctx.yield();

  // the fly line: WSW through the grove at 7 m, left turn, over the lip at 9 m, out over the bay
  const x0 = L.cx + rng.range(15, 45), wv = rng.range(-3, 3);
  const fp = [[172, 96, 7], [128, 80 + wv, 7], [86, 63 - wv, 7], [50, 45 + wv * 0.5, 7], [23, 25, 7.5], [7, 9, 8.5], [0, 0, 9], [-3, -32, 4], [-12, -72, -8]];
  // the world may route the plateau itself: opts.route({ L, rim }) -> { points: [V3], resinAt: V3 (a point of the
  // route the scarred trunk stands beside), axisTrees: [{ x, z, s }], pinnacle: { x, z }, avenue: n }
  const route = typeof opts.route === 'function' ? opts.route({ L, rim: RIM }) : null;
  const fly = new THREE.CatmullRomCurve3(route ? route.points.map((p) => p.clone()) : fp.map(([dx, g, y]) => new V3(x0 + dx, RIM + y, L.z(x0 + dx) - g)), false, 'centripetal');
  const lipCross = new V3(x0, RIM + 9, L.z(x0));
  await ctx.yield();
  const { trees, resin, zBack } = await placeTrees(rng, L, fly, density, route, () => ctx.yield());
  await ctx.yield();

  const X0 = -440, Z0 = zBack - 6, MW = 880, MH = 26 - Z0;
  const sunLow = P.sunDir.y > 0.03 && P.sunDir.y < 0.48, sunH = Math.hypot(P.sunDir.x, P.sunDir.z) || 1;
  const maskTex = await paintMask(trees, X0, Z0, MW, MH, () => ctx.yield(), sunLow ? {
    dx: -P.sunDir.x / sunH, dz: -P.sunDir.z / sunH, tan: P.sunDir.y / sunH,
    depthAt: (x, z) => { const g = L.z(x) - z; return lerp(P.fogLip, P.fogBack, smoothstep(105, 235, g)) * lerp(0.55, 1, smoothstep(0, 24, g)) * 0.92; },
  } : null);
  await ctx.yield();
  const sunBreak = { set: false, x: x0 + 70, z: L.z(x0) - 95 };
  const U = {
    uSunDir: { value: P.sunDir.clone() }, uSunCol: { value: P.sunCol }, uSkyCol: { value: P.sky }, uBounce: { value: P.bounce },
    uFogLit: { value: P.fogLit }, uFogShade: { value: P.fogShade },
    uBreak: { value: new THREE.Vector4(sunBreak.x, sunBreak.z, 1 / 150, 1 / 90) },
    uFogP: { value: new THREE.Vector4(RIM, P.fogLip, P.fogBack, P.weather === 'thin' ? 0.22 : 0.3) },
    uLipA: { value: new THREE.Vector4(L.depth, L.w0, L.w1, L.cx) }, uLipB: { value: new THREE.Vector4(L.sl, L.sr, L.p1, L.p2) },
    uCap: { value: new THREE.Vector4(P.cap, P.wind, 1, P.dripRate) },
    uDive: { value: 0 }, uHole: { value: new THREE.Vector4(0, 0, 1 / 196, 0) }, uView: { value: new THREE.Vector4(0, 1, 0, 0) },
    uTime: { value: 0 }, uNoise: { value: noiseTex }, uCamL: { value: new V3(0, RIM + 50, 400) },
    uMask: { value: maskTex }, uMaskXf: { value: new THREE.Vector4(X0, Z0, 1 / MW, 1 / MH) }, uFwd: { value: new THREE.Vector2(0, -1) },
    uEmber: { value: P.night ? new THREE.Color(1.0, 0.04, 0.03) : new THREE.Color(0, 0, 0) },
    uRim: { value: P.night ? new THREE.Color(0.33, 0.38, 0.52) : new THREE.Color(0, 0, 0) },
    uHalo: { value: P.night ? new THREE.Color(0.42, 0.37, 0.3) : new THREE.Color(0, 0, 0) },
    uGlowP: { value: new THREE.Vector4(0, -5000, 0, 1) },
  };
  const mat = (vs, fs, extra, o = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, ...o,
  });
  await ctx.yield();

  // rock
  const rock = await buildRock(rng, noise, L, zBack, P, route && route.pinnacle, () => ctx.yield());
  const pinLean = 5 * Math.sin(rock.pin.top * 0.011 + rock.pin.ph), blobs = []; for (let i = 0; i < 12; i++) blobs.push(new THREE.Vector4(0, 0, 0, 0));
  const rockMesh = new THREE.Mesh(rock.geo, mat(ROCK_VS, ROCK_FS, { uRock: { value: col(pal[1]) }, uGreen: { value: col(pal[2]) }, uFloor: { value: col('#ddd3bd') }, uFlush: { value: P.season === 'november' ? 1 : 0 },
    uPin: { value: new THREE.Vector4(rock.pin.x + pinLean, rock.pin.z + pinLean * 0.5, rock.pin.top, 22) }, uBlob: { value: blobs }, uWL: { value: -1000 } }, { vertexColors: true }));
  object.add(rockMesh);
  await ctx.yield();

  // trees: three variants at three levels of detail
  const green = col(pal[2]);
  const C = {
    bark: col('#a89f92').multiplyScalar(0.74), leafDark: green.clone().multiplyScalar(0.68), leafLight: green.clone().lerp(col('#7fae95'), 0.3).multiplyScalar(0.9),
    lichen: col('#8d9a8c'), spray: P.season === 'november' ? col('#e0782a') : P.season === 'summer' ? green.clone().lerp(col('#93b392'), 0.4) : col('#e4dcba').lerp(green, 0.4).multiplyScalar(0.8),
  };
  C.leafMid = C.leafDark.clone().lerp(C.leafLight, 0.34);
  C.leafShell = C.leafDark.clone().lerp(C.leafLight, 0.12).multiply(new THREE.Color(0.8, 0.96, 1.08));
  const treeMat = mat(TREE_VS, TREE_FS, { uResin: { value: col(pal[5]) } }, { vertexColors: true, side: THREE.DoubleSide });
  const variants = [[], [], []]; let treeTris = 0;
  for (let lod = 0; lod < 3; lod++) for (let v = 0; v < 3; v++) { variants[lod].push(buildTree(rng, lod, C, lod === 0 && v === 0)); await ctx.yield(); }
  { const tr = makeRng(hashSeed('fine:' + ctx.seed));     // its own stream: the grove and the fall keep the layout they had
    for (const tall of [true, false]) { const fin2 = buildTree(tr, 0, C, tall, true, true); await ctx.yield(); variants[0].push(fin2()); await ctx.yield(); }
    if (resin) resin.tree.variant = 3;
    for (const t of trees) if ((t.keep || 0) > 0.8) t.variant = 4; }
  { // nearest grid trees: full detail while the budget lasts, then 52 at mid detail
    const grid = trees.filter((t) => t.lod === 2).sort((a, b) => a.fd - b.fd);
    let hiTris = trees.reduce((a, t) => a + (t.lod === 0 ? variants[0][t.variant].tris : 0), 0), i = 0;
    for (; i < grid.length && grid[i].fd < 26; i++) { const c = variants[0][grid[i].variant].tris; if (hiTris + c > (opts.hiTris || 56000)) break; hiTris += c; grid[i].lod = 0; }
    const rest = grid.slice(i).sort((a, b) => a.fdAll - b.fdAll);   // mid detail goes to whatever the eye passes nearest, the climb over the fog included
    for (let k = 0; k < (opts.midCount || 52) && k < rest.length; k++) rest[k].lod = 1;
  }
  const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), yAxis = new V3(0, 1, 0), sv = new V3(), pv = new V3();
  const dripO = [];
  for (let lod = 0; lod < 3; lod++) for (let v = 0; v < variants[lod].length; v++) {
    const list = trees.filter((t) => t.lod === lod && t.variant === v); if (!list.length) continue;
    const T = variants[lod][v], mesh = new THREE.InstancedMesh(T.geo, treeMat, list.length), inst = new Float32Array(list.length * 4);
    list.forEach((t, i) => {
      qt.setFromAxisAngle(yAxis, t.rot); m4.compose(pv.set(t.x, RIM - (t.giant ? 0.5 : 0.15), t.z), qt, sv.set(t.s, t.s, t.s)); mesh.setMatrixAt(i, m4);
      inst.set([t.phase, t.scar, t.tint, t.keep || 0], i * 4); t.r = T.R * t.s; t.h = T.top * t.s; t.trunkR = T.trunkR * t.s;
      const nd = lod === 0 ? Math.round(40 * detail) : lod === 1 ? 2 : 0;
      for (let k = 0; k < nd; k++) {
        if (lod === 0) { pv.copy(T.tips[rng.int(0, T.tips.length - 1)]); pv.x += rng.range(-0.5, 0.5); pv.z += rng.range(-0.5, 0.5); pv.y -= 0.15; pv.applyMatrix4(m4); }
        else { const an = rng() * TAU; pv.set(t.x + Math.cos(an) * t.r * 0.9, RIM + (T.top - 1.4) * t.s, t.z + Math.sin(an) * t.r * 0.9); }
        dripO.push({ x: pv.x, y: pv.y, z: pv.z, fall: Math.max(pv.y - RIM - P.fogLip * 0.7, 1) });
      }
    });
    mesh.geometry.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4));
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    object.add(mesh); treeTris += T.tris * list.length;
    await ctx.yield();
  }

  // fog
  const fog = await buildFog(rng, noise, rock.front, zBack, P, () => ctx.yield());
  await ctx.yield();
  const fogMat = mat(FOG_VS, FOG_FS, { uVeil: { value: P.veil } },
    { transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });
  [fog.sheet, fog.curtains, fog.streamers].forEach((g, i) => { const m = new THREE.Mesh(g, fogMat); m.renderOrder = 2 + i; object.add(m); });
  { // the near river: a fan of rings round the eye (placed in the vertex shader), far ring first so that near crests draw over far ones
    const NS = 104, NRG = Math.round(92 * (0.7 + 0.3 * detail)), HALF = 78 * Math.PI / 180, R0 = 1.0, R1 = 124;
    await ctx.yield();
    const p = new Float32Array((NS + 1) * (NRG + 1) * 3), f = new Float32Array((NS + 1) * (NRG + 1) * 4), idx = new Uint32Array(NS * NRG * 6);
    for (let r = 0; r <= NRG; r++) {
      const rad = R1 * Math.pow(R0 / R1, r / NRG);
      for (let i = 0; i <= NS; i++) {
        const an = (i / NS * 2 - 1) * HALF, k = r * (NS + 1) + i;
        p[k * 3] = Math.sin(an) * rad; p[k * 3 + 2] = Math.cos(an) * rad;
        f[k * 4 + 2] = r === 0 || i === 0 || i === NS ? 0 : 1; f[k * 4 + 3] = 1;
      }
    }
    for (let r = 0, o = 0; r < NRG; r++) for (let i = 0; i < NS; i++, o += 6) { const a = r * (NS + 1) + i, b = a + 1, c = a + NS + 1, d = c + 1; idx[o] = a; idx[o + 1] = c; idx[o + 2] = b; idx[o + 3] = b; idx[o + 4] = c; idx[o + 5] = d; }
    const n = (NS + 1) * (NRG + 1), geo = new THREE.BufferGeometry(), nr = new Float32Array(n * 3), at = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { nr[i * 3 + 1] = 1; at[i * 2] = 1; }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
    geo.setAttribute('aUV', new THREE.BufferAttribute(new Float32Array(n * 2), 2)); geo.setAttribute('aF', new THREE.BufferAttribute(f, 4));
    geo.setAttribute('aT', new THREE.BufferAttribute(at, 2)); geo.setAttribute('aL', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    geo.setAttribute('aSide', new THREE.BufferAttribute(new Float32Array(n), 1)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const fan = new THREE.Mesh(geo, fogMat); fan.frustumCulled = false; fan.renderOrder = 2.4; object.add(fan); fog.tris += idx.length / 3;
  }
  await ctx.yield();

  // drips and seep threads
  const seeps = [], nSeep = Math.round((P.weather === 'drizzle' ? 90 : 34) * detail);
  for (let i = 0; i < nSeep; i++) {
    const c = rock.front[rng.int(6, 130)], hh = rng.range(20, 215), co = clingOut(Math.min(hh, 90)) + 0.05 * Math.max(hh - 90, 0) + rng.range(2, 9);
    seeps.push({ x: c.x + c.nx * co, y: RIM - hh, z: c.z + c.nz * co, fall: rng.range(14, 46) });
  }
  const dripMesh = new THREE.Mesh(buildDrips(rng, dripO, seeps), mat(DRIP_VS, DRIP_FS, { uViewH: { value: 1080 } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true }));
  dripMesh.frustumCulled = false; dripMesh.renderOrder = 6; object.add(dripMesh);
  await ctx.yield();

  // anchors
  const zl = L.z(L.cx), rt = resin ? resin.tree : null;
  const anchors = {
    rimY: RIM, sunDir: P.sunDir.clone(), lipCross,
    flyThrough: fly.getSpacedPoints(16),
    resinTrunk: rt ? { position: new V3(rt.x + resin.normal.x * rt.trunkR, RIM + 4.5 * rt.s - 0.15, rt.z + resin.normal.z * rt.trunkR), normal: resin.normal.clone(), viewFrom: resin.from.clone() } : null,
    fallView: { position: new V3(L.cx - 15, RIM - 30, zl + 140), lookAt: new V3(L.cx, RIM - 105, zl + 10) },
    aboveFog: new V3(x0 + 150, RIM + 22, L.z(x0 + 150) - 88),
    stoop: [new V3(L.cx + 60, RIM - 30, zl + 62), new V3(L.cx - 20, RIM - 105, zl + 66), new V3(L.cx - 95, RIM - 185, zl + 74), new V3(L.cx - 150, RIM - 240, zl + 92)],
    pinnacle: { top: new V3(rock.pin.x, rock.pin.top + 1.6, rock.pin.z), ledge: new V3(rock.pin.x + 6, rock.pin.top + 0.6, rock.pin.z + 5), radius: rock.pin.r },
    portalSeat: { position: new V3(L.cx - 40, 8, 330), facing: new V3(0, 0, -1) },
    trees: trees.map((t) => ({ x: t.x, z: t.z, r: t.r, h: t.h, lod: t.lod, giant: !!t.giant })),
    lipZ: (x) => L.z(x),
  };

  const center = new V3(0, 165, -80), radius = 340, height = 312;

  const camW = new V3(), size = new THREE.Vector2(), inv = new THREE.Matrix4();
  return {
    object, radius, height, center, anchors, ground: true, groundY: 0,
    uniforms: U, glsl: COMMON, materials: { rock: rockMesh.material, tree: treeMat, fog: fogMat }, lip: L, zBack, pinnacle: rock.pin, stats: { triangles: Math.round(treeTris + rock.tris + fog.tris + (dripO.length + seeps.length) * 2), trees: trees.length },
    setSunBreak(x, z, rx = 150, rz = 90) { sunBreak.set = true; U.uBreak.value.set(x, z, 1 / Math.max(rx, 1), 1 / Math.max(rz, 1)); },
    setSupply(s) { U.uCap.value.z = clamp(s, 0, 1); },
    // more trees of this grove's own build anywhere in the world (the canyon floor, a ledge): list of
    // { x, y, z, s, lod: 0 | 1, variant: 0..2, rot, phase, tint }. Call it in build(); returns the meshes it added
    // (they stand outside the fog mask and drip nothing) and fills in each tree's r and h
    addTrees(list) {
      const out = [];
      for (let lod = 0; lod < 2; lod++) for (let v = 0; v < 3; v++) {
        const sub = list.filter((t) => (t.lod || 0) === lod && (t.variant || 0) % 3 === v); if (!sub.length) continue;
        const T = variants[lod][v], geo = T.geo.clone(), mesh = new THREE.InstancedMesh(geo, treeMat, sub.length), inst = new Float32Array(sub.length * 4);
        sub.forEach((t, i) => {
          qt.setFromAxisAngle(yAxis, t.rot || 0); m4.compose(pv.set(t.x, t.y, t.z), qt, sv.set(t.s, t.s, t.s)); mesh.setMatrixAt(i, m4);
          inst.set([t.phase || 0, -2, t.tint ?? 0.4, 0], i * 4); t.r = T.R * t.s; t.h = T.top * t.s;   // (-2: no scar, and marked as one of the canyon's trees)
        });
        geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4));
        mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); object.add(mesh); out.push(mesh);
      }
      return out;
    },
    setSun(dirWorld, colour) {
      object.updateWorldMatrix(true, false); inv.copy(object.matrixWorld).invert();
      U.uSunDir.value.copy(dirWorld).transformDirection(inv);
      if (colour) U.uSunCol.value.copy(colour);
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) {
        camW.setFromMatrixPosition(camera.matrixWorld); object.updateWorldMatrix(true, false); U.uCamL.value.copy(camW).applyMatrix4(inv.copy(object.matrixWorld).invert());
        const e = camera.matrixWorld.elements, fx = -e[8], fz = -e[10], fl = Math.hypot(fx, fz);     // the eye's heading on the ground (the hero is never rotated by its world)
        if (fl > 0.05) U.uFwd.value.set(fx / fl, fz / fl);
      }
      if (!sunBreak.set) U.uBreak.value.set(sunBreak.x, sunBreak.z + 45 * Math.sin(time * 0.08), 1 / 150, 1 / 90);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); dripMesh.material.uniforms.uViewH.value = size.y; }
    },
    dispose() {},
  };
}
