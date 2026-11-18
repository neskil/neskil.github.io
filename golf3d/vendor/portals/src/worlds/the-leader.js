// THE LEADER: thirteen thousandths of a second above a storm sea, stretched to forty.
//
// MAP OF THIS FILE (in order)
//   1. MOODS            the seeded looks (dusk lemon band, copper, dawn pink, livid green day, night): band, cloud, fog, sea,
//                       exposure, grade saturation, hemisphere strength.
//   2. pchip / clock    the brief's journey clock T (0-40 s) as a function of path progress u, and pace(u) from it.
//   3. GLSL             the world's own shaders: sky dome with the lemon slot (LIGHT UNDER A CLOUD BASE, SEEN THROUGH
//                       WEATHER: BAND_GLSL gives it a pale blaze at its heart low in the west, three or four brighter
//                       windows and dimmer stretches either side, deepening to green-gold (amber in the copper mood) and thinning toward both
//                       ends; its lower edge is the sea horizon, broken by far swell crests; its top has no edge: the
//                       underside of the base hangs into it in large soft pouches lit green-grey from beneath; from
//                       under the base at the entry it is a thinner line; the far sea beyond the sea meshes is deep
//                       teal with broad lanes of swell and the slot's light lying on it), vaulted cloud ceiling
//                       (CLOUD_GLSL: billowed hanging pouches, shared with the dome that carries the base on; the
//                       mesh hangs them 30 m and 24 m deep on a grid that is finest over the entry, so from just under
//                       the base they stand in front of one another in rounded rows that recede into the murk; close
//                       under it they carry smaller pouches; the leader's upper half lights the base from inside, up
//                       in the creases and in soft violet veins along them, the bellies slate against it, their lips
//                       green-grey from the slot: CEIL_FRAG; on the dome the bellies are lit from below by the slot), rain
//                       shafts (six soft slanted curtains of combed strands, each a different width, feathered at
//                       both sides, slate and drawn against the sky only, thinning toward the sea: two hang in front of the
//                       slot, four beside it; U.uFarSea / U.uSeaAmb: the sea's tone goes by the lens's height
//                       above it, near black from under the cloud base, deep teal as we come down; the ceiling is slate
//                       lit from below, its darkest crease never black, its far rows eased to one tone and into the
//                       murk where a pouch is only a few pixels tall, and faded by the length of the sight line through
//                       the murk under the base, so no far row is a ridge in front of the slot; its far edge ragged), splash
//                       crowns, spray glints, THE LEADER'S LIGHT ON THE KIT OCEAN (SEA_LIGHT_GLSL: the kit ocean takes no
//                       lights, so section b adds this function to its shader text before it is first compiled: four
//                       lights (uSeaL: the key tip, the ship limb's tip, the low limb, the trunk) fill the water deep teal
//                       and shade the swell by its slope, a broken violet-white road on the backs toward each light,
//                       the brief's lemon rim on every crest that shoulders up toward the slot, glints of the slot
//                       on the far water toward the west), THE BREAKER (opaque bottle-green
//                       body; a blended LIP of glass on its own fine grid:
//                       dark teal, flow threads out to the edge, solid until the last metre and a half, the slot only as
//                       a luminous rim; glassK turns the glass to plain water from height and from far: a long low
//                       green-black back in the sea's own tone, one torn white line along its crest, its two ends broken
//                       up into the swell; and the
//                       FINGERS: tubes of glass that leave the rim as a web, neck to a string and end in a hanging drop,
//                       each a lens: LENS_ENV is the sky they refract), POOLS OF LIGHT (violet discs on the sea under
//                       the low tips), THE SEA FROM HEIGHT (HSEA: what the dive looks down on: deep teal water, broken
//                       lengths of swell, two crossing trains, short white caps in groups, THE RANK (one big breaking
//                       rank of grouped caps west of the schooner), THE LEADER'S LIGHT ON THE SEA (up to six lights, uPool:
//                       the low tips and the key; a wide teal pool that shades the swell by its slope, violet-white on
//                       the crests and the foam), squall shadow, one broken glitter road toward the slot's core, the
//                       signs of the schooner and the breaker; SEA_RULE is the swell ruling it shares with the pools),
//                       haze decks, ring decals, THE SCHOONER ON THE WATER (SKIRT: foam round her hull, wake, lamp smears;
//                       seen from the skim), petrels (feathers laid on the wing from its chord and span coordinates),
//                       rigging ribbons.
//   4. shipGeometry     the three-masted gaff schooner (merged hull + a ribbon mesh of stays and shrouds).
//                       birdParts: storm petrel body and cambered wing (aF = chord, span).  crownGeometry(fine): the
//                       coronet; the fine one (thin smooth wall, round beads) is used within 8 m of the camera line.
//                       breakerGeometry (BREAK_LINE, BREAK_PROF): the body, the lip's own grid (rows crowded to the
//                       edge) and the finger tubes (their own random stream; kept 2.6 m clear of the camera line).
//   5. build(ctx)       a. mood (ctx.rng, ctx.vary.hour)      b. kit ocean (storm, nearly stopped: the brief's 5 m crests 70-90 m
//                          apart, let down by seaDrop until the skim line clears every crest by 2.6 m) and the leader's light on it
//                       c. schooner seated on the sea; its mastheads go to the hero   d. HERO: buildHero, added at the origin
//                          (ctx.vary.rare -> opts.stray: the stray limb)
//                       e. PATH from hero.anchors.flyThrough (lead-in added, climb straightened to 18 degrees), CLOCK, POIS
//                       f. dome, ceiling, shafts   f2. the sea from height, the pools of light and the haze decks
//                       g. crowns (far + near), decals, breaker + lip (the depth of its solid part, then its top sheet,
//                          then its underside) + fingers, up to three lesser breaking crests (the same wave at a quarter
//                          to a half its size, on the sea's own crest lines at seeded places on the sea round the
//                          schooner, drawn 90 to 300 m from her on any bearing (83 to 332 m once seated on a crest line), with their spray; THE LESSER BREAKERS ARE
//                          DEALT ANEW: the flight line no longer gives them their places), spray, petrels,
//                          rigging, the schooner's foam skirt, mist, lamps
//                       h. lights, FOG, POST
//                       i. update() and dispose().
// WHERE THINGS ARE SET
//   path               section e: `pts` (world space = the brief's space: sea y 0, foremast at the origin, west = -Z). The
//                      corkscrew itself is shaped in the hero (makeRoute): gentle and slow on the arcs that face the slot.
//   pois               section e: entry -> trunk; THE DIVE -> ONE pull of weight 1 on the leading limb's tip (the designers'
//                      ruling, an amendment of the brief: the path keeps its 50 to 62 degrees, the look is lifted; the
//                      hero lays the three dive limbs on a station 19 degrees below the lens, 66-94 m off, the trunk
//                      to the right of it, turning round with the corkscrew as the trunk's own swing gives it (up to about 46 degrees a second at the corkscrew's top);
//                      hero.leadAt works the target out from u's journey second alone); it lets go as the low limb
//                      closes to be overtaken (the brief's 14 s);
//                      LAST ARC AND PULL-OUT (T 12-19.5) -> one steady look at where the ship limb comes down over the
//                      schooner (a glance at the trunk's tip, T 14-16),
//                      skim (from T 15.5) -> schooner and ship limb, climb -> junction, rare -> the stray.
//                      No pull is over weight 1 and no two share a target.
//   hero placement     section d: hero.object at the origin, unscaled; hero.setTime(T) every frame
//   seeded moods       MOODS + section a; the hero adds tree habit, fire colour and rain type from its own seed fork
//   exposure/fog/grade section h (`post`, scene.fog), colours from the mood
//   the breaker        BREAK_LINE (crest line in world xz: main crest left of the route, then a hook that runs beside
//                      the route so the lip hangs over the camera line for z 222-196) and BREAK_PROF (the section)
//   scripted moments   all keyed to T = clock(u): hero.setTime(T) (tree growth, streamers, the rare stray limb that
//                      stalls 4 m right of the lens at T 22.7-25, stroke at T 35.5), uniforms U.uT (the breaker's lip creeps
//                      forward and its fingers are drawn out),
//                      U.uStroke (ceiling, dome and key light lift at the stroke), U.uKey / U.uKeyI (the leader as key
//                      light), U.uPool (five lights: the trunk, the three dive limbs and the key: the
//                      leader's light on the sea from height, the pools-of-light mesh and the glow in the haze decks;
//                      U.uPoolK fades the mesh out below 40 m), U.uHigh (sea from height -> kit ocean
//                      between 100 and 40 m of camera altitude), seaL / U.uSeaL (the four lights on the kit ocean and on the
//                      breaker from afar; U.uLStroke lifts them at the stroke), U.uShipLit (the ship limb's violet light on the sea
//                      round the schooner, seen from height), setBirds(T) (the petrels' drift, one abeam every 0.6 s from
//                      T 21.6). BY DISTANCE, not by the clock: the schooner's lamp glows (one smooth law of the
//                      distance to her), the sea's tone (by the lens's height), the hand-over from the sea from
//                      height to the kit ocean, the pools.
//                      Ambient loops (crowns, decals, spray drift, cloud boil, shafts, wing flutter) run on U.uTime.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/the-leader.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- 1. moods
const MOODS = {
  // dusk: slate cloud and a deep teal sea, the lemon band the one accent (osky: the slate the kit ocean reflects)
  dusk:   { band: '#E9E38A', amt: 1.0, cloud: '#394145', fog: '#2b353c', sea: '#0b2a30', deep: '#10424a', exposure: 1.45, rim: '#E9E38A', sat: 1.02, hemi: 1.3, osky: '#32434a' },
  copper: { band: '#F2A06A', amt: 1.0, cloud: '#3d4058', fog: '#33364a', sea: '#0f2a36', deep: '#12404a', exposure: 1.55, rim: '#F2A06A', sat: 1.08, hemi: 1.3, osky: '#343c52' },
  dawn:   { band: '#F3C6D2', amt: 0.95, cloud: '#3f4560', fog: '#363b52', sea: '#0f2a38', deep: '#103142', exposure: 1.4, rim: '#F3C6D2', sat: 1.08, hemi: 1.3 },
  // day: a livid green-GREY afternoon: a slate ceiling with only a green cast over a viridian sea (the viridian is
  // kept for the sea and the breaker), the slot a clean cold white
  day:    { band: '#F2FBEF', amt: 1.0, cloud: '#3a4a48', fog: '#36423f', sea: '#0c3a30', deep: '#0e4638', exposure: 1.25, rim: '#F2FBEF', sat: 1.1, hemi: 1.3, seaLit: 0.45, glint: 0.35 },
  // night: no band, a dim moonlit rag for the horizon, a slate-teal sea whose crests are rimmed violet
  night:  { band: '#9aa6b8', amt: 0.45, cloud: '#2a3236', fog: '#1e282c', sea: '#0a292d', deep: '#12464c', exposure: 1.65, rim: '#8E62FF', sat: 0.98, hemi: 3.0, osky: '#34474d', seaLit: 1.15 },
};

// ---------------------------------------------------------------- 2. monotone cubic through (x, y) knots
function pchip(xs, ys) {
  const n = xs.length, m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) m.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : 2 * m[i - 1] * m[i] / (m[i - 1] + m[i]);
  return (x) => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid; }
    const h = xs[hi] - xs[lo], s = (x - xs[lo]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[lo] + (s3 - 2 * s2 + s) * h * t[lo] + (-2 * s3 + 3 * s2) * ys[hi] + (s3 - s2) * h * t[hi];
  };
}

// ---------------------------------------------------------------- 3. shaders
const FOGF = /* glsl */`
  uniform vec3 uFogC; uniform float uFogD;
  vec3 wfog(vec3 c, float d) { float q = uFogD * d; return mix(uFogC, c, exp(-q * q)); }`;

const DOME_VERT = /* glsl */`
  varying vec3 vDir;
  void main() { vDir = position; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; }`;
// THE SLOT ALONG ITS LENGTH (shared by the dome and the sea from height). bandAlong: x = how much slot there is on
// this bearing (the west only, 140 degrees of horizon), y = its broad middle. slotAt adds THE LIGHT IN IT (z) and
// its HEART (w): a soft blaze low in the west, ten degrees south of it, where the glitter road runs, about twice as
// bright as anything else in the slot; either side of it three or four brighter WINDOWS and dimmer stretches, the
// whole deepening and thinning away to both ends: never one tone from edge to edge. slotSheen is that light lying on
// the far sea under it (a broken road under the heart), farTone the far sea's own broad lanes of swell and squall.
// CLOUD_GLSL is the underside of the cloud base, shared by the ceiling mesh and by the dome that carries it on:
// POUCHES, rounded where they hang and softly creased between (190 m and 85 m across, a slow 600 m tone under them).
const BAND_GLSL = /* glsl */`
  vec2 bandAlong(vec2 hz, vec2 bd) {
    float c = dot(hz, bd), sn = hz.y * bd.x - hz.x * bd.y;
    float az = abs(c) + abs(sn) < 1e-4 ? 0. : atan(sn, c);
    return vec2(smoothstep(0., 0.5, c), exp(-(az + 0.17) * (az + 0.17) / 0.4));
  }
  float slotAz(vec2 hz, vec2 bd) {
    float c = dot(hz, bd), sn = hz.y * bd.x - hz.x * bd.y;
    return abs(c) + abs(sn) < 1e-4 ? 0. : atan(sn, c);
  }
  vec4 slotAt(vec2 hz, vec2 bd, float t) {
    float az = slotAz(hz, bd), a1 = az + 0.17;
    float core = exp(-a1 * a1 / 0.4), heart = exp(-a1 * a1 / 0.04);
    float w1 = vnoise(vec2(az * 3.3 + 13.7, t * 0.0015)), w2 = vnoise(vec2(az * 9. + 4.1, 3.3 - t * 0.002));
    float win = smoothstep(0.22, 0.8, w1);
    return vec4(smoothstep(0., 0.5, dot(hz, bd)), core, (0.25 + 0.4 * win + 0.1 * w2) * (0.42 + 0.58 * core) + 0.95 * heart, heart);
  }
  float slotSheen(vec4 sl, float az, float dn, float resY) {    // the slot's light on the far sea: GLITTER (fine dashes a pixel tall, lying along the swell, thick under the heart and sparse either side: never patches)
    float n = vnoise(vec2(az * 80. + 3., dn * clamp(resY * 0.8, 240., 800.)));
    float thr = mix(0.66, 0.5, sl.w), glit = 0.3 + 1.9 * smoothstep(thr, thr + 0.2, n);
    return sl.x * (0.25 * sl.z + 0.5 * sl.w * exp(-dn * 6.)) * exp(-dn * 13.) * 0.22 * glit;
  }
  float farTone(vec2 p, float dn) {                             // the far sea's tone: broad soft lanes of swell a kilometre and more apart (nothing finer: at this range it would be blocks)
    float w = vnoise(p * 0.0008 + 11.);
    float lanes = sin(p.y * 0.0046 + p.x * 0.0011 + w * 5.) * (0.4 + 0.6 * w);
    return 1. + (lanes * 0.24 + (vnoise(vec2(p.x * 0.00045 + 3., p.y * 0.0011 + 7.)) - 0.5) * 0.7) * smoothstep(0.012, 0.08, dn);
  }`;
const CLOUD_GLSL = /* glsl */`
  float cbPouch(vec2 p) { float n = 2. * vnoise(p) - 1.; return sqrt(n * n + 0.09) * 0.96; }
  vec2 cloudBase(vec2 p, vec2 dr, float far) {               // x = pouch (1 where it hangs lowest), y = the slow tone; far 0..1: far off only the large pouches are drawn
    float a = cbPouch(p * 0.0052 + dr * 0.5 + 3.1), b = cbPouch(p * 0.0118 - dr + 11.7);
    return vec2(mix(0.62 * a + 0.38 * b, a, far), fbmLo(p * 0.0016 + dr * 0.2 + 5.));
  }`;
const DOME_FRAG = fx.GLSL_NOISE + BAND_GLSL + CLOUD_GLSL + /* glsl */`
  uniform vec3 uCloudC, uBandC, uSeaC, uFogC, uViolet, uCam, uFarSea; uniform float uBandAmt, uTime, uStroke, uFogD, uResY; uniform vec2 uBandDir;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
    float hl = max(length(d.xz), 1e-4); vec2 hz = d.xz / hl; float el = d.y / hl;
    vec4 sl = slotAt(hz, uBandDir, uTime); float west = sl.x, core = sl.y, A = sl.z, heart = sl.w, amt = min(uBandAmt, 1.);
    float azb = slotAz(hz, uBandDir);
    float n = fbm(hz * 3.2 + vec2(el * 5., uTime * 0.004));
    vec3 cloud = mix(uFogC * 1.2, uCloudC * 1.02, smoothstep(0.02, 0.6, el)) * (0.84 + 0.36 * n);
    // THE CLOUD BASE CARRIED ON beyond the ceiling mesh: the same pouches (CLOUD_GLSL), found where this ray meets the
    // base, so they lie in rows that foreshorten toward the horizon and melt into the rain murk well above the slot
    // (they start 6 degrees up: lower down their rows would read as a far coast of hills over the slot)
    float dc = (770. - uCam.y) / max(d.y, 0.02);
    vec2 pc = uCam.xz + d.xz * dc, dr = vec2(uTime * 0.012, -uTime * 0.008);
    float farK = smoothstep(1100., 2600., dc);                                       // (far off the pouches are drawn broader, so that no row is finer than a pixel)
    vec2 cb = cloudBase(pc, dr, smoothstep(500., 1500., dc));
    float ph = mix(cb.x, cbPouch(pc * 0.0021 + dr * 0.2 + 5.), farK);
    float kc = exp(-dc / 3000.) * smoothstep(0.1, 0.2, d.y);
    vec3 base = uCloudC * (0.68 + 1.05 * ph * ph) * (0.7 + 0.6 * cb.y);
    base += uBandC * uBandAmt * west * (1. - ph) * 0.05 * exp(-el * 3.);          // the creases between the pouches take a little of the slot
    // ... and THE BELLIES ARE LIT FROM BELOW BY THE SLOT, green-grey, most over its heart and low in the west, less and
    // less up the sky: from the pull-out to the portal the base is rows of lit pouches over slate creases
    base += mix(uBandC, uCloudC * 1.7, 0.6) * uBandAmt * west * (0.35 + 0.65 * core) * exp(-el * 2.) * 0.8 * ph * ph;
    cloud = mix(cloud, base, kc);
    // THE SLOT: LIGHT UNDER A CLOUD BASE, SEEN THROUGH WEATHER. Below, it ends on the sea horizon (hard, broken by far
    // swell crests). Above, it has no edge at all: the underside of the base hangs into it in large soft pouches (a
    // field in bearing and height, tens of pixels across, drifting slowly), so the top of the glow is billowed cloud,
    // lit green-grey from beneath, and never a ruled line, a tooth or a tear. Inside it the light is slotAt's: a pale
    // blaze at the heart, lemon windows, green-gold between them and toward the ends, brightest on the horizon and
    // deepening upward. From just under the base (the entry) the slot is a thinner line, as it would be. The rain
    // shafts that cross it are the shaft mesh's curtains, drawn in front of it.
    float altK = 1. - 0.4 * smoothstep(300., 680., uCam.y);
    float Hb = (0.056 + 0.04 * core + 0.016 * min(A, 1.)) * altK;
    float x1 = 2. * vnoise(vec2(azb * 3.4 + 1.3, uTime * 0.0012)) - 1.;
    float top = Hb * (1.1 - 0.5 * sqrt(x1 * x1 + 0.03)), K = 15. / altK;
    float bil = fbmLo(vec2(azb * 15. + 3. + uTime * 0.01, el * K + 7.)), bil2 = vnoise(vec2(azb * 6.1 + 9. - uTime * 0.006, el * K * 0.4 + 2.));
    float x = max(el, 0.) / max(top, 1e-3);
    float open = 1. - smoothstep(0.55, 1.25, x + (bil - 0.5) * 0.95 + (bil2 - 0.5) * 0.5);
    float lowK = exp(-x * 2.);
    float mxc = max(max(uBandC.r, max(uBandC.g, uBandC.b)), 1e-3);
    vec3 hot = mix(uBandC, uBandC * uBandC / mxc, 0.8 * smoothstep(0.3, 0.7, uBandC.g / mxc));   // (a copper slot deepens to amber, not to red)                              // the slot's own hue, deeper: lemon, not cream
    vec3 pale = mix(uBandC, vec3(mxc), 0.45) * 1.15, gold = hot * vec3(0.84, 0.96, 0.66);
    float Av = A * (0.45 + 0.55 * lowK);
    vec3 bc = mix(gold, uBandC, smoothstep(0.1, 0.55, Av));
    bc = mix(bc, pale, clamp(heart * (0.25 + 0.75 * lowK) + 0.22 * lowK * lowK, 0., 1.)) * min(Av, 1.2) * (0.62 + 0.4 * lowK);   // palest and brightest along the horizon, deepening upward: a glow, never one flat tone   // (the heart stays under the bloom threshold: a blaze, not a lamp)
    vec3 greenGrey = mix(uBandC, uCloudC * 1.7, 0.6);
    bc = mix(bc, greenGrey * (0.12 + 0.3 * A), smoothstep(0.6, 1.5, x));             // feathering to green-grey above
    float puff = smoothstep(0.25, 0.8, fbmLo(vec2(azb * 7. + 9., el * 11. - uTime * 0.006)));
    float lit = exp(-max(el - top * 0.7, 0.) / (0.07 + 0.13 * core)) * (0.3 + 0.7 * puff) * (0.1 + 0.5 * A) * west * uBandAmt;
    cloud += greenGrey * lit * 0.75;                                                  // the underside of the base takes the last of it, in billows
    vec3 col = mix(cloud, bc, open * west * amt);
    // THE FAR SEA (beyond what the sea meshes draw) and THE HORIZON: deep teal, never black, its broad lanes of swell
    // just visible from height, the slot's light lying on it under the heart; far swell crests break the line
    float hb = smoothstep(0.45, 0.8, vnoise(vec2(azb * 38. + 5., 1.7))) * (0.3 + 0.7 * vnoise(vec2(azb * 13., 9.))) * 0.0045;
    float dn = max(-el, 0.), ew = max(fwidth(el) * 0.75, 3e-4);
    vec2 ps = uCam.xz + hz * min(max(uCam.y, 1.) / max(dn, 1e-4), 40000.);
    vec3 sea = uFarSea * farTone(ps, dn) + uBandC * uBandAmt * slotSheen(sl, azb, dn, uResY) * smoothstep(30., 150., uCam.y);
    col = mix(sea, col, smoothstep(hb - ew, hb + ew, el));
    col += uViolet * uStroke * 0.035;
    gl_FragColor = vec4(max(col, 0.), 1.);
  }`;

const CEIL_VERT = fx.GLSL_NOISE + CLOUD_GLSL + /* glsl */`
  uniform float uTime; uniform vec2 uAxis;
  varying vec3 vW; varying float vDist; varying float vHang;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.);
    float r = length(wp.xz - uAxis);
    // THE POUCHES HANG (never below 700 m): the large ones 30 m deep, the 85 m ones another 24 m, so that from just
    // under the base (the entry) each belly stands in front of the creases behind it and the ceiling is rows of
    // rounded shapes, never a level sheet. vHang: 1 where the base hangs lowest, 0 up in a crease.
    vec2 dr = vec2(uTime * 0.012, -uTime * 0.008);
    float up = 30. * (1.01 - cbPouch(wp.xz * 0.0052 + dr * 0.5 + 3.1)) + 24. * (1. - cbPouch(wp.xz * 0.0118 - dr + 11.7)) + vnoise(wp.xz * 0.024 - uTime * 0.013) * 7.;
    wp.y += 0.085 * max(r - 220., 0.) + up;
    vHang = 1. - up / 50.;
    vW = wp.xyz; vec4 mv = viewMatrix * wp; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
  }`;
const CEIL_FRAG = fx.GLSL_NOISE + FOGF + CLOUD_GLSL + /* glsl */`
  uniform vec3 uCloudC, uBandC, uViolet, uKey, uCam; uniform float uTime, uBandAmt, uKeyI, uGlowR, uStroke, uResY; uniform vec2 uAxis, uBandDir;
  varying vec3 vW; varying float vDist; varying float vHang;
  void main() {
    // BILLOWED CLOUD, larger and softer than anything on the sea: hanging pouches, light on their bellies and dark in
    // the creases between them, a slow broad tone under them; far off only the large ones are drawn
    vec2 p = vW.xz, dr = vec2(uTime * 0.012, -uTime * 0.008);
    float far = smoothstep(500., 1500., vDist), hang = clamp(vHang, 0., 1.);
    vec2 cb = cloudBase(p, dr, far); float ph = cb.x;
    // (close under the base, where the entry flies, the pouches carry smaller pouches of their own, 85 and 45 m
    // across: from ten metres below it the ceiling is cloud with form in it, never one even sheet of colour)
    float nearK = 1. - smoothstep(140., 460., vDist);
    float nearer = 1. - smoothstep(50., 240., vDist);                            // (and within 200 m, smaller ones again, 18 m across: right under the base the cloud still has form)
    float F = mix(1., 0.6, nearK) * (2. * vnoise(p * 0.0118 - dr + 11.7) - 1.) + 0.4 * nearK * (2. * vnoise(p * 0.022 - dr * 1.4 + 7.7) - 1.) + 0.3 * nearer * (2. * vnoise(p * 0.055 + dr * 2. + 3.3) - 1.);
    ph = mix(ph, 0.45 * ph + 0.55 * min(sqrt(F * F + 0.03) * 1.9, 1.), 0.35 * (1. - far) + 0.65 * nearK);
    // WHERE THE BASE IS SEEN EDGE-ON AND FAR OFF (a pixel covering eight metres of it and more: a pouch only a few
    // pixels tall) its pattern is eased to the mean and the whole of it goes into the murk: the ceiling RECEDES, in
    // rounded rows that soften and are gone, and never ends in stacked bars or a ruled edge
    vec2 pw = fwidth(p); float foot = max(pw.x, pw.y) * uResY / 360., ease = smoothstep(8., 40., foot);
    ph = mix(ph, 0.5, 0.85 * ease);
    // slate LIT FROM BELOW: a belly that hangs low is lighter than the crease above it (never black), and its lip takes
    // the last of the slot's light, green-grey
    vec3 col = uCloudC * (0.68 + 1.05 * ph * ph) * (0.7 + 0.6 * cb.y) * (0.8 + 0.5 * hang * hang);
    float e = cloudBase(p + uBandDir * 60., dr, far).x - cb.x;                   // the pouch's flank that faces the slot
    col += uBandC * uBandAmt * clamp(-e * 2.2, 0., 1.) * 0.16 * (0.4 + 0.6 * ph) * (1. - 0.7 * ease);
    col += mix(uBandC, uCloudC * 1.7, 0.6) * uBandAmt * 0.24 * hang * hang * hang * (1. - 0.5 * ease);   // (the underside of a belly is the lightest part of it: the slot lights the base from below)
    float r = length(p - uAxis);
    // THE LEADER'S UPPER HALF INSIDE THE CLOUD lights it from within (a steady glow, brightest round the hole the trunk
    // comes out of): the light comes through where the cloud is thin, UP IN THE CREASES between the pouches and in
    // soft veins along them, and the bellies that hang below stay slate against it. Its reach is ragged, not a ring.
    float seam = exp(-F * F / 0.02), crease = (1. - hang) * sqrt(1. - hang);
    float rr = r * (0.7 + 0.6 * fbmLo(p * 0.004 + vec2(2.1, 5.3)));
    float g = exp(-rr * rr / max(uGlowR * uGlowR, 1.)) * (0.02 + 0.8 * seam * (0.5 + cb.y) + 0.7 * crease) * (1. - 0.6 * ease) + 0.5 * exp(-r * r / 1600.);
    vec3 kd = uKey - vW; float kl = length(kd);
    g += uKeyI * 0.04 * exp(-kl / 110.) * (0.15 + 1.2 * hang * hang);            // (the nearest tip's light on the bellies of the pouches; the creases stay slate)
    col += uViolet * g * (0.22 + 0.9 * uStroke);
    float fq = uFogD * vDist * 0.45; col = mix(uFogC * 1.2, col, exp(-fq * fq) * (1. - 0.65 * ease));   // big shapes stay readable through the murk (the dome carries the same pouches on); the murk under the base is lit slate, a little lighter than the rain's
    // the mesh ends in a ragged, feathered edge (broad noise, 400 m and more), never in a straight line: the dome carries the same pouches on beyond it
    float a = 1. - smoothstep(850., 1700., length(p - uCam.xz) + (fbmLo(p * 0.0017 + 7.3) - 0.5) * 700.);
    // FAR ROWS GO INTO THE HAZE BY THE DISTANCE THE EYE LOOKS THROUGH THE MURK UNDER THE BASE (a layer some 60 m deep,
    // the depth the pouches hang): seen from below, a sight line leaves it at once and the ceiling is whole; seen
    // from just under the base, level, the line runs on in it and a row 800 m off is all but gone: no far row stands
    // as a dark ridge in front of the slot (the dome behind carries the slot's own feathered top).
    vec3 tv = vW - uCam; float murk = min(vDist, 60. / max(abs(tv.y) / max(vDist, 1.), 1e-3)) / 700.;
    a *= exp(-murk * murk);
    gl_FragColor = vec4(col, a);
  }`;

const SHAFT_VERT = /* glsl */`
  attribute float aSeed; varying vec2 vUv; varying float vSeed; varying vec3 vW;
  void main() { vUv = uv; vSeed = aSeed; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
// RAIN SHAFTS: soft slanted curtains hanging from the base, 1.3-2.4 km off. Each is densest in its middle and
// feathered to nothing at both sides (no edge anywhere), softly combed into fall streaks that wander with its sides
// and sweep as they near the sea (never ruled lines), a few strands thinner than the rest and some of them lifting
// off the sea; slate, never black; a veil that thins toward the sea (the comb, the foot and the strength follow
// live's laws: darker and harder-combed they read as smeared panes hanging in the sky). They are drawn against the
// sky only: at the sea horizon they fade out (the sea meshes are drawn over them, and a curtain cut off where those
// end stood on the far sea as a block).
const SHAFT_FRAG = fx.GLSL_NOISE + /* glsl */`
  uniform vec3 uFogC, uCam; uniform float uTime;
  varying vec2 vUv; varying float vSeed; varying vec3 vW;
  void main() {
    float x = clamp(vUv.x, 0., 1.), y = clamp(vUv.y, 0., 1.);
    vec3 tv = vW - uCam; float sky = smoothstep(-0.03, 0.004, tv.y / max(length(tv.xz), 1.));
    float wv = (fbm(vec2(y * 2.6 + vSeed * 9., vSeed * 31. + uTime * 0.004)) - 0.5) * 0.3;          // wandering sides
    float xs = clamp(x + wv * (0.4 + 0.6 * y), 0., 1.);
    float body = sin(3.14159 * xs); body *= body * smoothstep(0., 0.2, x) * (1. - smoothstep(0.8, 1., x));
    float sn = fbm(vec2(xs * 3.6 + vSeed * 13. + wv * 3., y * 1.1 + vSeed * 3.));
    float strands = 0.3 + 0.7 * smoothstep(0.25, 0.75, sn);                                          // three or four soft strands that wander
    float comb = fbm(vec2((xs + 0.1 * (1. - y) * (1. - y)) * 22. + vSeed * 30. + uTime * 0.012, y * 1.3 + vSeed * 7.));   // fall streaks: they wander with the curtain's sides and sweep as they near the sea, soft (live's law), never ruled
    float top = 1. - smoothstep(0.6, 0.96, y);                                                       // frays out of the cloud base
    float foot = mix(1., smoothstep(0., 0.05 + 0.2 * sn, y), (1. - smoothstep(0.3, 0.55, sn)) * 0.8) * (0.3 + 0.7 * smoothstep(0., 0.4, y));   // the thin strands lift off the sea
    float a = body * strands * (0.3 + 0.7 * comb) * top * foot * sky;
    gl_FragColor = vec4(uFogC * 0.74, a * 0.6);
  }`;

// splash crowns: a coronet that rises, beads its rim, lets go, and a rebound jet (one instanced mesh)
const CROWN_VERT = /* glsl */`
  attribute vec3 aC; attribute float aK; attribute vec3 iPos; attribute vec4 iParm;     // iParm: scale, phase, rate, seed
  uniform float uTime;
  varying vec3 vW; varying vec3 vN; varying float vDist; varying float vH;
  void main() {
    float g = fract(uTime * iParm.z + iParm.y);
    vH = aK < 0.5 ? position.y : 1.;
    float rise = sin(3.14159 * pow(max(g, 0.), 0.7));
    float rad = mix(0.35, 1., smoothstep(0., 0.6, g));
    float env = smoothstep(0., 0.06, g) * (1. - smoothstep(0.9, 1., g));
    vec3 p = position;
    if (aK < 0.5) { p.xz *= rad * (1. + 0.4 * p.y * g); p.y *= rise * 1.15; }
    else if (aK < 1.5) {
      float fly = smoothstep(0.42, 1., g);
      vec3 c = vec3(aC.x * rad * (1. + 0.4 * g) * (1. + 0.7 * fly), aC.y * rise * 1.15 + fly * 0.9, aC.z * rad * (1. + 0.4 * g) * (1. + 0.7 * fly));
      p = c + (position - aC) * smoothstep(0.12, 0.4, g) * (1. + 0.6 * fly);
    } else { float h = smoothstep(0.5, 0.92, g); p.y *= h * 1.7; p.xz *= 0.7 * step(0.01, h); }
    vec3 wp = iPos + p * iParm.x * env;
    vW = wp; vN = normal;
    vec4 mv = viewMatrix * vec4(wp, 1.); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
  }`;
const GLASS_LIGHT = /* glsl */`
  uniform vec3 uCloudC, uBandC, uSeaC, uViolet, uGlowC, uKey, uCam; uniform float uBandAmt, uKeyI, uStroke; uniform vec2 uBandDir;
  // water lit by the two lights: the slot (rim) and the leader (key), over a deep teal body
  vec3 glass(vec3 n, vec3 w, vec3 body, vec2 skyK, vec2 gloss) {       // gloss: exponent and gain of the leader's glint
    vec3 v = normalize(uCam - w); if (dot(n, v) < 0.) n = -n;
    float ndv = clamp(dot(n, v), 0., 1.), fres = pow(max(1. - ndv, 0.), 3.);
    vec3 rf = reflect(-v, n);
    float hl = max(length(rf.xz), 1e-3), el = rf.y / hl;
    float west = smoothstep(0.0, 0.7, dot(rf.xz / hl, uBandDir));
    vec3 sky = mix(uCloudC, uBandC * uBandAmt * 1.1, west * smoothstep(-0.05, 0.02, el) * (1. - smoothstep(0.06, 0.3, el)));
    vec3 l = uKey - w; float ld = max(length(l), 1e-3); l /= ld;
    float ki = uKeyI * (1. + 1.2 * uStroke) * 160. / (160. + ld);
    vec3 col = body * (0.55 + 0.45 * n.y) + sky * (skyK.x + skyK.y * fres);
    col += uBandC * uBandAmt * 0.3 * fres * max(dot(n.xz, uBandDir), 0.);
    col += uGlowC * ki * pow(max(dot(rf, l), 0.), gloss.x) * gloss.y + uViolet * ki * 0.07 * max(dot(n, l), 0.);
    return col;
  }`;
const CROWN_FRAG = FOGF + GLASS_LIGHT + /* glsl */`
  varying vec3 vW; varying vec3 vN; varying float vDist; varying float vH;
  void main() {
    vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
    // clear water: darker than the sea at its foot, mostly reflection, the slot's colour along the rim
    vec3 col = glass(n, vW, uSeaC * 1.2 * mix(0.5, 1.1, vH), vec2(0.2, 0.8), vec2(40., 1.6));
    col += uBandC * uBandAmt * smoothstep(0.7, 1., vH) * 0.5;
    gl_FragColor = vec4(wfog(max(col, 0.), vDist), 1.);
  }`;

// spray: stopped beads of water as small round lenses (instanced quads)
const SPRAY_VERT = /* glsl */`
  attribute vec3 iPos; attribute vec4 iParm;   // iParm: radius, seed, drift, kind (0 free, 1 a petrel's halo)
  uniform float uTime, uResY, uBirdDz;
  varying vec2 vQ; varying float vA; varying float vDist; varying vec3 vW;
  void main() {
    float sd = iParm.y * 60.;
    vec3 c = iPos + vec3(sin(uTime * 0.31 + sd), -0.3 + 0.6 * fract(sd) - 0.02 * uTime * (0.5 + fract(sd * 3.1)), cos(uTime * 0.27 + sd * 1.7)) * iParm.z;
    c.y = iPos.y + mod(c.y - iPos.y + 2., 4.) - 2.;
    c.xz += vec2(0.096, 1.) * uBirdDz * iParm.w;               // a petrel's halo travels with its bird
    vec4 mv = viewMatrix * vec4(c, 1.);
    float dist = max(length(mv.xyz), 0.3), px = uResY * projectionMatrix[1][1] * 0.5 / dist;
    float grow = max(1., 1.3 / max(iParm.x * px, 1e-4));
    vA = (1. / (grow * grow)) * smoothstep(0.5, 1.4, dist);
    vQ = position.xy; vDist = dist; vW = c;
    mv.xy += position.xy * iParm.x * grow;
    gl_Position = projectionMatrix * mv;
  }`;
const SPRAY_FRAG = FOGF + /* glsl */`
  uniform vec3 uCloudC, uBandC, uSeaC, uViolet, uGlowC, uKey; uniform float uBandAmt, uKeyI, uStroke;
  varying vec2 vQ; varying float vA; varying float vDist; varying vec3 vW;
  void main() {
    float r = length(vQ); if (r > 1.) discard;
    float edge = 1. - smoothstep(0.82, 1., r), rim = smoothstep(0.45, 0.98, r);
    vec3 col = uSeaC * 1.5 + uCloudC * 0.6 * rim;
    col += uBandC * uBandAmt * (smoothstep(0.25, 0.8, vQ.y) * rim * 1.1 + 1.7 * exp(-dot(vQ - vec2(0., 0.55), vQ - vec2(0., 0.55)) * 30.));
    float ki = uKeyI * (1. + 1.5 * uStroke) * 120. / (120. + distance(uKey, vW));
    col += uGlowC * ki * exp(-dot(vQ - vec2(0.3, -0.35), vQ - vec2(0.3, -0.35)) * 40.) * 2.2 + uViolet * ki * rim * 0.4;
    float a = edge * vA * (0.55 + 0.45 * rim);
    gl_FragColor = vec4(max(wfog(col, vDist), 0.) * a, a);
  }`;

// the stopped breaker: a thick bottle-green body and a lip of clear glass. Three meshes: the BODY (opaque), the LIP
// (uLip 1: its own fine grid, blended, no depth write: dark teal glass where it is thick, its flow threads running
// right out to the edge, the slot only as a luminous rim on the last hand's width) and the FINGERS (FINGER_VERT /
// FINGER_FRAG below): ligaments of glass that leave the rim, neck down to strings and end in a bead.
const BREAK_VERT = /* glsl */`
  attribute vec3 aInfo;                                      // thin (0 body .. 1 lip edge), finger root (0..1), along-crest 0..1
  attribute vec2 aDir; attribute vec3 aL;                    // the lip's own forward direction (xz); crest coordinates (along, up, forward)
  uniform float uTime, uT, uLip;
  varying vec3 vW; varying vec3 vN; varying vec3 vInfo; varying float vDist; varying vec3 vL;
  void main() {
    vec3 p = position;
    float th = aInfo.x * aInfo.x;                            // the whole lip creeps forward (the fingers ride on it: FINGER_VERT)
    p.xz += aDir * th * (0.3 + 1.2 * uT / 40. + 0.12 * sin(uTime * 0.6 + aInfo.z * 40.));
    p.y -= 2.2 * (1. - smoothstep(-0.6, 1., aL.y));          // its foot goes down under the troughs of the storm sea: the wave never stands on the water with an edge showing
    vec4 wp = modelMatrix * vec4(p, 1.);
    vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vInfo = aInfo; vL = aL;
    vec4 mv = viewMatrix * wp; vDist = length(mv.xyz);
    mv.xyz *= 1. - uLip * 0.04 / max(vDist, 0.3);              // the lip lies over the body's outer rows: 4 cm nearer the lens, so the two never fight
    gl_Position = projectionMatrix * mv;
  }`;
// the sky as glass sees it (the lip's rim, the fingers and their beads look it up through a lens): the slot low in
// the west, cloud above, sea below
const LENS_ENV = /* glsl */`
  vec3 envSky(vec3 d) {
    float hl = max(length(d.xz), 1e-4), el = d.y / hl;
    float west = smoothstep(0.05, 0.6, dot(d.xz / hl, uBandDir));
    vec3 sky = mix(uFogC * 1.15 + uBandC * uBandAmt * 0.05 * west, uCloudC * 0.8, smoothstep(0.02, 0.6, el));
    float band = smoothstep(0., 0.012, el) * (1. - smoothstep(0.04, 0.15, el));
    sky = mix(sky, uBandC * 1.15, band * west * min(uBandAmt, 1.));
    vec3 sea = mix(uSeaC * 0.6, uSeaC * 1.9 + uBandC * uBandAmt * 0.1 * west, smoothstep(-0.5, 0., el));
    return mix(sea, sky, smoothstep(-0.006, 0.006, el));
  }`;
const BREAK_FRAG = fx.GLSL_NOISE + FOGF + GLASS_LIGHT + LENS_ENV + /* glsl */`
  uniform float uTime, uLip, uOut, uLAmb, uSeaDrop; uniform vec3 uRimC, uLTeal; uniform vec4 uSeaL[4];
  varying vec3 vW; varying vec3 vN; varying vec3 vInfo; varying float vDist; varying vec3 vL;
  void main() {
    vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
    vec3 vd = normalize(vW - uCam + vec3(0., 1e-5, 0.));
    float inside = smoothstep(0., 0.12, dot(n, vd) * uOut);                  // this face is seen from within the water (only ever through the glass of the lip)
    if (dot(n, vd) > 0.) n = -n;                                             // turned to the lens BEFORE it is rippled, so body and lip (whose faces wind the other way) are shaded as one surface
    float thin = vInfo.x;
    // FROM HEIGHT AND FROM FAR OFF (above 60 m, beyond 150 m) the breaker is a torn line of white water on a green-black
    // back; its emerald glass comes up only as we level out toward it (glassK 0 -> 1)
    float glassK = (1. - smoothstep(25., 90., uCam.y)) * (1. - smoothstep(120., 260., vDist));
    float far = 1. - glassK, farM = max(far, 0.6 * smoothstep(60., 130., vDist));     // (from 60 m out it already keeps part of its torn white cap and its melting ends)
    float aE = vInfo.z, envS = pow(max(smoothstep(0., 0.44, aE), 0.), 0.95) * pow(max(1. - smoothstep(0.8, 1., aE), 0.), 0.8);
    // fine streaks drawn up the face and out along the lip: reflections are threads, not bands
    float rip = fbm(vec2(vL.x * 2.7, vL.y * 1.05 + vL.z * 0.6 - uTime * 0.03));
    n = normalize(n + vec3(rip - 0.5, 0., fbmLo(vec2(vL.x * 5.1 + 9., vL.y * 1.05)) - 0.5) * 0.2);
    // the trough in front of the face is sea, not glass: chopped, and mirroring the cloud and the slot as the ocean does
    float foot = (1. - smoothstep(0.8, 3.2, vL.y)) * step(0., vL.z);
    n = normalize(n + vec3(fbmLo(vW.xz * 0.8 + uTime * 0.02) - 0.5, 0., fbmLo(vW.xz * 0.8 + 17.3 - uTime * 0.016) - 0.5) * foot * 0.9);
    float toSlot = max(dot(vd.xz, uBandDir), 0.);
    float level = 1. - smoothstep(0.12, 0.45, -vd.y);                       // seen from above there is only sea behind it
    float behind = 1. - smoothstep(0.1, 0.42, vd.y);                        // seen from below there is only cloud behind it
    float ndv = abs(dot(n, vd)), fres = 1. - ndv; fres *= fres * fres;
    // glass: dark bottle green where it is thick, clear teal where it curls, backlit emerald where the slot stands
    // behind it; only the rim (the last 0.4 m) takes the slot's own colour
    vec3 thick = uSeaC * 1.1 + vec3(0., 0.01, 0.007);
    vec3 teal = vec3(0.016, 0.13, 0.115) + uSeaC * 0.7;
    vec3 mint = mix(vec3(0.2, 0.8, 0.55), uBandC, 0.55) * (0.3 + 0.7 * min(uBandAmt, 1.));
    vec3 body = mix(thick, teal, smoothstep(0.04, 0.62, thin) * glassK) * (0.82 + 0.4 * rip);
    float thread = smoothstep(0.48, 0.74, fbm(vec2(vL.x * 3.2, (vL.y + vL.z) * 0.13 + 4.)));   // flow lines from the crest out to the edge
    float fine = smoothstep(0.5, 0.68, fbmLo(vec2(vL.x * 11., (vL.y + vL.z) * 0.11 + 1.7)));   // and hair-fine ones between them
    // the leader's reflection on the wave: a few hard glints strung along the flow lines (a tight lobe, on the threads
    // only), never a soft white patch; the chopped trough at its foot keeps the sea's broad glint
    vec3 col = glass(n, vW, body, mix(vec2(0.03, 0.12), vec2(0.14, 0.8), foot), mix(vec2(400., 2.4 * thread * fine), vec2(40., 1.6), foot * (1. - smoothstep(0.3, 1.1, vL.y))));
    col += (teal * 1.5 + uCloudC * 0.25) * fres * 0.55 * glassK;            // a green sheen at grazing angles, not the cloud's blue
    col += vec3(0.02, 0.3, 0.22) * (0.3 + 0.7 * min(uBandAmt, 1.)) * smoothstep(0.25, 0.85, thin) * (0.35 + 0.65 * thread) * toSlot * level * behind * 0.7 * glassK;   // backlit emerald
    col += mint * thread * thin * 0.16 * level * (0.35 + 0.65 * behind) * glassK;
    // THE LIP FROM BELOW AND ITS EDGE: the sheet lets a little of what is above it through (more where it thins), its
    // threads stay dark-and-bright right out to the edge, and the light of the slot is piped to a narrow rim
    float lipK = smoothstep(0.56, 0.96, thin) * glassK, up = 1. - behind;         // (the glass terms come in exactly where the lip's alpha does: wall and roof are one curve)
    col += body * up * (0.3 + 0.5 * thread * smoothstep(0.15, 0.5, thin));       // the roof of the barrel, from below: lit off the sea, its threads still showing
    vec3 through = envSky(refract(vd, n, 0.8) + vec3(0., 1e-4, 0.)) * vec3(0.55, 1., 0.88);
    through = mix(min(through, teal * 2.5), through, smoothstep(0.62, 0.9, thin));   // thick glass lets no more than its own teal through: the slot shows only where the sheet thins
    col += through * lipK * (0.25 + 0.5 * up) * (0.55 + 0.45 * fine);
    col *= mix(1., 0.62 + 0.55 * thread + 0.25 * fine, lipK);
    col += (teal * 2.2 + uViolet * uKeyI * 0.25) * lipK * up * (0.2 * thread + 0.3 * fine * fine);   // threads catch the leader from below
    col -= teal * 0.9 * fres * thin * up * smoothstep(0.78, 1., thin);       // a darker outline where the sheet turns away (the rim only: the roof behind it is lit glass, as the wall is)
    // the face seen head-on (the inside corner of the hook) is streaked glass, never a dark pane; and where the wall
    // stands in the sea it darkens into the trough, with a torn line of foam along the waterline
    float front = step(0., vL.z) * (1. - smoothstep(0.3, 0.6, thin));
    col += teal * 0.3 * ndv * ndv * front * smoothstep(0.5, 3., vL.y) * (0.4 + 1.2 * rip * thread) * glassK;
    float wy = vW.y + uSeaDrop;                                              // height over the sea's own level
    col *= 1. - 0.5 * front * (1. - smoothstep(0.2, 2.2, wy)) * smoothstep(0.3, 0.8, envS);   // (no trough shadow where the wave runs out into the swell: its ends are the sea's own tone)
    float wlace = smoothstep(0.42, 0.68, fbmLo(vec2(vL.x * 0.8, wy * 1.6 - uTime * 0.02))) * (1. - smoothstep(0.2, 1.3, wy)) * front;
    col = mix(col, uCloudC * 1.9 + uBandC * uBandAmt * 0.12, wlace * 0.55);
    float edge = smoothstep(0.955, 1., thin), root = vInfo.y;
    col += (uRimC * max(min(uBandAmt, 1.), 0.75) * (0.35 + 0.65 * toSlot) + mint * 0.5) * min(edge * (0.45 + 0.55 * thread) * (1. - 0.6 * root), 1.) * 0.55 * level;   // (dimmer where the sheet runs out into a finger's root: that is dark glass)
    // foam only as fine lace down the back (close to: glassK 1)
    float backN = (1. - smoothstep(0.02, 0.3, thin)) * (1. - smoothstep(-2., 1.5, vL.z)) * smoothstep(-0.5, 3., vL.y);
    float laceN = smoothstep(0.46, 0.7, fbm(vec2(vL.x * 0.5, vL.z * 0.22 - uTime * 0.01))) * (0.3 + 0.7 * smoothstep(0.3, 0.62, vnoise(vec2(vL.x * 1.9, vL.z * 0.9))));
    // FROM HEIGHT AND FROM FAR OFF it is a long low back of green-black water with ONE torn line of white along its
    // crest: the foam runs ALONG the crest (drawn out eight times longer than it is deep), at full weight only on the
    // crest strip, its lower edge torn; below that it thins to a few veins trailing down the face and the back
    float tornLo = mix(0.25, 0.8, fbm(vec2(vL.x * 0.12, 3.3 + uTime * 0.004)));          // (the line is the overhanging lip, two to five metres of it, torn along its length: a LINE from above, never a white slab)
    float crestK = smoothstep(tornLo, tornLo + 0.14, thin) * (0.62 + 0.38 * smoothstep(0.3, 0.6, fbm(vec2(vL.x * 0.12, vL.z * 0.5 - uTime * 0.01))));
    float veins = smoothstep(0.56, 0.74, fbm(vec2(vL.x * 0.16, vL.y * 0.55 + vL.z * 0.4 + 7.))) * smoothstep(5., 9., vL.y) * 0.3;
    float foamF = clamp(crestK + veins * (1. - crestK), 0., 1.);
    float lsum = 0.;                                                                 // the leader's light as the sea round it takes it (SEA_LIGHT_GLSL)
    for (int i = 0; i < 4; i++) { vec4 q = uSeaL[i]; vec3 ld = q.xyz - vW; float S = 120. + 0.8 * max(q.y, 0.); lsum += q.w * S * S / (S * S + dot(ld, ld)) * 0.5; }
    vec3 seaLit = uSeaC * 1.2 + uCloudC * 0.05 + uLTeal * (uLAmb * 0.8 + 0.8 * lsum / (1. + 0.45 * lsum));
    col = mix(col, seaLit * vec3(0.7, 1., 0.84) * (0.26 + 0.3 * rip + 0.22 * smoothstep(4., 9., vL.y)), far * 0.86);   // its body: the sea's own tone, in shadow (green-black against the lit water round it)
    col = mix(col, uCloudC * mix(3.4, 2.2, glassK) + uBandC * uBandAmt * 0.2 + uViolet * uKeyI * 0.12, mix(foamF, laceN * backN * 0.7, 1. - farM));
    // and its two ends MELT into the swell: where the crest tapers out the body breaks up into torn patches and goes
    // to the sea's own tone, so the wave never ends in a cut edge standing on flat water
    float melt = farM * (1. - smoothstep(0.12, 0.74, envS));
    if (melt > 0.03 + 0.97 * fbm(vec2(vL.x * 0.45 + 1.7, vL.y * 0.8 + vL.z * 0.25))) discard;
    col = mix(col, seaLit, melt * 0.75 * (1. - foamF));
    // WALL AND ROOF ARE ONE CURVE OF GLASS. The roof stays all but solid, shaded as the wall is, until the last
    // metre and a half before the rim (thin > 0.8), where it clears; and whatever shows through it of the wave's own
    // back slope, seen from within (uOut: the body only), is one deep green: no foam, no second surface, no edge
    col = mix(col, thick * (0.7 + 0.35 * rip), inside);
    float a = mix(1., mix(1., mix(0.97, 0.34, smoothstep(0.8, 1., thin)) + 0.3 * edge + 0.25 * fres, smoothstep(0.56, 0.9, thin)), uLip);
    a = max(a, farM * foamF);                                                         // (from afar the lip's edge is foam, not clear glass)
    gl_FragColor = vec4(wfog(max(col, 0.), vDist), clamp(a, 0., 1.));
  }`;
// THE LIP'S DEPTH (colour off): the solid part of the sheet (thin < 0.8), within 150 m. See section g.
const LIPZ_FRAG = /* glsl */`
  varying vec3 vInfo; varying float vDist;
  void main() { if (vInfo.x > 0.8 || vDist > 150. || (vDist > 60. && (vInfo.z < 0.36 || vInfo.z > 0.9))) discard; gl_FragColor = vec4(0.); }`;   // (not at the wave's two ends from 60 m out, where the colour passes melt it into the swell)
// THE FINGERS of the lip: round ligaments of glass (their own tubes, built at their T 26 length). Each leaves the rim
// as a flat web, necks down to a string, carries one or two small beads along it and ends in a hanging drop. They ride
// the lip's creep and are drawn out by the clock (aC, the centre line, is scaled; beads keep their shape). Every one
// is a lens: the slot is a lemon line inside it, the sea a dark cap, the leader a glint.
const FINGER_VERT = /* glsl */`
  attribute vec3 aC; attribute vec4 aRing; attribute vec4 aFi; attribute vec2 aTau;   // aC: centre line from the root; aRing: radial offset, feature radius; aFi: lip direction xz, creep share, along-crest; aTau: 0..1 along, kind (0 web root .. 1 string .. 2 bead)
  uniform float uTime, uT, uResY;
  varying vec3 vW; varying vec3 vN; varying float vDist; varying float vA; varying vec2 vTau;
  void main() {
    float g = 0.7 + 0.46 * uT / 40. + 0.03 * sin(uTime * 0.8 + aFi.w * 90.);
    vec3 p = position + aC * (g - 1.);
    p.xz += aFi.xy * aFi.z * (0.3 + 1.2 * uT / 40. + 0.12 * sin(uTime * 0.6 + aFi.w * 40.));
    float reach = length(aC);
    p.xz += vec2(aFi.y, -aFi.x) * 0.035 * reach * sin(uTime * 0.55 + aFi.w * 200.);     // the strings sway a little
    p.y += 0.02 * reach * sin(uTime * 0.4 + aFi.w * 130.);
    vec4 wp = modelMatrix * vec4(p, 1.);
    vec4 mv = viewMatrix * wp; float dist = max(length(mv.xyz), 0.3), px = uResY * projectionMatrix[1][1] * 0.5 / dist;
    float grow = max(1., 0.75 / max(aRing.w * px, 1e-4));      // a string never under a pixel and a half: widened and thinned instead
    wp.xyz += mat3(modelMatrix) * aRing.xyz * (grow - 1.);
    vA = 1. / grow; vTau = aTau;
    vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
    mv = viewMatrix * wp; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
  }`;
const FINGER_FRAG = FOGF + /* glsl */`
  uniform vec3 uCloudC, uBandC, uRimC, uSeaC, uViolet, uGlowC, uKey, uCam; uniform float uBandAmt, uKeyI, uStroke; uniform vec2 uBandDir;` + LENS_ENV + /* glsl */`
  varying vec3 vW; varying vec3 vN; varying float vDist; varying float vA; varying vec2 vTau;
  void main() {
    vec3 rw = normalize(vW - uCam + vec3(0., 1e-5, 0.)), n = normalize(vN);
    if (dot(n, rw) > 0.) n = -n;
    float ndv = clamp(dot(n, -rw), 0., 1.), rim = (1. - ndv) * (1. - ndv);
    // a lens: refract in, cross, refract out (what is behind comes out upside down and reversed)
    vec3 r1 = refract(rw, n, 0.75);
    vec3 p2 = n - 2. * dot(r1, n) * r1;
    vec3 outd = refract(r1, -p2, 1.333);
    if (dot(outd, outd) < 1e-4) outd = reflect(r1, -p2);
    outd = normalize(outd + vec3(0., 1e-5, 0.));
    vec3 refl = reflect(rw, n);
    float F = 0.03 + 0.97 * rim * rim;
    vec3 l = uKey - vW; float ld = max(length(l), 1e-3); l /= ld;
    float ki = uKeyI * (1. + 1.4 * uStroke) * 140. / (140. + ld);
    float web = clamp(1. - vTau.y, 0., 1.), bead = clamp(vTau.y - 1., 0., 1.), str = (1. - web) * (1. - bead);   // the flat root (still part of the sheet), the string, the drops
    float toSlot = max(dot(rw.xz, uBandDir), 0.);
    vec3 teal = vec3(0.016, 0.13, 0.115) + uSeaC * 0.7, lit = uRimC * max(min(uBandAmt, 1.), 0.75);   // the slot's colour, or at night the violet that rims the crests
    vec3 col = (envSky(outd) * vec3(0.86, 1., 0.95) * (1. - F) + envSky(refl) * F) * mix(1., 0.3, web);
    col += teal * (0.2 + 0.8 * web) * (0.4 + 0.6 * ndv);                      // the water's own colour: the web is the lip's dark glass
    col *= 1. - 0.3 * bead * ndv * ndv;                                       // a drop has a dark heart, so its rim and the slot's line read
    col *= mix(1., 0.5 + 0.5 * ndv, str);                                     // a string is dark at its edges ...
    float r2 = rim * rim;
    // ... with the light of the slot piped down its middle and the leader as one bright line along it
    col += (lit * (0.3 + 0.7 * toSlot) * 0.2 + uViolet * ki * 0.25) * ndv * ndv * str;
    col += uGlowC * ki * pow(max(ndv, 0.), 24.) * 0.5 * str;
    col += lit * (0.35 + 0.65 * toSlot) * r2 * web * 0.6;
    col += uGlowC * ki * (pow(max(dot(refl, l), 0.), 90.) * 3.2 + pow(max(dot(outd, l), 0.), 60.) * 0.9);   // the leader: a glint and a caustic heart
    col += uViolet * ki * rim * (0.25 + max(dot(n, l), 0.)) * 0.7 + uCloudC * r2 * 1.6;
    col += lit * mix(r2, rim, bead) * max(-dot(n.xz, uBandDir) * 0.5 + 0.55, 0.) * 1.0;     // the slot's edge on the side that faces it
    float a = vA * mix(0.62, 0.97, smoothstep(0.1, 0.8, vTau.y)) * smoothstep(0., 0.16, ndv + 0.06);
    gl_FragColor = vec4(wfog(max(col, 0.), vDist), a);
  }`;

// violet light thrown by the low live tips (uPool: xyz = tip, w = strength): a glow in the haze decks (poolInAir) and a
// pool of light lying on the sea under each tip (the POOL mesh below)
const POOLS = /* glsl */`
  uniform vec4 uPool[6];
  float poolInAir(vec3 w) {
    float s = 0.;
    for (int i = 0; i < 6; i++) { vec4 q = uPool[i]; vec3 d = w - q.xyz; s += q.w * 3600. / (3600. + dot(d, d)); }
    return s;
  }`;
// the long swell as it is laid on the sea from height: x = phase across one swell (0.5 = crest line), y = crest id,
// z = how much of a crest there is at this point along it, w = 0 in the trough .. 1 on the crest. Nothing is ruled:
// the crest lines are bowed and shoved about by up to 30 m, every crest stands at its own place in its cell (so the
// gaps run from 50 to 115 m), each is three or four separate lengths, and one crest in three never stands up at all.
const SEA_RULE = /* glsl */`
  vec4 seaRule(vec2 p, float t) {
    float warp = (fbm(p * 0.0021 + 3.1) - 0.5) * 165. + (vnoise(p * 0.0046 + 9.3) - 0.5) * 60. + (vnoise(p * 0.012 + 1.7) - 0.5) * 12.;
    float ph = (p.y + warp + t * 0.3) / 82., f = fract(ph), id = floor(ph);
    float h = hash12(vec2(id * 0.731 + 3.1, 7.7)), c = 0.3 + 0.4 * fract(h * 7.31);
    f = f < c ? 0.5 * f / c : 0.5 + 0.5 * (f - c) / (1. - c);
    float amp = smoothstep(0.34, 0.6, vnoise(vec2(p.x * 0.0072 + id * 3.7, id * 1.3))) * step(0.34, h);
    return vec4(f, id, amp, 1. - abs(f - 0.5) * 2.);
  }`;
// POOLS OF LIGHT: six additive quads lying just above the sea, one under each low tip. A soft violet disc with a
// hot heart, brightest on the crests and the foam and broken by a fine glitter, so it reads as light ON ruled water.
// It narrows and brightens as its tip comes down. Seen from height only (uPoolK fades it out below 40 m).
const POOL_VERT = /* glsl */`
  attribute float aIdx; uniform vec4 uPool[6];
  varying vec3 vW; varying vec4 vQ;
  void main() {
    vec4 q = uPool[int(aIdx + 0.5)];
    float r = 9. + 0.42 * max(q.y, 10.);
    vec3 wp = vec3(q.x + position.x * r * 2.5, position.y, q.z + position.z * r * 2.5);
    vW = wp; vQ = vec4(position.xz * 2.5, q.w * 60. / (60. + max(q.y, 10.)), r);
    gl_Position = q.w <= 0.002 ? vec4(2., 2., 2., 1.) : projectionMatrix * viewMatrix * vec4(wp, 1.);
  }`;
const POOL_FRAG = fx.GLSL_NOISE + SEA_RULE + /* glsl */`
  uniform vec3 uViolet, uGlowC, uCam; uniform float uTime, uStroke, uPoolK, uFogD, uResY;
  varying vec3 vW; varying vec4 vQ;
  void main() {
    float d2 = dot(vQ.xy, vQ.xy);
    float I = vQ.z * (exp(-d2) * 0.7 + exp(-d2 * 7.) * 1.1) * (1. - smoothstep(4.4, 6.2, d2));
    vec2 p = vW.xz; vec4 sr = seaRule(p, uTime);
    float dist = distance(uCam, vW), fp = dist * 1.25 / max(uResY, 1.);
    float crest = sr.w * sr.w * (3. - 2. * sr.w) * (0.4 + 0.6 * sr.z);
    float glit = smoothstep(0.5, 0.8, fbmLo(vec2(p.x * 0.13, p.y * 0.55) + uTime * 0.05)) * (1. - smoothstep(0.5, 2.2, fp));
    float lace = smoothstep(0.5, 0.56, sr.x) * (1. - smoothstep(0.6, 0.9, sr.x)) * sr.z * smoothstep(0.42, 0.7, fbmLo(vec2(p.x * 0.085 + sr.y * 4.3, (sr.x - 0.5) * 3.7 + sr.y * 1.9)));
    float lit = 0.42 + 0.75 * crest + 0.7 * glit + 0.5 * lace;
    vec3 col = (uViolet * 0.8 + uGlowC * 0.2) * I * lit * (1. + 1.4 * uStroke) * uPoolK;
    float fq = uFogD * dist; col *= exp(-fq * fq);
    gl_FragColor = vec4(max(col, 0.), 1.);
  }`;

// THE SEA FROM HEIGHT. Above about 130 m the kit ocean breaks into pixel noise, so the dive looks down on this instead:
// one disc that follows the camera. A storm sea read from 300-600 m: NEAR-BLACK SLATE-TEAL WATER whose structure is
// carried by its foam, not by its tone. The long swell (SEA_RULE) is only a breath of light on the backs of its broken
// lengths; two shorter trains cross it, each strong in its own patches, so the floor is facets and never a ruled sheet;
// WHITE CAPS are short (6-14 m of crest, a sharp front and a torn tail) and come in groups, the brightest things on the
// floor; broad squall shadows; ONE GLITTER ROAD, the slot's light broken into glints, runs from under the camera
// toward the slot (uRoadDir) and is the only cold light on the water; THE SCHOONER'S SIGN (foam skirt, long wake,
// lamp amber, and the ship limb's violet light lying on the sea round her) and THE BREAKER'S SIGN (the whitewater of
// its broken shoulder, a dark trough under its face) let both be found from the top of the dive. The violet pools
// under the low tips are the POOL mesh, drawn over it. It fades out (uHigh) through the last 60 m of the dive, where
// the real ocean takes over.
const HSEA_VERT = /* glsl */`
  varying vec3 vW;
  void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const HSEA_FRAG = fx.GLSL_NOISE + FOGF + SEA_RULE + BAND_GLSL + /* glsl */`
  uniform vec3 uCloudC, uBandC, uRimC, uSeaC, uViolet, uGlowC, uCam, uKey, uShipLit, uRoadC, uFarSea; uniform float uBandAmt, uTime, uHigh, uResY, uStroke, uKeyI, uSeaLift, uLitK, uSeaAmb; uniform vec2 uBandDir, uRoadDir; uniform vec4 uPool[6];
  varying vec3 vW;
  void main() {
    vec3 tv = vW - uCam; float dist = max(length(tv), 1.); vec3 v = tv / dist;
    vec2 p = vW.xz;
    float hl = max(length(v.xz), 1e-3), el = v.y / hl; vec2 hz = v.xz / hl;
    float fp = dist * 1.25 / max(uResY, 1.);                             // metres per pixel across the view
    float fpz = fp * mix(1., 1. / max(-v.y, 0.06), abs(v.z) / hl);       // and along Z, across the crests
    float fpm = fp / max(-v.y, 0.08);                                    // the long side of a pixel's footprint on the water
    vec4 sr = seaRule(p, uTime);
    float f = sr.x, id = sr.y, amp = sr.z, tri = sr.w;                   // each crest is a length, not a line across the world
    // THE RANK: a third of a kilometre west of the schooner four or five crests in a row stand right up and break along
    // most of their length: a rank of long white breakers, the one large lit subject on the floor of the dive (it lies
    // under the corona in the look at the schooner, along the foot of the frame in the look at the slot)
    vec2 qk = p - vec2(-20., -350.);
    float rank = smoothstep(0.22, 0.6, exp(-(qk.x * qk.x / 150000. + qk.y * qk.y / 36000.)) * (0.7 + 0.6 * fbmLo(p * 0.0045 + 41.)));
    amp = max(amp, rank * 0.95);
    float melt = 1. - smoothstep(0.1, 0.45, fpz / 82.);                  // far off the swell melts into tone
    float crest = tri * tri * (3. - 2. * tri);
    float grain = fbm(vec2(p.x * 0.011, p.y * 0.034) + 5.);              // wind-drawn
    float gk = 1. - smoothstep(1.5, 9., fp);
    float near = 1. - smoothstep(0.35, 1.6, fp);
    float chopN = fbmLo(vec2(p.x * 0.085 + grain * 2., p.y * 0.4) + 2.3);   // short chop drawn out along the wind, close to
    // squall shadow and rain-beaten light: two or three broad tones across the view
    float squall = fbm(p * 0.0012 + vec2(3.7, 1.1 + uTime * 0.002));
    float tone = 0.7 + 0.55 * smoothstep(0.25, 0.75, squall);
    // two shorter trains crossing the swell (36 m at +24 degrees, 63 m at -20), each strong in its own patches
    vec2 dA = vec2(0.407, 0.914), dB = vec2(-0.342, 0.94);
    float wA = (fbmLo(p * 0.006 + 11.) - 0.5) * 30., wB = (fbmLo(p * 0.0045 + 4.) - 0.5) * 44.;
    float sA = sin((dot(p, dA) + wA + uTime * 0.2) * 0.1745), sB = sin((dot(p, dB) + wB - uTime * 0.15) * 0.0997);
    float patchK = smoothstep(0.3, 0.7, fbmLo(p * 0.0031 + 17.));
    float kA = 1. - smoothstep(0.08, 0.4, fpm / 36.), kB = 1. - smoothstep(0.08, 0.4, fpm / 63.);
    float facet = sA * kA * (0.3 + 0.7 * patchK) + sB * kB * (1. - 0.7 * patchK);
    float swell = (crest - 0.45) * amp * melt;                           // the back of a length of swell: a breath lighter, no more
    float sl0 = dot(uSeaC, vec3(0.2126, 0.7152, 0.0722));                // every mood's sea is held to the same near-black, and a third of the way from its own hue to slate
    vec3 seaC = uSeaC * min(1., 0.02 / max(sl0, 1e-3)); seaC = mix(seaC, min(sl0, 0.02) * vec3(0.8, 1., 1.2), 0.3);
    vec3 body = (seaC * 1.2 + uCloudC * 0.05) * uSeaLift * tone * (0.85 + 0.3 * swell + 0.15 * facet) * mix(1., 0.8 + 0.4 * grain, gk) * (1. + 0.4 * (chopN - 0.5) * near);
    body += uRimC * uBandAmt * 0.03 * smoothstep(0.56, 0.8, chopN) * near;   // close to, the chop's west faces catch the slot
    float w = max(0.012, 1.3 * fpz / 82.), rx = (f - 0.462) / w;
    float rim = exp(-rx * rx) * min(1., 0.03 / w) * smoothstep(0.42, 0.8, amp) * (0.2 + 0.8 * smoothstep(0.3, 0.68, vnoise(vec2(p.x * 0.012 + id * 2.1, id * 7.7))));   // THE BRIEF'S LEMON RIM: thin and cold, on every length of crest that stands up
    // WHITE CAPS: short, in groups. Each is 8-14 m of crest that has broken, longer than it is deep: a sharp front
    // and a torn tail a few metres behind it. Past the point where one is smaller than a pixel they join the tone of their group.
    float grp = max(smoothstep(0.4, 0.62, fbmLo(p * 0.0043 + 21.)), rank);
    float lz = (f - 0.5) * 82.;                                          // metres behind the crest
    float seg = max(smoothstep(0.55, 0.66, vnoise(vec2(p.x * 0.034 + id * 9.1, id * 5.3))), rank * smoothstep(0.25, 0.4, vnoise(vec2(p.x * 0.011 + id * 9.1, id * 5.3))));   // 8-14 m of crest in every 30 (in the rank: lengths of 60-150 m)
    float brk = smoothstep(0.45, 0.8, amp) * grp;
    float wpx = max(1.1, 1.3 * fpz);
    float lc = lz - (vnoise(vec2(p.x * 0.021 + id * 5.7, id * 2.9)) - 0.5) * 18.;   // each breaks at its own place, ahead of or behind the crest line: never beads on one thread
    float tear = 0.55 + 0.9 * vnoise(vec2(p.x * 0.31 + id * 3.3, lc * 0.3));
    float capS = smoothstep(-wpx, 0., lc + 0.5) * exp(-max(lc, 0.) / ((1.6 + 4. * brk + 2.5 * rank) * tear + wpx)) * seg * brk;
    float capK = 1. - smoothstep(4., 14., fpm);
    float cap = mix((0.16 + 0.2 * rank) * brk * exp(-lz * lz / (500. - 380. * rank)), capS, capK);
    float lace = smoothstep(0.44, 0.7, fbm(vec2(p.x * 0.085 + id * 4.3, lz * 0.045 + id * 1.9)));
    lace *= 0.35 + 0.65 * smoothstep(0.3, 0.62, vnoise(vec2(p.x * 0.33, lz * 0.16 + id)));   // veined, never a white sheet
    lace *= smoothstep(0.5, 0.53, f) * (1. - smoothstep(0.62, 0.92, f)) * amp * (0.25 + 0.75 * grp) * (0.35 + 0.65 * melt) * (1. + 0.7 * rank);   // (the rank trails its torn foam down the back of every crest)
    // and the crossing train's own caps: short streaks along the wind, inside the same groups
    float wc = smoothstep(0.72, 0.97, sA) * smoothstep(0.55, 0.78, fbmLo(vec2(p.x * 0.05 + 3., p.y * 0.16))) * grp * (1. - smoothstep(0.6, 3.5, fp));
    vec3 foamC = uCloudC * 3.2 + uRimC * uBandAmt * 0.1;
    float foam = clamp(cap * 1.05 + lace * 0.6 + wc * 0.9, 0., 0.95);
    // THE LEADER'S LIGHT ON THE SEA (the brief's key light, seen from height). Every low tip (uPool: trunk, dive limbs,
    // the key) throws a wide pool, wider the higher it hangs, falling off over a few hundred metres. In it
    // the water takes its own lit colour, teal, and the swell is modelled: the light rakes it from the tip's side, so
    // the faces of the swell and of the two crossing trains that look at the tip are bright (violet-white at their
    // brightest) and the far faces stay deep teal; foam in the pool goes violet-white. Beyond it the sea is dark teal.
    float dcr = (f < 0.5 ? 1. : -1.) * 2.4 * tri * tri * tri * (0.3 + 0.7 * smoothstep(0.25, 0.7, vnoise(vec2(p.x * 0.019 + id * 3.1, id * 1.7))));   // steep at the crest, level in the trough, and broken along it
    vec2 gH = vec2(0., dcr * amp * melt * 0.6) + dA * cos((dot(p, dA) + wA + uTime * 0.2) * 0.1745) * kA * (0.3 + 0.7 * patchK) * 0.24
            + dB * cos((dot(p, dB) + wB - uTime * 0.15) * 0.0997) * kB * (1. - 0.7 * patchK) * 0.3 + (vec2(chopN, grain) - 0.5) * (0.25 * gk + 0.6 * near);
    gH += (vec2(fbmLo(vec2(p.x * 0.013, p.y * 0.031) + 61.), fbmLo(vec2(p.x * 0.013, p.y * 0.031) + 87.)) - 0.5) * 0.9 * (1. - smoothstep(2.5, 9., fpm));   // hummocks 40-80 m across, longer along the crests: the pool lies on a heaving floor, not on ruled lines
    float Es = 0.; vec3 Lv = vec3(0., 1e-3, 0.);
    for (int i = 0; i < 6; i++) {
      vec4 q = uPool[i]; vec2 dl = q.xz - p; float S = 180. + 0.75 * q.y, e = S * S / (S * S + dot(dl, dl)); e = q.w * e * sqrt(max(e, 0.));
      Es += e; Lv += e * vec3(dl.x, 0.45 * max(q.y, 30.) + 40., dl.y) / (S + length(dl));
    }
    Lv = normalize(Lv); Es = Es / (1. + 0.6 * Es) * (1. + uStroke) * (0.7 + 0.6 * squall);   // (broken by the squalls' rain)
    float shade = clamp(0.13 + 0.33 * Lv.y - 1.6 * dot(gH, Lv.xz), 0.04, 1.9);
    vec3 litC = mix(vec3(0.016, 0.105, 0.115), uSeaC * (0.085 / max(sl0, 1e-3)), 0.25) * uLitK, keyC = uViolet * 0.55 + uGlowC * 0.45;
    body += (litC * shade + keyC * 0.035 * shade * shade * shade) * Es * (0.75 + 0.35 * tone);
    body += litC * 0.2 * uSeaAmb * tone * (0.8 + 0.5 * swell + 0.25 * facet);                 // and beyond every pool the water is still deep teal under the cloud's own light, its swell just visible: never black
    vec3 col = mix(body, foamC * (0.8 + 0.3 * tone) * (1. + 0.5 * capS) + keyC * Es * (0.14 + 0.26 * shade) * (1. + 0.8 * rank), foam);   // a breaking front is the whitest thing on the floor, and the rank takes the leader's violet-white
    col += uRimC * uBandAmt * rim * 0.3;
    // THE GLITTER ROAD: the slot's light on the water, from under the camera out toward the slot. Glints drawn out
    // along the crests where a pixel can hold them, a steady sheen beyond; broad, cold, and nowhere else on the sea
    float rd = max(dot(hz, uRoadDir), 0.), rd2 = rd * rd, rd4 = rd2 * rd2; rd = rd4 * rd4 * rd2; rd *= rd;   // one tapering road, a third of the frame wide
    rd *= 0.55 + 0.45 * smoothstep(0.3, 0.7, fbmLo(p * 0.004 + 31.));   // ragged along its edges
    float spk = fbmLo(vec2(p.x * 0.1 + grain * 3., p.y * 0.38) + uTime * 0.05);
    float sk = 1. - smoothstep(1.5, 7., fpm);
    float glit = mix(0.3, 0.16 + smoothstep(0.58, 0.7, spk) * 1.7 * (0.6 + 0.4 * sA), sk) * (0.2 + 0.9 * crest * amp);   // bunched on the backs of the swell, dark water between
    float graze = 1. - clamp(-v.y, 0., 1.); graze = 0.6 + 1.1 * graze * graze * graze;
    col += uRoadC * uBandAmt * rd * glit * graze * 2.4 * (0.5 + 0.5 * tone);
    // the schooner's sign (she lies at the origin, bow to +X): a foam skirt round the hull, the wake astern, lamp
    // amber, and the violet of the ship limb, which is feeling its way down to her, lying on the water round her
    vec2 q = p - vec2(-10., 2.); float aft = -q.x - 18.;
    float skirt = exp(-(q.x * q.x / 600. + q.y * q.y / 42.)) * (0.5 + 0.5 * fbmLo(p * 0.4));
    float ww = 5. + 0.06 * max(aft, 0.), wk = smoothstep(-4., 14., aft) * exp(-max(aft, 0.) / 130.);
    float wake = wk * exp(-q.y * q.y / (ww * ww)) * (0.35 + 0.65 * fbmLo(vec2(p.x * 0.11, p.y * 0.3) + 3.));
    float ax = (abs(q.y) - 0.28 * max(aft, 0.) - 3.) / (2.2 + 0.02 * max(aft, 0.) + 2. * fp), arm = wk * exp(-max(aft, 0.) / 70.) * exp(-ax * ax) * 0.6;
    float shipK = 1. - smoothstep(4., 12., fp);
    col = mix(col, foamC * 1.1, clamp((skirt * 0.8 + wake * 0.85 + arm * 0.5) * shipK, 0., 0.9));
    col += vec3(1., 0.62, 0.3) * 0.2 * exp(-dot(q, q) / 1500.) * shipK;
    vec2 qs = p - uShipLit.xy; float sl = exp(-dot(qs, qs) / 16000.) + 0.5 * exp(-dot(qs, qs) / 2500.);
    col += (uViolet * 0.8 + uGlowC * 0.2) * uShipLit.z * sl * (0.35 + 0.8 * crest * amp + 1.6 * foam + 0.5 * smoothstep(0.55, 0.72, spk) * sk) * (1. + uStroke);
    // the breaker's sign: the whitewater of its broken shoulder running off to the south, the dark trough under its face
    vec2 qb = p - vec2(-28., 223. + 0.0004 * (p.x + 28.) * (p.x + 28.));
    float along = -qb.x, shK = smoothstep(-6., 10., along) * exp(-max(along, 0.) / 95.);
    float shW = 4. + 0.07 * max(along, 0.) + 1.5 * fpz, sh = shK * exp(-qb.y * qb.y / (shW * shW)) * (0.3 + 0.7 * smoothstep(0.3, 0.6, fbmLo(vec2(p.x * 0.12, p.y * 0.35) + 9.)));
    float sh2 = shK * (1. - smoothstep(-3., 0., qb.y)) * exp(min(qb.y, 0.) / (14. + 0.1 * max(along, 0.))) * smoothstep(0.42, 0.7, fbmLo(vec2(p.x * 0.07, p.y * 0.2) + 5.)) * 0.6;   // foam left behind it, torn into lace
    col = mix(col, foamC * 1.1, clamp((sh + sh2) * shipK, 0., 0.9));
    vec2 qt = p - vec2(4., 236.); col *= 1. - 0.45 * exp(-(qt.x * qt.x / 1500. + qt.y * qt.y / 110.)) * shipK;
    // the leader's own light on the water under its nearest tip (the violet pools are drawn over this)
    vec3 kd = uKey - vW; col += uViolet * uKeyI * (1. + uStroke) * 0.05 * 9000. / (9000. + dot(kd, kd)) * (0.5 + crest * amp + foam);
    // pocked by the rain, close to: soft rings walking outward in 7 m cells (never finer than a pixel and a half)
    vec2 pc = p / 7., ci = floor(pc), cf = fract(pc) - 0.5 - (hash22(ci) - 0.5) * 0.5;
    float pg = fract(hash12(ci + 7.7) + uTime * 0.09), pw = max(0.035, 1.6 * fp / 7.), pr = (length(cf) - (0.05 + 0.22 * pg)) / pw;
    float pk = exp(-pr * pr) * (1. - pg) * step(0.4, hash12(ci + 3.1)) * min(1., 0.035 / pw) * (1. - smoothstep(0.15, 0.5, fp));
    col += foamC * 0.3 * pk;
    col = wfog(col, dist * mix(1., 0.62, smoothstep(90., 380., uCam.y)));   // from height the floor keeps its shapes through the murk, as the ceiling does
    vec4 slt = slotAt(hz, uBandDir, uTime); float dnH = max(-el, 0.);
    col = mix(col, uFarSea * farTone(p, dnH), smoothstep(1500., 3100., dist));      // (the dome carries the far sea on from here: the same tone, lanes and sheen)
    col += uBandC * uBandAmt * slotSheen(slt, slotAz(hz, uBandDir), dnH, uResY) * smoothstep(30., 150., uCam.y);
    gl_FragColor = vec4(max(col, 0.), uHigh);
  }`;

// HAZE DECKS: ragged sheets of rain murk at three heights, seen only from above, so that in the dive the limbs
// have soft tone to stand in front of. They follow the camera in xz; the pattern is fixed in the world.
const DECK_VERT = /* glsl */`
  attribute float aLayer; uniform vec3 uCam;
  varying vec3 vW; varying float vFade; varying float vSeed;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vSeed = aLayer;
    vFade = smoothstep(25., 170., uCam.y - wp.y);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const DECK_FRAG = fx.GLSL_NOISE + FOGF + POOLS + /* glsl */`
  uniform vec3 uCloudC, uBandC, uSeaC, uViolet, uCam; uniform float uBandAmt, uTime, uStroke; uniform vec2 uBandDir;
  varying vec3 vW; varying float vFade; varying float vSeed;
  void main() {
    if (vFade < 0.004) discard;
    vec2 p = vW.xz + vSeed * 517.3, dr = vec2(uTime * 0.9, -uTime * 0.5);
    float n = fbm((p + dr) * 0.0042), n2 = fbm((p - dr * 1.6) * 0.017 + 9.);
    float a = smoothstep(0.47, 0.76, n + (n2 - 0.5) * 0.4);
    float e = fbm((p + dr + uBandDir * 40.) * 0.0042) - n;               // the flank that faces the slot
    vec3 col = mix(uFogC * 1.2, uCloudC * 1.3 + uSeaC * 0.6, n2);
    col += uBandC * uBandAmt * clamp(-e * 6., 0., 1.) * 0.2;
    col += uViolet * min(poolInAir(vW), 1.2) * 0.11 * (1. + 1.2 * uStroke);
    col = wfog(col, length(vW - uCam) * 0.7);
    float rad = 1. - smoothstep(700., 1450., length(vW.xz - uCam.xz));
    gl_FragColor = vec4(max(col, 0.), a * 0.14 * vFade * rad);                 // a breath of murk over the dark floor, never a pale blob
  }`;

// ring-and-crater decals: where a drop has just landed, lying on the swell (instanced quads tilted to the slope)
const DECAL_VERT = /* glsl */`
  attribute vec3 iPos; attribute vec4 iParm; attribute vec2 iSlope;      // iParm: radius, phase, rate, seed
  uniform float uTime;
  varying vec2 vQ; varying float vG; varying float vDist; varying vec3 vW; varying float vPx;
  void main() {
    vG = fract(uTime * iParm.z + iParm.y);
    vec3 t1 = normalize(vec3(1., iSlope.x, 0.)), t2 = normalize(vec3(0., iSlope.y, 1.));
    vec3 wp = iPos + (t1 * position.x + t2 * position.y) * iParm.x;
    vQ = position.xy; vW = wp;
    vec4 mv = viewMatrix * vec4(wp, 1.); vDist = length(mv.xyz); vPx = iParm.x / max(vDist, 0.3);
    gl_Position = projectionMatrix * mv;
  }`;
const DECAL_FRAG = FOGF + /* glsl */`
  uniform vec3 uCloudC, uBandC, uSeaC, uViolet, uKey; uniform float uBandAmt, uKeyI; uniform vec2 uBandDir;
  varying vec2 vQ; varying float vG; varying float vDist; varying vec3 vW; varying float vPx;
  void main() {
    float r = length(vQ); if (r > 1.) discard;
    float g = vG, R = mix(0.14, 0.9, sqrt(max(g, 0.)));                           // the ring walks outward
    float life = smoothstep(0., 0.08, g) * (1. - smoothstep(0.5, 1., g)) * smoothstep(0.003, 0.009, vPx);
    float w = 0.05 + 0.05 * g, d1 = (r - R) / w, d2 = (r - R * 0.55) / w;
    float ring = exp(-d1 * d1) + 0.5 * exp(-d2 * d2);
    float crater = (1. - smoothstep(0., 0.16 + 0.1 * g, r)) * (1. - smoothstep(0.15, 0.6, g));
    vec2 dn = vQ / max(r, 1e-3);
    float lit = 0.5 + 0.5 * dot(dn, uBandDir);                           // the flank of the ring that faces the slot
    vec3 light = uCloudC * 1.1 + uBandC * uBandAmt * 0.8 * smoothstep(0.35, 1., lit) + uViolet * uKeyI * 0.3 * 120. / (120. + distance(uKey, vW));
    float al = ring * life * 0.5, ad = (crater * 0.65 + ring * 0.3 * (1. - lit)) * life;
    float a = clamp(al * 0.6 + ad, 0., 0.92);
    vec3 col = light * al + uSeaC * 0.35 * ad;
    float fq = uFogD * vDist, ft = exp(-fq * fq);
    gl_FragColor = vec4(max(mix(uFogC * a, col, ft), 0.), a);
  }`;

// THE SCHOONER ON THE WATER, seen from the skim and the climb (below 40 m the sea from height and its ship sign are
// gone): one small mesh. A flat sheet lying on the sea round her (aQ.z 0: a ring of foam round the hull, the wake
// astern, and each porthole's lamp drawn out toward us as a broken amber smear) and a ribbon standing round the hull
// at the waterline (aQ.z 1: foam climbing her side, torn along its top), so that black hull on black sea has an edge.
const SKIRT_VERT = /* glsl */`
  attribute vec3 aQ;                                                     // ribbon: metres round the hull, 0 foot .. 1 top, 1;  sheet: 0, 0, 0
  varying vec3 vW; varying vec3 vQ; varying float vDist;
  void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vQ = aQ; vec4 mv = viewMatrix * wp; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`;
const SKIRT_FRAG = fx.GLSL_NOISE + FOGF + /* glsl */`
  uniform vec3 uCloudC, uRimC, uViolet; uniform float uBandAmt, uTime, uHigh, uKeyI, uStroke;
  varying vec3 vW; varying vec3 vQ; varying float vDist;
  void main() {
    vec3 foamC = uCloudC * 2.4 + uRimC * uBandAmt * 0.14 + uViolet * uKeyI * 0.12 * (1. + uStroke);
    float a = 0., lamp = 0.;
    if (vQ.z > 0.5) {
      float top = 0.3 + 0.65 * fbmLo(vec2(vQ.x * 0.7, uTime * 0.05));
      a = (1. - smoothstep(top * 0.45, top, vQ.y)) * smoothstep(0., 0.1, vQ.y) * (0.5 + 0.5 * fbmLo(vec2(vQ.x * 2.3 + 5., vQ.y * 3. - uTime * 0.04))) * 0.85;
    } else {
      vec2 q = vW.xz - vec2(-10., 1.5);
      float e = sqrt(q.x * q.x / 470. + q.y * q.y / 30.), d1 = (e - 1.) * 3.;
      float skirt = exp(-d1 * d1) * (0.3 + 0.7 * fbmLo(vW.xz * 0.5 + uTime * 0.03));
      float aft = -q.x - 20., ww = 4. + 0.07 * max(aft, 0.), wk = smoothstep(-6., 8., aft) * exp(-max(aft, 0.) / 60.) * (1. - smoothstep(70., 100., aft));
      float wake = wk * exp(-q.y * q.y / (ww * ww)) * smoothstep(0.3, 0.62, fbmLo(vec2(vW.x * 0.16, vW.z * 0.45) + 3. - uTime * 0.02));
      a = clamp(skirt * 0.8 + wake * 0.75, 0., 0.9);
      float xi = (vW.x + 24.) / 4., ni = clamp(floor(xi + 0.5), 0., 7.), dx = (xi - ni) * 4., dz = max(vW.z - 4.4, 0.);
      lamp = exp(-dx * dx / (0.4 + 0.03 * dz * dz)) * smoothstep(3.6, 5., vW.z) * exp(-dz / 9.) * (1. - smoothstep(18., 26., dz));
      lamp *= 0.3 + 0.7 * smoothstep(0.3, 0.6, vnoise(vec2(vW.x * 1.3, vW.z * 0.8 - uTime * 0.25)));
    }
    float k = 1. - uHigh, fq = uFogD * vDist, ft = exp(-fq * fq);
    a *= k;
    gl_FragColor = vec4(max(mix(uFogC * a, foamC * a, ft) + vec3(1., 0.62, 0.3) * lamp * 1.1 * k * ft, 0.), a);
  }`;

// storm petrel: sooty feathers that keep a tone above black, lit by the cloud, rimmed by the slot, glinted by the leader.
// The wing carries its own chord and span coordinates (aF), so the shader lays the feathers on it: marginal coverts,
// the pale carpal bar of the greater coverts, a row of overlapping secondaries with dark seams and pale shafts, and a
// scalloped trailing edge cut by discard. The pattern melts away with distance.
const BIRD_VERT = /* glsl */`
  attribute vec2 aF;                                                     // wing: chord (0 leading edge .. 1 trailing), span (0 root .. 1 wrist tip, > 1 primaries); body: x < 0
  varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vDist; varying vec2 vF;
  void main() {
    mat4 m = modelMatrix * instanceMatrix;
    vec4 wp = m * vec4(position, 1.); vW = wp.xyz; vN = mat3(m) * normal; vC = color; vF = aF;
    vec4 mv = viewMatrix * wp; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
  }`;
const BIRD_FRAG = FOGF + /* glsl */`
  uniform vec3 uCloudC, uBandC, uSeaC, uViolet, uGlowC, uKey, uCam; uniform float uBandAmt, uKeyI, uStroke; uniform vec2 uBandDir;
  varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vDist; varying vec2 vF;
  void main() {
    float wing = step(0., vF.x), ch = clamp(vF.x, 0., 1.), sp = vF.y, fk = wing * (1. - smoothstep(3., 9., vDist)) * step(sp, 1.02);
    float fs = fract(sp * 13. + 0.5), tipC = 1. - 0.085 * (1. - sin(3.14159 * fs)) * fk;
    if (ch > tipC) discard;                                              // the secondaries' rounded tips
    vec3 n = normalize(vN + vec3(0., 1e-4, 0.)), v = normalize(uCam - vW + vec3(0., 1e-5, 0.));
    if (dot(n, v) < 0.) n = -n;
    float ndv = clamp(dot(n, v), 0., 1.), rim = (1. - ndv) * (1. - ndv);
    vec3 lb = normalize(vec3(uBandDir.x, 0.14, uBandDir.y));             // light from the slot, low in the west
    vec3 l = uKey - vW; float ld = max(length(l), 1e-3); l /= ld;
    float ki = uKeyI * (1. + 1.2 * uStroke) * 60. / (60. + ld);
    vec3 E = mix(uSeaC * 3., uCloudC * 4.5, 0.5 + 0.5 * n.y) + uBandC * uBandAmt * 1.3 * max(dot(n, lb), 0.) + uViolet * ki * 1.6 * max(dot(n, l), 0.);
    float white = smoothstep(0.2, 0.6, vC.r);                            // the rump
    float under = 1. - smoothstep(-0.35, 0.1, n.y);                           // the side that looks at the sea: a second, paler tone
    float wrap = dot(n, lb) * 0.5 + 0.5; wrap *= wrap;                   // the slot's light wraps round the bird
    vec3 alb = mix(vC * 0.85 + 0.035, vC * 0.6 + vec3(0.11, 0.1, 0.1), under * (1. - white));
    // feathers
    float seam = smoothstep(0., 0.14, fs) * (1. - smoothstep(0.84, 1., fs));    // dark where one feather lies on the next
    float sec = smoothstep(0.54, 0.58, ch), cov = smoothstep(0.3, 0.35, ch) * (1. - sec);
    float fsc = fract(sp * 21.), seamC = smoothstep(0., 0.2, fsc) * (1. - smoothstep(0.75, 1., fsc));
    float shade = mix(1., 0.55 + 0.45 * seam, sec) * mix(1., 0.72 + 0.28 * seamC, cov);
    shade *= 1. - 0.5 * smoothstep(0.54, 0.575, ch) * (1. - smoothstep(0.575, 0.68, ch));   // the coverts' shadow on the secondaries
    shade *= 1. - 0.28 * sec * smoothstep(0.6, 1., ch);                  // each secondary darkens toward its tip
    float shaft = (1. - smoothstep(0.03, 0.08, abs(fs - 0.5))) * sec;
    float bar = cov * (1. - smoothstep(0.5, 0.82, sp));                   // the pale carpal bar
    alb = mix(alb, (alb * shade + vec3(0.05, 0.045, 0.045) * shaft) + vec3(0.17, 0.15, 0.14) * bar * (0.55 + 0.45 * seamC), fk);
    vec3 col = alb * (E + uBandC * uBandAmt * 0.7 * wrap + uCloudC * 1.6 * under);
    col += uBandC * uBandAmt * rim * (0.3 + 0.7 * wrap) * 1.5 + uCloudC * rim * 0.6;   // lemon edge on the wing nearest the slot
    col += uBandC * uBandAmt * wing * (1. - smoothstep(0., 0.08, ch)) * (0.25 + 0.75 * wrap) * 0.55;   // and along the leading edge
    col += white * uBandC * uBandAmt * (0.5 + 0.5 * wrap) * 0.6 + uGlowC * ki * pow(max(dot(reflect(-v, n), l), 0.), 16.) * 0.35;
    gl_FragColor = vec4(wfog(max(col, 0.), vDist), 1.);
  }`;

// rigging: stays and shrouds as view-facing ribbons, never under 1.6 px wide, thinned in alpha instead
const RIG_VERT = /* glsl */`
  attribute vec3 aOther; attribute vec2 aCorner; uniform float uResY;
  varying float vA; varying float vDist;
  void main() {
    vec4 a = modelViewMatrix * vec4(position, 1.), b = modelViewMatrix * vec4(aOther, 1.);
    vec3 ax = b.xyz - a.xyz; float L = length(ax); ax = L > 1e-4 ? ax / L : vec3(0., 1., 0.);
    vec3 p = mix(a.xyz, b.xyz, aCorner.x);
    float dist = max(length(p), 0.3);
    vec3 sd = cross(ax, -p / dist); float sl = length(sd); sd = sl > 1e-4 ? sd / sl : vec3(1., 0., 0.);
    float pxPerM = uResY * projectionMatrix[1][1] * 0.5 / dist;
    float w = max(0.035, 0.8 / max(pxPerM, 1e-4));
    vA = clamp(0.035 / w, 0.3, 1.); vDist = dist;
    gl_Position = projectionMatrix * vec4(p + sd * aCorner.y * w, 1.);
  }`;
const RIG_FRAG = FOGF + /* glsl */`
  varying float vA; varying float vDist;
  void main() { gl_FragColor = vec4(wfog(vec3(0.011, 0.01, 0.012), vDist), vA * 0.92); }`;

// THE LEADER'S LIGHT ON THE KIT OCEAN (the sea of the pull-out, the skim and the climb). The kit's water takes no
// lights: it mirrors a sky, and under this sky that left it black between its glints. This is laid into the kit
// ocean's own fragment shader in build() (section b), so it is shaded with the ocean's own per-pixel normals, foam and
// fog. uSeaL: four lights (xyz, w strength): the key (nearest live tip), the ship limb's tip, the low limb's tip, the
// trunk's tip. Each gives the water (1) its lit body, deep teal, modelled by the slope of the swell: the faces that
// look at the tip are bright, the far faces stay deep teal; (2) a broken violet-white road of glints toward the tip
// (a Beckmann lobe on the ocean's rippled normal, as wide as the ocean says its unresolved chop is, held under 0.8);
// and over all of it (3) a teal floor that follows the height of the swell (shadows are deep teal, never black) and
// (4) the slot's colour (at night violet) as a thin rim on the crests' west faces, and (5) glints of it on the far water
// toward the west (a road under the slot's heart).
const SEA_LIGHT_GLSL = /* glsl */`
  uniform vec4 uSeaL[4]; uniform vec3 uLTeal, uLKeyC, uLRimC; uniform vec2 uLBandDir; uniform float uLAmb, uLStroke;
  vec3 leaderOnSea(vec3 P, vec3 N, vec3 V, float crest, float fa, float rough, float dist, float glit) {
    float body = 0., spec = 0., ndv = max(dot(N, V), 0.), fres = 1. - ndv; fres = 0.2 + 0.8 * fres * fres;
    float r = clamp(rough * 1.2 + 0.085, 0.085, 0.5), r2 = r * r;
    for (int i = 0; i < 4; i++) {
      vec4 q = uSeaL[i]; vec3 l = q.xyz - P; float d2 = dot(l, l), S = 120. + 0.8 * max(q.y, 0.);
      float e = q.w * S * S / (S * S + d2);
      l *= inversesqrt(max(d2, 1e-4));
      float ndl = dot(N, l);
      body += e * clamp(0.26 + 3.4 * (ndl - 0.8 * l.y), 0.05, 2.);
      vec3 h = l + V; h *= inversesqrt(max(dot(h, h), 1e-6));
      float ndh = max(dot(N, h), 0.), n2 = ndh * ndh, t2 = (1. - n2) / max(n2, 1e-3);
      spec += e * exp(-t2 / r2) / (r * 4.5) * step(0., ndl);
    }
    body = body / (1. + 0.45 * body) * (1. + uLStroke);
    float rim = smoothstep(0.14, 0.33, dot(N.xz, uLBandDir)) * crest * (0.35 + 0.65 * crest) * exp(-dist * 0.0045);   // (only where a west face is steep, 10 to 20 degrees: the shoulder of a crest. A thin rim, never a wash: from the skim every west face is seen edge-on)
    spec *= mix(1., 0.3 + 5. * glit, smoothstep(0.1, 0.24, r));                      // unresolved chop breaks the road into glitter (the kit's own)
    vec3 col = uLTeal * (uLAmb * (0.62 + 0.6 * crest) + 0.8 * body * (0.5 + 0.8 * crest)) * (1. - 0.55 * fa);   // (the troughs take half of it: the sea heaves; foam keeps the kit's own tone and takes little more)
    col += uLKeyC * (min(spec * fres, 0.8) * (1. - 0.6 * fa) + 0.04 * body * fa) * (1. + uLStroke);
    col += uLRimC * rim * 0.6;                                                       // THE BRIEF'S LEMON RIM on every crest that shoulders up toward the slot
    // (5) THE SLOT LYING ON THE FAR WATER: out toward the west, where the water is seen at a grazing angle, it mirrors
    // the slot: glints of its colour, a road of them (and a soft sheen under them) below the slot's heart and a thin
    // scatter either side, where the water between the glints stays teal; near the lens there is none of it
    vec2 hz = -V.xz * inversesqrt(max(dot(V.xz, V.xz), 1e-6));
    float ch = max(dot(hz, vec2(uLBandDir.x * 0.9856 + uLBandDir.y * 0.169, uLBandDir.y * 0.9856 - uLBandDir.x * 0.169)), 0.);
    float c2 = ch * ch, core = c2 * c2 * ch, h2 = core * core, h4 = h2 * h2, heart = h4 * h4 * h2;
    float gz = 1. - clamp(V.y, 0., 1.); gz *= gz; gz *= gz; gz *= gz;
    col += uLRimC * ((0.1 * core + 0.9 * heart) * (0.15 + 2.2 * smoothstep(0.05, 0.3, glit)) + 0.6 * heart) * gz * smoothstep(120., 500., dist) * 0.3 * (1. - fa);
    return col;
  }
  // ... laid over what the kit drew. Near the lens the kit's broad mirror of the slot (cream blotches, white by day) is
  // drawn in under a soft knee first, so the water there stays teal and the slot is glints on it; and where the kit's
  // water is already bright (foam, the glitter path) the leader adds little: nothing of the water burns out.
  vec3 leaderSeaMix(vec3 col, vec3 lit, float fa, float dist) {
    const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
    col *= 1. / (1. + 3. * max(dot(col, LW) - 0.08, 0.) * (1. - fa) * exp(-dist * 0.008));
    return col + lit * (1. - 0.85 * smoothstep(0.07, 0.35, dot(col, LW)));
  }
`;

// ---------------------------------------------------------------- 4. geometry helpers
function paint(g, hex) {
  if (g.index) g = g.toNonIndexed();
  const n = g.attributes.position.count, c = new Float32Array(n * 3), col = new THREE.Color(hex);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}
const _up = V3(0, 1, 0), _q = new THREE.Quaternion(), _m4 = new THREE.Matrix4();
function spar(a, b, r0, r1, hex, sides = 6) {
  const A = V3(...a), B = V3(...b), d = B.clone().sub(A), len = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, sides, 1);
  _q.setFromUnitVectors(_up, d.multiplyScalar(1 / len));
  g.applyMatrix4(_m4.compose(A.add(B).multiplyScalar(0.5), _q, V3(1, 1, 1)));
  return paint(g, hex);
}
function sheet(c00, c10, c11, c01, n, belly, hex) {          // bilinear patch with a belly toward +Z
  const pos = [], idx = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const u = i / n, v = j / n, w = Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.15 + 0.7 * v)) * belly;
    for (let k = 0; k < 3; k++) pos.push(lerp(lerp(c00[k], c10[k], u), lerp(c01[k], c11[k], u), v) + (k === 2 ? w : 0));
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i; idx.push(a, a + 1, a + n + 1, a + 1, a + n + 2, a + n + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return paint(g, hex);
}
const hullBeam = (s) => 3.7 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + 0.9 * s)), 0.6);
const hullSheer = (s) => 2.4 + 1.7 * s * s + 0.5 * (1 - s) * (1 - s);

// three-masted gaff schooner, 40 m on deck, local: waterline y 0, foremast foot at the origin, bow +X
async function shipGeometry(ctx) {                          // (yields between its parts: no rng in it)
  const P = [], N = 20, M = 8, pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N, x = -30 + 40 * s, bw = hullBeam(s), sh = hullSheer(s), kd = -3.2 * (1 - s * s * s * s);
    for (let j = 0; j <= M; j++) { const ph = Math.PI * j / M; pos.push(x, sh - (sh - kd) * Math.pow(Math.sin(ph), 0.7), bw * Math.cos(ph)); }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j; idx.push(a, a + 1, a + M + 1, a + 1, a + M + 2, a + M + 1); }
  const hull = new THREE.BufferGeometry(); hull.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hull.setIndex(idx); hull.computeVertexNormals();
  P.push(paint(hull, '#10141a'));
  const dk = [], di = [];
  for (let i = 0; i <= N; i++) { const s = i / N, x = -30 + 40 * s, bw = hullBeam(s) * 0.94, y = hullSheer(s) - 0.55; dk.push(x, y, bw, x, y, -bw); }
  for (let i = 0; i < N; i++) di.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  const deck = new THREE.BufferGeometry(); deck.setAttribute('position', new THREE.Float32BufferAttribute(dk, 3)); deck.setIndex(di); deck.computeVertexNormals();
  P.push(paint(deck, '#4a4234'));
  await ctx.yield();
  const wood = '#2b2118', dark = '#17130f', canvas = '#8f8876', rig = [];           // rig: pairs of end points for the ribbons
  const masts = [[0, 30], [-11, 30.5], [-22, 28]];
  for (const [x, h] of masts) {
    P.push(spar([x, 0, 0], [x, h, 0], 0.32, 0.13, wood, 7));
    P.push(spar([x, h * 0.74, -1.6], [x, h * 0.74, 1.6], 0.07, 0.07, dark, 4));                       // crosstrees
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const sx = x - 0.4 - k * 0.9, s = (sx + 30) / 40; rig.push([x, h * 0.74, sd * 0.2], [sx, hullSheer(s), sd * hullBeam(s)]); }
  }
  await ctx.yield();
  P.push(spar([8.5, 3.9, 0], [17.5, 6.2, 0], 0.24, 0.1, wood));                                        // bowsprit
  P.push(spar([0, 22, -3.2], [0, 22, 3.2], 0.12, 0.08, wood));                                         // fore yard
  P.push(spar([-0.4, 5.6, 0], [-9.6, 6.2, 0], 0.16, 0.13, wood), spar([-0.4, 14.2, 0], [-8.6, 16.8, 0], 0.13, 0.1, wood));
  P.push(spar([-11.4, 5.6, 0], [-21, 6.0, 0], 0.16, 0.13, wood), spar([-11.3, 6.1, 0], [-20.6, 6.5, 0], 0.36, 0.3, canvas, 7));   // furled main
  P.push(spar([-22.4, 5.4, 0], [-31.5, 5.9, 0], 0.15, 0.12, wood), spar([-22.3, 5.9, 0], [-31, 6.4, 0], 0.33, 0.27, canvas, 7));
  P.push(sheet([-0.6, 6.1, 0], [-9.2, 6.6, 0], [-8.3, 16.4, 0], [-0.6, 14, 0], 7, 1.0, canvas));       // reefed foresail
  P.push(sheet([2.4, 4.6, 0], [16.8, 6.1, 0], [0.5, 19.5, 0], [0.5, 19.5, 0], 6, 0.7, canvas));        // storm jib
  rig.push([17.5, 6.2, 0], [0, 29, 0], [0, 29.6, 0], [-11, 30.1, 0], [-11, 30.1, 0], [-22, 27.7, 0], [-22, 27.7, 0], [-30, 3.2, 0], [17.5, 6.2, 0], [0, 21.5, 0]);   // stays
  for (const [x, w] of [[-6, 4], [-17, 5.2], [-26.5, 2.4]]) { const b = new THREE.BoxGeometry(w, 1.5, 2.7); b.translate(x, hullSheer((x + 30) / 40) + 0.2, 0); P.push(paint(b, '#241f1a')); }
  await ctx.yield();
  const g = mergeGeometries(P, false); for (const p of P) p.dispose();
  await ctx.yield();
  // stays and shrouds: one quad per rope, widened in the vertex shader to hold 1.6 px (the thin-line rule)
  const n = rig.length / 2, rp = [], ro = [], rc = [], ri = [];
  for (let k = 0; k < n; k++) {
    const A = rig[k * 2], B = rig[k * 2 + 1];
    for (let c = 0; c < 4; c++) { rp.push(A[0], A[1], A[2]); ro.push(B[0], B[1], B[2]); rc.push(c >> 1, (c & 1) * 2 - 1); }
    ri.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 2, k * 4 + 1, k * 4 + 3);
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('aOther', new THREE.Float32BufferAttribute(ro, 3));
  rg.setAttribute('aCorner', new THREE.Float32BufferAttribute(rc, 2)); rg.setIndex(ri); rg.boundingSphere = new THREE.Sphere(V3(-8, 14, 0), 40);
  return { hull: g, rigging: rg };
}

// storm petrel: body (sooty, white rump, trailing feet) and one wing hinged at its root
async function birdParts(ctx) {
  const B = [];
  // body: a teardrop, deep in the chest and drawn out to the tail, not an egg
  const body = new THREE.SphereGeometry(1, 14, 10); { const bp = body.attributes.position; for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), k = x < 0 ? 1 - 0.55 * x * x : 1 - 0.18 * x * x, lift = x < 0 ? 0.25 * x * x : 0; bp.setXYZ(i, x * 0.088, (bp.getY(i) * k + lift) * 0.034 - (x > 0 ? 0.004 * x : 0), bp.getZ(i) * k * 0.039); } body.computeVertexNormals(); }
  await ctx.yield();
  B.push(paint(body, '#1d1b1d'));
  const head = new THREE.SphereGeometry(1, 10, 8); head.scale(0.027, 0.024, 0.023); head.translate(0.09, 0.014, 0); B.push(paint(head, '#19171a'));
  const beak = new THREE.ConeGeometry(0.0065, 0.032, 5); beak.rotateZ(-Math.PI / 2 - 0.25); beak.translate(0.124, 0.007, 0); B.push(paint(beak, '#0c0c0d'));
  const rump = new THREE.SphereGeometry(1, 10, 8); rump.scale(0.03, 0.019, 0.034); rump.translate(-0.058, 0.019, 0); B.push(paint(rump, '#d9dde0'));
  for (const sd of [-1, 1]) { const tail = new THREE.BoxGeometry(0.075, 0.005, 0.024); tail.rotateY(sd * 0.16); tail.translate(-0.118, 0.008, sd * 0.012); B.push(paint(tail, '#151416')); }   // a shallow fork
  await ctx.yield();
  for (const sd of [-1, 1]) {                                                      // legs trailing to the water: thin shank, a webbed foot
    B.push(spar([-0.03, -0.025, sd * 0.012], [-0.056, -0.086, sd * 0.017], 0.0017, 0.0012, '#0d0d0e', 4));
    const foot = new THREE.BoxGeometry(0.02, 0.002, 0.012); foot.rotateZ(0.5); foot.translate(-0.05, -0.091, sd * 0.017); B.push(paint(foot, '#101011'));
  }
  await ctx.yield();
  const bg = mergeGeometries(B, false); for (const p of B) p.dispose();
  await ctx.yield();
  { const n = bg.attributes.position.count, af = new Float32Array(n * 2); for (let i = 0; i < n; i++) af[i * 2] = -1; bg.setAttribute('aF', new THREE.BufferAttribute(af, 2)); }
  // wing: root at the origin, tip toward +Z. Arm forward to the wrist, hand swept back to a point. Ten stations of three
  // points (leading edge, the crown of the camber at 35% chord, trailing edge), so the wing is an arched aerofoil that
  // shows a lit top and a shaded hollow; then three separated primaries fanned behind the tip. Sooty, with the
  // petrel's paler bar along the inner trailing half. Station: z, leading x, trailing x, y.
  const st = [[0, 0.04, -0.046, 0], [0.028, 0.045, -0.047, 0.005], [0.056, 0.049, -0.046, 0.009], [0.084, 0.052, -0.042, 0.012], [0.112, 0.05, -0.037, 0.014],
    [0.138, 0.04, -0.04, 0.014], [0.162, 0.026, -0.045, 0.012], [0.184, 0.01, -0.049, 0.009], [0.204, -0.008, -0.05, 0.005], [0.222, -0.03, -0.047, 0]];
  const wp = [], wc = [], wi = [], wf = [], dark = new THREE.Color('#201d21'), bar = new THREE.Color('#5a5356'), tipC = new THREE.Color('#141215'), N = st.length;
  st.forEach(([z, xl, xt, y], i) => {
    const f = i / (N - 1), ch = xl - xt, cam = ch * 0.14;
    wp.push(xl, y - cam * 0.5, z, xl - ch * 0.35, y + cam * 0.5, z, xt, y - cam * 0.35, z); wf.push(0, f, 0.35, f, 1, f);
    const lead = dark.clone().lerp(tipC, f), trail = (f < 0.7 ? bar.clone().lerp(dark, f / 0.7) : tipC.clone()), mid = lead.clone().lerp(trail, 0.3);
    wc.push(lead.r, lead.g, lead.b, mid.r, mid.g, mid.b, trail.r, trail.g, trail.b);
    if (i < N - 1) for (let k = 0; k < 2; k++) { const a = i * 3 + k; wi.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }
  });
  for (let k = 0; k < 3; k++) {                                                    // primaries: tapered blades with air between them
    const b0 = wp.length / 3, x0 = -0.012 - 0.014 * k, z0 = 0.2 - 0.006 * k, ang = 0.75 + 0.2 * k, L = 0.05 - 0.007 * k, dx = -Math.sin(ang), dz = Math.cos(ang);
    wp.push(x0 + dz * 0.006, 0.003, z0 + dx * -0.006, x0 - dz * 0.006, 0.002, z0 - dx * -0.006, x0 + dx * L, -0.002 - 0.002 * k, z0 + dz * L);
    for (let c = 0; c < 3; c++) { wc.push(tipC.r, tipC.g, tipC.b); wf.push(0.5, 1.5); }
    wi.push(b0, b0 + 1, b0 + 2);
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3)); wg.setAttribute('aF', new THREE.Float32BufferAttribute(wf, 2)); wg.setIndex(wi); wg.computeVertexNormals();
  return { body: bg, wing: wg };
}

// one unit coronet: flared wall with eight rounded teeth (aK 0), a bead on each tooth (aK 1, aC = bead centre) and a
// rebound jet (aK 2). `fine` is the one used beside the camera line: a thin wall of four rings with its true normals,
// round beads (a subdivided octahedron with a ball's normals) and a jet with a rounded head.
function crownGeometry(fine) {
  const pos = [], nor = [], aC = [], aK = [], idx = [], S = fine ? 40 : 32, R = fine ? 3 : 2;
  for (let j = 0; j <= R; j++) for (let i = 0; i <= S; i++) {
    const a = i / S * Math.PI * 2, v = j / R, r = 0.62 + 0.38 * v * v, pk = j === R ? 0.8 + 0.2 * Math.cos(a * 8) : 1;
    const ny = fine ? -0.76 * v - 0.12 : -0.34, nl = Math.hypot(1, ny);
    pos.push(Math.cos(a) * r, v * pk, Math.sin(a) * r); nor.push(Math.cos(a) / nl, ny / nl, Math.sin(a) / nl); aC.push(0, 0, 0); aK.push(0);
  }
  for (let j = 0; j < R; j++) for (let i = 0; i < S; i++) { const a = j * (S + 1) + i; idx.push(a, a + S + 1, a + 1, a + 1, a + S + 1, a + S + 2); }
  const ball = fine ? new THREE.OctahedronGeometry(1, 1) : null;
  const oct = fine ? [] : [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], of = [0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 4, 2, 0, 5, 1, 2, 5, 3, 1, 5, 0, 3, 5];
  if (ball) { const bp = ball.attributes.position; for (let i = 0; i < bp.count; i++) oct.push([bp.getX(i), bp.getY(i), bp.getZ(i)]); ball.dispose(); }
  for (let b = 0; b < 8; b++) {
    const a = b / 8 * Math.PI * 2, c = [Math.cos(a), 1.05, Math.sin(a)], base = pos.length / 3;
    for (const o of oct) { pos.push(c[0] + o[0] * 0.075, c[1] + o[1] * 0.085, c[2] + o[2] * 0.075); nor.push(o[0], o[1], o[2]); aC.push(c[0], c[1], c[2]); aK.push(1); }
    if (fine) for (let i = 0; i < oct.length; i++) idx.push(base + i); else for (const f of of) idx.push(base + f);
  }
  const jb = pos.length / 3, JS = fine ? 10 : 6;
  for (let i = 0; i < JS; i++) { const a = i / JS * Math.PI * 2; pos.push(Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16); nor.push(Math.cos(a), 0.3, Math.sin(a)); aC.push(0, 0, 0); aK.push(2); }
  if (fine) {
    for (let i = 0; i < JS; i++) { const a = i / JS * Math.PI * 2; pos.push(Math.cos(a) * 0.1, 0.82, Math.sin(a) * 0.1); nor.push(Math.cos(a), 0.5, Math.sin(a)); aC.push(0, 0, 0); aK.push(2); }
    pos.push(0, 1, 0); nor.push(0, 1, 0); aC.push(0, 0, 0); aK.push(2);
    for (let i = 0; i < JS; i++) { const k = (i + 1) % JS; idx.push(jb + i, jb + JS + i, jb + k, jb + k, jb + JS + i, jb + JS + k, jb + JS + i, jb + 2 * JS, jb + JS + k); }
  } else {
    pos.push(0, 1, 0); nor.push(0, 1, 0); aC.push(0, 0, 0); aK.push(2);
    for (let i = 0; i < 6; i++) idx.push(jb + i, jb + 6, jb + (i + 1) % 6);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(aC, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 1)); g.setIndex(idx);
  return g;
}

// THE BREAKER. A profile (forward toward the lip, up, thin) swept along a hooked crest line in world xz: the main
// crest lies across the skim to the left of the route with its lip toward the arriving camera; at its right end the
// crest turns west and runs beside the route, so there the lip curls from the left OVER the camera line, 3 m above
// the lens. The overhang collapses before the height does where the crest tapers out, so no glass ever comes down
// into the camera's corridor (BREAK_LINE is checked against the path in build()).
const BREAK_LINE = [[-30, 222], [-12, 225], [6, 226], [18, 224], [25.5, 218], [28.6, 210], [28.2, 203], [24, 195.5], [17, 188]];
const BREAK_PROF = [[13, -0.6, 0], [7, 0.5, 0], [3.4, 2.6, 0], [1.9, 5.4, 0.1], [2.4, 7.8, 0.3], [4.6, 9.5, 0.6], [7.4, 10.1, 0.85], [9.8, 9.6, 1], [7.7, 10.5, 0.75], [4.6, 11.0, 0.4], [1.0, 10.4, 0.12], [-3, 8.6, 0.03], [-8, 5, 0], [-13, 1.6, 0], [-18, -0.6, 0]];
// computeVertexNormals in slices (area-weighted face normals summed at each vertex, as three does it), so that a
// large grid never holds the page for longer than a few milliseconds while the world before this one is on screen
async function sliceNormals(g, ctx) {
  const p = g.attributes.position.array, ix = g.index.array, n = new Float32Array(p.length);
  for (let t = 0; t < ix.length; t += 3) {
    const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3;
    const ux = p[c] - p[b], uy = p[c + 1] - p[b + 1], uz = p[c + 2] - p[b + 2], vx = p[a] - p[b], vy = p[a + 1] - p[b + 1], vz = p[a + 2] - p[b + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[c] += nx; n[c + 1] += ny; n[c + 2] += nz;
    if (t % 9000 === 8997) await ctx.yield();
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
}
function breakerFrame(line, a, out) {                        // centre, lip direction, envelope and bend radius at a (0..1 by length)
  const c = line.getPointAt(a), t = line.getTangentAt(a), e = 0.012;
  const t0 = line.getTangentAt(Math.max(0, a - e)), t1 = line.getTangentAt(Math.min(1, a + e));
  const turn = (t0.x * t1.z - t0.z * t1.x) / Math.max((Math.min(1, a + e) - Math.max(0, a - e)) * line.getLength(), 1e-3);   // + = bending away from the lip
  out.cx = c.x; out.cz = c.z; out.nx = -t.z; out.nz = t.x;
  // THE CREST RISES AND DIPS along the main crest (a wave seen from its shoulder, never a loaf with a flat top): a
  // fifth of its height, in swells of 30 and 13 m, and where it dips the lip has not yet pitched out; its south end
  // climbs out of the swell over 40 m. The hook over the camera line (a > 0.54) is as it was.
  const dip = 0.2 * (1 - smoothstep(0.4, 0.54, a)) * clamp(0.5 + 0.3 * Math.sin(a * 21 + 0.9) + 0.2 * Math.sin(a * 47 + 2.3), 0, 1);
  out.env = Math.pow(smoothstep(0, 0.44, a), 0.95) * Math.pow(1 - smoothstep(0.8, 1, a), 0.8) * (1 - dip);
  out.over = smoothstep(0.8, 0.975, out.env);
  out.rc = turn < -1e-4 ? clamp(-0.85 / turn, 4, 1e4) : 1e4;
  return out;
}
function breakerOffset(F, pz, wob) {                         // forward offset of a profile point from the crest line
  if (pz >= 0) return Math.min(pz, 3.4) * (0.45 + 0.55 * F.env) + Math.max(pz - 3.4, 0) * F.over + wob * 1.5;
  const d = pz * (0.45 + 0.55 * F.env) + wob * 1.5;          // the back slope: squeezed on the inside of the bend, never folded
  return d < 0 ? -F.rc * (1 - Math.exp(d / F.rc)) : d;
}
async function breakerGeometry(noise, ctx, lr, path) {       // lr: the fingers' own random stream; path: the camera line they keep clear of
  const line = new THREE.CatmullRomCurve3(BREAK_LINE.map((p) => V3(p[0], 0, p[1])), false, 'centripetal'), len = line.getLength();
  const curve = new THREE.CatmullRomCurve3(BREAK_PROF.map((p) => V3(p[0], p[1], 0)), false, 'centripetal');
  const NPF = BREAK_PROF.length - 1, NP = 52, NX = 260, J0 = 16, J1 = 36, JB0 = 18, JB1 = 34, tmp = V3(), F = {};   // the lip's grid spans rows J0..J1; the opaque body runs on under its first rows, to JB0 and from JB1
  const profAt = (f) => { curve.getPoint(f / NPF, tmp); const k = Math.min(NPF - 1, Math.floor(f)); return [tmp.x, tmp.y, lerp(BREAK_PROF[k][2], BREAK_PROF[k + 1][2], f - k)]; };
  const edgeK = (Fr) => Fr.env * (0.5 + 0.5 * Fr.over);     // how much of a lip there is at this point of the crest
  const mk = (pos, info, dir, loc, ix) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3));
    g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 2)); g.setAttribute('aL', new THREE.Float32BufferAttribute(loc, 3));
    g.setIndex(ix); return g;
  };
  // ---- the BODY: 52 profile rows on 260 columns; the rows between JB0 and JB1 (the glass of the lip) are only used for its normals
  const pos = [], info = [], dir = [], loc = [], idx = [], seam = [], prof = [];
  for (let j = 0; j <= NP; j++) prof.push(profAt(j / NP * NPF));
  for (let i = 0; i <= NX; i++) {
    const a = i / NX, s = a * len; breakerFrame(line, a, F);
    const wob = noise.n2(s * 0.08, 9.1), k = edgeK(F);
    for (let j = 0; j <= NP; j++) {
      const [pz, py, thin] = prof[j], d = breakerOffset(F, pz, wob);
      pos.push(F.cx + F.nx * d, (py + 0.6) * F.env - 0.6, F.cz + F.nz * d);
      info.push(thin * k, 0, a); dir.push(F.nx, F.nz); loc.push(s, py, pz);
    }
    if (i % 8 === 7) await ctx.yield();
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NP; j++) { const a = i * (NP + 1) + j; (j >= JB0 && j < JB1 ? seam : idx).push(a, a + 1, a + NP + 1, a + 1, a + NP + 2, a + NP + 1); }
  await ctx.yield();
  const all = mk(pos, info, dir, loc, idx.concat(seam)); await ctx.yield(); await sliceNormals(all, ctx);
  await ctx.yield();
  const g = mk(pos, info, dir, loc, idx); g.setAttribute('normal', all.attributes.normal); all.dispose();
  await ctx.yield();

  // ---- where the FINGERS leave the rim: unequal gaps, unequal lengths (most 1-2 m, a few stubs, a few of 3-4 m)
  // (THE DRAWS ARE TAKEN PER STRETCH OF CREST: every 0.4 m of it, end to end, takes its fourteen draws whether or
  // not a finger stands there, so the shape of the crest never changes how many are drawn)
  const fingers = []; let next = 5;
  for (let s0 = 5; s0 < len - 4; s0 += 0.4) {
    const u = lr(), l1 = lr(), wK = lr.range(0.4, 0.8), drop = lr.range(0.16, 0.55), lean = lr.range(-0.17, 0.17), rs = lr.range(0.02, 0.036), rbK = lr.range(0, 0.07),
      satU = lr(), satV = lr.range(0.4, 0.75), satR = lr.range(0.3, 0.5), seed = lr(), gap = lr.range(0.9, 2.2), wide = lr() < 0.2, s = s0 + lr.range(0, 0.4);
    if (s < next) continue;
    breakerFrame(line, s / len, F); const tf = Math.pow(edgeK(F), 6);
    if (tf < 0.3) continue;
    const L = (u < 0.2 ? lerp(0.8, 1.3, l1) : u < 0.75 ? lerp(1.4, 2.8, l1) : lerp(3.2, 5.0, l1)) * (0.35 + 0.65 * tf);
    const hook = s / len > 0.6;                               // closer together and narrower at the root in the hook, over the camera line
    fingers.push({ s, L, w: wK * Math.min(1, 0.5 + 0.25 * L) * (hook ? 0.62 : 1), drop, lean, rs, rb: 0.12 + 0.03 * L + rbK, sat: satU < 0.7 ? satV : 0, satR, seed });
    next = s + gap * (hook ? 0.42 : 1) * (wide ? 1.8 : 1);
  }
  // the rim between two fingers hangs back in a shallow web and runs out a little into each root
  const scallop = (s) => {
    let sc = -0.16 + 0.12 * noise.n2(s * 0.45, 5.3), root = 0;
    for (const fg of fingers) { const x = Math.abs(s - fg.s) / (fg.w * 2.6); if (x < 1) { const b = (1 - x * x) * (1 - x * x); sc += 0.4 * Math.min(1, fg.L) * b; root = Math.max(root, b); } }
    return [sc, root];
  };

  // ---- the LIP: its own grid, twice as fine along the crest, its rows crowded toward the edge (the profile is
  //      resampled by thin, not evenly): underside from the body's row J0 out to the edge, then back along the top to J1
  const NXL = NX * 2, KR = 11, fE = 7, f0 = J0 / NP * NPF, f1 = J1 / NP * NPF, rowsF = [f0 - 0.3];
  for (let k = 0; k <= KR; k++) rowsF.push(fE - (fE - f0) * Math.pow(1 - k / KR, 1.7));
  for (let k = 1; k <= KR; k++) rowsF.push(fE + (f1 - fE) * Math.pow(k / KR, 1.7));
  rowsF.push(f1 + 0.3);
  const NR = rowsF.length, lprof = rowsF.map(profAt), lp = [], li = [], ld = [], ll = [], lAll = [], lIdx = [];
  for (let i = 0; i <= NXL; i++) {
    const a = i / NXL, s = a * len; breakerFrame(line, a, F);
    const wob = noise.n2(s * 0.08, 9.1), k = edgeK(F), [sc, root] = scallop(s);
    for (let j = 0; j < NR; j++) {
      const [pz, py, thin] = lprof[j], tk = thin * k, d = breakerOffset(F, pz, wob) + sc * Math.pow(tk, 6);
      lp.push(F.cx + F.nx * d, (py + 0.6) * F.env - 0.6, F.cz + F.nz * d);
      li.push(tk, root, a); ld.push(F.nx, F.nz); ll.push(s, py, pz);
    }
    if (i % 8 === 7) await ctx.yield();
  }
  for (let i = 0; i < NXL; i++) {
    for (let j = 0; j < NR - 1; j++) { const a = i * NR + j, q = [a, a + 1, a + NR, a + 1, a + NR + 1, a + NR]; lAll.push(...q); if (j > 0 && j < NR - 2) lIdx.push(...q); }
    if (i % 24 === 23) await ctx.yield();
  }
  const lall = mk(lp, li, ld, ll, lAll); await ctx.yield(); await sliceNormals(lall, ctx);
  await ctx.yield();
  const lip = mk(lp, li, ld, ll, lIdx); lip.setAttribute('normal', lall.attributes.normal); lall.dispose();
  { // the lip's faces and normals look out of the water: at the edge row the outside looks down (the world draws its
    // two sheets in a fixed order, top side first: section g)
    const v = (Math.round(NXL * 0.6) * NR + KR - 1) * 3 + 1;
    if (lip.attributes.normal.array[v] > 0) { const ix = lip.index.array; for (let t = 0; t < ix.length; t += 3) { const q = ix[t + 1]; ix[t + 1] = ix[t + 2]; ix[t + 2] = q; } const na = lip.attributes.normal.array; for (let t = 0; t < na.length; t++) na[t] = -na[t]; }
  }
  { // where the lip lies on the body (thin under 0.45) it wears the body's own normals, blending to its own by 0.6:
    // wall and roof are shaded as one curve (the two grids' normals differ by a hair, which showed as a seam)
    const ln = lip.attributes.normal.array, bn = g.attributes.normal.array, W1 = NP + 1;
    for (let i = 0; i <= NXL; i++) {
      const fi = i / 2, i0 = Math.min(NX - 1, Math.floor(fi)), ti = fi - i0;
      for (let j = 0; j < NR; j++) {
        const wgt = 1 - smoothstep(0.45, 0.6, lprof[j][2]); if (wgt <= 0) continue;
        const fj = clamp(rowsF[j] / NPF * NP, 0, NP), j0 = Math.min(NP - 1, Math.floor(fj)), tj = fj - j0, o = (i * NR + j) * 3;
        let nx = 0, ny = 0, nz = 0;
        for (const [di, dj, wq] of [[0, 0, (1 - ti) * (1 - tj)], [1, 0, ti * (1 - tj)], [0, 1, (1 - ti) * tj], [1, 1, ti * tj]]) { const q = ((i0 + di) * W1 + j0 + dj) * 3; nx += bn[q] * wq; ny += bn[q + 1] * wq; nz += bn[q + 2] * wq; }
        const sg = nx * ln[o] + ny * ln[o + 1] + nz * ln[o + 2] < 0 ? -1 : 1;
        nx = lerp(ln[o], nx * sg, wgt); ny = lerp(ln[o + 1], ny * sg, wgt); nz = lerp(ln[o + 2], nz * sg, wgt);
        const il = 1 / Math.max(Math.hypot(nx, ny, nz), 1e-6); ln[o] = nx * il; ln[o + 1] = ny * il; ln[o + 2] = nz * il;
      }
      if (i % 24 === 23) await ctx.yield();
    }
  }
  await ctx.yield();
  // the lip's two sheets as their own index lists over the same vertices (underside: rows up to the rim; top: back
  // from the rim), so the world can draw the top first and the underside over it
  const sheet = (ix) => { const q = new THREE.BufferGeometry(); for (const k of Object.keys(lip.attributes)) q.setAttribute(k, lip.attributes[k]); q.setIndex(ix); return q; };
  const lia = lip.index.array, per = (NR - 3) * 6, cut = KR * 6, iUnder = [], iTop = [];
  for (let t = 0; t < lia.length; t += per) { for (let q = 0; q < cut; q++) iUnder.push(lia[t + q]); for (let q = cut; q < per; q++) iTop.push(lia[t + q]); }
  const lipUnder = sheet(iUnder), lipTop = sheet(iTop);
  await ctx.yield();
  // THE SAME WAVE FOR THE LESSER CRESTS (drawn at a quarter to a half of its size, so no coarser in metres): the same vertices on coarser
  // index lists, the body every second row and column, the lip's two sheets every fourth column
  const farBody = new THREE.BufferGeometry(); for (const k of Object.keys(g.attributes)) farBody.setAttribute(k, g.attributes[k]);
  { const ix = [], W2 = 2 * (NP + 1); for (let i = 0; i < NX; i += 2) for (let j = 0; j < NP; j += 2) { if (j >= JB0 && j < JB1) continue; const a = i * (NP + 1) + j; ix.push(a, a + 2, a + W2, a + 2, a + W2 + 2, a + W2); } farBody.setIndex(ix); }
  const flip = lia[1] !== lia[0] + 1, fUnder = [], fTop = [];
  for (let i = 0; i < NXL; i += 4) for (let j = 1; j < NR - 2; j++) { const a = i * NR + j, b = a + 4 * NR, q = flip ? [a, b, a + 1, a + 1, b, b + 1] : [a, a + 1, b, a + 1, b + 1, b]; (j <= KR ? fUnder : fTop).push(...q); }
  const far = { body: farBody, lipUnder: sheet(fUnder), lipTop: sheet(fTop) };
  await ctx.yield();

  // ---- the FINGERS: one tube each (12 round). Flat web at the root -> neck -> string (with a small bead or two on
  //      it) -> a hanging drop. Drawn ten times life size, as the rain is. Built at the length they have at T 26;
  //      FINGER_VERT draws them out along aC.
  const RS = 12, fp = [], fc = [], fr = [], ff = [], ft = [], fi = [], C = V3(), C2 = V3(), T = V3(), Bv = V3(), Nv = V3(), dirV = V3(), sideV = V3(), root = V3(), cen = V3();
  let made = 0;
  for (const fg of fingers) {
    breakerFrame(line, fg.s / len, F);
    const wob = noise.n2(fg.s * 0.08, 9.1), k = edgeK(F), tf = Math.pow(k, 6), d0 = breakerOffset(F, 9.8, wob) + scallop(fg.s)[0] * tf - 0.42;
    root.set(F.cx + F.nx * d0, (9.74 + 0.6) * F.env - 0.6, F.cz + F.nz * d0); dirV.set(F.nx, 0, F.nz); sideV.set(F.nz, 0, -F.nx);
    const centre = (L, t, out) => out.copy(dirV).multiplyScalar(L * (t - 0.22 * t * t * t)).addScaledVector(sideV, L * fg.lean * t * t).setY(-L * (0.14 * t + fg.drop * t * t));
    // nothing of a finger may hang in the camera's corridor: shorten it until web, string and drop keep 2.6 m, both as
    // the camera passes (T 26) and at full stretch; a finger whose root is too near is not grown at all
    let L = fg.L, ok = false;
    for (let tr = 0; tr < 4 && !ok; tr++) {
      ok = true;
      for (const [gs, cr] of [[1, 0.9], [1.18, 1.4]]) for (const t of [0, 0.2, 0.4, 0.7, 1]) { centre(L * gs, t, C).add(root).addScaledVector(dirV, cr * k * k); if (path.distanceTo(C.x, C.y, C.z) < (t < 0.3 ? 2.9 : 2.6)) ok = false; }
      if (!ok) L *= 0.6;
    }
    if (!ok || L < 0.3) continue;
    const rb = Math.min(fg.rb, 0.16 * L), tb = 1 - rb / L, tb0 = 1 - 2.5 * rb / L, tn = Math.min(clamp(0.5 / L + 0.12, 0.2, 0.6), tb0 - 0.1), st = [];   // stations: t, half width, half height, t of the centre that carries it, feature radius, offset along the bead's axis
    for (const q of [0, 0.12, 0.26, 0.42, 0.6, 0.8, 1]) { const e = 1 - q, w = fg.rs + (fg.w - fg.rs) * Math.pow(e, 2.3), h = fg.rs + (0.16 - fg.rs) * Math.pow(e, 1.8); st.push([q * tn, w, h, -1, Math.max(w, h), 0, q]); }
    const rsat = rb * fg.satR, ts = lerp(tn, tb0, fg.sat), hasSat = fg.sat > 0 && (tb0 - tn) * L > 0.55;
    for (let q = 1; q <= 6; q++) {
      const t = lerp(tn, tb0, q / 7); if (hasSat && Math.abs(t - ts) * L < 1.7 * rsat) continue;
      const r = fg.rs * (1 + 0.35 * Math.sin(t * L * 5 + fg.seed * 20)); st.push([t, r, r, -1, r, 0, 1]);
    }
    const bead = (tc, R) => { for (const x of [-1.5, -1.15, -0.8, -0.45, 0, 0.4, 0.72, 0.92, 1]) { const r = Math.max(x < 0 ? R * Math.sqrt(Math.max(1 - x * x / 2.25, 0)) : R * Math.sqrt(Math.max(1 - x * x, 0)), x < 1 ? fg.rs * 0.9 : 0); st.push([tc + x * R / L, r, r, tc, R, x * R, x < -1.2 ? 1.3 : 2]); } };
    if (hasSat) bead(ts, rsat);
    bead(tb, rb);
    st.sort((p, q) => p[0] - q[0]);
    const base = fp.length / 3;
    for (let r = 0; r < st.length; r++) {
      const [t, w, h, tc, feat, ax, kind] = st[r], tt = tc >= 0 ? tc : t;
      centre(L, tt, cen); centre(L, Math.min(tt + 0.01, 1.01), C2); T.subVectors(C2, cen).normalize();
      Bv.copy(sideV).addScaledVector(T, -sideV.dot(T)).normalize(); Nv.crossVectors(T, Bv);
      for (let q = 0; q < RS; q++) {
        const ph = q / RS * Math.PI * 2, cx = Math.cos(ph) * w, cy = Math.sin(ph) * h;
        C.copy(Bv).multiplyScalar(cx).addScaledVector(Nv, cy);
        fr.push(C.x, C.y, C.z, feat); fc.push(cen.x, cen.y, cen.z);
        fp.push(root.x + cen.x + T.x * ax + C.x, root.y + cen.y + T.y * ax + C.y, root.z + cen.z + T.z * ax + C.z);
        ff.push(F.nx, F.nz, k * k, fg.s / len); ft.push(clamp(t, 0, 1), kind);
      }
      if (r > 0) for (let q = 0; q < RS; q++) { const a = base + (r - 1) * RS + q, b = base + (r - 1) * RS + (q + 1) % RS; fi.push(a, a + RS, b, b, a + RS, b + RS); }
    }
    if (++made % 2 === 0) await ctx.yield();
  }
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fgeo.setAttribute('aC', new THREE.Float32BufferAttribute(fc, 3));
  fgeo.setAttribute('aRing', new THREE.Float32BufferAttribute(fr, 4)); fgeo.setAttribute('aFi', new THREE.Float32BufferAttribute(ff, 4)); fgeo.setAttribute('aTau', new THREE.Float32BufferAttribute(ft, 2));
  fgeo.setIndex(fi);
  await ctx.yield();
  await sliceNormals(fgeo, ctx);
  await ctx.yield();
  { // wind outward (the tubes are drawn front faces only): the normal of a string vertex must look along its radial offset
    const na = fgeo.attributes.normal.array; let dot = 0;
    for (let v = 0; v < fp.length / 3; v += 7) dot += na[v * 3] * fr[v * 4] + na[v * 3 + 1] * fr[v * 4 + 1] + na[v * 3 + 2] * fr[v * 4 + 2];
    if (dot < 0) { for (let t = 0; t < fi.length; t += 3) { const q = fi[t + 1]; fi[t + 1] = fi[t + 2]; fi[t + 2] = q; } fgeo.setIndex(fi); for (let t = 0; t < na.length; t++) na[t] = -na[t]; }
  }
  fgeo.boundingSphere = new THREE.Sphere(V3(10, 8, 210), 80);
  return { geometry: g, lip, lipUnder, lipTop, far, fingers: fgeo, fingerCount: made, line, len, out: g.attributes.normal.getY(Math.round(NX * 0.4) * (NP + 1) + 42) > 0 ? 1 : -1 };   // out: +1 if the body's normals look out of the water (its back slope's look up)
}

function quadInstances(n, fill) {                            // instanced unit quad with iPos (3) and iParm (4)
  const g = new THREE.InstancedBufferGeometry(), ip = new Float32Array(n * 3), pr = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) fill(i, ip, pr);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 3)); g.setAttribute('iParm', new THREE.InstancedBufferAttribute(pr, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(V3(0, 0, 0), 1e5);
  return g;
}

// ---------------------------------------------------------------- 5. the world
export default {
  id: 'the-leader',
  name: 'The Leader',
  category: 'sky',
  weirdness: 0.6,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const scene = new THREE.Scene();
    // ---- a. mood (two draws from the world's stream, then everything of mine comes from a fork)
    const roll = rng(), seaRoll = rng(), r2 = rng.fork('the-leader-world');
    let moodName = roll < 0.42 ? 'dusk' : roll < 0.62 ? 'copper' : roll < 0.81 ? 'day' : 'night';
    if (vary.hour === 'night') moodName = 'night'; else if (vary.hour === 'day') moodName = 'day'; else if (vary.hour === 'golden') moodName = 'copper'; else if (vary.hour === 'dawn') moodName = 'dawn';
    const M = MOODS[moodName], C = (h) => new THREE.Color(h);
    const bandC = C(M.band), cloudC = C(M.cloud), fogC = C(M.fog), seaC = C(M.sea), rimC = C(M.rim);
    scene.fog = new THREE.FogExp2(fogC.clone(), 0.0011);
    scene.background = fogC.clone();
    await ctx.yield();

    // ---- b. the sea: kit storm ocean, all but stopped (speed 0.004), crests running along X (north to south) so the
    //         skim crosses them. THE BRIEF'S SEA: storm crests about 5 m from trough to top, 70 to 90 m apart (the
    //         kit's longest train is twice `wavelength`, the next 1.3 times it; its largest crests stand 1.5 times
    //         `height` over their troughs). The sea is then let down as a whole (seaDrop, a metre or so) until no crest
    //         comes within 2.6 m of the lens anywhere along the skim line: everything seated on it uses seaY and goes
    //         down with it.
    const pathX = (z) => (z > 290 ? lerp(45, 52, clamp((z - 290) / 60, 0, 1)) : lerp(33, 45, clamp((z - 165) / 125, 0, 1)));   // the skim line (and the pull-out's last 60 m): x at z
    const farSeaC = new THREE.Color(seaC.r * 0.6 + fogC.r * 0.3, seaC.g * 1.25 + fogC.g * 0.35, seaC.b + fogC.b * 0.3), farSea = '#' + farSeaC.getHexString();   // the far sea: deep teal, never black (dome, sea from height and the kit ocean's horizon all end in it)
    const ocean = Water.makeOcean({ rng: rng.fork('sea'), preset: 'storm', height: lerp(3.0, 3.7, seaRoll), wavelength: 42, spread: 0.3, speed: 0.004, windAngle: Math.PI / 2, spray: false, detail: 1.05, glitter: 0.6,
      deep: M.deep, scatter: '#3d8088', radius: 3600, horizonColor: farSea,
      light: { preset: 'storm', sunDir: [-0.17, 0.07, -0.985], sunColor: M.rim, sunIntensity: 1.5 * M.amt, zenith: M.osky || M.cloud, mid: M.osky || M.cloud, horizon: M.fog, scatterColor: M.rim, scatter: 0.85 * M.amt, glint: M.glint ?? 0.45, fogColor: M.fog, clouds: false } });   // (the sun the ocean glints with stands under the slot's bright core, ten degrees south of west: the lemon glitter road)
    scene.add(ocean.object);
    // the leader lights the kit's water (SEA_LIGHT_GLSL): laid into the ocean material's own shader text before it is
    // first compiled. If the kit's shader no longer has the two lines this hangs on, the sea is simply left as the kit draws it.
    const seaL = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 100, 0, 0));
    const sl0 = Math.max(seaC.r * 0.2126 + seaC.g * 0.7152 + seaC.b * 0.0722, 1e-3), kl = 0.98 / M.exposure * (M.seaLit ?? 1);   // (the light reads the same in every mood's exposure; the day's sea needs less of it)
    const seaLitU = {
      uSeaL: { value: seaL }, uLTeal: { value: new THREE.Color(0.016, 0.105, 0.115).lerp(seaC.clone().multiplyScalar(0.085 / sl0), 0.25).multiplyScalar(kl) },
      uLKeyC: { value: new THREE.Color('#8E62FF').multiplyScalar(0.5).add(new THREE.Color('#E4DCFF').multiplyScalar(0.5)).multiplyScalar(kl) },
      uLRimC: { value: rimC.clone().multiplyScalar(M.amt * Math.sqrt(M.seaLit ?? 1)) }, uLBandDir: { value: new THREE.Vector2(0, -1) }, uLAmb: { value: 0.4 }, uLStroke: { value: 0 },
    };
    {
      const om = ocean.material, fs = om && om.fragmentShader, A1 = 'void main(){', A2 = 'col += spec*(1.-fa);';
      if (fs && fs.includes(A1) && fs.includes(A2)) {
        Object.assign(om.uniforms, seaLitU);
        om.fragmentShader = fs.replace(A1, SEA_LIGHT_GLSL + A1).replace(A2, A2 + ' col = leaderSeaMix(col, leaderOnSea(vWorld, N, V, crest, fa, alpha, dist, gl), fa, dist);');
      }
    }
    let seaDrop = 0;
    for (let z = 150; z <= 300; z += 1.5) for (let dx = -2.5; dx <= 2.5; dx += 2.5) seaDrop = Math.max(seaDrop, ocean.heightAt(pathX(z) + dx, z, 20) - 3.4);
    ocean.object.position.y = -seaDrop;
    const seaY = (x, z) => ocean.heightAt(x, z, 20) - seaDrop;
    await ctx.yield();

    // ---- c. the schooner: heeled 14 degrees to starboard (+Z), bow lifted, seated on the swell under her
    const shipGeo = await shipGeometry(ctx);
    await ctx.yield();
    const ship = new THREE.Mesh(shipGeo.hull, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    ship.position.set(0, clamp(seaY(-10, 0) * 0.7, -1.2, 1.6), 0); ship.rotation.set(14 * DEG, 0, 2.5 * DEG); ship.updateMatrixWorld(true);
    ship.name = 'schooner'; scene.add(ship);
    const L2W = (x, y, z) => V3(x, y, z).applyMatrix4(ship.matrixWorld);
    const mastheads = [L2W(0, 30, 0), L2W(-11, 30.5, 0), L2W(-22, 28, 0)];
    const crests = [];
    for (let i = 0; i < 9; i++) { const f = (i + 0.5) / 9, x = lerp(45, 33, f) + (i % 2 ? -1 : 1) * (10 + 5 * (i % 3)), z = lerp(290, 165, f) - 12 - 4 * (i % 4); crests.push(V3(x, seaY(x, z) + 0.1, z)); }
    await ctx.yield();

    // ---- d. HERO: the leader, the answer and the rain (local space = world space). On a rare visit one stray limb
    //         turns our way and stalls 4 m to the right of the lens during the skim (the hero grows it: opts.stray).
    const bandLit = bandC.clone().multiplyScalar(M.amt);
    const hero = await buildHero(ctx, { palette: [M.cloud, M.sea, M.band, '#E4DCFF', '#8E62FF', '#B4506F', '#FFB45A'], mastheads, crests, stray: !!vary.rare });
    hero.setEnv({ band: bandLit, cloud: cloudC, sea: seaC });
    scene.add(hero.object);
    await ctx.yield();

    // ---- e. PATH, CLOCK, POIS
    const ft = hero.anchors.flyThrough, seat = hero.anchors.portalSeat.position, s18 = Math.sin(18 * DEG), c18 = Math.cos(18 * DEG);
    const back = (d) => V3(seat.x, seat.y - d * s18, seat.z + d * c18);                    // the 18 degree line into the ring
    const pts = [V3(60, 690, 548), ...ft.slice(0, 24).map((p) => p.clone()), V3(33.3, 6.1, 171), back(80), back(55), back(28), back(0)];
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    const K = 16, c2 = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5), cl = c2.getLengths((pts.length - 1) * K), tot = cl[cl.length - 1];
    const knotU = pts.map((_, i) => cl[i * K] / tot);
    // the journey clock at every knot: level entry, the corkscrew on the hero's own clock (slow on the arcs that face
    // the slot, fast between), pull-out, skim, climb
    const knotT = [...hero.anchors.entryTimes, ...hero.anchors.helixTimes, 17.9, 19.5, 24.75, 30, 32.4, 34.8, 37.3, 40];
    const clock = pchip(knotU, knotT), Tof = (u) => clock(clamp(u, 0, 1));
    const pace = (u) => { const a = clamp(u - 0.004, 0, 1), b = clamp(u + 0.004, 0, 1); return clamp((b - a) * 40 / Math.max(Tof(b) - Tof(a), 1e-4), 0.3, 2.6); };
    const uOf = (T) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (Tof(m) < T) lo = m; else hi = m; } return (lo + hi) / 2; };
    const tA = hero.anchors.trunkTop, tF = hero.anchors.trunkFoot, junction = hero.anchors.junction;
    const trunkAim = V3(), leadAim = V3();
    // THE GAZE. In the dive the look is lifted off the corkscrew (the designers' ruling; an amendment of the brief:
    // the path keeps its 50 to 62 degrees, the look is never steeper than about 25 below level) by ONE pull of weight
    // 1 on ONE thing of the world: THE LEADING LIMB'S TIP, which the hero lays on its station (19 degrees below the
    // lens, 66 to 94 m off, the trunk 40 degrees to the right of it; see makeStation in the hero). The pull works its
    // target out from u alone (leadAt: the tip's own course, handed from limb to limb). It comes in over the end of
    // the level entry and lets go as the low limb leaves its station to be overtaken (the brief's 14 s), where the
    // look goes to the place over the schooner at which the ship limb comes down (PULL_AT, a place of the world).
    // No other pull shares its target and none is stacked. The steady camera takes every pull at a third and looks
    // three times as far down the corkscrew: its look in the dive is steeper (see the hand-in notes).
    // (the pull's two ends: it is at full weight from the portal on, where the engine's own guard brings every pull
    // in over the first 0.04 of the flight, and it lets go over the second in which the low limb closes to be overtaken (T 12.75 to 13.75); the look at the
    // schooner's place has come in under it by then, so the hand-over is from tip to place and not through the
    // corkscrew's own heading)
    const T_OVER = hero.anchors.overtake, LEAD_TO = uOf(T_OVER - 0.25), LEAD_OUT = LEAD_TO - uOf(T_OVER - 1.25), LEAD_FROM = -2 * LEAD_OUT;
    const ENTRY_TO = uOf(2.5), ENTRY_AT = tA.clone().lerp(tF, 0.06), SKIM_AT = V3(4, 58, 8), PULL_AT = V3(4, 105, 8), SHIP_AT = V3(-8, 6, 0);
    const pois = [
      { at: ENTRY_AT, from: 0, to: ENTRY_TO, weight: 0.45 },
            // the last arc of the dive and the whole pull-out (the brief's 16 to 19.5 s): ONE steady look down the skim at
      // the place above the schooner where the ship limb is coming down to her (the low limb is overtaken low on the
      // right of it at the brief's 14 s): the slot, the schooner and the ring come in across the middle of the frame
      // with the ship limb and its corona hanging over them; the gaze is not dragged round by anything passing close by
      { at: PULL_AT, from: uOf(T_OVER - 2), to: uOf(19.5), weight: 0.8, fade: 0.3 },
      { at: (time, u) => hero.leadAt(Tof(u || 0), leadAim), from: LEAD_FROM, to: LEAD_TO, weight: 1, fade: LEAD_OUT / (LEAD_TO - LEAD_FROM) },
      { at: (time, u) => hero.tipAt('trunk', Tof(u || 0), trunkAim), from: uOf(14), to: uOf(16), weight: 0.2 },   // and a glance toward the trunk's tip over the sea (from the overtaking to the end of the dive)
      { at: SKIM_AT, from: uOf(15.5), to: uOf(30.5), weight: 0.45 },
      { at: junction.clone(), from: uOf(31), to: uOf(37.6), weight: 0.22 },
    ];
    if (hero.anchors.stray) pois.push({ at: hero.anchors.stray.clone().add(V3(0.5, 2.5, -2)), from: uOf(21.9), to: uOf(23.8), weight: 0.26 });   // the rare event: a glance at the stray limb as it comes down
    await ctx.yield();

    // ---- shared uniforms of the world's own shaders
    const pools = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 300, 0, 0));
    const U = {
      uTime: { value: 0 }, uT: { value: 0 }, uSeaDrop: { value: seaDrop }, uStroke: { value: 0 }, uKey: { value: tF.clone() }, uKeyI: { value: 0.5 }, uCam: { value: V3(60, 690, 548) }, uResY: { value: 450 },
      uCloudC: { value: cloudC }, uBandC: { value: bandC }, uSeaC: { value: seaC }, uFarSea: { value: farSeaC.clone() }, uSeaAmb: { value: 1 }, uFogC: { value: fogC }, uFogD: { value: 0.0011 }, uRimC: { value: rimC },
      uViolet: { value: hero.uniforms.uViolet.value }, uGlowC: { value: hero.uniforms.uGlowC.value },
      uBandAmt: { value: M.amt }, uBandDir: { value: new THREE.Vector2(0, -1) }, uAxis: { value: new THREE.Vector2(tA.x, tA.z) }, uGlowR: { value: 150 },
      uHigh: { value: 1 }, uPool: { value: pools }, uPoolK: { value: 1 }, uBirdDz: { value: 0 }, ...seaLitU,
      uRoadDir: { value: new THREE.Vector2(Math.sin(-14 * DEG), -Math.cos(-14 * DEG)) }, uShipLit: { value: V3(-8, 0, 0) },
      uRoadC: { value: rimC.clone().multiplyScalar(moodName === 'copper' ? 0.35 : 0.7).add(cloudC.clone().multiplyScalar(1.4)) }, uSeaLift: { value: moodName === 'dusk' ? 1.3 : 1 }, uLitK: { value: 1.25 / M.exposure },   // the leader's light on the sea reads the same in every mood's exposure   // the glitter road runs 14 degrees south of west, at the schooner; uShipLit: x, z, strength
    };

    // ---- f. sky: dome with the slot in the west, vaulted boiling ceiling at 700 m, six rain shafts
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    dome.renderOrder = -1; dome.frustumCulled = false; dome.name = 'dome'; scene.add(dome);
    await ctx.yield();
    // a level 3.8 km grid at 700 m (the vertex shader hangs the pouches from it): its cells are 9 m across over the
    // entry and the top of the dive, where the camera flies just under the base and sees the pouches edge-on, and widen
    // to 90 m at its rim (one smooth law of the distance from the trunk's top, nothing else)
    const CN = 128, cgP = new Float32Array((CN + 1) * (CN + 1) * 3), cgI = new Uint16Array(CN * CN * 6), cgW = (s) => 1900 * (0.3 * s + 0.7 * s * s * s);
    for (let j = 0, o = 0; j <= CN; j++) for (let i = 0; i <= CN; i++) { cgP[o++] = tA.x + cgW(2 * i / CN - 1); cgP[o++] = 700; cgP[o++] = tA.z - 40 - cgW(2 * j / CN - 1); }
    for (let j = 0, o = 0; j < CN; j++) for (let i = 0; i < CN; i++) { const a = j * (CN + 1) + i, b = a + CN + 1; cgI[o++] = a; cgI[o++] = b; cgI[o++] = a + 1; cgI[o++] = b; cgI[o++] = b + 1; cgI[o++] = a + 1; }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cgP, 3)); cg.setIndex(new THREE.BufferAttribute(cgI, 1));
    await ctx.yield();
    const ceiling = new THREE.Mesh(cg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: CEIL_VERT, fragmentShader: CEIL_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: true, fog: false }));
    ceiling.renderOrder = 0; ceiling.frustumCulled = false; ceiling.name = 'ceiling'; scene.add(ceiling);
    await ctx.yield();
    const sp = [], su = [], ss = [], si = [], shafts = [[-40, 1500, 300], [29, 2150, 640], [98, 1300, 420], [142, 2100, 700], [-104, 1700, 560], [-152, 2400, 680]];   // two cross the slot (one narrow and near, one broad and far); the others hang clear of it
    shafts.forEach(([az, d, w], k) => {
      const a = az * DEG, cx = 40 + Math.sin(a) * d, cz = 250 - Math.cos(a) * d, tx = Math.cos(a) * w * 0.5, tz = Math.sin(a) * w * 0.5, lean = (k % 2 ? 1 : -1) * 260;
      sp.push(cx - tx, -5, cz - tz, cx + tx, -5, cz + tz, cx - tx + lean, 1120, cz - tz, cx + tx + lean, 1120, cz + tz); su.push(0, 0, 1, 0, 0, 1, 1, 1);   // tops well inside the vaulted ceiling
      const sd = r2(); ss.push(sd, sd, sd, sd); si.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 2, k * 4 + 1, k * 4 + 3);
    });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); sg.setAttribute('aSeed', new THREE.Float32BufferAttribute(ss, 1)); sg.setIndex(si);
    const shaftMesh = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, fog: false }));
    shaftMesh.renderOrder = -0.5; shaftMesh.frustumCulled = false; shaftMesh.name = 'rain-shafts'; scene.add(shaftMesh);
    await ctx.yield();

    // ---- f2. the sea from height and the haze decks (both follow the camera in xz; see HSEA_FRAG / DECK_FRAG)
    const hsGeo = new THREE.RingGeometry(30, 3700, 40, 6); hsGeo.rotateX(-Math.PI / 2);   // a ring: no vertex under the lens (a fan's apex there lies in the plane of a level camera and its sectors came out as flat blocks); the 30 m hole is 73 degrees and more below level wherever this sea is drawn
    const highSea = new THREE.Mesh(hsGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: HSEA_VERT, fragmentShader: HSEA_FRAG, transparent: true, depthWrite: false, fog: false }));
    highSea.position.set(60, 3.4, 548); highSea.renderOrder = 1.2; highSea.frustumCulled = false; highSea.name = 'sea-from-height'; scene.add(highSea);
    const dkP = [], dkL = [], dkI = [], DSEG = 28;
    [55, 135, 250].forEach((y, k) => {                                                     // lowest first: drawn back to front from above
      const base = dkP.length / 3; dkP.push(0, y, 0); dkL.push(k);
      for (let i = 0; i < DSEG; i++) { const a = i / DSEG * Math.PI * 2; dkP.push(Math.cos(a) * 1500, y, Math.sin(a) * 1500); dkL.push(k); }
      for (let i = 0; i < DSEG; i++) dkI.push(base, base + 1 + (i + 1) % DSEG, base + 1 + i);
    });
    const dkGeo = new THREE.BufferGeometry(); dkGeo.setAttribute('position', new THREE.Float32BufferAttribute(dkP, 3)); dkGeo.setAttribute('aLayer', new THREE.Float32BufferAttribute(dkL, 1)); dkGeo.setIndex(dkI);
    const decks = new THREE.Mesh(dkGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: DECK_VERT, fragmentShader: DECK_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, fog: false }));
    decks.position.set(60, 0, 548); decks.renderOrder = 1.5; decks.frustumCulled = false; decks.name = 'haze-decks'; scene.add(decks);
    const plP = [], plI = [], plX = [];
    for (let k = 0; k < 6; k++) { plP.push(-1, 3.7, -1, 1, 3.7, -1, -1, 3.7, 1, 1, 3.7, 1); plX.push(k, k, k, k); plI.push(k * 4, k * 4 + 2, k * 4 + 1, k * 4 + 1, k * 4 + 2, k * 4 + 3); }
    const plGeo = new THREE.BufferGeometry(); plGeo.setAttribute('position', new THREE.Float32BufferAttribute(plP, 3)); plGeo.setAttribute('aIdx', new THREE.Float32BufferAttribute(plX, 1)); plGeo.setIndex(plI);
    const poolMesh = new THREE.Mesh(plGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: POOL_VERT, fragmentShader: POOL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    poolMesh.renderOrder = 1.3; poolMesh.frustumCulled = false; poolMesh.name = 'pools-of-light'; scene.add(poolMesh);
    const poolTips = ['trunk', 'dive0', 'dive1', 'dive2'].map((n) => hero.branches.find((b) => b.name === n) || null), poolP = V3();
    await ctx.yield();

    // ---- g. the sea's own growths: splash crowns, ring-and-crater decals, the breaker, spray, petrels, mist, lamps
    const NCR = Math.round(340 * detail * density), cip = [[], []], cpr = [[], []];      // [far, beside the camera line]
    for (let i = 0; i < NCR; i++) {
      const z = lerp(345, 120, r2()), off = (r2() < 0.5 ? -1 : 1) * (2 + 58 * Math.pow(r2(), 1.7)), x = pathX(z) + off, k = Math.abs(off) < 8 ? 1 : 0;
      cip[k].push(x, seaY(x, z) - 0.04, z);
      cpr[k].push(r2.range(0.28, 0.62) * (Math.abs(off) < 12 ? 1.15 : 1), r2(), r2.range(0.11, 0.26), r2());
      if (i % 80 === 79) await ctx.yield();
    }
    const crownMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG, side: THREE.DoubleSide, fog: false });
    for (let k = 0; k < 2; k++) {
      const crg = crownGeometry(k === 1), n = cpr[k].length / 4;
      crg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(cip[k]), 3)); crg.setAttribute('iParm', new THREE.InstancedBufferAttribute(new Float32Array(cpr[k]), 4));
      crg.instanceCount = n; crg.boundingSphere = new THREE.Sphere(V3(40, 0, 230), 400);
      const crowns = new THREE.Mesh(crg, crownMat);
      crowns.frustumCulled = false; crowns.name = k ? 'splash-crowns-near' : 'splash-crowns'; scene.add(crowns);
      await ctx.yield();
    }

    // decals: rings walking outward from where a drop has just landed, laid on the swell's own slope (own stream: r3)
    const r3 = r2.fork('decals'), NDC = Math.round(3600 * detail * density), dSlope = new Float32Array(NDC * 2), dPos = new Float32Array(NDC * 3), dPar = new Float32Array(NDC * 4);
    for (let i = 0; i < NDC; i++) {
      const z = lerp(350, 118, r3()), off = (r3() < 0.5 ? -1 : 1) * (1.2 + 46 * Math.pow(r3(), 1.6)), x = pathX(z) + off, h = seaY(x, z);
      dPos[i * 3] = x; dPos[i * 3 + 1] = h + 0.07; dPos[i * 3 + 2] = z;
      dSlope[i * 2] = clamp((seaY(x + 0.5, z) - h) * 2, -0.9, 0.9); dSlope[i * 2 + 1] = clamp((seaY(x, z + 0.5) - h) * 2, -0.9, 0.9);
      dPar[i * 4] = r3.range(0.22, 0.6) * (Math.abs(off) < 10 ? 1.3 : 1); dPar[i * 4 + 1] = r3(); dPar[i * 4 + 2] = r3.range(0.1, 0.24); dPar[i * 4 + 3] = r3();
      if (i % 60 === 59) await ctx.yield();
    }
    const decalGeo = quadInstances(NDC, (i, ip, pr) => { for (let k = 0; k < 3; k++) ip[i * 3 + k] = dPos[i * 3 + k]; for (let k = 0; k < 4; k++) pr[i * 4 + k] = dPar[i * 4 + k]; });
    decalGeo.setAttribute('iSlope', new THREE.InstancedBufferAttribute(dSlope, 2));
    const decals = new THREE.Mesh(decalGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: DECAL_VERT, fragmentShader: DECAL_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true,
      side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }));
    decals.frustumCulled = false; decals.renderOrder = 1.1; decals.name = 'ring-decals'; scene.add(decals);
    await ctx.yield();

    // the breaker (built in world xz; see BREAK_LINE). Its lip must hang over the camera line and nothing else may
    // come near it: the envelope keeps 2.5 m, checked here with the path, and the mesh is lifted if a seed's swell says so.
    const brk = await breakerGeometry(ctx.noise, ctx, makeRng(hashSeed('the-leader-fingers:' + (ctx.seed ?? 1))), path);
    await ctx.yield();
    const breaker = new THREE.Mesh(brk.geometry, new THREE.ShaderMaterial({ uniforms: { ...U, uLip: { value: 0 }, uOut: { value: brk.out } }, vertexShader: BREAK_VERT, fragmentShader: BREAK_FRAG, side: THREE.DoubleSide, fog: false }));
    breaker.position.set(0, clamp(seaY(10, 224) * 0.5, -0.2, 0.8), 0); breaker.frustumCulled = false; breaker.name = 'breaker'; scene.add(breaker);
    // THE LIP is one folded sheet of blended glass (underside, rim, top side), drawn without depth. Left to itself its
    // far top side was painted over the near roof of the barrel and ended in a hard seam across it. So (1) its solid
    // part (thin < 0.8, alpha 0.97 and more) lays down depth first, colour off, 2 cm nearer than the body (the lip
    // itself is drawn 4 cm nearer, so it always passes its own depth): only the nearest solid sheet shows; (2) the
    // top side is drawn first and the underside over it, which is the right order from inside the barrel.
    const lipMat = new THREE.ShaderMaterial({ uniforms: { ...U, uLip: { value: 1 }, uOut: { value: 0 } }, vertexShader: BREAK_VERT, fragmentShader: BREAK_FRAG, side: THREE.DoubleSide, transparent: true, forceSinglePass: true, depthWrite: false, fog: false });
    const lipDepthMat = new THREE.ShaderMaterial({ uniforms: { ...U, uLip: { value: 0.5 } }, vertexShader: BREAK_VERT, fragmentShader: LIPZ_FRAG, side: THREE.DoubleSide, transparent: true, forceSinglePass: true, colorWrite: false, fog: false });
    for (const [geo, mat, order, name] of [[brk.lip, lipDepthMat, 0.69, 'breaker-lip-depth'], [brk.lipTop, lipMat, 0.695, 'breaker-lip-top'], [brk.lipUnder, lipMat, 0.7, 'breaker-lip']]) {
      const m = new THREE.Mesh(geo, mat); m.position.copy(breaker.position); m.renderOrder = order; m.frustumCulled = false; m.name = name; scene.add(m);
    }
    const fingerMesh = new THREE.Mesh(brk.fingers, new THREE.ShaderMaterial({ uniforms: U, vertexShader: FINGER_VERT, fragmentShader: FINGER_FRAG, transparent: true, depthWrite: false, fog: false }));
    fingerMesh.position.copy(breaker.position); fingerMesh.renderOrder = 0.75; fingerMesh.frustumCulled = false; fingerMesh.name = 'lip-fingers'; scene.add(fingerMesh);
    await ctx.yield();
    // LESSER BREAKERS (an amendment of the brief, by the designers' ruling): the one crest of 60 m that arches over
    // the route is the largest of a few. Up to three lesser crests break on the same sea, the same stopped wave at a
    // quarter to a half of its size (15 to 30 m long; body and lip, the lip creeping as the great one's does, a
    // few beads of spray hanging over each). THEY STAND ON THE SEA'S OWN CREST LINES AT PLACES ON THE SEA ROUND THE
    // SCHOONER, FROM A SEEDED DRAW (their own stream, 'the-leader-lesser'): 24 places, each on a bearing from her
    // drawn over the whole circle and at a distance from her drawn evenly over the area (the square root of a draw)
    // between 90 m (LR0: the box that keeps a crest off her, |z| under 40 and x from -60 to 40 with half the longest
    // crest more, reaches 85 m from her foremast) and 300 m (LR1: there the smallest of them, 15 m long and 2.7 m
    // from foot to lip, still stands half a degree tall and three degrees long to an eye 6 m over the sea, a torn
    // white line with a back under it; further off it is one more cap), with a length and a small yaw each; the
    // dice of all 24 are drawn before any is tested. Each is moved along Z onto the top of the swell it fell on,
    // and the first three are kept that
    //   - stand on a real crest (1.2 m or more over the mean sea),
    //   - keep 12 m from the flight line, the whole of their footprint,
    //   - do not stand between the skim and the schooner or between the skim and the ring (the wedge from every
    //     place of the skim line, 2.5 m apart, to the hull's length and to the ring's width, with 4 m to spare),
    //   - keep 45 m from the great crest and from each other, and off the schooner.
    {
      const lr2 = makeRng(hashSeed('the-leader-lesser:' + (ctx.seed ?? 1))), cand = [], kept = [], LR0 = 90, LR1 = 300;
      for (let i = 0; i < 24; i++) { const a = lr2() * Math.PI * 2, r = Math.sqrt(lerp(LR0 * LR0, LR1 * LR1, lr2())); cand.push({ x: ship.position.x + Math.sin(a) * r, z: ship.position.z - Math.cos(a) * r, L: lr2.range(15, 30), yaw: lr2.range(-0.15, 0.15), sd: lr2() }); }
      const sight = (x0, x1, z, tx0, tx1, tz) => {                                           // does the crest x0..x1 at z stand in the wedge from the skim line to tx0..tx1 at tz?
        for (let ez = 290; ez >= 165; ez -= 2.5) {
          if (z >= ez || z <= tz) continue;
          const ex = pathX(ez), f = (ez - z) / (ez - tz);
          if (x1 + 4 > lerp(ex, tx0, f) && x0 - 4 < lerp(ex, tx1, f)) return true;
        }
        return false;
      };
      for (const c of cand) {
        if (kept.length >= 3) break;
        let z = c.z, h = -1e9;
        for (let dz = -45; dz <= 45; dz += 1) { const hh = seaY(c.x, c.z + dz); if (hh > h) { h = hh; z = c.z + dz; } }
        const sc = c.L / 60, x0 = c.x - c.L / 2, x1 = c.x + c.L / 2;
        let ok = h + seaDrop >= 1.2 && !(Math.abs(z) < 40 && x1 > -60 && x0 < 40);
        for (let x = x0; ok && x <= x1; x += 2.5) for (let dz = -18 * sc; dz <= 13 * sc + 0.01; dz += 15.5 * sc) if (path.distanceTo(x, 3, z + dz) < 12) ok = false;
        if (ok && (sight(x0, x1, z, -32, 12, 0) || sight(x0, x1, z, 26, 40, 70))) ok = false;
        for (const q of BREAK_LINE) if (ok && Math.hypot(q[0] - c.x, q[1] - z) < 45 + c.L / 2) ok = false;
        for (const k of kept) if (ok && Math.hypot(k.x - c.x, k.z - z) < 45 + (k.L + c.L) / 2) ok = false;
        if (ok) kept.push({ x: c.x, z, L: c.L, yaw: c.yaw, sc, sd: c.sd });
        await ctx.yield();
      }
      const NLS = 70, lsI = new Float32Array(kept.length * NLS * 3), lsP = new Float32Array(kept.length * NLS * 4);
      kept.forEach((k, n) => {
        // (the mesh's own crest lies along x at z 224 of its own space: that point is set on the place)
        const cy = Math.cos(k.yaw), sy = Math.sin(k.yaw), px = k.x - k.sc * sy * 224, pz = k.z - k.sc * cy * 224, py = clamp(seaY(k.x, k.z) * 0.5, -0.8, 0.4) - 0.4;
        for (const [geo, mat, order, name] of [[brk.far.body, breaker.material, 0, 'lesser-breaker'], [brk.far.lipTop, lipMat, 0.695, 'lesser-lip-top'], [brk.far.lipUnder, lipMat, 0.7, 'lesser-lip']]) {
          const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.y = k.yaw; m.scale.setScalar(k.sc); m.renderOrder = order; m.frustumCulled = false; m.name = name; scene.add(m);
        }
        for (let i = 0; i < NLS; i++) {                                                      // its hanging spray: beads over the crest and off its lip (the lip's side: +Z of its own space)
          const o = (n * NLS + i), along = lr2.range(-0.5, 0.5) * k.L, off = Math.abs(lr2.gauss()) * 5 * k.sc + 1;
          lsI[o * 3] = k.x + along * cy + off * sy; lsI[o * 3 + 1] = py + lr2.range(4.5, 12.5) * k.sc; lsI[o * 3 + 2] = k.z - along * sy + off * cy;
          lsP[o * 4] = lr2.range(0.03, 0.11); lsP[o * 4 + 1] = lr2(); lsP[o * 4 + 2] = lr2.range(0.05, 0.22); lsP[o * 4 + 3] = 0;
        }
      });
      if (kept.length) {
        const lsGeo = quadInstances(kept.length * NLS, (i, ip, pr) => { for (let k = 0; k < 3; k++) ip[i * 3 + k] = lsI[i * 3 + k]; for (let k = 0; k < 4; k++) pr[i * 4 + k] = lsP[i * 4 + k]; });
        const ls = new THREE.Mesh(lsGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, fog: false }));
        ls.frustumCulled = false; ls.renderOrder = 9; ls.name = 'lesser-spray'; scene.add(ls);
      }
    }
    await ctx.yield();

    // petrels: seven, strung so that one is abeam every 0.6 s from T 21.7. They patter west at 4.5 m/s while we pass
    // at 11 (the licence the brief states: slow things creep faster than the true clock), so a bird hangs big at the
    // right of the frame instead of flicking by. Drawn 2.2 times life size, as the drops are.
    const BSC = 2.2, VB = 4.5, TB0 = 20.5, TB1 = 27.6;
    const birdX = [1.2, 1.9, 1.4, 2.2, 1.0, 1.7, 1.3], birdY = [-0.05, -0.3, 0.15, -0.25, 0.1, -0.2, 0.2], birds = [], cp = V3();
    for (let i = 0; i < 7; i++) {
      const Ti = 21.6 + 0.6 * i; path.pointAt(uOf(Ti), cp);
      const z0 = cp.z + VB * (Ti - TB0);
      birds.push({ z0, dx: birdX[i], y: cp.y + birdY[i], p: V3(pathX(z0) + birdX[i], cp.y + birdY[i], z0), yaw: Math.PI / 2 + r2.range(0.35, 0.85), roll: r2.range(-0.25, 0.1), ph: r2() * 6.28 });   // crabbing across our bow: the flank and the raised wings show
    }
    // spray: each petrel's own halo, the beads drifting off the breaker's lip, and the constellation over the route
    const NSP = Math.round(2200 * detail), F = {};
    // THE WEDGE BETWEEN THE SKIM LINE AND THE SCHOONER IS KEPT CLEAR OF BEADS, the whole of it: from every place on
    // the skim before the lip (every 4 m of it) the schooner shows clean in the gap beside the curl
    const eyes = [];
    for (let z = 290; z >= 226; z -= 4) { const e = [pathX(z), 6, z]; eyes.push({ e, az: Math.atan2(-10 - e[0], e[2]), el: Math.atan2(12 - e[1], Math.hypot(-10 - e[0], e[2])) }); }
    const sprayFill = (i, ip, pr) => {
      let x, y, z, rad, bird = 0; const k = r2();
      if (i < 84) { const b = birds[i % 7], a = r2() * 6.28, r = r2.range(0.25, 1.0); x = b.p.x + Math.cos(a) * r; y = b.p.y - 0.15 - r2() * 0.7; z = b.p.z + Math.sin(a) * r; rad = r2.range(0.012, 0.03); bird = 1; }
      else if (k < 0.55) {                                                                   // the constellation: bright beads hung in the air ahead of and under the lip, over the route
        x = r2.range(29, 49); y = r2.range(6.6, 14); z = r2.range(190, 234); rad = r2.range(0.06, 0.2);
        if (path.distanceTo(x, y, z) < 1.5) y += 3.2;
      } else {                                                                               // drift off the whole lip
        breakerFrame(brk.line, r2.range(0.08, 0.9), F); const d = 5 + Math.abs(r2.gauss()) * 4.5;
        x = F.cx + F.nx * d; z = F.cz + F.nz * d; y = r2.range(4.5, 12.5) * Math.max(F.env, 0.4); rad = r2.range(0.03, 0.11);
        if (path.distanceTo(x, y, z) < 1.5) y += 3.2;
      }
      if (!bird) {                                                                          // no bead between the skim line and the schooner
        for (const w of eyes) {
          const bx = x - w.e[0], by = y - w.e[1], bz = z - w.e[2], bl = Math.hypot(bx, by, bz) || 1, az = Math.atan2(bx, -bz) - w.az, el = Math.asin(by / bl) - w.el;
          if (bz < 0 && Math.abs(az) < 9 * DEG && el > -4 * DEG && el < 9 * DEG) rad = 0;
        }
      }
      ip[i * 3] = x; ip[i * 3 + 1] = y; ip[i * 3 + 2] = z;
      pr[i * 4] = rad; pr[i * 4 + 1] = r2(); pr[i * 4 + 2] = bird ? 0.03 : r2.range(0.05, 0.22); pr[i * 4 + 3] = bird;
    };
    const spIp = new Float32Array(NSP * 3), spPr = new Float32Array(NSP * 4);
    for (let i = 0; i < NSP; i++) { sprayFill(i, spIp, spPr); if (i % 150 === 149) await ctx.yield(); }      // (the same draws in the same order, in slices)
    const sprayGeo = quadInstances(NSP, (i, ip, pr) => { for (let k = 0; k < 3; k++) ip[i * 3 + k] = spIp[i * 3 + k]; for (let k = 0; k < 4; k++) pr[i * 4 + k] = spPr[i * 4 + k]; });
    const spray = new THREE.Mesh(sprayGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, fog: false }));
    spray.frustumCulled = false; spray.renderOrder = 9; spray.name = 'spray'; scene.add(spray);
    await ctx.yield();

    const bp = await birdParts(ctx); await ctx.yield();
    const birdMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, vertexColors: true, side: THREE.DoubleSide, fog: false });
    const bodies = new THREE.InstancedMesh(bp.body, birdMat, 7), wings = new THREE.InstancedMesh(bp.wing, birdMat, 14);
    const bm = new THREE.Matrix4(), bq = new THREE.Quaternion(), wq = new THREE.Quaternion(), eul = new THREE.Euler(), one = V3(BSC, BSC, BSC), flip = V3(BSC, BSC, -BSC);
    birds.forEach((b) => { b.q = new THREE.Quaternion().setFromEuler(eul.set(b.roll, b.yaw, 0.12, 'YXZ')); });
    const setBirds = (T, time) => {
      const dz = -VB * (clamp(T, TB0, TB1) - TB0); U.uBirdDz.value = dz;
      for (let i = 0; i < 7; i++) {
        const b = birds[i], phi = 0.6 + 0.21 * T / 40 + 0.035 * Math.sin(time * 1.3 + b.ph), z = b.z0 + dz;   // wings held high, mid-patter
        b.p.set(pathX(z) + b.dx, b.y + 0.04 * Math.sin(time * 0.7 + b.ph), z);
        bodies.setMatrixAt(i, bm.compose(b.p, b.q, one));
        wq.setFromEuler(eul.set(-phi, 0, 0, 'XYZ')); bq.copy(b.q).multiply(wq); wings.setMatrixAt(i * 2, bm.compose(b.p, bq, one));
        wq.setFromEuler(eul.set(phi, 0, 0, 'XYZ')); bq.copy(b.q).multiply(wq); wings.setMatrixAt(i * 2 + 1, bm.compose(b.p, bq, flip));
      }
      bodies.instanceMatrix.needsUpdate = true; wings.instanceMatrix.needsUpdate = true;
    };
    setBirds(22, 0);
    bodies.frustumCulled = false; wings.frustumCulled = false; bodies.name = 'petrels'; wings.name = 'petrel-wings'; scene.add(bodies, wings);
    await ctx.yield();

    const rigging = new THREE.Mesh(shipGeo.rigging, new THREE.ShaderMaterial({ uniforms: U, vertexShader: RIG_VERT, fragmentShader: RIG_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    rigging.position.copy(ship.position); rigging.rotation.copy(ship.rotation); rigging.renderOrder = 1.9; rigging.frustumCulled = false; rigging.name = 'rigging'; scene.add(rigging);

    // the schooner on the water (SKIRT_FRAG): a sheet on the sea round her and a ribbon round her waterline
    {
      const kp = [], kq = [], ki = [], y0 = ship.position.y, NS = 20, ring = [];
      kp.push(-130, y0 + 0.2, -24, 28, y0 + 0.2, -24, -130, y0 + 0.2, 34, 28, y0 + 0.2, 34); kq.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); ki.push(0, 2, 1, 1, 2, 3);
      for (let sd = 1; sd >= -1; sd -= 2) for (let i = 0; i <= NS; i++) {                      // starboard stern -> bow, then port bow -> stern
        const sf = sd > 0 ? i / NS : 1 - i / NS, sh = hullSheer(sf), kd = -3.2 * (1 - sf * sf * sf * sf), wl = hullBeam(sf) * Math.sqrt(Math.max(1 - Math.pow(Math.min(1, sh / (sh - kd)), 2 / 0.7), 0)) + 0.14;
        ring.push(L2W(-30 + 40 * sf, 0, sd * wl));
      }
      ring.push(ring[0].clone());
      let arc = 0;
      for (let i = 0; i < ring.length; i++) {
        if (i > 0) arc += Math.hypot(ring[i].x - ring[i - 1].x, ring[i].z - ring[i - 1].z);
        kp.push(ring[i].x, y0 - 0.5, ring[i].z, ring[i].x, y0 + 1.3, ring[i].z); kq.push(arc, 0, 1, arc, 1, 1);
        if (i > 0) { const v = 4 + (i - 1) * 2; ki.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); }
      }
      const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3)); kg.setAttribute('aQ', new THREE.Float32BufferAttribute(kq, 3)); kg.setIndex(ki);
      const skirtMesh = new THREE.Mesh(kg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKIRT_VERT, fragmentShader: SKIRT_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, fog: false }));
      skirtMesh.renderOrder = 1.15; skirtMesh.frustumCulled = false; skirtMesh.name = 'schooner-on-the-water'; scene.add(skirtMesh);
    }
    await ctx.yield();

    const mist = fx.makeMist({ rng: rng.fork('mist'), count: Math.round(60 * detail), area: [320, 5, 320], center: [0, 1.2, 0], size: [45, 90], color: '#' + cloudC.clone().lerp(C('#8a94b0'), 0.35).lerp(fogC, 0.5).getHexString(), opacity: 0.07, drift: [0.25, 0, 0.5], follow: true, time: U.uTime });
    scene.add(mist.object);
    await ctx.yield();
    const gp = [], gc = [], gs = [], amber = '#FFB45A';
    for (let i = 0; i < 8; i++) { const x = -24 + i * 4, s = (x + 30) / 40; gp.push(L2W(x, 1.25, hullBeam(s) * 0.99 + 0.1)); gc.push(amber); gs.push(0.8); }
    gp.push(L2W(-4, 5.4, 1.2), L2W(-19, 5.3, 1.2)); gc.push(amber, amber); gs.push(1.5, 1.5);
    gp.push(L2W(3, 4.8, 3.3), L2W(3, 4.8, -3.3)); gc.push('#46ffa0', '#ff4634'); gs.push(0.7, 0.7);
    gp.push(L2W(0, 22, 3.2), L2W(0, 22, -3.2), L2W(-8.6, 16.8, 0)); gc.push('#9a78ff', '#9a78ff', '#9a78ff'); gs.push(1.1, 1.1, 1.1);   // St Elmo's brushes
    gp.push(L2W(0, 28.2, 0), L2W(-11, 28.7, 0), L2W(-22, 26.2, 0)); gc.push(amber, amber, amber); gs.push(2, 2, 2);            // a riding lamp under each masthead: they stand over the breaker's lip when the hull is behind it
    const glows = fx.makeGlows({ positions: gp, colors: gc, sizes: gs, size: 1.7, intensity: 2.4, flicker: 0.18, fogAmount: 0.4, time: U.uTime });
    scene.add(glows.object);
    const lampBase = gs.slice(), LAMPS = [0, 1, 2, 3, 4, 5, 6, 7, 15, 16, 17];                                           // the portholes (0-7) and the riding lamps (15-17) stand larger the further off they are seen: one smooth law of the distance to the ship, a third larger at 150 m, toward half as large again far away (see update)
    await ctx.yield();

    // ---- h. lights (3, fixed for the whole flight), fog and post
    const hemi = new THREE.HemisphereLight(cloudC.clone().multiplyScalar(2.2), seaC.clone().multiplyScalar(1.5), M.hemi);
    const rim = new THREE.DirectionalLight(C(M.rim), 1.5 * M.amt); rim.position.set(0, 14, -100);
    const key = new THREE.PointLight(C('#cdbcff'), 0, 0, 1);
    scene.add(hemi, rim, key);
    const post = { exposure: M.exposure, bloom: { strength: 0.4, radius: 0.6, threshold: 1.0 },
      grade: { saturation: M.sat, contrast: 1.06, tint: '#f6f6f4', shadowTint: '#06141a', vignette: 0.34, grain: 0.03, aberration: 0 } };

    // ---- i. per frame
    const camP = V3(60, 690, 548), vel = V3(), camProxy = { position: camP }, size = new THREE.Vector2();
    function update(dt, time, camera, u) {
      const uu = u || 0, T = Tof(uu);
      camera.getWorldPosition(camP);
      hero.setTime(T);
      path.tangentAt(uu, vel).multiplyScalar(pace(uu) * path.length / 40); hero.setVelocity(vel);
      hero.update(dt, time, camera);
      U.uTime.value = time; U.uT.value = T; U.uStroke.value = hero.stroke; U.uKey.value.copy(hero.key.position); U.uKeyI.value = hero.key.intensity; U.uCam.value.copy(camP);
      U.uGlowR.value = 120 + 5 * T;
      // THE SEA'S TONE GOES BY THE LENS'S HEIGHT ABOVE IT (the brief: black sea under us from the cloud base, coming up
      // pocked and grey as we come down): seen through the murk that hangs under the base, one scale height of 90 m
      const seaK = lerp(0.4, 1, 1 - Math.exp(-Math.max(700 - camP.y, 0) / 90));
      U.uFarSea.value.copy(farSeaC).multiplyScalar(seaK); U.uSeaAmb.value = seaK;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uResY.value = size.y; }
      dome.position.copy(camP);
      // the sea from height hands over to the kit ocean through the pull-out; the decks ride with the camera
      U.uHigh.value = smoothstep(40, 100, camP.y); U.uPoolK.value = smoothstep(14, 40, camP.y);
      highSea.position.set(camP.x, 3.4, camP.z); decks.position.set(camP.x, 0, camP.z);
      for (let k = 0; k < 4; k++) {
        const b = poolTips[k];
        if (b && T > b.birth[0]) { hero.tipAt(b, T, poolP); pools[k].set(poolP.x, poolP.y, poolP.z, smoothstep(0, 0.6, T - b.birth[0]) * (b.stall < 900 ? 1 - smoothstep(b.end + 0.5, b.end + 3, T) : 1)); }
        else pools[k].w = 0;
      }
      pools[4].w = 0;
      pools[5].set(hero.key.position.x, hero.key.position.y, hero.key.position.z, 0.6 * hero.key.intensity);
      hero.tipAt('ship', T, poolP); U.uShipLit.value.set(lerp(-8, poolP.x, 0.22), lerp(0, poolP.z, 0.22), 0.1 * smoothstep(4.5, 9.5, T));
      // the leader's light on the kit ocean: the key, the ship limb's tip (from the pull-out on), the low limb's tip, the trunk's
      seaL[0].set(hero.key.position.x, hero.key.position.y, hero.key.position.z, 0.7 * hero.key.intensity);
      seaL[1].set(poolP.x, poolP.y, poolP.z, 1.5 * smoothstep(13, 17, T));                 // (the ship limb is the one light ahead of the pull-out and the skim: the sea between us and the schooner is lit by it)
      seaL[2].copy(pools[3]); seaL[3].copy(pools[0]); seaL[3].w *= 0.6;
      seaLitU.uLStroke.value = hero.stroke;
      ocean.update(dt, time, camProxy);
      // BY DISTANCE TO THE SHIP ALONE, one smooth law with no edge in it: a lamp stands in its own glare, the more the
      // further off it is seen (a third larger at 150 m, half as large again far away); close to, it is its true size
      const lk = 1 + 0.5 * (1 - Math.exp(-camP.distanceTo(SHIP_AT) / 140));
      for (let j = 0; j < LAMPS.length; j++) glows.setSize(LAMPS[j], lampBase[LAMPS[j]] * lk);
      mist.update(dt, time, camera); glows.update(dt, time, camera);
      key.position.copy(hero.key.position); key.intensity = 70 * hero.key.intensity * (1 + 0.6 * hero.stroke);
      hemi.intensity = M.hemi * (1 + 0.6 * hero.stroke);
      setBirds(T, time);
    }

    return {
      scene, path, duration: 40, pace,
      camera: { fov: 62, near: 0.3, far: 5000, lookAhead: 22, sway: 0.5, bank: 0.1 },   // all but level: the dive's pictures have a horizon
      pois,
      portal: { shape: 'circle', radius: 7, color: '#F1E79A', glow: 1, revealDistance: 320, tilt: true },
      post, ride: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
